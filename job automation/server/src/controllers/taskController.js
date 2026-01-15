const Task = require('../models/Task');
const { enqueueTask } = require('../services/taskExecutor');

// POST /api/tasks
async function createTask(req, res) {
  try {
    const { command } = req.body;
    if (!command || !command.trim()) {
      return res.status(400).json({ error: 'command is required' });
    }

    const task = await Task.create({ command: command.trim() });

    // fire-and-forget execution
    enqueueTask(task._id);

    res.status(201).json(task);
  } catch (err) {
    console.error('createTask error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/tasks
async function getTasks(req, res) {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 }).limit(20);
    res.json(tasks);
  } catch (err) {
    console.error('getTasks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/tasks/:id
async function getTaskById(req, res) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    console.error('getTaskById error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// add near other controller functions
async function getTaskDetail(req, res) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    console.error('getTaskDetail error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getTaskLogs(req, res) {
  try {
    const task = await Task.findById(req.params.id).select('logs status result error updatedAt');
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({
      logs: task.logs || [],
      status: task.status,
      result: task.result,
      error: task.error,
      updatedAt: task.updatedAt
    });
  } catch (err) {
    console.error('getTaskLogs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}


module.exports = {
  createTask,
  getTasks,
  getTaskById,
  getTaskDetail,
  getTaskLogs
};
