/**
 * Whisper AI Integration using Transformers.js
 * ถอดเสียงจากไฟล์โดยตรง ไม่ต้องเปิดลำโพง
 */

import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';

// Configure
env.allowLocalModels = false;
env.allowRemoteModels = true;

// Global variables
let transcriber = null;
let isModelLoaded = false;

// ===========================================
// Initialize Whisper Model
// ===========================================
async function initializeWhisper() {
    try {
        console.log('📥 Loading Whisper model...');
        updateModelStatus('loading', 'กำลังโหลด AI Model...');
        
        // Load Whisper tiny model (smallest, fastest)
        transcriber = await pipeline(
            'automatic-speech-recognition',
            'Xenova/whisper-tiny',
            {
                quantized: true,  // ใช้โมเดลที่เล็กลง
            }
        );
        
        isModelLoaded = true;
        console.log('✅ Whisper model loaded!');
        updateModelStatus('ready', 'AI พร้อมใช้งาน');
        showToast('✅ AI Model โหลดเสร็จแล้ว พร้อมใช้งาน!', 'success');
        
    } catch (error) {
        console.error('❌ Failed to load model:', error);
        updateModelStatus('error', 'โหลด Model ไม่สำเร็จ');
        showToast('❌ ไม่สามารถโหลด AI Model ได้: ' + error.message, 'error');
    }
}

// Update model status UI
function updateModelStatus(status, text) {
    const statusEl = document.getElementById('modelStatus');
    if (!statusEl) return;
    
    const icons = {
        loading: '<i class="fas fa-circle-notch fa-spin"></i>',
        ready: '<i class="fas fa-check-circle" style="color: var(--success);"></i>',
        error: '<i class="fas fa-exclamation-circle" style="color: var(--danger);"></i>',
        processing: '<i class="fas fa-cog fa-spin"></i>'
    };
    
    statusEl.innerHTML = `${icons[status]} <span>${text}</span>`;
}

// ===========================================
// Transcribe Audio File
// ===========================================
async function transcribeAudioFile(audioFile, onProgress) {
    try {
        // Check if model is loaded
        if (!isModelLoaded || !transcriber) {
            showToast('⚠️ AI Model ยังโหลดไม่เสร็จ กรุณารอสักครู่...', 'warning');
            await initializeWhisper();
        }
        
        console.log('🎤 Starting transcription...');
        updateModelStatus('processing', 'กำลังถอดเสียง...');
        
        // Read audio file
        const audioData = await readAudioFile(audioFile);
        
        // Transcribe
        const result = await transcriber(audioData, {
            language: 'thai',  // หรือ 'english'
            task: 'transcribe',
            chunk_length_s: 30,
            stride_length_s: 5,
            return_timestamps: true,
            callback_function: (data) => {
                // Progress callback
                if (onProgress && data.status) {
                    onProgress(data);
                }
            }
        });
        
        console.log('✅ Transcription complete:', result);
        updateModelStatus('ready', 'AI พร้อมใช้งาน');
        
        return result;
        
    } catch (error) {
        console.error('❌ Transcription error:', error);
        updateModelStatus('error', 'เกิดข้อผิดพลาด');
        throw error;
    }
}

// ===========================================
// Read Audio File
// ===========================================
async function readAudioFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const arrayBuffer = e.target.result;
                
                // Decode audio
                const audioContext = new (window.AudioContext || window.webkitAudioContext)({
                    sampleRate: 16000  // Whisper requires 16kHz
                });
                
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                
                // Get audio data (mono channel)
                const audioData = audioBuffer.getChannelData(0);
                
                resolve(audioData);
                
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
    });
}

// ===========================================
// Initialize on load
// ===========================================
window.addEventListener('load', () => {
    initializeWhisper();
});

// Export functions
window.transcribeAudioFile = transcribeAudioFile;
window.isWhisperReady = () => isModelLoaded;

console.log('✅ Whisper module loaded');
