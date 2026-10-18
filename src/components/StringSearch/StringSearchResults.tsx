import type { Language } from "../../i18n/translations";
import { stringSearchComparisonTexts } from "../../i18n/stringSearchComparison";
import { STRING_SEARCH_NAMES } from "../../stringSearch/registry";
import type { StringSearchComparisonResult } from "../../stringSearch/comparison";
import "../Benchmark/ResultsDashboard.css";
export function StringSearchResults({result, language}: {result: StringSearchComparisonResult; language: Language}) {
  const t = stringSearchComparisonTexts[language];
  const time = (value: number) => value.toLocaleString(language, {maximumSignificantDigits: 6});
  return <div className="results">
    <p>{t.size}: {result.input.text.length} / {result.input.pattern.length}</p><p>{t.timing}</p><p>{t.counters}</p>
    <div className="results__scroll" role="region" aria-label={t.results} tabIndex={0}>
      <table><caption>{t.results}</caption><thead><tr>{[t.algorithm,t.status,t.index,t.correctness,t.prepTime,t.searchTime,t.prepCount,t.searchCount].map(label=><th scope="col" key={label}>{label}</th>)}</tr></thead>
        <tbody>{result.rows.map(row=><tr key={row.algorithm}><th scope="row">{STRING_SEARCH_NAMES[row.algorithm]}</th>
          {row.status === "error" ? <td colSpan={7}>{t.failed}: {t.errors[row.error]}</td> : <>
            <td>{row.found?t.found:t.absent}</td><td>{row.index ?? "—"}</td><td>{row.correct?t.correct:t.incorrect}</td>
            <td>{time(row.preprocessingTimeMs)}</td><td>{time(row.executionTimeMs)}</td><td>{row.preprocessingComparisons}</td><td>{row.comparisons}</td>
          </>}
        </tr>)}</tbody>
      </table>
    </div>
  </div>;
}
