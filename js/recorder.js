/**
 * Audio Recorder Module
 */

class AudioRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.stream = null;
        this.startTime = null;
        this.timerInterval = null;
    }

    async start() {
        try {
            // Request microphone access
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });

            // Create MediaRecorder
            this.mediaRecorder = new MediaRecorder(this.stream);
            this.audioChunks = [];

            // Event: data available
            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            // Event: recording stopped
            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                const timestamp = new Date().getTime();
                const file = new File([audioBlob], `recording_${timestamp}.wav`, {
                    type: 'audio/wav'
                });
                
                // Trigger custom event
                const event = new CustomEvent('recordingComplete', { detail: { file } });
                document.dispatchEvent(event);
                
                this.cleanup();
            };

            // Start recording
            this.mediaRecorder.start();
            this.startTime = Date.now();

            return true;

        } catch (error) {
            console.error('Recorder error:', error);
            throw error;
        }
    }

    stop() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
    }

    cleanup() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    getElapsedTime() {
        if (!this.startTime) return 0;
        return Math.floor((Date.now() - this.startTime) / 1000);
    }
}

// Export to window
window.AudioRecorder = AudioRecorder;
