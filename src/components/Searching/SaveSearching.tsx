import { useExperimentSave } from "../../evaluation/useExperimentSave";
import { useState } from "react";
import type { FormEvent } from "react";
import type { Language } from "../../i18n/translations";
import type { SearchingSnapshot } from "../../searching/persistence";
import { searchingPersistenceTexts } from "../../i18n/searchingPersistence";
import { saveSearching } from "../../services/apiClient";

export function SaveSearching({ snapshot, language }: { snapshot: SearchingSnapshot; language: Language }) {
  const t = searchingPersistenceTexts[language];
  const [name, setName] = useState("");
  const {state: {status, id}, save} = useExperimentSave();
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    void save(signal => saveSearching(name.trim(), snapshot, signal), 30_000);
  }
  return <form onSubmit={submit}>
    <fieldset disabled={status === "saving" || status === "saved"}>
      <label>{t.name}<input required maxLength={200} value={name} onChange={event => setName(event.target.value)} /></label>
      <button type="submit" disabled={!name.trim()}>{status === "saving" ? t.saving : t.save}</button>
    </fieldset>
    {status === "saved" && <p role="status">{t.saved} #{id}</p>}
    {status === "error" && <p role="alert">{t.error}</p>}
  </form>;
}
