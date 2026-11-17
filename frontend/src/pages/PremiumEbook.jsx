import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import "./PremiumEbook.css";
const premiumPlans = [
  "premium",
  "monthly premium",
  "annual premium"
];

export default function PremiumEbook() {
  const navigate = useNavigate();

  const [ebooks, setEbooks] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    let active = true;

    const checkAccess = async () => {
      try {
        const res = await api.get("/subscriptions/my");

        if (active) {
          setSubscription(res.data.subscription || res.data);
        }
      } catch {
        if (active) {
          setSubscription(null);
        }
      } finally {
        if (active) {
          setCheckingAccess(false);
        }
      }
    };

    checkAccess();

    return () => {
      active = false;
    };
  }, []);

  const planName =
    subscription?.planName ||
    subscription?.plan?.name ||
    subscription?.plan ||
    "";

  const isPremium =
    subscription?.status?.toLowerCase() === "active" &&
    premiumPlans.includes(planName.toLowerCase());

  useEffect(() => {
    if (checkingAccess || !isPremium) return;

    let active = true;

    const loadEbooks = async () => {
      try {
        const { data } = await api.get("/books/premium-ebooks");

        if (active) {
          setEbooks(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (active) {
          setMessage(
            error.response?.data?.message ||
              "Premium eBooks could not be loaded."
          );
          setMessageType("error");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadEbooks();

    return () => {
      active = false;
    };
  }, [checkingAccess, isPremium]);

  if (checkingAccess) {
    return (
      <main className="ebooks-stage">
        <div className="premium-ebooks-container">
          <div className="ebooks-empty" role="status">
            <span aria-hidden="true">★</span>
            <h3>Checking premium access…</h3>
            <p>Verifying your membership.</p>
          </div>
        </div>
      </main>
    );
  }

  if (!isPremium) {
    return (
      <main className="ebooks-stage">
        <div className="premium-ebooks-container">
          <button
            type="button"
            className="premium-ebooks-back"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>

          <div className="ebooks-empty">
            <span aria-hidden="true">★</span>

            <h3>Premium access required.</h3>

            <p>
              Upgrade to a Premium membership to explore the
              premium digital collection.
            </p>

            <Link
              to="/membership"
              className="ebooks-premium-link"
            >
              View membership plans →
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="ebooks-stage">
      <div className="premium-ebooks-container">
        <button
          type="button"
          className="premium-ebooks-back"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <header className="ebooks-hero">
          <div>
            <p className="ebooks-eyebrow">
              PREMIUM DIGITAL COLLECTION
            </p>

            <h1>
              Discover
              <br />
              <em>Premium eBooks.</em>
            </h1>

            <p className="ebooks-text">
              A dedicated reading collection for Premium members.
            </p>
          </div>

          <div className="ebooks-count" aria-live="polite">
            <span>AVAILABLE</span>
            <strong>{loading ? "—" : ebooks.length}</strong>
            <p>
              {ebooks.length === 1 ? "EBOOK" : "EBOOKS"}
            </p>
          </div>
        </header>

        {message && (
          <p
            className={`ebooks-message ebooks-message-${messageType}`}
            role={messageType === "error" ? "alert" : "status"}
          >
            {message}
          </p>
        )}

        {loading ? (
          <div className="ebooks-empty" role="status">
            <span aria-hidden="true">★</span>
            <h3>Opening premium shelf…</h3>
            <p>Loading premium eBooks.</p>
          </div>
        ) : ebooks.length === 0 ? (
          <div className="ebooks-empty">
            <span aria-hidden="true">★</span>
            <h3>Premium collection coming soon.</h3>
            <p>
              Premium eBooks have not been added to this page yet.
            </p>

            <Link to="/books" className="ebooks-catalogue-link">
              Browse regular catalogue →
            </Link>
          </div>
        ) : (
          <section
            className="ebooks-shelf"
            aria-label="Premium ebooks"
          >
            {ebooks.map((book) => (
              <article
                className="ebook-3d"
                key={book._id}
              >
                <div className="ebook-3d-inner">
                  <div className="ebook-cover">
                    <span
                      className="ebook-cover-spine"
                      aria-hidden="true"
                    />

                    <div className="ebook-cover-content">
                      <span>PREMIUM EDITION</span>
                      <strong>{book.title || "Untitled"}</strong>
                      <small>
                        by {book.author || "Unknown"}
                      </small>
                    </div>

                    <span
                      className="ebook-cover-star"
                      aria-hidden="true"
                    >
                      ★
                    </span>
                  </div>

                  <div className="ebook-details">
                    <h3>{book.title || "Untitled book"}</h3>
                    <p>
                      by {book.author || "Unknown author"}
                    </p>

                    <Link
                      to="/my-ebooks"
                      className="ebooks-catalogue-link"
                    >
                      Go to My eBooks →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}