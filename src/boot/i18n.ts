import { defineBoot } from '#q-app';
import { createI18n } from 'vue-i18n';
import type { Ref } from 'vue';
import { Quasar, LocalStorage } from 'quasar';
import langEn from 'quasar/lang/en-US';
import langFa from 'quasar/lang/fa-IR';

import messages from '@/i18n';

export type MessageLanguages = keyof typeof messages;
export type MessageSchema = (typeof messages)['en-US'];

/* eslint-disable @typescript-eslint/no-empty-object-type */
declare module 'vue-i18n' {
  export interface DefineLocaleMessage extends MessageSchema {}
  export interface DefineDateTimeFormat {}
  export interface DefineNumberFormat {}
}
/* eslint-enable @typescript-eslint/no-empty-object-type */

const LOCALE_KEY = 'mail.locale';

function detectLocale(): MessageLanguages {
  const saved = LocalStorage.getItem<string>(LOCALE_KEY);
  if (saved === 'fa-IR' || saved === 'en-US') return saved;
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('fa')
    ? 'fa-IR'
    : 'en-US';
}

export const i18n = createI18n<{ message: MessageSchema }, MessageLanguages>({
  locale: detectLocale(),
  fallbackLocale: 'en-US',
  legacy: false,
  messages,
});

const localeRef = i18n.global.locale as unknown as Ref<MessageLanguages>;

export function applyLocale(locale: MessageLanguages): void {
  localeRef.value = locale;
  Quasar.lang.set(locale === 'fa-IR' ? langFa : langEn);
  LocalStorage.set(LOCALE_KEY, locale);
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('lang', locale);
    document.documentElement.setAttribute('dir', locale === 'fa-IR' ? 'rtl' : 'ltr');
  }
}

export default defineBoot(({ app }) => {
  app.use(i18n);
  applyLocale(localeRef.value);
});
