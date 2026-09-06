const express = require('express');
const router = express.Router();
const db = require('../config/db');

function formatCollege(row) {
  if (!row) return null;
  let courses = [];
  try {
    courses = JSON.parse(row.courses);
  } catch (e) {
    courses = typeof row.courses === 'string' ? row.courses.split(',').map(s => s.trim()) : [];
  }
  return {
    ...row,
    courses
  };
}

// GET /api/colleges/compare?ids=1,2,3 or POST /api/colleges/compare
function handleCompare(req, res) {
  try {
    let ids = [];
    if (req.query.ids) {
      ids = req.query.ids.split(',').map(id => parseInt(id.trim(), 10)).filter(Boolean);
    } else if (req.body && Array.isArray(req.body.ids)) {
      ids = req.body.ids.map(id => parseInt(id, 10)).filter(Boolean);
    }

    if (!ids || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide college IDs to compare (e.g. ?ids=1,2,3).' });
    }

    // Limit to 3 colleges as per requirements
    if (ids.length > 3) {
      ids = ids.slice(0, 3);
    }

    const placeholders = ids.map(() => '?').join(',');
    const rows = db.prepare(`SELECT * FROM colleges WHERE id IN (${placeholders})`).all(...ids);
    const colleges = rows.map(formatCollege);

    // Build comparison matrix
    const matrix = [
      { label: 'Location', values: colleges.map(c => `${c.city}, ${c.state}`) },
      { label: 'Ranking', values: colleges.map(c => `#${c.rank}`) },
      { label: 'Annual Fees', values: colleges.map(c => `₹${c.fees} L`) },
      { label: 'Avg Placement', values: colleges.map(c => `₹${c.placement} L`) },
      { label: 'Cut-off', values: colleges.map(c => c.cutoff) },
      { label: 'Courses Offered', values: colleges.map(c => c.courses.join(', ')) },
      { label: 'Entrance Exam', values: colleges.map(c => c.exam) },
      { label: 'Institution Type', values: colleges.map(c => c.type) },
      { label: 'Rating', values: colleges.map(c => `⭐ ${c.rating}/5`) },
      { label: 'Student Count', values: colleges.map(c => c.students) },
      { label: 'Infrastructure', values: colleges.map(c => c.infrastructure) }
    ];

    return res.json({
      success: true,
      count: colleges.length,
      colleges,
      matrix
    });
  } catch (err) {
    console.error('Comparison error:', err);
    return res.status(500).json({ success: false, message: 'Failed to compare colleges.' });
  }
}

router.get('/compare', handleCompare);
router.post('/compare', handleCompare);

module.exports = router;
