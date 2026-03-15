const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
require("dotenv").config();
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

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
    const { flight_id, passenger_name } = req.body;
    const user_id = req.user.id;

    await client.query("BEGIN");

    const flight = await client.query(
      "SELECT seats_available FROM flights WHERE id=$1 FOR UPDATE",
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
    res.json({ message: "Booking confirmed!" });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).send("Server Error");
  } finally {
    client.release();
  }
});

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

/* ---------------- START SERVER ---------------- */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});