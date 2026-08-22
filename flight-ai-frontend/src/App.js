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
import SearchPage from "./pages/SearchPage";
import LandingPage2 from "./pages/Landingpage2";
import AlvrynHomePage from "./pages/AlvrynHomePage";
import { Navigate } from "react-router-dom";
import PlansPage from "./pages/PlansPage";

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
<Route path="/"         element={<AlvrynHomePage />} />
<Route path="/go"       element={<LandingPage2 />} />
<Route path="/go/search" element={<SearchPage />} />
<Route path="/go/ai"    element={<AIChatPage />} />
<Route path="/go/login" element={<Login />} />
<Route path="/go/register" element={<Register />} />
<Route path="/go/profile" element={<UserProfile />} />
<Route path="/go/bookings" element={<MyBookings />} />
<Route path="/old"      element={<LandingPage />} />
<Route path="/go/plans" element={<PlansPage />} />

<Route path="/ai"       element={<Navigate to="/go/ai"       replace />} />
<Route path="/search"   element={<Navigate to="/go/search"   replace />} />
<Route path="/login"    element={<Navigate to="/go/login"    replace />} />
<Route path="/register" element={<Navigate to="/go/register" replace />} />
<Route path="/profile"  element={<Navigate to="/go/profile"  replace />} />
<Route path="/bookings" element={<Navigate to="/go/bookings" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
