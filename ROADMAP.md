# Roadmap / deferred work

## Real-time push (deferred — needs a separate service)

Today the web app polls folder status (20s visible / 60s hidden) and fetches new
messages by UID range. Replace it with true push when infrastructure allows:

- A standalone worker holds one IMAP IDLE connection per active mailbox
  (or uses Dovecot's `notify`/`push-notification` plugin) and publishes
  `mail.new` / `mail.flags` events.
- Laravel Reverb (or another WebSocket broker) delivers events to the browser
  with the user's Sanctum token.
- `useMailPolling` becomes `useMailSocket`; polling stays as fallback.

Reasons for deferring: IDLE ties up one connection per user and does not fit
PHP-FPM request workers; needs its own process manager and monitoring.

## Next candidates

- Drag & drop, context menu, keyboard shortcuts (in progress)
- Nested (tree) folders, advanced search filters
- Server-side rules (Sieve) UI, blocked/safe senders
- Calendar & contacts (CalDAV/CardDAV via SOGo)
