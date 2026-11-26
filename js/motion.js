/* Bewegung: kleine gemeinsame Hilfen, damit sich alles gleich anfühlt und nichts hart umschaltet.
   Nur Aussehen, kein Spielverhalten. Alle Hilfen sind gesichert:
   - "Bewegung reduzieren" (Betriebssystem) und Aufnahme (Mikro läuft): es wird nichts animiert, alles schaltet sofort um.
   - Es werden nur transform und opacity animiert (Web Animations API). Der Endzustand steht immer schon im Stil / in der DOM,
     die Animation ist nur der Weg dorthin. Bricht sie ab, bleibt nichts Falsches stehen.
   - Zeiten und Kurven kommen aus den CSS-Variablen ganz oben in style.css (--dur-*, --ease, --spring-soft).
   Bausteine (alle werden automatisch angeschlossen, die Ansichten müssen nichts aufrufen):
   1. Gleitende Markierung in Umschaltern (.seg).
   2. Listen: Einträge rücken sanft nach, neue blenden ein, entfernte blenden aus (FLIP, Schlüssel: data-id / data-k / Text).
   3. VD.motion.swap / VD.motion.leave: die alte Ansicht blendet weich aus, während die neue kommt.
   4. Fenster wachsen aus ihrem Auslöser und ziehen sich beim Schließen dorthin zurück; Sprachmenü blendet beim Schließen aus.
   5. Zähler und Statustexte wechseln mit kurzer Auf-/Ab-Bewegung; Knöpfe federn beim Zustandswechsel. */
(function () {
  const VD = (window.VD = window.VD || {});
  const M = (VD.motion = {});
  const root = document.documentElement;
  const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  M.reduced = () => !!mq.matches;
  const css = (n) => getComputedStyle(root).getPropertyValue(n).trim();
  const ms = (n, d) => { const v = css(n), x = parseFloat(v); if (!isFinite(x)) return d; return /ms$/.test(v) ? x : x * 1000; };
  const dur = () => ({ fast: ms('--dur-fast', 160), mid: ms('--dur', 240), view: ms('--dur-view', 320), slow: ms('--dur-slow', 360) });
  const ease = () => css('--ease') || 'cubic-bezier(.2,.8,.2,1)';
  const spring = () => css('--spring-soft') || 'cubic-bezier(.3,1.25,.5,1)';
  /* Aufnahme läuft: keine zusätzliche Bewegung (das Mikro hat Vorrang) */
  const recording = () => !!document.querySelector('.dp-btns .dp-rec.on');
  const can = () => !M.reduced() && !document.hidden && typeof Element.prototype.animate === 'function' && !recording();
  M.can = can;

  const later = (fn, t) => setTimeout(fn, t);
  /* Hilfe: Animation starten und zuverlässig aufräumen (auch wenn sie abbricht oder der Tab im Hintergrund ist) */
  const run = (el, frames, opts, done) => {
    let a = null, fin = false;
    const end = () => { if (fin) return; fin = true; try { a && a.cancel(); } catch { /* ignore */ } if (done) done(); };
    try { a = el.animate(frames, opts); a.onfinish = end; a.oncancel = () => { fin = true; }; } catch { end(); return null; }
    later(end, (opts.duration || 300) + (opts.delay || 0) + 250);   // Absicherung: nach Ablauf der Zeit ist alles aufgeräumt
    return a;
  };

  /* ------------------------------------------------------------------
     1. Gleitende Markierung (.seg)
     Der Knopf mit .on bekommt sein Aussehen von einer Markierung, die hinter den Knöpfen liegt und per transform
     (Position + Größe) vom alten zum neuen Knopf gleitet. Ist keine Markierung sichtbar, gilt das alte Aussehen (.on am Knopf).
     ------------------------------------------------------------------ */
  const lastPos = new Map();   // Segment wird beim Neuzeichnen neu gebaut: Markierung gleitet trotzdem vom alten Platz weiter
  function initGlide(wrap) {
    if (wrap._moGlide) return;
    wrap._moGlide = true;
    if (!wrap.classList.contains('mo-g')) wrap.classList.add('mo-g');
    const ind = document.createElement('i');
    ind.className = 'mo-ind'; ind.setAttribute('aria-hidden', 'true');
    const gkey = (wrap.getAttribute('aria-label') || '') + '|' + (wrap.className || '').replace(/\bmo-\S+/g, '').trim();
    let cur = null, anim = null;
    const l0 = lastPos.get(gkey);
    if (l0 && Date.now() - l0.t < 1200) cur = l0.pos;
    const active = () => { for (const c of wrap.children) if (c !== ind && c.classList.contains('on')) return c; return null; };
    const place = (animate) => {
      if (!ind.isConnected) wrap.append(ind);
      const a = active();
      if (!a || !a.offsetWidth || !wrap.offsetWidth) { if (wrap.classList.contains('mo-live')) wrap.classList.remove('mo-live'); return; }
      const t = { x: a.offsetLeft, y: a.offsetTop, w: a.offsetWidth, h: a.offsetHeight };
      if (cur && cur.x === t.x && cur.y === t.y && cur.w === t.w && cur.h === t.h && wrap.classList.contains('mo-live')) return;   // nichts hat sich bewegt: laufende Animation nicht stören
      ind.style.width = t.w + 'px'; ind.style.height = t.h + 'px';
      const to = 'translate(' + t.x + 'px,' + t.y + 'px)';
      if (animate && cur && can() && (cur.x !== t.x || cur.y !== t.y || cur.w !== t.w || cur.h !== t.h)) {
        let f = cur;
        if (anim) {   // mitten in der Bewegung: vom aktuell sichtbaren Platz weitergleiten
          const wr = wrap.getBoundingClientRect(), ir = ind.getBoundingClientRect();
          f = { x: ir.left - wr.left - wrap.clientLeft, y: ir.top - wr.top - wrap.clientTop, w: ir.width, h: ir.height };
          try { anim.cancel(); } catch { /* ignore */ }
          anim = null;
        }
        ind.style.transform = to;
        const from = 'translate(' + f.x + 'px,' + f.y + 'px) scale(' + (f.w / t.w) + ',' + (f.h / t.h) + ')';
        anim = run(ind, [{ transform: from }, { transform: to }], { duration: dur().mid + 40, easing: ease() }, () => { anim = null; });
      } else {
        if (anim) { try { anim.cancel(); } catch { /* ignore */ } anim = null; }
        ind.style.transform = to;
      }
      cur = t; if (!wrap.classList.contains('mo-live')) wrap.classList.add('mo-live');
      lastPos.set(gkey, { t: Date.now(), pos: t });
    };
    wrap.append(ind);
    place(true);
    const mo = new MutationObserver((recs) => { if (recs.some((r) => r.target !== wrap && r.target !== ind)) place(true); });
    mo.observe(wrap, { attributes: true, attributeFilter: ['class'], subtree: true, childList: true });
    if (window.ResizeObserver) new ResizeObserver(() => place(false)).observe(wrap);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => place(false));
  }

  /* Einblend-Animationen (CSS) eines schon gebauten Teilbaums ausschalten: wird eine Ansicht nur neu gezeichnet
     (gleiche Ansicht, gleicher Inhalt), soll nichts noch einmal einblenden. Endlos laufende (Ladepunkte, Schweben) bleiben. */
  const quiet = (root) => {
    try {
      const all = [root].concat(Array.from(root.querySelectorAll('*')));
      all.forEach((x) => { const cs = getComputedStyle(x); if (cs.animationName !== 'none' && cs.animationIterationCount.indexOf('infinite') < 0) x.style.animation = 'none'; });
    } catch { /* ignore */ }
  };
  M.quiet = quiet;
  /* Ansicht ohne Animation ersetzen (gleiche Ansicht wird neu gezeichnet) */
  M.replace = (container, el) => { container.replaceChildren(el); quiet(el); };
  /* Einblendung einer neuen Ansicht: Enthält sie schon Elemente mit eigener, gestaffelter Einblendung, bewegt sich die Ansicht nur leicht
     (view-rise) und blendet nicht zusätzlich ein. Sonst blendet die ganze Ansicht ein (view-in). So gibt es pro Element genau eine Einblendung. */
  M.enter = (el) => {
    const staged = el.classList.contains('premiere') || !!el.querySelector('.title-in, .medal, .cast-card, .pcard, .code-big, .pr-chip, .dub-screen.big');
    el.classList.add(staged ? 'view-rise' : 'view-in');
    return el;
  };

  /* ------------------------------------------------------------------
     2. Listen (FLIP): Position merken, Änderung abwarten, vom alten zum neuen Platz gleiten
     ------------------------------------------------------------------ */
  const lists = new WeakMap();
  const keyOf = (el) => {
    const d = el.dataset || {};
    if (d.id) return 'i:' + d.id;
    if (d.k) return 'k:' + d.k;
    const b = el.querySelector && el.querySelector('b, .pc-n, .ch-name');
    const t = (b ? b.textContent : el.tagName === 'LI' ? el.textContent : '').trim();
    return t ? 't:' + t : null;
  };
  function initList(box) {
    if (lists.has(box)) return;
    const born = performance.now();
    const S = { cache: new Map(), anims: new WeakMap(), born };
    lists.set(box, S);
    const kids = () => Array.from(box.children).filter((c) => !c.classList.contains('mo-ghost'));
    const rel = (el) => {
      const r = el.getBoundingClientRect(), b = box.getBoundingClientRect();
      return { x: r.left - b.left - box.clientLeft + box.scrollLeft, y: r.top - b.top - box.clientTop + box.scrollTop, w: r.width, h: r.height };
    };
    const visible = () => box.isConnected && box.getClientRects().length > 0;
    const snap = () => {
      const m = new Map();
      if (!visible()) return m;
      kids().forEach((el) => { const k = keyOf(el); if (k != null) m.set(k, { r: rel(el), node: el }); });
      return m;
    };
    later(() => { S.cache = snap(); }, 520);
    const hasCss = (el) => { try { return getComputedStyle(el).animationName !== 'none'; } catch { return true; } };
    const onChange = () => {
      if (!visible()) { S.cache = new Map(); return; }
      const list = kids();
      const go = can() && performance.now() - S.born > 520 && list.length <= 160 && S.cache.size > 0;
      const vis = new Map();
      if (go) list.forEach((el) => { const a = S.anims.get(el); if (a) { vis.set(el, rel(el)); try { a.cancel(); } catch { /* ignore */ } S.anims.delete(el); } });
      const now = new Map();
      list.forEach((el) => { const k = keyOf(el); if (k != null) now.set(k, { r: rel(el), node: el }); });
      // Eintrag wurde nur neu gebaut (gleicher Schlüssel): CSS-Einblendung nicht noch einmal abspielen; neu gewählt: kurz einfedern
      now.forEach((cur, key) => {
        const o = S.cache.get(key);
        if (!o || o.node === cur.node || o.node.isConnected) return;
        if (hasCss(cur.node) && getComputedStyle(cur.node).animationIterationCount.indexOf('infinite') < 0) cur.node.style.animation = 'none';
        if (can() && cur.node.classList.contains('on') && !o.node.classList.contains('on')) run(cur.node, [{ transform: 'scale(.92)' }], { duration: dur().slow, easing: spring() });
      });
      if (go) {
        const vh = window.innerHeight, br = box.getBoundingClientRect();
        const d = dur();
        now.forEach((cur, key) => {
          const el = cur.node, was = vis.get(el) || (S.cache.get(key) && S.cache.get(key).r);
          const top = br.top + cur.r.y - box.scrollTop;
          if (top > vh + 80 || top + cur.r.h < -80) return;   // nur Sichtbares wird bewegt
          if (was) {
            const dx = was.x - cur.r.x, dy = was.y - cur.r.y;
            if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
              const a = run(el, [{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }], { duration: d.slow, easing: ease() }, () => S.anims.delete(el));
              if (a) S.anims.set(el, a);
            }
          } else if (!hasCss(el)) {
            run(el, [{ opacity: 0, transform: 'translateY(10px) scale(.97)' }], { duration: d.slow, easing: ease() });
          }
        });
        // Entfernte Einträge: blenden an ihrem alten Platz aus (als Kopie über der Seite)
        S.cache.forEach((old, key) => {
          if (now.has(key) || old.node.isConnected) return;
          const top = br.top + old.r.y - box.scrollTop;
          if (top > vh + 80 || top + old.r.h < -80) return;
          const g = old.node;
          g.classList.add('mo-ghost');
          g.style.cssText += ';position:fixed;margin:0;pointer-events:none;z-index:30;left:' + (br.left + box.clientLeft + old.r.x - box.scrollLeft) + 'px;top:' + top + 'px;width:' + old.r.w + 'px;height:' + old.r.h + 'px;';
          g.setAttribute('aria-hidden', 'true'); g.querySelectorAll('button, a, input').forEach((x) => { x.tabIndex = -1; });
          document.body.append(g);
          run(g, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.96)' }], { duration: d.mid, easing: ease() }, () => g.remove());
        });
      }
      S.cache = now;
    };
    new MutationObserver(onChange).observe(box, { childList: true });
    if (window.ResizeObserver) new ResizeObserver(() => { if (performance.now() - S.born > 520) S.cache = snap(); }).observe(box);
  }

  /* ------------------------------------------------------------------
     3. Ansichtswechsel: die alte Ansicht blendet aus, während die neue einblendet (Kopfleiste, Raumcode, Logo bleiben stehen)
     ------------------------------------------------------------------ */
  const ghostOf = (node, rect, clip) => {   // Kopie der alten Ansicht, an der alten Stelle über der Seite, begrenzt auf clip
    if (node.querySelectorAll('*').length > 900) return null;
    const c = node.cloneNode(true);
    c.querySelectorAll('video, audio, iframe, script').forEach((x) => x.remove());
    c.querySelectorAll('[id]').forEach((x) => x.removeAttribute('id'));
    c.removeAttribute('id'); c.removeAttribute('hidden');
    c.querySelectorAll('button, a, input, select, textarea').forEach((x) => { x.tabIndex = -1; });
    ['view-in'].forEach((k) => c.classList.remove(k));
    c.style.animation = 'none';
    c.querySelectorAll('.view-in, .modal-card').forEach((x) => { x.style.animation = 'none'; });
    c.style.cssText += ';position:absolute;margin:0;left:' + (rect.left - clip.left) + 'px;top:' + (rect.top - clip.top) + 'px;width:' + rect.width + 'px;';
    const w = document.createElement('div');
    w.className = 'mo-ghost mo-view';
    w.setAttribute('aria-hidden', 'true');
    w.style.cssText = 'position:fixed;overflow:hidden;pointer-events:none;z-index:40;left:' + clip.left + 'px;top:' + clip.top + 'px;width:' + clip.width + 'px;height:' + clip.height + 'px;';
    w.append(c);
    return w;
  };
  const fadeOut = (w) => {
    document.body.append(w);
    const d = dur();
    run(w, [{ opacity: 1 }, { opacity: 0 }], { duration: d.fast + 40, easing: 'ease-out' }, () => w.remove());
  };
  /* container.replaceChildren(el) mit weichem Ausblenden der alten Ansicht */
  M.swap = (container, el) => {
    const old = container.firstElementChild;
    let g = null;
    try {
      if (old && can() && container.isConnected && container.getClientRects().length) g = ghostOf(old, old.getBoundingClientRect(), container.getBoundingClientRect());
    } catch { g = null; }
    if (g && el.classList.contains('view-in')) { el.classList.remove('view-in'); el.classList.add('view-rise'); }   // die alte Kopie blendet aus: die neue Ansicht darunter muss nicht auch noch einblenden (sonst Aufhellen und Abdunkeln nacheinander)
    container.replaceChildren(el);
    if (g) fadeOut(g);
  };
  /* Statische Bildschirme (Startseite, Beitritt …), die per hidden umgeschaltet werden: vor dem Verstecken aufrufen */
  M.leave = (screen) => {
    try {
      if (!screen || screen.hidden || !can() || !screen.getClientRects().length) return;
      const r = screen.getBoundingClientRect();
      const g = ghostOf(screen, r, { left: 0, top: 0, width: document.documentElement.clientWidth, height: window.innerHeight });
      if (g) fadeOut(g);
    } catch { /* ignore */ }
  };

  /* ------------------------------------------------------------------
     4. Fenster und Menüs
     ------------------------------------------------------------------ */
  let trig = null;   // zuletzt angetippter Auslöser
  const noteTrig = (e) => {
    const t = e.target && e.target.closest ? e.target.closest('button, a, [role="button"], .pk, .settings-btn') : null;
    if (t) trig = { el: t, at: Date.now() };
  };
  document.addEventListener('pointerdown', noteTrig, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') noteTrig(e); }, true);

  const cardOf = (m) => m.querySelector('.modal-card') || m.firstElementChild;
  function openModal(m) {
    if (m._moOpen) return;
    m._moOpen = true;
    if (!can()) return;
    const card = cardOf(m);
    if (!card) return;
    try {
      const t = trig && Date.now() - trig.at < 1000 && trig.el.isConnected ? trig.el.getBoundingClientRect() : null;
      if (!t || !t.width) return;   // ohne bekannten Auslöser bleibt die normale Einblendung
      const r = card.getBoundingClientRect();
      const ox = Math.max(0, Math.min(r.width, t.left + t.width / 2 - r.left)), oy = Math.max(0, Math.min(r.height, t.top + t.height / 2 - r.top));
      card.style.transformOrigin = ox + 'px ' + oy + 'px';
      card.style.animation = 'none';
      run(card, [{ opacity: 0, transform: 'scale(.78)' }], { duration: dur().slow + 40, easing: spring() });
    } catch { /* ignore */ }
  }
  function closeModal(n) {
    if (!can() || !n.getClientRects) return;
    try {
      const g = n.cloneNode(true);
      g.querySelectorAll('video, audio, iframe, script').forEach((x) => x.remove());
      g.querySelectorAll('[id]').forEach((x) => x.removeAttribute('id'));
      g.removeAttribute('id');
      g.querySelectorAll('button, a, input, select, textarea').forEach((x) => { x.tabIndex = -1; });
      g.classList.add('mo-ghost'); g.setAttribute('aria-hidden', 'true');
      g.style.animation = 'none'; g.style.pointerEvents = 'none';
      const card = cardOf(g);
      if (card) card.style.animation = 'none';
      document.body.append(g);
      const d = dur();
      run(g, [{ opacity: 1 }, { opacity: 0 }], { duration: d.mid, easing: 'ease-out' }, () => g.remove());
      if (card) run(card, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.82)' }], { duration: d.mid, easing: ease() });
    } catch { /* ignore */ }
  }
  function initMenu(menu) {
    if (menu._moMenu) return;
    menu._moMenu = true;
    new MutationObserver(() => {
      if (!menu.hidden || !menu._shown || !can()) { menu._shown = !menu.hidden; return; }
      menu._shown = false;
      const g = menu._snap;
      if (!g) return;
      g.hidden = false; g.classList.add('mo-ghost'); g.style.animation = 'none'; g.style.pointerEvents = 'none'; g.removeAttribute('id');
      document.body.append(g);
      run(g, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-4px) scale(.97)' }], { duration: dur().fast, easing: 'ease-out' }, () => g.remove());
    }).observe(menu, { attributes: true, attributeFilter: ['hidden'] });
    // Kopie für das Ausblenden, solange das Menü offen ist (Position steht im Stil)
    new MutationObserver(() => { if (!menu.hidden) { try { menu._snap = menu.cloneNode(true); } catch { menu._snap = null; } } }).observe(menu, { attributes: true, attributeFilter: ['style', 'hidden'] });
    menu._shown = !menu.hidden;
  }

  /* ------------------------------------------------------------------
     5. Zähler, Statustexte und Knopf-Zustände
     ------------------------------------------------------------------ */
  function initTick(el) {
    if (el._moTick) return;
    el._moTick = true;
    let last = el.textContent, t0 = 0;
    new MutationObserver(() => {
      const now = el.textContent;
      if (now === last) return;
      last = now;
      const t = performance.now();
      if (t - t0 < 120 || !can() || !el.getClientRects().length) return;
      t0 = t;
      run(el, [{ opacity: .25, transform: 'translateY(7px)' }], { duration: dur().mid, easing: ease() });
    }).observe(el, { childList: true, characterData: true, subtree: true });
  }
  function initPop(btn) {
    if (btn._moPop) return;
    btn._moPop = true;
    let on = btn.classList.contains('on'), dis = btn.disabled;
    new MutationObserver(() => {
      const o = btn.classList.contains('on'), d = btn.disabled;
      const changed = o !== on || d !== dis;
      const enabling = dis && !d;
      on = o; dis = d;
      if (!changed || M.reduced() || document.hidden || (d && !enabling) || !btn.getClientRects().length) return;
      if (btn._moPopA) { try { btn._moPopA.cancel(); } catch { /* ignore */ } }
      btn._moPopA = run(btn, [{ transform: 'scale(.93)' }], { duration: dur().slow, easing: spring() });
    }).observe(btn, { attributes: true, attributeFilter: ['class', 'disabled'] });
  }
  /* Auswahl-Chips und Wunschrollen: nur wenn die Auswahl wirklich wechselt, federt der neu gewählte kurz ein */
  function initSel(chip) {
    if (chip._moSel) return;
    chip._moSel = true;
    let on = chip.classList.contains('on'), a = null;
    new MutationObserver(() => {
      const o = chip.classList.contains('on');
      if (o === on) return;
      on = o;
      if (!o || !can() || !chip.getClientRects().length) return;
      if (a) { try { a.cancel(); } catch { /* ignore */ } }
      a = run(chip, [{ transform: 'scale(.92)' }], { duration: dur().slow, easing: spring() });
    }).observe(chip, { attributes: true, attributeFilter: ['class'] });
  }

  /* Hell/Dunkel: das Symbol dreht sich weich ein */
  document.addEventListener('vt-theme', () => {
    if (!can()) return;
    document.querySelectorAll('.theme-btn').forEach((b) => run(b, [{ transform: 'rotate(-80deg) scale(.7)', opacity: .2 }], { duration: dur().slow, easing: spring() }));
  });

  /* ------------------------------------------------------------------
     Alles automatisch anschließen, sobald die passenden Elemente auftauchen
     ------------------------------------------------------------------ */
  const LISTS = '.players, .pack-list, .h-strip, .mini-players, .roster, .pr-cast, .role-list, .pv-cards';
  const TICKS = '.dp-n, .sum, .pv-status, .pc-s';
  const POPS = '.dp-btns .btn';
  const each = (n, sel, fn) => { if (n.matches && n.matches(sel)) fn(n); if (n.querySelectorAll) n.querySelectorAll(sel).forEach(fn); };
  const scan = (n) => {
    if (!n || n.nodeType !== 1 || n.classList.contains('mo-ghost')) return;
    each(n, '.seg', initGlide);
    each(n, LISTS, initList);
    each(n, TICKS, initTick);
    each(n, POPS, initPop);
    each(n, '.fx-chip, .role', initSel);
    each(n, '.lang-menu', initMenu);
    if (n.classList.contains('modal') && n.parentNode === document.body) openModal(n);
  };
  M.scan = scan;
  const start = () => {
    scan(document.body);
    new MutationObserver((recs) => {
      for (const r of recs) {
        r.addedNodes.forEach(scan);
        if (r.target === document.body) r.removedNodes.forEach((n) => { if (n.nodeType === 1 && n.classList.contains('modal') && !n.classList.contains('mo-ghost')) closeModal(n); });
      }
    }).observe(document.body, { childList: true, subtree: true });
  };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
