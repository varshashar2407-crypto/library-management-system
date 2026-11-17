import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import "./Register.css";


const normalizeEmail = (value) => value.trim().toLowerCase();


export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();


  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    area: "",
    city: "",
    pincode: ""
  });


  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [submitting, setSubmitting] = useState(false);


  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  const handleChange = (event) => {
    const { name, value } = event.target;


    setForm((prev) => ({
      ...prev,
      [name]: name === "email" ? normalizeEmail(value) : value
    }));
  };


  const handleRegister = async (event) => {
    event.preventDefault();


    if (submitting) {
      return;
    }


    const email = normalizeEmail(form.email);
    const phone = form.phone.trim();

   const pincode = form.pincode.trim();

    if (!/^[0-9]{6}$/.test(pincode)) {
      setMessage("Please enter a valid 6-digit pincode.");
      setMessageType("error");
      return;
    }


    if (!/^[0-9]{10}$/.test(phone)) {
      setMessage("Please enter a valid 10-digit phone number.");
      setMessageType("error");
      return;
    }


    if (form.password.length < 8) {
      setMessage("Password must be at least 8 characters long.");
      setMessageType("error");
      return;
    }


    if (form.password !== form.confirmPassword) {
      setMessage("New password and confirm password do not match.");
      setMessageType("error");
      return;
    }


    setSubmitting(true);
    setMessage("");
    setMessageType("");


    try {
      const { data } = await api.post(
        "/auth/register",
        {
          name: form.name.trim(),
          email,
          phone,
          password: form.password,
          area: form.area.trim(),
          city: form.city.trim(),
          pincode: form.pincode.trim()
        },
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

    login(data.token, data.user);

    navigate("/nearby-libraries", { replace: true });
    } catch (error) {
      const status = error.response?.status;
      const serverMessage = error.response?.data?.message;


      if (status === 409 || /already registered/i.test(serverMessage || "")) {
        setMessage(
          "This email is already registered. Please try logging in or use another email."
        );
      } else if (status === 400) {
        setMessage(serverMessage || "Please check the entered details.");
      } else if (!error.response) {
        setMessage("Server is not reachable. Please try again.");
      } else {
        setMessage(serverMessage || "Registration failed. Please try again.");
      }


      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <main className="register-page">
      <div className="register-glow" aria-hidden="true" />


      <section className="register-card">
        <header className="register-head">
          <span className="register-mark" aria-hidden="true">
            ✦
          </span>


          <p className="register-eyebrow">STEP 01 · IDENTITY</p>


          <h1>
            Create your
            <br />
            <em>reading identity.</em>
          </h1>


          <p className="register-note">
            Register to discover nearby libraries and access books.
          </p>
        </header>


        {message && (
          <p
            className={`register-message register-message-${messageType}`}
            role={messageType === "error" ? "alert" : "status"}
          >
            {message}
          </p>
        )}

        <p className="register-admin-link">
  <button
    type="button"
    className="admin-register-link"
    onClick={() => navigate("/admin-register")}
  >
    Register as Admin
  </button>
</p>


        <form onSubmit={handleRegister} noValidate>
          <div className="register-grid">
            <label className="register-field">
              <span>Full name *</span>
              <input
                name="name"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
                required
              />
            </label>


            <label className="register-field">
              <span>Email address *</span>
              <input
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
            </label>


            <label className="register-field">
              <span>Phone number *</span>
              <input
                name="phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="Enter 10-digit phone number"
                value={form.phone}
                onChange={handleChange}
                autoComplete="tel"
                required
              />
            </label>


            <label className="register-field">
              <span>Create a new password *</span>


              <div className="register-password-input">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a new password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />


                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="register-eye"
                  aria-label={showPassword ? "Hide new password" : "Show new password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>


              <small className="register-hint">
                Use at least 8 characters. This will be your app login password.
              </small>
            </label>


            <label className="register-field">
              <span>Confirm new password *</span>


              <div className="register-password-input">
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your new password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />


                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="register-eye"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>


            <label className="register-field">
              <span>Area *</span>
              <input
                name="area"
                placeholder="Your area"
                value={form.area}
                onChange={handleChange}
                required
              />
            </label>


            <label className="register-field">
              <span>City *</span>
              <input
                name="city"
                placeholder="Your city"
                value={form.city}
                onChange={handleChange}
                required
              />
            </label>


            <label className="register-field">
              <span>Pincode *</span>
              <input
                name="pincode"
                placeholder="Your pincode"
                value={form.pincode}
                onChange={handleChange}
                required
              />
            </label>
          </div>


          <button
            type="submit"
            className="register-submit"
            disabled={submitting}
          >
            {submitting ? "Creating account…" : "Register"}
          </button>
        </form>


        <footer className="register-footer">
          <p>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </footer>
      </section>
    </main>
  );
}