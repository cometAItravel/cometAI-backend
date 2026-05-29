import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";

const API = "https://cometai-backend.onrender.com";
const GOLD = "#c9a84c";
const GRAD = "linear-gradient(135deg,#c9a84c,#f0d080,#c9a84c)";

// ── SCREENS ────────────────────────────────────────────────────────────────────
// "login" | "forgot" | "otp" | "reset" | "done"

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.exp && payload.exp * 1000 > Date.now()) { navigate("/search"); return; }
      } catch {}
    }
  }, [navigate]);

  const [screen,    setScreen]    = useState("login");
  const [form,      setForm]      = useState({ email:"", password:"" });
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState("");

  // forgot password state
  const [fpEmail,      setFpEmail]      = useState("");
  const [otp,          setOtp]          = useState(["","","","","",""]);
  const [resetToken,   setResetToken]   = useState("");
  const [newPassword,  setNewPassword]  = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [showNew,      setShowNew]      = useState(false);
  const [resendTimer,  setResendTimer]  = useState(0);
  const otpRefs = useRef([]);
  const timerRef = useRef(null);

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  // ── OTP resend timer ────────────────────────────────────────────────────────
  const startResendTimer = () => {
    setResendTimer(60);
    timerRef.current = setInterval(() => {
      setResendTimer(t => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
  };
  useEffect(() => () => clearInterval(timerRef.current), []);

  // ── LOGIN ───────────────────────────────────────────────────────────────────
  const submit = async e => {
    e.preventDefault();
    if (!form.email || !form.password) { setError("Please fill all fields."); return; }
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${API}/login`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Login failed. Please try again."); setLoading(false); return; }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user || { name: form.email.split("@")[0], email: form.email }));
      navigate("/search");
    } catch { setError("Connection error. Please check your internet and try again."); }
    setLoading(false);
  };

  // ── FORGOT — send OTP ───────────────────────────────────────────────────────
  const sendOTP = async () => {
    if (!fpEmail.trim()) { setError("Please enter your email address."); return; }
    if (!/\S+@\S+\.\S+/.test(fpEmail)) { setError("Please enter a valid email address."); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      const res  = await fetch(`${API}/forgot-password`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ email: fpEmail.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Something went wrong."); setLoading(false); return; }
      setScreen("otp");
      setSuccess("OTP sent! Check your inbox — and spam folder just in case.");
      startResendTimer();
    } catch { setError("Connection error. Please try again."); }
    setLoading(false);
  };

  // ── OTP input handling ──────────────────────────────────────────────────────
  const handleOtpChange = (i, val) => {
    const clean = val.replace(/\D/g, "").slice(-1);
    const next  = [...otp];
    next[i] = clean;
    setOtp(next);
    if (clean && i < 5) otpRefs.current[i + 1]?.focus();
    if (!clean && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next   = [...otp];
    pasted.split("").forEach((ch, i) => { if (i < 6) next[i] = ch; });
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  // ── VERIFY OTP ──────────────────────────────────────────────────────────────
  const verifyOTP = async () => {
    const code = otp.join("");
    if (code.length < 6) { setError("Please enter the complete 6-digit OTP."); return; }
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${API}/verify-otp`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ email: fpEmail.trim().toLowerCase(), otp: code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Incorrect OTP."); setLoading(false); return; }
      setResetToken(data.resetToken);
      setScreen("reset");
      setSuccess("");
    } catch { setError("Connection error. Please try again."); }
    setLoading(false);
  };

  // ── RESET PASSWORD ──────────────────────────────────────────────────────────
  const resetPassword = async () => {
    if (!newPassword || newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (newPassword !== newPassword2) { setError("Passwords don't match."); return; }
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${API}/reset-password`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ resetToken, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Reset failed."); setLoading(false); return; }
      setScreen("done");
    } catch { setError("Connection error. Please try again."); }
    setLoading(false);
  };

  // ── RESEND OTP ──────────────────────────────────────────────────────────────
  const resendOTP = async () => {
    if (resendTimer > 0) return;
    setOtp(["","","","","",""]);
    setError(""); setSuccess("");
    setLoading(true);
    try {
      await fetch(`${API}/forgot-password`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ email: fpEmail.trim().toLowerCase() }),
      });
      setSuccess("New OTP sent!");
      startResendTimer();
    } catch { setError("Failed to resend. Please try again."); }
    setLoading(false);
  };

  // ── SHARED STYLES ───────────────────────────────────────────────────────────
  const inp = {
    width:"100%", padding:"13px 16px", borderRadius:12,
    fontFamily:"'DM Sans',sans-serif", fontSize:15, color:"#1a1410",
    border:"1.5px solid rgba(201,168,76,0.25)", outline:"none",
    background:"rgba(255,255,255,0.92)", transition:"border-color 0.2s",
    boxSizing:"border-box",
  };

  const btnPrimary = {
    width:"100%", padding:"14px", borderRadius:13, fontSize:15,
    fontWeight:700, fontFamily:"'Cormorant Garamond',serif",
    letterSpacing:"0.06em", color:"#1a1410", border:"none",
    cursor: loading ? "not-allowed" : "pointer",
    background: GRAD, backgroundSize:"200% 200%",
    animation:"gradShift 3s ease infinite",
    boxShadow:"0 6px 20px rgba(201,168,76,0.35)",
    transition:"all 0.18s", opacity: loading ? 0.7 : 1,
  };

  return (
    <div style={{
      minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:"linear-gradient(135deg,#1c1205 0%,#2d1e08 35%,#1c1205 100%)",
      fontFamily:"'DM Sans',sans-serif", padding:"20px", boxSizing:"border-box",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;600;700&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes gradShift{0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;}}
        @keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes slideIn{from{opacity:0;transform:translateX(20px);}to{opacity:1;transform:translateX(0);}}
        *{box-sizing:border-box;}
        input:-webkit-autofill{-webkit-box-shadow:0 0 0 100px rgba(255,255,255,0.95) inset!important;-webkit-text-fill-color:#1a1410!important;}
        .inp:focus{border-color:rgba(201,168,76,0.6)!important;box-shadow:0 0 0 3px rgba(201,168,76,0.1)!important;}
        .otp-input{text-align:center;font-family:'Space Mono',monospace;font-size:22px;font-weight:700;width:44px;height:52px;border-radius:12px;border:1.5px solid rgba(201,168,76,0.25);background:rgba(255,255,255,0.92);color:#1a1410;outline:none;transition:all 0.2s;}
        .otp-input:focus{border-color:rgba(201,168,76,0.7);box-shadow:0 0 0 3px rgba(201,168,76,0.12);}
        .otp-input.filled{border-color:rgba(201,168,76,0.5);background:#fffdf5;}
        .back-btn{background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.4);font-family:'DM Sans',sans-serif;font-size:13px;padding:0;display:flex;align-items:center;gap:5px;transition:color 0.2s;margin-bottom:16px;}
        .back-btn:hover{color:rgba(255,255,255,0.7);}
      `}</style>

      <div style={{ width:"100%", maxWidth:420, animation:"fadeUp 0.45s both" }}>

        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ animation:"float 4s ease-in-out infinite", display:"inline-block", marginBottom:14 }}>
            <svg width="52" height="52" viewBox="0 0 64 64" fill="none">
              <defs><linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c9a84c"/><stop offset="55%" stopColor="#f0d080"/>
                <stop offset="100%" stopColor="#8B6914"/>
              </linearGradient></defs>
              <circle cx="32" cy="32" r="30" stroke="url(#lg)" strokeWidth="1.5" fill="none"/>
              <path d="M20 46L28 18L36 46" stroke="url(#lg)" strokeWidth="2.4" strokeLinecap="round" fill="none"/>
              <path d="M23 37L34 37" stroke="url(#lg)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:28, color:"#fff", letterSpacing:"0.12em" }}>ALVRYN</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"rgba(255,255,255,0.35)", marginTop:4 }}>Travel Beyond Boundaries</div>
        </div>

        {/* Card */}
        <div style={{
          background:"rgba(255,255,255,0.97)", borderRadius:22,
          padding:"clamp(20px,5vw,36px) clamp(18px,5vw,32px)",
          boxShadow:"0 24px 64px rgba(0,0,0,0.35), 0 0 0 1px rgba(201,168,76,0.15)",
          overflow:"hidden",
        }}>

          {/* ── LOGIN SCREEN ── */}
          {screen === "login" && (
            <div style={{ animation:"slideIn 0.3s both" }}>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:26, color:"#1a1410", marginBottom:6 }}>Welcome back</h2>
              <p style={{ fontSize:14, color:"#888", marginBottom:28 }}>Sign in to continue your journey</p>

              {error && (
                <div style={{ background:"#fff0f0", border:"1px solid rgba(200,50,50,0.25)", borderRadius:10, padding:"11px 14px", marginBottom:18, fontSize:13, color:"#cc2222", fontWeight:500 }}>
                  ⚠️ {error}
                </div>
              )}

              <form onSubmit={submit}>
                <div style={{ marginBottom:16 }}>
                  <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#5a4a3a", marginBottom:7, letterSpacing:"0.06em" }}>EMAIL</label>
                  <input className="inp" name="email" type="email" value={form.email}
                    onChange={handle} placeholder="you@example.com" required style={inp}/>
                </div>

                <div style={{ marginBottom:8 }}>
                  <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#5a4a3a", marginBottom:7, letterSpacing:"0.06em" }}>PASSWORD</label>
                  <div style={{ position:"relative" }}>
                    <input className="inp" name="password" type={showPass?"text":"password"}
                      value={form.password} onChange={handle}
                      placeholder="Enter your password" required
                      style={{ ...inp, paddingRight:48 }}/>
                    <button type="button" onClick={()=>setShowPass(s=>!s)}
                      style={{ position:"absolute", right:11, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#aaa", padding:2, display:"flex", alignItems:"center" }}>
                      {showPass
                        ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                </div>

                {/* Forgot password link */}
                <div style={{ textAlign:"right", marginBottom:24 }}>
                  <button type="button" onClick={()=>{ setScreen("forgot"); setFpEmail(form.email); setError(""); setSuccess(""); }}
                    style={{ background:"none", border:"none", cursor:"pointer", color:GOLD, fontSize:13, fontWeight:600, padding:0, fontFamily:"'DM Sans',sans-serif" }}>
                    Forgot password?
                  </button>
                </div>

                <button type="submit" disabled={loading} style={btnPrimary}>
                  {loading
                    ? <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                        <span style={{ width:14, height:14, border:"2px solid rgba(26,20,16,0.3)", borderTopColor:"#1a1410", borderRadius:"50%", animation:"spin 0.8s linear infinite", display:"inline-block" }}/>
                        Signing in…
                      </span>
                    : "Sign In →"
                  }
                </button>
              </form>

              <div style={{ textAlign:"center", marginTop:22, fontSize:14, color:"#888" }}>
                Don't have an account?{" "}
                <Link to="/register" style={{ color:GOLD, fontWeight:600, textDecoration:"none" }}>Create one free →</Link>
              </div>
            </div>
          )}

          {/* ── FORGOT PASSWORD SCREEN ── */}
          {screen === "forgot" && (
            <div style={{ animation:"slideIn 0.3s both" }}>
              <button className="back-btn" style={{ background:"none", border:"none", cursor:"pointer", color:"#888", fontFamily:"'DM Sans',sans-serif", fontSize:13, padding:"0 0 16px 0", display:"flex", alignItems:"center", gap:5 }} onClick={()=>{ setScreen("login"); setError(""); }}>
                ← Back to sign in
              </button>
              <div style={{ textAlign:"center", marginBottom:24 }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🔐</div>
                <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:24, color:"#1a1410", marginBottom:6 }}>Forgot your password?</h2>
                <p style={{ fontSize:13, color:"#888", lineHeight:1.6 }}>Enter your registered email and we'll send you a 6-digit OTP to reset your password.</p>
              </div>

              {error && <div style={{ background:"#fff0f0", border:"1px solid rgba(200,50,50,0.25)", borderRadius:10, padding:"11px 14px", marginBottom:16, fontSize:13, color:"#cc2222" }}>⚠️ {error}</div>}
              {success && <div style={{ background:"rgba(201,168,76,0.08)", border:"1px solid rgba(201,168,76,0.25)", borderRadius:10, padding:"11px 14px", marginBottom:16, fontSize:13, color:"#8B6914" }}>✅ {success}</div>}

              <div style={{ marginBottom:20 }}>
                <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#5a4a3a", marginBottom:7, letterSpacing:"0.06em" }}>EMAIL ADDRESS</label>
                <input className="inp" type="email" value={fpEmail} onChange={e=>setFpEmail(e.target.value)}
                  placeholder="you@example.com" onKeyDown={e=>e.key==="Enter"&&sendOTP()}
                  style={inp}/>
              </div>

              <button onClick={sendOTP} disabled={loading} style={btnPrimary}>
                {loading
                  ? <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                      <span style={{ width:14, height:14, border:"2px solid rgba(26,20,16,0.3)", borderTopColor:"#1a1410", borderRadius:"50%", animation:"spin 0.8s linear infinite", display:"inline-block" }}/>
                      Sending OTP…
                    </span>
                  : "Send OTP →"
                }
              </button>
            </div>
          )}

          {/* ── OTP SCREEN ── */}
          {screen === "otp" && (
            <div style={{ animation:"slideIn 0.3s both" }}>
              <button className="back-btn" style={{ background:"none", border:"none", cursor:"pointer", color:"#888", fontFamily:"'DM Sans',sans-serif", fontSize:13, padding:"0 0 16px 0", display:"flex", alignItems:"center", gap:5 }} onClick={()=>{ setScreen("forgot"); setError(""); setSuccess(""); setOtp(["","","","","",""]); }}>
                ← Back
              </button>
              <div style={{ textAlign:"center", marginBottom:24 }}>
                <div style={{ fontSize:40, marginBottom:12 }}>📬</div>
                <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:24, color:"#1a1410", marginBottom:6 }}>Check your email</h2>
                <p style={{ fontSize:13, color:"#888", lineHeight:1.6 }}>
                  We sent a 6-digit OTP to<br/>
                  <strong style={{ color:"#1a1410" }}>{fpEmail}</strong>
                </p>
              </div>

              {error   && <div style={{ background:"#fff0f0", border:"1px solid rgba(200,50,50,0.25)", borderRadius:10, padding:"11px 14px", marginBottom:16, fontSize:13, color:"#cc2222" }}>⚠️ {error}</div>}
              {success && <div style={{ background:"rgba(201,168,76,0.08)", border:"1px solid rgba(201,168,76,0.25)", borderRadius:10, padding:"11px 14px", marginBottom:16, fontSize:13, color:"#8B6914" }}>✅ {success}</div>}

              {/* OTP boxes */}
              <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:24 }} onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => otpRefs.current[i] = el}
                    className={`otp-input${digit ? " filled" : ""}`}
                    type="text" inputMode="numeric" maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              <button onClick={verifyOTP} disabled={loading || otp.join("").length < 6} style={{ ...btnPrimary, opacity: loading || otp.join("").length < 6 ? 0.6 : 1, cursor: loading || otp.join("").length < 6 ? "default" : "pointer" }}>
                {loading
                  ? <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                      <span style={{ width:14, height:14, border:"2px solid rgba(26,20,16,0.3)", borderTopColor:"#1a1410", borderRadius:"50%", animation:"spin 0.8s linear infinite", display:"inline-block" }}/>
                      Verifying…
                    </span>
                  : "Verify OTP →"
                }
              </button>

              <div style={{ textAlign:"center", marginTop:20, fontSize:13, color:"#888" }}>
                Didn't receive it?{" "}
                {resendTimer > 0
                  ? <span style={{ color:"#aaa" }}>Resend in {resendTimer}s</span>
                  : <button onClick={resendOTP} style={{ background:"none", border:"none", cursor:"pointer", color:GOLD, fontWeight:600, fontSize:13, fontFamily:"'DM Sans',sans-serif", padding:0 }}>Resend OTP</button>
                }
              </div>
              <div style={{ textAlign:"center", marginTop:8, fontSize:12, color:"#aaa" }}>OTP expires in 10 minutes</div>
            </div>
          )}

          {/* ── RESET PASSWORD SCREEN ── */}
          {screen === "reset" && (
            <div style={{ animation:"slideIn 0.3s both" }}>
              <div style={{ textAlign:"center", marginBottom:24 }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🔑</div>
                <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:24, color:"#1a1410", marginBottom:6 }}>Set new password</h2>
                <p style={{ fontSize:13, color:"#888", lineHeight:1.6 }}>Choose a strong password you'll remember.</p>
              </div>

              {error && <div style={{ background:"#fff0f0", border:"1px solid rgba(200,50,50,0.25)", borderRadius:10, padding:"11px 14px", marginBottom:16, fontSize:13, color:"#cc2222" }}>⚠️ {error}</div>}

              <div style={{ marginBottom:16 }}>
                <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#5a4a3a", marginBottom:7, letterSpacing:"0.06em" }}>NEW PASSWORD</label>
                <div style={{ position:"relative" }}>
                  <input className="inp" type={showNew?"text":"password"} value={newPassword}
                    onChange={e=>setNewPassword(e.target.value)} placeholder="At least 6 characters"
                    style={{ ...inp, paddingRight:48 }}/>
                  <button type="button" onClick={()=>setShowNew(s=>!s)}
                    style={{ position:"absolute", right:11, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#aaa", padding:2, display:"flex", alignItems:"center" }}>
                    {showNew
                      ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
                {/* Password strength */}
                {newPassword.length > 0 && (
                  <div style={{ marginTop:8 }}>
                    <div style={{ display:"flex", gap:4 }}>
                      {[0,1,2,3].map(i => (
                        <div key={i} style={{ flex:1, height:3, borderRadius:2, background: newPassword.length > i*3 ? (newPassword.length < 6 ? "#ef4444" : newPassword.length < 10 ? "#f59e0b" : "#22c55e") : "rgba(0,0,0,0.1)", transition:"all 0.2s" }}/>
                      ))}
                    </div>
                    <div style={{ fontSize:11, color: newPassword.length < 6 ? "#ef4444" : newPassword.length < 10 ? "#f59e0b" : "#22c55e", marginTop:4 }}>
                      {newPassword.length < 6 ? "Too short" : newPassword.length < 10 ? "Good" : "Strong ✓"}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom:24 }}>
                <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#5a4a3a", marginBottom:7, letterSpacing:"0.06em" }}>CONFIRM PASSWORD</label>
                <input className="inp" type="password" value={newPassword2}
                  onChange={e=>setNewPassword2(e.target.value)} placeholder="Repeat new password"
                  style={{ ...inp, borderColor: newPassword2 && newPassword !== newPassword2 ? "rgba(239,68,68,0.5)" : "rgba(201,168,76,0.25)" }}/>
                {newPassword2 && newPassword !== newPassword2 && (
                  <div style={{ fontSize:12, color:"#ef4444", marginTop:6 }}>Passwords don't match</div>
                )}
              </div>

              <button onClick={resetPassword} disabled={loading || newPassword.length < 6 || newPassword !== newPassword2}
                style={{ ...btnPrimary, opacity: loading || newPassword.length < 6 || newPassword !== newPassword2 ? 0.6 : 1, cursor: loading || newPassword.length < 6 || newPassword !== newPassword2 ? "default" : "pointer" }}>
                {loading
                  ? <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                      <span style={{ width:14, height:14, border:"2px solid rgba(26,20,16,0.3)", borderTopColor:"#1a1410", borderRadius:"50%", animation:"spin 0.8s linear infinite", display:"inline-block" }}/>
                      Updating…
                    </span>
                  : "Update Password →"
                }
              </button>
            </div>
          )}

          {/* ── DONE SCREEN ── */}
          {screen === "done" && (
            <div style={{ textAlign:"center", animation:"slideIn 0.3s both", padding:"16px 0" }}>
              <div style={{ fontSize:56, marginBottom:16 }}>🎉</div>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:26, color:"#1a1410", marginBottom:8 }}>Password updated!</h2>
              <p style={{ fontSize:14, color:"#888", lineHeight:1.7, marginBottom:28 }}>
                Your password has been reset successfully.<br/>
                You can now sign in with your new password.
              </p>
              <button onClick={()=>{ setScreen("login"); setForm({ email: fpEmail, password:"" }); setError(""); }}
                style={btnPrimary}>
                Sign In Now →
              </button>
            </div>
          )}

        </div>

        <div style={{ textAlign:"center", marginTop:20, fontSize:12, color:"rgba(255,255,255,0.2)" }}>
          By continuing you agree to Alvryn's Terms of Service
        </div>
      </div>
    </div>
  );
}