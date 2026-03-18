const express = require("express");
const axios = require("axios");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
require("dotenv").config();
const cors = require("cors");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

console.log("SERVER STARTED");

/* ---------------- USERS ---------------- */

app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

/* ---------------- FLIGHT SEARCH ---------------- */

app.get("/flights", async (req, res) => {
  try {
    const { from, to, date } = req.query;

    let query = "SELECT * FROM flights WHERE 1=1";
    let values = [];
    let count = 1;

    if (from) {
      query += ` AND LOWER(from_city)=LOWER($${count++})`;
      values.push(from);
    }

    if (to) {
      query += ` AND LOWER(to_city)=LOWER($${count++})`;
      values.push(to);
    }

    if (date) {
      query += ` AND DATE(departure_time)=$${count++}`;
      values.push(date);
    }

    query += " ORDER BY price ASC";

    const result = await pool.query(query, values);
    res.json(result.rows);

  } catch (err) {
    console.error("FLIGHT ERROR:", err);
    res.status(500).send("Server Error");
  }
});

/* ---------------- AI SEARCH ---------------- */

app.post("/ai-search", async (req, res) => {
  try {
    const queryText = req.body.query.toLowerCase();

    const cities = [
      "bangalore", "mumbai", "delhi", "chennai",
      "hyderabad", "kolkata", "goa", "pune",
      "kochi", "ahmedabad", "jaipur", "varanasi",
      "dubai", "singapore"
    ];

    let from = null;
    let to = null;

    cities.forEach(city => {
      if (queryText.includes(city)) {
        if (!from) from = city;
        else if (!to) to = city;
      }
    });

    if (!from || !to) {
      return res.status(400).json({ message: "Could not detect cities in query" });
    }

    let targetDate = null;
    const now = new Date();

    if (queryText.includes("today")) {
      targetDate = new Date(now);
    } else if (queryText.includes("day after tomorrow")) {
      targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + 2);
    } else if (queryText.includes("tomorrow")) {
      targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + 1);
    } else if (queryText.includes("next")) {
      const days = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
      days.forEach((day, i) => {
        if (queryText.includes(day)) {
          const todayIndex = now.getDay();
          let diff = i - todayIndex;
          if (diff <= 0) diff += 7;
          targetDate = new Date(now);
          targetDate.setDate(now.getDate() + diff);
        }
      });
    } else if (queryText.includes("this")) {
      const days = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
      days.forEach((day, i) => {
        if (queryText.includes(day)) {
          const todayIndex = now.getDay();
          let diff = i - todayIndex;
          if (diff < 0) diff += 7;
          targetDate = new Date(now);
          targetDate.setDate(now.getDate() + diff);
        }
      });
    } else {
      const days = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
      days.forEach((day, i) => {
        if (queryText.includes(day)) {
          const todayIndex = now.getDay();
          let diff = i - todayIndex;
          if (diff <= 0) diff += 7;
          targetDate = new Date(now);
          targetDate.setDate(now.getDate() + diff);
        }
      });
    }

    const inDaysMatch = queryText.match(/in (\d+) days?/);
    if (inDaysMatch) {
      targetDate = new Date(now);
      targetDate.setDate(now.getDate() + parseInt(inDaysMatch[1]));
    }

    const formatDate = (d) => d.toISOString().split("T")[0];

    let query = `SELECT * FROM flights WHERE LOWER(from_city)=$1 AND LOWER(to_city)=$2`;
    let values = [from, to];

    if (targetDate) {
      query += ` AND DATE(departure_time)=$3`;
      values.push(formatDate(targetDate));
    }

    if (queryText.includes("cheap") || queryText.includes("budget") || queryText.includes("lowest")) {
      query += ` ORDER BY price ASC`;
    } else {
      query += ` ORDER BY departure_time ASC`;
    }

    // BUG FIX 1 — moved flights query BEFORE the fallback check
    const flights = await pool.query(query, values);

    // BUG FIX 2 — fallback check now comes AFTER the query
    if (flights.rows.length === 0 && targetDate) {
      const fallback = await pool.query(
        `SELECT * FROM flights
         WHERE LOWER(from_city)=$1 AND LOWER(to_city)=$2
         AND departure_time > NOW()
         ORDER BY departure_time ASC LIMIT 5`,
        [from, to]
      );
      return res.json(fallback.rows);
    }

    // BUG FIX 3 — removed duplicate res.json call
    res.json(flights.rows);

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

/* ---------------- BOOKING ---------------- */

app.post("/book", authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { flight_id, passenger_name, cabin_class } = req.body;
    const user_id = req.user.id;

    await client.query("BEGIN");

    const flight = await client.query(
      "SELECT * FROM flights WHERE id=$1 FOR UPDATE",
      [flight_id]
    );

    if (flight.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Flight not found" });
    }

    if (flight.rows[0].seats_available <= 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "No seats available" });
    }

    await client.query(
      "INSERT INTO bookings (flight_id, passenger_name, user_id) VALUES ($1,$2,$3)",
      [flight_id, passenger_name, user_id]
    );

    await client.query(
      "UPDATE flights SET seats_available = seats_available - 1 WHERE id=$1",
      [flight_id]
    );

    await client.query("COMMIT");

    // generate booking ID
    const bookingId = "CMT" + Date.now().toString(36).toUpperCase().slice(-6);

    // get user email
    const userResult = await pool.query(
      "SELECT email FROM users WHERE id=$1",
      [user_id]
    );
    const userEmail = userResult.rows[0]?.email;

    // send confirmation email
    if (userEmail) {
      const f = flight.rows[0];
      await sendBookingEmail(userEmail, {
        passengerName: passenger_name,
        airline: f.airline,
        flightNo: f.flight_no,
        fromCity: f.from_city,
        toCity: f.to_city,
        departureTime: f.departure_time,
        arrivalTime: f.arrival_time,
        price: f.price,
        bookingId,
        cabinClass: cabin_class || "Economy"
      });
    }

    res.json({ message: "Booking confirmed!", bookingId });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).send("Server Error");
  } finally {
    client.release();
  }
});
```

**Step 6 — Add env variables to Render:**
```
EMAIL_USER = your_gmail@gmail.com
EMAIL_PASS = your_16_char_app_password

/* ---------------- TEST ROUTE ---------------- */

app.get("/test", (req, res) => {
  res.send("Test route working");
});

/* ---------------- REGISTER ---------------- */

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  await pool.query(
    "INSERT INTO users (name,email,password) VALUES ($1,$2,$3)",
    [name, email, hashedPassword]
  );
  res.json({ message: "User registered successfully" });
});

/* ---------------- LOGIN ---------------- */

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query(
    "SELECT * FROM users WHERE email=$1",
    [email]
  );

  const user = result.rows[0];

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    return res.status(401).json({ message: "Invalid password" });
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "secretkey");
  res.json({ token });
});

/* ---------------- AUTH MIDDLEWARE ---------------- */

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token required" });
  }

  jwt.verify(token, process.env.JWT_SECRET || "secretkey", (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = user;
    next();
  });
}

/* ---------------- MY BOOKINGS ---------------- */

app.get("/my-bookings", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT bookings.id, flights.from_city, flights.to_city,
              flights.departure_time, flights.price,
              bookings.passenger_name
       FROM bookings
       JOIN flights ON bookings.flight_id = flights.id
       WHERE bookings.user_id = $1`,
      [userId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

/* ---------------- SEAT LOCK ---------------- */

app.post("/lock-seat", authenticateToken, async (req, res) => {
  try {
    const { flight_id } = req.body;
    const user_id = req.user.id;

    const lockTime = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      "INSERT INTO seat_locks (flight_id, user_id, locked_until) VALUES ($1,$2,$3)",
      [flight_id, user_id, lockTime]
    );

    res.json({ message: "Seat locked for 5 minutes" });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

/* ---------------- WHATSAPP BOT ---------------- */

const twilio = require("twilio");
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// store conversation state for each user
const userSessions = {};

app.post("/whatsapp", async (req, res) => {
  const incomingMsg = req.body.Body?.trim().toLowerCase();
  const userPhone = req.body.From;

  let replyMsg = "";

  try {

    // get or create session for this user
    if (!userSessions[userPhone]) {
      userSessions[userPhone] = { step: "idle", flights: [] };
    }

    const session = userSessions[userPhone];

    // ── STEP 1: User sends a flight search query ──
    if (session.step === "idle" || session.step === "searching") {

      // detect cities
      const cities = [
        "bangalore","mumbai","delhi","chennai",
        "hyderabad","kolkata","goa","pune",
        "kochi","ahmedabad","jaipur","dubai"
      ];

      let from = null;
      let to = null;

      cities.forEach(city => {
        if (incomingMsg.includes(city)) {
          if (!from) from = city;
          else if (!to) to = city;
        }
      });

      if (!from || !to) {
        replyMsg = `✈️ *CometAI Travel Bot*\n\nHi! I can help you book flights.\n\nTry sending:\n_"flights bangalore to mumbai tomorrow"_\n_"cheap delhi to goa friday"_`;
      } else {

        // detect date
        let targetDate = null;
        const now = new Date();

        if (incomingMsg.includes("today")) {
          targetDate = new Date(now);
        } else if (incomingMsg.includes("tomorrow")) {
          targetDate = new Date(now);
          targetDate.setDate(targetDate.getDate() + 1);
        } else {
          const days = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
          days.forEach((day, i) => {
            if (incomingMsg.includes(day)) {
              const todayIndex = now.getDay();
              let diff = i - todayIndex;
              if (diff <= 0) diff += 7;
              targetDate = new Date(now);
              targetDate.setDate(now.getDate() + diff);
            }
          });
        }

        // search flights
        let query = `SELECT * FROM flights WHERE LOWER(from_city)=$1 AND LOWER(to_city)=$2`;
        let values = [from, to];

        if (targetDate) {
          query += ` AND DATE(departure_time)=$3`;
          values.push(targetDate.toISOString().split("T")[0]);
        }

        query += ` ORDER BY price ASC LIMIT 5`;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
          // fallback — show any available flights
          const fallback = await pool.query(
            `SELECT * FROM flights WHERE LOWER(from_city)=$1 AND LOWER(to_city)=$2 AND departure_time > NOW() ORDER BY price ASC LIMIT 5`,
            [from, to]
          );

          if (fallback.rows.length === 0) {
            replyMsg = `❌ No flights found from *${from}* to *${to}*.\n\nTry a different route or date.`;
          } else {
            session.flights = fallback.rows;
            session.step = "selecting";
            session.from = from;
            session.to = to;

            replyMsg = `✈️ *Flights from ${from.toUpperCase()} → ${to.toUpperCase()}*\n\n`;
            fallback.rows.forEach((f, i) => {
              const dep = new Date(f.departure_time).toLocaleTimeString("en-IN", {hour:"2-digit",minute:"2-digit",hour12:false});
              const arr = new Date(f.arrival_time).toLocaleTimeString("en-IN", {hour:"2-digit",minute:"2-digit",hour12:false});
              replyMsg += `*${i+1}. ${f.airline}*\n⏰ ${dep} → ${arr}\n💰 ₹${f.price.toLocaleString()}\n\n`;
            });
            replyMsg += `Reply with a number to book.\nExample: _1_ or _2 window seat_`;
          }
        } else {
          session.flights = result.rows;
          session.step = "selecting";
          session.from = from;
          session.to = to;

          replyMsg = `✈️ *Flights from ${from.toUpperCase()} → ${to.toUpperCase()}*\n\n`;
          result.rows.forEach((f, i) => {
            const dep = new Date(f.departure_time).toLocaleTimeString("en-IN", {hour:"2-digit",minute:"2-digit",hour12:false});
            const arr = new Date(f.arrival_time).toLocaleTimeString("en-IN", {hour:"2-digit",minute:"2-digit",hour12:false});
            replyMsg += `*${i+1}. ${f.airline}*\n⏰ ${dep} → ${arr}\n💰 ₹${f.price.toLocaleString()}\n\n`;
          });
          replyMsg += `Reply with a number to book.\nExample: _1_ or _2 window seat_`;
        }
      }
    }

    // ── STEP 2: User picks a flight number ──
    else if (session.step === "selecting") {
      const numMatch = incomingMsg.match(/^(\d+)/);

      if (!numMatch) {
        replyMsg = `Please reply with a number like *1*, *2*, or *3* to select a flight.`;
      } else {
        const flightIndex = parseInt(numMatch[1]) - 1;

        if (flightIndex < 0 || flightIndex >= session.flights.length) {
          replyMsg = `Invalid number. Please reply with 1 to ${session.flights.length}.`;
        } else {
          session.selectedFlight = session.flights[flightIndex];
          session.step = "naming";

          // check for seat preference
          if (incomingMsg.includes("window")) {
            session.seatPreference = "window";
          } else if (incomingMsg.includes("aisle")) {
            session.seatPreference = "aisle";
          }

          const f = session.selectedFlight;
          const dep = new Date(f.departure_time).toLocaleTimeString("en-IN", {hour:"2-digit",minute:"2-digit",hour12:false});

          replyMsg = `✅ *${f.airline} selected*\n⏰ ${dep}\n💰 ₹${f.price.toLocaleString()}\n`;

          if (session.seatPreference) {
            replyMsg += `🪟 Seat preference: *${session.seatPreference}*\n`;
          }

          replyMsg += `\nWhat is your full name for the booking?`;
        }
      }
    }

    // ── STEP 3: User gives their name ──
    else if (session.step === "naming") {
      const passengerName = req.body.Body.trim();
      session.passengerName = passengerName;
      session.step = "confirming";

      const f = session.selectedFlight;
      const dep = new Date(f.departure_time).toLocaleTimeString("en-IN", {hour:"2-digit",minute:"2-digit",hour12:false});
      const depDate = new Date(f.departure_time).toLocaleDateString("en-IN", {day:"numeric",month:"short"});

      replyMsg = `📋 *Booking Summary*\n\n`;
      replyMsg += `✈️ ${f.airline}\n`;
      replyMsg += `🛫 ${session.from?.toUpperCase()} → ${session.to?.toUpperCase()}\n`;
      replyMsg += `📅 ${depDate} at ${dep}\n`;
      replyMsg += `💰 ₹${f.price.toLocaleString()}\n`;
      replyMsg += `👤 ${passengerName}\n`;

      if (session.seatPreference) {
        replyMsg += `🪟 ${session.seatPreference} seat\n`;
      }

      replyMsg += `\nReply *CONFIRM* to book or *CANCEL* to start over.`;
    }

    // ── STEP 4: User confirms or cancels ──
    else if (session.step === "confirming") {
      if (incomingMsg === "confirm") {
        const f = session.selectedFlight;

        // save booking to database
        await pool.query(
          `INSERT INTO bookings (flight_id, passenger_name, user_id) VALUES ($1, $2, $3)`,
          [f.id, session.passengerName, 1]
        );

        // reduce seat count
        await pool.query(
          `UPDATE flights SET seats_available = seats_available - 1 WHERE id = $1`,
          [f.id]
        );

        const bookingId = "CMT" + Date.now().toString(36).toUpperCase().slice(-6);

        replyMsg = `🎉 *Booking Confirmed!*\n\n`;
        replyMsg += `✈️ ${f.airline}\n`;
        replyMsg += `🛫 ${session.from?.toUpperCase()} → ${session.to?.toUpperCase()}\n`;
        replyMsg += `👤 ${session.passengerName}\n`;
        replyMsg += `🎫 Booking ID: *${bookingId}*\n\n`;
        replyMsg += `Have a great flight! ☄️\n\n`;
        replyMsg += `Book another flight anytime by typing your route.`;

        // reset session
        userSessions[userPhone] = { step: "idle", flights: [] };

      } else if (incomingMsg === "cancel") {
        userSessions[userPhone] = { step: "idle", flights: [] };
        replyMsg = `Booking cancelled. Type your route anytime to search again.\n\nExample: _flights bangalore to mumbai tomorrow_`;
      } else {
        replyMsg = `Please reply *CONFIRM* to confirm or *CANCEL* to cancel.`;
      }
    }

  } catch (err) {
    console.error("WhatsApp bot error:", err);
    replyMsg = `Sorry, something went wrong. Please try again.\n\nType your route to search flights.`;
    userSessions[userPhone] = { step: "idle", flights: [] };
  }

  // send reply via Twilio
  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(replyMsg);
  res.type("text/xml").send(twiml.toString());
});

/* ---------------- REAL FLIGHT SEARCH (AviationStack) ---------------- */

app.get("/real-flights", async (req, res) => {
  try {
    const { from, to, date } = req.query;

    if (!from || !to) {
      return res.status(400).json({ message: "Please provide from and to cities" });
    }

    // get airport codes
    const cityToCode = {
      "bangalore": "BLR", "mumbai": "BOM", "delhi": "DEL",
      "chennai": "MAA", "hyderabad": "HYD", "kolkata": "CCU",
      "goa": "GOI", "pune": "PNQ", "kochi": "COK",
      "ahmedabad": "AMD", "jaipur": "JAI", "varanasi": "VNS",
      "dubai": "DXB", "singapore": "SIN"
    };

    const fromCode = cityToCode[from.toLowerCase()] || from.toUpperCase();
    const toCode = cityToCode[to.toLowerCase()] || to.toUpperCase();

    // call AviationStack API
    const response = await axios.get("http://api.aviationstack.com/v1/flights", {
      params: {
        access_key: process.env.AVIATIONSTACK_KEY,
        dep_iata: fromCode,
        arr_iata: toCode,
        limit: 10,
        flight_status: "scheduled"
      }
    });

    const flights = response.data.data;

    if (!flights || flights.length === 0) {
      return res.json([]);
    }

    // format flights to match our app structure
    const formatted = flights.map((f, i) => ({
      id: `real_${i}`,
      airline: f.airline?.name || "Unknown Airline",
      flight_no: f.flight?.iata || "—",
      from_city: f.departure?.airport || from,
      to_city: f.arrival?.airport || to,
      from_code: fromCode,
      to_code: toCode,
      departure_time: f.departure?.scheduled || null,
      arrival_time: f.arrival?.scheduled || null,
      price: Math.floor(Math.random() * 5000) + 2000, // mock price for now
      seats_available: Math.floor(Math.random() * 50) + 10,
      flight_status: f.flight_status || "scheduled",
      is_real: true
    }));

    res.json(formatted);

  } catch (err) {
    console.error("AviationStack error:", err.message);
    res.status(500).json({ message: "Flight search failed", error: err.message });
  }
});

/* ---------------- SEND BOOKING EMAIL ---------------- */

async function sendBookingEmail(toEmail, bookingDetails) {
  const {
    passengerName, airline, flightNo,
    fromCity, toCity, departureTime,
    arrivalTime, price, bookingId, cabinClass
  } = bookingDetails;

  const depTime = departureTime
    ? new Date(departureTime).toLocaleString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: false
      })
    : "—";

  const arrTime = arrivalTime
    ? new Date(arrivalTime).toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit", hour12: false
      })
    : "—";

  const mailOptions = {
    from: `"CometAI Travel ☄️" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `🚀 Booking Confirmed — ${bookingId} | CometAI Travel`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #01020a; color: #e8eaf6; border-radius: 16px; overflow: hidden;">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; color: white; letter-spacing: 2px;">☄️ COMETAI</h1>
          <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px; letter-spacing: 3px;">TRAVEL INTELLIGENCE</p>
        </div>

        <!-- Confirmed banner -->
        <div style="background: rgba(52,211,153,0.15); border-bottom: 1px solid rgba(52,211,153,0.3); padding: 16px 24px; text-align: center;">
          <p style="margin: 0; color: #6ee7b7; font-size: 18px; font-weight: bold;">✅ Booking Confirmed!</p>
        </div>

        <!-- Booking ID -->
        <div style="padding: 24px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.08);">
          <p style="margin: 0; font-size: 12px; letter-spacing: 2px; color: rgba(165,180,252,0.5);">BOOKING ID</p>
          <p style="margin: 8px 0 0; font-size: 28px; font-weight: bold; color: #a5b4fc; letter-spacing: 4px;">${bookingId}</p>
        </div>

        <!-- Flight details -->
        <div style="padding: 24px; border-bottom: 1px solid rgba(255,255,255,0.08);">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: rgba(165,180,252,0.5); font-size: 12px; letter-spacing: 1px;">PASSENGER</td>
              <td style="padding: 10px 0; color: #e0e7ff; font-weight: bold; text-align: right;">${passengerName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: rgba(165,180,252,0.5); font-size: 12px; letter-spacing: 1px;">AIRLINE</td>
              <td style="padding: 10px 0; color: #e0e7ff; font-weight: bold; text-align: right;">${airline} ${flightNo || ""}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: rgba(165,180,252,0.5); font-size: 12px; letter-spacing: 1px;">ROUTE</td>
              <td style="padding: 10px 0; color: #e0e7ff; font-weight: bold; text-align: right;">${fromCity} → ${toCity}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: rgba(165,180,252,0.5); font-size: 12px; letter-spacing: 1px;">DEPARTURE</td>
              <td style="padding: 10px 0; color: #e0e7ff; font-weight: bold; text-align: right;">${depTime}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: rgba(165,180,252,0.5); font-size: 12px; letter-spacing: 1px;">ARRIVAL</td>
              <td style="padding: 10px 0; color: #e0e7ff; font-weight: bold; text-align: right;">${arrTime}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: rgba(165,180,252,0.5); font-size: 12px; letter-spacing: 1px;">CLASS</td>
              <td style="padding: 10px 0; color: #e0e7ff; font-weight: bold; text-align: right;">${cabinClass || "Economy"}</td>
            </tr>
            <tr style="border-top: 1px solid rgba(255,255,255,0.08);">
              <td style="padding: 16px 0 0; color: rgba(165,180,252,0.5); font-size: 12px; letter-spacing: 1px;">AMOUNT PAID</td>
              <td style="padding: 16px 0 0; color: #a5f3fc; font-size: 22px; font-weight: bold; text-align: right;">₹${price?.toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <!-- Footer -->
        <div style="padding: 24px; text-align: center;">
          <p style="margin: 0; color: rgba(165,180,252,0.4); font-size: 13px; line-height: 1.7;">
            Thank you for booking with CometAI Travel! ☄️<br/>
            Have a wonderful journey.<br/><br/>
            <a href="https://comet-ai-frontend.vercel.app" style="color: #818cf8;">comet-ai-frontend.vercel.app</a>
          </p>
        </div>

      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

/* ---------------- START SERVER ---------------- */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});