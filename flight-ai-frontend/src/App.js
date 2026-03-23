import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import MyBookings from "./pages/MyBookings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import LandingPage from "./pages/LandingPage";
import AdminDashboard from "./pages/AdminDashboard";
import UserProfile from "./pages/UserProfile";

const API = "https://cometai-backend.onrender.com";
const ACCENT = "#6C63FF";
const GRAD = "linear-gradient(135deg,#6C63FF,#00C2FF)";

const SHARED_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html{scroll-behavior:smooth;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(22px);}to{opacity:1;transform:translateY(0);}}
  @keyframes floatUD{0%,100%{transform:translateY(0);}50%{transform:translateY(-9px);}}
  @keyframes gradShift{0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;}}
  @keyframes planeOrbit{from{transform:rotate(0deg) translateX(22px) rotate(0deg);}to{transform:rotate(360deg) translateX(22px) rotate(-360deg);}}
  @keyframes orbitRing{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
  @keyframes spinSlow{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
  ::-webkit-scrollbar{width:3px;}
  ::-webkit-scrollbar-thumb{background:#6C63FF;border-radius:2px;}
`;

const CITIES = [
  {code:"BLR",name:"Bangalore",  full:"Kempegowda International",        country:"India",popular:true},
  {code:"BOM",name:"Mumbai",     full:"Chhatrapati Shivaji Intl",         country:"India",popular:true},
  {code:"DEL",name:"Delhi",      full:"Indira Gandhi International",      country:"India",popular:true},
  {code:"MAA",name:"Chennai",    full:"Chennai International",            country:"India",popular:true},
  {code:"HYD",name:"Hyderabad",  full:"Rajiv Gandhi International",       country:"India",popular:true},
  {code:"CCU",name:"Kolkata",    full:"Netaji Subhas Chandra Bose Intl",  country:"India",popular:true},
  {code:"GOI",name:"Goa",        full:"Dabolim / Mopa Airport",           country:"India",popular:true},
  {code:"PNQ",name:"Pune",       full:"Pune Airport",                     country:"India",popular:true},
  {code:"COK",name:"Kochi",      full:"Cochin International",             country:"India",popular:true},
  {code:"AMD",name:"Ahmedabad",  full:"Sardar Vallabhbhai Patel Intl",    country:"India",popular:true},
  {code:"JAI",name:"Jaipur",     full:"Jaipur International",             country:"India",popular:true},
  {code:"LKO",name:"Lucknow",    full:"Chaudhary Charan Singh Intl",      country:"India",popular:false},
  {code:"VNS",name:"Varanasi",   full:"Lal Bahadur Shastri Airport",      country:"India",popular:false},
  {code:"PAT",name:"Patna",      full:"Jay Prakash Narayan Airport",      country:"India",popular:false},
  {code:"BHO",name:"Bhopal",     full:"Raja Bhoj Airport",                country:"India",popular:false},
  {code:"NAG",name:"Nagpur",     full:"Dr. Babasaheb Ambedkar Intl",      country:"India",popular:false},
  {code:"SXR",name:"Srinagar",   full:"Sheikh ul-Alam Airport",           country:"India",popular:false},
  {code:"IXC",name:"Chandigarh", full:"Chandigarh Airport",               country:"India",popular:false},
  {code:"GAU",name:"Guwahati",   full:"Lokpriya Gopinath Bordoloi Intl",  country:"India",popular:false},
  {code:"BBI",name:"Bhubaneswar",full:"Biju Patnaik International",       country:"India",popular:false},
  {code:"TRV",name:"Trivandrum", full:"Trivandrum International",         country:"India",popular:false},
  {code:"UDR",name:"Udaipur",    full:"Maharana Pratap Airport",          country:"India",popular:false},
  {code:"ATQ",name:"Amritsar",   full:"Sri Guru Ram Dass Jee Intl",       country:"India",popular:false},
  {code:"IDR",name:"Indore",     full:"Devi Ahilyabai Holkar Airport",    country:"India",popular:false},
  {code:"RPR",name:"Raipur",     full:"Swami Vivekananda Airport",        country:"India",popular:false},
  {code:"DXB",name:"Dubai",      full:"Dubai International",              country:"UAE",      popular:true},
  {code:"SIN",name:"Singapore",  full:"Changi Airport",                   country:"Singapore",popular:true},
  {code:"BKK",name:"Bangkok",    full:"Suvarnabhumi Airport",             country:"Thailand", popular:true},
  {code:"KUL",name:"Kuala Lumpur",full:"Kuala Lumpur International",      country:"Malaysia", popular:false},
  {code:"LHR",name:"London",     full:"Heathrow Airport",                 country:"UK",       popular:true},
  {code:"JFK",name:"New York",   full:"JFK International",                country:"USA",      popular:true},
  {code:"CDG",name:"Paris",      full:"Charles de Gaulle Airport",        country:"France",   popular:false},
  {code:"NRT",name:"Tokyo",      full:"Narita International",             country:"Japan",    popular:false},
  {code:"SYD",name:"Sydney",     full:"Kingsford Smith Airport",          country:"Australia",popular:false},
];

const CLASSES = ["Economy","Premium Economy","Business","First Class"];

function fmtTime(dt){if(!dt)return"--:--";return new Date(dt).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false});}
function fmtDate(dt){if(!dt)return"";return new Date(dt).toLocaleDateString("en-IN",{day:"numeric",month:"short"});}
function calcDur(dep,arr){if(!dep||!arr)return"";const d=(new Date(arr)-new Date(dep))/60000;return`${Math.floor(d/60)}h${d%60>0?" "+d%60+"m":""}`.trim();}

function AlvrynIcon({size=40,spin=false}){
  return(
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <defs>
        <linearGradient id="ai_a" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#6C63FF"/><stop offset="100%" stopColor="#00C2FF"/></linearGradient>
        <linearGradient id="ai_p" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FF6B6B"/><stop offset="100%" stopColor="#FFD93D"/></linearGradient>
      </defs>
      <ellipse cx="30" cy="30" rx="27" ry="11" stroke="url(#ai_a)" strokeWidth="1.2" strokeDasharray="5 3" opacity="0.45"
        style={spin?{animation:"orbitRing 5s linear infinite",transformOrigin:"30px 30px"}:{}}/>
      <text x="10" y="47" fontFamily="'Syne',sans-serif" fontWeight="900" fontSize="40" fill="url(#ai_a)">A</text>
      <g style={spin?{animation:"planeOrbit 5s linear infinite",transformOrigin:"30px 30px"}:{}}>
        <path d="M57 30 L50 26 L52 30 L50 34 Z" fill="url(#ai_p)"/>
        <path d="M51 26.5 L51 22 L54 27 Z" fill="url(#ai_p)" opacity="0.75"/>
      </g>
    </svg>
  );
}

function AuroraBackground({colors,opacity=1}){
  const ref=React.useRef(null),raf=React.useRef(null);
  useEffect(()=>{
    const c=ref.current;if(!c)return;
    const ctx=c.getContext("2d");let W=c.offsetWidth,H=c.offsetHeight;c.width=W;c.height=H;
    const blobs=Array.from({length:5},(_,i)=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-0.5)*0.5,vy:(Math.random()-0.5)*0.5,r:200+Math.random()*180,ci:i%colors.length}));
    const resize=()=>{W=c.offsetWidth;H=c.offsetHeight;c.width=W;c.height=H;};
    window.addEventListener("resize",resize);
    const draw=()=>{ctx.clearRect(0,0,W,H);blobs.forEach(b=>{b.x+=b.vx;b.y+=b.vy;if(b.x<-b.r||b.x>W+b.r)b.vx*=-1;if(b.y<-b.r||b.y>H+b.r)b.vy*=-1;const g=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r);g.addColorStop(0,colors[b.ci%colors.length]+"28");g.addColorStop(1,"transparent");ctx.fillStyle=g;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();});raf.current=requestAnimationFrame(draw);};
    draw();return()=>{cancelAnimationFrame(raf.current);window.removeEventListener("resize",resize);};
  },[colors]);
  return <canvas ref={ref} style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:0,opacity}}/>;
}

function CityModal({title,onSelect,onClose,exclude}){
  const [search,setSearch]=useState("");
  const shown=CITIES.filter(c=>c.code!==exclude&&(c.name.toLowerCase().includes(search.toLowerCase())||c.code.toLowerCase().includes(search.toLowerCase())||c.country.toLowerCase().includes(search.toLowerCase())));
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:480,background:"rgba(255,255,255,0.97)",borderRadius:22,padding:28,boxShadow:"0 24px 80px rgba(0,0,0,0.15)",animation:"fadeUp 0.3s both",maxHeight:"80vh",display:"flex",flexDirection:"column"}}>
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:900,fontSize:18,color:"#0a0a0a",marginBottom:14}}>{title}</div>
        <input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search city or code…"
          style={{width:"100%",padding:"11px 16px",borderRadius:12,fontSize:14,fontFamily:"'DM Sans',sans-serif",border:"1.5px solid rgba(108,99,255,0.3)",outline:"none",marginBottom:12,color:"#0a0a0a",background:"#fafafa"}}/>
        {!search&&<div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#bbb",letterSpacing:"0.15em",marginBottom:8}}>POPULAR CITIES</div>}
        <div style={{display:"flex",flexDirection:"column",gap:5,overflowY:"auto",flex:1}}>
          {shown.map(city=>(
            <div key={city.code} onClick={()=>onSelect(city)}
              style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",borderRadius:11,cursor:"pointer",background:"#fafafa",border:"1px solid rgba(0,0,0,0.05)",transition:"all 0.15s"}}
              onMouseEnter={e=>e.currentTarget.style.background="#f0eeff"}
              onMouseLeave={e=>e.currentTarget.style.background="#fafafa"}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:14,color:"#0a0a0a"}}>{city.name}</span>
                  {city.popular&&<span style={{fontSize:8,background:"#f0eeff",color:ACCENT,padding:"2px 6px",borderRadius:6,fontFamily:"'Space Mono',monospace"}}>TOP</span>}
                </div>
                <div style={{fontSize:11,color:"#aaa",marginTop:1}}>{city.full} · {city.country}</div>
              </div>
              <div style={{fontFamily:"'Space Mono',monospace",fontWeight:700,fontSize:14,color:ACCENT}}>{city.code}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SeatModal({flight,passengers,onConfirm,onCancel}){
  const COLS=["A","B","C","D","E","F"];
  const ROWS=Array.from({length:20},(_,i)=>i+1);
  const [taken]=useState(()=>{const t=new Set();for(let i=0;i<18;i++)t.add(`${Math.ceil(Math.random()*20)}${COLS[Math.floor(Math.random()*6)]}`);return t;});
  const [selected,setSelected]=useState([]);
  const toggle=seat=>{if(taken.has(seat))return;setSelected(p=>p.includes(seat)?p.filter(s=>s!==seat):p.length<passengers?[...p,seat]:p);};
  const color=seat=>{if(taken.has(seat))return"#e5e7eb";if(selected.includes(seat))return ACCENT;const r=parseInt(seat);if(r<=3)return"#fef3c7";if(r<=6)return"#dbeafe";return"#f0fdf4";};
  return(
    <div onClick={onCancel} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:700,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(10px)",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:520,background:"#fff",borderRadius:24,boxShadow:"0 32px 100px rgba(0,0,0,0.2)",animation:"fadeUp 0.3s both",maxHeight:"90vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{background:GRAD,padding:"18px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:900,color:"#fff",fontSize:16}}>Select Seats</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.8)",marginTop:3}}>{flight.from_city} → {flight.to_city} · Pick {passengers} seat{passengers>1?"s":""}</div>
          </div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:13,color:"rgba(255,255,255,0.9)"}}>{selected.length}/{passengers}</div>
        </div>
        <div style={{display:"flex",gap:12,padding:"10px 20px",borderBottom:"1px solid rgba(0,0,0,0.05)",flexWrap:"wrap"}}>
          {[{c:"#fef3c7",l:"Rows 1-3"},{c:"#dbeafe",l:"Rows 4-6"},{c:"#f0fdf4",l:"Economy"},{c:ACCENT,l:"Selected"},{c:"#e5e7eb",l:"Taken"}].map(i=>(
            <div key={i.l} style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:12,height:12,borderRadius:3,background:i.c,border:"1px solid rgba(0,0,0,0.1)"}}/>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#888"}}>{i.l}</span>
            </div>
          ))}
        </div>
        <div style={{textAlign:"center",padding:"8px 0 4px",fontSize:20}}>✈️</div>
        <div style={{overflowY:"auto",padding:"0 20px 12px"}}>
          <div style={{display:"grid",gridTemplateColumns:"26px 1fr 8px 1fr",gap:3,marginBottom:6}}>
            <div/>{["A","B","C"].map(c=><div key={c} style={{textAlign:"center",fontFamily:"'Space Mono',monospace",fontSize:10,color:"#bbb"}}>{c}</div>)}<div/>{["D","E","F"].map(c=><div key={c} style={{textAlign:"center",fontFamily:"'Space Mono',monospace",fontSize:10,color:"#bbb"}}>{c}</div>)}
          </div>
          {ROWS.map(row=>(
            <div key={row} style={{display:"grid",gridTemplateColumns:"26px 1fr 8px 1fr",gap:3,marginBottom:3,alignItems:"center"}}>
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#ccc",textAlign:"right",paddingRight:3}}>{row}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:3}}>
                {COLS.slice(0,3).map(col=>{const s=`${row}${col}`;return(<div key={s} onClick={()=>toggle(s)} style={{height:26,borderRadius:5,background:color(s),border:`1px solid ${taken.has(s)?"#d1d5db":selected.includes(s)?"#5b52d6":"rgba(0,0,0,0.07)"}`,cursor:taken.has(s)?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,fontFamily:"'Space Mono',monospace",color:selected.includes(s)?"#fff":"#aaa",fontWeight:700}}>{taken.has(s)?"×":selected.includes(s)?s:""}</div>);})}
              </div>
              <div/>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:3}}>
                {COLS.slice(3).map(col=>{const s=`${row}${col}`;return(<div key={s} onClick={()=>toggle(s)} style={{height:26,borderRadius:5,background:color(s),border:`1px solid ${taken.has(s)?"#d1d5db":selected.includes(s)?"#5b52d6":"rgba(0,0,0,0.07)"}`,cursor:taken.has(s)?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,fontFamily:"'Space Mono',monospace",color:selected.includes(s)?"#fff":"#aaa",fontWeight:700}}>{taken.has(s)?"×":selected.includes(s)?s:""}</div>);})}
              </div>
            </div>
          ))}
        </div>
        <div style={{padding:"14px 22px",borderTop:"1px solid rgba(0,0,0,0.06)",display:"flex",gap:10,alignItems:"center"}}>
          <div style={{flex:1,fontFamily:"'DM Sans',sans-serif",fontSize:13,color:selected.length>0?"#0a0a0a":"#bbb"}}>{selected.length>0?`Selected: ${selected.join(", ")}`:"No seats selected"}</div>
          <button onClick={onCancel} style={{padding:"9px 16px",borderRadius:10,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",background:"transparent",color:"#aaa",border:"1.5px solid rgba(0,0,0,0.1)",cursor:"pointer"}}>Back</button>
          <button onClick={()=>selected.length===passengers&&onConfirm(selected)} disabled={selected.length!==passengers}
            style={{padding:"9px 20px",borderRadius:10,fontSize:13,fontWeight:700,fontFamily:"'Syne',sans-serif",color:"#fff",border:"none",cursor:"pointer",background:selected.length===passengers?GRAD:"#e5e7eb",boxShadow:selected.length===passengers?`0 4px 14px ${ACCENT}44`:"none"}}>
            Confirm →
          </button>
        </div>
      </div>
    </div>
  );
}

function PassengerModal({flight,passengers,onConfirm,onCancel}){
  const [name,setName]=useState("");
  const [err,setErr]=useState("");
  const go=()=>{if(!name.trim()||name.trim().length<2){setErr("Please enter your full name");return;}if(!name.includes(" ")){setErr("Enter first and last name");return;}onConfirm(name.trim());};
  return(
    <div onClick={onCancel} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:420,background:"rgba(255,255,255,0.97)",borderRadius:24,padding:"40px 36px",boxShadow:"0 24px 80px rgba(0,0,0,0.18)",animation:"fadeUp 0.3s both"}}>
        <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:900,fontSize:22,color:"#0a0a0a",marginBottom:8}}>Passenger Details</h2>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"#888",marginBottom:24}}>{flight.airline} · {flight.from_city} → {flight.to_city} · {passengers} pax</p>
        <label style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,color:"#aaa",display:"block",marginBottom:7,letterSpacing:"0.1em"}}>FULL NAME (as on ID)</label>
        <input autoFocus value={name} onChange={e=>{setName(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="e.g. Vishaal Kumar"
          style={{width:"100%",padding:"13px 16px",borderRadius:13,fontSize:15,fontFamily:"'DM Sans',sans-serif",border:`1.5px solid ${err?"#ef4444":"rgba(108,99,255,0.3)"}`,outline:"none",color:"#0a0a0a",background:"#fafafa",marginBottom:err?8:24}}/>
        {err&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#ef4444",marginBottom:16}}>{err}</div>}
        <div style={{display:"flex",gap:12}}>
          <button onClick={onCancel} style={{padding:"13px 22px",borderRadius:13,fontSize:14,fontWeight:600,fontFamily:"'DM Sans',sans-serif",background:"transparent",color:"#aaa",border:"1.5px solid rgba(0,0,0,0.1)",cursor:"pointer"}}>Cancel</button>
          <button onClick={go} style={{flex:1,padding:"13px",borderRadius:13,fontSize:14,fontWeight:700,fontFamily:"'Syne',sans-serif",color:"#fff",border:"none",cursor:"pointer",background:GRAD,boxShadow:`0 6px 22px ${ACCENT}44`}}>Select Seats →</button>
        </div>
      </div>
    </div>
  );
}

function PaymentModal({flight,passengerName,passengers,cabinClass,seats,onSuccess,onCancel,token}){
  const [step,setStep]=useState("payment");
  const [payMethod,setPayMethod]=useState("card");
  const [cardNo,setCardNo]=useState("");
  const [expiry,setExpiry]=useState("");
  const [cvv,setCvv]=useState("");
  const [promoCode,setPromoCode]=useState("");
  const [promoMsg,setPromoMsg]=useState({type:"",text:""});
  const [discount,setDiscount]=useState(0);
  const [promoChecking,setPromoChecking]=useState(false);
  const [walletBalance,setWalletBalance]=useState(0);
  const [useWallet,setUseWallet]=useState(false);
  const [bookingId]=useState("ALV"+Date.now().toString(36).toUpperCase().slice(-6));
  const base=flight.price*passengers;
  const walletCut=useWallet?Math.min(walletBalance,base-discount):0;
  const total=Math.max(0,base-discount-walletCut);
  const fmtCard=v=>v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const fmtExp=v=>{const d=v.replace(/\D/g,"").slice(0,4);return d.length>=3?d.slice(0,2)+"/"+d.slice(2):d;};
  useEffect(()=>{
    if(!token)return;
    fetch(`${API}/wallet`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>setWalletBalance(d.balance||0)).catch(()=>{});
  },[token]);
  const applyPromo=async()=>{
    if(!promoCode.trim())return;
    setPromoChecking(true);setPromoMsg({type:"",text:""});
    try{
      const res=await fetch(`${API}/validate-promo`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({code:promoCode,amount:base})});
      const data=await res.json();
      if(!res.ok){setPromoMsg({type:"error",text:data.message});setDiscount(0);}
      else{setDiscount(data.discount);setPromoMsg({type:"success",text:`Applied! ${data.description} — saving Rs.${data.discount}`});}
    }catch(e){setPromoMsg({type:"error",text:"Could not validate code"});}
    setPromoChecking(false);
  };
  const handlePay=async()=>{
    if(payMethod==="card"&&(!cardNo||!expiry||!cvv)){alert("Fill all card details");return;}
    setStep("processing");
    try{await fetch(`${API}/book`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({flight_id:flight.id,passenger_name:passengerName,cabin_class:cabinClass,seats,promo_code:promoCode||null,discount_applied:discount,final_price:total,use_wallet:useWallet})});}
    catch(e){console.error(e);}
    setTimeout(()=>setStep("success"),1800);
  };
  const ov={position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(10px)",padding:20};
  const crd={width:"100%",maxWidth:460,background:"rgba(255,255,255,0.98)",borderRadius:24,overflow:"hidden",boxShadow:"0 32px 100px rgba(0,0,0,0.18)",animation:"fadeUp 0.4s both",maxHeight:"92vh",overflowY:"auto"};
  const hdr={background:GRAD,padding:"18px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"};
  if(step==="processing")return(<div style={ov}><div style={crd}><div style={hdr}><div style={{fontFamily:"'Syne',sans-serif",fontWeight:900,color:"#fff",fontSize:16}}>Alvryn Pay</div><div style={{fontSize:12,color:"rgba(255,255,255,0.8)"}}>Secure</div></div><div style={{padding:"60px 24px",textAlign:"center"}}><div style={{width:52,height:52,border:"3px solid rgba(108,99,255,0.2)",borderTopColor:ACCENT,borderRadius:"50%",animation:"spinSlow 1s linear infinite",margin:"0 auto 20px"}}/><div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,color:ACCENT,fontSize:14,letterSpacing:"0.1em"}}>Processing payment…</div></div></div></div>);
  if(step==="success")return(<div style={ov}><div style={crd}><div style={hdr}><div style={{fontFamily:"'Syne',sans-serif",fontWeight:900,color:"#fff",fontSize:16}}>Alvryn Pay</div></div><div style={{padding:"40px 28px",textAlign:"center"}}><div style={{fontSize:56,marginBottom:16}}>🎉</div><div style={{fontFamily:"'Syne',sans-serif",fontWeight:900,fontSize:22,color:"#0a0a0a",marginBottom:10}}>Booking Confirmed!</div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"#777",lineHeight:1.7,marginBottom:20}}>{flight.airline} · {flight.from_city} → {flight.to_city}<br/>Passenger: {passengerName}<br/>Class: {cabinClass}{seats&&seats.length>0&&<span><br/>Seats: <strong style={{color:ACCENT}}>{seats.join(", ")}</strong></span>}</div><div style={{background:"#f0eeff",borderRadius:14,padding:"14px",marginBottom:16,border:`1px solid ${ACCENT}22`}}><div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#aaa",marginBottom:4,letterSpacing:"0.12em"}}>BOOKING ID</div><div style={{fontFamily:"'Space Mono',monospace",fontWeight:700,fontSize:18,color:ACCENT,letterSpacing:"0.15em"}}>{bookingId}</div></div>{discount>0&&<div style={{background:"#f0fdf4",borderRadius:10,padding:"10px",marginBottom:16,border:"1px solid #bbf7d0",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#16a34a"}}>You saved Rs.{(discount+walletCut).toLocaleString()} on this booking!</div>}<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#aaa",marginBottom:20}}>Ticket sent to your email</div><button onClick={()=>onSuccess(bookingId)} style={{width:"100%",padding:"14px",borderRadius:13,fontSize:15,fontWeight:700,fontFamily:"'Syne',sans-serif",color:"#fff",background:GRAD,border:"none",cursor:"pointer",boxShadow:`0 6px 24px ${ACCENT}44`}}>View My Bookings</button></div></div></div>);
  return(
    <div style={ov} onClick={onCancel}><div style={crd} onClick={e=>e.stopPropagation()}>
      <div style={hdr}><div style={{fontFamily:"'Syne',sans-serif",fontWeight:900,color:"#fff",fontSize:16}}>Alvryn Pay</div><div style={{fontSize:12,color:"rgba(255,255,255,0.8)"}}>256-bit SSL</div></div>
      <div style={{padding:"24px"}}>
        <div style={{textAlign:"center",padding:"14px",borderRadius:14,background:"#f0eeff",border:`1px solid ${ACCENT}18`,marginBottom:20}}>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#aaa",marginBottom:4,letterSpacing:"0.12em"}}>TOTAL AMOUNT</div>
          {discount>0&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#aaa",textDecoration:"line-through"}}>Rs.{base.toLocaleString()}</div>}
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:900,fontSize:28,color:ACCENT}}>Rs.{total.toLocaleString()}</div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#aaa",marginTop:3}}>{flight.from_city} to {flight.to_city} · {passengers} pax · {cabinClass}{seats&&seats.length>0&&` · Seats: ${seats.join(", ")}`}</div>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,color:"#aaa",marginBottom:7,letterSpacing:"0.08em"}}>PROMO CODE</div>
          <div style={{display:"flex",gap:8}}>
            <input value={promoCode} onChange={e=>{setPromoCode(e.target.value.toUpperCase());setPromoMsg({type:"",text:""});setDiscount(0);}} placeholder="Enter code (e.g. ALVRYN100)"
              style={{flex:1,padding:"11px 14px",borderRadius:11,fontSize:14,fontFamily:"'DM Sans',sans-serif",border:"1.5px solid rgba(0,0,0,0.1)",outline:"none",color:"#0a0a0a",background:"#fafafa"}}/>
            <button onClick={applyPromo} disabled={promoChecking} style={{padding:"11px 18px",borderRadius:11,fontSize:13,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",color:ACCENT,border:`1.5px solid ${ACCENT}44`,background:"#f0eeff"}}>{promoChecking?"...":"Apply"}</button>
          </div>
          {promoMsg.text&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:promoMsg.type==="success"?"#16a34a":"#ef4444",marginTop:6}}>{promoMsg.text}</div>}
        </div>
        {walletBalance>0&&(
          <div style={{marginBottom:16,padding:"12px 14px",borderRadius:12,background:"#f8f8fa",border:"1px solid rgba(0,0,0,0.07)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,color:"#0a0a0a"}}>Wallet Balance</div>
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:12,color:ACCENT}}>Rs.{walletBalance.toLocaleString()} available</div>
            </div>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
              <input type="checkbox" checked={useWallet} onChange={e=>setUseWallet(e.target.checked)} style={{width:16,height:16,accentColor:ACCENT}}/>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,color:"#0a0a0a"}}>Use</span>
            </label>
          </div>
        )}
        <div style={{display:"flex",gap:7,marginBottom:16}}>
          {[["card","Card"],["upi","UPI"],["netbanking","Net Banking"]].map(([id,label])=>(
            <button key={id} onClick={()=>setPayMethod(id)} style={{flex:1,padding:"9px 4px",borderRadius:10,fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",border:payMethod===id?`1.5px solid ${ACCENT}`:"1.5px solid rgba(0,0,0,0.1)",background:payMethod===id?"#f0eeff":"#fafafa",color:payMethod===id?ACCENT:"#999"}}>{label}</button>
          ))}
        </div>
        {payMethod==="card"&&<>
          <div style={{marginBottom:12}}><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:600,color:"#aaa",marginBottom:6,letterSpacing:"0.1em"}}>CARD NUMBER</div><input value={cardNo} onChange={e=>setCardNo(fmtCard(e.target.value))} placeholder="4111 1111 1111 1111" maxLength={19} style={{width:"100%",padding:"12px 14px",borderRadius:11,fontSize:15,fontFamily:"'DM Sans',sans-serif",border:"1.5px solid rgba(0,0,0,0.1)",outline:"none",color:"#0a0a0a",background:"#fafafa"}}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:600,color:"#aaa",marginBottom:6}}>EXPIRY</div><input value={expiry} onChange={e=>setExpiry(fmtExp(e.target.value))} placeholder="MM/YY" maxLength={5} style={{width:"100%",padding:"12px 14px",borderRadius:11,fontSize:15,fontFamily:"'DM Sans',sans-serif",border:"1.5px solid rgba(0,0,0,0.1)",outline:"none",color:"#0a0a0a",background:"#fafafa"}}/></div>
            <div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:600,color:"#aaa",marginBottom:6}}>CVV</div><input type="password" value={cvv} onChange={e=>setCvv(e.target.value.slice(0,3))} placeholder="..." maxLength={3} style={{width:"100%",padding:"12px 14px",borderRadius:11,fontSize:15,fontFamily:"'DM Sans',sans-serif",border:"1.5px solid rgba(0,0,0,0.1)",outline:"none",color:"#0a0a0a",background:"#fafafa"}}/></div>
          </div>
        </>}
        {payMethod==="upi"&&<div style={{marginBottom:12}}><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:600,color:"#aaa",marginBottom:6}}>UPI ID</div><input placeholder="yourname@upi" style={{width:"100%",padding:"12px 14px",borderRadius:11,fontSize:15,fontFamily:"'DM Sans',sans-serif",border:"1.5px solid rgba(0,0,0,0.1)",outline:"none",color:"#0a0a0a",background:"#fafafa"}}/></div>}
        {payMethod==="netbanking"&&<div style={{marginBottom:12}}><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:600,color:"#aaa",marginBottom:6}}>SELECT BANK</div><select style={{width:"100%",padding:"12px 14px",borderRadius:11,fontSize:15,fontFamily:"'DM Sans',sans-serif",border:"1.5px solid rgba(0,0,0,0.1)",outline:"none",color:"#0a0a0a",background:"#fafafa",cursor:"pointer"}}>{["SBI","HDFC Bank","ICICI Bank","Axis Bank","Kotak Bank"].map(b=><option key={b}>{b}</option>)}</select></div>}
        <button onClick={handlePay} style={{width:"100%",padding:"14px",borderRadius:13,fontSize:16,fontWeight:800,fontFamily:"'Syne',sans-serif",color:"#fff",border:"none",cursor:"pointer",background:GRAD,backgroundSize:"200% 200%",animation:"gradShift 3s ease infinite",boxShadow:`0 8px 28px ${ACCENT}44`,marginTop:4}}>Pay Rs.{total.toLocaleString()} →</button>
        <div style={{textAlign:"center",fontSize:11,color:"#ccc",marginTop:10,fontFamily:"'DM Sans',sans-serif"}}>Demo payment - no real money charged</div>
      </div>
    </div></div>
  );
}

function SearchPage(){
  const navigate=useNavigate();
  const [travelType,setTravelType]=useState("flight");
  const [tripType,setTripType]=useState("oneway");
  const [fromCity,setFromCity]=useState(CITIES[0]);
  const [toCity,setToCity]=useState(CITIES[1]);
  const [date,setDate]=useState("");
  const [returnDate,setReturnDate]=useState("");
  const [passengers,setPassengers]=useState(1);
  const [cabinClass,setCabinClass]=useState("Economy");
  const [showFromModal,setShowFromModal]=useState(false);
  const [showToModal,setShowToModal]=useState(false);
  const [mode,setMode]=useState("structured");
  const [aiQuery,setAiQuery]=useState("");
  const [flights,setFlights]=useState([]);
  const [filtered,setFiltered]=useState([]);
  const [loading,setLoading]=useState(false);
  const [searched,setSearched]=useState(false);
  const [aiError,setAiError]=useState("");
  const [bookingFlight,setBookingFlight]=useState(null);
  const [passengerName,setPassengerName]=useState("");
  const [showSeats,setShowSeats]=useState(false);
  const [selectedSeats,setSelectedSeats]=useState([]);
  const [showPayment,setShowPayment]=useState(false);
  const [filterTime,setFilterTime]=useState("any");
  const [filterMaxPrice,setFilterMaxPrice]=useState(20000);
  const [sortBy,setSortBy]=useState("price");
  const [navScrolled,setNavScrolled]=useState(false);
  const [specialFare,setSpecialFare]=useState("regular");
  const [validErr,setValidErr]=useState("");
  const today=new Date().toISOString().split("T")[0];
  let user={};
  try{user=JSON.parse(localStorage.getItem("user")||"{}");}catch(e){user={};}
  const token=localStorage.getItem("token");
  useEffect(()=>{if(!token)navigate("/login");},[token,navigate]);
  useEffect(()=>{fetch(`${API}/test`).catch(()=>{});const t=setInterval(()=>fetch(`${API}/test`).catch(()=>{}),14*60*1000);return()=>clearInterval(t);},[]);
  useEffect(()=>{const fn=()=>setNavScrolled(window.scrollY>30);window.addEventListener("scroll",fn,{passive:true});return()=>window.removeEventListener("scroll",fn);},[]);
  useEffect(()=>{
    let r=[...flights];
    if(filterTime==="morning")r=r.filter(f=>{const h=new Date(f.departure_time).getHours();return h>=5&&h<12;});
    if(filterTime==="afternoon")r=r.filter(f=>{const h=new Date(f.departure_time).getHours();return h>=12&&h<17;});
    if(filterTime==="evening")r=r.filter(f=>{const h=new Date(f.departure_time).getHours();return h>=17;});
    r=r.filter(f=>f.price<=filterMaxPrice);
    if(sortBy==="price")r.sort((a,b)=>a.price-b.price);
    if(sortBy==="price-desc")r.sort((a,b)=>b.price-a.price);
    if(sortBy==="departure")r.sort((a,b)=>new Date(a.departure_time)-new Date(b.departure_time));
    if(sortBy==="duration")r.sort((a,b)=>(new Date(a.arrival_time)-new Date(a.departure_time))-(new Date(b.arrival_time)-new Date(b.departure_time)));
    setFiltered(r);
  },[flights,filterTime,filterMaxPrice,sortBy]);
  const swapCities=useCallback(()=>{setFromCity(toCity);setToCity(fromCity);},[fromCity,toCity]);
  const searchStructured=async()=>{
    setValidErr("");
    if(!date){setValidErr("Please select a departure date");return;}
    setLoading(true);setSearched(true);
    try{const params=new URLSearchParams({from:fromCity.name,to:toCity.name});params.append("date",date);const res=await axios.get(`${API}/flights?${params}`);setFlights(res.data);setFilterMaxPrice(res.data.length>0?Math.max(...res.data.map(f=>f.price))+1000:20000);}
    catch{setFlights([]);}
    setLoading(false);
  };
  const searchAI=async()=>{
    if(!aiQuery.trim())return;
    setAiError("");setLoading(true);setSearched(true);
    try{const res=await axios.post(`${API}/ai-search`,{query:aiQuery});if(res.data.message){setAiError(res.data.message);setFlights([]);}else{setFlights(res.data);setFilterMaxPrice(res.data.length>0?Math.max(...res.data.map(f=>f.price))+1000:20000);}}
    catch(e){setAiError(e.response?.data?.message||"Search failed");setFlights([]);}
    setLoading(false);
  };
  const handleBookClick=flight=>{if(!token){navigate("/login");return;}setBookingFlight(flight);setShowSeats(false);setShowPayment(false);setSelectedSeats([]);};
  const handlePassengerConfirm=name=>{setPassengerName(name);const isDom=fromCity.country==="India"&&toCity.country==="India";if(isDom)setShowSeats(true);else{setSelectedSeats([]);setShowPayment(true);}};
  const TRAVEL_TABS=[{id:"flight",icon:"✈️",label:"Flights",cs:false},{id:"bus",icon:"🚌",label:"Buses",cs:true},{id:"train",icon:"🚂",label:"Trains",cs:true},{id:"hotel",icon:"🏨",label:"Hotels",cs:true},{id:"cab",icon:"🚗",label:"Cabs",cs:true},{id:"pkg",icon:"🌴",label:"Packages",cs:true}];
  const CS_DATA={bus:{icon:"🚌",title:"Bus Booking",desc:"Book AC/Sleeper intercity buses across India. RedBus affiliate — launching with Phase 2."},train:{icon:"🚂",title:"Train Booking",desc:"Indian Railways tickets + PNR. IRCTC integration — coming soon."},hotel:{icon:"🏨",title:"Hotel Booking",desc:"Hotels across India and abroad. Booking.com affiliate — coming with Phase 2."},cab:{icon:"🚗",title:"Cab Booking",desc:"Airport transfers and intercity cabs. Ola/Uber affiliate — coming soon."},pkg:{icon:"🌴",title:"Holiday Packages",desc:"Flights + Hotels + Activities. Travelpayouts — coming with Phase 2."}};
  const SPECIAL_FARES=[{id:"regular",label:"Regular",desc:"Regular fares"},{id:"student",label:"Student",desc:"Extra discounts"},{id:"senior",label:"Senior",desc:"Up to Rs.600 off"},{id:"armed",label:"Armed Forces",desc:"Up to Rs.600 off"},{id:"doctor",label:"Doctor/Nurse",desc:"Special fares"}];
  const isDomestic=fromCity.country==="India"&&toCity.country==="India";
  const lbl={fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:600,color:"#aaa",display:"block",marginBottom:6,letterSpacing:"0.1em"};
  return(
    <div style={{minHeight:"100vh",background:"#f8f8fa",position:"relative",overflowX:"hidden",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{SHARED_CSS}</style>
      <AuroraBackground colors={["#6C63FF","#00C2FF","#a78bfa"]} opacity={0.5}/>
      {showFromModal&&<CityModal title="Select departure city" onSelect={c=>{setFromCity(c);setShowFromModal(false);}} onClose={()=>setShowFromModal(false)} exclude={toCity.code}/>}
      {showToModal&&<CityModal title="Select destination city" onSelect={c=>{setToCity(c);setShowToModal(false);}} onClose={()=>setShowToModal(false)} exclude={fromCity.code}/>}
      {bookingFlight&&!showSeats&&!showPayment&&<PassengerModal flight={bookingFlight} passengers={passengers} onConfirm={handlePassengerConfirm} onCancel={()=>setBookingFlight(null)}/>}
      {bookingFlight&&showSeats&&!showPayment&&<SeatModal flight={bookingFlight} passengers={passengers} onConfirm={s=>{setSelectedSeats(s);setShowSeats(false);setShowPayment(true);}} onCancel={()=>{setShowSeats(false);setBookingFlight(null);}}/>}
      {bookingFlight&&showPayment&&<PaymentModal flight={bookingFlight} passengerName={passengerName} passengers={passengers} cabinClass={cabinClass} seats={selectedSeats} token={token} onSuccess={()=>{setShowPayment(false);setBookingFlight(null);navigate("/bookings");}} onCancel={()=>{setShowPayment(false);setBookingFlight(null);}}/>}
      <nav style={{position:"sticky",top:0,zIndex:200,height:66,padding:"0 5%",display:"flex",alignItems:"center",justifyContent:"space-between",background:navScrolled?"rgba(248,248,250,0.92)":"rgba(248,248,250,0.75)",backdropFilter:"blur(22px)",borderBottom:"1px solid rgba(0,0,0,0.05)",transition:"all 0.3s"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>navigate("/")}>
          <div style={{animation:"floatUD 4s ease-in-out infinite"}}><AlvrynIcon size={38} spin/></div>
          <div><div style={{fontFamily:"'Syne',sans-serif",fontWeight:900,fontSize:16,color:"#0a0a0a",letterSpacing:"-0.04em",lineHeight:1.1}}>ALVRYN</div><div style={{fontFamily:"'Space Mono',monospace",fontSize:7,color:ACCENT,letterSpacing:"0.18em"}}>TRAVEL BEYOND</div></div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>navigate("/bookings")} style={{padding:"8px 16px",borderRadius:10,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:"transparent",color:"#555",border:"1.5px solid rgba(0,0,0,0.12)"}}>Bookings</button>
          <button onClick={()=>navigate("/profile")} style={{padding:"8px 16px",borderRadius:10,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:"#f0eeff",color:ACCENT,border:`1.5px solid ${ACCENT}33`}}>Profile</button>
          <button onClick={()=>{localStorage.removeItem("token");localStorage.removeItem("user");navigate("/login");}} style={{padding:"8px 16px",borderRadius:10,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:"#fff0f0",color:"#e53935",border:"1.5px solid rgba(229,57,53,0.2)"}}>Sign Out</button>
        </div>
      </nav>
      <div style={{position:"relative",zIndex:1,maxWidth:960,margin:"0 auto",padding:"32px 5% 80px"}}>
        <div style={{marginBottom:24,animation:"fadeUp 0.6s both"}}>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:ACCENT,letterSpacing:"0.2em",marginBottom:8}}>SEARCH TRAVEL</div>
          <h1 style={{fontFamily:"'Syne',sans-serif",fontWeight:900,fontSize:"clamp(24px,4vw,42px)",color:"#0a0a0a",marginBottom:4}}>Hey {user.name?.split(" ")[0]||"Traveller"} 👋</h1>
          <p style={{fontSize:15,color:"#888"}}>Where do you want to fly today?</p>
        </div>
        <div style={{display:"flex",gap:0,background:"#fff",borderRadius:"16px 16px 0 0",border:"1px solid rgba(0,0,0,0.07)",borderBottom:"none",overflowX:"auto"}}>
          {TRAVEL_TABS.map((tab,i)=>(
            <button key={tab.id} onClick={()=>{setTravelType(tab.id);setFlights([]);setSearched(false);setValidErr("");}}
              style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"14px 18px",cursor:"pointer",border:"none",borderBottom:travelType===tab.id?`2.5px solid ${ACCENT}`:"2.5px solid transparent",background:"transparent",color:travelType===tab.id?ACCENT:"#aaa",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,transition:"all 0.2s",whiteSpace:"nowrap",borderRadius:i===0?"16px 0 0 0":i===TRAVEL_TABS.length-1?"0 16px 0 0":"0"}}>
              <span style={{fontSize:20}}>{tab.icon}</span>{tab.label}
              {tab.cs&&<span style={{fontSize:7,background:"#fff7ed",border:"1px solid rgba(251,191,36,0.3)",color:"#f59e0b",padding:"1px 4px",borderRadius:5}}>SOON</span>}
            </button>
          ))}
        </div>
        {travelType!=="flight"&&(
          <div style={{background:"#fff",borderRadius:"0 0 20px 20px",padding:"52px 32px",textAlign:"center",boxShadow:"0 4px 20px rgba(0,0,0,0.05)",border:"1px solid rgba(0,0,0,0.07)",borderTop:"none",animation:"fadeUp 0.4s both"}}>
            <div style={{fontSize:56,marginBottom:18}}>{CS_DATA[travelType]?.icon}</div>
            <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:900,fontSize:22,color:"#0a0a0a",marginBottom:10}}>{CS_DATA[travelType]?.title} — Coming Soon</h2>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,color:"#888",lineHeight:1.7,maxWidth:420,margin:"0 auto 18px"}}>{CS_DATA[travelType]?.desc}</p>
            <span style={{display:"inline-block",padding:"7px 18px",borderRadius:20,background:"#f0eeff",border:`1px solid ${ACCENT}22`,fontFamily:"'Space Mono',monospace",fontSize:11,color:ACCENT}}>Phase 2 Feature</span>
          </div>
        )}
        {travelType==="flight"&&(
          <div style={{background:"#fff",borderRadius:"0 0 20px 20px",padding:"22px 26px",boxShadow:"0 4px 20px rgba(0,0,0,0.06)",border:"1px solid rgba(0,0,0,0.07)",borderTop:"none",marginBottom:22}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,flexWrap:"wrap",gap:8}}>
              <div style={{display:"flex",gap:0,background:"#f5f5f5",borderRadius:10,padding:3}}>
                {["oneway","roundtrip"].map(t=>(<button key={t} onClick={()=>setTripType(t)} style={{padding:"7px 16px",border:"none",borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,cursor:"pointer",transition:"all 0.2s",background:tripType===t?"#fff":"transparent",color:tripType===t?"#0a0a0a":"#aaa",boxShadow:tripType===t?"0 2px 6px rgba(0,0,0,0.08)":"none"}}>{t==="oneway"?"One Way":"Round Trip"}</button>))}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:8,background:isDomestic?"#f0fdf4":"#f0f9ff",border:isDomestic?"1px solid #bbf7d0":"1px solid #bae6fd"}}>
                <span style={{fontSize:13}}>{isDomestic?"🇮🇳":"🌍"}</span>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,color:isDomestic?"#16a34a":"#0284c7"}}>{isDomestic?"Domestic · Seat selection included":"International Flight"}</span>
              </div>
            </div>
            <div style={{display:"flex",gap:0,background:"#f5f5f5",borderRadius:10,padding:3,marginBottom:18,width:"fit-content"}}>
              {[["structured","Manual Search"],["ai","AI Search"]].map(([id,label])=>(<button key={id} onClick={()=>{setMode(id);setFlights([]);setSearched(false);setAiError("");setValidErr("");}} style={{padding:"8px 20px",border:"none",borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,cursor:"pointer",transition:"all 0.2s",background:mode===id?"#fff":"transparent",color:mode===id?ACCENT:"#aaa",boxShadow:mode===id?`0 2px 6px rgba(108,99,255,0.12)`:"none"}}>{label}</button>))}
            </div>
            {mode==="structured"&&(
              <>
                <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:10,alignItems:"center",marginBottom:12}}>
                  {[{label:"FROM",city:fromCity,onClick:()=>setShowFromModal(true)},null,{label:"TO",city:toCity,onClick:()=>setShowToModal(true)}].map((item,i)=>item===null?(
                    <button key="swap" onClick={swapCities} style={{width:40,height:40,borderRadius:"50%",background:"#f0eeff",border:`1.5px solid ${ACCENT}25`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:18,color:ACCENT,transition:"transform 0.3s",justifySelf:"center"}} onMouseEnter={e=>e.currentTarget.style.transform="rotate(180deg)"} onMouseLeave={e=>e.currentTarget.style.transform="rotate(0)"}>⇄</button>
                  ):(
                    <div key={item.label} onClick={item.onClick} style={{background:"#fafafa",borderRadius:14,padding:"14px 16px",border:"1.5px solid rgba(0,0,0,0.08)",cursor:"pointer",transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=ACCENT+"55";e.currentTarget.style.background="#f0eeff";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(0,0,0,0.08)";e.currentTarget.style.background="#fafafa";}}>
                      <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#bbb",letterSpacing:"0.15em",marginBottom:4}}>{item.label}</div>
                      <div style={{fontFamily:"'Syne',sans-serif",fontWeight:900,fontSize:26,color:"#0a0a0a",letterSpacing:"0.03em"}}>{item.city.code}</div>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#888",marginTop:2}}>{item.city.name}, {item.city.country}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10,background:"#f0eeff",borderRadius:12,padding:"10px 16px",border:`1px solid ${ACCENT}22`,marginBottom:12,cursor:"pointer"}} onClick={()=>{setMode("ai");setFlights([]);setSearched(false);}}>
                  <span style={{fontSize:18}}>🤖</span>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:ACCENT,fontWeight:600}}>Or type naturally: "flights bangalore to goa tomorrow under 3500"</span>
                  <span style={{marginLeft:"auto",fontFamily:"'Space Mono',monospace",fontSize:11,color:ACCENT}}>Try AI →</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:tripType==="roundtrip"?"1fr 1fr 1fr 1fr":"1fr 1fr 1fr",gap:10,marginBottom:14}}>
                  <div style={{background:"#fafafa",borderRadius:12,padding:"12px 14px",border:`1.5px solid ${!date&&validErr?"#ef4444":"rgba(0,0,0,0.08)"}`}}>
                    <label style={lbl}>DEPARTURE DATE{!date&&<span style={{color:"#ef4444"}}> *</span>}</label>
                    <input type="date" value={date} min={today} onChange={e=>{setDate(e.target.value);setValidErr("");}} style={{background:"transparent",border:"none",outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:600,color:"#0a0a0a",width:"100%",cursor:"pointer"}}/>
                    {date&&<div style={{fontSize:11,color:"#aaa",marginTop:2}}>{new Date(date).toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"})}</div>}
                  </div>
                  {tripType==="roundtrip"&&(<div style={{background:"#fafafa",borderRadius:12,padding:"12px 14px",border:"1.5px solid rgba(0,0,0,0.08)"}}><label style={lbl}>RETURN DATE</label><input type="date" value={returnDate} min={date||today} onChange={e=>setReturnDate(e.target.value)} style={{background:"transparent",border:"none",outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:600,color:"#0a0a0a",width:"100%",cursor:"pointer"}}/></div>)}
                  <div style={{background:"#fafafa",borderRadius:12,padding:"12px 14px",border:"1.5px solid rgba(0,0,0,0.08)"}}>
                    <label style={lbl}>TRAVELLERS</label>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <button onClick={()=>setPassengers(p=>Math.max(1,p-1))} style={{width:28,height:28,borderRadius:"50%",background:"#f0eeff",border:`1px solid ${ACCENT}25`,color:ACCENT,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>-</button>
                      <span style={{fontFamily:"'Syne',sans-serif",fontWeight:900,fontSize:18,color:"#0a0a0a",minWidth:18,textAlign:"center"}}>{passengers}</span>
                      <button onClick={()=>setPassengers(p=>Math.min(9,p+1))} style={{width:28,height:28,borderRadius:"50%",background:"#f0eeff",border:`1px solid ${ACCENT}25`,color:ACCENT,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                    </div>
                  </div>
                  <div style={{background:"#fafafa",borderRadius:12,padding:"12px 14px",border:"1.5px solid rgba(0,0,0,0.08)"}}>
                    <label style={lbl}>CLASS</label>
                    <select value={cabinClass} onChange={e=>setCabinClass(e.target.value)} style={{background:"transparent",border:"none",outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,color:"#0a0a0a",width:"100%",cursor:"pointer"}}>{CLASSES.map(c=><option key={c}>{c}</option>)}</select>
                  </div>
                </div>
                <div style={{marginBottom:14}}>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:600,color:"#aaa",letterSpacing:"0.08em",marginBottom:7}}>SPECIAL FARES</div>
                  <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                    {SPECIAL_FARES.map(sf=>(<button key={sf.id} onClick={()=>setSpecialFare(sf.id)} style={{padding:"6px 12px",borderRadius:9,fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",border:specialFare===sf.id?`1.5px solid ${ACCENT}`:"1.5px solid rgba(0,0,0,0.09)",background:specialFare===sf.id?"#f0eeff":"#fafafa",color:specialFare===sf.id?ACCENT:"#888",transition:"all 0.2s"}}>{sf.label}<span style={{display:"block",fontSize:9,marginTop:1,color:specialFare===sf.id?ACCENT+"99":"#ccc"}}>{sf.desc}</span></button>))}
                  </div>
                </div>
                {validErr&&<div style={{padding:"10px 14px",borderRadius:10,background:"#FFF0F0",border:"1px solid #FFCDD2",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#ef4444",marginBottom:12}}>{validErr}</div>}
              </>
            )}
            {mode==="ai"&&(
              <div style={{marginBottom:14}}>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#888",marginBottom:10,lineHeight:1.5}}>Type naturally — I understand typos, Hindi-English mix, all date styles:</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:12}}>
                  {["flights bangalore to goa tomorrow","blr to del friday cheap","mumbai to delhi kal","goa flights this weekend under 4000"].map(ex=>(<button key={ex} onClick={()=>setAiQuery(ex)} style={{padding:"5px 12px",borderRadius:100,fontSize:12,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:"#f0eeff",border:`1px solid ${ACCENT}22`,color:ACCENT}}>{ex}</button>))}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:12,background:"#fafafa",borderRadius:14,padding:"4px 4px 4px 18px",border:`1.5px solid ${ACCENT}33`,marginBottom:8}}>
                  <span style={{fontSize:18,opacity:0.6}}>🤖</span>
                  <input value={aiQuery} onChange={e=>{setAiQuery(e.target.value);setAiError("");}} onKeyDown={e=>e.key==="Enter"&&searchAI()} placeholder='e.g. "bangalor to goa tmrw under 3500"' style={{flex:1,background:"transparent",border:"none",outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:15,color:"#0a0a0a",padding:"12px 0"}}/>
                </div>
                {aiError&&<div style={{padding:"10px 14px",borderRadius:10,background:"#FFF0F0",border:"1px solid #FFCDD2",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#ef4444"}}>{aiError}</div>}
              </div>
            )}
            <button onClick={mode==="structured"?searchStructured:searchAI} style={{width:"100%",padding:"14px",borderRadius:14,fontSize:15,fontWeight:800,fontFamily:"'Syne',sans-serif",color:"#fff",border:"none",cursor:"pointer",background:GRAD,backgroundSize:"200% 200%",animation:"gradShift 4s ease infinite",boxShadow:`0 8px 28px ${ACCENT}44`,marginTop:2,transition:"transform 0.2s"}} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>{loading?"Searching...":mode==="structured"?"Search Flights":"Search with AI"}</button>
          </div>
        )}
        {loading&&(<div style={{textAlign:"center",padding:"60px 0",animation:"fadeUp 0.4s both"}}><div style={{width:44,height:44,border:`3px solid ${ACCENT}22`,borderTopColor:ACCENT,borderRadius:"50%",animation:"spinSlow 1s linear infinite",margin:"0 auto 16px"}}/><div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,color:ACCENT}}>Scanning flight paths...</div></div>)}
        {!loading&&flights.length>0&&(
          <div style={{background:"#fff",borderRadius:16,padding:"18px 20px",boxShadow:"0 4px 16px rgba(0,0,0,0.05)",border:"1px solid rgba(0,0,0,0.05)",marginBottom:18,animation:"fadeUp 0.4s both"}}>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#bbb",letterSpacing:"0.15em",marginBottom:12}}>FILTER & SORT</div>
            <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:10}}>
              {[["any","All times"],["morning","Morning"],["afternoon","Afternoon"],["evening","Evening"]].map(([v,l])=>(<button key={v} onClick={()=>setFilterTime(v)} style={{padding:"5px 12px",borderRadius:100,fontSize:11,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",border:filterTime===v?`1.5px solid ${ACCENT}`:"1.5px solid rgba(0,0,0,0.08)",background:filterTime===v?"#f0eeff":"#fafafa",color:filterTime===v?ACCENT:"#aaa"}}>{l}</button>))}
              {[["price","Cheapest"],["departure","Earliest"],["duration","Fastest"],["price-desc","Priciest"]].map(([v,l])=>(<button key={v} onClick={()=>setSortBy(v)} style={{padding:"5px 12px",borderRadius:100,fontSize:11,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",border:sortBy===v?`1.5px solid ${ACCENT}`:"1.5px solid rgba(0,0,0,0.08)",background:sortBy===v?"#f0eeff":"#fafafa",color:sortBy===v?ACCENT:"#aaa"}}>{l}</button>))}
            </div>
            <input type="range" min="1000" max={filterMaxPrice+1000} step="500" value={filterMaxPrice} onChange={e=>setFilterMaxPrice(Number(e.target.value))} style={{width:"100%",accentColor:ACCENT}}/>
            <div style={{display:"flex",justifyContent:"space-between",fontFamily:"'Space Mono',monospace",fontSize:10,color:"#bbb",marginTop:5}}><span>Rs.1,000</span><span style={{color:ACCENT}}>Max Rs.{filterMaxPrice.toLocaleString()}</span></div>
          </div>
        )}
        {!loading&&searched&&(
          <>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#bbb",letterSpacing:"0.15em",marginBottom:14}}>{filtered.length>0?`${filtered.length} of ${flights.length} FLIGHTS`:"NO FLIGHTS MATCH"}</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {filtered.map((flight,i)=>(
                <div key={flight.id} style={{background:"#fff",borderRadius:18,padding:"20px 22px",boxShadow:"0 4px 16px rgba(0,0,0,0.05)",border:"1px solid rgba(0,0,0,0.05)",animation:`fadeUp 0.4s ${i*60}ms both`,transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=ACCENT+"44";e.currentTarget.style.transform="translateY(-2px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(0,0,0,0.05)";e.currentTarget.style.transform="translateY(0)";}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:ACCENT}}/>
                      <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:14,color:"#0a0a0a"}}>{flight.airline}</span>
                      <span style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:"#ccc"}}>{flight.flight_no}</span>
                    </div>
                    <div style={{display:"flex",gap:7,alignItems:"center"}}>
                      {isDomestic&&<span style={{padding:"3px 9px",borderRadius:20,fontSize:10,background:"#f0eeff",border:`1px solid ${ACCENT}22`,color:ACCENT,fontFamily:"'Space Mono',monospace"}}>Seats available</span>}
                      <span style={{padding:"3px 9px",borderRadius:20,fontSize:10,background:"rgba(52,211,153,0.1)",border:"1px solid rgba(52,211,153,0.2)",color:"#10b981",fontFamily:"'Space Mono',monospace"}}>Non-stop</span>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                    <div style={{textAlign:"center"}}>
                      <div style={{fontFamily:"'Syne',sans-serif",fontWeight:900,fontSize:22,color:"#0a0a0a"}}>{fmtTime(flight.departure_time)}</div>
                      <div style={{fontFamily:"'Space Mono',monospace",fontSize:12,color:"#bbb",marginTop:2}}>{flight.from_city?.slice(0,3).toUpperCase()}</div>
                      <div style={{fontSize:11,color:"#ccc"}}>{fmtDate(flight.departure_time)}</div>
                    </div>
                    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"0 16px"}}>
                      <span style={{fontSize:12,color:"#bbb",fontFamily:"'DM Sans',sans-serif"}}>{calcDur(flight.departure_time,flight.arrival_time)}</span>
                      <div style={{width:"100%",display:"flex",alignItems:"center",gap:4}}>
                        <div style={{flex:1,height:1,background:`linear-gradient(90deg,${ACCENT}33,${ACCENT}88,${ACCENT}33)`}}/>
                        <span style={{fontSize:12,color:ACCENT}}>✈</span>
                        <div style={{flex:1,height:1,background:`linear-gradient(90deg,${ACCENT}88,${ACCENT}33)`}}/>
                      </div>
                      <span style={{fontSize:11,color:"#10b981",fontFamily:"'DM Sans',sans-serif"}}>Direct</span>
                    </div>
                    <div style={{textAlign:"center"}}>
                      <div style={{fontFamily:"'Syne',sans-serif",fontWeight:900,fontSize:22,color:"#0a0a0a"}}>{fmtTime(flight.arrival_time)}</div>
                      <div style={{fontFamily:"'Space Mono',monospace",fontSize:12,color:"#bbb",marginTop:2}}>{flight.to_city?.slice(0,3).toUpperCase()}</div>
                      <div style={{fontSize:11,color:"#ccc"}}>{fmtDate(flight.arrival_time)}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:14,borderTop:"1px solid rgba(0,0,0,0.05)"}}>
                    <div>
                      <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#ccc",letterSpacing:"0.1em"}}>FROM</div>
                      <div style={{fontFamily:"'Syne',sans-serif",fontWeight:900,fontSize:24,color:ACCENT}}>Rs.{(flight.price*passengers).toLocaleString()}</div>
                      <div style={{fontSize:12,color:"#bbb",fontFamily:"'DM Sans',sans-serif"}}>{passengers} pax · {cabinClass}</div>
                    </div>
                    <button onClick={()=>handleBookClick(flight)} style={{padding:"11px 24px",borderRadius:12,fontSize:14,fontWeight:700,fontFamily:"'Syne',sans-serif",color:"#fff",border:"none",cursor:"pointer",background:GRAD,boxShadow:`0 4px 14px ${ACCENT}44`,transition:"all 0.2s"}} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>Book</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {!loading&&!searched&&(
          <div style={{textAlign:"center",padding:"80px 20px",animation:"fadeUp 0.5s both"}}>
            <div style={{fontSize:64,marginBottom:20,animation:"floatUD 3s ease-in-out infinite"}}>✈️</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:18,color:"#ccc"}}>Your journey starts here</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"#ddd",marginTop:8}}>Search flights above or try AI search</div>
          </div>
        )}
      </div>
    </div>
  );
}

function App(){
  useEffect(()=>{fetch(`${API}/test`).catch(()=>{});const t=setInterval(()=>fetch(`${API}/test`).catch(()=>{}),14*60*1000);return()=>clearInterval(t);},[]);
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