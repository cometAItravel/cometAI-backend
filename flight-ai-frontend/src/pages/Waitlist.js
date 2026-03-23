import { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { motion, useInView } from "framer-motion";

const API = "https://cometai-backend.onrender.com";

/* ── BlurText ── */
const buildKF = (from, steps) => {
  const keys = new Set([...Object.keys(from), ...steps.flatMap(s => Object.keys(s))]);
  const kf = {}; keys.forEach(k => { kf[k] = [from[k], ...steps.map(s => s[k])]; }); return kf;
};
function BlurText({ text='', delay=120, animateBy='words', direction='top', stepDuration=0.4, once=true, style={} }) {
  const els = animateBy==='words' ? text.split(' ') : text.split('');
  const ref = useRef(null);
  const inView = useInView(ref, { once, margin:'-40px' });
  const from = useMemo(()=>direction==='top'?{filter:'blur(14px)',opacity:0,y:-50}:{filter:'blur(14px)',opacity:0,y:50},[direction]);
  const to = useMemo(()=>[{filter:'blur(6px)',opacity:0.4,y:direction==='top'?10:-10},{filter:'blur(0px)',opacity:1,y:0}],[direction]);
  const steps=to.length+1; const dur=stepDuration*(steps-1);
  const times=Array.from({length:steps},(_,i)=>steps===1?0:i/(steps-1));
  return(
    <div ref={ref} style={{display:'flex',flexWrap:'wrap',...style}}>
      {els.map((seg,i)=>(
        <motion.span key={i} initial={from} animate={inView?buildKF(from,to):from}
          transition={{duration:dur,times,delay:(i*delay)/1000,ease:'easeOut'}}
          style={{display:'inline-block',willChange:'transform,filter,opacity'}}>
          {seg===''?'\u00A0':seg}{animateBy==='words'&&i<els.length-1&&'\u00A0'}
        </motion.span>
      ))}
    </div>
  );
}

function maskEmail(email) {
  if (!email) return "***@***.com";
  const p = email.split("@");
  if (p.length < 2) return "***";
  return p[0].slice(0,2) + "***@" + p[1];
}

export default function Waitlist() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [count, setCount] = useState(0);
  const [myRefCode, setMyRefCode] = useState("");
  const [myRefs, setMyRefs] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  const incomingRef = (() => {
    try { return new URLSearchParams(window.location.search||"").get("ref") || ""; }
    catch { return ""; }
  })();

  // scroll for theme morph
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const themeIndex = scrollY < window.innerHeight * 0.6 ? 0 : scrollY < window.innerHeight * 1.4 ? 1 : 2;

  const themes = [
    // Pearl violet
    { bg:'linear-gradient(135deg,#f8f6ff 0%,#f0ebff 30%,#e8f4ff 60%,#f5f8ff 100%)', accent:'#6d28d9', accent2:'#8b5cf6', text:'#1e1033', sub:'#4c1d95', card:'rgba(255,255,255,0.8)', cardBorder:'rgba(109,40,217,0.12)' },
    // Mint teal
    { bg:'linear-gradient(135deg,#f0fdf9 0%,#e0faf4 30%,#ccfbf0 60%,#f0fdf9 100%)', accent:'#059669', accent2:'#10b981', text:'#064e3b', sub:'#065f46', card:'rgba(255,255,255,0.82)', cardBorder:'rgba(5,150,105,0.15)' },
    // Sky blue
    { bg:'linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 30%,#bae6fd 60%,#f0f9ff 100%)', accent:'#0284c7', accent2:'#0ea5e9', text:'#0c4a6e', sub:'#075985', card:'rgba(255,255,255,0.82)', cardBorder:'rgba(2,132,199,0.15)' },
  ];
  const theme = themes[themeIndex];

  // canvas particles
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d");
    cv.width = window.innerWidth; cv.height = window.innerHeight;
    const particles = Array.from({length:140},()=>({
      x:Math.random()*cv.width, y:Math.random()*cv.height,
      r:Math.random()*3+0.5, op:Math.random()*0.4+0.1,
      vx:(Math.random()-.5)*.3, vy:(Math.random()-.5)*.3,
      tw:Math.random()*Math.PI*2, ts:Math.random()*.014+.003,
      hue:Math.floor(Math.random()*60)+200,
    }));
    const meteors=[]; let mt=0;
    const spawn=()=>meteors.push({x:Math.random()*cv.width*.7,y:Math.random()*cv.height*.4,len:80+Math.random()*130,spd:6+Math.random()*5,ang:Math.PI/6+Math.random()*.3,life:0,max:30+Math.random()*18});
    const draw=()=>{
      ctx.clearRect(0,0,cv.width,cv.height);
      particles.forEach(p=>{
        p.tw+=p.ts; p.x+=p.vx; p.y+=p.vy;
        if(p.x<0)p.x=cv.width; if(p.x>cv.width)p.x=0;
        if(p.y<0)p.y=cv.height; if(p.y>cv.height)p.y=0;
        const op=p.op*(0.5+0.5*Math.sin(p.tw));
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=`hsla(${p.hue},75%,60%,${op})`; ctx.fill();
        if(p.r>2){ctx.beginPath();ctx.arc(p.x,p.y,p.r*2.5,0,Math.PI*2);ctx.fillStyle=`hsla(${p.hue},75%,70%,${op*.18})`;ctx.fill();}
      });
      mt++; if(mt>95+Math.random()*55){spawn();mt=0;}
      meteors.forEach((m,i)=>{
        m.life++;
        const op=Math.sin((m.life/m.max)*Math.PI)*.55;
        const tx=Math.cos(m.ang)*m.len; const ty=Math.sin(m.ang)*m.len;
        const g=ctx.createLinearGradient(m.x,m.y,m.x-tx,m.y-ty);
        g.addColorStop(0,`rgba(100,100,255,${op})`);
        g.addColorStop(.4,`rgba(150,120,255,${op*.6})`);
        g.addColorStop(1,"transparent");
        ctx.beginPath();ctx.moveTo(m.x,m.y);ctx.lineTo(m.x-tx,m.y-ty);
        ctx.strokeStyle=g;ctx.lineWidth=1.4;ctx.stroke();
        m.x+=Math.cos(m.ang)*m.spd; m.y+=Math.sin(m.ang)*m.spd;
        if(m.life>=m.max)meteors.splice(i,1);
      });
      animRef.current=requestAnimationFrame(draw);
    };
    draw();
    const r=()=>{cv.width=window.innerWidth;cv.height=window.innerHeight;};
    window.addEventListener("resize",r);
    return()=>{cancelAnimationFrame(animRef.current);window.removeEventListener("resize",r);};
  },[]);

  useEffect(() => {
    axios.get(`${API}/waitlist/count`).then(r=>setCount(r.data.count||0)).catch(()=>setCount(47));
    axios.get(`${API}/waitlist/leaderboard`).then(r=>setLeaderboard(r.data||[])).catch(()=>{});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleJoin = async () => {
    if (!email.trim()) { setErrorMsg("Please enter your email address."); return; }
    if (!email.includes("@")) { setErrorMsg("Please enter a valid email address."); return; }
    setStatus("loading"); setErrorMsg("");
    try {
      const res = await axios.post(`${API}/waitlist`, { email: email.trim().toLowerCase(), ref: incomingRef || null });
      setMyRefCode(res.data.refCode); setMyRefs(0); setStatus("success"); setCount(c=>c+1);
      axios.get(`${API}/waitlist/leaderboard`).then(r=>setLeaderboard(r.data||[])).catch(()=>{});
    } catch (err) {
      if (err.response?.status === 409) {
        const code = err.response.data.refCode;
        if (code) { setMyRefCode(code); setStatus("success"); }
        else { setErrorMsg("You're already on the waitlist! Check your email for your referral link. 🚀"); setStatus("idle"); }
      } else { setErrorMsg("Something went wrong. Please try again."); setStatus("idle"); }
    }
  };

  const refLink = myRefCode ? `${window.location.origin}/waitlist?ref=${myRefCode}` : "";
  const copyRef = () => { navigator.clipboard.writeText(refLink); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  const copyLink = () => { navigator.clipboard.writeText(refLink); setLinkCopied(true); setTimeout(()=>setLinkCopied(false),2000); };
  const shareWA = () => { const msg = encodeURIComponent(`✈️ I joined CometAI — India's AI-powered flight booking!\n\n🎁 Join using my link and get ₹100 off your first flight above ₹5,000!\n\n👉 ${refLink}`); window.open(`https://wa.me/?text=${msg}`,"_blank"); };
  const shareIG = () => { navigator.clipboard.writeText(`✈️ Join CometAI waitlist and get ₹100 off your first flight!\n👉 ${refLink}`); alert("Caption copied!\nOpen Instagram → Create Story or Post → Paste the caption."); };
  const shareTW = () => { const msg = encodeURIComponent(`🚀 Just joined CometAI — book flights via AI or WhatsApp, zero fees!\nJoin with my link & get ₹100 off your first booking 👇\n${refLink}`); window.open(`https://twitter.com/intent/tweet?text=${msg}`,"_blank"); };
  const emoji = (i) => ["🥇","🥈","🥉"][i] || `#${i+1}`;

  return (
    <div style={{ minHeight:"100vh", overflowX:"hidden", fontFamily:"'DM Sans',sans-serif", position:"relative", transition:"background 1.6s ease", background: theme.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-thumb{border-radius:2px;}
        @keyframes floatBlob{0%,100%{transform:translate(0,0) scale(1);}33%{transform:translate(2%,-3%) scale(1.05);}66%{transform:translate(-2%,2%) scale(0.97);}}
        @keyframes scanLine{0%{top:-1px;opacity:0;}5%{opacity:.35;}95%{opacity:.35;}100%{top:100%;opacity:0;}}
        @keyframes badgePing{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.5);}70%{box-shadow:0 0 0 10px rgba(16,185,129,0);}}
        @keyframes shimText{0%{background-position:0% center;}100%{background-position:400% center;}}
        @keyframes counterFade{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
        .scan{position:fixed;left:0;width:100%;height:1px;pointer-events:none;z-index:2;animation:scanLine 14s linear infinite;}
        .btn-main{border:none;border-radius:14px;font-family:'DM Sans',sans-serif;font-weight:700;cursor:pointer;position:relative;overflow:hidden;transition:all .3s cubic-bezier(.23,1,.32,1);}
        .btn-main::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.2),transparent);}
        .btn-main:hover{transform:translateY(-3px);}
        .btn-out{background:transparent;border-radius:12px;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .3s;}
        .btn-out:hover{transform:translateY(-2px);}
        .input-field{width:100%;border-radius:12px;padding:14px 18px;font-family:'DM Sans',sans-serif;font-size:15px;outline:none;transition:all .3s;}
        .ref-step{display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;}
        .lb-row{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom-width:1px;border-bottom-style:solid;transition:background .2s;}
        .lb-row:last-child{border-bottom:none!important;}
        .share-btn{display:flex;align-items:center;gap:6px;padding:10px 18px;border-radius:10px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all .25s;border:none;}
        .share-btn:hover{transform:translateY(-2px);}
        @media(max-width:480px){
          .rewards-row{flex-direction:column!important;}
          .share-btns{flex-wrap:wrap!important;}
          .hero-title{font-size:clamp(32px,9vw,48px)!important;}
        }
      `}</style>

      {/* canvas */}
      <canvas ref={canvasRef} style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',opacity:.55}}/>

      {/* morphing blobs */}
      <motion.div animate={{background:`radial-gradient(ellipse at 15% 35%,${theme.accent}18 0%,transparent 55%)`}} transition={{duration:1.8}}
        style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',animation:'floatBlob 12s ease-in-out infinite'}}/>
      <motion.div animate={{background:`radial-gradient(ellipse at 80% 20%,${theme.accent2}14 0%,transparent 50%)`}} transition={{duration:1.8}}
        style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',animation:'floatBlob 16s ease-in-out infinite reverse'}}/>

      {/* grid */}
      <motion.div animate={{backgroundImage:`linear-gradient(${theme.accent}07 1px,transparent 1px),linear-gradient(90deg,${theme.accent}07 1px,transparent 1px)`}} transition={{duration:1.8}}
        style={{position:'fixed',inset:0,backgroundSize:'72px 72px',maskImage:'radial-gradient(ellipse 80% 70% at 50% 40%,black 20%,transparent 80%)',zIndex:0,pointerEvents:'none'}}/>

      {/* scan */}
      <div className="scan" style={{background:`linear-gradient(90deg,transparent,${theme.accent}18,transparent)`}}/>

      {/* ── NAV ── */}
      <motion.nav animate={{background:`rgba(255,255,255,0.8)`,borderBottomColor:`${theme.accent}15`}} transition={{duration:1.6}}
        style={{position:'fixed',top:0,left:0,right:0,zIndex:100,backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)',borderBottom:'1px solid',boxShadow:`0 1px 20px ${theme.accent}10`}}>
        <div style={{maxWidth:900,margin:'0 auto',padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}} onClick={()=>window.location.href='/'}>
            <motion.div animate={{background:`linear-gradient(135deg,${theme.accent},${theme.accent2})`,boxShadow:`0 4px 14px ${theme.accent}40`}} transition={{duration:1.6}}
              style={{width:34,height:34,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,color:'white',flexShrink:0}}>☄</motion.div>
            <motion.span animate={{color:theme.text}} transition={{duration:1.6}}
              style={{fontFamily:"'Syne',sans-serif",fontSize:17,fontWeight:800,letterSpacing:'.5px'}}>COMETAI</motion.span>
          </div>
          <div style={{display:'flex',gap:10}}>
            <motion.button className="btn-out" onClick={()=>window.location.href='/login'}
              animate={{borderColor:`${theme.accent}40`,color:theme.sub}} transition={{duration:1.6}}
              style={{padding:'7px 18px',fontSize:13,border:'1px solid'}}>Sign In</motion.button>
            <motion.button className="btn-main" onClick={()=>window.location.href='/register'}
              animate={{background:`linear-gradient(135deg,${theme.accent},${theme.accent2})`,boxShadow:`0 6px 20px ${theme.accent}40`}} transition={{duration:1.6}}
              style={{padding:'7px 18px',fontSize:13,color:'white'}}>Get Started →</motion.button>
          </div>
        </div>
      </motion.nav>

      {/* ── MAIN CONTENT ── */}
      <div style={{position:'relative',zIndex:2,maxWidth:620,margin:'0 auto',padding:'100px 24px 60px',textAlign:'center'}}>

        {/* badge */}
        <motion.div initial={{opacity:0,y:20,scale:.9}} animate={{opacity:1,y:0,scale:1}} transition={{duration:.6,delay:.1}}>
          <motion.div animate={{background:`${theme.accent}12`,borderColor:`${theme.accent}35`}} transition={{duration:1.6}}
            style={{display:'inline-flex',alignItems:'center',gap:8,marginBottom:28,border:'1px solid',borderRadius:24,padding:'7px 18px'}}>
            <div style={{width:7,height:7,borderRadius:'50%',background:'#10b981',boxShadow:'0 0 10px #10b981',animation:'badgePing 2s ease infinite'}}/>
            <motion.span animate={{color:theme.sub}} transition={{duration:1.6}}
              style={{fontSize:11,letterSpacing:'2px',textTransform:'uppercase',fontFamily:"'Space Mono',monospace"}}>Launching Soon · Join Free</motion.span>
          </motion.div>
        </motion.div>

        {/* TITLE */}
        <BlurText
          text="The Future of Travel Booking"
          delay={120} animateBy="words" direction="top" stepDuration={0.5} once={true}
          style={{fontFamily:"'Syne',sans-serif",fontSize:'clamp(32px,7vw,56px)',fontWeight:800,lineHeight:1.05,letterSpacing:'-1.5px',marginBottom:16,color:theme.text,justifyContent:'center'}}
        />

        <motion.p initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:1,duration:.7}}
          style={{fontSize:16,color:`${theme.sub}cc`,lineHeight:1.75,marginBottom:8,fontWeight:300}}>
          India's AI-powered flight booking platform.
        </motion.p>
        <motion.p initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:1.2,duration:.7}}
          style={{fontSize:15,color:`${theme.sub}88`,lineHeight:1.75,marginBottom:32,fontWeight:300}}>
          Book via AI, WhatsApp, or classic search — zero booking fees, real data.
        </motion.p>

        {/* COUNTER */}
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.4,duration:.6}}
          style={{display:'flex',alignItems:'center',gap:10,justifyContent:'center',marginBottom:28}}>
          <div style={{display:'flex'}}>
            {["🧑","👩","👨","🧑","👩"].map((e,i)=>(
              <motion.div key={i} animate={{background:`linear-gradient(135deg,${theme.accent}40,${theme.accent2}30)`,borderColor:'white'}} transition={{duration:1.6}}
                style={{width:28,height:28,borderRadius:'50%',border:'2px solid',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,marginLeft:i===0?0:-7}}>{e}</motion.div>
            ))}
          </div>
          <motion.span animate={{color:theme.sub}} transition={{duration:1.6}} style={{fontSize:13}}>
            <strong style={{color:theme.accent}}>{count}+</strong> people already joined
          </motion.span>
        </motion.div>

        {/* REFERRAL INFO BOX */}
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:1.6,duration:.7}}>
          <motion.div animate={{background:theme.card,borderColor:`${theme.accent}20`}} transition={{duration:1.6}}
            style={{borderRadius:20,border:'1px solid',padding:'20px 24px',marginBottom:24,textAlign:'left',backdropFilter:'blur(12px)'}}>
            <motion.p animate={{color:theme.accent}} transition={{duration:1.6}}
              style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:'2px',textTransform:'uppercase',marginBottom:14,textAlign:'center'}}>🎁 Join & Earn Launch Rewards</motion.p>
            {[
              {icon:'1️⃣',text:<>Join the waitlist — get your <strong>unique referral link</strong> sent to your email instantly</>},
              {icon:'2️⃣',text:<>Share on <strong>WhatsApp, Instagram or Twitter</strong> with friends and family</>},
              {icon:'3️⃣',text:<>Friend books a flight above <strong>₹5,000</strong> → <strong>you get ₹150 off</strong> + <strong>friend gets ₹100 off!</strong> No limit!</>},
            ].map((s,i)=>(
              <div key={i} className="ref-step">
                <span style={{fontSize:17,flexShrink:0}}>{s.icon}</span>
                <motion.span animate={{color:`${theme.sub}bb`}} transition={{duration:1.6}} style={{fontSize:13,lineHeight:1.6}}>{s.text}</motion.span>
              </div>
            ))}
            <motion.p animate={{color:`${theme.sub}55`}} transition={{duration:1.6}}
              style={{fontSize:11,fontFamily:"'Space Mono',monospace",textAlign:'center',marginTop:12,paddingTop:12,borderTop:`1px solid ${theme.accent}12`}}>
              📧 Already joined? Re-enter your email to see your referral dashboard
            </motion.p>
          </motion.div>
        </motion.div>

        {/* FORM / SUCCESS */}
        {status !== "success" ? (
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:1.8,duration:.6}}>
            {errorMsg && (
              <motion.div animate={{background:'rgba(239,68,68,.06)',borderColor:'rgba(239,68,68,.2)'}} transition={{duration:1.6}}
                style={{border:'1px solid',borderRadius:12,padding:'10px 16px',marginBottom:12,fontSize:13,color:'#dc2626'}}>⚠ {errorMsg}</motion.div>
            )}
            <motion.div animate={{background:'rgba(255,255,255,.9)',borderColor:`${theme.accent}25`,boxShadow:`0 0 0 3px ${theme.accent}00`}} transition={{duration:1.6}}
              style={{display:'flex',gap:8,border:'1px solid',borderRadius:16,padding:'6px 6px 6px 20px',marginBottom:10,transition:'all .3s'}}
              whileFocusWithin={{boxShadow:`0 0 0 3px ${theme.accent}18`}}>
              <input
                className="input-field"
                style={{flex:1,background:'transparent',border:'none',color:theme.text,fontSize:15,padding:'8px 0'}}
                type="email" placeholder="Enter your email address..."
                value={email} onChange={e=>setEmail(e.target.value)}
                onKeyPress={e=>{if(e.key==="Enter")handleJoin();}}
              />
              <motion.button className="btn-main" onClick={handleJoin} disabled={status==="loading"}
                animate={{background:`linear-gradient(135deg,${theme.accent},${theme.accent2})`,boxShadow:`0 8px 24px ${theme.accent}40`}} transition={{duration:1.6}}
                style={{padding:'11px 22px',fontSize:14,color:'white',whiteSpace:'nowrap'}}>
                {status==="loading" ? "Joining..." : "Join & Get Link →"}
              </motion.button>
            </motion.div>
            <motion.p animate={{color:`${theme.sub}55`}} transition={{duration:1.6}} style={{fontSize:11,fontFamily:"'Space Mono',monospace",letterSpacing:'.5px'}}>
              🔒 No spam. We only email you when CometAI launches.
            </motion.p>
          </motion.div>
        ) : (
          <motion.div initial={{opacity:0,scale:.95}} animate={{opacity:1,scale:1}} transition={{duration:.5}}>
            {/* success box */}
            <motion.div animate={{background:'rgba(16,185,129,.06)',borderColor:'rgba(16,185,129,.2)'}} transition={{duration:1.6}}
              style={{border:'1px solid',borderRadius:20,padding:'20px 24px',marginBottom:16}}>
              <div style={{fontSize:40,marginBottom:10}}>🎉</div>
              <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:700,color:'#059669',marginBottom:6}}>You're on the list!</h3>
              <p style={{fontSize:13,color:'rgba(5,150,105,.7)'}}>Your referral link was sent to your email. Share it to earn rewards!</p>
            </motion.div>

            {/* referral card */}
            <motion.div animate={{background:theme.card,borderColor:`${theme.accent}20`}} transition={{duration:1.6}}
              style={{border:'1px solid',borderRadius:20,padding:'20px 24px',marginBottom:12,textAlign:'left'}}>
              <motion.div animate={{background:`linear-gradient(90deg,transparent,${theme.accent}30,transparent)`}} transition={{duration:1.6}}
                style={{position:'absolute',top:0,left:0,right:0,height:1,borderRadius:'20px 20px 0 0'}}/>
              <motion.p animate={{color:theme.accent}} transition={{duration:1.6}}
                style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:'2px',textTransform:'uppercase',marginBottom:10,textAlign:'center'}}>✦ Your Referral Rewards</motion.p>
              <p style={{fontSize:13,color:`${theme.sub}88`,marginBottom:14,lineHeight:1.6,textAlign:'center'}}>
                When a friend books above ₹5,000 using your link — you both win!
              </p>

              {/* reward boxes */}
              <div className="rewards-row" style={{display:'flex',gap:10,marginBottom:14}}>
                {[{amt:'₹150',lbl:'You get per referral'},{amt:'₹100',lbl:"Friend's first booking"}].map((r,i)=>(
                  <motion.div key={i} animate={{background:`${theme.accent}08`,borderColor:`${theme.accent}20`}} transition={{duration:1.6}}
                    style={{flex:1,border:'1px solid',borderRadius:12,padding:14,textAlign:'center'}}>
                    <motion.div animate={{color:theme.accent}} transition={{duration:1.6}}
                      style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800}}>{r.amt}</motion.div>
                    <div style={{fontSize:11,color:`${theme.sub}66`,marginTop:4}}>{r.lbl}</div>
                  </motion.div>
                ))}
              </div>

              {/* stats */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
                {[{v:myRefs,l:'Friends referred'},{v:`₹${myRefs*150}`,l:'Bonus earned'}].map((st,i)=>(
                  <motion.div key={i} animate={{background:`${theme.accent}06`,borderColor:`${theme.accent}15`}} transition={{duration:1.6}}
                    style={{border:'1px solid',borderRadius:10,padding:12,textAlign:'center'}}>
                    <motion.div animate={{color:theme.text}} transition={{duration:1.6}}
                      style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800}}>{st.v}</motion.div>
                    <div style={{fontSize:11,color:`${theme.sub}55`,marginTop:3}}>{st.l}</div>
                  </motion.div>
                ))}
              </div>

              {/* link row */}
              <motion.div animate={{background:'rgba(255,255,255,.9)',borderColor:`${theme.accent}20`}} transition={{duration:1.6}}
                style={{display:'flex',gap:8,border:'1px solid',borderRadius:10,padding:'10px 14px',marginBottom:14}}>
                <div style={{flex:1,fontSize:11,color:theme.accent,fontFamily:'monospace',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{refLink}</div>
                <motion.button className="btn-out" onClick={copyRef}
                  animate={{borderColor:`${theme.accent}35`,color:theme.accent}} transition={{duration:1.6}}
                  style={{border:'1px solid',padding:'5px 12px',fontSize:12,whiteSpace:'nowrap',borderRadius:8}}>
                  {copied?"✓ Copied!":"Copy"}
                </motion.button>
              </motion.div>

              <motion.p animate={{color:`${theme.sub}55`}} transition={{duration:1.6}} style={{fontSize:11,letterSpacing:'1px',textTransform:'uppercase',fontFamily:"'Space Mono',monospace",marginBottom:10,textAlign:'center'}}>Share now & start earning</motion.p>
              <div className="share-btns" style={{display:'flex',gap:8,justifyContent:'center'}}>
                <button className="share-btn" onClick={shareWA} style={{background:'#25D366',color:'white'}}>📱 WhatsApp</button>
                <button className="share-btn" onClick={shareIG} style={{background:'linear-gradient(135deg,#f09433,#dc2743,#bc1888)',color:'white'}}>📸 Instagram</button>
                <button className="share-btn" onClick={shareTW} style={{background:'#1DA1F2',color:'white'}}>🐦 Twitter</button>
                <motion.button className="share-btn" onClick={copyLink}
                  animate={{background:`${theme.accent}15`,color:theme.accent,borderColor:`${theme.accent}30`}} transition={{duration:1.6}}
                  style={{border:'1px solid'}}>
                  {linkCopied?"✓ Copied!":"🔗 Copy"}
                </motion.button>
              </div>
            </motion.div>

            <button onClick={()=>{setStatus("idle");setEmail("");setMyRefCode("");}}
              style={{background:'transparent',border:'none',fontSize:12,color:`${theme.sub}55`,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",marginTop:4}}>
              ← Back to waitlist
            </button>
          </motion.div>
        )}

        {/* LEADERBOARD */}
        {leaderboard.length > 0 && (
          <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:false,margin:'-40px'}} transition={{duration:.6}}
            style={{marginTop:32}}>
            <motion.p animate={{color:theme.sub}} transition={{duration:1.6}}
              style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:'2px',textTransform:'uppercase',marginBottom:8}}>🏆 Top Referrers</motion.p>
            <motion.p animate={{color:`${theme.sub}55`}} transition={{duration:1.6}} style={{fontSize:11,marginBottom:12}}>Everyone earns ₹150 per referral — this is just for fun!</motion.p>
            <motion.div animate={{background:theme.card,borderColor:`${theme.accent}15`}} transition={{duration:1.6}}
              style={{border:'1px solid',borderRadius:16,overflow:'hidden'}}>
              {leaderboard.slice(0,5).map((item,i)=>(
                <motion.div key={i} className="lb-row" animate={{borderBottomColor:`${theme.accent}08`}} transition={{duration:1.6}}
                  style={{gap:12,padding:'12px 16px'}}>
                  <span style={{fontSize:16,width:22}}>{emoji(i)}</span>
                  <span style={{flex:1,fontSize:13,color:`${theme.sub}99`,textAlign:'left'}}>{maskEmail(item.email)}</span>
                  <motion.span animate={{color:theme.accent}} transition={{duration:1.6}}
                    style={{fontFamily:"'Space Mono',monospace",fontSize:12,fontWeight:700}}>{item.ref_count} refs</motion.span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* FEATURES ROW */}
        <motion.div initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:false,margin:'-40px'}} transition={{duration:.7}}
          style={{display:'flex',gap:16,justifyContent:'center',flexWrap:'wrap',marginTop:36}}>
          {['✈️ Real flights','🤖 AI search','📱 WhatsApp','💰 Zero fees'].map(f=>(
            <motion.div key={f} animate={{background:theme.card,borderColor:`${theme.accent}15`,color:`${theme.sub}99`}} transition={{duration:1.6}}
              style={{display:'flex',alignItems:'center',gap:6,fontSize:12,border:'1px solid',borderRadius:20,padding:'6px 14px'}}>
              {f}
            </motion.div>
          ))}
        </motion.div>

        {/* FOOTER */}
        <motion.p animate={{color:`${theme.sub}40`}} transition={{duration:1.6}} style={{fontSize:12,marginTop:32}}>
          © 2026 CometAI Travel · <span style={{cursor:'pointer'}} onClick={()=>window.location.href='/'}>Back to home</span>
        </motion.p>
      </div>
    </div>
  );
}