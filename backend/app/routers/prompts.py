from __future__ import annotations

from fastapi import APIRouter

from app.models.schemas import PromptBundle

router = APIRouter(tags=["prompts"])


@router.get("/prompts", response_model=PromptBundle)
async def get_prompts() -> PromptBundle:
    return PromptBundle(
        version="0.1.0",
        system="You are PageLens, an expert front-end performance reviewer.",
        user_template="Analyze the following metrics and surface the top 3 issues:\n\n{metrics}",
    )
