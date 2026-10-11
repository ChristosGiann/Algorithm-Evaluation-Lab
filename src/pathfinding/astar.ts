import { neighbours } from "./evaluation";
import type { GridInput, Search } from "./evaluation";
import { MinHeap } from "./minHeap";
import { reconstructPath } from "./reconstructPath";
import type { SearchNode } from "./reconstructPath";

interface Entry extends SearchNode { readonly cost: number; readonly priority: number; readonly order: number }

/** Consistent lower bound: Manhattan steps times the cheapest walkable cell cost. */
export function manhattanHeuristic(input: GridInput): (id: number) => number {
  let minimum = 1;
  if (input.costs) {
    minimum = Infinity;
    input.costs.forEach((cost, id) => { if (!input.walls[id]) minimum = Math.min(minimum, cost); });
  }
  const endRow = Math.floor(input.end / input.cols), endCol = input.end % input.cols;
  return id => minimum * (Math.abs(Math.floor(id / input.cols) - endRow) + Math.abs(id % input.cols - endCol));
}

/** A* on validated cardinal grids; zero minimum cost safely reduces to Dijkstra. */
export const astar: Search = input => {
  const heuristic = manhattanHeuristic(input);
  const start: Entry = { id: input.start, previous: null, cost: 0, priority: heuristic(input.start), order: 0 };
  const frontier = new MinHeap<Entry>((a, b) => a.priority < b.priority || (a.priority === b.priority && a.order < b.order));
  frontier.push(start);
  const distances = Array<number>(input.rows * input.cols).fill(Infinity);
  distances[input.start] = 0;
  const settled = new Set<number>();
  const visited: number[] = [];
  let order = 1;
  let node: Entry | undefined;
  while ((node = frontier.pop())) {
    if (settled.has(node.id) || node.cost !== distances[node.id]) continue;
    settled.add(node.id);
    visited.push(node.id);
    if (node.id === input.end) return { found: true, visited, path: reconstructPath(start, node) };
    for (const id of neighbours(input, node.id)) {
      if (settled.has(id)) continue;
      const cost = node.cost + (input.costs?.[id] ?? 1);
      if (cost < distances[id]) {
        distances[id] = cost;
        frontier.push({ id, previous: node, cost, priority: cost + heuristic(id), order: order++ });
      }
    }
  }
  return { found: false, visited, path: [] };
};
