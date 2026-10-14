import type { SearchingExperiment } from "../../types/experiment";
import type { Language } from "../../i18n/translations";
import { searchingPersistenceTexts } from "../../i18n/searchingPersistence";
import { SearchingResults } from "./SearchingResults";
/** Read-only snapshot rendering; no algorithm registry or evaluation imports. */
export function SavedSearching({ experiment, language }: { experiment: SearchingExperiment; language: Language }) {
  const t = searchingPersistenceTexts[language];
  const input = experiment.input_snapshot.input;
  return <section>
    <h3>#{experiment.id} · {experiment.name} · Searching</h3><p>{t.note}</p>
    <p>{t.selected}: {experiment.results.map(row => row.implementation_snapshot.name).join(", ")}</p>
    <SearchingResults result={{input, rows: experiment.results.map(row => row.measurement)}} language={language} />
    <details><summary>{t.input}</summary><pre style={{overflowX:"auto", maxHeight:"24rem"}} tabIndex={0}>{JSON.stringify(input)}</pre></details>
    <details><summary>{t.trace}</summary>{experiment.results.map(row => <p key={row.id}>
      {row.implementation_snapshot.name}: {row.measurement.status === "completed" ? row.measurement.probes.join(", ") : "—"}
    </p>)}</details>
  </section>;
}
