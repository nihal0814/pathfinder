# PathFinder AI Backend

FastAPI service implementing BFS, DFS, and A* from scratch.

## Windows setup (PowerShell)

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

API docs: http://localhost:8001/docs
Health check: http://localhost:8001/api/health
