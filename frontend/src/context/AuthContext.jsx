import { createContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../api/endpoints";
import { parseError } from "../utils/helpers";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        // Corrupted storage — clear and reset
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const persistSession = (tokenData, userData) => {
    localStorage.setItem("token", tokenData);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(tokenData);
    setUser(userData);
  };

  const login = useCallback(async (credentials) => {
    const response = await authAPI.login(credentials);
    const data = response.data?.data;
    // Backend returns: { accessToken, tokenType, user: { id, email, username, fullName } }
    persistSession(data.accessToken, data.user);
    return data;
  }, []);

  const register = useCallback(async (userData) => {
    const response = await authAPI.register(userData);
    const data = response.data?.data;
    persistSession(data.accessToken, data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    authAPI.logout();
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    const merged = { ...user, ...updatedUser };
    localStorage.setItem("user", JSON.stringify(merged));
    setUser(merged);
  }, [user]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
