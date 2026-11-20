import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import "./AdminDashboard.css";

const tabs = [
  "Overview",
  "Books",
  "Ebooks",
  "Requests",
  "Members",
  "Issues",
  "Reports",
];

const emptyForm = {
  title: "",
  author: "",
  category: "",
  totalCopies: "1",
  ebookUrl: "",
};

const getId = (value) =>
  String(
    value && typeof value === "object"
      ? value._id || value.id || ""
      : value || ""
  );

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id || user?._id;

  const [tab, setTab] = useState("Overview");
  const [library, setLibrary] = useState(null);
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [issues, setIssues] = useState([]);
  const [requests, setRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({ ...emptyForm });
  const [editor, setEditor] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError("");
      setLibrary(null);
      setBooks([]);
      setMembers([]);
      setIssues([]);
      setRequests([]);

      if (!userId) {
        setError("Please sign in with your admin account.");
        setLoading(false);
        return;
      }

      try {
        const [
          catalogue,
          memberResponse,
          issueResponse,
          requestResponse,
        ] = await Promise.all([
          api.get("/admin/library-books"),
          api.get("/admin/users"),
          api.get("/admin/issued"),
          api.get("/issues/requests"),
        ]);

        if (ignore) return;

        const data = catalogue.data;

        if (
          !data?.library?._id ||
          !Array.isArray(data.books) ||
          !Array.isArray(memberResponse.data) ||
          !Array.isArray(issueResponse.data) ||
          !Array.isArray(requestResponse.data)
        ) {
          throw new Error(
            "Unexpected API response. Check the updated adminRoutes.js."
          );
        }

        const libraryId = getId(data.library);

        if (
          data.books.some(
            (book) => getId(book.library) !== libraryId
          ) ||
          issueResponse.data.some(
            (issue) => getId(issue.library) !== libraryId
          )
        ) {
          throw new Error(
            "Library mismatch detected. Records were not displayed."
          );
        }

        setLibrary(data.library);
        setBooks(data.books);
        setMembers(memberResponse.data);
        setIssues(issueResponse.data);
        setRequests(requestResponse.data);
      } catch (err) {
        if (!ignore) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Dashboard could not be loaded."
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [userId, refreshKey]);

  const refresh = () => setRefreshKey((value) => value + 1);

  const changeTab = (nextTab) => {
    if (saving) return;

    setTab(nextTab);
    setSearch("");
    setEditor(null);
    setSelectedMember(null);
    setMessage("");
  };

  const matches = (...values) =>
    values
      .filter((value) => value !== null && value !== undefined)
      .join(" ")
      .toLowerCase()
      .includes(search.trim().toLowerCase());

  const ebookMode = tab === "Ebooks";
  const physicalBooks = books.filter((book) => !book.isEbook);
  const ebooks = books.filter((book) => book.isEbook);
  const activeIssues = issues.filter(
    (issue) => issue.status === "issued"
  );
  const returnedIssues = issues.filter(
    (issue) => issue.status === "returned"
  );

  const visibleBooks = books.filter(
    (book) =>
      Boolean(book.isEbook) === ebookMode &&
      matches(book.title, book.author, book.category)
  );

  const visibleMembers = members.filter((member) =>
    matches(member.name, member.email, member.phone)
  );

  const visibleIssues = issues.filter((issue) =>
    matches(
      issue.book?.title,
      issue.user?.name,
      issue.user?.email,
      issue.status
    )
  );

  const visibleRequests = requests.filter((request) =>
    matches(
      request.book?.title,
      request.user?.name,
      request.user?.email,
      request.status
    )
  );

  const memberHistory = selectedMember
    ? issues.filter(
        (issue) =>
          getId(issue.user) === getId(selectedMember)
      )
    : [];

  const openEditor = (book = null) => {
    setMessage("");
    setError("");

    setEditor({ id: book?._id || null });

    setForm(
      book
        ? {
            title: book.title || "",
            author: book.author || "",
            category: book.category || "",
            totalCopies: String(book.totalCopies ?? 1),
            ebookUrl: book.ebookUrl || "",
          }
        : { ...emptyForm }
    );
  };

  const saveBook = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const payload = {
      title: form.title.trim(),
      author: form.author.trim(),
      category: form.category.trim(),
      isEbook: ebookMode,
      ebookUrl: ebookMode ? form.ebookUrl.trim() : "",
    };

    if (!editor.id) {
      payload.totalCopies = ebookMode
        ? 0
        : Number(form.totalCopies);
    }

    try {
      if (editor.id) {
        await api.patch(
          `/admin/books/${editor.id}`,
          payload
        );
      } else {
        await api.post("/admin/books", payload);
      }

      setEditor(null);
      setMessage("Catalogue saved successfully.");
      refresh();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Book could not be saved."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteBook = async (book) => {
    const approved = window.confirm(
      `Permanently delete "${book.title}"? Books with issue history cannot be deleted.`
    );

    if (!approved) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await api.delete(`/admin/books/${book._id}`);
      setMessage("Catalogue entry deleted.");
      refresh();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Book could not be deleted."
      );
    } finally {
      setSaving(false);
    }
  };

  const approveRequest = async (requestId) => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const { data } = await api.patch(
        `/issues/${requestId}/approve`
      );

      setMessage(
        data.message || "Issue request approved successfully."
      );
      refresh();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not approve this request."
      );
    } finally {
      setSaving(false);
    }
  };

  const rejectRequest = async (requestId) => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const { data } = await api.patch(
        `/issues/${requestId}/reject`
      );

      setMessage(
        data.message || "Issue request rejected successfully."
      );
      refresh();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not reject this request."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (saving) return;

    try {
      await logout();
      navigate("/admin-login", { replace: true });
    } catch {
      setError("Logout failed. Please try again.");
    }
  };

  const renderIssueTable = (records) =>
    records.length === 0 ? (
      <div className="admin-blank">
        <h3>No issue records found.</h3>
      </div>
    ) : (
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Book</th>
              <th>Member</th>
              <th>Email</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {records.map((issue) => (
              <tr key={issue._id}>
                <td>
                  {issue.book?.title || "Book unavailable"}
                </td>
                <td>{issue.user?.name || "—"}</td>
                <td>{issue.user?.email || "—"}</td>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

  const summary = [
    ["Physical book records", physicalBooks.length],
    ["Ebook records", ebooks.length],
    [
      "Physical copies",
      physicalBooks.reduce(
        (sum, book) => sum + (book.totalCopies || 0),
        0
      ),
    ],
    [
      "Available physical copies",
      physicalBooks.reduce(
        (sum, book) => sum + (book.availableCopies || 0),
        0
      ),
    ],
    ["Active members", members.length],
    ["Pending requests", requests.length],
    ["Currently issued", activeIssues.length],
    ["Returned records", returnedIssues.length],
  ];

  return (
    <main className="admin-dashboard">
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
          {tabs.map((item) => (
            <button
              key={item}
              type="button"
              disabled={saving}
              className={
                tab === item ? "admin-rail-active" : ""
              }
              aria-current={
                tab === item ? "page" : undefined
              }
              onClick={() => changeTab(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="admin-rail-user">
          <span>OPERATOR</span>
          <strong>
            {user?.name || "Administrator"}
          </strong>

          <button
            type="button"
            className="admin-chip admin-logout"
            disabled={saving}
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </aside>

      <section className="admin-content">
        <header className="admin-command-header">
          <div>
            <p className="admin-eyebrow">
              {library?.name || "LIBRARY OPERATIONS"}
            </p>
            <h1>{tab}</h1>
            <p className="admin-command-note">
              Manage your assigned library from one place.
            </p>
          </div>

          <button
            type="button"
            className="admin-chip"
            disabled={loading || saving}
            onClick={refresh}
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

        {message && (
          <p
            className="admin-alert admin-alert-success"
            role="status"
          >
            {message}
          </p>
        )}

        {loading ? (
          <div className="admin-blank">
            <h3>Loading library records...</h3>
          </div>
        ) : !library ? (
          <div className="admin-blank">
            <h3>Dashboard unavailable</h3>
            <p>Check the error above.</p>
          </div>
        ) : (
          <>
            {tab === "Overview" && (
              <>
                <section className="admin-stats">
                  <article className="admin-stat">
                    <span>TOTAL MEMBERS</span>
                    <strong>{members.length}</strong>
                    <p>Active members in your library</p>
                  </article>

                  <article className="admin-stat">
                    <span>PENDING REQUESTS</span>
                    <strong>{requests.length}</strong>
                    <p>Books waiting for approval</p>
                  </article>

                  <article className="admin-stat">
                    <span>PHYSICAL BOOKS</span>
                    <strong>{physicalBooks.length}</strong>
                    <p>Physical catalogue records</p>
                  </article>

                  <article className="admin-stat">
                    <span>EBOOKS</span>
                    <strong>{ebooks.length}</strong>
                    <p>Digital catalogue records</p>
                  </article>

                  <article className="admin-stat">
                    <span>CURRENTLY ISSUED</span>
                    <strong>{activeIssues.length}</strong>
                    <p>Books currently issued</p>
                  </article>

                  <article className="admin-stat">
                    <span>RETURNED RECORDS</span>
                    <strong>{returnedIssues.length}</strong>
                    <p>Completed return records</p>
                  </article>
                </section>

                <section className="admin-console">
                  <div className="admin-console-head">
                    <div>
                      <p className="admin-eyebrow">
                        LIBRARY PROFILE
                      </p>
                      <h2>{library.name}</h2>
                    </div>
                  </div>

                  <div className="admin-overview-grid">
                    <div className="admin-overview-card">
                      <h3>Library Details</h3>

                      <div className="admin-detail-row">
                        <span>Library ID</span>
                        <strong>{library._id}</strong>
                      </div>

                      <div className="admin-detail-row">
                        <span>Address</span>
                        <strong>{library.address || "Not added"}</strong>
                      </div>

                      <div className="admin-detail-row">
                        <span>Area</span>
                        <strong>{library.area || "Not added"}</strong>
                      </div>

                      <div className="admin-detail-row">
                        <span>City</span>
                        <strong>{library.city || "Not added"}</strong>
                      </div>

                      <div className="admin-detail-row">
                        <span>Pincode</span>
                        <strong>{library.pincode || "Not added"}</strong>
                      </div>

                      <div className="admin-detail-row">
                        <span>Contact</span>
                        <strong>{library.contact || "Not added"}</strong>
                      </div>

                      <div className="admin-detail-row">
                        <span>Email</span>
                        <strong>{library.email || "Not added"}</strong>
                      </div>
                    </div>

                    <div className="admin-overview-card">
                      <h3>Timings</h3>

                      <div className="admin-detail-row">
                        <span>Opening Time</span>
                        <strong>{library.openingTime || "Not set"}</strong>
                      </div>

                      <div className="admin-detail-row">
                        <span>Closing Time</span>
                        <strong>{library.closingTime || "Not set"}</strong>
                      </div>

                      <h3>Facilities</h3>

                      {library.facilities?.length ? (
                        <ul className="admin-facility-list">
                          {library.facilities.map((facility, index) => (
                            <li key={index}>{facility}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>No facilities added yet.</p>
                      )}
                    </div>

                    <div className="admin-overview-card">
                      <h3>Library Images</h3>

                      {library.photos?.length ? (
                        <div className="admin-image-grid">
                          {library.photos.map((photo, index) => (
                            <img
                              key={index}
                              src={photo.url}
                              alt={photo.caption || `Library image ${index + 1}`}
                              className="admin-library-image"
                            />
                          ))}
                        </div>
                      ) : (
                        <p>No images added yet.</p>
                      )}
                    </div>
                  </div>
                </section>
              </>
            )}

            {tab !== "Overview" && (
              <section className="admin-console">
                <div className="admin-console-head">
                  <div>
                    <p className="admin-eyebrow">
                      {library.name}
                    </p>
                    <h2>{tab} records</h2>
                  </div>

                  {tab !== "Reports" && (
                    <div className="admin-search">
                      <input
                        type="search"
                        aria-label={`Search ${tab}`}
                        placeholder={`Search ${tab.toLowerCase()}...`}
                        value={search}
                        onChange={(event) =>
                          setSearch(event.target.value)
                        }
                      />
                    </div>
                  )}
                </div>

                {tab === "Requests" && (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Book</th>
                          <th>Member</th>
                          <th>Email</th>
                          <th>Requested on</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {visibleRequests.map((request) => (
                          <tr key={request._id}>
                            <td>
                              <strong>
                                {request.book?.title ||
                                  "Book unavailable"}
                              </strong>
                              <br />
                              <span>
                                by {request.book?.author || "—"}
                              </span>
                            </td>

                            <td>
                              {request.user?.name || "—"}
                            </td>

                            <td>
                              {request.user?.email || "—"}
                            </td>

                            <td>
                              {request.createdAt
                                ? new Date(
                                    request.createdAt
                                  ).toLocaleString()
                                : "—"}
                            </td>

                            <td>
                              <div className="admin-actions">
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() =>
                                    approveRequest(request._id)
                                  }
                                >
                                  {saving
                                    ? "Approving..."
                                    : "Approve"}
                                </button>

                                <button
                                  type="button"
                                  className="admin-danger"
                                  disabled={saving}
                                  onClick={() =>
                                    rejectRequest(request._id)
                                  }
                                >
                                  {saving
                                    ? "Rejecting..."
                                    : "Reject"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}

                        {visibleRequests.length === 0 && (
                          <tr>
                            <td colSpan={5}>
                              No pending issue requests.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {(tab === "Books" || tab === "Ebooks") && (
                  <>
                    <div className="admin-chips">
                      <button
                        type="button"
                        className="admin-chip admin-chip-active"
                        disabled={saving}
                        onClick={() => openEditor()}
                      >
                        + Add {ebookMode ? "ebook" : "book"}
                      </button>
                    </div>

                    {editor && (
                      <form
                        className="admin-editor"
                        onSubmit={saveBook}
                      >
                        <h3>
                          {editor.id ? "Edit" : "Add"}{" "}
                          {ebookMode ? "ebook" : "book"}
                        </h3>

                        <div className="admin-form-grid">
                          {[
                            ["title", "Title"],
                            ["author", "Author"],
                            ["category", "Category"],
                          ].map(([name, label]) => (
                            <label key={name}>
                              {label}
                              <input
                                name={name}
                                value={form[name]}
                                required={name !== "category"}
                                disabled={saving}
                                onChange={(event) =>
                                  setForm((previous) => ({
                                    ...previous,
                                    [name]: event.target.value,
                                  }))
                                }
                              />
                            </label>
                          ))}

                          {ebookMode ? (
                            <label>
                              HTTPS ebook link
                              <input
                                type="url"
                                required
                                placeholder="https://..."
                                value={form.ebookUrl}
                                disabled={saving}
                                onChange={(event) =>
                                  setForm((previous) => ({
                                    ...previous,
                                    ebookUrl: event.target.value,
                                  }))
                                }
                              />
                            </label>
                          ) : !editor.id ? (
                            <label>
                              Total copies
                              <input
                                type="number"
                                min="1"
                                step="1"
                                required
                                value={form.totalCopies}
                                disabled={saving}
                                onChange={(event) =>
                                  setForm((previous) => ({
                                    ...previous,
                                    totalCopies: event.target.value,
                                  }))
                                }
                              />
                            </label>
                          ) : null}
                        </div>

                        {editor.id && !ebookMode && (
                          <p className="admin-command-note">
                            Copy counts are read-only here to
                            avoid changing issued inventory.
                          </p>
                        )}

                        <div className="admin-actions">
                          <button
                            type="submit"
                            className="admin-chip admin-chip-active"
                            disabled={saving}
                          >
                            {saving ? "Saving..." : "Save"}
                          </button>

                          <button
                            type="button"
                            className="admin-chip"
                            disabled={saving}
                            onClick={() => setEditor(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Book</th>
                            <th>Category</th>
                            {!ebookMode && <th>Total</th>}
                            {!ebookMode && <th>Available</th>}
                            <th>Manage</th>
                          </tr>
                        </thead>

                        <tbody>
                          {visibleBooks.map((book) => (
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
                              {!ebookMode && (
                                <td>{book.totalCopies}</td>
                              )}
                              {!ebookMode && (
                                <td>{book.availableCopies}</td>
                              )}
                              <td>
                                <div className="admin-actions">
                                  <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() =>
                                      openEditor(book)
                                    }
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    className="admin-danger"
                                    disabled={saving}
                                    onClick={() =>
                                      deleteBook(book)
                                    }
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}

                          {visibleBooks.length === 0 && (
                            <tr>
                              <td
                                colSpan={ebookMode ? 3 : 5}
                              >
                                No matching records found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {tab === "Members" && (
                  <>
                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Member</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Active issues</th>
                            <th>Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleMembers.map((member) => (
                            <tr key={member._id}>
                              <td>{member.name}</td>
                              <td>{member.email}</td>
                              <td>{member.phone || "—"}</td>
                              <td>
                                {
                                  activeIssues.filter(
                                    (issue) =>
                                      getId(issue.user) ===
                                      getId(member)
                                  ).length
                                }
                              </td>
                              <td>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedMember(member)
                                  }
                                >
                                  View history
                                </button>
                              </td>
                            </tr>
                          ))}

                          {visibleMembers.length === 0 && (
                            <tr>
                              <td colSpan={5}>
                                No matching active members.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {selectedMember && (
                      <div className="admin-member-detail">
                        <div className="admin-console-head">
                          <h2>
                            {selectedMember.name}'s history
                          </h2>
                          <button
                            type="button"
                            className="admin-chip"
                            onClick={() =>
                              setSelectedMember(null)
                            }
                          >
                            Close
                          </button>
                        </div>

                        {renderIssueTable(memberHistory)}

                        <p className="admin-command-note">
                          Fine/payment and ebook borrowing
                          records are not connected yet.
                        </p>
                      </div>
                    )}
                  </>
                )}

                {tab === "Issues" &&
                  renderIssueTable(visibleIssues)}

                {tab === "Reports" && (
                  <>
                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Library summary</th>
                            <th>Count</th>
                          </tr>
                        </thead>

                        <tbody>
                          {summary.map(([label, value]) => (
                            <tr key={label}>
                              <td>{label}</td>
                              <td>{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <p className="admin-command-note">
                      Fine collected and pending balance
                      require actual fine/payment records.
                    </p>
                  </>
                )}
              </section>
            )}
          </>
        )}
      </section>
    </main>
  );
}