const express = require("express");
const axios = require("axios");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
require("dotenv").config();
const cors = require("cors");
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);
const twilio = require("twilio");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

console.log("ALVRYN SERVER STARTED");

// ══════════════════════════════════════════════════════════════
//  ANALYTICS EVENT LOGGER
// ══════════════════════════════════════════════════════════════
async function logEvent(eventType, details = "", source = "web", userId = null) {
  try {
    await pool.query(
      `INSERT INTO events (event_type, details, source, user_id) VALUES ($1,$2,$3,$4)`,
      [eventType, String(details).slice(0, 500), source, userId]
    );
  } catch (e) {
    // Silently fail — never block a request for analytics
  }
}

// Create events table if needed
async function ensureEventsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      event_type VARCHAR(60) NOT NULL,
      details TEXT,
      source VARCHAR(30) DEFAULT 'web',
      user_id INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}
ensureEventsTable().catch(console.error);

// ══════════════════════════════════════════════════════════════
//  COMPREHENSIVE FUZZY CITY PARSER
// ══════════════════════════════════════════════════════════════
const CITY_MAP = {
  "bangalore":"bangalore","bengaluru":"bangalore","bengalore":"bangalore","bangaluru":"bangalore",
  "blr":"bangalore","bang":"bangalore","banglore":"bangalore","bangalor":"bangalore","blore":"bangalore",
  "mumbai":"mumbai","bombay":"mumbai","bom":"mumbai","mum":"mumbai","mumbi":"mumbai","mumbay":"mumbai",
  "delhi":"delhi","new delhi":"delhi","del":"delhi","dilli":"delhi","nai dilli":"delhi","dilhi":"delhi",
  "chennai":"chennai","madras":"chennai","maa":"chennai","chenai":"chennai","chinnai":"chennai",
  "hyderabad":"hyderabad","hyd":"hyderabad","hydrabad":"hyderabad","secunderabad":"hyderabad",
  "kolkata":"kolkata","calcutta":"kolkata","ccu":"kolkata","kolkatta":"kolkata","city of joy":"kolkata",
  "goa":"goa","goi":"goa","north goa":"goa","south goa":"goa","panaji":"goa",
  "pune":"pune","pnq":"pune","poona":"pune","puna":"pune",
  "kochi":"kochi","cochin":"kochi","cok":"kochi","ernakulam":"kochi",
  "ahmedabad":"ahmedabad","amd":"ahmedabad","ahemdabad":"ahmedabad",
  "jaipur":"jaipur","jai":"jaipur","pink city":"jaipur",
  "lucknow":"lucknow","lko":"lucknow","lakhnau":"lucknow",
  "varanasi":"varanasi","vns":"varanasi","banaras":"varanasi","kashi":"varanasi",
  "patna":"patna","chandigarh":"chandigarh","ixc":"chandigarh",
  "guwahati":"guwahati","gauhati":"guwahati","gau":"guwahati",
  "bhubaneswar":"bhubaneswar","bbi":"bhubaneswar","bbsr":"bhubaneswar",
  "coimbatore":"coimbatore","cbe":"coimbatore","kovai":"coimbatore",
  "madurai":"madurai","mdu":"madurai","temple city":"madurai",
  "mangalore":"mangalore","mangaluru":"mangalore","ixe":"mangalore",
  "mysore":"mysore","mysuru":"mysore","city of palaces":"mysore",
  "surat":"surat","haridwar":"haridwar","jodhpur":"jodhpur","udaipur":"udaipur",
  "amritsar":"amritsar","atq":"amritsar","agra":"agra","taj mahal city":"agra",
  "indore":"indore","raipur":"raipur","nashik":"nashik","nagpur":"nagpur",
  "shimla":"shimla","dehradun":"dehradun","siliguri":"siliguri",
  "trivandrum":"trivandrum","trivandram":"trivandrum","trivandaram":"trivandrum","trivendrum":"trivandrum","thiruvananthapuram":"trivandrum","tiruvananthapuram":"trivandrum","trv":"trivandrum","trvm":"trivandrum",
  "visakhapatnam":"visakhapatnam","vizag":"visakhapatnam","vtz":"visakhapatnam",
  "vijayawada":"vijayawada","vga":"vijayawada",
  "ranchi":"ranchi","bhopal":"bhopal","srinagar":"srinagar","jammu":"jammu",
  "hubli":"hubli","hubballi":"hubli","belgaum":"belgaum","belagavi":"belgaum",
  "tirupati":"tirupati","leh":"leh","ladakh":"leh","port blair":"port blair",
  // International
  "dubai":"dubai","dxb":"dubai","dubi":"dubai","dubay":"dubai",
  "singapore":"singapore","sin":"singapore","singapur":"singapore",
  "bangkok":"bangkok","bkk":"bangkok","bangkock":"bangkok",
  "london":"london","lhr":"london","landan":"london",
  "new york":"new york","jfk":"new york","nyc":"new york","newyork":"new york",
  "kuala lumpur":"kuala lumpur","kul":"kuala lumpur","kl":"kuala lumpur",
  "colombo":"colombo","cmb":"colombo","sri lanka":"colombo",
  "paris":"paris","cdg":"paris","tokyo":"tokyo","nrt":"tokyo",
  "sydney":"sydney","syd":"sydney","frankfurt":"frankfurt","fra":"frankfurt",
  "amsterdam":"amsterdam","ams":"amsterdam","toronto":"toronto","yyz":"toronto",
  "los angeles":"los angeles","lax":"los angeles",
  "hong kong":"hong kong","hkg":"hong kong",
  "doha":"doha","doh":"doha","abu dhabi":"abu dhabi","auh":"abu dhabi",
  "istanbul":"istanbul","ist":"istanbul","zurich":"zurich","zrh":"zurich",
  "rome":"rome","fco":"rome","barcelona":"barcelona","bcn":"barcelona",
  "milan":"milan","mxp":"milan","johannesburg":"johannesburg","jnb":"johannesburg",
  "nairobi":"nairobi","nbo":"nairobi","seoul":"seoul","icn":"seoul",
  "manila":"manila","mnl":"manila","jakarta":"jakarta","cgk":"jakarta",
  "bali":"bali","dps":"bali","kathmandu":"kathmandu","ktm":"kathmandu",
  "dhaka":"dhaka","dac":"dhaka","maldives":"male","male":"male",
  "cairo":"cairo","cai":"cairo","lagos":"lagos","los":"lagos",
  "phuket":"phuket","hkt":"phuket","auckland":"auckland","akl":"auckland",
  "melbourne":"melbourne","mel":"melbourne","brisbane":"brisbane","bne":"brisbane",
};

const CITY_TO_IATA = {
  "bangalore":"BLR","mumbai":"BOM","delhi":"DEL","chennai":"MAA","hyderabad":"HYD",
  "kolkata":"CCU","goa":"GOI","pune":"PNQ","kochi":"COK","ahmedabad":"AMD","jaipur":"JAI",
  "lucknow":"LKO","varanasi":"VNS","patna":"PAT","chandigarh":"IXC","guwahati":"GAU",
  "bhubaneswar":"BBI","coimbatore":"CBE","madurai":"IXM","mangalore":"IXE","mysore":"MYQ",
  "surat":"STV","haridwar":"DEL","jodhpur":"JDH","udaipur":"UDR","amritsar":"ATQ",
  "agra":"AGR","indore":"IDR","raipur":"RPR","shimla":"SLV","dehradun":"DED",
  "trivandrum":"TRV","visakhapatnam":"VTZ","vijayawada":"VGA","ranchi":"IXR",
  "bhopal":"BHO","srinagar":"SXR","jammu":"IXJ","hubli":"HBX","belgaum":"IXG",
  "tirupati":"TIR","leh":"IXL","port blair":"IXZ","nagpur":"NAG",
  "dubai":"DXB","singapore":"SIN","bangkok":"BKK","london":"LHR","new york":"JFK",
  "kuala lumpur":"KUL","colombo":"CMB","paris":"CDG","tokyo":"NRT","sydney":"SYD",
  "frankfurt":"FRA","amsterdam":"AMS","toronto":"YYZ","los angeles":"LAX",
  "hong kong":"HKG","doha":"DOH","abu dhabi":"AUH","istanbul":"IST",
  "zurich":"ZRH","rome":"FCO","barcelona":"BCN","milan":"MXP",
  "johannesburg":"JNB","nairobi":"NBO","seoul":"ICN","manila":"MNL",
  "jakarta":"CGK","bali":"DPS","kathmandu":"KTM","dhaka":"DAC",
  "maldives":"MLE","male":"MLE","phuket":"HKT","auckland":"AKL",
  "melbourne":"MEL","brisbane":"BNE","cairo":"CAI","lagos":"LOS",
};

function extractCities(text) {
  // Normalize misspellings + aliases before city extraction
  let normalized = text.toLowerCase();
  if (typeof CITY_NORM !== "undefined") {
    Object.entries(CITY_NORM).forEach(([k,v]) => {
      try { normalized = normalized.replace(new RegExp("\\b"+k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"\\b","g"), v); } catch {}
    });
  }
  const t = normalized
    .replace(/\b(flights?|buses?|bus|flight|flit|fligth|flght|book|hotels?|hotel|stay|rooms?|mujhe|muje|chahiye|please|kya|hai|se|ko|ka|ek|ticket|find|search|show|bata|dikha|looking|want|need|enakku|vendum|naaku|kavali)\b/gi, " ")
    .replace(/\s+/g, " ").trim();

  let found = [];
  const multiWord = Object.keys(CITY_MAP).filter(k => k.includes(" ")).sort((a,b) => b.length - a.length);
  let remaining = t;
  for (const key of multiWord) {
    if (remaining.includes(key) && found.length < 2) {
      found.push(CITY_MAP[key]);
      remaining = remaining.replace(key, " ");
    }
  }
  const words = remaining.split(/[\s,\-\/→➡]+/);
  for (const word of words) {
    const clean = word.replace(/[^a-z]/g, "");
    if (clean.length >= 2 && CITY_MAP[clean] && found.length < 2 && !found.includes(CITY_MAP[clean])) {
      found.push(CITY_MAP[clean]);
    }
  }
  // Fuzzy 3-char match
  if (found.length < 2) {
    for (const w of remaining.split(/\s+/)) {
      if (w.length < 3) continue;
      for (const key of Object.keys(CITY_MAP)) {
        if (key.length >= 3 && w.slice(0,3) === key.slice(0,3) && !found.includes(CITY_MAP[key])) {
          found.push(CITY_MAP[key]); if (found.length === 2) break;
        }
      }
      if (found.length === 2) break;
    }
  }
  return { from: found[0]||null, to: found[1]||null };
}

function extractDate(text) {
  const t = text.toLowerCase();
  const now = new Date();

  if (/yesterday|kal ka|bita hua/.test(t)) return { date: null, pastDate: true };

  const months = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11,
    january:0,february:1,march:2,april:3,june:5,july:6,august:7,september:8,october:9,november:10,december:11};
  for (const [mon, idx] of Object.entries(months)) {
    const m = t.match(new RegExp(`(\\d{1,2})\\s*${mon}|${mon}\\s*(\\d{1,2})`));
    if (m) {
      const day = parseInt(m[1]||m[2]);
      const d = new Date(now.getFullYear(), idx, day);
      if (d < now) d.setFullYear(d.getFullYear() + 1);
      return { date: d, pastDate: false };
    }
  }

  if (/today|aaj|indru|ee roju/.test(t))     return { date: new Date(now), pastDate: false };
  if (/day after tomorrow|parso/.test(t))     { const d=new Date(now); d.setDate(d.getDate()+2); return {date:d,pastDate:false}; }
  if (/tomorrow|kal|tmrw|tommorow|nale|repu/.test(t)) { const d=new Date(now); d.setDate(d.getDate()+1); return {date:d,pastDate:false}; }
  if (/this weekend|weekend/.test(t))         { const d=new Date(now); const diff=(6-now.getDay()+7)%7||7; d.setDate(now.getDate()+diff); return {date:d,pastDate:false}; }

  const dayMap = {sun:0,sunday:0,mon:1,monday:1,tue:2,tuesday:2,wed:3,wednesday:3,
    thu:4,thursday:4,fri:5,friday:5,sat:6,saturday:6,
    ravivar:0,somvar:1,mangalvar:2,budhvar:3,guruvar:4,shukravar:5,shanivar:6};
  for (const [day, idx] of Object.entries(dayMap)) {
    if (t.includes(day)) {
      const d = new Date(now);
      let diff = idx - now.getDay();
      if (/next|agla|agle/.test(t)) { if(diff<=0)diff+=7; if(diff<7)diff+=7; }
      else { if(diff<=0)diff+=7; }
      d.setDate(now.getDate()+diff);
      return { date: d, pastDate: false };
    }
  }
  const inDays = t.match(/in\s*(\d+)\s*(din|days?)/);
  if (inDays) { const d=new Date(now); d.setDate(now.getDate()+parseInt(inDays[1])); return {date:d,pastDate:false}; }

  return { date: null, pastDate: false };
}

function extractBudget(text) {
  const t = text.toLowerCase();
  const patterns = [/under\s*[₹rs.]*\s*(\d+)k?/,/below\s*[₹rs.]*\s*(\d+)k?/,/less\s*than\s*[₹rs.]*\s*(\d+)k?/,/max\s*[₹rs.]*\s*(\d+)k?/,/[₹rs.]*\s*(\d+)k?\s*(se\s*)?kam/];
  for (const p of patterns) {
    const m = t.match(p);
    if (m) { let v=parseInt(m[1]); if(t.match(/\d+k/))v*=1000; return v; }
  }
  return null;
}

const fmt = d => d.toISOString().split("T")[0];

// ══════════════════════════════════════════════════════════════
//  AUTH MIDDLEWARE
// ══════════════════════════════════════════════════════════════
function authenticateToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token required" });
  jwt.verify(token, process.env.JWT_SECRET || "secretkey", (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user; next();
  });
}

// ══════════════════════════════════════════════════════════════
//  ANALYTICS TRACKING ROUTE (called from frontend)
// ══════════════════════════════════════════════════════════════
app.post("/track", async (req, res) => {
  const { event_type, details, source } = req.body;
  const token = req.headers["authorization"]?.split(" ")[1];
  let userId = null;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
      userId = decoded.id;
    } catch {}
  }
  await logEvent(event_type, details, source || "web", userId);
  res.json({ ok: true });
});

app.get("/admin/events", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM events ORDER BY created_at DESC LIMIT 200");
    res.json(r.rows);
  } catch { res.json([]); }
});

// ══════════════════════════════════════════════════════════════
//  USERS
// ══════════════════════════════════════════════════════════════
app.get("/users", async (req, res) => {
  try { const r = await pool.query("SELECT id,name,email FROM users"); res.json(r.rows); }
  catch (e) { res.status(500).send("Server Error"); }
});

function generateUserRefCode(name) {
  const base = (name||"user").replace(/[^a-zA-Z0-9]/g,"").slice(0,6).toUpperCase();
  return base + Math.random().toString(36).slice(2,6).toUpperCase();
}

// ══════════════════════════════════════════════════════════════
//  REGISTER
// ══════════════════════════════════════════════════════════════
app.post("/register", async (req, res) => {
  try {
    const { name, email, password, ref } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const refCode = generateUserRefCode(name);
    let referredBy = null;
    if (ref) {
      const refCheck = await pool.query("SELECT id FROM users WHERE ref_code=$1", [ref]);
      if (refCheck.rows.length > 0) referredBy = ref;
    }
    await pool.query(
      "INSERT INTO users (name,email,password,ref_code,referred_by,wallet_balance) VALUES ($1,$2,$3,$4,$5,$6)",
      [name, email, hashed, refCode, referredBy, 0]
    );
    await logEvent("register", `New user: ${email}`, "web");
    try {
      await resend.emails.send({
        from: "Alvryn Travel <onboarding@resend.dev>",
        to: email,
        subject: "✈️ Welcome to Alvryn — Travel Beyond Boundaries",
        html: `<div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;background:#faf8f4;border-radius:16px;overflow:hidden;border:1px solid rgba(201,168,76,0.2);">
          <div style="background:linear-gradient(135deg,#c9a84c,#f0d080,#c9a84c);padding:28px 24px;text-align:center;">
            <h1 style="margin:0;font-size:24px;color:#1a1410;font-weight:900;letter-spacing:0.1em;">ALVRYN</h1>
            <p style="margin:4px 0 0;color:rgba(26,20,16,0.7);font-size:11px;letter-spacing:0.3em;">TRAVEL BEYOND BOUNDARIES</p>
          </div>
          <div style="padding:32px 24px;">
            <h2 style="color:#1a1410;margin-bottom:12px;">Welcome, ${name}! 🎉</h2>
            <p style="color:#555;line-height:1.7;margin-bottom:20px;">Your Alvryn account is ready. Search flights, buses, and hotels instantly with AI.</p>
            <div style="background:rgba(201,168,76,0.1);border-radius:12px;padding:16px;margin-bottom:20px;border:1px solid rgba(201,168,76,0.25);">
              <p style="margin:0;color:#8B6914;font-size:11px;letter-spacing:0.12em;margin-bottom:6px;">YOUR REFERRAL CODE</p>
              <p style="margin:0;font-size:22px;font-weight:900;color:#8B6914;letter-spacing:4px;">${refCode}</p>
              <p style="margin:6px 0 0;color:#888;font-size:12px;">Share with friends — earn ₹150 when they book above ₹5,000</p>
            </div>
            <a href="https://alvryn.in/search" style="display:inline-block;background:linear-gradient(135deg,#c9a84c,#f0d080);color:#1a1410;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;margin-top:4px;">Search Flights →</a>
          </div>
          <div style="padding:18px 24px;background:rgba(201,168,76,0.05);text-align:center;">
            <p style="margin:0;color:#aaa;font-size:12px;">© 2026 Alvryn · Built with ☕ in Bangalore · <a href="https://alvryn.in" style="color:#c9a84c;">alvryn.in</a></p>
            <p style="margin:6px 0 0;color:#bbb;font-size:11px;">Alvryn may earn a commission from partner links at no extra cost to you.</p>
          </div>
        </div>`
      });
    } catch(e) { console.error("Welcome email:", e.message); }
    res.json({ message: "Registered successfully", refCode });
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ message: "Email already registered" });
    res.status(500).json({ message: "Registration failed" });
  }
});

// ══════════════════════════════════════════════════════════════
//  LOGIN
// ══════════════════════════════════════════════════════════════
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    const user = result.rows[0];
    if (!user) return res.status(400).json({ message: "User not found" });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid password" });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "secretkey", { expiresIn: "30d" });
    await logEvent("login", `User ${email}`, "web", user.id);
    res.json({ token, user: { id:user.id, name:user.name, email:user.email, phone:user.phone, refCode:user.ref_code, walletBalance:user.wallet_balance||0 } });
  } catch (e) { res.status(500).json({ message: "Login failed" }); }
});

// ══════════════════════════════════════════════════════════════
//  PROFILE
// ══════════════════════════════════════════════════════════════
app.get("/profile", authenticateToken, async (req, res) => {
  try {
    const r = await pool.query("SELECT id,name,email,phone,ref_code,wallet_balance,referred_by FROM users WHERE id=$1", [req.user.id]);
    res.json(r.rows[0] || {});
  } catch { res.status(500).json({ message: "Server error" }); }
});

app.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    await pool.query("UPDATE users SET name=$1,email=$2,phone=$3 WHERE id=$4", [name, email, phone||null, req.user.id]);
    res.json({ message: "Profile updated" });
  } catch(e) {
    if (e.code === "23505") return res.status(409).json({ message: "Email already in use" });
    res.status(500).json({ message: "Update failed" });
  }
});

app.put("/profile/password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const r = await pool.query("SELECT password FROM users WHERE id=$1", [req.user.id]);
    const valid = await bcrypt.compare(currentPassword, r.rows[0].password);
    if (!valid) return res.status(401).json({ message: "Current password is incorrect" });
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password=$1 WHERE id=$2", [hashed, req.user.id]);
    res.json({ message: "Password updated" });
  } catch { res.status(500).json({ message: "Update failed" }); }
});

// ══════════════════════════════════════════════════════════════
//  FLIGHTS
// ══════════════════════════════════════════════════════════════
app.get("/flights", async (req, res) => {
  try {
    const { from, to, date } = req.query;
    let q = "SELECT * FROM flights WHERE 1=1", v = [], c = 1;
    if (from) { q += ` AND LOWER(from_city)=LOWER($${c++})`; v.push(from); }
    if (to)   { q += ` AND LOWER(to_city)=LOWER($${c++})`;   v.push(to);   }
    if (date) { q += ` AND DATE(departure_time)=$${c++}`;     v.push(date); }
    q += " ORDER BY price ASC";
    const r = await pool.query(q, v);
    // Log search event
    await logEvent("flight_search", `${from||"?"} → ${to||"?"} on ${date||"any"}`, "web");
    res.json(r.rows);
  } catch { res.status(500).send("Server Error"); }
});

// ══════════════════════════════════════════════════════════════
//  AI SEARCH
// ══════════════════════════════════════════════════════════════
app.post("/ai-search", async (req, res) => {
  try {
    const rawQuery = req.body.query || "";
    const { from, to } = extractCities(rawQuery);
    if (!from || !to) return res.status(400).json({ message: "Couldn't detect cities. Try: 'flights bangalore to mumbai tomorrow'" });

    const { date: targetDate, pastDate } = extractDate(rawQuery);
    if (pastDate) return res.status(400).json({ message: "That date is in the past! Please pick today or a future date." });

    const budget = extractBudget(rawQuery);
    const isCheap = /cheap|budget|lowest|sasta|kam price|affordable/i.test(rawQuery);

    let q = `SELECT * FROM flights WHERE LOWER(from_city)=$1 AND LOWER(to_city)=$2`;
    let v = [from, to];
    if (targetDate) { q += ` AND DATE(departure_time)=$3`; v.push(fmt(targetDate)); }
    if (budget)     { q += ` AND price <= $${v.length+1}`; v.push(budget); }
    q += isCheap ? " ORDER BY price ASC" : " ORDER BY departure_time ASC";

    let flights = (await pool.query(q, v)).rows;
    if (!flights.length && targetDate) {
      flights = (await pool.query(`SELECT * FROM flights WHERE LOWER(from_city)=$1 AND LOWER(to_city)=$2 AND departure_time > NOW() ORDER BY departure_time ASC LIMIT 5`, [from, to])).rows;
    }

    await logEvent("flight_search", `AI: ${from} → ${to}`, "ai");
    res.json(flights);
  } catch (e) { res.status(500).send("Server Error"); }
});

// ══════════════════════════════════════════════════════════════
//  PROMO CODE VALIDATION
// ══════════════════════════════════════════════════════════════
app.post("/validate-promo", authenticateToken, async (req, res) => {
  try {
    const { code, amount } = req.body;
    const r = await pool.query("SELECT * FROM promo_codes WHERE UPPER(code)=UPPER($1) AND is_active=TRUE", [code]);
    if (!r.rows.length) return res.status(404).json({ message: "Invalid or expired promo code" });
    const promo = r.rows[0];
    if (promo.valid_until && new Date(promo.valid_until) < new Date()) return res.status(400).json({ message: "Promo code has expired" });
    if (promo.used_count >= promo.max_uses) return res.status(400).json({ message: "Promo code limit reached" });
    if (amount < promo.min_booking_amount) return res.status(400).json({ message: `Minimum booking ₹${promo.min_booking_amount} required` });
    const discount = promo.discount_type === "percent" ? Math.floor(amount * promo.discount_value / 100) : promo.discount_value;
    res.json({ valid: true, discount, finalAmount: amount - discount, description: promo.description });
  } catch { res.status(500).json({ message: "Server error" }); }
});

// ══════════════════════════════════════════════════════════════
//  WALLET
// ══════════════════════════════════════════════════════════════
app.get("/wallet", authenticateToken, async (req, res) => {
  try {
    const r = await pool.query("SELECT wallet_balance FROM users WHERE id=$1", [req.user.id]);
    res.json({ balance: r.rows[0]?.wallet_balance || 0 });
  } catch { res.json({ balance: 0 }); }
});

// ══════════════════════════════════════════════════════════════
//  BOOKING
// ══════════════════════════════════════════════════════════════
app.post("/book", authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { flight_id, passenger_name, cabin_class, seats, promo_code, discount_applied, final_price, use_wallet } = req.body;
    const user_id = req.user.id;
    await client.query("BEGIN");

    const flight = await client.query("SELECT * FROM flights WHERE id=$1 FOR UPDATE", [flight_id]);
    if (!flight.rows.length) { await client.query("ROLLBACK"); return res.status(404).json({ message: "Flight not found" }); }
    if (flight.rows[0].seats_available <= 0) { await client.query("ROLLBACK"); return res.status(400).json({ message: "No seats available" }); }

    let walletUsed = 0;
    if (use_wallet) {
      const wr = await client.query("SELECT wallet_balance FROM users WHERE id=$1", [user_id]);
      walletUsed = Math.min(wr.rows[0].wallet_balance||0, final_price||flight.rows[0].price);
      if (walletUsed > 0) await client.query("UPDATE users SET wallet_balance=wallet_balance-$1 WHERE id=$2", [walletUsed, user_id]);
    }
    if (promo_code) await client.query("UPDATE promo_codes SET used_count=used_count+1 WHERE UPPER(code)=UPPER($1)", [promo_code]);

    const bookingId = "ALV" + Date.now().toString(36).toUpperCase().slice(-6);
    const f = flight.rows[0];
    const actualFinal = (final_price||f.price) - walletUsed;

    await client.query(
      `INSERT INTO bookings (flight_id,passenger_name,user_id,seats,promo_code,discount_applied,final_price,cabin_class,flight_no,airline)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [flight_id, passenger_name, user_id, seats?seats.join(","):null, promo_code||null,
       (discount_applied||0)+walletUsed, actualFinal, cabin_class||"Economy", f.flight_no, f.airline]
    );
    await client.query("UPDATE flights SET seats_available=seats_available-1 WHERE id=$1", [f.id]);

    // Referral reward
    if (actualFinal >= 5000) {
      const userR = await client.query("SELECT referred_by FROM users WHERE id=$1", [user_id]);
      const refCode = userR.rows[0]?.referred_by;
      if (refCode) {
        const referrer = await client.query("SELECT id FROM users WHERE ref_code=$1", [refCode]);
        if (referrer.rows.length) {
          await client.query("UPDATE users SET wallet_balance=wallet_balance+150 WHERE id=$1", [referrer.rows[0].id]);
          await client.query("UPDATE users SET wallet_balance=wallet_balance+100 WHERE id=$1", [user_id]);
          await client.query("INSERT INTO referral_discounts (referrer_user_id,referred_user_id,referrer_discount,referred_discount,referrer_claimed,referred_claimed) VALUES ($1,$2,150,100,TRUE,TRUE)",
            [referrer.rows[0].id, user_id]);
        }
      }
    }

    await client.query("COMMIT");
    await logEvent("booking", `${f.from_city} → ${f.to_city} ₹${actualFinal}`, "web", user_id);

    const userResult = await pool.query("SELECT email FROM users WHERE id=$1", [user_id]);
    const userEmail = userResult.rows[0]?.email;
    if (userEmail) {
      try {
        await sendBookingEmail(userEmail, {
          passengerName: passenger_name, airline: f.airline, flightNo: f.flight_no,
          fromCity: f.from_city, toCity: f.to_city, departureTime: f.departure_time,
          arrivalTime: f.arrival_time, price: actualFinal, bookingId,
          cabinClass: cabin_class||"Economy", seats: seats||[],
          discountApplied: (discount_applied||0)+walletUsed,
        });
      } catch(e) { console.error("Email:", e.message); }
    }
    res.json({ message: "Booking confirmed!", bookingId, walletUsed });
  } catch(e) { await client.query("ROLLBACK"); console.error(e); res.status(500).send("Server Error"); }
  finally { client.release(); }
});

// ══════════════════════════════════════════════════════════════
//  MY BOOKINGS
// ══════════════════════════════════════════════════════════════
app.get("/my-bookings", authenticateToken, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT bookings.id, bookings.passenger_name, bookings.booked_at, bookings.seats,
              bookings.promo_code, bookings.discount_applied, bookings.final_price, bookings.cabin_class,
              flights.from_city, flights.to_city, flights.departure_time, flights.arrival_time,
              flights.price, flights.airline, flights.flight_no
       FROM bookings JOIN flights ON bookings.flight_id=flights.id
       WHERE bookings.user_id=$1 ORDER BY bookings.id DESC`,
      [req.user.id]
    );
    res.json(r.rows);
  } catch { res.status(500).send("Server Error"); }
});

// ══════════════════════════════════════════════════════════════
//  REAL FLIGHTS (AviationStack)
// ══════════════════════════════════════════════════════════════
app.get("/real-flights", async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ message: "Provide from and to" });
    const fromCode = CITY_TO_IATA[from.toLowerCase()] || from.toUpperCase().slice(0,3);
    const toCode   = CITY_TO_IATA[to.toLowerCase()]   || to.toUpperCase().slice(0,3);
    const resp = await axios.get("http://api.aviationstack.com/v1/flights", {
      params: { access_key: process.env.AVIATIONSTACK_KEY, dep_iata: fromCode, arr_iata: toCode, limit: 10, flight_status: "scheduled" }
    });
    const flights = resp.data.data;
    if (!flights || !flights.length) {
      const db = await pool.query("SELECT * FROM flights WHERE LOWER(from_city)=LOWER($1) AND LOWER(to_city)=LOWER($2) ORDER BY price ASC", [from, to]);
      return res.json(db.rows);
    }
    const saved = [];
    for (const f of flights) {
      const airline = f.airline?.name || "Unknown", flightNo = f.flight?.iata || "—";
      const dep = f.departure?.scheduled || null, arr = f.arrival?.scheduled || null;
      const price = Math.floor(Math.random()*8000)+2000;
      const ex = await pool.query("SELECT * FROM flights WHERE flight_no=$1 AND departure_time=$2", [flightNo, dep]);
      if (ex.rows.length) saved.push(ex.rows[0]);
      else {
        const ins = await pool.query("INSERT INTO flights (airline,flight_no,from_city,to_city,departure_time,arrival_time,price,seats_available) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
          [airline, flightNo, from, to, dep, arr, price, 50]);
        saved.push(ins.rows[0]);
      }
    }
    res.json(saved);
  } catch(e) {
    const { from, to } = req.query;
    const db = await pool.query("SELECT * FROM flights WHERE LOWER(from_city)=LOWER($1) AND LOWER(to_city)=LOWER($2) ORDER BY price ASC", [from, to]);
    res.json(db.rows);
  }
});

// ══════════════════════════════════════════════════════════════
//  TEST
// ══════════════════════════════════════════════════════════════
app.get("/test", (req, res) => res.send("Alvryn backend alive ✈"));

// ══════════════════════════════════════════════════════════════
//  BOOKING CONFIRMATION EMAIL
// ══════════════════════════════════════════════════════════════
async function sendBookingEmail(toEmail, d) {
  const dep = d.departureTime ? new Date(d.departureTime).toLocaleString("en-IN",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:false}) : "—";
  const arr = d.arrivalTime   ? new Date(d.arrivalTime).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false}) : "—";
  const seatStr = d.seats && d.seats.length ? d.seats.join(", ") : "Auto-assigned";
  await resend.emails.send({
    from: "Alvryn Travel <onboarding@resend.dev>",
    to: toEmail,
    subject: `✈️ Booking Confirmed — ${d.bookingId} | Alvryn`,
    html: `<div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;background:#faf8f4;border-radius:16px;overflow:hidden;border:1px solid rgba(201,168,76,0.2);">
      <div style="background:linear-gradient(135deg,#c9a84c,#f0d080,#c9a84c);padding:28px 24px;text-align:center;">
        <h1 style="margin:0;font-size:22px;color:#1a1410;font-weight:900;letter-spacing:0.1em;">ALVRYN</h1>
        <p style="margin:4px 0 0;color:rgba(26,20,16,0.7);font-size:10px;letter-spacing:0.3em;">TRAVEL BEYOND BOUNDARIES</p>
      </div>
      <div style="background:rgba(201,168,76,0.1);padding:12px 24px;text-align:center;">
        <p style="margin:0;color:#8B6914;font-size:16px;font-weight:700;">✅ Booking Confirmed!</p>
      </div>
      <div style="padding:24px;text-align:center;">
        <p style="margin:0;font-size:10px;color:#aaa;letter-spacing:0.15em;">BOOKING ID</p>
        <p style="margin:8px 0 0;font-size:24px;font-weight:900;color:#8B6914;letter-spacing:4px;">${d.bookingId}</p>
      </div>
      <div style="padding:0 24px 24px;">
        <table style="width:100%;border-collapse:collapse;">
          ${[
            ["PASSENGER", d.passengerName],
            ["FLIGHT",    `${d.airline} ${d.flightNo||""}`],
            ["ROUTE",     `${d.fromCity} → ${d.toCity}`],
            ["DEPARTURE", dep],
            ["ARRIVAL",   arr],
            ["SEATS",     seatStr],
            ["CLASS",     d.cabinClass],
            ...(d.discountApplied>0?[["DISCOUNT",`−₹${d.discountApplied.toLocaleString()}`]]:[] ),
            ["AMOUNT PAID", `₹${d.price?.toLocaleString()}`],
          ].map(([k,v])=>`<tr><td style="padding:9px 0;color:#888;font-size:11px;border-bottom:1px solid rgba(201,168,76,0.1);">${k}</td><td style="padding:9px 0;color:#1a1410;font-weight:600;text-align:right;border-bottom:1px solid rgba(201,168,76,0.1);">${v}</td></tr>`).join("")}
        </table>
      </div>
      <div style="padding:18px 24px;background:rgba(201,168,76,0.05);text-align:center;">
        <p style="margin:0;color:#aaa;font-size:12px;">Thank you for booking with Alvryn ✈️ · <a href="https://alvryn.in" style="color:#c9a84c;">alvryn.in</a></p>
        <p style="margin:6px 0 0;color:#bbb;font-size:11px;">Alvryn may earn a commission from partner links at no extra cost to you.</p>
      </div>
    </div>`
  });
}

// ══════════════════════════════════════════════════════════════
//  WHATSAPP BOT — flights + buses + hotels
// ══════════════════════════════════════════════════════════════
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const userSessions = {};

// Bus routes for WhatsApp
const WA_BUS_ROUTES = [
  {from:"bangalore",to:"chennai",    dep:"06:00",arr:"11:30",price:650,  type:"AC Sleeper",   op:"VRL Travels"},
  {from:"bangalore",to:"chennai",    dep:"21:00",arr:"02:30",price:550,  type:"Semi-Sleeper", op:"KSRTC"},
  {from:"bangalore",to:"hyderabad",  dep:"20:00",arr:"04:00",price:800,  type:"AC Sleeper",   op:"SRS Travels"},
  {from:"bangalore",to:"goa",        dep:"21:30",arr:"06:30",price:900,  type:"AC Sleeper",   op:"Neeta Tours"},
  {from:"bangalore",to:"mumbai",     dep:"17:00",arr:"09:00",price:1400, type:"AC Sleeper",   op:"VRL Travels"},
  {from:"bangalore",to:"pune",       dep:"18:00",arr:"08:00",price:1200, type:"AC Sleeper",   op:"Paulo Travels"},
  {from:"bangalore",to:"coimbatore", dep:"07:00",arr:"11:00",price:400,  type:"AC Seater",    op:"KSRTC"},
  {from:"bangalore",to:"mangalore",  dep:"22:00",arr:"05:00",price:700,  type:"AC Sleeper",   op:"VRL Travels"},
  {from:"bangalore",to:"mysore",     dep:"07:00",arr:"10:00",price:250,  type:"AC Seater",    op:"KSRTC"},
  {from:"chennai",  to:"hyderabad",  dep:"21:00",arr:"04:00",price:750,  type:"AC Sleeper",   op:"TSRTC"},
  {from:"chennai",  to:"bangalore",  dep:"07:00",arr:"12:30",price:630,  type:"AC Sleeper",   op:"VRL Travels"},
  {from:"hyderabad",to:"bangalore",  dep:"21:00",arr:"05:00",price:800,  type:"AC Sleeper",   op:"Orange Travels"},
  {from:"hyderabad",to:"mumbai",     dep:"18:00",arr:"06:00",price:1100, type:"AC Sleeper",   op:"VRL Travels"},
  {from:"mumbai",   to:"pune",       dep:"07:00",arr:"10:00",price:300,  type:"AC Seater",    op:"MSRTC"},
  {from:"mumbai",   to:"goa",        dep:"22:00",arr:"08:00",price:950,  type:"AC Sleeper",   op:"Paulo Travels"},
  {from:"delhi",    to:"jaipur",     dep:"06:00",arr:"11:00",price:500,  type:"AC Seater",    op:"RSRTC"},
  {from:"delhi",    to:"agra",       dep:"07:00",arr:"11:00",price:400,  type:"AC Seater",    op:"UP Roadways"},
  {from:"delhi",    to:"chandigarh", dep:"08:00",arr:"12:00",price:450,  type:"AC Seater",    op:"HRTC"},
  {from:"delhi",    to:"lucknow",    dep:"22:00",arr:"05:00",price:700,  type:"AC Sleeper",   op:"UP SRTC"},
  {from:"delhi",    to:"amritsar",   dep:"21:30",arr:"04:30",price:750,  type:"AC Sleeper",   op:"PRTC"},
];

app.post("/whatsapp", async (req, res) => {
  const rawMsg = req.body.Body?.trim() || "";
  const msg    = rawMsg.toLowerCase().trim();
  const phone  = req.body.From;
  let reply    = "";

  if (!userSessions[phone]) userSessions[phone] = { step:"idle" };
  const session = userSessions[phone];

  try {
    // ── Global commands ────────────────────────────────────────────────────
    const resetWords = ["hi","hello","hey","start","restart","cancel","reset","stop","menu","back","help","hlo","heyyy","heyy","hai","halo"];
    if (resetWords.some(w => msg === w || msg.startsWith(w+" "))) {
      userSessions[phone] = { step:"idle" };
      reply = `✈️ *Alvryn AI — Your Travel Assistant*\n\nHi! I can help you search flights, buses and hotels.\n\n*Search flights:*\n_"flights bangalore to mumbai tomorrow"_\n_"blr to del kal cheap"_\n\n*Search buses:*\n_"bus bangalore to chennai tomorrow"_\n\n*Search hotels:*\n_"hotel in goa"_\n_"hotels bangalore"_\n\n*Plan a trip:*\n_"2 day trip to goa under 5000"_\n_"where can i go for 3000"_\n\nType your route in any language — English, Hindi, Tamil, Telugu, Kannada!`;
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message(reply);
      return res.type("text/xml").send(twiml.toString());
    }

    // ── Detect intent ──────────────────────────────────────────────────────
    const hotelKw  = /\b(hotel|hotels|stay|room|rooms|accommodation|lodge|resort|hostel|pg|guesthouse|where to stay|place to stay)\b/i;
    const busKw    = /\b(bus|buses|coach|volvo|sleeper|seater|ksrtc|msrtc|tsrtc|rsrtc|redbus|ac bus|overnight bus)\b/i;
    const tripKw   = /\b(plan|trip|travel|tour|visit|go to|suggest|recommend|itinerary|where.*go|vacation|holiday|2 day|3 day|\d day)\b/i;
    const flightKw = /\b(flight|flights|fly|flying|plane|airways|airlines|air india|indigo|spicejet|vistara|akasa|ticket)\b/i;

    // ── Handle "I want low price / cheap / budget" during conversation ──────
    const cheapWords = ["low price","cheap","sasta","budget","cheapest","affordable","kam price","lowest","uchan","vilai","rate","best price","good deal"];
    if (cheapWords.some(w => msg.includes(w)) && session.step !== "idle") {
      if (session.flights && session.flights.length > 0) {
        const sorted = [...session.flights].sort((a,b)=>a.price-b.price);
        const f = sorted[0];
        const fromCode = CITY_TO_IATA[session.from] || session.from.slice(0,3).toUpperCase();
        const toCode   = CITY_TO_IATA[session.to]   || session.to.slice(0,3).toUpperCase();
        const link = (()=>{ const indCodes = new Set(["BLR","BOM","DEL","MAA","HYD","CCU","GOI","PNQ","COK","AMD","JAI","LKO","VNS","PAT","IXC","GAU","BBI","CBE","IXM","IXE","MYQ","TRV","VTZ","VGA","IXR","BHO","SXR","IXJ","HBX","IXG","TIR","IXL","IXZ","NAG","IDR","RPR","DED","SLV","ATQ","UDR","JDH","AGR","STV"]); const isIndia = indCodes.has(fromCode) && indCodes.has(toCode); const base = isIndia ? "https://www.aviasales.in" : "https://www.aviasales.com"; return base+"/search/"+fromCode+(session.dateStr||"")+toCode+"1?marker=714667&sub_id=alvryn_whatsapp"; })();
        reply = `💰 *Cheapest option for ${session.from.toUpperCase()} → ${session.to.toUpperCase()}*\n\n✈️ ${f.airline}\n⏰ ${new Date(f.departure_time).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false})}\n💰 Approx ₹${f.price.toLocaleString()}–₹${Math.round(f.price*1.2).toLocaleString()}\n\n💡 Morning flights are usually 15–20% cheaper on this route.\n\n👉 Check live prices:\n${link}\n\n_Prices may vary. Live availability on partner site._`;
        const twiml = new twilio.twiml.MessagingResponse();
        twiml.message(reply);
        return res.type("text/xml").send(twiml.toString());
      }
      if (session.buses && session.buses.length > 0) {
        const sorted = [...session.buses].sort((a,b)=>a.price-b.price);
        const b = sorted[0];
        reply = `💰 *Cheapest bus: ${session.from.toUpperCase()} → ${session.to.toUpperCase()}*\n\n🚌 ${b.op}\n⏰ ${b.dep} → ${b.arr} · ${b.type}\n💰 Approx ₹${b.price.toLocaleString()}\n\n👉 Check live prices on RedBus:\nhttps://www.redbus.in/bus-tickets/${session.from.replace(/\s+/g,"-")}-to-${session.to.replace(/\s+/g,"-")}\n\n_Prices may vary. Live availability on RedBus._`;
        const twiml = new twilio.twiml.MessagingResponse();
        twiml.message(reply);
        return res.type("text/xml").send(twiml.toString());
      }
    }

    // ── "Where should I go" / Plan my trip ────────────────────────────────
    const whereKw = /where.*go|suggest.*trip|plan.*trip|trip.*plan|\d+.*day.*under|under.*\d+.*day|kaha.*jao|kahan|suggest|recommend.*place|where.*travel/i;
    if (whereKw.test(msg) || (tripKw.test(msg) && !flightKw.test(msg) && !busKw.test(msg))) {
      const budget = extractBudget(msg);
      const cities = extractCities(msg);
      const fromCity = cities.from ? cities.from.charAt(0).toUpperCase()+cities.from.slice(1) : "Bangalore";
      
      const suggestions = [
        { dest:"🌴 Goa",         budget:"₹3,500–₹5,500",  days:"2 days", why:"Beaches, food, nightlife. Best from Bangalore/Mumbai.", flight:true, bus:true },
        { dest:"🌿 Coorg",       budget:"₹2,000–₹3,500",  days:"1–2 days",why:"Coffee estates, waterfalls. Perfect weekend escape.", flight:false, bus:true },
        { dest:"🏔️ Ooty",        budget:"₹1,800–₹3,000",  days:"1–2 days",why:"Hill station, cool weather, scenic views.", flight:false, bus:true },
        { dest:"🌊 Pondicherry", budget:"₹2,500–₹4,000",  days:"2 days", why:"French quarters, beaches, great cuisine.", flight:false, bus:true },
        { dest:"🏛️ Mysore",      budget:"₹1,500–₹2,500",  days:"1 day",  why:"Palaces, culture, close to Bangalore.", flight:false, bus:true },
      ].filter(s => !budget || parseInt(budget) >= parseInt(s.budget.split("–")[0].replace(/[₹,]/g,""))-500);

      const top3 = suggestions.slice(0, 3);
      reply = `🗺️ *Trip Suggestions from ${fromCity}*

`;
      if (budget) reply += `Budget: approx ₹${budget.toLocaleString()}

`;
      top3.forEach((s,i) => {
        reply += `*${i+1}. ${s.dest}*
`;
        reply += `💰 Approx ${s.budget} total
`;
        reply += `📅 ${s.days}
`;
        reply += `💡 ${s.why}
`;
        reply += s.bus ? `🚌 Bus available
` : "";
        reply += s.flight ? `✈️ Flights available
` : "";
        reply += `
`;
      });
      reply += `Reply *1*, *2*, or *3* to search flights/buses for that destination.
`;
      reply += `Or type *flights [city]* or *bus [city]* to search directly.`;
      session.tripSuggestions = top3;
      session.from = fromCity.toLowerCase();
      session.step = "trip_suggested";
      await logEvent("trip_plan", `WhatsApp plan from ${fromCity}`, "whatsapp");
    }
    else if (session.step === "trip_suggested") {
      const num = parseInt(msg.match(/^(\d+)/)?.[1]);
      if (num && num >= 1 && num <= (session.tripSuggestions||[]).length) {
        const dest = session.tripSuggestions[num-1];
        const destName = dest.dest.replace(/[🌴🌿🏔️🌊🏛️]/u,"").trim();
        reply = `✈️ *Searching for ${session.from ? session.from.charAt(0).toUpperCase()+session.from.slice(1) : "your city"} → ${destName}*

Type one of these to search:
🚌 _"bus ${session.from||"bangalore"} to ${destName.toLowerCase()} tomorrow"_
✈️ _"flights ${session.from||"bangalore"} to ${destName.toLowerCase()} this weekend"_

Or I can search now — just say *search bus* or *search flight*.`;
        session.step = "idle";
      } else {
        reply = `Please reply *1*, *2*, or *3* to pick a destination, or type a new search.`;
      }
    }
    else if (hotelKw.test(msg)) {
      // Hotel search
      const { from } = extractCities(msg);
      let city = from;
      if (!city) {
        const cleaned = msg.replace(/\b(hotel|hotels|stay|in|at|for|rooms?|best|good|cheap|near)\b/gi,"").trim();
        const words = cleaned.split(/\s+/).filter(w=>w.length>2);
        city = words[0] || "";
      }
      if (!city || city.length < 2) {
        session.step = "asking_hotel_city";
        reply = `🏨 *Hotel Search*\n\nWhich city do you want hotels in?\n\nExamples:\n_hotel in goa_\n_hotels bangalore_\n_hotels in mumbai under 2000_`;
      } else {
        const displayCity = city.charAt(0).toUpperCase() + city.slice(1);
        await logEvent("hotel_search", `WhatsApp: ${displayCity}`, "whatsapp");
        reply = `🏨 *Hotels in ${displayCity}*\n\n💡 I'll find the best options via our partner.\n\n👉 Tap to view hotels:\nhttps://www.booking.com/searchresults.html?ss=${encodeURIComponent(displayCity)}\n\n_Best prices on Booking.com · Prices may vary_`;
        session.step = "idle";
      }
    }
    else if (session.step === "asking_hotel_city") {
      const displayCity = msg.charAt(0).toUpperCase() + msg.slice(1);
      reply = `🏨 *Hotels in ${displayCity}*\n\n👉 Tap to view:\nhttps://www.booking.com/searchresults.html?ss=${encodeURIComponent(displayCity)}\n\n_Prices may vary. Live availability on Booking.com._`;
      session.step = "idle";
    }
    else if (busKw.test(msg)) {
      // Bus search
      const { from, to } = extractCities(msg);
      if (!from || !to) {
        session.step = "bus_search";
        reply = `🚌 *Bus Search*\n\nTell me your route:\n_"bus bangalore to chennai tomorrow"_\n_"bus blr to hyd kal"_\n\nI understand English, Hindi, Tamil and typos!`;
      } else {
        const { date: targetDate, pastDate } = extractDate(msg);
        if (pastDate) {
          reply = `⏰ That date is in the past! Please pick today or a future date.`;
        } else {
          const buses = WA_BUS_ROUTES.filter(b => b.from === from && b.to === to);
          await logEvent("bus_search", `WhatsApp: ${from} → ${to}`, "whatsapp");
          if (buses.length === 0) {
            reply = `🚌 *${from.toUpperCase()} → ${to.toUpperCase()}*\n\nNo buses in our list for this route.\n\n💡 Check live options and seat availability on RedBus:\n👉 https://www.redbus.in/bus-tickets/${from.replace(/\s+/g,"-")}-to-${to.replace(/\s+/g,"-")}\n\n_Live availability on RedBus · Prices may vary_`;
          } else {
            session.buses = buses; session.from = from; session.to = to; session.step = "bus_selecting";
            const insight = buses.some(b=>{const h=parseInt(b.dep.split(":")[0]);return h>=20||h<5;}) ? "\n💡 Night buses are popular — you save on accommodation and arrive fresh." : "";
            reply = `🚌 *Buses: ${from.toUpperCase()} → ${to.toUpperCase()}*${insight}\n\n`;
            buses.slice(0,4).forEach((b,i) => {
              const cheap = i===0?"🏷️ Likely cheapest ":"";
              reply += `*${i+1}. ${b.op}*\n⏰ ${b.dep} → ${b.arr} · ${b.type}\n💰 Approx ₹${b.price.toLocaleString()} ${cheap}\n\n`;
            });
            reply += `Reply *1* to *${Math.min(4,buses.length)}* to get the RedBus booking link\nOr type *redbus* for full schedule`;
          }
        }
      }
    }
    else if (session.step === "bus_search") {
      const { from, to } = extractCities(msg);
      if (!from || !to) {
        reply = `Couldn't find the cities. Try: _"bus bangalore to chennai"_`;
      } else {
        const buses = WA_BUS_ROUTES.filter(b => b.from === from && b.to === to);
        await logEvent("bus_search", `WhatsApp: ${from} → ${to}`, "whatsapp");
        if (buses.length === 0) {
          reply = `🚌 No buses found from *${from}* to *${to}*. Try RedBus for more options:\nhttps://www.redbus.in/bus-tickets/${from.replace(/\s+/g,"-")}-to-${to.replace(/\s+/g,"-")}`;
          session.step = "idle";
        } else {
          session.buses = buses; session.from = from; session.to = to; session.step = "bus_selecting";
          reply = `🚌 *Buses: ${from.toUpperCase()} → ${to.toUpperCase()}*\n\n`;
          buses.slice(0,4).forEach((b,i) => {
            reply += `*${i+1}. ${b.op}*\n⏰ ${b.dep} → ${b.arr} · ${b.type}\n💰 Approx ₹${b.price.toLocaleString()}\n\n`;
          });
          reply += `Reply *1* to *${Math.min(4,buses.length)}* to get booking link`;
        }
      }
    }
    else if (session.step === "bus_selecting") {
      if (msg === "redbus" || msg.includes("more option") || msg.includes("all buses")) {
        reply = `🚌 View full schedule on RedBus:\nhttps://www.redbus.in/bus-tickets/${(session.from||"").replace(/\s+/g,"-")}-to-${(session.to||"").replace(/\s+/g,"-")}\n\n_Live availability and seat selection on RedBus_`;
        session.step = "idle";
      } else {
        const num = parseInt(msg.match(/^(\d+)/)?.[1]);
        if (!num || num < 1 || num > (session.buses||[]).length) {
          reply = `Please reply *1* to *${Math.min(4,(session.buses||[]).length)}*, or type *redbus* for more options.`;
        } else {
          const b = session.buses[num-1];
          reply = `✅ *${b.op}*\n🚌 ${(session.from||"").toUpperCase()} → ${(session.to||"").toUpperCase()}\n⏰ ${b.dep} → ${b.arr}\n💰 Approx ₹${b.price.toLocaleString()} · ${b.type}\n\n💡 Prices may vary slightly on the booking site.\n\n👉 Book on RedBus (opens with your route):\nhttps://www.redbus.in/bus-tickets/${(session.from||"").replace(/\s+/g,"-")}-to-${(session.to||"").replace(/\s+/g,"-")}\n\n_Live seat availability on RedBus_`;
          session.step = "idle";
        }
      }
    }
    else if (session.step === "flight_selecting") {
      const num = parseInt(msg.match(/^(\d+)/)?.[1]);
      if (!num) {
        reply = `Please reply with a number like *1*, *2*, or *3*.\nOr type *cancel* to start a new search.`;
      } else if (num < 1 || num > (session.flights||[]).length) {
        reply = `Pick a number between *1* and *${(session.flights||[]).length}*.`;
      } else {
        const f = session.flights[num-1];
        const fromCode = CITY_TO_IATA[session.from] || session.from.slice(0,3).toUpperCase();
        const toCode   = CITY_TO_IATA[session.to]   || session.to.slice(0,3).toUpperCase();
        const link = (()=>{ const indCodes = new Set(["BLR","BOM","DEL","MAA","HYD","CCU","GOI","PNQ","COK","AMD","JAI","LKO","VNS","PAT","IXC","GAU","BBI","CBE","IXM","IXE","MYQ","TRV","VTZ","VGA","IXR","BHO","SXR","IXJ","HBX","IXG","TIR","IXL","IXZ","NAG","IDR","RPR","DED","SLV","ATQ","UDR","JDH","AGR","STV"]); const isIndia = indCodes.has(fromCode) && indCodes.has(toCode); const base = isIndia ? "https://www.aviasales.in" : "https://www.aviasales.com"; return base+"/search/"+fromCode+(session.dateStr||"")+toCode+"1?marker=714667&sub_id=alvryn_whatsapp"; })();
        const dep = new Date(f.departure_time).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false});
        reply = `✈️ *${f.airline}*\n${(session.from||"").toUpperCase()} → ${(session.to||"").toUpperCase()}\n⏰ Departs ${dep}\n💰 Approx ₹${f.price.toLocaleString()}–₹${Math.round(f.price*1.2).toLocaleString()}\n\n💡 Prices may vary. Click to check live availability:\n👉 ${link}\n\n_Opens our partner site · Secure booking_`;
        await logEvent("view_deal", `WhatsApp flight: ${session.from} → ${session.to}`, "whatsapp");
        session.step = "idle";
      }
    }
    else if (session.step === "asking_date") {
      const { date: targetDate, pastDate } = extractDate(msg);
      if (pastDate) reply = `⏰ That's a past date! Try: _"tomorrow"_, _"next friday"_, _"25 april"_`;
      else if (!targetDate) reply = `Didn't catch the date. Try: _"tomorrow"_, _"next friday"_, _"25 march"_`;
      else { await searchFlightsAndReply(session, session.from, session.to, targetDate, msg); reply = session.lastReply; }
    }
    else {
      // Default: try as flight search
      const { from, to } = extractCities(msg);
      if (from && to) {
        const { date: targetDate, pastDate } = extractDate(msg);
        if (pastDate) {
          reply = `⏰ That date is in the past! Please search for today or a future date.`;
        } else if (!targetDate) {
          session.step = "asking_date"; session.from = from; session.to = to;
          reply = `✈️ *${from.toUpperCase()} → ${to.toUpperCase()}*\n\nWhat date do you want to fly?\n_"tomorrow"_, _"25 april"_, _"next friday"_`;
        } else {
          await searchFlightsAndReply(session, from, to, targetDate, msg);
          reply = session.lastReply;
        }
      } else {
        // Not travel related or unclear
        const offTopicKw = /weather|cricket|ipl|news|sports|movie|song|recipe|cook|politics|exam|job|career|love|relationship/i;
        if (offTopicKw.test(msg)) {
          reply = `🤖 I'm Alvryn AI — I specialise in travel!\n\nI can help you with:\n✈️ Flight searches\n🚌 Bus routes\n🏨 Hotels\n🗺️ Trip planning\n\nTry: _"flights bangalore to goa tomorrow"_ or _"where to go for 3000"_`;
        } else {
          reply = `✈️ *Alvryn AI*\n\nSorry, I didn't understand that. Here's what I can help with:\n\n✈️ _"flights bangalore to mumbai tomorrow"_\n🚌 _"bus bangalore to chennai kal"_\n🏨 _"hotels in goa"_\n🗺️ _"trip under 5000"_\n\nType *help* for the full menu.`;
        }
      }
    }
  } catch(e) {
    console.error("WhatsApp error:", e);
    reply = `Something went wrong. Type *restart* to start fresh.`;
    userSessions[phone] = { step:"idle" };
  }

  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(reply);
  res.type("text/xml").send(twiml.toString());
});


// ══════════════════════════════════════════════════════════════
//  SMART AI CHAT — 3-TIER: CACHE → MEDIUM LOGIC → GPT-4o-mini
// ══════════════════════════════════════════════════════════════

// ── City alias fixes (trivandram→TRV etc.) ───────────────────────────────────
const CITY_NORM = {
  "trivandram":"trivandrum","trivandaram":"trivandrum","trivendrum":"trivandrum",
  "tiruvananthapuram":"trivandrum","trivendram":"trivandrum","trvm":"trivandrum",
  "bangalor":"bangalore","bangaluru":"bangalore","bengalore":"bangalore","bengaluru":"bangalore",
  "banglaore":"bangalore","blore":"bangalore","blr":"bangalore",
  "bombay":"mumbai","bom":"mumbai","mum":"mumbai","mumbi":"mumbai",
  "dilli":"delhi","new delhi":"delhi","del":"delhi","nai dilli":"delhi",
  "madras":"chennai","chenai":"chennai","chinnai":"chennai","maa":"chennai",
  "hydrabad":"hyderabad","hyd":"hyderabad","secunderabad":"hyderabad",
  "calcutta":"kolkata","ccu":"kolkata","kolkatta":"kolkata",
  "cochin":"kochi","ernakulam":"kochi","cok":"kochi",
  "poona":"pune","pnq":"pune","puna":"pune",
  "koimbatore":"coimbatore","kovai":"coimbatore","cbe":"coimbatore",
  "banaras":"varanasi","kashi":"varanasi","benares":"varanasi","vns":"varanasi",
  "mangaluru":"mangalore","mangalor":"mangalore","ixe":"mangalore",
  "mysuru":"mysore","city of palaces":"mysore",
  "vizag":"visakhapatnam","waltair":"visakhapatnam","vtz":"visakhapatnam",
  "singapur":"singapore","singapoor":"singapore","sin":"singapore",
  "dxb":"dubai","dubi":"dubai","dubay":"dubai",
  "pink city":"jaipur","jaipor":"jaipur","jai":"jaipur",
  "temple city":"madurai","maduri":"madurai","mdu":"madurai",
  "ladakh":"leh","leh ladakh":"leh",
  "taj city":"agra","taj mahal city":"agra",
  "city of pearls":"hyderabad",
};

function normCity(s) {
  if (!s) return s;
  const low = s.toLowerCase().trim();
  return CITY_NORM[low] || low;
}

// ── Bus data ──────────────────────────────────────────────────────────────────
const BUS_DB = [
  {from:"bangalore",to:"chennai",    dep:"06:00",arr:"11:30",price:650, type:"AC Sleeper",   op:"VRL Travels"},
  {from:"bangalore",to:"chennai",    dep:"14:00",arr:"19:30",price:720, type:"AC Sleeper",   op:"SRS Travels"},
  {from:"bangalore",to:"chennai",    dep:"21:00",arr:"02:30",price:550, type:"Semi-Sleeper", op:"KSRTC"},
  {from:"bangalore",to:"hyderabad",  dep:"20:00",arr:"04:00",price:800, type:"AC Sleeper",   op:"SRS Travels"},
  {from:"bangalore",to:"hyderabad",  dep:"10:00",arr:"18:00",price:750, type:"Semi-Sleeper", op:"Orange Travels"},
  {from:"bangalore",to:"goa",        dep:"21:30",arr:"06:30",price:900, type:"AC Sleeper",   op:"Neeta Tours"},
  {from:"bangalore",to:"goa",        dep:"08:00",arr:"17:00",price:850, type:"AC Sleeper",   op:"Paulo Travels"},
  {from:"bangalore",to:"mumbai",     dep:"17:00",arr:"09:00",price:1400,type:"AC Sleeper",   op:"VRL Travels"},
  {from:"bangalore",to:"pune",       dep:"18:00",arr:"08:00",price:1200,type:"AC Sleeper",   op:"Paulo Travels"},
  {from:"bangalore",to:"coimbatore", dep:"07:00",arr:"11:00",price:400, type:"AC Seater",    op:"KSRTC"},
  {from:"bangalore",to:"mangalore",  dep:"22:00",arr:"05:00",price:700, type:"AC Sleeper",   op:"VRL Travels"},
  {from:"bangalore",to:"mysore",     dep:"07:00",arr:"10:00",price:250, type:"AC Seater",    op:"KSRTC"},
  {from:"bangalore",to:"kochi",      dep:"21:00",arr:"07:00",price:950, type:"AC Sleeper",   op:"KSRTC"},
  {from:"bangalore",to:"madurai",    dep:"21:00",arr:"05:00",price:750, type:"AC Sleeper",   op:"Parveen Travels"},
  {from:"bangalore",to:"trivandrum", dep:"20:30",arr:"07:30",price:1100,type:"AC Sleeper",   op:"KSRTC"},
  {from:"bangalore",to:"tirupati",   dep:"05:30",arr:"10:30",price:450, type:"AC Seater",    op:"APSRTC"},
  {from:"bangalore",to:"ooty",       dep:"07:30",arr:"12:30",price:380, type:"AC Seater",    op:"KSRTC"},
  {from:"bangalore",to:"pondicherry",dep:"07:00",arr:"12:00",price:450, type:"AC Seater",    op:"TNSTC"},
  {from:"bangalore",to:"salem",      dep:"07:30",arr:"11:00",price:320, type:"AC Seater",    op:"KSRTC"},
  {from:"bangalore",to:"vellore",    dep:"06:30",arr:"09:30",price:280, type:"AC Seater",    op:"TNSTC"},
  {from:"chennai",  to:"bangalore",  dep:"07:00",arr:"12:30",price:630, type:"AC Sleeper",   op:"VRL Travels"},
  {from:"chennai",  to:"hyderabad",  dep:"21:00",arr:"04:00",price:750, type:"AC Sleeper",   op:"TSRTC"},
  {from:"chennai",  to:"coimbatore", dep:"08:00",arr:"12:30",price:350, type:"AC Seater",    op:"TNSTC"},
  {from:"chennai",  to:"madurai",    dep:"22:00",arr:"03:00",price:450, type:"AC Sleeper",   op:"Parveen Travels"},
  {from:"chennai",  to:"trivandrum", dep:"21:00",arr:"06:00",price:750, type:"AC Sleeper",   op:"TNSTC"},
  {from:"hyderabad",to:"bangalore",  dep:"21:00",arr:"05:00",price:800, type:"AC Sleeper",   op:"Orange Travels"},
  {from:"hyderabad",to:"mumbai",     dep:"18:00",arr:"06:00",price:1100,type:"AC Sleeper",   op:"VRL Travels"},
  {from:"hyderabad",to:"chennai",    dep:"20:30",arr:"03:30",price:700, type:"AC Sleeper",   op:"APSRTC"},
  {from:"mumbai",   to:"pune",       dep:"07:00",arr:"10:00",price:300, type:"AC Seater",    op:"MSRTC"},
  {from:"mumbai",   to:"goa",        dep:"22:00",arr:"08:00",price:950, type:"AC Sleeper",   op:"Paulo Travels"},
  {from:"delhi",    to:"jaipur",     dep:"06:00",arr:"11:00",price:500, type:"AC Seater",    op:"RSRTC"},
  {from:"delhi",    to:"agra",       dep:"07:00",arr:"11:00",price:400, type:"AC Seater",    op:"UP Roadways"},
  {from:"delhi",    to:"chandigarh", dep:"08:00",arr:"12:00",price:450, type:"AC Seater",    op:"HRTC"},
  {from:"delhi",    to:"lucknow",    dep:"22:00",arr:"05:00",price:700, type:"AC Sleeper",   op:"UP SRTC"},
  {from:"delhi",    to:"amritsar",   dep:"21:30",arr:"04:30",price:750, type:"AC Sleeper",   op:"PRTC"},
  {from:"delhi",    to:"haridwar",   dep:"06:30",arr:"11:30",price:500, type:"AC Seater",    op:"Uttarakhand Roadways"},
  {from:"delhi",    to:"shimla",     dep:"05:30",arr:"13:30",price:650, type:"AC Seater",    op:"HRTC"},
  {from:"kolkata",  to:"bhubaneswar",dep:"21:00",arr:"03:00",price:600, type:"AC Sleeper",   op:"OSRTC"},
  {from:"kolkata",  to:"patna",      dep:"20:00",arr:"05:00",price:750, type:"AC Sleeper",   op:"BSRTC"},
  {from:"pune",     to:"goa",        dep:"22:30",arr:"06:30",price:850, type:"AC Sleeper",   op:"Neeta Tours"},
  {from:"pune",     to:"hyderabad",  dep:"20:00",arr:"06:00",price:950, type:"AC Sleeper",   op:"SRS Travels"},
];

const HOTEL_PRICES = {
  "goa":"800–3,500","mumbai":"1,200–5,000","delhi":"900–4,200","bangalore":"800–3,800",
  "jaipur":"700–3,000","kochi":"600–2,500","udaipur":"900–4,000","manali":"500–2,200",
  "shimla":"600–2,500","ooty":"500–2,000","coorg":"700–3,000","pondicherry":"600–2,500",
  "mysore":"500–2,000","hyderabad":"800–3,500","chennai":"800–3,200","kolkata":"700–3,000",
  "agra":"700–3,000","varanasi":"600–2,800","amritsar":"600–2,500","lucknow":"700–3,000",
  "dubai":"3,000–12,000","singapore":"4,000–15,000","bangkok":"2,500–10,000",
  "trivandrum":"600–2,500","coimbatore":"500–2,000","madurai":"600–2,200",
  "bhubaneswar":"600–2,200","patna":"600–2,000","ranchi":"500–2,000",
};

const CITY_IATA_SRV = {
  "bangalore":"BLR","mumbai":"BOM","delhi":"DEL","chennai":"MAA","hyderabad":"HYD",
  "kolkata":"CCU","goa":"GOI","pune":"PNQ","kochi":"COK","ahmedabad":"AMD","jaipur":"JAI",
  "lucknow":"LKO","varanasi":"VNS","trivandrum":"TRV","coimbatore":"CBE","madurai":"IXM",
  "mangalore":"IXE","mysore":"MYQ","visakhapatnam":"VTZ","ranchi":"IXR","bhopal":"BHO",
  "srinagar":"SXR","jammu":"IXJ","tirupati":"TIR","leh":"IXL","nagpur":"NAG",
  "chandigarh":"IXC","guwahati":"GAU","bhubaneswar":"BBI","amritsar":"ATQ",
  "udaipur":"UDR","jodhpur":"JDH","agra":"AGR","indore":"IDR","patna":"PAT",
  "dehradun":"DED","shimla":"SLV","hubli":"HBX","belgaum":"IXG",
  "dubai":"DXB","singapore":"SIN","bangkok":"BKK","london":"LHR","new york":"JFK",
  "kuala lumpur":"KUL","colombo":"CMB","paris":"CDG","tokyo":"NRT","sydney":"SYD",
  "doha":"DOH","abu dhabi":"AUH","istanbul":"IST","bali":"DPS","maldives":"MLE",
  "kathmandu":"KTM","muscat":"MCT",
};
const INDIA_SET = new Set(["BLR","BOM","DEL","MAA","HYD","CCU","GOI","PNQ","COK","AMD","JAI",
  "LKO","VNS","PAT","IXC","GAU","BBI","CBE","IXM","IXE","MYQ","TRV","VTZ","VGA","IXR",
  "BHO","SXR","IXJ","HBX","IXG","TIR","IXL","IXZ","NAG","IDR","RPR","DED","SLV","ATQ","UDR"]);

function buildFlightURL(from, to, ddmm, pax=1) {
  const fc = CITY_IATA_SRV[from?.toLowerCase()] || (from||"").slice(0,3).toUpperCase();
  const tc = CITY_IATA_SRV[to?.toLowerCase()]   || (to||"").slice(0,3).toUpperCase();
  const base = (INDIA_SET.has(fc) && INDIA_SET.has(tc)) ? "https://www.aviasales.in" : "https://www.aviasales.com";
  return `${base}/search/${fc}${ddmm||""}${tc}${pax}?marker=714667&sub_id=alvryn_ai`;
}
function buildBusURL(from, to) { return `https://www.redbus.in/bus-tickets/${(from||"").replace(/\s+/g,"-")}-to-${(to||"").replace(/\s+/g,"-")}`; }
function buildTrainURL(from, to, dateStr) {
  const TC={
    "bangalore":"SBC","bengaluru":"SBC","mumbai":"CSTM","bombay":"CSTM",
    "delhi":"NDLS","new delhi":"NDLS","chennai":"MAS","madras":"MAS",
    "hyderabad":"SC","secunderabad":"SC","kolkata":"HWH","calcutta":"HWH",
    "pune":"PUNE","poona":"PUNE","kochi":"ERS","cochin":"ERS",
    "jaipur":"JP","varanasi":"BSB","banaras":"BSB","kashi":"BSB",
    "patna":"PNBE","trivandrum":"TVC","thiruvananthapuram":"TVC","trivandram":"TVC",
    "coimbatore":"CBE","kovai":"CBE","madurai":"MDU","nagpur":"NGP",
    "bhopal":"BPL","amritsar":"ASR","chandigarh":"CDG","agra":"AGC",
    "lucknow":"LKO","ahmedabad":"ADI","visakhapatnam":"VSKP","vizag":"VSKP",
    "mangalore":"MAQ","mangaluru":"MAQ","mysore":"MYS","mysuru":"MYS",
    "guwahati":"GHY","bhubaneswar":"BBS","ranchi":"RNC","indore":"INDB",
    "surat":"ST","jodhpur":"JU","udaipur":"UDZ","dehradun":"DDN",
  };
  const fc = TC[from?.toLowerCase()]||(from||"").slice(0,4).toUpperCase();
  const tc = TC[to?.toLowerCase()]  ||(to||"").slice(0,4).toUpperCase();
  // Format date for IRCTC: YYYYMMDD
  let dateParam = "";
  if (dateStr) {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d)) {
        const dd = String(d.getDate()).padStart(2,"0");
        const mm = String(d.getMonth()+1).padStart(2,"0");
        const yyyy = d.getFullYear();
        dateParam = `&journeyDate=${yyyy}${mm}${dd}`;
      }
    } catch {}
  }
  return `https://www.irctc.co.in/nget/train-search?fromStation=${fc}&toStation=${tc}${dateParam}`;
}

// ── TIER 1: Classify query complexity ────────────────────────────────────────
function classifyQuery(msg) {
  const m = msg.toLowerCase();
  // Easy: standard route search
  const hasRoute = extractCities(msg).from && extractCities(msg).to;
  const isLocalArea = /attibele|hosur|electronic city|silk board|whitefield|koramangala|hsr|indiranagar|btm|hebbal|yelahanka|peenya|kengeri|nice road|airport/i.test(m);
  const isComplexTrip = /trip|plan|itinerary|suggest|recommend|where.*go|budget.*stay|combo|package|multi.?city|via|both.*and/i.test(m);
  const isLocalTransport = /bmtc|auto|cab|ola|uber|metro|local.*bus|bus.*number|route.*number|which.*bus|how.*reach|direction|from.*to.*local/i.test(m);
  const isGeneral = /which.*better|compare|vs|cheaper.*season|best.*time|tips|advice|cheapest.*month|avoid/i.test(m);
  const isGreeting = /^(hi|hello|hey|hlo|heyy|heyyy|namaste|vanakkam|hai|what.*alvryn|who.*are.*you|help)/.test(m);

  if (isGreeting)                          return "easy";
  if (isLocalArea || isLocalTransport)     return "medium";
  if (hasRoute && !isComplexTrip && !isGeneral) return "easy";
  if (isGeneral || isComplexTrip)          return "hard";
  // Conversational / unclear — use API for best response
  const isConversational = !hasRoute && msg.length > 5 && !/hotel|bus|flight|train|trip/.test(m);
  if (isConversational)                    return "hard";
  return "medium";
}

// ── TIER 1: Massive knowledge base — instant answers, no API ─────────────────
function easyResponse(msg) {
  const m = msg.toLowerCase().trim();
  const { from, to } = extractCities(msg);
  const f = from ? normCity(from) : null;
  const t = to   ? normCity(to)   : null;
  const budget = extractBudget(msg);
  const { date } = extractDate(msg);

  const fN = f ? f.charAt(0).toUpperCase()+f.slice(1) : "";
  const tN = t ? t.charAt(0).toUpperCase()+t.slice(1) : "";

  const isBusQ    = /\bbus\b|buses|coach|volvo|sleeper|seater|ksrtc|msrtc|tsrtc|redbus/i.test(m);
  const isHotelQ  = /hotel|stay|room|accommodation|resort|lodge|hostel|airbnb/i.test(m);
  const isTrainQ  = /\btrain\b|railway|irctc|express|rajdhani|shatabdi|intercity/i.test(m);
  const isFlightQ = /flight|fly|plane|airways|airlines|air india|indigo|spicejet|vistara/i.test(m) || (!isBusQ && !isHotelQ && !isTrainQ);

  // ── GREETINGS ─────────────────────────────────────────────────────────────
  if (/^(hi+|hello+|hey+|hlo+|heyy*|heyyy*|namaste|vanakkam|hai|sup|yo|howdy|gm|gn|good (morning|afternoon|evening)|namaskar|sat sri akal|kem cho)/.test(m) || (m.length <= 5 && /^[a-z]+$/.test(m))) {
    const hour = new Date().getHours();
    const timeGreet = hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";
    return {
      text: `${timeGreet}! 👋 I'm Alvryn AI — your personal travel assistant.\n\nHere's what I can do for you:\n\n✈️ **Flights** — India & international, find cheapest fares\n🚌 **Buses** — overnight AC sleepers, all major routes\n🏨 **Hotels** — budget to luxury, anywhere\n🚂 **Trains** — IRCTC booking, dates pre-filled\n🗺️ **Trip planning** — full itinerary within your budget\n\nJust tell me where you want to go, or try:\n• _"Cheapest flight Bangalore to Delhi tomorrow"_\n• _"Bus from Chennai to Hyderabad tonight"_\n• _"Plan a 2-day Goa trip under ₹8000"_\n\nWhat's your next adventure? 🌍`,
      cards: [], cta: null
    };
  }

  // ── WHAT IS ALVRYN ────────────────────────────────────────────────────────
  if (/what.*(is|are).*(alvryn|this|you|site|app|platform)|who.*are.*you|tell.*about.*yourself|how.*does.*this.*work|how.*does.*alvryn.*work/.test(m)) {
    return {
      text: "Alvryn is India's smartest travel search platform! 🚀\n\nHere's how it works:\n\n1️⃣ You tell me where you want to go\n2️⃣ I search across 700+ airlines, buses, hotels and trains\n3️⃣ I show you the best options sorted by price, speed and value\n4️⃣ You click to book on our partner site (Aviasales, RedBus, Booking.com, IRCTC)\n\n**Why Alvryn?**\n✅ Find cheapest fares instantly\n✅ Compare flights, buses AND trains side by side\n✅ AI understands natural language — type like you talk\n✅ Works in English, Hindi, Tamil, and even with typos!\n\nAlvryn earns a small commission from partners when you book — at no extra cost to you. 🙏",
      cards: [], cta: null
    };
  }

  // ── HOW TO BOOK ──────────────────────────────────────────────────────────
  if (/how.*(to|do i|can i).*(book|buy|purchase|reserve|order)|booking.*process|steps.*book/.test(m)) {
    return {
      text: "Booking through Alvryn is super easy! Here's how:\n\n**Step 1:** Tell me your route (e.g. \"flight from Bangalore to Mumbai on April 20\")\n**Step 2:** I show you the best options with prices\n**Step 3:** Click **\"Check Live Prices\"** on the flight/bus card\n**Step 4:** You land on our partner site (Aviasales/RedBus/Booking.com/IRCTC) with your route pre-filled\n**Step 5:** Complete the booking and payment there\n\n💡 **Tip:** Booking is done on our partner site — they handle payment and send you the confirmation ticket. Alvryn doesn't charge anything extra!",
      cards: [], cta: "Ready to search? Just tell me your route! ✈️"
    };
  }

  // ── IS ALVRYN FREE ───────────────────────────────────────────────────────
  if (/is.*free|free.*use|cost.*use|pay.*use|subscription|premium|charges.*alvryn/.test(m)) {
    return {
      text: "Yes, Alvryn is completely FREE to use! 🎉\n\nYou pay nothing to Alvryn — just search as much as you want.\n\nWhen you book, payment goes directly to the partner (airline/bus/hotel) at their normal price. Alvryn earns a small commission from the partner, not from you.\n\nSo you always get the real price — no hidden fees, no extra charges from Alvryn. 🙌",
      cards: [], cta: null
    };
  }

  // ── POPULAR DESTINATIONS ─────────────────────────────────────────────────
  if (/popular.*destination|best.*place|top.*place|where.*go|suggest.*trip|where.*travel|best.*visit|places.*india|tourist.*place/.test(m)) {
    return {
      text: "Here are India's most popular travel destinations right now! 🇮🇳\n\n**Beach destinations:**\n🏖️ **Goa** — parties, beaches, nightlife. Best: Oct–Mar\n🌊 **Pondicherry** — French quarter, quiet beaches. Best: Nov–Feb\n🐚 **Varkala, Kerala** — cliffside beaches. Best: Oct–Mar\n\n**Hill stations:**\n🏔️ **Manali** — snow, adventure, Rohtang Pass. Best: Mar–Jun\n🌿 **Coorg, Karnataka** — coffee estates, mist. Best: Sep–Mar\n🍵 **Ooty** — toy train, tea gardens. Best: Mar–Jun\n\n**Cultural/Heritage:**\n🏯 **Jaipur** — forts, palaces, pink city. Best: Oct–Mar\n🛕 **Varanasi** — ghats, temples, spiritual. Best: Oct–Mar\n🏛️ **Hampi, Karnataka** — ruins, boulders. Best: Oct–Feb\n\n**International:**\n🌏 **Bangkok** — cheap, fun, street food. 4h flight from South India\n🏝️ **Bali** — beaches, temples, budget-friendly\n🇸🇬 **Singapore** — city, culture, food\n\nWant flights/buses to any of these? Just ask! 😊",
      cards: [], cta: null
    };
  }

  // ── TRAVEL TIPS INDIA ───────────────────────────────────────────────────
  if (/travel.*tip|tip.*travel|advice.*travel|how.*save.*money.*travel|budget.*travel.*tip/.test(m)) {
    return {
      text: "Top travel tips to save money in India! 💰\n\n**Flights:**\n✈️ Book 3–6 weeks in advance for domestic flights\n✈️ Tuesday/Wednesday departures are cheapest\n✈️ Early morning or late-night flights = lower fares\n✈️ Use Alvryn to compare all airlines at once!\n\n**Buses:**\n🚌 Overnight buses = save hotel cost + travel together\n🚌 KSRTC/MSRTC state buses cheaper than private\n🚌 AC Sleeper for overnight > AC Seater\n\n**Trains:**\n🚂 Book 60–120 days in advance on IRCTC\n🚂 Tatkal quota available 1 day before — slightly expensive\n🚂 3A class = good balance of price + comfort\n\n**General:**\n💡 Travel in shoulder season (Sep–Oct, Feb–Mar) for best prices\n💡 Weekday travel is cheaper than weekends\n💡 Book flights + hotel together for combo deals",
      cards: [], cta: null
    };
  }

  // ── BEST TIME TO VISIT ──────────────────────────────────────────────────
  if (/best time.*(visit|go|travel)|when.*visit|when.*travel|season.*visit|weather.*(.+)/.test(m)) {
    const dest = tN || fN || "India";
    const BTG = {
      "goa":"October to March — avoid monsoon (June–September)",
      "kerala":"September to March — backwaters, beaches, wildlife best in this period",
      "manali":"March to June for adventure, December to February for snow",
      "shimla":"March to June and September to November",
      "ladakh":"June to September only — roads are closed in winter",
      "rajasthan":"October to March — avoiding the scorching summer",
      "ooty":"April to June and September to November",
      "coorg":"September to March — coffee harvest season in Oct–Nov",
      "bangalore":"Year-round! Comfortable climate all year. Avoid heavy rains in Oct",
      "mumbai":"November to February — avoid June–September monsoon",
      "delhi":"October to March — avoid scorching summer and monsoon",
      "chennai":"November to February — avoid April–June heat",
      "hyderabad":"October to February — pleasant weather",
      "kolkata":"October to March",
      "jaipur":"October to March — Rajasthan winters are perfect",
      "varanasi":"October to March — avoid summer heat",
      "thailand":"November to April — dry season",
      "bali":"April to October — dry season",
      "singapore":"Year-round! Slight preference for Feb–April (least rain)",
      "dubai":"October to April — avoid summer (40°C+)",
      "default":"October to March is generally the best travel season for most of India"
    };
    const answer = BTG[dest.toLowerCase()] || BTG["default"];
    return {
      text: `📅 **Best time to visit ${dest}:**\n\n${answer}\n\nWant me to search flights or buses to ${dest}? Just say when! 😊`,
      cards: [], cta: null
    };
  }

  // ── PASSPORT / VISA ─────────────────────────────────────────────────────
  if (/visa|passport|document.*travel|travel.*document/.test(m)) {
    return {
      text: "📄 **Visa & Travel Documents — Quick Guide:**\n\n**For International Travel:**\n• Valid Indian passport (6 months validity required)\n• Visa for destination country\n• Return ticket + hotel booking (some countries require)\n\n**Visa-Free / Visa-on-Arrival for Indians:**\n🇹🇭 Thailand — 30 days visa-on-arrival\n🇮🇩 Bali/Indonesia — 30 days visa-on-arrival\n🇳🇵 Nepal — no visa needed!\n🇱🇰 Sri Lanka — e-visa, easy online\n🇲🇻 Maldives — visa-on-arrival free\n🇲🇾 Malaysia — 30 days visa-free\n🇮🇱 Mauritius — 60 days visa-free\n\n**Domestic India Travel:**\n• Valid ID (Aadhaar, PAN, Passport, Driving License)\n• No visa needed within India!\n\n💡 Always check official embassy website for latest requirements before booking.",
      cards: [], cta: null
    };
  }

  // ── REFUND / CANCELLATION ────────────────────────────────────────────────
  if (/refund|cancel|cancell|reschedule|change.*date|change.*ticket/.test(m)) {
    return {
      text: "❌ **Cancellation & Refund Info:**\n\nAlvryn is a search platform — bookings are made on partner sites. Cancellation policies depend on the partner:\n\n**Flights (via Aviasales):**\n• Cancellation policy varies by airline\n• Indigo: usually ₹3,000–4,000 cancellation fee\n• Air India: depends on fare class\n• Non-refundable fares cannot be cancelled\n• Contact airline directly for cancellation\n\n**Buses (via RedBus):**\n• Cancel 4+ hours before departure: 75–90% refund\n• Cancel 1–4 hours: 50% refund\n• Under 1 hour: no refund\n• Login to RedBus app → My Bookings → Cancel\n\n**Trains (IRCTC):**\n• Cancel online on irctc.co.in\n• Refund depends on class and time before departure\n• Tatkal tickets: no refund\n\n💡 Always read the cancellation policy before booking!",
      cards: [], cta: null
    };
  }

  // ── CHEAP TRAVEL GENERAL ────────────────────────────────────────────────
  if (/cheapest.*way|cheap.*travel|low.?cost|budget.*trip|save.*money.*trip|economical.*travel/.test(m)) {
    if (f && t) return null; // let medium/flight search handle specific routes
    return {
      text: "Here's how to travel as cheaply as possible! 💸\n\n**Cheapest options by type (low to high):**\n🚂 Train (Sleeper) = ₹150–500 for most routes (BOOK 60 DAYS EARLY!)\n🚌 Overnight bus = ₹300–1200\n✈️ Flight (budget, early booking) = ₹1500–4000 domestic\n\n**Money-saving hacks:**\n✅ Book flights 4–6 weeks early = save 30–50%\n✅ Overnight travel = save on one hotel night\n✅ Tuesday/Wednesday flights = 10–20% cheaper\n✅ Use Alvryn to compare instantly\n✅ Carry snacks — airport food is expensive!\n\nWhat route are you planning? Tell me and I'll find the best deal! 😊",
      cards: [], cta: null
    };
  }

  // ── BAGGAGE QUESTIONS ───────────────────────────────────────────────────
  if (/baggage|luggage|bag.*limit|kg.*allowed|cabin.*bag|check.?in.*bag/.test(m)) {
    return {
      text: "🧳 **Baggage allowance for Indian airlines:**\n\n**IndiGo:**\n• Cabin: 7 kg (1 bag)\n• Checked: 15 kg included on most tickets\n• Extra: ₹400–600 per extra kg\n\n**Air India:**\n• Cabin: 7 kg\n• Checked: 15–25 kg depending on route\n\n**SpiceJet:**\n• Cabin: 7 kg\n• Checked: 15 kg on most routes\n\n**Vistara:**\n• Economy: 15 kg checked\n• Premium Economy: 20 kg\n\n**Budget tip:** Book extra baggage online (while booking) — it's 50–70% cheaper than at airport!\n\n💡 Always verify on the airline's website when booking as policies change.",
      cards: [], cta: null
    };
  }

  // ── AIRPORT QUERIES ─────────────────────────────────────────────────────
  if (/airport.*bangalore|kia|kempegowda|blr airport|bengaluru airport/.test(m)) {
    return {
      text: "✈️ **Bengaluru Kempegowda International Airport (BLR):**\n\n**Getting to the airport:**\n🚌 **Vayu Vajra BMTC buses** — from Majestic, Shivajinagar, Marathahalli, Electronic City (₹250–350, best option!)\n🚖 **Ola/Uber** — ₹600–1200 from central Bangalore (1.5–2.5 hrs in traffic)\n🚕 **Pre-paid taxi** — from airport ₹700–1100 depending on zone\n🚇 **Metro** — Namma Metro Purple Line extended toward airport area (check current status)\n\n**Tips:**\n💡 Allow 2–3 hours during peak traffic (8–10 AM, 5–8 PM)\n💡 Vayu Vajra Bus: Book at bmtcinfo.com or just board at the stop\n💡 Terminal 1 = domestic, Terminal 2 = international + some domestic\n💡 Lounge access available with credit cards (Axis, HDFC Magnus, etc.)",
      cards: [], cta: null
    };
  }

  if (/airport.*mumbai|csia|chhatrapati shivaji|bom airport|mumbai airport/.test(m)) {
    return {
      text: "✈️ **Mumbai Chhatrapati Shivaji Maharaj International Airport (BOM):**\n\n**Getting to the airport:**\n🚇 **Metro Line 1** — connect at Ghatkopar or Andheri (nearest to T1)\n🚌 **BEST buses** — routes from Dadar, Bandra, Kurla\n🚖 **Ola/Uber** — ₹300–700 from South Mumbai, 45–90 min\n\n**Tips:**\n💡 T1 = domestic (Indigo, SpiceJet), T2 = Air India, Vistara + international\n💡 T1 to T2 = 15-min drive, connect bus available free\n💡 Allow 2–3 hours during peak hours\n💡 Parking at airport is expensive — Uber/Ola cheaper",
      cards: [], cta: null
    };
  }

  if (/airport.*delhi|igi airport|indira gandhi airport|del airport/.test(m)) {
    return {
      text: "✈️ **Delhi Indira Gandhi International Airport (DEL):**\n\n**Getting there:**\n🚇 **Airport Express Metro** — from New Delhi station, 20 min, ₹60–100 (BEST option!)\n🚖 **Ola/Uber** — ₹300–700 depending on zone\n🚌 **DTC buses** — various routes\n\n**Tips:**\n💡 T1 = IndiGo/SpiceJet domestic, T2 = domestic others, T3 = international + Air India\n💡 Airport Express Metro runs 5 AM–11:30 PM\n💡 Allow 2.5 hours for international, 1.5 for domestic",
      cards: [], cta: null
    };
  }

  // ── LOCAL BANGALORE TRANSPORT ────────────────────────────────────────────
  if (/electronic city|attibele|hosur|silk board/i.test(m)) {
    return {
      text: "🚌 **Electronic City / Attibele / Hosur Road transport:**\n\n**BMTC Buses from Silk Board:**\n• Route 365, 365A, 365C → Electronic City, Attibele\n• Route 356, 356A → Electronic City Phase 1 & 2\n• From Majestic: Routes via Silk Board, ~1.5 hours\n\n**From different areas:**\n• From Majestic (KBS) → Silk Board → E-City buses\n• From Jayanagar → Direct BMTC to E-City available\n• From Whitefield → Route 500C, change at Silk Board\n\n**Cab tips:**\n• Ola/Uber from central Bangalore: ₹350–600\n• Avoid peak hours: 8–10 AM and 5–8 PM on Hosur Road\n• Best time to travel: Before 8 AM or after 9 PM\n\n**Metro:** Green Line terminates near Silk Board area — take bus from there for the last stretch.",
      cards: [], cta: null
    };
  }

  if (/whitefield.*bangalore|bangalore.*whitefield|itpl|mahadevapura/.test(m)) {
    return {
      text: "🚌 **Getting to Whitefield, Bangalore:**\n\n🚇 **Metro (BEST)** — Purple Line now extended to Whitefield/ITPL (Kadugodi station)\n🚌 **BMTC Buses** — Routes from Majestic, Shivajinagar, KR Market\n🚖 **Cab** — ₹300–500 from central Bangalore (30–60 mins)\n\n**Tips:**\n💡 Metro is fastest — avoids Old Madras Road traffic\n💡 From airport: Take Vayu Vajra or cab to Whitefield (45–90 min, ₹600–900)",
      cards: [], cta: null
    };
  }

  if (/metro.*bangalore|namma metro|bmtc|local.*bus.*bangalore/.test(m)) {
    return {
      text: "🚇 **Namma Metro & BMTC — Bangalore:**\n\n**Metro Lines:**\n🟣 **Purple Line** — Whitefield (Kadugodi) ↔ Challaghatta (13 km extension opened!)\n🟢 **Green Line** — Nagasandra ↔ Silk Board\n⏳ **Yellow Line** — Coming soon: RV Road ↔ Bommasandra\n\n**Fare:** ₹10–60 depending on distance. Smart card gives 10% discount.\n\n**BMTC Tips:**\n• Vayu Vajra AC buses to airport: ₹250–350\n• Download BMTC app for routes\n• Routes starting with 5xx = Airport buses\n• Routes starting with V = Vajra AC buses\n\n**Ola/Uber vs Metro:**\n• Metro = faster during peak hours\n• Metro = ₹10–60 vs Ola ₹150–400 for same route",
      cards: [], cta: null
    };
  }

  // ── TRAIN SPECIFIC QUERIES ───────────────────────────────────────────────
  if (/tatkal|urgent.*ticket|last.*minute.*train|same.*day.*train/.test(m)) {
    return {
      text: "🚂 **Tatkal Tickets — Quick Guide:**\n\n**What is Tatkal?**\nLast-minute train booking quota — opens 1 day before journey at 10 AM (AC classes) and 11 AM (Sleeper).\n\n**Tatkal Charges (extra over base fare):**\n• Sleeper (SL): ₹100–200 extra\n• 3A (AC 3-tier): ₹300–400 extra\n• 2A (AC 2-tier): ₹400–500 extra\n\n**Tips to get Tatkal tickets:**\n✅ Be ready on IRCTC at 9:55 AM (AC) or 10:55 AM (Sleeper)\n✅ Have payment method ready (UPI fastest)\n✅ IRCTC website or mobile app\n✅ Premium Tatkal is more expensive but better availability\n\n⚠️ Tatkal tickets are non-refundable on cancellation.\n\nShall I open IRCTC for you?",
      cards: [], cta: null
    };
  }

  if (/pnr|train.*status|where.*train|train.*running|pnr.*status/.test(m)) {
    return {
      text: "🚂 **Check PNR Status & Train Running Status:**\n\n**PNR Status:**\n• SMS: SMS PNR <10-digit number> to 139\n• Website: indianrail.gov.in or enquiry.indianrail.gov.in\n• IRCTC app: My Bookings section\n• Google: Just type your PNR number!\n\n**Live Train Status:**\n• Website: enquiry.indianrail.gov.in\n• National Train Enquiry System: ntes.indianrail.gov.in\n• Call: 139 (Railway enquiry helpline)\n• Google: Type train number or name\n\n💡 Google is honestly the fastest — just type your PNR or train number directly!",
      cards: [], cta: null
    };
  }

  if (/irctc.*register|create.*irctc|irctc.*account|how.*book.*train/.test(m)) {
    return {
      text: "🚂 **How to register on IRCTC and book trains:**\n\n**Step 1: Create IRCTC account**\n• Go to irctc.co.in → Register\n• Fill details (name, mobile, email)\n• Verify mobile OTP\n• Takes 5 minutes!\n\n**Step 2: Book a ticket**\n1. Login to irctc.co.in\n2. Enter From, To, Date, Class\n3. Check availability\n4. Select train and coach class\n5. Add passenger details\n6. Pay via UPI/Net Banking/Card\n7. Ticket sent to email + SMS!\n\n**Tips:**\n💡 Book 120 days in advance for best availability\n💡 Tatkal opens 1 day before at 10 AM\n💡 UPI is fastest for payment\n\nWant me to pre-fill your route on IRCTC? Just tell me where you're going!",
      cards: [], cta: null
    };
  }

  // ── FLIGHT SPECIFIC QUERIES ──────────────────────────────────────────────
  if (/web.*check.*in|online.*check.*in|check.*in.*flight|boarding.*pass/.test(m)) {
    return {
      text: "✈️ **Flight Web Check-in Guide:**\n\n**IndiGo:**\n• Opens 48 hours before departure\n• goindigo.in → Manage Booking\n• Print/download boarding pass\n\n**Air India:**\n• Opens 48 hours before\n• airindia.in → Check-in\n\n**SpiceJet:**\n• Opens 48 hours before\n• spicejet.com → Check-in\n\n**At Airport:**\n• Arrive 2 hours before domestic, 3 hours before international\n• Security lane for web check-in passengers is usually faster\n• Carry valid photo ID (Aadhaar/PAN accepted)\n\n💡 DigiYatra app: Paperless boarding at major airports using face recognition!",
      cards: [], cta: null
    };
  }

  if (/cheapest.*flight.*day|best.*day.*book.*flight|when.*book.*cheap/.test(m)) {
    return {
      text: "✈️ **When to book cheap flights — the real data:**\n\n**Best days to FLY (cheapest):**\n• Tuesday and Wednesday = cheapest days to fly\n• Saturday night = surprisingly cheap\n• Friday and Sunday = most expensive\n\n**Best time to BOOK:**\n• Domestic India: 4–8 weeks before = sweet spot\n• International: 6–12 weeks before\n• Last-minute (1–2 days): Sometimes cheap on Aviasales!\n\n**Best departure times:**\n• Very early morning (5–7 AM) = cheapest\n• Late night (10 PM–12 AM) = cheap\n• Afternoon peak (12–3 PM) = most expensive\n\n**Seasonal tips:**\n• Diwali/Dussehra/New Year = book 3+ months early\n• Off-season travel = 30–50% cheaper\n\nWant me to search fares for your route?",
      cards: [], cta: null
    };
  }

  // ── GOA SPECIFIC ─────────────────────────────────────────────────────────
  if (/goa.*trip|trip.*goa|travel.*goa|visit.*goa|going.*goa/.test(m) && !f && !t) {
    return {
      text: "🏖️ **Goa Trip Planning Guide:**\n\n**Getting to Goa:**\n✈️ Flights — Bangalore (1h), Mumbai (1h), Delhi (2h), Chennai (1.5h)\n🚌 Buses — Overnight from Bangalore/Pune/Mumbai (8–12h), ₹800–1500\n🚂 Trains — Madgaon (Margao) station on Konkan Railway\n\n**Best beaches:**\n🌊 North Goa: Calangute, Baga (party scene), Anjuna, Vagator\n🌿 South Goa: Palolem, Colva (peaceful, cleaner)\n\n**Budget breakdown (per person, 3 days):**\n• Budget: ₹5,000–8,000 (hostel + bus)\n• Mid-range: ₹12,000–18,000 (3-star hotel + flight)\n• Luxury: ₹25,000+ (5-star, resort)\n\n**Best time:** October to March\n**Avoid:** June–September (monsoon, most beaches closed)\n\nWant me to search flights or buses to Goa from your city?",
      cards: [], cta: null
    };
  }

  // ── KERALA SPECIFIC ──────────────────────────────────────────────────────
  if (/kerala.*trip|trip.*kerala|backwater|alleppey|munnar|wayanad.*trip/.test(m)) {
    return {
      text: "🌴 **Kerala Trip Planning Guide:**\n\n**Top destinations:**\n🚤 **Alleppey (Alappuzha)** — Backwaters, houseboat stays (₹5,000–15,000/night)\n🍵 **Munnar** — Tea gardens, misty hills, trekking\n🌊 **Varkala** — Cliffside beach, laid-back vibe\n🐘 **Thekkady (Periyar)** — Wildlife, spice gardens\n🏖️ **Kovalam** — Beach near Trivandrum\n\n**Getting there:**\n✈️ Fly to Kochi (COK) — best for backwaters/Munnar\n✈️ Fly to Trivandrum (TRV) — best for Kovalam/Varkala\n🚂 Train to Ernakulam/Kochi — affordable\n\n**5-day itinerary suggestion:**\n• Day 1–2: Munnar (hills, tea gardens)\n• Day 3: Alleppey (houseboat)\n• Day 4: Kochi (Fort Kochi, spice market)\n• Day 5: Fly home\n\n**Best time:** September to March\nShall I search flights to Kochi or Trivandrum?",
      cards: [], cta: null
    };
  }

  // ── RAJASTHAN SPECIFIC ───────────────────────────────────────────────────
  if (/rajasthan.*trip|trip.*rajasthan|jaipur.*trip|udaipur.*trip|jodhpur.*trip/.test(m)) {
    return {
      text: "🏰 **Rajasthan Trip Planning Guide:**\n\n**Top cities:**\n👑 **Jaipur** (Pink City) — Amber Fort, Hawa Mahal, City Palace\n💙 **Jodhpur** (Blue City) — Mehrangarh Fort, blue houses\n🌸 **Udaipur** (City of Lakes) — Lake Pichola, City Palace, romantic\n🏜️ **Jaisalmer** — Desert safari, golden fort, camel rides\n🐪 **Pushkar** — Holy lake, Brahma temple, camel fair (Nov)\n\n**Golden Triangle:** Delhi → Jaipur → Agra (3–4 days)\n**Full Rajasthan circuit:** 7–10 days minimum\n\n**Getting there:**\n✈️ Fly to Jaipur (JAI) from Bangalore/Mumbai/Delhi\n🚂 Train from Delhi to Jaipur: 4.5 hours, very convenient\n\n**Budget:** ₹5,000–8,000/day (mid-range, including hotel + transport + food)\n\n**Best time:** October to March (avoid April–June heat 45°C+)\n\nShall I search flights or buses to Jaipur?",
      cards: [], cta: null
    };
  }

  // ── HIMACHAL / MANALI / SHIMLA ───────────────────────────────────────────
  if (/manali.*trip|shimla.*trip|himachal|spiti|rohtang|leh.*ladakh/.test(m)) {
    return {
      text: "🏔️ **Himachal Pradesh & Ladakh Trip Guide:**\n\n**Manali:**\n• Best time: March–June (snow, adventure) and Sep–Oct\n• Must-do: Solang Valley, Rohtang Pass (permit needed), Old Manali\n• Getting there: Fly to Bhuntar (KUL), then cab to Manali (1.5h)\n  OR overnight bus from Delhi (~14h, ₹700–1200)\n\n**Shimla:**\n• Getting there: Fly to Chandigarh, then cab/bus (3h)\n  OR toy train from Kalka (heritage, 5h, magical!)\n• Best time: March–June and Oct–Nov\n\n**Leh/Ladakh:**\n• Best time: June–September ONLY (road closed in winter)\n• Getting there: Direct flights from Delhi (1h), Bangalore (via Delhi)\n• Very high altitude (3500m) — acclimatize for 2 days on arrival!\n• Must-do: Pangong Lake, Nubra Valley, Monasteries\n\n**Spiti Valley:**\n• Route from Manali or Shimla, 4WD recommended\n• Best: June–October\n\nShall I search flights or buses for you?",
      cards: [], cta: null
    };
  }

  // ── BUDGET TRIP GENERAL ──────────────────────────────────────────────────
  if (/(budget|cheap|low.*cost|₹[0-9]+|under [0-9]+).*(trip|travel|vacation|weekend|tour)/.test(m) && !f && !t) {
    const budget_val = budget || 5000;
    return {
      text: `Here are the best budget trips under ₹${budget_val.toLocaleString()} from Bangalore! 💰\n\n**Under ₹3,000 (weekend):**\n🌿 **Coorg** — Bus ₹400 + homestay ₹800–1200/night = total ₹2,500\n🏔️ **Ooty** — Bus ₹350 + hotel ₹600/night = total ₹2,000\n⛩️ **Tirupati** — Bus ₹450 + temple visit = total ₹2,500\n\n**Under ₹6,000 (2 days):**\n🏖️ **Pondicherry** — Bus ₹450 + hotel ₹1,200 = ₹4,000 all-in\n🌊 **Hampi** — Bus ₹600 + hostel ₹500 = ₹3,500\n🌴 **Mysore** — Bus ₹250 + hotel ₹800 = ₹2,500\n\n**Under ₹10,000 (Goa):**\n• Overnight bus: ₹900 | Hotel: ₹1,200/night | Food: ₹500/day\n• Total 3-day Goa trip: ₹6,000–8,000!\n\nTell me which city you're traveling FROM and I'll give exact prices!`,
      cards: [], cta: null
    };
  }

  // ── FOOD ON JOURNEY ─────────────────────────────────────────────────────
  if (/food.*train|food.*flight|eat.*journey|snack.*travel|meal.*flight/.test(m)) {
    return {
      text: "🍱 **Food & Meals during travel:**\n\n**On Trains:**\n• Pantry car available on most long-distance trains\n• IRCTC e-catering: Order from restaurants at upcoming stations (irctctourism.co.in)\n• Price: ₹50–200 for meals (decent quality)\n• Tip: Carry dry snacks (biscuits, fruits, nuts) — they're cheaper and fill time!\n\n**On Flights:**\n• IndiGo/SpiceJet: No free meals (domestic)\n• Pre-order meals online: ₹150–350 (better than airport)\n• At airport: Budget ₹200–400 for a meal\n• Carry snacks through security — allowed!\n• Carry empty water bottle — fill after security\n\n**On Overnight Buses:**\n• AC sleeper buses usually stop at dhabas (1–2 stops)\n• Budget ₹100–200 for roadside meals\n• Bring snacks for comfort\n\n💡 Best hack: Eat a good meal before the journey and carry homemade snacks!",
      cards: [], cta: null
    };
  }

  // ── GENERAL THANKS / NICE ────────────────────────────────────────────────
  if (/^(thank|thanks|thx|ty|thank you|great|nice|awesome|perfect|good|ok|okay|cool|wow|amazing|super|excellent|👍|🙏|😊)/.test(m)) {
    return {
      text: "You're welcome! 😊 Happy to help!\n\nIs there anything else you'd like to know? I can help with:\n• Flight/bus/hotel/train searches\n• Trip planning and budgeting\n• Travel tips and destination guides\n• Local transport info\n\nJust ask! 🌍✈️",
      cards: [], cta: null
    };
  }

  // ── SPECIFIC ROUTE: No cities found ─────────────────────────────────────
  if (!f && !t) {
    // Hotel query without city
    if (isHotelQ) {
      return {
        text: "🏨 I'd love to help you find a hotel! Which city are you looking for?\n\nFor example: _'Hotels in Goa'_, _'Hotels in Mumbai under ₹2000'_, or _'Resorts in Coorg'_",
        cards: [], cta: null
      };
    }
    return null; // escalate to API
  }

  // ── ROUTE-SPECIFIC: BUS ──────────────────────────────────────────────────
  if (isBusQ && f && t) {
    let buses = BUS_DB.filter(b => b.from===f && b.to===t);
    if (!buses.length) buses = BUS_DB.filter(b => b.to===f && b.from===t);
    if (!buses.length) {
      return {
        text: `🚌 I'll search for buses from ${fN} to ${tN}!\n\nI don't have offline data for this route but RedBus has the latest availability. Let me pull that up for you!`,
        cards: [{type:"bus",operator:"Multiple operators",from:fN,to:tN,departure:"Various timings",arrival:"Various",duration:"Direct",price:null,label:"Check Live",insight:"Several operators run this route. Check RedBus for live availability and seat selection.",link:`https://www.redbus.in/bus-tickets/${f.replace(/\s+/g,"-")}-to-${t.replace(/\s+/g,"-")}`}],
        cta: "💡 Tap to see live bus availability, seats and real-time pricing on RedBus."
      };
    }
    const prices = buses.map(b=>b.price);
    const minP = Math.min(...prices);
    const isCheap = /cheap|sasta|lowest|budget|kam/i.test(m);
    if (isCheap) buses = [...buses].sort((a,b)=>a.price-b.price);
    const cards = buses.slice(0,3).map((b)=>{
      const h = parseInt((b.dep||"0").split(":")[0]);
      const insight = b.price===minP ? "Cheapest option on this route" : (h>=20||h<5) ? "Overnight — save on hotel cost!" : "Popular daytime option";
      return {type:"bus",operator:b.op,from:fN,to:tN,departure:b.dep,arrival:b.arr,duration:"Direct",price:b.price,type2:b.type,label:b.price===minP?"Best Price":null,insight,link:`https://www.redbus.in/bus-tickets/${f.replace(/\s+/g,"-")}-to-${t.replace(/\s+/g,"-")}`};
    });
    const overBudget = budget && minP > budget;
    let text = `🚌 Found **${buses.length} buses** from ${fN} to ${tN}!\n\n💰 Cheapest: **₹${minP}** (${cards[0]?.departure} departure, ${cards[0]?.operator})`;
    if (overBudget) text += `\n\n⚠️ Note: Cheapest bus is ₹${minP} — slightly above your ₹${budget} budget.`;
    return { text, cards, cta: "💡 Tap any card to check live seat availability on RedBus. Book early for best seats!" };
  }

  // ── ROUTE-SPECIFIC: TRAIN ────────────────────────────────────────────────
  if (isTrainQ && f && t) {
    const trainDateStr = date ? date.toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"}) : null;
    const trainDateISO = date ? date.toISOString().split("T")[0] : null;
    return {
      text: `🚂 Searching trains from ${fN} to ${tN}!${date?" Date: "+trainDateStr:""}\n\nMultiple trains run this route daily. I've pre-filled your details on IRCTC.\n\n**Fare guide:**\n• Sleeper (SL): ₹150–400\n• AC 3-tier (3A): ₹400–800\n• AC 2-tier (2A): ₹700–1,500\n• 1st Class (1A): ₹1,500–3,000`,
      cards:[{type:"train",from:fN,to:tN,label:"IRCTC",date:trainDateStr,insight:"Book 60 days early for best availability. Tatkal opens 1 day before at 10 AM.",link:buildTrainURL(f,t,trainDateISO)}],
      cta: "💡 Tap to open IRCTC with your route pre-filled. Just select class and pay!"
    };
  }

  // ── ROUTE-SPECIFIC: HOTEL ────────────────────────────────────────────────
  if (isHotelQ && (f || t)) {
    const city = t || f;
    const cityN = city.charAt(0).toUpperCase()+city.slice(1);
    const pr = HOTEL_PRICES[city] || "700–4,000";
    const budgetNote = budget ? ` Looking for options around ₹${budget}/night.` : "";
    return {
      text: `🏨 Hotels in ${cityN} — let me find the best options for you!${budgetNote}\n\n💡 **Pro tips for ${cityN}:**\n• Book 2–4 weeks in advance for best rates\n• Read recent reviews (last 3 months)\n• Check cancellation policy before booking`,
      cards:[{type:"hotel",city:cityN,priceRange:pr,label:"Best Rates",insight:`Popular destination — book early for best prices in ${cityN}.`,link:`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}`}],
      cta: "💡 Tap to browse all available hotels on Booking.com with live prices and reviews."
    };
  }

  return null; // let medium handle flight DB lookup
}


// ── TIER 2: Medium — DB lookup + formatted response ───────────────────────────
async function mediumResponse(msg) {
  const m = msg.toLowerCase();
  const { from, to } = extractCities(msg);
  const f = from ? normCity(from) : null;
  const t = to ? normCity(to) : null;
  const { date } = extractDate(msg);
  const budget = extractBudget(msg);
  const isCheap = /cheap|sasta|lowest|budget|kam|affordable/i.test(m);
  const isFastest = /fastest|quick|earliest|direct|express/i.test(m);

  // Local area transport query (attibele, etc.)
  const isLocal = /attibele|hosur|electronic city|silk board|whitefield|koramangala|hsr|indiranagar|btm|hebbal|yelahanka|peenya|kengeri|nice road|airport|bus.*number|route.*number/i.test(m);
  if (isLocal) {
    // Return structured local transport info
    return {
      text: buildLocalTransportAnswer(m),
      cards: [], cta: null
    };
  }

  if (!f || !t) return null;
  const fN = f.charAt(0).toUpperCase()+f.slice(1);
  const tN = t.charAt(0).toUpperCase()+t.slice(1);
  const ddmm = date ? (date.getDate().toString().padStart(2,"0")+(date.getMonth()+1).toString().padStart(2,"0")) : "";

  // Flight DB lookup
  try {
    let q = "SELECT * FROM flights WHERE LOWER(from_city)=$1 AND LOWER(to_city)=$2";
    const v = [f, t];
    if (date) { q += " AND DATE(departure_time)=$3"; v.push(date.toISOString().split("T")[0]); }
    if (budget) { q += ` AND price <= $${v.length+1}`; v.push(budget); }
    q += isCheap ? " ORDER BY price ASC LIMIT 4" : " ORDER BY departure_time ASC LIMIT 4";
    const rows = (await pool.query(q, v)).rows;

    if (!rows.length) {
      // No DB data — return affiliate-only
      const affLink = buildFlightURL(f, t, ddmm, 1);
      const budgetWarn = budget ? `\n\n💡 I couldn't find flights within ₹${budget} in my database. Check live fares — prices change frequently.` : "";
      return {
        text: `✈️ Searching flights from **${fN}** to **${tN}**! Let me connect you to live fares.${budgetWarn}`,
        cards:[{type:"flight",airline:"Multiple Airlines",from:fN,to:tN,fromCode:CITY_IATA_SRV[f]||(f.slice(0,3).toUpperCase()),toCode:CITY_IATA_SRV[t]||(t.slice(0,3).toUpperCase()),departure:"—",arrival:"—",duration:"Check live",price:null,label:"Live Fares",insight:"Click to see live fares from 700+ airlines on Aviasales.",link:affLink}],
        cta:"💡 Prices may increase as the date approaches — check now for the best deals."
      };
    }

    const prices = rows.map(r=>r.price);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const cards = rows.map((row,i)=>{
      const dep = new Date(row.departure_time).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false});
      const arr = new Date(row.arrival_time).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false});
      const dur = Math.round((new Date(row.arrival_time)-new Date(row.departure_time))/60000);
      const h = new Date(row.departure_time).getHours();
      let label=null,insight=null;
      if (row.price===minP)      { label="Best Price"; insight=`Cheapest on this route. Save ₹${maxP-minP} vs priciest option.`; }
      else if (i===1&&isFastest) { label="Fastest";    insight="Quick departure, arrives earliest."; }
      else if (i===2)            { label="Best Overall"; insight="Good balance of price and timing."; }
      if (!insight && h>=5&&h<9) insight="Morning flights are typically 15–20% cheaper on this route.";
      return {type:"flight",airline:row.airline,from:fN,to:tN,fromCode:(row.from_city||f).slice(0,3).toUpperCase(),toCode:(row.to_city||t).slice(0,3).toUpperCase(),departure:dep,arrival:arr,duration:`${Math.floor(dur/60)}h ${dur%60}m`,price:row.price,label,insight,link:buildFlightURL(f,t,ddmm,1)};
    });

    const cheapest = rows.reduce((a,b)=>a.price<b.price?a:b);
    const cheapDep = new Date(cheapest.departure_time).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false});
    const overBudget = budget && minP>budget;
    let textMsg = `✈️ Found **${rows.length} flights** from ${fN} to ${tN}!`;
    if (date) textMsg += ` on ${date.toLocaleDateString("en-IN",{day:"numeric",month:"short"})}`;
    textMsg += `\n\n💰 Cheapest: **₹${minP.toLocaleString()}** (${cheapDep} departure, ${cheapest.airline})`;
    if (overBudget) textMsg += `\n\n⚠️ Note: All flights are above your ₹${budget} budget. Consider a bus — I can show those too!`;
    else if (budget) textMsg += `\n\n✅ All options are within your ₹${budget} budget!`;

    await logEvent("ai_chat", `${f} → ${t}`, "ai_chat", null);
    return {
      text: textMsg,
      cards,
      cta: isCheap ? "💡 Book soon — prices tend to rise closer to the date. 🔥" : "💡 Tap any card to check live prices on Aviasales."
    };
  } catch(e) {
    return null;
  }
}

// ── Local transport knowledge base ───────────────────────────────────────────
function buildLocalTransportAnswer(m) {
  if (/attibele|hosur road|electronic city|silk board/i.test(m)) {
    return "🚌 **Getting to/from Attibele / Electronic City area (Bangalore):**\n\n• **BMTC Buses:** Routes 365, 365A, 365C from Silk Board / Jayadeva Hospital\n• **From Majestic (KBS):** Bus routes via Silk Board — takes 1–1.5 hrs\n• **Metro:** Green Line to Silk Board (Carmelaram area), then local bus\n• **Cab (Ola/Uber):** ₹400–600 from central Bangalore, 45–90 min depending on traffic\n• **Hosur Road traffic tip:** Avoid 8–10 AM and 5–8 PM — severe congestion\n\nFor intercity from Hosur: TNSTC and KSRTC buses from Silk Board run to Chennai and Coimbatore.";
  }
  if (/whitefield/i.test(m)) {
    return "🚌 **Getting to Whitefield (Bangalore):**\n\n• **Purple Line Metro:** Now extended to Whitefield (ITPL / Kadugodi station)\n• **BMTC Buses:** Routes from Majestic, Shivajinagar, KR Market\n• **Cab:** ₹300–500 from central Bangalore\n• **Tip:** Metro is the fastest option — avoids traffic on Old Madras Road.";
  }
  if (/airport|kempegowda|bengaluru airport|blr airport/i.test(m)) {
    return "✈️ **Getting to/from Bengaluru Airport (BLR):**\n\n• **Namma Metro:** Purple Line → Kempapura, then KIAL Metro (upcoming — check latest status)\n• **BMTC Vayu Vajra:** AC express buses from Majestic, Shivajinagar, Marathahalli — ₹250–400\n• **Cab (Ola/Uber):** Pre-paid from airport ₹600–1000, varies by zone\n• **KSRTC:** Buses to Mysore, Hassan, Mangalore directly from airport\n\n💡 Allow 1.5–2 hrs from central Bangalore during peak hours.";
  }
  return "🚌 For local transport queries in Bangalore, I'd recommend checking the BMTC app or Google Maps for the most accurate live routes. For intercity travel, just tell me your route and I'll find the best options!";
}

// ── TIER 3: GPT-4o-mini for complex queries ───────────────────────────────────
const AI_CALL_LIMIT = 10; // per phone/user per day
const aiCallCounts = new Map(); // userId → {count, date}

function canCallAI(userId) {
  if (!userId) return true; // web users have no limit
  const today = new Date().toDateString();
  const rec = aiCallCounts.get(String(userId));
  if (!rec || rec.date !== today) return true;
  return rec.count < AI_CALL_LIMIT;
}
function incrementAI(userId) {
  if (!userId) return;
  const today = new Date().toDateString();
  const rec = aiCallCounts.get(String(userId));
  if (!rec || rec.date !== today) aiCallCounts.set(String(userId), {count:1,date:today});
  else aiCallCounts.set(String(userId), {count:rec.count+1,date:today});
}

// ═══════════════════════════════════════════════════════════════════════════════
//  AI ENGINE — buildCards + callGPT + callClaude + /ai-chat endpoint
// ═══════════════════════════════════════════════════════════════════════════════

// ── Build travel cards from intent (NO DB, pure affiliate links) ──────────────
function buildCardsFromIntent(message) {
  const m   = message.toLowerCase();
  const { from, to } = extractCities(message);
  const f   = from ? normCity(from) : null;
  const t   = to   ? normCity(to)   : null;
  const { date } = extractDate(message);
  const fN  = f ? f.charAt(0).toUpperCase()+f.slice(1) : "";
  const tN  = t ? t.charAt(0).toUpperCase()+t.slice(1) : "";
  const ddmm = date ? (String(date.getDate()).padStart(2,"0")+String(date.getMonth()+1).padStart(2,"0")) : "";

  const isBus   = /\bbus\b|buses|coach|redbus|sleeper/i.test(m);
  const isHotel = /hotel|stay|accommodation|resort/i.test(m);
  const isTrain = /\btrain\b|railway|irctc/i.test(m);

  const cards = [];

  if (f && t) {
    if (isBus) {
      // Try local data first
      const buses = BUS_DB.filter(b=>b.from===f&&b.to===t).slice(0,2);
      if (buses.length) {
        buses.forEach((b,i)=>cards.push({type:"bus",operator:b.op,from:fN,to:tN,departure:b.dep,arrival:b.arr,duration:"Direct",price:b.price,label:i===0?"Best Price":null,insight:b.price===Math.min(...buses.map(x=>x.price))?"Cheapest on this route":null,link:buildBusURL(f,t)}));
      } else {
        cards.push({type:"bus",operator:"Multiple operators",from:fN,to:tN,departure:"Various",arrival:"Various",duration:"Check live",price:null,label:"Available",insight:"Tap to see live seats and prices on RedBus.",link:buildBusURL(f,t)});
      }
    } else if (isTrain) {
      const trainDateStr = date ? date.toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"}) : null;
      const trainDateISO = date ? date.toISOString().split("T")[0] : null;
      cards.push({type:"train",from:fN,to:tN,label:"IRCTC",date:trainDateStr,insight:"Sleeper ₹150–400 · 3AC ₹400–800 · 2AC ₹700–1500. Book early!",link:buildTrainURL(f,t,trainDateISO)});
    } else if (isHotel) {
      const city = t||f;
      const pr = HOTEL_PRICES[city.toLowerCase()]||"700–4,000";
      cards.push({type:"hotel",city:tN||fN,priceRange:pr,label:"Best Rates",insight:"Live hotel prices on Booking.com.",link:`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}`});
    } else {
      // Default: flight
      cards.push({type:"flight",airline:"Multiple Airlines",from:fN,to:tN,fromCode:(CITY_IATA_SRV[f]||(f.slice(0,3).toUpperCase())),toCode:(CITY_IATA_SRV[t]||(t.slice(0,3).toUpperCase())),departure:"—",arrival:"—",duration:"Direct",price:null,label:"Live Fares",insight:"Tap to see live fares from all major airlines.",link:buildFlightURL(f,t,ddmm,1)});
    }
  } else if (isHotel && (f||t)) {
    const city = t||f||"India";
    const pr = HOTEL_PRICES[city.toLowerCase()]||"700–4,000";
    cards.push({type:"hotel",city:city.charAt(0).toUpperCase()+city.slice(1),priceRange:pr,label:"Best Rates",insight:"Check Booking.com for live prices and availability.",link:`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}`});
  }

  return cards;
}

// ── Try DB flight lookup (wrapped safely) ─────────────────────────────────────
async function tryDBFlights(message) {
  try {
    const { from, to } = extractCities(message);
    const f = from ? normCity(from) : null;
    const t = to   ? normCity(to)   : null;
    if (!f || !t) return null;
    const { date } = extractDate(message);
    const budget = extractBudget(message);
    const isCheap = /cheap|lowest|budget|sasta/i.test(message);
    const fN = f.charAt(0).toUpperCase()+f.slice(1);
    const tN = t.charAt(0).toUpperCase()+t.slice(1);
    const ddmm = date ? (String(date.getDate()).padStart(2,"0")+String(date.getMonth()+1).padStart(2,"0")) : "";

    let q = "SELECT * FROM flights WHERE LOWER(from_city)=$1 AND LOWER(to_city)=$2";
    const v = [f, t];
    if (date) { q += " AND DATE(departure_time)=$3"; v.push(date.toISOString().split("T")[0]); }
    if (budget) { q += ` AND price <= $${v.length+1}`; v.push(budget); }
    q += isCheap ? " ORDER BY price ASC LIMIT 4" : " ORDER BY departure_time ASC LIMIT 4";

    const rows = (await pool.query(q, v)).rows;
    if (!rows.length) return null;

    const prices = rows.map(r=>r.price);
    const minP = Math.min(...prices), maxP = Math.max(...prices);
    const cards = rows.map((row,i)=>{
      const dep = new Date(row.departure_time).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false});
      const arr = new Date(row.arrival_time).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false});
      const dur = Math.round((new Date(row.arrival_time)-new Date(row.departure_time))/60000);
      let label=null, insight=null;
      if (row.price===minP)       { label="Best Price"; insight=`Cheapest! Save ₹${maxP-minP} vs most expensive option.`; }
      else if (i===1)             { label="Fastest";    insight="Quick departure time."; }
      else if (i===2)             { label="Best Overall"; insight="Good balance of price and timing."; }
      const h = new Date(row.departure_time).getHours();
      if (!insight && h>=5&&h<9)  insight = "Morning flights are typically 15–20% cheaper.";
      return {type:"flight",airline:row.airline,from:fN,to:tN,
        fromCode:(CITY_IATA_SRV[f]||f.slice(0,3).toUpperCase()),
        toCode:(CITY_IATA_SRV[t]||t.slice(0,3).toUpperCase()),
        departure:dep,arrival:arr,duration:`${Math.floor(dur/60)}h ${dur%60}m`,
        price:row.price,label,insight,link:buildFlightURL(f,t,ddmm,1)};
    });
    const cheapest = rows.reduce((a,b)=>a.price<b.price?a:b);
    const dep = new Date(cheapest.departure_time).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false});
    const overBudget = budget && minP>budget;
    let text = `✈️ Found **${rows.length} flights** from ${fN} to ${tN}!${date?" on "+date.toLocaleDateString("en-IN",{day:"numeric",month:"short"}):""}\n\n💰 Cheapest: **₹${minP.toLocaleString()}** — ${cheapest.airline} at ${dep}`;
    if (overBudget) text += `\n\n⚠️ All flights are above your ₹${budget} budget. Want me to suggest buses instead?`;
    else if (budget) text += `\n\n✅ These options are within your ₹${budget} budget!`;
    return { text, cards, cta: "💡 Book soon — prices rise closer to the date. Tap any card for live fares!" };
  } catch { return null; }
}

// ── Smart fallback text (never show error to user) ────────────────────────────
function smartFallback(message) {
  const m = message.toLowerCase();
  const { from, to } = extractCities(message);
  const f = from ? normCity(from) : null;
  const t = to   ? normCity(to)   : null;
  const fN = f ? f.charAt(0).toUpperCase()+f.slice(1) : "";
  const tN = t ? t.charAt(0).toUpperCase()+t.slice(1) : "";
  const cards = buildCardsFromIntent(message);

  // Context-aware messages
  if (/suggest.*cheap|cheapest.*one|which.*cheap|best.*deal|best.*option/i.test(m)) {
    const prev_from = fN||"your origin";
    const prev_to   = tN||"your destination";
    return {
      text: `🎯 Best deal for ${prev_from} → ${prev_to}!\n\n✈️ **Flights:** Book 4–6 weeks early (Tue/Wed cheapest)\n🚌 **Buses:** Overnight AC sleeper — save on hotel too\n🚂 **Trains:** Book 60 days ahead on IRCTC\n\nTap below for live prices 👇`,
      cards,
      cta: "💡 Prices change daily — check live for the latest deals."
    };
  }

  if (f && t) {
    const isBus   = /\bbus\b/i.test(m);
    const isTrain = /\btrain\b/i.test(m);
    const type    = isBus?"bus":isTrain?"train":"flight";
    const emoji   = isBus?"🚌":isTrain?"🚂":"✈️";
    return {
      text: `${emoji} Finding best ${type} options from **${fN}** to **${tN}**! Tap below for live prices and availability. 👇`,
      cards,
      cta: "💡 Click to see live prices, seats and book instantly on our partner site."
    };
  }

  if (/hotel|stay/i.test(m) && (f||t)) {
    return {
      text: `🏨 Best hotels in **${tN||fN}**! Browse live options on Booking.com — filter by price, rating and location. 👇`,
      cards, cta: "💡 Tap to browse live hotel prices."
    };
  }

  // Generic helpful fallback
  return {
    text: "Hey! I'm here to help. 😊\n\nTry asking me:\n• \"Cheapest flight Bangalore to Delhi\"\n• \"Bus Chennai to Hyderabad tonight\"\n• \"Hotels in Goa under \u20b92000\"\n• \"Plan 2-day Goa trip under \u20b98000\"\n\nWhat would you like? 🌍",
    cards: [], cta: null
  };
}

// ── GPT-4o-mini call (only for complex queries) ───────────────────────────────
async function callGPT(message, history, cards) {
  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY) return null; // No key → use fallback

  const systemPrompt = `You are Alvryn AI, a friendly and smart travel assistant for India.
Keep responses SHORT (3–5 sentences max). Never write essays.
Start with a warm opener: "Got it! 👍", "Great choice!", "On it! 🔍"
Always end with ONE soft action: "Want me to check hotels too?" or "Should I compare buses as well?"
Personality: helpful friend, not a robot. Use emojis naturally.
Rules:
- Prices may vary → always mention this
- If budget mentioned, respect it strictly
- Never say "I had trouble" or show errors — always give useful info
- Only answer travel questions. For non-travel: "I'm a travel specialist! Ask me about flights, buses, hotels or trip planning."
- Data provided is real — reference it naturally`;

  let dataCtx = "";
  if (cards?.length) {
    dataCtx = "\n\nReal data:";
    cards.forEach(c => {
      if (c.type==="flight") dataCtx += ` Flight: ${c.airline} ${c.fromCode}→${c.toCode} ${c.departure||""} ₹${c.price||"live"}.`;
      if (c.type==="bus")    dataCtx += ` Bus: ${c.operator} ${c.from}→${c.to} ${c.departure} ₹${c.price}.`;
      if (c.type==="hotel")  dataCtx += ` Hotels in ${c.city}: ₹${c.priceRange}/night.`;
      if (c.type==="train")  dataCtx += ` Train: ${c.from}→${c.to} IRCTC.`;
    });
  }

  const msgs = [
    ...history.slice(-4).map(h=>({role:h.role==="user"?"user":"assistant",content:h.role==="user"?h.content:(h.text||"")})).filter(h=>h.content),
    {role:"user",content:message+dataCtx}
  ];

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions",{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${OPENAI_KEY}`},
      body:JSON.stringify({model:"gpt-4o-mini",messages:[{role:"system",content:systemPrompt},...msgs],max_tokens:280,temperature:0.75})
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch { return null; }
}

// ── Per-user daily AI call counter ───────────────────────────────────────────
const dailyAiCalls = new Map();
const DAILY_LIMIT  = 10;
function getUserAiCount(userId) {
  const today = new Date().toDateString();
  const rec = dailyAiCalls.get(String(userId));
  if (!rec || rec.date !== today) return 0;
  return rec.count;
}
function incrementUserAi(userId) {
  const today = new Date().toDateString();
  const rec = dailyAiCalls.get(String(userId));
  if (!rec || rec.date !== today) dailyAiCalls.set(String(userId), {count:1,date:today});
  else dailyAiCalls.set(String(userId), {count:rec.count+1,date:today});
}

// ── /ai-chat — BULLETPROOF, never crashes, never shows error ─────────────────
app.post("/ai-chat", authenticateToken, async (req, res) => {
  const { message, history=[] } = req.body || {};
  if (!message) return res.status(400).json({message:"No message"});

  const userId = req.user?.id;

  try {
    // ── TIER 1: Instant knowledge base (no API, no DB) ────────────────────────
    const easy = easyResponse(message);
    if (easy) {
      logEvent("ai_easy", message.slice(0,80), "ai_chat", userId).catch(()=>{});
      return res.json(easy);
    }

    // ── TIER 2: DB flight lookup (safe, wrapped) ──────────────────────────────
    const dbResult = await tryDBFlights(message);
    if (dbResult) {
      logEvent("ai_medium", message.slice(0,80), "ai_chat", userId).catch(()=>{});
      return res.json(dbResult);
    }

    // ── TIER 3: GPT-4o-mini for complex queries ───────────────────────────────
    const userCallCount = getUserAiCount(userId);
    if (userCallCount >= DAILY_LIMIT) {
      const cards = buildCardsFromIntent(message);
      return res.json({
        text: `You've used your ${DAILY_LIMIT} free AI responses for today. 🎯\n\nBook a flight, bus or hotel through Alvryn to unlock more AI responses instantly!\n\nMeanwhile, here are the best options I found for you 👇`,
        cards, cta: "💡 Book via Alvryn to get unlimited AI responses."
      });
    }

    // Build cards from intent (no DB, pure affiliate links — safe)
    const cards = buildCardsFromIntent(message);

    // Try GPT
    incrementUserAi(userId);
    const remaining = DAILY_LIMIT - getUserAiCount(userId);
    const gptText = await callGPT(message, history, cards);

    if (gptText) {
      const limitNote = remaining <= 3 ? `\n\n_💡 ${remaining} AI response${remaining===1?"":"s"} left today — book via Alvryn to unlock more._` : "";
      logEvent("ai_api", message.slice(0,80), "ai_chat", userId).catch(()=>{});
      return res.json({ text: gptText + limitNote, cards, cta: cards.length?"💡 Tap any card to check live prices on our partner site.":null });
    }

    // ── FINAL FALLBACK: Always something useful, never an error ──────────────
    const fallback = smartFallback(message);
    return res.json(fallback);

  } catch(e) {
    // ABSOLUTE last resort — still useful, never an error message
    console.error("AI Chat:", e.message);
    try {
      const fallback = smartFallback(message);
      return res.json(fallback);
    } catch {
      return res.json({
        text: "Let me find the best travel options for you! 😊\n\nTry: _\"flights from Bangalore to Delhi tomorrow\"_ or _\"bus to Goa tonight\"_",
        cards: [], cta: null
      });
    }
  }
});

// ── WAITLIST ─────────────────────────────────────────────────────────────────
async function ensureWaitlistTable() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS waitlist (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255),
      source VARCHAR(60) DEFAULT 'web',
      created_at TIMESTAMP DEFAULT NOW()
    )`);
  } catch(e) { console.error("Waitlist table:", e.message); }
}
ensureWaitlistTable().catch(console.error);

app.post("/waitlist", async (req, res) => {
  try {
    const { email, name, source } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });
    await pool.query(
      "INSERT INTO waitlist (email, name, source) VALUES ($1,$2,$3) ON CONFLICT (email) DO NOTHING",
      [email.trim().toLowerCase(), name||"", source||"web"]
    );
    res.json({ message: "Added to waitlist!" });
  } catch(e) { res.status(500).json({ message: "Server error" }); }
});

app.get("/admin/waitlist", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM waitlist ORDER BY created_at DESC LIMIT 200");
    res.json(r.rows);
  } catch(e) { res.status(500).json({ message: "Server error" }); }
});

// ── ADMIN ROUTES ─────────────────────────────────────────────────────────────
app.get("/admin/bookings", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM bookings ORDER BY created_at DESC LIMIT 200");
    res.json(r.rows);
  } catch(e) { res.status(500).json({ message: "Server error" }); }
});

app.get("/admin/users", async (req, res) => {
  try {
    const r = await pool.query("SELECT id,name,email,phone,created_at FROM users ORDER BY id DESC LIMIT 200");
    res.json(r.rows);
  } catch(e) { res.status(500).json({ message: "Server error" }); }
});

app.get("/admin/promo-codes", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM promo_codes ORDER BY created_at DESC");
    res.json(r.rows);
  } catch(e) { res.status(500).json({ message: "Server error" }); }
});

// ── START SERVER ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`ALVRYN BACKEND running on port ${PORT}`);
});