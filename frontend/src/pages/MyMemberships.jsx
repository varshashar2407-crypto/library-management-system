import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";
import "./MyMemberships.css";

const plans = [
  {
    id: "monthly",
    name: "Monthly Premium",
    price: "₹199",
    duration: "month",
    validity: "30 days",
    features: [
      "Premium membership status",
      "Golden Premium profile",
      "30-day membership validity",
      "Same Premium tier as the annual plan"
    ]
  },
  {
    id: "annual",
    name: "Annual Premium",
    price: "₹1,999",
    duration: "year",
    validity: "365 days",
    popular: true,
    features: [
      "Premium membership status",
      "Golden Premium profile",
      "365-day membership validity",
      "One annual membership instead of monthly activation"
    ]
  },
  {
    id: "business",
    name: "Business",
    comingSoon: true,
    features: [
      "Business membership option",
      "Details will be announced later",
      "Not available for activation yet"
    ]
  }
];

const premiumPlans = [
  "premium",
  "monthly premium",
  "annual premium"
];

export default function MyMemberships() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [modalError, setModalError] = useState("");
  const [activatedSubscription, setActivatedSubscription] = useState(null);

  const [existingSubscription, setExistingSubscription] = useState(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  const activationLock = useRef(false);

  const availablePlanCount = plans.filter(
    (plan) => !plan.comingSoon
  ).length;

  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "—"
      : date.toLocaleDateString("en-IN");
  };

  useEffect(() => {
    if (!user) {
      setCheckingSubscription(false);
      return;
    }

    let active = true;

    const loadSubscription = async () => {
      try {
        const res = await api.get("/subscriptions/my");

        if (active) {
          setExistingSubscription(res.data.subscription || res.data);
        }
      } catch {
        if (active) {
          setExistingSubscription(null);
        }
      } finally {
        if (active) {
          setCheckingSubscription(false);
        }
      }
    };

    loadSubscription();

    return () => {
      active = false;
    };
  }, [user]);

  const planName =
    existingSubscription?.planName ||
    existingSubscription?.plan?.name ||
    existingSubscription?.plan ||
    "";

  const hasActiveSubscription =
    existingSubscription?.status?.toLowerCase() === "active" &&
    premiumPlans.includes(planName.toLowerCase());

  const openPayment = (plan) => {
    if (
      plan.comingSoon ||
      activationLock.current ||
      hasActiveSubscription
    ) {
      return;
    }

    if (!user) {
      navigate("/login");
      return;
    }

    setSelectedPlan(plan);
    setAcceptedTerms(false);
    setModalError("");
    setMessage("");
    setMessageType("");
    setShowTerms(false);
    setShowPayment(true);
  };

  const closePayment = () => {
    if (activationLock.current) return;

    setShowPayment(false);
    setShowTerms(false);
    setSelectedPlan(null);
    setAcceptedTerms(false);
    setModalError("");
  };

  const handlePayment = async () => {
    if (activationLock.current) return;

    if (!selectedPlan || selectedPlan.comingSoon) {
      setModalError("Please select an available plan.");
      return;
    }

    if (!acceptedTerms) {
      setModalError("Please accept the Terms and Conditions.");
      return;
    }

    activationLock.current = true;
    setProcessing(true);
    setModalError("");
    setMessage("");
    setMessageType("");

    try {
      const { data } = await api.post("/subscriptions/activate", {
        planId: selectedPlan.id,
        acceptedTerms: true
      });

      setActivatedSubscription(data.subscription);
      setMessage(
        data.message ||
          "Demo membership activated. No payment was collected."
      );
      setMessageType("success");

      setShowPayment(false);
      setShowTerms(false);
      setSelectedPlan(null);
      setAcceptedTerms(false);

      setTimeout(() => {
        navigate("/member-dashboard", { replace: true });
      }, 2500);
    } catch (error) {
      setModalError(
        error.response?.data?.message ||
          "Membership could not be activated. Please try again."
      );
    } finally {
      activationLock.current = false;
      setProcessing(false);
    }
  };

  if (!user) {
    return (
      <main className="membership-wallet">
        <section className="membership-hero">
          <div>
            <p className="membership-eyebrow">MEMBERSHIP ACCESS</p>

            <h1>
              Sign in to continue your{" "}
              <em>reading journey.</em>
            </h1>

            <p className="membership-text">
              Use your registered email and password to view and
              activate a membership.
            </p>

            <Link to="/login" className="membership-empty-link">
              Sign In →
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="membership-wallet">
      <section className="membership-hero">
        <div>
          <p className="membership-eyebrow">LIBRIFOLIO PREMIUM</p>

          <h1>
            Choose your
            <br />
            <em>membership plan.</em>
          </h1>

          <p className="membership-text">
            Monthly Premium at ₹199 or Annual Premium at ₹1,999.
            Business membership is coming soon.
          </p>

          <p className="membership-text">
            Project demo: no real payment is collected. Automatic
            renewal is not enabled.
          </p>
        </div>

        <div className="membership-count">
          <span>AVAILABLE PLANS</span>
          <strong>{availablePlanCount}</strong>
          <p>BUSINESS COMING SOON</p>
        </div>
      </section>

      {message && (
        <p
          className={`membership-message membership-message-${messageType}`}
          role={messageType === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      )}

      {activatedSubscription && (
        <div className="membership-empty">
          <span aria-hidden="true">✅</span>

          <h3>Demo Membership Activated</h3>

          <p>{activatedSubscription.planName}</p>

          <p>
            Valid till: {formatDate(activatedSubscription.endDate)}
          </p>

          <p>No payment was collected.</p>

          <button
            type="button"
            className="membership-plan-button"
            onClick={() =>
              navigate("/member-dashboard", { replace: true })
            }
          >
            Go to Dashboard
          </button>
        </div>
      )}

      <section className="membership-section">
        <div className="membership-heading">
          <h2>Subscription Plans</h2>
          <span>CHOOSE YOUR PREMIUM ACCESS</span>
        </div>

        <div className="membership-plans-grid">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className={`membership-plan-card ${
                plan.popular ? "membership-plan-popular" : ""
              } ${
                plan.comingSoon ? "membership-plan-coming-soon" : ""
              }`}
            >
              {plan.popular && (
                <span className="membership-plan-badge">
                  ANNUAL PLAN
                </span>
              )}

              <h3 className="membership-plan-name">{plan.name}</h3>

              <p className="membership-plan-price">
                {plan.comingSoon ? (
                  "Coming Soon"
                ) : (
                  <>
                    {plan.price}
                    <span> / {plan.duration}</span>
                  </>
                )}
              </p>

              <ul className="membership-plan-features">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>

              <button
                type="button"
                className="membership-plan-button"
                onClick={() => openPayment(plan)}
                disabled={
                  Boolean(plan.comingSoon) ||
                  processing ||
                  hasActiveSubscription ||
                  checkingSubscription
                }
              >
                {plan.comingSoon
                  ? "COMING SOON"
                  : hasActiveSubscription
                  ? "ALREADY ACTIVE"
                  : checkingSubscription
                  ? "CHECKING…"
                  : "CHOOSE PLAN"}
              </button>
            </article>
          ))}
        </div>
      </section>

      {showPayment && selectedPlan && (
        <div className="membership-modal">
          <div
            className="membership-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="membership-confirm-title"
          >
            <h2 id="membership-confirm-title">
              Confirm Demo Membership
            </h2>

            <div className="membership-summary">
              <p>Plan: {selectedPlan.name}</p>
              <p>Validity: {selectedPlan.validity}</p>
              <p>Listed price: {selectedPlan.price}</p>
              <p>Demo only. You will not be charged.</p>
            </div>

            {modalError && (
              <p
                className="membership-message membership-message-error"
                role="alert"
              >
                {modalError}
              </p>
            )}

            <div className="membership-terms">
              <input
                id="membership-accept-terms"
                type="checkbox"
                checked={acceptedTerms}
                disabled={processing}
                onChange={(event) =>
                  setAcceptedTerms(event.target.checked)
                }
              />

              <span>
                <label htmlFor="membership-accept-terms">
                  I agree to the{" "}
                </label>

                <button
                  type="button"
                  className="membership-terms-link"
                  onClick={() => setShowTerms(true)}
                  disabled={processing}
                >
                  Terms and Conditions
                </button>
              </span>
            </div>

            <div className="membership-modal-actions">
              <button
                type="button"
                className="membership-cancel-button"
                onClick={closePayment}
                disabled={processing}
              >
                Cancel
              </button>

              <button
                type="button"
                className="membership-pay-button"
                onClick={handlePayment}
                disabled={!acceptedTerms || processing}
              >
                {processing
                  ? "ACTIVATING…"
                  : "ACTIVATE DEMO MEMBERSHIP"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTerms && (
        <div
          className="membership-modal"
          style={{ zIndex: 1100 }}
        >
          <div
            className="membership-modal-card membership-terms-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="membership-terms-title"
          >
            <h2 id="membership-terms-title">
              Terms and Conditions
            </h2>

            <div className="membership-terms-content">
              <p>
                1. This is a student-project demo. Activation does
                not collect a real payment.
              </p>

              <p>
                2. Monthly Premium is valid for 30 days. Annual
                Premium is valid for 365 days. Automatic renewal is
                not enabled.
              </p>

              <p>
                3. Membership belongs to the registered account and
                is non-transferable.
              </p>

              <p>
                4. Existing book issue, return and fine rules
                continue to apply. This activation does not clear
                outstanding fines.
              </p>

              <p>
                5. Business membership is not available for
                activation.
              </p>

              <p>6. Keep your account credentials private.</p>

              <p>
                7. The current demo does not allow another activation
                while an active membership exists.
              </p>
            </div>

            <button
              type="button"
              className="membership-close-terms"
              onClick={() => setShowTerms(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}