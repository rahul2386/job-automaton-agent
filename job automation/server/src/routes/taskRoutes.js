const express = require('express');
const router = express.Router();
const {
  createTask,
  getTasks,
  getTaskById,
  getTaskDetail,
  getTaskLogs
} = require('../controllers/taskController');

router.post('/', createTask);
router.get('/', getTasks);
router.get('/:id', getTaskById);
router.get('/:id/detail', getTaskDetail);
router.get('/:id/logs', getTaskLogs);

module.exports = router;
