# TeachSmart Live for Netlify

Start with **START-HERE.md** for the account setup and deployment steps.

This is a converted Next.js application for Netlify, backed by Supabase PostgreSQL and verified teacher authentication. It includes multiple choice, word clouds, open text, Q&A, ideas, ranking, rating, pin on image, anonymous presentation views, teacher-only student names, and PDF/PNG exports.

## Local development

Requires Node 22 or later and your own Supabase project. Run `database/setup.sql` in that project and configure a teacher as explained in START-HERE.md. Copy `.env.example` to `.env.local` and fill in your values. Do not commit `.env.local`.

```sh
npm ci
npm run dev
```

## Checks

```sh
npm run typecheck
npm test
npm run build
```

Tests use an isolated local PostgreSQL-compatible PGlite instance and fake verified identities injected into the handler. They do not contact your live database or Supabase authentication service.

## Main files

- `app/live.tsx`: dashboard, student view, presenter, and question composer.
- `app/teacher/page.tsx`: teacher login and setup status.
- `lib/live-handler.ts`: polling logic and authorization.
- `lib/database.ts`: PostgreSQL query adapter and server-only connection pool.
- `lib/teacher.ts`: Supabase-verified teacher identity and email authorization.
- `app/api/auth/route.ts`: HTTP-only auth cookies, login, logout, and setup status.
- `app/api/image/route.ts`: image delivery with browser caching.
- `app/export.ts`: anonymous PDF and PNG exports.
- `database/setup.sql`: tables in a private schema with row-level security.
- `database/add-teacher.sql`: authorize teacher email addresses.
- `netlify.toml`: build settings.

The app does not use Cloudflare D1, Vinext, ChatGPT identity headers, ChatGPT sign-in endpoints, or a ChatGPT Sites runtime. Database credentials stay on the server. Supabase's public/anonymous clients are not given access to the application's private database schema.

Live pages poll every three seconds. Load and paid usage at production classroom scale have not been benchmarked. External hosting setup and production end-to-end verification remain the deployer's responsibility.
