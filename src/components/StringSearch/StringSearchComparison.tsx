import { captureStringSearch } from "../../stringSearch/persistence";
import { SaveStringSearch } from "./SaveStringSearch";
import { useState } from "react";
import type { Language } from "../../i18n/translations";
import { stringSearchComparisonTexts } from "../../i18n/stringSearchComparison";
import { STRING_SEARCH_ALGORITHMS, MAX_TEXT_LENGTH, MAX_PATTERN_LENGTH } from "../../stringSearch/evaluation";
import type { StringSearchAlgorithm } from "../../stringSearch/evaluation";
import { STRING_SEARCH_NAMES } from "../../stringSearch/registry";
import { runStringSearchComparison } from "../../stringSearch/comparison";
import type { StringSearchComparisonResult } from "../../stringSearch/comparison";
import { StringSearchResults } from "./StringSearchResults";
export function StringSearchComparison({language}: {language: Language}) {
  const t = stringSearchComparisonTexts[language];
  const [algorithms,setAlgorithms] = useState<StringSearchAlgorithm[]>([...STRING_SEARCH_ALGORITHMS]);
  const [text,setText] = useState("aaaaab"), [pattern,setPattern] = useState("aaab");
  const [result,setResult] = useState<StringSearchComparisonResult|null>(null);
  const [revision,setRevision] = useState(0);
  const [error,setError] = useState<"invalid"|"selection"|null>(null);
  function clear() {setResult(null);setError(null);setRevision(previous=>previous+1); }
  return <section className="benchmark" aria-labelledby="string-search-comparison-title">
    <h2 id="string-search-comparison-title">{t.title}</h2><p>{t.note}</p>
    <form onSubmit={event=>{event.preventDefault();clear();try {setResult(runStringSearchComparison(text,pattern,algorithms));}catch(error){setError(error instanceof Error && error.message === "invalid_selection" ? "selection" : "invalid");}}}>
      <fieldset><legend>{t.select}</legend>{STRING_SEARCH_ALGORITHMS.map(key=><label key={key}><input type="checkbox" checked={algorithms.includes(key)} onChange={event=>{setAlgorithms(previous=>event.target.checked?[...previous,key]:previous.filter(item=>item!==key));clear();}} />{STRING_SEARCH_NAMES[key]}</label>)}</fieldset>
      <div className="benchmark__fields">
        <label>{t.text}<textarea value={text} maxLength={MAX_TEXT_LENGTH} onChange={event=>{setText(event.target.value);clear();}} /></label>
        <label>{t.pattern}<textarea value={pattern} maxLength={MAX_PATTERN_LENGTH} onChange={event=>{setPattern(event.target.value);clear();}} /></label>
        <button type="submit">{t.run}</button>
      </div>
    </form>
    {error&&<p role="alert">{t[error]}</p>}
    {result?<><StringSearchResults result={result} language={language}/><SaveStringSearch key={revision} snapshot={captureStringSearch(result.input,result.rows)} language={language}/></>:<p>{t.empty}</p>}
  </section>;
}
