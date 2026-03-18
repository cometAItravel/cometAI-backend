import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = "https://cometai-backend.onrender.com";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;800&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #01020a; color: #e8eaf6; font-family: 'DM Sans', sans-serif; min-height: 100vh; }

  .stars-bg { position:fixed; inset:0; z-index:0; pointer-events:none; background: radial-gradient(ellipse at 15% 50%, rgba(99,43,200,0.28) 0%, transparent 55%), radial-gradient(ellipse at 85% 20%, rgba(25,90,220,0.22) 0%, transparent 50%), #01020a; }
  .star { position:absolute; border-radius:50%; background:white; animation:twinkle var(--d,3s) ease-in-out infinite var(--delay,0s); }
  @keyframes twinkle { 0%,100%{opacity:var(--min-op,.2);transform:scale(1);}50%{opacity:1;transform:scale(1.5);} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(24px);}to{opacity:1;transform:translateY(0);} }

  .page-wrap { position:relative; z-index:1; min-height:100vh; padding:0 20px 60px; max-width:900px; margin:0 auto; }

  .nav { display:flex; align-items:center; justify-content:space-between; padding:20px 0 32px; border-bottom:1px solid rgba(255,255,255,0.08); margin-bottom:40px; }
  .nav-logo { font-family:'Orbitron',sans-serif; font-size:18px; font-weight:800; background:linear-gradient(90deg,#818cf8,#c084fc); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; cursor:pointer; }
  .btn-ghost { background:transparent; border:1px solid rgba(129,140,248,0.35); color:#a5b4fc; padding:8px 16px; border-radius:8px; font-family:'DM Sans',sans-serif; font-size:13px; cursor:pointer; transition:all 0.2s; }
  .btn-ghost:hover { background:rgba(129,140,248,0.1); }

  .page-title { font-family:'Orbitron',sans-serif; font-size:24px; font-weight:800; background:linear-gradient(135deg,#e0e7ff,#a5b4fc); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; margin-bottom:8px; animation:fadeUp 0.5s ease both; }
  .page-sub { font-size:14px; color:rgba(165,180,252,0.4); margin-bottom:32px; animation:fadeUp 0.5s ease 0.1s both; }

  .bookings-grid { display:flex; flex-direction:column; gap:16px; animation:fadeUp 0.5s ease 0.2s both; }

  .booking-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:20px; transition:all 0.2s; position:relative; overflow:hidden; }
  .booking-card::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(99,102,241,0.04) 0%,transparent 60%); pointer-events:none; }
  .booking-card:hover { border-color:rgba(129,140,248,0.3); }

  .booking-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
  .booking-id { font-size:11px; letter-spacing:1px; color:rgba(165,180,252,0.4); }
  .booking-status { padding:4px 10px; border-radius:20px; font-size:11px; background:rgba(52,211,153,0.1); border:1px solid rgba(52,211,153,0.2); color:#6ee7b7; }

  .booking-route { display:flex; align-items:center; gap:16px; margin-bottom:16px; }
  .route-city-block { }
  .route-city-name { font-family:'Orbitron',sans-serif; font-size:18px; font-weight:800; color:#e0e7ff; }
  .route-city-label { font-size:11px; color:rgba(165,180,252,0.4); margin-top:2px; }
  .route-arrow { font-size:20px; color:rgba(129,140,248,0.4); }

  .booking-details { display:flex; gap:24px; flex-wrap:wrap; padding-top:16px; border-top:1px solid rgba(255,255,255,0.05); }
  .detail-item { }
  .detail-label { font-size:10px; letter-spacing:1.5px; text-transform:uppercase; color:rgba(165,180,252,0.35); margin-bottom:4px; }
  .detail-value { font-size:14px; color:#e0e7ff; font-weight:500; }
  .detail-price { font-family:'Orbitron',sans-serif; font-size:16px; font-weight:800; background:linear-gradient(135deg,#a5f3fc,#818cf8); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }

  .empty-state { text-align:center; padding:80px 20px; animation:fadeUp 0.5s ease both; }
  .empty-icon { font-size:52px; margin-bottom:16px; opacity:0.4; }
  .empty-title { font-family:'Orbitron',sans-serif; font-size:16px; color:rgba(165,180,252,0.3); margin-bottom:12px; }
  .empty-sub { font-size:14px; color:rgba(165,180,252,0.2); margin-bottom:24px; }
  .btn-search { background:linear-gradient(135deg,#6366f1,#8b5cf6); border:none; color:white; padding:12px 28px; border-radius:12px; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:500; cursor:pointer; transition:all 0.2s; }
  .btn-search:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(99,102,241,0.4); }

  .loading { text-align:center; padding:60px; color:rgba(129,140,248,0.6); font-family:'Orbitron',sans-serif; font-size:11px; letter-spacing:3px; animation:pulse 1.5s ease infinite; }
  @keyframes pulse { 0%,100%{opacity:0.5}50%{opacity:1} }
`;

function Stars() {
  const stars = Array.from({length:80},(_,i)=>({id:i,x:Math.random()*100,y:Math.random()*100,size:Math.random()*2+0.3,duration:Math.random()*5+2,delay:Math.random()*6,minOp:Math.random()*0.15+0.05}));
  return<div className="stars-bg">{stars.map(s=><div key={s.id} className="star" style={{left:`${s.x}%`,top:`${s.y}%`,width:s.size,height:s.size,'--d':`${s.duration}s`,'--delay':`${s.delay}s`,'--min-op':s.minOp}}/>)}</div>;
}

function formatDate(dt){
  if(!dt)return"—";
  return new Date(dt).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
}
function formatTime(dt){
  if(!dt)return"—";
  return new Date(dt).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false});
}

function MyBookings(){
  const [bookings,setBookings]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const navigate=useNavigate();

  useEffect(()=>{
    const fetchBookings=async()=>{
      const token=localStorage.getItem("token");
      if(!token){ navigate("/login"); return; }
      try{
        const response=await axios.get(`${API}/my-bookings`,{
          headers:{Authorization:`Bearer ${token}`}
        });
        setBookings(response.data);
      }catch(err){
        console.error(err);
        if(err.response?.status===401||err.response?.status===403){
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          setError("Failed to load bookings. Please try again.");
        }
      }
      setLoading(false);
    };
    fetchBookings();
  },[navigate]);

  return(
    <>
      <style>{styles}</style>
      <Stars/>
      <div className="page-wrap">
        <nav className="nav">
          <div className="nav-logo" onClick={()=>navigate("/")}>☄️ CometAI</div>
          <button className="btn-ghost" onClick={()=>navigate("/search")}>← Search Flights</button>
        </nav>

        <div className="page-title">My Bookings</div>
        <div className="page-sub">Your flight booking history</div>

        {loading&&<div className="loading">Loading your bookings...</div>}

        {!loading&&error&&(
          <div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",color:"#fca5a5",padding:"16px",borderRadius:"12px",fontSize:"14px"}}>
            ⚠ {error}
          </div>
        )}

        {!loading&&!error&&bookings.length===0&&(
          <div className="empty-state">
            <div className="empty-icon">✈️</div>
            <div className="empty-title">No bookings yet</div>
            <div className="empty-sub">Your confirmed flights will appear here</div>
            <button className="btn-search" onClick={()=>navigate("/search")}>Search Flights →</button>
          </div>
        )}

        {!loading&&bookings.length>0&&(
          <div className="bookings-grid">
            {bookings.map(booking=>(
              <div className="booking-card" key={booking.id}>
                <div className="booking-top">
                  <div className="booking-id">Booking #{booking.id}</div>
                  <div className="booking-status">✓ Confirmed</div>
                </div>
                <div className="booking-route">
                  <div className="route-city-block">
                    <div className="route-city-name">{booking.from_city?.slice(0,3).toUpperCase()}</div>
                    <div className="route-city-label">{booking.from_city}</div>
                  </div>
                  <div className="route-arrow">✈</div>
                  <div className="route-city-block">
                    <div className="route-city-name">{booking.to_city?.slice(0,3).toUpperCase()}</div>
                    <div className="route-city-label">{booking.to_city}</div>
                  </div>
                </div>
                <div className="booking-details">
                  <div className="detail-item">
                    <div className="detail-label">Passenger</div>
                    <div className="detail-value">{booking.passenger_name}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Date</div>
                    <div className="detail-value">{formatDate(booking.departure_time)}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Time</div>
                    <div className="detail-value">{formatTime(booking.departure_time)}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Amount</div>
                    <div className="detail-price">₹{booking.price?.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default MyBookings;