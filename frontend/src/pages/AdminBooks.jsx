import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import "./AdminDashboard.css";
import "./AdminBooks.css";

const emptyForm = {
  title: "",
  author: "",
  category: "",
  totalCopies: "1",
};

const getLibraryId = (value) =>
  String(
    value && typeof value === "object"
      ? value._id || ""
      : value || ""
  );

export default function AdminBooks() {
  const { user } = useAuth();
  const userId = user?.id || user?._id;
  const canManage = user?.role === "admin";

  const [library, setLibrary] = useState(null);
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });

  const busy = saving || deletingId !== null;

  useEffect(() => {
    let ignore = false;

    async function fetchBooks() {
      setLoading(true);
      setError("");
      setLibrary(null);
      setBooks([]);
      setEditorOpen(false);
      setEditingId(null);

      if (!userId || !canManage) {
        setError("Please sign in with an admin account.");
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/admin/library-books");

        if (ignore) return;

        if (!data?.library?._id || !Array.isArray(data.books)) {
          throw new Error(
            "Unexpected API response. Check the /admin/library-books route."
          );
        }

        const libraryId = String(data.library._id);

        const containsForeignBooks = data.books.some(
          (book) => getLibraryId(book.library) !== libraryId
        );

        if (containsForeignBooks) {
          throw new Error(
            "Library mismatch detected. Check backend library filtering."
          );
        }

        setLibrary(data.library);
        setBooks(data.books.filter((book) => !book.isEbook));
      } catch (err) {
        if (ignore) return;

        setError(
          err.response?.data?.message ||
            err.message ||
            "Books could not be loaded."
        );
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchBooks();

    return () => {
      ignore = true;
    };
  }, [userId, canManage, refreshKey]);

  const categories = [
    "All",
    ...new Set(
      books.map((book) => book.category).filter(Boolean)
    ),
  ];

  const searchTerm = search.trim().toLowerCase();

  const visibleBooks = books.filter((book) => {
    const matchesCategory =
      category === "All" || book.category === category;

    const searchableText = [
      book.title,
      book.author,
      book.category,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      matchesCategory &&
      searchableText.includes(searchTerm)
    );
  });

  const totalCopies = books.reduce(
    (sum, book) => sum + (book.totalCopies || 0),
    0
  );

  const availableCopies = books.reduce(
    (sum, book) => sum + (book.availableCopies || 0),
    0
  );

  const unavailableTitles = books.filter(
    (book) => book.availableCopies === 0
  ).length;

  const refreshBooks = () => {
    setRefreshKey((previous) => previous + 1);
  };

  const openAddForm = () => {
    setError("");
    setSuccess("");
    setEditingId(null);
    setForm({ ...emptyForm });
    setEditorOpen(true);
  };

  const openEditForm = (book) => {
    setError("");
    setSuccess("");
    setEditingId(book._id);

    setForm({
      title: book.title || "",
      author: book.author || "",
      category: book.category || "",
      totalCopies: String(book.totalCopies ?? 1),
    });

    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (saving) return;

    setEditorOpen(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (busy || !library || !canManage) return;

    setError("");
    setSuccess("");

    if (!form.title.trim() || !form.author.trim()) {
      setError("Book title and author are required.");
      return;
    }

    const copies = Number(form.totalCopies);

    if (
      !editingId &&
      (
        !form.totalCopies.trim() ||
        !Number.isInteger(copies) ||
        copies < 1
      )
    ) {
      setError("Enter at least 1 whole physical copy.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      author: form.author.trim(),
      category: form.category.trim(),
      isEbook: false,
      ebookUrl: "",
    };

    if (!editingId) {
      payload.totalCopies = copies;
    }

    const wasEditing = Boolean(editingId);

    setSaving(true);

    try {
      if (editingId) {
        await api.patch(
          `/admin/books/${editingId}`,
          payload
        );
      } else {
        await api.post("/admin/books", payload);
      }

      setEditorOpen(false);
      setEditingId(null);
      setForm({ ...emptyForm });

      setSuccess(
        wasEditing
          ? "Book details updated successfully."
          : "Book added successfully."
      );

      refreshBooks();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Book could not be saved."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (book) => {
    if (busy || !canManage) return;

    const approved = window.confirm(
      `Permanently delete "${book.title}"?\n\nBooks with issue history cannot be deleted.`
    );

    if (!approved) return;

    setDeletingId(book._id);
    setError("");
    setSuccess("");

    try {
      const { data } = await api.delete(
        `/admin/books/${book._id}`
      );

      setSuccess(
        data.message || "Book deleted successfully."
      );

      refreshBooks();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Book could not be deleted."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="admin-dashboard admin-books-page">
      <aside className="admin-rail">
        <div className="admin-rail-brand">
          <span className="admin-rail-mark">A</span>

          <div>
            <p>ADMIN CONSOLE</p>
            <strong>
              {library?.name || "Library dashboard"}
            </strong>
          </div>
        </div>

        <nav
          className="admin-rail-menu"
          aria-label="Admin navigation"
        >
          <Link to="/admin-dashboard">
            Overview
          </Link>

          <Link
            to="/admin/books"
            className="admin-rail-active"
            aria-current="page"
          >
            Books
          </Link>
        </nav>

        <div className="admin-rail-user">
          <span>OPERATOR</span>
          <strong>
            {user?.name || "Administrator"}
          </strong>
        </div>
      </aside>

      <section className="admin-content">
        <header className="admin-command-header">
          <div>
            <p className="admin-eyebrow">
              LIBRARY OPERATIONS / PHYSICAL BOOKS
            </p>

            <h1>
              Books
              <br />
              <em>catalogue.</em>
            </h1>

            <p className="admin-command-note">
              {library
                ? `Manage physical books belonging to ${library.name}.`
                : "Manage your library catalogue."}
            </p>
          </div>

          <div className="ab-toolbar">
            <button
              type="button"
              className="admin-chip"
              onClick={refreshBooks}
              disabled={loading || busy || !canManage}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>

            <button
              type="button"
              className="ab-primary"
              onClick={openAddForm}
              disabled={loading || busy || !library}
            >
              + Add book
            </button>
          </div>
        </header>

        {error && (
          <p
            className="admin-alert admin-alert-error"
            role="alert"
          >
            {error}
          </p>
        )}

        {success && (
          <p
            className="admin-alert admin-alert-success"
            role="status"
          >
            {success}
          </p>
        )}

        {loading ? (
          <div className="admin-blank">
            <h3>Loading your books...</h3>
            <p>Fetching your library catalogue.</p>
          </div>
        ) : !library ? (
          <div className="admin-blank">
            <h3>Books unavailable</h3>
            <p>Check the error above.</p>
          </div>
        ) : (
          <>
            <section className="admin-stats">
              <article className="admin-stat">
                <span>BOOK RECORDS</span>
                <strong>{books.length}</strong>
                <p>Physical catalogue entries</p>
              </article>

              <article className="admin-stat admin-stat-amber">
                <span>TOTAL COPIES</span>
                <strong>{totalCopies}</strong>
                <p>Copies registered in this library</p>
              </article>

              <article className="admin-stat admin-stat-green">
                <span>AVAILABLE COPIES</span>
                <strong>{availableCopies}</strong>
                <p>Copies currently available</p>
              </article>

              <article className="admin-stat admin-stat-red">
                <span>UNAVAILABLE TITLES</span>
                <strong>{unavailableTitles}</strong>
                <p>Records with zero available copies</p>
              </article>
            </section>

            {editorOpen && (
              <section className="admin-console ab-editor">
                <div className="admin-console-head">
                  <div>
                    <p className="admin-eyebrow">
                      CATALOGUE MANAGEMENT
                    </p>
                    <h2>
                      {editingId
                        ? "Edit book details"
                        : "Add a new book"}
                    </h2>
                  </div>
                </div>

                <form onSubmit={handleSave}>
                  <fieldset disabled={saving}>
                    <div className="ab-form-grid">
                      <label htmlFor="ab-title">
                        Book title
                        <input
                          id="ab-title"
                          name="title"
                          type="text"
                          placeholder="Enter book title"
                          value={form.title}
                          onChange={handleChange}
                          required
                        />
                      </label>

                      <label htmlFor="ab-author">
                        Author
                        <input
                          id="ab-author"
                          name="author"
                          type="text"
                          placeholder="Enter author name"
                          value={form.author}
                          onChange={handleChange}
                          required
                        />
                      </label>

                      <label htmlFor="ab-category">
                        Category
                        <input
                          id="ab-category"
                          name="category"
                          type="text"
                          placeholder="Example: Fiction"
                          value={form.category}
                          onChange={handleChange}
                        />
                      </label>

                      {!editingId && (
                        <label htmlFor="ab-copies">
                          Total copies
                          <input
                            id="ab-copies"
                            name="totalCopies"
                            type="number"
                            min="1"
                            step="1"
                            value={form.totalCopies}
                            onChange={handleChange}
                            required
                          />
                        </label>
                      )}
                    </div>

                    {editingId && (
                      <p className="admin-command-note">
                        Copy counts are read-only in this
                        form to avoid changing issued inventory.
                      </p>
                    )}

                    <div className="ab-toolbar ab-form-actions">
                      <button
                        type="submit"
                        className="ab-primary"
                      >
                        {saving
                          ? "Saving..."
                          : editingId
                            ? "Save changes"
                            : "Add book"}
                      </button>

                      <button
                        type="button"
                        className="admin-chip"
                        onClick={closeEditor}
                      >
                        Cancel
                      </button>
                    </div>
                  </fieldset>
                </form>
              </section>
            )}

            <section
              className="admin-console"
              aria-busy={busy}
            >
              <div className="admin-console-head">
                <div>
                  <p className="admin-eyebrow">
                    YOUR LIBRARY CATALOGUE
                  </p>
                  <h2>Book records</h2>
                </div>

                <div className="admin-search">
                  <input
                    type="search"
                    aria-label="Search books"
                    placeholder="Search title, author or category"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                  />
                </div>
              </div>

              <div
                className="admin-chips"
                aria-label="Filter by category"
              >
                {categories.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={
                      category === item
                        ? "admin-chip admin-chip-active"
                        : "admin-chip"
                    }
                    aria-pressed={category === item}
                    onClick={() => setCategory(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <p className="ab-result-count">
                Showing {visibleBooks.length} of{" "}
                {books.length} book records
              </p>

              {visibleBooks.length === 0 ? (
                <div className="admin-blank">
                  <h3>
                    {books.length === 0
                      ? "Your catalogue is empty."
                      : "No matching books."}
                  </h3>

                  <p>
                    {books.length === 0
                      ? 'Use "Add book" to create your first record.'
                      : "Try another search or category."}
                  </p>
                </div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Book</th>
                        <th>Category</th>
                        <th>Total copies</th>
                        <th>Available</th>
                        <th>Status</th>
                        <th>Manage</th>
                      </tr>
                    </thead>

                    <tbody>
                      {visibleBooks.map((book) => {
                        const isAvailable =
                          book.availableCopies > 0;

                        return (
                          <tr key={book._id}>
                            <td>
                              <div className="admin-book-cell">
                                <strong>{book.title}</strong>
                                <span>by {book.author}</span>
                              </div>
                            </td>

                            <td>
                              {book.category || "General"}
                            </td>

                            <td>{book.totalCopies ?? 0}</td>
                            <td>{book.availableCopies ?? 0}</td>

                            <td>
                              <span
                                className={
                                  isAvailable
                                    ? "admin-status admin-status-ok"
                                    : "admin-status admin-status-off"
                                }
                              >
                                {isAvailable
                                  ? "Available"
                                  : "Unavailable"}
                              </span>
                            </td>

                            <td>
                              <div className="ab-toolbar">
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() =>
                                    openEditForm(book)
                                  }
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  className="ab-delete"
                                  disabled={busy}
                                  onClick={() =>
                                    handleDelete(book)
                                  }
                                >
                                  {deletingId === book._id
                                    ? "Deleting..."
                                    : "Delete"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}