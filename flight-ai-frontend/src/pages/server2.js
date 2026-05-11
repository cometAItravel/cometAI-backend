/**
 * ALVRYN — server2.js
 * Extra routes mounted onto the same Express app + pool from server.js
 * Covers:
 *  - WhatsApp bot (flights + buses + hotels + full session flow)
 *  - Booking confirmation email
 *  - Worldwide airport proximity via Groq
 *  - Admin routes (promo codes, waitlist, bookings, users, events)
 *  - Price alerts GET
 *  - Destination images
 *  - Trip sharing
 *  - WA session handoff to web
 */

"use strict";
const { Resend }  = require("resend");
const twilio      = require("twilio");

module.exports = function mountServer2(app, pool) {

  // ── shared helpers ────────────────────────────────────────────────────────
  const resend       = new Resend(process.env.RESEND_API_KEY);
  const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  function getISTGreeting() {
    const ist = new Date(new Date().toLocaleString("en-US", { timeZone:"Asia/Kolkata" }));
    const h   = ist.getHours();
    if (h >= 5  && h < 12) return "Good morning";
    if (h >= 12 && h < 17) return "Good afternoon";
    if (h >= 17 && h < 21) return "Good evening";
    return "Hey, night owl";
  }

  async function callGroq(prompt, systemMsg, maxTokens = 300) {
    const key = process.env.GROQ_API_KEY;
    if (!key) return null;
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method : "POST",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${key}` },
        body   : JSON.stringify({
          model    : "llama-3.3-70b-versatile",
          messages : [{ role:"system", content:systemMsg }, { role:"user", content:prompt }],
          max_tokens: maxTokens, temperature: 0.7,
        }),
      });
      const d = await res.json();
      return d.choices?.[0]?.message?.content || null;
    } catch { return null; }
  }

  async function logEvent(eventType, details = "", source = "web", userId = null) {
    try {
      await pool.query(
        "INSERT INTO events (event_type,details,source,user_id) VALUES ($1,$2,$3,$4)",
        [eventType, String(details).slice(0, 500), source, userId]
      );
    } catch {}
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  WORLDWIDE AIRPORT PROXIMITY  (Groq-powered, covers any city on Earth)
  // ══════════════════════════════════════════════════════════════════════════

  // Cache so we don't call Groq for the same city twice
  const airportCache = new Map();

  /**
   * getAirportForLocation("Keljo, Finland")
   * Returns: { airport, iataCode, city, distance, transport, time }
   */
  async function getAirportForLocation(location) {
    const key = location.toLowerCase().trim();
    if (airportCache.has(key)) return airportCache.get(key);

    const systemMsg = `You are a world travel expert. 
Given a location (city, town, area or neighbourhood), return ONLY a JSON object with these exact keys:
{
  "airport": "Full airport name",
  "iataCode": "XXX",
  "city": "Nearest major city",
  "distance": "~XX km",
  "transport": "How to get from the location to the airport (2-3 transport options with approximate cost in local currency and time)",
  "time": "Total journey time from location to airport"
}
Rules:
- Always find the NEAREST practical airport even for very small towns
- For remote areas, mention if transfer is needed (e.g. bus to nearest city, then fly)
- transport should be friendly and practical
- Respond ONLY with valid JSON, no extra text`;

    const result = await callGroq(
      `What is the nearest airport to: ${location}`,
      systemMsg,
      350
    );

    let parsed = null;
    if (result) {
      try {
        const clean = result.replace(/```json|```/g, "").trim();
        parsed = JSON.parse(clean);
      } catch {
        // Groq returned non-JSON — build a fallback
        parsed = null;
      }
    }

    if (!parsed) {
      // Safe fallback — tell user to check manually
      parsed = {
        airport  : "Nearest International Airport",
        iataCode : "—",
        city     : location,
        distance : "Check Google Maps",
        transport: "🔍 Search Google Maps for 'nearest airport to " + location + "' for exact transport options.",
        time     : "Varies",
      };
    }

    airportCache.set(key, parsed);
    return parsed;
  }

  // Public endpoint — used by frontend trip planner
  app.get("/airport-for-location", async (req, res) => {
    try {
      const { location } = req.query;
      if (!location) return res.status(400).json({ message:"location required" });
      const info = await getAirportForLocation(location);
      res.json(info);
    } catch (e) {
      res.status(500).json({ message:"Error finding airport" });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  BOOKING CONFIRMATION EMAIL
  // ══════════════════════════════════════════════════════════════════════════
  async function sendBookingEmail(toEmail, d) {
    const dep = d.departureTime
      ? new Date(d.departureTime).toLocaleString("en-IN", {
          day:"numeric", month:"short", year:"numeric",
          hour:"2-digit", minute:"2-digit", hour12:false,
        })
      : "—";
    const arr = d.arrivalTime
      ? new Date(d.arrivalTime).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", hour12:false })
      : "—";
    const seatStr = d.seats?.length ? d.seats.join(", ") : "Auto-assigned";

    await resend.emails.send({
      from   : "Alvryn Travel <onboarding@resend.dev>",
      to     : toEmail,
      subject: `✈️ Booking Confirmed — ${d.bookingId} | Alvryn`,
      html   : `
<div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;background:#faf8f4;border-radius:16px;overflow:hidden;border:1px solid rgba(201,168,76,0.2);">
  <div style="background:linear-gradient(135deg,#c9a84c,#f0d080,#c9a84c);padding:28px 24px;text-align:center;">
    <h1 style="margin:0;font-size:22px;color:#1a1410;font-weight:900;letter-spacing:0.1em;">ALVRYN</h1>
    <p style="margin:4px 0 0;color:rgba(26,20,16,0.7);font-size:10px;letter-spacing:0.3em;">TRAVEL BEYOND BOUNDARIES</p>
  </div>
  <div style="background:rgba(201,168,76,0.1);padding:12px 24px;text-align:center;">
    <p style="margin:0;color:#8B6914;font-size:16px;font-weight:700;">✅ Booking Confirmed!</p>
  </div>
  <div style="padding:24px;text-align:center;">
    <p style="margin:0;font-size:10px;color:#aaa;letter-spacing:0.15em;">BOOKING ID</p>
    <p style="margin:8px 0 0;font-size:24px;font-weight:900;color:#8B6914;letter-spacing:4px;">${d.bookingId}</p>
  </div>
  <div style="padding:0 24px 24px;">
    <table style="width:100%;border-collapse:collapse;">
      ${[
        ["PASSENGER",   d.passengerName],
        ["FLIGHT",      `${d.airline} ${d.flightNo||""}`],
        ["ROUTE",       `${d.fromCity} → ${d.toCity}`],
        ["DEPARTURE",   dep],
        ["ARRIVAL",     arr],
        ["SEATS",       seatStr],
        ["CLASS",       d.cabinClass],
        ...(d.discountApplied > 0 ? [["DISCOUNT", `−₹${d.discountApplied.toLocaleString()}`]] : []),
        ["AMOUNT PAID", `₹${d.price?.toLocaleString()}`],
      ].map(([k,v]) => `
        <tr>
          <td style="padding:9px 0;color:#888;font-size:11px;border-bottom:1px solid rgba(201,168,76,0.1);">${k}</td>
          <td style="padding:9px 0;color:#1a1410;font-weight:600;text-align:right;border-bottom:1px solid rgba(201,168,76,0.1);">${v}</td>
        </tr>`).join("")}
    </table>
  </div>
  <div style="padding:18px 24px;background:rgba(201,168,76,0.05);text-align:center;">
    <p style="margin:0;color:#aaa;font-size:12px;">Thank you for booking with Alvryn ✈️ · <a href="https://alvryn.in" style="color:#c9a84c;">alvryn.in</a></p>
    <p style="margin:6px 0 0;color:#bbb;font-size:11px;">Alvryn may earn a commission from partner links at no extra cost to you.</p>
  </div>
</div>`,
    });
  }

  // Hook into /book to send email after booking
  app.post("/book-email", async (req, res) => {
    try {
      const { toEmail, bookingData } = req.body;
      if (!toEmail || !bookingData) return res.status(400).json({ message:"Missing data" });
      await sendBookingEmail(toEmail, bookingData);
      res.json({ ok:true });
    } catch (e) {
      res.status(500).json({ message:"Email failed", error:e.message });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  WHATSAPP BOT — full session flow
  // ══════════════════════════════════════════════════════════════════════════
  const waSessions = {};          // phone → session state
  const waWebSessions = new Map(); // phone → { messages[], sessionId }

  function storeWAMsg(phone, role, content) {
    const ex = waWebSessions.get(phone) || {
      messages  : [],
      sessionId : Math.random().toString(36).slice(2,8),
    };
    ex.messages.push({ role, content, time:Date.now() });
    if (ex.messages.length > 50) ex.messages = ex.messages.slice(-50);
    waWebSessions.set(phone, ex);
    return ex.sessionId;
  }

  app.get("/wa-session/:phone", (req, res) => {
    const phone = req.params.phone.replace(/[^0-9]/g, "");
    const session = waWebSessions.get(phone);
    if (!session) return res.status(404).json({ message:"No session" });
    res.json({ messages:session.messages, sessionId:session.sessionId });
  });

  app.get("/wa/:shortId", (req, res) => {
    const { shortId } = req.params;
    let foundPhone = null;
    for (const [phone, session] of waWebSessions) {
      if (session.sessionId?.slice(-8) === shortId) { foundPhone = phone; break; }
    }
    if (!foundPhone) return res.redirect("https://alvryn.in/ai");
    res.redirect(`https://alvryn.in/ai?wa_session=${foundPhone}`);
  });

  // Bus routes for WhatsApp
  const WA_BUS_ROUTES = [
    {from:"bangalore",to:"chennai",    dep:"06:00",arr:"11:30",price:650, type:"AC Sleeper",   op:"VRL Travels"},
    {from:"bangalore",to:"chennai",    dep:"21:00",arr:"02:30",price:550, type:"Semi-Sleeper", op:"KSRTC"},
    {from:"bangalore",to:"hyderabad",  dep:"20:00",arr:"04:00",price:800, type:"AC Sleeper",   op:"SRS Travels"},
    {from:"bangalore",to:"goa",        dep:"21:30",arr:"06:30",price:900, type:"AC Sleeper",   op:"Neeta Tours"},
    {from:"bangalore",to:"mumbai",     dep:"17:00",arr:"09:00",price:1400,type:"AC Sleeper",   op:"VRL Travels"},
    {from:"bangalore",to:"pune",       dep:"18:00",arr:"08:00",price:1200,type:"AC Sleeper",   op:"Paulo Travels"},
    {from:"bangalore",to:"coimbatore", dep:"07:00",arr:"11:00",price:400, type:"AC Seater",    op:"KSRTC"},
    {from:"bangalore",to:"mangalore",  dep:"22:00",arr:"05:00",price:700, type:"AC Sleeper",   op:"VRL Travels"},
    {from:"bangalore",to:"mysore",     dep:"07:00",arr:"10:00",price:250, type:"AC Seater",    op:"KSRTC"},
    {from:"bangalore",to:"kochi",      dep:"21:00",arr:"07:00",price:950, type:"AC Sleeper",   op:"KSRTC"},
    {from:"bangalore",to:"trivandrum", dep:"20:30",arr:"07:30",price:1100,type:"AC Sleeper",   op:"KSRTC"},
    {from:"bangalore",to:"madurai",    dep:"21:00",arr:"05:00",price:750, type:"AC Sleeper",   op:"Parveen Travels"},
    {from:"chennai",  to:"hyderabad",  dep:"21:00",arr:"04:00",price:750, type:"AC Sleeper",   op:"TSRTC"},
    {from:"chennai",  to:"bangalore",  dep:"07:00",arr:"12:30",price:630, type:"AC Sleeper",   op:"VRL Travels"},
    {from:"hyderabad",to:"bangalore",  dep:"21:00",arr:"05:00",price:800, type:"AC Sleeper",   op:"Orange Travels"},
    {from:"hyderabad",to:"mumbai",     dep:"18:00",arr:"06:00",price:1100,type:"AC Sleeper",   op:"VRL Travels"},
    {from:"mumbai",   to:"pune",       dep:"07:00",arr:"10:00",price:300, type:"AC Seater",    op:"MSRTC"},
    {from:"mumbai",   to:"goa",        dep:"22:00",arr:"08:00",price:950, type:"AC Sleeper",   op:"Paulo Travels"},
    {from:"delhi",    to:"jaipur",     dep:"06:00",arr:"11:00",price:500, type:"AC Seater",    op:"RSRTC"},
    {from:"delhi",    to:"agra",       dep:"07:00",arr:"11:00",price:400, type:"AC Seater",    op:"UP Roadways"},
    {from:"delhi",    to:"chandigarh", dep:"08:00",arr:"12:00",price:450, type:"AC Seater",    op:"HRTC"},
    {from:"delhi",    to:"lucknow",    dep:"22:00",arr:"05:00",price:700, type:"AC Sleeper",   op:"UP SRTC"},
    {from:"kolkata",  to:"bhubaneswar",dep:"21:00",arr:"03:00",price:600, type:"AC Sleeper",   op:"OSRTC"},
  ];

  // Simple city extraction for WhatsApp
  const WA_CITY_MAP = {
    "bangalore":"bangalore","bengaluru":"bangalore","blr":"bangalore","banglore":"bangalore",
    "mumbai":"mumbai","bombay":"mumbai","bom":"mumbai","mum":"mumbai",
    "delhi":"delhi","new delhi":"delhi","del":"delhi","dilli":"delhi",
    "chennai":"chennai","madras":"chennai","maa":"chennai",
    "hyderabad":"hyderabad","hyd":"hyderabad","secunderabad":"hyderabad",
    "kolkata":"kolkata","calcutta":"kolkata","ccu":"kolkata",
    "goa":"goa","goi":"goa","panaji":"goa",
    "pune":"pune","pnq":"pune","poona":"pune",
    "kochi":"kochi","cochin":"kochi","ernakulam":"kochi",
    "jaipur":"jaipur","jai":"jaipur","lucknow":"lucknow","lko":"lucknow",
    "agra":"agra","varanasi":"varanasi","banaras":"varanasi","kashi":"varanasi",
    "chandigarh":"chandigarh","amritsar":"amritsar","ahmedabad":"ahmedabad",
    "bhubaneswar":"bhubaneswar","mysore":"mysore","mysuru":"mysore",
    "coimbatore":"coimbatore","cbe":"coimbatore","kovai":"coimbatore",
    "madurai":"madurai","mdu":"madurai","mangalore":"mangalore","mangaluru":"mangalore",
    "trivandrum":"trivandrum","thiruvananthapuram":"trivandrum","trv":"trivandrum",
    "visakhapatnam":"visakhapatnam","vizag":"visakhapatnam",
    "dubai":"dubai","dxb":"dubai","singapore":"singapore","sin":"singapore",
    "bangkok":"bangkok","bkk":"bangkok","london":"london","lhr":"london",
    "new york":"new york","jfk":"new york","nyc":"new york",
    "kuala lumpur":"kuala lumpur","kl":"kuala lumpur","colombo":"colombo",
    "paris":"paris","tokyo":"tokyo","sydney":"sydney","bali":"bali",
  };

  const CITY_TO_IATA_WA = {
    "bangalore":"BLR","mumbai":"BOM","delhi":"DEL","chennai":"MAA","hyderabad":"HYD",
    "kolkata":"CCU","goa":"GOI","pune":"PNQ","kochi":"COK","jaipur":"JAI",
    "lucknow":"LKO","varanasi":"VNS","chandigarh":"IXC","amritsar":"ATQ",
    "ahmedabad":"AMD","mysore":"MYQ","coimbatore":"CBE","madurai":"IXM",
    "mangalore":"IXE","trivandrum":"TRV","visakhapatnam":"VTZ",
    "dubai":"DXB","singapore":"SIN","bangkok":"BKK","london":"LHR",
    "new york":"JFK","kuala lumpur":"KUL","colombo":"CMB","paris":"CDG",
    "tokyo":"NRT","sydney":"SYD","bali":"DPS",
  };
  const INDIA_WA = new Set(["BLR","BOM","DEL","MAA","HYD","CCU","GOI","PNQ","COK",
    "JAI","LKO","VNS","IXC","ATQ","AMD","MYQ","CBE","IXM","IXE","TRV","VTZ"]);

  function waBuildFlightLink(from, to, ddmm = "") {
    const fc = CITY_TO_IATA_WA[from?.toLowerCase()] || from?.slice(0,3).toUpperCase() || "BLR";
    const tc = CITY_TO_IATA_WA[to?.toLowerCase()]   || to?.slice(0,3).toUpperCase()   || "BOM";
    const base = (INDIA_WA.has(fc) && INDIA_WA.has(tc))
      ? "https://www.aviasales.in" : "https://www.aviasales.com";
    return `${base}/search/${fc}${ddmm}${tc}1?marker=714667&sub_id=alvryn_whatsapp`;
  }

  function waExtractCities(text) {
    const t = text.toLowerCase()
      .replace(/\b(flights?|buses?|bus|book|hotels?|show|find|search|cheap|from|to|going|want)\b/gi," ")
      .replace(/\s+/g," ").trim();
    const found = [];
    const multi = Object.keys(WA_CITY_MAP).filter(k=>k.includes(" ")).sort((a,b)=>b.length-a.length);
    let rem = t;
    for (const k of multi) {
      if (rem.includes(k) && found.length < 2) { found.push(WA_CITY_MAP[k]); rem = rem.replace(k," "); }
    }
    for (const w of rem.split(/[\s,\-\/→]+/)) {
      const c = w.replace(/[^a-z]/g,"");
      if (c.length >= 2 && WA_CITY_MAP[c] && found.length < 2 && !found.includes(WA_CITY_MAP[c])) {
        found.push(WA_CITY_MAP[c]);
      }
    }
    return { from:found[0]||null, to:found[1]||null };
  }

  function waExtractDate(text) {
    const t = text.toLowerCase();
    const now = new Date();
    if (/today|aaj/.test(t)) return new Date(now);
    if (/day after tomorrow|parso/.test(t)) { const d=new Date(now); d.setDate(d.getDate()+2); return d; }
    if (/tomorrow|kal|tmrw|nale/.test(t)) { const d=new Date(now); d.setDate(d.getDate()+1); return d; }
    if (/weekend/.test(t)) { const d=new Date(now); const diff=(6-now.getDay()+7)%7||7; d.setDate(now.getDate()+diff); return d; }
    const months={jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
    for (const [mon,idx] of Object.entries(months)) {
      const m=t.match(new RegExp(`(\\d{1,2})\\s*${mon}|${mon}\\s*(\\d{1,2})`));
      if (m) { const day=parseInt(m[1]||m[2]); const d=new Date(now.getFullYear(),idx,day); if(d<now)d.setFullYear(d.getFullYear()+1); return d; }
    }
    return null;
  }

  app.post("/whatsapp", async (req, res) => {
    const rawMsg = req.body.Body?.trim() || "";
    const msg    = rawMsg.toLowerCase().trim();
    const phone  = req.body.From;
    let reply    = "";

    if (!waSessions[phone]) waSessions[phone] = { step:"idle" };
    const session = waSessions[phone];

    storeWAMsg(phone, "user", rawMsg);

    try {
      // ── global reset ──────────────────────────────────────────────────────
      const resetWords = ["hi","hello","hey","start","restart","cancel","reset","stop","menu","back","help","hlo","heyyy"];
      if (resetWords.some(w => msg === w || msg.startsWith(w+" "))) {
        waSessions[phone] = { step:"idle" };
        reply = `✈️ *Alvryn AI — Your Travel Buddy!* 🌍\n\n${getISTGreeting()}! Ask me anything:\n\n*✈️ Flights:*\n_"flights bangalore to mumbai tomorrow"_\n\n*🚌 Buses:*\n_"bus bangalore to goa tonight"_\n\n*🏨 Hotels:*\n_"hotels in goa under 2000"_\n\n*🗺️ Trip plan:*\n_"plan trip to goa under 5000"_\n\nAny language — English, Hindi, Tamil, Telugu! 🇮🇳`;

      } else if (/\b(hotel|hotels|stay|room|accommodation|lodge|resort)\b/i.test(msg)) {
        // ── HOTEL ────────────────────────────────────────────────────────────
        const { from, to } = waExtractCities(msg);
        const city = to || from || msg.replace(/\b(hotel|hotels|stay|in|at|near|good|best|cheap)\b/gi,"").trim().split(/\s+/)[0];
        if (!city || city.length < 2) {
          waSessions[phone] = { step:"asking_hotel_city" };
          reply = `🏨 *Hotel Search*\n\nWhich city do you want hotels in?\n\nExample: _hotel in goa_, _hotels bangkok_`;
        } else {
          const displayCity = city.charAt(0).toUpperCase()+city.slice(1);
          reply = `🏨 *Hotels in ${displayCity}*\n\n💡 Finding the best options via our partner.\n\n👉 View hotels:\nhttps://www.booking.com/searchresults.html?ss=${encodeURIComponent(displayCity)}\n\n_Best prices on our partner site · Prices may vary_`;
        }

      } else if (session.step === "asking_hotel_city") {
        const displayCity = msg.charAt(0).toUpperCase()+msg.slice(1);
        reply = `🏨 *Hotels in ${displayCity}*\n\n👉 View:\nhttps://www.booking.com/searchresults.html?ss=${encodeURIComponent(displayCity)}\n\n_Prices may vary._`;
        waSessions[phone] = { step:"idle" };

      } else if (/\b(bus|buses|coach|volvo|sleeper|seater|ksrtc|msrtc|tsrtc|redbus)\b/i.test(msg)) {
        // ── BUS ──────────────────────────────────────────────────────────────
        const { from, to } = waExtractCities(msg);
        if (!from || !to) {
          waSessions[phone] = { step:"bus_search" };
          reply = `🚌 *Bus Search*\n\nTell me your route:\n_"bus bangalore to chennai tomorrow"_\n_"bus blr to hyd kal"_`;
        } else {
          const buses = WA_BUS_ROUTES.filter(b => b.from===from && b.to===to);
          await logEvent("bus_search", `WA: ${from} → ${to}`, "whatsapp");
          if (!buses.length) {
            reply = `🚌 *${from.toUpperCase()} → ${to.toUpperCase()}*\n\nNo buses in our list for this route.\n\n👉 Check live options:\nhttps://www.redbus.in/bus-tickets/${from.replace(/\s+/g,"-")}-to-${to.replace(/\s+/g,"-")}\n\n_Live availability on partner site_`;
          } else {
            waSessions[phone] = { step:"bus_selecting", buses, from, to };
            reply = `🚌 *Buses: ${from.toUpperCase()} → ${to.toUpperCase()}*\n\n`;
            buses.slice(0,4).forEach((b,i) => {
              reply += `*${i+1}. ${b.op}*\n⏰ ${b.dep} → ${b.arr} · ${b.type}\n💰 Approx ₹${b.price.toLocaleString()}\n\n`;
            });
            reply += `Reply *1* to *${Math.min(4,buses.length)}* to get booking link\nOr type *more* for all options on partner site`;
          }
        }

      } else if (session.step === "bus_search") {
        const { from, to } = waExtractCities(msg);
        if (!from || !to) {
          reply = `Couldn't find cities. Try: _"bus bangalore to chennai"_`;
        } else {
          const buses = WA_BUS_ROUTES.filter(b => b.from===from && b.to===to);
          if (!buses.length) {
            reply = `🚌 No buses for *${from}* to *${to}*. Check partner site:\nhttps://www.redbus.in/bus-tickets/${from.replace(/\s+/g,"-")}-to-${to.replace(/\s+/g,"-")}`;
            waSessions[phone] = { step:"idle" };
          } else {
            waSessions[phone] = { step:"bus_selecting", buses, from, to };
            reply = `🚌 *Buses: ${from.toUpperCase()} → ${to.toUpperCase()}*\n\n`;
            buses.slice(0,4).forEach((b,i) => {
              reply += `*${i+1}. ${b.op}*\n⏰ ${b.dep} → ${b.arr} · ${b.type}\n💰 Approx ₹${b.price.toLocaleString()}\n\n`;
            });
            reply += `Reply *1* to *${Math.min(4,buses.length)}* to get booking link`;
          }
        }

      } else if (session.step === "bus_selecting") {
        if (msg === "more" || msg.includes("all option")) {
          reply = `🚌 All buses on partner site:\nhttps://www.redbus.in/bus-tickets/${(session.from||"").replace(/\s+/g,"-")}-to-${(session.to||"").replace(/\s+/g,"-")}\n\n_Live seat selection available_`;
          waSessions[phone] = { step:"idle" };
        } else {
          const num = parseInt(msg.match(/^(\d+)/)?.[1]);
          if (!num || num < 1 || num > (session.buses||[]).length) {
            reply = `Please reply *1* to *${Math.min(4,(session.buses||[]).length)}*, or type *more* for all options.`;
          } else {
            const b = session.buses[num-1];
            reply = `✅ *${b.op}*\n🚌 ${(session.from||"").toUpperCase()} → ${(session.to||"").toUpperCase()}\n⏰ ${b.dep} → ${b.arr}\n💰 Approx ₹${b.price.toLocaleString()} · ${b.type}\n\n👉 Book on partner site:\nhttps://www.redbus.in/bus-tickets/${(session.from||"").replace(/\s+/g,"-")}-to-${(session.to||"").replace(/\s+/g,"-")}\n\n_Live seat availability on partner site_`;
            waSessions[phone] = { step:"idle" };
          }
        }

      } else if (/\b(flight|flights?|fly|flying|plane|airways|airlines|ticket)\b/i.test(msg) || session.step === "asking_date") {
        // ── FLIGHT ───────────────────────────────────────────────────────────
        const { from, to } = waExtractCities(msg);
        if (session.step === "asking_date" && session.from && session.to) {
          // date answer
          const date  = waExtractDate(msg);
          const from2 = session.from, to2 = session.to;
          const ddmm  = date ? (String(date.getDate()).padStart(2,"0")+String(date.getMonth()+1).padStart(2,"0")) : "";
          const link  = waBuildFlightLink(from2, to2, ddmm);
          reply = `✈️ *${from2.toUpperCase()} → ${to2.toUpperCase()}*${date?` on ${date.toLocaleDateString("en-IN",{day:"numeric",month:"short"})}`:""}\n\n💡 Checking live fares on our partner site!\n\n👉 ${link}\n\n_Prices may vary. Book early for best fares!_`;
          waSessions[phone] = { step:"idle" };
        } else if (!from || !to) {
          reply = `✈️ Tell me your route:\n_"flights bangalore to mumbai tomorrow"_\n_"flight blr to del next friday"_`;
        } else {
          const date = waExtractDate(msg);
          if (!date) {
            waSessions[phone] = { step:"asking_date", from, to };
            reply = `✈️ *${from.toUpperCase()} → ${to.toUpperCase()}*\n\nWhat date do you want to fly?\n_"tomorrow"_, _"25 june"_, _"next friday"_`;
          } else {
            const ddmm = String(date.getDate()).padStart(2,"0")+String(date.getMonth()+1).padStart(2,"0");
            const link = waBuildFlightLink(from, to, ddmm);
            await logEvent("flight_search", `WA: ${from} → ${to}`, "whatsapp");
            reply = `✈️ *${from.toUpperCase()} → ${to.toUpperCase()}*\non ${date.toLocaleDateString("en-IN",{day:"numeric",month:"short"})}\n\n💡 Checking live fares!\n\n👉 ${link}\n\n_Live prices on our partner site · Prices may vary_`;
          }
        }

      } else if (/plan|trip|travel|visit|suggest|recommend|itinerary|where.*go|vacation|holiday/i.test(msg)) {
        // ── TRIP PLAN via Groq ────────────────────────────────────────────────
        const groqReply = await callGroq(rawMsg,
          `You are Alvryn AI WhatsApp travel assistant. User wants help planning a trip.
Reply in SHORT WhatsApp format (max 400 chars). Use *bold* for headings.
Give 2-3 destination suggestions with budget range.
IST time: ${getISTGreeting()}.
NEVER mention competitor platforms.`,
          250
        );
        reply = groqReply
          ? groqReply.slice(0,600)
          : `🗺️ Tell me:\n1. Where are you traveling FROM?\n2. Your budget?\n3. How many days?\n\nI'll plan the perfect trip! ✈️`;

      } else {
        // ── DEFAULT: Groq general travel answer ──────────────────────────────
        const offTopic = /weather|cricket|ipl|news|sports|movie|song|recipe|politics|job|love/i.test(msg);
        if (offTopic) {
          reply = `🤖 I'm Alvryn AI — travel specialist! ✈️\nAsk me about flights, buses, hotels or trip planning!`;
        } else {
          const groqReply = await callGroq(rawMsg,
            `You are Alvryn AI WhatsApp travel assistant. Reply SHORT (max 280 chars).
Use *bold* for key info. Focus only on travel.
IST time: ${getISTGreeting()}. NEVER mention competitor platforms.`,
            180
          );
          reply = groqReply
            ? groqReply.slice(0,600)
            : `I can help with flights, buses, hotels and trip planning! Type *help* for menu. 😊`;
        }
      }
    } catch (e) {
      console.error("WhatsApp error:", e);
      reply = `Something went wrong. Type *hi* to start fresh. 😊`;
      waSessions[phone] = { step:"idle" };
    }

    storeWAMsg(phone, "assistant", reply);

    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(reply.slice(0,1500));
    res.type("text/xml").send(twiml.toString());
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  DESTINATION IMAGES (Unsplash free, no API key needed)
  // ══════════════════════════════════════════════════════════════════════════
  const DEST_IMAGES = {
    "goa"          :"photo-1512343879784-a960bf40e7f2",
    "mumbai"       :"photo-1529253355930-ddbe423a2ac7",
    "delhi"        :"photo-1587474260584-136574528ed5",
    "jaipur"       :"photo-1477587458883-47145ed6d1f5",
    "kerala"       :"photo-1602216056096-3b40cc0c9944",
    "bangalore"    :"photo-1596176530529-78163a4f7af2",
    "hyderabad"    :"photo-1570168007204-dfb528c6958f",
    "kolkata"      :"photo-1558431382-27e303142255",
    "agra"         :"photo-1564507592333-c60657eea523",
    "varanasi"     :"photo-1561361058-c24e0bde46c6",
    "manali"       :"photo-1626621341517-bbf3d9990a23",
    "shimla"       :"photo-1597916829826-02e5bb4a54e0",
    "varkala"      :"photo-1602216056096-3b40cc0c9944",
    "munnar"       :"photo-1599661046289-e31897846e41",
    "ooty"         :"photo-1582719508461-905c673771fd",
    "coorg"        :"photo-1599661046289-e31897846e41",
    "new york"     :"photo-1496442226666-8d4d0e62e6e9",
    "dubai"        :"photo-1512453979798-5ea266f8880c",
    "singapore"    :"photo-1525625293386-3f8f99389edd",
    "bangkok"      :"photo-1508009603885-50cf7c579365",
    "bali"         :"photo-1537996194471-e657df975ab4",
    "london"       :"photo-1513635269975-59663e0ac1ad",
    "paris"        :"photo-1502602898657-3e91760cbb34",
    "tokyo"        :"photo-1540959733332-eab4deabeeaf",
    "maldives"     :"photo-1514282401047-d79a71a590e8",
    "sri lanka"    :"photo-1578662996442-48f60103fc96",
    "vietnam"      :"photo-1583417319070-4a69db38a482",
    "nepal"        :"photo-1544735716-392fe2489ffa",
    "turkey"       :"photo-1524231757912-21f4fe3a7200",
    "switzerland"  :"photo-1530122037265-a5f1f91d3b99",
    "australia"    :"photo-1523482580672-f109ba8cb9be",
    "japan"        :"photo-1528360983277-13d401cdc186",
    "usa"          :"photo-1571366343168-631c5bcca7a4",
  };

  app.get("/dest-image", (req, res) => {
    const city = (req.query.city || "").toLowerCase().trim();
    const photoId = DEST_IMAGES[city]
      || DEST_IMAGES[Object.keys(DEST_IMAGES).find(k => city.includes(k)) || ""];
    if (!photoId) return res.json({ found:false });
    const [w,h] = (req.query.size||"800x450").split("x");
    res.json({
      found: true,
      url  : `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${w||800}&h=${h||450}&q=80`,
      credit: "Photo from Unsplash",
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  TRIP SHARING
  // ══════════════════════════════════════════════════════════════════════════
  app.get("/trip/:tripId", async (req, res) => {
    try {
      const r = await pool.query(
        "SELECT pref_value FROM user_preferences WHERE pref_key=$1 LIMIT 1",
        [`trip_${req.params.tripId}`]
      );
      if (!r.rows.length) return res.status(404).json({ message:"Trip not found" });
      res.json(JSON.parse(r.rows[0].pref_value));
    } catch { res.status(500).json({ message:"Error loading trip" }); }
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  PRICE ALERTS — GET (list user's alerts)
  // ══════════════════════════════════════════════════════════════════════════
  app.get("/price-alerts", async (req, res) => {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(401).json({ message:"Token required" });
    const jwt = require("jsonwebtoken");
    let userId;
    try {
      const d = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
      userId = d.id;
    } catch { return res.status(403).json({ message:"Invalid token" }); }
    try {
      const r = await pool.query(
        "SELECT * FROM price_alerts WHERE user_id=$1 AND notified=FALSE ORDER BY created_at DESC",
        [userId]
      );
      res.json(r.rows);
    } catch { res.status(500).json({ message:"Error loading alerts" }); }
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  ADMIN ROUTES
  // ══════════════════════════════════════════════════════════════════════════
  app.get("/admin/bookings", async (req, res) => {
    try {
      const r = await pool.query("SELECT * FROM bookings ORDER BY created_at DESC LIMIT 200");
      res.json(r.rows);
    } catch { res.status(500).json({ message:"Server error" }); }
  });

  app.get("/admin/users", async (req, res) => {
    try {
      const r = await pool.query(
        "SELECT id,name,email,phone,wallet_balance,created_at FROM users ORDER BY id DESC LIMIT 200"
      );
      res.json(r.rows);
    } catch { res.status(500).json({ message:"Server error" }); }
  });

  app.get("/admin/events", async (req, res) => {
    try {
      const r = await pool.query("SELECT * FROM events ORDER BY created_at DESC LIMIT 200");
      res.json(r.rows);
    } catch { res.status(500).json({ message:"Server error" }); }
  });

  app.get("/admin/waitlist", async (req, res) => {
    try {
      const r = await pool.query("SELECT * FROM waitlist ORDER BY created_at DESC LIMIT 200");
      res.json(r.rows);
    } catch { res.status(500).json({ message:"Server error" }); }
  });

  app.get("/admin/promo-codes", async (req, res) => {
    try {
      const r = await pool.query("SELECT * FROM promo_codes ORDER BY created_at DESC");
      res.json(r.rows);
    } catch { res.status(500).json({ message:"Server error" }); }
  });

  app.post("/admin/promo-codes", async (req, res) => {
    try {
      const { code, discount_type, discount_value, min_booking_amount, max_uses, valid_until, description } = req.body;
      await pool.query(
        `INSERT INTO promo_codes (code,discount_type,discount_value,min_booking_amount,max_uses,valid_until,description,is_active,used_count)
         VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE,0)`,
        [code, discount_type||"flat", discount_value||0, min_booking_amount||0, max_uses||100, valid_until||null, description||""]
      );
      res.json({ ok:true, message:"Promo code created" });
    } catch (e) {
      if (e.code==="23505") return res.status(409).json({ message:"Code already exists" });
      res.status(500).json({ message:"Error creating promo code" });
    }
  });

  app.put("/admin/promo-codes/:code/toggle", async (req, res) => {
    try {
      const r = await pool.query(
        "UPDATE promo_codes SET is_active=NOT is_active WHERE UPPER(code)=UPPER($1) RETURNING is_active",
        [req.params.code]
      );
      res.json({ ok:true, is_active:r.rows[0]?.is_active });
    } catch { res.status(500).json({ message:"Error updating promo" }); }
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  WAITLIST (POST) — for landing page
  // ══════════════════════════════════════════════════════════════════════════
  app.post("/waitlist", async (req, res) => {
    try {
      const { email, name, source } = req.body;
      if (!email) return res.status(400).json({ message:"Email required" });
      await pool.query(
        "INSERT INTO waitlist (email,name,source) VALUES ($1,$2,$3) ON CONFLICT (email) DO NOTHING",
        [email.trim().toLowerCase(), name||"", source||"web"]
      );
      res.json({ message:"Added to waitlist!" });
    } catch { res.status(500).json({ message:"Server error" }); }
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  COUNTRIES LIST (for future country selector)
  // ══════════════════════════════════════════════════════════════════════════
  app.get("/countries", (req, res) => {
    res.json([
      {key:"india",       name:"India",         flag:"🇮🇳", currency:"₹"},
      {key:"usa",         name:"USA",            flag:"🇺🇸", currency:"$"},
      {key:"uk",          name:"UK",             flag:"🇬🇧", currency:"£"},
      {key:"australia",   name:"Australia",      flag:"🇦🇺", currency:"A$"},
      {key:"japan",       name:"Japan",          flag:"🇯🇵", currency:"¥"},
      {key:"germany",     name:"Germany",        flag:"🇩🇪", currency:"€"},
      {key:"france",      name:"France",         flag:"🇫🇷", currency:"€"},
      {key:"canada",      name:"Canada",         flag:"🇨🇦", currency:"C$"},
      {key:"singapore",   name:"Singapore",      flag:"🇸🇬", currency:"S$"},
      {key:"uae",         name:"UAE",            flag:"🇦🇪", currency:"AED"},
      {key:"south korea", name:"South Korea",    flag:"🇰🇷", currency:"₩"},
      {key:"brazil",      name:"Brazil",         flag:"🇧🇷", currency:"R$"},
      {key:"indonesia",   name:"Indonesia",      flag:"🇮🇩", currency:"Rp"},
    ]);
  });

  console.log("✅ server2.js mounted — WhatsApp, Email, WorldAirports, Admin, Sharing");
};