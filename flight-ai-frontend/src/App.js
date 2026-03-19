import React, { useState, useEffect } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import MyBookings from "./pages/MyBookings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import LandingPage from "./pages/LandingPage";
import AdminDashboard from "./pages/AdminDashboard";

const API = "https://cometai-backend.onrender.com";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;800&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #01020a; color: #e8eaf6; font-family: 'DM Sans', sans-serif; min-height: 100vh; overflow-x: hidden; }

  /* ── VIVID SPACE BG ── */
  .stars-bg {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background:
      radial-gradient(ellipse at 15% 50%, rgba(99,43,200,0.28) 0%, transparent 55%),
      radial-gradient(ellipse at 85% 20%, rgba(25,90,220,0.22) 0%, transparent 50%),
      radial-gradient(ellipse at 55% 85%, rgba(140,30,180,0.18) 0%, transparent 50%),
      radial-gradient(ellipse at 70% 10%, rgba(56,189,248,0.12) 0%, transparent 40%),
      #01020a;
  }
  .nebula {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background:
      radial-gradient(ellipse 900px 500px at 5% 70%, rgba(99,43,200,0.1) 0%, transparent 70%),
      radial-gradient(ellipse 700px 400px at 95% 25%, rgba(56,189,248,0.08) 0%, transparent 70%),
      radial-gradient(ellipse 800px 400px at 45% 95%, rgba(192,132,252,0.09) 0%, transparent 70%);
  }
  .star { position: absolute; border-radius: 50%; background: white; animation: twinkle var(--d,3s) ease-in-out infinite var(--delay,0s); }
  @keyframes twinkle { 0%,100%{opacity:var(--min-op,.2);transform:scale(1);}50%{opacity:1;transform:scale(1.5);} }
  .shooting-star { position: fixed; top:0; left:0; width:2px; height:2px; background:white; border-radius:50%; pointer-events:none; z-index:2; }
  .shooting-star::after { content:''; position:absolute; top:50%; right:0; transform:translateY(-50%); width:140px; height:1px; background:linear-gradient(90deg,rgba(255,255,255,0),rgba(165,180,252,0.7),white); border-radius:2px; }
  @keyframes shoot { 0%{transform:translate(0,0) rotate(var(--angle));opacity:1;}70%{opacity:1;}100%{transform:translate(var(--tx),var(--ty)) rotate(var(--angle));opacity:0;} }

  .page-wrap { position:relative; z-index:1; min-height:100vh; padding:0 16px 60px; max-width:1100px; margin:0 auto; }

  /* ── NAV ── */
  .nav { display:flex; align-items:center; justify-content:space-between; padding:20px 0 32px; border-bottom:1px solid rgba(255,255,255,0.08); margin-bottom:32px; }
  .nav-logo { font-family:'Orbitron',sans-serif; font-size:18px; font-weight:800; letter-spacing:1px; background:linear-gradient(90deg,#818cf8,#c084fc,#38bdf8); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  .nav-logo span { font-size:11px; font-family:'DM Sans',sans-serif; font-weight:300; display:block; letter-spacing:3px; background:linear-gradient(90deg,#818cf8aa,#c084fcaa); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; margin-top:2px; }
  .nav-actions { display:flex; gap:8px; align-items:center; }
  .btn-ghost { background:transparent; border:1px solid rgba(129,140,248,0.35); color:#a5b4fc; padding:8px 14px; border-radius:8px; font-family:'DM Sans',sans-serif; font-size:13px; cursor:pointer; transition:all 0.2s; white-space:nowrap; }
  .btn-ghost:hover { background:rgba(129,140,248,0.1); border-color:rgba(129,140,248,0.6); }
  .btn-logout { background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.3); color:#fca5a5; padding:8px 14px; border-radius:8px; font-family:'DM Sans',sans-serif; font-size:13px; cursor:pointer; transition:all 0.2s; }
  .btn-logout:hover { background:rgba(239,68,68,0.22); }

  /* ── HERO ── */
  .hero { text-align:center; margin-bottom:32px; animation:fadeUp 0.7s ease both; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(24px);}to{opacity:1;transform:translateY(0);} }
  .hero-eyebrow { font-size:10px; letter-spacing:4px; text-transform:uppercase; color:#818cf8; margin-bottom:12px; font-weight:500; }
  .hero-title { font-family:'Orbitron',sans-serif; font-size:clamp(22px,5vw,48px); font-weight:800; line-height:1.15; background:linear-gradient(135deg,#e0e7ff 0%,#a5b4fc 40%,#c084fc 70%,#38bdf8 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; margin-bottom:12px; letter-spacing:1px; }
  .hero-sub { font-size:14px; color:rgba(180,190,255,0.55); font-weight:300; }

  /* ── TRAVEL TYPE TABS ── */
  .travel-tabs { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:24px; animation:fadeUp 0.7s ease 0.05s both; }
  .travel-tab { display:flex; align-items:center; justify-content:center; gap:6px; padding:10px 12px; border-radius:12px; cursor:pointer; border:1px solid rgba(129,140,248,0.2); background:rgba(255,255,255,0.02); font-family:'DM Sans',sans-serif; font-size:13px; font-weight:400; color:rgba(165,180,252,0.5); transition:all 0.2s; }
  .travel-tab:hover { border-color:rgba(129,140,248,0.4); color:#a5b4fc; background:rgba(129,140,248,0.05); }
  .travel-tab.active { background:rgba(99,102,241,0.15); border-color:rgba(129,140,248,0.5); color:#c7d2fe; }
  .travel-tab-icon { font-size:16px; }
  .coming-soon-badge { font-size:8px; letter-spacing:1px; background:rgba(251,191,36,0.15); border:1px solid rgba(251,191,36,0.25); color:#fcd34d; padding:2px 6px; border-radius:10px; text-transform:uppercase; }

  /* ── COMING SOON PANEL ── */
  .coming-soon-panel { max-width:500px; margin:0 auto 40px; background:rgba(255,255,255,0.02); border:1px solid rgba(129,140,248,0.12); border-radius:20px; padding:40px 24px; text-align:center; animation:fadeUp 0.5s ease both; }
  .cs-icon { font-size:48px; margin-bottom:16px; filter:drop-shadow(0 0 20px rgba(129,140,248,0.4)); }
  .cs-title { font-family:'Orbitron',sans-serif; font-size:18px; font-weight:700; background:linear-gradient(135deg,#e0e7ff,#a5b4fc); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; margin-bottom:10px; }
  .cs-sub { font-size:14px; color:rgba(165,180,252,0.4); line-height:1.7; font-weight:300; }
  .cs-badge { display:inline-block; margin-top:16px; background:rgba(251,191,36,0.1); border:1px solid rgba(251,191,36,0.25); color:#fcd34d; padding:6px 16px; border-radius:20px; font-size:11px; letter-spacing:1px; }

  /* ── SEARCH CARD ── */
  .search-card { background:rgba(255,255,255,0.03); border:1px solid rgba(129,140,248,0.15); border-radius:20px; padding:20px; margin-bottom:24px; animation:fadeUp 0.7s ease 0.1s both; }

  /* TRIP TYPE TOGGLE */
  .trip-toggle { display:flex; gap:0; margin-bottom:20px; background:rgba(255,255,255,0.03); border-radius:10px; padding:3px; }
  .trip-btn { flex:1; padding:8px; border:none; background:transparent; color:rgba(165,180,252,0.5); font-family:'DM Sans',sans-serif; font-size:12px; font-weight:500; cursor:pointer; border-radius:8px; transition:all 0.2s; letter-spacing:0.3px; }
  .trip-btn.active { background:rgba(99,102,241,0.3); color:#c7d2fe; }

  /* CITY FIELDS */
  .city-row { display:grid; grid-template-columns:1fr auto 1fr; gap:8px; align-items:center; margin-bottom:12px; }
  .city-field { background:rgba(255,255,255,0.05); border:1px solid rgba(129,140,248,0.2); border-radius:12px; padding:12px 14px; cursor:pointer; transition:all 0.2s; }
  .city-field:hover { border-color:rgba(129,140,248,0.4); background:rgba(129,140,248,0.08); }
  .city-field-label { font-size:9px; letter-spacing:2px; text-transform:uppercase; color:rgba(165,180,252,0.4); margin-bottom:4px; }
  .city-field-code { font-family:'Orbitron',sans-serif; font-size:22px; font-weight:800; color:#e0e7ff; letter-spacing:2px; }
  .city-field-name { font-size:11px; color:rgba(165,180,252,0.45); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .swap-circle { width:36px; height:36px; border-radius:50%; background:rgba(129,140,248,0.12); border:1px solid rgba(129,140,248,0.3); display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:14px; color:#a5b4fc; transition:all 0.2s; flex-shrink:0; }
  .swap-circle:hover { background:rgba(129,140,248,0.25); transform:rotate(180deg); }

  /* BOTTOM ROW */
  .bottom-row { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:16px; }
  .bottom-field { background:rgba(255,255,255,0.05); border:1px solid rgba(129,140,248,0.2); border-radius:12px; padding:12px 14px; transition:all 0.2s; }
  .bottom-field-label { font-size:9px; letter-spacing:2px; text-transform:uppercase; color:rgba(165,180,252,0.4); margin-bottom:4px; }
  .bottom-field-value { font-size:14px; font-weight:500; color:#e0e7ff; }
  .bottom-field-sub { font-size:11px; color:rgba(165,180,252,0.4); margin-top:2px; }
  .date-input { background:transparent; border:none; outline:none; color:#e0e7ff; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:500; width:100%; cursor:pointer; }
  .date-input::-webkit-calendar-picker-indicator { filter:invert(0.7) sepia(1) saturate(3) hue-rotate(200deg); cursor:pointer; width:16px; }

  /* PASSENGERS ROW */
  .pax-class-row { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:16px; }
  .pax-field { background:rgba(255,255,255,0.05); border:1px solid rgba(129,140,248,0.2); border-radius:12px; padding:12px 14px; }
  .pax-label { font-size:9px; letter-spacing:2px; text-transform:uppercase; color:rgba(165,180,252,0.4); margin-bottom:4px; }
  .pax-controls { display:flex; align-items:center; gap:10px; }
  .pax-btn { width:28px; height:28px; border-radius:50%; background:rgba(99,102,241,0.2); border:1px solid rgba(129,140,248,0.3); color:#a5b4fc; font-size:16px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s; line-height:1; }
  .pax-btn:hover { background:rgba(99,102,241,0.4); }
  .pax-count { font-family:'Orbitron',sans-serif; font-size:18px; font-weight:800; color:#e0e7ff; min-width:20px; text-align:center; }
  .class-select { background:transparent; border:none; outline:none; color:#e0e7ff; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:500; width:100%; cursor:pointer; appearance:none; -webkit-appearance:none; }
  .class-select option { background:#0d0e1a; color:#e0e7ff; }

  /* MODE TOGGLE */
  .mode-toggle { display:flex; gap:0; margin-bottom:16px; }
  .mode-btn { flex:1; padding:9px; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:500; cursor:pointer; border:1px solid rgba(129,140,248,0.25); background:transparent; color:rgba(165,180,252,0.5); transition:all 0.2s; }
  .mode-btn:first-child { border-radius:10px 0 0 10px; }
  .mode-btn:last-child { border-radius:0 10px 10px 0; border-left:none; }
  .mode-btn.active { background:rgba(99,102,241,0.2); border-color:rgba(129,140,248,0.5); color:#a5b4fc; }

  /* AI SEARCH */
  .ai-box { display:flex; align-items:center; background:rgba(255,255,255,0.04); border:1px solid rgba(129,140,248,0.2); border-radius:12px; padding:4px 4px 4px 14px; gap:10px; }
  .ai-box:focus-within { border-color:rgba(129,140,248,0.6); }
  .ai-input { flex:1; background:transparent; border:none; outline:none; color:#e0e7ff; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:300; padding:8px 0; }
  .ai-input::placeholder { color:rgba(165,180,252,0.3); }

  /* SEARCH BTN */
  .btn-search-main { width:100%; padding:14px; background:linear-gradient(135deg,#6366f1,#8b5cf6); border:none; border-radius:12px; color:white; font-family:'DM Sans',sans-serif; font-size:15px; font-weight:600; cursor:pointer; transition:all 0.2s; letter-spacing:0.3px; box-shadow:0 4px 20px rgba(99,102,241,0.3); }
  .btn-search-main:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(99,102,241,0.5); }

  /* CITY SELECTOR MODAL */
  .city-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:200; display:flex; align-items:flex-end; backdrop-filter:blur(8px); animation:fadeIn 0.2s ease; }
  @keyframes fadeIn { from{opacity:0;}to{opacity:1;} }
  .city-modal { background:#0d0e1a; border:1px solid rgba(129,140,248,0.2); border-radius:24px 24px 0 0; padding:24px; width:100%; max-height:80vh; overflow-y:auto; animation:slideUp 0.3s ease; }
  @keyframes slideUp { from{transform:translateY(100%);}to{transform:translateY(0);} }
  .city-modal-title { font-family:'Orbitron',sans-serif; font-size:14px; font-weight:600; color:#e0e7ff; margin-bottom:16px; letter-spacing:1px; }
  .city-search-input { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(129,140,248,0.2); border-radius:10px; padding:12px 16px; color:#e0e7ff; font-family:'DM Sans',sans-serif; font-size:14px; outline:none; margin-bottom:16px; }
  .city-search-input::placeholder { color:rgba(165,180,252,0.3); }
  .city-list { display:flex; flex-direction:column; gap:4px; }
  .city-item { display:flex; align-items:center; justify-content:space-between; padding:14px 16px; border-radius:10px; cursor:pointer; transition:all 0.15s; border:1px solid transparent; }
  .city-item:hover { background:rgba(129,140,248,0.08); border-color:rgba(129,140,248,0.2); }
  .city-item-left {}
  .city-item-name { font-size:15px; font-weight:500; color:#e0e7ff; }
  .city-item-country { font-size:12px; color:rgba(165,180,252,0.4); margin-top:2px; }
  .city-item-code { font-family:'Orbitron',sans-serif; font-size:16px; font-weight:800; color:#818cf8; }

  /* FILTERS */
  .filters-bar { background:rgba(255,255,255,0.02); border:1px solid rgba(129,140,248,0.12); border-radius:16px; padding:16px; margin-bottom:20px; animation:fadeUp 0.5s ease both; }
  .filters-title { font-size:10px; letter-spacing:2px; text-transform:uppercase; color:rgba(165,180,252,0.4); margin-bottom:12px; font-weight:500; }
  .filters-scroll { display:flex; gap:10px; overflow-x:auto; padding-bottom:4px; }
  .filters-scroll::-webkit-scrollbar { display:none; }
  .filter-chip { flex-shrink:0; background:rgba(255,255,255,0.04); border:1px solid rgba(129,140,248,0.18); border-radius:20px; padding:6px 14px; color:rgba(165,180,252,0.5); font-family:'DM Sans',sans-serif; font-size:12px; cursor:pointer; transition:all 0.2s; white-space:nowrap; }
  .filter-chip.active { background:rgba(99,102,241,0.2); border-color:rgba(129,140,248,0.5); color:#a5b4fc; }
  .price-slider { -webkit-appearance:none; width:100%; height:3px; background:linear-gradient(90deg,#6366f1,#8b5cf6); border-radius:2px; outline:none; cursor:pointer; margin-top:10px; }
  .price-slider::-webkit-slider-thumb { -webkit-appearance:none; width:16px; height:16px; background:#a5b4fc; border-radius:50%; cursor:pointer; box-shadow:0 0 6px rgba(129,140,248,0.6); }
  .price-label { display:flex; justify-content:space-between; font-size:11px; color:rgba(165,180,252,0.4); margin-top:6px; }

  /* RESULTS */
  .results-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
  .results-label { font-family:'Orbitron',sans-serif; font-size:10px; letter-spacing:3px; text-transform:uppercase; color:rgba(129,140,248,0.5); }
  .flights-grid { display:flex; flex-direction:column; gap:12px; animation:fadeUp 0.5s ease both; }

  /* FLIGHT CARD — MOBILE FIRST */
  .flight-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:16px; transition:all 0.25s; position:relative; overflow:hidden; }
  .flight-card::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(99,102,241,0.04) 0%,transparent 60%); pointer-events:none; }
  .flight-card:hover { border-color:rgba(129,140,248,0.3); background:rgba(255,255,255,0.05); }
  .flight-card:active { transform:scale(0.99); }

  /* Card top row */
  .card-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
  .airline-info { display:flex; align-items:center; gap:8px; }
  .airline-dot { width:8px; height:8px; border-radius:50%; background:linear-gradient(135deg,#6366f1,#8b5cf6); }
  .airline-name { font-family:'Orbitron',sans-serif; font-size:11px; font-weight:600; color:#c7d2fe; letter-spacing:0.5px; }
  .stops-badge { padding:3px 8px; border-radius:20px; font-size:9px; letter-spacing:0.5px; background:rgba(52,211,153,0.1); border:1px solid rgba(52,211,153,0.2); color:#6ee7b7; }

  /* Card route */
  .card-route { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
  .route-city { text-align:center; }
  .route-time { font-family:'Orbitron',sans-serif; font-size:20px; font-weight:800; color:#e0e7ff; letter-spacing:1px; }
  .route-code { font-size:12px; color:rgba(165,180,252,0.5); margin-top:2px; letter-spacing:1px; }
  .route-date { font-size:10px; color:rgba(165,180,252,0.3); margin-top:1px; }
  .route-middle { flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; padding:0 12px; }
  .route-duration { font-size:10px; color:rgba(165,180,252,0.5); letter-spacing:0.3px; }
  .route-line-wrap { width:100%; display:flex; align-items:center; gap:4px; }
  .route-line-bar { flex:1; height:1px; background:linear-gradient(90deg,rgba(129,140,248,0.2),rgba(192,132,252,0.4),rgba(129,140,248,0.2)); }
  .route-plane { font-size:12px; }
  .route-direct { font-size:9px; color:rgba(52,211,153,0.6); letter-spacing:0.3px; }

  /* Card bottom */
  .card-bottom { display:flex; align-items:center; justify-content:space-between; padding-top:12px; border-top:1px solid rgba(255,255,255,0.05); }
  .price-wrap {}
  .price-from { font-size:9px; color:rgba(165,180,252,0.35); letter-spacing:1px; text-transform:uppercase; }
  .price-amount { font-family:'Orbitron',sans-serif; font-size:20px; font-weight:800; background:linear-gradient(135deg,#a5f3fc,#818cf8); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  .price-pax { font-size:10px; color:rgba(165,180,252,0.3); margin-top:1px; }
  .btn-book { background:linear-gradient(135deg,#6366f1,#8b5cf6); border:none; color:white; padding:10px 20px; border-radius:10px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s; letter-spacing:0.3px; box-shadow:0 4px 12px rgba(99,102,241,0.3); }
  .btn-book:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(99,102,241,0.5); }
  .btn-book:active { transform:scale(0.97); }

  /* MODALS */
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:100; display:flex; align-items:flex-end; backdrop-filter:blur(8px); animation:fadeIn 0.2s ease; }
  .modal-card { background:#0d0e1a; border:1px solid rgba(129,140,248,0.25); border-radius:24px 24px 0 0; padding:28px 24px; width:100%; box-shadow:0 -24px 80px rgba(0,0,0,0.7); animation:slideUp 0.3s ease; }
  .modal-title { font-family:'Orbitron',sans-serif; font-size:15px; font-weight:600; color:#e0e7ff; margin-bottom:6px; letter-spacing:1px; }
  .modal-sub { font-size:13px; color:rgba(165,180,252,0.4); margin-bottom:20px; font-weight:300; }
  .modal-input-label { display:block; font-size:10px; letter-spacing:1.5px; text-transform:uppercase; color:rgba(165,180,252,0.5); margin-bottom:8px; }
  .modal-input { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(129,140,248,0.2); border-radius:10px; padding:13px 16px; color:#e0e7ff; font-family:'DM Sans',sans-serif; font-size:15px; outline:none; transition:all 0.2s; margin-bottom:16px; }
  .modal-input:focus { border-color:rgba(129,140,248,0.55); background:rgba(129,140,248,0.08); }
  .modal-input::placeholder { color:rgba(165,180,252,0.25); }
  .modal-actions { display:flex; gap:10px; }
  .btn-confirm { flex:1; padding:14px; background:linear-gradient(135deg,#6366f1,#8b5cf6); border:none; border-radius:12px; color:white; font-family:'DM Sans',sans-serif; font-size:15px; font-weight:600; cursor:pointer; transition:all 0.2s; }
  .btn-confirm:hover { box-shadow:0 6px 20px rgba(99,102,241,0.4); }
  .btn-cancel { padding:14px 20px; background:transparent; border:1px solid rgba(255,255,255,0.1); border-radius:12px; color:rgba(165,180,252,0.5); font-family:'DM Sans',sans-serif; font-size:15px; cursor:pointer; transition:all 0.2s; }
  .btn-cancel:hover { border-color:rgba(255,255,255,0.2); color:#a5b4fc; }

  /* PAYMENT */
  .payment-modal { background:#0a0b18; border:1px solid rgba(129,140,248,0.2); border-radius:24px 24px 0 0; padding:0; width:100%; box-shadow:0 -32px 100px rgba(0,0,0,0.8); animation:slideUp 0.3s ease; overflow:hidden; max-height:90vh; overflow-y:auto; }
  .payment-header { background:linear-gradient(135deg,#1a1b3a,#0f1028); padding:20px 24px; border-bottom:1px solid rgba(129,140,248,0.1); display:flex; align-items:center; justify-content:space-between; }
  .payment-brand { font-family:'Orbitron',sans-serif; font-size:14px; font-weight:800; background:linear-gradient(90deg,#818cf8,#c084fc); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  .payment-secure { font-size:11px; color:rgba(52,211,153,0.7); }
  .payment-body { padding:24px; }
  .payment-amount-display { text-align:center; margin-bottom:24px; padding:16px; background:rgba(99,102,241,0.08); border:1px solid rgba(129,140,248,0.15); border-radius:14px; }
  .payment-amount-label { font-size:10px; letter-spacing:2px; text-transform:uppercase; color:rgba(165,180,252,0.4); margin-bottom:6px; }
  .payment-amount-value { font-family:'Orbitron',sans-serif; font-size:28px; font-weight:800; background:linear-gradient(135deg,#a5f3fc,#818cf8); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
  .payment-flight-info { font-size:12px; color:rgba(165,180,252,0.4); margin-top:4px; }
  .payment-methods { display:flex; gap:8px; margin-bottom:20px; }
  .pay-method-btn { flex:1; padding:10px 6px; background:rgba(255,255,255,0.03); border:1px solid rgba(129,140,248,0.15); border-radius:10px; color:rgba(165,180,252,0.5); font-family:'DM Sans',sans-serif; font-size:12px; cursor:pointer; transition:all 0.2s; text-align:center; }
  .pay-method-btn.active { background:rgba(99,102,241,0.15); border-color:rgba(129,140,248,0.5); color:#a5b4fc; }
  .pay-input-label { font-size:10px; letter-spacing:1.5px; text-transform:uppercase; color:rgba(165,180,252,0.4); margin-bottom:8px; display:block; }
  .pay-input { width:100%; background:rgba(255,255,255,0.04); border:1px solid rgba(129,140,248,0.18); border-radius:10px; padding:13px 16px; color:#e0e7ff; font-family:'DM Sans',sans-serif; font-size:15px; outline:none; transition:all 0.2s; margin-bottom:12px; letter-spacing:1px; }
  .pay-input:focus { border-color:rgba(129,140,248,0.5); background:rgba(129,140,248,0.06); }
  .pay-input::placeholder { color:rgba(165,180,252,0.2); letter-spacing:0; }
  .pay-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .btn-pay { width:100%; padding:16px; background:linear-gradient(135deg,#6366f1,#8b5cf6); border:none; border-radius:12px; color:white; font-family:'DM Sans',sans-serif; font-size:16px; font-weight:600; cursor:pointer; margin-top:8px; transition:all 0.2s; letter-spacing:0.5px; box-shadow:0 4px 20px rgba(99,102,241,0.3); }
  .btn-pay:hover { box-shadow:0 8px 28px rgba(99,102,241,0.5); }
  .pay-note { text-align:center; font-size:11px; color:rgba(165,180,252,0.25); margin-top:12px; padding-bottom:8px; }
  .processing-wrap { padding:50px 24px; text-align:center; }
  .processing-spinner { width:56px; height:56px; border:3px solid rgba(129,140,248,0.2); border-top-color:#818cf8; border-radius:50%; animation:spin 1s linear infinite; margin:0 auto 20px; }
  @keyframes spin { to{transform:rotate(360deg);} }
  .processing-text { font-family:'Orbitron',sans-serif; font-size:13px; color:#a5b4fc; letter-spacing:2px; animation:pulse 1.5s ease infinite; }
  @keyframes pulse { 0%,100%{opacity:0.5}50%{opacity:1} }
  .success-wrap { padding:40px 24px; text-align:center; }
  .success-icon { font-size:52px; margin-bottom:16px; animation:popIn 0.5s ease; }
  @keyframes popIn { from{transform:scale(0);opacity:0;}to{transform:scale(1);opacity:1;} }
  .success-title { font-family:'Orbitron',sans-serif; font-size:18px; font-weight:800; background:linear-gradient(135deg,#6ee7b7,#38bdf8); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; margin-bottom:8px; }
  .success-sub { font-size:13px; color:rgba(165,180,252,0.5); margin-bottom:20px; line-height:1.6; }
  .booking-id-box { background:rgba(99,102,241,0.1); border:1px solid rgba(129,140,248,0.2); border-radius:12px; padding:14px; margin-bottom:20px; }
  .booking-id-label { font-size:9px; letter-spacing:2px; text-transform:uppercase; color:rgba(165,180,252,0.4); margin-bottom:4px; }
  .booking-id-value { font-family:'Orbitron',sans-serif; font-size:16px; font-weight:800; color:#a5b4fc; letter-spacing:3px; }
  .btn-done { width:100%; padding:14px; background:linear-gradient(135deg,#6366f1,#8b5cf6); border:none; border-radius:12px; color:white; font-family:'DM Sans',sans-serif; font-size:15px; font-weight:600; cursor:pointer; transition:all 0.2s; }

  .empty-state { text-align:center; padding:60px 20px; color:rgba(165,180,252,0.25); animation:fadeUp 0.5s ease both; }
  .empty-icon { font-size:44px; margin-bottom:12px; opacity:0.4; }
  .empty-text { font-size:13px; letter-spacing:0.5px; font-family:'Orbitron',sans-serif; }
  .loading { text-align:center; padding:50px; color:rgba(129,140,248,0.6); font-family:'Orbitron',sans-serif; font-size:11px; letter-spacing:3px; animation:pulse 1.5s ease infinite; }

  /* DESKTOP OVERRIDES */
  @media(min-width:768px){
    .page-wrap { padding:0 24px 60px; }
    .travel-tabs { grid-template-columns:repeat(4,1fr); }
    .city-row { grid-template-columns:1fr auto 1fr; }
    .bottom-row { grid-template-columns:1fr 1fr 1fr; }
    .pax-class-row { grid-template-columns:1fr 1fr; }
    .card-top { margin-bottom:16px; }
    .route-time { font-size:24px; }
    .price-amount { font-size:24px; }
    .modal-overlay { align-items:center; }
    .modal-card { border-radius:20px; max-width:440px; margin:0 auto; }
    .payment-modal { border-radius:24px; max-width:460px; margin:0 auto; }
    .city-modal { border-radius:20px; max-width:480px; margin:0 auto; max-height:70vh; }
    .city-modal-overlay { align-items:center; }
  }
`;

const CITIES = [
  { code:"BLR", name:"Bangalore", full:"Kempegowda International", country:"India" },
  { code:"BOM", name:"Mumbai", full:"Chhatrapati Shivaji International", country:"India" },
  { code:"DEL", name:"Delhi", full:"Indira Gandhi International", country:"India" },
  { code:"MAA", name:"Chennai", full:"Chennai International", country:"India" },
  { code:"HYD", name:"Hyderabad", full:"Rajiv Gandhi International", country:"India" },
  { code:"CCU", name:"Kolkata", full:"Netaji Subhas Chandra Bose Intl", country:"India" },
  { code:"GOI", name:"Goa", full:"Dabolim Airport", country:"India" },
  { code:"PNQ", name:"Pune", full:"Pune Airport", country:"India" },
  { code:"COK", name:"Kochi", full:"Cochin International", country:"India" },
  { code:"AMD", name:"Ahmedabad", full:"Sardar Vallabhbhai Patel Intl", country:"India" },
  { code:"JAI", name:"Jaipur", full:"Jaipur International", country:"India" },
  { code:"VNS", name:"Varanasi", full:"Lal Bahadur Shastri Airport", country:"India" },
  { code:"DXB", name:"Dubai", full:"Dubai International", country:"UAE" },
  { code:"SIN", name:"Singapore", full:"Changi Airport", country:"Singapore" },
];

const CLASSES = ["Economy", "Premium Economy", "Business", "First Class"];

function Stars() {
  const stars = Array.from({length:100},(_,i)=>({id:i,x:Math.random()*100,y:Math.random()*100,size:Math.random()*2+0.3,duration:Math.random()*5+2,delay:Math.random()*6,minOp:Math.random()*0.2+0.05}));
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
      setTimeout(launch,2000+Math.random()*4000);
    };
    const t=setTimeout(launch,1000);
    return()=>clearTimeout(t);
  },[]);
  return<>{stars.map(s=><div key={s.id} className="shooting-star" style={{left:`${s.x}%`,top:`${s.y}%`,'--angle':`${s.angle}deg`,'--tx':`${s.tx}px`,'--ty':`${s.ty}px`,animation:`shoot ${s.dur}ms ease-out forwards`}}/>)}</>;
}

function CityModal({title, onSelect, onClose, exclude}) {
  const [search, setSearch] = useState("");
  const filtered = CITIES.filter(c =>
    c.code !== exclude &&
    (c.name.toLowerCase().includes(search.toLowerCase()) ||
     c.code.toLowerCase().includes(search.toLowerCase()) ||
     c.country.toLowerCase().includes(search.toLowerCase()))
  );
  return(
    <div className="city-modal-overlay" onClick={onClose}>
      <div className="city-modal" onClick={e=>e.stopPropagation()}>
        <div className="city-modal-title">{title}</div>
        <input className="city-search-input" placeholder="Search city or airport..." value={search} onChange={e=>setSearch(e.target.value)} autoFocus/>
        <div className="city-list">
          {filtered.map(city=>(
            <div key={city.code} className="city-item" onClick={()=>onSelect(city)}>
              <div className="city-item-left">
                <div className="city-item-name">{city.name}</div>
                <div className="city-item-country">{city.full} · {city.country}</div>
              </div>
              <div className="city-item-code">{city.code}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PassengerModal({flight, passengers, onConfirm, onCancel}) {
  const [name,setName]=useState("");
  return(
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={e=>e.stopPropagation()}>
        <div className="modal-title">Passenger Details</div>
        <div className="modal-sub">{flight.airline} · {flight.from_city} → {flight.to_city} · {passengers} passenger{passengers>1?"s":""}</div>
        <label className="modal-input-label">Lead Passenger Name</label>
        <input className="modal-input" type="text" placeholder="Enter your full name" value={name} onChange={e=>setName(e.target.value)} onKeyPress={e=>{if(e.key==="Enter"&&name.trim())onConfirm(name);}} autoFocus/>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="btn-confirm" onClick={()=>{if(name.trim())onConfirm(name);}}>Continue to Payment →</button>
        </div>
      </div>
    </div>
  );
}

function PaymentModal({flight, passengerName, passengers, cabinClass, onSuccess, onCancel}) {
  const [step,setStep]=useState("payment");
  const [payMethod,setPayMethod]=useState("card");
  const [cardNo,setCardNo]=useState("");
  const [expiry,setExpiry]=useState("");
  const [cvv,setCvv]=useState("");
  const [bookingId]=useState("CMT"+Date.now().toString(36).toUpperCase().slice(-6));
  const totalPrice = flight.price * passengers;
  const formatCard=(v)=>v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const formatExpiry=(v)=>{const d=v.replace(/\D/g,"").slice(0,4);return d.length>=3?d.slice(0,2)+"/"+d.slice(2):d;};
  const handlePay=()=>{
    if(payMethod==="card"&&(!cardNo||!expiry||!cvv)){alert("Please fill all card details.");return;}
    setStep("processing");
    setTimeout(()=>setStep("success"),2500);
  };
  if(step==="processing")return<div className="modal-overlay"><div className="payment-modal"><div className="payment-header"><div className="payment-brand">☄️ CometAI Pay</div><div className="payment-secure">🔒 Secure</div></div><div className="processing-wrap"><div className="processing-spinner"/><div className="processing-text">Processing payment...</div></div></div></div>;
  if(step==="success")return<div className="modal-overlay"><div className="payment-modal"><div className="payment-header"><div className="payment-brand">☄️ CometAI Pay</div><div className="payment-secure">🔒 Secure</div></div><div className="success-wrap"><div className="success-icon">🚀</div><div className="success-title">Booking Confirmed!</div><div className="success-sub">{flight.airline}<br/>{flight.from_city} → {flight.to_city}<br/>Passenger: {passengerName}{passengers>1?` +${passengers-1} more`:""}<br/>Class: {cabinClass}</div><div className="booking-id-box"><div className="booking-id-label">Booking ID</div><div className="booking-id-value">{bookingId}</div></div><button className="btn-done" onClick={()=>onSuccess(bookingId)}>View My Bookings →</button></div></div></div>;
  return(
    <div className="modal-overlay" onClick={onCancel}>
      <div className="payment-modal" onClick={e=>e.stopPropagation()}>
        <div className="payment-header"><div className="payment-brand">☄️ CometAI Pay</div><div className="payment-secure">🔒 256-bit SSL</div></div>
        <div className="payment-body">
          <div className="payment-amount-display"><div className="payment-amount-label">Total Amount</div><div className="payment-amount-value">₹{totalPrice.toLocaleString()}</div><div className="payment-flight-info">{flight.from_city} → {flight.to_city} · {passengers} pax · {cabinClass}</div></div>
          <div className="payment-methods">{[["card","💳 Card"],["upi","⚡ UPI"],["netbanking","🏦 Netbanking"]].map(([id,label])=><button key={id} className={`pay-method-btn ${payMethod===id?"active":""}`} onClick={()=>setPayMethod(id)}>{label}</button>)}</div>
          {payMethod==="card"&&<><label className="pay-input-label">Card Number</label><input className="pay-input" placeholder="4111 1111 1111 1111" value={cardNo} onChange={e=>setCardNo(formatCard(e.target.value))} maxLength={19}/><div className="pay-row"><div><label className="pay-input-label">Expiry</label><input className="pay-input" placeholder="MM/YY" value={expiry} onChange={e=>setExpiry(formatExpiry(e.target.value))} maxLength={5}/></div><div><label className="pay-input-label">CVV</label><input className="pay-input" placeholder="•••" type="password" value={cvv} onChange={e=>setCvv(e.target.value.slice(0,3))} maxLength={3}/></div></div></>}
          {payMethod==="upi"&&<><label className="pay-input-label">UPI ID</label><input className="pay-input" placeholder="yourname@upi"/></>}
          {payMethod==="netbanking"&&<><label className="pay-input-label">Select Bank</label><select className="pay-input" style={{cursor:"pointer"}}><option>SBI — State Bank of India</option><option>HDFC Bank</option><option>ICICI Bank</option><option>Axis Bank</option><option>Kotak Mahindra Bank</option></select></>}
          <button className="btn-pay" onClick={handlePay}>Pay ₹{totalPrice.toLocaleString()} →</button>
          <div className="pay-note">🔒 Demo payment. No real money charged.</div>
        </div>
      </div>
    </div>
  );
}

function formatTime(dt){if(!dt)return"--:--";return new Date(dt).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:false});}
function formatDate(dt){if(!dt)return"";return new Date(dt).toLocaleDateString("en-IN",{day:"numeric",month:"short"});}
function calcDuration(dep,arr){if(!dep||!arr)return"";const diff=(new Date(arr)-new Date(dep))/60000;const h=Math.floor(diff/60);const m=diff%60;return`${h}h${m>0?" "+m+"m":""}`.trim();}

function SearchPage(){
  const [travelType,setTravelType]=useState("flight");
  const [tripType,setTripType]=useState("oneway");
  const [fromCity,setFromCity]=useState(CITIES[0]);
  const [toCity,setToCity]=useState(CITIES[1]);
  const [date,setDate]=useState("");
  const [returnDate,setReturnDate]=useState("");
  const [passengers,setPassengers]=useState(1);
  const [cabinClass,setCabinClass]=useState("Economy");
  const [showFromModal,setShowFromModal]=useState(false);
  const [showToModal,setShowToModal]=useState(false);
  const [mode,setMode]=useState("structured");
  const [aiQuery,setAiQuery]=useState("");
  const [flights,setFlights]=useState([]);
  const [filtered,setFiltered]=useState([]);
  const [loading,setLoading]=useState(false);
  const [searched,setSearched]=useState(false);
  const [bookingFlight,setBookingFlight]=useState(null);
  const [passengerName,setPassengerName]=useState("");
  const [showPayment,setShowPayment]=useState(false);
  const [filterTime,setFilterTime]=useState("any");
  const [filterMaxPrice,setFilterMaxPrice]=useState(20000);
  const [sortBy,setSortBy]=useState("price");
  const navigate=useNavigate();
  const token=localStorage.getItem("token");
  const today=new Date().toISOString().split("T")[0];

  // keep backend alive
  useEffect(()=>{
    fetch(`${API}/test`).catch(()=>{});
    const t=setInterval(()=>fetch(`${API}/test`).catch(()=>{}),14*60*1000);
    return()=>clearInterval(t);
  },[]);

  useEffect(()=>{
    let result=[...flights];
    if(filterTime==="morning")result=result.filter(f=>{const h=new Date(f.departure_time).getHours();return h>=5&&h<12;});
    else if(filterTime==="afternoon")result=result.filter(f=>{const h=new Date(f.departure_time).getHours();return h>=12&&h<17;});
    else if(filterTime==="evening")result=result.filter(f=>{const h=new Date(f.departure_time).getHours();return h>=17;});
    result=result.filter(f=>f.price<=filterMaxPrice);
    if(sortBy==="price")result.sort((a,b)=>a.price-b.price);
    else if(sortBy==="price-desc")result.sort((a,b)=>b.price-a.price);
    else if(sortBy==="departure")result.sort((a,b)=>new Date(a.departure_time)-new Date(b.departure_time));
    else if(sortBy==="duration")result.sort((a,b)=>(new Date(a.arrival_time)-new Date(a.departure_time))-(new Date(b.arrival_time)-new Date(b.departure_time)));
    setFiltered(result);
  },[flights,filterTime,filterMaxPrice,sortBy]);

  const swapCities=()=>{const t=fromCity;setFromCity(toCity);setToCity(t);};
  const handleLogout=()=>{localStorage.removeItem("token");navigate("/login");};

  const searchStructured=async()=>{
    setLoading(true);setSearched(true);
    try{
      const params=new URLSearchParams({from:fromCity.name,to:toCity.name});
      if(date)params.append("date",date);
      const res = await axios.get(`${API}/real-flights?${params}`);
      setFlights(res.data);
      setFilterMaxPrice(res.data.length>0?Math.max(...res.data.map(f=>f.price))+1000:20000);
    }catch{setFlights([]);}
    setLoading(false);
  };

  const searchAI=async()=>{
    if(!aiQuery.trim())return;
    setLoading(true);setSearched(true);
    try{const res=await axios.post(`${API}/ai-search`,{query:aiQuery});setFlights(res.data);setFilterMaxPrice(res.data.length>0?Math.max(...res.data.map(f=>f.price))+1000:20000);}
    catch{setFlights([]);}
    setLoading(false);
  };

  const handleBookClick=(flight)=>{
    if(!token){alert("Please login first!");navigate("/login");return;}
    setBookingFlight(flight);
  };

  const handlePassengerConfirm=(name)=>{setPassengerName(name);setShowPayment(true);};

  const handlePaymentSuccess=async()=>{
    try{await axios.post(`${API}/book`,{flight_id:bookingFlight.id,passenger_name:passengerName},{headers:{Authorization:`Bearer ${token}`}});}
    catch(e){console.error(e);}
    setShowPayment(false);setBookingFlight(null);
    navigate("/bookings");
  };

  const TRAVEL_TABS=[
    {id:"flight",icon:"✈️",label:"Flights",comingSoon:false},
    {id:"bus",icon:"🚌",label:"Buses",comingSoon:true},
    {id:"train",icon:"🚂",label:"Trains",comingSoon:true},
    {id:"hotel",icon:"🏨",label:"Hotels",comingSoon:true},
  ];

  const COMING_SOON_DATA={
    bus:{icon:"🚌",title:"Bus Booking",desc:"Book intercity buses across India. AC sleeper, semi-sleeper and seater. Powered by RedBus API — coming soon."},
    train:{icon:"🚂",title:"Train Booking",desc:"Search and book Indian Railways tickets. Check PNR status and seat availability. Powered by IRCTC API — coming soon."},
    hotel:{icon:"🏨",title:"Hotel Booking",desc:"Find and book hotels across India and abroad. Compare prices and book instantly. Powered by Booking.com API — coming soon."},
  };

  return(
    <>
      <style>{styles}</style>
      <Stars/>
      <div className="nebula"/>
      <ShootingStars/>

      {showFromModal&&<CityModal title="Select departure city" onSelect={c=>{setFromCity(c);setShowFromModal(false);}} onClose={()=>setShowFromModal(false)} exclude={toCity.code}/>}
      {showToModal&&<CityModal title="Select destination city" onSelect={c=>{setToCity(c);setShowToModal(false);}} onClose={()=>setShowToModal(false)} exclude={fromCity.code}/>}
      {bookingFlight&&!showPayment&&<PassengerModal flight={bookingFlight} passengers={passengers} onConfirm={handlePassengerConfirm} onCancel={()=>setBookingFlight(null)}/>}
      {bookingFlight&&showPayment&&<PaymentModal flight={bookingFlight} passengerName={passengerName} passengers={passengers} cabinClass={cabinClass} onSuccess={handlePaymentSuccess} onCancel={()=>{setShowPayment(false);setBookingFlight(null);}}/>}

      <div className="page-wrap">
        <nav className="nav">
          <div className="nav-logo">
            <span style={{fontSize:"18px",marginRight:"6px",filter:"drop-shadow(0 0 6px rgba(129,140,248,0.8))",verticalAlign:"middle"}}>☄️</span>
            CometAI
            <span>Travel Intelligence</span>
          </div>
          <div className="nav-actions">
            <button className="btn-ghost" onClick={()=>navigate("/bookings")}>Bookings</button>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
          </div>
        </nav>

        <div className="hero">
          <p className="hero-eyebrow">✦ AI-Powered Travel</p>
          <h1 className="hero-title">Search Travel<br/>Across The Universe</h1>
          <p className="hero-sub">Flights, buses, trains and hotels</p>
        </div>

        {/* TRAVEL TABS */}
        <div className="travel-tabs">
          {TRAVEL_TABS.map(tab=>(
            <button key={tab.id} className={`travel-tab ${travelType===tab.id?"active":""}`} onClick={()=>{setTravelType(tab.id);setFlights([]);setSearched(false);}}>
              <span className="travel-tab-icon">{tab.icon}</span>
              {tab.label}
              {tab.comingSoon&&<span className="coming-soon-badge">Soon</span>}
            </button>
          ))}
        </div>

        {/* COMING SOON */}
        {travelType!=="flight"&&(
          <div className="coming-soon-panel">
            <div className="cs-icon">{COMING_SOON_DATA[travelType].icon}</div>
            <div className="cs-title">{COMING_SOON_DATA[travelType].title} — Coming Soon</div>
            <div className="cs-sub">{COMING_SOON_DATA[travelType].desc}</div>
            <div className="cs-badge">✦ Phase 2 Feature</div>
          </div>
        )}

        {/* FLIGHT SEARCH */}
        {travelType==="flight"&&(
          <>
            <div className="search-card">
              {/* TRIP TYPE */}
              <div className="trip-toggle">
                {["oneway","roundtrip"].map(t=>(
                  <button key={t} className={`trip-btn ${tripType===t?"active":""}`} onClick={()=>setTripType(t)}>
                    {t==="oneway"?"One Way":"Round Trip"}
                  </button>
                ))}
              </div>

              {/* MODE TOGGLE */}
              <div className="mode-toggle">
                <button className={`mode-btn ${mode==="structured"?"active":""}`} onClick={()=>{setMode("structured");setFlights([]);setSearched(false);}}>🗺 Search</button>
                <button className={`mode-btn ${mode==="ai"?"active":""}`} onClick={()=>{setMode("ai");setFlights([]);setSearched(false);}}>🤖 AI Search</button>
              </div>

              {mode==="structured"&&(
                <>
                  {/* CITY ROW */}
                  <div className="city-row">
                    <div className="city-field" onClick={()=>setShowFromModal(true)}>
                      <div className="city-field-label">From</div>
                      <div className="city-field-code">{fromCity.code}</div>
                      <div className="city-field-name">{fromCity.name}</div>
                    </div>
                    <div className="swap-circle" onClick={swapCities}>⇄</div>
                    <div className="city-field" onClick={()=>setShowToModal(true)}>
                      <div className="city-field-label">To</div>
                      <div className="city-field-code">{toCity.code}</div>
                      <div className="city-field-name">{toCity.name}</div>
                    </div>
                  </div>

                  {/* DATE ROW */}
                  <div className="bottom-row" style={{gridTemplateColumns:tripType==="roundtrip"?"1fr 1fr":"1fr"}}>
                    <div className="bottom-field">
                      <div className="bottom-field-label">Departure</div>
                      <input className="date-input" type="date" value={date} min={today} onChange={e=>setDate(e.target.value)}/>
                      {date&&<div className="bottom-field-sub">{new Date(date).toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}</div>}
                    </div>
                    {tripType==="roundtrip"&&(
                      <div className="bottom-field">
                        <div className="bottom-field-label">Return</div>
                        <input className="date-input" type="date" value={returnDate} min={date||today} onChange={e=>setReturnDate(e.target.value)}/>
                        {returnDate&&<div className="bottom-field-sub">{new Date(returnDate).toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}</div>}
                      </div>
                    )}
                  </div>

                  {/* PASSENGERS + CLASS */}
                  <div className="pax-class-row">
                    <div className="pax-field">
                      <div className="pax-label">Travellers</div>
                      <div className="pax-controls">
                        <button className="pax-btn" onClick={()=>setPassengers(p=>Math.max(1,p-1))}>−</button>
                        <div className="pax-count">{passengers}</div>
                        <button className="pax-btn" onClick={()=>setPassengers(p=>Math.min(9,p+1))}>+</button>
                        <span style={{fontSize:"12px",color:"rgba(165,180,252,0.4)",marginLeft:"4px"}}>{passengers===1?"Adult":"Adults"}</span>
                      </div>
                    </div>
                    <div className="pax-field">
                      <div className="pax-label">Class</div>
                      <select className="class-select" value={cabinClass} onChange={e=>setCabinClass(e.target.value)}>
                        {CLASSES.map(c=><option key={c} value={c}>{c}</option>)}
                      </select>
                      <div className="bottom-field-sub" style={{marginTop:"4px"}}>Cabin class</div>
                    </div>
                  </div>
                </>
              )}

              {mode==="ai"&&(
                <div style={{marginBottom:"16px"}}>
                  <div className="ai-box">
                    <span style={{fontSize:"16px",opacity:0.5}}>🤖</span>
                    <input className="ai-input" type="text" placeholder="cheapest flights bangalore to mumbai tomorrow..." value={aiQuery} onChange={e=>setAiQuery(e.target.value)} onKeyPress={e=>{if(e.key==="Enter")searchAI();}}/>
                  </div>
                  <div style={{fontSize:"11px",color:"rgba(165,180,252,0.3)",textAlign:"center",marginTop:"8px"}}>Try: "cheap flights blr to del next friday"</div>
                </div>
              )}

              <button className="btn-search-main" onClick={mode==="structured"?searchStructured:searchAI}>
                {mode==="structured"?`Search Flights ✈`:`Search with AI 🤖`}
              </button>
            </div>

            {loading&&<div className="loading">Scanning flight paths...</div>}

            {/* FILTERS */}
            {!loading&&flights.length>0&&(
              <div className="filters-bar">
                <div className="filters-title">✦ Filter & Sort</div>
                <div className="filters-scroll">
                  {[["any","All times"],["morning","Morning"],["afternoon","Afternoon"],["evening","Evening"]].map(([val,label])=>(
                    <button key={val} className={`filter-chip ${filterTime===val?"active":""}`} onClick={()=>setFilterTime(val)}>{label}</button>
                  ))}
                  {[["price","Cheapest"],["departure","Earliest"],["duration","Fastest"],["price-desc","Most expensive"]].map(([val,label])=>(
                    <button key={val} className={`filter-chip ${sortBy===val?"active":""}`} onClick={()=>setSortBy(val)}>{label}</button>
                  ))}
                </div>
                <input type="range" className="price-slider" min="1000" max={filterMaxPrice+1000} step="500" value={filterMaxPrice} onChange={e=>setFilterMaxPrice(Number(e.target.value))}/>
                <div className="price-label"><span>₹1,000</span><span style={{color:"#a5b4fc"}}>Max ₹{filterMaxPrice.toLocaleString()}</span></div>
              </div>
            )}

            {/* RESULTS */}
            {!loading&&searched&&(
              <>
                <div className="results-header">
                  <p className="results-label">{filtered.length>0?`${filtered.length} of ${flights.length} flights`:"No flights match"}</p>
                </div>
                <div className="flights-grid">
                  {filtered.map(flight=>(
                    <div className="flight-card" key={flight.id}>
                      <div className="card-top">
                        <div className="airline-info">
                          <div className="airline-dot"/>
                          <div className="airline-name">{flight.airline}</div>
                        </div>
                        <div className="stops-badge">Non-stop</div>
                      </div>
                      <div className="card-route">
                        <div className="route-city">
                          <div className="route-time">{formatTime(flight.departure_time)}</div>
                          <div className="route-code">{flight.from_city?.slice(0,3).toUpperCase()}</div>
                          <div className="route-date">{formatDate(flight.departure_time)}</div>
                        </div>
                        <div className="route-middle">
                          <div className="route-duration">{calcDuration(flight.departure_time,flight.arrival_time)}</div>
                          <div className="route-line-wrap">
                            <div className="route-line-bar"/>
                            <span className="route-plane">✈</span>
                            <div className="route-line-bar"/>
                          </div>
                          <div className="route-direct">Direct</div>
                        </div>
                        <div className="route-city" style={{textAlign:"right"}}>
                          <div className="route-time">{formatTime(flight.arrival_time)}</div>
                          <div className="route-code">{flight.to_city?.slice(0,3).toUpperCase()}</div>
                          <div className="route-date">{formatDate(flight.arrival_time)}</div>
                        </div>
                      </div>
                      <div className="card-bottom">
                        <div className="price-wrap">
                          <div className="price-from">from</div>
                          <div className="price-amount">₹{(flight.price*passengers).toLocaleString()}</div>
                          <div className="price-pax">{passengers} passenger{passengers>1?"s":""} · {cabinClass}</div>
                        </div>
                        <button className="btn-book" onClick={()=>handleBookClick(flight)}>Book →</button>
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
          </>
        )}
      </div>
    </>
  );
}

function App(){
  return(
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage/>}/>
        <Route path="/search" element={<SearchPage/>}/>
        <Route path="/login" element={<Login/>}/>
        <Route path="/register" element={<Register/>}/>
        <Route path="/bookings" element={<MyBookings/>}/>
        <Route path="/admin" element={<AdminDashboard/>}/>
        <Route path="/waitlist" element={<Waitlist/>}/>
      </Routes>
    </Router>
  );
}

export default App;