import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.core.database_engine import acquire_db_session
from backend.data_models.models import UserAccount
from backend.core.settings import settings


# ------------------------------------------------------------------
# Password hashing (bcrypt-safe, no length limit)
# ------------------------------------------------------------------

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _normalize_password(password: str) -> bytes:
    return hashlib.sha256(password.encode("utf-8")).digest()


def encrypt_password(password: str) -> str:
    normalized = _normalize_password(password)
    return pwd_context.hash(normalized)


def verify_password(password: str, hashed_password: str) -> bool:
    normalized = _normalize_password(password)
    return pwd_context.verify(normalized, hashed_password)


# ------------------------------------------------------------------
# Authentication helpers
# ------------------------------------------------------------------

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def validate_credentials(
    username: str,
    password: str,
    session: AsyncSession
) -> Optional[UserAccount]:
    stmt = select(UserAccount).where(UserAccount.username == username)
    result = await session.execute(stmt)
    account = result.scalar_one_or_none()

    if not account:
        return None

    if not verify_password(password, account.hashed_password):
        return None

    return account


# ------------------------------------------------------------------
# JWT handling
# ------------------------------------------------------------------

def craft_access_token(payload: dict) -> str:
    to_encode = payload.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )


async def extract_current_user(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(acquire_db_session)
) -> UserAccount:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        username: str | None = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    stmt = select(UserAccount).where(UserAccount.username == username)
    result = await session.execute(stmt)
    account = result.scalar_one_or_none()

    if not account:
        raise credentials_exception

    return account
