const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

function formatCollege(row) {
  if (!row) return null;
  let courses = [];
  try {
    courses = JSON.parse(row.courses);
  } catch (e) {
    courses = typeof row.courses === 'string' ? row.courses.split(',').map(s => s.trim()) : [];
  }
  return { ...row, courses };
}

// GET /api/favourites - List user's favourite colleges
router.get('/', verifyToken, (req, res) => {
  try {
    const userId = req.user.id;
    const rows = db.prepare(`
      SELECT c.*, f.created_at as favourited_at
      FROM favourites f
      JOIN colleges c ON f.college_id = c.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `).all(userId);

    const colleges = rows.map(formatCollege);
    const ids = colleges.map(c => c.id);

    return res.json({
      success: true,
      count: colleges.length,
      ids,
      colleges
    });
  } catch (err) {
    console.error('Fetch favourites error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch favourite colleges.' });
  }
});

// POST /api/favourites/toggle - Toggle favourite status
router.post('/toggle', verifyToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { collegeId } = req.body;

    const cId = parseInt(collegeId, 10);
    if (!cId || isNaN(cId)) {
      return res.status(400).json({ success: false, message: 'Valid collegeId is required.' });
    }

    const existing = db.prepare('SELECT id FROM favourites WHERE user_id = ? AND college_id = ?').get(userId, cId);

    if (existing) {
      db.prepare('DELETE FROM favourites WHERE id = ?').run(existing.id);
      return res.json({
        success: true,
        action: 'removed',
        isFavourite: false,
        message: 'Removed from favourites.',
        collegeId: cId
      });
    } else {
      db.prepare('INSERT INTO favourites (user_id, college_id) VALUES (?, ?)').run(userId, cId);
      return res.json({
        success: true,
        action: 'added',
        isFavourite: true,
        message: 'Added to favourites.',
        collegeId: cId
      });
    }
  } catch (err) {
    console.error('Toggle favourite error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update favourite.' });
  }
});

// DELETE /api/favourites/:collegeId - Remove specific favourite
router.delete('/:collegeId', verifyToken, (req, res) => {
  try {
    const userId = req.user.id;
    const collegeId = parseInt(req.params.collegeId, 10);

    db.prepare('DELETE FROM favourites WHERE user_id = ? AND college_id = ?').run(userId, collegeId);

    return res.json({
      success: true,
      message: 'Removed from favourites.',
      collegeId
    });
  } catch (err) {
    console.error('Delete favourite error:', err);
    return res.status(500).json({ success: false, message: 'Failed to remove favourite.' });
  }
});

module.exports = router;
