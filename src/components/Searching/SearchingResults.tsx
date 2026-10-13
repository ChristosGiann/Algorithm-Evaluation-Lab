import type { Language } from "../../i18n/translations";
import { searchingComparisonTexts } from "../../i18n/searchingComparison";
import { SEARCHING_DEFINITIONS } from "../../searching/evaluation";
import type { SearchingComparisonResult } from "../../searching/comparison";
import "../Benchmark/ResultsDashboard.css";

export function SearchingResults({ result, language }: { result: SearchingComparisonResult; language: Language }) {
  const t = searchingComparisonTexts[language];
  return <div className="results">
    <p>{t.size}: {result.input.values.length} · {t.target}: {result.input.target}</p>
    <p>{t.counters}</p><p>{t.timing}</p>
    <div className="results__scroll" role="region" aria-label={t.results} tabIndex={0}>
      <table><caption>{t.results}</caption>
        <thead><tr>{[t.algorithm, t.status, t.index, t.correctness, t.probes, t.comparisons, t.time].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
        <tbody>{result.rows.map(row => <tr key={row.algorithm}>
          <th scope="row">{SEARCHING_DEFINITIONS[row.algorithm].name}</th>
          {row.status === "error" ? <td colSpan={6}>{t.failed}: {t.errors[row.error]}</td> : <>
            <td>{row.found ? t.found : t.absent}</td><td>{row.index ?? "—"}</td>
            <td>{row.correct ? t.correct : t.incorrect}</td><td>{row.probeCount}</td><td>{row.comparisons}</td>
            <td>{row.executionTimeMs.toLocaleString(language, { maximumSignificantDigits: 6 })}</td>
          </>}
        </tr>)}</tbody>
      </table>
    </div>
  </div>;
}
