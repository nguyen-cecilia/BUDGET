# Budget — AGENTS.md

Angular 21 personal budget app backed by Supabase. Locale is **fr-FR**; all user-facing strings and routes are in French.

## Commands

| Task | Command |
|---|---|
| Dev server | `npm start` |
| Build | `npm run build` |
| Test | `npm run test` |

**No lint or typecheck script is defined** in `package.json` (despite README claiming `npm run lint`). Do not run `npm run lint` — it will fail.

## Stack

- **Angular 21** — standalone components, `bootstrapApplication`, no NgModules.
- **Tailwind CSS v4** — `@import "tailwindcss"` in `src/assets/styles/app.css`. NOT the v3 `@tailwind` directives. PostCSS plugin is `@tailwindcss/postcss` (`.postcssrc.json`).
- **Tailwind Forms** — loaded via `@plugin "@tailwindcss/forms"` with `strategy: "class"`. You must add `form-*` utility classes manually; Tailwind does not reset form styles automatically.
- **Vitest 4** — unit test runner. `tsconfig.spec.json` provides `vitest/globals` types. No test files exist yet.
- **Supabase** — `src/app/core/supabase.service.ts` creates the client. Config lives in `src/environments/`.
- **Lucide icons** — `@lucide/angular` for icon components.

## Structure

```
src/
  app/
    components/     # Reusable UI: badge, button, modal, select
    core/           # Singleton services (supabase, color)
    features/       # Feature modules: auth, login, dashboard, transactions, accounts, categories, tags, currencies, month
    app.ts          # Root component (shell with sidebar/bottom-nav, month selector, modal host)
    app.routes.ts   # Route definitions (French paths)
    app.config.ts   # Providers: router, service-worker, locale
  assets/styles/    # Tailwind entrypoint (app.css) + base/form/fonts
  environments/     # environment.ts (prod, placeholder tokens), environment.development.ts (gitignored)
```

## Conventions

- **4-space indent**, single quotes in TS, final newline (`.editorconfig`).
- **Prettier** inline in `package.json`: `printWidth: 100`, `singleQuote: true`, Angular HTML parser.
- Components use `.ts` / `.html` pairs (external templates), no inline styles.
- Signals preferred over RxJS for local state.
- Routing paths are French: `/connexion`, `/transactions`, `/objectifs`, `/vue-annuelle`, `/parametres`.

## Environment files

- `environment.ts` has build-time placeholders (`%%SUPABASE_URL%%`, `%%SUPABASE_KEY%%`).
- `environment.development.ts` is **gitignored**. Use `environment.example.ts` as a template.
- `.secret.txt` in root is also gitignored — do not commit secrets.

## Gotchas

- The wildcard route redirects to `/login`, but the actual login path is `/connexion` — these are inconsistent (`app.routes.ts:39`).
- Production build has a **500 kB** initial bundle budget warning, **1 MB** error limit (`angular.json:33-40`).
- Service worker is enabled in production only (`ngsw-config.json`).
