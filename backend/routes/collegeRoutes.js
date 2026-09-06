const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

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

// GET /api/colleges - Search & Filter
router.get('/', (req, res) => {
  try {
    const { q, location, course, budget, sort } = req.query;

    let sql = 'SELECT * FROM colleges WHERE 1=1';
    const params = [];

    if (location) {
      sql += ' AND city = ?';
      params.push(location);
    }

    if (budget) {
      if (budget === '1') {
        sql += ' AND fees < 2.0';
      } else if (budget === '2') {
        sql += ' AND fees >= 2.0 AND fees <= 5.0';
      } else if (budget === '3') {
        sql += ' AND fees > 5.0';
      }
    }

    // Sort order
    if (sort === 'rank') {
      sql += ' ORDER BY rank ASC';
    } else if (sort === 'fees') {
      sql += ' ORDER BY fees ASC';
    } else if (sort === 'placement') {
      sql += ' ORDER BY placement DESC';
    } else {
      sql += ' ORDER BY rank ASC';
    }

    const rows = db.prepare(sql).all(...params);
    let colleges = rows.map(formatCollege);

    // Apply JS filters for course and text query if provided
    if (q) {
      const queryLower = q.toLowerCase().trim();
      colleges = colleges.filter(c => {
        const text = `${c.name} ${c.city} ${c.state} ${c.courses.join(' ')} ${c.exam} ${c.type}`.toLowerCase();
        return text.includes(queryLower);
      });
    }

    if (course) {
      colleges = colleges.filter(c => c.courses.includes(course));
    }

    return res.json({
      success: true,
      count: colleges.length,
      colleges
    });
  } catch (err) {
    console.error('Fetch colleges error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch colleges.' });
  }
});

// GET /api/colleges/:id - Single College Detail
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid college ID.' });
    }

    const row = db.prepare('SELECT * FROM colleges WHERE id = ?').get(id);
    if (!row) {
      return res.status(404).json({ success: false, message: 'College not found.' });
    }

    return res.json({
      success: true,
      college: formatCollege(row)
    });
  } catch (err) {
    console.error('Fetch college detail error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch college details.' });
  }
});

// POST /api/colleges - Create College (Admin)
router.post('/', verifyToken, requireRole('ADMIN'), (req, res) => {
  try {
    const {
      name,
      city,
      state = 'India',
      rank = 100,
      fees = 2.5,
      placement = 6.0,
      cutoff = '75%',
      courses = ['CSE'],
      exam = 'JEE',
      type = 'Private',
      rating = 4.0,
      students = '10,000+',
      infrastructure = 'Good'
    } = req.body;

    if (!name || !city) {
      return res.status(400).json({ success: false, message: 'College name and city are required.' });
    }

    const courseString = Array.isArray(courses) ? JSON.stringify(courses) : JSON.stringify([courses]);

    const stmt = db.prepare(`
      INSERT INTO colleges (name, city, state, rank, fees, placement, cutoff, courses, exam, type, rating, students, infrastructure)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name.trim(),
      city.trim(),
      state.trim(),
      Number(rank),
      Number(fees),
      Number(placement),
      String(cutoff),
      courseString,
      exam,
      type,
      Number(rating),
      students,
      infrastructure
    );

    const newCollege = db.prepare('SELECT * FROM colleges WHERE id = ?').get(result.lastInsertRowid);

    // Log Activity
    const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    db.prepare('INSERT INTO activities (activity, admin_name, date, status) VALUES (?, ?, ?, ?)').run(
      `Added college: ${name}`,
      req.user.name || 'Administrator',
      dateStr,
      'Completed'
    );

    return res.status(201).json({
      success: true,
      message: 'College created successfully.',
      college: formatCollege(newCollege)
    });
  } catch (err) {
    console.error('Create college error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create college.' });
  }
});

// PUT /api/colleges/:id - Update College (Admin)
router.put('/:id', verifyToken, requireRole('ADMIN'), (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = db.prepare('SELECT * FROM colleges WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'College not found.' });
    }

    const {
      name = existing.name,
      city = existing.city,
      state = existing.state,
      rank = existing.rank,
      fees = existing.fees,
      placement = existing.placement,
      cutoff = existing.cutoff,
      courses = existing.courses,
      exam = existing.exam,
      type = existing.type,
      rating = existing.rating,
      students = existing.students,
      infrastructure = existing.infrastructure
    } = req.body;

    const courseString = Array.isArray(courses) ? JSON.stringify(courses) : typeof courses === 'string' && courses.startsWith('[') ? courses : JSON.stringify([courses]);

    db.prepare(`
      UPDATE colleges
      SET name = ?, city = ?, state = ?, rank = ?, fees = ?, placement = ?,
          cutoff = ?, courses = ?, exam = ?, type = ?, rating = ?, students = ?, infrastructure = ?
      WHERE id = ?
    `).run(
      name, city, state, Number(rank), Number(fees), Number(placement),
      String(cutoff), courseString, exam, type, Number(rating), students, infrastructure,
      id
    );

    const updated = db.prepare('SELECT * FROM colleges WHERE id = ?').get(id);

    // Log Activity
    const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    db.prepare('INSERT INTO activities (activity, admin_name, date, status) VALUES (?, ?, ?, ?)').run(
      `Updated data for ${name}`,
      req.user.name || 'Administrator',
      dateStr,
      'Completed'
    );

    return res.json({
      success: true,
      message: 'College updated successfully.',
      college: formatCollege(updated)
    });
  } catch (err) {
    console.error('Update college error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update college.' });
  }
});

// DELETE /api/colleges/:id - Delete College (Admin)
router.delete('/:id', verifyToken, requireRole('ADMIN'), (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const college = db.prepare('SELECT * FROM colleges WHERE id = ?').get(id);
    if (!college) {
      return res.status(404).json({ success: false, message: 'College not found.' });
    }

    db.prepare('DELETE FROM colleges WHERE id = ?').run(id);

    // Log Activity
    const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    db.prepare('INSERT INTO activities (activity, admin_name, date, status) VALUES (?, ?, ?, ?)').run(
      `Deleted college: ${college.name}`,
      req.user.name || 'Administrator',
      dateStr,
      'Completed'
    );

    return res.json({
      success: true,
      message: `College "${college.name}" deleted successfully.`
    });
  } catch (err) {
    console.error('Delete college error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete college.' });
  }
});

module.exports = router;
