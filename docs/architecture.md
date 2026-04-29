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
- Refactor theo batch nhỏ, mỗi batch phải qua build/lint.

## TS Migration — COMPLETED 2026-04-30
- Toàn bộ `src/` đã 100% TypeScript/TSX.
- Chrome Extension và Scriptable widget giữ plain JS theo yêu cầu platform.
