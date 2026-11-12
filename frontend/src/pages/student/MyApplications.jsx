
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { getMyApplications } from "../../services/applicationService";

import "./MyApplications.css";


function formatDate(dateString) {
  if (!dateString) return "Date unavailable";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}


function formatStatus(status) {
  if (!status) return "Unknown";

  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}


function getStatusClass(status) {
  const normalized = (status || "unknown")
    .toLowerCase()
    .replaceAll(" ", "_");

  const knownStatuses = [
    "applied",
    "under_review",
    "shortlisted",
    "interview_scheduled",
    "selected",
    "rejected",
    "withdrawn",
  ];

  return knownStatuses.includes(normalized)
    ? normalized
    : "unknown";
}


function ApplicationCard({ application }) {
  const job = application.job || {};

  const matchScore = application.match_score;

  const hasMatch =
    matchScore !== null &&
    matchScore !== undefined &&
    Number.isFinite(Number(matchScore));

  const status = application.status || "unknown";

  return (
    <article className="application-card">

      <div className="application-card-header">

        <div>
          <span className="application-label">
            JOB APPLICATION
          </span>

          <h2>{job.title || "Untitled Position"}</h2>

          <p className="application-company">
            {job.company_name || "Unknown Company"}
          </p>
        </div>

        <span
          className={`application-status status-${getStatusClass(status)}`}
        >
          {formatStatus(status)}
        </span>

      </div>

      <div className="application-details-grid">

        <div className="application-detail">
          <span>Application ID</span>
          <strong>#{application.id}</strong>
        </div>

        <div className="application-detail">
          <span>Job ID</span>
          <strong>{application.job_id}</strong>
        </div>

        <div className="application-detail">
          <span>Location</span>
          <strong>{job.location || "Not specified"}</strong>
        </div>

        <div className="application-detail">
          <span>Job Type</span>
          <strong>{job.job_type || "Not specified"}</strong>
        </div>

        <div className="application-detail">
          <span>Salary</span>
          <strong>{job.salary || "Not disclosed"}</strong>
        </div>

        <div className="application-detail">
          <span>Applied On</span>
          <strong>{formatDate(application.applied_at)}</strong>
        </div>

      </div>

      <div className="application-match">

        <div className="application-match-heading">
          <span>AI Resume Match</span>

          <strong>
            {hasMatch
              ? `${Number(matchScore).toFixed(2)}%`
              : "Not available"}
          </strong>
        </div>

        {hasMatch && (
          <div className="application-match-progress">
            <div
              className="application-match-fill"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(0, Number(matchScore))
                )}%`,
              }}
            />
          </div>
        )}

      </div>

      <div className="application-card-footer">
        <span>
          Application ID: {application.id}
        </span>

        <span className="application-submitted">
          ✓ Application submitted
        </span>
      </div>

    </article>
  );
}


export default function MyApplications() {
  const [applications, setApplications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getMyApplications();

      setApplications(
        Array.isArray(result) ? result : []
      );

    } catch (err) {
      setError(
        err.message || "Unable to load your applications."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const stats = useMemo(() => {
    const total = applications.length;

    const shortlisted = applications.filter(
      (application) =>
        ["shortlisted", "interview_scheduled", "selected"].includes(
          (application.status || "").toLowerCase()
        )
    ).length;

    const pending = applications.filter(
      (application) =>
        ["applied", "under_review"].includes(
          (application.status || "").toLowerCase()
        )
    ).length;

    return {
      total,
      shortlisted,
      pending,
    };
  }, [applications]);

  return (
    <main className="my-applications-page">

      {/* Header */}
      <header className="applications-header">

        <div>
          <span className="applications-eyebrow">
            PLACEMENT TRACKER
          </span>

          <h1>My Applications</h1>

          <p>
            Track your submitted job applications and monitor
            your placement journey.
          </p>
        </div>

        <Link
          to="/student/dashboard"
          className="applications-back-link"
        >
          ← Dashboard
        </Link>

      </header>

      {/* Summary statistics */}
      <section className="applications-stats">

        <div className="application-stat-card">
          <span>Total Applications</span>
          <strong>{stats.total}</strong>
        </div>

        <div className="application-stat-card">
          <span>Pending Applications</span>
          <strong>{stats.pending}</strong>
        </div>

        <div className="application-stat-card">
          <span>Shortlisted / Selected</span>
          <strong>{stats.shortlisted}</strong>
        </div>

      </section>

      {/* Application history */}
      <section className="applications-content">

        <div className="applications-section-heading">

          <div>
            <h2>Application History</h2>

            <p>
              All jobs you have successfully applied for.
            </p>
          </div>

          <button
            className="applications-refresh-button"
            onClick={loadApplications}
            disabled={loading}
          >
            {loading ? "Loading..." : "↻ Refresh"}
          </button>

        </div>

        {loading ? (

          <div className="applications-state">
            <div className="applications-spinner" />
            <p>Loading your applications...</p>
          </div>

        ) : error ? (

          <div className="applications-state applications-error">
            <h3>Unable to load applications</h3>
            <p>{error}</p>

            <button onClick={loadApplications}>
              Try Again
            </button>
          </div>

        ) : applications.length === 0 ? (

          <div className="applications-empty">
            <div className="applications-empty-icon">▤</div>

            <h3>No applications yet</h3>

            <p>
              You haven't applied for any placement opportunities.
              Explore available jobs and submit your first application.
            </p>

            <Link
              to="/student/jobs"
              className="applications-jobs-button"
            >
              Explore Jobs →
            </Link>
          </div>

        ) : (

          <>
            <div className="applications-count">
              {applications.length} application
              {applications.length !== 1 ? "s" : ""} found
            </div>

            <div className="applications-list">
              {applications.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                />
              ))}
            </div>

            <div className="applications-bottom-link">
              <Link to="/student/jobs">
                Explore More Opportunities →
              </Link>
            </div>
          </>

        )}

      </section>

    </main>
  );
}
