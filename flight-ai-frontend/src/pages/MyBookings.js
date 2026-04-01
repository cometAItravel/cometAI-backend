import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const BACKEND = "https://cometai-backend.onrender.com";
const GOLD = "#c9a84c";
const GOLD_DARK = "#8B6914";
const GRAD = "linear-gradient(135deg,#c9a84c,#f0d080,#c9a84c)";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(22px);}to{opacity:1;transform:translateY(0);}}
  @keyframes floatUD{0%,100%{transform:translateY(0);}50%{transform:translateY(-9px);}}
  @keyframes spinSlow{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
  ::-webkit-scrollbar{width:2px;}
  ::-webkit-scrollbar-thumb{background:linear-gradient(#c9a84c,#8B6914);}
`;

const AlvrynIcon = ({ size = 40 }) => {
  const uid = `mb${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={{flexShrink:0}}>
      <defs>
        <linearGradient id={`${uid}g`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c9a84c"/><stop offset="50%" stopColor="#f0d080"/><stop offset="100%" stopColor="#8B6914"/>
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
};

function AuroraBackground() {
  const ref=useRef(null);const raf=useRef(null);
  useEffect(()=>{
    const c=ref.current;if(!c)return;const ctx=c.getContext("2d");let W=c.offsetWidth,H=c.offsetHeight;c.width=W;c.height=H;
    const cols=["#c9a84c","#f0d080","#8B6914","#d4b868"];
    const blobs=Array.from({length:4},(_,i)=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-0.5)*0.4,vy:(Math.random()-0.5)*0.4,r:200+Math.random()*160,ci:i%cols.length}));
    const resize=()=>{W=c.offsetWidth;H=c.offsetHeight;c.width=W;c.height=H;};
    window.addEventListener("resize",resize);
    const draw=()=>{ctx.clearRect(0,0,W,H);blobs.forEach(b=>{b.x+=b.vx;b.y+=b.vy;if(b.x<-b.r||b.x>W+b.r)b.vx*=-1;if(b.y<-b.r||b.y>H+b.r)b.vy*=-1;const g=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r);g.addColorStop(0,cols[b.ci]+"15");g.addColorStop(1,"transparent");ctx.fillStyle=g;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();});raf.current=requestAnimationFrame(draw);};
    draw();
    return()=>{cancelAnimationFrame(raf.current);window.removeEventListener("resize",resize);};
  },[]);
  return <canvas ref={ref} style={{position:"fixed",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:0}}/>;
}

export default function MyBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/login"); return; }
    const load = async () => {
      try {
        const res = await fetch(`${BACKEND}/my-bookings`, { headers:{ Authorization:`Bearer ${localStorage.getItem("token")}` } });
        const data = await res.json();
        if (Array.isArray(data)) setBookings(data);
        else setError("Could not load bookings");
      } catch { setError("Server error"); }
      finally { setLoading(false); }
    };
    load();
  }, [navigate]);

  const user = (() => { try { return JSON.parse(localStorage.getItem("user")||"{}"); } catch { return {}; } })();

  return (
    <div style={{minHeight:"100vh",background:"#faf8f4",position:"relative",overflowX:"hidden",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{CSS}</style>
      <AuroraBackground/>

      {/* Nav */}
      <nav style={{position:"sticky",top:0,zIndex:200,height:66,padding:"0 5%",display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(250,248,244,0.92)",backdropFilter:"blur(22px)",borderBottom:"1px solid rgba(201,168,76,0.1)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>navigate("/")}>
          <div style={{animation:"floatUD 4s ease-in-out infinite"}}><AlvrynIcon size={38}/></div>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:16,color:"#1a1410",letterSpacing:"0.12em"}}>ALVRYN</div>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:7,color:GOLD,letterSpacing:"0.18em"}}>TRAVEL BEYOND</div>
          </div>
        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <button onClick={()=>navigate("/search")} style={{padding:"8px 18px",borderRadius:10,fontSize:13,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.06em",cursor:"pointer",color:"#1a1410",border:"none",background:GRAD,backgroundSize:"200% 200%",boxShadow:`0 4px 14px rgba(201,168,76,0.35)`}}>+ New Search</button>
          <button onClick={()=>navigate("/profile")} style={{padding:"8px 18px",borderRadius:10,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:`rgba(201,168,76,0.1)`,color:GOLD_DARK,border:`1.5px solid rgba(201,168,76,0.25)`}}>Profile</button>
          <button onClick={()=>{localStorage.removeItem("token");localStorage.removeItem("user");navigate("/login");}} style={{padding:"8px 18px",borderRadius:10,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:"#fff0f0",color:"#e53935",border:"1.5px solid rgba(229,57,53,0.2)"}}>Sign Out</button>
        </div>
      </nav>

      <div style={{position:"relative",zIndex:1,maxWidth:820,margin:"0 auto",padding:"48px 5% 80px"}}>
        <div style={{marginBottom:44,animation:"fadeUp 0.6s both"}}>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:GOLD,letterSpacing:"0.2em",marginBottom:10}}>MY BOOKINGS</div>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:"clamp(26px,4vw,50px)",color:"#1a1410",marginBottom:6}}>Your Trips</h1>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,color:"#888"}}>Hello {user.name?.split(" ")[0]||"Traveller"} — all your bookings are here.</p>
        </div>

        {loading && (
          <div style={{textAlign:"center",padding:"60px 0"}}>
            <div style={{width:44,height:44,border:`3px solid rgba(201,168,76,0.2)`,borderTopColor:GOLD,borderRadius:"50%",animation:"spinSlow 1s linear infinite",margin:"0 auto 16px"}}/>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"#bbb"}}>Loading your bookings…</div>
          </div>
        )}

        {error && <div style={{padding:"16px 20px",borderRadius:14,background:"#FFF0F0",border:"1px solid #FFCDD2",fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"#C62828"}}>{error}</div>}

        {!loading && bookings.length===0 && !error && (
          <div style={{textAlign:"center",padding:"80px 20px"}}>
            <div style={{fontSize:72,marginBottom:20,animation:"floatUD 3s ease-in-out infinite"}}>🎫</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:26,color:"#ccc",marginBottom:10}}>No bookings yet</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,color:"#ddd",marginBottom:28}}>Book your first flight or bus with Alvryn AI</div>
            <button onClick={()=>navigate("/search")} style={{padding:"13px 32px",borderRadius:13,fontSize:15,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.08em",cursor:"pointer",color:"#1a1410",border:"none",background:GRAD,backgroundSize:"200% 200%",boxShadow:`0 6px 22px rgba(201,168,76,0.38)`}}>Search Now ✈</button>
          </div>
        )}

        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {bookings.map((b,i)=>(
            <div key={b.id||i} style={{padding:"24px 28px",background:"rgba(255,255,255,0.85)",backdropFilter:"blur(12px)",borderRadius:20,boxShadow:"0 4px 20px rgba(0,0,0,0.05)",border:"1px solid rgba(201,168,76,0.12)",animation:`fadeUp 0.5s ${i*80}ms both`,transition:"all 0.25s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(201,168,76,0.35)";e.currentTarget.style.transform="translateY(-2px)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(201,168,76,0.12)";e.currentTarget.style.transform="translateY(0)";}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
                <div style={{display:"flex",alignItems:"center",gap:16,flex:1,minWidth:0}}>
                  <div style={{width:48,height:48,borderRadius:14,background:`rgba(201,168,76,0.12)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>✈️</div>
                  <div style={{minWidth:0}}>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:20,color:"#1a1410",marginBottom:4}}>{b.from_city||"—"} → {b.to_city||"—"}</div>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#aaa",marginBottom:2}}>{b.airline}{b.flight_no?` · ${b.flight_no}`:""}{b.departure_time?` · ${new Date(b.departure_time).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}`:""}</div>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#bbb"}}>Passenger: {b.passenger_name}</div>
                    {b.seats&&<div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:GOLD,marginTop:3}}>Seats: {b.seats}</div>}
                    {b.booking_ref&&<div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:GOLD_DARK,marginTop:3}}>ID: {b.booking_ref}</div>}
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:24,color:GOLD_DARK,marginBottom:8}}>₹{Number(b.final_price||b.price||0).toLocaleString()}</div>
                  <div style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 12px",borderRadius:100,background:"rgba(201,168,76,0.1)",border:`1px solid rgba(201,168,76,0.25)`}}>
                    <span style={{width:5,height:5,borderRadius:"50%",background:GOLD,display:"inline-block"}}/>
                    <span style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:GOLD_DARK}}>CONFIRMED</span>
                  </div>
                  {b.booked_at&&<div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#ccc",marginTop:6}}>{new Date(b.booked_at).toLocaleDateString("en-IN")}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}