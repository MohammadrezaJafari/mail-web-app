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
      new-value-mode="add-unique"
      input-debounce="0"
      class="col"
      :autofocus="autofocus"
      :placeholder="modelValue.length ? '' : t('compose.addRecipient')"
      @update:model-value="onUpdate"
      @new-value="onNew"
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
    </q-select>
    <slot name="after" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { isEmail } from '@/utils/format';

defineProps<{ modelValue: string[]; label: string; autofocus?: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>();
const { t } = useI18n();
const $q = useQuasar();

function onUpdate(value: string[]) {
  emit('update:modelValue', value);
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
  parts.filter(isEmail).forEach((p) => done(p, 'add-unique'));
  if (!parts.length) done();
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
