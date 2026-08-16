import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("userData");

    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [loading, setLoading] = useState(false);

  const login = (userData) => {
    localStorage.setItem("userData", JSON.stringify(userData));

    if (userData.token) {
      localStorage.setItem("token", userData.token);
    }

    if (userData.refreshToken) {
      localStorage.setItem("refreshToken", userData.refreshToken);
    }

    const uid = userData.id || userData._id;
    if (uid) {
      localStorage.setItem("userId", uid);
    }

    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userData");
    localStorage.removeItem("userId");

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}