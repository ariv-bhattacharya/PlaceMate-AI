
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <main style={styles.container}>
      <nav style={styles.navbar}>
        <h2 style={styles.logo}>PlaceMate AI</h2>

        <div style={styles.navLinks}>
          <Link to="/login" style={styles.login}>
            Login
          </Link>

          <Link to="/register" style={styles.button}>
            Get Started
          </Link>
        </div>
      </nav>

      <section style={styles.hero}>
        <span style={styles.tag}>
          YOUR AI-POWERED PLACEMENT ASSISTANT
        </span>

        <h1 style={styles.heading}>
          Your Career Journey,
          <br />
          <span style={styles.highlight}>Starts Here.</span>
        </h1>

        <p style={styles.description}>
          Analyze your resume, discover skill gaps, explore placement
          opportunities and prepare for your dream career with PlaceMate AI.
        </p>

        <div style={styles.actions}>
          <Link to="/register" style={styles.button}>
            Get Started
          </Link>

          <Link to="/login" style={styles.secondaryButton}>
            Sign In
          </Link>
        </div>
      </section>
    </main>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#f8f9ff",
    color: "#172033",
    fontFamily: "Arial, sans-serif",
  },
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "22px 7%",
    background: "#fff",
    borderBottom: "1px solid #eee",
  },
  logo: {
    color: "#6254d9",
    margin: 0,
    fontSize: "24px",
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
  },
  login: {
    color: "#334155",
    textDecoration: "none",
  },
  button: {
    background: "#6254d9",
    color: "#fff",
    padding: "13px 22px",
    borderRadius: "9px",
    textDecoration: "none",
    fontWeight: "bold",
  },
  hero: {
    maxWidth: "850px",
    margin: "100px auto",
    padding: "30px",
    textAlign: "center",
  },
  tag: {
    color: "#6254d9",
    fontSize: "12px",
    fontWeight: "bold",
    letterSpacing: "2px",
  },
  heading: {
    fontSize: "clamp(40px, 7vw, 68px)",
    lineHeight: 1.15,
    margin: "25px 0",
  },
  highlight: {
    color: "#6254d9",
  },
  description: {
    maxWidth: "650px",
    margin: "0 auto",
    color: "#64748b",
    fontSize: "17px",
    lineHeight: 1.8,
  },
  actions: {
    display: "flex",
    justifyContent: "center",
    gap: "15px",
    marginTop: "35px",
  },
  secondaryButton: {
    border: "1px solid #6254d9",
    color: "#6254d9",
    padding: "13px 22px",
    borderRadius: "9px",
    textDecoration: "none",
    fontWeight: "bold",
  },
};
