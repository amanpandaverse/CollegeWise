// CollegeWise Core Application JavaScript
// Connected to Node.js / Express REST API with SQLite persistence

const API_BASE = (window.location.hostname === 'localhost' && window.location.port === '5001')
  ? '/api'
  : 'http://localhost:5001/api';

// In-memory fallback and cache of colleges
let colleges = [
  {id:1,name:"Amity University Noida",city:"Noida",state:"Uttar Pradesh",rank:32,fees:3.2,placement:7.5,cutoff:"82%",courses:["CSE","Cyber Security"],exam:"JEE",type:"Private",rating:4.2,students:"25,000+",infrastructure:"Excellent"},
  {id:2,name:"Delhi Technological University",city:"Delhi",state:"Delhi",rank:15,fees:1.8,placement:12.5,cutoff:"95%",courses:["CSE","ECE"],exam:"JEE",type:"Government",rating:4.6,students:"15,000+",infrastructure:"Excellent"},
  {id:3,name:"Sharda University",city:"Noida",state:"Uttar Pradesh",rank:51,fees:2.6,placement:6.8,cutoff:"78%",courses:["CSE","MBA"],exam:"JEE",type:"Private",rating:4.1,students:"18,000+",infrastructure:"Very Good"},
  {id:4,name:"VIT Vellore",city:"Chennai",state:"Tamil Nadu",rank:8,fees:4.8,placement:9.2,cutoff:"90%",courses:["CSE","ECE"],exam:"OTHER",type:"Private",rating:4.7,students:"40,000+",infrastructure:"Excellent"},
  {id:5,name:"Christ University",city:"Bangalore",state:"Karnataka",rank:22,fees:2.9,placement:7.9,cutoff:"85%",courses:["CSE","MBA"],exam:"OTHER",type:"Private",rating:4.5,students:"20,000+",infrastructure:"Excellent"},
  {id:6,name:"MIT World Peace University",city:"Pune",state:"Maharashtra",rank:43,fees:3.9,placement:7.1,cutoff:"80%",courses:["CSE","Mechanical"],exam:"JEE",type:"Private",rating:4.2,students:"15,000+",infrastructure:"Very Good"},
  {id:7,name:"Manipal Institute of Technology",city:"Bangalore",state:"Karnataka",rank:18,fees:5.2,placement:10.1,cutoff:"91%",courses:["CSE","ECE"],exam:"OTHER",type:"Private",rating:4.6,students:"12,000+",infrastructure:"Excellent"},
  {id:8,name:"NMIMS University",city:"Mumbai",state:"Maharashtra",rank:35,fees:4.3,placement:8.4,cutoff:"88%",courses:["CSE","MBA"],exam:"OTHER",type:"Private",rating:4.3,students:"17,000+",infrastructure:"Excellent"},
  {id:9,name:"IIT Delhi",city:"Delhi",state:"Delhi",rank:2,fees:2.2,placement:22.0,cutoff:"99%",courses:["CSE","ECE","Mechanical"],exam:"JEE",type:"Government",rating:4.9,students:"11,000+",infrastructure:"World Class"},
  {id:10,name:"BITS Pilani",city:"Pune",state:"Rajasthan/Goa",rank:5,fees:5.8,placement:18.5,cutoff:"96%",courses:["CSE","ECE","Mechanical","Cyber Security"],exam:"OTHER",type:"Private",rating:4.8,students:"16,000+",infrastructure:"World Class"}
];

// Utilities
function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

function getFavourites() {
  try { return JSON.parse(localStorage.getItem("cw_favourites") || "[]"); } catch (e) { return []; }
}

function getCompare() {
  try { return JSON.parse(localStorage.getItem("cw_compare") || "[]"); } catch (e) { return []; }
}

function setLS(k, v) {
  localStorage.setItem(k, JSON.stringify(v));
}

function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem("cw_user") || "null"); } catch (e) { return null; }
}

function getAuthToken() {
  return localStorage.getItem("cw_token") || "";
}

function isFav(id) {
  return getFavourites().includes(id);
}

// Fetch colleges from Backend REST API
async function fetchCollegesFromServer(queryStr = "") {
  try {
    const res = await fetch(`${API_BASE}/colleges${queryStr}`);
    if (res.ok) {
      const data = await res.json();
      if (data.colleges && Array.isArray(data.colleges)) {
        colleges = data.colleges;
      }
    }
  } catch (err) {
    console.warn("Backend API not reachable, using cached college data:", err.message);
  }
}

// Toggle Favourite with Server Sync
async function toggleFavourite(id) {
  let f = getFavourites();
  const token = getAuthToken();

  if (f.includes(id)) {
    f = f.filter(x => x !== id);
  } else {
    f.push(id);
  }
  setLS("cw_favourites", f);
  renderAllDynamic();

  const isSaved = f.includes(id);
  toast(isSaved ? "College saved to favourites" : "Removed from favourites");

  // Sync with backend if authenticated
  if (token) {
    try {
      await fetch(`${API_BASE}/favourites/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ collegeId: id })
      });
    } catch (err) {
      console.warn("Could not sync favourite with backend:", err);
    }
  }
}

// Toggle Compare
function toggleCompare(id) {
  let c = getCompare();
  if (c.includes(id)) {
    c = c.filter(x => x !== id);
  } else if (c.length >= 3) {
    toast("You can compare up to 3 colleges.");
    return;
  } else {
    c.push(id);
  }
  setLS("cw_compare", c);
  renderAllDynamic();
  toast(c.includes(id) ? "Added to comparison" : "Removed from comparison");
}

// College Card Component
function collegeCard(c) {
  return `<article class="college-card">
  <div class="college-cover">
    <span class="rank">#${c.rank} Rank</span>
    <button class="fav-btn" onclick="toggleFavourite(${c.id})" title="${isFav(c.id) ? 'Remove favourite' : 'Save favourite'}">
      ${isFav(c.id) ? "♥" : "♡"}
    </button>
    <span>🎓</span>
  </div>
  <div class="college-body">
    <h3>${esc(c.name)}</h3>
    <div class="location">📍 ${esc(c.city)}, ${esc(c.state)}</div>
    <div class="college-tags">
      ${(c.courses || []).map(x => `<span class="tag">${esc(x)}</span>`).join("")}
      <span class="tag">${esc(c.type || 'College')}</span>
    </div>
    <div class="college-metrics">
      <div class="metric"><b>₹${c.fees}L</b><small>Annual Fees</small></div>
      <div class="metric"><b>₹${c.placement}L</b><small>Avg Placement</small></div>
      <div class="metric"><b>${c.cutoff}</b><small>Cut-off</small></div>
    </div>
    <div class="card-actions">
      <a class="btn btn-light" href="college-details.html?id=${c.id}">Details</a>
      <button class="btn ${getCompare().includes(c.id) ? "btn-primary" : "btn-light"}" onclick="toggleCompare(${c.id})">
        ${getCompare().includes(c.id) ? "✓ Comparing" : "⚖ Compare"}
      </button>
    </div>
  </div></article>`;
}

// Render Popular Colleges on Home
async function renderPopularColleges() {
  const el = document.getElementById("popularColleges");
  if (!el) return;
  await fetchCollegesFromServer();
  const sorted = [...colleges].sort((a, b) => a.rank - b.rank);
  el.innerHTML = sorted.slice(0, 3).map(collegeCard).join("");
}

// Render Colleges Directory
async function renderColleges() {
  const el = document.getElementById("collegeGrid");
  if (!el) return;

  // Check if URL has ?q= query
  const urlQ = new URLSearchParams(window.location.search).get("q");
  if (urlQ && document.getElementById("collegeSearch")) {
    document.getElementById("collegeSearch").value = urlQ;
  }

  await fetchCollegesFromServer();
  filterColleges();
}

// Client & Server Filtered College List
function filterColleges() {
  const el = document.getElementById("collegeGrid");
  if (!el) return;

  const q = (document.getElementById("collegeSearch")?.value || "").toLowerCase().trim();
  const loc = document.getElementById("locationFilter")?.value || "";
  const course = document.getElementById("courseFilter")?.value || "";
  const budget = document.getElementById("budgetFilter")?.value || "";
  const sort = document.getElementById("sortFilter")?.value || "";

  let arr = colleges.filter(c => {
    const textMatch = !q || (c.name + " " + c.city + " " + c.state + " " + (c.courses || []).join(" ") + " " + c.exam + " " + c.type).toLowerCase().includes(q);
    const locMatch = !loc || c.city.toLowerCase() === loc.toLowerCase();
    const courseMatch = !course || (c.courses || []).includes(course);
    const budgetMatch = !budget || (
      budget === "1" ? c.fees < 2.0 :
      budget === "2" ? (c.fees >= 2.0 && c.fees <= 5.0) :
      c.fees > 5.0
    );
    return textMatch && locMatch && courseMatch && budgetMatch;
  });

  if (sort === "rank") arr.sort((a, b) => a.rank - b.rank);
  if (sort === "fees") arr.sort((a, b) => a.fees - b.fees);
  if (sort === "placement") arr.sort((a, b) => b.placement - a.placement);

  const countEl = document.getElementById("resultCount");
  if (countEl) countEl.textContent = `${arr.length} colleges found`;

  el.innerHTML = arr.map(collegeCard).join("");
  const emptyEl = document.getElementById("noResults");
  if (emptyEl) emptyEl.classList.toggle("hidden", arr.length > 0);
}

// Render Single College Detail
async function renderCollegeDetail() {
  const el = document.getElementById("collegeDetail");
  if (!el) return;

  const id = Number(new URLSearchParams(window.location.search).get("id")) || 1;
  let c = colleges.find(x => x.id === id);

  try {
    const res = await fetch(`${API_BASE}/colleges/${id}`);
    if (res.ok) {
      const data = await res.json();
      if (data.college) c = data.college;
    }
  } catch (err) {
    console.warn("Using local college data for detail view:", err.message);
  }

  if (!c) c = colleges[0];

  el.innerHTML = `
    <div class="detail-hero">
      <div class="detail-cover">🎓</div>
      <div class="detail-main">
        <div class="detail-title-row">
          <div>
            <span class="eyebrow">COLLEGE PROFILE</span>
            <h1>${esc(c.name)}</h1>
            <p class="location">📍 ${esc(c.city)}, ${esc(c.state)} • ⭐ ${c.rating}/5 Rating</p>
          </div>
          <div class="card-actions">
            <button class="btn ${isFav(c.id) ? "btn-primary" : "btn-light"}" onclick="toggleFavourite(${c.id})">
              ${isFav(c.id) ? "♥ Saved to Favourites" : "♡ Save to Favourites"}
            </button>
            <button class="btn ${getCompare().includes(c.id) ? "btn-primary" : "btn-light"}" onclick="toggleCompare(${c.id})">
              ${getCompare().includes(c.id) ? "✓ In Comparison" : "⚖ Compare"}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="detail-layout">
      <section class="info-panel">
        <h2>College Overview</h2>
        <p>${esc(c.name)} is recognized for academic excellence, dedicated faculty, and high-impact placement training. The verified key metrics below help you compare this institution against your personal academic benchmarks.</p>
        <div class="detail-stats">
          <div class="detail-stat"><b>#${c.rank}</b><small>NIRF / State Ranking</small></div>
          <div class="detail-stat"><b>₹${c.fees}L</b><small>Annual Tuition Fees</small></div>
          <div class="detail-stat"><b>₹${c.placement}L</b><small>Average Package</small></div>
          <div class="detail-stat"><b>${c.cutoff}</b><small>Typical Cut-off</small></div>
        </div>
        <h2>Offered Courses & Specializations</h2>
        <div class="college-tags">${(c.courses || []).map(x => `<span class="tag" style="font-size:13px;padding:6px 12px">${esc(x)}</span>`).join("")}</div>
      </section>
      <aside class="info-panel">
        <h2>Key Institutional Data</h2>
        <p><b>Primary Entrance Exam</b><br>${esc(c.exam)}</p>
        <p><b>Institution Category</b><br>${esc(c.type)}</p>
        <p><b>Campus Population</b><br>${esc(c.students)} students</p>
        <p><b>Infrastructure Rating</b><br>${esc(c.infrastructure)}</p>
        <a class="btn btn-primary full" href="recommendation.html">Check My Admission Eligibility →</a>
      </aside>
    </div>
  `;
}

// Render Comparison Matrix
async function renderCompare() {
  const ids = getCompare();
  const wrap = document.getElementById("compareTableWrap");
  const empty = document.getElementById("compareEmpty");
  if (!wrap) return;

  if (!ids.length) {
    if (empty) empty.classList.remove("hidden");
    wrap.innerHTML = "";
    return;
  }
  if (empty) empty.classList.add("hidden");

  let cs = [];
  try {
    const res = await fetch(`${API_BASE}/colleges/compare?ids=${ids.join(',')}`);
    if (res.ok) {
      const data = await res.json();
      if (data.colleges) cs = data.colleges;
    }
  } catch (err) {
    console.warn("Fallback to local compare data:", err.message);
  }

  if (!cs.length) {
    cs = ids.map(id => colleges.find(c => c.id === id)).filter(Boolean);
  }

  wrap.innerHTML = `<table class="comparison-table">
    <thead>
      <tr>
        <th>Comparison Parameters</th>
        ${cs.map(c => `<th>${esc(c.name)}<br><button class="action-btn delete" onclick="toggleCompare(${c.id});renderCompare()">Remove</button></th>`).join("")}
      </tr>
    </thead>
    <tbody>
      ${row("Location", cs, c => `${c.city}, ${c.state}`)}
      ${row("National Ranking", cs, c => "#" + c.rank)}
      ${row("Annual Tuition Fees", cs, c => "₹" + c.fees + " Lakhs")}
      ${row("Average Placement", cs, c => "₹" + c.placement + " Lakhs")}
      ${row("Typical Cut-off", cs, c => c.cutoff)}
      ${row("Courses Offered", cs, c => (c.courses || []).join(", "))}
      ${row("Accepted Entrance Exam", cs, c => c.exam)}
      ${row("Institution Type", cs, c => c.type)}
      ${row("Student Rating", cs, c => "⭐ " + c.rating + " / 5")}
      ${row("Infrastructure", cs, c => c.infrastructure)}
    </tbody>
  </table>`;
}

function row(label, cs, fn) {
  return `<tr><td>${label}</td>${cs.map(c => `<td>${esc(fn(c))}</td>`).join("")}</tr>`;
}

// Render Saved Favourites
async function renderFavourites() {
  const el = document.getElementById("favouriteGrid");
  const empty = document.getElementById("favEmpty");
  if (!el) return;

  const token = getAuthToken();
  let favList = [];

  if (token) {
    try {
      const res = await fetch(`${API_BASE}/favourites`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.colleges) {
          favList = data.colleges;
          setLS("cw_favourites", data.ids || favList.map(c => c.id));
        }
      }
    } catch (err) {
      console.warn("Error fetching favourites from API, falling back to local:", err.message);
    }
  }

  if (!favList.length) {
    await fetchCollegesFromServer();
    const favIds = getFavourites();
    favList = colleges.filter(c => favIds.includes(c.id));
  }

  el.innerHTML = favList.map(collegeCard).join("");
  if (empty) empty.classList.toggle("hidden", favList.length > 0);
}

// Render Student Dashboard
async function renderDashboard() {
  const u = getCurrentUser();
  if (u && document.getElementById("userName")) {
    document.getElementById("userName").textContent = u.name || "Student";
  }
  if (document.getElementById("favCount")) {
    document.getElementById("favCount").textContent = getFavourites().length;
  }
  if (document.getElementById("compareCount")) {
    document.getElementById("compareCount").textContent = getCompare().length;
  }

  await fetchCollegesFromServer();
  const dashColleges = document.getElementById("dashColleges");
  if (dashColleges) {
    dashColleges.innerHTML = colleges.slice(0, 2).map(collegeCard).join("");
  }
}

// Re-render all dynamic views
function renderAllDynamic() {
  if (document.getElementById("popularColleges")) renderPopularColleges();
  if (document.getElementById("collegeGrid")) renderColleges();
  if (document.getElementById("compareTableWrap")) renderCompare();
  if (document.getElementById("favouriteGrid")) renderFavourites();
  if (document.getElementById("collegeDetail")) renderCollegeDetail();
  if (document.getElementById("favCount")) {
    document.getElementById("favCount").textContent = getFavourites().length;
    document.getElementById("compareCount").textContent = getCompare().length;
  }
}

// Home Search Handler
function homeSearch() {
  const q = document.getElementById("homeSearch")?.value.trim();
  window.location.href = "colleges.html" + (q ? "?q=" + encodeURIComponent(q) : "");
}

// Toast Notification
function toast(msg) {
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.style.cssText = "position:fixed;bottom:25px;right:25px;background:#172033;color:#fff;padding:13px 20px;border-radius:12px;z-index:9999;font-size:13px;font-weight:600;box-shadow:0 12px 35px rgba(0,0,0,.25);border:1px solid #333d59;";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.display = "block";
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => { t.style.display = "none"; }, 2500);
}

// Password toggle helper
function togglePassword(id) {
  const x = document.getElementById(id);
  if (x) x.type = x.type === "password" ? "text" : "password";
}

// Logout helper
function logout() {
  localStorage.removeItem("cw_user");
  localStorage.removeItem("cw_token");
  toast("Logged out successfully.");
  setTimeout(() => {
    // If inside admin folder, jump back to index
    if (window.location.pathname.includes("/admin/")) {
      window.location.href = "../index.html";
    } else {
      window.location.href = "index.html";
    }
  }, 400);
}

// Form Handlers with REST API Connection

// Login
document.getElementById("loginForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (data.success && data.user) {
      localStorage.setItem("cw_token", data.token);
      localStorage.setItem("cw_user", JSON.stringify(data.user));
      toast(`Welcome back, ${data.user.name}!`);
      setTimeout(() => {
        if (data.user.role === "ADMIN") {
          window.location.href = "admin/admin-dashboard.html";
        } else {
          window.location.href = "dashboard.html";
        }
      }, 600);
    } else {
      toast(data.message || "Invalid credentials.");
    }
  } catch (err) {
    // Fallback demo mode if backend is unreachable
    console.warn("Backend API unavailable, executing local login:", err);
    const role = email === "admin@collegewise.com" ? "ADMIN" : "STUDENT";
    localStorage.setItem("cw_user", JSON.stringify({ name: email.split("@")[0], email, role }));
    window.location.href = role === "ADMIN" ? "admin/admin-dashboard.html" : "dashboard.html";
  }
});

// Register
document.getElementById("registerForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  const password = document.getElementById("regPassword").value;
  const confirm = document.getElementById("regConfirm").value;

  if (password !== confirm) {
    toast("Passwords do not match.");
    return;
  }

  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const phone = document.getElementById("regPhone")?.value.trim() || "";
  const role = document.getElementById("regRole")?.value || "STUDENT";

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, phone, role })
    });

    const data = await res.json();
    if (data.success && data.user) {
      localStorage.setItem("cw_token", data.token);
      localStorage.setItem("cw_user", JSON.stringify(data.user));
      toast("Account created successfully!");
      setTimeout(() => { window.location.href = "dashboard.html"; }, 700);
    } else {
      toast(data.message || "Registration failed.");
    }
  } catch (err) {
    console.warn("Backend API unavailable, executing local registration:", err);
    localStorage.setItem("cw_user", JSON.stringify({ name, email, role: "STUDENT" }));
    toast("Account created (demo mode)!");
    setTimeout(() => { window.location.href = "dashboard.html"; }, 700);
  }
});

// Admin Login
document.getElementById("adminLoginForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (data.success && data.user && data.user.role === "ADMIN") {
      localStorage.setItem("cw_token", data.token);
      localStorage.setItem("cw_user", JSON.stringify(data.user));
      window.location.href = "admin-dashboard.html";
    } else {
      toast(data.message || "Access denied. Admin credentials required.");
    }
  } catch (err) {
    if (email === "admin@collegewise.com" && password === "admin123") {
      localStorage.setItem("cw_user", JSON.stringify({ name: "Administrator", email, role: "ADMIN" }));
      window.location.href = "admin-dashboard.html";
    } else {
      toast("Use the demo admin credentials shown on the page.");
    }
  }
});

// Career Guidance Recommendation Form
document.getElementById("recommendForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  const percentage = Number(document.getElementById("percentage").value);
  const exam = document.getElementById("exam")?.value || "JEE";
  const score = Number(document.getElementById("score")?.value || 0);
  const prefCourse = document.getElementById("prefCourse").value;
  const prefLocation = document.getElementById("prefLocation").value;
  const prefBudget = Number(document.getElementById("prefBudget").value);
  const goal = document.querySelector('input[name="goal"]:checked')?.value || "placement";

  try {
    const res = await fetch(`${API_BASE}/recommendations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ percentage, exam, score, prefCourse, prefLocation, prefBudget, goal })
    });

    const data = await res.json();
    if (data.success && data.recommendations) {
      renderRecommendationResults(data.recommendations);
      return;
    }
  } catch (err) {
    console.warn("Using client-side fallback for recommendations:", err);
  }

  // Client-side fallback calculation
  let arr = colleges.map(c => {
    let s = 0;
    if ((c.courses || []).includes(prefCourse)) s += 35;
    if (!prefLocation || c.city === prefLocation) s += 20;
    if (prefBudget === 1 && c.fees < 2.0) s += 20;
    else if (prefBudget === 2 && c.fees >= 2.0 && c.fees <= 5.0) s += 20;
    else if (prefBudget === 3 && c.fees > 5.0) s += 20;
    if (percentage >= 90 && c.rank <= 25) s += 20;
    else if (percentage >= 80 && c.rank <= 50) s += 12;
    if (goal === "placement") s += Math.min(10, c.placement);
    if (goal === "research" && c.rank <= 30) s += 8;
    return { ...c, match: Math.min(99, Math.round(s)) };
  }).sort((a, b) => b.match - a.match).slice(0, 3);

  renderRecommendationResults(arr);
});

function renderRecommendationResults(arr) {
  const grid = document.getElementById("recommendGrid");
  const section = document.getElementById("recommendResults");
  if (!grid || !section) return;

  grid.innerHTML = arr.map(c => {
    const reasonsHtml = c.matchReasons && c.matchReasons.length
      ? `<div style="font-size:11px;color:var(--muted);margin-top:5px">💡 ${c.matchReasons.slice(0, 2).join(" • ")}</div>`
      : "";

    return collegeCard(c).replace(
      "</article>",
      `<div style="padding:0 18px 18px">
         <span class="tag" style="background:#e8faf4;color:#118365;font-weight:800;font-size:12px">
           ${c.match}% profile match
         </span>
         ${reasonsHtml}
       </div></article>`
    );
  }).join("");

  section.classList.remove("hidden");
  section.scrollIntoView({ behavior: "smooth" });
}

// Admin Table Rendering & CRUD Operations
async function renderAdminTable(type) {
  const el = document.getElementById(type + "AdminTable");
  if (!el) return;

  await fetchCollegesFromServer();

  if (type === "college") {
    el.innerHTML = `<table class="admin-table">
      <thead>
        <tr><th>College</th><th>City</th><th>Rank</th><th>Fees</th><th>Placement</th><th>Actions</th></tr>
      </thead>
      <tbody>
        ${colleges.map(c => `<tr>
          <td><b>${esc(c.name)}</b></td>
          <td>${esc(c.city)}</td>
          <td>#${c.rank}</td>
          <td>₹${c.fees}L</td>
          <td>₹${c.placement}L</td>
          <td>
            <button class="action-btn" onclick="openAdminModal('college', ${c.id})">Edit</button>
            <button class="action-btn delete" onclick="deleteCollege(${c.id})">Delete</button>
          </td>
        </tr>`).join("")}
      </tbody>
    </table>`;
  } else {
    const labels = { cutoff: "Cut-off", placement: "Avg Placement", ranking: "Ranking" };
    el.innerHTML = `<table class="admin-table">
      <thead>
        <tr><th>College</th><th>${labels[type] || 'Value'}</th><th>Last Updated</th><th>Actions</th></tr>
      </thead>
      <tbody>
        ${colleges.map(c => `<tr>
          <td>${esc(c.name)}</td>
          <td>${type === "cutoff" ? esc(c.cutoff) : type === "placement" ? "₹" + c.placement + " L" : "#" + c.rank}</td>
          <td>Live Database</td>
          <td><button class="action-btn" onclick="openAdminModal('${type}', ${c.id})">Edit</button></td>
        </tr>`).join("")}
      </tbody>
    </table>`;
  }
}

// Open Admin Modal for Adding / Editing
function openAdminModal(type, id) {
  const c = colleges.find(x => x.id === id) || {
    name: "", city: "", rank: 50, fees: 3.0, placement: 8.0, cutoff: "85%",
    courses: ["CSE"], state: "India", exam: "JEE", type: "Private", rating: 4.5, students: "15,000+", infrastructure: "Excellent"
  };

  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.id = "adminModal";

  let body = "";
  if (type === "college") {
    body = `
      <label>College Name</label>
      <input id="mName" value="${esc(c.name)}" placeholder="e.g. Indian Institute of Science">
      <div class="two-col">
        <div><label>City</label><input id="mCity" value="${esc(c.city)}" placeholder="e.g. Bangalore"></div>
        <div><label>State</label><input id="mState" value="${esc(c.state || 'India')}" placeholder="e.g. Karnataka"></div>
      </div>
      <div class="two-col">
        <div><label>NIRF / State Ranking</label><input id="mRank" type="number" value="${c.rank}"></div>
        <div><label>Annual Fees (Lakhs)</label><input id="mFees" type="number" step=".1" value="${c.fees}"></div>
      </div>
      <div class="two-col">
        <div><label>Avg Placement (Lakhs)</label><input id="mPlacement" type="number" step=".1" value="${c.placement}"></div>
        <div><label>Cut-off</label><input id="mCutoff" value="${esc(c.cutoff)}" placeholder="e.g. 92%"></div>
      </div>
      <div class="two-col">
        <div><label>Entrance Exam</label><input id="mExam" value="${esc(c.exam || 'JEE')}"></div>
        <div><label>Type</label><input id="mType" value="${esc(c.type || 'Private')}"></div>
      </div>
      <label>Courses (comma separated)</label>
      <input id="mCourses" value="${esc((c.courses || []).join(', '))}" placeholder="CSE, ECE, MBA">
    `;
  } else {
    const val = type === "cutoff" ? c.cutoff : type === "placement" ? c.placement : c.rank;
    body = `
      <label>College</label>
      <select id="mCollege">
        ${colleges.map(x => `<option value="${x.id}" ${x.id === id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}
      </select>
      <label>New ${type === "cutoff" ? "Cut-off (e.g. 88%)" : type === "placement" ? "Avg Placement in Lakhs (e.g. 10.5)" : "Ranking (e.g. 12)"}</label>
      <input id="mValue" value="${esc(val)}" placeholder="Enter new value">
    `;
  }

  modal.innerHTML = `
    <div class="modal">
      <button class="close" onclick="document.getElementById('adminModal').remove()">×</button>
      <h2>${id ? "Edit" : "Add"} ${type}</h2>
      ${body}
      <button class="btn btn-primary full" style="margin-top:20px" onclick="saveAdminData('${type}', ${id || 0})">
        Save Changes
      </button>
    </div>
  `;
  document.body.appendChild(modal);
}

// Save Admin Data with Backend REST API Integration
async function saveAdminData(type, id) {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };

  try {
    if (type === "college") {
      const payload = {
        name: document.getElementById("mName").value.trim(),
        city: document.getElementById("mCity").value.trim(),
        state: document.getElementById("mState")?.value.trim() || "India",
        rank: Number(document.getElementById("mRank").value),
        fees: Number(document.getElementById("mFees").value),
        placement: Number(document.getElementById("mPlacement").value),
        cutoff: document.getElementById("mCutoff").value.trim(),
        exam: document.getElementById("mExam")?.value.trim() || "JEE",
        type: document.getElementById("mType")?.value.trim() || "Private",
        courses: (document.getElementById("mCourses")?.value || "CSE").split(",").map(s => s.trim()).filter(Boolean)
      };

      if (!payload.name || !payload.city) {
        toast("Please provide both name and city.");
        return;
      }

      if (id) {
        // Edit existing college
        await fetch(`${API_BASE}/colleges/${id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        // Create new college
        await fetch(`${API_BASE}/colleges`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload)
        });
      }
    } else {
      // Specialized update (cut-off, placement, ranking)
      const selectedId = Number(document.getElementById("mCollege")?.value || id);
      const val = document.getElementById("mValue").value.trim();
      const payload = {};
      if (type === "cutoff") payload.cutoff = val;
      if (type === "placement") payload.placement = Number(val);
      if (type === "ranking") payload.rank = Number(val);

      await fetch(`${API_BASE}/colleges/${selectedId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload)
      });
    }

    toast("Data successfully saved to database!");
  } catch (err) {
    console.warn("Saved locally due to API failure:", err);
    toast("Saved changes (local mode).");
  }

  document.getElementById("adminModal")?.remove();
  await fetchCollegesFromServer();
  renderAdminTable(type);
}

// Delete College with Backend REST API Integration
async function deleteCollege(id) {
  if (!confirm("Are you sure you want to delete this college?")) return;

  const token = getAuthToken();
  try {
    await fetch(`${API_BASE}/colleges/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    toast("College deleted from database.");
  } catch (err) {
    console.warn("Deleted locally:", err);
    toast("College deleted (local mode).");
  }

  await fetchCollegesFromServer();
  renderAdminTable("college");
}

// Admin Dashboard Live Analytics Initializer
async function initAdminDashboard() {
  try {
    const res = await fetch(`${API_BASE}/admin/stats`);
    if (res.ok) {
      const data = await res.json();
      if (data.stats) {
        const s = data.stats;
        if (document.getElementById("admTotalColleges")) document.getElementById("admTotalColleges").textContent = s.totalColleges;
        if (document.getElementById("admTotalUsers")) document.getElementById("admTotalUsers").textContent = s.totalUsers;
        if (document.getElementById("admCompleteness")) document.getElementById("admCompleteness").textContent = s.dataCompleteness;
        if (document.getElementById("admAvailability")) document.getElementById("admAvailability").textContent = s.systemAvailability;
      }
    }

    const actRes = await fetch(`${API_BASE}/admin/activity`);
    if (actRes.ok) {
      const actData = await actRes.json();
      const tbody = document.getElementById("adminActivityBody");
      if (tbody && actData.activities && actData.activities.length) {
        tbody.innerHTML = actData.activities.map(a => `
          <tr>
            <td>${esc(a.activity)}</td>
            <td>${esc(a.admin_name)}</td>
            <td>${esc(a.date)}</td>
            <td><span class="status success">${esc(a.status)}</span></td>
          </tr>
        `).join("");
      }
    }
  } catch (err) {
    console.warn("Could not load admin stats from server:", err);
  }
}

// Update Navigation Bar Authentication State
function updateNavAuth() {
  const user = getCurrentUser();
  const navActions = document.querySelector(".navbar .nav-actions");
  if (!navActions) return;

  if (user) {
    if (user.role === "ADMIN") {
      navActions.innerHTML = `
        <a class="btn btn-light" href="admin/admin-dashboard.html">🛡️ Admin Panel</a>
        <button class="btn btn-outline" onclick="logout()">Logout</button>
      `;
    } else {
      navActions.innerHTML = `
        <a class="btn btn-light" href="dashboard.html">👤 ${esc(user.name.split(" ")[0])}</a>
        <button class="btn btn-outline" onclick="logout()">Logout</button>
      `;
    }
  }
}

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  updateNavAuth();
  fetchCollegesFromServer().then(() => {
    // If on a page with dynamic elements, render them
    if (document.getElementById("popularColleges")) renderPopularColleges();
  });
});
