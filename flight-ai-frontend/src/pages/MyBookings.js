import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;800&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #01020a;
    color: #e8eaf6;
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
  }

  .stars-bg {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background:
      radial-gradient(ellipse at 20% 50%, rgba(63,43,150,0.15) 0%, transparent 60%),
      radial-gradient(ellipse at 80% 20%, rgba(25,90,180,0.12) 0%, transparent 55%),
      #01020a;
  }

  .star {
    position: absolute;
    border-radius: 50%;
    background: white;
    animation: twinkle var(--d, 3s) ease-in-out infinite var(--delay, 0s);
  }

  @keyframes twinkle {
    0%, 100% { opacity: var(--min-op, 0.2); }
    50% { opacity: 1; }
  }

  .page-wrap {
    position: relative;
    z-index: 1;
    min-height: 100vh;
    padding: 0 24px 60px;
    max-width: 900px;
    margin: 0 auto;
    animation: fadeUp 0.6s ease both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 28px 0 40px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    margin-bottom: 48px;
  }

  .nav-logo {
    font-family: 'Orbitron', sans-serif;
    font-size: 22px;
    font-weight: 800;
    letter-spacing: 1px;
    background: linear-gradient(90deg, #818cf8, #c084fc, #38bdf8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    cursor: pointer;
  }

  .btn-ghost {
    background: transparent;
    border: 1px solid rgba(129,140,248,0.35);
    color: #a5b4fc;
    padding: 9px 20px;
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-ghost:hover {
    background: rgba(129,140,248,0.1);
    border-color: rgba(129,140,248,0.6);
  }

  .page-title {
    font-family: 'Orbitron', sans-serif;
    font-size: clamp(22px, 4vw, 36px);
    font-weight: 800;
    background: linear-gradient(135deg, #e0e7ff, #a5b4fc, #c084fc);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 8px;
  }

  .page-sub {
    font-size: 14px;
    color: rgba(165,180,252,0.4);
    margin-bottom: 36px;
    font-weight: 300;
    letter-spacing: 0.3px;
  }

  .bookings-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .booking-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px;
    padding: 24px 28px;
    display: grid;
    grid-template-columns: 1fr auto 1fr auto;
    align-items: center;
    gap: 20px;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
  }

  .booking-card::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, #6366f1, #8b5cf6, #38bdf8);
    border-radius: 3px 0 0 3px;
  }

  .booking-card:hover {
    border-color: rgba(129,140,248,0.25);
    background: rgba(255,255,255,0.05);
    transform: translateX(4px);
  }

  .booking-label {
    font-size: 10px;
    color: rgba(165,180,252,0.35);
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 4px;
  }

  .booking-value {
    font-size: 15px;
    color: #c7d2fe;
    font-weight: 400;
  }

  .route-display {
    display: flex;
    align-items: center;
    gap: 14px;
    flex: 1;
    justify-content: center;
  }

  .city-code {
    font-family: 'Orbitron', sans-serif;
    font-size: 20px;
    font-weight: 800;
    color: #e0e7ff;
    letter-spacing: 2px;
  }

  .city-name {
    font-size: 11px;
    color: rgba(165,180,252,0.4);
    margin-top: 3px;
    text-align: center;
  }

  .route-line-bar {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, rgba(129,140,248,0.15), rgba(192,132,252,0.35), rgba(129,140,248,0.15));
    min-width: 40px;
  }

  .price-tag {
    text-align: right;
  }

  .price-amount {
    font-family: 'Orbitron', sans-serif;
    font-size: 20px;
    font-weight: 800;
    background: linear-gradient(135deg, #a5f3fc, #818cf8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .booking-date {
    font-size: 11px;
    color: rgba(165,180,252,0.35);
    margin-top: 4px;
    letter-spacing: 0.3px;
  }

  .passenger-block {}

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(52,211,153,0.1);
    border: 1px solid rgba(52,211,153,0.25);
    color: #6ee7b7;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 11px;
    letter-spacing: 1px;
    font-weight: 500;
    margin-top: 8px;
  }

  .empty-state {
    text-align: center;
    padding: 100px 20px;
    color: rgba(165,180,252,0.2);
  }

  .empty-icon { font-size: 52px; margin-bottom: 20px; opacity: 0.3; }

  .empty-title {
    font-family: 'Orbitron', sans-serif;
    font-size: 14px;
    letter-spacing: 3px;
    margin-bottom: 12px;
  }

  .empty-sub {
    font-size: 13px;
    font-weight: 300;
    color: rgba(165,180,252,0.2);
  }

  .btn-primary {
    display: inline-block;
    margin-top: 24px;
    background: linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3));
    border: 1px solid rgba(129,140,248,0.4);
    color: #a5b4fc;
    padding: 12px 28px;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary:hover {
    background: linear-gradient(135deg, rgba(99,102,241,0.5), rgba(139,92,246,0.5));
    color: #e0e7ff;
    transform: translateY(-1px);
  }

  .loading {
    text-align: center;
    padding: 60px;
    color: rgba(129,140,248,0.5);
    font-family: 'Orbitron', sans-serif;
    font-size: 11px;
    letter-spacing: 3px;
    animation: pulse 1.5s ease infinite;
  }

  @keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:1} }
`;

const CITY_CODES = {
  bangalore: 'BLR', mumbai: 'BOM', delhi: 'DEL',
  chennai: 'MAA', hyderabad: 'HYD', kolkata: 'CCU',
  goa: 'GOI', pune: 'PNQ', dubai: 'DXB', kochi: 'COK',
};

function Stars() {
  const stars = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    duration: Math.random() * 4 + 2,
    delay: Math.random() * 4,
  }));
  return (
    <div className="stars-bg">
      {stars.map(s => (
        <div key={s.id} className="star" style={{
          left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size,
          '--d': `${s.duration}s`, '--delay': `${s.delay}s`, '--min-op': 0.1,
        }} />
      ))}
    </div>
  );
}

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getCode = (city) => CITY_CODES[city?.toLowerCase()] || city?.slice(0,3).toUpperCase();

  useEffect(() => {
    const fetchBookings = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await axios.get("https://cometai-backend.onrender.com/my-bookings", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBookings(response.data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchBookings();
  }, []);

  return (
    <>
      <style>{styles}</style>
      <Stars />
      <div className="page-wrap">
        <nav className="nav">
          <div className="nav-logo" onClick={() => navigate("/")}>☄ CometAI</div>
          <button className="btn-ghost" onClick={() => navigate("/")}>
            ← Search Flights
          </button>
        </nav>

        <h1 className="page-title">My Bookings</h1>
        <p className="page-sub">Your upcoming journeys across the galaxy</p>

        {loading && <div className="loading">Loading your bookings...</div>}

        {!loading && bookings.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🛸</div>
            <div className="empty-title">No missions yet</div>
            <div className="empty-sub">Book your first flight to get started</div>
            <button className="btn-primary" onClick={() => navigate("/")}>
              Search Flights →
            </button>
          </div>
        )}

        {!loading && bookings.length > 0 && (
          <div className="bookings-list">
            {bookings.map((booking) => (
              <div className="booking-card" key={booking.id}>

                <div className="passenger-block">
                  <div className="booking-label">Passenger</div>
                  <div className="booking-value">{booking.passenger_name}</div>
                  <div className="status-badge">✦ Confirmed</div>
                </div>

                <div className="route-display">
                  <div>
                    <div className="city-code">{getCode(booking.from_city)}</div>
                    <div className="city-name">{booking.from_city}</div>
                  </div>
                  <div className="route-line-bar" />
                  <span style={{ fontSize: 14 }}>✈</span>
                  <div className="route-line-bar" />
                  <div>
                    <div className="city-code">{getCode(booking.to_city)}</div>
                    <div className="city-name">{booking.to_city}</div>
                  </div>
                </div>

                <div className="price-tag">
                  <div className="price-amount">₹{booking.price?.toLocaleString()}</div>
                  <div className="booking-date">
                    {booking.departure_time
                      ? new Date(booking.departure_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : "—"}
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