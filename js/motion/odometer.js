/* ==========================================================================
   odometer.js — rolling digits for the countdown.

   Each digit is a 1em-tall window over a vertical strip "0 1 2 … 9 0".
   To show digit n we move the strip up by n/11 of its height.
   The countdown counts DOWN, so digits roll downwards (8 → 7), and a
   wrap like 0 → 9 starts from the extra "0" at the bottom of the strip.
   Only digits that change move. Before the first reveal all digits sit at 0,
   then roll up to their values with a small stagger.
   ========================================================================== */
import { motionOK } from './env.js';

const STEP = 100 / 11;      // % of the strip per digit
const posOf = (n) => -n * STEP;

export class Odometer {
  /**
   * @param {HTMLElement} el   container (e.g. .countdown__digits)
   * @param {number} length    how many digits to show
   */
  constructor(el, length = 2) {
    this.el = el;
    this.values = [];
    this.strips = [];
    this.revealed = false;
    this.visible = true;
    this.build(length);
  }

  build(length) {
    this.el.textContent = '';
    this.strips = [];
    this.values = [];
    for (let i = 0; i < length; i++) {
      const win = document.createElement('span');
      win.className = 'odo';
      const strip = document.createElement('span');
      strip.className = 'odo__strip';
      strip.innerHTML = '0123456789'.split('').concat('0').map((d) => `<span>${d}</span>`).join('');
      win.appendChild(strip);
      this.el.appendChild(win);
      this.strips.push(strip);
      this.values.push(0);
      this.place(strip, 0);
    }
    this.pending = this.values.slice();
  }

  place(strip, index) {
    if (window.gsap) window.gsap.set(strip, { yPercent: posOf(index) });
    else strip.style.transform = `translateY(${posOf(index)}%)`;
  }

  /** Show a number, e.g. set("07"). */
  set(text) {
    const digits = String(text).split('').map(Number);
    if (digits.length !== this.strips.length) this.build(digits.length);   // e.g. 100 days → 99 days
    this.pending = digits;
    if (!this.revealed) return;                       // wait for rollIn()
    digits.forEach((d, i) => this.roll(i, d));
  }

  roll(i, next) {
    const prev = this.values[i];
    if (prev === next) return;
    this.values[i] = next;
    const strip = this.strips[i];
    if (!motionOK() || !this.visible) { this.place(strip, next); return; }
    const { gsap } = window;
    gsap.killTweensOf(strip);
    if (next > prev && prev === 0) {
      // Counting down through zero (0 → 9, or 0 → 5 on the tens): start from the bottom "0".
      gsap.set(strip, { yPercent: posOf(10) });
    }
    gsap.to(strip, { yPercent: posOf(next), duration: 0.6, ease: 'power3.inOut' });
  }

  /** First reveal: every digit rolls up from 0 to its value (delay = where this odometer starts). */
  rollIn(delay = 0, stagger = 0.05) {
    this.revealed = true;
    const { gsap } = window;
    this.pending.forEach((d, i) => {
      this.values[i] = d;
      if (!motionOK()) { this.place(this.strips[i], d); return; }
      gsap.fromTo(this.strips[i], { yPercent: 0 }, {
        yPercent: posOf(d), duration: 0.9 + d * 0.04, ease: 'power3.inOut', delay: delay + i * stagger,
      });
    });
  }
}
