import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import Home from "./pages/home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import About from "./pages/About.jsx";
import NearbyLibraries from "./pages/NearbyLibraries.jsx";
import Books from "./pages/Books.jsx";
import LibraryBooks from "./pages/LibraryBooks.jsx";
import AddBook from "./pages/AddBook.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import MemberDashboard from "./pages/MemberDashboard.jsx";
import VerifyOtp from "./pages/VerifyOtp.jsx";
import MyEbooks from "./pages/MyEbooks.jsx";
import PremiumEbook from "./pages/PremiumEbook.jsx";
import MyMemberships from "./pages/MyMemberships.jsx";
import MyIssuedBooks from "./pages/MyIssuedBooks.jsx";
import Profile from "./pages/Profile.jsx";
import AdminRegister from "./pages/AdminRegister";
import AdminLogin from "./pages/AdminLogin";
function AppContent() {
  const { user } = useAuth();

  return (
    <>
      <Navbar />

      <Routes>
        {/* Public pages */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/admin-register" element={<AdminRegister />} />
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* Old membership URL redirect */}
        <Route
          path="/membership"
          element={<Navigate to="/my-memberships" replace />}
        />

        {/* Protected pages */}
        <Route
          path="/nearby-libraries"
          element={
            <ProtectedRoute>
              <NearbyLibraries />
            </ProtectedRoute>
          }
        />

        <Route
          path="/books"
          element={
            <ProtectedRoute>
              <Books />
            </ProtectedRoute>
          }
        />

        <Route
          path="/library/:libraryId/books"
          element={
            <ProtectedRoute>
              <LibraryBooks />
            </ProtectedRoute>
          }
        />

        <Route
          path="/add-book"
          element={
            <ProtectedRoute>
              <AddBook />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/member-dashboard"
          element={
            <ProtectedRoute>
              <MemberDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-ebooks"
          element={
            <ProtectedRoute>
              <MyEbooks />
            </ProtectedRoute>
          }
        />

        <Route
          path="/premium-ebooks"
          element={
            <ProtectedRoute>
              <PremiumEbook />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-memberships"
          element={
            <ProtectedRoute>
              <MyMemberships />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-issued-books"
          element={
            <ProtectedRoute>
              <MyIssuedBooks />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        

        {/* 404 fallback */}
        <Route path="*" element={<Home />} />
      </Routes>
    </>
    
  );
} 

export default function App() {
  return <AppContent />;
}