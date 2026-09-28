<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(v) => emit('update:modelValue', v)"
    @before-show="load"
  >
    <q-card style="width: 560px; max-width: 95vw" class="rounded-card">
      <q-card-section class="row items-center">
        <div class="text-subtitle1 text-weight-semibold">{{ t('deferred.title') }}</div>
        <q-space />
        <q-btn flat dense round icon="close" v-close-popup />
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div class="text-caption text-grey text-weight-medium q-mb-xs">
          {{ t('deferred.scheduled') }}
        </div>
        <q-list v-if="scheduled.length" separator dense>
          <q-item v-for="m in scheduled" :key="m.id">
            <q-item-section avatar
              ><q-icon name="schedule_send" :color="m.status === 'failed' ? 'negative' : 'primary'"
            /></q-item-section>
            <q-item-section>
              <q-item-label class="ellipsis">{{ m.subject || t('mail.noSubject') }}</q-item-label>
              <q-item-label caption dir="ltr">{{ m.to.join(', ') }}</q-item-label>
              <q-item-label caption :class="m.status === 'failed' ? 'text-negative' : ''">
                {{ m.status === 'failed' ? m.error : fullDate(m.send_at, locale) }}
              </q-item-label>
            </q-item-section>
            <q-item-section side
              ><q-btn flat dense round icon="delete" color="grey" @click="cancel(m.id)"
            /></q-item-section>
          </q-item>
        </q-list>
        <div v-else class="text-caption text-grey">{{ t('deferred.noneScheduled') }}</div>

        <div class="text-caption text-grey text-weight-medium q-mt-md q-mb-xs">
          {{ t('deferred.snoozed') }}
        </div>
        <q-list v-if="snoozed.length" separator dense>
          <q-item v-for="s in snoozed" :key="s.id">
            <q-item-section avatar><q-icon name="snooze" color="warning" /></q-item-section>
            <q-item-section>
              <q-item-label class="ellipsis">{{ s.subject || t('mail.noSubject') }}</q-item-label>
              <q-item-label caption
                >{{ fullDate(s.wake_at, locale) }} · {{ s.origin_folder }}</q-item-label
              >
            </q-item-section>
          </q-item>
        </q-list>
        <div v-else class="text-caption text-grey">{{ t('deferred.noneSnoozed') }}</div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { errorMessage, mailApi } from '@/api';
import { fullDate } from '@/utils/format';
import type { ScheduledMessage, SnoozedItem } from '@/types/api';

defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();
const { t, locale } = useI18n();
const $q = useQuasar();
const scheduled = ref<ScheduledMessage[]>([]);
const snoozed = ref<SnoozedItem[]>([]);

async function load() {
  try {
    [scheduled.value, snoozed.value] = await Promise.all([mailApi.scheduled(), mailApi.snoozed()]);
  } catch (e) {
    $q.notify({ type: 'negative', message: errorMessage(e) });
  }
}

async function cancel(id: number) {
  try {
    await mailApi.cancelScheduled(id);
    scheduled.value = scheduled.value.filter((m) => m.id !== id);
  } catch (e) {
    $q.notify({ type: 'negative', message: errorMessage(e) });
  }
}
</script>

<style scoped>
.rounded-card {
  border-radius: 14px;
}
</style>
