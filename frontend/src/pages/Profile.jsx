import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, User, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";
import "./Profile.css";

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
   const [menuOpen, setMenuOpen] = useState(false);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileMessageType, setProfileMessageType] = useState("");

  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    area: "",
    city: "",
    pincode: ""
  });

  // ---------------------------------
  // PREMIUM SUBSCRIPTION DETECTION
  // ---------------------------------

  const planName = String(
    subscription?.planName ??
    subscription?.plan?.name ??
    (typeof subscription?.plan === "string"
      ? subscription.plan
    : "")
  ).toLowerCase().trim();

  const subscriptionStatus = String(
    subscription?.status || ""
  ).toLowerCase().trim();

  const expiryDate = subscription?.endDate
    ? new Date(subscription.endDate)
    : null;

  const isSubscriptionValid =
  expiryDate &&
  !Number.isNaN(expiryDate.getTime()) &&
  expiryDate >= new Date();

  const isActive =
    subscriptionStatus === "active" &&
    isSubscriptionValid;

  const isPremium =
    isActive &&
    [
      "premium",
      "monthly premium",
      "annual premium"
    ].includes(planName);

  const isStudentPremium =
    isActive &&
    planName === "student premium";

  const hasPremium = isPremium || isStudentPremium;

  const formattedExpiryDate =
    expiryDate &&
    !Number.isNaN(expiryDate.getTime())
      ? expiryDate.toLocaleDateString("en-IN")
      : "Not specified";

  // ---------------------------------
  // FETCH SUBSCRIPTION
  // ---------------------------------

  useEffect(() => {
    let ignore = false;

    const fetchSubscription = async () => {
      if (!user) {
        setSubscription(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const { data } = await api.get("/subscriptions/current");

        if (!ignore) {
          setSubscription(data?.data || null);
        }
      } catch (error) {
        if (!ignore) {
          setSubscription(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchSubscription();

    return () => {
      ignore = true;
    };
  }, [user]);

  // ---------------------------------
  // EDIT PROFILE
  // ---------------------------------

  const startEditing = () => {
    setEditForm({
      name: user?.name || "",
      phone: user?.phone || "",
      area: user?.area || "",
      city: user?.city || "",
      pincode: user?.pincode || ""
    });

    setProfileMessage("");
    setProfileMessageType("");
    setEditing(true);
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setEditForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const cancelEditing = () => {
    setEditing(false);
    setProfileMessage("");
    setProfileMessageType("");
  };

  const saveProfile = async (event) => {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setProfileMessage("");
    setProfileMessageType("");

    try {
      const { data } = await api.put(
        "/auth/profile",
        editForm
      );

      if (data.user) {
        updateUser(data.user);
      }

      setEditing(false);

      setProfileMessage(
        data.message || "Profile updated successfully."
      );

      setProfileMessageType("success");
    } catch (error) {
      setProfileMessage(
        error.response?.data?.message ||
        "Could not save profile. Please try again."
      );

      setProfileMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------
  // NOT LOGGED IN
  // ---------------------------------

  if (!user) {
    return (
      <main className="profile-constellation">
        <div className="profile-orbit profile-orbit-one" />
        <div className="profile-orbit profile-orbit-two" />
        <div className="profile-orbit profile-orbit-three" />

        <section className="profile-panel">
          <h1>Please log in to view your profile.</h1>

          <div className="profile-actions">
            <Link
              to="/login"
              className="profile-action-primary"
            >
              Sign in
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // ---------------------------------
  // MAIN PROFILE
  // ---------------------------------

  return (
    <main
      className={
        hasPremium
          ? "profile-constellation premium-profile"
          : "profile-constellation"
      }
    >
      <div className="profile-orbit profile-orbit-one" />
      <div className="profile-orbit profile-orbit-two" />
      <div className="profile-orbit profile-orbit-three" />

      <span className="profile-star profile-star-one">✦</span>
      <span className="profile-star profile-star-two">✦</span>
      <span className="profile-star profile-star-three">✦</span>

      <section className="profile-panel">

        {/* PROFILE HEADER */}

        <header className="profile-head">

          <div className="profile-identity">

            <div className="profile-menu">
  <button
    type="button"
    className="profile-menu-trigger"
    onClick={() => setMenuOpen((open) => !open)}
  >
    <div className="profile-avatar">
      <span>
        {user.name?.charAt(0)?.toUpperCase() || "U"}
      </span>
    </div>

    <span className="profile-menu-name">
      {user.name || "Member"}
    </span>
  </button>

  {menuOpen && (
    <div className="profile-menu-dropdown">
      <button
        type="button"
        onClick={() => {
          setMenuOpen(false);
          navigate("/dashboard");
        }}
      >
        <LayoutDashboard size={18} />
        Dashboard
      </button>

      <button
        type="button"
        onClick={() => {
          setMenuOpen(false);
          navigate("/profile");
        }}
      >
        <User size={18} />
        Profile
      </button>

      <button
        type="button"
        className="profile-menu-logout"
        onClick={() => {
          setMenuOpen(false);
          logout();
          navigate("/");
        }}
      >
        <LogOut size={18} />
        Logout
      </button>
    </div>
  )}
</div>

            <div>
              <p className="profile-eyebrow">
                LIBRIFOLIO MEMBER
              </p>

              <h1>
                {user.name || "Member"}

                {isPremium && (
                  <span className="premium-badge">
                    ⭐ PREMIUM
                  </span>
                )}

                {isStudentPremium && (
                  <span className="student-premium-badge">
                    ⭐ STUDENT PREMIUM
                  </span>
                )}
              </h1>

              <p className="profile-location">
                {user.email}
                <br />

                {user.phone || "Phone not added"}
                <br />

                {user.area || "Area not added"},{" "}
                {user.city || "City not added"}
              </p>
            </div>

          </div>

          <button
            type="button"
            className="profile-edit-button"
            onClick={startEditing}
            disabled={editing || saving}
          >
            {editing ? "Editing Profile…" : "✎ Edit Profile"}
          </button>

          <div className="profile-fingerprint">

            <span>MEMBER ID</span>

            <div className="profile-fingerprint-lines">
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>

            <strong>
              {user._id?.slice(-8)?.toUpperCase() || "LIBRI"}
            </strong>

          </div>

        </header>

        {/* PROFILE MESSAGE */}

        {profileMessage && (
          <p
            className={`profile-edit-message profile-edit-message-${profileMessageType}`}
            role={
              profileMessageType === "error"
                ? "alert"
                : "status"
            }
          >
            {profileMessage}
          </p>
        )}

        {/* EDIT PROFILE FORM */}

        {editing && (
          <form
            className="profile-edit-form"
            onSubmit={saveProfile}
          >
            <h2>Edit Your Details</h2>

            <div className="profile-edit-grid">

              <label>
                <span>Full Name</span>

                <input
                  name="name"
                  value={editForm.name}
                  onChange={handleProfileChange}
                  autoComplete="name"
                  disabled={saving}
                  required
                />
              </label>

              <label>
                <span>Email — cannot be changed here</span>

                <input
                  type="email"
                  value={user.email || ""}
                  readOnly
                />
              </label>

              <label>
                <span>Phone Number</span>

                <input
                  name="phone"
                  type="tel"
                  value={editForm.phone}
                  onChange={handleProfileChange}
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  autoComplete="tel"
                  title="Enter a 10-digit phone number"
                  disabled={saving}
                  required
                />
              </label>

              <label>
                <span>Area</span>

                <input
                  name="area"
                  value={editForm.area}
                  onChange={handleProfileChange}
                  disabled={saving}
                  required
                />
              </label>

              <label>
                <span>City</span>

                <input
                  name="city"
                  value={editForm.city}
                  onChange={handleProfileChange}
                  autoComplete="address-level2"
                  disabled={saving}
                  required
                />
              </label>

              <label>
                <span>Pincode</span>

                <input
                  name="pincode"
                  value={editForm.pincode}
                  onChange={handleProfileChange}
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  autoComplete="postal-code"
                  title="Enter a 6-digit pincode"
                  disabled={saving}
                  required
                />
              </label>

            </div>

            <div className="profile-edit-actions">

              <button
                type="button"
                className="profile-action-secondary"
                onClick={cancelEditing}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="profile-action-primary"
                disabled={saving}
              >
                {saving ? "Saving…" : "Confirm Changes"}
              </button>

            </div>
          </form>
        )}

        {/* MEMBERSHIP STATUS */}

        {loading ? (
          <p className="profile-location">
            Checking membership…
          </p>
        ) : isPremium ? (

          <div className="premium-membership-card">

            <h3>👑 Premium Membership Active</h3>

            <p>
              Valid till:{" "}
              <strong>{formattedExpiryDate}</strong>
            </p>

            <p>
              You have access to premium library benefits.
            </p>

          </div>

        ) : isStudentPremium ? (

          <div className="premium-membership-card">

            <h3>⭐ Student Premium Active</h3>

            <p>
              Valid till:{" "}
              <strong>{formattedExpiryDate}</strong>
            </p>

            <p>
              Your student premium library benefits are active.
            </p>

          </div>

        ) : (

          <div className="basic-membership-card">

            <h3>Basic Membership</h3>

            <p>
              Upgrade to Premium for exclusive reading benefits.
            </p>

            <Link
              to="/membership"
              className="profile-card-link"
            >
              Explore Premium Plans →
            </Link>

          </div>

        )}

        {/* DASHBOARD CARDS */}

        <div className="profile-badges">

          {/* READING ROOM */}

          <Link
            to="/books"
            className="profile-badge profile-reading-link"
            aria-label="View all library books"
          >
            <span aria-hidden="true">📚</span>

            <strong>Reading Room</strong>

            <p>
              Browse all books, check availability, and choose
              your next read.
            </p>

            <span className="profile-card-link">
              View All Books →
            </span>

          </Link>

          {/* MEMBERSHIP */}

          <div className="profile-badge">

            <span aria-hidden="true">✦</span>

            <strong>Membership</strong>

            <p>
              {isPremium
                ? "Premium benefits are active on your account."
                : isStudentPremium
                ? "Student Premium benefits are active on your account."
                : "Explore plans and manage your library membership."}
            </p>

            <Link
              to="/membership"
              className="profile-card-link"
            >
              Manage Membership →
            </Link>

          </div>

          {/* SECURE ACCOUNT */}

          <div className="profile-badge profile-security-card">

            <span aria-hidden="true">🔐</span>

            <strong>Secure Account</strong>

            <p>
              Manage your password and sign out of your account.
            </p>

            <div className="profile-security-email">

              <small>ACCOUNT EMAIL</small>

              <span>{user.email}</span>

            </div>

            <div className="profile-security-actions">

              <Link
                to="/forgot-password"
                className="profile-security-link"
              >
                Reset Password →
              </Link>

              <button
                type="button"
                className="profile-security-logout"
                onClick={logout}
              >
                Sign Out
              </button>

            </div>

          </div>

        </div>

        {/* BOTTOM ACTIONS */}

        <div className="profile-actions">

          <Link
            to="/"
            className="profile-action-primary"
          >
            Back to Home
          </Link>

          <Link
            to="/membership"
            className="profile-action-secondary"
          >
            Manage Membership
          </Link>

          <button
            type="button"
            className="profile-action-secondary"
            onClick={logout}
          >
            Logout
          </button>

        </div>

      </section>
    </main>
  );
}
