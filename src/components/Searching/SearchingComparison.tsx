import { SaveSearching } from "./SaveSearching";
import { captureSearching } from "../../searching/persistence";
import { useState } from "react";
import type { FormEvent } from "react";
import type { Language } from "../../i18n/translations";
import { searchingComparisonTexts } from "../../i18n/searchingComparison";
import { SEARCHING_ALGORITHMS, SEARCHING_DEFINITIONS } from "../../searching/evaluation";
import type { SearchingAlgorithm } from "../../searching/evaluation";
import { runSearchingComparison } from "../../searching/comparison";
import type { SearchingComparisonResult } from "../../searching/comparison";
import { SearchingResults } from "./SearchingResults";

export function SearchingComparison({ language }: { language: Language }) {
  const t = searchingComparisonTexts[language];
  const [algorithms, setAlgorithms] = useState<SearchingAlgorithm[]>([...SEARCHING_ALGORITHMS]);
  const [values, setValues] = useState("1, 3, 5, 7, 9, 11, 13, 15");
  const [target, setTarget] = useState("11");
  const [result, setResult] = useState<SearchingComparisonResult | null>(null);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState<"invalid" | "selection" | null>(null);
  function clear() { setResult(null); setError(null); }
  function submit(event: FormEvent) {
    event.preventDefault(); clear(); setRevision(previous => previous + 1);
    try { setResult(runSearchingComparison(values, target, algorithms)); }
    catch (error) { setError(error instanceof Error && error.message === "invalid_selection" ? "selection" : "invalid"); }
  }
  return <section className="benchmark" aria-labelledby="searching-comparison-title">
    <h2 id="searching-comparison-title">{t.title}</h2><p>{t.note}</p>
    <form onSubmit={submit}>
      <fieldset><legend>{t.select}</legend>
        {SEARCHING_ALGORITHMS.map(key => <label key={key}>
          <input type="checkbox" checked={algorithms.includes(key)} onChange={event => {
            setAlgorithms(previous => event.target.checked ? [...previous, key] : previous.filter(item => item !== key)); clear();
          }} />{SEARCHING_DEFINITIONS[key].name}
        </label>)}
      </fieldset>
      <div className="benchmark__fields">
        <label>{t.values}<input value={values} maxLength={250000} onChange={event => { setValues(event.target.value); clear(); }} /></label>
        <label>{t.target}<input value={target} maxLength={100} onChange={event => { setTarget(event.target.value); clear(); }} /></label>
        <button type="submit">{t.run}</button>
      </div>
    </form>
    {error && <p role="alert">{t[error]}</p>}
    {result ? <div key={revision}><SearchingResults result={result} language={language} /><SaveSearching snapshot={captureSearching(result.input, result.rows)} language={language} /></div> : <p>{t.empty}</p>}
  </section>;
}
