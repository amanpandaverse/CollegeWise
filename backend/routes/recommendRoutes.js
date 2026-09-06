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
  return { ...row, courses };
}

// POST /api/recommendations
router.post('/', (req, res) => {
  try {
    const {
      percentage = 75,
      exam = 'JEE',
      score = 80,
      prefCourse = 'CSE',
      prefLocation = '',
      prefBudget = 2,
      goal = 'placement'
    } = req.body;

    const numPct = Number(percentage) || 75;
    const numBudget = Number(prefBudget) || 2;
    const numScore = Number(score) || 0;

    const rows = db.prepare('SELECT * FROM colleges').all();
    const colleges = rows.map(formatCollege);

    const scored = colleges.map(c => {
      let scorePoints = 0;
      const reasons = [];

      // 1. Course alignment (Weight: 35)
      if (c.courses.includes(prefCourse)) {
        scorePoints += 35;
        reasons.push(`Offers ${prefCourse}`);
      } else {
        scorePoints += 5;
      }

      // 2. Location preference (Weight: 20)
      if (!prefLocation || c.city.toLowerCase() === prefLocation.toLowerCase()) {
        scorePoints += 20;
        if (prefLocation) reasons.push(`Located in ${c.city}`);
      }

      // 3. Budget suitability (Weight: 20)
      if (numBudget === 1 && c.fees < 2.0) {
        scorePoints += 20;
        reasons.push('Fits Under ₹2 Lakh annual budget');
      } else if (numBudget === 2 && c.fees >= 2.0 && c.fees <= 5.0) {
        scorePoints += 20;
        reasons.push('Fits ₹2–5 Lakh annual budget');
      } else if (numBudget === 3 && c.fees > 5.0) {
        scorePoints += 20;
        reasons.push('Matches premium institution budget');
      } else {
        scorePoints += 8; // Partial compatibility
      }

      // 4. Academic performance / Cut-off compatibility (Weight: 20)
      if (numPct >= 90 && c.rank <= 25) {
        scorePoints += 20;
        reasons.push('Matches high academic bracket (Top 25 rank)');
      } else if (numPct >= 80 && c.rank <= 50) {
        scorePoints += 15;
        reasons.push('Good academic cut-off match');
      } else if (numPct >= 70 && c.rank <= 70) {
        scorePoints += 12;
      } else {
        scorePoints += 7;
      }

      // 5. Entrance exam match (Weight: 10)
      if (exam && (c.exam === exam || c.exam === 'OTHER')) {
        scorePoints += 10;
        reasons.push(`Accepts ${exam} score`);
      }

      // 6. Career Goal affinity (Weight: 15)
      if (goal === 'placement') {
        const placementBonus = Math.min(15, Math.round(c.placement));
        scorePoints += placementBonus;
        if (c.placement >= 8) reasons.push(`High average placement (₹${c.placement}L)`);
      } else if (goal === 'research') {
        if (c.rank <= 30) {
          scorePoints += 15;
          reasons.push('Strong national research rank');
        } else {
          scorePoints += 6;
        }
      } else if (goal === 'startup') {
        const hubs = ['Bangalore', 'Delhi', 'Pune', 'Mumbai'];
        if (hubs.includes(c.city)) {
          scorePoints += 15;
          reasons.push(`Vibrant startup hub (${c.city})`);
        } else {
          scorePoints += 8;
        }
      }

      // Normalize score between 40% and 99%
      const matchPercentage = Math.min(99, Math.max(45, Math.round(scorePoints)));

      return {
        ...c,
        match: matchPercentage,
        matchReasons: reasons
      };
    });

    // Sort descending by match score
    scored.sort((a, b) => b.match - a.match);

    return res.json({
      success: true,
      count: scored.length,
      recommendations: scored.slice(0, 6)
    });
  } catch (err) {
    console.error('Recommendation error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate recommendations.' });
  }
});

module.exports = router;
