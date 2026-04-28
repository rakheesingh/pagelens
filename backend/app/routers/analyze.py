from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.security import require_api_key
from app.models.schemas import AnalyzeRequest, AnalyzeResponse
from app.services import cache, llm

router = APIRouter(tags=["analyze"])


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    payload: AnalyzeRequest,
    _api_key: str = Depends(require_api_key),
) -> AnalyzeResponse:
    metrics_dict = payload.metrics.model_dump(by_alias=True)
    key = cache.hash_metrics_payload(metrics_dict)
    cached = await cache.get_cached(key)
    if cached is not None:
        return AnalyzeResponse(**{**cached, "cached": True})

    raw = await llm.analyse(metrics_dict)
    await cache.set_cached(key, raw, _ttl_seconds=60 * 60)
    return AnalyzeResponse(**raw)
