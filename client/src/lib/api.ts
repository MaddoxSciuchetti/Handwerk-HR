import { File_Request } from "@/components/backround_worker";
import API from "@/config/apiClient";
import { Session } from "react-router-dom";
import { User } from "shared_prisma_types";

export type RegisterRequest = {
  email: string;
  password: string;
  confirmPassword: string;
  userAgent?: string;
};

export type RegisterResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export type LoginRequest = Omit<RegisterRequest, "confirmPassword">;

export type LoginResponse = Omit<RegisterResponse, "user">;

export type Verify = {
  code: string;
};

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  return API.post<LoginRequest, LoginResponse>("/auth/login", data);
};
export const signup = async (
  data: RegisterRequest,
): Promise<RegisterResponse> => {
  return API.post<RegisterRequest, RegisterResponse>("/auth/register", data);
};

export const logout = async () => API.get("/auth/logout");

export const verifyEmail = async (
  verificationCode: Verify,
): Promise<string> => {
  return API.get<Verify, string>(`/auth/email/verify/${verificationCode.code}`);
};

export const sendPasswordResetEmail = async (email: string) =>
  API.post("/auth/password/forgot", { email });

export type resetPassword = {
  verificationCode: string;
  password: string;
};

export const resetPassword = async ({
  verificationCode,
  password,
}: resetPassword): Promise<resetPassword> =>
  API.post("/auth/password/reset", { verificationCode, password });

type user = {
  id: string;
  updatedAt: string;
  email: string;
  verified: boolean;
  createdAt: string;
};

export const getUser = async (): Promise<user> => {
  return API.get<user, user>("/user");
};

export type Session_API = {
  id: string;
  userAgent: string;
  createdAt: string;
  isCurrent: boolean;
};

export const getSessions = async (): Promise<Session_API> =>
  API.get("/sessions");
export const deleteSession = async (id: string): Promise<void> =>
  API.delete(`/sessions/${id}`);

export const getHistoryData = async (id: number): Promise<any> => {
  const response = await API.get(`/offboarding/getHistoryData/${id}`);
  return response;
};

type FileResponse = {
  employee_form_id: number;
  original_filename: string;
  file_size: number;
  content_type: string;
  cloud_url: string;
  cloud_key: string;
};

export const postFile = async (
  files: File[],
  id: number,
): Promise<FileResponse> => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  const response = await API.post<any, FileResponse>(
    `/offboarding/editdata/file/${id}`,

    formData,
  );
  return response;
};

export const fetchFileData = async (id: number): Promise<File_Request[]> => {
  return API.get(`/offboarding/getFileData/file/${id}`);
};

export const fetchProcessData = async (
  id: number,
  form_type: string,
): Promise<any> => {
  return API.get(`offboarding/user/${id}?param1=${form_type}`);
};
