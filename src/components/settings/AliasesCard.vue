<template>
  <q-card flat bordered>
    <q-card-section>
      <div class="text-subtitle1 text-weight-medium">{{ t('settings.aliases') }}</div>
      <div class="text-caption text-grey">{{ t('settings.aliasesHint') }}</div>
    </q-card-section>
    <q-separator />
    <q-list separator>
      <q-item v-for="a in auth.mailbox?.aliases ?? []" :key="a.id">
        <q-item-section avatar><q-icon name="alternate_email" /></q-item-section>
        <q-item-section
          ><q-item-label dir="ltr">{{ a.address }}</q-item-label></q-item-section
        >
        <q-item-section side>
          <q-btn flat dense round icon="delete" color="grey" @click="remove(a.id)"
            ><q-tooltip>{{ t('settings.remove') }}</q-tooltip></q-btn
          >
        </q-item-section>
      </q-item>
    </q-list>
    <q-separator />
    <q-card-section>
      <q-form class="row items-start no-wrap q-gutter-sm" @submit.prevent="add">
        <q-input
          v-model="localPart"
          dense
          outlined
          class="col"
          :label="t('settings.aliasName')"
          :suffix="'@' + (auth.mailbox?.domain ?? '')"
          dir="ltr"
          :rules="[(v) => /^[a-z0-9._+-]+$/i.test(v) || '']"
        />
        <q-btn
          type="submit"
          color="primary"
          unelevated
          no-caps
          :label="t('settings.addAlias')"
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
import { useAuthStore } from '@/stores/auth';
import { accountApi, errorMessage } from '@/api';

const { t } = useI18n();
const $q = useQuasar();
const auth = useAuthStore();
const localPart = ref('');
const busy = ref(false);

async function add() {
  if (!localPart.value) return;
  busy.value = true;
  try {
    await accountApi.createAlias(localPart.value.trim().toLowerCase());
    localPart.value = '';
    await auth.refreshMailbox();
    $q.notify({ type: 'positive', message: t('settings.aliasAdded') });
  } catch (e) {
    $q.notify({ type: 'negative', message: errorMessage(e) });
  } finally {
    busy.value = false;
  }
}

function remove(id: number) {
  $q.dialog({ title: t('settings.remove'), message: t('common.confirm') + '?', cancel: true }).onOk(
    () => {
      accountApi
        .deleteAlias(id)
        .then(() => auth.refreshMailbox())
        .then(
          () => $q.notify({ type: 'positive', message: t('settings.aliasRemoved') }),
          (e) => $q.notify({ type: 'negative', message: errorMessage(e) }),
        );
    },
  );
}
</script>
