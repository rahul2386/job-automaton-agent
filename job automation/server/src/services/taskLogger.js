const Task = require('../models/Task');

/**
 * Append a log entry to the task.
 * step: short label e.g. "planner", "search_web", "summarize", "error"
 * message: human readable message
 */
async function appendLog(taskId, step, message) {
  try {
    await Task.findByIdAndUpdate(taskId, {
      $push: { logs: { step, message, ts: new Date() } },
      $set: { updatedAt: new Date() }
    }, { new: false, upsert: false });
  } catch (err) {
    console.error('appendLog error', err.message);
  }
}

module.exports = { appendLog };
