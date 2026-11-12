
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPatch } from "../../services/api";

export default function ManageCompanies() {
  const [recruiters, setRecruiters] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadCompanies() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiGet(
        "/admin/recruiters?page=1&per_page=100"
      );

      setRecruiters(response.recruiters || []);
    } catch (err) {
      setError(err.message || "Unable to load company records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  // Show companies associated with recruiter accounts.
  const companies = useMemo(() => {
    return recruiters
      .filter((recruiter) => recruiter.company)
      .map((recruiter) => ({
        companyId: recruiter.company.id,
        name: recruiter.company.name,
        industry: recruiter.company.industry,
        location: recruiter.company.location,
        website: recruiter.company.website,
        recruiterId: recruiter.id,
        recruiterName: recruiter.name,
        recruiterEmail: recruiter.email,
        isActive: recruiter.is_active,
        createdAt: recruiter.created_at,
      }));
  }, [recruiters]);

  // SEARCH AND STATUS FILTER
  const filteredCompanies = useMemo(() => {
    const query = search.trim().toLowerCase();

    return companies.filter((company) => {
      const matchesSearch =
        !query ||
        company.name?.toLowerCase().includes(query) ||
        company.industry?.toLowerCase().includes(query) ||
        company.location?.toLowerCase().includes(query) ||
        company.recruiterName?.toLowerCase().includes(query) ||
        company.recruiterEmail?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && company.isActive) ||
        (statusFilter === "inactive" && !company.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [companies, search, statusFilter]);

  const activeCount = companies.filter(
    (company) => company.isActive
  ).length;

  const inactiveCount = companies.length - activeCount;

  // ACTIVATE / DEACTIVATE RECRUITER ACCOUNT
  async function updateRecruiterStatus(company) {
    const nextStatus = !company.isActive;

    const confirmed = window.confirm(
      `Are you sure you want to ${
        nextStatus ? "activate" : "deactivate"
      } the recruiter account for ${company.name}?`
    );

    if (!confirmed) return;

    setUpdatingId(company.recruiterId);
    setError("");
    setSuccess("");

    try {
      const response = await apiPatch(
        `/admin/users/${company.recruiterId}/status`,
        { is_active: nextStatus }
      );

      setRecruiters((previous) =>
        previous.map((recruiter) =>
          recruiter.id === company.recruiterId
            ? {
                ...recruiter,
                is_active: response.user.is_active,
              }
            : recruiter
        )
      );

      setSuccess(
        response.message || "Recruiter account status updated."
      );
    } catch (err) {
      setError(
        err.message || "Unable to update recruiter account."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  // SHARED STYLES
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

          <h1 style={{ fontSize: "36px", margin: "8px 0" }}>
            Manage Companies
          </h1>

          <p style={{ color: "#64748b", fontSize: "16px" }}>
            Review company information and manage associated recruiter accounts.
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
            onClick={loadCompanies}
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
          style={navLinkStyle}
        >
          Manage Students
        </Link>

        <Link
          to="/admin/companies"
          style={activeNavLinkStyle}
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
            background: "#fff0ef",
            color: "#c0392b",
            padding: "14px 18px",
            marginBottom: "20px",
            borderRadius: "10px",
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
            padding: "14px 18px",
            marginBottom: "20px",
            borderRadius: "10px",
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
          <p style={{ color: "#64748b" }}>
            Companies with Recruiter Accounts
          </p>

          <h2
            style={{
              color: "#6253df",
              fontSize: "34px",
              margin: 0,
            }}
          >
            {companies.length}
          </h2>
        </div>

        <div style={cardStyle}>
          <p style={{ color: "#64748b" }}>
            Active Recruiter Accounts
          </p>

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
          <p style={{ color: "#64748b" }}>
            Inactive Recruiter Accounts
          </p>

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

      {/* COMPANY DIRECTORY */}

      <section style={cardStyle}>
        <h2 style={{ margin: "0 0 8px" }}>
          Company Directory
        </h2>

        <p style={{ color: "#64748b", marginBottom: "22px" }}>
          Companies linked to registered recruiter accounts.
        </p>

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
            placeholder="Search company, recruiter, industry or location..."
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
          Showing {filteredCompanies.length} of {companies.length} companies
        </p>

        {/* DIRECTORY CONTENT */}

        {loading ? (
          <p style={{ color: "#64748b" }}>
            Loading companies...
          </p>
        ) : filteredCompanies.length === 0 ? (
          <div
            style={{
              padding: "35px 15px",
              textAlign: "center",
              color: "#64748b",
              background: "#f8f9fd",
              borderRadius: "12px",
            }}
          >
            No company records found matching your search.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                minWidth: "850px",
                borderCollapse: "collapse",
                textAlign: "left",
              }}
            >
              <thead>
                <tr style={{ background: "#f6f7fc" }}>
                  {[
                    "Company",
                    "Industry",
                    "Location",
                    "Website",
                    "Recruiter",
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
                {filteredCompanies.map((company) => (
                  <tr
                    key={company.companyId}
                    style={{
                      borderBottom: "1px solid #edf0f6",
                    }}
                  >
                    <td style={{ padding: "17px 12px" }}>
                      <strong>{company.name}</strong>

                      <div
                        style={{
                          color: "#64748b",
                          fontSize: "12px",
                        }}
                      >
                        Company ID: {company.companyId}
                      </div>
                    </td>

                    <td style={{ padding: "17px 12px" }}>
                      {company.industry || "Not provided"}
                    </td>

                    <td style={{ padding: "17px 12px" }}>
                      {company.location || "Not provided"}
                    </td>

                    <td style={{ padding: "17px 12px" }}>
                      {company.website ? (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: "#6253df",
                            textDecoration: "none",
                          }}
                        >
                          Visit website
                        </a>
                      ) : (
                        "Not provided"
                      )}
                    </td>

                    <td style={{ padding: "17px 12px" }}>
                      <strong>{company.recruiterName}</strong>

                      <div
                        style={{
                          color: "#64748b",
                          fontSize: "12px",
                          marginTop: "5px",
                        }}
                      >
                        {company.recruiterEmail}
                      </div>
                    </td>

                    <td style={{ padding: "17px 12px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "7px 11px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "700",
                          background: company.isActive
                            ? "#e8f8ef"
                            : "#fff0ef",
                          color: company.isActive
                            ? "#087b48"
                            : "#c0392b",
                        }}
                      >
                        {company.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td style={{ padding: "17px 12px" }}>
                      <button
                        onClick={() => updateRecruiterStatus(company)}
                        disabled={updatingId === company.recruiterId}
                        style={{
                          padding: "9px 12px",
                          border: "none",
                          borderRadius: "8px",
                          fontWeight: "700",
                          cursor:
                            updatingId === company.recruiterId
                              ? "wait"
                              : "pointer",
                          background: company.isActive
                            ? "#fff0ef"
                            : "#e8f8ef",
                          color: company.isActive
                            ? "#c0392b"
                            : "#087b48",
                          opacity:
                            updatingId === company.recruiterId ? 0.6 : 1,
                        }}
                      >
                        {updatingId === company.recruiterId
                          ? "Updating..."
                          : company.isActive
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
