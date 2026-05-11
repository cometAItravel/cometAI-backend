/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API = "https://cometai-backend.onrender.com";

// ── IATA MAP ──────────────────────────────────────────────────────────────────
const IATA = {
  "bangalore":"BLR","bengaluru":"BLR","mumbai":"BOM","delhi":"DEL","chennai":"MAA",
  "hyderabad":"HYD","kolkata":"CCU","goa":"GOI","pune":"PNQ","kochi":"COK",
  "ahmedabad":"AMD","jaipur":"JAI","lucknow":"LKO","varanasi":"VNS","trivandrum":"TRV",
  "coimbatore":"CBE","madurai":"IXM","mangalore":"IXE","mysore":"MYQ",
  "visakhapatnam":"VTZ","varkala":"TRV","alleppey":"COK","munnar":"COK",
  "dubai":"DXB","singapore":"SIN","bangkok":"BKK","london":"LHR","new york":"JFK",
  "tokyo":"NRT","paris":"CDG","sydney":"SYD","bali":"DPS","kuala lumpur":"KUL",
  "colombo":"CMB","kathmandu":"KTM","doha":"DOH","abu dhabi":"AUH","muscat":"MCT",
  "istanbul":"IST","rome":"FCO","barcelona":"BCN","amsterdam":"AMS","zurich":"ZRH",
};
const INDIA_IATA = new Set(["BLR","BOM","DEL","MAA","HYD","CCU","GOI","PNQ","COK","AMD",
  "JAI","LKO","VNS","TRV","CBE","IXM","IXE","MYQ","VTZ","IXL","IXZ","NAG"]);

function flink(from, to, ddmm = "", pax = 1) {
  const fc = IATA[from?.toLowerCase()] || from?.slice(0,3).toUpperCase() || "BLR";
  const tc = IATA[to?.toLowerCase()]   || to?.slice(0,3).toUpperCase()   || "BOM";
  const base = (INDIA_IATA.has(fc) && INDIA_IATA.has(tc))
    ? "https://www.aviasales.in" : "https://www.aviasales.com";
  return `${base}/search/${fc}${ddmm}${tc}${pax}?marker=714667&sub_id=alvryn_ai`;
}

// ── THEMES ────────────────────────────────────────────────────────────────────
const THEMES = {
  gold: {
    name:"⭐ Alvryn Gold", bg:"#fdf8ee", msgArea:"#f5edda",
    sidebar:"#2a1f0a", navBg:"rgba(253,248,238,0.97)",
    userBubble:"#c9a84c", userText:"#1a1410",
    aiBubble:"#fffdf5", aiText:"#1a1410",
    border:"#c9a84c", inputBg:"#fffdf5", inputText:"#1a1410",
    chipBg:"rgba(201,168,76,0.12)", chipBorder:"#c9a84c", chipText:"#8B6914",
    sbText:"#f0e6d0", sbSubText:"#c9a060", sbBorder:"rgba(201,168,76,0.3)",
    accent:"#c9a84c", accentDark:"#8B6914",
    sendBtn:"linear-gradient(135deg,#c9a84c,#f0d080)", sendIcon:"#1a1410",
    globeColor:"#c9a84c", globeGlow:"rgba(201,168,76,0.4)", inkColor:"#8B6914",
  },
  avengers: {
    name:"🌌 Avengers", bg:"#0d1220", msgArea:"#0a0e1a",
    sidebar:"#060a14", navBg:"rgba(13,18,32,0.97)",
    userBubble:"#8b0000", userText:"#fff",
    aiBubble:"#141d2e", aiText:"#e0e8ff",
    border:"#4a90d9", inputBg:"#141d2e", inputText:"#e0e8ff",
    chipBg:"rgba(74,144,217,0.15)", chipBorder:"#4a90d9", chipText:"#7eb8f7",
    sbText:"#c8d8ff", sbSubText:"#6080b0", sbBorder:"rgba(74,144,217,0.3)",
    accent:"#4a90d9", accentDark:"#2a60a9",
    sendBtn:"linear-gradient(135deg,#8b0000,#cc2200)", sendIcon:"#fff",
    globeColor:"#4a90d9", globeGlow:"rgba(74,144,217,0.5)", inkColor:"#7eb8f7",
  },
  f1: {
    name:"🏎️ F1 Racing", bg:"#141414", msgArea:"#0f0f0f",
    sidebar:"#0a0a0a", navBg:"rgba(20,20,20,0.97)",
    userBubble:"#cc0000", userText:"#fff",
    aiBubble:"#1e1e1e", aiText:"#f0f0f0",
    border:"#cc0000", inputBg:"#1e1e1e", inputText:"#f0f0f0",
    chipBg:"rgba(204,0,0,0.12)", chipBorder:"#cc0000", chipText:"#ff6666",
    sbText:"#f0f0f0", sbSubText:"#888", sbBorder:"rgba(204,0,0,0.3)",
    accent:"#cc0000", accentDark:"#990000",
    sendBtn:"linear-gradient(135deg,#cc0000,#ff4444)", sendIcon:"#fff",
    globeColor:"#cc0000", globeGlow:"rgba(204,0,0,0.5)", inkColor:"#ff6666",
  },
  wwe: {
    name:"🤼 WWE", bg:"#111", msgArea:"#0a0a0a",
    sidebar:"#050505", navBg:"rgba(17,17,17,0.97)",
    userBubble:"#c9a84c", userText:"#0a0a0a",
    aiBubble:"#1c1c1c", aiText:"#ffd700",
    border:"#c9a84c", inputBg:"#1c1c1c", inputText:"#ffd700",
    chipBg:"rgba(201,168,76,0.12)", chipBorder:"#c9a84c", chipText:"#ffd700",
    sbText:"#ffd700", sbSubText:"#aa8800", sbBorder:"rgba(201,168,76,0.3)",
    accent:"#c9a84c", accentDark:"#8B6914",
    sendBtn:"linear-gradient(135deg,#c9a84c,#ffd700)", sendIcon:"#0a0a0a",
    globeColor:"#ffd700", globeGlow:"rgba(255,215,0,0.5)", inkColor:"#ffd700",
  },
  cricket: {
    name:"🏏 Cricket", bg:"#f0fff4", msgArea:"#e8f5e9",
    sidebar:"#1b4332", navBg:"rgba(240,255,244,0.97)",
    userBubble:"#2d6a4f", userText:"#fff",
    aiBubble:"#fff", aiText:"#1b4332",
    border:"#2d6a4f", inputBg:"#fff", inputText:"#1b4332",
    chipBg:"rgba(45,106,79,0.1)", chipBorder:"#2d6a4f", chipText:"#2d6a4f",
    sbText:"#d8f3dc", sbSubText:"#74c69d", sbBorder:"rgba(45,106,79,0.3)",
    accent:"#2d6a4f", accentDark:"#1b4332",
    sendBtn:"linear-gradient(135deg,#2d6a4f,#52b788)", sendIcon:"#fff",
    globeColor:"#2d6a4f", globeGlow:"rgba(45,106,79,0.4)", inkColor:"#1b4332",
  },
  football: {
    name:"⚽ Football", bg:"#f0fff4", msgArea:"#e8f5e8",
    sidebar:"#003d00", navBg:"rgba(240,255,244,0.97)",
    userBubble:"#006400", userText:"#fff",
    aiBubble:"#fff", aiText:"#003d00",
    border:"#006400", inputBg:"#fff", inputText:"#003d00",
    chipBg:"rgba(0,100,0,0.08)", chipBorder:"#006400", chipText:"#006400",
    sbText:"#ccffcc", sbSubText:"#66cc66", sbBorder:"rgba(0,100,0,0.3)",
    accent:"#006400", accentDark:"#003d00",
    sendBtn:"linear-gradient(135deg,#006400,#228b22)", sendIcon:"#fff",
    globeColor:"#228b22", globeGlow:"rgba(34,139,34,0.4)", inkColor:"#006400",
  },
  sakura: {
    name:"🌸 Sakura", bg:"#fff0f5", msgArea:"#ffe8f0",
    sidebar:"#4a0020", navBg:"rgba(255,240,245,0.97)",
    userBubble:"#e91e8c", userText:"#fff",
    aiBubble:"#fff5f8", aiText:"#4a0020",
    border:"#e91e8c", inputBg:"#fff5f8", inputText:"#4a0020",
    chipBg:"rgba(233,30,140,0.08)", chipBorder:"#e91e8c", chipText:"#c0006a",
    sbText:"#ffd0e8", sbSubText:"#cc88aa", sbBorder:"rgba(233,30,140,0.3)",
    accent:"#e91e8c", accentDark:"#c0006a",
    sendBtn:"linear-gradient(135deg,#e91e8c,#ff6bb5)", sendIcon:"#fff",
    globeColor:"#e91e8c", globeGlow:"rgba(233,30,140,0.4)", inkColor:"#c0006a",
  },
  nature: {
    name:"🌿 Nature", bg:"#f4f9f0", msgArea:"#eaf4e4",
    sidebar:"#1a3d1a", navBg:"rgba(244,249,240,0.97)",
    userBubble:"#4a7c3f", userText:"#fff",
    aiBubble:"#fff", aiText:"#1a3d1a",
    border:"#4a7c3f", inputBg:"#fff", inputText:"#1a3d1a",
    chipBg:"rgba(74,124,63,0.1)", chipBorder:"#4a7c3f", chipText:"#4a7c3f",
    sbText:"#d4edcc", sbSubText:"#88bb77", sbBorder:"rgba(74,124,63,0.3)",
    accent:"#4a7c3f", accentDark:"#2d5a24",
    sendBtn:"linear-gradient(135deg,#4a7c3f,#7abf66)", sendIcon:"#fff",
    globeColor:"#4a7c3f", globeGlow:"rgba(74,124,63,0.4)", inkColor:"#2d5a24",
  },
  sunset: {
    name:"🌅 Sunset", bg:"#fff8f0", msgArea:"#fff0e5",
    sidebar:"#3d1a00", navBg:"rgba(255,248,240,0.97)",
    userBubble:"#e65c00", userText:"#fff",
    aiBubble:"#fff5ee", aiText:"#3d1a00",
    border:"#e65c00", inputBg:"#fff5ee", inputText:"#3d1a00",
    chipBg:"rgba(230,92,0,0.1)", chipBorder:"#e65c00", chipText:"#b34700",
    sbText:"#ffd4b0", sbSubText:"#cc7744", sbBorder:"rgba(230,92,0,0.3)",
    accent:"#e65c00", accentDark:"#b34700",
    sendBtn:"linear-gradient(135deg,#e65c00,#ff8c42)", sendIcon:"#fff",
    globeColor:"#e65c00", globeGlow:"rgba(230,92,0,0.5)", inkColor:"#b34700",
  },
  royalblue: {
    name:"👑 Royal Blue", bg:"#f0f4ff", msgArea:"#e8eeff",
    sidebar:"#0a1a5c", navBg:"rgba(240,244,255,0.97)",
    userBubble:"#1a3acc", userText:"#fff",
    aiBubble:"#fff", aiText:"#0a1a5c",
    border:"#1a3acc", inputBg:"#fff", inputText:"#0a1a5c",
    chipBg:"rgba(26,58,204,0.08)", chipBorder:"#1a3acc", chipText:"#1a3acc",
    sbText:"#c8d8ff", sbSubText:"#7090cc", sbBorder:"rgba(26,58,204,0.3)",
    accent:"#1a3acc", accentDark:"#0a1a8c",
    sendBtn:"linear-gradient(135deg,#1a3acc,#4466ff)", sendIcon:"#fff",
    globeColor:"#4466ff", globeGlow:"rgba(68,102,255,0.5)", inkColor:"#1a3acc",
  },
  galaxy: {
    name:"🌌 Galaxy", bg:"#080c1a", msgArea:"#0c1222",
    sidebar:"#05080f", navBg:"rgba(8,12,26,0.97)",
    userBubble:"#6c00ff", userText:"#fff",
    aiBubble:"#10182e", aiText:"#c8b4ff",
    border:"#6c00ff", inputBg:"#10182e", inputText:"#c8b4ff",
    chipBg:"rgba(108,0,255,0.15)", chipBorder:"#6c00ff", chipText:"#aa88ff",
    sbText:"#c8b4ff", sbSubText:"#7755cc", sbBorder:"rgba(108,0,255,0.3)",
    accent:"#8844ff", accentDark:"#4a00bb",
    sendBtn:"linear-gradient(135deg,#6c00ff,#aa44ff)", sendIcon:"#fff",
    globeColor:"#aa44ff", globeGlow:"rgba(170,68,255,0.5)", inkColor:"#aa88ff",
  },
  rosegold: {
    name:"🌹 Rose Gold", bg:"#fff5f5", msgArea:"#ffecec",
    sidebar:"#4a1520", navBg:"rgba(255,245,245,0.97)",
    userBubble:"#c0496a", userText:"#fff",
    aiBubble:"#fff8f8", aiText:"#4a1520",
    border:"#c0496a", inputBg:"#fff8f8", inputText:"#4a1520",
    chipBg:"rgba(192,73,106,0.08)", chipBorder:"#c0496a", chipText:"#8a2a42",
    sbText:"#ffd0d8", sbSubText:"#cc8899", sbBorder:"rgba(192,73,106,0.3)",
    accent:"#c0496a", accentDark:"#8a2a42",
    sendBtn:"linear-gradient(135deg,#c0496a,#e87a9a)", sendIcon:"#fff",
    globeColor:"#c0496a", globeGlow:"rgba(192,73,106,0.4)", inkColor:"#8a2a42",
  },
};

// ── SOUND EFFECTS ─────────────────────────────────────────────────────────────
function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === "send") {
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(); osc.stop(ctx.currentTime + 0.15);
    } else if (type === "receive") {
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.05);
      osc.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start(); osc.stop(ctx.currentTime + 0.2);
    }
  } catch {}
}

// ── GLOBE CITIES ──────────────────────────────────────────────────────────────
const GLOBE_CITIES = [
  { name:"Paris",     x:48, y:30, label:"🗼" },
  { name:"Dubai",     x:59, y:42, label:"🏙" },
  { name:"Singapore", x:73, y:56, label:"🦁" },
  { name:"New York",  x:22, y:36, label:"🗽" },
  { name:"Tokyo",     x:81, y:34, label:"⛩" },
  { name:"Bangalore", x:62, y:52, label:"🇮🇳" },
  { name:"London",    x:44, y:27, label:"🎡" },
  { name:"Sydney",    x:82, y:72, label:"🦘" },
  { name:"Mumbai",    x:60, y:48, label:"🌊" },
  { name:"Bangkok",   x:72, y:50, label:"🛕" },
];

// ── HOLOGRAPHIC GLOBE ─────────────────────────────────────────────────────────
function HolographicGlobe({ themeKey, query }) {
  const T = THEMES[themeKey];
  const [tick, setTick] = useState(0);
  const [activeCities, setActiveCities] = useState([]);
  const rafRef = useRef(null);
  const lastTickRef = useRef(0);

  useEffect(() => {
    let running = true;
    const animate = (ts) => {
      if (!running) return;
      if (ts - lastTickRef.current > 60) {
        lastTickRef.current = ts;
        setTick(t => t + 1);
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  }, []);

  useEffect(() => {
    if (!query) { setActiveCities([]); return; }
    const q = query.toLowerCase();
    const matched = GLOBE_CITIES.filter(c =>
      q.includes(c.name.toLowerCase()) ||
      (q.includes("europe") && ["Paris","London"].includes(c.name)) ||
      (q.includes("honeymoon") && ["Paris","Singapore","Bangkok"].includes(c.name)) ||
      (q.includes("india") && ["Bangalore","Mumbai"].includes(c.name)) ||
      (q.includes("asia") && ["Singapore","Bangkok","Tokyo"].includes(c.name)) ||
      (q.includes("middle east") && ["Dubai"].includes(c.name))
    ).map(c => c.name);
    setActiveCities(matched.length ? matched : GLOBE_CITIES.slice(0,3).map(c => c.name));
  }, [query]);

  const SZ = 180, cx = SZ/2, cy = SZ/2, r = 72;
  const meridians = Array.from({length:8}, (_,i) => {
    const angle = (i/8)*180 + tick*0.3;
    const rad = (angle*Math.PI)/180;
    return { x1: cx+r*Math.cos(rad), y1: cy-r, x2: cx-r*Math.cos(rad), y2: cy+r, op: 0.12+0.08*Math.abs(Math.cos(rad)) };
  });
  const parallels = Array.from({length:5}, (_,i) => {
    const y = cy - r + (i+1)*(r*2/6);
    const rr = Math.sqrt(Math.max(0, r*r-(y-cy)*(y-cy)));
    return { cy: y, rx: rr, ry: rr*0.3 };
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"12px 8px" }}>
      <svg width={SZ} height={SZ} viewBox={`0 0 ${SZ} ${SZ}`}
        style={{ filter:`drop-shadow(0 0 18px ${T.globeGlow})` }}>
        <defs>
          <radialGradient id="gGrad" cx="40%" cy="35%">
            <stop offset="0%" stopColor={T.globeColor} stopOpacity="0.25"/>
            <stop offset="100%" stopColor={T.globeColor} stopOpacity="0.03"/>
          </radialGradient>
          <clipPath id="gClip"><circle cx={cx} cy={cy} r={r}/></clipPath>
        </defs>
        <circle cx={cx} cy={cy} r={r+14} fill={T.globeColor} fillOpacity="0.05"/>
        <circle cx={cx} cy={cy} r={r} fill="url(#gGrad)" stroke={T.globeColor} strokeWidth="1" strokeOpacity="0.35"/>
        <g clipPath="url(#gClip)">
          {meridians.map((m,i) => (
            <line key={i} x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2}
              stroke={T.globeColor} strokeWidth="0.5" strokeOpacity={m.op}/>
          ))}
          {parallels.map((p,i) => (
            <ellipse key={i} cx={cx} cy={p.cy} rx={p.rx} ry={p.ry}
              fill="none" stroke={T.globeColor} strokeWidth="0.5" strokeOpacity="0.18"/>
          ))}
        </g>
        {activeCities.length >= 2 && activeCities.slice(0,3).map((cn, i) => {
          const c1 = GLOBE_CITIES.find(c => c.name === cn);
          const c2 = GLOBE_CITIES.find(c => c.name === activeCities[(i+1)%activeCities.length]);
          if (!c1||!c2) return null;
          const x1=(c1.x/100)*SZ, y1=(c1.y/100)*SZ, x2=(c2.x/100)*SZ, y2=(c2.y/100)*SZ;
          return (
            <path key={i} d={`M ${x1} ${y1} Q ${(x1+x2)/2} ${Math.min(y1,y2)-28} ${x2} ${y2}`}
              fill="none" stroke={T.globeColor} strokeWidth="1.2"
              strokeOpacity="0.65" strokeDasharray="5 4"
              strokeDashoffset={-(tick*0.7)%36}/>
          );
        })}
        {GLOBE_CITIES.map((city, i) => {
          const px=(city.x/100)*SZ, py=(city.y/100)*SZ;
          const isActive = activeCities.includes(city.name);
          const pulse = isActive ? 0.5+0.5*Math.sin(tick*0.08+i) : 0;
          return (
            <g key={city.name}>
              {isActive && <circle cx={px} cy={py} r={7+pulse*4} fill={T.globeColor} fillOpacity={0.14*pulse}/>}
              <circle cx={px} cy={py} r={isActive?3.5:2} fill={T.globeColor} fillOpacity={isActive?0.9:0.35}/>
              {isActive && <text x={px+5} y={py-5} fontSize="9" fill={T.globeColor} fillOpacity="0.9">{city.label}</text>}
            </g>
          );
        })}
        <circle cx={cx-r*0.28} cy={cy-r*0.28} r={r*0.12} fill="white" fillOpacity="0.06"/>
      </svg>
      <div style={{ fontFamily:"'Caveat',cursive", fontSize:13, color:T.globeColor,
        marginTop:6, animation:"globePulse 1.4s ease-in-out infinite" }}>
        {activeCities.length > 0
          ? `✈ ${activeCities.slice(0,2).join(" → ")} ...`
          : "🌍 Searching the world..."}
      </div>
    </div>
  );
}

// ── SHIMMER WORD REVEAL ───────────────────────────────────────────────────────
function ShimmerText({ text, themeKey, onDone }) {
  const T = THEMES[themeKey];
  const [visibleCount, setVisibleCount] = useState(0);
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; });

  useEffect(() => {
    setVisibleCount(0);
    const wordCount = text ? text.split(" ").length : 0;
    if (!wordCount) { if (onDoneRef.current) onDoneRef.current(); return; }
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setVisibleCount(i);
      if (i >= wordCount) { clearInterval(iv); if (onDoneRef.current) onDoneRef.current(); }
    }, 55);
    return () => clearInterval(iv);
  }, [text]);

  const words = text ? text.split(" ") : [];
  return (
    <span style={{ whiteSpace:"pre-wrap", lineHeight:1.8 }}>
      {words.map((word, i) => (
        <span key={i} style={{
          display:"inline-block", marginRight:"0.28em",
          opacity: i < visibleCount ? 1 : 0,
          transform: i < visibleCount ? "translateY(0) scale(1)" : "translateY(7px) scale(0.92)",
          transition:"opacity 0.28s ease, transform 0.28s ease",
          color: i === visibleCount-1 ? T.accent : T.aiText,
          textShadow: i === visibleCount-1 ? `0 0 10px ${T.globeGlow}` : "none",
          fontWeight: i === visibleCount-1 ? 700 : 400,
        }}>
          {word}
        </span>
      ))}
    </span>
  );
}

// ── PRICE ALERT BUTTON ────────────────────────────────────────────────────────
function PriceAlertBtn({ from, to, currentPrice, T }) {
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");
  const click = async () => {
    if (!token) { alert("Please sign in to set price alerts"); return; }
    setLoading(true);
    try {
      await fetch(`${API}/price-alert`, {
        method:"POST",
        headers:{"Content-Type":"application/json", Authorization:`Bearer ${token}`},
        body: JSON.stringify({ from_city:from, to_city:to, current_price:currentPrice }),
      });
      setDone(true);
    } catch {}
    setLoading(false);
  };
  if (done) return <div style={{fontSize:11,color:"#16a34a",fontFamily:"'Caveat',cursive"}}>🔔 Alert set!</div>;
  return (
    <button onClick={click} disabled={loading}
      style={{ padding:"5px 12px", borderRadius:8, fontSize:12, fontWeight:600,
        cursor:"pointer", background:"transparent", border:`2px solid ${T.border}`,
        color:T.accent, fontFamily:"'Caveat',cursive" }}>
      🔔 {loading ? "..." : "Track Price"}
    </button>
  );
}

// ── TRAVEL CARDS ──────────────────────────────────────────────────────────────
function cardBase(T) {
  return {
    background:T.aiBubble, border:`2px solid ${T.border}`,
    borderRadius:"16px 16px 16px 4px", padding:"14px 16px",
    marginBottom:10, cursor:"pointer", boxShadow:`3px 3px 0 ${T.border}`,
    transition:"transform 0.15s, box-shadow 0.15s", fontFamily:"'Caveat',cursive",
  };
}
const hoverIn  = (e, T) => { e.currentTarget.style.transform="translate(-2px,-2px)"; e.currentTarget.style.boxShadow=`5px 5px 0 ${T.border}`; };
const hoverOut = (e, T) => { e.currentTarget.style.transform="translate(0,0)";       e.currentTarget.style.boxShadow=`3px 3px 0 ${T.border}`; };

function FlightCard({ f, themeKey }) {
  const T = THEMES[themeKey];
  return (
    <div onClick={() => window.open(f.link,"_blank","noopener")}
      style={cardBase(T)} onMouseEnter={e=>hoverIn(e,T)} onMouseLeave={e=>hoverOut(e,T)}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:20}}>✈️</span>
          <span style={{fontSize:15,color:T.aiText,fontWeight:700}}>{f.airline||"Multiple Airlines"}</span>
        </div>
        {f.label && <span style={{padding:"3px 10px",borderRadius:20,fontSize:12,border:`1.5px solid ${T.accent}`,color:T.accent}}>{f.label}</span>}
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:22,fontWeight:700,color:T.aiText}}>{f.departure||"—"}</div>
          <div style={{fontSize:12,color:T.accent,opacity:0.85}}>{f.fromCode}</div>
        </div>
        <div style={{flex:1,textAlign:"center",padding:"0 10px"}}>
          <div style={{fontSize:11,color:T.aiText,opacity:0.6}}>{f.duration||"Direct"}</div>
          <div style={{height:2,background:`linear-gradient(90deg,transparent,${T.accent},transparent)`,margin:"4px 0",position:"relative"}}>
            <span style={{position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",fontSize:13}}>✈</span>
          </div>
          <div style={{fontSize:10,color:T.accent}}>DIRECT</div>
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:22,fontWeight:700,color:T.aiText}}>{f.arrival||"—"}</div>
          <div style={{fontSize:12,color:T.accent,opacity:0.85}}>{f.toCode}</div>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:10,borderTop:`1.5px dashed ${T.border}`}}>
        <div>
          <div style={{fontSize:11,color:T.aiText,opacity:0.5}}>APPROX FROM</div>
          <div style={{fontSize:22,fontWeight:700,color:T.accent}}>{f.price?`₹${f.price.toLocaleString()}`:"Live rates"}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
          <div style={{padding:"8px 16px",borderRadius:10,background:T.accent,border:`2px solid ${T.accentDark}`,color:T.userText,fontSize:13,fontWeight:700,boxShadow:`2px 2px 0 ${T.accentDark}`}}>
            Book Best Price →
          </div>
          {f.from && f.to && <PriceAlertBtn from={f.from} to={f.to} currentPrice={f.price} T={T}/>}
        </div>
      </div>
      {f.insight && <div style={{marginTop:8,padding:"6px 10px",borderRadius:8,border:`1px dashed ${T.border}`,fontSize:13,color:T.aiText,opacity:0.8}}>💡 {f.insight}</div>}
    </div>
  );
}

function BusCard({ b, themeKey }) {
  const T = THEMES[themeKey];
  return (
    <div onClick={() => window.open(b.link,"_blank","noopener")}
      style={cardBase(T)} onMouseEnter={e=>hoverIn(e,T)} onMouseLeave={e=>hoverOut(e,T)}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:20}}>🚌</span>
          <span style={{fontSize:15,color:T.aiText,fontWeight:700}}>{b.operator}</span>
        </div>
        <span style={{fontSize:13,color:T.aiText,opacity:0.7}}>{b.type}</span>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:20,fontWeight:700,color:T.aiText}}>{b.departure}</div>
          <div style={{fontSize:12,color:T.accent}}>{b.from}</div>
        </div>
        <div style={{flex:1,textAlign:"center"}}>
          <div style={{fontSize:11,color:T.aiText,opacity:0.6}}>{b.duration||"Direct"}</div>
          <div style={{height:2,background:`linear-gradient(90deg,transparent,${T.accent},transparent)`,margin:"4px 0"}}/>
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:20,fontWeight:700,color:T.aiText}}>{b.arrival}</div>
          <div style={{fontSize:12,color:T.accent}}>{b.to}</div>
        </div>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:10,borderTop:`1.5px dashed ${T.border}`}}>
        <div style={{fontSize:20,fontWeight:700,color:T.accent}}>₹{b.price?.toLocaleString()||"—"}</div>
        <div style={{padding:"8px 16px",borderRadius:10,background:T.accent,border:`2px solid ${T.accentDark}`,color:T.userText,fontSize:13,fontWeight:700,boxShadow:`2px 2px 0 ${T.accentDark}`}}>
          View on Partner →
        </div>
      </div>
    </div>
  );
}

function HotelCard({ h, themeKey }) {
  const T = THEMES[themeKey];
  return (
    <div onClick={() => window.open(h.link,"_blank","noopener")}
      style={cardBase(T)} onMouseEnter={e=>hoverIn(e,T)} onMouseLeave={e=>hoverOut(e,T)}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
        <span style={{fontSize:20}}>🏨</span>
        <span style={{fontSize:15,color:T.aiText,fontWeight:700}}>Hotels in {h.city}</span>
        {h.label && <span style={{padding:"3px 8px",borderRadius:20,fontSize:11,border:`1.5px solid ${T.accent}`,color:T.accent}}>{h.label}</span>}
      </div>
      {h.insight && <div style={{fontSize:13,color:T.aiText,opacity:0.7,marginBottom:8}}>💡 {h.insight}</div>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:10,borderTop:`1.5px dashed ${T.border}`}}>
        <div style={{fontSize:20,fontWeight:700,color:T.accent}}>₹{h.priceRange}/night</div>
        <div style={{padding:"8px 16px",borderRadius:10,background:T.accent,border:`2px solid ${T.accentDark}`,color:T.userText,fontSize:13,fontWeight:700,boxShadow:`2px 2px 0 ${T.accentDark}`}}>
          View Hotels →
        </div>
      </div>
    </div>
  );
}

function TrainCard({ t, themeKey }) {
  const T = THEMES[themeKey];
  return (
    <div onClick={() => window.open(t.link,"_blank","noopener")}
      style={cardBase(T)} onMouseEnter={e=>hoverIn(e,T)} onMouseLeave={e=>hoverOut(e,T)}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
        <span style={{fontSize:20}}>🚂</span>
        <span style={{fontSize:15,color:T.aiText,fontWeight:700}}>{t.from} → {t.to}</span>
        {t.label && <span style={{padding:"3px 8px",borderRadius:20,fontSize:11,border:`1.5px solid ${T.accent}`,color:T.accent}}>{t.label}</span>}
      </div>
      {t.insight && <div style={{fontSize:13,color:T.aiText,opacity:0.7,marginBottom:6}}>💡 {t.insight}</div>}
      {t.date && <div style={{fontSize:13,color:T.accent,marginBottom:6}}>📅 {t.date}</div>}
      <div style={{display:"flex",justifyContent:"flex-end",paddingTop:8,borderTop:`1.5px dashed ${T.border}`}}>
        <div style={{padding:"8px 16px",borderRadius:10,background:T.accent,border:`2px solid ${T.accentDark}`,color:T.userText,fontSize:13,fontWeight:700,boxShadow:`2px 2px 0 ${T.accentDark}`}}>
          Search on IRCTC →
        </div>
      </div>
    </div>
  );
}

// ── SIDEBAR CHAT ITEM ─────────────────────────────────────────────────────────
function SidebarChatItem({ chat, isActive, onLoad, onRename, onDelete, T }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [val, setVal] = useState(chat.title);
  const ref = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", h);
    document.addEventListener("touchstart", h);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("touchstart", h); };
  }, [menuOpen]);

  return (
    <div style={{position:"relative",marginBottom:3}}>
      <div onClick={() => { if (!menuOpen && !renaming) onLoad(); }}
        style={{
          padding:"9px 10px", borderRadius:10, cursor:"pointer",
          background: isActive ? `${T.accent}20` : "transparent",
          border: isActive ? `2px solid ${T.accent}` : "2px solid transparent",
          display:"flex", alignItems:"center", gap:6,
          fontFamily:"'Caveat',cursive",
        }}>
        <div style={{flex:1,minWidth:0}}>
          {renaming ? (
            <input value={val} autoFocus
              onChange={e => setVal(e.target.value)}
              onBlur={() => { onRename(chat.id, val.trim()||chat.title); setRenaming(false); }}
              onKeyDown={e => { if(e.key==="Enter"){onRename(chat.id,val.trim()||chat.title);setRenaming(false);} if(e.key==="Escape")setRenaming(false); }}
              onClick={e => e.stopPropagation()}
              style={{ width:"100%", background:"rgba(255,255,255,0.15)", border:`1px solid ${T.accent}`,
                borderRadius:5, padding:"2px 6px", fontSize:13, color:T.sbText,
                outline:"none", fontFamily:"'Caveat',cursive" }}/>
          ) : (
            <>
              <div style={{fontSize:13,color:T.sbText,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{chat.title}</div>
              <div style={{fontSize:10,color:T.sbSubText,marginTop:1}}>
                {new Date(chat.time).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}
              </div>
            </>
          )}
        </div>
        <button onClick={e => {e.stopPropagation();setMenuOpen(s=>!s);}}
          style={{width:24,height:24,borderRadius:5,background:"transparent",border:"none",
            cursor:"pointer",color:T.sbSubText,fontSize:15,display:"flex",alignItems:"center",justifyContent:"center"}}>⋯</button>
      </div>
      {menuOpen && (
        <div ref={ref} onClick={e=>e.stopPropagation()}
          style={{position:"absolute",right:0,top:34,zIndex:100,
            background:T.aiBubble,borderRadius:10,padding:"4px 0",
            boxShadow:`3px 3px 0 ${T.border}`,border:`2px solid ${T.border}`,
            minWidth:130,fontFamily:"'Caveat',cursive"}}>
          <button onClick={()=>{setRenaming(true);setMenuOpen(false);}}
            style={{display:"block",width:"100%",padding:"9px 14px",textAlign:"left",
              background:"none",border:"none",cursor:"pointer",fontSize:14,color:T.aiText}}>✏️ Rename</button>
          <button onClick={()=>{onDelete(chat.id);setMenuOpen(false);}}
            style={{display:"block",width:"100%",padding:"9px 14px",textAlign:"left",
              background:"none",border:"none",cursor:"pointer",fontSize:14,color:"#ef4444"}}>🗑️ Delete</button>
        </div>
      )}
    </div>
  );
}

// ── THEME PICKER ──────────────────────────────────────────────────────────────
function ThemePicker({ current, onSelect, T }) {
  return (
    <div style={{padding:"8px 4px"}}>
      <div style={{fontSize:11,color:T.sbSubText,letterSpacing:"0.1em",marginBottom:8,fontFamily:"'Caveat',cursive"}}>🎨 SELECT THEME</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
        {Object.entries(THEMES).map(([key, theme]) => (
          <button key={key} onClick={()=>onSelect(key)}
            style={{
              display:"flex",alignItems:"center",gap:6,padding:"8px 10px",
              borderRadius:10,cursor:"pointer",
              border: current===key ? `2px solid ${T.accent}` : `2px solid ${T.sbBorder}`,
              background: current===key ? `${T.accent}20` : "rgba(255,255,255,0.05)",
              color:T.sbText, fontFamily:"'Caveat',cursive", fontSize:12, textAlign:"left",
            }}>
            <div style={{width:14,height:14,borderRadius:"50%",background:theme.accent,flexShrink:0,border:"1px solid rgba(255,255,255,0.2)"}}/>
            <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{theme.name}</span>
            {current===key && <span style={{color:T.accent,fontSize:11}}>✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── ALVRYN LOGO ───────────────────────────────────────────────────────────────
function AlvrynLogo({ size=32, color="#c9a84c" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="30" stroke={color} strokeWidth="1.5" fill="none"/>
      <path d="M20 46 L28 18 L36 46" stroke={color} strokeWidth="2.2" strokeLinecap="round" fill="none"/>
      <path d="M22.5 36 L33.5 36" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M26 46 L34 18 L42 46" stroke={color} strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.5"/>
    </svg>
  );
}

// ══ MAIN COMPONENT ════════════════════════════════════════════════════════════
export default function AIChatPage() {
  const navigate = useNavigate();
  const [themeKey, setThemeKey]   = useState(() => localStorage.getItem("alvryn_theme") || "gold");
  const [chats, setChats]         = useState([]);
  const [activeId, setActiveId]   = useState(null);
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [thinking, setThinking]   = useState(false);
  const [thinkQuery, setThinkQuery] = useState("");
  const [sbOpen, setSbOpen]       = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);
  const textareaRef = useRef(null);
  const sessionIdRef = useRef(sessionStorage.getItem("alvryn_sid") || null);
  const thinkStartRef = useRef(0);

  const T = THEMES[themeKey];
  const token = localStorage.getItem("token");
  let user = {};
  try { user = JSON.parse(localStorage.getItem("user") || "{}"); } catch {}

  useEffect(() => { if (!token) navigate("/login"); }, [token]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, thinking]);
  useEffect(() => { localStorage.setItem("alvryn_theme", themeKey); }, [themeKey]);
  useEffect(() => {
    fetch(`${API}/test`).catch(()=>{});
    const t = setInterval(() => fetch(`${API}/test`).catch(()=>{}), 14*60*1000);
    return () => clearInterval(t);
  }, []);

  // Load chats
  useEffect(() => {
    if (!token) return;
    try {
      const local = JSON.parse(localStorage.getItem("alvryn_chats") || "[]");
      if (local.length > 0) setChats(local);
    } catch {}
    fetch(`${API}/chats`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => { if(!r.ok) throw new Error(); return r.json(); })
      .then(data => {
        if (!Array.isArray(data) || !data.length) return;
        const mapped = data.map(c => ({
          id: c.chat_id,
          title: c.title || "New chat",
          messages: (Array.isArray(c.messages) ? c.messages : []).map(m => ({
            ...m, id: m.id||Date.now(), role: m.role||"user", content: m.content||m.text||"",
          })),
          time: new Date(c.updated_at||c.created_at).getTime(),
        }));
        setChats(mapped);
        localStorage.setItem("alvryn_chats", JSON.stringify(mapped.slice(0,30)));
      })
      .catch(()=>{});
  }, [token]);

  const saveChat = useCallback((id, msgs, chatTitle) => {
    const title = chatTitle || "New chat";
    setChats(prev => {
      const ex = prev.find(c => c.id === id);
      if (ex) return prev.map(c => c.id===id ? {...c, messages:msgs, time:Date.now()} : c);
      return [{ id, title, messages:msgs, time:Date.now() }, ...prev].slice(0,50);
    });
    try {
      const stored = JSON.parse(localStorage.getItem("alvryn_chats") || "[]");
      const t2 = stored.find(c => c.id===id)?.title || title;
      localStorage.setItem("alvryn_chats", JSON.stringify(
        [{ id, title:t2, messages:msgs, time:Date.now() }, ...stored.filter(c=>c.id!==id)].slice(0,30)
      ));
    } catch {}
    if (token) {
      const stored2 = JSON.parse(localStorage.getItem("alvryn_chats")||"[]");
      const t3 = stored2.find(c=>c.id===id)?.title || title;
      fetch(`${API}/chats/${id}`, {
        method:"POST",
        headers:{"Content-Type":"application/json", Authorization:`Bearer ${token}`},
        body: JSON.stringify({
          title: t3,
          messages: msgs.slice(0,100).map(m => ({
            role:m.role, content:m.content||"", text:m.text||"",
            cards:(m.cards||[]).slice(0,5), id:m.id,
          })),
        }),
      }).catch(()=>{});
    }
  }, [token]);

  const newChat = useCallback(() => {
    setActiveId(Date.now().toString());
    setMessages([]);
    setInput("");
    setSbOpen(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const loadChat = useCallback(chat => {
    setActiveId(chat.id);
    setMessages(chat.messages || []);
    setSbOpen(false);
  }, []);

  const deleteChat = useCallback(chatId => {
    setChats(prev => prev.filter(c => c.id !== chatId));
    if (chatId === activeId) { setActiveId(null); setMessages([]); }
    if (token) fetch(`${API}/chats/${chatId}`, { method:"DELETE", headers:{ Authorization:`Bearer ${token}` } }).catch(()=>{});
  }, [activeId, token]);

  const renameChat = useCallback((chatId, newTitle) => {
    setChats(prev => prev.map(c => c.id===chatId ? {...c, title:newTitle} : c));
    try {
      const stored = JSON.parse(localStorage.getItem("alvryn_chats")||"[]");
      localStorage.setItem("alvryn_chats", JSON.stringify(stored.map(c => c.id===chatId ? {...c, title:newTitle} : c)));
      const chat = stored.find(c => c.id===chatId);
      if (chat && token) {
        fetch(`${API}/chats/${chatId}`, {
          method:"POST",
          headers:{"Content-Type":"application/json", Authorization:`Bearer ${token}`},
          body: JSON.stringify({ title:newTitle, messages:chat.messages||[] }),
        }).catch(()=>{});
      }
    } catch {}
  }, [token]);

  const send = useCallback(async text => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    playSound("send");

    const id = activeId || Date.now().toString();
    if (!activeId) setActiveId(id);

    const uMsg = { role:"user", content:q, id:Date.now() };
    const next = [...messages, uMsg];
    setMessages(next);
    setLoading(true);
    setThinking(true);
    setThinkQuery(q);
    thinkStartRef.current = Date.now();

    try {
      const res = await fetch(`${API}/ai-chat-v2`, {
        method:"POST",
        headers:{"Content-Type":"application/json", Authorization:`Bearer ${token}`},
        body: JSON.stringify({ message:q, history:messages.slice(-6), sessionId:sessionIdRef.current }),
      });
      const data = await res.json();

      // Minimum 2s thinking
      const elapsed = Date.now() - thinkStartRef.current;
      if (elapsed < 2000) await new Promise(r => setTimeout(r, 2000-elapsed));

      if (data.sessionId) { sessionIdRef.current = data.sessionId; sessionStorage.setItem("alvryn_sid", data.sessionId); }

      setThinking(false);
      playSound("receive");

      const aMsg = {
        role:"assistant", id:Date.now()+1,
        text: data.text || "",
        cards: data.cards || [],
        cta: data.cta || null,
        quickReplies: data.quickReplies || [],
        sectionNum: data.sectionNum || null,
        totalSections: data.totalSections || null,
        _shimmerDone: false,
      };
      const final = [...next, aMsg];
      setMessages(final);

      const chatTitle = next[0]?.content?.slice(0,44)+(next[0]?.content?.length>44?"…":"") || "New chat";
      saveChat(id, final, chatTitle);
    } catch {
      setThinking(false);
      const errMsg = {
        role:"assistant", id:Date.now()+1,
        text:"Hmm, something went sideways! 😅 Try again in a moment — I promise I'm usually faster than this! ✈️",
        cards:[], cta:null,
      };
      setMessages([...next, errMsg]);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 80);
  }, [input, loading, messages, token, activeId, saveChat]);

  const handleKey = e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); send(); } };
  const handleInput = e => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 130) + "px";
    }
  };

  const empty = messages.length === 0;
  const chatTitle = chats.find(c => c.id===activeId)?.title || "Alvryn AI";

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    html,body{height:100%;overflow:hidden;}
    @keyframes globePulse{0%,100%{opacity:0.7;}50%{opacity:1;}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
    @keyframes sketchIn{from{opacity:0;transform:scale(0.93) rotate(-1deg);}to{opacity:1;transform:scale(1) rotate(0deg);}}
    @keyframes spin{to{transform:rotate(360deg);}}
    @keyframes shimmerPulse{0%,100%{opacity:1;}50%{opacity:0.35;}}
    @keyframes wobble{0%,100%{transform:rotate(-1deg);}50%{transform:rotate(1deg);}}
    @keyframes chipHover{to{transform:translateY(-2px) rotate(-1deg);}}
    ::-webkit-scrollbar{width:3px;}
    ::-webkit-scrollbar-thumb{border-radius:2px;}
    textarea{font-family:'Caveat',cursive!important;}
    textarea::placeholder{font-family:'Caveat',cursive!important;}
  `;

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", height:"100vh", height:"100dvh", background:T.bg,
      overflow:"hidden", fontFamily:"'Caveat',cursive",
      transition:"background 0.4s ease" }}>
      <style>{CSS}</style>

      {/* OVERLAY */}
      {sbOpen && (
        <div onClick={() => setSbOpen(false)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)",
            backdropFilter:"blur(4px)", zIndex:390 }}/>
      )}

      {/* ══ SIDEBAR ══════════════════════════════════════════════════════════ */}
      <div style={{
        width: sbOpen ? "min(85vw,288px)" : 0,
        flexShrink:0, background:T.sidebar,
        borderRight:`2px solid ${T.sbBorder}`,
        position:"fixed", left:0, top:0, bottom:0, zIndex:400,
        overflow:"hidden",
        transition:"width 0.26s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: sbOpen ? "4px 0 24px rgba(0,0,0,0.45)" : "none",
      }}>
        <div style={{ display:"flex", flexDirection:"column", height:"100%",
          padding:"14px 11px", overflowY:"auto", overflowX:"hidden", whiteSpace:"nowrap",
          minWidth:288 }}>

          {/* Logo + close */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            marginBottom:16, paddingBottom:12, borderBottom:`2px dashed ${T.sbBorder}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}
              onClick={() => navigate("/")}>
              <AlvrynLogo size={30} color={T.accent}/>
              <div>
                <div style={{ fontSize:17, fontWeight:700, color:T.accent, letterSpacing:"0.1em" }}>ALVRYN</div>
                <div style={{ fontSize:10, color:T.sbSubText }}>AI Travel</div>
              </div>
            </div>
            <button onClick={() => setSbOpen(false)}
              style={{ width:30, height:30, borderRadius:"50%", background:"transparent",
                border:`2px solid ${T.sbBorder}`, cursor:"pointer",
                color:T.sbSubText, fontSize:16, display:"flex",
                alignItems:"center", justifyContent:"center" }}>×</button>
          </div>

          {/* New Chat */}
          <button onClick={newChat}
            style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 13px",
              borderRadius:12, background:T.accent, border:`2px solid ${T.accentDark}`,
              cursor:"pointer", color:T.userText, fontSize:14, fontWeight:700,
              marginBottom:10, width:"100%", fontFamily:"'Caveat',cursive",
              boxShadow:`3px 3px 0 ${T.accentDark}` }}
            onMouseEnter={e=>{e.currentTarget.style.transform="translate(-2px,-2px)";e.currentTarget.style.boxShadow=`5px 5px 0 ${T.accentDark}`;}}
            onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow=`3px 3px 0 ${T.accentDark}`;}}>
            <span style={{fontSize:16}}>✚</span> New Chat
          </button>

          {/* Theme toggle */}
          <button onClick={() => setShowThemes(s => !s)}
            style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px",
              borderRadius:10, background: showThemes ? `${T.accent}20` : "transparent",
              border:`2px dashed ${T.sbBorder}`, cursor:"pointer",
              color:T.sbText, fontSize:13, marginBottom:6, width:"100%",
              fontFamily:"'Caveat',cursive", textAlign:"left" }}>
            <div style={{ width:14, height:14, borderRadius:"50%", background:T.accent, flexShrink:0 }}/>
            🎨 Change Theme {showThemes ? "▲" : "▼"}
          </button>

          {/* Theme picker */}
          {showThemes && (
            <div style={{ marginBottom:10, padding:"8px", background:"rgba(255,255,255,0.04)",
              borderRadius:10, border:`1px dashed ${T.sbBorder}` }}>
              <ThemePicker current={themeKey} onSelect={key => setThemeKey(key)} T={T}/>
            </div>
          )}

          {/* Chat history — always visible regardless of theme state */}
          <div style={{ flex:1, overflowY:"auto", overflowX:"hidden", marginBottom:8 }}>
            {chats.length > 0 ? (
              <>
                <div style={{ fontSize:10, color:T.sbSubText, letterSpacing:"0.12em",
                  marginBottom:6, paddingLeft:4 }}>RECENT CHATS</div>
                {chats.slice(0,30).map(chat => (
                  <SidebarChatItem key={chat.id} chat={chat}
                    isActive={activeId===chat.id}
                    onLoad={() => loadChat(chat)}
                    onRename={(id,t) => renameChat(id,t)}
                    onDelete={id => deleteChat(id)}
                    T={T}/>
                ))}
              </>
            ) : (
              <div style={{ fontSize:13, color:T.sbSubText, textAlign:"center", padding:"16px 0" }}>
                No chats yet.<br/>Start one! ✈️
              </div>
            )}
          </div>

          {/* User info */}
          <div style={{ borderTop:`2px dashed ${T.sbBorder}`, paddingTop:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <div style={{ width:32, height:32, borderRadius:"50%", flexShrink:0,
                background:T.accent, display:"flex", alignItems:"center",
                justifyContent:"center", fontSize:15, fontWeight:700,
                color:T.userText, border:`2px solid ${T.accentDark}` }}>
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div style={{ overflow:"hidden", flex:1 }}>
                <div style={{ fontSize:14, color:T.sbText, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {user.name || "Traveller"}
                </div>
                <div style={{ fontSize:10, color:T.sbSubText, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {user.email || ""}
                </div>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:5, marginBottom:8 }}>
              {[["🔍 Search","/search"],["👤 Profile","/profile"],["🏠 Home","/"],["🎫 Bookings","/bookings"]].map(([label,path]) => (
                <button key={path} onClick={() => navigate(path)}
                  style={{ padding:"7px 6px", borderRadius:8, fontSize:12, fontWeight:600,
                    cursor:"pointer", background:"rgba(255,255,255,0.05)",
                    color:T.sbSubText, border:`2px solid ${T.sbBorder}`,
                    fontFamily:"'Caveat',cursive" }}
                  onMouseEnter={e=>{e.currentTarget.style.background=`${T.accent}22`;e.currentTarget.style.color=T.sbText;}}
                  onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.05)";e.currentTarget.style.color=T.sbSubText;}}>
                  {label}
                </button>
              ))}
            </div>
            <button onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/login"); }}
              style={{ width:"100%", padding:"8px", borderRadius:8, fontSize:13, fontWeight:600,
                cursor:"pointer", background:"rgba(239,68,68,0.08)",
                color:"rgba(239,68,68,0.8)", border:"2px dashed rgba(239,68,68,0.3)",
                fontFamily:"'Caveat',cursive" }}>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* ══ MAIN AREA ════════════════════════════════════════════════════════ */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>

        {/* TOP BAR — sticky, always on screen */}
        <div style={{
          height:56, padding:"0 12px",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          borderBottom:`2px dashed ${T.border}`,
          flexShrink:0, background:T.navBg, backdropFilter:"blur(12px)",
          position:"sticky", top:0, zIndex:100,
          transition:"background 0.4s ease",
        }}>
          {/* LEFT: hamburger + title */}
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {/* HAMBURGER — always visible */}
            <button onClick={() => setSbOpen(s => !s)}
              style={{
                width:40, height:40, borderRadius:10, background:"transparent",
                border:`2px solid ${T.border}`, cursor:"pointer",
                display:"flex", flexDirection:"column",
                alignItems:"center", justifyContent:"center", gap:4,
                padding:"8px", flexShrink:0,
              }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width:"100%", height:2.5, background:T.inkColor, borderRadius:2 }}/>
              ))}
            </button>
            <div style={{ fontSize:15, fontWeight:700, color:T.aiText,
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
              maxWidth:"clamp(100px,30vw,300px)" }}>
              {empty ? "Alvryn AI ✈" : chatTitle}
            </div>
          </div>

          {/* RIGHT: home icon + live badge + new */}
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            {/* HOME / SEARCH ICON */}
            <button onClick={() => navigate("/search")}
              title="Go to Flight Search"
              style={{ width:38, height:38, borderRadius:10, background:`${T.accent}15`,
                border:`2px solid ${T.border}`, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:18, flexShrink:0 }}>
              🔍
            </button>

            <div style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 10px",
              borderRadius:20, border:`2px dashed ${T.accent}`, background:`${T.accent}10` }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e",
                animation:"shimmerPulse 2s infinite" }}/>
              <span style={{ fontFamily:"'Caveat',cursive", fontSize:11, color:T.accent }}>AI LIVE</span>
            </div>
            <button onClick={newChat}
              style={{ padding:"6px 14px", borderRadius:10, background:T.accent,
                border:`2px solid ${T.accentDark}`, color:T.userText, fontSize:13,
                fontWeight:700, cursor:"pointer", fontFamily:"'Caveat',cursive",
                boxShadow:`2px 2px 0 ${T.accentDark}` }}>
              + New
            </button>
          </div>
        </div>

        {/* MESSAGES AREA */}
        <div style={{ flex:1, overflowY:"auto", WebkitOverflowScrolling:"touch",
          padding:"clamp(10px,2vw,18px) clamp(8px,2vw,14px)",
          background:T.msgArea, minHeight:0,
          transition:"background 0.4s ease" }}>
          <div style={{ maxWidth:700, margin:"0 auto" }}>

            {/* EMPTY STATE */}
            {empty && (
              <div style={{ textAlign:"center", paddingTop:"clamp(20px,5vh,50px)", animation:"fadeUp 0.5s both" }}>
                <div style={{ fontSize:52, marginBottom:14, animation:"wobble 3s ease-in-out infinite" }}>✈️</div>
                <h1 style={{ fontFamily:"'Caveat',cursive", fontWeight:700,
                  fontSize:"clamp(26px,6vw,50px)", color:T.aiText,
                  marginBottom:8, lineHeight:1.1 }}>
                  Where do you want to go?
                </h1>
                <p style={{ fontFamily:"'Caveat',cursive", fontSize:"clamp(13px,3vw,17px)",
                  color:T.aiText, opacity:0.7, marginBottom:20, lineHeight:1.6 }}>
                  Flights · Buses · Hotels · Trains · Trip planning<br/>
                  <span style={{ fontSize:"clamp(11px,2vw,13px)", opacity:0.5 }}>
                    Any language. Any city. Typos? No problem 😄
                  </span>
                </p>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(clamp(130px,36vw,230px),1fr))",
                  gap:9, maxWidth:580, margin:"0 auto", padding:"0 8px" }}>
                  {[
                    "✈️ Cheapest flight Bangalore to Delhi tomorrow",
                    "🚌 Bus Chennai to Hyderabad tonight",
                    "🏨 Hotels in Goa under ₹2000",
                    "🚂 Train Delhi to Mumbai this weekend",
                    "🗺️ Plan 2-day trip from Bangalore",
                    "🌍 Flights to Dubai next month",
                    "⚡ Fastest way Bangalore to Mumbai",
                    "🏖️ Honeymoon destination Europe",
                  ].map((s,i) => (
                    <button key={i} onClick={() => send(s)}
                      style={{
                        padding:"10px 13px", borderRadius:14,
                        background:T.aiBubble, border:`2px solid ${T.border}`,
                        color:T.aiText, fontFamily:"'Caveat',cursive",
                        fontSize:"clamp(12px,2.6vw,14px)", cursor:"pointer",
                        textAlign:"left", lineHeight:1.4,
                        boxShadow:`2px 2px 0 ${T.border}`,
                        transition:"transform 0.15s, box-shadow 0.15s",
                        animation:`sketchIn 0.35s ${i*45}ms both`,
                      }}
                      onMouseEnter={e=>{e.currentTarget.style.transform="translate(-2px,-2px) rotate(-1deg)";e.currentTarget.style.boxShadow=`4px 4px 0 ${T.border}`;}}
                      onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow=`2px 2px 0 ${T.border}`;}}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* MESSAGES */}
            {messages.map(m => (
              <div key={m.id}>
                {m.role === "user" ? (
                  <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16, animation:"sketchIn 0.22s both" }}>
                    <div style={{
                      maxWidth:"72%", padding:"11px 16px",
                      borderRadius:"18px 18px 4px 18px",
                      background:T.userBubble, border:`2px solid ${T.accentDark}`,
                      boxShadow:`3px 3px 0 ${T.accentDark}`,
                      fontFamily:"'Caveat',cursive",
                      fontSize:"clamp(14px,3vw,17px)",
                      color:T.userText, fontWeight:600, lineHeight:1.6,
                    }}>
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div style={{ display:"flex", gap:9, marginBottom:22, animation:"fadeUp 0.28s both" }}>
                    <div style={{
                      flexShrink:0, width:34, height:34, borderRadius:"50%",
                      background:T.userBubble, border:`2px solid ${T.accentDark}`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      marginTop:4, boxShadow:`2px 2px 0 ${T.accentDark}`,
                    }}>
                      <AlvrynLogo size={20} color={T.userText}/>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      {/* Section progress bar */}
                      {m.sectionNum && m.totalSections && (
                        <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:10 }}>
                          {Array.from({length:m.totalSections},(_,i) => (
                            <div key={i} style={{ flex:1, height:4, borderRadius:3,
                              background: i < m.sectionNum ? `linear-gradient(90deg,${T.accent},${T.accentDark})` : `${T.border}60` }}/>
                          ))}
                          <span style={{ fontSize:10, color:T.accent, fontFamily:"'Caveat',cursive", marginLeft:4, whiteSpace:"nowrap" }}>
                            {m.sectionNum}/{m.totalSections}
                          </span>
                        </div>
                      )}

                      {m.text && (
                        <div style={{
                          background:T.aiBubble, border:`2px solid ${T.border}`,
                          borderRadius:"4px 18px 18px 18px",
                          padding:"13px 16px", marginBottom: m.cards?.length ? 11 : 0,
                          boxShadow:`3px 3px 0 ${T.border}`,
                          fontFamily:"'Caveat',cursive",
                          fontSize:"clamp(14px,3vw,17px)",
                          color:T.aiText, lineHeight:1.75,
                        }}>
                          {m._shimmerDone === false ? (
                            <ShimmerText text={m.text} themeKey={themeKey}
                              onDone={() => setMessages(prev =>
                                prev.map(msg => msg.id===m.id ? {...msg, _shimmerDone:true} : msg)
                              )}/>
                          ) : (
                            <span style={{ whiteSpace:"pre-wrap" }}>{m.text}</span>
                          )}
                        </div>
                      )}

                      {/* Cards */}
                      {m.cards?.filter(c=>c.type==="flight").map((c,i) => <FlightCard key={i} f={c} themeKey={themeKey}/>)}
                      {m.cards?.filter(c=>c.type==="bus").map((c,i) => <BusCard key={i} b={c} themeKey={themeKey}/>)}
                      {m.cards?.filter(c=>c.type==="hotel").map((c,i) => <HotelCard key={i} h={c} themeKey={themeKey}/>)}
                      {m.cards?.filter(c=>c.type==="train").map((c,i) => <TrainCard key={i} t={c} themeKey={themeKey}/>)}

                      {m.cards?.length > 0 && (
                        <div style={{ fontFamily:"'Caveat',cursive", fontSize:11,
                          color:T.aiText, opacity:0.4, marginTop:4 }}>
                          Prices are approximate. Tap to check live availability.
                        </div>
                      )}

                      {m.cta && (
                        <div style={{ marginTop:10, padding:"9px 13px", borderRadius:10,
                          border:`2px dashed ${T.border}`, fontFamily:"'Caveat',cursive",
                          fontSize:14, color:T.accent, fontStyle:"italic",
                          background:`${T.accent}08` }}>
                          {m.cta}
                        </div>
                      )}

                      {m.quickReplies?.length > 0 && (
                        <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginTop:10 }}>
                          {m.quickReplies.map((r,i) => (
                            <button key={i} onClick={() => send(r)}
                              style={{
                                padding:"7px 13px", borderRadius:20,
                                background:T.aiBubble, border:`2px solid ${T.border}`,
                                color:T.accent, fontFamily:"'Caveat',cursive",
                                fontSize:13, fontWeight:600, cursor:"pointer",
                                boxShadow:`2px 2px 0 ${T.border}`,
                              }}
                              onMouseEnter={e=>{e.currentTarget.style.transform="translate(-1px,-1px)";e.currentTarget.style.boxShadow=`3px 3px 0 ${T.border}`;}}
                              onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow=`2px 2px 0 ${T.border}`;}}>
                              {r}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* THINKING — Globe animation */}
            {thinking && (
              <div style={{ display:"flex", gap:9, marginBottom:18, animation:"fadeUp 0.28s both" }}>
                <div style={{ flexShrink:0, width:34, height:34, borderRadius:"50%",
                  background:T.userBubble, border:`2px solid ${T.accentDark}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  marginTop:4, boxShadow:`2px 2px 0 ${T.accentDark}` }}>
                  <AlvrynLogo size={20} color={T.userText}/>
                </div>
                <div style={{ background:T.aiBubble, border:`2px solid ${T.border}`,
                  borderRadius:"4px 18px 18px 18px",
                  boxShadow:`3px 3px 0 ${T.border}`, minWidth:200 }}>
                  <HolographicGlobe themeKey={themeKey} query={thinkQuery}/>
                </div>
              </div>
            )}

            <div ref={bottomRef}/>
          </div>
        </div>

        {/* INPUT AREA — sticky at bottom */}
        <div style={{
          padding:"10px 12px 14px",
          borderTop:`2px dashed ${T.border}`,
          flexShrink:0, background:T.navBg, backdropFilter:"blur(12px)",
          transition:"background 0.4s ease",
        }}>
          <div style={{ maxWidth:700, margin:"0 auto" }}>
            <div style={{
              display:"flex", alignItems:"flex-end", gap:9,
              background:T.inputBg, borderRadius:16, padding:"9px 12px",
              border:`2px solid ${T.border}`, boxShadow:`3px 3px 0 ${T.border}`,
            }}>
              <textarea
                ref={el => { inputRef.current=el; textareaRef.current=el; }}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKey}
                placeholder="Ask anything... ✈"
                rows={1}
                style={{
                  flex:1, background:"transparent", border:"none", outline:"none",
                  fontFamily:"'Caveat',cursive",
                  fontSize:"clamp(14px,3vw,17px)",
                  color:T.inputText, resize:"none", lineHeight:1.6,
                  maxHeight:130, overflowY:"auto", paddingTop:2,
                }}
              />
              <button onClick={() => send()} disabled={!input.trim() || loading}
                style={{
                  flexShrink:0, width:38, height:38, borderRadius:12,
                  background: input.trim() && !loading ? T.accent : "rgba(128,128,128,0.18)",
                  border:`2px solid ${input.trim()&&!loading ? T.accentDark : "transparent"}`,
                  cursor: input.trim() && !loading ? "pointer" : "default",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:18, transition:"all 0.18s",
                  boxShadow: input.trim()&&!loading ? `2px 2px 0 ${T.accentDark}` : "none",
                  color: input.trim()&&!loading ? T.userText : "rgba(128,128,128,0.4)",
                }}>
                {loading
                  ? <div style={{ width:15, height:15, border:"2.5px solid rgba(255,255,255,0.25)",
                      borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
                  : "↑"}
              </button>
            </div>
            {/* Disclaimer */}
            <div style={{ textAlign:"center", marginTop:5,
              fontFamily:"'Caveat',cursive", fontSize:11,
              color:T.aiText, opacity:0.38 }}>
              Alvryn AI can make mistakes, so please double-check the responses.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}