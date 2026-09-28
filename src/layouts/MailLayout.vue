<template>
  <q-layout view="hHh LpR fFf">
    <q-header class="app-header" height-hint="56">
      <q-toolbar class="q-px-md" style="min-height: 56px">
        <q-btn flat dense round icon="menu" class="lt-md q-mr-sm" @click="drawer = !drawer" />
        <div class="row items-center no-wrap brand">
          <div class="brand-logo"><q-icon name="mail" size="18px" /></div>
          <span class="brand-name">{{ appName }}</span>
        </div>

        <q-space />

        <q-btn
          v-if="auth.webmailUrl"
          flat
          dense
          no-caps
          class="rounded-btn header-btn"
          icon="open_in_new"
          :label="$q.screen.gt.sm ? t('nav.webmail') : undefined"
          type="a"
          :href="auth.webmailUrl"
          target="_blank"
          rel="noopener"
        />
        <language-toggle class="header-btn" />
        <q-btn
          flat
          dense
          round
          class="header-btn"
          :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
          @click="$q.dark.toggle()"
        />

        <q-btn flat dense round class="q-ml-sm">
          <q-avatar size="34px" class="user-avatar text-weight-bold">{{ auth.initials }}</q-avatar>
          <q-menu anchor="bottom right" self="top right" class="rounded-menu">
            <q-list style="min-width: 240px" class="q-py-sm">
              <q-item>
                <q-item-section avatar
                  ><q-avatar class="user-avatar text-weight-bold">{{
                    auth.initials
                  }}</q-avatar></q-item-section
                >
                <q-item-section>
                  <q-item-label class="text-weight-semibold">{{ auth.user?.name }}</q-item-label>
                  <q-item-label caption dir="ltr">{{ auth.user?.email }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-separator class="q-my-sm" />
              <q-item clickable v-close-popup :to="{ name: 'settings' }">
                <q-item-section avatar><q-icon name="settings" /></q-item-section>
                <q-item-section>{{ t('nav.settings') }}</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="signOut">
                <q-item-section avatar><q-icon name="logout" /></q-item-section>
                <q-item-section>{{ t('auth.signOut') }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <!-- Narrow app rail (Outlook style) -->
    <q-drawer v-model="drawer" show-if-above :width="68" :breakpoint="1024" class="app-rail">
      <div class="column items-center q-pt-md q-gutter-y-xs">
        <q-btn
          flat
          no-caps
          :to="{ name: 'mail' }"
          class="rail-btn"
          :class="{ 'rail-active': isMail }"
        >
          <div class="column items-center">
            <q-icon name="mail" size="22px" />
            <span v-if="mail.unreadInbox" class="rail-badge">{{
              mail.unreadInbox > 99 ? '99+' : mail.unreadInbox
            }}</span>
            <div class="rail-label">{{ t('nav.mail') }}</div>
          </div>
        </q-btn>
        <q-btn
          flat
          no-caps
          :to="{ name: 'settings' }"
          class="rail-btn"
          :class="{ 'rail-active': route.name === 'settings' }"
        >
          <div class="column items-center">
            <q-icon name="tune" size="22px" />
            <div class="rail-label">{{ t('nav.settings') }}</div>
          </div>
        </q-btn>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <compose-window v-if="compose.open" />
  </q-layout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from '@/stores/auth';
import { useMailStore } from '@/stores/mail';
import { useComposeStore } from '@/stores/compose';
import LanguageToggle from '@/components/LanguageToggle.vue';
import { APP_NAME } from '@/utils/format';
import ComposeWindow from '@/components/mail/ComposeWindow.vue';

const { t, locale } = useI18n();
const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const mail = useMailStore();
const compose = useComposeStore();

const appName = computed(() => (locale.value === 'fa-IR' ? t('app.name') : APP_NAME));
const drawer = ref(false);
const isMail = computed(() => String(route.name ?? '').startsWith('mail'));

watch(
  () => $q.dark.isActive,
  (v) => $q.localStorage.set('mail.dark', v),
);
const savedDark = $q.localStorage.getItem<boolean>('mail.dark');
if (typeof savedDark === 'boolean') $q.dark.set(savedDark);

async function signOut() {
  await auth.logout();
  await router.replace({ name: 'login' });
}
</script>

<style lang="scss">
.app-header {
  background: var(--mail-surface);
  color: var(--mail-text);
  border-bottom: 1px solid var(--mail-border);
  box-shadow: none;
}
.brand {
  gap: 10px;
}
.brand-logo {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  color: #fff;
  background: linear-gradient(135deg, #0f6cbd, #2b88d8);
  box-shadow: 0 4px 12px rgba(15, 108, 189, 0.35);
}
.brand-name {
  font-weight: 700;
  font-size: 17px;
}
.header-btn {
  color: var(--mail-muted);
}
.user-avatar {
  background: linear-gradient(135deg, #0f6cbd, #7160e8);
  color: #fff;
  font-size: 13px;
}
.rounded-menu {
  border-radius: 12px;
}
.app-rail {
  background: var(--mail-bg);
  border-right: 0 !important;

  .rail-btn {
    position: relative;
    width: 56px;
    height: 56px;
    border-radius: 14px;
    color: var(--mail-muted);
    padding: 0;
  }
  .rail-active {
    color: var(--mail-primary);
    background: var(--mail-selected);
  }
  .rail-label {
    font-size: 10.5px;
    margin-top: 3px;
    font-weight: 500;
  }
}
</style>
