"""Redis-backed analysis cache (stub)."""

from __future__ import annotations

from typing import Any


async def get_cached(_key: str) -> dict[str, Any] | None:
    return None


async def set_cached(_key: str, _value: dict[str, Any], _ttl_seconds: int) -> None:
    return None


def hash_metrics_payload(payload: dict[str, Any]) -> str:
    """Stable hash of a metrics payload to use as a cache key.

    Real implementation should canonicalise (sort keys, drop volatile fields
    like timestamps) before hashing.
    """

    import hashlib
    import json

    serialised = json.dumps(payload, sort_keys=True, default=str)
    return hashlib.sha256(serialised.encode("utf-8")).hexdigest()
