import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const BACKEND = "https://cometai-backend.onrender.com";
const GOLD = "#c9a84c";
const GOLD_DARK = "#8B6914";
const GRAD = "linear-gradient(135deg,#c9a84c,#f0d080,#c9a84c)";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(22px);}to{opacity:1;transform:translateY(0);}}
  @keyframes floatUD{0%,100%{transform:translateY(0);}50%{transform:translateY(-9px);}}
  @keyframes gradShift{0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;}}
  @keyframes spinSlow{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
  ::-webkit-scrollbar{width:2px;}
  ::-webkit-scrollbar-thumb{background:linear-gradient(#c9a84c,#8B6914);}
`;

const AlvrynIcon = ({ size = 40 }) => {
  const uid = `li${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={{flexShrink:0}}>
      <defs>
        <linearGradient id={`${uid}g`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c9a84c"/><stop offset="50%" stopColor="#f0d080"/><stop offset="100%" stopColor="#8B6914"/>
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" stroke={`url(#${uid}g)`} strokeWidth="1.2" fill="none"/>
      <circle cx="32" cy="32" r="26" stroke={`url(#${uid}g)`} strokeWidth="0.5" fill="none" opacity="0.4"/>
      <path d="M20 46 L28 18 L36 46" stroke={`url(#${uid}g)`} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M22.5 36 L33.5 36" stroke={`url(#${uid}g)`} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M26 46 L34 18 L42 46" stroke={`url(#${uid}g)`} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.45"/>
      <path d="M28 36 L40 36" stroke={`url(#${uid}g)`} strokeWidth="1" strokeLinecap="round" opacity="0.45"/>
      <circle cx="32" cy="9" r="1.5" fill={`url(#${uid}g)`}/>
      <path d="M29 9 L32 6 L35 9" stroke={`url(#${uid}g)`} strokeWidth="0.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

function AuroraBackground() {
  const ref = useRef(null);
  const raf = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    let W = c.offsetWidth, H = c.offsetHeight; c.width=W; c.height=H;
    const cols = ["#c9a84c","#f0d080","#8B6914","#d4b868"];
    const blobs = Array.from({length:5},(_,i)=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-0.5)*0.45,vy:(Math.random()-0.5)*0.45,r:200+Math.random()*180,ci:i%cols.length}));
    const resize=()=>{W=c.offsetWidth;H=c.offsetHeight;c.width=W;c.height=H;};
    window.addEventListener("resize",resize);
    const draw=()=>{ctx.clearRect(0,0,W,H);blobs.forEach(b=>{b.x+=b.vx;b.y+=b.vy;if(b.x<-b.r||b.x>W+b.r)b.vx*=-1;if(b.y<-b.r||b.y>H+b.r)b.vy*=-1;const g=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r);g.addColorStop(0,cols[b.ci]+"18");g.addColorStop(1,"transparent");ctx.fillStyle=g;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();});raf.current=requestAnimationFrame(draw);};
    draw();
    return()=>{cancelAnimationFrame(raf.current);window.removeEventListener("resize",resize);};
  },[]);
  return <canvas ref={ref} style={{position:"fixed",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:0}}/>;
}

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email:"", password:"" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [waking, setWaking] = useState(false);

  // Keep-alive ping on mount
  useEffect(() => { fetch(`${BACKEND}/test`).catch(()=>{}); }, []);

  const handleSubmit = async () => {
    if (!form.email || !form.password) { setError("Please fill in all fields"); return; }
    setError(""); setLoading(true); setWaking(true);
    const wakeTimer = setTimeout(() => setWaking(false), 30000);
    try {
      const res = await fetch(`${BACKEND}/login`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
      const data = await res.json();
      clearTimeout(wakeTimer);
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/search");
      } else { setError(data.message || "Invalid credentials"); }
    } catch { setError("Server error. Please try again."); clearTimeout(wakeTimer); }
    finally { setLoading(false); setWaking(false); }
  };

  return (
    <div style={{minHeight:"100vh",background:"#faf8f4",position:"relative",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",overflow:"hidden",padding:"20px"}}>
      <style>{CSS}</style>
      <AuroraBackground/>

      {/* Nav */}
      <div style={{position:"fixed",top:0,left:0,right:0,zIndex:100,padding:"16px 5%",display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>navigate("/")}>
        <div style={{animation:"floatUD 4s ease-in-out infinite"}}><AlvrynIcon size={38}/></div>
        <div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:17,color:"#1a1410",letterSpacing:"0.12em"}}>ALVRYN</div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:7,color:GOLD,letterSpacing:"0.22em"}}>TRAVEL BEYOND</div>
        </div>
      </div>

      <div style={{position:"relative",zIndex:2,width:"100%",maxWidth:420,animation:"fadeUp 0.6s both"}}>
        {/* Waking warning */}
        {waking && (
          <div style={{padding:"10px 16px",borderRadius:10,background:"rgba(201,168,76,0.1)",border:"1px solid rgba(201,168,76,0.3)",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#8B6914",marginBottom:16,textAlign:"center"}}>
            ☕ Waking up server — this takes ~30 seconds on first load…
          </div>
        )}

        <div style={{background:"rgba(255,255,255,0.88)",backdropFilter:"blur(24px)",borderRadius:24,padding:"clamp(28px,5vw,48px) clamp(20px,5vw,40px)",boxShadow:"0 24px 80px rgba(0,0,0,0.08)",border:"1px solid rgba(201,168,76,0.15)"}}>
          <div style={{textAlign:"center",marginBottom:36}}>
            <div style={{display:"flex",justifyContent:"center",marginBottom:16,animation:"floatUD 4s ease-in-out infinite"}}><AlvrynIcon size={52}/></div>
            <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:30,color:"#1a1410",marginBottom:6}}>Welcome back</h1>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"#888"}}>Sign in to your Alvryn account</p>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {[{key:"email",label:"Email",type:"email",ph:"you@example.com"},{key:"password",label:"Password",type:"password",ph:"••••••••"}].map(f=>(
              <div key={f.key}>
                <label style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,color:"#777",display:"block",marginBottom:7}}>{f.label}</label>
                <input type={f.type} placeholder={f.ph} value={form[f.key]}
                  onChange={e=>setForm({...form,[f.key]:e.target.value})}
                  onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
                  style={{width:"100%",padding:"13px 16px",borderRadius:12,fontSize:15,fontFamily:"'DM Sans',sans-serif",color:"#1a1410",background:"#fafaf8",border:"1.5px solid rgba(0,0,0,0.1)",outline:"none",transition:"border-color 0.2s,box-shadow 0.2s"}}
                  onFocus={e=>{e.target.style.borderColor=GOLD;e.target.style.boxShadow=`0 0 0 3px rgba(201,168,76,0.12)`;}}
                  onBlur={e=>{e.target.style.borderColor="rgba(0,0,0,0.1)";e.target.style.boxShadow="none";}}/>
              </div>
            ))}

            {error && <div style={{padding:"12px 16px",borderRadius:10,background:"#FFF0F0",border:"1px solid #FFCDD2",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#C62828"}}>{error}</div>}

            <button onClick={handleSubmit} disabled={loading}
              style={{padding:"14px",borderRadius:13,fontSize:15,fontWeight:700,fontFamily:"'Cormorant Garamond',serif",letterSpacing:"0.08em",color:"#1a1410",border:"none",cursor:loading?"not-allowed":"pointer",background:loading?"#e5e0d8":GRAD,backgroundSize:"200% 200%",animation:loading?"none":"gradShift 4s ease infinite",boxShadow:loading?"none":"0 8px 32px rgba(201,168,76,0.38)",marginTop:6,transition:"transform 0.2s,opacity 0.2s",opacity:loading?0.7:1}}
              onMouseEnter={e=>!loading&&(e.currentTarget.style.transform="translateY(-2px)")}
              onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
              {loading?"Signing in…":"Sign In →"}
            </button>
          </div>

          <div style={{display:"flex",alignItems:"center",gap:14,margin:"24px 0"}}>
            <div style={{flex:1,height:1,background:"rgba(0,0,0,0.07)"}}/>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#ccc"}}>or</span>
            <div style={{flex:1,height:1,background:"rgba(0,0,0,0.07)"}}/>
          </div>
          <p style={{textAlign:"center",fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"#888"}}>
            Don't have an account?{" "}
            <span onClick={()=>navigate("/register")} style={{color:GOLD_DARK,cursor:"pointer",fontWeight:700,fontStyle:"italic",textDecoration:"underline",textUnderlineOffset:2}}>Sign up free →</span>
          </p>
        </div>
      </div>
    </div>
  );
}