// ===== 6. File src/api.ts - Updated với Vite config =====
import axios from "axios";
import createAuthRefreshInterceptor from "axios-auth-refresh";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { config } from "../config/env"

// ===== TẠO INSTANCE AXIOS ===== //
export const api = axios.create({
  baseURL: "/api", // Sử dụng proxy từ vite.config.ts
  timeout: config.apiTimeout,
  headers: {
    Accept: "application/json",
    'Content-Type': 'application/json',
  },
  // withCredentials: true, // Uncomment nếu cần gửi cookie
});

// ===== LOG REQUEST/RESPONSE TRONG DEVELOPMENT ===== //
if (config.isDevelopment) {
  api.interceptors.request.use((config) => {
    console.log('🚀 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      headers: config.headers,
    });
    return config;
  });

  api.interceptors.response.use(
    (response) => {
      console.log('✅ API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
      return response;
    },
    (error) => {
      console.error('❌ API Error:', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.message,
        data: error.response?.data,
      });
      return Promise.reject(error);
    }
  );
}

// ===== TOKEN HANDLING (giữ nguyên code của bạn) ===== //
type AuthStorage = {
  state: {
    access: string;
    refresh: string;
  };
  version: number;
};

const getAccessToken = (): string | null => {
  const directToken = Cookies.get("access_token");
  if (directToken) return directToken;

  const authStr = Cookies.get("auth-storage");
  if (!authStr) return null;
  try {
    const auth: AuthStorage = JSON.parse(decodeURIComponent(authStr));
    return auth?.state?.access || null;
  } catch {
    return null;
  }
};

const getRefreshToken = (): string | null => {
  const directToken = Cookies.get("refresh_token");
  if (directToken) return directToken;

  const authStr = Cookies.get("auth-storage");
  if (!authStr) return null;
  try {
    const auth: AuthStorage = JSON.parse(decodeURIComponent(authStr));
    return auth?.state?.refresh || null;
  } catch {
    return null;
  }
};

const updateAuthStorage = (access: string, refresh: string) => {
  // Sử dụng config.isProduction thay vì process.env.NODE_ENV
  const isSecure = config.isProduction;
  
  Cookies.set("access_token", access, {
    expires: 1 / 96, // 15 phút
    secure: isSecure,
    sameSite: "strict",
    path: "/",
  });

  Cookies.set("refresh_token", refresh, {
    expires: 7, // 7 ngày
    secure: isSecure,
    sameSite: "strict",
    path: "/",
  });

  const auth: AuthStorage = {
    state: { access, refresh },
    version: 0,
  };
  
  Cookies.set("auth-storage", JSON.stringify(auth), {
    expires: 7,
    secure: isSecure,
    sameSite: "strict",
    path: "/",
  });
};

const clearAuthData = () => {
  Cookies.remove("auth-storage", { path: "/" });
  Cookies.remove("access_token", { path: "/" });
  Cookies.remove("refresh_token", { path: "/" });
};

const redirectToLogin = (message: string = "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại!") => {
  toast.error(message);
  setTimeout(() => {
    window.location.href = "/login";
  }, 2000);
};

// ===== INTERCEPTOR: GẮN TOKEN VÀO HEADER ===== //
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ===== REFRESH LOGIC ===== //
const refreshAuthLogic = async (failedRequest: any) => {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    console.warn("No refresh token available");
    clearAuthData();
    redirectToLogin("Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại!");
    return Promise.reject("No refresh token available");
  }

  try {
    console.log("Attempting to refresh token...");

    const res = await axios.post("/api/login/get_new_token/", {
      refresh: refreshToken,
    });

    const newAccessToken = res.data.access;
    const newRefreshToken = res.data.refresh || refreshToken;

    updateAuthStorage(newAccessToken, newRefreshToken);
    failedRequest.response.config.headers["Authorization"] = `Bearer ${newAccessToken}`;

    console.log("Token refreshed successfully");
    return Promise.resolve();
  } catch (refreshError: any) {
    console.error("Refresh token failed:", refreshError);

    const status = refreshError?.response?.status;
    const errorMessage = refreshError?.response?.data?.message || refreshError?.message;

    if (status === 401) {
      clearAuthData();
      redirectToLogin("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
    } else if (status === 403) {
      clearAuthData();
      redirectToLogin("Tài khoản của bạn không có quyền truy cập. Vui lòng liên hệ quản trị viên!");
    } else if (status === 400) {
      clearAuthData();
      redirectToLogin("Thông tin đăng nhập không hợp lệ. Vui lòng đăng nhập lại!");
    } else if (!status) {
      toast.error("Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng!");
    } else {
      clearAuthData();
      redirectToLogin(`Có lỗi xảy ra: ${errorMessage || "Vui lòng đăng nhập lại!"}`);
    }

    return Promise.reject(refreshError);
  }
};

// Auto-refresh setup
createAuthRefreshInterceptor(api, refreshAuthLogic, {
  statusCodes: [401],
  pauseInstanceWhileRefreshing: true,
});

// ===== ERROR HANDLING ===== //
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 403 && error?.response?.data?.code === "PERMISSION_DENIED") {
      toast.error("Bạn không có quyền thực hiện thao tác này!");
      return Promise.reject(error);
    }

    if (status >= 500) {
      toast.error("Lỗi server. Vui lòng thử lại sau!");
    } else if (status === 404) {
      toast.error("Không tìm thấy tài nguyên yêu cầu!");
    } else if (status === 400) {
      const message = error?.response?.data?.message || "Dữ liệu không hợp lệ!";
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export {
  getAccessToken,
  getRefreshToken,
  updateAuthStorage,
  clearAuthData,
  redirectToLogin,
};
