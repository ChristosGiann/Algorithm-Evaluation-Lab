import type { Grid, Terrain } from "../types/grid";
import { toggleWall } from "../utils/toggleWall";

export const TERRAIN_COSTS = { plain: 1, mud: 3, water: 5 } as const;
export type PaintTool = Terrain | "wall";
export function terrainCost(terrain: Terrain | undefined): number {
  if (terrain === undefined) return 1;
  if (!Object.hasOwn(TERRAIN_COSTS, terrain)) throw new Error("invalid_terrain");
  return TERRAIN_COSTS[terrain];
}
/** Walls retain underlying terrain; painting terrain makes them walkable. */
export function paintTerrain(grid: Grid, row: number, col: number, tool: PaintTool): Grid {
  if (tool === "wall") return toggleWall(grid, row, col);
  terrainCost(tool);
  if (!grid[row]?.[col]) return grid;
  return grid.map((cells, r) => cells.map((node, c) => r === row && c === col
    ? { ...node, terrain: tool, type: node.type === "wall" ? "empty" : node.type } : node));
}
export function clearTerrain(grid: Grid): Grid {
  return grid.map(row => row.map(node => ({ ...node, terrain: "plain" })));
}
