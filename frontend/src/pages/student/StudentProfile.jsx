
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPatch } from "../../services/api";
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

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

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
          setError(`Please enter a valid ${field.replaceAll("_", " ")}.`);
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
    </main>
  );
}
