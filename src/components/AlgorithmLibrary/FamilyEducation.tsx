import type { Language } from "../../i18n/translations";
import type { EducationalAlgorithm } from "../../education/content";
import { EducationalContent } from "./EducationalContent";

/** Data-driven family cards; no algorithm-specific rendering or execution. */
export function FamilyEducation({ id, title, algorithms, language }: {
  id: string; title: string; algorithms: readonly EducationalAlgorithm[]; language: Language;
}) {
  return <section aria-labelledby={`${id}-education-title`}>
    <h3 id={`${id}-education-title`}>{title}</h3>
    <div className="algorithm-library__grid">
      {algorithms.map(algorithm => <article className="algorithm-card" key={algorithm.slug}>
        <header className="algorithm-card__header"><h4>{algorithm.name}</h4><code>{algorithm.slug}</code></header>
        {algorithm.education?.[language]?.what && <p>{algorithm.education[language].what}</p>}
        <EducationalContent algorithm={algorithm} language={language} />
      </article>)}
    </div>
  </section>;
}
