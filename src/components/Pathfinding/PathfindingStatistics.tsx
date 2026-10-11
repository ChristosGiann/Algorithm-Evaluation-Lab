import type { Language } from "../../i18n/translations";
import { translations } from "../../i18n/translations";
import type { Playback } from "../../pathfinding/playback";
import "./PathfindingStatistics.css";

export function PathfindingStatistics({ status, result, language }: {
  status: Playback["status"];
  result: Playback["result"];
  language: Language;
}) {
  if (status !== "completed" || !result) return null;
  const texts = translations[language];
  const stats = texts.pathfinding.statistics;
  const number = new Intl.NumberFormat(language === "el" ? "el-GR" : "en-US", { maximumFractionDigits: 6 });
  return <section className="pathfinding-statistics" aria-label={stats.title}>
    <h3>{stats.title}</h3>
    <dl>
      <div><dt>{stats.algorithm}</dt><dd>{texts.algorithms[result.algorithm]}</dd></div>
      <div><dt>{stats.found}</dt><dd>{result.found ? stats.yes : stats.no}</dd></div>
      <div><dt>{stats.visited}</dt><dd>{number.format(result.visitedNodeCount)}</dd></div>
      <div><dt>{stats.length}</dt><dd>{result.pathLength === null ? "—" : number.format(result.pathLength)}</dd></div>
      <div><dt>{stats.cost}</dt><dd>{result.pathCost == null ? "—" : number.format(result.pathCost)}</dd></div>
      <div><dt>{stats.time}</dt><dd>{number.format(result.executionTimeMs)} ms</dd></div>
    </dl>
    <p>{stats.note}</p>
  </section>;
}
