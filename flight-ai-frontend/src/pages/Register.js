import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

const API = "https://cometai-backend.onrender.com";
const GOLD = "#c9a84c";
const GRAD = "linear-gradient(135deg,#c9a84c,#f0d080,#c9a84c)";

export default function Register() {
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
  const [form, setForm]         = useState({ name:"", email:"", password:"", confirm:"" });
  const [showPass, setShowPass]   = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [passStrength, setPassStr] = useState(0);

  const handle = e => {
    setForm(p=>({...p,[e.target.name]:e.target.value}));
    if (e.target.name==="password") {
      const v = e.target.value;
      let s = 0;
      if (v.length>=6) s++;
      if (v.length>=10) s++;
      if (/[A-Z]/.test(v)) s++;
      if (/[0-9]/.test(v)) s++;
      if (/[^A-Za-z0-9]/.test(v)) s++;
      setPassStr(s);
    }
  };

  const strengthLabel = ["","Weak","Fair","Good","Strong","Very Strong"][passStrength];
  const strengthColor = ["","#ef4444","#f59e0b","#eab308","#22c55e","#16a34a"][passStrength];

  const submit = async e => {
    e.preventDefault();
    if (!form.name||!form.email||!form.password) { setError("Please fill all fields."); return; }
    if (form.password !== form.confirm) { setError("Passwords don't match."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${API}/register`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({name:form.name.trim(),email:form.email.trim(),password:form.password}),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message||"Registration failed. Please try again."); setLoading(false); return; }
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user||{name:form.name,email:form.email}));
        navigate("/search");
      } else {
        navigate("/login");
      }
    } catch {
      setError("Connection error. Please check your internet and try again.");
    }
    setLoading(false);
  };

  const inp = {
    width:"100%", padding:"13px 16px", borderRadius:12,
    fontFamily:"'DM Sans',sans-serif", fontSize:15, color:"#1a1410",
    border:"1.5px solid rgba(201,168,76,0.25)", outline:"none",
    background:"rgba(255,255,255,0.92)", transition:"border-color 0.2s",
  };

  const EyeIcon = ({show}) => show
    ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
    : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>;

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",
      background:"linear-gradient(135deg,#0a0f0b 0%,#0f1a10 50%,#0a0f0b 100%)",
      fontFamily:"'DM Sans',sans-serif",padding:"20px"}}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;600;700&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes gradShift{0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;}}
        @keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);}}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
        input:-webkit-autofill{-webkit-box-shadow:0 0 0 100px rgba(255,255,255,0.95) inset!important;-webkit-text-fill-color:#1a1410!important;}
        .inp:focus{border-color:rgba(201,168,76,0.6)!important;box-shadow:0 0 0 3px rgba(201,168,76,0.1)!important;}
        .eye-btn:hover{color:${GOLD}!important;}
        .sub-btn:hover{opacity:0.9;transform:translateY(-1px);}
      `}</style>

      <div style={{width:"100%",maxWidth:440,animation:"fadeUp 0.45s both"}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{animation:"float 4s ease-in-out infinite",display:"inline-block",marginBottom:12}}>
            <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
              <defs><linearGradient id="lg2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c9a84c"/><stop offset="55%" stopColor="#f0d080"/>
                <stop offset="100%" stopColor="#4ade80"/>
              </linearGradient></defs>
              <circle cx="32" cy="32" r="30" stroke="url(#lg2)" strokeWidth="1.5" fill="none"/>
              <path d="M20 46L28 18L36 46" stroke="url(#lg2)" strokeWidth="2.4" strokeLinecap="round" fill="none"/>
              <path d="M23 37L34 37" stroke="url(#lg2)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:26,
            color:"#fff",letterSpacing:"0.12em"}}>ALVRYN</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginTop:3}}>Start your journey</div>
        </div>

        {/* Card */}
        <div style={{background:"rgba(255,255,255,0.97)",borderRadius:22,padding:"32px 30px",
          boxShadow:"0 24px 64px rgba(0,0,0,0.35),0 0 0 1px rgba(201,168,76,0.15)"}}>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:24,
            color:"#1a1410",marginBottom:4}}>Create your account</h2>
          <p style={{fontSize:13,color:"#888",marginBottom:24}}>Free forever · No credit card needed</p>

          {error && (
            <div style={{background:"#fff0f0",border:"1px solid rgba(200,50,50,0.25)",
              borderRadius:10,padding:"11px 14px",marginBottom:16,
              fontSize:13,color:"#cc2222",fontWeight:500}}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={submit}>
            {/* Name */}
            <div style={{marginBottom:14}}>
              <label style={{display:"block",fontSize:11,fontWeight:600,
                color:"#5a4a3a",marginBottom:6,letterSpacing:"0.07em"}}>FULL NAME</label>
              <input className="inp" name="name" type="text" value={form.name}
                onChange={handle} placeholder="Your name" required style={inp}/>
            </div>

            {/* Email */}
            <div style={{marginBottom:14}}>
              <label style={{display:"block",fontSize:11,fontWeight:600,
                color:"#5a4a3a",marginBottom:6,letterSpacing:"0.07em"}}>EMAIL</label>
              <input className="inp" name="email" type="email" value={form.email}
                onChange={handle} placeholder="you@example.com" required style={inp}/>
            </div>

            {/* Password */}
            <div style={{marginBottom:8}}>
              <label style={{display:"block",fontSize:11,fontWeight:600,
                color:"#5a4a3a",marginBottom:6,letterSpacing:"0.07em"}}>PASSWORD</label>
              <div style={{position:"relative"}}>
                <input className="inp" name="password"
                  type={showPass?"text":"password"}
                  value={form.password} onChange={handle}
                  placeholder="Min. 6 characters" required
                  style={{...inp,paddingRight:48}}/>
                <button type="button" className="eye-btn"
                  onClick={()=>setShowPass(s=>!s)}
                  style={{position:"absolute",right:11,top:"50%",transform:"translateY(-50%)",
                    background:"none",border:"none",cursor:"pointer",
                    color:"#bbb",padding:2,display:"flex",alignItems:"center",transition:"color 0.15s",lineHeight:0}}>
                  <EyeIcon show={showPass}/>
                </button>
              </div>
              {/* Strength bar */}
              {form.password.length>0&&(
                <div style={{marginTop:7}}>
                  <div style={{display:"flex",gap:3,marginBottom:3}}>
                    {[1,2,3,4,5].map(n=>(
                      <div key={n} style={{flex:1,height:3,borderRadius:3,
                        background:passStrength>=n?strengthColor:"rgba(0,0,0,0.1)",
                        transition:"background 0.2s"}}/>
                    ))}
                  </div>
                  <div style={{fontSize:11,color:strengthColor,fontWeight:600}}>{strengthLabel}</div>
                </div>
              )}
            </div>

            {/* Confirm */}
            <div style={{marginBottom:24}}>
              <label style={{display:"block",fontSize:11,fontWeight:600,
                color:"#5a4a3a",marginBottom:6,letterSpacing:"0.07em"}}>CONFIRM PASSWORD</label>
              <div style={{position:"relative"}}>
                <input className="inp" name="confirm"
                  type={showConf?"text":"password"}
                  value={form.confirm} onChange={handle}
                  placeholder="Re-enter password" required
                  style={{...inp,paddingRight:48,
                    borderColor:form.confirm&&form.confirm!==form.password?"rgba(239,68,68,0.5)":undefined}}/>
                <button type="button" className="eye-btn"
                  onClick={()=>setShowConf(s=>!s)}
                  style={{position:"absolute",right:11,top:"50%",transform:"translateY(-50%)",
                    background:"none",border:"none",cursor:"pointer",
                    color:"#bbb",padding:2,display:"flex",alignItems:"center",transition:"color 0.15s",lineHeight:0}}>
                  <EyeIcon show={showConf}/>
                </button>
              </div>
              {form.confirm&&form.confirm!==form.password&&(
                <div style={{fontSize:11,color:"#ef4444",marginTop:5,fontWeight:500}}>
                  ✗ Passwords don't match
                </div>
              )}
              {form.confirm&&form.confirm===form.password&&form.confirm.length>0&&(
                <div style={{fontSize:11,color:"#16a34a",marginTop:5,fontWeight:500}}>
                  ✓ Passwords match
                </div>
              )}
            </div>

            <button type="submit" className="sub-btn"
              disabled={loading||(form.confirm&&form.confirm!==form.password)}
              style={{width:"100%",padding:"14px",borderRadius:13,fontSize:15,
                fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.06em",
                color:"#1a1410",border:"none",
                cursor:(loading||(form.confirm&&form.confirm!==form.password))?"not-allowed":"pointer",
                background:GRAD,backgroundSize:"200% 200%",animation:"gradShift 3s ease infinite",
                boxShadow:"0 6px 20px rgba(201,168,76,0.35)",transition:"all 0.18s",
                opacity:(loading||(form.confirm&&form.confirm!==form.password))?0.7:1}}>
              {loading
                ? <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                    <span style={{width:14,height:14,border:"2px solid rgba(26,20,16,0.3)",
                      borderTopColor:"#1a1410",borderRadius:"50%",
                      animation:"spin 0.8s linear infinite",display:"inline-block"}}/>
                    Creating account…
                  </span>
                : "Create Account →"
              }
            </button>
          </form>

          <div style={{textAlign:"center",marginTop:20,fontSize:14,color:"#888"}}>
            Already have an account?{" "}
            <Link to="/login" style={{color:GOLD,fontWeight:600,textDecoration:"none"}}>
              Sign in →
            </Link>
          </div>
        </div>

        <div style={{textAlign:"center",marginTop:18,fontSize:12,color:"rgba(255,255,255,0.22)"}}>
          By creating an account you agree to Alvryn's Terms of Service
        </div>
      </div>
    </div>
  );
}