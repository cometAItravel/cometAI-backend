/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";


// ── palette ────────────────────────────────────────────────────────────────────
// ── Alvryn Brand Colors — matches landing page and search page ───────────────
const C = {
  bg:        "#f8f4ec",      // warm cream — matches landing page
  sbBg:      "#f0e8d4",      // sidebar slightly darker cream
  sbBorder:  "rgba(201,168,76,0.25)",
  gold:      "#c9a84c",      // Alvryn primary gold
  goldD:     "#8B6914",      // dark gold for text
  goldL:     "#f0d080",      // light gold highlight
  green:     "#16a34a",      // success green (kept for badges)
  greenD:    "#15803d",
  greenMid:  "#22c55e",
  cardBg:    "rgba(255,255,255,0.95)",   // white cards
  cardBorder:"rgba(201,168,76,0.22)",    // gold border on cards
  inputBg:   "rgba(255,255,255,0.9)",    // white input
  textPri:   "#1a1410",                  // dark text — matches landing page
  textSec:   "#5a4a3a",                  // medium dark
  textMuted: "#a0896a",                  // muted gold-brown
  grad:      "linear-gradient(135deg,#c9a84c,#f0d080,#c9a84c)",
  gradGG:    "linear-gradient(135deg,#c9a84c 0%,#d4aa50 60%,#f0d080 100%)",
  topBar:    "rgba(248,244,236,0.97)",   // cream top bar
  msgBg:     "#f0e8d4",                  // message area bg
};

// ── IATA map (frontend for link building) ─────────────────────────────────────
const IATA = {
  "bangalore":"BLR","bengaluru":"BLR","mumbai":"BOM","bombay":"BOM",
  "delhi":"DEL","new delhi":"DEL","chennai":"MAA","madras":"MAA",
  "hyderabad":"HYD","kolkata":"CCU","goa":"GOI","pune":"PNQ",
  "kochi":"COK","cochin":"COK","ahmedabad":"AMD","jaipur":"JAI",
  "lucknow":"LKO","varanasi":"VNS","banaras":"VNS","trivandrum":"TRV",
  "trivandram":"TRV","thiruvananthapuram":"TRV","coimbatore":"CBE",
  "madurai":"IXM","mangalore":"IXE","mysore":"MYQ","visakhapatnam":"VTZ",
  "vizag":"VTZ","ranchi":"IXR","bhopal":"BHO","nagpur":"NAG",
  "chandigarh":"IXC","guwahati":"GAU","bhubaneswar":"BBI",
  "tirupati":"TIR","leh":"IXL","amritsar":"ATQ","udaipur":"UDR",
  "jodhpur":"JDH","agra":"AGR","patna":"PAT","dehradun":"DED",
  "shimla":"SLV","indore":"IDR",
  "dubai":"DXB","singapore":"SIN","bangkok":"BKK","london":"LHR",
  "new york":"JFK","kuala lumpur":"KUL","colombo":"CMB",
  "paris":"CDG","tokyo":"NRT","sydney":"SYD","doha":"DOH",
  "abu dhabi":"AUH","istanbul":"IST","bali":"DPS","maldives":"MLE",
};
const INDIA = new Set(["BLR","BOM","DEL","MAA","HYD","CCU","GOI","PNQ","COK","AMD","JAI",
  "LKO","VNS","PAT","IXC","GAU","BBI","CBE","IXM","IXE","MYQ","TRV","VTZ","VGA","IXR",
  "BHO","SXR","IXJ","HBX","IXG","TIR","IXL","IXZ","NAG","IDR","RPR","DED","SLV","ATQ","UDR"]);

function flink(from,to,ddmm,pax=1){
  const fc=IATA[from?.toLowerCase()]||from?.slice(0,3).toUpperCase()||"BLR";
  const tc=IATA[to?.toLowerCase()]||to?.slice(0,3).toUpperCase()||"BOM";
  const base=(INDIA.has(fc)&&INDIA.has(tc))?"https://www.aviasales.in":"https://www.aviasales.com";
  return `${base}/search/${fc}${ddmm||""}${tc}${pax}?marker=714667&sub_id=alvryn_ai`;
}

// ── CSS ─────────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html,body{height:100%;overflow:hidden;background:#f8f4ec;}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
@keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
@keyframes spin{to{transform:rotate(360deg);}}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.3;}}
@keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-7px);}}
@keyframes shimmer{0%{background-position:-200% 0;}100%{background-position:200% 0;}}
@keyframes gradShift{0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;}}
@keyframes glow{0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,0);}50%{box-shadow:0 0 18px 2px rgba(201,168,76,0.13);}}
::-webkit-scrollbar{width:3px;}
::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.4);border-radius:3px;}
.sb-btn:hover{background:rgba(201,168,76,0.15)!important;color:#8B6914!important;}
.sb-item:hover{background:rgba(201,168,76,0.07)!important;}
.chip:hover{background:rgba(201,168,76,0.2)!important;border-color:rgba(201,168,76,0.55)!important;color:#1a1410!important;transform:translateY(-1px);}
.travel-card{transition:all 0.18s ease;}
.travel-card:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(201,168,76,0.25),0 0 0 1px rgba(201,168,76,0.3)!important;border-color:rgba(201,168,76,0.45)!important;background:#fff!important;}
.send-btn:hover:not(:disabled){transform:scale(1.08);}
.send-btn:disabled{opacity:0.3;cursor:default;}
textarea:focus{outline:none;}
@media(max-width:768px){
  .sidebar{width:0!important;padding:0!important;overflow:hidden!important;}
  .sidebar.open{width:85vw!important;max-width:280px!important;position:fixed!important;left:0!important;top:0!important;height:100vh!important;z-index:200!important;display:flex!important;flex-direction:column!important;padding:14px 11px!important;overflow:visible!important;}
  .overlay{display:block!important;}
}
.overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.35);z-index:190;}
@media(max-width:480px){
  .travel-card{padding:12px!important;}
  .travel-card .price{font-size:18px!important;}
}
`;

// ── LOGO ────────────────────────────────────────────────────────────────────────
function Logo({size=34}){
  return(
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c9a84c"/><stop offset="55%" stopColor="#f0d080"/><stop offset="100%" stopColor="#4ade80"/>
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" stroke="url(#lg1)" strokeWidth="1.5" fill="none"/>
      <path d="M20 46L28 18L36 46" stroke="url(#lg1)" strokeWidth="2.4" strokeLinecap="round" fill="none"/>
      <path d="M23 37L34 37" stroke="url(#lg1)" strokeWidth="2" strokeLinecap="round"/>
      <path d="M27 46L35 18L43 46" stroke="url(#lg1)" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.4"/>
    </svg>
  );
}

// ── TYPING INDICATOR ────────────────────────────────────────────────────────────
function Typing(){
  return(
    <div style={{display:"flex",alignItems:"center",gap:5,padding:"12px 16px",
      background:"rgba(255,255,255,0.95)",
      borderRadius:"18px 18px 18px 4px",border:"1px solid rgba(201,168,76,0.2)",
      width:"fit-content",backdropFilter:"blur(8px)"}}>
      {[0,1,2].map(i=>(
        <div key={i} style={{width:8,height:8,borderRadius:"50%",
          background:i===1?C.green:C.gold,
          animation:`pulse 1.3s ${i*0.22}s ease-in-out infinite`}}/>
      ))}
    </div>
  );
}


// ── Price Alert Button ────────────────────────────────────────────────────────
function PriceAlertButton({from,to,currentPrice}){
  const [set,setSet]=useState(false);
  const [loading,setLoading]=useState(false);
  const token=localStorage.getItem("token");

  const setAlert=async()=>{
    if(!token){alert("Please sign in to set price alerts");return;}
    setLoading(true);
    try{
      await fetch(`${API}/price-alert`,{
        method:"POST",
        headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},
        body:JSON.stringify({from_city:from,to_city:to,current_price:currentPrice,target_price:currentPrice?Math.round(currentPrice*0.85):null})
      });
      setSet(true);
    }catch{}
    setLoading(false);
  };

  if(set)return <div style={{fontSize:11,color:"#16a34a",fontFamily:"'DM Sans',sans-serif"}}>🔔 Alert set! We'll notify you when prices drop.</div>;
  return(
    <button onClick={setAlert} disabled={loading}
      style={{padding:"6px 14px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",
        background:"rgba(201,168,76,0.08)",border:"1px solid rgba(201,168,76,0.25)",
        color:"#8B6914",fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s"}}
      onMouseEnter={e=>e.currentTarget.style.background="rgba(201,168,76,0.15)"}
      onMouseLeave={e=>e.currentTarget.style.background="rgba(201,168,76,0.08)"}>
      🔔 {loading?"Setting...":"Track Price"}
    </button>
  );
}

const API = "https://cometai-backend.onrender.com";

// ── FLIGHT CARD ─────────────────────────────────────────────────────────────────
function FlightCard({f,i}){
  const LBL = {"Best Price":[C.greenD,"rgba(22,163,74,0.13)"],"Fastest":["#60a5fa","rgba(96,165,250,0.13)"],"Best Overall":[C.goldD,"rgba(201,168,76,0.2)"]};
  const [lc,lb] = LBL[f.label]||[C.gold,"rgba(201,168,76,0.1)"];
  return(
    <div className="travel-card" onClick={()=>window.open(f.link,"_blank","noopener")}
      style={{background:C.cardBg,borderRadius:16,padding:"16px 18px",
        border:"1px solid rgba(201,168,76,0.2)",cursor:"pointer",
        boxShadow:"0 4px 20px rgba(0,0,0,0.2)",marginBottom:10,
        animation:`fadeUp 0.3s ${i*75}ms both`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:10,
            background:"linear-gradient(135deg,rgba(201,168,76,0.18),rgba(74,222,128,0.1))",
            border:`1px solid rgba(201,168,76,0.2)`,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>✈️</div>
          <div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:14,color:C.textPri}}>{f.airline||"Multiple Airlines"}</div>
            {f.insight&&<div style={{fontSize:11,color:C.textMuted,marginTop:2}}>💡 {f.insight}</div>}
          </div>
        </div>
        {f.label&&<span style={{padding:"4px 11px",borderRadius:100,fontSize:10,
          fontFamily:"'Space Mono',monospace",fontWeight:700,color:lc,background:lb,
          border:`1px solid ${lc}33`}}>{f.label}</span>}
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <div style={{textAlign:"center",minWidth:60}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:26,color:C.textPri,lineHeight:1}}>{f.departure||"—"}</div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:C.textMuted,marginTop:3}}>{f.fromCode}</div>
        </div>
        <div style={{flex:1,textAlign:"center",padding:"0 14px"}}>
          <div style={{fontSize:11,color:C.textMuted,marginBottom:4}}>{f.duration||"Direct"}</div>
          <div style={{height:1,background:`linear-gradient(90deg,transparent,${C.gold},${C.green},transparent)`,position:"relative"}}>
            <span style={{position:"absolute",top:-9,left:"50%",transform:"translateX(-50%)",fontSize:14,color:C.gold}}>✈</span>
          </div>
          <div style={{fontSize:10,color:C.greenD,marginTop:4,fontWeight:600}}>DIRECT</div>
        </div>
        <div style={{textAlign:"center",minWidth:60}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:26,color:C.textPri,lineHeight:1}}>{f.arrival||"—"}</div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:C.textMuted,marginTop:3}}>{f.toCode}</div>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
        paddingTop:12,borderTop:`1px solid rgba(201,168,76,0.1)`}}>
        <div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:C.textMuted,marginBottom:3,letterSpacing:"0.1em"}}>APPROX FROM</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:24,color:C.gold,lineHeight:1}}>
            {f.price?`₹${f.price.toLocaleString()}`:"Live rates"}
          </div>
          {f.price&&<div style={{fontSize:10,color:C.textMuted,marginTop:2}}>–₹{Math.round(f.price*1.22).toLocaleString()} · may vary</div>}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:7,alignItems:"flex-end"}}>
          <div style={{padding:"10px 20px",borderRadius:12,
            background:C.grad,backgroundSize:"200% 200%",animation:"gradShift 3s ease infinite",
            fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:14,color:"#1a1410",
            letterSpacing:"0.04em",cursor:"pointer",boxShadow:"0 4px 14px rgba(201,168,76,0.28)"}}>
            Compare & Book Best Price →
          </div>
          {f.from&&f.to&&(
            <PriceAlertButton from={f.from} to={f.to} currentPrice={f.price}/>
          )}
        </div>
      </div>
    </div>
  );
}

// ── BUS CARD ────────────────────────────────────────────────────────────────────
function BusCard({b,i}){
  return(
    <div className="travel-card" onClick={()=>window.open(b.link,"_blank","noopener")}
      style={{background:C.cardBg,borderRadius:16,padding:"16px 18px",
        border:"1px solid rgba(34,197,94,0.15)",cursor:"pointer",
        boxShadow:"0 4px 20px rgba(0,0,0,0.2)",marginBottom:10,
        animation:`fadeUp 0.3s ${i*75}ms both`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:10,background:"rgba(34,197,94,0.12)",
            border:"1px solid rgba(34,197,94,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🚌</div>
          <div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:14,color:C.textPri}}>{b.operator}</div>
            <div style={{fontSize:11,color:C.textMuted,marginTop:2}}>{b.type}</div>
          </div>
        </div>
        {b.label&&<span style={{padding:"4px 11px",borderRadius:100,fontSize:10,
          fontFamily:"'Space Mono',monospace",fontWeight:700,color:C.greenD,
          background:"rgba(22,163,74,0.13)",border:"1px solid rgba(22,163,74,0.25)"}}>{b.label}</span>}
      </div>
      {b.insight&&<div style={{fontSize:12,color:"rgba(201,168,76,0.75)",marginBottom:10,
        padding:"7px 11px",borderRadius:9,background:"rgba(201,168,76,0.06)",
        border:"1px solid rgba(201,168,76,0.1)"}}>💡 {b.insight}</div>}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:22,color:"#fff"}}>{b.departure}</div>
          <div style={{fontSize:11,color:C.textMuted,marginTop:2}}>{b.from}</div>
        </div>
        <div style={{flex:1,textAlign:"center",padding:"0 12px"}}>
          <div style={{fontSize:11,color:C.textMuted,marginBottom:4}}>{b.duration||"Direct"}</div>
          <div style={{height:1,background:"linear-gradient(90deg,transparent,rgba(34,197,94,0.5),transparent)",position:"relative"}}>
            <span style={{position:"absolute",top:-9,left:"50%",transform:"translateX(-50%)",fontSize:14}}>🚌</span>
          </div>
          <div style={{fontSize:10,color:C.greenD,marginTop:4,fontWeight:600}}>DIRECT</div>
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:22,color:"#fff"}}>{b.arrival}</div>
          <div style={{fontSize:11,color:C.textMuted,marginTop:2}}>{b.to}</div>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
        paddingTop:12,borderTop:"1px solid rgba(34,197,94,0.1)"}}>
        <div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:C.textMuted,marginBottom:3,letterSpacing:"0.1em"}}>APPROX FROM</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:22,color:C.greenD}}>₹{b.price?.toLocaleString()||"—"}</div>
        </div>
        <div style={{padding:"10px 20px",borderRadius:12,
          background:"linear-gradient(135deg,rgba(22,163,74,0.2),rgba(74,222,128,0.15))",
          border:"1px solid rgba(34,197,94,0.3)",
          fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:13,color:C.greenMid,cursor:"pointer"}}>
          View on RedBus →
        </div>
      </div>
    </div>
  );
}

// ── HOTEL CARD ──────────────────────────────────────────────────────────────────
function HotelCard({h,i}){
  return(
    <div className="travel-card" onClick={()=>window.open(h.link,"_blank","noopener")}
      style={{background:C.cardBg,borderRadius:16,padding:"16px 18px",
        border:"1px solid rgba(251,146,60,0.15)",cursor:"pointer",
        boxShadow:"0 4px 20px rgba(0,0,0,0.2)",marginBottom:10,
        animation:`fadeUp 0.3s ${i*75}ms both`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:10,background:"rgba(251,146,60,0.1)",
            border:"1px solid rgba(251,146,60,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🏨</div>
          <div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:14,color:C.textPri}}>Hotels in {h.city}</div>
            <div style={{display:"flex",gap:1,marginTop:3,alignItems:"center"}}>
              {"★★★★".split("").map((_,j)=><span key={j} style={{color:C.gold,fontSize:12}}>★</span>)}
              <span style={{fontSize:11,color:C.textMuted,marginLeft:5}}>& above</span>
            </div>
          </div>
        </div>
        {h.label&&<span style={{padding:"4px 11px",borderRadius:100,fontSize:10,
          fontFamily:"'Space Mono',monospace",fontWeight:700,color:"#fb923c",
          background:"rgba(251,146,60,0.12)",border:"1px solid rgba(251,146,60,0.25)"}}>{h.label}</span>}
      </div>
      {h.insight&&<div style={{fontSize:12,color:"rgba(201,168,76,0.75)",marginBottom:10,
        padding:"7px 11px",borderRadius:9,background:"rgba(201,168,76,0.06)"}}>💡 {h.insight}</div>}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
        paddingTop:12,borderTop:"1px solid rgba(251,146,60,0.1)"}}>
        <div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:C.textMuted,marginBottom:3,letterSpacing:"0.1em"}}>APPROX PER NIGHT</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:22,color:"#fb923c"}}>₹{h.priceRange}</div>
        </div>
        <div style={{padding:"10px 20px",borderRadius:12,
          background:"rgba(251,146,60,0.12)",border:"1px solid rgba(251,146,60,0.28)",
          fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:13,color:"#fb923c",cursor:"pointer"}}>
          View Hotels →
        </div>
      </div>
    </div>
  );
}

// ── TRAIN CARD ──────────────────────────────────────────────────────────────────
function TrainCard({t,i}){
  return(
    <div className="travel-card" onClick={()=>window.open(t.link,"_blank","noopener")}
      style={{background:C.cardBg,borderRadius:16,padding:"16px 18px",
        border:"1px solid rgba(139,92,246,0.18)",cursor:"pointer",
        boxShadow:"0 4px 20px rgba(0,0,0,0.2)",marginBottom:10,
        animation:`fadeUp 0.3s ${i*75}ms both`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:10,background:"rgba(139,92,246,0.12)",
            border:"1px solid rgba(139,92,246,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🚂</div>
          <div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:14,color:C.textPri}}>{t.from} → {t.to}</div>
            <div style={{fontSize:11,color:C.textMuted,marginTop:2}}>Indian Railways · IRCTC</div>
          </div>
        </div>
        {t.label&&<span style={{padding:"4px 11px",borderRadius:100,fontSize:10,
          fontFamily:"'Space Mono',monospace",fontWeight:700,color:"#a78bfa",
          background:"rgba(139,92,246,0.13)",border:"1px solid rgba(139,92,246,0.25)"}}>{t.label}</span>}
      </div>
      {t.insight&&<div style={{fontSize:12,color:"rgba(201,168,76,0.75)",marginBottom:10,
        padding:"7px 11px",borderRadius:9,background:"rgba(201,168,76,0.06)"}}>💡 {t.insight}</div>}
      {t.date&&<div style={{fontSize:12,color:"rgba(139,92,246,0.85)",marginBottom:10,
        padding:"7px 11px",borderRadius:9,background:"rgba(139,92,246,0.07)",
        border:"1px solid rgba(139,92,246,0.15)"}}>📅 Date pre-filled: {t.date}</div>}
      <div style={{display:"flex",justifyContent:"flex-end",paddingTop:12,borderTop:"1px solid rgba(139,92,246,0.1)"}}>
        <div style={{padding:"10px 20px",borderRadius:12,
          background:"rgba(139,92,246,0.12)",border:"1px solid rgba(139,92,246,0.28)",
          fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:13,color:"#a78bfa",cursor:"pointer"}}>
          Search on IRCTC →
        </div>
      </div>
    </div>
  );
}

// ── INFO / TEXT CARD (for local transport answers etc) ──────────────────────────
function InfoCard({text,i}){
  return(
    <div style={{background:"rgba(201,168,76,0.06)",borderRadius:14,padding:"14px 16px",
      border:"1px solid rgba(201,168,76,0.15)",marginBottom:10,
      animation:`fadeUp 0.3s ${(i||0)*75}ms both`}}>
      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:C.textPri,lineHeight:1.7,whiteSpace:"pre-wrap"}}>
        {text}
      </div>
    </div>
  );
}

// ── AI MESSAGE BUBBLE ────────────────────────────────────────────────────────────
function AiMsg({m}){
  return(
    <div style={{display:"flex",gap:12,marginBottom:24,animation:"fadeUp 0.25s both"}}>
      {/* Avatar */}
      <div style={{flexShrink:0,width:34,height:34,borderRadius:"50%",
        background:C.grad,
        border:`1.5px solid rgba(201,168,76,0.35)`,
        display:"flex",alignItems:"center",justifyContent:"center",marginTop:2}}>
        <Logo size={22}/>
      </div>
      <div style={{flex:1,minWidth:0}}>
        {/* Destination image */}
        {m.image&&(
          <div style={{marginBottom:14,borderRadius:12,overflow:"hidden",boxShadow:"0 4px 16px rgba(0,0,0,0.08)"}}>
            <img src={m.image.url} alt={m.image.caption||"destination"}
              style={{width:"100%",height:160,objectFit:"cover",display:"block"}}
              onError={e=>{e.target.parentElement.style.display="none";}}/>
            {m.image.caption&&<div style={{background:"rgba(201,168,76,0.06)",padding:"6px 10px",
              fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#8B6914",fontStyle:"italic"}}>
              📷 {m.image.caption}
            </div>}
          </div>
        )}
        {/* Text */}
        {m.text&&(
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,color:C.textPri,
            lineHeight:1.8,marginBottom:m.cards?.length?16:0,whiteSpace:"pre-wrap"}}>
            {m.text}
          </div>
        )}
        {/* Cards */}
        {m.cards?.filter(c=>c.type==="flight").map((c,i)=><FlightCard key={i} f={c} i={i}/>)}
        {m.cards?.filter(c=>c.type==="bus").map((c,i)=><BusCard key={i} b={c} i={i}/>)}
        {m.cards?.filter(c=>c.type==="hotel").map((c,i)=><HotelCard key={i} h={c} i={i}/>)}
        {m.cards?.filter(c=>c.type==="train").map((c,i)=><TrainCard key={i} t={c} i={i}/>)}
        {/* Disclaimer */}
        {m.cards?.length>0&&(
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.textMuted,marginTop:6}}>
            Prices shown are approximate and may vary. Tap any card to check live availability.
          </div>
        )}
        {/* CTA nudge */}
        {m.cta&&(
          <div style={{marginTop:14,padding:"10px 14px",borderRadius:10,
            background:"linear-gradient(135deg,rgba(201,168,76,0.1),rgba(201,168,76,0.05))",
            border:"1px solid rgba(201,168,76,0.25)",
            fontFamily:"'DM Sans',sans-serif",fontSize:13,color:`rgba(201,168,76,0.88)`,fontStyle:"italic"}}>
            {m.cta}
          </div>
        )}
        {(m.sectionNum||m.totalSections)&&<SectionProgress current={m.sectionNum} total={m.totalSections}/>}
        {m.quickReplies?.length>0&&<QuickReplies replies={m.quickReplies} onSend={m._onSend} showInput={m.showTextInput}/>}
        {m.showMindMap&&m.tripSummary&&<TripMindMap tripSummary={m.tripSummary}/>}
        {m.tripSummary&&<ShareTripCard tripSummary={m.tripSummary}/>}
      </div>
    </div>
  );
}

// ── USER MESSAGE BUBBLE ──────────────────────────────────────────────────────────
function UserMsg({m}){
  return(
    <div style={{display:"flex",justifyContent:"flex-end",marginBottom:20,animation:"fadeIn 0.2s both"}}>
      <div style={{maxWidth:"70%",padding:"12px 18px",
        borderRadius:"20px 20px 4px 20px",
        background:C.grad,backgroundSize:"200% 200%",animation:"gradShift 4s ease infinite",
        fontFamily:"'DM Sans',sans-serif",fontSize:15,color:"#1a1410",
        fontWeight:500,lineHeight:1.65,boxShadow:"0 4px 16px rgba(201,168,76,0.2)"}}>
        {m.content}
      </div>
    </div>
  );
}

// ── EMPTY STATE ──────────────────────────────────────────────────────────────────
function EmptyState({onChip}){
  const chips=[
    "✈️ Cheapest flight Bangalore to Delhi tomorrow",
    "🚌 Bus Chennai to Hyderabad tonight",
    "🏨 Hotels in Goa under ₹2000 per night",
    "🚂 Train Delhi to Mumbai this weekend",
    "🗺️ Plan a 2-day trip under ₹5000 from Bangalore",
    "⚡ Fastest way from Bangalore to Mumbai",
    "🌍 Flights to Dubai next month under ₹15000",
    "🏖️ Best time to visit Goa — flights + hotels",
  ];
  return(
    <div style={{textAlign:"center",paddingTop:"8vh",animation:"fadeUp 0.5s both"}}>
      <div style={{animation:"float 4s ease-in-out infinite",display:"inline-block",marginBottom:22}}>
        <Logo size={58}/>
      </div>
      <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:300,
        fontSize:"clamp(28px,5vw,52px)",color:"#fff",marginBottom:12,lineHeight:1.05,
        background:C.gradGG,backgroundClip:"text",WebkitBackgroundClip:"text",
        WebkitTextFillColor:"transparent",backgroundSize:"200% 200%",animation:"gradShift 4s ease infinite"}}>
        Where do you want to go?
      </h1>
      <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:16,color:C.textSec,
        marginBottom:40,lineHeight:1.75,maxWidth:460,margin:"0 auto 40px"}}>
        Flights · Buses · Hotels · Trains · Trip planning<br/>
        <span style={{fontSize:13,color:C.textMuted}}>Any language. Any route. Typos? No problem. 😄</span>
      </p>
      <div style={{display:"flex",flexWrap:"wrap",gap:9,justifyContent:"center",
        maxWidth:640,margin:"0 auto"}}>
        {chips.map((s,i)=>(
          <button key={i} className="chip" onClick={()=>onChip(s)}
            style={{padding:"9px 16px",borderRadius:100,fontSize:13,cursor:"pointer",
              background:"rgba(201,168,76,0.08)",border:"1px solid rgba(201,168,76,0.25)",
              color:C.textSec,transition:"all 0.18s",fontFamily:"'DM Sans',sans-serif",fontWeight:500,
              animation:`fadeUp 0.35s ${i*50}ms both`}}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────────────────────────────



// ── Chat sidebar item with 3-dot menu ────────────────────────────────────────
function ChatSidebarItem({chat,isActive,onLoad,onRename,onDelete}){
  const [menuOpen,setMenuOpen]=useState(false);
  const [renaming,setRenaming]=useState(false);
  const [renameVal,setRenameVal]=useState(chat.title);

  return(
    <div style={{position:"relative",marginBottom:2}}>
      <div className="sb-item" onClick={()=>{if(!menuOpen&&!renaming)onLoad();}}
        style={{padding:"9px 12px",borderRadius:9,cursor:"pointer",
          background:isActive?"rgba(201,168,76,0.11)":"transparent",
          border:isActive?"1px solid rgba(201,168,76,0.28)":"1px solid transparent",
          display:"flex",alignItems:"center",gap:6,transition:"all 0.14s"}}>
        <div style={{flex:1,minWidth:0}}>
          {renaming?(
            <input value={renameVal} autoFocus onChange={e=>setRenameVal(e.target.value)}
              onBlur={()=>{onRename(chat.id,renameVal.trim()||chat.title);setRenaming(false);}}
              onKeyDown={e=>{if(e.key==="Enter"){onRename(chat.id,renameVal.trim()||chat.title);setRenaming(false);}if(e.key==="Escape")setRenaming(false);}}
              onClick={e=>e.stopPropagation()}
              style={{width:"100%",background:"rgba(255,255,255,0.9)",border:"1px solid rgba(201,168,76,0.4)",
                borderRadius:5,padding:"2px 6px",fontSize:12,color:"#1a1410",outline:"none",fontFamily:"'DM Sans',sans-serif"}}/>
          ):(
            <div style={{fontSize:13,color:"#1a1410",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{chat.title}</div>
          )}
          <div style={{fontSize:10,color:"#a0896a",marginTop:2}}>{new Date(chat.time).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</div>
        </div>
        {/* 3-dot button */}
        <button onClick={e=>{e.stopPropagation();setMenuOpen(s=>!s);}}
          style={{flexShrink:0,width:24,height:24,borderRadius:5,background:"transparent",border:"none",
            cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
            color:"#a0896a",fontSize:14,opacity:isActive?1:0,transition:"opacity 0.15s"}}
          onMouseEnter={e=>{e.currentTarget.style.opacity="1";e.currentTarget.style.background="rgba(201,168,76,0.15)";}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent";if(!isActive)e.currentTarget.style.opacity="0";}}>
          ⋯
        </button>
      </div>
      {/* Dropdown menu */}
      {menuOpen&&(
        <div onClick={e=>e.stopPropagation()}
          style={{position:"absolute",right:0,top:34,zIndex:100,
            background:"#fff",borderRadius:10,padding:"4px 0",
            boxShadow:"0 8px 28px rgba(0,0,0,0.15)",border:"1px solid rgba(201,168,76,0.2)",
            minWidth:130}}>
          <button onClick={()=>{setRenaming(true);setMenuOpen(false);}}
            style={{display:"block",width:"100%",padding:"9px 14px",textAlign:"left",
              background:"none",border:"none",cursor:"pointer",fontSize:13,
              fontFamily:"'DM Sans',sans-serif",color:"#1a1410"}}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(201,168,76,0.08)"}
            onMouseLeave={e=>e.currentTarget.style.background="none"}>
            ✏️ Rename
          </button>
          <button onClick={()=>{onDelete(chat.id);setMenuOpen(false);}}
            style={{display:"block",width:"100%",padding:"9px 14px",textAlign:"left",
              background:"none",border:"none",cursor:"pointer",fontSize:13,
              fontFamily:"'DM Sans',sans-serif",color:"#ef4444"}}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(239,68,68,0.06)"}
            onMouseLeave={e=>e.currentTarget.style.background="none"}>
            🗑️ Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ── Renameable chat title ─────────────────────────────────────────────────────
function RenameableTitle({chat, onRename}){
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(chat.title);
  if(editing) return(
    <input value={val} autoFocus
      onChange={e=>setVal(e.target.value)}
      onBlur={()=>{onRename(chat.id,val.trim()||chat.title);setEditing(false);}}
      onKeyDown={e=>{if(e.key==="Enter"){onRename(chat.id,val.trim()||chat.title);setEditing(false);}if(e.key==="Escape")setEditing(false);}}
      style={{width:"100%",background:"rgba(255,255,255,0.9)",border:"1px solid rgba(201,168,76,0.4)",
        borderRadius:5,padding:"2px 6px",fontSize:12,color:"#1a1410",outline:"none",fontFamily:"'DM Sans',sans-serif"}}
    />
  );
  return(
    <div onDoubleClick={()=>setEditing(true)} title="Double-click to rename"
      style={{fontSize:13,color:"#1a1410",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",cursor:"text"}}>
      {chat.title}
    </div>
  );
}

// ── Smart chat title generator ────────────────────────────────────────────────
function smartChatTitle(firstMsg, messages) {
  const m = firstMsg.toLowerCase().trim();
  // Greeting → look at second user message for real intent
  const isGreeting = /^(hi+|hello+|hey+|hlo+|heyy*|namaste|hai|sup)$/.test(m) || m.length <= 4;
  if (isGreeting) {
    // Find first non-greeting user message
    const realMsg = messages.find(msg => msg.role==="user" && msg.content.toLowerCase().trim() !== m);
    if (realMsg) return smartChatTitle(realMsg.content, []);
    return "New conversation";
  }
  // City pair → "Bangalore → New York"
  const cities = m.match(/([a-z]+)\s+to\s+([a-z]+)/);
  if (cities) {
    const c1 = cities[1].charAt(0).toUpperCase()+cities[1].slice(1);
    const c2 = cities[2].charAt(0).toUpperCase()+cities[2].slice(1);
    return `${c1} → ${c2}`;
  }
  // Intent detection
  if (/hotel|stay|room/i.test(m)) {
    const city = m.match(/in\s+([a-z]+)/)?.[1];
    return city ? `Hotels in ${city.charAt(0).toUpperCase()+city.slice(1)}` : "Hotel Search";
  }
  if (/flight|fly/i.test(m)) return "Flight Search";
  if (/bus|coach/i.test(m))  return "Bus Search";
  if (/train|irctc/i.test(m)) return "Train Search";
  if (/trip|plan|visit|tour/i.test(m)) {
    const city = m.match(/(?:to|visit|trip to|going to)\s+([a-z]+)/)?.[1];
    return city ? `Trip to ${city.charAt(0).toUpperCase()+city.slice(1)}` : "Trip Planning";
  }
  // Default: truncate
  return firstMsg.slice(0,36)+(firstMsg.length>36?"…":"");
}

export default function AIChatPage(){
  const navigate = useNavigate();
  const [chats,setChats]     = useState([]);
  const [chatsLoaded,setChatsLoaded] = useState(false);
  const [activeId,setActiveId] = useState(null);
  const [messages,setMessages] = useState([]);
  const [input,setInput]     = useState("");
  const [loading,setLoading] = useState(false);
  const [sbOpen,setSbOpen]   = useState(window.innerWidth>768);
  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);
  const textareaRef = useRef(null);
  const sessionIdRef = useRef(sessionStorage.getItem("alvryn_sid")||null);

  let user={};
  try{ user=JSON.parse(localStorage.getItem("user")||"{}"); }catch{}
  const token = localStorage.getItem("token");

  // Auth gate
  useEffect(()=>{ if(!token) navigate("/login"); },[token,navigate]);
  // Auto scroll
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[messages,loading]);
  // Persist chats
  useEffect(()=>{ try{localStorage.setItem("alvryn_chats",JSON.stringify(chats.slice(0,30)));}catch{} },[chats]);
  // Keep backend alive
  useEffect(()=>{
    fetch(`${API}/test`).catch(()=>{});
    const t=setInterval(()=>fetch(`${API}/test`).catch(()=>{}),14*60*1000);
    return ()=>clearInterval(t);
  },[]);

  // ── LOAD CHATS FROM DB (cross-device sync) ────────────────────────────────
  useEffect(()=>{
    if(!token) return;
    // First load from localStorage immediately (instant display)
    try{
      const local=JSON.parse(localStorage.getItem("alvryn_chats")||"[]");
      if(local.length>0) setChats(local);
    }catch{}
    // Then sync from DB (authoritative)
    fetch(`${API}/chats`,{headers:{Authorization:`Bearer ${token}`}})
      .then(r=>{if(!r.ok)throw new Error(r.status);return r.json();})
      .then(data=>{
        if(!Array.isArray(data)||!data.length) return;
        const mapped=data.map(c=>({
          id:c.chat_id,
          title:c.title||"New chat",
          messages:(Array.isArray(c.messages)?c.messages:[]).map(m=>({
            ...m,
            id:m.id||m.time||Date.now(),
            role:m.role||"user",
            content:m.content||m.text||""
          })),
          time:new Date(c.updated_at||c.created_at).getTime()
        }));
        setChats(mapped);
        // Update localStorage with DB version
        localStorage.setItem("alvryn_chats",JSON.stringify(mapped.slice(0,30)));
      })
      .catch(()=>{}); // Silently fall back to localStorage version
  },[token]);

  const newChat = useCallback(()=>{
    setActiveId(Date.now().toString());
    setMessages([]);
    setInput("");
    setTimeout(()=>inputRef.current?.focus(),100);
  },[]);

  const loadChat = useCallback((chat)=>{
    setActiveId(chat.id);
    setMessages(chat.messages||[]);
  },[]);

  const saveChat = useCallback((id,msgs,firstMsgTitle)=>{
    const chatTitle = firstMsgTitle || "New chat";
    // Update local state immediately
    setChats(prev=>{
      const ex = prev.find(c=>c.id===id);
      const title = ex?.title || chatTitle;
      if(ex) return prev.map(c=>c.id===id?{...c,messages:msgs,time:Date.now()}:c);
      return [{id,title,messages:msgs,time:Date.now()},...prev].slice(0,50);
    });
    // Always save to localStorage as immediate backup
    try{
      const stored = JSON.parse(localStorage.getItem("alvryn_chats")||"[]");
      const filtered = stored.filter(c=>c.id!==id);
      const title = stored.find(c=>c.id===id)?.title || chatTitle;
      localStorage.setItem("alvryn_chats",JSON.stringify([{id,title,messages:msgs,time:Date.now()},...filtered].slice(0,30)));
    }catch{}
    // Also sync to DB
    if(token){
      const storedChats = JSON.parse(localStorage.getItem("alvryn_chats")||"[]");
      const title = storedChats.find(c=>c.id===id)?.title || chatTitle;
      fetch(`${API}/chats/${id}`,{
        method:"POST",
        headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},
        body:JSON.stringify({
          title,
          messages:msgs.slice(0,100).map(m=>({
            role:m.role,content:m.content||"",
            text:m.text||"",cards:(m.cards||[]).slice(0,5),
            id:m.id,image:m.image||null,
            quickReplies:m.quickReplies||[],
            cta:m.cta||null,sectionNum:m.sectionNum||null,
            totalSections:m.totalSections||null
          }))
        })
      }).catch(()=>{}); // Ignore DB errors — localStorage is the fallback
    }
  },[token]);

  const send = useCallback(async(text)=>{
    const q = (text||input).trim();
    if(!q||loading) return;
    setInput("");
    // Reset textarea height
    if(textareaRef.current){ textareaRef.current.style.height="auto"; }

    const id = activeId||Date.now().toString();
    if(!activeId) setActiveId(id);

    const uMsg = {role:"user",content:q,id:Date.now()};
    const next = [...messages,uMsg];
    setMessages(next);
    setLoading(true);

    try{
      const res = await fetch(`${API}/ai-chat-v2`,{
        method:"POST",
        headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},
        body:JSON.stringify({message:q,history:messages.slice(-6),sessionId:sessionIdRef.current}),
      });
      const data = await res.json();
      if (data.sessionId) { sessionIdRef.current = data.sessionId; sessionStorage.setItem("alvryn_sid", data.sessionId); }
      const aMsg = {role:"assistant",id:Date.now()+1,text:data.text||"",cards:data.cards||[],cta:data.cta||null,quickReplies:data.quickReplies||[],tripSummary:data.tripSummary||null,showMindMap:data.showMindMap||false,sectionNum:data.sectionNum||null,totalSections:data.totalSections||null,image:data.image||null,showTextInput:data.showTextInput||null,_onSend:send};
      const final = [...next,aMsg];
      setMessages(final);
      // Title = first user message only, updates same chat entry
      const chatTitle = next[0]?.content?.slice(0,44)+(next[0]?.content?.length>44?"…":"") || "New chat";
      saveChat(id,final,chatTitle);
    }catch{
      const errMsg = {role:"assistant",id:Date.now()+1,
        text:"Sorry, I'm having trouble right now. Please try again in a moment. 🙏",
        cards:[],cta:null};
      setMessages([...next,errMsg]);
    }
    setLoading(false);
    setTimeout(()=>inputRef.current?.focus(),80);
  },[input,loading,messages,token,activeId,saveChat]);

  const handleKey = (e)=>{
    if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); send(); }
  };
  const handleInput = (e)=>{
    setInput(e.target.value);
    if(textareaRef.current){
      textareaRef.current.style.height="auto";
      textareaRef.current.style.height=Math.min(textareaRef.current.scrollHeight,160)+"px";
    }
  };

  const empty = messages.length===0;
  const chatTitle = chats.find(c=>c.id===activeId)?.title||"New Chat";

  return(
    <div style={{display:"flex",height:"100vh",background:C.bg,overflow:"hidden",
      fontFamily:"'DM Sans',sans-serif"}}>
      <style>{CSS}</style>

      {/* ══════════════════ SIDEBAR ══════════════════ */}
      {sbOpen&&<div className="overlay" onClick={()=>setSbOpen(false)}/>}
      <div className={`sidebar${sbOpen?" open":""}`}
        style={{width:sbOpen?260:0,flexShrink:0,
          background:C.sbBg,borderRight:"1px solid rgba(201,168,76,0.2)",
          display:"flex",flexDirection:"column",
          overflow:"hidden",transition:"width 0.22s ease",
          boxShadow:sbOpen?"4px 0 24px rgba(0,0,0,0.3)":"none"}}>
        {sbOpen&&(
          <div style={{display:"flex",flexDirection:"column",height:"100%",padding:"14px 10px"}}>

            {/* Logo */}
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"6px 8px 18px",
              cursor:"pointer",borderBottom:"1px solid rgba(201,168,76,0.3)",marginBottom:14}}
              onClick={()=>navigate("/")}>
              <div style={{animation:"float 4s ease-in-out infinite"}}><Logo size={28}/></div>
              <div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:15,
                  color:"#fff",letterSpacing:"0.12em"}}>ALVRYN</div>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:7,
                  color:C.gold,letterSpacing:"0.2em"}}>AI TRAVEL</div>
              </div>
            </div>

            {/* New Chat */}
            <button onClick={newChat}
              style={{display:"flex",alignItems:"center",gap:9,padding:"10px 14px",
                borderRadius:11,background:C.grad,backgroundSize:"200% 200%",
                animation:"gradShift 4s ease infinite",border:"none",cursor:"pointer",
                color:"#1a1410",fontFamily:"'DM Sans',sans-serif",fontWeight:700,
                fontSize:13,marginBottom:16,width:"100%",
                boxShadow:"0 4px 18px rgba(201,168,76,0.35)"}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a1410" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Chat
            </button>

            {/* History */}
            <div style={{flex:1,overflowY:"auto",marginBottom:8}}>
              {chats.length>0&&(
                <>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,
                    color:"#a0896a",letterSpacing:"0.15em",marginBottom:8,paddingLeft:8}}>
                    RECENT
                  </div>
                  {chats.slice(0,30).map(chat=>(
                    <ChatSidebarItem key={chat.id} chat={chat}
                      isActive={activeId===chat.id}
                      onLoad={()=>loadChat(chat)}
                      onRename={(id,t)=>renameChat(id,t)}
                      onDelete={(id)=>deleteChat(id)}/>
                  ))}
                </>
              )}
            </div>

            {/* User info */}
            <div style={{borderTop:`1px solid ${C.sbBorder}`,paddingTop:12}}>
              <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:10,padding:"0 4px"}}>
                <div style={{width:32,height:32,borderRadius:"50%",flexShrink:0,
                  background:C.gradGG,backgroundSize:"200% 200%",animation:"gradShift 5s ease infinite",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:15,color:"#1a1410"}}>
                  {user.name?.charAt(0)?.toUpperCase()||"U"}
                </div>
                <div style={{overflow:"hidden",flex:1}}>
                  <div style={{fontSize:13,color:"#1a1410",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:500}}>{user.name||"Traveller"}</div>
                  <div style={{fontSize:10,color:C.textMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.email||""}</div>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5}}>
                {[["🔍","Search","/search"],["👤","Profile","/profile"],["🏠","Home","/"]].map(([icon,label,path])=>(
                  <button key={path} className="sb-btn" onClick={()=>navigate(path)}
                    style={{padding:"7px 4px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer",
                      background:"rgba(255,255,255,0.04)",color:C.textMuted,
                      border:`1px solid rgba(255,255,255,0.07)`,transition:"all 0.15s",fontFamily:"'DM Sans',sans-serif"}}>
                    {icon}<br/><span style={{fontSize:9}}>{label}</span>
                  </button>
                ))}
              </div>
              <button onClick={()=>{localStorage.removeItem("token");localStorage.removeItem("user");navigate("/login");}}
                style={{marginTop:8,width:"100%",padding:"8px",borderRadius:8,fontSize:12,fontWeight:600,
                  cursor:"pointer",background:"rgba(239,68,68,0.08)",color:"rgba(239,68,68,0.7)",
                  border:"1px solid rgba(239,68,68,0.15)",fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s"}}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(239,68,68,0.14)";}}
                onMouseLeave={e=>{e.currentTarget.style.background="rgba(239,68,68,0.08)";}}>
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════ MAIN AREA ══════════════════ */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>

        {/* Top bar */}
        <div style={{height:54,padding:"0 16px",display:"flex",alignItems:"center",
          justifyContent:"space-between",borderBottom:"1px solid rgba(201,168,76,0.3)",
          flexShrink:0,background:C.topBar,backdropFilter:"blur(12px)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={()=>setSbOpen(s=>!s)}
              style={{width:33,height:33,borderRadius:8,background:"rgba(255,255,255,0.04)",
                border:`1px solid rgba(201,168,76,0.12)`,cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",
                color:C.textSec,transition:"all 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(201,168,76,0.08)";e.currentTarget.style.color=C.gold;}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.04)";e.currentTarget.style.color=C.textSec;}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:16,color:C.goldD}}>
              {empty?"Alvryn AI — Travel Assistant":chatTitle}
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:100,
              background:"linear-gradient(90deg,rgba(201,168,76,0.08),rgba(74,222,128,0.06))",
              border:`1px solid rgba(74,222,128,0.18)`}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:C.green,animation:"pulse 2s infinite"}}/>
              <span style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:C.green,letterSpacing:"0.1em"}}>AI LIVE</span>
            </div>
            <button onClick={newChat}
              style={{padding:"6px 13px",borderRadius:8,background:"rgba(201,168,76,0.08)",
                border:`1px solid rgba(201,168,76,0.2)`,color:C.gold,
                fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
                transition:"all 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(201,168,76,0.14)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(201,168,76,0.08)";}}>
              + New
            </button>
          </div>
        </div>

        {/* ── Messages ── */}
        <div style={{flex:1,overflowY:"auto",padding:"clamp(12px,3vw,24px) clamp(10px,3vw,20px)",background:"#f0e8d4"}}>
          <div style={{maxWidth:740,margin:"0 auto"}}>
            {empty&&<EmptyState onChip={send}/>}
            {messages.map(m=>(
              m.role==="user"
                ? <UserMsg key={m.id} m={m}/>
                : <AiMsg   key={m.id} m={m}/>
            ))}
            {loading&&(
              <div style={{display:"flex",gap:12,marginBottom:20,animation:"fadeIn 0.2s both"}}>
                <div style={{flexShrink:0,width:34,height:34,borderRadius:"50%",
                  background:"linear-gradient(135deg,rgba(201,168,76,0.18),rgba(74,222,128,0.1))",
                  border:`1.5px solid rgba(201,168,76,0.5)`,
                  display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <Logo size={22}/>
                </div>
                <div style={{paddingTop:5}}>
                  <div style={{fontSize:12,color:C.textMuted,marginBottom:7,
                    fontFamily:"'DM Sans',sans-serif",fontStyle:"italic"}}>Alvryn is thinking…</div>
                  <Typing/>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>
        </div>

        {/* ── Input ── */}
        <div style={{padding:"12px 16px 18px",borderTop:`1px solid ${C.sbBorder}`,
          flexShrink:0,background:C.topBar,backdropFilter:"blur(12px)"}}>
          <div style={{maxWidth:740,margin:"0 auto"}}>
            <div style={{display:"flex",alignItems:"flex-end",gap:10,
              background:C.inputBg,borderRadius:16,padding:"10px 14px",
              border:`1.5px solid rgba(201,168,76,0.18)`,
              transition:"border-color 0.2s,box-shadow 0.2s",
              boxShadow:"0 0 0 0 rgba(201,168,76,0)"}}
              onFocusCapture={e=>{
                e.currentTarget.style.borderColor="rgba(201,168,76,0.48)";
                e.currentTarget.style.boxShadow="0 0 0 3px rgba(201,168,76,0.07)";
              }}
              onBlurCapture={e=>{
                e.currentTarget.style.borderColor="rgba(201,168,76,0.22)";
                e.currentTarget.style.boxShadow="0 0 0 0 rgba(201,168,76,0)";
              }}>
              <textarea
                ref={el=>{inputRef.current=el;textareaRef.current=el;}}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKey}
                placeholder="Ask anything…"
                rows={1}
                style={{flex:1,background:"transparent",border:"none",outline:"none",
                  fontFamily:"'DM Sans',sans-serif",fontSize:15,color:C.textPri,
                  resize:"none",lineHeight:1.65,maxHeight:160,overflowY:"auto",
                  paddingTop:2,placeholder:{color:C.textMuted}}}
              />
              <button className="send-btn" onClick={()=>send()}
                disabled={!input.trim()||loading}
                style={{flexShrink:0,width:37,height:37,borderRadius:11,
                  background:input.trim()&&!loading?C.grad:"rgba(255,255,255,0.06)",
                  backgroundSize:"200% 200%",
                  animation:input.trim()&&!loading?"gradShift 3s ease infinite":"none",
                  border:"none",cursor:input.trim()&&!loading?"pointer":"default",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:16,transition:"all 0.18s",
                  boxShadow:input.trim()&&!loading?"0 4px 12px rgba(201,168,76,0.25)":"none"}}>
                {loading
                  ? <div style={{width:15,height:15,border:"2px solid rgba(255,255,255,0.2)",
                      borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={input.trim()?"#1a1410":"#666"} strokeWidth="2.5"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
                }
              </button>
            </div>
            <div style={{textAlign:"center",marginTop:7,fontSize:11,color:"rgba(201,168,76,0.4)",
              fontFamily:"'DM Sans',sans-serif"}}>
              Alvryn AI · Flights · Buses · Hotels · Trains · Bookings on partner sites
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// ── SECTION PROGRESS BAR ─────────────────────────────────────────────────────
function SectionProgress({current,total}){
  if(!current||!total)return null;
  return(
    <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:12,marginTop:8}}>
      {Array.from({length:total},(_,i)=>(
        <div key={i} style={{flex:1,height:4,borderRadius:3,transition:"all 0.4s",
          background:i<current?"linear-gradient(90deg,#c9a84c,#f0d080)":"rgba(201,168,76,0.15)"}}/>
      ))}
      <span style={{fontSize:11,color:"#8B6914",fontFamily:"'Space Mono',monospace",marginLeft:4,whiteSpace:"nowrap"}}>{current}/{total}</span>
    </div>
  );
}

// ── QUICK REPLIES ─────────────────────────────────────────────────────────────
function QuickReplies({replies,onSend,showInput}){
  const [otherText,setOtherText]=useState("");
  if(!replies?.length)return null;
  return(
    <div style={{marginTop:12}}>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:showInput?10:0}}>
      {replies.map((r,i)=>(
        <button key={i} onClick={()=>r.startsWith("Others")?null:onSend(r)}
          style={{padding:"8px 14px",borderRadius:100,fontSize:13,cursor:"pointer",
            background:"rgba(201,168,76,0.1)",border:"1.5px solid rgba(201,168,76,0.28)",
            color:"#8B6914",fontFamily:"'DM Sans',sans-serif",fontWeight:600,
            transition:"all 0.18s",animation:`fadeUp 0.3s ${i*60}ms both`}}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(201,168,76,0.2)";e.currentTarget.style.borderColor="#c9a84c";}}
          onMouseLeave={e=>{e.currentTarget.style.background="rgba(201,168,76,0.1)";e.currentTarget.style.borderColor="rgba(201,168,76,0.28)";}}>
          {r}
        </button>
      ))}
      </div>
      {showInput&&(
        <div style={{display:"flex",gap:8,marginTop:6}}>
          <input value={otherText} onChange={e=>setOtherText(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&otherText.trim()){onSend(otherText.trim());setOtherText("");}}}
            placeholder={showInput} style={{flex:1,padding:"9px 13px",borderRadius:10,
              border:"1.5px solid rgba(201,168,76,0.3)",fontFamily:"'DM Sans',sans-serif",
              fontSize:14,color:"#1a1410",background:"rgba(255,255,255,0.9)",outline:"none"}}/>
          <button onClick={()=>{if(otherText.trim()){onSend(otherText.trim());setOtherText("");}}}
            style={{padding:"9px 16px",borderRadius:10,background:"linear-gradient(135deg,#c9a84c,#f0d080)",
              border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:13,color:"#1a1410"}}>
            Go →
          </button>
        </div>
      )}
    </div>
  );
}

// ── TRIP MIND MAP ─────────────────────────────────────────────────────────────
function TripMindMap({tripSummary}){
  if(!tripSummary)return null;
  const {from,to,purpose,budget,travelDate,homeLocation}=tripSummary;
  const nodes=[
    {icon:"🏠",label:homeLocation||"Home",c:"#f59e0b"},
    {icon:"🚖",label:"To Airport",c:"#8b5cf6"},
    {icon:"✈️",label:`Fly to ${to}`,c:"#c9a84c"},
    {icon:"🏨",label:"Hotel",c:"#16a34a"},
    {icon:"🗺️",label:"Explore",c:"#0ea5e9"},
    {icon:"🔄",label:"Return",c:"#c9a84c"},
  ];
  return(
    <div style={{background:"rgba(255,255,255,0.97)",borderRadius:16,padding:"18px 16px",
      border:"1.5px solid rgba(201,168,76,0.25)",marginTop:14,
      boxShadow:"0 4px 20px rgba(201,168,76,0.1)"}}>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:15,
        color:"#1a1410",marginBottom:14,textAlign:"center"}}>🗺️ Your Trip at a Glance</div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",flexWrap:"wrap",gap:0,marginBottom:14}}>
        {nodes.map((node,i)=>(
          <React.Fragment key={i}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",animation:`fadeUp 0.3s ${i*80}ms both`}}>
              <div style={{width:40,height:40,borderRadius:"50%",
                background:`${node.c}18`,border:`2px solid ${node.c}40`,
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>
                {node.icon}
              </div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:9,color:"#5a4a3a",
                marginTop:3,textAlign:"center",maxWidth:54,overflow:"hidden",
                textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                {node.label}
              </div>
            </div>
            {i<nodes.length-1&&<div style={{width:20,height:2,background:"linear-gradient(90deg,rgba(201,168,76,0.25),rgba(201,168,76,0.5))",margin:"0 1px",marginBottom:18}}/>}
          </React.Fragment>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
        {[["🎯 Purpose",purpose],["💰 Budget",budget?`₹${Number(budget).toLocaleString()}`:"Flexible"],
          ["📅 Date",travelDate||"TBD"],["🛣️ Route",`${from}→${to}`]].map(([k,v])=>(
          <div key={k} style={{padding:"7px 9px",borderRadius:8,
            background:"rgba(201,168,76,0.06)",border:"1px solid rgba(201,168,76,0.12)"}}>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:8,color:"#a0896a"}}>{k}</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#1a1410",
              fontWeight:600,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v||"—"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SHARE TRIP CARD ───────────────────────────────────────────────────────────
function ShareTripCard({tripSummary}){
  // Hook MUST be before any early return (React rules)
  const [copied,setCopied]=useState(false);
  if(!tripSummary)return null;
  const {shareUrl,shareText}=tripSummary;
  return(
    <div style={{background:"linear-gradient(135deg,rgba(201,168,76,0.08),rgba(240,208,128,0.06))",
      borderRadius:13,padding:"13px 14px",border:"1.5px solid rgba(201,168,76,0.28)",
      marginTop:12,animation:"fadeUp 0.4s both"}}>
      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,color:"#8B6914",marginBottom:9}}>
        🔗 Share your trip plan
      </div>
      <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#5a4a3a",
        background:"rgba(255,255,255,0.7)",padding:"5px 9px",borderRadius:7,
        marginBottom:9,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
        {shareUrl}
      </div>
      <div style={{display:"flex",gap:7}}>
        <button onClick={()=>{navigator.clipboard.writeText(shareUrl).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});}}
          style={{flex:1,padding:"8px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",
            background:copied?"rgba(22,163,74,0.1)":"rgba(201,168,76,0.1)",
            border:copied?"1px solid #16a34a":"1px solid rgba(201,168,76,0.28)",
            color:copied?"#16a34a":"#8B6914",fontFamily:"'DM Sans',sans-serif",transition:"all 0.2s"}}>
          {copied?"✅ Copied!":"📋 Copy Link"}
        </button>
        <button onClick={()=>window.open(`https://wa.me/?text=${encodeURIComponent((shareText||"")+" "+(shareUrl||""))}`,"_blank")}
          style={{flex:1,padding:"8px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",
            background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.28)",
            color:"#16a34a",fontFamily:"'DM Sans',sans-serif"}}>
          📱 WhatsApp
        </button>
      </div>
    </div>
  );
}