export type NodeType = "empty" | "start" | "end" | "wall" | "visited" | "path";

export type Terrain = "plain" | "mud" | "water";

export type GridNode = {
  row: number;
  col: number;
  type: NodeType;
  terrain?: Terrain;
};

export type Grid = GridNode[][];