/**
 * recorder.js
 * บันทึกเสียงจากไมโครโฟนด้วย MediaRecorder แล้วส่งกลับเป็น File ผ่าน event: 'recordingComplete'
 */
class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.stream = null;
    this.chunks = [];
    this.startTs = null;
    this.mimeType = this._pickMimeType();
  }

  _pickMimeType() {
    // Prefer opus/webm where available (ดีที่สุดสำหรับเว็บ)
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4', // safari บางรุ่น
    ];
    for (const t of candidates) {
      if (window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) return t;
    }
    return '';
  }

  async start() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Browser ไม่รองรับ getUserMedia');
    }
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.chunks = [];
    this.startTs = Date.now();

    this.mediaRecorder = new MediaRecorder(this.stream, this.mimeType ? { mimeType: this.mimeType } : undefined);

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) this.chunks.push(e.data);
    };

    this.mediaRecorder.onstop = async () => {
      try {
        const blob = new Blob(this.chunks, { type: this.mediaRecorder.mimeType || 'audio/webm' });
        const ext = (blob.type.includes('ogg')) ? 'ogg' : (blob.type.includes('mp4') ? 'm4a' : 'webm');
        const fileName = `recording_${new Date().toISOString().replace(/[:.]/g, '-')}.${ext}`;
        const file = new File([blob], fileName, { type: blob.type });

        document.dispatchEvent(new CustomEvent('recordingComplete', { detail: { file } }));
      } finally {
        this._cleanup();
      }
    };

    this.mediaRecorder.start();
  }

  stop() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    } else {
      this._cleanup();
    }
  }

  getElapsedTime() {
    if (!this.startTs) return 0;
    return Math.floor((Date.now() - this.startTs) / 1000);
  }

  _cleanup() {
    if (this.stream) {
      for (const track of this.stream.getTracks()) track.stop();
    }
    this.stream = null;
    this.mediaRecorder = null;
    this.startTs = null;
  }
}

window.AudioRecorder = AudioRecorder;
