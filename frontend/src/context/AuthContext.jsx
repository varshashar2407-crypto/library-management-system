import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    const loadUser = async () => {
      try {
        const { data } = await api.get("/auth/profile");

        setUser(data.user || data);
      } catch {
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = (token, userData) => {
  if (typeof token !== "string" || !userData) {
    throw new Error(
      "Login data is invalid. Expected login(token, user)."
    );
  }

  localStorage.setItem("token", token);
  setUser(userData);
};

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };
const updateUser = (updatedUser) => {
  setUser(updatedUser);
};
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}