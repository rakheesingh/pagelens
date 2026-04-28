# PageLens backend

FastAPI service that the PageLens Chrome extension calls to analyse collected
metrics with an LLM.

This directory currently contains a **scaffold only** — endpoints return stub
responses. The MVP work is happening on the extension side first.

## Planned routes

| Method | Path           | Purpose                                       |
| ------ | -------------- | --------------------------------------------- |
| POST   | `/v1/analyze`  | Run an LLM analysis over a metrics payload.   |
| GET    | `/v1/prompts`  | Return the active versioned prompt set.       |
| GET    | `/v1/health`   | Liveness probe.                               |
| POST   | `/v1/feedback` | Capture thumbs up / thumbs down for analyses. |

## Layout

```
backend/
├── pyproject.toml
├── README.md
└── app/
    ├── main.py                 # FastAPI app factory
    ├── config.py               # Pydantic settings
    ├── core/
    │   └── security.py         # X-API-Key dependency (stub)
    ├── models/
    │   └── schemas.py          # Pydantic request/response models
    ├── services/
    │   ├── cache.py            # Redis cache stub
    │   ├── llm.py              # LLM provider router stub
    │   └── rate_limit.py       # Redis rate limiter stub
    └── routers/
        ├── analyze.py
        ├── feedback.py
        ├── health.py
        └── prompts.py
```

## Local dev (once implemented)

```bash
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```
