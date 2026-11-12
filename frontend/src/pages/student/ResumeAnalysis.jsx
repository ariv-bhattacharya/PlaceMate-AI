
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { apiGet } from "../../services/api";
import {
  uploadResume,
  validateResumeFile,
} from "../../services/resumeService";

import "./ResumeAnalysis.css";


export default function ResumeAnalysis() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [profileSkills, setProfileSkills] = useState([]);
  const [uploadResult, setUploadResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load student skills and the latest saved resume.
  useEffect(() => {
    const loadResumeData = async () => {
      setFetchingProfile(true);

      try {
        // Load existing student profile.
        const profileResponse = await apiGet("/students/me");

        setProfileSkills(
          profileResponse.profile?.skills || []
        );
      } catch (err) {
        console.error("Unable to load student profile:", err);
      }

      try {
        // Load the latest saved resume from PostgreSQL.
        const resumeResponse = await apiGet("/resumes/latest");

        setUploadResult(resumeResponse.resume || null);

        if (resumeResponse.resume?.extracted_skills) {
          setProfileSkills(
            resumeResponse.resume.extracted_skills
          );
        }
      } catch (err) {
        // A 404 simply means the student has not uploaded a resume.
        if (err.status !== 404) {
          console.error("Unable to load latest resume:", err);
          setError(err.message || "Unable to retrieve saved resume.");
        }
      } finally {
        setFetchingProfile(false);
      }
    };

    loadResumeData();
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    setError("");
    setSuccess("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    try {
      validateResumeFile(file);
      setSelectedFile(file);
    } catch (err) {
      setSelectedFile(null);
      setError(err.message);
      event.target.value = "";
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!selectedFile) {
      setError("Please select your resume first.");
      return;
    }

    try {
      validateResumeFile(selectedFile);
    } catch (err) {
      setError(err.message);
      return;
    }

    setLoading(true);

    try {
      const response = await uploadResume(selectedFile);
      const resume = response.resume;

      if (!resume) {
        throw new Error("Resume details were not returned by the server.");
      }

      setUploadResult(resume);
      setProfileSkills(resume.extracted_skills || []);

      setSuccess(
        response.message || "Resume uploaded and parsed successfully."
      );

      setSelectedFile(null);
      event.target.reset();

    } catch (err) {
      setError(err.message || "Resume upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const displayedSkills = uploadResult
    ? uploadResult.extracted_skills || []
    : profileSkills;

  return (
    <main className="resume-page">

      <header className="resume-header">
        <div>
          <span className="resume-eyebrow">AI RESUME ANALYSIS</span>
          <h1>Resume Management</h1>
          <p>
            Upload your resume and let PlaceMate AI identify your skills
            and help you understand your job readiness.
          </p>
        </div>

        <Link to="/student/dashboard" className="resume-back-link">
          ← Dashboard
        </Link>
      </header>

      {success && (
        <div className="resume-alert resume-alert-success" role="status">
          <strong>✓ Upload successful!</strong>
          <p>{success}</p>
        </div>
      )}

      {error && (
        <div className="resume-alert resume-alert-error" role="alert">
          <strong>Notice</strong>
          <p>{error}</p>
        </div>
      )}

      <section className="resume-upload-card">
        <div className="resume-upload-icon">
          <span>↑</span>
        </div>

        <h2>Upload your resume</h2>

        <p className="resume-upload-description">
          Upload your latest resume in PDF or TXT format.
          Our AI parser will extract your skills and resume content.
        </p>

        <form onSubmit={handleUpload}>
          <label htmlFor="resume-file" className="resume-file-label">
            <span className="resume-file-symbol">＋</span>

            <strong>
              {selectedFile ? "File selected" : "Choose your resume"}
            </strong>

            <span>PDF or TXT · Maximum 5 MB</span>

            <input
              id="resume-file"
              name="resume"
              type="file"
              accept=".pdf,.txt"
              onChange={handleFileChange}
              disabled={loading}
            />
          </label>

          {selectedFile && (
            <div className="resume-selected-file">
              <div>
                <strong>{selectedFile.name}</strong>
                <span>
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </span>
              </div>

              <button
                type="button"
                className="resume-remove-file"
                onClick={() => {
                  setSelectedFile(null);
                  setError("");
                  document.getElementById("resume-file").value = "";
                }}
                disabled={loading}
              >
                Remove
              </button>
            </div>
          )}

          <button
            type="submit"
            className="resume-upload-button"
            disabled={loading || !selectedFile}
          >
            {loading ? "Uploading and analyzing..." : "Upload & Analyze Resume"}
          </button>
        </form>

        <div className="resume-upload-note">
          🔒 Your resume is processed by the PlaceMate AI backend.
        </div>
      </section>

      {uploadResult && (
        <section className="resume-section">
          <div className="resume-section-heading">
            <div>
              <span className="resume-eyebrow">PARSING RESULTS</span>
              <h2>Resume analysis completed</h2>
            </div>

            <span className="resume-status-badge">
              Successfully parsed
            </span>
          </div>

          <div className="resume-stats-grid">
            <div className="resume-stat-card">
              <span>Resume ID</span>
              <strong>{uploadResult.resume_id}</strong>
            </div>

            <div className="resume-stat-card">
              <span>Words extracted</span>
              <strong>{uploadResult.word_count ?? 0}</strong>
            </div>

            <div className="resume-stat-card">
              <span>Skills detected</span>
              <strong>{uploadResult.total_skills ?? 0}</strong>
            </div>
          </div>

          <div className="resume-file-result">
            <div>
              <span>Uploaded file</span>
              <strong>{uploadResult.file_name}</strong>
            </div>

            <div>
              <span>File type</span>
              <strong>
                {(uploadResult.file_type || "Unknown").toUpperCase()}
              </strong>
            </div>

            {uploadResult.uploaded_at && (
              <div>
                <span>Uploaded on</span>
                <strong>
                  {new Date(uploadResult.uploaded_at).toLocaleDateString("en-IN")}
                </strong>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="resume-section">
        <div className="resume-section-heading">
          <div>
            <span className="resume-eyebrow">SKILL EXTRACTION</span>
            <h2>Extracted Skills</h2>
            <p>
              Technical and professional skills identified from your resume.
            </p>
          </div>

          <span className="resume-skills-count">
            {displayedSkills.length} skills
          </span>
        </div>

        {fetchingProfile ? (
          <p className="resume-empty-state">
            Loading your saved resume...
          </p>
        ) : displayedSkills.length > 0 ? (
          <div className="resume-skills-list">
            {displayedSkills.map((skill, index) => (
              <span
                className="resume-skill-tag"
                key={`${skill}-${index}`}
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <div className="resume-empty-state">
            <h3>No resume skills available yet</h3>
            <p>
              Upload your resume to automatically extract your skills.
            </p>
          </div>
        )}
      </section>

      <section className="resume-next-step">
        <div>
          <h3>Explore your job compatibility</h3>
          <p>
            Compare your extracted skills with placement opportunities
            and discover your resume match percentage.
          </p>
        </div>

        <Link to="/student/jobs" className="resume-jobs-link">
          View Job Matches →
        </Link>
      </section>

    </main>
  );
}
