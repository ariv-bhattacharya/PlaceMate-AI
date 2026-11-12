
import { useState } from "react";
import { Link } from "react-router-dom";
import { apiPost } from "../../services/api";

const initialForm = {
  title: "",
  description: "",
  required_skills: "",
  location: "",
  job_type: "Full-time",
  salary: "",
  min_cgpa: "",
  eligible_branches: "",
  graduation_year: "",
  application_deadline: "",
};

export default function CreateJob() {
  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdJob, setCreatedJob] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setCreatedJob(null);

    const skills = formData.required_skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    const branches = formData.eligible_branches
      .split(",")
      .map((branch) => branch.trim())
      .filter(Boolean);

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      required_skills: skills,
      location: formData.location.trim() || null,
      job_type: formData.job_type,
      salary: formData.salary.trim() || null,
      min_cgpa:
        formData.min_cgpa === ""
          ? null
          : Number(formData.min_cgpa),
      eligible_branches: branches,
      graduation_year:
        formData.graduation_year === ""
          ? null
          : Number(formData.graduation_year),
      application_deadline:
        formData.application_deadline || null,
    };

    if (
      payload.min_cgpa !== null &&
      (!Number.isFinite(payload.min_cgpa) ||
        payload.min_cgpa < 0 ||
        payload.min_cgpa > 10)
    ) {
      setError("Minimum CGPA must be between 0 and 10.");
      return;
    }

    if (
      payload.graduation_year !== null &&
      (!Number.isInteger(payload.graduation_year) ||
        payload.graduation_year < 1900 ||
        payload.graduation_year > 2200)
    ) {
      setError("Please enter a valid graduation year.");
      return;
    }

    setLoading(true);

    try {
      const response = await apiPost("/recruiter/jobs", payload);

      setCreatedJob(response.job);
      setFormData(initialForm);

    } catch (err) {
      setError(err.message || "Unable to create the job posting.");
    } finally {
      setLoading(false);
    }
  };

  if (createdJob) {
    return (
      <main style={styles.page}>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>✓</div>

          <h1>Job Created Successfully!</h1>

          <p style={styles.subtitle}>
            Your new job posting has been saved and is now available
            to eligible students.
          </p>

          <div style={styles.createdJobDetails}>
            <span>JOB POSTING</span>
            <h2>{createdJob.title}</h2>
            <p>{createdJob.company_name}</p>

            <div style={styles.successDetails}>
              <div>
                <span>Job ID</span>
                <strong>#{createdJob.id}</strong>
              </div>

              <div>
                <span>Location</span>
                <strong>{createdJob.location || "Not specified"}</strong>
              </div>

              <div>
                <span>Salary</span>
                <strong>{createdJob.salary || "Not disclosed"}</strong>
              </div>

              <div>
                <span>Status</span>
                <strong style={{ color: "#059669" }}>Active</strong>
              </div>
            </div>
          </div>

          <div style={styles.successActions}>
            <button
              type="button"
              onClick={() => setCreatedJob(null)}
              style={styles.primaryButton}
            >
              Create Another Job
            </button>

            <Link
              to="/recruiter/dashboard"
              style={styles.secondaryButton}
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>

      {/* NAVIGATION */}
      <nav style={styles.navbar}>
        <Link to="/recruiter/dashboard" style={styles.logo}>
          PlaceMate AI
          <span style={styles.logoTag}>RECRUITER</span>
        </Link>

        <div style={styles.navLinks}>
          <Link to="/recruiter/dashboard" style={styles.navLink}>
            Dashboard
          </Link>

          <Link to="/recruiter/jobs" style={styles.navLink}>
            Manage Jobs
          </Link>

          <Link to="/recruiter/applicants" style={styles.navLink}>
            Applicants
          </Link>
        </div>
      </nav>

      <section style={styles.content}>

        {/* PAGE HEADER */}
        <header style={styles.header}>
          <div>
            <span style={styles.eyebrow}>RECRUITMENT MANAGEMENT</span>

            <h1>Create a Job Posting</h1>

            <p>
              Publish a new placement opportunity for students.
              Provide accurate eligibility criteria and job details.
            </p>
          </div>

          <Link
            to="/recruiter/dashboard"
            style={styles.backLink}
          >
            ← Dashboard
          </Link>
        </header>


        {/* JOB FORM */}
        <form onSubmit={handleSubmit} style={styles.form}>

          <div style={styles.formHeading}>
            <h2>Job Information</h2>
            <p>Fields marked with * are required.</p>
          </div>

          {error && (
            <div style={styles.error} role="alert">
              {error}
            </div>
          )}


          {/* BASIC INFORMATION */}
          <div style={styles.field}>
            <label htmlFor="title">
              Job Title *
            </label>

            <input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Junior Data Analyst"
              maxLength={150}
              required
              style={styles.input}
            />
          </div>


          <div style={styles.field}>
            <label htmlFor="description">
              Job Description *
            </label>

            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the job role, responsibilities and requirements..."
              rows={6}
              required
              style={styles.textarea}
            />
          </div>


          <div style={styles.twoColumnGrid}>

            <div style={styles.field}>
              <label htmlFor="job_type">
                Job Type
              </label>

              <select
                id="job_type"
                name="job_type"
                value={formData.job_type}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="Full-time">Full-time</option>
                <option value="Internship">Internship</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
              </select>
            </div>

            <div style={styles.field}>
              <label htmlFor="location">
                Job Location
              </label>

              <input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Bhubaneswar"
                maxLength={150}
                style={styles.input}
              />
            </div>

          </div>


          <div style={styles.twoColumnGrid}>

            <div style={styles.field}>
              <label htmlFor="salary">
                Salary / Stipend
              </label>

              <input
                id="salary"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                placeholder="e.g. 5-7 LPA or 15000/month"
                maxLength={100}
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label htmlFor="application_deadline">
                Application Deadline
              </label>

              <input
                id="application_deadline"
                name="application_deadline"
                type="datetime-local"
                value={formData.application_deadline}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

          </div>


          {/* SKILLS */}
          <div style={styles.sectionDivider}>
            <h2>Required Skills</h2>
            <p>
              Enter skills separated by commas.
            </p>
          </div>

          <div style={styles.field}>
            <label htmlFor="required_skills">
              Required Skills
            </label>

            <input
              id="required_skills"
              name="required_skills"
              value={formData.required_skills}
              onChange={handleChange}
              placeholder="Python, SQL, Excel, Power BI"
              style={styles.input}
            />

            <span style={styles.helperText}>
              Example: Python, SQL, Excel, Communication
            </span>
          </div>


          {/* ELIGIBILITY */}
          <div style={styles.sectionDivider}>
            <h2>Student Eligibility Criteria</h2>
            <p>
              Specify the academic requirements for this job.
            </p>
          </div>


          <div style={styles.twoColumnGrid}>

            <div style={styles.field}>
              <label htmlFor="min_cgpa">
                Minimum CGPA
              </label>

              <input
                id="min_cgpa"
                name="min_cgpa"
                type="number"
                min="0"
                max="10"
                step="0.01"
                value={formData.min_cgpa}
                onChange={handleChange}
                placeholder="e.g. 7.0"
                style={styles.input}
              />

              <span style={styles.helperText}>
                Leave blank if there is no minimum CGPA.
              </span>
            </div>


            <div style={styles.field}>
              <label htmlFor="graduation_year">
                Eligible Graduation Year
              </label>

              <input
                id="graduation_year"
                name="graduation_year"
                type="number"
                min="1900"
                max="2200"
                value={formData.graduation_year}
                onChange={handleChange}
                placeholder="e.g. 2027"
                style={styles.input}
              />

              <span style={styles.helperText}>
                Leave blank if multiple batches are eligible.
              </span>
            </div>

          </div>


          <div style={styles.field}>
            <label htmlFor="eligible_branches">
              Eligible Branches
            </label>

            <input
              id="eligible_branches"
              name="eligible_branches"
              value={formData.eligible_branches}
              onChange={handleChange}
              placeholder="CSE, IT, ECE"
              style={styles.input}
            />

            <span style={styles.helperText}>
              Enter branch names separated by commas. Leave blank
              to allow all branches.
            </span>
          </div>


          {/* SUBMIT */}
          <div style={styles.formFooter}>

            <Link
              to="/recruiter/dashboard"
              style={styles.cancelButton}
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.primaryButton,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Publishing Job..." : "Publish Job Posting →"}
            </button>

          </div>

        </form>

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

  content: {
    width: "min(1000px, 92%)",
    margin: "40px auto",
    paddingBottom: "40px",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px",
    marginBottom: "28px",
  },

  eyebrow: {
    color: "#6254d9",
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "1.6px",
  },

  backLink: {
    padding: "11px 16px",
    border: "1px solid #dedaf8",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#6254d9",
    fontSize: "13px",
    fontWeight: "700",
    textDecoration: "none",
  },

  form: {
    padding: "32px",
    background: "#ffffff",
    border: "1px solid #e6e8f0",
    borderRadius: "16px",
    boxShadow: "0 5px 20px rgba(20,30,70,0.04)",
  },

  formHeading: {
    marginBottom: "25px",
    paddingBottom: "20px",
    borderBottom: "1px solid #edf0f5",
  },

  sectionDivider: {
    marginTop: "32px",
    marginBottom: "20px",
    paddingTop: "23px",
    borderTop: "1px solid #edf0f5",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "9px",
    marginBottom: "21px",
    minWidth: 0,
  },

  twoColumnGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "20px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    border: "1px solid #dce0eb",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#334155",
    fontSize: "14px",
    fontFamily: "Arial, sans-serif",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    border: "1px solid #dce0eb",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#334155",
    fontSize: "14px",
    fontFamily: "Arial, sans-serif",
    resize: "vertical",
    lineHeight: 1.6,
  },

  helperText: {
    color: "#94a3b8",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  error: {
    padding: "13px 16px",
    marginBottom: "20px",
    borderRadius: "9px",
    background: "#fff0ed",
    border: "1px solid #fecaca",
    color: "#b42318",
    fontSize: "13px",
  },

  formFooter: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "13px",
    marginTop: "30px",
    paddingTop: "23px",
    borderTop: "1px solid #edf0f5",
  },

  primaryButton: {
    display: "inline-block",
    padding: "13px 20px",
    border: "none",
    borderRadius: "9px",
    background: "#6254d9",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "750",
    textDecoration: "none",
    cursor: "pointer",
  },

  cancelButton: {
    padding: "12px 18px",
    border: "1px solid #dedaf8",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#6254d9",
    fontSize: "14px",
    fontWeight: "700",
    textDecoration: "none",
  },

  successCard: {
    width: "min(650px, 90%)",
    margin: "70px auto",
    padding: "35px",
    background: "#ffffff",
    border: "1px solid #e6e8f0",
    borderRadius: "17px",
    boxShadow: "0 8px 30px rgba(20,30,70,0.05)",
    textAlign: "center",
    boxSizing: "border-box",
  },

  successIcon: {
    width: "62px",
    height: "62px",
    margin: "0 auto 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "#e8f8ef",
    color: "#187747",
    fontSize: "34px",
  },

  subtitle: {
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.7,
  },

  createdJobDetails: {
    margin: "26px 0",
    padding: "23px",
    borderRadius: "12px",
    background: "#f8f8ff",
    border: "1px solid #e9e7ff",
    textAlign: "left",
  },

  successDetails: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "20px",
    marginTop: "20px",
  },

  successActions: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "12px",
  },

  secondaryButton: {
    display: "inline-block",
    padding: "12px 18px",
    border: "1px solid #dedaf8",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#6254d9",
    fontSize: "14px",
    fontWeight: "700",
    textDecoration: "none",
  },
};
