export const login = (user) => {
  localStorage.setItem("user", JSON.stringify(user));
};

export const logout = () => {
  localStorage.removeItem("user");
};

export const getUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const isLoggedIn = () => {
  return !!localStorage.getItem("user");
};

export const getToken = () => {
  return localStorage.getItem("token");
};

export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;

  // Optionally, you can add logic to verify the token's validity
  // For example, check if the token is expired or malformed
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp > Date.now() / 1000; // Check if token is expired
  } catch (e) {
    return false; // Invalid token format
  }
};

export const getUserId = () => {
  const user = getUser();
  return user ? user.id : null;
};
export const getUsername = () => {
  const user = getUser();
  return user ? user.username : null;
};