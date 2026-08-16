import axios from "axios";

export const BASE_URL = import.meta.env.VITE_BASE_URL || "https://buddycode-fie8.onrender.com";

axios.defaults.withCredentials = true;

// Automatic 401 Refresh Token Interceptor
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !originalRequest.url?.includes("/refresh-Token") && !originalRequest.url?.includes("/login")) {
      originalRequest._retry = true;
      try {
        const storedRefreshToken = localStorage.getItem("refreshToken");
        const res = await axios.post(
          `${BASE_URL}/refresh-Token`,
          { refreshToken: storedRefreshToken },
          { headers: { "x-refresh-token": storedRefreshToken || "" } }
        );
        if (res.data?.accessToken) {
          const newAccessToken = res.data.accessToken;
          localStorage.setItem("token", newAccessToken);
          axios.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
          return axios(originalRequest);
        }
      } catch (refreshErr) {
        console.warn("Refresh token expired or invalid:", refreshErr);
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userData");
        localStorage.removeItem("userId");
        if (window.location.pathname !== "/login" && window.location.pathname !== "/" && window.location.pathname !== "/register") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);