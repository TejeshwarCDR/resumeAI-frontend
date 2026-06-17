# Signuture — Web Application

> Crafted around who you are. Signed for who you'll become.

Signuture is an AI-powered resume-crafting platform that builds tailored, high-fidelity resumes from a living portfolio of your work. Rather than filling in a template, you build once — your experience, projects, skills, and story — and the platform shapes that material around every job description you target.

---

## Features

- **Portfolio builder** — A single source of truth for your experience, projects, education, skills, and certifications, with document-import parsing (PDF, DOCX).
- **AI resume generation** — A five-stage pipeline (JD analysis → portfolio scoring → content generation → PDF rendering → ATS scoring) that produces a tailored resume in under two minutes.
- **ATS scoring panel** — Inline keyword matching, gap highlighting, and actionable suggestions against the target job description.
- **Cover letter generation** — Tone-adjustable, voice-consistent letters derived from the same portfolio and job context.
- **Gap Advisor** — Career-goal-aware analysis that surfaces missing skills, suggests projects to build, and recommends learning resources.
- **Resume library** — Versioned history of every resume generated, each with its own ATS score and export workflow.
- **Sign & Export** — A PDF export flow with a branded "signed" seal moment.

---

## Technology Stack

| Layer | Choice |
|---|---|
| UI framework | React 18 + TypeScript |
| Routing | React Router v6 |
| HTTP client | Axios |
| Build tool | Vite 5 |
| Styling | CSS custom properties (design tokens) + inline styles |
| Icons | Lucide React |
| Deployment | Vercel |
| Type checking | TypeScript strict mode |

No CSS-in-JS library, no Tailwind, no component library. Styling is driven entirely by design tokens expressed as CSS custom properties.

---

## Project Architecture

```
signuture-web/
├── src/
│   ├── assets/                  # Static brand assets (SVG, images)
│   │   └── logo-wordmark.svg
│   │
│   ├── components/              # Reusable UI components (design system)
│   │   ├── brand/               # Logo, Seal
│   │   ├── core/                # Button
│   │   ├── data-display/        # Card, Badge, Tag, Avatar, ProgressMeter
│   │   ├── feedback/            # LoadingSpinner, EmptyState
│   │   ├── forms/               # Input, Textarea, Select, Switch
│   │   ├── layout/              # PageHeader
│   │   ├── navigation/          # Tabs, Stepper
│   │   └── index.ts             # Barrel export
│   │
│   ├── layouts/
│   │   └── AppShell.tsx         # Fixed sidebar nav + scrollable main area
│   │
│   ├── lib/
│   │   ├── api.ts               # Axios instance with auth interceptors
│   │   ├── cn.ts                # Class name utility
│   │   ├── endpoints.ts         # API endpoint constants
│   │   └── hooks/
│   │       ├── useApi.ts        # Generic GET hook with loading/error state
│   │       └── usePolling.ts    # Interval-based polling with stop condition
│   │
│   ├── pages/                   # Route-level page components
│   │   ├── Auth.tsx             # Login / Register
│   │   ├── Dashboard.tsx        # Overview stats and recent resumes
│   │   ├── GapAdvisor.tsx       # Career gap analysis
│   │   ├── Generate.tsx         # Resume generation form + progress view
│   │   ├── Onboarding.tsx       # 5-step portfolio onboarding wizard
│   │   ├── Portfolio.tsx        # Portfolio management (Experience, Projects…)
│   │   ├── ResumeDetail.tsx     # Resume preview, ATS panel, cover letter
│   │   ├── Resumes.tsx          # Resume library grid
│   │   └── Settings.tsx         # Account, notifications, danger zone
│   │
│   ├── store/
│   │   └── auth.tsx             # AuthContext: login, register, logout, user state
│   │
│   ├── styles/
│   │   ├── styles.css           # Global entry point (@imports tokens + resets)
│   │   └── tokens/
│   │       ├── colors.css       # Ink, Brass, Paper palette + semantic aliases
│   │       ├── fonts.css        # Google Fonts import
│   │       ├── spacing.css      # Space scale, radii, shadows, motion
│   │       └── typography.css   # Type scale, weights, line heights
│   │
│   ├── env.d.ts                 # Vite env type declarations
│   ├── main.tsx                 # App entry point
│   └── router.tsx               # createBrowserRouter definition
│
├── index.html                   # Vite HTML entry
├── vite.config.ts               # Vite config + @/ path alias
├── tsconfig.json                # TypeScript project references
├── tsconfig.app.json            # App compiler options (strict, ESNext)
├── tsconfig.node.json           # Node compiler options (vite.config.ts)
├── vercel.json                  # SPA rewrite rule + env binding
├── package.json
├── .env.example                 # Required environment variables (template)
└── .gitignore
```

### Key architectural decisions

- **Path alias `@/`** resolves to `src/`, configured in both `vite.config.ts` and `tsconfig.app.json`.
- **No global state library** — auth is a React Context; all other data is fetched per-page via `useApi`.
- **Polling over WebSocket** for the generation pipeline (MVP). `usePolling` hits `GET /resume/generate/status/:jobId` every 2 s until `status === "completed"`.
- **Inline styles only** — no CSS modules, no Tailwind. All values are CSS custom properties from the token files, enforcing design-system adherence mechanically.
- **Mock-first fallbacks** — every page falls back to local mock data when the API is unreachable, so the UI is fully exercisable without a live backend.

---

## Design System

Signuture ships a bespoke design system called **"Inkwell"** — a premium, emotional tri-tone palette built around the signature metaphor.

### Color palette

| Scale | Role | Primary token |
|---|---|---|
| **Paper** (`--paper-50…400`) | All page and card backgrounds | `--bg-page` → `--paper-100` |
| **Ink** (`--ink-100…950`) | Text, primary action, nav chrome | `--ink-600` for action, `--ink-900` for text |
| **Brass** (`--brass-100…800`) | Premium / "signed" moments | `--brass-500` for CTAs and the seal |
| **Slate** (`--slate-ink`, `--slate-700`, `--slate-500`) | Secondary and muted text | — |
| **Semantic** | Status feedback | `--success-600`, `--danger-600`, `--warning-600` |

Legacy aliases `--cream-*`, `--blue-*`, and `--gold-*` resolve 1:1 to the new names and are kept for backwards compatibility.

### Typography

| Token | Family | Usage |
|---|---|---|
| `--font-display` | Cormorant Garamond | All headlines, display text |
| `--font-body` | Hanken Grotesk | UI labels, body copy, buttons |
| `--font-script` | Pinyon Script | Wordmark *only* — never in UI |
| `--font-mono` | JetBrains Mono | Data, timestamps, ATS scores |

### Spacing

4 px base scale from `--space-1` (4 px) through `--space-9` (96 px). Layouts are intentionally generous — the brand is calm, not dense.

### Component rules

- Every color, spacing, radius, and shadow value must be a CSS variable.
- Reuse `src/components/` before building new primitives.
- Icons: Lucide React, outline style, `strokeWidth={1.9}`. Never filled or duotone.
- Motion: 140 ms fast, 220 ms normal, 360 ms slow. `var(--ease-standard)` = `cubic-bezier(0.4, 0, 0.2, 1)`. No spring or bounce.

---

## Setup and Installation

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Install dependencies

```bash
npm install
```

### Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set `VITE_API_URL` to your backend API base URL:

```
VITE_API_URL=http://localhost:8000
```

---

## Development Workflow

### Start the dev server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Type checking

```bash
npm run type-check
```

### Lint

```bash
npm run lint
```

### Build for production

```bash
npm run build
```

Output goes to `dist/`.

### Preview the production build

```bash
npm run preview
```

---

## Build and Deployment

The project is configured for **Vercel**. `vercel.json` defines:

- A catch-all SPA rewrite rule so client-side routing works on any path.
- The `VITE_API_URL` environment variable binding (`@signuture-api-url` secret).

To deploy to Vercel:

```bash
# First-time project link
npx vercel link

# Deploy to production
npx vercel --prod
```

Set the `signuture-api-url` secret in the Vercel dashboard to your production API URL before your first production deploy.

---

## Environment Configuration

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Base URL of the Signuture backend API | `https://api.signuture.com` |

All `VITE_` prefixed variables are inlined at build time by Vite. Never put secrets in these variables — they are visible in the browser bundle.

---

## API Integration

The frontend communicates with the Signuture backend over a REST API. The axios instance in [src/lib/api.ts](src/lib/api.ts) handles:

- Attaching the `Authorization: Bearer <token>` header from `localStorage` on every request.
- Redirecting to `/login` automatically on `401` responses.

All endpoint paths are centralised in [src/lib/endpoints.ts](src/lib/endpoints.ts).

The backend implements a five-stage AI resume generation pipeline:

1. **`analyzing_jd`** — Groq (Llama 3.1 8B) extracts required skills, seniority, and tech stack from the job description.
2. **`scoring_portfolio`** — Portfolio items are ranked against the JD using a composite keyword + recency + impact score.
3. **`generating_content`** — Gemini 1.5 Flash generates structured resume content in the user's voice.
4. **`rendering_pdf`** — Puppeteer renders the content into a branded PDF template and uploads it to S3.
5. **`completed`** — A deterministic ATS scorer runs keyword matching and produces `foundKeywords`, `missingKeywords`, and `suggestions`.

The frontend polls `GET /resume/generate/status/:jobId` every 2 seconds until the pipeline completes.

---

## Contribution Guidelines

1. **Branch naming** — `feature/<slug>`, `fix/<slug>`, `chore/<slug>`.
2. **Design adherence** — After every change, check that no raw hex values appear in component files: `grep -r '#[0-9A-Fa-f]\{6\}' src/ --include="*.tsx" --include="*.ts"`. All color values must be CSS variables.
3. **Components first** — Before building a new UI element, check `src/components/` for an existing primitive that can be composed or extended.
4. **Inline styles** — Use inline style objects that reference CSS variables. No CSS modules, no Tailwind classes, no className-based styling.
5. **Icons** — Import from `lucide-react`. Outline style, `strokeWidth={1.9}`. No filled or duotone variants.
6. **Voice** — Copy should be second-person, sentence case, and warm. Refer to the design system vocabulary: *craft, shape, signed, sealed, story, voice, become, yours*. No emoji.
7. **Type checking must pass** — Run `npm run type-check` before opening a PR. TypeScript strict mode is enabled.

---

## Roadmap

- [ ] WebSocket real-time generation progress (replaces 2 s polling)
- [ ] GitHub integration — import projects directly from repositories
- [ ] Browser extension — one-click JD capture from job boards
- [ ] Resume diff viewer — side-by-side version comparison
- [ ] Template editor — customize layout and typography per resume
- [ ] Team workspaces — shared portfolio and branding for organizations
- [ ] Accessibility audit and WCAG 2.1 AA compliance pass

---

## License

Private repository. All rights reserved. Unauthorized distribution is prohibited.
