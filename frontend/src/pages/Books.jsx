import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import "./Books.css";
import { useNavigate } from "react-router-dom";

export default function Books() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [issues, setIssues] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const loadBooks = async () => {
    try {
      const { data } = await api.get("/books", {
        params: { search },
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

  const loadMyIssues = async () => {
    try {
      const { data } = await api.get("/issues/my");

      setIssues(Array.isArray(data) ? data : []);
    } catch (error) {
      setIssues([]);
    }
  };

  useEffect(() => {
    let ignore = false;

    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get("/books", {
          params: { search },
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

  useEffect(() => {
    if (user) {
      loadMyIssues();
    }
  }, [user]);

  const categories = [
    "All",
    ...new Set(
      books
        .map((book) => book.category)
        .filter(Boolean)
    ),
  ];

  const visibleBooks =
    category === "All"
      ? books
      : books.filter(
          (book) =>
            book.category?.toLowerCase() ===
            category.toLowerCase()
        );

  const getLibraryId = (book) => {
    const library = book?.library;

    if (!library) return "";

    if (typeof library === "string") {
      return library;
    }

    return library._id || String(library) || "";
  };

  const getBookIssue = (bookId) =>
    issues.find(
      (issue) =>
        (issue.book?._id || issue.book) === bookId &&
        ["requested", "issued"].includes(issue.status)
    );

  const issueBook = async (bookId) => {
    setActionId(bookId);
    setMessage("");
    setMessageType("");

    try {
      const book = books.find((item) => item._id === bookId);
      const libraryId = getLibraryId(book);

      if (!libraryId) {
        setMessage(
          "Library information is missing for this book."
        );
        setMessageType("error");
        return;
      }

      const { data } = await api.post("/issues", {
        bookId,
        libraryId,
      });

      setMessage(
        data.message || "Issue request sent successfully."
      );
      setMessageType("success");

      await loadMyIssues();
      await loadBooks();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Could not send issue request."
      );
      setMessageType("error");
    } finally {
      setActionId(null);
    }
  };

  const returnBook = async (issueId) => {
    setActionId(issueId);
    setMessage("");
    setMessageType("");

    try {
      const { data } = await api.post(
        `/issues/${issueId}/return`
      );

      setMessage(
        data.message || "Book returned successfully."
      );
      setMessageType("success");

      await loadMyIssues();
      await loadBooks();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Could not return this book."
      );
      setMessageType("error");
    } finally {
      setActionId(null);
    }
  };

  const selectEbook = async (bookId) => {
    setActionId(bookId);
    setMessage("");
    setMessageType("");

    try {
      await api.post(`/books/${bookId}/select`);

      setMessage("Ebook selected successfully.");
      setMessageType("success");
      await loadBooks();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Could not select ebook."
      );
      setMessageType("error");
    } finally {
      setActionId(null);
    }
  };

  const openEbook = (book) => {
  const ebookUrl = book.ebookUrl;

  if (!ebookUrl) {
    setMessage("Ebook link is not available.");
    setMessageType("error");
    return;
  }

  navigate(`/ebook/${book._id}`, {
    state: {
      ebookUrl,
      title: book.title
    }
  });
};

  return (
    <main className="books-catalogue">
      <header className="books-hero">
        <div className="books-hero-copy">
          <p className="books-eyebrow">
            THE LIBRARY CATALOGUE
          </p>

          <h1>
            Every book,
            <br />
            <em>one shelf</em> away.
          </h1>

          <p className="books-hero-text">
            Search the collection, request a book, and read
            after admin approval.
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
            onChange={(event) =>
              setSearch(event.target.value)
            }
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
          role={
            messageType === "error" ? "alert" : "status"
          }
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
                  visibleBooks.length === 1
                    ? "BOOK"
                    : "BOOKS"
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
              Try another title, author, category or search
              term.
            </p>
          </div>
        ) : (
          <div className="books-grid">
            {visibleBooks.map((book) => {
              const isAvailable =
                book.availableCopies > 0;
              const isBusy = actionId === book._id;
              const bookIssue = getBookIssue(book._id);
              const isRequested =
                bookIssue?.status === "requested";
              const isIssued =
                bookIssue?.status === "issued";

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

                    <div className="books-library-info">
                      <p className="books-library">
                        Library:{" "}
                        {book.library?.name ||
                          "Library name unavailable"}
                      </p>

                      {book.library &&
                        typeof book.library === "object" && (
                          <p className="books-library-location">
                            {[
                              book.library.address ||
                                book.library.area,
                              book.library.city,
                              book.library.pincode,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        )}

                      <p className="books-library-id">
                        Library ID:{" "}
                        {typeof book.library === "string"
                          ? book.library
                          : book.library?._id || "Unavailable"}
                      </p>
                    </div>

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
                      isIssued ? (
                        <>
                          <button
                            type="button"
                            onClick={() => openEbook(book)}
                          >
                            Open
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              returnBook(bookIssue._id)
                            }
                          >
                            {isBusy
                              ? "Returning…"
                              : "Return"}
                          </button>
                        </>
                      ) : isRequested ? (
                        <button
                          type="button"
                          disabled
                        >
                          Request sent
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            issueBook(book._id)
                          }
                          disabled={isBusy}
                        >
                          {isBusy
                            ? "Sending request…"
                            : "Issue"}
                        </button>
                      )
                    ) : isIssued ? (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          returnBook(bookIssue._id)
                        }
                      >
                        {isBusy
                          ? "Returning…"
                          : "Return"}
                      </button>
                    ) : isRequested ? (
                      <button
                        type="button"
                        disabled
                      >
                        Request sent
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          issueBook(book._id)
                        }
                        disabled={!isAvailable || isBusy}
                      >
                        {isBusy
                          ? "Sending request…"
                          : isAvailable
                            ? "Issue"
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