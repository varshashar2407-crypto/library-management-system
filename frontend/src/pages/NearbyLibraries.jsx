import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import "./NearbyLibraries.css";

function LibraryDirections({ library }) {
  if (!library) return null;

  const coordinates = library.location?.coordinates;

  const hasCoordinates =
    Array.isArray(coordinates) &&
    coordinates.length === 2 &&
    coordinates.every(
      (value) =>
        typeof value === "number" && Number.isFinite(value)
    ) &&
    coordinates[0] >= -180 &&
    coordinates[0] <= 180 &&
    coordinates[1] >= -90 &&
    coordinates[1] <= 90;

  const address = [
    library.name,
    library.address,
    library.area,
    library.city,
    library.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  if (!hasCoordinates && !address) return null;

  const destination = hasCoordinates
    ? `${coordinates[1]},${coordinates[0]}`
    : address;

  const directionsUrl =
    "https://www.google.com/maps/dir/?api=1&destination=" +
    encodeURIComponent(destination);

  return (
    <a
      href={directionsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="library-directions-button"
      aria-label={`Get directions to ${library.name || "this library"}`}
    >
      Get directions
    </a>
  );
}

export default function NearbyLibraries() {
    const navigate = useNavigate();
  const [libraries, setLibraries] = useState([]);
  const [joinedIds, setJoinedIds] = useState([]);

  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState(null);
  const [leavingId, setLeavingId] = useState(null);
  const [membershipReady, setMembershipReady] = useState(false);

  const [loadError, setLoadError] = useState("");
  const [membershipError, setMembershipError] = useState("");
  const [notice, setNotice] = useState(null);

  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;

    async function loadLibraries() {
      try {
        const { data } = await api.get("/libraries");

        if (!Array.isArray(data)) {
          throw new Error("Unexpected libraries response");
        }

        if (active) {
          setLibraries(data);
        }
      } catch (error) {
        if (active) {
          setLoadError(
            error.response?.data?.message ||
              "Libraries could not be loaded. Please try again."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    async function loadMemberships() {
      try {
        const { data } = await api.get("/memberships/my");

        if (!Array.isArray(data)) {
          throw new Error("Unexpected memberships response");
        }

        const ids = data
          .map((membership) =>
            typeof membership.library === "string"
              ? membership.library
              : membership.library?._id
          )
          .filter(Boolean);

        if (active) {
          setJoinedIds(ids);
          setMembershipReady(true);
        }
      } catch (error) {
        if (active) {
          setMembershipError(
            error.response?.data?.message ||
              "Membership status could not be loaded. Refresh before joining."
          );
        }
      }
    }

    loadLibraries();
    loadMemberships();

    return () => {
      active = false;
    };
  }, []);

  async function joinLibrary(libraryId) {
    if (
      joiningId ||
      leavingId ||
      !membershipReady ||
      joinedIds.includes(libraryId)
    ) {
      return;
    }

    setJoiningId(libraryId);
    setNotice(null);

    try {
      await api.post(`/memberships/join/${libraryId}`);

      setJoinedIds((previous) => [
        ...new Set([...previous, libraryId])
      ]);

      setNotice({
        type: "success",
        text: "A new chapter begins — library joined successfully!"
      });

      setTimeout(() => {
        navigate(`/library/${libraryId}/books`);
      }, 1500);
    } catch (error) {
      setNotice({
        type: "error",
        text:
          error.response?.data?.message ||
          "Could not join this library. Please try again."
      });
    } finally {
      setJoiningId(null);
    }
  }

  async function leaveLibrary(libraryId) {
    if (joiningId || leavingId) return;

    setLeavingId(libraryId);
    setNotice(null);

    try {
      await api.delete(`/memberships/leave/${libraryId}`);

      setJoinedIds((previous) =>
        previous.filter((id) => id !== libraryId)
      );

      setNotice({
        type: "success",
        text: "You have left this library."
      });
    } catch (error) {
      setNotice({
        type: "error",
        text:
          error.response?.data?.message ||
          "Could not leave this library. Please try again."
      });
    } finally {
      setLeavingId(null);
    }
  }

  const query = search.trim().toLowerCase();

  const filteredLibraries = libraries.filter((library) =>
    [
      library.name,
      library.address,
      library.city,
      library.pincode
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query)
  );

  return (
    <main className="nearby-editorial">
      <header className="nearby-intro">
        <div className="nearby-intro-copy">
          <Link to="/" className="nearby-back">
            ← BACK TO THE READING ROOM
          </Link>

          <p className="nearby-eyebrow">
            THE NEIGHBOURHOOD COLLECTION
          </p>

          <h1>
            Good stories.
            <br />
            <em>Closer</em> to you.
          </h1>

          <p className="nearby-intro-description">
            Find a quiet corner, discover a different shelf, and
            make your next chapter a local one.
          </p>
        </div>

        <div className="nearby-intro-art" aria-hidden="true">
          <div className="nearby-art-ring" />
          <span className="nearby-art-star">✦</span>

          <div className="nearby-art-book nearby-art-book-one">
            <span>DISCOVER</span>
            <strong>
              A place
              <br />
              to belong.
            </strong>
            <small>YOUR LOCAL LIBRARY</small>
          </div>

          <div className="nearby-art-book nearby-art-book-two">
            <span>ONE MORE CHAPTER</span>
          </div>

          <p>Between streets. Between pages.</p>
        </div>
      </header>

      <section
        className="nearby-collection"
        aria-labelledby="nearby-collection-title"
      >
        <div className="nearby-section-heading">
          <div>
            <p className="nearby-eyebrow">EXPLORE THE SHELVES</p>
            <h2 id="nearby-collection-title">
              Find your reading place
            </h2>
          </div>

          <span className="nearby-result-count" aria-live="polite">
            {loading
              ? "DISCOVERING…"
              : `${filteredLibraries.length} ${
                  filteredLibraries.length === 1
                    ? "LIBRARY"
                    : "LIBRARIES"
                }`}
          </span>
        </div>

        <div className="nearby-search-wrap">
          <label htmlFor="nearby-library-search">
            Search the loaded libraries
          </label>

          <div className="nearby-search">
            <span aria-hidden="true">⌕</span>

            <input
              id="nearby-library-search"
              type="search"
              placeholder="Library name, city, area or pincode"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        {membershipError && (
          <p className="nearby-alert nearby-alert-error" role="alert">
            {membershipError}
          </p>
        )}

        {notice && (
          <p
            className={`nearby-alert nearby-alert-${notice.type}`}
            role={notice.type === "error" ? "alert" : "status"}
          >
            {notice.text}
          </p>
        )}

        {loading ? (
          <div className="nearby-empty" role="status">
            <span className="nearby-empty-symbol" aria-hidden="true">
              ✦
            </span>
            <h3>Finding your next chapter…</h3>
            <p>Loading the library collection.</p>
          </div>
        ) : loadError ? (
          <div className="nearby-empty" role="alert">
            <h3>A small pause in the story.</h3>
            <p>{loadError}</p>

            <button
              type="button"
              className="nearby-retry"
              onClick={() => window.location.reload()}
            >
              Try again ↗
            </button>
          </div>
        ) : filteredLibraries.length === 0 ? (
          <div className="nearby-empty">
            <span className="nearby-empty-symbol" aria-hidden="true">
              ✧
            </span>
            <h3>
              {search.trim()
                ? "No matching reading corners."
                : "The shelves are quiet for now."}
            </h3>
            <p>
              {search.trim()
                ? "Try a different library name, city or pincode."
                : "No libraries were returned for this collection."}
            </p>
          </div>
        ) : (
          <div className="nearby-library-grid">
            {filteredLibraries.map((library, index) => {
              const isJoined = joinedIds.includes(library._id);
              const isJoining = joiningId === library._id;
              const isLeaving = leavingId === library._id;

              return (
                <article
                  className="nearby-library-card"
                  key={library._id}
                >
                  <div className="nearby-card-top">
                    <span className="nearby-card-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span
                      className={
                        isJoined
                          ? "nearby-card-tag nearby-card-tag-joined"
                          : "nearby-card-tag"
                      }
                    >
                      {isJoined ? "YOUR LIBRARY" : "EXPLORE"}
                    </span>
                  </div>

                  <div
                    className="nearby-card-illustration"
                    aria-hidden="true"
                  >
                    <span className="nearby-shelf-book" />
                    <span className="nearby-shelf-book" />
                    <span className="nearby-shelf-book" />
                    <span className="nearby-shelf-book" />
                    <span className="nearby-shelf-book" />
                    <span className="nearby-shelf-star">✦</span>
                  </div>

                  <div className="nearby-card-content">
                    <p className="nearby-card-city">
                      {library.city || "LOCAL COLLECTION"}
                    </p>

                    <h3>{library.name}</h3>

                    <p className="nearby-card-address">
                      {library.address}
                      {library.pincode ? ` · ${library.pincode}` : ""}
                    </p>

                    {(library.openingTime || library.closingTime) && (
                      <div className="nearby-card-detail">
                        <span>HOURS</span>
                        <p>
                          {library.openingTime || "—"}
                          {" — "}
                          {library.closingTime || "—"}
                        </p>
                      </div>
                    )}

                    {library.contact && (
                      <div className="nearby-card-detail">
                        <span>CONTACT</span>
                        <p>{library.contact}</p>
                      </div>
                    )}

                    {library.facilities?.length > 0 && (
                      <div className="nearby-facilities">
                        {library.facilities.map(
                          (facility, facilityIndex) => (
                            <span
                              key={`${facility}-${facilityIndex}`}
                            >
                              {facility}
                            </span>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  <div className="nearby-card-actions">
                    <Link
                      to={`/library/${library._id}/books`}
                      className="nearby-view-books"
                    >
                      View books <span aria-hidden="true">↗</span>
                    </Link>
                    <LibraryDirections library={library} />

                    {isJoined ? (
                      <button
                        type="button"
                        className="nearby-leave-button"
                        onClick={() => leaveLibrary(library._id)}
                        disabled={
                          joiningId !== null || leavingId !== null
                        }
                      >
                        {isLeaving ? "Leaving…" : "Leave library"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="nearby-join-button"
                        onClick={() => joinLibrary(library._id)}
                        disabled={
                          joiningId !== null ||
                          leavingId !== null ||
                          !membershipReady
                        }
                      >
                        {isJoining ? "Joining…" : "Join library"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <footer className="nearby-footer">
        <span aria-hidden="true">✦</span>
        <p>A little closer to a world of stories.</p>
        <Link to="/my-memberships">My memberships →</Link>
      </footer>
    </main>
  );
}