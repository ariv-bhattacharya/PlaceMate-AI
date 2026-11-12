
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPatch } from "../../services/api";

export default function ManageJobs() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadJobs() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiGet(
        "/admin/jobs?page=1&per_page=100"
      );

      setJobs(response.jobs || []);
    } catch (err) {
      setError(err.message || "Unable to load job postings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, []);

  // SEARCH AND STATUS FILTER
  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesSearch =
        !query ||
        job.title?.toLowerCase().includes(query) ||
        job.company_name?.toLowerCase().includes(query) ||
        job.location?.toLowerCase().includes(query) ||
        job.job_type?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && job.is_active) ||
        (statusFilter === "inactive" && !job.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [jobs, search, statusFilter]);

  // JOB STATISTICS
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((job) => job.is_active).length;
  const inactiveJobs = totalJobs - activeJobs;

  // ACTIVATE / DEACTIVATE JOB
  async function updateJobStatus(job) {
    const nextStatus = !job.is_active;

    const confirmed = window.confirm(
      `Are you sure you want to ${
        nextStatus ? "activate" : "deactivate"
      } "${job.title}"?`
    );

    if (!confirmed) return;

    setUpdatingId(job.id);
    setError("");
    setSuccess("");

    try {
      const response = await apiPatch(
        `/admin/jobs/${job.id}/status`,
        { is_active: nextStatus }
      );

      setJobs((previous) =>
        previous.map((item) =>
          item.id === job.id
            ? {
                ...item,
                is_active: response.job.is_active,
              }
            : item
        )
      );

      setSuccess(
        response.message || "Job status updated successfully."
      );
    } catch (err) {
      setError(err.message || "Unable to update job status.");
    } finally {
      setUpdatingId(null);
    }
  }

  function formatDate(value) {
    if (!value) return "No deadline";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Not specified";
    }

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

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
            Manage Job Postings
          </h1>

          <p style={{ color: "#64748b", fontSize: "16px" }}>
            Monitor job opportunities published by companies across PlaceMate AI.
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
            onClick={loadJobs}
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
        <Link to="/admin/dashboard" style={navLinkStyle}>
          Dashboard
        </Link>

        <Link to="/admin/students" style={navLinkStyle}>
          Manage Students
        </Link>

        <Link to="/admin/companies" style={navLinkStyle}>
          Manage Companies
        </Link>

        <Link to="/admin/jobs" style={activeNavLinkStyle}>
          Manage Jobs
        </Link>

        <Link to="/admin/applications" style={navLinkStyle}>
          Manage Applications
        </Link>
      </nav>

      {/* FEEDBACK */}

      {error && (
        <div
          role="alert"
          style={{
            padding: "14px 18px",
            marginBottom: "20px",
            borderRadius: "10px",
            background: "#fff0ef",
            color: "#c0392b",
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          style={{
            padding: "14px 18px",
            marginBottom: "20px",
            borderRadius: "10px",
            background: "#e8f8ef",
            color: "#087b48",
          }}
        >
          {success}
        </div>
      )}

      {/* SUMMARY CARDS */}

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "18px",
          marginBottom: "30px",
        }}
      >
        <div style={cardStyle}>
          <p style={{ color: "#64748b" }}>Total Job Postings</p>
          <h2
            style={{
              color: "#6253df",
              fontSize: "34px",
              margin: 0,
            }}
          >
            {totalJobs}
          </h2>
        </div>

        <div style={cardStyle}>
          <p style={{ color: "#64748b" }}>Active Jobs</p>
          <h2
            style={{
              color: "#087b48",
              fontSize: "34px",
              margin: 0,
            }}
          >
            {activeJobs}
          </h2>
        </div>

        <div style={cardStyle}>
          <p style={{ color: "#64748b" }}>Inactive Jobs</p>
          <h2
            style={{
              color: "#c0392b",
              fontSize: "34px",
              margin: 0,
            }}
          >
            {inactiveJobs}
          </h2>
        </div>
      </section>

      {/* JOB DIRECTORY */}

      <section style={cardStyle}>
        <div style={{ marginBottom: "22px" }}>
          <h2 style={{ margin: "0 0 8px" }}>
            Job Directory
          </h2>

          <p style={{ color: "#64748b", margin: 0 }}>
            View and manage all job postings on the platform.
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
            placeholder="Search job title, company or location..."
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
            <option value="all">All Jobs</option>
            <option value="active">Active Jobs</option>
            <option value="inactive">Inactive Jobs</option>
          </select>
        </div>

        <p style={{ color: "#64748b", marginBottom: "20px" }}>
          Showing {filteredJobs.length} of {totalJobs} job postings
        </p>

        {/* LOADING AND EMPTY STATES */}

        {loading ? (
          <p style={{ color: "#64748b" }}>
            Loading job postings...
          </p>
        ) : filteredJobs.length === 0 ? (
          <div
            style={{
              padding: "35px 15px",
              textAlign: "center",
              color: "#64748b",
              background: "#f8f9fd",
              borderRadius: "12px",
            }}
          >
            No job postings found matching your search.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(290px, 1fr))",
              gap: "20px",
            }}
          >
            {filteredJobs.map((job) => (
              <article
                key={job.id}
                style={{
                  border: "1px solid #e5e7f0",
                  borderRadius: "14px",
                  padding: "20px",
                  background: "#ffffff",
                  minWidth: 0,
                }}
              >
                {/* JOB TITLE AND STATUS */}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginBottom: "16px",
                  }}
                >
                  <span
                    style={{
                      padding: "6px 10px",
                      borderRadius: "7px",
                      background: "#eeebff",
                      color: "#6253df",
                      fontSize: "12px",
                      fontWeight: "800",
                    }}
                  >
                    {(job.job_type || "JOB").toUpperCase()}
                  </span>

                  <span
                    style={{
                      padding: "7px 11px",
                      borderRadius: "20px",
                      background: job.is_active
                        ? "#e8f8ef"
                        : "#f0f3f8",
                      color: job.is_active
                        ? "#087b48"
                        : "#64748b",
                      fontSize: "12px",
                      fontWeight: "700",
                    }}
                  >
                    {job.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <h3
                  style={{
                    fontSize: "21px",
                    margin: "0 0 7px",
                  }}
                >
                  {job.title}
                </h3>

                <p
                  style={{
                    color: "#6253df",
                    fontWeight: "700",
                    margin: "0 0 16px",
                  }}
                >
                  {job.company_name || "Company not specified"}
                </p>

                <p
                  style={{
                    color: "#64748b",
                    lineHeight: "1.6",
                    marginBottom: "18px",
                    whiteSpace: "pre-line",
                    overflowWrap: "anywhere",
                  }}
                >
                  {job.description?.length > 180
                    ? `${job.description.slice(0, 180)}...`
                    : job.description || "No job description provided."}
                </p>

                {/* JOB DETAILS */}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                    padding: "16px 0",
                    borderTop: "1px solid #edf0f6",
                    borderBottom: "1px solid #edf0f6",
                  }}
                >
                  {[
                    {
                      label: "Location",
                      value: job.location || "Not specified",
                    },
                    {
                      label: "Salary / Stipend",
                      value: job.salary || "Not disclosed",
                    },
                    {
                      label: "Minimum CGPA",
                      value: job.min_cgpa ?? "No minimum specified",
                    },
                    {
                      label: "Graduation Year",
                      value: job.graduation_year || "All batches",
                    },
                    {
                      label: "Application Deadline",
                      value: formatDate(job.application_deadline),
                    },
                    {
                      label: "Applicants",
                      value: job.application_count ?? 0,
                    },
                    {
                      label: "Job ID",
                      value: `#${job.id}`,
                    },
                  ].map((detail) => (
                    <div key={detail.label}>
                      <p
                        style={{
                          color: "#94a3b8",
                          fontSize: "13px",
                          margin: "0 0 5px",
                        }}
                      >
                        {detail.label}
                      </p>

                      <strong>{detail.value}</strong>
                    </div>
                  ))}
                </div>

                {/* REQUIRED SKILLS */}

                <div style={{ padding: "16px 0" }}>
                  <strong>Required Skills</strong>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                      marginTop: "10px",
                    }}
                  >
                    {(job.required_skills || []).length > 0 ? (
                      job.required_skills.map((skill, index) => (
                        <span
                          key={`${skill}-${index}`}
                          style={{
                            background: "#eeebff",
                            color: "#6253df",
                            padding: "6px 10px",
                            borderRadius: "7px",
                            fontSize: "12px",
                            fontWeight: "700",
                          }}
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: "#94a3b8" }}>
                        No specific skills listed.
                      </span>
                    )}
                  </div>
                </div>

                {/* ACTIVATE / DEACTIVATE */}

                <button
                  onClick={() => updateJobStatus(job)}
                  disabled={updatingId === job.id}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "none",
                    borderRadius: "9px",
                    fontWeight: "700",
                    cursor:
                      updatingId === job.id ? "wait" : "pointer",
                    background: job.is_active
                      ? "#fff0ef"
                      : "#e8f8ef",
                    color: job.is_active
                      ? "#c0392b"
                      : "#087b48",
                    opacity: updatingId === job.id ? 0.6 : 1,
                  }}
                >
                  {updatingId === job.id
                    ? "Updating..."
                    : job.is_active
                      ? "Deactivate Job"
                      : "Activate Job"}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
