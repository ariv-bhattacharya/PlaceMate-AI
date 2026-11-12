
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  loginUser,
  registerUser,
  logoutUser,
  getAccessToken,
  getStoredUser,
} from "../services/authService";


export const AuthContext = createContext(null);


export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Restore the saved login session when the app opens.
  useEffect(() => {
    const token = getAccessToken();
    const storedUser = getStoredUser();

    setIsAuthenticated(Boolean(token));
    setUser(storedUser);

    setLoading(false);
  }, []);

  // Login
  const login = useCallback(async (credentials) => {
    const response = await loginUser(credentials);

    const loggedInUser = response.user || getStoredUser();

    setUser(loggedInUser);
    setIsAuthenticated(true);

    return response;
  }, []);

  // Register
  const register = useCallback(async (userData) => {
    return await registerUser(userData);
  }, []);

  // Logout
  const logout = useCallback(() => {
    logoutUser();

    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated,
      login,
      register,
      logout,
      setUser,
    }),
    [
      user,
      loading,
      isAuthenticated,
      login,
      register,
      logout,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
