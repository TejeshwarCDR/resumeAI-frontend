# Deployment

Recommended platform: Vercel or another static host with SPA fallback support.

## Build

```bash
npm ci
npm run build
```

## Required Hosting Variables

- `VITE_API_URL=https://your-api.example.com`
- `VITE_WS_URL=wss://your-api.example.com`

Optional:

- `VITE_POSTHOG_KEY`
- `VITE_POSTHOG_HOST`

The backend owns Supabase, GitHub OAuth secrets, AI provider keys, Redis, JWT secrets, and storage credentials.

