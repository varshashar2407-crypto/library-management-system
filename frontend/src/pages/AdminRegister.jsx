import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";
import "./AdminRegister.css";

export default function AdminRegister() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    libraryName: "",
    address: "",
    area: "",
    state: "",
    city: "",
    pincode: "",
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);

  const fieldsDisabled = submitting || accountCreated;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting || accountCreated) return;

    setMessage("");
    setMessageType("");

    const missingFields = Object.entries(form)
      .filter(([, value]) => !value.trim())
      .map(([name]) => name);

    if (missingFields.length > 0) {
      setMessage(
        `Please fill these fields: ${missingFields.join(", ")}.`
      );
      setMessageType("error");
      return;
    }

    if (!/^\d{10}$/.test(form.phone.trim())) {
      setMessage("Please enter a valid 10-digit phone number.");
      setMessageType("error");
      return;
    }

    if (!/^\d{6}$/.test(form.pincode.trim())) {
      setMessage("Please enter a valid 6-digit pincode.");
      setMessageType("error");
      return;
    }

    if (form.password.length < 8) {
      setMessage("Password must contain at least 8 characters.");
      setMessageType("error");
      return;
    }

    setSubmitting(true);

    let registrationCompleted = false;

    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      password: form.password,
      libraryName: form.libraryName.trim(),
      address: form.address.trim(),
      area: form.area.trim(),
      state: form.state.trim(),
      city: form.city.trim(),
      pincode: form.pincode.trim(),
    };

    try {
      const { data: registrationData } = await api.post(
        "/auth/admin-register",
        payload
      );

      registrationCompleted = true;
      setAccountCreated(true);

      setMessage("Account created. Signing you in...");
      setMessageType("success");

      let authData = registrationData;

      if (!authData?.token || !authData?.user) {
        const { data: loginData } = await api.post(
          "/auth/login",
          {
            email: payload.email,
            password: payload.password,
          }
        );

        authData = loginData;
      }

      if (!authData?.token || !authData?.user) {
        throw new Error(
          "The login response is missing token or user."
        );
      }

      if (authData.user.role !== "admin") {
        throw new Error(
          "Admin access was not returned. Please contact support."
        );
      }

      await login(authData.token, authData.user);

      navigate("/admin-dashboard", { replace: true });
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Something went wrong.";

      if (registrationCompleted) {
        setMessage(
          `Admin account create ho gaya hai, lekin automatic login complete nahi hua. Dobara register mat karo. Neeche Admin Login link se sign in karo. Details: ${errorMessage}`
        );
      } else {
        setMessage(errorMessage);
      }

      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="admin-register">
      <section className="admin-register-card">
        <header>
          <p className="admin-register-eyebrow">
            LIBRIFOLIO · ADMIN ONBOARDING
          </p>

          <h1>Create admin account</h1>

          <p className="admin-register-note">
            Register your library and create an admin account.
          </p>
        </header>

        {message && (
          <p
            className={`admin-register-message admin-register-message-${messageType}`}
            role={messageType === "error" ? "alert" : "status"}
          >
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="admin-name">Full name</label>
          <input
            id="admin-name"
            name="name"
            type="text"
            placeholder="Enter your full name"
            value={form.name}
            onChange={handleChange}
            autoComplete="name"
            disabled={fieldsDisabled}
            required
          />

          <label htmlFor="admin-email">Email address</label>
          <input
            id="admin-email"
            name="email"
            type="email"
            placeholder="Enter email"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            disabled={fieldsDisabled}
            required
          />

          <label htmlFor="admin-phone">Phone number</label>
          <input
            id="admin-phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            placeholder="Enter 10-digit phone number"
            value={form.phone}
            onChange={handleChange}
            autoComplete="tel"
            pattern="[0-9]{10}"
            maxLength={10}
            title="Enter a 10-digit phone number"
            disabled={fieldsDisabled}
            required
          />

          <label htmlFor="admin-password">Password</label>
          <div className="admin-register-password">
            <input
              id="admin-password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a new password"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              minLength={8}
              disabled={fieldsDisabled}
              required
            />

            <button
              type="button"
              className="admin-register-eye"
              onClick={() =>
                setShowPassword((prev) => !prev)
              }
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>

          <label htmlFor="admin-library-name">
            Library name
          </label>
          <input
            id="admin-library-name"
            name="libraryName"
            type="text"
            placeholder="Enter library name"
            value={form.libraryName}
            onChange={handleChange}
            disabled={fieldsDisabled}
            required
          />
          <label htmlFor="admin-address">Library address</label>
          <input
          id="admin-address"
          name="address"
          type="text"
          placeholder="Enter library building and street address"
          value={form.address}
          onChange={handleChange}
          autoComplete="street-address"
          disabled={fieldsDisabled}
          required
          />
          
          <label htmlFor="admin-area">Area / Locality</label>
          <input
            id="admin-area"
            name="area"
            type="text"
            placeholder="Enter area or locality"
            value={form.area}
            onChange={handleChange}
            autoComplete="address-line1"
            disabled={fieldsDisabled}
            required
          />

          <label htmlFor="admin-state">State</label>
          <input
            id="admin-state"
            name="state"
            type="text"
            placeholder="Enter state"
            value={form.state}
            onChange={handleChange}
            autoComplete="address-level1"
            disabled={fieldsDisabled}
            required
          />

          <label htmlFor="admin-city">City</label>
          <input
            id="admin-city"
            name="city"
            type="text"
            placeholder="Enter city"
            value={form.city}
            onChange={handleChange}
            autoComplete="address-level2"
            disabled={fieldsDisabled}
            required
          />

          <label htmlFor="admin-pincode">Pincode</label>
          <input
            id="admin-pincode"
            name="pincode"
            type="text"
            inputMode="numeric"
            placeholder="Enter 6-digit pincode"
            value={form.pincode}
            onChange={handleChange}
            autoComplete="postal-code"
            pattern="[0-9]{6}"
            maxLength={6}
            title="Enter a 6-digit pincode"
            disabled={fieldsDisabled}
            required
          />

          <button
            type="submit"
            disabled={fieldsDisabled}
          >
            {submitting
              ? "Creating account & signing in..."
              : accountCreated
                ? "Account created"
                : "Create admin account"}
          </button>
        </form>

        <footer>
          <Link to="/admin-login">
            {accountCreated
              ? "Account created? Continue to Admin Login"
              : "Already have an admin account? Login"}
          </Link>
        </footer>
      </section>
    </main>
  );
}