import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(22px);}to{opacity:1;transform:translateY(0);}}
  @keyframes floatUD{0%,100%{transform:translateY(0);}50%{transform:translateY(-9px);}}
  @keyframes orbitRing{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
  @keyframes planeOrbit{from{transform:rotate(0deg) translateX(22px) rotate(0deg);}to{transform:rotate(360deg) translateX(22px) rotate(-360deg);}}
  @keyframes spinSlow{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
`;

function AlvrynIcon({ size = 40, spin = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <defs>
        <linearGradient id="mg1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00B89C"/><stop offset="100%" stopColor="#34D399"/>
        </linearGradient>
        <linearGradient id="mg2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B6B"/><stop offset="100%" stopColor="#FFD93D"/>
        </linearGradient>
      </defs>
      <ellipse cx="30" cy="30" rx="27" ry="11" stroke="url(#mg1)" strokeWidth="1.2" strokeDasharray="5 3" opacity="0.45"
        style={spin?{animation:"orbitRing 5s linear infinite",transformOrigin:"30px 30px"}:{}}/>
      <text x="10" y="47" fontFamily="'Syne',sans-serif" fontWeight="900" fontSize="40" fill="url(#mg1)">A</text>
      <g style={spin?{animation:"planeOrbit 5s linear infinite",transformOrigin:"30px 30px"}:{}}>
        <path d="M57 30 L50 26 L52 30 L50 34 Z" fill="url(#mg2)"/>
        <path d="M51 26.5 L51 22 L54 27 Z" fill="url(#mg2)" opacity="0.75"/>
      </g>
    </svg>
  );
}

function AuroraBackground({ colors }) {
  const ref = useRef(null);
  const raf = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    let W = c.offsetWidth, H = c.offsetHeight; c.width=W; c.height=H;
    const blobs=Array.from({length:5},(_,i)=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-0.5)*0.45,vy:(Math.random()-0.5)*0.45,r:200+Math.random()*160,ci:i%colors.length}));
    const resize=()=>{W=c.offsetWidth;H=c.offsetHeight;c.width=W;c.height=H;};
    window.addEventListener("resize",resize);
    const draw=()=>{ctx.clearRect(0,0,W,H);blobs.forEach(b=>{b.x+=b.vx;b.y+=b.vy;if(b.x<-b.r||b.x>W+b.r)b.vx*=-1;if(b.y<-b.r||b.y>H+b.r)b.vy*=-1;const g=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r);g.addColorStop(0,colors[b.ci%colors.length]+"22");g.addColorStop(1,"transparent");ctx.fillStyle=g;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();});raf.current=requestAnimationFrame(draw);};
    draw();
    return()=>{cancelAnimationFrame(raf.current);window.removeEventListener("resize",resize);};
  },[colors]);
  return <canvas ref={ref} style={{position:"fixed",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:0}}/>;
}

export default function MyBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const accent = "#00B89C";
  const grad = "linear-gradient(135deg,#00B89C,#34D399)";

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/login"); return; }
    const fetch_ = async () => {
      try {
        const res = await fetch("https://cometai-backend.onrender.com/my-bookings", {
          headers:{ Authorization:`Bearer ${localStorage.getItem("token")}` },
        });
        const data = await res.json();
        if (Array.isArray(data)) setBookings(data);
        else setError("Could not load bookings");
      } catch { setError("Server error"); }
      finally { setLoading(false); }
    };
    fetch_();
  }, [navigate]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div style={{ minHeight:"100vh", background:"#f8f8fa", position:"relative", overflowX:"hidden",
      fontFamily:"'DM Sans',sans-serif" }}>
      <style>{CSS}</style>
      <AuroraBackground colors={["#00B89C","#34D399","#6EE7B7"]}/>

      {/* Sticky nav */}
      <nav style={{ position:"sticky", top:0, zIndex:200, height:66, padding:"0 6%",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        background:"rgba(248,248,250,0.9)", backdropFilter:"blur(22px)",
        borderBottom:"1px solid rgba(0,0,0,0.05)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}
          onClick={()=>navigate("/")}>
          <div style={{ animation:"floatUD 4s ease-in-out infinite" }}>
            <AlvrynIcon size={38} spin/>
          </div>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:16,
              color:"#0a0a0a", letterSpacing:"-0.04em" }}>ALVRYN</div>
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:7,
              color:accent, letterSpacing:"0.18em" }}>TRAVEL BEYOND</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={()=>navigate("/search")}
            style={{ padding:"8px 18px", borderRadius:10, fontSize:13, fontWeight:700,
              fontFamily:"'Syne',sans-serif", color:"#fff", border:"none", cursor:"pointer",
              background:grad, boxShadow:`0 4px 14px ${accent}44` }}>
            + New Search
          </button>
          <button onClick={()=>{ localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/login"); }}
            style={{ padding:"8px 18px", borderRadius:10, fontSize:13, fontWeight:600,
              fontFamily:"'DM Sans',sans-serif", color:"#e53935", cursor:"pointer",
              background:"#fff0f0", border:"1.5px solid rgba(229,57,53,0.2)" }}>
            Sign Out
          </button>
        </div>
      </nav>

      <div style={{ position:"relative", zIndex:1, maxWidth:820, margin:"0 auto", padding:"48px 6% 80px" }}>

        {/* Header */}
        <div style={{ marginBottom:44, animation:"fadeUp 0.6s both" }}>
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10,
            color:accent, letterSpacing:"0.2em", marginBottom:10 }}>MY BOOKINGS</div>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:900,
            fontSize:"clamp(26px,4vw,50px)", color:"#0a0a0a", marginBottom:6 }}>Your Trips</h1>
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:15, color:"#888" }}>
            Hello {user.name?.split(" ")[0] || "Traveller"} — all your bookings are here.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign:"center", padding:"60px 0" }}>
            <div style={{ width:44, height:44, border:`3px solid ${accent}22`,
              borderTopColor:accent, borderRadius:"50%",
              animation:"spinSlow 1s linear infinite", margin:"0 auto 16px" }}/>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, color:"#bbb" }}>
              Loading your bookings…
            </div>
          </div>
        )}

        {error && (
          <div style={{ padding:"16px 20px", borderRadius:14, background:"#FFF0F0",
            border:"1px solid #FFCDD2", fontFamily:"'DM Sans',sans-serif",
            fontSize:14, color:"#C62828" }}>{error}</div>
        )}

        {/* Empty */}
        {!loading && bookings.length === 0 && !error && (
          <div style={{ textAlign:"center", padding:"80px 20px" }}>
            <div style={{ fontSize:72, marginBottom:20, animation:"floatUD 3s ease-in-out infinite" }}>🎫</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:22,
              color:"#ccc", marginBottom:10 }}>No bookings yet</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:15, color:"#ddd", marginBottom:28 }}>
              Book your first flight or bus with Alvryn AI
            </div>
            <button onClick={()=>navigate("/search")}
              style={{ padding:"13px 32px", borderRadius:13, fontSize:15, fontWeight:700,
                fontFamily:"'Syne',sans-serif", color:"#fff", border:"none", cursor:"pointer",
                background:grad, boxShadow:`0 6px 22px ${accent}44` }}>
              Search Now ✈
            </button>
          </div>
        )}

        {/* Booking cards */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {bookings.map((b, i) => (
            <div key={b.id || i}
              style={{ padding:"24px 28px", background:"#fff", borderRadius:20,
                boxShadow:"0 4px 20px rgba(0,0,0,0.06)", border:"1px solid rgba(0,0,0,0.05)",
                animation:`fadeUp 0.5s ${i*80}ms both`,
                transition:"all 0.25s" }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor=accent+"44"; e.currentTarget.style.transform="translateY(-2px)"; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor="rgba(0,0,0,0.05)"; e.currentTarget.style.transform="translateY(0)"; }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                  <div style={{ width:48, height:48, borderRadius:14,
                    background:`${accent}12`, display:"flex", alignItems:"center",
                    justifyContent:"center", fontSize:24, flexShrink:0 }}>✈️</div>
                  <div>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800,
                      fontSize:18, color:"#0a0a0a", marginBottom:4 }}>
                      {b.from_city || "—"} → {b.to_city || "—"}
                    </div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#aaa", marginBottom:2 }}>
                      {b.airline}{b.flight_no ? ` · ${b.flight_no}` : ""}
                      {b.departure_time ? ` · ${new Date(b.departure_time).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}` : ""}
                    </div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#bbb" }}>
                      Passenger: {b.passenger_name}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:900,
                    fontSize:22, color:accent, marginBottom:8 }}>
                    ₹{Number(b.price).toLocaleString()}
                  </div>
                  <div style={{ display:"inline-flex", alignItems:"center", gap:5,
                    padding:"4px 12px", borderRadius:100,
                    background:`${accent}12`, border:`1px solid ${accent}22` }}>
                    <span style={{ width:6, height:6, borderRadius:"50%",
                      background:accent, display:"inline-block" }}/>
                    <span style={{ fontFamily:"'Space Mono',monospace", fontSize:9.5,
                      color:accent }}>CONFIRMED</span>
                  </div>
                  {b.booked_at && (
                    <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10,
                      color:"#ccc", marginTop:6 }}>
                      {new Date(b.booked_at).toLocaleDateString("en-IN")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}