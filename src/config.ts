// Cấu hình môi trường cho app.
// (Backend đã chuyển hẳn sang Supabase — không còn khởi tạo Firebase ở client.)

// Gemini (AI mascot / tóm tắt)
export const geminiApiKey: string = import.meta.env.VITE_GEMINI_API_KEY || "";

// Google Calendar Integration
export const googleCalendarApiKey: string = import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY || "";
export const calendarIdTit: string = import.meta.env.VITE_CALENDAR_ID_TIT || "";
export const calendarIdTun: string = import.meta.env.VITE_CALENDAR_ID_TUN || "";

// Google Apps Script proxy (đồng bộ Calendar + upload nhạc lên Drive)
export const appsScriptUrl: string = import.meta.env.VITE_APPS_SCRIPT_URL || "";
