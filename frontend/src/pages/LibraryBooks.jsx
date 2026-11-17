import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../api/axios";
import "./LibraryBooks.css";

export default function LibraryBooks() {
  const { libraryId } = useParams();

  const [books, setBooks] = useState([]);
  const [issuedIds, setIssuedIds] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(true);
  const [issuingId, setIssuingId] = useState(null);

  const fetchBooks = async () => {
    try {
      const response = await API.get(`/books/library/${libraryId}`);

      setBooks(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to load books."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyIssues = async () => {
    try {
      const response = await API.get("/issues/my");

      setIssuedIds(
        response.data
          .filter((issue) => issue.status === "issued")
          .map((issue) => issue.book?._id || issue.book)
      );
    } catch (error) {
      setIssuedIds([]);
    }
  };

  const issueBook = async (bookId) => {
    if (issuingId) {
      return;
    }

    setIssuingId(bookId);
    setMessage("");
    setMessageType("");

    try {
      await API.post(`/books/${bookId}/issue`, {
        libraryId
      });

      setIssuedIds((previous) => [...previous, bookId]);
      setMessage("Book issued successfully!");
      setMessageType("success");

      fetchBooks();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to issue book."
      );
      setMessageType("error");
    } finally {
      setIssuingId(null);
    }
  };

  useEffect(() => {
  let ignore = false;

  const loadLibraryData = async () => {
    try {
      const response = await API.get(`/books/library/${libraryId}`);

      if (!ignore) {
        setBooks(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      if (!ignore) {
        setMessage(
          error.response?.data?.message || "Failed to load books."
        );
        setMessageType("error");
      }
    } finally {
      if (!ignore) {
        setLoading(false);
      }
    }

    try {
      const issueResponse = await API.get("/issues/my");

      if (!ignore) {
        setIssuedIds(
          issueResponse.data
            .filter((issue) => issue.status === "issued")
            .map((issue) => issue.book?._id || issue.book)
        );
      }
    } catch {
      if (!ignore) {
        setIssuedIds([]);
      }
    }
  };

  loadLibraryData();

  return () => {
    ignore = true;
  };
}, [libraryId]);

  const availableCount = books.filter(
    (book) => book.availableCopies > 0
  ).length;

  return (
    <main className="library-books">
      <header className="library-books-hero">
        <div className="library-books-hero-copy">
          <Link to="/nearby-libraries" className="library-books-back">
            ← BACK TO LIBRARIES
          </Link>

          <p className="library-books-eyebrow">
            LIBRARY COLLECTION
          </p>

          <h1>
            Books on
            <br />
            <em>this shelf.</em>
          </h1>

          <p className="library-books-text">
            Browse the available collection and issue your next
            read from this library.
          </p>
        </div>

        <div className="library-books-hero-art" aria-hidden="true">
          <div className="library-books-ring" />
          <span className="library-books-star">✦</span>

          <div className="library-books-badge">
            <span>THIS LIBRARY</span>
            <strong>
              {loading ? "—" : `${books.length}`}
              <br />
              books
            </strong>
            <small>
              {loading ? "LOADING…" : `${availableCount} AVAILABLE`}
            </small>
          </div>
        </div>
      </header>

      {message && (
        <p
          className={`library-books-message library-books-message-${messageType}`}
          role={messageType === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      )}

      <section className="library-books-section">
        <div className="library-books-heading">
          <h2>Available books</h2>
          <span aria-live="polite">
            {loading
              ? "OPENING SHELF…"
              : `${books.length} ${
                  books.length === 1 ? "BOOK" : "BOOKS"
                }`}
          </span>
        </div>

        {loading ? (
          <div className="library-books-empty">
            <span aria-hidden="true">✦</span>
            <h3>Opening this shelf…</h3>
            <p>Loading the library collection.</p>
          </div>
        ) : books.length === 0 ? (
          <div className="library-books-empty">
            <span aria-hidden="true">✧</span>
            <h3>No books available yet.</h3>
            <p>
              This library has not added any books to its
              collection.
            </p>
          </div>
        ) : (
          <div className="library-books-grid">
            {books.map((book) => {
              const isIssued = issuedIds.includes(book._id);
              const isAvailable = book.availableCopies > 0;
              const isIssuing = issuingId === book._id;

              return (
                <article
                  className="library-book-card"
                  key={book._id}
                >
                  <div className="library-book-spine">
                    <span className="library-book-line" />
                    <span>
                      {book.category || "GENERAL"}
                    </span>
                  </div>

                  <div className="library-book-body">
                    <h3>{book.title}</h3>
                    <p className="library-book-author">
                      by {book.author}
                    </p>

                    <span
                      className={
                        isAvailable
                          ? "library-book-status library-book-status-ok"
                          : "library-book-status library-book-status-off"
                      }
                    >
                      {isAvailable
                        ? `${book.availableCopies} available`
                        : "Out of stock"}
                    </span>
                  </div>

                  <div className="library-book-actions">
                    <button
                      type="button"
                      onClick={() => issueBook(book._id)}
                      disabled={!isAvailable || isIssued || isIssuing}
                    >
                      {isIssued
                        ? "Issued ✓"
                        : isIssuing
                        ? "Issuing…"
                        : isAvailable
                        ? "Issue book"
                        : "Out of stock"}
                    </button>
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