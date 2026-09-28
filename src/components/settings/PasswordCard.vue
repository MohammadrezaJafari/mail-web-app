<template>
  <q-card flat class="settings-card">
    <q-card-section class="card-head">
      <div class="card-icon"><q-icon name="lock" size="20px" /></div>
      <div class="col">
        <div class="text-subtitle1 text-weight-semibold">{{ t('settings.password') }}</div>
      </div>
    </q-card-section>
    <q-separator />
    <q-card-section>
      <q-form @submit.prevent="submit" class="q-gutter-sm">
        <q-input
          v-model="current"
          type="password"
          dense
          outlined
          :label="t('settings.currentPassword')"
          autocomplete="current-password"
          dir="ltr"
          :rules="[(v) => !!v || '']"
        />
        <q-input
          v-model="password"
          type="password"
          dense
          outlined
          :label="t('settings.newPassword')"
          autocomplete="new-password"
          dir="ltr"
          :rules="[(v) => (v && v.length >= 10) || '']"
        />
        <q-input
          v-model="confirm"
          type="password"
          dense
          outlined
          :label="t('settings.confirmPassword')"
          autocomplete="new-password"
          dir="ltr"
          :rules="[(v) => v === password || t('settings.passwordMismatch')]"
        />
        <q-btn
          type="submit"
          color="primary"
          unelevated
          no-caps
          :label="t('settings.changePassword')"
          :loading="busy"
        />
      </q-form>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { accountApi, errorMessage } from '@/api';

const { t } = useI18n();
const $q = useQuasar();
const current = ref('');
const password = ref('');
const confirm = ref('');
const busy = ref(false);

async function submit() {
  busy.value = true;
  try {
    await accountApi.changePassword(current.value, password.value, confirm.value);
    current.value = password.value = confirm.value = '';
    $q.notify({ type: 'positive', message: t('settings.passwordChanged') });
  } catch (e) {
    $q.notify({ type: 'negative', message: errorMessage(e) });
  } finally {
    busy.value = false;
  }
}
</script>
