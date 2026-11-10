/* Gemeinsame UI-Bausteine für Host-Bildschirm und Handy */
(function () {
  const VD = (window.VD = window.VD || {});
  const h = VD.h;

  /* Design: dunkel (Standard) oder hell. Die Wahl bleibt im Browser gespeichert. */
  VD.theme = {
    get() { return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'; },
    set(t) {
      t = t === 'light' ? 'light' : 'dark';
      const root = document.documentElement;
      const apply = () => { root.dataset.theme = t; VD._wave = null; document.dispatchEvent(new CustomEvent('vt-theme')); };
      const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!calm && document.startViewTransition) document.startViewTransition(apply);   // ganze Seite blendet weich über
      else if (!calm) { root.classList.add('theme-fade'); apply(); setTimeout(() => root.classList.remove('theme-fade'), 600); }
      else apply();
      try { localStorage.setItem('vt-theme', t); } catch { /* ignore */ }
      const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = t === 'light' ? '#f3efff' : '#15122e';
    },
    toggle() { this.set(this.get() === 'light' ? 'dark' : 'light'); }
  };
  /* Farben der Wellenform (Zeichenfläche) aus dem aktuellen Design */
  VD.waveColors = () => {
    if (VD._wave) return VD._wave;
    const cs = getComputedStyle(document.documentElement), g = (n) => cs.getPropertyValue(n).trim();
    return (VD._wave = { bg: g('--wave-bg'), a: g('--wave-a'), aLine: g('--wave-a-line'), b: g('--wave-b'), bLine: g('--wave-b-line'), pos: g('--wave-pos') });
  };

  VD.ui = {
    themeBtn() {
      const b = h('button', { class: 'icon-btn theme-btn', type: 'button', title: VD.t('Helles oder dunkles Design'), 'aria-label': VD.t('Helles oder dunkles Design'), onclick: () => VD.theme.toggle() });
      const sync = () => { b.textContent = VD.theme.get() === 'light' ? '☾' : '☀'; };
      sync(); document.addEventListener('vt-theme', () => { if (b.isConnected) sync(); });
      return b;
    },

    avatar(p, cls = '') {
      return h('span', { class: 'avatar ' + cls, style: { '--c': p.color || '#888' }, 'aria-hidden': 'true' }, p.emoji || '🎤');
    },

    dots() { return h('span', { class: 'dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')); }

  };
})();
