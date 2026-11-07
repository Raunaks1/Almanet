# AGENTS.md

Almanet: alumni network SPA (React 19 + TypeScript + Vite), deployed to GitHub Pages. No tests exist; verify with lint + build.

## Commands

- `npm run dev` — Vite dev server
- `npm run lint` — oxlint (no type-aware rules; TypeScript errors only surface via build)
- `npm run build` — `tsc -b && vite build` (this is the typecheck step; there is no separate typecheck script)
- `npm run deploy` — `predeploy` builds, then `gh-pages -d dist` publishes to the `gh-pages` branch

## Workflow rules (every task)

- Use the `apple-design` skill for all UI work.
- After every task run `npm run lint` and `npm run build`, fix all errors, then summarize the files changed.
- Never run `git commit`, `git push`, or `npm run deploy`. I review and commit myself.
- Do one prompt's scope at a time. Don't redesign pages that weren't asked for.
- If a UI change would require changing data, auth, or routing logic, stop and tell me instead of doing it.

## Current phase: UI redesign only

We are replacing the neo-brutalist UI with an Apple-grade glassmorphism design (iOS/macOS "Liquid Glass" feel). Backend, security, and logic fixes come in a later phase.

**Do not modify during UI work:**
- Supabase queries, inserts, updates, RPC calls, storage uploads
- `src/lib/useAuth.ts`, `src/lib/chat.ts`, `src/lib/supabase.ts`, `src/lib/colleges.ts`, `src/lib/collegeNews.ts`
- Route definitions, `HashRouter`, `VerificationGate` logic, submit handlers, validation rules
- Data shapes and field names

**Known issues to report, not fix (during UI phase):** the hardcoded admin passphrase in `Auth.tsx`, ungated `/admin`, `user_metadata` fallbacks in `useAuth`, the ID document that is never uploaded, mock Apply/Register/replies. If you touch a file containing one of these, leave it as is and mention it in your summary.

## Gotchas

- **Supabase backend is required.** Credentials come from `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`; gitignored, no `.env.example`). Without them `src/lib/supabase.ts` falls back to placeholder strings — the app renders fine but all data/features silently fail. Copy the project's `.env` before testing anything data-related.
- **No migrations in this repo.** The Postgres schema (`profiles`, `channels`, `channel_members`, `messages`, `events`, `forum_posts`, `jobs`; `avatars` storage bucket) lives only in the Supabase project dashboard. Schema/RLS changes must be made there, not in code.
- **HashRouter is intentional** (`App.tsx`) — required for GitHub Pages deep links. Don't switch to BrowserRouter.
- **Production base path:** `vite.config.ts` uses `base: '/Almanet/'` in production. Reference public assets through `import.meta.env.BASE_URL`, never a hardcoded leading `/`.
- **Verification flow:** `src/lib/useAuth.ts` — `isVerified = user_type === 'admin' || verification_status === 'approved'`. `VerificationGate` wraps restricted routes; `/dashboard` and `/admin` are deliberately ungated. Profile verification fields may come from `user_metadata` or the `profiles` row — check both when editing auth logic.
- **Static data:** Maharashtra college/branch lists are hardcoded in `src/lib/colleges.ts`; `src/lib/collegeNews.ts` is a stub returning `[]`.
- **TS config quirks:** `erasableSyntaxOnly` and `verbatimModuleSyntax` are on — use `import type` for type-only imports, no enums.
- Chat uses Supabase realtime (messages + presence typing); keep subscriptions and cleanup paired when editing `src/lib/chat.ts`.
- React Compiler is not enabled; don't add it without user sign-off (per README it hurts dev/build perf).

## Styling system (migration in progress)

- **No Tailwind or any CSS/UI framework.** Plain CSS with CSS variables; CSS Modules are allowed. Inline styles only for truly dynamic values (e.g. computed positions).
- New design tokens live in `src/styles/tokens.css`; reset and global rules in `src/styles/base.css`. Shared components live in `src/components/ui/` (each with a co-located CSS Module and a barrel `index.ts`). Page-level styles live next to the page.
- Legacy variables in `src/index.css` (`--bg-primary`, `--brand-primary`, `.card`, `.btn`, `.input-field`) are still used by Profile, AdminDashboard and VerificationGate until they are redesigned. Keep them working by aliasing them to the new tokens. Remove them only once nothing references them.
- Allowed new dependencies: `motion` (import from `motion/react`), `@fontsource-variable/inter`. Ask before adding anything else.
- Icons: `lucide-react` only, stroke width 1.75. No emoji as UI icons.

## Design constitution

### Look
- Remove the neo-brutalist look entirely: no 2px black borders, no hard offset shadows, no uppercase headings.
- Light: background `#F5F5F7`, ink `#1D1D1F`, secondary text `#6E6E73`, accent `#0071E3`, success `#34C759`, warning `#FF9F0A`, danger `#FF3B30`.
- Dark: background `#0B0B0F`, ink `#F5F5F7`, secondary `#98989D`, glass surfaces `rgba(28,28,30,0.6)`.
- Page background is a soft, slowly drifting mesh gradient built from the brand pastels (sage `#CCDAC6`, lavender `#D9CFF5`, blue `#C7E4F2`) so glass has something to blur.
- Glass recipe: `background: rgb(255 255 255 / 0.55); backdrop-filter: blur(24px) saturate(180%);` 1px border `rgb(255 255 255 / 0.4)` plus an outer hairline `rgb(0 0 0 / 0.06)`, an inset top highlight, and a layered soft shadow (low opacity at 1px, 8px and 24px).
- Use glass for chrome and floating layers only: nav, sidebar, sheets, modals, popovers, floating cards. Dense content (message text, form fields, long lists) sits on more opaque surfaces.
- Never nest more than 2 glass layers. Keep fewer than about 6 `backdrop-filter` elements visible at once.
- Radii: 10 / 14 / 20 / 28 / pill. Spacing on a 4px grid. Touch targets at least 44px.
- Type: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter Variable", sans-serif`. Scale: Large Title 34/40 w700, Title 28/34 w700, Headline 17/22 w600, Body 17/24, Callout 16, Subhead 15, Footnote 13, Caption 12. Tracking -0.02em on titles. Sentence case everywhere.

### Motion
- Animate only `transform` and `opacity`, never layout properties.
- Interactions use springs (stiffness 300, damping 30, mass 1). Fades and reveals take 200–400ms with `cubic-bezier(0.22, 1, 0.36, 1)`.
- All durations, springs, and variants come from `src/lib/motion.ts`. Don't hardcode them in components.
- Buttons scale to 0.97 on press and lift on hover (pointer devices only). Page transitions fade in with an 8px rise. Lists stagger at 40ms, animating at most 8 items. Modals are bottom sheets on mobile and centered scale-in on desktop. Use skeletons instead of spinners.
- Respect `prefers-reduced-motion` (no parallax, stagger, or mesh animation; simple fades only) and `prefers-reduced-transparency` (solid surfaces). Provide an `@supports not (backdrop-filter)` solid fallback.

### Accessibility and responsiveness
- Text contrast of at least 4.5:1 on every glass surface, in light and dark.
- Visible `:focus-visible` ring (3px, accent at 40%). Semantic HTML, labelled inputs, ARIA on modals and tabs, full keyboard support.
- Mobile first, from 360px to 1920px. Use `dvh` units and `env(safe-area-inset-*)` for full-height and bottom-fixed layouts.
- Theme supports `light | dark | system` (default `system`), persisted under the `almanet-theme` localStorage key via the existing ThemeContext.

## UI redesign progress

Update this checklist as each prompt completes.

- [x] Foundation (tokens, theme, mesh background, motion presets)
- [x] UI component library (`/ui-kit` dev route)
- [x] App shell and navigation
- [x] Home
- [x] Auth
- [x] Dashboard + VerificationGate
- [x] Directory + Profile
- [x] Chat
- [x] Forums + Jobs + Events
- [x] AdminDashboard
- [x] Final polish and audit