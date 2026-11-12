
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getJobs } from "../../services/jobService";

import {
  applyForJob,
  getMyApplications,
} from "../../services/applicationService";

import "./JobListings.css";


/* =========================================
   APPLICATION RESPONSE HELPERS
========================================= */

function extractApplications(response) {
  if (Array.isArray(response)) {
    return response;
  }

  const possibleArrays = [
    response?.applications,
    response?.data?.applications,
    response?.data,
    response?.results,
    response?.items,
    response?.data?.results,
    response?.data?.items,
  ];

  return possibleArrays.find(Array.isArray) || [];
}


function getApplicationJobId(application) {
  const rawJobId =
    application?.job_id ??
    application?.jobId ??
    application?.job?.id ??
    application?.job?.job_id ??
    application?.job_details?.id ??
    application?.job_details?.job_id;

  if (rawJobId === undefined || rawJobId === null) {
    return null;
  }

  const jobId = Number(rawJobId);

  return Number.isFinite(jobId) && jobId > 0
    ? jobId
    : null;
}


function buildAppliedJobIds(response) {
  const applications = extractApplications(response);

  return new Set(
    applications
      .map(getApplicationJobId)
      .filter((id) => id !== null)
  );
}


/* =========================================
   DATE FORMATTING
========================================= */

function formatDate(dateString) {
  if (!dateString) return "Not specified";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Not specified";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}


/* =========================================
   SKILL TAG
========================================= */

function SkillTag({ skill, type }) {
  return (
    <span className={`skill-tag skill-tag-${type}`}>
      {skill}
    </span>
  );
}


/* =========================================
   JOB CARD
========================================= */

function JobCard({
  job,
  isApplied,
  isApplying,
  onApply,
}) {
  const eligibility = job.eligibility || {};
  const match = job.resume_match || {};

  const isEligible = eligibility.is_eligible === true;
  const hasMatch = match.available === true;

  return (
    <article className="job-card">

      {/* JOB TITLE AND ELIGIBILITY */}

      <div className="job-card-top">
        <div>
          <span className="job-type">
            {job.job_type || "Opportunity"}
          </span>

          <h2 className="job-title">
            {job.title}
          </h2>

          <p className="job-company">
            {job.company_name || `Company #${job.company_id}`}
          </p>
        </div>

        <span
          className={`eligibility-badge ${
            isEligible ? "eligible" : "not-eligible"
          }`}
        >
          {eligibility.status || "Eligibility unavailable"}
        </span>
      </div>

      {/* JOB DESCRIPTION */}

      <p className="job-description">
        {job.description || "No job description provided."}
      </p>

      {/* JOB DETAILS */}

      <div className="job-info-grid">
        <div>
          <span className="info-label">Location</span>
          <strong>{job.location || "Not specified"}</strong>
        </div>

        <div>
          <span className="info-label">Salary</span>
          <strong>{job.salary || "Not disclosed"}</strong>
        </div>

        <div>
          <span className="info-label">Minimum CGPA</span>
          <strong>
            {job.min_cgpa ?? "No minimum specified"}
          </strong>
        </div>

        <div>
          <span className="info-label">Application deadline</span>
          <strong>{formatDate(job.application_deadline)}</strong>
        </div>
      </div>

      {/* ACADEMIC ELIGIBILITY */}

      <div className="job-section">
        <h3>Eligibility assessment</h3>

        {isEligible ? (
          <p className="assessment-success">
            Your academic profile meets the listed eligibility criteria.
          </p>
        ) : (
          <div className="assessment-warning">
            {eligibility.reasons?.length ? (
              <ul>
                {eligibility.reasons.map((reason, index) => (
                  <li key={`${job.id}-reason-${index}`}>
                    {reason}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Eligibility could not be confirmed.</p>
            )}
          </div>
        )}
      </div>

      {/* AI RESUME MATCHING */}

      <div className="job-section">
        <div className="match-heading">
          <h3>AI resume match</h3>

          {hasMatch ? (
            <strong className="match-score">
              {Number(match.match_score).toFixed(2)}%
            </strong>
          ) : (
            <span className="match-unavailable">
              Not available
            </span>
          )}
        </div>

        {hasMatch ? (
          <>
            <div className="match-progress">
              <div
                className="match-progress-fill"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, Number(match.match_score) || 0)
                  )}%`,
                }}
              />
            </div>

            {/* MATCHED SKILLS */}

            <div className="skill-group">
              <h4>Matched skills</h4>

              {match.matched_skills?.length ? (
                <div className="skill-list">
                  {match.matched_skills.map((skill) => (
                    <SkillTag
                      key={`${job.id}-matched-${skill}`}
                      skill={skill}
                      type="matched"
                    />
                  ))}
                </div>
              ) : (
                <p className="empty-skill">
                  No matching skills found.
                </p>
              )}
            </div>

            {/* SKILLS TO IMPROVE */}

            <div className="skill-group">
              <h4>Skills to improve</h4>

              {match.missing_skills?.length ? (
                <div className="skill-list">
                  {match.missing_skills.map((skill) => (
                    <SkillTag
                      key={`${job.id}-missing-${skill}`}
                      skill={skill}
                      type="missing"
                    />
                  ))}
                </div>
              ) : (
                <p className="empty-skill">
                  No missing skills identified.
                </p>
              )}
            </div>
          </>
        ) : (
          <p className="no-resume-message">
            {match.message ||
              "Upload an active resume to see your match score."}
          </p>
        )}
      </div>

      {/* APPLICATION ACTION */}

      <div className="job-application-section">
        {isApplied ? (
          <div className="application-already-applied">
            <span>✓</span>
            Already Applied
          </div>
        ) : (
          <button
            type="button"
            className={`apply-job-button ${
              !isEligible ? "apply-job-disabled" : ""
            }`}
            disabled={!isEligible || isApplying}
            onClick={() => onApply(job)}
          >
            {isApplying
              ? "Submitting..."
              : !isEligible
                ? "Not Eligible"
                : "Apply Now →"}
          </button>
        )}
      </div>

      {/* CARD FOOTER */}

      <div className="job-card-footer">
        <span>
          {job.required_skills?.length || 0} required skills
        </span>

        <span>Job ID: {job.id}</span>
      </div>

    </article>
  );
}


/* =========================================
   MAIN JOB LISTINGS PAGE
========================================= */

export default function JobListings() {
  const [jobs, setJobs] = useState([]);

  const [appliedJobIds, setAppliedJobIds] = useState(
    () => new Set()
  );

  const [loading, setLoading] = useState(true);
  const [applyingJobId, setApplyingJobId] = useState(null);

  const [error, setError] = useState("");

  const [applicationFeedback, setApplicationFeedback] = useState({
    message: "",
    type: "",
  });


  /* =======================================
     LOAD JOBS AND APPLICATION HISTORY
  ======================================= */

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [jobsResult, applicationsResult] = await Promise.all([
        getJobs(),
        getMyApplications(),
      ]);

      const loadedJobs = Array.isArray(jobsResult)
        ? jobsResult
        : [];

      const appliedIds = buildAppliedJobIds(
        applicationsResult
      );

      setJobs(loadedJobs);
      setAppliedJobIds(appliedIds);

    } catch (err) {
      console.error(
        "Unable to load jobs or applications:",
        err
      );

      setError(
        err.message || "Unable to load jobs. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    loadJobs();
  }, [loadJobs]);


  /* =======================================
     SUBMIT APPLICATION
  ======================================= */

  const handleApply = async (job) => {
    setApplicationFeedback({
      message: "",
      type: "",
    });

    if (!job.eligibility?.is_eligible) {
      return;
    }

    const numericJobId = Number(job.id);

    // Prevent duplicate applications.
    if (appliedJobIds.has(numericJobId)) {
      return;
    }

    setApplyingJobId(job.id);

    try {
      const response = await applyForJob(job.id);

      // Immediately mark the job as applied.
      setAppliedJobIds((previous) => {
        const updated = new Set(previous);
        updated.add(numericJobId);
        return updated;
      });

      setApplicationFeedback({
        message:
          response.message || "Application submitted successfully.",
        type: "success",
      });

    } catch (err) {
      console.error("Application submission failed:", err);

      // Recover if the backend reports a duplicate application.
      if (err.status === 409) {
        try {
          const applicationsResponse = await getMyApplications();

          setAppliedJobIds(
            buildAppliedJobIds(applicationsResponse)
          );

        } catch (refreshError) {
          console.error(
            "Unable to refresh applications:",
            refreshError
          );
        }
      }

      setApplicationFeedback({
        message:
          err.message || "Unable to submit application.",
        type: "error",
      });

    } finally {
      setApplyingJobId(null);
    }
  };


  /* =======================================
     DASHBOARD STATISTICS
  ======================================= */

  const stats = useMemo(() => {
    const eligible = jobs.filter(
      (job) => job.eligibility?.is_eligible
    ).length;

    const scores = jobs
      .filter((job) => job.resume_match?.available)
      .map((job) => Number(job.resume_match.match_score))
      .filter((score) => Number.isFinite(score));

    const averageMatch = scores.length
      ? (
          scores.reduce((total, score) => total + score, 0) /
          scores.length
        ).toFixed(1)
      : null;

    return {
      total: jobs.length,
      eligible,
      averageMatch,
    };
  }, [jobs]);


  /* =======================================
     MAIN PAGE
  ======================================= */

  return (
    <main className="job-listings-page">

      {/* PAGE HEADER */}

      <header className="jobs-page-header">
        <div>
          <span className="page-eyebrow">
            PLACEMENT OPPORTUNITIES
          </span>

          <h1>Find your next opportunity</h1>

          <p>
            Explore jobs, check your academic eligibility and discover
            how well your resume matches each opportunity.
          </p>
        </div>

        <button
          className="refresh-jobs-button"
          onClick={loadJobs}
          disabled={loading}
        >
          {loading ? "Loading..." : "↻ Refresh jobs"}
        </button>
      </header>

      {/* JOB SUMMARY */}

      <section className="job-summary">
        <div className="summary-card">
          <span>Total opportunities</span>
          <strong>{stats.total}</strong>
        </div>

        <div className="summary-card">
          <span>Eligible opportunities</span>
          <strong>{stats.eligible}</strong>
        </div>

        <div className="summary-card">
          <span>Average resume match</span>
          <strong>
            {stats.averageMatch !== null
              ? `${stats.averageMatch}%`
              : "—"}
          </strong>
        </div>
      </section>

      {/* APPLICATION FEEDBACK */}

      {applicationFeedback.message && (
        <div
          className={`application-feedback application-feedback-${applicationFeedback.type}`}
          role="status"
        >
          {applicationFeedback.message}
        </div>
      )}

      {/* JOB LISTINGS */}

      <section className="jobs-content">
        <div className="jobs-section-heading">
          <div>
            <h2>Recommended opportunities</h2>
            <p>Based on your profile and uploaded resume.</p>
          </div>

          <span>{stats.total} jobs found</span>
        </div>

        {/* LOADING */}

        {loading ? (
          <div className="jobs-state">
            <div className="jobs-loader" />
            <p>Finding placement opportunities...</p>
          </div>

        ) : error ? (
          /* ERROR */

          <div className="jobs-state jobs-error">
            <h3>Unable to load jobs</h3>
            <p>{error}</p>

            <button onClick={loadJobs}>
              Try again
            </button>
          </div>

        ) : jobs.length === 0 ? (
          /* EMPTY STATE */

          <div className="jobs-state">
            <h3>No active jobs available</h3>

            <p>
              New opportunities will appear here when available.
            </p>
          </div>

        ) : (
          /* JOB CARDS */

          <div className="jobs-grid">
            {jobs.map((job) => {
              const numericJobId = Number(job.id);
              const isApplied = appliedJobIds.has(numericJobId);

              return (
                <JobCard
                  key={job.id}
                  job={job}
                  isApplied={isApplied}
                  isApplying={applyingJobId === job.id}
                  onApply={handleApply}
                />
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
