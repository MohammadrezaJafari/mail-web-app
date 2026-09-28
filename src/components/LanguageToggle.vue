<template>
  <q-btn-dropdown flat dense no-caps icon="translate" :label="current.label">
    <q-list dense>
      <q-item
        v-for="opt in options"
        :key="opt.value"
        clickable
        v-close-popup
        @click="select(opt.value)"
      >
        <q-item-section>{{ opt.label }}</q-item-section>
        <q-item-section side v-if="opt.value === locale"
          ><q-icon name="check" size="xs"
        /></q-item-section>
      </q-item>
    </q-list>
  </q-btn-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { applyLocale, type MessageLanguages } from '@/boot/i18n';

const { locale } = useI18n();

const options: { value: MessageLanguages; label: string }[] = [
  { value: 'en-US', label: 'English' },
  { value: 'fa-IR', label: 'فارسی' },
];

const current = computed(() => options.find((o) => o.value === locale.value) ?? options[0]!);

function select(value: MessageLanguages) {
  applyLocale(value);
}
</script>
