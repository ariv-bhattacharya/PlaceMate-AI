
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiGet } from "../../services/api";
import useAuth from "../../hooks/useAuth";

const statCards = [
  { key: "total_students", label: "Total Students", icon: "🎓" },
  { key: "total_recruiters", label: "Total Recruiters", icon: "👥" },
  { key: "total_companies", label: "Total Companies", icon: "🏢" },
  { key: "total_jobs", label: "Total Job Postings", icon: "💼" },
  { key: "active_jobs", label: "Active Jobs", icon: "✅" },
  { key: "inactive_jobs", label: "Inactive Jobs", icon: "⏸️" },
  { key: "total_applications", label: "Applications", icon: "📄" },
  { key: "total_resumes", label: "Uploaded Resumes", icon: "📁" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const response = await apiGet("/admin/dashboard");
      setDashboard(response);
    } catch (err) {
      setError(
        err.message || "Unable to load Admin dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleLogout() {
    const confirmed = window.confirm(
      "Are you sure you want to log out of your Admin account?"
    );

    if (!confirmed) return;

    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  }

  const statistics = dashboard?.statistics || {};

  const pageStyle = {
    minHeight: "100vh",
    background: "#f6f7fc",
    padding: "40px 5%",
    color: "#172033",
  };

  const cardStyle = {
    background: "#ffffff",
    border: "1px solid #e5e7f0",
    borderRadius: "18px",
    padding: "25px",
    boxShadow: "0 5px 20px rgba(25, 35, 70, 0.04)",
  };

  const linkStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "11px 17px",
    border: "1px solid #ded9ff",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#6253df",
    fontWeight: "700",
    textDecoration: "none",
  };

  return (
    <div style={pageStyle}>

      {/* ADMIN HEADER */}

      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "18px",
          marginBottom: "35px",
        }}
      >
        <div>
          <h1 style={{ color: "#6253df", margin: 0 }}>
            PlaceMate AI
          </h1>

          <span
            style={{
              display: "inline-block",
              marginTop: "10px",
              padding: "6px 12px",
              borderRadius: "8px",
              background: "#eeebff",
              color: "#6253df",
              fontWeight: "700",
              fontSize: "12px",
            }}
          >
            ADMINISTRATOR
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={loadDashboard}
            disabled={loading}
            style={{
              padding: "12px 20px",
              border: "1px solid #ded9ff",
              borderRadius: "10px",
              background: "#ffffff",
              color: "#6253df",
              fontWeight: "700",
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "Refreshing..." : "↻ Refresh Statistics"}
          </button>

          <button
            onClick={handleLogout}
            style={{
              padding: "12px 20px",
              border: "none",
              borderRadius: "10px",
              background: "#fff0ef",
              color: "#c0392b",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* ADMIN NAVIGATION */}

      <nav
        aria-label="Admin navigation"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "35px",
        }}
      >
        <Link to="/admin/dashboard" style={linkStyle}>
          Dashboard
        </Link>

        <Link to="/admin/students" style={linkStyle}>
          Manage Students
        </Link>

        <Link to="/admin/companies" style={linkStyle}>
          Manage Companies
        </Link>

        <Link to="/admin/jobs" style={linkStyle}>
          Manage Jobs
        </Link>

        <Link to="/admin/applications" style={linkStyle}>
          Manage Applications
        </Link>
      </nav>

      {/* PAGE HEADING */}

      <section style={{ marginBottom: "30px" }}>
        <p
          style={{
            color: "#6253df",
            fontWeight: "800",
            letterSpacing: "2px",
            fontSize: "13px",
          }}
        >
          ADMINISTRATOR WORKSPACE
        </p>

        <h1 style={{ fontSize: "36px", marginBottom: "10px" }}>
          Admin Dashboard
        </h1>

        <p style={{ color: "#64748b", fontSize: "17px" }}>
          Monitor students, recruiters, companies and placement
          activities across PlaceMate AI.
        </p>
      </section>

      {/* ERROR MESSAGE */}

      {error && (
        <div
          role="alert"
          style={{
            padding: "16px",
            marginBottom: "25px",
            borderRadius: "12px",
            background: "#fff0ef",
            color: "#c0392b",
          }}
        >
          {error}
        </div>
      )}

      {/* DASHBOARD STATISTICS */}

      {loading ? (
        <div style={cardStyle}>
          Loading platform statistics...
        </div>
      ) : dashboard ? (
        <>
          <section
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(210px, 1fr))",
              gap: "20px",
            }}
          >
            {statCards.map((card) => (
              <div key={card.key} style={cardStyle}>
                <div
                  style={{
                    fontSize: "26px",
                    marginBottom: "18px",
                  }}
                >
                  {card.icon}
                </div>

                <p
                  style={{
                    color: "#64748b",
                    margin: "0 0 12px",
                  }}
                >
                  {card.label}
                </p>

                <h2
                  style={{
                    margin: 0,
                    fontSize: "34px",
                    color: "#6253df",
                  }}
                >
                  {statistics[card.key] ?? 0}
                </h2>
              </div>
            ))}
          </section>

          {/* APPLICATION AND ROUND STATISTICS */}

          <section
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "20px",
              marginTop: "30px",
            }}
          >
            <div style={cardStyle}>
              <h2>Application Status</h2>

              {Object.entries(
                dashboard.application_statuses || {}
              ).length === 0 ? (
                <p style={{ color: "#64748b" }}>
                  No application data available.
                </p>
              ) : (
                Object.entries(
                  dashboard.application_statuses
                ).map(([status, count]) => (
                  <p key={status}>
                    <strong>
                      {status.replaceAll("_", " ")}:
                    </strong>{" "}
                    {count}
                  </p>
                ))
              )}
            </div>

            <div style={cardStyle}>
              <h2>Recruitment Round Status</h2>

              {Object.entries(
                dashboard.recruitment_round_statuses || {}
              ).length === 0 ? (
                <p style={{ color: "#64748b" }}>
                  No recruitment round data available.
                </p>
              ) : (
                Object.entries(
                  dashboard.recruitment_round_statuses
                ).map(([status, count]) => (
                  <p key={status}>
                    <strong>
                      {status.replaceAll("_", " ")}:
                    </strong>{" "}
                    {count}
                  </p>
                ))
              )}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
