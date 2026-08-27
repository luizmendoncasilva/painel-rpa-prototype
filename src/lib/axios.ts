import type { AxiosError, AxiosResponse, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

import axios from 'axios';

import { CONFIG } from 'src/global-config';

import { pathOf, mockResponseFor, isEmptyGetResponse } from './mock-api';

// ----------------------------------------------------------------------
// Este é o repositório de demonstração pública (deploy Vercel), não o
// painel real da BHub — por isso os dados fake valem sempre (dev e
// produção), tanto quando a API real está fora do ar quanto quando ela
// responde com lista vazia (ambiente novo, sem execuções ainda).
// ----------------------------------------------------------------------

const axiosInstance = axios.create({
  baseURL: CONFIG.serverUrl,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': import.meta.env.VITE_API_KEY ?? '',
  },
});

axiosInstance.interceptors.response.use(
  (response) => {
    const method = (response.config.method ?? 'get').toLowerCase();
    if (method === 'get') {
      const path = pathOf(response.config);
      if (isEmptyGetResponse(path, response.data)) {
        const mocked = mockResponseFor(response.config);
        if (mocked) return mocked;
      }
    }
    return response;
  },
  (error: AxiosError) => {
    // API real inacessível — cai para os mesmos dados fake em vez de zerar a tela.
    if (!error.response) {
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
