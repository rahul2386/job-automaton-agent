require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// connect to DB
connectDB();

// health route
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date(), status: 'server and db ok (if no crash)' });
});

// TODO: task routes will be added here
const taskRoutes = require('./routes/taskRoutes');
app.use('/api/tasks', taskRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
