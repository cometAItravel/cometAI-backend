import React, { useState, useEffect } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import MyBookings from "./pages/MyBookings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import LandingPage from "./pages/LandingPage";

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
  .star {
    position: absolute; border-radius: 50%; background: white;
    animation: twinkle var(--d,3s) ease-in-out infinite var(--delay,0s);
  }
  @keyframes twinkle {
    0%,100%{opacity:var(--min-op,.2);transform:scale(1);}
    50%{opacity:1;transform:scale(1.5);}
  }
  .shooting-star {
    position: fixed; top:0; left:0; width:2px; height:2px;
    background:white; border-radius:50%; pointer-events:none; z-index:2;
  }
  .shooting-star::after {
    content:''; position:absolute; top:50%; right:0; transform:translateY(-50%);
    width:140px; height:1px;
    background:linear-gradient(90deg,rgba(255,255,255,0),rgba(165,180,252,0.7),white);
    border-radius:2px;
  }
  @keyframes shoot {
    0%{transform:translate(0,0) rotate(var(--angle));opacity:1;}
    70%{opacity:1;}
    100%{transform:translate(var(--tx),var(--ty)) rotate(var(--angle));opacity:0;}
  }

  .page-wrap { position:relative; z-index:1; min-height:100vh; padding:0 24px 60px; max-width:1100px; margin:0 auto; }

  /* ── NAV ── */
  .nav {
    display:flex; align-items:center; justify-content:space-between;
    padding:28px 0 40px; border-bottom:1px solid rgba(255,255,255,0.08); margin-bottom:48px;
  }
  .nav-logo {
    font-family:'Orbitron',sans-serif; font-size:22px; font-weight:800; letter-spacing:1px;
    background:linear-gradient(90deg,#818cf8,#c084fc,#38bdf8);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  }
  .nav-logo span {
    font-size:13px; font-family:'DM Sans',sans-serif; font-weight:300; display:block;
    letter-spacing:3px; background:linear-gradient(90deg,#818cf8aa,#c084fcaa);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; margin-top:2px;
  }
  .nav-actions{display:flex;gap:12px;align-items:center;}
  .btn-ghost{background:transparent;border:1px solid rgba(129,140,248,0.35);color:#a5b4fc;padding:9px 20px;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:14px;cursor:pointer;transition:all 0.2s;}
  .btn-ghost:hover{background:rgba(129,140,248,0.1);border-color:rgba(129,140,248,0.6);color:#c7d2fe;}
  .btn-logout{background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);color:#fca5a5;padding:9px 20px;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:14px;cursor:pointer;transition:all 0.2s;}
  .btn-logout:hover{background:rgba(239,68,68,0.22);border-color:rgba(239,68,68,0.5);}

  /* ── HERO ── */
  .hero{text-align:center;margin-bottom:40px;animation:fadeUp 0.7s ease both;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(24px);}to{opacity:1;transform:translateY(0);}}
  .hero-eyebrow{font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#818cf8;margin-bottom:16px;font-weight:500;}
  .hero-title{font-family:'Orbitron',sans-serif;font-size:clamp(28px,5vw,48px);font-weight:800;line-height:1.15;background:linear-gradient(135deg,#e0e7ff 0%,#a5b4fc 40%,#c084fc 70%,#38bdf8 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:16px;letter-spacing:1px;}
  .hero-sub{font-size:15px;color:rgba(180,190,255,0.55);font-weight:300;}

  /* ── TRAVEL TYPE TABS ── */
  .travel-tabs {
    display:flex; justify-content:center; gap:12px; margin-bottom:32px; flex-wrap:wrap;
    animation:fadeUp 0.7s ease 0.05s both;
  }
  .travel-tab {
    display:flex; align-items:center; gap:8px;
    padding:10px 24px; border-radius:12px; cursor:pointer;
    border:1px solid rgba(129,140,248,0.2); background:rgba(255,255,255,0.02);
    font-family:'DM Sans',sans-serif; font-size:14px; font-weight:400;
    color:rgba(165,180,252,0.5); transition:all 0.2s; letter-spacing:0.3px;
  }
  .travel-tab:hover{border-color:rgba(129,140,248,0.4);color:#a5b4fc;background:rgba(129,140,248,0.05);}
  .travel-tab.active{background:rgba(99,102,241,0.15);border-color:rgba(129,140,248,0.5);color:#c7d2fe;}
  .travel-tab-icon{font-size:18px;}
  .coming-soon-badge{font-size:9px;letter-spacing:1px;background:rgba(251,191,36,0.15);border:1px solid rgba(251,191,36,0.25);color:#fcd34d;padding:2px 7px;border-radius:10px;text-transform:uppercase;}

  /* ── COMING SOON PANEL ── */
  .coming-soon-panel {
    max-width:600px; margin:0 auto 52px;
    background:rgba(255,255,255,0.02); border:1px solid rgba(129,140,248,0.12);
    border-radius:20px; padding:48px 32px; text-align:center;
    animation:fadeUp 0.5s ease both;
  }
  .cs-icon{font-size:52px;margin-bottom:20px;filter:drop-shadow(0 0 20px rgba(129,140,248,0.4));}
  .cs-title{font-family:'Orbitron',sans-serif;font-size:20px;font-weight:700;background:linear-gradient(135deg,#e0e7ff,#a5b4fc);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:10px;}
  .cs-sub{font-size:14px;color:rgba(165,180,252,0.4);line-height:1.7;font-weight:300;}
  .cs-badge{display:inline-block;margin-top:20px;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.25);color:#fcd34d;padding:8px 20px;border-radius:20px;font-size:12px;letter-spacing:1px;}

  /* ── MODE TOGGLE ── */
  .mode-toggle{display:flex;justify-content:center;gap:0;margin-bottom:28px;animation:fadeUp 0.7s ease 0.1s both;}
  .mode-btn{padding:10px 28px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;border:1px solid rgba(129,140,248,0.25);background:transparent;color:rgba(165,180,252,0.5);transition:all 0.2s;letter-spacing:0.5px;}
  .mode-btn:first-child{border-radius:10px 0 0 10px;}
  .mode-btn:last-child{border-radius:0 10px 10px 0;border-left:none;}
  .mode-btn.active{background:rgba(99,102,241,0.2);border-color:rgba(129,140,248,0.5);color:#a5b4fc;}

  /* ── STRUCTURED SEARCH ── */
  .structured-search{max-width:780px;margin:0 auto 40px;animation:fadeUp 0.7s ease 0.15s both;}
  .search-fields{display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:12px;align-items:end;}
  .field-group{display:flex;flex-direction:column;gap:8px;}
  .field-label{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(165,180,252,0.45);font-weight:500;padding-left:4px;}
  .field-select,.field-date{background:rgba(255,255,255,0.05);border:1px solid rgba(129,140,248,0.2);border-radius:12px;padding:13px 16px;color:#e0e7ff;font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:all 0.2s;cursor:pointer;width:100%;appearance:none;-webkit-appearance:none;}
  .field-select:focus,.field-date:focus{border-color:rgba(129,140,248,0.55);background:rgba(129,140,248,0.08);box-shadow:0 0 0 3px rgba(129,140,248,0.1);}
  .field-select option{background:#0d0e1a;color:#e0e7ff;}
  .field-date::-webkit-calendar-picker-indicator{filter:invert(0.7) sepia(1) saturate(3) hue-rotate(200deg);cursor:pointer;}
  .select-wrap{position:relative;}
  .select-wrap::after{content:'▾';position:absolute;right:14px;top:50%;transform:translateY(-50%);color:rgba(165,180,252,0.4);font-size:12px;pointer-events:none;}
  .btn-search-big{background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;color:white;padding:13px 32px;border-radius:12px;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:500;cursor:pointer;transition:all 0.2s;white-space:nowrap;height:50px;box-shadow:0 4px 20px rgba(99,102,241,0.3);}
  .btn-search-big:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(99,102,241,0.5);}

  /* ── AI SEARCH ── */
  .ai-search-wrap{max-width:680px;margin:0 auto 40px;animation:fadeUp 0.7s ease 0.15s both;}
  .search-box{display:flex;align-items:center;background:rgba(255,255,255,0.04);border:1px solid rgba(129,140,248,0.25);border-radius:16px;padding:6px 6px 6px 20px;gap:12px;transition:border-color 0.2s,box-shadow 0.2s;}
  .search-box:focus-within{border-color:rgba(129,140,248,0.6);box-shadow:0 0 0 3px rgba(129,140,248,0.1);}
  .search-icon{font-size:18px;opacity:0.5;flex-shrink:0;}
  .search-input{flex:1;background:transparent;border:none;outline:none;color:#e0e7ff;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:300;}
  .search-input::placeholder{color:rgba(165,180,252,0.35);}
  .btn-search{background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;color:white;padding:12px 28px;border-radius:12px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer;transition:all 0.2s;white-space:nowrap;}
  .btn-search:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(99,102,241,0.35);}
  .search-hint{text-align:center;margin-top:12px;font-size:12px;color:rgba(165,180,252,0.3);}

  /* ── FILTERS ── */
  .filters-bar{max-width:100%;margin-bottom:28px;background:rgba(255,255,255,0.02);border:1px solid rgba(129,140,248,0.12);border-radius:16px;padding:20px 24px;animation:fadeUp 0.5s ease both;}
  .filters-title{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(165,180,252,0.4);margin-bottom:16px;font-weight:500;}
  .filters-row{display:flex;gap:16px;align-items:flex-end;flex-wrap:wrap;}
  .filter-group{display:flex;flex-direction:column;gap:6px;}
  .filter-label{font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(165,180,252,0.4);}
  .filter-select{background:rgba(255,255,255,0.04);border:1px solid rgba(129,140,248,0.18);border-radius:8px;padding:8px 12px;color:#e0e7ff;font-family:'DM Sans',sans-serif;font-size:13px;outline:none;cursor:pointer;appearance:none;-webkit-appearance:none;min-width:130px;transition:all 0.2s;}
  .filter-select option{background:#0d0e1a;}
  .price-range-wrap{display:flex;flex-direction:column;gap:6px;}
  .price-range-labels{display:flex;justify-content:space-between;font-size:11px;color:rgba(165,180,252,0.4);}
  .price-slider{-webkit-appearance:none;width:180px;height:3px;background:linear-gradient(90deg,#6366f1,#8b5cf6);border-radius:2px;outline:none;cursor:pointer;}
  .price-slider::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;background:#a5b4fc;border-radius:50%;cursor:pointer;box-shadow:0 0 6px rgba(129,140,248,0.6);}
  .sort-select{background:rgba(255,255,255,0.04);border:1px solid rgba(129,140,248,0.18);border-radius:8px;padding:7px 12px;color:#a5b4fc;font-family:'DM Sans',sans-serif;font-size:12px;outline:none;cursor:pointer;appearance:none;-webkit-appearance:none;}
  .sort-select option{background:#0d0e1a;}
  .btn-clear-filters{background:transparent;border:1px solid rgba(239,68,68,0.25);color:rgba(252,165,165,0.6);padding:8px 16px;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:12px;cursor:pointer;transition:all 0.2s;white-space:nowrap;}
  .btn-clear-filters:hover{background:rgba(239,68,68,0.1);color:#fca5a5;border-color:rgba(239,68,68,0.4);}

  /* ── RESULTS ── */
  .results-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}
  .results-label{font-family:'Orbitron',sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(129,140,248,0.5);}
  .flights-grid{display:flex;flex-direction:column;gap:16px;animation:fadeUp 0.5s ease both;}

  /* ── FLIGHT CARD ── */
  .flight-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:22px 28px;transition:all 0.25s;position:relative;overflow:hidden;}
  .flight-card::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(99,102,241,0.05) 0%,transparent 60%);pointer-events:none;}
  .flight-card:hover{border-color:rgba(129,140,248,0.35);background:rgba(255,255,255,0.05);transform:translateY(-2px);box-shadow:0 12px 40px rgba(0,0,0,0.4),0 0 0 1px rgba(129,140,248,0.1);}
  .card-main{display:grid;grid-template-columns:160px 1fr auto;align-items:center;gap:20px;}
  .airline-name{font-family:'Orbitron',sans-serif;font-size:12px;font-weight:600;color:#c7d2fe;letter-spacing:1px;margin-bottom:4px;}
  .airline-code{font-size:11px;color:rgba(165,180,252,0.4);letter-spacing:1px;}
  .stops-badge{display:inline-block;margin-top:8px;padding:3px 8px;border-radius:20px;font-size:10px;letter-spacing:0.5px;background:rgba(52,211,153,0.1);border:1px solid rgba(52,211,153,0.2);color:#6ee7b7;}
  .flight-timeline{display:flex;align-items:center;gap:16px;flex:1;justify-content:center;}
  .time-block{text-align:center;min-width:60px;}
  .time-value{font-family:'Orbitron',sans-serif;font-size:20px;font-weight:800;color:#e0e7ff;letter-spacing:1px;}
  .time-city{font-size:11px;color:rgba(165,180,252,0.45);margin-top:3px;letter-spacing:1px;}
  .time-date{font-size:10px;color:rgba(165,180,252,0.3);margin-top:2px;}
  .timeline-line{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:100px;}
  .timeline-duration{font-size:11px;color:rgba(165,180,252,0.5);letter-spacing:0.5px;}
  .timeline-bar{width:100%;display:flex;align-items:center;gap:6px;}
  .timeline-bar-line{flex:1;height:1px;background:linear-gradient(90deg,rgba(129,140,248,0.2),rgba(192,132,252,0.4),rgba(129,140,248,0.2));}
  .timeline-stops-text{font-size:10px;color:rgba(251,191,36,0.6);letter-spacing:0.3px;}
  .price-action{text-align:right;min-width:140px;}
  .price-label-small{font-size:10px;color:rgba(165,180,252,0.35);letter-spacing:1px;margin-bottom:4px;}
  .price-amount{font-family:'Orbitron',sans-serif;font-size:22px;font-weight:800;background:linear-gradient(135deg,#a5f3fc,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:12px;}
  .btn-book{background:linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2));border:1px solid rgba(129,140,248,0.4);color:#a5b4fc;padding:10px 22px;border-radius:10px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all 0.2s;display:block;width:100%;}
  .btn-book:hover{background:linear-gradient(135deg,rgba(99,102,241,0.5),rgba(139,92,246,0.5));border-color:rgba(129,140,248,0.7);color:#e0e7ff;box-shadow:0 4px 20px rgba(99,102,241,0.3);transform:translateY(-1px);}

  /* ── MODALS ── */
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:100;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);animation:fadeIn 0.2s ease;}
  @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
  .modal-card{background:#0d0e1a;border:1px solid rgba(129,140,248,0.25);border-radius:20px;padding:36px;width:100%;max-width:420px;box-shadow:0 24px 80px rgba(0,0,0,0.7);animation:slideUp 0.3s ease;}
  @keyframes slideUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
  .modal-title{font-family:'Orbitron',sans-serif;font-size:16px;font-weight:600;color:#e0e7ff;margin-bottom:6px;letter-spacing:1px;}
  .modal-sub{font-size:13px;color:rgba(165,180,252,0.4);margin-bottom:24px;font-weight:300;}
  .modal-input-label{display:block;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(165,180,252,0.5);margin-bottom:8px;}
  .modal-input{width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(129,140,248,0.2);border-radius:10px;padding:12px 16px;color:#e0e7ff;font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:all 0.2s;margin-bottom:20px;}
  .modal-input:focus{border-color:rgba(129,140,248,0.55);background:rgba(129,140,248,0.06);box-shadow:0 0 0 3px rgba(129,140,248,0.08);}
  .modal-input::placeholder{color:rgba(165,180,252,0.25);}
  .modal-actions{display:flex;gap:12px;}
  .btn-confirm{flex:1;padding:12px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;border-radius:10px;color:white;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer;transition:all 0.2s;}
  .btn-confirm:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(99,102,241,0.4);}
  .btn-cancel{padding:12px 20px;background:transparent;border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:rgba(165,180,252,0.5);font-family:'DM Sans',sans-serif;font-size:14px;cursor:pointer;transition:all 0.2s;}
  .btn-cancel:hover{border-color:rgba(255,255,255,0.2);color:#a5b4fc;}

  /* ── PAYMENT MODAL ── */
  .payment-modal{background:#0a0b18;border:1px solid rgba(129,140,248,0.2);border-radius:24px;padding:0;width:100%;max-width:440px;box-shadow:0 32px 100px rgba(0,0,0,0.8);animation:slideUp 0.3s ease;overflow:hidden;}
  .payment-header{background:linear-gradient(135deg,#1a1b3a,#0f1028);padding:24px 28px;border-bottom:1px solid rgba(129,140,248,0.1);display:flex;align-items:center;justify-content:space-between;}
  .payment-brand{font-family:'Orbitron',sans-serif;font-size:14px;font-weight:800;background:linear-gradient(90deg,#818cf8,#c084fc);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
  .payment-secure{font-size:11px;color:rgba(52,211,153,0.7);display:flex;align-items:center;gap:4px;}
  .payment-body{padding:28px;}
  .payment-amount-display{text-align:center;margin-bottom:28px;padding:20px;background:rgba(99,102,241,0.08);border:1px solid rgba(129,140,248,0.15);border-radius:16px;}
  .payment-amount-label{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(165,180,252,0.4);margin-bottom:8px;}
  .payment-amount-value{font-family:'Orbitron',sans-serif;font-size:32px;font-weight:800;background:linear-gradient(135deg,#a5f3fc,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
  .payment-flight-info{font-size:12px;color:rgba(165,180,252,0.4);margin-top:6px;}
  .payment-methods{display:flex;gap:8px;margin-bottom:24px;}
  .pay-method-btn{flex:1;padding:10px 8px;background:rgba(255,255,255,0.03);border:1px solid rgba(129,140,248,0.15);border-radius:10px;color:rgba(165,180,252,0.5);font-family:'DM Sans',sans-serif;font-size:12px;cursor:pointer;transition:all 0.2s;text-align:center;}
  .pay-method-btn.active{background:rgba(99,102,241,0.15);border-color:rgba(129,140,248,0.5);color:#a5b4fc;}
  .pay-input-label{font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(165,180,252,0.4);margin-bottom:8px;display:block;}
  .pay-input{width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(129,140,248,0.18);border-radius:10px;padding:12px 16px;color:#e0e7ff;font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:all 0.2s;margin-bottom:14px;letter-spacing:1px;}
  .pay-input:focus{border-color:rgba(129,140,248,0.5);background:rgba(129,140,248,0.06);}
  .pay-input::placeholder{color:rgba(165,180,252,0.2);letter-spacing:0;}
  .pay-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
  .btn-pay{width:100%;padding:16px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;border-radius:12px;color:white;font-family:'DM Sans',sans-serif;font-size:16px;font-weight:600;cursor:pointer;margin-top:8px;transition:all 0.2s;letter-spacing:0.5px;box-shadow:0 4px 20px rgba(99,102,241,0.3);}
  .btn-pay:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(99,102,241,0.5);}
  .pay-note{text-align:center;font-size:11px;color:rgba(165,180,252,0.25);margin-top:12px;}
  .processing-wrap{padding:60px 28px;text-align:center;}
  .processing-spinner{width:64px;height:64px;border:3px solid rgba(129,140,248,0.2);border-top-color:#818cf8;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 24px;}
  @keyframes spin{to{transform:rotate(360deg);}}
  .processing-text{font-family:'Orbitron',sans-serif;font-size:14px;color:#a5b4fc;letter-spacing:2px;animation:pulse 1.5s ease infinite;}
  @keyframes pulse{0%,100%{opacity:0.5}50%{opacity:1}}
  .success-wrap{padding:48px 28px;text-align:center;}
  .success-icon{font-size:56px;margin-bottom:20px;animation:popIn 0.5s ease;}
  @keyframes popIn{from{transform:scale(0);opacity:0;}to{transform:scale(1);opacity:1;}}
  .success-title{font-family:'Orbitron',sans-serif;font-size:20px;font-weight:800;background:linear-gradient(135deg,#6ee7b7,#38bdf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:8px;}
  .success-sub{font-size:14px;color:rgba(165,180,252,0.5);margin-bottom:24px;}
  .booking-id-box{background:rgba(99,102,241,0.1);border:1px solid rgba(129,140,248,0.2);border-radius:12px;padding:16px;margin-bottom:24px;}
  .booking-id-label{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(165,180,252,0.4);margin-bottom:6px;}
  .booking-id-value{font-family:'Orbitron',sans-serif;font-size:18px;font-weight:800;color:#a5b4fc;letter-spacing:3px;}
  .btn-done{width:100%;padding:14px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;border-radius:12px;color:white;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:500;cursor:pointer;transition:all 0.2s;}
  .btn-done:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(99,102,241,0.4);}

  .empty-state{text-align:center;padding:80px 20px;color:rgba(165,180,252,0.25);animation:fadeUp 0.5s ease both;}
  .empty-icon{font-size:48px;margin-bottom:16px;opacity:0.4;}
  .empty-text{font-size:14px;letter-spacing:0.5px;font-family:'Orbitron',sans-serif;}
  .loading{text-align:center;padding:60px;color:rgba(129,140,248,0.6);font-family:'Orbitron',sans-serif;font-size:12px;letter-spacing:3px;animation:pulse 1.5s ease infinite;}
`;

const CITIES = ["Bangalore","Mumbai","Delhi","Chennai","Hyderabad","Kolkata","Goa","Pune","Kochi","Ahmedabad","Jaipur","Varanasi","Dubai","Singapore"];
const CITY_CODES = {bangalore:'BLR',mumbai:'BOM',delhi:'DEL',chennai:'MAA',hyderabad:'HYD',kolkata:'CCU',goa:'GOI',pune:'PNQ',dubai:'DXB',kochi:'COK',ahmedabad:'AMD',jaipur:'JAI',varanasi:'VNS',singapore:'SIN'};
const AIRLINES = ["All Airlines","IndiGo","Air India","SpiceJet","Akasa Air","Air India Express"];

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
      setTimeout(launch,1500+Math.random()*3500);
    };
    const t=setTimeout(launch,1000);
    return()=>clearTimeout(t);
  },[]);
  return<>{stars.map(s=><div key={s.id} className="shooting-star" style={{left:`${s.x}%`,top:`${s.y}%`,'--angle':`${s.angle}deg`,'--tx':`${s.tx}px`,'--ty':`${s.ty}px`,animation:`shoot ${s.dur}ms ease-out forwards`}}/>)}</>;
}

function PassengerModal({flight,onConfirm,onCancel}){
  const [name,setName]=useState("");
  return(
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={e=>e.stopPropagation()}>
        <div className="modal-title">Passenger Details</div>
        <div className="modal-sub">{flight.airline} · {flight.from_city} → {flight.to_city}</div>
        <label className="modal-input-label">Full Name</label>
        <input className="modal-input" type="text" placeholder="Enter your full name" value={name} onChange={e=>setName(e.target.value)} onKeyPress={e=>{if(e.key==="Enter"&&name.trim())onConfirm(name);}} autoFocus/>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="btn-confirm" onClick={()=>{if(name.trim())onConfirm(name);}}>Continue to Payment →</button>
        </div>
      </div>
    </div>
  );
}

function PaymentModal({flight,passengerName,onSuccess,onCancel}){
  const [step,setStep]=useState("payment");
  const [payMethod,setPayMethod]=useState("card");
  const [cardNo,setCardNo]=useState("");
  const [expiry,setExpiry]=useState("");
  const [cvv,setCvv]=useState("");
  const [bookingId]=useState("CMT"+Date.now().toString(36).toUpperCase().slice(-6));
  const formatCard=(v)=>v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const formatExpiry=(v)=>{const d=v.replace(/\D/g,"").slice(0,4);return d.length>=3?d.slice(0,2)+"/"+d.slice(2):d;};
  const handlePay=async()=>{
    if(payMethod==="card"&&(!cardNo||!expiry||!cvv)){alert("Please fill all card details.");return;}
    setStep("processing");
    setTimeout(()=>setStep("success"),2500);
  };
  if(step==="processing")return<div className="modal-overlay"><div className="payment-modal"><div className="payment-header"><div className="payment-brand">☄️ CometAI Pay</div><div className="payment-secure">🔒 Secure</div></div><div className="processing-wrap"><div className="processing-spinner"/><div className="processing-text">Processing payment...</div></div></div></div>;
  if(step==="success")return<div className="modal-overlay"><div className="payment-modal"><div className="payment-header"><div className="payment-brand">☄️ CometAI Pay</div><div className="payment-secure">🔒 Secure</div></div><div className="success-wrap"><div className="success-icon">🚀</div><div className="success-title">Booking Confirmed!</div><div className="success-sub">{flight.airline} · {flight.from_city} → {flight.to_city}<br/>Passenger: {passengerName}</div><div className="booking-id-box"><div className="booking-id-label">Booking ID</div><div className="booking-id-value">{bookingId}</div></div><button className="btn-done" onClick={()=>onSuccess(bookingId)}>View My Bookings →</button></div></div></div>;
  return(
    <div className="modal-overlay" onClick={onCancel}>
      <div className="payment-modal" onClick={e=>e.stopPropagation()}>
        <div className="payment-header"><div className="payment-brand">☄️ CometAI Pay</div><div className="payment-secure">🔒 256-bit SSL</div></div>
        <div className="payment-body">
          <div className="payment-amount-display"><div className="payment-amount-label">Total Amount</div><div className="payment-amount-value">₹{flight.price?.toLocaleString()}</div><div className="payment-flight-info">{flight.from_city} → {flight.to_city} · {passengerName}</div></div>
          <div className="payment-methods">{[["card","💳 Card"],["upi","⚡ UPI"],["netbanking","🏦 Netbanking"]].map(([id,label])=><button key={id} className={`pay-method-btn ${payMethod===id?"active":""}`} onClick={()=>setPayMethod(id)}>{label}</button>)}</div>
          {payMethod==="card"&&<><label className="pay-input-label">Card Number</label><input className="pay-input" placeholder="4111 1111 1111 1111" value={cardNo} onChange={e=>setCardNo(formatCard(e.target.value))} maxLength={19}/><div className="pay-row"><div><label className="pay-input-label">Expiry</label><input className="pay-input" placeholder="MM/YY" value={expiry} onChange={e=>setExpiry(formatExpiry(e.target.value))} maxLength={5}/></div><div><label className="pay-input-label">CVV</label><input className="pay-input" placeholder="•••" type="password" value={cvv} onChange={e=>setCvv(e.target.value.slice(0,3))} maxLength={3}/></div></div></>}
          {payMethod==="upi"&&<><label className="pay-input-label">UPI ID</label><input className="pay-input" placeholder="yourname@upi"/></>}
          {payMethod==="netbanking"&&<><label className="pay-input-label">Select Bank</label><select className="pay-input" style={{cursor:"pointer"}}><option>SBI — State Bank of India</option><option>HDFC Bank</option><option>ICICI Bank</option><option>Axis Bank</option><option>Kotak Mahindra Bank</option></select></>}
          <button className="btn-pay" onClick={handlePay}>Pay ₹{flight.price?.toLocaleString()} →</button>
          <div className="pay-note">🔒 This is a demo payment. No real money will be charged.</div>
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
  const [mode,setMode]=useState("structured");
  const [from,setFrom]=useState("");
  const [to,setTo]=useState("");
  const [date,setDate]=useState("");
  const [aiQuery,setAiQuery]=useState("");
  const [flights,setFlights]=useState([]);
  const [filtered,setFiltered]=useState([]);
  const [loading,setLoading]=useState(false);
  const [searched,setSearched]=useState(false);
  const [bookingFlight,setBookingFlight]=useState(null);
  const [passengerName,setPassengerName]=useState("");
  const [showPayment,setShowPayment]=useState(false);
  const [filterAirline,setFilterAirline]=useState("All Airlines");
  const [filterMaxPrice,setFilterMaxPrice]=useState(20000);
  const [filterTime,setFilterTime]=useState("any");
  const [sortBy,setSortBy]=useState("price");
  const navigate=useNavigate();
  const token=localStorage.getItem("token");
  const today=new Date().toISOString().split("T")[0];

  useEffect(()=>{
    let result=[...flights];
    if(filterAirline!=="All Airlines")result=result.filter(f=>f.airline===filterAirline);
    result=result.filter(f=>f.price<=filterMaxPrice);
    if(filterTime==="morning")result=result.filter(f=>{const h=new Date(f.departure_time).getHours();return h>=5&&h<12;});
    else if(filterTime==="afternoon")result=result.filter(f=>{const h=new Date(f.departure_time).getHours();return h>=12&&h<17;});
    else if(filterTime==="evening")result=result.filter(f=>{const h=new Date(f.departure_time).getHours();return h>=17;});
    if(sortBy==="price")result.sort((a,b)=>a.price-b.price);
    else if(sortBy==="price-desc")result.sort((a,b)=>b.price-a.price);
    else if(sortBy==="departure")result.sort((a,b)=>new Date(a.departure_time)-new Date(b.departure_time));
    else if(sortBy==="duration")result.sort((a,b)=>(new Date(a.arrival_time)-new Date(a.departure_time))-(new Date(b.arrival_time)-new Date(b.departure_time)));
    setFiltered(result);
  },[flights,filterAirline,filterMaxPrice,filterTime,sortBy]);

  const clearFilters=()=>{setFilterAirline("All Airlines");setFilterMaxPrice(20000);setFilterTime("any");setSortBy("price");};
  const handleLogout=()=>{localStorage.removeItem("token");navigate("/login");};
  const swapCities=()=>{const t=from;setFrom(to);setTo(t);};

  const searchStructured=async()=>{
    if(!from||!to){alert("Please select From and To cities.");return;}
    setLoading(true);setSearched(true);
    try{const params=new URLSearchParams({from,to});if(date)params.append("date",date);const res=await axios.get(`${API}/flights?${params}`);setFlights(res.data);}
    catch{setFlights([]);}
    setLoading(false);
  };

  const searchAI=async()=>{
    if(!aiQuery.trim())return;
    setLoading(true);setSearched(true);
    try{const res=await axios.post(`${API}/ai-search`,{query:aiQuery});setFlights(res.data);}
    catch{setFlights([]);}
    setLoading(false);
  };

  const handleBookClick=(flight)=>{
    if(!token){alert("Please login first!");navigate("/login");return;}
    setBookingFlight(flight);
  };

  const handlePassengerConfirm=(name)=>{setPassengerName(name);setShowPayment(true);};

  const handlePaymentSuccess=async()=>{
    try{
      await axios.post(`${API}/book`,{flight_id:bookingFlight.id,passenger_name:passengerName},{headers:{Authorization:`Bearer ${token}`}});
    }catch(e){console.error(e);}
    setShowPayment(false);setBookingFlight(null);
    navigate("/bookings");
  };

  const getCode=(city)=>CITY_CODES[city?.toLowerCase()]||city?.slice(0,3).toUpperCase();
  const maxPriceInResults=flights.length>0?Math.max(...flights.map(f=>f.price)):20000;

  const TRAVEL_TABS=[
    {id:"flight",icon:"✈️",label:"Flights",comingSoon:false},
    {id:"bus",icon:"🚌",label:"Buses",comingSoon:true},
    {id:"train",icon:"🚂",label:"Trains",comingSoon:true},
    {id:"hotel",icon:"🏨",label:"Hotels",comingSoon:true},
  ];

  const COMING_SOON_DATA={
    bus:{icon:"🚌",title:"Bus Booking",desc:"Book intercity buses across India. AC sleeper, semi-sleeper and seater options. Powered by RedBus API — coming soon."},
    train:{icon:"🚂",title:"Train Booking",desc:"Search and book Indian Railways tickets. Check PNR status, seat availability and platform info. Powered by IRCTC API — coming soon."},
    hotel:{icon:"🏨",title:"Hotel Booking",desc:"Find and book hotels across India and abroad. Compare prices, read reviews and book instantly. Powered by Booking.com API — coming soon."},
  };

  return(
    <>
      <style>{styles}</style>
      <Stars/>
      <div className="nebula"/>
      <ShootingStars/>

      {bookingFlight&&!showPayment&&<PassengerModal flight={bookingFlight} onConfirm={handlePassengerConfirm} onCancel={()=>setBookingFlight(null)}/>}
      {bookingFlight&&showPayment&&<PaymentModal flight={bookingFlight} passengerName={passengerName} onSuccess={handlePaymentSuccess} onCancel={()=>{setShowPayment(false);setBookingFlight(null);}}/>}

      <div className="page-wrap">
        <nav className="nav">
          <div className="nav-logo">
            <span style={{fontSize:"22px",marginRight:"8px",filter:"drop-shadow(0 0 8px rgba(129,140,248,0.9))",verticalAlign:"middle"}}>☄️</span>
            CometAI
            <span>Travel Intelligence</span>
          </div>
          <div className="nav-actions">
            <button className="btn-ghost" onClick={()=>navigate("/bookings")}>My Bookings</button>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
          </div>
        </nav>

        <div className="hero">
          <p className="hero-eyebrow">✦ AI-Powered Travel Search</p>
          <h1 className="hero-title">Search Travel<br/>Across The Universe</h1>
          <p className="hero-sub">Flights, buses, trains and hotels — all in one place</p>
        </div>

        {/* TRAVEL TYPE TABS */}
        <div className="travel-tabs">
          {TRAVEL_TABS.map(tab=>(
            <button key={tab.id} className={`travel-tab ${travelType===tab.id?"active":""}`} onClick={()=>{setTravelType(tab.id);setFlights([]);setSearched(false);}}>
              <span className="travel-tab-icon">{tab.icon}</span>
              {tab.label}
              {tab.comingSoon&&<span className="coming-soon-badge">Soon</span>}
            </button>
          ))}
        </div>

        {/* COMING SOON PANELS */}
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
                        {CITIES.filter(c=>c!==to).map(city=><option key={city} value={city}>{city}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="field-group">
                    <label className="field-label">To</label>
                    <div style={{position:"relative"}}>
                      <div className="select-wrap">
                        <select className="field-select" value={to} onChange={e=>setTo(e.target.value)}>
                          <option value="">Select city</option>
                          {CITIES.filter(c=>c!==from).map(city=><option key={city} value={city}>{city}</option>)}
                        </select>
                      </div>
                      {from&&to&&<button onClick={swapCities} style={{position:"absolute",right:"-20px",top:"50%",transform:"translateY(-50%)",zIndex:10,background:"rgba(129,140,248,0.1)",border:"1px solid rgba(129,140,248,0.25)",color:"#a5b4fc",width:"32px",height:"32px",borderRadius:"50%",cursor:"pointer",fontSize:"14px",display:"flex",alignItems:"center",justifyContent:"center"}}>⇄</button>}
                    </div>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Date</label>
                    <input className="field-date" type="date" value={date} min={today} onChange={e=>setDate(e.target.value)}/>
                  </div>
                  <button className="btn-search-big" onClick={searchStructured}>Search ✈</button>
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
                  <div className="filter-group"><label className="filter-label">Airline</label><select className="filter-select" value={filterAirline} onChange={e=>setFilterAirline(e.target.value)}>{AIRLINES.map(a=><option key={a}>{a}</option>)}</select></div>
                  <div className="filter-group"><label className="filter-label">Departure time</label><select className="filter-select" value={filterTime} onChange={e=>setFilterTime(e.target.value)}><option value="any">Any time</option><option value="morning">Morning (5am–12pm)</option><option value="afternoon">Afternoon (12pm–5pm)</option><option value="evening">Evening (5pm+)</option></select></div>
                  <div className="filter-group price-range-wrap"><label className="filter-label">Max price</label><div className="price-range-labels"><span>₹0</span><span style={{color:"#a5b4fc"}}>₹{filterMaxPrice.toLocaleString()}</span></div><input type="range" className="price-slider" min="1000" max={Math.max(maxPriceInResults,20000)} step="500" value={filterMaxPrice} onChange={e=>setFilterMaxPrice(Number(e.target.value))}/></div>
                  <div className="filter-group"><label className="filter-label">Sort by</label><select className="sort-select" value={sortBy} onChange={e=>setSortBy(e.target.value)}><option value="price">Price — low to high</option><option value="price-desc">Price — high to low</option><option value="departure">Departure time</option><option value="duration">Duration</option></select></div>
                  <button className="btn-clear-filters" onClick={clearFilters}>Clear filters</button>
                </div>
              </div>
            )}

            {!loading&&searched&&(
              <>
                <div className="results-header">
                  <p className="results-label">{filtered.length>0?`${filtered.length} of ${flights.length} flights`:"No flights match your filters"}</p>
                </div>
                <div className="flights-grid">
                  {filtered.map(flight=>(
                    <div className="flight-card" key={flight.id}>
                      <div className="card-main">
                        <div>
                          <div className="airline-name">{flight.airline}</div>
                          <div className="airline-code">{flight.flight_no||"—"}</div>
                          <div className="stops-badge">Non-stop</div>
                        </div>
                        <div className="flight-timeline">
                          <div className="time-block">
                            <div className="time-value">{formatTime(flight.departure_time)}</div>
                            <div className="time-city">{getCode(flight.from_city)}</div>
                            <div className="time-date">{formatDate(flight.departure_time)}</div>
                          </div>
                          <div className="timeline-line">
                            <div className="timeline-duration">{calcDuration(flight.departure_time,flight.arrival_time)}</div>
                            <div className="timeline-bar"><div className="timeline-bar-line"/><span style={{fontSize:13}}>✈</span><div className="timeline-bar-line"/></div>
                            <div className="timeline-stops-text">Direct</div>
                          </div>
                          <div className="time-block">
                            <div className="time-value">{formatTime(flight.arrival_time)}</div>
                            <div className="time-city">{getCode(flight.to_city)}</div>
                            <div className="time-date">{formatDate(flight.arrival_time)}</div>
                          </div>
                        </div>
                        <div className="price-action">
                          <div className="price-label-small">from</div>
                          <div className="price-amount">₹{flight.price?.toLocaleString()}</div>
                          <button className="btn-book" onClick={()=>handleBookClick(flight)}>Book Flight →</button>
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
      </Routes>
    </Router>
  );
}

export default App;