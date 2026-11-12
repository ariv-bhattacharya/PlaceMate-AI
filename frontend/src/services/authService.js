
import { apiPost } from "./api";

const TOKEN_KEY = "access_token";
const USER_KEY = "user";

// Register a new user
export const registerUser = async (userData) => {
  const response = await apiPost("/auth/register", userData);

  return response;
};

// Login an existing user
export const loginUser = async (credentials) => {
  const { email, password } = credentials;

  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  const response = await apiPost("/auth/login", {
    email,
    password,
  });

  if (!response.access_token) {
    throw new Error("Login successful, but access token was not returned.");
  }

  // Save JWT token for authenticated API requests
  localStorage.setItem(TOKEN_KEY, response.access_token);

  // Save user information if the backend provides it
  if (response.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
  }

  return response;
};

// Logout the current user
export const logoutUser = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// Get the stored authentication token
export const getAccessToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

// Check whether the user has a stored token
export const isAuthenticated = () => {
  return Boolean(getAccessToken());
};

// Get stored user information
export const getStoredUser = () => {
  const user = localStorage.getItem(USER_KEY);

  if (!user) return null;

  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
};
