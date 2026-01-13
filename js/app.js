/**
 * Main Application Logic
 */

// ===========================================
// Global Variables
// ===========================================
let currentFile = null;
let audioRecorder = null;
let recordingTimer = null;

// ===========================================
// Initialize
// ===========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 App initializing...');
    
    initializeRecorder();
    initializeUpload();
    initializeFilePreview();
    initializeTranscription();
    
    console.log('✅ App ready');
});

// ===========================================
// Recording Functions
// ===========================================
function initializeRecorder() {
    audioRecorder = new AudioRecorder();
    
    const startBtn = document.getElementById('startRecordBtn');
    const stopBtn = document.getElementById('stopRecordBtn');
    const statusEl = document.getElementById('recordingStatus');
    
    // Start recording
    startBtn?.addEventListener('click', async () => {
        try {
            await audioRecorder.start();
            
            // UI updates
            startBtn.style.display = 'none';
            stopBtn.style.display = 'inline-flex';
            statusEl.style.display = 'flex';
            
            // Start timer
            updateRecordingTime();
            recordingTimer = setInterval(updateRecordingTime, 1000);
            
            showToast('Recording started', 'success');
            
        } catch (error) {
            console.error('Recording error:', error);
            
            if (error.name === 'NotAllowedError') {
                showToast('Microphone access denied. Please allow microphone permission.', 'error');
            } else if (error.name === 'NotFoundError') {
                showToast('No microphone found.', 'error');
            } else {
                showToast('Failed to start recording: ' + error.message, 'error');
            }
        }
    });
    
    // Stop recording
    stopBtn?.addEventListener('click', () => {
        audioRecorder.stop();
        
        // UI updates
        startBtn.style.display = 'inline-flex';
        stopBtn.style.display = 'none';
        statusEl.style.display = 'none';
        
        // Stop timer
        clearInterval(recordingTimer);
        document.querySelector('.recording-time').textContent = '00:00';
    });
    
    // Handle recording complete
    document.addEventListener('recordingComplete', (e) => {
        handleFileSelection(e.detail.file);
        showToast('Recording saved!', 'success');
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
    
    // Click to upload
    uploadZone.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Drag & drop
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
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files);
        }
    });
}

function handleFileSelection(file) {
    // Validate
    const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/x-m4a', 'audio/flac'];
    const validExt = /\.(wav|mp3|m4a|flac)$/i;
    
    if (!validTypes.includes(file.type) && !file.name.match(validExt)) {
        showToast('Invalid file type', 'error');
        return;
    }
    
    if (file.size > 100 * 1024 * 1024) {
        showToast('File too large (max 100MB)', 'error');
        return;
    }
    
    // Store file
    currentFile = file;
    
    // Hide upload sections
    document.getElementById('recordingSection').style.display = 'none';
    document.querySelector('.divider').style.display = 'none';
    document.querySelector('.upload-section').style.display = 'none';
    
    // Show preview
    const preview = document.getElementById('filePreview');
    preview.style.display = 'block';
    
    // Update file info
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = formatFileSize(file.size);
    
    // Load audio
    const audioPlayer = document.getElementById('audioPlayer');
    const audioUrl = URL.createObjectURL(file);
    audioPlayer.src = audioUrl;
    
    audioPlayer.addEventListener('loadedmetadata', () => {
        document.getElementById('fileDuration').textContent = formatDuration(audioPlayer.duration);
    });
    
    showToast('File loaded successfully', 'success');
}

// ===========================================
// File Preview
// ===========================================
function initializeFilePreview() {
    const removeBtn = document.getElementById('removeFile');
    
    removeBtn?.addEventListener('click', () => {
        // Show upload sections
        document.getElementById('recordingSection').style.display = 'block';
        document.querySelector('.divider').style.display = 'flex';
        document.querySelector('.upload-section').style.display = 'block';
        
        // Hide preview
        document.getElementById('filePreview').style.display = 'none';
        
        // Clear file
        currentFile = null;
        document.getElementById('audioFile').value = '';
        document.getElementById('audioPlayer').src = '';
        
        showToast('File removed', 'info');
    });
}

// ===========================================
// Transcription
// ===========================================
function initializeTranscription() {
    const transcribeBtn = document.getElementById('transcribeBtn');
    const copyBtn = document.getElementById('copyBtn');
    const newBtn = document.getElementById('newBtn');
    
    // Transcribe
    transcribeBtn?.addEventListener('click', () => {
        if (!currentFile) {
            showToast('No file selected', 'error');
            return;
        }
        
        showToast('Processing... (Demo Mode)', 'info');
        
        // Simulate processing
        setTimeout(() => {
            displayDemoResults();
        }, 2000);
    });
    
    // Copy
    copyBtn?.addEventListener('click', () => {
        const text = document.getElementById('transcriptText').textContent;
        
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard!', 'success');
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
            }, 2000);
        });
    });
    
    // New
    newBtn?.addEventListener('click', () => {
        document.getElementById('resultsSection').style.display = 'none';
        document.getElementById('recordingSection').style.display = 'block';
        document.querySelector('.divider').style.display = 'flex';
        document.querySelector('.upload-section').style.display = 'block';
        document.getElementById('filePreview').style.display = 'none';
        
        currentFile = null;
        
        scrollToSection();
    });
}

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
    document.getElementById('resultsSection').style.display = 'block';
    
    document.getElementById('resultsSection').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
    
    showToast('Transcription complete!', 'success');
}

console.log('✅ App loaded');
