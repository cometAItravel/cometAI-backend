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
        reply = `🏨 *Hotels in ${displayCity}*\n\n💡 I'll find the best options via our partner.\n\n👉 Tap to view hotels:\nhttps://www.booking.com/searchresults.html?ss=${encodeURIComponent(displayCity)}\n\n_Best prices on other booking sites · Prices may vary_`;
        session.step = "idle";
      }
    }
    else if (session.step === "asking_hotel_city") {
      const displayCity = msg.charAt(0).toUpperCase() + msg.slice(1);
      reply = `🏨 *Hotels in ${displayCity}*\n\n👉 Tap to view:\nhttps://www.booking.com/searchresults.html?ss=${encodeURIComponent(displayCity)}\n\n_Prices may vary. Live availability on other booking sites._`;
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

  // If reply is long (>600 chars), send summary + link
  const MAX_WA_LEN = 600;
  let finalReply = reply;
  if (reply.length > MAX_WA_LEN) {
    const sessionId = `wa_${phone.replace(/[^0-9]/g,"")}_${Date.now()}`;
    // Store WA conversation for web handoff
    storeWAMessage(phone, "assistant", reply);
    const shortReply = reply.slice(0, 300) + "...\n\n🔗 *View complete plan on Alvryn:*\nhttps://alvryn.in/wa/" + sessionId.slice(-8);
    finalReply = shortReply;
  }

  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(finalReply);
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
    "salem":"SA","erode":"ED","tirunelveli":"TEN","vellore":"VLR",
    "vijayawada":"BZA","guntur":"GNT","hubli":"UBL","belgaum":"BGM",
    "jodhpur":"JU","bikaner":"BKN","ajmer":"AII","kota":"KOTA",
    "gwalior":"GWL","bhopal":"BPL","indore":"INDB","jabalpur":"JBP",
  };
  const fc = TC[from?.toLowerCase()]||(from||"").slice(0,4).toUpperCase();
  const tc = TC[to?.toLowerCase()]  ||(to||"").slice(0,4).toUpperCase();
  // IRCTC date format: DD-MM-YYYY (confirmed working format)
  let dateParam = "";
  if (dateStr) {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d)) {
        const dd  = String(d.getDate()).padStart(2,"0");
        const mm  = String(d.getMonth()+1).padStart(2,"0");
        const yyyy = d.getFullYear();
        // IRCTC accepts both formats — use DD-MM-YYYY
        dateParam = `&journeyDate=${dd}-${mm}-${yyyy}`;
      }
    } catch {}
  }
  // Full IRCTC pre-fill URL with all parameters
  return `https://www.irctc.co.in/nget/train-search?fromStation=${fc}&toStation=${tc}&isCallFromDpDown=true${dateParam}&quota=GN&class=SL`;
}

// ── TIER 1: Classify query complexity ────────────────────────────────────────
function classifyQuery(msg) {
  const m = msg.toLowerCase();
  const hasRoute = !!(extractCities(msg).from && extractCities(msg).to);

  // EASY — stored knowledge handles all of these (no API needed)
  const isGreeting       = /^(hi+|hello+|hey+|hlo+|heyy*|namaste|vanakkam|hai|sup|yo|gm|gn|howdy)/.test(m) || m.length <= 5;
  const isAboutAlvryn    = /what.*alvryn|who.*are.*you|how.*work|is.*free|what.*do.*you/i.test(m);
  const isBookingHelp    = /how.*book|how.*cancel|refund|cancell|how.*pay/i.test(m);
  const isBaggageQ       = /baggage|luggage|kg.*allow|cabin.*bag/i.test(m);
  const isVisaPassport   = /visa|passport|document.*travel/i.test(m);
  const isThanks         = /^(thank|thanks|thx|ty|great|nice|awesome|perfect|ok|okay|cool|wow)/.test(m);
  const isPopularDest    = /popular.*destination|best.*place|top.*tourist|where.*to.*go/i.test(m);
  const isTravelTips     = /travel.*tip|budget.*tip|packing.*list|how.*save.*money/i.test(m);
  const isPnrStatus      = /pnr|train.*status|running.*status/i.test(m);
  const isTatkal         = /tatkal|urgent.*ticket|last.*minute.*train/i.test(m);
  const isIrctcHelp      = /irctc.*register|create.*irctc|how.*book.*train/i.test(m);
  const isWebCheckin     = /web.*check|online.*check|boarding.*pass/i.test(m);
  const isFoodQ          = /food.*train|food.*flight|eat.*journey|meal.*flight/i.test(m);
  const isDestTrip       = /(goa|kerala|rajasthan|manali|shimla|ladakh|ooty|coorg|hampi|pondicherry|andaman|kashmir).*(trip|visit|travel|tour)/i.test(m);
  const isIntlDest       = /(burma|myanmar|vietnam|cambodia|sri lanka|thailand|bali|singapore|dubai|london|paris|new york).*(trip|visit|travel|guide|how.*reach)/i.test(m);
  const isBestTime       = /best.*time|best.*season|best.*month|when.*visit|when.*travel/i.test(m);
  const isLocalArea      = /attibele|hosur|electronic city|silk board|whitefield|koramangala|hsr|indiranagar|btm|hebbal|yelahanka|peenya|majestic|blr.*airport|bangalore.*airport/i.test(m);
  const isLocalTransport = /bmtc|vayu vajra|namma metro|auto.*fare|metro.*route|bus.*number|which.*bus|how.*reach/i.test(m);

  if (isGreeting || isAboutAlvryn || isBookingHelp || isBaggageQ ||
      isVisaPassport || isThanks || isPopularDest || isTravelTips ||
      isPnrStatus || isTatkal || isIrctcHelp || isWebCheckin ||
      isFoodQ || isDestTrip || isIntlDest || isBestTime) {
    return "easy";
  }

  if (isLocalArea || isLocalTransport) return "medium";
  if (hasRoute) return "medium"; // try DB, fallback to affiliate links

  // HARD — only truly complex queries that stored data can't handle
  const isComplexTrip = /plan.*trip|trip.*plan|itinerary|full.*trip|complete.*trip|multi.*city|suggest.*route/i.test(m);
  const isBudgetCombo = /bus.*and.*hotel|flight.*and.*hotel|cheapest.*combo|total.*cost/i.test(m);
  if (isComplexTrip || isBudgetCombo) return "hard";

  // Default: easy (stored data handles most general questions)
  return "easy";
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
    const greetVariants = [
      `${timeGreet}! 👋 Welcome to Alvryn — where travel planning actually becomes fun!\n\nI'm your AI travel buddy 🧳 (basically a travel agent, but I never put you on hold 😄)\n\n✈️ **Flights** — cheapest fares, India & international\n🚌 **Buses** — overnight AC sleepers, all major routes\n🏨 **Hotels** — budget to 5-star luxury\n🚂 **Trains** — IRCTC with everything pre-filled (you're welcome!)\n🗺️ **Full trip plans** — door-to-door, within your budget\n\nUsed to spend 2 hours comparing prices? I do it in 2 seconds ⚡\n\nSo... where are we going today? 🌍`,

      `${timeGreet}! I'm Alvryn AI 🤖✈️\n\nImagine having a friend who's been everywhere, remembers every price, and is awake 24/7 just to help you travel cheaper 😎\nThat's me! (except I don't eat your food 😂)\n\nHere's what I can do:\n🔥 Find cheapest flights in seconds\n🌙 Overnight buses so you save on hotels\n🏨 Hotels for every budget\n🚂 Train bookings pre-filled on IRCTC\n🗺️ Complete trip plans within your budget\n\nGo ahead — tell me where you want to go!\nWhat's the plan? 🌟`,

      `${timeGreet}! Namaste! 🙏 I'm Alvryn AI — your 24/7 travel companion!\n\n🎯 Finding cheap travel used to mean:\n— Opening 10 tabs\n— Comparing prices for 2 hours\n— Crying at the total 😂\n\nWith me? Just type where you're going!\n\n✈️ Flights · 🚌 Buses · 🏨 Hotels · 🚂 Trains · 🗺️ Trip planning\n\nAll in one conversation. Zero drama. Just great deals.\nWhat's your next adventure? 🚀`,
    ];
    return { text: greetVariants[Math.floor(Math.random()*greetVariants.length)], cards: [], cta: null };
  }

  // ── WHAT IS ALVRYN ────────────────────────────────────────────────────────
  if (/what.*(is|are).*(alvryn|this|you|site|app|platform)|who.*are.*you|tell.*about.*yourself|how.*does.*this.*work|how.*does.*alvryn.*work/.test(m)) {
    return {
      text: "Alvryn is India's smartest travel search platform! 🚀\n\nHere's how it works:\n\n1️⃣ You tell me where you want to go\n2️⃣ I search across 700+ airlines, buses, hotels and trains\n3️⃣ I show you the best options sorted by price, speed and value\n4️⃣ You click to book on our partner site (Aviasales, RedBus, other booking sites, IRCTC)\n\n**Why Alvryn?**\n✅ Find cheapest fares instantly\n✅ Compare flights, buses AND trains side by side\n✅ AI understands natural language — type like you talk\n✅ Works in English, Hindi, Tamil, and even with typos!\n\nAlvryn earns a small commission from partners when you book — at no extra cost to you. 🙏",
      cards: [], cta: null
    };
  }

  // ── HOW TO BOOK ──────────────────────────────────────────────────────────
  if (/how.*(to|do i|can i).*(book|buy|purchase|reserve|order)|booking.*process|steps.*book/.test(m)) {
    return {
      text: "Booking through Alvryn is super easy! Here's how:\n\n**Step 1:** Tell me your route (e.g. \"flight from Bangalore to Mumbai on April 20\")\n**Step 2:** I show you the best options with prices\n**Step 3:** Click **\"Check Live Prices\"** on the flight/bus card\n**Step 4:** You land on our partner site (Aviasales/RedBus/other booking sites/IRCTC) with your route pre-filled\n**Step 5:** Complete the booking and payment there\n\n💡 **Tip:** Booking is done on our partner site — they handle payment and send you the confirmation ticket. Alvryn doesn't charge anything extra!",
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

    // ── INTERNATIONAL DESTINATION QUERIES ───────────────────────────────────
  if (/burma|myanmar/i.test(m)) {
    return {
      text: "🇲🇲 **Myanmar (Burma) Travel Guide:**\n\n**Getting there from India:**\n✈️ Flights from Yangon: Bangalore (~3.5h via Bangkok), Delhi (~3h via Bangkok)\n💰 Fare estimate: ₹15,000–35,000 return\n\n**Visa:**\n• e-Visa available online: visa.gov.mm (~$50)\n• Visa on arrival at Yangon airport available\n\n**Top places:**\n🕌 Bagan — thousands of ancient temples (UNESCO heritage)\n🌅 Inle Lake — floating villages, stunning sunrise\n🏙️ Yangon — Shwedagon Pagoda, colonial architecture\n🏔️ Mandalay — royal palace, Mandalay Hill\n\n**Best time:** November to February (cool & dry)\n**Budget:** ₹3,000–5,000/day (very affordable!)\n**Currency:** Myanmar Kyat (MMK). Carry USD cash — better rates.\n\n⚠️ **Important:** Check current travel advisories before booking — situation can change.\n\nShall I search flights from Bangalore to Yangon? 😊",
      cards: [], cta: null
    };
  }

  if (/vietnam/i.test(m)) {
    return {
      text: "🇻🇳 **Vietnam Travel Guide:**\n\n**Getting there:**\n✈️ Bangalore → Ho Chi Minh City: ~5h (via Bangkok/Singapore)\n💰 Fare estimate: ₹18,000–40,000 return\n\n**Visa:** e-Visa online, $25, easy process\n**Top places:** Hanoi, Ha Long Bay, Hoi An, Ho Chi Minh City\n**Best time:** November to April\n**Budget:** ₹2,500–4,500/day\n\nShall I search flights? 😊",
      cards: [], cta: null
    };
  }

  if (/cambodia|angkor/i.test(m)) {
    return {
      text: "🇰🇭 **Cambodia (Angkor Wat) Travel Guide:**\n\n✈️ Bangalore → Phnom Penh/Siem Reap: ~6h (via Bangkok)\n💰 Fare estimate: ₹20,000–45,000 return\n\n**Visa:** e-Visa $36 online\n**Must visit:** Angkor Wat (UNESCO, world's largest temple complex!)\n**Best time:** November to March\n**Budget:** ₹2,000–3,500/day\n\nShall I search flights? 😊",
      cards: [], cta: null
    };
  }

  if (/sri lanka|ceylon|colombo/i.test(m) && !hasRoute) {
    return {
      text: "🇱🇰 **Sri Lanka Travel Guide:**\n\n✈️ Bangalore → Colombo: ~1.5h (shortest international flight from South India!)\n💰 Fare estimate: ₹8,000–18,000 return\n\n**Visa:** ETA online, $35, instant approval\n**Top places:** Sigiriya Rock, Kandy, Galle, Yala Safari, Ella\n**Best time:** December to April (West coast)\n**Budget:** ₹3,000–6,000/day\n\nExcellent weekend trip from Bangalore! Shall I search flights? 😊",
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
      cta: "💡 Tap to browse all available hotels on other booking sites with live prices and reviews."
    };
  }


  // ── MORE INTERNATIONAL DESTINATIONS ──────────────────────────────────────
  if (/usa|united states|america.*trip|trip.*america/i.test(m) && !(/flight|fly/).test(m)) {
    return { text: "🇺🇸 **Visiting the USA? Here's your quick guide!**\n\n**Top destinations for Indians:**\n🗽 **New York** — Times Square, Central Park, Statue of Liberty\n🎬 **Los Angeles** — Hollywood, Venice Beach, Disneyland\n🌉 **San Francisco** — Golden Gate Bridge, Alcatraz, Napa Valley\n🎰 **Las Vegas** — Casinos, shows, Grand Canyon nearby\n🌴 **Florida** — Disney World, Miami Beach, Universal Studios\n\n**Visa:** B1/B2 Tourist Visa — apply 3-4 months ahead, $185 fee\n**Best time:** April–June & September–October (avoid peak summer)\n**Budget:** ₹8,000–15,000/day for mid-range travel\n**Currency:** USD ($1 ≈ ₹84)\n\nWhich US city are you heading to? I'll plan the whole thing! 😊", cards:[], cta:null };
  }

  if (/europe|europe.*trip|trip.*europe/i.test(m) && !(/flight|fly/).test(m)) {
    return { text: "🇪🇺 **Europe Trip Guide for Indians!**\n\nEurope is STUNNING and more doable than you think! 🎉\n\n**Best cities for first-timers:**\n🗼 **Paris** — Eiffel Tower, Louvre, croissants 🥐\n🏰 **London** — Big Ben, Buckingham Palace, pubs\n🌊 **Barcelona** — Gaudi, beaches, tapas\n🎨 **Amsterdam** — canals, museums, tulips\n🏔️ **Switzerland** — Alps, chocolate, insanely beautiful\n\n**Schengen Visa:** Covers 26 countries! Apply 3-4 months ahead\n**Best time:** May–June & September (avoid peak Jul-Aug)\n**Budget tip:** Paris + London + Amsterdam in 10 days ≈ ₹1.5–2L total (if you plan smart!)\n\nWhich country/city interests you? 😊", cards:[], cta:null };
  }

  if (/japan|tokyo|osaka|kyoto/i.test(m) && !(/flight|fly/).test(m)) {
    return { text: "🇯🇵 **Japan — The most unique country you'll ever visit!** 🌸\n\nSeriously, Japan will ruin every other country for you (in the best way 😂)\n\n**Must-visit:**\n🗼 Tokyo — Shibuya crossing, Akihabara, Tsukiji Fish Market\n⛩️ Kyoto — 1000+ temples, geishas, bamboo groves\n🏯 Osaka — best street food in Asia, Osaka Castle\n🌸 Mt Fuji — worth every yen\n🦌 Nara — deer literally bow to you!\n\n**Visa:** Japan visa — apply through embassy, usually 2-3 weeks\n**Best time:** March-April (cherry blossoms 🌸) or Oct-Nov (autumn colors)\n**Budget:** ₹6,000–12,000/day (surprisingly affordable for quality!)\n**IC Card:** Buy Suica/Pasmo card for all trains/metro\n\nFlight from Bangalore: ~₹35,000–60,000 return\nShall I search? 😊", cards:[], cta:null };
  }

  if (/australia|sydney|melbourne/i.test(m) && !(/flight|fly/).test(m)) {
    return { text: "🇦🇺 **Australia — Where kangaroos actually exist** 🦘😄\n\n**Top spots:**\n🦘 Sydney — Opera House, Harbour Bridge, Bondi Beach (stunning!)\n☕ Melbourne — coffee capital, street art, Great Ocean Road\n🐠 Great Barrier Reef — best diving in the world\n🪨 Uluru — sacred red rock in the outback\n🐨 Cairns — koalas, rainforest, reef\n\n**Visa:** Australian Tourist Visa (subclass 600) — ₹8,000–12,000, takes 2-3 weeks\n**Best time:** Sep–Nov (spring) or Mar–May (autumn)\n**Currency:** AUD ($1 AUD ≈ ₹55)\n**Budget:** ₹8,000–15,000/day\n\nFlights from India: ~₹55,000–90,000 return\nSydney is cheapest to fly into from Bangalore/Mumbai.", cards:[], cta:null };
  }

  if (/canada|toronto|vancouver/i.test(m) && !(/flight|fly/).test(m)) {
    return { text: "🇨🇦 **Canada — Maple syrup and massive kindness** 🍁\n\n**Top destinations:**\n🏙️ Toronto — CN Tower, Niagara Falls nearby, multicultural food scene\n🌊 Vancouver — mountains + ocean, Banff National Park nearby\n🏔️ Banff — arguably the most beautiful place on Earth 🤩\n🎭 Montreal — French vibes, incredible food, affordable\n\n**Visa:** Canada Tourist Visa — can be tricky, apply 3-4 months ahead\n**Best time:** June–August (summers gorgeous), Dec-Feb for snow/skiing\n**Currency:** CAD ($1 CAD ≈ ₹63)\n**Indian community:** Very large! Especially in Brampton/Toronto\n\nFlights: ~₹55,000–85,000 return from India", cards:[], cta:null };
  }

  if (/nepal|kathmandu|everest|pokhara/i.test(m) && !(/flight|fly/).test(m)) {
    return { text: "🇳🇵 **Nepal — India's magical neighbour!** 🏔️\n\nAnd the BEST part? Indians don't need a visa! 🎉\n\n**Why Nepal is amazing:**\n🏔️ Everest Base Camp trek — bucket list item #1\n🛕 Kathmandu — temples, culture, amazing food (momos!)\n🌊 Pokhara — Phewa Lake, paragliding, Annapurna views\n🐘 Chitwan — jungle safari, rhinos, elephants\n\n**For Indians:**\n✅ No visa needed — just carry Aadhaar/Passport\n✅ Indian currency accepted (₹1 = NPR 1.6)\n✅ Direct flights from most Indian cities\n✅ Only 1.5–2 hours from Delhi/Patna/Lucknow\n\n**Budget:** Super affordable — ₹2,000–4,000/day!\n\nFlight from Bangalore: ₹8,000–20,000 return 😊", cards:[], cta:null };
  }

  if (/oman|muscat/i.test(m) && !(/flight|fly/).test(m)) {
    return { text: "🇴🇲 **Oman — The hidden gem of the Middle East!** 💎\n\nWhile everyone goes to Dubai, smart travellers go to Oman 😄\n\n**Why Oman?**\n🏖️ Beautiful beaches + deserts + mountains (all in one country!)\n🕌 Mutrah Souq — best traditional market in the Gulf\n🏜️ Wahiba Sands — desert camping under stars\n🌊 Wadi Shab — swimming in an emerald canyon\n🐢 Ras Al Jinz — watch sea turtles hatch!\n\n**Visa:** e-Visa available, easy process\n**Budget:** ₹4,000–8,000/day (cheaper than Dubai!)\n**Best time:** October to March\n\nFlight from Bangalore: ~₹12,000–25,000 return", cards:[], cta:null };
  }

  if (/turkey|istanbul|cappadocia/i.test(m) && !(/flight|fly/).test(m)) {
    return { text: "🇹🇷 **Turkey — East meets West!** 🌙\n\nIstanbul is literally split between Europe and Asia — on two different continents! How cool is that?! 🤩\n\n**Must-see:**\n🕌 Istanbul — Hagia Sophia, Blue Mosque, Grand Bazaar\n🎈 Cappadocia — hot air balloons over fairy chimneys (Instagram gold!)\n🏊 Pamukkale — natural white travertine terraces\n🏖️ Turkish Riviera — Antalya, Bodrum, crystal clear water\n🥙 Turkish food — kebabs, baklava, Turkish tea 😍\n\n**Visa:** e-Visa online, easy, $60\n**Best time:** April–June & September–November\n**Currency:** Lira (currently great exchange rate for Indians!)\n**Budget:** Very affordable — ₹3,000–6,000/day!\n\nFlight from India: ~₹30,000–55,000 return", cards:[], cta:null };
  }

  if (/georgia.*country|tbilisi|batumi/i.test(m)) {
    return { text: "🇬🇪 **Georgia (the country, not the US state!) — Europe's hidden secret** 🏔️\n\nIndians are discovering this gem in huge numbers now! Here's why:\n\n✅ **Indians get visa on arrival!** (Just ₹5,000 or free!)\n✅ Incredibly affordable — cheapest wine in the world 🍷\n✅ Stunning Caucasus mountains\n✅ Ancient churches older than most civilizations\n✅ Warm, friendly people\n\n**Top spots:**\n🏙️ Tbilisi — old town, sulphur baths, rooftop bars\n🎿 Gudauri — skiing in the Caucasus (Dec-Mar)\n🏖️ Batumi — Black Sea resort town\n⛰️ Kazbegi — mind-blowing mountain views\n\n**Budget:** ₹2,500–5,000/day (amazing value!)\n\nFlights: ~₹20,000–35,000 return from India", cards:[], cta:null };
  }

  if (/new zealand|auckland|queenstown/i.test(m) && !(/flight|fly/).test(m)) {
    return { text: "🇳🇿 **New Zealand — Middle Earth is real!** 🌿\n\n(Yes, they literally filmed Lord of the Rings here 😄)\n\n**Why NZ blows people's minds:**\n🎿 Queenstown — bungee jumping capital, skiing, adventure sports\n🌋 Rotorua — geysers, Maori culture, bubbling mud pools\n🐑 South Island — fjords, glaciers, absurd natural beauty\n🌊 Bay of Islands — sailing, dolphins, beaches\n🏔️ Milford Sound — one of the most beautiful places on Earth\n\n**Visa:** NZeTA (easy online) + visitor visa\n**Best time:** Dec–Feb (NZ summer) for outdoors; Jun–Aug for skiing\n**Budget:** ₹10,000–18,000/day\n\nFlights from India: ~₹65,000–95,000 return (long haul but worth it!)", cards:[], cta:null };
  }

  // ── INDIAN TOURIST DESTINATIONS (MORE DETAIL) ───────────────────────────
  if (/andaman|port blair|havelock|neil island/i.test(m) && !(/flight|fly/).test(m)) {
    return { text: "🏝️ **Andaman & Nicobar Islands — India's own tropical paradise!** 🌊\n\nAnd you won't believe it — you DON'T need a passport! It's India! 😄\n\n**Best islands:**\n🏖️ Havelock Island (Swaraj Dweep) — Radhanagar Beach (Asia's best beach!)\n🤿 Neil Island (Shaheed Dweep) — snorkelling paradise\n🏙️ Port Blair — Cellular Jail (powerful history), Ross Island\n🦈 Barren Island — India's only active volcano!\n\n**How to reach:**\nFlight: Chennai/Kolkata/Delhi → Port Blair (2–3 hours)\nFerry: Kolkata/Chennai → Port Blair (overnight ship, experience in itself!)\n\n**Best time:** October to May (avoid monsoon Jun-Sep)\n**Budget:** ₹4,000–8,000/day including accommodation\n\n💡 **Pro tip:** Book government ferries between islands 2-3 weeks ahead!", cards:[], cta:null };
  }

  if (/kashmir|srinagar|dal lake|gulmarg|pahalgam/i.test(m) && !(/flight|fly/).test(m)) {
    return { text: "🏔️ **Kashmir — Heaven on Earth (for real!)** ❄️\n\n*'Gar firdaus bar-roo-e zameen ast, hameen ast, hameen ast!'*\n(If there is paradise on earth, it is here, it is here, it is here!) 🕌\n\n**Must-see:**\n🌊 Dal Lake — houseboat stay, shikara ride at sunrise (magical!)\n⛷️ Gulmarg — best skiing in Asia, gondola ride\n🌸 Pahalgam — Betaab Valley, Aru Valley, rafting\n🌺 Tulip Garden — largest in Asia (March-April only)\n🏔️ Sonamarg — glaciers, trek to Thajiwas glacier\n\n**Best time:**\n• March–April: Tulips in bloom, everything turns green\n• July–August: Cool, lush, green\n• December–February: Snow, skiing (Gulmarg)\n\n**Budget:** ₹3,000–7,000/day\n⚠️ Check current travel advisories before booking.", cards:[], cta:null };
  }

  if (/lakshadweep|agatti|kavaratti/i.test(m)) {
    return { text: "🏝️ **Lakshadweep — India's most pristine islands!** 💙\n\nCoral reefs, turquoise water, and almost no tourists — this is luxury travel without the insane price tag!\n\n**Key facts:**\n✅ Indian territory — no passport needed\n⚠️ Entry permit required (apply in advance)\n🤿 Best snorkelling/diving in India\n🚫 Alcohol not available on most islands\n\n**Best islands:** Agatti, Bangaram, Kadmat, Lakshadweep islands\n\n**How to reach:**\n✈️ Flights: Kochi → Agatti (cheapest entry point)\n🚢 Ships from Kochi (takes 14-20 hours, check schedule)\n\n**Best time:** October to April\n**Budget:** ₹6,000–15,000/day (resorts are pricier due to remoteness)", cards:[], cta:null };
  }

  if (/spiti|spiti valley|kaza|tabo/i.test(m)) {
    return { text: "🏔️ **Spiti Valley — India's most surreal landscape!** 🌌\n\nForget Instagram filters — this place IS the filter 😄\n\n**Why Spiti is unique:**\n🏜️ Cold desert at 4,000m+ altitude\n🛕 500-year-old monasteries hanging off cliffs\n🌌 Best stargazing in India (zero light pollution)\n❄️ One of the most remote inhabited places on Earth\n🦁 Snow leopard territory\n\n**Route options:**\n🚗 Shimla → Kaza (Hindustan-Tibet Highway) — longer, more scenic\n🚗 Manali → Kaza (Kunzum Pass) — open only June-October\n\n**Key spots:** Kaza (base), Ki Monastery, Chandratal Lake, Tabo, Pin Valley\n\n**Best time:** June to September ONLY (roads closed in winter)\n**Budget:** ₹2,000–4,000/day (very affordable once you're there)\n⚠️ Altitude sickness is real — acclimatize properly!", cards:[], cta:null };
  }

  if (/meghalaya|shillong|cherrapunji|mawlynnong/i.test(m)) {
    return { text: "🌧️ **Meghalaya — The Scotland of the East!** 🌿\n\n(Also the wettest place on Earth, but hey, that's why it's so green! 😄)\n\n**Must-see:**\n🌉 Living Root Bridges — trees trained to form actual bridges over 500+ years!\n💧 Nohkalikai Falls — one of India's tallest waterfalls\n🏘️ Mawlynnong — cleanest village in Asia\n🏊 Dawki — crystal clear river, you can see the bottom 10m down!\n🗻 Shillong Peak — views across the entire plateau\n\n**From Bangalore:**\n✈️ Fly to Guwahati → drive to Shillong (3 hrs)\nOR Fly directly to Shillong (limited flights)\n\n**Best time:** October–May (avoid monsoon unless you love rain!)\n**Budget:** ₹2,500–5,000/day\n**Bonus:** Food is amazing — Jadoh, Dohneiiong, smoked pork!", cards:[], cta:null };
  }

  if (/coorg|kodagu|madikeri/i.test(m) && !(/flight|fly/).test(m)) {
    return { text: "☕ **Coorg (Kodagu) — The Scotland of India!** 🌿\n\n(Everyone calls their fav place 'Scotland of India' but Coorg really earns it 😄)\n\n**Why Coorg is special:**\n☕ Coffee estates you can actually stay on and wake up to the smell of fresh coffee\n🌊 Abbey Falls, Iruppu Falls — stunning\n🐘 Dubare Elephant Camp — feed and bathe elephants!\n⛰️ Tadiandamol peak — highest in Karnataka, great trek\n🌿 Nagarhole/Kabini — tiger reserve nearby\n\n**From Bangalore:** 5–6 hours by road (270km)\n**Stay options:** Coffee estate homestays (₹1,500–4,000/night — AMAZING experience)\n**Best time:** October to March (avoid monsoon unless you love mist and rain)\n**Budget:** ₹3,000–6,000/day total\n\nBonus: Try Coorg pandi curry and bamboo shoot curry! 🍛", cards:[], cta:null };
  }

  if (/hampi/i.test(m) && !(/flight|fly/).test(m)) {
    return { text: "🏛️ **Hampi — India's most mind-blowing ancient city!** 🗿\n\nSeriously, Hampi is a UNESCO World Heritage Site and one of the most visited places in Karnataka. And yet somehow it still feels undiscovered! 😄\n\n**Why Hampi is unforgettable:**\n🏛️ Virupaksha Temple — still active, 7th century\n🗿 Giant Monolithic Bull — Nandi that'll make your jaw drop\n⛰️ Boulder landscapes — looks like another planet\n🚤 Tungabhadra river — coracle boat rides (circular boat, SO fun!)\n👑 Vittala Temple — famous stone chariot\n🚲 Best explored by cycle-rickshaw or bicycle\n\n**From Bangalore:** Overnight bus (₹400–600) or train to Hospet (then 15km to Hampi)\n**Best time:** October to February\n**Budget:** ₹1,500–3,000/day (very backpacker-friendly!)", cards:[], cta:null };
  }

  // ── PRACTICAL TRAVEL INFO ─────────────────────────────────────────────────
  if (/best.*credit.*card|travel.*credit.*card|zero forex|niyo|indus.*ind/i.test(m)) {
    return { text: "💳 **Best cards for international travel (no forex fees!):**\n\n🏆 **Niyo Global Card** — Zero forex fees, free ATM withdrawals abroad, load in ₹\n🏆 **IndusInd Pinnacle/Scapes** — Zero forex markup, good rewards\n🏆 **HDFC Regalia** — 2% forex markup, excellent rewards\n🏆 **Axis Vistara/Miles & More** — Good for frequent flyers\n\n**For beginners:** Niyo Global is BEST — easy app, free to use, reload from UPI\n\n**Before international travel:**\n✅ Inform your bank (call or app)\n✅ Check if card has contactless (most places abroad use tap-to-pay)\n✅ Carry some cash backup (local currency)\n✅ Save international helpline number\n\n💡 Niyo Global vs regular debit card:\n• Regular card: Pays ₹2,400 in forex fees on ₹1,00,000 spend\n• Niyo Global: Pays ₹0 forex fees! 🎉", cards:[], cta:null };
  }

  if (/travel insurance|trip insurance|medical.*abroad|insurance.*travel/i.test(m)) {
    return { text: "🛡️ **Travel Insurance — Don't skip this!**\n\nHonestly, travel insurance is the one thing most Indians skip and then regret 😅\n\n**Why you NEED it:**\n🏥 Medical emergency abroad can cost ₹5–50 LAKH without insurance\n✈️ Flight cancellation reimbursement\n🧳 Lost baggage coverage\n🔒 Trip cancellation coverage\n\n**Recommended providers:**\n🏆 Bajaj Allianz Travel Insurance — good coverage, affordable\n🏆 HDFC ERGO Travel Insurance — reliable claims\n🏆 Niva Bupa — good for families\n\n**Cost:** ₹500–2,000 for a 2-week international trip\n**Where to buy:** Bank app, PolicyBazaar, or insurers directly\n\n**For Schengen visa:** Travel insurance is MANDATORY (min €30,000 coverage)\n\n💡 **Pro tip:** Buy insurance RIGHT AFTER booking flights — pre-existing cancellation coverage starts then!", cards:[], cta:null };
  }

  if (/currency exchange|forex|where.*exchange.*money|how.*exchange/i.test(m)) {
    return { text: "💱 **Currency Exchange — Get the best rates!**\n\n🚫 **WORST places to exchange:**\n• Airport forex counters (rates are 5-8% worse)\n• Hotel exchange desks\n• Random shops at tourist spots\n\n✅ **BEST ways to get foreign currency:**\n\n**1. Niyo Global / Wise Card** 🏆\nLoad ₹ from UPI, use abroad. Zero forex fees. Best rate every time.\n\n**2. Bookmyforex / EbixCash**\nBook online at good rates, home delivery or airport pickup\n\n**3. Thomas Cook / Centrum Forex**\nPhysical stores in major cities. Rates better than banks.\n\n**4. Your Bank (last resort)**\nHDFC/SBI/ICICI — decent rates but service charges apply\n\n💡 **Emergency abroad:** Use a Visa/MC debit card at local ATMs (better rate than manual exchange)", cards:[], cta:null };
  }

  if (/solo.*travel|travelling alone|first.*solo/i.test(m)) {
    return { text: "🎒 **Solo Travel Guide — The most liberating thing you'll do!**\n\nSolo travel is scary for 5 minutes and then you'll wonder why you waited so long 😄\n\n**Best solo trip destinations for Indians:**\n🏖️ **Goa** — safe, fun, tons of solo travellers\n🌿 **Rishikesh** — adventure, yoga, amazing solo community\n🌊 **Varkala, Kerala** — chill beach, safe, beautiful\n🏔️ **Manali** — hostels full of other solo travellers\n🌏 **Bangkok/Bali** — international classic solo trips\n🇳🇵 **Nepal** — very solo-traveller friendly, no visa for Indians\n\n**Solo travel tips:**\n✅ Stay in hostels — instant friend-making!\n✅ Share your itinerary with family\n✅ Keep emergency contacts saved\n✅ Trust your gut — if something feels wrong, leave\n✅ Buy travel insurance (especially for international)\n\nSolo travel will change your life. Book it. Go! 🚀", cards:[], cta:null };
  }

  if (/group.*travel|travelling.*friends|friends.*trip|group.*trip/i.test(m)) {
    return { text: "👫 **Group Trip Planning — Making it work without drama!** 😄\n\n(Every group trip has that one person who's always late. Plan accordingly 😂)\n\n**Making group travel smooth:**\n\n**1. Budget planning first**\nSplit into: transport + accommodation + food + activities\nUse Splitwise app to track shared expenses\n\n**2. Best destinations for groups:**\n🏖️ Goa — everyone has something to do\n🌿 Coorg — homestays with common areas\n🏔️ Manali — adventure for all levels\n🌊 Pondicherry — culture + beach mix\n\n**3. Accommodation tips:**\nRent a villa/house > book individual rooms (cheaper + more fun!)\nSearch for group/villa stays on our Hotels section\n\n**4. Transport tips:**\nTempo Traveller (12-seater) — cheapest per head for 8+ people\nCar rental pooling — 5-6 people in an SUV\n\n**5. Rule for harmony:**\nEveryone contributes to one activity each person REALLY wants. That's it! 😄", cards:[], cta:null };
  }

  if (/honeymoon|couples.*trip|romantic.*trip|anniversary.*trip/i.test(m)) {
    return { text: "💕 **Honeymoon & Romantic Trip Ideas!**\n\nAlvryn is blushing helping with this but here goes 😄❤️\n\n**Best romantic destinations:**\n\n**India:**\n🌊 **Andaman** — private beaches, snorkelling, sunsets\n🏔️ **Manali** — snow, cozy cafés, couple activities\n🌿 **Munnar, Kerala** — misty mountains, tea gardens, houseboat\n🏰 **Udaipur** — City of Lakes, palace hotels, so romantic!\n🏖️ **Goa** — beach sunsets, Portuguese architecture\n\n**International:**\n🏝️ **Maldives** — overwater bungalows (₹60,000–1.5L/night but SO worth it!)\n🌺 **Bali** — rice fields, temples, villa with private pool\n🇹🇭 **Thailand, Phuket** — luxury at budget prices\n🗼 **Paris** — cliché but it's cliché for a reason 😄\n\n**Budget tips:**\nMaldives on budget: Stay in guesthouses on local islands (₹5,000–8,000/night vs ₹60,000 at resorts!) 🤫", cards:[], cta:null };
  }



  // ── FLIGHT-SPECIFIC KNOWLEDGE ──────────────────────────────────────────────
  if (/why.*flight.*expensive|flight.*price.*high|why.*price.*increase/i.test(m)) {
    return { text: "✈️ **Why flight prices go up and down (the honest truth!):**\n\n🕐 **Time before departure:**\n• 6-8 weeks ahead = CHEAPEST (sweet spot!)\n• 2-3 weeks = Prices start rising\n• Last week = Usually most expensive\n• Last minute = Sometimes cheap (airlines dumping unsold seats — lottery!)\n\n📅 **Day of the week matters:**\n• Tuesday/Wednesday = Cheapest to FLY\n• Monday/Friday = Most expensive (business travel)\n• Book on Tuesday/Wednesday = Sometimes 10% cheaper\n\n⏰ **Time of day:**\n• Early morning (5-7am) = Cheapest\n• Late night (10pm-midnight) = Often cheap\n• Afternoon = Most expensive\n\n📆 **Season:**\n• School holidays = 40-60% more expensive\n• Shoulder season (Apr-May, Sep-Oct) = Best deals\n\n💡 **The real reason:** Airlines use dynamic pricing algorithms that adjust every hour based on demand, competition and seat availability. They're not being evil — they're being nerds! 😄", cards:[], cta:null };
  }

  if (/direct.*flight|non.?stop|layover.*good|one.*stop/i.test(m)) {
    return { text: "✈️ **Direct vs Connecting flights — which is better?**\n\n**Direct (Non-stop) ✅**\n• Faster, less stressful\n• Better for: business travel, elderly, families with kids\n• Usually 20-40% more expensive\n\n**Connecting flight ⏱️**\n• Usually cheaper (sometimes by ₹5,000-15,000 on international!)\n• If layover is 4+ hours: can explore the connecting city!\n• Dubai, Singapore, Abu Dhabi are popular layover cities\n\n**Sweet layover spots:**\n🇸🇬 Singapore Changi Airport — considered the world's best airport (shops, butterfly garden, cinema!)\n🇦🇪 Dubai Airport — huge, great duty free\n🇶🇦 Doha Hamad — new, beautiful, comfortable\n\n**My advice:**\n• Under 4 hours layover = fine, book it if it saves money\n• Under 2 hours layover = bit risky (what if first flight delays?)\n• Over 4 hours = get a transit visa, explore the city! 😄", cards:[], cta:null };
  }

  if (/web check.?in|online check.?in|seat select|choose seat/i.test(m)) {
    return { text: "💺 **Web Check-in Guide — Do this before your flight!**\n\n**Why web check-in:**\n✅ Choose your seat (window/aisle!)\n✅ Skip the check-in queue at airport\n✅ Faster security clearance\n✅ Sometimes get better seats for free\n\n**How to do it:**\n**IndiGo:** goindigo.in → Manage Booking → Check-in (opens 48 hours before)\n**Air India:** airindia.in → Check-in (opens 48 hours before)\n**SpiceJet:** spicejet.com → Manage Booking → Check-in\n\n**Best seats to pick:**\n• Exit row = extra legroom (usually free, just ask!)\n• Row 1 = most legroom but no underseat storage\n• Window = great for views and sleeping on wall\n• Aisle = easier to move around, exit first\n• Avoid: seats near toilet (noise + smell!) and last row (no recline)\n\n💡 **DigiYatra app** — paperless boarding at major airports using face recognition. Setup once, use forever. Super convenient!", cards:[], cta:null };
  }

  if (/airport lounge|lounge.*access|credit card.*lounge/i.test(m)) {
    return { text: "🛋️ **Airport Lounge Access — How to get in FREE!**\n\nAirport lounges are basically paradise before your flight — free food, quiet, WiFi, sometimes showers 🚿\n\n**Free access with these cards:**\n🏆 **HDFC Infinia/Diners Black** — unlimited worldwide lounge access (premium cards)\n🏆 **Axis Magnus/Reserve** — good lounge access\n🏆 **Amex Platinum** — Priority Pass included (700+ lounges worldwide!)\n\n**Budget options:**\n• **DreamFolks card** — Pay ₹2 per visit, covers 30+ Indian airports\n• **Priority Pass** — Pay per visit or subscription\n• **Day passes** — Buy at the lounge directly (₹1,000-2,500/person)\n\n**Major airport lounges (India):**\n🛫 BLR T1: TGI Fridays (yes really, and it counts as a lounge!), Encalm\n🛫 BLR T2: Encalm Privé (beautiful new one!)\n🛫 DEL T3: Plexus, No1 Lounge, Encalm\n🛫 BOM T2: GVK Lounge, Tata Premium\n\n💡 **Free food + quiet seating = worth the credit card annual fee many times over!**", cards:[], cta:null };
  }

  // ── TRAIN-SPECIFIC KNOWLEDGE ──────────────────────────────────────────────
  if (/which.*train.*class|train.*class.*difference|sleeper.*vs.*ac|1a.*2a.*3a/i.test(m)) {
    return { text: "🚂 **Train Classes Explained (Indian Railways!):**\n\n🥇 **1AC (1st Class AC)** — ₹₹₹₹\nPrivate cabins, 2-4 berths, fully enclosed. Most expensive. Like a 4-star hotel on wheels!\n\n🥈 **2AC (2-tier AC)** — ₹₹₹\nOpen bays, 4 berths, AC, curtains for privacy. Most comfortable for overnight trips.\n\n🥉 **3AC (3-tier AC)** — ₹₹\nStack of 3 berths, AC, most popular choice. Good comfort at reasonable price.\n\n💺 **SL (Sleeper Class)** — ₹\nNo AC, 3-tier berths, fan. Very affordable (₹150-500 for most routes). Not bad at all for short journeys or budget travel!\n\n🚌 **GS/2S (General/Seated)** — ₹\nVery cheap, no reservation. Best avoided for long trips.\n\n**My recommendation:**\n• Budget travel + long journey → Sleeper (SL) — book well in advance!\n• Comfortable + good sleep → 3AC (sweet spot!)\n• VIP/business travel → 2AC or 1AC\n• Day trip (6 hours or less) → 2S or SL is fine", cards:[], cta:null };
  }

  if (/tatkal.*time|tatkal.*quota|when.*tatkal.*open|tatkal.*booking/i.test(m)) {
    return { text: "⚡ **Tatkal Booking — Exact timing guide!**\n\nTatkal is for last-minute bookings (opens 1 day before journey date)\n\n🕙 **Opening times:**\n• **AC classes (1A, 2A, 3A, EC):** Opens at **10:00 AM** (D-1)\n• **Non-AC classes (SL, 2S):** Opens at **11:00 AM** (D-1)\n\n**Tatkal charges (extra over base fare):**\n• SL: ₹100-200 extra\n• 3A: ₹300-400 extra\n• 2A: ₹400-500 extra\n\n**Tips to actually get Tatkal tickets:**\n1. Be on IRCTC at 9:55 AM (for AC) or 10:55 AM (for SL)\n2. Pre-fill passenger details — saves 2 minutes\n3. Have UPI/debit card ready (UPI is fastest!)\n4. IRCTC often crashes at 10 AM — keep refreshing!\n5. Use IRCTC Rail Connect app (sometimes faster)\n\n⚠️ **Important:** Tatkal tickets are non-refundable on cancellation!\n\n💡 **Pro tip:** Premium Tatkal (pTATKAL) has more quota but costs more. Good option if regular Tatkal is full!", cards:[], cta:null };
  }

  // ── BUS-SPECIFIC KNOWLEDGE ────────────────────────────────────────────────
  if (/overnight bus|sleeper bus|volvo bus|ac.*bus.*long/i.test(m)) {
    return { text: "🚌 **Overnight Bus Guide — Sleep your way to the destination!**\n\n**Why overnight buses are GENIUS:**\n✅ Save on hotel cost (you sleep on the bus!)\n✅ Travel + accommodation in one\n✅ Wake up at destination fresh(ish)\n✅ Much cheaper than flights\n\n**Types of buses:**\n🛏️ **AC Sleeper** — Full flat berth, AC, most comfortable. ₹600-1500\n💺 **AC Semi-Sleeper** — Reclining seats, AC. ₹400-900\n🪑 **AC Seater** — Normal seats with AC. ₹300-700\n\n**Tips for overnight bus:**\n✅ Book upper berth for privacy (no one walks past you)\n✅ Carry a shawl/light blanket (AC can be COLD)\n✅ Keep valuables in your backpack, under your head\n✅ Download offline entertainment before boarding\n✅ Avoid last-minute food — keep it light\n✅ Many buses stop at dhabas — factor in 1-2 stops\n\n**Popular overnight routes from Bangalore:**\n🏖️ Bangalore → Goa: 10-12 hours (depart 9-10 PM, arrive 7-8 AM)\n🌊 Bangalore → Pondicherry: 6-7 hours\n🏔️ Bangalore → Ooty: 7-8 hours", cards:[], cta:null };
  }

  // ── HOTELS KNOWLEDGE ─────────────────────────────────────────────────────
  if (/how.*book.*hotel|best.*hotel.*app|hotel.*tips|choose.*hotel/i.test(m)) {
    return { text: "🏨 **Hotel Booking Tips — Get the best deal!**\n\n**Where to book:**\n🌐 Booking.com — biggest selection, free cancellation options\n🌐 Agoda — often cheaper for Asia\n🌐 Hotels.com — get 1 night free after 10 nights\n🌐 Hotel direct website — sometimes 5-10% cheaper!\n\n**Timing:**\n• Book 2-4 weeks ahead for best rates + selection\n• Last-minute (1-2 days) — sometimes get good deals on empty rooms\n• Avoid booking peak season last minute (Goa in December = disaster!)\n\n**Filters that matter:**\n✅ Free cancellation (ALWAYS choose this if price is similar!)\n✅ Breakfast included (saves ₹300-600/day)\n✅ Check distance from city center/attractions\n✅ Read reviews from last 3 months (recent is key)\n\n**Red flags in reviews:**\n🚫 'Front desk rude' in multiple reviews = real problem\n🚫 'Cockroach/pest' mentioned even once = skip\n🚫 'Noisy road/construction' = check photos for location\n\n**Rating guide:**\n⭐ Under 7.5 = take a risk\n⭐ 7.5-8.4 = good\n⭐ 8.5-9.0 = very good\n⭐ Above 9.0 = excellent!", cards:[], cta:null };
  }

  if (/hostel|budget.*stay|cheap.*accommodation|backpacker/i.test(m)) {
    return { text: "🎒 **Hostels & Budget Stays — The backpacker's guide!**\n\nHostels aren't what your parents warned you about! Modern hostels are actually amazing 😄\n\n**Why hostels are great:**\n✅ 3-5x cheaper than hotels (₹400-800/bed vs ₹2000+ for private room)\n✅ Instant community — you'll make friends from everywhere\n✅ Staff give insider travel tips\n✅ Common areas, kitchens, sometimes rooftop bars!\n\n**Best hostels in India:**\n🏖️ Goa — Backpacker Panda, StayVista\n🏔️ Manali — Drifters Inn, Moustache Hostel\n🌊 Rishikesh — Moustache Hostel (famous!)\n🏙️ Bangalore — The Bunk Hostel, Zostel\n🕌 Varanasi — Stops Hostel\n\n**International:**\n🌏 Thailand/Bali — ₹500-800/night in great hostels\n\n**Types of beds:**\n🛏️ **Dorm bed** — shared room, cheapest, great for meeting people\n🚪 **Private room in hostel** — own room, hostel facilities, middle ground\n\n**Booking:** Hostelworld.com, Zostel.com, direct booking often cheaper!", cards:[], cta:null };
  }

  // ── FOOD & TRAVEL ─────────────────────────────────────────────────────────
  if (/food.*goa|goa.*food|best.*eat.*goa/i.test(m)) {
    return { text: "🍤 **Goa Food Guide — Eat like a local!**\n\nWarning: After eating in Goa, normal food will disappoint you 😄\n\n**Must-eat dishes:**\n🦞 **Prawn curry rice** — The Goa staple. ₹180-300. Get it at local beach shacks, not fancy restaurants!\n🐟 **Fish tawa fry** — Fresh pomfret or kingfish. ₹250-400\n🥘 **Cafreal chicken** — Green masala, Goan special. ₹250-350\n🍚 **Goan pork vindaloo** — Tangy, spicy, legendary. ₹200-300\n🍞 **Poi bread** — Local bread, best with butter early morning\n\n**Where to eat:**\n🌊 **Beach shacks** (Oct-Mar) — Fresh seafood, best atmosphere\n🏘️ **Local South Goa markets** — Authentic, affordable\n🍴 **Britto's, Infantaria, Fisherman's Wharf** — Tourist-friendly but good\n\n**Budget per meal:** ₹200-400 at local places, ₹600-1200 at mid-range restaurants\n\n**Avoid:** Hotels inside tourist zones charge 2-3x for same quality. Walk 5 mins away and eat half the price! 😄", cards:[], cta:null };
  }

  if (/street food|local food.*india|eat.*cheap.*travel/i.test(m)) {
    return { text: "🌮 **Indian Street Food Guide — Eat adventurously, eat cheap!**\n\nThe real India is on the streets, not in the restaurants 😄\n\n**City by city:**\n\n**Mumbai 🏙️**\n• Vada Pav (₹15-25) — Mumbai's burger\n• Pav Bhaji at Juhu beach (₹60-80)\n• Misal Pav at Sardar's or Aaswad (₹80-120)\n\n**Delhi 🏛️**\n• Chole Bhature at Sita Ram Diwan Chand (₹80-120)\n• Jalebi at Old Delhi (₹40/100g)\n• Parathas at Paranthe Wali Gali (₹60-100)\n\n**Kolkata 🌸**\n• Kathi Roll (₹40-80) — invented here!\n• Mishti Doi & Sandesh (₹30-60)\n• Puchka/Pani Puri (₹20 for 6)\n\n**Bangalore ☕**\n• MTR Masala Dosa (₹80) — legendary\n• Vidyarthi Bhavan dosa — queue for it, worth it\n• Darshini restaurants — ₹60-100 for full meal\n\n**Safety tips:**\n✅ Eat where locals eat (busy stall = fresh food!)\n✅ Avoid cut fruits from stalls\n✅ Hot food is generally safe\n✅ Carry ORS sachets just in case 😄", cards:[], cta:null };
  }

  // ── TRAVEL HACKS ─────────────────────────────────────────────────────────
  if (/travel hack|save money travel|budget.*trick|cheap.*travel.*trick/i.test(m)) {
    return { text: "💡 **Travel Hacks that actually work (not clickbait!):**\n\n**Flights:**\n✈️ Use incognito mode when searching (prices can increase based on your cookies!)\n✈️ Search for nearby airports — sometimes ₹3,000 cheaper\n✈️ Round trip isn't always cheaper — check one-way x2\n✈️ Set price alerts (we can do this for you! 🔔)\n\n**Hotels:**\n🏨 Book refundable rate → watch for lower prices → rebook\n🏨 Call hotel directly and ask for 'best available rate'\n🏨 Airbnb for 3+ nights often cheaper than hotels\n🏨 Check if hotel offers free airport pickup (many do!)\n\n**Money:**\n💰 Withdraw cash at local ATMs abroad (better rate than airport exchange)\n💰 Notify bank before international travel (prevent card block)\n💰 Keep ₹500-1000 emergency cash separately from main wallet\n\n**Packing:**\n🎒 Roll clothes, don't fold — 30% more space!\n🎒 Keep medicines in carry-on (not checked luggage)\n🎒 Take photos of all important documents before trip\n\n**At the destination:**\n🗺️ Download offline maps before leaving hotel WiFi\n🚌 Local buses = cheapest, Google Maps shows them now!\n🎫 Buy attraction tickets online (usually 10-20% cheaper)", cards:[], cta:null };
  }

  if (/first.*time.*fly|never.*flown|first.*flight.*tips|scared.*fly/i.test(m)) {
    return { text: "✈️ **First Time Flying? Here's everything you need to know!**\n\nDon't worry — millions of people do this every day. You've got this! 😊\n\n**Step by step process:**\n\n**1. At home (day before):**\n• Web check-in online and download boarding pass\n• Pack liquids in 100ml bottles in transparent bag (carry-on)\n• Charge your phone fully!\n\n**2. Reaching airport:**\n• Domestic: Arrive 2 hours early\n• International: Arrive 3 hours early\n• Keep ID + boarding pass ready\n\n**3. At airport:**\n• Find your airline's check-in counter (for checked bags)\n• OR go directly to security (if only carry-on)\n• Security: Remove laptop, liquids, belt, metal items\n• After security: Find your gate number from display boards\n\n**4. Boarding:**\n• Listen for boarding announcements\n• Queue when your row/zone is called\n• Show boarding pass + ID at gate\n\n**5. On the plane:**\n• Switch phone to airplane mode (or just switch off)\n• Seatbelt on when light is on\n• Turbulence = normal, don't panic 😄\n\n**6. Landing:**\n• Wait for seatbelt sign to turn off before standing\n• Collect bags from carousel (your airline will be displayed)\n\nYou'll be a pro by your second flight! 🛫", cards:[], cta:null };
  }



  // ── WEATHER & BEST TIME ADVANCED ─────────────────────────────────────────
  if (/monsoon.*travel|rain.*travel|travel.*rain|best.*trip.*rain|rainy.*season.*travel/i.test(m)) {
    return { text: "🌧️ **Travelling during monsoon? Here's what nobody tells you!**\n\nMonsoon travel is wildly underrated. Here's why:\n\n**Why monsoon travel is amazing:**\n🌿 Everything is lush GREEN and beautiful\n💰 Prices drop 30-50% (fewer tourists!)\n🏨 Hotels negotiate — you can get amazing deals\n🚗 Roads are empty\n\n**Best monsoon destinations:**\n🌊 **Kerala backwaters** — most beautiful in July-Aug (but check flooding)\n🏔️ **Coorg/Wayanad** — magical mist and waterfalls\n🌿 **Meghalaya** — worth the rain, incredible waterfalls\n🏛️ **Hampi** — dramatic skies over ruins\n🌊 **Mumbai rains** — chai and vada pav on Marine Drive 😄\n\n**Avoid in monsoon:**\n❌ Goa beaches (closed, rough sea)\n❌ Hill treks (landslide risk)\n❌ Andaman (cyclone season)\n❌ Rajasthan (extreme heat + humidity)\n\n**Pro tips:**\n✅ Carry light rain jacket (not heavy umbrella)\n✅ Waterproof your bag/phone\n✅ Book flexible/refundable tickets", cards:[], cta:null };
  }

  if (/what.*pack|packing.*list|what.*carry|what.*bring.*trip/i.test(m)) {
    return { text: "📦 **Packing list for your trip:**\n\n**Documents (MOST IMPORTANT):**\n✅ Aadhaar / Passport / PAN (valid photo ID)\n✅ Booking confirmations (flight/bus/train + hotel)\n✅ Travel insurance (for international trips)\n✅ International debit/credit card (if going abroad)\n\n**Clothes (pack LESS than you think!):**\n👕 2-3 t-shirts per 3 days (hand wash works!)\n👖 2 pants (1 comfortable, 1 smart)\n👟 Comfortable walking shoes — MOST IMPORTANT thing you pack!\n🧥 One light jacket (AC is everywhere in India!)\n\n**Tech & Misc:**\n🔋 Power bank — 20,000mAh recommended\n🔌 Universal adapter (for international travel)\n📱 Earphones\n💊 Paracetamol, ibuprofen, antacid, ORS sachets\n🌐 International SIM or roaming pack (if going abroad)\n\n**Golden rule:** If you're unsure whether to pack it, DON'T. You can buy almost anything you forgot at the destination! 😄", cards:[], cta:null };
  }

  // ── TRANSPORT COMPARISONS ─────────────────────────────────────────────────
  if (/flight.*vs.*train|train.*vs.*flight|better.*flight.*train|which.*faster/i.test(m)) {
    return { text: "✈️🚂 **Flight vs Train — which should YOU choose?**\n\nHonest comparison:\n\n| | **Flight** | **Train** |\n|---|---|---|\n| Speed | 1-3 hours | 5-20 hours |\n| Price | ₹2,000-8,000 | ₹200-1,500 |\n| Luggage | Limits apply | Very generous |\n| Experience | Stressful | Relaxing |\n| Scenery | Clouds 😄 | Beautiful |\n| City centre | Far (airport) | City centre |\n\n**Choose flight when:**\n• Distance is over 700km\n• You value time over money\n• Overnight isn't convenient\n\n**Choose train when:**\n• Budget is priority\n• You enjoy the journey\n• Route is scenic (Konkan, North East)\n• Carrying lots of luggage\n\n**My honest take:**\nFor Bangalore → Goa: Train or bus wins (beautiful Konkan route + cheaper)\nFor Bangalore → Delhi: Flight wins (saves a whole day)\nFor Bangalore → Mumbai: Train wins for budget (Udyan Express, scenic!)", cards:[], cta:null };
  }

  if (/flight.*vs.*bus|bus.*vs.*flight|should.*take.*bus.*or.*flight/i.test(m)) {
    return { text: "🚌✈️ **Bus vs Flight — the real comparison:**\n\n**Bus wins when:**\n✅ Route is under 500km (8-10 hours or less)\n✅ Budget is tight (bus is 3-6x cheaper!)\n✅ You travel overnight (save hotel cost!)\n✅ Destination city centre is far from airport\n\n**Flight wins when:**\n✅ Distance is over 700km\n✅ Your time is worth more than the price difference\n✅ You're travelling with kids/elderly\n\n**Popular routes where BUS is actually better:**\n🏖️ Bangalore → Goa: Bus ₹800 vs Flight ₹4,000+ (10-12h overnight bus = save ₹3,200!)\n🌊 Bangalore → Pondicherry: Bus ₹450 vs Flight (no direct, via Chennai) ₹3,500\n🏔️ Bangalore → Ooty: Bus ₹400, no direct flight\n🏖️ Chennai → Pondicherry: Bus ₹150, 2 hours, no contest!\n\nWant me to find bus options for your route? 😊", cards:[], cta:null };
  }

  // ── SPECIFIC CITY TRAVEL GUIDES ───────────────────────────────────────────
  if (/bangalore.*guide|what.*do.*bangalore|explore.*bangalore|visit.*bangalore/i.test(m)) {
    return { text: "🏙️ **Bangalore — More than just IT parks!** (I know, shocking 😄)\n\nBangalore is underrated as a tourist city. Here's what's actually worth doing:\n\n**In the city:**\n🌸 Lalbagh Botanical Garden — morning walk, gorgeous\n🏛️ Vidhana Soudha — grand at night (lit beautifully)\n🛍️ Commercial Street & Brigade Road — shopping\n🍻 Indiranagar & Koramangala — best food/cafe scene\n☕ Third Wave Coffee, Blue Tokai, Matteo — coffee culture is REAL here\n\n**Day trips from Bangalore:**\n🌿 Nandi Hills — 60km, sunrise, cycling\n🏰 Mysore — 150km, Mysore Palace (stunning!), Chamundi Hills\n⛩️ Shravanabelagola — Gomateshwara statue (58ft Jain monolith!)\n☕ Coorg — 270km, coffee estates, stunning\n🏛️ Hampi — 350km, UNESCO ruins, unforgettable\n\n**Food you must eat in Bangalore:**\n🥣 MTR Masala Dosa — legendary (150+ year old restaurant!)\n🥣 Darshini restaurants — ₹50-100 for idli/dosa breakfast\n🥘 Chole-Bhature at CTR, Malleshwaram\n🍺 Microbreweries — Toit, Windmills Craftworks", cards:[], cta:null };
  }

  if (/mumbai.*guide|visit.*mumbai|what.*do.*mumbai/i.test(m)) {
    return { text: "🌊 **Mumbai — The city that never sleeps (literally!)** 😄\n\n**Must-do:**\n🌉 **Gateway of India** — start here, evening is magical\n🌊 **Marine Drive** — Queen's Necklace at night, world class\n🏝️ **Elephanta Caves** — UNESCO, ferry from Gateway of India\n🎬 **Bollywood Studio tour** — Film City Goregaon\n🏘️ **Dharavi** — actually fascinating, book a guided tour\n🛍️ **Chor Bazaar** — antiques, vintage, wild\n\n**Essential Mumbai food:**\n🥟 **Vada Pav** — ₹15-25, the Mumbai burger, eat it from a street stall\n🍛 **Pav Bhaji** at Juhu Beach — legendary\n🥩 **Trishna/Mahesh Lunch Home** — best seafood\n☕ **Irani chai** at Kyani & Co, old-school\n\n**Getting around:**\nLocal trains — fastest but crowded in peak hours\nUber/Ola — decent, avoid peak traffic times\nBest areas to stay: Bandra (trendy), Colaba (touristy), Andheri (central)", cards:[], cta:null };
  }

  // ── BUDGET CALCULATIONS ───────────────────────────────────────────────────
  if (/total.*cost.*goa|goa.*budget.*calculate|how.*much.*goa|goa.*trip.*cost/i.test(m)) {
    return { text: "💰 **Goa trip cost calculator — 3 days, 2 nights:**\n\n**Budget trip (per person):**\n🚌 Bus from Bangalore: ₹900 x2 (round trip) = ₹1,800\n🏨 Hostel/budget stay: ₹600/night x2 = ₹1,200\n🍱 Food: ₹500/day x3 = ₹1,500\n🏍️ Scooter rental: ₹350/day x2 = ₹700\n🎉 Activities: ₹1,000\n**Total: ~₹6,200 per person** ✅\n\n**Mid-range trip (per person):**\n✈️ Flight round trip: ₹6,000\n🏨 3-star hotel: ₹1,800/night x2 = ₹3,600\n🍴 Food: ₹1,000/day x3 = ₹3,000\n🚖 Cab + activities: ₹2,500\n**Total: ~₹15,100 per person** ✅\n\n**Tips to save:**\n• Travel in monsoon (Jun-Sep): 40% cheaper on everything!\n• Book bus instead of flight: save ₹4,000-5,000\n• Stay in North Goa hostels: social + cheap\n• Eat at beach shacks (not restaurants): same food, half price\n\nShall I find bus/flight options for your dates? 😊", cards:[], cta:null };
  }

  if (/total.*cost.*kerala|kerala.*budget.*calculate|how.*much.*kerala/i.test(m)) {
    return { text: "💰 **Kerala trip cost — 5 days breakdown:**\n\n**Budget trip (per person from Bangalore):**\n✈️ Flight to Kochi: ₹2,500-4,000\n🏨 Budget stays: ₹800/night x4 = ₹3,200\n🚤 Houseboat 1 night (shared): ₹2,500\n🍱 Food: ₹400/day x5 = ₹2,000\n🚌 Local transport: ₹1,500\n**Total: ~₹12,000-13,500 per person** ✅\n\n**What to prioritise:**\n1️⃣ Houseboat in Alleppey — must do, book 2+ weeks ahead\n2️⃣ Munnar tea gardens — free to explore\n3️⃣ Fort Kochi walk — free, fascinating\n4️⃣ Varkala cliff beach — cheapest beach in Kerala\n\n**Best value route:**\nKochi arrive → Munnar (2 days) → Alleppey houseboat (1 night) → Kochi depart\nPacked, affordable, unforgettable!", cards:[], cta:null };
  }

  // ── PRACTICAL BANKING & MONEY TIPS ───────────────────────────────────────
  if (/upi.*abroad|use.*upi.*international|google.*pay.*abroad|phonepe.*outside/i.test(m)) {
    return { text: "💳 **UPI abroad — what works and what doesn't:**\n\nBad news first: UPI doesn't work outside India (yet 😅)\n\n**But here's what DOES work abroad:**\n\n✅ **Niyo Global card** — Best option! Load ₹, spend abroad with zero forex fees\n✅ **Wise app** — Send/receive money internationally at great rates\n✅ **Your regular Visa/Mastercard** — Works everywhere, but forex charges apply\n\n**UPI IS available in:**\n🇳🇵 Nepal — yes!\n🇸🇬 Singapore — at some merchants\n🇦🇪 UAE — at some merchants (slowly expanding!)\n🇧🇭 Bahrain, 🇲🇾 Malaysia — limited\n\n**Practical tip for international trips:**\n1. Get Niyo Global card before travel (free, instant)\n2. Keep some cash in local currency (for small vendors)\n3. Inform your regular bank before trip\n4. Save international helpline number of your card\n\nFor Nepal specifically — your UPI and Indian currency work! It's the easiest international trip from India for payments.", cards:[], cta:null };
  }

  // ── MENTAL & PRACTICAL TRAVEL PREP ───────────────────────────────────────
  if (/nervous.*travel|scared.*travel|anxious.*trip|worry.*travel|flight.*fear|scared.*fly/i.test(m)) {
    return { text: "💙 **Travel anxiety is completely normal! Here's how to handle it:**\n\nAlmost everyone feels some anxiety before a big trip. Even experienced travellers! 😊\n\n**For flight anxiety:**\n✈️ Turbulence is normal — planes are built for it (seriously, they test beyond what you'd ever experience)\n✈️ Modern planes have multiple redundant systems\n✈️ Distract yourself: download shows/music before boarding\n✈️ Tell cabin crew — they're trained to help nervous flyers\n\n**For general travel anxiety:**\n📋 Make a checklist (done = calm 😄)\n📱 Download offline maps BEFORE you go\n👨‍👩‍👧 Share itinerary with family/friends\n💊 Pack your regular medicines + a bit extra\n🆘 Save local emergency numbers (we can give you these!)\n\n**The honest truth:**\nThe 5 minutes before a trip is the worst. Once you're moving, you'll be fine. And when you arrive? You'll wonder why you were ever nervous. 🌍\n\nTravel is ALWAYS worth it. What trip are you planning? Let me help make it feel manageable!", cards:[], cta:null };
  }


  return null; // let medium handle flight DB lookup

  // ══════════════════════════════════════════════════════════════════════════
  //  COMPREHENSIVE WORLD KNOWLEDGE BASE — VISAS, PACKAGES, DESTINATIONS
  // ══════════════════════════════════════════════════════════════════════════

  // ── VISA GUIDES BY COUNTRY ───────────────────────────────────────────────
  if (/schengen.*visa|europe.*visa|visa.*europe/i.test(m)) {
    return { text: "🇪🇺 **Schengen Visa Guide for Indians (Complete!):**\n\nSchengen covers 27 countries — get ONE visa, travel all! 🎉\n\n**Documents needed:**\n✅ Passport (valid 3+ months after return)\n✅ Schengen visa form (online)\n✅ Travel insurance (min €30,000 coverage — MANDATORY)\n✅ Bank statements (last 3-6 months, min ₹3-5L balance)\n✅ Flight booking (round trip)\n✅ Hotel bookings for all nights\n✅ ITR/salary slips (proof of income)\n✅ NOC from employer / business proof\n✅ Covering letter explaining your trip\n\n**Fees:** €80 (~₹7,200)\n**Where to apply:** VFS Global (France/Germany/Italy consulates handle most)\n**Processing time:** 15-25 working days\n**Best to apply through:** France or Germany VFS\n\n**⚠️ Common rejection reasons:**\n• Insufficient bank balance\n• Missing travel insurance\n• Unclear itinerary\n• Previous overstays\n\n**💡 Pro tip:** Apply for France if visiting multiple countries — they process fastest!", cards:[], cta:null };
  }

  if (/us.*visa|usa.*visa|b1.*b2.*visa|american.*visa/i.test(m)) {
    return { text: "🇺🇸 **US Tourist Visa (B1/B2) — Complete Guide:**\n\nMost asked, most feared visa. Here's the real picture:\n\n**Documents:**\n✅ DS-160 form (online)\n✅ Valid passport\n✅ Visa fee receipt ($185 = ~₹15,540)\n✅ Bank statements (6 months, ideally ₹10L+)\n✅ Property/assets proof (shows you'll return to India!)\n✅ Employment letter with salary\n✅ ITR last 2 years\n✅ Travel itinerary + hotel bookings\n\n**Interview process:**\n📍 Apply at US Embassy/Consulate (Delhi/Mumbai/Chennai/Hyderabad/Kolkata)\n🎯 Interview: Show strong ties to India (job, family, property)\n⏱️ Appointment wait: currently 200-600+ days (yes, crazy!)\n\n**The golden rule:** Convince them you WILL come back to India\n\n**Validity if approved:** Usually 10 years, multiple entry!\n\n**💡 Better path:** Visit Canada first — easier visa + can often visit US after!\n\n**Current processing time:** Apply 18+ months before your trip date.", cards:[], cta:null };
  }

  if (/uk.*visa|britain.*visa|england.*visa/i.test(m)) {
    return { text: "🇬🇧 **UK Tourist Visa for Indians:**\n\n**Important:** UK is NOT part of Schengen — separate visa needed.\n\n**Documents:**\n✅ Online application (gov.uk)\n✅ Passport + old passports\n✅ Bank statements (6 months)\n✅ Proof of accommodation in UK\n✅ Flight bookings\n✅ Employment/business proof\n✅ Property/assets in India\n\n**Fees:** ~£115 (~₹12,000)\n**Processing:** Standard 3 weeks, priority 5 days (extra fee)\n**Validity:** Usually 6 months or 2/5/10 years\n\n**💡 Good news:** If you have a valid US visa, you can get UK visa faster and easier!\n\n**Apply online:** gov.uk/apply-uk-visa\n**VFS centres:** Delhi, Mumbai, Chennai, Kolkata, Hyderabad, Bangalore, Chandigarh, Pune, Ahmedabad", cards:[], cta:null };
  }

  if (/dubai.*visa|uae.*visa|emirates.*visa/i.test(m)) {
    return { text: "🇦🇪 **Dubai/UAE Visa for Indians — SUPER EASY!**\n\nGood news — UAE visa is one of the easiest for Indians! 😄\n\n**Option 1: On-arrival (if you qualify)**\n✅ Valid US/UK/EU/Schengen visa holders — visa on arrival FREE for 14 days!\n\n**Option 2: Apply online (most common)**\n✅ Apply through Emirates/FlyDubai/Air Arabia airline (fastest)\n✅ Or Dubai tourism portal\n✅ Documents: Passport copy, photo, bank statement\n✅ Cost: AED 200-350 (~₹4,500-8,000)\n✅ Processing: 3-5 working days\n✅ Validity: 30 or 90 days, single/multiple entry\n\n**Types:**\n• 30-day tourist: ~₹4,500-6,000\n• 90-day tourist: ~₹8,000-12,000\n• Transit visa (48h): FREE!\n\n**💡 Best tip:** Book Emirates/FlyDubai airline and apply visa through them — often cheapest and fastest!", cards:[], cta:null };
  }

  if (/singapore.*visa|singapore.*entry/i.test(m)) {
    return { text: "🇸🇬 **Singapore Visa for Indians:**\n\n**Great news:** Many Indians get visa on arrival or e-visa easily!\n\n**Tourist Visa:**\n✅ Apply online at ICA.gov.sg\n✅ Documents: Passport, photo, bank statement (₹1L+), hotel booking, return ticket\n✅ Fee: SGD 30 (~₹1,800)\n✅ Processing: 3-5 working days\n✅ Validity: 30 days, extendable\n\n**Who can get e-visa quickly:**\n• Working professionals with good bank balance\n• Previously visited Singapore without issues\n• Holding valid US/UK/Schengen visa\n\n**Average approval rate for Indians:** Very high (90%+)\n\n**💡 Apply at least 2 weeks before travel**\n**Singapore is worth every paperwork minute — cleanest, safest, most efficient city you'll ever visit!** 😄", cards:[], cta:null };
  }

  if (/thailand.*visa|bangkok.*visa/i.test(m)) {
    return { text: "🇹🇭 **Thailand Visa — AMAZING news for Indians!**\n\n**Free visa-on-arrival for Indians (as of 2024-25)!**\nIndia and Thailand now have visa-free travel! 🎉\n\n**Visa-free entry:**\n✅ Up to 30 days (may extend to 60 days — check latest)\n✅ Need: Valid passport (6+ months), return ticket, sufficient funds\n✅ Arrive at Bangkok (BKK/DMK), Phuket, Chiang Mai airports\n\n**What to carry:**\n• Passport valid 6+ months\n• Return flight ticket\n• Hotel booking\n• ₹5,000+ per day in funds (roughly)\n• Proof of accommodation\n\n**Cost of trip from India:**\n✈️ Flight: ₹8,000-18,000 return\n🏨 Hotel: ₹1,500-4,000/night\n🍜 Food: ₹400-800/day\n**Total 5 days:** ₹18,000-35,000 easily doable!\n\n⚠️ Always verify latest visa rules before booking — policies change!", cards:[], cta:null };
  }

  if (/bali.*visa|indonesia.*visa/i.test(m)) {
    return { text: "🇮🇩 **Bali/Indonesia Visa for Indians:**\n\n✅ **Visa on Arrival (VoA) — very easy!**\n• Cost: $35 USD (~₹2,940)\n• Valid: 30 days (extendable once for another 30 days)\n• Available at Bali Ngurah Rai Airport, Jakarta, and major entry points\n• Just queue at VoA counter on arrival!\n\n**What to carry:**\n• Passport (6+ months valid)\n• Return ticket\n• Hotel booking proof\n• $35 cash or card for VoA fee\n• Customs declaration form (filled on plane)\n\n**Alternative — e-VOA online:**\n• Apply at molina.imigrasi.go.id\n• Same $35 fee\n• Skip the queue on arrival! (worth it)\n• Apply 2-3 days before travel\n\n**💡 Bali is one of the best value holidays for Indians:**\n• Beautiful beaches, temples, rice fields\n• Food is cheap (₹150-300 for a meal!)\n• Great weather October-March\n• Cheap villas with private pool: ₹3,000-6,000/night!", cards:[], cta:null };
  }

  // ── TRIP PACKAGES & PLANNING ─────────────────────────────────────────────
  if (/package.*tour|tour.*package|all.*inclusive|agent.*book|travel.*agent|package.*holiday/i.test(m)) {
    return { text: "📦 **Package Tours vs DIY Travel — the honest comparison:**\n\n**Package tours (travel agent books everything):**\n✅ Good for: First international trip, complex itineraries, elderly travellers\n❌ Bad for: Flexibility, value for money\n💰 Usually 20-40% more expensive than DIY\n\n**DIY (book yourself, like on Alvryn!):**\n✅ Good for: Budget travellers, flexible schedules, experienced travellers\n✅ Usually 20-40% cheaper!\n✅ Choose YOUR hotels, times, activities\n❌ Takes more planning effort\n\n**Popular package tour costs (per person from India):**\n🇹🇭 Thailand 5N/6D: ₹35,000-50,000 (DIY: ₹22,000-30,000)\n🇦🇪 Dubai 4N/5D: ₹45,000-65,000 (DIY: ₹32,000-45,000)\n🇸🇬 Singapore 4N/5D: ₹55,000-75,000 (DIY: ₹40,000-55,000)\n🇮🇩 Bali 5N/6D: ₹40,000-60,000 (DIY: ₹28,000-40,000)\n\n**My recommendation:**\nFor domestic India travel → always DIY (Alvryn finds better deals!)\nFor first international trip → package can reduce stress\nFor repeat international travel → DIY and save 30%!", cards:[], cta:null };
  }

  if (/itinerary.*plan|day.*by.*day|plan.*days|how.*plan.*trip|create.*itinerary/i.test(m)) {
    return { text: "📅 **How to plan a perfect trip itinerary:**\n\n**Step 1: Decide the basics**\n• How many days? (Rule: 2 days per major city)\n• Budget total?\n• Who's coming? (Solo/couple/family changes everything)\n\n**Step 2: Research the destination**\n• Top 5 things to do\n• Where to stay (central location saves transport time!)\n• Best time to visit that area\n\n**Step 3: Book in order**\n1. Flights first (prices rise as you wait!)\n2. First night hotel (have an address for visa)\n3. Other hotels\n4. Activities\n\n**Step 4: Build daily schedule**\n• Morning: 1 major attraction\n• Afternoon: 1-2 smaller things\n• Evening: local food/market/stroll\n• Rule: Don't overschedule! Leave 20% for spontaneity 😄\n\n**Step 5: Practical prep**\n• Download offline maps\n• Save emergency numbers\n• Notify bank\n• Travel insurance\n• Share itinerary with family\n\n**Bonus tip:** Alvryn can plan your complete door-to-door itinerary! Just say: *'Plan a 5-day Goa trip for 2 people under ₹20,000'* 😊", cards:[], cta:null };
  }

  // ── ALTERNATIVE TRAVEL OPTIONS ────────────────────────────────────────────
  if (/road.*trip|drive.*to|self.*drive|rent.*car.*travel/i.test(m)) {
    return { text: "🚗 **Road Trip Guide from Bangalore (and other cities):**\n\n**Best road trips from Bangalore:**\n🌿 **Bangalore → Coorg** (270km, 5-6h) — coffee estates, waterfalls\n🏛️ **Bangalore → Mysore** (150km, 3h) — palace, zoo, Chamundi\n🏖️ **Bangalore → Pondicherry** (300km, 6h) — beach, French Quarter\n🌊 **Bangalore → Gokarna** (480km, 8h) — stunning beaches, less crowded than Goa\n🏔️ **Bangalore → Ooty** (270km, 6h) — hills, tea, toy train\n\n**Car rental options:**\n• Zoomcar (self-drive): ₹800-1,500/day\n• Savaari (with driver): ₹2,500-4,000/day\n• Zoom Car + driver via Ola Outstation\n• OLA/Uber Outstation: easiest, no haggling\n\n**Cost comparison (Bangalore → Coorg, 2 people):**\n🚗 Rental car: ₹1,800 fuel + ₹1,200 rental = ₹3,000\n🚌 Bus: ₹400 x2 = ₹800\n✈️ No direct flight\n→ For 2 people, car is great for flexibility!\n\n**Road trip essentials:**\n✅ FastTag for toll booths (mandatory!)\n✅ Offline Google Maps downloaded\n✅ Power bank + car charger\n✅ Basic medicines + water\n✅ Check weather (especially for hill roads)", cards:[], cta:null };
  }

  if (/cruise|cruise.*trip|cruise.*goa|cruise.*ship/i.test(m)) {
    return { text: "🚢 **Cruises from India — a hidden gem!**\n\nIndia actually has some great cruise options that most people don't know about!\n\n**Domestic cruises:**\n⛴️ **Mumbai → Goa cruise** — Angriya Cruise Ship\n• Mumbai → Goa overnight cruise\n• Cost: ₹4,500-12,000 per person (room type)\n• Includes dinner/breakfast\n• Fun alternative to flight/bus!\n• Book at angriyacruises.com\n\n⛴️ **Lakshadweep cruise** — From Kochi\n• 4-8 days exploring coral islands\n• Govt + private operators\n• ₹8,000-25,000 per person\n• PERMIT REQUIRED — plan well ahead!\n\n**International cruises from India:**\n🛳️ **Singapore → Malaysia → Thailand** — MSC/Costa Cruises\n• From: Singapore or Chennai\n• 3-5 night cruises: ₹25,000-50,000 all-inclusive!\n• Includes all meals + entertainment + cabin\n• Much better value than individual hotels!\n\n**Best for:** Honeymoons, anniversaries, families who want everything included", cards:[], cta:null };
  }

  if (/train.*scenic|scenic.*train|toy.*train|heritage.*train/i.test(m)) {
    return { text: "🚂 **India's Most Scenic & Heritage Trains — a traveller's bucket list!**\n\n🏔️ **Darjeeling Himalayan Railway (Toy Train)**\n• UNESCO World Heritage\n• Darjeeling town through tea gardens\n• ₹700-1,200 for joy ride\n• Best: morning, clear Kanchenjunga views!\n\n🌿 **Nilgiri Mountain Railway (Ooty Toy Train)**\n• Mettupalayam → Ooty through jungle & hills\n• UNESCO World Heritage\n• ₹50-300 depending on class\n• Book months ahead — always full!\n\n⛰️ **Kalka-Shimla Railway**\n• 96km through 102 tunnels!\n• Shimla in style\n• ₹30-200 per class\n\n🌊 **Konkan Railway (Mumbai → Goa)**\n• Most scenic regular train in India\n• 756 bridges, 92 tunnels, coastal views\n• Mandovi/Konkan Kanya express\n• Travel overnight for sunrise over western ghats!\n\n🏜️ **Palace on Wheels (Rajasthan)**\n• Luxury heritage train\n• 7 nights, covers all major Rajasthan cities\n• Starts at ₹80,000/person\n• Most luxurious train experience in India\n\n🐯 **The Maharajas' Express**\n• India's most luxurious train\n• Restaurant, bar, salon on board!\n• ₹3,00,000+/person for the full experience 😄", cards:[], cta:null };
  }

  // ── BUDGET TRAVEL DEEP DIVES ───────────────────────────────────────────────
  if (/backpacking.*india|budget.*india.*travel|india.*on.*budget|cheap.*india/i.test(m)) {
    return { text: "🎒 **Backpacking India on a Budget — the complete guide:**\n\n**Realistic daily budgets:**\n💰 **Super budget:** ₹800-1,200/day (hostels, local food, buses)\n💰 **Budget:** ₹1,500-2,500/day (budget hotels, mix of eating out)\n💰 **Mid-range:** ₹3,000-5,000/day (3-star, restaurants)\n\n**Best budget destinations in India:**\n🏔️ **North India circuit:** Delhi → Agra → Jaipur (Golden Triangle, ₹8,000 for 5 days)\n🌊 **South India:** Hampi → Gokarna → Goa (₹10,000 for 7 days)\n🏔️ **Himachal:** Manali → Kasol → Kheerganga (₹6,000 for 5 days)\n🌿 **North East:** Meghalaya → Assam (₹8,000 for 5 days — underrated!)\n\n**Budget hacks:**\n• Overnight trains = save hotel cost\n• Hostels in tourist areas: ₹350-600/bed\n• Dhabas and local restaurants: ₹80-150 per meal\n• State buses over private: 30-50% cheaper\n• Free activities: temples, beaches, mountains\n\n**Best hostel chains in India:**\n🏡 Zostel (50+ locations, ₹350-700/bed)\n🏡 Moustache Hostel (Rajasthan, Goa, Manali)\n🏡 The Hosteller (Pan-India)", cards:[], cta:null };
  }

  if (/best.*airline.*india|which.*airline.*cheap|cheapest.*airline|best.*airline.*fly/i.test(m)) {
    return { text: "✈️ **Best Airlines for India — honest comparison:**\n\n**Domestic India:**\n\n🏆 **IndiGo** — Most flights, usually cheapest, reliable\n• On-time performance: Best in India\n• Baggage: 15kg free, 7kg cabin\n• Food: Not included (buy on board)\n• Best for: Budget, frequent routes\n\n🥈 **Air India** — Most comfortable, more routes\n• Now improved under Tata ownership!\n• More legroom on average\n• Free meals on many flights\n• Best for: Longer flights, more comfort\n\n🥉 **SpiceJet** — Often has good deals\n• Sometimes 20-30% cheaper than IndiGo\n• Check carefully — fees can add up\n\n🆕 **Akasa Air** — New, growing, great service\n• Best cabin crew attitude in India (new staff, enthusiastic!)\n• Competitive pricing\n\n**International from India:**\n\n🏆 **Emirates** — Via Dubai, huge network\n🥈 **Singapore Airlines** — Via SIN, world's best airline\n🥉 **Air India** — Direct to US/UK/Europe\n💰 **IndiGo** — Cheapest to SE Asia, Middle East\n💰 **Air Arabia/FlyDubai** — Cheapest to Gulf\n\n**Golden rule:** Use Alvryn to compare all airlines at once — prices change hourly! 😄", cards:[], cta:null };
  }

  // ── HONEYMOON SPECIFIC (EXPANDED) ────────────────────────────────────────
  if (/maldives.*honeymoon|honeymoon.*maldives/i.test(m)) {
    return { text: "🏝️ **Maldives Honeymoon — The complete guide:**\n\n**The dream:** Crystal blue water, overwater bungalow, total privacy\n**The reality:** Absolutely worth it IF you plan smart!\n\n**Budget breakdown (per couple, 4 nights):**\n\n**Budget option (~₹80,000 per couple):**\n✈️ Flight: ₹22,000-28,000\n🏡 Guesthouse on local island: ₹3,000-5,000/night\n🍱 Food + day trips: ₹2,000/day\nTotal: ~₹70,000-85,000 — YES, Maldives on budget is real!\n\n**Mid-range (~₹1.5L per couple):**\n✈️ Flight: ₹28,000\n🏖️ 3-star resort: ₹8,000-12,000/night\nTotal: ~₹1.3-1.7L\n\n**Luxury (~₹3L+ per couple):**\n✈️ Business class: ₹60,000+\n🏊 Overwater villa: ₹30,000-80,000/night\n\n**💡 Secret to budget Maldives:**\nLocal islands (Maafushi, Dhigurah, Fulidhoo) have guesthouses at fraction of resort prices. Same blue water, real local culture, save ₹50,000!\n\n**Best time:** November to April (dry season)\n**Book:** Direct with local island guesthouses via booking.com", cards:[], cta:null };
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
      cards.push({type:"hotel",city:tN||fN,priceRange:pr,label:"Best Rates",insight:"Live hotel prices on other booking sites.",link:`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}`});
    } else {
      // Default: flight
      cards.push({type:"flight",airline:"Multiple Airlines",from:fN,to:tN,fromCode:(CITY_IATA_SRV[f]||(f.slice(0,3).toUpperCase())),toCode:(CITY_IATA_SRV[t]||(t.slice(0,3).toUpperCase())),departure:"—",arrival:"—",duration:"Direct",price:null,label:"Live Fares",insight:"Tap to see live fares from all major airlines.",link:buildFlightURL(f,t,ddmm,1)});
    }
  } else if (isHotel && (f||t)) {
    const city = t||f||"India";
    const pr = HOTEL_PRICES[city.toLowerCase()]||"700–4,000";
    cards.push({type:"hotel",city:city.charAt(0).toUpperCase()+city.slice(1),priceRange:pr,label:"Best Rates",insight:"Check other booking sites for live prices and availability.",link:`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}`});
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
      text: `🏨 Best hotels in **${tN||fN}**! Browse live options on other booking sites — filter by price, rating and location. 👇`,
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
        text: `You've reached today's AI limit (${DAILY_LIMIT} responses/day). 🎯\n\n✅ Still FREE forever: travel tips, destinations, all basic Q&A\n🔓 Book any trip via Alvryn → limit resets instantly!\n\nHere are the best options 👇`,
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

// ════════════════════════════════════════════════════════════════════════════
//  GROQ + GPT HYBRID AI — askAI() wrapper
// ════════════════════════════════════════════════════════════════════════════

async function callGroq(prompt, systemMsg) {
  const key = process.env.GROQ_API_KEY;
  if (!key) { console.log("[AI] No GROQ_API_KEY found"); return null; }
  try {
    console.log("[AI] Calling Groq API...");
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
      body:JSON.stringify({
        model:"llama-3.3-70b-versatile",
        messages:[{role:"system",content:systemMsg||"You are Alvryn AI, a smart travel assistant for India."},{role:"user",content:prompt}],
        max_tokens:300, temperature:0.7
      })
    });
    const d = await res.json();
    const result = d.choices?.[0]?.message?.content || null;
    if (result) console.log("[AI] Groq responded successfully");
    else console.log("[AI] Groq returned empty:", JSON.stringify(d).slice(0,200));
    return result;
  } catch(e) { console.log("[AI] Groq error:", e.message); return null; }
}

async function callOpenAI(prompt, systemMsg, maxTokens=400) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions",{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
      body:JSON.stringify({
        model:"gpt-4o-mini",
        messages:[{role:"system",content:systemMsg||"You are Alvryn AI, a smart travel assistant for India."},{role:"user",content:prompt}],
        max_tokens:maxTokens, temperature:0.75
      })
    });
    const d = await res.json();
    return d.choices?.[0]?.message?.content || null;
  } catch { return null; }
}

// Main AI wrapper — Groq for simple, GPT for complex
async function askAI(prompt, type="simple", systemMsg) {
  const TRAVEL_SYSTEM = systemMsg || `You are Alvryn AI — India's smartest travel assistant.
Personality: warm, knowledgeable friend who travels everywhere.
Rules: Keep responses SHORT (3-4 sentences). Use emojis naturally. Never say "I cannot" — always give something useful. Prices may vary — always mention this.`;

  if (type === "simple") {
    const groqResult = await callGroq(prompt, TRAVEL_SYSTEM);
    if (groqResult) return groqResult;
  }
  // Complex OR groq failed — use GPT
  const gptResult = await callOpenAI(prompt, TRAVEL_SYSTEM, type==="complex"?500:300);
  if (gptResult) return gptResult;
  return null; // Both failed — use stored fallback
}

// ════════════════════════════════════════════════════════════════════════════
//  USER MEMORY SYSTEM
// ════════════════════════════════════════════════════════════════════════════

async function ensureUserPrefsTable() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS user_preferences (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      pref_key VARCHAR(80) NOT NULL,
      pref_value TEXT,
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, pref_key)
    )`);
  } catch(e) { console.error("user_prefs table:", e.message); }
}
ensureUserPrefsTable().catch(console.error);

async function getUserPrefs(userId) {
  try {
    const r = await pool.query("SELECT pref_key, pref_value FROM user_preferences WHERE user_id=$1", [userId]);
    const prefs = {};
    r.rows.forEach(row => { prefs[row.pref_key] = row.pref_value; });
    return prefs;
  } catch { return {}; }
}

async function setUserPref(userId, key, value) {
  try {
    await pool.query(`INSERT INTO user_preferences (user_id, pref_key, pref_value, updated_at)
      VALUES ($1,$2,$3,NOW()) ON CONFLICT (user_id, pref_key) DO UPDATE SET pref_value=$3, updated_at=NOW()`,
      [userId, key, String(value)]);
  } catch {}
}

async function updateUserMemory(userId, message, response) {
  if (!userId) return;
  const m = message.toLowerCase();
  // Detect and store preferences from conversation
  if (/indigo|air india|spicejet|vistara|akasa/i.test(m)) {
    const airline = m.match(/indigo|air india|spicejet|vistara|akasa/i)?.[0];
    if (airline) await setUserPref(userId, "preferred_airline", airline);
  }
  if (/budget|under|₹|rs\.?\s*\d+/i.test(m)) {
    const budget = extractBudget(message);
    if (budget) await setUserPref(userId, "typical_budget", String(budget));
  }
  // Track trip count
  if (/flight|bus|hotel|train/i.test(m)) {
    const prefs = await getUserPrefs(userId);
    const count = parseInt(prefs.search_count||"0") + 1;
    await setUserPref(userId, "search_count", String(count));
    await setUserPref(userId, "last_searched", new Date().toISOString().split("T")[0]);
  }
}

function buildPersonalGreeting(userName, prefs, message) {
  const name = userName ? userName.split(" ")[0] : "there";
  const searchCount = parseInt(prefs.search_count||"0");
  const lastSearched = prefs.last_searched;
  const prefAirline = prefs.preferred_airline;
  const budget = prefs.typical_budget;

  if (searchCount >= 5) {
    const tip = prefAirline ? ` I'll prioritize ${prefAirline} options for you.` : "";
    return `Welcome back, ${name}! 👋 Great to see you again.${tip}`;
  } else if (searchCount >= 2) {
    return `Hey ${name}! 👋 Good to see you back on Alvryn!`;
  }
  return null; // First-time users get normal greeting
}

// ════════════════════════════════════════════════════════════════════════════
//  TRIP PLANNER STATE MACHINE
// ════════════════════════════════════════════════════════════════════════════

const tripSessions = new Map(); // sessionId → tripState

function getTripSession(sessionId) {
  return tripSessions.get(sessionId) || null;
}

function setTripSession(sessionId, state) {
  tripSessions.set(sessionId, { ...state, updatedAt: Date.now() });
  // Clean up old sessions (>2 hours)
  for (const [k,v] of tripSessions) {
    if (Date.now() - v.updatedAt > 7200000) tripSessions.delete(k);
  }
}

function clearTripSession(sessionId) {
  tripSessions.delete(sessionId);
}

// Trip planner: detects if a message starts a trip plan
function detectsTripIntent(message) {
  const m = message.toLowerCase();
  // Needs both origin and destination AND not just a simple search
  const { from, to } = extractCities(message);
  const hasRoute = from && to;
  const isTripContext = /trip|travel|visit|going|tour|vacation|holiday|journey|plan/i.test(m);
  const hasBudget = /budget|₹|rs|under|cost|spend/i.test(m);
  const hasDate = /tomorrow|next|this|week|month|january|february|march|april|may|june|july|august|september|october|november|december|\d+\s*(day|night)/i.test(m);
  // If they mention international destination or complex trip
  const isInternational = to && !["BLR","BOM","DEL","MAA","HYD","CCU","GOI","PNQ","COK","AMD","JAI","LKO","VNS"].includes(
    CITY_IATA_SRV[to?.toLowerCase()]||""
  );
  return hasRoute && (isTripContext || isInternational || hasBudget || hasDate);
}

async function runTripPlanner(sessionId, message, userId, userName) {
  let state = getTripSession(sessionId) || { step: "start" };
  const m = message.toLowerCase().trim();

  // Step 0: Initial detection
  if (state.step === "start") {
    const { from, to } = extractCities(message);
    const f = from ? normCity(from) : null;
    const t = to ? normCity(to) : null;
    setTripSession(sessionId, { step:"ask_purpose", from:f, to:t, fromRaw:from, toRaw:to });
    const fN = f ? f.charAt(0).toUpperCase()+f.slice(1) : from;
    const tN = t ? t.charAt(0).toUpperCase()+t.slice(1) : to;
    return {
      text: `✈️ **${fN} → ${tN}** — great choice! I'll plan your complete door-to-door trip.

First, what's the purpose of your trip? 🎯`,
      quickReplies: ["🏖️ Tourism / Vacation", "💼 Business", "🎓 Study / Education", "👨‍👩‍👧 Family Visit", "🎒 Backpacking"],
      section: "intro", isTripPlanner: true
    };
  }

  // Step 1: Purpose
  if (state.step === "ask_purpose") {
    let purpose = "tourism";
    if (/business|work|meeting|conference/i.test(m)) purpose = "business";
    else if (/study|education|college|university/i.test(m)) purpose = "education";
    else if (/family|relative|parents|wedding/i.test(m)) purpose = "family";
    else if (/backpack|solo|budget/i.test(m)) purpose = "backpacking";
    else if (/tourism|vacation|holiday|tour/i.test(m)) purpose = "tourism";
    setTripSession(sessionId, { ...state, step:"ask_budget", purpose });
    const purposeEmoji = {tourism:"🏖️",business:"💼",education:"🎓",family:"👨‍👩‍👧",backpacking:"🎒"}[purpose]||"✈️";
    return {
      text: `${purposeEmoji} ${purpose.charAt(0).toUpperCase()+purpose.slice(1)} — perfect!

What's your total budget for this trip? (flights + hotel + activities) 💰`,
      quickReplies: ["Under ₹10,000", "₹10,000 – ₹30,000", "₹30,000 – ₹60,000", "₹60,000 – ₹1,50,000", "No fixed budget", "Others (specify)"],
      showTextInput: "Or type your exact budget...",
      section: "purpose", isTripPlanner: true
    };
  }

  // Step 2: Budget
  if (state.step === "ask_budget") {
    let budget = null;
    if (/10.?000|10k/i.test(m)) budget = 10000;
    else if (/30.?000|30k/i.test(m)) budget = 30000;
    else if (/60.?000|60k/i.test(m)) budget = 60000;
    else if (/1.?50.?000|1\.5l|1\.5 lakh/i.test(m)) budget = 150000;
    else budget = extractBudget(message) || null;
    setTripSession(sessionId, { ...state, step:"ask_dates", budget });
    if (userId) setUserPref(userId, "typical_budget", String(budget||"flexible")).catch(()=>{});
    return {
      text: `💰 Got it! ${budget ? `Budget: ₹${budget.toLocaleString()}` : "Flexible budget — I'll show best options!"}

When are you planning to travel? 📅`,
      quickReplies: ["This weekend", "Next week", "This month", "Next month", "I'll decide later"],
      section: "budget", isTripPlanner: true
    };
  }

  // Step 3: Dates
  if (state.step === "ask_dates") {
    let dateHint = message;
    if (/weekend/i.test(m)) {
      const now = new Date(); const day = now.getDay();
      const daysToSat = (6-day+7)%7||7;
      const sat = new Date(now); sat.setDate(now.getDate()+daysToSat);
      dateHint = sat.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
    }
    setTripSession(sessionId, { ...state, step:"ask_homelocation", travelDate:dateHint });
    return {
      text: `📅 Noted: **${dateHint}**

One more thing — where are you starting from exactly? (Your area/locality, so I can plan door-to-door) 📍`,
      quickReplies: state.from==="bangalore"
        ? ["Electronic City","Whitefield","Koramangala","HSR Layout","Marathahalli","City Centre / Majestic","Others (type below)"]
        : ["City Centre","Near Airport","Suburb / Outskirts","Others (type below)"],
      showTextInput: "Type your exact area or locality...",
      section: "dates", isTripPlanner: true
    };
  }

  // Step 4: Home location → Generate full plan section by section
  if (state.step === "ask_homelocation") {
    const homeLocation = message.toLowerCase().trim() === "others" ? "" : message;
    setTripSession(sessionId, { ...state, step:"show_local_transport", homeLocation });
    if (userId) setUserPref(userId, "home_location", homeLocation).catch(()=>{});

    const from = state.from || "bangalore";
    const to   = state.to   || "new york";
    const fN   = from.charAt(0).toUpperCase()+from.slice(1);
    const tN   = to.charAt(0).toUpperCase()+to.slice(1);

    // Use global airport DB first
    const airportInfo = getAirportInfo(homeLocation || from);
    let localAdvice, transitTime;

    if (airportInfo) {
      localAdvice = `🚕 **From ${homeLocation||fN} → ${airportInfo.airport}:**\n\n${airportInfo.transport}\n\n⏰ Allow **${airportInfo.time}** total journey time.`;
      transitTime = airportInfo.time;
    } else if (homeLocation) {
      // Unknown location — give generic advice + AI will fill in
      localAdvice = `📍 **From ${homeLocation} → nearest airport:**\n\n🚖 Use Google Maps or Ola/Uber to find the fastest route\n🔍 Search: "${homeLocation} to airport" on Google Maps for live directions\n💡 Always allow 30 minutes extra buffer\n\n**General airport timing:**\n• Domestic flights: Arrive 2 hours before\n• International flights: Arrive 3 hours before`;
      transitTime = "Check Google Maps for exact time";
    } else {
      const stored = getLocalTransportAdvice(from, from);
      localAdvice = stored.advice;
      transitTime = stored.time;
    }

    const destImage = getDestImageUrl(to);
    return {
      text: `🗺️ **SECTION 1 of 5 — Getting to the Airport**\n\n${localAdvice}\n\n⚠️ **Arrive early:**\n• Domestic flights: 2 hours before departure\n• International flights: 3 hours before departure\n\n---\n✅ Section 1 done! Ready to see **flights** next?`,
      image: destImage ? { url: destImage, caption: `${tN} awaits you! 🌍` } : null,
      quickReplies: ["Yes, show me flights ✈️", "Show all sections at once"],
      section:"local_transport", sectionNum:1, totalSections:5,
      isTripPlanner:true
    };
  }

  // Step 5: Flights
  if (state.step === "show_local_transport" && /flight|yes|next|show/i.test(m)) {
    setTripSession(sessionId, { ...state, step:"show_flights" });
    const from = state.from || "bangalore";
    const to   = state.to   || "destination";
    const fN   = from.charAt(0).toUpperCase()+from.slice(1);
    const tN   = to.charAt(0).toUpperCase()+to.slice(1);
    const fc   = CITY_IATA_SRV[from.toLowerCase()] || from.slice(0,3).toUpperCase();
    const tc   = CITY_IATA_SRV[to.toLowerCase()]   || to.slice(0,3).toUpperCase();
    const isIntl = !["BLR","BOM","DEL","MAA","HYD","CCU","GOI","PNQ","COK"].includes(tc);
    const budget = state.budget;

    const flightCards = [
      {type:"flight",airline:"Check Live Fares",from:fN,to:tN,fromCode:fc,toCode:tc,
       departure:"—",arrival:"—",duration:isIntl?"~14–18h (with layover)":"~2h direct",
       price:null,label:"Best Rates",
       insight:isIntl?"Most India–US routes have 1 layover (Dubai/Singapore/London)":"Direct flights available",
       link:buildFlightURL(from,to,"",1)},
    ];

    const flightTip = isIntl
      ? `💡 **Flight tips for ${fN} → ${tN}:**
• Best airlines: Air India (direct), Emirates (via Dubai), Singapore Airlines (via SIN)
• Book **6–8 weeks early** for best prices
• Budget estimate: ₹45,000–₹95,000 return
• ${budget && budget < 50000 ? "⚠️ International flights may exceed your budget — consider increasing slightly for better options." : "Your budget looks good for this route! ✅"}`
      : `💡 **Flight tips:**
• IndiGo & Air India cheapest on this route
• Book **2–4 weeks early** for best prices
• Early morning (5–7 AM) flights are cheapest
• Budget estimate: ₹2,500–₹6,000 one way`;

    return {
      text: `✈️ **SECTION 2 of 5 — Flights: ${fN} → ${tN}**

${flightTip}

---
✅ Section 2 done! Ready to see **hotels** next?`,
      cards: flightCards,
      image: (()=>{const u=getDestImageUrl(to||"");return u?{url:u,caption:"Your destination awaits! ✈️"}:null;})(),
      quickReplies: ["Yes, show me hotels 🏨", "Show all remaining sections"],
      section: "flights", sectionNum: 2, totalSections: 5,
      isTripPlanner: true
    };
  }

  // Step 6: Hotels
  if (state.step === "show_flights" && /hotel|yes|next|show/i.test(m)) {
    setTripSession(sessionId, { ...state, step:"show_activities" });
    const to = state.to || "destination";
    const tN = to.charAt(0).toUpperCase()+to.slice(1);
    const purpose = state.purpose || "tourism";
    const budget = state.budget;

    const hotelCards = buildHotelCards(to, purpose, budget);
    const hotelTip = getHotelTip(to, purpose);

    return {
      text: `🏨 **SECTION 3 of 5 — Hotels in ${tN}**

${hotelTip}

---
✅ Section 3 done! Ready to see **what to do** there?`,
      cards: hotelCards,
      image: (()=>{const u=getDestImageUrl(to||"");return u?{url:u,caption:"Where you'll stay 🏨"}:null;})(),
      quickReplies: ["Yes, show me activities 🗺️", "Show all remaining sections"],
      section: "hotels", sectionNum: 3, totalSections: 5,
      isTripPlanner: true
    };
  }

  // Step 7: Activities
  if (state.step === "show_activities" && /activit|yes|next|show|place|do|visit/i.test(m)) {
    setTripSession(sessionId, { ...state, step:"show_checklist" });
    const to = state.to || "destination";
    const tN = to.charAt(0).toUpperCase()+to.slice(1);
    const purpose = state.purpose || "tourism";
    const activities = getDestinationActivities(to, purpose);

    return {
      text: `🗺️ **SECTION 4 of 5 — Activities & Places in ${tN}**

${activities}

---
✅ Section 4 done! Ready for your **travel checklist** & complete summary?`,
      image: (()=>{const u=getDestImageUrl(to||"");return u?{url:u,caption:"Explore like a local! 🗺️"}:null;})(),
      quickReplies: ["Yes, show my checklist ✅", "Show complete summary now"],
      section: "activities", sectionNum: 4, totalSections: 5,
      isTripPlanner: true
    };
  }

  // Step 8: Checklist + Mind Map + Share
  if (state.step === "show_checklist" || /checklist|summary|complete|show all/i.test(m)) {
    setTripSession(sessionId, { ...state, step:"complete" });
    const { from, to, purpose, budget, travelDate, homeLocation } = state;
    const tN = to ? to.charAt(0).toUpperCase()+to.slice(1) : "destination";
    const fN = from ? from.charAt(0).toUpperCase()+from.slice(1) : "origin";
    const isIntl = !["bangalore","mumbai","delhi","chennai","hyderabad","kolkata","goa","pune","kochi"].includes(to||"");
    const checklist = generateChecklist(to, purpose, isIntl);

    const tripId = Math.random().toString(36).slice(2,8).toUpperCase();
    // Store trip for sharing
    const tripData = { from, to, fN, tN, purpose, budget, travelDate, homeLocation, tripId, checklist, createdAt: new Date().toISOString() };
    setUserPref(userId||0, `trip_${tripId}`, JSON.stringify(tripData)).catch(()=>{});

    return {
      text: `✅ **SECTION 5 of 5 — Your Travel Checklist**

${checklist}

---
🎉 **Your complete trip plan is ready!**`,
      tripSummary: {
        tripId, from:fN, to:tN, purpose, budget,
        travelDate, homeLocation,
        shareUrl: `https://alvryn.in/trip/${tripId}`,
        shareText: `✈️ My trip plan: ${fN} → ${tN} on ${travelDate} — check it out on Alvryn!`
      },
      showMindMap: true,
      section: "checklist", sectionNum: 5, totalSections: 5,
      isTripPlanner: true
    };
  }

  return null; // Not in trip planner flow
}

// ── Local transport advice database ──────────────────────────────────────────
function getLocalTransportAdvice(homeLocation, fromCity) {
  const h = homeLocation.toLowerCase();
  const c = fromCity.toLowerCase();

  if (c === "bangalore" || c === "bengaluru") {
    if (/electronic city|attibele|hosur/i.test(h)) return { advice:"🚌 **Vayu Vajra Bus:** Take BMTC route 500C or 500CA from Electronic City → KIA (₹270)\n🚖 **Cab (Ola/Uber):** ₹600–900, 45–75 mins (avoid peak hours)\n🚕 **Pre-paid taxi:** Available at Electronic City Phase 1 bus stop", time:"1.5–2 hours" };
    if (/whitefield|itpl|kadugodi/i.test(h)) return { advice:"🚇 **Metro + Bus:** Purple Line to Baiyappanahalli → Vayu Vajra bus to airport\n🚖 **Cab:** ₹700–1000, 45–90 mins\n💡 Tip: Metro+bus is cheapest (₹80+₹270)", time:"1.5–2.5 hours" };
    if (/koramangala|hsr|btm/i.test(h)) return { advice:"🚌 **Vayu Vajra Bus:** From Silk Board → KIA (route 500 series) ₹270\n🚖 **Cab:** ₹600–850, 45–75 mins\n💡 Tip: Avoid 8–10AM and 5–8PM traffic", time:"1–1.5 hours" };
    if (/marathahalli|kr puram/i.test(h)) return { advice:"🚌 **Vayu Vajra Bus:** Multiple routes from Marathahalli ₹270\n🚖 **Cab:** ₹500–750, 40–70 mins\n💡 Tip: Old Airport Road can be congested — leave extra time", time:"1–1.5 hours" };
    if (/indiranagar|ulsoor|halasuru/i.test(h)) return { advice:"🚇 **Metro:** Purple Line from Indiranagar → connect Vayu Vajra\n🚌 **Direct bus:** Route 500D from Indiranagar ₹270\n🚖 **Cab:** ₹550–800, 40–65 mins", time:"1–1.5 hours" };
    if (/majestic|city|central|kbs/i.test(h)) return { advice:"🚌 **Vayu Vajra Bus:** Direct from Kempegowda Bus Station (KBS/Majestic) ₹250\n⏱️ Fastest bus option — departs every 20 mins\n🚖 **Cab:** ₹600–900, 45–75 mins via NH 44", time:"1–1.5 hours" };
    if (/yelahanka|hebbal|jalahalli/i.test(h)) return { advice:"🚖 **Cab:** ₹350–550, 25–40 mins (closest zone!)\n🚌 **Local BMTC bus** to airport: Routes available from Yelahanka\n💡 You're in the closest zone — fastest airport access!", time:"30–45 minutes" };
    // Default Bangalore
    return { advice:"🚌 **Vayu Vajra Bus:** From nearest BMTC stop ₹250–350\n🚖 **Cab (Ola/Uber):** ₹500–900 depending on zone\n💡 Book cab 30 mins before departure time", time:"1–2 hours" };
  }

  if (c === "mumbai" || c === "bombay") {
    return { advice:"🚇 **Metro Line 1:** Connect to Andheri, then cab to T2\n🚖 **Cab:** ₹300–700 from South/Central Mumbai\n💡 T1 (domestic) and T2 (international) are separate — confirm your terminal", time:"1–2 hours" };
  }
  if (c === "delhi") {
    return { advice:"🚇 **Airport Express Metro:** From New Delhi/Dwarka stations ₹60–100 (FASTEST)\n🚖 **Cab:** ₹300–700 depending on zone\n💡 Airport Express runs 5AM–11:30PM, takes 20 mins from New Delhi", time:"45 mins–1.5 hours" };
  }
  if (c === "chennai") {
    return { advice:"🚇 **MRTS/Metro:** Connect to Airport station (Tirusulam)\n🚖 **Cab:** ₹300–600 from central Chennai\n🚌 **Bus:** Routes from Koyambedu CMBT to airport", time:"1–1.5 hours" };
  }
  return { advice:"🚖 **Cab (Ola/Uber):** Most convenient option\n🚌 **City bus:** Check local SRTC routes to airport\n💡 Always book cab 20 mins before you want to leave", time:"1–2 hours (varies)" };
}

// ── Hotel cards builder ───────────────────────────────────────────────────────
function buildHotelCards(city, purpose, budget) {
  const c = city.toLowerCase();
  const INTL_HOTELS = {
    "new york":   [{name:"Pod Times Square",area:"Midtown Manhattan",price:"₹8,000–12,000",rating:4.1,note:"Budget-friendly, walking distance to Times Square"},{name:"The Roosevelt Hotel",area:"Midtown East",price:"₹14,000–22,000",rating:4.3,note:"Classic NYC hotel, great location"},{name:"1 Hotel Central Park",area:"Central Park South",price:"₹25,000+",rating:4.7,note:"Luxury, stunning park views"}],
    "dubai":      [{name:"Rove Downtown",area:"Downtown Dubai",price:"₹6,000–10,000",rating:4.2,note:"Budget pick, near Dubai Mall & Burj Khalifa"},{name:"Sofitel Dubai Downtown",area:"Downtown",price:"₹14,000–20,000",rating:4.5,note:"Great Burj Khalifa view"},{name:"Atlantis The Palm",area:"Palm Jumeirah",price:"₹30,000+",rating:4.6,note:"Iconic, beachfront, waterpark"}],
    "singapore":  [{name:"Hotel Mono",area:"Chinatown",price:"₹5,000–8,000",rating:4.3,note:"Budget boutique, great MRT access"},{name:"Marriott Tang Plaza",area:"Orchard Road",price:"₹16,000–24,000",rating:4.5,note:"Shopping district"},{name:"Marina Bay Sands",area:"Marina Bay",price:"₹35,000+",rating:4.6,note:"Iconic infinity pool"}],
    "bangkok":    [{name:"Lub*d Bangkok Siam",area:"Siam",price:"₹1,500–3,000",rating:4.2,note:"Budget/backpacker, central location"},{name:"Centara Grand",area:"CentralWorld",price:"₹7,000–12,000",rating:4.5,note:"Mid-range, great shopping access"},{name:"Capella Bangkok",area:"Charoenkrung",price:"₹25,000+",rating:4.8,note:"Luxury riverfront"}],
    "london":     [{name:"Point A Hotel Westminster",area:"Westminster",price:"₹9,000–14,000",rating:4.1,note:"Budget-friendly, great tube access"},{name:"The Savoy",area:"Strand",price:"₹45,000+",rating:4.8,note:"Historic luxury, Thames views"}],
    "bali":       [{name:"Kuta Beach Club",area:"Kuta",price:"₹2,500–5,000",rating:4.0,note:"Budget, near beach & nightlife"},{name:"Four Seasons Sayan",area:"Ubud",price:"₹25,000+",rating:4.9,note:"Jungle luxury, iconic"}],
  };

  const hotels = INTL_HOTELS[c];
  if (hotels) {
    return hotels.slice(0, purpose==="backpacking"?1:3).map(h=>({
      type:"hotel", city:city.charAt(0).toUpperCase()+city.slice(1),
      name:h.name, area:h.area, priceRange:h.price, rating:h.rating,
      label:hotels.indexOf(h)===0?"Best Value":hotels.indexOf(h)===2?"Luxury Pick":null,
      insight:h.note,
      link:`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(h.name+", "+city)}`
    }));
  }
  // Indian destinations
  const pr = HOTEL_PRICES[c] || "800–4,000";
  return [{type:"hotel",city:city.charAt(0).toUpperCase()+city.slice(1),priceRange:pr,label:"Best Rates",insight:"Browse all options on other booking sites",link:`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}`}];
}

function getHotelTip(city, purpose) {
  const c = city.toLowerCase();
  const tips = {
    "new york": "🗽 **New York hotel tips:**\n• Midtown Manhattan = best location for tourists\n• Times Square area = central but can be noisy\n• Book **4–6 weeks early** — NYC fills up fast!\n• Check if breakfast is included — saves ₹1,500–2,500/day",
    "dubai": "🏙️ **Dubai hotel tips:**\n• Downtown Dubai = near Burj Khalifa & Dubai Mall\n• JBR/Marina = beachfront, great for families\n• Book during non-peak (summer = cheaper but very hot)\n• Many hotels include breakfast in packages",
    "singapore": "🌇 **Singapore hotel tips:**\n• Marina Bay/Orchard = tourist hub\n• Chinatown/Little India = cheaper + local experience\n• Book 3–4 weeks early, especially on weekends",
    "goa": "🏖️ **Goa hotel tips:**\n• North Goa = parties, nightlife, younger crowd\n• South Goa = peaceful, cleaner beaches, families\n• Oct–Mar: book 2+ weeks early\n• Many resorts include breakfast",
  };
  return tips[c] || `🏨 **Hotel tip:** Book early for best rates. Compare prices on other booking sites — prices vary significantly by season.`;
}

function getDestinationActivities(city, purpose) {
  const c = city.toLowerCase();
  const ACTIVITIES = {
    "new york": `🗽 **Must-do in New York:**

**Free / Cheap:**
• Central Park walk/picnic
• Brooklyn Bridge walk (stunning views)
• Times Square at night
• High Line park
• Staten Island Ferry (free, Statue of Liberty view!)

**Paid Attractions:**
• Statue of Liberty & Ellis Island: ₹2,800/person
• Empire State Building: ₹3,500/person
• Metropolitan Museum of Art: ₹2,100/person
• One World Observatory: ₹3,200/person

**Food:**
• Joe's Pizza (iconic, ₹300/slice)
• Katz's Deli (₹1,500)
• Chinatown for cheap meals (₹400–800)

**Local Transport in NYC:**
🚇 Subway: $2.90/ride (buy MetroCard or tap card)
🚶 Most Manhattan sights are walkable
🚕 Yellow cab for 10pm+ or rainy days`,

    "dubai": `🏙️ **Must-do in Dubai:**

**Free / Cheap:**
• Burj Khalifa views from outside (free)
• Dubai Mall & Dubai Fountain show (evenings, free)
• JBR Walk & beach
• Old Dubai (Al Fahidi, Gold Souk, Spice Souk)

**Paid Attractions:**
• Burj Khalifa top (At The Top): ₹3,500–5,000
• Desert Safari: ₹4,000–6,000 (must-do!)
• Dubai Frame: ₹2,000
• IMG Worlds of Adventure: ₹6,000

**Local Transport:**
🚇 Dubai Metro: very clean, ₹60–150/ride
🚖 Uber/Careem: affordable
🚌 RTA buses: cheapest option`,

    "singapore": `🦁 **Must-do in Singapore:**

**Free / Cheap:**
• Gardens by the Bay light show (8PM & 9PM, free)
• Marina Bay Sands observation deck view (from outside)
• Merlion Park
• Hawker centres (local food ₹200–400/meal)
• Little India & Chinatown exploration

**Paid:**
• Universal Studios Singapore: ₹6,000
• Singapore Zoo/Night Safari: ₹5,000
• Gardens by the Bay domes: ₹2,000
• Sentosa island: various options ₹500–8,000

**Transport:**
🚇 MRT (metro) — extremely efficient, ₹80–200/ride
📱 Buy EZ-Link card at airport for MRT+bus`,

    "goa": `🏖️ **Must-do in Goa:**

**Beaches:**
• Baga & Calangute (busy, party scene)
• Anjuna (hippie markets Wednesday evenings)
• Palolem, South Goa (peaceful, beautiful)
• Vagator (sunset views, dramatic cliffs)

**Activities:**
• Water sports: jet ski, parasailing ₹500–1,500
• Dudhsagar Waterfalls trek/jeep tour ₹1,200–2,000
• Old Goa churches (UNESCO heritage, free)
• Night markets (November–March)

**Food:**
🍤 Seafood thali: ₹200–400
🥘 Fish curry rice: ₹150–300
• Britto's, Infantaria, Fisherman's Wharf (classics)

**Transport in Goa:**
🏍️ Rent scooter: ₹300–400/day (most popular)
🚗 Rent car: ₹1,000–1,500/day with driver`,
  };
  return ACTIVITIES[c] || `🗺️ **Activities in ${city.charAt(0).toUpperCase()+city.slice(1)}:**

Explore local markets, historical sites, and cuisine. I'll have more specific recommendations as I learn more about your interests! For now, check other booking sites for top-rated activities in ${city.charAt(0).toUpperCase()+city.slice(1)}.`;
}

function generateChecklist(city, purpose, isInternational) {
  const c = city ? city.toLowerCase() : "";
  let list = "**📋 Your Travel Checklist:**\n\n";

  if (isInternational) {
    list += "**Documents:**\n✅ Passport (valid 6+ months beyond return date)\n✅ Visa (apply 3–4 weeks before travel)\n✅ Travel insurance (strongly recommended)\n✅ Flight booking confirmation\n✅ Hotel booking confirmation\n✅ Emergency contacts written down\n\n";
    list += "**Money:**\n✅ Inform your bank about international travel\n✅ Carry some cash in destination currency\n✅ Get international debit/credit card (zero forex: Niyo, IndusInd)\n✅ Note: 1 USD ≈ ₹84, 1 EUR ≈ ₹91, 1 SGD ≈ ₹63\n\n";
  } else {
    list += "**Documents:**\n✅ Aadhaar / PAN / Passport (any valid photo ID)\n✅ Flight/bus/train booking confirmation\n✅ Hotel booking confirmation\n\n";
    list += "**Money:**\n✅ Cash + UPI (both work everywhere in India)\n✅ Note destination city ATM availability\n\n";
  }

  list += "**Phone & Tech:**\n✅ Download offline maps (Google Maps → download area)\n✅ Save airline/hotel helpline numbers\n✅ Charge all devices before travel\n";
  if (isInternational) list += "✅ International SIM or roaming pack (Airtel/Jio ₹600–1500/week)\n";

  if (/goa|beach|bali|maldives|phuket|varkala/.test(c)) {
    list += "\n**Beach Trip:**\n☀️ Sunscreen SPF 50+\n🩴 Flip flops + water shoes\n👙 Swimwear\n🕶️ Sunglasses\n💊 Sea sickness tablets if prone\n";
  } else if (/manali|shimla|leh|ladakh|kedarnath|hill/.test(c)) {
    list += "\n**Hill/Cold Trip:**\n🧥 Heavy jacket / thermal layers\n🥾 Warm waterproof boots\n🧤 Gloves + woollen cap\n💊 AMS tablets if going above 3500m (Diamox)\n⚡ Power bank (cold kills phone battery)\n";
  } else if (/new york|london|paris|europe/.test(c)) {
    list += "\n**Western City Trip:**\n🧥 Layers for variable weather\n👟 Comfortable walking shoes (you'll walk 8–12km/day!)\n🔌 Universal power adapter\n💊 Basic medicines\n";
  } else if (/dubai|middle east/.test(c)) {
    list += "\n**Dubai/Middle East:**\n👗 Modest clothing for mosques/old areas\n🕶️ Sunglasses (essential!)\n☀️ Sunscreen SPF 50+\n💧 Keep hydrated — extreme heat\n";
  }

  list += "\n**Before You Leave:**\n✅ Lock your home\n✅ Share itinerary with family\n✅ Download AlVryn app for updates 😊\n✅ Take photos of all important documents";
  return list;
}

// ════════════════════════════════════════════════════════════════════════════
//  SHARE TRIP PLAN endpoint
// ════════════════════════════════════════════════════════════════════════════

app.get("/trip/:tripId", async (req, res) => {
  try {
    const { tripId } = req.params;
    // Search user_preferences for this trip
    const r = await pool.query(
      "SELECT pref_value FROM user_preferences WHERE pref_key=$1 LIMIT 1",
      [`trip_${tripId}`]
    );
    if (!r.rows.length) {
      return res.status(404).json({ message: "Trip not found" });
    }
    const trip = JSON.parse(r.rows[0].pref_value);
    res.json(trip);
  } catch(e) {
    res.status(500).json({ message: "Error loading trip" });
  }
});

// ════════════════════════════════════════════════════════════════════════════
//  WHATSAPP → WEB HANDOFF
// ════════════════════════════════════════════════════════════════════════════

const waWebSessions = new Map(); // phone → { messages[], sessionId }

function storeWAMessage(phone, role, content) {
  const existing = waWebSessions.get(phone) || { messages:[], sessionId: Math.random().toString(36).slice(2,8) };
  existing.messages.push({ role, content, time: Date.now() });
  if (existing.messages.length > 50) existing.messages = existing.messages.slice(-50);
  waWebSessions.set(phone, existing);
  return existing.sessionId;
}

app.get("/wa-session/:phone", async (req, res) => {
  const phone = req.params.phone.replace(/[^0-9]/g,"");
  const session = waWebSessions.get(phone);
  if (!session) return res.status(404).json({ message: "No session" });
  res.json({ messages: session.messages, sessionId: session.sessionId });
});

// ════════════════════════════════════════════════════════════════════════════
//  UPDATED /ai-chat WITH TRIP PLANNER + MEMORY
// ════════════════════════════════════════════════════════════════════════════

app.post("/ai-chat-v2", authenticateToken, async (req, res) => {
  const { message, history=[], sessionId } = req.body || {};
  if (!message) return res.status(400).json({ message:"No message" });

  const userId   = req.user?.id;
  const userName = req.user?.name || "";
  const sid      = sessionId || `web_${userId}_${Date.now()}`;

  try {
    // Load user memory
    const prefs = userId ? await getUserPrefs(userId) : {};

    // Update memory in background
    updateUserMemory(userId, message, "").catch(()=>{});

    // ── TRIP PLANNER FLOW ────────────────────────────────────────────────────
    // Check if ongoing trip planner session
    const existingSession = getTripSession(sid);
    if (existingSession && existingSession.step !== "complete") {
      const tripResult = await runTripPlanner(sid, message, userId, userName);
      if (tripResult) {
        logEvent("ai_trip_planner", `step:${existingSession.step}`, "ai_chat", userId).catch(()=>{});
        return res.json(tripResult);
      }
    }

    // Check if new trip planner intent
    if (detectsTripIntent(message) && !existingSession) {
      const tripResult = await runTripPlanner(sid, message, userId, userName);
      if (tripResult) {
        logEvent("ai_trip_start", message.slice(0,80), "ai_chat", userId).catch(()=>{});
        return res.json({ ...tripResult, sessionId: sid });
      }
    }

    // ── TIER 1: Knowledge base (instant, free) ───────────────────────────────
    // Personal greeting for returning users
    const personalGreeting = userId ? buildPersonalGreeting(userName, prefs, message) : null;
    const easy = easyResponse(message);
    if (easy) {
      if (personalGreeting && /^(hi|hello|hey|hlo)/i.test(message.trim())) {
        easy.text = personalGreeting + "\n\n" + easy.text;
      }
      logEvent("ai_easy", message.slice(0,80), "ai_chat", userId).catch(()=>{});
      return res.json({ ...easy, sessionId: sid });
    }

    // ── TIER 2: DB flight lookup ─────────────────────────────────────────────
    const dbResult = await tryDBFlights(message);
    if (dbResult) {
      logEvent("ai_medium", message.slice(0,80), "ai_chat", userId).catch(()=>{});
      return res.json({ ...dbResult, sessionId: sid });
    }

    // ── TIER 3: AI (Groq/GPT) ────────────────────────────────────────────────
    const userCallCount = getUserAiCount(userId);
    if (userCallCount >= DAILY_LIMIT) {
      const cards = buildCardsFromIntent(message);
      return res.json({ sessionId: sid,
        text: `You've used your ${DAILY_LIMIT} free AI responses today! 🎯

Book a trip via Alvryn to unlock more. Here are options I found 👇`,
        cards, cta:"💡 Book via Alvryn to unlock unlimited AI responses."
      });
    }

    incrementUserAi(userId);
    const remaining = DAILY_LIMIT - getUserAiCount(userId);
    const cards = buildCardsFromIntent(message);

    // Choose Groq vs GPT based on query complexity
    const tier = classifyQuery(message);
    const aiText = await askAI(
      message,
      tier === "hard" ? "complex" : "simple",
      `You are Alvryn AI. Travel assistant for India. Be friendly, SHORT responses (3-4 sentences), use emojis. User data: ${JSON.stringify({prefs: Object.keys(prefs).slice(0,5)})}`
    );

    if (aiText) {
      const limitNote = remaining <= 3 ? `

_💡 ${remaining} AI responses left today._` : "";
      logEvent("ai_api", message.slice(0,80), "ai_chat", userId).catch(()=>{});
      return res.json({ sessionId: sid, text: aiText + limitNote, cards, cta: cards.length?"💡 Tap any card for live prices.":null });
    }

    // Final fallback
    const fallback = smartFallback(message);
    return res.json({ ...fallback, sessionId: sid });

  } catch(e) {
    console.error("AI Chat v2:", e.message);
    try {
      return res.json({ ...smartFallback(message), sessionId: sid });
    } catch {
      return res.json({ sessionId: sid, text:"I'm here to help with your travel plans! 😊 Try: flights from Bangalore to Delhi", cards:[], cta:null });
    }
  }
});


// ════════════════════════════════════════════════════════════════════════════
//  CHAT HISTORY — Sync across devices via DB
// ════════════════════════════════════════════════════════════════════════════

async function ensureChatsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_chats (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        chat_id VARCHAR(64) NOT NULL,
        title VARCHAR(200) DEFAULT 'New chat',
        messages JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, chat_id)
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_chats_user ON user_chats(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_chats_updated ON user_chats(updated_at DESC)`);
  } catch(e) { console.error("user_chats table:", e.message); }
}
ensureChatsTable().catch(console.error);

// GET all chats for user
app.get("/chats", authenticateToken, async (req, res) => {
  try {
    const r = await pool.query(
      "SELECT chat_id, title, messages, created_at, updated_at FROM user_chats WHERE user_id=$1 ORDER BY updated_at DESC LIMIT 50",
      [req.user.id]
    );
    res.json(r.rows);
  } catch(e) { res.status(500).json({ message:"Error loading chats" }); }
});

// Save/update a chat
app.post("/chats/:chatId", authenticateToken, async (req, res) => {
  try {
    const { title, messages } = req.body;
    const { chatId } = req.params;
    await pool.query(`
      INSERT INTO user_chats (user_id, chat_id, title, messages, updated_at)
      VALUES ($1,$2,$3,$4,NOW())
      ON CONFLICT (user_id, chat_id)
      DO UPDATE SET title=$3, messages=$4, updated_at=NOW()
    `, [req.user.id, chatId, title||"New chat", JSON.stringify(messages||[])]);
    res.json({ ok:true });
  } catch(e) { res.status(500).json({ message:"Error saving chat" }); }
});

// Delete a chat
app.delete("/chats/:chatId", authenticateToken, async (req, res) => {
  try {
    await pool.query("DELETE FROM user_chats WHERE user_id=$1 AND chat_id=$2", [req.user.id, req.params.chatId]);
    res.json({ ok:true });
  } catch(e) { res.status(500).json({ message:"Error deleting chat" }); }
});

// ════════════════════════════════════════════════════════════════════════════
//  PRICE ALERTS
// ════════════════════════════════════════════════════════════════════════════

async function ensurePriceAlertsTable() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS price_alerts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      from_city VARCHAR(80),
      to_city VARCHAR(80),
      current_price INTEGER,
      target_price INTEGER,
      email VARCHAR(200),
      notified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
  } catch(e) { console.error("price_alerts table:", e.message); }
}
ensurePriceAlertsTable().catch(console.error);

app.post("/price-alert", authenticateToken, async (req, res) => {
  try {
    const { from_city, to_city, current_price, target_price } = req.body;
    const userResult = await pool.query("SELECT email,name FROM users WHERE id=$1",[req.user.id]);
    const email = userResult.rows[0]?.email;
    await pool.query(
      "INSERT INTO price_alerts (user_id,from_city,to_city,current_price,target_price,email) VALUES ($1,$2,$3,$4,$5,$6)",
      [req.user.id, from_city, to_city, current_price||null, target_price||null, email]
    );
    res.json({ ok:true, message:`Price alert set! We'll notify you at ${email} when prices drop.` });
  } catch(e) { res.status(500).json({ message:"Error setting alert" }); }
});

app.get("/price-alerts", authenticateToken, async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM price_alerts WHERE user_id=$1 AND notified=FALSE ORDER BY created_at DESC", [req.user.id]);
    res.json(r.rows);
  } catch(e) { res.status(500).json({ message:"Error loading alerts" }); }
});

// ════════════════════════════════════════════════════════════════════════════
//  PRICE INTELLIGENCE — stored data, no API needed
// ════════════════════════════════════════════════════════════════════════════

const PRICE_INTELLIGENCE = {
  // Domestic India routes — cheapest months and days
  "blr-del": { cheapestMonths:["February","March","September","October"], cheapestDays:["Tuesday","Wednesday"], avgPrice:3200, peakMonths:["December","January","April","May"], tip:"Book 4–6 weeks ahead. Morning flights (5–8AM) are 20% cheaper." },
  "blr-bom": { cheapestMonths:["February","March","October"], cheapestDays:["Tuesday","Wednesday","Saturday"], avgPrice:2800, peakMonths:["December","May"], tip:"Multiple direct flights daily. IndiGo and Air India cheapest." },
  "blr-maa": { cheapestMonths:["February","March","October","November"], cheapestDays:["Tuesday","Wednesday"], avgPrice:1800, peakMonths:["December","April"], tip:"Short 1h flight. Take morning or late-night for cheapest fares." },
  "del-bom": { cheapestMonths:["February","September","October"], cheapestDays:["Tuesday","Wednesday"], avgPrice:3500, peakMonths:["December","January","May"], tip:"Book 3–5 weeks ahead. Air India and IndiGo most frequent." },
  "blr-hyd": { cheapestMonths:["February","March","October"], cheapestDays:["Monday","Tuesday","Wednesday"], avgPrice:1500, peakMonths:["December","April"], tip:"Only 45-min flight. Sometimes bus is cheaper for flexible travellers." },
  "blr-goi": { cheapestMonths:["June","July","August","September","October"], cheapestDays:["Tuesday","Wednesday"], avgPrice:2200, peakMonths:["December","January","February"], tip:"Fly in monsoon (Jun–Sep) for 40% cheaper fares — Goa is still beautiful!" },
  "blr-cok": { cheapestMonths:["February","March","September","October"], cheapestDays:["Tuesday","Wednesday"], avgPrice:1900, peakMonths:["December","January"], tip:"1h flight to Kochi. IndiGo usually cheapest." },
  // International
  "blr-dxb": { cheapestMonths:["May","June","July","August","September"], cheapestDays:["Tuesday","Wednesday","Thursday"], avgPrice:18000, peakMonths:["December","January","February"], tip:"Dubai summer (May–Aug) is hot but flights are 40% cheaper. Air Arabia and IndiGo cheapest." },
  "blr-sin": { cheapestMonths:["February","March","September","October"], cheapestDays:["Tuesday","Wednesday"], avgPrice:16000, peakMonths:["June","December"], tip:"IndiGo direct Bangalore–Singapore is cheapest. Book 6–8 weeks ahead." },
  "del-lhr": { cheapestMonths:["January","February","March","October","November"], cheapestDays:["Tuesday","Wednesday","Thursday"], avgPrice:45000, peakMonths:["June","July","December"], tip:"Air India direct cheapest. Via Middle East (Emirates/Qatar) often cheaper by ₹8,000–12,000." },
};

function getPriceIntelligence(from, to) {
  if (!from || !to) return null;
  const fc = CITY_IATA_SRV[from?.toLowerCase()]?.toLowerCase() || from?.slice(0,3).toLowerCase();
  const tc = CITY_IATA_SRV[to?.toLowerCase()]?.toLowerCase()   || to?.slice(0,3).toLowerCase();
  return PRICE_INTELLIGENCE[`${fc}-${tc}`] || PRICE_INTELLIGENCE[`${tc}-${fc}`] || null;
}

// GET price intelligence for a route
app.get("/price-intel", async (req, res) => {
  try {
    const { from, to } = req.query;
    const intel = getPriceIntelligence(from, to);
    if (!intel) return res.json({ found:false });
    res.json({ found:true, ...intel });
  } catch(e) { res.status(500).json({ found:false }); }
});

// ════════════════════════════════════════════════════════════════════════════
//  DESTINATION IMAGES — Unsplash free API
// ════════════════════════════════════════════════════════════════════════════

const DEST_IMAGES = {
  // Pre-stored Unsplash image IDs for top destinations (free, no API key needed for these)
  "goa":          "photo-1512343879784-a960bf40e7f2",
  "mumbai":       "photo-1529253355930-ddbe423a2ac7",
  "delhi":        "photo-1587474260584-136574528ed5",
  "jaipur":       "photo-1477587458883-47145ed6d1f5",
  "kerala":       "photo-1602216056096-3b40cc0c9944",
  "bangalore":    "photo-1596176530529-78163a4f7af2",
  "hyderabad":    "photo-1570168007204-dfb528c6958f",
  "kolkata":      "photo-1558431382-27e303142255",
  "agra":         "photo-1564507592333-c60657eea523",
  "varanasi":     "photo-1561361058-c24e0bde46c6",
  "manali":       "photo-1626621341517-bbf3d9990a23",
  "shimla":       "photo-1597916829826-02e5bb4a54e0",
  "coorg":        "photo-1599661046289-e31897846e41",
  "ooty":         "photo-1582719508461-905c673771fd",
  "new york":     "photo-1496442226666-8d4d0e62e6e9",
  "dubai":        "photo-1512453979798-5ea266f8880c",
  "singapore":    "photo-1525625293386-3f8f99389edd",
  "bangkok":      "photo-1508009603885-50cf7c579365",
  "bali":         "photo-1537996194471-e657df975ab4",
  "london":       "photo-1513635269975-59663e0ac1ad",
  "paris":        "photo-1502602898657-3e91760cbb34",
  "tokyo":        "photo-1540959733332-eab4deabeeaf",
  "maldives":     "photo-1514282401047-d79a71a590e8",
  "sri lanka":    "photo-1578662996442-48f60103fc96",
  "myanmar":      "photo-1558618666-fcd25c85cd64",
  "vietnam":      "photo-1583417319070-4a69db38a482",
};

function getDestImageUrl(city, size="800x450") {
  const key = city?.toLowerCase().trim();
  const photoId = DEST_IMAGES[key] || DEST_IMAGES[Object.keys(DEST_IMAGES).find(k => key?.includes(k))||""];
  if (!photoId) return null;
  const [w,h] = size.split("x");
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;
}

// GET destination image
app.get("/dest-image", async (req, res) => {
  try {
    const { city } = req.query;
    const url = getDestImageUrl(city);
    if (!url) return res.json({ found:false });
    res.json({ found:true, url, credit:"Photo from Unsplash" });
  } catch(e) { res.json({ found:false }); }
});

// ════════════════════════════════════════════════════════════════════════════
//  GLOBAL AIRPORT PROXIMITY — handle worldwide home locations
// ════════════════════════════════════════════════════════════════════════════

const GLOBAL_AIRPORTS = {
  // India — major cities + areas
  "electronic city":    {airport:"Kempegowda International Airport (BLR)", code:"BLR", time:"1.5–2 hours", transport:"BMTC Vayu Vajra bus ₹270 or Ola/Uber ₹600–900"},
  "whitefield":         {airport:"Kempegowda International Airport (BLR)", code:"BLR", time:"1.5–2.5 hours", transport:"Metro Purple Line → Vayu Vajra bus, or Ola/Uber ₹700–1000"},
  "koramangala":        {airport:"Kempegowda International Airport (BLR)", code:"BLR", time:"1–1.5 hours", transport:"Vayu Vajra bus from Silk Board ₹270 or Ola/Uber ₹600–850"},
  "hsr layout":         {airport:"Kempegowda International Airport (BLR)", code:"BLR", time:"1–1.5 hours", transport:"Vayu Vajra bus from Silk Board ₹270 or Ola/Uber ₹600–800"},
  "marathahalli":       {airport:"Kempegowda International Airport (BLR)", code:"BLR", time:"1–1.5 hours", transport:"Vayu Vajra bus ₹270 or Ola/Uber ₹500–750"},
  "indiranagar":        {airport:"Kempegowda International Airport (BLR)", code:"BLR", time:"1–1.5 hours", transport:"Metro + Vayu Vajra or Ola/Uber ₹550–800"},
  "jp nagar":           {airport:"Kempegowda International Airport (BLR)", code:"BLR", time:"1–1.5 hours", transport:"Vayu Vajra from Banashankari ₹270 or Ola/Uber ₹600–850"},
  "hebbal":             {airport:"Kempegowda International Airport (BLR)", code:"BLR", time:"30–45 minutes", transport:"Direct via NH44, Ola/Uber ₹350–550 — closest zone!"},
  "yelahanka":          {airport:"Kempegowda International Airport (BLR)", code:"BLR", time:"25–40 minutes", transport:"Ola/Uber ₹300–500 — very close to airport"},
  "majestic":           {airport:"Kempegowda International Airport (BLR)", code:"BLR", time:"1–1.5 hours", transport:"Direct Vayu Vajra bus from KBS ₹250 every 20 mins"},
  "bangalore":          {airport:"Kempegowda International Airport (BLR)", code:"BLR", time:"1–2 hours", transport:"Vayu Vajra bus ₹250–350 or Ola/Uber ₹500–900"},
  "chennai":            {airport:"Chennai International Airport (MAA)", code:"MAA", time:"30–60 minutes", transport:"Airport Metro Line or Ola/Uber ₹300–600"},
  "mumbai":             {airport:"CSIA Mumbai Airport (BOM)", code:"BOM", time:"30–90 minutes", transport:"Metro Line 1 to Andheri, then cab. Or Ola/Uber ₹300–700"},
  "delhi":              {airport:"IGI Airport Delhi (DEL)", code:"DEL", time:"30–60 minutes", transport:"Airport Express Metro from New Delhi station ₹60–100 (fastest!), or Ola/Uber ₹300–700"},
  "hyderabad":          {airport:"Rajiv Gandhi Intl Airport (HYD)", code:"HYD", time:"45–75 minutes", transport:"TSRTC airport bus ₹200 or Ola/Uber ₹500–800"},
  "kolkata":            {airport:"Netaji Subhash Chandra Bose Airport (CCU)", code:"CCU", time:"30–60 minutes", transport:"Ola/Uber ₹300–600 or AC bus"},
  "pune":               {airport:"Pune Airport (PNQ)", code:"PNQ", time:"20–40 minutes", transport:"Ola/Uber ₹300–500"},
  "goa":                {airport:"Goa International Airport (GOI)", code:"GOI", time:"20–60 minutes", transport:"Ola/Uber ₹300–600 or prepaid taxi"},
  "kochi":              {airport:"Cochin International Airport (COK)", code:"COK", time:"30–60 minutes", transport:"Airport shuttle or Ola/Uber ₹400–700"},
  // International cities
  "new york":           {airport:"John F. Kennedy (JFK) or Newark (EWR) or LaGuardia (LGA)", code:"JFK/EWR/LGA", time:"45–90 minutes", transport:"NYC Subway AirTrain to JFK $8.25, or Uber/Lyft $45–80"},
  "manhattan":          {airport:"JFK Airport", code:"JFK", time:"45–75 minutes", transport:"AirTrain + Subway $8.25 (cheapest!) or Uber $45–70"},
  "brooklyn":           {airport:"JFK Airport", code:"JFK", time:"30–60 minutes", transport:"AirTrain + Subway $8.25 or Uber $35–55"},
  "dubai":              {airport:"Dubai International Airport (DXB)", code:"DXB", time:"20–60 minutes", transport:"Dubai Metro (Red Line) ₹180–240 or Careem/Uber ₹600–1200"},
  "downtown dubai":     {airport:"Dubai International Airport (DXB)", code:"DXB", time:"25–45 minutes", transport:"Metro Red Line (very clean!) ₹180 or Careem ₹600–900"},
  "singapore":          {airport:"Changi Airport (SIN)", code:"SIN", time:"20–50 minutes", transport:"MRT East-West Line $2.10–3.50 SGD (fastest!) or Grab $18–28 SGD"},
  "orchard road":       {airport:"Changi Airport (SIN)", code:"SIN", time:"30–50 minutes", transport:"MRT from Orchard station $2.50 SGD or Grab $22–30 SGD"},
  "bangkok":            {airport:"Suvarnabhumi Airport (BKK)", code:"BKK", time:"30–60 minutes", transport:"Airport Rail Link 45 baht (fastest!) or Grab $5–15 USD"},
  "london":             {airport:"Heathrow (LHR) or Gatwick (LGW) or Stansted (STN)", code:"LHR", time:"30–75 minutes", transport:"Heathrow Express £25 (fastest, 15 min) or Tube £5.60 or Uber £45–70"},
  "central london":     {airport:"Heathrow Airport (LHR)", code:"LHR", time:"40–60 minutes", transport:"Piccadilly Line Tube £5.60 or Heathrow Express £25"},
  "paris":              {airport:"Charles de Gaulle Airport (CDG)", code:"CDG", time:"35–60 minutes", transport:"RER B train €11.80 or Uber €35–55"},
  "tokyo":              {airport:"Narita (NRT) or Haneda (HND)", code:"NRT/HND", time:"1–2 hours", transport:"Narita Express ¥3,070 or Haneda Monorail ¥500 (much closer!)"},
  "kuala lumpur":       {airport:"KLIA or KLIA2 (KUL)", code:"KUL", time:"45–75 minutes", transport:"KLIA Ekspres RM55 (35 min, fastest!) or Grab RM60–80"},
  "sydney":             {airport:"Sydney Airport (SYD)", code:"SYD", time:"20–40 minutes", transport:"Airport train $20 AUD or Uber $35–50 AUD"},
  "bali":               {airport:"Ngurah Rai International Airport (DPS)", code:"DPS", time:"20–60 minutes", transport:"Grab/GoJek ₹300–500 or metered taxi ₹400–700"},
  "seminyak":           {airport:"Bali Airport (DPS)", code:"DPS", time:"20–35 minutes", transport:"Grab ₹250–400 or hotel transfer"},
  "ubud":               {airport:"Bali Airport (DPS)", code:"DPS", time:"60–90 minutes", transport:"Private transfer ₹600–1000 (no public transport) — book in advance!"},
  "colombo":            {airport:"Bandaranaike International Airport (CMB)", code:"CMB", time:"30–45 minutes", transport:"Bus ₹80–120 or taxi ₹500–800"},
};

function getAirportInfo(homeLocation) {
  if (!homeLocation) return null;
  const h = homeLocation.toLowerCase().trim();
  // Direct match
  if (GLOBAL_AIRPORTS[h]) return GLOBAL_AIRPORTS[h];
  // Partial match
  const key = Object.keys(GLOBAL_AIRPORTS).find(k => h.includes(k) || k.includes(h.split(" ")[0]));
  if (key) return GLOBAL_AIRPORTS[key];
  return null; // Unknown location — AI will handle
}


// WhatsApp → Web session handoff
app.get("/wa/:shortId", async (req, res) => {
  // Find the WA session by short ID suffix
  const shortId = req.params.shortId;
  let foundPhone = null;
  for (const [phone, session] of waWebSessions) {
    if (session.sessionId?.slice(-8) === shortId) {
      foundPhone = phone;
      break;
    }
  }
  if (!foundPhone) {
    return res.redirect("https://alvryn.in/ai");
  }
  // Redirect to AI chat with session
  res.redirect(`https://alvryn.in/ai?wa_session=${foundPhone}`);
});

app.get("/wa-session/:phone", async (req, res) => {
  const phone = req.params.phone.replace(/[^0-9]/g,"");
  const session = waWebSessions.get(phone);
  if (!session) return res.status(404).json({ message:"No session" });
  res.json({ messages:session.messages, sessionId:session.sessionId });
});

// ── START SERVER ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`ALVRYN BACKEND running on port ${PORT}`);
});