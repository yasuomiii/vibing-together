/* Allgemeine Helfer. Alles hängt am globalen Objekt VD. */
(function () {
  const VD = (window.VD = window.VD || {});

  VD.$ = (s, r = document) => r.querySelector(s);
  VD.$$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* DOM-Builder. Texte immer als textContent -> kein XSS durch Spielernamen/Packs. */
  VD.h = function (tag, props, ...kids) {
    const el = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'style' && typeof v === 'object') {
          for (const [sk, sv] of Object.entries(v)) {
            if (sk === '--c') { if (/^#[0-9a-fA-F]{3,8}$/.test(String(sv))) el.style.setProperty(sk, sv); }   // Farben kommen auch von anderen Geräten: nur #-Farben
            else if (sk.startsWith('--')) el.style.setProperty(sk, sv); else el.style[sk] = sv;
          }
        }
        else if (k === 'text') el.textContent = v;
        else if (k === 'dataset') Object.assign(el.dataset, v);
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return el;
  };

  VD.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  VD.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  VD.shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  VD.uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

  /* localStorage mit try/catch (Privater Modus etc.) */
  VD.store = {
    get(k, d) { try { const v = localStorage.getItem('vd.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('vd.' + k, JSON.stringify(v)); } catch { /* ignore */ } }
  };

  /* Untertitel über dem Bild (pro Gerät, Standard AN). Einzige Quelle: VD.subsOn(). Ungültige Werte zählen als AN.
     Die Klasse "subs-off" an <html> blendet alle .dp-sub aus; VD.subsWatch meldet Änderungen (auch aus anderen Tabs). */
  const subsCbs = new Set();
  VD.subsOn = () => VD.store.get('subtitles', true) !== false;
  const subsApply = () => { try { document.documentElement.classList.toggle('subs-off', !VD.subsOn()); } catch { /* ignore */ } };
  const subsFire = () => { subsApply(); const on = VD.subsOn(); subsCbs.forEach((f) => { try { f(on); } catch (e) { console.warn('Untertitel', e); } }); };
  VD.subsSet = (v) => { const on = v !== false; if (on === VD.subsOn() && VD.store.get('subtitles', true) === on) return; VD.store.set('subtitles', on); subsFire(); };
  VD.subsToggle = () => { VD.subsSet(!VD.subsOn()); return VD.subsOn(); };
  VD.subsWatch = (f) => { subsCbs.add(f); return () => subsCbs.delete(f); };
  subsApply();
  window.addEventListener('storage', (e) => { if (e.key === 'vd.subtitles' || e.key === null) subsFire(); });

  VD.f32ToI16 = (f) => {
    const o = new Int16Array(f.length);
    for (let i = 0; i < f.length; i++) { const v = Math.max(-1, Math.min(1, f[i])); o[i] = v < 0 ? v * 0x8000 : v * 0x7fff; }
    return o;
  };
  VD.i16ToF32 = (i16) => {
    const o = new Float32Array(i16.length);
    for (let i = 0; i < i16.length; i++) o[i] = i16[i] / 0x8000;
    return o;
  };


  /* Mini-EventEmitter */
  VD.Emitter = class {
    constructor() { this._l = {}; }
    on(ev, fn) { (this._l[ev] = this._l[ev] || []).push(fn); return this; }
    off(ev, fn) { this._l[ev] = (this._l[ev] || []).filter((f) => f !== fn); }
    emit(ev, ...a) { for (const f of (this._l[ev] || []).slice()) { try { f(...a); } catch (e) { console.error(e); } } }
  };

  /* Gate: Phase kann von außen (Host-Button, Ereignis) vorzeitig beendet werden. */
  VD.Gate = class {
    constructor() { this.done = false; this.value = undefined; this.p = new Promise((r) => (this._r = r)); }
    open(v = 'open') { if (!this.done) { this.done = true; this.value = v; this._r(v); } }
    /* wartet auf open() oder Timeout (ms). Gibt den Grund zurück. */
    wait(ms) {
      let t;
      const timer = new Promise((r) => (t = setTimeout(() => r('timeout'), ms)));
      return Promise.race([this.p, timer]).finally(() => clearTimeout(t));
    }
  };

  /* Toast */
  VD.toast = (msg, kind = '') => {
    let box = VD.$('#toasts');
    if (!box) { box = VD.h('div', { id: 'toasts', 'aria-live': 'polite' }); document.body.append(box); }
    const t = VD.h('div', { class: 'toast ' + kind, text: msg });
    box.append(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 3800);
  };

  /* Ripple + Press-Feedback für alle .btn */
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest && e.target.closest('.btn, .chip-btn');
    if (!b || b.disabled) return;
    const r = b.getBoundingClientRect();
    const s = VD.h('span', { class: 'ripple' });
    s.style.left = e.clientX - r.left + 'px';
    s.style.top = e.clientY - r.top + 'px';
    b.append(s);
    setTimeout(() => s.remove(), 650);
  }, { passive: true });

  /* Bildschirm wach halten. Der Browser gibt die Sperre frei, sobald der Tab in den Hintergrund geht;
     beim Zurückkommen wird sie deshalb neu angefordert (sonst ging das Handy mitten im Spiel aus). */
  VD.wake = {
    want: false, lock: null,
    async _req() {
      if (!this.want || this.lock || this._busy || document.hidden || !('wakeLock' in navigator)) return;
      this._busy = true;   // nur eine Anfrage gleichzeitig, sonst bleibt ein Lock übrig, den off() nicht kennt
      try { const l = await navigator.wakeLock.request('screen'); if (!this.want) { l.release().catch(() => {}); return; } this.lock = l; l.addEventListener('release', () => { if (this.lock === l) this.lock = null; }); } catch { /* nicht erlaubt: egal */ } finally { this._busy = false; }
    },
    on() { this.want = true; this._req(); },
    off() { this.want = false; const l = this.lock; this.lock = null; try { l && l.release().catch(() => {}); } catch { /* ignore */ } }
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    VD.wake._req();
    // Handys halten den Ton an, wenn die Seite im Hintergrund war: beim Zurückkommen wieder starten
    const ctx = VD.audio && VD.audio.ctx;
    if (ctx && ctx.state !== 'running' && ctx.state !== 'closed') { try { ctx.resume().catch(() => {}); } catch { /* ignore */ } }
  });

  /* Hintergrund-Ebenen (Aussehen und Bewegung stehen in css/style.css unter BG-START) */
  (function () {
    const cfg = window.VD_CONFIG || {};
    if (cfg.animatedBackground === false) document.documentElement.classList.add('bg-still');
    const box = VD.h('div', { class: 'bg-fx', 'aria-hidden': 'true' },
      ...['bg-glow', 'bg-rings-a', 'bg-rings-b', 'bg-eq', 'bg-dots'].map((c) => VD.h('i', { class: c })));
    // Schallwellen: acht Ringe je Ecke, gleichmäßig versetzt, die Bewegung steht im CSS
    box.querySelectorAll('.bg-rings-a, .bg-rings-b').forEach((r) => { for (let k = 0; k < 8; k++) { const b = document.createElement('b'); b.style.setProperty('--k', k); r.appendChild(b); } });
    // Pegelbalken: so viele, wie in die Breite passen. Jeder Balken bekommt eigene, aber feste Werte, die Reihe sieht bei jedem Laden gleich aus.
    const eq = box.querySelector('.bg-eq');
    let eqN = 0;
    const buildEq = () => {
      const M = 20; // Muster wiederholt sich alle 20 Balken (480 px), so läuft die Reihe nahtlos im Kreis
      const n = Math.ceil(window.innerWidth / 24) + M + 1;
      if (n === eqN) return;
      eqN = n; eq.textContent = '';
      for (let i = 0; i < n; i++) {
        const j = i % M;
        const r = (k) => { const x = Math.sin(j * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
        const hill = 0.55 + 0.45 * Math.sin((j / M) * Math.PI * 2 + 0.6) ** 2; // sanfte Hügel statt Zufallsrauschen
        const hi = Math.min(1, hill * (0.7 + r(1) * 0.45));
        const lo = hi * (0.18 + r(2) * 0.3);
        const bar = document.createElement('b');
        bar.style.cssText = '--hi:' + hi.toFixed(2) + ';--lo:' + lo.toFixed(2) + ';--d:' + (1.1 + r(3) * 2.6).toFixed(2) + 's;--dl:-' + (r(4) * 6).toFixed(2) + 's';
        eq.appendChild(bar);
      }
    };
    buildEq();
    let eqT = 0;
    window.addEventListener('resize', () => { clearTimeout(eqT); eqT = setTimeout(buildEq, 200); });
    document.body.prepend(box);
  })();

  VD.vibrate = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch { /* ignore */ } };

  VD.AVATARS = ['🎤', '🦊', '🐙', '🦄', '🐸', '🤖', '👻', '🐯', '🦖', '🍕', '🚀', '🎸'];
  /* Kanalfarben wie an einem Mischpult */
  VD.COLORS = ['#ff6b6b', '#ffa94d', '#f2e65c', '#5fd68a', '#4fd1e0', '#6aa2ff', '#ff7ac6', '#b6e35a'];

})();
