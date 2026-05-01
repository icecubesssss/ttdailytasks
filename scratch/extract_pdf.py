import PyPDF2
import os

pdf_path = "WorksheetGenerator/2. PHƯƠNG TRÌNH - HỆ PHƯƠNG TRÌNH BẬC NHẤT HAI ẨN.pdf"
output_path = "WorksheetGenerator/content.txt"

def extract_text():
    if not os.path.exists(pdf_path):
        print(f"File not found: {pdf_path}")
        return
    
    try:
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            
            with open(output_path, 'w', encoding='utf-8') as out:
                out.write(text)
            print(f"Successfully extracted text to {output_path}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    extract_text()
