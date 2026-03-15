import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;800&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #01020a;
    color: #e8eaf6;
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
  }

  .stars-bg {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background:
      radial-gradient(ellipse at 80% 30%, rgba(63,43,150,0.18) 0%, transparent 60%),
      radial-gradient(ellipse at 20% 70%, rgba(25,90,180,0.14) 0%, transparent 55%),
      #01020a;
  }

  .star {
    position: absolute;
    border-radius: 50%;
    background: white;
    animation: twinkle var(--d, 3s) ease-in-out infinite var(--delay, 0s);
  }

  @keyframes twinkle {
    0%, 100% { opacity: var(--min-op, 0.15); }
    50%       { opacity: 1; }
  }

  .register-wrap {
    position: relative;
    z-index: 1;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 24px;
    animation: fadeUp 0.7s ease both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .logo-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 36px;
  }

  .logo-icon-wrap {
    position: relative;
    width: 72px;
    height: 72px;
    margin-bottom: 16px;
  }

  .logo-orbit {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 1px solid rgba(129,140,248,0.25);
    animation: spin 8s linear infinite;
  }

  .logo-orbit-2 {
    position: absolute;
    inset: 8px;
    border-radius: 50%;
    border: 1px solid rgba(192,132,252,0.2);
    animation: spin 5s linear infinite reverse;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .logo-orbit::before {
    content: '';
    position: absolute;
    width: 7px;
    height: 7px;
    background: #818cf8;
    border-radius: 50%;
    top: -3.5px;
    left: 50%;
    transform: translateX(-50%);
    box-shadow: 0 0 8px #818cf8;
  }

  .logo-orbit-2::before {
    content: '';
    position: absolute;
    width: 5px;
    height: 5px;
    background: #c084fc;
    border-radius: 50%;
    bottom: -2.5px;
    left: 50%;
    transform: translateX(-50%);
    box-shadow: 0 0 6px #c084fc;
  }

  .logo-comet {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    filter: drop-shadow(0 0 12px rgba(129,140,248,0.6));
  }

  .logo-name {
    font-family: 'Orbitron', sans-serif;
    font-size: 26px;
    font-weight: 800;
    letter-spacing: 2px;
    background: linear-gradient(90deg, #818cf8, #c084fc, #38bdf8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .logo-tagline {
    font-size: 10px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: rgba(165,180,252,0.4);
    margin-top: 5px;
    font-weight: 300;
  }

  .register-card {
    width: 100%;
    max-width: 420px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(129,140,248,0.15);
    border-radius: 20px;
    padding: 36px 36px 32px;
    backdrop-filter: blur(12px);
    box-shadow: 0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05);
  }

  .card-title {
    font-family: 'Orbitron', sans-serif;
    font-size: 18px;
    font-weight: 600;
    color: #e0e7ff;
    margin-bottom: 6px;
    letter-spacing: 1px;
  }

  .card-sub {
    font-size: 13px;
    color: rgba(165,180,252,0.4);
    margin-bottom: 28px;
    font-weight: 300;
  }

  .input-group { margin-bottom: 16px; }

  .input-label {
    display: block;
    font-size: 11px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: rgba(165,180,252,0.5);
    margin-bottom: 8px;
    font-weight: 500;
  }

  .input-field {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(129,140,248,0.2);
    border-radius: 10px;
    padding: 12px 16px;
    color: #e0e7ff;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    outline: none;
    transition: all 0.2s;
  }

  .input-field::placeholder { color: rgba(165,180,252,0.25); }

  .input-field:focus {
    border-color: rgba(129,140,248,0.55);
    background: rgba(129,140,248,0.06);
    box-shadow: 0 0 0 3px rgba(129,140,248,0.08);
  }

  .error-msg {
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.25);
    color: #fca5a5;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 13px;
    margin-bottom: 16px;
  }

  .btn-register {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border: none;
    border-radius: 12px;
    color: white;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    letter-spacing: 0.5px;
    margin-top: 8px;
    transition: all 0.2s;
  }

  .btn-register:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(99,102,241,0.45);
  }

  .divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 24px 0 20px;
  }

  .divider-line {
    flex: 1;
    height: 1px;
    background: rgba(255,255,255,0.06);
  }

  .divider-text {
    font-size: 11px;
    color: rgba(165,180,252,0.25);
    letter-spacing: 1px;
  }

  .login-link {
    text-align: center;
    font-size: 13px;
    color: rgba(165,180,252,0.4);
  }

  .login-link span {
    color: #a5b4fc;
    cursor: pointer;
    font-weight: 500;
    transition: color 0.2s;
  }

  .login-link span:hover { color: #c7d2fe; }
`;

function Stars() {
  const stars = Array.from({ length: 90 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2.5 + 0.5,
    duration: Math.random() * 4 + 2,
    delay: Math.random() * 5,
  }));
  return (
    <div className="stars-bg">
      {stars.map(s => (
        <div key={s.id} className="star" style={{
          left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size,
          '--d': `${s.duration}s`,
          '--delay': `${s.delay}s`,
          '--min-op': 0.08,
        }} />
      ))}
    </div>
  );
}

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    try {
      await axios.post("http://localhost:5000/register", { name, email, password });
      alert("🚀 Account created! Welcome to CometAI.");
      navigate("/login");
    } catch (err) {
      setError("Registration failed. Try a different email.");
    }
  };

  return (
    <>
      <style>{styles}</style>
      <Stars />
      <div className="register-wrap">

        <div className="logo-wrap">
          <div className="logo-icon-wrap">
            <div className="logo-orbit" />
            <div className="logo-orbit-2" />
            <div className="logo-comet">☄️</div>
          </div>
          <div className="logo-name">COMETAI</div>
          <div className="logo-tagline">Travel Intelligence</div>
        </div>

        <div className="register-card">
          <div className="card-title">Create account</div>
          <div className="card-sub">Join CometAI and start exploring</div>

          {error && <div className="error-msg">⚠ {error}</div>}

          <div className="input-group">
            <label className="input-label">Full Name</label>
            <input
              className="input-field"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Email</label>
            <input
              className="input-field"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <input
              className="input-field"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => { if (e.key === "Enter") handleRegister(); }}
            />
          </div>

          <button className="btn-register" onClick={handleRegister}>
            Begin Journey →
          </button>

          <div className="divider">
            <div className="divider-line" />
            <div className="divider-text">or</div>
            <div className="divider-line" />
          </div>

          <div className="login-link">
            Already have an account?{" "}
            <span onClick={() => navigate("/login")}>Sign in</span>
          </div>
        </div>

      </div>
    </>
  );
}

export default Register;