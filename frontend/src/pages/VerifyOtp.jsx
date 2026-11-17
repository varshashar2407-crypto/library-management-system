import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import api from "../api/axios.js";
import "./ResetPassword.css";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const [email, setEmail] = useState(state?.email || "");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) return;

    const normalizedEmail = email.trim().toLowerCase();
    const otp = code.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setMessage("Please enter a valid email address.");
      setMessageType("error");
      return;
    }

    if (!/^[0-9]{6}$/.test(otp)) {
      setMessage("Please enter the 6-digit OTP.");
      setMessageType("error");
      return;
    }

    setSubmitting(true);
    setMessage("");
    setMessageType("");

    try {
      const { data } = await api.post("/auth/verify-otp", {
        email: normalizedEmail,
        code: otp
      });

      setMessage(data.message || "Account verified successfully.");
      setMessageType("success");

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "OTP verification failed. Please try again."
      );
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="reset-page">
      <section className="reset-card">
        <header className="reset-head">
          <p className="reset-eyebrow">ACCOUNT VERIFICATION</p>

          <h1>
            Verify your
            <br />
            <em>reading identity.</em>
          </h1>

          <p className="reset-note">
            Enter the 6-digit OTP sent to your registered email.
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
          <label htmlFor="verify-email">Registered email</label>

          <div className="reset-field">
            <span aria-hidden="true">@</span>

            <input
              id="verify-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <label htmlFor="verify-otp">Verification OTP</label>

          <div className="reset-field">
            <span aria-hidden="true">✦</span>

            <input
              id="verify-otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              value={code}
              onChange={(event) =>
                setCode(
                  event.target.value.replace(/\D/g, "").slice(0, 6)
                )
              }
              required
            />
          </div>

          <button type="submit" disabled={submitting}>
            {submitting ? "Verifying…" : "Verify account"}
          </button>
        </form>

        <footer className="reset-footer">
          <p>
            Already verified? <Link to="/login">Sign in</Link>
          </p>
        </footer>
      </section>
    </main>
  );
}