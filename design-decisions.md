# Design decisions — Dashboard redesign

Status: Phase 1 complete (no git commit made — AGENTS.md reserves commits for your review).

## 1. Chosen style
Dark-first Apple Liquid Glass aesthetic (per the task's Phase 2 brief), with a complete light theme via `[data-theme="light"]`. Glass (backdrop-filter blur) is used ONLY on the navigation layer (sidebar, mobile tab bar, popovers/modals); all content cards are solid surfaces with 1px hairline borders. The page background is a near-flat colour with one soft blue radial glow top-left and one faint violet glow bottom-right so glass has something to refract. No gradient washes elsewhere.

This is driven by:
- Apple design skill / HIG: glass on navigation layer, clear content layer, no 2px black borders, sentence case, no uppercase headings.
- ui-skills baseline-ui: no gradients unless explicitly requested, no glow as primary affordance, accent limited to one per view.
- ui-ux-pro-max Liquid Glass style: glass sparingly on navigation and controls, content on a separate layer, test reduced transparency/motion.
- AGENTS.md design constitution (tokens, glass recipe, motion rules, radii, type scale).

## 2. Tokens (extend src/styles/tokens.css)
Added a `[data-theme="dark"]` block (task-specified dark values) and kept/extended `[data-theme="light"]` with task-specified light values:
- Dark: bg #0a0a0b, surface #111113, surface-2 #1a1a1d, border rgba(255,255,255,.08), text #f5f5f7, text-2 #a1a1a6, text-3 #8e8e93, accent #0a84ff, accent-text #5eb0ff, success #30d158, warning #ff9f0a, danger #ff453a.
- Light: bg #f5f5f7, surface #ffffff, border rgba(0,0,0,.08), text #1d1d1f, text-2 #636366, accent #0071e3, accent-text #0058b0.
- Avatar ring colours: orange #ff9f0a, green #30d158, blue #0a84ff, purple #bf5af2, yellow #ffd60a.
- Radii: cards 22px, controls 12px, pills 999px, sidebar 24px.
- Spacing 4px grid: 4/8/12/16/24/32/48.
- Type: system stack, min body 15px, chips 12px/600.

## 3. Type scale (task-specified)
- Page title: 34/40 w600 tracking -0.035em
- Section title: 17/22 w600
- Body: 15/22
- Secondary: 13/18
- Caption: 12

## 4. Glass rules
- backdrop-filter ONLY on sidebar, mobile tab bar, popovers/modals.
- @supports not (backdrop-filter) solid fallback; prefers-reduced-transparency honoured (solid surfaces).
- Never nest more than 2 glass layers; keep <6 backdrop-filter elements visible.

## 5. Motion rules (from src/lib/motion.ts + ui-skills choreograph)
- Entrance: header fades up; cards stagger 60-80ms, cap 6 items, 600ms, cubic-bezier(.2,.8,.2,1).
- Hover lift 2px on interactive cards (200ms).
- Tab panel change: crossfade 150ms.
- Unread badge: pops in once (scale .5→1, 500ms).
- Skeleton shimmer: translateX on pseudo-element.
- prefers-reduced-motion: no animation, all content visible.
- Only transform + opacity animated.

## 6. Components to create under src/features/dashboard/
GreetingHeader, VerificationBanner, MessagesCard, GetStartedCard, WhatsNewTabs, BatchStrip, InviteCard — each with its own CSS Module. Plus src/lib/dashboardData.ts (read-only queries).

## 7. Skill rules applied
| Skill | Rule applied |
|-------|--------------|
| Apple design (HIG) | Glass on nav only; solid content cards; hairline borders; sentence case; no black borders/shadows; focus ring; safe-area-inset; dvh units; theme light|dark|system |
| ui-ux-pro-max | No emoji icons; cursor:pointer on clickables; 4.5:1 contrast; visible focus; reduced motion respected; responsive 375/768/1024/1440; chips wrap not truncate; badge live-region phrasing |
| baseline-ui | Skeletons for loading; animate only transform/opacity; no layout animation; ease-out on entrance; <=200ms interaction feedback; respects reduced motion; no useEffect for render logic; empty state with one clear next action |
| choreograph | One entrance per container (panel carries content); no stagger on high-frequency UI; non-uniform delays; motion never blocks interaction; sequences survive interruption |
| wcag-audit-patterns | One h1; h2 section headings; landmarks nav/main/aside; skip link; visible focus rings; AA contrast 4.5:1 both themes; no colour-only status; labels on every control; aria-live=polite toast; aria-hidden decoration; 200% zoom reflow |
