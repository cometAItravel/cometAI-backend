import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;800;900&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html { scroll-behavior: smooth; }

  body {
    background: #01020a;
    color: #e8eaf6;
    font-family: 'DM Sans', sans-serif;
    overflow-x: hidden;
  }

  /* ── STARS ── */
  .stars-fixed {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background:
      radial-gradient(ellipse at 15% 40%, rgba(63,43,150,0.2) 0%, transparent 55%),
      radial-gradient(ellipse at 85% 15%, rgba(25,90,180,0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 85%, rgba(100,30,140,0.12) 0%, transparent 45%),
      #01020a;
  }
  .star {
    position: absolute; border-radius: 50%; background: white;
    animation: twinkle var(--d,3s) ease-in-out infinite var(--delay,0s);
  }
  @keyframes twinkle {
    0%,100%{opacity:var(--o,.15);transform:scale(1);}
    50%{opacity:1;transform:scale(1.4);}
  }
  .shooting-star {
    position: fixed; top:0; left:0; width:2px; height:2px;
    background:white; border-radius:50%; pointer-events:none; z-index:1;
  }
  .shooting-star::after {
    content:''; position:absolute; top:50%; right:0; transform:translateY(-50%);
    width:140px; height:1px;
    background:linear-gradient(90deg,rgba(255,255,255,0),rgba(165,180,252,0.7),white);
    border-radius:2px;
  }
  @keyframes shoot {
    0%{transform:translate(0,0) rotate(var(--angle));opacity:1;}
    70%{opacity:1;}
    100%{transform:translate(var(--tx),var(--ty)) rotate(var(--angle));opacity:0;}
  }

  /* ── NAV ── */
  .landing-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 60px;
    background: rgba(1,2,10,0.6);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255,255,255,0.04);
    animation: slideDown 0.6s ease both;
  }
  @keyframes slideDown { from{opacity:0;transform:translateY(-20px);} to{opacity:1;transform:translateY(0);} }

  .nav-logo {
    font-family: 'Orbitron', sans-serif; font-size: 20px; font-weight: 900; letter-spacing: 2px;
    background: linear-gradient(90deg, #818cf8, #c084fc, #38bdf8);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    cursor: pointer;
  }

  .nav-links { display: flex; align-items: center; gap: 36px; }
  .nav-link {
    font-size: 13px; color: rgba(165,180,252,0.5); cursor: pointer;
    transition: color 0.2s; letter-spacing: 0.5px; text-decoration: none;
    font-weight: 400;
  }
  .nav-link:hover { color: #a5b4fc; }

  .nav-cta {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border: none; color: white; padding: 10px 24px; border-radius: 10px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
    cursor: pointer; transition: all 0.2s; letter-spacing: 0.3px;
  }
  .nav-cta:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,0.4); }

  /* ── HERO ── */
  .hero-section {
    position: relative; z-index: 1;
    min-height: 100vh;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 120px 24px 80px;
  }

  .hero-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(99,102,241,0.1); border: 1px solid rgba(129,140,248,0.25);
    border-radius: 20px; padding: 6px 16px; margin-bottom: 32px;
    font-size: 11px; letter-spacing: 3px; text-transform: uppercase;
    color: #a5b4fc; font-weight: 500;
    animation: fadeUp 0.8s ease 0.2s both;
  }
  .badge-dot { width: 6px; height: 6px; background: #6ee7b7; border-radius: 50%; animation: blink 2s ease infinite; }
  @keyframes blink { 0%,100%{opacity:1;} 50%{opacity:0.3;} }

  .hero-title {
    font-family: 'Orbitron', sans-serif;
    font-size: clamp(36px, 7vw, 80px);
    font-weight: 900; line-height: 1.05; letter-spacing: 2px;
    margin-bottom: 12px;
    animation: fadeUp 0.8s ease 0.3s both;
  }
  .hero-title-line1 {
    background: linear-gradient(135deg, #ffffff 0%, #e0e7ff 50%, #a5b4fc 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    display: block;
  }
  .hero-title-line2 {
    background: linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #38bdf8 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    display: block;
  }

  .hero-sub {
    font-size: clamp(16px, 2vw, 20px); color: rgba(180,190,255,0.5);
    font-weight: 300; max-width: 560px; line-height: 1.7; margin: 20px auto 48px;
    animation: fadeUp 0.8s ease 0.4s both;
    font-style: italic;
  }

  .hero-ctas {
    display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;
    animation: fadeUp 0.8s ease 0.5s both;
  }

  .btn-primary-hero {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border: none; color: white; padding: 16px 36px; border-radius: 14px;
    font-family: 'DM Sans', sans-serif; font-size: 16px; font-weight: 500;
    cursor: pointer; transition: all 0.25s; letter-spacing: 0.3px;
  }
  .btn-primary-hero:hover { transform: translateY(-3px); box-shadow: 0 12px 36px rgba(99,102,241,0.5); }

  .btn-secondary-hero {
    background: transparent; border: 1px solid rgba(129,140,248,0.3);
    color: #a5b4fc; padding: 16px 36px; border-radius: 14px;
    font-family: 'DM Sans', sans-serif; font-size: 16px; font-weight: 400;
    cursor: pointer; transition: all 0.25s; letter-spacing: 0.3px;
  }
  .btn-secondary-hero:hover { background: rgba(129,140,248,0.1); border-color: rgba(129,140,248,0.6); transform: translateY(-2px); }

  .hero-stats {
    display: flex; gap: 48px; justify-content: center; margin-top: 72px;
    animation: fadeUp 0.8s ease 0.7s both; flex-wrap: wrap;
  }
  .stat-item { text-align: center; }
  .stat-value { font-family: 'Orbitron', sans-serif; font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #a5f3fc, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .stat-label { font-size: 12px; color: rgba(165,180,252,0.35); letter-spacing: 1px; margin-top: 4px; text-transform: uppercase; }

  .scroll-indicator {
    position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%);
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    animation: fadeUp 1s ease 1s both;
  }
  .scroll-text { display: none; }
  }
  .scroll-text { font-size: 10px; letter-spacing: 3px; color: rgba(165,180,252,0.25); text-transform: uppercase; }
  .scroll-line { width: 1px; height: 40px; background: linear-gradient(180deg, rgba(129,140,248,0.4), transparent); animation: scrollAnim 2s ease infinite; }
  @keyframes scrollAnim { 0%{transform:scaleY(0);transform-origin:top;} 50%{transform:scaleY(1);transform-origin:top;} 51%{transform-origin:bottom;} 100%{transform:scaleY(0);transform-origin:bottom;} }

  @keyframes fadeUp { from{opacity:0;transform:translateY(32px);} to{opacity:1;transform:translateY(0);} }

  /* ── SECTION WRAPPER ── */
  .section { position: relative; z-index: 1; padding: 100px 24px; max-width: 1100px; margin: 0 auto; }
  .section-eyebrow { font-size: 11px; letter-spacing: 4px; text-transform: uppercase; color: #818cf8; margin-bottom: 16px; font-weight: 500; text-align: center; }
  .section-title { font-family: 'Orbitron', sans-serif; font-size: clamp(24px,4vw,40px); font-weight: 800; text-align: center; background: linear-gradient(135deg, #e0e7ff, #a5b4fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 16px; }
  .section-sub { text-align: center; font-size: 16px; color: rgba(165,180,252,0.4); font-weight: 300; max-width: 500px; margin: 0 auto 64px; line-height: 1.7; }

  /* ── HOW IT WORKS ── */
  .how-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }

  .how-card {
    background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);
    border-radius: 20px; padding: 36px 28px; transition: all 0.3s; position: relative; overflow: hidden;
  }
  .how-card::before { content:''; position:absolute; inset:0; opacity:0; transition:opacity 0.3s; border-radius:20px; }
  .how-card:nth-child(1)::before { background: radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.12), transparent 70%); }
  .how-card:nth-child(2)::before { background: radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.12), transparent 70%); }
  .how-card:nth-child(3)::before { background: radial-gradient(ellipse at 50% 0%, rgba(56,189,248,0.12), transparent 70%); }
  .how-card:hover { border-color: rgba(129,140,248,0.25); transform: translateY(-6px); box-shadow: 0 20px 60px rgba(0,0,0,0.4); }
  .how-card:hover::before { opacity: 1; }

  .how-number { font-family: 'Orbitron', sans-serif; font-size: 11px; letter-spacing: 3px; color: rgba(129,140,248,0.4); margin-bottom: 20px; }
  .how-icon { font-size: 36px; margin-bottom: 20px; display: block; filter: drop-shadow(0 0 12px rgba(129,140,248,0.4)); }
  .how-title { font-family: 'Orbitron', sans-serif; font-size: 16px; font-weight: 600; color: #e0e7ff; margin-bottom: 12px; letter-spacing: 0.5px; }
  .how-desc { font-size: 14px; color: rgba(165,180,252,0.45); line-height: 1.8; font-weight: 300; }
  .how-example {
    margin-top: 20px; padding: 14px 16px; background: rgba(99,102,241,0.08);
    border: 1px solid rgba(129,140,248,0.12); border-radius: 10px;
    font-size: 12px; color: rgba(165,180,252,0.5); font-style: italic; line-height: 1.6;
  }
  .how-example strong { color: #a5b4fc; font-style: normal; font-weight: 500; }

  /* ── FEATURES ── */
  .features-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
  .feature-card {
    background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
    border-radius: 16px; padding: 28px; display: flex; gap: 20px; align-items: flex-start;
    transition: all 0.25s;
  }
  .feature-card:hover { border-color: rgba(129,140,248,0.2); background: rgba(255,255,255,0.04); transform: translateX(4px); }
  .feature-icon-wrap { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
  .feature-icon-wrap.purple { background: rgba(99,102,241,0.15); border: 1px solid rgba(129,140,248,0.2); }
  .feature-icon-wrap.teal   { background: rgba(20,184,166,0.12); border: 1px solid rgba(45,212,191,0.2); }
  .feature-icon-wrap.amber  { background: rgba(245,158,11,0.12); border: 1px solid rgba(251,191,36,0.2); }
  .feature-icon-wrap.blue   { background: rgba(56,189,248,0.12); border: 1px solid rgba(125,211,252,0.2); }
  .feature-icon-wrap.green  { background: rgba(52,211,153,0.12); border: 1px solid rgba(110,231,183,0.2); }
  .feature-icon-wrap.coral  { background: rgba(239,68,68,0.1);   border: 1px solid rgba(252,165,165,0.2); }
  .feature-content {}
  .feature-title { font-size: 15px; font-weight: 500; color: #c7d2fe; margin-bottom: 6px; }
  .feature-desc { font-size: 13px; color: rgba(165,180,252,0.4); line-height: 1.7; font-weight: 300; }

  /* ── WHATSAPP DEMO ── */
  .whatsapp-section { position: relative; z-index: 1; padding: 100px 24px; }
  .whatsapp-inner { max-width: 1000px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
  .whatsapp-content {}
  .whatsapp-tag { display: inline-block; background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.25); border-radius: 20px; padding: 5px 14px; font-size: 11px; letter-spacing: 2px; color: #6ee7b7; text-transform: uppercase; margin-bottom: 24px; }
  .whatsapp-title { font-family: 'Orbitron', sans-serif; font-size: clamp(22px,3.5vw,36px); font-weight: 800; color: #e0e7ff; margin-bottom: 16px; line-height: 1.2; }
  .whatsapp-desc { font-size: 15px; color: rgba(165,180,252,0.45); line-height: 1.8; font-weight: 300; margin-bottom: 32px; }
  .whatsapp-features { display: flex; flex-direction: column; gap: 12px; }
  .wa-feature { display: flex; align-items: center; gap: 12px; font-size: 14px; color: rgba(165,180,252,0.5); }
  .wa-check { width: 20px; height: 20px; background: rgba(52,211,153,0.15); border: 1px solid rgba(52,211,153,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #6ee7b7; flex-shrink: 0; }

  /* WhatsApp chat mockup */
  .wa-chat {
    background: #0a1520; border: 1px solid rgba(52,211,153,0.15); border-radius: 20px;
    overflow: hidden; box-shadow: 0 24px 80px rgba(0,0,0,0.5);
  }
  .wa-header { background: rgba(52,211,153,0.08); padding: 16px 20px; border-bottom: 1px solid rgba(52,211,153,0.1); display: flex; align-items: center; gap: 12px; }
  .wa-avatar { width: 36px; height: 36px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; }
  .wa-name { font-size: 14px; font-weight: 500; color: #e0e7ff; }
  .wa-status { font-size: 11px; color: #6ee7b7; }
  .wa-messages { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
  .wa-msg { max-width: 80%; padding: 10px 14px; border-radius: 12px; font-size: 13px; line-height: 1.5; }
  .wa-msg.user { background: rgba(99,102,241,0.2); border: 1px solid rgba(129,140,248,0.2); color: #c7d2fe; align-self: flex-end; border-radius: 12px 12px 2px 12px; }
  .wa-msg.bot { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); color: rgba(165,180,252,0.7); align-self: flex-start; border-radius: 12px 12px 12px 2px; }
  .wa-msg.bot strong { color: #a5b4fc; }
  .wa-time { font-size: 10px; color: rgba(165,180,252,0.25); margin-top: 4px; text-align: right; }

  /* ── CTA SECTION ── */
  .cta-section {
    position: relative; z-index: 1; padding: 80px 24px 120px; text-align: center;
  }
  .cta-inner {
    max-width: 700px; margin: 0 auto;
    background: rgba(255,255,255,0.02); border: 1px solid rgba(129,140,248,0.15);
    border-radius: 28px; padding: 64px 48px;
    position: relative; overflow: hidden;
  }
  .cta-inner::before { content:''; position:absolute; inset:0; background:radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15), transparent 70%); pointer-events:none; }
  .cta-title { font-family:'Orbitron',sans-serif; font-size:clamp(24px,4vw,40px); font-weight:800; background:linear-gradient(135deg,#e0e7ff,#a5b4fc,#c084fc); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; margin-bottom:16px; }
  .cta-sub { font-size:16px; color:rgba(165,180,252,0.4); font-weight:300; line-height:1.7; margin-bottom:40px; }
  .cta-btns { display:flex; gap:16px; justify-content:center; flex-wrap:wrap; }

  /* ── FOOTER ── */
  .landing-footer {
    position: relative; z-index: 1; padding: 40px 60px;
    border-top: 1px solid rgba(255,255,255,0.04);
    display: flex; align-items: center; justify-content: space-between;
  }
  .footer-logo { font-family:'Orbitron',sans-serif; font-size:16px; font-weight:800; background:linear-gradient(90deg,#818cf8,#c084fc); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  .footer-text { font-size:12px; color:rgba(165,180,252,0.2); }
  .footer-links { display:flex; gap:24px; }
  .footer-link { font-size:12px; color:rgba(165,180,252,0.3); cursor:pointer; transition:color 0.2s; text-decoration:none; }
  .footer-link:hover { color:#a5b4fc; }

  /* ── DIVIDER ── */
  .section-divider { width:100%; height:1px; background:linear-gradient(90deg,transparent,rgba(129,140,248,0.15),transparent); margin:0 auto; }

  @media(max-width:768px){
    .how-grid { grid-template-columns: 1fr; }
    .features-grid { grid-template-columns: 1fr; }
    .whatsapp-inner { grid-template-columns: 1fr; }
    .landing-nav { padding: 16px 24px; }
    .nav-links { display: none; }
    .landing-footer { flex-direction: column; gap: 16px; text-align: center; }
  }
`;

function Stars() {
  const stars = Array.from({length:100},(_,i)=>({
    id:i, x:Math.random()*100, y:Math.random()*100,
    size:Math.random()*2+0.3, d:Math.random()*5+2,
    delay:Math.random()*6, o:Math.random()*0.15+0.05,
  }));
  return(
    <div className="stars-fixed">
      {stars.map(s=>(
        <div key={s.id} className="star" style={{
          left:`${s.x}%`, top:`${s.y}%`, width:s.size, height:s.size,
          '--d':`${s.d}s`, '--delay':`${s.delay}s`, '--o':s.o,
        }}/>
      ))}
    </div>
  );
}

function ShootingStars() {
  const [stars,setStars]=useState([]);
  useEffect(()=>{
    let id=0;
    const launch=()=>{
      const x=Math.random()*70,y=Math.random()*35,dist=500+Math.random()*300,angle=25+Math.random()*20;
      const rad=(angle*Math.PI)/180;
      const star={id:id++,x,y,tx:Math.cos(rad)*dist,ty:Math.sin(rad)*dist,angle,dur:700+Math.random()*700};
      setStars(p=>[...p,star]);
      setTimeout(()=>setStars(p=>p.filter(s=>s.id!==star.id)),star.dur+100);
      setTimeout(launch,1500+Math.random()*4000);
    };
    const t=setTimeout(launch,1000);
    return()=>clearTimeout(t);
  },[]);
  return<>{stars.map(s=><div key={s.id} className="shooting-star" style={{left:`${s.x}%`,top:`${s.y}%`,'--angle':`${s.angle}deg`,'--tx':`${s.tx}px`,'--ty':`${s.ty}px`,animation:`shoot ${s.dur}ms ease-out forwards`}}/>)}</>;
}

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <>
      <style>{styles}</style>
      <Stars/>
      <ShootingStars/>

      {/* ── NAV ── */}
      <nav className="landing-nav">
        <div className="nav-logo">☄️ COMETAI</div>
        <div className="nav-links">
          <a className="nav-link" href="#how">How it works</a>
          <a className="nav-link" href="#features">Features</a>
          <a className="nav-link" href="#whatsapp">WhatsApp</a>
        </div>
        <div style={{display:"flex",gap:"12px"}}>
          <button className="btn-secondary-hero" style={{padding:"10px 20px",fontSize:"13px",borderRadius:"10px"}} onClick={()=>navigate("/login")}>Login</button>
          <button className="nav-cta" onClick={()=>navigate("/register")}>Get Started →</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero-section">
        <div className="hero-badge">
          <span className="badge-dot"/>
          Now live — AI + WhatsApp booking
        </div>

        <h1 className="hero-title">
          <span className="hero-title-line1">Book Flights</span>
          <span className="hero-title-line2">Like Never Before</span>
        </h1>

        <p className="hero-sub">
          Search, compare and book flights using our website, AI assistant, or simply by sending a WhatsApp message.
        </p>

        <div className="hero-ctas">
          <button className="btn-primary-hero" onClick={()=>navigate("/register")}>
            🚀 Start Booking Free
          </button>
          <button className="btn-secondary-hero" onClick={()=>navigate("/login")}>
            Sign in →
          </button>
        </div>

        <div className="hero-stats">
          <div className="stat-item">
            <div className="stat-value">3</div>
            <div className="stat-label">Ways to book</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">14+</div>
            <div className="stat-label">Cities covered</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">AI</div>
            <div className="stat-label">Powered search</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">₹0</div>
            <div className="stat-label">Booking fees</div>
          </div>
        </div>

        <div className="scroll-indicator">
          <div className="scroll-text">Scroll</div>
          <div className="scroll-line"/>
        </div>
      </section>

      <div className="section-divider"/>

      {/* ── HOW IT WORKS ── */}
      <section className="section" id="how">
        <p className="section-eyebrow">✦ Three ways to book</p>
        <h2 className="section-title">Your flight. Your way.</h2>
        <p className="section-sub">Choose how you want to book — a classic search, an AI conversation, or a WhatsApp message.</p>

        <div className="how-grid">
          <div className="how-card">
            <div className="how-number">01 — WEBSITE</div>
            <span className="how-icon">🌐</span>
            <div className="how-title">Classic Search</div>
            <div className="how-desc">Pick your origin, destination and date from our sleek space-themed interface. Filter by price, airline and departure time.</div>
            <div className="how-example">
              <strong>Bangalore → Mumbai</strong><br/>
              20 Mar · Sort by price · Filter: Morning flights
            </div>
          </div>

          <div className="how-card">
            <div className="how-number">02 — AI SEARCH</div>
            <span className="how-icon">🤖</span>
            <div className="how-title">AI Assistant</div>
            <div className="how-desc">Just type what you want in plain English. Our AI understands cities, dates, preferences and finds the best options instantly.</div>
            <div className="how-example">
              <strong>"cheapest flight bangalore to goa next friday"</strong><br/>
              AI finds 4 flights · Sorted by price
            </div>
          </div>

          <div className="how-card">
            <div className="how-number">03 — WHATSAPP</div>
            <span className="how-icon">💬</span>
            <div className="how-title">WhatsApp Booking</div>
            <div className="how-desc">Send a message to our bot. It shows you flights, remembers your seat preference and sends a payment link — all without opening a browser.</div>
            <div className="how-example">
              <strong>User:</strong> "blr to mumbai tomorrow"<br/>
              <strong>Bot:</strong> Here are 3 flights. Reply 1, 2 or 3.
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider"/>

      {/* ── FEATURES ── */}
      <section className="section" id="features">
        <p className="section-eyebrow">✦ Built different</p>
        <h2 className="section-title">Everything you need</h2>
        <p className="section-sub">Every feature designed to make booking faster, smarter and more personal.</p>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrap purple">🧠</div>
            <div className="feature-content">
              <div className="feature-title">Natural language AI search</div>
              <div className="feature-desc">Type "flights tomorrow from Bangalore to Delhi under 5000" — the AI parses cities, dates and budget automatically.</div>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrap teal">⚡</div>
            <div className="feature-content">
              <div className="feature-title">Instant results</div>
              <div className="feature-desc">No page reloads. Flight results appear in under a second with real-time filtering and sorting.</div>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrap amber">📅</div>
            <div className="feature-content">
              <div className="feature-title">Smart date detection</div>
              <div className="feature-desc">Say "tomorrow", "next Friday" or "in 3 days" — the AI converts it to the exact date automatically.</div>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrap blue">💳</div>
            <div className="feature-content">
              <div className="feature-title">Secure payments</div>
              <div className="feature-desc">Pay by card, UPI or netbanking. Every transaction is encrypted and confirmed with a unique booking ID.</div>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrap green">🎯</div>
            <div className="feature-content">
              <div className="feature-title">Smart filters</div>
              <div className="feature-desc">Filter by airline, price range and departure time. Sort by cheapest, fastest or earliest departure.</div>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrap coral">📱</div>
            <div className="feature-content">
              <div className="feature-title">WhatsApp-first for India</div>
              <div className="feature-desc">500M+ Indians use WhatsApp daily. Book without downloading an app — just message our bot and you're done.</div>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider"/>

      {/* ── WHATSAPP DEMO ── */}
      <section className="whatsapp-section" id="whatsapp">
        <div className="whatsapp-inner">
          <div className="whatsapp-content">
            <div className="whatsapp-tag">✦ Coming soon</div>
            <h2 className="whatsapp-title">Book on WhatsApp.<br/>No app needed.</h2>
            <p className="whatsapp-desc">India's first WhatsApp-native flight booking. Message our AI bot like you'd text a friend — and it handles everything from search to payment.</p>
            <div className="whatsapp-features">
              {[
                "Understands natural language in Hindi and English",
                "Remembers your seat preference for next booking",
                "Sends Razorpay payment link directly in chat",
                "Booking confirmation and PNR via WhatsApp",
              ].map((f,i)=>(
                <div className="wa-feature" key={i}>
                  <div className="wa-check">✓</div>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="wa-chat">
            <div className="wa-header">
              <div className="wa-avatar">☄️</div>
              <div>
                <div className="wa-name">CometAI Travel Bot</div>
                <div className="wa-status">● Online</div>
              </div>
            </div>
            <div className="wa-messages">
              <div className="wa-msg user">blr to mumbai tomorrow<div className="wa-time">10:42</div></div>
              <div className="wa-msg bot">
                Here are flights for <strong>16 Mar, BLR→BOM</strong>:<br/><br/>
                1. IndiGo 6E-732 · 07:00 · <strong>₹3,500</strong><br/>
                2. SpiceJet SG-101 · 11:00 · <strong>₹3,200</strong><br/>
                3. Akasa QP-204 · 18:00 · <strong>₹4,100</strong><br/><br/>
                Reply <strong>1, 2 or 3</strong> to book.
                <div className="wa-time">10:42</div>
              </div>
              <div className="wa-msg user">2 window seat<div className="wa-time">10:43</div></div>
              <div className="wa-msg bot">
                ✅ <strong>SpiceJet SG-101</strong> selected<br/>
                Window seat 12A assigned<br/><br/>
                💳 Pay ₹3,200 to confirm:<br/>
                <strong>pay.cometai.in/bk291</strong>
                <div className="wa-time">10:43</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider"/>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="cta-inner">
          <h2 className="cta-title">Ready for takeoff?</h2>
          <p className="cta-sub">Join CometAI Travel and experience the future of flight booking — free, fast and intelligent.</p>
          <div className="cta-btns">
            <button className="btn-primary-hero" onClick={()=>navigate("/register")}>
              🚀 Create Free Account
            </button>
            <button className="btn-secondary-hero" onClick={()=>navigate("/login")}>
              Already have an account
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div className="footer-logo">☄️ COMETAI</div>
        <div className="footer-text">© 2026 CometAI Travel. Built with ❤️ in India.</div>
        <div className="footer-links">
          <a className="footer-link">Privacy</a>
          <a className="footer-link">Terms</a>
          <a className="footer-link">Contact</a>
        </div>
      </footer>
    </>
  );
}