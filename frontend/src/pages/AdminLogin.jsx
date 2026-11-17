import "./AdminLogin.css";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setMessage("");
    setMessageType("");

    try {
      const { data } = await api.post("/auth/login", form);

      if (data.user?.role !== "admin") {
        setMessage("This account is not an admin account.");
        setMessageType("error");
        return;
      }

      login(data.token, data.user);
      navigate("/admin-dashboard");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Admin login failed."
      );
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="admin-login">
      <section className="admin-login-card">
        <header>
          <p className="admin-login-eyebrow">LIBRIX · ADMIN ACCESS</p>
          <h1>Admin login</h1>
          <p className="admin-login-note">
            Sign in to manage your library.
          </p>
        </header>

        {message && (
          <p className={`admin-login-message admin-login-message-${messageType}`}>
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <label>Email address</label>
          <input
            name="email"
            type="email"
            placeholder="Enter email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <label>Password</label>
          <div className="admin-login-password">
            <input
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
              className="admin-login-eye"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button type="submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <footer>
          <Link to="/admin-register">Create admin account</Link>
        </footer>
      </section>
    </main>
  );
}