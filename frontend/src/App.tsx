import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, ArrowDownUp, CircleHelp, Clock3, Footprints, GitCompareArrows, Info, Layers3, MousePointer2, Pause, Play, RotateCcw, Shuffle, SkipForward, Sparkles, Square, Target, Waves } from 'lucide-react';

type Cell = { r: number; c: number };
type Algorithm = 'bfs' | 'dfs' | 'astar';
type Result = { algorithm: Algorithm; found: boolean; visited_order: number[][]; path: number[][]; visited_count: number; path_length: number; execution_time_ms: number; message: string };
const ROWS = 20, COLS = 30;
const START: Cell = { r: 10, c: 4 }, END: Cell = { r: 10, c: 25 };
const key = (r: number, c: number) => `${r},${c}`;
const toCell = (r: number, c: number): Cell => ({ r, c });
const algorithms: { id: Algorithm; title: string; subtitle: string; color: string }[] = [
  { id: 'bfs', title: 'Breadth-First Search', subtitle: 'Queue · Uninformed', color: '#38bdf8' },
  { id: 'dfs', title: 'Depth-First Search', subtitle: 'Stack · Uninformed', color: '#a78bfa' },
  { id: 'astar', title: 'A* Search', subtitle: 'Priority queue · Heuristic', color: '#34d399' },
];

export default function App() {
  const [algorithm, setAlgorithm] = useState<Algorithm>('astar');
  const [start, setStart] = useState<Cell>(START);
  const [end, setEnd] = useState<Cell>(END);
  const [walls, setWalls] = useState<Set<string>>(new Set());
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [path, setPath] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<Result | null>(null);
  const [speed, setSpeed] = useState(18);
  const [isRunning, setIsRunning] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tool, setTool] = useState<'wall' | 'start' | 'end'>('wall');
  const [message, setMessage] = useState('Choose an algorithm, then press Run search.');
  const [showLegend, setShowLegend] = useState(true);
  const [compare, setCompare] = useState<Result[]>([]);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [stepIndex, setStepIndex] = useState(0);
  const timer = useRef<number | null>(null);
  const drag = useRef(false);
  const cells = useMemo(() => Array.from({ length: ROWS * COLS }, (_, i) => ({ r: Math.floor(i / COLS), c: i % COLS })), []);

  useEffect(() => { fetch('http://localhost:8000/api/health').then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(() => setApiStatus('online')).catch(() => setApiStatus('offline')); }, []);
  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current); }, []);

  const clearAnimation = useCallback(() => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null; setIsPlaying(false); setIsRunning(false);
  }, []);
  const clearSearch = useCallback(() => { clearAnimation(); setVisited(new Set()); setPath(new Set()); setResult(null); setCompare([]); setStepIndex(0); setMessage('Maze cleared. Ready for a new search.'); }, [clearAnimation]);

  const runSearch = useCallback(async (selected: Algorithm = algorithm, comparison = false) => {
    clearAnimation(); setVisited(new Set()); setPath(new Set()); setResult(null); setStepIndex(0); setIsRunning(true); setMessage(`Running ${selected.toUpperCase()}…`);
    try {
      const response = await fetch('http://localhost:8000/api/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows: ROWS, cols: COLS, walls: [...walls].map(v => v.split(',').map(Number)), start: [start.r, start.c], end: [end.r, end.c], algorithm: selected }) });
      const data: Result | { detail: string } = await response.json();
      if (!response.ok) throw new Error('detail' in data ? data.detail : 'Search failed');
      const solved = data as Result; setResult(solved); setIsRunning(false);
      if (comparison) { setCompare(prev => [...prev.filter(x => x.algorithm !== solved.algorithm), solved]); setVisited(new Set(solved.visited_order.map(p => key(p[0], p[1])))); setPath(new Set(solved.path.map(p => key(p[0], p[1])))); setStepIndex(solved.visited_order.length); setMessage(`${selected.toUpperCase()}: ${solved.message}`); }
      else { setVisited(new Set()); setPath(new Set()); setStepIndex(0); setMessage(`${selected.toUpperCase()} ready. Press Play to animate exploration.`); setIsPlaying(true); }
    } catch (err) { setIsRunning(false); setIsPlaying(false); setMessage(err instanceof Error ? `${err.message}. Is the backend running on port 8000?` : 'Unable to run search.'); }
  }, [algorithm, walls, start, end, clearAnimation]);

  useEffect(() => {
    if (!isPlaying || !result || isRunning) return;
    if (timer.current) window.clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      setStepIndex(i => {
        const next = Math.min(i + 1, result.visited_order.length);
        setVisited(new Set(result.visited_order.slice(0, next).map(p => key(p[0], p[1]))));
        if (next >= result.visited_order.length) {
          if (timer.current) window.clearInterval(timer.current); timer.current = null; setIsPlaying(false);
          setPath(new Set(result.path.map(p => key(p[0], p[1])))); setMessage(result.found ? `Path found with ${result.path_length} moves.` : 'No path exists for this maze.');
        }
        return next;
      });
    }, Math.max(5, 220 - speed * 10));
    return () => { if (timer.current) window.clearInterval(timer.current); timer.current = null; };
  }, [isPlaying, result, speed, isRunning]);

  const handleCell = (cell: Cell) => {
    if (tool === 'start') { if (key(cell.r, cell.c) === key(end.r, end.c) || walls.has(key(cell.r, cell.c))) return; setStart(cell); clearSearch(); return; }
    if (tool === 'end') { if (key(cell.r, cell.c) === key(start.r, start.c) || walls.has(key(cell.r, cell.c))) return; setEnd(cell); clearSearch(); return; }
    if (key(cell.r, cell.c) === key(start.r, start.c) || key(cell.r, cell.c) === key(end.r, end.c)) return;
    setWalls(prev => { const next = new Set(prev); const k = key(cell.r, cell.c); if (next.has(k)) next.delete(k); else next.add(k); return next; });
    setVisited(new Set()); setPath(new Set()); setResult(null); setCompare([]); setMessage('Maze edited. Run search to explore the updated maze.');
  };
  const generateMaze = () => {
    clearSearch(); const next = new Set<string>();
    for (const cell of cells) if (Math.random() < 0.27 && key(cell.r, cell.c) !== key(start.r, start.c) && key(cell.r, cell.c) !== key(end.r, end.c)) next.add(key(cell.r, cell.c));
    // Keep a guaranteed corridor so a generated maze is not trivially unsolvable.
    for (let c = Math.min(start.c, end.c); c <= Math.max(start.c, end.c); c++) next.delete(key(start.r, c));
    setWalls(next); setMessage('Random maze generated. Start a search when ready.');
  };
  const clearWalls = () => { setWalls(new Set()); clearSearch(); };
  const compareAll = async () => { clearAnimation(); setCompare([]); setMessage('Comparing all algorithms…'); const output: Result[] = []; for (const a of ['bfs', 'dfs', 'astar'] as Algorithm[]) { try { const response = await fetch('http://localhost:8000/api/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows: ROWS, cols: COLS, walls: [...walls].map(v => v.split(',').map(Number)), start: [start.r, start.c], end: [end.r, end.c], algorithm: a }) }); if (!response.ok) throw new Error('Backend search failed'); output.push(await response.json()); } catch { setMessage('Could not compare algorithms. Check that the backend is running.'); return; } } setCompare(output); const chosen = output.find(x => x.algorithm === algorithm) || output[2]; setResult(chosen); setVisited(new Set(chosen.visited_order.map(p => key(p[0], p[1])))); setPath(new Set(chosen.path.map(p => key(p[0], p[1])))); setStepIndex(chosen.visited_order.length); setMessage('Comparison complete. Select an algorithm to inspect its metrics.'); };

  const currentAlgo = algorithms.find(a => a.id === algorithm)!;
  return <div className="app-shell">
    <header className="topbar"><div className="brand"><div className="brand-mark"><Waves size={23}/></div><div><div className="brand-name">PathFinder <span>AI</span></div><div className="brand-caption">INTELLIGENT PATHFINDING LAB</div></div></div><div className="topbar-right"><span className={`api-pill ${apiStatus}`}><span className="status-dot"/>{apiStatus === 'online' ? 'API connected' : apiStatus === 'offline' ? 'API offline' : 'Connecting'}</span><button className="icon-btn" title="About PathFinder AI" onClick={() => setShowLegend(v => !v)}><CircleHelp size={18}/></button></div></header>
    <main className="main-layout"><section className="intro"><div><div className="eyebrow"><Sparkles size={14}/> SEARCH ALGORITHMS, VISUALIZED</div><h1>Find the <span>best path.</span></h1><p>Explore how intelligent search algorithms navigate a maze, one node at a time.</p></div><div className="intro-chip"><Activity size={16}/><span>3 algorithms · 1 maze · different strategies</span></div></section>
    <section className="workspace"><aside className="control-panel panel"><div className="panel-heading"><div><span className="section-kicker">CONFIGURATION</span><h2>Search controls</h2></div><span className="step-count">01 / 03</span></div>
      <div className="field-label">CHOOSE ALGORITHM</div><div className="algorithm-list">{algorithms.map(a => <button key={a.id} className={`algorithm-option ${algorithm === a.id ? 'selected' : ''}`} onClick={() => { setAlgorithm(a.id); const found = compare.find(x => x.algorithm === a.id); if (found) { setResult(found); setVisited(new Set(found.visited_order.map(p => key(p[0], p[1])))); setPath(new Set(found.path.map(p => key(p[0], p[1])))); setMessage(`${a.title} comparison result selected.`); } else { clearSearch(); } }}><span className="algo-dot" style={{ background: a.color }}/><span className="algo-copy"><strong>{a.title}</strong><small>{a.subtitle}</small></span>{algorithm === a.id && <span className="selected-check">✓</span>}</button>)}</div>
      <div className="field-label tools-label">MAZE EDITOR</div><div className="tool-row"><button className={`tool-btn ${tool === 'wall' ? 'active' : ''}`} onClick={() => setTool('wall')}><Square size={16}/> Draw walls</button><button className={`tool-btn ${tool === 'start' ? 'active' : ''}`} onClick={() => setTool('start')}><MousePointer2 size={16}/> Move start</button><button className={`tool-btn ${tool === 'end' ? 'active' : ''}`} onClick={() => setTool('end')}><Target size={16}/> Move end</button></div>
      <div className="button-row"><button className="secondary-btn" onClick={generateMaze}><Shuffle size={15}/> Random maze</button><button className="secondary-btn" onClick={clearWalls}><RotateCcw size={15}/> Clear walls</button></div>
      <div className="speed-control"><div className="speed-title"><span>Animation speed</span><strong>{speed < 8 ? 'Slow' : speed < 16 ? 'Normal' : 'Fast'}</strong></div><input aria-label="Animation speed" type="range" min="1" max="20" value={speed} onChange={e => setSpeed(Number(e.target.value))}/><div className="range-labels"><span>Slow</span><span>Fast</span></div></div>
      <div className="primary-actions"><button className="run-btn" disabled={isRunning || apiStatus === 'offline'} onClick={() => runSearch()}>{isRunning ? <span className="spinner"/> : <Play size={17} fill="currentColor"/>}{isRunning ? 'Running…' : 'Run search'}</button><button className="compare-btn" disabled={isRunning || apiStatus === 'offline'} onClick={compareAll}><GitCompareArrows size={17}/> Compare all</button></div>
      <div className="keyboard-hint"><Info size={14}/><span>Click or drag cells to draw walls. Choose a tool to move start/end.</span></div>
    </aside>
    <section className="visual-column"><div className="panel grid-panel"><div className="grid-header"><div><span className="section-kicker">LIVE SIMULATION</span><h2>Maze canvas <span className="dimension-label">{ROWS} × {COLS}</span></h2></div><div className="grid-actions"><button className="mini-btn" onClick={() => { if (result) { setVisited(new Set(result.visited_order.slice(0, Math.min(stepIndex + 1, result.visited_order.length)).map(p => key(p[0], p[1])))); setStepIndex(i => Math.min(i + 1, result.visited_order.length)); setIsPlaying(false); } }} disabled={!result || stepIndex >= result.visited_order.length}><SkipForward size={15}/><span>Step</span></button><button className="mini-btn" onClick={() => { if (!result) { runSearch(); return; } if (isPlaying) { setIsPlaying(false); } else if (stepIndex >= result.visited_order.length) { setVisited(new Set()); setPath(new Set()); setStepIndex(0); setIsPlaying(true); } else { setIsPlaying(true); } }} disabled={isRunning}>{isPlaying ? <Pause size={15}/> : <Play size={15}/>}<span>{isPlaying ? 'Pause' : 'Play'}</span></button></div></div>
      <div className="grid-wrap" onMouseLeave={() => { drag.current = false; }}><div className="maze-grid" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }} onMouseUp={() => { drag.current = false; }}>{cells.map(cell => { const k = key(cell.r, cell.c); const isStart = cell.r === start.r && cell.c === start.c; const isEnd = cell.r === end.r && cell.c === end.c; const isWall = walls.has(k); const isPath = path.has(k) && !isStart && !isEnd; const isVisited = visited.has(k) && !isWall && !isStart && !isEnd && !isPath; return <button key={k} aria-label={`Row ${cell.r + 1}, column ${cell.c + 1}${isWall ? ', wall' : ''}`} className={`cell ${isWall ? 'wall' : ''} ${isVisited ? 'visited' : ''} ${isPath ? 'path' : ''} ${isStart ? 'start-cell' : ''} ${isEnd ? 'end-cell' : ''}`} onMouseDown={e => { e.preventDefault(); drag.current = true; handleCell(cell); }} onMouseEnter={() => { if (drag.current && tool === 'wall') handleCell(cell); }} />; })}</div></div>
      {showLegend && <div className="legend"><span><i className="legend-start"/> Start</span><span><i className="legend-end"/> Destination</span><span><i className="legend-wall"/> Wall</span><span><i className="legend-visited"/> Explored</span><span><i className="legend-path"/> Final path</span></div>}
      <div className="simulation-footer"><span className="sim-message"><span className="message-dot"/>{message}</span><span className="step-indicator">{result ? `${Math.min(stepIndex, result.visited_order.length)} / ${result.visited_order.length} nodes` : 'Awaiting search'}</span></div></div>
      <div className="metrics-grid"><Metric icon={<Layers3 size={17}/>} label="Nodes explored" value={result ? result.visited_count.toLocaleString() : '—'} sub="Unique cells visited"/><Metric icon={<Footprints size={17}/>} label="Path length" value={result?.found ? `${result.path_length} moves` : result ? 'No path' : '—'} sub="Moves from start to goal"/><Metric icon={<Clock3 size={17}/>} label="Execution time" value={result ? `${result.execution_time_ms.toFixed(3)} ms` : '—'} sub="Algorithm only, no animation"/></div>
    </section></section>
    {compare.length > 0 && <section className="panel comparison-panel"><div className="panel-heading"><div><span className="section-kicker">BENCHMARK</span><h2>Algorithm comparison</h2></div><span className="compare-note">Same maze · same start and goal</span></div><div className="table-scroll"><table><thead><tr><th>Algorithm</th><th>Path found</th><th>Nodes explored</th><th>Path length</th><th>Runtime</th></tr></thead><tbody>{compare.map(row => <tr key={row.algorithm} className={row.algorithm === algorithm ? 'current-row' : ''}><td><button className="table-algo" onClick={() => { setAlgorithm(row.algorithm); setResult(row); setVisited(new Set(row.visited_order.map(p => key(p[0], p[1])))); setPath(new Set(row.path.map(p => key(p[0], p[1])))); setStepIndex(row.visited_order.length); }}><span className="algo-dot" style={{ background: algorithms.find(a => a.id === row.algorithm)?.color }}/>{algorithms.find(a => a.id === row.algorithm)?.title}</button></td><td><span className={row.found ? 'result-yes' : 'result-no'}>{row.found ? 'Yes' : 'No'}</span></td><td>{row.visited_count}</td><td>{row.found ? row.path_length : '—'}</td><td>{row.execution_time_ms.toFixed(3)} ms</td></tr>)}</tbody></table></div><p className="comparison-footnote">Runtime varies by machine and load. BFS and A* return shortest paths on this unweighted grid; DFS returns the first path it discovers, which may be longer.</p></section>}
    <section className="learning-row"><div className="learning-card"><div className="learning-icon" style={{ color: currentAlgo.color }}><Sparkles size={18}/></div><div><span className="section-kicker">HOW IT WORKS</span><h3>{currentAlgo.title}</h3><p>{algorithm === 'bfs' ? 'BFS explores the maze level by level using a queue. In an unweighted grid, it guarantees the fewest number of moves to the goal.' : algorithm === 'dfs' ? 'DFS follows one branch as far as possible using a stack, then backtracks. It can find a route quickly, but that route is not guaranteed to be shortest.' : 'A* prioritizes cells using f(n) = g(n) + h(n). Here, g is the path cost so far and h is Manhattan distance to the goal.'}</p></div></div><div className="complexity-card"><div className="complexity-title"><ArrowDownUp size={16}/> COMPLEXITY SNAPSHOT</div><div className="complexity-lines"><span>Time <strong>{algorithm === 'bfs' || algorithm === 'dfs' ? 'O(V + E)' : 'O(E log V)*'}</strong></span><span>Space <strong>{algorithm === 'bfs' || algorithm === 'dfs' ? 'O(V)' : 'O(V)'}</strong></span></div><small>*A* complexity depends on the heuristic and graph; V = cells, E = valid neighbor links.</small></div></section>
    <footer><span>PathFinder AI <span className="footer-sep">·</span> Built for learning search algorithms</span><span>React + FastAPI <span className="footer-sep">·</span> Algorithms implemented from scratch</span></footer>
    </main></div>;
}
function Metric({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) { return <div className="metric-card"><div className="metric-icon">{icon}</div><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-sub">{sub}</div></div>; }
