import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { guest: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/MailLayout.vue'),
    meta: { auth: true },
    children: [
      { path: '', redirect: { name: 'mail' } },
      { path: 'mail', name: 'mail', component: () => import('@/pages/MailPage.vue') },
      {
        path: 'mail/:folder(.*)',
        name: 'mail.folder',
        component: () => import('@/pages/MailPage.vue'),
      },
      { path: 'settings', name: 'settings', component: () => import('@/pages/SettingsPage.vue') },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
];

export default routes;
