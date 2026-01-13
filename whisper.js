/**
 * whisper.js (ES Module)
 * รัน Whisper ASR ในเบราว์เซอร์ด้วย Transformers.js (WebGPU/CPU fallback)
 *
 * Expose:
 *   window.isWhisperReady() -> boolean
 *   window.transcribeAudioFile(file, onProgress) -> Promise<{text, chunks?}>
 *
 * หมายเหตุ:
 * - โมเดลถูกโหลดจาก Hugging Face ผ่าน CDN (ยังคง "ไม่มี backend" ของคุณเอง)
 * - ถ้าคุณต้องการ offline 100%: ต้องโฮสต์ไฟล์โมเดลใน repo และตั้งค่า allowlist/paths เพิ่มเติม
 */

import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js';

const MODEL_ID = 'Xenova/whisper-tiny'; // multilingual, ขนาดเล็ก (เหมาะกับเว็บ)
const TARGET_SR = 16000;

let asr = null;
let ready = false;

const statusEl = document.getElementById('modelStatus');

function setStatus(html, isReady = false) {
  if (!statusEl) return;
  statusEl.innerHTML = html;
  statusEl.style.opacity = '1';
  ready = isReady;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// Configure transformers.js environment
env.allowLocalModels = false;       // ใช้โหลดจาก remote
env.useBrowserCache = true;         // cache ใน browser (ครั้งต่อไปจะเร็วขึ้น)
// env.backends.onnx.wasm.numThreads = Math.min(4, navigator.hardwareConcurrency || 4);

async function init() {
  try {
    setStatus('<i class="fas fa-circle-notch fa-spin"></i> <span>Loading AI...</span>');

    // Create ASR pipeline
    asr = await pipeline('automatic-speech-recognition', MODEL_ID, {
      progress_callback: (p) => {
        // p: {status, file, progress} (ขึ้นกับ backend)
        if (p?.status === 'downloading' || p?.status === 'loading') {
          const pct = p.progress != null ? Math.round(p.progress * 100) : null;
          const label = pct != null ? `${pct}%` : '';
          setStatus(`<i class="fas fa-circle-notch fa-spin"></i> <span>Loading AI... ${escapeHtml(label)}</span>`);
        }
      }
    });

    setStatus('<i class="fas fa-check-circle"></i> <span>AI Ready</span>', true);
  } catch (e) {
    console.error(e);
    setStatus('<i class="fas fa-exclamation-triangle"></i> <span>AI Load Failed</span>', false);
  }
}

function isWhisperReady() {
  return !!asr && ready;
}

async function fileToAudioFloat32(file) {
  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // decode
  const decoded = await audioCtx.decodeAudioData(arrayBuffer);

  // downmix to mono
  const ch0 = decoded.getChannelData(0);
  let mono = new Float32Array(decoded.length);
  mono.set(ch0);
  if (decoded.numberOfChannels > 1) {
    const ch1 = decoded.getChannelData(1);
    for (let i = 0; i < mono.length; i++) mono[i] = 0.5 * (ch0[i] + ch1[i]);
  }

  // resample to 16k if needed (OfflineAudioContext)
  if (decoded.sampleRate !== TARGET_SR) {
    const duration = decoded.duration;
    const length = Math.ceil(duration * TARGET_SR);
    const offline = new OfflineAudioContext(1, length, TARGET_SR);

    const buffer = offline.createBuffer(1, mono.length, decoded.sampleRate);
    buffer.copyToChannel(mono, 0);

    const source = offline.createBufferSource();
    source.buffer = buffer;
    source.connect(offline.destination);
    source.start(0);

    const rendered = await offline.startRendering();
    mono = rendered.getChannelData(0);
  }

  // close context if possible
  try { await audioCtx.close(); } catch (_) {}

  return mono;
}

async function transcribeAudioFile(file, onProgress) {
  if (!isWhisperReady()) {
    throw new Error('Whisper model is not ready yet.');
  }

  // Convert file -> Float32 audio @16k
  if (onProgress) onProgress({ status: 'progress', progress: 0.05 });
  const audio = await fileToAudioFloat32(file);

  // Whisper works better when chunking long audio
  const result = await asr(audio, {
    chunk_length_s: 30,
    stride_length_s: 5,
    // return_timestamps: true, // เปิดได้ถ้าต้องการ timecode
    // language: 'th',          // ถ้าต้องการบังคับภาษา (เช่น 'th','en','ja'...)
    // task: 'transcribe'       // หรือ 'translate'
    callback_function: (p) => {
      // transformers.js บางเวอร์ชันใช้ callback_function สำหรับ progress
      if (onProgress && p?.progress != null) onProgress({ status: 'progress', progress: p.progress });
    }
  });

  if (onProgress) onProgress({ status: 'progress', progress: 1 });

  return result;
}

window.isWhisperReady = isWhisperReady;
window.transcribeAudioFile = transcribeAudioFile;

init();
