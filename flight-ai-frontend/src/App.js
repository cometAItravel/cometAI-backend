import React, { useState, useEffect } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import MyBookings from "./pages/MyBookings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import LandingPage from "./pages/LandingPage";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;800&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #01020a; color: #e8eaf6; font-family: 'DM Sans', sans-serif; min-height: 100vh; overflow-x: hidden; }

  .stars-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; background: radial-gradient(ellipse at 20% 50%, rgba(63,43,150,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(25,90,180,0.12) 0%, transparent 55%), radial-gradient(ellipse at 60% 80%, rgba(100,30,140,0.10) 0%, transparent 50%), #01020a; }
  .star { position: absolute; border-radius: 50%; background: white; animation: twinkle var(--d, 3s) ease-in-out infinite var(--delay, 0s); }
  @keyframes twinkle { 0%, 100% { opacity: var(--min-op, 0.2); transform: scale(1); } 50% { opacity: 1; transform: scale(1.3); } }

  .shooting-star { position: fixed; top: 0; left: 0; width: 2px; height: 2px; background: white; border-radius: 50%; pointer-events: none; z-index: 2; }
  .shooting-star::after { content: ''; position: absolute; top: 50%; right: 0; transform: translateY(-50%); width: 120px; height: 1px; background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(165,180,252,0.6) 50%, white 100%); border-radius: 2px; }
  @keyframes shoot { 0% { transform: translate(0,0) rotate(var(--angle)); opacity: 1; } 70% { opacity: 1; } 100% { transform: translate(var(--tx),var(--ty)) rotate(var(--angle)); opacity: 0; } }

  .page-wrap { position: relative; z-index: 1; min-height: 100vh; padding: 0 24px 60px; max-width: 1100px; margin: 0 auto; }

  .nav { display: flex; align-items: center; justify-content: space-between; padding: 28px 0 40px; border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 48px; }
  .nav-logo { font-family: 'Orbitron', sans-serif; font-size: 22px; font-weight: 800; letter-spacing: 1px; background: linear-gradient(90deg, #818cf8, #c084fc, #38bdf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .nav-logo span { font-size: 13px; font-family: 'DM Sans', sans-serif; font-weight: 300; display: block; letter-spacing: 3px; background: linear-gradient(90deg, #818cf8aa, #c084fcaa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-top: 2px; }
  .nav-actions { display: flex; gap: 12px; align-items: center; }
  .btn-ghost { background: transparent; border: 1px solid rgba(129,140,248,0.35); color: #a5b4fc; padding: 9px 20px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 14px; cursor: pointer; transition: all 0.2s; }
  .btn-ghost:hover { background: rgba(129,140,248,0.1); border-color: rgba(129,140,248,0.6); color: #c7d2fe; }
  .btn-logout { background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5; padding: 9px 20px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 14px; cursor: pointer; transition: all 0.2s; }
  .btn-logout:hover { background: rgba(239,68,68,0.22); }

  .hero { text-align: center; margin-bottom: 48px; animation: fadeUp 0.7s ease both; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  .hero-eyebrow { font-size: 11px; letter-spacing: 4px; text-transform: uppercase; color: #818cf8; margin-bottom: 16px; font-weight: 500; }
  .hero-title { font-family: 'Orbitron', sans-serif; font-size: clamp(28px, 5vw, 48px); font-weight: 800; line-height: 1.15; background: linear-gradient(135deg, #e0e7ff 0%, #a5b4fc 40%, #c084fc 70%, #38bdf8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 16px; letter-spacing: 1px; }
  .hero-sub { font-size: 15px; color: rgba(180,190,255,0.55); font-weight: 300; }

  .mode-toggle { display: flex; justify-content: center; margin-bottom: 28px; }
  .mode-btn { padding: 10px 28px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid rgba(129,140,248,0.25); background: transparent; color: rgba(165,180,252,0.5); transition: all 0.2s; }
  .mode-btn:first-child { border-radius: 10px 0 0 10px; }
  .mode-btn:last-child { border-radius: 0 10px 10px 0; border-left: none; }
  .mode-btn.active { background: rgba(99,102,241,0.2); border-color: rgba(129,140,248,0.5); color: #a5b4fc; }

  .structured-search { max-width: 780px; margin: 0 auto 40px; }
  .search-fields { display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 12px; align-items: end; }
  .field-group { display: flex; flex-direction: column; gap: 8px; }
  .field-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: rgba(165,180,252,0.45); font-weight: 500; padding-left: 4px; }
  .field-select, .field-date { background: rgba(255,255,255,0.04); border: 1px solid rgba(129,140,248,0.2); border-radius: 12px; padding: 13px 16px; color: #e0e7ff; font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; transition: all 0.2s; cursor: pointer; width: 100%; appearance: none; -webkit-appearance: none; }
  .field-select:focus, .field-date:focus { border-color: rgba(129,140,248,0.55); background: rgba(129,140,248,0.06); }
  .field-select option { background: #0d0e1a; color: #e0e7ff; }
  .field-date::-webkit-calendar-picker-indicator { filter: invert(0.7) sepia(1) saturate(3) hue-rotate(200deg); cursor: pointer; }
  .select-wrap { position: relative; }
  .select-wrap::after { content: '▾'; position: absolute; right: 14px; top: 50%; transform: translateY(-50%); color: rgba(165,180,252,0.4); font-size: 12px; pointer-events: none; }
  .btn-search-big { background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; color: white; padding: 13px 32px; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 500; cursor: pointer; transition: all 0.2s; white-space: nowrap; height: 50px; }
  .btn-search-big:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(99,102,241,0.4); }

  .ai-search-wrap { max-width: 680px; margin: 0 auto 40px; }
  .search-box { display: flex; align-items: center; background: rgba(255,255,255,0.04); border: 1px solid rgba(129,140,248,0.25); border-radius: 16px; padding: 6px 6px 6px 20px; gap: 12px; transition: border-color 0.2s; }
  .search-box:focus-within { border-color: rgba(129,140,248,0.6); box-shadow: 0 0 0 3px rgba(129,140,248,0.08); }
  .search-icon { font-size: 18px; opacity: 0.5; flex-shrink: 0; }
  .search-input { flex: 1; background: transparent; border: none; outline: none; color: #e0e7ff; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 300; }
  .search-input::placeholder { color: rgba(165,180,252,0.35); }
  .btn-search { background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; color: white; padding: 12px 28px; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
  .btn-search:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(99,102,241,0.35); }
  .search-hint { text-align: center; margin-top: 12px; font-size: 12px; color: rgba(165,180,252,0.3); }

  .filters-bar { margin-bottom: 28px; background: rgba(255,255,255,0.02); border: 1px solid rgba(129,140,248,0.12); border-radius: 16px; padding: 20px 24px; }
  .filters-title { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: rgba(165,180,252,0.4); margin-bottom: 16px; }
  .filters-row { display: flex; gap: 16px; align-items: flex-end; flex-wrap: wrap; }
  .filter-group { display: flex; flex-direction: column; gap: 6px; }
  .filter-label { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(165,180,252,0.4); }
  .filter-select { background: rgba(255,255,255,0.04); border: 1px solid rgba(129,140,248,0.18); border-radius: 8px; padding: 8px 12px; color: #e0e7ff; font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none; cursor: pointer; appearance: none; -webkit-appearance: none; min-width: 130px; }
  .filter-select option { background: #0d0e1a; }
  .price-range-wrap { display: flex; flex-direction: column; gap: 6px; }
  .price-range-labels { display: flex; justify-content: space-between; font-size: 11px; color: rgba(165,180,252,0.4); }
  .price-slider { -webkit-appearance: none; width: 180px; height: 3px; background: linear-gradient(90deg, #6366f1, #8b5cf6); border-radius: 2px; outline: none; cursor: pointer; }
  .price-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; background: #a5b4fc; border-radius: 50%; cursor: pointer; }
  .sort-select { background: rgba(255,255,255,0.04); border: 1px solid rgba(129,140,248,0.18); border-radius: 8px; padding: 7px 12px; color: #a5b4fc; font-family: 'DM Sans', sans-serif; font-size: 12px; outline: none; cursor: pointer; appearance: none; }
  .sort-select option { background: #0d0e1a; }
  .btn-clear-filters { background: transparent; border: 1px solid rgba(239,68,68,0.25); color: rgba(252,165,165,0.6); padding: 8px 16px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 12px; cursor: pointer; transition: all 0.2s; }
  .btn-clear-filters:hover { background: rgba(239,68,68,0.1); color: #fca5a5; }

  .results-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  .results-label { font-family: 'Orbitron', sans-serif; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: rgba(129,140,248,0.5); }
  .flights-grid { display: flex; flex-direction: column; gap: 16px; }
  .flight-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 22px 28px; transition: all 0.25s; position: relative; overflow: hidden; }
  .flight-card::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(99,102,241,0.04) 0%, transparent 60%); pointer-events: none; }
  .flight-card:hover { border-color: rgba(129,140,248,0.3); background: rgba(255,255,255,0.05); transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.4); }
  .card-main { display: grid; grid-template-columns: 160px 1fr auto; align-items: center; gap: 20px; }
  .airline-name { font-family: 'Orbitron', sans-serif; font-size: 12px; font-weight: 600; color: #c7d2fe; letter-spacing: 1px; margin-bottom: 4px; }
  .airline-code { font-size: 11px; color: rgba(165,180,252,0.4); letter-spacing: 1px; }
  .stops-badge { display: inline-block; margin-top: 8px; padding: 3px 8px; border-radius: 20px; font-size: 10px; background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.2); color: #6ee7b7; }
  .flight-timeline { display: flex; align-items: center; gap: 16px; flex: 1; justify-content: center; }
  .time-block { text-align: center; min-width: 60px; }
  .time-value { font-family: 'Orbitron', sans-serif; font-size: 20px; font-weight: 800; color: #e0e7ff; letter-spacing: 1px; }
  .time-city { font-size: 11px; color: rgba(165,180,252,0.45); margin-top: 3px; letter-spacing: 1px; }
  .time-date { font-size: 10px; color: rgba(165,180,252,0.3); margin-top: 2px; }
  .timeline-line { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 100px; }
  .timeline-duration { font-size: 11px; color: rgba(165,180,252,0.5); }
  .timeline-bar { width: 100%; display: flex; align-items: center; gap: 6px; }
  .timeline-bar-line { flex: 1; height: 1px; background: linear-gradient(90deg, rgba(129,140,248,0.2), rgba(192,132,252,0.4), rgba(129,140,248,0.2)); }
  .timeline-stops-text { font-size: 10px; color: rgba(251,191,36,0.6); }
  .price-action { text-align: right; min-width: 140px; }
  .price-label-small { font-size: 10px; color: rgba(165,180,252,0.35); letter-spacing: 1px; margin-bottom: 4px; }
  .price-amount { font-family: 'Orbitron', sans-serif; font-size: 22px; font-weight: 800; background: linear-gradient(135deg, #a5f3fc, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 12px; }
  .btn-book { background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2)); border: 1px solid rgba(129,140,248,0.4); color: #a5b4fc; padding: 10px 22px; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; display: block; width: 100%; }
  .btn-book:hover { background: linear-gradient(135deg, rgba(99,102,241,0.5), rgba(139,92,246,0.5)); border-color: rgba(129,140,248,0.7); color: #e0e7ff; transform: translateY(-1px); }

  /* PAYMENT MODAL */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 100; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(6px); animation: fadeIn 0.2s ease; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .payment-card { background: #0a0b18; border: 1px solid rgba(129,140,248,0.2); border-radius: 24px; width: 100%; max-width: 460px; box-shadow: 0 32px 80px rgba(0,0,0,0.7); animation: slideUp 0.3s ease; overflow: hidden; }
  @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }

  .payment-header { background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15)); border-bottom: 1px solid rgba(129,140,248,0.15); padding: 24px 28px; }
  .payment-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
  .payment-brand-name { font-family: 'Orbitron', sans-serif; font-size: 14px; font-weight: 800; background: linear-gradient(90deg, #818cf8, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; letter-spacing: 1px; }
  .payment-secure { font-size: 10px; color: rgba(110,231,183,0.7); letter-spacing: 1px; margin-left: auto; }
  .payment-flight-summary { background: rgba(255,255,255,0.04); border-radius: 12px; padding: 14px 16px; }
  .payment-route { font-family: 'Orbitron', sans-serif; font-size: 16px; font-weight: 800; color: #e0e7ff; letter-spacing: 2px; margin-bottom: 6px; }
  .payment-details-row { display: flex; justify-content: space-between; align-items: center; }
  .payment-airline { font-size: 12px; color: rgba(165,180,252,0.5); }
  .payment-amount { font-family: 'Orbitron', sans-serif; font-size: 20px; font-weight: 800; background: linear-gradient(135deg, #a5f3fc, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

  .payment-body { padding: 24px 28px; }
  .pay-input-group { margin-bottom: 16px; }
  .pay-input-label { display: block; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(165,180,252,0.45); margin-bottom: 8px; }
  .pay-input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(129,140,248,0.18); border-radius: 10px; padding: 12px 16px; color: #e0e7ff; font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; transition: all 0.2s; letter-spacing: 0.5px; }
  .pay-input:focus { border-color: rgba(129,140,248,0.55); background: rgba(129,140,248,0.06); box-shadow: 0 0 0 3px rgba(129,140,248,0.08); }
  .pay-input::placeholder { color: rgba(165,180,252,0.2); }
  .pay-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  .test-card-hint { background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.2); border-radius: 10px; padding: 10px 14px; margin-bottom: 20px; font-size: 12px; color: rgba(251,191,36,0.8); line-height: 1.6; }

  .btn-pay { width: 100%; padding: 16px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; border-radius: 12px; color: white; font-family: 'DM Sans', sans-serif; font-size: 16px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
  .btn-pay:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(99,102,241,0.5); }
  .btn-pay:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
  .btn-pay-cancel { width: 100%; padding: 12px; background: transparent; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; color: rgba(165,180,252,0.4); font-family: 'DM Sans', sans-serif; font-size: 14px; cursor: pointer; transition: all 0.2s; margin-top: 10px; }
  .btn-pay-cancel:hover { border-color: rgba(255,255,255,0.15); color: #a5b4fc; }

  .processing-wrap { text-align: center; padding: 48px 28px; }
  .processing-spinner { width: 56px; height: 56px; margin: 0 auto 24px; border: 3px solid rgba(129,140,248,0.15); border-top: 3px solid #818cf8; border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .processing-text { font-family: 'Orbitron', sans-serif; font-size: 13px; letter-spacing: 2px; color: rgba(165,180,252,0.7); }

  .success-wrap { text-align: center; padding: 40px 28px; }
  .success-icon { font-size: 56px; margin-bottom: 16px; animation: popIn 0.4s ease; }
  @keyframes popIn { from { transform: scale(0); } to { transform: scale(1); } }
  .success-title { font-family: 'Orbitron', sans-serif; font-size: 18px; font-weight: 800; background: linear-gradient(135deg, #6ee7b7, #38bdf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 8px; letter-spacing: 1px; }
  .success-sub { font-size: 13px; color: rgba(165,180,252,0.5); margin-bottom: 24px; font-weight: 300; }
  .booking-id-box { background: rgba(110,231,183,0.08); border: 1px solid rgba(110,231,183,0.2); border-radius: 12px; padding: 16px; margin-bottom: 24px; }
  .booking-id-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: rgba(110,231,183,0.5); margin-bottom: 6px; }
  .booking-id-value { font-family: 'Orbitron', sans-serif; font-size: 22px; font-weight: 800; color: #6ee7b7; letter-spacing: 4px; }
  .btn-success { background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; color: white; padding: 14px 32px; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
  .btn-success:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,0.4); }

  .empty-state { text-align: center; padding: 80px 20px; color: rgba(165,180,252,0.25); }
  .empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.4; }
  .empty-text { font-size: 14px; letter-spacing: 0.5px; font-family: 'Orbitron', sans-serif; }
  .loading { text-align: center; padding: 60px; color: rgba(129,140,248,0.6); font-family: 'Orbitron', sans-serif; font-size: 12px; letter-spacing: 3px; animation: pulse 1.5s ease infinite; }
  @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
`;

const CITIES = ["Bangalore","Mumbai","Delhi","Chennai","Hyderabad","Kolkata","Goa","Pune","Kochi","Ahmedabad","Jaipur","Varanasi","Dubai","Singapore"];
const AIRLINES = ["All Airlines","IndiGo","Air India","SpiceJet","Akasa Air","Air India Express"];
const CITY_CODES = {bangalore:'BLR',mumbai:'BOM',delhi:'DEL',chennai:'MAA',hyderabad:'HYD',kolkata:'CCU',goa:'GOI',pune:'PNQ',dubai:'DXB',kochi:'COK',ahmedabad:'AMD',jaipur:'JAI',varanasi:'VNS',singapore:'SIN'};

const generateBookingId = () => 'CMT' + Array.from({length:6}, ()=>'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random()*36)]).join('');

function Stars() {
  const stars = Array.from({length:80},(_,i)=>({id:i,x:Math.random()*100,y:Math.random()*100,size:Math.random()*2+0.5,duration:Math.random()*4+2,delay:Math.random()*4,minOp:Math.random()*0.15+0.05}));
  return <div className="stars-bg">{stars.map(s=><div key={s.id} className="star" style={{left:`${s.x}%`,top:`${s.y}%`,width:s.size,height:s.size,'--d':`${s.duration}s`,'--delay':`${s.delay}s`,'--min-op':s.minOp}}/>)}</div>;
}

function ShootingStars() {
  const [stars,setStars]=useState([]);
  useEffect(()=>{
    let id=0;
    const launch=()=>{
      const sx=Math.random()*70,sy=Math.random()*40,dist=400+Math.random()*300,ang=30+Math.random()*20,rad=(ang*Math.PI)/180;
      const star={id:id++,x:sx,y:sy,tx:Math.cos(rad)*dist,ty:Math.sin(rad)*dist,angle:ang,duration:800+Math.random()*600};
      setStars(p=>[...p,star]);
      setTimeout(()=>setStars(p=>p.filter(s=>s.id!==star.id)),star.duration+100);
      setTimeout(launch,2000+Math.random()*3000);
    };
    const t=setTimeout(launch,1500);
    return ()=>clearTimeout(t);
  },[]);
  return <>{stars.map(s=><div key={s.id} className="shooting-star" style={{left:`${s.x}%`,top:`${s.y}%`,'--angle':`${s.angle}deg`,'--tx':`${s.tx}px`,'--ty':`${s.ty}px`,animation:`shoot ${s.duration}ms ease-out forwards`}}/>)}</>;
}

function formatTime(dt){if(!dt)return"--:--";return new Date(dt).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false});}
function formatDate(dt){if(!dt)return"";return new Date(dt).toLocaleDateString("en-IN",{day:"numeric",month:"short"});}
function calcDuration(dep,arr){if(!dep||!arr)return"";const d=(new Date(arr)-new Date(dep))/60000;return`${Math.floor(d/60)}h ${d%60>0?d%60+"m":""}`.trim();}

// ── Payment Modal ──────────────────────────────────────
function PaymentModal({flight, onSuccess, onCancel}) {
  const [step,setStep]       = useState("form");
  const [name,setName]       = useState("");
  const [card,setCard]       = useState("");
  const [expiry,setExpiry]   = useState("");
  const [cvv,setCvv]         = useState("");
  const [bookingId,setBid]   = useState("");

  const fmtCard  = v => v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const fmtExp   = v => { const n=v.replace(/\D/g,"").slice(0,4); return n.length>=3?n.slice(0,2)+"/"+n.slice(2):n; };

  const pay = async () => {
    if(!name.trim()){alert("Enter passenger name");return;}
    if(card.replace(/\s/g,"").length<16){alert("Enter valid 16-digit card");return;}
    if(expiry.length<5){alert("Enter expiry MM/YY");return;}
    if(cvv.length<3){alert("Enter 3-digit CVV");return;}
    setStep("processing");
    setTimeout(async()=>{
      const id=generateBookingId();
      setBid(id);
      await onSuccess(name,id);
      setStep("success");
    },2500);
  };

  return (
    <div className="modal-overlay" onClick={step==="form"?onCancel:undefined}>
      <div className="payment-card" onClick={e=>e.stopPropagation()}>

        <div className="payment-header">
          <div className="payment-brand">
            <span style={{fontSize:20}}>☄️</span>
            <span className="payment-brand-name">COMETAI PAY</span>
            <span className="payment-secure">🔒 SECURE</span>
          </div>
          <div className="payment-flight-summary">
            <div className="payment-route">
              {CITY_CODES[flight.from_city?.toLowerCase()]||flight.from_city?.slice(0,3).toUpperCase()} → {CITY_CODES[flight.to_city?.toLowerCase()]||flight.to_city?.slice(0,3).toUpperCase()}
            </div>
            <div className="payment-details-row">
              <span className="payment-airline">{flight.airline} · {formatDate(flight.departure_time)}</span>
              <span className="payment-amount">₹{flight.price?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {step==="form" && (
          <div className="payment-body">
            <div className="test-card-hint">
              🧪 Test mode — use card: <strong>4111 1111 1111 1111</strong><br/>
              Expiry: any future date (e.g. 12/28) · CVV: any 3 digits
            </div>
            <div className="pay-input-group">
              <label className="pay-input-label">Passenger Name</label>
              <input className="pay-input" type="text" placeholder="Your full name" value={name} onChange={e=>setName(e.target.value)} autoFocus/>
            </div>
            <div className="pay-input-group">
              <label className="pay-input-label">Card Number</label>
              <input className="pay-input" type="text" placeholder="4111 1111 1111 1111" value={card} onChange={e=>setCard(fmtCard(e.target.value))} maxLength={19}/>
            </div>
            <div className="pay-row">
              <div className="pay-input-group">
                <label className="pay-input-label">Expiry</label>
                <input className="pay-input" type="text" placeholder="MM/YY" value={expiry} onChange={e=>setExpiry(fmtExp(e.target.value))} maxLength={5}/>
              </div>
              <div className="pay-input-group">
                <label className="pay-input-label">CVV</label>
                <input className="pay-input" type="password" placeholder="•••" value={cvv} onChange={e=>setCvv(e.target.value.replace(/\D/g,"").slice(0,3))} maxLength={3}/>
              </div>
            </div>
            <button className="btn-pay" onClick={pay}>Pay ₹{flight.price?.toLocaleString()} →</button>
            <button className="btn-pay-cancel" onClick={onCancel}>Cancel</button>
          </div>
        )}

        {step==="processing" && (
          <div className="processing-wrap">
            <div className="processing-spinner"/>
            <div className="processing-text">Processing payment...</div>
            <p style={{fontSize:12,color:"rgba(165,180,252,0.3)",marginTop:12}}>Please do not close this window</p>
          </div>
        )}

        {step==="success" && (
          <div className="success-wrap">
            <div className="success-icon">🎉</div>
            <div className="success-title">Booking Confirmed!</div>
            <div className="success-sub">Payment successful · Safe travels ✈</div>
            <div className="booking-id-box">
              <div className="booking-id-label">Booking ID</div>
              <div className="booking-id-value">{bookingId}</div>
            </div>
            <button className="btn-success" onClick={onCancel}>View My Bookings</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Search Page ────────────────────────────────────────
function SearchPage() {
  const [mode,setMode]             = useState("structured");
  const [from,setFrom]             = useState("");
  const [to,setTo]                 = useState("");
  const [date,setDate]             = useState("");
  const [aiQuery,setAiQuery]       = useState("");
  const [flights,setFlights]       = useState([]);
  const [filtered,setFiltered]     = useState([]);
  const [loading,setLoading]       = useState(false);
  const [searched,setSearched]     = useState(false);
  const [selFlight,setSelFlight]   = useState(null);
  const [fAirline,setFAirline]     = useState("All Airlines");
  const [fMaxPrice,setFMaxPrice]   = useState(20000);
  const [fTime,setFTime]           = useState("any");
  const [sortBy,setSortBy]         = useState("price");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const today = new Date().toISOString().split("T")[0];

  useEffect(()=>{
    let r=[...flights];
    if(fAirline!=="All Airlines") r=r.filter(f=>f.airline===fAirline);
    r=r.filter(f=>f.price<=fMaxPrice);
    if(fTime==="morning") r=r.filter(f=>{const h=new Date(f.departure_time).getHours();return h>=5&&h<12;});
    else if(fTime==="afternoon") r=r.filter(f=>{const h=new Date(f.departure_time).getHours();return h>=12&&h<17;});
    else if(fTime==="evening") r=r.filter(f=>new Date(f.departure_time).getHours()>=17);
    if(sortBy==="price") r.sort((a,b)=>a.price-b.price);
    else if(sortBy==="price-desc") r.sort((a,b)=>b.price-a.price);
    else if(sortBy==="departure") r.sort((a,b)=>new Date(a.departure_time)-new Date(b.departure_time));
    else if(sortBy==="duration") r.sort((a,b)=>(new Date(a.arrival_time)-new Date(a.departure_time))-(new Date(b.arrival_time)-new Date(b.departure_time)));
    setFiltered(r);
  },[flights,fAirline,fMaxPrice,fTime,sortBy]);

  const clear=()=>{setFAirline("All Airlines");setFMaxPrice(20000);setFTime("any");setSortBy("price");};
  const logout=()=>{localStorage.removeItem("token");navigate("/login");};
  const swap=()=>{const t=from;setFrom(to);setTo(t);};

  const searchS=async()=>{
    if(!from||!to){alert("Select From and To cities");return;}
    setLoading(true);setSearched(true);
    try{const p=new URLSearchParams({from,to});if(date)p.append("date",date);const r=await axios.get(`http://localhost:5000/flights?${p}`);setFlights(r.data);}
    catch{setFlights([]);}
    setLoading(false);
  };

  const searchAI=async()=>{
    if(!aiQuery.trim())return;
    setLoading(true);setSearched(true);
    try{const r=await axios.post("http://localhost:5000/ai-search",{query:aiQuery});setFlights(r.data);}
    catch{setFlights([]);}
    setLoading(false);
  };

  const onBook=f=>{if(!token){alert("Please login first!");navigate("/login");return;}setSelFlight(f);};

  const onPaySuccess=async(name,bid)=>{
    try{
      await axios.post("http://localhost:5000/book",
        {flight_id:selFlight.id,passenger_name:name},
        {headers:{Authorization:`Bearer ${token}`}}
      );
    }catch(e){console.error(e);}
  };

  const gc=c=>CITY_CODES[c?.toLowerCase()]||c?.slice(0,3).toUpperCase();
  const maxP=flights.length>0?Math.max(...flights.map(f=>f.price)):20000;

  return (
    <>
      <style>{styles}</style>
      <Stars/><ShootingStars/>
      {selFlight&&<PaymentModal flight={selFlight} onSuccess={onPaySuccess} onCancel={()=>setSelFlight(null)}/>}

      <div className="page-wrap">
        <nav className="nav">
          <div className="nav-logo">
            <span style={{fontSize:"22px",marginRight:"8px",filter:"drop-shadow(0 0 6px rgba(129,140,248,0.8))",verticalAlign:"middle"}}>☄️</span>
            CometAI<span>Travel Intelligence</span>
          </div>
          <div className="nav-actions">
            <button className="btn-ghost" onClick={()=>navigate("/bookings")}>My Bookings</button>
            <button className="btn-logout" onClick={logout}>Logout</button>
          </div>
        </nav>

        <div className="hero">
          <p className="hero-eyebrow">✦ AI-Powered Flight Search</p>
          <h1 className="hero-title">Search Flights<br/>Across The Universe</h1>
          <p className="hero-sub">Find your perfect flight in seconds</p>
        </div>

        <div className="mode-toggle">
          <button className={`mode-btn ${mode==="structured"?"active":""}`} onClick={()=>{setMode("structured");setFlights([]);setSearched(false);}}>🗺 From / To / Date</button>
          <button className={`mode-btn ${mode==="ai"?"active":""}`} onClick={()=>{setMode("ai");setFlights([]);setSearched(false);}}>🤖 AI Search</button>
        </div>

        {mode==="structured"&&(
          <div className="structured-search">
            <div className="search-fields">
              <div className="field-group">
                <label className="field-label">From</label>
                <div className="select-wrap">
                  <select className="field-select" value={from} onChange={e=>setFrom(e.target.value)}>
                    <option value="">Select city</option>
                    {CITIES.filter(c=>c!==to).map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="field-group">
                <label className="field-label">To</label>
                <div style={{position:"relative"}}>
                  <div className="select-wrap">
                    <select className="field-select" value={to} onChange={e=>setTo(e.target.value)}>
                      <option value="">Select city</option>
                      {CITIES.filter(c=>c!==from).map(c=><option key={c}>{c}</option>)}
                    </select>
                  </div>
                  {from&&to&&<button onClick={swap} style={{position:"absolute",right:"-20px",top:"50%",transform:"translateY(-50%)",zIndex:10,background:"rgba(129,140,248,0.1)",border:"1px solid rgba(129,140,248,0.25)",color:"#a5b4fc",width:"32px",height:"32px",borderRadius:"50%",cursor:"pointer",fontSize:"14px",display:"flex",alignItems:"center",justifyContent:"center"}}>⇄</button>}
                </div>
              </div>
              <div className="field-group">
                <label className="field-label">Date</label>
                <input className="field-date" type="date" value={date} min={today} onChange={e=>setDate(e.target.value)}/>
              </div>
              <button className="btn-search-big" onClick={searchS}>Search ✈</button>
            </div>
          </div>
        )}

        {mode==="ai"&&(
          <div className="ai-search-wrap">
            <div className="search-box">
              <span className="search-icon">🤖</span>
              <input className="search-input" type="text" placeholder="cheapest flights from bangalore to mumbai tomorrow..." value={aiQuery} onChange={e=>setAiQuery(e.target.value)} onKeyPress={e=>{if(e.key==="Enter")searchAI();}}/>
              <button className="btn-search" onClick={searchAI}>Search</button>
            </div>
            <p className="search-hint">Try: "flights from bangalore to delhi" · "cheap mumbai to goa tomorrow"</p>
          </div>
        )}

        {loading&&<div className="loading">Scanning flight paths...</div>}

        {!loading&&flights.length>0&&(
          <div className="filters-bar">
            <div className="filters-title">✦ Filter & Sort</div>
            <div className="filters-row">
              <div className="filter-group">
                <label className="filter-label">Airline</label>
                <select className="filter-select" value={fAirline} onChange={e=>setFAirline(e.target.value)}>{AIRLINES.map(a=><option key={a}>{a}</option>)}</select>
              </div>
              <div className="filter-group">
                <label className="filter-label">Departure time</label>
                <select className="filter-select" value={fTime} onChange={e=>setFTime(e.target.value)}>
                  <option value="any">Any time</option>
                  <option value="morning">Morning (5am–12pm)</option>
                  <option value="afternoon">Afternoon (12pm–5pm)</option>
                  <option value="evening">Evening (5pm+)</option>
                </select>
              </div>
              <div className="filter-group price-range-wrap">
                <label className="filter-label">Max price</label>
                <div className="price-range-labels"><span>₹0</span><span style={{color:"#a5b4fc"}}>₹{fMaxPrice.toLocaleString()}</span></div>
                <input type="range" className="price-slider" min="1000" max={Math.max(maxP,20000)} step="500" value={fMaxPrice} onChange={e=>setFMaxPrice(Number(e.target.value))}/>
              </div>
              <div className="filter-group">
                <label className="filter-label">Sort by</label>
                <select className="sort-select" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
                  <option value="price">Price — low to high</option>
                  <option value="price-desc">Price — high to low</option>
                  <option value="departure">Departure time</option>
                  <option value="duration">Duration</option>
                </select>
              </div>
              <button className="btn-clear-filters" onClick={clear}>Clear</button>
            </div>
          </div>
        )}

        {!loading&&searched&&(
          <>
            <div className="results-header">
              <p className="results-label">{filtered.length>0?`${filtered.length} of ${flights.length} flights`:"No flights match filters"}</p>
            </div>
            <div className="flights-grid">
              {filtered.map(f=>(
                <div className="flight-card" key={f.id}>
                  <div className="card-main">
                    <div>
                      <div className="airline-name">{f.airline}</div>
                      <div className="airline-code">{f.flight_no||"—"}</div>
                      <div className="stops-badge">Non-stop</div>
                    </div>
                    <div className="flight-timeline">
                      <div className="time-block">
                        <div className="time-value">{formatTime(f.departure_time)}</div>
                        <div className="time-city">{gc(f.from_city)}</div>
                        <div className="time-date">{formatDate(f.departure_time)}</div>
                      </div>
                      <div className="timeline-line">
                        <div className="timeline-duration">{calcDuration(f.departure_time,f.arrival_time)}</div>
                        <div className="timeline-bar"><div className="timeline-bar-line"/><span style={{fontSize:13}}>✈</span><div className="timeline-bar-line"/></div>
                        <div className="timeline-stops-text">Direct</div>
                      </div>
                      <div className="time-block">
                        <div className="time-value">{formatTime(f.arrival_time)}</div>
                        <div className="time-city">{gc(f.to_city)}</div>
                        <div className="time-date">{formatDate(f.arrival_time)}</div>
                      </div>
                    </div>
                    <div className="price-action">
                      <div className="price-label-small">from</div>
                      <div className="price-amount">₹{f.price?.toLocaleString()}</div>
                      <button className="btn-book" onClick={()=>onBook(f)}>Book Flight →</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading&&!searched&&(
          <div className="empty-state">
            <div className="empty-icon">🌌</div>
            <div className="empty-text">Your journey starts here</div>
          </div>
        )}
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"         element={<LandingPage />} />  {/* 👈 landing page is now home */}
        <Route path="/search"   element={<SearchPage />} />   {/* 👈 search moved here */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/bookings" element={<MyBookings />} />
      </Routes>
    </Router>
  );
}

export default App;