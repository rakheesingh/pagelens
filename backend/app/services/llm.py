"""LLM provider router (stub).

The eventual implementation will:

* Pick a provider based on settings (Grok, OpenAI, Anthropic, ...).
* Format the metrics payload with the active prompt template.
* Stream the response back to the caller.
"""

from __future__ import annotations

from typing import Any


async def analyse(_metrics: dict[str, Any]) -> dict[str, Any]:
    return {
        "summary": "Stub analysis — wire up an LLM provider in app.services.llm.",
        "issues": [],
        "suggestions": [],
        "cached": False,
        "model": None,
    }
