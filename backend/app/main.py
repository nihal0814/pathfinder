from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .algorithms import search_path
from .schemas import SearchRequest

app = FastAPI(title="PathFinder AI API", version="1.0.0", description="BFS, DFS, and A* pathfinding visualizer API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "PathFinder AI"}

@app.post("/api/search")
def run_search(request: SearchRequest):
    try:
        return search_path(request.rows, request.cols, request.walls, request.start, request.end, request.algorithm.lower())
    except (ValueError, IndexError, TypeError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
