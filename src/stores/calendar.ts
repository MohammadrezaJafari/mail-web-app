import { defineStore, acceptHMRUpdate } from 'pinia';
import { calendarApi } from '@/api';
import type { Calendar, CalendarEvent, EventPayload } from '@/types/api';
import { addDays, addMonths, monthGrid, parseEventDate, startOfWeek } from '@/utils/dates';

export type CalendarView = 'month' | 'week' | 'agenda';

export const useCalendarStore = defineStore('calendar', {
  state: () => ({
    calendars: [] as Calendar[],
    events: [] as CalendarEvent[],
    view: 'month',
    cursor: new Date(),
    weekStart: 1,
    loading: false,
    hidden: [] as string[], // calendar ids toggled off
    rangeKey: '',
  }),

  getters: {
    visibleEvents: (s) => s.events.filter((e) => !s.hidden.includes(e.calendar_id)),
    range(s): { start: Date; end: Date } {
      if (s.view === 'month') {
        const grid = monthGrid(s.cursor, s.weekStart);
        return { start: grid[0]!, end: addDays(grid[41]!, 1) };
      }
      if (s.view === 'week') {
        const start = startOfWeek(s.cursor, s.weekStart);
        return { start, end: addDays(start, 7) };
      }
      const start = new Date(s.cursor);
      start.setHours(0, 0, 0, 0);
      return { start, end: addDays(start, 30) };
    },
  },

  actions: {
    async load(force = false) {
      const { start, end } = this.range;
      const key = `${this.view}:${start.toISOString()}:${end.toISOString()}`;
      if (!force && key === this.rangeKey) return;
      this.loading = true;
      try {
        const result = await calendarApi.events(start.toISOString(), end.toISOString());
        this.events = result.data;
        this.calendars = result.calendars;
        this.rangeKey = key;
      } finally {
        this.loading = false;
      }
    },

    async go(delta: number) {
      if (this.view === 'month') this.cursor = addMonths(this.cursor, delta);
      else if (this.view === 'week') this.cursor = addDays(this.cursor, delta * 7);
      else this.cursor = addDays(this.cursor, delta * 30);
      await this.load();
    },

    async today() {
      this.cursor = new Date();
      await this.load();
    },

    async setView(view: CalendarView) {
      this.view = view;
      await this.load();
    },

    toggleCalendar(id: string) {
      this.hidden = this.hidden.includes(id)
        ? this.hidden.filter((h) => h !== id)
        : [...this.hidden, id];
    },

    async create(payload: EventPayload) {
      await calendarApi.create(payload);
      await this.load(true);
    },

    async update(id: string, payload: EventPayload) {
      await calendarApi.update(id, payload);
      await this.load(true);
    },

    async remove(id: string) {
      await calendarApi.delete(id);
      this.events = this.events.filter((e) => e.id !== id);
    },

    eventDates(e: CalendarEvent): { start: Date; end: Date } {
      return { start: parseEventDate(e.start, e.all_day), end: parseEventDate(e.end, e.all_day) };
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCalendarStore, import.meta.hot));
}
