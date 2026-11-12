
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { getStoredUser } from "../services/authService";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const loginResult = await login(formData);

      // Read the authenticated user from the login result
      // or from the user saved by AuthContext.
      const authenticatedUser =
        loginResult?.user ||
        loginResult ||
        getStoredUser();

      if (authenticatedUser?.role === "recruiter") {
        navigate("/recruiter/dashboard", { replace: true });
      } else if (authenticatedUser?.role === "student") {
        navigate("/student/dashboard", { replace: true });
      } else {
        setError("Unable to determine your account role. Please try again.");
      }

    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.page}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <Link to="/" style={styles.logo}>
          PlaceMate AI
        </Link>

        <h1 style={styles.heading}>Welcome back!</h1>

        <p style={styles.subtitle}>
          Sign in to continue your placement journey.
        </p>

        {error && (
          <div style={styles.error} role="alert">
            {error}
          </div>
        )}

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

        <label style={styles.label} htmlFor="password">
          Password
        </label>

        <input
          id="password"
          name="password"
          type="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          style={styles.input}
          autoComplete="current-password"
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
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p style={styles.footer}>
          Don't have an account?{" "}
          <Link to="/register" style={styles.link}>
            Create account
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
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: "420px",
    padding: "38px",
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 8px 35px rgba(0,0,0,0.07)",
  },

  logo: {
    color: "#6254d9",
    fontWeight: "bold",
    fontSize: "22px",
    textDecoration: "none",
  },

  heading: {
    margin: "30px 0 8px",
    color: "#172033",
  },

  subtitle: {
    color: "#64748b",
    lineHeight: 1.6,
    marginBottom: "25px",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    marginTop: "18px",
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
  },

  button: {
    width: "100%",
    marginTop: "25px",
    padding: "14px",
    border: "none",
    borderRadius: "8px",
    background: "#6254d9",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "15px",
    cursor: "pointer",
  },

  error: {
    padding: "12px",
    borderRadius: "8px",
    background: "#fff0ed",
    color: "#b42318",
    fontSize: "13px",
  },

  footer: {
    textAlign: "center",
    marginTop: "25px",
    color: "#64748b",
    fontSize: "13px",
  },

  link: {
    color: "#6254d9",
    fontWeight: "bold",
    textDecoration: "none",
  },
};
