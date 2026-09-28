<template>
  <q-card flat bordered>
    <q-card-section class="row items-center no-wrap">
      <div class="col">
        <div class="text-subtitle1 text-weight-medium">{{ t('settings.autoReply') }}</div>
        <div class="text-caption text-grey">{{ t('settings.autoReplyHint') }}</div>
      </div>
      <q-toggle v-model="enabled" :label="t('settings.enabled')" />
    </q-card-section>
    <q-separator />
    <q-card-section class="q-gutter-sm">
      <q-input
        v-model="subject"
        dense
        outlined
        :label="t('settings.autoReplySubject')"
        :disable="!enabled"
      />
      <q-input
        v-model="body"
        type="textarea"
        outlined
        autogrow
        :label="t('settings.autoReplyBody')"
        :disable="!enabled"
      />
      <div class="row q-col-gutter-sm">
        <q-input
          v-model="startsAt"
          dense
          outlined
          type="datetime-local"
          class="col-6"
          :label="t('settings.startsAt')"
          :disable="!enabled"
          stack-label
        />
        <q-input
          v-model="endsAt"
          dense
          outlined
          type="datetime-local"
          class="col-6"
          :label="t('settings.endsAt')"
          :disable="!enabled"
          stack-label
        />
      </div>
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

const toLocal = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : '');
const toIso = (local: string) => (local ? new Date(local).toISOString() : null);

const enabled = ref(auth.mailbox?.auto_reply_enabled ?? false);
const subject = ref(auth.mailbox?.auto_reply_subject ?? '');
const body = ref(auth.mailbox?.auto_reply_body ?? '');
const startsAt = ref(toLocal(auth.mailbox?.auto_reply_starts_at ?? null));
const endsAt = ref(toLocal(auth.mailbox?.auto_reply_ends_at ?? null));

watch(
  () => auth.mailbox,
  (m) => {
    if (!m) return;
    enabled.value = m.auto_reply_enabled;
    subject.value = m.auto_reply_subject ?? '';
    body.value = m.auto_reply_body ?? '';
    startsAt.value = toLocal(m.auto_reply_starts_at);
    endsAt.value = toLocal(m.auto_reply_ends_at);
  },
);

async function save() {
  try {
    await update({
      auto_reply_enabled: enabled.value,
      auto_reply_subject: subject.value || null,
      auto_reply_body: body.value || null,
      auto_reply_starts_at: toIso(startsAt.value),
      auto_reply_ends_at: toIso(endsAt.value),
    });
    $q.notify({ type: 'positive', message: t('settings.saved') });
  } catch (e) {
    $q.notify({ type: 'negative', message: errorMessage(e) });
  }
}
</script>
