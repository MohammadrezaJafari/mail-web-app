<template>
  <q-layout view="lHh lpR fFf">
    <q-page-container>
      <q-page class="login-page row no-wrap">
        <div class="login-hero col gt-sm column justify-between q-pa-xl">
          <div class="row items-center text-white">
            <div class="hero-logo"><q-icon name="mail" size="22px" /></div>
            <span class="text-h6 text-weight-bold q-ml-sm">{{ appName }}</span>
          </div>
          <div class="text-white">
            <div class="hero-title">{{ t('login.heroTitle') }}</div>
            <div class="hero-subtitle">{{ t('login.heroSubtitle') }}</div>
          </div>
          <div class="text-white-7 text-caption">
            © {{ new Date().getFullYear() }} {{ appName }}
          </div>
        </div>

        <div class="login-side col column flex-center q-pa-lg">
          <q-card flat class="login-card q-pa-xl">
            <div class="text-h4 text-weight-bold q-mb-xs">{{ t('auth.title') }}</div>
            <div class="text-grey-7 q-mb-lg">{{ t('auth.subtitle') }}</div>

            <q-form @submit.prevent="submit" class="q-gutter-y-sm">
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

              <q-banner v-if="error" dense rounded class="bg-red-1 text-negative">{{
                error
              }}</q-banner>

              <q-btn
                type="submit"
                color="primary"
                unelevated
                class="full-width login-btn"
                size="lg"
                no-caps
                :loading="loading"
                :label="t('auth.signIn')"
              />
            </q-form>

            <div class="row justify-between items-center q-mt-xl">
              <language-toggle />
              <q-btn
                flat
                dense
                round
                :icon="dark ? 'light_mode' : 'dark_mode'"
                @click="dark = !dark"
              />
            </div>
          </q-card>
        </div>
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

const { t, locale } = useI18n();
const $q = useQuasar();
const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const appName = computed(() => (locale.value === 'fa-IR' ? t('app.name') : APP_NAME));
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
  min-height: 100vh;
}
.login-hero {
  background:
    radial-gradient(1200px 600px at 10% 0%, rgba(255, 255, 255, 0.18), transparent 60%),
    linear-gradient(150deg, #0b4f8f 0%, #0f6cbd 45%, #6a5ae0 100%);
  max-width: 48%;
}
.hero-logo {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(6px);
}
.hero-title {
  font-size: 38px;
  font-weight: 800;
  line-height: 1.25;
  max-width: 520px;
}
.hero-subtitle {
  margin-top: 12px;
  font-size: 16px;
  opacity: 0.85;
  max-width: 460px;
}
.text-white-7 {
  color: rgba(255, 255, 255, 0.7);
}
.login-side {
  background: var(--mail-bg);
}
.login-card {
  width: 440px;
  max-width: 100%;
  border-radius: 20px;
  border: 1px solid var(--mail-border);
  box-shadow: var(--mail-shadow);
  background: var(--mail-surface);
}
.login-btn {
  border-radius: 12px;
  height: 48px;
  font-weight: 600;
}
</style>
