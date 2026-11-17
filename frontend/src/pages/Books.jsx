import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import "./Books.css";

export default function Books() {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const loadBooks = async () => {
    try {
      const { data } = await api.get("/books", {
        params: { search }
      });

      setBooks(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Books could not be loaded."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  let ignore = false;

  const timer = setTimeout(async () => {
    try {
      const { data } = await api.get("/books", {
        params: { search }
      });

      if (!ignore) {
        setBooks(Array.isArray(data) ? data : []);
        setMessage("");
      }
    } catch (error) {
      if (!ignore) {
        setMessage(
          error.response?.data?.message ||
            "Books could not be loaded."
        );
        setMessageType("error");
      }
    } finally {
      if (!ignore) {
        setLoading(false);
      }
    }
  }, 400);

  return () => {
    ignore = true;
    clearTimeout(timer);
  };
}, [search]);
  const categories = [
    "All",
    ...new Set(
      books
        .map((book) => book.category)
        .filter(Boolean)
    )
  ];

  const visibleBooks =
    category === "All"
      ? books
      : books.filter(
          (book) =>
            book.category?.toLowerCase() ===
            category.toLowerCase()
        );
        const issueBook = async (bookId) => {
  setActionId(bookId);
  setMessage("");
  setMessageType("");

  try {
    const book = books.find((item) => item._id === bookId);

    const libraryId =
      typeof book?.library === "object"
        ? book.library._id
        : book?.library;

    if (!libraryId) {
      setMessage("Library information is missing for this book.");
      setMessageType("error");
      return;
    }

    const { data } = await api.post(`/books/${bookId}/issue`, {
      libraryId
    });

    setMessage(data.message || "Book issued successfully.");
    setMessageType("success");
    loadBooks();
  } catch (error) {
    setMessage(
      error.response?.data?.message || "Cannot issue book."
    );
    setMessageType("error");
  } finally {
    setActionId(null);
  }
};

  return (
    <main className="books-catalogue">
      <header className="books-hero">
        <div className="books-hero-copy">
          <p className="books-eyebrow">THE LIBRARY CATALOGUE</p>

          <h1>
            Every book,
            <br />
            <em>one shelf</em> away.
          </h1>

          <p className="books-hero-text">
            Search the collection, check availability, and issue
            your next read.
          </p>
        </div>

        <div className="books-hero-art" aria-hidden="true">
          <div className="books-hero-ring" />
          <span className="books-hero-star">✦</span>

          <div className="books-hero-card">
            <span>CATALOGUE</span>
            <strong>
              Find your
              <br />
              next read.
            </strong>
            <small>LIBRARY COLLECTION</small>
          </div>
        </div>
      </header>

      <section className="books-controls">
        <div className="books-search">
          <span aria-hidden="true">⌕</span>

          <input
            type="search"
            placeholder="Search by title, author or category"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="books-filters">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              className={
                category === item
                  ? "books-filter books-filter-active"
                  : "books-filter"
              }
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {message && (
        <p
          className={`books-message books-message-${messageType}`}
          role={messageType === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      )}

      <section className="books-results">
        <div className="books-results-heading">
          <h2>
            {category === "All"
              ? "All books"
              : `${category} collection`}
          </h2>

          <span aria-live="polite">
            {loading
              ? "LOADING…"
              : `${visibleBooks.length} ${
                  visibleBooks.length === 1 ? "BOOK" : "BOOKS"
                }`}
          </span>
        </div>

        {loading ? (
          <div className="books-empty">
            <span aria-hidden="true">✦</span>
            <h3>Opening the catalogue…</h3>
            <p>Loading available books.</p>
          </div>
        ) : visibleBooks.length === 0 ? (
          <div className="books-empty">
            <span aria-hidden="true">✧</span>
            <h3>No books found.</h3>
            <p>
              Try another title, author, category or search term.
            </p>
          </div>
        ) : (
          <div className="books-grid">
            {visibleBooks.map((book) => {
              const isAvailable = book.availableCopies > 0;
              const isBusy = actionId === book._id;

              return (
                <article
                  className="books-card"
                  key={book._id}
                >
                  <div className="books-card-spine">
                    <span className="books-spine-line" />
                    <span className="books-spine-label">
                      {book.category || "GENERAL"}
                    </span>
                  </div>

                  <div className="books-card-body">
                    <h3>{book.title}</h3>

                    <p className="books-author">
                      by {book.author}
                    </p>

                    {book.library?.name && (
                      <p className="books-library">
                        {book.library.name}
                      </p>
                    )}

                    <span
                      className={
                        isAvailable
                          ? "books-status books-status-available"
                          : "books-status books-status-unavailable"
                      }
                    >
                      {isAvailable
                        ? `Available · ${book.availableCopies}`
                        : "Not available"}
                    </span>
                  </div>

                  <div className="books-card-actions">
                    {book.isEbook ? (
                      <button
                        type="button"
                        onClick={() => selectEbook(book._id)}
                        disabled={isBusy}
                      >
                        {isBusy
                          ? "Selecting…"
                          : "Select ebook"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => issueBook(book._id)}
                        disabled={!isAvailable || isBusy}
                      >
                        {isBusy
                          ? "Issuing…"
                          : isAvailable
                          ? "Issue book"
                          : "Unavailable"}
                      </button>
                    )}
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