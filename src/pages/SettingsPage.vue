<template>
  <q-page class="q-pa-lg settings-page">
    <div class="row items-center q-mb-lg">
      <div class="page-icon"><q-icon name="tune" size="22px" /></div>
      <div class="q-ml-md">
        <div class="text-h5 text-weight-bold">{{ t('settings.title') }}</div>
        <div class="text-caption text-grey-7" dir="ltr">{{ auth.mailbox?.address }}</div>
      </div>
    </div>

    <q-banner
      v-if="auth.mailbox?.status === 'suspended'"
      class="bg-orange-1 text-orange-10 q-mb-md"
      rounded
    >
      {{ t('settings.suspended') }}
    </q-banner>

    <div class="row q-col-gutter-lg">
      <div class="col-12 col-md-6 column q-gutter-y-lg">
        <account-card />
        <aliases-card />
        <password-card />
        <rules-card />
      </div>
      <div class="col-12 col-md-6 column q-gutter-y-lg">
        <forwarding-card />
        <auto-reply-card />
        <signature-card />
        <notifications-card />
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
import NotificationsCard from '@/components/settings/NotificationsCard.vue';
import RulesCard from '@/components/settings/RulesCard.vue';

const { t } = useI18n();
const auth = useAuthStore();

onMounted(() => {
  auth.refreshMailbox().catch(() => undefined);
});
</script>

<style scoped lang="scss">
.settings-page {
  max-width: 1180px;
}
.page-icon {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: #fff;
  background: linear-gradient(135deg, #0f6cbd, #7160e8);
  box-shadow: 0 6px 16px rgba(15, 108, 189, 0.3);
}
</style>
