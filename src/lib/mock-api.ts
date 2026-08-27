import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { Task, TaskStatus } from 'src/types';

import {
  generateMockBots,
  generateMockTasks,
  generateMockUsers,
  generateMockExecutionLogs,
} from './mock-data';

// ----------------------------------------------------------------------
// Roteador de mocks: este é o repositório de demonstração (deploy público),
// não o painel real da BHub. Intercepta chamadas à API quando ela não
// responde OU quando responde com lista vazia, e devolve dados fake no
// mesmo formato da API real, para o protótipo nunca aparecer zerado.
// ----------------------------------------------------------------------

function fakeResponse<T>(data: T, config: InternalAxiosRequestConfig): AxiosResponse<T> {
  return {
    data,
    status: 200,
    statusText: 'OK (mock)',
    headers: {},
    config,
  };
}

export function pathOf(config: InternalAxiosRequestConfig): string {
  const url = config.url ?? '';
  return url.replace(/^https?:\/\/[^/]+/, '').split('?')[0];
}

export function isEmptyGetResponse(path: string, data: unknown): boolean {
  if (path === '/tasks' || path === '/execution-logs') {
    const items = (data as { items?: unknown[] } | null)?.items;
    return Array.isArray(items) && items.length === 0;
  }
  if (path === '/bots' || path === '/users') {
    return Array.isArray(data) && data.length === 0;
  }
  return false;
}

let botsStore: ReturnType<typeof generateMockBots> | null = null;
let usersStore: ReturnType<typeof generateMockUsers> | null = null;

function getBotsStore() {
  if (!botsStore) botsStore = [...generateMockBots()];
  return botsStore;
}

function getUsersStore() {
  if (!usersStore) usersStore = [...generateMockUsers()];
  return usersStore;
}

export function mockResponseFor(config: InternalAxiosRequestConfig): AxiosResponse | null {
  const method = (config.method ?? 'get').toLowerCase();
  const path = pathOf(config);
  const params = (config.params ?? {}) as Record<string, string | number | undefined>;

  // ---- /tasks ----
  if (path === '/tasks' && method === 'get') {
    let items: Task[] = generateMockTasks();

    if (params.queue) items = items.filter((t) => t.queue === params.queue);
    if (params.status) items = items.filter((t) => t.status === (params.status as TaskStatus));
    if (params.updated_at_from) items = items.filter((t) => t.updated_at >= String(params.updated_at_from));
    if (params.updated_at_to) items = items.filter((t) => t.updated_at <= String(params.updated_at_to));

    if (params.all === 'true') {
      return fakeResponse({ items, count: items.length, next_cursor: null, capped: false }, config);
    }

    const limit = Number(params.limit) || 20;
    const cursorIndex = params.cursor ? Number(params.cursor) : 0;
    const page = items.slice(cursorIndex, cursorIndex + limit);
    const nextIndex = cursorIndex + limit;
    return fakeResponse(
      {
        items: page,
        count: page.length,
        next_cursor: nextIndex < items.length ? String(nextIndex) : null,
      },
      config
    );
  }

  // ---- /bots ----
  if (path === '/bots' && method === 'get') {
    return fakeResponse(getBotsStore(), config);
  }

  if (path === '/bots' && method === 'post') {
    const body = JSON.parse(config.data ?? '{}');
    const bot = { id: `bot-${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...body };
    getBotsStore().push(bot);
    return fakeResponse(bot, config);
  }

  const botMatch = path.match(/^\/bots\/([^/]+)(\/execute)?$/);
  if (botMatch && method === 'patch') {
    const id = botMatch[1];
    const store = getBotsStore();
    const idx = store.findIndex((b) => b.id === id);
    const body = JSON.parse(config.data ?? '{}');
    if (idx >= 0) store[idx] = { ...store[idx], ...body, updated_at: new Date().toISOString() };
    return fakeResponse(store[idx] ?? body, config);
  }

  if (botMatch && method === 'delete') {
    const id = botMatch[1];
    const store = getBotsStore();
    const idx = store.findIndex((b) => b.id === id);
    if (idx >= 0) store.splice(idx, 1);
    return fakeResponse({ success: true }, config);
  }

  if (botMatch?.[2] === '/execute' && method === 'post') {
    return fakeResponse(
      {
        detail: 'Item added to queue successfully',
        id: `mock-${Date.now()}`,
        item_status: 'pending',
        priority: 0,
        max_attempts: 3,
      },
      config
    );
  }

  // ---- /execution-logs ----
  if (path === '/execution-logs' && method === 'get') {
    const botId = String(params.bot_id ?? '');
    let items = generateMockExecutionLogs(botId);
    if (params.status) items = items.filter((l) => l.status === params.status);

    const page = Number(params.page) || 1;
    const pageSize = Number(params.page_size) || 20;
    const start = (page - 1) * pageSize;
    return fakeResponse(
      { total: items.length, page, page_size: pageSize, items: items.slice(start, start + pageSize) },
      config
    );
  }

  // ---- /users ----
  if (path === '/users' && method === 'get') {
    return fakeResponse(getUsersStore(), config);
  }

  if (path === '/users' && method === 'post') {
    const body = JSON.parse(config.data ?? '{}');
    const user = { id: `user-${Date.now()}`, created_at: new Date().toISOString(), last_sign_in_at: null, ...body };
    delete (user as { password?: string }).password;
    getUsersStore().push(user);
    return fakeResponse(user, config);
  }

  const userMatch = path.match(/^\/users\/([^/]+)$/);
  if (userMatch && method === 'patch') {
    const store = getUsersStore();
    const idx = store.findIndex((u) => u.id === userMatch[1]);
    const body = JSON.parse(config.data ?? '{}');
    if (idx >= 0) store[idx] = { ...store[idx], ...body };
    return fakeResponse(store[idx] ?? body, config);
  }

  if (userMatch && method === 'delete') {
    const store = getUsersStore();
    const idx = store.findIndex((u) => u.id === userMatch[1]);
    if (idx >= 0) store.splice(idx, 1);
    return fakeResponse({ success: true }, config);
  }

  return null;
}
