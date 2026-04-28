# Architecture Snapshot

Last updated: 2026-04-28

## Stack
- React 19 + Vite
- TypeScript (`strict: true`)
- Zustand for global state
- Firebase (Auth, Firestore, Storage)

## Source Layout
- `src/components/`: UI theo feature
- `src/hooks/`: business logic orchestration
- `src/services/`: external integrations (Firebase/AI/API)
- `src/store/`: Zustand state container
- `src/contexts/`: cross-feature contexts
- `src/utils/`: constants/helpers
- `chrome-extension/`: dự án phụ, không nằm trong app runtime chính

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

## Current Refactor Focus
- Đang ở Phase 3A: Auth components (`LoginScreen`, `SplashScreen`) JSX -> TSX.
