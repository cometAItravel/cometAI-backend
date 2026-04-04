import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

/* ─── GLOBAL STYLES ─────────────────────────────────────────────────────────── */
const G = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:'DM Sans',sans-serif;background:#fafaf8;color:#0a0a0a;overflow-x:hidden;}
@keyframes blink{50%{opacity:0;}}
@keyframes floatY{0%,100%{transform:translateY(0);}50%{transform:translateY(-12px);}}
@keyframes fadeUp{from{opacity:0;transform:translateY(30px);}to{opacity:1;transform:translateY(0);}}
@keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
@keyframes gradShift{0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;}}
@keyframes zoomIn{from{transform:scale(1.08);opacity:0;}to{transform:scale(1);opacity:1;}}
@keyframes slideUp{from{transform:translateY(100%);opacity:0;}to{transform:translateY(0);opacity:1;}}
@keyframes glowPulse{0%,100%{box-shadow:0 0 20px rgba(108,99,255,0.2);}50%{box-shadow:0 0 40px rgba(108,99,255,0.5);}}
@keyframes borderGlow{0%,100%{border-color:rgba(108,99,255,0.3);}50%{border-color:rgba(108,99,255,0.8);}}
@keyframes wingAnim{0%,100%{transform:scaleX(1);}50%{transform:scaleX(1.08);}}
@keyframes counterUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
@keyframes splashFade{0%{opacity:1;}100%{opacity:0;}}
::-webkit-scrollbar{width:3px;}
::-webkit-scrollbar-thumb{background:linear-gradient(#c9a84c,#8B6914);border-radius:2px;}
.shine-btn{position:relative;overflow:hidden;cursor:pointer;transition:transform 0.2s,box-shadow 0.3s;}
.shine-btn:hover{transform:translateY(-2px);}
.shine-btn::after{content:'';position:absolute;inset:0;background:linear-gradient(120deg,transparent 30%,rgba(255,255,255,0.25) 50%,transparent 70%);transform:translateX(-100%);transition:transform 0.5s;}
.shine-btn:hover::after{transform:translateX(100%);}
.tilt-card{transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1);}
@media(max-width:768px){
  .hero-grid{flex-direction:column!important;text-align:center!important;}
  .mockup-box{display:none!important;}
  .nav-links{display:none!important;}
  .how-grid{grid-template-columns:1fr!important;}
  .feat-grid{grid-template-columns:1fr!important;}
  .stats-grid{grid-template-columns:1fr 1fr!important;}
  .wa-grid{grid-template-columns:1fr!important;}
  .cta-row{flex-direction:column!important;align-items:stretch!important;}
  .footer-grid{flex-direction:column!important;gap:20px!important;text-align:center!important;}
}
`;

/* ─── LUXURY MONOGRAM ICON ──────────────────────────────────────────────────── */
const AlvrynIcon = ({ size = 44, color = "#6C63FF", animate = false }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
    <defs>
      <linearGradient id="icon_g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#c9a84c"/>
        <stop offset="50%" stopColor="#f0d080"/>
        <stop offset="100%" stopColor="#8B6914"/>
      </linearGradient>
      <filter id="icon_glow">
        <feGaussianBlur stdDeviation="1" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    {/* Outer ring — luxury feel */}
    <circle cx="28" cy="28" r="26" stroke="url(#icon_g)" strokeWidth="1" fill="none" opacity="0.4"/>
    <circle cx="28" cy="28" r="22" stroke="url(#icon_g)" strokeWidth="0.5" fill="none" opacity="0.2"/>
    {/* Overlapping A monogram — luxury brand style */}
    {/* First A — slightly left */}
    <path d="M19 42 L26 14 L33 42" stroke="url(#icon_g)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#icon_glow)"
      style={animate ? { animation:"wingAnim 3s ease-in-out infinite" } : {}}/>
    <path d="M21.5 32 L30.5 32" stroke="url(#icon_g)" strokeWidth="1.8" strokeLinecap="round"/>
    {/* Second A — slightly right, offset for overlap */}
    <path d="M24 42 L31 14 L38 42" stroke="url(#icon_g)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.5"/>
    <path d="M26.5 32 L35.5 32" stroke="url(#icon_g)" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
    {/* Center diamond accent */}
    <circle cx="28" cy="28" r="1.5" fill="url(#icon_g)" opacity="0.9"/>
  </svg>
);

/* ─── GRAVITY PARTICLE CANVAS ───────────────────────────────────────────────── */
const GravityCanvas = ({ active }) => {
  const ref = useRef(null);
  const mouse = useRef({ x: -999, y: -999 });
  const particles = useRef([]);
  const raf = useRef(null);
  useEffect(() => {
    if (!active) return;
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let W = window.innerWidth, H = window.innerHeight;
    canvas.width = W; canvas.height = H;
    const COLORS = ["#c9a84c","#f0d080","#8B6914","#d4b868","#e8c97a"];
    particles.current = Array.from({ length: 55 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.8 + 0.4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: Math.random() * 0.4 + 0.15,
    }));
    const resize = () => { W = window.innerWidth; H = window.innerHeight; canvas.width = W; canvas.height = H; };
    window.addEventListener("resize", resize);
    const onMove = e => { const t = e.touches ? e.touches[0] : e; mouse.current = { x: t.clientX, y: t.clientY }; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: true });
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.current.forEach(p => {
        const dx = mouse.current.x - p.x, dy = mouse.current.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180) { const f = (180 - dist) / 180; p.vx += dx / dist * f * 0.06; p.vy += dy / dist * f * 0.06; }
        p.vx *= 0.96; p.vy *= 0.96;
        p.vx += (Math.random() - 0.5) * 0.03; p.vy += (Math.random() - 0.5) * 0.03;
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.save(); ctx.globalAlpha = p.alpha; ctx.shadowBlur = 5; ctx.shadowColor = p.color;
        ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      });
      particles.current.forEach((a, i) => {
        particles.current.slice(i + 1).forEach(b => {
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 80) { ctx.save(); ctx.globalAlpha = (1 - d / 80) * 0.08; ctx.strokeStyle = a.color; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.restore(); }
        });
      });
      raf.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener("resize", resize); window.removeEventListener("mousemove", onMove); window.removeEventListener("touchmove", onMove); };
  }, [active]);
  return <canvas ref={ref} style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none", opacity: active ? 1 : 0 }}/>;
};

/* ─── SPLASH SCREEN ─────────────────────────────────────────────────────────── */
const Splash = ({ onDone }) => {
  const [phase, setPhase] = useState(0); // 0=init 1=line 2=name 3=tagline 4=fading
  const [chars, setChars] = useState([]);
  const name = "ALVRYN";
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300);
    const t2 = setTimeout(() => setPhase(2), 700);
    let i = 0;
    const typeInterval = setInterval(() => {
      if (i <= name.length) { setChars(name.slice(0, i).split("")); i++; }
      else { clearInterval(typeInterval); }
    }, 100);
    const t3 = setTimeout(() => setPhase(3), 700 + name.length * 100 + 200);
    const t4 = setTimeout(() => setPhase(4), 2200);
    const t5 = setTimeout(() => onDone(), 2900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); clearInterval(typeInterval); };
  }, [onDone]);
  return (
    <div style={{ position:"fixed", inset:0, zIndex:9999, background:"#fafaf8", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      opacity: phase === 4 ? 0 : 1, transition:"opacity 0.7s cubic-bezier(0.4,0,0.2,1)", pointerEvents: phase === 4 ? "none" : "all" }}>
      {/* Top line */}
      <div style={{ width: phase >= 1 ? 80 : 0, height:1, background:"linear-gradient(90deg,transparent,#c9a84c,transparent)", transition:"width 0.6s ease", marginBottom:32 }}/>
      {/* Icon */}
      <div style={{ marginBottom:28, opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? "scale(1)" : "scale(0.8)", transition:"all 0.5s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <AlvrynIcon size={52} animate/>
      </div>
      {/* Name — each char drops in */}
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:300, letterSpacing:"0.35em", fontSize:"clamp(32px,6vw,56px)", color:"#0a0a0a", display:"flex", gap:2 }}>
        {chars.map((ch, i) => (
          <span key={i} style={{ opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? "translateY(0)" : "translateY(20px)",
            transition:`all 0.4s ${i * 0.08}s cubic-bezier(0.34,1.56,0.64,1)`, display:"inline-block" }}>{ch}</span>
        ))}
        {phase >= 2 && chars.length < name.length && <span style={{ animation:"blink 0.6s step-end infinite", color:"#c9a84c" }}>|</span>}
      </div>
      {/* Tagline */}
      <div style={{ fontFamily:"'Space Mono',monospace", fontSize:"clamp(9px,1.2vw,11px)", color:"#aaa", letterSpacing:"0.4em", marginTop:16,
        opacity: phase >= 3 ? 1 : 0, transform: phase >= 3 ? "translateY(0)" : "translateY(10px)", transition:"all 0.5s 0.1s ease" }}>
        TRAVEL BEYOND BOUNDARIES
      </div>
      {/* Bottom line */}
      <div style={{ width: phase >= 3 ? 80 : 0, height:1, background:"linear-gradient(90deg,transparent,#c9a84c,transparent)", transition:"width 0.6s 0.2s ease", marginTop:32 }}/>
    </div>
  );
};

/* ─── SPLIT TEXT ANIMATION ──────────────────────────────────────────────────── */
const SplitText = ({ text, style, charStyle, stagger = 40, delay = 0, started }) => (
  <span style={style}>
    {text.split("").map((ch, i) => (
      <span key={i} style={{ display:"inline-block", opacity: started ? 1 : 0,
        transform: started ? "translateY(0) rotateX(0deg)" : "translateY(60px) rotateX(20deg)",
        transition:`opacity 0.5s ${delay + i * stagger}ms ease, transform 0.6s ${delay + i * stagger}ms cubic-bezier(0.34,1.56,0.64,1)`,
        ...charStyle }}>
        {ch === " " ? "\u00A0" : ch}
      </span>
    ))}
  </span>
);

/* ─── BLUR TEXT ─────────────────────────────────────────────────────────────── */
const BlurText = ({ text, style, delay = 0 }) => {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity: vis ? 1 : 0, filter: vis ? "blur(0)" : "blur(12px)",
      transform: vis ? "translateY(0)" : "translateY(20px)",
      transition:`all 0.8s ${delay}ms cubic-bezier(0.22,1,0.36,1)`, ...style }}>
      {text}
    </div>
  );
};

/* ─── SCROLL REVEAL ─────────────────────────────────────────────────────────── */
const Reveal = ({ children, delay = 0, style }) => {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.08 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(40px)",
      transition:`opacity 0.7s ${delay}ms ease, transform 0.8s ${delay}ms cubic-bezier(0.22,1,0.36,1)`, ...style }}>
      {children}
    </div>
  );
};

/* ─── BORDER GLOW CARD ──────────────────────────────────────────────────────── */
const BorderGlowCard = ({ children, style, accentColor = "#c9a84c" }) => {
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const onMove = e => {
    const r = e.currentTarget.getBoundingClientRect();
    setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };
  return (
    <div onMouseMove={onMove}
      style={{ position:"relative", borderRadius:"inherit", ...style }}>
      <div style={{ position:"absolute", inset:-1, borderRadius:"inherit", background:`radial-gradient(circle at ${pos.x}% ${pos.y}%, ${accentColor}44 0%, transparent 60%)`, pointerEvents:"none", transition:"background 0.1s" }}/>
      {children}
    </div>
  );
};

/* ─── 3D TILT CARD ──────────────────────────────────────────────────────────── */
const TiltCard = ({ children, style }) => {
  const [t, setT] = useState({ rx:0, ry:0, s:1 });
  return (
    <div className="tilt-card"
      onMouseMove={e => { const r=e.currentTarget.getBoundingClientRect(); setT({ rx:((e.clientY-r.top)/r.height-0.5)*-12, ry:((e.clientX-r.left)/r.width-0.5)*12, s:1.02 }); }}
      onMouseLeave={() => setT({ rx:0, ry:0, s:1 })}
      style={{ transform:`perspective(900px) rotateX(${t.rx}deg) rotateY(${t.ry}deg) scale(${t.s})`, ...style }}>
      {children}
    </div>
  );
};

/* ─── TYPEWRITER ────────────────────────────────────────────────────────────── */
const TypeText = ({ phrases, color }) => {
  const [pi, setPi] = useState(0); const [txt, setTxt] = useState(""); const [del, setDel] = useState(false); const [ci, setCi] = useState(0);
  useEffect(() => {
    const w = phrases[pi % phrases.length];
    if (!del) { if (ci < w.length) { const t=setTimeout(()=>{setTxt(w.slice(0,ci+1));setCi(c=>c+1);},70);return()=>clearTimeout(t); } else { const t=setTimeout(()=>setDel(true),2400);return()=>clearTimeout(t); } }
    else { if (ci > 0) { const t=setTimeout(()=>{setTxt(w.slice(0,ci-1));setCi(c=>c-1);},40);return()=>clearTimeout(t); } else { setDel(false);setPi(p=>p+1); } }
  }, [ci,del,pi,phrases]);
  return <span style={{ color, fontWeight:600 }}>{txt}<span style={{ animation:"blink 0.8s step-end infinite", color }}>|</span></span>;
};

/* ─── COUNTER ───────────────────────────────────────────────────────────────── */
const Counter = ({ end, suffix="" }) => {
  const [n, setN] = useState(0); const ref = useRef(null); const done = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) { done.current=true; const s=Date.now(); const step=()=>{const p=Math.min((Date.now()-s)/2000,1);setN(Math.round((1-Math.pow(1-p,3))*end));if(p<1)requestAnimationFrame(step);};requestAnimationFrame(step); }
    }, { threshold:0.4 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end]);
  return <span ref={ref}>{n.toLocaleString()}{suffix}</span>;
};

/* ─── PARALLAX HOOK ─────────────────────────────────────────────────────────── */
const useParallax = (speed=0.25) => {
  const [offset, setOffset] = useState(0); const ref = useRef(null);
  useEffect(() => {
    const fn = () => { if (!ref.current) return; const r=ref.current.getBoundingClientRect(); setOffset((r.top+r.height/2-window.innerHeight/2)*speed); };
    window.addEventListener("scroll", fn, { passive:true }); fn();
    return () => window.removeEventListener("scroll", fn);
  }, [speed]);
  return [ref, offset];
};

/* ─── SECTION THEMES ────────────────────────────────────────────────────────── */
const GOLD_A  = "#c9a84c";
const GOLD_D  = "#8B6914";
const GOLD_G  = "linear-gradient(135deg,#c9a84c,#f0d080,#c9a84c)";
const THEMES = [
  { bg:"#faf8f4", accent:GOLD_A, grad:GOLD_G, text:"#1a1410" },
  { bg:"#f5f0e8", accent:GOLD_D, grad:GOLD_G, text:"#1a1410" },
  { bg:"#fdf8f0", accent:GOLD_A, grad:GOLD_G, text:"#1a1410" },
  { bg:"#f8f4ec", accent:GOLD_D, grad:GOLD_G, text:"#1a1410" },
  { bg:"#f5f2ea", accent:GOLD_A, grad:GOLD_G, text:"#1a1410" },
];

/* ─── FOOTER MODAL ──────────────────────────────────────────────────────────── */
const FooterModal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:2000, display:"flex", alignItems:"flex-end", justifyContent:"center", backdropFilter:"blur(8px)", padding:"0 0 0 0" }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:"100%", maxWidth:640, background:"#fff", borderRadius:"24px 24px 0 0", padding:"40px 36px 48px", maxHeight:"80vh", overflowY:"auto", animation:"slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28 }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:600, fontSize:26, color:"#0a0a0a" }}>{title}</div>
          <button onClick={onClose} style={{ width:36, height:36, borderRadius:"50%", background:"#f5f5f5", border:"none", cursor:"pointer", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center", color:"#888" }}>×</button>
        </div>
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:15, color:"#555", lineHeight:1.8 }}>{children}</div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const [splashDone, setSplashDone] = useState(false);
  const [heroReady, setHeroReady] = useState(false);
  const [themeIdx, setThemeIdx] = useState(0);
  const [navScrolled, setNavScrolled] = useState(false);
  const [modal, setModal] = useState(null); // null | 'about' | 'terms' | 'privacy' | 'contact'
  const T = THEMES[themeIdx];

  const onSplashDone = useCallback(() => { setSplashDone(true); setTimeout(() => setHeroReady(true), 100); }, []);

  useEffect(() => {
    const fn = () => {
      setNavScrolled(window.scrollY > 50);
      setThemeIdx(Math.min(Math.floor(window.scrollY / window.innerHeight), THEMES.length - 1));
    };
    window.addEventListener("scroll", fn, { passive:true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const goSearch = useCallback(() => navigate(localStorage.getItem("token") ? "/search" : "/login"), [navigate]);
  const [heroRef, heroOffset] = useParallax(0.18);
  const [sec2Ref, sec2Offset] = useParallax(0.12);

  const features = [
    { icon:"🧠", title:"AI Natural Search",  desc:"Type like texting — any language, typos, Hindi-English mix. Alvryn understands everything.", color:"#c9a84c" },
    { icon:"✈️", title:"Flight Booking",     desc:"Domestic and international routes. Best fares via trusted partners, instantly.", color:"#0284C7" },
    { icon:"🚌", title:"Bus Booking",        desc:"AC Sleeper, Semi-Sleeper buses across 50+ intercity routes in India.", color:"#059669" },
    { icon:"🏨", title:"Hotel Booking",      desc:"Hotels worldwide — from budget stays to luxury resorts. Best prices via partner.", color:"#EA580C" },
    { icon:"💬", title:"WhatsApp Native",    desc:"Book flights, buses and hotels entirely inside WhatsApp. No app needed.", color:"#25D366" },
    { icon:"🔒", title:"Zero Hidden Fees",   desc:"The price you see is the price you pay. We may earn a small commission at no cost to you.", color:"#7C3AED" },
  ];

  return (
    <>
      <style>{G}</style>
      <GravityCanvas active={splashDone}/>
      {!splashDone && <Splash onDone={onSplashDone}/>}

      {/* Footer Modals */}
      <FooterModal open={modal==="about"} onClose={()=>setModal(null)} title="About Alvryn">
        <p style={{marginBottom:16}}>Alvryn is India's most intelligent travel booking platform, built to make flight and bus booking effortless for every Indian traveller.</p>
        <p style={{marginBottom:16}}>We believe travel should be simple — whether you type in perfect English, Hindi, Tamil, or a mix of everything. Our AI understands you, finds the best fares, and gets you booked in under 60 seconds.</p>
        <p style={{marginBottom:16}}>Alvryn is currently in its early affiliate phase, connecting travellers with the best deals across domestic flights and intercity buses. We are rapidly expanding to international flights, trains, and hotel bookings.</p>
        <p>Our mission is to remove every friction point between you and your next journey.</p>
      </FooterModal>

      <FooterModal open={modal==="terms"} onClose={()=>setModal(null)} title="Terms & Conditions">
        <p style={{marginBottom:16}}><strong>Last updated:</strong> March 2026</p>
        <p style={{marginBottom:16}}>By using Alvryn, you agree to the following terms. Please read them carefully before using our services.</p>
        <p style={{marginBottom:12}}><strong>1. Use of Service</strong><br/>Alvryn provides a travel booking platform. You must be 18 years or older to book. All bookings are subject to availability.</p>
        <p style={{marginBottom:12}}><strong>2. Accuracy of Information</strong><br/>You are responsible for providing accurate passenger details. Alvryn is not liable for bookings made with incorrect information.</p>
        <p style={{marginBottom:12}}><strong>3. Payment</strong><br/>Payments are processed securely. Prices are displayed inclusive of applicable taxes. Alvryn reserves the right to cancel bookings in case of pricing errors.</p>
        <p style={{marginBottom:12}}><strong>4. Cancellation & Refunds</strong><br/>Cancellation policies are governed by the respective airline or bus operator. Alvryn facilitates the booking but does not control refund timelines.</p>
        <p style={{marginBottom:12}}><strong>5. Limitation of Liability</strong><br/>Alvryn is not responsible for flight delays, cancellations, or any losses arising from travel disruptions.</p>
        <p><strong>6. Changes to Terms</strong><br/>We may update these terms at any time. Continued use of Alvryn constitutes acceptance of the updated terms.</p>
      </FooterModal>

      <FooterModal open={modal==="privacy"} onClose={()=>setModal(null)} title="Privacy Policy">
        <p style={{marginBottom:16}}><strong>Last updated:</strong> March 2026</p>
        <p style={{marginBottom:16}}>Your privacy is important to us. This policy explains how Alvryn collects, uses, and protects your information.</p>
        <p style={{marginBottom:12}}><strong>1. Information We Collect</strong><br/>We collect your name, email address, phone number, and booking details when you create an account or make a booking.</p>
        <p style={{marginBottom:12}}><strong>2. How We Use Your Information</strong><br/>Your information is used to process bookings, send confirmation emails, personalise your experience, and improve our services. We do not sell your data to third parties.</p>
        <p style={{marginBottom:12}}><strong>3. Data Security</strong><br/>We use industry-standard encryption to protect your data. Payment information is processed via secure payment gateways and is never stored on our servers.</p>
        <p style={{marginBottom:12}}><strong>4. Cookies</strong><br/>We use cookies to maintain your session and improve site performance. You may disable cookies in your browser settings, though this may affect functionality.</p>
        <p style={{marginBottom:12}}><strong>5. Third-Party Services</strong><br/>We integrate with airline APIs, bus operators, and payment processors. Their respective privacy policies apply to data shared with them.</p>
        <p><strong>6. Your Rights</strong><br/>You may request deletion of your account and data at any time by contacting us at dynamics.studyai@gmail.com.</p>
      </FooterModal>

      <FooterModal open={modal==="contact"} onClose={()=>setModal(null)} title="Contact Us">
        <p style={{marginBottom:20}}>We'd love to hear from you — whether it's a question, feedback, or a partnership enquiry.</p>
        <div style={{ background:"#f5f3ff", borderRadius:16, padding:"24px", border:"1px solid rgba(108,99,255,0.15)", marginBottom:20 }}>
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:"#c9a84c", letterSpacing:"0.12em", marginBottom:8 }}>EMAIL</div>
          <a href="mailto:dynamics.studyai@gmail.com" style={{ fontFamily:"'DM Sans',sans-serif", fontSize:18, fontWeight:600, color:"#0a0a0a", textDecoration:"none" }}>
            dynamics.studyai@gmail.com
          </a>
        </div>
        <div style={{ background:"#f0fdf4", borderRadius:16, padding:"24px", border:"1px solid rgba(5,150,105,0.15)" }}>
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:"#059669", letterSpacing:"0.12em", marginBottom:8 }}>WHATSAPP SUPPORT</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:15, color:"#0a0a0a" }}>Message us on WhatsApp: <strong>+1-415-523-8886</strong><br/><span style={{ color:"#888", fontSize:13 }}>Join code: join meal-biggest</span></div>
        </div>
        <p style={{ marginTop:20, fontSize:13, color:"#aaa" }}>We typically respond within 24 hours on business days.</p>
      </FooterModal>

      {/* PAGE */}
      <div style={{ opacity: splashDone ? 1 : 0, transition:"opacity 0.6s ease, background 1.5s ease", background:T.bg }}>

        {/* ══ NAVBAR ══ */}
        <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:1000, height:68, padding:"0 5%",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          background: navScrolled ? "rgba(250,250,248,0.9)" : "transparent",
          backdropFilter: navScrolled ? "blur(24px)" : "none",
          borderBottom: navScrolled ? "1px solid rgba(0,0,0,0.06)" : "none",
          transition:"all 0.4s ease" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, cursor:"pointer" }} onClick={() => window.scrollTo({top:0,behavior:"smooth"})}>
            <div style={{ animation:"floatY 4s ease-in-out infinite" }}><AlvrynIcon size={42} animate/></div>
            <div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:600, fontSize:22, color:T.text, letterSpacing:"0.12em", lineHeight:1.1 }}>ALVRYN</div>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:7, color:T.accent, letterSpacing:"0.2em" }}>TRAVEL BEYOND</div>
            </div>
          </div>
          <div className="nav-links" style={{ display:"flex", gap:32 }}>
            {[["How it works","how-it-works"],["Features","features"],["Flights","cta"],["Buses","cta"]].map(([l,id]) => (
              <span key={l} onClick={()=>{const el=document.getElementById(id);if(el)el.scrollIntoView({behavior:"smooth"});}}
                style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:500, color:T.text, opacity:0.6, cursor:"pointer", transition:"opacity 0.2s" }}
                onMouseEnter={e=>e.target.style.opacity=1} onMouseLeave={e=>e.target.style.opacity=0.6}>{l}</span>
            ))}
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={() => navigate("/login")}
              style={{ padding:"9px 22px", borderRadius:12, fontSize:14, fontWeight:500, fontFamily:"'DM Sans',sans-serif", background:"transparent", color:T.text, border:"1.5px solid rgba(0,0,0,0.12)", cursor:"pointer", transition:"all 0.2s" }}>
              Sign In
            </button>
            <button onClick={() => navigate("/register")} className="shine-btn"
              style={{ padding:"9px 24px", borderRadius:12, fontSize:14, fontWeight:700, fontFamily:"'DM Sans',sans-serif", color:"#fff", border:"none", background:T.grad, boxShadow:`0 4px 20px ${T.accent}44` }}>
              Get Started
            </button>
          </div>
        </nav>

        {/* ══════════════════════════════════
            HERO — IMMERSIVE ZOOM IN
        ══════════════════════════════════ */}
        <section ref={heroRef} style={{ minHeight:"100vh", background:THEMES[0].bg, display:"flex", alignItems:"center", position:"relative", overflow:"hidden", padding:"0 5%",
          animation: splashDone ? "zoomIn 1s ease both" : "none" }}>
          {/* Subtle radial glow */}
          <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 55% 40%, rgba(108,99,255,0.07) 0%, transparent 65%), radial-gradient(ellipse at 20% 70%, rgba(0,194,255,0.05) 0%, transparent 55%)", pointerEvents:"none" }}/>

          <div style={{ position:"relative", zIndex:2, width:"100%", paddingTop:80, transform:`translateY(${heroOffset * -0.3}px)` }}>
            <div className="hero-grid" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:48 }}>
              <div style={{ maxWidth:660 }}>
                {/* Live badge */}
                <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"7px 18px", borderRadius:100,
                  background:`${T.accent}0F`, border:`1px solid ${T.accent}25`, marginBottom:44,
                  opacity: heroReady ? 1 : 0, transform: heroReady ? "translateY(0)" : "translateY(-14px)",
                  transition:"all 0.6s ease", animation: "none" }}>
                  <span style={{ width:7, height:7, borderRadius:"50%", background:T.accent, boxShadow:`0 0 8px ${T.accent}`, display:"inline-block" }}/>
                  <span style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:T.accent, letterSpacing:"0.12em" }}>NOW LIVE · INDIA'S SMARTEST TRAVEL AI</span>
                </div>

                {/* Main headline — Split Text drop-in */}
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:300, lineHeight:1.05, marginBottom:8 }}>
                  <div style={{ whiteSpace:"nowrap" }}>
                    <SplitText text="Travel Beyond" started={heroReady} delay={200} stagger={45}
                      charStyle={{ fontSize:"clamp(44px,6vw,96px)", color:"#0a0a0a", letterSpacing:"-0.02em" }}/>
                  </div>
                  <div style={{ whiteSpace:"nowrap" }}>
                    <SplitText text="Boundaries." started={heroReady} delay={200 + "Travel Beyond".length * 45 + 120} stagger={45}
                      charStyle={{ fontSize:"clamp(44px,6vw,96px)", letterSpacing:"-0.02em",
                        background:"linear-gradient(135deg,#c9a84c,#f0d080)", WebkitBackgroundClip:"text", backgroundClip:"text", WebkitTextFillColor:"transparent" }}/>
                  </div>
                </div>

                {/* Typewriter sub */}
                <div style={{ fontSize:"clamp(16px,2vw,21px)", color:"#666", lineHeight:1.6, marginTop:24, marginBottom:48,
                  opacity: heroReady ? 1 : 0, transform: heroReady ? "translateY(0)" : "translateY(14px)", transition:"all 0.7s 1.8s ease" }}>
                  Flights, buses and hotels — all in one sentence.
                  <br/>No filters. No confusion. Just tell Alvryn what you want.{" "}
                  <TypeText color={T.accent} phrases={["plain English.","a WhatsApp message.","in any language.","zero hidden fees.","even with typos."]}/>
                </div>

                {/* CTAs */}
                <div className="cta-row" style={{ display:"flex", gap:13, flexWrap:"wrap",
                  opacity: heroReady ? 1 : 0, transform: heroReady ? "translateY(0)" : "translateY(14px)", transition:"all 0.7s 2.1s ease" }}>
                  <button onClick={goSearch} className="shine-btn"
                    style={{ padding:"15px 38px", borderRadius:14, fontSize:16, fontWeight:600, fontFamily:"'DM Sans',sans-serif", color:"#fff", border:"none",
                      background:T.grad, backgroundSize:"200% 200%", animation:"gradShift 4s ease infinite",
                      boxShadow:`0 10px 40px ${T.accent}40` }}>
                    Search Flights ✈
                  </button>
                  <button onClick={goSearch} className="shine-btn"
                    style={{ padding:"15px 38px", borderRadius:14, fontSize:16, fontWeight:500, fontFamily:"'DM Sans',sans-serif", color:"#0a0a0a",
                      background:"#fff", border:"1.5px solid rgba(0,0,0,0.1)", boxShadow:"0 4px 18px rgba(0,0,0,0.07)" }}>
                    Book a Bus 🚌
                  </button>
                  <button onClick={() => navigate("/register")}
                    style={{ padding:"15px 26px", borderRadius:14, fontSize:15, fontWeight:500, fontFamily:"'DM Sans',sans-serif", color:"#888",
                      background:"transparent", border:"1.5px solid rgba(0,0,0,0.09)", cursor:"pointer" }}>
                    Create Account →
                  </button>
                </div>

                {/* Trust pills */}
                <div style={{ display:"flex", gap:24, marginTop:40, flexWrap:"wrap",
                  opacity: heroReady ? 0.6 : 0, transition:"opacity 0.7s 2.4s ease" }}>
                  {["⚡ AI-Powered","📊 Real-time results","🔒 Trusted partners","500+ Routes"].map(b => (
                    <span key={b} style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:"#999", letterSpacing:"0.05em" }}>{b}</span>
                  ))}
                  <div style={{ width:"100%", marginTop:4, fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#bbb" }}>
                    Powered by AI · Real-time results · Trusted booking partners
                  </div>
                </div>
              </div>

              {/* Search mockup — right */}
              <div className="mockup-box" style={{ flexShrink:0, animation:"floatY 6s ease-in-out infinite",
                opacity: heroReady ? 1 : 0, transition:"opacity 0.8s 2.5s ease" }}>
                <SearchMockup accent={T.accent}/>
              </div>
            </div>
          </div>

          {/* Scroll cue */}
          <div style={{ position:"absolute", bottom:36, left:"50%", transform:"translateX(-50%)", display:"flex", flexDirection:"column", alignItems:"center", gap:6, animation:"floatY 2s ease-in-out infinite" }}>
            <span style={{ fontFamily:"'Space Mono',monospace", fontSize:8, color:"#ccc", letterSpacing:"0.2em" }}>SCROLL</span>
            <div style={{ width:1, height:36, background:`linear-gradient(to bottom,${T.accent}80,transparent)` }}/>
          </div>
        </section>

        {/* ══════════════════════════════════
            HOW IT WORKS
        ══════════════════════════════════ */}
        <section id="how-it-works" ref={sec2Ref} style={{ minHeight:"100vh", background:THEMES[1].bg, position:"relative", overflow:"hidden", padding:"110px 5%", display:"flex", alignItems:"center", transition:"background 1.5s ease" }}>
          <div style={{ position:"absolute", top:"50%", right:"-8%", width:500, height:500, borderRadius:"50%",
            background:`radial-gradient(circle,${THEMES[1].accent}08,transparent 70%)`,
            transform:`translateY(calc(-50% + ${sec2Offset}px))`, pointerEvents:"none", transition:"transform 0.1s linear" }}/>
          <div style={{ position:"relative", zIndex:2, width:"100%" }}>
            <Reveal>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:THEMES[1].accent, letterSpacing:"0.22em", marginBottom:16 }}>HOW IT WORKS</div>
              <BlurText text="Book like you text a friend." style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:300, fontSize:"clamp(30px,4.5vw,64px)", color:THEMES[1].text, marginBottom:10 }}/>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:300, fontSize:"clamp(30px,4.5vw,64px)", marginBottom:64,
                background:THEMES[1].grad, WebkitBackgroundClip:"text", backgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                No learning curve.
              </div>
            </Reveal>
            <div className="how-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:24 }}>
              {[
                { n:"01", icon:"💬", title:"Type Naturally", desc:"Any language, any style. 'BLR to GOA kal cheap' — Alvryn understands context, dates and budgets perfectly." },
                { n:"02", icon:"⚡", title:"AI Finds Best", desc:"Searches flights and buses in real time. Ranked by value, filtered to your exact budget." },
                { n:"03", icon:"✅", title:"Book in 60 Seconds", desc:"Enter name, pick your seat, confirm. Your ticket is in your inbox and WhatsApp instantly." },
              ].map((s, i) => (
                <Reveal key={i} delay={i * 140}>
                  <BorderGlowCard accentColor={THEMES[1].accent} style={{ borderRadius:22 }}>
                    <TiltCard style={{ padding:"36px 28px", background:"#fff", borderRadius:22, boxShadow:"0 4px 24px rgba(0,0,0,0.05)", border:"1px solid rgba(0,0,0,0.04)", cursor:"default" }}>
                      <div style={{ fontSize:36, marginBottom:18 }}>{s.icon}</div>
                      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:600, fontSize:28, color:THEMES[1].accent, marginBottom:10 }}>{s.n}</div>
                      <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:18, color:THEMES[1].text, marginBottom:12 }}>{s.title}</div>
                      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, color:"#666", lineHeight:1.7 }}>{s.desc}</div>
                    </TiltCard>
                  </BorderGlowCard>
                </Reveal>
              ))}
            </div>
            <Reveal delay={380}>
              <div style={{ marginTop:44, padding:"16px 24px", borderRadius:14, display:"inline-flex", alignItems:"center", gap:14,
                background:`${THEMES[1].accent}0C`, border:`1px solid ${THEMES[1].accent}20` }}>
                <span>🔐</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, color:"#555" }}>
                  Free account needed — takes 30 seconds.{" "}
                  <span onClick={() => navigate("/register")} style={{ color:THEMES[1].accent, cursor:"pointer", fontWeight:600, textDecoration:"underline" }}>Sign up free →</span>
                </span>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══════════════════════════════════
            FEATURES
        ══════════════════════════════════ */}
        <section id="features" style={{ minHeight:"100vh", background:THEMES[2].bg, position:"relative", overflow:"hidden", padding:"110px 5%", transition:"background 1.5s ease" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, background:`radial-gradient(ellipse at 25% 60%,${THEMES[2].accent}06 0%,transparent 55%)`, pointerEvents:"none" }}/>
          <div style={{ position:"relative", zIndex:2 }}>
            <Reveal style={{ textAlign:"center" }}>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:THEMES[2].accent, letterSpacing:"0.22em", marginBottom:16 }}>FEATURES</div>
              <BlurText text="Everything you need." style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:300, fontSize:"clamp(28px,4vw,58px)", color:THEMES[2].text, marginBottom:10, display:"block" }}/>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:300, fontSize:"clamp(28px,4vw,58px)", marginBottom:70,
                background:THEMES[2].grad, WebkitBackgroundClip:"text", backgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                Nothing you don't.
              </div>
            </Reveal>
            <div className="feat-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:22 }}>
              {features.map((f, i) => (
                <Reveal key={i} delay={i * 75}>
                  <BorderGlowCard accentColor={f.color} style={{ borderRadius:22 }}>
                    <TiltCard style={{ padding:"32px 26px", background:"#fff", borderRadius:22, boxShadow:"0 4px 18px rgba(0,0,0,0.04)", border:"1px solid rgba(0,0,0,0.04)", cursor:"default" }}>
                      <div style={{ fontSize:34, marginBottom:16 }}>{f.icon}</div>
                      <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:17, color:"#0a0a0a", marginBottom:10 }}>{f.title}</div>
                      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, color:"#666", lineHeight:1.65 }}>{f.desc}</div>
                      <div style={{ marginTop:20, height:2, borderRadius:2, width:"50%", background:`linear-gradient(90deg,${f.color},transparent)` }}/>
                    </TiltCard>
                  </BorderGlowCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════
            STATS
        ══════════════════════════════════ */}
        <section style={{ minHeight:"45vh", background:THEMES[3].bg, position:"relative", overflow:"hidden", padding:"100px 5%", display:"flex", alignItems:"center", transition:"background 1.5s ease" }}>
          <div style={{ position:"relative", zIndex:2, width:"100%", textAlign:"center" }}>
            <Reveal>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:300, fontSize:"clamp(26px,3.5vw,50px)", color:THEMES[3].text, marginBottom:60 }}>
                Alvryn is growing fast 🚀
              </div>
            </Reveal>
            <div className="stats-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:22 }}>
              {[
                { val:500,  suf:"+", label:"Routes Available" },
                { val:98,    suf:"%", label:"Satisfaction Rate" },
                { val:500,   suf:"+", label:"Routes Covered" },
                { val:60,    suf:"s", label:"Avg Search Time" },
              ].map((s, i) => (
                <Reveal key={i} delay={i * 90}>
                  <BorderGlowCard accentColor={THEMES[3].accent} style={{ borderRadius:20 }}>
                    <TiltCard style={{ padding:"38px 16px", background:"#fff", borderRadius:20, boxShadow:"0 4px 18px rgba(0,0,0,0.05)", cursor:"default" }}>
                      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:600, fontSize:48, color:THEMES[3].accent, lineHeight:1, animation:"counterUp 0.6s both" }}>
                        <Counter end={s.val} suffix={s.suf}/>
                      </div>
                      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#999", marginTop:8 }}>{s.label}</div>
                    </TiltCard>
                  </BorderGlowCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════
            WHATSAPP
        ══════════════════════════════════ */}
        <section style={{ minHeight:"70vh", background:THEMES[4].bg, position:"relative", overflow:"hidden", padding:"100px 5%", display:"flex", alignItems:"center", transition:"background 1.5s ease" }}>
          <div className="wa-grid" style={{ position:"relative", zIndex:2, width:"100%", display:"grid", gridTemplateColumns:"1fr 1fr", gap:80, alignItems:"center" }}>
            <Reveal>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:THEMES[4].accent, letterSpacing:"0.22em", marginBottom:18 }}>WHATSAPP NATIVE</div>
              <BlurText text="Your entire trip." style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:300, fontSize:"clamp(28px,4vw,54px)", color:THEMES[4].text, marginBottom:8, display:"block" }}/>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:300, fontSize:"clamp(28px,4vw,54px)", marginBottom:28,
                background:THEMES[4].grad, WebkitBackgroundClip:"text", backgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                One chat thread.
              </div>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:16, color:"#666", lineHeight:1.7, marginBottom:32 }}>
                Search flights and buses, pick seats, confirm — all inside WhatsApp. No app download required.
              </p>
              <div style={{ marginBottom:32, padding:"14px 20px", borderRadius:12, background:"rgba(0,0,0,0.03)", border:"1px solid rgba(0,0,0,0.07)", display:"inline-block" }}>
                <span style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:"#555" }}>
                  📱 +1-415-523-8886 · code: <strong>join meal-biggest</strong>
                </span>
              </div>
              <div>
                <button onClick={goSearch} className="shine-btn"
                  style={{ padding:"14px 34px", borderRadius:13, fontSize:15, fontWeight:600, fontFamily:"'DM Sans',sans-serif", color:"#fff", border:"none", cursor:"pointer", background:THEMES[4].grad, boxShadow:`0 8px 28px ${THEMES[4].accent}44` }}>
                  Book Now ✈
                </button>
              </div>
            </Reveal>
            <Reveal delay={200}>
              <TiltCard style={{ maxWidth:310, margin:"0 auto", cursor:"default" }}>
                <div style={{ borderRadius:26, overflow:"hidden", boxShadow:"0 28px 70px rgba(0,0,0,0.13)" }}>
                  <div style={{ background:"#128C7E", padding:"14px 18px", display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:38, height:38, borderRadius:"50%", background:"#fff", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <AlvrynIcon size={26}/>
                    </div>
                    <div>
                      <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, color:"#fff", fontSize:14 }}>Alvryn AI</div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)" }}>● online</div>
                    </div>
                  </div>
                  <div style={{ background:"#E5DDD5", padding:"14px 12px", display:"flex", flexDirection:"column", gap:9 }}>
                    {[
                      { me:false, msg:"BLR to DEL kal under 5000" },
                      { me:true,  msg:"Found 3 flights! ✈️\nSkyWings · ₹3,840 · 6:10AM\nBluJet · ₹4,120 · 9:30AM\nReply 1 or 2 to select" },
                      { me:false, msg:"1" },
                      { me:true,  msg:"✅ Booked! Ticket sent 📧" },
                    ].map((m, i) => (
                      <div key={i} style={{ display:"flex", justifyContent:m.me?"flex-end":"flex-start" }}>
                        <div style={{ maxWidth:"86%", padding:"9px 13px", borderRadius:m.me?"18px 18px 4px 18px":"18px 18px 18px 4px",
                          background:m.me?"#DCF8C6":"#fff", fontSize:12, lineHeight:1.55, whiteSpace:"pre-line",
                          fontFamily:"'DM Sans',sans-serif", color:"#1a1a1a", boxShadow:"0 1px 3px rgba(0,0,0,0.08)" }}>
                          {m.msg}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TiltCard>
            </Reveal>
          </div>
        </section>

        {/* HOW IT WORKS DETAILED */}
        <section style={{ background:"#faf8f4", position:"relative", overflow:"hidden", padding:"100px 5%", transition:"background 1.5s ease" }}>
          <div style={{ position:"relative", zIndex:2, maxWidth:900, margin:"0 auto" }}>
            <Reveal style={{ textAlign:"center", marginBottom:60 }}>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:THEMES[3].accent, letterSpacing:"0.22em", marginBottom:16 }}>THE PROCESS</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:300, fontSize:"clamp(28px,4vw,56px)", color:"#1a1410", lineHeight:1.05, marginBottom:10 }}>How Alvryn works</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:300, fontSize:"clamp(28px,4vw,56px)", lineHeight:1.05, background:THEMES[3].grad, WebkitBackgroundClip:"text", backgroundClip:"text", WebkitTextFillColor:"transparent" }}>in three simple steps.</div>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:16, color:"#666", lineHeight:1.7, maxWidth:600, margin:"20px auto 0" }}>Alvryn is an AI-powered travel search engine. We find the best fares from our trusted partners and redirect you to book securely — no hidden fees, no markup.</p>
            </Reveal>
            <div className="how-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:28 }}>
              {[
                { n:"01", icon:"🔍", title:"Search flights, buses or hotels", desc:"Type your query naturally — in English, Hindi, Tamil or any mix. Try 'cheap flights BLR to GOA Friday' or 'bus bangalore to chennai kal'. Our AI understands dates, budgets, typos and local language phrases.", sub:["Supports 100+ city aliases","Understands all Indian date formats","Works with typos and abbreviations"] },
                { n:"02", icon:"⚡", title:"We compare and rank results", desc:"Alvryn searches across our partner network — trusted travel partners across flights, buses and hotels. Results are ranked by price and value so you decide in seconds.", sub:["Live fares from airline partners","Bus schedules across India","Hotels worldwide"] },
                { n:"03", icon:"🔒", title:"Book securely on partner site", desc:"We redirect you to the official partner booking page in a new tab. Your payment is processed directly by the partner. You always pay the price you see — no extra charges from Alvryn.", sub:["Opens official partner site","256-bit SSL on all partner pages","Ticket directly from the operator"] },
              ].map((s,i)=>(
                <Reveal key={i} delay={i*140}>
                  <div style={{ padding:"36px 28px", background:"rgba(255,255,255,0.88)", backdropFilter:"blur(10px)", borderRadius:22, boxShadow:"0 4px 20px rgba(0,0,0,0.06)", border:"1px solid rgba(201,168,76,0.18)", height:"100%" }}>
                    <div style={{ fontSize:36, marginBottom:16 }}>{s.icon}</div>
                    <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:30, color:"#c9a84c", marginBottom:12 }}>{s.n}</div>
                    <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:18, color:"#1a1410", marginBottom:12, lineHeight:1.3 }}>{s.title}</div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, color:"#555", lineHeight:1.7, marginBottom:18 }}>{s.desc}</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {s.sub.map((point,j)=>(<div key={j} style={{ display:"flex", alignItems:"center", gap:10 }}><div style={{ width:6, height:6, borderRadius:"50%", background:"#c9a84c", flexShrink:0 }}/><span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#666" }}>{point}</span></div>))}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={400}>
              <div style={{ marginTop:40, padding:"20px 28px", background:"rgba(201,168,76,0.07)", borderRadius:16, border:"1px solid rgba(201,168,76,0.2)", display:"flex", gap:16, alignItems:"flex-start", flexWrap:"wrap" }}>
                <span style={{ fontSize:24, flexShrink:0 }}>💡</span>
                <div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:17, color:"#1a1410", marginBottom:6 }}>Why does Alvryn redirect to partner sites?</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, color:"#555", lineHeight:1.7 }}>Alvryn is a travel search and discovery platform. We work with trusted partners — trusted travel partners — who process all payments securely. This means you always get the official ticket directly from the source, backed by the partner's customer support and cancellation policies. Alvryn earns a small referral commission when you book, which keeps our service completely free for you.</div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>


        {/* ══ AI EXPERIENCE SECTION ══ */}
        <section style={{ background:THEMES[1].bg, position:"relative", overflow:"hidden", padding:"100px 5%", transition:"background 1.5s ease" }}>
          <div style={{ position:"relative", zIndex:2, maxWidth:960, margin:"0 auto" }}>
            <Reveal style={{ textAlign:"center", marginBottom:60 }}>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:THEMES[1].accent, letterSpacing:"0.22em", marginBottom:16 }}>AI INTELLIGENCE</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:300, fontSize:"clamp(28px,4vw,56px)", color:THEMES[1].text, lineHeight:1.05, marginBottom:10 }}>Not just search.</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:300, fontSize:"clamp(28px,4vw,56px)", lineHeight:1.05, background:THEMES[1].grad, WebkitBackgroundClip:"text", backgroundClip:"text", WebkitTextFillColor:"transparent" }}>Smart travel decisions.</div>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:16, color:"#666", lineHeight:1.7, maxWidth:580, margin:"20px auto 0" }}>
                Alvryn doesn't just show options — it tells you which one to pick and why. Like having a travel expert in your pocket.
              </p>
            </Reveal>

            {/* Sample AI response UI */}
            <div className="wa-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:48, alignItems:"center" }}>
              <Reveal>
                <div style={{ background:"rgba(255,255,255,0.9)", backdropFilter:"blur(10px)", borderRadius:22, overflow:"hidden", boxShadow:"0 20px 60px rgba(0,0,0,0.08)", border:"1px solid rgba(201,168,76,0.2)" }}>
                  <div style={{ background:"linear-gradient(135deg,#c9a84c,#f0d080,#c9a84c)", backgroundSize:"200% 200%", padding:"14px 20px", display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(255,255,255,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>✈️</div>
                    <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, color:"#1a1410", fontSize:15 }}>Alvryn AI Response</div>
                  </div>
                  <div style={{ padding:"20px" }}>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#555", marginBottom:14, lineHeight:1.6 }}>
                      ✈️ I found the best options for your trip from Bangalore to Mumbai.
                    </div>
                    <div style={{ background:"rgba(201,168,76,0.08)", borderRadius:12, padding:"12px 14px", marginBottom:10, border:"1px solid rgba(201,168,76,0.2)" }}>
                      <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:"#8B6914", marginBottom:6 }}>💡 AI INSIGHT</div>
                      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#1a1410" }}>Morning flights are typically 18% cheaper for this route. Booking now usually saves ₹400–₹800 vs last-minute.</div>
                    </div>
                    {[
                      { label:"🏷️ Likely cheapest", range:"₹3,200–₹3,800", tag:"CHEAPEST", why:"Early morning departure, no frills" },
                      { label:"⚡ Fastest option",   range:"₹4,200–₹4,800", tag:"FASTEST",  why:"Direct, 1h 45m, premium airline" },
                      { label:"⭐ Best overall",     range:"₹3,800–₹4,400", tag:"TOP PICK", why:"Good timing, highly rated airline" },
                    ].map((opt,i)=>(
                      <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", borderRadius:10, background:i===2?"rgba(201,168,76,0.08)":"transparent", border:i===2?"1px solid rgba(201,168,76,0.25)":"1px solid transparent", marginBottom:6 }}>
                        <div>
                          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#1a1410", fontWeight:600 }}>{opt.label}</div>
                          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#888", marginTop:2 }}>{opt.why}</div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:15, color:"#8B6914" }}>{opt.range}</div>
                          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:8, color:i===2?"#c9a84c":"#aaa", marginTop:2 }}>{opt.tag}</div>
                        </div>
                      </div>
                    ))}
                    <div style={{ fontSize:11, color:"#bbb", fontFamily:"'DM Sans',sans-serif", marginTop:8, marginBottom:14 }}>
                      Prices may vary. Live availability shown on partner site.
                    </div>
                    <button style={{ width:"100%", padding:"11px", borderRadius:11, fontSize:14, fontWeight:700, fontFamily:"'Cormorant Garamond',serif", letterSpacing:"0.06em", color:"#1a1410", border:"none", cursor:"pointer", background:"linear-gradient(135deg,#c9a84c,#f0d080,#c9a84c)", backgroundSize:"200% 200%" }}>
                      Check Live Prices →
                    </button>
                  </div>
                </div>
              </Reveal>
              <Reveal delay={180}>
                <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:THEMES[1].accent, letterSpacing:"0.18em", marginBottom:4 }}>DECISION SHORTCUTS</div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:300, fontSize:"clamp(22px,3vw,36px)", color:THEMES[1].text, lineHeight:1.1, marginBottom:8 }}>Make decisions instantly.</div>
                  {[
                    { icon:"💰", label:"Cheapest", desc:"Show the lowest-cost option across all platforms for your route and date." },
                    { icon:"⚡", label:"Fastest",  desc:"Prioritise direct routes and early arrivals. No long layovers." },
                    { icon:"😌", label:"Best comfort", desc:"Highest-rated option balancing price, timing and airline quality." },
                  ].map((item,i)=>(
                    <div key={i} style={{ display:"flex", gap:16, padding:"18px 20px", background:"rgba(255,255,255,0.88)", backdropFilter:"blur(10px)", borderRadius:16, border:"1px solid rgba(201,168,76,0.15)", boxShadow:"0 4px 14px rgba(0,0,0,0.04)" }}>
                      <div style={{ fontSize:28, flexShrink:0 }}>{item.icon}</div>
                      <div>
                        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:18, color:"#1a1410", marginBottom:5 }}>{item.label}</div>
                        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#666", lineHeight:1.6 }}>{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ══ PLAN MY TRIP ══ */}
        <section style={{ background:THEMES[2].bg, position:"relative", overflow:"hidden", padding:"100px 5%", transition:"background 1.5s ease" }}>
          <div style={{ position:"relative", zIndex:2, maxWidth:900, margin:"0 auto" }}>
            <Reveal style={{ textAlign:"center", marginBottom:56 }}>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:THEMES[2].accent, letterSpacing:"0.22em", marginBottom:16 }}>PLAN MY TRIP</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:300, fontSize:"clamp(28px,4vw,56px)", color:THEMES[2].text, lineHeight:1.05, marginBottom:10 }}>Not sure where to go?</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:300, fontSize:"clamp(28px,4vw,56px)", lineHeight:1.05, background:THEMES[2].grad, WebkitBackgroundClip:"text", backgroundClip:"text", WebkitTextFillColor:"transparent" }}>Let Alvryn plan it for you.</div>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:16, color:"#666", lineHeight:1.7, maxWidth:520, margin:"20px auto 0" }}>
                Just tell Alvryn your budget and days. Get a full trip plan — flight, bus, hotel and estimated costs — instantly.
              </p>
            </Reveal>
            <div className="wa-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:40, alignItems:"flex-start" }}>
              <Reveal>
                <div style={{ background:"rgba(255,255,255,0.9)", borderRadius:20, padding:"28px 24px", boxShadow:"0 8px 30px rgba(0,0,0,0.07)", border:"1px solid rgba(201,168,76,0.18)" }}>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:"#888", letterSpacing:"0.15em", marginBottom:12 }}>YOU TYPE</div>
                  <div style={{ background:"rgba(201,168,76,0.07)", borderRadius:12, padding:"14px 16px", fontFamily:"'DM Sans',sans-serif", fontSize:14, color:"#1a1410", lineHeight:1.6, border:"1px solid rgba(201,168,76,0.2)", marginBottom:20 }}>
                    "I have ₹5000 and 2 days — suggest a trip from Bangalore"
                  </div>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:"#888", letterSpacing:"0.15em", marginBottom:12 }}>ALVRYN SUGGESTS</div>
                  <div style={{ borderRadius:14, overflow:"hidden", border:"1px solid rgba(201,168,76,0.2)" }}>
                    <div style={{ background:"linear-gradient(135deg,#c9a84c,#f0d080)", padding:"12px 16px" }}>
                      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:18, color:"#1a1410" }}>🌴 Destination: Goa</div>
                    </div>
                    <div style={{ padding:"16px", background:"rgba(255,255,255,0.95)" }}>
                      {[
                        ["✈️ Travel",  "Approx ₹2,400–₹2,800 round trip"],
                        ["🏨 Stay",    "Approx ₹1,200–₹1,800 (1 night)"],
                        ["🍽️ Extras", "Budget ₹700–₹1,000"],
                        ["💰 Total",   "Approx ₹4,300–₹5,600"],
                      ].map(([k,v])=>(
                        <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid rgba(201,168,76,0.08)", fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>
                          <span style={{ color:"#555" }}>{k}</span>
                          <span style={{ color:"#1a1410", fontWeight:600 }}>{v}</span>
                        </div>
                      ))}
                      <div style={{ fontSize:11, color:"#bbb", marginTop:10, fontFamily:"'DM Sans',sans-serif" }}>Prices are estimates. Live prices shown on partner site.</div>
                    </div>
                  </div>
                </div>
              </Reveal>
              <Reveal delay={160}>
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  {[
                    { dest:"🌴 Goa",    budget:"₹4,000–₹6,000", days:"2–3 days", why:"Beaches, nightlife, great value from Bangalore" },
                    { dest:"🌿 Coorg",  budget:"₹2,500–₹4,000", days:"1–2 days", why:"Coffee estates, waterfalls, peaceful getaway" },
                    { dest:"🏔️ Ooty",   budget:"₹2,000–₹3,500", days:"1–2 days", why:"Hill station, tea gardens, cool weather" },
                    { dest:"🌊 Pondicherry", budget:"₹3,000–₹5,000", days:"2 days", why:"French architecture, beaches, great food" },
                  ].map((d,i)=>(
                    <div key={i} style={{ padding:"18px 20px", background:"rgba(255,255,255,0.88)", backdropFilter:"blur(10px)", borderRadius:16, border:"1px solid rgba(201,168,76,0.15)", boxShadow:"0 4px 14px rgba(0,0,0,0.04)" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:18, color:"#1a1410" }}>{d.dest}</div>
                        <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:"#8B6914" }}>{d.budget}</div>
                      </div>
                      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#888", marginBottom:4 }}>{d.days}</div>
                      <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#555", lineHeight:1.5 }}>{d.why}</div>
                    </div>
                  ))}
                  <div style={{ padding:"14px 18px", background:"rgba(201,168,76,0.07)", borderRadius:14, border:"1px solid rgba(201,168,76,0.2)", fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#555" }}>
                    💬 Also works on WhatsApp — just message us your budget and days.
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ══ TRUSTED PARTNERS ══ */}
        <section style={{ background:"#faf8f4", position:"relative", overflow:"hidden", padding:"70px 5%", transition:"background 1.5s ease" }}>
          <div style={{ position:"relative", zIndex:2, maxWidth:860, margin:"0 auto", textAlign:"center" }}>
            <Reveal>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:THEMES[0].accent, letterSpacing:"0.22em", marginBottom:16 }}>OUR PARTNERS</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:300, fontSize:"clamp(22px,3.5vw,44px)", color:"#1a1410", marginBottom:10 }}>Book with trusted platforms.</div>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:15, color:"#666", lineHeight:1.7, maxWidth:520, margin:"0 auto 40px" }}>
                Alvryn helps you find the best options — bookings are completed securely on leading travel platforms.
              </p>
              <div style={{ display:"flex", gap:20, justifyContent:"center", flexWrap:"wrap", marginBottom:28 }}>
                {[
                  { name:"Aviasales",   icon:"✈️", desc:"Flights worldwide", color:"#e8f4ff" },
                  { name:"RedBus",      icon:"🚌", desc:"Buses across India", color:"#fff3e8" },
                  { name:"Booking.com", icon:"🏨", desc:"Hotels worldwide",  color:"#e8fff3" },
                ].map(p=>(
                  <div key={p.name} style={{ padding:"20px 28px", background:p.color, borderRadius:16, border:"1px solid rgba(0,0,0,0.06)", minWidth:160, flex:1, maxWidth:220 }}>
                    <div style={{ fontSize:28, marginBottom:8 }}>{p.icon}</div>
                    <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:18, color:"#1a1410", marginBottom:4 }}>{p.name}</div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#666" }}>{p.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#aaa", lineHeight:1.7 }}>
                Alvryn is a travel discovery platform. We may earn a commission from partner links at no extra cost to you.
              </div>
            </Reveal>
          </div>
        </section>

        {/* BLOG SECTION */}
        <section style={{ background:"#f5f3ef", position:"relative", overflow:"hidden", padding:"100px 5%", transition:"background 1.5s ease" }}>
          <div style={{ position:"relative", zIndex:2, maxWidth:960, margin:"0 auto" }}>
            <Reveal style={{ marginBottom:56 }}>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:THEMES[0].accent, letterSpacing:"0.22em", marginBottom:16 }}>TRAVEL GUIDE</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:300, fontSize:"clamp(28px,4vw,56px)", color:"#1a1410", lineHeight:1.05, marginBottom:10 }}>Tips, guides and</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:300, fontSize:"clamp(28px,4vw,56px)", lineHeight:1.05, background:THEMES[0].grad, WebkitBackgroundClip:"text", backgroundClip:"text", WebkitTextFillColor:"transparent" }}>smarter travel.</div>
            </Reveal>
            <div className="feat-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:22 }}>
              {[
                { cat:"FLIGHT DEALS", icon:"✈️", color:"#6C63FF", title:"Cheapest flights from Bangalore to Mumbai", summary:"One of India's busiest routes. The cheapest fares — typically Rs.1,800 to Rs.3,500 — appear 3 to 6 weeks in advance. Tuesday and Wednesday departures are consistently cheaper than weekends. Early morning departures before 7 AM are almost always the most affordable on the same day.", tags:["Bangalore","Mumbai","Budget Tips"] },
                { cat:"DESTINATION GUIDE", icon:"🏛️", color:"#EA580C", title:"Best time to visit Delhi — month by month", summary:"October to March is Delhi's golden window — cool mornings and pleasant afternoons. November brings Diwali and perfect 20 degree days. Avoid May to July when temperatures cross 45 degrees. Winter fog in December and January can delay flights, so book morning departures.", tags:["Delhi","Season Guide","Winter Travel"] },
                { cat:"TIPS & TRICKS", icon:"💡", color:"#059669", title:"How to find the lowest flight prices in India", summary:"Book domestic flights 3 to 8 weeks early. Use incognito mode. Set fare alerts on TravelPayouts for your route. Tuesday afternoons are traditionally when airlines release sale fares. Avoid booking on Fridays and Sundays when demand peaks.", tags:["Deals","Booking Tips","Save Money"] },
                { cat:"AIRLINE GUIDE", icon:"🛩️", color:"#0284C7", title:"Top domestic airlines in India — compared", summary:"IndiGo has the most routes and best on-time record at 78 percent. Air India offers the best legroom and a full meal. Akasa Air is often the cheapest on trunk routes. SpiceJet has the most affordable business class upgrade. For short hops under 90 minutes, price is the only real differentiator.", tags:["Airlines","IndiGo","Air India"] },
                { cat:"BUS TRAVEL", icon:"🚌", color:"#7C3AED", title:"Best overnight buses from Bangalore — complete guide", summary:"VRL Travels, SRS Travels and Neeta Tours run premium Volvo AC Sleeper buses from Bangalore to Chennai, Hyderabad, Goa and Mumbai. Book on RedBus 5 to 10 days ahead for the best seats. Window seats in the lower berth sell out first. Always check your boarding point — it may differ from the main bus stand.", tags:["Buses","Bangalore","Overnight Travel"] },
                { cat:"INTERNATIONAL", icon:"🌏", color:"#EA580C", title:"Cheap international flights from India — where to look", summary:"Dubai is India's most connected international destination with 200 plus weekly flights from 8 Indian cities. Singapore and Bangkok are the next cheapest. TravelPayouts aggregates fares from 700 plus airlines globally. Fly on Tuesdays or Wednesdays for up to 25 percent cheaper fares than weekends.", tags:["International","Dubai","Budget"] },
                { cat:"TRAVEL TIPS", icon:"🎒", color:"#059669", title:"India's top 5 weekend getaways reachable by bus", summary:"Coorg from Bangalore (4 hours). Pondicherry from Chennai (3.5 hours). Hampi from Bangalore (8 hours overnight). Munnar from Kochi (4 hours). Manali from Delhi (14 hours overnight). All bookable on RedBus at affordable fares — no flights needed.", tags:["Weekend Trips","Buses","Budget Travel"] },
                { cat:"BOOKING GUIDE", icon:"📱", color:"#6C63FF", title:"How to book flights on WhatsApp — Alvryn AI guide", summary:"Alvryn's WhatsApp assistant is live and free. Send 'flights bangalore to mumbai tomorrow' to plus 1-415-523-8886 after joining with code 'join meal-biggest'. The AI understands natural language, typos and Hindi-English mix. It shows 3 to 5 options with timing and price, then redirects you to book.", tags:["WhatsApp","How To","Alvryn AI"] },
                { cat:"SEASON GUIDE", icon:"🌤️", color:"#EA580C", title:"Best time to book Goa flights — season guide", summary:"Peak season November to February offers perfect beach weather but fares are 40 to 60 percent higher — book 6 to 8 weeks ahead. Shoulder season October and March gives good weather at 20 to 30 percent lower fares. Off-season monsoon months offer the cheapest hotel rates if you can manage the rain.", tags:["Goa","Season","Beach Travel"] },
              ].map((post,i)=>(
                <Reveal key={i} delay={i*60}>
                  <div style={{ background:"rgba(255,255,255,0.9)", backdropFilter:"blur(10px)", borderRadius:20, overflow:"hidden", boxShadow:"0 4px 18px rgba(0,0,0,0.06)", border:"1px solid rgba(201,168,76,0.12)", display:"flex", flexDirection:"column", transition:"transform 0.2s,box-shadow 0.2s" }}
                    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="0 12px 40px rgba(0,0,0,0.1)";}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 4px 18px rgba(0,0,0,0.06)";}}>
                    <div style={{ background:`${post.color}12`, borderBottom:`2px solid ${post.color}22`, padding:"10px 18px", display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:16 }}>{post.icon}</span>
                      <span style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:post.color, fontWeight:700, letterSpacing:"0.12em" }}>{post.cat}</span>
                    </div>
                    <div style={{ padding:"20px 20px 22px", flex:1, display:"flex", flexDirection:"column" }}>
                      <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:17, color:"#1a1410", marginBottom:12, lineHeight:1.35 }}>{post.title}</h3>
                      <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#555", lineHeight:1.7, flex:1 }}>{post.summary}</p>
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:16 }}>
                        {post.tags.map(tag=>(<span key={tag} style={{ padding:"3px 10px", borderRadius:100, fontSize:11, background:`${post.color}10`, border:`1px solid ${post.color}25`, color:post.color, fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>{tag}</span>))}
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════
            FINAL CTA
        ══════════════════════════════════ */}
        <section id="cta" style={{ minHeight:"60vh", background:THEMES[0].bg, position:"relative", overflow:"hidden", padding:"110px 5%", display:"flex", alignItems:"center", justifyContent:"center", textAlign:"center", transition:"background 1.5s ease" }}>
          <div style={{ position:"relative", zIndex:2, maxWidth:640 }}>
            <Reveal>
              <div style={{ animation:"floatY 4s ease-in-out infinite", marginBottom:30 }}>
                <AlvrynIcon size={72} animate/>
              </div>
              <BlurText text="Start planning your next trip." style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:300, fontSize:"clamp(32px,5vw,66px)", color:"#1a1410", lineHeight:1.05, display:"block", marginBottom:24 }}/>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:17, color:"#666", lineHeight:1.7, marginBottom:52 }}>
                India's most intelligent travel booking platform. Best fares on flights and buses, instantly.
              </p>
              <div className="cta-row" style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
                <button onClick={() => navigate("/register")} className="shine-btn"
                  style={{ padding:"16px 44px", borderRadius:14, fontSize:16, fontWeight:600, fontFamily:"'DM Sans',sans-serif", color:"#fff", border:"none", cursor:"pointer",
                    background:THEMES[0].grad, backgroundSize:"200% 200%", animation:"gradShift 3s ease infinite",
                    boxShadow:`0 12px 48px ${THEMES[0].accent}44` }}>
                  Create Free Account ✈
                </button>
                <button onClick={() => navigate("/login")}
                  style={{ padding:"16px 36px", borderRadius:14, fontSize:16, fontWeight:500, fontFamily:"'DM Sans',sans-serif", color:"#0a0a0a",
                    background:"#fff", border:"1.5px solid rgba(0,0,0,0.1)", boxShadow:"0 4px 18px rgba(0,0,0,0.06)", cursor:"pointer" }}>
                  Sign In →
                </button>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══ FOOTER ══ */}
        <footer style={{ background:"#f5f5f3", borderTop:"1px solid rgba(0,0,0,0.06)", padding:"48px 5%" }}>
          <div className="footer-grid" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:32 }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                <AlvrynIcon size={34}/>
                <div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:600, fontSize:18, color:"#0a0a0a", letterSpacing:"0.1em" }}>ALVRYN</div>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:7, color:THEMES[0].accent, letterSpacing:"0.2em" }}>TRAVEL BEYOND BOUNDARIES</div>
                </div>
              </div>
              <div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#aaa", marginBottom:5 }}>© 2026 Alvryn · Built with ☕ in Bangalore</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#bbb", lineHeight:1.5, maxWidth:320 }}>Alvryn is a travel discovery platform. We may earn a commission from partner links at no extra cost to you.</div>
            </div>
            </div>
            <div style={{ display:"flex", gap:40, flexWrap:"wrap" }}>
              <div>
                <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:"#bbb", letterSpacing:"0.15em", marginBottom:16 }}>COMPANY</div>
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {[["About Us","about"],["Terms & Conditions","terms"],["Privacy Policy","privacy"],["Contact","contact"]].map(([l,k]) => (
                    <span key={k} onClick={() => setModal(k)}
                      style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, color:"#555", cursor:"pointer", transition:"color 0.2s" }}
                      onMouseEnter={e=>e.target.style.color=THEMES[0].accent}
                      onMouseLeave={e=>e.target.style.color="#555"}>
                      {l}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:"#bbb", letterSpacing:"0.15em", marginBottom:16 }}>TRAVEL</div>
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {["Flights","Buses","WhatsApp Booking"].map(l => (
                    <span key={l} onClick={() => { if(localStorage.getItem("token")) navigate("/search"); else navigate("/login"); }}
                      style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, color:"#555", cursor:"pointer", transition:"color 0.2s" }}
                      onMouseEnter={e=>e.target.style.color=THEMES[0].accent}
                      onMouseLeave={e=>e.target.style.color="#555"}>
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}

/* ─── SEARCH MOCKUP CARD ────────────────────────────────────────────────────── */
function SearchMockup({ accent }) {
  const queries = ["Flights BLR → GOA Friday under ₹3500","Bus Bangalore to Chennai tomorrow 6AM","Cheapest DEL to BOM next week"];
  const [qi, setQi] = useState(0);
  useEffect(() => { const t = setInterval(() => setQi(q => (q+1)%queries.length), 3400); return () => clearInterval(t); }, [queries.length]);
  const results = [
    { name:"SkyWings", code:"SW-204", time:"06:10→08:55", price:"₹3,240", tag:"BEST" },
    { name:"BluJet",   code:"BJ-501", time:"09:30→12:15", price:"₹3,840", tag:"" },
    { name:"AirFlow",  code:"AF-173", time:"14:20→17:05", price:"₹4,100", tag:"" },
  ];
  return (
    <div style={{ width:460, background:"#fff", borderRadius:22, boxShadow:"0 32px 80px rgba(0,0,0,0.10)", overflow:"hidden", border:"1px solid rgba(0,0,0,0.05)" }}>
      <div style={{ background:"#f4f4f6", padding:"12px 16px", display:"flex", alignItems:"center", gap:7, borderBottom:"1px solid rgba(0,0,0,0.05)" }}>
        {["#FF5F57","#FFBD2E","#28CA41"].map(c=><div key={c} style={{width:11,height:11,borderRadius:"50%",background:c}}/>)}
        <div style={{ flex:1, background:"#fff", borderRadius:7, padding:"5px 14px", marginLeft:8, fontSize:11, color:"#bbb", fontFamily:"'DM Sans',sans-serif" }}>alvryn.in/search</div>
      </div>
      <div style={{ padding:"18px 18px 8px" }}>
        <div style={{ background:"#f8f8f8", borderRadius:12, padding:"12px 15px", display:"flex", alignItems:"center", gap:10, border:`1.5px solid ${accent}33` }}>
          <span>🔍</span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#555", flex:1 }}>
            {queries[qi]}<span style={{ animation:"blink 0.9s step-end infinite", color:accent }}>|</span>
          </span>
        </div>
      </div>
      <div style={{ padding:"8px 18px 18px", display:"flex", flexDirection:"column", gap:8 }}>
        {results.map((f,i)=>(
          <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", borderRadius:11,
            background:i===0?`${accent}0E`:"#fafafa", border:`1px solid ${i===0?accent+"26":"rgba(0,0,0,0.04)"}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:9, background:`${accent}14`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>✈️</div>
              <div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:13, color:"#111" }}>{f.name} <span style={{ fontWeight:400, color:"#ccc", fontSize:11 }}>{f.code}</span></div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5, color:"#999" }}>{f.time}</div>
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:800, fontSize:14, color:i===0?accent:"#111" }}>{f.price}</div>
              {f.tag&&<div style={{ fontFamily:"'Space Mono',monospace", fontSize:8, background:accent, color:"#fff", padding:"2px 5px", borderRadius:4, marginTop:2 }}>{f.tag}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}