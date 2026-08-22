/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

/* ─── BRAND TOKENS ──────────────────────────────────────────────────────────── */
const G  = "#c9a84c";
const GD = "#8B6914";
const GL = "#f0d080";
const SP  = "#8b6bbf";   // Solace purple
const SPD = "#5c3d9e";
const SPL = "#c4a8f0";

/* ─── CSS ────────────────────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,200;0,300;0,400;0,600;1,200;1,300&family=DM+Sans:wght@200;300;400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{overflow-x:hidden;scroll-behavior:smooth;}
body{overflow-x:hidden;background:#050505;font-family:'DM Sans',sans-serif;}
::-webkit-scrollbar{width:2px;}
::-webkit-scrollbar-thumb{background:#c9a84c55;border-radius:2px;}
@keyframes gs{0%{background-position:200% center;}100%{background-position:-200% center;}}
@keyframes fp{0%,100%{opacity:0.7;}50%{opacity:1;}}
@keyframes floatY{0%,100%{transform:translateY(0);}50%{transform:translateY(-10px);}}
@keyframes fadeUp{from{opacity:0;transform:translateY(32px);}to{opacity:1;transform:translateY(0);}}
@keyframes spinSlow{to{transform:rotate(360deg);}}
@keyframes lineGrow{from{transform:scaleX(0);}to{transform:scaleX(1);}}
@keyframes blink{0%,100%{opacity:1;}50%{opacity:0;}}
@keyframes modalIn{from{opacity:0;transform:translateY(20px) scale(0.98);}to{opacity:1;transform:translateY(0) scale(1);}}
.g-text{color:#c9a84c;}
.s-text{color:rgba(255,255,255,0.55);}
.reveal{opacity:0;transform:translateY(44px);transition:opacity 1s cubic-bezier(0.22,1,0.36,1),transform 1.1s cubic-bezier(0.22,1,0.36,1);}
.reveal.vis{opacity:1;transform:translateY(0);}
.reveal-l{opacity:0;transform:translateX(-56px);transition:opacity 1s cubic-bezier(0.22,1,0.36,1),transform 1.1s cubic-bezier(0.22,1,0.36,1);}
.reveal-l.vis{opacity:1;transform:translateX(0);}
.reveal-r{opacity:0;transform:translateX(56px);transition:opacity 1s cubic-bezier(0.22,1,0.36,1),transform 1.1s cubic-bezier(0.22,1,0.36,1);}
.reveal-r.vis{opacity:1;transform:translateX(0);}
@media(max-width:860px){.hide-m{display:none!important;}.grid2{grid-template-columns:1fr!important;}.grid3{grid-template-columns:1fr!important;}}
`;

/* ─── COMPANY MARK (two bars + double ring) ─────────────────────────────────── */
function AlvrynMark({size=44,glow=false}){
  const s=size,cx=s*0.5,cy=s*0.5,R1=s*0.47,R2=s*0.40,sw=s*0.10,id="am"+s;
  const lx1=cx-s*0.03,ly1=cy-s*0.27,lx2=cx-s*0.21,ly2=cy+s*0.30;
  const rx1=cx+s*0.05,ry1=cy-s*0.27,rx2=cx+s*0.21,ry2=cy+s*0.30;
  return(
    <svg width={s} height={s} viewBox={"0 0 "+s+" "+s} fill="none"
      style={{filter:glow?"drop-shadow(0 0 "+(s*0.16)+"px rgba(201,168,76,0.75))":"none",flexShrink:0}}>
      <defs>
        <radialGradient id={id+"g"} cx="50%" cy="42%" r="48%"><stop offset="0%" stopColor="#f0d080" stopOpacity="0.5"/><stop offset="100%" stopColor="#c9a84c" stopOpacity="0"/></radialGradient>
        <linearGradient id={id+"l"} x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#6B5010" stopOpacity="0.85"/><stop offset="38%" stopColor="#f0d080" stopOpacity="1"/><stop offset="100%" stopColor="#a07820" stopOpacity="0.8"/></linearGradient>
        <linearGradient id={id+"r"} x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#c9a84c" stopOpacity="0.85"/><stop offset="100%" stopColor="#5a4010" stopOpacity="0.65"/></linearGradient>
        <linearGradient id={id+"k"} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#f0d080" stopOpacity="0.9"/><stop offset="100%" stopColor="#8B6914" stopOpacity="0.7"/></linearGradient>
        <radialGradient id={id+"d"} cx="35%" cy="35%" r="65%"><stop offset="0%" stopColor="#f0d080"/><stop offset="100%" stopColor="#7a5a10" stopOpacity="0.9"/></radialGradient>
      </defs>
      <circle cx={cx} cy={cy*0.88} r={R2*0.68} fill={"url(#"+id+"g)"}/>
      <circle cx={cx} cy={cy} r={R1} stroke={"url(#"+id+"k)"} strokeWidth={s*0.008} fill="none"/>
      <circle cx={cx} cy={cy} r={R2} stroke={"url(#"+id+"k)"} strokeWidth={s*0.005} fill="none" opacity="0.5"/>
      <line x1={lx1} y1={ly1} x2={lx2} y2={ly2} stroke={"url(#"+id+"l)"} strokeWidth={sw} strokeLinecap="round"/>
      <line x1={rx1} y1={ry1} x2={rx2} y2={ry2} stroke={"url(#"+id+"r)"} strokeWidth={sw*0.88} strokeLinecap="round"/>
      <circle cx={cx-s*0.01} cy={cy+s*0.01} r={s*0.048} fill={"url(#"+id+"d)"}/>
      <circle cx={cx-s*0.022} cy={cy-s*0.01} r={s*0.022} fill="#fff" opacity="0.42"/>
    </svg>
  );
}

/* ─── ALVRYN GO ICON — compass globe, minimal ────────────────────────────────── */
function AlvrynGoIcon({size=64}){
  const s=size;
  return(
    <svg width={s} height={s} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="goi1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f0d080"/>
          <stop offset="50%" stopColor="#c9a84c"/>
          <stop offset="100%" stopColor="#8B6914"/>
        </linearGradient>
        <radialGradient id="goig" cx="35%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#f0d080" stopOpacity="0.18"/>
          <stop offset="100%" stopColor="#c9a84c" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="goi2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f0d080" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#8B6914" stopOpacity="0.7"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#goig)"/>
      <circle cx="50" cy="50" r="44" stroke="url(#goi2)" strokeWidth="0.8" fill="none"/>
      <ellipse cx="50" cy="50" rx="28" ry="28" stroke="url(#goi1)" strokeWidth="0.6" fill="none" opacity="0.35"/>
      <ellipse cx="50" cy="50" rx="28" ry="11" stroke="url(#goi1)" strokeWidth="0.5" fill="none" opacity="0.25"/>
      <line x1="22" y1="50" x2="78" y2="50" stroke="url(#goi1)" strokeWidth="0.5" opacity="0.25"/>
      <line x1="50" y1="22" x2="50" y2="78" stroke="url(#goi1)" strokeWidth="0.5" opacity="0.25"/>
      <polygon points="50,28 46.5,52 50,49 53.5,52" fill="url(#goi1)"/>
      <polygon points="50,72 46.5,48 50,51 53.5,48" fill="#8B6914" opacity="0.45"/>
      <circle cx="50" cy="50" r="3.2" fill="url(#goi1)"/>
      <circle cx="49" cy="49" r="1.4" fill="#fff" opacity="0.55"/>
      <circle cx="50" cy="50" r="36" stroke="url(#goi2)" strokeWidth="0.5" fill="none" opacity="0.4"/>
    </svg>
  );
}

/* ─── ALVRYN SOLACE ICON — wave & presence, minimal ────────────────────────── */
function AlvrynSolaceIcon({size=64}){
  const s=size;
  return(
    <svg width={s} height={s} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="si1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c4a8f0"/>
          <stop offset="50%" stopColor="#8b6bbf"/>
          <stop offset="100%" stopColor="#5c3d9e"/>
        </linearGradient>
        <radialGradient id="si2" cx="35%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#c4a8f0" stopOpacity="0.16"/>
          <stop offset="100%" stopColor="#8b6bbf" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="si3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c4a8f0" stopOpacity="0.85"/>
          <stop offset="100%" stopColor="#5c3d9e" stopOpacity="0.6"/>
        </linearGradient>
        <linearGradient id="siw" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#c4a8f0" stopOpacity="0"/>
          <stop offset="30%" stopColor="#c4a8f0" stopOpacity="0.9"/>
          <stop offset="70%" stopColor="#8b6bbf" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#5c3d9e" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#si2)"/>
      <circle cx="50" cy="50" r="44" stroke="url(#si3)" strokeWidth="0.8" fill="none"/>
      <circle cx="50" cy="50" r="36" stroke="url(#si3)" strokeWidth="0.5" fill="none" opacity="0.4"/>
      <path d="M 18 50 C 22 50, 24 38, 28 38 C 32 38, 32 62, 36 62 C 40 62, 40 38, 44 38 C 48 38, 48 62, 52 62 C 56 62, 56 44, 58 44 C 60 44, 60 50, 82 50"
        stroke="url(#siw)" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="50" cy="50" r="3.5" fill="url(#si1)"/>
      <circle cx="48.8" cy="48.8" r="1.5" fill="#fff" opacity="0.55"/>
    </svg>
  );
}

/* ─── MODAL ──────────────────────────────────────────────────────────────────── */
function Modal({title,content,onClose}){
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,0.82)",backdropFilter:"blur(12px)",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#0e0c0a",border:"1px solid rgba(201,168,76,0.15)",borderRadius:24,padding:"48px",maxWidth:600,width:"100%",maxHeight:"82vh",overflowY:"auto",position:"relative",animation:"modalIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both"}}>
        <button onClick={onClose} style={{position:"absolute",top:20,right:20,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"50%",width:34,height:34,cursor:"pointer",fontSize:18,color:"rgba(255,255,255,0.4)",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(201,168,76,0.12)";e.currentTarget.style.color=G;}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.06)";e.currentTarget.style.color="rgba(255,255,255,0.4)";}}>×</button>
        <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:9,color:G,letterSpacing:"0.22em",marginBottom:16}}>{title.toUpperCase()}</div>
        <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:300,fontSize:34,color:"#fff",marginBottom:28,lineHeight:1.1}}>{title}</h2>
        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"rgba(255,255,255,0.45)",lineHeight:1.95}}>{content}</div>
      </div>
    </div>
  );
}

/* ─── DIVIDER ────────────────────────────────────────────────────────────────── */
function Div({from,to}){return <div style={{height:80,background:"linear-gradient(180deg,"+from+","+to+")"}}/>;}

/* ─── MAIN ───────────────────────────────────────────────────────────────────── */
export default function AlvrynHomePage(){
  const navigate=useNavigate();
  const [modal,setModal]=useState(null);
  const [navScrolled,setNavScrolled]=useState(false);
  const [menuOpen,setMenuOpen]=useState(false);

  useEffect(()=>{ document.title = "Alvryn — Technology for the Human Experience"; },[]);

  useEffect(()=>{
    const fn=()=>setNavScrolled(window.scrollY>60);
    window.addEventListener("scroll",fn,{passive:true});
    return()=>window.removeEventListener("scroll",fn);
  },[]);

  useEffect(()=>{
    const obs=new IntersectionObserver(entries=>{
      entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add("vis");}});
    },{threshold:0.07});
    document.querySelectorAll(".reveal,.reveal-l,.reveal-r").forEach(el=>obs.observe(el));
    return()=>obs.disconnect();
  },[]);

  const ABOUT=`Alvryn is a technology company focused on building intelligent products that extend what's possible in everyday human experience. We don't build tools. We build companions — for travel, for life, for the moments in between.

Our work begins with a simple question: what does the person on the other side of this screen actually need? That question drives every product decision we make.

Alvryn was founded on the belief that the best technology quietly earns trust. It doesn't demand attention. It doesn't overwhelm with features. It shows up when you need it, understands what you mean, and stays out of the way when you don't.

We are a small team with a long-term vision. We move carefully, build with intention, and measure success by how genuinely useful our products are to the people who use them.`;

  const PRIVACY=`Alvryn is committed to handling your information with the same care we put into every product we build. We collect only what is necessary to provide and improve our services. We do not sell your data, we do not share it with advertisers, and we do not use it to build profiles for third parties.

Information you provide when creating an account is used solely to personalize your experience within Alvryn products. Conversations and trip data are stored securely and are never used to target you with advertising.

You may request access to your data or request its permanent deletion at any time by contacting us at privacy@alvryn.in. We will respond within 30 days. All data in transit and at rest is protected using industry-standard encryption.

We use functional cookies only — for session management and basic analytics that help us understand how to improve our products. We do not use third-party advertising cookies.

This policy applies to all products under the Alvryn umbrella. We will notify you of any material changes via email or in-product notice before they take effect.`;

  const TERMS=`By accessing or using any Alvryn product, you agree to these terms. If you do not agree, please do not use our services.

Alvryn products are designed for personal, lawful use. You may not use our products to engage in illegal activity, harm others, or attempt to reverse-engineer or disrupt our systems.

Alvryn Go connects you with third-party booking partners including Aviasales, RedBus, Booking.com and IRCTC. We act as an AI travel planning assistant, not a travel agency. Prices shown are indicative. Alvryn is not responsible for bookings, cancellations or disputes with third-party partners.

Alvryn Solace is an AI companion product. It is not a substitute for professional mental health care. If you are experiencing a crisis, please contact a qualified professional or emergency services.

Content generated by Alvryn AI products may occasionally be inaccurate. Always verify important information independently. We continuously work to improve accuracy and reliability.

These terms are governed by Indian law. Any disputes shall be resolved under the jurisdiction of Indian courts. We reserve the right to update these terms with reasonable notice.`;

  const CONTACT=`We read every message. Response times are typically within 48 hours.

General enquiries: hello@alvryn.in
Privacy and data: privacy@alvryn.in

We don't have a support phone line. Email is the fastest way to reach us, and it gives us a record of your issue so we can solve it properly.

If you're a journalist, researcher or potential partner, include a brief description of who you are and what you're looking for. We'll get back to you.`;

  return(
    <>
      <style>{CSS}</style>
      {modal&&<Modal title={modal.title} content={modal.content} onClose={()=>setModal(null)}/>}

      {/* ══ NAVBAR ══ */}
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:500,height:62,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 5%",background:navScrolled?"rgba(5,5,5,0.94)":"transparent",backdropFilter:navScrolled?"blur(24px)":"none",borderBottom:navScrolled?"1px solid rgba(255,255,255,0.04)":"none",transition:"all 0.5s ease"}}>
        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}>
          <AlvrynMark size={26} glow/>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:300,fontSize:15,color:"#fff",letterSpacing:"0.22em",lineHeight:1}}>ALVRYN</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:7,color:"rgba(255,255,255,0.25)",letterSpacing:"0.18em"}}>TECHNOLOGIES</div>
          </div>
        </div>
        {/* Center nav */}
        <div className="hide-m" style={{display:"flex",gap:32,alignItems:"center"}}>
          {[["Products","#products"],["About","#about"],["Vision","#vision"]].map(([l,h])=>(
            <a key={l} href={h} style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"rgba(255,255,255,0.38)",textDecoration:"none",letterSpacing:"0.04em",transition:"color 0.2s"}} onMouseEnter={e=>e.target.style.color="#fff"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,0.38)"}>{l}</a>
          ))}
        </div>
        {/* Right CTA */}
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <button onClick={()=>navigate("/go")} style={{padding:"8px 22px",borderRadius:100,background:"linear-gradient(135deg,"+GD+","+G+")",border:"none",color:"#030303",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer",transition:"all 0.3s cubic-bezier(0.34,1.56,0.64,1)"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 12px 30px rgba(201,168,76,0.4)";}} onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";}}>Open Alvryn Go</button>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"radial-gradient(ellipse at 50% 60%,rgba(139,105,20,0.08) 0%,rgba(5,5,5,0) 65%)",position:"relative",overflow:"hidden",padding:"0 6%",textAlign:"center"}}>
        {/* Subtle grid */}
        <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)",backgroundSize:"80px 80px",pointerEvents:"none"}}/>
        {/* Content */}
        <div style={{position:"relative",zIndex:2,maxWidth:820}}>
          <div style={{animation:"fadeUp 0.9s 0.2s both"}}>
            <AlvrynMark size={64} glow/>
          </div>
          <div style={{animation:"fadeUp 0.8s 0.4s both",fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.32)",letterSpacing:"0.24em",marginTop:20,marginBottom:0}}>ALVRYN TECHNOLOGIES</div>
          <h1 style={{animation:"fadeUp 1s 0.5s both",fontFamily:"'Cormorant Garamond',serif",fontWeight:200,fontSize:"clamp(44px,7.5vw,104px)",color:"#fff",lineHeight:0.92,letterSpacing:"-0.02em",marginTop:28,marginBottom:24}}>
            Technology for<br/><span className="g-text">the human experience.</span>
          </h1>
          <p style={{animation:"fadeUp 1s 0.7s both",fontFamily:"'DM Sans',sans-serif",fontWeight:300,fontSize:"clamp(15px,1.8vw,20px)",color:"rgba(255,255,255,0.32)",lineHeight:1.75,maxWidth:560,margin:"0 auto 52px"}}>
            We build intelligent products that change the way people move through the world — and the way they feel within it.
          </p>
          <div style={{animation:"fadeUp 1s 0.85s both",display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap"}}>
            <button onClick={()=>document.getElementById("products").scrollIntoView({behavior:"smooth"})} style={{padding:"15px 38px",borderRadius:100,background:"linear-gradient(135deg,"+GD+","+G+","+GL+")",border:"none",color:"#030303",fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:700,cursor:"pointer",transition:"all 0.4s cubic-bezier(0.34,1.56,0.64,1)"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px) scale(1.03)";e.currentTarget.style.boxShadow="0 20px 50px rgba(201,168,76,0.4)";}} onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow=""}}>Explore products</button>
            <button onClick={()=>setModal({title:"About Alvryn",content:ABOUT})} style={{padding:"14px 36px",borderRadius:100,background:"transparent",border:"1px solid rgba(255,255,255,0.14)",color:"rgba(255,255,255,0.6)",fontFamily:"'DM Sans',sans-serif",fontSize:15,cursor:"pointer",transition:"all 0.3s"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.06)";e.currentTarget.style.color="#fff";}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,0.6)";}}>Our story</button>
          </div>
        </div>

      </section>

      {/* ══ PRODUCTS ══ */}
      <Div from="#050505" to="#0a0a0a"/>
      <section id="products" style={{background:"#0a0a0a",padding:"120px 6%",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 0%,rgba(201,168,76,0.05) 0%,transparent 60%)",pointerEvents:"none"}}/>
        <div style={{maxWidth:1100,margin:"0 auto",position:"relative",zIndex:2}}>
          {/* Header */}
          <div className="reveal" style={{marginBottom:72,maxWidth:580}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:9,color:G,letterSpacing:"0.22em",marginBottom:16}}>OUR PRODUCTS</div>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:200,fontSize:"clamp(32px,5vw,62px)",color:"#fff",lineHeight:1.05}}>Two products.<br/>One mission.</h2>
            <div style={{width:40,height:1,background:G,marginTop:24,animation:"lineGrow 1s 0.5s both"}}/>
          </div>
          {/* Product cards */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}} className="grid2">
            {/* Alvryn Go */}
            <div className="reveal-l" style={{borderRadius:28,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(201,168,76,0.14)",padding:"48px 44px",position:"relative",overflow:"hidden",cursor:"pointer",transition:"all 0.45s cubic-bezier(0.34,1.56,0.64,1)"}} onClick={()=>navigate("/go")} onMouseEnter={e=>{e.currentTarget.style.background="rgba(201,168,76,0.04)";e.currentTarget.style.borderColor="rgba(201,168,76,0.32)";e.currentTarget.style.transform="translateY(-6px)";e.currentTarget.style.boxShadow="0 32px 80px rgba(0,0,0,0.4)";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.02)";e.currentTarget.style.borderColor="rgba(201,168,76,0.14)";e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,rgba(201,168,76,0.5),transparent)"}}/>
              <div style={{position:"absolute",right:40,top:40,opacity:0.07,transform:"scale(2.2)"}}>
                <AlvrynGoIcon size={80}/>
              </div>
              <div style={{marginBottom:28}}><AlvrynGoIcon size={52}/></div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:9,color:G,letterSpacing:"0.2em",marginBottom:12}}>LIVE NOW · TRAVEL</div>
              <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:300,fontSize:"clamp(28px,3.5vw,44px)",color:"#fff",marginBottom:16,lineHeight:1.05}}>Alvryn <span className="g-text">Go</span></h3>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"rgba(255,255,255,0.38)",lineHeight:1.8,marginBottom:36,maxWidth:340}}>AI-powered travel planning. Flights, hotels, trains, buses — planned in one conversation. No tabs. No spreadsheets. Just tell ALVI where you want to go.</p>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:G,fontWeight:600}}>Open Alvryn Go</span>
                <span style={{color:G,fontSize:16}}>→</span>
              </div>
              <div style={{marginTop:32,paddingTop:24,borderTop:"1px solid rgba(201,168,76,0.1)",display:"flex",gap:24}}>
                {[["500+","Destinations"],["60s","AI Response"],["₹0","To Start"]].map(([n,l])=>(
                  <div key={l}>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:22,color:G}}>{n}</div>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:"rgba(255,255,255,0.25)",letterSpacing:"0.08em",marginTop:2}}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Alvryn Solace */}
            <div className="reveal-r" style={{borderRadius:28,background:"rgba(255,255,255,0.015)",border:"1px solid rgba(255,255,255,0.08)",padding:"48px 44px",position:"relative",overflow:"hidden",transition:"all 0.45s cubic-bezier(0.34,1.56,0.64,1)"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.03)";e.currentTarget.style.borderColor="rgba(255,255,255,0.16)";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.015)";e.currentTarget.style.borderColor="rgba(255,255,255,0.08)";}}>
              <div style={{position:"absolute",right:40,top:40,opacity:0.05,transform:"scale(2.2)"}}>
                <AlvrynSolaceIcon size={80}/>
              </div>
              <div style={{marginBottom:28,display:"flex",alignItems:"center",gap:14}}>
                <AlvrynSolaceIcon size={52}/>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.5)",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:100,padding:"4px 14px",letterSpacing:"0.08em"}}>COMING SOON</span>
              </div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:9,color:"rgba(255,255,255,0.32)",letterSpacing:"0.2em",marginBottom:12}}>IN DEVELOPMENT COMPANION AI</div>
              <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:300,fontSize:"clamp(28px,3.5vw,44px)",color:"#fff",marginBottom:16,lineHeight:1.05}}>Alvryn <span className="s-text">Solace</span></h3>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"rgba(255,255,255,0.38)",lineHeight:1.8,marginBottom:36,maxWidth:340}}>An intelligent companion designed for presence, not productivity. Voice conversations, daily check-ins, genuine memory. For the moments when you simply need someone to talk to.</p>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"rgba(255,255,255,0.7)",fontWeight:600}}>Join the waitlist</span>
                <span style={{color:"rgba(255,255,255,0.7)",fontSize:16}}>{String.fromCharCode(8594)}</span>
              </div>
              <div style={{marginTop:32,paddingTop:24,borderTop:"1px solid rgba(255,255,255,0.08)"}}>
                <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"rgba(255,255,255,0.18)",lineHeight:1.7,fontStyle:"italic"}}>"Nobody should have to face difficult moments completely alone. Solace is being built for exactly those moments."</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ ABOUT ══ */}
      <Div from="#0a0a0a" to="#f5f1eb"/>
      <section id="about" style={{background:"#f5f1eb",padding:"130px 6%",position:"relative",overflow:"hidden"}}>
        <div style={{maxWidth:1100,margin:"0 auto",position:"relative",zIndex:2}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:100,alignItems:"center"}} className="grid2">
            <div className="reveal-l">
              <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:9,color:GD,letterSpacing:"0.22em",marginBottom:20}}>WHO WE ARE</div>
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:200,fontSize:"clamp(34px,5vw,64px)",color:"#0a0a0a",lineHeight:1.05,marginBottom:28}}>Technology should feel like it<br/><em>understands</em> you.</h2>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,color:"rgba(0,0,0,0.48)",lineHeight:1.9,maxWidth:420,marginBottom:36}}>Most software is built around features. We build around the person using it. Every Alvryn product starts with a single question: what does this person actually need right now?</p>
              <button onClick={()=>setModal({title:"About Alvryn",content:ABOUT})} style={{display:"inline-flex",alignItems:"center",gap:10,padding:"13px 30px",borderRadius:100,border:"1px solid rgba(0,0,0,0.14)",background:"transparent",color:"rgba(0,0,0,0.6)",fontFamily:"'DM Sans',sans-serif",fontSize:14,cursor:"pointer",transition:"all 0.3s"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(0,0,0,0.04)";e.currentTarget.style.color="#000";}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(0,0,0,0.6)";}}>Read our story <span>→</span></button>
            </div>
            <div className="reveal-r">
              <div style={{display:"flex",flexDirection:"column",gap:0}}>
                {[
                  {t:"Clarity over complexity",d:"We remove everything that doesn't serve the person using the product. Every decision earns its place."},
                  {t:"Presence over performance",d:"The best technology quietly becomes part of your life. It doesn't demand to be noticed."},
                  {t:"Trust over engagement",d:"We measure success by how genuinely useful our products are — not by how often people open them."},
                ].map((v,i)=>(
                  <div key={i} style={{padding:"26px 0",borderBottom:i<2?"1px solid rgba(0,0,0,0.08)":"none"}}>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:15,color:"#0a0a0a",marginBottom:8}}>{v.t}</div>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"rgba(0,0,0,0.42)",lineHeight:1.7,maxWidth:380}}>{v.d}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ VISION ══ */}
      <Div from="#f5f1eb" to="#050505"/>
      <section id="vision" style={{minHeight:"80vh",background:"#050505",display:"flex",alignItems:"center",justifyContent:"center",padding:"120px 6%",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 50%,rgba(201,168,76,0.07) 0%,rgba(139,107,191,0.04) 50%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.01) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.01) 1px,transparent 1px)",backgroundSize:"100px 100px",pointerEvents:"none"}}/>
        <div style={{maxWidth:860,textAlign:"center",position:"relative",zIndex:2}}>
          <div className="reveal" style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:9,color:"rgba(255,255,255,0.25)",letterSpacing:"0.22em",marginBottom:32}}>OUR VISION</div>
          <h2 className="reveal" style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:200,fontSize:"clamp(38px,6.5vw,90px)",color:"#fff",lineHeight:0.95,letterSpacing:"-0.02em",marginBottom:36}}>
            Every product we build<br/>is an answer to the same<br/><span className="g-text">human question.</span>
          </h2>
          <p className="reveal" style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:200,fontSize:"clamp(18px,2.5vw,28px)",color:"rgba(255,255,255,0.35)",lineHeight:1.65,maxWidth:640,margin:"0 auto",fontStyle:"italic"}}>"What would it feel like if technology understood what I actually needed — and gave me exactly that?"</p>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{background:"#030303",borderTop:"1px solid rgba(255,255,255,0.04)",padding:"52px 6%"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:40,marginBottom:48}}>
            {/* Brand */}
            <div style={{maxWidth:280}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                <AlvrynMark size={28}/>
                <div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:300,fontSize:14,color:"rgba(255,255,255,0.4)",letterSpacing:"0.2em"}}>ALVRYN</div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:7,color:"rgba(255,255,255,0.15)",letterSpacing:"0.18em"}}>TECHNOLOGIES</div>
                </div>
              </div>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"rgba(255,255,255,0.18)",lineHeight:1.75}}>Building technology for the human experience. Two products, one mission.</p>
            </div>
            {/* Products */}
            <div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:9,color:"rgba(255,255,255,0.2)",letterSpacing:"0.18em",marginBottom:16}}>PRODUCTS</div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} onClick={()=>navigate("/go")}>
                  <AlvrynGoIcon size={16}/>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"rgba(255,255,255,0.35)",transition:"color 0.2s"}} onMouseEnter={e=>e.target.style.color="#fff"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,0.35)"}>Alvryn Go</span>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:8,color:G,letterSpacing:"0.1em"}}>LIVE</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <AlvrynSolaceIcon size={16}/>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"rgba(255,255,255,0.2)"}}>Alvryn Solace</span>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:8,color:SP,letterSpacing:"0.1em"}}>SOON</span>
                </div>
              </div>
            </div>
            {/* Company */}
            <div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:9,color:"rgba(255,255,255,0.2)",letterSpacing:"0.18em",marginBottom:16}}>COMPANY</div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {[["About",()=>setModal({title:"About Alvryn",content:ABOUT})],["Privacy Policy",()=>setModal({title:"Privacy Policy",content:PRIVACY})],["Terms of Use",()=>setModal({title:"Terms of Use",content:TERMS})],["Contact",()=>setModal({title:"Contact",content:CONTACT})]].map(([l,fn])=>(
                  <span key={l} onClick={fn} style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"rgba(255,255,255,0.28)",cursor:"pointer",transition:"color 0.2s"}} onMouseEnter={e=>e.target.style.color="rgba(255,255,255,0.7)"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,0.28)"}>{l}</span>
                ))}
              </div>
            </div>
            {/* Contact strip */}
            <div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:9,color:"rgba(255,255,255,0.2)",letterSpacing:"0.18em",marginBottom:16}}>GET IN TOUCH</div>
              <a href="mailto:hello@alvryn.in" style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"rgba(255,255,255,0.28)",textDecoration:"none",display:"block",marginBottom:6,transition:"color 0.2s"}} onMouseEnter={e=>e.target.style.color=G} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,0.28)"}>hello@alvryn.in</a>
              <a href="mailto:privacy@alvryn.in" style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"rgba(255,255,255,0.28)",textDecoration:"none",transition:"color 0.2s"}} onMouseEnter={e=>e.target.style.color=G} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,0.28)"}>privacy@alvryn.in</a>
            </div>
          </div>
          {/* Bottom bar */}
          <div style={{borderTop:"1px solid rgba(255,255,255,0.04)",paddingTop:28,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"rgba(255,255,255,0.12)"}}>© Alvryn Technologies. All rights reserved.</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:8,color:"rgba(255,255,255,0.08)",letterSpacing:"0.18em"}}>INTELLIGENCE · PRESENCE · TRUST</div>
          </div>
        </div>
      </footer>
    </>
  ); 
}