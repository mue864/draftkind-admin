# Draftkind Admin Web

Separate admin console for monitoring Draftkind production activity.

## Run

```bash
cd admin-web
npm install
npm run dev
```

Create a local env file if needed:

```bash
cp .env.example .env.local
```

Then adjust:

```env
VITE_API_BASE_URL=https://api.draftkind.com
```

## Current Screens

- Overview
- Users
- Rewrite Activity
- Guest Shield

## Notes

- Login uses the backend `/auth/admin/login` endpoint, which sets the admin session cookie.
- Admin access is verified by calling `/auth/admin/session` when the app boots.
- The backend account must already have the `ADMIN` role.
