<template>
  <q-card flat bordered>
    <q-card-section>
      <div class="text-subtitle1 text-weight-medium">{{ t('settings.forwarding') }}</div>
      <div class="text-caption text-grey">{{ t('settings.forwardingHint') }}</div>
    </q-card-section>
    <q-separator />
    <q-card-section class="q-gutter-sm">
      <q-select
        v-model="targets"
        dense
        outlined
        multiple
        use-input
        use-chips
        hide-dropdown-icon
        new-value-mode="add-unique"
        :label="t('settings.forwardTo')"
        dir="ltr"
        @new-value="onNew"
      />
      <q-toggle v-model="keepCopy" :label="t('settings.keepCopy')" />
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
import { isEmail } from '@/utils/format';
import { useMailboxSettings } from '@/components/settings/useMailboxSettings';

const { t } = useI18n();
const $q = useQuasar();
const auth = useAuthStore();
const { busy, update } = useMailboxSettings();

const targets = ref<string[]>([...(auth.mailbox?.forwarding_to ?? [])]);
const keepCopy = ref(auth.mailbox?.forwarding_keep_copy ?? true);

watch(
  () => auth.mailbox,
  (m) => {
    if (!m) return;
    targets.value = [...m.forwarding_to];
    keepCopy.value = m.forwarding_keep_copy;
  },
);

function onNew(
  input: string,
  done: (item?: string, mode?: 'add' | 'add-unique' | 'toggle') => void,
) {
  const v = input.trim().toLowerCase();
  if (!isEmail(v)) {
    $q.notify({ type: 'warning', message: t('compose.invalidAddress') });
    done();
    return;
  }
  done(v, 'add-unique');
}

async function save() {
  try {
    await update({ forwarding_to: targets.value, forwarding_keep_copy: keepCopy.value });
    $q.notify({ type: 'positive', message: t('settings.saved') });
  } catch (e) {
    $q.notify({ type: 'negative', message: errorMessage(e) });
  }
}
</script>
