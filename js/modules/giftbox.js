/**
 * Module Hộp Quà 3D Tương Tác (CSS 3D Gift Box)
 * Hiệu ứng mở nắp hộp, tung tim, chuyển đổi giữa màn hình Intro và Màn hình 3 Ngăn Quà
 */

import { audioPlayer } from './audio.js';
import { spawnFloatingHearts } from './particles2d.js';

export class GiftBox {
  constructor(lettersManager) {
    this.lettersManager = lettersManager;
    this.isOpened = false;
  }

  init() {
    this.setupEvents();
  }

  openBox() {
    const lid = document.getElementById('gift-box-lid');
    if (lid) lid.classList.add('opened');

    audioPlayer.playChime();
    spawnFloatingHearts(window.innerWidth / 2, window.innerHeight / 2, 18);

    if (window.confetti) {
      window.confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff477e', '#ff6b8b', '#ffd166', '#ffffff']
      });
    }

    setTimeout(() => {
      const screenIntro = document.getElementById('screen-intro');
      const screenCompartments = document.getElementById('screen-compartments');
      if (screenIntro) screenIntro.classList.add('hidden');
      if (screenCompartments) screenCompartments.classList.remove('hidden');

      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (this.lettersManager) {
        this.lettersManager.renderEnvelopes();
      }
      this.isOpened = true;
    }, 600);
  }

  closeBox() {
    const lid = document.getElementById('gift-box-lid');
    if (lid) lid.classList.remove('opened');

    const screenIntro = document.getElementById('screen-intro');
    const screenCompartments = document.getElementById('screen-compartments');
    if (screenCompartments) screenCompartments.classList.add('hidden');
    if (screenIntro) screenIntro.classList.remove('hidden');

    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.isOpened = false;
  }

  setupEvents() {
    const openBtn = document.getElementById('open-box-btn');
    const boxTarget = document.getElementById('gift-box-click-target');
    const backBtn = document.getElementById('back-to-box-btn');

    if (openBtn) openBtn.addEventListener('click', () => this.openBox());
    if (boxTarget) boxTarget.addEventListener('click', () => this.openBox());
    if (backBtn) backBtn.addEventListener('click', () => this.closeBox());
  }
}
