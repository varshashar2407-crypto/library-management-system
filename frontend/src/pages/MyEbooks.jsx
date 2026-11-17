import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import "./MyEbooks.css";

export default function MyEbooks() {
  const navigate = useNavigate();

  const [ebooks, setEbooks] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const actionLock = useRef(false);

  useEffect(() => {
    let active = true;

    const loadEbooks = async () => {
      try {
        const { data } = await api.get("/books/my-ebooks");

        if (active) {
          setEbooks(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (active) {
          setMessage(
            error.response?.data?.message ||
              "Your ebooks could not be loaded."
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
  }, []);

  const deselect = async (bookId) => {
    if (!bookId || actionLock.current) return;

    actionLock.current = true;
    setActionId(bookId);
    setMessage("");
    setMessageType("");

    try {
      await api.post(`/books/${bookId}/ebook/deselect`);

      setEbooks((previous) =>
        previous.filter((item) => item.book?._id !== bookId)
      );

      setMessage("Ebook deselected successfully.");
      setMessageType("success");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Failed to deselect ebook."
      );
      setMessageType("error");
    } finally {
      actionLock.current = false;
      setActionId(null);
    }
  };

  return (
    <main className="ebooks-stage">
      <div className="ebooks-navigation">
        </div>

      <header className="ebooks-hero">
        <div>
          <p className="ebooks-eyebrow">MY DIGITAL SHELF</p>

          <h1>
            Ebooks in
            <br />
            <em>your pocket.</em>
          </h1>

          <p className="ebooks-text">
            Your selected digital books, ready whenever you want
            to continue reading.
          </p>

          <Link
            to="/premium-ebooks"
            className="ebooks-premium-link"
          >
            <span aria-hidden="true">★</span>
            Premium eBooks
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="ebooks-count" aria-live="polite">
          <span>SELECTED</span>
          <strong>{loading ? "—" : ebooks.length}</strong>
          <p>{ebooks.length === 1 ? "EBOOK" : "EBOOKS"}</p>
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
          <span aria-hidden="true">✦</span>
          <h3>Opening your digital shelf…</h3>
          <p>Loading selected ebooks.</p>
        </div>
      ) : ebooks.length === 0 ? (
        <div className="ebooks-empty">
          <span aria-hidden="true">✧</span>
          <h3>No ebooks selected yet.</h3>

          <p>
            Browse the catalogue and select an ebook to add it
            here.
          </p>

          <Link to="/books" className="ebooks-catalogue-link">
            Browse catalogue →
          </Link>
        </div>
      ) : (
        <section
          className="ebooks-shelf"
          aria-label="Your selected ebooks"
        >
          {ebooks.map((item, index) => {
            const book = item.book || {};
            const isBusy = actionId === book._id;

            return (
              <article
                className="ebook-3d"
                key={item._id}
                style={{
                  animationDelay: `${index * 0.08}s`
                }}
              >
                <div className="ebook-3d-inner">
                  <div className="ebook-cover">
                    <span
                      className="ebook-cover-spine"
                      aria-hidden="true"
                    />

                    <div className="ebook-cover-content">
                      <span>DIGITAL EDITION</span>
                      <strong>{book.title || "Untitled"}</strong>
                      <small>
                        by {book.author || "Unknown"}
                      </small>
                    </div>

                    <span
                      className="ebook-cover-star"
                      aria-hidden="true"
                    >
                      ✦
                    </span>
                  </div>

                  <div className="ebook-details">
                    <h3>{book.title || "Untitled book"}</h3>

                    <p>
                      by {book.author || "Unknown author"}
                    </p>

                    <button
                      type="button"
                      onClick={() => deselect(book._id)}
                      disabled={!book._id || actionId !== null}
                      aria-label={`Deselect ${
                        book.title || "ebook"
                      }`}
                    >
                      {isBusy ? "Removing…" : "Deselect ebook"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}