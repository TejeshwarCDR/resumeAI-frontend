import axios from "axios";
import { env } from "./env";

export type ApiErrorCode = "USER_NOT_FOUND" | "INVALID_PASSWORD" | "SERVER_ERROR" | string;

export class ApiError extends Error {
  code: ApiErrorCode;
  status?: number;

  constructor(message: string, code: ApiErrorCode, status?: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export const api = axios.create({
  baseURL: env.API_URL,
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
    const requestUrl = err.config?.url ?? "";
    const status = err.response?.status;
    const isAuthRequest = typeof requestUrl === "string" && requestUrl.startsWith("/auth/");

    if (status === 401 && !isAuthRequest) {
      localStorage.removeItem("sig_token");
      window.location.href = "/login";
    }
    const code =
      err.response?.data?.code ??
      (status && status >= 500 ? "SERVER_ERROR" : undefined) ??
      (!err.response ? "SERVER_ERROR" : undefined) ??
      "SERVER_ERROR";
    const msg =
      err.response?.data?.message ??
      err.response?.data?.error ??
      (!err.response ? "Something went wrong. Please try again later." : undefined) ??
      err.message ??
      "Something went wrong. Please try again later.";
    return Promise.reject(new ApiError(msg, code, status));
  }
);
