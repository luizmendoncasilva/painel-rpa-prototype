import type { AxiosError, AxiosResponse, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

import axios from 'axios';

import { CONFIG } from 'src/global-config';

import { mockResponseFor } from './mock-api';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({
  baseURL: CONFIG.serverUrl,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': import.meta.env.VITE_API_KEY ?? '',
  },
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Em dev, se a API real não responder (sem back-end local), usamos dados
    // fake só para conseguir visualizar as telas. Nunca roda em produção.
    if (import.meta.env.DEV && !error.response) {
      const mocked = mockResponseFor(error.config as InternalAxiosRequestConfig);
      if (mocked) {
        return Promise.resolve(mocked as AxiosResponse);
      }
    }

    const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
    const message =
      axiosError?.response?.data?.message || axiosError?.message || 'Something went wrong!';
    console.error('Axios error:', message);
    return Promise.reject(new Error(message));
  }
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async (args: string | [string, AxiosRequestConfig]) => {
  try {
    const [url, config] = Array.isArray(args) ? args : [args, {}];
    const res = await axiosInstance.get(url, config);
    return res.data;
  } catch (error) {
    console.error('Fetcher failed:', error);
    throw error;
  }
};

// ----------------------------------------------------------------------

export const endpoints = {
  tasks: {
    list: '/tasks',
  },
  users: {
    list: '/users',
    create: '/users',
    update: (id: string) => `/users/${id}`,
    delete: (id: string) => `/users/${id}`,
  },
  executionLogs: {
    list: '/execution-logs',
    stats: '/execution-logs/stats',
  },
  bots: {
    list: '/bots',
    create: '/bots',
    update: (id: string) => `/bots/${id}`,
    delete: (id: string) => `/bots/${id}`,
    execute: (id: string) => `/bots/${id}/execute`,
  },
};
