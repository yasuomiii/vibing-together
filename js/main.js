/* Einstieg: Startseite, Beitritt (Handy), Host-Start */
(function () {
  const VD = window.VD;
  const $ = VD.$;
  const screens = ['home', 'join', 'maker', 'host', 'player'];
  // Fehlt ein Bereich (z. B. der Ersteller wurde aus index.html entfernt), wird er einfach übersprungen
  const show = (name) => {
    const cur = screens.map((s) => $('#v-' + s)).find((el) => el && !el.hidden);
    if (cur && cur.id !== 'v-' + name) VD.motion.leave(cur);   // alte Ansicht blendet weich aus
    screens.forEach((s) => { const el = $('#v-' + s); if (el) el.hidden = s !== name; });
    // Hintergrundmusik: Startseite und Beitritt ja; Ersteller nein; Host und Spieler melden ihre Phase selbst
    if (VD.music) VD.music.where(name === 'home' || name === 'join' ? name : 'off');
  };

  /* Spieler-ID pro Browser-Tab, damit ein Neuladen wieder in den Raum findet */
  function getPid() {
    try {
      let p = sessionStorage.getItem('vd.pid');
      if (!p) { p = VD.uid(); sessionStorage.setItem('vd.pid', p); }
      return p;
    } catch { return VD.uid(); }
  }

  VD.applyI18n();
  document.querySelectorAll('.lang-slot').forEach((e) => e.append(VD.ui.themeBtn(), VD.ui.settingsBtn(), VD.langPicker()));
  { const hs = document.querySelector('.home > .lang-slot'); if (hs) hs.prepend(VD.ui.helpBtn()); }   // Fragezeichen oben links auf der Startseite

  const params = new URLSearchParams(location.search);
  const cleanCode = (s) => (s || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);

  /* ---------- Startseite ---------- */

  const mkBtn = $('#btn-maker');
  if (mkBtn && $('#v-maker') && VD.Maker && VD_CONFIG.maker && VD_CONFIG.maker.enabled) {
    mkBtn.hidden = false;
    const tb = mkBtn.parentNode.querySelector('.theme-btn'); if (tb) tb.before(mkBtn);   // links neben dem Design-Knopf
    const mk = $('#v-maker');
    const slideIn = () => { mk.classList.remove('view-in'); void mk.offsetWidth; mk.classList.add('view-in'); };   // kurze Einblend-Animation
    mkBtn.addEventListener('click', () => { show('maker'); VD.Packs.init && VD.Packs.init(); VD.Maker.open(mk, () => show('home')); window.scrollTo(0, 0); slideIn(); });
  }

  $('#btn-host').addEventListener('click', async () => {
    show('host');
    document.body.classList.add('is-host');
    const host = new VD.Host($('#v-host'));
    window.__host = host;   // für den Hinweis beim Schließen und die Fehlersuche in der Browser-Konsole
    try { await host.start(); } catch (e) { console.error(e); VD.toast(VD.t('Start fehlgeschlagen: {e}', { e: e.message }), 'warn'); }
  });

  $('#join-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const c = cleanCode($('#code-in').value);
    if (c.length !== 4) { $('#code-in').classList.add('shake'); setTimeout(() => $('#code-in').classList.remove('shake'), 500); return; }
    showJoin(c);
  });
  $('#code-in').addEventListener('input', (e) => { e.target.value = cleanCode(e.target.value); });

  /* ---------- Gemerkter Raum: überlebt ein Neuladen der Seite ("Wieder in Raum ABCD einsteigen?") ---------- */
  const RC = VD_CONFIG.reconnect;
  const SKEY = 'vd.session';
  const sess = {
    get() {
      try {
        const s = JSON.parse(localStorage.getItem(SKEY) || 'null');
        if (!s || typeof s !== 'object' || !/^[A-Z]{4}$/.test(s.code) || !/^[a-z0-9]{6,24}$/.test(s.pid) || !(Date.now() - Number(s.ts) < RC.sessionHours * 3600e3)) return null;
        return s;
      } catch { return null; }
    },
    set(o) { try { localStorage.setItem(SKEY, JSON.stringify(Object.assign({ ts: Date.now() }, o))); } catch { /* ignore */ } },
    clear() { try { localStorage.removeItem(SKEY); } catch { /* ignore */ } }
  };

  /* ---------- Beitritt ---------- */
  let joinCode = '';
  let avatar = VD.store.get('emoji', VD.AVATARS[Math.floor(Math.random() * VD.AVATARS.length)]);

  function showJoin(code) {
    joinCode = code;
    show('join');
    $('#join-code').textContent = code;
    $('#name-in').maxLength = (window.VD_CONFIG.limits && window.VD_CONFIG.limits.maxNameLength) || 14;
    $('#name-in').value = VD.store.get('name', '');
    $('#insecure').hidden = window.isSecureContext;
    $('#btn-join').disabled = !window.isSecureContext;
    const pick = $('#avatar-pick');
    pick.replaceChildren(...VD.AVATARS.map((a) => VD.h('button', { type: 'button', role: 'radio', 'aria-checked': String(a === avatar), class: 'av-opt' + (a === avatar ? ' on' : ''), 'aria-label': VD.t('Symbol {a}', { a }), onclick: (e) => {
      avatar = a; VD.$$('.av-opt', pick).forEach((b) => { b.classList.remove('on'); b.setAttribute('aria-checked', 'false'); });
      e.currentTarget.classList.add('on'); e.currentTarget.setAttribute('aria-checked', 'true'); VD.vibrate(8);
    } }, a)));
    renderResume(code);
    setTimeout(() => $('#name-in').focus(), 50);
  }
  /* Hat dieses Gerät schon in diesem Raum mitgespielt (Seite neu geladen)? Dann Wiedereinstieg mit derselben Spieler-ID anbieten. */
  function renderResume(code) {
    const box = $('#resume-box'); if (!box) return;
    const s = sess.get();
    if (!s || s.code !== code) { box.hidden = true; box.replaceChildren(); return; }
    box.hidden = false;
    box.replaceChildren(
      VD.h('p', { text: VD.t('Wieder in Raum {code} einsteigen?', { code }) }),
      VD.h('button', { class: 'btn primary xl', type: 'button', onclick: () => {
        $('#name-in').value = s.name || $('#name-in').value;
        if (VD.AVATARS.includes(s.emoji)) avatar = s.emoji;
        try { sessionStorage.setItem('vd.pid', s.pid); } catch { /* ignore */ }
        doJoin(true);
      } }, VD.t('Wieder einsteigen')),
      VD.h('button', { class: 'btn link', type: 'button', onclick: () => { sess.clear(); VD.TakeStore.clear(code); renderResume(code); } }, VD.t('Neu beginnen')));
  }
  $('#btn-join-back').addEventListener('click', () => { history.replaceState(null, '', location.pathname); show('home'); });
  $('#profile-form').addEventListener('submit', (e) => { e.preventDefault(); doJoin(); });

  function joinError(msg) { const el = $('#join-err'); el.textContent = msg; el.hidden = !msg; }

  async function doJoin(resuming) {
    const name = $('#name-in').value.trim();
    if (!name) { $('#name-in').focus(); return; }
    joinError('');
    const btn = $('#btn-join');
    btn.disabled = true;
    btn.classList.add('busy');
    VD.store.set('name', name); VD.store.set('emoji', avatar);
    try {
      await VD.audio.ensure();
      const mic = new VD.Mic();
      try { await mic.start(); }
      catch (err) {
        const denied = err && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
        const none = err && err.name === 'NotFoundError';
        joinError(denied ? VD.t('Der Zugriff aufs Mikrofon wurde blockiert. Erlaube ihn in den Browser-Einstellungen für diese Seite und versuche es nochmal.')
          : none ? VD.t('Es wurde kein Mikrofon gefunden.') : VD.t('Das Mikrofon lässt sich nicht starten: {e}', { e: err.message || err.name }));
        throw err;
      }
      const profile = { pid: getPid(), name, emoji: avatar, color: VD.store.get('color', VD.COLORS[Math.floor(Math.random() * VD.COLORS.length)]) };
      const net = new VD.ClientNet();
      let link;
      try { link = await net.connect(joinCode); }
      catch (err) { joinError(VD.friendlyNetError(err)); mic.stop(); throw err; }

      show('player');
      document.body.classList.add('is-player');
      sess.set({ code: joinCode, pid: profile.pid, name: profile.name, emoji: profile.emoji, color: profile.color });
      if (!resuming) VD.TakeStore.clear(joinCode);   // neuer Einstieg: alte Aufnahmen dieses Raums gelten nicht mehr
      let kicked = false;
      const st = { net, link };
      const leaveAll = () => { sess.clear(); VD.TakeStore.clear(joinCode); };
      const ctrl = new VD.Controller($('#v-player'), {
        mic, profile, room: joinCode,
        onKicked: (msg) => { kicked = true; leaveAll(); ctrl.destroy(); try { st.net.close(); } catch { /* ignore */ } mic.stop(); showEnded(msg); },
        onLeave: () => { kicked = true; leaveAll(); ctrl.destroy(); mic.stop(); setTimeout(() => { try { st.net.close(); } catch { /* ignore */ } location.href = location.pathname; }, 250); }
      });
      window.__ctrl = ctrl;   // für die Fehlersuche in der Browser-Konsole
      ctrl.attach(link);
      keepAlive(st, ctrl, () => kicked);
    } catch (err) {
      console.warn('Beitritt fehlgeschlagen', err);
    } finally {
      btn.classList.remove('busy');
      btn.disabled = !window.isSecureContext;
    }
  }

  /* Bei Verbindungsabbruch automatisch neu verbinden (gleiche Spieler-ID und Raum-Code -> Aufnahmen und Zuteilung bleiben).
     Abstände: 1, 2, 4, 8 s, dann alle 10 s (config.js, reconnect); nach 5 Minuten "Erneut versuchen".
     Beim Zurückkehren in den Vordergrund (iPhone: Verbindungen schlafen im Hintergrund ein) wird sofort geprüft. */
  function keepAlive(st, ctrl, isKicked) {
    let busy = false, wake = null, since = 0;
    const wait = (ms) => new Promise((res) => { const t = setTimeout(res, ms); wake = () => { clearTimeout(t); res(); }; });
    const onClose = () => { if (!isKicked()) loop(); };
    async function loop() {
      if (busy || isKicked()) return;
      busy = true; since = Date.now();
      let n = 0, hostGone = false;
      ctrl.setOffline('retry', loop);
      while (!isKicked()) {
        if (Date.now() - since > RC.giveUpMs) { ctrl.setOffline('failed', loop); busy = false; return; }
        await wait(n < RC.stepsMs.length ? RC.stepsMs[n] : RC.everyMs); n++;
        if (isKicked()) break;
        try {
          try { st.net.close(); } catch { /* ignore */ }
          const n2 = new VD.ClientNet();
          const l2 = await n2.connect(joinCode);   // räumt bei einem Fehler selbst auf
          if (isKicked()) { n2.close(); break; }
          st.net = n2; st.link = l2;
          l2.on('close', onClose);
          ctrl.attach(l2);
          busy = false; return;
        } catch (e) {
          hostGone = !!(e && (e.type === 'peer-unavailable' || e.hostSilent));   // Raum gibt es (noch) nicht oder niemand antwortet
          ctrl.setOffline(hostGone ? 'host' : 'retry', loop);
        }
      }
      busy = false;
    }
    /* Zurück im Vordergrund / wieder online: sofort prüfen */
    function check() {
      if (isKicked() || document.hidden) return;
      if (busy) { if (wake) wake(); return; }
      const link = st.link;
      if (!link || !link.open) { loop(); return; }
      const t0 = Date.now();
      link.send({ t: 'ping', ts: t0 });
      setTimeout(() => { if (st.link === link && link.open && link.lastSeen < t0) link.close(); }, RC.pongWaitMs);   // keine Antwort: Verbindung ist tot
      ctrl.checkMic();
    }
    st.link.on('close', onClose);
    document.addEventListener('visibilitychange', check);
    window.addEventListener('pageshow', check);
    window.addEventListener('online', check);
    window.addEventListener('offline', () => { if (!isKicked() && !busy && st.link && st.link.open) st.link.close(); });
  }

  function showEnded(msg) {
    sess.clear(); VD.TakeStore.clear();
    if (VD.music) VD.music.where('home');
    const root = $('#v-player');
    root.replaceChildren(VD.h('main', { class: 'pc-body' }, VD.h('section', { class: 'pc-view center view-in' },
      VD.h('h2', { text: VD.t('Raus aus dem Raum') }), VD.h('p', { class: 'lead', text: msg }),
      VD.h('button', { class: 'btn primary big', onclick: () => { location.href = location.pathname; } }, VD.t('Zur Startseite')))));
  }

  /* ---------- App-Installation und Offline-Start (siehe sw.js, manifest.webmanifest) ---------- */
  const standalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  const installRow = $('#install-row'), installBtn = $('#btn-install'), installIos = $('#install-ios');
  let installEvt = null;
  const syncInstall = () => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const showBtn = !!installEvt && !standalone();
    const showIos = !installEvt && ios && !standalone();
    if (installBtn) installBtn.hidden = !showBtn;
    if (installIos) installIos.hidden = !showIos;
    if (installRow) installRow.hidden = !(showBtn || showIos);
  };
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; syncInstall(); });   // Chrome, Edge, Android
  window.addEventListener('appinstalled', () => { installEvt = null; syncInstall(); });
  if (installBtn) installBtn.addEventListener('click', async () => {
    if (!installEvt) return;
    const ev = installEvt; installEvt = null; syncInstall();
    try { ev.prompt(); await ev.userChoice; } catch { /* ignore */ }
  });
  syncInstall();

  /* Hinweis "Neue Version verfügbar": nie automatisch neu laden (mitten in einer Runde wäre das fatal) */
  function showUpdateBar(reg) {
    if (VD.$('#upd-bar')) return;
    const bar = VD.h('div', { id: 'upd-bar', class: 'toast upd-bar', role: 'status' },
      VD.h('span', { text: VD.t('Neue Version verfügbar') + ' – ' }),
      VD.h('button', { class: 'btn link', type: 'button', onclick: () => {
        let done = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => { if (!done) { done = true; location.reload(); } });
        if (reg.waiting) reg.waiting.postMessage('SKIP_WAITING'); else location.reload();
      } }, VD.t('Neu laden')));
    document.body.append(bar);
  }
  const swOk = 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1');
  if (swOk) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').then((reg) => {
        const watch = (w) => w && w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) showUpdateBar(reg); });
        if (reg.waiting && navigator.serviceWorker.controller) showUpdateBar(reg);
        reg.addEventListener('updatefound', () => watch(reg.installing));
        document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
      }).catch(() => { /* leise ignorieren */ });
    });
  }

  /* ---------- Start ---------- */
  window.addEventListener('error', (e) => console.error(e.error || e.message));
  window.addEventListener('beforeunload', (e) => {
    if (window.__host && window.__host.state === 'playing') { e.preventDefault(); e.returnValue = ''; }
  });

  const room = cleanCode(params.get('room'));
  const saved = sess.get();
  if (room.length === 4) showJoin(room);
  else if (saved) showJoin(saved.code);   // Seite wurde neu geladen: "Wieder in Raum ABCD einsteigen?"
  else show('home');
  // Jetzt ist alles übersetzt: Inhalt zeigen (zwei Bilder später, damit Größenänderungen durch die Übersetzung schon neu gezeichnet sind)
  requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.remove('booting')));
})();
