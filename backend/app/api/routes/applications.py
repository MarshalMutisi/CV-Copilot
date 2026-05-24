from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.db import crud
from app.schemas.application import ApplicationCreate, ApplicationResponse, ApplicationUpdate

router = APIRouter(prefix="/api/applications", tags=["applications"])


@router.post("/", response_model=ApplicationResponse, status_code=201)
def create(body: ApplicationCreate):
    return crud.create_application(body)


@router.get("/", response_model=list[ApplicationResponse])
def list_all(status: Optional[str] = None, company: Optional[str] = None):
    return crud.list_applications(status=status, company=company)


@router.patch("/{id}", response_model=ApplicationResponse)
def update(id: UUID, body: ApplicationUpdate):
    result = crud.update_application(id, body)
    if not result:
        raise HTTPException(status_code=404, detail="Application not found")
    return result


@router.delete("/{id}", status_code=204)
def delete(id: UUID):
    deleted = crud.delete_application(id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Application not found")
