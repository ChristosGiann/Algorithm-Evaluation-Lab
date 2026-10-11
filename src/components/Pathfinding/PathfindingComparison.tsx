import { experimentTexts } from "../../i18n/experiment";
import { translations } from "../../i18n/translations";
import type { Language } from "../../i18n/translations";
import type { PathfindingResult } from "../../pathfinding/evaluation";
import "./PathfindingStatistics.css";

export function PathfindingComparison({ results, language, saved = false }: {
  results: readonly PathfindingResult[] | null;
  language: Language;
  saved?: boolean;
}) {
  if (!results?.length) return null;
  const texts = translations[language];
  const stats = texts.pathfinding.statistics;
  const comparison = texts.pathfinding.comparison;
  const title = saved ? experimentTexts[language].saved : comparison.title;
  const number = new Intl.NumberFormat(language === "el" ? "el-GR" : "en-US", { maximumFractionDigits: 6 });
  return <section className="pathfinding-statistics" aria-label={title}>
    <h3>{title}</h3>
    {!saved && <p>{comparison.note}</p>}
    <div className="pathfinding-comparison-scroll" role="region" aria-label={comparison.caption} tabIndex={0}>
      <table className="pathfinding-comparison">
        <caption>{comparison.caption}</caption>
        <thead><tr>{[stats.algorithm, stats.found, stats.length, stats.cost, stats.visited, stats.time].map(label =>
          <th key={label} scope="col">{label}</th>)}</tr></thead>
        <tbody>{results.map(result => <tr key={result.algorithm}>
          <th scope="row">{texts.algorithms[result.algorithm]}</th>
          {result.status === "completed" ? <>
            <td>{result.found ? stats.yes : stats.no}</td>
            <td>{result.pathLength === null ? "—" : number.format(result.pathLength)}</td>
            <td>{result.pathCost == null ? "—" : number.format(result.pathCost)}</td>
            <td>{number.format(result.visitedNodeCount)}</td>
            <td>{number.format(result.executionTimeMs)} ms</td>
          </> : <td colSpan={5}>{comparison.errors[result.error]}</td>}
        </tr>)}</tbody>
      </table>
    </div>
    <p>{stats.note}</p>
  </section>;
}
