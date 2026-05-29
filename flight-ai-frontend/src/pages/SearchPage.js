import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FLIGHT_CITIES, BUS_CITIES, TRAIN_CITIES, HOTEL_CITIES,
  searchFlightCities, searchBusCities, searchTrainCities, searchHotelCities,
  buildFlightLink, buildBusLink, buildTrainLink, buildHotelLink
} from "../data/destinations";

const API = "https://cometai-backend.onrender.com";
const CLASSES = ["Economy","Premium Economy","Business","First Class"];

function formatTime(dt){ if(!dt)return"--:--"; return new Date(dt).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false}); }
function formatDate(dt){ if(!dt)return""; return new Date(dt).toLocaleDateString("en-IN",{day:"numeric",month:"short"}); }
function calcDuration(dep,arr){ if(!dep||!arr)return""; const diff=(new Date(arr)-new Date(dep))/60000; const h=Math.floor(diff/60); const m=diff%60; return`${h}h${m>0?" "+m+"m":""}`.trim(); }

// ── TAB CONFIG ────────────────────────────────────────────────────────────────
const TABS = [
  { id:"flight", label:"Flights",  icon:"✈️",  bg:"linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#0f2744 100%)", accent:"#38bdf8", accent2:"#0ea5e9" },
  { id:"bus",    label:"Buses",    icon:"🚌",  bg:"linear-gradient(135deg,#0d2818 0%,#1a4a2e 50%,#0d2818 100%)", accent:"#4ade80", accent2:"#22c55e" },
  { id:"hotel",  label:"Hotels",   icon:"🏨",  bg:"linear-gradient(135deg,#2d1b00 0%,#5a3200 50%,#2d1b00 100%)", accent:"#fbbf24", accent2:"#f59e0b" },
  { id:"train",  label:"Trains",   icon:"🚂",  bg:"linear-gradient(135deg,#1a0d2e 0%,#3b1f6e 50%,#1a0d2e 100%)", accent:"#c084fc", accent2:"#a855f7" },
  { id:"cab",    label:"Cabs",     icon:"🚖",  bg:"linear-gradient(135deg,#1a0a00 0%,#3d1a00 50%,#1a0a00 100%)", accent:"#fb923c", accent2:"#f97316", soon:true },
];

// ── ANIMATED SCENE PER TAB ────────────────────────────────────────────────────
function TabScene({ tabId }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d");
    let W = cv.offsetWidth, H = cv.offsetHeight;
    cv.width = W; cv.height = H;

    let frame = 0;

    const resize = () => {
      W = cv.offsetWidth; H = cv.offsetHeight;
      cv.width = W; cv.height = H;
    };
    window.addEventListener("resize", resize);

    // ── FLIGHT scene: plane flying left→right with clouds ──
    if (tabId === "flight") {
      const clouds = Array.from({length:5}, (_,i) => ({
        x: Math.random() * W, y: 30 + Math.random() * (H * 0.5),
        w: 60 + Math.random() * 80, speed: 0.3 + Math.random() * 0.4, op: 0.15 + Math.random() * 0.2
      }));
      let planeX = -60, planeY = H * 0.42;
      const planeSpeed = W / 280;

      const draw = () => {
        ctx.clearRect(0,0,W,H);
        frame++;
        // Stars
        for (let i = 0; i < 60; i++) {
          const sx = (i * 137 + frame * 0.05) % W;
          const sy = (i * 97) % H;
          ctx.beginPath(); ctx.arc(sx, sy, 0.8, 0, Math.PI*2);
          ctx.fillStyle = `rgba(180,220,255,${0.1 + 0.15 * Math.sin(frame * 0.02 + i)})`; ctx.fill();
        }
        // Clouds
        clouds.forEach(c => {
          c.x -= c.speed;
          if (c.x + c.w < 0) { c.x = W + c.w; c.y = 30 + Math.random() * (H * 0.5); }
          ctx.beginPath();
          ctx.ellipse(c.x, c.y, c.w * 0.5, 14, 0, 0, Math.PI*2);
          ctx.ellipse(c.x - 20, c.y + 5, c.w * 0.3, 10, 0, 0, Math.PI*2);
          ctx.ellipse(c.x + 20, c.y + 5, c.w * 0.35, 11, 0, 0, Math.PI*2);
          ctx.fillStyle = `rgba(200,230,255,${c.op})`; ctx.fill();
        });
        // Plane body
        planeX += planeSpeed;
        if (planeX > W + 80) planeX = -80;
        const py = planeY + Math.sin(frame * 0.03) * 4;
        ctx.save(); ctx.translate(planeX, py);
        // fuselage
        ctx.beginPath(); ctx.ellipse(0, 0, 28, 7, 0, 0, Math.PI*2);
        ctx.fillStyle = "rgba(180,220,255,0.85)"; ctx.fill();
        // nose
        ctx.beginPath(); ctx.moveTo(28, 0); ctx.lineTo(40, 2); ctx.lineTo(28, 4);
        ctx.fillStyle = "rgba(220,240,255,0.9)"; ctx.fill();
        // wings
        ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(-10, -18); ctx.lineTo(-18, -18); ctx.lineTo(-12, -2);
        ctx.fillStyle = "rgba(150,200,255,0.75)"; ctx.fill();
        ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(-10, 14); ctx.lineTo(-16, 14); ctx.lineTo(-12, 2);
        ctx.fillStyle = "rgba(150,200,255,0.7)"; ctx.fill();
        // tail
        ctx.beginPath(); ctx.moveTo(-25, -2); ctx.lineTo(-30, -12); ctx.lineTo(-22, -12); ctx.lineTo(-20, -2);
        ctx.fillStyle = "rgba(180,210,255,0.7)"; ctx.fill();
        // engine trail
        ctx.beginPath(); ctx.moveTo(-28, 0);
        for (let i = 0; i < 20; i++) {
          const tx = -28 - i * 3.5;
          const ty = Math.sin(frame * 0.1 + i * 0.5) * 2;
          ctx.lineTo(tx, ty);
        }
        ctx.strokeStyle = "rgba(180,220,255,0.15)"; ctx.lineWidth = 3; ctx.stroke();
        ctx.restore();
        rafRef.current = requestAnimationFrame(draw);
      };
      draw(); return;
    }

    // ── BUS scene: bus driving on road ──
    if (tabId === "bus") {
      let busX = -100;
      const busSpeed = W / 320;
      const roadY = H * 0.65;
      // trees
      const trees = Array.from({length:6}, (_,i) => ({
        x: (W / 6) * i + Math.random() * 40,
        h: 30 + Math.random() * 20
      }));

      const draw = () => {
        ctx.clearRect(0,0,W,H);
        frame++;
        // Sky gradient
        const sky = ctx.createLinearGradient(0,0,0,roadY);
        sky.addColorStop(0, "rgba(10,30,15,0.8)");
        sky.addColorStop(1, "rgba(20,50,25,0.4)");
        ctx.fillStyle = sky; ctx.fillRect(0,0,W,roadY);
        // Stars
        for (let i = 0; i < 40; i++) {
          const sx = (i * 173 + frame * 0.02) % W;
          const sy = (i * 61) % (roadY * 0.8);
          ctx.beginPath(); ctx.arc(sx, sy, 0.7, 0, Math.PI*2);
          ctx.fillStyle = `rgba(150,255,150,${0.08 + 0.1 * Math.sin(frame * 0.03 + i)})`; ctx.fill();
        }
        // Trees
        trees.forEach(t => {
          t.x -= 0.4;
          if (t.x < -20) t.x = W + 20;
          // trunk
          ctx.fillStyle = "rgba(80,120,60,0.6)";
          ctx.fillRect(t.x - 3, roadY - t.h, 6, t.h);
          // leaves
          ctx.beginPath(); ctx.arc(t.x, roadY - t.h - 12, 14, 0, Math.PI*2);
          ctx.fillStyle = "rgba(50,200,80,0.35)"; ctx.fill();
        });
        // Road
        ctx.fillStyle = "rgba(15,40,20,0.9)";
        ctx.fillRect(0, roadY, W, H - roadY);
        // Road line
        for (let i = 0; i < 8; i++) {
          const lx = ((frame * 2 + i * (W/7)) % W);
          ctx.fillStyle = "rgba(80,200,80,0.3)";
          ctx.fillRect(lx, roadY + (H-roadY)*0.4, W/14, 2);
        }
        // Bus
        busX += busSpeed;
        if (busX > W + 100) busX = -100;
        const bx = busX, by = roadY - 36;
        ctx.save(); ctx.translate(bx, by);
        // body
        ctx.beginPath(); ctx.roundRect(-42, -20, 84, 32, 5);
        ctx.fillStyle = "rgba(60,180,80,0.85)"; ctx.fill();
        // windows
        for (let w = -30; w <= 20; w += 18) {
          ctx.beginPath(); ctx.roundRect(w, -16, 12, 10, 2);
          ctx.fillStyle = "rgba(180,255,200,0.5)"; ctx.fill();
        }
        // destination board
        ctx.beginPath(); ctx.roundRect(-40, -24, 50, 6, 2);
        ctx.fillStyle = "rgba(40,140,60,0.8)"; ctx.fill();
        // wheels
        [-22, 18].forEach(wx => {
          ctx.beginPath(); ctx.arc(wx, 14, 10, 0, Math.PI*2);
          ctx.fillStyle = "rgba(20,60,20,0.9)"; ctx.fill();
          ctx.beginPath(); ctx.arc(wx, 14, 5, 0, Math.PI*2);
          ctx.fillStyle = "rgba(100,200,100,0.4)"; ctx.fill();
        });
        // headlight
        ctx.beginPath(); ctx.ellipse(43, -5, 4, 3, 0, 0, Math.PI*2);
        ctx.fillStyle = "rgba(200,255,150,0.8)"; ctx.fill();
        ctx.restore();
        rafRef.current = requestAnimationFrame(draw);
      };
      draw(); return;
    }

    // ── HOTEL scene: building at night with lit windows ──
    if (tabId === "hotel") {
      const windows = Array.from({length:20}, (_,i) => ({
        col: i % 5, row: Math.floor(i/5),
        on: Math.random() > 0.3,
        blink: Math.random() > 0.7,
        phase: Math.random() * Math.PI * 2,
      }));

      const draw = () => {
        ctx.clearRect(0,0,W,H);
        frame++;
        // Night sky
        const sky = ctx.createLinearGradient(0,0,0,H);
        sky.addColorStop(0, "rgba(10,6,2,0.95)");
        sky.addColorStop(1, "rgba(40,20,0,0.6)");
        ctx.fillStyle = sky; ctx.fillRect(0,0,W,H);
        // Stars
        for (let i = 0; i < 50; i++) {
          const sx = (i * 113) % W, sy = (i * 71) % (H*0.5);
          const op = 0.15 + 0.2 * Math.sin(frame * 0.04 + i);
          ctx.beginPath(); ctx.arc(sx, sy, 0.8, 0, Math.PI*2);
          ctx.fillStyle = `rgba(255,220,150,${op})`; ctx.fill();
        }
        // Moon
        ctx.beginPath(); ctx.arc(W * 0.8, H * 0.15, 18, 0, Math.PI*2);
        ctx.fillStyle = "rgba(255,220,120,0.18)"; ctx.fill();
        ctx.beginPath(); ctx.arc(W * 0.8, H * 0.15, 13, 0, Math.PI*2);
        ctx.fillStyle = "rgba(255,230,150,0.12)"; ctx.fill();
        // Hotel building
        const bw = Math.min(W * 0.55, 180);
        const bh = H * 0.7;
        const bx = (W - bw) / 2, by = H - bh;
        ctx.fillStyle = "rgba(50,28,5,0.92)";
        ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, [4,4,0,0]);
        ctx.fill();
        // Roof details
        ctx.fillStyle = "rgba(70,40,8,0.8)";
        ctx.fillRect(bx + bw*0.35, by - 12, bw*0.08, 12);
        ctx.fillRect(bx + bw*0.55, by - 18, bw*0.06, 18);
        // Windows
        const wCols = 5, wRows = 4;
        const ww = (bw - 20) / (wCols + 0.5);
        const wh = (bh - 30) / (wRows + 0.5);
        windows.forEach(win => {
          const wx = bx + 10 + win.col * ww + ww * 0.1;
          const wy = by + 15 + win.row * wh + wh * 0.1;
          const wWidth = ww * 0.65, wHeight = wh * 0.65;
          let lit = win.on;
          if (win.blink) lit = Math.sin(frame * 0.04 + win.phase) > 0;
          ctx.beginPath(); ctx.roundRect(wx, wy, wWidth, wHeight, 2);
          if (lit) {
            const wg = ctx.createRadialGradient(wx+wWidth/2, wy+wHeight/2, 1, wx+wWidth/2, wy+wHeight/2, wWidth);
            wg.addColorStop(0, "rgba(255,200,80,0.95)");
            wg.addColorStop(1, "rgba(255,160,40,0.5)");
            ctx.fillStyle = wg;
            // glow
            ctx.shadowColor = "rgba(255,180,50,0.6)";
            ctx.shadowBlur = 8;
          } else {
            ctx.fillStyle = "rgba(20,10,2,0.8)";
            ctx.shadowBlur = 0;
          }
          ctx.fill(); ctx.shadowBlur = 0;
        });
        // Hotel sign glow
        ctx.beginPath(); ctx.roundRect(bx + bw*0.2, by + bh*0.88, bw*0.6, bh*0.08, 4);
        ctx.fillStyle = `rgba(255,180,50,${0.15 + 0.08*Math.sin(frame*0.05)})`; ctx.fill();
        rafRef.current = requestAnimationFrame(draw);
      };
      draw(); return;
    }

    // ── TRAIN scene: train moving on tracks ──
    if (tabId === "train") {
      let trainX = W + 200;
      const trainSpeed = -(W / 240);
      const trackY = H * 0.68;

      const draw = () => {
        ctx.clearRect(0,0,W,H);
        frame++;
        // Night sky
        for (let i = 0; i < 55; i++) {
          const sx = (i * 137) % W, sy = (i * 83) % (trackY * 0.85);
          ctx.beginPath(); ctx.arc(sx, sy, 0.7, 0, Math.PI*2);
          ctx.fillStyle = `rgba(200,160,255,${0.08 + 0.12*Math.sin(frame*0.025+i)})`; ctx.fill();
        }
        // Tracks
        ctx.strokeStyle = "rgba(160,100,255,0.35)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, trackY); ctx.lineTo(W, trackY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, trackY + 8); ctx.lineTo(W, trackY + 8); ctx.stroke();
        // Sleepers
        for (let i = 0; i < 12; i++) {
          const sx = ((frame*1.5 + i*(W/11)) % (W+20)) - 10;
          ctx.fillStyle = "rgba(120,60,200,0.3)";
          ctx.fillRect(sx, trackY - 2, 16, 12);
        }
        // Train — moves right to left
        trainX += trainSpeed;
        if (trainX < -400) trainX = W + 200;
        const tx = trainX, ty = trackY - 38;
        ctx.save(); ctx.translate(tx, ty);
        // Engine
        ctx.beginPath(); ctx.roundRect(-70, -22, 55, 34, 5);
        ctx.fillStyle = "rgba(130,60,220,0.85)"; ctx.fill();
        ctx.beginPath(); ctx.roundRect(-80, -16, 14, 28, 3);
        ctx.fillStyle = "rgba(100,40,180,0.9)"; ctx.fill();
        // Headlight
        ctx.beginPath(); ctx.ellipse(-84, -4, 5, 4, 0, 0, Math.PI*2);
        ctx.fillStyle = "rgba(220,180,255,0.9)"; ctx.fill();
        ctx.shadowColor = "rgba(200,150,255,0.8)"; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.ellipse(-84, -4, 3, 2.5, 0, 0, Math.PI*2);
        ctx.fillStyle = "rgba(255,240,255,1)"; ctx.fill(); ctx.shadowBlur = 0;
        // Carriage 1
        ctx.beginPath(); ctx.roundRect(-8, -18, 48, 28, 4);
        ctx.fillStyle = "rgba(110,50,200,0.8)"; ctx.fill();
        // Carriage 2
        ctx.beginPath(); ctx.roundRect(48, -18, 48, 28, 4);
        ctx.fillStyle = "rgba(100,45,190,0.75)"; ctx.fill();
        // Windows
        [-55,-38,-22, 5,20,35, 61,76,91].forEach(wx => {
          ctx.beginPath(); ctx.roundRect(wx, -12, 11, 9, 2);
          const isLit = Math.sin(frame * 0.04 + wx) > -0.3;
          ctx.fillStyle = isLit ? "rgba(220,180,255,0.55)" : "rgba(50,20,80,0.6)"; ctx.fill();
        });
        // Wheels
        [-55,-30, 10,35, 65,90].forEach(wx => {
          ctx.beginPath(); ctx.arc(wx, 14, 8, 0, Math.PI*2);
          ctx.fillStyle = "rgba(60,20,100,0.9)"; ctx.fill();
          ctx.beginPath(); ctx.arc(wx, 14, 4, 0, Math.PI*2);
          ctx.fillStyle = "rgba(160,100,255,0.45)"; ctx.fill();
        });
        // Steam puffs
        for (let p = 0; p < 4; p++) {
          const pAge = (frame * 1.5 + p * 20) % 60;
          const px = -80 - pAge * 0.8, py = -24 - pAge * 0.5;
          ctx.beginPath(); ctx.arc(px, py, 4 + pAge * 0.15, 0, Math.PI*2);
          ctx.fillStyle = `rgba(200,160,255,${Math.max(0, 0.25 - pAge * 0.004)})`; ctx.fill();
        }
        ctx.restore();
        rafRef.current = requestAnimationFrame(draw);
      };
      draw(); return;
    }

    // ── CAB scene: taxi on city street ──
    if (tabId === "cab") {
      let cabX = -120;
      const cabSpeed = W / 300;
      const streetY = H * 0.68;

      const draw = () => {
        ctx.clearRect(0,0,W,H);
        frame++;
        for (let i = 0; i < 40; i++) {
          const sx = (i*113)%W, sy = (i*79)%(streetY*0.8);
          ctx.beginPath(); ctx.arc(sx,sy,0.6,0,Math.PI*2);
          ctx.fillStyle=`rgba(255,160,50,${0.08+0.1*Math.sin(frame*0.03+i)})`; ctx.fill();
        }
        // Street
        ctx.fillStyle="rgba(20,10,0,0.9)"; ctx.fillRect(0,streetY,W,H-streetY);
        for (let i=0;i<7;i++) {
          const lx=((frame*2+i*(W/6))%W);
          ctx.fillStyle="rgba(255,140,40,0.25)"; ctx.fillRect(lx,streetY+(H-streetY)*0.4,W/12,2);
        }
        // Cab
        cabX+=cabSpeed; if(cabX>W+130)cabX=-120;
        const cx=cabX, cy=streetY-28;
        ctx.save(); ctx.translate(cx,cy);
        ctx.beginPath(); ctx.roundRect(-38,-16,76,26,4);
        ctx.fillStyle="rgba(255,140,0,0.88)"; ctx.fill();
        ctx.beginPath(); ctx.roundRect(-24,-28,48,14,[4,4,0,0]);
        ctx.fillStyle="rgba(255,160,30,0.7)"; ctx.fill();
        [[- 12,-20],[8,-20]].forEach(([wx,wy])=>{
          ctx.beginPath(); ctx.roundRect(wx,wy,14,10,2);
          ctx.fillStyle="rgba(180,220,255,0.45)"; ctx.fill();
        });
        [-22,18].forEach(wx=>{
          ctx.beginPath(); ctx.arc(wx,12,9,0,Math.PI*2);
          ctx.fillStyle="rgba(30,15,0,0.9)"; ctx.fill();
          ctx.beginPath(); ctx.arc(wx,12,4,0,Math.PI*2);
          ctx.fillStyle="rgba(255,160,50,0.4)"; ctx.fill();
        });
        ctx.beginPath(); ctx.ellipse(40,-4,4,3,0,0,Math.PI*2);
        ctx.fillStyle="rgba(255,220,100,0.9)"; ctx.fill();
        ctx.restore();
        rafRef.current=requestAnimationFrame(draw);
      };
      draw(); return;
    }

    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener("resize", resize); };
  }, [tabId]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }}
    />
  );
}

// ── CITY PICKER MODAL ─────────────────────────────────────────────────────────
function CityPickerModal({ tabId, label, onSelect, onClose, exclude }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

  const tab = TABS.find(t => t.id === tabId) || TABS[0];

  let results = [];
  if (tabId === "flight") {
    results = searchFlightCities(query).filter(c => c.code !== exclude);
  } else if (tabId === "bus") {
    results = searchBusCities(query).filter(c => c !== exclude);
  } else if (tabId === "train") {
    results = searchTrainCities(query).filter(c => c.city !== exclude);
  } else if (tabId === "hotel") {
    results = searchHotelCities(query).filter(c => c !== exclude);
  }

  return (
    <div
      onClick={onClose}
      style={{
        position:"fixed", inset:0, zIndex:300,
        background:"rgba(0,0,0,0.6)", backdropFilter:"blur(10px)",
        display:"flex", alignItems:"flex-end", justifyContent:"center",
      }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width:"100%", maxWidth:520, maxHeight:"80vh",
          background:"#fff", borderRadius:"24px 24px 0 0",
          boxShadow:"0 -20px 60px rgba(0,0,0,0.25)",
          display:"flex", flexDirection:"column",
          overflow:"hidden",
        }}>
        {/* Header */}
        <div style={{ padding:"20px 20px 0", borderBottom:"1px solid rgba(0,0,0,0.06)", paddingBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:700, color:"#1a1410" }}>
              Select {label}
            </div>
            <button onClick={onClose} style={{ background:"rgba(0,0,0,0.05)", border:"none", borderRadius:"50%", width:30, height:30, cursor:"pointer", fontSize:16, color:"#666" }}>×</button>
          </div>
          <div style={{
            display:"flex", alignItems:"center", gap:10,
            background:"rgba(0,0,0,0.04)", borderRadius:12,
            padding:"10px 14px", border:"1.5px solid rgba(201,168,76,0.2)",
          }}>
            <span style={{ fontSize:14, opacity:0.4 }}>🔍</span>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={tabId === "flight" ? "Search city, code or country..." : "Search city..."}
              style={{ flex:1, background:"transparent", border:"none", outline:"none", fontFamily:"'DM Sans',sans-serif", fontSize:14, color:"#1a1410" }}
            />
          </div>
        </div>

        {/* List */}
        <div style={{ overflowY:"auto", flex:1, padding:"8px 12px 20px" }}>
          {!query && (
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"#aaa", letterSpacing:"0.12em", padding:"10px 8px 6px", textTransform:"uppercase" }}>
              Popular Cities
            </div>
          )}
          {results.map((item, i) => {
            if (tabId === "flight") {
              return (
                <div
                  key={item.code}
                  onClick={() => onSelect(item)}
                  style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 10px", borderRadius:12, cursor:"pointer", transition:"background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background="rgba(201,168,76,0.07)"}
                  onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:"#1a1410" }}>
                      {item.city} {item.top && <span style={{ fontSize:9, background:"rgba(201,168,76,0.15)", color:"#8B6914", padding:"1px 6px", borderRadius:8, marginLeft:6, fontWeight:700, letterSpacing:"0.05em" }}>TOP</span>}
                    </div>
                    <div style={{ fontSize:11, color:"#888", marginTop:2 }}>{item.airport} · {item.country}</div>
                  </div>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:15, fontWeight:700, color:tab.accent }}>{item.code}</div>
                </div>
              );
            } else if (tabId === "train") {
              return (
                <div
                  key={item.code}
                  onClick={() => onSelect(item)}
                  style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 10px", borderRadius:12, cursor:"pointer", transition:"background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background="rgba(201,168,76,0.07)"}
                  onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                  <div style={{ fontSize:14, fontWeight:500, color:"#1a1410" }}>{item.city}</div>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:12, fontWeight:700, color:tab.accent }}>{item.code}</div>
                </div>
              );
            } else {
              return (
                <div
                  key={item}
                  onClick={() => onSelect(item)}
                  style={{ padding:"12px 10px", borderRadius:12, cursor:"pointer", fontSize:14, fontWeight:500, color:"#1a1410", transition:"background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background="rgba(201,168,76,0.07)"}
                  onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                  {item}
                </div>
              );
            }
          })}
          {results.length === 0 && query && (
            <div style={{ textAlign:"center", padding:"32px 20px", color:"#aaa", fontSize:13 }}>
              No results for "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MAIN SEARCH PAGE ──────────────────────────────────────────────────────────
export default function SearchPage() {
  const navigate = useNavigate();
  const token    = localStorage.getItem("token");
  const today    = new Date().toISOString().split("T")[0];

  const [activeTab, setActiveTab] = useState("flight");
  const tab = TABS.find(t => t.id === activeTab);

  // Flight state
  const [fromCity, setFromCity] = useState(FLIGHT_CITIES[0]);
  const [toCity,   setToCity]   = useState(FLIGHT_CITIES[1]);
  const [date,     setDate]     = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [tripType, setTripType] = useState("oneway");
  const [passengers, setPassengers] = useState(1);
  const [cabinClass, setCabinClass] = useState("Economy");
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker,   setShowToPicker]   = useState(false);

  // Bus state
  const [busFrom, setBusFrom] = useState("Bangalore");
  const [busTo,   setBusTo]   = useState("Chennai");
  const [busDate, setBusDate] = useState("");
  const [showBusFromPicker, setShowBusFromPicker] = useState(false);
  const [showBusToPicker,   setShowBusToPicker]   = useState(false);

  // Train state
  const [trainFrom, setTrainFrom] = useState(TRAIN_CITIES[0]);
  const [trainTo,   setTrainTo]   = useState(TRAIN_CITIES[1]);
  const [trainDate, setTrainDate] = useState("");
  const [showTrainFromPicker, setShowTrainFromPicker] = useState(false);
  const [showTrainToPicker,   setShowTrainToPicker]   = useState(false);
  const [trainClass, setTrainClass] = useState("SL");

  // Hotel state
  const [hotelCity,   setHotelCity]   = useState("Goa");
  const [checkIn,     setCheckIn]     = useState("");
  const [checkOut,    setCheckOut]    = useState("");
  const [hotelGuests, setHotelGuests] = useState(1);
  const [hotelRooms,  setHotelRooms]  = useState(1);
  const [showHotelPicker, setShowHotelPicker] = useState(false);

  // DB flight results
  const [flights,  setFlights]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const [filterTime, setFilterTime] = useState("any");
  const [filterMaxPrice, setFilterMaxPrice] = useState(20000);
  const [sortBy,  setSortBy]  = useState("price");

  // Booking
  const [bookingFlight,  setBookingFlight]  = useState(null);
  const [passengerName,  setPassengerName]  = useState("");
  const [showPayment,    setShowPayment]    = useState(false);

  // keep alive
  useEffect(() => {
    fetch(`${API}/test`).catch(()=>{});
    const t = setInterval(()=>fetch(`${API}/test`).catch(()=>{}), 14*60*1000);
    return ()=>clearInterval(t);
  }, []);

  // flight filters
  useEffect(()=>{
    let r=[...flights];
    if(filterTime==="morning") r=r.filter(f=>{const h=new Date(f.departure_time).getHours();return h>=5&&h<12;});
    else if(filterTime==="afternoon") r=r.filter(f=>{const h=new Date(f.departure_time).getHours();return h>=12&&h<17;});
    else if(filterTime==="evening") r=r.filter(f=>{const h=new Date(f.departure_time).getHours();return h>=17;});
    r=r.filter(f=>f.price<=filterMaxPrice);
    if(sortBy==="price") r.sort((a,b)=>a.price-b.price);
    else if(sortBy==="departure") r.sort((a,b)=>new Date(a.departure_time)-new Date(b.departure_time));
    else if(sortBy==="duration") r.sort((a,b)=>(new Date(a.arrival_time)-new Date(a.departure_time))-(new Date(b.arrival_time)-new Date(b.departure_time)));
    setFiltered(r);
  },[flights,filterTime,filterMaxPrice,sortBy]);

  const swapFlight = () => { const t=fromCity; setFromCity(toCity); setToCity(t); };

  const searchFlights = async () => {
    setLoading(true); setSearched(true);
    try {
      const params = new URLSearchParams({ from: fromCity.city, to: toCity.city });
      if (date) params.append("date", date);
      const res = await fetch(`${API}/real-flights?${params}`);
      const data = await res.json();
      setFlights(data);
      setFilterMaxPrice(data.length > 0 ? Math.max(...data.map(f=>f.price)) + 1000 : 20000);
    } catch { setFlights([]); }
    setLoading(false);
  };

  // ── REDIRECT SEARCH FUNCTIONS ────────────────────────────────────────────
  const handleFlightSearch = () => {
    const link = buildFlightLink({
      fromCode: fromCity.code, toCode: toCity.code,
      date: date || null, returnDate: tripType === "roundtrip" ? returnDate : null,
      passengers, cabinClass: cabinClass.toLowerCase().includes("business") ? "business" : cabinClass.toLowerCase().includes("first") ? "first" : "economy",
    });
    window.open(link, "_blank");
  };

  const handleBusSearch = () => {
    const link = buildBusLink({ from: busFrom, to: busTo, date: busDate || null });
    window.open(link, "_blank");
  };

  const handleTrainSearch = () => {
    const link = buildTrainLink({ fromCode: trainFrom.code, toCode: trainTo.code, date: trainDate || null });
    window.open(link, "_blank");
  };

  const handleHotelSearch = () => {
    const link = buildHotelLink({ city: hotelCity, checkIn: checkIn || null, checkOut: checkOut || null, guests: hotelGuests, rooms: hotelRooms });
    window.open(link, "_blank");
  };

  const handleBook = (flight) => {
    if (!token) { navigate("/login"); return; }
    setBookingFlight(flight);
  };

  // styles
  const inp = (accent) => ({
    background: "rgba(255,255,255,0.08)", border: `1px solid ${accent}30`,
    borderRadius: 12, padding: "12px 14px", color: "#fff",
    fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: "none",
    width: "100%", transition: "border-color 0.2s",
  });
  const label = { fontFamily:"'DM Sans',sans-serif", fontSize:9, letterSpacing:"0.18em", textTransform:"uppercase", color:"rgba(255,255,255,0.4)", marginBottom:6, display:"block" };

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", minHeight:"100vh", background:"#0a0a0a", overflowX:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.4);border-radius:2px;}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
        input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(1);opacity:0.4;cursor:pointer;}
        .city-btn{transition:all 0.2s;} .city-btn:hover{border-color:rgba(255,255,255,0.35)!important;}
        .search-btn{transition:all 0.2s;} .search-btn:hover{transform:translateY(-2px);filter:brightness(1.08);}
        .tab-btn{transition:all 0.2s;}
        .flight-card{transition:all 0.25s;} .flight-card:hover{transform:translateY(-3px);}
      `}</style>

      {/* CITY PICKERS */}
      {showFromPicker && <CityPickerModal tabId="flight" label="departure city" exclude={toCity.code} onSelect={c=>{setFromCity(c);setShowFromPicker(false);}} onClose={()=>setShowFromPicker(false)}/>}
      {showToPicker   && <CityPickerModal tabId="flight" label="destination city" exclude={fromCity.code} onSelect={c=>{setToCity(c);setShowToPicker(false);}} onClose={()=>setShowToPicker(false)}/>}
      {showBusFromPicker && <CityPickerModal tabId="bus" label="departure city" exclude={busTo} onSelect={c=>{setBusFrom(c);setShowBusFromPicker(false);}} onClose={()=>setShowBusFromPicker(false)}/>}
      {showBusToPicker   && <CityPickerModal tabId="bus" label="destination city" exclude={busFrom} onSelect={c=>{setBusTo(c);setShowBusToPicker(false);}} onClose={()=>setShowBusToPicker(false)}/>}
      {showTrainFromPicker && <CityPickerModal tabId="train" label="departure station" exclude={trainTo.city} onSelect={c=>{setTrainFrom(c);setShowTrainFromPicker(false);}} onClose={()=>setShowTrainFromPicker(false)}/>}
      {showTrainToPicker   && <CityPickerModal tabId="train" label="destination station" exclude={trainFrom.city} onSelect={c=>{setTrainTo(c);setShowTrainToPicker(false);}} onClose={()=>setShowTrainToPicker(false)}/>}
      {showHotelPicker && <CityPickerModal tabId="hotel" label="city or destination" onSelect={c=>{setHotelCity(c);setShowHotelPicker(false);}} onClose={()=>setShowHotelPicker(false)}/>}

      {/* Booking modals */}
      {bookingFlight && !showPayment && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center",backdropFilter:"blur(8px)"}} onClick={()=>setBookingFlight(null)}>
          <div style={{background:"#fff",borderRadius:"24px 24px 0 0",padding:"28px 24px",width:"100%",maxWidth:440,boxShadow:"0 -20px 60px rgba(0,0,0,0.25)"}} onClick={e=>e.stopPropagation()}>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:16,fontWeight:700,color:"#1a1410",marginBottom:6}}>Passenger Details</p>
            <p style={{fontSize:13,color:"#888",marginBottom:20}}>{bookingFlight.airline} · {bookingFlight.from_city} → {bookingFlight.to_city}</p>
            <input type="text" placeholder="Enter your full name" value={passengerName} onChange={e=>setPassengerName(e.target.value)}
              style={{width:"100%",padding:"13px 16px",borderRadius:12,fontSize:15,fontFamily:"'DM Sans',sans-serif",color:"#1a1410",border:"1.5px solid rgba(201,168,76,0.25)",outline:"none",marginBottom:20,background:"#fafaf8"}}/>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setBookingFlight(null)} style={{flex:"0 0 auto",padding:"13px 20px",background:"transparent",border:"1.5px solid rgba(0,0,0,0.1)",borderRadius:12,color:"#888",fontFamily:"'DM Sans',sans-serif",fontSize:14,cursor:"pointer"}}>Cancel</button>
              <button onClick={()=>{if(passengerName.trim())setShowPayment(true);}} style={{flex:1,padding:"13px",background:"linear-gradient(135deg,#c9a84c,#f0d080)",border:"none",borderRadius:12,color:"#1a1410",fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:700,cursor:"pointer"}}>Continue →</button>
            </div>
          </div>
        </div>
      )}
      {bookingFlight && showPayment && (
        <PaymentModal flight={bookingFlight} passengerName={passengerName} passengers={passengers} cabinClass={cabinClass}
          onSuccess={async()=>{
            try{await fetch(`${API}/book`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({flight_id:bookingFlight.id,passenger_name:passengerName})});}catch{}
            setShowPayment(false);setBookingFlight(null);navigate("/bookings");
          }}
          onCancel={()=>{setShowPayment(false);setBookingFlight(null);}}
        />
      )}

      {/* ── HERO / SEARCH AREA ── */}
      <div style={{ position:"relative", minHeight:"100vh", background: tab.bg, transition:"background 0.6s ease", overflow:"hidden" }}>
        {/* Animated scene */}
        <TabScene key={activeTab} tabId={activeTab} />

        {/* Nav */}
        <nav style={{ position:"relative", zIndex:10, padding:"16px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }} onClick={()=>navigate("/")}>
            <div style={{ width:32, height:32, borderRadius:"50%", background:`linear-gradient(135deg,${tab.accent},${tab.accent2})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:"#fff" }}>A</div>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:16, fontWeight:700, color:"#fff", letterSpacing:"0.08em" }}>ALVRYN</span>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>navigate("/ai")} style={{ padding:"7px 14px", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:9, color:"rgba(255,255,255,0.8)", fontFamily:"'DM Sans',sans-serif", fontSize:12, cursor:"pointer" }}>✨ AI Chat</button>
            <button onClick={()=>navigate("/profile")} style={{ padding:"7px 14px", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:9, color:"rgba(255,255,255,0.8)", fontFamily:"'DM Sans',sans-serif", fontSize:12, cursor:"pointer" }}>Profile</button>
          </div>
        </nav>

        {/* Content */}
        <div style={{ position:"relative", zIndex:5, maxWidth:680, margin:"0 auto", padding:"32px 20px 60px" }}>

          {/* Heading */}
          <div style={{ marginBottom:28, animation:"fadeUp 0.5s both" }}>
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, letterSpacing:"0.22em", color:`${tab.accent}`, marginBottom:10, textTransform:"uppercase" }}>✦ Search Travel</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(22px,4vw,32px)", fontWeight:700, color:"#fff", letterSpacing:"-0.5px", marginBottom:6 }}>
              Hey {JSON.parse(localStorage.getItem("user")||"{}").name?.split(" ")[0] || "there"} 👋
            </div>
            <div style={{ fontSize:15, color:"rgba(255,255,255,0.5)", fontWeight:300 }}>Where do you want to fly, ride or stay today?</div>
          </div>

          {/* AI banner */}
          <div onClick={()=>navigate("/ai")} style={{ background:"rgba(255,255,255,0.06)", border:`1px solid ${tab.accent}30`, borderRadius:14, padding:"12px 16px", marginBottom:24, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", transition:"all 0.2s" }}
            onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.1)"}}
            onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.06)"}}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:20 }}>🤖</span>
              <div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, color:"#fff" }}>Plan with Alvryn AI</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", marginTop:1 }}>Complete door-to-door trip planning · Any destination worldwide</div>
              </div>
            </div>
            <span style={{ color:tab.accent, fontSize:13, fontWeight:600 }}>Chat now →</span>
          </div>

          {/* Tab bar */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:6, marginBottom:24, background:"rgba(0,0,0,0.3)", borderRadius:14, padding:6 }}>
            {TABS.map(t => (
              <button key={t.id} className="tab-btn" onClick={()=>{setActiveTab(t.id);setFlights([]);setSearched(false);}}
                style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"9px 6px", borderRadius:9, cursor:"pointer", border:"none", position:"relative",
                  background: activeTab===t.id ? `${t.accent}20` : "transparent",
                  outline: activeTab===t.id ? `1px solid ${t.accent}40` : "none",
                  color: activeTab===t.id ? t.accent : "rgba(255,255,255,0.45)" }}>
                <span style={{ fontSize:18 }}>{t.icon}</span>
                <span style={{ fontSize:10, fontWeight:500 }}>{t.label}</span>
                {t.soon && <span style={{ fontSize:7, background:"rgba(251,191,36,0.15)", border:"1px solid rgba(251,191,36,0.3)", color:"#fbbf24", padding:"1px 4px", borderRadius:6, letterSpacing:"0.3px" }}>SOON</span>}
              </button>
            ))}
          </div>

          {/* ── FLIGHT FORM ── */}
          {activeTab==="flight" && (
            <div style={{ background:"rgba(0,0,0,0.4)", backdropFilter:"blur(20px)", borderRadius:20, padding:20, border:`1px solid ${tab.accent}20`, animation:"fadeUp 0.4s both" }}>
              {/* Trip type */}
              <div style={{ display:"flex", gap:6, marginBottom:16, background:"rgba(255,255,255,0.05)", borderRadius:10, padding:4 }}>
                {["oneway","roundtrip"].map(t=>(
                  <button key={t} onClick={()=>setTripType(t)} style={{ flex:1, padding:"8px", border:"none", borderRadius:7, fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:500, cursor:"pointer", transition:"all 0.2s",
                    background:tripType===t?`${tab.accent}20`:"transparent", color:tripType===t?tab.accent:"rgba(255,255,255,0.4)" }}>
                    {t==="oneway"?"One Way":"Round Trip"}
                  </button>
                ))}
                <div style={{ display:"flex", alignItems:"center", gap:6, marginLeft:"auto", background:"rgba(255,255,255,0.05)", borderRadius:7, padding:"4px 10px" }}>
                  <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontFamily:"'DM Sans',sans-serif" }}>IN</span>
                  <span style={{ fontSize:11, color:"rgba(255,255,255,0.6)", fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>Domestic</span>
                </div>
              </div>

              {/* City row */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:8, alignItems:"center", marginBottom:14 }}>
                <button className="city-btn" onClick={()=>setShowFromPicker(true)} style={{ background:"rgba(255,255,255,0.07)", border:`1px solid ${tab.accent}25`, borderRadius:14, padding:"14px 16px", cursor:"pointer", textAlign:"left" }}>
                  <span style={label}>FROM</span>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:26, fontWeight:700, color:"#fff", letterSpacing:"1px" }}>{fromCity.code}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginTop:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{fromCity.city}</div>
                </button>
                <button onClick={swapFlight} style={{ width:36, height:36, borderRadius:"50%", background:`${tab.accent}20`, border:`1px solid ${tab.accent}40`, color:tab.accent, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"transform 0.3s" }}
                  onMouseEnter={e=>e.currentTarget.style.transform="rotate(180deg)"}
                  onMouseLeave={e=>e.currentTarget.style.transform="rotate(0deg)"}>⇄</button>
                <button className="city-btn" onClick={()=>setShowToPicker(true)} style={{ background:"rgba(255,255,255,0.07)", border:`1px solid ${tab.accent}25`, borderRadius:14, padding:"14px 16px", cursor:"pointer", textAlign:"left" }}>
                  <span style={label}>TO</span>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:26, fontWeight:700, color:"#fff", letterSpacing:"1px" }}>{toCity.code}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginTop:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{toCity.city}</div>
                </button>
              </div>

              {/* Date + pax + class */}
              <div style={{ display:"grid", gridTemplateColumns: tripType==="roundtrip" ? "1fr 1fr" : "1fr", gap:8, marginBottom:12 }}>
                <div style={{ background:"rgba(255,255,255,0.06)", border:`1px solid ${tab.accent}20`, borderRadius:12, padding:"12px 14px" }}>
                  <span style={label}>DEPARTURE *</span>
                  <input type="date" value={date} min={today} onChange={e=>setDate(e.target.value)}
                    style={{ background:"transparent", border:"none", outline:"none", color:"#fff", fontFamily:"'DM Sans',sans-serif", fontSize:14, width:"100%", cursor:"pointer" }}/>
                </div>
                {tripType==="roundtrip" && (
                  <div style={{ background:"rgba(255,255,255,0.06)", border:`1px solid ${tab.accent}20`, borderRadius:12, padding:"12px 14px" }}>
                    <span style={label}>RETURN</span>
                    <input type="date" value={returnDate} min={date||today} onChange={e=>setReturnDate(e.target.value)}
                      style={{ background:"transparent", border:"none", outline:"none", color:"#fff", fontFamily:"'DM Sans',sans-serif", fontSize:14, width:"100%", cursor:"pointer" }}/>
                  </div>
                )}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
                <div style={{ background:"rgba(255,255,255,0.06)", border:`1px solid ${tab.accent}20`, borderRadius:12, padding:"12px 14px" }}>
                  <span style={label}>TRAVELLERS</span>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:2 }}>
                    <button onClick={()=>setPassengers(p=>Math.max(1,p-1))} style={{ width:26, height:26, borderRadius:"50%", background:`${tab.accent}20`, border:`1px solid ${tab.accent}40`, color:tab.accent, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1 }}>−</button>
                    <span style={{ fontFamily:"'Space Mono',monospace", fontSize:18, fontWeight:700, color:"#fff", minWidth:20, textAlign:"center" }}>{passengers}</span>
                    <button onClick={()=>setPassengers(p=>Math.min(9,p+1))} style={{ width:26, height:26, borderRadius:"50%", background:`${tab.accent}20`, border:`1px solid ${tab.accent}40`, color:tab.accent, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1 }}>+</button>
                  </div>
                </div>
                <div style={{ background:"rgba(255,255,255,0.06)", border:`1px solid ${tab.accent}20`, borderRadius:12, padding:"12px 14px" }}>
                  <span style={label}>CLASS</span>
                  <select value={cabinClass} onChange={e=>setCabinClass(e.target.value)}
                    style={{ background:"transparent", border:"none", outline:"none", color:"#fff", fontFamily:"'DM Sans',sans-serif", fontSize:14, width:"100%", cursor:"pointer", marginTop:2 }}>
                    {CLASSES.map(c=><option key={c} value={c} style={{color:"#1a1410"}}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Special fares */}
              <div style={{ marginBottom:16 }}>
                <span style={{ ...label, marginBottom:8 }}>SPECIAL FARES</span>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {["Regular","Student","Senior Citizen","Armed Forces","Doctor / Nurse"].map((fare,i) => (
                    <button key={fare} style={{ padding:"6px 14px", borderRadius:20, fontSize:12, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", transition:"all 0.2s",
                      background: i===0 ? `${tab.accent}25` : "rgba(255,255,255,0.05)",
                      border: i===0 ? `1px solid ${tab.accent}50` : "1px solid rgba(255,255,255,0.12)",
                      color: i===0 ? tab.accent : "rgba(255,255,255,0.5)" }}>
                      {fare}
                    </button>
                  ))}
                </div>
              </div>

              <button className="search-btn" onClick={handleFlightSearch}
                style={{ width:"100%", padding:"15px", border:"none", borderRadius:12, color:"#fff", fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:700, cursor:"pointer",
                  background:`linear-gradient(135deg,${tab.accent},${tab.accent2})`,
                  boxShadow:`0 8px 24px ${tab.accent}40` }}>
                Search Flights ✈
              </button>
              <p style={{ textAlign:"center", fontSize:11, color:"rgba(255,255,255,0.25)", marginTop:10 }}>Best prices on our partner site</p>
            </div>
          )}

          {/* ── BUS FORM ── */}
          {activeTab==="bus" && (
            <div style={{ background:"rgba(0,0,0,0.4)", backdropFilter:"blur(20px)", borderRadius:20, padding:20, border:`1px solid ${tab.accent}20`, animation:"fadeUp 0.4s both" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:8, alignItems:"center", marginBottom:14 }}>
                <button className="city-btn" onClick={()=>setShowBusFromPicker(true)} style={{ background:"rgba(255,255,255,0.07)", border:`1px solid ${tab.accent}25`, borderRadius:14, padding:"14px 16px", cursor:"pointer", textAlign:"left" }}>
                  <span style={label}>FROM</span>
                  <div style={{ fontSize:18, fontWeight:700, color:"#fff", marginTop:2 }}>{busFrom}</div>
                </button>
                <button onClick={()=>{const t=busFrom;setBusFrom(busTo);setBusTo(t);}} style={{ width:36, height:36, borderRadius:"50%", background:`${tab.accent}20`, border:`1px solid ${tab.accent}40`, color:tab.accent, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>⇄</button>
                <button className="city-btn" onClick={()=>setShowBusToPicker(true)} style={{ background:"rgba(255,255,255,0.07)", border:`1px solid ${tab.accent}25`, borderRadius:14, padding:"14px 16px", cursor:"pointer", textAlign:"left" }}>
                  <span style={label}>TO</span>
                  <div style={{ fontSize:18, fontWeight:700, color:"#fff", marginTop:2 }}>{busTo}</div>
                </button>
              </div>
              <div style={{ background:"rgba(255,255,255,0.06)", border:`1px solid ${tab.accent}20`, borderRadius:12, padding:"12px 14px", marginBottom:16 }}>
                <span style={label}>DATE OF JOURNEY</span>
                <input type="date" value={busDate} min={today} onChange={e=>setBusDate(e.target.value)}
                  style={{ background:"transparent", border:"none", outline:"none", color:"#fff", fontFamily:"'DM Sans',sans-serif", fontSize:14, width:"100%", cursor:"pointer" }}/>
              </div>
              <button className="search-btn" onClick={handleBusSearch}
                style={{ width:"100%", padding:"15px", border:"none", borderRadius:12, color:"#fff", fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:700, cursor:"pointer",
                  background:`linear-gradient(135deg,${tab.accent},${tab.accent2})`, boxShadow:`0 8px 24px ${tab.accent}40` }}>
                Search Buses 🚌
              </button>
              <p style={{ textAlign:"center", fontSize:11, color:"rgba(255,255,255,0.25)", marginTop:10 }}>Live seats & prices on RedBus</p>
            </div>
          )}

          {/* ── HOTEL FORM ── */}
          {activeTab==="hotel" && (
            <div style={{ background:"rgba(0,0,0,0.4)", backdropFilter:"blur(20px)", borderRadius:20, padding:20, border:`1px solid ${tab.accent}20`, animation:"fadeUp 0.4s both" }}>
              <div style={{ marginBottom:14 }}>
                <span style={label}>DESTINATION</span>
                <button className="city-btn" onClick={()=>setShowHotelPicker(true)}
                  style={{ width:"100%", background:"rgba(255,255,255,0.07)", border:`1px solid ${tab.accent}25`, borderRadius:14, padding:"14px 16px", cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:20 }}>🏨</span>
                    <div>
                      <div style={{ fontSize:16, fontWeight:600, color:"#fff" }}>{hotelCity}</div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:2 }}>Tap to change city</div>
                    </div>
                  </div>
                  <span style={{ color:"rgba(255,255,255,0.3)", fontSize:18 }}>›</span>
                </button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                <div style={{ background:"rgba(255,255,255,0.06)", border:`1px solid ${tab.accent}20`, borderRadius:12, padding:"12px 14px" }}>
                  <span style={label}>CHECK-IN *</span>
                  <input type="date" value={checkIn} min={today} onChange={e=>setCheckIn(e.target.value)}
                    style={{ background:"transparent", border:"none", outline:"none", color:"#fff", fontFamily:"'DM Sans',sans-serif", fontSize:14, width:"100%", cursor:"pointer" }}/>
                </div>
                <div style={{ background:"rgba(255,255,255,0.06)", border:`1px solid ${tab.accent}20`, borderRadius:12, padding:"12px 14px" }}>
                  <span style={label}>CHECK-OUT</span>
                  <input type="date" value={checkOut} min={checkIn||today} onChange={e=>setCheckOut(e.target.value)}
                    style={{ background:"transparent", border:"none", outline:"none", color:"#fff", fontFamily:"'DM Sans',sans-serif", fontSize:14, width:"100%", cursor:"pointer" }}/>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
                {[["Guests",hotelGuests,setHotelGuests],["Rooms",hotelRooms,setHotelRooms]].map(([lbl,val,setter])=>(
                  <div key={lbl} style={{ background:"rgba(255,255,255,0.06)", border:`1px solid ${tab.accent}20`, borderRadius:12, padding:"12px 14px" }}>
                    <span style={label}>{lbl.toUpperCase()}</span>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:2 }}>
                      <button onClick={()=>setter(v=>Math.max(1,v-1))} style={{ width:26,height:26,borderRadius:"50%",background:`${tab.accent}20`,border:`1px solid ${tab.accent}40`,color:tab.accent,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1 }}>−</button>
                      <span style={{ fontFamily:"'Space Mono',monospace",fontSize:18,fontWeight:700,color:"#fff",minWidth:20,textAlign:"center" }}>{val}</span>
                      <button onClick={()=>setter(v=>Math.min(10,v+1))} style={{ width:26,height:26,borderRadius:"50%",background:`${tab.accent}20`,border:`1px solid ${tab.accent}40`,color:tab.accent,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1 }}>+</button>
                    </div>
                  </div>
                ))}
              </div>
              <button className="search-btn" onClick={handleHotelSearch}
                style={{ width:"100%", padding:"15px", border:"none", borderRadius:12, color:"#1a1410", fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:700, cursor:"pointer",
                  background:`linear-gradient(135deg,${tab.accent},${tab.accent2})`, boxShadow:`0 8px 24px ${tab.accent}40` }}>
                Search Hotels 🏨
              </button>
              <p style={{ textAlign:"center", fontSize:11, color:"rgba(255,255,255,0.25)", marginTop:10 }}>Best prices on our partner site</p>
            </div>
          )}

          {/* ── TRAIN FORM ── */}
          {activeTab==="train" && (
            <div style={{ background:"rgba(0,0,0,0.4)", backdropFilter:"blur(20px)", borderRadius:20, padding:20, border:`1px solid ${tab.accent}20`, animation:"fadeUp 0.4s both" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:8, alignItems:"center", marginBottom:14 }}>
                <button className="city-btn" onClick={()=>setShowTrainFromPicker(true)} style={{ background:"rgba(255,255,255,0.07)", border:`1px solid ${tab.accent}25`, borderRadius:14, padding:"14px 16px", cursor:"pointer", textAlign:"left" }}>
                  <span style={label}>FROM</span>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:18, fontWeight:700, color:"#fff", marginTop:2 }}>{trainFrom.code}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{trainFrom.city}</div>
                </button>
                <button onClick={()=>{const t=trainFrom;setTrainFrom(trainTo);setTrainTo(t);}} style={{ width:36,height:36,borderRadius:"50%",background:`${tab.accent}20`,border:`1px solid ${tab.accent}40`,color:tab.accent,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>⇄</button>
                <button className="city-btn" onClick={()=>setShowTrainToPicker(true)} style={{ background:"rgba(255,255,255,0.07)", border:`1px solid ${tab.accent}25`, borderRadius:14, padding:"14px 16px", cursor:"pointer", textAlign:"left" }}>
                  <span style={label}>TO</span>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:18, fontWeight:700, color:"#fff", marginTop:2 }}>{trainTo.code}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{trainTo.city}</div>
                </button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
                <div style={{ background:"rgba(255,255,255,0.06)", border:`1px solid ${tab.accent}20`, borderRadius:12, padding:"12px 14px" }}>
                  <span style={label}>JOURNEY DATE</span>
                  <input type="date" value={trainDate} min={today} onChange={e=>setTrainDate(e.target.value)}
                    style={{ background:"transparent", border:"none", outline:"none", color:"#fff", fontFamily:"'DM Sans',sans-serif", fontSize:14, width:"100%", cursor:"pointer" }}/>
                </div>
                <div style={{ background:"rgba(255,255,255,0.06)", border:`1px solid ${tab.accent}20`, borderRadius:12, padding:"12px 14px" }}>
                  <span style={label}>CLASS</span>
                  <select value={trainClass} onChange={e=>setTrainClass(e.target.value)}
                    style={{ background:"transparent", border:"none", outline:"none", color:"#fff", fontFamily:"'DM Sans',sans-serif", fontSize:14, width:"100%", cursor:"pointer", marginTop:2 }}>
                    {["SL","3A","2A","1A","CC","2S"].map(c=><option key={c} value={c} style={{color:"#1a1410"}}>{c}</option>)}
                  </select>
                </div>
              </div>
              <button className="search-btn" onClick={handleTrainSearch}
                style={{ width:"100%", padding:"15px", border:"none", borderRadius:12, color:"#fff", fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:700, cursor:"pointer",
                  background:`linear-gradient(135deg,${tab.accent},${tab.accent2})`, boxShadow:`0 8px 24px ${tab.accent}40` }}>
                Search Trains 🚂
              </button>
              <p style={{ textAlign:"center", fontSize:11, color:"rgba(255,255,255,0.25)", marginTop:10 }}>Opens IRCTC with route pre-filled</p>
            </div>
          )}

          {/* ── CAB (soon) ── */}
          {activeTab==="cab" && (
            <div style={{ background:"rgba(0,0,0,0.4)", backdropFilter:"blur(20px)", borderRadius:20, padding:"48px 24px", border:`1px solid ${tab.accent}20`, textAlign:"center", animation:"fadeUp 0.4s both" }}>
              <div style={{ fontSize:52, marginBottom:14 }}>🚖</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:20, fontWeight:700, color:"#fff", marginBottom:8 }}>Cab Booking</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)", lineHeight:1.7, maxWidth:300, margin:"0 auto 20px" }}>We're building something great. Cab booking with real-time tracking is coming soon!</div>
              <div style={{ display:"inline-block", background:`${tab.accent}15`, border:`1px solid ${tab.accent}30`, color:tab.accent, padding:"6px 16px", borderRadius:20, fontSize:11, letterSpacing:"1px" }}>✦ Coming Soon</div>
            </div>
          )}
        </div>
      </div>

      {/* ── DB FLIGHT RESULTS (below hero) ── */}
      {activeTab === "flight" && (
        <div style={{ maxWidth:680, margin:"0 auto", padding:"0 20px 80px" }}>
          {/* Also search DB */}
          <div style={{ textAlign:"center", padding:"20px 0 4px" }}>
            <button onClick={searchFlights} style={{ padding:"10px 28px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:12, color:"rgba(255,255,255,0.6)", fontFamily:"'DM Sans',sans-serif", fontSize:13, cursor:"pointer", transition:"all 0.2s" }}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.1)"}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.06)"}}>
              🔍 Also check our database flights
            </button>
          </div>

          {loading && (
            <div style={{ textAlign:"center", padding:"40px 0" }}>
              <div style={{ width:40, height:40, border:"2px solid rgba(255,255,255,0.1)", borderTop:"2px solid rgba(255,255,255,0.6)", borderRadius:"50%", animation:"spin 1s linear infinite", margin:"0 auto 14px" }}/>
              <p style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:"rgba(255,255,255,0.3)", letterSpacing:"2px" }}>Scanning flight paths...</p>
            </div>
          )}

          {!loading && flights.length > 0 && (
            <>
              {/* Filters */}
              <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:16, margin:"16px 0", backdropFilter:"blur(12px)" }}>
                <div style={{ fontSize:10, letterSpacing:"2px", textTransform:"uppercase", color:"rgba(255,255,255,0.3)", marginBottom:12, fontFamily:"'Space Mono',monospace" }}>✦ Filter & Sort</div>
                <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4, marginBottom:10 }}>
                  {[["any","All times"],["morning","Morning"],["afternoon","Afternoon"],["evening","Evening"],["price","Cheapest"],["departure","Earliest"],["duration","Fastest"]].map(([val,lbl])=>{
                    const isTime=["any","morning","afternoon","evening"].includes(val);
                    const active=isTime?filterTime===val:sortBy===val;
                    return (
                      <button key={val} onClick={()=>isTime?setFilterTime(val):setSortBy(val)}
                        style={{ flexShrink:0, background:active?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.05)", border:active?"1px solid rgba(255,255,255,0.3)":"1px solid rgba(255,255,255,0.08)", borderRadius:20, padding:"6px 14px", color:active?"#fff":"rgba(255,255,255,0.4)", fontFamily:"'DM Sans',sans-serif", fontSize:12, cursor:"pointer", whiteSpace:"nowrap" }}>
                        {lbl}
                      </button>
                    );
                  })}
                </div>
                <input type="range" min="1000" max={filterMaxPrice+1000} step="500" value={filterMaxPrice} onChange={e=>setFilterMaxPrice(Number(e.target.value))}
                  style={{ width:"100%", height:3, appearance:"none", background:"linear-gradient(90deg,rgba(255,255,255,0.6),rgba(255,255,255,0.2))", borderRadius:2, outline:"none", cursor:"pointer" }}/>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:6 }}>
                  <span>₹1,000</span><span>Max ₹{filterMaxPrice.toLocaleString()}</span>
                </div>
              </div>
              <p style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:"2px", textTransform:"uppercase", color:"rgba(255,255,255,0.3)", marginBottom:14 }}>
                {filtered.length} of {flights.length} flights
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {filtered.map(flight => (
                  <div key={flight.id} className="flight-card" style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:18, padding:"16px 18px", backdropFilter:"blur(12px)" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.85)" }}>{flight.airline}</span>
                      <span style={{ padding:"3px 8px", borderRadius:20, fontSize:9, background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.25)", color:"#4ade80" }}>Non-stop</span>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                      <div style={{ textAlign:"center" }}>
                        <div style={{ fontFamily:"'Space Mono',monospace", fontSize:22, fontWeight:700, color:"#fff" }}>{formatTime(flight.departure_time)}</div>
                        <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{flight.from_city?.slice(0,3).toUpperCase()}</div>
                      </div>
                      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"0 16px" }}>
                        <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>{calcDuration(flight.departure_time, flight.arrival_time)}</div>
                        <div style={{ width:"100%", height:1, background:"linear-gradient(90deg,rgba(255,255,255,0.1),rgba(255,255,255,0.4),rgba(255,255,255,0.1))", position:"relative" }}>
                          <span style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", fontSize:12, color:"rgba(255,255,255,0.7)" }}>✈</span>
                        </div>
                        <div style={{ fontSize:9, color:"rgba(74,222,128,0.7)" }}>Direct</div>
                      </div>
                      <div style={{ textAlign:"center" }}>
                        <div style={{ fontFamily:"'Space Mono',monospace", fontSize:22, fontWeight:700, color:"#fff" }}>{formatTime(flight.arrival_time)}</div>
                        <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{flight.to_city?.slice(0,3).toUpperCase()}</div>
                      </div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:12, borderTop:"1px solid rgba(255,255,255,0.07)" }}>
                      <div>
                        <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:"1px", textTransform:"uppercase" }}>from</div>
                        <div style={{ fontFamily:"'Space Mono',monospace", fontSize:22, fontWeight:700, color:"#fff" }}>₹{(flight.price*passengers).toLocaleString()}</div>
                        <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", marginTop:1 }}>{passengers} pax · {cabinClass}</div>
                      </div>
                      <button onClick={()=>handleBook(flight)}
                        style={{ background:"linear-gradient(135deg,#c9a84c,#f0d080)", border:"none", color:"#1a1410", padding:"11px 22px", borderRadius:12, fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:700, cursor:"pointer", boxShadow:"0 6px 18px rgba(201,168,76,0.35)" }}>
                        Book →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function PaymentModal({ flight, passengerName, passengers, cabinClass, onSuccess, onCancel }) {
  const [step, setStep] = useState("payment");
  const [payMethod, setPayMethod] = useState("card");
  const [cardNo, setCardNo] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const bookingId = useRef("ALV" + Date.now().toString(36).toUpperCase().slice(-6));
  const totalPrice = flight.price * passengers;
  const formatCard = v => v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const formatExpiry = v => { const d=v.replace(/\D/g,"").slice(0,4); return d.length>=3?d.slice(0,2)+"/"+d.slice(2):d; };
  const handlePay = () => {
    if (payMethod==="card"&&(!cardNo||!expiry||!cvv)) { alert("Please fill all card details."); return; }
    setStep("processing"); setTimeout(() => setStep("success"), 2500);
  };
  if (step==="processing") return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"#1a1410",borderRadius:20,padding:"48px 32px",textAlign:"center",border:"1px solid rgba(201,168,76,0.2)"}}>
        <div style={{width:48,height:48,border:"3px solid rgba(201,168,76,0.2)",borderTop:"3px solid #c9a84c",borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 16px"}}/>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"rgba(255,255,255,0.5)",letterSpacing:"2px"}}>Processing payment...</p>
      </div>
    </div>
  );
  if (step==="success") return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#1a1410",borderRadius:20,padding:"36px 28px",textAlign:"center",border:"1px solid rgba(201,168,76,0.2)",maxWidth:400,width:"100%"}}>
        <div style={{fontSize:52,marginBottom:14}}>🎉</div>
        <h3 style={{fontFamily:"'DM Sans',sans-serif",fontSize:20,fontWeight:700,color:"#c9a84c",marginBottom:8}}>Booking Confirmed!</h3>
        <p style={{fontSize:13,color:"rgba(255,255,255,0.5)",marginBottom:20,lineHeight:1.6}}>{flight.airline}<br/>{flight.from_city} → {flight.to_city}<br/>Passenger: {passengerName}</p>
        <div style={{background:"rgba(201,168,76,0.08)",border:"1px solid rgba(201,168,76,0.2)",borderRadius:12,padding:14,marginBottom:20}}>
          <div style={{fontSize:10,color:"rgba(201,168,76,0.55)",letterSpacing:"2px",fontFamily:"'Space Mono',monospace",marginBottom:4}}>BOOKING ID</div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:18,fontWeight:700,color:"#c9a84c",letterSpacing:"3px"}}>{bookingId.current}</div>
        </div>
        <button onClick={onSuccess} style={{width:"100%",padding:14,background:"linear-gradient(135deg,#c9a84c,#f0d080)",border:"none",borderRadius:12,color:"#1a1410",fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:700,cursor:"pointer"}}>View My Bookings →</button>
      </div>
    </div>
  );
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center",backdropFilter:"blur(8px)"}} onClick={onCancel}>
      <div style={{background:"#1a1410",borderRadius:"24px 24px 0 0",padding:0,width:"100%",maxWidth:460,boxShadow:"0 -24px 80px rgba(0,0,0,0.4)",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{background:"linear-gradient(135deg,#c9a84c,#f0d080)",padding:"16px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",borderRadius:"24px 24px 0 0"}}>
          <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:800,color:"#1a1410"}}>ALVRYN Pay</span>
          <span style={{fontSize:11,color:"rgba(26,20,16,0.6)"}}>🔒 256-bit SSL</span>
        </div>
        <div style={{padding:"22px"}}>
          <div style={{background:"rgba(201,168,76,0.08)",border:"1px solid rgba(201,168,76,0.18)",borderRadius:14,padding:16,textAlign:"center",marginBottom:20}}>
            <div style={{fontSize:10,letterSpacing:"2px",color:"rgba(201,168,76,0.55)",fontFamily:"'Space Mono',monospace",marginBottom:6}}>TOTAL AMOUNT</div>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:28,fontWeight:700,color:"#c9a84c"}}>₹{totalPrice.toLocaleString()}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:4}}>{flight.from_city} → {flight.to_city} · {passengers} pax · {cabinClass}</div>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:18}}>
            {[["card","💳 Card"],["upi","⚡ UPI"],["netbanking","🏦 Net Banking"]].map(([id,lbl])=>(
              <button key={id} onClick={()=>setPayMethod(id)} style={{flex:1,padding:"10px 6px",background:payMethod===id?"rgba(201,168,76,0.15)":"rgba(255,255,255,0.04)",border:`1px solid ${payMethod===id?"rgba(201,168,76,0.4)":"rgba(255,255,255,0.08)"}`,borderRadius:10,color:payMethod===id?"#c9a84c":"rgba(255,255,255,0.5)",fontFamily:"'DM Sans',sans-serif",fontSize:12,cursor:"pointer",textAlign:"center"}}>{lbl}</button>
            ))}
          </div>
          {payMethod==="card" && (
            <>
              <label style={{fontSize:10,color:"rgba(255,255,255,0.4)",letterSpacing:"1.5px",textTransform:"uppercase",display:"block",marginBottom:7,fontFamily:"'Space Mono',monospace"}}>Card Number</label>
              <input style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(201,168,76,0.2)",borderRadius:10,padding:"12px 14px",color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:15,outline:"none",marginBottom:12,letterSpacing:"1px"}} placeholder="4111 1111 1111 1111" value={cardNo} onChange={e=>setCardNo(formatCard(e.target.value))} maxLength={19}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div>
                  <label style={{fontSize:10,color:"rgba(255,255,255,0.4)",letterSpacing:"1.5px",textTransform:"uppercase",display:"block",marginBottom:7,fontFamily:"'Space Mono',monospace"}}>Expiry</label>
                  <input style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(201,168,76,0.2)",borderRadius:10,padding:"12px 14px",color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:15,outline:"none"}} placeholder="MM/YY" value={expiry} onChange={e=>setExpiry(formatExpiry(e.target.value))} maxLength={5}/>
                </div>
                <div>
                  <label style={{fontSize:10,color:"rgba(255,255,255,0.4)",letterSpacing:"1.5px",textTransform:"uppercase",display:"block",marginBottom:7,fontFamily:"'Space Mono',monospace"}}>CVV</label>
                  <input style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(201,168,76,0.2)",borderRadius:10,padding:"12px 14px",color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:15,outline:"none"}} placeholder="•••" type="password" value={cvv} onChange={e=>setCvv(e.target.value.slice(0,3))} maxLength={3}/>
                </div>
              </div>
            </>
          )}
          {payMethod==="upi" && (
            <>
              <label style={{fontSize:10,color:"rgba(255,255,255,0.4)",letterSpacing:"1.5px",textTransform:"uppercase",display:"block",marginBottom:7,fontFamily:"'Space Mono',monospace"}}>UPI ID</label>
              <input style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(201,168,76,0.2)",borderRadius:10,padding:"12px 14px",color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:15,outline:"none"}} placeholder="yourname@upi"/>
            </>
          )}
          {payMethod==="netbanking" && (
            <>
              <label style={{fontSize:10,color:"rgba(255,255,255,0.4)",letterSpacing:"1.5px",textTransform:"uppercase",display:"block",marginBottom:7,fontFamily:"'Space Mono',monospace"}}>Select Bank</label>
              <select style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(201,168,76,0.2)",borderRadius:10,padding:"12px 14px",color:"#fff",fontFamily:"'DM Sans',sans-serif",fontSize:14,outline:"none",cursor:"pointer"}}>
                <option style={{color:"#1a1410"}}>SBI — State Bank of India</option>
                <option style={{color:"#1a1410"}}>HDFC Bank</option>
                <option style={{color:"#1a1410"}}>ICICI Bank</option>
                <option style={{color:"#1a1410"}}>Axis Bank</option>
                <option style={{color:"#1a1410"}}>Kotak Mahindra Bank</option>
              </select>
            </>
          )}
          <button onClick={handlePay} style={{width:"100%",padding:15,background:"linear-gradient(135deg,#c9a84c,#f0d080)",border:"none",borderRadius:12,color:"#1a1410",fontFamily:"'DM Sans',sans-serif",fontSize:16,fontWeight:700,cursor:"pointer",marginTop:16,boxShadow:"0 8px 24px rgba(201,168,76,0.35)"}}>
            Pay ₹{totalPrice.toLocaleString()} →
          </button>
          <p style={{textAlign:"center",fontSize:11,color:"rgba(255,255,255,0.25)",marginTop:12,fontFamily:"'Space Mono',monospace"}}>🔒 Demo payment. No real money charged.</p>
        </div>
      </div>
    </div>
  );
}