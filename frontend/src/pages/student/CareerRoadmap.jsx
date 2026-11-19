
import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost, apiPatch } from "../../services/api";

// ==================================================
// CONSTANTS
// ==================================================

const CAREER_ROLES = [
  "Data Analyst",
  "Business Analyst",
  "Software Developer",
  "Cybersecurity Analyst",
  "Product Analyst",
  "AI/ML Engineer"
];

const STATUS_OPTIONS = [
  "pending",
  "in_progress",
  "completed",
  "skipped",
];

const DURATION_OPTIONS = [30, 60, 90, 120, 180];

// ==================================================
// STYLES
// ==================================================

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f6f7fc",
    padding: "32px 20px",
    color: "#172033",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    width: "100%",
  },
  heading: {
    fontSize: "30px",
    fontWeight: 800,
    margin: "0 0 8px",
  },
  subtitle: {
    color: "#64748b",
    marginBottom: "28px",
    lineHeight: 1.6,
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e4e7f0",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "22px",
    boxShadow: "0 3px 12px rgba(30, 41, 59, 0.04)",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: 750,
    margin: "0 0 18px",
  },
  label: {
    display: "block",
    fontWeight: 650,
    marginBottom: "8px",
    fontSize: "14px",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    border: "1px solid #d9deeb",
    borderRadius: "9px",
    background: "#fff",
    fontSize: "15px",
    color: "#172033",
  },
  button: {
    border: "none",
    borderRadius: "9px",
    padding: "12px 18px",
    background: "#6254df",
    color: "#fff",
    fontWeight: 700,
    fontSize: "14px",
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid #6254df",
    borderRadius: "9px",
    padding: "10px 15px",
    background: "#fff",
    color: "#6254df",
    fontWeight: 700,
    cursor: "pointer",
  },
  muted: {
    color: "#64748b",
    fontSize: "14px",
  },
};

// ==================================================
// HELPER FUNCTIONS
// ==================================================

function formatStatus(status) {
  return (status || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getResourceTypeLabel(type) {
  const labels = {
    documentation: "Documentation",
    video: "Video",
    practice: "Practice",
    course: "Course",
    article: "Article",
    project: "Project",
    other: "Resource",
  };

  return labels[type] || "Resource";
}

function getSafeLearningResources(resources) {
  if (!Array.isArray(resources)) return [];

  return resources.filter((resource) => {
    if (
      !resource ||
      typeof resource.title !== "string" ||
      !resource.title.trim() ||
      typeof resource.url !== "string"
    ) {
      return false;
    }

    try {
      const parsedUrl = new URL(resource.url);
      return parsedUrl.protocol === "https:";
    } catch {
      return false;
    }
  });
}

function getStatusColor(status) {
  switch (status) {
    case "completed":
      return "#15803d";
    case "in_progress":
      return "#2563eb";
    case "skipped":
      return "#64748b";
    case "active":
      return "#15803d";
    case "draft":
      return "#a16207";
    default:
      return "#a16207";
  }
}

function getProgressPercentage(progress) {
  const value = Number(progress?.completion_percentage);

  return Number.isFinite(value)
    ? Math.min(100, Math.max(0, value))
    : 0;
}

function calculateTaskStatistics(tasks = []) {
  const total = tasks.length;

  const completed = tasks.filter(
    (task) => task.status === "completed"
  ).length;

  const inProgress = tasks.filter(
    (task) => task.status === "in_progress"
  ).length;

  const pending = tasks.filter(
    (task) => task.status === "pending"
  ).length;

  const skipped = tasks.filter(
    (task) => task.status === "skipped"
  ).length;

  const percentage = total > 0
    ? Number(((completed / total) * 100).toFixed(2))
    : 0;

  return {
    total,
    completed,
    inProgress,
    pending,
    skipped,
    percentage,
  };
}

// ==================================================
// MAIN COMPONENT
// ==================================================

export default function CareerRoadmap() {
  const [roadmaps, setRoadmaps] = useState([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState(null);
  const [progress, setProgress] = useState(null);

  const [targetRole, setTargetRole] = useState("Data Analyst");
  const [durationDays, setDurationDays] = useState(30);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activating, setActivating] = useState(false);
  const [updatingTask, setUpdatingTask] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==================================================
  // LOAD ROADMAP DETAILS
  // ==================================================

  const loadRoadmapDetails = async (roadmapId) => {
    const response = await apiGet(`/roadmaps/${roadmapId}`);

    const roadmap = response.roadmap;

    if (!roadmap) {
      throw new Error("Roadmap details were not returned.");
    }

    setSelectedRoadmap(roadmap);

    try {
      const progressResponse = await apiGet(
        `/roadmaps/${roadmapId}/progress`
      );

      setProgress(progressResponse);
    } catch (progressError) {
      console.error("Progress loading error:", progressError);
      setProgress(null);
    }

    return roadmap;
  };

  // ==================================================
  // LOAD ALL ROADMAPS
  // ==================================================

  const loadRoadmaps = useCallback(async (preferredId = null) => {
    try {
      setError("");

      const response = await apiGet("/roadmaps");
      const items = response.roadmaps || [];

      setRoadmaps(items);

      if (items.length === 0) {
        setSelectedRoadmap(null);
        setProgress(null);
        return;
      }

      const preferred = preferredId
        ? items.find((item) => item.id === preferredId)
        : null;

      const current =
        preferred ||
        items.find((item) => item.status === "active") ||
        items[0];

      await loadRoadmapDetails(current.id);

    } catch (err) {
      setError(err.message || "Unable to load your roadmaps.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {
    loadRoadmaps();
  }, [loadRoadmaps]);

  // ==================================================
  // GENERATE NEW ROADMAP
  // ==================================================

  const handleGenerate = async (event) => {
    event.preventDefault();

    if (generating) return;

    setGenerating(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiPost("/roadmaps/generate", {
        target_role: targetRole,
        duration_days: Number(durationDays),
      });

      const newRoadmapId = response.roadmap?.id;

      setSuccess(
        response.message ||
        "Career roadmap generated successfully."
      );

      await loadRoadmaps(newRoadmapId || null);

    } catch (err) {
      setError(
        err.message || "Unable to generate your roadmap."
      );
    } finally {
      setGenerating(false);
    }
  };

  // ==================================================
  // ACTIVATE ROADMAP
  // ==================================================

  const handleActivate = async () => {
    if (!selectedRoadmap || activating) return;

    setActivating(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiPatch(
        `/roadmaps/${selectedRoadmap.id}/activate`,
        {}
      );

      setSuccess(
        response.message ||
        "Career roadmap activated successfully."
      );

      await loadRoadmaps(selectedRoadmap.id);

    } catch (err) {
      setError(
        err.message || "Unable to activate this roadmap."
      );
    } finally {
      setActivating(false);
    }
  };

  // ==================================================
  // UPDATE TASK STATUS
  // ==================================================

  const handleTaskStatus = async (task, newStatus) => {
    if (
      !selectedRoadmap ||
      updatingTask !== null ||
      !STATUS_OPTIONS.includes(newStatus)
    ) {
      return;
    }

    if (task.status === newStatus) return;

    const roadmapId = selectedRoadmap.id;

    setUpdatingTask(task.id);
    setError("");
    setSuccess("");

    try {
      const response = await apiPatch(
        `/roadmaps/tasks/${task.id}`,
        { status: newStatus }
      );

      setSuccess(
        response.message ||
        "Task status updated successfully."
      );

      await loadRoadmapDetails(roadmapId);
      await loadRoadmaps(roadmapId);

    } catch (err) {
      setError(
        err.message || "Unable to update task."
      );
    } finally {
      setUpdatingTask(null);
    }
  };

  // ==================================================
  // SELECT ROADMAP
  // ==================================================

  const handleSelectRoadmap = async (roadmapId) => {
    setError("");
    setSuccess("");
    setProgress(null);

    try {
      await loadRoadmapDetails(roadmapId);
    } catch (err) {
      setError(
        err.message || "Unable to load roadmap details."
      );
    }
  };

  // ==================================================
  // PROGRESS DATA
  // ==================================================

  const tasks = selectedRoadmap?.tasks || [];

  // Calculate counts from actual task statuses.
  // This prevents skipped and in-progress tasks
  // from being incorrectly counted as pending.

  const statistics = calculateTaskStatistics(tasks);

  const completedTasks = statistics.completed;
  const inProgressTasks = statistics.inProgress;
  const pendingTasks = statistics.pending;
  const skippedTasks = statistics.skipped;
  const totalTasks = statistics.total;

  // Use task data as the source of truth for completion.
  const completionPercentage = statistics.percentage;

  const weeklyProgress = progress?.weekly_progress || [];
  const recentActivity = progress?.recent_activity || [];

  // Group tasks by week.
  const groupedTasks = tasks.reduce((groups, task) => {
    const week = task.week_number || 1;

    if (!groups[week]) {
      groups[week] = [];
    }

    groups[week].push(task);

    return groups;
  }, {});

  // Sort weeks and tasks.
  const sortedWeeks = Object.entries(groupedTasks).sort(
    ([weekA], [weekB]) => Number(weekA) - Number(weekB)
  );

  // ==================================================
  // LOADING STATE
  // ==================================================

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <h2>Loading your career roadmaps...</h2>
        </div>
      </div>
    );
  }

  // ==================================================
  // MAIN PAGE
  // ==================================================

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* PAGE HEADER */}

        <header style={{ marginBottom: "28px" }}>
          <h1 style={styles.heading}>
            AI Career Roadmap
          </h1>

          <p style={styles.subtitle}>
            Build your career step by step with personalized
            AI-generated learning plans, weekly milestones
            and progress tracking.
          </p>
        </header>

        {/* ALERTS */}

        {error && (
          <div
            role="alert"
            style={{
              background: "#feecec",
              color: "#b42318",
              padding: "14px",
              borderRadius: "9px",
              marginBottom: "18px",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            style={{
              background: "#eaf8ef",
              color: "#16703a",
              padding: "14px",
              borderRadius: "9px",
              marginBottom: "18px",
            }}
          >
            {success}
          </div>
        )}

        {/* GENERATE ROADMAP */}

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>
            Generate a New Roadmap
          </h2>

          <form onSubmit={handleGenerate}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "18px",
                alignItems: "end",
              }}
            >
              <div>
                <label style={styles.label}>
                  Target Career Role
                </label>

                <select
                  style={styles.input}
                  value={targetRole}
                  onChange={(event) =>
                    setTargetRole(event.target.value)
                  }
                  disabled={generating}
                >
                  {CAREER_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.label}>
                  Roadmap Duration
                </label>

                <select
                  style={styles.input}
                  value={durationDays}
                  onChange={(event) =>
                    setDurationDays(Number(event.target.value))
                  }
                  disabled={generating}
                >
                  {DURATION_OPTIONS.map((days) => (
                    <option key={days} value={days}>
                      {days} Days
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  type="submit"
                  style={{
                    ...styles.button,
                    width: "100%",
                    opacity: generating ? 0.7 : 1,
                    cursor: generating ? "not-allowed" : "pointer",
                  }}
                  disabled={generating}
                >
                  {generating
                    ? "Generating..."
                    : "Generate Roadmap"}
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* SAVED ROADMAPS */}

        <section style={styles.card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <h2 style={styles.sectionTitle}>
              My Career Roadmaps
            </h2>

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() =>
                loadRoadmaps(selectedRoadmap?.id || null)
              }
            >
              Refresh
            </button>
          </div>

          {roadmaps.length === 0 ? (
            <p style={styles.muted}>
              You haven't generated a roadmap yet.
              Create your first personalized roadmap above.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(230px, 1fr))",
                gap: "14px",
              }}
            >
              {roadmaps.map((roadmap) => (
                <button
                  key={roadmap.id}
                  type="button"
                  onClick={() =>
                    handleSelectRoadmap(roadmap.id)
                  }
                  style={{
                    textAlign: "left",
                    padding: "17px",
                    borderRadius: "12px",
                    border:
                      selectedRoadmap?.id === roadmap.id
                        ? "2px solid #6254df"
                        : "1px solid #e4e7f0",
                    background:
                      selectedRoadmap?.id === roadmap.id
                        ? "#f3f1ff"
                        : "#fff",
                    cursor: "pointer",
                    color: "#172033",
                    width: "100%",
                  }}
                >
                  <strong>{roadmap.title}</strong>

                  <p style={styles.muted}>
                    {roadmap.target_role}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span
                      style={{
                        color: getStatusColor(roadmap.status),
                        fontWeight: 700,
                        fontSize: "12px",
                      }}
                    >
                      {formatStatus(roadmap.status)}
                    </span>

                    <span style={styles.muted}>
                      {roadmap.duration_days} days
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* SELECTED ROADMAP */}

        {selectedRoadmap && (
          <>
            {/* ROADMAP OVERVIEW */}

            <section style={styles.card}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "15px",
                }}
              >
                <div>
                  <h2 style={styles.sectionTitle}>
                    {selectedRoadmap.title}
                  </h2>

                  <p style={styles.muted}>
                    {selectedRoadmap.target_role} ·{" "}
                    {selectedRoadmap.duration_days} days
                  </p>
                </div>

                <span
                  style={{
                    color: getStatusColor(selectedRoadmap.status),
                    fontWeight: 750,
                    background: "#f1f5f9",
                    padding: "9px 14px",
                    borderRadius: "20px",
                    fontSize: "13px",
                  }}
                >
                  {formatStatus(selectedRoadmap.status)}
                </span>
              </div>

              <p
                style={{
                  lineHeight: 1.7,
                  color: "#475569",
                }}
              >
                {selectedRoadmap.description}
              </p>

              {selectedRoadmap.status === "draft" && (
                <button
                  type="button"
                  style={styles.button}
                  onClick={handleActivate}
                  disabled={activating}
                >
                  {activating
                    ? "Activating..."
                    : "Activate Roadmap"}
                </button>
              )}
            </section>

            {/* PROGRESS OVERVIEW */}

            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>
                Your Progress
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: "16px",
                  marginBottom: "22px",
                }}
              >
                {[
                  ["Completed", completedTasks],
                  ["In Progress", inProgressTasks],
                  ["Pending", pendingTasks],
                  ["Skipped", skippedTasks],
                  ["Total Tasks", totalTasks],
                  ["Completion", `${completionPercentage}%`],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      background: "#f7f7fc",
                      padding: "17px",
                      borderRadius: "12px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "26px",
                        fontWeight: 800,
                        color: "#6254df",
                      }}
                    >
                      {value}
                    </div>

                    <div style={styles.muted}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                  fontWeight: 700,
                }}
              >
                <span>Overall Completion</span>
                <span>{completionPercentage}%</span>
              </div>

              <div
                style={{
                  height: "12px",
                  background: "#e8eaf3",
                  borderRadius: "20px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${completionPercentage}%`,
                    background: "#6254df",
                    borderRadius: "20px",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </section>

            {/* WEEKLY MILESTONES */}

            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>
                Weekly Milestones
              </h2>

              {(selectedRoadmap.weekly_milestones || []).length === 0 ? (
                <p style={styles.muted}>
                  No weekly milestones available.
                </p>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "14px",
                  }}
                >
                  {selectedRoadmap.weekly_milestones.map(
                    (milestone) => (
                      <div
                        key={milestone.week_number}
                        style={{
                          padding: "17px",
                          background: "#f7f7fc",
                          borderRadius: "12px",
                          borderLeft: "4px solid #6254df",
                        }}
                      >
                        <strong>
                          Week {milestone.week_number}
                        </strong>

                        <p
                          style={{
                            fontWeight: 650,
                            marginBottom: "8px",
                          }}
                        >
                          {milestone.objective}
                        </p>

                        <p style={styles.muted}>
                          <strong>Deliverable:</strong>{" "}
                          {milestone.deliverable}
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>

            {/* DAILY LEARNING PLAN */}

            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>
                Daily Learning Plan
              </h2>

              {tasks.length === 0 ? (
                <p style={styles.muted}>
                  No tasks available for this roadmap.
                </p>
              ) : (
                sortedWeeks.map(([week, weekTasks]) => (
                  <div
                    key={week}
                    style={{ marginBottom: "28px" }}
                  >
                    <h3
                      style={{
                        fontSize: "18px",
                        marginBottom: "14px",
                        color: "#6254df",
                      }}
                    >
                      Week {week}
                    </h3>

                    <div
                      style={{
                        display: "grid",
                        gap: "12px",
                      }}
                    >
                      {weekTasks.map((task) => (
                        <div
                          key={task.id}
                          style={{
                            border: "1px solid #e5e7ef",
                            borderRadius: "12px",
                            padding: "17px",
                            background:
                              task.status === "completed"
                                ? "#f0faf3"
                                : task.status === "skipped"
                                ? "#f8fafc"
                                : "#fff",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              gap: "12px",
                              flexWrap: "wrap",
                            }}
                          >
                            <div
                              style={{
                                flex: 1,
                                minWidth: "200px",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "12px",
                                  color: "#64748b",
                                  fontWeight: 700,
                                  marginBottom: "5px",
                                }}
                              >
                                DAY {task.day_number} ·{" "}
                                {task.category}
                              </div>

                              <h4
                                style={{
                                  margin: "0 0 8px",
                                  fontSize: "16px",
                                }}
                              >
                                {task.title}
                              </h4>

                              <p
                                style={{
                                  margin: "0 0 10px",
                                  color: "#64748b",
                                  fontSize: "14px",
                                  lineHeight: 1.6,
                                }}
                              >
                                {task.description}
                              </p>

                              <p
                                style={{
                                  fontSize: "13px",
                                  margin: "0 0 7px",
                                }}
                              >
                                <strong>Deliverable:</strong>{" "}
                                {task.expected_deliverable}
                              </p>

                              <div
                                style={{
                                  margin: "12px 0",
                                  padding: "12px",
                                  background: "#f8f9ff",
                                  border: "1px solid #e6e8f5",
                                  borderRadius: "10px",
                                }}
                              >
                                <strong
                                  style={{
                                    display: "block",
                                    fontSize: "13px",
                                    marginBottom: "9px",
                                    color: "#334155",
                                  }}
                                >
                                  Learning Resources
                                </strong>

                                {getSafeLearningResources(
                                  task.learning_resources
                                ).length > 0 ? (
                                  <div
                                    style={{
                                      display: "grid",
                                      gap: "8px",
                                    }}
                                  >
                                    {getSafeLearningResources(
                                      task.learning_resources
                                    ).map((resource, resourceIndex) => (
                                      <a
                                        key={`${resource.url}-${resourceIndex}`}
                                        href={resource.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                          display: "flex",
                                          justifyContent: "space-between",
                                          alignItems: "center",
                                          flexWrap: "wrap",
                                          gap: "6px",
                                          color: "#5145cd",
                                          fontSize: "13px",
                                          fontWeight: 650,
                                          textDecoration: "none",
                                        }}
                                      >
                                        <span>
                                          ↗ {resource.title}
                                        </span>
                                        <span
                                          style={{
                                            color: "#64748b",
                                            fontSize: "11px",
                                            fontWeight: 600,
                                            background: "#eef0ff",
                                            padding: "4px 8px",
                                            borderRadius: "20px",
                                          }}
                                        >
                                          {getResourceTypeLabel(resource.type)}
                                        </span>
                                      </a>
                                    ))}
                                  </div>
                                ) : (
                                  <p
                                    style={{
                                      ...styles.muted,
                                      margin: 0,
                                      fontSize: "12px",
                                    }}
                                  >
                                    No learning resources are available for
                                    this task yet.
                                  </p>
                                )}
                              </div>

                              <span style={styles.muted}>
                                {task.estimated_minutes} minutes ·{" "}
                                {formatStatus(task.priority)} priority
                              </span>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                                minWidth: "145px",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 750,
                                  color: getStatusColor(task.status),
                                }}
                              >
                                {formatStatus(task.status)}
                              </span>

                              <select
                                style={{
                                  ...styles.input,
                                  fontSize: "13px",
                                  padding: "9px",
                                }}
                                value={task.status}
                                disabled={updatingTask === task.id}
                                onChange={(event) =>
                                  handleTaskStatus(
                                    task,
                                    event.target.value
                                  )
                                }
                              >
                                {STATUS_OPTIONS.map((status) => (
                                  <option
                                    key={status}
                                    value={status}
                                  >
                                    {formatStatus(status)}
                                  </option>
                                ))}
                              </select>

                              {updatingTask === task.id && (
                                <span style={styles.muted}>
                                  Updating...
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </section>

            {/* WEEKLY PROGRESS */}

            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>
                Weekly Progress
              </h2>

              {weeklyProgress.length === 0 ? (
                <p style={styles.muted}>
                  Weekly progress is not available yet.
                </p>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: "22px",
                  }}
                >
                  {weeklyProgress.map((week, index) => {
                    const percentage = getProgressPercentage({
                      completion_percentage:
                        week.completion_percentage,
                    });

                    return (
                      <div
                        key={week.week_number || index}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "7px",
                            fontSize: "14px",
                          }}
                        >
                          <strong>
                            Week {week.week_number || index + 1}
                          </strong>

                          <span>{percentage}%</span>
                        </div>

                        <div
                          style={{
                            height: "9px",
                            background: "#e8eaf3",
                            borderRadius: "20px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${percentage}%`,
                              height: "100%",
                              background: "#6254df",
                              transition: "width 0.3s ease",
                            }}
                          />
                        </div>

                        <p style={styles.muted}>
                          {week.completed_tasks || 0} completed tasks
                          {week.total_tasks != null
                            ? ` out of ${week.total_tasks}`
                            : ""}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* RECENT ACTIVITY */}

            <section style={styles.card}>
              <h2 style={styles.sectionTitle}>
                Recent Activity
              </h2>

              {recentActivity.length === 0 ? (
                <p style={styles.muted}>
                  Your activity will appear here as you work
                  through your roadmap.
                </p>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: "12px",
                  }}
                >
                  {recentActivity.map((activity, index) => (
                    <div
                      key={activity.id || index}
                      style={{
                        padding: "15px",
                        borderRadius: "9px",
                        background: "#f7f7fc",
                      }}
                    >
                      <strong>
                        {formatStatus(
                          activity.event_type || "Progress update"
                        )}
                      </strong>

                      {activity.note && (
                        <p style={styles.muted}>
                          {activity.note}
                        </p>
                      )}

                      {activity.created_at && (
                        <p style={styles.muted}>
                          {new Date(
                            activity.created_at
                          ).toLocaleString()}
                        </p>
                      )}

                      {activity.completion_percentage != null && (
                        <span
                          style={{
                            display: "block",
                            fontSize: "13px",
                            marginTop: "5px",
                            color: "#6254df",
                          }}
                        >
                          Progress: {activity.completion_percentage}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
