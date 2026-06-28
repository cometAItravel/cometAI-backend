// server_plans.js — Tier logic, AI routing, feedback, trip counter, AUTO-MIGRATION
// UPGRADED: Advanced AI system prompt for complex multi-constraint queries

module.exports = function(app, pool) {

  // ── AUTO-MIGRATION ──────────────────────────────────────────────────────────
  async function migrate() {
    try {
      await pool.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'explorer';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP;
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
          email      VARCHAR(255),
          plan       VARCHAR(30),
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log("server_plans.js: migration OK");
    } catch(e) {
      console.error("server_plans.js migration error:", e.message);
    }
  }
  migrate();

  // ── GET USER PLAN ───────────────────────────────────────────────────────────
  async function getUserPlan(userId) {
    if (!userId) return "explorer";
    try {
      const r = await pool.query(
        "SELECT plan, plan_expires_at FROM users WHERE id=$1", [userId]
      );
      if (!r.rows.length) return "explorer";
      const { plan, plan_expires_at } = r.rows[0];
      if (plan_expires_at && new Date(plan_expires_at) < new Date()) return "explorer";
      return plan || "explorer";
    } catch { return "explorer"; }
  }

  // ── CHECK TRIP PLAN LIMIT ───────────────────────────────────────────────────
  async function checkTripPlanLimit(userId) {
    if (!userId) return { allowed: true, remaining: 2 };
    try {
      const r = await pool.query(
        "SELECT plan, trip_plans_this_month, trip_plans_reset_at FROM users WHERE id=$1",
        [userId]
      );
      if (!r.rows.length) return { allowed: true, remaining: 2 };
      const { plan, trip_plans_this_month, trip_plans_reset_at } = r.rows[0];

      // Reset monthly counter if needed
      const resetAt = new Date(trip_plans_reset_at || 0);
      const now = new Date();
      if (now.getMonth() !== resetAt.getMonth() || now.getFullYear() !== resetAt.getFullYear()) {
        await pool.query(
          "UPDATE users SET trip_plans_this_month=0, trip_plans_reset_at=NOW() WHERE id=$1",
          [userId]
        );
        return { allowed: true, remaining: plan === "explorer" ? 2 : 999 };
      }

      const limit = plan === "explorer" ? 2 : 999;
      const used = trip_plans_this_month || 0;
      return { allowed: used < limit, remaining: Math.max(0, limit - used) };
    } catch { return { allowed: true, remaining: 2 }; }
  }

  // ── INCREMENT TRIP PLAN COUNTER ─────────────────────────────────────────────
  async function incrementTripPlan(userId) {
    if (!userId) return;
    try {
      await pool.query(
        "UPDATE users SET trip_plans_this_month = COALESCE(trip_plans_this_month,0) + 1 WHERE id=$1",
        [userId]
      );
    } catch {}
  }

  // ── BUILD ADVANCED SYSTEM PROMPT ────────────────────────────────────────────
  // This is the KEY fix — comprehensive system prompt that handles ALL constraints
  function buildSystemPrompt(userContext) {
    const { name, homecity, plan, preferences } = userContext || {};

    return `You are ALVI — a brilliant, warm, and witty travel companion for Indian travellers.
You work for ALVRYN (alvryn.in), an AI-powered travel platform.

═══════════════════════════════════════════════════════════
CRITICAL INSTRUCTION — READ THIS FIRST:
═══════════════════════════════════════════════════════════
When a user sends ANY message — no matter how complex — you MUST extract and address EVERY piece of information they provide. Never ignore any constraint.

If the user says: "6 friends from Bangalore to Goa in August. Budget ₹15,000 per person. Two vegetarians. One person arrives a day late. Prefer beaches over nightlife. Need airport transfers."

You MUST address ALL of these in your response:
✅ Group size: 6 friends
✅ Origin: Bangalore
✅ Destination: Goa
✅ Month: August
✅ Budget: ₹15,000 per person (₹90,000 total)
✅ Dietary: 2 vegetarians — suggest vegetarian-friendly restaurants/hotels
✅ Late arrival: 1 person arrives a day late — give separate arrival plan for them
✅ Preference: beaches over nightlife — recommend North Goa beaches, avoid party-heavy areas
✅ Transfers: airport transfers — include cab costs from airport

NEVER extract only one detail and ignore the rest. NEVER just show hotel cards when the user asked for a complete plan.

═══════════════════════════════════════════════════════════
YOUR PERSONALITY:
═══════════════════════════════════════════════════════════
- Warm, funny, witty — like a knowledgeable friend who has travelled everywhere
- Tease gently, celebrate the trip, make travel feel exciting
- Never robotic, never generic, never boring
- Speak like a smart Indian who loves travel
- Avoid jokes about money, religion, politics
- NEVER mention competitor names (MakeMyTrip, Cleartrip, Ixigo, Yatra, etc.)
- Always refer to "our partner site" for booking

${name ? `User's name: ${name}` : ""}
${homecity ? `User's home city: ${homecity}` : ""}
${preferences ? `Known preferences: ${JSON.stringify(preferences)}` : ""}
Current plan: ${plan || "explorer"} (free tier)

═══════════════════════════════════════════════════════════
HOW TO HANDLE DIFFERENT QUERY TYPES:
═══════════════════════════════════════════════════════════

1. SIMPLE QUESTIONS ("best time to visit Goa", "visa for Dubai", "baggage rules IndiGo")
   → Answer directly, concisely, helpfully. 1-3 paragraphs max.

2. DESTINATION QUESTIONS ("what to do in Manali", "is Ooty good in June")
   → Give a warm, exciting response with 3-5 specific tips. Include budget hints.

3. TRAVEL PLANNING ("plan a trip to...", "I want to go to...", "help me plan...")
   → Extract ALL details the user provides
   → Ask for missing critical info naturally (only ask what's genuinely missing)
   → Build a complete response covering transport, stay, activities, budget breakdown

4. COMPLEX GROUP QUERIES (like the 6-friends example above)
   → Address EVERY constraint explicitly
   → Give per-person AND total costs
   → Handle special cases (late arrivals, dietary needs, accessibility, etc.)
   → Structure the response clearly with sections

5. BUDGET QUERIES ("trip under ₹10,000", "cheap options", "luxury trip")
   → Always give realistic budget breakdown:
     - Transport (per person)
     - Accommodation (per night)
     - Food (per day)
     - Activities
     - Miscellaneous (10% buffer)

6. FOLLOW-UP QUESTIONS mid-trip-plan
   → Remember ALL context from previous messages in this conversation
   → Don't ask again for info already provided

═══════════════════════════════════════════════════════════
RESPONSE STRUCTURE FOR TRIP PLANS:
═══════════════════════════════════════════════════════════
For any trip planning request, structure your response as:

🗺️ **Trip Overview**
[Destination, duration, group size, total budget]

🚌/✈️ **Getting There**
[Best transport options with prices from their city]

🏨 **Where to Stay**
[Specific area recommendations, price range, why that area]

📅 **Itinerary Highlights**
[Day-wise or activity highlights, not exhaustive]

💰 **Budget Breakdown**
[Per person costs: transport + hotel + food + activities]

💡 **Alvryn Tips**
[2-3 smart insider tips for this destination]

For special cases (group, dietary, late arrival, etc.) add relevant sections.

═══════════════════════════════════════════════════════════
BOOKING LINKS:
═══════════════════════════════════════════════════════════
When user is ready to book:
- Flights: suggest searching on alvryn.in/search (select Flights tab)
- Buses: suggest alvryn.in/search (select Buses tab)
- Hotels: suggest alvryn.in/search (select Hotels tab)
- Trains: suggest alvryn.in/search (select Trains tab)
Never give direct competitor booking links.

═══════════════════════════════════════════════════════════
INDIAN TRAVEL CONTEXT YOU KNOW WELL:
═══════════════════════════════════════════════════════════
- Indian holiday seasons: Diwali, Christmas-New Year, summer holidays (Apr-Jun), 
  long weekends around national holidays
- Budget tiers for Indians: Budget (₹500-1500/night), Mid-range (₹1500-4000/night), 
  Premium (₹4000-10000/night), Luxury (₹10000+/night)
- Popular domestic: Goa, Manali, Ladakh, Coorg, Ooty, Rishikesh, Jaipur, Kerala
- Popular international: Dubai, Singapore, Bangkok, Bali, Maldives, Europe, USA
- South Indian travellers often prefer: vegetarian food options, comfortable AC transport,
  family-friendly destinations
- Visa-free/easy for Indians: Nepal, Bhutan, Maldives, Sri Lanka, Thailand (visa on arrival),
  Malaysia (eVisa), Singapore (visa required but easy)
- Train booking: IRCTC (official), Tatkal for last minute
- Bus: RedBus for most intercity routes
- Flights: IndiGo, Air India, SpiceJet, Vistara, Akasa for domestic

Remember: You represent ALVRYN. Every response should make the user feel excited about travel and confident that ALVRYN understands their needs completely.`;
  }

  // ── CALL AI WITH FULL CONTEXT ───────────────────────────────────────────────
  async function callAIForPlan(messages, userContext) {
    const Groq = require("groq-sdk");
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const systemPrompt = buildSystemPrompt(userContext);

    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        max_tokens: 2000,
        temperature: 0.75,
      });
      return completion.choices[0]?.message?.content || "";
    } catch(e) {
      console.error("Groq call error:", e.message);
      return "";
    }
  }

  // ── EXPOSE TO APP ───────────────────────────────────────────────────────────
  app.locals.getUserPlan       = getUserPlan;
  app.locals.checkTripPlanLimit = checkTripPlanLimit;
  app.locals.incrementTripPlan  = incrementTripPlan;
  app.locals.callAIForPlan      = callAIForPlan;
  app.locals.buildSystemPrompt  = buildSystemPrompt;

  // ── FEEDBACK ENDPOINT ───────────────────────────────────────────────────────
  app.post("/ai-feedback", async (req, res) => {
    try {
      const { messageId, userMessage, aiResponse, rating, reason, userId } = req.body;
      await pool.query(
        `INSERT INTO ai_feedback (user_id, message_id, user_message, ai_response, rating, reason)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [userId||null, messageId||null, userMessage||"", aiResponse||"", rating||0, reason||null]
      );
      res.json({ ok: true });
    } catch(e) {
      res.json({ ok: false, error: e.message });
    }
  });

  // ── ADMIN: GET FEEDBACK ─────────────────────────────────────────────────────
  app.get("/admin/feedback", async (req, res) => {
    try {
      const r = await pool.query(`
        SELECT af.*, u.name as user_name, u.email as user_email
        FROM ai_feedback af
        LEFT JOIN users u ON af.user_id = u.id
        ORDER BY af.created_at DESC LIMIT 100
      `);
      res.json(r.rows);
    } catch(e) { res.json([]); }
  });

  // ── ADMIN: GET FEEDBACK STATS ───────────────────────────────────────────────
  app.get("/admin/feedback/stats", async (req, res) => {
    try {
      const r = await pool.query(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN rating=1 THEN 1 ELSE 0 END) as positive,
          SUM(CASE WHEN rating=0 THEN 1 ELSE 0 END) as negative
        FROM ai_feedback
      `);
      res.json(r.rows[0]);
    } catch(e) { res.json({ total:0, positive:0, negative:0 }); }
  });

  // ── WAITLIST / NOTIFY ME ────────────────────────────────────────────────────
  app.post("/waitlist", async (req, res) => {
    try {
      const { email, plan } = req.body;
      if (!email) return res.status(400).json({ error: "Email required" });
      // Check if already exists
      const exists = await pool.query(
        "SELECT id FROM waitlist WHERE email=$1 AND plan=$2", [email, plan||"navigator"]
      );
      if (exists.rows.length) return res.json({ ok: true, already: true });
      await pool.query(
        "INSERT INTO waitlist (email, plan) VALUES ($1,$2)", [email, plan||"navigator"]
      );
      res.json({ ok: true });
    } catch(e) { res.json({ ok: false, error: e.message }); }
  });

  app.get("/admin/waitlist", async (req, res) => {
    try {
      const r = await pool.query(
        "SELECT * FROM waitlist ORDER BY created_at DESC"
      );
      res.json(r.rows);
    } catch(e) { res.json([]); }
  });

  // ── SAVE WHATSAPP NUMBER ────────────────────────────────────────────────────
  app.post("/whatsapp-number", async (req, res) => {
    try {
      const { userId, whatsappNumber } = req.body;
      if (!userId || !whatsappNumber) return res.status(400).json({ error: "Missing fields" });
      await pool.query(
        "UPDATE users SET whatsapp_number=$1 WHERE id=$2", [whatsappNumber, userId]
      );
      res.json({ ok: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

};

// Notify me — Pro/Premium waitlist
app.post("/waitlist", async (req, res) => {
  const { email, plan_type, name } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });
  try {
    const exists = await pool.query(
      "SELECT id FROM waitlist WHERE email=$1", [email]
    );
    if (exists.rows.length > 0) {
      return res.json({ message: "You are already on the waitlist!" });
    }
    await pool.query(
      "INSERT INTO waitlist (email, plan_type, name) VALUES ($1, $2, $3)",
      [email, plan_type || "pro", name || ""]
    );
    res.json({ success: true, message: "Added to waitlist!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin — view waitlist
app.get("/admin/waitlist", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, plan_type, name, created_at FROM waitlist ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }

  /**
 * ALVRYN — server_plans.js
 * Pro version plan management, usage tracking, admin controls
 * Mounted onto main Express app via: require("./server_plans.js")(app, pool)
 *
 * DB tables needed (auto-created on startup):
 *   users          — adds plan_type, plan_expiry columns if missing
 *   usage_tracking — daily message/trip count per user
 *   plan_events    — audit log of plan changes
 */

"use strict";
const jwt = require("jsonwebtoken");

const FREE_DAILY_LIMIT = 20;   // AI messages per day on free plan
const PRO_DAILY_LIMIT  = 9999; // Effectively unlimited

module.exports = function mountPlans(app, pool) {

  // ══════════════════════════════════════════════════════════════════════════
  //  DB SETUP — runs once on server start
  // ══════════════════════════════════════════════════════════════════════════
  async function setupPlansTables() {
    try {
      // Add plan columns to users if they don't exist
      await pool.query(`
        ALTER TABLE users
          ADD COLUMN IF NOT EXISTS plan_type    VARCHAR(20)  DEFAULT 'free',
          ADD COLUMN IF NOT EXISTS plan_expiry  TIMESTAMP,
          ADD COLUMN IF NOT EXISTS plan_start   TIMESTAMP,
          ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20)
      `);

      // Daily usage tracking table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS usage_tracking (
          id              SERIAL PRIMARY KEY,
          user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          date            DATE    NOT NULL DEFAULT CURRENT_DATE,
          message_count   INTEGER NOT NULL DEFAULT 0,
          trip_plan_count INTEGER NOT NULL DEFAULT 0,
          updated_at      TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, date)
        )
      `);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_usage_user_date ON usage_tracking(user_id, date)`);

      // Plan change audit log
      await pool.query(`
        CREATE TABLE IF NOT EXISTS plan_events (
          id          SERIAL PRIMARY KEY,
          user_id     INTEGER NOT NULL,
          old_plan    VARCHAR(20),
          new_plan    VARCHAR(20),
          changed_by  VARCHAR(60) DEFAULT 'system',
          note        TEXT,
          created_at  TIMESTAMP DEFAULT NOW()
        )
      `);

      console.log("✅ server_plans.js: DB tables ready");
    } catch (e) {
      console.error("server_plans DB setup:", e.message);
    }
  }
  setupPlansTables().catch(console.error);

  // ══════════════════════════════════════════════════════════════════════════
  //  HELPERS — shared via app.locals so server.js can use them
  // ══════════════════════════════════════════════════════════════════════════

  // Get user's current plan ('free' | 'pro' | 'premium')
  async function getUserPlan(userId) {
    if (!userId) return "free";
    try {
      const r = await pool.query(
        "SELECT plan_type, plan_expiry FROM users WHERE id=$1",
        [userId]
      );
      const row = r.rows[0];
      if (!row) return "free";

      const plan = row.plan_type || "free";
      // Check expiry
      if (plan !== "free" && row.plan_expiry && new Date(row.plan_expiry) < new Date()) {
        // Plan expired — silently downgrade
        await pool.query("UPDATE users SET plan_type='free', plan_expiry=NULL WHERE id=$1", [userId]);
        return "free";
      }
      return plan;
    } catch { return "free"; }
  }

  // Get today's message count for a user (IST date)
  async function getTodayCount(userId) {
    if (!userId) return 0;
    try {
      // Use IST date (UTC+5:30)
      const r = await pool.query(
        `SELECT message_count FROM usage_tracking
         WHERE user_id=$1
           AND date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date`,
        [userId]
      );
      return r.rows[0]?.message_count || 0;
    } catch { return 0; }
  }

  // Increment today's message count (returns new count)
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

  // Check if user can send a message
  async function checkUsageLimit(userId) {
    const plan  = await getUserPlan(userId);
    const limit = plan === "free" ? FREE_DAILY_LIMIT : PRO_DAILY_LIMIT;
    const used  = await getTodayCount(userId);
    return {
      plan,
      used,
      limit,
      allowed   : used < limit,
      remaining : Math.max(0, limit - used),
      isProUser : plan !== "free",
    };
  }

  // Upgrade a user's plan
  async function upgradePlan(userId, plan, daysValid, changedBy = "admin", note = "") {
    const expiry = daysValid
      ? new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000)
      : null;
    await pool.query(
      `UPDATE users SET plan_type=$1, plan_expiry=$2, plan_start=NOW() WHERE id=$3`,
      [plan, expiry, userId]
    );
    await pool.query(
      `INSERT INTO plan_events (user_id, new_plan, changed_by, note) VALUES ($1, $2, $3, $4)`,
      [userId, plan, changedBy, note]
    );
  }

  // Expose helpers to rest of the app
  app.locals.getUserPlan      = getUserPlan;
  app.locals.incrementUsage   = incrementUsage;
  app.locals.checkUsageLimit  = checkUsageLimit;
  app.locals.getTodayCount    = getTodayCount;

  // ══════════════════════════════════════════════════════════════════════════
  //  AUTH MIDDLEWARE (local — avoids circular import)
  // ══════════════════════════════════════════════════════════════════════════
  function auth(req, res, next) {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token required" });
    jwt.verify(token, process.env.JWT_SECRET || "secretkey", (err, user) => {
      if (err) return res.status(403).json({ message: "Invalid token" });
      req.user = user;
      next();
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  USER ENDPOINTS
  // ══════════════════════════════════════════════════════════════════════════

  // GET /my-plan — returns plan info + today's usage
  // Used by: AIChatPage (usage counter in top bar), UserProfile
  app.get("/my-plan", auth, async (req, res) => {
    try {
      const userId = req.user.id;
      const planRow = await pool.query(
        "SELECT plan_type, plan_expiry, plan_start, name, email, whatsapp_number FROM users WHERE id=$1",
        [userId]
      );
      const user = planRow.rows[0] || {};
      const plan = user.plan_type || "free";

      // Check expiry
      let effectivePlan = plan;
      if (plan !== "free" && user.plan_expiry && new Date(user.plan_expiry) < new Date()) {
        await pool.query("UPDATE users SET plan_type='free', plan_expiry=NULL WHERE id=$1", [userId]);
        effectivePlan = "free";
      }

      const used       = await getTodayCount(userId);
      const limit      = effectivePlan === "free" ? FREE_DAILY_LIMIT : PRO_DAILY_LIMIT;
      const remaining  = Math.max(0, limit - used);
      const resetHour  = "12:00 AM IST";

      res.json({
        plan          : effectivePlan,
        planExpiry    : user.plan_expiry,
        planStart     : user.plan_start,
        messagesUsed  : used,
        messagesLimit : limit,
        remaining,
        resetHour,
        isProUser     : effectivePlan !== "free",
        whatsappNumber: user.whatsapp_number || null,
        // Feature flags per plan
        features: {
          unlimitedMessages  : effectivePlan !== "free",
          advancedAI         : effectivePlan !== "free",
          unlimitedTripPlans : effectivePlan !== "free",
          priorityResponses  : effectivePlan !== "free",
          chatHistory        : true, // all plans
          flightSearch       : true,
          safetyInsights     : true,
          waCheckin          : true,
        },
      });
    } catch (e) {
      res.status(500).json({ message: "Error loading plan", error: e.message });
    }
  });

  // POST /usage/track — call this after each AI response
  // Returns updated usage so frontend can update counter
  app.post("/usage/track", auth, async (req, res) => {
    try {
      const newCount = await incrementUsage(req.user.id);
      const plan     = await getUserPlan(req.user.id);
      const limit    = plan === "free" ? FREE_DAILY_LIMIT : PRO_DAILY_LIMIT;
      res.json({
        ok        : true,
        used      : newCount,
        limit,
        remaining : Math.max(0, limit - newCount),
        blocked   : newCount > limit,
      });
    } catch (e) {
      res.status(500).json({ message: "Error tracking usage" });
    }
  });

  // GET /usage/today — lightweight usage check for frontend
  app.get("/usage/today", auth, async (req, res) => {
    try {
      const result = await checkUsageLimit(req.user.id);
      res.json(result);
    } catch {
      res.json({ plan:"free", used:0, limit:FREE_DAILY_LIMIT, allowed:true, remaining:FREE_DAILY_LIMIT });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  ADMIN ENDPOINTS
  // ══════════════════════════════════════════════════════════════════════════

  // POST /admin/upgrade — manually upgrade any user (for testing)
  // Body: { email, plan, days }
  // Example: { email: "test@gmail.com", plan: "pro", days: 30 }
  app.post("/admin/upgrade", async (req, res) => {
    try {
      const { email, userId, plan, days, note, adminKey } = req.body;

      // Simple admin key check (add ADMIN_KEY to your .env)
      if (adminKey !== (process.env.ADMIN_KEY || "alvryn_admin_2024")) {
        return res.status(403).json({ message: "Invalid admin key" });
      }

      // Find user by email or id
      let uid = userId;
      if (!uid && email) {
        const r = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
        if (!r.rows.length) return res.status(404).json({ message: "User not found" });
        uid = r.rows[0].id;
      }
      if (!uid) return res.status(400).json({ message: "Provide email or userId" });

      const planType = plan || "pro";
      const daysValid = parseInt(days) || 30;

      await upgradePlan(uid, planType, daysValid, "admin", note || `Manual upgrade via admin API`);

      const expiry = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000);
      res.json({
        ok      : true,
        message : `User ${uid} upgraded to ${planType}`,
        expiry  : expiry.toISOString(),
        days    : daysValid,
      });
    } catch (e) {
      res.status(500).json({ message: "Upgrade failed", error: e.message });
    }
  });

  // POST /admin/downgrade — reset user to free
  app.post("/admin/downgrade", async (req, res) => {
    try {
      const { email, userId, adminKey } = req.body;
      if (adminKey !== (process.env.ADMIN_KEY || "alvryn_admin_2024")) {
        return res.status(403).json({ message: "Invalid admin key" });
      }

      let uid = userId;
      if (!uid && email) {
        const r = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
        if (!r.rows.length) return res.status(404).json({ message: "User not found" });
        uid = r.rows[0].id;
      }

      await pool.query("UPDATE users SET plan_type='free', plan_expiry=NULL WHERE id=$1", [uid]);
      await pool.query(
        "INSERT INTO plan_events (user_id, new_plan, changed_by, note) VALUES ($1, $2, $3, $4)",
        [uid, "free", "admin", "Manual downgrade via admin API"]
      );

      res.json({ ok: true, message: `User ${uid} downgraded to free` });
    } catch (e) {
      res.status(500).json({ message: "Downgrade failed", error: e.message });
    }
  });

  // GET /admin/plans — overview of all users + their plans + today's usage
  app.get("/admin/plans", async (req, res) => {
    try {
      const r = await pool.query(`
        SELECT
          u.id, u.name, u.email,
          u.plan_type, u.plan_expiry, u.plan_start,
          COALESCE(ut.message_count, 0) AS messages_today
        FROM users u
        LEFT JOIN usage_tracking ut
          ON ut.user_id = u.id
         AND ut.date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date
        ORDER BY u.id DESC
        LIMIT 200
      `);
      res.json(r.rows);
    } catch (e) {
      res.status(500).json({ message: "Error loading plans" });
    }
  });

  // GET /admin/plan-events — audit log
  app.get("/admin/plan-events", async (req, res) => {
    try {
      const r = await pool.query(`
        SELECT pe.*, u.name, u.email
        FROM plan_events pe
        LEFT JOIN users u ON u.id = pe.user_id
        ORDER BY pe.created_at DESC
        LIMIT 100
      `);
      res.json(r.rows);
    } catch (e) {
      res.status(500).json({ message: "Error loading events" });
    }
  });

  // GET /admin/usage-stats — daily usage summary
  app.get("/admin/usage-stats", async (req, res) => {
    try {
      const r = await pool.query(`
        SELECT
          ut.date,
          COUNT(DISTINCT ut.user_id)      AS active_users,
          SUM(ut.message_count)           AS total_messages,
          AVG(ut.message_count)::numeric(6,1) AS avg_per_user,
          MAX(ut.message_count)           AS max_by_single_user
        FROM usage_tracking ut
        WHERE ut.date >= (NOW() AT TIME ZONE 'Asia/Kolkata')::date - 30
        GROUP BY ut.date
        ORDER BY ut.date DESC
      `);
      res.json(r.rows);
    } catch (e) {
      res.status(500).json({ message: "Error loading usage stats" });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  PAYMENT PLACEHOLDER — will be filled when Razorpay is ready
  // ══════════════════════════════════════════════════════════════════════════

  // POST /payment/create-order — Razorpay order creation (placeholder)
  app.post("/payment/create-order", auth, async (req, res) => {
    // TODO: Implement when Razorpay is set up
    // const Razorpay = require("razorpay");
    // const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY, key_secret: process.env.RAZORPAY_SECRET });
    // const order = await razorpay.orders.create({ amount: amount * 100, currency: "INR", receipt: `receipt_${userId}` });
    res.json({
      message: "Payment coming soon",
      plans: [
        { id: "navigator", name: "Alvryn Navigator", price: 29900, period: "month" },
        { id: "voyager",   name: "Alvryn Voyager",   price: 59900, period: "month" },
      ],
    });
  });

  // POST /payment/webhook — Razorpay payment webhook (placeholder)
  app.post("/payment/webhook", async (req, res) => {
    // TODO: Implement when Razorpay is set up
    // 1. Verify webhook signature
    // 2. Extract payment data
    // 3. Call upgradePlan(userId, plan, days)
    // 4. Send confirmation email via Resend
    res.json({ received: true });
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  WHATSAPP NUMBER SAVE
  // ══════════════════════════════════════════════════════════════════════════
  app.put("/whatsapp-number", auth, async (req, res) => {
    try {
      const { whatsapp_number } = req.body;
      const clean = (whatsapp_number || "").replace(/[^\d+]/g, "");
      if (clean.length < 10) return res.status(400).json({ message: "Invalid number" });
      await pool.query("UPDATE users SET whatsapp_number=$1 WHERE id=$2", [clean, req.user.id]);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ message: "Error saving number" });
    }
  });

  console.log("✅ server_plans.js mounted — Plan management, Usage tracking, Admin controls");
};
});