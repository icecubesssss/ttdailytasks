# TT Daily Task - Project Guidelines & Guardrails

Tài liệu quy chuẩn cố định để phát triển theo mode feature-first.

## 1. Tech & TypeScript
- `src/` đã 100% TypeScript (`strict: true`). Không tạo file `.jsx/.js` mới trong `src/`.
- Chrome Extension và Scriptable widget giữ plain JS (platform requirement — không đổi).
- Khi thêm feature mới, file phải là `.ts/.tsx`.

## 2. React 19 Guardrails (Critical)
- Không `setState` đồng bộ trong `useEffect`; dùng `requestAnimationFrame(() => set...)` khi cần.
- Không mutate trực tiếp object từ ref/hook (ví dụ audio ref); dùng `Object.assign` hoặc clone.
- Giữ `globalAudio` singleton ngoài component để tránh re-init.

## 3. Architecture Rules
- Business logic nằm trong `src/hooks/`.
- API/Firestore/AI integration nằm trong `src/services/`.
- Component tập trung render/orchestration, tránh nhồi business logic.
- Tránh tạo duplicate file `.js/.ts` cùng tên module.

## 4. Type Rules (Short)
- Reuse type hiện có, tránh khai báo lại local nếu không cần.
- Task shape phải align với Context/Service đang dùng.
- Chỉ dùng `any` tạm thời để unblock build, thay lại ở task kế tiếp.

## 5. Quality Gates
- Bắt buộc `npm run build` pass.
- Bắt buộc `npm run lint` pass (0 lỗi).
- Xóa unused imports/variables trước khi kết thúc task.

## 6. One-line AI Prompt
`Đọc docs/prompt.md và làm theo đó.`

## 7. Documentation Freshness Rule
- Mọi commit có thay đổi code phải cập nhật file `.md` liên quan trong cùng commit.
- Cập nhật `docs/architecture.md` khi đổi contract giữa module/context/hook hoặc data shape.
- Cập nhật `docs/runbook.md` khi thay đổi quy trình build/typecheck/lint hoặc flow debug.
- Không đóng task nếu docs chưa phản ánh đúng trạng thái code hiện tại.
