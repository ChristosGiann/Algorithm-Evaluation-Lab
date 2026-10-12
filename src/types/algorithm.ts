export type AlgorithmImplementationSourceType =
  | "built_in"
  | "custom";

export interface AlgorithmImplementation {
  id: number;
  name: string;
  slug: string;
  language: string;
  source_type: AlgorithmImplementationSourceType;
  is_reference: boolean;
  is_active: boolean;
  executable: boolean;
}

export type { EducationalText } from "../education/content";
import type { EducationMetadata } from "../education/content";

export interface Algorithm {
  education?: EducationMetadata | null;
  name: string;
  slug: string;
  description: string;
  problem: string;
  best_case_complexity: string;
  average_case_complexity: string;
  worst_case_complexity: string;
  space_complexity: string;
  implementations: AlgorithmImplementation[];
}
