import { sendEmailSchema } from "@/components/admin_data/AdminModal";
import { File_Request } from "@/components/backround_worker";
import { TFeatureForm } from "@/components/modal/FeatureModal";
import API from "@/config/apiClient";
import { TEmployForm } from "@/features/Ceo_Dashboard";
import { OffboardingItem } from "@/features/OnOf_Home";
import { api_Response } from "@/features/OnOf_Worker_Procedure";
import { TFile } from "@/features/Profile";
import { Mappingform } from "@/schemas/Task";
import { FormInputs } from "@/schemas/zodSchema";
import {
    delete_user,
    SuccessResponse,
    TOffboardingItemUser,
} from "@/types/api_response";
import { da } from "date-fns/locale";
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
    console.log("why testUser", data);
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
    id: number;
    updatedAt: string;
    email: string;
    verified: boolean;
    createdAt: string;
    user_permission: "CHEF" | "MITARBEITER";
};

export const getUser = async (): Promise<User> => {
    return API.get<User, User>("/user");
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

export const fetchCloudUrl = async (cloud_key: string): Promise<string> => {
    const response = await API.get<string, string>(
        `/offboarding/getCloudUrl?cloud_key=${encodeURIComponent(cloud_key)}`,
        { responseType: "blob" },
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

export const EmployFormSchema = z.array(
    z.object({
        description: z.coerce.string(),
        form_field_id: z.coerce.number(),
        owner: z.string(),
        fullname: z.string(),
        auth_id: z.string(),
        is_substitute: z.boolean(),
        substitute_id: z.string().nullable(),
        original_owner: z.string(),
        substitute_name: z.string().nullable(),
        inputs: z.array(
            z.object({
                id: z.coerce.number(),
                employee_form_id: z.coerce.number(),
                form_field_id: z.coerce.number(),
                status: z.coerce.string(),
                timestamp: z.coerce.date(),
                timeStampLastChange: z.coerce.date(),
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

export const SubUser = z.object({
    id: z.coerce.string(),
    vorname: z.string(),
    nachname: z.string(),
});

export const EmployeeStatus = z.array(
    z.object({
        id: z.coerce.string(),
        userId: z.coerce.string(),
        absence: z.coerce.string(),
        absencetype: z.coerce.string().nullable(),
        absencebegin: z.coerce.date().nullable(),
        absenceEnd: z.coerce.date().nullable(),
        substitute: z.coerce.string().nullable(),
        sub_user: SubUser.nullable(),
    }),
);

export const ZEmployeeData = z.array(
    z.object({
        id: z.coerce.string(),
        vorname: z.string(),
        nachname: z.string(),
        email: z.string().nullable(),
        verified: z.boolean(),
        createdAt: z.string(),
        updatedAt: z.string(),
        user_permission: z.enum(["CHEF", "MITARBEITER"]),
        employeeStatus: EmployeeStatus.nullable(),
    }),
);

export type TEmployeeResponse = z.infer<typeof ZEmployeeData>;

export const specificEmployeeData = async (): Promise<TEmployeeResponse> => {
    const response = await API.get(`/user/specificEmployeeData`);
    console.log(response);
    return ZEmployeeData.parse(response);
};

type AbsenceData = {
    id: string;
    absence: string;
    absencetype?: string;
    absencebegin?: string;
    absenceEnd?: string;
    substitute?: string;
};

export const editEmployeeAbsence = async (
    data: AbsenceData,
): Promise<AbsenceData> => {
    console.log("data in api", data);
    return API.put<AbsenceData, AbsenceData>("/user/editAbsenceData", data);
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

export const addExtraField = async (data: {
    description: string;
    template_type: "ONBOARDING" | "OFFBOARDING";
    owner: string;
}): Promise<any> => {
    const response = await API.post(`/offboarding/addFormField`, data);
    return response;
};

export const ZDescriptionData = z.array(
    z.object({
        form_field_id: z.coerce.number(),
        description: z.string(),
        owner: z.string(),
    }),
);

export type DescriptionData = z.infer<typeof ZDescriptionData>;

export const fetchRawDescription = async (): Promise<DescriptionData> => {
    const response = await API.get("/user/rawdescription");
    console.log(response);
    return ZDescriptionData.parse(response);
};

export const deleteEmployeeHandler = async (id: string): Promise<user> => {
    console.log("id in api", id);
    const response = await API.delete<typeof id, user>(
        `/user/deleteEmplyoee/${id}`,
    );
    return response;
};

export type TDescriptionData = {
    form_field_id: number;
    description: string | null;
    owner: string;
    template_type: "ONBOARDING" | "OFFBOARDING";
};

export type TDescriptionResponse = TDescriptionData & {
    auth_user: {
        id: number;
        vorname: string;
        nachname: string;
    };
};

export const fetchTaskData = async (): Promise<TDescriptionResponse[]> => {
    const response = await API.get<TDescriptionData[], TDescriptionResponse[]>(
        "/user/fetchTaskData",
    );
    return response;
};

export const deleteDescriptionData = async (id: number) => {
    const response = await API.delete(`/user/deleteDescriptionData/${id}`);
    return response;
};

type EditDescriptionData = Omit<TDescriptionData, "template_type">;

export const editTaskData = async (data: EditDescriptionData) => {
    const response = await API.put<EditDescriptionData, EditDescriptionData>(
        `/user/editTaskData/${data.form_field_id}`,
        data,
    );
    return response;
};

export const addDescriptionData = async (
    data: Omit<TDescriptionData, "form_field_id">,
) => {
    console.log("data in api", data);
    const response = await API.post(`/user/createTaskData`, data);
    return response;
};

export const featureRequest = async (data: TFeatureForm) => {
    const form = new FormData();
    form.append("importance", data.importance);
    form.append("text", data.textarea);
    if (data.file[0]) {
        data.file.forEach((file) => form.append("files", file));
    }
    const response = await API.post<TFeatureForm, TFeatureForm>(
        `/offboarding/FeatureRequest`,
        form,
    );
    return response;
};

export const uploadProfileFoto = async (data: TFile) => {
    const form = new FormData();
    form.append("file", data.file[0]);
    console.log("received something");
    console.log(form);
    const response = await API.post<TFile, TFile>(
        "/user/uploadProfileFoto",
        form,
    );
    return response;
};

export const getProfileFoto = async (): Promise<string> => {
    const response = await API.get<string, string>("/user/getProfileFoto");
    return response;
};
