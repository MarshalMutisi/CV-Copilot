from datetime import date, datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class ApplicationStatus(str, Enum):
    applied = "applied"
    interview = "interview"
    offer = "offer"
    rejected = "rejected"


class ApplicationCreate(BaseModel):
    company: str
    role: str
    job_url: Optional[str] = None
    status: ApplicationStatus = ApplicationStatus.applied
    match_score: Optional[float] = None
    applied_date: date = date.today()
    notes: Optional[str] = None


class ApplicationUpdate(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    job_url: Optional[str] = None
    status: Optional[ApplicationStatus] = None
    match_score: Optional[float] = None
    applied_date: Optional[date] = None
    notes: Optional[str] = None


class ApplicationResponse(BaseModel):
    id: UUID
    company: str
    role: str
    job_url: Optional[str]
    status: ApplicationStatus
    match_score: Optional[float]
    applied_date: date
    notes: Optional[str]
    created_at: datetime
