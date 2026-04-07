/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API = "https://cometai-backend.onrender.com";
const GOLD = "#c9a84c";
const GOLD_D = "#8B6914";
const GRAD = "linear-gradient(135deg,#c9a84c,#f0d080,#c9a84c)";

// ── IATA helper ──────────────────────────────────────────────────────────────
const CITY_IATA = {
  "bangalore":"BLR","mumbai":"BOM","delhi":"DEL","chennai":"MAA","hyderabad":"HYD",
  "kolkata":"CCU","goa":"GOI","pune":"PNQ","kochi":"COK","ahmedabad":"AMD","jaipur":"JAI",
  "lucknow":"LKO","varanasi":"VNS","trivandrum":"TRV","coimbatore":"CBE","madurai":"IXM",
  "mangalore":"IXE","mysore":"MYQ","visakhapatnam":"VTZ","ranchi":"IXR","bhopal":"BHO",
  "srinagar":"SXR","jammu":"IXJ","tirupati":"TIR","leh":"IXL","nagpur":"NAG",
  "dubai":"DXB","singapore":"SIN","bangkok":"BKK","london":"LHR","new york":"JFK",
  "kuala lumpur":"KUL","colombo":"CMB","paris":"CDG","tokyo":"NRT","sydney":"SYD",
  "doha":"DOH","abu dhabi":"AUH","istanbul":"IST","bali":"DPS","maldives":"MLE",
};
const INDIA_CODES = new Set(["BLR","BOM","DEL","MAA","HYD","CCU","GOI","PNQ","COK","AMD","JAI",
  "LKO","VNS","PAT","IXC","GAU","BBI","CBE","IXM","IXE","MYQ","TRV","VTZ","VGA","IXR",
  "BHO","SXR","IXJ","HBX","IXG","TIR","IXL","IXZ","NAG","IDR","RPR","DED","SLV","ATQ","UDR"]);

function buildFlightLink(from, to, ddmm, pax=1) {
  const fc = CITY_IATA[from?.toLowerCase()] || (from||"").slice(0,3).toUpperCase();
  const tc = CITY_IATA[to?.toLowerCase()]   || (to||"").slice(0,3).toUpperCase();
  const base = (INDIA_CODES.has(fc) && INDIA_CODES.has(tc))
    ? "https://www.aviasales.in" : "https://www.aviasales.com";
  return `${base}/search/${fc}${ddmm||""}${tc}${pax}?marker=714667&sub_id=alvryn_ai`;
}
function buildBusLink(from, to) {
  return `https://www.redbus.in/bus-tickets/${(from||"").toLowerCase().replace(/\s+/g,"-")}-to-${(to||"").toLowerCase().replace(/\s+/g,"-")}`;
}
function buildHotelLink(city) {
  return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city||"")}`;
}
function buildTrainLink(from, to) {
  const CODES = {"bangalore":"SBC","mumbai":"CSTM","delhi":"NDLS","chennai":"MAS",
    "hyderabad":"SC","kolkata":"HWH","pune":"PUNE","kochi":"ERS","jaipur":"JP"};
  const fc = CODES[from?.toLowerCase()] || (from||"").toUpperCase().slice(0,4);
  const tc = CODES[to?.toLowerCase()]   || (to||"").toUpperCase().slice(0,4);
  return `https://www.irctc.co.in/nget/train-search?fromStation=${fc}&toStation=${tc}`;
}

// ── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html,body,#root{height:100%;overflow:hidden;}
  @keyframes fadeIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
  @keyframes gradShift{0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;}}
  @keyframes floatUD{0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);}}
  @keyframes spinSlow{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}
  @keyframes shimmer{0%{background-position:-200% center;}100%{background-position:200% center;}}
  @keyframes blink{0%,100%{opacity:1;}50%{opacity:0;}}
  ::-webkit-scrollbar{width:3px;}
  ::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.3);border-radius:2px;}
  .chat-input:focus{outline:none;border-color:#c9a84c!important;box-shadow:0 0 0 3px rgba(201,168,76,0.12)!important;}
  .send-btn:hover{transform:scale(1.05);}
  .sidebar-chat:hover{background:rgba(255,255,255,0.08)!important;}
  .card-hover:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(0,0,0,0.15)!important;}
  .chip-hover:hover{background:rgba(201,168,76,0.2)!important;border-color:rgba(201,168,76,0.5)!important;}
  @media(max-width:768px){
    .sidebar{display:none!important;}
    .chat-main{border-radius:0!important;}
  }
`;

// ── ICON ─────────────────────────────────────────────────────────────────────
function AlvrynIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="aig" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c9a84c"/>
          <stop offset="50%" stopColor="#f0d080"/>
          <stop offset="100%" stopColor="#8B6914"/>
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" stroke="url(#aig)" strokeWidth="1.5" fill="none"/>
      <path d="M20 46 L28 18 L36 46" stroke="url(#aig)" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
      <path d="M22.5 36 L33.5 36" stroke="url(#aig)" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M26 46 L34 18 L42 46" stroke="url(#aig)" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.45"/>
    </svg>
  );
}

// ── TYPING INDICATOR ─────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{display:"flex",alignItems:"center",gap:5,padding:"14px 18px",background:"rgba(255,255,255,0.06)",borderRadius:"18px 18px 18px 4px",width:"fit-content"}}>
      {[0,1,2].map(i=>(
        <div key={i} style={{width:7,height:7,borderRadius:"50%",background:GOLD,animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`}}/>
      ))}
    </div>
  );
}

// ── FLIGHT CARD ───────────────────────────────────────────────────────────────
function FlightCard({ data, onBook }) {
  const { airline, from, to, departure, arrival, duration, price, priceRange, label, labelColor, insight, link, ddmm } = data;
  const labelBg = { "Best Price":"rgba(22,163,74,0.15)", "Fastest":"rgba(37,99,235,0.15)", "Best Overall":"rgba(201,168,76,0.15)" };
  const labelCol = { "Best Price":"#16a34a", "Fastest":"#3b82f6", "Best Overall":GOLD_D };
  return (
    <div className="card-hover" onClick={()=>window.open(link,"_blank","noopener")}
      style={{background:"rgba(255,255,255,0.06)",backdropFilter:"blur(12px)",borderRadius:16,padding:"16px 18px",border:"1px solid rgba(255,255,255,0.1)",cursor:"pointer",transition:"all 0.2s",marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:32,height:32,borderRadius:8,background:"rgba(201,168,76,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>✈️</div>
          <div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:14,color:"#fff"}}>{airline}</div>
            {insight&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"rgba(255,255,255,0.5)",marginTop:2}}>💡 {insight}</div>}
          </div>
        </div>
        {label&&<span style={{padding:"3px 10px",borderRadius:100,fontSize:10,fontFamily:"'Space Mono',monospace",fontWeight:700,color:labelCol[label]||GOLD_D,background:labelBg[label]||"rgba(201,168,76,0.15)"}}>{label}</span>}
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:22,color:"#fff"}}>{departure}</div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"rgba(255,255,255,0.5)",marginTop:2}}>{from}</div>
        </div>
        <div style={{flex:1,textAlign:"center",padding:"0 12px"}}>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:4}}>{duration}</div>
          <div style={{height:1,background:"linear-gradient(90deg,transparent,rgba(201,168,76,0.5),transparent)",position:"relative"}}>
            <span style={{position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",fontSize:12,color:GOLD}}>✈</span>
          </div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"rgba(22,163,74,0.8)",marginTop:4}}>Direct</div>
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:22,color:"#fff"}}>{arrival}</div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"rgba(255,255,255,0.5)",marginTop:2}}>{to}</div>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:12,borderTop:"1px solid rgba(255,255,255,0.08)"}}>
        <div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"rgba(255,255,255,0.4)",marginBottom:3}}>APPROX FROM</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:22,color:GOLD}}>₹{price?.toLocaleString()}</div>
          {priceRange&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"rgba(255,255,255,0.4)"}}>–₹{priceRange?.toLocaleString()} · may vary</div>}
        </div>
        <div style={{padding:"9px 18px",borderRadius:10,background:GRAD,backgroundSize:"200% 200%",animation:"gradShift 3s ease infinite",fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:13,color:"#1a1410",letterSpacing:"0.05em"}}>
          Check Live Prices →
        </div>
      </div>
    </div>
  );
}

// ── BUS CARD ──────────────────────────────────────────────────────────────────
function BusCard({ data }) {
  const { operator, from, to, departure, arrival, duration, price, type, label, insight, link } = data;
  return (
    <div className="card-hover" onClick={()=>window.open(link,"_blank","noopener")}
      style={{background:"rgba(255,255,255,0.06)",backdropFilter:"blur(12px)",borderRadius:16,padding:"16px 18px",border:"1px solid rgba(255,255,255,0.1)",cursor:"pointer",transition:"all 0.2s",marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:32,height:32,borderRadius:8,background:"rgba(16,185,129,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🚌</div>
          <div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:14,color:"#fff"}}>{operator}</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"rgba(255,255,255,0.45)",marginTop:2}}>{type}</div>
          </div>
        </div>
        {label&&<span style={{padding:"3px 10px",borderRadius:100,fontSize:10,fontFamily:"'Space Mono',monospace",fontWeight:700,color:"#16a34a",background:"rgba(22,163,74,0.15)"}}>{label}</span>}
      </div>
      {insight&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"rgba(201,168,76,0.7)",marginBottom:10,padding:"6px 10px",borderRadius:8,background:"rgba(201,168,76,0.06)"}}>💡 {insight}</div>}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:20,color:"#fff"}}>{departure}</div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"rgba(255,255,255,0.5)"}}>{from}</div>
        </div>
        <div style={{flex:1,textAlign:"center",fontSize:11,color:"rgba(255,255,255,0.4)"}}>
          <div>{duration}</div>
          <div style={{height:1,background:"linear-gradient(90deg,transparent,rgba(16,185,129,0.4),transparent)",margin:"4px 12px",position:"relative"}}>
            <span style={{position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",fontSize:12}}>🚌</span>
          </div>
          <div style={{fontSize:10,color:"rgba(16,185,129,0.7)"}}>Direct</div>
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:20,color:"#fff"}}>{arrival}</div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"rgba(255,255,255,0.5)"}}>{to}</div>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.08)"}}>
        <div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"rgba(255,255,255,0.4)",marginBottom:3}}>APPROX FROM</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:20,color:"#16a34a"}}>₹{price?.toLocaleString()}</div>
        </div>
        <div style={{padding:"9px 18px",borderRadius:10,background:"rgba(16,185,129,0.15)",border:"1px solid rgba(16,185,129,0.3)",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:13,color:"#16a34a"}}>
          View on RedBus →
        </div>
      </div>
    </div>
  );
}

// ── HOTEL CARD ────────────────────────────────────────────────────────────────
function HotelCard({ data }) {
  const { city, priceRange, rating, label, insight, link } = data;
  return (
    <div className="card-hover" onClick={()=>window.open(link,"_blank","noopener")}
      style={{background:"rgba(255,255,255,0.06)",backdropFilter:"blur(12px)",borderRadius:16,padding:"16px 18px",border:"1px solid rgba(255,255,255,0.1)",cursor:"pointer",transition:"all 0.2s",marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:32,height:32,borderRadius:8,background:"rgba(234,88,12,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🏨</div>
          <div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:14,color:"#fff"}}>Hotels in {city}</div>
            {rating&&<div style={{display:"flex",alignItems:"center",gap:4,marginTop:2}}>
              {"★★★★★".slice(0,Math.round(rating)).split("").map((s,i)=><span key={i} style={{color:GOLD,fontSize:11}}>{s}</span>)}
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"rgba(255,255,255,0.4)"}}>{rating}</span>
            </div>}
          </div>
        </div>
        {label&&<span style={{padding:"3px 10px",borderRadius:100,fontSize:10,fontFamily:"'Space Mono',monospace",fontWeight:700,color:"#ea580c",background:"rgba(234,88,12,0.15)"}}>{label}</span>}
      </div>
      {insight&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"rgba(201,168,76,0.7)",marginBottom:10,padding:"6px 10px",borderRadius:8,background:"rgba(201,168,76,0.06)"}}>💡 {insight}</div>}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.08)"}}>
        <div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"rgba(255,255,255,0.4)",marginBottom:3}}>APPROX PER NIGHT</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:20,color:"#ea580c"}}>₹{priceRange}</div>
        </div>
        <div style={{padding:"9px 18px",borderRadius:10,background:"rgba(234,88,12,0.12)",border:"1px solid rgba(234,88,12,0.3)",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:13,color:"#ea580c"}}>
          View Hotels →
        </div>
      </div>
    </div>
  );
}

// ── TRAIN CARD ────────────────────────────────────────────────────────────────
function TrainCard({ data }) {
  const { from, to, label, insight, link } = data;
  return (
    <div className="card-hover" onClick={()=>window.open(link,"_blank","noopener")}
      style={{background:"rgba(255,255,255,0.06)",backdropFilter:"blur(12px)",borderRadius:16,padding:"16px 18px",border:"1px solid rgba(255,255,255,0.1)",cursor:"pointer",transition:"all 0.2s",marginBottom:10}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <div style={{width:32,height:32,borderRadius:8,background:"rgba(124,58,237,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🚂</div>
        <div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:14,color:"#fff"}}>{from} → {to}</div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:2}}>Indian Railways via IRCTC</div>
        </div>
      </div>
      {insight&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"rgba(201,168,76,0.7)",marginBottom:10,padding:"6px 10px",borderRadius:8,background:"rgba(201,168,76,0.06)"}}>💡 {insight}</div>}
      <div style={{display:"flex",justifyContent:"flex-end",paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.08)"}}>
        <div style={{padding:"9px 18px",borderRadius:10,background:"rgba(124,58,237,0.15)",border:"1px solid rgba(124,58,237,0.3)",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:13,color:"#a78bfa"}}>
          Search on IRCTC →
        </div>
      </div>
    </div>
  );
}

// ── MESSAGE RENDERER ──────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  if (isUser) {
    return (
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16,animation:"fadeIn 0.3s both"}}>
        <div style={{maxWidth:"72%",padding:"12px 18px",borderRadius:"18px 18px 4px 18px",background:GRAD,backgroundSize:"200% 200%",animation:"gradShift 4s ease infinite",fontFamily:"'DM Sans',sans-serif",fontSize:15,color:"#1a1410",fontWeight:500,lineHeight:1.6}}>
          {msg.content}
        </div>
      </div>
    );
  }

  // AI message
  return (
    <div style={{display:"flex",gap:10,marginBottom:20,animation:"fadeIn 0.3s both"}}>
      <div style={{flexShrink:0,width:32,height:32,borderRadius:"50%",background:"rgba(201,168,76,0.15)",border:"1px solid rgba(201,168,76,0.3)",display:"flex",alignItems:"center",justifyContent:"center",marginTop:2}}>
        <AlvrynIcon size={20}/>
      </div>
      <div style={{flex:1,maxWidth:"85%"}}>
        {/* Text content */}
        {msg.text && (
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,color:"rgba(255,255,255,0.88)",lineHeight:1.75,marginBottom:msg.cards?.length ? 16 : 0,whiteSpace:"pre-wrap"}}>
            {msg.text}
          </div>
        )}
        {/* Flight cards */}
        {msg.cards?.filter(c=>c.type==="flight").map((c,i)=><FlightCard key={i} data={c}/>)}
        {/* Bus cards */}
        {msg.cards?.filter(c=>c.type==="bus").map((c,i)=><BusCard key={i} data={c}/>)}
        {/* Hotel cards */}
        {msg.cards?.filter(c=>c.type==="hotel").map((c,i)=><HotelCard key={i} data={c}/>)}
        {/* Train cards */}
        {msg.cards?.filter(c=>c.type==="train").map((c,i)=><TrainCard key={i} data={c}/>)}
        {/* CTA */}
        {msg.cta && (
          <div style={{marginTop:14,padding:"12px 16px",borderRadius:12,background:"rgba(201,168,76,0.08)",border:"1px solid rgba(201,168,76,0.2)",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"rgba(201,168,76,0.9)",fontStyle:"italic"}}>
            {msg.cta}
          </div>
        )}
        {/* Disclaimer */}
        {msg.cards?.length > 0 && (
          <div style={{marginTop:8,fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"rgba(255,255,255,0.3)"}}>
            Prices are approximate and may vary. Click any card to check live availability.
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function AIChatPage() {
  const navigate = useNavigate();
  const [chats, setChats]       = useState(() => {
    try { return JSON.parse(localStorage.getItem("alvryn_chats") || "[]"); } catch { return []; }
  });
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  let user = {};
  try { user = JSON.parse(localStorage.getItem("user") || "{}"); } catch {}
  const token = localStorage.getItem("token");

  useEffect(() => { if (!token) navigate("/login"); }, [token, navigate]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, loading]);
  useEffect(() => {
    try { localStorage.setItem("alvryn_chats", JSON.stringify(chats)); } catch {}
  }, [chats]);

  // Keep backend alive
  useEffect(() => {
    fetch(`${API}/test`).catch(()=>{});
    const t = setInterval(() => fetch(`${API}/test`).catch(()=>{}), 14*60*1000);
    return () => clearInterval(t);
  }, []);

  const startNewChat = useCallback(() => {
    const id = Date.now().toString();
    setActiveChatId(id);
    setMessages([]);
    setInput("");
  }, []);

  const loadChat = useCallback((chat) => {
    setActiveChatId(chat.id);
    setMessages(chat.messages || []);
  }, []);

  const saveChat = useCallback((chatId, msgs, title) => {
    setChats(prev => {
      const existing = prev.find(c => c.id === chatId);
      if (existing) {
        return prev.map(c => c.id === chatId ? { ...c, messages: msgs, title: title || c.title } : c);
      }
      return [{ id: chatId, title: title || "New trip", messages: msgs, time: Date.now() }, ...prev];
    });
  }, []);

  const sendMessage = useCallback(async (text) => {
    const query = (text || input).trim();
    if (!query || loading) return;
    if (!activeChatId) {
      const id = Date.now().toString();
      setActiveChatId(id);
    }
    setInput("");

    const userMsg = { role:"user", content: query, id: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch(`${API}/ai-chat`, {
        method: "POST",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ message: query, history: messages.slice(-8) }),
      });
      const data = await res.json();
      const aiMsg = {
        role: "assistant",
        id: Date.now()+1,
        text: data.text || "",
        cards: data.cards || [],
        cta: data.cta || null,
      };
      const finalMessages = [...newMessages, aiMsg];
      setMessages(finalMessages);
      // Auto-title from first user message
      const title = query.slice(0,40) + (query.length>40?"…":"");
      const cId = activeChatId || Date.now().toString();
      setActiveChatId(cId);
      saveChat(cId, finalMessages, title);
    } catch(e) {
      const errMsg = {
        role:"assistant", id:Date.now()+1,
        text:"Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        cards:[], cta:null,
      };
      const finalMessages = [...newMessages, errMsg];
      setMessages(finalMessages);
    }
    setLoading(false);
    inputRef.current?.focus();
  }, [input, loading, messages, token, activeChatId, saveChat]);

  const SUGGESTIONS = [
    "✈️ Cheapest flight from Bangalore to Delhi tomorrow",
    "🚌 Bus from Chennai to Hyderabad tonight",
    "🏨 Hotels in Goa under ₹2000 per night",
    "🗺️ Plan a 2-day trip under ₹5000 from Bangalore",
    "🚂 Train from Delhi to Mumbai this weekend",
    "⚡ Fastest way to reach Mumbai from Bangalore",
  ];

  const isEmpty = messages.length === 0;

  return (
    <div style={{display:"flex",height:"100vh",background:"#0a0a0f",fontFamily:"'DM Sans',sans-serif",overflow:"hidden"}}>
      <style>{CSS}</style>

      {/* ── SIDEBAR ── */}
      {sidebarOpen && (
        <div className="sidebar" style={{width:260,flexShrink:0,background:"rgba(255,255,255,0.03)",borderRight:"1px solid rgba(255,255,255,0.07)",display:"flex",flexDirection:"column",padding:"16px 12px"}}>
          {/* Logo */}
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 8px 20px",cursor:"pointer"}} onClick={()=>navigate("/")}>
            <div style={{animation:"floatUD 4s ease-in-out infinite"}}><AlvrynIcon size={30}/></div>
            <div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:15,color:"#fff",letterSpacing:"0.12em"}}>ALVRYN</div>
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:7,color:GOLD,letterSpacing:"0.18em"}}>AI TRAVEL</div>
            </div>
          </div>

          {/* New chat button */}
          <button onClick={startNewChat}
            style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:10,background:GRAD,backgroundSize:"200% 200%",animation:"gradShift 4s ease infinite",border:"none",cursor:"pointer",color:"#1a1410",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:13,marginBottom:20,width:"100%"}}>
            <span style={{fontSize:16}}>✏️</span> New Chat
          </button>

          {/* Chat history */}
          <div style={{flex:1,overflowY:"auto"}}>
            {chats.length > 0 && (
              <>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"rgba(255,255,255,0.3)",letterSpacing:"0.15em",marginBottom:8,paddingLeft:8}}>RECENT</div>
                {chats.slice(0,20).map(chat=>(
                  <div key={chat.id} className="sidebar-chat" onClick={()=>loadChat(chat)}
                    style={{padding:"9px 12px",borderRadius:8,cursor:"pointer",background:activeChatId===chat.id?"rgba(201,168,76,0.12)":"transparent",border:activeChatId===chat.id?"1px solid rgba(201,168,76,0.25)":"1px solid transparent",marginBottom:3,transition:"all 0.15s"}}>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"rgba(255,255,255,0.8)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{chat.title}</div>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:2}}>
                      {new Date(chat.time).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Bottom user info */}
          <div style={{borderTop:"1px solid rgba(255,255,255,0.07)",paddingTop:12,marginTop:8}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <div style={{width:30,height:30,borderRadius:"50%",background:"rgba(201,168,76,0.2)",border:"1px solid rgba(201,168,76,0.4)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:14,color:GOLD}}>
                {user.name?.charAt(0)?.toUpperCase()||"U"}
              </div>
              <div style={{overflow:"hidden"}}>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"rgba(255,255,255,0.8)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.name||"Traveller"}</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"rgba(255,255,255,0.3)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.email||""}</div>
              </div>
            </div>
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>navigate("/search")} style={{flex:1,padding:"6px",borderRadius:7,fontSize:11,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.6)",border:"1px solid rgba(255,255,255,0.1)"}}>Search</button>
              <button onClick={()=>navigate("/profile")} style={{flex:1,padding:"6px",borderRadius:7,fontSize:11,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.6)",border:"1px solid rgba(255,255,255,0.1)"}}>Profile</button>
              <button onClick={()=>{localStorage.removeItem("token");localStorage.removeItem("user");navigate("/login");}} style={{flex:1,padding:"6px",borderRadius:7,fontSize:11,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:"rgba(239,68,68,0.1)",color:"rgba(239,68,68,0.7)",border:"1px solid rgba(239,68,68,0.2)"}}>Out</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CHAT AREA ── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",position:"relative"}}>

        {/* Top bar */}
        <div style={{height:56,padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(255,255,255,0.07)",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <button onClick={()=>setSidebarOpen(s=>!s)} style={{width:32,height:32,borderRadius:8,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.6)",fontSize:16}}>☰</button>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:16,color:"rgba(255,255,255,0.8)"}}>
              {isEmpty ? "Alvryn AI — Travel Assistant" : (chats.find(c=>c.id===activeChatId)?.title || "New Chat")}
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{padding:"4px 12px",borderRadius:100,background:"rgba(22,163,74,0.12)",border:"1px solid rgba(22,163,74,0.2)",fontFamily:"'Space Mono',monospace",fontSize:9,color:"rgba(22,163,74,0.8)",letterSpacing:"0.1em"}}>● ONLINE</div>
            <button onClick={startNewChat} style={{padding:"6px 14px",borderRadius:8,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.6)",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,cursor:"pointer"}}>✏️ New</button>
          </div>
        </div>

        {/* Chat messages */}
        <div style={{flex:1,overflowY:"auto",padding:"24px 20px"}}>
          <div style={{maxWidth:760,margin:"0 auto"}}>

            {/* Empty state */}
            {isEmpty && (
              <div style={{textAlign:"center",paddingTop:60,animation:"fadeUp 0.5s both"}}>
                <div style={{animation:"floatUD 4s ease-in-out infinite",marginBottom:20}}>
                  <AlvrynIcon size={56}/>
                </div>
                <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:300,fontSize:"clamp(28px,4vw,48px)",color:"#fff",marginBottom:10,lineHeight:1.1}}>
                  Where do you want to go?
                </h1>
                <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:16,color:"rgba(255,255,255,0.4)",marginBottom:40,lineHeight:1.7}}>
                  Ask anything — flights, buses, hotels, trains, trip plans.<br/>
                  I'll find the best options and help you decide.
                </p>
                {/* Quick chips */}
                <div style={{display:"flex",flexWrap:"wrap",gap:10,justifyContent:"center",maxWidth:640,margin:"0 auto"}}>
                  {SUGGESTIONS.map((s,i)=>(
                    <button key={i} className="chip-hover" onClick={()=>sendMessage(s)}
                      style={{padding:"10px 16px",borderRadius:100,fontSize:13,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",color:"rgba(255,255,255,0.75)",transition:"all 0.2s",fontWeight:500,animation:`fadeIn 0.4s ${i*60}ms both`}}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map(msg => <MessageBubble key={msg.id} msg={msg}/>)}

            {/* Typing */}
            {loading && (
              <div style={{display:"flex",gap:10,marginBottom:16,animation:"fadeIn 0.3s both"}}>
                <div style={{flexShrink:0,width:32,height:32,borderRadius:"50%",background:"rgba(201,168,76,0.15)",border:"1px solid rgba(201,168,76,0.3)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <AlvrynIcon size={20}/>
                </div>
                <div style={{paddingTop:4}}>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"rgba(255,255,255,0.35)",marginBottom:6}}>Alvryn is thinking…</div>
                  <TypingDots/>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>
        </div>

        {/* Input area */}
        <div style={{padding:"16px 20px",borderTop:"1px solid rgba(255,255,255,0.07)",flexShrink:0,background:"rgba(0,0,0,0.3)"}}>
          <div style={{maxWidth:760,margin:"0 auto"}}>
            <div style={{display:"flex",alignItems:"flex-end",gap:10,background:"rgba(255,255,255,0.06)",borderRadius:16,padding:"12px 16px",border:"1px solid rgba(255,255,255,0.1)",transition:"border-color 0.2s"}}>
              <textarea
                ref={inputRef}
                className="chat-input"
                value={input}
                onChange={e=>{setInput(e.target.value);e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,160)+"px";}}
                onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}}
                placeholder="Ask anything… flights, buses, hotels, trip plans…"
                rows={1}
                style={{flex:1,background:"transparent",border:"none",outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:15,color:"rgba(255,255,255,0.88)",resize:"none",lineHeight:1.6,maxHeight:160,overflowY:"auto",paddingTop:2}}
              />
              <button className="send-btn" onClick={()=>sendMessage()} disabled={!input.trim()||loading}
                style={{flexShrink:0,width:38,height:38,borderRadius:10,background:input.trim()&&!loading?GRAD:"rgba(255,255,255,0.08)",backgroundSize:"200% 200%",animation:input.trim()&&!loading?"gradShift 3s ease infinite":"none",border:"none",cursor:input.trim()&&!loading?"pointer":"not-allowed",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,transition:"all 0.2s",opacity:input.trim()&&!loading?1:0.4}}>
                {loading ? <div style={{width:16,height:16,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spinSlow 0.8s linear infinite"}}/> : "↑"}
              </button>
            </div>
            <div style={{textAlign:"center",marginTop:8,fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"rgba(255,255,255,0.2)"}}>
              Alvryn AI · Prices shown are approximate · Bookings completed on partner sites
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}