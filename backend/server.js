const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const collegeRoutes = require('./routes/collegeRoutes');
const compareRoutes = require('./routes/compareRoutes');
const recommendRoutes = require('./routes/recommendRoutes');
const favouriteRoutes = require('./routes/favouriteRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Enable CORS for frontend clients (Live Server, file URL, or direct)
app.use(cors({
  origin: true,
  credentials: true
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files directly from parent folder
const frontendDir = path.join(__dirname, '..');
app.use(express.static(frontendDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/colleges', compareRoutes); // handles /api/colleges/compare
app.use('/api/colleges', collegeRoutes);
app.use('/api/recommendations', recommendRoutes);
app.use('/api/favourites', favouriteRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'CollegeWise REST API is running',
    timestamp: new Date().toISOString()
  });
});

// Fallback to index.html for non-API web routes
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

// API 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `API endpoint ${req.originalUrl} not found.` });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🎓 CollegeWise Server running on http://localhost:${PORT}`);
  console.log(`🌐 Frontend serving from: ${frontendDir}`);
  console.log(`🚀 REST API ready at: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});

module.exports = app;
