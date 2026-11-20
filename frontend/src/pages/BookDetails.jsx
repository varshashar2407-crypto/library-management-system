import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios.js";
import "./BookDetails.css";

export default function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBook = async () => {
      try {
        const { data } = await api.get(`/books/${id}`);
        setBook(data);
      } catch (error) {
        setBook(null);
      } finally {
        setLoading(false);
      }
    };

    loadBook();
  }, [id]);

  if (loading) {
    return (
      <main className="book-details">
        <p>Loading book details…</p>
      </main>
    );
  }

  if (!book) {
    return (
      <main className="book-details">
        <div className="book-details-empty">
          <h2>Book not found.</h2>
          <button onClick={() => navigate("/books")}>
            Back to books
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="book-details">
      <header className="book-details-header">
        <button onClick={() => navigate("/books")}>
          ← Back
        </button>
      </header>

      <section className="book-details-card">
        <div className="book-details-cover">
          {book.coverImage ? (
            <img src={book.coverImage} alt={book.title} />
          ) : (
            <div className="book-cover-placeholder">
              📚
            </div>
          )}
        </div>

        <div className="book-details-info">
          <h1>{book.title}</h1>
          <p className="book-author">
            by {book.author}
          </p>

          <p className="book-category">
            {book.category || "General"}
          </p>

          <p className="book-description">
            {book.description || "No description available."}
          </p>

          <div className="book-meta">
            <p>
              <strong>Library:</strong>{" "}
              {book.library?.name || "Unavailable"}
            </p>

            <p>
              <strong>Available copies:</strong>{" "}
              {book.availableCopies}
            </p>
          </div>

          {book.isEbook && book.ebookUrl && (
            <button
              onClick={() =>
                navigate(`/ebook/${book._id}`, {
                  state: {
                    ebookUrl: book.ebookUrl,
                    title: book.title
                  }
                })
              }
            >
              Read eBook
            </button>
          )}
        </div>
      </section>
    </main>
  );
}