<template>
  <div class="row items-center no-wrap recipient-row">
    <span class="text-grey q-mr-sm recipient-label">{{ label }}</span>
    <q-select
      :model-value="modelValue"
      dense
      borderless
      multiple
      use-input
      use-chips
      hide-dropdown-icon
      input-debounce="150"
      class="col"
      :autofocus="autofocus"
      :options="options"
      option-value="email"
      :loading="loading"
      :placeholder="modelValue.length ? '' : t('compose.addRecipient')"
      @filter="onFilter"
      @update:model-value="onUpdate"
      @new-value="onNew"
      @keydown.enter="onEnter"
    >
      <template #selected-item="scope">
        <q-chip
          dense
          removable
          :color="isEmail(scope.opt) ? 'blue-1' : 'red-1'"
          text-color="dark"
          @remove="scope.removeAtIndex(scope.index)"
        >
          {{ scope.opt }}
        </q-chip>
      </template>
      <template #option="scope">
        <q-item v-bind="scope.itemProps" dense>
          <q-item-section avatar>
            <q-avatar
              size="28px"
              text-color="white"
              class="text-caption text-weight-bold"
              :style="{ background: avatarColor(scope.opt.email) }"
            >
              {{ initials({ name: scope.opt.name ?? '', email: scope.opt.email }) }}
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ scope.opt.name || scope.opt.email }}</q-item-label>
            <q-item-label caption dir="ltr" v-if="scope.opt.name">{{
              scope.opt.email
            }}</q-item-label>
          </q-item-section>
          <q-item-section side v-if="scope.opt.source === 'directory'">
            <q-icon name="corporate_fare" size="16px" color="grey-6"
              ><q-tooltip>{{ t('compose.directory') }}</q-tooltip></q-icon
            >
          </q-item-section>
        </q-item>
      </template>
      <template #no-option>
        <div class="q-pa-sm text-caption text-grey">{{ t('compose.typeAddress') }}</div>
      </template>
    </q-select>
    <slot name="after" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { contactsApi } from '@/api';
import { avatarColor, initials, isEmail } from '@/utils/format';
import type { ContactSuggestion } from '@/types/api';

defineProps<{ modelValue: string[]; label: string; autofocus?: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>();
const { t } = useI18n();
const $q = useQuasar();

const options = ref<ContactSuggestion[]>([]);
const loading = ref(false);
let lastQuery = '';

function onFilter(input: string, update: (fn: () => void) => void, abort: () => void) {
  const q = input.trim();
  lastQuery = q;
  if (q.length < 1) {
    update(() => (options.value = []));
    return;
  }
  loading.value = true;
  contactsApi
    .search(q)
    .then((list) => {
      if (q !== lastQuery) return;
      update(() => (options.value = list));
    })
    .catch(() => abort())
    .finally(() => (loading.value = false));
}

function onUpdate(value: Array<string | ContactSuggestion>) {
  // Selecting a suggestion yields the object; normalise everything to the address.
  const emails = value
    .map((v) => (typeof v === 'string' ? v : v.email))
    .map((e) => e.trim().toLowerCase());
  emit('update:modelValue', [...new Set(emails)]);
}

function onNew(
  input: string,
  done: (item?: string, mode?: 'add' | 'add-unique' | 'toggle') => void,
) {
  const parts = input
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const bad = parts.filter((p) => !isEmail(p));
  if (bad.length)
    $q.notify({ type: 'warning', message: `${t('compose.invalidAddress')}: ${bad.join(', ')}` });
  parts.filter(isEmail).forEach((p) => done(p.toLowerCase(), 'add-unique'));
  if (!parts.length) done();
}

function onEnter() {
  options.value = [];
}
</script>

<style scoped>
.recipient-row {
  border-bottom: 1px solid var(--mail-border);
  min-height: 36px;
}
.recipient-label {
  min-width: 36px;
}
</style>
