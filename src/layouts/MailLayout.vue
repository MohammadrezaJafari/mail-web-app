<template>
  <q-layout view="hHh LpR fFf">
    <q-header class="bg-primary text-white" height-hint="48">
      <q-toolbar style="min-height: 48px">
        <q-btn flat dense round icon="menu" class="lt-md" @click="drawer = !drawer" />
        <q-toolbar-title shrink class="text-weight-bold">{{ appName }}</q-toolbar-title>

        <q-space />

        <q-btn
          v-if="auth.webmailUrl"
          flat
          dense
          no-caps
          icon="open_in_new"
          :label="$q.screen.gt.sm ? t('nav.webmail') : undefined"
          type="a"
          :href="auth.webmailUrl"
          target="_blank"
          rel="noopener"
        />
        <language-toggle />
        <q-btn
          flat
          dense
          round
          :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
          @click="$q.dark.toggle()"
        />

        <q-btn flat dense round class="q-ml-sm">
          <q-avatar
            size="30px"
            color="white"
            text-color="primary"
            class="text-weight-bold text-caption"
            >{{ auth.initials }}</q-avatar
          >
          <q-menu anchor="bottom right" self="top right">
            <q-list style="min-width: 220px">
              <q-item>
                <q-item-section>
                  <q-item-label class="text-weight-medium">{{ auth.user?.name }}</q-item-label>
                  <q-item-label caption dir="ltr">{{ auth.user?.email }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-separator />
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
    <q-drawer
      v-model="drawer"
      show-if-above
      :width="56"
      :breakpoint="1024"
      bordered
      class="app-rail"
    >
      <q-list padding>
        <q-item
          clickable
          :to="{ name: 'mail' }"
          :active="isMail"
          active-class="rail-active"
          class="column items-center q-py-sm"
        >
          <q-icon name="mail" size="24px">
            <q-badge v-if="mail.unreadInbox" color="negative" floating rounded>{{
              mail.unreadInbox
            }}</q-badge>
          </q-icon>
          <div class="rail-label">{{ t('nav.mail') }}</div>
        </q-item>
        <q-item
          clickable
          :to="{ name: 'settings' }"
          active-class="rail-active"
          class="column items-center q-py-sm"
        >
          <q-icon name="settings" size="24px" />
          <div class="rail-label">{{ t('nav.settings') }}</div>
        </q-item>
      </q-list>
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

const { t } = useI18n();
const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const mail = useMailStore();
const compose = useComposeStore();

const appName = APP_NAME;
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
.app-rail {
  background: var(--mail-rail-bg);

  .q-item {
    border-radius: 8px;
    margin: 2px 6px;
    min-height: 56px;
    padding: 6px 0;
    color: var(--mail-muted);
  }
  .rail-active {
    color: $primary;
    background: var(--mail-selected);
  }
  .rail-label {
    font-size: 10px;
    margin-top: 2px;
  }
}
</style>
