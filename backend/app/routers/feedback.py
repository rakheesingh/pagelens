from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.security import require_api_key
from app.models.schemas import FeedbackRequest

router = APIRouter(tags=["feedback"])


@router.post("/feedback")
async def submit_feedback(
    payload: FeedbackRequest,
    _api_key: str = Depends(require_api_key),
) -> dict[str, str]:
    _ = payload
    return {"status": "queued"}
