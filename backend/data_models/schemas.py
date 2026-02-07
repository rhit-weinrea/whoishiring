from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


class UserRegistrationPayload(BaseModel):
    email_address: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=8)


class UserLoginPayload(BaseModel):
    username: str
    password: str


class AuthTokenPayload(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserProfileData(BaseModel):
    user_id: int
    email_address: str
    username: str
    is_active_user: bool
    created_timestamp: datetime
    last_login_timestamp: Optional[datetime]
    
    class Config:
        from_attributes = True


class PreferencesPayload(BaseModel):
    preferred_locations: Optional[List[str]] = None
    preferred_tech_stack: Optional[List[str]] = None
    remote_only: bool = False
    visa_sponsorship_only: bool = False
    min_salary: Optional[int] = None
    max_salary: Optional[int] = None
    keywords_to_match: Optional[List[str]] = None
    keywords_to_exclude: Optional[List[str]] = None
    notification_enabled: bool = True
    last_notified_timestamp: Optional[datetime] = None


class PreferencesData(PreferencesPayload):
    preference_id: int
    user_account_id: int
    updated_timestamp: datetime
    
    class Config:
        from_attributes = True


class JobData(BaseModel):
    job_id: int
    hn_item_id: str
    posting_title: Optional[str]
    company_name: Optional[str]
    job_location: Optional[str]
    remote_status: Optional[str]
    tech_stack: Optional[List[str]]
    job_description: Optional[str]
    salary_range: Optional[str]
    application_url: Optional[str]
    parsed_timestamp: datetime
    source_thread_id: Optional[str]
    
    class Config:
        from_attributes = True


class BookmarkJobPayload(BaseModel):
    job_posting_id: int
    notes: Optional[str] = None


class ModifyBookmarkPayload(BaseModel):
    notes: Optional[str] = None
    applied_status: Optional[bool] = None


class BookmarkedJobData(BaseModel):
    saved_id: int
    user_account_id: int
    job_posting_id: int
    saved_timestamp: datetime
    notes: Optional[str]
    applied_status: bool
    posting_rel: JobData
    
    class Config:
        from_attributes = True


class ScraperPayload(BaseModel):
    admin_api_key: str
    force_refresh: bool = False
    parse: bool = True
    who_is_hiring_id: str | None = None
    max_items: int | None = None


class ScraperResultData(BaseModel):
    status: str
    message: str
    jobs_scraped: int
    thread_id: Optional[str] = None
