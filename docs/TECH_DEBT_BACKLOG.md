# TECH DEBT BACKLOG

Last updated: 2026-04-28

Mode: Feature-first, refactor opportunistic only.

## Working Policy
- Chỉ refactor khi đang làm feature liên quan.
- Ưu tiên patch nhỏ, an toàn, không mở rộng scope.
- Mỗi task vẫn phải qua `npm run build` và `npm run lint`.

## Current Debt Candidates
1. Auth components còn `.jsx` (`LoginScreen`, `SplashScreen`) -> chuyển `.tsx` khi đụng feature auth.
2. Các feature components còn `.jsx` (calendar/focus/shop/stats/tasks) -> migrate dần theo file được chạm.
3. Duplicate `.js/.ts` cùng module (nếu còn phát sinh) -> xử lý ngay trong cùng task.
4. Remaining temporary casts (`as any`/`as unknown as`) cần dọn theo cụm type contract:
   - `src/hooks/useUserStats.ts`: `DEFAULT_AVATARS`/`BOOSTER_DURATIONS` đang index bằng key động; cần typed dictionary key union.
   - `src/hooks/useFocusMusic.ts`: Firestore `doc.data()` cần decode typed thay vì cast thẳng.
   - `src/hooks/useAppBootstrap.ts`, `src/contexts/TaskContext.tsx`: còn `as unknown as` để bridge giữa local dummy/auth-subtask shape và type chính.

## Done Log
- 2026-04-28: Foundation type fixes + build/lint xanh.
- 2026-04-28: Convert `useTaskActions` sang TS, remove duplicate `useTTApp.js`.
- 2026-04-28: Convert 7 layout components sang TSX.
- 2026-04-28: Removed `as any` in layout flow (`AppMainContent`, `AppOverlays`, `Dashboard`, `App.tsx`) bằng typed component wrappers/props; giữ lại 1 bridge cast ở `TaskForm` vì component nguồn còn `.jsx`.
- 2026-04-28: Phase 1 complete - removed map/index casts in calendar flow (`CalendarView.tsx`, `useCalendarAutoSync.ts`, `WeeklyOverview.tsx`) bằng typed owner key guard; `npx tsc -p tsconfig.json --noEmit` pass.
- 2026-04-28: Phase 2 complete - normalized model usage in hooks (`useAppViewModel.ts`, `useFocusTimer.ts`, `useHeartbeat.ts`, `useProductivityStats.ts`, `useTaskActions.ts`, `useDailyQuest.ts`) and added `UserData.aiModel?` in `src/utils/helpers.ts`; removed casts in this batch; `npx tsc -p tsconfig.json --noEmit` pass.
- 2026-04-28: Phase 3 complete - migrated `src/components/tasks/TaskForm.jsx` -> `src/components/tasks/TaskForm.tsx` with explicit props/types and removed `TaskForm` bridge cast in `src/components/layout/AppMainContent.tsx`; `npx tsc -p tsconfig.json --noEmit` pass.
- 2026-04-28: Phase 4 complete - removed casts in `useFocusMusic.ts`, `useUserStats.ts`, `useAppBootstrap.ts`, `TaskContext.tsx` via Firestore data decode, typed key guards, and local dummy-user narrowing; `npx tsc -p tsconfig.json --noEmit` pass.

## Verification Note (2026-04-28)
- Type-check after refactor: `npx tsc -p tsconfig.json --noEmit` ✅

## Quick Verify
```bash
npm run build
npm run lint
```
