/**
 * Module Âm thanh Hộp Nhạc Du Dương (Web Audio API Synthesizer)
 * Tự tổng hợp âm thanh hộp nhạc (music box) và tiếng chuông reo không cần file mp3 ngoài
 */

class AudioSynthesizer {
  constructor() {
    this.audioCtx = null;
    this.isPlaying = false;
    this.melodyInterval = null;
    this.onStateChange = null;

    // Giai điệu hộp nhạc du dương
    this.melody = [
      523.25, 659.25, 783.99, 659.25, 523.25, 392.00, 440.00, 523.25,
      587.33, 659.25, 783.99, 880.00, 783.99, 659.25, 587.33, 523.25
    ];
    this.step = 0;
  }

  initContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playNote(freq, time, duration = 1.3, volume = 0.12) {
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      // Attack - Decay - Sustain - Release phong cách hộp nhạc
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(volume, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(time);
      osc.stop(time + duration);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  playChime() {
    this.initContext();
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      this.playNote(523.25, now, 0.6, 0.14); // C5
      this.playNote(659.25, now + 0.08, 0.7, 0.14); // E5
      this.playNote(783.99, now + 0.16, 0.8, 0.14); // G5
      this.playNote(1046.50, now + 0.24, 1.2, 0.16); // C6
    } catch (e) {}
  }

  playHeartbeatSound() {
    this.initContext();
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      // Nhịp trầm ấm mô phỏng tiếng đập
      this.playNote(90, now, 0.2, 0.25);
      this.playNote(75, now + 0.15, 0.35, 0.2);
    } catch (e) {}
  }

  startMelody() {
    this.initContext();
    if (!this.audioCtx) return;

    this.isPlaying = true;
    this.step = 0;

    if (this.melodyInterval) clearInterval(this.melodyInterval);

    this.melodyInterval = setInterval(() => {
      if (!this.isPlaying || !this.audioCtx) return;
      const note = this.melody[this.step % this.melody.length];
      this.playNote(note, this.audioCtx.currentTime, 1.6, 0.1);
      this.step++;
    }, 650);

    if (typeof this.onStateChange === 'function') {
      this.onStateChange(true);
    }
  }

  stopMelody() {
    this.isPlaying = false;
    if (this.melodyInterval) {
      clearInterval(this.melodyInterval);
      this.melodyInterval = null;
    }
    if (typeof this.onStateChange === 'function') {
      this.onStateChange(false);
    }
  }

  toggle() {
    if (this.isPlaying) {
      this.stopMelody();
    } else {
      this.startMelody();
    }
    return this.isPlaying;
  }
}

export const audioPlayer = new AudioSynthesizer();
