import { bfs } from "./bfs";
import { dfs } from "./dfs";
import { dijkstra } from "./dijkstra";
import { astar } from "./astar";
import type { Search } from "./evaluation";
import { comparePathfinding } from "./evaluation";
import type { GridInput } from "./evaluation";

export const PATHFINDING_SEARCHES = { bfs, dfs, dijkstra, astar } satisfies Record<string, Search>;
export type AvailablePathfindingAlgorithm = keyof typeof PATHFINDING_SEARCHES;

/** Compare every implemented search on independent copies of the same input. */
export function compareAvailablePathfinding(input: GridInput, clock?: () => number) {
  const algorithms = Object.keys(PATHFINDING_SEARCHES) as AvailablePathfindingAlgorithm[];
  return comparePathfinding(input, algorithms.map(algorithm => ({
    algorithm, search: PATHFINDING_SEARCHES[algorithm],
  })), clock);
}
