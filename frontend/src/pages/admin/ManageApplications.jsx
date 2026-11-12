
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../../services/api";

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "applied", label: "Applied" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview_scheduled", label: "Interview Scheduled" },
  { value: "selected", label: "Selected" },
  { value: "rejected", label: "Rejected" },
];

function formatStatus(status) {
  return (status || "applied")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

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
  const styles = {
    applied: {
      background: "#eef4ff",
      color: "#2563eb",
    },
    shortlisted: {
      background: "#e8f8ef",
      color: "#087b48",
    },
    interview_scheduled: {
      background: "#fff5df",
      color: "#a16207",
    },
    selected: {
      background: "#dcfce7",
      color: "#087b48",
    },
    rejected: {
      background: "#fff0ef",
      color: "#c0392b",
    },
  };

  return styles[status] || {
    background: "#f0f3f8",
    color: "#64748b",
  };
}

export default function ManageApplications() {
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadApplications() {
    setLoading(true);
    setError("");

    try {
      const response = await apiGet(
        "/admin/applications?page=1&per_page=100"
      );

      setApplications(response.applications || []);
    } catch (err) {
      setError(
        err.message || "Unable to load application records."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, []);

  // SEARCH AND STATUS FILTER
  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return applications.filter((application) => {
      const student = application.student || {};
      const job = application.job || {};

      const matchesSearch =
        !query ||
        student.name?.toLowerCase().includes(query) ||
        student.email?.toLowerCase().includes(query) ||
        student.roll_number?.toLowerCase().includes(query) ||
        job.title?.toLowerCase().includes(query) ||
        job.company_name?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        application.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, search, statusFilter]);

  // APPLICATION STATISTICS
  const countByStatus = (status) =>
    applications.filter(
      (application) => application.status === status
    ).length;

  const pendingCount = applications.filter(
    (application) =>
      ["applied", "pending"].includes(application.status)
  ).length;

  const shortlistedCount = applications.filter(
    (application) =>
      ["shortlisted", "interview_scheduled", "selected"].includes(
        application.status
      )
  ).length;

  const rejectedCount = countByStatus("rejected");

  // SHARED STYLES
  const cardStyle = {
    background: "#ffffff",
    border: "1px solid #e5e7f0",
    borderRadius: "16px",
    padding: "22px",
    boxShadow: "0 5px 20px rgba(25,35,70,0.04)",
  };

  const buttonStyle = {
    padding: "10px 16px",
    borderRadius: "9px",
    border: "1px solid #ded9ff",
    background: "#ffffff",
    color: "#6253df",
    fontWeight: "700",
    cursor: "pointer",
  };

  const navLinkStyle = {
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

  const activeNavLinkStyle = {
    ...navLinkStyle,
    background: "#6253df",
    color: "#ffffff",
    borderColor: "#6253df",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f6f7fc",
        padding: "40px 5%",
        color: "#172033",
        boxSizing: "border-box",
      }}
    >
      {/* PAGE HEADER */}

      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "18px",
          marginBottom: "25px",
        }}
      >
        <div>
          <p
            style={{
              color: "#6253df",
              fontWeight: "800",
              letterSpacing: "2px",
              fontSize: "13px",
            }}
          >
            ADMINISTRATION
          </p>

          <h1 style={{ fontSize: "36px", margin: "8px 0" }}>
            Manage Applications
          </h1>

          <p style={{ color: "#64748b", fontSize: "16px" }}>
            Monitor applications and recruitment progress across the platform.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <Link
            to="/admin/dashboard"
            style={{
              ...buttonStyle,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            ← Dashboard
          </Link>

          <button
            onClick={loadApplications}
            disabled={loading}
            style={{
              ...buttonStyle,
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.65 : 1,
            }}
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
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
        <Link
          to="/admin/dashboard"
          style={navLinkStyle}
        >
          Dashboard
        </Link>

        <Link
          to="/admin/students"
          style={navLinkStyle}
        >
          Manage Students
        </Link>

        <Link
          to="/admin/companies"
          style={navLinkStyle}
        >
          Manage Companies
        </Link>

        <Link
          to="/admin/jobs"
          style={navLinkStyle}
        >
          Manage Jobs
        </Link>

        <Link
          to="/admin/applications"
          style={activeNavLinkStyle}
        >
          Manage Applications
        </Link>
      </nav>

      {/* ERROR MESSAGE */}

      {error && (
        <div
          role="alert"
          style={{
            padding: "15px 18px",
            marginBottom: "22px",
            borderRadius: "10px",
            background: "#fff0ef",
            color: "#c0392b",
          }}
        >
          {error}
        </div>
      )}

      {/* SUMMARY CARDS */}

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "18px",
          marginBottom: "30px",
        }}
      >
        <div style={cardStyle}>
          <p style={{ color: "#64748b" }}>
            Total Applications
          </p>

          <h2
            style={{
              color: "#6253df",
              fontSize: "34px",
              margin: 0,
            }}
          >
            {applications.length}
          </h2>
        </div>

        <div style={cardStyle}>
          <p style={{ color: "#64748b" }}>
            Pending Applications
          </p>

          <h2
            style={{
              color: "#2563eb",
              fontSize: "34px",
              margin: 0,
            }}
          >
            {pendingCount}
          </h2>
        </div>

        <div style={cardStyle}>
          <p style={{ color: "#64748b" }}>
            Shortlisted / Selected
          </p>

          <h2
            style={{
              color: "#087b48",
              fontSize: "34px",
              margin: 0,
            }}
          >
            {shortlistedCount}
          </h2>
        </div>

        <div style={cardStyle}>
          <p style={{ color: "#64748b" }}>
            Rejected Applications
          </p>

          <h2
            style={{
              color: "#c0392b",
              fontSize: "34px",
              margin: 0,
            }}
          >
            {rejectedCount}
          </h2>
        </div>
      </section>

      {/* APPLICATION DIRECTORY */}

      <section style={cardStyle}>
        <div style={{ marginBottom: "22px" }}>
          <h2 style={{ margin: "0 0 8px" }}>
            Application Directory
          </h2>

          <p style={{ color: "#64748b", margin: 0 }}>
            Review candidates, applied jobs and recruitment statuses.
          </p>
        </div>

        {/* SEARCH AND FILTER */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <input
            type="search"
            placeholder="Search student, email, roll number, job or company..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "14px",
              border: "1px solid #dce1ee",
              borderRadius: "10px",
              fontSize: "15px",
              outlineColor: "#6253df",
            }}
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "14px",
              border: "1px solid #dce1ee",
              borderRadius: "10px",
              background: "#ffffff",
              fontSize: "15px",
            }}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <p style={{ color: "#64748b", marginBottom: "20px" }}>
          Showing {filteredApplications.length} of {applications.length} applications
        </p>

        {/* LOADING AND EMPTY STATES */}

        {loading ? (
          <p style={{ color: "#64748b" }}>
            Loading application records...
          </p>
        ) : filteredApplications.length === 0 ? (
          <div
            style={{
              padding: "35px 15px",
              textAlign: "center",
              color: "#64748b",
              background: "#f8f9fd",
              borderRadius: "12px",
            }}
          >
            No applications found matching your search.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                minWidth: "950px",
                borderCollapse: "collapse",
                textAlign: "left",
              }}
            >
              <thead>
                <tr style={{ background: "#f6f7fc" }}>
                  {[
                    "Application",
                    "Student",
                    "Job",
                    "Company",
                    "Applied On",
                    "Resume Match",
                    "Status",
                  ].map((heading) => (
                    <th
                      key={heading}
                      style={{
                        padding: "15px 12px",
                        color: "#64748b",
                        fontSize: "13px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredApplications.map((application) => {
                  const student = application.student || {};
                  const job = application.job || {};
                  const statusStyle = getStatusStyle(application.status);

                  return (
                    <tr
                      key={application.id}
                      style={{
                        borderBottom: "1px solid #edf0f6",
                      }}
                    >
                      <td style={{ padding: "17px 12px" }}>
                        <strong>#{application.id}</strong>
                      </td>

                      <td style={{ padding: "17px 12px" }}>
                        <strong>
                          {student.name || "Profile unavailable"}
                        </strong>

                        <div
                          style={{
                            color: "#64748b",
                            fontSize: "12px",
                            marginTop: "5px",
                          }}
                        >
                          {student.email || "No email"}
                        </div>

                        <div
                          style={{
                            color: "#64748b",
                            fontSize: "12px",
                            marginTop: "3px",
                          }}
                        >
                          {student.roll_number || "No roll number"}
                        </div>
                      </td>

                      <td style={{ padding: "17px 12px" }}>
                        <strong>
                          {job.title || "Job unavailable"}
                        </strong>

                        <div
                          style={{
                            color: "#64748b",
                            fontSize: "12px",
                            marginTop: "5px",
                          }}
                        >
                          Job ID: #{job.id ?? application.job_id}
                        </div>
                      </td>

                      <td style={{ padding: "17px 12px" }}>
                        {job.company_name || "Not provided"}
                      </td>

                      <td style={{ padding: "17px 12px" }}>
                        {formatDate(application.applied_at)}
                      </td>

                      <td style={{ padding: "17px 12px" }}>
                        {application.match_score != null
                          ? `${Number(application.match_score).toFixed(2)}%`
                          : "Not available"}
                      </td>

                      <td style={{ padding: "17px 12px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "7px 11px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "700",
                            background: statusStyle.background,
                            color: statusStyle.color,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatStatus(application.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
