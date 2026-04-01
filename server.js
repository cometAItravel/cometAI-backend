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
  "trivandrum":"trivandrum","thiruvananthapuram":"trivandrum","trv":"trivandrum",
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
  const t = text.toLowerCase()
    .replace(/\b(flights?|buses?|bus|flight|book|hotels?|hotel|stay|rooms?|mujhe|muje|chahiye|please|kya|hai|se|ko|ka|ek|ticket|find|search|show|bata|dikha|looking|want|need|enakku|vendum|naaku|kavali)\b/gi, " ")
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
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "secretkey");
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
  const msg    = rawMsg.toLowerCase();
  const phone  = req.body.From;
  let reply    = "";

  if (!userSessions[phone]) userSessions[phone] = { step:"idle", type:"none" };
  const session = userSessions[phone];

  try {
    // Global reset
    if (["hi","hello","hey","start","restart","cancel","reset","stop","menu"].some(w => msg.includes(w)) && session.step !== "idle") {
      userSessions[phone] = { step:"idle", type:"none" };
      reply = `✈️ *Alvryn AI*\n\nRestarted! What would you like to search?\n\n✈️ Type your flight route\n🚌 Type your bus route\n🏨 Type hotel city`;
    }
    // Detect intent from idle
    else if (session.step === "idle") {

      const busKw  = /\b(bus|buses|coach|volvo|sleeper|seater|ksrtc|msrtc)\b/i;
      const hotelKw= /\b(hotel|hotels|stay|room|rooms|accommodation|lodge|resort)\b/i;

      if (hotelKw.test(msg)) {
        // Hotel search
        const { from } = extractCities(msg);
        const city = from || msg.replace(/\b(hotel|hotels|stay|in|at|for|rooms?)\b/gi,"").trim().split(/\s+/)[0];
        if (!city || city.length < 2) {
          reply = `🏨 *Hotel Search*\n\nWhich city do you want hotels in?\n\nExamples:\n_hotel in goa_\n_hotels bangalore_\n_hotel mumbai_`;
        } else {
          const displayCity = city.charAt(0).toUpperCase() + city.slice(1);
          await logEvent("hotel_search", `WhatsApp: ${displayCity}`, "whatsapp");
          reply = `🏨 *Hotels in ${displayCity}*\n\nI'll find the best options for you on our partner site.\n\n👉 Tap to view hotels:\nhttps://www.booking.com/searchresults.html?ss=${encodeURIComponent(displayCity)}\n\n_Best prices guaranteed via our partner_`;
        }
      }
      else if (busKw.test(msg)) {
        // Bus search
        const { from, to } = extractCities(msg);
        if (!from || !to) {
          reply = `🚌 *Alvryn AI — Bus Search*\n\nTell me your route naturally:\n\n_"bus bangalore to chennai tomorrow"_\n_"bus blr to hyd kal"_\n_"volvo mumbai to goa"_\n\nI understand any style of English, Hindi, Tamil!`;
          session.step = "bus_search";
        } else {
          const { date: targetDate, pastDate } = extractDate(msg);
          if (pastDate) {
            reply = `⏰ That date is in the past! Please search for today or a future date.`;
          } else {
            const buses = WA_BUS_ROUTES.filter(b => b.from === from && b.to === to);
            await logEvent("bus_search", `WhatsApp: ${from} → ${to}`, "whatsapp");
            if (buses.length === 0) {
              reply = `🚌 *${from.toUpperCase()} → ${to.toUpperCase()}*\n\nLet me check more options on RedBus for you:\n👉 https://www.redbus.in/bus-tickets/${from.replace(/\s+/g,"-")}-to-${to.replace(/\s+/g,"-")}\n\n_Opens full schedule with live availability_`;
            } else {
              session.busList = buses; session.from = from; session.to = to; session.step = "bus_selecting";
              reply = `🚌 *Buses: ${from.toUpperCase()} → ${to.toUpperCase()}*\n\n`;
              buses.slice(0,4).forEach((b,i) => {
                reply += `*${i+1}. ${b.op}*\n⏰ ${b.dep} → ${b.arr} · ${b.type}\n💰 ₹${b.price.toLocaleString()}\n\n`;
              });
              reply += `Reply *1* to *${Math.min(4,buses.length)}* to see booking link\nOr type *redbus* for more options`;
            }
          }
        }
      }
      else {
        // Flight search (default)
        const { from, to } = extractCities(msg);
        if (!from || !to) {
          reply = `✈️ *Alvryn AI*\n\nHi! I can help you search flights, buses and hotels.\n\n*Search flights:*\n_"flights bangalore to mumbai tomorrow"_\n_"blr to del kal cheap"_\n\n*Search buses:*\n_"bus bangalore to chennai tomorrow"_\n\n*Search hotels:*\n_"hotel in goa"_\n_"hotels bangalore"_`;
        } else {
          const { date: targetDate, pastDate } = extractDate(msg);
          if (pastDate) {
            reply = `⏰ That date is in the past! Please search for today or a future date.`;
          } else if (!targetDate) {
            session.step = "asking_date"; session.from = from; session.to = to;
            reply = `✈️ *${from.toUpperCase()} → ${to.toUpperCase()}*\n\nWhat date do you want to fly?\nReply like: _"tomorrow"_, _"25 march"_, _"friday"_`;
          } else {
            await searchFlightsAndReply(session, from, to, targetDate, msg);
            reply = session.lastReply;
          }
        }
      }
    }
    else if (session.step === "asking_date") {
      const { date: targetDate, pastDate } = extractDate(msg);
      if (pastDate) reply = `⏰ That's a past date! Try: _"tomorrow"_, _"next friday"_`;
      else if (!targetDate) reply = `Didn't catch the date. Try: _"tomorrow"_, _"25 march"_, _"next friday"_`;
      else { await searchFlightsAndReply(session, session.from, session.to, targetDate, msg); reply = session.lastReply; }
    }
    else if (session.step === "bus_search") {
      const { from, to } = extractCities(msg);
      if (!from || !to) reply = `Couldn't detect cities. Try: _"bus bangalore to chennai"_`;
      else {
        const buses = WA_BUS_ROUTES.filter(b => b.from === from && b.to === to);
        await logEvent("bus_search", `WhatsApp: ${from} → ${to}`, "whatsapp");
        if (buses.length === 0) {
          reply = `🚌 No buses found from *${from}* to *${to}*.\n\nCheck RedBus for more:\nhttps://www.redbus.in/bus-tickets/${from.replace(/\s+/g,"-")}-to-${to.replace(/\s+/g,"-")}`;
          userSessions[phone] = { step:"idle", type:"none" };
        } else {
          session.busList = buses; session.from = from; session.to = to; session.step = "bus_selecting";
          reply = `🚌 *Buses: ${from.toUpperCase()} → ${to.toUpperCase()}*\n\n`;
          buses.slice(0,4).forEach((b,i) => {
            reply += `*${i+1}. ${b.op}*\n⏰ ${b.dep} → ${b.arr} · ${b.type}\n💰 ₹${b.price.toLocaleString()}\n\n`;
          });
          reply += `Reply *1* to *${Math.min(4,buses.length)}* to see booking link`;
        }
      }
    }
    else if (session.step === "bus_selecting") {
      if (msg === "redbus" || msg.includes("more")) {
        reply = `🚌 View all options on RedBus:\nhttps://www.redbus.in/bus-tickets/${session.from.replace(/\s+/g,"-")}-to-${session.to.replace(/\s+/g,"-")}`;
        userSessions[phone] = { step:"idle", type:"none" };
      } else {
        const num = parseInt(msg.match(/^(\d+)/)?.[1]);
        if (!num || num < 1 || num > (session.busList||[]).length) {
          reply = `Please reply with *1* to *${Math.min(4,(session.busList||[]).length)}*, or *redbus* for more options.`;
        } else {
          const bus = session.busList[num-1];
          reply = `✅ *${bus.op}*\n🚌 ${session.from.toUpperCase()} → ${session.to.toUpperCase()}\n⏰ ${bus.dep} → ${bus.arr}\n💰 ₹${bus.price.toLocaleString()} · ${bus.type}\n\n👉 Book on RedBus:\nhttps://www.redbus.in/bus-tickets/${session.from.replace(/\s+/g,"-")}-to-${session.to.replace(/\s+/g,"-")}\n\n_Opens RedBus for live availability and seat selection_`;
          userSessions[phone] = { step:"idle", type:"none" };
        }
      }
    }
    else if (session.step === "flight_selecting") {
      const num = parseInt(msg.match(/^(\d+)/)?.[1]);
      if (!num) reply = `Please reply with a number like *1*, *2*, or *3*.\nOr type *cancel* to start over.`;
      else if (num < 1 || num > (session.flights||[]).length) reply = `Pick a number between *1* and *${(session.flights||[]).length}*.`;
      else {
        const f = session.flights[num-1];
        const fromCode = CITY_TO_IATA[session.from] || session.from.slice(0,3).toUpperCase();
        const toCode   = CITY_TO_IATA[session.to]   || session.to.slice(0,3).toUpperCase();
        const dateStr  = session.dateStr || "";
        const link = `https://www.aviasales.com/search/${fromCode}${dateStr}${toCode}1?marker=714667&trs=512951&sub_id=alvryn_whatsapp`;
        reply = `✈️ *${f.airline} selected*\n⏰ ${new Date(f.departure_time).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false})}\n💰 ₹${f.price.toLocaleString()}\n\n👉 Book now:\n${link}\n\n_Opens our partner site — best price guaranteed_`;
        await logEvent("view_deal", `WhatsApp flight: ${session.from} → ${session.to}`, "whatsapp");
        userSessions[phone] = { step:"idle", type:"none" };
      }
    }
    else {
      reply = `Type *restart* to start a new search.`;
      userSessions[phone] = { step:"idle", type:"none" };
    }

  } catch(e) {
    console.error("WhatsApp error:", e);
    reply = `Sorry, something went wrong. Please type *restart* to try again.`;
    userSessions[phone] = { step:"idle", type:"none" };
  }

  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(reply);
  res.type("text/xml").send(twiml.toString());
});

async function searchFlightsAndReply(session, from, to, targetDate, rawMsg) {
  const budget    = extractBudget(rawMsg);
  const isCheap   = /cheap|sasta|budget|lowest|kam/i.test(rawMsg);
  const fmt2      = d => d.toISOString().split("T")[0];
  const dateStr   = targetDate ? (targetDate.getDate().toString().padStart(2,"0") + (targetDate.getMonth()+1).toString().padStart(2,"0")) : "";

  let q = `SELECT * FROM flights WHERE LOWER(from_city)=$1 AND LOWER(to_city)=$2`, v = [from, to];
  if (targetDate) { q += ` AND DATE(departure_time)=$3`; v.push(fmt2(targetDate)); }
  if (budget)     { q += ` AND price<=$${v.length+1}`; v.push(budget); }
  q += (isCheap ? " ORDER BY price ASC" : " ORDER BY departure_time ASC") + " LIMIT 5";

  let rows = (await pool.query(q, v)).rows;
  if (!rows.length && targetDate) {
    rows = (await pool.query(`SELECT * FROM flights WHERE LOWER(from_city)=$1 AND LOWER(to_city)=$2 AND departure_time>NOW() ORDER BY price ASC LIMIT 5`, [from, to])).rows;
  }

  await logEvent("flight_search", `WhatsApp: ${from} → ${to}`, "whatsapp");

  if (!rows.length) {
    // No DB flights — give affiliate link directly
    const fromCode = CITY_TO_IATA[from] || from.slice(0,3).toUpperCase();
    const toCode   = CITY_TO_IATA[to]   || to.slice(0,3).toUpperCase();
    const link = `https://www.aviasales.com/search/${fromCode}${dateStr}${toCode}1?marker=714667&trs=512951&sub_id=alvryn_whatsapp`;
    session.lastReply = `✈️ *${from.toUpperCase()} → ${to.toUpperCase()}*\n\nNo flights in our database yet for this route.\n\n👉 Check live fares here:\n${link}\n\n_Opens our partner site with best prices_`;
    userSessions[session.phone] = { step:"idle", type:"none" };
    return;
  }

  session.flights = rows;
  session.from    = from;
  session.to      = to;
  session.dateStr = dateStr;
  session.step    = "flight_selecting";

  let msg2 = `✈️ *Flights: ${from.toUpperCase()} → ${to.toUpperCase()}*\n`;
  if (targetDate) msg2 += `📅 ${targetDate.toLocaleDateString("en-IN",{day:"numeric",month:"short"})}\n`;
  msg2 += "\n";
  rows.forEach((f,i) => {
    const dep = new Date(f.departure_time).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false});
    const arr = new Date(f.arrival_time).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false});
    msg2 += `*${i+1}. ${f.airline}*\n⏰ ${dep} → ${arr}\n💰 ₹${f.price.toLocaleString()}\n\n`;
  });
  msg2 += `Reply *1* to *${rows.length}* to get the booking link.\nOr type *cancel* to start over.`;
  session.lastReply = msg2;
}

// ══════════════════════════════════════════════════════════════
//  ADMIN ROUTES
// ══════════════════════════════════════════════════════════════
app.get("/admin/bookings", async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT bookings.id, bookings.passenger_name, bookings.booked_at, bookings.seats,
              bookings.promo_code, bookings.discount_applied, bookings.final_price, bookings.cabin_class,
              flights.from_city, flights.to_city, flights.departure_time, flights.price,
              flights.airline, flights.flight_no,
              users.email as user_email, users.name as user_name
       FROM bookings JOIN flights ON bookings.flight_id=flights.id JOIN users ON bookings.user_id=users.id
       ORDER BY bookings.id DESC`
    );
    res.json(r.rows);
  } catch { res.status(500).send("Server Error"); }
});

app.get("/admin/users", async (req, res) => {
  try {
    const r = await pool.query("SELECT id,name,email,phone,ref_code,wallet_balance,referred_by,created_at FROM users ORDER BY id DESC");
    res.json(r.rows);
  } catch { res.status(500).send("Server Error"); }
});

app.get("/admin/promo-codes", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM promo_codes ORDER BY id DESC");
    res.json(r.rows);
  } catch { res.json([]); }
});

// ══════════════════════════════════════════════════════════════
//  WAITLIST
// ══════════════════════════════════════════════════════════════
function generateRefCode(email) {
  const base = email.split("@")[0].replace(/[^a-zA-Z0-9]/g,"").slice(0,8);
  return `${base}${Math.random().toString(36).slice(2,6).toUpperCase()}`;
}
async function ensureWaitlistTable() {
  await pool.query(`CREATE TABLE IF NOT EXISTS waitlist (id SERIAL PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL, ref_code VARCHAR(20) UNIQUE NOT NULL, referred_by VARCHAR(20), joined_at TIMESTAMP DEFAULT NOW())`);
}
app.post("/waitlist", async (req, res) => {
  try {
    await ensureWaitlistTable();
    const { email, ref } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });
    const refCode = generateRefCode(email);
    let referredBy = null;
    if (ref) { const rc = await pool.query("SELECT email FROM waitlist WHERE ref_code=$1",[ref]); if(rc.rows.length) referredBy = ref; }
    await pool.query("INSERT INTO waitlist (email,ref_code,referred_by) VALUES ($1,$2,$3)",[email,refCode,referredBy]);
    res.json({ message: "Added!", refCode });
  } catch(e) {
    if (e.code==="23505") { const ex = await pool.query("SELECT ref_code FROM waitlist WHERE email=$1",[req.body.email]); return res.status(409).json({ message:"Already on waitlist", refCode: ex.rows[0]?.ref_code }); }
    res.status(500).json({ message:"Server error" });
  }
});
app.get("/waitlist/count", async (req, res) => { try { await ensureWaitlistTable(); const r=await pool.query("SELECT COUNT(*) FROM waitlist"); res.json({count:parseInt(r.rows[0].count)}); } catch { res.json({count:0}); } });
app.get("/admin/waitlist", async (req, res) => { try { await ensureWaitlistTable(); const r=await pool.query(`SELECT w.*,COUNT(r2.id) as ref_count FROM waitlist w LEFT JOIN waitlist r2 ON r2.referred_by=w.ref_code GROUP BY w.id ORDER BY ref_count DESC`); res.json(r.rows); } catch { res.json([]); } });

// ══════════════════════════════════════════════════════════════
//  START
// ══════════════════════════════════════════════════════════════
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Alvryn server running on port ${PORT}`));