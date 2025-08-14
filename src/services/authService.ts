import { api } from "./api";
import type {
  LoginRequestI,
  LoginResponseI,
  UserCreateRequestI,
  AuthRegisterResponse,
  ChangePasswordRequestI,
  ChangeUserRequestI,
  GetUserResponseI,
} from "../types/auth.types";
import { useLoadingStore } from "../stores/loadingStore";
import { toast } from "react-toastify";
import axios from "axios";

export const authService = {
  login: async (credentials: LoginRequestI): Promise<LoginResponseI> => {
    const { startLoading, stopLoading } = useLoadingStore.getState();
    try {
      startLoading();
      const response = await api.post<LoginResponseI>("login/", credentials);
      toast.success("Đăng nhập thành công!");
      return response.data;
    } catch (error: any) {
      stopLoading();
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.message || "Đã có lỗi xảy ra";

        if (status === 400) {
          toast.error("Thông tin đăng nhập không hợp lệ.");
        } else if (status === 401) {
          toast.error("Sai tài khoản hoặc mật khẩu.");
        } else if (status === 500) {
          toast.error("Lỗi hệ thống. Vui lòng thử lại sau.");
        } else {
          toast.error(`Lỗi: ${message}`);
        }
      } else {
        toast.error("Lỗi không xác định.");
      }

      throw error;
    } finally {
      stopLoading();
    }
  },
  register: async (
    userData: UserCreateRequestI
  ): Promise<AuthRegisterResponse> => {
    const { startLoading, stopLoading } = useLoadingStore.getState();
    try {
      startLoading();
      const response = await api.post<AuthRegisterResponse>(
        "master/user/",
        userData
      );
      toast.success("Đăng ký thành công!");
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message =
          error.response?.data?.message ||
          error.response?.data?.detail ||
          "Đã có lỗi xảy ra.";

        if (status === 400) {
          toast.error("Thông tin không hợp lệ. Vui lòng kiểm tra lại.");
        } else if (status === 409) {
          toast.error("Tài khoản đã tồn tại.");
        } else if (status === 500) {
          toast.error("Lỗi hệ thống. Vui lòng thử lại sau.");
        } else {
          toast.error(`Lỗi: ${message}`);
        }
      } else {
        toast.error("Lỗi không xác định.");
      }
      throw error;
    } finally {
      stopLoading();
    }
  },
  changePassword: async (formData: ChangePasswordRequestI): Promise<void> => {
    const { startLoading, stopLoading } = useLoadingStore.getState();
    try {
      startLoading();
      const response = await api.post("master/user/change_password", formData);
      toast.success("Đổi mật khẩu thành công!");
      return response.data;
    } catch (error) {
      toast.error("Đổi mật khẩu thất bại!");
      console.log(error);
      throw error;
    } finally {
      stopLoading();
    }
  },
  getUser: async (id:number):Promise<GetUserResponseI>=>{
    const { startLoading, stopLoading } = useLoadingStore.getState();
    try {
      startLoading();
      const response = await api.get(`master/user/${id}`);
      return response.data;
    } catch (error) {
      toast.error("Lấy thông tin thất bại!");
      console.log(error);
      throw error;
    } finally {
      stopLoading();
    }
  }
  ,
  changeUser : async (id:number,formData: ChangeUserRequestI): Promise<void> =>{
    const { startLoading, stopLoading } = useLoadingStore.getState();
    try {
      startLoading();
      const response = await api.put(`master/user/${id}`, formData);
      toast.success("Đổi thông tin thành công! Vui lòng đăng nhập lại để cập nhật thông tin.");
      return response.data;
    } catch (error) {
      toast.error("Đổi thông tin thất bại!");
      console.log(error);
      throw error;
    } finally {
      stopLoading();
    }
  }
};
