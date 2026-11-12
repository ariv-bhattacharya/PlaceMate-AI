
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPost, apiPatch } from "../../services/api";

const ROUND_STATUSES = [
  "pending",
  "scheduled",
  "cleared",
  "rejected",
];

const EMPTY_FORM = {
  round_name: "",
  status: "pending",
  scheduled_at: "",
  feedback: "",
};


// ============================================
// HELPER FUNCTIONS
// ============================================

function formatStatus(status) {
  return (status || "pending")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value) {
  if (!value) return "Not scheduled";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toLocalDateTime(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );

  return localDate.toISOString().slice(0, 16);
}

function getStatusStyle(status) {
  switch (status) {
    case "scheduled":
      return styles.scheduledBadge;

    case "cleared":
      return styles.clearedBadge;

    case "rejected":
      return styles.rejectedBadge;

    default:
      return styles.pendingBadge;
  }
}


// ============================================
// INTERVIEW ROUND CARD
// ============================================

function RoundCard({ round, onSave, saving }) {
  const [form, setForm] = useState({
    round_name: round.round_name || "",
    status: round.status || "pending",
    scheduled_at: toLocalDateTime(round.scheduled_at),
    feedback: round.feedback || "",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    setForm({
      round_name: round.round_name || "",
      status: round.status || "pending",
      scheduled_at: toLocalDateTime(round.scheduled_at),
      feedback: round.feedback || "",
    });
  }, [round]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.round_name.trim()) {
      setError("Round name is required.");
      return;
    }

    try {
      await onSave(round.id, {
        round_name: form.round_name.trim(),
        status: form.status,
        scheduled_at: form.scheduled_at || null,
        feedback: form.feedback.trim(),
      });
    } catch (err) {
      setError(err.message || "Unable to update this round.");
    }
  };

  return (
    <article style={styles.roundCard}>

      <div style={styles.roundCardHeader}>

        <div>
          <span style={styles.roundNumber}>
            ROUND {round.round_number}
          </span>

          <h3>{round.round_name}</h3>
        </div>

        <span
          style={{
            ...styles.statusBadge,
            ...getStatusStyle(round.status),
          }}
        >
          {formatStatus(round.status)}
        </span>

      </div>

      <form onSubmit={handleSubmit}>

        <div style={styles.formGrid}>

          <div style={styles.formField}>
            <label htmlFor={`round-name-${round.id}`}>
              Round Name
            </label>

            <input
              id={`round-name-${round.id}`}
              name="round_name"
              value={form.round_name}
              onChange={handleChange}
              maxLength={100}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.formField}>
            <label htmlFor={`round-status-${round.id}`}>
              Round Status
            </label>

            <select
              id={`round-status-${round.id}`}
              name="status"
              value={form.status}
              onChange={handleChange}
              style={styles.input}
            >
              {ROUND_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatStatus(status)}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formField}>
            <label htmlFor={`round-date-${round.id}`}>
              Interview Date and Time
            </label>

            <input
              id={`round-date-${round.id}`}
              type="datetime-local"
              name="scheduled_at"
              value={form.scheduled_at}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

        </div>

        <div style={styles.formField}>
          <label htmlFor={`round-feedback-${round.id}`}>
            Recruiter Feedback
          </label>

          <textarea
            id={`round-feedback-${round.id}`}
            name="feedback"
            value={form.feedback}
            onChange={handleChange}
            rows={3}
            maxLength={5000}
            placeholder="Add interview feedback or notes..."
            style={styles.textarea}
          />
        </div>

        {error && (
          <div style={styles.errorMessage}>
            {error}
          </div>
        )}

        <div style={styles.roundCardFooter}>

          <span style={styles.dateText}>
            Scheduled: {formatDate(round.scheduled_at)}
          </span>

          <button
            type="submit"
            disabled={saving}
            style={styles.primaryButton}
          >
            {saving ? "Saving..." : "Save Round"}
          </button>

        </div>

      </form>

    </article>
  );
}


// ============================================
// MAIN RECRUITMENT ROUNDS PAGE
// ============================================

export default function RecruitmentRounds() {

  const [applications, setApplications] = useState([]);
  const [selectedApplicationId, setSelectedApplicationId] =
    useState("");

  const [rounds, setRounds] = useState([]);

  const [applicationLoading, setApplicationLoading] =
    useState(true);

  const [roundsLoading, setRoundsLoading] =
    useState(false);

  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);

  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);

  const selectedApplication = applications.find(
    (application) =>
      String(application.id) === String(selectedApplicationId)
  );


  // =========================================
  // LOAD RECRUITER APPLICATIONS
  // =========================================

  const loadApplications = useCallback(async () => {

    setApplicationLoading(true);
    setError("");

    try {
      const response = await apiGet("/applications/recruiter");

      const result = Array.isArray(response.applications)
        ? response.applications
        : [];

      setApplications(result);

      setSelectedApplicationId((current) => {
        if (
          current &&
          result.some(
            (application) => String(application.id) === current
          )
        ) {
          return current;
        }

        return result.length > 0
          ? String(result[0].id)
          : "";
      });

    } catch (err) {
      setError(
        err.message || "Unable to load recruiter applications."
      );
    } finally {
      setApplicationLoading(false);
    }

  }, []);


  useEffect(() => {
    loadApplications();
  }, [loadApplications]);


  // =========================================
  // LOAD INTERVIEW ROUNDS
  // =========================================

  const loadRounds = useCallback(async (applicationId) => {

    if (!applicationId) {
      setRounds([]);
      return;
    }

    setRoundsLoading(true);
    setError("");
    setFeedback("");

    try {
      const response = await apiGet(
        `/applications/${applicationId}/rounds`
      );

      setRounds(
        Array.isArray(response.rounds)
          ? response.rounds
          : []
      );

    } catch (err) {
      setRounds([]);
      setError(
        err.message || "Unable to load interview rounds."
      );
    } finally {
      setRoundsLoading(false);
    }

  }, []);


  useEffect(() => {
    if (selectedApplicationId) {
      loadRounds(selectedApplicationId);
    } else {
      setRounds([]);
    }
  }, [selectedApplicationId, loadRounds]);


  // =========================================
  // CREATE ROUND FORM
  // =========================================

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  // =========================================
  // CREATE INTERVIEW ROUND
  // =========================================

  const handleCreateRound = async (event) => {

    event.preventDefault();

    if (!selectedApplicationId) {
      setError("Select an applicant first.");
      return;
    }

    if (!form.round_name.trim()) {
      setError("Please enter an interview round name.");
      return;
    }

    setCreating(true);
    setError("");
    setFeedback("");

    try {

      const response = await apiPost(
        `/applications/${selectedApplicationId}/rounds`,
        {
          round_name: form.round_name.trim(),
          status: form.status,
          scheduled_at: form.scheduled_at || null,
          feedback: form.feedback.trim(),
        }
      );

      setForm(EMPTY_FORM);

      setFeedback(
        response.message || "Interview round created successfully."
      );

      await loadRounds(selectedApplicationId);
      await loadApplications();

    } catch (err) {

      setError(
        err.message || "Unable to create interview round."
      );

    } finally {
      setCreating(false);
    }
  };


  // =========================================
  // UPDATE INTERVIEW ROUND
  // =========================================

  const handleUpdateRound = async (roundId, payload) => {

    setSaving(true);
    setError("");
    setFeedback("");

    try {

      const response = await apiPatch(
        `/applications/${selectedApplicationId}/rounds/${roundId}`,
        payload
      );

      setFeedback(
        response.message || "Interview round updated successfully."
      );

      await loadRounds(selectedApplicationId);
      await loadApplications();

    } catch (err) {

      throw err;

    } finally {
      setSaving(false);
    }
  };


  // =========================================
  // PAGE
  // =========================================

  if (applicationLoading) {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.spinner} />
        <p>Loading recruitment workspace...</p>
      </main>
    );
  }


  return (

    <main style={styles.page}>

      {/* NAVIGATION */}
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
            style={styles.navLink}
          >
            Applicants
          </Link>

          <span style={styles.activeNavLink}>
            Recruitment Rounds
          </span>

        </div>

      </nav>


      <section style={styles.content}>

        {/* HEADER */}
        <header style={styles.header}>

          <div>
            <span style={styles.eyebrow}>
              RECRUITMENT MANAGEMENT
            </span>

            <h1>Recruitment Rounds</h1>

            <p>
              Schedule interviews, track candidate progress
              and record recruitment feedback.
            </p>
          </div>

          <button
            type="button"
            onClick={loadApplications}
            style={styles.secondaryButton}
          >
            ↻ Refresh Applicants
          </button>

        </header>


        {/* FEEDBACK */}
        {feedback && (
          <div style={styles.successMessage} role="status">
            ✓ {feedback}
          </div>
        )}

        {error && (
          <div style={styles.errorMessage} role="alert">
            {error}
          </div>
        )}


        {/* NO APPLICANTS */}
        {applications.length === 0 ? (

          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>▤</div>

            <h2>No applicants yet</h2>

            <p>
              Recruitment rounds will appear here after students
              apply to your company's job postings.
            </p>

            <Link
              to="/recruiter/applicants"
              style={styles.primaryButton}
            >
              View Applicants
            </Link>
          </div>

        ) : (

          <>

            {/* APPLICANT SELECTOR */}
            <section style={styles.panel}>

              <h2>Select Applicant</h2>

              <p style={styles.sectionDescription}>
                Choose an applicant to manage their interview process.
              </p>

              <div style={styles.formField}>
                <label htmlFor="selected-application">
                  Applicant and Job
                </label>

                <select
                  id="selected-application"
                  value={selectedApplicationId}
                  onChange={(event) => {
                    setSelectedApplicationId(event.target.value);
                    setForm(EMPTY_FORM);
                    setError("");
                    setFeedback("");
                  }}
                  style={styles.input}
                >
                  {applications.map((application) => (
                    <option
                      key={application.id}
                      value={application.id}
                    >
                      {application.student?.name || "Unknown Student"}
                      {" — "}
                      {application.job?.title || "Unknown Job"}
                      {" — Application #"}
                      {application.id}
                    </option>
                  ))}
                </select>
              </div>


              {selectedApplication && (
                <div style={styles.applicantSummary}>

                  <div style={styles.avatar}>
                    {(selectedApplication.student?.name || "S")
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div style={styles.applicantInfo}>

                    <h3>
                      {selectedApplication.student?.name || "Unknown Student"}
                    </h3>

                    <p>
                      {selectedApplication.student?.email || "No email provided"}
                    </p>

                    <p>
                      {selectedApplication.job?.title || "Unknown Job"}
                      {" · "}
                      Application #{selectedApplication.id}
                    </p>

                  </div>

                  <span style={styles.applicationStatus}>
                    {formatStatus(selectedApplication.status)}
                  </span>

                </div>
              )}

            </section>


            {/* CREATE NEW ROUND */}
            <section style={styles.panel}>

              <div style={styles.sectionHeader}>
                <div>
                  <h2>Create Interview Round</h2>

                  <p style={styles.sectionDescription}>
                    Add the next stage of the selected applicant's recruitment.
                  </p>
                </div>

                <span style={styles.addIcon}>+</span>
              </div>


              <form
                onSubmit={handleCreateRound}
                style={styles.createForm}
              >

                <div style={styles.formGrid}>

                  <div style={styles.formField}>
                    <label htmlFor="new-round-name">
                      Round Name *
                    </label>

                    <input
                      id="new-round-name"
                      name="round_name"
                      value={form.round_name}
                      onChange={handleFormChange}
                      placeholder="e.g. Technical Interview"
                      maxLength={100}
                      required
                      style={styles.input}
                    />
                  </div>


                  <div style={styles.formField}>
                    <label htmlFor="new-round-status">
                      Initial Status
                    </label>

                    <select
                      id="new-round-status"
                      name="status"
                      value={form.status}
                      onChange={handleFormChange}
                      style={styles.input}
                    >
                      {ROUND_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {formatStatus(status)}
                        </option>
                      ))}
                    </select>
                  </div>


                  <div style={styles.formField}>
                    <label htmlFor="new-round-date">
                      Interview Date and Time
                    </label>

                    <input
                      id="new-round-date"
                      type="datetime-local"
                      name="scheduled_at"
                      value={form.scheduled_at}
                      onChange={handleFormChange}
                      style={styles.input}
                    />
                  </div>

                </div>


                <div style={styles.formField}>
                  <label htmlFor="new-round-feedback">
                    Feedback / Instructions
                  </label>

                  <textarea
                    id="new-round-feedback"
                    name="feedback"
                    value={form.feedback}
                    onChange={handleFormChange}
                    placeholder="Add interview instructions or notes..."
                    rows={3}
                    maxLength={5000}
                    style={styles.textarea}
                  />
                </div>


                <div style={styles.formActions}>

                  <button
                    type="button"
                    onClick={() => setForm(EMPTY_FORM)}
                    style={styles.secondaryButton}
                    disabled={creating}
                  >
                    Clear Form
                  </button>

                  <button
                    type="submit"
                    style={styles.primaryButton}
                    disabled={creating}
                  >
                    {creating ? "Creating..." : "+ Add Interview Round"}
                  </button>

                </div>

              </form>

            </section>


            {/* EXISTING ROUNDS */}
            <section style={styles.roundsSection}>

              <div style={styles.sectionHeader}>
                <div>
                  <h2>Interview Timeline</h2>

                  <p style={styles.sectionDescription}>
                    Track each stage of the recruitment process.
                  </p>
                </div>

                <span style={styles.roundCount}>
                  {rounds.length} round{rounds.length !== 1 ? "s" : ""}
                </span>
              </div>


              {roundsLoading ? (

                <div style={styles.inlineLoading}>
                  Loading interview rounds...
                </div>

              ) : rounds.length === 0 ? (

                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>◷</div>

                  <h3>No interview rounds created</h3>

                  <p>
                    Use the form above to create the first interview round
                    for this applicant.
                  </p>
                </div>

              ) : (

                <div style={styles.roundsList}>

                  {rounds.map((round) => (
                    <RoundCard
                      key={round.id}
                      round={round}
                      onSave={handleUpdateRound}
                      saving={saving}
                    />
                  ))}

                </div>

              )}

            </section>

          </>

        )}

      </section>

    </main>
  );
}


// ============================================
// STYLES
// ============================================

const styles = {

  page: {
    minHeight: "100vh",
    background: "#f7f8fc",
    color: "#172033",
    fontFamily: "Arial, sans-serif",
  },

  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    color: "#64748b",
  },

  spinner: {
    width: "34px",
    height: "34px",
    border: "4px solid #e5e7eb",
    borderTopColor: "#6254d9",
    borderRadius: "50%",
  },

  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
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
    gap: "20px",
  },

  navLink: {
    color: "#6254d9",
    fontSize: "13px",
    fontWeight: "700",
    textDecoration: "none",
  },

  activeNavLink: {
    color: "#312e81",
    fontSize: "13px",
    fontWeight: "800",
  },

  content: {
    width: "min(1100px, 92%)",
    margin: "40px auto",
    paddingBottom: "50px",
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

  panel: {
    padding: "25px",
    marginBottom: "25px",
    border: "1px solid #e6e8f0",
    borderRadius: "15px",
    background: "#ffffff",
    boxShadow: "0 4px 15px rgba(20,30,70,0.035)",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "15px",
    marginBottom: "22px",
  },

  sectionDescription: {
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.6,
  },

  formField: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    minWidth: 0,
    color: "#334155",
    fontSize: "13px",
    fontWeight: "650",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "18px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    border: "1px solid #dce0eb",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#334155",
    fontSize: "13px",
    fontFamily: "Arial, sans-serif",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    border: "1px solid #dce0eb",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#334155",
    fontSize: "13px",
    lineHeight: 1.6,
    fontFamily: "Arial, sans-serif",
    resize: "vertical",
  },

  createForm: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: "10px",
    paddingTop: "12px",
    borderTop: "1px solid #edf0f5",
  },

  primaryButton: {
    display: "inline-block",
    padding: "12px 18px",
    border: "none",
    borderRadius: "9px",
    background: "#6254d9",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "700",
    textDecoration: "none",
    cursor: "pointer",
  },

  secondaryButton: {
    padding: "11px 17px",
    border: "1px solid #dedaf8",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#6254d9",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },

  applicantSummary: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "15px",
    marginTop: "20px",
    padding: "17px",
    borderRadius: "11px",
    background: "#f8f7ff",
  },

  avatar: {
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    borderRadius: "50%",
    background: "#eeecff",
    color: "#6254d9",
    fontSize: "20px",
    fontWeight: "800",
  },

  applicantInfo: {
    flex: 1,
    minWidth: "180px",
  },

  applicationStatus: {
    padding: "7px 12px",
    borderRadius: "20px",
    background: "#e8f8ef",
    color: "#187747",
    fontSize: "12px",
    fontWeight: "750",
  },

  addIcon: {
    width: "38px",
    height: "38px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "9px",
    background: "#eeecff",
    color: "#6254d9",
    fontSize: "24px",
    fontWeight: "700",
  },

  roundsSection: {
    marginTop: "38px",
  },

  roundCount: {
    color: "#6254d9",
    fontSize: "13px",
    fontWeight: "750",
  },

  roundsList: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  roundCard: {
    padding: "23px",
    border: "1px solid #e6e8f0",
    borderRadius: "14px",
    background: "#ffffff",
    boxShadow: "0 4px 15px rgba(20,30,70,0.035)",
  },

  roundCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "15px",
    marginBottom: "22px",
    paddingBottom: "17px",
    borderBottom: "1px solid #edf0f5",
  },

  roundNumber: {
    color: "#6254d9",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "1.3px",
  },

  statusBadge: {
    padding: "7px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "750",
  },

  pendingBadge: {
    background: "#f1f5f9",
    color: "#475569",
  },

  scheduledBadge: {
    background: "#eff6ff",
    color: "#1d4ed8",
  },

  clearedBadge: {
    background: "#e8f8ef",
    color: "#187747",
  },

  rejectedBadge: {
    background: "#fff0ed",
    color: "#b42318",
  },

  roundCardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    marginTop: "17px",
  },

  dateText: {
    color: "#94a3b8",
    fontSize: "12px",
  },

  successMessage: {
    padding: "14px 17px",
    marginBottom: "18px",
    borderRadius: "9px",
    background: "#e8f8ef",
    color: "#187747",
    fontSize: "13px",
    fontWeight: "650",
  },

  errorMessage: {
    padding: "14px 17px",
    marginBottom: "18px",
    borderRadius: "9px",
    background: "#fff0ed",
    border: "1px solid #fecaca",
    color: "#b42318",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  emptyState: {
    padding: "45px 20px",
    border: "1px dashed #d5d5e8",
    borderRadius: "14px",
    background: "#ffffff",
    textAlign: "center",
  },

  emptyIcon: {
    color: "#6254d9",
    fontSize: "36px",
  },

  inlineLoading: {
    padding: "30px",
    textAlign: "center",
    color: "#64748b",
  },
};
