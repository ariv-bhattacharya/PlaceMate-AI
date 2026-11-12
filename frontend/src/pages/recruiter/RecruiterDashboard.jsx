
import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { apiGet } from "../../services/api";

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatStatus(status) {
  if (!status) return "Unknown";

  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(dateString) {
  if (!dateString) return "Not available";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ============================================
// STATISTICS CARD
// ============================================

function StatCard({ title, value, description, icon }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statTop}>
        <span style={styles.statIcon}>{icon}</span>
        <span style={styles.statDescription}>{description}</span>
      </div>

      <h2 style={styles.statValue}>{value}</h2>
      <p style={styles.statTitle}>{title}</p>
    </div>
  );
}

// ============================================
// RECRUITER DASHBOARD
// ============================================

export default function RecruiterDashboard() {
  const { user, logout } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [company, setCompany] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================
  // LOGOUT
  // ============================================

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  // ============================================
  // LOAD RECRUITER DASHBOARD DATA
  // ============================================

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [jobsResponse, applicationsResponse] = await Promise.all([
        apiGet("/recruiter/jobs"),
        apiGet("/applications/recruiter"),
      ]);

      setJobs(
        Array.isArray(jobsResponse.jobs)
          ? jobsResponse.jobs
          : []
      );

      setApplications(
        Array.isArray(applicationsResponse.applications)
          ? applicationsResponse.applications
          : []
      );

      setCompany(
        applicationsResponse.company ||
        jobsResponse.company ||
        null
      );

    } catch (err) {
      setError(
        err.message || "Unable to load recruiter dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "recruiter") {
      loadDashboard();
    }
  }, [user, loadDashboard]);

  // Only recruiter accounts can access this dashboard.
  if (user && user.role !== "recruiter") {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  // ============================================
  // DASHBOARD STATISTICS
  // ============================================

  const activeJobs = jobs.filter(
    (job) => job.is_active
  );

  const shortlisted = applications.filter((application) =>
    ["shortlisted", "interview_scheduled", "selected"].includes(
      (application.status || "").toLowerCase()
    )
  );

  const pendingApplications = applications.filter((application) =>
    ["applied", "under_review"].includes(
      (application.status || "").toLowerCase()
    )
  );

  const rejectedApplications = applications.filter(
    (application) =>
      (application.status || "").toLowerCase() === "rejected"
  );

  const recentApplications = applications.slice(0, 5);
  const recentJobs = jobs.slice(0, 5);

  // ============================================
  // LOADING STATE
  // ============================================

  if (loading) {
    return (
      <main style={styles.statePage}>
        <div style={styles.loadingSpinner} />
        <p>Loading recruiter dashboard...</p>
      </main>
    );
  }

  // ============================================
  // MAIN DASHBOARD
  // ============================================

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

        <div style={styles.navActions}>
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

          <button
            onClick={handleLogout}
            style={styles.logoutButton}
          >
            Logout
          </button>
        </div>
      </nav>

      <section style={styles.content}>

        {/* PAGE HEADER */}

        <header style={styles.header}>
          <div>
            <span style={styles.eyebrow}>
              RECRUITER WORKSPACE
            </span>

            <h1>
              Welcome back, {user?.name || "Recruiter"}!
            </h1>

            <p>
              Manage your job postings, review applicants and track
              your recruitment progress.
            </p>

            {company && (
              <div style={styles.companyInfo}>
                Company: <strong>{company.name}</strong>
              </div>
            )}
          </div>

          <div style={styles.headerActions}>
            <button
              onClick={loadDashboard}
              disabled={loading}
              style={styles.refreshButton}
            >
              ↻ Refresh
            </button>

            {/* FIXED CREATE JOB ROUTE */}

            <Link
              to="/recruiter/create-job"
              style={styles.primaryButton}
            >
              + Create Job
            </Link>
          </div>
        </header>

        {/* ERROR MESSAGE */}

        {error && (
          <div style={styles.errorBox}>
            <strong>Unable to load dashboard</strong>
            <p>{error}</p>

            <button
              onClick={loadDashboard}
              style={styles.retryButton}
            >
              Try Again
            </button>
          </div>
        )}

        {/* STATISTICS */}

        <section style={styles.statsGrid}>
          <StatCard
            title="Total Job Postings"
            value={jobs.length}
            description="All postings"
            icon="▤"
          />

          <StatCard
            title="Active Jobs"
            value={activeJobs.length}
            description="Currently available"
            icon="✓"
          />

          <StatCard
            title="Total Applicants"
            value={applications.length}
            description="Applications received"
            icon="♙"
          />

          <StatCard
            title="Shortlisted"
            value={shortlisted.length}
            description="Shortlisted or further"
            icon="★"
          />
        </section>

        {/* QUICK ACTIONS */}

        <section style={styles.section}>
          <div style={styles.sectionHeading}>
            <div>
              <h2>Quick Actions</h2>
              <p>Manage your recruitment activities.</p>
            </div>
          </div>

          <div style={styles.quickActionsGrid}>

            {/* FIXED CREATE JOB CARD */}

            <Link
              to="/recruiter/create-job"
              style={styles.actionCard}
            >
              <span style={styles.actionIcon}>+</span>
              <h3>Create a Job</h3>
              <p>
                Publish a new placement opportunity.
              </p>
              <span style={styles.actionLink}>
                Create Job →
              </span>
            </Link>

            <Link
              to="/recruiter/jobs"
              style={styles.actionCard}
            >
              <span style={styles.actionIcon}>▤</span>
              <h3>Manage Jobs</h3>
              <p>
                View, edit and manage your job postings.
              </p>
              <span style={styles.actionLink}>
                Manage Jobs →
              </span>
            </Link>

            <Link
              to="/recruiter/applicants"
              style={styles.actionCard}
            >
              <span style={styles.actionIcon}>♙</span>
              <h3>View Applicants</h3>
              <p>
                Review student profiles and resume matches.
              </p>
              <span style={styles.actionLink}>
                View Applicants →
              </span>
            </Link>

          </div>
        </section>

        {/* RECRUITMENT OVERVIEW */}

        <section style={styles.overviewGrid}>

          {/* APPLICATION OVERVIEW */}

          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <h2>Application Overview</h2>
                <p>Current candidate progress.</p>
              </div>
            </div>

            <div style={styles.overviewItem}>
              <span>Pending Applications</span>
              <strong>{pendingApplications.length}</strong>
            </div>

            <div style={styles.overviewItem}>
              <span>
                Shortlisted / Interview / Selected
              </span>
              <strong>{shortlisted.length}</strong>
            </div>

            <div style={styles.overviewItem}>
              <span>Rejected</span>
              <strong>{rejectedApplications.length}</strong>
            </div>
          </div>

          {/* RECENT JOBS */}

          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <h2>Recent Job Postings</h2>
                <p>Your latest opportunities.</p>
              </div>

              <Link
                to="/recruiter/jobs"
                style={styles.smallLink}
              >
                View All
              </Link>
            </div>

            {recentJobs.length === 0 ? (
              <p style={styles.emptyText}>
                No job postings yet. Create your first job.
              </p>
            ) : (
              recentJobs.map((job) => (
                <div
                  key={job.id}
                  style={styles.jobRow}
                >
                  <div style={styles.rowMain}>
                    <strong>{job.title}</strong>

                    <span>
                      {job.location || "Location not specified"}
                    </span>
                  </div>

                  <span
                    style={{
                      ...styles.jobBadge,
                      ...(job.is_active
                        ? styles.activeBadge
                        : styles.inactiveBadge),
                    }}
                  >
                    {job.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* RECENT APPLICANTS */}

        <section style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2>Recent Applicants</h2>
              <p>Students who applied to your jobs.</p>
            </div>

            <Link
              to="/recruiter/applicants"
              style={styles.smallLink}
            >
              View All Applicants →
            </Link>
          </div>

          {recentApplications.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={styles.emptyIcon}>♙</span>
              <h3>No applicants yet</h3>

              <p>
                Applicants will appear here when students apply
                to your job postings.
              </p>

              <Link
                to="/recruiter/create-job"
                style={styles.primaryButton}
              >
                Create a Job →
              </Link>
            </div>
          ) : (
            <div style={styles.applicantList}>
              {recentApplications.map((application) => {
                const student = application.student || {};
                const job = application.job || {};

                return (
                  <div
                    key={application.id}
                    style={styles.applicantRow}
                  >
                    <div style={styles.avatar}>
                      {(student.name || "S")
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div style={styles.applicantDetails}>
                      <strong>
                        {student.name || "Unknown Student"}
                      </strong>

                      <span>
                        {job.title || "Unknown Job"} ·{" "}
                        {student.branch || "Branch unavailable"}
                      </span>

                      <span>
                        CGPA: {student.cgpa ?? "N/A"} ·{" "}
                        Match:{" "}
                        {application.match_score !== null &&
                        application.match_score !== undefined
                          ? `${Number(application.match_score).toFixed(2)}%`
                          : "N/A"}
                      </span>
                    </div>

                    <span style={styles.statusBadge}>
                      {formatStatus(application.status)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* FOOTER */}

        <footer style={styles.footer}>
          PlaceMate AI · Recruiter Dashboard
        </footer>

      </section>
    </main>
  );
}

// ============================================
// DASHBOARD STYLES
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
    fontFamily: "Arial, sans-serif",
  },

  loadingSpinner: {
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
    fontSize: "23px",
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

  navActions: {
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

  logoutButton: {
    padding: "10px 17px",
    border: "none",
    borderRadius: "8px",
    background: "#fff0ed",
    color: "#c04432",
    fontWeight: "700",
    cursor: "pointer",
  },

  content: {
    width: "min(1200px, 92%)",
    margin: "38px auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "25px",
    marginBottom: "35px",
  },

  eyebrow: {
    color: "#6254d9",
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "1.6px",
  },

  headerActions: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
  },

  companyInfo: {
    marginTop: "13px",
    color: "#64748b",
    fontSize: "14px",
  },

  refreshButton: {
    padding: "12px 17px",
    border: "1px solid #dedaf8",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#6254d9",
    fontWeight: "700",
    cursor: "pointer",
  },

  primaryButton: {
    display: "inline-block",
    padding: "13px 19px",
    borderRadius: "8px",
    background: "#6254d9",
    color: "#ffffff",
    fontWeight: "700",
    textDecoration: "none",
  },

  errorBox: {
    padding: "20px",
    marginBottom: "25px",
    background: "#fff0ed",
    border: "1px solid #fecaca",
    borderRadius: "12px",
    color: "#b42318",
  },

  retryButton: {
    padding: "9px 15px",
    border: "none",
    borderRadius: "7px",
    background: "#6254d9",
    color: "#fff",
    cursor: "pointer",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(215px, 1fr))",
    gap: "20px",
    marginBottom: "42px",
  },

  statCard: {
    padding: "23px",
    border: "1px solid #e6e8f0",
    borderRadius: "15px",
    background: "#ffffff",
    boxShadow: "0 4px 15px rgba(20,30,70,0.035)",
  },

  statTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
  },

  statIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    background: "#eeecff",
    color: "#6254d9",
    fontSize: "23px",
  },

  statDescription: {
    color: "#94a3b8",
    fontSize: "11px",
    textAlign: "right",
  },

  statValue: {
    margin: "18px 0 5px",
    color: "#6254d9",
    fontSize: "34px",
    fontWeight: "800",
  },

  statTitle: {
    margin: 0,
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "600",
  },

  section: {
    marginBottom: "38px",
  },

  sectionHeading: {
    marginBottom: "20px",
  },

  quickActionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "18px",
  },

  actionCard: {
    display: "block",
    padding: "24px",
    background: "#ffffff",
    border: "1px solid #e6e8f0",
    borderRadius: "14px",
    textDecoration: "none",
    color: "#172033",
  },

  actionIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "43px",
    height: "43px",
    borderRadius: "11px",
    background: "#eeecff",
    color: "#6254d9",
    fontSize: "25px",
    fontWeight: "800",
  },

  actionLink: {
    display: "inline-block",
    marginTop: "10px",
    color: "#6254d9",
    fontWeight: "700",
    fontSize: "13px",
  },

  overviewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
    marginBottom: "25px",
  },

  panel: {
    padding: "24px",
    marginBottom: "25px",
    background: "#ffffff",
    border: "1px solid #e6e8f0",
    borderRadius: "15px",
    boxShadow: "0 4px 15px rgba(20,30,70,0.035)",
  },

  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "20px",
  },

  overviewItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    padding: "16px 0",
    borderBottom: "1px solid #edf0f5",
    color: "#64748b",
    fontSize: "13px",
  },

  jobRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    padding: "15px 0",
    borderBottom: "1px solid #edf0f5",
  },

  rowMain: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    minWidth: 0,
  },

  jobBadge: {
    padding: "6px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "700",
  },

  activeBadge: {
    background: "#e8f8ef",
    color: "#187747",
  },

  inactiveBadge: {
    background: "#f1f5f9",
    color: "#64748b",
  },

  smallLink: {
    color: "#6254d9",
    fontSize: "13px",
    fontWeight: "700",
    textDecoration: "none",
  },

  emptyText: {
    color: "#94a3b8",
    fontSize: "13px",
  },

  emptyState: {
    padding: "35px 15px",
    textAlign: "center",
  },

  emptyIcon: {
    fontSize: "35px",
    color: "#6254d9",
  },

  applicantList: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },

  applicantRow: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "17px 0",
    borderBottom: "1px solid #edf0f5",
  },

  avatar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: "43px",
    height: "43px",
    borderRadius: "50%",
    background: "#eeecff",
    color: "#6254d9",
    fontWeight: "800",
    fontSize: "17px",
  },

  applicantDetails: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    gap: "5px",
    minWidth: 0,
    fontSize: "13px",
    overflowWrap: "anywhere",
  },

  statusBadge: {
    padding: "7px 11px",
    borderRadius: "20px",
    background: "#eff6ff",
    color: "#2563eb",
    fontSize: "11px",
    fontWeight: "750",
    whiteSpace: "nowrap",
  },

  footer: {
    padding: "25px 0",
    color: "#94a3b8",
    textAlign: "center",
    fontSize: "12px",
  },
};
