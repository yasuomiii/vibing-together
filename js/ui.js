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

    /* Fragezeichen-Knopf (Startseite): öffnet die Hilfe */
    helpBtn() {
      const b = h('button', { class: 'icon-btn glass help-btn', type: 'button', title: VD.t('Hilfe'), 'aria-label': VD.t('Hilfe'), 'aria-haspopup': 'dialog', onclick: () => VD.ui.openHelp(b) }, '?');
      return b;
    },
    /* Hilfe: kurze Erklärung des Spiels und der Knöpfe */
    openHelp(from) {
      if (document.querySelector('.modal.help-modal:not(.mo-ghost)')) return;
      const t = VD.t;
      const close = () => { box.remove(); document.removeEventListener('keydown', onKey); if (from && from.isConnected) from.focus(); };
      const onKey = (e) => { if (e.key === 'Escape') close(); };
      const ico = (c, content) => h('span', { class: 'icon-btn help-ico' + (c ? ' ' + c : ''), 'aria-hidden': 'true' }, content);
      const gear = h('span'); gear.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.2"/><circle cx="9" cy="17" r="2.2"/></svg>';
      const sec = (title, ...rows) => h('section', { class: 'help-sec' }, h('h3', { text: title }), ...rows);
      const p = (text) => h('p', { class: 'help-p', text });
      const row = (lead, name, text) => h('div', { class: 'help-row' }, lead, h('div', {}, h('b', { text: name }), h('span', { text })));
      const pill = (text) => h('span', { class: 'help-pill', 'aria-hidden': 'true', text });
      const box = h('div', { class: 'modal help-modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'help-t', onclick: (e) => { if (e.target === box) close(); } },
        h('div', { class: 'modal-card' },
          h('h2', { id: 'help-t', text: t('So funktioniert Vibing Together') }),
          sec(t('Worum geht es?'), p(t('Ihr seht eine kurze Filmszene ohne Originalton und sprecht die Rollen selbst. Am Ende hört ihr die Szene gemeinsam mit euren Stimmen.'))),
          sec(t('So kommt ihr ins Spiel'), p(t('Ein Gerät ist der Host: „Raum erstellen“ zeigt die Szene auf seinem Bildschirm. Alle anderen geben den 4-stelligen Raum-Code ein oder scannen den QR-Code und tippen auf „Beitreten“.'))),
          sec(t('In der Lobby'), p(t('Der Host wählt ein Dub-Pack (mit ★ merkst du dir Favoriten, „Überrasch mich“ wählt eins zufällig). Jeder kann sich eine Wunschrolle aussuchen und auf „Ich bin bereit“ tippen. Dann startet der Host das Spiel.'))),
          sec(t('Aufnehmen'),
            row(pill(t('Original')), t('Original'), t('Spielt die Originalzeile ab, damit du Ton und Tempo hörst.')),
            row(pill(t('Aufnahme')), t('Aufnahme'), t('Startet die Aufnahme. Tippe noch einmal, um sie zu beenden.')),
            row(pill(t('Mein Take')), t('Mein Take'), t('Spielt deine eigene Aufnahme ab. Nicht zufrieden? Nimm die Zeile einfach noch einmal auf.')),
            row(pill('◀ ▶'), t('Weiter / Fertig'), t('Geht zur nächsten Zeile, bei der letzten heißt der Knopf „Fertig“. Mit ◀ gehst du eine Zeile zurück.')),
            row(pill('✦'), t('Stimmeffekt'), t('Optional: verändert deine Stimme, zum Beispiel tiefer. Du schaltest ihn in den Einstellungen ein. Jede neue Runde beginnt wieder ohne Effekt.'))),
          sec(t('Die Symbole oben'),
            row(ico('', '☀'), t('Helles oder dunkles Design'), t('Wechselt zwischen hellem und dunklem Design.')),
            row(ico('', gear), t('Einstellungen'), t('Auto-Sync, Countdown, Untertitel, Stimmeffekte, Musik und – in der Lobby – die Sprache.')),
            row(ico('dn-icon', '≋'), t('Hintergrundgeräusche filtern'), t('Filtert Hintergrundgeräusche aus deinem Mikrofon, zum Beispiel Lüfter oder Straße. Ist der Knopf abgeblendet, ist der Filter aus. Während einer Aufnahme lässt er sich nicht umschalten.')),
            row(ico('', '⛶'), t('Vollbild'), t('Vollbild an und aus.')),
            row(ico('', VD.lang.toUpperCase()), t('Sprache'), t('Sprache. Auf der Startseite und in der Lobby jederzeit, während des Spiels nicht.'))),
          sec(t('Das Ergebnis'), p(t('Danach läuft die Szene mit allen Stimmen. „Nochmal ansehen“ (Taste P) spielt sie noch einmal ab, „Als Video speichern“ lädt sie herunter.'))),
          h('div', { class: 'modal-btns' }, h('button', { class: 'btn primary', type: 'button', onclick: close }, t('Schließen')))));
      document.addEventListener('keydown', onKey);
      document.body.append(box);
      box.querySelector('.btn.primary').focus({ preventScroll: true });
    },

    /* Einstellungen auf der Startseite (pro Gerät): Auto-Sync und Countdown. Die Werte liegen in VD.store (autosync, countdown). */
    settingsBtn(getCtrl, opts) {
      const b = h('button', { class: 'icon-btn glass settings-btn', type: 'button', title: VD.t('Einstellungen'), 'aria-label': VD.t('Einstellungen'), 'aria-haspopup': 'dialog', onclick: () => VD.ui.openSettings(b, getCtrl, opts) });
      b.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.2"/><circle cx="9" cy="17" r="2.2"/></svg>';
      return b;
    },
    /* Kleiner "CC"-Knopf für die Vorschau: schaltet VD.subsOn() um und folgt Änderungen von anderswo (Einstellungen, anderer Tab). */
    subsBtn() {
      const b = h('button', { class: 'btn sm pv-cc', type: 'button', title: VD.t('Untertitel'), 'aria-label': VD.t('Untertitel'), 'aria-pressed': String(VD.subsOn()), onclick: () => { VD.subsToggle(); VD.sfx.play('tap'); } },
        h('b', { class: 'pv-cc-i', 'aria-hidden': 'true', text: 'CC' }), h('span', { class: 'pv-cc-t', text: VD.t('Untertitel') }));
      const off = VD.subsWatch((on) => { if (!b.isConnected) { off(); return; } b.setAttribute('aria-pressed', String(on)); });
      return b;
    },
    /* getCtrl: liefert (falls vorhanden) den Spieler-Controller; dann erscheint auch die Wahl des Stimmeffekts. */
    /* opts.lang: 'host' | 'player' = im Raum (Lobby/Spiel): zusätzlich Sprachwahl; auf der Startseite gibt es dafür den Knopf oben. */
    openSettings(from, getCtrl, opts) {
      if (document.querySelector('.modal.set-modal:not(.mo-ghost)')) return;
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
      const subs = mkSwitch(VD.t('Untertitel'), () => VD.subsOn(), (v) => VD.subsSet(v));
      const offSubs = VD.subsWatch((on) => { if (!subs.isConnected) { offSubs(); return; } subs.classList.toggle('on', on); subs.setAttribute('aria-checked', String(on)); });
      const items = [
        h('div', { class: 'set-item' }, sync, h('p', { class: 'muted', text: VD.t('Auto-Sync: Der Sprachanfang wird an die Originalzeile angepasst.') })),
        mkSeg(VD.t('Countdown'), [{ v: 0, t: VD.t('Aus') }, { v: 3, t: VD.t('3 Sekunden') }, { v: 5, t: VD.t('5 Sekunden') }], Number(VD.store.get('countdown', 0)) || 0, (v) => VD.store.set('countdown', v)),
        h('div', { class: 'set-item' }, subs, h('p', { class: 'muted', text: VD.t('Untertitel: Die Filmzeile wird unten im Bild eingeblendet.') }))
      ];
      if (ctrl && ctrl.fxAllowed && ctrl.fxAllowed()) items.push(h('div', { class: 'set-item' }, mkSwitch(VD.t('Stimmeffekte'), () => ctrl.fxEnabled(), (v) => ctrl.fxToggle(v))));
      const pct = h('b', { class: 'set-pct', text: Math.round(VD.music.volume() * 100) + ' %' });
      const rng = h('input', { type: 'range', class: 'set-range', min: '0', max: '100', step: '1', value: String(Math.round(VD.music.volume() * 100)), 'aria-label': VD.t('Musik-Lautstärke'), oninput: () => { VD.music.setVolume(Number(rng.value) / 100); pct.textContent = rng.value + ' %'; } });
      items.push(h('div', { class: 'set-item' }, mkSwitch(VD.t('Musik'), () => VD.music.isOn(), (v) => { if (v !== VD.music.isOn()) VD.music.toggle(); }),
        h('span', { class: 'field-l' }, VD.t('Musik-Lautstärke') + ' ', pct), rng));
      const langOpen = () => !opts || !opts.canLang || opts.canLang();   // nur in der Lobby; während einer Runde bleibt die Sprache fest
      if (opts && opts.lang && !langOpen()) {
        items.push(h('div', { class: 'set-item' }, h('span', { class: 'field-l', text: VD.t('Sprache') }), h('p', { class: 'muted', text: VD.t('Die Sprache kannst du nur auf der Startseite und in der Lobby ändern, nicht während des Spiels.') })));
      } else if (opts && opts.lang) {   // im Raum: Sprache hier statt außen. Wechsel gilt sofort, ohne Neuladen (man bleibt im Raum).
        const wrap = h('div', { class: 'fx-chips', role: 'radiogroup', 'aria-label': VD.t('Sprache') }, ...VD.LANGS.map((l) => h('button', {
          type: 'button', role: 'radio', lang: l.c, 'aria-checked': String(l.c === VD.lang), class: 'fx-chip' + (l.c === VD.lang ? ' on' : ''),
          onclick: () => {
            if (l.c === VD.lang || !langOpen()) return;
            click();
            close();                 // Menü schließen und gleich in der neuen Sprache wieder öffnen
            VD.setLangLive(l.c);
            setTimeout(() => VD.ui.openSettings(null, getCtrl, opts), 0);
          } }, l.n)));
        items.push(h('div', { class: 'set-item' }, h('span', { class: 'field-l', text: VD.t('Sprache') }), wrap, h('p', { class: 'muted', text: VD.t('Gilt sofort. Schon offene Spielbildschirme wechseln beim nächsten Schritt.') })));
      }
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
