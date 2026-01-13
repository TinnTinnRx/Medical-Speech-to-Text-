# Medical AI Transcription (GitHub Pages)

คุณสมบัติ
- ✅ ถอดเสียงจากไฟล์โดยตรง (ไม่ต้องเปิดลำโพง)
- ✅ รันบนเบราว์เซอร์ (GitHub Pages / static hosting)
- ✅ ไม่ต้องมี Backend (ประมวลผลบนเครื่องผู้ใช้)
- ✅ รองรับหลายภาษา (Whisper multilingual)
- ✅ ดาวน์โหลดผลลัพธ์เป็น .txt

## โครงสร้างไฟล์
- index.html
- css/style.css
- css/animations.css
- css/responsive.css
- js/whisper.js
- js/recorder.js
- js/ui.js

## Deploy บน GitHub Pages
1) สร้าง repo แล้วอัปโหลดไฟล์ทั้งหมดในแพ็กนี้ (ให้ index.html อยู่ root)
2) ไปที่ Settings → Pages → Deploy from a branch → เลือก branch (main) และ /(root)
3) เปิด URL ที่ GitHub Pages ให้มา

## หมายเหตุด้านความเป็นส่วนตัว
- ระบบนี้ไม่มี backend ของคุณเอง
- อย่างไรก็ตาม โมเดลจะถูกดาวน์โหลดจาก Hugging Face/CDN เมื่อใช้งานครั้งแรก (ข้อมูลเสียงยังประมวลผลในเครื่องผู้ใช้)
