from typing import Optional
from uuid import UUID

from app.db.session import supabase
from app.schemas.application import ApplicationCreate, ApplicationUpdate

TABLE = "job_applications"


def create_application(data: ApplicationCreate) -> dict:
    payload = data.model_dump()
    payload["applied_date"] = payload["applied_date"].isoformat()
    payload["status"] = payload["status"].value
    result = supabase.table(TABLE).insert(payload).execute()
    return result.data[0]


def list_applications(status: Optional[str] = None, company: Optional[str] = None) -> list[dict]:
    query = supabase.table(TABLE).select("*").order("created_at", desc=True)
    if status:
        query = query.eq("status", status)
    if company:
        query = query.ilike("company", f"%{company}%")
    return query.execute().data


def get_application(id: UUID) -> dict | None:
    result = supabase.table(TABLE).select("*").eq("id", str(id)).execute()
    return result.data[0] if result.data else None


def update_application(id: UUID, data: ApplicationUpdate) -> dict | None:
    payload = {k: v for k, v in data.model_dump().items() if v is not None}
    if "applied_date" in payload:
        payload["applied_date"] = payload["applied_date"].isoformat()
    if "status" in payload:
        payload["status"] = payload["status"].value
    result = supabase.table(TABLE).update(payload).eq("id", str(id)).execute()
    return result.data[0] if result.data else None


def delete_application(id: UUID) -> bool:
    result = supabase.table(TABLE).delete().eq("id", str(id)).execute()
    return len(result.data) > 0
