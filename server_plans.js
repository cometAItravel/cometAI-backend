// server_plans.js — ALVRYN
// Tier logic, AI routing, feedback, trip counter, usage tracking, admin controls

"use strict";
const jwt = require("jsonwebtoken");

const FREE_DAILY_LIMIT = 20;
const PRO_DAILY_LIMIT  = 9999;

module.exports = function(app, pool) {

  // ── AUTO-MIGRATION ──────────────────────────────────────────────────────────
  async function migrate() {
    try {
      await pool.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'explorer';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_type VARCHAR(20) DEFAULT 'free';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expiry TIMESTAMP;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_start TIMESTAMP;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS trip_plans_this_month INTEGER DEFAULT 0;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS trip_plans_reset_at TIMESTAMP DEFAULT NOW();
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ai_feedback (
          id           SERIAL PRIMARY KEY,
          user_id      INTEGER,
          message_id   VARCHAR(64),
          user_message TEXT,
          ai_response  TEXT,
          rating       SMALLINT NOT NULL,
          reason       TEXT,
          created_at   TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_feedback_user   ON ai_feedback(user_id);
        CREATE INDEX IF NOT EXISTS idx_feedback_rating ON ai_feedback(rating);
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS waitlist (
          id         SERIAL PRIMARY KEY,
          email      VARCHAR(255) UNIQUE,
          plan       VARCHAR(30),
          plan_type  VARCHAR(30) DEFAULT 'pro',
          name       VARCHAR(255),
          source     VARCHAR(60) DEFAULT 'web',
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS usage_tracking (
          id              SERIAL PRIMARY KEY,
          user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          date            DATE    NOT NULL DEFAULT CURRENT_DATE,
          message_count   INTEGER NOT NULL DEFAULT 0,
          trip_plan_count INTEGER NOT NULL DEFAULT 0,
          updated_at      TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, date)
        );
        CREATE INDEX IF NOT EXISTS idx_usage_user_date ON usage_tracking(user_id, date);
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS plan_events (
          id          SERIAL PRIMARY KEY,
          user_id     INTEGER NOT NULL,
          old_plan    VARCHAR(20),
          new_plan    VARCHAR(20),
          changed_by  VARCHAR(60) DEFAULT 'system',
          note        TEXT,
          created_at  TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log("server_plans.js: migration OK");
    } catch(e) {
      console.error("server_plans.js migration error:", e.message);
    }
  }
  migrate();

  // ── AUTH MIDDLEWARE ─────────────────────────────────────────────────────────
  function auth(req, res, next) {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token required" });
    jwt.verify(token, process.env.JWT_SECRET || "secretkey", (err, user) => {
      if (err) return res.status(403).json({ message: "Invalid token" });
      req.user = user;
      next();
    });
  }

  // ── GET USER PLAN ───────────────────────────────────────────────────────────
  async function getUserPlan(userId) {
    if (!userId) return "explorer";
    try {
      const r = await pool.query(
        "SELECT plan, plan_type, plan_expires_at, plan_expiry FROM users WHERE id=$1", [userId]
      );
      if (!r.rows.length) return "explorer";
      const row = r.rows[0];
      // Support both old (plan/plan_expires_at) and new (plan_type/plan_expiry) columns
      const plan    = row.plan_type || row.plan || "explorer";
      const expiry  = row.plan_expiry || row.plan_expires_at;
      if (expiry && new Date(expiry) < new Date()) return "explorer";
      return plan;
    } catch { return "explorer"; }
  }

  // ── TODAY'S MESSAGE COUNT ───────────────────────────────────────────────────
  async function getTodayCount(userId) {
    if (!userId) return 0;
    try {
      const r = await pool.query(
        `SELECT message_count FROM usage_tracking
         WHERE user_id=$1
           AND date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date`,
        [userId]
      );
      return r.rows[0]?.message_count || 0;
    } catch { return 0; }
  }

  // ── INCREMENT USAGE ─────────────────────────────────────────────────────────
  async function incrementUsage(userId) {
    if (!userId) return 0;
    try {
      const r = await pool.query(
        `INSERT INTO usage_tracking (user_id, date, message_count, updated_at)
         VALUES ($1, (NOW() AT TIME ZONE 'Asia/Kolkata')::date, 1, NOW())
         ON CONFLICT (user_id, date)
         DO UPDATE SET message_count = usage_tracking.message_count + 1, updated_at = NOW()
         RETURNING message_count`,
        [userId]
      );
      return r.rows[0]?.message_count || 1;
    } catch { return 0; }
  }

  // ── CHECK USAGE LIMIT ───────────────────────────────────────────────────────
  async function checkUsageLimit(userId) {
    const plan  = await getUserPlan(userId);
    const limit = (plan === "explorer" || plan === "free") ? FREE_DAILY_LIMIT : PRO_DAILY_LIMIT;
    const used  = await getTodayCount(userId);
    return {
      plan,
      used,
      limit,
      allowed   : used < limit,
      remaining : Math.max(0, limit - used),
      isProUser : plan !== "explorer" && plan !== "free",
    };
  }

  // ── CHECK TRIP PLAN LIMIT ───────────────────────────────────────────────────
  async function checkTripPlanLimit(userId) {
    if (!userId) return { allowed: true, remaining: 2 };
    try {
      const r = await pool.query(
        "SELECT plan, plan_type, trip_plans_this_month, trip_plans_reset_at FROM users WHERE id=$1",
        [userId]
      );
      if (!r.rows.length) return { allowed: true, remaining: 2 };
      const row  = r.rows[0];
      const plan = row.plan_type || row.plan || "explorer";
      const resetAt = new Date(row.trip_plans_reset_at || 0);
      const now = new Date();
      if (now.getMonth() !== resetAt.getMonth() || now.getFullYear() !== resetAt.getFullYear()) {
        await pool.query(
          "UPDATE users SET trip_plans_this_month=0, trip_plans_reset_at=NOW() WHERE id=$1", [userId]
        );
        return { allowed: true, remaining: plan === "explorer" ? 2 : 999 };
      }
      const limit = plan === "explorer" ? 2 : 999;
      const used  = row.trip_plans_this_month || 0;
      return { allowed: used < limit, remaining: Math.max(0, limit - used) };
    } catch { return { allowed: true, remaining: 2 }; }
  }

  // ── INCREMENT TRIP PLAN ─────────────────────────────────────────────────────
  async function incrementTripPlan(userId) {
    if (!userId) return;
    try {
      await pool.query(
        "UPDATE users SET trip_plans_this_month = COALESCE(trip_plans_this_month,0) + 1 WHERE id=$1",
        [userId]
      );
    } catch {}
  }

  // ── UPGRADE PLAN ────────────────────────────────────────────────────────────
  async function upgradePlan(userId, plan, daysValid, changedBy, note) {
    const expiry = daysValid
      ? new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000)
      : null;
    await pool.query(
      `UPDATE users SET plan_type=$1, plan=$1, plan_expiry=$2, plan_expires_at=$2, plan_start=NOW() WHERE id=$3`,
      [plan, expiry, userId]
    );
    await pool.query(
      `INSERT INTO plan_events (user_id, new_plan, changed_by, note) VALUES ($1, $2, $3, $4)`,
      [userId, plan, changedBy || "admin", note || ""]
    );
  }

  // ── BUILD SYSTEM PROMPT ─────────────────────────────────────────────────────
  function buildSystemPrompt(userContext) {
    const { name, homecity, plan, preferences } = userContext || {};
    return `You are ALVI — a brilliant, warm, and witty travel companion for Indian travellers.
You work for ALVRYN (alvryn.in), an AI-powered travel platform.

CRITICAL: When user sends ANY message extract and address EVERY piece of information.
NEVER ignore constraints like group size, dietary needs, late arrivals, budget, preferences.

${name ? `User's name: ${name}` : ""}
${homecity ? `User's home city: ${homecity}` : ""}
${preferences ? `Known preferences: ${JSON.stringify(preferences)}` : ""}
Current plan: ${plan || "explorer"}

PERSONALITY: Warm, funny, witty like a knowledgeable friend. Never robotic. Never mention competitor names.

For trip plans structure: Overview → Getting There → Stay → Itinerary → Budget Breakdown → Tips.
Always give per-person AND total costs for groups.`;
  }

  // ── EXPOSE TO APP ───────────────────────────────────────────────────────────
  app.locals.getUserPlan        = getUserPlan;
  app.locals.checkTripPlanLimit = checkTripPlanLimit;
  app.locals.incrementTripPlan  = incrementTripPlan;
  app.locals.buildSystemPrompt  = buildSystemPrompt;
  app.locals.incrementUsage     = incrementUsage;
  app.locals.checkUsageLimit    = checkUsageLimit;
  app.locals.getTodayCount      = getTodayCount;

  // ── USER: MY PLAN ───────────────────────────────────────────────────────────
  app.get("/my-plan", auth, async (req, res) => {
    try {
      const r = await pool.query(
        "SELECT plan, plan_type, plan_expiry, plan_expires_at, plan_start, name, email, whatsapp_number FROM users WHERE id=$1",
        [req.user.id]
      );
      const user = r.rows[0] || {};
      const plan   = user.plan_type || user.plan || "explorer";
      const expiry = user.plan_expiry || user.plan_expires_at;
      let effectivePlan = plan;
      if (plan !== "explorer" && plan !== "free" && expiry && new Date(expiry) < new Date()) {
        await pool.query("UPDATE users SET plan_type='explorer', plan='explorer' WHERE id=$1", [req.user.id]);
        effectivePlan = "explorer";
      }
      const used      = await getTodayCount(req.user.id);
      const limit     = (effectivePlan === "explorer" || effectivePlan === "free") ? FREE_DAILY_LIMIT : PRO_DAILY_LIMIT;
      res.json({
        plan          : effectivePlan,
        planExpiry    : expiry,
        planStart     : user.plan_start,
        messagesUsed  : used,
        messagesLimit : limit,
        remaining     : Math.max(0, limit - used),
        resetHour     : "12:00 AM IST",
        isProUser     : effectivePlan !== "explorer" && effectivePlan !== "free",
        whatsappNumber: user.whatsapp_number || null,
        features: {
          unlimitedMessages  : effectivePlan !== "explorer" && effectivePlan !== "free",
          chatHistory        : true,
          flightSearch       : true,
          safetyInsights     : true,
          waCheckin          : true,
        },
      });
    } catch (e) {
      res.status(500).json({ message: "Error loading plan", error: e.message });
    }
  });

  // ── USER: TRACK USAGE ───────────────────────────────────────────────────────
  app.post("/usage/track", auth, async (req, res) => {
    try {
      const newCount = await incrementUsage(req.user.id);
      const plan     = await getUserPlan(req.user.id);
      const limit    = (plan === "explorer" || plan === "free") ? FREE_DAILY_LIMIT : PRO_DAILY_LIMIT;
      res.json({ ok:true, used:newCount, limit, remaining:Math.max(0,limit-newCount), blocked:newCount>=limit });
    } catch { res.status(500).json({ message:"Error tracking usage" }); }
  });

  // ── USER: TODAY USAGE ───────────────────────────────────────────────────────
  app.get("/usage/today", auth, async (req, res) => {
    try {
      res.json(await checkUsageLimit(req.user.id));
    } catch {
      res.json({ plan:"explorer", used:0, limit:FREE_DAILY_LIMIT, allowed:true, remaining:FREE_DAILY_LIMIT });
    }
  });

  // ── FEEDBACK ────────────────────────────────────────────────────────────────
  app.post("/feedback", async (req, res) => {
    try {
      const { message_id, user_message, ai_response, rating, reason } = req.body;
      const token = req.headers["authorization"]?.split(" ")[1];
      let userId = null;
      if (token) { try { const d = jwt.verify(token, process.env.JWT_SECRET||"secretkey"); userId=d.id; } catch {} }
      await pool.query(
        `INSERT INTO ai_feedback (user_id,message_id,user_message,ai_response,rating,reason)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [userId, message_id||null, user_message||"", ai_response||"", rating||0, reason||null]
      );
      res.json({ ok: true });
    } catch(e) { res.json({ ok:false, error:e.message }); }
  });

  // ── WAITLIST ─────────────────────────────────────────────────────────────────
  app.post("/waitlist", async (req, res) => {
    try {
      const { email, plan, plan_type, name, source } = req.body;
      if (!email) return res.status(400).json({ error:"Email required" });
      await pool.query(
        `INSERT INTO waitlist (email, plan, plan_type, name, source)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (email) DO NOTHING`,
        [email.trim().toLowerCase(), plan||plan_type||"pro", plan_type||plan||"pro", name||"", source||"web"]
      );
      res.json({ ok:true, message:"Added to waitlist!" });
    } catch(e) { res.json({ ok:false, error:e.message }); }
  });

  // ── WHATSAPP NUMBER ──────────────────────────────────────────────────────────
  app.put("/whatsapp-number", auth, async (req, res) => {
    try {
      const { whatsapp_number } = req.body;
      const clean = (whatsapp_number || "").replace(/[^\d+]/g, "");
      if (clean.length < 10) return res.status(400).json({ message:"Invalid number" });
      await pool.query("UPDATE users SET whatsapp_number=$1 WHERE id=$2", [clean, req.user.id]);
      res.json({ ok:true });
    } catch(e) { res.status(500).json({ error:e.message }); }
  });

  // Old POST endpoint some clients may still call
  app.post("/whatsapp-number", async (req, res) => {
    try {
      const { userId, whatsappNumber, whatsapp_number } = req.body;
      const num   = whatsappNumber || whatsapp_number || "";
      const clean = num.replace(/[^\d+]/g, "");
      if (!userId || clean.length < 10) return res.status(400).json({ error:"Missing fields" });
      await pool.query("UPDATE users SET whatsapp_number=$1 WHERE id=$2", [clean, userId]);
      res.json({ ok:true });
    } catch(e) { res.status(500).json({ error:e.message }); }
  });

  // ── ADMIN: WAITLIST ──────────────────────────────────────────────────────────
  app.get("/admin/waitlist", async (req, res) => {
    try {
      const r = await pool.query("SELECT * FROM waitlist ORDER BY created_at DESC LIMIT 200");
      res.json(r.rows);
    } catch { res.json([]); }
  });

  // ── ADMIN: FEEDBACK ──────────────────────────────────────────────────────────
  app.get("/admin/feedback", async (req, res) => {
    try {
      const r = await pool.query(
        `SELECT af.*, u.name as user_name, u.email as user_email
         FROM ai_feedback af LEFT JOIN users u ON af.user_id=u.id
         ORDER BY af.created_at DESC LIMIT 100`
      );
      res.json(r.rows);
    } catch { res.json([]); }
  });

  app.get("/admin/feedback/stats", async (req, res) => {
    try {
      const r = await pool.query(
        `SELECT COUNT(*) as total,
                SUM(CASE WHEN rating=1 THEN 1 ELSE 0 END) as positive,
                SUM(CASE WHEN rating=-1 OR rating=0 THEN 1 ELSE 0 END) as negative
         FROM ai_feedback`
      );
      res.json(r.rows[0]);
    } catch { res.json({ total:0, positive:0, negative:0 }); }
  });

  // ── ADMIN: UPGRADE / DOWNGRADE ───────────────────────────────────────────────
  app.post("/admin/upgrade", async (req, res) => {
    try {
      const { email, userId, plan, days, note, adminKey } = req.body;
      if (adminKey !== (process.env.ADMIN_KEY || "alvryn_admin_2024")) {
        return res.status(403).json({ message:"Invalid admin key" });
      }
      let uid = userId;
      if (!uid && email) {
        const r = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
        if (!r.rows.length) return res.status(404).json({ message:"User not found" });
        uid = r.rows[0].id;
      }
      if (!uid) return res.status(400).json({ message:"Provide email or userId" });
      const planType  = plan || "navigator";
      const daysValid = parseInt(days) || 30;
      await upgradePlan(uid, planType, daysValid, "admin", note || "Manual upgrade");
      const expiry = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000);
      res.json({ ok:true, message:`User ${uid} upgraded to ${planType}`, expiry:expiry.toISOString(), days:daysValid });
    } catch(e) { res.status(500).json({ message:"Upgrade failed", error:e.message }); }
  });

  app.post("/admin/downgrade", async (req, res) => {
    try {
      const { email, userId, adminKey } = req.body;
      if (adminKey !== (process.env.ADMIN_KEY || "alvryn_admin_2024")) {
        return res.status(403).json({ message:"Invalid admin key" });
      }
      let uid = userId;
      if (!uid && email) {
        const r = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
        if (!r.rows.length) return res.status(404).json({ message:"User not found" });
        uid = r.rows[0].id;
      }
      await pool.query("UPDATE users SET plan_type='explorer', plan='explorer', plan_expiry=NULL WHERE id=$1", [uid]);
      await pool.query(
        "INSERT INTO plan_events (user_id, new_plan, changed_by) VALUES ($1,'explorer','admin')", [uid]
      );
      res.json({ ok:true, message:`User ${uid} downgraded to explorer` });
    } catch(e) { res.status(500).json({ message:"Downgrade failed", error:e.message }); }
  });

  // ── ADMIN: PLANS OVERVIEW ────────────────────────────────────────────────────
  app.get("/admin/plans", async (req, res) => {
    try {
      const r = await pool.query(`
        SELECT u.id, u.name, u.email,
               COALESCE(u.plan_type, u.plan, 'explorer') as plan,
               u.plan_expiry, u.plan_start,
               COALESCE(ut.message_count, 0) AS messages_today
        FROM users u
        LEFT JOIN usage_tracking ut
          ON ut.user_id = u.id
         AND ut.date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date
        ORDER BY u.id DESC LIMIT 200
      `);
      res.json(r.rows);
    } catch(e) { res.status(500).json({ message:"Error loading plans" }); }
  });

  // ── ADMIN: USAGE STATS ───────────────────────────────────────────────────────
  app.get("/admin/usage-stats", async (req, res) => {
    try {
      const r = await pool.query(`
        SELECT ut.date,
               COUNT(DISTINCT ut.user_id) AS active_users,
               SUM(ut.message_count)      AS total_messages,
               MAX(ut.message_count)      AS max_by_single_user
        FROM usage_tracking ut
        WHERE ut.date >= (NOW() AT TIME ZONE 'Asia/Kolkata')::date - 30
        GROUP BY ut.date ORDER BY ut.date DESC
      `);
      res.json(r.rows);
    } catch(e) { res.status(500).json({ message:"Error loading usage stats" }); }
  });

  // ── PAYMENT PLACEHOLDERS ─────────────────────────────────────────────────────
  app.post("/payment/create-order", auth, async (req, res) => {
    res.json({
      message: "Payment coming soon",
      plans: [
        { id:"navigator", name:"Alvryn Navigator", price:29900, period:"month" },
        { id:"voyager",   name:"Alvryn Voyager",   price:59900, period:"month" },
      ],
    });
  });

  app.post("/payment/webhook", async (req, res) => {
    res.json({ received: true });
  });

  console.log("✅ server_plans.js mounted — Plans, Usage, Admin, Feedback, Waitlist");
};