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
  "maldives":"MLE","male":"MLE",
};
const INDIA_IATA = new Set(["BLR","BOM","DEL","MAA","HYD","CCU","GOI","PNQ","COK","AMD",
  "JAI","LKO","VNS","TRV","CBE","IXM","IXE","MYQ","VTZ","IXL","IXZ","NAG"]);

function flink(from, to, ddmm="", pax=1) {
  const fc = IATA[from?.toLowerCase()] || from?.slice(0,3).toUpperCase() || "BLR";
  const tc = IATA[to?.toLowerCase()]   || to?.slice(0,3).toUpperCase()   || "BOM";
  const base = (INDIA_IATA.has(fc)&&INDIA_IATA.has(tc))
    ? "https://www.aviasales.in" : "https://www.aviasales.com";
  return `${base}/search/${fc}${ddmm}${tc}${pax}?marker=714667&sub_id=alvryn_ai`;
}

// ── THEMES ────────────────────────────────────────────────────────────────────
const THEMES = {
  gold: {
    name:"⭐ Alvryn Gold",
    bg:"#faf6ee", msgArea:"#f3ecda",
    sidebar:"#1a1205", navBg:"rgba(250,246,238,0.97)",
    userBubble:"linear-gradient(135deg,#c9a84c,#e8c06a)", userText:"#1a1008",
    aiBubble:"#ffffff", aiText:"#1a1205",
    border:"rgba(201,168,76,0.25)", cardBorder:"rgba(201,168,76,0.3)",
    inputBg:"rgba(255,255,255,0.92)", inputText:"#1a1205",
    sbText:"#f0e6cc", sbSubText:"#b8964a", sbBorder:"rgba(201,168,76,0.2)",
    accent:"#c9a84c", accentDark:"#8B6914", accentSoft:"rgba(201,168,76,0.12)",
    globeColor:"#c9a84c", globeGlow:"rgba(201,168,76,0.35)", inkColor:"#8B6914",
    shadow:"0 4px 24px rgba(201,168,76,0.15)", cardShadow:"0 2px 16px rgba(0,0,0,0.06)",
    divider:"rgba(201,168,76,0.15)",
  },
  avengers: {
    name:"🌌 Avengers",
    bg:"#080d1a", msgArea:"#060b16",
    sidebar:"#040810", navBg:"rgba(8,13,26,0.97)",
    userBubble:"linear-gradient(135deg,#8b0000,#cc1a1a)", userText:"#fff",
    aiBubble:"#0f172a", aiText:"#c8d8f0",
    border:"rgba(74,144,217,0.2)", cardBorder:"rgba(74,144,217,0.25)",
    inputBg:"rgba(15,23,42,0.9)", inputText:"#c8d8f0",
    sbText:"#b8ccf0", sbSubText:"#5070a0", sbBorder:"rgba(74,144,217,0.2)",
    accent:"#4a90d9", accentDark:"#2a60a9", accentSoft:"rgba(74,144,217,0.1)",
    globeColor:"#4a90d9", globeGlow:"rgba(74,144,217,0.4)", inkColor:"#6aaaf0",
    shadow:"0 4px 24px rgba(74,144,217,0.12)", cardShadow:"0 2px 16px rgba(0,0,0,0.3)",
    divider:"rgba(74,144,217,0.12)",
  },
  f1: {
    name:"🏎️ F1 Racing",
    bg:"#0a0a0a", msgArea:"#080808",
    sidebar:"#050505", navBg:"rgba(10,10,10,0.97)",
    userBubble:"linear-gradient(135deg,#cc0000,#ff2222)", userText:"#fff",
    aiBubble:"#141414", aiText:"#eeeeee",
    border:"rgba(204,0,0,0.25)", cardBorder:"rgba(204,0,0,0.3)",
    inputBg:"rgba(20,20,20,0.9)", inputText:"#eee",
    sbText:"#eeeeee", sbSubText:"#888", sbBorder:"rgba(204,0,0,0.2)",
    accent:"#cc0000", accentDark:"#990000", accentSoft:"rgba(204,0,0,0.1)",
    globeColor:"#cc0000", globeGlow:"rgba(204,0,0,0.4)", inkColor:"#ff4444",
    shadow:"0 4px 24px rgba(204,0,0,0.12)", cardShadow:"0 2px 16px rgba(0,0,0,0.4)",
    divider:"rgba(204,0,0,0.12)",
  },
  wwe: {
    name:"🤼 WWE",
    bg:"#0a0a0a", msgArea:"#080808",
    sidebar:"#050505", navBg:"rgba(10,10,10,0.97)",
    userBubble:"linear-gradient(135deg,#c9a84c,#f0d060)", userText:"#0a0a0a",
    aiBubble:"#161616", aiText:"#f0d060",
    border:"rgba(201,168,76,0.25)", cardBorder:"rgba(201,168,76,0.3)",
    inputBg:"rgba(22,22,22,0.9)", inputText:"#f0d060",
    sbText:"#f0d060", sbSubText:"#a08030", sbBorder:"rgba(201,168,76,0.2)",
    accent:"#c9a84c", accentDark:"#8B6914", accentSoft:"rgba(201,168,76,0.1)",
    globeColor:"#f0d060", globeGlow:"rgba(240,208,96,0.4)", inkColor:"#f0d060",
    shadow:"0 4px 24px rgba(201,168,76,0.12)", cardShadow:"0 2px 16px rgba(0,0,0,0.4)",
    divider:"rgba(201,168,76,0.12)",
  },
  cricket: {
    name:"🏏 Cricket",
    bg:"#f4fff7", msgArea:"#eafaf0",
    sidebar:"#0d2b1a", navBg:"rgba(244,255,247,0.97)",
    userBubble:"linear-gradient(135deg,#1e5c38,#2d8a56)", userText:"#fff",
    aiBubble:"#ffffff", aiText:"#0d2b1a",
    border:"rgba(45,106,79,0.2)", cardBorder:"rgba(45,106,79,0.25)",
    inputBg:"rgba(255,255,255,0.9)", inputText:"#0d2b1a",
    sbText:"#c0ecd0", sbSubText:"#5aaa80", sbBorder:"rgba(45,106,79,0.2)",
    accent:"#2d6a4f", accentDark:"#1b4332", accentSoft:"rgba(45,106,79,0.08)",
    globeColor:"#2d6a4f", globeGlow:"rgba(45,106,79,0.35)", inkColor:"#1b4332",
    shadow:"0 4px 24px rgba(45,106,79,0.12)", cardShadow:"0 2px 16px rgba(0,0,0,0.05)",
    divider:"rgba(45,106,79,0.1)",
  },
  football: {
    name:"⚽ Football",
    bg:"#f4fff4", msgArea:"#eafaea",
    sidebar:"#062006", navBg:"rgba(244,255,244,0.97)",
    userBubble:"linear-gradient(135deg,#1a5c1a,#2d8b2d)", userText:"#fff",
    aiBubble:"#ffffff", aiText:"#062006",
    border:"rgba(0,100,0,0.2)", cardBorder:"rgba(0,100,0,0.25)",
    inputBg:"rgba(255,255,255,0.9)", inputText:"#062006",
    sbText:"#aaffaa", sbSubText:"#55aa55", sbBorder:"rgba(0,100,0,0.2)",
    accent:"#006400", accentDark:"#004000", accentSoft:"rgba(0,100,0,0.08)",
    globeColor:"#228b22", globeGlow:"rgba(34,139,34,0.35)", inkColor:"#006400",
    shadow:"0 4px 24px rgba(0,100,0,0.1)", cardShadow:"0 2px 16px rgba(0,0,0,0.05)",
    divider:"rgba(0,100,0,0.1)",
  },
  sakura: {
    name:"🌸 Sakura",
    bg:"#fff5f8", msgArea:"#ffe8f0",
    sidebar:"#3a0018", navBg:"rgba(255,245,248,0.97)",
    userBubble:"linear-gradient(135deg,#c0005a,#e8308a)", userText:"#fff",
    aiBubble:"#ffffff", aiText:"#3a0018",
    border:"rgba(233,30,140,0.2)", cardBorder:"rgba(233,30,140,0.25)",
    inputBg:"rgba(255,255,255,0.9)", inputText:"#3a0018",
    sbText:"#ffc0dc", sbSubText:"#c07090", sbBorder:"rgba(233,30,140,0.2)",
    accent:"#e91e8c", accentDark:"#c0006a", accentSoft:"rgba(233,30,140,0.08)",
    globeColor:"#e91e8c", globeGlow:"rgba(233,30,140,0.35)", inkColor:"#c0006a",
    shadow:"0 4px 24px rgba(233,30,140,0.12)", cardShadow:"0 2px 16px rgba(0,0,0,0.05)",
    divider:"rgba(233,30,140,0.1)",
  },
  nature: {
    name:"🌿 Nature",
    bg:"#f4f9ee", msgArea:"#e8f4e0",
    sidebar:"#122012", navBg:"rgba(244,249,238,0.97)",
    userBubble:"linear-gradient(135deg,#2d5a1e,#4a8a30)", userText:"#fff",
    aiBubble:"#ffffff", aiText:"#122012",
    border:"rgba(74,124,63,0.2)", cardBorder:"rgba(74,124,63,0.25)",
    inputBg:"rgba(255,255,255,0.9)", inputText:"#122012",
    sbText:"#c8e8b8", sbSubText:"#70aa58", sbBorder:"rgba(74,124,63,0.2)",
    accent:"#4a7c3f", accentDark:"#2d5a24", accentSoft:"rgba(74,124,63,0.08)",
    globeColor:"#4a7c3f", globeGlow:"rgba(74,124,63,0.35)", inkColor:"#2d5a24",
    shadow:"0 4px 24px rgba(74,124,63,0.1)", cardShadow:"0 2px 16px rgba(0,0,0,0.05)",
    divider:"rgba(74,124,63,0.1)",
  },
  sunset: {
    name:"🌅 Sunset",
    bg:"#fff8f2", msgArea:"#ffeede",
    sidebar:"#2a0e00", navBg:"rgba(255,248,242,0.97)",
    userBubble:"linear-gradient(135deg,#c44a00,#f07020)", userText:"#fff",
    aiBubble:"#ffffff", aiText:"#2a0e00",
    border:"rgba(230,92,0,0.2)", cardBorder:"rgba(230,92,0,0.25)",
    inputBg:"rgba(255,255,255,0.9)", inputText:"#2a0e00",
    sbText:"#ffc898", sbSubText:"#b06030", sbBorder:"rgba(230,92,0,0.2)",
    accent:"#e65c00", accentDark:"#b03800", accentSoft:"rgba(230,92,0,0.08)",
    globeColor:"#e65c00", globeGlow:"rgba(230,92,0,0.4)", inkColor:"#b03800",
    shadow:"0 4px 24px rgba(230,92,0,0.12)", cardShadow:"0 2px 16px rgba(0,0,0,0.05)",
    divider:"rgba(230,92,0,0.1)",
  },
  royalblue: {
    name:"👑 Royal Blue",
    bg:"#f0f4ff", msgArea:"#e4ecff",
    sidebar:"#08124a", navBg:"rgba(240,244,255,0.97)",
    userBubble:"linear-gradient(135deg,#0f2acc,#2244ff)", userText:"#fff",
    aiBubble:"#ffffff", aiText:"#08124a",
    border:"rgba(26,58,204,0.2)", cardBorder:"rgba(26,58,204,0.25)",
    inputBg:"rgba(255,255,255,0.9)", inputText:"#08124a",
    sbText:"#b0c4ff", sbSubText:"#6080cc", sbBorder:"rgba(26,58,204,0.2)",
    accent:"#1a3acc", accentDark:"#0a1a8c", accentSoft:"rgba(26,58,204,0.08)",
    globeColor:"#4466ff", globeGlow:"rgba(68,102,255,0.4)", inkColor:"#1a3acc",
    shadow:"0 4px 24px rgba(26,58,204,0.12)", cardShadow:"0 2px 16px rgba(0,0,0,0.05)",
    divider:"rgba(26,58,204,0.1)",
  },
  galaxy: {
    name:"🌌 Galaxy",
    bg:"#06080f", msgArea:"#080c18",
    sidebar:"#030408", navBg:"rgba(6,8,15,0.97)",
    userBubble:"linear-gradient(135deg,#5500cc,#8833ff)", userText:"#fff",
    aiBubble:"#0e1428", aiText:"#c0a8ff",
    border:"rgba(136,68,255,0.2)", cardBorder:"rgba(136,68,255,0.25)",
    inputBg:"rgba(14,20,40,0.9)", inputText:"#c0a8ff",
    sbText:"#b8a0ff", sbSubText:"#6644aa", sbBorder:"rgba(136,68,255,0.2)",
    accent:"#8844ff", accentDark:"#5522cc", accentSoft:"rgba(136,68,255,0.1)",
    globeColor:"#aa66ff", globeGlow:"rgba(170,102,255,0.4)", inkColor:"#aa88ff",
    shadow:"0 4px 24px rgba(136,68,255,0.15)", cardShadow:"0 2px 16px rgba(0,0,0,0.4)",
    divider:"rgba(136,68,255,0.12)",
  },
  rosegold: {
    name:"🌹 Rose Gold",
    bg:"#fff8f8", msgArea:"#ffeeee",
    sidebar:"#380815", navBg:"rgba(255,248,248,0.97)",
    userBubble:"linear-gradient(135deg,#a03050,#d05080)", userText:"#fff",
    aiBubble:"#ffffff", aiText:"#380815",
    border:"rgba(192,73,106,0.2)", cardBorder:"rgba(192,73,106,0.25)",
    inputBg:"rgba(255,255,255,0.9)", inputText:"#380815",
    sbText:"#ffc0c8", sbSubText:"#b07080", sbBorder:"rgba(192,73,106,0.2)",
    accent:"#c0496a", accentDark:"#8a2040", accentSoft:"rgba(192,73,106,0.08)",
    globeColor:"#c0496a", globeGlow:"rgba(192,73,106,0.35)", inkColor:"#8a2040",
    shadow:"0 4px 24px rgba(192,73,106,0.12)", cardShadow:"0 2px 16px rgba(0,0,0,0.05)",
    divider:"rgba(192,73,106,0.1)",
  },
};

// ── SOUND ─────────────────────────────────────────────────────────────────────
function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    if (type === "send") {
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime+0.1);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.15);
      osc.start(); osc.stop(ctx.currentTime+0.15);
    } else if (type === "receive") {
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime+0.08);
      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.2);
      osc.start(); osc.stop(ctx.currentTime+0.2);
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
  { name:"Maldives",  x:62, y:60, label:"🏝" },
  { name:"Goa",       x:60, y:54, label:"🌴" },
];

// ── HOLOGRAPHIC GLOBE ─────────────────────────────────────────────────────────
function HolographicGlobe({ themeKey, query }) {
  const T = THEMES[themeKey];
  const [tick, setTick] = useState(0);
  const [activeCities, setActiveCities] = useState([]);
  const rafRef = useRef(null);
  const lastRef = useRef(0);

  useEffect(() => {
    let alive = true;
    const loop = ts => {
      if (!alive) return;
      if (ts - lastRef.current > 60) { lastRef.current = ts; setTick(t => t+1); }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { alive = false; cancelAnimationFrame(rafRef.current); };
  }, []);

  useEffect(() => {
    if (!query) { setActiveCities([]); return; }
    const q = query.toLowerCase();
    const m = GLOBE_CITIES.filter(c =>
      q.includes(c.name.toLowerCase()) ||
      (q.includes("europe") && ["Paris","London"].includes(c.name)) ||
      (q.includes("honeymoon") && ["Paris","Singapore","Bangkok","Maldives"].includes(c.name)) ||
      (q.includes("india") && ["Bangalore","Mumbai","Goa"].includes(c.name)) ||
      (q.includes("asia") && ["Singapore","Bangkok","Tokyo"].includes(c.name)) ||
      (q.includes("beach") && ["Goa","Maldives","Bali"].includes(c.name)) ||
      (q.includes("middle east") && ["Dubai"].includes(c.name))
    ).map(c => c.name);
    setActiveCities(m.length ? m : GLOBE_CITIES.slice(0,3).map(c => c.name));
  }, [query]);

  const SZ=180, cx=SZ/2, cy=SZ/2, r=72;
  const meridians = Array.from({length:8},(_,i)=>{
    const a=(i/8)*180+tick*0.3, rad=(a*Math.PI)/180;
    return { x1:cx+r*Math.cos(rad), y1:cy-r, x2:cx-r*Math.cos(rad), y2:cy+r, op:0.1+0.08*Math.abs(Math.cos(rad)) };
  });
  const parallels = Array.from({length:5},(_,i)=>{
    const y=cy-r+(i+1)*(r*2/6), rr=Math.sqrt(Math.max(0,r*r-(y-cy)*(y-cy)));
    return { cy:y, rx:rr, ry:rr*0.3 };
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"16px 12px" }}>
      <svg width={SZ} height={SZ} viewBox={`0 0 ${SZ} ${SZ}`}
        style={{ filter:`drop-shadow(0 0 20px ${T.globeGlow})` }}>
        <defs>
          <radialGradient id={`gG_${themeKey}`} cx="40%" cy="35%">
            <stop offset="0%" stopColor={T.globeColor} stopOpacity="0.22"/>
            <stop offset="100%" stopColor={T.globeColor} stopOpacity="0.02"/>
          </radialGradient>
          <clipPath id={`gC_${themeKey}`}><circle cx={cx} cy={cy} r={r}/></clipPath>
        </defs>
        <circle cx={cx} cy={cy} r={r+16} fill={T.globeColor} fillOpacity="0.04"/>
        <circle cx={cx} cy={cy} r={r} fill={`url(#gG_${themeKey})`} stroke={T.globeColor} strokeWidth="0.8" strokeOpacity="0.3"/>
        <g clipPath={`url(#gC_${themeKey})`}>
          {meridians.map((m,i)=><line key={i} x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} stroke={T.globeColor} strokeWidth="0.4" strokeOpacity={m.op}/>)}
          {parallels.map((p,i)=><ellipse key={i} cx={cx} cy={p.cy} rx={p.rx} ry={p.ry} fill="none" stroke={T.globeColor} strokeWidth="0.4" strokeOpacity="0.15"/>)}
        </g>
        {activeCities.length>=2 && activeCities.slice(0,3).map((cn,i)=>{
          const c1=GLOBE_CITIES.find(c=>c.name===cn);
          const c2=GLOBE_CITIES.find(c=>c.name===activeCities[(i+1)%activeCities.length]);
          if(!c1||!c2) return null;
          const x1=(c1.x/100)*SZ, y1=(c1.y/100)*SZ, x2=(c2.x/100)*SZ, y2=(c2.y/100)*SZ;
          return <path key={i} d={`M ${x1} ${y1} Q ${(x1+x2)/2} ${Math.min(y1,y2)-26} ${x2} ${y2}`}
            fill="none" stroke={T.globeColor} strokeWidth="1" strokeOpacity="0.55"
            strokeDasharray="4 3" strokeDashoffset={-(tick*0.6)%28}/>;
        })}
        {GLOBE_CITIES.map((city,i)=>{
          const px=(city.x/100)*SZ, py=(city.y/100)*SZ;
          const isActive=activeCities.includes(city.name);
          const pulse=isActive?0.5+0.5*Math.sin(tick*0.08+i):0;
          return (
            <g key={city.name}>
              {isActive&&<circle cx={px} cy={py} r={6+pulse*4} fill={T.globeColor} fillOpacity={0.12*pulse}/>}
              <circle cx={px} cy={py} r={isActive?3:1.8} fill={T.globeColor} fillOpacity={isActive?0.9:0.3}/>
              {isActive&&<text x={px+5} y={py-4} fontSize="8" fill={T.globeColor} fillOpacity="0.85">{city.label}</text>}
            </g>
          );
        })}
        <circle cx={cx-r*0.28} cy={cy-r*0.28} r={r*0.1} fill="white" fillOpacity="0.05"/>
      </svg>
      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.globeColor,
        marginTop:6, letterSpacing:"0.06em",
        animation:"globePulse 1.4s ease-in-out infinite" }}>
        {activeCities.length>0 ? `✈ ${activeCities.slice(0,2).join(" → ")}` : "Searching the world..."}
      </div>
    </div>
  );
}

// ── ELEGANT FADE-IN TEXT ──────────────────────────────────────────────────────
function ElegantText({ text, themeKey, onDone }) {
  const T = THEMES[themeKey];
  const [visible, setVisible] = useState(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; });

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => {
      setVisible(true);
      if (onDoneRef.current) setTimeout(() => onDoneRef.current(), 600);
    }, 80);
    return () => clearTimeout(t);
  }, [text]);

  const formatText = (raw) => {
    if (!raw) return null;
    const parts = raw.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} style={{ fontWeight:700, color:T.accent }}>{part.slice(2,-2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(6px)",
      transition: "opacity 0.5s cubic-bezier(0.4,0,0.2,1), transform 0.5s cubic-bezier(0.4,0,0.2,1)",
      whiteSpace: "pre-wrap", lineHeight: 1.85,
    }}>
      {formatText(text)}
    </div>
  );
}

// ── PRICE ALERT BUTTON ────────────────────────────────────────────────────────
function PriceAlertBtn({ from, to, currentPrice, T }) {
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");
  const click = async () => {
    if (!token) { alert("Please sign in"); return; }
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
  if (done) return <span style={{fontSize:11,color:"#16a34a",fontFamily:"'DM Sans',sans-serif"}}>🔔 Alert set!</span>;
  return (
    <button onClick={click} disabled={loading}
      style={{ padding:"5px 14px", borderRadius:20, fontSize:12, fontWeight:500,
        cursor:"pointer", background:"transparent",
        border:`1px solid ${T.accent}66`, color:T.accent,
        fontFamily:"'DM Sans',sans-serif", transition:"all 0.2s" }}>
      🔔 {loading ? "..." : "Track Price"}
    </button>
  );
}

// ── TRAVEL CARD BASE ──────────────────────────────────────────────────────────
function TravelCard({ children, T, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: T.aiBubble,
        border: `1px solid ${T.cardBorder}`,
        borderRadius: 16,
        padding: "18px 20px", marginBottom: 12,
        cursor: "pointer",
        boxShadow: hovered ? `0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px ${T.accent}44` : T.cardShadow,
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition: "all 0.22s cubic-bezier(0.4,0,0.2,1)",
        position: "relative", overflow: "hidden",
      }}>
      <div style={{ position:"absolute", left:0, top:0, bottom:0, width:3, background:`linear-gradient(180deg,${T.accent},${T.accentDark})`, borderRadius:"3px 0 0 3px" }}/>
      <div style={{ paddingLeft:10 }}>{children}</div>
    </div>
  );
}

function FlightCard({ f, themeKey }) {
  const T = THEMES[themeKey];
  return (
    <TravelCard T={T} onClick={() => window.open(f.link,"_blank","noopener")}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
        <div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:600, fontSize:18, color:T.aiText }}>
            {f.airline || "Multiple Airlines"}
          </div>
          {f.insight && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.accent, marginTop:2, opacity:0.85 }}>💡 {f.insight}</div>}
        </div>
        {f.label && <span style={{ padding:"3px 12px", borderRadius:20, fontSize:11, background:T.accentSoft, color:T.accent, fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>{f.label}</span>}
      </div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:28, color:T.aiText, lineHeight:1 }}>{f.departure || "—"}</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.accent, marginTop:3, letterSpacing:"0.08em" }}>{f.fromCode}</div>
        </div>
        <div style={{ flex:1, textAlign:"center", padding:"0 16px" }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.aiText, opacity:0.5, marginBottom:6 }}>{f.duration || "Direct"}</div>
          <div style={{ position:"relative", height:1, background:T.divider }}>
            <div style={{ position:"absolute", top:-4, left:"50%", transform:"translateX(-50%)", fontSize:14, color:T.accent }}>✈</div>
            <div style={{ position:"absolute", right:0, top:-3, width:6, height:6, borderRadius:"50%", background:T.accent }}/>
            <div style={{ position:"absolute", left:0, top:-3, width:6, height:6, borderRadius:"50%", background:T.accent }}/>
          </div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.accent, marginTop:6, letterSpacing:"0.06em" }}>NON-STOP</div>
        </div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:28, color:T.aiText, lineHeight:1 }}>{f.arrival || "—"}</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.accent, marginTop:3, letterSpacing:"0.08em" }}>{f.toCode}</div>
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:14, borderTop:`1px solid ${T.divider}` }}>
        <div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.aiText, opacity:0.45, letterSpacing:"0.08em", marginBottom:2 }}>APPROX FROM</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:26, color:T.accent, lineHeight:1 }}>
            {f.price ? `₹${f.price.toLocaleString()}` : "Live rates"}
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8, alignItems:"flex-end" }}>
          <button style={{ padding:"10px 22px", borderRadius:12, background:`linear-gradient(135deg,${T.accent},${T.accentDark})`, color:"#fff", border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, boxShadow:`0 4px 14px ${T.globeGlow}` }}>
            Check Live Price →
          </button>
          {f.from && f.to && <PriceAlertBtn from={f.from} to={f.to} currentPrice={f.price} T={T}/>}
        </div>
      </div>
    </TravelCard>
  );
}

function BusCard({ b, themeKey }) {
  const T = THEMES[themeKey];
  return (
    <TravelCard T={T} onClick={() => window.open(b.link,"_blank","noopener")}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:600, fontSize:18, color:T.aiText }}>{b.operator}</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.aiText, opacity:0.55, marginTop:2 }}>{b.type || b.busType}</div>
        </div>
        {b.label && <span style={{ padding:"3px 12px", borderRadius:20, fontSize:11, background:T.accentSoft, color:T.accent, fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>{b.label}</span>}
      </div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:24, color:T.aiText }}>{b.departure}</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.accent, marginTop:2 }}>{b.from}</div>
        </div>
        <div style={{ flex:1, padding:"0 16px" }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.aiText, opacity:0.5, textAlign:"center", marginBottom:4 }}>{b.duration||"Direct"}</div>
          <div style={{ height:1, background:T.divider, position:"relative" }}>
            <div style={{ position:"absolute", top:-6, left:"50%", transform:"translateX(-50%)", fontSize:14 }}>🚌</div>
          </div>
        </div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:24, color:T.aiText }}>{b.arrival}</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.accent, marginTop:2 }}>{b.to}</div>
        </div>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:12, borderTop:`1px solid ${T.divider}` }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:24, color:T.accent }}>
          {b.price ? `₹${b.price.toLocaleString()}` : "Live"}
        </div>
        <button style={{ padding:"10px 22px", borderRadius:12, background:`linear-gradient(135deg,${T.accent},${T.accentDark})`, color:"#fff", border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, boxShadow:`0 4px 14px ${T.globeGlow}` }}>
          View Options →
        </button>
      </div>
    </TravelCard>
  );
}

function HotelCard({ h, themeKey }) {
  const T = THEMES[themeKey];
  return (
    <TravelCard T={T} onClick={() => window.open(h.link,"_blank","noopener")}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
        <div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:600, fontSize:18, color:T.aiText }}>Hotels in {h.city}</div>
          {h.insight && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.accent, marginTop:2, opacity:0.85 }}>💡 {h.insight}</div>}
        </div>
        {h.label && <span style={{ padding:"3px 12px", borderRadius:20, fontSize:11, background:T.accentSoft, color:T.accent, fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>{h.label}</span>}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:12, borderTop:`1px solid ${T.divider}` }}>
        <div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:T.aiText, opacity:0.45, letterSpacing:"0.08em" }}>PER NIGHT FROM</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:24, color:T.accent }}>₹{h.priceRange}</div>
        </div>
        <button style={{ padding:"10px 22px", borderRadius:12, background:`linear-gradient(135deg,${T.accent},${T.accentDark})`, color:"#fff", border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, boxShadow:`0 4px 14px ${T.globeGlow}` }}>
          Browse Hotels →
        </button>
      </div>
    </TravelCard>
  );
}

function TrainCard({ t, themeKey }) {
  const T = THEMES[themeKey];
  return (
    <TravelCard T={T} onClick={() => window.open(t.link,"_blank","noopener")}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
        <div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:600, fontSize:18, color:T.aiText }}>{t.from} → {t.to}</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.aiText, opacity:0.5, marginTop:2 }}>Indian Railways · IRCTC</div>
        </div>
        {t.label && <span style={{ padding:"3px 12px", borderRadius:20, fontSize:11, background:T.accentSoft, color:T.accent, fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>{t.label}</span>}
      </div>
      {t.insight && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.accent, marginBottom:8 }}>💡 {t.insight}</div>}
      {t.date && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:T.accent, marginBottom:8 }}>📅 {t.date}</div>}
      <div style={{ display:"flex", justifyContent:"flex-end", paddingTop:10, borderTop:`1px solid ${T.divider}` }}>
        <button style={{ padding:"10px 22px", borderRadius:12, background:`linear-gradient(135deg,${T.accent},${T.accentDark})`, color:"#fff", border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, boxShadow:`0 4px 14px ${T.globeGlow}` }}>
          Book on IRCTC →
        </button>
      </div>
    </TravelCard>
  );
}

// ── SIDEBAR ITEM ──────────────────────────────────────────────────────────────
function SidebarItem({ chat, isActive, onLoad, onRename, onDelete, T }) {
  const [menu, setMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [val, setVal] = useState(chat.title);
  const ref = useRef(null);

  useEffect(() => {
    if (!menu) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setMenu(false); };
    document.addEventListener("mousedown", h);
    document.addEventListener("touchstart", h);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("touchstart", h); };
  }, [menu]);

  return (
    <div style={{ position:"relative", marginBottom:2 }}>
      <div onClick={() => { if (!menu && !renaming) onLoad(); }}
        style={{ padding:"10px 12px", borderRadius:10, cursor:"pointer", background: isActive ? T.accentSoft : "transparent", borderLeft: isActive ? `3px solid ${T.accent}` : "3px solid transparent", display:"flex", alignItems:"center", gap:6, transition:"all 0.15s" }}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
        <div style={{ flex:1, minWidth:0 }}>
          {renaming ? (
            <input value={val} autoFocus onChange={e => setVal(e.target.value)}
              onBlur={() => { onRename(chat.id, val.trim()||chat.title); setRenaming(false); }}
              onKeyDown={e => { if(e.key==="Enter"){onRename(chat.id,val.trim()||chat.title);setRenaming(false);} if(e.key==="Escape")setRenaming(false); }}
              onClick={e => e.stopPropagation()}
              style={{ width:"100%", background:"rgba(255,255,255,0.1)", border:`1px solid ${T.accent}66`, borderRadius:6, padding:"3px 8px", fontSize:13, color:T.sbText, outline:"none", fontFamily:"'DM Sans',sans-serif" }}/>
          ) : (
            <>
              <div style={{ fontSize:13, color:T.sbText, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>{chat.title}</div>
              <div style={{ fontSize:10, color:T.sbSubText, marginTop:1, fontFamily:"'DM Sans',sans-serif" }}>
                {new Date(chat.time).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}
              </div>
            </>
          )}
        </div>
        <button onClick={e => {e.stopPropagation();setMenu(s=>!s);}}
          style={{ width:22, height:22, borderRadius:5, background:"transparent", border:"none", cursor:"pointer", color:T.sbSubText, fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", opacity:0.6 }}>⋯</button>
      </div>
      {menu && (
        <div ref={ref} onClick={e=>e.stopPropagation()}
          style={{ position:"absolute", right:0, top:36, zIndex:200, background:T.aiBubble, borderRadius:10, padding:"4px 0", boxShadow:`0 8px 28px rgba(0,0,0,0.15)`, border:`1px solid ${T.cardBorder}`, minWidth:130 }}>
          <button onClick={()=>{setRenaming(true);setMenu(false);}} style={{ display:"block", width:"100%", padding:"9px 14px", textAlign:"left", background:"none", border:"none", cursor:"pointer", fontSize:13, color:T.aiText, fontFamily:"'DM Sans',sans-serif" }}>✏️ Rename</button>
          <button onClick={()=>{onDelete(chat.id);setMenu(false);}} style={{ display:"block", width:"100%", padding:"9px 14px", textAlign:"left", background:"none", border:"none", cursor:"pointer", fontSize:13, color:"#ef4444", fontFamily:"'DM Sans',sans-serif" }}>🗑️ Delete</button>
        </div>
      )}
    </div>
  );
}

// ── THEME PICKER ──────────────────────────────────────────────────────────────
function ThemePicker({ current, onSelect, T }) {
  return (
    <div style={{ padding:"4px 0" }}>
      <div style={{ fontSize:10, color:T.sbSubText, letterSpacing:"0.14em", marginBottom:10, fontFamily:"'DM Sans',sans-serif", textTransform:"uppercase" }}>Choose Theme</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:5 }}>
        {Object.entries(THEMES).map(([key, theme]) => (
          <button key={key} onClick={()=>onSelect(key)}
            style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 10px", borderRadius:10, cursor:"pointer", border: current===key ? `1px solid ${T.accent}` : "1px solid rgba(255,255,255,0.08)", background: current===key ? T.accentSoft : "rgba(255,255,255,0.03)", color:T.sbText, fontFamily:"'DM Sans',sans-serif", fontSize:11, textAlign:"left", transition:"all 0.15s" }}>
            <div style={{ width:12, height:12, borderRadius:"50%", background:theme.accent, flexShrink:0 }}/>
            <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{theme.name}</span>
            {current===key && <span style={{ color:T.accent, fontSize:10 }}>✓</span>}
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

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN AI CHAT PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function AIChatPage() {
  const navigate = useNavigate();
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem("alvryn_theme") || "gold");
  const [chats, setChats]       = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [thinking, setThinking] = useState(false);
  const [thinkQuery, setThinkQuery] = useState("");
  const [sbOpen, setSbOpen]     = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const bottomRef    = useRef(null);
  const inputRef     = useRef(null);
  const textareaRef  = useRef(null);
  const sessionIdRef = useRef(sessionStorage.getItem("alvryn_sid") || null);
  const thinkStart   = useRef(0);

  const T = THEMES[themeKey];
  const token = localStorage.getItem("token");
  let user = {};
  try { user = JSON.parse(localStorage.getItem("user") || "{}"); } catch {}

  useEffect(() => { if (!token) navigate("/login"); }, [token, navigate]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, thinking]);
  useEffect(() => { localStorage.setItem("alvryn_theme", themeKey); }, [themeKey]);

  // Keep backend alive
  useEffect(() => {
    fetch(`${API}/test`).catch(()=>{});
    const t = setInterval(() => fetch(`${API}/test`).catch(()=>{}), 14*60*1000);
    return () => clearInterval(t);
  }, []);

  // Load chats from local + DB
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
          id: c.chat_id, title: c.title || "New chat",
          messages: (Array.isArray(c.messages)?c.messages:[]).map(m => ({
            ...m, id:m.id||Date.now(), role:m.role||"user", content:m.content||m.text||"",
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
      const ex = prev.find(c => c.id===id);
      if (ex) return prev.map(c => c.id===id ? {...c,messages:msgs,time:Date.now()} : c);
      return [{id,title,messages:msgs,time:Date.now()},...prev].slice(0,50);
    });
    try {
      const s = JSON.parse(localStorage.getItem("alvryn_chats")||"[]");
      const t2 = s.find(c=>c.id===id)?.title || title;
      localStorage.setItem("alvryn_chats", JSON.stringify(
        [{id,title:t2,messages:msgs,time:Date.now()},...s.filter(c=>c.id!==id)].slice(0,30)
      ));
    } catch {}
    if (token) {
      const s2 = JSON.parse(localStorage.getItem("alvryn_chats")||"[]");
      const t3 = s2.find(c=>c.id===id)?.title || title;
      fetch(`${API}/chats/${id}`, {
        method:"POST",
        headers:{"Content-Type":"application/json", Authorization:`Bearer ${token}`},
        body: JSON.stringify({
          title:t3,
          messages:msgs.slice(0,100).map(m=>({
            role:m.role, content:m.content||"", text:m.text||"",
            cards:(m.cards||[]).slice(0,5), id:m.id,
          })),
        }),
      }).catch(()=>{});
    }
  }, [token]);

  const newChat = useCallback(() => {
    setActiveId(Date.now().toString());
    setMessages([]); setInput(""); setSbOpen(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const loadChat = useCallback(chat => {
    setActiveId(chat.id); setMessages(chat.messages||[]); setSbOpen(false);
  }, []);

  const deleteChat = useCallback(chatId => {
    setChats(prev => prev.filter(c=>c.id!==chatId));
    if (chatId===activeId) { setActiveId(null); setMessages([]); }
    if (token) fetch(`${API}/chats/${chatId}`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}}).catch(()=>{});
  }, [activeId, token]);

  const renameChat = useCallback((chatId, newTitle) => {
    setChats(prev => prev.map(c=>c.id===chatId?{...c,title:newTitle}:c));
    try {
      const s = JSON.parse(localStorage.getItem("alvryn_chats")||"[]");
      localStorage.setItem("alvryn_chats", JSON.stringify(s.map(c=>c.id===chatId?{...c,title:newTitle}:c)));
      const chat = s.find(c=>c.id===chatId);
      if (chat && token) fetch(`${API}/chats/${chatId}`,{
        method:"POST", headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},
        body:JSON.stringify({title:newTitle,messages:chat.messages||[]}),
      }).catch(()=>{});
    } catch {}
  }, [token]);

  const send = useCallback(async text => {
    const q = (text||input).trim();
    if (!q||loading) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height="auto";
    playSound("send");

    const id = activeId||Date.now().toString();
    if (!activeId) setActiveId(id);

    const uMsg = { role:"user", content:q, id:Date.now() };
    const next = [...messages, uMsg];
    setMessages(next);
    setLoading(true); setThinking(true); setThinkQuery(q);
    thinkStart.current = Date.now();

    try {
      const res = await fetch(`${API}/ai-chat-v2`, {
        method:"POST",
        headers:{"Content-Type":"application/json", Authorization:`Bearer ${token}`},
        body: JSON.stringify({
          message:q,
          history:messages.slice(-6).map(m=>({role:m.role,content:m.content||m.text||""})),
          sessionId:sessionIdRef.current
        }),
      });
      const data = await res.json();

      // Ensure minimum thinking time of 2s for premium feel
      const elapsed = Date.now()-thinkStart.current;
      if (elapsed<2000) await new Promise(r=>setTimeout(r,2000-elapsed));

      if (data.sessionId) { sessionIdRef.current=data.sessionId; sessionStorage.setItem("alvryn_sid",data.sessionId); }
      setThinking(false);
      playSound("receive");

      const aMsg = {
        role:"assistant", id:Date.now()+1,
        text:data.text||"", cards:data.cards||[],
        cta:data.cta||null, quickReplies:data.quickReplies||[],
        sectionNum:data.sectionNum||null, totalSections:data.totalSections||null,
        _elegantDone:false,
      };
      const final = [...next, aMsg];
      setMessages(final);
      const chatTitle = next[0]?.content?.slice(0,44)+(next[0]?.content?.length>44?"…":"") || "New chat";
      saveChat(id, final, chatTitle);
    } catch {
      setThinking(false);
      setMessages([...next, {
        role:"assistant", id:Date.now()+1,
        text:"Something went sideways on my end! 😅 Please try again in a moment.",
        cards:[], cta:null,
      }]);
    }
    setLoading(false);
    setTimeout(()=>inputRef.current?.focus(), 80);
  }, [input, loading, messages, token, activeId, saveChat]);

  const handleKey = e => {
    if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}
  };
  const handleInput = e => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height="auto";
      textareaRef.current.style.height=Math.min(textareaRef.current.scrollHeight,130)+"px";
    }
  };

  const empty = messages.length===0;
  const chatTitle = chats.find(c=>c.id===activeId)?.title || "Alvryn AI";

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    html,body{height:100%;overflow:hidden;}
    @keyframes globePulse{0%,100%{opacity:0.65;}50%{opacity:1;}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
    @keyframes spin{to{transform:rotate(360deg);}}
    @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.3;}}
    @keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);}}
    ::-webkit-scrollbar{width:3px;}
    ::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.3);border-radius:2px;}
    textarea::placeholder{font-family:'DM Sans',sans-serif!important;}
    @media(max-width:640px){
      .sb-hide-mobile{display:none!important;}
    }
  `;

  return (
    <div style={{ display:"flex", height:"100vh", height:"100dvh", background:T.bg, overflow:"hidden", fontFamily:"'DM Sans',sans-serif", transition:"background 0.5s ease" }}>
      <style>{CSS}</style>

      {/* SIDEBAR OVERLAY */}
      {sbOpen && (
        <div onClick={()=>setSbOpen(false)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(6px)", zIndex:390 }}/>
      )}

      {/* ══ SIDEBAR ══ */}
      <div style={{
        width: sbOpen ? "min(85vw,300px)" : 0,
        flexShrink:0, background:T.sidebar,
        borderRight:`1px solid ${T.sbBorder}`,
        position:"fixed", left:0, top:0, bottom:0, zIndex:400,
        overflow:"hidden",
        transition:"width 0.28s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: sbOpen ? "4px 0 32px rgba(0,0,0,0.5)" : "none",
      }}>
        <div style={{ display:"flex", flexDirection:"column", height:"100%", padding:"16px 14px", overflowY:"auto", overflowX:"hidden", minWidth:300 }}>

          {/* Logo + Close */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, paddingBottom:16, borderBottom:`1px solid ${T.sbBorder}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }} onClick={()=>navigate("/")}>
              <AlvrynLogo size={30} color={T.accent}/>
              <div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:600, fontSize:18, color:T.accent, letterSpacing:"0.12em" }}>ALVRYN</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:9, color:T.sbSubText, letterSpacing:"0.2em" }}>AI TRAVEL</div>
              </div>
            </div>
            <button onClick={()=>setSbOpen(false)}
              style={{ width:28, height:28, borderRadius:"50%", background:"rgba(255,255,255,0.06)", border:`1px solid ${T.sbBorder}`, cursor:"pointer", color:T.sbSubText, fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
          </div>

          {/* New Chat */}
          <button onClick={newChat}
            style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", borderRadius:12, background:`linear-gradient(135deg,${T.accent},${T.accentDark})`, border:"none", cursor:"pointer", color:"#fff", fontSize:14, fontWeight:600, marginBottom:12, width:"100%", fontFamily:"'DM Sans',sans-serif", letterSpacing:"0.02em", boxShadow:`0 4px 16px ${T.globeGlow}` }}>
            + New Conversation
          </button>

          {/* Theme Toggle */}
          <button onClick={()=>setShowThemes(s=>!s)}
            style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", borderRadius:10, background: showThemes ? T.accentSoft : "rgba(255,255,255,0.04)", border:`1px solid ${T.sbBorder}`, cursor:"pointer", color:T.sbText, fontSize:12, marginBottom:8, width:"100%", fontFamily:"'DM Sans',sans-serif", textAlign:"left", transition:"all 0.15s" }}>
            <div style={{ width:12, height:12, borderRadius:"50%", background:T.accent }}/>
            🎨 Change Theme
            <span style={{ marginLeft:"auto", opacity:0.5 }}>{showThemes?"▲":"▼"}</span>
          </button>

          {/* Theme Picker (inline, doesn't push chats) */}
          {showThemes && (
            <div style={{ marginBottom:12, padding:"10px", background:"rgba(255,255,255,0.03)", borderRadius:10, border:`1px solid ${T.sbBorder}` }}>
              <ThemePicker current={themeKey} onSelect={k=>{setThemeKey(k);}} T={T}/>
            </div>
          )}

          {/* Chat History — always visible regardless of theme picker */}
          <div style={{ flex:1, overflowY:"auto", overflowX:"hidden", marginBottom:8 }}>
            {chats.length > 0 ? (
              <>
                <div style={{ fontSize:9, color:T.sbSubText, letterSpacing:"0.16em", marginBottom:8, paddingLeft:4, fontFamily:"'DM Sans',sans-serif", textTransform:"uppercase" }}>Recent</div>
                {chats.slice(0,30).map(chat=>(
                  <SidebarItem key={chat.id} chat={chat} isActive={activeId===chat.id}
                    onLoad={()=>loadChat(chat)}
                    onRename={(id,t)=>renameChat(id,t)}
                    onDelete={id=>deleteChat(id)} T={T}/>
                ))}
              </>
            ) : (
              <div style={{ fontSize:13, color:T.sbSubText, textAlign:"center", padding:"20px 0", fontFamily:"'DM Sans',sans-serif" }}>
                No conversations yet.<br/>
                <span style={{ color:T.accent }}>Start your first trip! ✈️</span>
              </div>
            )}
          </div>

          {/* User Info */}
          <div style={{ borderTop:`1px solid ${T.sbBorder}`, paddingTop:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <div style={{ width:34, height:34, borderRadius:"50%", flexShrink:0, background:`linear-gradient(135deg,${T.accent},${T.accentDark})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:700, color:"#fff" }}>
                {user.name?.charAt(0)?.toUpperCase()||"U"}
              </div>
              <div style={{ overflow:"hidden", flex:1 }}>
                <div style={{ fontSize:13, color:T.sbText, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>{user.name||"Traveller"}</div>
                <div style={{ fontSize:10, color:T.sbSubText, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:"'DM Sans',sans-serif" }}>{user.email||""}</div>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:5, marginBottom:8 }}>
              {[["🔍 Search","/search"],["👤 Profile","/profile"],["🏠 Home","/"],["🎫 Bookings","/bookings"]].map(([label,path])=>(
                <button key={path} onClick={()=>navigate(path)}
                  style={{ padding:"7px 6px", borderRadius:8, fontSize:11, fontWeight:500, cursor:"pointer", background:"rgba(255,255,255,0.04)", color:T.sbSubText, border:`1px solid ${T.sbBorder}`, fontFamily:"'DM Sans',sans-serif", transition:"all 0.15s" }}
                  onMouseEnter={e=>{e.currentTarget.style.background=T.accentSoft;e.currentTarget.style.color=T.sbText;}}
                  onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.04)";e.currentTarget.style.color=T.sbSubText;}}>
                  {label}
                </button>
              ))}
            </div>
            <button onClick={()=>{localStorage.removeItem("token");localStorage.removeItem("user");navigate("/login");}}
              style={{ width:"100%", padding:"8px", borderRadius:8, fontSize:12, fontWeight:500, cursor:"pointer", background:"rgba(239,68,68,0.06)", color:"rgba(239,68,68,0.7)", border:"1px solid rgba(239,68,68,0.2)", fontFamily:"'DM Sans',sans-serif" }}>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* ══ MAIN AREA ══ */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>

        {/* ── STICKY TOP BAR ── */}
        <div style={{
          height:58, padding:"0 16px",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          borderBottom:`1px solid ${T.border}`,
          flexShrink:0, background:T.navBg, backdropFilter:"blur(20px)",
          position:"sticky", top:0, zIndex:100,
          transition:"background 0.4s ease",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            {/* Hamburger — always visible */}
            <button onClick={()=>setSbOpen(s=>!s)}
              style={{ width:40, height:40, borderRadius:10, background:"transparent", border:`1px solid ${T.border}`, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:5, padding:"10px", flexShrink:0, transition:"all 0.2s" }}
              onMouseEnter={e=>{e.currentTarget.style.background=T.accentSoft;}}
              onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
              <div style={{ width:"100%", height:1.5, background:T.inkColor, borderRadius:2, opacity:0.8 }}/>
              <div style={{ width:"100%", height:1.5, background:T.inkColor, borderRadius:2, opacity:0.8 }}/>
              <div style={{ width:"100%", height:1.5, background:T.inkColor, borderRadius:2, opacity:0.8 }}/>
            </button>

            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:600, fontSize:16, color:T.aiText, letterSpacing:"0.04em", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"clamp(100px,30vw,280px)" }}>
              {empty ? "Alvryn AI" : chatTitle}
            </div>
          </div>

          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {/* Search / Home icon */}
            <button onClick={()=>navigate("/search")} title="Search Flights & More"
              style={{ width:36, height:36, borderRadius:10, background:T.accentSoft, border:`1px solid ${T.border}`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0, transition:"all 0.2s" }}
              onMouseEnter={e=>{e.currentTarget.style.background=`${T.accent}25`;}}
              onMouseLeave={e=>{e.currentTarget.style.background=T.accentSoft;}}>
              🔍
            </button>

            {/* Live indicator */}
            <div style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:20, border:`1px solid ${T.border}`, background:T.accentSoft }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e", animation:"pulse 2s infinite" }}/>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.accent, letterSpacing:"0.06em", fontWeight:500 }}>AI LIVE</span>
            </div>

            <button onClick={newChat}
              style={{ padding:"7px 16px", borderRadius:10, background:`linear-gradient(135deg,${T.accent},${T.accentDark})`, border:"none", color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", letterSpacing:"0.02em", boxShadow:`0 3px 12px ${T.globeGlow}` }}>
              + New
            </button>
          </div>
        </div>

        {/* ── MESSAGES AREA ── */}
        <div style={{ flex:1, overflowY:"auto", WebkitOverflowScrolling:"touch", padding:"clamp(12px,2vw,20px) clamp(10px,2vw,16px)", background:T.msgArea, minHeight:0, transition:"background 0.5s ease" }}>
          <div style={{ maxWidth:700, margin:"0 auto" }}>

            {/* EMPTY STATE */}
            {empty && (
              <div style={{ textAlign:"center", paddingTop:"clamp(24px,6vh,56px)", animation:"fadeUp 0.6s both" }}>
                <div style={{ fontSize:48, marginBottom:16, animation:"float 4s ease-in-out infinite" }}>✈️</div>
                <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:300, fontSize:"clamp(28px,5vw,54px)", color:T.aiText, marginBottom:8, lineHeight:1.1, letterSpacing:"-0.01em" }}>
                  Where do you want to go?
                </h1>
                <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(13px,2.5vw,16px)", color:T.aiText, opacity:0.55, marginBottom:28, lineHeight:1.7, fontWeight:300 }}>
                  Flights · Buses · Hotels · Trains · Complete Trip Planning<br/>
                  <span style={{ fontSize:"clamp(11px,2vw,13px)", opacity:0.7 }}>Any language · Any city worldwide · Typos welcome 😄</span>
                </p>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(clamp(140px,38vw,230px),1fr))", gap:10, maxWidth:580, margin:"0 auto", padding:"0 8px" }}>
                  {[
                    "✈️ Cheapest flight Bangalore to Delhi tomorrow",
                    "🚌 Bus Chennai to Hyderabad tonight",
                    "🏨 Hotels in Goa under ₹2000",
                    "🚂 Train Delhi to Mumbai this weekend",
                    "🗺️ Plan a 3-day trip from Bangalore",
                    "🌍 Flights to Dubai next month",
                    "⚡ Fastest way Bangalore to Mumbai",
                    "💑 Honeymoon destinations in Europe",
                  ].map((s,i)=>(
                    <button key={i} onClick={()=>send(s)}
                      style={{ padding:"12px 14px", borderRadius:12, background:T.aiBubble, border:`1px solid ${T.cardBorder}`, color:T.aiText, fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(12px,2.4vw,13px)", cursor:"pointer", textAlign:"left", lineHeight:1.5, boxShadow:T.cardShadow, transition:"all 0.2s cubic-bezier(0.4,0,0.2,1)", animation:`fadeUp 0.4s ${i*50}ms both`, fontWeight:400 }}
                      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 8px 24px rgba(0,0,0,0.1), 0 0 0 1px ${T.accent}33`;e.currentTarget.style.borderColor=`${T.accent}55`;}}
                      onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow=T.cardShadow;e.currentTarget.style.borderColor=T.cardBorder;}}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* MESSAGES */}
            {messages.map(m => (
              <div key={m.id}>
                {m.role==="user" ? (
                  <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:18, animation:"fadeUp 0.2s both" }}>
                    <div style={{ maxWidth:"72%", padding:"12px 18px", borderRadius:"18px 18px 4px 18px", background:T.userBubble, boxShadow:T.shadow, fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(14px,2.8vw,16px)", color:T.userText, fontWeight:400, lineHeight:1.65 }}>
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div style={{ display:"flex", gap:12, marginBottom:24, animation:"fadeUp 0.3s both" }}>
                    <div style={{ flexShrink:0, width:32, height:32, borderRadius:"50%", background:`linear-gradient(135deg,${T.accent},${T.accentDark})`, display:"flex", alignItems:"center", justifyContent:"center", marginTop:6, boxShadow:T.shadow }}>
                      <AlvrynLogo size={18} color="#fff"/>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>

                      {/* Section progress bar */}
                      {m.sectionNum && m.totalSections && (
                        <div style={{ display:"flex", alignItems:"center", gap:3, marginBottom:12 }}>
                          {Array.from({length:m.totalSections},(_,i)=>(
                            <div key={i} style={{ flex:1, height:3, borderRadius:2, background:i<m.sectionNum ? `linear-gradient(90deg,${T.accent},${T.accentDark})` : T.divider, transition:"background 0.3s ease" }}/>
                          ))}
                          <span style={{ fontSize:10, color:T.accent, fontFamily:"'DM Sans',sans-serif", marginLeft:6, whiteSpace:"nowrap", fontWeight:500 }}>{m.sectionNum}/{m.totalSections}</span>
                        </div>
                      )}

                      {/* AI text bubble */}
                      {m.text && (
                        <div style={{ background:T.aiBubble, border:`1px solid ${T.border}`, borderLeft:`3px solid ${T.accent}`, borderRadius:"0 16px 16px 16px", padding:"16px 18px", marginBottom: m.cards?.length ? 14 : 0, boxShadow:T.cardShadow, fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(15px,2.8vw,18px)", color:T.aiText, lineHeight:1.85, fontWeight:400 }}>
                          {m._elegantDone === false ? (
                            <ElegantText text={m.text} themeKey={themeKey}
                              onDone={()=>setMessages(prev=>prev.map(msg=>msg.id===m.id?{...msg,_elegantDone:true}:msg))}/>
                          ) : (
                            <ElegantText text={m.text} themeKey={themeKey}/>
                          )}
                        </div>
                      )}

                      {/* Cards */}
                      {m.cards?.filter(c=>c.type==="flight").map((c,i)=><FlightCard key={i} f={c} themeKey={themeKey}/>)}
                      {m.cards?.filter(c=>c.type==="bus").map((c,i)=><BusCard key={i} b={c} themeKey={themeKey}/>)}
                      {m.cards?.filter(c=>c.type==="hotel").map((c,i)=><HotelCard key={i} h={c} themeKey={themeKey}/>)}
                      {m.cards?.filter(c=>c.type==="train").map((c,i)=><TrainCard key={i} t={c} themeKey={themeKey}/>)}

                      {m.cards?.length>0 && (
                        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.aiText, opacity:0.35, marginTop:6, fontStyle:"italic" }}>
                          Prices are approximate. Tap any card to check live availability.
                        </div>
                      )}

                      {/* CTA */}
                      {m.cta && (
                        <div style={{ marginTop:12, padding:"10px 14px", borderRadius:10, border:`1px solid ${T.border}`, background:T.accentSoft, fontFamily:"'DM Sans',sans-serif", fontSize:13, color:T.accent, fontStyle:"italic" }}>
                          {m.cta}
                        </div>
                      )}

                      {/* Quick Replies */}
                      {m.quickReplies?.length>0 && (
                        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:12 }}>
                          {m.quickReplies.map((r,i)=>(
                            <button key={i} onClick={()=>send(r)}
                              style={{ padding:"8px 16px", borderRadius:20, background:T.aiBubble, border:`1px solid ${T.cardBorder}`, color:T.accent, fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:500, cursor:"pointer", transition:"all 0.18s", letterSpacing:"0.01em" }}
                              onMouseEnter={e=>{e.currentTarget.style.background=T.accentSoft;e.currentTarget.style.borderColor=`${T.accent}66`;}}
                              onMouseLeave={e=>{e.currentTarget.style.background=T.aiBubble;e.currentTarget.style.borderColor=T.cardBorder;}}>
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

            {/* THINKING — Holographic Globe */}
            {thinking && (
              <div style={{ display:"flex", gap:12, marginBottom:20, animation:"fadeUp 0.28s both" }}>
                <div style={{ flexShrink:0, width:32, height:32, borderRadius:"50%", background:`linear-gradient(135deg,${T.accent},${T.accentDark})`, display:"flex", alignItems:"center", justifyContent:"center", marginTop:6, boxShadow:T.shadow }}>
                  <AlvrynLogo size={18} color="#fff"/>
                </div>
                <div style={{ background:T.aiBubble, border:`1px solid ${T.border}`, borderLeft:`3px solid ${T.accent}`, borderRadius:"0 16px 16px 16px", boxShadow:T.cardShadow, overflow:"hidden" }}>
                  <HolographicGlobe themeKey={themeKey} query={thinkQuery}/>
                </div>
              </div>
            )}

            <div ref={bottomRef}/>
          </div>
        </div>

        {/* ── INPUT AREA — sticky at bottom ── */}
        <div style={{ padding:"10px 16px 16px", borderTop:`1px solid ${T.border}`, flexShrink:0, background:T.navBg, backdropFilter:"blur(20px)", transition:"background 0.4s ease" }}>
          <div style={{ maxWidth:700, margin:"0 auto" }}>
            <div style={{ display:"flex", alignItems:"flex-end", gap:10, background:T.inputBg, borderRadius:16, padding:"10px 14px", border:`1px solid ${T.border}`, boxShadow:`0 4px 20px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.5)`, backdropFilter:"blur(10px)", transition:"box-shadow 0.2s, border-color 0.2s" }}
              onFocusCapture={e=>{e.currentTarget.style.borderColor=`${T.accent}66`;e.currentTarget.style.boxShadow=`0 4px 24px ${T.globeGlow}, inset 0 1px 0 rgba(255,255,255,0.5)`;}}
              onBlurCapture={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.boxShadow=`0 4px 20px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.5)`;}}>
              <textarea
                ref={el=>{inputRef.current=el;textareaRef.current=el;}}
                value={input} onChange={handleInput} onKeyDown={handleKey}
                placeholder="Ask me anything about your journey..."
                rows={1}
                style={{ flex:1, background:"transparent", border:"none", outline:"none", fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(14px,2.8vw,16px)", color:T.inputText, resize:"none", lineHeight:1.6, maxHeight:130, overflowY:"auto", paddingTop:2, fontWeight:400 }}
              />
              <button onClick={()=>send()} disabled={!input.trim()||loading}
                style={{ flexShrink:0, width:36, height:36, borderRadius:10, background: input.trim()&&!loading ? `linear-gradient(135deg,${T.accent},${T.accentDark})` : "rgba(128,128,128,0.12)", border:"none", cursor: input.trim()&&!loading ? "pointer" : "default", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, transition:"all 0.2s", boxShadow: input.trim()&&!loading ? `0 4px 12px ${T.globeGlow}` : "none", color: input.trim()&&!loading ? "#fff" : "rgba(128,128,128,0.35)" }}>
                {loading
                  ? <div style={{ width:14, height:14, border:"2px solid rgba(255,255,255,0.2)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
                  : "↑"}
              </button>
            </div>

            {/* Disclaimer */}
            <div style={{ textAlign:"center", marginTop:6, fontFamily:"'DM Sans',sans-serif", fontSize:11, color:T.aiText, opacity:0.3, fontWeight:300, letterSpacing:"0.01em" }}>
              Alvryn AI can make mistakes — please double-check important details.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}