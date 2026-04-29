# Refactor Plan - Full Phases

## Overview
Complete the remaining refactor of .jsx components to .tsx across feature areas.
- Policy: Feature-first, opportunistic. Only convert when touching related features.
- Scope: Small patches, safe changes. Run `npm run build` and `npm run lint` after each file.
- Total remaining: 5 .jsx files (focus:5).

## Phase 3: Auth + Shop Components ✅ COMPLETED
Convert 4 .jsx files in auth and shop.
- Files: LoginScreen.jsx, SplashScreen.jsx (auth); ShopView.jsx, ClosetView.jsx (shop)
- Trigger: When touching login/auth or shop features.
- Steps: Add types, rename to .tsx, build/lint, update backlog.

## Phase 4: Focus Components
Convert remaining 5 .jsx files in `src/components/focus/` to .tsx.
- Files: TimerRing.jsx, FocusView.jsx, FocusChecklist.jsx, DuoFocusBanner.jsx, MusicPrompt.jsx
- Trigger: When touching focus timer or music features.
- Steps: Add types, rename to .tsx, build/lint, update backlog.

## Phase 5: Cleanup Casts
Remove remaining `as any`/`as unknown as` casts in hooks and contexts.
- Files: useUserStats.ts, useFocusMusic.ts, useAppBootstrap.ts, TaskContext.tsx
- Trigger: When touching data flow or user features.
- Steps: Add typed guards/helpers, remove casts, build/lint, update backlog.

## Verification
- After each phase: `npx tsc -p tsconfig.json --noEmit` pass.
- Update TECH_DEBT_BACKLOG.md with completion logs.

## Cleanup
Delete this file after all phases complete.