/* eslint-disable no-useless-escape, no-unused-vars */
/**
 * ALVRYN — App.js
 * Premium Search Page — cream/gold luxury theme
 * Flights via TravelPayouts/Aviasales (marker=714667)
 * Bus via RedBus / Cuelinks
 * Hotels via Booking.com / Cuelinks
 * Trains via IRCTC
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import MyBookings from "./pages/MyBookings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import LandingPage from "./pages/LandingPage";
import AdminDashboard from "./pages/AdminDashboard";
import AIChatPage from "./pages/AIChatPage";
import UserProfile from "./pages/UserProfile";

const API = "https://cometai-backend.onrender.com";

function track(eventType, details = "", source = "web") {
  const token = localStorage.getItem("token");
  fetch(`${API}/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ event_type: eventType, details: String(details), source }),
  }).catch(() => {});
}

const GOLD = "#c9a84c";
const GOLD_DARK = "#8B6914";
const GRAD = "linear-gradient(135deg,#c9a84c,#f0d080,#c9a84c)";
const CREAM = "#faf8f4";
const CREAM2 = "#f5f0e8";

// ── AFFILIATE LINKS ───────────────────────────────────────────────────────────
function flightLink(fromCode, toCode, dateStr, passengers = 1) {
  let d = "";
  if (dateStr) {
    const parts = dateStr.split("-");
    if (parts.length === 3) d = parts[2] + parts[1];
  }
  const pax = Math.max(1, passengers);
  const INDIA_CODES = new Set([
    "BLR","BOM","DEL","MAA","HYD","CCU","GOI","PNQ","COK","AMD","JAI",
    "LKO","VNS","PAT","IXC","GAU","BBI","CBE","IXM","IXE","MYQ","TRV",
    "VTZ","VGA","IXR","BHO","SXR","IXJ","HBX","IXG","TIR","IXL","IXZ","NAG","IDR","RPR","DED","SLV","ATQ","UDR","JDH","AGR","STV",
  ]);
  const isIndia = INDIA_CODES.has(fromCode) && INDIA_CODES.has(toCode);
  const base = isIndia ? "https://www.aviasales.in" : "https://www.aviasales.com";
  return `${base}/search/${fromCode}${d}${toCode}${pax}?marker=714667&sub_id=alvryn_web`;
}

function busLink(from, to, dateStr) {
  const f = from.toLowerCase().replace(/\s+/g, "-");
  const t = to.toLowerCase().replace(/\s+/g, "-");
  if (dateStr) {
    try {
      const d = new Date(dateStr);
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const formatted = d.getDate().toString().padStart(2,"0") + "-" + months[d.getMonth()] + "-" + d.getFullYear();
      return `https://www.redbus.in/bus-tickets/${f}-to-${t}?doj=${formatted}`;
    } catch {}
  }
  return `https://www.redbus.in/bus-tickets/${f}-to-${t}`;
}

function hotelLink(city, checkIn, checkOut) {
  let url = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}&lang=en-gb`;
  if (checkIn) url += `&checkin=${checkIn}`;
  if (checkOut) url += `&checkout=${checkOut}`;
  return url;
}

// ── GLOBAL STYLES ─────────────────────────────────────────────────────────────
const SHARED_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html{scroll-behavior:smooth;}

  @keyframes fadeUp{from{opacity:0;transform:translateY(22px);}to{opacity:1;transform:translateY(0);}}
  @keyframes floatUD{0%,100%{transform:translateY(0);}50%{transform:translateY(-9px);}}
  @keyframes gradShift{0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;}}
  @keyframes spinSlow{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
  @keyframes shimmerGold{0%{opacity:0.04;}50%{opacity:0.09;}100%{opacity:0.04;}}

  /* Flight animation */
  @keyframes flyAcross{0%{transform:translate(-120px,60px) rotate(-8deg);opacity:0;}10%{opacity:1;}90%{opacity:1;}100%{transform:translate(calc(100vw + 120px),-40px) rotate(-8deg);opacity:0;}}
  @keyframes trailFade{0%,100%{opacity:0;}50%{opacity:0.15;}}

  /* Bus animation */
  @keyframes busRoll{0%{transform:translateX(-180px);opacity:0;}8%{opacity:1;}92%{opacity:1;}100%{transform:translateX(calc(100vw + 180px));opacity:0;}}
  @keyframes roadLines{0%{transform:translateX(0);}100%{transform:translateX(-120px);}}

  /* Hotel animation */
  @keyframes buildingGlow{0%,100%{opacity:0.04;}50%{opacity:0.10;}}
  @keyframes windowBlink{0%,94%,100%{opacity:0.06;}95%,99%{opacity:0.18;}}
  @keyframes cityRise{from{opacity:0;transform:translateY(30px);}to{opacity:1;transform:translateY(0);}}

  /* Train animation */
  @keyframes trainRoll{0%{transform:translateX(-220px);opacity:0;}8%{opacity:1;}92%{opacity:1;}100%{transform:translateX(calc(100vw + 220px));opacity:0;}}
  @keyframes trackShift{0%{transform:translateX(0);}100%{transform:translateX(-80px);}}

  /* Cab animation */
  @keyframes cabDrive{0%{transform:translateX(-120px);opacity:0;}10%{opacity:1;}90%{opacity:1;}100%{transform:translateX(calc(100vw + 120px));opacity:0;}}
  @keyframes headlightPulse{0%,100%{opacity:0.06;}50%{opacity:0.14;}}

  ::-webkit-scrollbar{width:3px;}
  ::-webkit-scrollbar-thumb{background:linear-gradient(#c9a84c,#8B6914);border-radius:2px;}

  @media(max-width:768px){
    .search-city-grid{grid-template-columns:1fr!important;}
    .search-date-grid{grid-template-columns:1fr 1fr!important;}
    .results-card-bottom{flex-direction:column!important;gap:12px!important;}
    .nav-bookings{display:none!important;}
  }
  @media(max-width:640px){
    .nav-right-btns button{padding:6px 10px!important;font-size:12px!important;}
    .btn-label{display:none!important;}
  }
`;

// ── ALVRYN ICON ───────────────────────────────────────────────────────────────
function AlvrynIcon({ size = 40 }) {
  const uid = `app_${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id={`${uid}g`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c9a84c"/>
          <stop offset="50%" stopColor="#f0d080"/>
          <stop offset="100%" stopColor="#8B6914"/>
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" stroke={`url(#${uid}g)`} strokeWidth="1.2" fill="none"/>
      <circle cx="32" cy="32" r="26" stroke={`url(#${uid}g)`} strokeWidth="0.5" fill="none" opacity="0.4"/>
      <path d="M20 46 L28 18 L36 46" stroke={`url(#${uid}g)`} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M22.5 36 L33.5 36" stroke={`url(#${uid}g)`} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M26 46 L34 18 L42 46" stroke={`url(#${uid}g)`} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.45"/>
      <path d="M28 36 L40 36" stroke={`url(#${uid}g)`} strokeWidth="1" strokeLinecap="round" opacity="0.45"/>
      <circle cx="32" cy="9" r="1.5" fill={`url(#${uid}g)`}/>
      <path d="M29 9 L32 6 L35 9" stroke={`url(#${uid}g)`} strokeWidth="0.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── AURORA BACKGROUND ─────────────────────────────────────────────────────────
function AuroraBackground() {
  const ref = useRef(null); const raf = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    let W = c.offsetWidth, H = c.offsetHeight; c.width = W; c.height = H;
    const cols = ["#c9a84c","#f0d080","#8B6914","#d4b868"];
    const blobs = Array.from({ length: 4 }, (_, i) => ({
      x: Math.random()*W, y: Math.random()*H,
      vx: (Math.random()-0.5)*0.35, vy: (Math.random()-0.5)*0.35,
      r: 180+Math.random()*140, ci: i%cols.length,
    }));
    const resize = () => { W = c.offsetWidth; H = c.offsetHeight; c.width = W; c.height = H; };
    window.addEventListener("resize", resize);
    const draw = () => {
      ctx.clearRect(0,0,W,H);
      blobs.forEach(b => {
        b.x += b.vx; b.y += b.vy;
        if (b.x < -b.r || b.x > W+b.r) b.vx *= -1;
        if (b.y < -b.r || b.y > H+b.r) b.vy *= -1;
        const g = ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r);
        g.addColorStop(0, cols[b.ci]+"14"); g.addColorStop(1,"transparent");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fill();
      });
      raf.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener("resize",resize); };
  }, []);
  return <canvas ref={ref} style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:0 }}/>;
}

// ── TAB BACKGROUND ANIMATIONS ─────────────────────────────────────────────────
function FlightAnimation() {
  return (
    <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:0 }}>
      <div style={{ position:"absolute", top:"35%", left:0, animation:"flyAcross 16s linear infinite" }}>
        <svg width="110" height="44" viewBox="0 0 90 36" fill="none" opacity="0.75">
          <path d="M5 18 L55 6 L80 18 L55 30 Z" fill={GOLD}/>
          <path d="M55 18 L90 14 L90 22 Z" fill={GOLD}/>
          <path d="M30 18 L50 8 L50 28 Z" fill={GOLD} opacity="0.8"/>
        </svg>
      </div>
      <div style={{ position:"absolute", top:"58%", left:0, animation:"flyAcross 24s linear infinite", animationDelay:"8s" }}>
        <svg width="70" height="28" viewBox="0 0 90 36" fill="none" opacity="0.45">
          <path d="M5 18 L55 6 L80 18 L55 30 Z" fill={GOLD}/>
          <path d="M55 18 L90 14 L90 22 Z" fill={GOLD}/>
        </svg>
      </div>
      <div style={{ position:"absolute", top:"18%", right:"18%", width:200, height:55, borderRadius:40, background:GOLD, opacity:0.18, animation:"shimmerGold 8s ease-in-out infinite" }}/>
      <div style={{ position:"absolute", top:"62%", left:"10%", width:140, height:38, borderRadius:30, background:GOLD, opacity:0.12, animation:"shimmerGold 11s ease-in-out infinite 3s" }}/>
      <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.35 }} viewBox="0 0 1000 300" preserveAspectRatio="none">
        <path d="M-50 250 Q 300 50 600 150 Q 800 220 1100 80" stroke={GOLD} strokeWidth="1.5" fill="none" strokeDasharray="12 8"/>
      </svg>
      {[{x:"15%",y:"25%"},{x:"45%",y:"15%"},{x:"70%",y:"30%"},{x:"85%",y:"20%"},{x:"30%",y:"70%"},{x:"60%",y:"65%"}].map((s,i)=>(
        <div key={i} style={{ position:"absolute", left:s.x, top:s.y, width:3, height:3, borderRadius:"50%", background:GOLD, opacity:0.4, animation:`shimmerGold ${4+i}s ease-in-out infinite ${i*0.5}s` }}/>
      ))}
    </div>
  );
}

function BusAnimation() {
  return (
    <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:0 }}>
      {/* Road lines */}
      <div style={{ position:"absolute", bottom:"18%", left:0, right:0, height:3, background:`linear-gradient(90deg, transparent, ${GOLD}88, transparent)` }}/>
      <div style={{ position:"absolute", bottom:"22%", left:0, right:0, overflow:"hidden", height:4 }}>
        <div style={{ display:"flex", gap:60, animation:"roadLines 2s linear infinite", width:"200%" }}>
          {Array.from({length:30}).map((_,i) => (
            <div key={i} style={{ width:40, height:3, background:GOLD, opacity:0.5, borderRadius:2, flexShrink:0 }}/>
          ))}
        </div>
      </div>
      {/* Primary bus silhouette */}
      <div style={{ position:"absolute", bottom:"20%", left:0, animation:"busRoll 18s linear infinite" }}>
        <svg width="140" height="58" viewBox="0 0 120 50" fill="none" opacity="0.7">
          <rect x="5" y="8" width="110" height="32" rx="5" fill={GOLD}/>
          <rect x="10" y="12" width="18" height="14" rx="2" fill={CREAM} opacity="0.5"/>
          <rect x="32" y="12" width="18" height="14" rx="2" fill={CREAM} opacity="0.5"/>
          <rect x="54" y="12" width="18" height="14" rx="2" fill={CREAM} opacity="0.5"/>
          <rect x="76" y="12" width="18" height="14" rx="2" fill={CREAM} opacity="0.5"/>
          <circle cx="28" cy="42" r="7" fill={GOLD_DARK}/>
          <circle cx="88" cy="42" r="7" fill={GOLD_DARK}/>
        </svg>
      </div>
      {/* Secondary bus */}
      <div style={{ position:"absolute", bottom:"20%", left:0, animation:"busRoll 28s linear infinite", animationDelay:"12s" }}>
        <svg width="90" height="40" viewBox="0 0 120 50" fill="none" opacity="0.4">
          <rect x="5" y="8" width="110" height="32" rx="5" fill={GOLD}/>
          <circle cx="28" cy="42" r="7" fill={GOLD_DARK}/>
          <circle cx="88" cy="42" r="7" fill={GOLD_DARK}/>
        </svg>
      </div>
      {/* Road glow */}
      <div style={{ position:"absolute", bottom:"15%", left:0, right:0, height:20, background:`linear-gradient(transparent, ${GOLD}18, transparent)` }}/>
    </div>
  );
}

function HotelAnimation() {
  return (
    <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:0 }}>
      {/* City skyline silhouette */}
      <svg style={{ position:"absolute", bottom:0, left:0, right:0, width:"100%", opacity:0.55, animation:"cityRise 1.2s ease both" }} height="160" viewBox="0 0 1000 160" preserveAspectRatio="none">
        <rect x="20" y="60" width="60" height="100" fill={GOLD}/>
        <rect x="30" y="40" width="40" height="20" fill={GOLD}/>
        <rect x="100" y="30" width="80" height="130" fill={GOLD}/>
        <rect x="120" y="10" width="40" height="22" fill={GOLD}/>
        <rect x="200" y="70" width="50" height="90" fill={GOLD}/>
        <rect x="270" y="20" width="90" height="140" fill={GOLD}/>
        <rect x="300" y="5" width="30" height="17" fill={GOLD}/>
        <rect x="380" y="55" width="70" height="105" fill={GOLD}/>
        <rect x="470" y="35" width="55" height="125" fill={GOLD}/>
        <rect x="480" y="10" width="35" height="28" fill={GOLD}/>
        <rect x="545" y="65" width="60" height="95" fill={GOLD}/>
        <rect x="625" y="25" width="85" height="135" fill={GOLD}/>
        <rect x="650" y="8" width="35" height="20" fill={GOLD}/>
        <rect x="730" y="50" width="65" height="110" fill={GOLD}/>
        <rect x="815" y="40" width="75" height="120" fill={GOLD}/>
        <rect x="830" y="18" width="45" height="25" fill={GOLD}/>
        <rect x="910" y="60" width="55" height="100" fill={GOLD}/>
      </svg>
      {/* Twinkling windows */}
      {[
        {x:"12%",y:"45%",d:"0s"},{x:"18%",y:"55%",d:"1.5s"},{x:"28%",y:"38%",d:"3s"},
        {x:"38%",y:"50%",d:"0.7s"},{x:"48%",y:"42%",d:"2.2s"},{x:"58%",y:"56%",d:"4s"},
        {x:"68%",y:"44%",d:"1s"},{x:"78%",y:"50%",d:"3.5s"},{x:"88%",y:"46%",d:"2s"},
      ].map((w,i) => (
        <div key={i} style={{ position:"absolute", left:w.x, top:w.y, width:6, height:6, borderRadius:1, background:GOLD, opacity:0.7, animation:`windowBlink 4s ease-in-out infinite ${w.d}` }}/>
      ))}
    </div>
  );
}

function TrainAnimation() {
  return (
    <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:0 }}>
      {/* Railway tracks */}
      <div style={{ position:"absolute", bottom:"22%", left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${GOLD}88,transparent)` }}/>
      <div style={{ position:"absolute", bottom:"25%", left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${GOLD}88,transparent)` }}/>
      {/* Track sleepers */}
      <div style={{ position:"absolute", bottom:"21%", left:0, right:0, overflow:"hidden", height:6 }}>
        <div style={{ display:"flex", gap:24, animation:"trackShift 1.5s linear infinite", width:"200%" }}>
          {Array.from({length:60}).map((_,i) => (
            <div key={i} style={{ width:6, height:6, background:GOLD, opacity:0.5, borderRadius:1, flexShrink:0 }}/>
          ))}
        </div>
      </div>
      {/* Primary train silhouette */}
      <div style={{ position:"absolute", bottom:"23%", left:0, animation:"trainRoll 18s linear infinite" }}>
        <svg width="220" height="48" viewBox="0 0 200 44" fill="none" opacity="0.72">
          <rect x="5" y="6" width="55" height="28" rx="4" fill={GOLD}/>
          <rect x="58" y="6" width="50" height="28" rx="2" fill={GOLD}/>
          <rect x="106" y="6" width="50" height="28" rx="2" fill={GOLD}/>
          <rect x="154" y="6" width="42" height="28" rx="2" fill={GOLD}/>
          <rect x="8" y="10" width="14" height="10" rx="1.5" fill={CREAM} opacity="0.5"/>
          <rect x="25" y="10" width="14" height="10" rx="1.5" fill={CREAM} opacity="0.5"/>
          <rect x="62" y="10" width="12" height="10" rx="1.5" fill={CREAM} opacity="0.45"/>
          <circle cx="25" cy="36" r="5" fill={GOLD_DARK}/>
          <circle cx="75" cy="36" r="5" fill={GOLD_DARK}/>
          <circle cx="130" cy="36" r="5" fill={GOLD_DARK}/>
          <circle cx="175" cy="36" r="5" fill={GOLD_DARK}/>
          <path d="M5 6 Q 12 2 20 6" stroke={GOLD} strokeWidth="1.5" fill="none" opacity="0.7"/>
        </svg>
      </div>
      {/* Secondary train */}
      <div style={{ position:"absolute", bottom:"23%", left:0, animation:"trainRoll 28s linear infinite", animationDelay:"12s" }}>
        <svg width="140" height="35" viewBox="0 0 200 44" fill="none" opacity="0.4">
          <rect x="5" y="6" width="55" height="28" rx="4" fill={GOLD}/>
          <rect x="58" y="6" width="50" height="28" rx="2" fill={GOLD}/>
          <rect x="106" y="6" width="50" height="28" rx="2" fill={GOLD}/>
          <circle cx="25" cy="36" r="5" fill={GOLD_DARK}/>
          <circle cx="75" cy="36" r="5" fill={GOLD_DARK}/>
          <circle cx="130" cy="36" r="5" fill={GOLD_DARK}/>
        </svg>
      </div>
    </div>
  );
}

function CabAnimation() {
  return (
    <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:0 }}>
      {/* Road */}
      <div style={{ position:"absolute", bottom:"18%", left:0, right:0, height:3, background:`linear-gradient(90deg,transparent,${GOLD}88,transparent)` }}/>
      {/* Road dashes */}
      <div style={{ position:"absolute", bottom:"21%", left:0, right:0, overflow:"hidden", height:3 }}>
        <div style={{ display:"flex", gap:50, animation:"roadLines 1.8s linear infinite", width:"200%" }}>
          {Array.from({length:30}).map((_,i) => (
            <div key={i} style={{ width:28, height:2, background:GOLD, opacity:0.5, borderRadius:1, flexShrink:0 }}/>
          ))}
        </div>
      </div>
      {/* Primary cab */}
      <div style={{ position:"absolute", bottom:"19%", left:0, animation:"cabDrive 14s linear infinite" }}>
        <svg width="105" height="46" viewBox="0 0 90 40" fill="none" opacity="0.72">
          <rect x="10" y="18" width="70" height="16" rx="3" fill={GOLD}/>
          <path d="M18 18 L25 8 L65 8 L72 18Z" fill={GOLD}/>
          <rect x="28" y="10" width="14" height="10" rx="1.5" fill={CREAM} opacity="0.5"/>
          <rect x="46" y="10" width="14" height="10" rx="1.5" fill={CREAM} opacity="0.5"/>
          <circle cx="24" cy="36" r="6" fill={GOLD_DARK}/>
          <circle cx="66" cy="36" r="6" fill={GOLD_DARK}/>
          <ellipse cx="12" cy="22" rx="5" ry="3" fill={GOLD} opacity="0.6"/>
        </svg>
      </div>
      {/* Secondary cab */}
      <div style={{ position:"absolute", bottom:"19%", left:0, animation:"cabDrive 22s linear infinite", animationDelay:"9s" }}>
        <svg width="70" height="32" viewBox="0 0 90 40" fill="none" opacity="0.4">
          <rect x="10" y="18" width="70" height="16" rx="3" fill={GOLD}/>
          <path d="M18 18 L25 8 L65 8 L72 18Z" fill={GOLD}/>
          <circle cx="24" cy="36" r="6" fill={GOLD_DARK}/>
          <circle cx="66" cy="36" r="6" fill={GOLD_DARK}/>
        </svg>
      </div>
    </div>
  );
}

// ── CITY LISTS ────────────────────────────────────────────────────────────────
const CITIES = [
  {code:"BLR",name:"Bangalore",full:"Kempegowda International",country:"India",popular:true},
  {code:"BOM",name:"Mumbai",full:"Chhatrapati Shivaji Intl",country:"India",popular:true},
  {code:"DEL",name:"Delhi",full:"Indira Gandhi International",country:"India",popular:true},
  {code:"MAA",name:"Chennai",full:"Chennai International",country:"India",popular:true},
  {code:"HYD",name:"Hyderabad",full:"Rajiv Gandhi International",country:"India",popular:true},
  {code:"CCU",name:"Kolkata",full:"Netaji Subhas Chandra Bose Intl",country:"India",popular:true},
  {code:"GOI",name:"Goa",full:"Dabolim / Mopa Airport",country:"India",popular:true},
  {code:"PNQ",name:"Pune",full:"Pune Airport",country:"India",popular:true},
  {code:"COK",name:"Kochi",full:"Cochin International",country:"India",popular:true},
  {code:"AMD",name:"Ahmedabad",full:"Sardar Vallabhbhai Patel Intl",country:"India",popular:true},
  {code:"JAI",name:"Jaipur",full:"Jaipur International",country:"India",popular:true},
  {code:"LKO",name:"Lucknow",full:"Chaudhary Charan Singh Intl",country:"India",popular:false},
  {code:"VNS",name:"Varanasi",full:"Lal Bahadur Shastri Airport",country:"India",popular:false},
  {code:"PAT",name:"Patna",full:"Jay Prakash Narayan Airport",country:"India",popular:false},
  {code:"IXC",name:"Chandigarh",full:"Chandigarh Airport",country:"India",popular:false},
  {code:"GAU",name:"Guwahati",full:"Lokpriya Gopinath Bordoloi Intl",country:"India",popular:false},
  {code:"BBI",name:"Bhubaneswar",full:"Biju Patnaik International",country:"India",popular:false},
  {code:"CBE",name:"Coimbatore",full:"Coimbatore International",country:"India",popular:false},
  {code:"IXM",name:"Madurai",full:"Madurai Airport",country:"India",popular:false},
  {code:"IXE",name:"Mangalore",full:"Mangalore International",country:"India",popular:false},
  {code:"MYQ",name:"Mysore",full:"Mysore Airport",country:"India",popular:false},
  {code:"TRV",name:"Trivandrum",full:"Trivandrum International",country:"India",popular:false},
  {code:"VTZ",name:"Visakhapatnam",full:"Visakhapatnam Airport",country:"India",popular:false},
  {code:"IXR",name:"Ranchi",full:"Birsa Munda Airport",country:"India",popular:false},
  {code:"BHO",name:"Bhopal",full:"Raja Bhoj Airport",country:"India",popular:false},
  {code:"SXR",name:"Srinagar",full:"Sheikh ul-Alam Airport",country:"India",popular:false},
  {code:"IXJ",name:"Jammu",full:"Jammu Airport",country:"India",popular:false},
  {code:"NAG",name:"Nagpur",full:"Dr. Babasaheb Ambedkar Intl",country:"India",popular:false},
  {code:"IDR",name:"Indore",full:"Devi Ahilyabai Holkar Airport",country:"India",popular:false},
  {code:"IXL",name:"Leh",full:"Kushok Bakula Rimpochee Airport",country:"India",popular:false},
  {code:"IXZ",name:"Port Blair",full:"Veer Savarkar International",country:"India",popular:false},
  {code:"ATQ",name:"Amritsar",full:"Sri Guru Ram Dass Jee Intl",country:"India",popular:false},
  {code:"UDR",name:"Udaipur",full:"Maharana Pratap Airport",country:"India",popular:false},
  {code:"JDH",name:"Jodhpur",full:"Jodhpur Airport",country:"India",popular:false},
  {code:"TIR",name:"Tirupati",full:"Tirupati Airport",country:"India",popular:false},
  {code:"HBX",name:"Hubli",full:"Hubballi Airport",country:"India",popular:false},
  {code:"IXG",name:"Belgaum",full:"Belagavi Airport",country:"India",popular:false},
  {code:"DXB",name:"Dubai",full:"Dubai International",country:"UAE",popular:true},
  {code:"SIN",name:"Singapore",full:"Changi Airport",country:"Singapore",popular:true},
  {code:"BKK",name:"Bangkok",full:"Suvarnabhumi Airport",country:"Thailand",popular:true},
  {code:"LHR",name:"London",full:"Heathrow Airport",country:"UK",popular:true},
  {code:"JFK",name:"New York",full:"JFK International",country:"USA",popular:true},
  {code:"KUL",name:"Kuala Lumpur",full:"KLIA Airport",country:"Malaysia",popular:true},
  {code:"CMB",name:"Colombo",full:"Bandaranaike International",country:"Sri Lanka",popular:false},
  {code:"CDG",name:"Paris",full:"Charles de Gaulle",country:"France",popular:false},
  {code:"NRT",name:"Tokyo",full:"Narita International",country:"Japan",popular:false},
  {code:"SYD",name:"Sydney",full:"Kingsford Smith",country:"Australia",popular:false},
  {code:"FRA",name:"Frankfurt",full:"Frankfurt Airport",country:"Germany",popular:false},
  {code:"AMS",name:"Amsterdam",full:"Schiphol Airport",country:"Netherlands",popular:false},
  {code:"YYZ",name:"Toronto",full:"Pearson International",country:"Canada",popular:false},
  {code:"LAX",name:"Los Angeles",full:"LAX Airport",country:"USA",popular:false},
  {code:"HKG",name:"Hong Kong",full:"Hong Kong International",country:"Hong Kong",popular:false},
  {code:"DOH",name:"Doha",full:"Hamad International",country:"Qatar",popular:false},
  {code:"AUH",name:"Abu Dhabi",full:"Zayed International",country:"UAE",popular:false},
  {code:"IST",name:"Istanbul",full:"Istanbul Airport",country:"Turkey",popular:false},
  {code:"ICN",name:"Seoul",full:"Incheon International",country:"South Korea",popular:false},
  {code:"DPS",name:"Bali",full:"Ngurah Rai International",country:"Indonesia",popular:false},
  {code:"KTM",name:"Kathmandu",full:"Tribhuvan International",country:"Nepal",popular:false},
  {code:"MLE",name:"Maldives",full:"Velana International",country:"Maldives",popular:false},
];

const CITY_TO_IATA = {};
CITIES.forEach(c => { CITY_TO_IATA[c.name.toLowerCase()] = c.code; });

const BUS_CITIES = [
  "Bangalore","Chennai","Hyderabad","Mumbai","Pune","Delhi","Kolkata","Goa",
  "Kochi","Coimbatore","Madurai","Trivandrum","Mysore","Mangalore","Hubli","Belgaum",
  "Ahmedabad","Surat","Jaipur","Jodhpur","Udaipur","Lucknow","Agra","Varanasi",
  "Chandigarh","Amritsar","Bhubaneswar","Ranchi","Patna","Guwahati","Nagpur",
  "Indore","Bhopal","Visakhapatnam","Vijayawada","Coorg","Ooty","Pondicherry",
  "Salem","Trichy","Tirunelveli","Vellore","Nashik","Aurangabad","Kolhapur",
];

const HOTEL_CITIES = [
  "Bangalore","Mumbai","Delhi","Chennai","Hyderabad","Kolkata","Goa","Pune","Kochi",
  "Ahmedabad","Jaipur","Agra","Varanasi","Udaipur","Mysore","Shimla","Manali","Ooty",
  "Coorg","Munnar","Rishikesh","Haridwar","Amritsar","Chandigarh","Lucknow",
  "Dubai","Singapore","Bangkok","London","New York","Paris","Tokyo","Sydney",
  "Kuala Lumpur","Colombo","Bali","Phuket","Hong Kong","Istanbul","Rome","Barcelona",
  "Amsterdam","Zurich","Vienna","Frankfurt","Melbourne","Auckland","Seoul",
  "Maldives","Kathmandu","Doha","Abu Dhabi","Cairo","Nairobi",
];

const BUS_ROUTES = [
  {from:"Bangalore",to:"Chennai",dur:"5h 30m",dep:"06:00",arr:"11:30",price:650,type:"AC Sleeper",op:"VRL Travels"},
  {from:"Bangalore",to:"Chennai",dur:"5h 30m",dep:"21:00",arr:"02:30",price:550,type:"Semi-Sleeper",op:"KSRTC"},
  {from:"Bangalore",to:"Hyderabad",dur:"8h",dep:"20:00",arr:"04:00",price:800,type:"AC Sleeper",op:"SRS Travels"},
  {from:"Bangalore",to:"Goa",dur:"9h",dep:"21:30",arr:"06:30",price:900,type:"AC Sleeper",op:"Neeta Tours"},
  {from:"Bangalore",to:"Mumbai",dur:"16h",dep:"17:00",arr:"09:00",price:1400,type:"AC Sleeper",op:"VRL Travels"},
  {from:"Bangalore",to:"Pune",dur:"14h",dep:"18:00",arr:"08:00",price:1200,type:"AC Sleeper",op:"Paulo Travels"},
  {from:"Bangalore",to:"Coimbatore",dur:"4h",dep:"07:00",arr:"11:00",price:400,type:"AC Seater",op:"KSRTC"},
  {from:"Bangalore",to:"Mangalore",dur:"7h",dep:"22:00",arr:"05:00",price:700,type:"AC Sleeper",op:"VRL Travels"},
  {from:"Bangalore",to:"Mysore",dur:"3h",dep:"07:00",arr:"10:00",price:250,type:"AC Seater",op:"KSRTC"},
  {from:"Bangalore",to:"Kochi",dur:"10h",dep:"21:00",arr:"07:00",price:950,type:"AC Sleeper",op:"KSRTC"},
  {from:"Bangalore",to:"Trivandrum",dur:"11h",dep:"20:30",arr:"07:30",price:1100,type:"AC Sleeper",op:"KSRTC"},
  {from:"Bangalore",to:"Madurai",dur:"8h",dep:"21:00",arr:"05:00",price:750,type:"AC Sleeper",op:"Parveen Travels"},
  {from:"Bangalore",to:"Tirupati",dur:"5h",dep:"05:30",arr:"10:30",price:450,type:"AC Seater",op:"APSRTC"},
  {from:"Chennai",to:"Hyderabad",dur:"7h",dep:"21:00",arr:"04:00",price:750,type:"AC Sleeper",op:"TSRTC"},
  {from:"Chennai",to:"Bangalore",dur:"5h 30m",dep:"07:00",arr:"12:30",price:630,type:"AC Sleeper",op:"VRL Travels"},
  {from:"Chennai",to:"Coimbatore",dur:"4h 30m",dep:"08:00",arr:"12:30",price:350,type:"AC Seater",op:"TNSTC"},
  {from:"Chennai",to:"Madurai",dur:"5h",dep:"22:00",arr:"03:00",price:450,type:"AC Sleeper",op:"Parveen Travels"},
  {from:"Hyderabad",to:"Bangalore",dur:"8h",dep:"21:00",arr:"05:00",price:800,type:"AC Sleeper",op:"Orange Travels"},
  {from:"Hyderabad",to:"Mumbai",dur:"12h",dep:"18:00",arr:"06:00",price:1100,type:"AC Sleeper",op:"VRL Travels"},
  {from:"Mumbai",to:"Pune",dur:"3h",dep:"07:00",arr:"10:00",price:300,type:"AC Seater",op:"MSRTC"},
  {from:"Mumbai",to:"Goa",dur:"10h",dep:"22:00",arr:"08:00",price:950,type:"AC Sleeper",op:"Paulo Travels"},
  {from:"Mumbai",to:"Ahmedabad",dur:"8h",dep:"21:00",arr:"05:00",price:800,type:"AC Sleeper",op:"Patel Travels"},
  {from:"Delhi",to:"Jaipur",dur:"5h",dep:"06:00",arr:"11:00",price:500,type:"AC Seater",op:"RSRTC"},
  {from:"Delhi",to:"Agra",dur:"4h",dep:"07:00",arr:"11:00",price:400,type:"AC Seater",op:"UP Roadways"},
  {from:"Delhi",to:"Chandigarh",dur:"4h",dep:"08:00",arr:"12:00",price:450,type:"AC Seater",op:"HRTC"},
  {from:"Delhi",to:"Lucknow",dur:"7h",dep:"22:00",arr:"05:00",price:700,type:"AC Sleeper",op:"UP SRTC"},
  {from:"Delhi",to:"Haridwar",dur:"5h",dep:"06:30",arr:"11:30",price:500,type:"AC Seater",op:"Uttarakhand Roadways"},
  {from:"Kolkata",to:"Bhubaneswar",dur:"6h",dep:"21:00",arr:"03:00",price:600,type:"AC Sleeper",op:"OSRTC"},
  {from:"Kolkata",to:"Patna",dur:"9h",dep:"20:00",arr:"05:00",price:750,type:"AC Sleeper",op:"BSRTC"},
];

const CLASSES = ["Economy","Premium Economy","Business","First Class"];
const BUS_TYPES = ["Any","AC Sleeper","Semi-Sleeper","AC Seater"];

function fmtTime(dt){if(!dt)return"--:--";return new Date(dt).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false});}
function fmtDate(dt){if(!dt)return"";return new Date(dt).toLocaleDateString("en-IN",{day:"numeric",month:"short"});}
function calcDur(dep,arr){if(!dep||!arr)return"";const d=(new Date(arr)-new Date(dep))/60000;return`${Math.floor(d/60)}h${d%60>0?" "+d%60+"m":""}`.trim();}

// ── CITY SELECT MODAL ─────────────────────────────────────────────────────────
function CityModal({title,onSelect,onClose,exclude}){
  const [s,setS]=useState("");
  const shown=CITIES.filter(c=>c.code!==exclude&&(
    c.name.toLowerCase().includes(s.toLowerCase())||
    c.code.toLowerCase().includes(s.toLowerCase())||
    c.country.toLowerCase().includes(s.toLowerCase())
  ));
  const inp={
    width:"100%",padding:"11px 16px",borderRadius:12,fontSize:14,
    fontFamily:"'DM Sans',sans-serif",border:"1.5px solid rgba(201,168,76,0.3)",
    outline:"none",background:"#fafaf8",color:"#1a1410",marginBottom:12,
  };
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:480,background:"rgba(250,248,244,0.99)",borderRadius:22,padding:28,boxShadow:"0 24px 80px rgba(0,0,0,0.15)",border:"1px solid rgba(201,168,76,0.2)",maxHeight:"80vh",display:"flex",flexDirection:"column"}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:20,color:"#1a1410",marginBottom:14}}>{title}</div>
        <input autoFocus value={s} onChange={e=>setS(e.target.value)} placeholder="Search city, code or country…" style={inp}
          onFocus={e=>{e.target.style.borderColor=GOLD;e.target.style.boxShadow=`0 0 0 3px rgba(201,168,76,0.1)`;}}
          onBlur={e=>{e.target.style.borderColor="rgba(201,168,76,0.3)";e.target.style.boxShadow="none";}}/>
        {!s&&<div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#999",letterSpacing:"0.15em",marginBottom:8}}>POPULAR CITIES</div>}
        <div style={{display:"flex",flexDirection:"column",gap:5,overflowY:"auto",flex:1}}>
          {shown.filter(c=>!s?c.popular:true).concat(shown.filter(c=>!s?!c.popular:false)).map(city=>(
            <div key={city.code} onClick={()=>onSelect(city)}
              style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",borderRadius:11,cursor:"pointer",background:"rgba(255,255,255,0.7)",border:"1px solid rgba(201,168,76,0.1)",transition:"all 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(201,168,76,0.1)";e.currentTarget.style.borderColor="rgba(201,168,76,0.3)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.7)";e.currentTarget.style.borderColor="rgba(201,168,76,0.1)";}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:14,color:"#1a1410"}}>{city.name}</span>
                  {city.popular&&<span style={{fontSize:8,background:"rgba(201,168,76,0.15)",color:GOLD_DARK,padding:"2px 6px",borderRadius:6,fontFamily:"'Space Mono',monospace"}}>TOP</span>}
                </div>
                <div style={{fontSize:12,color:"#777",marginTop:2}}>{city.full} · {city.country}</div>
              </div>
              <div style={{fontFamily:"'Space Mono',monospace",fontWeight:700,fontSize:14,color:GOLD_DARK}}>{city.code}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BusCityModal({title,onSelect,onClose,exclude}){
  const [s,setS]=useState("");
  const shown=BUS_CITIES.filter(c=>c.toLowerCase().includes(s.toLowerCase())&&c!==exclude);
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:440,background:"rgba(250,248,244,0.99)",borderRadius:22,padding:28,boxShadow:"0 24px 80px rgba(0,0,0,0.15)",border:"1px solid rgba(201,168,76,0.2)",maxHeight:"75vh",display:"flex",flexDirection:"column"}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:20,color:"#1a1410",marginBottom:14}}>{title}</div>
        <input autoFocus value={s} onChange={e=>setS(e.target.value)} placeholder="Search city…"
          style={{width:"100%",padding:"11px 16px",borderRadius:12,fontSize:14,fontFamily:"'DM Sans',sans-serif",border:"1.5px solid rgba(201,168,76,0.3)",outline:"none",background:"#fafaf8",color:"#1a1410",marginBottom:12}}
          onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor="rgba(201,168,76,0.3)"}/>
        <div style={{display:"flex",flexDirection:"column",gap:5,overflowY:"auto",flex:1}}>
          {shown.map(city=>(
            <div key={city} onClick={()=>onSelect(city)}
              style={{padding:"13px 16px",borderRadius:11,cursor:"pointer",background:"rgba(255,255,255,0.7)",border:"1px solid rgba(201,168,76,0.1)",fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:600,color:"#1a1410",transition:"all 0.15s"}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(201,168,76,0.1)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.7)"}>
              🚌 {city}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HotelCityModal({title,onSelect,onClose}){
  const [s,setS]=useState("");
  const shown=HOTEL_CITIES.filter(c=>c.toLowerCase().includes(s.toLowerCase()));
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:440,background:"rgba(250,248,244,0.99)",borderRadius:22,padding:28,boxShadow:"0 24px 80px rgba(0,0,0,0.15)",border:"1px solid rgba(201,168,76,0.2)",maxHeight:"75vh",display:"flex",flexDirection:"column"}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:20,color:"#1a1410",marginBottom:14}}>{title}</div>
        <input autoFocus value={s} onChange={e=>setS(e.target.value)} placeholder="Search city…"
          style={{width:"100%",padding:"11px 16px",borderRadius:12,fontSize:14,fontFamily:"'DM Sans',sans-serif",border:"1.5px solid rgba(201,168,76,0.3)",outline:"none",background:"#fafaf8",color:"#1a1410",marginBottom:12}}
          onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor="rgba(201,168,76,0.3)"}/>
        <div style={{display:"flex",flexDirection:"column",gap:5,overflowY:"auto",flex:1}}>
          {shown.map(city=>(
            <div key={city} onClick={()=>onSelect(city)}
              style={{padding:"13px 16px",borderRadius:11,cursor:"pointer",background:"rgba(255,255,255,0.7)",border:"1px solid rgba(201,168,76,0.1)",fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:600,color:"#1a1410",transition:"all 0.15s"}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(201,168,76,0.1)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.7)"}>
              🏨 {city}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── TRAIN STATION SEARCH ──────────────────────────────────────────────────────
const STATIONS = [
  {name:"Bangalore (Bengaluru)",code:"SBC"},{name:"Yeshwanthpur Bangalore",code:"YPR"},
  {name:"Mumbai CSMT",code:"CSTM"},{name:"Mumbai Central",code:"BCT"},
  {name:"Delhi New Delhi",code:"NDLS"},{name:"Delhi Hazrat Nizamuddin",code:"NZM"},
  {name:"Chennai Central",code:"MAS"},{name:"Chennai Egmore",code:"MS"},
  {name:"Hyderabad Deccan",code:"HYB"},{name:"Secunderabad",code:"SC"},
  {name:"Kolkata Howrah",code:"HWH"},{name:"Kolkata Sealdah",code:"SDAH"},
  {name:"Pune Junction",code:"PUNE"},{name:"Kochi Ernakulam",code:"ERS"},
  {name:"Jaipur Junction",code:"JP"},{name:"Ahmedabad Junction",code:"ADI"},
  {name:"Lucknow Charbagh",code:"LKO"},{name:"Varanasi Junction",code:"BSB"},
  {name:"Patna Junction",code:"PNBE"},{name:"Bhopal Junction",code:"BPL"},
  {name:"Nagpur Junction",code:"NGP"},{name:"Chandigarh",code:"CDG"},
  {name:"Guwahati",code:"GHY"},{name:"Coimbatore Junction",code:"CBE"},
  {name:"Madurai Junction",code:"MDU"},{name:"Trivandrum Central",code:"TVC"},
  {name:"Visakhapatnam",code:"VSKP"},{name:"Ranchi",code:"RNC"},
  {name:"Amritsar",code:"ASR"},{name:"Indore Junction",code:"INDB"},
  {name:"Vijayawada Junction",code:"BZA"},{name:"Hubli Junction",code:"UBL"},
  {name:"Mangalore Central",code:"MAQ"},{name:"Mysore Junction",code:"MYS"},
  {name:"Agra Cantt",code:"AGC"},{name:"Mathura Junction",code:"MTJ"},
  {name:"Allahabad Junction",code:"ALD"},{name:"Gorakhpur",code:"GKP"},
  {name:"Dehradun",code:"DDN"},{name:"Haridwar",code:"HW"},
  {name:"Salem Junction",code:"SA"},{name:"Tirunelveli Junction",code:"TEN"},
  {name:"Hosur",code:"HOS"},{name:"Erode Junction",code:"ED"},
  {name:"Nagercoil Junction",code:"NCJ"},{name:"Kanyakumari",code:"CAPE"},
  {name:"Thrissur",code:"TCR"},{name:"Kozhikode Calicut",code:"CLT"},
  {name:"Kolhapur CSMT",code:"KOP"},{name:"Nashik Road",code:"NK"},
  {name:"Surat",code:"ST"},{name:"Vadodara Junction",code:"BRC"},
];

function TrainPanel() {
  const [from,setFrom]=useState("Bangalore (Bengaluru)");
  const [to,setTo]=useState("Chennai Central");
  const [date,setDate]=useState("");
  const [fromQ,setFromQ]=useState("Bangalore (Bengaluru)");
  const [toQ,setToQ]=useState("Chennai Central");
  const [fromOpen,setFromOpen]=useState(false);
  const [toOpen,setToOpen]=useState(false);
  const today=new Date().toISOString().split("T")[0];

  const fromFiltered=fromQ.trim()?STATIONS.filter(s=>s.name.toLowerCase().includes(fromQ.toLowerCase())||s.code.toLowerCase().includes(fromQ.toLowerCase())).slice(0,8):STATIONS.slice(0,8);
  const toFiltered=toQ.trim()?STATIONS.filter(s=>s.name.toLowerCase().includes(toQ.toLowerCase())||s.code.toLowerCase().includes(toQ.toLowerCase())).slice(0,8):STATIONS.slice(0,8);

  const selectFrom=s=>{setFrom(s.name);setFromQ(s.name);setFromOpen(false);};
  const selectTo=s=>{setTo(s.name);setToQ(s.name);setToOpen(false);};
  const swap=()=>{const tmp=from;setFrom(to);setFromQ(to);setTo(tmp);setToQ(tmp);};

  const search=()=>{
    const fc=STATIONS.find(s=>s.name===from)?.code||from.slice(0,4).toUpperCase();
    const tc=STATIONS.find(s=>s.name===to)?.code||to.slice(0,4).toUpperCase();
    let url=`https://www.irctc.co.in/nget/train-search?fromStation=${fc}&toStation=${tc}&isCallFromDpDown=true&quota=GN&class=SL`;
    if(date){const d=new Date(date);const dd=String(d.getDate()).padStart(2,"0");const mm=String(d.getMonth()+1).padStart(2,"0");const yyyy=d.getFullYear();url+=`&journeyDate=${dd}-${mm}-${yyyy}`;}
    window.open(url,"_blank","noopener,noreferrer");
  };

  const inp2={padding:"11px 14px",borderRadius:12,fontSize:14,fontFamily:"'DM Sans',sans-serif",border:"1.5px solid rgba(201,168,76,0.25)",outline:"none",color:"#1a1410",background:"rgba(255,255,255,0.85)",width:"100%",boxSizing:"border-box"};
  const dropStyle={position:"absolute",top:"100%",left:0,right:0,zIndex:200,background:"#fff",borderRadius:10,boxShadow:"0 8px 28px rgba(0,0,0,0.12)",border:"1px solid rgba(201,168,76,0.2)",maxHeight:220,overflowY:"auto",marginTop:2};

  const POPULAR=[
    {from:"Bangalore (Bengaluru)",to:"Chennai Central"},
    {from:"Delhi New Delhi",to:"Mumbai CSMT"},
    {from:"Bangalore (Bengaluru)",to:"Mysore Junction"},
    {from:"Hyderabad Deccan",to:"Bangalore (Bengaluru)"},
    {from:"Delhi New Delhi",to:"Varanasi Junction"},
    {from:"Mumbai CSMT",to:"Pune Junction"},
  ];

  return (
    <div style={{animation:"fadeUp 0.4s both"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:10,alignItems:"center",marginBottom:14}}>
        <div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:700,color:GOLD_DARK,marginBottom:6,letterSpacing:"0.08em"}}>FROM STATION</div>
          <div style={{position:"relative"}}>
            <input value={fromQ} placeholder="Station or city..."
              onChange={e=>{setFromQ(e.target.value);setFromOpen(true);}}
              onFocus={e=>{e.target.select();setFromQ("");setFromOpen(true);}}
              onBlur={()=>setTimeout(()=>{setFromOpen(false);if(!fromQ.trim())setFromQ(from);},200)}
              style={inp2}/>
            {fromOpen&&fromFiltered.length>0&&(
              <div style={dropStyle}>
                {fromFiltered.map(s=>(
                  <div key={s.code} onMouseDown={()=>selectFrom(s)}
                    style={{padding:"9px 14px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#1a1410",display:"flex",justifyContent:"space-between",alignItems:"center"}}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(201,168,76,0.08)"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <span>{s.name}</span>
                    <span style={{fontSize:10,color:GOLD_DARK,fontFamily:"'Space Mono',monospace",background:"rgba(201,168,76,0.12)",padding:"2px 6px",borderRadius:4}}>{s.code}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <button onClick={swap} style={{width:40,height:40,borderRadius:"50%",background:"rgba(201,168,76,0.12)",border:"1.5px solid rgba(201,168,76,0.3)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:18,color:GOLD_DARK,marginTop:18,flexShrink:0,transition:"transform 0.3s"}}
          onMouseEnter={e=>e.currentTarget.style.transform="rotate(180deg)"}
          onMouseLeave={e=>e.currentTarget.style.transform="rotate(0)"}>⇄</button>
        <div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:700,color:GOLD_DARK,marginBottom:6,letterSpacing:"0.08em"}}>TO STATION</div>
          <div style={{position:"relative"}}>
            <input value={toQ} placeholder="Station or city..."
              onChange={e=>{setToQ(e.target.value);setToOpen(true);}}
              onFocus={e=>{e.target.select();setToQ("");setToOpen(true);}}
              onBlur={()=>setTimeout(()=>{setToOpen(false);if(!toQ.trim())setToQ(to);},200)}
              style={inp2}/>
            {toOpen&&toFiltered.length>0&&(
              <div style={dropStyle}>
                {toFiltered.map(s=>(
                  <div key={s.code} onMouseDown={()=>selectTo(s)}
                    style={{padding:"9px 14px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#1a1410",display:"flex",justifyContent:"space-between",alignItems:"center"}}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(201,168,76,0.08)"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <span>{s.name}</span>
                    <span style={{fontSize:10,color:GOLD_DARK,fontFamily:"'Space Mono',monospace",background:"rgba(201,168,76,0.12)",padding:"2px 6px",borderRadius:4}}>{s.code}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div style={{marginBottom:16}}>
        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:700,color:GOLD_DARK,marginBottom:6,letterSpacing:"0.08em"}}>JOURNEY DATE</div>
        <input type="date" value={date} min={today} onChange={e=>setDate(e.target.value)} style={inp2}/>
      </div>
      <button onClick={search} style={{width:"100%",padding:"14px",borderRadius:13,fontSize:15,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.08em",color:"#1a1410",border:"none",cursor:"pointer",background:GRAD,backgroundSize:"200% 200%",animation:"gradShift 3s ease infinite",boxShadow:"0 6px 22px rgba(201,168,76,0.4)",marginBottom:16}}>
        Search Trains on IRCTC 🚂
      </button>
      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#aaa",marginBottom:12,textAlign:"center"}}>✅ Route pre-filled on IRCTC — just select class and pay</div>
      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:GOLD_DARK,marginBottom:8,letterSpacing:"0.06em"}}>POPULAR ROUTES</div>
      <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
        {POPULAR.map((r,i)=>(
          <button key={i} onClick={()=>{setFrom(r.from);setFromQ(r.from);setTo(r.to);setToQ(r.to);}}
            style={{padding:"7px 13px",borderRadius:100,fontSize:11,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:"rgba(201,168,76,0.08)",border:"1px solid rgba(201,168,76,0.22)",color:GOLD_DARK,fontWeight:500}}>
            {r.from.split(" ")[0]} → {r.to.split(" ")[0]}
          </button>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN SEARCH PAGE
// ══════════════════════════════════════════════════════════════════════════════
function SearchPage() {
  const navigate = useNavigate();
  const [travelType,setTravelType]=useState("flight");
  const [tripType,setTripType]=useState("oneway");
  const [fromCity,setFromCity]=useState(CITIES[0]);
  const [toCity,setToCity]=useState(CITIES[1]);
  const [busFrom,setBusFrom]=useState("Bangalore");
  const [busTo,setBusTo]=useState("Chennai");
  const [hotelCity,setHotelCity]=useState("Bangalore");
  const [date,setDate]=useState("");
  const [returnDate,setReturnDate]=useState("");
  const [checkOut,setCheckOut]=useState("");
  const [passengers,setPassengers]=useState(1);
  const [cabinClass,setCabinClass]=useState("Economy");
  const [busType,setBusType]=useState("Any");
  const [showFromModal,setShowFromModal]=useState(false);
  const [showToModal,setShowToModal]=useState(false);
  const [showBusFromModal,setShowBusFromModal]=useState(false);
  const [showBusToModal,setShowBusToModal]=useState(false);
  const [showHotelModal,setShowHotelModal]=useState(false);
  const [validErr,setValidErr]=useState("");
  const [loading,setLoading]=useState(false);
  const [searched,setSearched]=useState(false);
  const [flights,setFlights]=useState([]);
  const [buses,setBuses]=useState([]);
  const [filtered,setFiltered]=useState([]);
  const [filterTime,setFilterTime]=useState("any");
  const [filterMaxPrice,setFilterMaxPrice]=useState(20000);
  const [sortBy,setSortBy]=useState("price");
  const [navScrolled,setNavScrolled]=useState(false);
  const [specialFare,setSpecialFare]=useState("regular");
  const [prevTab,setPrevTab]=useState("flight");
  const [tabTransition,setTabTransition]=useState(false);

  const today=new Date().toISOString().split("T")[0];
  let user={};try{user=JSON.parse(localStorage.getItem("user")||"{}");}catch{}
  const token=localStorage.getItem("token");

  useEffect(()=>{
    if(!token){navigate("/login");return;}
    try{const payload=JSON.parse(atob(token.split(".")[1]));if(payload.exp&&payload.exp*1000<Date.now()){localStorage.removeItem("token");localStorage.removeItem("user");navigate("/login");}}catch{}
  },[token,navigate]);

  useEffect(()=>{fetch(`${API}/test`).catch(()=>{});const t=setInterval(()=>fetch(`${API}/test`).catch(()=>{}),14*60*1000);return()=>clearInterval(t);},[]);
  useEffect(()=>{const fn=()=>setNavScrolled(window.scrollY>30);window.addEventListener("scroll",fn,{passive:true});return()=>window.removeEventListener("scroll",fn);},[]);

  // Filter flights/buses
  useEffect(()=>{
    const items=travelType==="bus"?buses:flights;
    let r=[...items];
    if(travelType==="flight"){
      if(filterTime==="morning")r=r.filter(f=>{const h=new Date(f.departure_time).getHours();return h>=5&&h<12;});
      if(filterTime==="afternoon")r=r.filter(f=>{const h=new Date(f.departure_time).getHours();return h>=12&&h<17;});
      if(filterTime==="evening")r=r.filter(f=>{const h=new Date(f.departure_time).getHours();return h>=17;});
    }
    r=r.filter(f=>f.price<=filterMaxPrice);
    if(sortBy==="price")r.sort((a,b)=>a.price-b.price);
    if(sortBy==="price-desc")r.sort((a,b)=>b.price-a.price);
    if(sortBy==="departure"&&travelType==="flight")r.sort((a,b)=>new Date(a.departure_time)-new Date(b.departure_time));
    setFiltered(r);
  },[flights,buses,filterTime,filterMaxPrice,sortBy,travelType]);

  const swapFlight=useCallback(()=>{setFromCity(toCity);setToCity(fromCity);},[fromCity,toCity]);
  const swapBus=useCallback(()=>{setBusFrom(busTo);setBusTo(busFrom);},[busFrom,busTo]);

  const switchTab=(newTab)=>{
    if(newTab===travelType)return;
    setPrevTab(travelType);
    setTabTransition(true);
    setTravelType(newTab);
    setFlights([]);setBuses([]);setSearched(false);setValidErr("");
    setTimeout(()=>setTabTransition(false),400);
  };

  // Synchronous flight link opener — avoids popup blocker
  const openFlightNow=(fromName,toName,dateStr,pax)=>{
    const fc=CITY_TO_IATA[fromName?.toLowerCase()]||fromName?.slice(0,3).toUpperCase()||"BLR";
    const tc=CITY_TO_IATA[toName?.toLowerCase()]||toName?.slice(0,3).toUpperCase()||"BOM";
    const url=flightLink(fc,tc,dateStr||"",pax||1);
    track("flight_click",`${fromName}→${toName}`,"web");
    window.open(url,"_blank","noopener,noreferrer");
  };

  const searchFlights=()=>{
    setValidErr("");
    if(!date){setValidErr("Please select a departure date");return;}
    // Open Aviasales immediately — synchronous, not inside async, so popup blocker won't trigger
    openFlightNow(fromCity.name,toCity.name,date,passengers);
    // Show loading state for UX
    setLoading(true);setSearched(true);setFlights([]);
    // Fetch DB results in background (non-blocking)
    axios.get(`${API}/flights?from=${encodeURIComponent(fromCity.name)}&to=${encodeURIComponent(toCity.name)}&date=${date}`)
      .then(res=>{
        const data=res.data||[];
        if(data.length>0){
          setFlights(data);
          setFilterMaxPrice(Math.max(...data.map(f=>f.price))+1000);
        } else {
          setFlights([{id:"aff",affiliate:true,from_city:fromCity.name,to_city:toCity.name,airline:"Live Search"}]);
        }
      })
      .catch(()=>{
        setFlights([{id:"aff",affiliate:true,from_city:fromCity.name,to_city:toCity.name,airline:"Live Search"}]);
      })
      .finally(()=>setLoading(false));
  };

  const searchBuses=()=>{
    setValidErr("");
    if(!date){setValidErr("Please select a travel date");return;}
    // Directly redirect to RedBus with pre-filled from, to and date — just like flights go to Aviasales
    track("bus_search",`${busFrom}→${busTo}`,"web");
    window.open(busLink(busFrom,busTo,date),"_blank","noopener,noreferrer");
  };

  const openFlightLink=(from,to)=>{
    const fc=CITY_TO_IATA[from?.toLowerCase()]||from?.slice(0,3).toUpperCase()||"BLR";
    const tc=CITY_TO_IATA[to?.toLowerCase()]||to?.slice(0,3).toUpperCase()||"BOM";
    const url=flightLink(fc,tc,date,passengers);
    track("flight_click",`${from}→${to}`,"web");
    window.open(url,"_blank","noopener,noreferrer");
  };

  const isDomestic=fromCity.country==="India"&&toCity.country==="India";

  // ── STYLES ──────────────────────────────────────────────────────────────────
  const lbl={fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:700,color:GOLD_DARK,display:"block",marginBottom:7,letterSpacing:"0.08em"};
  const inp={background:"rgba(255,255,255,0.85)",borderRadius:12,padding:"12px 14px",border:"1.5px solid rgba(201,168,76,0.22)",transition:"border-color 0.2s, box-shadow 0.2s"};
  const sText={fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#5a4a3a"};

  const TRAVEL_TABS=[
    {id:"flight",icon:"✈️",label:"Flights"},
    {id:"bus",icon:"🚌",label:"Buses"},
    {id:"hotel",icon:"🏨",label:"Hotels"},
    {id:"train",icon:"🚂",label:"Trains"},
    {id:"cab",icon:"🚗",label:"Cabs",soon:true},
  ];

  const SPECIAL_FARES=[
    {id:"regular",label:"Regular"},{id:"student",label:"Student"},
    {id:"senior",label:"Senior Citizen"},{id:"armed",label:"Armed Forces"},{id:"doctor",label:"Doctor / Nurse"},
  ];

  // Tab backgrounds
  const TabBg={flight:<FlightAnimation/>,bus:<BusAnimation/>,hotel:<HotelAnimation/>,train:<TrainAnimation/>,cab:<CabAnimation/>};

  return (
    <div style={{minHeight:"100vh",background:CREAM,position:"relative",overflowX:"hidden",fontFamily:"'DM Sans',sans-serif",transition:"background 0.5s ease"}}>
      <style>{SHARED_CSS}</style>
      <AuroraBackground/>

      {/* MODALS */}
      {showFromModal&&<CityModal title="Select departure city" onSelect={c=>{setFromCity(c);setShowFromModal(false);}} onClose={()=>setShowFromModal(false)} exclude={toCity.code}/>}
      {showToModal&&<CityModal title="Select destination city" onSelect={c=>{setToCity(c);setShowToModal(false);}} onClose={()=>setShowToModal(false)} exclude={fromCity.code}/>}
      {showBusFromModal&&<BusCityModal title="Bus departure city" onSelect={c=>{setBusFrom(c);setShowBusFromModal(false);}} onClose={()=>setShowBusFromModal(false)} exclude={busTo}/>}
      {showBusToModal&&<BusCityModal title="Bus destination city" onSelect={c=>{setBusTo(c);setShowBusToModal(false);}} onClose={()=>setShowBusToModal(false)} exclude={busFrom}/>}
      {showHotelModal&&<HotelCityModal title="Select hotel city" onSelect={c=>{setHotelCity(c);setShowHotelModal(false);}} onClose={()=>setShowHotelModal(false)}/>}

      {/* NAV */}
      <nav style={{position:"sticky",top:0,zIndex:200,height:66,padding:"0 5%",display:"flex",alignItems:"center",justifyContent:"space-between",background:navScrolled?"rgba(250,248,244,0.97)":"rgba(250,248,244,0.88)",backdropFilter:"blur(22px)",borderBottom:"1px solid rgba(201,168,76,0.12)",transition:"all 0.3s"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>navigate("/")}>
          <div style={{animation:"floatUD 4s ease-in-out infinite"}}><AlvrynIcon size={38}/></div>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:16,color:"#1a1410",letterSpacing:"0.12em",lineHeight:1.1}}>ALVRYN</div>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:7,color:GOLD,letterSpacing:"0.18em"}}>TRAVEL BEYOND</div>
          </div>
        </div>
        <div className="nav-right-btns" style={{display:"flex",gap:8,flexWrap:"nowrap",alignItems:"center"}}>
          <button onClick={()=>navigate("/ai")} style={{padding:"8px 18px",borderRadius:10,fontSize:13,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.04em",cursor:"pointer",background:GRAD,backgroundSize:"200% 200%",animation:"gradShift 3s ease infinite",color:"#1a1410",border:"none",boxShadow:"0 4px 12px rgba(201,168,76,0.28)"}}>🤖 AI Chat</button>
          <button className="nav-bookings" onClick={()=>navigate("/bookings")} style={{padding:"8px 16px",borderRadius:10,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:"transparent",color:"#3a2a1a",border:"1.5px solid rgba(0,0,0,0.15)"}}>
            <span className="btn-label">My Bookings</span>
          </button>
          <button onClick={()=>navigate("/profile")} style={{padding:"8px 16px",borderRadius:10,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:"rgba(201,168,76,0.12)",color:GOLD_DARK,border:"1.5px solid rgba(201,168,76,0.3)"}}>Profile</button>
          <button onClick={()=>{localStorage.removeItem("token");localStorage.removeItem("user");navigate("/login");}} style={{padding:"8px 16px",borderRadius:10,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:"#fff0f0",color:"#cc2222",border:"1.5px solid rgba(200,34,34,0.25)"}}>Sign Out</button>
        </div>
      </nav>

      <div style={{position:"relative",zIndex:1,maxWidth:960,margin:"0 auto",padding:"32px 5% 80px"}}>

        {/* GREETING */}
        <div style={{marginBottom:28,animation:"fadeUp 0.6s both"}}>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:GOLD_DARK,letterSpacing:"0.2em",marginBottom:8}}>SEARCH TRAVEL</div>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:"clamp(22px,4vw,42px)",color:"#1a1410",marginBottom:4}}>
            Hey {user.name?.split(" ")[0]||"Traveller"} 👋
          </h1>
          <p style={{fontSize:15,color:"#4a3a2a",fontWeight:500}}>Where do you want to fly, ride or stay today?</p>
        </div>

        {/* AI CHAT BANNER */}
        <div onClick={()=>navigate("/ai")} style={{marginBottom:24,padding:"14px 20px",borderRadius:14,background:"linear-gradient(135deg,rgba(201,168,76,0.12),rgba(240,208,128,0.08))",border:"1px solid rgba(201,168,76,0.3)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",transition:"all 0.2s",animation:"fadeUp 0.6s 0.1s both"}}
          onMouseEnter={e=>{e.currentTarget.style.background="linear-gradient(135deg,rgba(201,168,76,0.18),rgba(240,208,128,0.12))";e.currentTarget.style.borderColor="rgba(201,168,76,0.5)";}}
          onMouseLeave={e=>{e.currentTarget.style.background="linear-gradient(135deg,rgba(201,168,76,0.12),rgba(240,208,128,0.08))";e.currentTarget.style.borderColor="rgba(201,168,76,0.3)";}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:24}}>🤖</span>
            <div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:16,color:"#1a1410"}}>Plan with Alvryn AI</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#5a4a3a"}}>Complete door-to-door trip planning · Any destination worldwide</div>
            </div>
          </div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:GOLD_DARK,fontWeight:600,whiteSpace:"nowrap"}}>Chat now →</div>
        </div>

        {/* TRAVEL TYPE TABS */}
        <div style={{display:"flex",gap:0,borderRadius:"16px 16px 0 0",position:"relative",minHeight:80,overflow:"hidden"}}>
          {/* Dark base background */}
          <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,#1a140a,#2a1e0c)",borderRadius:"16px 16px 0 0",zIndex:0}}/>
          {/* Tab animation layer — MUST be visible, very low overlay */}
          <div style={{position:"absolute",inset:0,borderRadius:"16px 16px 0 0",overflow:"hidden",zIndex:1,opacity:tabTransition?0:1,transition:"opacity 0.5s ease"}}>
            {TabBg[travelType]}
          </div>
          {/* Very light overlay — just enough to keep text readable, NOT covering animations */}
          <div style={{position:"absolute",inset:0,background:"rgba(15,10,3,0.38)",borderRadius:"16px 16px 0 0",zIndex:2}}/>
          {/* Tabs — on top */}
          {TRAVEL_TABS.map((tab,i)=>(
            <button key={tab.id} onClick={()=>switchTab(tab.id)}
              style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"14px 8px",cursor:"pointer",border:"none",position:"relative",zIndex:3,
                borderBottom:travelType===tab.id?`3px solid ${GOLD}`:"3px solid transparent",
                background:travelType===tab.id?"rgba(201,168,76,0.22)":"transparent",
                color:travelType===tab.id?GOLD:"rgba(255,235,190,0.7)",
                fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,transition:"all 0.25s",whiteSpace:"nowrap",
                borderRadius:i===0?"16px 0 0 0":i===TRAVEL_TABS.length-1?"0 16px 0 0":"0"}}>
              <span style={{fontSize:20,transition:"transform 0.25s",transform:travelType===tab.id?"scale(1.18)":"scale(1)"}}>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.soon&&<span style={{fontSize:7,background:"rgba(201,168,76,0.2)",color:GOLD,padding:"1px 5px",borderRadius:5,letterSpacing:"0.5px"}}>SOON</span>}
            </button>
          ))}
        </div>

        {/* SEARCH PANEL */}
        <div style={{background:"rgba(255,255,255,0.92)",backdropFilter:"blur(14px)",borderRadius:"0 0 20px 20px",padding:"clamp(18px,4vw,28px) clamp(16px,4vw,26px)",boxShadow:"0 8px 32px rgba(0,0,0,0.06)",border:"1px solid rgba(201,168,76,0.15)",borderTop:"none",marginBottom:22,animation:"fadeUp 0.4s both",opacity:tabTransition?0.6:1,transition:"opacity 0.3s"}}>

          {/* Coming soon */}
          {travelType==="cab"&&(
            <div style={{textAlign:"center",padding:"48px 20px"}}>
              <div style={{fontSize:52,marginBottom:14}}>🚗</div>
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:22,color:"#1a1410",marginBottom:10}}>Cab Booking — Coming Soon</h2>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"#555",lineHeight:1.7,maxWidth:380,margin:"0 auto"}}>Airport transfers and intercity cabs — coming very soon. Try AI Chat for complete trip planning!</p>
            </div>
          )}

          {/* Train */}
          {travelType==="train"&&<TrainPanel/>}

          {/* Hotel */}
          {travelType==="hotel"&&(
            <>
              <div style={{marginBottom:16}}>
                <label style={lbl}>DESTINATION</label>
                <div onClick={()=>setShowHotelModal(true)} style={{...inp,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=GOLD;e.currentTarget.style.background="rgba(201,168,76,0.06)";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(201,168,76,0.22)";e.currentTarget.style.background="rgba(255,255,255,0.85)";}}>
                  <div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:22,color:"#1a1410"}}>🏨 {hotelCity}</div>
                    <div style={{...sText,marginTop:2}}>Tap to change city</div>
                  </div>
                  <span style={{color:GOLD_DARK,fontSize:18}}>›</span>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                <div style={{...inp,borderColor:!date&&validErr?"#ef4444":"rgba(201,168,76,0.22)"}}>
                  <label style={lbl}>CHECK-IN{!date&&<span style={{color:"#ef4444"}}> *</span>}</label>
                  <input type="date" value={date} min={today} onChange={e=>{setDate(e.target.value);setValidErr("");}} style={{background:"transparent",border:"none",outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:600,color:"#1a1410",width:"100%",cursor:"pointer"}}/>
                </div>
                <div style={inp}>
                  <label style={lbl}>CHECK-OUT</label>
                  <input type="date" value={checkOut} min={date||today} onChange={e=>setCheckOut(e.target.value)} style={{background:"transparent",border:"none",outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:600,color:"#1a1410",width:"100%",cursor:"pointer"}}/>
                </div>
              </div>
              {validErr&&<div style={{padding:"10px 14px",borderRadius:10,background:"#FFF0F0",border:"1px solid #FFCDD2",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#cc2222",marginBottom:12,fontWeight:500}}>{validErr}</div>}
              <button onClick={()=>{setValidErr("");if(!date){setValidErr("Please select a check-in date");return;}track("hotel_search",hotelCity,"web");window.open(hotelLink(hotelCity,date,checkOut),"_blank","noopener,noreferrer");}}
                style={{width:"100%",padding:"15px",borderRadius:14,fontSize:15,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.08em",color:"#1a1410",border:"none",cursor:"pointer",background:GRAD,backgroundSize:"200% 200%",animation:"gradShift 4s ease infinite",boxShadow:"0 8px 28px rgba(201,168,76,0.4)"}}>
                Search Hotels 🏨
              </button>
              <div style={{textAlign:"center",marginTop:10,fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#888"}}>Best prices on our partner site</div>
            </>
          )}

          {/* Bus */}
          {travelType==="bus"&&(
            <>
              <div className="search-city-grid" style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:10,alignItems:"center",marginBottom:12}}>
                {[{label:"FROM",city:busFrom,onClick:()=>setShowBusFromModal(true)},null,{label:"TO",city:busTo,onClick:()=>setShowBusToModal(true)}].map((item,i)=>item===null?(
                  <button key="swap" onClick={swapBus} style={{width:40,height:40,borderRadius:"50%",background:"rgba(201,168,76,0.12)",border:"1.5px solid rgba(201,168,76,0.3)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:18,color:GOLD_DARK,transition:"transform 0.3s",justifySelf:"center"}}
                    onMouseEnter={e=>e.currentTarget.style.transform="rotate(180deg)"}
                    onMouseLeave={e=>e.currentTarget.style.transform="rotate(0)"}>⇄</button>
                ):(
                  <div key={item.label} onClick={item.onClick} style={{...inp,cursor:"pointer"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=GOLD;e.currentTarget.style.background="rgba(201,168,76,0.06)";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(201,168,76,0.22)";e.currentTarget.style.background="rgba(255,255,255,0.85)";}}>
                    <div style={{...lbl,marginBottom:4}}>{item.label}</div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:20,color:"#1a1410"}}>🚌 {item.city}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
                <div style={{...inp,borderColor:!date&&validErr?"#ef4444":"rgba(201,168,76,0.22)"}}>
                  <label style={lbl}>TRAVEL DATE{!date&&<span style={{color:"#ef4444"}}> *</span>}</label>
                  <input type="date" value={date} min={today} onChange={e=>{setDate(e.target.value);setValidErr("");}} style={{background:"transparent",border:"none",outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:600,color:"#1a1410",width:"100%",cursor:"pointer"}}/>
                  {date&&<div style={{fontSize:12,color:"#5a4a3a",marginTop:2,fontWeight:500}}>{new Date(date).toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"})}</div>}
                </div>
                <div style={inp}>
                  <label style={lbl}>PASSENGERS</label>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <button onClick={()=>setPassengers(p=>Math.max(1,p-1))} style={{width:30,height:30,borderRadius:"50%",background:"rgba(201,168,76,0.12)",border:"1px solid rgba(201,168,76,0.3)",color:GOLD_DARK,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>-</button>
                    <span style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:20,color:"#1a1410",minWidth:20,textAlign:"center"}}>{passengers}</span>
                    <button onClick={()=>setPassengers(p=>Math.min(6,p+1))} style={{width:30,height:30,borderRadius:"50%",background:"rgba(201,168,76,0.12)",border:"1px solid rgba(201,168,76,0.3)",color:GOLD_DARK,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>+</button>
                  </div>
                </div>
                <div style={inp}>
                  <label style={lbl}>BUS TYPE</label>
                  <select value={busType} onChange={e=>setBusType(e.target.value)} style={{background:"transparent",border:"none",outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,color:"#1a1410",width:"100%",cursor:"pointer"}}>{BUS_TYPES.map(t=><option key={t}>{t}</option>)}</select>
                </div>
              </div>
              {validErr&&<div style={{padding:"10px 14px",borderRadius:10,background:"#FFF0F0",border:"1px solid #FFCDD2",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#cc2222",marginBottom:12,fontWeight:500}}>{validErr}</div>}
              <button onClick={searchBuses} style={{width:"100%",padding:"15px",borderRadius:14,fontSize:15,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.08em",color:"#1a1410",border:"none",cursor:"pointer",background:GRAD,backgroundSize:"200% 200%",animation:"gradShift 4s ease infinite",boxShadow:"0 8px 28px rgba(201,168,76,0.4)"}}>
                Search Buses 🚌
              </button>
            </>
          )}

          {/* Flight */}
          {travelType==="flight"&&(
            <>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,flexWrap:"wrap",gap:8}}>
                <div style={{display:"flex",gap:0,background:"rgba(201,168,76,0.08)",borderRadius:10,padding:3}}>
                  {["oneway","roundtrip"].map(t=>(
                    <button key={t} onClick={()=>setTripType(t)} style={{padding:"7px 16px",border:"none",borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,cursor:"pointer",transition:"all 0.2s",background:tripType===t?"rgba(255,255,255,0.95)":"transparent",color:tripType===t?"#1a1410":"#666",boxShadow:tripType===t?"0 2px 6px rgba(0,0,0,0.08)":"none"}}>
                      {t==="oneway"?"One Way":"Round Trip"}
                    </button>
                  ))}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:8,background:`rgba(201,168,76,${isDomestic?0.1:0.06})`,border:`1px solid rgba(201,168,76,${isDomestic?0.3:0.18})`}}>
                  <span>{isDomestic?"🇮🇳":"🌍"}</span>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,color:GOLD_DARK}}>{isDomestic?"Domestic":"International"}</span>
                </div>
              </div>
              <div className="search-city-grid" style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:10,alignItems:"center",marginBottom:12}}>
                {[{label:"FROM",city:fromCity,onClick:()=>setShowFromModal(true)},null,{label:"TO",city:toCity,onClick:()=>setShowToModal(true)}].map((item,i)=>item===null?(
                  <button key="swap" onClick={swapFlight} style={{width:40,height:40,borderRadius:"50%",background:"rgba(201,168,76,0.12)",border:"1.5px solid rgba(201,168,76,0.3)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:18,color:GOLD_DARK,transition:"transform 0.3s",justifySelf:"center"}}
                    onMouseEnter={e=>e.currentTarget.style.transform="rotate(180deg)"}
                    onMouseLeave={e=>e.currentTarget.style.transform="rotate(0)"}>⇄</button>
                ):(
                  <div key={item.label} onClick={item.onClick} style={{...inp,cursor:"pointer"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=GOLD;e.currentTarget.style.background="rgba(201,168,76,0.06)";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(201,168,76,0.22)";e.currentTarget.style.background="rgba(255,255,255,0.85)";}}>
                    <div style={{...lbl,marginBottom:4}}>{item.label}</div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:28,color:"#1a1410"}}>{item.city.code}</div>
                    <div style={{...sText,marginTop:2}}>{item.city.name}</div>
                  </div>
                ))}
              </div>
              <div className="search-date-grid" style={{display:"grid",gridTemplateColumns:tripType==="roundtrip"?"1fr 1fr 1fr 1fr":"1fr 1fr 1fr",gap:10,marginBottom:14}}>
                <div style={{...inp,borderColor:!date&&validErr?"#ef4444":"rgba(201,168,76,0.22)"}}>
                  <label style={lbl}>DEPARTURE{!date&&<span style={{color:"#ef4444"}}> *</span>}</label>
                  <input type="date" value={date} min={today} onChange={e=>{setDate(e.target.value);setValidErr("");}} style={{background:"transparent",border:"none",outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:600,color:"#1a1410",width:"100%",cursor:"pointer"}}/>
                  {date&&<div style={{fontSize:12,color:"#5a4a3a",marginTop:2,fontWeight:500}}>{new Date(date).toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"})}</div>}
                </div>
                {tripType==="roundtrip"&&(
                  <div style={inp}>
                    <label style={lbl}>RETURN</label>
                    <input type="date" value={returnDate} min={date||today} onChange={e=>setReturnDate(e.target.value)} style={{background:"transparent",border:"none",outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:600,color:"#1a1410",width:"100%",cursor:"pointer"}}/>
                  </div>
                )}
                <div style={inp}>
                  <label style={lbl}>TRAVELLERS</label>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <button onClick={()=>setPassengers(p=>Math.max(1,p-1))} style={{width:30,height:30,borderRadius:"50%",background:"rgba(201,168,76,0.12)",border:"1px solid rgba(201,168,76,0.3)",color:GOLD_DARK,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>-</button>
                    <span style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:20,color:"#1a1410",minWidth:20,textAlign:"center"}}>{passengers}</span>
                    <button onClick={()=>setPassengers(p=>Math.min(9,p+1))} style={{width:30,height:30,borderRadius:"50%",background:"rgba(201,168,76,0.12)",border:"1px solid rgba(201,168,76,0.3)",color:GOLD_DARK,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>+</button>
                  </div>
                </div>
                <div style={inp}>
                  <label style={lbl}>CLASS</label>
                  <select value={cabinClass} onChange={e=>setCabinClass(e.target.value)} style={{background:"transparent",border:"none",outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,color:"#1a1410",width:"100%",cursor:"pointer"}}>{CLASSES.map(c=><option key={c}>{c}</option>)}</select>
                </div>
              </div>
              <div style={{marginBottom:14}}>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:700,color:GOLD_DARK,letterSpacing:"0.08em",marginBottom:8}}>SPECIAL FARES</div>
                <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                  {SPECIAL_FARES.map(sf=>(
                    <button key={sf.id} onClick={()=>setSpecialFare(sf.id)} style={{padding:"7px 14px",borderRadius:9,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",border:specialFare===sf.id?`1.5px solid ${GOLD}`:"1.5px solid rgba(0,0,0,0.12)",background:specialFare===sf.id?`rgba(201,168,76,0.12)`:"rgba(255,255,255,0.7)",color:specialFare===sf.id?GOLD_DARK:"#444",transition:"all 0.2s"}}>{sf.label}</button>
                  ))}
                </div>
              </div>
              {validErr&&<div style={{padding:"10px 14px",borderRadius:10,background:"#FFF0F0",border:"1px solid #FFCDD2",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#cc2222",marginBottom:12,fontWeight:500}}>{validErr}</div>}
              <button onClick={searchFlights} style={{width:"100%",padding:"15px",borderRadius:14,fontSize:15,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.08em",color:"#1a1410",border:"none",cursor:"pointer",background:GRAD,backgroundSize:"200% 200%",animation:"gradShift 4s ease infinite",boxShadow:"0 8px 28px rgba(201,168,76,0.4)"}}>
                Search Flights ✈
              </button>
            </>
          )}
        </div>

        {/* LOADING */}
        {loading&&(
          <div style={{textAlign:"center",padding:"60px 0",animation:"fadeUp 0.4s both"}}>
            <div style={{width:44,height:44,border:"3px solid rgba(201,168,76,0.2)",borderTopColor:GOLD,borderRadius:"50%",animation:"spinSlow 1s linear infinite",margin:"0 auto 16px"}}/>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:16,color:GOLD_DARK}}>
              {travelType==="bus"?"Scanning bus routes…":"Scanning flight paths…"}
            </div>
          </div>
        )}

        {/* FILTERS */}
        {!loading&&filtered.length>0&&travelType!=="hotel"&&(
          <div style={{background:"rgba(255,255,255,0.88)",backdropFilter:"blur(10px)",borderRadius:16,padding:"18px 20px",boxShadow:"0 4px 16px rgba(0,0,0,0.05)",border:"1px solid rgba(201,168,76,0.15)",marginBottom:18,animation:"fadeUp 0.4s both"}}>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:GOLD_DARK,letterSpacing:"0.15em",marginBottom:12,fontWeight:700}}>FILTER & SORT</div>
            <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:10}}>
              {travelType==="flight"&&[["any","All times"],["morning","Morning"],["afternoon","Afternoon"],["evening","Evening"]].map(([v,l])=>(
                <button key={v} onClick={()=>setFilterTime(v)} style={{padding:"6px 14px",borderRadius:100,fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",border:filterTime===v?`1.5px solid ${GOLD}`:"1.5px solid rgba(0,0,0,0.15)",background:filterTime===v?`rgba(201,168,76,0.12)`:"#fafaf8",color:filterTime===v?GOLD_DARK:"#444"}}>{l}</button>
              ))}
              {[["price","Cheapest"],["price-desc","Priciest"],["departure","Earliest"]].map(([v,l])=>(
                <button key={v} onClick={()=>setSortBy(v)} style={{padding:"6px 14px",borderRadius:100,fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",border:sortBy===v?`1.5px solid ${GOLD}`:"1.5px solid rgba(0,0,0,0.15)",background:sortBy===v?`rgba(201,168,76,0.12)`:"#fafaf8",color:sortBy===v?GOLD_DARK:"#444"}}>{l}</button>
              ))}
            </div>
            <input type="range" min="100" max={filterMaxPrice+500} step="100" value={filterMaxPrice} onChange={e=>setFilterMaxPrice(Number(e.target.value))} style={{width:"100%",accentColor:GOLD}}/>
            <div style={{display:"flex",justifyContent:"space-between",fontFamily:"'Space Mono',monospace",fontSize:11,color:GOLD_DARK,marginTop:6,fontWeight:600}}>
              <span>Min</span><span>Max ₹{filterMaxPrice.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* RESULTS */}
        {!loading&&searched&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {filtered.length>0&&travelType!=="hotel"&&(
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:GOLD_DARK,letterSpacing:"0.15em",marginBottom:2,fontWeight:700}}>
                {travelType==="bus"?`${filtered.length} BUSES FOUND`:`${filtered.length} FLIGHTS FOUND`}
              </div>
            )}

            {/* Flight results */}
            {travelType==="flight"&&filtered.map((flight,i)=>(
              <div key={flight.id||i} style={{background:"rgba(255,255,255,0.92)",backdropFilter:"blur(10px)",borderRadius:18,padding:"20px 22px",boxShadow:"0 4px 16px rgba(0,0,0,0.05)",border:"1px solid rgba(201,168,76,0.12)",animation:`fadeUp 0.4s ${i*60}ms both`,transition:"all 0.2s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(201,168,76,0.38)";e.currentTarget.style.transform="translateY(-2px)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(201,168,76,0.12)";e.currentTarget.style.transform="translateY(0)";}}>
                {flight.affiliate?(
                  <div style={{textAlign:"center",padding:"8px 0"}}>
                    <div style={{fontSize:40,marginBottom:12}}>✈️</div>
                    <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:20,color:"#1a1410",marginBottom:8}}>
                      {flight.from_city} → {flight.to_city}
                    </h3>
                    <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"#555",marginBottom:18}}>Live fares available via our partner — best prices guaranteed</p>
                    <button onClick={()=>openFlightLink(flight.from_city,flight.to_city)}
                      style={{padding:"13px 32px",borderRadius:13,fontSize:15,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.08em",color:"#1a1410",border:"none",cursor:"pointer",background:GRAD,backgroundSize:"200% 200%",animation:"gradShift 3s ease infinite",boxShadow:"0 4px 14px rgba(201,168,76,0.44)"}}>
                      Check Live Prices →
                    </button>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#bbb",marginTop:10}}>Live prices on partner site · may vary</div>
                  </div>
                ):(
                  <>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:GOLD}}/>
                        <span style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:15,color:"#1a1410"}}>{flight.airline}</span>
                        <span style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:"#777"}}>{flight.flight_no}</span>
                      </div>
                      <div style={{display:"flex",gap:7}}>
                        <span style={{padding:"3px 9px",borderRadius:20,fontSize:10,background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.25)",color:"#047857",fontFamily:"'Space Mono',monospace",fontWeight:600}}>Non-stop</span>
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                      <div style={{textAlign:"center"}}>
                        <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:26,color:"#1a1410"}}>{fmtTime(flight.departure_time)}</div>
                        <div style={{fontFamily:"'Space Mono',monospace",fontSize:12,color:"#666",marginTop:2,fontWeight:600}}>{flight.from_city?.slice(0,3).toUpperCase()}</div>
                        <div style={{fontSize:12,color:"#666",fontWeight:500}}>{fmtDate(flight.departure_time)}</div>
                      </div>
                      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"0 16px"}}>
                        <span style={{fontSize:12,color:"#555",fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>{calcDur(flight.departure_time,flight.arrival_time)}</span>
                        <div style={{width:"100%",display:"flex",alignItems:"center",gap:4}}>
                          <div style={{flex:1,height:1.5,background:"linear-gradient(90deg,rgba(201,168,76,0.4),rgba(201,168,76,0.8),rgba(201,168,76,0.4))"}}/>
                          <span style={{fontSize:14,color:GOLD}}>✈</span>
                          <div style={{flex:1,height:1.5,background:"linear-gradient(90deg,rgba(201,168,76,0.8),rgba(201,168,76,0.4))"}}/>
                        </div>
                        <span style={{fontSize:12,color:"#047857",fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>Direct</span>
                      </div>
                      <div style={{textAlign:"center"}}>
                        <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:26,color:"#1a1410"}}>{fmtTime(flight.arrival_time)}</div>
                        <div style={{fontFamily:"'Space Mono',monospace",fontSize:12,color:"#666",marginTop:2,fontWeight:600}}>{flight.to_city?.slice(0,3).toUpperCase()}</div>
                        <div style={{fontSize:12,color:"#666",fontWeight:500}}>{fmtDate(flight.arrival_time)}</div>
                      </div>
                    </div>
                    <div className="results-card-bottom" style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:14,borderTop:"1px solid rgba(201,168,76,0.12)"}}>
                      <div>
                        <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#777",letterSpacing:"0.1em",fontWeight:600}}>APPROX FROM</div>
                        <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:28,color:GOLD_DARK}}>₹{(flight.price*passengers).toLocaleString()}</div>
                        <div style={{fontSize:13,color:"#555",fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>{passengers} pax · {cabinClass}</div>
                      </div>
                      <button onClick={()=>openFlightLink(flight.from_city,flight.to_city)}
                        style={{padding:"12px 26px",borderRadius:12,fontSize:14,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.06em",color:"#1a1410",border:"none",cursor:"pointer",background:GRAD,backgroundSize:"200% 200%",animation:"gradShift 3s ease infinite",boxShadow:"0 4px 14px rgba(201,168,76,0.44)",transition:"transform 0.2s"}}
                        onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
                        onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>Check Live Prices →</button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Bus results */}
            {travelType==="bus"&&filtered.length===0&&(
              <div style={{background:"rgba(255,255,255,0.88)",backdropFilter:"blur(10px)",borderRadius:18,padding:"30px 26px",boxShadow:"0 4px 16px rgba(0,0,0,0.05)",border:"1px solid rgba(201,168,76,0.12)",textAlign:"center",animation:"fadeUp 0.4s both"}}>
                <div style={{fontSize:48,marginBottom:12}}>🚌</div>
                <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:20,color:"#1a1410",marginBottom:8}}>More options on our partner site</h3>
                <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"#555",marginBottom:18}}>{busFrom} → {busTo} · Check full schedule and live seats</p>
                <button onClick={()=>{track("bus_search",`${busFrom}→${busTo}`,"web");window.open(busLink(busFrom,busTo,date),"_blank","noopener,noreferrer");}}
                  style={{padding:"13px 32px",borderRadius:13,fontSize:15,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.08em",color:"#1a1410",border:"none",cursor:"pointer",background:GRAD,backgroundSize:"200% 200%",animation:"gradShift 3s ease infinite",boxShadow:"0 4px 14px rgba(201,168,76,0.44)"}}>
                  View All Options →
                </button>
              </div>
            )}

            {travelType==="bus"&&filtered.map((bus,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.92)",backdropFilter:"blur(10px)",borderRadius:18,padding:"20px 22px",boxShadow:"0 4px 16px rgba(0,0,0,0.05)",border:"1px solid rgba(201,168,76,0.12)",animation:`fadeUp 0.4s ${i*60}ms both`,transition:"all 0.2s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(201,168,76,0.38)";e.currentTarget.style.transform="translateY(-2px)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(201,168,76,0.12)";e.currentTarget.style.transform="translateY(0)";}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:GOLD}}/>
                    <span style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:15,color:"#1a1410"}}>{bus.op}</span>
                    <span style={{padding:"3px 9px",borderRadius:20,fontSize:10,background:"rgba(0,0,0,0.04)",border:"1px solid rgba(0,0,0,0.12)",color:"#444",fontFamily:"'Space Mono',monospace",fontWeight:600}}>{bus.type}</span>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:26,color:"#1a1410"}}>{bus.dep}</div>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#555",marginTop:2,fontWeight:500}}>{bus.from}</div>
                  </div>
                  <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"0 16px"}}>
                    <span style={{fontSize:12,color:"#555",fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>{bus.dur}</span>
                    <div style={{width:"100%",display:"flex",alignItems:"center",gap:4}}>
                      <div style={{flex:1,height:1.5,background:"linear-gradient(90deg,rgba(201,168,76,0.4),rgba(201,168,76,0.8),rgba(201,168,76,0.4))"}}/>
                      <span style={{fontSize:16}}>🚌</span>
                      <div style={{flex:1,height:1.5,background:"linear-gradient(90deg,rgba(201,168,76,0.8),rgba(201,168,76,0.4))"}}/>
                    </div>
                    <span style={{fontSize:12,color:"#047857",fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>Direct</span>
                  </div>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:26,color:"#1a1410"}}>{bus.arr}</div>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#555",marginTop:2,fontWeight:500}}>{bus.to}</div>
                  </div>
                </div>
                <div className="results-card-bottom" style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:14,borderTop:"1px solid rgba(201,168,76,0.12)"}}>
                  <div>
                    <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"#777",letterSpacing:"0.1em",fontWeight:600}}>APPROX FROM</div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:28,color:GOLD_DARK}}>₹{(bus.price*passengers).toLocaleString()}</div>
                    <div style={{fontSize:13,color:"#555",fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>{passengers} pax</div>
                  </div>
                  <button onClick={()=>{track("bus_search",`${bus.from}→${bus.to}`,"web");window.open(busLink(bus.from,bus.to,date),"_blank","noopener,noreferrer");}}
                    style={{padding:"12px 26px",borderRadius:12,fontSize:14,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.06em",color:"#1a1410",border:"none",cursor:"pointer",background:GRAD,backgroundSize:"200% 200%",animation:"gradShift 3s ease infinite",boxShadow:"0 4px 14px rgba(201,168,76,0.44)",transition:"transform 0.2s"}}
                    onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
                    onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>Check Live Prices →</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading&&!searched&&(
          <div style={{textAlign:"center",padding:"60px 20px",animation:"fadeUp 0.5s both"}}>
            <div style={{fontSize:56,marginBottom:16,animation:"floatUD 3s ease-in-out infinite"}}>{travelType==="bus"?"🚌":travelType==="hotel"?"🏨":travelType==="train"?"🚂":"✈️"}</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:20,color:"#7a6a5a"}}>Your journey starts here</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"#aaa",marginTop:8}}>Search above or use AI Chat for complete trip planning</div>
          </div>
        )}
      </div>

      {/* Affiliate disclosure */}
      <div style={{textAlign:"center",padding:"16px 5%",borderTop:"1px solid rgba(201,168,76,0.1)",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#bbb",background:"rgba(250,248,244,0.9)"}}>
        Alvryn is a travel discovery platform. We may earn a commission from partner links at no extra cost to you.
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  APP ROUTER
// ══════════════════════════════════════════════════════════════════════════════
function App() {
  useEffect(() => {
    fetch(`${API}/test`).catch(()=>{});
    const t = setInterval(() => fetch(`${API}/test`).catch(()=>{}), 14*60*1000);
    return () => clearInterval(t);
  }, []);
  return (
    <Router>
      <Routes>
        <Route path="/"         element={<LandingPage/>}/>
        <Route path="/login"    element={<Login/>}/>
        <Route path="/register" element={<Register/>}/>
        <Route path="/search"   element={<SearchPage/>}/>
        <Route path="/bookings" element={<MyBookings/>}/>
        <Route path="/profile"  element={<UserProfile/>}/>
        <Route path="/admin"    element={<AdminDashboard/>}/>
        <Route path="/ai"       element={<AIChatPage/>}/>
      </Routes>
    </Router>
  );
}

export default App;