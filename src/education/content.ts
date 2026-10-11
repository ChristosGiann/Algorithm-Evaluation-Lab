import type { Language } from "../i18n/translations";
import { educationTexts } from "../i18n/education";

export interface EducationSection {
  id: string;
  title: string;
  paragraphs?: readonly string[];
  steps?: readonly string[];
  codeSteps?: readonly string[];
}
export interface EducationalText {
  what?: string; intuition?: string; how?: string[]; strengths?: string;
  weaknesses?: string; uses?: string; pitfalls?: string; complexity?: string;
  completeness?: string; optimality?: string; weights?: string; example?: string[];
  /** Localized family-specific sections, rendered without new component branches. */
  sections?: readonly EducationSection[];
}
export interface EducationMetadata {
  el?: EducationalText; en?: EducationalText;
  stable?: boolean; in_place?: boolean; walkthrough?: number[][];
}
export interface EducationalAlgorithm {
  slug: string;
  name: string;
  education?: EducationMetadata | null;
}
const commonKeys = ["what", "intuition", "complexity", "strengths", "weaknesses", "uses", "pitfalls"] as const;
const hasText = (text: string) => text.trim().length > 0;

/** Adapt legacy catalogue/domain fields without changing their serialized shape. */
export function educationSections(metadata: EducationMetadata | null | undefined, language: Language): EducationSection[] {
  const content = metadata?.[language];
  if (!metadata || !content) return [];
  const t = educationTexts[language];
  const sections: EducationSection[] = [];
  for (const key of commonKeys) {
    if (content[key]?.trim()) sections.push({ id: key, title: t[key], paragraphs: [content[key]] });
    if (key === "intuition" && content.how?.length) {
      sections.push({ id: "how", title: t.how, steps: content.how });
    }
  }
  for (const key of ["completeness", "optimality", "weights"] as const) {
    if (content[key]?.trim()) sections.push({ id: key, title: t[key], paragraphs: [content[key]] });
  }
  if (metadata.stable != null) sections.push({
    id: "stable", title: t.stable, paragraphs: [t.stability, metadata.stable ? t.yes : t.no],
  });
  if (metadata.in_place != null) sections.push({
    id: "in_place", title: t.inPlace, paragraphs: [metadata.in_place ? t.yes : t.no],
  });
  sections.push(...(content.sections ?? []));
  if (content.example?.length || metadata.walkthrough?.length) sections.push({
    id: "walkthrough", title: t.example, steps: content.example,
    codeSteps: metadata.walkthrough?.map(values => `[${values.join(", ")}]`),
  });
  return sections.map(section => ({
    ...section,
    paragraphs: section.paragraphs?.filter(hasText),
    steps: section.steps?.filter(hasText),
    codeSteps: section.codeSteps?.filter(hasText),
  })).filter(section => section.title.trim()
    && (section.paragraphs?.length || section.steps?.length || section.codeSteps?.length));
}
