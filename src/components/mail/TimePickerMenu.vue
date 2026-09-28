<template>
  <q-menu class="rounded-menu" @before-show="custom = toLocalInput(presetDate('laterToday'))">
    <q-list dense style="min-width: 240px" class="q-py-xs">
      <q-item-label header class="text-caption">{{ title }}</q-item-label>
      <q-item
        v-for="p in presets"
        :key="p"
        clickable
        v-close-popup
        @click="emit('pick', presetDate(p))"
      >
        <q-item-section>{{ t(`snooze.${p}`) }}</q-item-section>
        <q-item-section side class="text-caption">{{ short(presetDate(p)) }}</q-item-section>
      </q-item>
      <q-separator class="q-my-xs" />
      <q-item>
        <q-item-section>
          <q-input
            v-model="custom"
            dense
            outlined
            type="datetime-local"
            :label="t('snooze.custom')"
            stack-label
          />
        </q-item-section>
        <q-item-section side>
          <q-btn
            dense
            flat
            round
            icon="check"
            color="primary"
            v-close-popup
            :disable="!custom || new Date(custom) <= new Date()"
            @click="emit('pick', new Date(custom))"
          />
        </q-item-section>
      </q-item>
    </q-list>
  </q-menu>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { presetDate, toLocalInput, type PresetKey } from '@/utils/snooze';

defineProps<{ title: string }>();
const emit = defineEmits<{ pick: [date: Date] }>();
const { t, locale } = useI18n();
const presets: PresetKey[] = ['laterToday', 'tomorrow', 'weekend', 'nextWeek'];
const custom = ref('');

function short(d: Date): string {
  return d.toLocaleString(locale.value, { weekday: 'short', hour: '2-digit', minute: '2-digit' });
}
</script>
