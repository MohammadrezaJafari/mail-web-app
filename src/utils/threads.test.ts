import { describe, expect, it } from 'vitest';
import { buildThreads, normalizeSubject } from './threads';
import type { MessageSummary } from '@/types/api';

function msg(
  uid: number,
  id: string,
  date: string,
  subject: string,
  refs: string[] = [],
  inReplyTo = '',
): MessageSummary {
  return {
    uid,
    folder: 'INBOX',
    subject,
    from: { name: `U${uid}`, email: `u${uid}@x.test` },
    to: [],
    date,
    preview: '',
    seen: uid % 2 === 0,
    flagged: false,
    answered: false,
    has_attachments: false,
    size: 0,
    message_id: id,
    in_reply_to: inReplyTo,
    references: refs,
  };
}

describe('threads', () => {
  it('normalizes subjects', () => {
    expect(normalizeSubject('Re: RE: Fwd: Hello')).toBe('hello');
    expect(normalizeSubject('پاسخ: سلام')).toBe('سلام');
  });

  it('groups by references even when the root is the newest message', () => {
    const list = [
      msg(3, 'root', '2026-01-03', 'Plan'),
      msg(2, 'r1', '2026-01-02', 'Re: Plan', ['root'], 'root'),
      msg(1, 'r2', '2026-01-01', 'Re: Plan', ['root', 'r1'], 'r1'),
      msg(9, 'other', '2026-01-04', 'Lunch'),
    ];
    const threads = buildThreads(list);
    expect(threads).toHaveLength(2);
    expect(threads[0]!.subject).toBe('Lunch');
    expect(threads[1]!.messages.map((m) => m.uid)).toEqual([3, 2, 1]);
    expect(threads[1]!.unread).toBe(2);
  });

  it('falls back to subject grouping', () => {
    const threads = buildThreads([
      msg(1, 'a', '2026-01-01', 'Hi'),
      msg(2, 'b', '2026-01-02', 'Re: hi'),
    ]);
    expect(threads).toHaveLength(1);
  });
});
