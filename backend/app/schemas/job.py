from pydantic import BaseModel


class JobMatchRequest(BaseModel):
    job_description: str
    company: str = ""
    role: str = ""


class JobMatchResponse(BaseModel):
    company: str
    role: str
    fit_analysis: str
    gaps: str
    cover_letter: str
