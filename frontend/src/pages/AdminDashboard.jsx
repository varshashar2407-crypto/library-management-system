// AdminDashboad.jsx
import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import "./AdminDashboard.css";


export default function AdminDashboard() {
  const { user } = useAuth();


  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);


  const categories = [
    "All",
    "Fiction",
    "Non-Fiction",
    "Science",
    "History",
    "Technology",
    "Biography",
  ];


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
  const timer = setTimeout(() => {
    let ignore = false;


    const loadBooks = async () => {
      try {
        const { data } = await api.get("/books", {
          params: { search }
        });


        if (!ignore) {
          setBooks(Array.isArray(data) ? data : []);
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
    };


    loadBooks();


    return () => {
      ignore = true;
    };
  }, 400);


  return () => clearTimeout(timer);
}, [search]);


  const visibleBooks =
    category === "All"
      ? books
      : books.filter(
          (book) =>
            book.category?.toLowerCase() ===
            category.toLowerCase()
        );


  const totalBooks = books.length;
  const availableBooks = books.filter(
    (book) => book.availableCopies > 0
  ).length;
  const ebookCount = books.filter((book) => book.isEbook).length;
  const unavailableBooks = totalBooks - availableBooks;


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
    console.log("ISSUE ERROR STATUS:", error.response?.status);
    console.log("ISSUE ERROR DATA:", error.response?.data);
    console.log("ISSUE REQUEST URL:", error.config?.url);


    setMessage(
      error.response?.data?.message || 
      error.response?.data?.error ||
      "Cannot issue book."
    );
    setMessageType("error");
  } finally {
    setActionId(null);
  }
};


  const selectEbook = async (bookId) => {
    setActionId(bookId);
    setMessage("Ebook selection coming soon.");
    setMessageType("info");
    setActionId(null);
  };


  return (
    <main className="admin-dashboard">
      <aside className="admin-rail">
        <div className="admin-rail-brand">
          <span className="admin-rail-mark">A</span>


          <div>
            <p>ADMIN CONSOLE</p>
            <strong>Mission Control</strong>
          </div>
        </div>


        <nav className="admin-rail-menu">
          <span className="admin-rail-active">Overview</span>
          <span>Books</span>
          <span>Members</span>
          <span>Issues</span>
          <span>Reports</span>
        </nav>


        <div className="admin-rail-user">
          <span>OPERATOR</span>
          <strong>{user?.name || "Administrator"}</strong>
        </div>
      </aside>


      <section className="admin-content">
        <header className="admin-command-header">
          <div>
            <p className="admin-eyebrow">
              LIBRARY OPERATIONS / LIVE OVERVIEW
            </p>


            <h1>
              Command
              <br />
              <em>center.</em>
            </h1>


            <p className="admin-command-note">
              Monitor the catalogue, track availability and manage
              book operations from one place.
            </p>
          </div>


          <div className="admin-signal">
            <span className="admin-signal-dot" />
            <div>
              <span>SYSTEM</span>
              <strong>Online</strong>
            </div>
          </div>
        </header>


        {message && (
          <p
            className={`admin-alert admin-alert-${messageType}`}
            role={messageType === "error" ? "alert" : "status"}
          >
            {message}
          </p>
        )}


        <section className="admin-stats">
          <article className="admin-stat">
            <span>TOTAL BOOKS</span>
            <strong>{loading ? "—" : totalBooks}</strong>
            <p>Registered in catalogue</p>
          </article>


          <article className="admin-stat admin-stat-green">
            <span>AVAILABLE</span>
            <strong>{loading ? "—" : availableBooks}</strong>
            <p>Ready to issue</p>
          </article>


          <article className="admin-stat admin-stat-amber">
            <span>EBOOKS</span>
            <strong>{loading ? "—" : ebookCount}</strong>
            <p>Digital selections</p>
          </article>


          <article className="admin-stat admin-stat-red">
            <span>UNAVAILABLE</span>
            <strong>{loading ? "—" : unavailableBooks}</strong>
            <p>Currently out of stock</p>
          </article>
        </section>


        <section className="admin-console">
          <div className="admin-console-head">
            <div>
              <p className="admin-eyebrow">CATALOGUE CONTROL</p>
              <h2>Book operations</h2>
            </div>


            <div className="admin-search">
              <span aria-hidden="true">⌕</span>


              <input
                type="search"
                placeholder="Search title, author or category"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>


          <div className="admin-chips">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                className={
                  category === item
                    ? "admin-chip admin-chip-active"
                    : "admin-chip"
                }
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>


          {loading ? (
            <div className="admin-blank">
              <span aria-hidden="true">✦</span>
              <h3>Initializing dashboard…</h3>
              <p>Loading catalogue data.</p>
            </div>
          ) : visibleBooks.length === 0 ? (
            <div className="admin-blank">
              <span aria-hidden="true">✧</span>
              <h3>No records found.</h3>
              <p>Adjust the search term or category filter.</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Category</th>
                    <th>Library</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>


                <tbody>
  {visibleBooks.map((book) => {
    const isAvailable = book.availableCopies > 0;

    return (
      <tr key={book._id}>
        <td>
          <div className="admin-book-cell">
            <strong>{book.title}</strong>
            <span>by {book.author}</span>
          </div>
        </td>

        <td>{book.category || "General"}</td>

        <td>
          <span
            className={
              book.isEbook
                ? "admin-type admin-type-digital"
                : "admin-type"
            }
          >
            {book.isEbook ? "Ebook" : "Physical"}
          </span>
        </td>

        <td>
          <span
            className={
              isAvailable
                ? "admin-status admin-status-ok"
                : "admin-status admin-status-off"
            }
          >
            {isAvailable
              ? `Available · ${book.availableCopies}`
              : "Unavailable"}
          </span>
        </td>
      </tr>
    );
  })}
</tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}