import type { Language } from "../../i18n/translations";
import { educationTexts } from "../../i18n/education";
import { educationSections, type EducationMetadata } from "../../education/content";

export function EducationalContent({ algorithm, language }: {
  algorithm: { education?: EducationMetadata | null }; language: Language;
}) {
  const t = educationTexts[language];
  const sections = educationSections(algorithm.education, language);
  if (!sections.length) return <p>{t.missing}</p>;
  return <details><summary>{t.title}</summary><p>{t.theory}</p>
    {sections.map((section, index) => <div key={`${section.id}-${index}`}>
      <h4>{section.title}</h4>
      {section.paragraphs?.map((text, i) => <p key={i}>{text}</p>)}
      {section.steps?.length ? <ol>{section.steps.map((text, i) => <li key={i}>{text}</li>)}</ol> : null}
      {section.codeSteps?.length ? <ol>{section.codeSteps.map((text, i) => <li key={i}><code>{text}</code></li>)}</ol> : null}
    </div>)}
  </details>;
}
