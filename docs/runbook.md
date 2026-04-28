# TT Daily Task - Quick Runbook

Mục tiêu: giảm thời gian dò code khi debug/feature.

## 1) Vấn đề -> file chính
- Calendar event hiển thị nhưng không tạo task:
  - `src/hooks/useCalendarAutoSync.ts`
  - `src/components/calendar/CalendarView.tsx`
- Task auto complete bị gắn muộn sai:
  - `src/hooks/useAutoTaskLogic.ts`
  - `src/hooks/useTaskActions.ts`
- Task running bị pause do stale heartbeat:
  - `src/hooks/useHeartbeat.ts`
  - `src/utils/helpers.ts` (`checkTaskStale`)
- Lỗi update Firestore vì `undefined`:
  - `src/services/taskService.ts` (`updateTask`)

## 2) Calendar Sync - Source Of Truth
- Fetch strategy thống nhất: `Apps Script -> Direct Google Calendar API` fallback.
- Tạo task tự động ở: `useCalendarAutoSync`.
- Hiển thị lịch ở: `CalendarView`.
- Dedupe ưu tiên `calendarEventId`; fallback `title + scheduledStartTime + sameDay(deadline)`.

## 3) Expected Behavior (Calendar)
- Vào tab `Calendar` => force sync ngay 1 lần (không cần đợi interval).
- Sync nền định kỳ vẫn tôn trọng setting `autoSyncCalendar`.
- Task đã `completed/completed_late` không hiện trong cột "Công việc hạn ...".

## 4) Debug Checklist (nhanh)
1. Check env: `VITE_APPS_SCRIPT_URL`, `VITE_GOOGLE_CALENDAR_API_KEY`, `VITE_CALENDAR_ID_TIT`, `VITE_CALENDAR_ID_TUN`.
2. Check user setting: `autoSyncCalendar`.
3. Mở tab `Calendar` để kích hoạt force sync.
4. Kiểm tra dedupe key của task (`calendarEventId`, `scheduledStartTime`, `deadline`).
5. Chạy `npm run build` + `npm run lint` trước khi chốt.
