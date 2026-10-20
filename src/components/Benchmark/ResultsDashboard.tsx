import { useCatalogue } from "../../hooks/useCatalogue";
import { ComplexityContext } from "./ComplexityContext";
import type { Language } from "../../i18n/translations";
import { benchmarkTexts } from "../../i18n/benchmark";
import type { BenchmarkRequest, BenchmarkResult } from "../../types/benchmark";
import "./ResultsDashboard.css";

export type ResultEntry = { id: number; input: BenchmarkRequest } & (
  | { status: "completed"; result: BenchmarkResult }
  | { status: "error" | "timeout" }
);

export function ResultsDashboard({ entries, running, language, onClear }: {
  entries: ResultEntry[]; running: boolean; language: Language; onClear: () => void;
}) {
  const catalogue = useCatalogue();
  const texts = benchmarkTexts[language];
  const format = (ns: number | undefined) => ns === undefined || !Number.isFinite(ns) ? "—" : (ns / 1_000_000).toLocaleString(language, { maximumSignificantDigits: 6 });
  const measured = entries.flatMap(entry => entry.status === "completed" ? [entry] : []);
  const max = Math.max(0, ...measured.map(entry => entry.result.max_ns));
  return <section className="results" aria-labelledby="results-title" aria-busy={running}>
    <h3 id="results-title">{texts.dashboard}</h3>
    <p className="benchmark__hint">{texts.comparisonNote}</p>
    {running && <p role="status">{texts.running}</p>}
    {!entries.length && !running && <p>{texts.emptyResults}</p>}
    {entries.length > 0 && <>
      <button className="button-danger" type="button" onClick={onClear} disabled={running}>{texts.clearResults}</button>
      <div className="results__scroll" role="region" aria-label={texts.dashboard} tabIndex={0}>
        <table>
          <caption>{texts.sessionResults}</caption>
          <thead><tr>{["#", texts.implementation, texts.dataset, texts.size, texts.seed, texts.runs,
            texts.status, `${texts.median} (ms)`, `${texts.min} (ms)`, `${texts.max} (ms)`, `${texts.mean} (ms)`, `${texts.stddev} (ms)`].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
          <tbody>{entries.map(entry => <tr key={entry.id}>
            <th scope="row">{entry.id}</th><td>{texts.algorithms[entry.input.algorithm]} · Python<ComplexityContext slug={entry.input.algorithm} catalogue={catalogue} language={language} /></td>
            <td>{texts.types[entry.input.dataset_type]}</td><td>{entry.input.size}</td><td>{entry.input.seed}</td>
            <td>{entry.status === "completed" ? entry.result.runs : "—"}</td>
            <td className={entry.status === "completed" && entry.result.correct ? "benchmark__correct" : "benchmark__incorrect"}>
              {entry.status === "completed" ? (entry.result.correct ? texts.correct : texts.incorrect) : texts[entry.status]}</td>
            {(["median_ns", "min_ns", "max_ns", "mean_ns", "stddev_ns"] as const).map(key => <td key={key}>{entry.status === "completed" ? format(entry.result[key]) : "—"}</td>)}
          </tr>)}</tbody>
        </table>
      </div>
      {measured.length > 0 && <figure className="results__chart">
        <figcaption>{texts.chart}</figcaption>
        <p className="benchmark__hint">{texts.chartNote} · 0–{format(max)} ms</p>
        {measured.map(entry => <div key={entry.id} className="results__plot">
          <span>#{entry.id} · {texts.algorithms[entry.input.algorithm]} · {entry.input.size} · {texts.types[entry.input.dataset_type]}</span>
          <div className="results__track" aria-hidden="true">
            <div className="results__bar" style={{ width: `${max ? entry.result.median_ns / max * 100 : 0}%` }} />
            <div className="results__range" style={{ left: `${max ? entry.result.min_ns / max * 100 : 0}%`, width: `${max ? (entry.result.max_ns - entry.result.min_ns) / max * 100 : 0}%` }} />
          </div>
          <span>{format(entry.result.median_ns)} ms{!entry.result.correct && ` · ${texts.incorrect}`}</span>
        </div>)}
      </figure>}
      <p className="benchmark__hint">{texts.note}</p>
    </>}
  </section>;
}
