# Prompt cho AI

## Prompt siêu ngắn (copy-paste):
```
Đọc docs/prompt.md và làm theo đó.
```

## Prompt đầy đủ (AI tự đọc file này và làm):
Đọc 2 file sau theo thứ tự trước khi làm bất cứ gì:
1. `docs/GUIDELINES.md` — quy tắc code, TypeScript rules, quality gates
2. `docs/architecture.md` — stack, layout thư mục, runtime flow, sync/debug logic

Sau đó:
- Làm đúng task được yêu cầu, không mở rộng scope.
- Chạy `npm run build` và `npm run lint` sau mỗi thay đổi.
- Cập nhật `docs/architecture.md` nếu đổi contract module/hook/context.
- Báo kết quả ngắn gọn: đã làm gì, kết quả build/lint ra sao.
