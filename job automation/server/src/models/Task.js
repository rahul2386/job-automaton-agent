const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    step: { type: String, required: true},
    message: { type: String, required: true},
    ts: {type: Date, default: Date.now}
}, {_id: false});

const taskSchema = new mongoose.Schema({
  command: { type: String, required: true },
  status: {
    type: String,
    enum: ['queued', 'running', 'completed', 'failed'],
    default: 'queued'
  },
  result: { type: mongoose.Schema.Types.Mixed, default: null },
  error: { type: String, default: null },
  logs: {type: [logSchema], default: []},
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

taskSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Task = mongoose.model('Task', taskSchema);
module.exports = Task;
