import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function App() {
  const [command, setCommand] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");

  async function fetchTasks() {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error("Error fetching tasks", err);
    }
  }

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 4000); // poll every 4s
    return () => clearInterval(interval);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!command.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("Error creating task", data);
      } else {
        setCommand("");
        // immediately refresh list
        fetchTasks();
      }
    } catch (err) {
      console.error("Error creating task", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div
        style={{
          padding: "1.5rem",
          maxWidth: 800,
          margin: "0 auto",
          fontFamily: "system-ui",
        }}
      >
        <h1 style={{ fontSize: "1.8rem", marginBottom: "1rem" }}>
          AI Automation Agent — MVP
        </h1>

        <form onSubmit={handleSubmit} style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: 8 }}>Command</label>
          <textarea
            rows={3}
            style={{ width: "100%", padding: 8, marginBottom: 8 }}
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="e.g. Find 5 React internships and summarize the skills"
          />
          <button
            type="submit"
            disabled={loading}
            style={{ padding: "0.4rem 1rem", cursor: "pointer" }}
          >
            {loading ? "Creating task..." : "Create Task"}
          </button>
        </form>

        <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
          Recent Tasks
        </h2>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          {tasks.length === 0 && <p>No tasks yet.</p>}

          {/* Filter controls */}
          <div style={{ marginBottom: 12 }}>
            <label>
              Filter:
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{ marginLeft: 8 }}
              >
                <option value="all">All</option>
                <option value="queued">Queued</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </label>
          </div>

          {tasks
            .filter((t) => (filter === "all" ? true : t.status === filter))
            .map((task) => (
              <div
                key={task._id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: "0.75rem 1rem",
                }}
              >
                <div>
                  <div className="card">
                    <div className="flex space-between align-center">
                      <Link to={`/task/${task._id}`} className="card-title">
                        {task.command}
                      </Link>
                      <div className="card-time muted">
                        {new Date(task.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <span className={`badge ${task.status}`}>
                      {task.status}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>

                    {/* small spinner when running */}
                    {task.status === "running" && (
                      <div style={{ fontSize: "0.8rem", color: "#333" }}>
                        Processing…
                      </div>
                    )}
                  </div>
                {/* </div> */}

                {/* show short result preview */}
                {/* {task.result && task.status === "completed" && (
                  <div style={{ marginTop: 6 }}>
                    <strong>Objective:</strong> {task.result.objective || "—"}
                  </div>
                )} */}

                {task.status === "failed" && (
                  <div style={{ color: "red", marginTop: 6 }}>{task.error}</div>
                )}
              </div>
              </div>
              // </div>
            ))}
        </div>
      </div>
    </>
  );
}

export default App;
