import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import "./AdminDashboard.css";

const getId = (value) =>
  String(
    value && typeof value === "object"
      ? value._id || value.id || ""
      : value || ""
  );

export default function AdminMember() {
  const { user } = useAuth();
  const userId = user?.id || user?._id;
  const isAdmin = user?.role === "admin";

  const [library, setLibrary] = useState(null);
  const [members, setMembers] = useState([]);
  const [issues, setIssues] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadMembers() {
      setLoading(true);
      setError("");
      setLibrary(null);
      setMembers([]);
      setIssues([]);
      setSelectedId(null);

      if (!userId || !isAdmin) {
        setError("Please sign in with an admin account.");
        setLoading(false);
        return;
      }

      try {
        const [
          libraryResponse,
          membersResponse,
          issuesResponse,
        ] = await Promise.all([
          api.get("/admin/library-books"),
          api.get("/admin/users"),
          api.get("/admin/issued"),
        ]);

        if (ignore) return;

        const ownLibrary = libraryResponse.data?.library;
        const memberData = membersResponse.data;
        const issueData = issuesResponse.data;

        if (
          !ownLibrary?._id ||
          !Array.isArray(memberData) ||
          !Array.isArray(issueData)
        ) {
          throw new Error(
            "Unexpected API response. Check the library-scoped admin routes."
          );
        }

        const containsForeignIssues = issueData.some(
          (issue) =>
            getId(issue.library) !== getId(ownLibrary)
        );

        if (containsForeignIssues) {
          throw new Error(
            "Library mismatch detected. Member records were not displayed."
          );
        }

        setLibrary(ownLibrary);
        setMembers(memberData);
        setIssues(issueData);
      } catch (err) {
        if (ignore) return;

        setError(
          err.response?.data?.message ||
            err.message ||
            "Member records could not be loaded."
        );
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadMembers();

    return () => {
      ignore = true;
    };
  }, [userId, isAdmin, refreshKey]);

  const memberCounts = new Map();

  issues.forEach((issue) => {
    const memberId = getId(issue.user);

    if (!memberId) return;

    const counts = memberCounts.get(memberId) || {
      total: 0,
      issued: 0,
      returned: 0,
    };

    counts.total += 1;

    if (issue.status === "issued") {
      counts.issued += 1;
    }

    if (issue.status === "returned") {
      counts.returned += 1;
    }

    memberCounts.set(memberId, counts);
  });

  const countsFor = (memberId) =>
    memberCounts.get(getId(memberId)) || {
      total: 0,
      issued: 0,
      returned: 0,
    };

  const searchTerm = search.trim().toLowerCase();

  const visibleMembers = members.filter((member) =>
    [
      member.name,
      member.email,
      member.phone,
      member.area,
      member.city,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm)
  );

  const selectedMember = members.find(
    (member) => getId(member) === selectedId
  );

  const selectedHistory = selectedMember
    ? issues.filter(
        (issue) =>
          getId(issue.user) === getId(selectedMember)
      )
    : [];

  const activeMemberIds = new Set(
    members.map((member) => getId(member))
  );

  const activeMemberIssues = issues.filter((issue) =>
    activeMemberIds.has(getId(issue.user))
  );

  const currentlyIssued = activeMemberIssues.filter(
    (issue) => issue.status === "issued"
  ).length;

  const returnedCount = activeMemberIssues.filter(
    (issue) => issue.status === "returned"
  ).length;

  const membersWithIssues = members.filter(
    (member) => countsFor(member).issued > 0
  ).length;

  return (
    <main className="admin-dashboard admin-member-page">
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

          <Link to="/admin/books">
            Books
          </Link>

          <Link
            to="/admin/members"
            className="admin-rail-active"
            aria-current="page"
          >
            Members
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
              LIBRARY OPERATIONS / MEMBER RECORDS
            </p>

            <h1>
              Member
              <br />
              <em>directory.</em>
            </h1>

            <p className="admin-command-note">
              {library
                ? `Active members and their book history at ${library.name}.`
                : "Your library’s member records."}
            </p>
          </div>

          <button
            type="button"
            className="admin-chip"
            disabled={loading || !isAdmin}
            onClick={() =>
              setRefreshKey((previous) => previous + 1)
            }
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </header>

        {error && (
          <p
            className="admin-alert admin-alert-error"
            role="alert"
          >
            {error}
          </p>
        )}

        {loading ? (
          <div className="admin-blank">
            <h3>Loading members...</h3>
            <p>Fetching your library records.</p>
          </div>
        ) : !library ? (
          <div className="admin-blank">
            <h3>Member records unavailable</h3>
            <p>Check the error above.</p>
          </div>
        ) : (
          <>
            <section className="admin-stats">
              <article className="admin-stat">
                <span>ACTIVE MEMBERS</span>
                <strong>{members.length}</strong>
                <p>Currently joined members</p>
              </article>

              <article className="admin-stat admin-stat-green">
                <span>MEMBERS WITH BOOKS</span>
                <strong>{membersWithIssues}</strong>
                <p>Active members with issued books</p>
              </article>

              <article className="admin-stat admin-stat-amber">
                <span>CURRENTLY ISSUED</span>
                <strong>{currentlyIssued}</strong>
                <p>Books issued to active members</p>
              </article>

              <article className="admin-stat admin-stat-red">
                <span>RETURNED RECORDS</span>
                <strong>{returnedCount}</strong>
                <p>Return history of active members</p>
              </article>
            </section>

            <section className="admin-console">
              <div className="admin-console-head">
                <div>
                  <p className="admin-eyebrow">
                    {library.name}
                  </p>
                  <h2>Member records</h2>
                </div>

                <div className="admin-search">
                  <input
                    type="search"
                    placeholder="Search name, email, phone or city"
                    aria-label="Search members"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                  />
                </div>
              </div>

              <p className="am-count">
                Showing {visibleMembers.length} of{" "}
                {members.length} active members
              </p>

              {visibleMembers.length === 0 ? (
                <div className="admin-blank">
                  <h3>No matching members.</h3>
                  <p>
                    Only active memberships are included
                    in this directory.
                  </p>
                </div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Contact</th>
                        <th>Issued</th>
                        <th>Returned</th>
                        <th>Status</th>
                        <th>Details</th>
                      </tr>
                    </thead>

                    <tbody>
                      {visibleMembers.map((member) => {
                        const counts = countsFor(member);

                        return (
                          <tr key={member._id}>
                            <td>
                              <div className="admin-book-cell">
                                <strong>{member.name}</strong>
                                <span>
                                  {member.city ||
                                    member.area ||
                                    "—"}
                                </span>
                              </div>
                            </td>

                            <td>
                              <div className="am-contact">
                                <span>{member.email}</span>
                                <span>
                                  {member.phone || "—"}
                                </span>
                              </div>
                            </td>

                            <td>{counts.issued}</td>
                            <td>{counts.returned}</td>

                            <td>
                              <span className="admin-status admin-status-ok">
                                Active
                              </span>
                            </td>

                            <td>
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedId(getId(member))
                                }
                              >
                                View details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {selectedMember && (
              <section
                className="admin-console am-details"
                aria-labelledby="am-detail-title"
              >
                <div className="admin-console-head">
                  <div>
                    <p className="admin-eyebrow">
                      MEMBER DETAILS
                    </p>
                    <h2 id="am-detail-title">
                      {selectedMember.name}
                    </h2>
                  </div>

                  <button
                    type="button"
                    className="admin-chip"
                    onClick={() => setSelectedId(null)}
                  >
                    Close details
                  </button>
                </div>

                <dl className="am-profile-grid">
                  <div>
                    <dt>Email</dt>
                    <dd>{selectedMember.email || "—"}</dd>
                  </div>

                  <div>
                    <dt>Phone</dt>
                    <dd>{selectedMember.phone || "—"}</dd>
                  </div>

                  <div>
                    <dt>Area / City</dt>
                    <dd>
                      {[
                        selectedMember.area,
                        selectedMember.city,
                        selectedMember.pincode,
                      ]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </dd>
                  </div>

                  <div>
                    <dt>Total issue records</dt>
                    <dd>{selectedHistory.length}</dd>
                  </div>

                  <div>
                    <dt>Fine / payment balance</dt>
                    <dd>Not connected</dd>
                  </div>

                  <div>
                    <dt>Ebook borrowing</dt>
                    <dd>Not connected</dd>
                  </div>
                </dl>

                <h3 className="am-history-title">
                  Book issue / return history
                </h3>

                {selectedHistory.length === 0 ? (
                  <div className="admin-blank">
                    <h3>No issue history.</h3>
                    <p>
                      No book issue records were returned
                      for this member in this library.
                    </p>
                  </div>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Book</th>
                          <th>Author</th>
                          <th>Status</th>
                          <th>Record ID</th>
                        </tr>
                      </thead>

                      <tbody>
                        {selectedHistory.map((issue) => (
                          <tr key={issue._id}>
                            <td>
                              {issue.book?.title ||
                                "Book unavailable"}
                            </td>

                            <td>
                              {issue.book?.author || "—"}
                            </td>

                            <td>
                              <span
                                className={
                                  issue.status === "returned"
                                    ? "admin-status admin-status-ok"
                                    : "admin-status admin-status-off"
                                }
                              >
                                {issue.status || "Unknown"}
                              </span>
                            </td>

                            <td>{issue._id}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </section>

      <style>{`
        .admin-member-page .admin-rail-menu a {
          display: block;
          padding: 12px 14px;
          border: 1px solid transparent;
          border-radius: 5px;
          color: var(--dash-muted);
          font-size: 13px;
          text-decoration: none;
        }

        .admin-member-page .admin-rail-menu a:hover {
          color: var(--dash-cream);
          background: rgba(55, 169, 107, 0.07);
        }

        .admin-member-page .admin-rail-menu a.admin-rail-active {
          border-color: rgba(55, 169, 107, 0.4);
          background: rgba(55, 169, 107, 0.12);
          color: #a7e7bd;
        }

        .admin-member-page .am-count {
          margin: 0 0 18px;
          color: var(--dash-muted);
          font-size: 12px;
        }

        .admin-member-page .am-contact {
          display: grid;
          gap: 6px;
          overflow-wrap: anywhere;
        }

        .admin-member-page .am-contact span:last-child {
          color: var(--dash-muted);
          font-size: 12px;
        }

        .admin-member-page .am-details {
          margin-top: 22px;
        }

        .admin-member-page .am-profile-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin: 0 0 26px;
        }

        .admin-member-page .am-profile-grid > div {
          min-width: 0;
          padding: 18px;
          border: 1px solid var(--dash-line);
          border-radius: 6px;
          background: #141a20;
        }

        .admin-member-page .am-profile-grid dt {
          margin-bottom: 10px;
          color: var(--dash-muted);
          font-size: 11px;
        }

        .admin-member-page .am-profile-grid dd {
          margin: 0;
          color: var(--dash-cream);
          font-size: 13px;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .admin-member-page .am-history-title {
          margin: 0 0 18px;
          font-family: Georgia, serif;
          font-size: 24px;
          font-weight: 400;
        }

        .admin-member-page button:focus-visible,
        .admin-member-page a:focus-visible {
          outline: 2px solid var(--dash-amber);
          outline-offset: 3px;
        }

        @media (max-width: 900px) {
          .admin-member-page .am-profile-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 620px) {
          .admin-member-page .am-profile-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}