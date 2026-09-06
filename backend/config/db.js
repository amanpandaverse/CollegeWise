const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'collegewise.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'STUDENT',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS colleges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    rank INTEGER NOT NULL,
    fees REAL NOT NULL,
    placement REAL NOT NULL,
    cutoff TEXT NOT NULL,
    courses TEXT NOT NULL,
    exam TEXT NOT NULL,
    type TEXT NOT NULL,
    rating REAL NOT NULL,
    students TEXT NOT NULL,
    infrastructure TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS favourites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    college_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, college_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity TEXT NOT NULL,
    admin_name TEXT NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Completed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed Default Data
function seedDatabase() {
  // Check and seed Users
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const salt = bcrypt.genSaltSync(10);
    const adminHash = bcrypt.hashSync('admin123', salt);
    const studentHash = bcrypt.hashSync('student123', salt);

    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password_hash, phone, role)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertUser.run('Administrator', 'admin@collegewise.com', adminHash, '9999999999', 'ADMIN');
    insertUser.run('Demo Student', 'student@collegewise.com', studentHash, '9876543210', 'STUDENT');
    console.log('Seeded default admin and student accounts.');
  }

  // Check and seed Colleges
  const collegeCount = db.prepare('SELECT COUNT(*) as count FROM colleges').get().count;
  if (collegeCount === 0) {
    const insertCollege = db.prepare(`
      INSERT INTO colleges (name, city, state, rank, fees, placement, cutoff, courses, exam, type, rating, students, infrastructure)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const initialColleges = [
      {
        name: "Amity University Noida",
        city: "Noida",
        state: "Uttar Pradesh",
        rank: 32,
        fees: 3.2,
        placement: 7.5,
        cutoff: "82%",
        courses: JSON.stringify(["CSE", "Cyber Security"]),
        exam: "JEE",
        type: "Private",
        rating: 4.2,
        students: "25,000+",
        infrastructure: "Excellent"
      },
      {
        name: "Delhi Technological University",
        city: "Delhi",
        state: "Delhi",
        rank: 15,
        fees: 1.8,
        placement: 12.5,
        cutoff: "95%",
        courses: JSON.stringify(["CSE", "ECE"]),
        exam: "JEE",
        type: "Government",
        rating: 4.6,
        students: "15,000+",
        infrastructure: "Excellent"
      },
      {
        name: "Sharda University",
        city: "Noida",
        state: "Uttar Pradesh",
        rank: 51,
        fees: 2.6,
        placement: 6.8,
        cutoff: "78%",
        courses: JSON.stringify(["CSE", "MBA"]),
        exam: "JEE",
        type: "Private",
        rating: 4.1,
        students: "18,000+",
        infrastructure: "Very Good"
      },
      {
        name: "VIT Vellore",
        city: "Chennai",
        state: "Tamil Nadu",
        rank: 8,
        fees: 4.8,
        placement: 9.2,
        cutoff: "90%",
        courses: JSON.stringify(["CSE", "ECE"]),
        exam: "OTHER",
        type: "Private",
        rating: 4.7,
        students: "40,000+",
        infrastructure: "Excellent"
      },
      {
        name: "Christ University",
        city: "Bangalore",
        state: "Karnataka",
        rank: 22,
        fees: 2.9,
        placement: 7.9,
        cutoff: "85%",
        courses: JSON.stringify(["CSE", "MBA"]),
        exam: "OTHER",
        type: "Private",
        rating: 4.5,
        students: "20,000+",
        infrastructure: "Excellent"
      },
      {
        name: "MIT World Peace University",
        city: "Pune",
        state: "Maharashtra",
        rank: 43,
        fees: 3.9,
        placement: 7.1,
        cutoff: "80%",
        courses: JSON.stringify(["CSE", "Mechanical"]),
        exam: "JEE",
        type: "Private",
        rating: 4.2,
        students: "15,000+",
        infrastructure: "Very Good"
      },
      {
        name: "Manipal Institute of Technology",
        city: "Bangalore",
        state: "Karnataka",
        rank: 18,
        fees: 5.2,
        placement: 10.1,
        cutoff: "91%",
        courses: JSON.stringify(["CSE", "ECE"]),
        exam: "OTHER",
        type: "Private",
        rating: 4.6,
        students: "12,000+",
        infrastructure: "Excellent"
      },
      {
        name: "NMIMS University",
        city: "Mumbai",
        state: "Maharashtra",
        rank: 35,
        fees: 4.3,
        placement: 8.4,
        cutoff: "88%",
        courses: JSON.stringify(["CSE", "MBA"]),
        exam: "OTHER",
        type: "Private",
        rating: 4.3,
        students: "17,000+",
        infrastructure: "Excellent"
      },
      {
        name: "IIT Delhi",
        city: "Delhi",
        state: "Delhi",
        rank: 2,
        fees: 2.2,
        placement: 22.0,
        cutoff: "99%",
        courses: JSON.stringify(["CSE", "ECE", "Mechanical"]),
        exam: "JEE",
        type: "Government",
        rating: 4.9,
        students: "11,000+",
        infrastructure: "World Class"
      },
      {
        name: "BITS Pilani",
        city: "Pune",
        state: "Rajasthan/Goa",
        rank: 5,
        fees: 5.8,
        placement: 18.5,
        cutoff: "96%",
        courses: JSON.stringify(["CSE", "ECE", "Mechanical", "Cyber Security"]),
        exam: "OTHER",
        type: "Private",
        rating: 4.8,
        students: "16,000+",
        infrastructure: "World Class"
      }
    ];

    for (const c of initialColleges) {
      insertCollege.run(
        c.name, c.city, c.state, c.rank, c.fees, c.placement,
        c.cutoff, c.courses, c.exam, c.type, c.rating, c.students, c.infrastructure
      );
    }
    console.log(`Seeded ${initialColleges.length} colleges.`);
  }

  // Check and seed Activities
  const activityCount = db.prepare('SELECT COUNT(*) as count FROM activities').get().count;
  if (activityCount === 0) {
    const insertActivity = db.prepare(`
      INSERT INTO activities (activity, admin_name, date, status)
      VALUES (?, ?, ?, ?)
    `);

    insertActivity.run("Updated college placement data", "Administrator", "12 Aug 2026", "Completed");
    insertActivity.run("Added new college records", "Administrator", "11 Aug 2026", "Completed");
    insertActivity.run("Synchronized cut-off percentiles", "Administrator", "10 Aug 2026", "Completed");
  }
}

seedDatabase();

module.exports = db;
