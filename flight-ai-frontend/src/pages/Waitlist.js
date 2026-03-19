import { useState, useEffect } from "react";
import axios from "axios";

const API = "https://cometai-backend.onrender.com";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;800&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #01020a; color: #e8eaf6; font-family: 'DM Sans', sans-serif; min-height: 100vh; overflow-x: hidden; }
  .stars-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; background: radial-gradient(ellipse at 20% 50%, rgba(99,43,200,0.35) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(25,90,220,0.28) 0%, transparent 50%), radial-gradient(ellipse at 60% 80%, rgba(140,30,180,0.22) 0%, transparent 50%), #01020a; }
  .nebula { position: fixed; inset: 0; z-index: 0; pointer-events: none; background: radial-gradient(ellipse 900px 500px at 5% 70%, rgba(99,43,200,0.12) 0%, transparent 70%), radial-gradient(ellipse 700px 400px at 95% 25%, rgba(56,189,248,0.1) 0%, transparent 70%); }
  .star { position: absolute; border-radius: 50%; background: white; animation: twinkle var(--d,3s) ease-in-out infinite var(--delay,0s); }
  @keyframes twinkle { 0%,100%{opacity:var(--min-op,.2);transform:scale(1);}50%{opacity:1;transform:scale(1.6);} }
  .shooting-star { position: fixed; top:0; left:0; width:2px; height:2px; background:white; border-radius:50%; pointer-events:none; z-index:2; }
  .shooting-star::after { content:''; position:absolute; top:50%; right:0; transform:translateY(-50%); width:160px; height:1px; background:linear-gradient(90deg,rgba(255,255,255,0),rgba(165,180,252,0.8),white); border-radius:2px; }
  @keyframes shoot { 0%{transform:translate(0,0) rotate(var(--angle));opacity:1;}70%{opacity:1;}100%{transform:translate(var(--tx),var(--ty)) rotate(var(--angle));opacity:0;} }

  .page { position: relative; z-index: 1; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 24px; text-align: center; }
  .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; animation: fadeUp 0.6s ease both; }
  .logo-icon { font-size: 28px; filter: drop-shadow(0 0 12px rgba(129,140,248,0.8)); }
  .logo-text { font-family: 'Orbitron', sans-serif; font-size: 20px; font-weight: 800; letter-spacing: 2px; background: linear-gradient(90deg, #818cf8, #c084fc, #38bdf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(24px);}to{opacity:1;transform:translateY(0);} }

  .launch-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(99,102,241,0.1); border: 1px solid rgba(129,140,248,0.25); color: #a5b4fc; padding: 8px 18px; border-radius: 20px; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 20px; animation: fadeUp 0.6s ease 0.1s both; }
  .badge-dot { width: 6px; height: 6px; background: #6ee7b7; border-radius: 50%; animation: blink 2s ease infinite; }
  @keyframes blink { 0%,100%{opacity:1;}50%{opacity:0.3;} }

  .hero-title { font-family: 'Orbitron', sans-serif; font-size: clamp(28px, 6vw, 56px); font-weight: 800; line-height: 1.1; background: linear-gradient(135deg, #e0e7ff 0%, #a5b4fc 40%, #c084fc 70%, #38bdf8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 14px; letter-spacing: 1px; animation: fadeUp 0.6s ease 0.2s both; }
  .hero-sub { font-size: clamp(14px, 2.5vw, 16px); color: rgba(180,190,255,0.55); font-weight: 300; max-width: 480px; line-height: 1.7; margin-bottom: 24px; animation: fadeUp 0.6s ease 0.3s both; }

  /* REFERRAL PREVIEW — shown before joining */
  .referral-preview { width: 100%; max-width: 500px; background: rgba(99,102,241,0.08); border: 1px solid rgba(129,140,248,0.2); border-radius: 16px; padding: 20px 24px; margin-bottom: 24px; animation: fadeUp 0.6s ease 0.35s both; }
  .referral-preview-title { font-family: 'Orbitron', sans-serif; font-size: 12px; font-weight: 600; color: #a5b4fc; letter-spacing: 1px; margin-bottom: 12px; }
  .referral-steps { display: flex; flex-direction: column; gap: 10px; }
  .referral-step { display: flex; align-items: flex-start; gap: 12px; text-align: left; }
  .step-icon { font-size: 20px; flex-shrink: 0; margin-top: 2px; }
  .step-text { font-size: 13px; color: rgba(165,180,252,0.7); line-height: 1.5; }
  .step-text strong { color: #e0e7ff; }
  .referral-note { font-size: 11px; color: rgba(165,180,252,0.35); margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); }

  .counter-wrap { display: flex; align-items: center; gap: 8px; justify-content: center; margin-bottom: 24px; animation: fadeUp 0.6s ease 0.4s both; }
  .counter-avatars { display: flex; }
  .counter-avatar { width: 30px; height: 30px; border-radius: 50%; border: 2px solid #01020a; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 12px; margin-left: -8px; }
  .counter-avatar:first-child { margin-left: 0; }
  .counter-text { font-size: 13px; color: rgba(165,180,252,0.6); }
  .counter-num { color: #a5b4fc; font-weight: 600; }

  .waitlist-form { width: 100%; max-width: 500px; animation: fadeUp 0.6s ease 0.45s both; }
  .input-row { display: flex; gap: 8px; background: rgba(255,255,255,0.04); border: 1px solid rgba(129,140,248,0.25); border-radius: 14px; padding: 6px 6px 6px 20px; transition: all 0.2s; margin-bottom: 10px; }
  .input-row:focus-within { border-color: rgba(129,140,248,0.6); box-shadow: 0 0 0 3px rgba(129,140,248,0.1); }
  .email-input { flex: 1; background: transparent; border: none; outline: none; color: #e0e7ff; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 300; padding: 8px 0; }
  .email-input::placeholder { color: rgba(165,180,252,0.3); }
  .btn-join { background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; color: white; padding: 12px 24px; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
  .btn-join:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(99,102,241,0.4); }
  .btn-join:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
  .error-msg { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); color: #f87171; padding: 10px 16px; border-radius: 10px; font-size: 13px; margin-bottom: 10px; }
  .input-hint { font-size: 11px; color: rgba(165,180,252,0.3); text-align: center; }

  /* SUCCESS STATE */
  .success-section { width: 100%; max-width: 560px; animation: fadeUp 0.5s ease both; }
  .success-hero { background: rgba(52,211,153,0.08); border: 1px solid rgba(52,211,153,0.2); border-radius: 16px; padding: 20px 24px; margin-bottom: 16px; }
  .success-icon { font-size: 36px; margin-bottom: 8px; }
  .success-title { font-family: 'Orbitron', sans-serif; font-size: 17px; font-weight: 700; color: #6ee7b7; margin-bottom: 6px; }
  .success-sub { font-size: 13px; color: rgba(110,231,183,0.6); }

  .referral-card { background: rgba(99,102,241,0.08); border: 1px solid rgba(129,140,248,0.2); border-radius: 16px; padding: 20px 24px; margin-bottom: 16px; }
  .referral-title { font-family: 'Orbitron', sans-serif; font-size: 12px; font-weight: 600; color: #a5b4fc; letter-spacing: 1px; margin-bottom: 6px; }
  .referral-desc { font-size: 13px; color: rgba(165,180,252,0.5); margin-bottom: 16px; line-height: 1.6; }
  .referral-reward { display: flex; gap: 10px; margin-bottom: 16px; }
  .reward-item { flex: 1; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 12px; text-align: center; }
  .reward-amount { font-family: 'Orbitron', sans-serif; font-size: 20px; font-weight: 800; color: #6ee7b7; }
  .reward-label { font-size: 11px; color: rgba(165,180,252,0.4); margin-top: 4px; line-height: 1.4; }
  .ref-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
  .ref-stat { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 14px; text-align: center; }
  .ref-stat-value { font-family: 'Orbitron', sans-serif; font-size: 24px; font-weight: 800; color: #e0e7ff; }
  .ref-stat-label { font-size: 11px; color: rgba(165,180,252,0.4); margin-top: 4px; }
  .ref-link-wrap { display: flex; gap: 8px; background: rgba(255,255,255,0.04); border: 1px solid rgba(129,140,248,0.2); border-radius: 10px; padding: 10px 14px; margin-bottom: 16px; }
  .ref-link-text { flex: 1; font-size: 11px; color: #a5b4fc; font-family: monospace; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .btn-copy { background: rgba(99,102,241,0.2); border: 1px solid rgba(129,140,248,0.3); color: #a5b4fc; padding: 6px 14px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 12px; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
  .btn-copy:hover { background: rgba(99,102,241,0.4); }
  .btn-copy.copied { background: rgba(52,211,153,0.2); border-color: rgba(52,211,153,0.3); color: #6ee7b7; }

  .share-title { font-size: 11px; color: rgba(165,180,252,0.35); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px; }
  .share-btns { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
  .btn-share { display: flex; align-items: center; gap: 6px; padding: 11px 18px; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; border: none; }
  .btn-share:hover { transform: translateY(-1px); }
  .btn-whatsapp { background: #25D366; color: white; }
  .btn-whatsapp:hover { background: #20b857; box-shadow: 0 4px 16px rgba(37,211,102,0.3); }
  .btn-instagram { background: linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); color: white; }
  .btn-instagram:hover { box-shadow: 0 4px 16px rgba(220,39,67,0.3); }
  .btn-twitter { background: #1DA1F2; color: white; }
  .btn-twitter:hover { background: #1a91da; box-shadow: 0 4px 16px rgba(29,161,242,0.3); }
  .btn-copy-link { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12) !important; color: rgba(165,180,252,0.7); }
  .btn-copy-link:hover { background: rgba(255,255,255,0.12); color: #a5b4fc; }

  .leaderboard { width: 100%; max-width: 500px; margin-top: 28px; animation: fadeUp 0.6s ease 0.5s both; }
  .lb-title { font-family: 'Orbitron', sans-serif; font-size: 11px; font-weight: 600; color: rgba(165,180,252,0.4); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px; }
  .lb-card { background: rgba(15,17,26,0.6); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; overflow: hidden; }
  .lb-row { display: flex; align-items: center; gap: 12px; padding: 11px 16px; border-bottom: 1px solid rgba(255,255,255,0.04); }
  .lb-row:last-child { border-bottom: none; }
  .lb-rank { font-size: 14px; width: 24px; }
  .lb-email { flex: 1; font-size: 13px; color: #94a3b8; text-align: left; }
  .lb-count { font-family: 'Orbitron', sans-serif; font-size: 12px; font-weight: 700; color: #6366f1; }

  .features { display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; margin-top: 28px; animation: fadeUp 0.6s ease 0.6s both; }
  .feature { display: flex; align-items: center; gap: 6px; font-size: 12px; color: rgba(165,180,252,0.4); }
  .footer { margin-top: 40px; font-size: 12px; color: rgba(165,180,252,0.2); animation: fadeUp 0.6s ease 0.7s both; }
  .footer a { color: rgba(165,180,252,0.3); text-decoration: none; }

  @media(max-width:480px) {
    .input-row { flex-direction: column; padding: 12px 16px; }
    .btn-join { width: 100%; padding: 13px; }
    .referral-reward { flex-direction: column; }
    .share-btns { gap: 6px; }
    .btn-share { padding: 10px 14px; font-size: 12px; }
  }
`;

function Stars() {
  const stars = Array.from({length:100},(_,i)=>({id:i,x:Math.random()*100,y:Math.random()*100,size:Math.random()*2.5+0.3,duration:Math.random()*5+2,delay:Math.random()*6,minOp:Math.random()*0.2+0.05}));
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

function maskEmail(email) {
  if (!email) return "***@***.com";
  const [user, domain] = email.split("@");
  return user.slice(0,2) + "***@" + domain;
}

function Waitlist() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [count, setCount] = useState(0);
  const [myData, setMyData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get("ref");
  const emailFromUrl = urlParams.get("email");

  useEffect(() => {
    axios.get(`${API}/waitlist/count`).then(res => setCount(res.data.count || 0)).catch(() => setCount(47));
    axios.get(`${API}/waitlist/leaderboard`).then(res => setLeaderboard(res.data || [])).catch(() => {});

    // check localStorage first
    const savedEmail = localStorage.getItem("waitlist_email");
    const savedCode = localStorage.getItem("waitlist_code");
    if (savedEmail && savedCode) {
      setMyData({ email: savedEmail, refCode: savedCode, refs: 0 });
      setStatus("success");
      axios.get(`${API}/waitlist/my-refs/${savedCode}`)
        .then(res => setMyData(d => ({...d, refs: res.data.count || 0})))
        .catch(() => {});
      return;
    }

    // if coming from email link with ref code — look up their data
    if (refCode && emailFromUrl) {
      setMyData({ email: emailFromUrl, refCode, refs: 0 });
      setStatus("success");
      localStorage.setItem("waitlist_email", emailFromUrl);
      localStorage.setItem("waitlist_code", refCode);
      axios.get(`${API}/waitlist/my-refs/${refCode}`)
        .then(res => setMyData(d => ({...d, refs: res.data.count || 0})))
        .catch(() => {});
    }
  }, []);

  const handleJoin = async () => {
    if (!email.trim()) { setErrorMsg("Please enter your email address."); return; }
    if (!email.includes("@")) { setErrorMsg("Please enter a valid email address."); return; }
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await axios.post(`${API}/waitlist`, {
        email: email.trim().toLowerCase(),
        ref: refCode || null
      });
      const data = res.data;
      localStorage.setItem("waitlist_email", email.trim().toLowerCase());
      localStorage.setItem("waitlist_code", data.refCode);
      setMyData({ email: email.trim().toLowerCase(), refCode: data.refCode, refs: 0 });
      setCount(c => c + 1);
      setStatus("success");
      axios.get(`${API}/waitlist/leaderboard`).then(r => setLeaderboard(r.data || [])).catch(() => {});
    } catch (err) {
      if (err.response?.status === 409) {
        const existingCode = err.response.data.refCode;
        if (existingCode) {
          localStorage.setItem("waitlist_email", email.trim().toLowerCase());
          localStorage.setItem("waitlist_code", existingCode);
          setMyData({ email: email.trim().toLowerCase(), refCode: existingCode, refs: 0 });
          setStatus("success");
        } else {
          setErrorMsg("You're already on the waitlist! Check your email for your referral link. 🚀");
          setStatus("idle");
        }
      } else {
        setErrorMsg("Something went wrong. Please try again.");
        setStatus("idle");
      }
    }
  };

  const refLink = myData ? `${window.location.origin}/waitlist?ref=${myData.refCode}` : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(refLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const msg = encodeURIComponent(`✈️ I just joined CometAI waitlist — India's AI-powered flight booking with WhatsApp support!\n\n🎁 Join using my link and get ₹100 off your first flight booking above ₹5,000!\n\n👉 ${refLink}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const shareInstagram = () => {
    // Instagram doesn't support direct share links — copy and open Instagram
    navigator.clipboard.writeText(`✈️ Join CometAI waitlist and get ₹100 off your first flight! ${refLink}`);
    alert("Caption copied! Open Instagram and paste it in your story or post.");
    window.open("https://www.instagram.com", "_blank");
  };

  const shareTwitter = () => {
    const msg = encodeURIComponent(`🚀 Just joined CometAI — India's AI travel platform where you can book flights via WhatsApp!\n\nJoin using my link and get ₹100 off your first booking 👇\n${refLink}`);
    window.open(`https://twitter.com/intent/tweet?text=${msg}`, "_blank");
  };

  const rankEmoji = (i) => i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i+1}`;

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

        <h1 className="hero-title">The Future of<br/>Travel Booking</h1>
        <p className="hero-sub">Book flights using AI or WhatsApp. Zero booking fees. India's smartest travel platform is almost here!</p>

        {status !== "success" ? (
          <>
            {/* REFERRAL PREVIEW — shown before joining */}
            <div className="referral-preview" style={{width:"100%",maxWidth:"500px"}}>
              <div className="referral-preview-title">🎁 Join & Earn Launch Rewards</div>
              <div className="referral-steps">
                <div className="referral-step">
                  <span className="step-icon">1️⃣</span>
                  <div className="step-text">Join the waitlist and get your <strong>unique referral link</strong> sent to your email</div>
                </div>
                <div className="referral-step">
                  <span className="step-icon">2️⃣</span>
                  <div className="step-text">Share your link on <strong>WhatsApp, Instagram, Twitter</strong> with friends</div>
                </div>
                <div className="referral-step">
                  <span className="step-icon">3️⃣</span>
                  <div className="step-text">When your friend books a flight above <strong>₹5,000</strong> — <strong>you get ₹150 off</strong> your next booking and <strong>they get ₹100 off</strong> their first booking!</div>
                </div>
              </div>
              <div className="referral-note">📧 Your referral link will be sent to your email after joining</div>
            </div>

            <div className="counter-wrap">
              <div className="counter-avatars">
                {["🧑","👩","👨","🧑","👩"].map((e,i)=>(
                  <div key={i} className="counter-avatar">{e}</div>
                ))}
              </div>
              <div className="counter-text"><span className="counter-num">{count}+</span> people already joined</div>
            </div>

            <div className="waitlist-form">
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
                  {status === "loading" ? "Joining..." : "Join & Get Link →"}
                </button>
              </div>
              <div className="input-hint">🔒 No spam. We only email you when CometAI launches.</div>
            </div>
          </>
        ) : (
          <div className="success-section">
            <div className="success-hero">
              <div className="success-icon">🎉</div>
              <div className="success-title">You're on the list!</div>
              <div className="success-sub">Check your email for your referral link. Share it to earn launch bonuses!</div>
            </div>

            <div className="referral-card">
              <div className="referral-title">✦ Your Referral Rewards</div>
              <div className="referral-desc">
                Share your link below. When a friend books a flight above ₹5,000 using your link — you both get rewarded!
              </div>

              <div className="referral-reward">
                <div className="reward-item">
                  <div className="reward-amount">₹150</div>
                  <div className="reward-label">You get per referral booking</div>
                </div>
                <div className="reward-item">
                  <div className="reward-amount">₹100</div>
                  <div className="reward-label">Friend gets on first booking</div>
                </div>
              </div>

              <div className="ref-stats">
                <div className="ref-stat">
                  <div className="ref-stat-value">{myData?.refs || 0}</div>
                  <div className="ref-stat-label">Friends referred</div>
                </div>
                <div className="ref-stat">
                  <div className="ref-stat-value">₹{((myData?.refs || 0) * 150).toLocaleString()}</div>
                  <div className="ref-stat-label">Bonus earned</div>
                </div>
              </div>

              <div className="ref-link-wrap">
                <div className="ref-link-text">{refLink}</div>
                <button className={`btn-copy ${copied?"copied":""}`} onClick={handleCopy}>
                  {copied ? "✓ Copied!" : "Copy"}
                </button>
              </div>

              <div className="share-title">Share now & start earning</div>
              <div className="share-btns">
                <button className="btn-share btn-whatsapp" onClick={shareWhatsApp}>
                  📱 WhatsApp
                </button>
                <button className="btn-share btn-instagram" onClick={shareInstagram}>
                  📸 Instagram
                </button>
                <button className="btn-share btn-twitter" onClick={shareTwitter}>
                  🐦 Twitter
                </button>
                <button className={`btn-share btn-copy-link`} onClick={handleCopyLink} style={{border:"1px solid rgba(255,255,255,0.12)"}}>
                  {linkCopied ? "✓ Copied!" : "🔗 Copy link"}
                </button>
              </div>
            </div>
          </div>
        )}

        {leaderboard.length > 0 && (
          <div className="leaderboard">
            <div className="lb-title">🏆 Top Referrers</div>
            <div className="lb-card">
              {leaderboard.slice(0,5).map((item, i) => (
                <div className="lb-row" key={i}>
                  <div className="lb-rank">{rankEmoji(i)}</div>
                  <div className="lb-email">{maskEmail(item.email)}</div>
                  <div className="lb-count">{item.ref_count} refs</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="features">
          <div className="feature">✈️ Real flights</div>
          <div className="feature">🤖 AI search</div>
          <div className="feature">📱 WhatsApp booking</div>
          <div className="feature">💰 Zero fees</div>
        </div>

        <div className="footer">
          <p>© 2026 CometAI Travel · <a href="/">Back to home</a></p>
        </div>
      </div>
    </>
  );
}

export default Waitlist;