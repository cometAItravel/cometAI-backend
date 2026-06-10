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

// ══════════════════════════════════════════════════════════════════════════════
//  ANALYTICS
// ══════════════════════════════════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════════════════════════════════
//  IST TIME HELPER
// ══════════════════════════════════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════════════════════════════════
//  COMPREHENSIVE CITY MAP
// ══════════════════════════════════════════════════════════════════════════════
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
  "madrid":"madrid","milan":"milan","vienna":"vienna",
  "bali":"bali","dps":"bali","phuket":"phuket","hkt":"phuket",
  "kathmandu":"kathmandu","ktm":"kathmandu","nepal":"kathmandu",
  "dhaka":"dhaka","male":"male","maldives":"male",
  "johannesburg":"johannesburg","cairo":"cairo","nairobi":"nairobi",
  "seoul":"seoul","icn":"seoul","taipei":"taipei","manila":"manila","jakarta":"jakarta",
  "auckland":"auckland","akl":"auckland","perth":"perth",
  "sharjah":"sharjah","riyadh":"riyadh","jeddah":"jeddah",
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

  const noiseWords = [
    "flights","flight","buses","bus","hotels","hotel","trains","train",
    "book","booking","find","search","show","plan","trip","travel","to","from","going",
    "want","need","please","can","you","me","i","a","the","in","at","on","for",
    "mujhe","chahiye","please","kya","hai","se","ko","ka","ek","ticket",
    "enakku","vendum","naaku","kavali","cheap","cheapest","best","good","nice",
    "want to go","planning","visiting","going to","i am going","iam going",
  ];

  let cleaned = normalized;
  noiseWords.forEach(w => {
    cleaned = cleaned.replace(new RegExp(`\\b${w}\\b`, "g"), " ");
  });
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  let found = [];

  // Multi-word city match first
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

  // Fuzzy match (first 4 chars)
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
    /budget.*?[₹rs.]*\s*(\d+)k?/,/(\d+)k?\s*budget/,/₹\s*(\d+)/,
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

// Extract people count from text
function extractPeopleCount(text) {
  const t = text.toLowerCase();
  const patterns = [
    /(\d+)\s*(people|persons?|members?|adults?|pax|passengers?|friends?|family members?)/,
    /(\d+)\s*(of us|are coming|are going|travelling|traveling)/,
    /we\s*(are|r)\s*(\d+)/,/group\s*of\s*(\d+)/,/(\d+)\s*member/,
  ];
  for (const p of patterns) {
    const m = t.match(p);
    if (m) return parseInt(m[1] || m[2]);
  }
  if (/\bcouple\b/.test(t)) return 2;
  if (/\bsolo\b|\balone\b|\bjust me\b/.test(t)) return 1;
  return null;
}

// Extract trip duration
function extractDuration(text) {
  const t = text.toLowerCase();
  const m = t.match(/(\d+)\s*(days?|nights?)/);
  if (m) return parseInt(m[1]);
  if (/weekend/.test(t)) return 2;
  if (/week\b/.test(t)) return 7;
  return null;
}

// Extract travel mode
function extractTravelMode(text) {
  const t = text.toLowerCase();
  if (/\btrain\b|\brailway\b|\birctc\b/.test(t)) return "train";
  if (/\bbus\b|\bcoach\b|\bvolvo\b/.test(t)) return "bus";
  if (/\bflight\b|\bfly\b|\bplane\b|\bairport\b/.test(t)) return "flight";
  if (/\bdrive\b|\bcar\b|\bself.?drive\b|\bdriving\b/.test(t)) return "car";
  return null;
}

// Extract trip purpose
function extractPurpose(text) {
  const t = text.toLowerCase();
  if (/honeymoon|romantic|anniversary/.test(t)) return "honeymoon";
  if (/business|work|meeting|conference/.test(t)) return "business";
  if (/family|parents|kids|children/.test(t)) return "family";
  if (/backpack|budget|solo/.test(t)) return "backpacking";
  if (/vacation|holiday|leisure|tourism|tourist/.test(t)) return "vacation";
  return null;
}

const fmt = d => d.toISOString().split("T")[0];

// ══════════════════════════════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════════════════════════════
function authenticateToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token required" });
  jwt.verify(token, process.env.JWT_SECRET || "secretkey", (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user; next();
  });
}

// ══════════════════════════════════════════════════════════════════════════════
//  TRACKING
// ══════════════════════════════════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════════════════════════════════
//  USERS
// ══════════════════════════════════════════════════════════════════════════════
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
    const r = await pool.query(
      "SELECT id,name,email,phone,ref_code,wallet_balance,referred_by,whatsapp_number FROM users WHERE id=$1",
      [req.user.id]
    );
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

// ══════════════════════════════════════════════════════════════════════════════
//  FLIGHTS
// ══════════════════════════════════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════════════════════════════════
//  PROMO / WALLET / BOOKING
// ══════════════════════════════════════════════════════════════════════════════
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
    res.json({ message: "Booking confirmed!", walletUsed });
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

// ══════════════════════════════════════════════════════════════════════════════
//  USER PREFERENCES / MEMORY
// ══════════════════════════════════════════════════════════════════════════════
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

// Comprehensive memory update — remembers EVERYTHING
async function updateUserMemory(userId, message) {
  if (!userId) return;
  const m = message.toLowerCase();

  const budget = extractBudget(message);
  if (budget) await setUserPref(userId, "typical_budget", String(budget));

  const people = extractPeopleCount(message);
  if (people) await setUserPref(userId, "group_size", String(people));

  const duration = extractDuration(message);
  if (duration) await setUserPref(userId, "typical_duration", String(duration));

  const purpose = extractPurpose(message);
  if (purpose) await setUserPref(userId, "travel_purpose", purpose);

  const travelMode = extractTravelMode(message);
  if (travelMode) await setUserPref(userId, "preferred_mode", travelMode);

  const { from, to } = extractCities(message);
  if (from) await setUserPref(userId, "home_city", from);
  if (to) await setUserPref(userId, "last_destination", to);

  if (/indigo|air india|spicejet|vistara|akasa/i.test(m)) {
    const airline = m.match(/indigo|air india|spicejet|vistara|akasa/i)?.[0];
    if (airline) await setUserPref(userId, "preferred_airline", airline);
  }

  if (/solo|alone/i.test(m)) await setUserPref(userId, "travel_style", "solo");
  if (/family|kids|children/i.test(m)) await setUserPref(userId, "travel_style", "family");
  if (/couple|honeymoon|wife|husband|partner/i.test(m)) await setUserPref(userId, "travel_style", "couple");
  if (/friends|gang|group/i.test(m)) await setUserPref(userId, "travel_style", "group");

  if (/budget|cheap|sasta|economy/i.test(m)) await setUserPref(userId, "price_preference", "budget");
  if (/luxury|premium|business class|first class/i.test(m)) await setUserPref(userId, "price_preference", "luxury");

  const count = parseInt((await getUserPrefs(userId)).search_count || "0") + 1;
  await setUserPref(userId, "search_count", String(count));
  await setUserPref(userId, "last_active", new Date().toISOString().split("T")[0]);
}

// ══════════════════════════════════════════════════════════════════════════════
//  CHAT HISTORY
// ══════════════════════════════════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════════════════════════════════
//  PRICE ALERTS
// ══════════════════════════════════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════════════════════════════════
//  WAITLIST
// ══════════════════════════════════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════════════════════════════════
//  GROQ AI CALL
// ══════════════════════════════════════════════════════════════════════════════
async function callGroq(prompt, systemMsg, maxTokens = 500) {
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
        max_tokens: maxTokens, temperature: 0.85,
      })
    });
    const d = await res.json();
    return d.choices?.[0]?.message?.content || null;
  } catch (e) { console.log("[Groq error]", e.message); return null; }
}

async function callGPT(prompt, systemMsg, maxTokens = 600) {
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
        max_tokens: maxTokens, temperature: 0.85,
      })
    });
    const d = await res.json();
    return d.choices?.[0]?.message?.content || null;
  } catch (e) { return null; }
}

// ══════════════════════════════════════════════════════════════════════════════
//  ALVRYN AI PERSONALITY SYSTEM PROMPT
// ══════════════════════════════════════════════════════════════════════════════
function buildSystemPrompt(userName, prefs, tier = "groq") {
  const name = userName ? userName.split(" ")[0] : "there";
  const greeting = getISTGreeting();
  const homeCity = prefs.home_city || null;
  const budget = prefs.typical_budget || null;
  const travelStyle = prefs.travel_style || null;
  const searchCount = parseInt(prefs.search_count || "0");
  const prefAirline = prefs.preferred_airline || null;
  const groupSize = prefs.group_size || null;
  const lastDest = prefs.last_destination || null;
  const purpose = prefs.travel_purpose || null;
  const mode = prefs.preferred_mode || null;
  const pricePreference = prefs.price_preference || null;

  const personalContext = [
    homeCity ? `User's home city: ${homeCity}` : "",
    budget ? `Typical budget: ₹${parseInt(budget).toLocaleString()}` : "",
    travelStyle ? `Travel style: ${travelStyle}` : "",
    prefAirline ? `Preferred airline: ${prefAirline}` : "",
    groupSize ? `Usual group size: ${groupSize} people` : "",
    lastDest ? `Last destination searched: ${lastDest}` : "",
    purpose ? `Travel purpose: ${purpose}` : "",
    mode ? `Preferred travel mode: ${mode}` : "",
    pricePreference ? `Price preference: ${pricePreference}` : "",
    searchCount > 0 ? `Returning user with ${searchCount} previous searches` : "New user",
  ].filter(Boolean).join(". ");

  return `You are Alvryn AI — the world's most helpful, funny, and smart travel companion.

CRITICAL — EXTRACT AND ADDRESS ALL CONSTRAINTS:
When a message contains multiple pieces of info, address EVERY SINGLE ONE. NEVER extract only the destination and ignore group size, budget, dietary needs, or special cases.
Example: "6 friends Bangalore to Goa, budget 15000/person, 2 vegetarians, one arrives late, prefer beaches, need airport transfer" — you MUST address ALL: group size, origin, budget breakdown (per person AND total), veg-friendly options, SEPARATE plan for the late person, South Goa for beaches not nightlife, airport cab cost.
Give per-person AND total costs for groups. Handle each special case explicitly.

PERSONALITY:
- You are like a well-traveled best friend who knows everything about travel worldwide
- Friendly, warm, slightly funny — but never cringe. Light humor, occasional gentle teasing
- Never robotic. Never formal. Talk like a real person who genuinely cares
- Use emojis naturally — not every sentence, just where it feels right
- If user makes a typo or spelling mistake, understand what they mean and answer correctly WITHOUT mentioning their typo
- NEVER mention any other travel platform, airline booking site, or competitor by name
- ALWAYS provide a booking card/link when user asks about flights, buses, hotels or trains. NEVER say "I don't provide links" or "I can't give direct links" — you ALWAYS provide booking options through our partner site.
- Even when user doesn't ask for a link, proactively suggest booking: "Ready to book? Tap the card below!" or "Here's your booking link 👇"
- If user mentions preferences (early morning, budget, comfortable, AC, etc.) mention those preferences in your response before pointing to the card.
- NEVER hallucinate cities or destinations — only answer about what the user actually asked
- NO jokes about money, religion, politics, or anything sensitive
- Be internationally aware — users come from all over the world, not just India

USER CONTEXT:
- Name: ${name}
- Current IST time: ${greeting}
- ${personalContext || "New user, no preferences saved yet"}

GREETING RULES:
- Greet the user ONLY on the very first message of the conversation (when history is empty or has 1 message). On all follow-up messages, do NOT say "Good morning/afternoon/evening" again - just answer directly.
- First message greeting: "${greeting}, ${name}! 👋"
- Use their actual name always — never "there" or "buddy" or "friend"
- If returning user (search count > 3), naturally reference something from their history like "Back for another adventure?" or mention their home city

SMART CONVERSATION UNDERSTANDING:
- ALWAYS understand the FULL CONTEXT of what the user says
- If user gives multiple pieces of info in one message, extract ALL of them
- Example: "5 members, 3 days trip to Goa from Bangalore" → extract: group=5, duration=3days, destination=Goa, origin=Bangalore
- Example: "we are going by train, budget is 20000" → extract: mode=train, budget=20000
- Example: "actually forget trip planning, show hotels in Dubai" → IMMEDIATELY pivot, answer the hotel question, then politely ask if they want to continue the trip plan
- Example: "what's the best time to visit Paris" → answer it, then naturally offer to plan the trip
- NEVER get stuck in a flow — if user says something new, address it FIRST, then offer to continue

ANSWER HIERARCHY (follow this order):
1. First check if answer is in stored knowledge (city info, travel tips, visa, baggage, best times etc)
2. If needs live data → say you'll find the best options and guide them
3. Always answer the ACTUAL question asked — don't deflect

CORE CAPABILITIES:
1. Complete door-to-door trip planning (home area → airport → destination → hotel → activities → back)
2. Flight recommendations and search guidance
3. Bus routes across India and internationally
4. Hotel recommendations worldwide (budget to luxury)
5. Train booking guidance
6. Local transport advice (autos, cabs, metro, buses)
7. Visa and travel document guidance for any country
8. Budget planning and optimization
9. Best time to visit any destination worldwide
10. Weather and seasonal advice
11. Food and cultural tips worldwide
12. Understanding ANY location worldwide — including small towns and areas

DOOR-TO-DOOR PLANNING:
When user wants to plan a trip, collect this info (can be from multiple messages):
- Their EXACT home location (city + area/locality)
- Destination
- Travel dates or duration
- Group size
- Budget
- Purpose (tourism/business/honeymoon etc)
- Preferred travel mode (flight/train/bus/car)

Then plan section by section:
Section 1: Home → Nearest Airport/Station (with exact transport, cost, time)
Section 2: Main transport options (flights/trains/buses with approximate costs)
Section 3: Destination arrival → Hotel (local transport)
Section 4: Hotel recommendations (budget-appropriate)
Section 5: Activities and day-by-day itinerary
Section 6: Full budget breakdown + travel checklist

IMPORTANT RULES:
- Varkala is in Kerala (near Trivandrum). Varanasi is in UP. These are COMPLETELY different cities — never confuse them
- Always double-check city names before responding
- For any unknown location worldwide, use your knowledge to identify nearest airport
- Keep responses SHORT and scannable with bullet points
- End each section with a clear next step or question
- ${tier === "gpt" ? "This is a complex query — give comprehensive detailed response" : "Keep response concise and actionable — save tokens"}`;
}

// ══════════════════════════════════════════════════════════════════════════════
//  AFFILIATE LINK BUILDERS
// ══════════════════════════════════════════════════════════════════════════════
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
  // Using IRCTC — RedBus railways URL format is unreliable
  const TC = {
    "bangalore":"SBC","bengaluru":"SBC","yeshwanthpur":"YPR","mumbai":"CSTM",
    "delhi":"NDLS","new delhi":"NDLS","chennai":"MAS","hyderabad":"SC",
    "kolkata":"HWH","pune":"PUNE","kochi":"ERS","jaipur":"JP","varanasi":"BSB",
    "trivandrum":"TVC","coimbatore":"CBE","madurai":"MDU","mysore":"MYS",
    "nagpur":"NGP","bhopal":"BPL","patna":"PNBE","lucknow":"LKO","agra":"AGC",
    "amritsar":"ASR","chandigarh":"CDG","guwahati":"GHY","ranchi":"RNC",
    "visakhapatnam":"VSKP","vijayawada":"BZA","hubli":"UBL","mangalore":"MAQ",
    "surat":"ST","ahmedabad":"ADI","indore":"INDB","dehradun":"DDN",
    "hosur":"HOS","nagercoil":"NCJ","trichy":"TPJ","salem":"SA","erode":"ED",
    "vellore":"KPD","pondicherry":"PDY","tirunelveli":"TEN","kanyakumari":"CAPE",
  };
  const fc = TC[from?.toLowerCase()] || (from||"").slice(0,4).toUpperCase();
  const tc = TC[to?.toLowerCase()] || (to||"").slice(0,4).toUpperCase();
  let dateParam = "";
  if (dateStr) {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d)) {
        const dd = String(d.getDate()).padStart(2,"0");
        const mm = String(d.getMonth()+1).padStart(2,"0");
        const yyyy = d.getFullYear();
        dateParam = `&journeyDate=${dd}-${mm}-${yyyy}`;
      }
    } catch {}
  }
  return `https://www.irctc.co.in/nget/train-search?fromStation=${fc}&toStation=${tc}&isCallFromDpDown=true${dateParam}&quota=GN&class=SL`;
}

// ══════════════════════════════════════════════════════════════════════════════
//  STORED DATA (Tier 1 — unlimited, no API)
// ══════════════════════════════════════════════════════════════════════════════
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
  "colombo":"1,500–6,000","kathmandu":"800–4,000","maldives":"8,000–40,000",
  "istanbul":"3,000–12,000","rome":"6,000–20,000","barcelona":"5,000–18,000",
};

// ══════════════════════════════════════════════════════════════════════════════
//  QUERY CLASSIFICATION
// ══════════════════════════════════════════════════════════════════════════════
function classifyQuery(msg, prefs) {
  const m = msg.toLowerCase();
  const { from, to } = extractCities(msg);
  const hasRoute = !!(from && to);

  const isGreeting = /^(hi+|hello+|hey+|hlo+|heyy*|namaste|hai|sup|yo|good morning|good afternoon|good evening)/.test(m) || m.length <= 8;
  const isAbout = /what.*alvryn|who.*are.*you|how.*work|is.*free|what.*do.*you|tell.*about/.test(m);
  const isThanks = /^(thank|thanks|thx|ty|great|nice|awesome|perfect|ok|okay|cool|wow|good|super|excellent)/.test(m);
  const isBaggage = /baggage|luggage|kg.*allow|cabin.*bag/.test(m);
  const isVisa = /visa|passport|document.*travel|travel.*document/.test(m);
  const isBestTime = /best.*time|best.*season|best.*month|when.*visit|when.*travel/.test(m);
  const isRefund = /refund|cancel|reschedule|change.*ticket/.test(m);
  const isTravelTip = /travel.*tip|packing.*list|how.*save.*money.*travel/.test(m);
  const isPnr = /pnr|train.*status|running.*status/.test(m);
  const isTatkal = /tatkal|urgent.*ticket/.test(m);
  const isLocalTransport = /vayu vajra|bmtc|namma metro|auto.*fare|metro.*route|how.*reach.*airport/.test(m);

  if (isGreeting || isAbout || isThanks || isBaggage || isVisa ||
      isBestTime || isRefund || isTravelTip || isPnr || isTatkal || isLocalTransport) {
    return "easy";
  }
  if (hasRoute) return "medium";

  const isComplexTrip = /plan.*trip|trip.*plan|itinerary|full.*trip|complete.*trip|door.*to.*door|from.*home.*to|a to z/i.test(m);
  const isHoneymoon = /honeymoon|romantic.*trip|anniversary.*trip/.test(m);
  const isBudgetCombo = /total.*cost|budget.*trip|how.*much.*trip|estimate.*trip/.test(m);
  const isCompareDest = /which.*better|compare.*destination|suggest.*place|where.*should.*go/.test(m);

  if (isComplexTrip || isHoneymoon || isBudgetCombo || isCompareDest) return "hard";
  return "medium";
}

// ══════════════════════════════════════════════════════════════════════════════
//  TIER 1: INSTANT STORED RESPONSES
// ══════════════════════════════════════════════════════════════════════════════
function easyResponse(msg, userName, prefs) {
  const m = msg.toLowerCase().trim();
  const greeting = getISTGreeting();
  const name = userName ? userName.split(" ")[0] : "there";
  const searchCount = parseInt(prefs.search_count || "0");
  const homeCity = prefs.home_city;
  const prefAirline = prefs.preferred_airline;
  const travelStyle = prefs.travel_style;
  const budget = prefs.typical_budget;
  const lastDest = prefs.last_destination;
  const groupSize = prefs.group_size;

  const { from, to } = extractCities(msg);
  const isBusQ = /\bbus\b|buses|coach|sleeper|seater|ksrtc|msrtc|redbus/i.test(m);
  const isHotelQ = /hotel|stay|room|accommodation|resort/i.test(m);
  const isTrainQ = /\btrain\b|railway|irctc|express/i.test(m);

  // GREETING
  if (/^(hi+|hello+|hey+|hlo+|heyy*|namaste|hai|sup|yo|good morning|good afternoon|good evening|goodmorning|goodafternoon|goodevening)/.test(m) || m.length <= 8) {
    let greetMsg = "";

    if (searchCount >= 5) {
      const hints = [
        homeCity ? `Planning from ${homeCity} again? 😄` : "",
        prefAirline ? `I remember you love ${prefAirline}!` : "",
        budget ? `Budget around ₹${parseInt(budget).toLocaleString()} as always?` : "",
        lastDest ? `Last time you were checking out ${lastDest}! Going back? 😏` : "",
        groupSize ? `The ${groupSize}-member squad, back at it? 🎒` : "",
        travelStyle === "solo" ? "Solo traveler mode, activated! 🎒" : "",
        travelStyle === "family" ? "Family trip incoming? 👨‍👩‍👧" : "",
        travelStyle === "couple" ? "Couple goals trip? 💑" : "",
      ].filter(Boolean);
      greetMsg = `${greeting}, ${name}! 👋 Welcome back!\n\n${hints.length ? hints[0] + " " : ""}Where are we going this time? ✈️\n\n_Quick shortcuts:_\n• "flights [city] to [city]"\n• "plan my trip to [destination]"\n• "bus [city] to [city] tonight"`;
    } else if (searchCount >= 2) {
      greetMsg = `Hey ${name}! 👋 Good to have you back!\n\nReady for your next adventure? Just tell me where you want to go — flights, buses, hotels, full trip plans, I got it all! 🌍`;
    } else {
      greetMsg = `${greeting}, ${name}! 👋 Welcome to Alvryn — your AI travel companion!\n\nThink of me as that one friend who's been *everywhere* and actually remembers prices 😄\n\nHere's what I can do:\n✈️ **Flights** — worldwide, best fares\n🚌 **Buses** — all major India routes\n🏨 **Hotels** — budget to luxury\n🚂 **Trains** — IRCTC pre-filled\n🗺️ **Complete trip planning** — door to door, section by section\n\nSo... where are we going? 🌍`;
    }
    return { text: greetMsg, cards: [], cta: null };
  }

  // ABOUT ALVRYN
  if (/what.*alvryn|who.*are.*you|how.*work|is.*free|what.*do.*you/.test(m)) {
    return {
      text: `Alvryn is your AI-powered travel companion — think of it as having a travel expert friend who never sleeps and actually knows their stuff 😄\n\n**How it works:**\n1️⃣ Tell me where you want to go\n2️⃣ I search flights, buses, hotels and trains\n3️⃣ I show you the best options\n4️⃣ You tap to book on our trusted partner site\n\n**Why Alvryn?**\n✅ Completely free to use\n✅ Understands any language, typos, mixed language\n✅ Plans complete door-to-door trips\n✅ Remembers your preferences\n✅ Works worldwide — any destination, any city\n\nAlvryn earns a small commission from partner sites when you book — at zero extra cost to you. 🙏`,
      cards: [], cta: null
    };
  }

  // THANKS
  if (/^(thank|thanks|thx|ty|great|nice|awesome|perfect|ok|okay|cool|wow|amazing|super|excellent)/.test(m)) {
    return {
      text: `You're welcome, ${name}! 😊 Happy to help!\n\nAnything else? I can help with:\n• More flight/bus/hotel searches\n• Trip planning and budgeting\n• Travel tips for your destination\n\nJust ask! ✈️`,
      cards: [], cta: null
    };
  }

  // BAGGAGE
  if (/baggage|luggage|kg.*allow|cabin.*bag|check.?in.*bag/.test(m)) {
    return {
      text: `🧳 **Baggage allowance guide:**\n\n**Domestic India (general):**\n• **IndiGo:** 7kg cabin + 15kg checked\n• **Air India:** 7kg cabin + 15–25kg checked\n• **SpiceJet:** 7kg cabin + 15kg checked\n• **Vistara:** 7kg cabin + 15–20kg checked\n• **Akasa:** 7kg cabin + 15kg checked\n\n**Pro tip:** Book extra baggage *online* when you buy tickets — it's 50–70% cheaper than paying at the airport. Seriously, don't sleep on this 😄\n\nFor international routes, allowances vary by airline and destination — always check your specific booking.`,
      cards: [], cta: null
    };
  }

  // VISA
  if (/visa|passport|document.*travel/.test(m)) {
    return {
      text: `📄 **Visa & Travel Documents:**\n\n**For International Travel (Indian passport):**\n✅ Passport valid 6+ months beyond return date\n✅ Visa for destination country\n✅ Return ticket + hotel booking\n\n**Visa-free / Visa on Arrival for Indians:**\n🇹🇭 Thailand — 30 days free\n🇮🇩 Bali — $35 on arrival\n🇳🇵 Nepal — no visa needed!\n🇱🇰 Sri Lanka — e-visa online\n🇲🇻 Maldives — free on arrival\n🇲🇾 Malaysia — 30 days free\n🇸🇬 Singapore — e-visa required\n🇦🇪 Dubai — visa through airline\n\n**Domestic India travel:** Aadhaar/PAN is enough — no visa anywhere in India!\n\nNeed visa info for a specific country? Just ask! 🌍`,
      cards: [], cta: null
    };
  }

  // BEST TIME
  if (/best.*time|best.*season|when.*visit|when.*travel/.test(m)) {
    const dest = to || from || "";
    const BTG = {
      "goa": "October to March 🌞 (avoid June–September monsoon — beaches are rough)",
      "kerala": "September to March 🌴 (backwaters and beaches at their best)",
      "varkala": "October to March 🌊 (perfect waves and sunny weather — great beach vibes)",
      "munnar": "September to May 🍵 (monsoon July–August is actually beautiful too for misty hills!)",
      "manali": "March–June for adventure 🏔️, December–February for snow ❄️",
      "shimla": "March–June and September–November 🏔️",
      "leh": "June to September ONLY 🏔️ (roads literally close in winter!)",
      "rajasthan": "October to March 🏰 (avoid summer — 48°C is not a joke)",
      "jaipur": "October to March 🏯 (perfect weather for sightseeing)",
      "ooty": "April to June and September–November 🍃",
      "bangalore": "Year-round! 😄 Bangalore weather is basically God's apology for other cities",
      "dubai": "October to April 🌞 (summer = 45°C+ = pure suffering)",
      "singapore": "Year-round! Light preference for February–April 🇸🇬",
      "thailand": "November to April 🌺 (dry season = best beaches)",
      "bali": "April to October 🏝️ (dry season = amazing)",
      "tokyo": "March–May (cherry blossoms 🌸) or October–November (autumn 🍂)",
      "london": "June to August ☀️ (finally gets warm!)",
      "paris": "April to October 🗼 (spring and summer are magical)",
      "maldives": "November to April 🏝️ (dry season — crystal clear water)",
      "default": "October to March is generally the sweet spot for most destinations! 🌟"
    };
    const answer = BTG[dest.toLowerCase()] || BTG["default"];
    return {
      text: `📅 **Best time to visit ${dest ? dest.charAt(0).toUpperCase() + dest.slice(1) : "your destination"}:**\n\n${answer}\n\nWant me to plan a trip there? Just say when! ✈️`,
      cards: [], cta: null
    };
  }

  // CANCELLATION
  if (/refund|cancel|reschedule|change.*ticket/.test(m)) {
    return {
      text: `❌ **Cancellation & Refunds:**\n\nAlvryn is a search and discovery platform — bookings happen on partner sites, so cancellation is managed by the airline/operator directly.\n\n**Flights (general):**\n• Usually ₹3,000–4,500 cancellation fee for domestic\n• Non-refundable fares = no refund (always check before booking!)\n• Cancel 7+ days early = better refund chances\n\n**Buses:**\n• 4+ hours before = 75–90% refund\n• 1–4 hours = 50% refund\n• Under 1 hour = no refund\n\n**Trains (IRCTC):**\n• Cancel on irctc.co.in before departure\n• Tatkal tickets = no refund\n• Refund depends on class and timing\n\n💡 Always read cancellation policy before confirming any booking!`,
      cards: [], cta: null
    };
  }

  // PNR STATUS
  if (/pnr|train.*status|running.*status/.test(m)) {
    return {
      text: `🚂 **Check PNR & Train Status:**\n\n• **Fastest:** Google your PNR number directly — Google shows it instantly!\n• **IRCTC app:** My Bookings section\n• **SMS:** PNR [10-digit number] to 139\n• **Live status:** ntes.indianrail.gov.in\n• **Helpline:** 139\n\n💡 Honestly just Google the PNR — fastest way by far! 😄`,
      cards: [], cta: null
    };
  }

  // TATKAL
  if (/tatkal|urgent.*ticket/.test(m)) {
    return {
      text: `⚡ **Tatkal Booking Guide:**\n\n**Opens:** 1 day before journey\n• AC classes (1A, 2A, 3A): **10:00 AM sharp**\n• Non-AC (Sleeper): **11:00 AM sharp**\n\n**Tatkal charges (extra over base fare):**\n• Sleeper: ₹100–200 extra\n• 3AC: ₹300–400 extra\n• 2AC: ₹400–500 extra\n\n**Tips to actually get it:**\n1. Be on IRCTC at 9:55 AM — don't wait for 10:00!\n2. Pre-fill all passenger details\n3. Keep UPI/card ready — UPI is fastest\n4. IRCTC always crashes at 10 AM — keep refreshing 😅\n\n⚠️ Tatkal = non-refundable if cancelled!`,
      cards: [], cta: null
    };
  }

  // LOCAL AREA TO AIRPORT
  if (/airport|how.*reach.*airport|attibele|electronic city|whitefield|koramangala|hsr|marathahalli|indiranagar|hebbal|yelahanka|majestic|bandra|andheri|noida|gurgaon/.test(m)) {
    const localKeys = Object.keys(LOCAL_AREA_TO_AIRPORT);
    const matchedArea = localKeys.find(k => m.includes(k));
    if (matchedArea) {
      const info = LOCAL_AREA_TO_AIRPORT[matchedArea];
      return {
        text: `🚖 **Getting to ${info.airport} from ${matchedArea.charAt(0).toUpperCase() + matchedArea.slice(1)}:**\n\nDistance: ~${info.distance}\n\n${info.transport}\n\n⏰ **Arrive at airport:**\n• Domestic flights: 2 hours before\n• International flights: 3 hours before\n\nNeed help planning the full trip from here? Just tell me your destination! ✈️`,
        cards: [], cta: null
      };
    }
  }

  // BUS SEARCH
  if (isBusQ && from && to) {
    let buses = BUS_DB.filter(b => b.from === from && b.to === to);
    if (!buses.length) buses = BUS_DB.filter(b => b.to === from && b.from === to);
    if (!buses.length) {
      return {
        text: `🚌 Searching buses from **${from.charAt(0).toUpperCase() + from.slice(1)}** to **${to.charAt(0).toUpperCase() + to.slice(1)}**!\n\nI don't have offline data for this route — here's the live option:`,
        cards: [{
          type: "bus", operator: "Multiple operators",
          from: from.charAt(0).toUpperCase() + from.slice(1),
          to: to.charAt(0).toUpperCase() + to.slice(1),
          departure: "Various", arrival: "Various", price: null,
          label: "Check Live", insight: "Tap to see live availability and prices.",
          link: buildBusLink(from, to)
        }],
        cta: "💡 Live seats and prices on our partner site."
      };
    }
    const prices = buses.map(b => b.price);
    const minP = Math.min(...prices);
    const cards = buses.slice(0, 3).map((b) => ({
      type: "bus", operator: b.op,
      from: from.charAt(0).toUpperCase() + from.slice(1),
      to: to.charAt(0).toUpperCase() + to.slice(1),
      departure: b.dep, arrival: b.arr, price: b.price, busType: b.type,
      label: b.price === minP ? "Cheapest" : null,
      insight: b.price === minP ? "Cheapest on this route!" : null,
      link: buildBusLink(from, to)
    }));
    return {
      text: `🚌 Found **${buses.length} buses** from ${from.charAt(0).toUpperCase() + from.slice(1)} to ${to.charAt(0).toUpperCase() + to.slice(1)}!\n\n💰 Cheapest: **₹${minP}** (${buses.find(b => b.price === minP).op})`,
      cards, cta: "💡 Tap any card to check live seat availability and book!"
    };
  }

  // TRAIN SEARCH
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

  // HOTEL SEARCH
  if (isHotelQ && (from || to)) {
    const city = to || from;
    const cityN = city.charAt(0).toUpperCase() + city.slice(1);
    const pr = HOTEL_PRICES[city.toLowerCase()] || "700–4,000";
    return {
      text: `🏨 Hotels in **${cityN}** — finding the best options!\n\nPrice range: ₹${pr}/night\n\n💡 **${cityN} hotel tips:**\n• Book 2–3 weeks ahead for best rates\n• Read reviews from last 3 months\n• Check if breakfast is included`,
      cards: [{
        type: "hotel", city: cityN, priceRange: pr,
        label: "Best Rates", insight: `Great options in ${cityN} — from budget to luxury.`,
        link: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}`
      }],
      cta: "💡 Tap to browse all hotels with live prices and reviews."
    };
  }

  return null;
}

// ══════════════════════════════════════════════════════════════════════════════
//  TRIP PLANNER STATE MACHINE — SMART CONVERSATION AWARE
// ══════════════════════════════════════════════════════════════════════════════
const tripSessions = new Map();

function getTripSession(sid) { return tripSessions.get(sid) || null; }
function setTripSession(sid, state) {
  tripSessions.set(sid, { ...state, updatedAt: Date.now() });
  // Clean old sessions
  for (const [k, v] of tripSessions) {
    if (Date.now() - v.updatedAt > 7200000) tripSessions.delete(k);
  }
}
function clearTripSession(sid) { tripSessions.delete(sid); }

function detectsTripIntent(message) {
  const m = message.toLowerCase();
  return /plan.*trip|trip.*plan|going to|travel to|visiting|i want to go|i am going|iam going|planning.*trip|help.*trip|plan.*vacation|plan.*holiday|want to visit|thinking.*go/i.test(m);
}

// Smart intent detector — understands what user ACTUALLY means at each step
async function detectStepIntent(message, currentStep, state) {
  const m = message.toLowerCase().trim();

  // Extract all possible info from any message
  const extracted = {
    cities: extractCities(message),
    date: extractDate(message),
    budget: extractBudget(message),
    people: extractPeopleCount(message),
    duration: extractDuration(message),
    purpose: extractPurpose(message),
    travelMode: extractTravelMode(message),
  };

  // Check if user is pivoting to something else entirely
  const isNewTopic = /forget|nevermind|actually|instead|change|different|show me|find me|search|book/i.test(m) &&
    (extracted.cities.to || extracted.cities.from) &&
    extracted.cities.to !== state?.to;

  // Check if message contains location info
  const hasLocation = m.length > 2 && !(/^(yes|no|ok|okay|ya|yep|sure|fine|good|great|next|continue|proceed|go ahead|carry on)$/i.test(m));

  // Check if user is giving a travel mode response
  const hasTravelMode = extracted.travelMode !== null;

  // Check if user is giving purpose info
  const hasPurpose = extracted.purpose !== null;

  // Check if it's a yes/continue signal
  const isContinue = /^(yes|ya|ok|okay|sure|fine|continue|next|proceed|go ahead|show|please|yep|yep|yeah)$/i.test(m.trim());

  return {
    extracted,
    isNewTopic,
    hasLocation,
    hasTravelMode,
    hasPurpose,
    isContinue,
    hasMultipleInfos: !!(extracted.people || extracted.duration || extracted.budget) && currentStep !== "show_section5",
  };
}

async function runTripPlanner(sid, message, userId, userName, prefs) {
  let state = getTripSession(sid) || { step: "start" };
  const m = message.toLowerCase().trim();
  const name = userName ? userName.split(" ")[0] : "there";

  // Detect intent for smart conversation
  const intent = await detectStepIntent(message, state.step, state);

  // If user is pivoting to a completely new topic mid-trip-plan
  if (intent.isNewTopic && state.step !== "start" && state.step !== "ask_destination") {
    // Answer their new question first, then offer to continue
    const newDest = intent.extracted.cities.to || intent.extracted.cities.from;
    const newDestDisplay = newDest ? newDest.charAt(0).toUpperCase() + newDest.slice(1) : "";
    const pr = HOTEL_PRICES[newDest?.toLowerCase()] || "700–4,000";

    const pivotCards = [];
    if (/hotel|stay/i.test(m) && newDest) {
      pivotCards.push({
        type: "hotel", city: newDestDisplay, priceRange: pr,
        label: "Best Rates", insight: `Hotels in ${newDestDisplay}`,
        link: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(newDest)}`
      });
    }

    return {
      text: `Sure! Let me answer that first 😊\n\n${newDest ? `🏨 Hotels in **${newDestDisplay}**: ₹${pr}/night\n\n` : ""}${state.step !== "complete" ? `\n\n---\nBy the way, should I continue planning your ${state.toDisplay ? state.toDisplay + " " : ""}trip from where we left off? 🗺️` : ""}`,
      cards: pivotCards,
      quickReplies: state.toDisplay ? [`Yes, continue ${state.toDisplay} trip plan`, "No, start fresh"] : [],
      isTripPlanner: true
    };
  }

  // Extract any additional info user gave (even if it's not directly answering the question)
  if (intent.extracted.people && !state.groupSize) {
    state = { ...state, groupSize: intent.extracted.people };
    setTripSession(sid, state);
  }
  if (intent.extracted.duration && !state.duration) {
    state = { ...state, duration: intent.extracted.duration };
    setTripSession(sid, state);
  }
  if (intent.extracted.budget && !state.budget) {
    state = { ...state, budget: intent.extracted.budget };
    setTripSession(sid, state);
  }
  if (intent.extracted.travelMode && !state.travelMode) {
    state = { ...state, travelMode: intent.extracted.travelMode };
    setTripSession(sid, state);
  }
  if (intent.extracted.purpose && !state.purpose) {
    state = { ...state, purpose: intent.extracted.purpose };
    setTripSession(sid, state);
  }

  if (state.step === "start") {
    const { from, to } = extractCities(message);

    if (to) {
      setTripSession(sid, {
        step: "ask_home",
        to: to, toDisplay: to.charAt(0).toUpperCase() + to.slice(1),
        groupSize: intent.extracted.people,
        duration: intent.extracted.duration,
        budget: intent.extracted.budget,
        purpose: intent.extracted.purpose || extractPurpose(message),
        travelMode: intent.extracted.travelMode,
      });

      // If we already have a lot of info, acknowledge it
      const knownInfo = [
        intent.extracted.people ? `${intent.extracted.people} people` : "",
        intent.extracted.duration ? `${intent.extracted.duration} days` : "",
        intent.extracted.budget ? `₹${intent.extracted.budget.toLocaleString()} budget` : "",
      ].filter(Boolean).join(", ");

      return {
        text: `${to.charAt(0).toUpperCase() + to.slice(1)} — excellent choice, ${name}! 🌍✈️${knownInfo ? `\n\nGot it — ${knownInfo}.` : ""}\n\nFor complete door-to-door planning, I need your **exact location** — not just city, but your area/locality too.\n\nFor example:\n• "Koramangala, Bangalore"\n• "Andheri, Mumbai"\n• "Keljo, Finland"\n• "Sector 15, Gurgaon"\n\nThe more specific, the better I can plan your airport route! 📍`,
        quickReplies: prefs.home_city ? [`${prefs.home_city} (my saved location)`, "Let me type my location"] : [],
        isTripPlanner: true
      };
    } else {
      setTripSession(sid, {
        step: "ask_destination",
        groupSize: intent.extracted.people,
        duration: intent.extracted.duration,
        budget: intent.extracted.budget,
      });
      return {
        text: `A trip! I love it 🎉 Where are you planning to go, ${name}?\n\nYou can tell me any city or destination — in India or anywhere in the world!`,
        isTripPlanner: true
      };
    }
  }

  if (state.step === "ask_destination") {
    const { from, to } = extractCities(message);
    const dest = to || from;

    if (!dest) {
      // User didn't give a clear destination — maybe gave trip details
      const extraInfo = [];
      if (intent.extracted.people) extraInfo.push(`${intent.extracted.people} people`);
      if (intent.extracted.duration) extraInfo.push(`${intent.extracted.duration} days`);
      if (intent.extracted.budget) extraInfo.push(`budget ₹${intent.extracted.budget.toLocaleString()}`);

      return {
        text: `${extraInfo.length ? `Got it — ${extraInfo.join(", ")}! ` : ""}Now, where do you want to go? 🌍\n\nJust tell me the city or destination — could be Goa, Paris, Tokyo, anywhere!`,
        isTripPlanner: true
      };
    }

    const destDisplay = dest.charAt(0).toUpperCase() + dest.slice(1);
    setTripSession(sid, { ...state, step: "ask_home", to: dest, toDisplay: destDisplay });
    return {
      text: `${destDisplay}! Great choice 😄✈️\n\nNow for complete door-to-door planning — what's your **exact location/area**?\n\nBe specific (area/locality + city) so I can plan your local transport to the airport too! 📍`,
      isTripPlanner: true
    };
  }

  if (state.step === "ask_home") {
    // Always extract ALL info from this message regardless
    const modeInMsg = intent.extracted.travelMode;
    const peopleInMsg = intent.extracted.people;
    const budgetInMsg = intent.extracted.budget;
    const durationInMsg = intent.extracted.duration;
    const purposeInMsg = intent.extracted.purpose;

    // Save any extra info found
    const updatedState = {
      ...state,
      ...(modeInMsg && !state.travelMode ? { travelMode: modeInMsg } : {}),
      ...(peopleInMsg && !state.groupSize ? { groupSize: peopleInMsg } : {}),
      ...(budgetInMsg && !state.budget ? { budget: budgetInMsg } : {}),
      ...(durationInMsg && !state.duration ? { duration: durationInMsg } : {}),
      ...(purposeInMsg && !state.purpose ? { purpose: purposeInMsg } : {}),
    };

    // Try to extract a clean location from the message
    // Strip out travel mode words, trip detail words to find the actual location
    let cleanedForLocation = m
      .replace(/\b(by|via|in|using|through|prefer|want|going|planning|we are|i am|iam|we will|will go|travel by|travelling by|traveling by)\b/gi, " ")
      .replace(/\b(train|flight|bus|car|drive|plane|fly|flying|rail|railway)\b/gi, " ")
      .replace(/\b(members?|people|persons?|adults?|friends?|family|couple|solo|alone)\b/gi, " ")
      .replace(/\b(\d+\s*(days?|nights?|weeks?))\b/gi, " ")
      .replace(/\b(budget|under|below|less than|within|₹|rs\.?)\s*\d+/gi, " ")
      .replace(/\b(tourism|vacation|holiday|honeymoon|business|backpacking|study)\b/gi, " ")
      .replace(/\b(what about|also|and|but|so|actually|i said|i mentioned)\b/gi, " ")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ").trim();

    // Try to find a city/area in the cleaned text
    const { from: locFrom } = extractCities(cleanedForLocation + " placeholder");
    // Also try in CITY_MAP directly for any word in cleaned text
    let foundLocation = locFrom;
    if (!foundLocation) {
      const words = cleanedForLocation.split(/\s+/);
      for (const word of words) {
        if (word.length >= 3 && CITY_MAP[word]) { foundLocation = CITY_MAP[word]; break; }
      }
    }

    // If only travel mode was given and NO location — ask for location
    if (modeInMsg && !foundLocation && cleanedForLocation.replace(/\s/g,"").length < 3) {
      const acknowledgedInfo = [];
      if (modeInMsg) acknowledgedInfo.push(`traveling by **${modeInMsg}**`);
      if (peopleInMsg) acknowledgedInfo.push(`${peopleInMsg} people`);
      if (durationInMsg) acknowledgedInfo.push(`${durationInMsg} days`);
      setTripSession(sid, { ...updatedState });
      return {
        text: `Got it — ${acknowledgedInfo.join(", ")}! 👍\n\nNow I need your **starting location** to plan the complete route. Where are you starting from?\n\nExample: "Hosur", "Koramangala, Bangalore", "Sector 15, Gurgaon"`,
        isTripPlanner: true
      };
    }

    // If message has lots of info but we can't identify a clear location
    if (!foundLocation && cleanedForLocation.replace(/\s/g,"").length < 3) {
      const extraAcknowledge = [];
      if (modeInMsg) extraAcknowledge.push(`by ${modeInMsg}`);
      if (peopleInMsg) extraAcknowledge.push(`${peopleInMsg} people`);
      setTripSession(sid, { ...updatedState });
      return {
        text: `${extraAcknowledge.length ? `Got it — ${extraAcknowledge.join(", ")}! 📝\n\n` : ""}I still need your **exact starting location** (area + city).\n\nJust the location, like: "Hosur", "Electronic City Bangalore", "Bandra Mumbai"`,
        isTripPlanner: true
      };
    }

    // We have a location! Use it.
    let homeLocation;
    if (message.includes("saved location") && prefs.home_city) {
      homeLocation = prefs.home_city;
    } else if (foundLocation) {
      // Use the cleaned location name nicely
      homeLocation = foundLocation.charAt(0).toUpperCase() + foundLocation.slice(1);
      // But also check if the original message had more detail (like "Hosur, Tamil Nadu")
      const origWords = message.split(/[,\s]+/);
      const cityIdx = origWords.findIndex(w => CITY_MAP[w.toLowerCase()] === foundLocation);
      if (cityIdx >= 0) {
        // Try to get surrounding context for more specific location
        const nearbyWords = origWords.slice(Math.max(0,cityIdx-1), cityIdx+2).join(", ").replace(/[^a-zA-Z0-9, ]/g,"").trim();
        if (nearbyWords.length > foundLocation.length) homeLocation = nearbyWords;
      }
    } else {
      // Fallback: use cleaned message as location
      homeLocation = cleanedForLocation.split(/\s+/).slice(0,3).join(" ");
    }

    if (userId) await setUserPref(userId, "home_location", homeLocation);

    // Detect nearest airport
    const localKey = Object.keys(LOCAL_AREA_TO_AIRPORT).find(k => homeLocation.toLowerCase().includes(k) || (foundLocation && foundLocation.toLowerCase().includes(k)));
    const airportInfo = localKey ? LOCAL_AREA_TO_AIRPORT[localKey] : null;

    // Build acknowledgement of all info collected
    const collected = [];
    if (updatedState.travelMode || modeInMsg) collected.push(`mode: **${updatedState.travelMode || modeInMsg}**`);
    if (updatedState.groupSize || peopleInMsg) collected.push(`${updatedState.groupSize || peopleInMsg} people`);
    if (updatedState.duration || durationInMsg) collected.push(`${updatedState.duration || durationInMsg} days`);
    if (updatedState.budget || budgetInMsg) collected.push(`₹${(updatedState.budget || budgetInMsg).toLocaleString()} budget`);

    setTripSession(sid, { ...updatedState, step: "ask_purpose", homeLocation, airportInfo });

    return {
      text: `📍 Starting from **${homeLocation}**!${collected.length ? `\n\n✅ Also noted — ${collected.join(", ")}` : ""}\n\n${airportInfo ? `✈️ Nearest airport: **${airportInfo.airport}**` : "I'll find your nearest airport for the plan!"}\n\nWhat's the **purpose** of this trip? 🎯`,
      quickReplies: ["🏖️ Tourism / Vacation", "💼 Business", "👨‍👩‍👧 Family Visit", "💑 Honeymoon / Romantic", "🎒 Backpacking / Budget", "🎓 Study / Education"],
      isTripPlanner: true
    };
  }

  if (state.step === "ask_purpose") {
    // Check if user gave purpose OR gave other trip info instead
    let purpose = state.purpose || "tourism";
    if (/business|work|meeting/i.test(m)) purpose = "business";
    else if (/family|relative|parents/i.test(m)) purpose = "family";
    else if (/honeymoon|romantic|couple/i.test(m)) purpose = "honeymoon";
    else if (/backpack|budget|solo/i.test(m)) purpose = "backpacking";
    else if (/study|education|college/i.test(m)) purpose = "education";
    else if (/vacation|tourism|tourist|leisure|holiday/i.test(m)) purpose = "vacation";

    // If user gave trip details like "5 members 3 days" skip purpose to dates
    if (intent.hasMultipleInfos && !intent.hasPurpose) {
      const extraInfo = [];
      if (state.groupSize || intent.extracted.people) extraInfo.push(`${state.groupSize || intent.extracted.people} people`);
      if (state.duration || intent.extracted.duration) extraInfo.push(`${state.duration || intent.extracted.duration} days`);
      setTripSession(sid, { ...state, step: "ask_dates", purpose: "vacation", ...((state.groupSize||intent.extracted.people)?{groupSize:state.groupSize||intent.extracted.people}:{}), ...((state.duration||intent.extracted.duration)?{duration:state.duration||intent.extracted.duration}:{}) });
      return {
        text: `Got all that — ${extraInfo.join(", ")} trip! 😄\n\n**When are you planning to travel?** 📅\n\nApproximate dates are fine!`,
        quickReplies: ["This weekend", "Next week", "Next month", "In 2–3 months", "Not decided yet"],
        isTripPlanner: true
      };
    }

    setTripSession(sid, { ...state, step: "ask_dates", purpose });
    return {
      text: `${purpose === "honeymoon" ? "Aww, romantic trip! 💑" : purpose === "backpacking" ? "Budget warrior mode! 🎒" : purpose === "business" ? "Business trip — let's keep it efficient! 💼" : "Perfect!"}\n\n**When are you planning to travel?** 📅\n\nApproximate dates are fine too!`,
      quickReplies: ["This weekend", "Next week", "Next month", "In 2–3 months", "Not decided yet"],
      isTripPlanner: true
    };
  }

  if (state.step === "ask_dates") {
    setTripSession(sid, { ...state, step: "ask_budget", travelDate: message });

    // Skip budget question if we already have it
    if (state.budget || intent.extracted.budget) {
      const budget = state.budget || intent.extracted.budget;
      setTripSession(sid, { ...state, step: "show_section1", travelDate: message, budget });
      // Go straight to section 1
      const { homeLocation, airportInfo, toDisplay } = state;
      const airportText = airportInfo
        ? `🚖 **From ${homeLocation} → ${airportInfo.airport}:**\n\n${airportInfo.transport}\n\n📏 Distance: ${airportInfo.distance}`
        : `🚖 **Getting to your nearest airport from ${homeLocation}:**\n\nFor your exact local transport options, check Google Maps for the nearest airport. Book a cab or use local transport at least 3 hours before international flights and 2 hours before domestic.`;
      return {
        text: `✈️ **SECTION 1 of 6 — Getting to the Airport**\n\n${airportText}\n\n⏰ **Arrive at airport:**\n• Domestic flights: **2 hours** before\n• International flights: **3 hours** before\n\n---\nReady for **Section 2 — Flights**? 🛫`,
        quickReplies: ["Yes, show me flights ✈️", "I have a question about getting to airport"],
        sectionNum: 1, totalSections: 6, isTripPlanner: true
      };
    }

    return {
      text: `📅 Noted — **${message}**!\n\nWhat's your **total budget** for this trip? (flights + hotel + activities, per person)\n\n💡 Even a rough range helps!`,
      quickReplies: ["Under ₹10,000", "₹10,000 – ₹30,000", "₹30,000 – ₹60,000", "₹60,000 – ₹1,50,000", "Above ₹1,50,000", "International — show all options"],
      isTripPlanner: true
    };
  }

  if (state.step === "ask_budget") {
    const budget = extractBudget(message) || message;
    if (userId) await setUserPref(userId, "typical_budget", String(budget));

    setTripSession(sid, { ...state, step: "show_section1", budget });

    const { homeLocation, airportInfo, toDisplay } = state;
    const airportText = airportInfo
      ? `🚖 **From ${homeLocation} → ${airportInfo.airport}:**\n\n${airportInfo.transport}\n\n📏 Distance: ${airportInfo.distance}`
      : `🚖 **Getting to your nearest airport from ${homeLocation}:**\n\nFor your exact route, check Google Maps for nearest airport. General advice: Book transport 2–3 hours before departure time.`;

    return {
      text: `✈️ **SECTION 1 of 6 — Getting to the Airport**\n\n${airportText}\n\n⏰ **Arrive at airport:**\n• Domestic flights: **2 hours** before\n• International flights: **3 hours** before\n\n---\nReady for **Section 2 — Flights**? 🛫`,
      quickReplies: ["Yes, show me flights ✈️", "I have a question"],
      sectionNum: 1, totalSections: 6, isTripPlanner: true
    };
  }

  if (state.step === "show_section1") {
    // User said yes/continue or asked a question
    if (!intent.isContinue && !(/flight|fly|plane/i.test(m))) {
      // They asked something — answer with Groq then continue
      return null; // Let main AI handle it and then offer to continue
    }

    setTripSession(sid, { ...state, step: "show_section2" });
    const { to, toDisplay, budget, travelMode, groupSize } = state;
    const fromCity = prefs.home_city || state.homeLocation?.split(",").pop()?.trim() || "your city";
    const fc = CITY_TO_IATA[fromCity?.toLowerCase()] || fromCity?.slice(0, 3).toUpperCase() || "BLR";
    const tc = CITY_TO_IATA[to?.toLowerCase()] || to?.slice(0, 3).toUpperCase() || "BOM";
    const isIndia = INDIA_IATA.has(fc) && INDIA_IATA.has(tc);
    const flightLink = buildAffiliateFlightLink(fromCity, to);
    const budgetNum = typeof budget === "string" ? (extractBudget(budget) || 0) : (budget || 0);
    const mode = travelMode || "flight";

    let sectionText = "";
    const cards = [];

    if (mode === "train") {
      sectionText = `🚂 **SECTION 2 of 6 — Train Options**\n\n🛤️ **${fromCity.charAt(0).toUpperCase() + fromCity.slice(1)} → ${toDisplay}** by train\n\n💰 **Estimated train cost:**\n• Sleeper (SL): ₹150–400\n• 3AC: ₹400–800\n• 2AC: ₹700–1,500\n\n📅 Book 60 days in advance for best availability!\n💡 Book early morning trains — less delays, cooler weather`;
      cards.push({
        type: "train", from: fromCity.charAt(0).toUpperCase() + fromCity.slice(1), to: toDisplay,
        label: "IRCTC", insight: "Route pre-filled on IRCTC — just select class and pay!",
        link: buildTrainLink(fromCity, to, null)
      });
    } else if (mode === "bus") {
      sectionText = `🚌 **SECTION 2 of 6 — Bus Options**\n\n🚌 **${fromCity.charAt(0).toUpperCase() + fromCity.slice(1)} → ${toDisplay}** by bus\n\n💰 **Estimated bus cost:** ₹${isIndia ? "300–1,500" : "Varies"}\n\n💡 Book overnight AC Sleeper — saves accommodation cost!\n📅 Book 3–5 days ahead for best seats`;
      cards.push({
        type: "bus", operator: "Multiple operators",
        from: fromCity.charAt(0).toUpperCase() + fromCity.slice(1), to: toDisplay,
        departure: "Various", arrival: "Various", price: null,
        label: "Check Live", insight: "Live availability on our partner site.",
        link: buildBusLink(fromCity, to)
      });
    } else {
      sectionText = `✈️ **SECTION 2 of 6 — Flights**\n\n🛫 **${fromCity.charAt(0).toUpperCase() + fromCity.slice(1)} → ${toDisplay}**\n\n${!isIndia ? `💰 **Estimated flight cost:** ₹${budgetNum > 50000 ? "35,000–80,000" : "25,000–60,000"} return\n✈️ Most international routes have 1 layover\n📅 Book **6–8 weeks early** for best prices\n💡 **Tuesday/Wednesday flights** are typically 15–25% cheaper` : `💰 **Estimated flight cost:** ₹2,500–6,000 one way\n📅 Book **3–5 weeks early** for best prices\n💡 **Early morning (5–8 AM) flights** are usually cheapest`}${groupSize ? `\n👥 For ${groupSize} people — book all together for group savings` : ""}`;
      cards.push({
        type: "flight", airline: "Multiple Airlines",
        from: fromCity.charAt(0).toUpperCase() + fromCity.slice(1), to: toDisplay,
        fromCode: fc, toCode: tc,
        departure: "—", arrival: "—", duration: isIndia ? "Direct" : "Check live",
        price: null, label: "Live Fares",
        insight: "Tap to compare all airlines and find the best price.",
        link: flightLink
      });
    }

    return {
      text: sectionText,
      cards,
      quickReplies: ["Yes, show Section 3 🏨", "I have a question about travel options"],
      sectionNum: 2, totalSections: 6, isTripPlanner: true
    };
  }

  if (state.step === "show_section2") {
    setTripSession(sid, { ...state, step: "show_section3" });
    const { to, toDisplay } = state;

    const destTransport = {
      "dubai": "🚇 Dubai Metro Red Line from airport — cheapest (₹60–120)\n🚖 Taxi — ₹600–1,200 depending on hotel location\n💡 Get Nol card for metro — saves time and money",
      "singapore": "🚇 MRT from Changi Airport — easiest (S$2.50 ~₹160)\n🚖 Grab — S$20–30 (~₹1,200–1,800)\n💡 MRT is seriously the best way — Changi station is right in the airport!",
      "bangkok": "🚇 Airport Rail Link — cheapest (45 baht ~₹100)\n🚖 Grab — ฿200–500 (~₹400–1,000)\n💡 Grab is safer than unmetered taxis at Bangkok airport",
      "tokyo": "🚆 Narita Express (N'EX) — ¥3,070 (~₹1,700)\n✈️ If flying into Haneda — Tokyo Monorail is cheaper\n💡 Get IC card (Suica/Pasmo) for all transport in Tokyo",
      "london": "🚇 Heathrow Express — £25 (~₹2,700, 15 min fastest)\n🚇 Piccadilly Line — £5.60 (~₹600, slower but cheap)\n🚖 Uber — £45–70 (~₹4,800–7,500)\n💡 Piccadilly Line is fine unless you're rushing",
      "paris": "🚆 RER B from CDG — €11.80 (~₹1,050, 35 min)\n🚖 Uber — €35–55 (~₹3,200–5,000)\n💡 RER B drops you right at major stations like Gare du Nord",
      "goa": "🚖 Prepaid taxi — ₹500–900 depending on location\n🚌 Local bus available but limited schedule\n💡 Pre-book taxi for late night arrivals",
      "kochi": "🚖 Ola/Uber — ₹400–700\n🚌 KSRTC bus — ₹50–80 (slow but super cheap!)\n💡 Pre-book if arriving late",
      "mumbai": "🚇 Metro Line 1 + cab combo\n🚖 Ola/Uber — ₹300–700\n💡 T1 (domestic) and T2 (international) are far apart — know your terminal!",
      "delhi": "🚇 Airport Express Metro — ₹60–100 (fastest, runs till midnight)\n🚖 Cab — ₹300–700\n💡 Metro to New Delhi station then change — very convenient",
      "default": `🚖 Cab/taxi from ${toDisplay} airport — most convenient on arrival\n💡 Download local ride-sharing app before landing for better rates!`,
    };

    const transport = destTransport[to?.toLowerCase()] || destTransport["default"];

    return {
      text: `🗺️ **SECTION 3 of 6 — ${toDisplay} Airport → Hotel**\n\n${transport}\n\n💡 **Pro tip:** Book airport transfer in advance for late-night arrivals — safer and often cheaper!\n\n---\nReady for **Section 4 — Hotels**? 🏨`,
      quickReplies: ["Yes, show hotels 🏨", `Tell me more about transport in ${toDisplay}`],
      sectionNum: 3, totalSections: 6, isTripPlanner: true
    };
  }

  if (state.step === "show_section3") {
    setTripSession(sid, { ...state, step: "show_section4" });
    const { to, toDisplay, purpose, budget, groupSize } = state;
    const cityKey = to?.toLowerCase() || "";
    const pr = HOTEL_PRICES[cityKey] || "700–5,000";
    const budgetNum = typeof budget === "string" ? (extractBudget(budget) || 0) : (budget || 0);

    const hotelTips = {
      "goa": "🏖️ **Goa hotel tips:**\n• North Goa = parties, nightlife, Baga/Calangute area\n• South Goa = peaceful, cleaner beaches, Palolem area\n• Book **4+ weeks early** in peak season (Dec–Feb)",
      "dubai": "🏙️ **Dubai hotel tips:**\n• Downtown = near Burj Khalifa and Dubai Mall\n• JBR/Marina = beachfront, great for families\n• Many hotels include breakfast — look for it!",
      "singapore": "🦁 **Singapore hotel tips:**\n• Marina Bay area = tourist hub, central location\n• Chinatown = budget options + great food nearby\n• Weekdays are significantly cheaper than weekends",
      "tokyo": "⛩️ **Tokyo hotel tips:**\n• Shinjuku or Shibuya = most central\n• Capsule hotels = unique experience, very budget-friendly\n• Book **3+ months early** — Tokyo fills up fast!",
      "bali": "🌺 **Bali hotel tips:**\n• Seminyak = beach + nightlife\n• Ubud = culture + rice terraces (perfect for couples)\n• Villas with private pool are surprisingly affordable here!",
      "kerala": "🌴 **Kerala hotel tips:**\n• Houseboat stay in Alleppey = must-do experience\n• Kovalam/Varkala for beach stays\n• Munnar for hill station feel",
      "varkala": "🌊 **Varkala hotel tips:**\n• Cliff area = best views and restaurants\n• North Cliff = more backpacker friendly\n• Book ahead in Dec–Feb — fills up fast!",
      "default": `🏨 **${toDisplay} hotel tips:**\n• Book early for best rates\n• Read reviews from last 3 months only\n• Look for free cancellation option for flexibility`,
    };

    const tip = hotelTips[cityKey] || hotelTips["default"];

    return {
      text: `🏨 **SECTION 4 of 6 — Hotels in ${toDisplay}**\n\n${tip}\n\n💰 **Price range:** ₹${pr}/night\n${groupSize ? `👥 For ${groupSize} people — consider a villa or apartment for better value!` : ""}\n${purpose === "honeymoon" ? "\n💑 For honeymoon — look for private villas or sea-view rooms with couple packages!" : purpose === "backpacking" ? "\n🎒 For budget travel — hostels start from ₹500–1,500/night!" : ""}`,
      cards: [{
        type: "hotel", city: toDisplay, priceRange: pr,
        label: purpose === "honeymoon" ? "Romantic Stay" : purpose === "backpacking" ? "Budget Friendly" : "Best Rates",
        insight: `Great options in ${toDisplay} for every budget.`,
        link: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(to || toDisplay)}`
      }],
      quickReplies: ["Yes, show activities 🗺️", "I need a cheaper hotel option"],
      sectionNum: 4, totalSections: 6, isTripPlanner: true
    };
  }

  if (state.step === "show_section4") {
    setTripSession(sid, { ...state, step: "show_section5" });
    const { to, toDisplay, purpose, duration } = state;

    const systemMsg = `You are Alvryn AI travel guide. Give a SHORT, exciting list of must-do activities and places in ${toDisplay} for ${purpose || "tourism"} travel${duration ? ` for ${duration} days` : ""}. Use emojis. Be specific with place names. Mention approximate costs in local currency and INR where helpful. Max 10 bullet points. No competitor platform names.`;
    const groqReply = await callGroq(`Top activities and places to visit in ${toDisplay} for ${purpose || "tourism"} traveler${duration ? `, ${duration} days` : ""}`, systemMsg, 350);

    const fallback = `🗺️ **Things to do in ${toDisplay}:**\n\n• Explore the main attractions and landmarks\n• Try authentic local street food — always the highlight!\n• Visit at least one local market\n• Take a guided tour for historical context\n• Explore neighborhoods away from tourist hotspots\n\n💡 Ask me about specific things to do in ${toDisplay} for more detailed recommendations!`;

    return {
      text: `🗺️ **SECTION 5 of 6 — Activities & Places in ${toDisplay}**\n\n${groqReply || fallback}\n\n---\nAlmost done! **Section 6: Budget Breakdown + Checklist** 📋`,
      quickReplies: ["Yes, show budget & checklist ✅"],
      sectionNum: 5, totalSections: 6, isTripPlanner: true
    };
  }

  if (state.step === "show_section5") {
    const { to, toDisplay, homeLocation, purpose, travelDate, budget, groupSize, duration, travelMode } = state;
    const isIntl = !INDIA_IATA.has(CITY_TO_IATA[to?.toLowerCase()] || "");
    clearTripSession(sid);

    const checklist = isIntl
      ? `✅ Passport (6+ months validity)\n✅ Visa (apply 3–4 weeks early!)\n✅ Travel insurance\n✅ Flight tickets\n✅ Hotel booking confirmation\n✅ International debit/credit card (zero forex fee)\n✅ Download offline maps for ${toDisplay}\n✅ Local currency (small amount for arrival)\n✅ Emergency contacts saved offline\n✅ Check airline baggage rules`
      : `✅ Aadhaar / PAN (valid photo ID)\n✅ Flight / bus / train ticket\n✅ Hotel confirmation\n✅ UPI + some cash\n✅ Download offline maps\n✅ Portable charger\n✅ Basic medicines\n✅ Check weather for packing`;

    const budgetSummary = budget
      ? `💰 **Your budget:** ${typeof budget === "number" ? `₹${budget.toLocaleString()}` : budget} per person${groupSize ? ` × ${groupSize} people` : ""}`
      : "";

    return {
      text: `📋 **SECTION 6 of 6 — Budget & Checklist**\n\n**Your trip summary:**\n📍 ${homeLocation} → ${toDisplay}\n${travelDate ? `📅 Travel: ${travelDate}` : ""}${duration ? `\n🗓️ Duration: ${duration} days` : ""}${groupSize ? `\n👥 Group: ${groupSize} people` : ""}\n🎯 Purpose: ${purpose || "vacation"}\n${travelMode ? `🚀 Mode: ${travelMode}` : ""}\n${budgetSummary}\n\n**Pre-travel checklist:**\n${checklist}\n\n---\n🎉 **Your complete trip plan is ready, ${name}!**\n\nShould I search flights or hotels for this trip right now? Just say the word! ✈️`,
      sectionNum: 6, totalSections: 6, isTripPlanner: true
    };
  }

  return null;
}

// ══════════════════════════════════════════════════════════════════════════════
//  DAILY AI CALL LIMITS
// ══════════════════════════════════════════════════════════════════════════════
const dailyAiCalls = new Map();
const GROQ_DAILY_LIMIT = 20;
const GPT_DAILY_LIMIT = 5;

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

  if (isBus && from && to) return [{ type: "bus", operator: "Multiple operators", from: fN, to: tN, departure: "Various", arrival: "Various", price: null, label: "Check Live", insight: "Tap to see live seats.", link: buildBusLink(from, to) }];
  if (isTrain && from && to) return [{ type: "train", from: fN, to: tN, label: "IRCTC", insight: "Route pre-filled on IRCTC.", link: buildTrainLink(from, to, date?.toISOString().split("T")[0]) }];
  if (isHotel && (from || to)) {
    const city = to || from;
    const pr = HOTEL_PRICES[city?.toLowerCase()] || "700–4,000";
    return [{ type: "hotel", city: tN || fN, priceRange: pr, label: "Best Rates", insight: "Live prices on partner site.", link: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}` }];
  }
  if (from && to) return [{ type: "flight", airline: "Multiple Airlines", from: fN, to: tN, fromCode: CITY_TO_IATA[from] || from.slice(0, 3).toUpperCase(), toCode: CITY_TO_IATA[to] || to.slice(0, 3).toUpperCase(), departure: "—", arrival: "—", duration: "Check live", price: null, label: "Live Fares", insight: "Compare all airlines.", link: buildAffiliateFlightLink(from, to, ddmm) }];
  return [];
}

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN AI CHAT ENDPOINT
// ══════════════════════════════════════════════════════════════════════════════
app.post("/ai-chat-v2", authenticateToken, async (req, res) => {
  const { message, history = [], sessionId } = req.body || {};
  if (!message) return res.status(400).json({ message: "No message" });

  const userId = req.user?.id;
  const sid = sessionId || `web_${userId}_${Date.now()}`;

  try {
    let userName = "";
    try {
      const userResult = await pool.query("SELECT name FROM users WHERE id=$1", [userId]);
      userName = userResult.rows[0]?.name || "";
    } catch {}

    const prefs = userId ? await getUserPrefs(userId) : {};
    updateUserMemory(userId, message).catch(() => {});

    // ── CHECK ONGOING TRIP PLANNER ────────────────────────────────────────────
    const existingSession = getTripSession(sid);
    if (existingSession && existingSession.step !== "complete") {
      const tripResult = await runTripPlanner(sid, message, userId, userName, prefs);
      if (tripResult) {
        logEvent("ai_trip", `step:${existingSession.step}`, "ai_chat", userId).catch(() => {});
        return res.json({ ...tripResult, sessionId: sid });
      }
      // tripResult is null = user asked something outside trip flow, fall through to answer it
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

      // After answering, if there's an ongoing trip session, offer to continue
      const ongoingSession = getTripSession(sid);
      if (ongoingSession && ongoingSession.step !== "complete" && ongoingSession.toDisplay) {
        easy.text += `\n\n---\n🗺️ By the way, should I continue planning your **${ongoingSession.toDisplay}** trip from where we left off?`;
        easy.quickReplies = [`Yes, continue ${ongoingSession.toDisplay} trip`, "No, that's fine"];
      }

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
              insight: row.price === minP ? `Cheapest! Save ₹${maxP - minP} vs other options.` : null,
              link: buildAffiliateFlightLink(f, t, ddmm2)
            };
          });
          const cheapest = rows.reduce((a, b) => a.price < b.price ? a : b);
          const dep = new Date(cheapest.departure_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
          return res.json({
            text: `✈️ Found **${rows.length} flights** from ${f.charAt(0).toUpperCase() + f.slice(1)} to ${t.charAt(0).toUpperCase() + t.slice(1)}!${date ? " on " + date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}\n\n💰 Cheapest: **₹${minP.toLocaleString()}** — ${cheapest.airline} at ${dep}${budget && minP > budget ? "\n\n⚠️ All options are above your budget. Want me to suggest buses instead?" : ""}`,
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
      const cards = buildCards(message, f, t, date);
      return res.json({
        text: `You've used your ${GROQ_DAILY_LIMIT} AI responses for today, ${userName ? userName.split(" ")[0] : ""}! 🎯\n\n✅ **Still unlimited:** Basic travel info, tips, destinations, FAQs, bus/train search\n🔓 **To unlock more:** Book a trip via Alvryn and get unlimited AI responses!\n\nHere are the best options I found 👇`,
        cards, cta: "💡 Book via Alvryn to unlock unlimited AI responses.",
        sessionId: sid
      });
    }

    const cards = buildCards(message, f, t, date);

    // Extract ALL user constraints
    const _gm = message.match(/(\d+)\s*(friends?|people|persons?|members?|of us|pax)/i);
    const _bm = message.match(/(?:budget|under|within)[\s:]*[₹Rs.]*\s*([\d,]+)/i) || message.match(/[₹]\s*([\d,]+)/i);
    const _veg = /vegetarian|vegan|\bveg\b|no meat/i.test(message);
    const _late = /arrives?\s*(a\s*day|one\s*day)?\s*late|different\s*arrival|separate\s*arrival/i.test(message);
    const _beach = /beach/i.test(message) && /over nightlife|not nightlife|avoid party/i.test(message);
    const _transfer = /airport.*transfer|cab.*airport/i.test(message);
    const _grp = _gm ? parseInt(_gm[1]) : null;
    const _bgt = _bm ? parseInt(_bm[1].replace(/,/g,"")) : null;
    const _cx = [];
    if (_grp > 1) _cx.push(`Group: ${_grp} people`);
    if (_bgt) _cx.push(`Budget: ₹${_bgt.toLocaleString()}/person${_grp ? ` = ₹${(_bgt*_grp).toLocaleString()} total` : ""}`);
    if (_veg) _cx.push("Vegetarians in group — mention veg-friendly options explicitly");
    if (_late) _cx.push("IMPORTANT: one person arrives late — give them a SEPARATE arrival plan");
    if (_beach) _cx.push("Preference: beaches NOT nightlife — recommend quiet beach spots");
    if (_transfer) _cx.push("Need airport transfer — include cab cost from airport");
    let dataContext = _cx.length > 0
      ? "\n\n[MUST address ALL these in your response:\n" + _cx.map(c=>"• "+c).join("\n") + "\n]"
      : "";
    if (cards.length > 0) {
      dataContext = "\n\nTravel data found:";
      cards.forEach(c => {
        if (c.type === "flight") dataContext += ` Flight: ${c.from}→${c.to} ${c.departure || ""} ₹${c.price || "live"}.`;
        if (c.type === "bus") dataContext += ` Bus: ${c.from}→${c.to} ₹${c.price || "live"}.`;
        if (c.type === "hotel") dataContext += ` Hotels in ${c.city}: ₹${c.priceRange}/night.`;
      });
    }

    // Add conversation history context
    const historyContext = history.slice(-4).map(h =>
      `${h.role === "user" ? "User" : "AI"}: ${(h.content || h.text || "").slice(0, 150)}`
    ).join("\n");

    const systemPrompt = buildSystemPrompt(userName, prefs, tier === "hard" ? "gpt" : "groq");
    const userPrompt = (historyContext ? `Previous conversation:\n${historyContext}\n\nCurrent message: ` : "") + message + dataContext;

    // Check if there's an ongoing trip session to mention
    const ongoingTripSession = getTripSession(sid);
    const tripContext = ongoingTripSession?.toDisplay
      ? `\n\nNote: User has an ongoing trip plan for ${ongoingTripSession.toDisplay}. After answering their question, offer to continue the trip plan.`
      : "";

    incrementAi(userId, "groq");
    const remaining = GROQ_DAILY_LIMIT - getAiCount(userId, "groq");

    let aiText = null;

    if (tier === "hard" && process.env.OPENAI_API_KEY) {
      aiText = await callGPT(userPrompt, systemPrompt + tripContext, 600);
    }

    if (!aiText) {
      aiText = await callGroq(userPrompt, systemPrompt + tripContext, 1800);
    }

    if (aiText) {
  const limitNote = remaining <= 3
    ? `\n\n_💡 ${remaining} AI response${remaining === 1 ? "" : "s"} left today — book via Alvryn to unlock more!_`
    : "";

  // ── SAFETY INSIGHTS (auto-appended for all tiers) ──────────────────────
  let safetyInsight = ""
  try {
    const isTravelQuery = f && t &&
      !/^(hi|hello|hey|thanks|ok|okay|yes|no|good|great)$/i.test(message.trim());
    const destCity = t || f;

    if (destCity && isTravelQuery && app.locals.buildSafetyInsight) {
      const userPlan = await app.locals.getUserPlan?.(userId) || "explorer";
      const womenTraveler = /\bwomen?\b|\bsolo\s+girl\b|\bfemale\b|\blady\b|\bladies\b/i.test(message);
      safetyInsight = await app.locals.buildSafetyInsight(
        destCity, userPlan, { womenTraveler }
      ) || "";
    }
  } catch { safetyInsight = ""; }
  // ────────────────────────────────────────────────────────────────────────

  logEvent("ai_groq", message.slice(0, 80), "ai_chat", userId).catch(() => {});
  return res.json({
    text: aiText + safetyInsight + limitNote,
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

// ══════════════════════════════════════════════════════════════════════════════
//  ADMIN ROUTES
// ══════════════════════════════════════════════════════════════════════════════
app.get("/admin/bookings", async (req, res) => {
  try { const r = await pool.query("SELECT * FROM bookings ORDER BY created_at DESC LIMIT 200"); res.json(r.rows); }
  catch (e) { res.status(500).json({ message: "Server error" }); }
});

app.get("/admin/users", async (req, res) => {
  try { const r = await pool.query("SELECT id,name,email,phone,plan,created_at FROM users ORDER BY id DESC LIMIT 200"); res.json(r.rows); }
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

// ── WhatsApp ──────────────────────────────────────────────────────────────────
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
    const groqReply = await callGroq(rawMsg,
      `You are Alvryn AI WhatsApp travel assistant. Reply SHORT (max 300 chars). Use *bold* for emphasis. Focus on travel: flights, hotels, visas, transport. IST time: ${getISTGreeting()}. Never mention other travel platforms.`,
      200
    );
    reply = groqReply || "I can help with flights, buses, hotels and trips! Type *help* for menu. 😊";
  }

  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(reply.slice(0, 600));
  res.type("text/xml").send(twiml.toString());
});

// ── Mount server2 routes ──────────────────────────────────────────────────────
require("./server2.js")(app, pool);
require("./server_plans.js")(app, pool);
require("./server_safety.js")(app, pool);
require("./server_checkin.js")(app, pool);
require("./server_auth_recovery.js")(app, pool, resend);

// ── START SERVER ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`ALVRYN BACKEND running on port ${PORT}`);
});