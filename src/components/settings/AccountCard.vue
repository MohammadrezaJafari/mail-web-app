<template>
  <q-card flat bordered>
    <q-card-section>
      <div class="text-subtitle1 text-weight-medium">{{ t('settings.account') }}</div>
    </q-card-section>
    <q-separator />
    <q-card-section v-if="auth.mailbox" class="row items-center no-wrap">
      <q-avatar size="56px" color="primary" text-color="white" class="text-weight-bold">{{
        auth.initials
      }}</q-avatar>
      <div class="q-ml-md col" style="min-width: 0">
        <div class="text-weight-medium">{{ auth.user?.name }}</div>
        <div class="text-grey" dir="ltr">{{ auth.mailbox.address }}</div>
        <q-badge
          :color="auth.mailbox.status === 'active' ? 'positive' : 'negative'"
          class="q-mt-xs"
          >{{ auth.mailbox.status }}</q-badge
        >
      </div>
    </q-card-section>
    <q-card-section v-if="auth.mailbox">
      <div class="text-caption text-grey q-mb-xs">{{ t('settings.storage') }}</div>
      <storage-meter />
    </q-card-section>
    <template v-if="auth.sharedMailboxes.length">
      <q-separator />
      <q-card-section>
        <div class="text-caption text-grey">{{ t('settings.sharedMailboxes') }}</div>
        <div class="text-caption text-grey-6 q-mb-xs">{{ t('settings.sharedHint') }}</div>
        <q-chip
          v-for="m in auth.sharedMailboxes"
          :key="m.id"
          icon="group"
          outline
          color="primary"
          >{{ m.address }}</q-chip
        >
      </q-card-section>
    </template>
    <q-separator />
    <q-card-actions>
      <q-btn
        flat
        no-caps
        color="primary"
        icon="open_in_new"
        :label="t('nav.webmail')"
        type="a"
        :href="auth.webmailUrl"
        target="_blank"
        rel="noopener"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';
import StorageMeter from '@/components/settings/StorageMeter.vue';

const { t } = useI18n();
const auth = useAuthStore();
</script>
