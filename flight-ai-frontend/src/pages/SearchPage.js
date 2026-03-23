import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const API = "https://cometai-backend.onrender.com";

const CITIES = [
  { code:"BLR", name:"Bangalore", full:"Kempegowda International", country:"India" },
  { code:"BOM", name:"Mumbai", full:"Chhatrapati Shivaji International", country:"India" },
  { code:"DEL", name:"Delhi", full:"Indira Gandhi International", country:"India" },
  { code:"MAA", name:"Chennai", full:"Chennai International", country:"India" },
  { code:"HYD", name:"Hyderabad", full:"Rajiv Gandhi International", country:"India" },
  { code:"CCU", name:"Kolkata", full:"Netaji Subhas Chandra Bose Intl", country:"India" },
  { code:"GOI", name:"Goa", full:"Dabolim Airport", country:"India" },
  { code:"PNQ", name:"Pune", full:"Pune Airport", country:"India" },
  { code:"COK", name:"Kochi", full:"Cochin International", country:"India" },
  { code:"AMD", name:"Ahmedabad", full:"Sardar Vallabhbhai Patel Intl", country:"India" },
  { code:"JAI", name:"Jaipur", full:"Jaipur International", country:"India" },
  { code:"VNS", name:"Varanasi", full:"Lal Bahadur Shastri Airport", country:"India" },
  { code:"DXB", name:"Dubai", full:"Dubai International", country:"UAE" },
  { code:"SIN", name:"Singapore", full:"Changi Airport", country:"Singapore" },
];
const CLASSES = ["Economy","Premium Economy","Business","First Class"];

// THEMES per scroll section
const THEMES = [
  { bg:"linear-gradient(135deg,#f8f6ff 0%,#f0ebff 30%,#e8f4ff 60%,#f5f8ff 100%)", accent:"#6d28d9", accent2:"#8b5cf6", text:"#1e1033", sub:"#4c1d95", card:"rgba(255,255,255,0.88)", cardBorder:"rgba(109,40,217,0.12)", navBg:"rgba(255,255,255,0.85)" },
  { bg:"linear-gradient(135deg,#f0fdf9 0%,#e0faf4 30%,#ccfbf0 60%,#f0fdf9 100%)", accent:"#059669", accent2:"#10b981", text:"#064e3b", sub:"#065f46", card:"rgba(255,255,255,0.88)", cardBorder:"rgba(5,150,105,0.12)", navBg:"rgba(240,253,249,0.85)" },
  { bg:"linear-gradient(135deg,#fff1f4 0%,#ffe4ea 30%,#ffd6e0 60%,#fff1f4 100%)", accent:"#e11d48", accent2:"#f43f5e", text:"#881337", sub:"#9f1239", card:"rgba(255,255,255,0.88)", cardBorder:"rgba(225,29,72,0.12)", navBg:"rgba(255,241,244,0.85)" },
  { bg:"linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 30%,#bae6fd 60%,#f0f9ff 100%)", accent:"#0284c7", accent2:"#0ea5e9", text:"#0c4a6e", sub:"#075985", card:"rgba(255,255,255,0.88)", cardBorder:"rgba(2,132,199,0.12)", navBg:"rgba(240,249,255,0.85)" },
];

function formatTime(dt){ if(!dt)return"--:--"; return new Date(dt).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false}); }
function formatDate(dt){ if(!dt)return""; return new Date(dt).toLocaleDateString("en-IN",{day:"numeric",month:"short"}); }
function calcDuration(dep,arr){ if(!dep||!arr)return""; const diff=(new Date(arr)-new Date(dep))/60000; const h=Math.floor(diff/60); const m=diff%60; return`${h}h${m>0?" "+m+"m":""}`.trim(); }

export default function SearchPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const today = new Date().toISOString().split("T")[0];
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  // scroll theme
  const [scrollSection, setScrollSection] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY; const h = window.innerHeight;
      if (y < h * 0.5) setScrollSection(0);
      else if (y < h * 1.2) setScrollSection(1);
      else if (y < h * 2) setScrollSection(2);
      else setScrollSection(3);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const theme = THEMES[scrollSection];

  // search state
  const [travelType, setTravelType] = useState("flight");
  const [tripType, setTripType] = useState("oneway");
  const [fromCity, setFromCity] = useState(CITIES[0]);
  const [toCity, setToCity] = useState(CITIES[1]);
  const [date, setDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [cabinClass, setCabinClass] = useState("Economy");
  const [showFromModal, setShowFromModal] = useState(false);
  const [showToModal, setShowToModal] = useState(false);
  const [mode, setMode] = useState("structured");
  const [aiQuery, setAiQuery] = useState("");
  const [flights, setFlights] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [bookingFlight, setBookingFlight] = useState(null);
  const [passengerName, setPassengerName] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [filterTime, setFilterTime] = useState("any");
  const [filterMaxPrice, setFilterMaxPrice] = useState(20000);
  const [sortBy, setSortBy] = useState("price");
  const [citySearch, setCitySearch] = useState("");

  // keep alive
  useEffect(() => {
    fetch(`${API}/test`).catch(()=>{});
    const t = setInterval(()=>fetch(`${API}/test`).catch(()=>{}), 14*60*1000);
    return ()=>clearInterval(t);
  }, []);

  // canvas particles
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d");
    cv.width = window.innerWidth; cv.height = window.innerHeight;
    const particles = Array.from({length:100},()=>({
      x:Math.random()*cv.width, y:Math.random()*cv.height,
      r:Math.random()*2.2+0.3, op:Math.random()*0.35+0.08,
      vx:(Math.random()-.5)*.2, vy:(Math.random()-.5)*.2,
      tw:Math.random()*Math.PI*2, ts:Math.random()*.012+.003,
      hue:Math.floor(Math.random()*60)+190,
    }));
    const draw = () => {
      ctx.clearRect(0,0,cv.width,cv.height);
      particles.forEach(p=>{
        p.tw+=p.ts; p.x+=p.vx; p.y+=p.vy;
        if(p.x<0)p.x=cv.width; if(p.x>cv.width)p.x=0;
        if(p.y<0)p.y=cv.height; if(p.y>cv.height)p.y=0;
        const op=p.op*(0.5+0.5*Math.sin(p.tw));
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=`hsla(${p.hue},75%,60%,${op})`; ctx.fill();
      });
      animRef.current=requestAnimationFrame(draw);
    };
    draw();
    const r=()=>{cv.width=window.innerWidth;cv.height=window.innerHeight;};
    window.addEventListener("resize",r);
    return()=>{cancelAnimationFrame(animRef.current);window.removeEventListener("resize",r);};
  },[]);

  // filters
  useEffect(()=>{
    let result=[...flights];
    if(filterTime==="morning") result=result.filter(f=>{const h=new Date(f.departure_time).getHours();return h>=5&&h<12;});
    else if(filterTime==="afternoon") result=result.filter(f=>{const h=new Date(f.departure_time).getHours();return h>=12&&h<17;});
    else if(filterTime==="evening") result=result.filter(f=>{const h=new Date(f.departure_time).getHours();return h>=17;});
    result=result.filter(f=>f.price<=filterMaxPrice);
    if(sortBy==="price") result.sort((a,b)=>a.price-b.price);
    else if(sortBy==="price-desc") result.sort((a,b)=>b.price-a.price);
    else if(sortBy==="departure") result.sort((a,b)=>new Date(a.departure_time)-new Date(b.departure_time));
    else if(sortBy==="duration") result.sort((a,b)=>(new Date(a.arrival_time)-new Date(a.departure_time))-(new Date(b.arrival_time)-new Date(b.departure_time)));
    setFiltered(result);
  },[flights,filterTime,filterMaxPrice,sortBy]);

  const swapCities=()=>{const t=fromCity;setFromCity(toCity);setToCity(t);};

  const searchFlights=async()=>{
    setLoading(true); setSearched(true);
    try{
      const params=new URLSearchParams({from:fromCity.name,to:toCity.name});
      if(date) params.append("date",date);
      const res=await axios.get(`${API}/real-flights?${params}`);
      setFlights(res.data);
      setFilterMaxPrice(res.data.length>0?Math.max(...res.data.map(f=>f.price))+1000:20000);
    }catch{setFlights([]);}
    setLoading(false);
  };

  const searchAI=async()=>{
    if(!aiQuery.trim())return;
    setLoading(true); setSearched(true);
    try{const res=await axios.post(`${API}/ai-search`,{query:aiQuery});setFlights(res.data);setFilterMaxPrice(res.data.length>0?Math.max(...res.data.map(f=>f.price))+1000:20000);}
    catch{setFlights([]);}
    setLoading(false);
  };

  const handleBook=(flight)=>{
    if(!token){navigate("/login");return;}
    setBookingFlight(flight);
  };

  const handlePaymentSuccess=async()=>{
    try{await axios.post(`${API}/book`,{flight_id:bookingFlight.id,passenger_name:passengerName},{headers:{Authorization:`Bearer ${token}`}});}
    catch(e){console.error(e);}
    setShowPayment(false); setBookingFlight(null);
    navigate("/bookings");
  };

  const filteredCities=(exclude)=>CITIES.filter(c=>c.code!==exclude&&(c.name.toLowerCase().includes(citySearch.toLowerCase())||c.code.toLowerCase().includes(citySearch.toLowerCase())));

  return(
    <div style={{background:theme.bg,minHeight:"100vh",fontFamily:"'DM Sans',sans-serif",position:"relative",transition:"background 1.6s ease",overflowX:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-thumb{border-radius:2px;}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
        @keyframes floatBlob{0%,100%{transform:translate(0,0) scale(1);}50%{transform:translate(2%,-3%) scale(1.05);}}
        @keyframes scanLine{0%{top:-1px;opacity:0;}5%{opacity:.3;}95%{opacity:.3;}100%{top:100%;opacity:0;}}
        .city-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.25);z-index:200;display:flex;align-items:flex-end;backdrop-filter:blur(8px);}
        .city-modal{background:white;border-radius:24px 24px 0 0;padding:24px;width:100%;max-height:75vh;overflow-y:auto;box-shadow:0 -20px 60px rgba(0,0,0,.15);}
        .city-item{display:flex;align-items:center;justify-content:space-between;padding:13px 14px;border-radius:12px;cursor:pointer;transition:background .15s;}
        .city-item:hover{background:rgba(109,40,217,.06);}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.2);z-index:100;display:flex;align-items:flex-end;backdrop-filter:blur(8px);}
        .modal-card{background:white;border-radius:24px 24px 0 0;padding:28px 24px;width:100%;box-shadow:0 -20px 60px rgba(0,0,0,.15);}
        .payment-modal{background:white;border-radius:24px 24px 0 0;padding:0;width:100%;box-shadow:0 -24px 80px rgba(0,0,0,.2);max-height:90vh;overflow-y:auto;}
        @media(min-width:768px){.city-modal{border-radius:20px;max-width:480px;margin:0 auto;max-height:70vh;}.city-modal-overlay{align-items:center;}.modal-overlay{align-items:center;}.modal-card{border-radius:20px;max-width:440px;margin:0 auto;}.payment-modal{border-radius:24px;max-width:460px;margin:0 auto;}}
        @media(max-width:600px){.search-card{padding:16px!important;}.bottom-row{grid-template-columns:1fr!important;}.pax-row{grid-template-columns:1fr 1fr!important;}}
      `}</style>

      <canvas ref={canvasRef} style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",opacity:.5}}/>
      <motion.div animate={{background:`radial-gradient(ellipse at 20% 30%,${theme.accent}15 0%,transparent 55%)`}} transition={{duration:1.8}}
        style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",animation:"floatBlob 12s ease-in-out infinite"}}/>
      <motion.div animate={{backgroundImage:`linear-gradient(${theme.accent}07 1px,transparent 1px),linear-gradient(90deg,${theme.accent}07 1px,transparent 1px)`}} transition={{duration:1.8}}
        style={{position:"fixed",inset:0,backgroundSize:"72px 72px",maskImage:"radial-gradient(ellipse 80% 70% at 50% 50%,black,transparent)",zIndex:0,pointerEvents:"none"}}/>
      <div style={{position:"fixed",left:0,width:"100%",height:1,pointerEvents:"none",zIndex:2,animation:"scanLine 14s linear infinite",background:`linear-gradient(90deg,transparent,${theme.accent}18,transparent)`}}/>

      {/* CITY MODALS */}
      {showFromModal&&(
        <div className="city-modal-overlay" onClick={()=>{setShowFromModal(false);setCitySearch("");}}>
          <div className="city-modal" onClick={e=>e.stopPropagation()}>
            <p style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,color:theme.text,marginBottom:14}}>Select departure city</p>
            <input style={{width:"100%",background:"rgba(0,0,0,.04)",border:`1px solid ${theme.accent}25`,borderRadius:10,padding:"11px 14px",color:theme.text,fontFamily:"'DM Sans',sans-serif",fontSize:14,outline:"none",marginBottom:14}} placeholder="Search city..." value={citySearch} onChange={e=>setCitySearch(e.target.value)} autoFocus/>
            <div>{filteredCities(toCity.code).map(city=>(
              <div key={city.code} className="city-item" onClick={()=>{setFromCity(city);setShowFromModal(false);setCitySearch("");}}>
                <div><div style={{fontSize:14,fontWeight:500,color:theme.text}}>{city.name}</div><div style={{fontSize:11,color:`${theme.sub}66`,marginTop:2}}>{city.full} · {city.country}</div></div>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:15,fontWeight:700,color:theme.accent}}>{city.code}</div>
              </div>
            ))}</div>
          </div>
        </div>
      )}
      {showToModal&&(
        <div className="city-modal-overlay" onClick={()=>{setShowToModal(false);setCitySearch("");}}>
          <div className="city-modal" onClick={e=>e.stopPropagation()}>
            <p style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,color:theme.text,marginBottom:14}}>Select destination city</p>
            <input style={{width:"100%",background:"rgba(0,0,0,.04)",border:`1px solid ${theme.accent}25`,borderRadius:10,padding:"11px 14px",color:theme.text,fontFamily:"'DM Sans',sans-serif",fontSize:14,outline:"none",marginBottom:14}} placeholder="Search city..." value={citySearch} onChange={e=>setCitySearch(e.target.value)} autoFocus/>
            <div>{filteredCities(fromCity.code).map(city=>(
              <div key={city.code} className="city-item" onClick={()=>{setToCity(city);setShowToModal(false);setCitySearch("");}}>
                <div><div style={{fontSize:14,fontWeight:500,color:theme.text}}>{city.name}</div><div style={{fontSize:11,color:`${theme.sub}66`,marginTop:2}}>{city.full} · {city.country}</div></div>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:15,fontWeight:700,color:theme.accent}}>{city.code}</div>
              </div>
            ))}</div>
          </div>
        </div>
      )}

      {/* PASSENGER MODAL */}
      {bookingFlight&&!showPayment&&(
        <div className="modal-overlay" onClick={()=>setBookingFlight(null)}>
          <div className="modal-card" onClick={e=>e.stopPropagation()}>
            <p style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:700,color:theme.text,marginBottom:6}}>Passenger Details</p>
            <p style={{fontSize:13,color:`${theme.sub}88`,marginBottom:20}}>{bookingFlight.airline} · {bookingFlight.from_city} → {bookingFlight.to_city}</p>
            <label style={{fontSize:11,color:`${theme.sub}77`,letterSpacing:"1.5px",textTransform:"uppercase",display:"block",marginBottom:8,fontFamily:"'Space Mono',monospace"}}>Full Name</label>
            <input style={{width:"100%",background:"rgba(0,0,0,.03)",border:`1px solid ${theme.accent}25`,borderRadius:12,padding:"13px 16px",color:theme.text,fontFamily:"'DM Sans',sans-serif",fontSize:15,outline:"none",marginBottom:20}} type="text" placeholder="Enter your full name" value={passengerName} onChange={e=>setPassengerName(e.target.value)} onKeyPress={e=>{if(e.key==="Enter"&&passengerName.trim())setShowPayment(true);}} autoFocus/>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setBookingFlight(null)} style={{flex:"0 0 auto",padding:"13px 20px",background:"transparent",border:`1px solid ${theme.accent}25`,borderRadius:12,color:`${theme.sub}88`,fontFamily:"'DM Sans',sans-serif",fontSize:14,cursor:"pointer"}}>Cancel</button>
              <button onClick={()=>{if(passengerName.trim())setShowPayment(true);}} style={{flex:1,padding:"13px",background:`linear-gradient(135deg,${theme.accent},${theme.accent2})`,border:"none",borderRadius:12,color:"white",fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:600,cursor:"pointer",boxShadow:`0 8px 20px ${theme.accent}35`}}>Continue to Payment →</button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {bookingFlight&&showPayment&&(
        <PaymentModal flight={bookingFlight} passengerName={passengerName} passengers={passengers} cabinClass={cabinClass} theme={theme} onSuccess={handlePaymentSuccess} onCancel={()=>{setShowPayment(false);setBookingFlight(null);}}/>
      )}

      {/* NAV */}
      <motion.nav animate={{background:theme.navBg,borderBottomColor:`${theme.accent}15`}} transition={{duration:1.6}}
        style={{position:"sticky",top:0,zIndex:50,backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderBottom:"1px solid",boxShadow:`0 1px 20px ${theme.accent}10`}}>
        <div style={{maxWidth:1100,margin:"0 auto",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>navigate("/")}>
            <motion.div animate={{background:`linear-gradient(135deg,${theme.accent},${theme.accent2})`,boxShadow:`0 4px 14px ${theme.accent}40`}} transition={{duration:1.6}}
              style={{width:34,height:34,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"white",flexShrink:0}}>☄</motion.div>
            <motion.span animate={{color:theme.text}} transition={{duration:1.6}} style={{fontFamily:"'Syne',sans-serif",fontSize:17,fontWeight:800,letterSpacing:".5px"}}>COMETAI</motion.span>
          </div>
          <div style={{display:"flex",gap:10}}>
            <motion.button onClick={()=>navigate("/bookings")} animate={{borderColor:`${theme.accent}35`,color:theme.sub}} transition={{duration:1.6}}
              style={{background:"transparent",border:"1px solid",padding:"7px 16px",borderRadius:10,fontFamily:"'DM Sans',sans-serif",fontSize:13,cursor:"pointer"}}>My Bookings</motion.button>
            <motion.button onClick={()=>{localStorage.removeItem("token");navigate("/login");}} animate={{background:"rgba(239,68,68,.06)",borderColor:"rgba(239,68,68,.2)"}} transition={{duration:1.6}}
              style={{border:"1px solid",color:"#dc2626",padding:"7px 16px",borderRadius:10,fontFamily:"'DM Sans',sans-serif",fontSize:13,cursor:"pointer"}}>Logout</motion.button>
          </div>
        </div>
      </motion.nav>

      {/* MAIN */}
      <div style={{position:"relative",zIndex:2,maxWidth:700,margin:"0 auto",padding:"32px 16px 60px"}}>
        {/* heading */}
        <div style={{marginBottom:24,animation:"fadeUp .6s ease both"}}>
          <motion.p animate={{color:theme.accent}} transition={{duration:1.6}} style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:"3px",textTransform:"uppercase",marginBottom:10}}>✦ AI-Powered Travel</motion.p>
          <motion.h1 animate={{color:theme.text}} transition={{duration:1.6}} style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(24px,5vw,36px)",fontWeight:800,letterSpacing:"-1px",marginBottom:6}}>Search Flights</motion.h1>
          <motion.p animate={{color:`${theme.sub}88`}} transition={{duration:1.6}} style={{fontSize:14,fontWeight:300}}>India's AI-powered flight search — real data, zero fees</motion.p>
        </div>

        {/* TRAVEL TYPE TABS */}
        <motion.div animate={{background:theme.card,borderColor:`${theme.accent}15`}} transition={{duration:1.6}}
          style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,border:"1px solid",borderRadius:16,padding:8,marginBottom:20,backdropFilter:"blur(12px)"}}>
          {[{id:"flight",icon:"✈️",label:"Flights"},{id:"bus",icon:"🚌",label:"Buses",soon:true},{id:"train",icon:"🚂",label:"Trains",soon:true},{id:"hotel",icon:"🏨",label:"Hotels",soon:true}].map(tab=>(
            <button key={tab.id} onClick={()=>{setTravelType(tab.id);setFlights([]);setSearched(false);}}
              style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"10px 8px",borderRadius:10,cursor:"pointer",border:"none",transition:"all .2s",
                background:travelType===tab.id?`${theme.accent}15`:"transparent",
                color:travelType===tab.id?theme.accent:`${theme.sub}66`,}}>
              <span style={{fontSize:18}}>{tab.icon}</span>
              <span style={{fontSize:11,fontWeight:500}}>{tab.label}</span>
              {tab.soon&&<span style={{fontSize:8,background:"rgba(251,191,36,.15)",border:"1px solid rgba(251,191,36,.3)",color:"#d97706",padding:"1px 5px",borderRadius:8,letterSpacing:"0.5px"}}>Soon</span>}
            </button>
          ))}
        </motion.div>

        {/* COMING SOON */}
        {travelType!=="flight"&&(
          <motion.div animate={{background:theme.card,borderColor:`${theme.accent}15`}} transition={{duration:1.6}}
            style={{border:"1px solid",borderRadius:20,padding:"48px 24px",textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:48,marginBottom:14}}>{{bus:"🚌",train:"🚂",hotel:"🏨"}[travelType]}</div>
            <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:700,color:theme.text,marginBottom:8}}>{{bus:"Bus Booking",train:"Train Booking",hotel:"Hotel Booking"}[travelType]} — Coming Soon</h3>
            <p style={{fontSize:13,color:`${theme.sub}77`,lineHeight:1.7,maxWidth:360,margin:"0 auto"}}>We're working on bringing this to you. For now, search and book flights with AI!</p>
            <div style={{marginTop:16,display:"inline-block",background:`${theme.accent}10`,border:`1px solid ${theme.accent}25`,color:theme.accent,padding:"6px 16px",borderRadius:20,fontSize:11,letterSpacing:"1px"}}>✦ Phase 2 Feature</div>
          </motion.div>
        )}

        {/* FLIGHT SEARCH */}
        {travelType==="flight"&&(
          <>
            <motion.div className="search-card" animate={{background:theme.card,borderColor:`${theme.accent}15`,boxShadow:`0 4px 24px ${theme.accent}08`}} transition={{duration:1.6}}
              style={{border:"1px solid",borderRadius:20,padding:20,marginBottom:20,backdropFilter:"blur(12px)"}}>

              {/* trip type */}
              <div style={{display:"flex",gap:0,marginBottom:18,background:"rgba(0,0,0,.04)",borderRadius:10,padding:3}}>
                {["oneway","roundtrip"].map(t=>(
                  <button key={t} onClick={()=>setTripType(t)} style={{flex:1,padding:"8px",border:"none",borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,cursor:"pointer",transition:"all .2s",
                    background:tripType===t?`${theme.accent}18`:"transparent",color:tripType===t?theme.accent:`${theme.sub}77`}}>
                    {t==="oneway"?"One Way":"Round Trip"}
                  </button>
                ))}
              </div>

              {/* mode toggle */}
              <div style={{display:"flex",gap:0,marginBottom:16}}>
                {[["structured","🗺 Search"],["ai","🤖 AI Search"]].map(([id,label])=>(
                  <button key={id} onClick={()=>{setMode(id);setFlights([]);setSearched(false);}} style={{flex:1,padding:"9px",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,cursor:"pointer",border:`1px solid ${theme.accent}25`,background:mode===id?`${theme.accent}12`:"transparent",color:mode===id?theme.accent:`${theme.sub}66`,transition:"all .2s",borderRadius:id==="structured"?"10px 0 0 10px":"0 10px 10px 0"}}>
                    {label}
                  </button>
                ))}
              </div>

              {mode==="structured"&&(
                <>
                  {/* city row */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:8,alignItems:"center",marginBottom:12}}>
                    <motion.div onClick={()=>setShowFromModal(true)} animate={{background:`${theme.accent}06`,borderColor:`${theme.accent}20`}} transition={{duration:1.6}}
                      style={{border:"1px solid",borderRadius:12,padding:"12px 14px",cursor:"pointer",transition:"all .2s"}}>
                      <div style={{fontSize:9,letterSpacing:"2px",textTransform:"uppercase",color:`${theme.sub}55`,marginBottom:4,fontFamily:"'Space Mono',monospace"}}>From</div>
                      <motion.div animate={{color:theme.text}} transition={{duration:1.6}} style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,letterSpacing:"1px"}}>{fromCity.code}</motion.div>
                      <div style={{fontSize:11,color:`${theme.sub}66`,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{fromCity.name}</div>
                    </motion.div>
                    <motion.button onClick={swapCities} animate={{background:`${theme.accent}12`,borderColor:`${theme.accent}30`,color:theme.accent}} transition={{duration:1.6}}
                      style={{width:36,height:36,borderRadius:"50%",border:"1px solid",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:14,transition:"transform .3s",flexShrink:0}}
                      whileHover={{rotate:180}}>⇄</motion.button>
                    <motion.div onClick={()=>setShowToModal(true)} animate={{background:`${theme.accent}06`,borderColor:`${theme.accent}20`}} transition={{duration:1.6}}
                      style={{border:"1px solid",borderRadius:12,padding:"12px 14px",cursor:"pointer",transition:"all .2s"}}>
                      <div style={{fontSize:9,letterSpacing:"2px",textTransform:"uppercase",color:`${theme.sub}55`,marginBottom:4,fontFamily:"'Space Mono',monospace"}}>To</div>
                      <motion.div animate={{color:theme.text}} transition={{duration:1.6}} style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,letterSpacing:"1px"}}>{toCity.code}</motion.div>
                      <div style={{fontSize:11,color:`${theme.sub}66`,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{toCity.name}</div>
                    </motion.div>
                  </div>

                  {/* date row */}
                  <div className="bottom-row" style={{display:"grid",gridTemplateColumns:tripType==="roundtrip"?"1fr 1fr":"1fr",gap:8,marginBottom:14}}>
                    <motion.div animate={{background:`${theme.accent}06`,borderColor:`${theme.accent}20`}} transition={{duration:1.6}} style={{border:"1px solid",borderRadius:12,padding:"12px 14px"}}>
                      <div style={{fontSize:9,letterSpacing:"2px",textTransform:"uppercase",color:`${theme.sub}55`,marginBottom:4,fontFamily:"'Space Mono',monospace"}}>Departure</div>
                      <input type="date" value={date} min={today} onChange={e=>setDate(e.target.value)}
                        style={{background:"transparent",border:"none",outline:"none",color:theme.text,fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:500,width:"100%",cursor:"pointer"}}/>
                    </motion.div>
                    {tripType==="roundtrip"&&(
                      <motion.div animate={{background:`${theme.accent}06`,borderColor:`${theme.accent}20`}} transition={{duration:1.6}} style={{border:"1px solid",borderRadius:12,padding:"12px 14px"}}>
                        <div style={{fontSize:9,letterSpacing:"2px",textTransform:"uppercase",color:`${theme.sub}55`,marginBottom:4,fontFamily:"'Space Mono',monospace"}}>Return</div>
                        <input type="date" value={returnDate} min={date||today} onChange={e=>setReturnDate(e.target.value)}
                          style={{background:"transparent",border:"none",outline:"none",color:theme.text,fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:500,width:"100%",cursor:"pointer"}}/>
                      </motion.div>
                    )}
                  </div>

                  {/* pax + class */}
                  <div className="pax-row" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
                    <motion.div animate={{background:`${theme.accent}06`,borderColor:`${theme.accent}20`}} transition={{duration:1.6}} style={{border:"1px solid",borderRadius:12,padding:"12px 14px"}}>
                      <div style={{fontSize:9,letterSpacing:"2px",textTransform:"uppercase",color:`${theme.sub}55`,marginBottom:8,fontFamily:"'Space Mono',monospace"}}>Travellers</div>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <button onClick={()=>setPassengers(p=>Math.max(1,p-1))} style={{width:28,height:28,borderRadius:"50%",background:`${theme.accent}15`,border:`1px solid ${theme.accent}30`,color:theme.accent,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>−</button>
                        <span style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,color:theme.text,minWidth:20,textAlign:"center"}}>{passengers}</span>
                        <button onClick={()=>setPassengers(p=>Math.min(9,p+1))} style={{width:28,height:28,borderRadius:"50%",background:`${theme.accent}15`,border:`1px solid ${theme.accent}30`,color:theme.accent,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>+</button>
                      </div>
                    </motion.div>
                    <motion.div animate={{background:`${theme.accent}06`,borderColor:`${theme.accent}20`}} transition={{duration:1.6}} style={{border:"1px solid",borderRadius:12,padding:"12px 14px"}}>
                      <div style={{fontSize:9,letterSpacing:"2px",textTransform:"uppercase",color:`${theme.sub}55`,marginBottom:4,fontFamily:"'Space Mono',monospace"}}>Class</div>
                      <select value={cabinClass} onChange={e=>setCabinClass(e.target.value)} style={{background:"transparent",border:"none",outline:"none",color:theme.text,fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:500,width:"100%",cursor:"pointer",appearance:"none"}}>
                        {CLASSES.map(c=><option key={c} value={c}>{c}</option>)}
                      </select>
                    </motion.div>
                  </div>
                </>
              )}

              {mode==="ai"&&(
                <div style={{marginBottom:16}}>
                  <motion.div animate={{background:`${theme.accent}06`,borderColor:`${theme.accent}25`}} transition={{duration:1.6}}
                    style={{display:"flex",alignItems:"center",border:"1px solid",borderRadius:12,padding:"4px 4px 4px 14px",gap:10}}>
                    <span style={{fontSize:16,opacity:.5}}>🤖</span>
                    <input type="text" placeholder="cheapest flights bangalore to mumbai tomorrow..." value={aiQuery} onChange={e=>setAiQuery(e.target.value)}
                      onKeyPress={e=>{if(e.key==="Enter")searchAI();}}
                      style={{flex:1,background:"transparent",border:"none",outline:"none",color:theme.text,fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:300,padding:"9px 0"}}/>
                  </motion.div>
                  <p style={{fontSize:11,color:`${theme.sub}55`,marginTop:8,textAlign:"center"}}>Try: "cheap flights blr to del next friday"</p>
                </div>
              )}

              <motion.button onClick={mode==="structured"?searchFlights:searchAI}
                animate={{background:`linear-gradient(135deg,${theme.accent},${theme.accent2})`,boxShadow:`0 8px 24px ${theme.accent}35`}} transition={{duration:1.6}}
                style={{width:"100%",padding:"14px",border:"none",borderRadius:12,color:"white",fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:600,cursor:"pointer"}}>
                {mode==="structured"?"Search Flights ✈":"Search with AI 🤖"}
              </motion.button>
            </motion.div>

            {/* LOADING */}
            {loading&&(
              <div style={{textAlign:"center",padding:"40px 0"}}>
                <div style={{width:40,height:40,border:`2px solid ${theme.accent}25`,borderTop:`2px solid ${theme.accent}`,borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 14px"}}/>
                <motion.p animate={{color:`${theme.sub}77`}} transition={{duration:1.6}} style={{fontFamily:"'Space Mono',monospace",fontSize:11,letterSpacing:"2px"}}>Scanning flight paths...</motion.p>
              </div>
            )}

            {/* FILTERS */}
            {!loading&&flights.length>0&&(
              <motion.div animate={{background:theme.card,borderColor:`${theme.accent}15`}} transition={{duration:1.6}}
                style={{border:"1px solid",borderRadius:16,padding:16,marginBottom:18,backdropFilter:"blur(12px)"}}>
                <motion.p animate={{color:theme.accent}} transition={{duration:1.6}} style={{fontSize:10,letterSpacing:"2px",textTransform:"uppercase",marginBottom:12,fontFamily:"'Space Mono',monospace"}}>✦ Filter & Sort</motion.p>
                <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4,marginBottom:10}}>
                  {[["any","All times"],["morning","Morning"],["afternoon","Afternoon"],["evening","Evening"],["price","Cheapest"],["departure","Earliest"],["duration","Fastest"],["price-desc","Most expensive"]].map(([val,label])=>{
                    const isTime=["any","morning","afternoon","evening"].includes(val);
                    const active=isTime?filterTime===val:sortBy===val;
                    return(
                      <button key={val} onClick={()=>isTime?setFilterTime(val):setSortBy(val)}
                        style={{flexShrink:0,background:active?`${theme.accent}15`:"rgba(0,0,0,.04)",border:active?`1px solid ${theme.accent}35`:"1px solid rgba(0,0,0,.08)",borderRadius:20,padding:"6px 14px",color:active?theme.accent:`${theme.sub}77`,fontFamily:"'DM Sans',sans-serif",fontSize:12,cursor:"pointer",transition:"all .2s",whiteSpace:"nowrap"}}>
                        {label}
                      </button>
                    );
                  })}
                </div>
                <input type="range" min="1000" max={filterMaxPrice+1000} step="500" value={filterMaxPrice} onChange={e=>setFilterMaxPrice(Number(e.target.value))}
                  style={{width:"100%",height:3,appearance:"none",background:`linear-gradient(90deg,${theme.accent},${theme.accent2})`,borderRadius:2,outline:"none",cursor:"pointer"}}/>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:`${theme.sub}66`,marginTop:6}}>
                  <span>₹1,000</span><motion.span animate={{color:theme.accent}} transition={{duration:1.6}}>Max ₹{filterMaxPrice.toLocaleString()}</motion.span>
                </div>
              </motion.div>
            )}

            {/* RESULTS */}
            {!loading&&searched&&(
              <>
                <motion.p animate={{color:`${theme.sub}66`}} transition={{duration:1.6}} style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:"2px",textTransform:"uppercase",marginBottom:14}}>
                  {filtered.length>0?`${filtered.length} of ${flights.length} flights`:"No flights match filters"}
                </motion.p>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {filtered.map(flight=>(
                    <motion.div key={flight.id} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:.4}}
                      whileHover={{y:-3,boxShadow:`0 16px 40px ${theme.accent}15`}}
                      animate2={{background:theme.card,borderColor:`${theme.accent}15`,boxShadow:`0 4px 20px ${theme.accent}06`}}>
                      <motion.div animate={{background:theme.card,borderColor:`${theme.accent}15`}} transition={{duration:1.6}}
                        style={{border:"1px solid",borderRadius:18,padding:"16px 18px",position:"relative",overflow:"hidden",backdropFilter:"blur(12px)"}}>
                        <motion.div animate={{background:`linear-gradient(90deg,transparent,${theme.accent}20,transparent)`}} transition={{duration:1.6}}
                          style={{position:"absolute",top:0,left:0,right:0,height:1}}/>
                        {/* top row */}
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <motion.div animate={{background:`linear-gradient(135deg,${theme.accent},${theme.accent2})`}} transition={{duration:1.6}} style={{width:8,height:8,borderRadius:"50%"}}/>
                            <motion.span animate={{color:theme.text}} transition={{duration:1.6}} style={{fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:600,letterSpacing:".5px"}}>{flight.airline}</motion.span>
                          </div>
                          <span style={{padding:"3px 8px",borderRadius:20,fontSize:9,letterSpacing:".5px",background:"rgba(16,185,129,.08)",border:"1px solid rgba(16,185,129,.2)",color:"#059669"}}>Non-stop</span>
                        </div>
                        {/* route */}
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                          <div style={{textAlign:"center"}}>
                            <motion.div animate={{color:theme.text}} transition={{duration:1.6}} style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,letterSpacing:"1px"}}>{formatTime(flight.departure_time)}</motion.div>
                            <div style={{fontSize:11,color:`${theme.sub}55`,marginTop:2}}>{flight.from_city?.slice(0,3).toUpperCase()}</div>
                            <div style={{fontSize:10,color:`${theme.sub}44`,marginTop:1}}>{formatDate(flight.departure_time)}</div>
                          </div>
                          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"0 12px"}}>
                            <div style={{fontSize:10,color:`${theme.sub}55`}}>{calcDuration(flight.departure_time,flight.arrival_time)}</div>
                            <div style={{width:"100%",height:1,background:`linear-gradient(90deg,${theme.accent}25,${theme.accent2}55,${theme.accent}25)`,position:"relative"}}>
                              <motion.span animate={{color:theme.accent}} transition={{duration:1.6}} style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:12}}>✈</motion.span>
                            </div>
                            <div style={{fontSize:9,color:"rgba(16,185,129,.7)"}}>Direct</div>
                          </div>
                          <div style={{textAlign:"center"}}>
                            <motion.div animate={{color:theme.text}} transition={{duration:1.6}} style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,letterSpacing:"1px"}}>{formatTime(flight.arrival_time)}</motion.div>
                            <div style={{fontSize:11,color:`${theme.sub}55`,marginTop:2}}>{flight.to_city?.slice(0,3).toUpperCase()}</div>
                            <div style={{fontSize:10,color:`${theme.sub}44`,marginTop:1}}>{formatDate(flight.arrival_time)}</div>
                          </div>
                        </div>
                        {/* bottom */}
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:12,borderTop:`1px solid ${theme.accent}10`}}>
                          <div>
                            <div style={{fontSize:9,color:`${theme.sub}44`,letterSpacing:"1px",textTransform:"uppercase"}}>from</div>
                            <motion.div animate={{color:theme.accent}} transition={{duration:1.6}} style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800}}>₹{(flight.price*passengers).toLocaleString()}</motion.div>
                            <div style={{fontSize:10,color:`${theme.sub}55`,marginTop:1}}>{passengers} pax · {cabinClass}</div>
                          </div>
                          <motion.button onClick={()=>handleBook(flight)}
                            animate={{background:`linear-gradient(135deg,${theme.accent},${theme.accent2})`,boxShadow:`0 6px 18px ${theme.accent}35`}} transition={{duration:1.6}}
                            style={{border:"none",color:"white",padding:"11px 22px",borderRadius:12,fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:600,cursor:"pointer"}}>
                            Book →
                          </motion.button>
                        </div>
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}

            {!loading&&!searched&&(
              <div style={{textAlign:"center",padding:"60px 20px"}}>
                <div style={{fontSize:44,marginBottom:12,opacity:.4}}>🌏</div>
                <motion.p animate={{color:`${theme.sub}55`}} transition={{duration:1.6}} style={{fontSize:14,fontFamily:"'Syne',sans-serif",fontWeight:600}}>Your journey starts here</motion.p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Payment Modal ── */
function PaymentModal({ flight, passengerName, passengers, cabinClass, theme, onSuccess, onCancel }) {
  const [step, setStep] = useState("payment");
  const [payMethod, setPayMethod] = useState("card");
  const [cardNo, setCardNo] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const bookingId = useRef("CMT" + Date.now().toString(36).toUpperCase().slice(-6));
  const totalPrice = flight.price * passengers;
  const formatCard = v => v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const formatExpiry = v => { const d=v.replace(/\D/g,"").slice(0,4); return d.length>=3?d.slice(0,2)+"/"+d.slice(2):d; };

  const handlePay = () => {
    if (payMethod==="card"&&(!cardNo||!expiry||!cvv)) { alert("Please fill all card details."); return; }
    setStep("processing");
    setTimeout(() => setStep("success"), 2500);
  };

  if (step==="processing") return(
    <div className="modal-overlay">
      <div className="payment-modal" style={{borderRadius:24}}>
        <div style={{background:`linear-gradient(135deg,${theme.accent},${theme.accent2})`,padding:"16px 22px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:800,color:"white"}}>☄ CometAI Pay</span>
          <span style={{fontSize:11,color:"rgba(255,255,255,.7)"}}>🔒 Secure</span>
        </div>
        <div style={{padding:"50px 24px",textAlign:"center"}}>
          <div style={{width:52,height:52,border:`3px solid ${theme.accent}25`,borderTop:`3px solid ${theme.accent}`,borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 18px"}}/>
          <p style={{fontFamily:"'Space Mono',monospace",fontSize:12,color:theme.sub,letterSpacing:"2px"}}>Processing payment...</p>
        </div>
      </div>
    </div>
  );

  if (step==="success") return(
    <div className="modal-overlay">
      <div className="payment-modal" style={{borderRadius:24}}>
        <div style={{background:`linear-gradient(135deg,${theme.accent},${theme.accent2})`,padding:"16px 22px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:800,color:"white"}}>☄ CometAI Pay</span>
          <span style={{fontSize:11,color:"rgba(255,255,255,.7)"}}>🔒 Secure</span>
        </div>
        <div style={{padding:"36px 24px",textAlign:"center"}}>
          <div style={{fontSize:52,marginBottom:14}}>🚀</div>
          <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,color:"#059669",marginBottom:8}}>Booking Confirmed!</h3>
          <p style={{fontSize:13,color:"rgba(5,150,105,.7)",marginBottom:20,lineHeight:1.6}}>{flight.airline}<br/>{flight.from_city} → {flight.to_city}<br/>Passenger: {passengerName}</p>
          <div style={{background:"rgba(16,185,129,.06)",border:"1px solid rgba(16,185,129,.2)",borderRadius:12,padding:14,marginBottom:20}}>
            <div style={{fontSize:10,color:"rgba(5,150,105,.55)",letterSpacing:"2px",fontFamily:"'Space Mono',monospace",marginBottom:4}}>BOOKING ID</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,color:"#059669",letterSpacing:"3px"}}>{bookingId.current}</div>
          </div>
          <button onClick={onSuccess} style={{width:"100%",padding:14,background:`linear-gradient(135deg,${theme.accent},${theme.accent2})`,border:"none",borderRadius:12,color:"white",fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:600,cursor:"pointer"}}>View My Bookings →</button>
        </div>
      </div>
    </div>
  );

  return(
    <div className="modal-overlay" onClick={onCancel}>
      <div className="payment-modal" onClick={e=>e.stopPropagation()}>
        <div style={{background:`linear-gradient(135deg,${theme.accent},${theme.accent2})`,padding:"16px 22px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:800,color:"white"}}>☄ CometAI Pay</span>
          <span style={{fontSize:11,color:"rgba(255,255,255,.7)"}}>🔒 256-bit SSL</span>
        </div>
        <div style={{padding:"22px 22px"}}>
          <div style={{background:`${theme.accent}08`,border:`1px solid ${theme.accent}18`,borderRadius:14,padding:16,textAlign:"center",marginBottom:20}}>
            <div style={{fontSize:10,letterSpacing:"2px",color:`${theme.sub}66`,fontFamily:"'Space Mono',monospace",marginBottom:6}}>TOTAL AMOUNT</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,color:theme.accent}}>₹{totalPrice.toLocaleString()}</div>
            <div style={{fontSize:12,color:`${theme.sub}77`,marginTop:4}}>{flight.from_city} → {flight.to_city} · {passengers} pax · {cabinClass}</div>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:18}}>
            {[["card","💳 Card"],["upi","⚡ UPI"],["netbanking","🏦 Netbanking"]].map(([id,label])=>(
              <button key={id} onClick={()=>setPayMethod(id)} style={{flex:1,padding:"10px 6px",background:payMethod===id?`${theme.accent}12`:"rgba(0,0,0,.03)",border:`1px solid ${payMethod===id?theme.accent+"35":"rgba(0,0,0,.08)"}`,borderRadius:10,color:payMethod===id?theme.accent:`${theme.sub}88`,fontFamily:"'DM Sans',sans-serif",fontSize:12,cursor:"pointer",transition:"all .2s",textAlign:"center"}}>
                {label}
              </button>
            ))}
          </div>
          {payMethod==="card"&&(
            <>
              <label style={{fontSize:10,color:`${theme.sub}77`,letterSpacing:"1.5px",textTransform:"uppercase",display:"block",marginBottom:7,fontFamily:"'Space Mono',monospace"}}>Card Number</label>
              <input style={{width:"100%",background:"rgba(0,0,0,.03)",border:`1px solid ${theme.accent}20`,borderRadius:10,padding:"12px 14px",color:theme.text,fontFamily:"'DM Sans',sans-serif",fontSize:15,outline:"none",marginBottom:12,letterSpacing:"1px"}} placeholder="4111 1111 1111 1111" value={cardNo} onChange={e=>setCardNo(formatCard(e.target.value))} maxLength={19}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div>
                  <label style={{fontSize:10,color:`${theme.sub}77`,letterSpacing:"1.5px",textTransform:"uppercase",display:"block",marginBottom:7,fontFamily:"'Space Mono',monospace"}}>Expiry</label>
                  <input style={{width:"100%",background:"rgba(0,0,0,.03)",border:`1px solid ${theme.accent}20`,borderRadius:10,padding:"12px 14px",color:theme.text,fontFamily:"'DM Sans',sans-serif",fontSize:15,outline:"none"}} placeholder="MM/YY" value={expiry} onChange={e=>setExpiry(formatExpiry(e.target.value))} maxLength={5}/>
                </div>
                <div>
                  <label style={{fontSize:10,color:`${theme.sub}77`,letterSpacing:"1.5px",textTransform:"uppercase",display:"block",marginBottom:7,fontFamily:"'Space Mono',monospace"}}>CVV</label>
                  <input style={{width:"100%",background:"rgba(0,0,0,.03)",border:`1px solid ${theme.accent}20`,borderRadius:10,padding:"12px 14px",color:theme.text,fontFamily:"'DM Sans',sans-serif",fontSize:15,outline:"none"}} placeholder="•••" type="password" value={cvv} onChange={e=>setCvv(e.target.value.slice(0,3))} maxLength={3}/>
                </div>
              </div>
            </>
          )}
          {payMethod==="upi"&&(
            <>
              <label style={{fontSize:10,color:`${theme.sub}77`,letterSpacing:"1.5px",textTransform:"uppercase",display:"block",marginBottom:7,fontFamily:"'Space Mono',monospace"}}>UPI ID</label>
              <input style={{width:"100%",background:"rgba(0,0,0,.03)",border:`1px solid ${theme.accent}20`,borderRadius:10,padding:"12px 14px",color:theme.text,fontFamily:"'DM Sans',sans-serif",fontSize:15,outline:"none"}} placeholder="yourname@upi"/>
            </>
          )}
          {payMethod==="netbanking"&&(
            <>
              <label style={{fontSize:10,color:`${theme.sub}77`,letterSpacing:"1.5px",textTransform:"uppercase",display:"block",marginBottom:7,fontFamily:"'Space Mono',monospace"}}>Select Bank</label>
              <select style={{width:"100%",background:"rgba(0,0,0,.03)",border:`1px solid ${theme.accent}20`,borderRadius:10,padding:"12px 14px",color:theme.text,fontFamily:"'DM Sans',sans-serif",fontSize:14,outline:"none",cursor:"pointer"}}>
                <option>SBI — State Bank of India</option><option>HDFC Bank</option><option>ICICI Bank</option><option>Axis Bank</option><option>Kotak Mahindra Bank</option>
              </select>
            </>
          )}
          <button onClick={handlePay} style={{width:"100%",padding:15,background:`linear-gradient(135deg,${theme.accent},${theme.accent2})`,border:"none",borderRadius:12,color:"white",fontFamily:"'DM Sans',sans-serif",fontSize:16,fontWeight:600,cursor:"pointer",marginTop:16,boxShadow:`0 8px 24px ${theme.accent}35`}}>
            Pay ₹{totalPrice.toLocaleString()} →
          </button>
          <p style={{textAlign:"center",fontSize:11,color:`${theme.sub}55`,marginTop:12,fontFamily:"'Space Mono',monospace"}}>🔒 Demo payment. No real money charged.</p>
        </div>
      </div>
    </div>
  );
}