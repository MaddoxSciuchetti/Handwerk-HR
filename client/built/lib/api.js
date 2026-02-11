import API from "@/config/apiClient";
import z from "zod";
export const login = async (data) => {
    return API.post("/auth/login", data);
};
export const signup = async (data) => {
    return API.post("/auth/register", data);
};
export const logout = async () => API.get("/auth/logout");
export const verifyEmail = async (verificationCode) => {
    return API.get(`/auth/email/verify/${verificationCode.code}`);
};
export const sendPasswordResetEmail = async (email) => API.post("/auth/password/forgot", { email });
export const resetPassword = async ({ verificationCode, password, }) => API.post("/auth/password/reset", { verificationCode, password });
export const getUser = async () => {
    return API.get("/user");
};
export const getSessions = async () => API.get("/sessions");
export const deleteSession = async (id) => API.delete(`/sessions/${id}`);
export const getHistoryData = async (id) => {
    const response = await API.get(`/offboarding/getHistoryData/${id}`);
    return response;
};
export const postFile = async (files, id) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    const response = await API.post(`/offboarding/editdata/file/${id}`, formData);
    return response;
};
export const fetchFileData = async (id) => {
    const response = API.get(`/offboarding/getFileData/file/${id}`);
    return response;
};
export const deleteFileData = async (id) => {
    return API.delete(`offboarding/deleteFileData/${id}`);
};
export const fetchProcessData = async (id, form_type) => {
    return API.get(`offboarding/user/${id}?param1=${form_type}`);
};
export const verifyChef = async () => {
    return API.get(`/user/chefpermission`);
};
const owners = [
    "Janik",
    "Siemon",
    "Acosta",
    "Sen",
    "Conpro IT",
    "cmknti1f800028tmmhf5u5627",
];
export const EmployFormSchema = z.array(z.object({
    description: z.coerce.string(),
    form_field_id: z.coerce.number(),
    owner: z.enum(owners),
    inputs: z.array(z.object({
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
    })),
}));
export const fetchChefData = async () => {
    const response = await API.get("/user/employeeData");
    return EmployFormSchema.parse(response);
};
export const fetchNameData = async () => {
    const response = API.get("/offboarding/fetchData");
    return response;
};
export const sendReminderWorker = async (data) => {
    console.log(data);
    return API.post("/offboarding/sendReminder", data);
};
export const editData = async (formData) => {
    return API.put("offboarding/editdata", formData);
};
export const formattedData = async (id, param) => {
    const response = await API.get(`offboarding/user/${id}?param1=${param}`);
    return response;
};
export const specificEmployeeData = async () => {
    return API.get(`/user/specificEmployeeData`);
};
export const deleteTaskApi = async (taskId) => {
    const response = await API.delete(`/offboarding/delete/${taskId}`);
    return response;
};
export const postOffboardingData = async (data) => {
    const response = await API.post("/offboarding/postoffboardingdata", {
        data,
    });
    return response;
};
