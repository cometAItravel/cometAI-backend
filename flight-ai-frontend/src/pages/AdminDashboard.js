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
        <linearGradient id="ag1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B6B"/><stop offset="100%" stopColor="#FFD93D"/>
        </linearGradient>
        <linearGradient id="ag2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6C63FF"/><stop offset="100%" stopColor="#00C2FF"/>
        </linearGradient>
      </defs>
      <ellipse cx="30" cy="30" rx="27" ry="11" stroke="url(#ag1)" strokeWidth="1.2" strokeDasharray="5 3" opacity="0.45"
        style={spin?{animation:"orbitRing 5s linear infinite",transformOrigin:"30px 30px"}:{}}/>
      <text x="10" y="47" fontFamily="'Syne',sans-serif" fontWeight="900" fontSize="40" fill="url(#ag1)">A</text>
      <g style={spin?{animation:"planeOrbit 5s linear infinite",transformOrigin:"30px 30px"}:{}}>
        <path d="M57 30 L50 26 L52 30 L50 34 Z" fill="url(#ag2)"/>
        <path d="M51 26.5 L51 22 L54 27 Z" fill="url(#ag2)" opacity="0.75"/>
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
    let W=c.offsetWidth,H=c.offsetHeight; c.width=W; c.height=H;
    const blobs=Array.from({length:4},(_,i)=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-0.5)*0.4,vy:(Math.random()-0.5)*0.4,r:180+Math.random()*150,ci:i%colors.length}));
    const resize=()=>{W=c.offsetWidth;H=c.offsetHeight;c.width=W;c.height=H;};
    window.addEventListener("resize",resize);
    const draw=()=>{ctx.clearRect(0,0,W,H);blobs.forEach(b=>{b.x+=b.vx;b.y+=b.vy;if(b.x<-b.r||b.x>W+b.r)b.vx*=-1;if(b.y<-b.r||b.y>H+b.r)b.vy*=-1;const g=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r);g.addColorStop(0,colors[b.ci%colors.length]+"1E");g.addColorStop(1,"transparent");ctx.fillStyle=g;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();});raf.current=requestAnimationFrame(draw);};
    draw();
    return()=>{cancelAnimationFrame(raf.current);window.removeEventListener("resize",resize);};
  },[colors]);
  return <canvas ref={ref} style={{position:"fixed",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:0}}/>;
}

const ADMIN_PW = "user2026admin";
const accent = "#FF6B6B";
const grad = "linear-gradient(135deg,#FF6B6B,#FFD93D)";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [tab, setTab] = useState("bookings");
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [rb,ru,rw] = await Promise.all([
        fetch("https://cometai-backend.onrender.com/admin/bookings"),
        fetch("https://cometai-backend.onrender.com/admin/users"),
        fetch("https://cometai-backend.onrender.com/admin/waitlist"),
      ]);
      const [db,du,dw] = await Promise.all([rb.json(),ru.json(),rw.json()]);
      if (Array.isArray(db)) setBookings(db);
      if (Array.isArray(du)) setUsers(du);
      if (Array.isArray(dw)) setWaitlist(dw);
    } catch {}
    setLoading(false);
  };

  const login = () => {
    if (pw === ADMIN_PW) { setAuthed(true); fetchAll(); }
    else setPwErr("Wrong password");
  };

  const tabs = [
    { id:"bookings", label:"Bookings", icon:"🎫", data:bookings },
    { id:"users",    label:"Users",    icon:"👥", data:users    },
    { id:"waitlist", label:"Waitlist", icon:"📋", data:waitlist },
  ];

  // ── LOGIN SCREEN ──
  if (!authed) return (
    <div style={{ minHeight:"100vh", background:"#f8f8fa", position:"relative",
      display:"flex", alignItems:"center", justifyContent:"center" }}>
      <style>{CSS}</style>
      <AuroraBackground colors={["#FF6B6B","#FFD93D","#FF8C42"]}/>
      <div style={{ position:"relative", zIndex:2, width:"100%", maxWidth:400, padding:"0 20px",
        animation:"fadeUp 0.6s both" }}>
        <div style={{ background:"rgba(255,255,255,0.9)", backdropFilter:"blur(24px)",
          borderRadius:28, padding:"48px 40px",
          boxShadow:"0 24px 80px rgba(0,0,0,0.10)", border:"1px solid rgba(255,255,255,0.9)" }}>
          <div style={{ textAlign:"center", marginBottom:36 }}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:16,
              animation:"floatUD 4s ease-in-out infinite" }}>
              <AlvrynIcon size={52} spin/>
            </div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:26, color:"#0a0a0a" }}>Admin Access</h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, color:"#999", marginTop:6 }}>Alvryn Dashboard</p>
          </div>
          <input type="password" value={pw} onChange={e=>setPw(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&login()} placeholder="Admin password"
            style={{ width:"100%", padding:"13px 16px", borderRadius:13, fontSize:15,
              fontFamily:"'DM Sans',sans-serif", border:`1.5px solid ${accent}44`,
              outline:"none", background:"#fafafa", color:"#0a0a0a", marginBottom:14 }}/>
          {pwErr && <div style={{ color:"#C62828", fontSize:13, fontFamily:"'DM Sans',sans-serif",
            marginBottom:14 }}>{pwErr}</div>}
          <button onClick={login}
            style={{ width:"100%", padding:"14px", borderRadius:13, fontSize:15, fontWeight:800,
              fontFamily:"'Syne',sans-serif", color:"#fff", border:"none", cursor:"pointer",
              background:grad, boxShadow:`0 8px 28px ${accent}44` }}>
            Enter Dashboard →
          </button>
        </div>
      </div>
    </div>
  );

  // ── DASHBOARD ──
  const activeData = tabs.find(t=>t.id===tab)?.data || [];

  return (
    <div style={{ minHeight:"100vh", background:"#f8f8fa", position:"relative", fontFamily:"'DM Sans',sans-serif" }}>
      <style>{CSS}</style>
      <AuroraBackground colors={["#FF6B6B","#FFD93D","#FF8C42"]}/>

      {/* Top bar */}
      <nav style={{ position:"sticky", top:0, zIndex:200, height:66, padding:"0 6%",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        background:"rgba(248,248,250,0.92)", backdropFilter:"blur(22px)",
        borderBottom:"1px solid rgba(0,0,0,0.05)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ animation:"floatUD 4s ease-in-out infinite" }}><AlvrynIcon size={38} spin/></div>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:15, color:"#0a0a0a" }}>ALVRYN ADMIN</div>
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:7, color:accent, letterSpacing:"0.18em" }}>DASHBOARD</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={fetchAll}
            style={{ padding:"8px 18px", borderRadius:10, fontSize:13, fontWeight:600,
              fontFamily:"'DM Sans',sans-serif", color:accent,
              border:`1.5px solid ${accent}44`, background:"transparent", cursor:"pointer" }}>↻ Refresh</button>
          <button onClick={()=>navigate("/")}
            style={{ padding:"8px 18px", borderRadius:10, fontSize:13, fontWeight:500,
              fontFamily:"'DM Sans',sans-serif", color:"#888",
              border:"1.5px solid rgba(0,0,0,0.1)", background:"transparent", cursor:"pointer" }}>← Home</button>
        </div>
      </nav>

      <div style={{ position:"relative", zIndex:1, padding:"40px 6%" }}>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20, marginBottom:32 }}>
          {tabs.map((t,i)=>(
            <div key={t.id} style={{ padding:"28px 24px", background:"#fff", borderRadius:18,
              boxShadow:"0 4px 18px rgba(0,0,0,0.05)", border:"1px solid rgba(0,0,0,0.05)",
              animation:`fadeUp 0.5s ${i*80}ms both` }}>
              <div style={{ fontSize:28, marginBottom:10 }}>{t.icon}</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:40,
                color:accent }}>{loading?"…":t.data.length}</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, color:"#888", marginTop:4 }}>
                Total {t.label}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:8, marginBottom:24 }}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{ padding:"10px 22px", borderRadius:12, fontSize:14, fontWeight:700,
                fontFamily:"'Syne',sans-serif", border:"none", cursor:"pointer", transition:"all 0.2s",
                background: tab===t.id ? grad : "#fff",
                color: tab===t.id ? "#fff" : "#888",
                boxShadow: tab===t.id ? `0 4px 16px ${accent}44` : "0 2px 8px rgba(0,0,0,0.05)" }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background:"#fff", borderRadius:20,
          boxShadow:"0 4px 20px rgba(0,0,0,0.05)", border:"1px solid rgba(0,0,0,0.05)",
          overflow:"hidden" }}>
          {loading ? (
            <div style={{ padding:"60px", textAlign:"center" }}>
              <div style={{ width:40,height:40,border:`3px solid ${accent}22`,borderTopColor:accent,
                borderRadius:"50%",animation:"spinSlow 1s linear infinite",margin:"0 auto 14px"}}/>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, color:"#bbb" }}>Loading…</div>
            </div>
          ) : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:"#f8f8fa", borderBottom:"1px solid rgba(0,0,0,0.05)" }}>
                    {tab==="bookings" && ["ID","Airline","Route","Passenger","Price","Date"].map(h=>(
                      <th key={h} style={{ padding:"13px 18px", textAlign:"left",
                        fontFamily:"'Space Mono',monospace", fontSize:9.5, color:"#aaa",
                        letterSpacing:"0.1em", fontWeight:700 }}>{h}</th>
                    ))}
                    {tab==="users" && ["ID","Name","Email","Joined"].map(h=>(
                      <th key={h} style={{ padding:"13px 18px", textAlign:"left",
                        fontFamily:"'Space Mono',monospace", fontSize:9.5, color:"#aaa",
                        letterSpacing:"0.1em", fontWeight:700 }}>{h}</th>
                    ))}
                    {tab==="waitlist" && ["ID","Email","Ref Code","Referred By","Joined"].map(h=>(
                      <th key={h} style={{ padding:"13px 18px", textAlign:"left",
                        fontFamily:"'Space Mono',monospace", fontSize:9.5, color:"#aaa",
                        letterSpacing:"0.1em", fontWeight:700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tab==="bookings" && bookings.map((b,i)=>(
                    <tr key={i} style={{ borderBottom:"1px solid rgba(0,0,0,0.03)" }}>
                      <td style={{ padding:"13px 18px", fontFamily:"'Space Mono',monospace", fontSize:11, color:"#ccc" }}>#{b.id}</td>
                      <td style={{ padding:"13px 18px", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, color:"#0a0a0a" }}>{b.airline} <span style={{ fontWeight:400, color:"#bbb", fontSize:11 }}>{b.flight_no}</span></td>
                      <td style={{ padding:"13px 18px", fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#555" }}>{b.from_city} → {b.to_city}</td>
                      <td style={{ padding:"13px 18px", fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#555" }}>{b.passenger_name}</td>
                      <td style={{ padding:"13px 18px", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:13, color:accent }}>₹{Number(b.price).toLocaleString()}</td>
                      <td style={{ padding:"13px 18px", fontFamily:"'Space Mono',monospace", fontSize:10, color:"#bbb" }}>{b.booked_at?new Date(b.booked_at).toLocaleDateString("en-IN"):"—"}</td>
                    </tr>
                  ))}
                  {tab==="users" && users.map((u,i)=>(
                    <tr key={i} style={{ borderBottom:"1px solid rgba(0,0,0,0.03)" }}>
                      <td style={{ padding:"13px 18px", fontFamily:"'Space Mono',monospace", fontSize:11, color:"#ccc" }}>#{u.id}</td>
                      <td style={{ padding:"13px 18px", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, color:"#0a0a0a" }}>{u.name}</td>
                      <td style={{ padding:"13px 18px", fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#555" }}>{u.email}</td>
                      <td style={{ padding:"13px 18px", fontFamily:"'Space Mono',monospace", fontSize:10, color:"#bbb" }}>{u.created_at?new Date(u.created_at).toLocaleDateString("en-IN"):"—"}</td>
                    </tr>
                  ))}
                  {tab==="waitlist" && waitlist.map((w,i)=>(
                    <tr key={i} style={{ borderBottom:"1px solid rgba(0,0,0,0.03)" }}>
                      <td style={{ padding:"13px 18px", fontFamily:"'Space Mono',monospace", fontSize:11, color:"#ccc" }}>#{w.id}</td>
                      <td style={{ padding:"13px 18px", fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#555" }}>{w.email}</td>
                      <td style={{ padding:"13px 18px", fontFamily:"'Space Mono',monospace", fontSize:11, color:accent }}>{w.ref_code}</td>
                      <td style={{ padding:"13px 18px", fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#bbb" }}>{w.referred_by||"—"}</td>
                      <td style={{ padding:"13px 18px", fontFamily:"'Space Mono',monospace", fontSize:10, color:"#bbb" }}>{w.joined_at?new Date(w.joined_at).toLocaleDateString("en-IN"):"—"}</td>
                    </tr>
                  ))}
                  {activeData.length === 0 && (
                    <tr><td colSpan={6} style={{ padding:"40px", textAlign:"center",
                      fontFamily:"'DM Sans',sans-serif", fontSize:14, color:"#ccc" }}>
                      No {tab} yet
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}