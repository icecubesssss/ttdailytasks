# 📑 WORKSHEET GENERATION SOP (Standard Operating Procedure)

Quy trình chuẩn để xây dựng phiếu học tập chất lượng cao (Scaffolding & Gamification).

## 1. Quy trình thực hiện (Workflow)

### Bước 1: Thu thập & Trích xuất (Extraction)
- Sử dụng công cụ trích xuất PDF sang text (ưu tiên giữ nguyên định dạng công thức).
- Cấu trúc lại dữ liệu thô sang file `content.json`.

### Bước 2: Kiểm định Toán học (Math Verification)
- Chạy script tự động giải các bài toán trong `content.json`.
- Kiểm tra tính logic (Ví dụ: Hệ phương trình có nghiệm duy nhất hay vô số nghiệm?).
- Gắn cờ các câu hỏi có số liệu "lẻ" hoặc dễ gây nhầm lẫn cho học sinh.

### Bước 3: Thiết kế Scaffolding (Giàn giáo)
- Chia bài tập thành 4 cấp độ (Easy -> Hard).
- Soạn thảo các "Hộp gợi ý" (Hints) cho từng cấp độ.
- Thiết kế các "Checklist tự kiểm tra" cho học sinh.

### Bước 4: Thiết kế Layout & Gamification
- Áp dụng Theme (Modern Premium).
- Đảm bảo khoảng trống (White space) tối ưu cho việc viết tay.
- Chèn các yếu tố game (EXP, Badge) tại các vị trí không gây xao nhãng.

### Bước 5: Review & Export
- Xem trước (Web Preview) để kiểm tra lỗi chính tả và công thức.
- Xuất bản PDF (Bản học sinh & Bản giáo viên).

---

## 2. Nhật ký rút kinh nghiệm (Lessons Learned)

| Ngày | Nội dung | Bài học rút kinh nghiệm |
| :--- | :--- | :--- |
| 01/05/2026 | Khởi tạo dự án | Nên chọn theme Neutral (Option B) để in ấn đẹp và phù hợp mọi đối tượng. |
| ... | ... | ... |

---

## 3. Tiêu chuẩn chất lượng (Definition of Done)
- [ ] Công thức Toán học (KaTeX) hiển thị sắc nét.
- [ ] Không có lỗi sai về số liệu.
- [ ] Đủ khoảng trống cho học sinh trình bày (tối thiểu 5-10 dòng/câu tự luận).
- [ ] Có file Đáp án chi tiết cho Giáo viên.
