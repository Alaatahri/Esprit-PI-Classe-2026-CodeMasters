require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const projectsRouter = require('./routes/projects');

const app = express();
app.use(express.json());

app.use('/api/projects', projectsRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'bmp-express-matching' });
});

const PORT = process.env.PORT || 3002;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bmp_tn';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Express matching API http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
