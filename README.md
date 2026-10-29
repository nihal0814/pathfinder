# PathFinder AI — Intelligent Pathfinding Visualizer

An interactive learning application for comparing **Breadth-First Search (BFS)**, **Depth-First Search (DFS)**, and **A* Search (A*)** on the same editable grid maze. The algorithms are implemented from scratch in Python; React animates the returned search trace.

## Features

- Interactive 20 × 30 grid: draw/remove walls and move start and goal cells.
- Random maze generation and clear-walls control.
- BFS, DFS, and A* with step-by-step animation and adjustable speed.
- Compare all algorithms on the same maze: explored nodes, path length, and algorithm-only runtime.
- Educational notes and complexity snapshot.
- FastAPI docs and unit tests.
- **No Docker required.**

## Requirements

- Python 3.10 or newer
- Node.js 20 or newer (and npm)
- Internet access for initial npm package installation and Google Fonts (optional; font fallback is configured)

## Run locally on Windows

Open two terminals in the extracted `pathfinder-ai` folder.

### Terminal 1 — Backend

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

If PowerShell blocks virtual environment activation, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in that terminal, then activate again. Alternatively use `.venv\Scripts\python.exe -m pip install -r requirements.txt` and `.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8001` without activating.

### Terminal 2 — Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. Keep both terminals running. The backend status at the top should say **API connected**.

## Run tests

From the project root, install backend requirements first, then run:

```powershell
py -m unittest discover -s tests -v
```

## How to use

1. Select BFS, DFS, or A*.
2. Choose **Draw walls** and click/drag over cells. Choose **Move start** or **Move end** to relocate endpoints.
3. Press **Run search**, then use Play/Pause and Step to explore the search trace.
4. Choose **Compare all** to run each algorithm on the same maze. Select a row to inspect that algorithm's path and metrics.
5. Use **Random maze** to create a new layout; it preserves a clear horizontal corridor through the start row so a route remains available.

## API

- `GET http://localhost:8001/api/health`
- `POST http://localhost:8001/api/search`
- Interactive API docs: `http://localhost:8001/docs`

Example request body:

```json
{
  "rows": 20,
  "cols": 30,
  "walls": [[9, 8], [9, 9]],
  "start": [10, 4],
  "end": [10, 25],
  "algorithm": "astar"
}
```

## Algorithm notes

- **BFS** uses a queue and finds a shortest path on an unweighted grid.
- **DFS** uses a stack and finds a route if one exists, but does not guarantee the shortest route.
- A* uses `f(n) = g(n) + h(n)` with Manhattan distance `h`; with unit-cost four-directional movement, this heuristic is admissible and consistent, so A* finds a shortest path.
- The displayed runtime measures the backend algorithm computation only, not network time or animation.
- Runtime is very small and can vary between runs and machines; use it as an observation, not as the only measure of efficiency.

## Project structure

```text
pathfinder-ai/
├── backend/
│   ├── app/
│   │   ├── algorithms.py
│   │   ├── main.py
│   │   └── schemas.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── styles.css
│   ├── index.html
│   └── package.json
├── tests/
│   └── test_algorithms.py
└── README.md
```
