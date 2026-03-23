import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const SHARED_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  @keyframes fadeUp    { from{opacity:0;transform:translateY(22px);}to{opacity:1;transform:translateY(0);} }
  @keyframes floatUD   { 0%,100%{transform:translateY(0);}50%{transform:translateY(-9px);} }
  @keyframes blink     { 50%{opacity:0;} }
  @keyframes gradShift { 0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;} }
  @keyframes planeOrbit{ from{transform:rotate(0deg) translateX(22px) rotate(0deg);}to{transform:rotate(360deg) translateX(22px) rotate(-360deg);} }
  @keyframes orbitRing { from{transform:rotate(0deg);}to{transform:rotate(360deg);} }
  @keyframes pulseRing { 0%{transform:translate(-50%,-50%) scale(1);opacity:0.4;}100%{transform:translate(-50%,-50%) scale(2.3);opacity:0;} }
  ::-webkit-scrollbar{width:3px;}
  ::-webkit-scrollbar-thumb{background:#6C63FF;border-radius:2px;}
`;

function AlvrynIcon({ size = 40, spin = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <defs>
        <linearGradient id="ig_a2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6C63FF"/><stop offset="100%" stopColor="#00C2FF"/>
        </linearGradient>
        <linearGradient id="ig_p2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B6B"/><stop offset="100%" stopColor="#FFD93D"/>
        </linearGradient>
      </defs>
      <ellipse cx="30" cy="30" rx="27" ry="11"
        stroke="url(#ig_a2)" strokeWidth="1.2" strokeDasharray="5 3" opacity="0.45"
        style={spin ? { animation:"orbitRing 5s linear infinite", transformOrigin:"30px 30px" } : {}}/>
      <text x="10" y="47" fontFamily="'Syne',sans-serif" fontWeight="900"
        fontSize="40" fill="url(#ig_a2)">A</text>
      <g style={spin ? { animation:"planeOrbit 5s linear infinite", transformOrigin:"30px 30px" } : {}}>
        <path d="M57 30 L50 26 L52 30 L50 34 Z" fill="url(#ig_p2)"/>
        <path d="M51 26.5 L51 22 L54 27 Z" fill="url(#ig_p2)" opacity="0.75"/>
      </g>
    </svg>
  );
}

function AuroraBackground({ colors, opacity = 1 }) {
  const ref = useRef(null);
  const raf = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    let W = c.offsetWidth, H = c.offsetHeight;
    c.width = W; c.height = H;
    const blobs = Array.from({ length: 5 }, (_, i) => ({
      x: Math.random()*W, y: Math.random()*H,
      vx: (Math.random()-0.5)*0.5, vy: (Math.random()-0.5)*0.5,
      r: 200+Math.random()*180, ci: i % colors.length,
    }));
    const resize = () => { W=c.offsetWidth; H=c.offsetHeight; c.width=W; c.height=H; };
    window.addEventListener("resize", resize);
    const draw = () => {
      ctx.clearRect(0,0,W,H);
      blobs.forEach(b => {
        b.x+=b.vx; b.y+=b.vy;
        if(b.x<-b.r||b.x>W+b.r) b.vx*=-1;
        if(b.y<-b.r||b.y>H+b.r) b.vy*=-1;
        const g=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r);
        g.addColorStop(0, colors[b.ci%colors.length]+"28");
        g.addColorStop(1,"transparent");
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fill();
      });
      raf.current=requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener("resize",resize); };
  }, [colors]);
  return <canvas ref={ref} style={{ position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:0,opacity }}/>;
}

// ── SPLASH SCREEN — ALVRYN types in big ──────────────────────────────────────
function SplashScreen({ onDone }) {
  const [text, setText] = useState("");
  const [phase, setPhase] = useState("typing");
  const full = "ALVRYN";
  useEffect(() => {
    let i = 0;
    const type = () => {
      if (i <= full.length) {
        setText(full.slice(0, i)); i++;
        setTimeout(type, i === 1 ? 300 : 120);
      } else {
        setTimeout(() => setPhase("fading"), 900);
        setTimeout(() => onDone(), 1800);
      }
    };
    setTimeout(type, 400);
  }, [onDone]);
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9999, background:"#f8f8fa",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      opacity: phase==="fading" ? 0 : 1,
      transition:"opacity 0.8s cubic-bezier(0.4,0,0.2,1)",
      pointerEvents: phase==="fading" ? "none" : "all",
    }}>
      <AuroraBackground colors={["#6C63FF","#00C2FF","#a78bfa"]} opacity={0.45}/>
      <div style={{ position:"relative", zIndex:2, textAlign:"center" }}>
        <div style={{ animation:"floatUD 3s ease-in-out infinite", marginBottom:28 }}>
          <AlvrynIcon size={68} spin/>
        </div>
        <div style={{
          fontFamily:"'Syne',sans-serif", fontWeight:900,
          fontSize:"clamp(72px,15vw,150px)",
          background:"linear-gradient(135deg,#6C63FF,#00C2FF)",
          WebkitBackgroundClip:"text", backgroundClip:"text", WebkitTextFillColor:"transparent",
          letterSpacing:"-0.05em", lineHeight:1, minWidth:"5ch",
        }}>
          {text}<span style={{ animation:"blink 0.7s step-end infinite", WebkitTextFillColor:"#6C63FF" }}>|</span>
        </div>
        <div style={{
          fontFamily:"'Space Mono',monospace", fontSize:"clamp(11px,1.5vw,14px)",
          color:"#bbb", letterSpacing:"0.3em", marginTop:20,
          opacity: text.length===full.length ? 1 : 0,
          transform: text.length===full.length ? "translateY(0)" : "translateY(8px)",
          transition:"all 0.5s ease",
        }}>TRAVEL BEYOND BOUNDARIES</div>
      </div>
    </div>
  );
}

function TypeWriter({ phrases, style }) {
  const [pi, setPi] = useState(0);
  const [text, setText] = useState("");
  const [del, setDel] = useState(false);
  const [ci, setCi] = useState(0);
  useEffect(() => {
    const w = phrases[pi % phrases.length];
    if (!del) {
      if (ci < w.length) { const t=setTimeout(()=>{setText(w.slice(0,ci+1));setCi(c=>c+1);},72); return()=>clearTimeout(t); }
      else { const t=setTimeout(()=>setDel(true),2200); return()=>clearTimeout(t); }
    } else {
      if (ci > 0) { const t=setTimeout(()=>{setText(w.slice(0,ci-1));setCi(c=>c-1);},42); return()=>clearTimeout(t); }
      else { setDel(false); setPi(p=>p+1); }
    }
  }, [ci, del, pi, phrases]);
  return <span style={style}>{text}<span style={{animation:"blink 0.9s step-end infinite"}}>|</span></span>;
}

function Reveal({ children, delay=0, style }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e])=>{ if(e.isIntersecting) setVis(true); },{threshold:0.1});
    if(ref.current) obs.observe(ref.current);
    return ()=>obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity:vis?1:0, transform:vis?"translateY(0)":"translateY(30px)",
      transition:`opacity 0.7s ${delay}ms ease, transform 0.7s ${delay}ms cubic-bezier(0.22,1,0.36,1)`, ...style }}>
      {children}
    </div>
  );
}

function TiltCard({ children, style }) {
  const [t, setT] = useState({ rx:0, ry:0, s:1 });
  return (
    <div
      onMouseMove={e=>{ const r=e.currentTarget.getBoundingClientRect(); setT({rx:((e.clientY-r.top)/r.height-0.5)*-12,ry:((e.clientX-r.left)/r.width-0.5)*12,s:1.02}); }}
      onMouseLeave={()=>setT({rx:0,ry:0,s:1})}
      style={{ transform:`perspective(900px) rotateX(${t.rx}deg) rotateY(${t.ry}deg) scale(${t.s})`,
        transition:"transform 0.25s cubic-bezier(0.34,1.56,0.64,1)", ...style }}>
      {children}
    </div>
  );
}

function Counter({ end, suffix="" }) {
  const [n, setN] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e])=>{
      if(e.isIntersecting&&!started.current) {
        started.current=true;
        const s=Date.now();
        const step=()=>{ const p=Math.min((Date.now()-s)/1800,1); setN(Math.round((1-Math.pow(1-p,3))*end)); if(p<1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
      }
    },{threshold:0.4});
    if(ref.current) obs.observe(ref.current);
    return ()=>obs.disconnect();
  }, [end]);
  return <span ref={ref}>{n.toLocaleString()}{suffix}</span>;
}

const PALETTES = [
  { blobs:["#6C63FF","#00C2FF","#a78bfa"], accent:"#6C63FF", grad:"linear-gradient(135deg,#6C63FF,#00C2FF)" },
  { blobs:["#00B89C","#34D399","#6EE7B7"], accent:"#00B89C", grad:"linear-gradient(135deg,#00B89C,#34D399)" },
  { blobs:["#FF6B6B","#FF8C42","#FFD93D"], accent:"#FF6B6B", grad:"linear-gradient(135deg,#FF6B6B,#FFD93D)" },
  { blobs:["#3B82F6","#6366F1","#8B5CF6"], accent:"#3B82F6", grad:"linear-gradient(135deg,#3B82F6,#8B5CF6)" },
  { blobs:["#EC4899","#F43F5E","#FB923C"], accent:"#EC4899", grad:"linear-gradient(135deg,#EC4899,#FB923C)" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [splashDone, setSplashDone] = useState(false);
  const [heroReady, setHeroReady] = useState(false);
  const [themeIdx, setThemeIdx] = useState(0);
  const [navScrolled, setNavScrolled] = useState(false);
  const T = PALETTES[themeIdx];

  const onSplashDone = useCallback(() => { setSplashDone(true); setTimeout(()=>setHeroReady(true),100); }, []);

  useEffect(() => {
    const fn = () => {
      setNavScrolled(window.scrollY > 40);
      setThemeIdx(Math.min(Math.floor(window.scrollY/window.innerHeight), PALETTES.length-1));
    };
    window.addEventListener("scroll", fn, { passive:true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const goSearch = useCallback(() => {
    navigate(localStorage.getItem("token") ? "/search" : "/login");
  }, [navigate]);

  const line1 = "Travel Beyond";
  const line2 = "Boundaries.";

  const features = [
    { icon:"🧠", title:"AI Natural Search",  desc:"Type like texting. 'Cheapest BLR to GOA this Friday' and you're done.", color:"#6C63FF" },
    { icon:"✈️", title:"Flight Booking",     desc:"500+ routes, real-time fares, instant seat lock + email confirmation.", color:"#00C2FF" },
    { icon:"🚌", title:"Bus Booking",        desc:"AC, Sleeper, Semi-Sleeper. Book buses directly from Alvryn.", color:"#00B89C" },
    { icon:"💬", title:"WhatsApp Native",    desc:"Search, book, get your ticket — without opening a browser.", color:"#25D366" },
    { icon:"⚡", title:"60-Second Booking",  desc:"Search to boarding pass in under a minute. Zero friction.", color:"#FF6B6B" },
    { icon:"🔒", title:"Zero Hidden Fees",   desc:"Price you see is price you pay. Always transparent.", color:"#F59E0B" },
  ];

  return (
    <>
      <style>{SHARED_CSS}</style>
      {!splashDone && <SplashScreen onDone={onSplashDone}/>}
      <div style={{ opacity:splashDone?1:0, transition:"opacity 0.6s ease", fontFamily:"'DM Sans',sans-serif" }}>

        {/* NAVBAR */}
        <nav style={{
          position:"fixed", top:0, left:0, right:0, zIndex:1000, height:66, padding:"0 6%",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          background: navScrolled ? "rgba(248,248,250,0.88)" : "transparent",
          backdropFilter: navScrolled ? "blur(22px)" : "none",
          borderBottom: navScrolled ? "1px solid rgba(0,0,0,0.05)" : "none",
          transition:"all 0.4s ease",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}
            onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}>
            <div style={{ animation:"floatUD 4s ease-in-out infinite" }}><AlvrynIcon size={42} spin/></div>
            <div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:18,
                color:"#0a0a0a", letterSpacing:"-0.04em", lineHeight:1.1 }}>ALVRYN</div>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:8,
                color:T.accent, letterSpacing:"0.18em" }}>TRAVEL BEYOND</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:28 }}>
            {["How it works","Features","Flights","Buses"].map(l => (
              <span key={l} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:500,
                color:"#0a0a0a", opacity:0.65, cursor:"pointer", transition:"opacity 0.2s" }}
                onMouseEnter={e=>e.target.style.opacity=1}
                onMouseLeave={e=>e.target.style.opacity=0.65}>{l}</span>
            ))}
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={()=>navigate("/login")}
              style={{ padding:"9px 22px", borderRadius:12, fontSize:14, fontWeight:600,
                fontFamily:"'DM Sans',sans-serif", background:"transparent", color:"#0a0a0a",
                border:"1.5px solid rgba(0,0,0,0.13)", cursor:"pointer" }}>Sign In</button>
            <button onClick={()=>navigate("/register")}
              style={{ padding:"9px 22px", borderRadius:12, fontSize:14, fontWeight:700,
                fontFamily:"'Syne',sans-serif", color:"#fff", border:"none", cursor:"pointer",
                background:T.grad, boxShadow:`0 4px 18px ${T.accent}44`,
                transition:"transform 0.2s" }}
              onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
              onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>Get Started</button>
          </div>
        </nav>

        {/* ══ HERO ══ */}
        <section style={{ minHeight:"100vh", background:"#f8f8fa",
          display:"flex", alignItems:"center", position:"relative", overflow:"hidden", padding:"0 6%" }}>
          <AuroraBackground colors={PALETTES[0].blobs}/>
          <div style={{ position:"relative", zIndex:2, paddingTop:80, width:"100%",
            display:"flex", alignItems:"center", justifyContent:"space-between", gap:40 }}>
            <div style={{ maxWidth:600 }}>
              {/* Badge */}
              <div style={{
                display:"inline-flex", alignItems:"center", gap:8,
                padding:"8px 18px", borderRadius:100,
                background:`${T.accent}0F`, border:`1px solid ${T.accent}28`,
                marginBottom:44,
                opacity:heroReady?1:0, transform:heroReady?"translateY(0)":"translateY(-14px)",
                transition:"all 0.5s ease",
              }}>
                <span style={{ width:7, height:7, borderRadius:"50%", background:T.accent,
                  boxShadow:`0 0 8px ${T.accent}`, display:"inline-block" }}/>
                <span style={{ fontFamily:"'Space Mono',monospace", fontSize:10,
                  color:T.accent, letterSpacing:"0.13em" }}>NOW LIVE · INDIA'S SMARTEST TRAVEL AI</span>
              </div>

              {/* KINETIC TITLE — each char drops in, forced single line */}
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, lineHeight:1, userSelect:"none" }}>
                <div style={{ whiteSpace:"nowrap" }}>
                  {line1.split("").map((ch,i)=>(
                    <span key={i} style={{
                      display:"inline-block",
                      opacity:heroReady?1:0,
                      transform:heroReady?"translateY(0) rotate(0deg)":"translateY(80px) rotate(9deg)",
                      transition:`opacity 0.55s ${i*55}ms cubic-bezier(0.22,1,0.36,1),transform 0.65s ${i*55}ms cubic-bezier(0.34,1.56,0.64,1)`,
                      fontSize:"clamp(38px,5.5vw,82px)", color:"#0a0a0a", letterSpacing:"-0.03em",
                    }}>{ch===" "?"\u00A0":ch}</span>
                  ))}
                </div>
                <div style={{ whiteSpace:"nowrap" }}>
                  {line2.split("").map((ch,i)=>(
                    <span key={i} style={{
                      display:"inline-block",
                      opacity:heroReady?1:0,
                      transform:heroReady?"translateY(0) rotate(0deg)":"translateY(80px) rotate(-7deg)",
                      transition:`opacity 0.55s ${line1.length*55+120+i*55}ms cubic-bezier(0.22,1,0.36,1),transform 0.65s ${line1.length*55+120+i*55}ms cubic-bezier(0.34,1.56,0.64,1)`,
                      fontSize:"clamp(38px,5.5vw,82px)",
                      background:T.grad, WebkitBackgroundClip:"text", backgroundClip:"text",
                      WebkitTextFillColor:"transparent", letterSpacing:"-0.03em",
                    }}>{ch===" "?"\u00A0":ch}</span>
                  ))}
                </div>
              </div>

              {/* Typewriter */}
              <div style={{ marginTop:26, marginBottom:46, fontSize:"clamp(15px,1.8vw,21px)",
                color:"#555", lineHeight:1.5,
                opacity:heroReady?1:0, transform:heroReady?"translateY(0)":"translateY(14px)",
                transition:"all 0.6s 1.6s ease" }}>
                Book flights & buses with{" "}
                <TypeWriter phrases={["plain English.","a WhatsApp message.","AI superpowers.","zero hidden fees."]}
                  style={{ fontWeight:700, color:T.accent }}/>
              </div>

              {/* CTAs */}
              <div style={{ display:"flex", gap:13, flexWrap:"wrap",
                opacity:heroReady?1:0, transform:heroReady?"translateY(0)":"translateY(14px)",
                transition:"all 0.6s 1.9s ease" }}>
                <button onClick={goSearch}
                  style={{ padding:"15px 36px", borderRadius:14, fontSize:16, fontWeight:800,
                    fontFamily:"'Syne',sans-serif", color:"#fff", border:"none", cursor:"pointer",
                    background:T.grad, backgroundSize:"200% 200%", animation:"gradShift 4s ease infinite",
                    boxShadow:`0 10px 36px ${T.accent}44` }}>Search Flights ✈</button>
                <button onClick={goSearch}
                  style={{ padding:"15px 36px", borderRadius:14, fontSize:16, fontWeight:700,
                    fontFamily:"'DM Sans',sans-serif", color:"#0a0a0a", border:"1.5px solid rgba(0,0,0,0.1)",
                    background:"#fff", boxShadow:"0 4px 16px rgba(0,0,0,0.06)", cursor:"pointer" }}>Book a Bus 🚌</button>
                <button onClick={()=>navigate("/register")}
                  style={{ padding:"15px 24px", borderRadius:14, fontSize:15, fontWeight:600,
                    fontFamily:"'DM Sans',sans-serif", color:"#888", background:"transparent",
                    border:"1.5px solid rgba(0,0,0,0.1)", cursor:"pointer" }}>Create Account →</button>
              </div>

              {/* Trust */}
              <div style={{ display:"flex", gap:20, marginTop:38, flexWrap:"wrap",
                opacity:heroReady?1:0, transition:"opacity 0.6s 2.2s ease" }}>
                {["🔒 Secure","📧 Instant Tickets","💬 WhatsApp","500+ Routes"].map(b=>(
                  <span key={b} style={{ fontFamily:"'Space Mono',monospace", fontSize:10,
                    color:"#bbb", letterSpacing:"0.05em" }}>{b}</span>
                ))}
              </div>
            </div>

            {/* Search mockup */}
            <div style={{ flexShrink:0, animation:"floatUD 6s ease-in-out infinite",
              opacity:heroReady?1:0, transition:"opacity 0.7s 2.4s ease" }}>
              <SearchMockupCard accent={T.accent}/>
            </div>
          </div>
          {/* Scroll cue */}
          <div style={{ position:"absolute", bottom:32, left:"50%", transform:"translateX(-50%)",
            display:"flex", flexDirection:"column", alignItems:"center", gap:6,
            animation:"floatUD 2.2s ease-in-out infinite" }}>
            <span style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:"#ccc", letterSpacing:"0.18em" }}>SCROLL</span>
            <div style={{ width:1, height:32, background:`linear-gradient(to bottom,${T.accent}70,transparent)` }}/>
          </div>
        </section>

        {/* ══ SECTION 2 — HOW IT WORKS ══ */}
        <section style={{ minHeight:"100vh", background:"#f8f8fa", position:"relative",
          overflow:"hidden", padding:"120px 6%", display:"flex", alignItems:"center" }}>
          <AuroraBackground colors={PALETTES[1].blobs}/>
          <div style={{ position:"relative", zIndex:2, width:"100%" }}>
            <Reveal>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:PALETTES[1].accent,
                letterSpacing:"0.2em", marginBottom:14 }}>HOW IT WORKS</div>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:900,
                fontSize:"clamp(30px,4.5vw,60px)", color:"#0a0a0a", lineHeight:1.05,
                marginBottom:10, whiteSpace:"nowrap" }}>Book like you text a friend.</h2>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:900,
                fontSize:"clamp(30px,4.5vw,60px)", lineHeight:1.05, marginBottom:60,
                background:PALETTES[1].grad, WebkitBackgroundClip:"text",
                backgroundClip:"text", WebkitTextFillColor:"transparent", whiteSpace:"nowrap" }}>
                No learning curve.
              </h2>
            </Reveal>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:22 }}>
              {[
                { n:"01", icon:"💬", title:"Type Naturally", desc:"'Flights BLR to GOA Friday under ₹3500' — Alvryn understands context, dates and budgets." },
                { n:"02", icon:"⚡", title:"AI Finds Best",  desc:"Searches across airlines and bus operators in real time. Ranked by value." },
                { n:"03", icon:"✅", title:"Book in Seconds", desc:"Pick, confirm, done. Ticket arrives via email + WhatsApp instantly." },
              ].map((s,i)=>(
                <Reveal key={i} delay={i*130}>
                  <TiltCard style={{ padding:"36px 28px", background:"#fff", borderRadius:20,
                    boxShadow:"0 4px 22px rgba(0,0,0,0.05)", border:"1px solid rgba(0,0,0,0.05)", cursor:"default" }}>
                    <div style={{ fontSize:36, marginBottom:16 }}>{s.icon}</div>
                    <div style={{ fontFamily:"'Space Mono',monospace", fontWeight:700, fontSize:24,
                      color:PALETTES[1].accent, marginBottom:10 }}>{s.n}</div>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:18,
                      color:"#0a0a0a", marginBottom:12 }}>{s.title}</div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, color:"#777", lineHeight:1.65 }}>{s.desc}</div>
                  </TiltCard>
                </Reveal>
              ))}
            </div>
            <Reveal delay={360}>
              <div style={{ marginTop:40, padding:"16px 22px", borderRadius:14, display:"inline-flex",
                alignItems:"center", gap:14,
                background:`${PALETTES[1].accent}0C`, border:`1px solid ${PALETTES[1].accent}20` }}>
                <span style={{ fontSize:20 }}>🔐</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, color:"#555" }}>
                  Free account needed to search & book — takes 30 seconds.{" "}
                  <span onClick={()=>navigate("/register")}
                    style={{ color:PALETTES[1].accent, cursor:"pointer", fontWeight:700, textDecoration:"underline" }}>
                    Sign up free →
                  </span>
                </span>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══ SECTION 3 — FEATURES ══ */}
        <section style={{ minHeight:"100vh", background:"#f8f8fa", position:"relative",
          overflow:"hidden", padding:"120px 6%" }}>
          <AuroraBackground colors={PALETTES[2].blobs}/>
          <div style={{ position:"relative", zIndex:2 }}>
            <Reveal style={{ textAlign:"center" }}>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:PALETTES[2].accent,
                letterSpacing:"0.2em", marginBottom:14 }}>FEATURES</div>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:900,
                fontSize:"clamp(28px,4vw,54px)", color:"#0a0a0a", marginBottom:10 }}>
                Everything you need.
              </h2>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:900,
                fontSize:"clamp(28px,4vw,54px)", marginBottom:64,
                background:PALETTES[2].grad, WebkitBackgroundClip:"text",
                backgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                Nothing you don't.
              </h2>
            </Reveal>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
              {features.map((f,i)=>(
                <Reveal key={i} delay={i*70}>
                  <TiltCard style={{ padding:"32px 26px", background:"#fff", borderRadius:20,
                    boxShadow:"0 4px 18px rgba(0,0,0,0.05)", border:"1px solid rgba(0,0,0,0.05)",
                    cursor:"default", transition:"transform 0.3s,box-shadow 0.3s" }}>
                    <div style={{ fontSize:34, marginBottom:16 }}>{f.icon}</div>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:18,
                      color:"#0a0a0a", marginBottom:10 }}>{f.title}</div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, color:"#777", lineHeight:1.65 }}>
                      {f.desc}
                    </div>
                    <div style={{ marginTop:22, height:3, borderRadius:2, width:"55%",
                      background:`linear-gradient(90deg,${f.color},transparent)` }}/>
                  </TiltCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ SECTION 4 — STATS ══ */}
        <section style={{ minHeight:"50vh", background:"#f8f8fa", position:"relative",
          overflow:"hidden", padding:"110px 6%", display:"flex", alignItems:"center" }}>
          <AuroraBackground colors={PALETTES[3].blobs}/>
          <div style={{ position:"relative", zIndex:2, width:"100%", textAlign:"center" }}>
            <Reveal>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:900,
                fontSize:"clamp(24px,3.5vw,48px)", color:"#0a0a0a", marginBottom:60 }}>
                Alvryn is growing fast 🚀
              </h2>
            </Reveal>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:22 }}>
              {[
                {val:12000,suf:"+",label:"Waitlist Members"},
                {val:98,suf:"%",label:"Satisfaction Rate"},
                {val:500,suf:"+",label:"Routes Covered"},
                {val:60,suf:"s",label:"Avg Booking Time"},
              ].map((s,i)=>(
                <Reveal key={i} delay={i*85}>
                  <TiltCard style={{ padding:"38px 16px", background:"#fff", borderRadius:20,
                    boxShadow:"0 4px 18px rgba(0,0,0,0.05)", cursor:"default" }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:44,
                      color:PALETTES[3].accent, lineHeight:1 }}>
                      <Counter end={s.val} suffix={s.suf}/>
                    </div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#999", marginTop:8 }}>
                      {s.label}
                    </div>
                  </TiltCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ SECTION 5 — WHATSAPP ══ */}
        <section style={{ minHeight:"75vh", background:"#f8f8fa", position:"relative",
          overflow:"hidden", padding:"110px 6%", display:"flex", alignItems:"center" }}>
          <AuroraBackground colors={PALETTES[4].blobs}/>
          <div style={{ position:"relative", zIndex:2, width:"100%",
            display:"grid", gridTemplateColumns:"1fr 1fr", gap:80, alignItems:"center" }}>
            <Reveal>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:PALETTES[4].accent,
                letterSpacing:"0.2em", marginBottom:18 }}>WHATSAPP NATIVE</div>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:900,
                fontSize:"clamp(26px,3.8vw,50px)", color:"#0a0a0a", lineHeight:1.05,
                marginBottom:10, whiteSpace:"nowrap" }}>Your entire trip.</h2>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:900,
                fontSize:"clamp(26px,3.8vw,50px)", lineHeight:1.05, marginBottom:26,
                background:PALETTES[4].grad, WebkitBackgroundClip:"text",
                backgroundClip:"text", WebkitTextFillColor:"transparent", whiteSpace:"nowrap" }}>
                One chat thread.
              </h2>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:16, color:"#666",
                lineHeight:1.7, marginBottom:32 }}>
                Flights and buses, all inside WhatsApp. No app download needed.
              </p>
              <div style={{ marginBottom:32, padding:"13px 18px", borderRadius:12,
                background:"rgba(0,0,0,0.03)", border:"1px solid rgba(0,0,0,0.07)",
                display:"inline-block" }}>
                <span style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:"#555" }}>
                  📱 +1-415-523-8886 · code: <strong style={{ color:"#0a0a0a" }}>join meal-biggest</strong>
                </span>
              </div>
              <div>
                <button onClick={goSearch}
                  style={{ padding:"14px 32px", borderRadius:13, fontSize:15, fontWeight:700,
                    fontFamily:"'Syne',sans-serif", color:"#fff", border:"none", cursor:"pointer",
                    background:PALETTES[4].grad, boxShadow:`0 8px 26px ${PALETTES[4].accent}44` }}>
                  Book a Flight Now ✈
                </button>
              </div>
            </Reveal>
            <Reveal delay={180}>
              <TiltCard style={{ maxWidth:310, margin:"0 auto", cursor:"default" }}>
                <div style={{ borderRadius:24, overflow:"hidden",
                  boxShadow:"0 28px 70px rgba(0,0,0,0.12)", border:"1px solid rgba(0,0,0,0.04)" }}>
                  <div style={{ background:"#128C7E", padding:"14px 18px",
                    display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:38, height:38, borderRadius:"50%", background:"#fff",
                      display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <AlvrynIcon size={26} spin/>
                    </div>
                    <div>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, color:"#fff", fontSize:14 }}>Alvryn</div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)" }}>● online</div>
                    </div>
                  </div>
                  <div style={{ background:"#E5DDD5", padding:"14px 12px",
                    display:"flex", flexDirection:"column", gap:9 }}>
                    {[
                      { me:false, msg:"Flight BLR to DEL 28th March under ₹5000 🙏" },
                      { me:true,  msg:"Found 3 flights! ✈️\nSkyWings · ₹3,840 · 6:10AM\nBluJet · ₹4,120 · 9:30AM\nReply 1 or 2 to book" },
                      { me:false, msg:"1" },
                      { me:true,  msg:"✅ Booked!\nSkyWings · ₹3,840\nTicket sent to email 📧" },
                    ].map((m,i)=>(
                      <div key={i} style={{ display:"flex", justifyContent:m.me?"flex-end":"flex-start" }}>
                        <div style={{ maxWidth:"86%", padding:"9px 13px",
                          borderRadius:m.me?"18px 18px 4px 18px":"18px 18px 18px 4px",
                          background:m.me?"#DCF8C6":"#fff", fontSize:12, lineHeight:1.55,
                          whiteSpace:"pre-line", fontFamily:"'DM Sans',sans-serif", color:"#1a1a1a",
                          boxShadow:"0 1px 3px rgba(0,0,0,0.08)",
                          animation:`fadeUp 0.4s ${i*140+300}ms both` }}>
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

        {/* ══ FINAL CTA ══ */}
        <section style={{ minHeight:"70vh", background:"#f8f8fa", position:"relative",
          overflow:"hidden", padding:"120px 6%", display:"flex", alignItems:"center",
          justifyContent:"center", textAlign:"center" }}>
          <AuroraBackground colors={PALETTES[0].blobs}/>
          {[160,280,400].map((r,i)=>(
            <div key={i} style={{ position:"absolute", width:r, height:r, borderRadius:"50%",
              border:`1px solid ${PALETTES[0].accent}18`, top:"50%", left:"50%",
              animation:`pulseRing ${2.5+i}s ease-out infinite`, animationDelay:`${i*0.7}s` }}/>
          ))}
          <div style={{ position:"relative", zIndex:2, maxWidth:620 }}>
            <Reveal>
              <div style={{ animation:"floatUD 4s ease-in-out infinite", marginBottom:28 }}>
                <AlvrynIcon size={70} spin/>
              </div>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:900,
                fontSize:"clamp(34px,5.5vw,70px)", color:"#0a0a0a", lineHeight:1.02, marginBottom:20 }}>
                Ready to fly
              </h2>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:900,
                fontSize:"clamp(34px,5.5vw,70px)", lineHeight:1.02, marginBottom:24,
                background:PALETTES[0].grad, WebkitBackgroundClip:"text",
                backgroundClip:"text", WebkitTextFillColor:"transparent" }}>smarter?</h2>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:17, color:"#777",
                lineHeight:1.7, marginBottom:48 }}>
                India's most intelligent travel booking platform. Best fares on flights and buses, instantly.
              </p>
              <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
                <button onClick={()=>navigate("/register")}
                  style={{ padding:"16px 42px", borderRadius:14, fontSize:16, fontWeight:900,
                    fontFamily:"'Syne',sans-serif", color:"#fff", border:"none", cursor:"pointer",
                    background:PALETTES[0].grad, backgroundSize:"200% 200%",
                    animation:"gradShift 3s ease infinite",
                    boxShadow:`0 12px 46px ${PALETTES[0].accent}44` }}>
                  Create Free Account ✈
                </button>
                <button onClick={()=>navigate("/login")}
                  style={{ padding:"16px 34px", borderRadius:14, fontSize:16, fontWeight:600,
                    fontFamily:"'DM Sans',sans-serif", color:"#0a0a0a", background:"#fff",
                    border:"1.5px solid rgba(0,0,0,0.1)",
                    boxShadow:"0 4px 16px rgba(0,0,0,0.05)", cursor:"pointer" }}>
                  Sign In →
                </button>
              </div>
            </Reveal>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ background:"#f2f2f4", borderTop:"1px solid rgba(0,0,0,0.06)", padding:"40px 6%" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
            flexWrap:"wrap", gap:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <AlvrynIcon size={32}/>
              <div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:15, color:"#0a0a0a" }}>ALVRYN</div>
                <div style={{ fontFamily:"'Space Mono',monospace", fontSize:8, color:PALETTES[0].accent, letterSpacing:"0.18em" }}>TRAVEL BEYOND BOUNDARIES</div>
              </div>
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#aaa" }}>© 2026 Alvryn · Built with ☕ in Bangalore</div>
            <div style={{ display:"flex", gap:24 }}>
              {["Privacy","Terms","Contact"].map(l=>(
                <span key={l} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#aaa", cursor:"pointer" }}>{l}</span>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

// ── Small search mockup card used in hero ─────────────────────────────────────
function SearchMockupCard({ accent }) {
  const queries = [
    "Flights BLR → GOA Friday under ₹3500",
    "Bus Hyderabad to Chennai 6 AM",
    "Cheapest flight Delhi next week",
  ];
  const [qi, setQi] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setQi(q => (q+1) % queries.length), 3200);
    return () => clearInterval(t);
  }, [queries.length]);
  const results = [
    { name:"SkyWings", code:"SW-204", time:"06:10→08:55", price:"₹3,240", tag:"CHEAPEST" },
    { name:"BluJet",   code:"BJ-501", time:"09:30→12:15", price:"₹3,840", tag:"" },
    { name:"AirFlow",  code:"AF-173", time:"14:20→17:05", price:"₹4,100", tag:"" },
  ];
  return (
    <div style={{ width:460, background:"#fff", borderRadius:22,
      boxShadow:"0 32px 80px rgba(0,0,0,0.10)", overflow:"hidden",
      border:"1px solid rgba(0,0,0,0.05)" }}>
      <div style={{ background:"#f4f4f6", padding:"12px 16px",
        display:"flex", alignItems:"center", gap:7, borderBottom:"1px solid rgba(0,0,0,0.05)" }}>
        {["#FF5F57","#FFBD2E","#28CA41"].map(c=>(
          <div key={c} style={{ width:11, height:11, borderRadius:"50%", background:c }}/>
        ))}
        <div style={{ flex:1, background:"#fff", borderRadius:7, padding:"5px 12px",
          marginLeft:8, fontSize:11, color:"#bbb", fontFamily:"'DM Sans',sans-serif" }}>alvryn.in/search</div>
      </div>
      <div style={{ padding:"18px 18px 8px" }}>
        <div style={{ background:"#f8f8fa", borderRadius:12, padding:"12px 15px",
          display:"flex", alignItems:"center", gap:10, border:`1.5px solid ${accent}33` }}>
          <span style={{ fontSize:15 }}>🔍</span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#555", flex:1 }}>
            {queries[qi]}<span style={{ animation:"blink 0.9s step-end infinite", color:accent }}>|</span>
          </span>
        </div>
      </div>
      <div style={{ padding:"8px 18px 18px", display:"flex", flexDirection:"column", gap:8 }}>
        {results.map((f,i)=>(
          <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"12px 14px", borderRadius:11,
            background: i===0 ? `${accent}0E` : "#fafafa",
            border:`1px solid ${i===0 ? accent+"26" : "rgba(0,0,0,0.04)"}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:9, background:`${accent}14`,
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>✈️</div>
              <div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:12.5, color:"#111" }}>
                  {f.name} <span style={{ fontWeight:400, color:"#ccc", fontSize:11 }}>{f.code}</span>
                </div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11.5, color:"#999" }}>{f.time}</div>
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:14,
                color: i===0 ? accent : "#111" }}>{f.price}</div>
              {f.tag && <div style={{ fontFamily:"'Space Mono',monospace", fontSize:8,
                background:accent, color:"#fff", padding:"2px 5px", borderRadius:4, marginTop:2 }}>{f.tag}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}