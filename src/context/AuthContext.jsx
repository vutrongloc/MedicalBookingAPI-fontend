import { createContext, useContext, useMemo, useState } from "react";
import { userStorage, tokenStorage } from "../utils/storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(userStorage.get());
  const [token, setToken] = useState(tokenStorage.get());

  const login = (nextUser, nextToken) => {
    setUser(nextUser);
    setToken(nextToken);
    userStorage.set(nextUser);
    tokenStorage.set(nextToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    userStorage.clear();
    tokenStorage.clear();
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used inside AuthProvider");
  return ctx;
}
