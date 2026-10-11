import type { Grid } from "../types/grid";
import { terrainCost } from "./terrain";

export const PATHFINDING_ALGORITHMS = ["bfs", "dfs", "dijkstra", "astar"] as const;
export type PathfindingAlgorithm = typeof PATHFINDING_ALGORITHMS[number];
/** Row-major IDs, four cardinal neighbours, no diagonals. Missing costs mean 1. */
export interface GridInput {
  readonly rows: number;
  readonly cols: number;
  readonly start: number;
  readonly end: number;
  readonly walls: readonly boolean[];
  /** Cost of entering each cell; the starting cell is not charged. */
  readonly costs?: readonly number[];
}
export interface SearchTrace { found: boolean; visited: readonly number[]; path: readonly number[] }
export type Search = (input: GridInput) => SearchTrace;
export type PathfindingResult = { algorithm: PathfindingAlgorithm } & (
  | {status:"completed"; found:boolean; executionTimeMs:number; visitedNodeCount:number; pathLength:number|null; pathCost:number|null; visited:readonly number[]; path:readonly number[]}
  | {status:"error"; error:"runner_error"|"invalid_result"|"invalid_clock"}
);

export function snapshotInput(input: GridInput): GridInput {
  const {rows,cols,start,end,walls,costs}=input;
  const size=rows*cols;
  if (!Number.isInteger(rows)||!Number.isInteger(cols)||rows<1||cols<1||size>10000
    ||!Array.isArray(walls)||walls.length!==size||[...walls].some(wall=>typeof wall!=="boolean")
    ||![start,end].every(id=>Number.isInteger(id)&&id>=0&&id<size&&!walls[id])) throw new Error("invalid_grid");
  // Bound sums for every supported simple path, including zero/fractional costs.
  if (costs !== undefined && (!Array.isArray(costs) || costs.length !== size
    || [...costs].some(cost => typeof cost !== "number" || !Number.isFinite(cost)
      || cost < 0 || cost > Number.MAX_SAFE_INTEGER / size))) throw new Error("invalid_costs");
  return Object.freeze({rows,cols,start,end,walls:Object.freeze([...walls]),
    ...(costs === undefined ? {} : { costs: Object.freeze([...costs]) })});
}

/** Reuse the UI grid without keeping references or interpreting animation state as walls. */
export function gridToInput(grid: Grid): GridInput {
  const rows=grid.length, cols=grid[0]?.length ?? 0;
  if (!rows||!cols||rows*cols>10000||grid.some(row=>row.length!==cols)) throw new Error("invalid_grid");
  const starts:number[]=[], ends:number[]=[], walls:boolean[]=[], costs:number[]=[];
  grid.forEach((row,r)=>row.forEach((node,c)=>{
    if(node.row!==r||node.col!==c||!["empty","start","end","wall","visited","path"].includes(node.type)) throw new Error("invalid_grid");
    const id=r*cols+c;
    if(node.type==="start")starts.push(id);
    if(node.type==="end")ends.push(id);
    walls.push(node.type==="wall");
    costs.push(terrainCost(node.terrain));
  }));
  if(starts.length!==1||ends.length!==1)throw new Error("invalid_endpoints");
  return snapshotInput({rows,cols,start:starts[0],end:ends[0],walls,costs});
}

/** Stable up/right/down/left order; callers receive a new array. */
export function neighbours(input:GridInput,id:number):number[] {
  if(!Number.isInteger(id)||id<0||id>=input.rows*input.cols||input.walls[id])return [];
  const row=Math.floor(id/input.cols),col=id%input.cols;
  return [[row-1,col],[row,col+1],[row+1,col],[row,col-1]]
    .filter(([r,c])=>r>=0&&r<input.rows&&c>=0&&c<input.cols&&!input.walls[r*input.cols+c])
    .map(([r,c])=>r*input.cols+c);
}

function validTrace(input:GridInput,trace:SearchTrace):boolean {
  if(!trace||typeof trace.found!=="boolean"||!Array.isArray(trace.visited)||!Array.isArray(trace.path))return false;
  const walkable=(id:number)=>Number.isInteger(id)&&id>=0&&id<input.rows*input.cols&&!input.walls[id];
  if(trace.visited.length>input.rows*input.cols||![...trace.visited].every(walkable)||new Set(trace.visited).size!==trace.visited.length)return false;
  if(!trace.found)return trace.path.length===0;
  if(!trace.path.length||trace.path.length>input.rows*input.cols||trace.path[0]!==input.start||trace.path.at(-1)!==input.end||new Set(trace.path).size!==trace.path.length)return false;
  const visited=new Set(trace.visited);
  return trace.path.every((id,index)=>walkable(id)&&visited.has(id)&&(index===0||neighbours(input,trace.path[index-1]).includes(id)));
}

/** Validation/copying precede timing; result checks follow timing. No rendering or delays. */
export function evaluatePathfinding(algorithm:PathfindingAlgorithm,input:GridInput,search:Search,clock:()=>number=()=>performance.now()):PathfindingResult {
  if(!PATHFINDING_ALGORITHMS.includes(algorithm))throw new Error("unknown_algorithm");
  const fresh=snapshotInput(input);
  let trace:SearchTrace;
  const start=clock();
  try {trace=search(fresh);}catch{return {algorithm,status:"error",error:"runner_error"};}
  const elapsed=clock()-start;
  if(!Number.isFinite(elapsed)||elapsed<0)return {algorithm,status:"error",error:"invalid_clock"};
  if(!validTrace(fresh,trace))return {algorithm,status:"error",error:"invalid_result"};
  return {algorithm,status:"completed",found:trace.found,executionTimeMs:elapsed,
    visitedNodeCount:trace.visited.length,pathLength:trace.found?trace.path.length-1:null,
    pathCost:trace.found?trace.path.slice(1).reduce((sum,id)=>sum+(fresh.costs?.[id]??1),0):null,
    visited:Object.freeze([...trace.visited]),path:Object.freeze([...trace.path])};
}

/** Same-grid comparison with isolated input copies and independent failures. */
export function comparePathfinding(input:GridInput,entries:readonly {algorithm:PathfindingAlgorithm;search:Search}[],clock?:()=>number):PathfindingResult[] {
  const snapshot=snapshotInput(input);
  if(entries.length<1||entries.length>4||new Set(entries.map(item=>item.algorithm)).size!==entries.length
    ||entries.some(item=>!PATHFINDING_ALGORITHMS.includes(item.algorithm)))throw new Error("invalid_selection");
  return entries.map(({algorithm,search})=>evaluatePathfinding(algorithm,snapshot,search,clock));
}
