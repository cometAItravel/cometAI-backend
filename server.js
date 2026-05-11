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
async function logEvent(eventType, details = "", source = "web", userId = null) {
  try {
    await pool.query(
      `INSERT INTO events (event_type, details, source, user_id) VALUES ($1,$2,$3,$4)`,
      [eventType, String(details).slice(0, 500), source, userId]
    );
  } catch (e) {}
}

async function ensureEventsTable() {
  await pool.query(`CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY, event_type VARCHAR(60) NOT NULL,
    details TEXT, source VARCHAR(30) DEFAULT 'web',
    user_id INTEGER, created_at TIMESTAMP DEFAULT NOW()
  )`);
}
ensureEventsTable().catch(console.error);

// ══════════════════════════════════════════════════════════════
//  IST TIME HELPER
// ══════════════════════════════════════════════════════════════
function getISTGreeting() {
  const now = new Date();
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const hour = ist.getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Hey, night owl";
}

function getISTHour() {
  const now = new Date();
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  return ist.getHours();
}

// ══════════════════════════════════════════════════════════════
//  COMPREHENSIVE CITY MAP — fixed, no hallucination
// ══════════════════════════════════════════════════════════════
const CITY_MAP = {
  // Karnataka
  "bangalore":"bangalore","bengaluru":"bangalore","bengalore":"bangalore","bangaluru":"bangalore",
  "blr":"bangalore","bang":"bangalore","banglore":"bangalore","bangalor":"bangalore","blore":"bangalore",
  "mysore":"mysore","mysuru":"mysore","mys":"mysore",
  "mangalore":"mangalore","mangaluru":"mangalore","ixe":"mangalore",
  "hubli":"hubli","hubballi":"hubli","belgaum":"belgaum","belagavi":"belgaum",
  "hampi":"hampi","hospet":"hospet","dharwad":"dharwad",
  // Kerala
  "kochi":"kochi","cochin":"kochi","cok":"kochi","ernakulam":"kochi",
  "trivandrum":"trivandrum","thiruvananthapuram":"trivandrum","trv":"trivandrum",
  "kozhikode":"kozhikode","calicut":"kozhikode","thrissur":"thrissur",
  "varkala":"varkala","kollam":"kollam","alleppey":"alleppey","alappuzha":"alleppey",
  "munnar":"munnar","wayanad":"wayanad","thekkady":"thekkady","kannur":"kannur",
  "kovalam":"kovalam","kottayam":"kottayam","palakkad":"palakkad",
  // Tamil Nadu
  "chennai":"chennai","madras":"chennai","maa":"chennai","chenai":"chennai","chinnai":"chennai",
  "coimbatore":"coimbatore","cbe":"coimbatore","kovai":"coimbatore",
  "madurai":"madurai","mdu":"madurai","trichy":"trichy","tiruchirappalli":"trichy",
  "salem":"salem","tirunelveli":"tirunelveli","ooty":"ooty","kodaikanal":"kodaikanal",
  "pondicherry":"pondicherry","puducherry":"pondicherry","pondy":"pondicherry",
  "vellore":"vellore","thanjavur":"thanjavur","tanjore":"thanjavur",
  // Andhra / Telangana
  "hyderabad":"hyderabad","hyd":"hyderabad","hydrabad":"hyderabad","secunderabad":"hyderabad",
  "visakhapatnam":"visakhapatnam","vizag":"visakhapatnam","vtz":"visakhapatnam",
  "vijayawada":"vijayawada","tirupati":"tirupati","warangal":"warangal",
  // Maharashtra
  "mumbai":"mumbai","bombay":"mumbai","bom":"mumbai","mum":"mumbai",
  "pune":"pune","pnq":"pune","poona":"pune",
  "nagpur":"nagpur","nashik":"nashik","aurangabad":"aurangabad","kolhapur":"kolhapur",
  "goa":"goa","goi":"goa","panaji":"goa","panjim":"goa","north goa":"goa","south goa":"goa",
  // Delhi / North
  "delhi":"delhi","new delhi":"delhi","del":"delhi","dilli":"delhi","dilhi":"delhi",
  "chandigarh":"chandigarh","amritsar":"amritsar","ludhiana":"ludhiana",
  "jaipur":"jaipur","jai":"jaipur","pink city":"jaipur",
  "lucknow":"lucknow","lko":"lucknow","agra":"agra","varanasi":"varanasi","kashi":"varanasi","banaras":"varanasi",
  "dehradun":"dehradun","shimla":"shimla","manali":"manali","dharamshala":"dharamshala",
  "haridwar":"haridwar","rishikesh":"rishikesh","mussoorie":"mussoorie",
  // East India
  "kolkata":"kolkata","calcutta":"kolkata","ccu":"kolkata",
  "bhubaneswar":"bhubaneswar","bbi":"bhubaneswar","puri":"puri",
  "patna":"patna","ranchi":"ranchi","guwahati":"guwahati",
  "darjeeling":"darjeeling","gangtok":"gangtok","shillong":"shillong",
  // Central / West
  "ahmedabad":"ahmedabad","amd":"ahmedabad","surat":"surat","vadodara":"vadodara",
  "indore":"indore","bhopal":"bhopal","udaipur":"udaipur","jodhpur":"jodhpur",
  "srinagar":"srinagar","leh":"leh","ladakh":"leh","jammu":"jammu",
  "port blair":"port blair","andaman":"port blair",
  // Bangalore local areas
  "attibele":"attibele","hosur":"hosur","electronic city":"electronic city",
  "whitefield":"whitefield","koramangala":"koramangala","hsr layout":"hsr layout",
  "marathahalli":"marathahalli","indiranagar":"indiranagar","jp nagar":"jp nagar",
  "hebbal":"hebbal","yelahanka":"yelahanka","kengeri":"kengeri","btm":"btm",
  "majestic":"majestic","silk board":"silk board","jayanagar":"jayanagar",
  "malleswaram":"malleswaram","rajajinagar":"rajajinagar","yeshwanthpur":"yeshwanthpur",
  // Mumbai local
  "bandra":"bandra","andheri":"andheri","borivali":"borivali","thane":"thane",
  "navi mumbai":"navi mumbai","kurla":"kurla","dadar":"dadar",
  // Delhi local
  "gurgaon":"gurgaon","gurugram":"gurgaon","noida":"noida","faridabad":"faridabad",
  "dwarka":"dwarka","rohini":"rohini","south delhi":"south delhi",
  // International
  "dubai":"dubai","dxb":"dubai","dubi":"dubai","dubay":"dubai",
  "singapore":"singapore","sin":"singapore","singapur":"singapore",
  "bangkok":"bangkok","bkk":"bangkok","bangkock":"bangkok",
  "london":"london","lhr":"london","landan":"london",
  "new york":"new york","jfk":"new york","nyc":"new york","newyork":"new york",
  "kuala lumpur":"kuala lumpur","kul":"kuala lumpur","kl":"kuala lumpur",
  "colombo":"colombo","cmb":"colombo","sri lanka":"colombo",
  "paris":"paris","cdg":"paris","tokyo":"tokyo","nrt":"tokyo","osaka":"osaka",
  "sydney":"sydney","syd":"sydney","melbourne":"melbourne","brisbane":"brisbane",
  "frankfurt":"frankfurt","amsterdam":"amsterdam","zurich":"zurich",
  "toronto":"toronto","yyz":"toronto","vancouver":"vancouver",
  "los angeles":"los angeles","lax":"los angeles","chicago":"chicago",
  "san francisco":"san francisco","sfo":"san francisco","new york city":"new york",
  "hong kong":"hong kong","hkg":"hong kong","beijing":"beijing","shanghai":"shanghai",
  "doha":"doha","doh":"doha","abu dhabi":"abu dhabi","auh":"abu dhabi","muscat":"muscat",
  "istanbul":"istanbul","ist":"istanbul","rome":"rome","barcelona":"barcelona",
  "madrid":"madrid","milan":"milan","vienna":"vienna","amsterdam":"amsterdam",
  "bali":"bali","dps":"bali","phuket":"phuket","hkt":"phuket",
  "kathmandu":"kathmandu","ktm":"kathmandu","nepal":"kathmandu",
  "dhaka":"dhaka","colombo":"colombo","male":"male","maldives":"male",
  "johannesburg":"johannesburg","cairo":"cairo","nairobi":"nairobi",
  "seoul":"seoul","icn":"seoul","taipei":"taipei","manila":"manila","jakarta":"jakarta",
  "auckland":"auckland","akl":"auckland","perth":"perth",
  "dubai":"dubai","sharjah":"sharjah","riyadh":"riyadh","jeddah":"jeddah",
  "munich":"munich","berlin":"berlin","brussels":"brussels","lisbon":"lisbon",
  "prague":"prague","budapest":"budapest","warsaw":"warsaw","stockholm":"stockholm",
  "oslo":"oslo","copenhagen":"copenhagen","helsinki":"helsinki",
};

const CITY_TO_IATA = {
  "bangalore":"BLR","mumbai":"BOM","delhi":"DEL","chennai":"MAA","hyderabad":"HYD",
  "kolkata":"CCU","goa":"GOI","pune":"PNQ","kochi":"COK","ahmedabad":"AMD","jaipur":"JAI",
  "lucknow":"LKO","varanasi":"VNS","patna":"PAT","chandigarh":"IXC","guwahati":"GAU",
  "bhubaneswar":"BBI","coimbatore":"CBE","madurai":"IXM","mangalore":"IXE","mysore":"MYQ",
  "surat":"STV","jodhpur":"JDH","udaipur":"UDR","amritsar":"ATQ","agra":"AGR",
  "indore":"IDR","raipur":"RPR","shimla":"SLV","dehradun":"DED","trivandrum":"TRV",
  "visakhapatnam":"VTZ","vijayawada":"VGA","ranchi":"IXR","bhopal":"BHO",
  "srinagar":"SXR","jammu":"IXJ","hubli":"HBX","belgaum":"IXG","tirupati":"TIR",
  "leh":"IXL","port blair":"IXZ","nagpur":"NAG","kozhikode":"CCJ","trichy":"TRZ",
  "dubai":"DXB","singapore":"SIN","bangkok":"BKK","london":"LHR","new york":"JFK",
  "kuala lumpur":"KUL","colombo":"CMB","paris":"CDG","tokyo":"NRT","sydney":"SYD",
  "frankfurt":"FRA","amsterdam":"AMS","toronto":"YYZ","los angeles":"LAX",
  "hong kong":"HKG","doha":"DOH","abu dhabi":"AUH","istanbul":"IST",
  "zurich":"ZRH","rome":"FCO","barcelona":"BCN","milan":"MXP",
  "johannesburg":"JNB","nairobi":"NBO","seoul":"ICN","manila":"MNL",
  "jakarta":"CGK","bali":"DPS","kathmandu":"KTM","dhaka":"DAC",
  "male":"MLE","phuket":"HKT","auckland":"AKL","melbourne":"MEL",
  "osaka":"KIX","beijing":"PEK","shanghai":"PVG","taipei":"TPE",
  "muscat":"MCT","riyadh":"RUH","jeddah":"JED","cairo":"CAI",
  "munich":"MUC","berlin":"BER","lisbon":"LIS","vienna":"VIE",
};

const INDIA_IATA = new Set([
  "BLR","BOM","DEL","MAA","HYD","CCU","GOI","PNQ","COK","AMD","JAI",
  "LKO","VNS","PAT","IXC","GAU","BBI","CBE","IXM","IXE","MYQ","TRV",
  "VTZ","VGA","IXR","BHO","SXR","IXJ","HBX","IXG","TIR","IXL","IXZ",
  "NAG","IDR","RPR","DED","SLV","ATQ","UDR","JDH","AGR","STV","CCJ","TRZ",
]);

// Airport lookup for Indian local areas
const LOCAL_AREA_TO_AIRPORT = {
  "attibele": { airport:"Kempegowda International Airport (BLR)", city:"bangalore", distance:"~45km", transport:"🚖 Cab ₹500–700 (45–60 min)\n🚌 BMTC bus to Silk Board → Vayu Vajra ₹250 (1.5h)\n💡 Avoid peak hours (8–10AM, 5–8PM on Hosur Road)" },
  "electronic city": { airport:"Kempegowda International Airport (BLR)", city:"bangalore", distance:"~40km", transport:"🚌 Vayu Vajra bus ₹270 (direct from E-City)\n🚖 Cab ₹500–800 (45–75 min)\n💡 Take Elevated Expressway — saves 20 mins!" },
  "whitefield": { airport:"Kempegowda International Airport (BLR)", city:"bangalore", distance:"~50km", transport:"🚇 Purple Line Metro → Vayu Vajra bus (cheapest)\n🚖 Cab ₹600–900 (1–1.5h)\n💡 Metro+bus combo saves ₹300–400 vs full cab" },
  "koramangala": { airport:"Kempegowda International Airport (BLR)", city:"bangalore", distance:"~35km", transport:"🚌 Vayu Vajra from Silk Board ₹270\n🚖 Cab ₹500–750 (45–70 min)\n💡 Book cab 30 min early during evenings" },
  "hsr layout": { airport:"Kempegowda International Airport (BLR)", city:"bangalore", distance:"~35km", transport:"🚌 Vayu Vajra from Silk Board ₹270\n🚖 Cab ₹500–700 (40–60 min)" },
  "marathahalli": { airport:"Kempegowda International Airport (BLR)", city:"bangalore", distance:"~38km", transport:"🚌 Vayu Vajra ₹270 (multiple routes)\n🚖 Cab ₹500–750 (40–65 min)" },
  "indiranagar": { airport:"Kempegowda International Airport (BLR)", city:"bangalore", distance:"~32km", transport:"🚇 Metro + Vayu Vajra (cheapest combo)\n🚌 Route 500D ₹270\n🚖 Cab ₹500–700" },
  "majestic": { airport:"Kempegowda International Airport (BLR)", city:"bangalore", distance:"~30km", transport:"🚌 Direct Vayu Vajra from KBS ₹250 (every 20 min)\n🚖 Cab ₹500–700\n⭐ Best option: Vayu Vajra — cheapest & dedicated airport bus!" },
  "hebbal": { airport:"Kempegowda International Airport (BLR)", city:"bangalore", distance:"~22km", transport:"🚖 Cab ₹300–500 (25–40 min — closest zone!)\n🚌 BMTC local buses\n💡 You're in the lucky zone — closest to airport!" },
  "yelahanka": { airport:"Kempegowda International Airport (BLR)", city:"bangalore", distance:"~15km", transport:"🚖 Cab ₹250–400 (20–30 min)\n💡 You're basically next door to the airport! 😄" },
  "bandra": { airport:"Chhatrapati Shivaji Airport (BOM)", city:"mumbai", distance:"~12km", transport:"🚖 Cab ₹300–500 (30–45 min)\n🚌 Bus + cab combo" },
  "andheri": { airport:"Chhatrapati Shivaji Airport (BOM)", city:"mumbai", distance:"~8km", transport:"🚇 Metro Line 1 + cab\n🚖 Cab ₹200–350 (20–30 min)\n💡 You're closest to T1 domestic terminal!" },
  "noida": { airport:"Indira Gandhi International Airport (DEL)", city:"delhi", distance:"~45km", transport:"🚖 Cab ₹600–900 (45–75 min)\n🚇 Metro (Blue Line → Airport Express) — cheapest!\n💡 Metro is fastest during peak hours" },
  "gurgaon": { airport:"Indira Gandhi International Airport (DEL)", city:"delhi", distance:"~15km", transport:"🚖 Cab ₹300–500 (20–35 min)\n🚇 Yellow Line → Airport Express at New Delhi\n💡 Direct cab is best from Gurgaon to airport" },
};

function extractCities(text) {
  let normalized = text.toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ").trim();

  // Remove noise words
  const noiseWords = ["flights","flight","buses","bus","hotels","hotel","trains","train",
    "book","booking","find","search","show","plan","trip","travel","to","from","going",
    "want","need","please","can","you","me","i","a","the","in","at","on","for",
    "mujhe","chahiye","please","kya","hai","se","ko","ka","ek","ticket",
    "enakku","vendum","naaku","kavali","cheap","cheapest","best","good","nice"];

  let cleaned = normalized;
  noiseWords.forEach(w => {
    cleaned = cleaned.replace(new RegExp(`\\b${w}\\b`, "g"), " ");
  });
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  let found = [];

  // Multi-word city match first (longest first)
  const multiWord = Object.keys(CITY_MAP).filter(k => k.includes(" ")).sort((a, b) => b.length - a.length);
  let remaining = cleaned;
  for (const key of multiWord) {
    if (remaining.includes(key) && found.length < 2) {
      found.push(CITY_MAP[key]);
      remaining = remaining.replace(key, " ");
    }
  }

  // Single word match
  const words = remaining.split(/[\s,\-\/→➡]+/);
  for (const word of words) {
    const w = word.replace(/[^a-z]/g, "").trim();
    if (w.length >= 2 && CITY_MAP[w] && found.length < 2 && !found.includes(CITY_MAP[w])) {
      found.push(CITY_MAP[w]);
    }
  }

  // Fuzzy match (first 4 chars) — handles typos
  if (found.length < 2) {
    for (const word of remaining.split(/\s+/)) {
      if (word.length < 3) continue;
      for (const key of Object.keys(CITY_MAP)) {
        if (key.length >= 4 && word.length >= 4 &&
            word.slice(0, 4) === key.slice(0, 4) &&
            !found.includes(CITY_MAP[key])) {
          found.push(CITY_MAP[key]);
          if (found.length === 2) break;
        }
      }
      if (found.length === 2) break;
    }
  }

  return { from: found[0] || null, to: found[1] || null };
}

function extractDate(text) {
  const t = text.toLowerCase();
  const now = new Date();

  if (/yesterday|kal ka|bita hua/.test(t)) return { date: null, pastDate: true };

  const months = {
    jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11,
    january:0,february:1,march:2,april:3,june:5,july:6,august:7,september:8,
    october:9,november:10,december:11
  };
  for (const [mon, idx] of Object.entries(months)) {
    const m = t.match(new RegExp(`(\\d{1,2})\\s*${mon}|${mon}\\s*(\\d{1,2})`));
    if (m) {
      const day = parseInt(m[1] || m[2]);
      const d = new Date(now.getFullYear(), idx, day);
      if (d < now) d.setFullYear(d.getFullYear() + 1);
      return { date: d, pastDate: false };
    }
  }

  if (/today|aaj|indru|ee roju/.test(t)) return { date: new Date(now), pastDate: false };
  if (/day after tomorrow|parso/.test(t)) { const d = new Date(now); d.setDate(d.getDate() + 2); return { date: d, pastDate: false }; }
  if (/tomorrow|kal|tmrw|nale|repu/.test(t)) { const d = new Date(now); d.setDate(d.getDate() + 1); return { date: d, pastDate: false }; }
  if (/this weekend|weekend/.test(t)) { const d = new Date(now); const diff = (6 - now.getDay() + 7) % 7 || 7; d.setDate(now.getDate() + diff); return { date: d, pastDate: false }; }

  const dayMap = {
    sun:0,sunday:0,mon:1,monday:1,tue:2,tuesday:2,wed:3,wednesday:3,
    thu:4,thursday:4,fri:5,friday:5,sat:6,saturday:6,
  };
  for (const [day, idx] of Object.entries(dayMap)) {
    if (t.includes(day)) {
      const d = new Date(now);
      let diff = idx - now.getDay();
      if (/next|agla/.test(t)) { if (diff <= 0) diff += 7; if (diff < 7) diff += 7; }
      else { if (diff <= 0) diff += 7; }
      d.setDate(now.getDate() + diff);
      return { date: d, pastDate: false };
    }
  }

  const inDays = t.match(/in\s*(\d+)\s*(days?|din)/);
  if (inDays) { const d = new Date(now); d.setDate(now.getDate() + parseInt(inDays[1])); return { date: d, pastDate: false }; }

  return { date: null, pastDate: false };
}

function extractBudget(text) {
  const t = text.toLowerCase();
  const patterns = [
    /under\s*[₹rs.]*\s*(\d+)k?/,/below\s*[₹rs.]*\s*(\d+)k?/,
    /less\s*than\s*[₹rs.]*\s*(\d+)k?/,/max\s*[₹rs.]*\s*(\d+)k?/,
    /[₹rs.]*\s*(\d+)k?\s*(se\s*)?kam/,/within\s*[₹rs.]*\s*(\d+)k?/,
    /budget.*?[₹rs.]*\s*(\d+)k?/,
  ];
  for (const p of patterns) {
    const m = t.match(p);
    if (m) {
      let v = parseInt(m[1]);
      if (t.match(/\d+k\b/)) v *= 1000;
      return v;
    }
  }
  return null;
}

const fmt = d => d.toISOString().split("T")[0];

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
//  TRACKING
// ══════════════════════════════════════════════════════════════
app.post("/track", async (req, res) => {
  const { event_type, details, source } = req.body;
  const token = req.headers["authorization"]?.split(" ")[1];
  let userId = null;
  if (token) { try { const d = jwt.verify(token, process.env.JWT_SECRET || "secretkey"); userId = d.id; } catch {} }
  await logEvent(event_type, details, source || "web", userId);
  res.json({ ok: true });
});

app.get("/admin/events", async (req, res) => {
  try { const r = await pool.query("SELECT * FROM events ORDER BY created_at DESC LIMIT 200"); res.json(r.rows); }
  catch { res.json([]); }
});

// ══════════════════════════════════════════════════════════════
//  USERS
// ══════════════════════════════════════════════════════════════
function generateUserRefCode(name) {
  const base = (name || "user").replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
  return base + Math.random().toString(36).slice(2, 6).toUpperCase();
}

app.get("/users", async (req, res) => {
  try { const r = await pool.query("SELECT id,name,email FROM users"); res.json(r.rows); }
  catch (e) { res.status(500).send("Server Error"); }
});

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
            <div style="background:rgba(201,168,76,0.1);border-radius:12px;padding:16px;margin-bottom:20px;">
              <p style="margin:0;color:#8B6914;font-size:11px;margin-bottom:6px;">YOUR REFERRAL CODE</p>
              <p style="margin:0;font-size:22px;font-weight:900;color:#8B6914;letter-spacing:4px;">${refCode}</p>
            </div>
          </div>
        </div>`
      });
    } catch (e) { console.error("Welcome email:", e.message); }
    res.json({ message: "Registered successfully", refCode });
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ message: "Email already registered" });
    res.status(500).json({ message: "Registration failed" });
  }
});

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
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, refCode: user.ref_code, walletBalance: user.wallet_balance || 0 } });
  } catch (e) { res.status(500).json({ message: "Login failed" }); }
});

app.get("/profile", authenticateToken, async (req, res) => {
  try {
    const r = await pool.query("SELECT id,name,email,phone,ref_code,wallet_balance,referred_by FROM users WHERE id=$1", [req.user.id]);
    res.json(r.rows[0] || {});
  } catch { res.status(500).json({ message: "Server error" }); }
});

app.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    await pool.query("UPDATE users SET name=$1,email=$2,phone=$3 WHERE id=$4", [name, email, phone || null, req.user.id]);
    res.json({ message: "Profile updated" });
  } catch (e) {
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
    if (to) { q += ` AND LOWER(to_city)=LOWER($${c++})`; v.push(to); }
    if (date) { q += ` AND DATE(departure_time)=$${c++}`; v.push(date); }
    q += " ORDER BY price ASC";
    const r = await pool.query(q, v);
    await logEvent("flight_search", `${from || "?"} → ${to || "?"} on ${date || "any"}`, "web");
    res.json(r.rows);
  } catch { res.status(500).send("Server Error"); }
});

app.post("/ai-search", async (req, res) => {
  try {
    const rawQuery = req.body.query || "";
    const { from, to } = extractCities(rawQuery);
    if (!from || !to) return res.status(400).json({ message: "Couldn't detect cities. Try: 'flights bangalore to mumbai tomorrow'" });
    const { date: targetDate, pastDate } = extractDate(rawQuery);
    if (pastDate) return res.status(400).json({ message: "That date is in the past! Please pick today or a future date." });
    const budget = extractBudget(rawQuery);
    const isCheap = /cheap|budget|lowest|sasta|affordable/i.test(rawQuery);
    let q = `SELECT * FROM flights WHERE LOWER(from_city)=$1 AND LOWER(to_city)=$2`;
    let v = [from, to];
    if (targetDate) { q += ` AND DATE(departure_time)=$3`; v.push(fmt(targetDate)); }
    if (budget) { q += ` AND price <= $${v.length + 1}`; v.push(budget); }
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
//  PROMO / WALLET / BOOKING
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

app.get("/wallet", authenticateToken, async (req, res) => {
  try {
    const r = await pool.query("SELECT wallet_balance FROM users WHERE id=$1", [req.user.id]);
    res.json({ balance: r.rows[0]?.wallet_balance || 0 });
  } catch { res.json({ balance: 0 }); }
});

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
      walletUsed = Math.min(wr.rows[0].wallet_balance || 0, final_price || flight.rows[0].price);
      if (walletUsed > 0) await client.query("UPDATE users SET wallet_balance=wallet_balance-$1 WHERE id=$2", [walletUsed, user_id]);
    }
    if (promo_code) await client.query("UPDATE promo_codes SET used_count=used_count+1 WHERE UPPER(code)=UPPER($1)", [promo_code]);
    const bookingId = "ALV" + Date.now().toString(36).toUpperCase().slice(-6);
    const f = flight.rows[0];
    const actualFinal = (final_price || f.price) - walletUsed;
    await client.query(
      `INSERT INTO bookings (flight_id,passenger_name,user_id,seats,promo_code,discount_applied,final_price,cabin_class,flight_no,airline)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [flight_id, passenger_name, user_id, seats ? seats.join(",") : null, promo_code || null,
       (discount_applied || 0) + walletUsed, actualFinal, cabin_class || "Economy", f.flight_no, f.airline]
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
    await logEvent("booking", `${f.from_city} → ${f.to_city} ₹${actualFinal}`, "web", user_id);
    res.json({ message: "Booking confirmed!", bookingId, walletUsed });
  } catch (e) { await client.query("ROLLBACK"); res.status(500).send("Server Error"); }
  finally { client.release(); }
});

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

app.get("/real-flights", async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ message: "Provide from and to" });
    const fromCode = CITY_TO_IATA[from.toLowerCase()] || from.toUpperCase().slice(0, 3);
    const toCode = CITY_TO_IATA[to.toLowerCase()] || to.toUpperCase().slice(0, 3);
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
      const price = Math.floor(Math.random() * 8000) + 2000;
      const ex = await pool.query("SELECT * FROM flights WHERE flight_no=$1 AND departure_time=$2", [flightNo, dep]);
      if (ex.rows.length) saved.push(ex.rows[0]);
      else {
        const ins = await pool.query("INSERT INTO flights (airline,flight_no,from_city,to_city,departure_time,arrival_time,price,seats_available) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
          [airline, flightNo, from, to, dep, arr, price, 50]);
        saved.push(ins.rows[0]);
      }
    }
    res.json(saved);
  } catch (e) {
    const { from, to } = req.query;
    const db = await pool.query("SELECT * FROM flights WHERE LOWER(from_city)=LOWER($1) AND LOWER(to_city)=LOWER($2) ORDER BY price ASC", [from, to]);
    res.json(db.rows);
  }
});

app.get("/test", (req, res) => res.send("Alvryn backend alive ✈"));

// ══════════════════════════════════════════════════════════════
//  USER PREFERENCES / MEMORY
// ══════════════════════════════════════════════════════════════
async function ensureUserPrefsTable() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS user_preferences (
      id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL,
      pref_key VARCHAR(80) NOT NULL, pref_value TEXT,
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, pref_key)
    )`);
  } catch (e) { console.error("user_prefs table:", e.message); }
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
    await pool.query(
      `INSERT INTO user_preferences (user_id, pref_key, pref_value, updated_at)
       VALUES ($1,$2,$3,NOW()) ON CONFLICT (user_id, pref_key)
       DO UPDATE SET pref_value=$3, updated_at=NOW()`,
      [userId, key, String(value)]
    );
  } catch {}
}

async function updateUserMemory(userId, message) {
  if (!userId) return;
  const m = message.toLowerCase();
  const budget = extractBudget(message);
  if (budget) await setUserPref(userId, "typical_budget", String(budget));
  const { from, to } = extractCities(message);
  if (from) await setUserPref(userId, "home_city", from);
  if (/indigo|air india|spicejet|vistara|akasa/i.test(m)) {
    const airline = m.match(/indigo|air india|spicejet|vistara|akasa/i)?.[0];
    if (airline) await setUserPref(userId, "preferred_airline", airline);
  }
  if (/solo|alone/i.test(m)) await setUserPref(userId, "travel_style", "solo");
  if (/family|kids|children/i.test(m)) await setUserPref(userId, "travel_style", "family");
  if (/couple|honeymoon|wife|husband|partner/i.test(m)) await setUserPref(userId, "travel_style", "couple");
  const count = parseInt((await getUserPrefs(userId)).search_count || "0") + 1;
  await setUserPref(userId, "search_count", String(count));
  await setUserPref(userId, "last_active", new Date().toISOString().split("T")[0]);
}

// ══════════════════════════════════════════════════════════════
//  CHAT HISTORY
// ══════════════════════════════════════════════════════════════
async function ensureChatsTable() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS user_chats (
      id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      chat_id VARCHAR(64) NOT NULL, title VARCHAR(200) DEFAULT 'New chat',
      messages JSONB DEFAULT '[]', created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(), UNIQUE(user_id, chat_id)
    )`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_chats_user ON user_chats(user_id)`);
  } catch (e) { console.error("user_chats table:", e.message); }
}
ensureChatsTable().catch(console.error);

app.get("/chats", authenticateToken, async (req, res) => {
  try {
    const r = await pool.query(
      "SELECT chat_id, title, messages, created_at, updated_at FROM user_chats WHERE user_id=$1 ORDER BY updated_at DESC LIMIT 50",
      [req.user.id]
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: "Error loading chats" }); }
});

app.post("/chats/:chatId", authenticateToken, async (req, res) => {
  try {
    const { title, messages } = req.body;
    const { chatId } = req.params;
    await pool.query(`
      INSERT INTO user_chats (user_id, chat_id, title, messages, updated_at)
      VALUES ($1,$2,$3,$4,NOW()) ON CONFLICT (user_id, chat_id)
      DO UPDATE SET title=$3, messages=$4, updated_at=NOW()
    `, [req.user.id, chatId, title || "New chat", JSON.stringify(messages || [])]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: "Error saving chat" }); }
});

app.delete("/chats/:chatId", authenticateToken, async (req, res) => {
  try {
    await pool.query("DELETE FROM user_chats WHERE user_id=$1 AND chat_id=$2", [req.user.id, req.params.chatId]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: "Error deleting chat" }); }
});

// ══════════════════════════════════════════════════════════════
//  PRICE ALERTS
// ══════════════════════════════════════════════════════════════
async function ensurePriceAlertsTable() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS price_alerts (
      id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL,
      from_city VARCHAR(80), to_city VARCHAR(80),
      current_price INTEGER, target_price INTEGER,
      email VARCHAR(200), notified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
  } catch (e) {}
}
ensurePriceAlertsTable().catch(console.error);

app.post("/price-alert", authenticateToken, async (req, res) => {
  try {
    const { from_city, to_city, current_price, target_price } = req.body;
    const userResult = await pool.query("SELECT email FROM users WHERE id=$1", [req.user.id]);
    const email = userResult.rows[0]?.email;
    await pool.query(
      "INSERT INTO price_alerts (user_id,from_city,to_city,current_price,target_price,email) VALUES ($1,$2,$3,$4,$5,$6)",
      [req.user.id, from_city, to_city, current_price || null, target_price || null, email]
    );
    res.json({ ok: true, message: `Price alert set! We'll notify you at ${email} when prices drop.` });
  } catch (e) { res.status(500).json({ message: "Error setting alert" }); }
});

// ══════════════════════════════════════════════════════════════
//  WAITLIST
// ══════════════════════════════════════════════════════════════
async function ensureWaitlistTable() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS waitlist (
      id SERIAL PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255), source VARCHAR(60) DEFAULT 'web',
      created_at TIMESTAMP DEFAULT NOW()
    )`);
  } catch (e) {}
}
ensureWaitlistTable().catch(console.error);

app.post("/waitlist", async (req, res) => {
  try {
    const { email, name, source } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });
    await pool.query(
      "INSERT INTO waitlist (email, name, source) VALUES ($1,$2,$3) ON CONFLICT (email) DO NOTHING",
      [email.trim().toLowerCase(), name || "", source || "web"]
    );
    res.json({ message: "Added to waitlist!" });
  } catch (e) { res.status(500).json({ message: "Server error" }); }
});

// ══════════════════════════════════════════════════════════════
//  GROQ AI CALL
// ══════════════════════════════════════════════════════════════
async function callGroq(prompt, systemMsg, maxTokens = 400) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemMsg },
          { role: "user", content: prompt }
        ],
        max_tokens: maxTokens, temperature: 0.8,
      })
    });
    const d = await res.json();
    return d.choices?.[0]?.message?.content || null;
  } catch (e) { console.log("[Groq error]", e.message); return null; }
}

// GPT-4o-mini slot — ready for when key is added
async function callGPT(prompt, systemMsg, maxTokens = 500) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemMsg },
          { role: "user", content: prompt }
        ],
        max_tokens: maxTokens, temperature: 0.8,
      })
    });
    const d = await res.json();
    return d.choices?.[0]?.message?.content || null;
  } catch (e) { return null; }
}

// ══════════════════════════════════════════════════════════════
//  ALVRYN AI PERSONALITY SYSTEM PROMPT
// ══════════════════════════════════════════════════════════════
function buildSystemPrompt(userName, prefs, tier = "groq") {
  const name = userName ? userName.split(" ")[0] : "there";
  const greeting = getISTGreeting();
  const homeCity = prefs.home_city || null;
  const budget = prefs.typical_budget || null;
  const travelStyle = prefs.travel_style || null;
  const searchCount = parseInt(prefs.search_count || "0");
  const prefAirline = prefs.preferred_airline || null;

  const personalContext = [
    homeCity ? `User's home city: ${homeCity}` : "",
    budget ? `User's typical budget: ₹${parseInt(budget).toLocaleString()}` : "",
    travelStyle ? `Travel style: ${travelStyle}` : "",
    prefAirline ? `Preferred airline: ${prefAirline}` : "",
    searchCount > 0 ? `Returning user with ${searchCount} previous searches` : "New user",
  ].filter(Boolean).join(". ");

  return `You are Alvryn AI — the world's most helpful, funny, and smart travel companion.

PERSONALITY:
- You are like a well-traveled best friend who knows everything about travel worldwide
- Friendly, warm, slightly funny — but never cringe. Light humor, occasional gentle teasing
- Never robotic. Never formal. Talk like a real person
- Use emojis naturally — not every sentence, just where it feels right
- If user makes a typo or spelling mistake, understand what they mean and answer correctly WITHOUT mentioning their typo
- NEVER mention competitor travel platforms or booking sites by name
- NEVER hallucinate cities or destinations — only answer about what the user actually asked

USER CONTEXT:
- Name: ${name}
- Current IST time: ${greeting}
- ${personalContext || "New user, no preferences saved yet"}

GREETING RULES:
- If this is the first message, greet with: "${greeting}, ${name}! 👋"
- Use their actual name — never say "there" or "friend"
- If returning user (search count > 3), reference something from their history

CORE CAPABILITIES:
1. Complete door-to-door trip planning (home → airport → destination airport → hotel → activities)
2. Flight search and recommendations
3. Bus routes across India
4. Hotel recommendations worldwide
5. Train booking guidance (IRCTC)
6. Local transport advice (autos, cabs, metro)
7. Visa and travel document guidance
8. Budget planning and optimization
9. Best time to visit destinations
10. Weather and seasonal advice
11. Food and cultural tips

DOOR-TO-DOOR PLANNING (section by section):
When user asks to plan a trip, ask for their EXACT home location (area/locality, not just city).
Then plan section by section:
- Section 1: Home → Airport (exact transport, cost, time)
- Section 2: Flights (best options with approximate prices)
- Section 3: Destination airport → Hotel (transport options)
- Section 4: Hotels (budget-appropriate recommendations)
- Section 5: Activities and itinerary
- Section 6: Budget breakdown + checklist

IMPORTANT RULES:
- NEVER confuse cities. Varkala is in Kerala. Varanasi is in UP. These are completely different.
- If user says a place you don't recognize, ask for clarification politely
- For local areas (like Attibele, Whitefield, Koramangala), know they are suburbs and identify nearest airport
- Keep responses SHORT and scannable — use bullet points, not walls of text
- End with ONE clear next question or action to keep conversation moving
- ${tier === "gpt" ? "This is an advanced query — give full detailed response" : "Keep response concise and actionable"}`;
}

// ══════════════════════════════════════════════════════════════
//  TIER 1: INSTANT STORED RESPONSES (unlimited, no API)
// ══════════════════════════════════════════════════════════════
function buildAffiliateFlightLink(from, to, ddmm = "", pax = 1) {
  const fc = CITY_TO_IATA[from?.toLowerCase()] || from?.slice(0, 3).toUpperCase() || "BLR";
  const tc = CITY_TO_IATA[to?.toLowerCase()] || to?.slice(0, 3).toUpperCase() || "BOM";
  const isIndia = INDIA_IATA.has(fc) && INDIA_IATA.has(tc);
  const base = isIndia ? "https://www.aviasales.in" : "https://www.aviasales.com";
  return `${base}/search/${fc}${ddmm}${tc}${pax}?marker=714667&sub_id=alvryn_ai`;
}

function buildBusLink(from, to) {
  return `https://www.redbus.in/bus-tickets/${(from || "").replace(/\s+/g, "-")}-to-${(to || "").replace(/\s+/g, "-")}`;
}

function buildTrainLink(from, to, dateStr) {
  const TC = {
    "bangalore":"SBC","bengaluru":"SBC","mumbai":"CSTM","delhi":"NDLS","new delhi":"NDLS",
    "chennai":"MAS","hyderabad":"SC","kolkata":"HWH","pune":"PUNE","kochi":"ERS",
    "jaipur":"JP","varanasi":"BSB","trivandrum":"TVC","coimbatore":"CBE","madurai":"MDU",
    "mysore":"MYS","nagpur":"NGP","bhopal":"BPL","patna":"PNBE","lucknow":"LKO",
    "agra":"AGC","amritsar":"ASR","chandigarh":"CDG","guwahati":"GHY","ranchi":"RNC",
    "visakhapatnam":"VSKP","vijayawada":"BZA","hubli":"UBL","mangalore":"MAQ",
    "surat":"ST","ahmedabad":"ADI","indore":"INDB","dehradun":"DDN",
  };
  const fc = TC[from?.toLowerCase()] || (from || "").slice(0, 4).toUpperCase();
  const tc = TC[to?.toLowerCase()] || (to || "").slice(0, 4).toUpperCase();
  let dateParam = "";
  if (dateStr) {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d)) {
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = d.getFullYear();
        dateParam = `&journeyDate=${dd}-${mm}-${yyyy}`;
      }
    } catch {}
  }
  return `https://www.irctc.co.in/nget/train-search?fromStation=${fc}&toStation=${tc}&isCallFromDpDown=true${dateParam}&quota=GN&class=SL`;
}

const BUS_DB = [
  {from:"bangalore",to:"chennai",dep:"06:00",arr:"11:30",price:650,type:"AC Sleeper",op:"VRL Travels"},
  {from:"bangalore",to:"chennai",dep:"21:00",arr:"02:30",price:550,type:"Semi-Sleeper",op:"KSRTC"},
  {from:"bangalore",to:"hyderabad",dep:"20:00",arr:"04:00",price:800,type:"AC Sleeper",op:"SRS Travels"},
  {from:"bangalore",to:"goa",dep:"21:30",arr:"06:30",price:900,type:"AC Sleeper",op:"Neeta Tours"},
  {from:"bangalore",to:"mumbai",dep:"17:00",arr:"09:00",price:1400,type:"AC Sleeper",op:"VRL Travels"},
  {from:"bangalore",to:"pune",dep:"18:00",arr:"08:00",price:1200,type:"AC Sleeper",op:"Paulo Travels"},
  {from:"bangalore",to:"coimbatore",dep:"07:00",arr:"11:00",price:400,type:"AC Seater",op:"KSRTC"},
  {from:"bangalore",to:"mangalore",dep:"22:00",arr:"05:00",price:700,type:"AC Sleeper",op:"VRL Travels"},
  {from:"bangalore",to:"mysore",dep:"07:00",arr:"10:00",price:250,type:"AC Seater",op:"KSRTC"},
  {from:"bangalore",to:"kochi",dep:"21:00",arr:"07:00",price:950,type:"AC Sleeper",op:"KSRTC"},
  {from:"bangalore",to:"trivandrum",dep:"20:30",arr:"07:30",price:1100,type:"AC Sleeper",op:"KSRTC"},
  {from:"bangalore",to:"madurai",dep:"21:00",arr:"05:00",price:750,type:"AC Sleeper",op:"Parveen Travels"},
  {from:"chennai",to:"hyderabad",dep:"21:00",arr:"04:00",price:750,type:"AC Sleeper",op:"TSRTC"},
  {from:"chennai",to:"bangalore",dep:"07:00",arr:"12:30",price:630,type:"AC Sleeper",op:"VRL Travels"},
  {from:"hyderabad",to:"bangalore",dep:"21:00",arr:"05:00",price:800,type:"AC Sleeper",op:"Orange Travels"},
  {from:"hyderabad",to:"mumbai",dep:"18:00",arr:"06:00",price:1100,type:"AC Sleeper",op:"VRL Travels"},
  {from:"mumbai",to:"pune",dep:"07:00",arr:"10:00",price:300,type:"AC Seater",op:"MSRTC"},
  {from:"mumbai",to:"goa",dep:"22:00",arr:"08:00",price:950,type:"AC Sleeper",op:"Paulo Travels"},
  {from:"delhi",to:"jaipur",dep:"06:00",arr:"11:00",price:500,type:"AC Seater",op:"RSRTC"},
  {from:"delhi",to:"agra",dep:"07:00",arr:"11:00",price:400,type:"AC Seater",op:"UP Roadways"},
  {from:"delhi",to:"chandigarh",dep:"08:00",arr:"12:00",price:450,type:"AC Seater",op:"HRTC"},
  {from:"delhi",to:"lucknow",dep:"22:00",arr:"05:00",price:700,type:"AC Sleeper",op:"UP SRTC"},
  {from:"kolkata",to:"bhubaneswar",dep:"21:00",arr:"03:00",price:600,type:"AC Sleeper",op:"OSRTC"},
];

const HOTEL_PRICES = {
  "goa":"800–3,500","mumbai":"1,200–5,000","delhi":"900–4,200","bangalore":"800–3,800",
  "jaipur":"700–3,000","kochi":"600–2,500","udaipur":"900–4,000","manali":"500–2,200",
  "shimla":"600–2,500","ooty":"500–2,000","coorg":"700–3,000","pondicherry":"600–2,500",
  "mysore":"500–2,000","hyderabad":"800–3,500","chennai":"800–3,200","kolkata":"700–3,000",
  "agra":"700–3,000","varanasi":"600–2,800","amritsar":"600–2,500","lucknow":"700–3,000",
  "trivandrum":"600–2,500","varkala":"800–3,000","alleppey":"1,000–5,000","munnar":"800–3,500",
  "coimbatore":"500–2,000","madurai":"600–2,200","dubai":"3,000–12,000",
  "singapore":"4,000–15,000","bangkok":"2,500–10,000","tokyo":"5,000–18,000",
  "london":"8,000–25,000","new york":"10,000–30,000","bali":"1,500–8,000",
  "paris":"7,000–22,000","sydney":"6,000–20,000","kuala lumpur":"2,000–8,000",
};

// Detect if query is easy (stored data) / medium (Groq) / hard (GPT)
function classifyQuery(msg, prefs) {
  const m = msg.toLowerCase();
  const { from, to } = extractCities(msg);
  const hasRoute = !!(from && to);

  // EASY — answer from stored data, NO API needed
  const isGreeting = /^(hi+|hello+|hey+|hlo+|heyy*|namaste|hai|sup|yo|good morning|good afternoon|good evening|goodmorning|goodafternoon|goodevening)/.test(m) || m.length <= 8;
  const isAbout = /what.*alvryn|who.*are.*you|how.*work|is.*free|what.*do.*you|tell.*about/.test(m);
  const isThanks = /^(thank|thanks|thx|ty|great|nice|awesome|perfect|ok|okay|cool|wow|good|super|excellent)/.test(m);
  const isBaggage = /baggage|luggage|kg.*allow|cabin.*bag/.test(m);
  const isVisa = /visa|passport|document.*travel|travel.*document/.test(m);
  const isBestTime = /best.*time|best.*season|best.*month|when.*visit|when.*travel/.test(m);
  const isRefund = /refund|cancel|reschedule|change.*ticket/.test(m);
  const isTravelTip = /travel.*tip|packing.*list|how.*save.*money.*travel/.test(m);
  const isPnr = /pnr|train.*status|running.*status/.test(m);
  const isTatkal = /tatkal|urgent.*ticket/.test(m);
  const isLocalTransport = /vayu vajra|bmtc|namma metro|auto.*fare|metro.*route|bus.*number|how.*reach.*airport|airport.*reach/.test(m);

  if (isGreeting || isAbout || isThanks || isBaggage || isVisa ||
      isBestTime || isRefund || isTravelTip || isPnr || isTatkal || isLocalTransport) {
    return "easy";
  }

  // EASY with route — bus/flight/hotel DB lookup
  if (hasRoute) return "medium";

  // HARD — needs AI reasoning
  const isComplexTrip = /plan.*trip|trip.*plan|itinerary|full.*trip|complete.*trip|door.*to.*door|from.*home.*to|a to z/i.test(m);
  const isHoneymoon = /honeymoon|romantic.*trip|anniversary.*trip/.test(m);
  const isBudgetCombo = /total.*cost|budget.*trip|how.*much.*trip|estimate.*trip/.test(m);
  const isCompareDest = /which.*better|compare.*destination|suggest.*place|where.*should.*go/.test(m);

  if (isComplexTrip || isHoneymoon || isBudgetCombo || isCompareDest) return "hard";

  return "medium";
}

// Tier 1: Instant stored responses
function easyResponse(msg, userName, prefs) {
  const m = msg.toLowerCase().trim();
  const greeting = getISTGreeting();
  const name = userName ? userName.split(" ")[0] : "there";
  const searchCount = parseInt(prefs.search_count || "0");
  const homeCity = prefs.home_city;
  const prefAirline = prefs.preferred_airline;
  const travelStyle = prefs.travel_style;
  const budget = prefs.typical_budget;

  const { from, to } = extractCities(msg);
  const isBusQ = /\bbus\b|buses|coach|sleeper|seater|ksrtc|msrtc|redbus/i.test(m);
  const isHotelQ = /hotel|stay|room|accommodation|resort/i.test(m);
  const isTrainQ = /\btrain\b|railway|irctc|express/i.test(m);

  // GREETING — with name and personalization
  if (/^(hi+|hello+|hey+|hlo+|heyy*|namaste|hai|sup|yo|good morning|good afternoon|good evening|goodmorning|goodafternoon|goodevening)/.test(m) || m.length <= 8) {
    let greetMsg = "";

    if (searchCount >= 5) {
      // Returning power user
      const hints = [
        homeCity ? `Still planning from ${homeCity}? 😄` : "",
        prefAirline ? `I remember you like ${prefAirline}!` : "",
        budget ? `Budget around ₹${parseInt(budget).toLocaleString()} as always?` : "",
        travelStyle === "solo" ? "Solo traveler mode activated! 🎒" : "",
        travelStyle === "family" ? "Family trip incoming? 👨‍👩‍👧" : "",
      ].filter(Boolean);
      greetMsg = `${greeting}, ${name}! 👋 Welcome back to Alvryn!\n\n${hints.length ? hints[0] + " " : ""}Where are we going this time? ✈️\n\n_Quick shortcuts:_\n• "flights [city] to [city]"\n• "plan my trip to [destination]"\n• "bus [city] to [city] tonight"`;
    } else if (searchCount >= 2) {
      greetMsg = `Hey ${name}! 👋 Good to have you back!\n\nReady for your next adventure? Just tell me where you want to go and I'll plan everything — flights, buses, hotels, the whole deal! 🌍`;
    } else {
      // New user — proper intro
      greetMsg = `${greeting}, ${name}! 👋 Welcome to Alvryn — your AI travel companion!\n\nThink of me as that one friend who's been *everywhere* and actually remembers prices 😄\n\nHere's what I can do:\n✈️ **Flights** — worldwide, best fares\n🚌 **Buses** — all major India routes\n🏨 **Hotels** — budget to luxury\n🚂 **Trains** — IRCTC pre-filled\n🗺️ **Complete trip planning** — door to door, section by section\n\nSo... where are we going? 🌍`;
    }
    return { text: greetMsg, cards: [], cta: null };
  }

  // ABOUT ALVRYN
  if (/what.*alvryn|who.*are.*you|how.*work|is.*free|what.*do.*you/.test(m)) {
    return {
      text: `Alvryn is your AI-powered travel companion — think of it as having a travel agent friend who never sleeps and actually knows what they're talking about 😄\n\n**How it works:**\n1️⃣ You tell me where you want to go\n2️⃣ I search across flights, buses, hotels and trains\n3️⃣ I show you the best options — sorted by price and value\n4️⃣ You tap to book on our trusted partner site\n\n**Why Alvryn?**\n✅ Completely free to use\n✅ Understands any language, typos, mixed language\n✅ Plans complete door-to-door trips\n✅ Remembers your preferences\n\nAlvryn earns a small commission from partner sites when you book — at zero extra cost to you. 🙏`,
      cards: [], cta: null
    };
  }

  // THANKS
  if (/^(thank|thanks|thx|ty|great|nice|awesome|perfect|ok|okay|cool|wow|amazing|super|excellent)/.test(m)) {
    return {
      text: `You're welcome, ${name}! 😊 Anything else? I can help with:\n• More flight/bus/hotel searches\n• Trip planning and budgeting\n• Travel tips for your destination\n\nJust ask! ✈️`,
      cards: [], cta: null
    };
  }

  // BAGGAGE
  if (/baggage|luggage|kg.*allow|cabin.*bag|check.?in.*bag/.test(m)) {
    return {
      text: `🧳 **Baggage allowance guide:**\n\n**Domestic India:**\n• **IndiGo:** 7kg cabin + 15kg checked\n• **Air India:** 7kg cabin + 15–25kg checked\n• **SpiceJet:** 7kg cabin + 15kg checked\n• **Vistara:** 7kg cabin + 15–20kg checked\n• **Akasa:** 7kg cabin + 15kg checked\n\n**Pro tip:** Book extra baggage *online* when you buy tickets — it's 50–70% cheaper than paying at the airport. Seriously, don't forget this 😄\n\nFor international routes, allowances vary — always check your specific flight booking.`,
      cards: [], cta: null
    };
  }

  // VISA
  if (/visa|passport|document.*travel/.test(m)) {
    return {
      text: `📄 **Visa & Travel Documents:**\n\n**For International Travel (Indian passport):**\n✅ Passport valid 6+ months beyond return\n✅ Visa for destination country\n✅ Return ticket + hotel booking\n\n**Visa-free / Visa on Arrival for Indians:**\n🇹🇭 Thailand — 30 days free\n🇮🇩 Bali — $35 on arrival\n🇳🇵 Nepal — no visa!\n🇱🇰 Sri Lanka — e-visa\n🇲🇻 Maldives — free on arrival\n🇲🇾 Malaysia — 30 days free\n🇸🇬 Singapore — e-visa (usually quick)\n🇦🇪 Dubai — visa through airline (easy)\n\n**Domestic India travel:** Just carry Aadhaar/PAN — no visa needed anywhere in India!\n\nNeed visa info for a specific country? Just ask! 🌍`,
      cards: [], cta: null
    };
  }

  // BEST TIME TO VISIT
  if (/best.*time|best.*season|when.*visit|when.*travel/.test(m)) {
    const dest = to || from || "";
    const BTG = {
      "goa": "October to March 🌞 (avoid June–September monsoon — beaches close)",
      "kerala": "September to March 🌴 (backwaters & beaches at their best)",
      "varkala": "October to March 🌊 (perfect waves and sunny weather)",
      "munnar": "September to May 🍵 (monsoon July–August is actually beautiful too!)",
      "manali": "March–June for adventure 🏔️, December–February for snow ❄️",
      "shimla": "March–June and September–November 🏔️",
      "leh": "June to September ONLY 🏔️ (roads closed in winter — not joking!)",
      "rajasthan": "October to March 🏰 (avoid summer — it hits 48°C, brutal)",
      "jaipur": "October to March 🏯 (perfect weather for sightseeing)",
      "ooty": "April to June and September–November 🍃",
      "bangalore": "Year-round! 😄 It's basically perfect climate all the time",
      "dubai": "October to April 🌞 (summer is 45°C+ — not fun)",
      "singapore": "Year-round! Light preference for February–April 🇸🇬",
      "thailand": "November to April 🌺 (dry season — best beaches)",
      "bali": "April to October 🏝️ (dry season — amazing)",
      "tokyo": "March–May (cherry blossoms 🌸) or October–November (autumn 🍂)",
      "london": "June to August ☀️ (finally gets warm!)",
      "paris": "April to October 🗼 (spring and summer are magical)",
      "default": "October to March is generally best for most Indian destinations! 🌟"
    };
    const answer = BTG[dest.toLowerCase()] || BTG["default"];
    return {
      text: `📅 **Best time to visit ${dest ? dest.charAt(0).toUpperCase() + dest.slice(1) : "your destination"}:**\n\n${answer}\n\nWant me to search flights or plan a trip for that time? Just say when! ✈️`,
      cards: [], cta: null
    };
  }

  // CANCELLATION
  if (/refund|cancel|reschedule|change.*ticket/.test(m)) {
    return {
      text: `❌ **Cancellation & Refunds:**\n\nAlvryn is a search and discovery platform — bookings happen on partner sites. Cancellation policies are managed by the respective airline/operator.\n\n**Flights (general):**\n• Usually ₹3,000–4,500 cancellation fee for domestic\n• Non-refundable fares = no refund (check before booking!)\n• Cancel 7+ days early = better refund\n\n**Buses (via operators):**\n• 4+ hours before = 75–90% refund\n• 1–4 hours = 50% refund\n• Under 1 hour = no refund\n\n**Trains (IRCTC):**\n• Cancel on irctc.co.in before departure\n• Tatkal tickets = no refund\n• Refund depends on class and timing\n\n💡 Always read cancellation policy before confirming any booking!`,
      cards: [], cta: null
    };
  }

  // PNR STATUS
  if (/pnr|train.*status|running.*status/.test(m)) {
    return {
      text: `🚂 **Check PNR & Train Status:**\n\n• **Fastest way:** Google your PNR number directly — Google shows it instantly!\n• **IRCTC app:** My Bookings section\n• **SMS:** PNR [10-digit number] to 139\n• **Live status:** ntes.indianrail.gov.in\n• **Helpline:** 139 (Railway enquiry)\n\n💡 Google is genuinely the fastest — just type your 10-digit PNR! 😄`,
      cards: [], cta: null
    };
  }

  // TATKAL
  if (/tatkal|urgent.*ticket/.test(m)) {
    return {
      text: `⚡ **Tatkal Booking Guide:**\n\n**Opens:** 1 day before journey\n• AC classes (1A, 2A, 3A): **10:00 AM sharp**\n• Non-AC (Sleeper): **11:00 AM sharp**\n\n**Tatkal charges (extra over base fare):**\n• Sleeper: ₹100–200 extra\n• 3AC: ₹300–400 extra\n• 2AC: ₹400–500 extra\n\n**Tips to actually get it:**\n1. Be on IRCTC at 9:55 AM (don't wait for 10:00!)\n2. Pre-fill all passenger details\n3. Keep UPI/card ready — UPI is fastest\n4. IRCTC crashes at 10 AM — keep refreshing 😅\n\n⚠️ Tatkal = non-refundable if cancelled!`,
      cards: [], cta: null
    };
  }

  // LOCAL AREA TO AIRPORT
  if (/airport|how.*reach.*airport|attibele|electronic city|whitefield|koramangala|hsr|marathahalli|indiranagar|hebbal|yelahanka|majestic|bandra|andheri|noida|gurgaon/.test(m)) {
    // Check for local area
    const localKeys = Object.keys(LOCAL_AREA_TO_AIRPORT);
    const matchedArea = localKeys.find(k => m.includes(k));
    if (matchedArea) {
      const info = LOCAL_AREA_TO_AIRPORT[matchedArea];
      return {
        text: `🚖 **Getting to ${info.airport} from ${matchedArea.charAt(0).toUpperCase() + matchedArea.slice(1)}:**\n\nDistance: ~${info.distance}\n\n${info.transport}\n\n⏰ **Arrival time at airport:**\n• Domestic flights: 2 hours before\n• International flights: 3 hours before\n\nNeed help planning the full trip from here? Just tell me your destination! ✈️`,
        cards: [], cta: null
      };
    }
  }

  // BUS SEARCH — stored data
  if (isBusQ && from && to) {
    let buses = BUS_DB.filter(b => b.from === from && b.to === to);
    if (!buses.length) buses = BUS_DB.filter(b => b.to === from && b.from === to);
    if (!buses.length) {
      return {
        text: `🚌 Looking for buses from **${from.charAt(0).toUpperCase() + from.slice(1)}** to **${to.charAt(0).toUpperCase() + to.slice(1)}**!\n\nI don't have offline data for this route — here's the live option:`,
        cards: [{
          type: "bus", operator: "Multiple operators",
          from: from.charAt(0).toUpperCase() + from.slice(1),
          to: to.charAt(0).toUpperCase() + to.slice(1),
          departure: "Various", arrival: "Various", price: null,
          label: "Check Live", insight: "Tap to see live availability and prices.",
          link: buildBusLink(from, to)
        }],
        cta: "💡 Live seats and prices available on the partner site."
      };
    }
    const prices = buses.map(b => b.price);
    const minP = Math.min(...prices);
    const cards = buses.slice(0, 3).map((b, i) => ({
      type: "bus", operator: b.op,
      from: from.charAt(0).toUpperCase() + from.slice(1),
      to: to.charAt(0).toUpperCase() + to.slice(1),
      departure: b.dep, arrival: b.arr, price: b.price, type2: b.type,
      label: b.price === minP ? "Cheapest" : null,
      insight: b.price === minP ? "Cheapest on this route!" : null,
      link: buildBusLink(from, to)
    }));
    return {
      text: `🚌 Found **${buses.length} buses** from ${from.charAt(0).toUpperCase() + from.slice(1)} to ${to.charAt(0).toUpperCase() + to.slice(1)}!\n\n💰 Cheapest: **₹${minP}** (${buses.find(b => b.price === minP).op})`,
      cards, cta: "💡 Tap any card to check live seat availability and book!"
    };
  }

  // TRAIN SEARCH — stored data
  if (isTrainQ && from && to) {
    const { date } = extractDate(msg);
    return {
      text: `🚂 Searching trains from **${from.charAt(0).toUpperCase() + from.slice(1)}** to **${to.charAt(0).toUpperCase() + to.slice(1)}**!\n\nRoute pre-filled on IRCTC for you.\n\n**Fare guide:**\n• Sleeper (SL): ₹150–400\n• AC 3-tier (3A): ₹400–800\n• AC 2-tier (2A): ₹700–1,500\n\n💡 Book 60 days early for best availability!`,
      cards: [{
        type: "train",
        from: from.charAt(0).toUpperCase() + from.slice(1),
        to: to.charAt(0).toUpperCase() + to.slice(1),
        label: "IRCTC",
        date: date ? date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : null,
        insight: "Route pre-filled — just select class and pay!",
        link: buildTrainLink(from, to, date ? date.toISOString().split("T")[0] : null)
      }],
      cta: "💡 Tap to open IRCTC with your route pre-filled."
    };
  }

  // HOTEL SEARCH — stored data
  if (isHotelQ && (from || to)) {
    const city = to || from;
    const cityN = city.charAt(0).toUpperCase() + city.slice(1);
    const pr = HOTEL_PRICES[city.toLowerCase()] || "700–4,000";
    return {
      text: `🏨 Hotels in **${cityN}** — finding the best options!\n\nPrice range: ₹${pr}/night\n\n💡 **${cityN} hotel tips:**\n• Book 2–3 weeks ahead for best rates\n• Read reviews from last 3 months\n• Check if breakfast is included`,
      cards: [{
        type: "hotel", city: cityN, priceRange: pr,
        label: "Best Rates", insight: `Great selection in ${cityN} — from budget to luxury.`,
        link: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}`
      }],
      cta: "💡 Tap to browse all hotels with live prices and reviews."
    };
  }

  return null; // escalate to Groq/GPT
}

// ══════════════════════════════════════════════════════════════
//  TRIP PLANNER STATE MACHINE
// ══════════════════════════════════════════════════════════════
const tripSessions = new Map();

function getTripSession(sid) { return tripSessions.get(sid) || null; }
function setTripSession(sid, state) {
  tripSessions.set(sid, { ...state, updatedAt: Date.now() });
  for (const [k, v] of tripSessions) {
    if (Date.now() - v.updatedAt > 7200000) tripSessions.delete(k);
  }
}
function clearTripSession(sid) { tripSessions.delete(sid); }

function detectsTripIntent(message) {
  const m = message.toLowerCase();
  return /plan.*trip|trip.*plan|going to|travel to|visiting|i want to go|i am going|iam going|planning.*trip|help.*trip|plan.*vacation|plan.*holiday/i.test(m);
}

async function runTripPlanner(sid, message, userId, userName, prefs) {
  let state = getTripSession(sid) || { step: "start" };
  const m = message.toLowerCase().trim();
  const name = userName ? userName.split(" ")[0] : "there";

  if (state.step === "start") {
    const { from, to } = extractCities(message);
    const f = from || null;
    const t = to || null;

    if (t) {
      // Has destination
      setTripSession(sid, { step: "ask_home", to: t, toDisplay: t.charAt(0).toUpperCase() + t.slice(1) });
      return {
        text: `${t.charAt(0).toUpperCase() + t.slice(1)} — brilliant choice, ${name}! 🌍✈️\n\nFor complete door-to-door planning, I need your **exact location** — not just the city, but your area/locality.\n\nFor example:\n• "Koramangala, Bangalore"\n• "Andheri, Mumbai"\n• "Attibele"\n• "Sector 15, Gurgaon"\n\nThe more specific you are, the better I can plan your journey! 📍`,
        quickReplies: prefs.home_city ? [`${prefs.home_city} (my saved location)`, "Let me type my location"] : [],
        isTripPlanner: true
      };
    } else {
      // No destination found
      setTripSession(sid, { step: "ask_destination" });
      return {
        text: `Ooh, a trip! Love it 🎉 Where are you planning to go, ${name}?\n\nYou can tell me any city or destination — in India or anywhere in the world!`,
        isTripPlanner: true
      };
    }
  }

  if (state.step === "ask_destination") {
    const { from, to } = extractCities(message);
    const dest = to || from || message.trim();
    const destDisplay = dest.charAt(0).toUpperCase() + dest.slice(1);
    setTripSession(sid, { ...state, step: "ask_home", to: dest, toDisplay: destDisplay });
    return {
      text: `${destDisplay}! Great choice 😄✈️\n\nNow, for complete door-to-door planning — what's your **exact location/area**?\n\nBe specific (area/locality + city) so I can plan your local transport to the airport too! 📍`,
      isTripPlanner: true
    };
  }

  if (state.step === "ask_home") {
    const homeLocation = message.trim();
    // Check if it's a saved preference
    const actualHome = message.includes("saved location") && prefs.home_city ? prefs.home_city : homeLocation;

    // Save to preferences
    if (userId) await setUserPref(userId, "home_location", actualHome);

    // Detect nearest airport
    const localKey = Object.keys(LOCAL_AREA_TO_AIRPORT).find(k => actualHome.toLowerCase().includes(k));
    const airportInfo = localKey ? LOCAL_AREA_TO_AIRPORT[localKey] : null;

    setTripSession(sid, { ...state, step: "ask_purpose", homeLocation: actualHome, airportInfo });

    return {
      text: `📍 Got it — starting from **${actualHome}**!\n\n${airportInfo ? `✈️ Your nearest airport: **${airportInfo.airport}**` : "I'll figure out your nearest airport!"}\n\nNow, what's the **purpose** of this trip? 🎯`,
      quickReplies: ["🏖️ Tourism / Vacation", "💼 Business", "👨‍👩‍👧 Family Visit", "💑 Honeymoon / Romantic", "🎒 Backpacking / Budget", "🎓 Study / Education"],
      isTripPlanner: true
    };
  }

  if (state.step === "ask_purpose") {
    let purpose = "tourism";
    if (/business|work|meeting/i.test(m)) purpose = "business";
    else if (/family|relative|parents/i.test(m)) purpose = "family";
    else if (/honeymoon|romantic|couple/i.test(m)) purpose = "honeymoon";
    else if (/backpack|budget|solo/i.test(m)) purpose = "backpacking";
    else if (/study|education|college/i.test(m)) purpose = "education";

    setTripSession(sid, { ...state, step: "ask_dates", purpose });

    return {
      text: `${purpose === "honeymoon" ? "Aww, romantic trip! 💑" : purpose === "backpacking" ? "Budget warrior mode! 🎒" : "Perfect!"}\n\n**When are you planning to travel?** 📅\n\nApproximate dates are fine too!`,
      quickReplies: ["This weekend", "Next week", "Next month", "In 2–3 months", "Not decided yet"],
      isTripPlanner: true
    };
  }

  if (state.step === "ask_dates") {
    setTripSession(sid, { ...state, step: "ask_budget", travelDate: message });
    return {
      text: `📅 Noted — **${message}**!\n\nWhat's your **total budget** for this trip? (flights + hotel + activities, per person)\n\n💡 Even a rough range helps me find the best options!`,
      quickReplies: ["Under ₹10,000", "₹10,000 – ₹30,000", "₹30,000 – ₹60,000", "₹60,000 – ₹1,50,000", "Above ₹1,50,000", "International — tell me options"],
      isTripPlanner: true
    };
  }

  if (state.step === "ask_budget") {
    const budget = extractBudget(message) || message;
    if (userId) await setUserPref(userId, "typical_budget", String(budget));

    setTripSession(sid, { ...state, step: "show_section1", budget });

    // Section 1: Home → Airport
    const { homeLocation, airportInfo, toDisplay } = state;
    const airportText = airportInfo
      ? `🚖 **From ${homeLocation} → ${airportInfo.airport}:**\n\n${airportInfo.transport}\n\n📏 Distance: ${airportInfo.distance}`
      : `🚖 **Getting to your airport from ${homeLocation}:**\n\nI'll need you to check Google Maps for the exact route from your area to the nearest airport. General tip: Book a cab 1–2 hours before you need to leave!`;

    return {
      text: `✈️ **SECTION 1 of 6 — Getting to the Airport**\n\n${airportText}\n\n⏰ **Arrive at airport:**\n• Domestic flights: **2 hours** before departure\n• International flights: **3 hours** before departure\n\n---\nReady for **Section 2 — Flights**? 🛫`,
      quickReplies: ["Yes, show me flights ✈️", "Wait, I have a question about this"],
      sectionNum: 1, totalSections: 6, isTripPlanner: true
    };
  }

  if (state.step === "show_section1") {
    setTripSession(sid, { ...state, step: "show_section2" });
    const { to, toDisplay, budget } = state;
    const fromCity = prefs.home_city || state.homeLocation?.split(",").pop()?.trim() || "your city";
    const fc = CITY_TO_IATA[fromCity?.toLowerCase()] || fromCity?.slice(0, 3).toUpperCase() || "BLR";
    const tc = CITY_TO_IATA[to?.toLowerCase()] || to?.slice(0, 3).toUpperCase() || "BOM";
    const isIndia = INDIA_IATA.has(fc) && INDIA_IATA.has(tc);
    const flightLink = buildAffiliateFlightLink(fromCity, to);
    const budgetNum = typeof budget === "string" ? extractBudget(budget) || 0 : budget;
    const isIntl = !isIndia;

    return {
      text: `✈️ **SECTION 2 of 6 — Flights**\n\n🛫 **${fromCity.charAt(0).toUpperCase() + fromCity.slice(1)} → ${toDisplay}**\n\n${isIntl ? `💰 **Estimated flight cost:** ₹${budgetNum > 50000 ? "35,000–80,000" : "25,000–60,000"} return\n✈️ Most international routes have 1 layover (Dubai/Singapore are common)\n📅 Book **6–8 weeks early** for best prices\n💡 **Tuesday/Wednesday flights** are cheapest (save 15–25%)` : `💰 **Estimated flight cost:** ₹2,500–6,000 one way\n📅 Book **3–5 weeks early** for best prices\n💡 **Early morning flights (5–8 AM)** are cheapest`}\n\n---\nReady for **Section 3 — Airport to Hotel**? 🏨`,
      cards: [{
        type: "flight", airline: "Multiple Airlines",
        from: fromCity.charAt(0).toUpperCase() + fromCity.slice(1), to: toDisplay,
        fromCode: fc, toCode: tc,
        departure: "—", arrival: "—",
        duration: isIntl ? "Check live" : "Direct",
        price: null, label: "Live Fares",
        insight: "Tap to compare all airlines and find the best price.",
        link: flightLink
      }],
      quickReplies: ["Yes, show Section 3 🏨", "I have a question about flights"],
      sectionNum: 2, totalSections: 6, isTripPlanner: true
    };
  }

  if (state.step === "show_section2") {
    setTripSession(sid, { ...state, step: "show_section3" });
    const { to, toDisplay } = state;

    // Destination airport to hotel transport
    const destTransport = {
      "dubai": "🚇 Dubai Metro Red Line from airport — cheapest (₹60–120)\n🚖 Careem/Uber — ₹600–1,200 depending on hotel location",
      "singapore": "🚇 MRT from Changi Airport — easiest ($2.50 SGD, ~₹160)\n🚖 Grab — S$20–30 (~₹1,200–1,800)",
      "bangkok": "🚇 Airport Rail Link — cheapest (45 baht, ~₹100)\n🚖 Grab — $5–12 USD (~₹400–1,000)",
      "tokyo": "🚆 Narita Express (N'EX) — ¥3,070 (~₹1,700)\n✈️ Haneda airport is much closer — use that if available!",
      "london": "🚇 Heathrow Express — £25 (~₹2,700, fastest, 15 min)\n🚇 Piccadilly Line — £5.60 (~₹600, slower but cheap)\n🚖 Uber — £45–70 (~₹4,800–7,500)",
      "paris": "🚆 RER B from CDG — €11.80 (~₹1,050, 35 min)\n🚖 Uber — €35–55 (~₹3,200–5,000)",
      "goa": "🚖 Prepaid taxi — ₹500–900 depending on hotel location\n🚌 Local bus available but limited",
      "kochi": "🚖 Ola/Uber — ₹400–700\n🚌 KSRTC bus — ₹50–80 (slow but cheap!)",
      "mumbai": "🚇 Metro Line 1 → cab\n🚖 Ola/Uber — ₹300–700\n💡 T1 and T2 are separate — check your terminal!",
      "delhi": "🚇 Airport Express Metro — ₹60–100 from New Delhi station (fastest!)\n🚖 Cab — ₹300–700",
      "default": `🚖 Cab/taxi from ${toDisplay} airport — most convenient on arrival\n💡 Download local ride app before landing!`,
    };

    const transport = destTransport[to?.toLowerCase()] || destTransport["default"];

    return {
      text: `🗺️ **SECTION 3 of 6 — ${toDisplay} Airport → Hotel**\n\n${transport}\n\n💡 **Pro tip:** Book airport transfer in advance for late-night arrivals — safer and often cheaper!\n\n---\nReady for **Section 4 — Hotels**? 🏨`,
      quickReplies: ["Yes, show hotels 🏨", "Tell me more about transport in " + toDisplay],
      sectionNum: 3, totalSections: 6, isTripPlanner: true
    };
  }

  if (state.step === "show_section3") {
    setTripSession(sid, { ...state, step: "show_section4" });
    const { to, toDisplay, purpose, budget } = state;
    const cityKey = to?.toLowerCase() || "";
    const pr = HOTEL_PRICES[cityKey] || "700–5,000";
    const budgetNum = typeof budget === "string" ? extractBudget(budget) || 0 : (budget || 0);

    const hotelTips = {
      "goa": "🏖️ **Goa hotel tips:**\n• North Goa = parties, nightlife, Baga/Calangute area\n• South Goa = peaceful, cleaner, Palolem area\n• Book **4+ weeks early** in peak season (Dec–Feb)",
      "dubai": "🏙️ **Dubai hotel tips:**\n• Downtown = near Burj Khalifa & Dubai Mall\n• JBR/Marina = beachfront, family-friendly\n• Many hotels include breakfast — look for it!",
      "singapore": "🦁 **Singapore hotel tips:**\n• Marina Bay area = tourist hub, central\n• Chinatown = budget options + great food nearby\n• Book weekdays — weekends are more expensive",
      "tokyo": "⛩️ **Tokyo hotel tips:**\n• Shinjuku or Shibuya = most central\n• Capsule hotels = unique experience, budget-friendly\n• Book **3+ months early** — Tokyo fills up fast!",
      "bali": "🌺 **Bali hotel tips:**\n• Seminyak = beach + nightlife\n• Ubud = culture + rice terraces (romantic!)\n• Villas with private pool are often affordable here!",
      "default": `🏨 **${toDisplay} hotel tips:**\n• Book early for best rates\n• Read reviews from last 3 months\n• Look for free cancellation option`,
    };

    const tip = hotelTips[cityKey] || hotelTips["default"];

    return {
      text: `🏨 **SECTION 4 of 6 — Hotels in ${toDisplay}**\n\n${tip}\n\n💰 **Price range:** ₹${pr}/night\n\n${purpose === "honeymoon" ? "💑 For honeymoon — look for private villas or sea-view rooms!" : purpose === "backpacking" ? "🎒 For budget travel — hostels start from ₹500–1,500/night!" : ""}`,
      cards: [{
        type: "hotel", city: toDisplay, priceRange: pr,
        label: purpose === "honeymoon" ? "Romantic Stay" : purpose === "backpacking" ? "Budget Friendly" : "Best Rates",
        insight: `Great options in ${toDisplay} for every budget.`,
        link: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(to || toDisplay)}`
      }],
      quickReplies: ["Yes, show activities 🗺️", "I need a cheaper option"],
      sectionNum: 4, totalSections: 6, isTripPlanner: true
    };
  }

  if (state.step === "show_section4") {
    setTripSession(sid, { ...state, step: "show_section5" });
    const { to, toDisplay, purpose } = state;

    // Use Groq for activities — this is a medium query
    const systemMsg = `You are Alvryn AI travel guide. Give a SHORT (8-10 bullet points max), exciting list of must-do activities in ${toDisplay} for ${purpose} travel. Use emojis. Be specific with names and approximate costs in INR where relevant. No competitor platform names.`;
    const groqReply = await callGroq(`Top activities in ${toDisplay} for ${purpose} traveler`, systemMsg, 300);

    const fallbackActivities = `🗺️ **Things to do in ${toDisplay}:**\n\n• Explore the main attractions (search "${toDisplay} top places" for local picks)\n• Try local street food — it's always the best experience!\n• Visit at least one local market\n• Take a guided tour for historical context\n• Explore local neighborhoods away from tourist areas\n\n💡 Ask me about specific attractions in ${toDisplay} for more detailed recommendations!`;

    return {
      text: `🗺️ **SECTION 5 of 6 — Activities & Places in ${toDisplay}**\n\n${groqReply || fallbackActivities}\n\n---\nFinally — **Section 6: Budget + Checklist** 📋`,
      quickReplies: ["Yes, show budget & checklist ✅"],
      sectionNum: 5, totalSections: 6, isTripPlanner: true
    };
  }

  if (state.step === "show_section5") {
    const { to, toDisplay, homeLocation, purpose, travelDate, budget } = state;
    const isIntl = !INDIA_IATA.has(CITY_TO_IATA[to?.toLowerCase()] || "");
    clearTripSession(sid);

    const checklist = isIntl
      ? `✅ Passport (6+ months validity)\n✅ Visa (apply early!)\n✅ Travel insurance\n✅ Flight tickets\n✅ Hotel booking confirmation\n✅ International debit card (zero forex)\n✅ Download offline maps\n✅ Local currency (small amount)\n✅ Emergency contacts saved\n✅ Check airline baggage rules`
      : `✅ Aadhaar / PAN (valid photo ID)\n✅ Flight / bus / train ticket\n✅ Hotel confirmation\n✅ UPI + some cash\n✅ Download offline maps\n✅ Portable charger\n✅ Basic medicines\n✅ Check weather for packing`;

    return {
      text: `📋 **SECTION 6 of 6 — Budget Summary & Checklist**\n\n**Your trip: ${homeLocation} → ${toDisplay}**\n📅 Travel date: ${travelDate}\n🎯 Purpose: ${purpose}\n\n**Pre-travel checklist:**\n${checklist}\n\n---\n🎉 **Your complete trip plan is ready, ${name}!**\n\nWant me to search flights, buses or hotels for this trip right now? Just ask! ✈️`,
      sectionNum: 6, totalSections: 6, isTripPlanner: true
    };
  }

  return null;
}

// ══════════════════════════════════════════════════════════════
//  DAILY AI CALL LIMITS
// ══════════════════════════════════════════════════════════════
const dailyAiCalls = new Map();
const GROQ_DAILY_LIMIT = 15; // per user per day
const GPT_DAILY_LIMIT = 5;   // per user per day (reserved for when key added)

function getAiCount(userId, type = "groq") {
  const today = new Date().toDateString();
  const rec = dailyAiCalls.get(`${userId}_${type}`);
  if (!rec || rec.date !== today) return 0;
  return rec.count;
}

function incrementAi(userId, type = "groq") {
  const today = new Date().toDateString();
  const key = `${userId}_${type}`;
  const rec = dailyAiCalls.get(key);
  if (!rec || rec.date !== today) dailyAiCalls.set(key, { count: 1, date: today });
  else dailyAiCalls.set(key, { count: rec.count + 1, date: today });
}

function buildCards(message, from, to, date) {
  const m = message.toLowerCase();
  const isBus = /\bbus\b|buses/i.test(m);
  const isHotel = /hotel|stay/i.test(m);
  const isTrain = /\btrain\b|irctc/i.test(m);
  const fN = from ? from.charAt(0).toUpperCase() + from.slice(1) : "";
  const tN = to ? to.charAt(0).toUpperCase() + to.slice(1) : "";
  const ddmm = date ? (String(date.getDate()).padStart(2, "0") + String(date.getMonth() + 1).padStart(2, "0")) : "";

  if (!from && !to) return [];

  if (isBus && from && to) return [{ type: "bus", operator: "Multiple operators", from: fN, to: tN, departure: "Various", arrival: "Various", price: null, label: "Check Live", insight: "Tap to see live seats on partner site.", link: buildBusLink(from, to) }];
  if (isTrain && from && to) return [{ type: "train", from: fN, to: tN, label: "IRCTC", insight: "Route pre-filled on IRCTC.", link: buildTrainLink(from, to, date?.toISOString().split("T")[0]) }];
  if (isHotel && (from || to)) {
    const city = to || from;
    const pr = HOTEL_PRICES[city?.toLowerCase()] || "700–4,000";
    return [{ type: "hotel", city: tN || fN, priceRange: pr, label: "Best Rates", insight: "Live prices on partner site.", link: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}` }];
  }
  if (from && to) return [{ type: "flight", airline: "Multiple Airlines", from: fN, to: tN, fromCode: CITY_TO_IATA[from] || from.slice(0, 3).toUpperCase(), toCode: CITY_TO_IATA[to] || to.slice(0, 3).toUpperCase(), departure: "—", arrival: "—", duration: "Check live", price: null, label: "Live Fares", insight: "Compare all airlines.", link: buildAffiliateFlightLink(from, to, ddmm) }];
  return [];
}

// ══════════════════════════════════════════════════════════════
//  MAIN AI CHAT ENDPOINT
// ══════════════════════════════════════════════════════════════
app.post("/ai-chat-v2", authenticateToken, async (req, res) => {
  const { message, history = [], sessionId } = req.body || {};
  if (!message) return res.status(400).json({ message: "No message" });

  const userId = req.user?.id;
  const sid = sessionId || `web_${userId}_${Date.now()}`;

  try {
    // Get user info
    let userName = "";
    try {
      const userResult = await pool.query("SELECT name FROM users WHERE id=$1", [userId]);
      userName = userResult.rows[0]?.name || "";
    } catch {}

    const prefs = userId ? await getUserPrefs(userId) : {};

    // Update memory in background
    updateUserMemory(userId, message).catch(() => {});

    // ── CHECK ONGOING TRIP PLANNER ────────────────────────────────────────────
    const existingSession = getTripSession(sid);
    if (existingSession && existingSession.step !== "complete") {
      const tripResult = await runTripPlanner(sid, message, userId, userName, prefs);
      if (tripResult) {
        logEvent("ai_trip", `step:${existingSession.step}`, "ai_chat", userId).catch(() => {});
        return res.json({ ...tripResult, sessionId: sid });
      }
    }

    // ── CHECK NEW TRIP INTENT ─────────────────────────────────────────────────
    if (detectsTripIntent(message) && !existingSession) {
      const tripResult = await runTripPlanner(sid, message, userId, userName, prefs);
      if (tripResult) {
        logEvent("ai_trip_start", message.slice(0, 80), "ai_chat", userId).catch(() => {});
        return res.json({ ...tripResult, sessionId: sid });
      }
    }

    // ── TIER 1: STORED DATA (unlimited) ──────────────────────────────────────
    const easy = easyResponse(message, userName, prefs);
    if (easy) {
      logEvent("ai_easy", message.slice(0, 80), "ai_chat", userId).catch(() => {});
      return res.json({ ...easy, sessionId: sid });
    }

    // ── TIER 2: DB FLIGHT LOOKUP ──────────────────────────────────────────────
    const { from, to } = extractCities(message);
    const f = from || null;
    const t = to || null;
    const { date } = extractDate(message);
    const budget = extractBudget(message);

    if (f && t) {
      try {
        const isCheap = /cheap|lowest|budget|sasta/i.test(message);
        let q = "SELECT * FROM flights WHERE LOWER(from_city)=$1 AND LOWER(to_city)=$2";
        const v = [f, t];
        if (date) { q += " AND DATE(departure_time)=$3"; v.push(date.toISOString().split("T")[0]); }
        if (budget) { q += ` AND price <= $${v.length + 1}`; v.push(budget); }
        q += isCheap ? " ORDER BY price ASC LIMIT 4" : " ORDER BY departure_time ASC LIMIT 4";
        const rows = (await pool.query(q, v)).rows;

        if (rows.length > 0) {
          const prices = rows.map(r => r.price);
          const minP = Math.min(...prices), maxP = Math.max(...prices);
          const cards = rows.map((row, i) => {
            const dep = new Date(row.departure_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
            const arr = new Date(row.arrival_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
            const dur = Math.round((new Date(row.arrival_time) - new Date(row.departure_time)) / 60000);
            const ddmm2 = date ? (String(date.getDate()).padStart(2, "0") + String(date.getMonth() + 1).padStart(2, "0")) : "";
            return {
              type: "flight", airline: row.airline,
              from: f.charAt(0).toUpperCase() + f.slice(1),
              to: t.charAt(0).toUpperCase() + t.slice(1),
              fromCode: CITY_TO_IATA[f] || f.slice(0, 3).toUpperCase(),
              toCode: CITY_TO_IATA[t] || t.slice(0, 3).toUpperCase(),
              departure: dep, arrival: arr,
              duration: `${Math.floor(dur / 60)}h ${dur % 60}m`,
              price: row.price,
              label: row.price === minP ? "Best Price" : i === 1 ? "Fastest" : i === 2 ? "Best Overall" : null,
              insight: row.price === minP ? `Cheapest! Save ₹${maxP - minP} vs priciest option.` : null,
              link: buildAffiliateFlightLink(f, t, ddmm2)
            };
          });
          const cheapest = rows.reduce((a, b) => a.price < b.price ? a : b);
          const dep = new Date(cheapest.departure_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
          return res.json({
            text: `✈️ Found **${rows.length} flights** from ${f.charAt(0).toUpperCase() + f.slice(1)} to ${t.charAt(0).toUpperCase() + t.slice(1)}!${date ? " on " + date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}\n\n💰 Cheapest: **₹${minP.toLocaleString()}** — ${cheapest.airline} at ${dep}${budget && minP > budget ? "\n\n⚠️ All options above your budget. Want me to suggest buses instead?" : ""}`,
            cards, cta: "💡 Prices may change — tap to check live fares!",
            sessionId: sid
          });
        }
      } catch {}
    }

    // ── TIER 3: GROQ (limited per day) ───────────────────────────────────────
    const groqCount = getAiCount(userId, "groq");
    const tier = classifyQuery(message, prefs);

    if (groqCount >= GROQ_DAILY_LIMIT) {
      // Limit reached — show helpful stored response with upgrade prompt
      const cards = buildCards(message, f, t, date);
      return res.json({
        text: `You've used your ${GROQ_DAILY_LIMIT} AI responses for today! 🎯\n\n✅ **Still unlimited:** Basic travel info, tips, destinations, FAQs\n🔓 **To unlock more:** Book a trip via Alvryn!\n\nHere are the best options I found 👇`,
        cards, cta: "💡 Book via Alvryn to unlock unlimited AI responses.",
        sessionId: sid
      });
    }

    // Build cards for context
    const cards = buildCards(message, f, t, date);

    // Build data context for AI
    let dataContext = "";
    if (cards.length > 0) {
      dataContext = "\n\nTravel data found:";
      cards.forEach(c => {
        if (c.type === "flight") dataContext += ` Flight: ${c.from}→${c.to} ${c.departure || ""} ₹${c.price || "live"}.`;
        if (c.type === "bus") dataContext += ` Bus: ${c.from}→${c.to} ₹${c.price || "live"}.`;
        if (c.type === "hotel") dataContext += ` Hotels in ${c.city}: ₹${c.priceRange}/night.`;
      });
    }

    // Choose Groq vs GPT based on query complexity
    const systemPrompt = buildSystemPrompt(userName, prefs, tier === "hard" ? "gpt" : "groq");
    const userPrompt = message + dataContext;

    incrementAi(userId, "groq");
    const remaining = GROQ_DAILY_LIMIT - getAiCount(userId, "groq");

    let aiText = null;

    // Try GPT first for hard queries if key is available
    if (tier === "hard" && process.env.OPENAI_API_KEY) {
      aiText = await callGPT(userPrompt, systemPrompt, 600);
    }

    // Fall back to Groq
    if (!aiText) {
      aiText = await callGroq(userPrompt, systemPrompt, 400);
    }

    if (aiText) {
      const limitNote = remaining <= 3 ? `\n\n_💡 ${remaining} AI response${remaining === 1 ? "" : "s"} left today — book via Alvryn to unlock more!_` : "";
      logEvent("ai_groq", message.slice(0, 80), "ai_chat", userId).catch(() => {});
      return res.json({
        text: aiText + limitNote,
        cards,
        cta: cards.length ? "💡 Tap any card to check live prices on our partner site." : null,
        sessionId: sid
      });
    }

    // ── FINAL FALLBACK ────────────────────────────────────────────────────────
    const fallbackCards = buildCards(message, f, t, date);
    const fallbackText = f && t
      ? `🔍 Searching for the best options from **${f.charAt(0).toUpperCase() + f.slice(1)}** to **${t.charAt(0).toUpperCase() + t.slice(1)}**! Tap below for live prices 👇`
      : `Hey ${userName ? userName.split(" ")[0] : "there"}! 😊 I'm here to help with all your travel needs!\n\nTry:\n• "Flights Bangalore to Delhi tomorrow"\n• "Plan my trip to Goa"\n• "Bus Mumbai to Pune tonight"\n\nWhat's your next adventure? ✈️`;

    return res.json({ text: fallbackText, cards: fallbackCards, cta: fallbackCards.length ? "💡 Tap for live prices!" : null, sessionId: sid });

  } catch (e) {
    console.error("AI Chat v2:", e.message);
    return res.json({
      text: "Hmm, something went sideways on my end! 😅 Try again in a sec — I promise I'm usually faster than this!\n\nOr try: 'flights [city] to [city]' for a quick search! ✈️",
      cards: [], cta: null, sessionId: sid
    });
  }
});

// ══════════════════════════════════════════════════════════════
//  ADMIN ROUTES
// ══════════════════════════════════════════════════════════════
app.get("/admin/bookings", async (req, res) => {
  try { const r = await pool.query("SELECT * FROM bookings ORDER BY created_at DESC LIMIT 200"); res.json(r.rows); }
  catch (e) { res.status(500).json({ message: "Server error" }); }
});

app.get("/admin/users", async (req, res) => {
  try { const r = await pool.query("SELECT id,name,email,phone,created_at FROM users ORDER BY id DESC LIMIT 200"); res.json(r.rows); }
  catch (e) { res.status(500).json({ message: "Server error" }); }
});

app.get("/admin/waitlist", async (req, res) => {
  try { const r = await pool.query("SELECT * FROM waitlist ORDER BY created_at DESC LIMIT 200"); res.json(r.rows); }
  catch (e) { res.status(500).json({ message: "Server error" }); }
});

app.get("/countries", (req, res) => {
  res.json([
    { key:"india", name:"India", flag:"🇮🇳", currency:"₹" },
    { key:"usa", name:"USA", flag:"🇺🇸", currency:"$" },
    { key:"uk", name:"UK", flag:"🇬🇧", currency:"£" },
  ]);
});

// ── WHATSAPP (kept from original) ────────────────────────────────────────────
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const userSessions = {};

app.post("/whatsapp", async (req, res) => {
  const rawMsg = req.body.Body?.trim() || "";
  const msg = rawMsg.toLowerCase().trim();
  const phone = req.body.From;
  let reply = "";

  if (!userSessions[phone]) userSessions[phone] = { step: "idle" };

  const resetWords = ["hi","hello","hey","start","restart","cancel","reset","stop","menu","back","help"];
  if (resetWords.some(w => msg === w || msg.startsWith(w + " "))) {
    userSessions[phone] = { step: "idle" };
    reply = `✈️ *Alvryn AI — Your Travel Buddy!* 🌍\n\nHi! Ask me anything about travel:\n\n*✈️ Flights:*\n_"flights bangalore to mumbai tomorrow"_\n\n*🚌 Buses:*\n_"bus bangalore to goa tonight"_\n\n*🏨 Hotels:*\n_"hotels in goa under 2000"_\n\n*🗺️ Trip planning:*\n_"plan 2 day goa trip under 5000"_`;
  } else {
    // Use Groq for WhatsApp
    const groqReply = await callGroq(rawMsg,
      `You are Alvryn AI WhatsApp travel assistant. Reply SHORT (max 300 chars). Use *bold* for emphasis. Focus on travel: flights, hotels, visas, transport. IST time: ${getISTGreeting()}.`,
      200
    );
    reply = groqReply || "I can help with flights, buses, hotels and trips! Type *help* for menu. 😊";
  }

  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(reply.slice(0, 600));
  res.type("text/xml").send(twiml.toString());
});

// ── Mount server2 routes ─────────────────────────────────────────────────────
require("./server2.js")(app, pool);

// ── START SERVER ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`ALVRYN BACKEND running on port ${PORT}`);
});