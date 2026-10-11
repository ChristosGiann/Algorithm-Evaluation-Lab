import { registerHooks } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { test } from 'node:test';
import assert from 'node:assert/strict';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && context.parentURL
      && existsSync(fileURLToPath(new URL(specifier + '.ts', context.parentURL)))) {
      return next(specifier + '.ts', context);
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.endsWith('.ts')) return {
      format: 'module', shortCircuit: true,
      source: ts.transpileModule(readFileSync(fileURLToPath(url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.ESNext },
      }).outputText,
    };
    return next(url, context);
  },
});

const { neighbours, snapshotInput } = await import('../src/pathfinding/evaluation.ts');
const { reconstructPath } = await import('../src/pathfinding/reconstructPath.ts');
const { bfs } = await import('../src/pathfinding/bfs.ts');
const { dfs } = await import('../src/pathfinding/dfs.ts');
const { dijkstra } = await import('../src/pathfinding/dijkstra.ts');
const { astar, manhattanHeuristic } = await import('../src/pathfinding/astar.ts');
const grid = (rows, cols, walls = [], start = 0, end = rows * cols - 1) => snapshotInput({
  rows, cols, start, end,
  walls: Array.from({ length: rows * cols }, (_, id) => walls.includes(id)),
});

test('neighbours returns cardinal cells in stable order without row wrapping', () => {
  const input = grid(3, 3);
  assert.deepEqual(neighbours(input, 4), [1, 5, 7, 3]);
  assert.deepEqual(neighbours(input, 0), [1, 3]);
  assert.deepEqual(neighbours(input, 2), [5, 1]);
  assert.deepEqual(neighbours(input, 6), [3, 7]);
  assert.deepEqual(neighbours(input, 8), [5, 7]);
  assert.deepEqual(neighbours(input, 3), [0, 4, 6]);
});

test('neighbours excludes walls and invalid origins and returns independent arrays', () => {
  const input = grid(3, 3, [1, 5, 7]);
  assert.deepEqual(neighbours(input, 4), [3]);
  for (const id of [-1, 9, 1.5, NaN, Infinity, 1]) assert.deepEqual(neighbours(input, id), []);
  const result = neighbours(input, 4);
  result.push(8);
  assert.deepEqual(neighbours(input, 4), [3]);
  assert.deepEqual(input, grid(3, 3, [1, 5, 7]));
});

test('neighbours handles single cells, rows and columns', () => {
  assert.deepEqual(neighbours(grid(1, 1), 0), []);
  assert.deepEqual(neighbours(grid(1, 3), 1), [2, 0]);
  assert.deepEqual(neighbours(grid(3, 1), 1), [0, 2]);
  assert.deepEqual(neighbours(grid(1, 3, [1]), 0), []);
});

test('reconstruction follows previous references from end to the exact start', () => {
  const start = Object.freeze({ id: 2, previous: null });
  const middle = Object.freeze({ id: 5, previous: start });
  const end = Object.freeze({ id: 8, previous: middle });
  assert.deepEqual(reconstructPath(start, end), [2, 5, 8]);
  assert.deepEqual(reconstructPath(start, start), [2]);
  const path = reconstructPath(start, end);
  path.reverse();
  assert.deepEqual(reconstructPath(start, end), [2, 5, 8]);
  assert.equal(end.previous, middle);
});

test('reconstruction returns empty for absent, disconnected or cyclic chains', () => {
  const start = { id: 0, previous: null };
  assert.deepEqual(reconstructPath(start, null), []);
  assert.deepEqual(reconstructPath(start, { id: 1, previous: null }), []);
  assert.deepEqual(reconstructPath(start, { id: 0, previous: null }), []);
  const a = { id: 1, previous: null };
  const b = { id: 2, previous: a };
  a.previous = b;
  assert.deepEqual(reconstructPath(start, b), []);
});

test('reconstruction handles long chains without recursive stack growth', () => {
  const start = { id: 0, previous: null };
  let end = start;
  for (let id = 1; id < 10000; id++) end = { id, previous: end };
  assert.deepEqual(reconstructPath(start, end), Array.from({ length: 10000 }, (_, id) => id));
});

test('BFS returns deterministic breadth-first processing and a shortest path', () => {
  const input = grid(3, 3);
  const result = bfs(input);
  assert.deepEqual(result, {
    found: true, visited: [0, 1, 3, 2, 4, 6, 5, 7, 8], path: [0, 1, 2, 5, 8],
  });
  assert.deepEqual(bfs(input), result);
  result.path.reverse();
  assert.deepEqual(bfs(input).path, [0, 1, 2, 5, 8]);
  assert.deepEqual(input, grid(3, 3));
});

test('BFS respects walls and reports no path without inventing a route', () => {
  assert.deepEqual(bfs(grid(3, 3, [1, 4])).path, [0, 3, 6, 7, 8]);
  assert.deepEqual(bfs(grid(3, 3, [1, 3])), { found: false, visited: [0], path: [] });
  assert.deepEqual(bfs(grid(1, 3, [1])), { found: false, visited: [0], path: [] });
});

test('BFS handles same-cell and reversed endpoints through the evaluation contract', async () => {
  const { evaluatePathfinding } = await import('../src/pathfinding/evaluation.ts');
  assert.deepEqual(bfs(grid(1, 1)), { found: true, visited: [0], path: [0] });
  const input = grid(1, 4, [], 3, 0);
  let tick = 0;
  const result = evaluatePathfinding('bfs', input, bfs, () => tick++);
  assert.equal(result.status, 'completed');
  assert.deepEqual(result.path, [3, 2, 1, 0]);
  assert.equal(result.pathLength, 3);
  assert.equal(result.visitedNodeCount, 4);
  assert.equal(result.executionTimeMs, 1);
});

test('BFS matches independent all-pairs distances for every 3x3 wall layout', () => {
  let cases = 0;
  for (let mask = 0; mask < 512; mask++) {
    const walls = Array.from({ length: 9 }, (_, id) => Boolean(mask & (1 << id)));
    const distance = Array.from({ length: 9 }, (_, a) => Array.from({ length: 9 }, (_, b) => {
      if (walls[a] || walls[b]) return Infinity;
      if (a === b) return 0;
      const manhattan = Math.abs(Math.floor(a / 3) - Math.floor(b / 3)) + Math.abs(a % 3 - b % 3);
      return manhattan === 1 ? 1 : Infinity;
    }));
    // Floyd–Warshall oracle: no production neighbours, queue or reconstruction.
    for (let k = 0; k < 9; k++) for (let a = 0; a < 9; a++) for (let b = 0; b < 9; b++) {
      distance[a][b] = Math.min(distance[a][b], distance[a][k] + distance[k][b]);
    }
    for (let start = 0; start < 9; start++) for (let end = 0; end < 9; end++) {
      if (walls[start] || walls[end]) continue;
      const input = snapshotInput({ rows: 3, cols: 3, start, end, walls });
      const result = bfs(input);
      const label = `mask=${mask}, start=${start}, end=${end}`;
      assert.equal(result.found, Number.isFinite(distance[start][end]), label);
      assert.equal(new Set(result.visited).size, result.visited.length, label);
      assert.equal(result.visited[0], start, label);
      assert.ok(result.visited.every(id => !walls[id]), label);
      if (result.found) {
        assert.equal(result.path.length - 1, distance[start][end], label);
        assert.equal(result.path[0], start, label);
        assert.equal(result.path.at(-1), end, label);
        assert.ok(result.path.every(id => result.visited.includes(id)), label);
        for (let i = 1; i < result.path.length; i++) {
          const a = result.path[i - 1], b = result.path[i];
          assert.equal(Math.abs(Math.floor(a / 3) - Math.floor(b / 3)) + Math.abs(a % 3 - b % 3), 1, label);
        }
      } else {
        assert.deepEqual(result.path, [], label);
        assert.deepEqual([...result.visited].sort((a, b) => a - b),
          distance[start].flatMap((value, id) => Number.isFinite(value) ? [id] : []), label);
      }
      const depth = dfs(input);
      assert.equal(depth.found, result.found, label);
      assert.equal(new Set(depth.visited).size, depth.visited.length, label);
      const evaluated = evaluatePathfinding('dfs', input, dfs, () => 0);
      assert.equal(evaluated.status, 'completed', label);
      if (!depth.found) assert.deepEqual([...depth.visited].sort((a,b) => a-b), [...result.visited].sort((a,b) => a-b), label);
      cases++;
    }
  }
  assert.equal(cases, 11520);
});

test('BFS handles the maximum supported grid without duplicate visits or input mutation', () => {
  const input = grid(100, 100);
  const result = bfs(input);
  assert.equal(result.found, true);
  assert.equal(result.path.length - 1, 198);
  assert.equal(result.visited.length, 10000);
  assert.equal(new Set(result.visited).size, 10000);
  assert.deepEqual(input, grid(100, 100));
});

const { idlePlayback, startPlayback, advancePlayback, ANIMATION_DELAYS } = await import('../src/pathfinding/playback.ts');
const { evaluatePathfinding, gridToInput } = await import('../src/pathfinding/evaluation.ts');
const uiGrid = () => [['start', 'empty', 'end'], ['wall', 'empty', 'empty']]
  .map((row, r) => row.map((type, c) => ({ row: r, col: c, type })));

test('playback paints visited then path in result order without changing markers or input', () => {
  const grid = uiGrid();
  const result = evaluatePathfinding('bfs', gridToInput(grid), bfs);
  let state = startPlayback(grid, result);
  assert.deepEqual(state.frames.map(frame => frame.id), [...result.visited, ...result.path]);
  assert.ok(state.frames.slice(0, result.visited.length).every(frame => frame.type === 'visited'));
  assert.ok(state.frames.slice(result.visited.length).every(frame => frame.type === 'path'));
  for (let step = 0; step < state.frames.length; step++) {
    const previous = state;
    state = advancePlayback(state);
    assert.equal(state.cursor, step + 1);
    assert.equal(previous.cursor, step);
    assert.equal(state.grid[0][0].type, 'start');
    assert.equal(state.grid[0][2].type, 'end');
    assert.equal(state.grid[1][0].type, 'wall');
    if (step < result.visited.length) assert.equal(state.grid.flat().some(node => node.type === 'path'), false);
  }
  assert.equal(state.status, 'completed');
  assert.equal(state.grid[0][1].type, 'path');
  assert.equal(advancePlayback(state), state);
  assert.equal(state.result, result);
  assert.deepEqual(grid, uiGrid());
  assert.deepEqual(idlePlayback(state.grid).grid, grid);
  assert.deepEqual(startPlayback(state.grid, result).grid, grid);
});

test('playback terminates for no-path and errors; speed changes delays, not results', () => {
  const grid = uiGrid();
  grid[0][1].type = 'wall';
  const result = evaluatePathfinding('bfs', gridToInput(grid), bfs);
  let state = startPlayback(grid, result);
  while (state.status === 'running') state = advancePlayback(state);
  assert.equal(state.result.found, false);
  assert.equal(state.grid.flat().some(node => node.type === 'path'), false);
  const error = startPlayback(grid, { algorithm: 'bfs', status: 'error', error: 'runner_error' });
  assert.equal(error.status, 'error');
  assert.equal(error.result, null);
  assert.equal(advancePlayback(error), error);
  assert.ok(ANIMATION_DELAYS.slow > ANIMATION_DELAYS.normal);
  assert.ok(ANIMATION_DELAYS.normal > ANIMATION_DELAYS.fast);
});

test('clearPath removes only trace marks, preserves the layout and resets playback', async () => {
  const { clearPath } = await import('../src/pathfinding/clearPath.ts');
  const grid = [['start', 'visited', 'path', 'wall', 'end', 'empty']]
    .map((row, r) => Object.freeze(row.map((type, c) => Object.freeze({ row: r, col: c, type }))));
  Object.freeze(grid);
  const clean = clearPath(grid);
  assert.deepEqual(clean[0].map(node => node.type), ['start', 'empty', 'empty', 'wall', 'end', 'empty']);
  assert.deepEqual(grid[0].map(node => node.type), ['start', 'visited', 'path', 'wall', 'end', 'empty']);
  assert.deepEqual(clearPath(clean), clean);
  assert.deepEqual(idlePlayback(grid), { grid: clean, frames: [], cursor: 0, status: 'idle', result: null });
});

test('DFS follows depth-first priority and can return a longer path than BFS', () => {
  const input = grid(3, 3, [], 0, 3);
  const depth = dfs(input);
  assert.deepEqual(depth.visited, [0,1,2,5,8,7,4,3]);
  assert.deepEqual(depth.path, [0,1,2,5,8,7,4,3]);
  assert.equal(bfs(input).path.length, 2);
  assert.deepEqual(dfs(input), depth);
  depth.path.reverse();
  assert.deepEqual(dfs(input).path, [0,1,2,5,8,7,4,3]);
  assert.deepEqual(input, grid(3, 3, [], 0, 3));
});

test('DFS avoids walls, handles no-path and same-cell, and needs no recursive stack', () => {
  assert.deepEqual(dfs(grid(3,3,[1,3])), { found:false, visited:[0], path:[] });
  assert.deepEqual(dfs(grid(1,1)), { found:true, visited:[0], path:[0] });
  assert.deepEqual(dfs(grid(1,4,[],3,0)).path, [3,2,1,0]);
  assert.deepEqual(dfs(grid(3,3,[1,4])).path, [0,3,6,7,8]);
  const long = dfs(grid(1,10000));
  assert.equal(long.path.length, 10000);
  assert.equal(long.visited.length, 10000);
});

test('available comparison runs all four algorithms on the same immutable layout with search-only timing', async () => {
  const { compareAvailablePathfinding } = await import('../src/pathfinding/registry.ts');
  for (const input of [grid(3,3,[],0,3), grid(3,3,[1,3]), grid(1,1)]) {
    const before = structuredClone(input);
    const ticks = [10,12,20,23,30,34,40,45];
    const results = compareAvailablePathfinding(input, () => ticks.shift());
    assert.deepEqual(results.map(r => r.algorithm), ['bfs','dfs','dijkstra','astar']);
    assert.deepEqual(results.map(r => r.executionTimeMs), [2,3,4,5]);
    for (const [i, search] of [bfs,dfs,dijkstra,astar].entries()) {
      const trace = search(input);
      assert.equal(results[i].status, 'completed');
      assert.deepEqual(results[i].path, trace.path);
      assert.deepEqual(results[i].visited, trace.visited);
      assert.equal(results[i].found, trace.found);
    }
    assert.deepEqual(input, before);
    assert.equal(ticks.length, 0);
    assert.notEqual(results[0].visited, results[1].visited);
  }
});

const pathCost = (input, path) => path.slice(1).reduce((sum, id) => sum + (input.costs?.[id] ?? 1), 0);

test('Dijkstra matches BFS on unit costs and finds a cheaper longer weighted detour', () => {
  const plain = grid(3,3,[],0,2);
  assert.deepEqual(dijkstra(plain), bfs(plain));
  const input = snapshotInput({ ...plain, costs: [8,10,1,1,1,1,1,1,1] });
  const before = structuredClone(input);
  const result = dijkstra(input);
  assert.deepEqual(result.path, [0,3,4,5,2]);
  assert.equal(pathCost(input, result.path), 4);
  assert.equal(pathCost(input, bfs(input).path), 11);
  assert.deepEqual(bfs(input), bfs(plain));
  assert.deepEqual(dijkstra(input), result);
  result.path.reverse(); result.visited.push(99);
  assert.deepEqual(dijkstra(input).path, [0,3,4,5,2]);
  assert.deepEqual(input, before);
  assert.deepEqual(dijkstra(grid(3,3,[1,3])), { found:false, visited:[0], path:[] });
  assert.deepEqual(dijkstra(snapshotInput({ ...grid(1,1), costs:[99] })), { found:true, visited:[0], path:[0] });
});

test('Dijkstra supports zero-cost cycles, fractional costs, walls and maximum-sized paths', () => {
  const zero = snapshotInput({ ...grid(3,3,[4]), costs:Array(9).fill(0) });
  const result = dijkstra(zero);
  assert.equal(result.found, true);
  assert.equal(pathCost(zero, result.path), 0);
  assert.equal(new Set(result.visited).size, result.visited.length);
  assert.ok(!result.visited.includes(4));
  assert.deepEqual(dijkstra(zero), result);
  const fractions = snapshotInput({ ...grid(1,3), costs:[9,0.25,0.5] });
  assert.equal(pathCost(fractions, dijkstra(fractions).path), 0.75);
  const long = dijkstra(grid(1,10000));
  assert.equal(long.path.length,10000);
  assert.equal(long.visited.length,10000);
});

test('weighted snapshots validate and isolate costs before the timed search', async () => {
  const { comparePathfinding } = await import('../src/pathfinding/evaluation.ts');
  const original = { ...grid(1,2), costs:[0,2] };
  const snapshot = snapshotInput(original);
  original.costs[1] = 3;
  assert.deepEqual(snapshot.costs,[0,2]);
  assert.ok(Object.isFrozen(snapshot.costs));
  for (const costs of [[1],[-1,1],[NaN,1],[Infinity,1],[1,'2'],Array(2),[Number.MAX_VALUE,1],null]) {
    let invoked = false;
    assert.throws(() => evaluatePathfinding('dijkstra',{ ...grid(1,2),costs },()=>{invoked=true;},()=>{invoked=true;}),/invalid_costs/);
    assert.equal(invoked,false);
  }
  const inputs=[];
  const results=comparePathfinding(snapshot,[
    {algorithm:'bfs',search:input=>{inputs.push(input); input.costs[1]=0;}},
    {algorithm:'dijkstra',search:input=>{inputs.push(input);return dijkstra(input);}},
  ],()=>0);
  assert.equal(results[0].error,'runner_error');
  assert.equal(results[1].status,'completed');
  assert.equal(results[1].pathLength,1);
  assert.notEqual(inputs[0].costs, inputs[1].costs);
  assert.deepEqual(inputs[1].costs,[0,2]);
  const ui = [[{row:0,col:0,type:'start'},{row:0,col:1,type:'end'}]];
  const playback = startPlayback(ui,results[1]);
  assert.equal(playback.status,'running');
  assert.equal(playback.result.algorithm,'dijkstra');
});

test('Dijkstra and A* match an independent weighted oracle; Manhattan is admissible and consistent', () => {
  let seed = 90;
  const next = () => { seed = (Math.imul(seed,1664525)+1013904223) >>> 0; return seed; };
  for (let sample=0; sample<80; sample++) {
    const walls=Array.from({length:9},()=>next()%5===0);
    const costs=Array.from({length:9},()=>next()%5);
    const distance=Array.from({length:9},(_,a)=>Array.from({length:9},(_,b)=>{
      if(walls[a]||walls[b])return Infinity;
      if(a===b)return 0;
      return Math.abs(Math.floor(a/3)-Math.floor(b/3))+Math.abs(a%3-b%3)===1 ? costs[b] : Infinity;
    }));
    for(let k=0;k<9;k++)for(let a=0;a<9;a++)for(let b=0;b<9;b++)distance[a][b]=Math.min(distance[a][b],distance[a][k]+distance[k][b]);
    for(let start=0;start<9;start++)for(let end=0;end<9;end++){
      if(walls[start]||walls[end])continue;
      const input=snapshotInput({rows:3,cols:3,start,end,walls,costs});
      for (const [algorithm, search] of [['dijkstra', dijkstra], ['astar', astar]]) {
        const result=evaluatePathfinding(algorithm,input,search,()=>0);
        const label=`sample=${sample}, start=${start}, end=${end}`;
        assert.equal(result.status,'completed',label);
        assert.equal(result.found,Number.isFinite(distance[start][end]),label);
        if(result.found)assert.equal(pathCost(input,result.path),distance[start][end],label);
        assert.equal(new Set(result.visited).size,result.visited.length,label);
        const heuristic = manhattanHeuristic(input);
        assert.ok(heuristic(start) <= distance[start][end],label);
        assert.equal(heuristic(end),0,label);
        for(let a=0;a<9;a++)for(let b=0;b<9;b++){
          if(!walls[a]&&!walls[b]&&Math.abs(Math.floor(a/3)-Math.floor(b/3))+Math.abs(a%3-b%3)===1)
            assert.ok(heuristic(a)<=costs[b]+heuristic(b),label);
        }
      }
    }
  }
});

test('A* preserves optimal costs, deterministic traces and input/output isolation', () => {
  for (const input of [grid(3,3), grid(3,3,[1,3]), grid(1,1),
    snapshotInput({...grid(3,3,[],0,2),costs:[8,10,1,1,1,1,1,1,1]}),
    snapshotInput({...grid(3,3,[4]),costs:Array(9).fill(0)}),
    snapshotInput({...grid(2,3,[],0,2),costs:[9,2,0.25,0.25,0.25,0.25]})]) {
    const before=structuredClone(input), expected=dijkstra(input), result=astar(input);
    assert.equal(result.found,expected.found);
    if(result.found)assert.equal(pathCost(input,result.path),pathCost(input,expected.path));
    assert.deepEqual(astar(input),result);
    result.path.push(99); result.visited.reverse();
    assert.deepEqual(input,before);
    assert.ok(!astar(input).path.includes(99));
    assert.equal(evaluatePathfinding('astar',input,astar,()=>0).status,'completed');
  }
  assert.deepEqual(astar(grid(1,1)),{found:true,visited:[0],path:[0]});
  assert.deepEqual(astar(grid(3,3,[1,3])),{found:false,visited:[0],path:[]});
  assert.equal(astar(grid(1,10000)).path.length,10000);
});

test('Manhattan scales down for fractions and zero costs and excludes wall costs', () => {
  assert.equal(manhattanHeuristic(grid(3,3))(0),4);
  const fractional=snapshotInput({...grid(2,3,[],0,2),costs:[9,2,0.25,0.25,0.25,0.25]});
  assert.equal(manhattanHeuristic(fractional)(0),0.5);
  assert.deepEqual(astar(fractional).path,[0,3,4,5,2]);
  const zero=snapshotInput({...grid(3,3),costs:Array(9).fill(0)});
  assert.equal(manhattanHeuristic(zero)(0),0);
  assert.deepEqual(astar(zero),dijkstra(zero));
  const wall=snapshotInput({...grid(3,3,[4]),costs:[2,2,2,2,0,2,2,2,2]});
  assert.equal(manhattanHeuristic(wall)(0),8);
  const adjacent=grid(20,30,[],305,324);
  assert.equal(astar(adjacent).path.length,bfs(adjacent).path.length);
  assert.ok(astar(adjacent).visited.length < dijkstra(adjacent).visited.length);
});

test('A* uses the common comparison, timing and playback contracts', async () => {
  const { comparePathfinding } = await import('../src/pathfinding/evaluation.ts');
  const input=snapshotInput({...grid(2,3,[],0,2),costs:[8,10,1,1,1,1]});
  const ticks=[0,1,2,4,5,8];
  const result=comparePathfinding(input,[{algorithm:'bfs',search:bfs},{algorithm:'dijkstra',search:dijkstra},{algorithm:'astar',search:astar}],()=>ticks.shift());
  assert.deepEqual(result.map(r=>r.algorithm),['bfs','dijkstra','astar']);
  assert.deepEqual(result.map(r=>r.executionTimeMs),[1,2,3]);
  assert.deepEqual(result.map(r=>r.pathLength),[2,4,4]);
  assert.equal(ticks.length,0);
  const playback=startPlayback([[{row:0,col:0,type:'start'},{row:0,col:1,type:'end'}]],evaluatePathfinding('astar',grid(1,2),astar,()=>0));
  assert.equal(playback.result.algorithm,'astar');
  for(const costs of [[-1,1],[NaN,1],[Infinity,1],Array(2)]){
    let called=false;
    assert.throws(()=>evaluatePathfinding('astar',{...grid(1,2),costs},()=>{called=true;},()=>{called=true;}),/invalid_costs/);
    assert.equal(called,false);
  }
});


test('terrain painting, clear actions and playback preserve independent costs and walls', async () => {
  const { paintTerrain, clearTerrain } = await import('../src/pathfinding/terrain.ts');
  const { clearWalls } = await import('../src/utils/clearWalls.ts');
  const { createGrid } = await import('../src/utils/createGrid.ts');
  const base=[[{row:0,col:0,type:'start'},{row:0,col:1,type:'empty'},{row:0,col:2,type:'end'}]];
  const painted=paintTerrain(base,0,1,'water');
  assert.deepEqual(gridToInput(painted).costs,[1,5,1]);
  assert.deepEqual(gridToInput(base).costs,[1,1,1]);
  const wall=paintTerrain(painted,0,1,'wall');
  assert.equal(wall[0][1].type,'wall');
  assert.equal(wall[0][1].terrain,'water');
  assert.equal(evaluatePathfinding('dijkstra',gridToInput(wall),dijkstra,()=>0).pathCost,null);
  assert.equal(clearWalls(wall)[0][1].terrain,'water');
  assert.equal(clearTerrain(wall)[0][1].type,'wall');
  assert.deepEqual(gridToInput(clearTerrain(wall)).costs,[1,1,1]);
  assert.equal(paintTerrain(wall,0,1,'mud')[0][1].type,'empty');
  assert.equal(paintTerrain(base,0,0,'wall')[0][0].type,'start');
  const endpoints=paintTerrain(paintTerrain(base,0,0,'water'),0,2,'mud');
  const result=evaluatePathfinding('dijkstra',gridToInput(endpoints),dijkstra,()=>0);
  assert.equal(result.pathCost,4); // Start cost is excluded, end cost included.
  let playback=startPlayback(painted,evaluatePathfinding('astar',gridToInput(painted),astar,()=>0));
  while(playback.status==='running')playback=advancePlayback(playback);
  assert.equal(playback.grid[0][1].terrain,'water');
  assert.deepEqual(gridToInput(idlePlayback(playback.grid).grid).costs,[1,5,1]);
  assert.ok(gridToInput(createGrid(20,30)).costs.every(cost=>cost===1));
  for(const terrain of ['lava','__proto__',null,5])assert.throws(()=>gridToInput([[{...base[0][0],terrain},base[0][1],base[0][2]]]),/invalid_terrain/);
});

test('weighted UI mapping makes Dijkstra and A* prefer a cheaper longer path', async () => {
  const { compareAvailablePathfinding } = await import('../src/pathfinding/registry.ts');
  const ui=Array.from({length:2},(_,row)=>Array.from({length:3},(_,col)=>({row,col,type:row===0&&col===0?'start':row===0&&col===2?'end':'empty',terrain:row===0&&col===1?'water':'plain'})));
  const input=gridToInput(ui);
  const results=compareAvailablePathfinding(input,()=>0);
  assert.deepEqual(results.map(r=>r.algorithm),['bfs','dfs','dijkstra','astar']);
  assert.equal(results[0].pathLength,2); assert.equal(results[0].pathCost,6);
  for(const result of results.slice(2)) { assert.equal(result.pathLength,4); assert.equal(result.pathCost,4); }
  assert.equal(evaluatePathfinding('astar',grid(1,1),astar,()=>0).pathCost,0);
  assert.equal(evaluatePathfinding('astar',grid(1,3,[1]),astar,()=>0).pathCost,null);
});


test('educational walkthroughs match the real registry paths and costs', async () => {
  const { PATHFINDING_EDUCATION } = await import('../src/pathfinding/education.ts');
  const { PATHFINDING_SEARCHES } = await import('../src/pathfinding/registry.ts');
  assert.deepEqual(Object.keys(PATHFINDING_EDUCATION).sort(), Object.keys(PATHFINDING_SEARCHES).sort());
  for (const [slug, entry] of Object.entries(PATHFINDING_EDUCATION)) {
    const { input, path, cost } = entry.walkthrough;
    const result = PATHFINDING_SEARCHES[slug](snapshotInput(input));
    assert.equal(result.found, true, slug);
    assert.deepEqual(result.path, path, slug);
    assert.equal(result.path.slice(1).reduce((sum, id) => sum + (input.costs?.[id] ?? 1), 0), cost, slug);
    for (const language of ['el', 'en']) {
      const content = entry.education[language];
      for (const key of ['what','intuition','strengths','weaknesses','uses','pitfalls','complexity','completeness','optimality','weights']) {
        assert.ok(content[key]?.trim(), `${slug}/${language}/${key}`);
      }
      assert.equal(content.how.length, 3);
      assert.equal(content.example.length, 3);
      assert.ok(content.example.join(' ').includes(path.join(' → ')), `${slug}/${language} displayed route`);
      assert.ok(content.example.join(' ').includes(`${language === 'el' ? 'κόστος' : 'cost'} ${cost}`));
    }
  }
});


test('persistence captures independent frozen input and result snapshots', async () => {
  const { capturePathfinding } = await import('../src/pathfinding/persistence.ts');
  const { evaluatePathfinding } = await import('../src/pathfinding/evaluation.ts');
  const input = {rows:1, cols:2, start:0, end:1, walls:[false,false]};
  const result = evaluatePathfinding('bfs', input, bfs, () => 0);
  const mutable = {...result, path:[...result.path], visited:[...result.visited]};
  const saved = capturePathfinding(input, [mutable]);
  input.walls[1] = true;
  mutable.path[1] = 0;
  mutable.visited.pop();
  assert.deepEqual(saved.input.walls, [false,false]);
  assert.deepEqual(saved.input.costs, [1,1]);
  assert.deepEqual(saved.results[0].path, [0,1]);
  assert.deepEqual(saved.results[0].visited, [0,1]);
  assert.equal(saved.results[0].executionTimeMs, 0);
  assert.ok(Object.isFrozen(saved.results[0].path));
  assert.ok(Object.isFrozen(saved.input.costs));
  assert.equal(capturePathfinding(input, []), null);
  assert.equal(capturePathfinding(input, [{algorithm:'bfs',status:'error',error:'runner_error'}]), null);
});
