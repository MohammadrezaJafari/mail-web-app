<template>
  <q-dialog :model-value="modelValue" @update:model-value="(v) => emit('update:modelValue', v)">
    <q-card style="min-width: 420px; max-width: 92vw" class="rounded-card">
      <q-card-section class="row items-center">
        <div class="text-subtitle1 text-weight-semibold">{{ t('shortcuts.title') }}</div>
        <q-space />
        <q-btn flat dense round icon="close" v-close-popup />
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div v-for="group in groups" :key="group.title" class="q-mb-md">
          <div class="text-caption text-grey text-weight-medium q-mb-xs">{{ group.title }}</div>
          <div v-for="item in group.items" :key="item.label" class="row items-center q-py-xs">
            <div class="col">{{ item.label }}</div>
            <div class="row q-gutter-xs">
              <kbd v-for="k in item.keys" :key="k" class="kbd">{{ k }}</kbd>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();
const { t } = useI18n();

const groups = computed(() => [
  {
    title: t('shortcuts.navigation'),
    items: [
      { label: t('shortcuts.next'), keys: ['j', '↓'] },
      { label: t('shortcuts.prev'), keys: ['k', '↑'] },
      { label: t('shortcuts.search'), keys: ['/'] },
      { label: t('shortcuts.close'), keys: ['Esc'] },
      { label: t('shortcuts.help'), keys: ['?'] },
    ],
  },
  {
    title: t('shortcuts.actions'),
    items: [
      { label: t('mail.newMail'), keys: ['c', 'n'] },
      { label: t('mail.reply'), keys: ['r'] },
      { label: t('mail.replyAll'), keys: ['a'] },
      { label: t('mail.forward'), keys: ['f'] },
      { label: t('mail.archive'), keys: ['e'] },
      { label: t('mail.delete'), keys: ['Del', '#'] },
      { label: t('shortcuts.toggleRead'), keys: ['u'] },
      { label: t('shortcuts.toggleFlag'), keys: ['s'] },
    ],
  },
]);
</script>

<style scoped>
.rounded-card {
  border-radius: 14px;
}
.kbd {
  display: inline-block;
  min-width: 26px;
  padding: 2px 7px;
  border-radius: 6px;
  border: 1px solid var(--mail-border);
  background: var(--mail-surface-2);
  font-family: inherit;
  font-size: 12px;
  text-align: center;
  box-shadow: 0 1px 0 var(--mail-border);
}
</style>
