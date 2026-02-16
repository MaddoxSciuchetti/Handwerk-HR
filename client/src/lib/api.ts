import { sendEmailSchema } from "@/components/admin_data/AdminModal";
import { File_Request } from "@/components/backround_worker";
import API from "@/config/apiClient";
import { TEmployForm } from "@/features/Ceo_Dashboard";
import { OffboardingItem } from "@/features/OnOf_Home";
import { api_Response } from "@/features/OnOf_Worker_Procedure";
import { Mappingform } from "@/schemas/Task";
import { FormInputs } from "@/schemas/zodSchema";
import {
    delete_user,
    SuccessResponse,
    TOffboardingItemUser,
} from "@/types/api_response";
import { Session } from "react-router-dom";
import { User } from "shared_prisma_types";
import z from "zod";

export type RegisterRequest = {
    firstName?: string;
    lastName?: string;
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
    return API.get<Verify, string>(
        `/auth/email/verify/${verificationCode.code}`,
    );
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

export type user = {
    id: string;
    updatedAt: string;
    email: string;
    verified: boolean;
    createdAt: string;
    user_permission: "CHEF" | "MITARBEITER";
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
    const response = API.get<any, File_Request[]>(
        `/offboarding/getFileData/file/${id}`,
    );
    return response;
};

export const deleteFileData = async (
    id: number,
): Promise<{ message: string }> => {
    return API.delete(`offboarding/deleteFileData/${id}`);
};

export const fetchProcessData = async (
    id: number,
    form_type: string,
): Promise<any> => {
    return API.get(`offboarding/user/${id}?param1=${form_type}`);
};

export const verifyChef = async (): Promise<user> => {
    return API.get(`/user/chefpermission`);
};

const owners = [
    "Janik",
    "Siemon",
    "Acosta",
    "Sen",
    "Conpro IT",
    "cmknti1f800028tmmhf5u5627",
] as const;

export const EmployFormSchema = z.array(
    z.object({
        description: z.coerce.string(),
        form_field_id: z.coerce.number(),
        owner: z.enum(owners),
        inputs: z.array(
            z.object({
                id: z.coerce.number(),
                employee_form_id: z.coerce.number(),
                form_field_id: z.coerce.number(),
                status: z.coerce.string(),
                timestamp: z.coerce.date(),
                employee: z.object({
                    id: z.number(),
                    vorname: z.string(),
                    nachname: z.string(),
                    email: z.string().nullable(),
                }),
            }),
        ),
    }),
);

export const fetchChefData = async (): Promise<TEmployForm> => {
    const response = await API.get("/user/employeeData");
    return EmployFormSchema.parse(response);
};

export const fetchNameData = async (): Promise<OffboardingItem[]> => {
    const response = API.get<OffboardingItem[], OffboardingItem[]>(
        "/offboarding/fetchData",
    );
    return response;
};

export const sendReminderWorker = async (
    data: sendEmailSchema,
): Promise<unknown> => {
    console.log(data);
    return API.post("/offboarding/sendReminder", data);
};

export const editData = async (formData: Mappingform) => {
    return API.put<SuccessResponse, SuccessResponse>(
        "offboarding/editdata",
        formData,
    );
};

export const formattedData = async (
    id: number,
    param: string,
): Promise<api_Response> => {
    const response = await API.get<api_Response, api_Response>(
        `offboarding/user/${id}?param1=${param}`,
    );
    return response;
};

export const specificEmployeeData = async () => {
    return API.get(`/user/specificEmployeeData`);
};

export const deleteTaskApi = async (taskId: number): Promise<delete_user> => {
    const response = await API.delete<delete_user, delete_user>(
        `/offboarding/delete/${taskId}`,
    );
    return response;
};

export const postOffboardingData = async (
    data: FormInputs,
): Promise<TOffboardingItemUser> => {
    const response = await API.post<TOffboardingItemUser, TOffboardingItemUser>(
        "/offboarding/postoffboardingdata",
        {
            data,
        },
    );
    return response;
};
