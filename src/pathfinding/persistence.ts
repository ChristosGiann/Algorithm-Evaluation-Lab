import { snapshotInput } from "./evaluation";
import type { GridInput, PathfindingResult } from "./evaluation";

export interface PathfindingSnapshot { input: GridInput; results: readonly PathfindingResult[] }
/** Capture values at evaluation time, never read a later edited grid when saving. */
export function capturePathfinding(input: GridInput, results: readonly PathfindingResult[]): PathfindingSnapshot | null {
  if (!results.length || results.some(row => row.status !== "completed")) return null;
  const grid = snapshotInput(input);
  return Object.freeze({
    input: Object.freeze({...grid, costs: grid.costs ?? Object.freeze(Array(grid.rows * grid.cols).fill(1))}),
    results: Object.freeze(results.map(row => {
      if (row.status !== "completed") throw new Error("incomplete_result");
      return Object.freeze({...row, visited:Object.freeze([...row.visited]), path:Object.freeze([...row.path])});
    })),
  });
}
