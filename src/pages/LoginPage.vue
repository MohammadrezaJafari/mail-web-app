<template>
  <q-layout view="lHh lpR fFf">
    <q-page-container>
      <q-page class="flex flex-center login-page">
        <q-card class="login-card q-pa-lg" flat bordered>
          <div class="row items-center q-mb-lg">
            <q-avatar color="primary" text-color="white" icon="mail" size="48px" />
            <div class="q-ml-md">
              <div class="text-h5 text-weight-bold">{{ appName }}</div>
              <div class="text-caption text-grey-7">{{ t('auth.subtitle') }}</div>
            </div>
          </div>

          <q-form @submit.prevent="submit">
            <q-input
              v-model="email"
              type="email"
              :label="t('auth.email')"
              outlined
              autofocus
              autocomplete="username"
              dir="ltr"
              :rules="[(v) => !!v || '']"
            >
              <template #prepend><q-icon name="alternate_email" /></template>
            </q-input>

            <q-input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              :label="t('auth.password')"
              outlined
              autocomplete="current-password"
              class="q-mt-sm"
              dir="ltr"
              :rules="[(v) => !!v || '']"
            >
              <template #prepend><q-icon name="lock" /></template>
              <template #append>
                <q-icon
                  :name="showPassword ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="showPassword = !showPassword"
                />
              </template>
            </q-input>

            <q-banner v-if="error" dense rounded class="bg-red-1 text-negative q-mt-sm">{{
              error
            }}</q-banner>

            <q-btn
              type="submit"
              color="primary"
              unelevated
              class="full-width q-mt-md"
              size="lg"
              :loading="loading"
              :label="t('auth.signIn')"
            />
          </q-form>

          <div class="row justify-between items-center q-mt-lg">
            <language-toggle />
            <q-toggle v-model="dark" dense :label="dark ? '🌙' : '☀️'" />
          </div>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { errorMessage } from '@/api';
import LanguageToggle from '@/components/LanguageToggle.vue';
import { APP_NAME } from '@/utils/format';

const { t } = useI18n();
const $q = useQuasar();
const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const appName = APP_NAME;
const email = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const error = ref('');

const dark = computed({
  get: () => $q.dark.isActive,
  set: (v: boolean) => $q.dark.set(v),
});

async function submit() {
  loading.value = true;
  error.value = '';
  try {
    await auth.login(email.value.trim(), password.value);
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null;
    await router.replace(redirect && redirect !== '/login' ? redirect : { name: 'mail' });
  } catch (e) {
    error.value = errorMessage(e, t('auth.failed'));
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="scss">
.login-page {
  background: linear-gradient(135deg, #0f6cbd 0%, #1e3a5f 100%);
}
.login-card {
  width: 420px;
  max-width: 92vw;
  border-radius: 12px;
}
</style>
