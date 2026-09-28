/** Snooze / schedule presets, computed at call time. */
export type PresetKey = 'laterToday' | 'tomorrow' | 'weekend' | 'nextWeek';

export function presetDate(key: PresetKey, now = new Date()): Date {
  const d = new Date(now);
  d.setSeconds(0, 0);
  switch (key) {
    case 'laterToday':
      d.setHours(d.getHours() + 3);
      return d;
    case 'tomorrow':
      d.setDate(d.getDate() + 1);
      d.setHours(8, 0, 0, 0);
      return d;
    case 'weekend': {
      const day = d.getDay();
      const toSaturday = (6 - day + 7) % 7 || 7;
      d.setDate(d.getDate() + toSaturday);
      d.setHours(8, 0, 0, 0);
      return d;
    }
    case 'nextWeek': {
      const day = d.getDay();
      const toMonday = (8 - day) % 7 || 7;
      d.setDate(d.getDate() + toMonday);
      d.setHours(8, 0, 0, 0);
      return d;
    }
  }
}

export function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
