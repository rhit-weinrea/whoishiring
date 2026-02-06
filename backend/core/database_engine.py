from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text
from sqlalchemy.orm import declarative_base
from typing import AsyncGenerator
from .configuration import fetch_environment_config

config = fetch_environment_config()

async_engine = create_async_engine(
    config.DATABASE_URL,
    echo=config.DEBUG_MODE,
    future=True,
    pool_pre_ping=True
)

SessionFactory = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

BaseEntity = declarative_base()


async def acquire_db_session() -> AsyncGenerator[AsyncSession, None]:
    session = SessionFactory()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()


async def setup_database_schema():
    async with async_engine.begin() as conn:
        await conn.run_sync(BaseEntity.metadata.create_all)
        await conn.execute(
            text(
                "ALTER TABLE IF EXISTS user_job_preferences "
                "ADD COLUMN IF NOT EXISTS visa_sponsorship_only BOOLEAN DEFAULT FALSE"
            )
        )
        await conn.execute(
            text(
                "ALTER TABLE IF EXISTS user_job_preferences "
                "ADD COLUMN IF NOT EXISTS last_notified_timestamp TIMESTAMPTZ"
            )
        )


async def teardown_database():
    await async_engine.dispose()
