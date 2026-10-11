import type { AppTexts } from "../../i18n/translations";
import "./Toolbar.css";
import type { AnimationSpeed } from "../../pathfinding/playback";
import type { AvailablePathfindingAlgorithm } from "../../pathfinding/registry";

type ToolbarProps = {
  texts: AppTexts["toolbar"];
  algorithms: AppTexts["algorithms"];
  speed: AppTexts["speed"];
  onResetGrid: () => void;
  onClearWalls: () => void;
  onClearPath: () => void;
  onVisualize: () => void;
  onCompare: () => void;
  selectedSpeed: AnimationSpeed;
  selectedAlgorithm: AvailablePathfindingAlgorithm;
  onAlgorithmChange: (algorithm: AvailablePathfindingAlgorithm) => void;
  onSpeedChange: (speed: AnimationSpeed) => void;
  disabled?: boolean;
};

export function Toolbar({
  texts,
  algorithms,
  speed,
  onResetGrid,
  onClearWalls,
  onClearPath,
  onVisualize,
  onCompare,
  selectedSpeed,
  selectedAlgorithm,
  onAlgorithmChange,
  onSpeedChange,
  disabled = false,
}: ToolbarProps) {
  return (
    <section className="toolbar" aria-label={texts.ariaLabel}>
      <div className="toolbar-group">
        <label className="toolbar-label" htmlFor="algorithm-select">
          {texts.algorithmLabel}
        </label>

        <select id="algorithm-select" className="toolbar-select" value={selectedAlgorithm} disabled={disabled}
          onChange={event => {
            const value = event.target.value;
            if (value === "bfs" || value === "dfs" || value === "dijkstra" || value === "astar") onAlgorithmChange(value);
          }}>
          <option value="bfs">{algorithms.bfs}</option>
          <option value="dfs">{algorithms.dfs}</option>
          <option value="dijkstra">{algorithms.dijkstra}</option>
          <option value="astar">{algorithms.astar}</option>
        </select>
      </div>

      <div className="toolbar-group">
        <label className="toolbar-label" htmlFor="speed-select">
          {texts.speedLabel}
        </label>

        <select
          id="speed-select"
          className="toolbar-select"
          value={selectedSpeed}
          disabled={disabled}
          onChange={event => onSpeedChange(event.target.value as AnimationSpeed)}
        >
          <option value="slow">{speed.slow}</option>
          <option value="normal">{speed.normal}</option>
          <option value="fast">{speed.fast}</option>
        </select>
      </div>

      <div className="toolbar-actions">
        <button
          className="toolbar-button toolbar-button--primary"
          type="button"
          onClick={onVisualize}
          disabled={disabled}
        >
          {texts.visualize}
        </button>

        <button className="toolbar-button" type="button" onClick={onCompare} disabled={disabled}>
          {texts.compare}
        </button>

        <button className="toolbar-button" type="button" onClick={onClearPath} disabled={disabled}>
          {texts.clearPath}
        </button>

        <button className="toolbar-button" type="button" onClick={onClearWalls} disabled={disabled}>
          {texts.clearWalls}
        </button>

        <button className="toolbar-button" type="button" onClick={onResetGrid} disabled={disabled}>
          {texts.resetGrid}
        </button>
      </div>
    </section>
  );
}
