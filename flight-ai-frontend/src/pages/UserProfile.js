import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const API = "https://cometai-backend.onrender.com";
const ACCENT = "#6C63FF";
const GRAD = "linear-gradient(135deg,#6C63FF,#00C2FF)";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(22px);}to{opacity:1;transform:translateY(0);}}
  @keyframes floatUD{0%,100%{transform:translateY(0);}50%{transform:translateY(-9px);}}
  @keyframes orbitRing{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
  @keyframes planeOrbit{from{transform:rotate(0deg) translateX(22px) rotate(0deg);}to{transform:rotate(360deg) translateX(22px) rotate(-360deg);}}
  @keyframes spinSlow{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
`;

function AlvrynIcon({size=40,spin=false}){
  return(<svg width={size} height={size} viewBox="0 0 60 60" fill="none">
    <defs>
      <linearGradient id="pga" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#6C63FF"/><stop offset="100%" stopColor="#00C2FF"/></linearGradient>
      <linearGradient id="pgp" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FF6B6B"/><stop offset="100%" stopColor="#FFD93D"/></linearGradient>
    </defs>
    <ellipse cx="30" cy="30" rx="27" ry="11" stroke="url(#pga)" strokeWidth="1.2" strokeDasharray="5 3" opacity="0.45"
      style={spin?{animation:"orbitRing 5s linear infinite",transformOrigin:"30px 30px"}:{}}/>
    <text x="10" y="47" fontFamily="'Syne',sans-serif" fontWeight="900" fontSize="40" fill="url(#pga)">A</text>
    <g style={spin?{animation:"planeOrbit 5s linear infinite",transformOrigin:"30px 30px"}:{}}>
      <path d="M57 30 L50 26 L52 30 L50 34 Z" fill="url(#pgp)"/>
      <path d="M51 26.5 L51 22 L54 27 Z" fill="url(#pgp)" opacity="0.75"/>
    </g>
  </svg>);
}

function AuroraBackground(){
  const ref=useRef(null),raf=useRef(null);
  const colors=["#6C63FF","#00C2FF","#a78bfa"];
  useEffect(()=>{
    const c=ref.current;if(!c)return;
    const ctx=c.getContext("2d");let W=c.offsetWidth,H=c.offsetHeight;c.width=W;c.height=H;
    const blobs=Array.from({length:4},(_,i)=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-0.5)*0.4,vy:(Math.random()-0.5)*0.4,r:180+Math.random()*140,ci:i%colors.length}));
    const resize=()=>{W=c.offsetWidth;H=c.offsetHeight;c.width=W;c.height=H;};
    window.addEventListener("resize",resize);
    const draw=()=>{ctx.clearRect(0,0,W,H);blobs.forEach(b=>{b.x+=b.vx;b.y+=b.vy;if(b.x<-b.r||b.x>W+b.r)b.vx*=-1;if(b.y<-b.r||b.y>H+b.r)b.vy*=-1;const g=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r);g.addColorStop(0,colors[b.ci%colors.length]+"22");g.addColorStop(1,"transparent");ctx.fillStyle=g;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();});raf.current=requestAnimationFrame(draw);};
    draw();
    return()=>{cancelAnimationFrame(raf.current);window.removeEventListener("resize",resize);};
  },[colors]);
  return <canvas ref={ref} style={{position:"fixed",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:0}}/>;
}

export default function UserProfile(){
  const navigate=useNavigate();
  const token=localStorage.getItem("token");
  const [profile,setProfile]=useState({name:"",email:"",phone:"",ref_code:""});
  const [editForm,setEditForm]=useState({name:"",email:"",phone:""});
  const [pwForm,setPwForm]=useState({currentPassword:"",newPassword:"",confirmPassword:""});
  const [tab,setTab]=useState("profile");
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [msg,setMsg]=useState({type:"",text:""});
  const [bookingCount,setBookingCount]=useState(0);

  useEffect(()=>{
    if(!token){navigate("/login");return;}
    fetch(`${API}/profile`,{headers:{Authorization:`Bearer ${token}`}})
      .then(r=>r.json()).then(d=>{
        setProfile(d);
        setEditForm({name:d.name||"",email:d.email||"",phone:d.phone||""});
        setLoading(false);
      }).catch(()=>setLoading(false));
    fetch(`${API}/my-bookings`,{headers:{Authorization:`Bearer ${token}`}})
      .then(r=>r.json()).then(d=>{ if(Array.isArray(d)) setBookingCount(d.length); }).catch(()=>{});
  },[token,navigate]);

  const saveProfile=async()=>{
    if(!editForm.name.trim()||!editForm.email.trim()){setMsg({type:"error",text:"Name and email are required"});return;}
    setSaving(true); setMsg({type:"",text:""});
    try{
      const r=await fetch(`${API}/profile`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify(editForm)});
      const d=await r.json();
      if(r.ok){
        setProfile(p=>({...p,...editForm}));
        localStorage.setItem("user",JSON.stringify({...profile,...editForm}));
        setMsg({type:"success",text:"Profile updated successfully!"});
      } else { setMsg({type:"error",text:d.message||"Update failed"}); }
    }catch(e){ setMsg({type:"error",text:"Server error"}); }
    setSaving(false);
  };

  const savePassword=async()=>{
    if(!pwForm.currentPassword||!pwForm.newPassword){setMsg({type:"error",text:"Fill all password fields"});return;}
    if(pwForm.newPassword.length<6){setMsg({type:"error",text:"New password must be at least 6 characters"});return;}
    if(pwForm.newPassword!==pwForm.confirmPassword){setMsg({type:"error",text:"New passwords don't match"});return;}
    setSaving(true); setMsg({type:"",text:""});
    try{
      const r=await fetch(`${API}/profile/password`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({currentPassword:pwForm.currentPassword,newPassword:pwForm.newPassword})});
      const d=await r.json();
      if(r.ok){ setMsg({type:"success",text:"Password updated!"}); setPwForm({currentPassword:"",newPassword:"",confirmPassword:""}); }
      else { setMsg({type:"error",text:d.message||"Failed"}); }
    }catch(e){ setMsg({type:"error",text:"Server error"}); }
    setSaving(false);
  };

  const inp={width:"100%",padding:"12px 16px",borderRadius:12,fontSize:15,fontFamily:"'DM Sans',sans-serif",border:"1.5px solid rgba(0,0,0,0.1)",outline:"none",color:"#0a0a0a",background:"#fafafa",transition:"border-color 0.2s"};
  const lbl={fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,color:"#aaa",display:"block",marginBottom:7,letterSpacing:"0.1em"};

  return(
    <div style={{minHeight:"100vh",background:"#f8f8fa",position:"relative",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{CSS}</style>
      <AuroraBackground/>

      {/* Nav */}
      <nav style={{position:"sticky",top:0,zIndex:200,height:64,padding:"0 6%",display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(248,248,250,0.92)",backdropFilter:"blur(22px)",borderBottom:"1px solid rgba(0,0,0,0.05)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>navigate("/")}>
          <div style={{animation:"floatUD 4s ease-in-out infinite"}}><AlvrynIcon size={36} spin/></div>
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:900,fontSize:15,color:"#0a0a0a",letterSpacing:"-0.04em"}}>ALVRYN</div>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:7,color:ACCENT,letterSpacing:"0.18em"}}>TRAVEL BEYOND</div>
          </div>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>navigate("/search")} style={{padding:"7px 16px",borderRadius:10,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:GRAD,color:"#fff",border:"none",boxShadow:`0 4px 14px ${ACCENT}44`}}>Search Flights ✈</button>
          <button onClick={()=>navigate("/bookings")} style={{padding:"7px 16px",borderRadius:10,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:"transparent",color:"#555",border:"1.5px solid rgba(0,0,0,0.12)"}}>My Bookings</button>
        </div>
      </nav>

      <div style={{position:"relative",zIndex:1,maxWidth:700,margin:"0 auto",padding:"44px 6% 80px"}}>
        {loading?(
          <div style={{textAlign:"center",padding:"80px 0"}}>
            <div style={{width:40,height:40,border:`3px solid ${ACCENT}22`,borderTopColor:ACCENT,borderRadius:"50%",animation:"spinSlow 1s linear infinite",margin:"0 auto"}}/>
          </div>
        ):(
          <>
            {/* Profile header */}
            <div style={{display:"flex",alignItems:"center",gap:20,marginBottom:36,animation:"fadeUp 0.6s both"}}>
              <div style={{width:72,height:72,borderRadius:"50%",background:GRAD,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:`0 8px 24px ${ACCENT}44`}}>
                <span style={{fontFamily:"'Syne',sans-serif",fontWeight:900,fontSize:28,color:"#fff"}}>
                  {profile.name?.charAt(0)?.toUpperCase()||"?"}
                </span>
              </div>
              <div>
                <h1 style={{fontFamily:"'Syne',sans-serif",fontWeight:900,fontSize:"clamp(22px,3vw,36px)",color:"#0a0a0a",marginBottom:4}}>{profile.name}</h1>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:"#888"}}>{profile.email}</div>
                <div style={{display:"flex",gap:16,marginTop:8}}>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:ACCENT}}>✈ {bookingCount} booking{bookingCount!==1?"s":""}</div>
                  {profile.ref_code&&<div style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:"#aaa"}}>REF: {profile.ref_code}</div>}
                </div>
              </div>
            </div>

            {/* Referral card */}
            {profile.ref_code&&(
              <div style={{background:"linear-gradient(135deg,#f0eeff,#e8f4ff)",borderRadius:18,padding:"20px 22px",marginBottom:28,border:"1px solid rgba(108,99,255,0.15)",animation:"fadeUp 0.6s 0.1s both"}}>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:ACCENT,letterSpacing:"0.15em",marginBottom:8}}>YOUR REFERRAL CODE</div>
                <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
                  <div style={{fontFamily:"'Space Mono',monospace",fontWeight:700,fontSize:22,color:ACCENT,letterSpacing:"0.15em"}}>{profile.ref_code}</div>
                  <button onClick={()=>{navigator.clipboard.writeText(`https://alvryn.in/register?ref=${profile.ref_code}`);setMsg({type:"success",text:"Referral link copied!"});}}
                    style={{padding:"7px 16px",borderRadius:9,fontSize:12,fontWeight:700,fontFamily:"'Syne',sans-serif",color:"#fff",border:"none",cursor:"pointer",background:GRAD}}>
                    Copy Link
                  </button>
                </div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#666",marginTop:10,lineHeight:1.6}}>
                  🎁 When a friend registers with your link and books a flight above ₹5,000 — <strong>you get ₹150 off</strong> and <strong>they get ₹100 off</strong> on their booking!
                </div>
              </div>
            )}

            {/* Tabs */}
            <div style={{display:"flex",gap:0,background:"#fff",borderRadius:"14px 14px 0 0",border:"1px solid rgba(0,0,0,0.07)",borderBottom:"none",marginBottom:0}}>
              {[["profile","👤 Profile"],["password","🔒 Password"]].map(([id,label])=>(
                <button key={id} onClick={()=>{setTab(id);setMsg({type:"",text:""}); }}
                  style={{flex:1,padding:"14px",border:"none",borderBottom:tab===id?`2.5px solid ${ACCENT}`:"2.5px solid transparent",background:"transparent",fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:600,cursor:"pointer",color:tab===id?ACCENT:"#888",borderRadius:id==="profile"?"14px 0 0 0":"0 14px 0 0",transition:"all 0.2s"}}>
                  {label}
                </button>
              ))}
            </div>

            <div style={{background:"#fff",borderRadius:"0 0 20px 20px",padding:"28px",boxShadow:"0 4px 20px rgba(0,0,0,0.06)",border:"1px solid rgba(0,0,0,0.07)",borderTop:"none",animation:"fadeUp 0.4s both"}}>
              {msg.text&&(
                <div style={{padding:"12px 16px",borderRadius:11,marginBottom:22,fontFamily:"'DM Sans',sans-serif",fontSize:14,
                  background:msg.type==="success"?"#f0fdf4":"#fff0f0",
                  border:`1px solid ${msg.type==="success"?"#bbf7d0":"#ffcdd2"}`,
                  color:msg.type==="success"?"#059669":"#c62828"}}>
                  {msg.type==="success"?"✅ ":"❌ "}{msg.text}
                </div>
              )}

              {tab==="profile"&&(
                <div style={{display:"flex",flexDirection:"column",gap:18}}>
                  {[
                    {key:"name",  label:"FULL NAME",     type:"text",  ph:"Your full name"},
                    {key:"email", label:"EMAIL ADDRESS", type:"email", ph:"your@email.com"},
                    {key:"phone", label:"PHONE NUMBER",  type:"tel",   ph:"+91 9876543210"},
                  ].map(f=>(
                    <div key={f.key}>
                      <label style={lbl}>{f.label}</label>
                      <input type={f.type} value={editForm[f.key]} onChange={e=>setEditForm(p=>({...p,[f.key]:e.target.value}))}
                        placeholder={f.ph}
                        style={inp}
                        onFocus={e=>{e.target.style.borderColor=ACCENT;}}
                        onBlur={e=>{e.target.style.borderColor="rgba(0,0,0,0.1)";}}/>
                    </div>
                  ))}
                  <button onClick={saveProfile} disabled={saving}
                    style={{padding:"13px",borderRadius:13,fontSize:15,fontWeight:800,fontFamily:"'Syne',sans-serif",color:"#fff",border:"none",cursor:"pointer",background:saving?"#ccc":GRAD,boxShadow:saving?"none":`0 6px 22px ${ACCENT}44`,marginTop:6}}>
                    {saving?"Saving…":"Save Changes"}
                  </button>
                </div>
              )}

              {tab==="password"&&(
                <div style={{display:"flex",flexDirection:"column",gap:18}}>
                  {[
                    {key:"currentPassword", label:"CURRENT PASSWORD",  ph:"Enter current password"},
                    {key:"newPassword",     label:"NEW PASSWORD",       ph:"Min. 6 characters"},
                    {key:"confirmPassword", label:"CONFIRM NEW PASSWORD",ph:"Repeat new password"},
                  ].map(f=>(
                    <div key={f.key}>
                      <label style={lbl}>{f.label}</label>
                      <input type="password" value={pwForm[f.key]} onChange={e=>setPwForm(p=>({...p,[f.key]:e.target.value}))}
                        placeholder={f.ph}
                        style={{...inp,borderColor:f.key==="confirmPassword"&&pwForm.confirmPassword&&pwForm.newPassword!==pwForm.confirmPassword?"#ef4444":"rgba(0,0,0,0.1)"}}
                        onFocus={e=>{e.target.style.borderColor=ACCENT;}}
                        onBlur={e=>{e.target.style.borderColor="rgba(0,0,0,0.1)";}}/>
                    </div>
                  ))}
                  {pwForm.confirmPassword&&pwForm.newPassword!==pwForm.confirmPassword&&(
                    <div style={{color:"#ef4444",fontSize:12,fontFamily:"'DM Sans',sans-serif",marginTop:-10}}>Passwords don't match</div>
                  )}
                  <button onClick={savePassword} disabled={saving}
                    style={{padding:"13px",borderRadius:13,fontSize:15,fontWeight:800,fontFamily:"'Syne',sans-serif",color:"#fff",border:"none",cursor:"pointer",background:saving?"#ccc":GRAD,boxShadow:saving?"none":`0 6px 22px ${ACCENT}44`,marginTop:6}}>
                    {saving?"Updating…":"Update Password"}
                  </button>
                </div>
              )}
            </div>

            {/* Danger zone */}
            <div style={{marginTop:28,padding:"20px 24px",borderRadius:16,background:"#fff0f0",border:"1px solid rgba(239,68,68,0.15)"}}>
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:"#ef4444",letterSpacing:"0.15em",marginBottom:10}}>ACCOUNT</div>
              <button onClick={()=>{localStorage.removeItem("token");localStorage.removeItem("user");navigate("/login");}}
                style={{padding:"9px 20px",borderRadius:10,fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",background:"transparent",color:"#e53935",border:"1.5px solid rgba(229,57,53,0.3)"}}>
                Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}