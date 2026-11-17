import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import "./Login.css";

const normalizeEmail = (value) => value.trim().toLowerCase();

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "email" ? normalizeEmail(value) : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const email = normalizeEmail(form.email);

    if (!email || !form.password) {
      setMessage("Please enter your email and password.");
      setMessageType("error");
      return;
    }

    setSubmitting(true);
    setMessage("");
    setMessageType("");

    try {
      const { data } = await api.post(
        "/auth/login",
        {
          email,
          password: form.password
        },
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      if (!data?.user || !data?.token) {
        setMessage("Login failed. Please try again.");
        setMessageType("error");
        return;
      }

      if (data.user.isVerified === false) {
        setMessage(
          "Your account is not verified. Please complete OTP verification first."
        );
        setMessageType("error");
        return;
      }

      login(data.token, data.user);

      navigate(
        data.user.role === "admin"
          ? "/admin-dashboard"
          : "/member-dashboard"
      );
    } catch (error) {
      const status = error.response?.status;
      const serverMessage = error.response?.data?.message;

      if (status === 401) {
        setMessage("Invalid email or password.");
      } else if (status === 403) {
        setMessage(
          serverMessage ||
            "Your account is not verified. Please complete OTP verification."
        );
      } else if (status === 404) {
        setMessage("No account found with this email. Please register first.");
      } else if (!error.response) {
        setMessage("Server is not reachable. Please try again.");
      } else {
        setMessage(
          serverMessage || "Login failed. Please check your details."
        );
      }

      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login-portal">
      <div className="login-portal-glow" aria-hidden="true" />

      <section className="login-portal-card">
        <header className="login-portal-head">
          <span className="login-portal-mark" aria-hidden="true">
            ✦
          </span>

          <p className="login-portal-eyebrow">
            LIBRIX · MEMBER ACCESS
          </p>

          <h1>
            Open the door to
            <br />
            <em>your next chapter.</em>
          </h1>

          <p className="login-portal-note">
            Sign in to access your reading room and dashboard.
          </p>
        </header>

        {message && (
          <p
            className={`login-portal-message login-portal-message-${messageType}`}
            role={messageType === "error" ? "alert" : "status"}
          >
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="portal-email">Email address</label>

          <div className="login-portal-field">
            <span aria-hidden="true">@</span>

            <input
              id="portal-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              onBlur={(event) => {
                const email = normalizeEmail(event.target.value);

                setForm((prev) => ({
                  ...prev,
                  email
                }));
              }}
              autoComplete="email"
              required
            />
          </div>

          <label htmlFor="portal-password">Password</label>

          <div className="login-portal-field">
            <span aria-hidden="true">✦</span>

            <input
              id="portal-password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />

            <button
              type="button"
              className="login-portal-eye"
              onClick={() => setShowPassword((previous) => !previous)}
              aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button type="submit" disabled={submitting}>
            {submitting ? "Unlocking…" : "Unlock reading room"}
          </button>
        </form>

        <footer className="login-portal-footer">
          <Link to="/forgot-password">Forgot password?</Link>
          <span>·</span>
          <Link to="/register">Create an account</Link>
        </footer>
      </section>

      <p className="login-portal-quote">
        “A library is not a building. It is a doorway.”
      </p>
    </main>
  );
}