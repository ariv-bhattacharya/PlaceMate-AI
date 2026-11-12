
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPost, apiPatch } from "../../services/api";

// ============================================
// STATUS OPTIONS
// ============================================

const STATUS_OPTIONS = [
  { value: "under_review", label: "Under Review" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview_scheduled", label: "Interview Scheduled" },
  { value: "selected", label: "Selected" },
  { value: "rejected", label: "Rejected" },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatStatus(status) {
  return (status || "unknown")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(dateString) {
  if (!dateString) return "Not available";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusStyle(status) {
  const statusStyles = {
    applied: {
      background: "#eff6ff",
      color: "#2563eb",
    },
    under_review: {
      background: "#fff7ed",
      color: "#c2410c",
    },
    shortlisted: {
      background: "#ecfdf5",
      color: "#047857",
    },
    interview_scheduled: {
      background: "#f5f3ff",
      color: "#6d28d9",
    },
    selected: {
      background: "#dcfce7",
      color: "#166534",
    },
    rejected: {
      background: "#fef2f2",
      color: "#b91c1c",
    },
    pending: {
      background: "#f1f5f9",
      color: "#475569",
    },
    scheduled: {
      background: "#f5f3ff",
      color: "#6d28d9",
    },
    cleared: {
      background: "#dcfce7",
      color: "#166534",
    },
  };

  return statusStyles[status] || {
    background: "#f1f5f9",
    color: "#475569",
  };
}

const ROUND_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "scheduled", label: "Scheduled" },
  { value: "cleared", label: "Cleared" },
  { value: "rejected", label: "Rejected" },
];

function toDateTimeLocal(value) {
  if (!value) return "";

  // The backend serializes naive ISO datetimes. Preserve their local clock time.
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
    return value.slice(0, 16);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000
  );

  return localDate.toISOString().slice(0, 16);
}

function formatDateTime(dateString) {
  if (!dateString) return "Not scheduled";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Editable view for a single interview/recruitment round.
 * Saving a round updates its status, scheduled time and recruiter feedback.
 */
function RecruitmentRoundCard({ round, onSave, saving }) {
  const [status, setStatus] = useState(round.status || "pending");
  const [scheduledAt, setScheduledAt] = useState(
    toDateTimeLocal(round.scheduled_at)
  );
  const [feedback, setFeedback] = useState(round.feedback || "");

  useEffect(() => {
    setStatus(round.status || "pending");
    setScheduledAt(toDateTimeLocal(round.scheduled_at));
    setFeedback(round.feedback || "");
  }, [round.id, round.status, round.scheduled_at, round.feedback]);

  const handleSave = () => {
    onSave(round.id, {
      status,
      scheduled_at: scheduledAt || null,
      feedback: feedback.trim() || null,
    });
  };

  return (
    <div style={styles.roundCard}>
      <div style={styles.roundHeader}>
        <div>
          <strong>
            Round {round.round_number}: {round.round_name}
          </strong>
          <p style={styles.roundMeta}>
            Created {formatDate(round.created_at)}
          </p>
        </div>

        <span
          style={{
            ...styles.statusBadge,
            ...getStatusStyle(round.status || "pending"),
          }}
        >
          {formatStatus(round.status || "pending")}
        </span>
      </div>

      <div style={styles.roundFieldsGrid}>
        <label style={styles.roundField}>
          <span>Round Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            style={styles.roundInput}
            disabled={saving}
          >
            {ROUND_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label style={styles.roundField}>
          <span>Interview Date &amp; Time</span>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
            style={styles.roundInput}
            disabled={saving}
          />
        </label>
      </div>

      <label style={styles.roundField}>
        <span>Recruiter Feedback</span>
        <textarea
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          placeholder="Add interview feedback or notes..."
          rows={3}
          maxLength={5000}
          style={styles.roundTextarea}
          disabled={saving}
        />
      </label>

      <div style={styles.roundActions}>
        <span style={styles.roundMeta}>
          Scheduled: {formatDateTime(round.scheduled_at)}
        </span>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            ...styles.roundSaveButton,
            ...(saving ? styles.disabledButton : {}),
          }}
        >
          {saving ? "Saving..." : "Save Round"}
        </button>
      </div>
    </div>
  );
}


// ============================================
// APPLICANT CARD
// ============================================

function ApplicantCard({
  application,
  onStatusUpdate,
  updating,
  onCreateRound,
  onUpdateRound,
  creatingRound,
  updatingRoundId,
}) {
  const student = application.student || {};
  const job = application.job || {};

  const skills = Array.isArray(student.skills)
    ? student.skills
    : [];

  const matchScore = application.match_score;

  const hasMatch =
    matchScore !== null &&
    matchScore !== undefined &&
    Number.isFinite(Number(matchScore));

  const currentStatus = application.status || "applied";
  const rounds = Array.isArray(application.recruitment_rounds)
    ? [...application.recruitment_rounds].sort(
        (a, b) => (a.round_number || 0) - (b.round_number || 0)
      )
    : [];

  const [newRoundName, setNewRoundName] = useState("Technical Interview");
  const [newRoundStatus, setNewRoundStatus] = useState("scheduled");
  const [newRoundDate, setNewRoundDate] = useState("");
  const [newRoundFeedback, setNewRoundFeedback] = useState("");

  const handleAddRound = async (event) => {
    event.preventDefault();

    if (!newRoundName.trim()) return;

    const created = await onCreateRound(application.id, {
      round_name: newRoundName.trim(),
      status: newRoundStatus,
      scheduled_at: newRoundDate || null,
      feedback: newRoundFeedback.trim() || null,
    });

    if (created) {
      setNewRoundName("");
      setNewRoundStatus("scheduled");
      setNewRoundDate("");
      setNewRoundFeedback("");
    }
  };

  return (
    <article style={styles.applicantCard}>

      {/* APPLICANT HEADER */}

      <div style={styles.cardHeader}>
        <div style={styles.applicantIdentity}>
          <div style={styles.avatar}>
            {(student.name || "S").charAt(0).toUpperCase()}
          </div>

          <div style={styles.identityText}>
            <h3 style={styles.studentName}>
              {student.name || "Unknown Student"}
            </h3>

            <p style={styles.studentEmail}>
              {student.email || "Email unavailable"}
            </p>
          </div>
        </div>

        <span
          style={{
            ...styles.statusBadge,
            ...getStatusStyle(currentStatus),
          }}
        >
          {formatStatus(currentStatus)}
        </span>
      </div>

      {/* STUDENT ACADEMIC DETAILS */}

      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>
          Student Information
        </h4>

        <div style={styles.detailsGrid}>
          <div style={styles.detailItem}>
            <span>Branch</span>
            <strong>{student.branch || "Not provided"}</strong>
          </div>

          <div style={styles.detailItem}>
            <span>CGPA</span>
            <strong>{student.cgpa ?? "Not provided"}</strong>
          </div>

          <div style={styles.detailItem}>
            <span>Graduation Year</span>
            <strong>
              {student.graduation_year || "Not provided"}
            </strong>
          </div>

          <div style={styles.detailItem}>
            <span>Roll Number</span>
            <strong>
              {student.roll_number || "Not provided"}
            </strong>
          </div>
        </div>
      </div>

      {/* JOB INFORMATION */}

      <div style={styles.jobInfo}>
        <span>Applied for</span>

        <strong>
          {job.title || "Unknown Job"}
        </strong>

        <div style={styles.jobMeta}>
          <span>Application ID: #{application.id}</span>
          <span>
            Job ID: {application.job_id ?? job.id ?? "N/A"}
          </span>
          <span>
            Applied: {formatDate(application.applied_at)}
          </span>
        </div>
      </div>

      {/* STUDENT SKILLS */}

      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>
          Student Skills ({skills.length})
        </h4>

        {skills.length > 0 ? (
          <div style={styles.skillsContainer}>
            {skills.map((skill, index) => (
              <span
                key={`${skill}-${index}`}
                style={styles.skillBadge}
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p style={styles.mutedText}>
            No skills available.
          </p>
        )}
      </div>

      {/* AI RESUME MATCH */}

      <div style={styles.matchBox}>
        <div style={styles.matchHeading}>
          <span>AI Resume Match</span>

          <strong>
            {hasMatch
              ? `${Number(matchScore).toFixed(2)}%`
              : "Not available"}
          </strong>
        </div>

        {hasMatch && (
          <div style={styles.progressTrack}>
            <div
              style={{
                ...styles.progressFill,
                width: `${Math.min(
                  100,
                  Math.max(0, Number(matchScore))
                )}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* UPDATE APPLICATION STATUS */}

      <div style={styles.statusSection}>
        <div>
          <h4 style={styles.sectionTitle}>
            Manage Application
          </h4>

          <p style={styles.mutedText}>
            Update the candidate's recruitment status.
          </p>
        </div>

        <select
          value={currentStatus}
          disabled={updating}
          onChange={(event) =>
            onStatusUpdate(application.id, event.target.value)
          }
          style={styles.statusSelect}
          aria-label={`Update status for ${
            student.name || "applicant"
          }`}
        >
          {currentStatus === "applied" && (
            <option value="applied" disabled>
              Applied (initial status)
            </option>
          )}

          {STATUS_OPTIONS.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>

        {updating && (
          <span style={styles.updatingText}>
            Updating status...
          </span>
        )}
      </div>

      {/* RECRUITMENT / INTERVIEW ROUNDS */}

      <section style={styles.roundsSection}>
        <div style={styles.roundsHeading}>
          <div>
            <h4 style={styles.sectionTitle}>Recruitment Rounds</h4>
            <p style={styles.mutedText}>
              Schedule interviews, record outcomes and add feedback for this applicant.
            </p>
          </div>

          <span style={styles.roundCountBadge}>
            {rounds.length} {rounds.length === 1 ? "round" : "rounds"}
          </span>
        </div>

        {rounds.length > 0 ? (
          <div style={styles.roundsList}>
            {rounds.map((round) => (
              <RecruitmentRoundCard
                key={round.id}
                round={round}
                onSave={(roundId, changes) =>
                  onUpdateRound(application.id, roundId, changes)
                }
                saving={updatingRoundId === round.id}
              />
            ))}
          </div>
        ) : (
          <p style={styles.noRoundsText}>
            No recruitment rounds have been added for this application yet.
          </p>
        )}

        <form onSubmit={handleAddRound} style={styles.addRoundForm}>
          <h5 style={styles.addRoundTitle}>Add a Recruitment Round</h5>

          <div style={styles.roundFieldsGrid}>
            <label style={styles.roundField}>
              <span>Round Name *</span>
              <input
                type="text"
                value={newRoundName}
                onChange={(event) => setNewRoundName(event.target.value)}
                placeholder="e.g. Technical Interview"
                maxLength={100}
                required
                style={styles.roundInput}
                disabled={creatingRound}
              />
            </label>

            <label style={styles.roundField}>
              <span>Initial Round Status</span>
              <select
                value={newRoundStatus}
                onChange={(event) => setNewRoundStatus(event.target.value)}
                style={styles.roundInput}
                disabled={creatingRound}
              >
                {ROUND_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label style={styles.roundField}>
              <span>Interview Date &amp; Time</span>
              <input
                type="datetime-local"
                value={newRoundDate}
                onChange={(event) => setNewRoundDate(event.target.value)}
                style={styles.roundInput}
                disabled={creatingRound}
              />
            </label>
          </div>

          <label style={styles.roundField}>
            <span>Initial Feedback (Optional)</span>
            <textarea
              value={newRoundFeedback}
              onChange={(event) => setNewRoundFeedback(event.target.value)}
              placeholder="Add instructions or notes for this round..."
              rows={2}
              maxLength={5000}
              style={styles.roundTextarea}
              disabled={creatingRound}
            />
          </label>

          <div style={styles.roundActions}>
            <span style={styles.roundMeta}>
              Round number is assigned automatically.
            </span>

            <button
              type="submit"
              disabled={creatingRound || !newRoundName.trim()}
              style={{
                ...styles.roundSaveButton,
                ...(creatingRound || !newRoundName.trim()
                  ? styles.disabledButton
                  : {}),
              }}
            >
              {creatingRound ? "Adding Round..." : "+ Add Round"}
            </button>
          </div>
        </form>
      </section>

    </article>
  );
}

// ============================================
// MAIN APPLICANTS PAGE
// ============================================

export default function Applicants() {
  const [applications, setApplications] = useState([]);
  const [company, setCompany] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);
  const [roundAction, setRoundAction] = useState(null);

  // ============================================
  // LOAD APPLICANTS
  // ============================================

  const loadApplicants = useCallback(async () => {
    setLoading(true);
    setError("");
    setFeedback("");

    try {
      const response = await apiGet("/applications/recruiter");

      setApplications(
        Array.isArray(response.applications)
          ? response.applications.map((application) => ({
              ...application,
              recruitment_rounds: Array.isArray(application.recruitment_rounds)
                ? application.recruitment_rounds
                : [],
            }))
          : []
      );

      setCompany(response.company || null);

    } catch (err) {
      setError(
        err.message ||
        "Unable to load applicants. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplicants();
  }, [loadApplicants]);

  // ============================================
  // UPDATE APPLICATION STATUS
  // ============================================

  const handleStatusUpdate = async (applicationId, newStatus) => {
    const currentApplication = applications.find(
      (application) => application.id === applicationId
    );

    if (!currentApplication) return;

    const previousStatus = currentApplication.status;

    if (previousStatus === newStatus) return;

    setUpdatingId(applicationId);
    setFeedback("");
    setError("");

    try {
      const response = await apiPatch(
        `/applications/${applicationId}/status`,
        { status: newStatus }
      );

      const updatedApplication = response.application;

      setApplications((previous) =>
        previous.map((application) => {
          if (application.id !== applicationId) {
            return application;
          }

          return {
            ...application,
            ...(updatedApplication || {}),
            status: updatedApplication?.status || newStatus,
          };
        })
      );

      setFeedback(
        `Application #${applicationId} updated to ${
          formatStatus(newStatus)
        } successfully.`
      );

    } catch (err) {
      setError(
        err.message || "Unable to update application status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // ============================================
  // CREATE A RECRUITMENT ROUND
  // POST /api/applications/<application_id>/rounds
  // ============================================

  const handleCreateRound = async (applicationId, roundData) => {
    setRoundAction({ type: "create", applicationId });
    setFeedback("");
    setError("");

    try {
      const response = await apiPost(
        `/applications/${applicationId}/rounds`,
        roundData
      );

      if (!response.round) {
        throw new Error("The server did not return the created round.");
      }

      setApplications((previous) =>
        previous.map((application) => {
          if (application.id !== applicationId) return application;

          const existingRounds = Array.isArray(application.recruitment_rounds)
            ? application.recruitment_rounds
            : [];

          return {
            ...application,
            status: response.application_status || application.status,
            recruitment_rounds: [...existingRounds, response.round].sort(
              (a, b) => (a.round_number || 0) - (b.round_number || 0)
            ),
          };
        })
      );

      setFeedback(
        response.message ||
        `A recruitment round was added to Application #${applicationId}.`
      );

      return true;
    } catch (err) {
      setError(err.message || "Unable to create the recruitment round.");
      return false;
    } finally {
      setRoundAction(null);
    }
  };

  // ============================================
  // UPDATE A RECRUITMENT ROUND
  // PATCH /api/applications/<application_id>/rounds/<round_id>
  // ============================================

  const handleUpdateRound = async (applicationId, roundId, changes) => {
    setRoundAction({ type: "update", applicationId, roundId });
    setFeedback("");
    setError("");

    try {
      const response = await apiPatch(
        `/applications/${applicationId}/rounds/${roundId}`,
        changes
      );

      if (!response.round) {
        throw new Error("The server did not return the updated round.");
      }

      setApplications((previous) =>
        previous.map((application) => {
          if (application.id !== applicationId) return application;

          const existingRounds = Array.isArray(application.recruitment_rounds)
            ? application.recruitment_rounds
            : [];

          return {
            ...application,
            status: response.application_status || application.status,
            recruitment_rounds: existingRounds
              .map((round) => (
                round.id === roundId ? response.round : round
              ))
              .sort(
                (a, b) => (a.round_number || 0) - (b.round_number || 0)
              ),
          };
        })
      );

      setFeedback(
        response.message ||
        `Round ${response.round.round_number} was updated successfully.`
      );

      return true;
    } catch (err) {
      setError(err.message || "Unable to update the recruitment round.");
      return false;
    } finally {
      setRoundAction(null);
    }
  };

  // ============================================
  // SEARCH AND FILTER
  // ============================================

  const filteredApplications = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return applications.filter((application) => {
      const student = application.student || {};
      const job = application.job || {};

      const matchesSearch =
        !searchValue ||
        (student.name || "").toLowerCase().includes(searchValue) ||
        (student.email || "").toLowerCase().includes(searchValue) ||
        (student.branch || "").toLowerCase().includes(searchValue) ||
        (student.roll_number || "").toLowerCase().includes(searchValue) ||
        (job.title || "").toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "all" ||
        application.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, search, statusFilter]);

  // ============================================
  // APPLICATION STATISTICS
  // ============================================

  const stats = useMemo(() => ({
    total: applications.length,

    pending: applications.filter((application) =>
      ["applied", "under_review"].includes(
        (application.status || "").toLowerCase()
      )
    ).length,

    shortlisted: applications.filter((application) =>
      ["shortlisted", "interview_scheduled", "selected"].includes(
        (application.status || "").toLowerCase()
      )
    ).length,

    rejected: applications.filter(
      (application) =>
        (application.status || "").toLowerCase() === "rejected"
    ).length,
  }), [applications]);

  // ============================================
  // LOADING STATE
  // ============================================

  if (loading) {
    return (
      <main style={styles.statePage}>
        <div style={styles.spinner} />
        <p>Loading applicants...</p>
      </main>
    );
  }

  // ============================================
  // MAIN PAGE
  // ============================================

  return (
    <main style={styles.page}>

      {/* NAVBAR */}

      <nav style={styles.navbar}>
        <Link
          to="/recruiter/dashboard"
          style={styles.logo}
        >
          PlaceMate AI
          <span style={styles.logoTag}>RECRUITER</span>
        </Link>

        <div style={styles.navLinks}>
          <Link
            to="/recruiter/dashboard"
            style={styles.navLink}
          >
            Dashboard
          </Link>

          <Link
            to="/recruiter/jobs"
            style={styles.navLink}
          >
            Manage Jobs
          </Link>

          <Link
            to="/recruiter/applicants"
            style={styles.activeNavLink}
          >
            Applicants
          </Link>
        </div>
      </nav>

      <section style={styles.content}>

        {/* PAGE HEADER */}

        <header style={styles.header}>
          <div>
            <span style={styles.eyebrow}>
              RECRUITMENT MANAGEMENT
            </span>

            <h1>Applicants</h1>

            <p>
              Review student applications, evaluate resume matches
              and manage candidate recruitment statuses.
            </p>

            {company && (
              <div style={styles.companyInfo}>
                Company: <strong>{company.name}</strong>
              </div>
            )}
          </div>

          <button
            onClick={loadApplicants}
            disabled={loading}
            style={styles.refreshButton}
          >
            ↻ Refresh
          </button>
        </header>

        {/* SUCCESS MESSAGE */}

        {feedback && (
          <div
            style={styles.successMessage}
            role="status"
          >
            ✓ {feedback}
          </div>
        )}

        {/* ERROR MESSAGE */}

        {error && (
          <div
            style={styles.errorMessage}
            role="alert"
          >
            <span>{error}</span>

            <button
              onClick={loadApplicants}
              style={styles.retryButton}
            >
              Retry
            </button>
          </div>
        )}

        {/* STATISTICS */}

        <section style={styles.statsGrid}>
          <div style={styles.statCard}>
            <span>Total Applicants</span>
            <strong>{stats.total}</strong>
          </div>

          <div style={styles.statCard}>
            <span>Pending Applications</span>
            <strong>{stats.pending}</strong>
          </div>

          <div style={styles.statCard}>
            <span>Shortlisted / Selected</span>
            <strong>{stats.shortlisted}</strong>
          </div>

          <div style={styles.statCard}>
            <span>Rejected</span>
            <strong>{stats.rejected}</strong>
          </div>
        </section>

        {/* APPLICANT DIRECTORY */}

        <section style={styles.filterSection}>
          <div>
            <h2>Applicant Directory</h2>

            <p>
              Review all candidates who applied to your job postings.
            </p>
          </div>

          {/* SEARCH AND FILTER */}

          <div style={styles.filterControls}>
            <input
              type="search"
              placeholder="Search name, email, branch or job..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={styles.searchInput}
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              style={styles.filterSelect}
              aria-label="Filter applicants by status"
            >
              <option value="all">All Statuses</option>
              <option value="applied">Applied</option>
              <option value="under_review">Under Review</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview_scheduled">
                Interview Scheduled
              </option>
              <option value="selected">Selected</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <p style={styles.resultCount}>
            Showing {filteredApplications.length} of{" "}
            {applications.length} applicants
          </p>
        </section>

        {/* APPLICANTS LIST */}

        {applications.length === 0 ? (

          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>♙</div>

            <h3>No applicants yet</h3>

            <p>
              Students who apply to your company's jobs will appear here.
            </p>

            {/* FIXED CREATE JOB LINK */}

            <Link
              to="/recruiter/create-job"
              style={styles.primaryButton}
            >
              Create a Job →
            </Link>
          </div>

        ) : filteredApplications.length === 0 ? (

          <div style={styles.emptyState}>
            <h3>No matching applicants</h3>

            <p>
              Try changing your search or status filter.
            </p>

            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
              style={styles.refreshButton}
            >
              Clear Filters
            </button>
          </div>

        ) : (

          <div style={styles.applicantList}>
            {filteredApplications.map((application) => (
              <ApplicantCard
                key={application.id}
                application={application}
                onStatusUpdate={handleStatusUpdate}
                updating={updatingId === application.id}
                onCreateRound={handleCreateRound}
                onUpdateRound={handleUpdateRound}
                creatingRound={
                  roundAction?.type === "create" &&
                  roundAction.applicationId === application.id
                }
                updatingRoundId={
                  roundAction?.type === "update" &&
                  roundAction.applicationId === application.id
                    ? roundAction.roundId
                    : null
                }
              />
            ))}
          </div>

        )}

      </section>
    </main>
  );
}

// ============================================
// PAGE STYLES
// ============================================

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f7f8fc",
    color: "#172033",
    fontFamily: "Arial, sans-serif",
  },

  statePage: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "15px",
    color: "#64748b",
  },

  spinner: {
    width: "34px",
    height: "34px",
    border: "4px solid #e5e7eb",
    borderTopColor: "#6254d9",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },

  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "18px",
    padding: "20px 5%",
    background: "#ffffff",
    borderBottom: "1px solid #e8eaf1",
  },

  logo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#6254d9",
    fontSize: "22px",
    fontWeight: "800",
    textDecoration: "none",
  },

  logoTag: {
    padding: "5px 9px",
    background: "#eeecff",
    borderRadius: "6px",
    fontSize: "9px",
    letterSpacing: "1px",
  },

  navLinks: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "22px",
  },

  navLink: {
    color: "#6254d9",
    fontSize: "14px",
    fontWeight: "650",
    textDecoration: "none",
  },

  activeNavLink: {
    color: "#312e81",
    fontSize: "14px",
    fontWeight: "800",
    textDecoration: "none",
  },

  content: {
    width: "min(1200px, 92%)",
    margin: "40px auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px",
    marginBottom: "30px",
  },

  eyebrow: {
    color: "#6254d9",
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "1.6px",
  },

  companyInfo: {
    marginTop: "12px",
    color: "#64748b",
    fontSize: "14px",
  },

  refreshButton: {
    padding: "12px 18px",
    border: "1px solid #dedaf8",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#6254d9",
    fontWeight: "700",
    cursor: "pointer",
  },

  primaryButton: {
    display: "inline-block",
    padding: "12px 19px",
    borderRadius: "8px",
    background: "#6254d9",
    color: "#ffffff",
    fontWeight: "700",
    textDecoration: "none",
  },

  successMessage: {
    padding: "14px 18px",
    marginBottom: "20px",
    borderRadius: "9px",
    background: "#e8f8ef",
    color: "#187747",
    fontSize: "13px",
    fontWeight: "650",
  },

  errorMessage: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    padding: "15px",
    marginBottom: "20px",
    border: "1px solid #fecaca",
    borderRadius: "9px",
    background: "#fff0ed",
    color: "#b42318",
  },

  retryButton: {
    padding: "8px 13px",
    border: "none",
    borderRadius: "7px",
    background: "#6254d9",
    color: "#ffffff",
    cursor: "pointer",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "17px",
    marginBottom: "38px",
  },

  statCard: {
    display: "flex",
    flexDirection: "column",
    gap: "13px",
    padding: "23px",
    border: "1px solid #e6e8f0",
    borderRadius: "14px",
    background: "#ffffff",
    boxShadow: "0 4px 15px rgba(20,30,70,0.035)",
  },

  filterSection: {
    marginBottom: "22px",
  },

  filterControls: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginTop: "18px",
  },

  searchInput: {
    flex: "1 1 280px",
    minWidth: 0,
    padding: "13px 15px",
    border: "1px solid #dce0eb",
    borderRadius: "9px",
    background: "#ffffff",
    fontSize: "14px",
  },

  filterSelect: {
    flex: "0 1 210px",
    padding: "13px",
    border: "1px solid #dce0eb",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#334155",
    fontSize: "14px",
  },

  resultCount: {
    marginTop: "16px",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "600",
  },

  applicantList: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  applicantCard: {
    padding: "26px",
    background: "#ffffff",
    border: "1px solid #e5e8f1",
    borderRadius: "15px",
    boxShadow: "0 4px 15px rgba(20,30,70,0.035)",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "18px",
    paddingBottom: "20px",
    borderBottom: "1px solid #edf0f5",
  },

  applicantIdentity: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },

  avatar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "52px",
    height: "52px",
    flexShrink: 0,
    borderRadius: "50%",
    background: "#eeecff",
    color: "#6254d9",
    fontSize: "21px",
    fontWeight: "800",
  },

  identityText: {
    minWidth: 0,
  },

  studentName: {
    margin: "0 0 5px",
    fontSize: "17px",
  },

  studentEmail: {
    margin: 0,
    color: "#64748b",
    fontSize: "13px",
    overflowWrap: "anywhere",
  },

  statusBadge: {
    padding: "8px 14px",
    borderRadius: "25px",
    fontSize: "12px",
    fontWeight: "750",
    whiteSpace: "nowrap",
  },

  section: {
    padding: "21px 0",
    borderBottom: "1px solid #edf0f5",
  },

  sectionTitle: {
    margin: "0 0 15px",
    color: "#263449",
    fontSize: "14px",
    fontWeight: "750",
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "20px",
  },

  detailItem: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    minWidth: 0,
  },

  jobInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "9px",
    padding: "20px 0",
    borderBottom: "1px solid #edf0f5",
  },

  jobMeta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "17px",
    color: "#64748b",
    fontSize: "12px",
  },

  skillsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "9px",
  },

  skillBadge: {
    padding: "7px 11px",
    borderRadius: "7px",
    background: "#eeecff",
    color: "#5145bd",
    fontSize: "12px",
    fontWeight: "650",
  },

  mutedText: {
    margin: "5px 0 0",
    color: "#94a3b8",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  matchBox: {
    padding: "19px",
    margin: "20px 0",
    border: "1px solid #e9e7ff",
    borderRadius: "11px",
    background: "#f8f8ff",
  },

  matchHeading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "13px",
    color: "#475569",
    fontSize: "13px",
    fontWeight: "650",
  },

  progressTrack: {
    width: "100%",
    height: "9px",
    overflow: "hidden",
    borderRadius: "20px",
    background: "#e5e7f1",
  },

  progressFill: {
    height: "100%",
    borderRadius: "20px",
    background: "linear-gradient(90deg, #6254d9, #8c80f5)",
  },

  statusSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    paddingTop: "5px",
  },

  statusSelect: {
    minWidth: "210px",
    padding: "12px",
    border: "1px solid #dce0eb",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#334155",
    fontSize: "13px",
    fontWeight: "650",
  },

  roundsSection: {
    marginTop: "24px",
    paddingTop: "22px",
    borderTop: "1px solid #edf0f5",
  },

  roundsHeading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "16px",
  },

  roundCountBadge: {
    padding: "7px 11px",
    borderRadius: "20px",
    background: "#eeecff",
    color: "#5145bd",
    fontSize: "12px",
    fontWeight: "750",
  },

  roundsList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    marginBottom: "18px",
  },

  roundCard: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    padding: "18px",
    border: "1px solid #e7e8f4",
    borderRadius: "11px",
    background: "#fbfbff",
  },

  roundHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
  },

  roundMeta: {
    margin: "5px 0 0",
    color: "#8491a6",
    fontSize: "12px",
  },

  roundFieldsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
  },

  roundField: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    color: "#475569",
    fontSize: "13px",
    fontWeight: "650",
    minWidth: 0,
  },

  roundInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    border: "1px solid #dce0eb",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#263449",
    fontSize: "13px",
  },

  roundTextarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    border: "1px solid #dce0eb",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#263449",
    fontSize: "13px",
    lineHeight: 1.5,
    resize: "vertical",
  },

  roundActions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
  },

  roundSaveButton: {
    padding: "10px 16px",
    border: "none",
    borderRadius: "8px",
    background: "#6254d9",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
  },

  addRoundForm: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    padding: "18px",
    border: "1px solid #e7e8f4",
    borderRadius: "11px",
    background: "#ffffff",
  },

  addRoundTitle: {
    margin: 0,
    color: "#263449",
    fontSize: "14px",
  },

  noRoundsText: {
    padding: "14px",
    margin: "0 0 16px",
    borderRadius: "8px",
    background: "#f8f8fc",
    color: "#8491a6",
    fontSize: "13px",
  },

  disabledButton: {
    opacity: 0.6,
    cursor: "not-allowed",
  },

  updatingText: {
    color: "#6254d9",
    fontSize: "12px",
    fontWeight: "650",
  },

  emptyState: {
    padding: "55px 24px",
    border: "1px dashed #d5d5e8",
    borderRadius: "15px",
    background: "#ffffff",
    textAlign: "center",
  },

  emptyIcon: {
    color: "#6254d9",
    fontSize: "40px",
  },
};
