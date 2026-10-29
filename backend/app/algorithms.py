"""From-scratch grid pathfinding algorithms for PathFinder AI."""
from __future__ import annotations

from collections import deque
from heapq import heappop, heappush
from time import perf_counter
from typing import Any

Cell = tuple[int, int]
DIRECTIONS: tuple[Cell, ...] = ((-1, 0), (0, 1), (1, 0), (0, -1))


def _neighbors(cell: Cell, rows: int, cols: int, walls: set[Cell]):
    r, c = cell
    for dr, dc in DIRECTIONS:
        nxt = (r + dr, c + dc)
        if 0 <= nxt[0] < rows and 0 <= nxt[1] < cols and nxt not in walls:
            yield nxt


def _reconstruct_path(parent: dict[Cell, Cell | None], end: Cell) -> list[list[int]]:
    if end not in parent:
        return []
    path: list[Cell] = []
    current: Cell | None = end
    while current is not None:
        path.append(current)
        current = parent[current]
    path.reverse()
    return [[r, c] for r, c in path]


def search_path(rows: int, cols: int, walls_raw: list[list[int]], start_raw: list[int], end_raw: list[int], algorithm: str) -> dict[str, Any]:
    """Run BFS, DFS, or A* and return deterministic visualization data."""
    if rows < 2 or cols < 2 or rows > 80 or cols > 80:
        raise ValueError("Grid dimensions must be between 2 and 80.")
    start: Cell = (int(start_raw[0]), int(start_raw[1]))
    end: Cell = (int(end_raw[0]), int(end_raw[1]))
    for name, cell in (("start", start), ("end", end)):
        if not (0 <= cell[0] < rows and 0 <= cell[1] < cols):
            raise ValueError(f"{name.title()} position is outside the grid.")
    walls = {(int(p[0]), int(p[1])) for p in walls_raw}
    if start in walls or end in walls:
        raise ValueError("Start and end cells cannot be walls.")
    if algorithm not in {"bfs", "dfs", "astar"}:
        raise ValueError("Algorithm must be bfs, dfs, or astar.")

    began = perf_counter()
    parent: dict[Cell, Cell | None] = {start: None}
    visited_order: list[list[int]] = []
    found = False

    if algorithm == "bfs":
        frontier = deque([start])
        discovered = {start}
        while frontier:
            current = frontier.popleft()
            visited_order.append([current[0], current[1]])
            if current == end:
                found = True
                break
            for nxt in _neighbors(current, rows, cols, walls):
                if nxt not in discovered:
                    discovered.add(nxt)
                    parent[nxt] = current
                    frontier.append(nxt)
    elif algorithm == "dfs":
        visited = {start}
        visited_order.append([start[0], start[1]])
        if start == end:
            found = True
        else:
            # Keep a frame for each active branch so cross-links do not mark
            # a cell visited before DFS actually enters it.
            frontier: list[tuple[Cell, int, list[Cell]]] = [
                (start, 0, list(_neighbors(start, rows, cols, walls)))
            ]
            while frontier and not found:
                current, next_index, neighbors = frontier[-1]
                if next_index >= len(neighbors):
                    frontier.pop()
                    continue
                frontier[-1] = (current, next_index + 1, neighbors)
                nxt = neighbors[next_index]
                if nxt in visited:
                    continue
                visited.add(nxt)
                parent[nxt] = current
                visited_order.append([nxt[0], nxt[1]])
                if nxt == end:
                    found = True
                    break
                frontier.append((nxt, 0, list(_neighbors(nxt, rows, cols, walls))))
    else:
        def heuristic(cell: Cell) -> int:
            return abs(cell[0] - end[0]) + abs(cell[1] - end[1])
        counter = 0
        frontier_heap: list[tuple[int, int, Cell]] = []
        heappush(frontier_heap, (heuristic(start), counter, start))
        g_score: dict[Cell, int] = {start: 0}
        closed: set[Cell] = set()
        while frontier_heap:
            _, _, current = heappop(frontier_heap)
            if current in closed:
                continue
            closed.add(current)
            visited_order.append([current[0], current[1]])
            if current == end:
                found = True
                break
            for nxt in _neighbors(current, rows, cols, walls):
                tentative_g = g_score[current] + 1
                if tentative_g < g_score.get(nxt, 10**9):
                    g_score[nxt] = tentative_g
                    parent[nxt] = current
                    counter += 1
                    f_score = tentative_g + heuristic(nxt)
                    heappush(frontier_heap, (f_score, counter, nxt))

    elapsed_ms = (perf_counter() - began) * 1000
    path = _reconstruct_path(parent, end) if found else []
    return {
        "algorithm": algorithm,
        "found": found,
        "visited_order": visited_order,
        "path": path,
        "visited_count": len(visited_order),
        "path_length": max(0, len(path) - 1),
        "execution_time_ms": round(elapsed_ms, 4),
        "message": "Path found." if found else "No path exists for this maze.",
    }
