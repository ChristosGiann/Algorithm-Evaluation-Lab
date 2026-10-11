import type { AppTexts } from "../../i18n/translations";
import type { PaintTool } from "../../pathfinding/terrain";
export function TerrainControls({ texts, tool, disabled, onChange, onClear }: {
  texts: AppTexts["terrain"]; tool: PaintTool; disabled: boolean;
  onChange: (tool: PaintTool) => void; onClear: () => void;
}) {
  return <fieldset disabled={disabled}>
    <legend>{texts.title}</legend>
    <label htmlFor="terrain-tool">{texts.tool}</label>{" "}
    <select id="terrain-tool" value={tool} onChange={event => {
      const value = event.target.value;
      if (value === "wall" || value === "plain" || value === "mud" || value === "water") onChange(value);
    }}>
      <option value="wall">{texts.wall}</option>
      <option value="plain">{texts.plain} (1)</option>
      <option value="mud">{texts.mud} (3)</option>
      <option value="water">{texts.water} (5)</option>
    </select>{" "}
    <button type="button" onClick={onClear}>{texts.clear}</button>
    <p>{texts.note}</p>
  </fieldset>;
}
