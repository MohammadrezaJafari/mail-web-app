# Mail Web App (Quasar)

Outlook-style user portal and webmail for the Mail product. Talks only to the
**mail-panel** Laravel API (`/api/v1`); it never touches mailcow directly.

## Features

- Sign in with mailbox credentials (Sanctum token).
- Three-pane mail client: folders · message list · reading pane.
- Compose / reply / reply-all / forward with attachments and "send as alias".
- Move, delete, flag, mark read/unread, search, unread/flagged filters, infinite scroll.
- Settings: storage usage, aliases, password, forwarding, automatic replies, signature.
- Calendar (month / week / agenda) and People (address book) backed by CalDAV/CardDAV.
- English + Persian (RTL) UI, light/dark theme, "Open webmail (SOGo)" shortcut.

## Development

```bash
npm install
cp .env.example .env        # set MAIL_API_URL to your mail-panel instance
npm run dev                 # http://localhost:9000
```

Other scripts: `npm run lint`, `npm run typecheck`, `npm run build` (output in `dist/spa`).

## Configuration

| Variable        | Default                        | Description                    |
| --------------- | ------------------------------ | ------------------------------ |
| `MAIL_API_URL`  | `http://localhost:8000/api/v1` | Base URL of the mail-panel API |
| `MAIL_APP_NAME` | `Mail`                         | Product name shown in the UI   |

The API must allow this origin in its `FRONTEND_URLS` (CORS) setting.
