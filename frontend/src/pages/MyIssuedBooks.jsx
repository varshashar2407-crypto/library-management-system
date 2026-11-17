import { useEffect, useState } from "react";
import api from "../api/axios.js";
import "./MyIssuedBooks.css";

export default function MyIssuedBooks() {
  const [books, setBooks] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const loadBooks = async () => {
    try {
      const { data } = await api.get("/issues/my");

      setBooks(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Issued books could not be loaded."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const returnBook = async (issueId) => {
    if (actionId) return;

    setActionId(issueId);
    setMessage("");
    setMessageType("");

    try {
      const { data } = await api.post(`/issues/${issueId}/return`);

      setMessage(data.message || "Book returned successfully.");
      setMessageType("success");

      await loadBooks();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Could not return this book. Please try again."
      );
      setMessageType("error");
    } finally {
      setActionId(null);
    }
  };

  const reissueBook = async (issueId) => {
    if (actionId) return;

    setActionId(issueId);
    setMessage("");
    setMessageType("");

    try {
      const { data } = await api.put(`/issues/${issueId}/reissue`);

      setMessage(data.message || "Book reissued successfully.");
      setMessageType("success");

      await loadBooks();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Could not reissue this book."
      );
      setMessageType("error");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="page">
      <h1>My Issued Books</h1>

      {message && (
        <p
          className={`message ${
            messageType === "error" ? "message-error" : "message-success"
          }`}
          role={messageType === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      )}

      {loading ? (
        <p>Loading your issued books…</p>
      ) : books.length === 0 ? (
        <p>You have not issued any books yet.</p>
      ) : (
        <div className="issued-grid">
          {books.map((item) => {
            const fine = item.fineAmount ?? item.fine ?? 0;
            const reissueCount = item.reissueCount || 0;
            const isReturned = item.status === "returned";
            const isBusy = actionId === item._id;
            const reissueLimitReached = reissueCount >= 2;

            return (
              <div key={item._id} className="issued-card">
                <h3>{item.book?.title || "Untitled book"}</h3>

                <p>{item.book?.author || "Unknown author"}</p>

                <p>
                  Library: {item.library?.name || "—"}
                </p>

                <p>
                  Issued:{" "}
                  {item.issueDate || item.createdAt
                    ? new Date(
                        item.issueDate || item.createdAt
                      ).toLocaleDateString()
                    : "—"}
                </p>

                <p>
                  Due:{" "}
                  {item.dueDate
                    ? new Date(item.dueDate).toLocaleDateString()
                    : "—"}
                </p>

                <p>
                  Status: <strong>{item.status}</strong>
                </p>

                {isReturned ? (
                  <p className="returned-note">
                    Returned on{" "}
                    {item.returnedDate
                      ? new Date(item.returnedDate).toLocaleDateString()
                      : "—"}
                  </p>
                ) : (
                  <div className="issued-actions">
                    <button
                      type="button"
                      className="btn primary"
                      onClick={() => returnBook(item._id)}
                      disabled={isBusy}
                    >
                      {isBusy ? "Returning…" : "Return Book"}
                    </button>

                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() => reissueBook(item._id)}
                      disabled={isBusy || reissueLimitReached}
                    >
                      {isBusy
                        ? "Reissuing…"
                        : reissueLimitReached
                        ? "Reissue Limit Reached"
                        : "Reissue Book"}
                    </button>
                  </div>
                )}

                <p>Reissued: {reissueCount} time(s)</p>

                {fine > 0 && (
                  <p className="fine">Fine: Rs {fine}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}