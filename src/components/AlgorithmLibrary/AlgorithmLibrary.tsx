import { PathfindingEducation } from "./PathfindingEducation";
import {
  useEffect,
  useState,
} from "react";

import { getAlgorithms } from "../../services/apiClient";
import type { Algorithm } from "../../types/algorithm";
import type { Language } from "../../i18n/translations";
import { ImplementationReview } from "../ImplementationReview/ImplementationReview";

import "./AlgorithmLibrary.css";
import { EducationalContent } from "./EducationalContent";

type RequestStatus =
  | "loading"
  | "success"
  | "error";

export interface AlgorithmLibraryTexts {
  eyebrow: string;
  title: string;
  description: string;
  loading: string;
  error: string;
  retry: string;
  empty: string;
  problem: string;
  bestCase: string;
  averageCase: string;
  worstCase: string;
  spaceComplexity: string;
  implementations: string;
  reference: string;
}

interface AlgorithmLibraryProps {
  texts: AlgorithmLibraryTexts;
  language: Language;
}

export function AlgorithmLibrary({
  texts, language,
}: AlgorithmLibraryProps) {
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [status, setStatus] =
    useState<RequestStatus>("loading");

  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isActive = true;

    async function loadAlgorithms() {
      try {
        const response = await getAlgorithms();

        if (isActive) {
          setAlgorithms(response);
          setStatus("success");
        }
      } catch {
        if (isActive) {
          setStatus("error");
        }
      }
    }

    void loadAlgorithms();

    return () => {
      isActive = false;
    };
  }, [retryCount]);

  function handleRetry() {
    setStatus("loading");
    setRetryCount((currentCount) => currentCount + 1);
  }

  return (
    <section
      className="algorithm-library"
      aria-labelledby="algorithm-library-title"
    >
      <header className="algorithm-library__header">
        <p className="algorithm-library__eyebrow">
          {texts.eyebrow}
        </p>

        <h2 id="algorithm-library-title">
          {texts.title}
        </h2>

        <p className="algorithm-library__description">
          {texts.description}
        </p>
      </header>

      <PathfindingEducation language={language} />
      <h3>Sorting</h3>

      {status === "loading" && (
        <div
          className="algorithm-library__message"
          role="status"
        >
          <span
            className="algorithm-library__loader"
            aria-hidden="true"
          />

          <span>{texts.loading}</span>
        </div>
      )}

      {status === "error" && (
        <div
          className="
            algorithm-library__message
            algorithm-library__message--error
          "
          role="alert"
        >
          <p>{texts.error}</p>

          <button
            type="button"
            className="algorithm-library__retry-button"
            onClick={handleRetry}
          >
            {texts.retry}
          </button>
        </div>
      )}

      {status === "success" &&
        algorithms.length === 0 && (
          <p className="algorithm-library__message">
            {texts.empty}
          </p>
        )}

      {status === "success" &&
        algorithms.length > 0 && (
          <div className="algorithm-library__grid">
            {algorithms.map((algorithm) => (
              <article
                className="algorithm-card"
                key={algorithm.slug}
              >
                <header className="algorithm-card__header">
                  <div>
                    <p className="algorithm-card__problem">
                      {texts.problem}: {algorithm.problem}
                    </p>

                    <h3>{algorithm.name}</h3>
                  </div>

                  <code className="algorithm-card__slug">
                    {algorithm.slug}
                  </code>
                </header>

                <p className="algorithm-card__description">
                  {algorithm.education?.[language]?.what ?? algorithm.description}
                </p>

                <dl className="algorithm-card__complexities">
                  <div>
                    <dt>{texts.bestCase}</dt>
                    <dd>
                      {algorithm.best_case_complexity}
                    </dd>
                  </div>

                  <div>
                    <dt>{texts.averageCase}</dt>
                    <dd>
                      {algorithm.average_case_complexity}
                    </dd>
                  </div>

                  <div>
                    <dt>{texts.worstCase}</dt>
                    <dd>
                      {algorithm.worst_case_complexity}
                    </dd>
                  </div>

                  <div>
                    <dt>{texts.spaceComplexity}</dt>
                    <dd>
                      {algorithm.space_complexity}
                    </dd>
                  </div>
                </dl>

                <EducationalContent algorithm={algorithm} language={language} />
                <footer className="algorithm-card__footer">
                  <p className="algorithm-card__footer-title">
                    {texts.implementations}
                  </p>

                  <div className="algorithm-card__implementations">
                    {algorithm.implementations.map(
                      (implementation) => (
                        <span
                          className="
                            algorithm-card__implementation
                          "
                          key={`${algorithm.slug}-${implementation.slug}`}
                        >
                          {implementation.name}

                          <small>
                            {implementation.language}

                            {implementation.is_reference
                              ? ` · ${texts.reference}`
                              : ""}
                          </small>
                        </span>
                      ),
                    )}
                  </div>
                </footer>
                {algorithm.implementations.map(implementation => <ImplementationReview
                  key={implementation.id} implementationId={implementation.id} language={language}
                  name={`${algorithm.name} · ${implementation.name}`} />)}
              </article>
            ))}
          </div>
        )}
    </section>
  );
}
