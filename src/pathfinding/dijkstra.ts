import { MinHeap } from "./minHeap";
import { neighbours } from "./evaluation";
import type { Search } from "./evaluation";
import { reconstructPath } from "./reconstructPath";
import type { SearchNode } from "./reconstructPath";

interface Entry extends SearchNode { readonly cost: number; readonly order: number }
const precedes = (a: Entry, b: Entry) => a.cost < b.cost || (a.cost === b.cost && a.order < b.order);

/** Dijkstra on validated non-negative costs; visited means settled, not enqueued. */
export const dijkstra: Search = input => {
  const start: Entry = { id: input.start, previous: null, cost: 0, order: 0 };
  const frontier = new MinHeap<Entry>(precedes);
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
        frontier.push({ id, previous: node, cost, order: order++ });
      }
    }
  }
  return { found: false, visited, path: [] };
};
