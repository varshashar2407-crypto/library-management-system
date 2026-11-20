import { useEffect, useState } from "react";
import api from "../api/axios.js";
import "./AdminDashboard.css";

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { data } = await api.get("/admin/stats");
        setStats(data);
      } catch (error) {
        setMessage(
          error.response?.data?.message ||
            "Could not load library overview."
        );
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return <p className="admin-loading">Loading library overview…</p>;
  }

  if (message) {
    return <p className="admin-error">{message}</p>;
  }

  if (!stats) {
    return <p className="admin-error">No overview data available.</p>;
  }

  const library = stats.library || {};

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-page-eyebrow">ADMIN OVERVIEW</p>
          <h1>{library.name || "Library Overview"}</h1>
          <p className="admin-page-subtitle">
            Manage and monitor your library.
          </p>
        </div>
      </header>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span>Total Members</span>
          <strong>{stats.totalUsers}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Total Books</span>
          <strong>{stats.totalBooks}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Currently Issued</span>
          <strong>{stats.totalIssued}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Returned Books</span>
          <strong>{stats.totalReturned}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Library Images</span>
          <strong>{stats.totalImages}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Available Books</span>
          <strong>{library.availableBooks ?? 0}</strong>
        </div>
      </div>

      <div className="admin-overview-grid">
        <div className="admin-card">
          <h2>Library Details</h2>

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

        <div className="admin-card">
          <h2>Timings</h2>

          <div className="admin-detail-row">
            <span>Opening Time</span>
            <strong>{library.openingTime || "Not set"}</strong>
          </div>

          <div className="admin-detail-row">
            <span>Closing Time</span>
            <strong>{library.closingTime || "Not set"}</strong>
          </div>

          <h2>Facilities</h2>

          {library.facilities.length ? (
            <ul className="admin-facility-list">
              {library.facilities.map((facility, index) => (
                <li key={index}>{facility}</li>
              ))}
            </ul>
          ) : (
            <p>No facilities added yet.</p>
          )}
        </div>

        <div className="admin-card">
          <h2>Library Images</h2>

          {library.photos.length ? (
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
  );
}