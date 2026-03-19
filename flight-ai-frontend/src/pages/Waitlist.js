import { useState, useEffect } from "react";
import axios from "axios";

const API = "https://cometai-backend.onrender.com";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;800&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #01020a; color: #e8eaf6; font-family: 'DM Sans', sans-serif; min-height: 100vh; overflow-x: hidden; }

  .stars-bg {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background:
      radial-gradient(ellipse at 20% 50%, rgba(99,43,200,0.35) 0%, transparent 55%),
      radial-gradient(ellipse at 80% 20%, rgba(25,90,220,0.28) 0%, transparent 50%),
      radial-gradient(ellipse at 60% 80%, rgba(140,30,180,0.22) 0%, transparent 50%),
      #01020a;
  }
  .nebula {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background:
      radial-gradient(ellipse 900px 500px at 5% 70%, rgba(99,43,200,0.12) 0%, transparent 70%),
      radial-gradient(ellipse 700px 400px at 95% 25%, rgba(56,189,248,0.1) 0%, transparent 70%),
      radial-gradient(ellipse 800px 400px at 45% 95%, rgba(192,132,252,0.1) 0%, transparent 70%);
  }
  .star { position: absolute; border-radius: 50%; background: white; animation: twinkle var(--d,3s) ease-in-out infinite var(--delay,0s); }
  @keyframes twinkle { 0%,100%{opacity:var(--min-op,.2);transform:scale(1);}50%{opacity:1;transform:scale(1.6);} }
  .shooting-star { position: fixed; top:0; left:0; width:2px; height:2px; background:white; border-radius:50%; pointer-events:none; z-index:2; }
  .shooting-star::after { content:''; position:absolute; top:50%; right:0; transform:translateY(-50%); width:160px; height:1px; background:linear-gradient(90deg,rgba(255,255,255,0),rgba(165,180,252,0.8),white); border-radius:2px; }
  @keyframes shoot { 0%{transform:translate(0,0) rotate(var(--angle));opacity:1;}70%{opacity:1;}100%{transform:translate(var(--tx),var(--ty)) rotate(var(--angle));opacity:0;} }

  .page { position: relative; z-index: 1; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 24px; text-align: center; }

  /* LOGO */
  .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 48px; animation: fadeUp 0.6s ease both; }
  .logo-icon { font-size: 28px; filter: drop-shadow(0 0 12px rgba(129,140,248,0.8)); }
  .logo-text { font-family: 'Orbitron', sans-serif; font-size: 20px; font-weight: 800; letter-spacing: 2px; background: linear-gradient(90deg, #818cf8, #c084fc, #38bdf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

  @keyframes fadeUp { from{opacity:0;transform:translateY(24px);}to{opacity:1;transform:translateY(0);} }

  /* BADGE */
  .launch-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(99,102,241,0.1); border: 1px solid rgba(129,140,248,0.25); color: #a5b4fc; padding: 8px 18px; border-radius: 20px; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 28px; animation: fadeUp 0.6s ease 0.1s both; }
  .badge-dot { width: 6px; height: 6px; background: #6ee7b7; border-radius: 50%; animation: blink 2s ease infinite; }
  @keyframes blink { 0%,100%{opacity:1;}50%{opacity:0.3;} }

  /* HERO */
  .hero-title { font-family: 'Orbitron', sans-serif; font-size: clamp(32px, 7vw, 64px); font-weight: 800; line-height: 1.1; background: linear-gradient(135deg, #e0e7ff 0%, #a5b4fc 40%, #c084fc 70%, #38bdf8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 20px; letter-spacing: 1px; animation: fadeUp 0.6s ease 0.2s both; }
  .hero-sub { font-size: clamp(15px, 2.5vw, 18px); color: rgba(180,190,255,0.55); font-weight: 300; max-width: 520px; line-height: 1.7; margin-bottom: 48px; animation: fadeUp 0.6s ease 0.3s both; }

  /* COUNTER */
  .counter-wrap { display: flex; align-items: center; gap: 8px; justify-content: center; margin-bottom: 40px; animation: fadeUp 0.6s ease 0.35s both; }
  .counter-avatars { display: flex; }
  .counter-avatar { width: 32px; height: 32px; border-radius: 50%; border: 2px solid #01020a; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 12px; margin-left: -8px; }
  .counter-avatar:first-child { margin-left: 0; }
  .counter-text { font-size: 13px; color: rgba(165,180,252,0.6); }
  .counter-num { color: #a5b4fc; font-weight: 600; }

  /* FORM */
  .waitlist-form { width: 100%; max-width: 480px; animation: fadeUp 0.6s ease 0.4s both; }
  .input-row { display: flex; gap: 8px; background: rgba(255,255,255,0.04); border: 1px solid rgba(129,140,248,0.25); border-radius: 14px; padding: 6px 6px 6px 20px; transition: all 0.2s; margin-bottom: 12px; }
  .input-row:focus-within { border-color: rgba(129,140,248,0.6); box-shadow: 0 0 0 3px rgba(129,140,248,0.1); }
  .email-input { flex: 1; background: transparent; border: none; outline: none; color: #e0e7ff; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 300; padding: 8px 0; }
  .email-input::placeholder { color: rgba(165,180,252,0.3); }
  .btn-join { background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; color: white; padding: 12px 24px; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
  .btn-join:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(99,102,241,0.4); }
  .btn-join:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

  /* SUCCESS */
  .success-box { background: rgba(52,211,153,0.08); border: 1px solid rgba(52,211,153,0.2); border-radius: 14px; padding: 20px 24px; margin-bottom: 12px; animation: popIn 0.4s ease; }
  @keyframes popIn { from{transform:scale(0.95);opacity:0;}to{transform:scale(1);opacity:1;} }
  .success-icon { font-size: 32px; margin-bottom: 8px; }
  .success-title { font-family: 'Orbitron', sans-serif; font-size: 16px; font-weight: 700; color: #6ee7b7; margin-bottom: 6px; }
  .success-sub { font-size: 13px; color: rgba(110,231,183,0.6); }

  /* ERROR */
  .error-msg { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); color: #f87171; padding: 10px 16px; border-radius: 10px; font-size: 13px; margin-bottom: 12px; }

  /* FEATURES */
  .features { display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; margin-top: 48px; animation: fadeUp 0.6s ease 0.5s both; }
  .feature { display: flex; align-items: center; gap: 8px; font-size: 13px; color: rgba(165,180,252,0.5); }
  .feature-icon { font-size: 16px; }

  /* SHARE */
  .share-wrap { margin-top: 32px; animation: fadeUp 0.6s ease 0.6s both; }
  .share-label { font-size: 12px; color: rgba(165,180,252,0.3); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px; }
  .share-btns { display: flex; gap: 8px; justify-content: center; }
  .btn-share { display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: rgba(165,180,252,0.6); padding: 8px 16px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 12px; cursor: pointer; transition: all 0.2s; text-decoration: none; }
  .btn-share:hover { background: rgba(255,255,255,0.08); color: #a5b4fc; border-color: rgba(129,140,248,0.2); }

  /* FOOTER */
  .footer { margin-top: 60px; font-size: 12px; color: rgba(165,180,252,0.2); animation: fadeUp 0.6s ease 0.7s both; }
  .footer a { color: rgba(165,180,252,0.3); text-decoration: none; }
  .footer a:hover { color: #a5b4fc; }

  @media(max-width:480px) {
    .input-row { flex-direction: column; padding: 12px 16px; }
    .btn-join { width: 100%; padding: 13px; }
    .features { flex-direction: column; align-items: center; }
  }
`;

function Stars() {
  const stars = Array.from({length:120},(_,i)=>({id:i,x:Math.random()*100,y:Math.random()*100,size:Math.random()*2.5+0.3,duration:Math.random()*5+2,delay:Math.random()*6,minOp:Math.random()*0.2+0.05}));
  return<div className="stars-bg">{stars.map(s=><div key={s.id} className="star" style={{left:`${s.x}%`,top:`${s.y}%`,width:s.size,height:s.size,'--d':`${s.duration}s`,'--delay':`${s.delay}s`,'--min-op':s.minOp}}/>)}</div>;
}

function ShootingStars() {
  const [stars,setStars]=useState([]);
  useEffect(()=>{
    let id=0;
    const launch=()=>{
      const x=Math.random()*70,y=Math.random()*35,dist=500+Math.random()*300,angle=25+Math.random()*20,rad=(angle*Math.PI)/180;
      const star={id:id++,x,y,tx:Math.cos(rad)*dist,ty:Math.sin(rad)*dist,angle,dur:700+Math.random()*700};
      setStars(p=>[...p,star]);
      setTimeout(()=>setStars(p=>p.filter(s=>s.id!==star.id)),star.dur+100);
      setTimeout(launch,1500+Math.random()*3000);
    };
    const t=setTimeout(launch,500);
    return()=>clearTimeout(t);
  },[]);
  return<>{stars.map(s=><div key={s.id} className="shooting-star" style={{left:`${s.x}%`,top:`${s.y}%`,'--angle':`${s.angle}deg`,'--tx':`${s.tx}px`,'--ty':`${s.ty}px`,animation:`shoot ${s.dur}ms ease-out forwards`}}/>)}</>;
}

function Waitlist() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const [count, setCount] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // fetch waitlist count
    axios.get(`${API}/waitlist/count`)
      .then(res => setCount(res.data.count || 0))
      .catch(() => setCount(47)); // fallback number
  }, []);

  const handleJoin = async () => {
    if (!email.trim()) { setErrorMsg("Please enter your email address."); return; }
    if (!email.includes("@")) { setErrorMsg("Please enter a valid email address."); return; }
    setStatus("loading");
    setErrorMsg("");
    try {
      await axios.post(`${API}/waitlist`, { email: email.trim().toLowerCase() });
      setStatus("success");
      setCount(c => c + 1);
    } catch (err) {
      if (err.response?.status === 409) {
        setErrorMsg("You're already on the waitlist! We'll notify you at launch. 🚀");
        setStatus("idle");
      } else {
        setErrorMsg("Something went wrong. Please try again.");
        setStatus("idle");
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText("https://comet-ai-frontend.vercel.app/waitlist");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnWhatsApp = () => {
    const msg = encodeURIComponent("🚀 I just joined the CometAI waitlist! AI-powered flight booking is coming to India. Join here: https://comet-ai-frontend.vercel.app/waitlist");
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const shareOnTwitter = () => {
    const msg = encodeURIComponent("🚀 Just joined @CometAI waitlist — AI-powered flight booking with WhatsApp support is coming to India! Join the waitlist: https://comet-ai-frontend.vercel.app/waitlist");
    window.open(`https://twitter.com/intent/tweet?text=${msg}`, "_blank");
  };

  return (
    <>
      <style>{styles}</style>
      <Stars/>
      <div className="nebula"/>
      <ShootingStars/>

      <div className="page">
        <div className="logo">
          <span className="logo-icon">☄️</span>
          <span className="logo-text">COMETAI</span>
        </div>

        <div className="launch-badge">
          <div className="badge-dot"/>
          Launching Soon
        </div>

        <h1 className="hero-title">
          The Future of<br/>Travel Booking
        </h1>

        <p className="hero-sub">
          Book flights instantly using AI or WhatsApp. No more endless searching — just tell us where you want to go and we handle the rest. India's smartest travel platform is almost here.
        </p>

        {/* COUNTER */}
        <div className="counter-wrap">
          <div className="counter-avatars">
            {["🧑","👩","👨","🧑","👩"].map((e,i)=>(
              <div key={i} className="counter-avatar">{e}</div>
            ))}
          </div>
          <div className="counter-text">
            <span className="counter-num">{count}+</span> people already joined
          </div>
        </div>

        {/* FORM */}
        <div className="waitlist-form">
          {status === "success" ? (
            <div className="success-box">
              <div className="success-icon">🎉</div>
              <div className="success-title">You're on the list!</div>
              <div className="success-sub">We'll email you the moment CometAI launches. Tell your friends!</div>
            </div>
          ) : (
            <>
              {errorMsg && <div className="error-msg">⚠ {errorMsg}</div>}
              <div className="input-row">
                <input
                  className="email-input"
                  type="email"
                  placeholder="Enter your email address..."
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyPress={e => { if (e.key === "Enter") handleJoin(); }}
                />
                <button className="btn-join" onClick={handleJoin} disabled={status === "loading"}>
                  {status === "loading" ? "Joining..." : "Join Waitlist →"}
                </button>
              </div>
            </>
          )}

          {/* FEATURES */}
          <div className="features">
            <div className="feature"><span className="feature-icon">✈️</span>Real flight search</div>
            <div className="feature"><span className="feature-icon">🤖</span>AI-powered booking</div>
            <div className="feature"><span className="feature-icon">📱</span>Book via WhatsApp</div>
            <div className="feature"><span className="feature-icon">💰</span>Zero booking fees</div>
          </div>

          {/* SHARE */}
          <div className="share-wrap">
            <div className="share-label">Share with friends</div>
            <div className="share-btns">
              <button className="btn-share" onClick={shareOnWhatsApp}>
                📱 WhatsApp
              </button>
              <button className="btn-share" onClick={shareOnTwitter}>
                🐦 Twitter
              </button>
              <button className="btn-share" onClick={handleCopy}>
                {copied ? "✓ Copied!" : "🔗 Copy link"}
              </button>
            </div>
          </div>
        </div>

        <div className="footer">
          <p>© 2026 CometAI Travel · <a href="/">Back to home</a></p>
        </div>
      </div>
    </>
  );
}

export default Waitlist;