
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,
} from "../../services/api";
import "./StudentProfile.css";

const initialForm = {
  roll_number: "",
  branch: "",
  graduation_year: "",
  cgpa: "",
  tenth_percentage: "",
  twelfth_percentage: "",
  phone: "",
  location: "",
  linkedin_url: "",
  github_url: "",
  portfolio_url: "",
};

const initialProject = {
  title: "",
  description: "",
  technologies: "",
  github_url: "",
  live_url: "",
  start_date: "",
  end_date: "",
  status: "completed",
};

const initialInternship = {
  company_name: "",
  role: "",
  description: "",
  skills_used: "",
  start_date: "",
  end_date: "",
  status: "completed",
};

const formatDate = (date) => {
  if (!date) return "Not specified";

  return new Date(`${date}T00:00:00`).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
};

const parseList = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState(initialForm);

  const [projects, setProjects] = useState([]);
  const [internships, setInternships] = useState([]);

  const [projectForm, setProjectForm] = useState(initialProject);
  const [internshipForm, setInternshipForm] = useState(initialInternship);

  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingInternshipId, setEditingInternshipId] = useState(null);

  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showInternshipForm, setShowInternshipForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [recordError, setRecordError] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiGet("/students/me");

      setProfile(response.profile);

      const savedProfile = response.profile;

      setFormData({
        roll_number: savedProfile.roll_number || "",
        branch: savedProfile.branch || "",
        graduation_year: savedProfile.graduation_year ?? "",
        cgpa: savedProfile.cgpa ?? "",
        tenth_percentage: savedProfile.tenth_percentage ?? "",
        twelfth_percentage: savedProfile.twelfth_percentage ?? "",
        phone: savedProfile.phone || "",
        location: savedProfile.location || "",
        linkedin_url: savedProfile.linkedin_url || "",
        github_url: savedProfile.github_url || "",
        portfolio_url: savedProfile.portfolio_url || "",
      });
    } catch (err) {
      setError(err.message || "Unable to load student profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      const response = await apiGet("/profile/projects");
      setProjects(response.data || []);
    } catch (err) {
      setRecordError(
        err.message || "Unable to load projects."
      );
    }
  }, []);

  const loadInternships = useCallback(async () => {
    try {
      const response = await apiGet("/profile/internships");
      setInternships(response.data || []);
    } catch (err) {
      setRecordError(
        err.message || "Unable to load internships."
      );
    }
  }, []);

  useEffect(() => {
    loadProfile();
    loadProjects();
    loadInternships();
  }, [loadProfile, loadProjects, loadInternships]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        roll_number: profile.roll_number || "",
        branch: profile.branch || "",
        graduation_year: profile.graduation_year ?? "",
        cgpa: profile.cgpa ?? "",
        tenth_percentage: profile.tenth_percentage ?? "",
        twelfth_percentage: profile.twelfth_percentage ?? "",
        phone: profile.phone || "",
        location: profile.location || "",
        linkedin_url: profile.linkedin_url || "",
        github_url: profile.github_url || "",
        portfolio_url: profile.portfolio_url || "",
      });
    }

    setEditing(false);
    setError("");
  };

  const handleSave = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const numericFields = [
      "graduation_year",
      "cgpa",
      "tenth_percentage",
      "twelfth_percentage",
    ];

    const payload = { ...formData };

    for (const field of numericFields) {
      if (payload[field] === "") {
        payload[field] = null;
      } else {
        payload[field] = Number(payload[field]);

        if (!Number.isFinite(payload[field])) {
          setError(
            `Please enter a valid ${field.replaceAll("_", " ")}.`
          );
          return;
        }
      }
    }

    setSaving(true);

    try {
      const response = await apiPatch("/students/me", payload);

      setProfile(response.profile);
      setSuccess("Your profile has been updated successfully.");
      setEditing(false);
    } catch (err) {
      setError(err.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const resetProjectForm = () => {
    setProjectForm(initialProject);
    setEditingProjectId(null);
    setShowProjectForm(false);
  };

  const resetInternshipForm = () => {
    setInternshipForm(initialInternship);
    setEditingInternshipId(null);
    setShowInternshipForm(false);
  };

  const handleProjectSubmit = async (event) => {
    event.preventDefault();

    setRecordError("");
    setSuccess("");

    const payload = {
      ...projectForm,
      technologies: parseList(projectForm.technologies),
      start_date: projectForm.start_date || null,
      end_date: projectForm.end_date || null,
      github_url: projectForm.github_url.trim() || null,
      live_url: projectForm.live_url.trim() || null,
      description: projectForm.description.trim() || null,
    };

    setSaving(true);

    try {
      if (editingProjectId) {
        await apiPatch(
          `/profile/projects/${editingProjectId}`,
          payload
        );
        setSuccess("Project updated successfully.");
      } else {
        await apiPost("/profile/projects", payload);
        setSuccess("Project added successfully.");
      }

      resetProjectForm();
      await loadProjects();
    } catch (err) {
      setRecordError(err.message || "Unable to save project.");
    } finally {
      setSaving(false);
    }
  };

  const handleInternshipSubmit = async (event) => {
    event.preventDefault();

    setRecordError("");
    setSuccess("");

    const payload = {
      ...internshipForm,
      skills_used: parseList(internshipForm.skills_used),
      start_date: internshipForm.start_date || null,
      end_date: internshipForm.end_date || null,
      description: internshipForm.description.trim() || null,
    };

    setSaving(true);

    try {
      if (editingInternshipId) {
        await apiPatch(
          `/profile/internships/${editingInternshipId}`,
          payload
        );
        setSuccess("Internship updated successfully.");
      } else {
        await apiPost("/profile/internships", payload);
        setSuccess("Internship added successfully.");
      }

      resetInternshipForm();
      await loadInternships();
    } catch (err) {
      setRecordError(err.message || "Unable to save internship.");
    } finally {
      setSaving(false);
    }
  };

  const startProjectEdit = (project) => {
    setProjectForm({
      title: project.title || "",
      description: project.description || "",
      technologies: (project.technologies || []).join(", "),
      github_url: project.github_url || "",
      live_url: project.live_url || "",
      start_date: project.start_date || "",
      end_date: project.end_date || "",
      status: project.status || "completed",
    });

    setEditingProjectId(project.id);
    setShowProjectForm(true);
    setRecordError("");
  };

  const startInternshipEdit = (internship) => {
    setInternshipForm({
      company_name: internship.company_name || "",
      role: internship.role || "",
      description: internship.description || "",
      skills_used: (internship.skills_used || []).join(", "),
      start_date: internship.start_date || "",
      end_date: internship.end_date || "",
      status: internship.status || "completed",
    });

    setEditingInternshipId(internship.id);
    setShowInternshipForm(true);
    setRecordError("");
  };

  const handleProjectDelete = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?")) {
      return;
    }

    setRecordError("");
    setSuccess("");

    try {
      await apiDelete(`/profile/projects/${projectId}`);
      setSuccess("Project deleted successfully.");
      await loadProjects();
    } catch (err) {
      setRecordError(err.message || "Unable to delete project.");
    }
  };

  const handleInternshipDelete = async (internshipId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this internship?"
      )
    ) {
      return;
    }

    setRecordError("");
    setSuccess("");

    try {
      await apiDelete(`/profile/internships/${internshipId}`);
      setSuccess("Internship deleted successfully.");
      await loadInternships();
    } catch (err) {
      setRecordError(err.message || "Unable to delete internship.");
    }
  };

  if (loading) {
    return (
      <main className="profile-page">
        <div className="profile-state">Loading your profile...</div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="profile-page">
        <div className="profile-state profile-error">
          <h2>Unable to load profile</h2>
          <p>{error || "Student profile not found."}</p>
          <button onClick={loadProfile} className="profile-primary-btn">
            Try again
          </button>
        </div>
      </main>
    );
  }

  const skills = profile.skills || [];

  const fields = [
    {
      section: "Academic Information",
      items: [
        { label: "Roll Number", name: "roll_number", type: "text" },
        { label: "Branch", name: "branch", type: "text" },
        {
          label: "Graduation Year",
          name: "graduation_year",
          type: "number",
        },
        {
          label: "Current CGPA",
          name: "cgpa",
          type: "number",
          min: 0,
          max: 10,
          step: 0.01,
        },
        {
          label: "10th Percentage",
          name: "tenth_percentage",
          type: "number",
          min: 0,
          max: 100,
          step: 0.01,
        },
        {
          label: "12th Percentage",
          name: "twelfth_percentage",
          type: "number",
          min: 0,
          max: 100,
          step: 0.01,
        },
      ],
    },
    {
      section: "Contact Information",
      items: [
        { label: "Phone Number", name: "phone", type: "tel" },
        { label: "Location", name: "location", type: "text" },
      ],
    },
    {
      section: "Professional Links",
      items: [
        { label: "LinkedIn URL", name: "linkedin_url", type: "url" },
        { label: "GitHub URL", name: "github_url", type: "url" },
        { label: "Portfolio URL", name: "portfolio_url", type: "url" },
      ],
    },
  ];

  return (
    <main className="profile-page">
      <header className="profile-header">
        <div>
          <span className="profile-eyebrow">STUDENT PROFILE</span>
          <h1>My Profile</h1>
          <p>Manage your academic and professional information.</p>
        </div>

        <Link to="/student/dashboard" className="profile-back-link">
          ← Dashboard
        </Link>
      </header>

      {error && (
        <div className="profile-alert profile-alert-error" role="alert">
          {error}
        </div>
      )}

      {recordError && (
        <div className="profile-alert profile-alert-error" role="alert">
          {recordError}
        </div>
      )}

      {success && (
        <div className="profile-alert profile-alert-success" role="status">
          {success}
        </div>
      )}

      <section className="profile-overview">
        <div className="profile-avatar">
          {profile.name?.charAt(0)?.toUpperCase() || "S"}
        </div>

        <div className="profile-identity">
          <h2>{profile.name}</h2>
          <p>{profile.email}</p>
          <span>{profile.branch || "Branch not added"}</span>
        </div>

        {!editing && (
          <button
            className="profile-primary-btn"
            onClick={() => {
              setSuccess("");
              setEditing(true);
            }}
          >
            Edit Profile
          </button>
        )}
      </section>

      <form onSubmit={handleSave}>
        {fields.map((section) => (
          <section className="profile-section" key={section.section}>
            <h2>{section.section}</h2>

            <div className="profile-fields-grid">
              {section.items.map((field) => (
                <div className="profile-field" key={field.name}>
                  <label htmlFor={field.name}>{field.label}</label>

                  {editing ? (
                    <input
                      id={field.name}
                      name={field.name}
                      type={field.type}
                      value={formData[field.name]}
                      onChange={handleChange}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  ) : (
                    <p className="profile-field-value">
                      {profile[field.name] ?? "Not provided"}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        {editing && (
          <div className="profile-form-actions">
            <button
              type="button"
              className="profile-cancel-btn"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="profile-primary-btn"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </form>

      {/* EXTRACTED SKILLS */}

      <section className="profile-section">
        <div className="skills-heading">
          <div>
            <h2>My Extracted Skills</h2>
            <p>Skills identified from your uploaded resume.</p>
          </div>

          <span className="skills-count">{skills.length} skills</span>
        </div>

        {skills.length > 0 ? (
          <div className="profile-skills-list">
            {skills.map((skill, index) => (
              <span className="profile-skill" key={`${skill}-${index}`}>
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="profile-empty">
            No skills found. Upload your resume to extract skills.
          </p>
        )}
      </section>

      {/* PROJECTS SECTION */}

      <section className="profile-section">
        <div className="profile-record-heading">
          <div>
            <h2>My Projects</h2>
            <p>Showcase your academic and personal projects.</p>
          </div>

          <button
            type="button"
            className="profile-primary-btn"
            onClick={() => {
              resetProjectForm();
              setShowProjectForm(true);
              setRecordError("");
            }}
          >
            + Add Project
          </button>
        </div>

        {showProjectForm && (
          <form
            className="profile-record-form"
            onSubmit={handleProjectSubmit}
          >
            <h3>
              {editingProjectId ? "Edit Project" : "Add New Project"}
            </h3>

            <div className="profile-fields-grid">
              <div className="profile-field">
                <label>Project Title *</label>
                <input
                  required
                  value={projectForm.title}
                  onChange={(e) =>
                    setProjectForm({
                      ...projectForm,
                      title: e.target.value,
                    })
                  }
                  placeholder="Enter project title"
                />
              </div>

              <div className="profile-field">
                <label>Technologies</label>
                <input
                  value={projectForm.technologies}
                  onChange={(e) =>
                    setProjectForm({
                      ...projectForm,
                      technologies: e.target.value,
                    })
                  }
                  placeholder="Python, SQL, Streamlit"
                />
              </div>

              <div className="profile-field">
                <label>GitHub URL</label>
                <input
                  type="url"
                  value={projectForm.github_url}
                  onChange={(e) =>
                    setProjectForm({
                      ...projectForm,
                      github_url: e.target.value,
                    })
                  }
                  placeholder="https://github.com/..."
                />
              </div>

              <div className="profile-field">
                <label>Live Demo URL</label>
                <input
                  type="url"
                  value={projectForm.live_url}
                  onChange={(e) =>
                    setProjectForm({
                      ...projectForm,
                      live_url: e.target.value,
                    })
                  }
                  placeholder="https://..."
                />
              </div>

              <div className="profile-field">
                <label>Start Date</label>
                <input
                  type="date"
                  value={projectForm.start_date}
                  onChange={(e) =>
                    setProjectForm({
                      ...projectForm,
                      start_date: e.target.value,
                    })
                  }
                />
              </div>

              <div className="profile-field">
                <label>End Date</label>
                <input
                  type="date"
                  value={projectForm.end_date}
                  onChange={(e) =>
                    setProjectForm({
                      ...projectForm,
                      end_date: e.target.value,
                    })
                  }
                />
              </div>

              <div className="profile-field">
                <label>Status</label>
                <select
                  value={projectForm.status}
                  onChange={(e) =>
                    setProjectForm({
                      ...projectForm,
                      status: e.target.value,
                    })
                  }
                >
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="profile-field profile-full-field">
              <label>Description</label>
              <textarea
                rows="4"
                value={projectForm.description}
                onChange={(e) =>
                  setProjectForm({
                    ...projectForm,
                    description: e.target.value,
                  })
                }
                placeholder="Describe your project..."
              />
            </div>

            <div className="profile-form-actions">
              <button
                type="button"
                className="profile-cancel-btn"
                onClick={resetProjectForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="profile-primary-btn"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingProjectId
                    ? "Update Project"
                    : "Save Project"}
              </button>
            </div>
          </form>
        )}

        {projects.length > 0 ? (
          <div className="profile-record-list">
            {projects.map((project) => (
              <article className="profile-record-card" key={project.id}>
                <div className="profile-record-top">
                  <div>
                    <h3>{project.title}</h3>
                    <span className="profile-status">
                      {project.status}
                    </span>
                  </div>

                  <div className="profile-record-actions">
                    <button
                      type="button"
                      className="profile-edit-btn"
                      onClick={() => startProjectEdit(project)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="profile-delete-btn"
                      onClick={() => handleProjectDelete(project.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {project.description && (
                  <p className="profile-record-description">
                    {project.description}
                  </p>
                )}

                {project.technologies?.length > 0 && (
                  <div className="profile-skills-list">
                    {project.technologies.map((technology, index) => (
                      <span
                        className="profile-skill"
                        key={`${technology}-${index}`}
                      >
                        {technology}
                      </span>
                    ))}
                  </div>
                )}

                <p className="profile-record-date">
                  {formatDate(project.start_date)} –{" "}
                  {formatDate(project.end_date)}
                </p>

                <div className="profile-record-links">
                  {project.github_url && (
                    <a
                      href={project.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      GitHub Repository ↗
                    </a>
                  )}

                  {project.live_url && (
                    <a
                      href={project.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Live Demo ↗
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          !showProjectForm && (
            <p className="profile-empty">
              No projects added yet. Click Add Project to showcase your work.
            </p>
          )
        )}
      </section>

      {/* INTERNSHIP SECTION */}

      <section className="profile-section">
        <div className="profile-record-heading">
          <div>
            <h2>Internship Experience</h2>
            <p>Showcase your professional training and internship experience.</p>
          </div>

          <button
            type="button"
            className="profile-primary-btn"
            onClick={() => {
              resetInternshipForm();
              setShowInternshipForm(true);
              setRecordError("");
            }}
          >
            + Add Internship
          </button>
        </div>

        {showInternshipForm && (
          <form
            className="profile-record-form"
            onSubmit={handleInternshipSubmit}
          >
            <h3>
              {editingInternshipId
                ? "Edit Internship"
                : "Add Internship Experience"}
            </h3>

            <div className="profile-fields-grid">
              <div className="profile-field">
                <label>Company Name *</label>
                <input
                  required
                  value={internshipForm.company_name}
                  onChange={(e) =>
                    setInternshipForm({
                      ...internshipForm,
                      company_name: e.target.value,
                    })
                  }
                  placeholder="Enter company name"
                />
              </div>

              <div className="profile-field">
                <label>Job Role *</label>
                <input
                  required
                  value={internshipForm.role}
                  onChange={(e) =>
                    setInternshipForm({
                      ...internshipForm,
                      role: e.target.value,
                    })
                  }
                  placeholder="Enter your role"
                />
              </div>

              <div className="profile-field">
                <label>Start Date</label>
                <input
                  type="date"
                  value={internshipForm.start_date}
                  onChange={(e) =>
                    setInternshipForm({
                      ...internshipForm,
                      start_date: e.target.value,
                    })
                  }
                />
              </div>

              <div className="profile-field">
                <label>End Date</label>
                <input
                  type="date"
                  value={internshipForm.end_date}
                  onChange={(e) =>
                    setInternshipForm({
                      ...internshipForm,
                      end_date: e.target.value,
                    })
                  }
                />
              </div>

              <div className="profile-field">
                <label>Skills Used</label>
                <input
                  value={internshipForm.skills_used}
                  onChange={(e) =>
                    setInternshipForm({
                      ...internshipForm,
                      skills_used: e.target.value,
                    })
                  }
                  placeholder="Python, Machine Learning, SQL"
                />
              </div>

              <div className="profile-field">
                <label>Status</label>
                <select
                  value={internshipForm.status}
                  onChange={(e) =>
                    setInternshipForm({
                      ...internshipForm,
                      status: e.target.value,
                    })
                  }
                >
                  <option value="applied">Applied</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="profile-field profile-full-field">
              <label>Description</label>
              <textarea
                rows="4"
                value={internshipForm.description}
                onChange={(e) =>
                  setInternshipForm({
                    ...internshipForm,
                    description: e.target.value,
                  })
                }
                placeholder="Describe your internship experience..."
              />
            </div>

            <div className="profile-form-actions">
              <button
                type="button"
                className="profile-cancel-btn"
                onClick={resetInternshipForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="profile-primary-btn"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingInternshipId
                    ? "Update Internship"
                    : "Save Internship"}
              </button>
            </div>
          </form>
        )}

        {internships.length > 0 ? (
          <div className="profile-record-list">
            {internships.map((internship) => (
              <article
                className="profile-record-card"
                key={internship.id}
              >
                <div className="profile-record-top">
                  <div>
                    <h3>{internship.role}</h3>
                    <p className="profile-company-name">
                      {internship.company_name}
                    </p>
                    <span className="profile-status">
                      {internship.status}
                    </span>
                  </div>

                  <div className="profile-record-actions">
                    <button
                      type="button"
                      className="profile-edit-btn"
                      onClick={() => startInternshipEdit(internship)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="profile-delete-btn"
                      onClick={() =>
                        handleInternshipDelete(internship.id)
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {internship.description && (
                  <p className="profile-record-description">
                    {internship.description}
                  </p>
                )}

                {internship.skills_used?.length > 0 && (
                  <div className="profile-skills-list">
                    {internship.skills_used.map((skill, index) => (
                      <span
                        className="profile-skill"
                        key={`${skill}-${index}`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                <p className="profile-record-date">
                  {formatDate(internship.start_date)} –{" "}
                  {formatDate(internship.end_date)}
                </p>
              </article>
            ))}
          </div>
        ) : (
          !showInternshipForm && (
            <p className="profile-empty">
              No internship experience added yet.
            </p>
          )
        )}
      </section>
    </main>
  );
}
