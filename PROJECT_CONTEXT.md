# Almanet — Project Context & Purpose

This document is the single source of truth for what Almanet is, why it exists, how it is built, and the constraints under which it is developed. It supplements (does not replace) `AGENTS.md`, which governs the day-to-day workflow.

---

## 1. Purpose

**Almanet** is a Single Page Application (SPA) alumni network for engineering colleges — scoped to Maharashtra's engineering-college ecosystem. Its goal is to connect verified alumni across batches, branches, and colleges so they can:

- Keep in touch with batchmates and classmates via real-time chat (batch-year and batch+branch group channels, plus direct messages).
- Find and message alumni through a searchable directory.
- Browse and post jobs, forum discussions, and college events.
- Let college administrators vet and approve new members before they unlock the network.
- **Score uploaded resumes against job postings and optimise resumes rule-based (no AI)** — the Resume Optimization Studio.

It is designed as a **mobile-first** web app deployed to **GitHub Pages**, with an Apple-grade glassmorphism ("Liquid Glass") aesthetic inspired by iOS/macOS design.

**Target users:** students, alumni, and administrators of Maharashtra engineering colleges (CAP Round I 2025-26 data set is embedded).

---

## 2. Current Phase — UI Redesign + Resume Optimization Studio

| Phase | Status | Scope |
|-------|--------|-------|
| Foundation (tokens, theme, mesh background, motion presets) | ✅ Complete | `src/styles/tokens.css`, `src/styles/base.css`, `src/lib/motion.ts` |
| UI component library (`/ui-kit` dev route) | ✅ Complete | `src/components/ui/` (glass, motion, accessible primitives) |
| App shell and navigation | ✅ Complete | `src/components/shell/` (sidebar, top bar, tab bar, More sheet) |
| Home | ✅ Complete | `src/pages/Home.tsx` |
| Auth | ✅ Complete | `src/pages/Auth.tsx` |
| Dashboard + VerificationGate | ✅ Complete | `src/pages/Dashboard.tsx`, `src/components/VerificationGate.tsx` |
| Directory + Profile | ✅ Complete | `src/pages/Directory.tsx`, `src/pages/Profile.tsx` |
| Chat | ✅ Complete | `src/pages/Chat.tsx` |
| Forums + Jobs + Events | ✅ Complete | `src/pages/Forums.tsx`, `src/pages/Jobs.tsx`, `src/pages/Events.tsx` |
| AdminDashboard | ✅ Complete | `src/pages/AdminDashboard.tsx` |
| Final polish and audit | ✅ Complete | All redesigned |
| **AI Job Board & Resume Optimization Studio** | ✅ Complete | `/jobs` scoring vs uploaded resume + `/jobs/:jobId/optimise` flow + `/jobs/:jobId/editor` full-page split-screen Editor Mode |

**What comes next (later phases):** backend/security/logic fixes — hardcoded admin passphrase, ungated `/admin`, `user_metadata` fallbacks, ID document upload, mock Apply/Register/replies.

**Do NOT modify during UI work** (per AGENTS.md):
- Supabase queries, inserts, updates, RPC calls, storage uploads
- `src/lib/useAuth.ts`, `src/lib/chat.ts`, `src/lib/supabase.ts`, `src/lib/colleges.ts`, `src/lib/collegeNews.ts`
- Route definitions, `HashRouter`, `VerificationGate` logic, submit handlers, validation rules
- Data shapes and field names

*Exception:* The AI Job Board feature is authorized to add new routes (`/job-board`, `/jobs/:jobId/optimise`, `/jobs/:jobId/editor`) and new data types/logic files (`src/types/job-matching.ts`, `src/types/resume.ts`, `src/lib/atsScoring.ts`, `src/lib/resume/*`, `src/components/resume/*`, `src/pages/ResumeEditor.tsx`).

**Known issues to report, not fix:** hardcoded admin passphrase in `Auth.tsx`, ungated `/admin`, `user_metadata` fallbacks in `useAuth`, the ID document that is never uploaded, mock Apply/Register/replies. If you touch a file containing one of these, leave it as is and mention it in your summary.

---

## 3. Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | React 19 + TypeScript | React Compiler NOT enabled |
| Build tool | Vite 5 | `base: '/Almanet/'` in production (GitHub Pages) |
| Routing | react-router-dom v7 | `HashRouter` (intentional, for GitHub Pages deep links) |
| Backend / auth / DB | Supabase | Postgres schema + RLS live only in Supabase dashboard (no migrations in repo) |
| Realtime | Supabase realtime | Chat messages + presence typing indicators |
| Styling | Plain CSS + CSS variables + CSS Modules | **No Tailwind framework** (Tailwind CSS Vite plugin is installed but the project uses plain CSS; tokens live in `src/styles/tokens.css`) |
| Animation | `motion` (motion/react) | Presets in `src/lib/motion.ts`; animate only `transform` + `opacity` |
| Fonts | `@fontsource-variable/inter` + system stack | SF Pro Text / Inter Variable / sans-serif |
| Icons | `lucide-react` only | strokeWidth 1.75, no emoji as UI icons |
| Linting | oxlint | `npm run lint` (no type-aware rules; TS errors surface via build) |
| Testing | vitest | `npm run test`; devDependency added for the Resume Optimization Studio logic |
| PDF export | `jspdf` + `html2canvas` | Resume PDF export (allowed dependencies) |
| Deployment | gh-pages → `gh-pages` branch | `npm run deploy` (predeploy builds first) |

**Allowed new dependencies:** `motion` (from `motion/react`), `@fontsource-variable/inter`, `vitest` (dev), `jspdf`, `html2canvas` (+ `@types/jspdf` dev), `docx-preview` (PDF/DOCX document viewer). Anything else requires user sign-off.

---

## 4. Project Structure

```
Almanet/
├── AGENTS.md                 # Workflow rules, design constitution, redesign checklist
├── PROJECT_CONTEXT.md        # This file — full context & purpose
├── design-decisions.md       # Dashboard redesign decisions (Phase 1)
├── README.md                 # Vite template README (generic)
├── vite.config.ts            # Vite config; React plugin; base '/Almanet/' in prod; '@' alias
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── package.json              # Scripts: dev, lint, test, build, preview, deploy
├── .env                      # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (gitignored)
├── index.html                # Entry; theme-color meta tags; favicon.svg
├── src/
│   ├── main.tsx              # React root; imports tokens, base, index.css; StrictMode
│   ├── App.tsx               # HashRouter routes, route titles, lazy page imports
│   ├── ThemeContext.tsx      # light | dark | system; persisted as almanet-theme
│   ├── index.css             # Tailwind theme aliases + legacy bridge classes
│   ├── styles/
│   │   ├── tokens.css        # Design tokens (light/dark/system, glass, radii, type, motion, z-index)
│   │   └── base.css          # Reset, canvas, typography, focus ring, scrollbar, reduced motion
│   ├── lib/
│   │   ├── supabase.ts       # Supabase client (placeholder fallback if .env missing)
│   │   ├── useAuth.ts        # Session + profile; isVerified = admin || approved
│   │   ├── chat.ts           # Channels, messages, realtime subscriptions, presence typing, searchUsers
│   │   ├── colleges.ts       # MAHARASHTRA_COLLEGES — college → branches (hardcoded static data)
│   │   ├── collegeNews.ts    # Stub returning [] (future Supabase college_news table)
│   │   ├── dashboardData.ts  # Read-only dashboard queries + profile completeness computation
│   │   ├── jobSearchLinks.ts # External job-site search URL builders (LinkedIn, Naukri, etc.)
│   │   ├── motion.ts         # Motion presets (SPRING, fadeIn, riseIn, listStagger, slideInFromBottom, STAGGER_STEP)
│   │   ├── resumes.ts        # Resume data layer: listResumes, uploadResume, deleteResume, getResumeUrl
│   │   ├── utils.ts          # cn() className helper
│   │   ├── resume/           # Resume Optimization Studio logic
│   │   │   ├── skillDictionary.ts      # Canonical→alias skill dictionary (~260 entries, 12 categories)
│   │   │   ├── textUtils.ts            # Whitespace normalisation, section detection, bullet splitting
│   │   │   ├── analyzeResume.ts        # Pure rule-based analysis + scoring (0-100)
│   │   │   ├── analyzeResume.test.ts   # vitest suite (18 cases)
│   │   │   └── useResumes.ts           # Hook: loads user's ready resumes, active-resume memory in localStorage
│   │   │   ├── pickViewer.ts           # Pure function: picks pdf | docx | unsupported viewer by mime/ext
│   │   │   ├── pickViewer.test.ts      # vitest suite for pickViewer
│   │   │   ├── fetchResumeFile.ts      # Fetches resume bytes as ArrayBuffer via short-lived signed URL
│   │   │   ├── structuredResumeParser.ts   # Parses raw extracted_text into StructuredResume
│   │   │   ├── parseResume.ts          # Entry point: parseRawTextToStructured + serializeStructuredResume
│   │   │   ├── pdfExport.ts            # Client-side PDF export via jspdf
│   ├── pages/                # All route pages (+ co-located .module.css)
│   │   ├── Home.tsx
│   │   ├── Auth.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Directory.tsx
│   │   ├── Profile.tsx
│   │   ├── Forums.tsx
│   │   ├── Jobs.tsx          # Scores jobs vs active uploaded resume; opens Optimise modal
│   │   ├── Optimise.tsx      # Route page for /jobs/:jobId/optimise; renders OptimiseModal
│   │   ├── ResumeEditor.tsx  # Route page for /jobs/:jobId/editor; full-page split-screen Editor Mode
│   │   ├── Events.tsx
│   │   ├── Chat.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── ComingSoon.tsx    # About / Contact / Privacy / Terms / Guidelines
│   │   ├── ShellPreview.tsx  # Dev shell frame preview
│   │   └── UiKit.tsx         # Dev-only component gallery (/ui-kit)
│   ├── types/                # TypeScript type definitions
│   │   ├── job-matching.ts   # Job board & resume matching mock data types
│   │   └── resume.ts         # StructuredResume type for Editor Mode
│   ├── components/
│   │   ├── ui/               # Shared glass/motion components (Button, Input, Modal, Tabs, Avatar, Skeleton, Toast, …)
│   │   ├── shell/            # AppShell, AppShellFrame, nav.ts, PageHeader, PageTransition, UserMenu
│   │   ├── layout/           # SiteFooter
│   │   ├── home/, jobs/      # Page-specific component groups
│   │   ├── resume/           # Resume Optimization Studio components
│   │   │   ├── OptimiseModal.tsx   # Choose resume → Analysis modal (bottom sheet mobile, centered desktop); tabs: Original (viewer) | Keyword highlights
│   │   │   ├── OptimiseModal.module.css
│   │   │   ├── ResumeFileViewer.tsx  # Document viewer: PDF (pdf.js canvas per page) + DOCX (docx-preview Shadow DOM)
│   │   │   ├── ResumeFileViewer.module.css
│   │   │   ├── ResumeHighlight.tsx # Segmented resume text highlighter (matched/weak)
│   │   │   ├── ResumeEditorLayout.tsx # Split-screen Editor Mode layout (editor pane left, A4 preview pane right)
│   │   │   ├── ResumeEditorLayout.module.css
│   │   │   ├── ResumeEditorSidebar.tsx # Left pane: ATS Issues box + section accordions (forms)
│   │   │   ├── ResumeEditorSidebar.module.css
│   │   │   ├── ResumePreview.tsx # Right pane: typeset A4-style resume document preview
│   │   │   ├── ResumePreview.module.css
│   │   │   └── ResumeHighlight.module.css
│   │   ├── MeshBackground.tsx# App-wide ambient mesh gradient (decorative, aria-hidden)
│   │   ├── Modal.tsx, NewEventModal.tsx, NewJobModal.tsx, NewPostModal.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── VerificationGate.tsx
│   ├── features/
│   │   └── dashboard/        # Dashboard sub-components (GreetingHeader, MessagesCard, …)
│   ├── data/
│   │   ├── jobBoardSeed.ts   # JOB_BOARD_SEED (mock jobs); DEFAULT_RESUME removed
│   │   └── globePeople.ts
│   └── assets/               # hero.png, alumni_directory.png, job_portal.png, mentorship.png,
│                             # networking_hub.png, donation.png, favicon.svg
```

---

## 5. Feature Map

### Public (no login required)
| Route | Page | Purpose |
|-------|------|---------|
| `/` | Home | Landing page |
| `/auth` | Auth | Sign in / sign up (Supabase Auth) |
| `/about`, `/contact`, `/privacy`, `/terms`, `/guidelines` | ComingSoon | Placeholder static pages |

### Authenticated (share `AppShell`)
| Route | Page | Purpose | Gate |
|-------|------|---------|------|
| `/dashboard` | Dashboard | Greeting, verification banner, completeness checklist, messages/jobs/events/forums/batchmates, invite card | None (always accessible) |
| `/admin` | AdminDashboard | Admin tooling | None (admin is always verified — known gap) |
| `/directory` | Directory | Searchable alumni directory | VerificationGate |
| `/profile/:id` | Profile | Alumni profile view | VerificationGate |
| `/forums` | Forums | College forum posts | VerificationGate |
| `/jobs` | Jobs | Job board + resume match scoring + Optimise entry | VerificationGate |
| `/jobs/:jobId/optimise` | Optimise | Resume vs job analysis (matched/missing/weak, score breakdown, highlighted text) | VerificationGate (via parent `/jobs` shell) |
| `/jobs/:jobId/editor` | ResumeEditor | Full-page split-screen resume editor: structured forms (left) + live A4 preview (right) | VerificationGate (via parent `/jobs` shell) |
| `/events` | Events | College events calendar | VerificationGate |
| `/chat`, `/chat/:channelId` | Chat | Realtime group + DM chat | VerificationGate |

### Dev-only
| Route | Purpose |
|-------|---------|
| `/ui-kit` | Component gallery (dev only, conditionally loaded) |
| `/forums/preview`, `/jobs/preview`, `/directory/preview` | Shell frame previews (temp, removed before final build) |

### Shell navigation (desktop sidebar + mobile tab bar + More sheet)
Dashboard → Chat → Directory → Forums → Jobs → Events (+ Admin for admins)

### Verification model (`useAuth.ts`)
- `isVerified = user_type === 'admin' || verification_status === 'approved'`
- Verification status read from `profiles` row, falling back to `user_metadata`
- Unverified users see "Account under review" on the dashboard; restricted routes are locked behind `VerificationGate`

---

## 6. Data Model (Supabase)

Tables live only in the Supabase project dashboard (no migrations in repo):

- `profiles` — id, full_name, email, college, branch, graduation_year, user_type, verification_status, avatar_url, bio, skills, linkedin, company, job_title, firstMessageSent, …
- `channels` — id, name, type (batch_year \| batch_branch \| dm), graduation_year, branch, created_at
- `channel_members` — channel_id, user_id, joined_at, last_read_at
- `messages` — id, channel_id, sender_id, content, created_at, read_by
- `events` — id, title, date, location
- `forum_posts` — id, title, category, created_at, author_id
- `jobs` — id, title, company, location, type, created_at, author_id
- **`resumes`** — id, user_id, file_name, file_path, mime_type, size_bytes, status ('ready' \| 'needs_attention' \| 'uploaded'), parsed (jsonb), extracted_text (text), created_at
- Storage buckets: `avatars`, **`resumes`** (private)

Batch channels (`Class of YYYY`, `Class of YYYY — Branch`) are auto-created and joined on login via `chat.ts`.

**Resume setup required in Supabase dashboard** (see onboarding notes below):
1. Create table `public.resumes` with the columns above.
2. Create private storage bucket `resumes`.
3. Enable RLS on `resumes` and `storage.objects` so users only touch their own rows/objects (`owner = auth.uid()`).

---

## 7. Design System

### Tokens (`src/styles/tokens.css`)
Single source of truth. Light on `:root` / `[data-theme="light"]`, dark under `[data-theme="dark"]` and `@media (prefers-color-scheme: dark)` for `system`. Resolved via `ThemeContext` → `data-theme` attribute.

**Light palette:** bg `#F5F5F7`, ink `#1D1D1F`, secondary `#636366`, accent `#0071E3`, success `#34C759`, warning `#FF9F0A`, danger `#FF3B30`.

**Dark palette:** bg `#0A0A0B`, ink `#F5F5F7`, secondary `#A1A1A6`, accent `#0A84FF`, glass surfaces `rgba(28,28,30,0.6)`.

**Glass recipe:** `background: rgb(255 255 255 / 0.55); backdrop-filter: blur(24px) saturate(180%);` + 1px border `rgb(255 255 255 / 0.4)` + outer hairline `rgb(0 0 0 / 0.06)` + inset top highlight + layered soft shadow (1px / 8px / 24px).

**Glass usage:** chrome and floating layers only (nav, sidebar, sheets, modals, popovers, floating cards). Dense content (messages, form fields, long lists) on opaque surfaces. Max 2 nested glass layers. <6 `backdrop-filter` elements visible at once.

**Radii:** 10 / 14 / 20 / 28 / pill. **Spacing:** 4px grid. **Touch targets:** ≥44px.

**Type scale:** Large Title 34/40 w700, Title 28/34 w700, Headline 17/22 w600, Body 17/24, Callout 16, Subhead 15, Footnote 13, Caption 12. Tracking -0.02em on titles. Sentence case everywhere.

**Mesh background:** soft drifting pastel blobs (sage `#CCDAC6`, lavender `#D9CFF5`, blue `#C7E4F2`, accent `#C5D7F7`) behind everything so glass has something to blur.

### Motion (`src/lib/motion.ts`)
- Only `transform` and `opacity` animated — never layout properties.
- Interactions: springs (stiffness 300, damping 30, mass 1).
- Fades/reveals: 200–400ms, `cubic-bezier(0.22, 1, 0.36, 1)`.
- Buttons: scale 0.97 on press, lift on hover (pointer only). Page transitions: fade in + 8px rise. Lists: stagger 40ms, max 8 items. Modals: bottom sheets on mobile, centered scale-in on desktop. Skeletons instead of spinners.
- `prefers-reduced-motion`: no parallax/stagger/mesh animation; simple fades only.
- `prefers-reduced-transparency`: solid surfaces.
- `@supports not (backdrop-filter)`: solid opaque fallback.

### Accessibility & responsiveness
- ≥4.5:1 contrast on every glass surface, light and dark.
- `:focus-visible` ring: 3px, accent at 40%.
- Semantic HTML, labelled inputs, ARIA on modals/tabs, full keyboard support.
- Mobile first: 360px → 1920px. `dvh` units, `env(safe-area-inset-*)`.
- Themes: `light \| dark \| system` (default `system`), persisted under `almanet-theme` in localStorage.

---

## 8. Resume Optimization Studio — Feature Details

**Rule-based, in-browser analysis — no AI calls, no network transmission of resume text.**

**Flow:**
1. User uploads a PDF/DOCX via **Jobs → My resume** (existing upload flow; text extracted via `pdfjs-dist` / `mammoth`, stored in `public.resumes.extracted_text`). The **My resume** panel opens a document viewer with tabs **Resume** (original file, rendered visually via `ResumeFileViewer`) | **Text we read** (extracted text, monospace, read-only).
2. On the **Jobs** page, each card shows a score ring + label computed against the active uploaded resume via `useResumes()` (active id remembered in `localStorage`, id-only — never text).
3. "Match Score" sort uses the new score; jobs stay newest-first when there is no resume. Cards with no resume show a quiet "Upload your resume to see your match" prompt with a **My resume** link.
4. Clicking **Optimise** opens `OptimiseModal`:
   - **Step 1 — Choose a resume:** selectable cards of ready resumes with live score for this job; active one preselected; "Upload a new resume" option.
   - **Step 2 — Analysis:** tabs **Original** (default; renders the original PDF/DOCX as a document via `ResumeFileViewer`) | **Keyword highlights** (the existing `ResumeHighlight`, unchanged). Score ring + label, top-3 fixes, Matched / Missing / Weak keyword groups (missing keywords have an "I have this skill" checkbox), collapsible score breakdown, disabled "Improve with AI — Coming next" button.
5. Bottom sheet on mobile; centered scale-in on desktop; focus trap, Escape to close, return focus to trigger, `aria-live` announcements, transform/opacity only motion.
6. Clicking **"Fix →"** on any ATS issue (or **"Edit in Editor Mode"**) navigates to `/jobs/:jobId/editor` — a full-page split-screen Editor Mode (`ResumeEditor` page, wrapped in `VerificationGate`). Left pane: ATS Issues box + accordion forms (Summary & Contact, Experience, Projects, Education, Skills, Certifications) with inline edit (pencil), visibility (eye), and delete (trash) actions plus "+ Add" buttons. Right pane: live A4-style typeset preview — white paper, bold uppercase section headers, split title/dates rows, bullet points. Edits update the preview instantly; "Save changes" serializes to localStorage and returns to the analysis step; "Export PDF" generates a client-side PDF via `jspdf`.

**Scoring parts (total 100):** core keyword coverage 45, evidence in bullets 10, role/title fit 10, level fit 10, ATS-friendliness 25. Labels: 0–39 Poor, 40–59 Fair, 60–79 Good, 80–100 Excellent. Keyword stuffing capped at 3 counts per keyword.

**Files:** `src/lib/resume/skillDictionary.ts`, `textUtils.ts`, `analyzeResume.ts`, `structuredResumeParser.ts`, `parseResume.ts`, `pickViewer.ts`, `pickViewer.test.ts`, `fetchResumeFile.ts`, `useResumes.ts`, `analyzeResume.test.ts`; `src/components/resume/OptimiseModal.tsx`, `ResumeFileViewer.tsx`, `ResumeEditorLayout.tsx`, `ResumeEditorSidebar.tsx`, `ResumePreview.tsx`, `ResumeHighlight.tsx` (+ CSS modules); `src/pages/Jobs.tsx`, `src/pages/Optimise.tsx`, `src/pages/ResumeEditor.tsx`; `src/types/resume.ts`, `src/types/job-matching.ts`.

---

## 9. Legacy Bridge

`src/index.css` holds legacy variables (`--bg-primary`, `--brand-primary`, `.card`, `.btn`, `.input-field`) that alias new tokens. Still referenced by Profile, AdminDashboard, and VerificationGate until those pages are fully redesigned. Delete only when nothing references them.

The old `DEFAULT_RESUME` ("Raunak Shaikh") sample resume and `src/lib/atsScoring.ts` were removed during the Resume Optimization Studio implementation. Resume scoring now uses only the user's own uploaded resumes via `src/lib/resume/`.

---

## 10. Commands & Verification

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server |
| `npm run lint` | oxlint (no type-aware rules) |
| `npm run test` | vitest run (resume analysis logic) |
| `npm run build` | `tsc -b && vite build` — **this is the typecheck step** |
| `npm run deploy` | builds, then `gh-pages -d dist` publishes to `gh-pages` branch |

**Workflow rule:** after every task, run `lint` + `build` (+ `test` when touching `src/lib/resume/`), fix all errors, then summarize files changed. Never commit, push, or deploy — the user reviews and commits.

**Gotcha:** Supabase credentials come from `.env` (gitignored, no `.env.example`). Without them the app renders but all data silently fails (placeholder Supabase URL). Copy the project's `.env` before testing anything data-related.

**Gotcha:** `HashRouter` is intentional for GitHub Pages deep links. Production base path is `/Almanet/` — reference public assets via `import.meta.env.BASE_URL`, never a hardcoded leading `/`.

**Gotcha:** `extracted_text` column on `public.resumes` and private `resumes` storage bucket must exist in the Supabase dashboard for upload/scoring to work (no migrations in repo).

---

## 11. Constraints Summary (for any future work)

1. **Do not touch** auth/lib files, route definitions, HashRouter, VerificationGate logic, submit handlers, validation rules, or data shapes during UI work.
2. **No Tailwind framework** — plain CSS + CSS Modules only.
3. **No React Compiler** without user sign-off.
4. **Icons:** lucide-react only, strokeWidth 1.75, no emoji.
5. **Allowed new deps:** `motion`, `@fontsource-variable/inter`, `vitest` (dev), `jspdf`, `html2canvas` (+ `@types/jspdf` dev) only.
6. **TS config:** `erasableSyntaxOnly` and `verbatimModuleSyntax` on — use `import type` for type-only imports, no enums.
7. **Schema/RLS changes** happen in the Supabase dashboard, not in code.
8. **Deploy** is manual (user-run `npm run deploy`); agent must never run it.
9. **No AI calls** in the Resume Optimization Studio — all scoring/analysis is rule-based and runs in the browser; never log or transmit resume text.
