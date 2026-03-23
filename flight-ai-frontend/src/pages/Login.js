import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(22px);}to{opacity:1;transform:translateY(0);}}
  @keyframes floatUD{0%,100%{transform:translateY(0);}50%{transform:translateY(-9px);}}
  @keyframes orbitRing{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
  @keyframes planeOrbit{from{transform:rotate(0deg) translateX(22px) rotate(0deg);}to{transform:rotate(360deg) translateX(22px) rotate(-360deg);}}
`;

function AlvrynIcon({ size = 40, spin = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <defs>
        <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6C63FF"/><stop offset="100%" stopColor="#00C2FF"/>
        </linearGradient>
        <linearGradient id="lg2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B6B"/><stop offset="100%" stopColor="#FFD93D"/>
        </linearGradient>
      </defs>
      <ellipse cx="30" cy="30" rx="27" ry="11" stroke="url(#lg1)" strokeWidth="1.2" strokeDasharray="5 3" opacity="0.45"
        style={spin?{animation:"orbitRing 5s linear infinite",transformOrigin:"30px 30px"}:{}}/>
      <text x="10" y="47" fontFamily="'Syne',sans-serif" fontWeight="900" fontSize="40" fill="url(#lg1)">A</text>
      <g style={spin?{animation:"planeOrbit 5s linear infinite",transformOrigin:"30px 30px"}:{}}>
        <path d="M57 30 L50 26 L52 30 L50 34 Z" fill="url(#lg2)"/>
        <path d="M51 26.5 L51 22 L54 27 Z" fill="url(#lg2)" opacity="0.75"/>
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
    let W = c.offsetWidth, H = c.offsetHeight;
    c.width = W; c.height = H;
    const blobs = Array.from({length:5},(_,i)=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-0.5)*0.5,vy:(Math.random()-0.5)*0.5,r:200+Math.random()*180,ci:i%colors.length}));
    const resize=()=>{W=c.offsetWidth;H=c.offsetHeight;c.width=W;c.height=H;};
    window.addEventListener("resize",resize);
    const draw=()=>{
      ctx.clearRect(0,0,W,H);
      blobs.forEach(b=>{b.x+=b.vx;b.y+=b.vy;if(b.x<-b.r||b.x>W+b.r)b.vx*=-1;if(b.y<-b.r||b.y>H+b.r)b.vy*=-1;
        const g=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r);g.addColorStop(0,colors[b.ci%colors.length]+"28");g.addColorStop(1,"transparent");
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();});
      raf.current=requestAnimationFrame(draw);
    };
    draw();
    return()=>{cancelAnimationFrame(raf.current);window.removeEventListener("resize",resize);};
  },[colors]);
  return <canvas ref={ref} style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:0}}/>;
}

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email:"", password:"" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [waking, setWaking] = useState(false);

  const handleSubmit = async () => {
    setError(""); setLoading(true); setWaking(true);
setTimeout(() => setWaking(false), 28000);
    try {
      const res = await fetch("https://cometai-backend.onrender.com/login", {
        method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/search");
      } else { setError(data.message || "Invalid credentials"); }
    } catch { setError("Server error. Please try again."); }
    finally { setLoading(false); setWaking(false); }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#f8f8fa", position:"relative",
      display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
      <style>{CSS}</style>
      <AuroraBackground colors={["#6C63FF","#00C2FF","#a78bfa"]}/>

      {/* Nav */}
      <div style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, padding:"16px 6%",
        display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}
        onClick={()=>navigate("/")}>
        <AlvrynIcon size={36} spin/>
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:16,
            color:"#0a0a0a", letterSpacing:"-0.04em" }}>ALVRYN</div>
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:7,
            color:"#6C63FF", letterSpacing:"0.18em" }}>TRAVEL BEYOND</div>
        </div>
      </div>

      <div style={{ position:"relative", zIndex:2, width:"100%", maxWidth:420,
        padding:"0 20px", animation:"fadeUp 0.6s both" }}>
        <div style={{ background:"rgba(255,255,255,0.88)", backdropFilter:"blur(24px)",
          borderRadius:28, padding:"48px 40px",
          boxShadow:"0 24px 80px rgba(0,0,0,0.10)", border:"1px solid rgba(255,255,255,0.9)" }}>
          <div style={{ textAlign:"center", marginBottom:36 }}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:16,
              animation:"floatUD 4s ease-in-out infinite" }}>
              <AlvrynIcon size={52} spin/>
            </div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:28,
              color:"#0a0a0a", marginBottom:6 }}>Welcome back</h1>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:15, color:"#888" }}>Sign in to your Alvryn account</p>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {[
              {key:"email",label:"Email",type:"email",ph:"you@example.com"},
              {key:"password",label:"Password",type:"password",ph:"••••••••"},
            ].map(f=>(
              <div key={f.key}>
                <label style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600,
                  color:"#555", display:"block", marginBottom:7 }}>{f.label}</label>
                <input type={f.type} placeholder={f.ph} value={form[f.key]}
                  onChange={e=>setForm({...form,[f.key]:e.target.value})}
                  onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
                  style={{ width:"100%", padding:"13px 16px", borderRadius:13, fontSize:15,
                    fontFamily:"'DM Sans',sans-serif", color:"#0a0a0a",
                    background:"#fafafa", border:"1.5px solid rgba(0,0,0,0.1)",
                    outline:"none", transition:"border-color 0.2s,box-shadow 0.2s" }}
                  onFocus={e=>{e.target.style.borderColor="#6C63FF";e.target.style.boxShadow="0 0 0 3px rgba(108,99,255,0.12)";}}
                  onBlur={e=>{e.target.style.borderColor="rgba(0,0,0,0.1)";e.target.style.boxShadow="none";}}/>
              </div>
            ))}

            {error && (
              <div style={{ padding:"12px 16px", borderRadius:10, background:"#FFF0F0",
                border:"1px solid #FFCDD2", fontFamily:"'DM Sans',sans-serif",
                fontSize:14, color:"#C62828" }}>{error}</div>
            )}

            <button onClick={handleSubmit} disabled={loading}
              style={{ padding:"14px", borderRadius:14, fontSize:16, fontWeight:800,
                fontFamily:"'Syne',sans-serif", color:"#fff", border:"none", cursor:"pointer",
                background: loading?"#ccc":"linear-gradient(135deg,#6C63FF,#00C2FF)",
                boxShadow: loading?"none":"0 8px 32px rgba(108,99,255,0.4)", marginTop:6,
                transition:"transform 0.2s" }}
              onMouseEnter={e=>!loading&&(e.currentTarget.style.transform="translateY(-2px)")}
              onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
              {waking ? "☕ Waking up server (~30s)…" : loading ? "Signing in…" : "Sign In →"}
            </button>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:14, margin:"24px 0" }}>
            <div style={{ flex:1, height:1, background:"rgba(0,0,0,0.07)" }}/>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#bbb" }}>or</span>
            <div style={{ flex:1, height:1, background:"rgba(0,0,0,0.07)" }}/>
          </div>
          <p style={{ textAlign:"center", fontFamily:"'DM Sans',sans-serif", fontSize:14, color:"#888" }}>
            Don't have an account?{" "}
            <span onClick={()=>navigate("/register")}
              style={{ color:"#6C63FF", cursor:"pointer", fontWeight:700, textDecoration:"underline" }}>
              Sign up free →
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}