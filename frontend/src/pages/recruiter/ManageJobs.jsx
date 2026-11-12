
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPatch } from "../../services/api";

const initialForm = {
  title: "",
  description: "",
  job_type: "Full-time",
  location: "",
  salary: "",
  min_cgpa: "",
  graduation_year: "",
  required_skills: "",
  eligible_branches: "",
  application_deadline: "",
};

function formatDate(value) {
  if (!value) return "No deadline";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not specified";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function toDateTimeLocal(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );

  return localDate.toISOString().slice(0, 16);
}

function splitList(value) {
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function ManageJobs() {
  const [jobs, setJobs] = useState([]);
  const [company, setCompany] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState(null);

  const [editingJob, setEditingJob] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================
  // LOAD RECRUITER'S OWN JOBS
  // =====================================

  async function loadJobs() {
    setLoading(true);
    setError("");

    try {
      const response = await apiGet("/recruiter/jobs");

      setJobs(response.jobs || []);
      setCompany(response.company || null);
    } catch (err) {
      setError(err.message || "Unable to load your job postings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, []);

  // =====================================
  // FILTER JOBS
  // =====================================

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesSearch =
        !query ||
        job.title?.toLowerCase().includes(query) ||
        job.description?.toLowerCase().includes(query) ||
        job.location?.toLowerCase().includes(query) ||
        job.job_type?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && job.is_active) ||
        (statusFilter === "inactive" && !job.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [jobs, search, statusFilter]);

  // =====================================
  // STATISTICS
  // =====================================

  const totalJobs = jobs.length;

  const activeJobs = jobs.filter(
    (job) => job.is_active
  ).length;

  const inactiveJobs = totalJobs - activeJobs;

  const totalApplicants = jobs.reduce(
    (total, job) => total + (Number(job.applicant_count) || 0),
    0
  );

  // =====================================
  // START EDITING
  // =====================================

  function startEditing(job) {
    setEditingJob(job);
    setError("");
    setSuccess("");

    setForm({
      title: job.title || "",
      description: job.description || "",
      job_type: job.job_type || "Full-time",
      location: job.location || "",
      salary: job.salary || "",
      min_cgpa: job.min_cgpa ?? "",
      graduation_year: job.graduation_year ?? "",
      required_skills: (job.required_skills || []).join(", "),
      eligible_branches: (job.eligible_branches || []).join(", "),
      application_deadline: toDateTimeLocal(
        job.application_deadline
      ),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelEditing() {
    setEditingJob(null);
    setForm(initialForm);
    setError("");
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // =====================================
  // SAVE JOB EDITS
  // =====================================

  async function handleUpdateJob(event) {
    event.preventDefault();

    if (!editingJob) return;

    setSaving(true);
    setError("");
    setSuccess("");

    const minCgpa =
      form.min_cgpa === "" ? null : Number(form.min_cgpa);

    const graduationYear =
      form.graduation_year === ""
        ? null
        : Number(form.graduation_year);

    if (
      minCgpa !== null &&
      (!Number.isFinite(minCgpa) || minCgpa < 0 || minCgpa > 10)
    ) {
      setError("Minimum CGPA must be between 0 and 10.");
      setSaving(false);
      return;
    }

    if (
      graduationYear !== null &&
      (!Number.isInteger(graduationYear) ||
        graduationYear < 1900 ||
        graduationYear > 2200)
    ) {
      setError("Please enter a valid graduation year.");
      setSaving(false);
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      job_type: form.job_type,
      location: form.location.trim() || null,
      salary: form.salary.trim() || null,
      min_cgpa: minCgpa,
      graduation_year: graduationYear,
      required_skills: splitList(form.required_skills),
      eligible_branches: splitList(form.eligible_branches),
      application_deadline: form.application_deadline
        ? new Date(form.application_deadline).toISOString()
        : null,
    };

    if (!payload.title || !payload.description) {
      setError("Job title and description are required.");
      setSaving(false);
      return;
    }

    try {
      const response = await apiPatch(
        `/recruiter/jobs/${editingJob.id}`,
        payload
      );

      setJobs((previous) =>
        previous.map((job) =>
          job.id === editingJob.id ? response.job : job
        )
      );

      setSuccess("Job posting updated successfully.");
      setEditingJob(null);
      setForm(initialForm);
    } catch (err) {
      setError(err.message || "Unable to update this job.");
    } finally {
      setSaving(false);
    }
  }

  // =====================================
  // DEACTIVATE JOB
  // =====================================

  async function deactivateJob(job) {
    const confirmed = window.confirm(
      `Are you sure you want to deactivate "${job.title}"?`
    );

    if (!confirmed) return;

    setDeactivatingId(job.id);
    setError("");
    setSuccess("");

    try {
      const response = await apiPatch(
        `/recruiter/jobs/${job.id}/deactivate`,
        {}
      );

      setJobs((previous) =>
        previous.map((item) =>
          item.id === job.id ? response.job : item
        )
      );

      setSuccess("Job posting deactivated successfully.");
    } catch (err) {
      setError(err.message || "Unable to deactivate this job.");
    } finally {
      setDeactivatingId(null);
    }
  }

  // =====================================
  // STYLES
  // =====================================

  const cardStyle = {
    background: "#ffffff",
    border: "1px solid #e5e7f0",
    borderRadius: "16px",
    padding: "22px",
    boxShadow: "0 5px 20px rgba(25,35,70,0.04)",
  };

  const buttonStyle = {
    padding: "11px 16px",
    border: "1px solid #ded9ff",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#6253df",
    fontWeight: "700",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    border: "1px solid #dce1ee",
    borderRadius: "9px",
    background: "#ffffff",
    fontSize: "14px",
    outlineColor: "#6253df",
  };

  const navLinkStyle = {
    ...buttonStyle,
  };

  const activeNavStyle = {
    ...navLinkStyle,
    background: "#6253df",
    color: "#ffffff",
    borderColor: "#6253df",
  };

  // =====================================
  // PAGE
  // =====================================

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f6f7fc",
        padding: "35px 5%",
        color: "#172033",
        boxSizing: "border-box",
      }}
    >

      {/* HEADER */}

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
          <h1
            style={{
              color: "#6253df",
              margin: 0,
              fontSize: "32px",
            }}
          >
            PlaceMate AI
          </h1>

          <span
            style={{
              display: "inline-block",
              marginTop: "8px",
              padding: "6px 11px",
              borderRadius: "7px",
              background: "#eeebff",
              color: "#6253df",
              fontSize: "12px",
              fontWeight: "800",
            }}
          >
            RECRUITER
          </span>
        </div>

        <button
          type="button"
          onClick={loadJobs}
          disabled={loading}
          style={buttonStyle}
        >
          {loading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </header>

      {/* RECRUITER NAVIGATION */}

      <nav
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "35px",
        }}
      >
        <Link
          to="/recruiter/dashboard"
          style={navLinkStyle}
        >
          Dashboard
        </Link>

        <Link
          to="/recruiter/jobs"
          style={activeNavStyle}
        >
          Manage Jobs
        </Link>

        <Link
          to="/recruiter/applicants"
          style={navLinkStyle}
        >
          Applicants
        </Link>
      </nav>

      {/* PAGE TITLE */}

      <section style={{ marginBottom: "28px" }}>
        <p
          style={{
            color: "#6253df",
            fontSize: "13px",
            fontWeight: "800",
            letterSpacing: "2px",
          }}
        >
          RECRUITMENT MANAGEMENT
        </p>

        <h1 style={{ fontSize: "36px", margin: "8px 0" }}>
          Manage Your Jobs
        </h1>

        <p style={{ color: "#64748b", fontSize: "16px" }}>
          View, edit and manage your company's job postings.
        </p>

        {company && (
          <p style={{ color: "#64748b" }}>
            Company: <strong>{company.name}</strong>
          </p>
        )}
      </section>

      {/* FEEDBACK */}

      {error && (
        <div
          role="alert"
          style={{
            background: "#fff0ef",
            color: "#c0392b",
            borderRadius: "10px",
            padding: "14px",
            marginBottom: "18px",
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          style={{
            background: "#e8f8ef",
            color: "#087b48",
            borderRadius: "10px",
            padding: "14px",
            marginBottom: "18px",
          }}
        >
          {success}
        </div>
      )}

      {/* SUMMARY */}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "18px",
          marginBottom: "30px",
        }}
      >
        {[
          {
            label: "Total Job Postings",
            value: totalJobs,
            color: "#6253df",
          },
          {
            label: "Active Jobs",
            value: activeJobs,
            color: "#087b48",
          },
          {
            label: "Inactive Jobs",
            value: inactiveJobs,
            color: "#c0392b",
          },
          {
            label: "Applications Received",
            value: totalApplicants,
            color: "#2563eb",
          },
        ].map((stat) => (
          <div key={stat.label} style={cardStyle}>
            <p style={{ color: "#64748b" }}>{stat.label}</p>

            <h2
              style={{
                fontSize: "34px",
                margin: 0,
                color: stat.color,
              }}
            >
              {stat.value}
            </h2>
          </div>
        ))}
      </section>

      {/* EDIT FORM */}

      {editingJob && (
        <section
          style={{
            ...cardStyle,
            marginBottom: "30px",
          }}
        >
          <h2>Edit Job Posting #{editingJob.id}</h2>

          <p style={{ color: "#64748b" }}>
            Update the details of your job posting.
          </p>

          <form onSubmit={handleUpdateJob}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "18px",
              }}
            >
              {[
                {
                  label: "Job Title",
                  name: "title",
                  type: "text",
                },
                {
                  label: "Location",
                  name: "location",
                  type: "text",
                },
                {
                  label: "Salary / Stipend",
                  name: "salary",
                  type: "text",
                },
                {
                  label: "Minimum CGPA",
                  name: "min_cgpa",
                  type: "number",
                },
                {
                  label: "Graduation Year",
                  name: "graduation_year",
                  type: "number",
                },
                {
                  label: "Application Deadline",
                  name: "application_deadline",
                  type: "datetime-local",
                },
              ].map((field) => (
                <div key={field.name}>
                  <label
                    htmlFor={`edit-${field.name}`}
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "700",
                    }}
                  >
                    {field.label}
                  </label>

                  <input
                    id={`edit-${field.name}`}
                    name={field.name}
                    type={field.type}
                    value={form[field.name]}
                    onChange={handleChange}
                    style={inputStyle}
                    step={field.name === "min_cgpa" ? "0.01" : undefined}
                    min={field.name === "min_cgpa" ? "0" : undefined}
                    max={field.name === "min_cgpa" ? "10" : undefined}
                  />
                </div>
              ))}

              <div>
                <label
                  htmlFor="edit-job-type"
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "700",
                  }}
                >
                  Job Type
                </label>

                <select
                  id="edit-job-type"
                  name="job_type"
                  value={form.job_type}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option>Full-time</option>
                  <option>Internship</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="edit-required-skills"
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "700",
                  }}
                >
                  Required Skills
                </label>

                <input
                  id="edit-required-skills"
                  name="required_skills"
                  value={form.required_skills}
                  onChange={handleChange}
                  placeholder="Python, SQL, Excel"
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  htmlFor="edit-branches"
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "700",
                  }}
                >
                  Eligible Branches
                </label>

                <input
                  id="edit-branches"
                  name="eligible_branches"
                  value={form.eligible_branches}
                  onChange={handleChange}
                  placeholder="CSE, IT, ECE"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginTop: "18px" }}>
              <label
                htmlFor="edit-description"
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "700",
                }}
              >
                Job Description
              </label>

              <textarea
                id="edit-description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                required
                style={{
                  ...inputStyle,
                  resize: "vertical",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                marginTop: "20px",
              }}
            >
              <button
                type="submit"
                disabled={saving}
                style={{
                  ...buttonStyle,
                  background: "#6253df",
                  color: "#ffffff",
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                onClick={cancelEditing}
                disabled={saving}
                style={buttonStyle}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* JOB DIRECTORY */}

      <section style={cardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <h2>My Job Postings</h2>
            <p style={{ color: "#64748b" }}>
              Jobs published by your company.
            </p>
          </div>

          <Link
            to="/recruiter/create-job"
            style={{
              ...buttonStyle,
              background: "#6253df",
              color: "#ffffff",
            }}
          >
            + Create Job
          </Link>
        </div>

        {/* SEARCH AND FILTER */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
            margin: "22px 0",
          }}
        >
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search job title or location..."
            style={inputStyle}
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            style={inputStyle}
          >
            <option value="all">All Jobs</option>
            <option value="active">Active Jobs</option>
            <option value="inactive">Inactive Jobs</option>
          </select>
        </div>

        <p style={{ color: "#64748b", marginBottom: "20px" }}>
          Showing {filteredJobs.length} of {totalJobs} job postings
        </p>

        {loading ? (
          <p>Loading your job postings...</p>
        ) : filteredJobs.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "35px",
              background: "#f8f9fd",
              borderRadius: "12px",
              color: "#64748b",
            }}
          >
            No job postings found.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
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
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "10px",
                    marginBottom: "15px",
                  }}
                >
                  <span
                    style={{
                      padding: "6px 10px",
                      borderRadius: "7px",
                      background: "#eeebff",
                      color: "#6253df",
                      fontWeight: "800",
                      fontSize: "12px",
                    }}
                  >
                    {(job.job_type || "JOB").toUpperCase()}
                  </span>

                  <span
                    style={{
                      padding: "7px 11px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "700",
                      background: job.is_active ? "#e8f8ef" : "#f0f3f8",
                      color: job.is_active ? "#087b48" : "#64748b",
                    }}
                  >
                    {job.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <h3 style={{ fontSize: "21px", margin: "0 0 10px" }}>
                  {job.title}
                </h3>

                <p
                  style={{
                    color: "#64748b",
                    lineHeight: "1.6",
                    whiteSpace: "pre-line",
                    overflowWrap: "anywhere",
                  }}
                >
                  {job.description || "No description provided."}
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                    borderTop: "1px solid #edf0f6",
                    borderBottom: "1px solid #edf0f6",
                    padding: "17px 0",
                    margin: "17px 0",
                  }}
                >
                  {[
                    ["Location", job.location || "Not specified"],
                    ["Salary", job.salary || "Not disclosed"],
                    ["Minimum CGPA", job.min_cgpa ?? "Not specified"],
                    ["Graduation Year", job.graduation_year || "All batches"],
                    ["Application Deadline", formatDate(job.application_deadline)],
                    ["Applicants", job.applicant_count ?? 0],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p
                        style={{
                          color: "#94a3b8",
                          fontSize: "12px",
                          margin: "0 0 5px",
                        }}
                      >
                        {label}
                      </p>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <strong>Required Skills</strong>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "7px",
                      marginTop: "10px",
                    }}
                  >
                    {(job.required_skills || []).length > 0 ? (
                      job.required_skills.map((skill, index) => (
                        <span
                          key={`${job.id}-${skill}-${index}`}
                          style={{
                            background: "#eeebff",
                            color: "#6253df",
                            padding: "6px 9px",
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
                        No skills specified.
                      </span>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => startEditing(job)}
                    style={{
                      ...buttonStyle,
                      flex: 1,
                    }}
                  >
                    Edit Job
                  </button>

                  {job.is_active && (
                    <button
                      type="button"
                      onClick={() => deactivateJob(job)}
                      disabled={deactivatingId === job.id}
                      style={{
                        ...buttonStyle,
                        flex: 1,
                        background: "#fff0ef",
                        borderColor: "#fff0ef",
                        color: "#c0392b",
                        opacity: deactivatingId === job.id ? 0.6 : 1,
                      }}
                    >
                      {deactivatingId === job.id
                        ? "Updating..."
                        : "Deactivate"}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && jobs.some((job) => !job.is_active) && (
          <p
            style={{
              marginTop: "22px",
              color: "#64748b",
              fontSize: "13px",
            }}
          >
            Inactive postings remain visible in your directory. Reactivation
            is not exposed by the current recruiter backend API.
          </p>
        )}
      </section>
    </main>
  );
}
