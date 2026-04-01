import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const API = "https://cometai-backend.onrender.com";
const GOLD = "#c9a84c";
const GOLD_DARK = "#8B6914";
const GRAD = "linear-gradient(135deg,#c9a84c,#f0d080,#c9a84c)";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'DM Sans',sans-serif;background:#faf8f4;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
  @keyframes floatUD{0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);}}
  @keyframes gradShift{0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;}}
  @keyframes spinSlow{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
`;

function AlvrynIcon({ size = 40 }) {
  const uid = `up_${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id={`${uid}g`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c9a84c"/>
          <stop offset="50%" stopColor="#f0d080"/>
          <stop offset="100%" stopColor="#8B6914"/>
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" stroke={`url(#${uid}g)`} strokeWidth="1.2" fill="none"/>
      <circle cx="32" cy="32" r="26" stroke={`url(#${uid}g)`} strokeWidth="0.5" fill="none" opacity="0.4"/>
      <path d="M20 46 L28 18 L36 46" stroke={`url(#${uid}g)`} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M22.5 36 L33.5 36" stroke={`url(#${uid}g)`} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M26 46 L34 18 L42 46" stroke={`url(#${uid}g)`} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.45"/>
      <path d="M28 36 L40 36" stroke={`url(#${uid}g)`} strokeWidth="1" strokeLinecap="round" opacity="0.45"/>
    </svg>
  );
}

function AuroraBackground() {
  const ref = useRef(null);
  const raf = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    let W = c.offsetWidth, H = c.offsetHeight;
    c.width = W; c.height = H;
    const cols = ["#c9a84c", "#f0d080", "#8B6914", "#d4b868"];
    const blobs = Array.from({ length: 4 }, (_, i) => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      r: 180 + Math.random() * 140, ci: i % cols.length,
    }));
    const resize = () => { W = c.offsetWidth; H = c.offsetHeight; c.width = W; c.height = H; };
    window.addEventListener("resize", resize);
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      blobs.forEach(b => {
        b.x += b.vx; b.y += b.vy;
        if (b.x < -b.r || b.x > W + b.r) b.vx *= -1;
        if (b.y < -b.r || b.y > H + b.r) b.vy *= -1;
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        g.addColorStop(0, cols[b.ci] + "18");
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
      });
      raf.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}/>
  );
}

export default function UserProfile() {
  const navigate = useNavigate();
  const [profile,  setProfile]  = useState({ name: "", email: "", phone: "", ref_code: "", wallet_balance: 0 });
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [pwForm,   setPwForm]   = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [activeTab,setActiveTab]= useState("profile");
  const [msg,      setMsg]      = useState({ type: "", text: "" });
  const [bookings, setBookings] = useState([]);
  const [bLoading, setBLoading] = useState(false);

  const token = localStorage.getItem("token");

  // Redirect if not logged in
  useEffect(() => {
    if (!token) { navigate("/login"); }
  }, [token, navigate]);

  // Fetch profile
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${API}/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (!r.ok) throw new Error("failed");
        return r.json();
      })
      .then(data => {
        setProfile({
          name:           data.name           || "",
          email:          data.email          || "",
          phone:          data.phone          || "",
          ref_code:       data.ref_code       || "",
          wallet_balance: data.wallet_balance || 0,
        });
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ ...stored, ...data }));
      })
      .catch(err => {
        console.error("Profile fetch error:", err);
        // Don't stay loading on error — show empty form
      })
      .finally(() => setLoading(false));
  }, [token]);

  // Fetch bookings when tab opens
  useEffect(() => {
    if (activeTab !== "bookings" || !token) return;
    setBLoading(true);
    fetch(`${API}/my-bookings`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setBookings(Array.isArray(data) ? data : []))
      .catch(() => setBookings([]))
      .finally(() => setBLoading(false));
  }, [activeTab, token]);

  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 4000);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: profile.name, email: profile.email, phone: profile.phone }),
      });
      const data = await res.json();
      if (!res.ok) return flash("error", data.message || "Update failed");
      flash("success", "Profile updated ✓");
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, name: profile.name, email: profile.email }));
    } catch { flash("error", "Server error"); }
    finally { setSaving(false); }
  };

  const savePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirm) return flash("error", "Passwords don't match");
    if (pwForm.newPassword.length < 6) return flash("error", "Minimum 6 characters");
    setSaving(true);
    try {
      const res = await fetch(`${API}/profile/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) return flash("error", data.message || "Update failed");
      flash("success", "Password updated ✓");
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
    } catch { flash("error", "Server error"); }
    finally { setSaving(false); }
  };

  const copyRef = () => {
    navigator.clipboard.writeText(`https://alvryn.in/register?ref=${profile.ref_code}`);
    flash("success", "Referral link copied!");
  };

  const TABS = [
    { id: "profile",  label: "Profile",      icon: "👤" },
    { id: "security", label: "Password",     icon: "🔒" },
    { id: "wallet",   label: "Wallet",       icon: "💰" },
    { id: "referral", label: "Refer & Earn", icon: "🎁" },
    { id: "bookings", label: "Bookings",     icon: "🎫" },
  ];

  const inp = {
    width: "100%", padding: "12px 16px", borderRadius: 12,
    fontSize: 15, fontFamily: "'DM Sans',sans-serif", color: "#1a1410",
    background: "#fafaf8", border: "1.5px solid rgba(201,168,76,0.25)",
    outline: "none", transition: "border-color 0.2s",
  };
  const lbl = {
    fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 700,
    color: "#5a4a3a", display: "block", marginBottom: 7, letterSpacing: "0.08em",
  };
  const btn = {
    padding: "13px 32px", borderRadius: 13, fontSize: 15, fontWeight: 700,
    fontFamily: "'Cormorant Garamond',serif", letterSpacing: "0.06em",
    color: "#1a1410", border: "none", cursor: "pointer",
    background: GRAD, backgroundSize: "200% 200%",
    animation: "gradShift 3s ease infinite",
    boxShadow: `0 6px 22px rgba(201,168,76,0.4)`,
  };

  // Show spinner while loading
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#faf8f4", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <style>{CSS}</style>
        <AuroraBackground/>
        <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
          <div style={{ width: 48, height: 48, border: "3px solid rgba(201,168,76,0.2)", borderTopColor: GOLD, borderRadius: "50%", animation: "spinSlow 1s linear infinite", margin: "0 auto 18px" }}/>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: GOLD_DARK, fontWeight: 600 }}>Loading your profile…</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#faf8f4", position: "relative", overflowX: "hidden" }}>
      <style>{CSS}</style>
      <AuroraBackground/>

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 200, height: 66, padding: "0 5%",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(250,248,244,0.95)", backdropFilter: "blur(22px)",
        borderBottom: "1px solid rgba(201,168,76,0.12)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => navigate("/")}>
          <div style={{ animation: "floatUD 4s ease-in-out infinite" }}><AlvrynIcon size={38}/></div>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 16, color: "#1a1410", letterSpacing: "0.12em", lineHeight: 1.1 }}>ALVRYN</div>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 7, color: GOLD, letterSpacing: "0.18em" }}>TRAVEL BEYOND</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => navigate("/search")} style={{ padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, fontFamily: "'Cormorant Garamond',serif", letterSpacing: "0.05em", cursor: "pointer", color: "#1a1410", border: "none", background: GRAD, backgroundSize: "200% 200%", animation: "gradShift 3s ease infinite" }}>
            Search ✈
          </button>
          <button onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/login"); }}
            style={{ padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", cursor: "pointer", background: "#fff0f0", color: "#cc2222", border: "1.5px solid rgba(200,34,34,0.25)" }}>
            Sign Out
          </button>
        </div>
      </nav>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 760, margin: "0 auto", padding: "40px 5% 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: 32, animation: "fadeUp 0.6s both" }}>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: GOLD_DARK, letterSpacing: "0.2em", marginBottom: 10 }}>ACCOUNT</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: "clamp(24px,4vw,44px)", color: "#1a1410", marginBottom: 4 }}>
            {profile.name?.split(" ")[0] ? `${profile.name.split(" ")[0]}'s Profile` : "Your Profile"}
          </h1>
          <p style={{ fontSize: 15, color: "#5a4a3a", fontWeight: 500 }}>Manage your account, wallet and bookings.</p>
        </div>

        {/* Toast */}
        {msg.text && (
          <div style={{ padding: "14px 20px", borderRadius: 12, marginBottom: 20,
            background: msg.type === "success" ? "rgba(201,168,76,0.1)" : "#FFF0F0",
            border: `1px solid ${msg.type === "success" ? "rgba(201,168,76,0.4)" : "#FFCDD2"}`,
            color: msg.type === "success" ? GOLD_DARK : "#cc2222",
            fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 600,
            animation: "fadeUp 0.3s both" }}>
            {msg.text}
          </div>
        )}

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 0, background: "rgba(255,255,255,0.88)", backdropFilter: "blur(10px)",
          borderRadius: "16px 16px 0 0", border: "1px solid rgba(201,168,76,0.18)", borderBottom: "none", overflowX: "auto" }}>
          {TABS.map((t, i) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                padding: "14px 8px", cursor: "pointer", border: "none",
                borderBottom: activeTab === t.id ? `2.5px solid ${GOLD}` : "2.5px solid transparent",
                background: "transparent", color: activeTab === t.id ? GOLD_DARK : "#888",
                fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
                transition: "all 0.2s",
                borderRadius: i === 0 ? "16px 0 0 0" : i === TABS.length - 1 ? "0 16px 0 0" : "0" }}>
              <span style={{ fontSize: 18 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(10px)",
          borderRadius: "0 0 20px 20px", padding: "32px 28px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: "1px solid rgba(201,168,76,0.15)", borderTop: "none" }}>

          {/* ── PROFILE ── */}
          {activeTab === "profile" && (
            <div style={{ animation: "fadeUp 0.4s both" }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 22, color: "#1a1410", marginBottom: 24 }}>Personal Information</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                {[
                  { key: "name",  label: "FULL NAME",      type: "text",  ph: "Your full name" },
                  { key: "email", label: "EMAIL ADDRESS",  type: "email", ph: "you@example.com" },
                ].map(f => (
                  <div key={f.key}>
                    <label style={lbl}>{f.label}</label>
                    <input type={f.type} value={profile[f.key]} placeholder={f.ph}
                      onChange={e => setProfile({ ...profile, [f.key]: e.target.value })}
                      style={inp}
                      onFocus={e => { e.target.style.borderColor = GOLD; e.target.style.boxShadow = "0 0 0 3px rgba(201,168,76,0.1)"; }}
                      onBlur={e => { e.target.style.borderColor = "rgba(201,168,76,0.25)"; e.target.style.boxShadow = "none"; }}/>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 28 }}>
                <label style={lbl}>PHONE NUMBER <span style={{ color: "#aaa", fontWeight: 400, fontSize: 11 }}>(optional)</span></label>
                <input type="tel" value={profile.phone} placeholder="+91 98765 43210"
                  onChange={e => setProfile({ ...profile, phone: e.target.value })}
                  style={inp}
                  onFocus={e => { e.target.style.borderColor = GOLD; e.target.style.boxShadow = "0 0 0 3px rgba(201,168,76,0.1)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(201,168,76,0.25)"; e.target.style.boxShadow = "none"; }}/>
              </div>
              <button onClick={saveProfile} disabled={saving} style={{ ...btn, opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          )}

          {/* ── PASSWORD ── */}
          {activeTab === "security" && (
            <div style={{ animation: "fadeUp 0.4s both" }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 22, color: "#1a1410", marginBottom: 24 }}>Change Password</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 420 }}>
                {[
                  { key: "currentPassword", label: "CURRENT PASSWORD",     ph: "Your current password" },
                  { key: "newPassword",     label: "NEW PASSWORD",         ph: "At least 6 characters" },
                  { key: "confirm",         label: "CONFIRM NEW PASSWORD", ph: "Repeat new password" },
                ].map(f => (
                  <div key={f.key}>
                    <label style={lbl}>{f.label}</label>
                    <input type="password" value={pwForm[f.key]} placeholder={f.ph}
                      onChange={e => setPwForm({ ...pwForm, [f.key]: e.target.value })}
                      style={inp}
                      onFocus={e => { e.target.style.borderColor = GOLD; e.target.style.boxShadow = "0 0 0 3px rgba(201,168,76,0.1)"; }}
                      onBlur={e => { e.target.style.borderColor = "rgba(201,168,76,0.25)"; e.target.style.boxShadow = "none"; }}/>
                  </div>
                ))}
              </div>
              <button onClick={savePassword} disabled={saving} style={{ ...btn, marginTop: 24, opacity: saving ? 0.7 : 1 }}>
                {saving ? "Updating…" : "Update Password"}
              </button>
            </div>
          )}

          {/* ── WALLET ── */}
          {activeTab === "wallet" && (
            <div style={{ animation: "fadeUp 0.4s both" }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 22, color: "#1a1410", marginBottom: 24 }}>Alvryn Wallet</h2>
              <div style={{ background: GRAD, backgroundSize: "200% 200%", animation: "gradShift 3s ease infinite",
                borderRadius: 20, padding: "32px 28px", marginBottom: 28 }}>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "rgba(26,20,16,0.7)", marginBottom: 8, letterSpacing: "0.12em" }}>AVAILABLE BALANCE</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 52, color: "#1a1410", letterSpacing: "-1px" }}>
                  ₹{(profile.wallet_balance || 0).toLocaleString()}
                </div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "rgba(26,20,16,0.65)", marginTop: 8 }}>
                  Earned from referrals and promotions
                </div>
              </div>
              <div style={{ background: "rgba(201,168,76,0.06)", borderRadius: 14, padding: "20px 22px", border: "1px solid rgba(201,168,76,0.18)" }}>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 17, color: "#1a1410", marginBottom: 14 }}>How to earn more?</div>
                {[
                  { icon: "🎁", title: "Refer a friend",  desc: "They book a flight above ₹5,000 → You get ₹150 wallet credit" },
                  { icon: "🆕", title: "Friend gets",     desc: "₹100 wallet credit on their first booking above ₹5,000" },
                  { icon: "🏷️",title: "Promo codes",      desc: "Apply codes at checkout to save on every booking" },
                ].map(item => (
                  <div key={item.title} style={{ display: "flex", gap: 14, marginBottom: 14, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 22 }}>{item.icon}</span>
                    <div>
                      <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 14, color: "#1a1410" }}>{item.title}</div>
                      <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#5a4a3a", marginTop: 2 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── REFERRAL ── */}
          {activeTab === "referral" && (
            <div style={{ animation: "fadeUp 0.4s both" }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 22, color: "#1a1410", marginBottom: 8 }}>Refer &amp; Earn</h2>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "#5a4a3a", marginBottom: 28, lineHeight: 1.7 }}>
                Share your referral link. When your friend books a flight above ₹5,000, you both earn wallet credits.
              </p>
              <div style={{ background: "rgba(201,168,76,0.08)", borderRadius: 16, padding: "24px", marginBottom: 20, border: "1px solid rgba(201,168,76,0.25)" }}>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: GOLD_DARK, letterSpacing: "0.15em", marginBottom: 10 }}>YOUR REFERRAL CODE</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 34, color: GOLD_DARK, letterSpacing: "4px", marginBottom: 10 }}>
                  {profile.ref_code || "—"}
                </div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#5a4a3a", marginBottom: 18, wordBreak: "break-all" }}>
                  alvryn.in/register?ref={profile.ref_code || "…"}
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button onClick={copyRef} style={{ ...btn, padding: "10px 22px", fontSize: 13 }}>Copy Link</button>
                  <button onClick={() => window.open(`https://wa.me/?text=Book flights with AI on Alvryn! Use my code ${profile.ref_code} to get Rs.100 off your first booking. https://alvryn.in/register?ref=${profile.ref_code}`, "_blank")}
                    style={{ padding: "10px 22px", borderRadius: 11, fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", cursor: "pointer", color: "#fff", border: "none", background: "#25D366" }}>
                    Share on WhatsApp
                  </button>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  { icon: "💸", label: "You earn",    amount: "₹150", desc: "When friend books above ₹5,000" },
                  { icon: "🎉", label: "Friend earns",amount: "₹100", desc: "On first booking above ₹5,000" },
                ].map(card => (
                  <div key={card.label} style={{ background: "rgba(201,168,76,0.06)", borderRadius: 14, padding: "20px", border: "1px solid rgba(201,168,76,0.18)", textAlign: "center" }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{card.icon}</div>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "#888", marginBottom: 4 }}>{card.label}</div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 30, color: GOLD_DARK }}>{card.amount}</div>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#5a4a3a", marginTop: 6 }}>{card.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── BOOKINGS ── */}
          {activeTab === "bookings" && (
            <div style={{ animation: "fadeUp 0.4s both" }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 22, color: "#1a1410", marginBottom: 24 }}>Your Bookings</h2>
              {bLoading ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ width: 36, height: 36, border: "3px solid rgba(201,168,76,0.2)", borderTopColor: GOLD, borderRadius: "50%", animation: "spinSlow 1s linear infinite", margin: "0 auto 12px" }}/>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "#888" }}>Loading bookings…</div>
                </div>
              ) : bookings.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 20px" }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}>🎫</div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, fontSize: 20, color: "#888", marginBottom: 12 }}>No bookings yet</div>
                  <button onClick={() => navigate("/search")} style={btn}>Search Flights ✈</button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {bookings.map((b, i) => (
                    <div key={i} style={{ padding: "20px 22px", background: "rgba(201,168,76,0.05)", borderRadius: 16, border: "1px solid rgba(201,168,76,0.18)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                        <div>
                          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 18, color: "#1a1410", marginBottom: 4 }}>
                            {b.from_city} → {b.to_city}
                          </div>
                          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "#5a4a3a" }}>
                            {b.airline} · {b.departure_time && new Date(b.departure_time).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </div>
                          {b.seats && <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: GOLD_DARK, marginTop: 4 }}>Seats: {b.seats}</div>}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 22, color: GOLD_DARK }}>
                            ₹{(b.final_price || b.price || 0).toLocaleString()}
                          </div>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 6,
                            padding: "3px 10px", borderRadius: 100, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)" }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: GOLD_DARK, display: "inline-block" }}/>
                            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: GOLD_DARK }}>CONFIRMED</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}