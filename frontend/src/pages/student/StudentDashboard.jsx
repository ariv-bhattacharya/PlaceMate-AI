
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <main style={styles.page}>
      <nav style={styles.navbar}>
        <h2 style={styles.logo}>PlaceMate AI</h2>

        <div style={styles.navActions}>
          <Link to="/student/dashboard" style={styles.navLink}>
            Dashboard
          </Link>

          <Link to="/student/profile" style={styles.navLink}>
            My Profile
          </Link>

          <Link to="/student/resume" style={styles.navLink}>
            My Resume
          </Link>

          <Link to="/student/jobs" style={styles.navLink}>
            Find Jobs
          </Link>

          <Link to="/student/applications" style={styles.navLink}>
            My Applications
          </Link>

          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </nav>

      <section style={styles.content}>
        <div style={styles.welcome}>
          <span style={styles.eyebrow}>STUDENT DASHBOARD</span>

          <h1>Welcome back, {user?.name || "Student"}!</h1>

          <p>
            Your placement journey starts here. Manage your profile,
            analyze your resume and discover opportunities with AI.
          </p>
        </div>

        <div style={styles.grid}>
          {/* Explore Jobs */}
          <div style={styles.card}>
            <div style={styles.cardIcon}>⌕</div>
            <h3>Explore Jobs</h3>
            <p>
              Find placement opportunities, check academic eligibility
              and explore your resume match scores.
            </p>

            <Link to="/student/jobs" style={styles.button}>
              View Job Listings →
            </Link>
          </div>

          {/* Resume Management */}
          <div style={styles.card}>
            <div style={styles.cardIcon}>↑</div>
            <h3>Resume Management</h3>
            <p>
              Upload your resume, extract skills and analyze your
              profile using PlaceMate AI.
            </p>

            <Link to="/student/resume" style={styles.button}>
              Manage Resume →
            </Link>
          </div>

          {/* Student Profile */}
          <div style={styles.card}>
            <div style={styles.cardIcon}>♙</div>
            <h3>My Student Profile</h3>
            <p>
              Update your academic details, contact information
              and professional links.
            </p>

            <Link to="/student/profile" style={styles.button}>
              Manage Profile →
            </Link>
          </div>

          {/* Skill Gap Analysis */}
          <div style={styles.card}>
            <div style={styles.cardIcon}>✧</div>
            <h3>Career Skill Gap Analysis</h3>
            <p>
              Discover your career readiness, identify missing skills
              and receive personalized learning recommendations.
            </p>

            <Link to="/student/skill-gap" style={styles.button}>
              Analyze Career Skills →
            </Link>
          </div>

          {/* My Applications - NEW */}
          <div style={styles.card}>
            <div style={styles.cardIcon}>✓</div>
            <h3>My Applications</h3>
            <p>
              Track all your submitted job applications, check
              application statuses and monitor your AI resume match scores.
            </p>

            <Link to="/student/applications" style={styles.button}>
              Track Applications →
            </Link>
          </div>
        </div>

        <div style={styles.profileCard}>
          <h3>Your Account</h3>

          <p>
            <strong>Name:</strong> {user?.name || "Student"}
          </p>

          <p>
            <strong>Email:</strong> {user?.email || "Not available"}
          </p>

          <p>
            <strong>Role:</strong> {user?.role || "Student"}
          </p>
        </div>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f7f8fc",
    fontFamily: "Arial, sans-serif",
    color: "#172033",
  },

  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "18px",
    padding: "20px 6%",
    background: "#ffffff",
    borderBottom: "1px solid #e8eaf1",
  },

  logo: {
    margin: 0,
    color: "#6254d9",
  },

  navActions: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px",
  },

  navLink: {
    color: "#6254d9",
    textDecoration: "none",
    fontWeight: "bold",
    fontSize: "14px",
  },

  logoutButton: {
    padding: "10px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#fff0ed",
    color: "#c04432",
    fontWeight: "bold",
    cursor: "pointer",
  },

  content: {
    maxWidth: "1100px",
    margin: "45px auto",
    padding: "0 24px",
  },

  welcome: {
    marginBottom: "35px",
  },

  eyebrow: {
    color: "#6254d9",
    fontWeight: "bold",
    fontSize: "12px",
    letterSpacing: "1.5px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "20px",
  },

  card: {
    padding: "28px",
    borderRadius: "14px",
    background: "#ffffff",
    border: "1px solid #e8eaf1",
  },

  cardIcon: {
    width: "42px",
    height: "42px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "10px",
    background: "#eeecff",
    color: "#6254d9",
    fontSize: "25px",
    fontWeight: "bold",
  },

  button: {
    display: "inline-block",
    marginTop: "12px",
    padding: "12px 16px",
    background: "#6254d9",
    color: "#ffffff",
    textDecoration: "none",
    borderRadius: "8px",
    fontWeight: "bold",
  },

  profileCard: {
    marginTop: "25px",
    padding: "25px",
    background: "#ffffff",
    border: "1px solid #e8eaf1",
    borderRadius: "14px",
  },
};
