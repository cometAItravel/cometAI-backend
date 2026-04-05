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
//  ANALYTICS
// ══════════════════════════════════════════════════════════════
async function logEvent(eventType, details, source, userId) {
  try {
    await pool.query(
      "INSERT INTO events (event_type, details, source, user_id) VALUES ($1,$2,$3,$4)",
      [eventType, String(details||"").slice(0,500), source||"web", userId||null]
    );
  } catch (e) {}
}

async function ensureEventsTable() {
  await pool.query(`CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(60) NOT NULL,
    details TEXT,
    source VARCHAR(30) DEFAULT 'web',
    user_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
  )`);
}
ensureEventsTable().catch(console.error);

// ══════════════════════════════════════════════════════════════
//  CITY MAPS
// ══════════════════════════════════════════════════════════════
const CITY_MAP = {
  "bangalore":"bangalore","bengaluru":"bangalore","bengalore":"bangalore","bangaluru":"bangalore",
  "blr":"bangalore","bang":"bangalore","banglore":"bangalore","bangalor":"bangalore","blore":"bangalore",
  "mumbai":"mumbai","bombay":"mumbai","bom":"mumbai","mum":"mumbai","mumbi":"mumbai","mumbay":"mumbai",
  "delhi":"delhi","new delhi":"delhi","del":"delhi","dilli":"delhi","nai dilli":"delhi","dilhi":"delhi",
  "chennai":"chennai","madras":"chennai","maa":"chennai","chenai":"chennai","chinnai":"chennai","chenni":"chennai",
  "hyderabad":"hyderabad","hyd":"hyderabad","hydrabad":"hyderabad","secunderabad":"hyderabad","hyderbad":"hyderabad",
  "kolkata":"kolkata","calcutta":"kolkata","ccu":"kolkata","kolkatta":"kolkata",
  "goa":"goa","goi":"goa","north goa":"goa","south goa":"goa","panaji":"goa",
  "pune":"pune","pnq":"pune","poona":"pune","puna":"pune",
  "kochi":"kochi","cochin":"kochi","cok":"kochi","ernakulam":"kochi",
  "ahmedabad":"ahmedabad","amd":"ahmedabad","ahemdabad":"ahmedabad","ahmadabad":"ahmedabad",
  "jaipur":"jaipur","jai":"jaipur","pink city":"jaipur","jaipor":"jaipur",
  "lucknow":"lucknow","lko":"lucknow","lakhnau":"lucknow","luckhnow":"lucknow",
  "varanasi":"varanasi","vns":"varanasi","banaras":"varanasi","kashi":"varanasi","benares":"varanasi",
  "patna":"patna","chandigarh":"chandigarh","ixc":"chandigarh","chd":"chandigarh",
  "guwahati":"guwahati","gauhati":"guwahati","gau":"guwahati",
  "bhubaneswar":"bhubaneswar","bbi":"bhubaneswar","bbsr":"bhubaneswar",
  "coimbatore":"coimbatore","cbe":"coimbatore","kovai":"coimbatore","koimbatore":"coimbatore",
  "madurai":"madurai","mdu":"madurai","maduri":"madurai",
  "mangalore":"mangalore","mangaluru":"mangalore","ixe":"mangalore","mangalor":"mangalore",
  "mysore":"mysore","mysuru":"mysore","mys":"mysore",
  "surat":"surat","haridwar":"haridwar","jodhpur":"jodhpur","udaipur":"udaipur",
  "amritsar":"amritsar","atq":"amritsar","agra":"agra",
  "indore":"indore","raipur":"raipur","nashik":"nashik","nagpur":"nagpur",
  "shimla":"shimla","dehradun":"dehradun","siliguri":"siliguri",
  "trivandrum":"trivandrum","thiruvananthapuram":"trivandrum","trv":"trivandrum",
  "visakhapatnam":"visakhapatnam","vizag":"visakhapatnam","vtz":"visakhapatnam",
  "vijayawada":"vijayawada","vga":"vijayawada",
  "ranchi":"ranchi","bhopal":"bhopal","srinagar":"srinagar","jammu":"jammu",
  "hubli":"hubli","hubballi":"hubli","belgaum":"belgaum","belagavi":"belgaum",
  "tirupati":"tirupati","leh":"leh","port blair":"port blair",
  "dubai":"dubai","dxb":"dubai","dubi":"dubai","dubay":"dubai",
  "singapore":"singapore","sin":"singapore","singapur":"singapore","singapoor":"singapore",
  "bangkok":"bangkok","bkk":"bangkok","bangkock":"bangkok",
  "london":"london","lhr":"london","landan":"london",
  "new york":"new york","jfk":"new york","nyc":"new york","newyork":"new york",
  "kuala lumpur":"kuala lumpur","kul":"kuala lumpur","kl":"kuala lumpur",
  "colombo":"colombo","cmb":"colombo",
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
  "phuket":"phuket","hkt":"phuket","auckland":"auckland","akl":"auckland",
  "melbourne":"melbourne","mel":"melbourne","brisbane":"brisbane","bne":"brisbane",
  "cairo":"cairo","cai":"cairo",
};

const CITY_TO_IATA = {
  "bangalore":"BLR","mumbai":"BOM","delhi":"DEL","chennai":"MAA","hyderabad":"HYD",
  "kolkata":"CCU","goa":"GOI","pune":"PNQ","kochi":"COK","ahmedabad":"AMD","jaipur":"JAI",
  "lucknow":"LKO","varanasi":"VNS","patna":"PAT","chandigarh":"IXC","guwahati":"GAU",
  "bhubaneswar":"BBI","coimbatore":"CBE","madurai":"IXM","mangalore":"IXE","mysore":"MYQ",
  "surat":"STV","jodhpur":"JDH","udaipur":"UDR","amritsar":"ATQ","agra":"AGR",
  "indore":"IDR","raipur":"RPR","shimla":"SLV","dehradun":"DED",
  "trivandrum":"TRV","visakhapatnam":"VTZ","vijayawada":"VGA","ranchi":"IXR",
  "bhopal":"BHO","srinagar":"SXR","jammu":"IXJ","tirupati":"TIR","leh":"IXL",
  "port blair":"IXZ","nagpur":"NAG","hubli":"HBX","belgaum":"IXG",
  "dubai":"DXB","singapore":"SIN","bangkok":"BKK","london":"LHR","new york":"JFK",
  "kuala lumpur":"KUL","colombo":"CMB","paris":"CDG","tokyo":"NRT","sydney":"SYD",
  "frankfurt":"FRA","amsterdam":"AMS","toronto":"YYZ","los angeles":"LAX",
  "hong kong":"HKG","doha":"DOH","abu dhabi":"AUH","istanbul":"IST",
  "zurich":"ZRH","rome":"FCO","barcelona":"BCN","milan":"MXP",
  "johannesburg":"JNB","nairobi":"NBO","seoul":"ICN","manila":"MNL",
  "jakarta":"CGK","bali":"DPS","kathmandu":"KTM","dhaka":"DAC",
  "maldives":"MLE","male":"MLE","phuket":"HKT","auckland":"AKL",
  "melbourne":"MEL","brisbane":"BNE","cairo":"CAI",
};

// ── Affiliate link builder (NO trs — fixes marker mismatch error) ──────────
function buildFlightLink(from, to, dateStr, subId) {
  const fromCode = CITY_TO_IATA[from] || from.slice(0,3).toUpperCase();
  const toCode   = CITY_TO_IATA[to]   || to.slice(0,3).toUpperCase();
  const sid = subId || "alvryn_web";
  return "https://www.aviasales.com/search/" + fromCode + (dateStr||"") + toCode + "1?marker=714667&sub_id=" + sid;
}

function buildBusLink(from, to) {
  return "https://www.redbus.in/bus-tickets/" + (from||"").replace(/\s+/g,"-") + "-to-" + (to||"").replace(/\s+/g,"-");
}

function buildHotelLink(city) {
  return "https://www.booking.com/searchresults.html?ss=" + encodeURIComponent(city||"") + "&aid=YOUR_BOOKING_AID";
}

// ── City extractor ─────────────────────────────────────────────────────────
function extractCities(text) {
  const t = text.toLowerCase()
    .replace(/\b(flights?|buses?|bus|flight|book|hotels?|hotel|stay|rooms?|mujhe|muje|chahiye|please|kya|hai|se|ko|ka|ek|ticket|find|search|show|bata|dikha|looking|want|need|enakku|vendum|naaku|kavali|from|to)\b/gi, " ")
    .replace(/\s+/g, " ").trim();

  let found = [];
  const multiWord = Object.keys(CITY_MAP).filter(k => k.includes(" ")).sort((a,b) => b.length-a.length);
  let remaining = t;
  for (const key of multiWord) {
    if (remaining.includes(key) && found.length < 2) {
      found.push(CITY_MAP[key]);
      remaining = remaining.replace(key, " ");
    }
  }
  const words = remaining.split(/[\s,\-\/]+/);
  for (const word of words) {
    const clean = word.replace(/[^a-z]/g,"");
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
          found.push(CITY_MAP[key]);
          if (found.length === 2) break;
        }
      }
      if (found.length === 2) break;
    }
  }
  return { from: found[0]||null, to: found[1]||null };
}

// ── Detect if query is about buses (not flights) ───────────────────────────
function isBusQuery(text) {
  return /\b(bus|buses|coach|volvo|sleeper|seater|ksrtc|msrtc|tsrtc|rsrtc|redbus|ac bus|overnight bus|road trip|by road)\b/i.test(text);
}

function extractDate(text) {
  const t = text.toLowerCase();
  const now = new Date();
  if (/yesterday/.test(t)) return { date: null, pastDate: true };
  const months = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11,
    january:0,february:1,march:2,april:3,june:5,july:6,august:7,september:8,october:9,november:10,december:11};
  for (const [mon, idx] of Object.entries(months)) {
    const m = t.match(new RegExp("(\\d{1,2})\\s*"+mon+"|"+mon+"\\s*(\\d{1,2})"));
    if (m) {
      const day = parseInt(m[1]||m[2]);
      const d = new Date(now.getFullYear(), idx, day);
      if (d < now) d.setFullYear(d.getFullYear()+1);
      return { date: d, pastDate: false };
    }
  }
  if (/today|aaj|indru|ee roju/.test(t))      return { date: new Date(now), pastDate: false };
  if (/day after tomorrow|parso/.test(t))      { const d=new Date(now); d.setDate(d.getDate()+2); return {date:d,pastDate:false}; }
  if (/tomorrow|kal|tmrw|tommorow|nale|repu/.test(t)) { const d=new Date(now); d.setDate(d.getDate()+1); return {date:d,pastDate:false}; }
  if (/this weekend|weekend/.test(t))          { const d=new Date(now); const diff=(6-now.getDay()+7)%7||7; d.setDate(now.getDate()+diff); return {date:d,pastDate:false}; }
  const dayMap = {sun:0,sunday:0,mon:1,monday:1,tue:2,tuesday:2,wed:3,wednesday:3,
    thu:4,thursday:4,fri:5,friday:5,sat:6,saturday:6,
    ravivar:0,somvar:1,mangalvar:2,budhvar:3,guruvar:4,shukravar:5,shanivar:6};
  for (const [day, idx] of Object.entries(dayMap)) {
    if (t.includes(day)) {
      const d = new Date(now); let diff = idx-now.getDay();
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
  const patterns = [/under\s*[₹rs.]*\s*(\d+)k?/,/below\s*[₹rs.]*\s*(\d+)k?/,
    /less\s*than\s*[₹rs.]*\s*(\d+)k?/,/max\s*[₹rs.]*\s*(\d+)k?/,/[₹rs.]*\s*(\d+)k?\s*(se\s*)?kam/];
  for (const p of patterns) {
    const m = t.match(p);
    if (m) { let v=parseInt(m[1]); if(t.match(/\d+k/))v*=1000; return v; }
  }
  return null;
}

const fmt = d => d.toISOString().split("T")[0];
const fmtDateStr = d => fmt(d).replace(/-/g,"").slice(2); // YYMMDD for aviasales

// ── Smart flight labels for WhatsApp results ───────────────────────────────
function flightLabel(f, allFlights, idx) {
  const prices = allFlights.map(x => x.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const depHour  = new Date(f.departure_time).getHours();
  if (f.price === minPrice) return "Best Price";
  if (f.price === maxPrice) return null;
  if (depHour >= 5 && depHour < 9) return "Early Morning";
  if (depHour >= 9 && depHour < 12) return "Morning";
  if (depHour >= 18) return "Evening";
  return null;
}

// ── AI insight lines for flights ───────────────────────────────────────────
function flightInsight(f, allFlights) {
  const prices = allFlights.map(x => x.price);
  const minPrice = Math.min(...prices);
  const avgPrice = Math.round(prices.reduce((a,b)=>a+b,0)/prices.length);
  const savingVsAvg = avgPrice - f.price;
  if (f.price === minPrice) return "Cheapest on this route today";
  if (savingVsAvg > 300) return "You save Rs." + savingVsAvg.toLocaleString() + " vs average";
  const depHour = new Date(f.departure_time).getHours();
  if (depHour >= 5 && depHour < 9) return "Morning flights are usually 15-20% cheaper";
  if (depHour >= 22 || depHour < 5) return "Late night — ideal if you want to save on accommodation";
  return "Competitive price for this route";
}

// ══════════════════════════════════════════════════════════════
//  AUTH
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
//  ANALYTICS ROUTE
// ══════════════════════════════════════════════════════════════
app.post("/track", async (req, res) => {
  const { event_type, details, source } = req.body;
  const token = req.headers["authorization"]?.split(" ")[1];
  let userId = null;
  if (token) { try { userId = jwt.verify(token, process.env.JWT_SECRET||"secretkey").id; } catch {} }
  await logEvent(event_type, details, source||"web", userId);
  res.json({ ok: true });
});

app.get("/admin/events", async (req, res) => {
  try { const r = await pool.query("SELECT * FROM events ORDER BY created_at DESC LIMIT 200"); res.json(r.rows); }
  catch { res.json([]); }
});

// ══════════════════════════════════════════════════════════════
//  TEST
// ══════════════════════════════════════════════════════════════
app.get("/test", (req, res) => res.send("Alvryn backend alive"));

// ══════════════════════════════════════════════════════════════
//  USERS
// ══════════════════════════════════════════════════════════════
app.get("/users", async (req, res) => {
  try { const r = await pool.query("SELECT id,name,email FROM users"); res.json(r.rows); }
  catch { res.status(500).send("Server Error"); }
});

function generateUserRefCode(name) {
  return (name||"user").replace(/[^a-zA-Z0-9]/g,"").slice(0,6).toUpperCase() + Math.random().toString(36).slice(2,6).toUpperCase();
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
      const rc = await pool.query("SELECT id FROM users WHERE ref_code=$1", [ref]);
      if (rc.rows.length) referredBy = ref;
    }
    await pool.query(
      "INSERT INTO users (name,email,password,ref_code,referred_by,wallet_balance) VALUES ($1,$2,$3,$4,$5,$6)",
      [name, email, hashed, refCode, referredBy, 0]
    );
    await logEvent("register", "New user: "+email, "web");
    try {
      await resend.emails.send({
        from: "Alvryn Travel <onboarding@resend.dev>",
        to: email,
        subject: "Welcome to Alvryn — Travel Beyond Boundaries",
        html: `<div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;background:#faf8f4;border-radius:16px;overflow:hidden;border:1px solid rgba(201,168,76,0.2);">
          <div style="background:linear-gradient(135deg,#c9a84c,#f0d080,#c9a84c);padding:28px 24px;text-align:center;">
            <h1 style="margin:0;font-size:24px;color:#1a1410;font-weight:900;letter-spacing:0.1em;">ALVRYN</h1>
            <p style="margin:4px 0 0;color:rgba(26,20,16,0.7);font-size:11px;letter-spacing:0.3em;">TRAVEL BEYOND BOUNDARIES</p>
          </div>
          <div style="padding:32px 24px;">
            <h2 style="color:#1a1410;margin-bottom:12px;">Welcome, ${name}!</h2>
            <p style="color:#555;line-height:1.7;margin-bottom:20px;">Your Alvryn account is ready. Search flights and buses instantly with AI — in any language.</p>
            <div style="background:rgba(201,168,76,0.1);border-radius:12px;padding:16px;margin-bottom:20px;border:1px solid rgba(201,168,76,0.25);">
              <p style="margin:0;color:#8B6914;font-size:11px;letter-spacing:0.12em;margin-bottom:6px;">YOUR REFERRAL CODE</p>
              <p style="margin:0;font-size:22px;font-weight:900;color:#8B6914;letter-spacing:4px;">${refCode}</p>
              <p style="margin:6px 0 0;color:#888;font-size:12px;">Share with friends — earn Rs.150 when they book above Rs.5,000</p>
            </div>
            <a href="https://alvryn.in/search" style="display:inline-block;background:linear-gradient(135deg,#c9a84c,#f0d080);color:#1a1410;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;">Search Flights</a>
          </div>
          <div style="padding:18px 24px;background:rgba(201,168,76,0.05);text-align:center;">
            <p style="margin:0;color:#aaa;font-size:12px;">Alvryn · alvryn.in · Built in Bangalore</p>
          </div>
        </div>`
      });
    } catch(e) { console.error("Welcome email:", e.message); }
    res.json({ message: "Registered successfully", refCode });
  } catch(e) {
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
    if (!await bcrypt.compare(password, user.password)) return res.status(401).json({ message: "Invalid password" });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET||"secretkey");
    await logEvent("login", "User "+email, "web", user.id);
    res.json({ token, user: { id:user.id, name:user.name, email:user.email, phone:user.phone, refCode:user.ref_code, walletBalance:user.wallet_balance||0 } });
  } catch { res.status(500).json({ message: "Login failed" }); }
});

// ══════════════════════════════════════════════════════════════
//  PROFILE
// ══════════════════════════════════════════════════════════════
app.get("/profile", authenticateToken, async (req, res) => {
  try {
    const r = await pool.query("SELECT id,name,email,phone,ref_code,wallet_balance,referred_by FROM users WHERE id=$1", [req.user.id]);
    res.json(r.rows[0]||{});
  } catch { res.status(500).json({ message: "Server error" }); }
});

app.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    await pool.query("UPDATE users SET name=$1,email=$2,phone=$3 WHERE id=$4", [name, email, phone||null, req.user.id]);
    res.json({ message: "Profile updated" });
  } catch(e) {
    if (e.code==="23505") return res.status(409).json({ message: "Email already in use" });
    res.status(500).json({ message: "Update failed" });
  }
});

app.put("/profile/password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const r = await pool.query("SELECT password FROM users WHERE id=$1", [req.user.id]);
    if (!await bcrypt.compare(currentPassword, r.rows[0].password)) return res.status(401).json({ message: "Current password is incorrect" });
    await pool.query("UPDATE users SET password=$1 WHERE id=$2", [await bcrypt.hash(newPassword,10), req.user.id]);
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
    if (from) { q += " AND LOWER(from_city)=LOWER($"+c++  +")"; v.push(from); }
    if (to)   { q += " AND LOWER(to_city)=LOWER($"+c++    +")"; v.push(to);   }
    if (date) { q += " AND DATE(departure_time)=$"+c++;          v.push(date); }
    q += " ORDER BY price ASC";
    const r = await pool.query(q, v);
    await logEvent("flight_search", (from||"?")+" to "+(to||"?")+" on "+(date||"any"), "web");
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
    const isCheap = /cheap|budget|lowest|sasta|affordable/i.test(rawQuery);
    let q = "SELECT * FROM flights WHERE LOWER(from_city)=$1 AND LOWER(to_city)=$2";
    let v = [from, to];
    if (targetDate) { q += " AND DATE(departure_time)=$3"; v.push(fmt(targetDate)); }
    if (budget)     { q += " AND price <= $"+(v.length+1); v.push(budget); }
    q += isCheap ? " ORDER BY price ASC" : " ORDER BY departure_time ASC";
    let flights = (await pool.query(q, v)).rows;
    if (!flights.length && targetDate) {
      flights = (await pool.query(
        "SELECT * FROM flights WHERE LOWER(from_city)=$1 AND LOWER(to_city)=$2 AND departure_time > NOW() ORDER BY departure_time ASC LIMIT 5",
        [from, to]
      )).rows;
    }
    await logEvent("flight_search", "AI: "+from+" to "+to, "ai");
    res.json(flights);
  } catch { res.status(500).send("Server Error"); }
});

// ══════════════════════════════════════════════════════════════
//  PROMO CODE
// ══════════════════════════════════════════════════════════════
app.post("/promo/validate", authenticateToken, async (req, res) => {
  try {
    const { code, bookingAmount } = req.body;
    const r = await pool.query("SELECT * FROM promo_codes WHERE UPPER(code)=UPPER($1) AND is_active=TRUE", [code]);
    if (!r.rows.length) return res.status(404).json({ message: "Invalid or expired promo code" });
    const p = r.rows[0];
    if (p.valid_until && new Date(p.valid_until) < new Date()) return res.status(400).json({ message: "Promo code has expired" });
    if (p.used_count >= p.max_uses) return res.status(400).json({ message: "Promo code limit reached" });
    if (bookingAmount < p.min_booking_amount) return res.status(400).json({ message: "Minimum booking Rs."+p.min_booking_amount+" required" });
    const discount = p.discount_type==="percent" ? Math.floor(bookingAmount*p.discount_value/100) : p.discount_value;
    res.json({ valid:true, discount, finalAmount:bookingAmount-discount });
  } catch { res.status(500).json({ message: "Server error" }); }
});

app.post("/validate-promo", authenticateToken, async (req, res) => {
  try {
    const { code, amount, bookingAmount } = req.body;
    const amt = amount || bookingAmount;
    const r = await pool.query("SELECT * FROM promo_codes WHERE UPPER(code)=UPPER($1) AND is_active=TRUE", [code]);
    if (!r.rows.length) return res.status(404).json({ message: "Invalid or expired promo code" });
    const p = r.rows[0];
    if (p.valid_until && new Date(p.valid_until) < new Date()) return res.status(400).json({ message: "Promo code has expired" });
    if (p.used_count >= p.max_uses) return res.status(400).json({ message: "Promo code limit reached" });
    if (amt < p.min_booking_amount) return res.status(400).json({ message: "Minimum booking Rs."+p.min_booking_amount+" required" });
    const discount = p.discount_type==="percent" ? Math.floor(amt*p.discount_value/100) : p.discount_value;
    res.json({ valid:true, discount, finalAmount:amt-discount });
  } catch { res.status(500).json({ message: "Server error" }); }
});

// ══════════════════════════════════════════════════════════════
//  WALLET
// ══════════════════════════════════════════════════════════════
app.get("/wallet", authenticateToken, async (req, res) => {
  try {
    const r = await pool.query("SELECT wallet_balance FROM users WHERE id=$1", [req.user.id]);
    res.json({ balance: r.rows[0]?.wallet_balance||0 });
  } catch { res.json({ balance:0 }); }
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
    const flightRes = await client.query("SELECT * FROM flights WHERE id=$1 FOR UPDATE", [flight_id]);
    if (!flightRes.rows.length) { await client.query("ROLLBACK"); return res.status(404).json({ message: "Flight not found" }); }
    if (flightRes.rows[0].seats_available <= 0) { await client.query("ROLLBACK"); return res.status(400).json({ message: "No seats available" }); }
    const f = flightRes.rows[0];
    let walletUsed = 0;
    if (use_wallet) {
      const wr = await client.query("SELECT wallet_balance FROM users WHERE id=$1", [user_id]);
      walletUsed = Math.min(wr.rows[0].wallet_balance||0, final_price||f.price);
      if (walletUsed > 0) await client.query("UPDATE users SET wallet_balance=wallet_balance-$1 WHERE id=$2", [walletUsed, user_id]);
    }
    if (promo_code) await client.query("UPDATE promo_codes SET used_count=used_count+1 WHERE UPPER(code)=UPPER($1)", [promo_code]);
    const bookingId = "ALV"+Date.now().toString(36).toUpperCase().slice(-6);
    const actualFinal = (final_price||f.price) - walletUsed;
    const seatsStr = seats && seats.length ? seats.join(",") : null;
    await client.query(
      "INSERT INTO bookings (flight_id,passenger_name,user_id,seats,promo_code,discount_applied,final_price,cabin_class,flight_no,airline) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
      [flight_id, passenger_name, user_id, seatsStr, promo_code||null, (discount_applied||0)+walletUsed, actualFinal, cabin_class||"Economy", f.flight_no, f.airline]
    );
    await client.query("UPDATE flights SET seats_available=seats_available-1 WHERE id=$1", [f.id]);
    if (actualFinal >= 5000) {
      const userR = await client.query("SELECT referred_by FROM users WHERE id=$1", [user_id]);
      const refCode = userR.rows[0]?.referred_by;
      if (refCode) {
        const referrer = await client.query("SELECT id FROM users WHERE ref_code=$1", [refCode]);
        if (referrer.rows.length) {
          await client.query("UPDATE users SET wallet_balance=wallet_balance+150 WHERE id=$1", [referrer.rows[0].id]);
          await client.query("UPDATE users SET wallet_balance=wallet_balance+100 WHERE id=$1", [user_id]);
        }
      }
    }
    await client.query("COMMIT");
    await logEvent("booking", f.from_city+" to "+f.to_city+" Rs."+actualFinal, "web", user_id);
    const userResult = await pool.query("SELECT email FROM users WHERE id=$1", [user_id]);
    const userEmail = userResult.rows[0]?.email;
    if (userEmail) {
      try {
        await sendBookingEmail(userEmail, {
          passengerName:passenger_name, airline:f.airline, flightNo:f.flight_no,
          fromCity:f.from_city, toCity:f.to_city, departureTime:f.departure_time,
          arrivalTime:f.arrival_time, price:actualFinal, bookingId,
          cabinClass:cabin_class||"Economy", seats:seats||[], discountApplied:(discount_applied||0)+walletUsed,
        });
      } catch(e) { console.error("Email:", e.message); }
    }
    res.json({ message:"Booking confirmed!", bookingId, walletUsed });
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
      params: { access_key:process.env.AVIATIONSTACK_KEY, dep_iata:fromCode, arr_iata:toCode, limit:10, flight_status:"scheduled" }
    });
    const flights = resp.data.data;
    if (!flights || !flights.length) {
      const db = await pool.query("SELECT * FROM flights WHERE LOWER(from_city)=LOWER($1) AND LOWER(to_city)=LOWER($2) ORDER BY price ASC", [from,to]);
      return res.json(db.rows);
    }
    const saved = [];
    for (const f of flights) {
      const airline=f.airline?.name||"Unknown", flightNo=f.flight?.iata||"—";
      const dep=f.departure?.scheduled||null, arr=f.arrival?.scheduled||null;
      const price=Math.floor(Math.random()*8000)+2000;
      const ex = await pool.query("SELECT * FROM flights WHERE flight_no=$1 AND departure_time=$2", [flightNo,dep]);
      if (ex.rows.length) { saved.push(ex.rows[0]); }
      else {
        const ins = await pool.query(
          "INSERT INTO flights (airline,flight_no,from_city,to_city,departure_time,arrival_time,price,seats_available) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
          [airline,flightNo,from,to,dep,arr,price,50]
        );
        saved.push(ins.rows[0]);
      }
    }
    res.json(saved);
  } catch(e) {
    try {
      const { from, to } = req.query;
      const db = await pool.query("SELECT * FROM flights WHERE LOWER(from_city)=LOWER($1) AND LOWER(to_city)=LOWER($2) ORDER BY price ASC", [from,to]);
      res.json(db.rows);
    } catch { res.status(500).json({ message: "Flight search failed" }); }
  }
});

// ══════════════════════════════════════════════════════════════
//  BOOKING EMAIL
// ══════════════════════════════════════════════════════════════
async function sendBookingEmail(toEmail, d) {
  const dep = d.departureTime ? new Date(d.departureTime).toLocaleString("en-IN",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:false}) : "—";
  const arr = d.arrivalTime   ? new Date(d.arrivalTime).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false}) : "—";
  const seatStr = d.seats && d.seats.length ? d.seats.join(", ") : "Auto-assigned";
  await resend.emails.send({
    from: "Alvryn Travel <onboarding@resend.dev>",
    to: toEmail,
    subject: "Booking Confirmed — "+d.bookingId+" | Alvryn",
    html: `<div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;background:#faf8f4;border-radius:16px;overflow:hidden;border:1px solid rgba(201,168,76,0.2);">
      <div style="background:linear-gradient(135deg,#c9a84c,#f0d080,#c9a84c);padding:28px 24px;text-align:center;">
        <h1 style="margin:0;font-size:22px;color:#1a1410;font-weight:900;letter-spacing:0.1em;">ALVRYN</h1>
        <p style="margin:4px 0 0;color:rgba(26,20,16,0.7);font-size:10px;letter-spacing:0.3em;">TRAVEL BEYOND BOUNDARIES</p>
      </div>
      <div style="background:rgba(201,168,76,0.1);padding:12px 24px;text-align:center;">
        <p style="margin:0;color:#8B6914;font-size:16px;font-weight:700;">Booking Confirmed!</p>
      </div>
      <div style="padding:24px;text-align:center;">
        <p style="margin:0;font-size:10px;color:#aaa;letter-spacing:0.15em;">BOOKING ID</p>
        <p style="margin:8px 0 0;font-size:24px;font-weight:900;color:#8B6914;letter-spacing:4px;">${d.bookingId}</p>
      </div>
      <div style="padding:0 24px 24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:9px 0;color:#888;font-size:11px;border-bottom:1px solid rgba(201,168,76,0.1);">PASSENGER</td><td style="padding:9px 0;color:#1a1410;font-weight:600;text-align:right;border-bottom:1px solid rgba(201,168,76,0.1);">${d.passengerName}</td></tr>
          <tr><td style="padding:9px 0;color:#888;font-size:11px;border-bottom:1px solid rgba(201,168,76,0.1);">FLIGHT</td><td style="padding:9px 0;color:#1a1410;font-weight:600;text-align:right;border-bottom:1px solid rgba(201,168,76,0.1);">${d.airline} ${d.flightNo||""}</td></tr>
          <tr><td style="padding:9px 0;color:#888;font-size:11px;border-bottom:1px solid rgba(201,168,76,0.1);">ROUTE</td><td style="padding:9px 0;color:#1a1410;font-weight:600;text-align:right;border-bottom:1px solid rgba(201,168,76,0.1);">${d.fromCity} to ${d.toCity}</td></tr>
          <tr><td style="padding:9px 0;color:#888;font-size:11px;border-bottom:1px solid rgba(201,168,76,0.1);">DEPARTURE</td><td style="padding:9px 0;color:#1a1410;font-weight:600;text-align:right;border-bottom:1px solid rgba(201,168,76,0.1);">${dep}</td></tr>
          <tr><td style="padding:9px 0;color:#888;font-size:11px;border-bottom:1px solid rgba(201,168,76,0.1);">ARRIVAL</td><td style="padding:9px 0;color:#1a1410;font-weight:600;text-align:right;border-bottom:1px solid rgba(201,168,76,0.1);">${arr}</td></tr>
          <tr><td style="padding:9px 0;color:#888;font-size:11px;border-bottom:1px solid rgba(201,168,76,0.1);">SEATS</td><td style="padding:9px 0;color:#1a1410;font-weight:600;text-align:right;border-bottom:1px solid rgba(201,168,76,0.1);">${seatStr}</td></tr>
          <tr><td style="padding:9px 0;color:#888;font-size:11px;border-bottom:1px solid rgba(201,168,76,0.1);">CLASS</td><td style="padding:9px 0;color:#1a1410;font-weight:600;text-align:right;border-bottom:1px solid rgba(201,168,76,0.1);">${d.cabinClass}</td></tr>
          ${d.discountApplied>0?`<tr><td style="padding:9px 0;color:#888;font-size:11px;border-bottom:1px solid rgba(201,168,76,0.1);">DISCOUNT</td><td style="padding:9px 0;color:#059669;font-weight:600;text-align:right;border-bottom:1px solid rgba(201,168,76,0.1);">-Rs.${d.discountApplied.toLocaleString()}</td></tr>`:""}
          <tr><td style="padding:9px 0;color:#888;font-size:11px;">AMOUNT PAID</td><td style="padding:9px 0;color:#8B6914;font-weight:700;font-size:16px;text-align:right;">Rs.${d.price?.toLocaleString()}</td></tr>
        </table>
      </div>
      <div style="padding:18px 24px;background:rgba(201,168,76,0.05);text-align:center;">
        <p style="margin:0;color:#aaa;font-size:12px;">Thank you for booking with Alvryn · alvryn.in</p>
      </div>
    </div>`
  });
}

// ══════════════════════════════════════════════════════════════
//  WHATSAPP BOT — fully improved
// ══════════════════════════════════════════════════════════════
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const userSessions = {};

const WA_BUS_ROUTES = [
  {from:"bangalore",to:"chennai",    dep:"06:00",arr:"11:30",price:650,  type:"AC Sleeper",   op:"VRL Travels"},
  {from:"bangalore",to:"chennai",    dep:"21:00",arr:"02:30",price:550,  type:"Semi-Sleeper", op:"KSRTC"},
  {from:"bangalore",to:"chennai",    dep:"14:00",arr:"19:30",price:720,  type:"AC Sleeper",   op:"SRS Travels"},
  {from:"bangalore",to:"hyderabad",  dep:"20:00",arr:"04:00",price:800,  type:"AC Sleeper",   op:"SRS Travels"},
  {from:"bangalore",to:"goa",        dep:"21:30",arr:"06:30",price:900,  type:"AC Sleeper",   op:"Neeta Tours"},
  {from:"bangalore",to:"mumbai",     dep:"17:00",arr:"09:00",price:1400, type:"AC Sleeper",   op:"VRL Travels"},
  {from:"bangalore",to:"pune",       dep:"18:00",arr:"08:00",price:1200, type:"AC Sleeper",   op:"Paulo Travels"},
  {from:"bangalore",to:"coimbatore", dep:"07:00",arr:"11:00",price:400,  type:"AC Seater",    op:"KSRTC"},
  {from:"bangalore",to:"mangalore",  dep:"22:00",arr:"05:00",price:700,  type:"AC Sleeper",   op:"VRL Travels"},
  {from:"bangalore",to:"mysore",     dep:"07:00",arr:"10:00",price:250,  type:"AC Seater",    op:"KSRTC"},
  {from:"bangalore",to:"kochi",      dep:"21:00",arr:"07:00",price:950,  type:"AC Sleeper",   op:"KSRTC"},
  {from:"bangalore",to:"madurai",    dep:"21:00",arr:"05:00",price:750,  type:"AC Sleeper",   op:"Parveen Travels"},
  {from:"chennai",  to:"bangalore",  dep:"07:00",arr:"12:30",price:630,  type:"AC Sleeper",   op:"VRL Travels"},
  {from:"chennai",  to:"bangalore",  dep:"21:00",arr:"02:30",price:580,  type:"Semi-Sleeper", op:"KSRTC"},
  {from:"chennai",  to:"hyderabad",  dep:"21:00",arr:"04:00",price:750,  type:"AC Sleeper",   op:"TSRTC"},
  {from:"chennai",  to:"coimbatore", dep:"08:00",arr:"12:30",price:350,  type:"AC Seater",    op:"TNSTC"},
  {from:"chennai",  to:"madurai",    dep:"22:00",arr:"03:00",price:450,  type:"AC Sleeper",   op:"Parveen Travels"},
  {from:"hyderabad",to:"bangalore",  dep:"21:00",arr:"05:00",price:800,  type:"AC Sleeper",   op:"Orange Travels"},
  {from:"hyderabad",to:"mumbai",     dep:"18:00",arr:"06:00",price:1100, type:"AC Sleeper",   op:"VRL Travels"},
  {from:"hyderabad",to:"chennai",    dep:"20:30",arr:"03:30",price:700,  type:"AC Sleeper",   op:"APSRTC"},
  {from:"mumbai",   to:"pune",       dep:"07:00",arr:"10:00",price:300,  type:"AC Seater",    op:"MSRTC"},
  {from:"mumbai",   to:"goa",        dep:"22:00",arr:"08:00",price:950,  type:"AC Sleeper",   op:"Paulo Travels"},
  {from:"delhi",    to:"jaipur",     dep:"06:00",arr:"11:00",price:500,  type:"AC Seater",    op:"RSRTC"},
  {from:"delhi",    to:"agra",       dep:"07:00",arr:"11:00",price:400,  type:"AC Seater",    op:"UP Roadways"},
  {from:"delhi",    to:"chandigarh", dep:"08:00",arr:"12:00",price:450,  type:"AC Seater",    op:"HRTC"},
  {from:"delhi",    to:"lucknow",    dep:"22:00",arr:"05:00",price:700,  type:"AC Sleeper",   op:"UP SRTC"},
  {from:"delhi",    to:"amritsar",   dep:"21:30",arr:"04:30",price:750,  type:"AC Sleeper",   op:"PRTC"},
];

// ── WhatsApp helper: search flights and build reply ────────────────────────
async function searchFlightsWA(session, from, to, targetDate, rawMsg) {
  try {
    const isCheap = /cheap|budget|lowest|sasta|affordable|saste|kam/i.test(rawMsg);
    let q = "SELECT * FROM flights WHERE LOWER(from_city)=$1 AND LOWER(to_city)=$2";
    let v = [from, to];
    if (targetDate) { q += " AND DATE(departure_time)=$3"; v.push(fmt(targetDate)); }
    q += isCheap ? " ORDER BY price ASC LIMIT 5" : " ORDER BY departure_time ASC LIMIT 5";
    let flights = (await pool.query(q, v)).rows;
    if (!flights.length && targetDate) {
      flights = (await pool.query(
        "SELECT * FROM flights WHERE LOWER(from_city)=$1 AND LOWER(to_city)=$2 AND departure_time > NOW() ORDER BY departure_time ASC LIMIT 5",
        [from, to]
      )).rows;
    }
    const dateStr = targetDate ? fmtDateStr(targetDate) : "";
    // ✅ Fixed: no trs in link
    const affLink = buildFlightLink(from, to, dateStr, "alvryn_whatsapp");
    session.flights = flights;
    session.from    = from;
    session.to      = to;
    session.dateStr = dateStr;
    await logEvent("flight_search", "WhatsApp: "+from+" to "+to, "whatsapp");
    if (!flights.length) {
      session.lastReply = "No flights found for *"+from.toUpperCase()+" → "+to.toUpperCase()+"*.\n\nCheck all options:\n"+affLink+"\n\n_Prices may vary slightly based on provider_";
      session.step = "idle";
      return;
    }
    const prices = flights.map(f => f.price);
    const minPrice = Math.min(...prices);
    let reply = "✈️ *Flights: "+from.toUpperCase()+" → "+to.toUpperCase()+"*";
    if (targetDate) reply += "\n📅 "+targetDate.toLocaleDateString("en-IN",{day:"numeric",month:"short"});
    reply += "\n\n";
    flights.slice(0,4).forEach((f,i) => {
      const dep = new Date(f.departure_time).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false});
      const arr = new Date(f.arrival_time).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false});
      const label = f.price===minPrice ? "🏷️ Best Price · " : "";
      const insight = flightInsight(f, flights);
      reply += "*"+(i+1)+". "+f.airline+"*\n";
      reply += "⏰ "+dep+" → "+arr+"\n";
      reply += "💰 "+label+"Approx Rs."+f.price.toLocaleString()+"–Rs."+Math.round(f.price*1.15).toLocaleString()+"\n";
      reply += "💡 "+insight+"\n\n";
    });
    reply += "Reply *1* to *"+Math.min(4,flights.length)+"* for booking link\n";
    reply += "Or check all options:\n"+affLink+"\n\n";
    reply += "_Prices may vary slightly based on provider_";
    session.lastReply = reply;
    session.step = "flight_selecting";
  } catch(e) {
    console.error("WA flight search:", e);
    session.lastReply = "Sorry, couldn't search flights. Please try again.";
    session.step = "idle";
  }
}

// ── WhatsApp helper: search buses and build reply ──────────────────────────
function searchBusesWA(session, from, to, rawMsg) {
  const isCheap = /cheap|budget|lowest|sasta|affordable|saste|kam/i.test(rawMsg);
  const isMorning = /morning|subah|காலை|ఉదయం|5|6|7|8|9|10|11/.test(rawMsg);
  const isNight   = /night|raat|evening|sham|ratri|22|23|21|20/.test(rawMsg);

  // ✅ Fixed: correctly filter from→to (not reversed)
  let buses = WA_BUS_ROUTES.filter(b => b.from===from && b.to===to);

  if (isMorning) buses = buses.filter(b => { const h=parseInt(b.dep.split(":")[0]); return h>=5 && h<13; });
  if (isNight)   buses = buses.filter(b => { const h=parseInt(b.dep.split(":")[0]); return h>=18 || h<5; });
  if (isCheap)   buses.sort((a,b) => a.price-b.price);

  const redLink = buildBusLink(from, to);
  session.buses = buses;
  session.from  = from;
  session.to    = to;

  if (!buses.length) {
    session.step = "idle";
    return "🚌 *"+from.toUpperCase()+" → "+to.toUpperCase()+"*\n\nNo buses in our list for this route.\n\n👉 Check live schedule on RedBus:\n"+redLink+"\n\n_Live seat availability and booking_";
  }

  const minPrice = Math.min(...buses.map(b=>b.price));
  let reply = "🚌 *Buses: "+from.toUpperCase()+" → "+to.toUpperCase()+"*\n\n";
  buses.slice(0,4).forEach((b,i) => {
    const label = b.price===minPrice ? "🏷️ " : "";
    reply += "*"+(i+1)+". "+b.op+"* · "+b.type+"\n";
    reply += "⏰ "+b.dep+" → "+b.arr+"\n";
    reply += "💰 "+label+"Approx Rs."+b.price.toLocaleString()+"\n";
    if (i===0 && b.price===minPrice) reply += "💡 Best price on this route\n";
    reply += "\n";
  });
  reply += "Reply *1* to *"+Math.min(4,buses.length)+"* for booking link\n";
  reply += "📋 More buses on RedBus:\n"+redLink+"\n\n";
  reply += "_Prices may vary slightly based on provider_";
  session.step = "bus_selecting";
  return reply;
}

app.post("/whatsapp", async (req, res) => {
  const rawMsg = req.body.Body?.trim() || "";
  const msg    = rawMsg.toLowerCase().trim();
  const phone  = req.body.From;
  let reply    = "";

  if (!userSessions[phone]) userSessions[phone] = { step:"idle" };
  const session = userSessions[phone];

  try {
    // ── Global reset ────────────────────────────────────────────────────────
    const resetWords = ["hi","hello","hey","start","restart","cancel","reset","stop","menu","back","help","hlo","hai","halo","namaste","vanakkam","namaskar"];
    if (resetWords.some(w => msg===w || msg.startsWith(w+" "))) {
      userSessions[phone] = { step:"idle" };
      reply = "✈️ *Alvryn AI — Your Travel Assistant*\n\n"
        + "I can help you with:\n\n"
        + "✈️ *Flights:* _\"flights bangalore to mumbai tomorrow\"_\n"
        + "🚌 *Buses:* _\"bus bangalore to chennai kal\"_\n"
        + "🏨 *Hotels:* _\"hotels in goa\"_\n"
        + "🗺️ *Trip ideas:* _\"where should I go for 3000\"_\n"
        + "💰 *Cheapest:* _\"cheapest flight bangalore to delhi\"_\n"
        + "⚡ *Fastest:* _\"fastest bus bangalore to chennai\"_\n\n"
        + "Type in English, Hindi, Tamil, Telugu or Kannada!";
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message(reply);
      return res.type("text/xml").send(twiml.toString());
    }

    // ── Intent keywords ─────────────────────────────────────────────────────
    const hotelKw  = /\b(hotel|hotels|stay|room|rooms|accommodation|lodge|resort|hostel|guesthouse|where to stay|place to stay)\b/i;
    const busKw    = /\b(bus|buses|coach|volvo|sleeper|seater|ksrtc|msrtc|tsrtc|rsrtc|redbus|ac bus|overnight bus|road trip|by road)\b/i;
    const flightKw = /\b(flight|flights|fly|flying|plane|airways|airlines|air india|indigo|spicejet|vistara|akasa|ticket)\b/i;

    // ── Intent: cheapest / fastest / best (context-aware) ──────────────────
    const wantsCheapest = /cheapest|cheap|lowest price|sasta|sabse sasta|budget|lowest fare|kam paise|best price|minimum fare/i.test(msg);
    const wantsFastest  = /fastest|quick|quickest|shortest|direct only|non.?stop|fast/i.test(msg);
    const wantsMorning  = /morning|subah|early|5 am|6 am|7 am|8 am|9 am/i.test(msg);
    const wantsEvening  = /evening|sham|night|raat|late|10 pm|11 pm/i.test(msg);
    const wantsInfo     = /which is better|compare|vs|versus|difference|which one|kaunsa|konsa|better option/i.test(msg);

    // If user asks cheapest/fastest while in a conversation with results
    if ((wantsCheapest||wantsFastest||wantsMorning||wantsEvening) && (session.flights?.length || session.buses?.length)) {
      if (session.flights?.length) {
        let filtered = [...session.flights];
        if (wantsFastest) {
          filtered.sort((a,b) => {
            const durA = new Date(a.arrival_time)-new Date(a.departure_time);
            const durB = new Date(b.arrival_time)-new Date(b.departure_time);
            return durA-durB;
          });
        } else if (wantsCheapest) {
          filtered.sort((a,b) => a.price-b.price);
        } else if (wantsMorning) {
          filtered = filtered.filter(f => { const h=new Date(f.departure_time).getHours(); return h>=5&&h<12; });
        } else if (wantsEvening) {
          filtered = filtered.filter(f => { const h=new Date(f.departure_time).getHours(); return h>=17; });
        }
        if (!filtered.length) { reply = "No flights match that filter. Try a different time or route."; }
        else {
          const f = filtered[0];
          const dep = new Date(f.departure_time).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false});
          const arr = new Date(f.arrival_time).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false});
          // ✅ No trs in link
          const link = buildFlightLink(session.from, session.to, session.dateStr, "alvryn_whatsapp");
          const insight = flightInsight(f, session.flights);
          reply = (wantsFastest?"⚡ *Fastest*":"💰 *"+(wantsCheapest?"Cheapest":"Best match")+"*")
            + ": "+f.airline+"\n"
            + "⏰ "+dep+" → "+arr+"\n"
            + "💰 Approx Rs."+f.price.toLocaleString()+"–Rs."+Math.round(f.price*1.15).toLocaleString()+"\n"
            + "💡 "+insight+"\n\n"
            + "👉 Check live price:\n"+link+"\n\n"
            + "_Prices may vary slightly based on provider_";
        }
      } else if (session.buses?.length) {
        let filtered = [...session.buses];
        if (wantsCheapest) filtered.sort((a,b) => a.price-b.price);
        if (wantsMorning)  filtered = filtered.filter(b => { const h=parseInt(b.dep.split(":")[0]); return h>=5&&h<12; });
        if (wantsEvening)  filtered = filtered.filter(b => { const h=parseInt(b.dep.split(":")[0]); return h>=18||h<5; });
        if (!filtered.length) { reply = "No buses match that filter. Try different timing."; }
        else {
          const b = filtered[0];
          const redLink = buildBusLink(session.from, session.to);
          const savingVsAvg = Math.round((session.buses.reduce((s,x)=>s+x.price,0)/session.buses.length) - b.price);
          reply = "💰 *"+(wantsCheapest?"Cheapest":"Best match")+"*: "+b.op+"\n"
            + "🚌 "+b.type+"\n"
            + "⏰ "+b.dep+" → "+b.arr+"\n"
            + "💰 Approx Rs."+b.price.toLocaleString()
            + (savingVsAvg>50?" (you save Rs."+savingVsAvg+" vs average)":"")+"\n\n"
            + "👉 Book on RedBus:\n"+redLink+"\n\n"
            + "_Prices may vary slightly based on provider_";
        }
      }
    }

    // ── Intent: compare (ask user what they want to compare) ───────────────
    else if (wantsInfo && (session.flights?.length || session.buses?.length)) {
      if (session.flights?.length) {
        const sorted = [...session.flights].sort((a,b)=>a.price-b.price);
        const cheap = sorted[0];
        const link = buildFlightLink(session.from, session.to, session.dateStr, "alvryn_whatsapp");
        reply = "📊 *Comparison: "+session.from.toUpperCase()+" → "+session.to.toUpperCase()+"*\n\n"
          + "💰 Cheapest: "+cheap.airline+" Rs."+cheap.price.toLocaleString()+"\n"
          + "📈 Price range: Rs."+Math.min(...sorted.map(f=>f.price)).toLocaleString()+" – Rs."+Math.max(...sorted.map(f=>f.price)).toLocaleString()+"\n"
          + "✈️ Options: "+sorted.length+" flights found\n\n"
          + "💡 You are getting a competitive price for this route\n\n"
          + "👉 Compare all on partner site:\n"+link+"\n\n"
          + "_Prices may vary across platforms — this is one of the best available_";
      }
    }

    // ── "Where should I go?" / trip planning ──────────────────────────────
    else if (/where.*go|suggest.*trip|plan.*trip|kaha.*jao|trip.*plan|vacation|where.*travel|recommend.*place|\d+.*day.*trip|trip.*\d+.*day/i.test(msg)) {
      const budget = extractBudget(msg);
      const cities = extractCities(msg);
      const fromCity = cities.from ? cities.from.charAt(0).toUpperCase()+cities.from.slice(1) : "Bangalore";
      const suggestions = [
        { dest:"🌴 Goa",         budget:"3500–5500",  days:"2 days",   why:"Beaches, nightlife, amazing food." },
        { dest:"🌿 Coorg",       budget:"2000–3500",  days:"1-2 days", why:"Coffee estates, waterfalls, cool weather." },
        { dest:"🌊 Pondicherry", budget:"2500–4000",  days:"2 days",   why:"French quarters, beaches, great food." },
        { dest:"🏛️ Mysore",      budget:"1500–2500",  days:"1 day",    why:"Palaces, culture, easy weekend trip." },
        { dest:"🏔️ Ooty",        budget:"1800–3000",  days:"1-2 days", why:"Hill station, scenic toy train." },
        { dest:"⛩️ Hampi",       budget:"2000–4000",  days:"2 days",   why:"UNESCO heritage, unique landscape." },
      ].filter(s => !budget || parseInt(budget) >= parseInt(s.budget.split("–")[0])-500);
      const top3 = suggestions.slice(0,3);
      reply = "🗺️ *Trip Suggestions from "+fromCity+"*\n\n";
      if (budget) reply += "Budget: approx Rs."+budget.toLocaleString()+"\n\n";
      top3.forEach((s,i) => {
        reply += "*"+(i+1)+". "+s.dest+"*\n";
        reply += "💰 Rs."+s.budget+" · "+s.days+"\n";
        reply += "💡 "+s.why+"\n\n";
      });
      reply += "Reply *1*, *2*, or *3* to search flights/buses for that destination.\nOr type your route directly!";
      session.tripSuggestions = top3;
      session.from = fromCity.toLowerCase();
      session.step = "trip_suggested";
    }

    // ── Trip suggestion selection ──────────────────────────────────────────
    else if (session.step==="trip_suggested") {
      const num = parseInt(msg.match(/^(\d+)/)?.[1]);
      if (num && num>=1 && num<=(session.tripSuggestions||[]).length) {
        const dest = session.tripSuggestions[num-1];
        const destName = dest.dest.replace(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{27BF}]/gu,"").trim();
        const fromCity = session.from||"bangalore";
        const redLink = buildBusLink(fromCity, destName.toLowerCase());
        const flLink  = buildFlightLink(fromCity, destName.toLowerCase(), "", "alvryn_whatsapp");
        reply = "✈️ *"+fromCity.charAt(0).toUpperCase()+fromCity.slice(1)+" → "+destName+"*\n\n"
          + "👉 Flights: "+flLink+"\n"
          + "👉 Buses: "+redLink+"\n\n"
          + "Or type:\n_\"flights "+fromCity+" to "+destName.toLowerCase()+" tomorrow\"_\n_\"bus "+fromCity+" to "+destName.toLowerCase()+" this weekend\"_";
        session.step = "idle";
      } else {
        reply = "Please reply *1*, *2*, or *3*, or type a new search.";
      }
    }

    // ── Hotels ─────────────────────────────────────────────────────────────
    else if (hotelKw.test(msg) || session.step==="asking_hotel_city") {
      let city = "";
      if (session.step==="asking_hotel_city") {
        city = msg.trim();
        session.step = "idle";
      } else {
        const { from } = extractCities(msg);
        city = from || msg.replace(/\b(hotel|hotels|stay|in|at|for|rooms?|best|good|cheap|near)\b/gi,"").trim().split(/\s+/).filter(w=>w.length>2)[0] || "";
      }
      if (!city || city.length<2) {
        session.step = "asking_hotel_city";
        reply = "🏨 *Hotel Search*\n\nWhich city are you looking for hotels in?\n\n_\"hotels in goa\"_\n_\"stay in mumbai\"_";
      } else {
        const displayCity = city.charAt(0).toUpperCase()+city.slice(1);
        const link = buildHotelLink(displayCity);
        await logEvent("hotel_search", "WhatsApp: "+displayCity, "whatsapp");
        reply = "🏨 *Hotels in "+displayCity+"*\n\n"
          + "💡 You are getting competitive prices for this city\n\n"
          + "👉 View and book hotels:\n"+link+"\n\n"
          + "_Live prices on Booking.com · Prices may vary across platforms_";
      }
    }

    // ── Buses ──────────────────────────────────────────────────────────────
    else if (busKw.test(msg) || session.step==="bus_search") {
      const { from, to } = extractCities(msg);
      if (!from || !to) {
        session.step = "bus_search";
        reply = "🚌 *Bus Search*\n\nTell me your route:\n_\"bus bangalore to chennai tomorrow\"_\n_\"bus blr to hyd kal\"_\n\nI understand English, Hindi, Tamil, typos!";
      } else {
        const { pastDate } = extractDate(msg);
        if (pastDate) { reply = "That date is in the past! Try: _\"tomorrow\"_, _\"next friday\"_."; session.step="idle"; }
        else { reply = searchBusesWA(session, from, to, rawMsg); }
      }
    }

    // ── Bus city follow-up ─────────────────────────────────────────────────
    else if (session.step==="bus_search") {
      const { from, to } = extractCities(msg);
      if (!from||!to) { reply = "Couldn't find the cities. Try: _\"bus bangalore to chennai\"_"; }
      else { reply = searchBusesWA(session, from, to, rawMsg); }
    }

    // ── Bus selection ──────────────────────────────────────────────────────
    else if (session.step==="bus_selecting") {
      if (/^(all|more|redbus|full|schedule|all buses)/.test(msg)) {
        const redLink = buildBusLink(session.from, session.to);
        reply = "🚌 *Full schedule on RedBus:*\n"+redLink+"\n\n_Live seat availability and booking_";
        session.step = "idle";
      } else {
        const num = parseInt(msg.match(/^(\d+)/)?.[1]);
        if (!num||num<1||num>(session.buses||[]).length) {
          reply = "Please reply *1* to *"+Math.min(4,(session.buses||[]).length)+"*, or type *all* for more buses.";
        } else {
          const b = session.buses[num-1];
          const redLink = buildBusLink(session.from, session.to);
          const prices = session.buses.map(x=>x.price);
          const minPrice = Math.min(...prices);
          const avgPrice = Math.round(prices.reduce((s,x)=>s+x,0)/prices.length);
          const saving = avgPrice-b.price;
          reply = "✅ *"+b.op+"*\n"
            + "🚌 "+(session.from||"").toUpperCase()+" → "+(session.to||"").toUpperCase()+"\n"
            + "⏰ "+b.dep+" → "+b.arr+"\n"
            + "💰 Approx Rs."+b.price.toLocaleString()+" · "+b.type+"\n"
            + (b.price===minPrice?"🏷️ Best price on this route\n":"")
            + (saving>100?"💡 You save Rs."+saving+" vs average on this route\n":"")
            + "\n👉 Book on RedBus:\n"+redLink+"\n\n"
            + "📋 More buses: "+redLink+"\n\n"
            + "_Prices may vary slightly based on provider_";
          session.step = "idle";
        }
      }
    }

    // ── Flight selection ───────────────────────────────────────────────────
    else if (session.step==="flight_selecting") {
      if (/^(all|more|partner|aviasales|all flights)/.test(msg)) {
        const link = buildFlightLink(session.from, session.to, session.dateStr, "alvryn_whatsapp");
        reply = "✈️ *All flights on partner site:*\n"+link+"\n\n_Prices may vary slightly based on provider_";
        session.step = "idle";
      } else {
        const num = parseInt(msg.match(/^(\d+)/)?.[1]);
        if (!num) {
          reply = "Please reply with a number like *1*, *2*, or *3*.\nOr type *all* to see all flights.";
        } else if (num<1||num>(session.flights||[]).length) {
          reply = "Pick between *1* and *"+(session.flights||[]).length+"*. Or type *all* for more.";
        } else {
          const f = session.flights[num-1];
          const link = buildFlightLink(session.from, session.to, session.dateStr, "alvryn_whatsapp");
          const dep = new Date(f.departure_time).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false});
          const arr = new Date(f.arrival_time).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false});
          const insight = flightInsight(f, session.flights);
          const prices = session.flights.map(x=>x.price);
          const minPrice = Math.min(...prices);
          const saving = minPrice<f.price ? 0 : 0; // will be shown in insight
          await logEvent("view_deal", "WhatsApp: "+(session.from||"?")+" to "+(session.to||"?"), "whatsapp");
          reply = "✈️ *"+f.airline+"*\n"
            + (session.from||"").toUpperCase()+" → "+(session.to||"").toUpperCase()+"\n"
            + "⏰ "+dep+" → "+arr+"\n"
            + "💰 Approx Rs."+f.price.toLocaleString()+"–Rs."+Math.round(f.price*1.2).toLocaleString()+"\n"
            + (f.price===minPrice?"🏷️ Best price on this route\n":"")
            + "💡 "+insight+"\n\n"
            + "👉 Check live price & book:\n"+link+"\n\n"
            + "_Prices may vary slightly based on provider · Secure booking on partner site_";
          session.step = "idle";
        }
      }
    }

    // ── Date follow-up ─────────────────────────────────────────────────────
    else if (session.step==="asking_date") {
      const { date: targetDate, pastDate } = extractDate(msg);
      if (pastDate) { reply = "That date is in the past! Try: _\"tomorrow\"_, _\"next friday\"_."; }
      else if (!targetDate) { reply = "Didn't catch the date. Try: _\"tomorrow\"_, _\"next friday\"_, _\"25 april\"_"; }
      else if (session.pendingBus) {
        reply = searchBusesWA(session, session.from, session.to, rawMsg);
      } else {
        await searchFlightsWA(session, session.from, session.to, targetDate, rawMsg);
        reply = session.lastReply;
      }
    }

    // ── Default: detect flight or bus search ───────────────────────────────
    else {
      const { from, to } = extractCities(msg);
      if (from && to) {
        const isBus = isBusQuery(msg) || session.travelType==="bus";
        const { date: targetDate, pastDate } = extractDate(msg);
        if (pastDate) {
          reply = "That date is in the past! Please search for today or a future date.";
        } else if (!targetDate) {
          session.step = "asking_date";
          session.from = from; session.to = to;
          session.pendingBus = isBus;
          reply = (isBus?"🚌":"✈️")+" *"+(from.toUpperCase())+" → "+(to.toUpperCase())+"*\n\nWhat date do you want to travel?\n_\"tomorrow\"_, _\"25 april\"_, _\"next friday\"_";
        } else if (isBus) {
          reply = searchBusesWA(session, from, to, rawMsg);
        } else {
          await searchFlightsWA(session, from, to, targetDate, rawMsg);
          reply = session.lastReply;
        }
      } else {
        // Off-topic or unclear
        const offTopicKw = /weather|cricket|ipl|news|sports|movie|song|recipe|cook|politics|exam|job|love|relationship|corona|covid/i;
        if (offTopicKw.test(msg)) {
          reply = "I specialise in travel!\n\n"
            + "I can help with:\n"
            + "✈️ _\"flights bangalore to mumbai tomorrow\"_\n"
            + "🚌 _\"bus bangalore to chennai kal\"_\n"
            + "🏨 _\"hotels in goa\"_\n"
            + "🗺️ _\"suggest a trip under 3000\"_\n\n"
            + "Type *help* for the full menu.";
        } else {
          reply = "✈️ *Alvryn AI*\n\n"
            + "I didn't understand that. Here's what I can do:\n\n"
            + "✈️ Search flights\n"
            + "🚌 Search buses\n"
            + "🏨 Find hotels\n"
            + "💰 Find cheapest options\n"
            + "⚡ Find fastest routes\n"
            + "🗺️ Suggest trip destinations\n\n"
            + "Try: _\"flights bangalore to delhi tomorrow\"_\n"
            + "Or type *help* for the full menu.";
        }
      }
    }

  } catch(e) {
    console.error("WhatsApp error:", e);
    reply = "Something went wrong. Type *restart* to start fresh.";
    userSessions[phone] = { step:"idle" };
  }

  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(reply);
  res.type("text/xml").send(twiml.toString());
});

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
  try { const r = await pool.query("SELECT * FROM promo_codes ORDER BY id DESC"); res.json(r.rows); }
  catch { res.json([]); }
});

// ══════════════════════════════════════════════════════════════
//  WAITLIST
// ══════════════════════════════════════════════════════════════
function generateRefCode(email) {
  return email.split("@")[0].replace(/[^a-zA-Z0-9]/g,"").slice(0,8) + Math.random().toString(36).slice(2,6).toUpperCase();
}

async function ensureWaitlistTable() {
  await pool.query(`CREATE TABLE IF NOT EXISTS waitlist (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    ref_code VARCHAR(20) UNIQUE NOT NULL,
    referred_by VARCHAR(20),
    joined_at TIMESTAMP DEFAULT NOW()
  )`);
}

app.post("/waitlist", async (req, res) => {
  try {
    await ensureWaitlistTable();
    const { email, ref } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });
    const refCode = generateRefCode(email);
    let referredBy = null;
    if (ref) { const rc=await pool.query("SELECT email FROM waitlist WHERE ref_code=$1",[ref]); if(rc.rows.length)referredBy=ref; }
    await pool.query("INSERT INTO waitlist (email,ref_code,referred_by) VALUES ($1,$2,$3)",[email,refCode,referredBy]);
    res.json({ message:"Added!", refCode });
  } catch(e) {
    if (e.code==="23505") {
      const ex = await pool.query("SELECT ref_code FROM waitlist WHERE email=$1",[req.body.email]).catch(()=>({rows:[]}));
      return res.status(409).json({ message:"Already on waitlist", refCode:ex.rows[0]?.ref_code });
    }
    res.status(500).json({ message:"Server error" });
  }
});

app.get("/waitlist/count", async (req, res) => {
  try { await ensureWaitlistTable(); const r=await pool.query("SELECT COUNT(*) FROM waitlist"); res.json({count:parseInt(r.rows[0].count)}); }
  catch { res.json({count:0}); }
});

app.get("/admin/waitlist", async (req, res) => {
  try {
    await ensureWaitlistTable();
    const r = await pool.query("SELECT w.*,COUNT(r2.id) as ref_count FROM waitlist w LEFT JOIN waitlist r2 ON r2.referred_by=w.ref_code GROUP BY w.id ORDER BY ref_count DESC");
    res.json(r.rows);
  } catch { res.json([]); }
});

// ══════════════════════════════════════════════════════════════
//  START
// ══════════════════════════════════════════════════════════════
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Alvryn server running on port "+PORT));