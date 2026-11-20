import { useState, useRef, useEffect } from "react";
import {
  Link,
  NavLink,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const navLinks = [
  { label: "Nearby Libraries", to: "/nearby-libraries" },
  { label: "Books", to: "/books" },
  { label: "Ebooks", to: "/my-ebooks" },
  { label: "Membership", to: "/my-memberships" },
  { label: "Issued Books", to: "/my-issued-books" },
];

const adminNavLinks = [
  { label: "Admin Dashboard", to: "/admin-dashboard" },
  { label: "Manage Books", to: "/admin/books" },
  { label: "Overview", to: "/admin/overview" },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const profileRef = useRef(null);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath =
    location.pathname.replace(/\/+$/, "") || "/";

  const isAdminAuthPage = [
    "/admin-register",
    "/admin-login",
  ].includes(currentPath);

  const isAdmin = user?.role === "admin";

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const closeNavigation = () => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setIsProfileOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsProfileOpen(false);
        setIsMenuOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  }, [
    location.pathname,
    user?.id,
    user?._id,
    user?.role,
  ]);

  const handleLogout = async () => {
    await logout();
    closeNavigation();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <header className="librifolio-header">
        <nav
          className="librifolio-navbar"
          aria-label="Main navigation"
        >
          <div className="librifolio-left">
            <Link
              to="/"
              className="librifolio-brand"
              onClick={closeNavigation}
              aria-label="LibriFolio home"
            >
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 6c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V5c-4-1-7-1-10 1Z" />
                <path d="M12 6v15" />
              </svg>

              <span>
                Libri
                <span className="librifolio-brand-accent">
                  folio
                </span>
              </span>
            </Link>

            {!isAdminAuthPage && user && (
              <ul className="librifolio-links">
                {navLinks.map((link) => (
                  <li key={link.to}>
                    <NavLink
                      to={link.to}
                      onClick={closeNavigation}
                      className={({ isActive }) =>
                        isActive
                          ? "librifolio-link is-active"
                          : "librifolio-link"
                      }
                    >
                      {link.label}
                    </NavLink>
                  </li>
                ))}

                {isAdmin &&
                  adminNavLinks.map((link) => (
                    <li key={link.to}>
                      <NavLink
                        to={link.to}
                        onClick={closeNavigation}
                        className={({ isActive }) =>
                          isActive
                            ? "librifolio-link is-active"
                            : "librifolio-link"
                        }
                      >
                        {link.label}
                      </NavLink>
                    </li>
                  ))}
              </ul>
            )}
          </div>

          {!isAdminAuthPage && (
            <>
              <div className="librifolio-right">
                {!user ? (
                  <>
                    <NavLink
                      to="/register"
                      onClick={closeNavigation}
                      className="librifolio-link"
                    >
                      Register
                    </NavLink>

                    <Link
                      to="/admin-login"
                      className="librifolio-admin-login"
                      onClick={closeNavigation}
                    >
                      Admin Login
                    </Link>

                    <Link
                      to="/login"
                      className="librifolio-login"
                      onClick={closeNavigation}
                    >
                      Login
                      <span aria-hidden="true">
                        {" "}
                        →
                      </span>
                    </Link>
                  </>
                ) : (
                  <div
                    className="librifolio-profile"
                    ref={profileRef}
                  >
                    <button
                      type="button"
                      className="librifolio-profile-btn"
                      onClick={() =>
                        setIsProfileOpen(
                          (previous) => !previous
                        )
                      }
                      aria-expanded={isProfileOpen}
                      aria-controls="librifolio-profile-dropdown"
                    >
                      <span className="librifolio-avatar">
                        {user.name?.charAt(0)?.toUpperCase() ||
                          "U"}
                      </span>

                      Profile

                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>

                    {isProfileOpen && (
                      <div
                        id="librifolio-profile-dropdown"
                        className="librifolio-dropdown"
                      >
                        <Link
                          to="/member-dashboard"
                          className="librifolio-dropdown-item"
                          onClick={closeNavigation}
                        >
                          Dashboard
                        </Link>

                        <Link
                          to="/profile"
                          className="librifolio-dropdown-item"
                          onClick={closeNavigation}
                        >
                          Profile
                        </Link>

                        <button
                          type="button"
                          className="librifolio-dropdown-item"
                          onClick={handleLogout}
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="librifolio-menu-toggle"
                aria-label={
                  isMenuOpen
                    ? "Close navigation"
                    : "Open navigation"
                }
                aria-expanded={isMenuOpen}
                aria-controls="librifolio-navigation"
                onClick={() => {
                  setIsMenuOpen(
                    (previous) => !previous
                  );
                  setIsProfileOpen(false);
                }}
              >
                {isMenuOpen ? (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="m6 6 12 12M6 18 18 6" />
                  </svg>
                ) : (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </>
          )}
        </nav>

        {!isAdminAuthPage && (
          <div
            id="librifolio-navigation"
            className={`librifolio-mobile-menu ${
              isMenuOpen ? "is-open" : ""
            }`}
          >
            {user ? (
              <>
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={closeNavigation}
                    className={({ isActive }) =>
                      isActive
                        ? "librifolio-mobile-link is-active"
                        : "librifolio-mobile-link"
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}

                {isAdmin &&
                  adminNavLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={closeNavigation}
                      className={({ isActive }) =>
                        isActive
                          ? "librifolio-mobile-link is-active"
                          : "librifolio-mobile-link"
                      }
                    >
                      {link.label}
                    </NavLink>
                  ))}

                <Link
                  to="/member-dashboard"
                  className="librifolio-mobile-link"
                  onClick={closeNavigation}
                >
                  Dashboard
                </Link>

                <Link
                  to="/profile"
                  className="librifolio-mobile-link"
                  onClick={closeNavigation}
                >
                  Profile
                </Link>

                <button
                  type="button"
                  className="librifolio-mobile-link"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/register"
                  onClick={closeNavigation}
                  className="librifolio-mobile-link"
                >
                  Register
                </NavLink>

                <Link
                  to="/admin-login"
                  onClick={closeNavigation}
                  className="librifolio-mobile-link"
                >
                  Admin Login
                </Link>

                <NavLink
                  to="/login"
                  onClick={closeNavigation}
                  className="librifolio-mobile-link"
                >
                  Login
                </NavLink>
              </>
            )}
          </div>
        )}
      </header>

      <style>{`
        .librifolio-header,
        .librifolio-header * {
          box-sizing: border-box;
        }

        .librifolio-header {
          position: sticky;
          top: 0;
          z-index: 1000;
          width: 100%;
          background: #101a15;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          font-family: Arial, Helvetica, sans-serif;
        }

        .librifolio-navbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          width: 100%;
          max-width: 1300px;
          min-height: 76px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .librifolio-left {
          display: flex;
          align-items: center;
          gap: 32px;
          min-width: 0;
        }

        .librifolio-right {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-shrink: 0;
        }

        .librifolio-brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #f6f7f2;
          text-decoration: none;
          font-size: 24px;
          font-weight: 700;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .librifolio-brand svg,
        .librifolio-brand-accent {
          color: #b9dc99;
        }

        .librifolio-links {
          display: flex;
          align-items: center;
          gap: 22px;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .librifolio-link {
          color: #d5ddd6;
          text-decoration: none;
          font-size: 15px;
          font-weight: 500;
          transition: color 0.2s ease;
          background: none;
          border: none;
          cursor: pointer;
          white-space: nowrap;
        }

        .librifolio-link:hover,
        .librifolio-link.is-active {
          color: #b9dc99;
        }

        .librifolio-admin-login {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 15px;
          border: 1px solid rgba(185, 220, 153, 0.4);
          border-radius: 8px;
          color: #b9dc99;
          background: transparent;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          white-space: nowrap;
        }

        .librifolio-admin-login:hover {
          background: rgba(185, 220, 153, 0.1);
        }

        .librifolio-login {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 8px;
          background: #b9dc99;
          color: #142017;
          text-decoration: none;
          font-size: 14px;
          font-weight: 700;
          white-space: nowrap;
        }

        .librifolio-profile {
          position: relative;
        }

        .librifolio-profile-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          color: #f6f7f2;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .librifolio-avatar {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #b9dc99;
          color: #142017;
          font-size: 13px;
          font-weight: 700;
        }

        .librifolio-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          min-width: 170px;
          padding: 8px;
          background: #16221b;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          box-shadow: 0 16px 30px rgba(0, 0, 0, 0.35);
        }

        .librifolio-dropdown-item {
          display: block;
          width: 100%;
          padding: 10px 12px;
          border: 0;
          border-radius: 6px;
          background: transparent;
          color: #d5ddd6;
          text-align: left;
          text-decoration: none;
          font-family: inherit;
          font-size: 14px;
          cursor: pointer;
        }

        .librifolio-dropdown-item:hover {
          background: rgba(185, 220, 153, 0.12);
          color: #b9dc99;
        }

        .librifolio-menu-toggle {
          display: none;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 8px;
          background: transparent;
          color: #f6f7f2;
          cursor: pointer;
        }

        .librifolio-mobile-menu {
          display: none;
        }

        .librifolio-header a:focus-visible,
        .librifolio-header button:focus-visible {
          outline: 2px solid #b9dc99;
          outline-offset: 4px;
        }

        @media (max-width: 1024px) {
          .librifolio-left .librifolio-links,
          .librifolio-right {
            display: none;
          }

          .librifolio-menu-toggle {
            display: inline-flex;
          }

          .librifolio-mobile-menu {
            display: none;
            flex-direction: column;
            gap: 4px;
            padding: 16px 18px 20px;
            background: #101a15;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }

          .librifolio-mobile-menu.is-open {
            display: flex;
          }

          .librifolio-mobile-link {
            padding: 12px;
            border-radius: 6px;
            color: #d5ddd6;
            text-decoration: none;
            font-family: inherit;
            font-size: 15px;
            background: transparent;
            border: 0;
            text-align: left;
            cursor: pointer;
          }

          .librifolio-mobile-link:hover,
          .librifolio-mobile-link.is-active {
            background: rgba(185, 220, 153, 0.08);
            color: #b9dc99;
          }
        }

        @media (max-width: 480px) {
          .librifolio-navbar {
            min-height: 68px;
            padding: 0 16px;
          }

          .librifolio-brand {
            font-size: 22px;
          }
        }
      `}</style>
    </>
  );
}