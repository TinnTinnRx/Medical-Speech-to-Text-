/**
 * Main Application Logic
 * ใช้ Whisper.js สำหรับถอดเสียงบนเบราว์เซอร์
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
    
    startBtn?.addEventListener('click', async () => {
        try {
            await audioRecorder.start();
            
            startBtn.style.display = 'none';
            stopBtn.style.display = 'inline-flex';
            statusEl.style.display = 'flex';
            
            updateRecordingTime();
            recordingTimer = setInterval(updateRecordingTime, 1000);
            
            showToast('🎤 กำลังบันทึกเสียง...', 'success');
            
        } catch (error) {
            console.error('Recording error:', error);
            
            if (error.name === 'NotAllowedError') {
                showToast('❌ กรุณาอนุญาตให้ใช้ไมโครโฟน', 'error');
            } else if (error.name === 'NotFoundError') {
                showToast('❌ ไม่พบไมโครโฟน', 'error');
            } else {
                showToast('❌ ไม่สามารถบันทึกได้: ' + error.message, 'error');
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
        showToast('✅ บันทึกเสียงเสร็จสิ้น!', 'success');
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
    const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/x-m4a', 'audio/flac', 'audio/webm', 'audio/ogg'];
    const validExt = /\.(wav|mp3|m4a|flac|webm|ogg)$/i;
    
    if (!validTypes.includes(file.type) && !file.name.match(validExt)) {
        showToast('❌ ประเภทไฟล์ไม่ถูกต้อง', 'error');
        return;
    }
    
    if (file.size > 100 * 1024 * 1024) {
        showToast('❌ ไฟล์ใหญ่เกินไป (สูงสุด 100MB)', 'error');
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
    
    showToast('✅ โหลดไฟล์สำเร็จ', 'success');
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
        
        showToast('🗑️ ลบไฟล์แล้ว', 'info');
    });
}

// ===========================================
// Transcription
// ===========================================
function initializeTranscription() {
    const transcribeBtn = document.getElementById('transcribeBtn');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const newBtn = document.getElementById('newBtn');
    
    // Transcribe
    transcribeBtn?.addEventListener('click', async () => {
        if (!currentFile) {
            showToast('❌ กรุณาเลือกไฟล์เสียงก่อน', 'error');
            return;
        }
        
        if (!window.isWhisperReady || !window.isWhisperReady()) {
            showToast('⚠️ AI Model ยังโหลดไม่เสร็จ กรุณารอสักครู่...', 'warning');
            return;
        }
        
        await transcribeWithWhisper();
    });
    
    // Copy
    copyBtn?.addEventListener('click', () => {
        const text = document.getElementById('transcriptText').textContent;
        
        if (!text || text === 'กำลังรอข้อมูล...') {
            showToast('❌ ไม่มีข้อความให้คัดลอก', 'error');
            return;
        }
        
        navigator.clipboard.writeText(text).then(() => {
            showToast('📋 คัดลอกข้อความแล้ว!', 'success');
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
            }, 2000);
        });
    });
    
    // Download
    downloadBtn?.addEventListener('click', () => {
        const text = document.getElementById('transcriptText').textContent;
        
        if (!text || text === 'กำลังรอข้อมูล...') {
            showToast('❌ ไม่มีข้อความให้ดาวน์โหลด', 'error');
            return;
        }
        
        downloadTranscript(text, currentFile.name);
    });
    
    // New
    newBtn?.addEventListener('click', () => {
        resetApp();
    });
}

// ===========================================
// Transcribe with Whisper
// ===========================================
async function transcribeWithWhisper() {
    try {
        // Show progress section
        document.getElementById('progressSection').style.display = 'block';
        document.getElementById('resultsSection').style.display = 'none';
        
        updateProgress(10, 'กำลังอ่านไฟล์เสียง...');
        
        // Scroll to progress
        setTimeout(() => {
            document.getElementById('progressSection').scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
        
        showToast('🎧 เริ่มถอดเสียงด้วย AI...', 'info');
        
        // Transcribe
        const result = await window.transcribeAudioFile(currentFile, (progress) => {
            console.log('Progress:', progress);
            
            if (progress.status === 'progress') {
                const percent = Math.round(progress.progress * 100);
                updateProgress(percent, 'กำลังประมวลผล...');
            }
        });
        
        updateProgress(100, 'เสร็จสิ้น!');
        
        // Display result
        setTimeout(() => {
            displayTranscriptionResult(result);
        }, 500);
        
    } catch (error) {
        console.error('Transcription error:', error);
        
        document.getElementById('progressSection').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'block';
        document.getElementById('transcriptText').textContent = 
            `เกิดข้อผิดพลาดในการถอดเสียง\n\n` +
            `สาเหตุ: ${error.message}\n\n` +
            `วิธีแก้:\n` +
            `1. ตรวจสอบว่าไฟล์เสียงไม่เสียหาย\n` +
            `2. ลองใช้ไฟล์ขนาดเล็กก่อน\n` +
            `3. Refresh หน้าเว็บและลองใหม่`;
        
        showToast('❌ เกิดข้อผิดพลาด: ' + error.message, 'error');
    }
}

// ===========================================
// Display Result
// ===========================================
function displayTranscriptionResult(result) {
    // Hide progress
    document.getElementById('progressSection').style.display = 'none';
    
    // Show results
    document.getElementById('resultsSection').style.display = 'block';
    
    // Extract text
    let transcriptText = '';
    
    if (typeof result === 'string') {
        transcriptText = result;
    } else if (result.text) {
        transcriptText = result.text;
    } else if (result.chunks) {
        transcriptText = result.chunks.map(chunk => chunk.text).join(' ');
    }
    
    // Display
    if (transcriptText && transcriptText.trim()) {
        document.getElementById('transcriptText').textContent = transcriptText.trim();
        showToast('✅ ถอดเสียงสำเร็จ!', 'success');
    } else {
        document.getElementById('transcriptText').textContent = 'ไม่พบข้อความในไฟล์เสียง\n\nกรุณาตรวจสอบว่าไฟล์มีเสียงพูดหรือไม่';
        showToast('⚠️ ไม่พบข้อความในไฟล์', 'warning');
    }
    
    // Scroll to results
    setTimeout(() => {
        document.getElementById('resultsSection').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }, 100);
}

// ===========================================
// Progress Update
// ===========================================
function updateProgress(percent, message) {
    const fillEl = document.getElementById('progressFill');
    const textEl = document.getElementById('progressText');
    const percentEl = document.getElementById('progressPercent');
    
    if (fillEl) fillEl.style.width = `${percent}%`;
    if (textEl) textEl.textContent = message;
    if (percentEl) percentEl.textContent = `${percent}%`;
}

// ===========================================
// Download Transcript
// ===========================================
function downloadTranscript(text, originalFilename) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    const filename = originalFilename.replace(/\.[^/.]+$/, '') + '_transcript.txt';
    
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
    
    showToast('📥 ดาวน์โหลดไฟล์แล้ว', 'success');
}

// ===========================================
// Reset App
// ===========================================
function resetApp() {
    document.getElementById('progressSection').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'none';
    
    document.getElementById('recordingSection').style.display = 'block';
    document.querySelector('.divider').style.display = 'flex';
    document.querySelector('.upload-section').style.display = 'block';
    document.getElementById('filePreview').style.display = 'none';
    
    currentFile = null;
    document.getElementById('audioFile').value = '';
    
    const audioPlayer = document.getElementById('audioPlayer');
    audioPlayer.pause();
    audioPlayer.src = '';
    
    document.getElementById('transcriptText').textContent = 'กำลังรอข้อมูล...';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    showToast('🔄 เริ่มใหม่', 'info');
}

console.log('✅ App loaded with Whisper AI');
