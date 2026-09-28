<template>
  <q-card flat class="settings-card">
    <q-card-section class="card-head row items-center no-wrap">
      <div class="card-icon"><q-icon name="notifications_active" size="20px" /></div>
      <div class="col">
        <div class="text-subtitle1 text-weight-semibold">{{ t('settings.notifications') }}</div>
        <div class="text-caption text-grey">{{ t('settings.notificationsHint') }}</div>
      </div>
      <q-toggle
        :model-value="enabled"
        :disable="!supported"
        :label="t('settings.enabled')"
        @update:model-value="toggle"
      />
    </q-card-section>
    <q-card-section v-if="!supported" class="text-caption text-grey">{{
      t('settings.notificationsUnsupported')
    }}</q-card-section>
    <q-card-section v-else-if="denied" class="text-caption text-negative">{{
      t('settings.notificationsDenied')
    }}</q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  notificationsEnabled,
  notificationsSupported,
  setNotificationsEnabled,
} from '@/utils/notifications';

const { t } = useI18n();
const supported = notificationsSupported();
const enabled = ref(notificationsEnabled());
const permission = ref(supported ? Notification.permission : 'default');
const denied = computed(() => permission.value === 'denied');

async function toggle(value: boolean) {
  enabled.value = await setNotificationsEnabled(value);
  if (supported) permission.value = Notification.permission;
}
</script>
