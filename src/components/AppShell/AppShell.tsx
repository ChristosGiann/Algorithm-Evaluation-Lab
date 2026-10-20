import { useEffect, useReducer, useRef } from "react";
import type { ReactNode } from "react";
import type { Language } from "../../i18n/translations";
import { translations } from "../../i18n/translations";
import { workspaceTexts } from "../../i18n/workspace";
import { BackendStatus } from "../BackendStatus/BackendStatus";
import { WORKSPACES, navigate, workspaceFromHash } from "./navigation";
import type { Workspace } from "./navigation";

export function AppShell({ language, onLanguageChange, children }: {
  language: Language; onLanguageChange: (language: Language) => void;
  children: Record<Workspace, ReactNode>;
}) {
  const [state, dispatch] = useReducer(navigate, undefined, () => {
    const active = workspaceFromHash(typeof window === "undefined" ? "" : window.location.hash);
    return { active, visited: [active] };
  });
  const heading = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);
  const t = workspaceTexts[language];
  const app = translations[language].app;
  useEffect(() => {
    const update = () => { if (window.location.hash !== "#workspace-content") dispatch(workspaceFromHash(window.location.hash)); };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    heading.current?.focus();
  }, [state.active]);
  return <div className="console-shell">
    <a className="skip-link" href="#workspace-content" onClick={event => { event.preventDefault(); document.getElementById("workspace-content")?.focus(); }}>{t.skip}</a>
    <aside className="console-sidebar">
      <div className="console-brand"><span className="console-mark" aria-hidden="true">λ</span><span>{t.brand}<small>{t.console}</small></span></div>
      <nav aria-label={t.navigation}>
        {WORKSPACES.map((key, index) => <a key={key} href={`#${key}`} aria-current={state.active === key ? "page" : undefined}>
          <span className="nav-index" aria-hidden="true">{String(index).padStart(2, "0")}</span>{t.sections[key].title}
        </a>)}
      </nav>
    </aside>
    <div className="console-body">
      <header className="workspace-header">
        <div><p className="eyebrow">{t.console}</p><h1 ref={heading} tabIndex={-1}>{t.sections[state.active].title}</h1><p>{t.sections[state.active].description}</p></div>
        <div className="workspace-utilities"><BackendStatus texts={translations[language].backendStatus} />
          <label htmlFor="app-language">{app.language}<select id="app-language" value={language} onChange={event => {
            if (event.target.value === "el" || event.target.value === "en") onLanguageChange(event.target.value);
          }}><option value="el" lang="el">{app.greek}</option><option value="en" lang="en">{app.english}</option></select></label>
        </div>
      </header>
      <main id="workspace-content" tabIndex={-1}>
        {state.visited.map(key => <div key={key} hidden={state.active !== key} className={`workspace workspace--${key}`}>{children[key]}</div>)}
      </main>
    </div>
  </div>;
}

export function Overview({ language }: { language: Language }) {
  const t = workspaceTexts[language];
  return <><section className="overview-intro"><p className="eyebrow">ALGORITHM EVALUATION LAB</p><h2>{t.welcome}</h2><p>{t.introduction}</p></section>
    <div className="workspace-cards">{WORKSPACES.filter(key => key !== "overview").map((key, index) => <a className="workspace-card" href={`#${key}`} key={key}>
      <span className="workspace-card__number" aria-hidden="true">0{index + 1}</span><h3>{t.sections[key].title}</h3><p>{t.sections[key].description}</p><span className="workspace-card__action">{t.open} <span aria-hidden="true">↗</span></span>
    </a>)}</div><p className="console-notice">{t.note}</p></>;
}
