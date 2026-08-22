/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "https://cometai-backend.onrender.com";
const G = "#c9a84c", GD = "#8B6914", GL = "#f0d080";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@200;300;400;600&family=DM+Sans:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'DM Sans',sans-serif;background:#f5f1eb;}
@keyframes gs{0%{background-position:200% center;}100%{background-position:-200% center;}}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
@keyframes spin{to{transform:rotate(360deg);}}
.g-text{background:linear-gradient(135deg,#8B6914,#c9a84c,#f0d080,#c9a84c);background-size:300% auto;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:gs 5s linear infinite;}
.plan-card{border-radius:24px;overflow:hidden;position:relative;transition:all 0.35s cubic-bezier(0.34,1.56,0.64,1);}
.plan-card:hover{transform:translateY(-6px);box-shadow:0 32px 80px rgba(0,0,0,0.15);}
@media(max-width:768px){.plans-grid{grid-template-columns:1fr!important;}}
`;

export default function PlansPage() {
  const navigate = useNavigate();
  const [currentPlan, setCurrentPlan] = useState("explorer");
  const [usageData,   setUsageData]   = useState({ used:0, limit:20, remaining:20 });
  const [notified,    setNotified]    = useState({});
  const [notifying,   setNotifying]   = useState({});
  const [toast,       setToast]       = useState(null);
  const [loading,     setLoading]     = useState(true);

  const token = localStorage.getItem("token");
  let user = {};
  try { user = JSON.parse(localStorage.getItem("user") || "{}"); } catch {}

  useEffect(() => {
    document.title = "Alvryn Plans — Choose Your Journey";
    if (!token) { navigate("/go/login"); return; }
    fetch(`${API}/my-plan`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        setCurrentPlan(d.plan || "explorer");
        setUsageData({ used: d.messagesUsed || 0, limit: d.messagesLimit || 20, remaining: d.remaining || 20 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  const handleNotify = async (planId) => {
    if (notified[planId]) return;
    setNotifying(p => ({ ...p, [planId]: true }));
    try {
      await fetch(`${API}/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ email: user.email || "", plan: planId, source: "plans_page" }),
      });
    } catch {}
    setNotifying(p => ({ ...p, [planId]: false }));
    setNotified(p => ({ ...p, [planId]: true }));
    showToast(user.email
      ? `We'll notify you at ${user.email} when ${planId === "navigator" ? "Navigator Pro" : "Voyager Premium"} launches! ✨`
      : `You're on the list! We'll let you know the moment it's ready. ✨`
    );
  };

  const PLANS = [
    {
      id: "explorer", tier: "Explorer", badge: "Free", icon: "🧭",
      tagline: "Start your journey",
      accentColor: "#22c55e", accentBg: "rgba(34,197,94,0.08)",
      features: [
        "20 AI conversations per day",
        "2 complete trip plans per month",
        "Flights, buses, hotels & trains",
        "Safety insights for any destination",
        "WhatsApp ALVI check-in",
        "Chat history saved",
      ],
      cta: currentPlan === "explorer" ? "current" : "downgrade",
    },
    {
      id: "navigator", tier: "Navigator", badge: "Pro", icon: "🌍",
      tagline: "For the serious traveller",
      accentColor: "#3b82f6", accentBg: "rgba(59,130,246,0.08)",
      comingSoon: true,
      features: [
        "Everything in Explorer, free",
        "Unlimited trip plans",
        "Day-by-day itinerary generation",
        "Smart budget optimizer",
        "Multi-city planning",
        "Priority AI responses",
        "Extended memory across trips",
        "Unlimited chat history",
      ],
      price: "₹299",
      period: "/month",
      cta: "notify",
    },
    {
      id: "voyager", tier: "Voyager", badge: "Premium", icon: "🚀",
      tagline: "Your personal companion",
      accentColor: "#c9a84c", accentBg: "rgba(201,168,76,0.08)",
      comingSoon: true, mostPopular: true,
      features: [
        "Everything in Navigator, pro",
        "Most advanced AI model",
        "Unlimited responses",
        "Group travel planner",
        "Scam awareness alerts",
        "Women traveller mode",
        "Business traveller mode",
        "Emergency companion mode",
        "Real-time weather optimization",
      ],
      price: "₹599",
      period: "/month",
      cta: "notify",
    },
  ];

  if (loading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f5f1eb"}}>
      <div style={{width:32,height:32,border:"3px solid rgba(201,168,76,0.3)",borderTopColor:G,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
    </div>
  );

  return (
    <>
      <style>{CSS}</style>

      {/* Toast */}
      {toast && (
        <div style={{position:"fixed",top:24,left:"50%",transform:"translateX(-50%)",zIndex:1000,maxWidth:420,width:"90%",background:"#1a3a1a",border:"1px solid rgba(34,197,94,0.4)",borderRadius:14,padding:"14px 20px",boxShadow:"0 8px 32px rgba(0,0,0,0.3)",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#86efac",lineHeight:1.6,textAlign:"center",animation:"fadeUp 0.3s both"}}>
          {toast.msg}
        </div>
      )}

      {/* Nav */}
      <nav style={{background:"rgba(245,241,235,0.92)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(0,0,0,0.07)",padding:"0 5%",height:62,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>navigate("/go")}>
          <svg width="26" height="26" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="46" stroke={G} strokeWidth="1.5" fill="none"/>
            <line x1="47" y1="23" x2="29" y2="77" stroke={G} strokeWidth="8" strokeLinecap="round"/>
            <line x1="55" y1="23" x2="71" y2="77" stroke={G} strokeWidth="7" strokeLinecap="round" opacity="0.7"/>
          </svg>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:300,fontSize:16,color:"#0a0a0a",letterSpacing:"0.18em"}}>ALVRYN GO</span>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>navigate("/go/ai")} style={{padding:"8px 18px",borderRadius:100,border:"1px solid rgba(0,0,0,0.12)",background:"transparent",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"rgba(0,0,0,0.6)",cursor:"pointer"}}>Back to ALVI</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{background:"linear-gradient(135deg,#0a0604 0%,#1e0e04 50%,#2d1408 100%)",padding:"80px 6% 100px",textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 80%,rgba(201,168,76,0.12),transparent 60%)",pointerEvents:"none"}}/>
        <div style={{position:"relative",zIndex:2}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"6px 18px",borderRadius:100,border:"1px solid rgba(201,168,76,0.25)",background:"rgba(201,168,76,0.08)",marginBottom:24}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:G,display:"inline-block"}}/>
            <span style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:G,letterSpacing:"0.2em"}}>ALVRYN PLANS</span>
          </div>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:200,fontSize:"clamp(36px,6vw,80px)",color:"#fff",lineHeight:0.95,marginBottom:18}}>
            Choose your<br/><span className="g-text">journey.</span>
          </h1>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:16,color:"rgba(255,255,255,0.38)",maxWidth:440,margin:"0 auto 32px",lineHeight:1.7}}>
            Start free. Upgrade when you're ready. Every plan includes safety insights, WhatsApp check-in and trusted booking partners.
          </p>
          {/* Current usage */}
          <div style={{display:"inline-flex",alignItems:"center",gap:12,padding:"12px 24px",borderRadius:100,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)"}}>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"rgba(255,255,255,0.5)"}}>Today's usage:</span>
            <div style={{display:"flex",gap:3}}>
              {Array.from({length:20},(_,i)=>(
                <div key={i} style={{width:8,height:8,borderRadius:2,background:i<usageData.used?"#c9a84c":"rgba(255,255,255,0.12)",transition:"background 0.2s"}}/>
              ))}
            </div>
            <span style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:G}}>{usageData.used}/{usageData.limit}</span>
          </div>
        </div>
      </div>

      {/* Plans */}
      <div style={{background:"#f5f1eb",padding:"0 6% 80px",marginTop:-40}}>
        <div style={{maxWidth:1000,margin:"0 auto"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20}} className="plans-grid">
            {PLANS.map((plan,i)=>(
              <div key={plan.id} className="plan-card" style={{background:plan.mostPopular?"#0a0604":"#fff",border:plan.mostPopular?"none":`1px solid rgba(0,0,0,0.08)`,boxShadow:plan.mostPopular?"0 20px 60px rgba(0,0,0,0.2)":"0 4px 24px rgba(0,0,0,0.06)",animation:`fadeUp 0.5s ${i*100}ms both`}}>
                {plan.mostPopular && <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${GD},${G},${GL})`}}/>}
                {plan.mostPopular && (
                  <div style={{position:"absolute",top:16,right:16,background:`linear-gradient(135deg,${GD},${G})`,color:"#030303",fontFamily:"'Space Mono',monospace",fontSize:8,fontWeight:700,letterSpacing:"0.12em",padding:"3px 10px",borderRadius:100}}>✦ MOST POPULAR</div>
                )}
                <div style={{padding:"32px 28px"}}>
                  {/* Plan header */}
                  <div style={{fontSize:28,marginBottom:12}}>{plan.icon}</div>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:plan.mostPopular?"rgba(201,168,76,0.6)":"rgba(0,0,0,0.3)",letterSpacing:"0.18em",marginBottom:6}}>{plan.badge}</div>
                  <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:26,color:plan.mostPopular?"#fff":"#0a0a0a",marginBottom:4}}>Alvryn {plan.tier}</h2>
                  <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:plan.mostPopular?"rgba(255,255,255,0.35)":"rgba(0,0,0,0.4)",marginBottom:20,fontStyle:"italic"}}>{plan.tagline}</p>

                  {/* Price */}
                  {plan.price ? (
                    <div style={{marginBottom:20,padding:"14px",borderRadius:12,background:plan.mostPopular?"rgba(201,168,76,0.08)":"rgba(0,0,0,0.03)",border:`1px solid ${plan.mostPopular?"rgba(201,168,76,0.2)":"rgba(0,0,0,0.07)"}`}}>
                      <div style={{fontFamily:"'Space Mono',monospace",fontSize:8,color:plan.mostPopular?"rgba(201,168,76,0.55)":"rgba(0,0,0,0.3)",letterSpacing:"0.14em",marginBottom:4}}>COMING SOON · ESTIMATED</div>
                      <div style={{display:"flex",alignItems:"baseline",gap:2}}>
                        <span style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:32,color:plan.mostPopular?G:GD}}>{plan.price}</span>
                        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:plan.mostPopular?"rgba(255,255,255,0.3)":"rgba(0,0,0,0.35)"}}>{plan.period}</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{marginBottom:20,padding:"14px",borderRadius:12,background:"rgba(34,197,94,0.06)",border:"1px solid rgba(34,197,94,0.15)"}}>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:28,color:"#16a34a"}}>Free forever</div>
                      <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"rgba(0,0,0,0.35)",marginTop:2}}>No credit card required</div>
                    </div>
                  )}

                  {/* Features */}
                  <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
                    {plan.features.map((f,j)=>(
                      <div key={j} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                        <span style={{color:plan.id==="explorer"?"#16a34a":plan.id==="navigator"?"#3b82f6":G,fontSize:12,flexShrink:0,marginTop:1}}>{j===0&&plan.id!=="explorer"?"✅":"✦"}</span>
                        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:plan.mostPopular?"rgba(255,255,255,0.65)":"rgba(0,0,0,0.6)",lineHeight:1.5,fontStyle:j===0&&plan.id!=="explorer"?"italic":"normal",fontWeight:j===0&&plan.id!=="explorer"?600:400}}>{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  {plan.cta === "current" ? (
                    <div style={{padding:"12px",borderRadius:12,textAlign:"center",background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"#16a34a",fontWeight:600}}>✓ Your Current Plan</div>
                  ) : notified[plan.id] ? (
                    <div style={{padding:"12px",borderRadius:12,textAlign:"center",background:"rgba(34,197,94,0.06)",border:"1px solid rgba(34,197,94,0.18)",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"#16a34a"}}>✓ You're on the list!</div>
                  ) : (
                    <button onClick={()=>handleNotify(plan.id)} disabled={notifying[plan.id]}
                      style={{width:"100%",padding:"12px",borderRadius:12,cursor:"pointer",background:plan.mostPopular?`linear-gradient(135deg,${GD},${G})`:"rgba(0,0,0,0.04)",border:plan.mostPopular?"none":"1px solid rgba(0,0,0,0.1)",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,color:plan.mostPopular?"#030303":"rgba(0,0,0,0.5)",transition:"all 0.25s"}}>
                      {notifying[plan.id] ? "Saving..." : "Notify me when available →"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Note */}
          <div style={{textAlign:"center",marginTop:40,fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"rgba(0,0,0,0.32)",lineHeight:1.7}}>
            🛡️ Safety insights and WhatsApp check-in are included in all plans, always free.<br/>
            We earn a small commission from booking partners when you book — at zero extra cost to you.
          </div>
        </div>
      </div>
    </>
  );
}