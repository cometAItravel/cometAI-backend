/**
 * ALVRYN — server_plans.js
 * Handles:
 *  - Auto DB migration (plan columns + feedback table)
 *  - Plan reading middleware
 *  - Trip plan counter (2/month for free tier)
 *  - AI routing logic (Groq → GPT → Claude based on plan)
 *  - Feedback (thumbs up/down + optional reason)
 */

"use strict";

module.exports = function mountPlans(app, pool) {

  // ── AUTO MIGRATION ──────────────────────────────────────────────────────────
  // Runs on server start. Safe — uses IF NOT EXISTS / IF NOT EXISTS column checks.
  async function runMigrations() {
    try {
      // Add plan columns to users table
      await pool.query(`
        ALTER TABLE users
          ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'explorer'
      `);
      await pool.query(`
        ALTER TABLE users
          ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP
      `);
      await pool.query(`
        ALTER TABLE users
          ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20)
      `);
      await pool.query(`
        ALTER TABLE users
          ADD COLUMN IF NOT EXISTS trip_plans_this_month INTEGER DEFAULT 0
      `);
      await pool.query(`
        ALTER TABLE users
          ADD COLUMN IF NOT EXISTS trip_plans_reset_at TIMESTAMP DEFAULT NOW()
      `);

      // Feedback table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ai_feedback (
          id           SERIAL PRIMARY KEY,
          user_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
          message_id   VARCHAR(64),
          user_message TEXT,
          ai_response  TEXT,
          rating       SMALLINT NOT NULL CHECK (rating IN (1, -1)),
          reason       TEXT,
          created_at   TIMESTAMP DEFAULT NOW()
        )
      `);

      // Index for fast feedback lookup
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_feedback_user
        ON ai_feedback(user_id)
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_feedback_rating
        ON ai_feedback(rating)
      `);

      console.log("✅ server_plans.js migrations complete");
    } catch (e) {
      console.error("❌ server_plans.js migration error:", e.message);
    }
  }

  runMigrations();

  // ── HELPERS ─────────────────────────────────────────────────────────────────

  /**
   * Read user's current plan from DB.
   * Returns 'explorer' | 'navigator' | 'voyager'
   * Falls back to 'explorer' on any error.
   */
  async function getUserPlan(userId) {
    if (!userId) return "explorer";
    try {
      const r = await pool.query(
        "SELECT plan, plan_expires_at FROM users WHERE id=$1",
        [userId]
      );
      if (!r.rows.length) return "explorer";
      const { plan, plan_expires_at } = r.rows[0];

      // If plan has expiry and it's past — downgrade to explorer
      if (plan !== "explorer" && plan_expires_at && new Date(plan_expires_at) < new Date()) {
        await pool.query(
          "UPDATE users SET plan='explorer', plan_expires_at=NULL WHERE id=$1",
          [userId]
        );
        return "explorer";
      }
      return plan || "explorer";
    } catch {
      return "explorer";
    }
  }

  /**
   * Check and increment trip plan counter for free-tier users.
   * Resets counter monthly.
   * Returns: { allowed: bool, used: number, limit: number }
   */
  async function checkTripPlanLimit(userId, plan) {
    // Pro and Premium have unlimited trip plans
    if (plan !== "explorer") return { allowed: true, used: 0, limit: Infinity };
    if (!userId) return { allowed: false, used: 2, limit: 2 };

    try {
      const r = await pool.query(
        "SELECT trip_plans_this_month, trip_plans_reset_at FROM users WHERE id=$1",
        [userId]
      );
      if (!r.rows.length) return { allowed: false, used: 2, limit: 2 };

      let { trip_plans_this_month, trip_plans_reset_at } = r.rows[0];
      const count = trip_plans_this_month || 0;
      const resetAt = trip_plans_reset_at ? new Date(trip_plans_reset_at) : new Date();
      const now = new Date();

      // Reset counter if it's been more than 30 days
      if ((now - resetAt) > 30 * 24 * 60 * 60 * 1000) {
        await pool.query(
          "UPDATE users SET trip_plans_this_month=0, trip_plans_reset_at=NOW() WHERE id=$1",
          [userId]
        );
        return { allowed: true, used: 0, limit: 2 };
      }

      if (count >= 2) return { allowed: false, used: count, limit: 2 };
      return { allowed: true, used: count, limit: 2 };
    } catch {
      return { allowed: true, used: 0, limit: 2 };
    }
  }

  /**
   * Increment trip plan counter for a user.
   */
  async function incrementTripPlanCount(userId) {
    if (!userId) return;
    try {
      await pool.query(
        "UPDATE users SET trip_plans_this_month = COALESCE(trip_plans_this_month,0) + 1 WHERE id=$1",
        [userId]
      );
    } catch {}
  }

  /**
   * AI ROUTING — decides which AI to call based on plan.
   *
   * Strategy:
   *   1. Always check stored data first (handled in server.js easyResponse / DB)
   *   2. Explorer  → Groq only
   *   3. Navigator → Groq first, GPT if Groq fails or query is 'hard'
   *   4. Voyager   → Groq first, GPT fallback, Claude for complex/premium queries
   *
   * Falls back gracefully if API keys are missing.
   */
  async function callAIForPlan(prompt, systemMsg, plan, tier = "medium", maxTokens = 500) {
    const GROQ_KEY      = process.env.GROQ_API_KEY;
    const OPENAI_KEY    = process.env.OPENAI_API_KEY;
    const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

    // ── Helper: call Groq ──
    const callGroq = async (tokens = 500) => {
      if (!GROQ_KEY) return null;
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: systemMsg },
              { role: "user",   content: prompt },
            ],
            max_tokens: tokens, temperature: 0.85,
          }),
        });
        const d = await res.json();
        return d.choices?.[0]?.message?.content || null;
      } catch { return null; }
    };

    // ── Helper: call GPT ──
    const callGPT = async (tokens = 600) => {
      if (!OPENAI_KEY) return null;
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemMsg },
              { role: "user",   content: prompt },
            ],
            max_tokens: tokens, temperature: 0.85,
          }),
        });
        const d = await res.json();
        return d.choices?.[0]?.message?.content || null;
      } catch { return null; }
    };

    // ── Helper: call Claude ──
    const callClaude = async (tokens = 700) => {
      if (!ANTHROPIC_KEY) return null;
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-3-5-haiku-20241022",
            max_tokens: tokens,
            system: systemMsg,
            messages: [{ role: "user", content: prompt }],
          }),
        });
        const d = await res.json();
        return d.content?.[0]?.text || null;
      } catch { return null; }
    };

    // ── ROUTING LOGIC ──────────────────────────────────────────────────────────

    if (plan === "explorer") {
      // Free: Groq only
      return await callGroq(maxTokens);
    }

    if (plan === "navigator") {
      // Pro: Groq first → GPT fallback for hard queries or if Groq fails
      if (tier === "hard" && OPENAI_KEY) {
        const gpt = await callGPT(600);
        if (gpt) return gpt;
      }
      const groq = await callGroq(maxTokens);
      if (groq) return groq;
      // Fallback to GPT if Groq failed
      return await callGPT(600);
    }

    if (plan === "voyager") {
      // Premium: Groq for easy/medium → GPT for hard → Claude for very complex
      if (tier === "hard" && ANTHROPIC_KEY) {
        const claude = await callClaude(700);
        if (claude) return claude;
      }
      if (tier === "hard" && OPENAI_KEY) {
        const gpt = await callGPT(700);
        if (gpt) return gpt;
      }
      const groq = await callGroq(maxTokens);
      if (groq) return groq;
      // Final fallbacks
      if (OPENAI_KEY) return await callGPT(600);
      if (ANTHROPIC_KEY) return await callClaude(700);
      return null;
    }

    // Default fallback
    return await callGroq(maxTokens);
  }

  // ── EXPOSE HELPERS TO OTHER MODULES ─────────────────────────────────────────
  // We attach them to app.locals so server.js and other mounted files can use them
  app.locals.getUserPlan          = getUserPlan;
  app.locals.checkTripPlanLimit   = checkTripPlanLimit;
  app.locals.incrementTripPlanCount = incrementTripPlanCount;
  app.locals.callAIForPlan        = callAIForPlan;

  // ── ROUTES ───────────────────────────────────────────────────────────────────

  const jwt = require("jsonwebtoken");

  function authOptional(req) {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return null;
    try {
      return jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    } catch { return null; }
  }

  function authRequired(req, res, next) {
    const user = authOptional(req);
    if (!user) return res.status(401).json({ message: "Token required" });
    req.user = user;
    next();
  }

  // GET /my-plan — returns current user's plan info
  app.get("/my-plan", async (req, res) => {
    const user = authOptional(req);
    if (!user) return res.json({ plan: "explorer", tripPlansUsed: 0, tripPlansLimit: 2 });
    try {
      const plan = await getUserPlan(user.id);
      const { used, limit } = await checkTripPlanLimit(user.id, plan);
      const r = await pool.query(
        "SELECT plan_expires_at, whatsapp_number FROM users WHERE id=$1",
        [user.id]
      );
      res.json({
        plan,
        tripPlansUsed:  used,
        tripPlansLimit: limit === Infinity ? null : limit,
        planExpiresAt:  r.rows[0]?.plan_expires_at || null,
        whatsappNumber: r.rows[0]?.whatsapp_number || null,
      });
    } catch (e) {
      res.json({ plan: "explorer", tripPlansUsed: 0, tripPlansLimit: 2 });
    }
  });

  // POST /feedback — save thumbs up/down + optional reason
  app.post("/feedback", async (req, res) => {
    try {
      const user = authOptional(req);
      const {
        message_id,
        user_message,
        ai_response,
        rating,       // 1 = thumbs up, -1 = thumbs down
        reason,       // optional text from user
      } = req.body;

      if (![1, -1].includes(Number(rating))) {
        return res.status(400).json({ message: "rating must be 1 or -1" });
      }

      await pool.query(
        `INSERT INTO ai_feedback
           (user_id, message_id, user_message, ai_response, rating, reason)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          user?.id || null,
          message_id || null,
          (user_message || "").slice(0, 500),
          (ai_response  || "").slice(0, 1000),
          Number(rating),
          (reason || "").slice(0, 500),
        ]
      );

      res.json({ ok: true });
    } catch (e) {
      console.error("Feedback error:", e.message);
      res.status(500).json({ message: "Error saving feedback" });
    }
  });

  // GET /admin/feedback — admin view of all feedback
  app.get("/admin/feedback", async (req, res) => {
    try {
      const r = await pool.query(`
        SELECT
          f.id, f.rating, f.reason,
          f.user_message, f.ai_response,
          f.created_at,
          u.name AS user_name, u.email AS user_email
        FROM ai_feedback f
        LEFT JOIN users u ON f.user_id = u.id
        ORDER BY f.created_at DESC
        LIMIT 300
      `);
      res.json(r.rows);
    } catch (e) {
      res.status(500).json({ message: "Error loading feedback" });
    }
  });

  // GET /admin/feedback/summary — quick stats
  app.get("/admin/feedback/summary", async (req, res) => {
    try {
      const r = await pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE rating = 1)  AS thumbs_up,
          COUNT(*) FILTER (WHERE rating = -1) AS thumbs_down,
          COUNT(*) AS total,
          ROUND(
            100.0 * COUNT(*) FILTER (WHERE rating = 1) / NULLIF(COUNT(*), 0), 1
          ) AS satisfaction_pct
        FROM ai_feedback
      `);
      res.json(r.rows[0]);
    } catch {
      res.status(500).json({ message: "Error" });
    }
  });

  // PUT /whatsapp-number — save user's WhatsApp number for check-in
  app.put("/whatsapp-number", authRequired, async (req, res) => {
    try {
      const { whatsapp_number } = req.body;
      if (!whatsapp_number) return res.status(400).json({ message: "Number required" });
      // Basic validation — must be digits, 10-15 chars
      const clean = whatsapp_number.replace(/[^\d+]/g, "");
      if (clean.length < 10 || clean.length > 16) {
        return res.status(400).json({ message: "Invalid number — must be 10–15 digits" });
      }
      await pool.query(
        "UPDATE users SET whatsapp_number=$1 WHERE id=$2",
        [clean, req.user.id]
      );
      res.json({ ok: true, message: "WhatsApp number saved!" });
    } catch {
      res.status(500).json({ message: "Error saving number" });
    }
  });

  console.log("✅ server_plans.js mounted — plan logic, feedback, AI routing");
};