import type { PathfindingExperiment } from "../../types/experiment";
import type { Language } from "../../i18n/translations";
import { pathfindingPersistenceTexts } from "../../i18n/pathfindingPersistence";
import { PathfindingComparison } from "./PathfindingComparison";

/** A read-only snapshot view: no registry, search, timers or animation state. */
export function SavedPathfinding({ experiment, language }: { experiment: PathfindingExperiment; language: Language }) {
  const t = pathfindingPersistenceTexts[language];
  const grid = experiment.input_snapshot.grid;
  return <section>
    <h3>#{experiment.id} · {experiment.name} · Pathfinding</h3>
    <p>{t.note}</p>
    <p>{t.selected}: {experiment.results.map(row => row.implementation_snapshot.name).join(", ")}</p>
    <PathfindingComparison saved language={language} results={experiment.results.map(row => row.measurement)} />
    <details><summary>{t.grid} · {grid.rows} × {grid.cols}</summary>
      <p>{t.legend}</p><p>start={grid.start}, end={grid.end}</p>
      <pre style={{overflowX:"auto", maxHeight:"24rem"}} tabIndex={0}>{Array.from({length:grid.rows}, (_, row) =>
        Array.from({length:grid.cols}, (_, col) => {
          const id = row * grid.cols + col;
          const marker = `${id === grid.start ? "S" : ""}${id === grid.end ? "E" : ""}`;
          return `${marker}${grid.walls[id] ? "#" : ""}(${grid.costs?.[id] ?? 1})`;
        }).join(" ")).join("\n")}</pre>
    </details>
    <details><summary>{t.route}</summary><ul>{experiment.results.map(row => <li key={row.id}>
      {row.implementation_snapshot.name}: {row.measurement.status === "completed" && (row.measurement.found ? row.measurement.path.join(" → ") : t.noPath)}
    </li>)}</ul></details>
  </section>;
}
