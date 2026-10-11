import { SavedPathfinding } from "../Pathfinding/SavedPathfinding";
import { ComparisonResults } from "../Comparison/ComparisonResults";
import { comparisonFromExperiment } from "../Comparison/fromExperiment";
import type { Experiment } from "../../types/experiment";
import type { Language } from "../../i18n/translations";
import { experimentTexts } from "../../i18n/experiment";
import { benchmarkTexts } from "../../i18n/benchmark";

export function ExperimentDetails({ experiment, language }: { experiment: Experiment; language: Language }) {
  if (experiment.family === "pathfinding") return <SavedPathfinding experiment={experiment} language={language} />;
  const comparison = comparisonFromExperiment(experiment);
  const t = experimentTexts[language];
  const b = benchmarkTexts[language];
  const ms = (value: number | undefined) => value === undefined || !Number.isFinite(value) ? "—" : (value / 1_000_000).toLocaleString(language, { maximumSignificantDigits: 6 });
  return <div className="experiment-details">
    <h3>#{experiment.id} · {experiment.name}</h3>
    <p>{b.status}: {t.states[experiment.status]}</p>
    {experiment.execution_error && <p role="alert">{experiment.execution_error === "incorrect_result" ? t.incorrect : t.runnerError}</p>}
    <ul>{experiment.implementations.map(item => <li key={item.id}>{item.algorithm} · {item.name}</li>)}</ul>
    <ul>{experiment.datasets.map(item => <li key={item.id}>{b.types[item.dataset_type]} · {b.size}: {item.size} · {b.seed}: {item.seed}</li>)}</ul>
    {comparison && <ComparisonResults result={comparison} language={language} />}
    <h4>{t.saved}</h4>
    {!experiment.results.length ? <p>{t.noResults}</p> : <div className="results__scroll" tabIndex={0} role="region" aria-label={t.saved}>
      <table><caption>{t.saved} · #{experiment.id}</caption>
        <thead><tr>{[b.implementation, b.dataset, b.size, b.seed, b.runs, b.status, `${b.median} (ms)`, `${b.min} (ms)`, `${b.max} (ms)`, `${b.mean} (ms)`, `${b.stddev} (ms)`].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
        <tbody>{experiment.results.map(item => <tr key={item.id}>
          <th scope="row">{item.implementation_snapshot.algorithm} · {item.implementation_snapshot.name} · {item.implementation_snapshot.language}</th>
          <td>{b.types[item.measurement.dataset_type]}</td><td>{item.measurement.size}</td><td>{item.measurement.seed}</td><td>{item.measurement.runs}</td>
          <td>{item.measurement.correct ? b.correct : b.incorrect}</td>
          <td>{ms(item.measurement.median_ns)}</td><td>{ms(item.measurement.min_ns)}</td><td>{ms(item.measurement.max_ns)}</td><td>{ms(item.measurement.mean_ns)}</td><td>{ms(item.measurement.stddev_ns)}</td>
        </tr>)}</tbody>
      </table>
    </div>}
  </div>;
}
