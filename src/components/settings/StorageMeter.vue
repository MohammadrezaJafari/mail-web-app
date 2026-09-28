<template>
  <div v-if="auth.mailbox">
    <div class="row items-center text-caption" :class="{ 'text-grey': compact }">
      <q-icon name="cloud" size="16px" class="q-mr-xs" />
      <span>{{
        t('settings.storageUsed', {
          used: fileSize(auth.mailbox.used_bytes),
          total: fileSize(auth.mailbox.quota_bytes),
        })
      }}</span>
    </div>
    <q-linear-progress
      :value="auth.mailbox.usage_percent / 100"
      :color="color"
      rounded
      size="6px"
      class="q-mt-xs"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';
import { fileSize } from '@/utils/format';

defineProps<{ compact?: boolean }>();
const { t } = useI18n();
const auth = useAuthStore();
const color = computed(() => {
  const p = auth.mailbox?.usage_percent ?? 0;
  return p > 90 ? 'negative' : p > 75 ? 'warning' : 'primary';
});
</script>
