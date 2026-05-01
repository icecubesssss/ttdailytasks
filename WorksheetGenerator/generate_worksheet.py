import json
from fpdf import FPDF
import os

class WorksheetPDF(FPDF):
    def header(self):
        # Header background
        self.set_fill_color(0, 128, 128) # Teal
        self.rect(0, 0, 210, 30, 'F')
        
        self.set_font('Arial', 'B', 20)
        self.set_text_color(255, 255, 255)
        self.cell(0, 10, 'HỆ PHƯƠNG TRÌNH BẬC NHẤT HAI ẨN', ln=True, align='C')
        self.set_font('Arial', '', 10)
        self.cell(0, 5, 'PHIẾU HỌC TẬP THÔNG MINH - SCAFFOLDING & GAMIFICATION', ln=True, align='C')
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f'Trang {self.page_no()} | Được tạo bởi Antigravity Assistant', 0, 0, 'C')

    def add_quest_header(self, title, level, time):
        self.set_fill_color(240, 240, 240)
        self.set_text_color(0, 64, 64)
        self.set_font('Arial', 'B', 14)
        self.cell(0, 10, f' {title}', fill=True, ln=True)
        self.set_font('Arial', '', 9)
        self.set_text_color(100, 100, 100)
        self.cell(0, 5, f' Độ khó: {level} | Thời gian dự kiến: {time}', ln=True)
        self.ln(5)

    def add_hint(self, text):
        self.set_fill_color(255, 250, 220) # Light yellow
        self.set_font('Arial', 'I', 9)
        self.set_text_color(100, 80, 0)
        # Use a safe width for multi_cell (A4 is 210mm, 10mm margins = 190mm)
        self.multi_cell(190, 5, f'Gợi ý: {text}', border=1, fill=True)
        self.ln(2)

def generate():
    with open('WorksheetGenerator/src/data/content.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    pdf = WorksheetPDF()
    # Add Vietnamese font support
    font_path = '/Library/Fonts/Arial Unicode.ttf'
    pdf.add_font('Arial', '', font_path, uni=True)
    pdf.add_font('Arial', 'B', font_path, uni=True)
    pdf.add_font('Arial', 'I', font_path, uni=True)
    
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    for section in data['sections']:
        if section['id'] == 'homework':
            pdf.add_page()
            pdf.set_fill_color(64, 64, 64)
            pdf.set_text_color(255, 255, 255)
            pdf.set_font('Arial', 'B', 16)
            pdf.cell(0, 12, section['title'], fill=True, ln=True, align='C')
            pdf.ln(5)
            pdf.set_text_color(0, 0, 0)
            pdf.set_font('Arial', '', 11)
            for q in section['questions']:
                pdf.multi_cell(0, 8, f"• {q['content']}")
                pdf.ln(2)
            continue

        pdf.add_quest_header(section['title'], section.get('level', 'N/A'), section.get('time', 'N/A'))
        
        for q in section['questions']:
            pdf.set_font('Arial', 'B', 11)
            pdf.set_text_color(0, 0, 0)
            pdf.multi_cell(190, 7, f"Câu hỏi: {q['content']}")
            
            if 'hint' in q:
                pdf.add_hint(q['hint'])
            
            if q.get('type') == 'multiple_choice':
                pdf.set_font('Arial', '', 10)
                cols = q['options']
                for i, opt in enumerate(cols):
                    pdf.cell(90, 7, f"{chr(65+i)}. {opt}", ln=(i % 2 == 1))
                if len(cols) % 2 != 0: pdf.ln(7)
            
            if q.get('type') == 'drawing' or q.get('type') == 'essay' or 'scaffolding_steps' in q:
                pdf.ln(2)
                if 'scaffolding_steps' in q:
                    pdf.set_font('Arial', 'I', 9)
                    pdf.set_text_color(80, 80, 80)
                    for step in q['scaffolding_steps']:
                        pdf.cell(0, 5, f"  - {step}", ln=True)
                
                # Add writing space
                lines = q.get('space_lines', 5)
                pdf.set_draw_color(220, 220, 220)
                for _ in range(lines):
                    pdf.ln(6)
                    pdf.line(pdf.get_x(), pdf.get_y(), pdf.get_x() + 190, pdf.get_y())
            
            pdf.ln(10)

    output_path = 'WorksheetGenerator/Phieu_Hoc_Tap_He_Phuong_Trinh.pdf'
    pdf.output(output_path)
    print(f"PDF generated successfully at {output_path}")

if __name__ == "__main__":
    generate()
