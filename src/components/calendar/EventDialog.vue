<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(v) => emit('update:modelValue', v)"
    @before-show="reset"
  >
    <q-card style="width: 560px; max-width: 95vw" class="rounded-card">
      <q-card-section class="row items-center">
        <div class="text-subtitle1 text-weight-semibold">
          {{ event ? t('calendar.editEvent') : t('calendar.newEvent') }}
        </div>
        <q-space />
        <q-btn v-if="event" flat dense round icon="delete" color="negative" @click="remove" />
        <q-btn flat dense round icon="close" v-close-popup />
      </q-card-section>
      <q-separator />
      <q-card-section class="q-gutter-y-sm">
        <q-input v-model="form.summary" dense outlined autofocus :label="t('calendar.title')" />
        <q-select
          v-if="!event"
          v-model="form.calendar_id"
          dense
          outlined
          emit-value
          map-options
          :options="calendars.map((c) => ({ label: c.name, value: c.id }))"
          :label="t('calendar.calendar')"
        />
        <q-toggle v-model="form.all_day" :label="t('calendar.allDay')" />
        <div class="row q-col-gutter-sm">
          <q-input
            v-model="form.start"
            dense
            outlined
            class="col-6"
            :type="form.all_day ? 'date' : 'datetime-local'"
            :label="t('calendar.starts')"
            stack-label
          />
          <q-input
            v-model="form.end"
            dense
            outlined
            class="col-6"
            :type="form.all_day ? 'date' : 'datetime-local'"
            :label="t('calendar.ends')"
            stack-label
          />
        </div>
        <q-input v-model="form.location" dense outlined :label="t('calendar.location')"
          ><template #prepend><q-icon name="place" /></template
        ></q-input>
        <q-input
          v-model="form.description"
          type="textarea"
          outlined
          autogrow
          :label="t('calendar.description')"
        />
        <div v-if="event?.recurring" class="text-caption text-warning">
          {{ t('calendar.recurringHint') }}
        </div>
      </q-card-section>
      <q-separator />
      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat no-caps :label="t('common.cancel')" v-close-popup />
        <q-btn
          color="primary"
          unelevated
          no-caps
          :label="t('settings.save')"
          :loading="busy"
          :disable="!valid"
          @click="save"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useCalendarStore } from '@/stores/calendar';
import { errorMessage } from '@/api';
import type { Calendar, CalendarEvent } from '@/types/api';
import { addDays, toLocalInput, ymd } from '@/utils/dates';

const props = defineProps<{
  modelValue: boolean;
  event: CalendarEvent | null;
  initialDate: Date | null;
  calendars: Calendar[];
}>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();
const { t } = useI18n();
const $q = useQuasar();
const cal = useCalendarStore();
const busy = ref(false);

const form = reactive({
  summary: '',
  calendar_id: '',
  all_day: false,
  start: '',
  end: '',
  location: '',
  description: '',
});

function reset() {
  const e = props.event;
  if (e) {
    const { start, end } = cal.eventDates(e);
    Object.assign(form, {
      summary: e.summary,
      calendar_id: e.calendar_id,
      all_day: e.all_day,
      start: e.all_day ? ymd(start) : toLocalInput(start),
      end: e.all_day ? ymd(addDays(end, -1)) : toLocalInput(end),
      location: e.location,
      description: e.description,
    });
  } else {
    const start = props.initialDate ?? new Date();
    const end = new Date(start.getTime() + 3600000);
    Object.assign(form, {
      summary: '',
      calendar_id: props.calendars[0]?.id ?? '',
      all_day: false,
      start: toLocalInput(start),
      end: toLocalInput(end),
      location: '',
      description: '',
    });
  }
}

const valid = computed(
  () =>
    form.summary.trim() !== '' &&
    form.start !== '' &&
    form.end !== '' &&
    (props.event || form.calendar_id),
);

function payload() {
  if (form.all_day) {
    // DTEND for all-day events is exclusive: add one day to the inclusive end shown to the user.
    const endExclusive = ymd(addDays(new Date(form.end + 'T00:00:00'), 1));
    return {
      summary: form.summary.trim(),
      description: form.description,
      location: form.location,
      start: form.start,
      end: endExclusive,
      all_day: true,
      calendar_id: form.calendar_id,
    };
  }
  return {
    summary: form.summary.trim(),
    description: form.description,
    location: form.location,
    start: new Date(form.start).toISOString(),
    end: new Date(form.end).toISOString(),
    all_day: false,
    calendar_id: form.calendar_id,
  };
}

async function save() {
  busy.value = true;
  try {
    if (props.event) await cal.update(props.event.id, payload());
    else await cal.create(payload());
    $q.notify({ type: 'positive', message: t('settings.saved') });
    emit('update:modelValue', false);
  } catch (e) {
    $q.notify({ type: 'negative', message: errorMessage(e) });
  } finally {
    busy.value = false;
  }
}

function remove() {
  if (!props.event) return;
  const id = props.event.id;
  $q.dialog({
    title: t('calendar.deleteEvent'),
    message: props.event.summary,
    cancel: true,
    ok: t('mail.delete'),
  }).onOk(() => {
    cal.remove(id).then(
      () => emit('update:modelValue', false),
      (e) => $q.notify({ type: 'negative', message: errorMessage(e) }),
    );
  });
}
</script>

<style scoped>
.rounded-card {
  border-radius: 14px;
}
</style>
