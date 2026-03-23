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

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

console.log("ALVRYN SERVER STARTED");

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
function authenticateToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token required" });
  jwt.verify(token, process.env.JWT_SECRET || "secretkey", (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user; next();
  });
}

// ─── REF CODE GENERATOR ───────────────────────────────────────────────────────
function generateRefCode(name) {
  const base = (name || "user").replace(/[^a-zA-Z0-9]/g,"").slice(0,6).toUpperCase();
  return base + Math.random().toString(36).slice(2,6).toUpperCase();
}

// ─── SMART DATE PARSER ────────────────────────────────────────────────────────
// Understands broken English, Hindi words, typos, relative dates
function parseSmartDate(text) {
  const t = text.toLowerCase().trim();
  const now = new Date();

  // Hindi / Hinglish words
  if (/\baaj\b/.test(t) || /\btoday\b/.test(t) || /\btoday'?s?\b/.test(t) || /\bnow\b/.test(t)) {
    return new Date(now);
  }
  if (/\bkal\b/.test(t) || /\btomorro?w\b/.test(t) || /\btmrw\b/.test(t) || /\btmlw\b/.test(t) || /\btomarrow\b/.test(t)) {
    const d = new Date(now); d.setDate(d.getDate()+1); return d;
  }
  if (/\bparso\b/.test(t) || /\bday after tomorro?w\b/.test(t) || /\bdat\b/.test(t)) {
    const d = new Date(now); d.setDate(d.getDate()+2); return d;
  }

  // "in X days"
  const inDays = t.match(/in\s*(\d+)\s*days?/);
  if (inDays) { const d = new Date(now); d.setDate(d.getDate()+parseInt(inDays[1])); return d; }

  // "next week"
  if (/next\s*week/.test(t)) { const d = new Date(now); d.setDate(d.getDate()+7); return d; }

  // "this weekend" / "weekend"
  if (/\bweekend\b/.test(t) || /\bsaturday\b/.test(t)) {
    const d = new Date(now);
    const daysUntilSat = (6 - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate()+daysUntilSat); return d;
  }

  // Day names: "coming friday", "next friday", "this friday", "friday"
  const dayNames = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  const dayAbbr  = ["sun","mon","tue","wed","thu","fri","sat"];
  for (let i=0; i<7; i++) {
    if (t.includes(dayNames[i]) || t.includes(dayAbbr[i])) {
      const d = new Date(now);
      let diff = i - d.getDay();
      // "next X" or "coming X" always means the one after upcoming
      if (/next\s/.test(t) || /coming\s/.test(t)) {
        if (diff <= 0) diff += 7;
        diff += 7; // truly next
      } else {
        if (diff <= 0) diff += 7;
      }
      d.setDate(d.getDate()+diff); return d;
    }
  }

  // Specific date formats: "25 march", "march 25", "25/3", "25-3-2026"
  const months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
  for (let m=0; m<12; m++) {
    const re = new RegExp(`(\\d{1,2})\\s*${months[m]}`, "i");
    const re2 = new RegExp(`${months[m]}\\w*\\s*(\\d{1,2})`, "i");
    const match = t.match(re) || t.match(re2);
    if (match) {
      const day = parseInt(match[1]);
      const d = new Date(now.getFullYear(), m, day);
      if (d < now) d.setFullYear(d.getFullYear()+1);
      return d;
    }
  }

  // "yesterday" or past — return null (will handle in routes)
  if (/\byesterday\b/.test(t) || /\bkal wala\b/.test(t)) return null;

  return null;
}

// ─── SMART CITY PARSER ────────────────────────────────────────────────────────
// Handles typos, abbreviations, alternate names
const cityAliases = {
  "blr":"bangalore","bom":"mumbai","del":"delhi","maa":"chennai",
  "hyd":"hyderabad","ccu":"kolkata","goi":"goa","pnq":"pune",
  "cok":"kochi","amd":"ahmedabad","jai":"jaipur","lko":"lucknow",
  "vns":"varanasi","dxb":"dubai","sin":"singapore","bkk":"bangkok",
  "bengaluru":"bangalore","bombay":"mumbai","new delhi":"delhi","madras":"chennai",
  "hyd":"hyderabad","calcutta":"kolkata","calicut":"kochi","cochin":"kochi",
  "trivandrum":"thiruvananthapuram","tvm":"thiruvananthapuram",
  "bang":"bangalore","mum":"mumbai","dilli":"delhi","dillli":"delhi",
  "bangalor":"bangalore","bangaluru":"bangalore","mumbi":"mumbai",
  "deli":"delhi","chenai":"chennai","hyderbad":"hyderabad",
};

const knownCities = [
  "bangalore","mumbai","delhi","chennai","hyderabad","kolkata","goa","pune",
  "kochi","ahmedabad","jaipur","lucknow","varanasi","patna","bhopal","nagpur",
  "srinagar","chandigarh","guwahati","bhubaneswar","trivandrum","thiruvananthapuram",
  "port blair","udaipur","amritsar","indore","raipur","dubai","singapore",
  "bangkok","kuala lumpur","london","new york","paris","frankfurt","tokyo","sydney",
];

function parseCities(text) {
  let t = text.toLowerCase();
  // Replace aliases
  for (const [alias, city] of Object.entries(cityAliases)) {
    t = t.replace(new RegExp(`\\b${alias}\\b`, "g"), city);
  }
  // Remove common filler words
  t = t.replace(/\b(flights?|book|find|cheap|cheapest|from|to|and|a|the|in|on|at|for|me|please|bhai|yaar|sir|mam|madam|hi|hello|hey)\b/g, " ");

  const found = [];
  for (const city of knownCities) {
    if (t.includes(city) && !found.includes(city)) found.push(city);
  }
  return { from: found[0]||null, to: found[1]||null };
}

// ─── TEST ─────────────────────────────────────────────────────────────────────
app.get("/test", (req, res) => res.send("Alvryn backend alive"));

// ─── USERS ────────────────────────────────────────────────────────────────────
app.get("/users", async (req, res) => {
  try { const r = await pool.query("SELECT id,name,email,phone,ref_code,created_at FROM users"); res.json(r.rows); }
  catch(e) { res.status(500).send("Error"); }
});

// ─── REGISTER ─────────────────────────────────────────────────────────────────
app.post("/register", async (req, res) => {
  try {
    const { name, email, password, ref } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const refCode = generateRefCode(name);
    const result = await pool.query(
      "INSERT INTO users (name,email,password,ref_code) VALUES ($1,$2,$3,$4) RETURNING id,name,email,ref_code",
      [name, email, hashed, refCode]
    );
    const user = result.rows[0];

    // Handle referral — store who referred this user
    if (ref) {
      const referrer = await pool.query("SELECT id FROM users WHERE ref_code=$1", [ref]);
      if (referrer.rows.length > 0) {
        await pool.query("UPDATE users SET referred_by=$1 WHERE id=$2", [ref, user.id]);
      }
    }

    // Welcome email
    try {
      await resend.emails.send({
        from: "Alvryn Travel <onboarding@resend.dev>",
        to: email,
        subject: "✈ Welcome to Alvryn — Travel Beyond Boundaries",
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8f8fa;border-radius:16px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#6C63FF,#00C2FF);padding:32px 24px;text-align:center;">
            <h1 style="margin:0;font-size:26px;color:white;font-weight:900;">ALVRYN</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);letter-spacing:3px;font-size:12px;">TRAVEL BEYOND BOUNDARIES</p>
          </div>
          <div style="padding:32px 28px;">
            <h2 style="color:#0a0a0a;margin:0 0 12px;">Welcome, ${name}! 🎉</h2>
            <p style="color:#555;line-height:1.7;">Your account is ready. Search flights, book buses, and manage everything in one place.</p>
            <div style="background:#f0eeff;border-radius:12px;padding:16px;margin:24px 0;border:1px solid rgba(108,99,255,0.2);">
              <p style="margin:0 0 6px;font-size:11px;color:#aaa;letter-spacing:0.1em;">YOUR REFERRAL CODE</p>
              <p style="margin:0;font-size:22px;font-weight:900;color:#6C63FF;letter-spacing:0.15em;">${refCode}</p>
              <p style="margin:6px 0 0;font-size:13px;color:#888;">Share it — when a friend books above ₹5000, you both get discounts!</p>
            </div>
            <a href="https://alvryn.in/search" style="display:inline-block;background:linear-gradient(135deg,#6C63FF,#00C2FF);color:#fff;padding:13px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;">Search Flights →</a>
          </div>
        </div>`
      });
    } catch(e) { console.error("Welcome email error:", e.message); }

    res.json({ message: "Registered successfully", refCode });
  } catch(e) {
    if (e.code==="23505") return res.status(409).json({ message: "Email already registered" });
    console.error(e); res.status(500).json({ message: "Registration failed" });
  }
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    const user = result.rows[0];
    if (!user) return res.status(400).json({ message: "User not found" });
    if (!await bcrypt.compare(password, user.password))
      return res.status(401).json({ message: "Invalid password" });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET||"secretkey");
    res.json({ token, user: { id:user.id, name:user.name, email:user.email, ref_code:user.ref_code } });
  } catch(e) { console.error(e); res.status(500).json({ message: "Login failed" }); }
});

// ─── USER PROFILE ─────────────────────────────────────────────────────────────
app.get("/profile", authenticateToken, async (req, res) => {
  try {
    const r = await pool.query("SELECT id,name,email,phone,ref_code,created_at FROM users WHERE id=$1", [req.user.id]);
    res.json(r.rows[0]);
  } catch(e) { res.status(500).json({ message: "Error" }); }
});

app.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    await pool.query("UPDATE users SET name=$1,email=$2,phone=$3 WHERE id=$4", [name, email, phone||null, req.user.id]);
    res.json({ message: "Profile updated" });
  } catch(e) {
    if (e.code==="23505") return res.status(409).json({ message: "Email already taken" });
    res.status(500).json({ message: "Update failed" });
  }
});

app.put("/profile/password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const r = await pool.query("SELECT password FROM users WHERE id=$1", [req.user.id]);
    if (!await bcrypt.compare(currentPassword, r.rows[0].password))
      return res.status(401).json({ message: "Current password is incorrect" });
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password=$1 WHERE id=$2", [hashed, req.user.id]);
    res.json({ message: "Password updated" });
  } catch(e) { res.status(500).json({ message: "Error" }); }
});

// ─── FLIGHTS ──────────────────────────────────────────────────────────────────
app.get("/flights", async (req, res) => {
  try {
    const { from, to, date } = req.query;
    let query = "SELECT * FROM flights WHERE 1=1", values = [], count = 1;
    if (from) { query += ` AND LOWER(from_city)=LOWER($${count++})`; values.push(from); }
    if (to)   { query += ` AND LOWER(to_city)=LOWER($${count++})`; values.push(to); }
    if (date) { query += ` AND DATE(departure_time)=$${count++}`; values.push(date); }
    query += " ORDER BY price ASC";
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch(e) { res.status(500).send("Error"); }
});

// ─── SMART AI SEARCH ──────────────────────────────────────────────────────────
app.post("/ai-search", async (req, res) => {
  try {
    const raw = req.body.query || "";
    const q = raw.toLowerCase();

    // Parse cities with fuzzy matching
    const { from, to } = parseCities(q);
    if (!from || !to) {
      return res.status(400).json({
        message: "I couldn't find your cities. Try: 'flights bangalore to delhi tomorrow' or 'blr to mum kal'"
      });
    }

    // Validate not past date
    const targetDate = parseSmartDate(q);
    const now = new Date();
    if (targetDate && targetDate < new Date(now.setHours(0,0,0,0))) {
      return res.status(400).json({
        message: `That date has already passed! Try 'tomorrow', 'next friday', or a future date.`
      });
    }

    const isChEap = /cheap|budget|sasta|kam paise|lowest|minimum|affordable|save/i.test(q);
    const fmt = d => d.toISOString().split("T")[0];

    let rows = [];
    if (targetDate) {
      const r = await pool.query(
        `SELECT * FROM flights WHERE LOWER(from_city)=$1 AND LOWER(to_city)=$2 AND DATE(departure_time)=$3 ORDER BY ${isChEap?"price":"departure_time"} ASC`,
        [from, to, fmt(targetDate)]
      );
      rows = r.rows;
    }

    // Fallback — no flights on that exact date
    if (rows.length === 0) {
      const fallback = await pool.query(
        `SELECT * FROM flights WHERE LOWER(from_city)=$1 AND LOWER(to_city)=$2 AND departure_time > NOW() ORDER BY departure_time ASC LIMIT 5`,
        [from, to]
      );
      rows = fallback.rows;
      if (rows.length > 0) {
        rows._note = `No flights found for that date — showing upcoming flights from ${from} to ${to}`;
      }
    }

    res.json(rows.length > 0 ? rows : []);
  } catch(e) { console.error(e); res.status(500).send("Error"); }
});

// ─── REAL FLIGHTS ─────────────────────────────────────────────────────────────
app.get("/real-flights", async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ message: "Provide from and to" });
    const cityToCode = {
      "bangalore":"BLR","mumbai":"BOM","delhi":"DEL","chennai":"MAA",
      "hyderabad":"HYD","kolkata":"CCU","goa":"GOI","pune":"PNQ",
      "kochi":"COK","ahmedabad":"AMD","jaipur":"JAI","varanasi":"VNS",
      "dubai":"DXB","singapore":"SIN","bangkok":"BKK",
    };
    const fromCode = cityToCode[from.toLowerCase()] || from.toUpperCase();
    const toCode   = cityToCode[to.toLowerCase()]   || to.toUpperCase();
    const response = await axios.get("http://api.aviationstack.com/v1/flights", {
      params: { access_key:process.env.AVIATIONSTACK_KEY, dep_iata:fromCode, arr_iata:toCode, limit:10, flight_status:"scheduled" }
    });
    const flights = response.data.data;
    if (!flights || flights.length===0) {
      const db = await pool.query(`SELECT * FROM flights WHERE LOWER(from_city)=LOWER($1) AND LOWER(to_city)=LOWER($2) ORDER BY price ASC`, [from,to]);
      return res.json(db.rows);
    }
    const saved = [];
    for (const f of flights) {
      const airline=f.airline?.name||"Unknown", flightNo=f.flight?.iata||"—";
      const dep=f.departure?.scheduled||null, arr=f.arrival?.scheduled||null;
      const price=Math.floor(Math.random()*8000)+2000;
      const ex = await pool.query("SELECT * FROM flights WHERE flight_no=$1 AND departure_time=$2",[flightNo,dep]);
      if (ex.rows.length>0) { saved.push(ex.rows[0]); }
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
    console.error("AviationStack error:",e.message);
    try {
      const db = await pool.query(`SELECT * FROM flights WHERE LOWER(from_city)=LOWER($1) AND LOWER(to_city)=LOWER($2) ORDER BY price ASC`,[req.query.from,req.query.to]);
      res.json(db.rows);
    } catch { res.status(500).json({ message: "Flight search failed" }); }
  }
});

// ─── PROMO CODE VALIDATION ────────────────────────────────────────────────────
app.post("/promo/validate", authenticateToken, async (req, res) => {
  try {
    const { code, bookingAmount, travelType } = req.body;
    const promo = await pool.query(
      "SELECT * FROM promo_codes WHERE UPPER(code)=UPPER($1) AND is_active=TRUE",
      [code]
    );
    if (promo.rows.length===0) return res.status(404).json({ message: "Invalid promo code" });
    const p = promo.rows[0];

    if (p.expires_at && new Date(p.expires_at) < new Date())
      return res.status(400).json({ message: "This promo code has expired" });
    if (p.used_count >= p.max_uses)
      return res.status(400).json({ message: "Promo code has reached maximum uses" });
    if (bookingAmount < p.min_booking_amount)
      return res.status(400).json({ message: `Minimum booking amount is ₹${p.min_booking_amount}` });
    if (p.travel_type!=="any" && travelType && p.travel_type!==travelType)
      return res.status(400).json({ message: `This code is only valid for ${p.travel_type} bookings` });

    // Check if user already used this code
    const used = await pool.query("SELECT id FROM promo_usage WHERE promo_code=UPPER($1) AND user_id=$2",[code,req.user.id]);
    if (used.rows.length>0) return res.status(400).json({ message: "You have already used this promo code" });

    const discount = p.discount_type==="percent"
      ? Math.floor(bookingAmount * p.discount_value / 100)
      : p.discount_value;

    res.json({ valid:true, discount, discountType:p.discount_type, discountValue:p.discount_value, message:`✅ ₹${discount} off applied!` });
  } catch(e) { console.error(e); res.status(500).json({ message: "Error validating promo" }); }
});

// ─── CHECK REFERRAL DISCOUNT ──────────────────────────────────────────────────
app.get("/referral/discount", authenticateToken, async (req, res) => {
  try {
    const r = await pool.query(
      "SELECT * FROM referral_discounts WHERE (referrer_user_id=$1 AND referrer_claimed=FALSE) OR (referred_user_id=$1 AND referred_claimed=FALSE) LIMIT 1",
      [req.user.id]
    );
    if (r.rows.length===0) return res.json({ available:false });
    const d = r.rows[0];
    const isReferrer = d.referrer_user_id===req.user.id;
    res.json({
      available: true,
      discount: isReferrer ? d.referrer_discount : d.referred_discount,
      type: isReferrer ? "referrer" : "referred",
      discountId: d.id,
    });
  } catch(e) { res.json({ available:false }); }
});

// ─── BOOKING ──────────────────────────────────────────────────────────────────
app.post("/book", authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { flight_id, passenger_name, cabin_class, seats, promo_code, referral_discount_id } = req.body;
    const user_id = req.user.id;

    await client.query("BEGIN");

    const flightRes = await client.query("SELECT * FROM flights WHERE id=$1 FOR UPDATE", [flight_id]);
    if (flightRes.rows.length===0) { await client.query("ROLLBACK"); return res.status(404).json({ message:"Flight not found" }); }
    const flight = flightRes.rows[0];
    if (flight.seats_available<=0) { await client.query("ROLLBACK"); return res.status(400).json({ message:"No seats available" }); }

    // Calculate price + discounts
    let finalPrice = flight.price;
    let discountApplied = 0;

    // Apply promo code
    if (promo_code) {
      const promo = await client.query("SELECT * FROM promo_codes WHERE UPPER(code)=UPPER($1) AND is_active=TRUE",[promo_code]);
      if (promo.rows.length>0) {
        const p = promo.rows[0];
        const disc = p.discount_type==="percent" ? Math.floor(finalPrice*p.discount_value/100) : p.discount_value;
        discountApplied += disc;
        await client.query("UPDATE promo_codes SET used_count=used_count+1 WHERE code=UPPER($1)",[promo_code]);
        await client.query("INSERT INTO promo_usage (promo_code,user_id) VALUES (UPPER($1),$2) ON CONFLICT DO NOTHING",[promo_code,user_id]);
      }
    }

    // Apply referral discount
    if (referral_discount_id) {
      const refDisc = await client.query("SELECT * FROM referral_discounts WHERE id=$1",[referral_discount_id]);
      if (refDisc.rows.length>0) {
        const d = refDisc.rows[0];
        if (d.referrer_user_id===user_id && !d.referrer_claimed) {
          discountApplied += d.referrer_discount;
          await client.query("UPDATE referral_discounts SET referrer_claimed=TRUE WHERE id=$1",[referral_discount_id]);
        } else if (d.referred_user_id===user_id && !d.referred_claimed) {
          discountApplied += d.referred_discount;
          await client.query("UPDATE referral_discounts SET referred_claimed=TRUE WHERE id=$1",[referral_discount_id]);
        }
      }
    }

    finalPrice = Math.max(0, finalPrice - discountApplied);
    const bookingRef = "ALV"+Date.now().toString(36).toUpperCase().slice(-6);
    const seatsStr = Array.isArray(seats) ? seats.join(",") : (seats||"");

    await client.query(
      "INSERT INTO bookings (flight_id,passenger_name,user_id,cabin_class,seats,promo_code,discount_applied,final_price,booking_ref,flight_no) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
      [flight_id, passenger_name, user_id, cabin_class||"Economy", seatsStr, promo_code||null, discountApplied, finalPrice, bookingRef, flight.flight_no||null]
    );
    await client.query("UPDATE flights SET seats_available=seats_available-1 WHERE id=$1",[flight_id]);

    // Check referral — if referred user books > 5000, trigger referral discount for both
    const userRes = await client.query("SELECT * FROM users WHERE id=$1",[user_id]);
    const userRow = userRes.rows[0];
    if (userRow.referred_by && flight.price >= 5000) {
      const referrer = await client.query("SELECT id FROM users WHERE ref_code=$1",[userRow.referred_by]);
      if (referrer.rows.length>0) {
        // Check not already created
        const existing = await client.query(
          "SELECT id FROM referral_discounts WHERE referred_user_id=$1",[user_id]
        );
        if (existing.rows.length===0) {
          await client.query(
            "INSERT INTO referral_discounts (referrer_user_id,referred_user_id,booking_ref) VALUES ($1,$2,$3)",
            [referrer.rows[0].id, user_id, bookingRef]
          );
        }
      }
    }

    await client.query("COMMIT");

    // Send confirmation email
    const emailRes = await pool.query("SELECT email,name FROM users WHERE id=$1",[user_id]);
    const userEmail = emailRes.rows[0]?.email;
    if (userEmail) {
      try {
        await sendBookingEmail(userEmail, {
          passengerName: passenger_name,
          airline: flight.airline,
          flightNo: flight.flight_no,
          fromCity: flight.from_city,
          toCity: flight.to_city,
          departureTime: flight.departure_time,
          arrivalTime: flight.arrival_time,
          price: flight.price,
          finalPrice,
          discountApplied,
          bookingId: bookingRef,
          cabinClass: cabin_class||"Economy",
          seats: seatsStr,
          userName: emailRes.rows[0]?.name,
        });
      } catch(e) { console.error("Email error:",e.message); }
    }

    res.json({ message:"Booking confirmed!", bookingId:bookingRef, finalPrice, discountApplied });
  } catch(e) { await client.query("ROLLBACK"); console.error(e); res.status(500).send("Error"); }
  finally { client.release(); }
});

// ─── MY BOOKINGS ──────────────────────────────────────────────────────────────
app.get("/my-bookings", authenticateToken, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT bookings.id, bookings.passenger_name, bookings.booked_at, bookings.cabin_class,
       bookings.seats, bookings.promo_code, bookings.discount_applied, bookings.final_price, bookings.booking_ref,
       flights.from_city, flights.to_city, flights.departure_time, flights.arrival_time,
       flights.price, flights.airline, flights.flight_no
       FROM bookings JOIN flights ON bookings.flight_id=flights.id
       WHERE bookings.user_id=$1 ORDER BY bookings.id DESC`,
      [req.user.id]
    );
    res.json(r.rows);
  } catch(e) { res.status(500).send("Error"); }
});

// ─── SEAT LOCK ────────────────────────────────────────────────────────────────
app.post("/lock-seat", authenticateToken, async (req, res) => {
  try {
    const { flight_id } = req.body;
    const lockTime = new Date(Date.now()+5*60*1000);
    await pool.query(
      "INSERT INTO seat_locks (flight_id,user_id,locked_until) VALUES ($1,$2,$3)",
      [flight_id, req.user.id, lockTime]
    );
    res.json({ message:"Seat locked for 5 minutes" });
  } catch(e) { res.status(500).send("Error"); }
});

// ─── WHATSAPP BOT — SMART VERSION ─────────────────────────────────────────────
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const userSessions = {};

app.post("/whatsapp", async (req, res) => {
  const raw = req.body.Body?.trim() || "";
  const q = raw.toLowerCase();
  const userPhone = req.body.From;
  let reply = "";

  try {
    if (!userSessions[userPhone]) userSessions[userPhone] = { step:"idle", flights:[] };
    const s = userSessions[userPhone];

    if (s.step==="idle" || s.step==="searching") {
      const { from, to } = parseCities(q);

      if (!from || !to) {
        reply = `✈️ *Alvryn Travel Bot*\n\nHi! I can help you book flights.\n\nJust type your route naturally:\n_"flights bangalore to mumbai kal"_\n_"blr to del tomorrow"_\n_"cheap flight goa next friday"_\n_"aaj delhi se mumbai"_\n\nI understand Hindi, typos, and broken English too! 😊`;
      } else {
        const targetDate = parseSmartDate(q);
        const now = new Date();

        // Check past date
        if (targetDate && targetDate < new Date(now.setHours(0,0,0,0))) {
          reply = `⚠️ That date has already passed! Try *tomorrow*, *next friday*, or a future date.`;
        } else {
          let dbQuery = `SELECT * FROM flights WHERE LOWER(from_city)=$1 AND LOWER(to_city)=$2`;
          const values = [from, to];
          if (targetDate) {
            dbQuery += ` AND DATE(departure_time)=$3`;
            values.push(targetDate.toISOString().split("T")[0]);
          }
          const isChEap = /cheap|budget|sasta|lowest/i.test(q);
          dbQuery += ` ORDER BY ${isChEap?"price":"departure_time"} ASC LIMIT 5`;

          let result = await pool.query(dbQuery, values);
          if (result.rows.length===0 && targetDate) {
            result = await pool.query(
              `SELECT * FROM flights WHERE LOWER(from_city)=$1 AND LOWER(to_city)=$2 AND departure_time>NOW() ORDER BY departure_time ASC LIMIT 5`,
              [from, to]
            );
          }

          if (result.rows.length===0) {
            reply = `❌ No flights found from *${from}* to *${to}*.\n\nTry a different date or route.`;
          } else {
            s.flights = result.rows; s.step = "selecting"; s.from = from; s.to = to;
            reply = `✈️ *Flights: ${from.toUpperCase()} → ${to.toUpperCase()}*\n`;
            if (targetDate) reply += `📅 ${targetDate.toLocaleDateString("en-IN",{day:"numeric",month:"short"})}\n`;
            reply += "\n";
            result.rows.forEach((f,i) => {
              const dep = new Date(f.departure_time).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false});
              const arr = new Date(f.arrival_time).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false});
              reply += `*${i+1}. ${f.airline}*\n⏰ ${dep} → ${arr}\n💰 ₹${f.price.toLocaleString()}\n\n`;
            });
            reply += `Reply with a number (1-${result.rows.length}) to book.`;
          }
        }
      }

    } else if (s.step==="selecting") {
      const n = parseInt(q.match(/\d+/)?.[0]);
      if (!n || n<1 || n>s.flights.length) {
        reply = `Please reply with a number between 1 and ${s.flights.length}. Or type your route again to search.`;
      } else {
        s.selectedFlight = s.flights[n-1]; s.step = "naming";
        const f = s.selectedFlight;
        const dep = new Date(f.departure_time).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false});
        reply = `✅ *${f.airline}* selected\n⏰ ${dep}\n💰 ₹${f.price.toLocaleString()}\n\nWhat is your *full name* for the ticket?`;
      }

    } else if (s.step==="naming") {
      s.passengerName = raw.trim(); s.step = "date_check";
      // Check if date was set
      if (!s.targetDate) {
        s.step = "asking_date";
        reply = `📅 Which date do you want to travel?\n\nReply like: *tomorrow*, *25 march*, *next friday*, *aaj*, *kal*`;
      } else {
        s.step = "confirming";
        const f = s.selectedFlight;
        const dep = new Date(f.departure_time).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false});
        const depDate = new Date(f.departure_time).toLocaleDateString("en-IN",{day:"numeric",month:"short"});
        reply = `📋 *Booking Summary*\n\n✈️ ${f.airline}\n🛫 ${s.from.toUpperCase()} → ${s.to.toUpperCase()}\n📅 ${depDate} at ${dep}\n💰 ₹${f.price.toLocaleString()}\n👤 ${s.passengerName}\n\nHave a promo code? Reply with it or type *CONFIRM* to book or *CANCEL* to stop.`;
      }

    } else if (s.step==="asking_date") {
      const d = parseSmartDate(q);
      if (!d) {
        reply = `I didn't understand that date. Try: *tomorrow*, *next friday*, *25 march*, *aaj*, *kal*`;
      } else if (d < new Date(new Date().setHours(0,0,0,0))) {
        reply = `⚠️ That date has passed! Please give a future date.`;
      } else {
        s.targetDate = d; s.step = "confirming";
        const f = s.selectedFlight;
        const dep = new Date(f.departure_time).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false});
        reply = `📋 *Booking Summary*\n\n✈️ ${f.airline}\n🛫 ${s.from.toUpperCase()} → ${s.to.toUpperCase()}\n📅 ${d.toLocaleDateString("en-IN",{day:"numeric",month:"short"})}\n💰 ₹${f.price.toLocaleString()}\n👤 ${s.passengerName}\n\nHave a promo code? Reply with it or type *CONFIRM* to book or *CANCEL*.`;
      }

    } else if (s.step==="confirming") {
      if (q==="cancel") {
        userSessions[userPhone] = { step:"idle", flights:[] };
        reply = `Booking cancelled. Type your route anytime to search again. ✈️`;
      } else if (q==="confirm") {
        const f = s.selectedFlight;
        let finalPrice = f.price;
        let discountMsg = "";
        if (s.promoDiscount) { finalPrice -= s.promoDiscount; discountMsg = `\n🎉 Promo discount: -₹${s.promoDiscount}`; }
        await pool.query(
          "INSERT INTO bookings (flight_id,passenger_name,user_id,final_price) VALUES ($1,$2,$3,$4)",
          [f.id, s.passengerName, 1, finalPrice]
        );
        await pool.query("UPDATE flights SET seats_available=seats_available-1 WHERE id=$1",[f.id]);
        const bookingId = "ALV"+Date.now().toString(36).toUpperCase().slice(-6);
        reply = `🎉 *Booking Confirmed!*\n\n✈️ ${f.airline}\n🛫 ${s.from.toUpperCase()} → ${s.to.toUpperCase()}\n👤 ${s.passengerName}${discountMsg}\n💰 ₹${finalPrice.toLocaleString()}\n🎫 ID: *${bookingId}*\n\nHave a great flight! ✈️`;
        userSessions[userPhone] = { step:"idle", flights:[] };
      } else {
        // Try as promo code
        const promo = await pool.query("SELECT * FROM promo_codes WHERE UPPER(code)=UPPER($1) AND is_active=TRUE",[q]);
        if (promo.rows.length>0) {
          const p = promo.rows[0];
          const disc = p.discount_type==="percent" ? Math.floor(s.selectedFlight.price*p.discount_value/100) : p.discount_value;
          s.promoDiscount = disc;
          reply = `✅ Promo *${q.toUpperCase()}* applied! ₹${disc} off\n\nNew total: ₹${(s.selectedFlight.price-disc).toLocaleString()}\n\nReply *CONFIRM* to book or *CANCEL* to stop.`;
        } else {
          reply = `Please reply *CONFIRM* to book or *CANCEL* to stop. (That promo code wasn't recognized.)`;
        }
      }
    }
  } catch(e) {
    console.error("WhatsApp error:",e);
    reply = `Sorry, something went wrong. Please try again or visit alvryn.in`;
    userSessions[userPhone] = { step:"idle", flights:[] };
  }

  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(reply);
  res.type("text/xml").send(twiml.toString());
});

// ─── EMAIL CONFIRMATION ───────────────────────────────────────────────────────
async function sendBookingEmail(toEmail, d) {
  const depTime = d.departureTime ? new Date(d.departureTime).toLocaleString("en-IN",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:false}) : "—";
  const arrTime = d.arrivalTime ? new Date(d.arrivalTime).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false}) : "—";
  const discountRow = d.discountApplied>0 ? `<tr><td style="padding:8px 0;color:#888;font-size:12px;">DISCOUNT APPLIED</td><td style="padding:8px 0;color:#10b981;font-weight:bold;text-align:right;">- ₹${d.discountApplied?.toLocaleString()}</td></tr>` : "";
  await resend.emails.send({
    from: "Alvryn Travel <onboarding@resend.dev>",
    to: toEmail,
    subject: `✈️ Booking Confirmed — ${d.bookingId} | Alvryn`,
    html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8f8fa;border-radius:16px;overflow:hidden;border:1px solid rgba(0,0,0,0.06);">
      <div style="background:linear-gradient(135deg,#6C63FF,#00C2FF);padding:32px 24px;text-align:center;">
        <h1 style="margin:0;font-size:24px;color:white;font-weight:900;letter-spacing:-1px;">ALVRYN</h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);letter-spacing:3px;font-size:11px;">TRAVEL BEYOND BOUNDARIES</p>
      </div>
      <div style="background:rgba(16,185,129,0.08);padding:14px 24px;text-align:center;border-bottom:1px solid rgba(16,185,129,0.15);">
        <p style="margin:0;color:#059669;font-size:17px;font-weight:bold;">✅ Booking Confirmed!</p>
      </div>
      <div style="padding:24px;text-align:center;background:#fff;">
        <p style="margin:0;font-size:11px;color:#aaa;letter-spacing:0.12em;">BOOKING ID</p>
        <p style="margin:8px 0 0;font-size:26px;font-weight:900;color:#6C63FF;letter-spacing:4px;">${d.bookingId}</p>
      </div>
      <div style="padding:0 28px 28px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr style="border-bottom:1px solid #f0f0f0;"><td style="padding:10px 0;color:#888;font-size:12px;letter-spacing:0.08em;">PASSENGER</td><td style="padding:10px 0;color:#0a0a0a;font-weight:700;text-align:right;">${d.passengerName}</td></tr>
          <tr style="border-bottom:1px solid #f0f0f0;"><td style="padding:10px 0;color:#888;font-size:12px;">AIRLINE</td><td style="padding:10px 0;color:#0a0a0a;font-weight:700;text-align:right;">${d.airline}${d.flightNo?" · "+d.flightNo:""}</td></tr>
          <tr style="border-bottom:1px solid #f0f0f0;"><td style="padding:10px 0;color:#888;font-size:12px;">ROUTE</td><td style="padding:10px 0;color:#0a0a0a;font-weight:700;text-align:right;">${d.fromCity} → ${d.toCity}</td></tr>
          <tr style="border-bottom:1px solid #f0f0f0;"><td style="padding:10px 0;color:#888;font-size:12px;">DEPARTURE</td><td style="padding:10px 0;color:#0a0a0a;font-weight:700;text-align:right;">${depTime}</td></tr>
          <tr style="border-bottom:1px solid #f0f0f0;"><td style="padding:10px 0;color:#888;font-size:12px;">ARRIVAL</td><td style="padding:10px 0;color:#0a0a0a;font-weight:700;text-align:right;">${arrTime}</td></tr>
          <tr style="border-bottom:1px solid #f0f0f0;"><td style="padding:10px 0;color:#888;font-size:12px;">CLASS</td><td style="padding:10px 0;color:#0a0a0a;font-weight:700;text-align:right;">${d.cabinClass||"Economy"}</td></tr>
          ${d.seats?`<tr style="border-bottom:1px solid #f0f0f0;"><td style="padding:10px 0;color:#888;font-size:12px;">SEATS</td><td style="padding:10px 0;color:#0a0a0a;font-weight:700;text-align:right;">${d.seats}</td></tr>`:""}
          <tr style="border-bottom:1px solid #f0f0f0;"><td style="padding:10px 0;color:#888;font-size:12px;">ORIGINAL PRICE</td><td style="padding:10px 0;color:#0a0a0a;font-weight:700;text-align:right;">₹${d.price?.toLocaleString()}</td></tr>
          ${discountRow}
          <tr><td style="padding:14px 0 0;color:#888;font-size:12px;">AMOUNT PAID</td><td style="padding:14px 0 0;color:#6C63FF;font-size:22px;font-weight:900;text-align:right;">₹${(d.finalPrice||d.price)?.toLocaleString()}</td></tr>
        </table>
      </div>
      <div style="padding:20px 28px;background:#f0eeff;text-align:center;border-top:1px solid rgba(108,99,255,0.1);">
        <p style="margin:0;color:#6C63FF;font-size:13px;line-height:1.7;">Thank you for flying with Alvryn ✈️<br/>
        <a href="https://alvryn.in/my-bookings" style="color:#6C63FF;font-weight:700;">View all your bookings →</a></p>
      </div>
    </div>`
  });
}

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────
app.get("/admin/bookings", async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT b.id,b.passenger_name,b.booked_at,b.cabin_class,b.seats,b.promo_code,b.discount_applied,b.final_price,b.booking_ref,
       f.from_city,f.to_city,f.departure_time,f.price,f.airline,f.flight_no,u.email as user_email
       FROM bookings b JOIN flights f ON b.flight_id=f.id JOIN users u ON b.user_id=u.id
       ORDER BY b.id DESC`
    );
    res.json(r.rows);
  } catch(e) { res.status(500).send("Error"); }
});

app.get("/admin/users", async (req, res) => {
  try {
    const r = await pool.query("SELECT id,name,email,phone,ref_code,created_at FROM users ORDER BY id DESC");
    res.json(r.rows);
  } catch(e) { res.status(500).send("Error"); }
});

// ─── WAITLIST (keeping existing) ──────────────────────────────────────────────
function generateWaitRefCode(email) {
  const base = email.split("@")[0].replace(/[^a-zA-Z0-9]/g,"").slice(0,8);
  return base + Math.random().toString(36).slice(2,6).toUpperCase();
}

async function ensureWaitlistTable() {
  await pool.query(`CREATE TABLE IF NOT EXISTS waitlist (id SERIAL PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL, ref_code VARCHAR(20) UNIQUE NOT NULL, referred_by VARCHAR(20), joined_at TIMESTAMP DEFAULT NOW())`);
}

app.post("/waitlist", async (req, res) => {
  try {
    await ensureWaitlistTable();
    const { email, ref } = req.body;
    if (!email) return res.status(400).json({ message:"Email required" });
    const refCode = generateWaitRefCode(email);
    let referredBy = null;
    if (ref) {
      const rc = await pool.query("SELECT email FROM waitlist WHERE ref_code=$1",[ref]);
      if (rc.rows.length>0) referredBy = ref;
    }
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
  try { await ensureWaitlistTable(); const r = await pool.query("SELECT COUNT(*) FROM waitlist"); res.json({ count:parseInt(r.rows[0].count) }); }
  catch { res.json({ count:0 }); }
});

app.get("/waitlist/leaderboard", async (req, res) => {
  try {
    await ensureWaitlistTable();
    const r = await pool.query(`SELECT w.email,COUNT(ref.id) as ref_count FROM waitlist w LEFT JOIN waitlist ref ON ref.referred_by=w.ref_code GROUP BY w.email ORDER BY ref_count DESC LIMIT 10`);
    res.json(r.rows);
  } catch { res.json([]); }
});

app.get("/waitlist/my-refs/:refCode", async (req, res) => {
  try {
    await ensureWaitlistTable();
    const r = await pool.query("SELECT COUNT(*) FROM waitlist WHERE referred_by=$1",[req.params.refCode]);
    res.json({ count:parseInt(r.rows[0].count) });
  } catch { res.json({ count:0 }); }
});

app.get("/admin/waitlist", async (req, res) => {
  try {
    await ensureWaitlistTable();
    const r = await pool.query(`SELECT w.*,COUNT(ref.id) as ref_count FROM waitlist w LEFT JOIN waitlist ref ON ref.referred_by=w.ref_code GROUP BY w.id ORDER BY ref_count DESC,w.joined_at ASC`);
    res.json(r.rows);
  } catch { res.json([]); }
});

// ─── START ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Alvryn server on port ${PORT}`));