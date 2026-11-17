import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import api from "../api/axios.js";
import "./ResetPassword.css";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const [form, setForm] = useState({
    email: state?.email || "",
    code: "",
    newPassword: ""
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOtpChange = (event) => {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 6);

    setForm((prev) => ({
      ...prev,
      code: digits
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) return;

    const email = form.email.trim().toLowerCase();
    const code = form.code.trim();
    const newPassword = form.newPassword;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage("Please enter a valid email address.");
      setMessageType("error");
      return;
    }

    if (!/^[0-9]{6}$/.test(code)) {
      setMessage("Please enter the 6-digit OTP.");
      setMessageType("error");
      return;
    }

    if (newPassword.length < 8) {
      setMessage("New password must be at least 8 characters long.");
      setMessageType("error");
      return;
    }

    setSubmitting(true);
    setMessage("");
    setMessageType("");

    try {
      const { data } = await api.post("/auth/reset-password", {
        email,
        code,
        newPassword
      });

      setMessage(data.message || "Password reset successfully.");
      setMessageType("success");

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Password reset failed."
      );
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="reset-page">
      <div className="reset-glow" aria-hidden="true" />

      <section className="reset-card">
        <div className="reset-keyhole" aria-hidden="true">
          <span />
        </div>

        <header className="reset-head">
          <p className="reset-eyebrow">SECURE ACCOUNT RECOVERY</p>

          <h1>
            Create a
            <br />
            <em>new key.</em>
          </h1>

          <p className="reset-note">
            Enter the OTP sent to your email and choose a new
            password for your reading room.
          </p>
        </header>

        {message && (
          <p
            className={`reset-message reset-message-${messageType}`}
            role={messageType === "error" ? "alert" : "status"}
          >
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="reset-email">Registered email</label>

          <div className="reset-field">
            <span aria-hidden="true">@</span>

            <input
              id="reset-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          <label htmlFor="reset-otp">Reset OTP</label>

          <div className="reset-field">
            <span aria-hidden="true">✦</span>

            <input
              id="reset-otp"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              value={form.code}
              onChange={handleOtpChange}
              required
            />
          </div>

          <label htmlFor="reset-password">New password</label>

          <div className="reset-field">
            <span aria-hidden="true">✧</span>

            <input
              id="reset-password"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              placeholder="Create a new password"
              value={form.newPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" disabled={submitting}>
            {submitting ? "Resetting…" : "Reset password"}
          </button>
        </form>

        <footer className="reset-footer">
          <p>
            Remembered your password? <Link to="/login">Sign in</Link>
          </p>
        </footer>
      </section>

      <p className="reset-quote">
        “Every ending makes space for a new beginning.”
      </p>
    </main>
  );
}