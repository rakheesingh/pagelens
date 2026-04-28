"""Auth helpers (stub).

The real implementation will distinguish demo keys (rate limited per IP) from
BYOK keys (rate limited per key) and surface a tenant identifier downstream.
"""

from __future__ import annotations

from fastapi import Header, HTTPException, status


async def require_api_key(x_api_key: str | None = Header(default=None)) -> str:
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-API-Key header",
        )
    return x_api_key
