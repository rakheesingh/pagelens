"""FastAPI app factory.

The MVP keeps every route as a stub. Real implementations land alongside the
extension's analysis flow.
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import analyze, feedback, health, prompts


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="PageLens API",
        version="0.1.0",
        description="LLM-powered analysis backend for the PageLens extension.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["X-API-Key", "Content-Type"],
    )

    app.include_router(health.router, prefix="/v1")
    app.include_router(analyze.router, prefix="/v1")
    app.include_router(prompts.router, prefix="/v1")
    app.include_router(feedback.router, prefix="/v1")

    return app


app = create_app()
