from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from backend.core.database_engine import acquire_db_session
from backend.data_models.schemas import (
    UserRegistrationPayload,
    UserLoginPayload,
    AuthTokenPayload,
    UserProfileData
)
from backend.data_models.models import UserAccount
from backend.utilities.authentication import (
    encrypt_password,
    validate_credentials,
    craft_access_token,
    extract_current_user
)

auth_api = APIRouter(prefix="/auth", tags=["Authentication"])


@auth_api.post("/register", response_model=UserProfileData, status_code=status.HTTP_201_CREATED)
async def create_account(
    payload: UserRegistrationPayload,
    session: AsyncSession = Depends(acquire_db_session)
):
    email_stmt = select(UserAccount).where(UserAccount.email_address == payload.email_address)
    email_result = await session.execute(email_stmt)
    if email_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    username_stmt = select(UserAccount).where(UserAccount.username == payload.username)
    username_result = await session.execute(username_stmt)
    if username_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username unavailable"
        )
    
    account = UserAccount(
        email_address=payload.email_address,
        username=payload.username,
        hashed_password=encrypt_password(payload.password),
        full_name=payload.full_name,
        is_active_user=True
    )
    
    session.add(account)
    await session.commit()
    await session.refresh(account)
    
    return account


@auth_api.post("/login", response_model=AuthTokenPayload)
async def authenticate(
    payload: UserLoginPayload,
    session: AsyncSession = Depends(acquire_db_session)
):
    account = await validate_credentials(payload.username, payload.password, session)
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    account.last_login_timestamp = datetime.now(timezone.utc)
    await session.commit()
    
    token = craft_access_token(payload={"sub": account.username})
    
    return AuthTokenPayload(access_token=token, token_type="bearer")


@auth_api.get("/profile", response_model=UserProfileData)
async def fetch_profile(account: UserAccount = Depends(extract_current_user)):
    return account
