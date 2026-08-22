/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const G = "#c9a84c";
const GD = "#8B6914";
const GL = "#f0d080";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,200;0,300;0,400;0,600;1,200;1,300&family=DM+Sans:wght@200;300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{overflow-x:hidden;scroll-behavior:smooth;}
body{overflow-x:hidden;font-family:'DM Sans',sans-serif;}
::-webkit-scrollbar{width:2px;}
::-webkit-scrollbar-thumb{background:#c9a84c;border-radius:1px;}
@keyframes blink{0%,100%{opacity:1;}50%{opacity:0;}}
@keyframes floatY{0%,100%{transform:translateY(0);}50%{transform:translateY(-12px);}}
@keyframes gs{0%{background-position:200% center;}100%{background-position:-200% center;}}
@keyframes hPulse{0%,100%{opacity:0.9;}50%{opacity:0.55;}}
@keyframes cd1{0%{transform:translateX(0);}100%{transform:translateX(-260px);}}
@keyframes cd2{0%{transform:translateX(0);}100%{transform:translateX(220px);}}
@keyframes cd3{0%{transform:translateX(0);}100%{transform:translateX(-140px);}}
@keyframes revealUp{from{opacity:0;transform:translateY(40px);}to{opacity:1;transform:translateY(0);}}
@keyframes zoomIn{from{opacity:0;transform:scale(0.92);}to{opacity:1;transform:scale(1);}}
@keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
@keyframes cardFloat{0%,100%{transform:translateY(0px);}50%{transform:translateY(-8px);}}
.g-text{background:linear-gradient(135deg,#8B6914,#c9a84c,#f0d080,#c9a84c);background-size:300% auto;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:gs 5s linear infinite;}
.btn-primary{display:inline-flex;align-items:center;gap:10px;padding:16px 42px;border-radius:100px;background:linear-gradient(135deg,#8B6914,#c9a84c,#f0d080);color:#030303;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:700;border:none;cursor:pointer;transition:all 0.4s cubic-bezier(0.34,1.56,0.64,1);}
.btn-primary:hover{transform:translateY(-3px) scale(1.03);box-shadow:0 20px 50px rgba(201,168,76,0.45);}
.btn-outline{display:inline-flex;align-items:center;gap:8px;padding:15px 36px;border-radius:100px;background:transparent;color:rgba(255,255,255,0.75);font-family:'DM Sans',sans-serif;font-size:15px;font-weight:400;border:1px solid rgba(255,255,255,0.25);cursor:pointer;transition:all 0.3s ease;}
.btn-outline:hover{background:rgba(255,255,255,0.08);color:#fff;transform:translateY(-2px);}
.btn-dark{display:inline-flex;align-items:center;gap:8px;padding:15px 36px;border-radius:100px;background:transparent;color:rgba(0,0,0,0.65);font-family:'DM Sans',sans-serif;font-size:15px;font-weight:400;border:1px solid rgba(0,0,0,0.18);cursor:pointer;transition:all 0.3s ease;}
.btn-dark:hover{background:rgba(0,0,0,0.05);color:#000;transform:translateY(-2px);}
.glass-dark{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(24px);border-radius:20px;}
.lift{transition:all 0.4s cubic-bezier(0.34,1.56,0.64,1);}
.lift:hover{transform:translateY(-6px);box-shadow:0 24px 60px rgba(0,0,0,0.18);}
@media(max-width:900px){.hide-m{display:none!important;}.g2{grid-template-columns:1fr!important;}.g3{grid-template-columns:1fr!important;}}
@media(max-width:600px){.nb-center{display:none!important;}.btn-primary{padding:10px 18px!important;font-size:13px!important;}.sp-nav-logo span{display:none!important;}}
`;

/* MARK — two strokes only, perfectly minimal */
function AlvrynMark({size=44,glow=false,bg=false}){
  const s=size,cx=s*0.5,cy=s*0.5,R1=s*0.47,R2=s*0.40,sw=s*0.10,id="am"+s;
  const lx1=cx-s*0.03,ly1=cy-s*0.27,lx2=cx-s*0.21,ly2=cy+s*0.30;
  const rx1=cx+s*0.05,ry1=cy-s*0.27,rx2=cx+s*0.21,ry2=cy+s*0.30;
  const dx=cx-s*0.01,dy=cy+s*0.01;
  return(
    <svg width={s} height={s} viewBox={"0 0 "+s+" "+s} fill="none"
      style={{filter:glow?"drop-shadow(0 0 "+(s*0.16)+"px rgba(201,168,76,0.8))":"none",flexShrink:0}}>
      <defs>
        <radialGradient id={id+"g"} cx="50%" cy="42%" r="48%">
          <stop offset="0%" stopColor="#f0d080" stopOpacity="0.55"/>
          <stop offset="100%" stopColor="#c9a84c" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id={id+"l"} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6B5010" stopOpacity="0.85"/>
          <stop offset="38%" stopColor="#f0d080" stopOpacity="1"/>
          <stop offset="70%" stopColor="#d4a840" stopOpacity="0.95"/>
          <stop offset="100%" stopColor="#a07820" stopOpacity="0.8"/>
        </linearGradient>
        <linearGradient id={id+"r"} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#c9a84c" stopOpacity="0.85"/>
          <stop offset="45%" stopColor="#9a7830" stopOpacity="0.8"/>
          <stop offset="100%" stopColor="#5a4010" stopOpacity="0.65"/>
        </linearGradient>
        <linearGradient id={id+"k"} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f0d080" stopOpacity="0.9"/>
          <stop offset="50%" stopColor="#c9a84c" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="#8B6914" stopOpacity="0.7"/>
        </linearGradient>
        <radialGradient id={id+"d"} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#f0d080" stopOpacity="1"/>
          <stop offset="60%" stopColor="#c9a84c" stopOpacity="0.95"/>
          <stop offset="100%" stopColor="#7a5a10" stopOpacity="0.9"/>
        </radialGradient>
        {bg&&<radialGradient id={id+"b"} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#faf7f2"/>
          <stop offset="100%" stopColor="#f0ebe0"/>
        </radialGradient>}
      </defs>
      {bg&&<circle cx={cx} cy={cy} r={R1+s*0.03} fill={"url(#"+id+"b)"}/>}
      <circle cx={cx} cy={cy*0.88} r={R2*0.68} fill={"url(#"+id+"g)"}/>
      <circle cx={cx} cy={cy} r={R1} stroke={"url(#"+id+"k)"} strokeWidth={s*0.008} fill="none"/>
      <circle cx={cx} cy={cy} r={R2} stroke={"url(#"+id+"k)"} strokeWidth={s*0.005} fill="none" opacity="0.5"/>
      <line x1={lx1} y1={ly1} x2={lx2} y2={ly2} stroke={"url(#"+id+"l)"} strokeWidth={sw} strokeLinecap="round"/>
      <line x1={rx1} y1={ry1} x2={rx2} y2={ry2} stroke={"url(#"+id+"r)"} strokeWidth={sw*0.88} strokeLinecap="round"/>
      <circle cx={dx} cy={dy} r={s*0.048} fill={"url(#"+id+"d)"}/>
      <circle cx={dx-s*0.012} cy={dy-s*0.012} r={s*0.022} fill="#fff" opacity="0.45"/>
    </svg>
  );
}

/* PARTICLES */
function Particles(){
  const ref=useRef(null);
  useEffect(()=>{
    const c=ref.current;if(!c)return;
    const ctx=c.getContext("2d");
    let W=c.width=window.innerWidth,H=c.height=window.innerHeight;
    const pts=Array.from({length:36},()=>({x:Math.random()*W,y:Math.random()*H+H*0.1,vx:(Math.random()-0.5)*0.1,vy:-(0.08+Math.random()*0.22),r:Math.random()*1.1+0.2,a:Math.random()*0.14+0.04}));
    const mouse={x:-2000,y:-2000};
    const mfn=e=>{mouse.x=e.clientX;mouse.y=e.clientY;};
    const rfn=()=>{W=c.width=window.innerWidth;H=c.height=window.innerHeight;};
    window.addEventListener("mousemove",mfn,{passive:true});window.addEventListener("resize",rfn);
    let raf;
    const draw=()=>{
      ctx.clearRect(0,0,W,H);
      pts.forEach(p=>{
        const dx=mouse.x-p.x,dy=mouse.y-p.y,d=Math.hypot(dx,dy);
        if(d<90){p.vx+=dx/d*0.009;p.vy+=dy/d*0.009;}
        p.vx*=0.99;p.vy*=0.99;p.x+=p.vx;p.y+=p.vy;
        if(p.y<-5){p.y=H+5;p.x=Math.random()*W;}
        if(p.x<0)p.x=W;if(p.x>W)p.x=0;
        ctx.save();ctx.globalAlpha=p.a;ctx.fillStyle=G;ctx.shadowBlur=3;ctx.shadowColor=G;
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.restore();
      });
      raf=requestAnimationFrame(draw);
    };
    draw();
    return()=>{cancelAnimationFrame(raf);window.removeEventListener("mousemove",mfn);window.removeEventListener("resize",rfn);};
  },[]);
  return <canvas ref={ref} style={{position:"fixed",inset:0,zIndex:1,pointerEvents:"none"}}/>;
}

/* REVEAL */
function Reveal({children,delay=0,direction="up",style}){
  const ref=useRef(null);const [vis,setVis]=useState(false);
  useEffect(()=>{const obs=new IntersectionObserver(([e])=>{if(e.isIntersecting)setVis(true);},{threshold:0.06});if(ref.current)obs.observe(ref.current);return()=>obs.disconnect();},[]);
  const T={up:"translateY(55px)",left:"translateX(-65px)",right:"translateX(65px)"};
  return(<div ref={ref} style={{opacity:vis?1:0,transform:vis?"none":(T[direction]||"translateY(55px)"),transition:"opacity 1s "+delay+"ms cubic-bezier(0.22,1,0.36,1),transform 1.1s "+delay+"ms cubic-bezier(0.22,1,0.36,1)",...style}}>{children}</div>);
}

/* COUNTER */
function Counter({end,suffix="",prefix=""}){
  const [n,setN]=useState(0);const ref=useRef(null);const done=useRef(false);
  useEffect(()=>{const obs=new IntersectionObserver(([e])=>{if(e.isIntersecting&&!done.current){done.current=true;const s=Date.now();const t=()=>{const p=Math.min((Date.now()-s)/2200,1);setN(Math.round((1-Math.pow(1-p,3))*end));if(p<1)requestAnimationFrame(t);};requestAnimationFrame(t);}},{threshold:0.5});if(ref.current)obs.observe(ref.current);return()=>obs.disconnect();},[end]);
  return <span ref={ref}>{prefix}{n.toLocaleString()}{suffix}</span>;
}

/* TYPEWRITER — clean phrases only */
function TypeWriter({phrases,speed=70}){
  const [pi,setPi]=useState(0);const [txt,setTxt]=useState("");const [del,setDel]=useState(false);const [ci,setCi]=useState(0);
  useEffect(()=>{const w=phrases[pi%phrases.length];if(!del){if(ci<w.length){const t=setTimeout(()=>{setTxt(w.slice(0,ci+1));setCi(c=>c+1);},speed);return()=>clearTimeout(t);}else{const t=setTimeout(()=>setDel(true),2600);return()=>clearTimeout(t);}}else{if(ci>0){const t=setTimeout(()=>{setTxt(w.slice(0,ci-1));setCi(c=>c-1);},speed/2);return()=>clearTimeout(t);}else{setDel(false);setPi(p=>p+1);}}
  },[ci,del,pi,phrases,speed]);
  return <span style={{color:G}}>{txt}<span style={{animation:"blink 0.9s step-end infinite",color:G}}>|</span></span>;
}

/* DIVIDER */
function Divider({from,to}){return <div style={{height:80,background:"linear-gradient(180deg,"+from+","+to+")"}}/>;}

/* MINI CHAT — hero right side */
function MiniAlviChat({visible,onTry}){
  const msgs=[
    {role:"user",text:"Plan Goa trip for 6 friends, 15k budget, Aug"},
    {role:"ai",text:"On it! Flights from BLR: ₹3,500–4,500 return. South Goa beaches recommended. Fits your budget."},
    {role:"ai",text:"Hotels near Palolem: ₹800–1,800/room. 2–3 rooms for 6. Shall I include veg options?",cta:true},
  ];
  return(
    <div style={{opacity:visible?1:0,transform:visible?"translateY(0)":"translateY(24px)",transition:"opacity 0.9s 0.8s ease,transform 0.9s 0.8s ease",animation:visible?"cardFloat 5s ease-in-out 2s infinite":"none"}}>
      <div style={{background:"rgba(10,6,4,0.72)",backdropFilter:"blur(28px)",border:"1px solid rgba(201,168,76,0.18)",borderRadius:22,overflow:"hidden",boxShadow:"0 32px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(201,168,76,0.08)"}}>
        {/* Chat header */}
        <div style={{background:"linear-gradient(135deg,rgba(139,105,20,0.3),rgba(201,168,76,0.12))",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"14px 18px",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,"+GD+","+G+")",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <AlvrynMark size={18} glow/>
          </div>
          <div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:13,color:"#fff"}}>ALVI</div>
            <div style={{fontSize:10,color:"#22c55e",display:"flex",alignItems:"center",gap:4}}>
              <span style={{width:4,height:4,borderRadius:"50%",background:"#22c55e",display:"inline-block"}}/>
              <span>by Alvryn · Online</span>
            </div>
          </div>
          <div style={{marginLeft:"auto",fontFamily:"'Space Mono',monospace",fontSize:8,color:"rgba(201,168,76,0.5)",letterSpacing:"0.1em"}}>AI TRAVEL</div>
        </div>
        {/* Messages */}
        <div style={{padding:"16px",display:"flex",flexDirection:"column",gap:10}}>
          {msgs.map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",animation:"fadeIn 0.5s ease "+(0.3+i*0.3)+"s both"}}>
              <div style={{maxWidth:"88%",padding:"10px 14px",borderRadius:m.role==="user"?"16px 16px 3px 16px":"16px 16px 16px 3px",background:m.role==="user"?"linear-gradient(135deg,"+GD+","+G+")":"rgba(255,255,255,0.06)",border:m.role==="ai"?"1px solid rgba(255,255,255,0.07)":"none",fontFamily:"'DM Sans',sans-serif",fontSize:12,lineHeight:1.6,color:m.role==="user"?"#030303":"rgba(255,255,255,0.82)",fontWeight:m.role==="user"?600:400}}>
                {m.text}
                {m.cta&&<div style={{marginTop:10,paddingTop:10,borderTop:"1px solid rgba(201,168,76,0.2)",display:"flex",gap:8,flexWrap:"wrap"}}>
                  <button onClick={onTry} style={{background:G,color:"#030303",border:"none",borderRadius:8,padding:"7px 14px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Book Flights</button>
                  <button onClick={onTry} style={{background:"transparent",color:G,border:"1px solid rgba(201,168,76,0.4)",borderRadius:8,padding:"7px 12px",fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Full Plan</button>
                </div>}
              </div>
            </div>
          ))}
        </div>
        {/* Input bar */}
        <div style={{padding:"10px 14px",borderTop:"1px solid rgba(255,255,255,0.04)",display:"flex",gap:8,alignItems:"center"}}>
          <div style={{flex:1,background:"rgba(255,255,255,0.04)",borderRadius:100,padding:"9px 14px",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"rgba(255,255,255,0.2)"}}>Ask ALVI anything...</div>
          <button onClick={onTry} style={{width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,"+GD+","+G+")",border:"none",cursor:"pointer",fontSize:14,color:"#030303",display:"flex",alignItems:"center",justifyContent:"center"}}>↑</button>
        </div>
      </div>
      {/* Floating badge */}
      <div style={{display:"flex",justifyContent:"center",marginTop:12}}>
        <div style={{background:"rgba(0,0,0,0.5)",backdropFilter:"blur(10px)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:100,padding:"5px 14px",fontFamily:"'Space Mono',monospace",fontSize:9,color:"rgba(255,255,255,0.35)",letterSpacing:"0.12em"}}>TRY FOR FREE · NO SIGNUP</div>
      </div>
    </div>
  );
}

/* MODAL */
function Modal({title,content,onClose}){
  return(
    <div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div style={{background:"#f5f0eb",borderRadius:20,padding:"40px",maxWidth:560,width:"100%",maxHeight:"80vh",overflowY:"auto",position:"relative"}} onClick={e=>e.stopPropagation()}>
        <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"rgba(0,0,0,0.08)",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:300,fontSize:32,color:"#0a0a0a",marginBottom:20}}>{title}</h2>
        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"rgba(0,0,0,0.55)",lineHeight:1.8}}>{content}</div>
      </div>
    </div>
  );
}

/* MAIN */
export default function LandingPage2(){
  const navigate=useNavigate();
  /* Intro state */
  const [alvrynVis,setAlvrynVis]=useState(false);  // ALVRYN zoom-in
  const [tagVis,setTagVis]=useState(false);         // tagline fades in
  const [lifting,setLifting]=useState(false);       // white slides up
  const [navVis,setNavVis]=useState(false);
  const [heroVis,setHeroVis]=useState(false);
  const [introDone,setIntroDone]=useState(false);
  /* Scroll */
  const [scrollY,setScrollY]=useState(0);
  const [navScrolled,setNavScrolled]=useState(false);
  /* Modal */
  const [modal,setModal]=useState(null);

  const goApp=useCallback(()=>navigate(localStorage.getItem("token")?"/ai":"/register"),[navigate]);
  const goSearch=useCallback(()=>navigate(localStorage.getItem("token")?"/search":"/login"),[navigate]);

  /* INTRO SEQUENCE */
  useEffect(()=>{
    const ts=[];
    const T=(fn,ms)=>{const t=setTimeout(fn,ms);ts.push(t);};
    T(()=>setAlvrynVis(true), 300);           // ALVRYN zooms in
    T(()=>setTagVis(true), 1100);             // tagline fades in
    T(()=>{setLifting(true);setNavVis(true);},2600); // white lifts up
    T(()=>setHeroVis(true), 3800);            // hero content appears
    T(()=>setIntroDone(true), 4500);
    return()=>ts.forEach(clearTimeout);
  },[]);

  /* SCROLL */
  useEffect(()=>{
    const fn=()=>{const sy=window.scrollY;setScrollY(sy);setNavScrolled(sy>80);};
    window.addEventListener("scroll",fn,{passive:true});
    return()=>window.removeEventListener("scroll",fn);
  },[]);

  const parallax=-scrollY*0.22;

  const PRIVACY=`Alvryn collects only the information necessary to provide travel planning services. We do not sell your data to third parties. Trip plans you create are stored securely and used only to improve your experience. You may request deletion of your data at any time by contacting us at privacy@alvryn.in. We use industry-standard encryption for all data in transit and at rest. Cookies are used solely for session management and service improvement.`;
  const TERMS=`By using Alvryn and ALVI, you agree to use our services for lawful travel planning purposes only. We are not responsible for bookings made through third-party partners (Aviasales, RedBus, Booking.com, IRCTC). Alvryn acts as an AI travel planning assistant and not as a travel agency. Prices shown are indicative and subject to availability. Free plan limits apply as described. We reserve the right to modify services with reasonable notice. Disputes shall be governed under Indian law.`;
  const ABOUT=`Alvryn is India's first AI-powered travel planning platform, built in Bangalore by a team obsessed with making travel accessible, intelligent, and effortless. Our AI assistant ALVI understands your trip requirements in plain language and plans complete journeys — flights, hotels, transfers and itineraries — in seconds. We believe everyone deserves to explore the world beyond what they know. Alvryn is free to use. We earn a small commission from booking partners when you book through our links, at no extra cost to you.`;

  return(
    <>
      <style>{CSS}</style>
      {heroVis&&<Particles/>}

      {/* MODAL */}
      {modal&&<Modal title={modal.title} content={modal.content} onClose={()=>setModal(null)}/>}

      {/* ══════════════════════════════════════
          WHITE INTRO CURTAIN
          ALVRYN zooms in → white slides UP
      ══════════════════════════════════════ */}
      <div style={{
        position:"fixed",inset:0,zIndex:100,
        background:"#ffffff",
        transform:lifting?"translateY(-100%)":"translateY(0%)",
        transition:lifting?"transform 1.8s cubic-bezier(0.76,0,0.24,1)":"none",
        pointerEvents:introDone?"none":"all",
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:0,
      }}>
        {/* ALVRYN — whole word, zoom-in animation — PERFECTLY CENTERED */}
        <div style={{
          fontFamily:"'Cormorant Garamond',serif",
          fontWeight:300,
          fontSize:"clamp(56px,10vw,128px)",
          letterSpacing:"0.4em",
          color:"#0a0a0a",
          textAlign:"center",
          lineHeight:1,
          /* Fix centering: compensate letter-spacing on last char */
          paddingLeft:"0.4em",
          opacity:alvrynVis?1:0,
          transform:alvrynVis?"scale(1)":"scale(0.92)",
          transition:"opacity 0.9s cubic-bezier(0.22,1,0.36,1), transform 0.9s cubic-bezier(0.22,1,0.36,1)",
        }}>
          ALVRYN
        </div>
        {/* Tagline */}
        <div style={{
          fontFamily:"'DM Sans',sans-serif",fontWeight:300,
          fontSize:"clamp(10px,1.2vw,13px)",
          color:"rgba(0,0,0,0.28)",letterSpacing:"0.32em",
          textAlign:"center",
          marginTop:20,
          opacity:tagVis?1:0,
          transition:"opacity 0.8s ease",
        }}>TRAVEL BEYOND BOUNDARIES</div>
      </div>

      {/* ══════════════════════════════════════
          NAVBAR — ALVRYN centered like Dune
      ══════════════════════════════════════ */}
      <nav style={{
        position:"fixed",top:0,left:0,right:0,zIndex:200,height:64,
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"0 5%",
        background:navScrolled?"rgba(8,5,4,0.92)":"transparent",
        backdropFilter:navScrolled?"blur(24px)":"none",
        borderBottom:navScrolled?"1px solid rgba(255,255,255,0.04)":"none",
        transition:"all 0.5s ease",
        opacity:navVis?1:0,
        transform:navVis?"translateY(0)":"translateY(-10px)",
        pointerEvents:navVis?"all":"none",
      }}>
        {/* Left: nav links */}
        <div className="hide-m" style={{display:"flex",gap:28,flex:1}}>
          {[["About","#s-dream"],["ALVI","#s-alvi"],["Destinations","#s-dest"]].map(([l,h])=>(
            <a key={l} href={h} style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"rgba(255,255,255,0.45)",textDecoration:"none",letterSpacing:"0.03em",transition:"color 0.2s"}} onMouseEnter={e=>e.target.style.color="#fff"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,0.45)"}>{l}</a>
          ))}
        </div>
        {/* Center: ALVRYN brand — absolutely centered */}
        <div className="nb-center" style={{position:"absolute",left:"50%",transform:"translateX(-50%)",display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}>
          <AlvrynMark size={22} glow/>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:300,fontSize:15,color:"#fff",letterSpacing:"0.22em"}}>ALVRYN</span>
        </div>
        {/* Right: CTAs */}
        <div style={{display:"flex",gap:10,flex:1,justifyContent:"flex-end"}}>
          <button onClick={goSearch} className="btn-outline hide-m" style={{padding:"8px 18px",fontSize:13}}>Sign In</button>
          <button onClick={goApp} className="btn-primary" style={{padding:"9px 20px",fontSize:13}}>Try ALVI Free</button>
        </div>
      </nav>

      {/* ══════════════════════════════════════
          HERO — left headline + right ALVI chat
      ══════════════════════════════════════ */}
      <section style={{
        minHeight:"100vh",position:"relative",overflow:"hidden",
        background:"linear-gradient(160deg,#0a0604 0%,#160a04 30%,#2d1408 60%,#8B3A0F 80%,rgba(201,168,76,0.25) 100%)",
        display:"flex",flexDirection:"column",
      }}>
        {/* Atmospheric glow */}
        <div style={{position:"absolute",left:"50%",top:"45%",transform:"translate(-50%,-50%)",width:"80%",height:"65%",background:"radial-gradient(ellipse,rgba(201,168,76,0.16) 0%,rgba(139,58,15,0.1) 40%,transparent 70%)",animation:"hPulse 7s ease-in-out infinite",pointerEvents:"none"}}/>
        {/* Clouds */}
        {[{w:640,h:200,t:"10%",l:"-10%",bl:60,op:0.048,a:"cd1",d:"92s"},{w:440,h:160,t:"20%",l:"60%",bl:45,op:0.065,a:"cd2",d:"76s"},{w:720,h:190,t:"30%",l:"5%",bl:62,op:0.038,a:"cd3",d:"118s"}].map((cl,i)=>(
          <div key={i} style={{position:"absolute",top:cl.t,left:cl.l,width:cl.w,height:cl.h,borderRadius:"50%",background:"rgba(255,255,255,0.88)",filter:"blur("+cl.bl+"px)",opacity:cl.op,animation:cl.a+" "+cl.d+" linear infinite"}}/>
        ))}
        {/* Ground grid */}
        <div style={{position:"absolute",bottom:0,left:"-20%",right:"-20%",height:"32%",backgroundImage:"repeating-linear-gradient(0deg,rgba(201,168,76,0.05) 0px,rgba(201,168,76,0.05) 1px,transparent 1px,transparent 44px),repeating-linear-gradient(90deg,rgba(201,168,76,0.02) 0px,rgba(201,168,76,0.02) 1px,transparent 1px,transparent 110px)",transform:"perspective(640px) rotateX(68deg)",transformOrigin:"50% 100%",pointerEvents:"none",backgroundPositionY:(scrollY*0.3)+"px"}}/>
        {/* Ghost brand name — Mirelle style */}
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%) translateY("+(parallax*0.15)+"px)",fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:"clamp(80px,17vw,260px)",color:"rgba(255,255,255,0.035)",letterSpacing:"0.08em",whiteSpace:"nowrap",pointerEvents:"none",userSelect:"none",lineHeight:1}}>ALVRYN</div>

        {/* Hero content — 2 columns */}
        <div style={{
          position:"relative",zIndex:5,flex:1,
          display:"grid",gridTemplateColumns:"1fr 1fr",gap:40,
          alignItems:"center",
          padding:"120px 6% 60px",
        }} className="g2">

          {/* LEFT — headline + CTA */}
          <div>
            <div style={{opacity:heroVis?1:0,transform:heroVis?"translateY(0)":"translateY(20px)",transition:"opacity 0.8s 0.1s ease,transform 0.8s 0.1s ease",marginBottom:28}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"7px 18px",borderRadius:100,border:"1px solid rgba(201,168,76,0.3)",background:"rgba(201,168,76,0.07)",marginBottom:28}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:G,animation:"hPulse 2s infinite",display:"inline-block"}}/>
                <span style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:G,letterSpacing:"0.2em"}}>INTRODUCING ALVI — AI TRAVEL</span>
              </div>
              <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:200,fontSize:"clamp(48px,6.5vw,100px)",color:"#fff",lineHeight:0.95,letterSpacing:"-0.02em"}}>
                Turn dreams<br/><span className="g-text">into journeys.</span>
              </h1>
            </div>
            <div style={{opacity:heroVis?1:0,transform:heroVis?"translateY(0)":"translateY(16px)",transition:"opacity 0.9s 0.35s ease,transform 0.9s 0.35s ease",marginBottom:36}}>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"clamp(15px,1.6vw,18px)",color:"rgba(255,255,255,0.45)",lineHeight:1.7,maxWidth:460}}>
                <TypeWriter phrases={[
                  "Flights. Hotels. Itineraries. In one message.",
                  "Plan Goa for 6 friends in 30 seconds.",
                  "Your complete trip. Planned instantly.",
                  "Budget travel or luxury — ALVI knows both.",
                  "WhatsApp, web or app. ALVI is everywhere.",
                ]}/>
              </p>
            </div>
            <div style={{opacity:heroVis?1:0,transform:heroVis?"translateY(0)":"translateY(12px)",transition:"opacity 0.9s 0.55s ease,transform 0.9s 0.55s ease",display:"flex",gap:14,flexWrap:"wrap",alignItems:"center",marginBottom:56}}>
              <button onClick={goApp} className="btn-primary" style={{fontSize:16,padding:"17px 44px"}}>Try ALVI Free</button>
              <button onClick={goSearch} className="btn-outline" style={{fontSize:16,padding:"16px 36px"}}>Explore Destinations</button>
            </div>
            {/* Stats */}
            <div style={{opacity:heroVis?1:0,transition:"opacity 0.9s 0.75s ease",display:"flex",gap:36,flexWrap:"wrap"}}>
              {[["500+","Destinations"],["60s","AI Response"],["₹0","To Start"]].map(([n,l])=>(
                <div key={l}>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:30,color:G}}>{n}</div>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"rgba(255,255,255,0.32)",letterSpacing:"0.12em",marginTop:2}}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — ALVI mini chat */}
          <div style={{padding:"20px 0"}}>
            <MiniAlviChat visible={heroVis} onTry={goApp}/>
          </div>
        </div>

        {/* D R E A M — spread at bottom, Dune style — NO scroll indicator overlap */}
        <div style={{
          position:"relative",zIndex:5,
          display:"flex",justifyContent:"space-between",
          padding:"0 4% 1.5%",
          opacity:heroVis?1:0,
          transition:"opacity 1.2s 1s ease",
          pointerEvents:"none",
        }}>
          {"DREAM".split("").map((l,i)=>(
            <span key={l+i} style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:200,fontSize:"clamp(44px,7vw,110px)",color:"rgba(255,255,255,0.065)",lineHeight:1}}>{l}</span>
          ))}
        </div>

        {/* Bottom fade */}
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:100,background:"linear-gradient(transparent,#0c0804)",pointerEvents:"none"}}/>
      </section>

      {/* ══════════════════════════════════════
          SECTION 2 — DREAM + ALVRYN STORY
          Warm cream — Apple feel
      ══════════════════════════════════════ */}
      <Divider from="#0c0804" to="#f5f0eb"/>
      <section id="s-dream" style={{background:"#f5f0eb",padding:"120px 6%",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:"clamp(80px,15vw,220px)",color:"rgba(0,0,0,0.022)",letterSpacing:"-0.04em",whiteSpace:"nowrap",pointerEvents:"none",userSelect:"none"}}>DREAM</div>
        <div style={{maxWidth:1100,margin:"0 auto",position:"relative",zIndex:2}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:80,alignItems:"center"}} className="g2">
            <div>
              <Reveal>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:GD,letterSpacing:"0.22em",marginBottom:20}}>THE ALVRYN PHILOSOPHY</div>
                <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:200,fontSize:"clamp(36px,4.5vw,64px)",color:"#0a0a0a",lineHeight:1.05,marginBottom:28}}>
                  Most people never go<br/>beyond what they know.
                </h2>
                <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:16,color:"rgba(0,0,0,0.48)",lineHeight:1.85,maxWidth:420,marginBottom:36}}>
                  Every great journey starts as an impossible idea. The world is full of people who say "one day." ALVI exists for the ones who say "this year."
                </p>
              </Reveal>
              <Reveal delay={150}>
                <div style={{display:"flex",flexDirection:"column",gap:0}}>
                  {[
                    {n:"01",t:"You imagine the trip",d:"Goa. Bali. Switzerland. The northern lights. Anywhere at all."},
                    {n:"02",t:"ALVI makes it real",d:"Flights, hotels, cabs, itinerary — one message. Seconds."},
                    {n:"03",t:"You live the dream",d:"No tab overload. No spreadsheets. Just you and the journey."},
                  ].map((f,i)=>(
                    <div key={i} style={{display:"flex",gap:24,padding:"24px 0",borderBottom:"1px solid rgba(0,0,0,0.07)"}}>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:200,fontSize:36,color:"rgba(0,0,0,0.12)",lineHeight:1,flexShrink:0,width:40}}>{f.n}</div>
                      <div>
                        <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:15,color:"#0a0a0a",marginBottom:5}}>{f.t}</div>
                        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"rgba(0,0,0,0.44)",lineHeight:1.65}}>{f.d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
            <Reveal direction="right" delay={100}>
              <div style={{position:"relative"}}>
                <div style={{background:"#0a0604",borderRadius:24,padding:"48px 40px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:"-20px",left:"-10px",fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:120,color:"rgba(201,168,76,0.06)",lineHeight:1,pointerEvents:"none"}}>"</div>
                  <div style={{position:"relative",zIndex:2}}>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:200,fontSize:"clamp(22px,2.8vw,34px)",color:"#fff",lineHeight:1.38,marginBottom:28,fontStyle:"italic"}}>
                      "The world is bigger than your comfort zone. You were made to explore it."
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <div style={{width:28,height:1,background:G}}/>
                      <span style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"rgba(201,168,76,0.65)",letterSpacing:"0.15em"}}>ALVRYN PHILOSOPHY</span>
                    </div>
                  </div>
                </div>
                {/* Floating stat card */}
                <div style={{position:"absolute",bottom:-22,right:-22,background:"#ffffff",borderRadius:16,padding:"18px 22px",boxShadow:"0 20px 60px rgba(0,0,0,0.12)",border:"1px solid rgba(0,0,0,0.06)"}}>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:34,color:GD}}><Counter end={50000} suffix="+" /></div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"rgba(0,0,0,0.38)",marginTop:2}}>Trips planned by ALVI</div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          SECTION 3 — ALVI DEMO
          Deep purple, cinematic
      ══════════════════════════════════════ */}
      <Divider from="#f5f0eb" to="#100818"/>
      <section id="s-alvi" style={{background:"#100818",padding:"120px 6%",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 28% 50%,rgba(100,55,180,0.22) 0%,transparent 60%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:"clamp(80px,16vw,230px)",color:"rgba(255,255,255,0.012)",letterSpacing:"-0.04em",whiteSpace:"nowrap",pointerEvents:"none",userSelect:"none"}}>ALVI</div>
        <div style={{maxWidth:1100,margin:"0 auto",position:"relative",zIndex:2}}>
          <Reveal style={{marginBottom:64,textAlign:"center"}}>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"rgba(180,140,255,0.75)",letterSpacing:"0.22em",marginBottom:16}}>THE INTELLIGENCE</div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:200,fontSize:"clamp(32px,4.5vw,64px)",color:"#fff",lineHeight:1.1}}>
              One message.<br/><span style={{color:"#b085ff"}}>Your entire journey planned.</span>
            </h2>
          </Reveal>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:56,alignItems:"flex-start"}} className="g2">
            <Reveal direction="left">
              <div style={{borderRadius:24,overflow:"hidden",border:"1px solid rgba(255,255,255,0.06)",background:"rgba(0,0,0,0.48)",backdropFilter:"blur(20px)"}}>
                <div style={{background:"linear-gradient(135deg,rgba(100,55,180,0.3),rgba(201,168,76,0.1))",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"16px 20px",display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#6040b0,#c9a84c)",display:"flex",alignItems:"center",justifyContent:"center"}}><AlvrynMark size={20} glow/></div>
                  <div>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:14,color:"#fff"}}>ALVI</div>
                    <div style={{fontSize:11,color:"#22c55e",display:"flex",alignItems:"center",gap:4}}><span style={{width:5,height:5,borderRadius:"50%",background:"#22c55e",display:"inline-block"}}/>by Alvryn · Online</div>
                  </div>
                </div>
                <div style={{padding:"20px",display:"flex",flexDirection:"column",gap:12}}>
                  {[
                    {role:"user",text:"6 friends Bangalore to Goa in August. Budget 15k per person. Two vegetarians. One arrives a day late. Prefer beaches."},
                    {role:"ai",text:"Perfect! Planning this right now for all 6 of you."},
                    {role:"ai",text:"Flights BLR to GOI: 3500-4500 per person return. Book 4-6 weeks early for best fares. For 6 total: 21000-27000."},
                    {role:"ai",text:"South Goa near Palolem and Agonda. Budget 800-1800 per room. Veg restaurants specifically picked. Late arrival has separate plan.",card:true},
                  ].map((m,i)=>(
                    <Reveal key={i} delay={i*200}>
                      <div style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                        <div style={{maxWidth:"87%",padding:"12px 16px",borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",background:m.role==="user"?"linear-gradient(135deg,#6040b0,#c9a84c)":"rgba(255,255,255,0.06)",border:m.role==="ai"?"1px solid rgba(255,255,255,0.07)":"none",fontFamily:"'DM Sans',sans-serif",fontSize:13,lineHeight:1.65,color:m.role==="user"?"#fff":"rgba(255,255,255,0.82)",fontWeight:m.role==="user"?600:400}}>
                          {m.text}
                          {m.card&&<div style={{marginTop:10,padding:"10px",background:"rgba(201,168,76,0.1)",borderRadius:8,border:"1px solid rgba(201,168,76,0.24)"}}>
                            <div style={{fontSize:12,color:G,fontWeight:700,marginBottom:6}}>Total: 11500-14500 per person. Within budget.</div>
                            <button onClick={goSearch} style={{background:G,color:"#030303",border:"none",borderRadius:8,padding:"7px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Book Flights</button>
                          </div>}
                        </div>
                      </div>
                    </Reveal>
                  ))}
                </div>
                <div style={{padding:"12px 16px",borderTop:"1px solid rgba(255,255,255,0.04)",display:"flex",gap:8}}>
                  <div style={{flex:1,background:"rgba(255,255,255,0.05)",borderRadius:100,padding:"10px 16px",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"rgba(255,255,255,0.2)"}}>Ask ALVI anything...</div>
                  <button onClick={goApp} style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,#6040b0,#c9a84c)",border:"none",cursor:"pointer",fontSize:16,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}}>↑</button>
                </div>
              </div>
            </Reveal>
            <Reveal direction="right" delay={100}>
              <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:200,fontSize:"clamp(24px,3vw,40px)",color:"#fff",lineHeight:1.2,marginBottom:28}}>Every constraint.<br/><span style={{color:"#b085ff"}}>Understood.</span></h3>
              <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:36}}>
                {[
                  {icon:"👥",t:"Group of 6",d:"Per person and total budget breakdown"},
                  {icon:"🥗",t:"2 Vegetarians",d:"Specific restaurant picks in South Goa"},
                  {icon:"🕐",t:"Late arrival",d:"Separate travel plan auto-created"},
                  {icon:"🏖️",t:"Beaches only",d:"South Goa recommended over North Goa"},
                  {icon:"💰",t:"15k budget",d:"Confirmed: fits at 11500-14500 per person"},
                  {icon:"🛡️",t:"Safety insights",d:"Goa safety tips automatically included"},
                ].map((f,i)=>(
                  <div key={i} style={{display:"flex",gap:12,padding:"12px 14px",borderRadius:12,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.05)",transition:"all 0.3s ease",cursor:"default"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(180,140,255,0.08)";e.currentTarget.style.borderColor="rgba(180,140,255,0.2)";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.03)";e.currentTarget.style.borderColor="rgba(255,255,255,0.05)";}}>
                    <span style={{fontSize:18}}>{f.icon}</span>
                    <div><div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:13,color:"#fff"}}>{f.t}</div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"rgba(255,255,255,0.35)",marginTop:2}}>{f.d}</div></div>
                    <div style={{marginLeft:"auto",alignSelf:"center"}}><div style={{width:5,height:5,borderRadius:"50%",background:"#b085ff"}}/></div>
                  </div>
                ))}
              </div>
              <button onClick={goApp} className="btn-primary" style={{fontSize:15}}>Try ALVI Free →</button>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          SECTION 4 — DESTINATIONS
      ══════════════════════════════════════ */}
      <Divider from="#100818" to="#0a0604"/>
      <section id="s-dest" style={{background:"#0a0604",padding:"120px 6%",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 0%,rgba(201,168,76,0.07) 0%,transparent 55%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:"clamp(80px,15vw,220px)",color:"rgba(255,255,255,0.012)",letterSpacing:"-0.04em",whiteSpace:"nowrap",pointerEvents:"none",userSelect:"none"}}>WORLD</div>
        <div style={{maxWidth:1100,margin:"0 auto",position:"relative",zIndex:2}}>
          <Reveal style={{textAlign:"center",marginBottom:64}}>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:G,letterSpacing:"0.22em",marginBottom:16}}>THE DESTINATIONS</div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:200,fontSize:"clamp(32px,4.5vw,64px)",color:"#fff",lineHeight:1.1}}>The world is waiting.<br/><span className="g-text">Tell ALVI where.</span></h2>
          </Reveal>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:14}}>
            {[{n:"Goa",t:"Beaches",b:"5k-15k",i:"photo-1512343879784-a960bf40e7f2"},{n:"Dubai",t:"Global",b:"35k-70k",i:"photo-1512453979798-5ea266f8880c"},{n:"Manali",t:"Hills",b:"8k-18k",i:"photo-1626621341517-bbf3d9990a23"},{n:"Singapore",t:"City",b:"40k-80k",i:"photo-1525625293386-3f8f99389edd"},{n:"Bali",t:"Tropical",b:"25k-55k",i:"photo-1537996194471-e657df975ab4"},{n:"Switzerland",t:"Alps",b:"80k-1.5L",i:"photo-1530122037265-a5f1f91d3b99"},{n:"Maldives",t:"Luxury",b:"40k-1L",i:"photo-1514282401047-d79a71a590e8"},{n:"Japan",t:"Culture",b:"60k-1.2L",i:"photo-1528360983277-13d401cdc186"},{n:"Kerala",t:"Nature",b:"10k-25k",i:"photo-1602216056096-3b40cc0c9944"},{n:"Ladakh",t:"Adventure",b:"18k-35k",i:"photo-1592555187028-51a64e5bba29"},{n:"Paris",t:"Romance",b:"80k-1.5L",i:"photo-1502602898657-3e91760cbb34"},{n:"Bangkok",t:"Culture",b:"20k-45k",i:"photo-1563492065599-3520f775eeed"}].map((d,i)=>(
              <Reveal key={d.n} delay={i*38}>
                <div onClick={()=>navigate(localStorage.getItem("token")?"/ai?dest="+d.n:"/register")} className="lift" style={{borderRadius:18,overflow:"hidden",cursor:"pointer",position:"relative",aspectRatio:"2/3"}}>
                  <img src={"https://images.unsplash.com/"+d.i+"?auto=format&fit=crop&w=400&h=600&q=70"} alt={d.n} loading="lazy" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} onError={e=>e.target.style.display="none"}/>
                  <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.9) 0%,rgba(0,0,0,0.2) 50%,rgba(0,0,0,0.05) 100%)"}}/>
                  <div style={{position:"absolute",top:10,right:10,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(8px)",borderRadius:100,padding:"3px 10px",fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"rgba(255,255,255,0.75)"}}>{d.t}</div>
                  <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"14px"}}>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:20,color:"#fff"}}>{d.n}</div>
                    <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:G,marginTop:3}}>{d.b}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal style={{textAlign:"center",marginTop:48}}>
            <button onClick={goApp} className="btn-outline">Plan any destination with ALVI</button>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════
          SECTION 5 — PLANS
          Off-white premium
      ══════════════════════════════════════ */}
      <Divider from="#0a0604" to="#f2eee8"/>
      <section id="s-plans" style={{background:"#f2eee8",padding:"120px 6%",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:"clamp(70px,14vw,200px)",color:"rgba(0,0,0,0.022)",letterSpacing:"-0.04em",whiteSpace:"nowrap",pointerEvents:"none",userSelect:"none"}}>PLANS</div>
        <div style={{maxWidth:1000,margin:"0 auto",position:"relative",zIndex:2}}>
          <Reveal style={{textAlign:"center",marginBottom:60}}>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:GD,letterSpacing:"0.22em",marginBottom:16}}>CHOOSE YOUR PLAN</div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:200,fontSize:"clamp(32px,4.5vw,64px)",color:"#0a0a0a",lineHeight:1.1}}>Start free.<br/><span className="g-text">Upgrade when ready.</span></h2>
          </Reveal>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20}} className="g3">
            {[
              {name:"Explorer",badge:"FREE · LIVE",active:true,desc:"Everything to start your journey",features:["20 AI responses per day","2 complete trip plans per month","Flights, buses and hotels","Safety insights auto-included","WhatsApp ALVI access"],cta:"Start Free"},
              {name:"Navigator",badge:"PRO",active:false,desc:"For the serious traveller",features:["Unlimited trip plans","Advanced AI planning","Budget optimizer","Multi-city planning","Priority responses","Trip history"],cta:"Coming Soon"},
              {name:"Voyager",badge:"PREMIUM",active:false,desc:"The ultimate companion",features:["Everything in Navigator","Group travel planner","Scam protection alerts","Women traveller mode","Emergency companion","Real-time weather"],cta:"Coming Soon"},
            ].map((p,i)=>(
              <Reveal key={p.name} delay={i*120}>
                <div style={{borderRadius:24,overflow:"hidden",height:"100%",position:"relative",background:p.active?"#0a0604":"rgba(0,0,0,0.04)",border:p.active?"none":"1px solid rgba(0,0,0,0.08)",boxShadow:p.active?"0 40px 100px rgba(10,6,4,0.22)":"none"}}>
                  {p.active&&<div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,"+GD+","+G+","+GL+")"}}/>}
                  <div style={{padding:"36px 28px"}}>
                    {p.active&&<div style={{display:"inline-block",background:G,color:"#030303",padding:"3px 14px",borderRadius:100,fontFamily:"'Space Mono',monospace",fontSize:9,fontWeight:700,letterSpacing:"0.08em",marginBottom:16,whiteSpace:"nowrap"}}>LIVE NOW</div>}
                    {!p.active&&<div style={{height:28,marginBottom:16}}/>}
                    <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:p.active?"rgba(201,168,76,0.65)":"rgba(0,0,0,0.32)",letterSpacing:"0.2em",marginBottom:8}}>{p.badge}</div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:26,color:p.active?"#fff":"#0a0a0a",marginBottom:6}}>Alvryn {p.name}</div>
                    <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:p.active?"rgba(255,255,255,0.4)":"rgba(0,0,0,0.4)",marginBottom:24}}>{p.desc}</p>
                    <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:28}}>
                      {p.features.map(f=>(
                        <div key={f} style={{display:"flex",gap:10,alignItems:"center"}}>
                          <span style={{color:p.active?G:GD,fontSize:10,flexShrink:0}}>✦</span>
                          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:p.active?"rgba(255,255,255,0.7)":"rgba(0,0,0,0.6)"}}>{f}</span>
                        </div>
                      ))}
                    </div>
                    {p.active?<button onClick={goApp} className="btn-primary" style={{width:"100%",justifyContent:"center"}}>{p.cta}</button>:<div style={{padding:"12px",borderRadius:12,border:"1px solid rgba(0,0,0,0.1)",textAlign:"center"}}><div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:"rgba(0,0,0,0.28)",letterSpacing:"0.1em"}}>Coming soon</div></div>}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════ */}
      <Divider from="#f2eee8" to="#020202"/>
      <section style={{minHeight:"80vh",background:"#020202",display:"flex",alignItems:"center",justifyContent:"center",padding:"120px 6%",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 50%,rgba(201,168,76,0.1) 0%,transparent 60%)",pointerEvents:"none"}}/>
        <div style={{position:"relative",zIndex:2,textAlign:"center",maxWidth:760}}>
          <Reveal>
            <div style={{animation:"floatY 5s ease-in-out infinite",marginBottom:32,display:"inline-block"}}><AlvrynMark size={52} glow/></div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:200,fontSize:"clamp(44px,7.5vw,98px)",color:"#fff",lineHeight:0.95,letterSpacing:"-0.02em",marginBottom:24}}>
              Your next trip is<br/><span className="g-text">one message away.</span>
            </h2>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:18,color:"rgba(255,255,255,0.3)",lineHeight:1.7,maxWidth:440,margin:"0 auto 48px"}}>{"Try ALVI. India's most intelligent travel companion. Free forever."}</p>
            <div style={{display:"flex",gap:16,justifyContent:"center",flexWrap:"wrap"}}>
              <button onClick={goApp} className="btn-primary" style={{fontSize:16,padding:"18px 52px"}}>Try ALVI Free</button>
              <button onClick={goSearch} className="btn-outline" style={{fontSize:16,padding:"17px 36px"}}>Search Destinations</button>
            </div>
            <div style={{marginTop:40,fontFamily:"'Space Mono',monospace",fontSize:9,color:"rgba(255,255,255,0.1)",letterSpacing:"0.22em"}}>NO CREDIT CARD · FREE FOREVER · TRUSTED BOOKING PARTNERS</div>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{background:"#010101",borderTop:"1px solid rgba(255,255,255,0.04)",padding:"44px 6%"}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:20}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <AlvrynMark size={24}/>
            <span style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:300,fontSize:14,color:"rgba(255,255,255,0.35)",letterSpacing:"0.18em"}}>ALVRYN</span>
          </div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"rgba(255,255,255,0.15)"}}>© Alvryn Technologies · Travel Beyond Boundaries</div>
          <div style={{display:"flex",gap:20}}>
            <span onClick={()=>setModal({title:"About Alvryn",content:ABOUT})} style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"rgba(255,255,255,0.22)",cursor:"pointer",transition:"color 0.2s"}} onMouseEnter={e=>e.target.style.color="rgba(255,255,255,0.65)"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,0.22)"}>About</span>
            <span onClick={()=>setModal({title:"Privacy Policy",content:PRIVACY})} style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"rgba(255,255,255,0.22)",cursor:"pointer",transition:"color 0.2s"}} onMouseEnter={e=>e.target.style.color="rgba(255,255,255,0.65)"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,0.22)"}>Privacy</span>
            <span onClick={()=>setModal({title:"Terms of Use",content:TERMS})} style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"rgba(255,255,255,0.22)",cursor:"pointer",transition:"color 0.2s"}} onMouseEnter={e=>e.target.style.color="rgba(255,255,255,0.65)"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,0.22)"}>Terms</span>
            <a href="mailto:hello@alvryn.in" style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"rgba(255,255,255,0.22)",textDecoration:"none",transition:"color 0.2s"}} onMouseEnter={e=>e.target.style.color="rgba(255,255,255,0.65)"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,0.22)"}>Contact</a>
          </div>
        </div>
      </footer>
    </>
  );
}