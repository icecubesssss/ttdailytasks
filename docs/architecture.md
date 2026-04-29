# Architecture Snapshot

Last updated: 2026-04-30

## Stack
- React 19 + Vite
- TypeScript (`strict: true`) — **100% TS trong `src/`**
- Zustand for global state
- Firebase (Auth, Firestore, Storage)

## Source Layout
- `src/components/`: UI theo feature (100% TSX)
- `src/hooks/`: business logic orchestration (100% TS)
- `src/services/`: external integrations (Firebase/AI/API)
- `src/store/`: Zustand state container
- `src/contexts/`: cross-feature contexts
- `src/utils/`: constants/helpers
- `chrome-extension/`: dự án phụ, plain JS (không qua build step)
- `public/widget.js`: Scriptable iOS widget, plain JS (platform requirement)

## Runtime Flow
1. `main.tsx` boot app
2. `App.tsx` mount layout/providers
3. `useTTApp.ts` điều phối state + hooks chính
4. Hooks gọi `services/*` để sync dữ liệu
5. UI components render theo state từ hooks/store/contexts

## Key Rules
- Không đưa business logic nặng vào component.
- API/Firestore logic phải đi qua `services/`.
- Tránh duplicate module `.js/.ts` cùng tên.
- Bắt buộc `npm run build` + `npm run lint` pass trước khi kết thúc task.

## Sync Logic & Debug
### Calendar Sync
- **Source of Truth:** Fetch qua Apps Script (fallback Direct API).
- **Auto-create task:** Xử lý tại `useCalendarAutoSync.ts`.
- **Dedupe strategy:** Ưu tiên `calendarEventId`, fallback `title + scheduledStartTime`.
- **Force sync:** Xảy ra ngay khi chuyển sang tab Calendar.

### Debug Checklist
- Kiểm tra ENV: `VITE_APPS_SCRIPT_URL`, `VITE_GOOGLE_CALENDAR_API_KEY`, `VITE_CALENDAR_ID_TIT`, `VITE_CALENDAR_ID_TUN`.
- Kiểm tra User Setting: `autoSyncCalendar`.
- Heartbeat stale check: Xem tại `checkTaskStale` trong `helpers.ts`.

## TS Migration — COMPLETED 2026-04-30
- Toàn bộ `src/` đã 100% TypeScript/TSX.
- Chrome Extension và Scriptable widget giữ plain JS theo yêu cầu platform.
