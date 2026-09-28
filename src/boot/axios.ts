import { defineBoot } from '#q-app';
import axios, { type AxiosInstance } from 'axios';
import { API_URL } from '@/utils/format';

declare module 'vue' {
  interface ComponentCustomProperties {
    $api: AxiosInstance;
  }
}

const TOKEN_KEY = 'mail.token';

export const api = axios.create({
  baseURL: API_URL,
  headers: { Accept: 'application/json' },
  timeout: 60000,
});

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable (private mode); token lives in memory only */
  }
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
}

setToken(getToken());

export default defineBoot(({ app, router }) => {
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error?.response?.status;
      const code = error?.response?.data?.code;

      // Token expired / revoked, or the API can no longer reach the mailbox with
      // the cached credentials: send the user back to the login page.
      if (status === 401 || code === 'mail_credentials_missing' || code === 'mail_auth_failed') {
        setToken(null);
        if (router.currentRoute.value.name !== 'login') {
          void router.push({
            name: 'login',
            query: { redirect: router.currentRoute.value.fullPath },
          });
        }
      }

      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    },
  );

  app.config.globalProperties.$api = api;
});
