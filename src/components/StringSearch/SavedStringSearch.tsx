import type { StringSearchExperiment } from "../../types/experiment";
import type { Language } from "../../i18n/translations";
import { stringSearchPersistenceTexts } from "../../i18n/stringSearchPersistence";
import { StringSearchResults } from "./StringSearchResults";
/** Read-only snapshot rendering; no algorithm registry or evaluation imports. */
export function SavedStringSearch({ experiment, language }: { experiment: StringSearchExperiment; language: Language }) {
  const t = stringSearchPersistenceTexts[language];
  const input = experiment.input_snapshot.input;
  return <section>
    <h3>#{experiment.id} · {experiment.name} · String Search</h3><p>{t.note}</p>
    <p>{t.selected}: {experiment.results.map(row => row.implementation_snapshot.name).join(", ")}</p>
    <StringSearchResults result={{input, rows: experiment.results.map(row => row.measurement)}} language={language} />
    <details><summary>{t.input}</summary><pre style={{overflowX:"auto", maxHeight:"24rem"}} tabIndex={0}>{JSON.stringify(input)}</pre></details>
    <details><summary>{t.trace}</summary>{experiment.results.map(row => <p key={row.id}>
      {row.implementation_snapshot.name}: {row.measurement.status === "completed" ? row.measurement.alignments.join(", ") : "—"}
    </p>)}</details>
  </section>;
}
