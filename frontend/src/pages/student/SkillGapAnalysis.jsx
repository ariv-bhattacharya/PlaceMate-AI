
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getAvailableCareers,
  getSkillGapAnalysis,
} from "../../services/analyticsService";

import "./SkillGapAnalysis.css";


function SkillTag({ skill, type }) {
  return (
    <span className={`gap-skill-tag gap-skill-${type}`}>
      {skill}
    </span>
  );
}


export default function SkillGapAnalysis() {
  const [careers, setCareers] = useState([]);
  const [selectedCareer, setSelectedCareer] = useState("Data Analyst");

  const [analysis, setAnalysis] = useState(null);

  const [loadingCareers, setLoadingCareers] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const [error, setError] = useState("");

  // Fetch career paths supported by the backend.
  useEffect(() => {
    const loadCareers = async () => {
      setLoadingCareers(true);
      setError("");

      try {
        const result = await getAvailableCareers();

        setCareers(result);

        if (!result.includes("Data Analyst") && result.length > 0) {
          setSelectedCareer(result[0]);
        }
      } catch (err) {
        setError(err.message || "Unable to load career paths.");
      } finally {
        setLoadingCareers(false);
      }
    };

    loadCareers();
  }, []);

  // Analyze the selected career whenever it changes.
  useEffect(() => {
    if (!selectedCareer || !careers.includes(selectedCareer)) {
      return;
    }

    let cancelled = false;

    const loadAnalysis = async () => {
      setLoadingAnalysis(true);
      setError("");
      setAnalysis(null);

      try {
        const result = await getSkillGapAnalysis(selectedCareer);

        if (!cancelled) {
          setAnalysis(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to analyze your skill gap.");
        }
      } finally {
        if (!cancelled) {
          setLoadingAnalysis(false);
        }
      }
    };

    loadAnalysis();

    return () => {
      cancelled = true;
    };
  }, [selectedCareer, careers]);

  const completion = Number(
    analysis?.completion_percentage || 0
  );

  const matchedSkills = analysis?.matched_skills || [];
  const missingSkills = analysis?.missing_skills || [];
  const matchedOptional = analysis?.matched_optional_skills || [];
  const missingOptional = analysis?.missing_optional_skills || [];

  const learningRecommendations =
    analysis?.learning_recommendations || [];

  const learningDetails = analysis?.learning_details || {};

  return (
    <main className="skill-gap-page">

      {/* Header */}
      <header className="skill-gap-header">
        <div>
          <span className="gap-eyebrow">AI CAREER ANALYTICS</span>

          <h1>Career Skill Gap Analysis</h1>

          <p>
            Discover your career readiness, identify missing skills
            and create a learning plan using your uploaded resume.
          </p>
        </div>

        <Link
          to="/student/dashboard"
          className="gap-back-button"
        >
          ← Dashboard
        </Link>
      </header>

      {/* Career selection */}
      <section className="gap-selection-card">
        <div>
          <h2>Select your target career</h2>

          <p>
            Choose a career to compare its required skills
            against your extracted resume skills.
          </p>
        </div>

        {loadingCareers ? (
          <p>Loading available careers...</p>
        ) : (
          <select
            className="gap-career-select"
            value={selectedCareer}
            onChange={(event) =>
              setSelectedCareer(event.target.value)
            }
            disabled={careers.length === 0}
          >
            {careers.map((career) => (
              <option key={career} value={career}>
                {career}
              </option>
            ))}
          </select>
        )}

        <span className="gap-career-count">
          {careers.length} career paths available
        </span>
      </section>

      {/* Error */}
      {error && (
        <div className="gap-error" role="alert">
          <strong>Unable to complete analysis</strong>
          <p>{error}</p>
          <button
            type="button"
            onClick={() =>
              setSelectedCareer((current) => current)
            }
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loadingAnalysis && (
        <div className="gap-loading">
          <div className="gap-spinner" />
          <p>Analyzing your skills for {selectedCareer}...</p>
        </div>
      )}

      {/* Analysis results */}
      {!loadingAnalysis && analysis && (
        <>
          <section className="gap-overview-card">
            <div className="gap-overview-heading">
              <div>
                <span className="gap-eyebrow">CAREER READINESS</span>
                <h2>{analysis.career}</h2>
                <p>
                  Required skill coverage based on your uploaded resume.
                </p>
              </div>

              <div className="gap-percentage">
                {completion.toFixed(2)}%
              </div>
            </div>

            <div
              className="gap-progress"
              role="progressbar"
              aria-label="Career readiness"
              aria-valuenow={completion}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div
                className="gap-progress-fill"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, completion)
                  )}%`,
                }}
              />
            </div>

            <div className="gap-progress-labels">
              <span>Required skill coverage</span>
              <strong>{matchedSkills.length} / {analysis.required_skills?.length || 0} skills matched</strong>
            </div>
          </section>

          {/* Skill statistics */}
          <section className="gap-stats-grid">
            <div className="gap-stat-card">
              <span>Required skills</span>
              <strong>{analysis.required_skills?.length || 0}</strong>
            </div>

            <div className="gap-stat-card">
              <span>Matched skills</span>
              <strong>{matchedSkills.length}</strong>
            </div>

            <div className="gap-stat-card">
              <span>Missing skills</span>
              <strong>{missingSkills.length}</strong>
            </div>
          </section>

          {/* Matched required skills */}
          <section className="gap-section">
            <div className="gap-section-heading">
              <div>
                <h2>Skills you already have</h2>
                <p>Required skills found in your resume.</p>
              </div>

              <span className="gap-count-success">
                {matchedSkills.length} matched
              </span>
            </div>

            {matchedSkills.length > 0 ? (
              <div className="gap-skills-list">
                {matchedSkills.map((skill) => (
                  <SkillTag
                    key={skill}
                    skill={skill}
                    type="matched"
                  />
                ))}
              </div>
            ) : (
              <p className="gap-empty">
                No required skills matched yet.
              </p>
            )}
          </section>

          {/* Missing required skills */}
          <section className="gap-section">
            <div className="gap-section-heading">
              <div>
                <h2>Skills you need to develop</h2>
                <p>Required skills not identified in your resume.</p>
              </div>

              <span className="gap-count-warning">
                {missingSkills.length} missing
              </span>
            </div>

            {missingSkills.length > 0 ? (
              <div className="gap-skills-list">
                {missingSkills.map((skill) => (
                  <SkillTag
                    key={skill}
                    skill={skill}
                    type="missing"
                  />
                ))}
              </div>
            ) : (
              <p className="gap-empty">
                Your resume covers all required skills in this career checklist.
              </p>
            )}
          </section>

          {/* Optional skills */}
          <section className="gap-section">
            <div className="gap-section-heading">
              <div>
                <h2>Additional skills</h2>
                <p>
                  Optional skills that can further strengthen your profile.
                </p>
              </div>
            </div>

            <div className="gap-subsection">
              <h3>Optional skills you have</h3>

              {matchedOptional.length > 0 ? (
                <div className="gap-skills-list">
                  {matchedOptional.map((skill) => (
                    <SkillTag
                      key={skill}
                      skill={skill}
                      type="matched"
                    />
                  ))}
                </div>
              ) : (
                <p className="gap-empty">None identified.</p>
              )}
            </div>

            <div className="gap-subsection">
              <h3>Optional skills to consider</h3>

              {missingOptional.length > 0 ? (
                <div className="gap-skills-list">
                  {missingOptional.map((skill) => (
                    <SkillTag
                      key={skill}
                      skill={skill}
                      type="optional"
                    />
                  ))}
                </div>
              ) : (
                <p className="gap-empty">No additional skills listed.</p>
              )}
            </div>
          </section>

          {/* Learning recommendations */}
          <section className="gap-section">
            <div className="gap-section-heading">
              <div>
                <span className="gap-eyebrow">PERSONALIZED LEARNING</span>
                <h2>Your improvement plan</h2>
                <p>
                  Learning suggestions for your missing required skills.
                </p>
              </div>
            </div>

            {learningRecommendations.length > 0 ? (
              <div className="gap-learning-list">
                {learningRecommendations.map((skill, index) => (
                  <article
                    className="gap-learning-card"
                    key={skill}
                  >
                    <div className="gap-learning-number">
                      {index + 1}
                    </div>

                    <div>
                      <h3>{skill}</h3>
                      <p>
                        {learningDetails[skill] ||
                          `Study ${skill} and complete a practical project.`}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="gap-complete-message">
                <h3>All required skills covered!</h3>
                <p>
                  Your resume contains all the required skills in
                  this career checklist.
                </p>
              </div>
            )}
          </section>

          <section className="gap-footer-card">
            <div>
              <h3>Explore matching opportunities</h3>
              <p>
                See how your resume performs against actual placement
                job descriptions.
              </p>
            </div>

            <Link to="/student/jobs" className="gap-jobs-link">
              Explore Jobs →
            </Link>
          </section>
        </>
      )}

    </main>
  );
}
