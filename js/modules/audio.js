/**
 * Module Âm Thanh Tình Yêu Trending & Đáng Yêu (Trending & Cute Instrumental Love Playlist)
 * Danh sách phát tuyển chọn những bản tình ca không lời ngọt ngào, nhẹ nhàng, đáng yêu nhất:
 * 1. Until I Found You — Stephen Sanchez (Piano lãng mạn, bay bổng, trending TikTok)
 * 2. Nàng Thơ — Hoàng Dũng (Piano trong trẻo, e ấp, dịu êm tuổi học trò)
 * 3. Dịu Dàng Em Đến — ERIK (Piano chill ngọt ngào, đáng yêu, chữa lành)
 * 4. Ánh Nắng Của Anh — Đức Phúc (Khúc tình ca ấm áp, dịu ngọt bên em)
 * 5. Cupid — FIFTY FIFTY (Giai điệu tình yêu cute, rung rinh đáng yêu xỉu)
 * Kèm bộ dự phòng Synthesizer Web Audio API khi ngoại tuyến
 */

export const ROMANTIC_PLAYLIST = [
  {
    id: 'until-i-found-you',
    title: 'Until I Found You',
    subTitle: 'Tình Yêu Diệu Kỳ',
    composer: 'Stephen Sanchez (Piano)',
    src: 'assets/audio/until_i_found_you.mp3',
    icon: '✨'
  },
  {
    id: 'nang-tho',
    title: 'Nàng Thơ',
    subTitle: 'Trong Trẻo & E Ấp',
    composer: 'Hoàng Dũng (Piano)',
    src: 'assets/audio/nang_tho.mp3',
    icon: '🌸'
  },
  {
    id: 'diu-dang-em-den',
    title: 'Dịu Dàng Em Đến',
    subTitle: 'Ngọt Ngào & Đáng Yêu',
    composer: 'ERIK (Piano Chill)',
    src: 'assets/audio/diu_dang_em_den.mp3',
    icon: '🧸'
  },
  {
    id: 'anh-nang-cua-anh',
    title: 'Ánh Nắng Của Anh',
    subTitle: 'Ấm Áp Bên Em',
    composer: 'Đức Phúc (Piano)',
    src: 'assets/audio/anh_nang_cua_anh.mp3',
    icon: '☀️'
  },
  {
    id: 'cupid-cute',
    title: 'Cupid (Cute Ver.)',
    subTitle: 'Rung Rinh Tuổi 17',
    composer: 'FIFTY FIFTY (Piano)',
    src: 'assets/audio/cupid_cute.mp3',
    icon: '💘'
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
    const melodyNotes = [
      523.25, 493.88, 440.00, 392.00, 349.23, 329.63, 349.23, 392.00,
      523.25, 659.25, 587.33, 523.25, 493.88, 440.00, 493.88, 523.25
    ];
    let step = 0;
    if (this.synthInterval) clearInterval(this.synthInterval);
    this.synthInterval = setInterval(() => {
      if (!this.isPlaying || !this.audioCtx) return;
      const note = melodyNotes[step % melodyNotes.length];
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
