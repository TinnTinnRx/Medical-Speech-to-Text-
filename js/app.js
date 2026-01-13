/**
 * Medical Speech-to-Text App
 * ใช้ Web Speech API สำหรับถอดเสียงจริง
 */

// ===========================================
// Global Variables
// ===========================================
let currentFile = null;
let audioRecorder = null;
let recordingTimer = null;
let recognition = null;

// ===========================================
// Initialize
// ===========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 App initializing...');
    
    initializeRecorder();
    initializeUpload();
    initializeFilePreview();
    initializeTranscription();
    checkSpeechRecognitionSupport();
    
    console.log('✅ App ready');
});

// ===========================================
// Check Browser Support
// ===========================================
function checkSpeechRecognitionSupport() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        showToast('⚠️ เบราว์เซอร์ของคุณไม่รองรับการถอดเสียง กรุณาใช้ Google Chrome', 'warning');
        
        const transcribeBtn = document.getElementById('transcribeBtn');
        if (transcribeBtn) {
            transcribeBtn.disabled = true;
            transcribeBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> ไม่รองรับ';
        }
    } else {
        console.log('✅ Speech Recognition supported');
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
        
        showToast('⏹️ หยุดบันทึกแล้ว', 'info');
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
    const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/x-m4a', 'audio/flac', 'audio/webm'];
    const validExt = /\.(wav|mp3|m4a|flac|webm)$/i;
    
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
// Transcription (Web Speech API)
// ===========================================
function initializeTranscription() {
    const transcribeBtn = document.getElementById('transcribeBtn');
    const copyBtn = document.getElementById('copyBtn');
    const newBtn = document.getElementById('newBtn');
    
    // Transcribe Button
    transcribeBtn?.addEventListener('click', () => {
        if (!currentFile) {
            showToast('❌ กรุณาเลือกไฟล์เสียงก่อน', 'error');
            return;
        }
        
        transcribeAudioWithWebSpeech();
    });
    
    // Copy Button
    copyBtn?.addEventListener('click', () => {
        const text = document.getElementById('transcriptText').textContent;
        
        if (!text || text === 'กำลังรอข้อมูล...' || text === 'undefined') {
            showToast('❌ ไม่มีข้อความให้คัดลอก', 'error');
            return;
        }
        
        navigator.clipboard.writeText(text).then(() => {
            showToast('📋 คัดลอกข้อความแล้ว!', 'success');
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
            }, 2000);
        }).catch(err => {
            console.error('Copy error:', err);
            showToast('❌ ไม่สามารถคัดลอกได้', 'error');
        });
    });
    
    // New Button
    newBtn?.addEventListener('click', () => {
        resetApp();
    });
}

// ===========================================
// Transcribe with Web Speech API
// ===========================================
function transcribeAudioWithWebSpeech() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        showToast('❌ เบราว์เซอร์ไม่รองรับ กรุณาใช้ Google Chrome', 'error');
        document.getElementById('transcriptText').textContent = 'เบราว์เซอร์ของคุณไม่รองรับการถอดเสียง กรุณาใช้ Google Chrome';
        document.getElementById('resultsSection').style.display = 'block';
        return;
    }
    
    try {
        // Show results section immediately
        document.getElementById('resultsSection').style.display = 'block';
        document.getElementById('transcriptText').textContent = '🎤 กำลังเริ่มถอดเสียง...\n\nกำลังเล่นเสียงและฟัง กรุณารอสักครู่...';
        
        // Scroll to results
        setTimeout(() => {
            document.getElementById('resultsSection').scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
        
        // Create recognition
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'th-TH';
        recognition.maxAlternatives = 1;
        
        let finalTranscript = '';
        let isFirstResult = true;
        
        // On result
        recognition.onresult = (event) => {
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i].transcript;
                
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }
            
            // Update display
            let displayText = finalTranscript;
            
            if (interimTranscript) {
                displayText += `\n\n[กำลังฟัง: ${interimTranscript}]`;
            }
            
            if (displayText.trim()) {
                document.getElementById('transcriptText').textContent = displayText;
                
                if (isFirstResult) {
                    showToast('✅ เริ่มถอดเสียงได้แล้ว!', 'success');
                    isFirstResult = false;
                }
            }
        };
        
        // On error
        recognition.onerror = (event) => {
            console.error('Recognition error:', event.error);
            
            let errorMessage = '';
            
            switch(event.error) {
                case 'no-speech':
                    errorMessage = 'ไม่พบเสียงพูด กรุณาเปิดเสียงและลองใหม่';
                    break;
                case 'audio-capture':
                    errorMessage = 'ไม่สามารถจับเสียงได้ ตรวจสอบไมโครโฟนหรือลำโพง';
                    break;
                case 'not-allowed':
                    errorMessage = 'ไม่ได้รับอนุญาตให้ใช้ไมโครโฟน';
                    break;
                case 'network':
                    errorMessage = 'ไม่มีการเชื่อมต่ออินเทอร์เน็ต';
                    break;
                default:
                    errorMessage = `เกิดข้อผิดพลาด: ${event.error}`;
            }
            
            showToast('❌ ' + errorMessage, 'error');
            
            if (finalTranscript.trim() === '') {
                document.getElementById('transcriptText').textContent = 
                    `ไม่สามารถถอดเสียงได้\n\nสาเหตุ: ${errorMessage}\n\nวิธีแก้:\n` +
                    `1. เปิดเสียงลำโพงให้ได้ยิน\n` +
                    `2. ใช้ Google Chrome\n` +
                    `3. ต้องมีการเชื่อมต่ออินเทอร์เน็ต\n` +
                    `4. เปิดเสียงในเครื่อง (ไม่ใช่เปิดเสียงเพื่อให้คนอื่นฟัง)`;
            }
        };
        
        // On end
        recognition.onend = () => {
            console.log('Recognition ended');
            
            if (finalTranscript.trim() === '') {
                document.getElementById('transcriptText').textContent = 
                    `ไม่พบเสียงพูดในไฟล์\n\n` +
                    `วิธีการใช้งาน:\n` +
                    `1. เปิดเสียงลำโพงในเครื่องของคุณ\n` +
                    `2. คลิก "เริ่มถอดเสียง"\n` +
                    `3. ไมโครโฟนจะฟังเสียงที่ออกจากลำโพง\n` +
                    `4. ระบบจะถอดเสียงอัตโนมัติ\n\n` +
                    `หมายเหตุ: Web Speech API ทำงานโดยการฟังเสียงจากไมโครโฟน`;
                    
                showToast('⚠️ ไม่พบเสียงพูด', 'warning');
            } else {
                showToast('✅ ถอดเสียงเสร็จสิ้น!', 'success');
            }
        };
        
        // Start
        recognition.start();
        showToast('🎧 กำลังฟังเสียง... (กรุณาเปิดลำโพง)', 'info');
        
        // Play audio
        const audioPlayer = document.getElementById('audioPlayer');
        audioPlayer.currentTime = 0;
        audioPlayer.play();
        
        // Stop when audio ends
        audioPlayer.onended = () => {
            setTimeout(() => {
                if (recognition) {
                    recognition.stop();
                }
            }, 1000);
        };
        
    } catch (error) {
        console.error('Transcription error:', error);
        showToast('❌ เกิดข้อผิดพลาด: ' + error.message, 'error');
        document.getElementById('transcriptText').textContent = 'เกิดข้อผิดพลาด: ' + error.message;
        document.getElementById('resultsSection').style.display = 'block';
    }
}

// ===========================================
// Reset App
// ===========================================
function resetApp() {
    // Stop recognition if running
    if (recognition) {
        recognition.stop();
        recognition = null;
    }
    
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
    
    const audioPlayer = document.getElementById('audioPlayer');
    audioPlayer.pause();
    audioPlayer.src = '';
    
    // Clear text
    document.getElementById('transcriptText').textContent = 'กำลังรอข้อมูล...';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    showToast('🔄 เริ่มใหม่', 'info');
}

console.log('✅ App loaded with Web Speech API');
