import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./Home.css";


const chapters = [
  {
    number: "01",
    title: "Discover your corner",
    text: "Find a library. Find your place.",
    route: "/nearby-libraries"
  },
  {
    number: "02",
    title: "Follow your curiosity",
    text: "Explore books beyond your usual shelf.",
    route: "/books"
  },
  {
    number: "03",
    title: "Begin a new chapter",
    text: "Make room for a little more reading.",
    route: "/register"
  }
];


export default function Home() {
  const { user, loading } = useAuth();

  const chapters = [
    {
      number: "01",
      title: "Discover your corner",
      text: "Find a library. Find your place.",
      route: "/nearby-libraries"
    },
    {
      number: "02",
      title: "Follow your curiosity",
      text: "Explore books beyond your usual shelf.",
      route: "/books"
    },
    {
      number: "03",
      title: user ? "Continue your reading journey" : "Begin a new chapter",
      text: user
        ? "Explore your library membership."
        : "Make room for a little more reading.",
      route: user ? "/my-memberships" : "/register"
    }
  ];

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#101712",
          color: "#f1e5cf"
        }}
      >
        <p>Loading your reading room…</p>
      </main>
    );
  }

  return (
    <main className="literary-home">
      <section className="literary-stage" aria-labelledby="home-title">
        {/* Decorative visual */}
        <div className="literary-art" aria-hidden="true">
          <div className="literary-halo" />


          <div className="literary-orbit literary-orbit-one" />
          <div className="literary-orbit literary-orbit-two" />


          <div className="literary-book literary-book-back">
            <span>THE ART OF</span>
            <strong>Wonder</strong>
            <small>A READER’S COLLECTION</small>
          </div>


          <div className="literary-book literary-book-front">
            <span>BETWEEN THE PAGES</span>
            <div className="literary-cover-mark">✦</div>
            <strong>
              A world
              <br />
              within.
            </strong>
            <small>STORIES WORTH GETTING LOST IN</small>
          </div>


          <span className="literary-spark literary-spark-one">✦</span>
          <span className="literary-spark literary-spark-two">✧</span>
          <span className="literary-spark literary-spark-three">✦</span>
        </div>


        <div className="literary-topline">
          <span className="literary-label">
            YOUR NEIGHBOURHOOD.
            <br />
            A THOUSAND NEW WORLDS.
          </span>


          <span className="literary-edition">
            THE READING EDITION — VOL. 01
          </span>
        </div>


        <div className="literary-copy">
          <p className="literary-eyebrow">
            A SPACE FOR CURIOUS MINDS
          </p>


          <h1 id="home-title" className="home-brand-title">
            LIBRI
            <span>FOLIO</span>
          </h1>

          <p className="home-brand-tagline">
            Every story, <em>one shelf away.</em>
          </p>


          <p className="literary-description">
            Some journeys begin with a single page.
            Discover nearby libraries and find the
            stories that stay with you.
          </p>
          </div>

          <div className="literary-actions">
            <Link
              to="/nearby-libraries"
              className="literary-explore"
            >
              <span>EXPLORE</span>
              <span aria-hidden="true">↗</span>
            </Link>
            <Link to="/books" className="literary-text-link">
             Browse the shelves <span aria-hidden="true">→</span>
            </Link>

            <Link to="/about" className="literary-text-link">
            About <span aria-hidden="true">→</span>
            </Link>
             </div>


        <div className="literary-side-note" aria-hidden="true">
          STORIES
          <br />
          PEOPLE
          <br />
          PLACES
          <br />
          POSSIBILITIES
        </div>


        <div className="literary-caption">
          <span className="literary-caption-line" />
          <p>
            Less scrolling.
            <br />
            <em>More discovering.</em>
          </p>
        </div>


        <div className="literary-bottom">
          {chapters.map((chapter) => (
            <Link
              key={chapter.number}
              to={chapter.route}
              className="literary-chapter"
            >
              <span className="literary-chapter-number">
                {chapter.number}
              </span>


              <div>
                <h2>{chapter.title}</h2>
                <p>{chapter.text}</p>
              </div>


              <span className="literary-chapter-arrow" aria-hidden="true">
                ↗
              </span>
            </Link>
          ))}


          <div className="literary-bottom-note">
            <span className="literary-status-dot" />
            YOUR NEXT CHAPTER IS NEARBY
          </div>
        </div>
      </section>
    </main>
  );
}