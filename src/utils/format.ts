import type { Address } from '@/types/api';

export function fileSize(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export function displayName(address: Address | null | undefined): string {
  if (!address) return '';
  return address.name?.trim() || address.email;
}

export function addressLine(list: Address[]): string {
  return list.map((a) => (a.name ? `${a.name} <${a.email}>` : a.email)).join(', ');
}

export function initials(address: Address | null | undefined): string {
  const name = displayName(address);
  const parts = name
    .replace(/[<>"]/g, '')
    .split(/[\s@._-]+/)
    .filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

export function avatarColor(seed: string): string {
  const colors = [
    '#0078d4',
    '#8764b8',
    '#038387',
    '#ca5010',
    '#c239b3',
    '#498205',
    '#d13438',
    '#004e8c',
  ];
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return colors[hash % colors.length] ?? '#0078d4';
}

export function listDate(iso: string | null, locale: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString(
    locale,
    sameYear
      ? { month: 'short', day: 'numeric' }
      : { year: 'numeric', month: 'short', day: 'numeric' },
  );
}

export function fullDate(iso: string | null, locale: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString(locale, { dateStyle: 'full', timeStyle: 'short' });
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function textToHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

export const APP_NAME = import.meta.env.MAIL_APP_NAME || 'Mail';
export const API_URL = import.meta.env.MAIL_API_URL || 'http://localhost:8000/api/v1';
