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

    return `You are ALVRYN AI — a brilliant, warm, and witty travel companion for Indian travellers.
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