import { useExperimentSave } from "../../evaluation/useExperimentSave";
import { useState } from "react";
import type { Language } from "../../i18n/translations";
import { saveComparison } from "../../services/apiClient";
import { comparisonSaveTexts } from "../../i18n/comparisonSave";

export function SaveComparison({ token, language }: { token: string; language: Language }) {
  const t = comparisonSaveTexts[language];
  const [name, setName] = useState("");
  const {state, save} = useExperimentSave();
  const busy = state.status === "saving", error = state.status === "error", id = state.id;
  function submit() {
    if (!name.trim()) return;
    void save(signal => saveComparison(name.trim(), token, signal), 15_000);
  }
  return <div>{id ? <p role="status">{t.saved} #{id}. {t.history}</p> : <>
    <label>{t.name}<input maxLength={200} value={name} disabled={busy} onChange={event => setName(event.target.value)} /></label>
    <button disabled={busy || !name.trim()} onClick={submit}>{t.save}</button><p>{t.note}</p>
    {error && <p role="alert">{t.error}</p>}</>}</div>;
}
