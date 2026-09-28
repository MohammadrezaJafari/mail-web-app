<template>
  <q-page class="calendar-page row no-wrap q-gutter-x-md">
    <!-- Side: mini controls + calendars -->
    <div class="mail-pane side-pane col-auto">
      <div class="q-pa-md">
        <q-btn
          color="primary"
          unelevated
          no-caps
          icon="add"
          :label="t('calendar.newEvent')"
          class="full-width new-mail-btn"
          @click="openNew()"
        />
      </div>
      <div class="q-px-md q-pb-sm pane-title">{{ t('calendar.calendars') }}</div>
      <q-list dense class="q-px-sm">
        <q-item
          v-for="c in cal.calendars"
          :key="c.id"
          clickable
          class="folder-item"
          @click="cal.toggleCalendar(c.id)"
        >
          <q-item-section side
            ><q-checkbox
              dense
              :model-value="!cal.hidden.includes(c.id)"
              :style="{ color: c.color ?? '#0f6cbd' }"
              @update:model-value="cal.toggleCalendar(c.id)"
          /></q-item-section>
          <q-item-section
            ><q-item-label class="ellipsis">{{ c.name }}</q-item-label></q-item-section
          >
        </q-item>
        <div v-if="!cal.calendars.length && !cal.loading" class="text-caption text-grey q-pa-sm">
          {{ t('calendar.none') }}
        </div>
      </q-list>
    </div>

    <!-- Main -->
    <div class="mail-pane col main-pane">
      <q-toolbar class="q-px-md calendar-toolbar">
        <q-btn flat dense round icon="chevron_left" class="rtl-flip" @click="cal.go(-1)" />
        <q-btn flat dense no-caps :label="t('calendar.today')" @click="cal.today()" />
        <q-btn flat dense round icon="chevron_right" class="rtl-flip" @click="cal.go(1)" />
        <div class="text-h6 q-ml-md text-weight-semibold">{{ title }}</div>
        <q-space />
        <q-btn-toggle
          :model-value="cal.view"
          dense
          unelevated
          no-caps
          rounded
          toggle-color="primary"
          color="grey-2"
          text-color="grey-8"
          :options="[
            { label: t('calendar.month'), value: 'month' },
            { label: t('calendar.week'), value: 'week' },
            { label: t('calendar.agenda'), value: 'agenda' },
          ]"
          @update:model-value="(v) => cal.setView(v)"
        />
      </q-toolbar>
      <q-linear-progress v-if="cal.loading" indeterminate color="primary" size="2px" />
      <q-separator />

      <!-- Month view -->
      <div v-if="cal.view === 'month'" class="month-grid mail-scroll">
        <div class="month-head">
          <div v-for="d in weekdays" :key="d" class="weekday">{{ d }}</div>
        </div>
        <div class="month-body">
          <div
            v-for="day in days"
            :key="day.toISOString()"
            class="day-cell"
            :class="{ outside: day.getMonth() !== cal.cursor.getMonth(), today: sameDay(day, now) }"
            @click="openNew(day)"
          >
            <div class="day-number">{{ day.getDate() }}</div>
            <div class="day-events">
              <div
                v-for="e in eventsForDay(day).slice(0, 3)"
                :key="e.id + e.start"
                class="event-chip ellipsis"
                :class="{ 'all-day': e.all_day }"
                :style="chipStyle(e)"
                @click.stop="openEdit(e)"
              >
                <span v-if="!e.all_day" class="chip-time">{{ timeOf(e.start) }}</span>
                {{ e.summary || t('calendar.untitled') }}
              </div>
              <div v-if="eventsForDay(day).length > 3" class="text-caption text-grey q-pl-xs">
                +{{ eventsForDay(day).length - 3 }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Week view -->
      <div v-else-if="cal.view === 'week'" class="week-view mail-scroll" ref="weekScroller">
        <div class="week-head">
          <div class="time-gutter" />
          <div
            v-for="day in weekDays"
            :key="day.toISOString()"
            class="week-day-head"
            :class="{ today: sameDay(day, now) }"
          >
            <div class="text-caption">
              {{ day.toLocaleDateString(locale, { weekday: 'short' }) }}
            </div>
            <div class="text-subtitle1 text-weight-semibold">{{ day.getDate() }}</div>
            <div class="all-day-row">
              <div
                v-for="e in allDayFor(day)"
                :key="e.id"
                class="event-chip all-day ellipsis"
                :style="chipStyle(e)"
                @click="openEdit(e)"
              >
                {{ e.summary || t('calendar.untitled') }}
              </div>
            </div>
          </div>
        </div>
        <div class="week-body">
          <div class="time-gutter">
            <div v-for="h in 24" :key="h" class="hour-label">{{ hourLabel(h - 1) }}</div>
          </div>
          <div
            v-for="day in weekDays"
            :key="day.toISOString()"
            class="week-day-col"
            @click="openNew(day, $event)"
          >
            <div v-for="h in 24" :key="h" class="hour-line" />
            <div
              v-for="e in timedFor(day)"
              :key="e.id + e.start"
              class="week-event"
              :style="weekEventStyle(e, day)"
              @click.stop="openEdit(e)"
            >
              <div class="text-weight-medium ellipsis">
                {{ e.summary || t('calendar.untitled') }}
              </div>
              <div class="text-caption ellipsis">{{ timeOf(e.start) }} – {{ timeOf(e.end) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Agenda view -->
      <div v-else class="mail-scroll q-pa-md">
        <div v-if="!agenda.length && !cal.loading" class="text-grey text-center q-pa-xl">
          {{ t('calendar.noEvents') }}
        </div>
        <div v-for="group in agenda" :key="group.day" class="q-mb-md">
          <div class="text-subtitle2 text-weight-semibold q-mb-xs">{{ group.label }}</div>
          <q-list bordered separator class="rounded-borders">
            <q-item v-for="e in group.events" :key="e.id + e.start" clickable @click="openEdit(e)">
              <q-item-section side
                ><div class="color-dot" :style="{ background: e.color ?? '#0f6cbd' }"
              /></q-item-section>
              <q-item-section>
                <q-item-label>{{ e.summary || t('calendar.untitled') }}</q-item-label>
                <q-item-label caption
                  >{{ e.all_day ? t('calendar.allDay') : `${timeOf(e.start)} – ${timeOf(e.end)}`
                  }}<span v-if="e.location"> · {{ e.location }}</span></q-item-label
                >
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </div>
    </div>

    <event-dialog
      v-model="dialog"
      :event="editing"
      :initial-date="initialDate"
      :calendars="cal.calendars"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCalendarStore } from '@/stores/calendar';
import type { CalendarEvent } from '@/types/api';
import {
  addDays,
  eventOnDay,
  monthGrid,
  sameDay,
  startOfWeek,
  weekStartFor,
  ymd,
} from '@/utils/dates';
import EventDialog from '@/components/calendar/EventDialog.vue';

const { t, locale } = useI18n();
const cal = useCalendarStore();
const now = new Date();
const dialog = ref(false);
const editing = ref<CalendarEvent | null>(null);
const initialDate = ref<Date | null>(null);
const weekScroller = ref<HTMLElement | null>(null);

watch(
  () => cal.view,
  async (v) => {
    if (v !== 'week') return;
    await nextTick();
    if (weekScroller.value) weekScroller.value.scrollTop = 7 * 48;
  },
  { immediate: true },
);

cal.weekStart = weekStartFor(locale.value);
watch(locale, (l) => {
  cal.weekStart = weekStartFor(l);
  void cal.load(true);
});

onMounted(() => cal.load());

const days = computed(() => monthGrid(cal.cursor, cal.weekStart));
const weekDays = computed(() =>
  Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(cal.cursor, cal.weekStart), i)),
);
const weekdays = computed(() =>
  weekDays.value.map((d) => d.toLocaleDateString(locale.value, { weekday: 'short' })),
);

const title = computed(() => {
  if (cal.view === 'week') {
    const [a, b] = [weekDays.value[0]!, weekDays.value[6]!];
    return `${a.toLocaleDateString(locale.value, { month: 'short', day: 'numeric' })} – ${b.toLocaleDateString(locale.value, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }
  return cal.cursor.toLocaleDateString(locale.value, { month: 'long', year: 'numeric' });
});

function withDates(e: CalendarEvent) {
  return { e, ...cal.eventDates(e) };
}

function eventsForDay(day: Date): CalendarEvent[] {
  return cal.visibleEvents
    .map(withDates)
    .filter(({ start, end }) => eventOnDay(start, end, day))
    .sort(
      (a, b) => Number(b.e.all_day) - Number(a.e.all_day) || a.start.getTime() - b.start.getTime(),
    )
    .map((x) => x.e);
}
const allDayFor = (day: Date) => eventsForDay(day).filter((e) => e.all_day);
const timedFor = (day: Date) => eventsForDay(day).filter((e) => !e.all_day);

const agenda = computed(() => {
  const groups = new Map<string, CalendarEvent[]>();
  for (const e of [...cal.visibleEvents].sort((a, b) => a.start.localeCompare(b.start))) {
    const key = ymd(cal.eventDates(e).start);
    groups.set(key, [...(groups.get(key) ?? []), e]);
  }
  return [...groups.entries()].map(([day, events]) => ({
    day,
    label: new Date(day + 'T00:00:00').toLocaleDateString(locale.value, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }),
    events,
  }));
});

function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit' });
}
function hourLabel(h: number): string {
  const d = new Date();
  d.setHours(h, 0, 0, 0);
  return d.toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit' });
}
function chipStyle(e: CalendarEvent) {
  const color = e.color ?? '#0f6cbd';
  return e.all_day
    ? { background: color, color: '#fff' }
    : { borderInlineStartColor: color, color };
}
function weekEventStyle(e: CalendarEvent, day: Date) {
  const { start, end } = cal.eventDates(e);
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const s = Math.max(0, (start.getTime() - dayStart.getTime()) / 3600000);
  const en = Math.min(24, (end.getTime() - dayStart.getTime()) / 3600000);
  return {
    top: `${s * 48}px`,
    height: `${Math.max(22, (en - s) * 48 - 2)}px`,
    background: (e.color ?? '#0f6cbd') + '22',
    borderInlineStartColor: e.color ?? '#0f6cbd',
  };
}

function openNew(day?: Date, event?: MouseEvent) {
  const d = day ? new Date(day) : new Date();
  if (event) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    d.setHours(
      Math.floor((event.clientY - rect.top + (event.currentTarget as HTMLElement).scrollTop) / 48),
      0,
      0,
      0,
    );
  } else if (!day) {
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
  } else {
    d.setHours(9, 0, 0, 0);
  }
  editing.value = null;
  initialDate.value = d;
  dialog.value = true;
}

function openEdit(e: CalendarEvent) {
  editing.value = e;
  initialDate.value = null;
  dialog.value = true;
}
</script>

<style scoped lang="scss">
.calendar-page {
  height: calc(100vh - 56px);
  overflow: hidden;
  padding: 16px 16px 16px 0;
}
html[dir='rtl'] .calendar-page {
  padding: 16px 0 16px 16px;
}
.side-pane {
  width: 240px;
}
.main-pane {
  min-width: 0;
}
.new-mail-btn {
  border-radius: 12px;
  height: 42px;
  font-weight: 600;
}
.folder-item {
  border-radius: 10px;
}
.calendar-toolbar {
  min-height: 52px;
}
html[dir='rtl'] .rtl-flip {
  transform: scaleX(-1);
}

// month
.month-head,
.month-body {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}
.weekday {
  padding: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--mail-muted);
  text-align: center;
  border-bottom: 1px solid var(--mail-border);
}
.day-cell {
  min-height: 110px;
  border-bottom: 1px solid var(--mail-border);
  border-inline-end: 1px solid var(--mail-border);
  padding: 4px;
  cursor: pointer;
  &:hover {
    background: var(--mail-hover);
  }
  &.outside {
    color: var(--mail-muted);
    background: var(--mail-surface-2);
  }
}
.day-number {
  font-size: 13px;
  font-weight: 600;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 50%;
}
.today .day-number {
  background: var(--mail-primary);
  color: #fff;
}
.event-chip {
  font-size: 12px;
  padding: 1px 6px;
  border-radius: 6px;
  margin-top: 2px;
  border-inline-start: 3px solid;
  background: var(--mail-surface-2);
  cursor: pointer;
  &.all-day {
    border: 0;
  }
}
.chip-time {
  opacity: 0.8;
  font-size: 11px;
}

// week
.week-head,
.week-body {
  display: grid;
  grid-template-columns: 56px repeat(7, 1fr);
}
.week-head {
  border-bottom: 1px solid var(--mail-border);
  position: sticky;
  top: 0;
  background: var(--mail-surface);
  z-index: 2;
}
.week-day-head {
  text-align: center;
  padding: 6px 4px 4px;
  border-inline-start: 1px solid var(--mail-border);
  &.today .text-subtitle1 {
    color: var(--mail-primary);
  }
}
.all-day-row {
  min-height: 20px;
}
.time-gutter .hour-label {
  height: 48px;
  font-size: 11px;
  color: var(--mail-muted);
  text-align: end;
  padding-inline-end: 6px;
  transform: translateY(-7px);
}
.time-gutter .hour-label:first-child {
  transform: none;
  line-height: 16px;
}
.week-day-col {
  position: relative;
  border-inline-start: 1px solid var(--mail-border);
  cursor: pointer;
}
.hour-line {
  height: 48px;
  border-bottom: 1px solid var(--mail-border);
}
.week-event {
  position: absolute;
  inset-inline: 3px;
  border-radius: 6px;
  border-inline-start: 3px solid;
  padding: 2px 6px;
  font-size: 12px;
  overflow: hidden;
  cursor: pointer;
}
.color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
</style>
