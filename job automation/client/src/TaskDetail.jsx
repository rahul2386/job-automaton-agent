import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";

export default function TaskDetail() {
  const { id } = useParams();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showLogs, setShowLogs] = useState(false);

  const pollingRef = useRef(null);
  const isPageVisibleRef = useRef(true);

  async function fetchTask() {
    try {
      setLoading(true);
      const res = await fetch(`/api/tasks/${id}/detail`);
      if (!res.ok) throw new Error("Failed to load task");
      const data = await res.json();
      setTask(data);
    } catch (err) {
      setErrorMsg(err.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  async function pollLogsAndMerge() {
    try {
      const res = await fetch(`/api/tasks/${id}/logs`);
      if (!res.ok) return;
      const data = await res.json();

      setTask(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          status: data.status ?? prev.status,
          result: data.result ?? prev.result,
          error: data.error ?? prev.error,
          logs: Array.isArray(data.logs) ? data.logs : prev.logs,
        };
      });
    } catch {
      // silent
    }
  }

  useEffect(() => {
    fetchTask();

    function handleVisibilityChange() {
      isPageVisibleRef.current = document.visibilityState === "visible";
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    pollingRef.current = setInterval(() => {
      if (isPageVisibleRef.current) pollLogsAndMerge();
    }, 3000);

    return () => {
      clearInterval(pollingRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [id]);

  if (loading) return <div className="page-loading">Loading task…</div>;
  if (errorMsg) return <div className="page-error">{errorMsg}</div>;
  if (!task) return <div className="page-loading">Task not found</div>;

  const jobs = task.result?.data?.jobs || [];

  return (
    <div className="task-detail-container">
      <Link to="/" className="back-link">← Back</Link>

      <h1 className="task-title">{task.command}</h1>

      <div className="task-meta">
        <span className={`badge ${task.status}`}>{task.status}</span>
        <span className="muted">
          Created: {new Date(task.createdAt).toLocaleString()}
        </span>
      </div>

      {task.error && (
        <div className="task-error">
          <strong>Error:</strong> {task.error}
        </div>
      )}

      {/* ===== Job Results ===== */}
      <section className="results-section">
        <h2>Results</h2>

        {jobs.length > 0 ? (
          <div className="job-list">
            {jobs.map((job, index) => (
              <div key={index} className="card job-card">
                <a
                  href={job.url}
                  target="_blank"
                  rel="noreferrer"
                  className="job-title"
                >
                  {job.title || "Job Title"}
                  
                  {job.confidence && (
                    <span className={`job-badge ${job.confidence}`}>
                      {job.confidence === "strict"
                        ? "≤ 3 days (Verified)"
                        : "Recent (Estimated)"}
                    </span>
                  )}
                </a>
                {job.company && (
                  <div className="job-company muted">{job.company}</div>
                )}

                <div className="job-meta">
                  {job.location && <div>📍 {job.location}</div>}
                  {job.experience && <div>🎓 {job.experience}</div>}
                  {job.salary && <div>💰 {job.salary}</div>}
                </div>

                {Array.isArray(job.skills) && job.skills.length > 0 && (
                  <div className="job-skills">
                    {job.skills.map((skill, i) => (
                      <span key={i} className="skill-chip">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="muted">No structured job data available.</div>
        )}
      </section>

      {/* ===== Logs Toggle ===== */}
      <button
        className="btn btn-outline btn-small toggle-btn"
        onClick={() => setShowLogs(prev => !prev)}
      >
        {showLogs ? "Hide technical details" : "Show technical details"}
      </button>

      {showLogs && (
        <section className="logs-section">
          <h3>Execution Logs</h3>
          {Array.isArray(task.logs) && task.logs.length > 0 ? (
            <div className="log-box">
              {task.logs.slice().reverse().map((log, i) => (
                <div key={i} className="log-item">
                  <div className="log-step">
                    [{log.step}] {log.message}
                  </div>
                  <div className="log-time">
                    {new Date(log.ts).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="muted">No logs yet.</div>
          )}
        </section>
      )}
    </div>
  );
}
