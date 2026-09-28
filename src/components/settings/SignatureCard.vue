<template>
  <q-card flat class="settings-card">
    <q-card-section class="card-head">
      <div class="card-icon"><q-icon name="draw" size="20px" /></div>
      <div class="col">
        <div class="text-subtitle1 text-weight-semibold">{{ t('settings.signature') }}</div>
        <div class="text-caption text-grey">{{ t('settings.signatureHint') }}</div>
      </div>
    </q-card-section>
    <q-separator />
    <q-card-section>
      <q-input v-model="signature" type="textarea" outlined autogrow />
    </q-card-section>
    <q-separator />
    <q-card-actions>
      <q-btn
        color="primary"
        unelevated
        no-caps
        :label="t('settings.save')"
        :loading="busy"
        @click="save"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useAuthStore } from '@/stores/auth';
import { errorMessage } from '@/api';
import { useMailboxSettings } from '@/components/settings/useMailboxSettings';

const { t } = useI18n();
const $q = useQuasar();
const auth = useAuthStore();
const { busy, update } = useMailboxSettings();
const signature = ref(auth.mailbox?.signature ?? '');

watch(
  () => auth.mailbox?.signature,
  (v) => (signature.value = v ?? ''),
);

async function save() {
  try {
    await update({ signature: signature.value || null });
    $q.notify({ type: 'positive', message: t('settings.saved') });
  } catch (e) {
    $q.notify({ type: 'negative', message: errorMessage(e) });
  }
}
</script>
