import { useExperimentSave } from "../../evaluation/useExperimentSave";
import { useState } from "react";
import type { FormEvent } from "react";
import type { Language } from "../../i18n/translations";
import type { StringSearchSnapshot } from "../../stringSearch/persistence";
import { stringSearchPersistenceTexts } from "../../i18n/stringSearchPersistence";
import { saveStringSearch } from "../../services/apiClient";

export function SaveStringSearch({ snapshot, language }: { snapshot: StringSearchSnapshot; language: Language }) {
  const t = stringSearchPersistenceTexts[language];
  const [name, setName] = useState("");
  const {state: {status, id}, save} = useExperimentSave();
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    void save(signal => saveStringSearch(name.trim(), snapshot, signal), 30_000);
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
