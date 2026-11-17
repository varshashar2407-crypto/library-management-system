import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios.js";
import "./ForgotPassword.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitting(true);
    setMessage("");
    setMessageType("");

    try {
      const { data } = await api.post("/auth/forgot-password", {
        email
      });

      setMessage(data.message || "Reset OTP sent successfully.");
      setMessageType("success");

      setTimeout(() => {
        navigate("/reset-password", {
          state: { email }
        });
      }, 2000);
    
      navigate("/reset-password", {
        state: { email }
      });
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Failed to send OTP. Please try again."
      );
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="forgot-page">
      <section className="forgot-card">
        <div className="forgot-visual">
          <div className="forgot-ring" />
          <span className="forgot-star" aria-hidden="true">
            ✦
          </span>

          <div className="forgot-badge">
            <span>SECURE ACCESS</span>
            <strong>
              Regain your
              <br />
              reading room.
            </strong>
            <small>ACCOUNT RECOVERY</small>
          </div>

          <p className="forgot-visual-note">
            Your stories are waiting on the other side.
          </p>
        </div>

        <div className="forgot-form-side">
          <Link to="/login" className="forgot-back">
            ← BACK TO LOGIN
          </Link>

          <p className="forgot-eyebrow">ACCOUNT RECOVERY</p>

          <h1>
            Forgot your
            <br />
            <em>password?</em>
          </h1>

          <p className="forgot-description">
            Enter your registered email address. We will send a
            reset OTP to verify your identity.
          </p>

          {message && (
            <p
              className={`forgot-message forgot-message-${messageType}`}
              role={messageType === "error" ? "alert" : "status"}
            >
              {message}
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <label htmlFor="forgot-email">
              Registered email address
            </label>

            <div className="forgot-input">
              <span aria-hidden="true">@</span>

              <input
                id="forgot-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={submitting}>
              {submitting ? "Sending OTP…" : "Send reset OTP"}
            </button>
          </form>

          <div className="forgot-footer">
            <p>
              Remembered your password?{" "}
              <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}