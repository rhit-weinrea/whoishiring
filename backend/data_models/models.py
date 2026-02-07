from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.core.database_engine import BaseEntity


class UserAccount(BaseEntity):
    __tablename__ = "user_accounts"
    
    user_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email_address = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active_user = Column(Boolean, default=True, nullable=False)
    created_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    last_login_timestamp = Column(DateTime(timezone=True))
    
    preferences_rel = relationship("UserJobPreferences", back_populates="owner_rel", cascade="all, delete-orphan", uselist=False)
    bookmarked_jobs_rel = relationship("SavedJob", back_populates="owner_rel", cascade="all, delete-orphan")


class JobPosting(BaseEntity):
    __tablename__ = "job_postings"
    
    job_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    hn_item_id = Column(String(50), unique=True, index=True, nullable=False)
    posting_title = Column(String(500))
    company_name = Column(String(300), index=True)
    job_location = Column(String(300))
    remote_status = Column(String(100), index=True)
    tech_stack = Column(ARRAY(String))
    job_description = Column(Text)
    salary_range = Column(String(200))
    application_url = Column(String(1000))
    parsed_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    source_thread_id = Column(String(50), index=True)
    raw_content = Column(Text)
    
    bookmarked_by_rel = relationship("SavedJob", back_populates="posting_rel", cascade="all, delete-orphan")


class UserJobPreferences(BaseEntity):
    __tablename__ = "user_job_preferences"
    
    preference_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_account_id = Column(Integer, ForeignKey("user_accounts.user_id", ondelete="CASCADE"), nullable=False, unique=True)
    preferred_locations = Column(ARRAY(String))
    preferred_tech_stack = Column(ARRAY(String))
    remote_only = Column(Boolean, default=False)
    visa_sponsorship_only = Column(Boolean, default=False)
    min_salary = Column(Integer)
    max_salary = Column(Integer)
    keywords_to_match = Column(ARRAY(String))
    keywords_to_exclude = Column(ARRAY(String))
    notification_enabled = Column(Boolean, default=True)
    last_notified_timestamp = Column(DateTime(timezone=True))
    updated_timestamp = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    owner_rel = relationship("UserAccount", back_populates="preferences_rel")


class SavedJob(BaseEntity):
    __tablename__ = "saved_jobs"
    
    saved_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_account_id = Column(Integer, ForeignKey("user_accounts.user_id", ondelete="CASCADE"), nullable=False, index=True)
    job_posting_id = Column(Integer, ForeignKey("job_postings.job_id", ondelete="CASCADE"), nullable=False, index=True)
    saved_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text)
    applied_status = Column(Boolean, default=False)
    
    owner_rel = relationship("UserAccount", back_populates="bookmarked_jobs_rel")
    posting_rel = relationship("JobPosting", back_populates="bookmarked_by_rel")
