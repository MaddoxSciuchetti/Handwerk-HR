import { FORBIDDEN, UNAUTHORIZED } from '@/constants/http.consts';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { API_URL } from './env';
import queryClient from './query.client';

const options = {
  baseURL: API_URL,
  withCredentials: true,
};
const TokenRefreshClient = axios.create(options);
TokenRefreshClient.interceptors.response.use((response) => response.data);

const isInvalidAccessToken = (status: number, data: ApiErrorResponse) =>
  status === UNAUTHORIZED && data?.errorCode === 'InvalidAccessToken';

const isSubscriptionAccessDenied = (status: number, data: ApiErrorResponse) =>
  status === FORBIDDEN && data?.errorCode === 'SubscriptionAccessDenied';

const handleTokenRefresh = async (config: AxiosRequestConfig) => {
  try {
    await TokenRefreshClient.get('/auth/refresh');
    return TokenRefreshClient(config);
  } catch {
    queryClient.clear();
    window.location.href = '/login';
  }
};

const API = axios.create(options);

type ApiErrorResponse = {
  errorCode: string;
  message: string;
};

API.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError<ApiErrorResponse>) => {
    const { config, response } = error;
    if (!config) {
      throw new Error('config is not defined');
    }
    if (!response) {
      throw new Error('response is not ok');
    }
    const { status, data } = response;

    if (isInvalidAccessToken(status, data)) {
      return handleTokenRefresh(config);
    }

    if (isSubscriptionAccessDenied(status, data)) {
      const path = window.location.pathname;
      const onBillingPath =
        path.startsWith('/settings/payments') ||
        path.startsWith('/settings/plans');
      if (!onBillingPath) {
        window.location.assign('/settings/payments');
      }
    }

    return Promise.reject({ status, ...data });
  }
);

/**
 * Typed helpers for this axios instance: the response interceptor returns
 * `response.data`, but Axios defaults still use `AxiosResponse<T>`. Use these
 * methods when you want `Promise<T>` (the JSON body) without repeating `<T, T>`.
 */
export const apiJson = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    API.get<T, T>(url, config),

  post: <T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>
  ) => API.post<T, T, D>(url, data, config),

  patch: <T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>
  ) => API.patch<T, T, D>(url, data, config),

  put: <T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>
  ) => API.put<T, T, D>(url, data, config),

  delete: <T = void>(url: string, config?: AxiosRequestConfig) =>
    API.delete<T, T>(url, config),
};

export default API;
