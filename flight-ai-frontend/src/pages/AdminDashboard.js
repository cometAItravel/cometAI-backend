import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = "https://cometai-backend.onrender.com";
const ADMIN_PASSWORD = "user2026admin";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #080a0f; color: #e2e8f0; font-family: 'DM Sans', sans-serif; min-height: 100vh; }
  .admin-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; background: #080a0f; background-image: linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px); background-size: 40px 40px; }
  .admin-bg::after { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 60%); }
  .dashboard { position: relative; z-index: 1; min-height: 100vh; }
  .topbar { display: flex; align-items: center; justify-content: space-between; padding: 20px 32px; border-bottom: 1px solid rgba(255,255,255,0.06); background: rgba(8,10,15,0.8); backdrop-filter: blur(12px); position: sticky; top: 0; z-index: 50; }
  .topbar-left { display: flex; align-items: center; gap: 16px; }
  .topbar-logo { font-family: 'Space Mono', monospace; font-size: 14px; font-weight: 700; color: #6366f1; letter-spacing: 1px; }
  .topbar-divider { width: 1px; height: 20px; background: rgba(255,255,255,0.1); }
  .topbar-title { font-size: 13px; color: #475569; letter-spacing: 1px; text-transform: uppercase; }
  .topbar-right { display: flex; align-items: center; gap: 12px; }
  .live-badge { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #10b981; letter-spacing: 1px; background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2); padding: 4px 10px; border-radius: 20px; }
  .live-dot { width: 6px; height: 6px; background: #10b981; border-radius: 50%; animation: blink 2s ease infinite; }
  @keyframes blink { 0%,100%{opacity:1;}50%{opacity:0.3;} }
  .btn-logout-admin { background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #64748b; padding: 6px 14px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 12px; cursor: pointer; transition: all 0.2s; }
  .btn-logout-admin:hover { border-color: rgba(239,68,68,0.3); color: #f87171; }
  .content { padding: 32px; }
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }
  .stat-card { background: rgba(15,17,26,0.8); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 24px; position: relative; overflow: hidden; transition: all 0.2s; }
  .stat-card:hover { border-color: rgba(99,102,241,0.2); transform: translateY(-2px); }
  .stat-card::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(99,102,241,0.04) 0%, transparent 60%); pointer-events: none; }
  .stat-icon { font-size: 24px; margin-bottom: 12px; }
  .stat-label { font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #475569; margin-bottom: 8px; }
  .stat-value { font-family: 'Space Mono', monospace; font-size: 28px; font-weight: 700; color: #f8fafc; }
  .stat-sub { font-size: 12px; color: #10b981; margin-top: 4px; }
  .tabs { display: flex; gap: 4px; margin-bottom: 24px; background: rgba(15,17,26,0.6); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 4px; width: fit-content; }
  .tab-btn { padding: 8px 20px; border: none; background: transparent; color: #64748b; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; border-radius: 8px; transition: all 0.2s; }
  .tab-btn.active { background: rgba(99,102,241,0.15); color: #a5b4fc; }
  .tab-btn:hover:not(.active) { color: #94a3b8; }
  .table-wrap { background: rgba(15,17,26,0.8); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; overflow: hidden; }
  .table-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.06); }
  .table-title { font-family: 'Space Mono', monospace; font-size: 13px; font-weight: 700; color: #e2e8f0; letter-spacing: 0.5px; }
  .table-count { font-size: 11px; color: #475569; background: rgba(255,255,255,0.04); padding: 3px 10px; border-radius: 20px; }
  table { width: 100%; border-collapse: collapse; }
  th { padding: 12px 24px; text-align: left; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #475569; border-bottom: 1px solid rgba(255,255,255,0.06); font-weight: 500; font-family: 'Space Mono', monospace; }
  td { padding: 14px 24px; font-size: 13px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.04); }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: rgba(99,102,241,0.03); color: #e2e8f0; }
  .td-highlight { color: #e2e8f0; font-weight: 500; }
  .td-price { font-family: 'Space Mono', monospace; color: #6ee7b7; font-size: 12px; }
  .td-route { display: flex; align-items: center; gap: 6px; }
  .td-badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 10px; letter-spacing: 0.5px; }
  .badge-confirmed { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); color: #10b981; }
  .badge-user { background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2); color: #818cf8; }
  .routes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
  .route-card { background: rgba(15,17,26,0.8); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 16px; transition: all 0.2s; }
  .route-card:hover { border-color: rgba(99,102,241,0.2); }
  .route-name { font-size: 13px; font-weight: 600; color: #e2e8f0; margin-bottom: 6px; }
  .route-count { font-family: 'Space Mono', monospace; font-size: 20px; font-weight: 700; color: #6366f1; }
  .route-label { font-size: 11px; color: #475569; margin-top: 2px; }
  .route-bar { width: 100%; height: 3px; background: rgba(255,255,255,0.06); border-radius: 2px; margin-top: 10px; }
  .route-bar-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #8b5cf6); border-radius: 2px; transition: width 1s ease; }
  .loading-admin { text-align: center; padding: 60px; color: #475569; font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 2px; }
  .empty-admin { text-align: center; padding: 40px; color: #475569; font-size: 13px; }
  @media(max-width:768px) {
    .topbar { padding: 16px 20px; }
    .content { padding: 20px 16px; }
    th, td { padding: 12px 16px; }
    .stats-grid { grid-template-columns: 1fr 1fr; }
  }
`;

function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("admin_auth", "true");
      onLogin();
    } else {
      setError("Invalid password. Access denied.");
      setPassword("");
    }
  };

  return (
    <div style={{minHeight:"100vh", background:"#080a0f", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px"}}>
      <style>{styles}</style>
      <div className="admin-bg"/>
      <div style={{background:"rgba(15,17,26,0.95)", border:"1px solid rgba(99,102,241,0.4)", borderRadius:"16px", padding:"48px 40px", width:"100%", maxWidth:"400px", position:"relative", zIndex:1}}>
        <div style={{color:"#6366f1", fontSize:"11px", letterSpacing:"3px", textTransform:"uppercase", marginBottom:"24px"}}>— Admin Access</div>
        <div style={{fontFamily:"'Space Mono',monospace", color:"#f8fafc", fontSize:"22px", fontWeight:"700", marginBottom:"8px"}}>CometAI Control</div>
        <div style={{color:"#64748b", fontSize:"13px", marginBottom:"32px"}}>Restricted area. Authorized personnel only.</div>
        {error && <div style={{background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", color:"#f87171", padding:"10px 14px", borderRadius:"8px", fontSize:"12px", marginBottom:"16px"}}>⚠ {error}</div>}
        <input
          style={{width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:"10px", padding:"13px 16px", color:"#f8fafc", fontSize:"14px", outline:"none", marginBottom:"16px", boxSizing:"border-box", fontFamily:"monospace", letterSpacing:"2px"}}
          type="password"
          placeholder="Enter admin password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyPress={e => { if (e.key === "Enter") handleLogin(); }}
          autoFocus
        />
        <button
          style={{width:"100%", padding:"13px", background:"#6366f1", border:"none", borderRadius:"10px", color:"white", fontSize:"14px", fontWeight:"600", cursor:"pointer", fontFamily:"'DM Sans',sans-serif"}}
          onClick={handleLogin}
        >Access Dashboard →</button>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [tab, setTab] = useState("bookings");
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem("admin_auth") === "true") {
      setAuthed(true);
      fetchData();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const [bookingsRes, usersRes] = await Promise.all([
        axios.get(`${API}/admin/bookings`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/admin/users`, { headers }).catch(() => ({ data: [] })),
      ]);
      setBookings(bookingsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleLogin = () => { setAuthed(true); fetchData(); };
  const handleLogout = () => { sessionStorage.removeItem("admin_auth"); setAuthed(false); };

  if (!authed) return <AdminLogin onLogin={handleLogin} />;

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.price || 0), 0);
  const routeCounts = {};
  bookings.forEach(b => {
    const route = `${b.from_city} → ${b.to_city}`;
    routeCounts[route] = (routeCounts[route] || 0) + 1;
  });
  const topRoutes = Object.entries(routeCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxRoute = topRoutes[0]?.[1] || 1;

  function formatDate(dt) {
    if (!dt) return "—";
    return new Date(dt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }
  function formatTime(dt) {
    if (!dt) return "";
    return new Date(dt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
  }

  return (
    <div className="dashboard">
      <style>{styles}</style>
      <div className="admin-bg"/>
      <div className="topbar">
        <div className="topbar-left">
          <div className="topbar-logo">☄ COMETAI</div>
          <div className="topbar-divider"/>
          <div className="topbar-title">Admin Dashboard</div>
        </div>
        <div className="topbar-right">
          <div className="live-badge"><div className="live-dot"/>LIVE</div>
          <button className="btn-logout-admin" onClick={() => navigate("/search")}>← Back to App</button>
          <button className="btn-logout-admin" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="content">
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-icon">✈️</div><div className="stat-label">Total Bookings</div><div className="stat-value">{bookings.length}</div><div className="stat-sub">↑ All time</div></div>
          <div className="stat-card"><div className="stat-icon">👥</div><div className="stat-label">Total Users</div><div className="stat-value">{users.length}</div><div className="stat-sub">↑ Registered</div></div>
          <div className="stat-card"><div className="stat-icon">💰</div><div className="stat-label">Total Revenue</div><div className="stat-value">₹{totalRevenue.toLocaleString()}</div><div className="stat-sub">↑ Mock payments</div></div>
          <div className="stat-card"><div className="stat-icon">🗺️</div><div className="stat-label">Active Routes</div><div className="stat-value">{topRoutes.length}</div><div className="stat-sub">↑ Unique routes</div></div>
        </div>

        <div className="tabs">
          {[["bookings","✈️ Bookings"],["users","👥 Users"],["routes","🗺️ Routes"]].map(([id,label]) => (
            <button key={id} className={`tab-btn ${tab===id?"active":""}`} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>

        {loading && <div className="loading-admin">Loading data...</div>}

        {!loading && tab === "bookings" && (
          <div className="table-wrap">
            <div className="table-header">
              <div className="table-title">All Bookings</div>
              <div className="table-count">{bookings.length} total</div>
            </div>
            {bookings.length === 0 ? <div className="empty-admin">No bookings yet</div> : (
              <table>
                <thead><tr><th>#</th><th>Passenger</th><th>Route</th><th>Date & Time</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id}>
                      <td style={{fontFamily:"Space Mono",fontSize:"11px",color:"#475569"}}>#{b.id}</td>
                      <td className="td-highlight">{b.passenger_name}</td>
                      <td><div className="td-route"><span style={{color:"#e2e8f0",fontWeight:"500"}}>{b.from_city}</span><span style={{color:"#475569",margin:"0 4px"}}>→</span><span style={{color:"#e2e8f0",fontWeight:"500"}}>{b.to_city}</span></div></td>
                      <td>{formatDate(b.departure_time)} {formatTime(b.departure_time)}</td>
                      <td className="td-price">₹{b.price?.toLocaleString()}</td>
                      <td><span className="td-badge badge-confirmed">✓ Confirmed</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {!loading && tab === "users" && (
          <div className="table-wrap">
            <div className="table-header">
              <div className="table-title">All Users</div>
              <div className="table-count">{users.length} registered</div>
            </div>
            {users.length === 0 ? <div className="empty-admin">No users yet</div> : (
              <table>
                <thead><tr><th>#</th><th>Name</th><th>Email</th><th>User ID</th><th>Role</th></tr></thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.id}>
                      <td style={{fontFamily:"Space Mono",fontSize:"11px",color:"#475569"}}>#{i+1}</td>
                      <td className="td-highlight">{u.name}</td>
                      <td>{u.email}</td>
                      <td style={{fontFamily:"Space Mono",fontSize:"11px",color:"#475569"}}>{u.id}</td>
                      <td><span className="td-badge badge-user">User</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {!loading && tab === "routes" && (
          <>
            <div className="table-header" style={{background:"rgba(15,17,26,0.8)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"14px 14px 0 0",marginBottom:0}}>
              <div className="table-title">Popular Routes</div>
              <div className="table-count">{topRoutes.length} routes</div>
            </div>
            {topRoutes.length === 0 ? (
              <div className="empty-admin" style={{background:"rgba(15,17,26,0.8)",border:"1px solid rgba(255,255,255,0.06)",borderTop:"none",borderRadius:"0 0 14px 14px"}}>No booking data yet</div>
            ) : (
              <div style={{background:"rgba(15,17,26,0.8)",border:"1px solid rgba(255,255,255,0.06)",borderTop:"none",borderRadius:"0 0 14px 14px",padding:"20px"}}>
                <div className="routes-grid">
                  {topRoutes.map(([route, count]) => (
                    <div className="route-card" key={route}>
                      <div className="route-name">{route}</div>
                      <div className="route-count">{count}</div>
                      <div className="route-label">bookings</div>
                      <div className="route-bar"><div className="route-bar-fill" style={{width:`${(count/maxRoute)*100}%`}}/></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;