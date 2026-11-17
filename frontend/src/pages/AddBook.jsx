import { useState } from "react";
import api from "../api/axios.js";
import "./AddBook.css";

export default function AddBook() {
  const [form, setForm] = useState({
    title: "",
    author: "",
    category: "",
    description: ""
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitting(true);
    setMessage("");
    setMessageType("");

    try {
      await api.post("/books", form);

      setMessage("Book added successfully to the catalogue.");
      setMessageType("success");

      setForm({
        title: "",
        author: "",
        category: "",
        description: ""
      });
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to add book. Please check the details and try again."
      );
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="admin-book-page">
      <aside className="admin-side-panel">
        <div className="admin-brand">
          <span className="admin-brand-mark">A</span>
          <div>
            <p>ADMIN CONSOLE</p>
            <strong>Book Control</strong>
          </div>
        </div>

        <div className="admin-side-block">
          <span>ACCESS LEVEL</span>
          <p>Administrator</p>
        </div>

        <div className="admin-side-block">
          <span>MODULE</span>
          <p>Catalogue Management</p>
        </div>

        <div className="admin-side-note">
          <span aria-hidden="true">✦</span>
          <p>
            Add verified book details only. This record will appear
            in the library catalogue.
          </p>
        </div>
      </aside>

      <section className="admin-book-main">
        <header className="admin-page-header">
          <div>
            <p className="admin-eyebrow">
              CATALOGUE / NEW ENTRY
            </p>

            <h1>Add a book</h1>

            <p className="admin-header-note">
              Enter the book details below to register it in the
              library system.
            </p>
          </div>

          <div className="admin-header-badge">
            <span>STATUS</span>
            <strong>Ready</strong>
          </div>
        </header>

        {message && (
          <p
            className={`admin-message admin-message-${messageType}`}
            role={messageType === "error" ? "alert" : "status"}
          >
            {message}
          </p>
        )}

        <form
          className="admin-book-form"
          onSubmit={handleSubmit}
        >
          <div className="admin-form-head">
            <div>
              <p className="admin-eyebrow">BOOK RECORD</p>
              <h2>New catalogue entry</h2>
            </div>

            <span className="admin-form-id">FORM · 01</span>
          </div>

          <div className="admin-field-grid">
            <label className="admin-field">
              <span>Book title *</span>
              <input
                name="title"
                placeholder="Enter the book title"
                value={form.title}
                onChange={handleChange}
                required
              />
            </label>

            <label className="admin-field">
              <span>Author *</span>
              <input
                name="author"
                placeholder="Enter the author name"
                value={form.author}
                onChange={handleChange}
                required
              />
            </label>

            <label className="admin-field admin-field-full">
              <span>Category</span>
              <input
                name="category"
                placeholder="Fiction, History, Science, etc."
                value={form.category}
                onChange={handleChange}
              />
            </label>

            <label className="admin-field admin-field-full">
              <span>Description</span>
              <textarea
                name="description"
                placeholder="Write a short description of the book"
                value={form.description}
                onChange={handleChange}
                rows="5"
              />
            </label>
          </div>

          <div className="admin-form-footer">
            <p>
              Fields marked with <strong>*</strong> are required.
            </p>

            <button
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Saving…" : "Add book"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}