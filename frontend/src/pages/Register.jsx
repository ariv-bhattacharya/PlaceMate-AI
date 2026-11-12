
import { useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function Register() {
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
    company_name: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (name === "role") {
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (formData.role === "recruiter" && !formData.company_name.trim()) {
      setError("Company name is required for recruiter registration.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (formData.password.length > 128) {
      setError("Password cannot exceed 128 characters.");
      return;
    }

    if (formData.company_name.trim().length > 150) {
      setError("Company name must be 150 characters or fewer.");
      return;
    }

    setLoading(true);

    try {
      const registrationData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
      };

      if (formData.role === "recruiter") {
        registrationData.company_name = formData.company_name.trim();
      }

      await register(registrationData);

      setSuccess(true);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <div style={styles.successIcon}>✓</div>

          <h1 style={styles.heading}>Account created!</h1>

          <p style={styles.subtitle}>
            Your PlaceMate AI account has been registered successfully.
            You can now sign in and continue.
          </p>

          <Link to="/login" style={styles.button}>
            Continue to Login
          </Link>

          <p style={styles.footer}>
            Registered as {formData.email}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <Link to="/" style={styles.logo}>
          PlaceMate AI
        </Link>

        <h1 style={styles.heading}>Create your account</h1>

        <p style={styles.subtitle}>
          Start your placement preparation journey with AI.
        </p>

        {error && (
          <div style={styles.error} role="alert">
            {error}
          </div>
        )}

        <label style={styles.label} htmlFor="name">
          Full name
        </label>

        <input
          id="name"
          name="name"
          type="text"
          placeholder="Enter your full name"
          value={formData.name}
          onChange={handleChange}
          maxLength={120}
          style={styles.input}
          autoComplete="name"
          required
        />

        <label style={styles.label} htmlFor="email">
          Email address
        </label>

        <input
          id="email"
          name="email"
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleChange}
          style={styles.input}
          autoComplete="email"
          required
        />

        <label style={styles.label} htmlFor="role">
          Account type
        </label>

        <select
          id="role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          style={styles.input}
          required
        >
          <option value="student">Student</option>
          <option value="recruiter">Recruiter</option>
        </select>

        {formData.role === "recruiter" && (
          <>
            <label style={styles.label} htmlFor="company_name">
              Company name
            </label>

            <input
              id="company_name"
              name="company_name"
              type="text"
              placeholder="Enter your company name"
              value={formData.company_name}
              onChange={handleChange}
              maxLength={150}
              style={styles.input}
              autoComplete="organization"
              required
            />

            <p style={styles.helperText}>
              Your recruiter account will be associated with this company.
            </p>
          </>
        )}

        <label style={styles.label} htmlFor="password">
          Password
        </label>

        <input
          id="password"
          name="password"
          type="password"
          placeholder="Create a password (minimum 8 characters)"
          value={formData.password}
          onChange={handleChange}
          minLength={8}
          maxLength={128}
          style={styles.input}
          autoComplete="new-password"
          required
        />

        <label style={styles.label} htmlFor="confirmPassword">
          Confirm password
        </label>

        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Enter your password again"
          value={formData.confirmPassword}
          onChange={handleChange}
          maxLength={128}
          style={styles.input}
          autoComplete="new-password"
          required
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            ...styles.button,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <p style={styles.footer}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f5f6fc",
    padding: "24px 16px",
    fontFamily: "Arial, sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: "440px",
    padding: "35px",
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 8px 35px rgba(0,0,0,0.07)",
    boxSizing: "border-box",
  },

  logo: {
    color: "#6254d9",
    fontWeight: "bold",
    fontSize: "22px",
    textDecoration: "none",
  },

  heading: {
    margin: "28px 0 8px",
    color: "#172033",
    fontSize: "26px",
  },

  subtitle: {
    color: "#64748b",
    lineHeight: 1.6,
    marginBottom: "22px",
    fontSize: "14px",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    marginTop: "16px",
    fontWeight: "bold",
    fontSize: "13px",
    color: "#334155",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px",
    border: "1px solid #dce0eb",
    borderRadius: "8px",
    fontSize: "14px",
    background: "#fff",
  },

  helperText: {
    margin: "7px 0 0",
    color: "#64748b",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  button: {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    marginTop: "25px",
    padding: "14px",
    border: "none",
    borderRadius: "8px",
    background: "#6254d9",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "15px",
    cursor: "pointer",
    textAlign: "center",
    textDecoration: "none",
  },

  error: {
    padding: "12px",
    borderRadius: "8px",
    background: "#fff0ed",
    color: "#b42318",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  footer: {
    textAlign: "center",
    marginTop: "24px",
    color: "#64748b",
    fontSize: "13px",
  },

  link: {
    color: "#6254d9",
    fontWeight: "bold",
    textDecoration: "none",
  },

  successIcon: {
    width: "55px",
    height: "55px",
    margin: "10px auto 20px",
    borderRadius: "50%",
    background: "#e8f8ef",
    color: "#187747",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
  },
};
