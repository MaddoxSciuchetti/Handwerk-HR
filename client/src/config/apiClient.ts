import { UNAUTHORIZED } from '@/constants/http.consts';
import axios, { AxiosError } from 'axios';
import queryClient from './query.client';

const options = {
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
};
const TokenRefreshClient = axios.create(options);
TokenRefreshClient.interceptors.response.use((response) => response.data);

const isInvalidAccessToken = (status: number, data: ApiErrorResponse) =>
  status === UNAUTHORIZED && data?.errorCode === 'InvalidAccessToken';

const handleTokenRefresh = async (config: any) => {
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

    return Promise.reject({ status, ...data });
  }
);

export default API;
