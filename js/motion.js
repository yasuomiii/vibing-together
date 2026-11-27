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
   4. Fenster: Einblenden per CSS, beim Schließen blendet eine Kopie aus; Sprachmenü blendet beim Schließen aus.
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
     2. Listen (FLIP): VD.motion.flip(box, neuZeichnen)
     Direkt vor dem Neuzeichnen wird gemessen, wo jeder Eintrag gerade SICHTBAR ist (auch mitten in einer Bewegung),
     direkt danach, wo er jetzt steht. Dann gleitet er von dort an den neuen Platz. Einträge werden über einen festen
     Schlüssel wiedererkannt (data-id, data-k oder ihr Name), auch wenn sie neu gebaut wurden.
     - wirklich neue Einträge blenden einmal ein (eigene CSS-Einblendung, sonst kurz per Web Animations API)
     - neu gebaute, aber gleiche Einträge blenden NICHT noch einmal ein
     - entfernte Einträge blenden an ihrem alten Platz aus (Kopie ohne eigene Animationen)
     ------------------------------------------------------------------ */
  const keyOf = (el) => {
    const d = el.dataset || {};
    if (d.id) return 'i:' + d.id;
    if (d.k) return 'k:' + d.k;
    const b = el.querySelector && el.querySelector('b, .pc-n, .ch-name');
    const t = (b ? b.textContent : el.tagName === 'LI' ? el.textContent : '').trim();
    return t ? 't:' + t : null;
  };
  const hasCss = (el) => { try { const cs = getComputedStyle(el); return cs.animationName !== 'none' && cs.animationIterationCount.indexOf('infinite') < 0; } catch { return false; } };
  const flips = new WeakMap();   // Eintrag -> laufende Gleit-Animation
  let layDepth = 0, layEls = [];
  const layQueue = [];
  /* Eintrag vom sichtbaren alten Platz br an den neuen gleiten lassen. ox/oy: so weit wird er schon von der umgebenden Karte verschoben */
  const glide = (el, br, pop, ox, oy, r0) => {
    if (!el.isConnected) return;
    const r = r0 || el.getBoundingClientRect();
    const dx = br.left - r.left - ox, dy = br.top - r.top - oy;
    const moved = Math.abs(dx) > 1 || Math.abs(dy) > 1;
    if (!moved && !pop) return;
    const from = (moved ? 'translate(' + dx + 'px,' + dy + 'px)' : '') + (pop ? ' scale(.92)' : '');
    const a = run(el, [{ transform: from.trim() }, { transform: 'none' }], { duration: dur().slow, easing: pop && !moved ? spring() : ease() }, () => { if (flips.get(el) === a) flips.delete(el); });
    if (a) flips.set(el, a);
  };
  M.flip = (box, mutate, opts) => {
    const go = box && box.isConnected && can() && box.children.length <= 160 && box.getClientRects().length > 0;
    if (!go) { mutate(); return; }
    // Steckt die Liste in einer Karte, die selbst gleitet (flipEls): deren Platz jetzt messen, im selben Moment wie die Einträge
    const panel = layDepth ? layEls.find((x) => x.contains(box)) || null : null;
    const pr = panel ? panel.getBoundingClientRect() : { left: 0, top: 0 };
    const before = new Map();
    for (const el of box.children) {
      const k = keyOf(el);
      if (k != null && !before.has(k)) before.set(k, { r: el.getBoundingClientRect(), node: el, on: el.classList.contains('on') });
    }
    // laufende Bewegungen beenden (der sichtbare Platz ist schon gemessen)
    before.forEach((b) => { const a = flips.get(b.node); if (a) { try { a.cancel(); } catch { /* ignore */ } flips.delete(b.node); } });
    mutate();
    if (!box.isConnected) return;
    const d = dur(), vh = window.innerHeight, seen = new Set();
    for (const el of box.children) {
      const k = keyOf(el);
      if (k == null || seen.has(k)) continue;
      seen.add(k);
      const b = before.get(k);
      if (b && b.node !== el && hasCss(el)) el.style.animation = 'none';   // nur neu gebaut: nicht noch einmal einblenden
      const r = el.getBoundingClientRect();
      const off = (x) => x.bottom < -80 || x.top > vh + 80;
      if (off(r) && (!b || off(b.r))) continue;   // nur was vorher oder nachher zu sehen ist, wird bewegt
      if (b) {
        const pop = !!(opts && opts.pop && el.classList.contains('on') && !b.on);   // neu gewählt: kurz einfedern
        if (layDepth) layQueue.push({ el, panel, bx: b.r.left - pr.left, by: b.r.top - pr.top, pop });   // bewegt wird danach (flipEls)
        else glide(el, b.r, pop, 0, 0);
      } else if (!hasCss(el)) {
        run(el, [{ opacity: 0, transform: 'translateY(8px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: d.slow, easing: ease() });
      }
    }
    // Entfernte Einträge: eine Kopie blendet an der alten Stelle aus
    before.forEach((b, k) => {
      if (seen.has(k) || b.node.isConnected) return;
      const r = b.r;
      if (r.bottom < -80 || r.top > vh + 80 || !r.width) return;
      const g = b.node.cloneNode(true);
      g.querySelectorAll('[id]').forEach((x) => x.removeAttribute('id')); g.removeAttribute('id');
      g.classList.add('mo-ghost'); g.setAttribute('aria-hidden', 'true');
      g.querySelectorAll('button, a, input').forEach((x) => { x.tabIndex = -1; });
      g.style.cssText += ';position:fixed;margin:0;pointer-events:none;z-index:30;box-sizing:border-box;left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px;transform:none;';
      // Die Kopie liegt über allem; unter der festen unteren Leiste bzw. der oberen Leiste darf sie deshalb nicht hindurchscheinen
      let cutT = 0, cutB = 0;
      const foot = document.querySelector('.lobby-foot'), top = document.querySelector('.h-top, .pc-top');
      if (foot) { const f = foot.getBoundingClientRect(); if (f.height && f.top < r.bottom && f.bottom > r.top) cutB = Math.max(0, r.bottom - f.top + 1); }
      if (top) { const f = top.getBoundingClientRect(); if (f.height && f.bottom > r.top && f.top < r.bottom) cutT = Math.max(0, f.bottom - r.top + 1); }
      if (cutT || cutB) g.style.clipPath = 'inset(' + Math.min(cutT, r.height) + 'px 0 ' + Math.min(cutB, r.height) + 'px 0)';
      document.body.append(g);
      run(g, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.96)' }], { duration: d.mid, easing: ease() }, () => g.remove());
    });
  };
  /* Größere Bereiche (z. B. die Karten der Lobby): Ändert sich darüber etwas in der Höhe, rutschen sie weich statt hart nach.
     Verschachtelte Aufrufe zählen als einer (nur der äußerste misst und bewegt). */
  const lays = new WeakMap();
  const scrollerOf = (el) => {
    for (let n = el && el.parentElement; n && n !== document.body; n = n.parentElement) { const o = getComputedStyle(n).overflowY; if (o === 'auto' || o === 'scroll') return n; }
    return document.scrollingElement || document.documentElement;
  };
  /* Höhe des Inhalts ohne die laufenden Verschiebungen (die zählen sonst kurz mit und der Browser zieht die Bildlaufposition später ruckartig nach) */
  const naturalHeight = (sc) => {
    let bottom = 0;
    const top0 = sc.getBoundingClientRect().top - sc.scrollTop;
    for (const c of sc.children) { if (c.classList.contains('mo-ghost')) continue; const r = c.getBoundingClientRect(); bottom = Math.max(bottom, r.top - top0 + c.offsetHeight + (parseFloat(getComputedStyle(c).marginBottom) || 0)); }
    return bottom + (parseFloat(getComputedStyle(sc).paddingBottom) || 0);
  };
  M.flipEls = (els, mutate) => {
    if (layDepth || !els || !els.length || !can()) { mutate(); return; }
    layQueue.length = 0;
    layDepth++;
    let before, sc = null;
    try {
      before = els.map((el) => ({ el, r: el.getBoundingClientRect() }));
      before.forEach((b) => { const a = lays.get(b.el); if (a) { try { a.cancel(); } catch { /* ignore */ } lays.delete(b.el); } });
      sc = scrollerOf(els[0]);
      layEls = els;
      mutate();
    } finally { layDepth--; layEls = []; }
    // Wird der Inhalt kürzer, während man ganz unten ist: Bildlaufposition sofort anpassen, die Bewegung unten gleicht es weich aus
    try {
      if (sc && sc !== document.scrollingElement) { const max = Math.max(0, Math.ceil(naturalHeight(sc) - sc.clientHeight)); if (sc.scrollTop > max) sc.scrollTop = max; }
    } catch { /* ignore */ }
    const vh = window.innerHeight, d = dur();
    // Erst alles messen (Karten und Einträge), dann erst bewegen: sonst misst man schon verschobene Plätze
    const offs = new Map(), after = new Map();
    before.forEach((b) => {
      const el = b.el;
      if (!el.isConnected) return;
      const r = el.getBoundingClientRect();
      after.set(el, r);
      const dx = b.r.left - r.left, dy = b.r.top - r.top;
      const off = (x) => x.top > vh + 80 || x.bottom < -80;
      if ((Math.abs(dx) < 2 && Math.abs(dy) < 2) || (off(r) && off(b.r))) return;   // vorher und nachher außer Sicht: nichts zu sehen
      offs.set(el, { dx, dy });
    });
    const q = layQueue.splice(0).map((it) => Object.assign(it, { r: it.el.isConnected ? it.el.getBoundingClientRect() : null }));
    offs.forEach((o, el) => {
      const a = run(el, [{ transform: 'translate(' + o.dx + 'px,' + o.dy + 'px)' }, { transform: 'none' }], { duration: d.slow, easing: ease() }, () => { if (lays.get(el) === a) lays.delete(el); });
      if (a) lays.set(el, a);
    });
    // Einträge in den Listen: ihre Bewegung abzüglich der Bewegung ihrer Karte (sonst würden sie doppelt verschoben)
    q.forEach((it) => {
      if (!it.r || !it.el.isConnected) return;
      const pr = (it.panel && after.get(it.panel)) || { left: 0, top: 0 };
      // Platz in der Karte vorher und nachher; die Karte selbst gleitet schon für sich
      const br = { left: it.bx + pr.left, top: it.by + pr.top };
      glide(it.el, br, it.pop, 0, 0, it.r);
    });
  };
  M.wrapLayout = (proto, name, elsOf) => {
    const f = proto[name];
    if (typeof f !== 'function' || f._moLay) return;
    const w = function (...args) {
      let out, els = null;
      try { els = elsOf.call(this); } catch { els = null; }
      M.flipEls(els ? Array.from(els) : null, () => { out = f.apply(this, args); });
      return out;
    };
    w._moLay = true;
    proto[name] = w;
  };
  /* Methode eines Objekts so umhüllen, dass ihre Liste gleitet: wrapFlip(proto, 'renderPacks', function () { return box; }) */
  M.wrapFlip = (proto, name, boxOf, opts) => {
    const f = proto[name];
    if (typeof f !== 'function' || f._moFlip) return;
    const w = function (...args) {
      let out, box = null;
      try { box = boxOf.call(this); } catch { box = null; }
      M.flip(box, () => { out = f.apply(this, args); }, opts);
      return out;
    };
    w._moFlip = true;
    proto[name] = w;
  };

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
  const cardOf = (m) => m.querySelector('.modal-card') || m.firstElementChild;
  /* Öffnen: reine CSS-Einblendung (Hintergrund und Fenster blenden gleich schnell ein, das Fenster federt nur leicht).
     Schließen: eine Kopie des ganzen Fensters blendet aus. */
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
      if (card) run(card, [{ transform: 'none' }, { transform: 'scale(.9)' }], { duration: d.mid, easing: ease() });   // nur die Größe: das Ausblenden macht die ganze Kopie gemeinsam mit dem Hintergrund
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
    let last = el.textContent, a = null;
    new MutationObserver(() => {
      const now = el.textContent;
      if (now === last) return;
      last = now;
      if (a) { try { a.cancel(); } catch { /* ignore */ } a = null; }   // schnell hintereinander: neu ansetzen, nie hart abbrechen
      if (!can() || !el.getClientRects().length) return;
      a = run(el, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: dur().mid, easing: ease() }, () => { a = null; });
    }).observe(el, { childList: true, characterData: true, subtree: true });
  }
  /* Knöpfe der Aufnahme: nur wenn ein Knopf seinen Zustand wirklich wechselt (z. B. Aufnahme <-> Stopp, Original <-> Stopp),
     federt er kurz. Werden Knöpfe nur wieder freigegeben (nach Aufnahme oder Wiedergabe), bewegt sich nichts:
     sonst hüpften alle Knöpfe gleichzeitig. */
  function initPop(btn) {
    if (btn._moPop) return;
    btn._moPop = true;
    let on = btn.classList.contains('on');
    new MutationObserver(() => {
      const o = btn.classList.contains('on');
      if (o === on) return;
      on = o;
      if (M.reduced() || document.hidden || btn.disabled || !btn.getClientRects().length) return;
      if (btn._moPopA) { try { btn._moPopA.cancel(); } catch { /* ignore */ } }
      btn._moPopA = run(btn, [{ transform: 'scale(.94)' }, { transform: 'none' }], { duration: dur().slow, easing: spring() });
    }).observe(btn, { attributes: true, attributeFilter: ['class'] });
  }
  /* Kleiner Wechsel innerhalb derselben Ansicht (z. B. nächste Zeile): diese Teile blenden kurz ein, dir = Richtung (1 vor, -1 zurück) */
  M.soft = (els, dir) => {
    if (!can()) return;
    const x = (dir || 0) * 12;
    Array.from(els || []).forEach((el) => run(el, [{ opacity: 0, transform: 'translateX(' + x + 'px)' }, { opacity: 1, transform: 'none' }], { duration: dur().mid, easing: ease() }));
  };
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
      a = run(chip, [{ transform: 'scale(.92)' }, { transform: 'none' }], { duration: dur().slow, easing: spring() });
    }).observe(chip, { attributes: true, attributeFilter: ['class'] });
  }

  /* Bereiche, die per hidden erscheinen (Wunschrolle, Hinweise, Fehler): blenden leicht ein, aber nur wenn sie nach dem Einfügen sichtbar werden
     (Bereiche, die schon sichtbar mit der Ansicht kommen, blenden nicht noch einmal ein) */
  function initReveal(el) {
    if (el._moRev) return;
    el._moRev = true;
    let was = el.hidden;
    new MutationObserver(() => {
      const hid = el.hidden;
      if (was && !hid && can() && el.getClientRects().length) run(el, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: dur().slow, easing: ease() });
      was = hid;
    }).observe(el, { attributes: true, attributeFilter: ['hidden'] });
  }
  /* Liste neu zeichnen, ohne dass der Tastaturfokus verloren geht: der fokussierte Eintrag wird nach dem Neuzeichnen wiedergefunden */
  M.keepFocus = (box, fn) => {
    const a = document.activeElement;
    const had = a && a !== document.body && box.contains(a);
    const idx = had ? Array.from(box.children).findIndex((c) => c.contains(a)) : -1;
    const label = had ? (a.textContent || '').trim() : '';
    fn();
    if (!had) return;
    const kids = Array.from(box.children);
    const hit = kids.find((c) => (c.textContent || '').trim() === label) || kids[idx];
    if (hit && hit.focus) { try { hit.focus({ preventScroll: true }); } catch { /* ignore */ } }
  };

  /* Hell/Dunkel: das Symbol dreht sich weich ein */
  document.addEventListener('vt-theme', () => {
    if (!can()) return;
    document.querySelectorAll('.theme-btn').forEach((b) => run(b, [{ transform: 'rotate(-80deg) scale(.7)', opacity: .2 }, { transform: 'none', opacity: 1 }], { duration: dur().slow, easing: spring() }));
  });

  /* ------------------------------------------------------------------
     Alles automatisch anschließen, sobald die passenden Elemente auftauchen
     ------------------------------------------------------------------ */
  const TICKS = '.dp-n, .sum, .pv-status, .pc-s';
  const POPS = '.dp-btns .btn';
  const each = (n, sel, fn) => { if (n.matches && n.matches(sel)) fn(n); if (n.querySelectorAll) n.querySelectorAll(sel).forEach(fn); };
  const scan = (n) => {
    if (!n || n.nodeType !== 1 || n.classList.contains('mo-ghost')) return;
    each(n, '.seg', initGlide);
    each(n, TICKS, initTick);
    each(n, POPS, initPop);
    each(n, '.fx-chip, .role', initSel);
    each(n, '.roles, .warn', initReveal);
    each(n, '.lang-menu', initMenu);
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
