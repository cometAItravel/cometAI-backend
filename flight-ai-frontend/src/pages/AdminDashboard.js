import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const API = "https://cometai-backend.onrender.com";
const GOLD = "#c9a84c";
const GOLD_D = "#8B6914";
const GRAD = "linear-gradient(135deg,#c9a84c,#f0d080,#c9a84c)";
const ADMIN_PW = "user2026admin";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'DM Sans',sans-serif;background:#faf8f4;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
  @keyframes gradShift{0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;}}
  @keyframes spinSlow{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
  @keyframes floatUD{0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);}}
  ::-webkit-scrollbar{width:3px;}
  ::-webkit-scrollbar-thumb{background:linear-gradient(#c9a84c,#8B6914);border-radius:2px;}
  @media(max-width:768px){
    .admin-stats{grid-template-columns:1fr 1fr!important;}
    .admin-table{font-size:12px!important;}
  }
`;

function AlvrynIcon({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="adg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c9a84c"/><stop offset="50%" stopColor="#f0d080"/><stop offset="100%" stopColor="#8B6914"/>
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" stroke="url(#adg)" strokeWidth="1.2" fill="none"/>
      <path d="M20 46 L28 18 L36 46" stroke="url(#adg)" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
      <path d="M22.5 36 L33.5 36" stroke="url(#adg)" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M26 46 L34 18 L42 46" stroke="url(#adg)" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.45"/>
    </svg>
  );
}

function StatCard({ icon, label, value, sub, color = GOLD }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.88)", backdropFilter:"blur(10px)", borderRadius:18,
      padding:"22px 20px", border:"1px solid rgba(201,168,76,0.18)", boxShadow:"0 4px 16px rgba(0,0,0,0.05)",
      animation:"fadeUp 0.5s both" }}>
      <div style={{ fontSize:28, marginBottom:10 }}>{icon}</div>
      <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:"#888", letterSpacing:"0.12em", marginBottom:6 }}>{label}</div>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:32, color, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#888", marginTop:6 }}>{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [authed,    setAuthed]    = useState(false);
  const [pw,        setPw]        = useState("");
  const [pwErr,     setPwErr]     = useState("");
  const [tab,       setTab]       = useState("overview");
  const [loading,   setLoading]   = useState(false);
  const [bookings,  setBookings]  = useState([]);
  const [users,     setUsers]     = useState([]);
  const [events,    setEvents]    = useState([]);
  const [promos,    setPromos]    = useState([]);
  const [waitlist,  setWaitlist]  = useState([]);
  const [search,    setSearch]    = useState("");

  // Persist admin session in sessionStorage
  useEffect(() => {
    if (sessionStorage.getItem("alvryn_admin") === "true") setAuthed(true);
  }, []);

  const login = () => {
    if (pw === ADMIN_PW) { setAuthed(true); sessionStorage.setItem("alvryn_admin","true"); }
    else { setPwErr("Incorrect password"); setTimeout(()=>setPwErr(""),2500); }
  };

  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    Promise.all([
      fetch(`${API}/admin/bookings`).then(r=>r.json()).catch(()=>[]),
      fetch(`${API}/admin/users`).then(r=>r.json()).catch(()=>[]),
      fetch(`${API}/admin/events`).then(r=>r.json()).catch(()=>[]),
      fetch(`${API}/admin/promo-codes`).then(r=>r.json()).catch(()=>[]),
      fetch(`${API}/admin/waitlist`).then(r=>r.json()).catch(()=>[]),
    ]).then(([b,u,e,p,w]) => {
      setBookings(Array.isArray(b)?b:[]);
      setUsers(Array.isArray(u)?u:[]);
      setEvents(Array.isArray(e)?e:[]);
      setPromos(Array.isArray(p)?p:[]);
      setWaitlist(Array.isArray(w)?w:[]);
    }).finally(() => setLoading(false));
  }, [authed]);

  if (!authed) return (
    <div style={{ minHeight:"100vh", background:"#faf8f4", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <style>{CSS}</style>
      <div style={{ width:"100%", maxWidth:400, background:"rgba(255,255,255,0.9)", borderRadius:22, padding:"44px 36px",
        boxShadow:"0 24px 80px rgba(0,0,0,0.10)", border:"1px solid rgba(201,168,76,0.2)", textAlign:"center" }}>
        <div style={{ animation:"floatUD 4s ease-in-out infinite", marginBottom:20 }}><AlvrynIcon size={52}/></div>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:26, color:"#1a1410", marginBottom:4 }}>Admin Dashboard</div>
        <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:GOLD, letterSpacing:"0.18em", marginBottom:28 }}>ALVRYN · RESTRICTED</div>
        <input type="password" value={pw} onChange={e=>{setPw(e.target.value);setPwErr("");}} onKeyDown={e=>e.key==="Enter"&&login()}
          placeholder="Enter admin password"
          style={{ width:"100%", padding:"13px 16px", borderRadius:12, fontSize:15, fontFamily:"'DM Sans',sans-serif",
            color:"#1a1410", background:"#fafaf8", border:`1.5px solid ${pwErr?"#ef4444":"rgba(201,168,76,0.3)"}`,
            outline:"none", marginBottom:12 }}/>
        {pwErr && <div style={{ color:"#ef4444", fontSize:13, fontFamily:"'DM Sans',sans-serif", marginBottom:12 }}>{pwErr}</div>}
        <button onClick={login}
          style={{ width:"100%", padding:"13px", borderRadius:12, fontSize:15, fontWeight:700, fontFamily:"'Cormorant Garamond',serif",
            letterSpacing:"0.06em", color:"#1a1410", border:"none", cursor:"pointer", background:GRAD,
            backgroundSize:"200% 200%", animation:"gradShift 3s ease infinite", boxShadow:`0 6px 22px rgba(201,168,76,0.4)` }}>
          Enter
        </button>
      </div>
    </div>
  );

  // ── Computed stats ─────────────────────────────────────────────────────────
  const totalRevenue = bookings.reduce((s,b)=>s+(b.final_price||b.price||0),0);
  const avgBookingVal = bookings.length ? Math.round(totalRevenue/bookings.length) : 0;
  const todayBookings = bookings.filter(b=>{
    const d=new Date(b.booked_at||b.created_at||Date.now());
    const t=new Date();
    return d.getDate()===t.getDate()&&d.getMonth()===t.getMonth()&&d.getFullYear()===t.getFullYear();
  }).length;

  // Event analytics
  const viewDealClicks   = events.filter(e=>e.event_type==="view_deal").length;
  const searchEvents     = events.filter(e=>e.event_type==="search").length;
  const whatsappClicks   = events.filter(e=>e.event_type==="whatsapp_start").length;
  const hotelClicks      = events.filter(e=>e.event_type==="hotel_search").length;
  const busClicks        = events.filter(e=>e.event_type==="bus_search").length;
  const flightSearches   = events.filter(e=>e.event_type==="flight_search").length;

  // Route popularity from bookings
  const routeMap = {};
  bookings.forEach(b=>{
    const key=`${b.from_city||""} → ${b.to_city||""}`;
    routeMap[key]=(routeMap[key]||0)+1;
  });
  const topRoutes = Object.entries(routeMap).sort((a,b)=>b[1]-a[1]).slice(0,8);

  // Airline breakdown
  const airlineMap = {};
  bookings.forEach(b=>{ if(b.airline){airlineMap[b.airline]=(airlineMap[b.airline]||0)+1;} });
  const topAirlines = Object.entries(airlineMap).sort((a,b)=>b[1]-a[1]).slice(0,5);

  // Promo usage
  const promoUsed = bookings.filter(b=>b.promo_code).length;
  const totalDiscount = bookings.reduce((s,b)=>s+(b.discount_applied||0),0);

  // Filter for search
  const filteredBookings = bookings.filter(b=>
    !search ||
    (b.passenger_name||"").toLowerCase().includes(search.toLowerCase()) ||
    (b.user_email||"").toLowerCase().includes(search.toLowerCase()) ||
    (b.from_city||"").toLowerCase().includes(search.toLowerCase()) ||
    (b.to_city||"").toLowerCase().includes(search.toLowerCase()) ||
    (b.airline||"").toLowerCase().includes(search.toLowerCase())
  );

  const filteredUsers = users.filter(u=>
    !search ||
    (u.name||"").toLowerCase().includes(search.toLowerCase()) ||
    (u.email||"").toLowerCase().includes(search.toLowerCase())
  );

  const TABS = [
    {id:"overview",  label:"Overview",   icon:"📊"},
    {id:"bookings",  label:"Bookings",   icon:"🎫"},
    {id:"users",     label:"Users",      icon:"👥"},
    {id:"analytics", label:"Analytics",  icon:"📈"},
    {id:"promos",    label:"Promos",     icon:"🏷️"},
    {id:"waitlist",  label:"Waitlist",   icon:"📋"},
  ];

  const th = {fontFamily:"'Space Mono',monospace",fontSize:9,color:"#888",letterSpacing:"0.12em",padding:"10px 14px",textAlign:"left",borderBottom:"1px solid rgba(201,168,76,0.15)",whiteSpace:"nowrap"};
  const td = {fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#1a1410",padding:"11px 14px",borderBottom:"1px solid rgba(201,168,76,0.08)",verticalAlign:"top"};

  return (
    <div style={{minHeight:"100vh",background:"#faf8f4",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{CSS}</style>

      {/* NAV */}
      <nav style={{height:62,padding:"0 5%",display:"flex",alignItems:"center",justifyContent:"space-between",
        background:"rgba(250,248,244,0.95)",backdropFilter:"blur(22px)",borderBottom:"1px solid rgba(201,168,76,0.12)",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>navigate("/")}>
          <AlvrynIcon size={34}/>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:15,color:"#1a1410",letterSpacing:"0.1em"}}>ALVRYN</div>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:7,color:GOLD,letterSpacing:"0.15em"}}>ADMIN PANEL</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>navigate("/search")} style={{padding:"7px 16px",borderRadius:9,fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:"transparent",color:"#555",border:"1.5px solid rgba(0,0,0,0.12)"}}>Site</button>
          <button onClick={()=>{sessionStorage.removeItem("alvryn_admin");setAuthed(false);}} style={{padding:"7px 16px",borderRadius:9,fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:"#fff0f0",color:"#cc2222",border:"1.5px solid rgba(200,34,34,0.2)"}}>Logout</button>
        </div>
      </nav>

      <div style={{maxWidth:1100,margin:"0 auto",padding:"28px 5% 80px"}}>

        {/* Header */}
        <div style={{marginBottom:24}}>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:GOLD_D,letterSpacing:"0.2em",marginBottom:6}}>DASHBOARD</div>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:"clamp(22px,3.5vw,38px)",color:"#1a1410"}}>
            Alvryn Analytics
          </h1>
          <p style={{fontSize:14,color:"#888",marginTop:4}}>All activity, bookings, users and earnings in one place.</p>
        </div>

        {loading && (
          <div style={{textAlign:"center",padding:"40px 0"}}>
            <div style={{width:40,height:40,border:"3px solid rgba(201,168,76,0.2)",borderTopColor:GOLD,borderRadius:"50%",animation:"spinSlow 1s linear infinite",margin:"0 auto 12px"}}/>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"#888"}}>Loading analytics…</div>
          </div>
        )}

        {!loading && (
          <>
            {/* Tabs */}
            <div style={{display:"flex",gap:0,background:"rgba(255,255,255,0.88)",backdropFilter:"blur(10px)",borderRadius:"14px 14px 0 0",border:"1px solid rgba(201,168,76,0.18)",borderBottom:"none",overflowX:"auto",marginBottom:0}}>
              {TABS.map((t,i)=>(
                <button key={t.id} onClick={()=>setTab(t.id)}
                  style={{display:"flex",alignItems:"center",gap:6,padding:"12px 18px",cursor:"pointer",border:"none",borderBottom:tab===t.id?`2.5px solid ${GOLD}`:"2.5px solid transparent",background:"transparent",color:tab===t.id?GOLD_D:"#888",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,transition:"all 0.2s",whiteSpace:"nowrap",borderRadius:i===0?"14px 0 0 0":i===TABS.length-1?"0 14px 0 0":"0"}}>
                  <span>{t.icon}</span>{t.label}
                </button>
              ))}
            </div>

            <div style={{background:"rgba(255,255,255,0.88)",backdropFilter:"blur(10px)",borderRadius:"0 0 20px 20px",padding:"24px",border:"1px solid rgba(201,168,76,0.15)",borderTop:"none",minHeight:400}}>

              {/* ── OVERVIEW ── */}
              {tab==="overview" && (
                <div>
                  <div className="admin-stats" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
                    <StatCard icon="🎫" label="TOTAL BOOKINGS"   value={bookings.length}          sub={`${todayBookings} today`}/>
                    <StatCard icon="👥" label="REGISTERED USERS" value={users.length}              sub={`${waitlist.length} on waitlist`}/>
                    <StatCard icon="💰" label="TOTAL REVENUE"    value={`₹${totalRevenue.toLocaleString()}`} sub={`avg ₹${avgBookingVal}`} color={GOLD_D}/>
                    <StatCard icon="🔍" label="TOTAL SEARCHES"   value={searchEvents||"—"}          sub={`${viewDealClicks} deal clicks`}/>
                  </div>
                  <div className="admin-stats" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:28}}>
                    <StatCard icon="✈️" label="FLIGHT SEARCHES"  value={flightSearches||"—"}        sub="via web + AI"/>
                    <StatCard icon="🚌" label="BUS SEARCHES"     value={busClicks||"—"}             sub="via web + AI"/>
                    <StatCard icon="🏨" label="HOTEL CLICKS"     value={hotelClicks||"—"}           sub="to Booking.com"/>
                    <StatCard icon="💬" label="WHATSAPP STARTS"  value={whatsappClicks||"—"}        sub="bot activations"/>
                  </div>

                  {/* Top routes */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
                    <div>
                      <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#888",letterSpacing:"0.12em",marginBottom:12}}>TOP BOOKED ROUTES</div>
                      {topRoutes.length===0
                        ? <div style={{fontSize:13,color:"#bbb"}}>No bookings yet</div>
                        : topRoutes.map(([route,count],i)=>(
                          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",marginBottom:6,borderRadius:10,background:"rgba(201,168,76,0.06)",border:"1px solid rgba(201,168,76,0.12)"}}>
                            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#1a1410",fontWeight:500}}>{route}</span>
                            <span style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:GOLD_D,fontWeight:700}}>{count}</span>
                          </div>
                        ))}
                    </div>
                    <div>
                      <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#888",letterSpacing:"0.12em",marginBottom:12}}>TOP AIRLINES BOOKED</div>
                      {topAirlines.length===0
                        ? <div style={{fontSize:13,color:"#bbb"}}>No bookings yet</div>
                        : topAirlines.map(([airline,count],i)=>(
                          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",marginBottom:6,borderRadius:10,background:"rgba(201,168,76,0.06)",border:"1px solid rgba(201,168,76,0.12)"}}>
                            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#1a1410",fontWeight:500}}>{airline}</span>
                            <span style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:GOLD_D,fontWeight:700}}>{count}</span>
                          </div>
                        ))}
                      <div style={{marginTop:16,padding:"14px",borderRadius:12,background:"rgba(201,168,76,0.07)",border:"1px solid rgba(201,168,76,0.2)"}}>
                        <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#888",letterSpacing:"0.12em",marginBottom:8}}>PROMO STATS</div>
                        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#1a1410"}}>
                          Bookings with promo: <strong>{promoUsed}</strong><br/>
                          Total discount given: <strong>₹{totalDiscount.toLocaleString()}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── BOOKINGS ── */}
              {tab==="bookings" && (
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10}}>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:20,color:"#1a1410"}}>All Bookings ({bookings.length})</div>
                    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, email, route…"
                      style={{padding:"9px 14px",borderRadius:10,fontSize:13,fontFamily:"'DM Sans',sans-serif",border:"1.5px solid rgba(201,168,76,0.25)",outline:"none",color:"#1a1410",background:"#fafaf8",width:260}}/>
                  </div>
                  {filteredBookings.length===0
                    ? <div style={{textAlign:"center",padding:"40px",fontSize:14,color:"#bbb"}}>No bookings found</div>
                    : (
                    <div style={{overflowX:"auto"}}>
                      <table className="admin-table" style={{width:"100%",borderCollapse:"collapse"}}>
                        <thead>
                          <tr>
                            {["ID","Passenger","Route","Date","Airline","Class","Seats","Promo","Discount","Paid","User Email","Booked At"].map(h=>(
                              <th key={h} style={th}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredBookings.map((b,i)=>(
                            <tr key={i} style={{background:i%2===0?"transparent":"rgba(201,168,76,0.03)"}}>
                              <td style={td}><span style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:GOLD_D}}>{b.id}</span></td>
                              <td style={td}>{b.passenger_name||"—"}</td>
                              <td style={td}><strong>{b.from_city}</strong> → <strong>{b.to_city}</strong></td>
                              <td style={{...td,whiteSpace:"nowrap"}}>{b.departure_time?new Date(b.departure_time).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}):"—"}</td>
                              <td style={td}>{b.airline||"—"} <span style={{color:"#aaa",fontSize:11}}>{b.flight_no||""}</span></td>
                              <td style={td}>{b.cabin_class||"Economy"}</td>
                              <td style={td}>{b.seats||"Auto"}</td>
                              <td style={td}>{b.promo_code?<span style={{color:"#059669",fontFamily:"'Space Mono',monospace",fontSize:11}}>{b.promo_code}</span>:"—"}</td>
                              <td style={td}>{b.discount_applied?<span style={{color:"#059669"}}>-₹{b.discount_applied}</span>:"—"}</td>
                              <td style={{...td,fontWeight:700,color:GOLD_D}}>₹{(b.final_price||b.price||0).toLocaleString()}</td>
                              <td style={td}>{b.user_email||"—"}</td>
                              <td style={{...td,whiteSpace:"nowrap",fontSize:11,color:"#888"}}>{b.booked_at?new Date(b.booked_at).toLocaleString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit",hour12:false}):"—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ── USERS ── */}
              {tab==="users" && (
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10}}>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:20,color:"#1a1410"}}>Registered Users ({users.length})</div>
                    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or email…"
                      style={{padding:"9px 14px",borderRadius:10,fontSize:13,fontFamily:"'DM Sans',sans-serif",border:"1.5px solid rgba(201,168,76,0.25)",outline:"none",color:"#1a1410",background:"#fafaf8",width:260}}/>
                  </div>
                  <div style={{overflowX:"auto"}}>
                    <table className="admin-table" style={{width:"100%",borderCollapse:"collapse"}}>
                      <thead>
                        <tr>
                          {["ID","Name","Email","Phone","Ref Code","Wallet Balance","Referred By","Joined"].map(h=>(
                            <th key={h} style={th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u,i)=>(
                          <tr key={i} style={{background:i%2===0?"transparent":"rgba(201,168,76,0.03)"}}>
                            <td style={td}>{u.id}</td>
                            <td style={{...td,fontWeight:600}}>{u.name||"—"}</td>
                            <td style={td}>{u.email||"—"}</td>
                            <td style={td}>{u.phone||"—"}</td>
                            <td style={td}><span style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:GOLD_D}}>{u.ref_code||"—"}</span></td>
                            <td style={{...td,color:"#059669",fontWeight:600}}>₹{(u.wallet_balance||0).toLocaleString()}</td>
                            <td style={td}>{u.referred_by||"—"}</td>
                            <td style={{...td,fontSize:11,color:"#888",whiteSpace:"nowrap"}}>{u.created_at?new Date(u.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}):"—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── ANALYTICS ── */}
              {tab==="analytics" && (
                <div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:20,color:"#1a1410",marginBottom:20}}>User Behaviour &amp; Traffic</div>
                  <div className="admin-stats" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:24}}>
                    <StatCard icon="🔍" label="TOTAL SEARCHES"   value={searchEvents||0}   sub="all types"/>
                    <StatCard icon="👆" label="VIEW DEAL CLICKS" value={viewDealClicks||0}  sub="→ affiliate"/>
                    <StatCard icon="📊" label="CONVERSION RATE"  value={searchEvents?`${Math.round((viewDealClicks/searchEvents)*100)||0}%`:"—"} sub="searches → clicks" color={GOLD_D}/>
                    <StatCard icon="✈️" label="FLIGHT SEARCHES"  value={flightSearches||0} sub="web + AI + WhatsApp"/>
                    <StatCard icon="🚌" label="BUS SEARCHES"     value={busClicks||0}       sub="web + AI + WhatsApp"/>
                    <StatCard icon="🏨" label="HOTEL SEARCHES"   value={hotelClicks||0}     sub="→ Booking.com"/>
                  </div>

                  {/* Recent events table */}
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#888",letterSpacing:"0.12em",marginBottom:12}}>RECENT EVENTS (last 50)</div>
                  {events.length===0
                    ? <div style={{fontSize:14,color:"#bbb",textAlign:"center",padding:"28px 0"}}>No events tracked yet. Events are logged when users search or click deals.</div>
                    : (
                    <div style={{overflowX:"auto"}}>
                      <table className="admin-table" style={{width:"100%",borderCollapse:"collapse"}}>
                        <thead>
                          <tr>{["Event","Details","Source","User","Time"].map(h=><th key={h} style={th}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                          {events.slice(0,50).map((e,i)=>(
                            <tr key={i} style={{background:i%2===0?"transparent":"rgba(201,168,76,0.03)"}}>
                              <td style={td}><span style={{padding:"2px 8px",borderRadius:6,fontSize:11,background:`rgba(201,168,76,0.12)`,color:GOLD_D,fontFamily:"'Space Mono',monospace"}}>{e.event_type}</span></td>
                              <td style={td}>{e.details||"—"}</td>
                              <td style={td}>{e.source||"web"}</td>
                              <td style={{...td,fontSize:11}}>{e.user_id||"anon"}</td>
                              <td style={{...td,fontSize:11,color:"#888",whiteSpace:"nowrap"}}>{e.created_at?new Date(e.created_at).toLocaleString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit",hour12:false}):"—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ── PROMOS ── */}
              {tab==="promos" && (
                <div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:20,color:"#1a1410",marginBottom:20}}>Promo Codes</div>
                  <div style={{overflowX:"auto"}}>
                    <table className="admin-table" style={{width:"100%",borderCollapse:"collapse"}}>
                      <thead>
                        <tr>{["Code","Type","Discount","Min Booking","Max Uses","Used","Status","Description"].map(h=><th key={h} style={th}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {promos.map((p,i)=>(
                          <tr key={i} style={{background:i%2===0?"transparent":"rgba(201,168,76,0.03)"}}>
                            <td style={td}><span style={{fontFamily:"'Space Mono',monospace",fontSize:12,color:GOLD_D,fontWeight:700}}>{p.code}</span></td>
                            <td style={td}>{p.discount_type}</td>
                            <td style={{...td,fontWeight:600,color:"#059669"}}>{p.discount_type==="percent"?`${p.discount_value}%`:`₹${p.discount_value}`}</td>
                            <td style={td}>₹{(p.min_booking_amount||0).toLocaleString()}</td>
                            <td style={td}>{p.max_uses}</td>
                            <td style={{...td,fontWeight:600}}>{p.used_count||0}</td>
                            <td style={td}><span style={{padding:"2px 9px",borderRadius:100,fontSize:10,background:p.is_active?"rgba(5,150,105,0.1)":"rgba(239,68,68,0.1)",color:p.is_active?"#059669":"#ef4444",fontFamily:"'Space Mono',monospace"}}>{p.is_active?"ACTIVE":"OFF"}</span></td>
                            <td style={{...td,fontSize:12,color:"#666"}}>{p.description||"—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── WAITLIST ── */}
              {tab==="waitlist" && (
                <div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:20,color:"#1a1410",marginBottom:20}}>
                    Waitlist ({waitlist.length} members)
                  </div>
                  <div style={{overflowX:"auto"}}>
                    <table className="admin-table" style={{width:"100%",borderCollapse:"collapse"}}>
                      <thead>
                        <tr>{["Email","Ref Code","Referrals","Referred By","Joined"].map(h=><th key={h} style={th}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {waitlist.map((w,i)=>(
                          <tr key={i} style={{background:i%2===0?"transparent":"rgba(201,168,76,0.03)"}}>
                            <td style={{...td,fontWeight:500}}>{w.email}</td>
                            <td style={td}><span style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:GOLD_D}}>{w.ref_code}</span></td>
                            <td style={{...td,fontWeight:700,color:w.ref_count>0?"#059669":"#aaa"}}>{w.ref_count||0}</td>
                            <td style={td}>{w.referred_by||"—"}</td>
                            <td style={{...td,fontSize:11,color:"#888"}}>{w.joined_at?new Date(w.joined_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}):"—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}