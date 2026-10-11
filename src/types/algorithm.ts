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

export interface EducationalText { what?: string; intuition?: string; how?: string[]; strengths?: string; weaknesses?: string; uses?: string; pitfalls?: string; complexity?: string; completeness?: string; optimality?: string; weights?: string; example?: string[] }

export interface Algorithm {
  education?: {el?: EducationalText; en?: EducationalText; stable?: boolean; in_place?: boolean; walkthrough?: number[][]} | null;
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
