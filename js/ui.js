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
    return (VD._wave = { bg: g('--wave-bg'), a: g('--wave-a'), aLine: g('--wave-a-line'), b: g('--wave-b'), bLine: g('--wave-b-line') });
  };

  /* Ein Listener für alle Design-Knöpfe (statt einem pro Knopf, der nie wieder entfernt wurde) */
  const themeIcon = () => (VD.theme.get() === 'light' ? '☾' : '☀');
  document.addEventListener('vt-theme', () => { const ic = themeIcon(); document.querySelectorAll('.theme-btn').forEach((b) => { b.textContent = ic; }); });

  VD.ui = {
    themeBtn() {
      const b = h('button', { class: 'icon-btn theme-btn', type: 'button', title: VD.t('Helles oder dunkles Design'), 'aria-label': VD.t('Helles oder dunkles Design'), onclick: () => VD.theme.toggle() });
      b.textContent = themeIcon();
      return b;
    },

    /* Einstellungen auf der Startseite (pro Gerät): Auto-Sync und Countdown. Die Werte liegen in VD.store (autosync, countdown). */
    settingsBtn(getCtrl) {
      const b = h('button', { class: 'icon-btn glass settings-btn', type: 'button', title: VD.t('Einstellungen'), 'aria-label': VD.t('Einstellungen'), 'aria-haspopup': 'dialog', onclick: () => VD.ui.openSettings(b, getCtrl) });
      b.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.2"/><circle cx="9" cy="17" r="2.2"/></svg>';
      return b;
    },
    /* getCtrl: liefert (falls vorhanden) den Spieler-Controller; dann erscheint auch die Wahl des Stimmeffekts. */
    openSettings(from, getCtrl) {
      if (document.querySelector('.modal.set-modal')) return;
      const ctrl = getCtrl && getCtrl();
      const close = () => { box.remove(); document.removeEventListener('keydown', onKey); if (from && from.isConnected) from.focus(); };
      const onKey = (e) => { if (e.key === 'Escape') close(); };
      const click = () => VD.sfx.play('tap');
      const mkSwitch = (label, get, set) => {
        const b = h('button', { class: 'dn-switch' + (get() ? ' on' : ''), type: 'button', role: 'switch', 'aria-checked': String(get()), onclick: () => {
          const v = !get(); set(v); b.classList.toggle('on', v); b.setAttribute('aria-checked', String(v)); click();
        } }, h('i'), h('span', { text: label }));
        return b;
      };
      const mkSeg = (label, opts, cur, pick, cls) => {
        const wrap = h('div', { class: cls || 'seg', role: 'radiogroup', 'aria-label': label });
        opts.forEach((o) => {
          const bt = h('button', { type: 'button', role: 'radio', 'aria-checked': String(cur === o.v), class: (cls ? 'fx-chip' : 'seg-b') + (cur === o.v ? ' on' : ''), onclick: () => {
            pick(o.v);
            wrap.querySelectorAll('button').forEach((x) => { x.classList.remove('on'); x.setAttribute('aria-checked', 'false'); });
            bt.classList.add('on'); bt.setAttribute('aria-checked', 'true'); click();
          } }, o.t);
          wrap.append(bt);
        });
        return h('div', { class: 'set-item' }, h('span', { class: 'field-l', text: label }), wrap);
      };
      const sync = mkSwitch(VD.t('Auto-Sync'), () => VD.store.get('autosync', true) !== false, (v) => VD.store.set('autosync', v));
      const items = [
        h('div', { class: 'set-item' }, sync, h('p', { class: 'muted', text: VD.t('Auto-Sync: Der Sprachanfang wird an die Originalzeile angepasst.') })),
        mkSeg(VD.t('Countdown'), [{ v: 0, t: VD.t('Aus') }, { v: 3, t: VD.t('3 Sekunden') }, { v: 5, t: VD.t('5 Sekunden') }], Number(VD.store.get('countdown', 0)) || 0, (v) => VD.store.set('countdown', v))
      ];
      if (ctrl && ctrl.fxAllowed && ctrl.fxAllowed()) items.push(h('div', { class: 'set-item' }, mkSwitch(VD.t('Stimmeffekte'), () => ctrl.fxEnabled(), (v) => ctrl.fxToggle(v))));
      items.push(h('div', { class: 'set-item' }, mkSwitch(VD.t('Musik'), () => VD.music.isOn(), (v) => { if (v !== VD.music.isOn()) VD.music.toggle(); })));
      const pct = h('b', { class: 'set-pct', text: Math.round(VD.music.volume() * 100) + ' %' });
      const rng = h('input', { type: 'range', class: 'set-range', min: '0', max: '100', step: '1', value: String(Math.round(VD.music.volume() * 100)), 'aria-label': VD.t('Musik-Lautstärke'), oninput: () => { VD.music.setVolume(Number(rng.value) / 100); pct.textContent = rng.value + ' %'; } });
      items.push(h('div', { class: 'set-item' }, h('span', { class: 'field-l' }, VD.t('Musik-Lautstärke') + ' ', pct), rng));
      const box = h('div', { class: 'modal set-modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'set-t', onclick: (e) => { if (e.target === box) close(); } },
        h('div', { class: 'modal-card' },
          h('h2', { id: 'set-t', text: VD.t('Einstellungen') }),
          ...items,
          h('p', { class: 'muted set-note', text: VD.t('Gilt nur für dieses Gerät.') }),
          h('div', { class: 'modal-btns' }, h('button', { class: 'btn primary', type: 'button', onclick: close }, VD.t('Schließen')))));
      document.addEventListener('keydown', onKey);
      document.body.append(box);
      sync.focus();
    },

    avatar(p, cls = '') {
      return h('span', { class: 'avatar ' + cls, style: { '--c': p.color || '#888' }, 'aria-hidden': 'true' }, p.emoji || '🎤');
    },

    dots() { return h('span', { class: 'dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')); }

  };
})();
