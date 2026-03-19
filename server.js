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

console.log("SERVER STARTED");

/* ---------------- USERS ---------------- */
app.get("/users", async (req, res) => {
  try { const result = await pool.query("SELECT * FROM users"); res.json(result.rows); }
  catch (err) { console.error(err); res.status(500).send("Server Error"); }
});

/* ---------------- FLIGHTS ---------------- */
app.get("/flights", async (req, res) => {
  try {
    const { from, to, date } = req.query;
    let query = "SELECT * FROM flights WHERE 1=1", values = [], count = 1;
    if (from) { query += ` AND LOWER(from_city)=LOWER($${count++})`; values.push(from); }
    if (to) { query += ` AND LOWER(to_city)=LOWER($${count++})`; values.push(to); }
    if (date) { query += ` AND DATE(departure_time)=$${count++}`; values.push(date); }
    query += " ORDER BY price ASC";
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) { console.error("FLIGHT ERROR:", err); res.status(500).send("Server Error"); }
});

/* ---------------- REAL FLIGHTS ---------------- */
app.get("/real-flights", async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ message: "Please provide from and to cities" });
    const cityToCode = { "bangalore":"BLR","mumbai":"BOM","delhi":"DEL","chennai":"MAA","hyderabad":"HYD","kolkata":"CCU","goa":"GOI","pune":"PNQ","kochi":"COK","ahmedabad":"AMD","jaipur":"JAI","varanasi":"VNS","dubai":"DXB","singapore":"SIN" };
    const fromCode = cityToCode[from.toLowerCase()] || from.toUpperCase();
    const toCode = cityToCode[to.toLowerCase()] || to.toUpperCase();
    const response = await axios.get("http://api.aviationstack.com/v1/flights", {
      params: { access_key: process.env.AVIATIONSTACK_KEY, dep_iata: fromCode, arr_iata: toCode, limit: 10, flight_status: "scheduled" }
    });
    const flights = response.data.data;
    if (!flights || flights.length === 0) {
      const dbFlights = await pool.query(`SELECT * FROM flights WHERE LOWER(from_city)=LOWER($1) AND LOWER(to_city)=LOWER($2) ORDER BY price ASC`, [from, to]);
      return res.json(dbFlights.rows);
    }
    const savedFlights = [];
    for (const f of flights) {
      const airline = f.airline?.name || "Unknown Airline", flightNo = f.flight?.iata || "—";
      const depTime = f.departure?.scheduled || null, arrTime = f.arrival?.scheduled || null;
      const price = Math.floor(Math.random() * 8000) + 2000;
      const existing = await pool.query(`SELECT * FROM flights WHERE flight_no=$1 AND departure_time=$2`, [flightNo, depTime]);
      if (existing.rows.length > 0) { savedFlights.push(existing.rows[0]); }
      else {
        const inserted = await pool.query(`INSERT INTO flights (airline,flight_no,from_city,to_city,departure_time,arrival_time,price,seats_available) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`, [airline, flightNo, from, to, depTime, arrTime, price, 50]);
        savedFlights.push(inserted.rows[0]);
      }
    }
    res.json(savedFlights);
  } catch (err) {
    console.error("AviationStack error:", err.message);
    try { const { from, to } = req.query; const dbFlights = await pool.query(`SELECT * FROM flights WHERE LOWER(from_city)=LOWER($1) AND LOWER(to_city)=LOWER($2) ORDER BY price ASC`, [from, to]); res.json(dbFlights.rows); }
    catch (dbErr) { res.status(500).json({ message: "Flight search failed" }); }
  }
});

/* ---------------- AI SEARCH ---------------- */
app.post("/ai-search", async (req, res) => {
  try {
    const queryText = req.body.query.toLowerCase();
    const cities = ["bangalore","mumbai","delhi","chennai","hyderabad","kolkata","goa","pune","kochi","ahmedabad","jaipur","varanasi","dubai","singapore"];
    let from = null, to = null;
    cities.forEach(city => { if (queryText.includes(city)) { if (!from) from = city; else if (!to) to = city; } });
    if (!from || !to) return res.status(400).json({ message: "Could not detect cities in query" });
    let targetDate = null; const now = new Date();
    if (queryText.includes("today")) { targetDate = new Date(now); }
    else if (queryText.includes("day after tomorrow")) { targetDate = new Date(now); targetDate.setDate(targetDate.getDate() + 2); }
    else if (queryText.includes("tomorrow")) { targetDate = new Date(now); targetDate.setDate(targetDate.getDate() + 1); }
    else {
      const days = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
      days.forEach((day, i) => { if (queryText.includes(day)) { const todayIndex = now.getDay(); let diff = i - todayIndex; if (queryText.includes("next") && diff <= 0) diff += 7; else if (diff < 0) diff += 7; targetDate = new Date(now); targetDate.setDate(now.getDate() + diff); } });
    }
    const inDaysMatch = queryText.match(/in (\d+) days?/);
    if (inDaysMatch) { targetDate = new Date(now); targetDate.setDate(now.getDate() + parseInt(inDaysMatch[1])); }
    const formatDate = (d) => d.toISOString().split("T")[0];
    let query = `SELECT * FROM flights WHERE LOWER(from_city)=$1 AND LOWER(to_city)=$2`, values = [from, to];
    if (targetDate) { query += ` AND DATE(departure_time)=$3`; values.push(formatDate(targetDate)); }
    query += queryText.includes("cheap") || queryText.includes("budget") ? ` ORDER BY price ASC` : ` ORDER BY departure_time ASC`;
    const flights = await pool.query(query, values);
    if (flights.rows.length === 0 && targetDate) {
      const fallback = await pool.query(`SELECT * FROM flights WHERE LOWER(from_city)=$1 AND LOWER(to_city)=$2 AND departure_time > NOW() ORDER BY departure_time ASC LIMIT 5`, [from, to]);
      return res.json(fallback.rows);
    }
    res.json(flights.rows);
  } catch (err) { console.error(err); res.status(500).send("Server Error"); }
});

/* ---------------- AUTH ---------------- */
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token required" });
  jwt.verify(token, process.env.JWT_SECRET || "secretkey", (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user; next();
  });
}

/* ---------------- BOOKING ---------------- */
app.post("/book", authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { flight_id, passenger_name, cabin_class } = req.body;
    const user_id = req.user.id;
    await client.query("BEGIN");
    const flight = await client.query("SELECT * FROM flights WHERE id=$1 FOR UPDATE", [flight_id]);
    if (flight.rows.length === 0) { await client.query("ROLLBACK"); return res.status(404).json({ message: "Flight not found" }); }
    if (flight.rows[0].seats_available <= 0) { await client.query("ROLLBACK"); return res.status(400).json({ message: "No seats available" }); }
    await client.query("INSERT INTO bookings (flight_id, passenger_name, user_id) VALUES ($1,$2,$3)", [flight_id, passenger_name, user_id]);
    await client.query("UPDATE flights SET seats_available = seats_available - 1 WHERE id=$1", [flight_id]);
    await client.query("COMMIT");
    const bookingId = "CMT" + Date.now().toString(36).toUpperCase().slice(-6);
    const userResult = await pool.query("SELECT email FROM users WHERE id=$1", [user_id]);
    const userEmail = userResult.rows[0]?.email;
    if (userEmail) {
      const f = flight.rows[0];
      try { await sendBookingEmail(userEmail, { passengerName: passenger_name, airline: f.airline, flightNo: f.flight_no, fromCity: f.from_city, toCity: f.to_city, departureTime: f.departure_time, arrivalTime: f.arrival_time, price: f.price, bookingId, cabinClass: cabin_class || "Economy" }); }
      catch (emailErr) { console.error("Email error:", emailErr.message); }
    }
    res.json({ message: "Booking confirmed!", bookingId });
  } catch (err) { await client.query("ROLLBACK"); console.error(err); res.status(500).send("Server Error"); }
  finally { client.release(); }
});

/* ---------------- TEST ---------------- */
app.get("/test", (req, res) => { res.send("Test route working"); });

/* ---------------- REGISTER ---------------- */
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query("INSERT INTO users (name,email,password) VALUES ($1,$2,$3)", [name, email, hashedPassword]);
    res.json({ message: "User registered successfully" });
  } catch (err) { console.error(err); res.status(500).json({ message: "Registration failed" }); }
});

/* ---------------- LOGIN ---------------- */
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    const user = result.rows[0];
    if (!user) return res.status(400).json({ message: "User not found" });
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ message: "Invalid password" });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "secretkey");
    res.json({ token });
  } catch (err) { console.error(err); res.status(500).json({ message: "Login failed" }); }
});

/* ---------------- MY BOOKINGS ---------------- */
app.get("/my-bookings", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(`SELECT bookings.id, flights.from_city, flights.to_city, flights.departure_time, flights.price, bookings.passenger_name FROM bookings JOIN flights ON bookings.flight_id = flights.id WHERE bookings.user_id = $1`, [userId]);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).send("Server Error"); }
});

/* ---------------- SEAT LOCK ---------------- */
app.post("/lock-seat", authenticateToken, async (req, res) => {
  try {
    const { flight_id } = req.body; const user_id = req.user.id;
    const lockTime = new Date(Date.now() + 5 * 60 * 1000);
    await pool.query("INSERT INTO seat_locks (flight_id, user_id, locked_until) VALUES ($1,$2,$3)", [flight_id, user_id, lockTime]);
    res.json({ message: "Seat locked for 5 minutes" });
  } catch (err) { console.error(err); res.status(500).send("Server Error"); }
});

/* ---------------- WHATSAPP BOT ---------------- */
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const userSessions = {};

app.post("/whatsapp", async (req, res) => {
  const incomingMsg = req.body.Body?.trim().toLowerCase();
  const userPhone = req.body.From;
  let replyMsg = "";
  try {
    if (!userSessions[userPhone]) userSessions[userPhone] = { step: "idle", flights: [] };
    const session = userSessions[userPhone];
    if (session.step === "idle" || session.step === "searching") {
      const cities = ["bangalore","mumbai","delhi","chennai","hyderabad","kolkata","goa","pune","kochi","ahmedabad","jaipur","dubai"];
      let from = null, to = null;
      cities.forEach(city => { if (incomingMsg.includes(city)) { if (!from) from = city; else if (!to) to = city; } });
      if (!from || !to) {
        replyMsg = `✈️ *CometAI Travel Bot*\n\nHi! I can help you book flights.\n\nTry sending:\n_"flights bangalore to mumbai tomorrow"_`;
      } else {
        let targetDate = null; const now = new Date();
        if (incomingMsg.includes("today")) { targetDate = new Date(now); }
        else if (incomingMsg.includes("tomorrow")) { targetDate = new Date(now); targetDate.setDate(targetDate.getDate() + 1); }
        else {
          const days = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
          days.forEach((day, i) => { if (incomingMsg.includes(day)) { const todayIndex = now.getDay(); let diff = i - todayIndex; if (diff <= 0) diff += 7; targetDate = new Date(now); targetDate.setDate(now.getDate() + diff); } });
        }
        let query = `SELECT * FROM flights WHERE LOWER(from_city)=$1 AND LOWER(to_city)=$2`, values = [from, to];
        if (targetDate) { query += ` AND DATE(departure_time)=$3`; values.push(targetDate.toISOString().split("T")[0]); }
        query += ` ORDER BY price ASC LIMIT 5`;
        const result = await pool.query(query, values);
        const rows = result.rows.length > 0 ? result.rows : (await pool.query(`SELECT * FROM flights WHERE LOWER(from_city)=$1 AND LOWER(to_city)=$2 AND departure_time > NOW() ORDER BY price ASC LIMIT 5`, [from, to])).rows;
        if (rows.length === 0) { replyMsg = `❌ No flights found from *${from}* to *${to}*.`; }
        else {
          session.flights = rows; session.step = "selecting"; session.from = from; session.to = to;
          replyMsg = `✈️ *Flights from ${from.toUpperCase()} → ${to.toUpperCase()}*\n\n`;
          rows.forEach((f, i) => { const dep = new Date(f.departure_time).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false}); const arr = new Date(f.arrival_time).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false}); replyMsg += `*${i+1}. ${f.airline}*\n⏰ ${dep} → ${arr}\n💰 ₹${f.price.toLocaleString()}\n\n`; });
          replyMsg += `Reply with a number to book.`;
        }
      }
    } else if (session.step === "selecting") {
      const numMatch = incomingMsg.match(/^(\d+)/);
      if (!numMatch) { replyMsg = `Please reply with a number like *1*, *2*, or *3*.`; }
      else {
        const flightIndex = parseInt(numMatch[1]) - 1;
        if (flightIndex < 0 || flightIndex >= session.flights.length) { replyMsg = `Invalid number. Please reply with 1 to ${session.flights.length}.`; }
        else {
          session.selectedFlight = session.flights[flightIndex]; session.step = "naming";
          if (incomingMsg.includes("window")) session.seatPreference = "window";
          else if (incomingMsg.includes("aisle")) session.seatPreference = "aisle";
          const f = session.selectedFlight;
          const dep = new Date(f.departure_time).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false});
          replyMsg = `✅ *${f.airline} selected*\n⏰ ${dep}\n💰 ₹${f.price.toLocaleString()}\n\nWhat is your full name for the booking?`;
        }
      }
    } else if (session.step === "naming") {
      session.passengerName = req.body.Body.trim(); session.step = "confirming";
      const f = session.selectedFlight;
      const dep = new Date(f.departure_time).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false});
      const depDate = new Date(f.departure_time).toLocaleDateString("en-IN",{day:"numeric",month:"short"});
      replyMsg = `📋 *Booking Summary*\n\n✈️ ${f.airline}\n🛫 ${session.from?.toUpperCase()} → ${session.to?.toUpperCase()}\n📅 ${depDate} at ${dep}\n💰 ₹${f.price.toLocaleString()}\n👤 ${session.passengerName}\n\nReply *CONFIRM* to book or *CANCEL* to start over.`;
    } else if (session.step === "confirming") {
      if (incomingMsg === "confirm") {
        const f = session.selectedFlight;
        await pool.query(`INSERT INTO bookings (flight_id, passenger_name, user_id) VALUES ($1, $2, $3)`, [f.id, session.passengerName, 1]);
        await pool.query(`UPDATE flights SET seats_available = seats_available - 1 WHERE id = $1`, [f.id]);
        const bookingId = "CMT" + Date.now().toString(36).toUpperCase().slice(-6);
        replyMsg = `🎉 *Booking Confirmed!*\n\n✈️ ${f.airline}\n🛫 ${session.from?.toUpperCase()} → ${session.to?.toUpperCase()}\n👤 ${session.passengerName}\n🎫 Booking ID: *${bookingId}*\n\nHave a great flight! ☄️`;
        userSessions[userPhone] = { step: "idle", flights: [] };
      } else if (incomingMsg === "cancel") {
        userSessions[userPhone] = { step: "idle", flights: [] };
        replyMsg = `Booking cancelled. Type your route anytime to search again.`;
      } else { replyMsg = `Please reply *CONFIRM* to confirm or *CANCEL* to cancel.`; }
    }
  } catch (err) { console.error("WhatsApp bot error:", err); replyMsg = `Sorry, something went wrong. Please try again.`; userSessions[userPhone] = { step: "idle", flights: [] }; }
  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(replyMsg);
  res.type("text/xml").send(twiml.toString());
});

/* ---------------- SEND BOOKING EMAIL ---------------- */
async function sendBookingEmail(toEmail, bookingDetails) {
  const { passengerName, airline, flightNo, fromCity, toCity, departureTime, arrivalTime, price, bookingId, cabinClass } = bookingDetails;
  const depTime = departureTime ? new Date(departureTime).toLocaleString("en-IN",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:false}) : "—";
  const arrTime = arrivalTime ? new Date(arrivalTime).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false}) : "—";
  await resend.emails.send({
    from: "CometAI Travel <onboarding@resend.dev>",
    to: toEmail,
    subject: `🚀 Booking Confirmed — ${bookingId} | CometAI Travel`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#01020a;color:#e8eaf6;border-radius:16px;overflow:hidden;"><div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 24px;text-align:center;"><h1 style="margin:0;font-size:28px;color:white;">☄️ COMETAI</h1><p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;letter-spacing:3px;">TRAVEL INTELLIGENCE</p></div><div style="background:rgba(52,211,153,0.15);padding:16px 24px;text-align:center;"><p style="margin:0;color:#6ee7b7;font-size:18px;font-weight:bold;">✅ Booking Confirmed!</p></div><div style="padding:24px;text-align:center;"><p style="margin:0;font-size:12px;color:rgba(165,180,252,0.5);">BOOKING ID</p><p style="margin:8px 0 0;font-size:28px;font-weight:bold;color:#a5b4fc;letter-spacing:4px;">${bookingId}</p></div><div style="padding:24px;"><table style="width:100%;border-collapse:collapse;"><tr><td style="padding:10px 0;color:rgba(165,180,252,0.5);font-size:12px;">PASSENGER</td><td style="padding:10px 0;color:#e0e7ff;font-weight:bold;text-align:right;">${passengerName}</td></tr><tr><td style="padding:10px 0;color:rgba(165,180,252,0.5);font-size:12px;">AIRLINE</td><td style="padding:10px 0;color:#e0e7ff;font-weight:bold;text-align:right;">${airline} ${flightNo||""}</td></tr><tr><td style="padding:10px 0;color:rgba(165,180,252,0.5);font-size:12px;">ROUTE</td><td style="padding:10px 0;color:#e0e7ff;font-weight:bold;text-align:right;">${fromCity} → ${toCity}</td></tr><tr><td style="padding:10px 0;color:rgba(165,180,252,0.5);font-size:12px;">DEPARTURE</td><td style="padding:10px 0;color:#e0e7ff;font-weight:bold;text-align:right;">${depTime}</td></tr><tr><td style="padding:10px 0;color:rgba(165,180,252,0.5);font-size:12px;">ARRIVAL</td><td style="padding:10px 0;color:#e0e7ff;font-weight:bold;text-align:right;">${arrTime}</td></tr><tr><td style="padding:10px 0;color:rgba(165,180,252,0.5);font-size:12px;">CLASS</td><td style="padding:10px 0;color:#e0e7ff;font-weight:bold;text-align:right;">${cabinClass||"Economy"}</td></tr><tr><td style="padding:16px 0 0;color:rgba(165,180,252,0.5);font-size:12px;">AMOUNT PAID</td><td style="padding:16px 0 0;color:#a5f3fc;font-size:22px;font-weight:bold;text-align:right;">₹${price?.toLocaleString()}</td></tr></table></div><div style="padding:24px;text-align:center;"><p style="margin:0;color:rgba(165,180,252,0.4);font-size:13px;line-height:1.7;">Thank you for booking with CometAI Travel! ☄️<br/>Have a wonderful journey.<br/><a href="https://comet-ai-frontend.vercel.app" style="color:#818cf8;">comet-ai-frontend.vercel.app</a></p></div></div>`
  });
}

/* ---------------- ADMIN ROUTES ---------------- */
app.get("/admin/bookings", async (req, res) => {
  try {
    const result = await pool.query(`SELECT bookings.id, bookings.passenger_name, bookings.booked_at, flights.from_city, flights.to_city, flights.departure_time, flights.price, flights.airline, users.email as user_email FROM bookings JOIN flights ON bookings.flight_id = flights.id JOIN users ON bookings.user_id = users.id ORDER BY bookings.id DESC`);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).send("Server Error"); }
});

app.get("/admin/users", async (req, res) => {
  try {
    const result = await pool.query(`SELECT id, name, email FROM users ORDER BY id DESC`);
    res.json(result.rows);
  } catch (err) { console.error(err); res.status(500).send("Server Error"); }
});

/* ---------------- WAITLIST WITH REFERRAL ---------------- */
function generateRefCode(email) {
  const base = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}${rand}`;
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
    if (ref) {
      const refCheck = await pool.query("SELECT email FROM waitlist WHERE ref_code=$1", [ref]);
      if (refCheck.rows.length > 0) referredBy = ref;
    }
    await pool.query("INSERT INTO waitlist (email, ref_code, referred_by) VALUES ($1, $2, $3)", [email, refCode, referredBy]);
    try {
      const refLink = `https://comet-ai-frontend.vercel.app/waitlist?ref=${refCode}&email=${encodeURIComponent(email)}`;
      await resend.emails.send({
        from: "CometAI Travel <onboarding@resend.dev>",
        to: email,
        subject: "🚀 You're on the CometAI waitlist! Here's your referral link",
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#01020a;color:#e8eaf6;border-radius:16px;overflow:hidden;"><div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 24px;text-align:center;"><h1 style="margin:0;font-size:28px;color:white;">☄️ COMETAI</h1></div><div style="padding:32px 24px;text-align:center;"><h2 style="color:#a5b4fc;">You're on the list! 🎉</h2><p style="color:rgba(165,180,252,0.6);font-size:15px;line-height:1.7;margin-bottom:24px;">Share your referral link! For every friend who books above ₹5,000 — you get ₹150 off and they get ₹100 off!</p><div style="background:rgba(99,102,241,0.1);border:1px solid rgba(129,140,248,0.2);border-radius:12px;padding:16px;margin-bottom:24px;"><p style="color:#a5b4fc;font-family:monospace;font-size:14px;">${refLink}</p></div><a href="${refLink}" style="background:#6366f1;color:white;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;">Share your link →</a></div></div>`
      });
    } catch (emailErr) { console.error("Waitlist email error:", emailErr.message); }
    res.json({ message: "Added to waitlist!", refCode });
  } catch (err) {
    if (err.code === "23505") {
      try {
        const existing = await pool.query("SELECT ref_code FROM waitlist WHERE email=$1", [req.body.email]);
        return res.status(409).json({ message: "Already on waitlist", refCode: existing.rows[0]?.ref_code });
      } catch { return res.status(409).json({ message: "Already on waitlist" }); }
    }
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/waitlist/count", async (req, res) => {
  try {
    await ensureWaitlistTable();
    const result = await pool.query("SELECT COUNT(*) FROM waitlist");
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) { res.json({ count: 0 }); }
});

app.get("/waitlist/leaderboard", async (req, res) => {
  try {
    await ensureWaitlistTable();
    const result = await pool.query(`SELECT w.email, COUNT(r.id) as ref_count FROM waitlist w LEFT JOIN waitlist r ON r.referred_by = w.ref_code GROUP BY w.email ORDER BY ref_count DESC LIMIT 10`);
    res.json(result.rows);
  } catch (err) { res.json([]); }
});

app.get("/waitlist/my-refs/:refCode", async (req, res) => {
  try {
    await ensureWaitlistTable();
    const result = await pool.query("SELECT COUNT(*) FROM waitlist WHERE referred_by=$1", [req.params.refCode]);
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) { res.json({ count: 0 }); }
});

app.get("/admin/waitlist", async (req, res) => {
  try {
    await ensureWaitlistTable();
    const result = await pool.query(`SELECT w.*, COUNT(r.id) as ref_count FROM waitlist w LEFT JOIN waitlist r ON r.referred_by = w.ref_code GROUP BY w.id ORDER BY ref_count DESC, w.joined_at ASC`);
    res.json(result.rows);
  } catch (err) { res.json([]); }
});

/* ---------------- START SERVER ---------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });