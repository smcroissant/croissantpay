# CroissantPay Marketing Site

Static/marketing Next.js app: home, docs, blog, pricing, about, legal pages.

- **No backend** — no DB, auth, or API. Suitable for a separate repo or deploy (Vercel, Netlify, etc.).
- **App links** — set `NEXT_PUBLIC_APP_URL` (e.g. `https://app.croissantpay.com`) so “Sign in” / “Get started” point to the product app.

## Run

```bash
pnpm dev     # dev on :3001
pnpm build
pnpm start
```

From monorepo root: `pnpm dev:marketing` / `pnpm build:marketing` / `pnpm start:marketing`.
