/**
 * ALVRYN — server_auth_recovery.js
 * Password recovery via email OTP (Resend)
 * Mount in server.js: require("./server_auth_recovery.js")(app, pool, resend);
 */

"use strict";

module.exports = function mountAuthRecovery(app, pool, resend) {

  // In-memory OTP store: { email → { otp, expiresAt, attempts } }
  const otpStore = new Map();

  // Clean expired OTPs every 10 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [email, data] of otpStore) {
      if (data.expiresAt < now) otpStore.delete(email);
    }
  }, 10 * 60 * 1000);

  function generateOTP() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  // ── POST /forgot-password ────────────────────────────────────────────────
  // Step 1: User enters email, we send OTP
  app.post("/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email is required" });

      const emailLower = email.trim().toLowerCase();

      // Check if user exists
      const r = await pool.query(
        "SELECT id, name, email FROM users WHERE LOWER(email)=$1",
        [emailLower]
      );

      // Always return success (don't reveal if email exists — security best practice)
      if (!r.rows.length) {
        return res.json({
          ok: true,
          message: "If this email is registered, you'll receive an OTP shortly.",
        });
      }

      const user = r.rows[0];
      const otp = generateOTP();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      // Store OTP
      otpStore.set(emailLower, { otp, expiresAt, attempts: 0, userId: user.id });

      // Send email via Resend
      try {
        await resend.emails.send({
          from: "Alvryn Travel <onboarding@resend.dev>",
          to: user.email,
          subject: "🔐 Your Alvryn Password Reset OTP",
          html: `
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#faf8f4;border-radius:16px;overflow:hidden;border:1px solid rgba(201,168,76,0.2);">
              <div style="background:linear-gradient(135deg,#c9a84c,#f0d080,#c9a84c);padding:24px;text-align:center;">
                <h1 style="margin:0;font-size:22px;color:#1a1410;font-weight:900;letter-spacing:0.1em;">ALVRYN</h1>
                <p style="margin:4px 0 0;color:rgba(26,20,16,0.7);font-size:10px;letter-spacing:0.3em;">TRAVEL BEYOND BOUNDARIES</p>
              </div>
              <div style="padding:32px 28px;text-align:center;">
                <h2 style="color:#1a1410;margin-bottom:8px;">Password Reset</h2>
                <p style="color:#555;font-size:14px;line-height:1.6;margin-bottom:28px;">
                  Hi ${user.name ? user.name.split(" ")[0] : "there"}! We received a request to reset your Alvryn password.<br/>
                  Use the OTP below — it's valid for <strong>10 minutes</strong>.
                </p>
                <div style="background:rgba(201,168,76,0.1);border-radius:14px;padding:20px 32px;display:inline-block;margin-bottom:24px;border:1.5px solid rgba(201,168,76,0.3);">
                  <p style="margin:0 0 6px;color:#8B6914;font-size:11px;letter-spacing:0.2em;">YOUR OTP</p>
                  <p style="margin:0;font-size:38px;font-weight:900;color:#8B6914;letter-spacing:8px;">${otp}</p>
                </div>
                <p style="color:#888;font-size:12px;line-height:1.6;">
                  If you didn't request this, you can safely ignore this email.<br/>
                  Your password will <strong>not</strong> be changed.
                </p>
              </div>
              <div style="padding:16px 28px;background:rgba(201,168,76,0.05);text-align:center;border-top:1px solid rgba(201,168,76,0.1);">
                <p style="margin:0;color:#aaa;font-size:11px;">© 2025 Alvryn Travel · alvryn.in</p>
              </div>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("OTP email error:", emailErr.message);
        // Still return success so they know to check — email might still arrive
      }

      res.json({
        ok: true,
        message: "OTP sent! Check your email inbox (and spam folder).",
      });

    } catch (e) {
      console.error("Forgot password error:", e.message);
      res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  });

  // ── POST /verify-otp ─────────────────────────────────────────────────────
  // Step 2: User enters OTP — we verify and return a reset token
  app.post("/verify-otp", async (req, res) => {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) return res.status(400).json({ message: "Email and OTP required" });

      const emailLower = email.trim().toLowerCase();
      const stored = otpStore.get(emailLower);

      if (!stored) {
        return res.status(400).json({ message: "OTP expired or not found. Please request a new one." });
      }

      if (Date.now() > stored.expiresAt) {
        otpStore.delete(emailLower);
        return res.status(400).json({ message: "OTP has expired. Please request a new one." });
      }

      // Max 5 attempts
      stored.attempts = (stored.attempts || 0) + 1;
      if (stored.attempts > 5) {
        otpStore.delete(emailLower);
        return res.status(400).json({ message: "Too many incorrect attempts. Please request a new OTP." });
      }

      if (stored.otp !== String(otp).trim()) {
        return res.status(400).json({
          message: `Incorrect OTP. ${5 - stored.attempts} attempt${5 - stored.attempts === 1 ? "" : "s"} remaining.`,
        });
      }

      // OTP verified — generate a short-lived reset token
      const jwt = require("jsonwebtoken");
      const resetToken = jwt.sign(
        { id: stored.userId, email: emailLower, purpose: "password_reset" },
        process.env.JWT_SECRET || "secretkey",
        { expiresIn: "15m" }
      );

      // Remove OTP so it can't be reused
      otpStore.delete(emailLower);

      res.json({ ok: true, resetToken, message: "OTP verified! You can now set a new password." });

    } catch (e) {
      res.status(500).json({ message: "Verification failed. Please try again." });
    }
  });

  // ── POST /reset-password ─────────────────────────────────────────────────
  // Step 3: User sets new password using reset token
  app.post("/reset-password", async (req, res) => {
    try {
      const { resetToken, newPassword } = req.body;
      if (!resetToken || !newPassword) {
        return res.status(400).json({ message: "Reset token and new password are required" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      // Verify reset token
      const jwt = require("jsonwebtoken");
      let decoded;
      try {
        decoded = jwt.verify(resetToken, process.env.JWT_SECRET || "secretkey");
      } catch (e) {
        return res.status(400).json({ message: "Reset link has expired. Please start over." });
      }

      if (decoded.purpose !== "password_reset") {
        return res.status(400).json({ message: "Invalid reset token." });
      }

      // Hash new password and update
      const bcrypt = require("bcrypt");
      const hashed = await bcrypt.hash(newPassword, 10);
      await pool.query("UPDATE users SET password=$1 WHERE id=$2", [hashed, decoded.id]);

      res.json({ ok: true, message: "Password updated successfully! You can now log in." });

    } catch (e) {
      console.error("Reset password error:", e.message);
      res.status(500).json({ message: "Password reset failed. Please try again." });
    }
  });

  console.log("✅ server_auth_recovery.js mounted — forgot password, OTP, reset");
};