<template>
  <q-page class="q-pa-md settings-page">
    <div class="text-h5 q-mb-md">{{ t('settings.title') }}</div>

    <q-banner
      v-if="auth.mailbox?.status === 'suspended'"
      class="bg-orange-1 text-orange-10 q-mb-md"
      rounded
    >
      {{ t('settings.suspended') }}
    </q-banner>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-6">
        <account-card />
        <aliases-card class="q-mt-md" />
        <password-card class="q-mt-md" />
      </div>
      <div class="col-12 col-md-6">
        <forwarding-card />
        <auto-reply-card class="q-mt-md" />
        <signature-card class="q-mt-md" />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';
import AccountCard from '@/components/settings/AccountCard.vue';
import AliasesCard from '@/components/settings/AliasesCard.vue';
import PasswordCard from '@/components/settings/PasswordCard.vue';
import ForwardingCard from '@/components/settings/ForwardingCard.vue';
import AutoReplyCard from '@/components/settings/AutoReplyCard.vue';
import SignatureCard from '@/components/settings/SignatureCard.vue';

const { t } = useI18n();
const auth = useAuthStore();

onMounted(() => {
  auth.refreshMailbox().catch(() => undefined);
});
</script>

<style scoped>
.settings-page {
  max-width: 1200px;
}
</style>
