import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
  withCredentials: false,
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("sig_token");
  if (token && cfg.headers) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Unwrap the { success: true, data: X } envelope so callers receive X directly
api.interceptors.response.use(
  (res) => {
    if (res.data && typeof res.data === "object" && "success" in res.data && "data" in res.data) {
      res.data = res.data.data;
    }
    return res;
  },
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("sig_token");
      window.location.href = "/login";
    }
    const msg =
      err.response?.data?.message ??
      err.response?.data?.error ??
      err.message ??
      "Something went wrong";
    return Promise.reject(new Error(msg));
  }
);
