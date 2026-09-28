import type { Address, MessageSummary, Thread } from '@/types/api';

/** Strip Re:/Fwd:/FW: prefixes (also Persian "پاسخ:") for subject-based fallback grouping. */
export function normalizeSubject(subject: string): string {
  return subject
    .replace(/^\s*((re|fw|fwd|aw|wg|sv|پاسخ|ارجاع)\s*(\[\d+\])?\s*:\s*)+/i, '')
    .trim()
    .toLowerCase();
}

/**
 * Groups messages into conversations using References / In-Reply-To first and a
 * normalized subject as a fallback (same behaviour as most desktop clients).
 */
export function buildThreads(messages: MessageSummary[]): Thread[] {
  const rootOf = new Map<string, string>(); // message-id -> thread key
  const threads = new Map<string, MessageSummary[]>();

  const sorted = [...messages].sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '')); // oldest first

  for (const m of sorted) {
    const ids = [...(m.references ?? []), m.in_reply_to].filter(Boolean);
    // A message already referenced by an earlier-processed reply belongs to that thread.
    let key: string | undefined = m.message_id ? rootOf.get(m.message_id) : undefined;
    for (const id of ids) {
      if (key) break;
      key = rootOf.get(id);
      if (key) break;
    }
    if (!key && ids.length) key = ids[0]; // first reference is the root
    if (!key) {
      const subject = normalizeSubject(m.subject);
      key = subject ? `subject:${subject}` : `msg:${m.message_id || m.uid}`;
    }
    if (m.message_id) rootOf.set(m.message_id, key);
    for (const id of ids) if (!rootOf.has(id)) rootOf.set(id, key);

    const list = threads.get(key) ?? [];
    list.push(m);
    threads.set(key, list);
  }

  const result: Thread[] = [];
  for (const [key, list] of threads) {
    const newestFirst = [...list].reverse();
    const latest = newestFirst[0]!;
    const seen = new Set<string>();
    const participants: Address[] = [];
    for (const m of newestFirst) {
      const email = m.from?.email?.toLowerCase();
      if (m.from && email && !seen.has(email)) {
        seen.add(email);
        participants.push(m.from);
      }
    }
    result.push({
      key,
      subject: latest.subject || newestFirst.find((m) => m.subject)?.subject || '',
      messages: newestFirst,
      latest,
      participants,
      unread: newestFirst.filter((m) => !m.seen).length,
      flagged: newestFirst.some((m) => m.flagged),
      has_attachments: newestFirst.some((m) => m.has_attachments),
    });
  }

  return result.sort((a, b) => (b.latest.date ?? '').localeCompare(a.latest.date ?? ''));
}
