/**
 * Main Application Logic (Updated for Real API)
 */

// ===========================================
// Global Variables
// ===========================================
let currentFile = null;
let audioRecorder = null;
let recordingTimer = null;

// API Configuration
const API_CONFIG = {
    baseURL: 'http://localhost:8000',  // เปลี่ยนเป็น URL backend ของคุณ
    endpoints: {
        transcribe: '/transcribe',
        health: '/health'
    }
};

// ===========================================
// Initialize
// ===========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 App initializing...');
    
    initializeRecorder();
    initializeUpload();
    initializeFilePreview();
    initializeTranscription();
    checkAPIConnection();
    
    console.log('✅ App ready');
});

// ===========================================
// Check API Connection
// ===========================================
async function checkAPIConnection() {
    try {
        const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.health}`);
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API Connected:', data);
            showToast('API connected successfully', 'success');
        }
    } catch (error) {
        console.warn('⚠️ API not available:', error);
        showToast('Running in demo mode (Backend not connected)', 'warning');
    }
}

// ===========================================
// Recording Functions
// ===========================================
function initializeRecorder() {
    audioRecorder = new AudioRecorder();
    
    const startBtn = document.getElementById('startRecordBtn');
    const stopBtn = document.getElementById('stopRecordBtn');
    const statusEl = document.getElementById('recordingStatus');
    
    startBtn?.addEventListener('click', async () => {
        try {
            await audioRecorder.start();
            
            startBtn.style.display = 'none';
            stopBtn.style.display = 'inline-flex';
            statusEl.style.display = 'flex';
            
            updateRecordingTime();
            recordingTimer = setInterval(updateRecordingTime, 1000);
            
            showToast('Recording started', 'success');
            
        } catch (error) {
            console.error('Recording error:', error);
            
            if (error.name === 'NotAllowedError') {
                showToast('กรุณาอนุญาตให้ใช้ไมโครโฟน', 'error');
            } else if (error.name === 'NotFoundError') {
                showToast('ไม่พบไมโครโฟน', 'error');
            } else {
                showToast('ไม่สามารถเริ่มบันทึกได้: ' + error.message, 'error');
            }
        }
    });
    
    stopBtn?.addEventListener('click', () => {
        audioRecorder.stop();
        
        startBtn.style.display = 'inline-flex';
        stopBtn.style.display = 'none';
        statusEl.style.display = 'none';
        
        clearInterval(recordingTimer);
        document.querySelector('.recording-time').textContent = '00:00';
    });
    
    document.addEventListener('recordingComplete', (e) => {
        handleFileSelection(e.detail.file);
        showToast('บันทึกเสียงเสร็จสิ้น!', 'success');
    });
}

function updateRecordingTime() {
    const elapsed = audioRecorder.getElapsedTime();
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    const timeText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
    const timeEl = document.querySelector('.recording-time');
    if (timeEl) timeEl.textContent = timeText;
}

// ===========================================
// Upload Functions
// ===========================================
function initializeUpload() {
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('audioFile');
    
    if (!uploadZone || !fileInput) return;
    
    uploadZone.addEventListener('click', () => {
        fileInput.click();
    });
    
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'var(--primary)';
        uploadZone.style.background = 'rgba(59, 130, 246, 0.05)';
    });
    
    uploadZone.addEventListener('dragleave', () => {
        uploadZone.style.borderColor = 'var(--border)';
        uploadZone.style.background = '';
    });
    
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'var(--border)';
        uploadZone.style.background = '';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelection(files);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files);
        }
    });
}

function handleFileSelection(file) {
    const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/x-m4a', 'audio/flac'];
    const validExt = /\.(wav|mp3|m4a|flac)$/i;
    
    if (!validTypes.includes(file.type) && !file.name.match(validExt)) {
        showToast('ประเภทไฟล์ไม่ถูกต้อง', 'error');
        return;
    }
    
    if (file.size > 100 * 1024 * 1024) {
        showToast('ไฟล์ใหญ่เกินไป (สูงสุด 100MB)', 'error');
        return;
    }
    
    currentFile = file;
    
    document.getElementById('recordingSection').style.display = 'none';
    document.querySelector('.divider').style.display = 'none';
    document.querySelector('.upload-section').style.display = 'none';
    
    const preview = document.getElementById('filePreview');
    preview.style.display = 'block';
    
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = formatFileSize(file.size);
    
    const audioPlayer = document.getElementById('audioPlayer');
    const audioUrl = URL.createObjectURL(file);
    audioPlayer.src = audioUrl;
    
    audioPlayer.addEventListener('loadedmetadata', () => {
        document.getElementById('fileDuration').textContent = formatDuration(audioPlayer.duration);
    });
    
    showToast('โหลดไฟล์สำเร็จ', 'success');
}

// ===========================================
// File Preview
// ===========================================
function initializeFilePreview() {
    const removeBtn = document.getElementById('removeFile');
    
    removeBtn?.addEventListener('click', () => {
        document.getElementById('recordingSection').style.display = 'block';
        document.querySelector('.divider').style.display = 'flex';
        document.querySelector('.upload-section').style.display = 'block';
        document.getElementById('filePreview').style.display = 'none';
        
        currentFile = null;
        document.getElementById('audioFile').value = '';
        document.getElementById('audioPlayer').src = '';
        
        showToast('ลบไฟล์แล้ว', 'info');
    });
}

// ===========================================
// Transcription (Updated for Real API)
// ===========================================
function initializeTranscription() {
    const transcribeBtn = document.getElementById('transcribeBtn');
    const copyBtn = document.getElementById('copyBtn');
    const newBtn = document.getElementById('newBtn');
    
    // Transcribe Button
    transcribeBtn?.addEventListener('click', async () => {
        if (!currentFile) {
            showToast('กรุณาเลือกไฟล์เสียงก่อน', 'error');
            return;
        }
        
        await transcribeAudio();
    });
    
    // Copy Button
    copyBtn?.addEventListener('click', () => {
        const text = document.getElementById('transcriptText').textContent;
        
        navigator.clipboard.writeText(text).then(() => {
            showToast('คัดลอกข้อความแล้ว!', 'success');
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
            }, 2000);
        }).catch(err => {
            showToast('ไม่สามารถคัดลอกได้', 'error');
        });
    });
    
    // New Button
    newBtn?.addEventListener('click', () => {
        resetApp();
    });
}

// ===========================================
// Transcribe Audio Function
// ===========================================
async function transcribeAudio() {
    try {
        // Show loading
        showToast('กำลังประมวลผล...', 'info');
        document.getElementById('transcriptText').textContent = 'กำลังถอดเสียง กรุณารอสักครู่...';
        document.getElementById('resultsSection').style.display = 'block';
        
        // Scroll to results
        document.getElementById('resultsSection').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
        
        // Prepare form data
        const formData = new FormData();
        formData.append('audio_file', currentFile);
        formData.append('language', 'th');
        formData.append('generate_pdf', 'false');
        
        // Call API
        const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.transcribe}`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Get result
        const result = await response.json();
        
        // Display transcription
        if (result.success && result.transcription) {
            displayTranscriptionResults(result.transcription);
        } else {
            throw new Error('Invalid response from API');
        }
        
    } catch (error) {
        console.error('Transcription error:', error);
        
        // Check if API is available
        if (error.message.includes('Failed to fetch')) {
            showToast('ไม่สามารถเชื่อมต่อ Backend API - กำลังใช้ Demo Mode', 'warning');
            displayDemoResults();
        } else {
            showToast('เกิดข้อผิดพลาด: ' + error.message, 'error');
            document.getElementById('transcriptText').textContent = 'เกิดข้อผิดพลาดในการถอดเสียง';
        }
    }
}

// ===========================================
// Display Real Transcription Results
// ===========================================
function displayTranscriptionResults(data) {
    // Extract text from response
    const transcriptText = data.processed_text || data.cleaned_text || data.raw_text || data.text;
    
    if (!transcriptText) {
        showToast('ไม่พบข้อความในผลลัพธ์', 'warning');
        document.getElementById('transcriptText').textContent = 'ไม่สามารถถอดเสียงได้';
        return;
    }
    
    // Display transcription
    document.getElementById('transcriptText').textContent = transcriptText;
    
    // Show success message
    showToast('ถอดเสียงสำเร็จ!', 'success');
    
    console.log('✅ Transcription result:', data);
}

// ===========================================
// Demo Results (Fallback)
// ===========================================
function displayDemoResults() {
    const demoText = `ผู้ป่วยชายอายุ 45 ปี มาด้วยอาการไข้สูง ไอมี 3 วัน

ตรวจร่างกาย:
- ความดันโลหิต: 120/80 mmHg
- อุณหภูมิร่างกาย: 38.5°C
- อัตราการเต้นของหัวใจ: 85 ครั้งต่อนาที
- น้ำหนัก: 70 kg
- ส่วนสูง: 170 cm

การวินิจฉัย: Upper Respiratory Tract Infection (URTI)

การรักษา:
- Paracetamol 500 mg วันละ 3 ครั้ง หลังอาหาร
- Amoxicillin 500 mg วันละ 3 ครั้ง เป็นเวลา 5 วัน
- Cetirizine 10 mg วันละ 1 ครั้ง ก่อนนอน

คำแนะนำ:
- พักผ่อนให้เพียงพอ
- ดื่มน้ำมากๆ อย่างน้อย 2 ลิตรต่อวัน
- หลีกเลี่ยงอาหารรสจัด
- นัดติดตามอาการอีกครั้งใน 1 สัปดาห์`;
    
    document.getElementById('transcriptText').textContent = demoText;
    showToast('แสดงผล Demo (Backend ไม่เชื่อมต่อ)', 'warning');
}

// ===========================================
// Reset App
// ===========================================
function resetApp() {
    // Hide results
    document.getElementById('resultsSection').style.display = 'none';
    
    // Show upload sections
    document.getElementById('recordingSection').style.display = 'block';
    document.querySelector('.divider').style.display = 'flex';
    document.querySelector('.upload-section').style.display = 'block';
    document.getElementById('filePreview').style.display = 'none';
    
    // Clear file
    currentFile = null;
    document.getElementById('audioFile').value = '';
    document.getElementById('audioPlayer').src = '';
    
    // Clear results
    document.getElementById('transcriptText').textContent = '';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

console.log('✅ App loaded');
