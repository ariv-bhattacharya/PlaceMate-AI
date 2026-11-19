
import { useState } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { askCareerMentor } from "../../services/careerMentorService";

export default function CareerMentor() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const suggestions = [
    "Which career path suits my profile?",
    "Create a 30-day placement preparation roadmap.",
    "What skills should I improve for Data Analyst roles?",
    "Help me prepare for a technical interview."
  ];

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!question.trim()) {
      setError("Please enter a question.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setAnswer("");

      const response = await askCareerMentor(question);

      setAnswer(response.answer || "No response received.");
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to Career Mentor. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Convert HTML line-break tags into Markdown line breaks.
  // Raw HTML is deliberately not enabled in ReactMarkdown.
  const formattedAnswer = answer.replace(/<br\s*\/?>/gi, "\n");

  return (
    <main style={styles.page}>
      <nav style={styles.navbar}>
        <Link to="/student/dashboard" style={styles.backLink}>
          ← Back to Dashboard
        </Link>

        <h2 style={styles.logo}>PlaceMate AI</h2>
      </nav>

      <section style={styles.container}>
        <div style={styles.header}>
          <span style={styles.eyebrow}>
            AI-POWERED CAREER GUIDANCE
          </span>

          <h1>Your Personal Career Mentor</h1>

          <p>
            Get personalized career recommendations, skill-gap guidance,
            placement roadmaps and interview preparation.
          </p>
        </div>

        <div style={styles.card}>
          <h2>How can I help you today?</h2>

          <p style={styles.description}>
            Ask anything related to your career, skills or placement journey.
          </p>

          <div style={styles.suggestions}>
            {suggestions.map((item, index) => (
              <button
                key={index}
                type="button"
                style={styles.suggestion}
                onClick={() => {
                  setQuestion(item);
                  setError("");
                }}
                disabled={loading}
              >
                {item}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask your career-related question here..."
              rows={5}
              maxLength={1000}
              style={styles.textarea}
              disabled={loading}
            />

            <div style={styles.footer}>
              <span style={styles.counter}>
                {question.length}/1000 characters
              </span>

              <button
                type="submit"
                disabled={loading || !question.trim()}
                style={{
                  ...styles.submitButton,
                  opacity:
                    loading || !question.trim() ? 0.6 : 1,
                  cursor:
                    loading || !question.trim()
                      ? "not-allowed"
                      : "pointer"
                }}
              >
                {loading ? "Thinking..." : "Ask Career Mentor →"}
              </button>
            </div>
          </form>

          {error && (
            <div style={styles.error} role="alert">
              {error}
            </div>
          )}
        </div>

        {loading && (
          <div style={styles.loading}>
            Your AI Career Mentor is preparing your response...
          </div>
        )}

        {answer && !loading && (
          <div style={styles.answerCard}>
            <h2 style={styles.answerHeading}>
              Career Mentor's Response
            </h2>

            <div style={styles.answer}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 style={styles.markdownHeading}>
                      {children}
                    </h1>
                  ),

                  h2: ({ children }) => (
                    <h2 style={styles.markdownSubheading}>
                      {children}
                    </h2>
                  ),

                  h3: ({ children }) => (
                    <h3 style={styles.markdownSmallHeading}>
                      {children}
                    </h3>
                  ),

                  p: ({ children }) => (
                    <p style={styles.markdownParagraph}>
                      {children}
                    </p>
                  ),

                  ul: ({ children }) => (
                    <ul style={styles.markdownList}>
                      {children}
                    </ul>
                  ),

                  ol: ({ children }) => (
                    <ol style={styles.markdownList}>
                      {children}
                    </ol>
                  ),

                  li: ({ children }) => (
                    <li style={styles.markdownListItem}>
                      {children}
                    </li>
                  ),

                  table: ({ children }) => (
                    <div style={styles.tableWrapper}>
                      <table style={styles.markdownTable}>
                        {children}
                      </table>
                    </div>
                  ),

                  th: ({ children }) => (
                    <th style={styles.tableHeader}>
                      {children}
                    </th>
                  ),

                  td: ({ children }) => (
                    <td style={styles.tableCell}>
                      {children}
                    </td>
                  ),

                  blockquote: ({ children }) => (
                    <blockquote style={styles.blockquote}>
                      {children}
                    </blockquote>
                  ),

                  code: ({ children }) => (
                    <code style={styles.inlineCode}>
                      {children}
                    </code>
                  ),

                  hr: () => (
                    <hr style={styles.divider} />
                  )
                }}
              >
                {formattedAnswer}
              </ReactMarkdown>
            </div>
          </div>
        )}

        <p style={styles.disclaimer}>
          AI-generated guidance can contain mistakes. Always verify
          recommendations against your actual skills and qualifications.
        </p>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f7f8fc",
    color: "#172033",
    fontFamily: "Arial, sans-serif"
  },

  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 6%",
    background: "#fff",
    borderBottom: "1px solid #e8eaf1"
  },

  logo: {
    color: "#6254d9",
    margin: 0
  },

  backLink: {
    color: "#6254d9",
    textDecoration: "none",
    fontWeight: "bold"
  },

  container: {
    maxWidth: "1100px",
    margin: "45px auto",
    padding: "0 20px"
  },

  header: {
    marginBottom: "30px"
  },

  eyebrow: {
    color: "#6254d9",
    fontSize: "12px",
    fontWeight: "bold",
    letterSpacing: "1.5px"
  },

  card: {
    background: "#fff",
    padding: "30px",
    borderRadius: "16px",
    border: "1px solid #e8eaf1"
  },

  description: {
    color: "#687386",
    lineHeight: 1.6
  },

  suggestions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    margin: "22px 0"
  },

  suggestion: {
    padding: "10px 14px",
    background: "#f0efff",
    color: "#5142c4",
    border: "1px solid #dedaff",
    borderRadius: "20px",
    cursor: "pointer"
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "15px",
    border: "1px solid #dfe2eb",
    borderRadius: "10px",
    fontSize: "15px",
    resize: "vertical",
    fontFamily: "Arial, sans-serif"
  },

  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    marginTop: "15px"
  },

  counter: {
    color: "#8992a3",
    fontSize: "12px"
  },

  submitButton: {
    padding: "13px 20px",
    background: "#6254d9",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold"
  },

  error: {
    marginTop: "20px",
    padding: "14px",
    background: "#fff0ed",
    color: "#c04432",
    borderRadius: "8px"
  },

  loading: {
    marginTop: "25px",
    padding: "20px",
    background: "#eeecff",
    borderRadius: "10px",
    color: "#5142c4"
  },

  answerCard: {
    marginTop: "25px",
    padding: "28px",
    background: "#fff",
    border: "1px solid #e8eaf1",
    borderRadius: "14px"
  },

  answerHeading: {
    marginTop: 0,
    marginBottom: "25px",
    color: "#172033"
  },

  answer: {
    lineHeight: 1.8,
    overflowWrap: "anywhere",
    color: "#263247"
  },

  markdownHeading: {
    fontSize: "24px",
    color: "#172033",
    marginTop: "28px",
    marginBottom: "14px"
  },

  markdownSubheading: {
    fontSize: "21px",
    color: "#29205f",
    marginTop: "25px",
    marginBottom: "12px"
  },

  markdownSmallHeading: {
    fontSize: "17px",
    color: "#5142c4",
    marginTop: "20px"
  },

  markdownParagraph: {
    margin: "12px 0",
    lineHeight: 1.8
  },

  markdownList: {
    paddingLeft: "25px",
    margin: "12px 0"
  },

  markdownListItem: {
    paddingLeft: "5px",
    marginBottom: "9px",
    lineHeight: 1.7
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
    margin: "20px 0",
    border: "1px solid #e5e7ef",
    borderRadius: "10px"
  },

  markdownTable: {
    width: "100%",
    minWidth: "600px",
    borderCollapse: "collapse",
    fontSize: "14px",
    textAlign: "left"
  },

  tableHeader: {
    background: "#f0efff",
    color: "#40359b",
    padding: "13px",
    borderBottom: "1px solid #dedaff",
    fontWeight: "bold"
  },

  tableCell: {
    padding: "13px",
    borderBottom: "1px solid #e8eaf1",
    verticalAlign: "top",
    lineHeight: 1.6
  },

  blockquote: {
    margin: "18px 0",
    padding: "12px 18px",
    background: "#f5f4ff",
    borderLeft: "4px solid #6254d9",
    color: "#5142c4"
  },

  inlineCode: {
    background: "#f0efff",
    color: "#5142c4",
    padding: "3px 6px",
    borderRadius: "4px",
    fontSize: "0.9em"
  },

  divider: {
    border: 0,
    borderTop: "1px solid #e5e7ef",
    margin: "25px 0"
  },

  disclaimer: {
    marginTop: "22px",
    color: "#8992a3",
    fontSize: "12px",
    lineHeight: 1.6
  }
};
