/* Sprachen: Der deutsche Text ist gleichzeitig der Schlüssel. Fehlt eine Übersetzung, erscheint Englisch, dann Deutsch.
   Neue Sprache: Datei js/lang/xx.js nach dem Vorbild von en.js anlegen und in index.html einbinden. */
(function () {
  const VD = (window.VD = window.VD || {});
  const dict = {};
  const LANGS = [
    { c: 'de', n: 'Deutsch' }, { c: 'en', n: 'English' }, { c: 'es', n: 'Español' }, { c: 'fr', n: 'Français' },
    { c: 'pt', n: 'Português' }, { c: 'ru', n: 'Русский' }, { c: 'hi', n: 'हिन्दी' }
  ];
  const codes = LANGS.map((l) => l.c);
  const get = () => { try { return localStorage.getItem('vt-lang'); } catch { return null; } };
  let lang = get();
  if (!codes.includes(lang)) {
    const nav = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en']).map((x) => String(x).toLowerCase().slice(0, 2));
    lang = nav.find((x) => codes.includes(x)) || 'en';
  }

  VD.LANGS = LANGS;
  VD.lang = lang;
  VD.missing = new Set();
  VD.addLang = (code, words) => { dict[code] = Object.assign(dict[code] || {}, words); };
  VD.setLang = (code) => { try { localStorage.setItem('vt-lang', code); } catch { /* ignore */ } location.reload(); };

  /* Text in der eingestellten Sprache; {name} im Text wird durch p.name ersetzt */
  VD.t = (key, p) => {
    let s = (dict[lang] && dict[lang][key]) || (lang !== 'de' && dict.en && dict.en[key]) || key;
    if (lang !== 'de' && !(dict[lang] && key in dict[lang])) VD.missing.add(key);   // zum Prüfen (Konsole: VD.missing): Texte ohne Übersetzung
    if (typeof s === 'function') s = s(p || {});
    if (p) s = s.replace(/\{(\w+)\}/g, (m, k) => (p[k] != null ? p[k] : m));
    return s;
  };
  /* "3 Zeilen" / "1 Zeile" */
  VD.lines = (n) => VD.t(n === 1 ? '{n} Zeile' : '{n} Zeilen', { n });

  /* Statischer Text in index.html: data-i18n (Inhalt), data-i18n-ph (Platzhalter), data-i18n-aria (aria-label) */
  VD.applyI18n = () => {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach((e) => { e.textContent = VD.t(e.getAttribute('data-i18n')); });
    document.querySelectorAll('[data-i18n-ph]').forEach((e) => { e.placeholder = VD.t(e.getAttribute('data-i18n-ph')); });
    document.querySelectorAll('[data-i18n-aria]').forEach((e) => { e.setAttribute('aria-label', VD.t(e.getAttribute('data-i18n-aria'))); });
    const app = (window.VD_CONFIG && window.VD_CONFIG.appName) || 'Vibing Together';
    const md = document.querySelector('meta[name=description]');
    if (md) md.content = VD.t('{app} – synchronisiert Filmszenen mit Freunden, direkt im Browser.', { app });
    document.title = app;
    // Schriftzug auf der Startseite: erstes Wort / Rest (zwei Zeilen-Teile wie im Design)
    const wm = document.querySelector('.wordmark');
    if (wm) { const [a, ...b] = app.split(' '); wm.setAttribute('aria-label', app); wm.replaceChildren(VD.h('span', { text: a }), b.length ? VD.h('span', { text: b.join(' ') }) : ''); }
  };

  /* Sprachwahl: Knopf mit dem Kürzel der aktuellen Sprache, darunter ein kleines Menü (Popover). Wechsel lädt die Seite
     neu, der Raum-Code in der Adresse bleibt erhalten. Es gibt nur ein Menü für die ganze Seite; es ist immer nur eines offen. */
  let menu = null, listEl = null, openBtn = null, activeIdx = 0;

  const svgEl = (tag, attrs) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
  const globe = () => {
    const s = svgEl('svg', { viewBox: '0 0 24 24', width: '16', height: '16', 'aria-hidden': 'true', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round' });
    s.append(svgEl('circle', { cx: '12', cy: '12', r: '9' }), svgEl('path', { d: 'M3 12h18M12 3c2.6 2.6 3.9 5.6 3.9 9s-1.3 6.4-3.9 9c-2.6-2.6-3.9-5.6-3.9-9S9.4 5.6 12 3z' }));
    return s;
  };

  function place() {
    if (!menu || !openBtn) return;
    const r = openBtn.getBoundingClientRect(), vw = document.documentElement.clientWidth, vh = window.innerHeight, gap = 6, edge = 8;
    const w = menu.offsetWidth, h = menu.offsetHeight;
    let left = r.right - w;                                   // rechts am Knopf ausrichten
    left = Math.max(edge, Math.min(left, vw - w - edge));     // nie über den Bildschirmrand hinaus
    let top = r.bottom + gap;
    if (top + h > vh - edge && r.top - gap - h >= edge) top = r.top - gap - h;   // unten kein Platz: nach oben aufklappen
    menu.style.left = left + 'px'; menu.style.top = Math.max(edge, top) + 'px';
  }

  function setActive(i, scroll) {
    const opts = listEl.children;
    activeIdx = (i + opts.length) % opts.length;
    for (let k = 0; k < opts.length; k++) opts[k].classList.toggle('on', k === activeIdx);
    menu.setAttribute('aria-activedescendant', opts[activeIdx].id);
    if (scroll) opts[activeIdx].scrollIntoView({ block: 'nearest' });
  }

  function close(refocus) {
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    document.removeEventListener('pointerdown', onOutside, true);
    window.removeEventListener('resize', onAway); window.removeEventListener('scroll', onAway, true);
    if (openBtn) { openBtn.setAttribute('aria-expanded', 'false'); if (refocus) openBtn.focus({ preventScroll: true }); }
    openBtn = null;
  }
  const onOutside = (e) => { if (menu.contains(e.target) || (openBtn && openBtn.contains(e.target))) return; close(false); };
  const onAway = (e) => { if (e && e.target && menu.contains(e.target)) return; close(false); };

  function choose(code) { close(true); if (code !== lang) VD.setLang(code); }

  function build() {
    listEl = VD.h('div', { class: 'lang-menu-list' }, ...LANGS.map((l, i) => VD.h('div', {
      class: 'lang-opt', role: 'option', id: 'lang-opt-' + l.c, lang: l.c, 'aria-selected': String(l.c === lang),
      onpointermove: () => { if (activeIdx !== i) setActive(i); }, onclick: () => choose(l.c)
    }, VD.h('span', { class: 'lang-opt-n', text: l.n }), VD.h('span', { class: 'lang-opt-ck', 'aria-hidden': 'true', text: l.c === lang ? '✓' : '' }))));
    menu = VD.h('div', { class: 'lang-menu', role: 'listbox', tabindex: '-1', 'aria-label': 'Language', hidden: true,
      onkeydown: (e) => {
        const k = e.key;
        if (k === 'ArrowDown') { e.preventDefault(); setActive(activeIdx + 1, true); }
        else if (k === 'ArrowUp') { e.preventDefault(); setActive(activeIdx - 1, true); }
        else if (k === 'Home') { e.preventDefault(); setActive(0, true); }
        else if (k === 'End') { e.preventDefault(); setActive(LANGS.length - 1, true); }
        else if (k === 'Enter' || k === ' ') { e.preventDefault(); choose(LANGS[activeIdx].c); }
        else if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); }
        else if (k === 'Tab') close(true);   // Fokus geht zurück zum Knopf, Tab springt von dort weiter
      } }, listEl);
    document.body.append(menu);
  }

  function open(btn) {
    if (!menu) build();
    if (openBtn === btn && !menu.hidden) return close(true);
    close(false);
    openBtn = btn; btn.setAttribute('aria-expanded', 'true');
    menu.hidden = false;
    setActive(Math.max(0, codes.indexOf(lang)));
    place();
    document.addEventListener('pointerdown', onOutside, true);
    window.addEventListener('resize', onAway); window.addEventListener('scroll', onAway, true);
    menu.focus({ preventScroll: true });
  }

  VD.langPicker = () => {
    const cur = LANGS.find((l) => l.c === lang) || LANGS[0];
    const btn = VD.h('button', { class: 'lang-pick glass', type: 'button', 'aria-label': 'Language', title: 'Language', 'aria-haspopup': 'listbox', 'aria-expanded': 'false',
      onclick: () => open(btn),
      onkeydown: (e) => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); open(btn); } }
    }, globe(), VD.h('span', { class: 'lang-pick-c', text: cur.c.toUpperCase() }));
    return btn;
  };
})();
