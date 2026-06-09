# 3psLCCA Web Backend

FastAPI backend for the web app. It imports `three_ps_lcca_core` only and does not import the desktop GUI package or PySide/PyQt modules.

## Local dev

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Then run the Vite frontend from the repo root:

```bash
npm run dev
```

Set `VITE_LCCA_API_URL` if the backend is not running at `http://localhost:8000`.

## Tests

```bash
cd backend
source .venv/bin/activate
pytest -q
```
