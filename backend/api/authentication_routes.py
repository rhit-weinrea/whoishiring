import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from backend.core.database_engine import acquire_db_session
from backend.data_models.schemas import (
    UserRegistrationPayload,
    UserLoginPayload,
    AuthTokenPayload,
    UserProfileData,
    UpdateEmailPayload
)
from backend.data_models.models import UserAccount
from backend.utilities.authentication import (
    encrypt_password,
    validate_credentials,
    craft_access_token,
    extract_current_user
)

logger = logging.getLogger(__name__)

auth_api = APIRouter(prefix="/auth", tags=["Authentication"])


@auth_api.post("/register", response_model=AuthTokenPayload, status_code=status.HTTP_201_CREATED)
async def create_account(
    payload: UserRegistrationPayload,
    session: AsyncSession = Depends(acquire_db_session)
):
    logger.info("Registration attempt: username=%s, email=%s", payload.username, payload.email_address)

    email_stmt = select(UserAccount).where(UserAccount.email_address == payload.email_address)
    email_result = await session.execute(email_stmt)
    if email_result.scalar_one_or_none():
        logger.warning("Registration failed: email already registered (email=%s)", payload.email_address)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    username_stmt = select(UserAccount).where(UserAccount.username == payload.username)
    username_result = await session.execute(username_stmt)
    if username_result.scalar_one_or_none():
        logger.warning("Registration failed: username already taken (username=%s)", payload.username)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username unavailable"
        )

    account = UserAccount(
        email_address=payload.email_address,
        username=payload.username,
        hashed_password=encrypt_password(payload.password),
        is_active_user=True
    )

    session.add(account)
    await session.commit()
    await session.refresh(account)

    logger.info("Registration successful: username=%s, user_id=%d", account.username, account.user_id)
    token = craft_access_token(payload={"sub": account.username})
    return AuthTokenPayload(access_token=token, token_type="bearer")


@auth_api.post("/login", response_model=AuthTokenPayload)
async def authenticate(
    payload: UserLoginPayload,
    session: AsyncSession = Depends(acquire_db_session)
):
    logger.info("Login attempt: username=%s", payload.username)
    account = await validate_credentials(payload.username, payload.password, session)

    if not account:
        logger.warning("Login failed: invalid credentials for username=%s", payload.username)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    account.last_login_timestamp = datetime.now(timezone.utc)
    await session.commit()

    logger.info("Login successful: username=%s, user_id=%d", account.username, account.user_id)
    token = craft_access_token(payload={"sub": account.username})

    return AuthTokenPayload(access_token=token, token_type="bearer")


@auth_api.get("/profile", response_model=UserProfileData)
async def fetch_profile(account: UserAccount = Depends(extract_current_user)):
    return account


@auth_api.put("/email", response_model=UserProfileData)
async def update_email(
    payload: UpdateEmailPayload,
    session: AsyncSession = Depends(acquire_db_session),
    account: UserAccount = Depends(extract_current_user)
):
    if payload.email_address == account.email_address:
        return account

    existing_stmt = select(UserAccount).where(UserAccount.email_address == payload.email_address)
    existing_result = await session.execute(existing_stmt)
    if existing_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    account.email_address = payload.email_address
    await session.commit()
    await session.refresh(account)

    return account
