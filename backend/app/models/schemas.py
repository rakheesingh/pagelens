"""Pydantic models shared across routers (stub).

These mirror the shapes the extension sends in `lib/types.ts`. Keep the two in
sync — they are the wire contract.
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class VitalMetric(BaseModel):
    name: Literal["LCP", "FCP", "CLS", "INP", "TTFB", "FID"]
    value: float
    rating: Literal["good", "needs-improvement", "poor", "unknown"]
    delta: float | None = None
    id: str | None = None
    navigation_type: str | None = Field(default=None, alias="navigationType")


class MemorySnapshot(BaseModel):
    used_js_heap_size: int | None = Field(alias="usedJSHeapSize")
    total_js_heap_size: int | None = Field(alias="totalJSHeapSize")
    js_heap_size_limit: int | None = Field(alias="jsHeapSizeLimit")
    usage_pct: float | None = Field(alias="usagePct")
    captured_at: float = Field(alias="capturedAt")


class PageMetrics(BaseModel):
    """Wire-format payload sent from the extension.

    Use `model_config = {"populate_by_name": True}` so we can keep snake_case
    Python field names while accepting JS camelCase.
    """

    model_config = {"populate_by_name": True}

    url: str
    title: str
    origin: str
    collected_at: int = Field(alias="collectedAt")
    vitals: dict[str, VitalMetric] = Field(default_factory=dict)
    memory: MemorySnapshot
    long_tasks: dict[str, Any] = Field(alias="longTasks")
    resources: dict[str, Any]
    navigation: dict[str, Any] | None = None
    rendering: dict[str, Any]


class AnalyzeRequest(BaseModel):
    metrics: PageMetrics
    user_question: str | None = None


class AnalyzeResponse(BaseModel):
    summary: str
    issues: list[dict[str, Any]] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)
    cached: bool = False
    model: str | None = None


class FeedbackRequest(BaseModel):
    analysis_id: str
    rating: Literal["up", "down"]
    note: str | None = None


class PromptBundle(BaseModel):
    version: str
    system: str
    user_template: str
