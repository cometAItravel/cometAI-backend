/* eslint-disable no-useless-escape */
import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import MyBookings from "./pages/MyBookings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import LandingPage from "./pages/LandingPage";
import AdminDashboard from "./pages/AdminDashboard";
import UserProfile from "./pages/UserProfile";

const API = "https://cometai-backend.onrender.com";
const GOLD = "#c9a84c";
const GOLD_DARK = "#8B6914";
const GRAD = "linear-gradient(135deg,#c9a84c,#f0d080,#c9a84c)";
const TRAVELPAYOUTS_MARKER = "714667";

const SHARED_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600&family=Space+Mono:wght@400;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html{scroll-behavior:smooth;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(22px);}to{opacity:1;transform:translateY(0);}}
  @keyframes floatUD{0%,100%{transform:translateY(0);}50%{transform:translateY(-9px);}}
  @keyframes gradShift{0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;}}
  @keyframes spinSlow{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.6;}}
  ::-webkit-scrollbar{width:2px;}
  ::-webkit-scrollbar-thumb{background:linear-gradient(#c9a84c,#8B6914);border-radius:2px;}
  @media(max-width:768px){
    .search-city-grid{grid-template-columns:1fr!important;}
    .search-date-grid{grid-template-columns:1fr 1fr!important;}
    .results-card-bottom{flex-direction:column!important;gap:12px!important;}
  }
`;

// ─── ICON ─────────────────────────────────────────────────────────────────────
function AlvrynIcon({ size = 40 }) {
  const uid = "app_" + size;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={{flexShrink:0}}>
      <defs>
        <linearGradient id={uid+"g"} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c9a84c"/><stop offset="50%" stopColor="#f0d080"/><stop offset="100%" stopColor="#8B6914"/>
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" stroke={"url(#"+uid+"g)"} strokeWidth="1.2" fill="none"/>
      <circle cx="32" cy="32" r="26" stroke={"url(#"+uid+"g)"} strokeWidth="0.5" fill="none" opacity="0.4"/>
      <path d="M20 46 L28 18 L36 46" stroke={"url(#"+uid+"g)"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M22.5 36 L33.5 36" stroke={"url(#"+uid+"g)"} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M26 46 L34 18 L42 46" stroke={"url(#"+uid+"g)"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.45"/>
      <path d="M28 36 L40 36" stroke={"url(#"+uid+"g)"} strokeWidth="1" strokeLinecap="round" opacity="0.45"/>
      <circle cx="32" cy="9" r="1.5" fill={"url(#"+uid+"g)"}/>
      <path d="M29 9 L32 6 L35 9" stroke={"url(#"+uid+"g)"} strokeWidth="0.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── AURORA BG ────────────────────────────────────────────────────────────────
function AuroraBackground() {
  const ref=useRef(null);const raf=useRef(null);
  useEffect(()=>{
    const c=ref.current;if(!c)return;const ctx=c.getContext("2d");
    let W=c.offsetWidth,H=c.offsetHeight;c.width=W;c.height=H;
    const cols=["#c9a84c","#f0d080","#8B6914","#d4b868"];
    const blobs=Array.from({length:5},(_,i)=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-0.5)*0.45,vy:(Math.random()-0.5)*0.45,r:200+Math.random()*180,ci:i%cols.length}));
    const resize=()=>{W=c.offsetWidth;H=c.offsetHeight;c.width=W;c.height=H;};
    window.addEventListener("resize",resize);
    const draw=()=>{ctx.clearRect(0,0,W,H);blobs.forEach(b=>{b.x+=b.vx;b.y+=b.vy;if(b.x<-b.r||b.x>W+b.r)b.vx*=-1;if(b.y<-b.r||b.y>H+b.r)b.vy*=-1;const g=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r);g.addColorStop(0,cols[b.ci]+"18");g.addColorStop(1,"transparent");ctx.fillStyle=g;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();});raf.current=requestAnimationFrame(draw);};
    draw();
    return()=>{cancelAnimationFrame(raf.current);window.removeEventListener("resize",resize);};
  },[]);
  return <canvas ref={ref} style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:0}}/>;
}

// ─── BUS DATA ─────────────────────────────────────────────────────────────────
const BUS_ROUTES=[
  {from:"Bangalore",to:"Chennai",    dur:"5h 30m",dep:"06:00",arr:"11:30",price:650, seats:40,type:"AC Sleeper",   op:"VRL Travels"},
  {from:"Bangalore",to:"Chennai",    dur:"5h 30m",dep:"21:00",arr:"02:30",price:550, seats:35,type:"Semi-Sleeper", op:"KSRTC"},
  {from:"Bangalore",to:"Chennai",    dur:"5h 30m",dep:"14:00",arr:"19:30",price:720, seats:28,type:"AC Sleeper",   op:"SRS Travels"},
  {from:"Bangalore",to:"Hyderabad",  dur:"8h",    dep:"20:00",arr:"04:00",price:800, seats:30,type:"AC Sleeper",   op:"SRS Travels"},
  {from:"Bangalore",to:"Hyderabad",  dur:"8h",    dep:"10:00",arr:"18:00",price:750, seats:35,type:"Semi-Sleeper", op:"Orange Travels"},
  {from:"Bangalore",to:"Goa",        dur:"9h",    dep:"21:30",arr:"06:30",price:900, seats:28,type:"AC Sleeper",   op:"Neeta Tours"},
  {from:"Bangalore",to:"Goa",        dur:"9h",    dep:"08:00",arr:"17:00",price:850, seats:32,type:"AC Sleeper",   op:"Paulo Travels"},
  {from:"Bangalore",to:"Mumbai",     dur:"16h",   dep:"17:00",arr:"09:00",price:1400,seats:22,type:"AC Sleeper",   op:"VRL Travels"},
  {from:"Bangalore",to:"Pune",       dur:"14h",   dep:"18:00",arr:"08:00",price:1200,seats:25,type:"AC Sleeper",   op:"Paulo Travels"},
  {from:"Bangalore",to:"Coimbatore", dur:"4h",    dep:"07:00",arr:"11:00",price:400, seats:45,type:"AC Seater",    op:"KSRTC"},
  {from:"Bangalore",to:"Coimbatore", dur:"4h",    dep:"15:00",arr:"19:00",price:380, seats:50,type:"AC Seater",    op:"SRM Travels"},
  {from:"Bangalore",to:"Mangalore",  dur:"7h",    dep:"22:00",arr:"05:00",price:700, seats:32,type:"AC Sleeper",   op:"VRL Travels"},
  {from:"Bangalore",to:"Mysore",     dur:"3h",    dep:"07:00",arr:"10:00",price:250, seats:55,type:"AC Seater",    op:"KSRTC"},
  {from:"Bangalore",to:"Mysore",     dur:"3h",    dep:"13:00",arr:"16:00",price:280, seats:50,type:"AC Seater",    op:"SRS Travels"},
  {from:"Bangalore",to:"Kochi",      dur:"10h",   dep:"21:00",arr:"07:00",price:950, seats:28,type:"AC Sleeper",   op:"KSRTC"},
  {from:"Bangalore",to:"Madurai",    dur:"8h",    dep:"21:00",arr:"05:00",price:750, seats:30,type:"AC Sleeper",   op:"Parveen Travels"},
  {from:"Chennai",  to:"Bangalore",  dur:"5h 30m",dep:"07:00",arr:"12:30",price:630, seats:40,type:"AC Sleeper",   op:"VRL Travels"},
  {from:"Chennai",  to:"Bangalore",  dur:"5h 30m",dep:"21:30",arr:"03:00",price:580, seats:35,type:"Semi-Sleeper", op:"KSRTC"},
  {from:"Chennai",  to:"Hyderabad",  dur:"7h",    dep:"21:00",arr:"04:00",price:750, seats:35,type:"AC Sleeper",   op:"TSRTC"},
  {from:"Chennai",  to:"Coimbatore", dur:"4h 30m",dep:"08:00",arr:"12:30",price:350, seats:50,type:"AC Seater",    op:"TNSTC"},
  {from:"Chennai",  to:"Madurai",    dur:"5h",    dep:"22:00",arr:"03:00",price:450, seats:40,type:"AC Sleeper",   op:"Parveen Travels"},
  {from:"Chennai",  to:"Kochi",      dur:"8h",    dep:"20:00",arr:"04:00",price:800, seats:32,type:"AC Sleeper",   op:"TNSTC"},
  {from:"Hyderabad",to:"Bangalore",  dur:"8h",    dep:"21:00",arr:"05:00",price:800, seats:30,type:"AC Sleeper",   op:"Orange Travels"},
  {from:"Hyderabad",to:"Mumbai",     dur:"12h",   dep:"18:00",arr:"06:00",price:1100,seats:25,type:"AC Sleeper",   op:"VRL Travels"},
  {from:"Hyderabad",to:"Chennai",    dur:"7h",    dep:"20:30",arr:"03:30",price:700, seats:35,type:"AC Sleeper",   op:"APSRTC"},
  {from:"Hyderabad",to:"Pune",       dur:"10h",   dep:"19:00",arr:"05:00",price:950, seats:28,type:"AC Sleeper",   op:"SRS Travels"},
  {from:"Mumbai",   to:"Pune",       dur:"3h",    dep:"07:00",arr:"10:00",price:300, seats:55,type:"AC Seater",    op:"MSRTC"},
  {from:"Mumbai",   to:"Goa",        dur:"10h",   dep:"22:00",arr:"08:00",price:950, seats:28,type:"AC Sleeper",   op:"Paulo Travels"},
  {from:"Mumbai",   to:"Ahmedabad",  dur:"8h",    dep:"21:00",arr:"05:00",price:800, seats:32,type:"AC Sleeper",   op:"Patel Travels"},
  {from:"Pune",     to:"Goa",        dur:"8h",    dep:"22:30",arr:"06:30",price:850, seats:30,type:"AC Sleeper",   op:"Neeta Tours"},
  {from:"Pune",     to:"Hyderabad",  dur:"10h",   dep:"20:00",arr:"06:00",price:950, seats:28,type:"AC Sleeper",   op:"SRS Travels"},
  {from:"Delhi",    to:"Jaipur",     dur:"5h",    dep:"06:00",arr:"11:00",price:500, seats:45,type:"AC Seater",    op:"RSRTC"},
  {from:"Delhi",    to:"Agra",       dur:"4h",    dep:"07:00",arr:"11:00",price:400, seats:50,type:"AC Seater",    op:"UP Roadways"},
  {from:"Delhi",    to:"Chandigarh", dur:"4h",    dep:"08:00",arr:"12:00",price:450, seats:48,type:"AC Seater",    op:"HRTC"},
  {from:"Delhi",    to:"Lucknow",    dur:"7h",    dep:"22:00",arr:"05:00",price:700, seats:35,type:"AC Sleeper",   op:"UP SRTC"},
  {from:"Delhi",    to:"Amritsar",   dur:"7h",    dep:"21:30",arr:"04:30",price:750, seats:32,type:"AC Sleeper",   op:"PRTC"},
  {from:"Kolkata",  to:"Bhubaneswar",dur:"6h",    dep:"21:00",arr:"03:00",price:600, seats:38,type:"AC Sleeper",   op:"OSRTC"},
  {from:"Kolkata",  to:"Patna",      dur:"9h",    dep:"20:00",arr:"05:00",price:750, seats:30,type:"AC Sleeper",   op:"BSRTC"},
];

// ─── CITY IATA MAP ────────────────────────────────────────────────────────────
const CITY_IATA = {
  "bangalore":"BLR","mumbai":"BOM","delhi":"DEL","chennai":"MAA","hyderabad":"HYD",
  "kolkata":"CCU","goa":"GOI","pune":"PNQ","kochi":"COK","ahmedabad":"AMD","jaipur":"JAI",
  "lucknow":"LKO","varanasi":"VNS","patna":"PAT","chandigarh":"IXC","guwahati":"GAU",
  "bhubaneswar":"BBI","coimbatore":"CBE","madurai":"IXM","mangalore":"IXE","mysore":"MYQ",
  "trivandrum":"TRV","visakhapatnam":"VTZ","srinagar":"SXR","jammu":"IXJ",
  "udaipur":"UDR","amritsar":"ATQ","indore":"IDR","ranchi":"IXR","bhopal":"BHO",
  "dubai":"DXB","singapore":"SIN","bangkok":"BKK","london":"LHR","new york":"JFK",
  "kuala lumpur":"KUL","colombo":"CMB","paris":"CDG","tokyo":"NRT","sydney":"SYD",
};

function getAviasalesLink(fromCity, toCity, dateStr, passengers) {
  const fromCode = CITY_IATA[fromCity.toLowerCase()] || fromCity.slice(0,3).toUpperCase();
  const toCode   = CITY_IATA[toCity.toLowerCase()]   || toCity.slice(0,3).toUpperCase();
  const pax = passengers || 1;
  return "https://www.aviasales.in/search/" + fromCode + (dateStr||"") + toCode + pax
    + "?marker=" + TRAVELPAYOUTS_MARKER + "&sub_id=alvryn_web";
}

function getRedbusLink(fromCity, toCity) {
  return "https://www.redbus.in/bus-tickets/"
    + fromCity.toLowerCase().replace(/\s+/g,"-")
    + "-to-"
    + toCity.toLowerCase().replace(/\s+/g,"-");
}

function getHotelLink(city) {
  return "https://www.booking.com/searchresults.html?ss=" + encodeURIComponent(city) + "&affiliate_id=2431710";
}

// ─── AI PARSER ────────────────────────────────────────────────────────────────
const CITY_ALIASES={
  "bangalore":"bangalore","bengaluru":"bangalore","bengalore":"bangalore","bangaluru":"bangalore",
  "blr":"bangalore","bang":"bangalore","banglore":"bangalore","bangalor":"bangalore","blore":"bangalore",
  "mumbai":"mumbai","bombay":"mumbai","bom":"mumbai","mum":"mumbai","mumbi":"mumbai","mumbay":"mumbai",
  "delhi":"delhi","new delhi":"delhi","del":"delhi","dilli":"delhi","nai dilli":"delhi","dilhi":"delhi",
  "chennai":"chennai","madras":"chennai","maa":"chennai","chenai":"chennai","chinnai":"chennai","chenni":"chennai",
  "hyderabad":"hyderabad","hyd":"hyderabad","hydrabad":"hyderabad","secunderabad":"hyderabad","hyderbad":"hyderabad",
  "kolkata":"kolkata","calcutta":"kolkata","ccu":"kolkata","kolkatta":"kolkata",
  "goa":"goa","goi":"goa","north goa":"goa","south goa":"goa","panaji":"goa",
  "pune":"pune","pnq":"pune","poona":"pune","puna":"pune",
  "kochi":"kochi","cochin":"kochi","cok":"kochi","ernakulam":"kochi",
  "ahmedabad":"ahmedabad","amd":"ahmedabad","ahemdabad":"ahmedabad",
  "jaipur":"jaipur","jai":"jaipur","pink city":"jaipur",
  "lucknow":"lucknow","lko":"lucknow","lakhnau":"lucknow",
  "varanasi":"varanasi","vns":"varanasi","banaras":"varanasi","kashi":"varanasi",
  "patna":"patna","chandigarh":"chandigarh","ixc":"chandigarh",
  "guwahati":"guwahati","gauhati":"guwahati","gau":"guwahati",
  "bhubaneswar":"bhubaneswar","bbi":"bhubaneswar","bbsr":"bhubaneswar",
  "coimbatore":"coimbatore","cbe":"coimbatore","kovai":"coimbatore","koimbatore":"coimbatore",
  "madurai":"madurai","mdu":"madurai","maduri":"madurai",
  "mangalore":"mangalore","mangaluru":"mangalore","ixe":"mangalore",
  "mysore":"mysore","mysuru":"mysore",
  "trivandrum":"trivandrum","thiruvananthapuram":"trivandrum","trv":"trivandrum",
  "visakhapatnam":"visakhapatnam","vizag":"visakhapatnam","vtz":"visakhapatnam",
  "surat":"surat","haridwar":"haridwar","jodhpur":"jodhpur","udaipur":"udaipur",
  "amritsar":"amritsar","atq":"amritsar","agra":"agra","indore":"indore","raipur":"raipur",
  "nashik":"nashik","nagpur":"nagpur","shimla":"shimla","dehradun":"dehradun",
  "ranchi":"ranchi","bhopal":"bhopal","srinagar":"srinagar","jammu":"jammu",
  "hubli":"hubli","belgaum":"belgaum","tirupati":"tirupati","leh":"leh",
  "dubai":"dubai","dxb":"dubai","dubi":"dubai","dubay":"dubai",
  "singapore":"singapore","sin":"singapore","singapur":"singapore",
  "bangkok":"bangkok","bkk":"bangkok","bangkock":"bangkok",
  "london":"london","lhr":"london","landan":"london",
  "new york":"new york","jfk":"new york","nyc":"new york","newyork":"new york",
  "kuala lumpur":"kuala lumpur","kul":"kuala lumpur","kl":"kuala lumpur",
  "colombo":"colombo","cmb":"colombo",
  "paris":"paris","cdg":"paris","tokyo":"tokyo","nrt":"tokyo",
  "sydney":"sydney","syd":"sydney",
};

function parseQuery(text) {
  let t = text.toLowerCase()
    .replace(/[^\w\s]/g," ")
    .replace(/\b(flights?|flight|buses?|bus|book|mujhe|muje|chahiye|chaiye|show|me|please|kya|hai|hain|aur|ka|ke|ki|se|ko|tak|liye|ek|ticket|find|search|bata|dikha|looking|want|need)\b/gi," ")
    .replace(/\s+/g," ").trim();

  let found=[];
  const multiWord=Object.keys(CITY_ALIASES).filter(k=>k.includes(" ")).sort((a,b)=>b.length-a.length);
  let remaining=t;
  for(const key of multiWord){
    if(remaining.includes(key)&&found.length<2){found.push(CITY_ALIASES[key]);remaining=remaining.replace(key," ");}
  }
  const words=remaining.split(/[\s,\-\/]+/);
  for(const word of words){
    const clean=word.replace(/[^a-z]/g,"");
    if(clean.length>=2&&CITY_ALIASES[clean]&&found.length<2&&!found.includes(CITY_ALIASES[clean]))found.push(CITY_ALIASES[clean]);
  }
  if(found.length<2){
    const allKeys=Object.keys(CITY_ALIASES);
    for(const w of remaining.split(/\s+/)){
      if(w.length<3)continue;
      for(const key of allKeys){
        if(key.length>=3&&w.slice(0,3)===key.slice(0,3)&&!found.includes(CITY_ALIASES[key])){
          found.push(CITY_ALIASES[key]);if(found.length===2)break;
        }
      }
      if(found.length===2)break;
    }
  }

  const now=new Date();let date=null;
  const months={jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11,
    january:0,february:1,march:2,april:3,june:5,july:6,august:7,september:8,october:9,november:10,december:11};
  for(const[mon,idx]of Object.entries(months)){
    const m=t.match(new RegExp("(\\d{1,2})\\s*"+mon+"|"+mon+"\\s*(\\d{1,2})"));
    if(m){const day=parseInt(m[1]||m[2]);const d=new Date(now.getFullYear(),idx,day);if(d<now)d.setFullYear(d.getFullYear()+1);date=d;break;}
  }
  const todayW=["today","aaj","indru","ee roju"];
  const tomW=["tomorrow","kal","tmrw","tommorow","nale","repu","naale"];
  const dayAfW=["day after tomorrow","parso"];
  const wkW=["this weekend","weekend","saturday"];
  if(todayW.some(w=>t.includes(w)))date=new Date(now);
  else if(dayAfW.some(w=>t.includes(w))){date=new Date(now);date.setDate(date.getDate()+2);}
  else if(tomW.some(w=>t.includes(w))){date=new Date(now);date.setDate(date.getDate()+1);}
  else if(wkW.some(w=>t.includes(w))){date=new Date(now);const diff=(6-now.getDay()+7)%7||7;date.setDate(now.getDate()+diff);}
  const dayMap={sun:0,sunday:0,mon:1,monday:1,tue:2,tuesday:2,wed:3,wednesday:3,thu:4,thursday:4,fri:5,friday:5,sat:6,saturday:6,ravivar:0,somvar:1,mangalvar:2,budhvar:3,guruvar:4,shukravar:5,shanivar:6};
  for(const[day,idx]of Object.entries(dayMap)){
    if(t.includes(day)){const d=new Date(now);let diff=idx-now.getDay();if(/next|agla|agle/.test(t)){if(diff<=0)diff+=7;if(diff<7)diff+=7;}else{if(diff<=0)diff+=7;}d.setDate(now.getDate()+diff);date=d;break;}
  }
  const inDays=t.match(/in\s*(\d+)\s*(din|days?)/);
  if(inDays){date=new Date(now);date.setDate(now.getDate()+parseInt(inDays[1]));}
  if(date&&date<new Date(new Date(now).setHours(0,0,0,0)))return{from:found[0]||null,to:found[1]||null,date:null,pastDate:true,budget:null};
  let budget=null;
  const bP=[/under\s*[₹rs.]*\s*(\d+)k?/,/below\s*[₹rs.]*\s*(\d+)k?/,/less\s*than\s*[₹rs.]*\s*(\d+)k?/,/max\s*[₹rs.]*\s*(\d+)k?/,/[₹rs.]*\s*(\d+)k?\s*(se\s*)?kam/,/(\d+)k?\s*tak/];
  for(const p of bP){const m=t.match(p);if(m){let v=parseInt(m[1]||m[2]);if(t.match(/\d+k/))v*=1000;budget=v;break;}}
  return{from:found[0]||null,to:found[1]||null,date,pastDate:false,budget};
}

// ─── SMART LABELS ─────────────────────────────────────────────────────────────
function getFlightLabels(flight, allFlights, index) {
  const labels = [];
  const prices = allFlights.map(f=>f.price);
  const minPrice = Math.min(...prices);
  const deps = allFlights.map(f=>new Date(f.departure_time).getTime());
  const earliest = Math.min(...deps);

  if(flight.price === minPrice) labels.push({text:"Best Price",color:"#16a34a",bg:"rgba(22,163,74,0.1)"});
  else if(index === 0 && flight.price <= minPrice*1.05) labels.push({text:"Recommended",color:GOLD_DARK,bg:"rgba(201,168,76,0.12)"});
  if(new Date(flight.departure_time).getTime()===earliest) labels.push({text:"Earliest",color:"#2563eb",bg:"rgba(37,99,235,0.1)"});
  if(index===1&&labels.length===0) labels.push({text:"Popular Choice",color:"#7c3aed",bg:"rgba(124,58,237,0.1)"});
  return labels;
}

function getFlightInsight(flight, allFlights) {
  const hour = new Date(flight.departure_time).getHours();
  const prices = allFlights.map(f=>f.price);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const savings = maxP - flight.price;

  if(hour>=5&&hour<9) return "Morning flights are typically 15–20% cheaper on this route.";
  if(hour>=22||hour<5) return "Late night flights often have better availability and lower fares.";
  if(flight.price===minP&&savings>500) return "You're saving ₹" + savings.toLocaleString() + " compared to other options on this route.";
  if(flight.price<=minP*1.1) return "You're getting a competitive price for this route.";
  return "Prices may vary across platforms — this is one of the best available.";
}

function getBusLabels(bus, allBuses, index) {
  const labels = [];
  const prices = allBuses.map(b=>b.price);
  const minPrice = Math.min(...prices);
  if(bus.price===minPrice) labels.push({text:"Best Price",color:"#16a34a",bg:"rgba(22,163,74,0.1)"});
  if(bus.type==="AC Sleeper"&&index===0) labels.push({text:"Most Popular",color:"#7c3aed",bg:"rgba(124,58,237,0.1)"});
  if(parseInt(bus.dep.split(":")[0])>=5&&parseInt(bus.dep.split(":")[0])<12) labels.push({text:"Morning",color:"#2563eb",bg:"rgba(37,99,235,0.1)"});
  return labels;
}

function getBusInsight(bus, allBuses) {
  const hour = parseInt(bus.dep.split(":")[0]);
  const prices = allBuses.map(b=>b.price);
  const minP = Math.min(...prices);
  const savings = Math.max(...prices) - bus.price;
  if(hour>=20||hour<5) return "Night buses save you hotel costs — arrive fresh in the morning.";
  if(bus.price===minP&&savings>200) return "You save ₹" + savings.toLocaleString() + " choosing this over other options.";
  if(bus.type==="AC Sleeper") return "AC Sleeper is the most comfortable option for this distance.";
  return "Prices may vary slightly based on provider. Multiple operators serve this route.";
}

// ─── CITIES ───────────────────────────────────────────────────────────────────
const CITIES=[
  {code:"BLR",name:"Bangalore",    full:"Kempegowda International",       country:"India",popular:true},
  {code:"BOM",name:"Mumbai",       full:"Chhatrapati Shivaji Intl",        country:"India",popular:true},
  {code:"DEL",name:"Delhi",        full:"Indira Gandhi International",     country:"India",popular:true},
  {code:"MAA",name:"Chennai",      full:"Chennai International",           country:"India",popular:true},
  {code:"HYD",name:"Hyderabad",    full:"Rajiv Gandhi International",      country:"India",popular:true},
  {code:"CCU",name:"Kolkata",      full:"Netaji Subhas Chandra Bose Intl", country:"India",popular:true},
  {code:"GOI",name:"Goa",          full:"Dabolim / Mopa Airport",          country:"India",popular:true},
  {code:"PNQ",name:"Pune",         full:"Pune Airport",                    country:"India",popular:true},
  {code:"COK",name:"Kochi",        full:"Cochin International",            country:"India",popular:true},
  {code:"AMD",name:"Ahmedabad",    full:"Sardar Vallabhbhai Patel Intl",   country:"India",popular:true},
  {code:"JAI",name:"Jaipur",       full:"Jaipur International",            country:"India",popular:true},
  {code:"LKO",name:"Lucknow",      full:"Chaudhary Charan Singh Intl",     country:"India",popular:false},
  {code:"VNS",name:"Varanasi",     full:"Lal Bahadur Shastri Airport",     country:"India",popular:false},
  {code:"PAT",name:"Patna",        full:"Jay Prakash Narayan Airport",     country:"India",popular:false},
  {code:"BHO",name:"Bhopal",       full:"Raja Bhoj Airport",               country:"India",popular:false},
  {code:"NAG",name:"Nagpur",       full:"Dr. Babasaheb Ambedkar Intl",     country:"India",popular:false},
  {code:"IXC",name:"Chandigarh",   full:"Chandigarh Airport",              country:"India",popular:false},
  {code:"GAU",name:"Guwahati",     full:"Lokpriya Gopinath Bordoloi Intl", country:"India",popular:false},
  {code:"BBI",name:"Bhubaneswar",  full:"Biju Patnaik International",      country:"India",popular:false},
  {code:"TRV",name:"Trivandrum",   full:"Trivandrum International",        country:"India",popular:false},
  {code:"UDR",name:"Udaipur",      full:"Maharana Pratap Airport",         country:"India",popular:false},
  {code:"ATQ",name:"Amritsar",     full:"Sri Guru Ram Dass Jee Intl",      country:"India",popular:false},
  {code:"IDR",name:"Indore",       full:"Devi Ahilyabai Holkar Airport",   country:"India",popular:false},
  {code:"VTZ",name:"Visakhapatnam",full:"Visakhapatnam Airport",           country:"India",popular:false},
  {code:"IXR",name:"Ranchi",       full:"Birsa Munda Airport",             country:"India",popular:false},
  {code:"SXR",name:"Srinagar",     full:"Sheikh ul-Alam Airport",          country:"India",popular:false},
  {code:"IXE",name:"Mangalore",    full:"Mangalore International",         country:"India",popular:false},
  {code:"CBE",name:"Coimbatore",   full:"Coimbatore International",        country:"India",popular:false},
  {code:"IXM",name:"Madurai",      full:"Madurai Airport",                 country:"India",popular:false},
  {code:"DXB",name:"Dubai",        full:"Dubai International",             country:"UAE",       popular:true},
  {code:"SIN",name:"Singapore",    full:"Changi Airport",                  country:"Singapore", popular:true},
  {code:"BKK",name:"Bangkok",      full:"Suvarnabhumi Airport",            country:"Thailand",  popular:true},
  {code:"LHR",name:"London",       full:"Heathrow Airport",                country:"UK",        popular:true},
  {code:"JFK",name:"New York",     full:"JFK International",               country:"USA",       popular:true},
  {code:"KUL",name:"Kuala Lumpur", full:"KLIA Airport",                    country:"Malaysia",  popular:true},
  {code:"CMB",name:"Colombo",      full:"Bandaranaike International",      country:"Sri Lanka", popular:false},
];
const BUS_CITIES=[...new Set([...BUS_ROUTES.map(r=>r.from),...BUS_ROUTES.map(r=>r.to)])].sort();
const CLASSES=["Economy","Premium Economy","Business","First Class"];
const BUS_TYPES=["Any","AC Sleeper","Semi-Sleeper","AC Seater"];

function fmtTime(dt){if(!dt)return"--:--";return new Date(dt).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false});}
function fmtDate(dt){if(!dt)return"";return new Date(dt).toLocaleDateString("en-IN",{day:"numeric",month:"short"});}
function fmtDateStr(dt){if(!dt)return"";const d=new Date(dt);const mm=String(d.getMonth()+1).padStart(2,"0");const dd=String(d.getDate()).padStart(2,"0");return dd+mm;}
function calcDur(dep,arr){if(!dep||!arr)return"";const d=(new Date(arr)-new Date(dep))/60000;return Math.floor(d/60)+"h"+(d%60>0?" "+d%60+"m":"");}

// ─── MODALS ───────────────────────────────────────────────────────────────────
function CityModal({title,onSelect,onClose,exclude}){
  const[s,setS]=useState("");
  const shown=CITIES.filter(c=>c.code!==exclude&&(c.name.toLowerCase().includes(s.toLowerCase())||c.code.toLowerCase().includes(s.toLowerCase())||c.country.toLowerCase().includes(s.toLowerCase())));
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:480,background:"rgba(250,248,244,0.98)",borderRadius:22,padding:28,boxShadow:"0 24px 80px rgba(0,0,0,0.15)",border:"1px solid rgba(201,168,76,0.2)",maxHeight:"80vh",display:"flex",flexDirection:"column"}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:20,color:"#1a1410",marginBottom:14}}>{title}</div>
        <input autoFocus value={s} onChange={e=>setS(e.target.value)} placeholder="Search city or code…"
          style={{width:"100%",padding:"11px 16px",borderRadius:12,fontSize:14,fontFamily:"'DM Sans',sans-serif",border:"1.5px solid rgba(201,168,76,0.3)",outline:"none",marginBottom:12,color:"#1a1410",background:"#fafaf8"}}
          onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor="rgba(201,168,76,0.3)"}/>
        {!s&&<div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#999",letterSpacing:"0.15em",marginBottom:8}}>POPULAR CITIES</div>}
        <div style={{display:"flex",flexDirection:"column",gap:5,overflowY:"auto",flex:1}}>
          {shown.map(city=>(
            <div key={city.code} onClick={()=>onSelect(city)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",borderRadius:11,cursor:"pointer",background:"rgba(255,255,255,0.7)",border:"1px solid rgba(201,168,76,0.1)",transition:"all 0.15s"}}
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
          style={{width:"100%",padding:"11px 16px",borderRadius:12,fontSize:14,fontFamily:"'DM Sans',sans-serif",border:"1.5px solid rgba(201,168,76,0.3)",outline:"none",marginBottom:12,color:"#1a1410",background:"#fafaf8"}}
          onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor="rgba(201,168,76,0.3)"}/>
        <div style={{display:"flex",flexDirection:"column",gap:5,overflowY:"auto",flex:1}}>
          {shown.map(city=>(
            <div key={city} onClick={()=>onSelect(city)} style={{padding:"13px 16px",borderRadius:11,cursor:"pointer",background:"rgba(255,255,255,0.7)",border:"1px solid rgba(201,168,76,0.1)",fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:600,color:"#1a1410",transition:"all 0.15s"}}
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

function SeatModal({type,passengers,onConfirm,onCancel}){
  const isBus=type==="bus";
  const COLS=isBus?["A","B","C","D"]:["A","B","C","D","E","F"];
  const ROWS=Array.from({length:isBus?11:20},(_,i)=>i+1);
  const[taken]=useState(()=>{const t=new Set();for(let i=0;i<(isBus?8:18);i++)t.add((Math.ceil(Math.random()*(isBus?11:20)))+COLS[Math.floor(Math.random()*COLS.length)]);return t;});
  const[sel,setSel]=useState([]);
  const toggle=s=>{if(taken.has(s))return;setSel(p=>p.includes(s)?p.filter(x=>x!==s):p.length<passengers?[...p,s]:p);};
  const clr=s=>taken.has(s)?"#d1d5db":sel.includes(s)?GOLD:"rgba(201,168,76,0.1)";
  return(
    <div onClick={onCancel} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:700,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(10px)",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:480,background:"#faf8f4",borderRadius:24,boxShadow:"0 32px 100px rgba(0,0,0,0.18)",border:"1px solid rgba(201,168,76,0.2)",maxHeight:"90vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{background:GRAD,backgroundSize:"200% 200%",animation:"gradShift 4s ease infinite",padding:"18px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,color:"#1a1410",fontSize:17}}>{isBus?"Select Bus Seats":"Select Seats"}</div>
            <div style={{fontSize:13,color:"rgba(26,20,16,0.75)",marginTop:3}}>Pick {passengers} seat{passengers>1?"s":""}</div>
          </div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:14,color:"#1a1410",fontWeight:700}}>{sel.length}/{passengers}</div>
        </div>
        <div style={{overflowY:"auto",padding:"16px 20px 12px"}}>
          <div style={{textAlign:"center",marginBottom:10}}>{isBus?"🚌":"✈️"}</div>
          <div style={{display:"flex",gap:16,justifyContent:"center",marginBottom:14}}>
            {[["rgba(201,168,76,0.1)","Available"],["#c9a84c","Selected"],["#d1d5db","Booked"]].map(([bg,label])=>(
              <div key={label} style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:14,height:14,borderRadius:3,background:bg,border:"1px solid rgba(0,0,0,0.1)"}}/>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#555"}}>{label}</span>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"26px repeat("+(COLS.length)+",1fr)",gap:4,marginBottom:8}}>
            <div/>{COLS.map(c=><div key={c} style={{textAlign:"center",fontFamily:"'Space Mono',monospace",fontSize:10,color:"#777",fontWeight:700}}>{c}</div>)}
          </div>
          {ROWS.map(row=>(
            <div key={row} style={{display:"grid",gridTemplateColumns:"26px repeat("+(COLS.length)+",1fr)",gap:4,marginBottom:4,alignItems:"center"}}>
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"#666",textAlign:"right",paddingRight:3,fontWeight:600}}>{row}</div>
              {COLS.map(col=>{const s=row+col;return(
                <div key={s} onClick={()=>toggle(s)} style={{height:30,borderRadius:6,background:clr(s),border:"1px solid "+(taken.has(s)?"#bbb":sel.includes(s)?"rgba(201,168,76,0.6)":"rgba(201,168,76,0.2)"),cursor:taken.has(s)?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontFamily:"'Space Mono',monospace",color:sel.includes(s)?"#1a1410":"#888",fontWeight:700,transition:"all 0.1s"}}>
                  {taken.has(s)?"✕":sel.includes(s)?s:""}
                </div>
              );})}
            </div>
          ))}
        </div>
        <div style={{padding:"14px 22px",borderTop:"1px solid rgba(201,168,76,0.15)",display:"flex",gap:10,alignItems:"center"}}>
          <div style={{flex:1,fontFamily:"'DM Sans',sans-serif",fontSize:13,color:sel.length>0?"#1a1410":"#888"}}>{sel.length>0?"Selected: "+sel.join(", "):"Tap a seat to select"}</div>
          <button onClick={onCancel} style={{padding:"10px 18px",borderRadius:10,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",background:"transparent",color:"#666",border:"1.5px solid rgba(0,0,0,0.15)",cursor:"pointer"}}>Back</button>
          <button onClick={()=>sel.length===passengers&&onConfirm(sel)} disabled={sel.length!==passengers}
            style={{padding:"10px 22px",borderRadius:10,fontSize:13,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.06em",color:"#1a1410",border:"none",cursor:sel.length===passengers?"pointer":"not-allowed",background:sel.length===passengers?GRAD:"#e5e0d8",backgroundSize:"200% 200%",animation:sel.length===passengers?"gradShift 3s ease infinite":"none",boxShadow:sel.length===passengers?"0 4px 14px rgba(201,168,76,0.44)":"none",opacity:sel.length===passengers?1:0.6}}>
            Confirm →
          </button>
        </div>
      </div>
    </div>
  );
}

function PassengerModal({item,passengers,type,onConfirm,onCancel}){
  const[name,setName]=useState("");const[err,setErr]=useState("");
  const go=()=>{if(!name.trim()||name.trim().length<2){setErr("Please enter your name");return;}onConfirm(name.trim());};
  const isBus=type==="bus";
  return(
    <div onClick={onCancel} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:420,background:"rgba(250,248,244,0.98)",borderRadius:24,padding:"40px 36px",boxShadow:"0 24px 80px rgba(0,0,0,0.15)",border:"1px solid rgba(201,168,76,0.2)"}}>
        <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:24,color:"#1a1410",marginBottom:8}}>Passenger Details</h2>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"#666",marginBottom:24}}>
          {isBus?item.op+" · "+item.from+" → "+item.to+" · "+item.type:item.airline+" · "+item.from_city+" → "+item.to_city} · {passengers} pax
        </p>
        <label style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,color:"#666",display:"block",marginBottom:8,letterSpacing:"0.1em"}}>FULL NAME (as on ID)</label>
        <input autoFocus value={name} onChange={e=>{setName(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&go()}
          placeholder="e.g. John Cena"
          style={{width:"100%",padding:"13px 16px",borderRadius:13,fontSize:15,fontFamily:"'DM Sans',sans-serif",border:"1.5px solid "+(err?"#ef4444":"rgba(201,168,76,0.3)"),outline:"none",color:"#1a1410",background:"#fafaf8",marginBottom:err?8:24}}
          onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor=err?"#ef4444":"rgba(201,168,76,0.3)"}/>
        {err&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#ef4444",marginBottom:16}}>{err}</div>}
        <div style={{display:"flex",gap:12}}>
          <button onClick={onCancel} style={{padding:"13px 22px",borderRadius:13,fontSize:14,fontWeight:600,fontFamily:"'DM Sans',sans-serif",background:"transparent",color:"#666",border:"1.5px solid rgba(0,0,0,0.15)",cursor:"pointer"}}>Cancel</button>
          <button onClick={go} style={{flex:1,padding:"13px",borderRadius:13,fontSize:14,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.06em",color:"#1a1410",border:"none",cursor:"pointer",background:GRAD,backgroundSize:"200% 200%",animation:"gradShift 3s ease infinite",boxShadow:"0 6px 22px rgba(201,168,76,0.44)"}}>Select Seats →</button>
        </div>
      </div>
    </div>
  );
}

function PaymentModal({item,passengerName,passengers,cabinClass,seats,type,onSuccess,onCancel,token}){
  const[step,setStep]=useState("payment");const[payMethod,setPayMethod]=useState("card");
  const[cardNo,setCardNo]=useState("");const[expiry,setExpiry]=useState("");const[cvv,setCvv]=useState("");
  const[promoCode,setPromoCode]=useState("");const[promoMsg,setPromoMsg]=useState({type:"",text:""});
  const[discount,setDiscount]=useState(0);const[promoChecking,setPromoChecking]=useState(false);
  const[bookingId]=useState("ALV"+Date.now().toString(36).toUpperCase().slice(-6));
  const base=item.price*passengers;const total=Math.max(0,base-discount);
  const fmtCard=v=>v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const fmtExp=v=>{const d=v.replace(/\D/g,"").slice(0,4);return d.length>=3?d.slice(0,2)+"/"+d.slice(2):d;};
  const isBus=type==="bus";
  const applyPromo=async()=>{
    if(!promoCode.trim())return;setPromoChecking(true);setPromoMsg({type:"",text:""});
    try{const res=await fetch(API+"/promo/validate",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({code:promoCode,bookingAmount:base,travelType:type})});const data=await res.json();if(!res.ok){setPromoMsg({type:"error",text:data.message});setDiscount(0);}else{setDiscount(data.discount);setPromoMsg({type:"success",text:"Applied! ₹"+data.discount+" off"});}}catch{setPromoMsg({type:"error",text:"Could not validate"});}
    setPromoChecking(false);
  };
  const handlePay=async()=>{
    if(payMethod==="card"&&(!cardNo||!expiry||!cvv)){alert("Please fill all card details");return;}
    setStep("processing");
    try{if(!isBus){await fetch(API+"/book",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({flight_id:item.id,passenger_name:passengerName,cabin_class:cabinClass,seats,promo_code:promoCode||null,discount_applied:discount,final_price:total})});}}catch(e){console.error(e);}
    setTimeout(()=>setStep("success"),1800);
  };
  const ov={position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(10px)",padding:20};
  const crd={width:"100%",maxWidth:460,background:"rgba(250,248,244,0.98)",borderRadius:24,overflow:"hidden",boxShadow:"0 32px 100px rgba(0,0,0,0.15)",border:"1px solid rgba(201,168,76,0.2)",maxHeight:"92vh",overflowY:"auto"};
  const hdr={background:GRAD,backgroundSize:"200% 200%",animation:"gradShift 4s ease infinite",padding:"18px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"};
  if(step==="processing")return(<div style={ov}><div style={crd}><div style={hdr}><div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,color:"#1a1410",fontSize:17}}>Alvryn Pay</div></div><div style={{padding:"60px 24px",textAlign:"center"}}><div style={{width:52,height:52,border:"3px solid rgba(201,168,76,0.2)",borderTopColor:GOLD,borderRadius:"50%",animation:"spinSlow 1s linear infinite",margin:"0 auto 20px"}}/><div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,color:GOLD_DARK,fontSize:16}}>Processing…</div></div></div></div>);
  if(step==="success")return(<div style={ov}><div style={crd}><div style={hdr}><div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,color:"#1a1410",fontSize:17}}>Alvryn Pay</div></div><div style={{padding:"40px 28px",textAlign:"center"}}><div style={{fontSize:56,marginBottom:16}}>🎉</div><h3 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:26,color:"#1a1410",marginBottom:10}}>Booking Confirmed!</h3><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"#555",lineHeight:1.75,marginBottom:20}}>{isBus?item.op+" · "+item.from+" → "+item.to:item.airline+" · "+item.from_city+" → "+item.to_city}<br/>Passenger: <strong>{passengerName}</strong>{seats&&seats.length>0&&<><br/><span style={{color:GOLD_DARK}}>Seats: {seats.join(", ")}</span></>}</div><div style={{background:"rgba(201,168,76,0.08)",borderRadius:14,padding:"16px",marginBottom:16,border:"1px solid rgba(201,168,76,0.25)"}}><div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"#777",marginBottom:6,letterSpacing:"0.12em"}}>BOOKING ID</div><div style={{fontFamily:"'Space Mono',monospace",fontWeight:700,fontSize:22,color:GOLD_DARK,letterSpacing:"0.15em"}}>{bookingId}</div></div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#777",marginBottom:22}}>Confirmation sent to your email 📧</div><button onClick={()=>onSuccess(bookingId)} style={{width:"100%",padding:"14px",borderRadius:13,fontSize:15,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.08em",color:"#1a1410",background:GRAD,backgroundSize:"200% 200%",animation:"gradShift 3s ease infinite",border:"none",cursor:"pointer",boxShadow:"0 6px 24px rgba(201,168,76,0.44)"}}>View My Bookings</button></div></div></div>);
  return(
    <div style={ov} onClick={onCancel}><div style={crd} onClick={e=>e.stopPropagation()}>
      <div style={hdr}><div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,color:"#1a1410",fontSize:17}}>Alvryn Pay</div><div style={{fontSize:12,color:"rgba(26,20,16,0.75)"}}>256-bit SSL</div></div>
      <div style={{padding:"24px"}}>
        <div style={{textAlign:"center",padding:"16px",borderRadius:14,background:"rgba(201,168,76,0.06)",border:"1px solid rgba(201,168,76,0.15)",marginBottom:20}}>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"#777",marginBottom:4,letterSpacing:"0.12em"}}>TOTAL</div>
          {discount>0&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#aaa",textDecoration:"line-through"}}>₹{base.toLocaleString()}</div>}
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:34,color:GOLD_DARK}}>₹{total.toLocaleString()}</div>
          {discount>0&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#16a34a",fontWeight:600}}>You save ₹{discount.toLocaleString()} 🎉</div>}
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#666",marginTop:4}}>{passengers} pax{seats&&seats.length>0?" · Seats: "+seats.join(", "):""}</div>
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,color:"#666",marginBottom:7,letterSpacing:"0.08em"}}>PROMO CODE</div>
          <div style={{display:"flex",gap:8}}>
            <input value={promoCode} onChange={e=>{setPromoCode(e.target.value.toUpperCase());setPromoMsg({type:"",text:""});setDiscount(0);}} placeholder="e.g. ALVRYN100"
              style={{flex:1,padding:"11px 14px",borderRadius:11,fontSize:14,fontFamily:"'DM Sans',sans-serif",border:"1.5px solid rgba(201,168,76,0.25)",outline:"none",color:"#1a1410",background:"#fafaf8"}}
              onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor="rgba(201,168,76,0.25)"}/>
            <button onClick={applyPromo} disabled={promoChecking} style={{padding:"11px 18px",borderRadius:11,fontSize:13,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",color:GOLD_DARK,border:"1.5px solid rgba(201,168,76,0.3)",background:"rgba(201,168,76,0.08)"}}>{promoChecking?"…":"Apply"}</button>
          </div>
          {promoMsg.text&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:promoMsg.type==="success"?"#16a34a":"#ef4444",marginTop:6}}>{promoMsg.text}</div>}
        </div>
        <div style={{display:"flex",gap:7,marginBottom:16}}>
          {[["card","💳 Card"],["upi","⚡ UPI"],["netbanking","🏦 Net Banking"]].map(([id,label])=>(
            <button key={id} onClick={()=>setPayMethod(id)} style={{flex:1,padding:"9px 4px",borderRadius:10,fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",border:payMethod===id?"1.5px solid "+GOLD:"1.5px solid rgba(0,0,0,0.12)",background:payMethod===id?"rgba(201,168,76,0.1)":"#fafaf8",color:payMethod===id?GOLD_DARK:"#555"}}>{label}</button>
          ))}
        </div>
        {payMethod==="card"&&<><div style={{marginBottom:12}}><label style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,color:"#666",display:"block",marginBottom:6}}>CARD NUMBER</label><input value={cardNo} onChange={e=>setCardNo(fmtCard(e.target.value))} placeholder="4111 1111 1111 1111" maxLength={19} style={{width:"100%",padding:"12px 14px",borderRadius:11,fontSize:15,fontFamily:"'DM Sans',sans-serif",border:"1.5px solid rgba(201,168,76,0.2)",outline:"none",color:"#1a1410",background:"#fafaf8"}}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}><div><label style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,color:"#666",display:"block",marginBottom:6}}>EXPIRY</label><input value={expiry} onChange={e=>setExpiry(fmtExp(e.target.value))} placeholder="MM/YY" maxLength={5} style={{width:"100%",padding:"12px 14px",borderRadius:11,fontSize:15,fontFamily:"'DM Sans',sans-serif",border:"1.5px solid rgba(201,168,76,0.2)",outline:"none",color:"#1a1410",background:"#fafaf8"}}/></div><div><label style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,color:"#666",display:"block",marginBottom:6}}>CVV</label><input type="password" value={cvv} onChange={e=>setCvv(e.target.value.slice(0,3))} placeholder="···" maxLength={3} style={{width:"100%",padding:"12px 14px",borderRadius:11,fontSize:15,fontFamily:"'DM Sans',sans-serif",border:"1.5px solid rgba(201,168,76,0.2)",outline:"none",color:"#1a1410",background:"#fafaf8"}}/></div></div></>}
        {payMethod==="upi"&&<div style={{marginBottom:12}}><label style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,color:"#666",display:"block",marginBottom:6}}>UPI ID</label><input placeholder="yourname@upi" style={{width:"100%",padding:"12px 14px",borderRadius:11,fontSize:15,fontFamily:"'DM Sans',sans-serif",border:"1.5px solid rgba(201,168,76,0.2)",outline:"none",color:"#1a1410",background:"#fafaf8"}}/></div>}
        {payMethod==="netbanking"&&<div style={{marginBottom:12}}><label style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,color:"#666",display:"block",marginBottom:6}}>SELECT BANK</label><select style={{width:"100%",padding:"12px 14px",borderRadius:11,fontSize:15,fontFamily:"'DM Sans',sans-serif",border:"1.5px solid rgba(201,168,76,0.2)",outline:"none",color:"#1a1410",background:"#fafaf8",cursor:"pointer"}}>{["SBI","HDFC Bank","ICICI Bank","Axis Bank","Kotak Bank","Punjab National Bank"].map(b=><option key={b}>{b}</option>)}</select></div>}
        <button onClick={handlePay} style={{width:"100%",padding:"15px",borderRadius:13,fontSize:16,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.08em",color:"#1a1410",border:"none",cursor:"pointer",background:GRAD,backgroundSize:"200% 200%",animation:"gradShift 3s ease infinite",boxShadow:"0 8px 28px rgba(201,168,76,0.44)",marginTop:4}}>Pay ₹{total.toLocaleString()} →</button>
        <div style={{textAlign:"center",fontSize:12,color:"#888",marginTop:10,fontFamily:"'DM Sans',sans-serif"}}>Demo payment — no real money charged</div>
      </div>
    </div></div>
  );
}

// ─── HOTEL PANEL ──────────────────────────────────────────────────────────────
function HotelPanel() {
  const[city,setCity]=useState("");const[submitted,setSubmitted]=useState(false);
  const POPULAR_CITIES=["Goa","Mumbai","Delhi","Bangalore","Jaipur","Kochi","Udaipur","Manali"];
  return(
    <div style={{background:"rgba(255,255,255,0.88)",backdropFilter:"blur(10px)",borderRadius:"0 0 20px 20px",padding:"32px 26px",boxShadow:"0 4px 20px rgba(0,0,0,0.05)",border:"1px solid rgba(201,168,76,0.15)",borderTop:"none",marginBottom:22,animation:"fadeUp 0.4s both"}}>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:22,color:"#1a1410",marginBottom:6}}>Find Hotels</div>
      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"#666",marginBottom:20}}>Best rates via Booking.com — compare and book instantly.</div>
      <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
        <input value={city} onChange={e=>setCity(e.target.value)} placeholder="Enter city (e.g. Goa, Mumbai)"
          style={{flex:1,padding:"13px 16px",borderRadius:13,fontSize:15,fontFamily:"'DM Sans',sans-serif",border:"1.5px solid rgba(201,168,76,0.3)",outline:"none",color:"#1a1410",background:"#fafaf8",minWidth:200}}
          onFocus={e=>e.target.style.borderColor=GOLD} onBlur={e=>e.target.style.borderColor="rgba(201,168,76,0.3)"}
          onKeyDown={e=>{if(e.key==="Enter"&&city.trim()){window.open(getHotelLink(city.trim()),"_blank");setSubmitted(true);}}}/>
        <button onClick={()=>{if(city.trim()){window.open(getHotelLink(city.trim()),"_blank");setSubmitted(true);}}} style={{padding:"13px 28px",borderRadius:13,fontSize:14,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.06em",color:"#1a1410",border:"none",cursor:"pointer",background:GRAD,backgroundSize:"200% 200%",animation:"gradShift 3s ease infinite",boxShadow:"0 6px 20px rgba(201,168,76,0.4)"}}>Search Hotels 🏨</button>
      </div>
      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#888",marginBottom:12,fontWeight:600}}>POPULAR DESTINATIONS</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
        {POPULAR_CITIES.map(c=>(
          <button key={c} onClick={()=>{window.open(getHotelLink(c),"_blank");}} style={{padding:"7px 16px",borderRadius:100,fontSize:13,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:"rgba(201,168,76,0.1)",border:"1px solid rgba(201,168,76,0.25)",color:GOLD_DARK,fontWeight:500,transition:"all 0.15s"}}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(201,168,76,0.2)"}
            onMouseLeave={e=>e.currentTarget.style.background="rgba(201,168,76,0.1)"}>
            {c}
          </button>
        ))}
      </div>
      {submitted&&<div style={{marginTop:16,padding:"12px 16px",borderRadius:12,background:"rgba(22,163,74,0.08)",border:"1px solid rgba(22,163,74,0.2)",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#16a34a"}}>✅ Opened Booking.com for <strong>{city}</strong> — best prices guaranteed via our partner.</div>}
      <div style={{marginTop:16,fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#bbb"}}>Alvryn may earn a small commission when you book — at no extra cost to you.</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  SEARCH PAGE
// ═══════════════════════════════════════════════════════
function SearchPage(){
  const navigate=useNavigate();
  const[travelType,setTravelType]=useState("flight");
  const[tripType,setTripType]=useState("oneway");
  const[fromCity,setFromCity]=useState(CITIES[0]);
  const[toCity,setToCity]=useState(CITIES[1]);
  const[busFrom,setBusFrom]=useState("Bangalore");
  const[busTo,setBusTo]=useState("Chennai");
  const[date,setDate]=useState("");
  const[returnDate,setReturnDate]=useState("");
  const[passengers,setPassengers]=useState(1);
  const[cabinClass,setCabinClass]=useState("Economy");
  const[busType,setBusType]=useState("Any");
  const[showFromModal,setShowFromModal]=useState(false);
  const[showToModal,setShowToModal]=useState(false);
  const[showBusFromModal,setShowBusFromModal]=useState(false);
  const[showBusToModal,setShowBusToModal]=useState(false);
  const[mode,setMode]=useState("structured");
  // ── FIX: separate AI query per travel type ──
  const[flightAiQuery,setFlightAiQuery]=useState("");
  const[busAiQuery,setBusAiQuery]=useState("");
  const[flights,setFlights]=useState([]);
  const[buses,setBuses]=useState([]);
  const[filtered,setFiltered]=useState([]);
  const[loading,setLoading]=useState(false);
  const[searched,setSearched]=useState(false);
  const[aiError,setAiError]=useState("");
  const[validErr,setValidErr]=useState("");
  const[bookingItem,setBookingItem]=useState(null);
  const[passengerName,setPassengerName]=useState("");
  const[showSeats,setShowSeats]=useState(false);
  const[selectedSeats,setSelectedSeats]=useState([]);
  const[showPayment,setShowPayment]=useState(false);
  const[filterTime,setFilterTime]=useState("any");
  const[filterMaxPrice,setFilterMaxPrice]=useState(20000);
  const[sortBy,setSortBy]=useState("price");
  const[navScrolled,setNavScrolled]=useState(false);
  const[specialFare,setSpecialFare]=useState("regular");
  const[lastFlightSearch,setLastFlightSearch]=useState(null);

  const today=new Date().toISOString().split("T")[0];
  let user={};try{user=JSON.parse(localStorage.getItem("user")||"{}");}catch{}
  const token=localStorage.getItem("token");

  useEffect(()=>{if(!token)navigate("/login");},[token,navigate]);
  useEffect(()=>{fetch(API+"/test").catch(()=>{});const t=setInterval(()=>fetch(API+"/test").catch(()=>{}),14*60*1000);return()=>clearInterval(t);},[]);
  useEffect(()=>{const fn=()=>setNavScrolled(window.scrollY>30);window.addEventListener("scroll",fn,{passive:true});return()=>window.removeEventListener("scroll",fn);},[]);

  useEffect(()=>{
    const items=travelType==="bus"?buses:flights;let r=[...items];
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

  // ── FIX: switching tabs clears results and resets AI query display ──
  const switchTab=(newType)=>{
    setTravelType(newType);
    setFlights([]);setBuses([]);setSearched(false);setValidErr("");setAiError("");
    // Don't clear AI queries — just keep them per-tab
  };

  const searchFlights=async()=>{
    setValidErr("");if(!date){setValidErr("Please select a departure date");return;}
    setLoading(true);setSearched(true);setFlights([]);
    try{
      const params=new URLSearchParams({from:fromCity.name,to:toCity.name});
      params.append("date",date);
      const res=await axios.get(API+"/flights?"+params);
      const data=res.data||[];
      setFlights(data);
      setLastFlightSearch({from:fromCity.name,to:toCity.name,date,passengers});
      setFilterMaxPrice(data.length>0?Math.max(...data.map(f=>f.price))+1000:20000);
    }catch(e){console.error(e);setFlights([]);}
    setLoading(false);
  };

  const searchBuses=()=>{
    setValidErr("");if(!date){setValidErr("Please select a travel date");return;}
    setLoading(true);setSearched(true);setBuses([]);
    setTimeout(()=>{
      // ── FIX: ensure from/to match correctly (Bangalore→Chennai, not reverse) ──
      let results=BUS_ROUTES.filter(b=>
        b.from.toLowerCase()===busFrom.toLowerCase()&&
        b.to.toLowerCase()===busTo.toLowerCase()
      );
      if(busType!=="Any")results=results.filter(b=>b.type===busType);
      setBuses(results);
      setFilterMaxPrice(results.length>0?Math.max(...results.map(b=>b.price))+500:5000);
      setLoading(false);
    },700);
  };

  const searchAI=async()=>{
    const aiQuery=travelType==="bus"?busAiQuery:flightAiQuery;
    if(!aiQuery.trim())return;
    setAiError("");setLoading(true);setSearched(true);setFlights([]);setBuses([]);

    const q=aiQuery.toLowerCase();
    const busKw=/\b(bus|buses|coach|volvo|sleeper|seater|ksrtc|msrtc|tsrtc|rsrtc)\b/i;
    const flightKw=/\b(flight|flights|fly|plane|airways|airlines|air india|indigo|spicejet)\b/i;

    let isBusSearch=travelType==="bus";
    if(busKw.test(q))isBusSearch=true;
    else if(flightKw.test(q))isBusSearch=false;

    const parsed=parseQuery(aiQuery);
    if(parsed.pastDate){setAiError("That date is in the past! Please search for today or a future date.");setLoading(false);return;}
    if(!parsed.from||!parsed.to){setAiError("Couldn't find the cities. Try: 'bus bangalore to chennai kal' or 'flight blr to del tomorrow'");setLoading(false);return;}

    if(isBusSearch){
      setTravelType("bus");
      // ── FIX: use parsed.from as FROM, parsed.to as TO — never reversed ──
      let results=BUS_ROUTES.filter(b=>
        b.from.toLowerCase()===parsed.from.toLowerCase()&&
        b.to.toLowerCase()===parsed.to.toLowerCase()
      );
      if(busType!=="Any")results=results.filter(b=>b.type===busType);
      if(parsed.budget)results=results.filter(b=>b.price<=parsed.budget);
      if(/cheap|sasta|budget|lowest/i.test(q))results.sort((a,b)=>a.price-b.price);
      if(/morning|subah/i.test(q))results=results.filter(b=>{const h=parseInt(b.dep.split(":")[0]);return h>=5&&h<12;});
      if(/night|raat|evening/i.test(q))results=results.filter(b=>{const h=parseInt(b.dep.split(":")[0]);return h>=18||h<5;});
      setBuses(results);
      setFilterMaxPrice(results.length>0?Math.max(...results.map(b=>b.price))+500:5000);
      if(results.length===0)setAiError("No buses found from "+parsed.from+" to "+parsed.to+". Try different cities or check spelling.");
      setLoading(false);
    }else{
      setTravelType("flight");
      try{
        const res=await axios.post(API+"/ai-search",{query:aiQuery});
        if(res.data&&res.data.message){setAiError(res.data.message);setFlights([]);}
        else{
          const data=res.data||[];
          const f2=parsed.budget?data.filter(f=>f.price<=parsed.budget):data;
          setFlights(f2.length>0?f2:data);
          setLastFlightSearch({from:parsed.from,to:parsed.to,date:parsed.date?.toISOString().split("T")[0]||"",passengers});
          setFilterMaxPrice(data.length>0?Math.max(...data.map(f=>f.price))+1000:20000);
        }
      }catch(e){setAiError(e.response?.data?.message||"Search failed. Please try again.");setFlights([]);}
      setLoading(false);
    }
  };

  const handleBookClick=item=>{if(!token){navigate("/login");return;}setBookingItem(item);setShowSeats(false);setShowPayment(false);setSelectedSeats([]);};
  const handlePassengerConfirm=name=>{setPassengerName(name);setShowSeats(true);};
  const isDomestic=fromCity.country==="India"&&toCity.country==="India";

  const TRAVEL_TABS=[
    {id:"flight",icon:"✈️",label:"Flights"},
    {id:"bus",   icon:"🚌",label:"Buses"},
    {id:"hotel", icon:"🏨",label:"Hotels"},
    {id:"train", icon:"🚂",label:"Trains",  cs:true},
    {id:"cab",   icon:"🚗",label:"Cabs",    cs:true},
  ];
  const CS_DATA={
    train:{icon:"🚂",title:"Train Booking",desc:"IRCTC integration coming soon."},
    cab:  {icon:"🚗",title:"Cab Booking",  desc:"Airport transfers and intercity cabs — coming soon."},
  };
  const SPECIAL_FARES=[{id:"regular",label:"Regular"},{id:"student",label:"Student"},{id:"senior",label:"Senior Citizen"},{id:"armed",label:"Armed Forces"},{id:"doctor",label:"Doctor / Nurse"}];

  const lbl={fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:700,color:"#5a4a3a",display:"block",marginBottom:6,letterSpacing:"0.1em"};
  const subText={fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#5a4a3a"};
  const inp={background:"#fafaf8",borderRadius:12,padding:"12px 14px",border:"1.5px solid rgba(201,168,76,0.2)",transition:"border-color 0.2s"};

  return(
    <div style={{minHeight:"100vh",background:"#faf8f4",position:"relative",overflowX:"hidden",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{SHARED_CSS}</style>
      <AuroraBackground/>

      {showFromModal&&<CityModal title="Select departure city" onSelect={c=>{setFromCity(c);setShowFromModal(false);}} onClose={()=>setShowFromModal(false)} exclude={toCity.code}/>}
      {showToModal&&<CityModal title="Select destination city" onSelect={c=>{setToCity(c);setShowToModal(false);}} onClose={()=>setShowToModal(false)} exclude={fromCity.code}/>}
      {showBusFromModal&&<BusCityModal title="Bus departure city" onSelect={c=>{setBusFrom(c);setShowBusFromModal(false);}} onClose={()=>setShowBusFromModal(false)} exclude={busTo}/>}
      {showBusToModal&&<BusCityModal title="Bus destination city" onSelect={c=>{setBusTo(c);setShowBusToModal(false);}} onClose={()=>setShowBusToModal(false)} exclude={busFrom}/>}
      {bookingItem&&!showSeats&&!showPayment&&<PassengerModal item={bookingItem} passengers={passengers} type={travelType} onConfirm={handlePassengerConfirm} onCancel={()=>setBookingItem(null)}/>}
      {bookingItem&&showSeats&&!showPayment&&<SeatModal type={travelType} passengers={passengers} onConfirm={s=>{setSelectedSeats(s);setShowSeats(false);setShowPayment(true);}} onCancel={()=>{setShowSeats(false);setBookingItem(null);}}/>}
      {bookingItem&&showPayment&&<PaymentModal item={bookingItem} passengerName={passengerName} passengers={passengers} cabinClass={cabinClass} seats={selectedSeats} type={travelType} token={token} onSuccess={()=>{setShowPayment(false);setBookingItem(null);navigate("/bookings");}} onCancel={()=>{setShowPayment(false);setBookingItem(null);}}/>}

      {/* NAV */}
      <nav style={{position:"sticky",top:0,zIndex:200,height:66,padding:"0 5%",display:"flex",alignItems:"center",justifyContent:"space-between",background:navScrolled?"rgba(250,248,244,0.95)":"rgba(250,248,244,0.82)",backdropFilter:"blur(22px)",borderBottom:"1px solid rgba(201,168,76,0.12)",transition:"all 0.3s"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>navigate("/")}>
          <div style={{animation:"floatUD 4s ease-in-out infinite"}}><AlvrynIcon size={38}/></div>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:16,color:"#1a1410",letterSpacing:"0.12em",lineHeight:1.1}}>ALVRYN</div>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:7,color:GOLD,letterSpacing:"0.18em"}}>TRAVEL BEYOND</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button onClick={()=>navigate("/bookings")} style={{padding:"8px 16px",borderRadius:10,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:"transparent",color:"#3a2a1a",border:"1.5px solid rgba(0,0,0,0.15)"}}>My Bookings</button>
          <button onClick={()=>navigate("/profile")} style={{padding:"8px 16px",borderRadius:10,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:"rgba(201,168,76,0.12)",color:GOLD_DARK,border:"1.5px solid rgba(201,168,76,0.3)"}}>Profile</button>
          <button onClick={()=>{localStorage.removeItem("token");localStorage.removeItem("user");navigate("/login");}} style={{padding:"8px 16px",borderRadius:10,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:"#fff0f0",color:"#cc2222",border:"1.5px solid rgba(200,34,34,0.25)"}}>Sign Out</button>
        </div>
      </nav>

      <div style={{position:"relative",zIndex:1,maxWidth:960,margin:"0 auto",padding:"32px 5% 80px"}}>
        <div style={{marginBottom:24,animation:"fadeUp 0.6s both"}}>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:GOLD_DARK,letterSpacing:"0.2em",marginBottom:8}}>SEARCH TRAVEL</div>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:"clamp(22px,4vw,42px)",color:"#1a1410",marginBottom:4}}>Hey {user.name?.split(" ")[0]||"Traveller"} 👋</h1>
          <p style={{fontSize:15,color:"#4a3a2a",fontWeight:500}}>Where do you want to fly, ride or stay today?</p>
        </div>

        {/* Travel type tabs */}
        <div style={{display:"flex",gap:0,background:"rgba(255,255,255,0.88)",backdropFilter:"blur(10px)",borderRadius:"16px 16px 0 0",border:"1px solid rgba(201,168,76,0.18)",borderBottom:"none",overflowX:"auto"}}>
          {TRAVEL_TABS.map((tab,i)=>(
            <button key={tab.id} onClick={()=>switchTab(tab.id)}
              style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"14px 18px",cursor:"pointer",border:"none",borderBottom:travelType===tab.id?"2.5px solid "+GOLD:"2.5px solid transparent",background:"transparent",color:travelType===tab.id?GOLD_DARK:"#666",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,transition:"all 0.2s",whiteSpace:"nowrap",borderRadius:i===0?"16px 0 0 0":i===TRAVEL_TABS.length-1?"0 16px 0 0":"0"}}>
              <span style={{fontSize:20}}>{tab.icon}</span>{tab.label}
              {tab.cs&&<span style={{fontSize:7,background:"rgba(201,168,76,0.15)",border:"1px solid rgba(201,168,76,0.35)",color:GOLD_DARK,padding:"1px 4px",borderRadius:5}}>SOON</span>}
            </button>
          ))}
        </div>

        {/* Hotel panel */}
        {travelType==="hotel"&&<HotelPanel/>}

        {/* Coming soon */}
        {CS_DATA[travelType]&&(
          <div style={{background:"rgba(255,255,255,0.88)",backdropFilter:"blur(10px)",borderRadius:"0 0 20px 20px",padding:"52px 32px",textAlign:"center",boxShadow:"0 4px 20px rgba(0,0,0,0.05)",border:"1px solid rgba(201,168,76,0.15)",borderTop:"none",animation:"fadeUp 0.4s both"}}>
            <div style={{fontSize:56,marginBottom:18}}>{CS_DATA[travelType].icon}</div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:24,color:"#1a1410",marginBottom:10}}>{CS_DATA[travelType].title} — Coming Soon</h2>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,color:"#555",lineHeight:1.7,maxWidth:400,margin:"0 auto"}}>{CS_DATA[travelType].desc}</p>
          </div>
        )}

        {/* Search panel — flights and buses only */}
        {!CS_DATA[travelType]&&travelType!=="hotel"&&(
          <div style={{background:"rgba(255,255,255,0.88)",backdropFilter:"blur(10px)",borderRadius:"0 0 20px 20px",padding:"22px 26px",boxShadow:"0 4px 20px rgba(0,0,0,0.05)",border:"1px solid rgba(201,168,76,0.15)",borderTop:"none",marginBottom:22}}>

            {/* Mode toggle */}
            <div style={{display:"flex",gap:0,background:"rgba(201,168,76,0.08)",borderRadius:10,padding:3,marginBottom:18,width:"fit-content"}}>
              {[["structured","Manual Search"],["ai","🤖 AI Search"]].map(([id,label])=>(
                <button key={id} onClick={()=>{setMode(id);setFlights([]);setBuses([]);setSearched(false);setAiError("");setValidErr("");}}
                  style={{padding:"8px 20px",border:"none",borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,cursor:"pointer",transition:"all 0.2s",background:mode===id?"rgba(255,255,255,0.95)":"transparent",color:mode===id?GOLD_DARK:"#666",boxShadow:mode===id?"0 2px 6px rgba(201,168,76,0.2)":"none"}}>
                  {label}
                </button>
              ))}
            </div>

            {/* FLIGHT STRUCTURED */}
            {travelType==="flight"&&mode==="structured"&&(
              <>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,flexWrap:"wrap",gap:8}}>
                  <div style={{display:"flex",gap:0,background:"rgba(201,168,76,0.08)",borderRadius:10,padding:3}}>
                    {["oneway","roundtrip"].map(t=>(
                      <button key={t} onClick={()=>setTripType(t)} style={{padding:"7px 16px",border:"none",borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,cursor:"pointer",transition:"all 0.2s",background:tripType===t?"rgba(255,255,255,0.95)":"transparent",color:tripType===t?"#1a1410":"#666",boxShadow:tripType===t?"0 2px 6px rgba(0,0,0,0.08)":"none"}}>
                        {t==="oneway"?"One Way":"Round Trip"}
                      </button>
                    ))}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:8,background:"rgba(201,168,76,"+(isDomestic?"0.1":"0.06")+")",border:"1px solid rgba(201,168,76,"+(isDomestic?"0.3":"0.18")+")"}}>
                    <span>{isDomestic?"🇮🇳":"🌍"}</span>
                    <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,color:GOLD_DARK}}>{isDomestic?"Domestic · Seat selection available":"International"}</span>
                  </div>
                </div>
                <div className="search-city-grid" style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:10,alignItems:"center",marginBottom:12}}>
                  {[{label:"FROM",city:fromCity,onClick:()=>setShowFromModal(true)},null,{label:"TO",city:toCity,onClick:()=>setShowToModal(true)}].map((item,i)=>item===null?(
                    <button key="swap" onClick={swapFlight} style={{width:40,height:40,borderRadius:"50%",background:"rgba(201,168,76,0.12)",border:"1.5px solid rgba(201,168,76,0.3)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:18,color:GOLD_DARK,transition:"transform 0.3s",justifySelf:"center"}}
                      onMouseEnter={e=>e.currentTarget.style.transform="rotate(180deg)"} onMouseLeave={e=>e.currentTarget.style.transform="rotate(0)"}>⇄</button>
                  ):(
                    <div key={item.label} onClick={item.onClick} style={{...inp,cursor:"pointer"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=GOLD;e.currentTarget.style.background="rgba(201,168,76,0.06)";}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(201,168,76,0.2)";e.currentTarget.style.background="#fafaf8";}}>
                      <div style={{...lbl,marginBottom:4}}>{item.label}</div>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:28,color:"#1a1410"}}>{item.city.code}</div>
                      <div style={{...subText,marginTop:2}}>{item.city.name}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10,background:"rgba(201,168,76,0.07)",borderRadius:12,padding:"10px 16px",border:"1px solid rgba(201,168,76,0.22)",marginBottom:12,cursor:"pointer"}} onClick={()=>{setMode("ai");setFlights([]);setSearched(false);}}>
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
                  {tripType==="roundtrip"&&<div style={inp}><label style={lbl}>RETURN</label><input type="date" value={returnDate} min={date||today} onChange={e=>setReturnDate(e.target.value)} style={{background:"transparent",border:"none",outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:600,color:"#1a1410",width:"100%",cursor:"pointer"}}/></div>}
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
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:700,color:"#5a4a3a",letterSpacing:"0.08em",marginBottom:8}}>SPECIAL FARES</div>
                  <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                    {SPECIAL_FARES.map(sf=>(
                      <button key={sf.id} onClick={()=>setSpecialFare(sf.id)} style={{padding:"7px 14px",borderRadius:9,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",border:specialFare===sf.id?"1.5px solid "+GOLD:"1.5px solid rgba(0,0,0,0.12)",background:specialFare===sf.id?"rgba(201,168,76,0.12)":"#fafaf8",color:specialFare===sf.id?GOLD_DARK:"#444",transition:"all 0.2s"}}>{sf.label}</button>
                    ))}
                  </div>
                </div>
                {validErr&&<div style={{padding:"10px 14px",borderRadius:10,background:"#FFF0F0",border:"1px solid #FFCDD2",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#cc2222",marginBottom:12,fontWeight:500}}>{validErr}</div>}
                <button onClick={searchFlights} style={{width:"100%",padding:"15px",borderRadius:14,fontSize:15,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.08em",color:"#1a1410",border:"none",cursor:"pointer",background:GRAD,backgroundSize:"200% 200%",animation:"gradShift 4s ease infinite",boxShadow:"0 8px 28px rgba(201,168,76,0.44)",transition:"transform 0.2s"}}
                  onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>Search Flights ✈</button>
              </>
            )}

            {/* BUS STRUCTURED */}
            {travelType==="bus"&&mode==="structured"&&(
              <>
                <div className="search-city-grid" style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:10,alignItems:"center",marginBottom:12}}>
                  {[{label:"FROM",city:busFrom,onClick:()=>setShowBusFromModal(true)},null,{label:"TO",city:busTo,onClick:()=>setShowBusToModal(true)}].map((item,i)=>item===null?(
                    <button key="swap" onClick={swapBus} style={{width:40,height:40,borderRadius:"50%",background:"rgba(201,168,76,0.12)",border:"1.5px solid rgba(201,168,76,0.3)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:18,color:GOLD_DARK,transition:"transform 0.3s",justifySelf:"center"}}
                      onMouseEnter={e=>e.currentTarget.style.transform="rotate(180deg)"} onMouseLeave={e=>e.currentTarget.style.transform="rotate(0)"}>⇄</button>
                  ):(
                    <div key={item.label} onClick={item.onClick} style={{...inp,cursor:"pointer"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=GOLD;e.currentTarget.style.background="rgba(201,168,76,0.06)";}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(201,168,76,0.2)";e.currentTarget.style.background="#fafaf8";}}>
                      <div style={{...lbl,marginBottom:4}}>{item.label}</div>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:20,color:"#1a1410"}}>🚌 {item.city}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10,background:"rgba(201,168,76,0.07)",borderRadius:12,padding:"10px 16px",border:"1px solid rgba(201,168,76,0.22)",marginBottom:12,cursor:"pointer"}} onClick={()=>{setMode("ai");setBuses([]);setSearched(false);}}>
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
                <button onClick={searchBuses} style={{width:"100%",padding:"15px",borderRadius:14,fontSize:15,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.08em",color:"#1a1410",border:"none",cursor:"pointer",background:GRAD,backgroundSize:"200% 200%",animation:"gradShift 4s ease infinite",boxShadow:"0 8px 28px rgba(201,168,76,0.44)",transition:"transform 0.2s"}}
                  onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>Search Buses 🚌</button>
              </>
            )}

            {/* AI MODE */}
            {mode==="ai"&&(
              <div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#4a3a2a",marginBottom:12,lineHeight:1.6,fontWeight:500}}>
                  Type in any language — English, Hindi, Tamil, Telugu, Kannada. Typos are fine:
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:12}}>
                  {travelType==="bus"?[
                    "bus frm bangaluru to chennai",
                    "bus blr to hyd kal raat",
                    "bus bangalore to goa tomorrow",
                    "bus mumbai to pune subah",
                    "bus delhi to jaipur kal sasta",
                  ]:[
                    "flights frm bangaluru to mumbai",
                    "blr to del friday sasta flight",
                    "flight bangalore to dubai tomorrow",
                    "mumbai to delhi kal subah",
                    "goa flights this weekend under 4000",
                  ].map(ex=>(
                    <button key={ex} onClick={()=>{travelType==="bus"?setBusAiQuery(ex):setFlightAiQuery(ex);}} style={{padding:"6px 13px",borderRadius:100,fontSize:12,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:"rgba(201,168,76,0.1)",border:"1px solid rgba(201,168,76,0.25)",color:GOLD_DARK,fontWeight:500}}>{ex}</button>
                  ))}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:12,background:"#fafaf8",borderRadius:14,padding:"4px 4px 4px 18px",border:"1.5px solid rgba(201,168,76,0.3)",marginBottom:8}}>
                  <span style={{fontSize:18,opacity:0.7}}>🤖</span>
                  <input
                    value={travelType==="bus"?busAiQuery:flightAiQuery}
                    onChange={e=>travelType==="bus"?setBusAiQuery(e.target.value):setFlightAiQuery(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&searchAI()}
                    placeholder={travelType==="bus"?'Try: "bus frm bangaluru to chennai kal"':'Try: "flights frm bangaluru to mumbai kal"'}
                    style={{flex:1,background:"transparent",border:"none",outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:15,color:"#1a1410",padding:"12px 0"}}/>
                </div>
                {aiError&&<div style={{padding:"10px 14px",borderRadius:10,background:"#FFF0F0",border:"1px solid #FFCDD2",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#cc2222",marginBottom:8,fontWeight:500}}>{aiError}</div>}
                <button onClick={searchAI} style={{width:"100%",padding:"15px",borderRadius:14,fontSize:15,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.08em",color:"#1a1410",border:"none",cursor:"pointer",background:GRAD,backgroundSize:"200% 200%",animation:"gradShift 4s ease infinite",boxShadow:"0 8px 28px rgba(201,168,76,0.44)",transition:"transform 0.2s"}}
                  onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>{travelType==="bus"?"Search Buses with AI 🚌":"Search Flights with AI ✈️"}</button>
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {loading&&<div style={{textAlign:"center",padding:"60px 0",animation:"fadeUp 0.4s both"}}><div style={{width:44,height:44,border:"3px solid rgba(201,168,76,0.2)",borderTopColor:GOLD,borderRadius:"50%",animation:"spinSlow 1s linear infinite",margin:"0 auto 16px"}}/><div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:16,color:GOLD_DARK}}>{travelType==="bus"?"Scanning bus routes…":"Scanning flight paths…"}</div></div>}

        {/* Filters */}
        {!loading&&filtered.length>0&&(
          <div style={{background:"rgba(255,255,255,0.88)",backdropFilter:"blur(10px)",borderRadius:16,padding:"18px 20px",boxShadow:"0 4px 16px rgba(0,0,0,0.05)",border:"1px solid rgba(201,168,76,0.15)",marginBottom:18,animation:"fadeUp 0.4s both"}}>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"#7a6a5a",letterSpacing:"0.15em",marginBottom:12,fontWeight:700}}>FILTER &amp; SORT</div>
            <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:10}}>
              {travelType==="flight"&&[["any","All times"],["morning","Morning"],["afternoon","Afternoon"],["evening","Evening"]].map(([v,l])=>(
                <button key={v} onClick={()=>setFilterTime(v)} style={{padding:"6px 14px",borderRadius:100,fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",border:filterTime===v?"1.5px solid "+GOLD:"1.5px solid rgba(0,0,0,0.15)",background:filterTime===v?"rgba(201,168,76,0.12)":"#fafaf8",color:filterTime===v?GOLD_DARK:"#444"}}>{l}</button>
              ))}
              {[["price","Cheapest"],["price-desc","Priciest"],["departure","Earliest"]].map(([v,l])=>(
                <button key={v} onClick={()=>setSortBy(v)} style={{padding:"6px 14px",borderRadius:100,fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",border:sortBy===v?"1.5px solid "+GOLD:"1.5px solid rgba(0,0,0,0.15)",background:sortBy===v?"rgba(201,168,76,0.12)":"#fafaf8",color:sortBy===v?GOLD_DARK:"#444"}}>{l}</button>
              ))}
            </div>
            <input type="range" min="100" max={filterMaxPrice+500} step="100" value={filterMaxPrice} onChange={e=>setFilterMaxPrice(Number(e.target.value))} style={{width:"100%",accentColor:GOLD}}/>
            <div style={{display:"flex",justifyContent:"space-between",fontFamily:"'Space Mono',monospace",fontSize:11,color:"#7a6a5a",marginTop:6,fontWeight:600}}>
              <span>Min</span><span style={{color:GOLD_DARK}}>Max ₹{filterMaxPrice.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Results */}
        {!loading&&searched&&(
          <>
            {/* Bus operator tip */}
            {travelType==="bus"&&filtered.length>0&&(
              <div style={{padding:"12px 16px",borderRadius:12,background:"rgba(201,168,76,0.07)",border:"1px solid rgba(201,168,76,0.2)",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:16}}>💡</span>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#5a4a3a",fontWeight:500}}>Multiple operators serve this route. Compare timing and bus type before booking.</span>
              </div>
            )}

            <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"#7a6a5a",letterSpacing:"0.15em",marginBottom:14,fontWeight:700}}>
              {filtered.length>0?filtered.length+" "+(travelType==="bus"?"BUSES":"FLIGHTS")+" FOUND":"NO RESULTS — TRY A DIFFERENT DATE OR ROUTE"}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>

              {/* FLIGHT CARDS */}
              {travelType==="flight"&&filtered.map((flight,i)=>{
                const labels=getFlightLabels(flight,flights,i);
                const insight=getFlightInsight(flight,flights);
                const minPrice=Math.min(...flights.map(f=>f.price));
                const savings=Math.max(...flights.map(f=>f.price))-flight.price;
                const dateStr=lastFlightSearch?.date?fmtDateStr(lastFlightSearch.date):"";
                const affLink=getAviasalesLink(flight.from_city||fromCity.name,flight.to_city||toCity.name,dateStr,passengers);
                return(
                  <div key={flight.id} style={{background:"rgba(255,255,255,0.88)",backdropFilter:"blur(10px)",borderRadius:18,padding:"20px 22px",boxShadow:"0 4px 16px rgba(0,0,0,0.05)",border:"1px solid rgba(201,168,76,0.12)",animation:"fadeUp 0.4s "+(i*60)+"ms both",transition:"all 0.2s"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(201,168,76,0.38)";e.currentTarget.style.transform="translateY(-2px)";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(201,168,76,0.12)";e.currentTarget.style.transform="translateY(0)";}}>

                    {/* Labels row */}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        {labels.map(l=>(
                          <span key={l.text} style={{padding:"3px 10px",borderRadius:20,fontSize:10,fontFamily:"'Space Mono',monospace",fontWeight:700,color:l.color,background:l.bg}}>{l.text}</span>
                        ))}
                        {savings>500&&flight.price===minPrice&&<span style={{padding:"3px 10px",borderRadius:20,fontSize:10,fontFamily:"'Space Mono',monospace",fontWeight:700,color:"#16a34a",background:"rgba(22,163,74,0.1)"}}>You save ₹{savings.toLocaleString()}</span>}
                      </div>
                      <div style={{display:"flex",gap:7}}>
                        {isDomestic&&<span style={{padding:"3px 9px",borderRadius:20,fontSize:10,background:"rgba(201,168,76,0.12)",border:"1px solid rgba(201,168,76,0.3)",color:GOLD_DARK,fontFamily:"'Space Mono',monospace",fontWeight:600}}>Seats ✓</span>}
                        <span style={{padding:"3px 9px",borderRadius:20,fontSize:10,background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.25)",color:"#047857",fontFamily:"'Space Mono',monospace",fontWeight:600}}>Non-stop</span>
                      </div>
                    </div>

                    {/* Airline row */}
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:GOLD}}/>
                      <span style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:15,color:"#1a1410"}}>{flight.airline}</span>
                      <span style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:"#777"}}>{flight.flight_no}</span>
                    </div>

                    {/* Route */}
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                      <div style={{textAlign:"center"}}>
                        <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:26,color:"#1a1410"}}>{fmtTime(flight.departure_time)}</div>
                        <div style={{fontFamily:"'Space Mono',monospace",fontSize:12,color:"#666",marginTop:2,fontWeight:600}}>{(flight.from_city||fromCity.name).slice(0,3).toUpperCase()}</div>
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
                        <div style={{fontFamily:"'Space Mono',monospace",fontSize:12,color:"#666",marginTop:2,fontWeight:600}}>{(flight.to_city||toCity.name).slice(0,3).toUpperCase()}</div>
                        <div style={{fontSize:12,color:"#666",fontWeight:500}}>{fmtDate(flight.arrival_time)}</div>
                      </div>
                    </div>

                    {/* AI Insight */}
                    <div style={{padding:"8px 12px",borderRadius:10,background:"rgba(201,168,76,0.06)",border:"1px solid rgba(201,168,76,0.15)",marginBottom:14,fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#6b5d4e",fontStyle:"italic"}}>
                      💡 {insight}
                    </div>

                    {/* Bottom row */}
                    <div className="results-card-bottom" style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:14,borderTop:"1px solid rgba(201,168,76,0.12)"}}>
                      <div>
                        <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"#777",letterSpacing:"0.1em",fontWeight:600}}>APPROX FROM</div>
                        <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:28,color:GOLD_DARK}}>₹{(flight.price*passengers).toLocaleString()}</div>
                        <div style={{fontSize:13,color:"#555",fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>{passengers} pax · {cabinClass}</div>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
                        <button onClick={()=>handleBookClick(flight)} style={{padding:"12px 26px",borderRadius:12,fontSize:14,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.06em",color:"#1a1410",border:"none",cursor:"pointer",background:GRAD,backgroundSize:"200% 200%",animation:"gradShift 3s ease infinite",boxShadow:"0 4px 14px rgba(201,168,76,0.44)",transition:"transform 0.2s"}}
                          onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>Book Now →</button>
                        <a href={affLink} target="_blank" rel="noopener noreferrer" style={{padding:"8px 20px",borderRadius:10,fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif",color:GOLD_DARK,border:"1.5px solid rgba(201,168,76,0.3)",background:"transparent",cursor:"pointer",textDecoration:"none",textAlign:"center",transition:"all 0.2s"}}
                          onMouseEnter={e=>e.currentTarget.style.background="rgba(201,168,76,0.08)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>Check Live Prices →</a>
                        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"#bbb",fontStyle:"italic"}}>Prices may vary slightly based on provider</div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* BUS CARDS */}
              {travelType==="bus"&&filtered.map((bus,i)=>{
                const labels=getBusLabels(bus,buses,i);
                const insight=getBusInsight(bus,buses);
                const minPrice=Math.min(...buses.map(b=>b.price));
                const savings=Math.max(...buses.map(b=>b.price))-bus.price;
                const redLink=getRedbusLink(bus.from,bus.to);
                return(
                  <div key={i} style={{background:"rgba(255,255,255,0.88)",backdropFilter:"blur(10px)",borderRadius:18,padding:"20px 22px",boxShadow:"0 4px 16px rgba(0,0,0,0.05)",border:"1px solid rgba(201,168,76,0.12)",animation:"fadeUp 0.4s "+(i*60)+"ms both",transition:"all 0.2s"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(201,168,76,0.38)";e.currentTarget.style.transform="translateY(-2px)";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(201,168,76,0.12)";e.currentTarget.style.transform="translateY(0)";}}>

                    {/* Labels */}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        {labels.map(l=>(
                          <span key={l.text} style={{padding:"3px 10px",borderRadius:20,fontSize:10,fontFamily:"'Space Mono',monospace",fontWeight:700,color:l.color,background:l.bg}}>{l.text}</span>
                        ))}
                        {savings>200&&bus.price===minPrice&&<span style={{padding:"3px 10px",borderRadius:20,fontSize:10,fontFamily:"'Space Mono',monospace",fontWeight:700,color:"#16a34a",background:"rgba(22,163,74,0.1)"}}>You save ₹{savings.toLocaleString()}</span>}
                      </div>
                      <div style={{display:"flex",gap:7}}>
                        <span style={{padding:"3px 9px",borderRadius:20,fontSize:10,background:"rgba(201,168,76,0.12)",border:"1px solid rgba(201,168,76,0.3)",color:GOLD_DARK,fontFamily:"'Space Mono',monospace",fontWeight:600}}>Seats ✓</span>
                        <span style={{padding:"3px 9px",borderRadius:20,fontSize:10,background:"rgba(0,0,0,0.04)",border:"1px solid rgba(0,0,0,0.12)",color:"#444",fontFamily:"'Space Mono',monospace",fontWeight:600}}>{bus.type}</span>
                      </div>
                    </div>

                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:GOLD}}/>
                      <span style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:15,color:"#1a1410"}}>{bus.op}</span>
                    </div>

                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
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

                    {/* AI Insight */}
                    <div style={{padding:"8px 12px",borderRadius:10,background:"rgba(201,168,76,0.06)",border:"1px solid rgba(201,168,76,0.15)",marginBottom:14,fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#6b5d4e",fontStyle:"italic"}}>
                      💡 {insight}
                    </div>

                    <div className="results-card-bottom" style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:14,borderTop:"1px solid rgba(201,168,76,0.12)"}}>
                      <div>
                        <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"#777",letterSpacing:"0.1em",fontWeight:600}}>APPROX FROM</div>
                        <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:28,color:GOLD_DARK}}>₹{(bus.price*passengers).toLocaleString()}</div>
                        <div style={{fontSize:13,color:"#555",fontFamily:"'DM Sans',sans-serif",fontWeight:500}}>{passengers} pax · {bus.seats} seats available</div>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
                        <button onClick={()=>handleBookClick(bus)} style={{padding:"12px 26px",borderRadius:12,fontSize:14,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.06em",color:"#1a1410",border:"none",cursor:"pointer",background:GRAD,backgroundSize:"200% 200%",animation:"gradShift 3s ease infinite",boxShadow:"0 4px 14px rgba(201,168,76,0.44)",transition:"transform 0.2s"}}
                          onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>Book Now →</button>
                        <a href={redLink} target="_blank" rel="noopener noreferrer" style={{padding:"8px 20px",borderRadius:10,fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif",color:"#cc2200",border:"1.5px solid rgba(204,34,0,0.25)",background:"transparent",cursor:"pointer",textDecoration:"none",textAlign:"center",transition:"all 0.2s"}}
                          onMouseEnter={e=>e.currentTarget.style.background="rgba(204,34,0,0.05)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>View on RedBus →</a>
                        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"#bbb",fontStyle:"italic"}}>More operators available on RedBus</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {!loading&&!searched&&travelType!=="hotel"&&!CS_DATA[travelType]&&(
          <div style={{textAlign:"center",padding:"80px 20px",animation:"fadeUp 0.5s both"}}>
            <div style={{fontSize:64,marginBottom:20,animation:"floatUD 3s ease-in-out infinite"}}>{travelType==="bus"?"🚌":"✈️"}</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:22,color:"#7a6a5a"}}>Your journey starts here</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"#7a6a5a",marginTop:8,fontWeight:500}}>Search above or try AI search in any language</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  APP ROUTER
// ═══════════════════════════════════════════════════════
function App(){
  useEffect(()=>{fetch(API+"/test").catch(()=>{});const t=setInterval(()=>fetch(API+"/test").catch(()=>{}),14*60*1000);return()=>clearInterval(t);},[]);
  return(
    <Router>
      <Routes>
        <Route path="/"         element={<LandingPage/>}/>
        <Route path="/login"    element={<Login/>}/>
        <Route path="/register" element={<Register/>}/>
        <Route path="/search"   element={<SearchPage/>}/>
        <Route path="/bookings" element={<MyBookings/>}/>
        <Route path="/profile"  element={<UserProfile/>}/>
        <Route path="/admin"    element={<AdminDashboard/>}/>
      </Routes>
    </Router>
  );
}

export default App;