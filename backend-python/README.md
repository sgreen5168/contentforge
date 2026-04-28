# ContentForge — FastAPI Backend (Python)

A drop-in Python alternative to the Node.js/Express backend.  
Same API contract — swap it in without changing a line of the frontend.

## Quick Start

```bash
# 1. Create a virtual environment
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Add your API key
cp .env.example .env
# Edit .env → ANTHROPIC_API_KEY=sk-ant-yourkey

# 4. Run
uvicorn main:app --reload --port 3001
# → http://localhost:3001
```

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/api/generate` | Generate social posts with Claude |
| POST | `/api/brand/learn` | Analyse a post for brand voice |

Interactive API docs available at: **http://localhost:3001/docs**

## Deployment

### Railway / Render
Set env vars `ANTHROPIC_API_KEY` and `FRONTEND_URL` in dashboard, then:
```
uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Docker
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```
