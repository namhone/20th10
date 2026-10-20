/**
 * Module Âm Thanh Nhạc Không Lời Về Tình Yêu (Romantic Instrumental Audio Player)
 * Danh sách phát tuyển chọn những bản tình ca không lời bất hủ:
 * 1. Canon in D — Johann Pachelbel (Bản tình ca bất hủ muôn đời)
 * 2. Liebestraum No. 3 — Franz Liszt (Giấc Mộng Tình Yêu êm dịu)
 * 3. Moonlight Sonata — L.V. Beethoven (Ánh Trăng Tình Yêu thanh bình)
 * 4. Für Elise — L.V. Beethoven (Khúc nhạc dành riêng cho Nàng Thơ)
 * Kèm bộ dự phòng Synthesizer Web Audio API khi ngoại tuyến
 */

export const ROMANTIC_PLAYLIST = [
  {
    id: 'canon-in-d',
    title: 'Canon in D',
    subTitle: 'Giai Điệu Tình Yêu Bất Hủ',
    composer: 'Johann Pachelbel',
    src: 'assets/audio/canon_in_d.mp3',
    icon: '🎻'
  },
  {
    id: 'liebestraum',
    title: 'Liebestraum No. 3',
    subTitle: 'Giấc Mộng Tình Yêu',
    composer: 'Franz Liszt',
    src: 'assets/audio/liebestraum_love_dream.mp3',
    icon: '🎹'
  },
  {
    id: 'moonlight-sonata',
    title: 'Moonlight Sonata',
    subTitle: 'Ánh Trăng Dịu Êm',
    composer: 'L.V. Beethoven',
    src: 'assets/audio/moonlight_sonata.mp3',
    icon: '🌙'
  },
  {
    id: 'fur-elise',
    title: 'Für Elise',
    subTitle: 'Dành Cho Nàng Thơ',
    composer: 'L.V. Beethoven',
    src: 'assets/audio/fur_elise.mp3',
    icon: '🌸'
  }
];

class RomanticAudioPlayer {
  constructor() {
    this.audioElement = new Audio();
    this.audioElement.preload = 'auto';
    this.audioElement.volume = 0.55;

    this.currentIndex = 0;
    this.isPlaying = false;
    this.playlist = ROMANTIC_PLAYLIST;

    this.onStateChange = null;
    this.onTrackChange = null;

    // Web Audio Context dự phòng khi cần âm thanh hiệu ứng (chuông, nhịp tim)
    this.audioCtx = null;
    this.synthInterval = null;

    this.setupAudioListeners();
  }

  setupAudioListeners() {
    this.audioElement.addEventListener('ended', () => {
      this.next();
    });

    this.audioElement.addEventListener('play', () => {
      this.isPlaying = true;
      if (typeof this.onStateChange === 'function') {
        this.onStateChange(true, this.getCurrentTrack());
      }
    });

    this.audioElement.addEventListener('pause', () => {
      this.isPlaying = false;
      if (typeof this.onStateChange === 'function') {
        this.onStateChange(false, this.getCurrentTrack());
      }
    });

    this.audioElement.addEventListener('error', (e) => {
      console.warn('HTML5 Audio error, using synthesizer fallback:', e);
      this.startSynthFallback();
    });
  }

  getCurrentTrack() {
    return this.playlist[this.currentIndex] || this.playlist[0];
  }

  loadTrack(index) {
    if (index < 0) index = this.playlist.length - 1;
    if (index >= this.playlist.length) index = 0;
    this.currentIndex = index;

    const track = this.playlist[this.currentIndex];
    this.audioElement.src = track.src;
    this.audioElement.load();

    if (typeof this.onTrackChange === 'function') {
      this.onTrackChange(track);
    }
  }

  play() {
    this.initContext();
    if (!this.audioElement.src || this.audioElement.src === window.location.href) {
      this.loadTrack(this.currentIndex);
    }

    const promise = this.audioElement.play();
    if (promise !== undefined) {
      promise.then(() => {
        this.isPlaying = true;
        if (typeof this.onStateChange === 'function') {
          this.onStateChange(true, this.getCurrentTrack());
        }
      }).catch(err => {
        console.warn('Autoplay prevented or network blocked, trying synth:', err);
        this.startSynthFallback();
      });
    }
    return this.isPlaying;
  }

  pause() {
    this.audioElement.pause();
    this.stopSynthFallback();
    this.isPlaying = false;
    if (typeof this.onStateChange === 'function') {
      this.onStateChange(false, this.getCurrentTrack());
    }
    return false;
  }

  toggle() {
    if (this.isPlaying) {
      this.pause();
      return false;
    } else {
      this.play();
      return true;
    }
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
    this.loadTrack(this.currentIndex);
    if (this.isPlaying) {
      this.audioElement.play().catch(() => {});
    }
    return this.getCurrentTrack();
  }

  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
    this.loadTrack(this.currentIndex);
    if (this.isPlaying) {
      this.audioElement.play().catch(() => {});
    }
    return this.getCurrentTrack();
  }

  setVolume(val) {
    const v = Math.max(0, Math.min(1, val));
    this.audioElement.volume = v;
  }

  // --- WEB AUDIO API CHO HIỆU ỨNG ÂM THANH (CHIME & HEARTBEAT) ---
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

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(volume, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(time);
      osc.stop(time + duration);
    } catch (e) {}
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
      this.playNote(90, now, 0.2, 0.25);
      this.playNote(75, now + 0.15, 0.35, 0.2);
    } catch (e) {}
  }

  startSynthFallback() {
    this.initContext();
    if (!this.audioCtx) return;
    this.isPlaying = true;
    const canonMelody = [
      523.25, 493.88, 440.00, 392.00, 349.23, 329.63, 349.23, 392.00,
      523.25, 659.25, 587.33, 523.25, 493.88, 440.00, 493.88, 523.25
    ];
    let step = 0;
    if (this.synthInterval) clearInterval(this.synthInterval);
    this.synthInterval = setInterval(() => {
      if (!this.isPlaying || !this.audioCtx) return;
      const note = canonMelody[step % canonMelody.length];
      this.playNote(note, this.audioCtx.currentTime, 1.6, 0.09);
      step++;
    }, 700);
  }

  stopSynthFallback() {
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }
}

export const audioPlayer = new RomanticAudioPlayer();
