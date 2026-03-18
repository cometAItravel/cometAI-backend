import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = "https://cometai-backend.onrender.com";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;800&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #01020a; color: #e8eaf6; font-family: 'DM Sans', sans-serif; min-height: 100vh; overflow: hidden; }

  .stars-bg {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background:
      radial-gradient(ellipse at 20% 50%, rgba(99,43,200,0.3) 0%, transparent 55%),
      radial-gradient(ellipse at 80% 20%, rgba(25,90,220,0.25) 0%, transparent 50%),
      radial-gradient(ellipse at 60% 80%, rgba(140,30,180,0.2) 0%, transparent 50%),
      #01020a;
  }
  .nebula { position: fixed; inset: 0; z-index: 0; pointer-events: none; background: radial-gradient(ellipse 800px 400px at 10% 60%, rgba(99,43,200,0.08) 0%, transparent 70%), radial-gradient(ellipse 600px 300px at 90% 30%, rgba(56,189,248,0.06) 0%, transparent 70%); }
  .star { position: absolute; border-radius: 50%; background: white; animation: twinkle var(--d,3s) ease-in-out infinite var(--delay,0s); }
  @keyframes twinkle { 0%,100%{opacity:var(--min-op,.15);transform:scale(1);}50%{opacity:1;transform:scale(1.5);} }
  .shooting-star { position: fixed; top:0; left:0; width:2px; height:2px; background:white; border-radius:50%; pointer-events:none; z-index:1; }
  .shooting-star::after { content:''; position:absolute; top:50%; right:0; transform:translateY(-50%); width:140px; height:1px; background:linear-gradient(90deg,rgba(255,255,255,0),rgba(165,180,252,0.8),white); border-radius:2px; }
  @keyframes shoot { 0%{transform:translate(0,0) rotate(var(--angle));opacity:1;}70%{opacity:1;}100%{transform:translate(var(--tx),var(--ty)) rotate(var(--angle));opacity:0;} }

  .login-wrap { position:relative; z-index:1; min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px 24px; animation:fadeUp 0.7s ease 0.3s both; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(28px);}to{opacity:1;transform:translateY(0);} }

  .logo-wrap { display:flex; flex-direction:column; align-items:center; margin-bottom:40px; }
  .logo-icon-wrap { position:relative; width:80px; height:80px; margin-bottom:16px; }
  .logo-orbit { position:absolute; inset:0; border-radius:50%; border:1px solid rgba(129,140,248,0.35); animation:spin 8s linear infinite; }
  .logo-orbit-2 { position:absolute; inset:10px; border-radius:50%; border:1px solid rgba(192,132,252,0.25); animation:spin 5s linear infinite reverse; }
  @keyframes spin{to{transform:rotate(360deg);}}
  .logo-orbit::before { content:''; position:absolute; width:8px; height:8px; background:#818cf8; border-radius:50%; top:-4px; left:50%; transform:translateX(-50%); box-shadow:0 0 10px #818cf8; }
  .logo-orbit-2::before { content:''; position:absolute; width:6px; height:6px; background:#c084fc; border-radius:50%; bottom:-3px; left:50%; transform:translateX(-50%); box-shadow:0 0 8px #c084fc; }
  .logo-comet { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:32px; filter:drop-shadow(0 0 16px rgba(129,140,248,0.8)); }
  .logo-name { font-family:'Orbitron',sans-serif; font-size:28px; font-weight:800; letter-spacing:3px; background:linear-gradient(90deg,#818cf8,#c084fc,#38bdf8); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  .logo-tagline { font-size:10px; letter-spacing:4px; text-transform:uppercase; color:rgba(165,180,252,0.4); margin-top:6px; font-weight:300; }

  .login-card { width:100%; max-width:420px; background:rgba(255,255,255,0.03); border:1px solid rgba(129,140,248,0.2); border-radius:24px; padding:40px 36px 36px; backdrop-filter:blur(20px); box-shadow:0 24px 80px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.05); }
  .card-title { font-family:'Orbitron',sans-serif; font-size:18px; font-weight:600; color:#e0e7ff; margin-bottom:6px; letter-spacing:1px; }
  .card-sub { font-size:13px; color:rgba(165,180,252,0.4); margin-bottom:28px; font-weight:300; }
  .input-group { margin-bottom:16px; }
  .input-label { display:block; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:rgba(165,180,252,0.5); margin-bottom:8px; font-weight:500; }
  .input-field { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(129,140,248,0.2); border-radius:12px; padding:13px 16px; color:#e0e7ff; font-family:'DM Sans',sans-serif; font-size:14px; outline:none; transition:all 0.2s; }
  .input-field::placeholder{color:rgba(165,180,252,0.2);}
  .input-field:focus{border-color:rgba(129,140,248,0.6);background:rgba(129,140,248,0.08);}
  .error-msg{background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);color:#fca5a5;padding:10px 14px;border-radius:8px;font-size:13px;margin-bottom:16px;}
  .wake-msg{background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.2);color:#fcd34d;padding:10px 14px;border-radius:8px;font-size:12px;margin-bottom:16px;text-align:center;}
  .btn-login { width:100%; padding:14px; background:linear-gradient(135deg,#6366f1,#8b5cf6); border:none; border-radius:12px; color:white; font-family:'DM Sans',sans-serif; font-size:15px; font-weight:500; cursor:pointer; letter-spacing:0.5px; margin-top:8px; transition:all 0.2s; box-shadow:0 4px 20px rgba(99,102,241,0.3); }
  .btn-login:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(99,102,241,0.5);}
  .btn-login:disabled{opacity:0.7;cursor:not-allowed;transform:none;}
  .divider{display:flex;align-items:center;gap:12px;margin:24px 0 20px;}
  .divider-line{flex:1;height:1px;background:rgba(255,255,255,0.06);}
  .divider-text{font-size:11px;color:rgba(165,180,252,0.25);letter-spacing:1px;}
  .register-link{text-align:center;font-size:13px;color:rgba(165,180,252,0.4);}
  .register-link span{color:#a5b4fc;cursor:pointer;font-weight:500;}
  .register-link span:hover{color:#c7d2fe;}
`;

function Stars() {
  const stars = Array.from({length:100},(_,i)=>({id:i,x:Math.random()*100,y:Math.random()*100,size:Math.random()*2.5+0.3,duration:Math.random()*5+2,delay:Math.random()*6,minOp:Math.random()*0.2+0.05}));
  return<div className="stars-bg">{stars.map(s=><div key={s.id} className="star" style={{left:`${s.x}%`,top:`${s.y}%`,width:s.size,height:s.size,'--d':`${s.duration}s`,'--delay':`${s.delay}s`,'--min-op':s.minOp}}/>)}</div>;
}

function Login() {
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  const [waking,setWaking]=useState(false);
  const navigate=useNavigate();

  // wake up backend immediately when login page loads
  useEffect(()=>{
    setWaking(true);
    fetch(`${API}/test`)
      .then(()=>setWaking(false))
      .catch(()=>setWaking(false));
  },[]);

  const handleLogin=async()=>{
    if(!email||!password){setError("Please fill in all fields.");return;}
    setLoading(true);
    setError("");
    try{
      const res=await axios.post(`${API}/login`,{email,password});
      localStorage.setItem("token",res.data.token);
      navigate("/search");
    }catch(err){
      setError("Invalid email or password. Please try again.");
    }
    setLoading(false);
  };

  return(
    <>
      <style>{styles}</style>
      <Stars/>
      <div className="nebula"/>

      <div className="login-wrap">
        <div className="logo-wrap">
          <div className="logo-icon-wrap">
            <div className="logo-orbit"/>
            <div className="logo-orbit-2"/>
            <div className="logo-comet">☄️</div>
          </div>
          <div className="logo-name">COMETAI</div>
          <div className="logo-tagline">Travel Intelligence</div>
        </div>

        <div className="login-card">
          <div className="card-title">Welcome back</div>
          <div className="card-sub">Sign in to continue your journey</div>

          {waking&&<div className="wake-msg">⚡ Waking up servers... first login may take ~30 seconds</div>}
          {error&&<div className="error-msg">⚠ {error}</div>}

          <div className="input-group">
            <label className="input-label">Email</label>
            <input className="input-field" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyPress={e=>{if(e.key==="Enter")handleLogin();}}/>
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <input className="input-field" type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} onKeyPress={e=>{if(e.key==="Enter")handleLogin();}}/>
          </div>

          <button className="btn-login" onClick={handleLogin} disabled={loading}>
            {loading?"Signing in...":"Launch →"}
          </button>

          <div className="divider"><div className="divider-line"/><div className="divider-text">or</div><div className="divider-line"/></div>

          <div className="register-link">
            New to CometAI?{" "}
            <span onClick={()=>navigate("/register")}>Create account</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;