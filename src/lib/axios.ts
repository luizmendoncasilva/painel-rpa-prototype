import type { AxiosError, AxiosResponse, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

import axios from 'axios';

import { CONFIG } from 'src/global-config';

import { pathOf, mockResponseFor, isEmptyGetResponse } from './mock-api';

// ----------------------------------------------------------------------
// Este é o repositório de demonstração pública (deploy Vercel), não o
// painel real da BHub — por isso os dados fake valem sempre (dev e
// produção). Não há back-end real configurado aqui (CONFIG.serverUrl
// fica vazio de propósito, pra não expor a API/credenciais reais da
// BHub num repo público): toda chamada cai no próprio domínio estático
// e o Vercel responde com o index.html da SPA (200, text/html) em vez
// de JSON — por isso detectamos esse "fallback de SPA" e sempre
// roteamos para os dados mockados, em qualquer método (GET/POST/...).
// ----------------------------------------------------------------------

const axiosInstance = axios.create({
  baseURL: CONFIG.serverUrl,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': import.meta.env.VITE_API_KEY ?? '',
  },
});

function looksLikeSpaFallback(response: AxiosResponse): boolean {
  const contentType = String(response.headers?.['content-type'] ?? '');
  if (contentType.includes('text/html')) return true;
  return typeof response.data === 'string' && response.data.trim().startsWith('<!doctype');
}

axiosInstance.interceptors.response.use(
  (response) => {
    const path = pathOf(response.config);
    const method = (response.config.method ?? 'get').toLowerCase();
    const shouldMock =
      looksLikeSpaFallback(response) || (method === 'get' && isEmptyGetResponse(path, response.data));

    if (shouldMock) {
      const mocked = mockResponseFor(response.config);
      if (mocked) return mocked;
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
