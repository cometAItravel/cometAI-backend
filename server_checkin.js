/**
 * ALVRYN — server_checkin.js
 * Handles:
 *  - Collecting user's WhatsApp number at end of trip plan (Section 6)
 *  - Storing trip check-in schedules in DB
 *  - Sending WhatsApp check-in messages via Twilio when trip date arrives
 *  - Manual check-in confirmation from user
 *  - Common for ALL tiers (Explorer, Navigator, Voyager)
 */

"use strict";

const twilio = require("twilio");

module.exports = function mountCheckin(app, pool) {

  // ── AUTO MIGRATION ──────────────────────────────────────────────────────────
  async function runCheckinMigrations() {
    try {
      // Trip check-in schedules table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS trip_checkins (
          id              SERIAL PRIMARY KEY,
          user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
          whatsapp_number VARCHAR(20) NOT NULL,
          destination     VARCHAR(100),
          travel_date     DATE,
          checkin_sent    BOOLEAN DEFAULT FALSE,
          checkin_sent_at TIMESTAMP,
          user_replied    BOOLEAN DEFAULT FALSE,
          user_reply      TEXT,
          created_at      TIMESTAMP DEFAULT NOW()
        )
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_checkins_user
        ON trip_checkins(user_id)
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_checkins_date
        ON trip_checkins(travel_date, checkin_sent)
      `);

      console.log("✅ server_checkin.js migrations complete");
    } catch (e) {
      console.error("❌ server_checkin.js migration error:", e.message);
    }
  }

  runCheckinMigrations();

  // ── TWILIO HELPER ────────────────────────────────────────────────────────────
  function getTwilioClient() {
    const sid   = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) return null;
    try { return twilio(sid, token); } catch { return null; }
  }

  const TWILIO_WA_FROM = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

  async function sendWhatsAppMessage(to, message) {
    const client = getTwilioClient();
    if (!client) {
      console.log("[Checkin] Twilio not configured — skipping WA send");
      return false;
    }
    try {
      // Normalise number — add whatsapp: prefix
      let toNumber = to.replace(/[^0-9+]/g, "");
      if (!toNumber.startsWith("+")) toNumber = "+" + toNumber;
      const toWA = `whatsapp:${toNumber}`;

      await client.messages.create({
        from: TWILIO_WA_FROM,
        to:   toWA,
        body: message,
      });
      return true;
    } catch (e) {
      console.error("[Checkin] WhatsApp send error:", e.message);
      return false;
    }
  }

  // ── CHECK-IN MESSAGE TEMPLATES ───────────────────────────────────────────────
  function buildCheckinMessage(destination, userName) {
    const name = userName ? userName.split(" ")[0] : "Traveller";
    const dest = destination
      ? destination.charAt(0).toUpperCase() + destination.slice(1)
      : "your destination";

    return (
      `✈️ *Hey ${name}!*\n\n` +
      `This is ALVRYN — your travel companion.\n\n` +
      `Hope you've arrived safely in *${dest}*! 🌍\n\n` +
      `Did you reach safely? Just reply:\n` +
      `✅ *Yes* — to confirm safe arrival\n` +
      `🆘 *Help* — if you need assistance\n\n` +
      `_We care more about your journey than just your ticket._ 🛡️\n` +
      `— ALVRYN Team`
    );
  }

  function buildConfirmationMessage(destination) {
    const dest = destination
      ? destination.charAt(0).toUpperCase() + destination.slice(1)
      : "your destination";
    return (
      `🎉 *Safe arrival confirmed!*\n\n` +
      `So happy to know you reached *${dest}* safely!\n\n` +
      `Enjoy your trip! If you need any local tips, transport or hotel suggestions, ` +
      `just visit *alvryn.in/ai* and ask our AI — it's always ready to help. 🌟\n\n` +
      `_Safe travels!_ ✈️`
    );
  }

  // ── SCHEDULED CHECK-IN PROCESSOR ─────────────────────────────────────────────
  // Runs every hour — checks for trips happening today and sends check-ins
  async function processScheduledCheckins() {
    try {
      const now   = new Date();
      const today = now.toISOString().split("T")[0];

      // Find all unsent check-ins for today
      const r = await pool.query(`
        SELECT
          tc.id,
          tc.whatsapp_number,
          tc.destination,
          tc.travel_date,
          tc.user_id,
          u.name AS user_name
        FROM trip_checkins tc
        LEFT JOIN users u ON tc.user_id = u.id
        WHERE
          tc.travel_date = $1
          AND tc.checkin_sent = FALSE
      `, [today]);

      if (!r.rows.length) return;

      console.log(`[Checkin] Processing ${r.rows.length} check-ins for ${today}`);

      for (const checkin of r.rows) {
        const message = buildCheckinMessage(checkin.destination, checkin.user_name);
        const sent    = await sendWhatsAppMessage(checkin.whatsapp_number, message);

        // Mark as sent regardless — don't keep retrying if Twilio fails
        await pool.query(`
          UPDATE trip_checkins
          SET checkin_sent = TRUE, checkin_sent_at = NOW()
          WHERE id = $1
        `, [checkin.id]);

        if (sent) {
          console.log(`[Checkin] ✅ Sent to ${checkin.whatsapp_number} for ${checkin.destination}`);
        }
      }
    } catch (e) {
      console.error("[Checkin] Scheduler error:", e.message);
    }
  }

  // Run immediately on startup (in case server restarted on trip day)
  processScheduledCheckins().catch(() => {});

  // Then run every hour
  const CHECKIN_INTERVAL = 60 * 60 * 1000; // 1 hour
  setInterval(processScheduledCheckins, CHECKIN_INTERVAL);

  // ── AUTH HELPERS ─────────────────────────────────────────────────────────────
  const jwt = require("jsonwebtoken");

  function authOptional(req) {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return null;
    try { return jwt.verify(token, process.env.JWT_SECRET || "secretkey"); }
    catch { return null; }
  }

  function authRequired(req, res, next) {
    const user = authOptional(req);
    if (!user) return res.status(401).json({ message: "Token required" });
    req.user = user;
    next();
  }

  // ── ROUTES ───────────────────────────────────────────────────────────────────

  /**
   * POST /checkin/register
   * Called at end of Section 6 (trip plan complete) to save check-in details.
   * Body: { whatsapp_number, destination, travel_date }
   */
  app.post("/checkin/register", authRequired, async (req, res) => {
    try {
      const { whatsapp_number, destination, travel_date } = req.body;
      const userId = req.user.id;

      if (!whatsapp_number) {
        return res.status(400).json({ message: "WhatsApp number is required" });
      }

      // Clean + validate number
      const clean = whatsapp_number.replace(/[^\d+]/g, "");
      if (clean.length < 10 || clean.length > 16) {
        return res.status(400).json({ message: "Invalid number — must be 10–15 digits" });
      }

      // Save WhatsApp number to user profile too
      await pool.query(
        "UPDATE users SET whatsapp_number=$1 WHERE id=$2",
        [clean, userId]
      );

      // Save check-in schedule
      let parsedDate = null;
      if (travel_date) {
        try {
          parsedDate = new Date(travel_date).toISOString().split("T")[0];
        } catch {}
      }

      await pool.query(`
        INSERT INTO trip_checkins
          (user_id, whatsapp_number, destination, travel_date)
        VALUES ($1, $2, $3, $4)
      `, [userId, clean, destination || null, parsedDate]);

      // Send immediate confirmation message so user knows it worked
      const userName = await pool.query(
        "SELECT name FROM users WHERE id=$1",
        [userId]
      ).then(r => r.rows[0]?.name || "").catch(() => "");

      const confirmMsg =
        `✅ *Check-in registered!*\n\n` +
        `Hi ${userName.split(" ")[0] || "there"}! 👋\n\n` +
        `ALVRYN will check in with you on *${parsedDate || "your travel date"}* ` +
        `to make sure you reached *${destination || "your destination"}* safely.\n\n` +
        `_We care more about your journey than just your ticket._ 🛡️`;

      // Send confirmation (non-blocking — don't fail if Twilio is down)
      sendWhatsAppMessage(clean, confirmMsg).catch(() => {});

      res.json({
        ok: true,
        message: `Check-in registered! We'll message you on WhatsApp on your travel date.`,
        travel_date: parsedDate,
        destination,
      });

    } catch (e) {
      console.error("Checkin register error:", e.message);
      res.status(500).json({ message: "Error registering check-in" });
    }
  });

  /**
   * POST /checkin/confirm
   * Called when user replies "Yes" or "Help" to the WhatsApp message.
   * Also handles the WhatsApp webhook reply.
   */
  app.post("/checkin/confirm", async (req, res) => {
    try {
      const { whatsapp_number, reply } = req.body;
      if (!whatsapp_number || !reply) {
        return res.status(400).json({ message: "whatsapp_number and reply required" });
      }

      const clean     = whatsapp_number.replace(/[^\d+]/g, "");
      const replyLow  = reply.toLowerCase().trim();

      // Find the most recent check-in for this number
      const r = await pool.query(`
        SELECT id, destination FROM trip_checkins
        WHERE whatsapp_number = $1
        AND checkin_sent = TRUE
        AND user_replied = FALSE
        ORDER BY created_at DESC LIMIT 1
      `, [clean]);

      if (!r.rows.length) {
        return res.json({ ok: true, message: "No pending check-in found" });
      }

      const checkin = r.rows[0];

      // Mark as replied
      await pool.query(`
        UPDATE trip_checkins
        SET user_replied = TRUE, user_reply = $1
        WHERE id = $2
      `, [reply, checkin.id]);

      // Respond appropriately
      if (replyLow === "yes" || replyLow.includes("safe") || replyLow.includes("reached")) {
        const msg = buildConfirmationMessage(checkin.destination);
        await sendWhatsAppMessage(clean, msg);
        return res.json({ ok: true, status: "safe_confirmed" });
      }

      if (replyLow === "help" || replyLow.includes("help") || replyLow.includes("emergency")) {
        const helpMsg =
          `🆘 *Help request received!*\n\n` +
          `We've noted your request.\n\n` +
          `*Emergency contacts:*\n` +
          `🚨 Local Emergency: 112 (international)\n` +
          `🚨 Indian Emergency: 100 (Police) | 108 (Ambulance)\n\n` +
          `Please contact local authorities immediately if you are in danger.\n\n` +
          `Stay safe — the ALVRYN team is thinking of you. 🙏`;
        await sendWhatsAppMessage(clean, helpMsg);
        return res.json({ ok: true, status: "help_sent" });
      }

      return res.json({ ok: true, status: "reply_saved" });

    } catch (e) {
      console.error("Checkin confirm error:", e.message);
      res.status(500).json({ message: "Error processing reply" });
    }
  });

  /**
   * GET /my-checkins
   * Get all check-ins for the logged-in user.
   */
  app.get("/my-checkins", authRequired, async (req, res) => {
    try {
      const r = await pool.query(`
        SELECT
          id, destination, travel_date,
          checkin_sent, checkin_sent_at,
          user_replied, user_reply,
          created_at
        FROM trip_checkins
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 20
      `, [req.user.id]);
      res.json(r.rows);
    } catch {
      res.json([]);
    }
  });

  /**
   * GET /admin/checkins
   * Admin view of all check-ins.
   */
  app.get("/admin/checkins", async (req, res) => {
    try {
      const r = await pool.query(`
        SELECT
          tc.id,
          tc.destination,
          tc.travel_date,
          tc.whatsapp_number,
          tc.checkin_sent,
          tc.checkin_sent_at,
          tc.user_replied,
          tc.user_reply,
          tc.created_at,
          u.name  AS user_name,
          u.email AS user_email
        FROM trip_checkins tc
        LEFT JOIN users u ON tc.user_id = u.id
        ORDER BY tc.created_at DESC
        LIMIT 200
      `);
      res.json(r.rows);
    } catch {
      res.status(500).json({ message: "Error loading check-ins" });
    }
  });

  /**
   * POST /admin/checkins/trigger
   * Manually trigger check-in processing (admin use — for testing).
   */
  app.post("/admin/checkins/trigger", async (req, res) => {
    try {
      await processScheduledCheckins();
      res.json({ ok: true, message: "Check-in processing triggered" });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });

  // Expose scheduler to app for external triggering if needed
  app.locals.processScheduledCheckins = processScheduledCheckins;
  app.locals.sendWhatsAppMessage      = sendWhatsAppMessage;

  console.log("✅ server_checkin.js mounted — WhatsApp Check-In System active");
};