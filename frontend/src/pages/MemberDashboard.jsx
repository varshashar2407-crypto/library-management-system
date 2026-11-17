import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import "./MemberDashboard.css";


export default function MemberDashboard() {
  const { user } = useAuth();

  const [issuedBooks, setIssuedBooks] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");


  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const booksRes = await api.get("/books/my-issued");

        setIssuedBooks(
          Array.isArray(booksRes.data) ? booksRes.data : []
        );
      } catch (error) {
        setMessage(
          error.response?.data?.message ||
            "Your issued books could not be loaded."
        );
        setMessageType("error");
      } finally {
        setLoading(false);
      }
    };

    const loadSubscription = async () => {
      try {
        const res = await api.get("/subscriptions/my");
        setSubscription(res.data.subscription);
      } catch (error) {
        setSubscription(null);
      }
    };

    loadDashboardData();
    loadSubscription();
  }, []);


  const premiumPlans = [
  "premium",
  "monthly premium",
  "annual premium"
];

const planName =
  typeof subscription?.planName === "string"
    ? subscription.planName
    : typeof subscription?.plan?.name === "string"
    ? subscription.plan.name
    : typeof subscription?.plan === "string"
    ? subscription.plan
    : "";

const subscriptionStatus =
  typeof subscription?.status === "string"
    ? subscription.status
    : "";

const isPremium =
  subscriptionStatus.trim().toLowerCase() === "active" &&
  premiumPlans.includes(planName.trim().toLowerCase());

const activeBooks = issuedBooks.filter(
  (issue) => issue.status !== "returned"
);
  const totalFine = issuedBooks.reduce(
    (sum, issue) => sum + (issue.fineAmount || 0),
    0
  );


  return (
    <main
      className={
        isPremium
          ? "member-dashboard premium-dashboard"
          : "member-dashboard"
      }
    >
      <header className="member-hero">
        <div className="member-hero-copy">
          <p className="member-eyebrow">MY READING PASSPORT</p>

          <h1>
            Hello, <em>{user?.name || "Reader"}</em>.

            {isPremium && (
              <span className="member-premium-badge">
                Premium Member
              </span>
            )}
          </h1>

          <p className="member-hero-text">
            {user?.area}, {user?.city} — {user?.pincode}
          </p>

          <div className="member-hero-actions">
            <Link
              to="/nearby-libraries"
              className="member-primary-link"
            >
              Explore nearby libraries
            </Link>

            <Link to="/books" className="member-secondary-link">
              Browse catalogue
            </Link>
          </div>
        </div>

        <div className="member-hero-art" aria-hidden="true">
          <div className="member-hero-ring" />
          <span className="member-hero-star">✦</span>

          <div className="member-passport">
            <span>READING PASSPORT</span>

            <strong>
              {user?.name || "Reader"}
            </strong>

            <small>
              {activeBooks.length} ACTIVE{" "}
              {activeBooks.length === 1 ? "BOOK" : "BOOKS"}
            </small>
          </div>
        </div>
      </header>


      {message && (
        <p
          className={`member-alert member-alert-${messageType}`}
          role={messageType === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      )}


      <section className="member-stats">
        <article className="member-stat">
          <span>ACTIVE ISSUES</span>
          <strong>{loading ? "—" : activeBooks.length}</strong>
          <p>Currently with you</p>
        </article>

        <article className="member-stat member-stat-amber">
          <span>TOTAL FINE</span>
          <strong>₹{loading ? "—" : totalFine}</strong>
          <p>Across all records</p>
        </article>

        <article className="member-stat member-stat-green">
          <span>TOTAL BORROWED</span>
          <strong>{loading ? "—" : issuedBooks.length}</strong>
          <p>Books issued overall</p>
        </article>

        <article className="member-stat member-stat-walnut">
          <span>RETURNED</span>
          <strong>
            {loading
              ? "—"
              : issuedBooks.filter(
                  (issue) => issue.status === "returned"
                ).length}
          </strong>
          <p>Completed reads</p>
        </article>
      </section>


      <section className="member-issues">
        <div className="member-issues-heading">
          <div>
            <p className="member-eyebrow">CURRENT SHELF</p>
            <h2>My issued books</h2>
          </div>

          <span aria-live="polite">
            {loading
              ? "LOADING…"
              : `${issuedBooks.length} ${
                  issuedBooks.length === 1 ? "RECORD" : "RECORDS"
                }`}
          </span>
        </div>


        {loading ? (
          <div className="member-empty">
            <span aria-hidden="true">✦</span>
            <h3>Opening your shelf…</h3>
            <p>Loading your issued books.</p>
          </div>
        ) : issuedBooks.length === 0 ? (
          <div className="member-empty">
            <span aria-hidden="true">✧</span>
            <h3>Your reading shelf is empty.</h3>
            <p>
              Visit a nearby library and issue your first book.
            </p>

            <Link
              to="/nearby-libraries"
              className="member-empty-link"
            >
              Find a library →
            </Link>
          </div>
        ) : (
          <div className="member-issues-grid">
            {issuedBooks.map((issue) => {
              const isReturned = issue.status === "returned";
              const dueDate = issue.dueDate
                ? new Date(issue.dueDate).toLocaleDateString()
                : "—";

              return (
                <article
                  className="member-issue-card"
                  key={issue._id}
                >
                  <div className="member-issue-top">
                    <span className="member-issue-id">
                      #{String(issue._id).slice(-6).toUpperCase()}
                    </span>

                    <span
                      className={
                        isReturned
                          ? "member-issue-status member-issue-status-returned"
                          : "member-issue-status member-issue-status-active"
                      }
                    >
                      {issue.status}
                    </span>
                  </div>

                  <div className="member-issue-body">
                    <h3>
                      {issue.book?.title || "Untitled book"}
                    </h3>

                    <p className="member-issue-author">
                      by {issue.book?.author || "Unknown author"}
                    </p>

                    <div className="member-issue-details">
                      <div>
                        <span>DUE DATE</span>
                        <p>{dueDate}</p>
                      </div>

                      <div>
                        <span>FINE</span>
                        <p>₹{issue.fineAmount || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="member-issue-footer">
                    <span aria-hidden="true">✦</span>
                    <p>
                      {isReturned
                        ? "This chapter is complete."
                        : "Enjoy your current chapter."}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}