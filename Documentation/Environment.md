# Environment

The frontend is a Vite app. Only `VITE_` variables are exposed to browser code.

## Required

```env
VITE_API_URL=http://localhost:3000
```

`VITE_API_URL` must point to the backend API origin. The app validates this value during startup and build.

## Optional

```env
VITE_WS_URL=ws://localhost:3000
VITE_POSTHOG_KEY=
VITE_POSTHOG_HOST=https://app.posthog.com
```

## Do Not Add

- Database URLs
- Supabase service role keys
- NVIDIA NIM API keys
- GitHub client secrets
- JWT secrets
- Redis URLs
- S3 access keys

