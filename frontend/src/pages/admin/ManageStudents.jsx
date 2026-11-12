
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPatch } from "../../services/api";

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadStudents = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiGet(
        "/admin/students?page=1&per_page=100"
      );
      setStudents(response.students || []);
    } catch (err) {
      setError(err.message || "Unable to load students.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const query = search.trim().toLowerCase();

      const matchesSearch =
        !query ||
        student.name?.toLowerCase().includes(query) ||
        student.email?.toLowerCase().includes(query) ||
        student.roll_number?.toLowerCase().includes(query) ||
        student.branch?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && student.is_active) ||
        (statusFilter === "inactive" && !student.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [students, search, statusFilter]);

  const activeCount = students.filter(
    (student) => student.is_active
  ).length;

  const inactiveCount = students.length - activeCount;

  const updateStudentStatus = async (student) => {
    const nextStatus = !student.is_active;

    const confirmed = window.confirm(
      `Are you sure you want to ${
        nextStatus ? "activate" : "deactivate"
      } ${student.name}'s account?`
    );

    if (!confirmed) return;

    setUpdatingId(student.user_id);
    setError("");
    setSuccess("");

    try {
      const response = await apiPatch(
        `/admin/users/${student.user_id}/status`,
        { is_active: nextStatus }
      );

      setStudents((previous) =>
        previous.map((item) =>
          item.user_id === student.user_id
            ? {
                ...item,
                is_active: response.user.is_active,
              }
            : item
        )
      );

      setSuccess(
        response.message ||
          `Student account ${
            nextStatus ? "activated" : "deactivated"
          } successfully.`
      );
    } catch (err) {
      setError(
        err.message || "Unable to update student account."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Shared page styles
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
      {/* PAGE HEADING */}

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

          <h1
            style={{
              fontSize: "36px",
              margin: "8px 0",
            }}
          >
            Manage Students
          </h1>

          <p style={{ color: "#64748b", fontSize: "16px" }}>
            View student profiles and manage their platform accounts.
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
            onClick={loadStudents}
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
        <Link
          to="/admin/dashboard"
          style={navLinkStyle}
        >
          Dashboard
        </Link>

        <Link
          to="/admin/students"
          style={activeNavLinkStyle}
        >
          Manage Students
        </Link>

        <Link
          to="/admin/companies"
          style={navLinkStyle}
        >
          Manage Companies
        </Link>

        <Link
          to="/admin/jobs"
          style={navLinkStyle}
        >
          Manage Jobs
        </Link>

        <Link
          to="/admin/applications"
          style={navLinkStyle}
        >
          Manage Applications
        </Link>
      </nav>

      {/* FEEDBACK MESSAGES */}

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
          <p style={{ color: "#64748b" }}>Total Students</p>
          <h2
            style={{
              color: "#6253df",
              fontSize: "34px",
              margin: 0,
            }}
          >
            {students.length}
          </h2>
        </div>

        <div style={cardStyle}>
          <p style={{ color: "#64748b" }}>Active Accounts</p>
          <h2
            style={{
              color: "#087b48",
              fontSize: "34px",
              margin: 0,
            }}
          >
            {activeCount}
          </h2>
        </div>

        <div style={cardStyle}>
          <p style={{ color: "#64748b" }}>Inactive Accounts</p>
          <h2
            style={{
              color: "#c0392b",
              fontSize: "34px",
              margin: 0,
            }}
          >
            {inactiveCount}
          </h2>
        </div>
      </section>

      {/* STUDENT DIRECTORY */}

      <section style={cardStyle}>
        <div style={{ marginBottom: "22px" }}>
          <h2 style={{ margin: "0 0 8px" }}>
            Student Directory
          </h2>

          <p style={{ color: "#64748b", margin: 0 }}>
            Search and review registered student accounts.
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
            placeholder="Search name, email, roll number or branch..."
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
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <p style={{ color: "#64748b", marginBottom: "18px" }}>
          Showing {filteredStudents.length} of {students.length} students
        </p>

        {/* DIRECTORY CONTENT */}

        {loading ? (
          <p style={{ color: "#64748b" }}>
            Loading students...
          </p>
        ) : filteredStudents.length === 0 ? (
          <div
            style={{
              padding: "35px 15px",
              textAlign: "center",
              color: "#64748b",
              background: "#f8f9fd",
              borderRadius: "12px",
            }}
          >
            No students found matching your search.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "850px",
                textAlign: "left",
              }}
            >
              <thead>
                <tr style={{ background: "#f6f7fc" }}>
                  {[
                    "Student",
                    "Roll Number",
                    "Branch",
                    "CGPA",
                    "Graduation",
                    "Skills",
                    "Account",
                    "Action",
                  ].map((heading) => (
                    <th
                      key={heading}
                      style={{
                        padding: "15px 12px",
                        color: "#64748b",
                        fontSize: "13px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((student) => (
                  <tr
                    key={student.user_id}
                    style={{
                      borderBottom: "1px solid #edf0f6",
                    }}
                  >
                    <td style={{ padding: "17px 12px" }}>
                      <strong>{student.name}</strong>

                      <div
                        style={{
                          color: "#64748b",
                          fontSize: "13px",
                          marginTop: "5px",
                        }}
                      >
                        {student.email}
                      </div>
                    </td>

                    <td style={{ padding: "17px 12px" }}>
                      {student.roll_number || "Not provided"}
                    </td>

                    <td style={{ padding: "17px 12px" }}>
                      {student.branch || "Not provided"}
                    </td>

                    <td style={{ padding: "17px 12px" }}>
                      {student.cgpa ?? "Not provided"}
                    </td>

                    <td style={{ padding: "17px 12px" }}>
                      {student.graduation_year || "Not provided"}
                    </td>

                    <td style={{ padding: "17px 12px" }}>
                      {student.skills_count ?? 0}
                    </td>

                    <td style={{ padding: "17px 12px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "7px 11px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "700",
                          background: student.is_active
                            ? "#e8f8ef"
                            : "#fff0ef",
                          color: student.is_active
                            ? "#087b48"
                            : "#c0392b",
                        }}
                      >
                        {student.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td style={{ padding: "17px 12px" }}>
                      <button
                        onClick={() => updateStudentStatus(student)}
                        disabled={updatingId === student.user_id}
                        style={{
                          padding: "9px 12px",
                          border: "none",
                          borderRadius: "8px",
                          fontWeight: "700",
                          cursor:
                            updatingId === student.user_id
                              ? "wait"
                              : "pointer",
                          background: student.is_active
                            ? "#fff0ef"
                            : "#e8f8ef",
                          color: student.is_active
                            ? "#c0392b"
                            : "#087b48",
                          opacity:
                            updatingId === student.user_id ? 0.6 : 1,
                        }}
                      >
                        {updatingId === student.user_id
                          ? "Updating..."
                          : student.is_active
                            ? "Deactivate"
                            : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
