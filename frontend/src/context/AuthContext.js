import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  // ✅ SAFE parsing
  const getStoredAuth = () => {
    try {
      const data = localStorage.getItem("auth");
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  };

  const [auth, setAuth] = useState(getStoredAuth);

  const login = (data) => {
    setAuth(data);
    localStorage.setItem("auth", JSON.stringify(data));
    // Store token separately for API interceptor
    if (data.token) {
      localStorage.setItem("token", data.token);
    }
  };

  const logout = () => {
    setAuth(null);
    localStorage.removeItem("auth");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{
        auth,
        isLoggedIn: !!auth,
        user: auth?.user,
        role: auth?.user?.role,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
