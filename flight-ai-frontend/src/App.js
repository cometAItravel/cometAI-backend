/* eslint-disable no-useless-escape, no-unused-vars */
/**
 * ALVRYN — App.js
 * Flights via TravelPayouts/Aviasales (marker=714667)
 * Bus via RedBus redirect
 * Hotels via Booking.com redirect
 * All search types use the same fuzzy AI parser
 * WhatsApp bot handles flights, buses and hotels
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

// Analytics tracker — fire and forget, never blocks UI
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

// ─── AFFILIATE CONFIG ─────────────────────────────────────────────────────────
const TP_MARKER  = "714667";
// Short tracking link — survives .com → .in geo-redirect, keeps marker intact
/** Build Aviasales affiliate link with marker=714667
 *  India routes  → aviasales.in  (INR currency, no geo-redirect)
 *  Intl routes   → aviasales.com (stays .com, marker preserved)
 *  marker= sets tracking cookie on load — commission tracked for 30 days
 *  URL bar may not show marker after Aviasales renders — this is normal/expected
 */
function flightLink(fromCode, toCode, dateStr, passengers = 1, subId = "alvryn_web") {
  // Build DDMM date string from YYYY-MM-DD
  let d = "";
  if (dateStr) {
    const parts = dateStr.split("-"); // ["2026","04","18"]
    if (parts.length === 3) d = parts[2] + parts[1]; // "1804"
  }
  const pax = Math.max(1, passengers);

  const INDIA_CODES = new Set([
    "BLR","BOM","DEL","MAA","HYD","CCU","GOI","PNQ","COK","AMD","JAI",
    "LKO","VNS","PAT","IXC","GAU","BBI","CBE","IXM","IXE","MYQ","TRV",
    "VTZ","VGA","IXR","BHO","SXR","IXJ","HBX","IXG","TIR","IXL","IXZ",
    "NAG","IDR","RPR","DED","SLV","ATQ","UDR","JDH","AGR","STV",
  ]);
  const isIndia = INDIA_CODES.has(fromCode) && INDIA_CODES.has(toCode);
  const base = isIndia ? "https://www.aviasales.in" : "https://www.aviasales.com";
  return `${base}/search/${fromCode}${d}${toCode}${pax}?marker=714667&sub_id=${subId}`;
}

/** Build a RedBus bus search URL */
function busLink(from, to, dateStr) {
  const f = from.toLowerCase().replace(/\s+/g, "-");
  const t = to.toLowerCase().replace(/\s+/g, "-");
  // Plain URL — Cuelinks script auto-converts to affiliate link
  if (dateStr) {
    // RedBus deep link with date: format is DD-Mon-YYYY
    try {
      const d = new Date(dateStr);
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const formatted = d.getDate().toString().padStart(2,"0") + "-" + months[d.getMonth()] + "-" + d.getFullYear();
      return `https://www.redbus.in/bus-tickets/${f}-to-${t}?doj=${formatted}`;
    } catch { /* fall through */ }
  }
  return `https://www.redbus.in/bus-tickets/${f}-to-${t}`;
}

// Hotel link — plain Booking.com URL, Cuelinks auto-converts
function hotelLink(city, checkIn, checkOut) {
  let url = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}&lang=en-gb`;
  if (checkIn)  url += `&checkin=${checkIn}`;
  if (checkOut) url += `&checkout=${checkOut}`;
  return url;
}

// Train link — IRCTC (Cuelinks converts if campaign active)
function trainLink(from, to, dateStr) {
  // IRCTC format
  const f = (from||"").toUpperCase().slice(0,5);
  const t = (to||"").toUpperCase().slice(0,5);
  if (dateStr) {
    const d = dateStr.replace(/-/g,"");
    return `https://www.irctc.co.in/nget/train-search?fromStation=${f}&toStation=${t}&jdate=${d}`;
  }
  return `https://www.irctc.co.in/nget/train-search`;
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const SHARED_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600&family=Space+Mono:wght@400;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html{scroll-behavior:smooth;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(22px);}to{opacity:1;transform:translateY(0);}}
  @keyframes floatUD{0%,100%{transform:translateY(0);}50%{transform:translateY(-9px);}}
  @keyframes gradShift{0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;}}
  @keyframes spinSlow{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
  ::-webkit-scrollbar{width:2px;}
  ::-webkit-scrollbar-thumb{background:linear-gradient(#c9a84c,#8B6914);border-radius:2px;}
  @media(max-width:768px){
    .search-city-grid{grid-template-columns:1fr!important;}
    .search-date-grid{grid-template-columns:1fr 1fr!important;}
    .results-card-bottom{flex-direction:column!important;gap:12px!important;}
    .nav-right-btns button span.btn-label{display:none!important;}
  }
`;

// ─── ICON ─────────────────────────────────────────────────────────────────────
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

// ─── AURORA BACKGROUND ────────────────────────────────────────────────────────
function AuroraBackground() {
  const ref = useRef(null); const raf = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    let W = c.offsetWidth, H = c.offsetHeight; c.width = W; c.height = H;
    const cols = ["#c9a84c", "#f0d080", "#8B6914", "#d4b868"];
    const blobs = Array.from({ length: 5 }, (_, i) => ({
      x: Math.random()*W, y: Math.random()*H,
      vx: (Math.random()-0.5)*0.45, vy: (Math.random()-0.5)*0.45,
      r: 200+Math.random()*180, ci: i%cols.length,
    }));
    const resize = () => { W = c.offsetWidth; H = c.offsetHeight; c.width = W; c.height = H; };
    window.addEventListener("resize", resize);
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      blobs.forEach(b => {
        b.x += b.vx; b.y += b.vy;
        if (b.x < -b.r || b.x > W+b.r) b.vx *= -1;
        if (b.y < -b.r || b.y > H+b.r) b.vy *= -1;
        const g = ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r);
        g.addColorStop(0, cols[b.ci]+"18"); g.addColorStop(1, "transparent");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fill();
      });
      raf.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none", zIndex:0 }}/>;
}

// ─── COMPREHENSIVE CITY ALIASES ───────────────────────────────────────────────
// Handles English, Hindi, Tamil, Telugu, Kannada, typos, IATA codes, nicknames
const CITY_ALIASES = {
  // ── India ──────────────────────────────────────────────────────────────────
  "bangalore":"bangalore","bengaluru":"bangalore","bengalore":"bangalore","bangaluru":"bangalore",
  "blr":"bangalore","bang":"bangalore","banglore":"bangalore","bangalor":"bangalore",
  "bengalure":"bangalore","banglaore":"bangalore","b'lore":"bangalore","blore":"bangalore",
  "namma ooru":"bangalore","garden city":"bangalore","silicon valley":"bangalore",
  "mumbai":"mumbai","bombay":"mumbai","bom":"mumbai","mum":"mumbai","mumbi":"mumbai",
  "mombai":"mumbai","mumbay":"mumbai","bombai":"mumbai","mayanagari":"mumbai",
  "delhi":"delhi","new delhi":"delhi","del":"delhi","dilli":"delhi","nai dilli":"delhi",
  "dilhi":"delhi","deli":"delhi","delhii":"delhi","ncr":"delhi","new dilli":"delhi",
  "raajdhani":"delhi",
  "chennai":"chennai","madras":"chennai","maa":"chennai","chenai":"chennai","chinnai":"chennai",
  "chenni":"chennai","madras city":"chennai","chenna":"chennai",
  "hyderabad":"hyderabad","hyd":"hyderabad","hydrabad":"hyderabad","hederabad":"hyderabad",
  "secunderabad":"hyderabad","hyderbad":"hyderabad","hidrabad":"hyderabad",
  "cyberabad":"hyderabad","haidrabad":"hyderabad","hitech city":"hyderabad",
  "kolkata":"kolkata","calcutta":"kolkata","ccu":"kolkata","kolkatta":"kolkata",
  "calcuta":"kolkata","kolkota":"kolkata","calkata":"kolkata","city of joy":"kolkata",
  "goa":"goa","goi":"goa","north goa":"goa","south goa":"goa","panaji":"goa","panjim":"goa",
  "pune":"pune","pnq":"pune","poona":"pune","puna":"pune","punee":"pune",
  "kochi":"kochi","cochin":"kochi","cok":"kochi","ernakulam":"kochi","kochy":"kochi",
  "ahmedabad":"ahmedabad","amd":"ahmedabad","ahemdabad":"ahmedabad","ahmdabad":"ahmedabad",
  "ahamadabad":"ahmedabad","ahmadabad":"ahmedabad",
  "jaipur":"jaipur","jai":"jaipur","jaipuur":"jaipur","pink city":"jaipur","jaipor":"jaipur",
  "lucknow":"lucknow","lko":"lucknow","luckhnow":"lucknow","lakhnau":"lucknow","lakhnou":"lucknow",
  "varanasi":"varanasi","vns":"varanasi","banaras":"varanasi","benares":"varanasi","kashi":"varanasi",
  "benaras":"varanasi","baranasi":"varanasi",
  "patna":"patna","chandigarh":"chandigarh","ixc":"chandigarh","chd":"chandigarh",
  "guwahati":"guwahati","gauhati":"guwahati","gau":"guwahati","guwahatti":"guwahati",
  "bhubaneswar":"bhubaneswar","bbi":"bhubaneswar","bbsr":"bhubaneswar","bhubneshwar":"bhubaneswar",
  "coimbatore":"coimbatore","cbe":"coimbatore","kovai":"coimbatore","koimbatore":"coimbatore",
  "madurai":"madurai","mdu":"madurai","maduri":"madurai","temple city":"madurai",
  "mangalore":"mangalore","mangaluru":"mangalore","ixe":"mangalore","mangalor":"mangalore",
  "mysore":"mysore","mysuru":"mysore","mys":"mysore","city of palaces":"mysore",
  "surat":"surat","haridwar":"haridwar","jodhpur":"jodhpur","udaipur":"udaipur",
  "amritsar":"amritsar","atq":"amritsar","agra":"agra","taj mahal city":"agra",
  "indore":"indore","idr":"indore","raipur":"raipur","nashik":"nashik","nagpur":"nagpur",
  "shimla":"shimla","dehradun":"dehradun","ddn":"dehradun","siliguri":"siliguri",
  "trivandrum":"trivandrum","thiruvananthapuram":"trivandrum","trv":"trivandrum",
  "visakhapatnam":"visakhapatnam","vizag":"visakhapatnam","vtz":"visakhapatnam",
  "vijayawada":"vijayawada","vga":"vijayawada",
  "ranchi":"ranchi","ixr":"ranchi","bhopal":"bhopal","bho":"bhopal",
  "srinagar":"srinagar","sxr":"srinagar","jammu":"jammu","ixj":"jammu",
  "hubli":"hubli","hubballi":"hubli","hbx":"hubli",
  "belgaum":"belgaum","belagavi":"belgaum","ixg":"belgaum",
  "tirupati":"tirupati","tir":"tirupati","tirupathi":"tirupati",
  "shirdi":"shirdi","sac":"shirdi",
  "leh":"leh","ixi":"leh","ladakh":"leh",
  "port blair":"port blair","ixz":"port blair","portblair":"port blair",
  "dibrugarh":"dibrugarh","dib":"dibrugarh",
  "imphal":"imphal","imf":"imphal",
  "silchar":"silchar","ixs":"silchar",
  "aizawl":"aizawl","ajl":"aizawl",
  "agartala":"agartala","ixr2":"agartala",
  "gorakhpur":"gorakhpur","grp":"gorakhpur",
  "jdh":"jodhpur",
  // ── International ──────────────────────────────────────────────────────────
  "dubai":"dubai","dxb":"dubai","dubi":"dubai","dubay":"dubai",
  "singapore":"singapore","sin":"singapore","singapur":"singapore","singapoor":"singapore",
  "bangkok":"bangkok","bkk":"bangkok","bangkock":"bangkok",
  "london":"london","lhr":"london","landan":"london","heathrow":"london",
  "new york":"new york","jfk":"new york","nyc":"new york","newyork":"new york","ny":"new york",
  "kuala lumpur":"kuala lumpur","kul":"kuala lumpur","kl":"kuala lumpur","klia":"kuala lumpur",
  "colombo":"colombo","cmb":"colombo","sri lanka":"colombo",
  "paris":"paris","cdg":"paris","france":"paris",
  "tokyo":"tokyo","nrt":"tokyo","tyo":"tokyo","japan":"tokyo",
  "sydney":"sydney","syd":"sydney","australia":"sydney",
  "frankfurt":"frankfurt","fra":"frankfurt","germany":"frankfurt",
  "amsterdam":"amsterdam","ams":"amsterdam","netherlands":"amsterdam",
  "toronto":"toronto","yyz":"toronto","canada":"toronto",
  "los angeles":"los angeles","lax":"los angeles","la":"los angeles",
  "chicago":"chicago","ord":"chicago",
  "san francisco":"san francisco","sfo":"san francisco","sf":"san francisco",
  "hong kong":"hong kong","hkg":"hong kong","hk":"hong kong",
  "beijing":"beijing","pek":"beijing","china":"beijing",
  "shanghai":"shanghai","pvg":"shanghai",
  "nairobi":"nairobi","nbo":"nairobi","kenya":"nairobi",
  "doha":"doha","doh":"doha","qatar":"doha",
  "abu dhabi":"abu dhabi","auh":"abu dhabi","abudhabi":"abu dhabi",
  "muscat":"muscat","mct":"muscat","oman":"muscat",
  "riyadh":"riyadh","ruh":"riyadh","saudi":"riyadh",
  "tel aviv":"tel aviv","tlv":"tel aviv","israel":"tel aviv",
  "istanbul":"istanbul","ist":"istanbul","turkey":"istanbul",
  "zurich":"zurich","zrh":"zurich","switzerland":"zurich",
  "rome":"rome","fco":"rome","italy":"rome",
  "barcelona":"barcelona","bcn":"barcelona","spain":"barcelona",
  "madrid":"madrid","mad":"madrid",
  "milan":"milan","mxp":"milan",
  "vienna":"vienna","vie":"vienna","austria":"vienna",
  "brussels":"brussels","bru":"brussels","belgium":"brussels",
  "mexico city":"mexico city","mex":"mexico city","mexico":"mexico city",
  "sao paulo":"sao paulo","gru":"sao paulo","brazil":"sao paulo",
  "buenos aires":"buenos aires","eze":"buenos aires","argentina":"buenos aires",
  "johannesburg":"johannesburg","jnb":"johannesburg","south africa":"johannesburg",
  "cairo":"cairo","cai":"cairo","egypt":"cairo",
  "casablanca":"casablanca","cmn":"casablanca","morocco":"casablanca",
  "lagos":"lagos","los":"lagos","nigeria":"lagos",
  "manila":"manila","mnl":"manila","philippines":"manila",
  "jakarta":"jakarta","cgk":"jakarta","indonesia":"jakarta",
  "seoul":"seoul","icn":"seoul","korea":"seoul",
  "taipei":"taipei","tpe":"taipei","taiwan":"taipei",
  "kathmandu":"kathmandu","ktm":"kathmandu","nepal":"kathmandu",
  "dhaka":"dhaka","dac":"dhaka","bangladesh":"dhaka",
  "karachi":"karachi","khi":"karachi","pakistan":"karachi",
  "lahore":"lahore","lhe":"lahore",
  
  "male":"male","mle":"male","maldives":"male",
  "rangoon":"rangoon","rgn":"rangoon","myanmar":"rangoon","yangon":"rangoon",
  "phnom penh":"phnom penh","pnh":"phnom penh","cambodia":"phnom penh",
  "hanoi":"hanoi","han":"hanoi","vietnam":"hanoi",
  "ho chi minh":"ho chi minh","sgn":"ho chi minh","saigon":"ho chi minh",
  "bali":"bali","dps":"bali",
  "phuket":"phuket","hkt":"phuket",
  "chiang mai":"chiang mai","cnx":"chiang mai",
  "auckland":"auckland","akl":"auckland","new zealand":"auckland",
  "melbourne":"melbourne","mel":"melbourne",
  "brisbane":"brisbane","bne":"brisbane",
  "perth":"perth","per":"perth",
};

// ── IATA code map for affiliate links ─────────────────────────────────────────
const CITY_TO_IATA = {
  "bangalore":"BLR","mumbai":"BOM","delhi":"DEL","chennai":"MAA","hyderabad":"HYD",
  "kolkata":"CCU","goa":"GOI","pune":"PNQ","kochi":"COK","ahmedabad":"AMD","jaipur":"JAI",
  "lucknow":"LKO","varanasi":"VNS","patna":"PAT","chandigarh":"IXC","guwahati":"GAU",
  "bhubaneswar":"BBI","coimbatore":"CBE","madurai":"IXM","mangalore":"IXE","mysore":"MYQ",
  "surat":"STV","haridwar":"DEL","jodhpur":"JDH","udaipur":"UDR","amritsar":"ATQ",
  "agra":"AGR","indore":"IDR","raipur":"RPR","nashik":"ISK","nagpur":"NAG",
  "shimla":"SLV","dehradun":"DED","trivandrum":"TRV","visakhapatnam":"VTZ",
  "vijayawada":"VGA","ranchi":"IXR","bhopal":"BHO","srinagar":"SXR","jammu":"IXJ",
  "hubli":"HBX","belgaum":"IXG","tirupati":"TIR","leh":"IXL","port blair":"IXZ",
  "dubai":"DXB","singapore":"SIN","bangkok":"BKK","london":"LHR","new york":"JFK",
  "kuala lumpur":"KUL","colombo":"CMB","paris":"CDG","tokyo":"NRT","sydney":"SYD",
  "frankfurt":"FRA","amsterdam":"AMS","toronto":"YYZ","los angeles":"LAX",
  "chicago":"ORD","san francisco":"SFO","hong kong":"HKG","beijing":"PEK",
  "shanghai":"PVG","doha":"DOH","abu dhabi":"AUH","muscat":"MCT","riyadh":"RUH",
  "istanbul":"IST","zurich":"ZRH","rome":"FCO","barcelona":"BCN","madrid":"MAD",
  "milan":"MXP","vienna":"VIE","brussels":"BRU","johannesburg":"JNB","cairo":"CAI",
  "lagos":"LOS","manila":"MNL","jakarta":"CGK","seoul":"ICN","taipei":"TPE",
  "kathmandu":"KTM","dhaka":"DAC","male":"MLE","bali":"DPS","phuket":"HKT",
  "auckland":"AKL","melbourne":"MEL","brisbane":"BNE","perth":"PER",
  "nairobi":"NBO","tel aviv":"TLV","hanoi":"HAN","ho chi minh":"SGN",
};

// ─── CITY LIST — flights ──────────────────────────────────────────────────────
const CITIES = [
  // Top India metros
  {code:"BLR",name:"Bangalore",     full:"Kempegowda International",         country:"India",   popular:true},
  {code:"BOM",name:"Mumbai",        full:"Chhatrapati Shivaji Intl",          country:"India",   popular:true},
  {code:"DEL",name:"Delhi",         full:"Indira Gandhi International",       country:"India",   popular:true},
  {code:"MAA",name:"Chennai",       full:"Chennai International",             country:"India",   popular:true},
  {code:"HYD",name:"Hyderabad",     full:"Rajiv Gandhi International",        country:"India",   popular:true},
  {code:"CCU",name:"Kolkata",       full:"Netaji Subhas Chandra Bose Intl",   country:"India",   popular:true},
  {code:"GOI",name:"Goa",           full:"Dabolim / Mopa Airport",            country:"India",   popular:true},
  {code:"PNQ",name:"Pune",          full:"Pune Airport",                      country:"India",   popular:true},
  {code:"COK",name:"Kochi",         full:"Cochin International",              country:"India",   popular:true},
  {code:"AMD",name:"Ahmedabad",     full:"Sardar Vallabhbhai Patel Intl",     country:"India",   popular:true},
  {code:"JAI",name:"Jaipur",        full:"Jaipur International",              country:"India",   popular:true},
  // Tier 2 India
  {code:"LKO",name:"Lucknow",       full:"Chaudhary Charan Singh Intl",       country:"India",   popular:false},
  {code:"VNS",name:"Varanasi",      full:"Lal Bahadur Shastri Airport",       country:"India",   popular:false},
  {code:"PAT",name:"Patna",         full:"Jay Prakash Narayan Airport",       country:"India",   popular:false},
  {code:"BHO",name:"Bhopal",        full:"Raja Bhoj Airport",                 country:"India",   popular:false},
  {code:"NAG",name:"Nagpur",        full:"Dr. Babasaheb Ambedkar Intl",       country:"India",   popular:false},
  {code:"SXR",name:"Srinagar",      full:"Sheikh ul-Alam Airport",            country:"India",   popular:false},
  {code:"IXC",name:"Chandigarh",    full:"Chandigarh Airport",                country:"India",   popular:false},
  {code:"GAU",name:"Guwahati",      full:"Lokpriya Gopinath Bordoloi Intl",   country:"India",   popular:false},
  {code:"BBI",name:"Bhubaneswar",   full:"Biju Patnaik International",        country:"India",   popular:false},
  {code:"TRV",name:"Trivandrum",    full:"Trivandrum International",          country:"India",   popular:false},
  {code:"UDR",name:"Udaipur",       full:"Maharana Pratap Airport",           country:"India",   popular:false},
  {code:"ATQ",name:"Amritsar",      full:"Sri Guru Ram Dass Jee Intl",        country:"India",   popular:false},
  {code:"IDR",name:"Indore",        full:"Devi Ahilyabai Holkar Airport",     country:"India",   popular:false},
  {code:"RPR",name:"Raipur",        full:"Swami Vivekananda Airport",         country:"India",   popular:false},
  {code:"VTZ",name:"Visakhapatnam", full:"Visakhapatnam Airport",             country:"India",   popular:false},
  {code:"VGA",name:"Vijayawada",    full:"Vijayawada Airport",                country:"India",   popular:false},
  {code:"IXR",name:"Ranchi",        full:"Birsa Munda Airport",               country:"India",   popular:false},
  {code:"IXJ",name:"Jammu",         full:"Jammu Airport",                     country:"India",   popular:false},
  {code:"HBX",name:"Hubli",         full:"Hubballi Airport",                  country:"India",   popular:false},
  {code:"IXG",name:"Belgaum",       full:"Belagavi Airport",                  country:"India",   popular:false},
  {code:"CBE",name:"Coimbatore",    full:"Coimbatore International",          country:"India",   popular:false},
  {code:"IXE",name:"Mangalore",     full:"Mangalore International",           country:"India",   popular:false},
  {code:"MYQ",name:"Mysore",        full:"Mysore Airport",                    country:"India",   popular:false},
  {code:"DED",name:"Dehradun",      full:"Jolly Grant Airport",               country:"India",   popular:false},
  {code:"SLV",name:"Shimla",        full:"Jubarhatti Airport",                country:"India",   popular:false},
  {code:"IXL",name:"Leh",           full:"Kushok Bakula Rimpochee Airport",   country:"India",   popular:false},
  {code:"IXZ",name:"Port Blair",    full:"Veer Savarkar International",       country:"India",   popular:false},
  {code:"TIR",name:"Tirupati",      full:"Tirupati Airport",                  country:"India",   popular:false},
  {code:"MDU",name:"Madurai",       full:"Madurai Airport",                   country:"India",   popular:false},
  // International — popular
  {code:"DXB",name:"Dubai",         full:"Dubai International",               country:"UAE",         popular:true},
  {code:"SIN",name:"Singapore",     full:"Changi Airport",                    country:"Singapore",   popular:true},
  {code:"BKK",name:"Bangkok",       full:"Suvarnabhumi Airport",              country:"Thailand",    popular:true},
  {code:"LHR",name:"London",        full:"Heathrow Airport",                  country:"UK",          popular:true},
  {code:"JFK",name:"New York",      full:"JFK International",                 country:"USA",         popular:true},
  {code:"KUL",name:"Kuala Lumpur",  full:"KLIA Airport",                      country:"Malaysia",    popular:true},
  {code:"CMB",name:"Colombo",       full:"Bandaranaike International",        country:"Sri Lanka",   popular:true},
  {code:"CDG",name:"Paris",         full:"Charles de Gaulle",                 country:"France",      popular:false},
  {code:"NRT",name:"Tokyo",         full:"Narita International",              country:"Japan",       popular:false},
  {code:"SYD",name:"Sydney",        full:"Kingsford Smith",                   country:"Australia",   popular:false},
  {code:"FRA",name:"Frankfurt",     full:"Frankfurt Airport",                 country:"Germany",     popular:false},
  {code:"AMS",name:"Amsterdam",     full:"Schiphol Airport",                  country:"Netherlands", popular:false},
  {code:"YYZ",name:"Toronto",       full:"Pearson International",             country:"Canada",      popular:false},
  {code:"LAX",name:"Los Angeles",   full:"LAX Airport",                       country:"USA",         popular:false},
  {code:"HKG",name:"Hong Kong",     full:"Hong Kong International",           country:"Hong Kong",   popular:false},
  {code:"DOH",name:"Doha",          full:"Hamad International",               country:"Qatar",       popular:false},
  {code:"AUH",name:"Abu Dhabi",     full:"Zayed International",               country:"UAE",         popular:false},
  {code:"IST",name:"Istanbul",      full:"Istanbul Airport",                  country:"Turkey",      popular:false},
  {code:"ZRH",name:"Zurich",        full:"Zurich Airport",                    country:"Switzerland", popular:false},
  {code:"FCO",name:"Rome",          full:"Fiumicino Airport",                 country:"Italy",       popular:false},
  {code:"BCN",name:"Barcelona",     full:"El Prat Airport",                   country:"Spain",       popular:false},
  {code:"MXP",name:"Milan",         full:"Malpensa Airport",                  country:"Italy",       popular:false},
  {code:"JNB",name:"Johannesburg",  full:"OR Tambo International",            country:"South Africa",popular:false},
  {code:"NBO",name:"Nairobi",       full:"Jomo Kenyatta International",       country:"Kenya",       popular:false},
  {code:"ICN",name:"Seoul",         full:"Incheon International",             country:"South Korea", popular:false},
  {code:"MNL",name:"Manila",        full:"Ninoy Aquino International",        country:"Philippines", popular:false},
  {code:"CGK",name:"Jakarta",       full:"Soekarno-Hatta International",      country:"Indonesia",   popular:false},
  {code:"DPS",name:"Bali",          full:"Ngurah Rai International",          country:"Indonesia",   popular:false},
  {code:"KTM",name:"Kathmandu",     full:"Tribhuvan International",           country:"Nepal",       popular:false},
  {code:"DAC",name:"Dhaka",         full:"Hazrat Shahjalal International",    country:"Bangladesh",  popular:false},
  {code:"MLE",name:"Maldives",      full:"Velana International",              country:"Maldives",    popular:false},
  {code:"AKL",name:"Auckland",      full:"Auckland Airport",                  country:"New Zealand", popular:false},
  {code:"MEL",name:"Melbourne",     full:"Tullamarine Airport",               country:"Australia",   popular:false},
];

// ─── BUS ROUTES — all major intercity India ────────────────────────────────────
const BUS_ROUTES = [
  // South
  {from:"Bangalore",to:"Chennai",    dur:"5h 30m",dep:"06:00",arr:"11:30",price:650,  type:"AC Sleeper",   op:"VRL Travels"},
  {from:"Bangalore",to:"Chennai",    dur:"5h 30m",dep:"21:00",arr:"02:30",price:550,  type:"Semi-Sleeper", op:"KSRTC"},
  {from:"Bangalore",to:"Chennai",    dur:"5h 30m",dep:"14:00",arr:"19:30",price:720,  type:"AC Sleeper",   op:"SRS Travels"},
  {from:"Bangalore",to:"Hyderabad",  dur:"8h",    dep:"20:00",arr:"04:00",price:800,  type:"AC Sleeper",   op:"SRS Travels"},
  {from:"Bangalore",to:"Hyderabad",  dur:"8h",    dep:"10:00",arr:"18:00",price:750,  type:"Semi-Sleeper", op:"Orange Travels"},
  {from:"Bangalore",to:"Goa",        dur:"9h",    dep:"21:30",arr:"06:30",price:900,  type:"AC Sleeper",   op:"Neeta Tours"},
  {from:"Bangalore",to:"Goa",        dur:"9h",    dep:"08:00",arr:"17:00",price:850,  type:"AC Sleeper",   op:"Paulo Travels"},
  {from:"Bangalore",to:"Mumbai",     dur:"16h",   dep:"17:00",arr:"09:00",price:1400, type:"AC Sleeper",   op:"VRL Travels"},
  {from:"Bangalore",to:"Pune",       dur:"14h",   dep:"18:00",arr:"08:00",price:1200, type:"AC Sleeper",   op:"Paulo Travels"},
  {from:"Bangalore",to:"Coimbatore", dur:"4h",    dep:"07:00",arr:"11:00",price:400,  type:"AC Seater",    op:"KSRTC"},
  {from:"Bangalore",to:"Coimbatore", dur:"4h",    dep:"15:00",arr:"19:00",price:380,  type:"AC Seater",    op:"SRM Travels"},
  {from:"Bangalore",to:"Mangalore",  dur:"7h",    dep:"22:00",arr:"05:00",price:700,  type:"AC Sleeper",   op:"VRL Travels"},
  {from:"Bangalore",to:"Mysore",     dur:"3h",    dep:"07:00",arr:"10:00",price:250,  type:"AC Seater",    op:"KSRTC"},
  {from:"Bangalore",to:"Mysore",     dur:"3h",    dep:"13:00",arr:"16:00",price:280,  type:"AC Seater",    op:"SRS Travels"},
  {from:"Bangalore",to:"Kochi",      dur:"10h",   dep:"21:00",arr:"07:00",price:950,  type:"AC Sleeper",   op:"KSRTC"},
  {from:"Bangalore",to:"Madurai",    dur:"8h",    dep:"21:00",arr:"05:00",price:750,  type:"AC Sleeper",   op:"Parveen Travels"},
  {from:"Bangalore",to:"Tirupati",   dur:"5h",    dep:"05:30",arr:"10:30",price:450,  type:"AC Seater",    op:"APSRTC"},
  {from:"Bangalore",to:"Hubli",      dur:"6h",    dep:"07:00",arr:"13:00",price:480,  type:"AC Seater",    op:"KSRTC"},
  {from:"Chennai",  to:"Hyderabad",  dur:"7h",    dep:"21:00",arr:"04:00",price:750,  type:"AC Sleeper",   op:"TSRTC"},
  {from:"Chennai",  to:"Coimbatore", dur:"4h 30m",dep:"08:00",arr:"12:30",price:350,  type:"AC Seater",    op:"TNSTC"},
  {from:"Chennai",  to:"Madurai",    dur:"5h",    dep:"22:00",arr:"03:00",price:450,  type:"AC Sleeper",   op:"Parveen Travels"},
  {from:"Chennai",  to:"Bangalore",  dur:"5h 30m",dep:"07:00",arr:"12:30",price:630,  type:"AC Sleeper",   op:"VRL Travels"},
  {from:"Chennai",  to:"Kochi",      dur:"8h",    dep:"20:00",arr:"04:00",price:800,  type:"AC Sleeper",   op:"TNSTC"},
  {from:"Chennai",  to:"Tirupati",   dur:"3h",    dep:"06:00",arr:"09:00",price:280,  type:"AC Seater",    op:"APSRTC"},
  {from:"Hyderabad",to:"Bangalore",  dur:"8h",    dep:"21:00",arr:"05:00",price:800,  type:"AC Sleeper",   op:"Orange Travels"},
  {from:"Hyderabad",to:"Mumbai",     dur:"12h",   dep:"18:00",arr:"06:00",price:1100, type:"AC Sleeper",   op:"VRL Travels"},
  {from:"Hyderabad",to:"Chennai",    dur:"7h",    dep:"20:30",arr:"03:30",price:700,  type:"AC Sleeper",   op:"APSRTC"},
  {from:"Hyderabad",to:"Pune",       dur:"10h",   dep:"19:00",arr:"05:00",price:950,  type:"AC Sleeper",   op:"SRS Travels"},
  {from:"Hyderabad",to:"Goa",        dur:"12h",   dep:"20:00",arr:"08:00",price:1050, type:"AC Sleeper",   op:"Neeta Tours"},
  {from:"Hyderabad",to:"Vijayawada", dur:"5h",    dep:"07:00",arr:"12:00",price:420,  type:"AC Seater",    op:"APSRTC"},
  {from:"Hyderabad",to:"Visakhapatnam",dur:"8h",  dep:"21:00",arr:"05:00",price:700,  type:"AC Sleeper",   op:"APSRTC"},
  // West
  {from:"Mumbai",   to:"Pune",       dur:"3h",    dep:"07:00",arr:"10:00",price:300,  type:"AC Seater",    op:"MSRTC"},
  {from:"Mumbai",   to:"Pune",       dur:"3h",    dep:"14:00",arr:"17:00",price:320,  type:"AC Seater",    op:"Neeta Tours"},
  {from:"Mumbai",   to:"Goa",        dur:"10h",   dep:"22:00",arr:"08:00",price:950,  type:"AC Sleeper",   op:"Paulo Travels"},
  {from:"Mumbai",   to:"Ahmedabad",  dur:"8h",    dep:"21:00",arr:"05:00",price:800,  type:"AC Sleeper",   op:"Patel Travels"},
  {from:"Mumbai",   to:"Surat",      dur:"4h",    dep:"07:30",arr:"11:30",price:400,  type:"AC Seater",    op:"GSRTC"},
  {from:"Mumbai",   to:"Nashik",     dur:"3h",    dep:"08:00",arr:"11:00",price:280,  type:"AC Seater",    op:"MSRTC"},
  {from:"Mumbai",   to:"Bangalore",  dur:"16h",   dep:"16:00",arr:"08:00",price:1350, type:"AC Sleeper",   op:"VRL Travels"},
  {from:"Pune",     to:"Goa",        dur:"8h",    dep:"22:30",arr:"06:30",price:850,  type:"AC Sleeper",   op:"Neeta Tours"},
  {from:"Pune",     to:"Hyderabad",  dur:"10h",   dep:"20:00",arr:"06:00",price:950,  type:"AC Sleeper",   op:"SRS Travels"},
  {from:"Pune",     to:"Mumbai",     dur:"3h",    dep:"08:00",arr:"11:00",price:290,  type:"AC Seater",    op:"MSRTC"},
  {from:"Pune",     to:"Bangalore",  dur:"14h",   dep:"17:00",arr:"07:00",price:1150, type:"AC Sleeper",   op:"Paulo Travels"},
  {from:"Ahmedabad",to:"Mumbai",     dur:"8h",    dep:"20:00",arr:"04:00",price:780,  type:"AC Sleeper",   op:"Patel Travels"},
  {from:"Ahmedabad",to:"Surat",      dur:"3h",    dep:"07:00",arr:"10:00",price:280,  type:"AC Seater",    op:"GSRTC"},
  // North
  {from:"Delhi",    to:"Jaipur",     dur:"5h",    dep:"06:00",arr:"11:00",price:500,  type:"AC Seater",    op:"RSRTC"},
  {from:"Delhi",    to:"Jaipur",     dur:"5h",    dep:"14:00",arr:"19:00",price:520,  type:"AC Seater",    op:"Raj Travels"},
  {from:"Delhi",    to:"Agra",       dur:"4h",    dep:"07:00",arr:"11:00",price:400,  type:"AC Seater",    op:"UP Roadways"},
  {from:"Delhi",    to:"Chandigarh", dur:"4h",    dep:"08:00",arr:"12:00",price:450,  type:"AC Seater",    op:"HRTC"},
  {from:"Delhi",    to:"Lucknow",    dur:"7h",    dep:"22:00",arr:"05:00",price:700,  type:"AC Sleeper",   op:"UP SRTC"},
  {from:"Delhi",    to:"Amritsar",   dur:"7h",    dep:"21:30",arr:"04:30",price:750,  type:"AC Sleeper",   op:"PRTC"},
  {from:"Delhi",    to:"Haridwar",   dur:"5h",    dep:"06:30",arr:"11:30",price:500,  type:"AC Seater",    op:"Uttarakhand Roadways"},
  {from:"Delhi",    to:"Shimla",     dur:"8h",    dep:"05:30",arr:"13:30",price:650,  type:"AC Seater",    op:"HRTC"},
  {from:"Delhi",    to:"Dehradun",   dur:"6h",    dep:"07:00",arr:"13:00",price:550,  type:"AC Seater",    op:"Uttarakhand Roadways"},
  {from:"Delhi",    to:"Varanasi",   dur:"12h",   dep:"20:00",arr:"08:00",price:900,  type:"AC Sleeper",   op:"UP SRTC"},
  {from:"Delhi",    to:"Manali",     dur:"14h",   dep:"17:00",arr:"07:00",price:1100, type:"Semi-Sleeper", op:"HRTC"},
  {from:"Jaipur",   to:"Udaipur",    dur:"6h",    dep:"07:00",arr:"13:00",price:550,  type:"AC Seater",    op:"RSRTC"},
  {from:"Jaipur",   to:"Jodhpur",    dur:"5h",    dep:"08:00",arr:"13:00",price:480,  type:"AC Seater",    op:"RSRTC"},
  {from:"Jaipur",   to:"Delhi",      dur:"5h",    dep:"06:00",arr:"11:00",price:490,  type:"AC Seater",    op:"RSRTC"},
  {from:"Jaipur",   to:"Agra",       dur:"4h",    dep:"07:30",arr:"11:30",price:420,  type:"AC Seater",    op:"Raj Travels"},
  // East
  {from:"Kolkata",  to:"Bhubaneswar",dur:"6h",    dep:"21:00",arr:"03:00",price:600,  type:"AC Sleeper",   op:"OSRTC"},
  {from:"Kolkata",  to:"Patna",      dur:"9h",    dep:"20:00",arr:"05:00",price:750,  type:"AC Sleeper",   op:"BSRTC"},
  {from:"Kolkata",  to:"Guwahati",   dur:"12h",   dep:"17:00",arr:"05:00",price:900,  type:"AC Sleeper",   op:"Assam SRTC"},
  {from:"Kolkata",  to:"Siliguri",   dur:"8h",    dep:"20:00",arr:"04:00",price:700,  type:"AC Sleeper",   op:"NBSTC"},
  {from:"Kolkata",  to:"Ranchi",     dur:"6h",    dep:"07:00",arr:"13:00",price:550,  type:"AC Seater",    op:"JSTC"},
  // More South India routes
  {from:"Bangalore",to:"Salem",      dur:"3h 30m",dep:"07:30",arr:"11:00",price:320,  type:"AC Seater",    op:"KSRTC"},
  {from:"Bangalore",to:"Salem",      dur:"3h 30m",dep:"14:00",arr:"17:30",price:300,  type:"AC Seater",    op:"SRM Travels"},
  {from:"Bangalore",to:"Vellore",    dur:"3h",    dep:"06:30",arr:"09:30",price:280,  type:"AC Seater",    op:"TNSTC"},
  {from:"Bangalore",to:"Trichy",     dur:"6h",    dep:"22:00",arr:"04:00",price:550,  type:"AC Sleeper",   op:"TNSTC"},
  {from:"Bangalore",to:"Tirunelveli",dur:"9h",    dep:"21:00",arr:"06:00",price:750,  type:"AC Sleeper",   op:"Parveen Travels"},
  {from:"Bangalore",to:"Nagercoil",  dur:"10h",   dep:"20:30",arr:"06:30",price:800,  type:"AC Sleeper",   op:"KSRTC"},
  {from:"Bangalore",to:"Pondicherry",dur:"5h",    dep:"07:00",arr:"12:00",price:450,  type:"AC Seater",    op:"TNSTC"},
  {from:"Bangalore",to:"Ooty",       dur:"5h",    dep:"07:30",arr:"12:30",price:380,  type:"AC Seater",    op:"KSRTC"},
  {from:"Bangalore",to:"Dharmapuri", dur:"3h",    dep:"08:00",arr:"11:00",price:260,  type:"AC Seater",    op:"KSRTC"},
  {from:"Bangalore",to:"Hosur",      dur:"1h 30m",dep:"07:00",arr:"08:30",price:120,  type:"AC Seater",    op:"KSRTC"},
  {from:"Chennai",  to:"Trichy",     dur:"5h",    dep:"07:00",arr:"12:00",price:400,  type:"AC Seater",    op:"TNSTC"},
  {from:"Chennai",  to:"Salem",      dur:"4h",    dep:"07:30",arr:"11:30",price:300,  type:"AC Seater",    op:"TNSTC"},
  {from:"Chennai",  to:"Vellore",    dur:"2h 30m",dep:"07:00",arr:"09:30",price:200,  type:"AC Seater",    op:"TNSTC"},
  {from:"Chennai",  to:"Pondicherry",dur:"3h",    dep:"07:00",arr:"10:00",price:220,  type:"AC Seater",    op:"TNSTC"},
  {from:"Chennai",  to:"Tirunelveli",dur:"8h",    dep:"21:00",arr:"05:00",price:600,  type:"AC Sleeper",   op:"Parveen Travels"},
  {from:"Chennai",  to:"Nagercoil",  dur:"9h",    dep:"20:30",arr:"05:30",price:650,  type:"AC Sleeper",   op:"TNSTC"},
  {from:"Chennai",  to:"Ooty",       dur:"7h",    dep:"22:00",arr:"05:00",price:550,  type:"AC Sleeper",   op:"TNSTC"},
  {from:"Chennai",  to:"Thanjavur",  dur:"6h",    dep:"22:30",arr:"04:30",price:480,  type:"AC Sleeper",   op:"TNSTC"},
  {from:"Coimbatore",to:"Chennai",   dur:"7h",    dep:"21:00",arr:"04:00",price:600,  type:"AC Sleeper",   op:"TNSTC"},
  {from:"Coimbatore",to:"Bangalore", dur:"4h",    dep:"07:00",arr:"11:00",price:380,  type:"AC Seater",    op:"KSRTC"},
  {from:"Coimbatore",to:"Ooty",      dur:"1h 30m",dep:"06:00",arr:"07:30",price:120,  type:"AC Seater",    op:"TNSTC"},
  {from:"Coimbatore",to:"Trivandrum",dur:"8h",    dep:"22:00",arr:"06:00",price:700,  type:"AC Sleeper",   op:"KSRTC"},
  {from:"Coimbatore",to:"Madurai",   dur:"3h",    dep:"07:00",arr:"10:00",price:280,  type:"AC Seater",    op:"TNSTC"},
  {from:"Madurai",  to:"Chennai",    dur:"8h",    dep:"21:00",arr:"05:00",price:580,  type:"AC Sleeper",   op:"TNSTC"},
  {from:"Madurai",  to:"Trichy",     dur:"2h",    dep:"07:00",arr:"09:00",price:180,  type:"AC Seater",    op:"TNSTC"},
  {from:"Madurai",  to:"Nagercoil",  dur:"3h",    dep:"07:00",arr:"10:00",price:250,  type:"AC Seater",    op:"TNSTC"},
  {from:"Madurai",  to:"Tirunelveli",dur:"2h",    dep:"07:00",arr:"09:00",price:180,  type:"AC Seater",    op:"TNSTC"},
  {from:"Madurai",  to:"Coimbatore", dur:"3h",    dep:"07:30",arr:"10:30",price:280,  type:"AC Seater",    op:"TNSTC"},
  {from:"Trivandrum",to:"Kochi",     dur:"4h",    dep:"07:00",arr:"11:00",price:350,  type:"AC Seater",    op:"KSRTC"},
  {from:"Kochi",    to:"Trivandrum", dur:"4h",    dep:"07:30",arr:"11:30",price:350,  type:"AC Seater",    op:"KSRTC"},
  {from:"Kochi",    to:"Bangalore",  dur:"10h",   dep:"22:00",arr:"08:00",price:950,  type:"AC Sleeper",   op:"KSRTC"},
  {from:"Kochi",    to:"Chennai",    dur:"8h",    dep:"22:00",arr:"06:00",price:800,  type:"AC Sleeper",   op:"TNSTC"},
  {from:"Kochi",    to:"Coimbatore", dur:"4h 30m",dep:"07:00",arr:"11:30",price:380,  type:"AC Seater",    op:"KSRTC"},
  // More North/Central India
  {from:"Delhi",    to:"Manali",     dur:"14h",   dep:"17:00",arr:"07:00",price:1100, type:"Semi-Sleeper", op:"HRTC"},
  {from:"Delhi",    to:"Rishikesh",  dur:"6h",    dep:"06:00",arr:"12:00",price:520,  type:"AC Seater",    op:"Uttarakhand Roadways"},
  {from:"Delhi",    to:"Mathura",    dur:"3h",    dep:"07:00",arr:"10:00",price:320,  type:"AC Seater",    op:"UP Roadways"},
  {from:"Jaipur",   to:"Ajmer",      dur:"2h 30m",dep:"07:00",arr:"09:30",price:200,  type:"AC Seater",    op:"RSRTC"},
  {from:"Lucknow",  to:"Agra",       dur:"5h",    dep:"07:00",arr:"12:00",price:420,  type:"AC Seater",    op:"UP SRTC"},
  {from:"Lucknow",  to:"Varanasi",   dur:"5h",    dep:"07:00",arr:"12:00",price:380,  type:"AC Seater",    op:"UP SRTC"},
];

// ─── HOTEL DESTINATIONS ───────────────────────────────────────────────────────
const HOTEL_CITIES = [
  // India
  "Bangalore","Mumbai","Delhi","Chennai","Hyderabad","Kolkata","Goa","Pune","Kochi",
  "Ahmedabad","Jaipur","Agra","Varanasi","Udaipur","Mysore","Shimla","Manali","Ooty",
  "Coorg","Munnar","Rishikesh","Haridwar","Amritsar","Chandigarh","Lucknow",
  "Bhubaneswar","Visakhapatnam","Tirupati","Madurai","Coimbatore","Mangalore",
  "Srinagar","Leh","Port Blair","Darjeeling","Gangtok","Shillong","Guwahati",
  // International
  "Dubai","Singapore","Bangkok","London","New York","Paris","Tokyo","Sydney",
  "Kuala Lumpur","Colombo","Bali","Phuket","Hong Kong","Istanbul","Rome","Barcelona",
  "Amsterdam","Zurich","Vienna","Frankfurt","Melbourne","Auckland","Seoul","Tokyo",
  "Maldives","Kathmandu","Dhaka","Doha","Abu Dhabi","Muscat","Cairo","Nairobi",
];

const BUS_CITIES = [...new Set([...BUS_ROUTES.map(r=>r.from),...BUS_ROUTES.map(r=>r.to)])].sort();
const CLASSES = ["Economy","Premium Economy","Business","First Class"];
const BUS_TYPES = ["Any","AC Sleeper","Semi-Sleeper","AC Seater"];

function fmtTime(dt){if(!dt)return"--:--";return new Date(dt).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false});}
function fmtDate(dt){if(!dt)return"";return new Date(dt).toLocaleDateString("en-IN",{day:"numeric",month:"short"});}
function calcDur(dep,arr){if(!dep||!arr)return"";const d=(new Date(arr)-new Date(dep))/60000;return`${Math.floor(d/60)}h${d%60>0?" "+d%60+"m":""}`.trim();}

// ─── AI QUERY PARSER ──────────────────────────────────────────────────────────
// Works for all languages — English, Hindi, Tamil, Telugu, Kannada, typos, IATA codes
function parseQuery(text) {
  let t = text.toLowerCase()
    .replace(/[^\w\s₹]/g," ")
    .replace(/\b(mujhe|muje|chahiye|chaiye|show|please|kya|hai|hain|aur|ka|ke|ki|se|ko|tak|liye|ek|ticket|tickets|direct|nonstop|best|find|get|search|want|need|bata|dikha|check|de do|dena|lena|jana|jaana|enakku|vendum|naan|pogirom|veliyiduvom|naaku|kavali|vellu|velthu|nenu|velatam)\b/gi," ")
    .replace(/\s+/g," ").trim();

  const forCity = t.replace(/\b(flights?|flight|buses?|bus|coach|hotels?|hotel|book|booking|stay|rooms?|ac sleeper|semi.?sleeper|ac seater)\b/gi," ").replace(/\s+/g," ").trim();

  let found = [];
  const multiWord = Object.keys(CITY_ALIASES).filter(k=>k.includes(" ")).sort((a,b)=>b.length-a.length);
  let remaining = forCity;
  for (const key of multiWord) {
    if (remaining.includes(key) && found.length < 2) { found.push(CITY_ALIASES[key]); remaining = remaining.replace(key," "); }
  }
  const words = remaining.split(/[\s,\-\/→➡to]+/);
  for (const word of words) {
    const clean = word.replace(/[^a-z]/g,"");
    if (clean.length >= 2 && CITY_ALIASES[clean] && found.length < 2 && !found.includes(CITY_ALIASES[clean])) found.push(CITY_ALIASES[clean]);
  }
  // Fuzzy first-3-char match for typos
  if (found.length < 2) {
    const allKeys = Object.keys(CITY_ALIASES);
    const remainWords = remaining.split(/\s+/);
    for (const w of remainWords) {
      if (w.length < 3) continue;
      for (const key of allKeys) {
        if (key.length >= 3 && w.slice(0,3) === key.slice(0,3) && !found.includes(CITY_ALIASES[key])) {
          found.push(CITY_ALIASES[key]); if (found.length === 2) break;
        }
      }
      if (found.length === 2) break;
    }
  }

  const now = new Date(); let date = null;
  const months = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11,
    january:0,february:1,march:2,april:3,june:5,july:6,august:7,september:8,october:9,november:10,december:11};
  for (const [mon,idx] of Object.entries(months)) {
    const m = t.match(new RegExp(`(\\d{1,2})\\s*${mon}|${mon}\\s*(\\d{1,2})`));
    if (m) { const day=parseInt(m[1]||m[2]); const d=new Date(now.getFullYear(),idx,day); if(d<now)d.setFullYear(d.getFullYear()+1); date=d; break; }
  }

  const todayW  = ["today","aaj","aaj ka","indru","ee roju","indu","ippodu"];
  const tomW    = ["tomorrow","kal","tmrw","tommorow","tomorow","nale","repu","naale","naaley","yarida"];
  const dayAftW = ["day after tomorrow","parso","2 din baad"];
  const wkW     = ["this weekend","weekend","shanivar","saturday"];

  if (todayW.some(w=>t.includes(w)))  date = new Date(now);
  else if (dayAftW.some(w=>t.includes(w))) { date=new Date(now); date.setDate(date.getDate()+2); }
  else if (tomW.some(w=>t.includes(w)))    { date=new Date(now); date.setDate(date.getDate()+1); }
  else if (wkW.some(w=>t.includes(w)))     { date=new Date(now); const d=(6-now.getDay()+7)%7||7; date.setDate(now.getDate()+d); }

  const dayMap = {sun:0,sunday:0,mon:1,monday:1,tue:2,tuesday:2,wed:3,wednesday:3,thu:4,thursday:4,fri:5,friday:5,sat:6,saturday:6,
    ravivar:0,somvar:1,mangalvar:2,budhvar:3,guruvar:4,shukravar:5,shanivar:6,
    nyayiru:0,tingal:1,sevvai:2,budhan:3,viyazhan:4,velli:5,sani:6};
  for (const [day,idx] of Object.entries(dayMap)) {
    if (t.includes(day)) {
      const d=new Date(now); let diff=idx-now.getDay();
      if (/next|agla|agle/.test(t)) { if(diff<=0)diff+=7; if(diff<7)diff+=7; } else { if(diff<=0)diff+=7; }
      d.setDate(now.getDate()+diff); date=d; break;
    }
  }
  const inDays = t.match(/in\s*(\d+)\s*(din|days?)/);
  if (inDays) { date=new Date(now); date.setDate(now.getDate()+parseInt(inDays[1])); }
  if (date && date < new Date(new Date(now).setHours(0,0,0,0))) return { from:found[0]||null, to:found[1]||null, date:null, pastDate:true, budget:null, singleCity:found[0]||null };

  let budget = null;
  const bP = [/under\s*[₹rs.]*\s*(\d+)k?/,/below\s*[₹rs.]*\s*(\d+)k?/,/less\s*than\s*[₹rs.]*\s*(\d+)k?/,/within\s*[₹rs.]*\s*(\d+)k?/,/max\s*[₹rs.]*\s*(\d+)k?/,/[₹rs.]*\s*(\d+)k?\s*(se\s*)?kam/];
  for (const p of bP) { const m=t.match(p); if(m){let v=parseInt(m[1]||m[2]);if(t.match(/\d+k/))v*=1000;budget=v;break;} }

  return { from:found[0]||null, to:found[1]||null, date, pastDate:false, budget, singleCity:found[0]||null };
}

// ─── CITY SELECT MODAL ────────────────────────────────────────────────────────
function CityModal({title,onSelect,onClose,exclude}){
  const[s,setS]=useState("");
  const shown=CITIES.filter(c=>c.code!==exclude&&(c.name.toLowerCase().includes(s.toLowerCase())||c.code.toLowerCase().includes(s.toLowerCase())||c.country.toLowerCase().includes(s.toLowerCase())||c.full.toLowerCase().includes(s.toLowerCase())));
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:480,background:"rgba(250,248,244,0.98)",borderRadius:22,padding:28,boxShadow:"0 24px 80px rgba(0,0,0,0.15)",border:"1px solid rgba(201,168,76,0.2)",maxHeight:"80vh",display:"flex",flexDirection:"column"}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:20,color:"#1a1410",marginBottom:14}}>{title}</div>
        <input autoFocus value={s} onChange={e=>setS(e.target.value)} placeholder="Search city, code or country…"
          style={{width:"100%",padding:"11px 16px",borderRadius:12,fontSize:14,fontFamily:"'DM Sans',sans-serif",border:`1.5px solid rgba(201,168,76,0.3)`,outline:"none",marginBottom:12,color:"#1a1410",background:"#fafaf8"}}
          onFocus={e=>{e.target.style.borderColor=GOLD;e.target.style.boxShadow=`0 0 0 3px rgba(201,168,76,0.1)`;}}
          onBlur={e=>{e.target.style.borderColor="rgba(201,168,76,0.3)";e.target.style.boxShadow="none";}}/>
        {!s&&<div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#999",letterSpacing:"0.15em",marginBottom:8}}>POPULAR CITIES</div>}
        <div style={{display:"flex",flexDirection:"column",gap:5,overflowY:"auto",flex:1}}>
          {shown.map(city=>(
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
  const[s,setS]=useState("");
  const shown=BUS_CITIES.filter(c=>c.toLowerCase().includes(s.toLowerCase())&&c!==exclude);
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:440,background:"rgba(250,248,244,0.98)",borderRadius:22,padding:28,boxShadow:"0 24px 80px rgba(0,0,0,0.15)",border:"1px solid rgba(201,168,76,0.2)",maxHeight:"75vh",display:"flex",flexDirection:"column"}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:20,color:"#1a1410",marginBottom:14}}>{title}</div>
        <input autoFocus value={s} onChange={e=>setS(e.target.value)} placeholder="Search city…"
          style={{width:"100%",padding:"11px 16px",borderRadius:12,fontSize:14,fontFamily:"'DM Sans',sans-serif",border:`1.5px solid rgba(201,168,76,0.3)`,outline:"none",marginBottom:12,color:"#1a1410",background:"#fafaf8"}}
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
  const[s,setS]=useState("");
  const shown=HOTEL_CITIES.filter(c=>c.toLowerCase().includes(s.toLowerCase()));
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:440,background:"rgba(250,248,244,0.98)",borderRadius:22,padding:28,boxShadow:"0 24px 80px rgba(0,0,0,0.15)",border:"1px solid rgba(201,168,76,0.2)",maxHeight:"75vh",display:"flex",flexDirection:"column"}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:20,color:"#1a1410",marginBottom:14}}>{title}</div>
        <input autoFocus value={s} onChange={e=>setS(e.target.value)} placeholder="Search city…"
          style={{width:"100%",padding:"11px 16px",borderRadius:12,fontSize:14,fontFamily:"'DM Sans',sans-serif",border:`1.5px solid rgba(201,168,76,0.3)`,outline:"none",marginBottom:12,color:"#1a1410",background:"#fafaf8"}}
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

// ─── SEAT MODAL (kept — builds trust before affiliate redirect) ───────────────
function SeatModal({passengers,onConfirm,onCancel}){
  const COLS=["A","B","C","D","E","F"];
  const ROWS=Array.from({length:20},(_,i)=>i+1);
  const[taken]=useState(()=>{const t=new Set();for(let i=0;i<18;i++)t.add(`${Math.ceil(Math.random()*20)}${COLS[Math.floor(Math.random()*6)]}`);return t;});
  const[sel,setSel]=useState([]);
  const toggle=s=>{if(taken.has(s))return;setSel(p=>p.includes(s)?p.filter(x=>x!==s):p.length<passengers?[...p,s]:p);};
  const clr=s=>{if(taken.has(s))return"#d1d5db";if(sel.includes(s))return GOLD;return"rgba(201,168,76,0.1)";};
  return(
    <div onClick={onCancel} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:700,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(10px)",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:480,background:"#faf8f4",borderRadius:24,boxShadow:"0 32px 100px rgba(0,0,0,0.18)",border:"1px solid rgba(201,168,76,0.2)",maxHeight:"90vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{background:GRAD,backgroundSize:"200% 200%",animation:"gradShift 4s ease infinite",padding:"18px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,color:"#1a1410",fontSize:17}}>Seat Preference</div>
            <div style={{fontSize:13,color:"rgba(26,20,16,0.75)",marginTop:3}}>Pick {passengers} seat{passengers>1?"s":""} — your preference will be shown to partner airlines</div>
          </div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:14,color:"#1a1410",fontWeight:700}}>{sel.length}/{passengers}</div>
        </div>
        <div style={{overflowY:"auto",padding:"16px 20px 12px"}}>
          <div style={{textAlign:"center",marginBottom:10,fontSize:20}}>✈️</div>
          <div style={{display:"flex",gap:16,justifyContent:"center",marginBottom:14}}>
            {[["rgba(201,168,76,0.1)","Available"],["#c9a84c","Selected"],["#d1d5db","Booked"]].map(([bg,label])=>(
              <div key={label} style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:14,height:14,borderRadius:3,background:bg,border:"1px solid rgba(0,0,0,0.1)"}}/>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#555"}}>{label}</span>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"26px repeat(6,1fr)",gap:4,marginBottom:8}}>
            <div/>{COLS.map(c=><div key={c} style={{textAlign:"center",fontFamily:"'Space Mono',monospace",fontSize:10,color:"#777",fontWeight:700}}>{c}</div>)}
          </div>
          {ROWS.map(row=>(
            <div key={row} style={{display:"grid",gridTemplateColumns:"26px repeat(6,1fr)",gap:4,marginBottom:4,alignItems:"center"}}>
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"#666",textAlign:"right",paddingRight:3,fontWeight:600}}>{row}</div>
              {COLS.map(col=>{const s=`${row}${col}`;return(
                <div key={s} onClick={()=>toggle(s)} style={{height:28,borderRadius:6,background:clr(s),border:`1px solid ${taken.has(s)?"#bbb":sel.includes(s)?"rgba(201,168,76,0.6)":"rgba(201,168,76,0.2)"}`,cursor:taken.has(s)?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontFamily:"'Space Mono',monospace",color:sel.includes(s)?"#1a1410":"#888",fontWeight:700,transition:"all 0.1s"}}>
                  {taken.has(s)?"✕":sel.includes(s)?s:""}
                </div>
              );})}
            </div>
          ))}
        </div>
        <div style={{padding:"14px 22px",borderTop:"1px solid rgba(201,168,76,0.15)",display:"flex",gap:10,alignItems:"center"}}>
          <div style={{flex:1,fontFamily:"'DM Sans',sans-serif",fontSize:13,color:sel.length>0?"#1a1410":"#888",fontWeight:sel.length>0?600:400}}>{sel.length>0?`Selected: ${sel.join(", ")}`:"Tap a seat to select"}</div>
          <button onClick={onCancel} style={{padding:"10px 18px",borderRadius:10,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",background:"transparent",color:"#666",border:"1.5px solid rgba(0,0,0,0.15)",cursor:"pointer"}}>Back</button>
          <button onClick={()=>sel.length===passengers&&onConfirm(sel)} disabled={sel.length!==passengers}
            style={{padding:"10px 22px",borderRadius:10,fontSize:13,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.06em",color:"#1a1410",border:"none",cursor:sel.length===passengers?"pointer":"not-allowed",background:sel.length===passengers?GRAD:"#e5e0d8",backgroundSize:"200% 200%",animation:sel.length===passengers?"gradShift 3s ease infinite":"none",boxShadow:sel.length===passengers?`0 4px 14px rgba(201,168,76,0.44)`:"none",opacity:sel.length===passengers?1:0.6}}>
            Confirm →
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  SEARCH PAGE
// ═══════════════════════════════════════════════════════
// ─── AI INSIGHT GENERATOR ─────────────────────────────────────────────────────
function getFlightInsight(from, to, flights) {
  if (!flights || flights.length === 0) return null;
  const prices = flights.map(f => f.price);
  const min = Math.min(...prices), max = Math.max(...prices);
  const morningFlights = flights.filter(f => { const h = new Date(f.departure_time).getHours(); return h >= 5 && h < 12; });
  const eveningFlights = flights.filter(f => { const h = new Date(f.departure_time).getHours(); return h >= 17; });
  const morningAvg = morningFlights.length ? Math.round(morningFlights.reduce((s,f)=>s+f.price,0)/morningFlights.length) : null;
  const eveningAvg = eveningFlights.length ? Math.round(eveningFlights.reduce((s,f)=>s+f.price,0)/eveningFlights.length) : null;
  const diff = morningAvg && eveningAvg ? Math.round(Math.abs(morningAvg-eveningAvg)/eveningAvg*100) : 0;
  if (diff > 5 && morningAvg < eveningAvg) return `💡 Morning flights on this route are typically ${diff}% cheaper. Booking early usually saves ₹${Math.round((eveningAvg-morningAvg)/100)*100}–₹${Math.round((eveningAvg-morningAvg)/100)*100+200}.`;
  if (min !== max) return `💡 Fares on this route range from ₹${min.toLocaleString()} to ₹${max.toLocaleString()}. Prices may vary — check live availability for the latest fares.`;
  return `💡 Based on typical pricing patterns, booking earlier usually gets you a better fare on this route.`;
}

function getBusInsight(from, to, buses) {
  if (!buses || buses.length === 0) return null;
  const nightBuses = buses.filter(b => { const h = parseInt(b.dep.split(":")[0]); return h >= 20 || h < 5; });
  const dayBuses   = buses.filter(b => { const h = parseInt(b.dep.split(":")[0]); return h >= 6 && h < 18; });
  if (nightBuses.length > 0 && dayBuses.length > 0) return `💡 Night buses on this route are often faster as they avoid traffic. ${nightBuses.length} overnight option${nightBuses.length>1?"s":""} available.`;
  if (nightBuses.length > 0) return `💡 Overnight buses are popular on this route — you save on accommodation and arrive fresh.`;
  return `💡 Multiple operators serve this route. Compare timing and bus type before booking.`;
}

// Smart label for a flight result
function getFlightLabel(flight, allFlights) {
  if (!allFlights || allFlights.length < 2) return null;
  const sorted = [...allFlights].sort((a,b)=>a.price-b.price);
  const dep = new Date(flight.departure_time).getHours();
  if (flight.id === sorted[0].id) return { text:"🏷️ Likely Cheapest", color:"#059669" };
  const earliest = [...allFlights].sort((a,b)=>new Date(a.departure_time)-new Date(b.departure_time));
  if (flight.id === earliest[0].id) return { text:"⚡ Earliest Departure", color:"#0284C7" };
  if (allFlights.length >= 3 && flight.id === sorted[Math.floor(sorted.length/2)].id) return { text:"⭐ Best Overall", color:"#c9a84c" };
  if (dep >= 5 && dep < 12) return { text:"🌅 Morning Flight", color:"#8B6914" };
  return null;
}

function getBusLabel(bus, allBuses) {
  if (!allBuses || allBuses.length < 2) return null;
  const sorted = [...allBuses].sort((a,b)=>a.price-b.price);
  if (bus === sorted[0]) return { text:"🏷️ Likely Cheapest", color:"#059669" };
  if (bus.type === "AC Sleeper") return { text:"⭐ Most Comfortable", color:"#c9a84c" };
  const h = parseInt(bus.dep.split(":")[0]);
  if (h >= 20 || h < 5) return { text:"🌙 Overnight — Save on Stay", color:"#7C3AED" };
  return null;
}


// ─── TRAIN PANEL ─────────────────────────────────────────────────────────────
function TrainPanel() {
  const FROM_STATIONS = ["BANGALORE (SBC)","MUMBAI (CSTM)","DELHI (NDLS)","CHENNAI (MAS)","HYDERABAD (HYB)","KOLKATA (HWH)","PUNE (PUNE)","KOCHI (ERS)","JAIPUR (JP)","AHMEDABAD (ADI)","LUCKNOW (LKO)","VARANASI (BSB)","PATNA (PNBE)","BHOPAL (BPL)","NAGPUR (NGP)","CHANDIGARH (CDG)","GUWAHATI (GHY)","COIMBATORE (CBE)","MADURAI (MDU)","TRIVANDRUM (TVC)","VISAKHAPATNAM (VSKP)","RANCHI (RNC)","AMRITSAR (ASR)","INDORE (INDB)","SURAT (ST)"];
  const [from, setFrom] = useState("BANGALORE (SBC)");
  const [to, setTo]     = useState("CHENNAI (MAS)");
  const [date, setDate] = useState("");
  const today = new Date().toISOString().split("T")[0];

  const search = () => {
    // Extract station code from "BANGALORE (SBC)" → "SBC"
    const getCode = s => (s.match(/\(([^)]+)\)/) || [,""])[1];
    const fc = getCode(from);
    const tc = getCode(to);
    // IRCTC deep link — Cuelinks auto-converts to affiliate
    const url = date
      ? `https://www.irctc.co.in/nget/train-search?fromStation=${fc}&toStation=${tc}&jdate=${date.replace(/-/g,"")}&class=SL`
      : `https://www.irctc.co.in/nget/train-search?fromStation=${fc}&toStation=${tc}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const POPULAR = [
    {from:"DELHI (NDLS)",   to:"MUMBAI (CSTM)"},
    {from:"BANGALORE (SBC)",to:"CHENNAI (MAS)"},
    {from:"DELHI (NDLS)",   to:"KOLKATA (HWH)"},
    {from:"MUMBAI (CSTM)",  to:"HYDERABAD (HYB)"},
  ];

  const inp2 = {padding:"12px 14px",borderRadius:12,fontSize:14,fontFamily:"'DM Sans',sans-serif",border:"1.5px solid rgba(201,168,76,0.25)",outline:"none",color:"#1a1410",background:"#fafaf8",width:"100%",cursor:"pointer"};

  return (
    <div style={{background:"rgba(255,255,255,0.88)",backdropFilter:"blur(10px)",borderRadius:"0 0 20px 20px",padding:"28px 26px",boxShadow:"0 4px 20px rgba(0,0,0,0.05)",border:"1px solid rgba(201,168,76,0.15)",borderTop:"none",marginBottom:22,animation:"fadeUp 0.4s both"}}>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:22,color:"#1a1410",marginBottom:6}}>Find Trains</div>
      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"#666",marginBottom:20}}>Search trains on IRCTC — fastest route to your destination.</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:10,alignItems:"center",marginBottom:14}}>
        <div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:700,color:"#5a4a3a",marginBottom:6,letterSpacing:"0.08em"}}>FROM</div>
          <select value={from} onChange={e=>setFrom(e.target.value)} style={inp2}>
            {FROM_STATIONS.map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
        <button onClick={()=>{const t=from;setFrom(to);setTo(t);}} style={{width:40,height:40,borderRadius:"50%",background:"rgba(201,168,76,0.12)",border:"1.5px solid rgba(201,168,76,0.3)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:18,color:"#8B6914",marginTop:18}}>⇄</button>
        <div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:700,color:"#5a4a3a",marginBottom:6,letterSpacing:"0.08em"}}>TO</div>
          <select value={to} onChange={e=>setTo(e.target.value)} style={inp2}>
            {FROM_STATIONS.map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div style={{marginBottom:16}}>
        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:700,color:"#5a4a3a",marginBottom:6,letterSpacing:"0.08em"}}>JOURNEY DATE</div>
        <input type="date" value={date} min={today} onChange={e=>setDate(e.target.value)} style={inp2}/>
      </div>
      <button onClick={search} style={{width:"100%",padding:"14px",borderRadius:13,fontSize:15,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.08em",color:"#1a1410",border:"none",cursor:"pointer",background:"linear-gradient(135deg,#c9a84c,#f0d080,#c9a84c)",backgroundSize:"200% 200%",animation:"gradShift 3s ease infinite",boxShadow:"0 6px 22px rgba(201,168,76,0.4)",marginBottom:16}}>
        Search Trains 🚂
      </button>
      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#888",marginBottom:14}}>POPULAR ROUTES</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {POPULAR.map((r,i)=>(
          <button key={i} onClick={()=>{setFrom(r.from);setTo(r.to);}} style={{padding:"7px 14px",borderRadius:100,fontSize:12,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:"rgba(201,168,76,0.1)",border:"1px solid rgba(201,168,76,0.25)",color:"#8B6914",fontWeight:500}}>
            {r.from.split(" ")[0]} → {r.to.split(" ")[0]}
          </button>
        ))}
      </div>
      <div style={{marginTop:14,fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#bbb"}}>
        Opens IRCTC — you may earn via Cuelinks affiliate when users book.
      </div>
    </div>
  );
}

function SearchPage(){
  const navigate = useNavigate();
  const [travelType,    setTravelType]    = useState("flight");
  const [tripType,      setTripType]      = useState("oneway");
  const [fromCity,      setFromCity]      = useState(CITIES[0]);
  const [toCity,        setToCity]        = useState(CITIES[1]);
  const [busFrom,       setBusFrom]       = useState("Bangalore");
  const [busTo,         setBusTo]         = useState("Chennai");
  const [hotelCity,     setHotelCity]     = useState("Bangalore");
  const [date,          setDate]          = useState("");
  const [returnDate,    setReturnDate]    = useState("");
  const [checkOut,      setCheckOut]      = useState("");
  const [passengers,    setPassengers]    = useState(1);
  const [cabinClass,    setCabinClass]    = useState("Economy");
  const [busType,       setBusType]       = useState("Any");
  const [showFromModal, setShowFromModal] = useState(false);
  const [showToModal,   setShowToModal]   = useState(false);
  const [showBusFromModal, setShowBusFromModal] = useState(false);
  const [showBusToModal,   setShowBusToModal]   = useState(false);
  const [showHotelModal,   setShowHotelModal]   = useState(false);
  const [mode,          setMode]          = useState("structured");
  const [aiQuery,       setAiQuery]       = useState("");
  const [aiError,       setAiError]       = useState("");
  const [validErr,      setValidErr]      = useState("");
  const [loading,       setLoading]       = useState(false);
  const [searched,      setSearched]      = useState(false);
  const [flights,       setFlights]       = useState([]);
  const [flightInsight, setFlightInsight] = useState(null);
  const [busInsight,    setBusInsight]    = useState(null);
  const [buses,         setBuses]         = useState([]);
  const [filtered,      setFiltered]      = useState([]);

  const [filterTime,    setFilterTime]    = useState("any");
  const [filterMaxPrice,setFilterMaxPrice]= useState(20000);
  const [sortBy,        setSortBy]        = useState("price");
  const [navScrolled,   setNavScrolled]   = useState(false);
  const [specialFare,   setSpecialFare]   = useState("regular");

  const today = new Date().toISOString().split("T")[0];
  let user = {}; try { user = JSON.parse(localStorage.getItem("user")||"{}"); } catch {}
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    // Verify token not expired
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      }
    } catch {} // token exists, can't verify expiry on client — let server handle
  }, [token, navigate]);
  useEffect(() => { fetch(`${API}/test`).catch(()=>{}); const t=setInterval(()=>fetch(`${API}/test`).catch(()=>{}),14*60*1000); return()=>clearInterval(t); }, []);
  useEffect(() => { const fn=()=>setNavScrolled(window.scrollY>30); window.addEventListener("scroll",fn,{passive:true}); return()=>window.removeEventListener("scroll",fn); }, []);

  useEffect(() => {
    const items = travelType==="bus" ? buses : flights;
    let r = [...items];
    if (travelType==="flight") {
      if (filterTime==="morning")   r=r.filter(f=>{const h=new Date(f.departure_time).getHours();return h>=5&&h<12;});
      if (filterTime==="afternoon") r=r.filter(f=>{const h=new Date(f.departure_time).getHours();return h>=12&&h<17;});
      if (filterTime==="evening")   r=r.filter(f=>{const h=new Date(f.departure_time).getHours();return h>=17;});
    }
    r = r.filter(f=>f.price<=filterMaxPrice);
    if (sortBy==="price")      r.sort((a,b)=>a.price-b.price);
    if (sortBy==="price-desc") r.sort((a,b)=>b.price-a.price);
    if (sortBy==="departure" && travelType==="flight") r.sort((a,b)=>new Date(a.departure_time)-new Date(b.departure_time));
    setFiltered(r);
  }, [flights, buses, filterTime, filterMaxPrice, sortBy, travelType]);

  const swapFlight = useCallback(() => { setFromCity(toCity); setToCity(fromCity); }, [fromCity, toCity]);
  const swapBus    = useCallback(() => { setBusFrom(busTo);   setBusTo(busFrom);   }, [busFrom, busTo]);

  // Opens TravelPayouts affiliate link
  const openFlightLink = useCallback((from, to, dt, pax) => {
    const fromCode = CITY_TO_IATA[from.toLowerCase()] || from.toUpperCase().slice(0,3);
    const toCode   = CITY_TO_IATA[to.toLowerCase()]   || to.toUpperCase().slice(0,3);
    const url = flightLink(fromCode, toCode, dt, pax);
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const openBusLink = useCallback((from, to, dt) => {
    track("bus_search", `${from} → ${to}`, "web");
    window.open(busLink(from, to, dt || date), "_blank", "noopener,noreferrer");
  }, [date]);

  const openHotelLink = useCallback((city, checkIn, checkOut) => {
    track("hotel_search", city, "web");
    window.open(hotelLink(city, checkIn || date, checkOut || checkOut), "_blank", "noopener,noreferrer");
  }, [date]);

  const handleFlightDeal = (fromName, toName) => {
    track("view_deal", `${fromName} → ${toName}`, "web");
    openFlightLink(fromName, toName, date, passengers);
  };

  const searchFlights = async () => {
    setValidErr(""); if (!date) { setValidErr("Please select a departure date"); return; }
    setLoading(true); setSearched(true); setFlights([]);
    try {
      const params = new URLSearchParams({ from: fromCity.name, to: toCity.name });
      params.append("date", date);
      const res = await axios.get(`${API}/flights?${params}`);
      const data = res.data || [];
      // If backend returns empty, create a placeholder so we can still show the affiliate button
      if (data.length === 0) {
        setFlights([{ id:"aff", airline:"Search via partner", flight_no:"", from_city:fromCity.name, to_city:toCity.name, departure_time:null, arrival_time:null, price:0, affiliate:true }]);
      } else {
        setFlights(data);
        setFlightInsight(getFlightInsight(fromCity.name, toCity.name, data));
        setFilterMaxPrice(Math.max(...data.map(f=>f.price))+1000);
      }
    } catch(e) {
      console.error(e);
      // Even on error, show affiliate option
      setFlights([{ id:"aff", airline:"Search via partner", flight_no:"", from_city:fromCity.name, to_city:toCity.name, departure_time:null, arrival_time:null, price:0, affiliate:true }]);
    }
    setLoading(false);
  };

  const searchBuses = () => {
    track("bus_search",`${busFrom} → ${busTo}`,"web");
    setValidErr(""); if (!date) { setValidErr("Please select a travel date"); return; }
    setLoading(true); setSearched(true); setBuses([]);
    setTimeout(() => {
      let results = BUS_ROUTES.filter(b=>b.from.toLowerCase()===busFrom.toLowerCase()&&b.to.toLowerCase()===busTo.toLowerCase());
      if (busType !== "Any") results = results.filter(b=>b.type===busType);
      setBuses(results);
      setFilterMaxPrice(results.length>0 ? Math.max(...results.map(b=>b.price))+500 : 5000);
      setLoading(false);
    }, 700);
  };

  const searchAI = async () => {
    if (!aiQuery.trim()) return;
    setAiError(""); setLoading(true); setSearched(true); setFlights([]); setBuses([]);

    const q = aiQuery.toLowerCase();
    const busKw    = /\b(bus|buses|coach|volvo|sleeper|seater|ksrtc|msrtc|tsrtc|rsrtc|redbus)\b/i;
    const hotelKw  = /\b(hotel|hotels|stay|rooms?|accommodation|lodge|resort|hostel|booking)\b/i;
    const flightKw = /\b(flight|flights?|fly|flying|plane|airways|airlines|air india|indigo|spicejet|vistara|akasa)\b/i;

    let intent = travelType;
    if (busKw.test(q))    intent = "bus";
    else if (hotelKw.test(q))  intent = "hotel";
    else if (flightKw.test(q)) intent = "flight";

    const parsed = parseQuery(aiQuery);

    if (parsed.pastDate) { setAiError("That date is in the past! Please search for today or a future date."); setLoading(false); return; }

    if (intent === "hotel") {
      setTravelType("hotel");
      const city = parsed.singleCity || parsed.from || "";
      if (!city) { setAiError("Couldn't detect city. Try: 'hotels in Goa' or 'hotel bangalore'"); setLoading(false); return; }
      const displayCity = city.charAt(0).toUpperCase() + city.slice(1);
      setHotelCity(displayCity);
      setSearched(true);
      openHotelLink(displayCity);
      setLoading(false);
      return;
    }

    if (intent === "bus") {
      setTravelType("bus");
      if (!parsed.from || !parsed.to) { setAiError("Couldn't find cities. Try: 'bus bangalore to chennai kal'"); setLoading(false); return; }
      const from = parsed.from.charAt(0).toUpperCase()+parsed.from.slice(1);
      const to   = parsed.to.charAt(0).toUpperCase()+parsed.to.slice(1);
      // Show matching bus routes
      let results = BUS_ROUTES.filter(b=>b.from.toLowerCase()===parsed.from&&b.to.toLowerCase()===parsed.to);
      if (parsed.budget) results = results.filter(b=>b.price<=parsed.budget);
      if (/cheap|sasta|budget|lowest|kam/i.test(q)) results.sort((a,b)=>a.price-b.price);
      if (/morning|subah|காலை/i.test(q)) results = results.filter(b=>{const h=parseInt(b.dep.split(":")[0]);return h>=5&&h<12;});
      if (/night|raat|evening|sham|இரவு/i.test(q)) results = results.filter(b=>{const h=parseInt(b.dep.split(":")[0]);return h>=18||h<5;});
      setBuses(results);
      setBusInsight(getBusInsight(busFrom, busTo, results));
      setFilterMaxPrice(results.length>0?Math.max(...results.map(b=>b.price))+500:5000);
      if (results.length === 0) setAiError(`No buses found from ${from} to ${to}. Redirecting to RedBus for more options.`);
      setLoading(false);
    } else {
      // Flight
      setTravelType("flight");
      if (!parsed.from || !parsed.to) { setAiError("Couldn't find cities. Try: 'flights bangalore to mumbai tomorrow'"); setLoading(false); return; }
      try {
        const res = await axios.post(`${API}/ai-search`, { query: aiQuery });
        const data = (res.data && !res.data.message) ? res.data : [];
        const filtered2 = parsed.budget ? data.filter(f=>f.price<=parsed.budget) : data;
        const final = filtered2.length > 0 ? filtered2 : data;
        if (final.length === 0) {
          // Show affiliate placeholder
          setFlights([{ id:"aff", airline:"Search via partner", flight_no:"", from_city:parsed.from, to_city:parsed.to, departure_time:null, arrival_time:null, price:0, affiliate:true }]);
        } else {
          setFlights(final);
          setFilterMaxPrice(Math.max(...final.map(f=>f.price))+1000);
        }
      } catch(e) {
        setFlights([{ id:"aff", airline:"Search via partner", flight_no:"", from_city:parsed.from, to_city:parsed.to, departure_time:null, arrival_time:null, price:0, affiliate:true }]);
      }
      setLoading(false);
    }
  };

  const isDomestic = fromCity.country==="India" && toCity.country==="India";

  const TRAVEL_TABS = [
    {id:"flight", icon:"✈️", label:"Flights"},
    {id:"bus",    icon:"🚌", label:"Buses"},
    {id:"hotel",  icon:"🏨", label:"Hotels"},
    {id:"train",  icon:"🚂", label:"Trains"},
    {id:"cab",    icon:"🚗", label:"Cabs",   cs:true},
  ];
  const CS_DATA = {
    cab:{icon:"🚗",title:"Cab Booking",desc:"Airport transfers and intercity cabs — coming soon."},
  };
  const SPECIAL_FARES = [{id:"regular",label:"Regular"},{id:"student",label:"Student"},{id:"senior",label:"Senior Citizen"},{id:"armed",label:"Armed Forces"},{id:"doctor",label:"Doctor / Nurse"}];

  const lbl  = {fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:700,color:"#5a4a3a",display:"block",marginBottom:6,letterSpacing:"0.1em"};
  const sText= {fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#5a4a3a"};
  const inp  = {background:"#fafaf8",borderRadius:12,padding:"12px 14px",border:"1.5px solid rgba(201,168,76,0.2)",transition:"border-color 0.2s"};

  return (
    <div style={{minHeight:"100vh",background:"#faf8f4",position:"relative",overflowX:"hidden",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{SHARED_CSS}</style>
      <AuroraBackground/>

      {showFromModal && <CityModal title="Select departure city" onSelect={c=>{setFromCity(c);setShowFromModal(false);}} onClose={()=>setShowFromModal(false)} exclude={toCity.code}/>}
      {showToModal   && <CityModal title="Select destination city" onSelect={c=>{setToCity(c);setShowToModal(false);}} onClose={()=>setShowToModal(false)} exclude={fromCity.code}/>}
      {showBusFromModal && <BusCityModal title="Bus departure city" onSelect={c=>{setBusFrom(c);setShowBusFromModal(false);}} onClose={()=>setShowBusFromModal(false)} exclude={busTo}/>}
      {showBusToModal   && <BusCityModal title="Bus destination city" onSelect={c=>{setBusTo(c);setShowBusToModal(false);}} onClose={()=>setShowBusToModal(false)} exclude={busFrom}/>}
      {showHotelModal   && <HotelCityModal title="Select hotel city" onSelect={c=>{setHotelCity(c);setShowHotelModal(false);}} onClose={()=>setShowHotelModal(false)}/>}
      {/* Seat modal removed — going direct to partner */}

      {/* NAV */}
      <nav style={{position:"sticky",top:0,zIndex:200,height:66,padding:"0 5%",display:"flex",alignItems:"center",justifyContent:"space-between",background:navScrolled?"rgba(250,248,244,0.95)":"rgba(250,248,244,0.82)",backdropFilter:"blur(22px)",borderBottom:"1px solid rgba(201,168,76,0.12)",transition:"all 0.3s"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>navigate("/")}>
          <div style={{animation:"floatUD 4s ease-in-out infinite"}}><AlvrynIcon size={38}/></div>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:16,color:"#1a1410",letterSpacing:"0.12em",lineHeight:1.1}}>ALVRYN</div>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:7,color:GOLD,letterSpacing:"0.18em"}}>TRAVEL BEYOND</div>
          </div>
        </div>
        <div className="nav-right-btns" style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button onClick={()=>navigate("/ai")} style={{padding:"8px 18px",borderRadius:10,fontSize:13,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.04em",cursor:"pointer",background:"linear-gradient(135deg,#c9a84c,#f0d080,#c9a84c)",backgroundSize:"200% 200%",animation:"gradShift 3s ease infinite",color:"#1a1410",border:"none",boxShadow:"0 4px 12px rgba(201,168,76,0.28)"}}>🤖 AI Chat</button>
          <button onClick={()=>navigate("/bookings")} style={{padding:"8px 16px",borderRadius:10,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:"transparent",color:"#3a2a1a",border:"1.5px solid rgba(0,0,0,0.15)"}}><span className="btn-label">My Bookings</span><span style={{display:"none"}} className="btn-icon">📋</span></button>
          <button onClick={()=>navigate("/profile")} style={{padding:"8px 16px",borderRadius:10,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:`rgba(201,168,76,0.12)`,color:GOLD_DARK,border:`1.5px solid rgba(201,168,76,0.3)`}}>Profile</button>
          <button onClick={()=>{localStorage.removeItem("token");localStorage.removeItem("user");navigate("/login");}} style={{padding:"8px 16px",borderRadius:10,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:"#fff0f0",color:"#cc2222",border:"1.5px solid rgba(200,34,34,0.25)"}}>Sign Out</button>
        </div>
      </nav>

      <div style={{position:"relative",zIndex:1,maxWidth:960,margin:"0 auto",padding:"32px 5% 80px"}}>
        {/* Greeting */}
        <div style={{marginBottom:24,animation:"fadeUp 0.6s both"}}>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:GOLD_DARK,letterSpacing:"0.2em",marginBottom:8}}>SEARCH TRAVEL</div>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:"clamp(22px,4vw,42px)",color:"#1a1410",marginBottom:4}}>Hey {user.name?.split(" ")[0]||"Traveller"} 👋</h1>
          <p style={{fontSize:15,color:"#4a3a2a",fontWeight:500}}>Where do you want to fly, ride or stay today?</p>
        </div>

        {/* Travel type tabs */}
        <div style={{display:"flex",gap:0,background:"rgba(255,255,255,0.88)",backdropFilter:"blur(10px)",borderRadius:"16px 16px 0 0",border:"1px solid rgba(201,168,76,0.18)",borderBottom:"none",overflowX:"auto"}}>
          {TRAVEL_TABS.map((tab,i)=>(
            <button key={tab.id} onClick={()=>{setTravelType(tab.id);setFlights([]);setBuses([]);setSearched(false);setValidErr("");setAiError("");}}
              style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"14px 18px",cursor:"pointer",border:"none",borderBottom:travelType===tab.id?`2.5px solid ${GOLD}`:"2.5px solid transparent",background:"transparent",color:travelType===tab.id?GOLD_DARK:"#666",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,transition:"all 0.2s",whiteSpace:"nowrap",borderRadius:i===0?"16px 0 0 0":i===TRAVEL_TABS.length-1?"0 16px 0 0":"0"}}>
              <span style={{fontSize:20}}>{tab.icon}</span>{tab.label}
              {tab.cs&&<span style={{fontSize:7,background:"rgba(201,168,76,0.15)",border:"1px solid rgba(201,168,76,0.35)",color:GOLD_DARK,padding:"1px 4px",borderRadius:5}}>SOON</span>}
            </button>
          ))}
        </div>

        {/* Coming soon */}
        {CS_DATA[travelType] && (
          <div style={{background:"rgba(255,255,255,0.88)",backdropFilter:"blur(10px)",borderRadius:"0 0 20px 20px",padding:"52px 32px",textAlign:"center",boxShadow:"0 4px 20px rgba(0,0,0,0.05)",border:"1px solid rgba(201,168,76,0.15)",borderTop:"none",animation:"fadeUp 0.4s both"}}>
            <div style={{fontSize:56,marginBottom:18}}>{CS_DATA[travelType].icon}</div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:24,color:"#1a1410",marginBottom:10}}>{CS_DATA[travelType].title} — Coming Soon</h2>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,color:"#555",lineHeight:1.7,maxWidth:400,margin:"0 auto"}}>{CS_DATA[travelType].desc}</p>
          </div>
        )}

        {/* Train panel */}
        {travelType==="train" && <TrainPanel/>}

        {/* Search panel — flight / bus / hotel */}
        {!CS_DATA[travelType] && travelType !== "train" && (
          <div style={{background:"rgba(255,255,255,0.88)",backdropFilter:"blur(10px)",borderRadius:"0 0 20px 20px",padding:"22px 26px",boxShadow:"0 4px 20px rgba(0,0,0,0.05)",border:"1px solid rgba(201,168,76,0.15)",borderTop:"none",marginBottom:22}}>

            {/* Mode toggle */}
            <div style={{display:"flex",gap:0,background:"rgba(201,168,76,0.08)",borderRadius:10,padding:3,marginBottom:18,width:"fit-content"}}>
              {[["structured","Manual Search"],["ai","🤖 AI Search"]].map(([id,label])=>(
                <button key={id} onClick={()=>{setMode(id);setFlights([]);setBuses([]);setSearched(false);setAiError("");setValidErr("");}}
                  style={{padding:"8px 20px",border:"none",borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,cursor:"pointer",transition:"all 0.2s",background:mode===id?"rgba(255,255,255,0.95)":"transparent",color:mode===id?GOLD_DARK:"#666",boxShadow:mode===id?`0 2px 6px rgba(201,168,76,0.2)`:"none"}}>
                  {label}
                </button>
              ))}
            </div>

            {/* ═══ FLIGHT STRUCTURED ═══ */}
            {travelType==="flight" && mode==="structured" && (
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
                    <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,color:GOLD_DARK}}>{isDomestic?"Domestic · Seat selection":"International"}</span>
                  </div>
                </div>
                <div className="search-city-grid" style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:10,alignItems:"center",marginBottom:12}}>
                  {[{label:"FROM",city:fromCity,onClick:()=>setShowFromModal(true)},null,{label:"TO",city:toCity,onClick:()=>setShowToModal(true)}].map((item,i)=>item===null?(
                    <button key="swap" onClick={swapFlight} style={{width:40,height:40,borderRadius:"50%",background:"rgba(201,168,76,0.12)",border:`1.5px solid rgba(201,168,76,0.3)`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:18,color:GOLD_DARK,transition:"transform 0.3s",justifySelf:"center"}}
                      onMouseEnter={e=>e.currentTarget.style.transform="rotate(180deg)"}
                      onMouseLeave={e=>e.currentTarget.style.transform="rotate(0)"}>⇄</button>
                  ):(
                    <div key={item.label} onClick={item.onClick} style={{...inp,cursor:"pointer"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=GOLD;e.currentTarget.style.background="rgba(201,168,76,0.06)";}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(201,168,76,0.2)";e.currentTarget.style.background="#fafaf8";}}>
                      <div style={{...lbl,marginBottom:4}}>{item.label}</div>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:28,color:"#1a1410"}}>{item.city.code}</div>
                      <div style={{...sText,marginTop:2}}>{item.city.name}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10,background:"rgba(201,168,76,0.07)",borderRadius:12,padding:"10px 16px",border:`1px solid rgba(201,168,76,0.22)`,marginBottom:12,cursor:"pointer"}} onClick={()=>{setMode("ai");setFlights([]);setSearched(false);}}>
                  <span>🤖</span>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:GOLD_DARK,fontWeight:600}}>Or type naturally: "blr to goa kal cheapest"</span>
                  <span style={{marginLeft:"auto",fontFamily:"'Space Mono',monospace",fontSize:11,color:GOLD_DARK,fontWeight:700}}>AI →</span>
                </div>
                <div className="search-date-grid" style={{display:"grid",gridTemplateColumns:tripType==="roundtrip"?"1fr 1fr 1fr 1fr":"1fr 1fr 1fr",gap:10,marginBottom:14}}>
                  <div style={{...inp,borderColor:!date&&validErr?"#ef4444":"rgba(201,168,76,0.2)"}}>
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
                      <button onClick={()=>setPassengers(p=>Math.max(1,p-1))} style={{width:30,height:30,borderRadius:"50%",background:"rgba(201,168,76,0.12)",border:`1px solid rgba(201,168,76,0.3)`,color:GOLD_DARK,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>-</button>
                      <span style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:20,color:"#1a1410",minWidth:20,textAlign:"center"}}>{passengers}</span>
                      <button onClick={()=>setPassengers(p=>Math.min(9,p+1))} style={{width:30,height:30,borderRadius:"50%",background:"rgba(201,168,76,0.12)",border:`1px solid rgba(201,168,76,0.3)`,color:GOLD_DARK,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>+</button>
                    </div>
                  </div>
                  <div style={inp}>
                    <label style={lbl}>CLASS</label>
                    <select value={cabinClass} onChange={e=>setCabinClass(e.target.value)} style={{background:"transparent",border:"none",outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,color:"#1a1410",width:"100%",cursor:"pointer"}}>{CLASSES.map(c=><option key={c}>{c}</option>)}</select>
                  </div>
                </div>
                <div style={{marginBottom:14}}>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:700,color:"#5a4a3a",letterSpacing:"0.08em",marginBottom:8}}>SPECIAL FARES</div>
                  <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                    {SPECIAL_FARES.map(sf=>(
                      <button key={sf.id} onClick={()=>setSpecialFare(sf.id)} style={{padding:"7px 14px",borderRadius:9,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",border:specialFare===sf.id?`1.5px solid ${GOLD}`:"1.5px solid rgba(0,0,0,0.12)",background:specialFare===sf.id?`rgba(201,168,76,0.12)`:"#fafaf8",color:specialFare===sf.id?GOLD_DARK:"#444",transition:"all 0.2s"}}>{sf.label}</button>
                    ))}
                  </div>
                </div>
                {validErr&&<div style={{padding:"10px 14px",borderRadius:10,background:"#FFF0F0",border:"1px solid #FFCDD2",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#cc2222",marginBottom:12,fontWeight:500}}>{validErr}</div>}
                <button onClick={searchFlights} style={{width:"100%",padding:"15px",borderRadius:14,fontSize:15,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.08em",color:"#1a1410",border:"none",cursor:"pointer",background:GRAD,backgroundSize:"200% 200%",animation:"gradShift 4s ease infinite",boxShadow:`0 8px 28px rgba(201,168,76,0.44)`,transition:"transform 0.2s"}}
                  onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
                  onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>Search Flights ✈</button>
              </>
            )}

            {/* ═══ BUS STRUCTURED ═══ */}
            {travelType==="bus" && mode==="structured" && (
              <>
                <div className="search-city-grid" style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:10,alignItems:"center",marginBottom:12}}>
                  {[{label:"FROM",city:busFrom,onClick:()=>setShowBusFromModal(true)},null,{label:"TO",city:busTo,onClick:()=>setShowBusToModal(true)}].map((item,i)=>item===null?(
                    <button key="swap" onClick={swapBus} style={{width:40,height:40,borderRadius:"50%",background:"rgba(201,168,76,0.12)",border:`1.5px solid rgba(201,168,76,0.3)`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:18,color:GOLD_DARK,transition:"transform 0.3s",justifySelf:"center"}}
                      onMouseEnter={e=>e.currentTarget.style.transform="rotate(180deg)"}
                      onMouseLeave={e=>e.currentTarget.style.transform="rotate(0)"}>⇄</button>
                  ):(
                    <div key={item.label} onClick={item.onClick} style={{...inp,cursor:"pointer"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=GOLD;e.currentTarget.style.background="rgba(201,168,76,0.06)";}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(201,168,76,0.2)";e.currentTarget.style.background="#fafaf8";}}>
                      <div style={{...lbl,marginBottom:4}}>{item.label}</div>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:20,color:"#1a1410"}}>🚌 {item.city}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10,background:"rgba(201,168,76,0.07)",borderRadius:12,padding:"10px 16px",border:`1px solid rgba(201,168,76,0.22)`,marginBottom:12,cursor:"pointer"}} onClick={()=>{setMode("ai");setBuses([]);setSearched(false);}}>
                  <span>🤖</span>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:GOLD_DARK,fontWeight:600}}>Or type: "bus bangalore to chennai kal"</span>
                  <span style={{marginLeft:"auto",fontFamily:"'Space Mono',monospace",fontSize:11,color:GOLD_DARK,fontWeight:700}}>AI →</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
                  <div style={{...inp,borderColor:!date&&validErr?"#ef4444":"rgba(201,168,76,0.2)"}}>
                    <label style={lbl}>TRAVEL DATE{!date&&<span style={{color:"#ef4444"}}> *</span>}</label>
                    <input type="date" value={date} min={today} onChange={e=>{setDate(e.target.value);setValidErr("");}} style={{background:"transparent",border:"none",outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:600,color:"#1a1410",width:"100%",cursor:"pointer"}}/>
                    {date&&<div style={{fontSize:12,color:"#5a4a3a",marginTop:2,fontWeight:500}}>{new Date(date).toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"})}</div>}
                  </div>
                  <div style={inp}>
                    <label style={lbl}>PASSENGERS</label>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <button onClick={()=>setPassengers(p=>Math.max(1,p-1))} style={{width:30,height:30,borderRadius:"50%",background:"rgba(201,168,76,0.12)",border:`1px solid rgba(201,168,76,0.3)`,color:GOLD_DARK,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>-</button>
                      <span style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:20,color:"#1a1410",minWidth:20,textAlign:"center"}}>{passengers}</span>
                      <button onClick={()=>setPassengers(p=>Math.min(6,p+1))} style={{width:30,height:30,borderRadius:"50%",background:"rgba(201,168,76,0.12)",border:`1px solid rgba(201,168,76,0.3)`,color:GOLD_DARK,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>+</button>
                    </div>
                  </div>
                  <div style={inp}>
                    <label style={lbl}>BUS TYPE</label>
                    <select value={busType} onChange={e=>setBusType(e.target.value)} style={{background:"transparent",border:"none",outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,color:"#1a1410",width:"100%",cursor:"pointer"}}>{BUS_TYPES.map(t=><option key={t}>{t}</option>)}</select>
                  </div>
                </div>
                {validErr&&<div style={{padding:"10px 14px",borderRadius:10,background:"#FFF0F0",border:"1px solid #FFCDD2",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#cc2222",marginBottom:12,fontWeight:500}}>{validErr}</div>}
                <button onClick={searchBuses} style={{width:"100%",padding:"15px",borderRadius:14,fontSize:15,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.08em",color:"#1a1410",border:"none",cursor:"pointer",background:GRAD,backgroundSize:"200% 200%",animation:"gradShift 4s ease infinite",boxShadow:`0 8px 28px rgba(201,168,76,0.44)`,transition:"transform 0.2s"}}
                  onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
                  onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>Search Buses 🚌</button>
              </>
            )}

            {/* ═══ HOTEL STRUCTURED ═══ */}
            {travelType==="hotel" && mode==="structured" && (
              <>
                <div style={{marginBottom:16}}>
                  <div style={{...lbl,marginBottom:8}}>DESTINATION</div>
                  <div onClick={()=>setShowHotelModal(true)} style={{...inp,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=GOLD;e.currentTarget.style.background="rgba(201,168,76,0.06)";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(201,168,76,0.2)";e.currentTarget.style.background="#fafaf8";}}>
                    <div>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:22,color:"#1a1410"}}>🏨 {hotelCity}</div>
                      <div style={{...sText,marginTop:2}}>Tap to change city</div>
                    </div>
                    <span style={{color:GOLD_DARK,fontSize:18}}>›</span>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                  <div style={{...inp,borderColor:!date&&validErr?"#ef4444":"rgba(201,168,76,0.2)"}}>
                    <label style={lbl}>CHECK-IN{!date&&<span style={{color:"#ef4444"}}> *</span>}</label>
                    <input type="date" value={date} min={today} onChange={e=>{setDate(e.target.value);setValidErr("");}} style={{background:"transparent",border:"none",outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:600,color:"#1a1410",width:"100%",cursor:"pointer"}}/>
                  </div>
                  <div style={inp}>
                    <label style={lbl}>CHECK-OUT</label>
                    <input type="date" value={checkOut} min={date||today} onChange={e=>setCheckOut(e.target.value)} style={{background:"transparent",border:"none",outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:600,color:"#1a1410",width:"100%",cursor:"pointer"}}/>
                  </div>
                </div>
                {validErr&&<div style={{padding:"10px 14px",borderRadius:10,background:"#FFF0F0",border:"1px solid #FFCDD2",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#cc2222",marginBottom:12,fontWeight:500}}>{validErr}</div>}
                <button onClick={()=>{setValidErr("");if(!date){setValidErr("Please select a check-in date");return;}openHotelLink(hotelCity);}}
                  style={{width:"100%",padding:"15px",borderRadius:14,fontSize:15,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.08em",color:"#1a1410",border:"none",cursor:"pointer",background:GRAD,backgroundSize:"200% 200%",animation:"gradShift 4s ease infinite",boxShadow:`0 8px 28px rgba(201,168,76,0.44)`,transition:"transform 0.2s"}}
                  onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
                  onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>Search Hotels on Booking.com 🏨</button>
                <div style={{textAlign:"center",marginTop:10,fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#888"}}>You'll be redirected to Booking.com — best prices guaranteed</div>
              </>
            )}

            {/* ═══ AI MODE ═══ */}
            {mode==="ai" && (
              <div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#4a3a2a",marginBottom:12,lineHeight:1.6,fontWeight:500}}>
                  Type in any language — English, Hindi, Tamil, Telugu, Kannada. Typos are totally fine:
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:12}}>
                  {[
                    travelType==="hotel"  && "hotel in goa",
                    travelType==="hotel"  && "hotels bangalore",
                    travelType==="bus"    && "bus bangalore to chennai kal",
                    travelType==="bus"    && "bus blr to hyd raat",
                    travelType==="flight" && "flights frm bangaluru to mumbai kal",
                    travelType==="flight" && "blr to del friday sasta flight",
                    travelType==="flight" && "flight bangalore to dubai tomorrow",
                    travelType==="flight" && "mumbai to delhi kal subah",
                  ].filter(Boolean).map(ex=>(
                    <button key={ex} onClick={()=>setAiQuery(ex)} style={{padding:"6px 13px",borderRadius:100,fontSize:12,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:`rgba(201,168,76,0.1)`,border:`1px solid rgba(201,168,76,0.25)`,color:GOLD_DARK,fontWeight:500}}>{ex}</button>
                  ))}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:12,background:"#fafaf8",borderRadius:14,padding:"4px 4px 4px 18px",border:`1.5px solid rgba(201,168,76,0.3)`,marginBottom:8}}>
                  <span style={{fontSize:18,opacity:0.7}}>🤖</span>
                  <input value={aiQuery} onChange={e=>{setAiQuery(e.target.value);setAiError("");}} onKeyDown={e=>e.key==="Enter"&&searchAI()}
                    placeholder={travelType==="hotel"?"e.g. hotels in Goa, best hotels Mumbai under 2000":travelType==="bus"?"e.g. bus Bangalore to Chennai tomorrow night":"e.g. cheap flights BLR to GOA this weekend, 2 day trip under 5000"}
                    style={{flex:1,background:"transparent",border:"none",outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:15,color:"#1a1410",padding:"12px 0"}}/>
                </div>
                {aiError&&<div style={{padding:"10px 14px",borderRadius:10,background:"#FFF0F0",border:"1px solid #FFCDD2",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#cc2222",marginBottom:8,fontWeight:500}}>{aiError}</div>}
                <button onClick={searchAI} style={{width:"100%",padding:"15px",borderRadius:14,fontSize:15,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.08em",color:"#1a1410",border:"none",cursor:"pointer",background:GRAD,backgroundSize:"200% 200%",animation:"gradShift 4s ease infinite",boxShadow:`0 8px 28px rgba(201,168,76,0.44)`,transition:"transform 0.2s"}}
                  onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
                  onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>Search with AI 🤖</button>
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{textAlign:"center",padding:"60px 0",animation:"fadeUp 0.4s both"}}>
            <div style={{width:44,height:44,border:`3px solid rgba(201,168,76,0.2)`,borderTopColor:GOLD,borderRadius:"50%",animation:"spinSlow 1s linear infinite",margin:"0 auto 16px"}}/>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:16,color:GOLD_DARK}}>
              {travelType==="bus"?"Scanning bus routes…":travelType==="hotel"?"Finding hotels…":"Scanning flight paths…"}
            </div>
          </div>
        )}

        {/* Filters — only for flights/buses with data */}
        {!loading && filtered.length>0 && travelType!=="hotel" && (
          <div style={{background:"rgba(255,255,255,0.88)",backdropFilter:"blur(10px)",borderRadius:16,padding:"18px 20px",boxShadow:"0 4px 16px rgba(0,0,0,0.05)",border:"1px solid rgba(201,168,76,0.15)",marginBottom:18,animation:"fadeUp 0.4s both"}}>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"#7a6a5a",letterSpacing:"0.15em",marginBottom:12,fontWeight:700}}>FILTER &amp; SORT</div>
            <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:10}}>
              {travelType==="flight" && [["any","All times"],["morning","Morning"],["afternoon","Afternoon"],["evening","Evening"]].map(([v,l])=>(
                <button key={v} onClick={()=>setFilterTime(v)} style={{padding:"6px 14px",borderRadius:100,fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",border:filterTime===v?`1.5px solid ${GOLD}`:"1.5px solid rgba(0,0,0,0.15)",background:filterTime===v?`rgba(201,168,76,0.12)`:"#fafaf8",color:filterTime===v?GOLD_DARK:"#444"}}>{l}</button>
              ))}
              {[["price","Cheapest"],["price-desc","Priciest"],["departure","Earliest"]].map(([v,l])=>(
                <button key={v} onClick={()=>setSortBy(v)} style={{padding:"6px 14px",borderRadius:100,fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",border:sortBy===v?`1.5px solid ${GOLD}`:"1.5px solid rgba(0,0,0,0.15)",background:sortBy===v?`rgba(201,168,76,0.12)`:"#fafaf8",color:sortBy===v?GOLD_DARK:"#444"}}>{l}</button>
              ))}
            </div>
            <input type="range" min="100" max={filterMaxPrice+500} step="100" value={filterMaxPrice} onChange={e=>setFilterMaxPrice(Number(e.target.value))} style={{width:"100%",accentColor:GOLD}}/>
            <div style={{display:"flex",justifyContent:"space-between",fontFamily:"'Space Mono',monospace",fontSize:11,color:"#7a6a5a",marginTop:6,fontWeight:600}}>
              <span>Min</span><span style={{color:GOLD_DARK}}>Max ₹{filterMaxPrice.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && searched && (
          <>
            {filtered.length > 0 && (
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"#7a6a5a",letterSpacing:"0.15em",marginBottom:10,fontWeight:700}}>
                {travelType==="bus"?`${filtered.length} BUSES FOUND`:travelType==="hotel"?"":travelType==="flight"&&!filtered[0]?.affiliate?`${filtered.length} FLIGHTS FOUND`:""}
              </div>
            )}
            {/* AI Insight bar */}
            {!loading && searched && (flightInsight||busInsight) && (
              <div style={{marginBottom:14,padding:"12px 18px",background:"rgba(201,168,76,0.08)",borderRadius:12,border:"1px solid rgba(201,168,76,0.22)",display:"flex",alignItems:"flex-start",gap:10,animation:"fadeUp 0.4s both"}}>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#5a4a3a",lineHeight:1.6}}>{travelType==="bus"?busInsight:flightInsight}</div>
              </div>
            )}
            <div style={{display:"flex",flexDirection:"column",gap:12}}>

              {/* ── Flight results ── */}
              {travelType==="flight" && filtered.map((flight,i)=>(
                <div key={flight.id||i} style={{background:"rgba(255,255,255,0.88)",backdropFilter:"blur(10px)",borderRadius:18,padding:"20px 22px",boxShadow:"0 4px 16px rgba(0,0,0,0.05)",border:"1px solid rgba(201,168,76,0.12)",animation:`fadeUp 0.4s ${i*60}ms both`,transition:"all 0.2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(201,168,76,0.38)";e.currentTarget.style.transform="translateY(-2px)";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(201,168,76,0.12)";e.currentTarget.style.transform="translateY(0)";}}>
                  {flight.affiliate ? (
                    // Affiliate placeholder card
                    <div style={{textAlign:"center",padding:"8px 0"}}>
                      <div style={{fontSize:40,marginBottom:12}}>✈️</div>
                      <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:20,color:"#1a1410",marginBottom:8}}>
                        {flight.from_city?.charAt(0).toUpperCase()+flight.from_city?.slice(1)} → {flight.to_city?.charAt(0).toUpperCase()+flight.to_city?.slice(1)}
                      </h3>
                      <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"#555",marginBottom:18}}>Live fares available via our partner — best prices guaranteed</p>
                      <button onClick={()=>handleFlightDeal(flight.from_city, flight.to_city)}
                        style={{padding:"13px 32px",borderRadius:13,fontSize:15,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.08em",color:"#1a1410",border:"none",cursor:"pointer",background:GRAD,backgroundSize:"200% 200%",animation:"gradShift 3s ease infinite",boxShadow:`0 4px 14px rgba(201,168,76,0.44)`}}>
                        Check Live Prices →
                      </button>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#bbb",marginTop:10}}>Live prices on partner site · may vary</div>
                    </div>
                  ) : (
                    // Real flight card
                    <>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <div style={{width:8,height:8,borderRadius:"50%",background:GOLD}}/>
                          <span style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:15,color:"#1a1410"}}>{flight.airline}</span>
                          <span style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:"#777"}}>{flight.flight_no}</span>
                        </div>
                        <div style={{display:"flex",gap:7}}>
                          {isDomestic&&<span style={{padding:"3px 9px",borderRadius:20,fontSize:10,background:`rgba(201,168,76,0.12)`,border:`1px solid rgba(201,168,76,0.3)`,color:GOLD_DARK,fontFamily:"'Space Mono',monospace",fontWeight:600}}>Seats ✓</span>}
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
                            <div style={{flex:1,height:1.5,background:`linear-gradient(90deg,rgba(201,168,76,0.4),rgba(201,168,76,0.8),rgba(201,168,76,0.4))`}}/>
                            <span style={{fontSize:14,color:GOLD}}>✈</span>
                            <div style={{flex:1,height:1.5,background:`linear-gradient(90deg,rgba(201,168,76,0.8),rgba(201,168,76,0.4))`}}/>
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
                        <button onClick={()=>handleFlightDeal(flight.from_city, flight.to_city)}
                          style={{padding:"12px 26px",borderRadius:12,fontSize:14,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.06em",color:"#1a1410",border:"none",cursor:"pointer",background:GRAD,backgroundSize:"200% 200%",animation:"gradShift 3s ease infinite",boxShadow:`0 4px 14px rgba(201,168,76,0.44)`,transition:"transform 0.2s"}}
                          onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
                          onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>Check Live Prices →</button>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {/* ── Bus results ── */}
              {travelType==="bus" && filtered.length===0 && searched && !loading && (
                // No local buses — show RedBus redirect
                <div style={{background:"rgba(255,255,255,0.88)",backdropFilter:"blur(10px)",borderRadius:18,padding:"30px 26px",boxShadow:"0 4px 16px rgba(0,0,0,0.05)",border:"1px solid rgba(201,168,76,0.12)",textAlign:"center",animation:"fadeUp 0.4s both"}}>
                  <div style={{fontSize:48,marginBottom:12}}>🚌</div>
                  <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:20,color:"#1a1410",marginBottom:8}}>More options available on RedBus</h3>
                  <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"#555",marginBottom:18}}>Check full schedule, live seat availability and offers on RedBus for {busFrom} → {busTo}</p>
                  <button onClick={()=>openBusLink(busFrom,busTo)}
                    style={{padding:"13px 32px",borderRadius:13,fontSize:15,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.08em",color:"#1a1410",border:"none",cursor:"pointer",background:GRAD,backgroundSize:"200% 200%",animation:"gradShift 3s ease infinite",boxShadow:`0 4px 14px rgba(201,168,76,0.44)`}}>
                    View on RedBus →
                  </button>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#bbb",marginTop:10}}>Opens on RedBus · Best price guaranteed</div>
                </div>
              )}

              {travelType==="bus" && filtered.map((bus,i)=>(
                <div key={i} style={{background:"rgba(255,255,255,0.88)",backdropFilter:"blur(10px)",borderRadius:18,padding:"20px 22px",boxShadow:"0 4px 16px rgba(0,0,0,0.05)",border:"1px solid rgba(201,168,76,0.12)",animation:`fadeUp 0.4s ${i*60}ms both`,transition:"all 0.2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(201,168,76,0.38)";e.currentTarget.style.transform="translateY(-2px)";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(201,168,76,0.12)";e.currentTarget.style.transform="translateY(0)";}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:GOLD}}/>
                      <span style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:15,color:"#1a1410"}}>{bus.op}</span>
                    </div>
                    <div style={{display:"flex",gap:7}}>
                      <span style={{padding:"3px 9px",borderRadius:20,fontSize:10,background:`rgba(201,168,76,0.12)`,border:`1px solid rgba(201,168,76,0.3)`,color:GOLD_DARK,fontFamily:"'Space Mono',monospace",fontWeight:600}}>Seats ✓</span>
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
                        <div style={{flex:1,height:1.5,background:`linear-gradient(90deg,rgba(201,168,76,0.4),rgba(201,168,76,0.8),rgba(201,168,76,0.4))`}}/>
                        <span style={{fontSize:16}}>🚌</span>
                        <div style={{flex:1,height:1.5,background:`linear-gradient(90deg,rgba(201,168,76,0.8),rgba(201,168,76,0.4))`}}/>
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
                    <div style={{display:"flex",flexDirection:"column",gap:8,alignItems:"flex-end"}}>
                      <button onClick={()=>openBusLink(bus.from, bus.to)}
                        style={{padding:"12px 26px",borderRadius:12,fontSize:14,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.06em",color:"#1a1410",border:"none",cursor:"pointer",background:GRAD,backgroundSize:"200% 200%",animation:"gradShift 3s ease infinite",boxShadow:`0 4px 14px rgba(201,168,76,0.44)`,transition:"transform 0.2s"}}
                        onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
                        onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>Check Live Prices →</button>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#bbb"}}>Best price guaranteed</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {!loading && !searched && (
          <div style={{textAlign:"center",padding:"80px 20px",animation:"fadeUp 0.5s both"}}>
            <div style={{fontSize:64,marginBottom:20,animation:"floatUD 3s ease-in-out infinite"}}>{travelType==="bus"?"🚌":travelType==="hotel"?"🏨":travelType==="train"?"🚂":"✈️"}</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:22,color:"#7a6a5a"}}>Your journey starts here</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"#7a6a5a",marginTop:8,fontWeight:500}}>Search above or try AI search in any language</div>
          </div>
        )}
      </div>
      {/* Affiliate disclosure */}
      <div style={{textAlign:"center",padding:"16px 5%",borderTop:"1px solid rgba(201,168,76,0.1)",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#bbb",background:"rgba(250,248,244,0.8)"}}>
        Alvryn is a travel discovery platform. We may earn a commission from partner links at no extra cost to you.
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  APP ROUTER
// ═══════════════════════════════════════════════════════
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