# PageLens

A Chrome extension that surfaces performance, memory, and rendering issues for any web app — backed by an optional LLM-powered analysis API.

## Architecture

```
┌─────────────────────────────────────────┐
│  Chrome Extension (WXT + React + TS)     │
│                                          │
│  • Collects metrics (web-vitals, memory) │
│  • UI: popup, side panel, options       │
│  • Settings: demo mode | BYOK           │
└──────────────────┬──────────────────────┘
                   │ HTTPS  +  X-API-Key header
                   ▼
┌─────────────────────────────────────────┐
│  FastAPI Backend (Fly.io)                │
│                                          │
│  POST /v1/analyze                        │
│  GET  /v1/prompts                        │
│  GET  /v1/health                         │
│  POST /v1/feedback                       │
└─────────────────────────────────────────┘
```

## Repo layout

```
pagelens/
├── frontend/   # WXT + React + TypeScript Chrome extension (MVP)
└── backend/    # FastAPI service (scaffold only for now)
```

## MVP status

- [x] Chrome extension that collects Core Web Vitals, memory, FPS, long tasks, resources
- [x] Popup with quick summary + on/off toggle
- [x] Side panel with detailed dashboard
- [x] Options page with demo/BYOK toggle
- [ ] Backend `/v1/analyze` route (scaffold only)
- [ ] LLM provider routing
- [ ] Cache + rate limit + telemetry

## Getting started

### Frontend (extension)

```bash
cd frontend
npm install
npm run dev          # opens Chrome with the extension auto-loaded
npm run build        # production build to .output/chrome-mv3
```

After `npm run build`, load `frontend/.output/chrome-mv3` as an unpacked extension at `chrome://extensions`.

### Backend (scaffold)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload
```
