import { UNAUTHORIZED } from '@/constants/http';
import axios, { AxiosError } from 'axios';
import queryClient from './query.client';

const options = {
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
};

// create a separate client for refreshing the access token
// to avoid infinite loops with the error interceptor
const TokenRefreshClient = axios.create(options);
TokenRefreshClient.interceptors.response.use((response) => response.data);

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
      console.log(error.config);
      throw new Error('config is not defined');
    }
    if (!response) {
      console.log(error.response);
      throw new Error('response is not ok');
    }
    const { status, data } = response;

    // try to refresh the access token behind the scenes
    if (status === UNAUTHORIZED && data?.errorCode === 'InvalidAccessToken') {
      try {
        // refresh the access token, then retry the original request
        await TokenRefreshClient.get('/auth/refresh');
        return TokenRefreshClient(config);
      } catch (refreshError) {
        // handle refresh errors by clearing the query cache & redirecting to login
        queryClient.clear();
        window.location.href = '/login';
      }
    }

    return Promise.reject({ status, ...data });
  }
);

export default API;
