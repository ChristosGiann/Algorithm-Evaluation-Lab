import type { AppTexts } from "../../i18n/translations";
import type { GridNode as GridNodeType } from "../../types/grid";

import { terrainCost } from "../../pathfinding/terrain";

type GridNodeProps = {
  node: GridNodeType;
  texts: AppTexts["grid"];
  onNodeClick: (row: number, col: number) => void;
  disabled?: boolean;
};

export function GridNode({ node, texts, onNodeClick, disabled = false }: GridNodeProps) {
  const cost = terrainCost(node.terrain);
  const label = `${texts.cell(node.row, node.col)} · ${node.type === "wall" ? texts.wall : `${texts[node.terrain ?? "plain"]} · ${texts.cost}: ${cost}`}`;
  return (
    <button
      type="button"
      disabled={disabled}
      className={`grid-node grid-node--${node.type} terrain--${node.terrain ?? "plain"}`}
      title={label}
      aria-label={label}
      onClick={() => onNodeClick(node.row, node.col)}
    >{node.type !== "wall" && cost > 1 ? cost : null}</button>
  );
}
