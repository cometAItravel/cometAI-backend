/**
 * ALVRYN — server_safety.js
 * Handles:
 *  - AI Safety Insights (proactive safety for any destination — all tiers)
 *  - Safe Route Suggestions (pro + premium)
 *  - Scam Awareness (premium only)
 *  - Women Traveler Mode (premium only)
 *  - Safety data stored in DB for fast lookup (no API call for known cities)
 */

"use strict";

module.exports = function mountSafety(app, pool) {

  // ── AUTO MIGRATION ──────────────────────────────────────────────────────────
  async function runSafetyMigrations() {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS safety_data (
          id           SERIAL PRIMARY KEY,
          city         VARCHAR(100) NOT NULL UNIQUE,
          country      VARCHAR(100),
          safety_level VARCHAR(20)  DEFAULT 'moderate',
          safety_tips  TEXT,
          scam_alerts  TEXT,
          women_tips   TEXT,
          safe_areas   TEXT,
          avoid_areas  TEXT,
          emergency_numbers TEXT,
          updated_at   TIMESTAMP DEFAULT NOW()
        )
      `);

      // Seed known cities with safety data
      await seedSafetyData();

      console.log("✅ server_safety.js migrations complete");
    } catch (e) {
      console.error("❌ server_safety.js migration error:", e.message);
    }
  }

  // ── STORED SAFETY DATA ──────────────────────────────────────────────────────
  // This is our "stored database" — no API call needed for these cities.
  // AI only called for unknown destinations.
  const SAFETY_DB = [
    {
      city: "goa", country: "India", safety_level: "moderate",
      safety_tips: "Generally safe for tourists. Be cautious on beaches at night. Keep valuables safe at crowded places like Baga and Calangute. Avoid isolated beach areas after dark.",
      scam_alerts: "Fake taxi overcharging is common — always confirm price before getting in. Beach vendors may overcharge tourists. Fake tour operators exist near popular beaches.",
      women_tips: "Most areas are safe during the day. Avoid isolated beaches at night. Anjuna and Palolem are generally safer areas. Travel in groups after dark. Dress modestly in local markets.",
      safe_areas: "Palolem, Agonda, Candolim, Panjim city center",
      avoid_areas: "Isolated beach areas at night, unlicensed bars",
      emergency_numbers: "Police: 100 | Ambulance: 108 | Tourist Helpline: 1800-209-0019",
    },
    {
      city: "delhi", country: "India", safety_level: "moderate",
      safety_tips: "Use Ola/Uber instead of street taxis. Keep bags close in crowded areas like Chandni Chowk. Metro is safe and recommended. Avoid unknown shortcuts at night.",
      scam_alerts: "Auto rickshaws may claim the meter is broken — insist on meter or use Ola/Uber. Fake tour guides near Connaught Place. 'Closed today' scam near tourist spots — shop owners claim site is closed then redirect you to their store.",
      women_tips: "Avoid travelling alone late at night. Delhi Metro women's coach is available and recommended. Stick to well-lit areas in the evening. South Delhi areas like Hauz Khas are generally safer.",
      safe_areas: "South Delhi, Connaught Place, Hauz Khas, Saket",
      avoid_areas: "Isolated areas at night, overcrowded markets alone",
      emergency_numbers: "Police: 100 | Women Helpline: 1091 | Ambulance: 102 | Tourist Police: 1800-111-363",
    },
    {
      city: "mumbai", country: "India", safety_level: "safe",
      safety_tips: "One of India's safest big cities. Local trains are efficient but crowded during peak hours. Keep belongings safe in crowded areas. Gateway of India area can get very crowded.",
      scam_alerts: "Overcharging by taxis near airport — use Ola/Uber. Fake charity collectors near tourist spots. Watch out for pickpockets in crowded local trains.",
      women_tips: "Mumbai is considered one of the safer Indian cities for women. Ladies compartment available in local trains. Most areas are safe at night compared to other cities.",
      safe_areas: "Bandra, Juhu, Colaba, Powai, Andheri West",
      avoid_areas: "Isolated areas near docks at night",
      emergency_numbers: "Police: 100 | Women Helpline: 103 | Ambulance: 108",
    },
    {
      city: "bangalore", country: "India", safety_level: "safe",
      safety_tips: "Generally very safe city. Use Ola/Uber for travel. Namma Metro is safe and reliable. Traffic can be very heavy — plan extra time.",
      scam_alerts: "Auto drivers may refuse to use meters — insist or use Ola/Uber. Fake software job offers targeting visitors are rare but exist.",
      women_tips: "Bangalore is considered safe for women. Koramangala, Indiranagar, HSR Layout are safe areas. Late night travel via Ola/Uber is generally fine.",
      safe_areas: "Koramangala, Indiranagar, HSR Layout, Whitefield, MG Road",
      avoid_areas: "Isolated areas near old city at night",
      emergency_numbers: "Police: 100 | Women Helpline: 1091 | Ambulance: 108 | Namma Metro: 080-22969300",
    },
    {
      city: "dubai", country: "UAE", safety_level: "very_safe",
      safety_tips: "Dubai is one of the world's safest cities. Very low crime rate. Dress modestly in public places, malls and non-beach areas. Public displays of affection can result in fines. Alcohol is only permitted in licensed venues.",
      scam_alerts: "Be cautious of unofficial money changers. Some taxi drivers may take longer routes — use the Dubai Metro or ride apps like Careem. Fake designer goods sellers in some markets.",
      women_tips: "Dubai is very safe for women travellers. Dress modestly outside beach and hotel areas. Metro has women-only carriages. Generally very welcoming city.",
      safe_areas: "Downtown Dubai, Dubai Marina, JBR, DIFC, Palm Jumeirah",
      avoid_areas: "No specific unsafe areas — standard tourist caution applies",
      emergency_numbers: "Police: 999 | Ambulance: 998 | Tourist Police: 800-4438",
    },
    {
      city: "singapore", country: "Singapore", safety_level: "very_safe",
      safety_tips: "One of the world's safest countries. Extremely low crime rate. Very clean and well-organised. Jaywalking can result in fines. Chewing gum is restricted.",
      scam_alerts: "Very rare scams. Occasional overpriced tourist shops in Chinatown. Always check prices before buying in tourist areas.",
      women_tips: "Singapore is extremely safe for solo women travellers. Public transport is safe at all hours. MRT runs till midnight.",
      safe_areas: "Entire island is considered very safe",
      avoid_areas: "No specific areas to avoid",
      emergency_numbers: "Police: 999 | Ambulance/Fire: 995 | Non-emergency: 1800-255-0000",
    },
    {
      city: "bangkok", country: "Thailand", safety_level: "moderate",
      safety_tips: "Generally safe for tourists. Be aware of your surroundings in crowded areas. Tuk-tuk scams are common near temples. Stay hydrated — heat can be intense.",
      scam_alerts: "Tuk-tuk drivers near tourist sites often take you to gem stores or tailors for commission — say no firmly. 'Temple is closed today' scam is very common near Grand Palace. Taxi drivers may refuse to use meter — always insist on meter or use Grab app.",
      women_tips: "Bangkok is relatively safe for women. Avoid accepting drinks from strangers in nightlife areas. Dress modestly when visiting temples. Travel with others at night in entertainment districts.",
      safe_areas: "Sukhumvit, Silom, Siam, Riverside areas",
      avoid_areas: "Certain nightlife areas late at night, isolated alleys",
      emergency_numbers: "Tourist Police: 1155 | Police: 191 | Ambulance: 1669",
    },
    {
      city: "london", country: "UK", safety_level: "safe",
      safety_tips: "Generally very safe city. Use Oyster card for public transport. Be aware of pickpockets on the Tube especially on tourist lines. Keep valuables inside your bag.",
      scam_alerts: "Pickpockets on busy Tube lines like Central and Jubilee. Fake charity collectors on Oxford Street. Overpriced restaurants near major tourist sites — check menus before sitting.",
      women_tips: "London is safe for solo women travellers. Night Tube runs on weekends. Stick to well-lit areas at night. Black cabs (black taxis) are licensed and safe.",
      safe_areas: "Most central London areas — Covent Garden, South Bank, Kensington, Notting Hill",
      avoid_areas: "Some areas late at night — use standard big-city caution",
      emergency_numbers: "Emergency: 999 | Non-emergency Police: 101 | NHS Medical: 111",
    },
    {
      city: "new york", country: "USA", safety_level: "moderate",
      safety_tips: "Stay alert in crowded areas. Subway is generally safe but be aware at night on quieter lines. Keep valuables out of sight. Times Square is tourist-heavy — be extra careful with belongings.",
      scam_alerts: "CD sellers in Times Square can be aggressive. Fake charity collections. Taxi drivers not using meters — always insist on meter or use Uber/Lyft. Shell game street scams.",
      women_tips: "New York is relatively safe for women. Avoid empty subway cars late at night. Stay in well-populated areas. Roosevelt Island, Upper West Side, Brooklyn Heights are quieter safer areas.",
      safe_areas: "Midtown Manhattan, Upper West Side, Brooklyn Heights, Williamsburg",
      avoid_areas: "Certain areas of the Bronx and Brooklyn late at night — research specific neighbourhoods",
      emergency_numbers: "Emergency: 911 | Non-emergency Police: 311",
    },
    {
      city: "bali", country: "Indonesia", safety_level: "moderate",
      safety_tips: "Generally safe tourist destination. Be careful on scooters — many accidents involving tourists. Use sunscreen and stay hydrated. Beware of strong ocean currents at beaches.",
      scam_alerts: "Money changers giving wrong exchange rates — use ATMs or official exchange counters. Taxi drivers near Kuta overcharging — use Grab or Gojek app. Fake merchandise near temples.",
      women_tips: "Bali is generally safe for solo women. Dress modestly when entering temples — sarong required. Ubud is quieter and very safe. Avoid Kuta nightlife areas alone late at night.",
      safe_areas: "Ubud, Seminyak, Canggu, Sanur",
      avoid_areas: "Kuta late at night, isolated areas",
      emergency_numbers: "Police: 110 | Ambulance: 118 | Tourist Police Bali: +62-361-754-599",
    },
    {
      city: "paris", country: "France", safety_level: "moderate",
      safety_tips: "Beautiful city but watch out for pickpockets especially near Eiffel Tower and Louvre. Use Metro for transport. Keep bags in front of you in crowds.",
      scam_alerts: "Friendship bracelet scam near Sacré-Cœur — people tie bracelets on your wrist then demand money. Petition signing scam that ends with demand for money. Pickpockets in groups near tourist sites.",
      women_tips: "Paris is generally safe for women. Avoid certain suburbs late at night. Central Paris areas are safe. The Metro is safe but be aware of pickpockets.",
      safe_areas: "Le Marais, Saint-Germain, Montmartre (day), Champs-Élysées area",
      avoid_areas: "Some northern suburbs late at night, around Gare du Nord late at night",
      emergency_numbers: "Emergency: 112 | Police: 17 | Ambulance: 15 | Fire: 18",
    },
    {
      city: "tokyo", country: "Japan", safety_level: "very_safe",
      safety_tips: "One of the safest major cities in the world. Extremely low crime rate. Very respectful culture. Keep noise levels low on public transport. Carry cash — many places are still cash only.",
      scam_alerts: "Very rare. Some overpriced bars in Roppongi nightlife area targeting tourists. Always check prices before ordering in unfamiliar bars.",
      women_tips: "Tokyo is one of the safest cities for women in the world. Women-only train carriages available during rush hours. Solo travel is very comfortable.",
      safe_areas: "All of Tokyo is considered very safe",
      avoid_areas: "Kabukicho area of Shinjuku late at night (nightlife district — standard caution)",
      emergency_numbers: "Police: 110 | Fire/Ambulance: 119 | Tourist Helpline: 050-3816-2787",
    },
    {
      city: "maldives", country: "Maldives", safety_level: "very_safe",
      safety_tips: "Resort islands are extremely safe. Be aware of strong ocean currents when swimming. Stay hydrated. Follow resort guidelines for water activities.",
      scam_alerts: "Very rare scams. Local island visits — agree on prices for taxis and activities beforehand.",
      women_tips: "Resort islands are very safe for women. On local islands dress modestly out of respect for local culture. Bikinis are only for resort beaches.",
      safe_areas: "All resort islands are safe",
      avoid_areas: "No specific areas to avoid on resort islands",
      emergency_numbers: "Emergency: 119 | Police: 119 | Ambulance: 102",
    },
    {
      city: "kathmandu", country: "Nepal", safety_level: "moderate",
      safety_tips: "Generally safe for tourists. Road conditions can be poor. Altitude sickness is a real concern for trekkers — acclimatise properly. Carry cash as ATMs can be unreliable.",
      scam_alerts: "Fake trekking guides near Thamel area. Taxi drivers near Tribhuvan Airport overcharging — pre-book or negotiate before getting in. Fake monk donation scams.",
      women_tips: "Kathmandu is relatively safe for women. Thamel tourist area is generally safe. Dress modestly outside tourist areas. Travel with trusted guides for trekking.",
      safe_areas: "Thamel, Patan, Bhaktapur",
      avoid_areas: "Isolated areas at night, unfamiliar trekking routes without a guide",
      emergency_numbers: "Police: 100 | Tourist Police: 01-4247041 | Ambulance: 102",
    },
    {
      city: "colombo", country: "Sri Lanka", safety_level: "safe",
      safety_tips: "Generally safe city. Traffic can be chaotic — use trusted transport. Keep valuables safe in crowded areas. Tuk-tuks are common and fun but negotiate price beforehand.",
      scam_alerts: "Tuk-tuk drivers may take you to shops for commission — be firm about your destination. Some gem sellers target tourists.",
      women_tips: "Colombo is relatively safe for women. Dress modestly especially near temples. Avoid isolated areas at night.",
      safe_areas: "Colombo 3 (Colpetty), Colombo 7, Bambalapitiya",
      avoid_areas: "Some areas near the port late at night",
      emergency_numbers: "Police: 119 | Ambulance: 110 | Tourist Police: 011-2421052",
    },
  ];

  async function seedSafetyData() {
    for (const data of SAFETY_DB) {
      try {
        await pool.query(`
          INSERT INTO safety_data
            (city, country, safety_level, safety_tips, scam_alerts, women_tips,
             safe_areas, avoid_areas, emergency_numbers)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
          ON CONFLICT (city) DO UPDATE SET
            safety_level = EXCLUDED.safety_level,
            safety_tips  = EXCLUDED.safety_tips,
            scam_alerts  = EXCLUDED.scam_alerts,
            women_tips   = EXCLUDED.women_tips,
            safe_areas   = EXCLUDED.safe_areas,
            avoid_areas  = EXCLUDED.avoid_areas,
            emergency_numbers = EXCLUDED.emergency_numbers,
            updated_at   = NOW()
        `, [
          data.city, data.country, data.safety_level,
          data.safety_tips, data.scam_alerts, data.women_tips,
          data.safe_areas, data.avoid_areas, data.emergency_numbers,
        ]);
      } catch {}
    }
  }

  runSafetyMigrations();

  // ── HELPERS ─────────────────────────────────────────────────────────────────

  const SAFETY_LEVEL_EMOJI = {
    very_safe: "🟢",
    safe:      "🟢",
    moderate:  "🟡",
    caution:   "🟠",
    high_risk: "🔴",
  };

  const SAFETY_LEVEL_TEXT = {
    very_safe: "Very Safe",
    safe:      "Safe",
    moderate:  "Moderate — standard tourist caution advised",
    caution:   "Exercise Caution",
    high_risk: "High Risk — take extra precautions",
  };

  /**
   * Get safety data for a city.
   * First checks stored DB, then falls back to Groq AI for unknown cities.
   */
  async function getSafetyForCity(city) {
    const cityLower = city.toLowerCase().trim();

    // Check stored data first
    try {
      const r = await pool.query(
        "SELECT * FROM safety_data WHERE LOWER(city)=$1",
        [cityLower]
      );
      if (r.rows.length) return { source: "stored", ...r.rows[0] };
    } catch {}

    // Fall back to Groq for unknown cities
    const GROQ_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_KEY) return null;

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are a travel safety expert. Return ONLY a JSON object with these exact keys:
{
  "safety_level": "very_safe|safe|moderate|caution|high_risk",
  "safety_tips": "2-3 practical safety tips for tourists",
  "scam_alerts": "Common scams tourists face in this city",
  "women_tips": "Safety tips specifically for women travellers",
  "safe_areas": "Safer areas/neighbourhoods to stay in",
  "avoid_areas": "Areas or situations to avoid",
  "emergency_numbers": "Local emergency phone numbers"
}
Respond ONLY with valid JSON. No extra text.`,
            },
            { role: "user", content: `Safety information for ${city}` },
          ],
          max_tokens: 500, temperature: 0.3,
        }),
      });
      const d = await res.json();
      const text = d.choices?.[0]?.message?.content || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      // Save to DB for next time
      try {
        await pool.query(`
          INSERT INTO safety_data
            (city, country, safety_level, safety_tips, scam_alerts,
             women_tips, safe_areas, avoid_areas, emergency_numbers)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
          ON CONFLICT (city) DO UPDATE SET
            safety_level=EXCLUDED.safety_level,
            safety_tips=EXCLUDED.safety_tips,
            scam_alerts=EXCLUDED.scam_alerts,
            women_tips=EXCLUDED.women_tips,
            safe_areas=EXCLUDED.safe_areas,
            avoid_areas=EXCLUDED.avoid_areas,
            emergency_numbers=EXCLUDED.emergency_numbers,
            updated_at=NOW()
        `, [
          cityLower, city, parsed.safety_level || "moderate",
          parsed.safety_tips || "", parsed.scam_alerts || "",
          parsed.women_tips || "", parsed.safe_areas || "",
          parsed.avoid_areas || "", parsed.emergency_numbers || "",
        ]);
      } catch {}

      return { source: "ai", city: cityLower, ...parsed };
    } catch {
      return null;
    }
  }

  /**
   * Build a safety insight message for the AI chat.
   * Called from server.js when a destination is detected in a message.
   * Returns a formatted string to append to AI responses.
   */
  async function buildSafetyInsight(city, plan = "explorer", options = {}) {
    const data = await getSafetyForCity(city);
    if (!data) return null;

    const emoji  = SAFETY_LEVEL_EMOJI[data.safety_level] || "🟡";
    const level  = SAFETY_LEVEL_TEXT[data.safety_level]  || "Moderate";
    const cityDisplay = city.charAt(0).toUpperCase() + city.slice(1);

    // Base safety insight (all tiers)
    let insight = `\n\n---\n🛡️ **Safety Insight — ${cityDisplay}**\n${emoji} **${level}**\n\n${data.safety_tips || ""}`;

    if (data.emergency_numbers) {
      insight += `\n\n📞 **Emergency Numbers:** ${data.emergency_numbers}`;
    }

    // Safe Route Suggestions — Pro + Premium only
    if ((plan === "navigator" || plan === "voyager") && data.safe_areas) {
      insight += `\n\n🗺️ **Safer areas to stay:** ${data.safe_areas}`;
      if (data.avoid_areas) {
        insight += `\n⚠️ **Areas to be cautious in:** ${data.avoid_areas}`;
      }
    }

    // Scam Awareness — Premium only
    if (plan === "voyager" && data.scam_alerts) {
      insight += `\n\n🚨 **Scam Awareness:** ${data.scam_alerts}`;
    }

    // Women Traveler Mode — Premium only (when detected)
    if (plan === "voyager" && options.womenTraveler && data.women_tips) {
      insight += `\n\n👩 **Women Traveller Tips:** ${data.women_tips}`;
    }

    return insight;
  }

  // Expose to other server files via app.locals
  app.locals.getSafetyForCity   = getSafetyForCity;
  app.locals.buildSafetyInsight = buildSafetyInsight;

  // ── ROUTES ───────────────────────────────────────────────────────────────────

  const jwt = require("jsonwebtoken");

  function authOptional(req) {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return null;
    try { return jwt.verify(token, process.env.JWT_SECRET || "secretkey"); }
    catch { return null; }
  }

  // GET /safety/:city — get safety info for a city
  app.get("/safety/:city", async (req, res) => {
    try {
      const user  = authOptional(req);
      const plan  = user ? (await app.locals.getUserPlan?.(user.id) || "explorer") : "explorer";
      const city  = req.params.city.toLowerCase().trim();
      const data  = await getSafetyForCity(city);

      if (!data) return res.status(404).json({ message: "Safety data not found for this city" });

      const emoji = SAFETY_LEVEL_EMOJI[data.safety_level] || "🟡";
      const level = SAFETY_LEVEL_TEXT[data.safety_level]  || "Moderate";

      // Base response (all tiers)
      const response = {
        city,
        safety_level:    data.safety_level,
        safety_level_text: level,
        safety_emoji:    emoji,
        safety_tips:     data.safety_tips,
        emergency_numbers: data.emergency_numbers,
        // Pro + Premium only
        safe_areas:  (plan === "navigator" || plan === "voyager") ? data.safe_areas  : null,
        avoid_areas: (plan === "navigator" || plan === "voyager") ? data.avoid_areas : null,
        // Premium only
        scam_alerts: plan === "voyager" ? data.scam_alerts : null,
        women_tips:  plan === "voyager" ? data.women_tips  : null,
        plan_note:
          plan === "explorer"
            ? "Upgrade to Navigator Pro for safe area recommendations, or Voyager Premium for scam awareness and women traveller tips."
            : null,
      };

      res.json(response);
    } catch (e) {
      res.status(500).json({ message: "Error fetching safety data" });
    }
  });

  // GET /safety-cities — list all cities with stored safety data
  app.get("/safety-cities", async (req, res) => {
    try {
      const r = await pool.query(
        "SELECT city, country, safety_level FROM safety_data ORDER BY city ASC"
      );
      res.json(r.rows);
    } catch {
      res.json([]);
    }
  });

  // POST /admin/safety — add or update safety data for a city (admin use)
  app.post("/admin/safety", async (req, res) => {
    try {
      const {
        city, country, safety_level, safety_tips,
        scam_alerts, women_tips, safe_areas, avoid_areas, emergency_numbers,
      } = req.body;

      if (!city) return res.status(400).json({ message: "city is required" });

      await pool.query(`
        INSERT INTO safety_data
          (city, country, safety_level, safety_tips, scam_alerts,
           women_tips, safe_areas, avoid_areas, emergency_numbers)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (city) DO UPDATE SET
          country=EXCLUDED.country,
          safety_level=EXCLUDED.safety_level,
          safety_tips=EXCLUDED.safety_tips,
          scam_alerts=EXCLUDED.scam_alerts,
          women_tips=EXCLUDED.women_tips,
          safe_areas=EXCLUDED.safe_areas,
          avoid_areas=EXCLUDED.avoid_areas,
          emergency_numbers=EXCLUDED.emergency_numbers,
          updated_at=NOW()
      `, [
        city.toLowerCase(), country || "", safety_level || "moderate",
        safety_tips || "", scam_alerts || "", women_tips || "",
        safe_areas || "", avoid_areas || "", emergency_numbers || "",
      ]);

      res.json({ ok: true, message: `Safety data saved for ${city}` });
    } catch (e) {
      res.status(500).json({ message: "Error saving safety data" });
    }
  });

  // GET /admin/safety — view all stored safety data
  app.get("/admin/safety", async (req, res) => {
    try {
      const r = await pool.query("SELECT * FROM safety_data ORDER BY city ASC");
      res.json(r.rows);
    } catch {
      res.status(500).json({ message: "Error" });
    }
  });

  console.log("✅ server_safety.js mounted — AI Safety Insights, Safe Routes, Scam Awareness");
};