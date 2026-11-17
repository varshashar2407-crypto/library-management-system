import { Link } from "react-router-dom";
import "./About.css";

const values = [
  {
    number: "01",
    title: "Local access",
    text: "We help readers discover nearby libraries and make physical books easier to find."
  },
  {
    number: "02",
    title: "Shared knowledge",
    text: "Libraries are community spaces. LibriFolio brings their collections closer to the people who need them."
  },
  {
    number: "03",
    title: "Simple discovery",
    text: "Search by title, author or category, check availability, and begin your next read without friction."
  }
];

export default function About() {
  return (
    <main className="about-page">
      <section className="about-hero" aria-labelledby="about-title">
        <div className="about-hero-inner">
          <p className="about-eyebrow">
            ABOUT LIBRIFOLIO
          </p>

          <h1 id="about-title">
            A library guide for
            <br />
            <em>curious readers.</em>
          </h1>

          <p className="about-intro">
            LibriFolio connects readers with nearby libraries, helps
            them explore catalogues, and makes it simpler to find,
            reserve and enjoy books.
          </p>

          <div className="about-actions">
            <Link to="/books" className="about-primary-link">
              Browse the catalogue
              <span aria-hidden="true">→</span>
            </Link>

            <Link to="/nearby-libraries" className="about-secondary-link">
              Find nearby libraries
            </Link>
          </div>
        </div>

        <div className="about-art" aria-hidden="true">
          <div className="about-ring" />
          <span className="about-star">✦</span>

          <div className="about-book-card">
            <span>OUR PURPOSE</span>
            <strong>
              Every reader,
              <br />
              every shelf.
            </strong>
            <small>LIBRIFOLIO</small>
          </div>
        </div>
      </section>

      <section className="about-story" aria-labelledby="about-story-title">
        <div className="about-section-head">
          <p className="about-eyebrow">WHY WE EXIST</p>
          <h2 id="about-story-title">
            Built around readers,
            <br />
            libraries and discovery.
          </h2>
        </div>

        <div className="about-story-grid">
          <p>
            LibriFolio began with a simple idea: finding a good book
            should not be difficult. Many readers want to visit a
            library, browse its collection, or check whether a title is
            available—but do not know where to begin.
          </p>

          <p>
            Our platform brings library catalogues into one accessible
            experience. Readers can search for books, view availability,
            explore categories and connect with nearby libraries.
          </p>

          <p>
            Whether you are looking for academic material, fiction,
            history, science or a quiet new interest, LibriFolio helps
            you take the next step from curiosity to reading.
          </p>
        </div>
      </section>

      <section className="about-values" aria-labelledby="about-values-title">
        <div className="about-section-head">
          <p className="about-eyebrow">WHAT GUIDES US</p>
          <h2 id="about-values-title">
            Three simple principles.
          </h2>
        </div>

        <div className="about-values-grid">
          {values.map((value) => (
            <article className="about-value" key={value.number}>
              <span className="about-value-number">
                {value.number}
              </span>

              <div>
                <h3>{value.title}</h3>
                <p>{value.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="about-cta" aria-labelledby="about-cta-title">
        <div className="about-cta-card">
          <div>
            <p className="about-eyebrow">START TODAY</p>
            <h2 id="about-cta-title">
              Your next chapter
              <br />
              <em>is nearby.</em>
            </h2>
          </div>

          <div className="about-cta-actions">
            <Link to="/register" className="about-primary-link">
              Create an account
            </Link>

            <Link to="/books" className="about-secondary-link">
              Explore books
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}