from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from backend.core.configuration import fetch_environment_config
from backend.core.database_engine import acquire_db_session
from backend.data_models.models import UserAccount

config = fetch_environment_config()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer()


def encrypt_password(raw_password: str) -> str:
    return pwd_context.hash(raw_password)


def check_password(raw_password: str, encrypted: str) -> bool:
    return pwd_context.verify(raw_password, encrypted)


def craft_access_token(payload: dict, expiry: Optional[timedelta] = None) -> str:
    to_encode = payload.copy()
    expire_at = datetime.now(timezone.utc) + (expiry or timedelta(minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire_at})
    return jwt.encode(to_encode, config.SECRET_KEY, algorithm=config.ALGORITHM)


def extract_token_data(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, config.SECRET_KEY, algorithms=[config.ALGORITHM])
    except JWTError:
        return None


async def validate_credentials(username: str, password: str, session: AsyncSession) -> Optional[UserAccount]:
    stmt = select(UserAccount).where(
        or_(UserAccount.username == username, UserAccount.email_address == username)
    )
    result = await session.execute(stmt)
    account = result.scalar_one_or_none()
    
    if not account or not check_password(password, account.hashed_password):
        return None
    return account


async def extract_current_user(
    auth: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    session: AsyncSession = Depends(acquire_db_session)
) -> UserAccount:
    auth_failure = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication failed",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token_data = extract_token_data(auth.credentials)
    if not token_data:
        raise auth_failure
    
    username = token_data.get("sub")
    if not username:
        raise auth_failure
    
    stmt = select(UserAccount).where(UserAccount.username == username)
    result = await session.execute(stmt)
    account = result.scalar_one_or_none()
    
    if not account:
        raise auth_failure
    
    if not account.is_active_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account deactivated"
        )
    
    return account
