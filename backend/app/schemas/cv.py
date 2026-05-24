from pydantic import BaseModel


class AskRequest(BaseModel):
    question: str
    k: int = 4


class AskResponse(BaseModel):
    question: str
    answer: str
