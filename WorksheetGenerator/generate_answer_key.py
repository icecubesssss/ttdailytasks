import json
from fpdf import FPDF
import os

class AnswerKeyPDF(FPDF):
    def header(self):
        self.set_fill_color(220, 50, 50) # Red for Answer Key
        self.rect(0, 0, 210, 30, 'F')
        self.set_font('Arial', 'B', 20)
        self.set_text_color(255, 255, 255)
        self.cell(0, 10, 'ĐÁP ÁN CHI TIẾT - HỆ PHƯƠNG TRÌNH', ln=True, align='C')
        self.set_font('Arial', '', 10)
        self.cell(0, 5, 'DÀNH CHO GIÁO VIÊN', ln=True, align='C')
        self.ln(10)

def generate():
    # Placeholder answers logic
    answers = {
        "mc1": "B. 0x - 0y = 5 (Vì cả a và b đều bằng 0)",
        "mc2": "C. a=2, b=-3, c=-1 (Biến đổi 2x - 1 = 3y thành 2x - 3y = 1)",
        "q5": "Cặp số (2; -3) là nghiệm của 2x - y = 7 (Vì 2.2 - (-3) = 4 + 3 = 7)",
        "ex1": "y = 2x + 1. Đồ thị đi qua (0; 1) và (1; 3)",
        "prob_stem": "x + y = 180; 0.15x + 0.1y = 22. Giải hệ: x = 80, y = 100."
    }

    pdf = AnswerKeyPDF()
    font_path = '/Library/Fonts/Arial Unicode.ttf'
    pdf.add_font('Arial', '', font_path, uni=True)
    pdf.add_font('Arial', 'B', font_path, uni=True)
    
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    pdf.set_font('Arial', 'B', 14)
    pdf.cell(0, 10, "LỜI GIẢI VÀ HƯỚNG DẪN CHẤM", ln=True)
    pdf.ln(5)

    for q_id, ans in answers.items():
        pdf.set_font('Arial', 'B', 11)
        pdf.cell(0, 8, f"Câu {q_id}:", ln=True)
        pdf.set_font('Arial', '', 11)
        pdf.multi_cell(190, 8, ans)
        pdf.ln(5)

    output_path = 'WorksheetGenerator/Phieu_Dap_An_Giao_Vien.pdf'
    pdf.output(output_path)
    print(f"Answer Key generated successfully at {output_path}")

if __name__ == "__main__":
    generate()
