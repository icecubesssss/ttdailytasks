# TT Daily Task

Ứng dụng quản lý công việc cho cặp đôi với focus mode, calendar sync, gamification và AI assistant.

## Quick Start
```bash
npm install
npm run dev
```

## Scripts
- `npm run dev`: chạy local
- `npm run build`: build production
- `npm run lint`: lint code
- `npm run pack`: tạo repomix context khi cần

## Project Structure
- `src/components/`: UI theo feature
- `src/hooks/`: business logic
- `src/services/`: tích hợp Firebase/AI/API
- `src/store/`: Zustand store
- `src/utils/`: constants/helpers
- `chrome-extension/`: extension YouTube focus-block (project riêng)

## Docs
- [docs/prompt.md](./docs/prompt.md)
- [docs/runbook.md](./docs/runbook.md)
- [docs/GUIDELINES.md](./docs/GUIDELINES.md)
- [docs/architecture.md](./docs/architecture.md)
