/* Pack-Vorschau (Host-Lobby): Originalszene mit Video, Originalton, Hintergrundmusik und Untertiteln ansehen.
   Ändert weder die Pack-Auswahl noch sonst etwas im Spiel. Ton: Scene.build (dekodiert einmal pro Pack, WeakMap-Cache),
   Video: VD.Video (stumm, der Ton kommt aus VD.audio). Ohne abspielbares Video: Standbilder der Zeilen. */
(function () {
  const VD = (window.VD = window.VD || {});
  const h = VD.h;
  const bufCache = new WeakMap();    // pro Pack: fertige AudioBuffer (Zeilen mit 16 kHz wie im Spiel, Hintergrund 24 kHz)

  const fmt = (s) => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  /* ctl: der Host (VD.Host) in der Lobby. Mit ihm läuft die Vorschau gleichzeitig auf allen verbundenen Handys (siehe Host.pvBegin);
     ohne ctl oder ohne verbundene Handys nur auf diesem Bildschirm. */
  function open(pack, ctl) {
    if (document.querySelector('.pv-modal') || (ctl && ctl.pv)) return;
    const V = VD.Video;
    let disposed = false, playing = false, loaded = false, pos = 0, total = 0, token = 0, raf = 0;
    let scene = null, bufs = null, video = null, sync = null, handles = [], audioFrom = 0, audioT0 = 0;
    let pvs = null, shared = false, pvStarted = false, timedOut = false, hintT = 0;   // gemeinsame Vorschau: Sitzung, aktiv?, schon gestartet?, Wartezeit um?
    const urls = [], stills = new Map();

    /* ---------- Oberfläche ---------- */
    const still = h('img', { class: 'dp-still', alt: '', hidden: true });
    const subChar = h('b', { class: 'pv-char' });
    const subText = h('span');
    const sub = h('div', { class: 'dp-sub pv-sub' }, subChar, subText);
    const screen = h('div', { class: 'dp-screen pv-screen' }, still, sub);
    const status = h('p', { class: 'muted pv-status', role: 'status', 'aria-live': 'polite', text: VD.t('Lade Vorschau …') });
    const fill = h('i', { class: 'pv-fill' });
    const track = h('div', { class: 'pv-track', role: 'slider', tabindex: '0', 'aria-label': VD.t('Position'), 'aria-valuemin': '0', 'aria-valuemax': '0', 'aria-valuenow': '0' }, fill);
    const time = h('span', { class: 'pv-time', text: '0:00' });
    const playBtn = h('button', { class: 'btn primary sm pv-play', type: 'button', disabled: true, onclick: () => toggle() }, '▶ ' + VD.t('Abspielen'));
    const playLabel = () => '▶ ' + (shared && !pvStarted ? VD.t('Jetzt starten') : VD.t('Abspielen'));
    const soloBtn = h('button', { class: 'btn solo sm', type: 'button', hidden: true, title: VD.t('Die anderen Spieler sehen davon nichts'), onclick: () => goSolo() }, VD.t('Nur auf meinem Bildschirm ansehen'));
    /* Lautstärke der Vorschau (pro Gerät gespeichert, Standard 100 %) */
    let pvVol = Math.min(1, Math.max(0, Number(VD.store.get('pvvol', 1)))); if (!Number.isFinite(pvVol)) pvVol = 1;
    let master = null;
    const pct = h('b', { class: 'set-pct', text: Math.round(pvVol * 100) + ' %' });
    const vol = h('input', { type: 'range', class: 'set-range pv-vol', min: '0', max: '100', step: '1', value: String(Math.round(pvVol * 100)), 'aria-label': VD.t('Lautstärke'), oninput: () => {
      pvVol = Number(vol.value) / 100; pct.textContent = vol.value + ' %'; VD.store.set('pvvol', pvVol);
      if (master) master.gain.value = pvVol;
    } });
    const volRow = h('label', { class: 'pv-volrow' }, h('span', { class: 'field-l' }, VD.t('Lautstärke') + ' ', pct), vol);
    const ccBtn = VD.ui.subsBtn();
    const optRow = h('div', { class: 'pv-opts' }, volRow, ccBtn);
    const offSubs = VD.subsWatch(() => { if (!disposed) render(); });   // Umlegen wirkt sofort, auch bei Pause
    const closeBtn = h('button', { class: 'btn', type: 'button', onclick: () => close() }, VD.t('Schließen'));
    const box = h('div', { class: 'modal pv-modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'pv-t', onclick: (e) => { if (e.target === box) close(); } },
      h('div', { class: 'modal-card pv-card' },
        h('h2', { id: 'pv-t', text: VD.t('Vorschau') + ': ' + pack.name }),
        screen, status,
        h('div', { class: 'pv-ctl' }, playBtn, track, time), optRow,
        h('div', { class: 'modal-btns' }, soloBtn, closeBtn)));

    /* ---------- Anzeige ---------- */
    const lineAt = (t) => { // Zeile, die gerade gesprochen wird (oder null)
      if (!bufs) return null;
      for (const l of bufs.lines) if (t >= l.ts - 0.05 && t < l.ts + l.dur + 0.35) return l;
      return null;
    };
    function stillFor(t) { // Standbild: zuletzt begonnene Zeile, sonst die erste
      if (!bufs || !bufs.lines.length) return null;
      let pick = bufs.lines[0];
      for (const l of bufs.lines) if (l.ts - 0.5 <= t) pick = l;
      return stills.get(pick.idx) || null;
    }
    function render() {
      const f = total ? Math.min(1, pos / total) : 0;
      fill.style.transform = `scaleX(${f})`;
      time.textContent = fmt(pos) + ' / ' + fmt(total);
      track.setAttribute('aria-valuenow', String(Math.round(pos)));
      const l = lineAt(pos);
      const showSub = !!l && VD.subsOn();
      sub.classList.toggle('on', showSub);
      if (showSub) { subChar.textContent = (l.char || '').toUpperCase() + ' '; subText.textContent = l.caption || ''; }
      if (!video || video.hidden) {
        const u = stillFor(pos);
        if (u && still.getAttribute('src') !== u) still.src = u;
        still.hidden = !u || (!!video && !video.hidden);
      }
    }
    const tick = () => {
      if (disposed || !playing) return;
      const ctx = VD.audio.ctx;
      pos = Math.min(total, audioFrom + Math.max(0, ctx.currentTime - audioT0));
      render();
      if (pos >= total - 0.02) { pause(); pos = total; render(); return; }
      raf = requestAnimationFrame(tick);
    };

    /* ---------- Ton ---------- */
    function startAudio(from, delay) {
      const ctx = VD.audio.ctx;
      stopAudio();
      if (!master) { master = ctx.createGain(); master.connect(ctx.destination); }
      master.gain.value = pvVol;
      const add = (buf, ts, gain) => {
        const rel = ts - from;
        if (rel + buf.duration <= 0.01) return;
        handles.push(VD.audio.play(buf, { gain, dest: master, delay: rel > 0 ? delay + rel : delay, offset: rel < 0 ? -rel : 0 }));
      };
      if (bufs.back) add(bufs.back, 0, 0.6);
      bufs.lines.forEach((l) => add(l.buf, l.ts, 0.95));
      const t0 = ctx.currentTime + delay;
      return { stop: stopAudio, elapsed: () => Math.max(0, ctx.currentTime - t0) };
    }
    function stopAudio() { handles.forEach((x) => { try { x.stop(); } catch { /* ignore */ } }); handles = []; }

    /* ---------- Steuerung ---------- */
    async function play() {
      if (!loaded || disposed || playing) return;
      if (pos >= total - 0.05) pos = 0;
      playing = true; playBtn.textContent = '❚❚ ' + VD.t('Pause');
      const my = ++token;
      let inMs = null;
      if (shared && ctl && ctl.pv) { inMs = ctl.pvPlay(pos); pvStarted = true; status.hidden = false; status.textContent = VD.t('Gleich geht es los …'); clearTimeout(hintT); hintT = setTimeout(() => { if (pvStarted) status.hidden = true; }, inMs + 400); }
      try { await VD.audio.ensure(); } catch { /* ignore */ }
      const ctx = VD.audio.ctx;
      let started = false;
      if (video) {
        try {
          const from = pos;
          sync = await V.syncPlay(video, from, (off, delay) => { audioFrom = from + off; audioT0 = ctx.currentTime + delay; return startAudio(audioFrom, delay); }, inMs != null ? { inMs } : {});
          if (my !== token || disposed) { sync.stop(); return; }
          started = true;
          V.frameReady(video, sync.vt0).then(() => { if (my === token && !disposed) { video.hidden = false; still.hidden = true; } });
        } catch (e) { console.warn('Vorschau-Video startet nicht', e); }
      }
      if (my !== token || disposed) return;
      if (!started) { const d = inMs != null ? Math.max(0.03, inMs / 1000) : 0.03; audioFrom = pos; audioT0 = ctx.currentTime + d; startAudio(pos, d); }
      cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
    }
    function pause() {
      token++;
      if (playing) { const ctx = VD.audio.ctx; if (ctx) pos = Math.min(total, audioFrom + Math.max(0, ctx.currentTime - audioT0)); }
      playing = false; cancelAnimationFrame(raf);
      if (sync) { sync.stop(); sync = null; }
      stopAudio();
      if (video) { try { video.pause(); } catch { /* ignore */ } }
      playBtn.textContent = playLabel();
      if (shared && ctl && ctl.pv) ctl.pvPause(pos);   // alle Handys halten an derselben Stelle an
      render();
    }
    const toggle = () => (playing ? pause() : play());
    async function seek(t) {
      if (!loaded) return;
      const was = playing;
      if (was) pause();
      pos = Math.max(0, Math.min(total, t));
      if (!was && shared && ctl && ctl.pv) ctl.pvPause(pos);   // Fortschrittsbalken der Handys mitführen
      render();
      if (video && !video.hidden) { await V.seek(video, pos); }
      if (was && !disposed) play();
    }
    const fromEvent = (e) => { const r = track.getBoundingClientRect(); return ((e.clientX - r.left) / Math.max(1, r.width)) * total; };
    track.addEventListener('pointerdown', (e) => {
      if (!loaded) return;
      e.preventDefault(); track.setPointerCapture && track.setPointerCapture(e.pointerId);
      seek(fromEvent(e));
      const mv = (ev) => { if (!playing) { pos = Math.max(0, Math.min(total, fromEvent(ev))); render(); } };
      const up = (ev) => { track.removeEventListener('pointermove', mv); track.removeEventListener('pointerup', up); track.removeEventListener('pointercancel', up); if (!playing) seek(fromEvent(ev)); };
      track.addEventListener('pointermove', mv); track.addEventListener('pointerup', up); track.addEventListener('pointercancel', up);
    });
    track.addEventListener('keydown', (e) => {
      const step = e.key === 'ArrowLeft' ? -5 : e.key === 'ArrowRight' ? 5 : 0;
      if (step) { e.preventDefault(); seek(pos + step); }
    });
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
      else if (e.key === ' ' && document.activeElement === document.body) { e.preventDefault(); toggle(); }
    };
    const onVis = () => { if (document.hidden && playing) pause(); };

    /* ---------- Gemeinsame Vorschau ---------- */
    function sharedInfo() {
      if (!shared || disposed) return;
      const st = ctl.pvStatus();
      if (!st) { shared = false; soloBtn.hidden = true; return; }
      if (!pvStarted) { status.hidden = false; status.textContent = VD.t('Vorschau wird geladen: {r} von {n} bereit', { r: st.ready, n: st.total }); }
      autoStart(st);
    }
    function autoStart(st) {
      if (!shared || pvStarted || !loaded || disposed || playing) return;
      st = st || ctl.pvStatus();
      if (st && ((st.total > 0 && st.ready >= st.total) || timedOut)) play();   // alle bereit oder Wartezeit um
    }
    function goSolo() {
      if (!pvs || !ctl || ctl.pv !== pvs) return;
      if (playing) pause();
      ctl.pvClose(); pvs = null; shared = false; soloBtn.hidden = true;
      clearTimeout(hintT);
      status.hidden = loaded; if (!loaded) status.textContent = VD.t('Lade Vorschau …');
      playBtn.textContent = playing ? playBtn.textContent : playLabel();
    }

    function close() {
      if (disposed) return;
      disposed = true; token++; offSubs(); try { if (master) master.disconnect(); } catch { /* ignore */ }
      clearTimeout(hintT);
      if (pvs && ctl && ctl.pv === pvs) ctl.pvClose();   // alle Handys beenden die Vorschau
      pvs = null; shared = false;
      cancelAnimationFrame(raf);
      if (sync) { try { sync.stop(); } catch { /* ignore */ } }
      stopAudio();
      if (video) { V.dispose(video); video = null; }
      urls.forEach((u) => URL.revokeObjectURL(u)); urls.length = 0;
      still.removeAttribute('src');
      document.removeEventListener('keydown', onKey, true); document.removeEventListener('visibilitychange', onVis);
      box.remove();
      if (VD.music) VD.music.hold('preview', false);
    }

    document.addEventListener('keydown', onKey, true); document.addEventListener('visibilitychange', onVis);
    if (VD.music) VD.music.hold('preview', true);      // Lobby-Musik schweigt, solange die Vorschau offen ist
    document.body.append(box);
    closeBtn.focus();

    /* ---------- Laden (Ton aus dem Cache von Scene.build, Video nur wenn abspielbar) ---------- */
    (async () => {
      try {
        await VD.audio.ensure();
        scene = await VD.Scene.build(pack, (t) => { if (!disposed) status.textContent = t; });
        if (disposed) return;
        if (ctl && ctl.pvBegin) {   // Handys bekommen Bilder, Ton und Video, während es hier weiterlädt
          pvs = ctl.pvBegin(pack, scene, { change: () => sharedInfo(), timeout: () => { timedOut = true; autoStart(); }, abort: () => close() });
          shared = !!pvs; soloBtn.hidden = !shared;
          if (shared) { status.textContent = VD.t('Vorschau wird geladen: {r} von {n} bereit', { r: 0, n: ctl.pvStatus().total }); }
        }
        bufs = bufCache.get(pack);
        if (!bufs) {
          bufs = { lines: scene.lines.map((l) => ({ idx: l.idx, ts: l.ts, dur: l.dur, caption: l.caption, char: l.char, buf: VD.audio.fromFloat(l.v16, 16000) })), back: scene.back24 ? VD.audio.fromFloat(scene.back24, 24000) : null };
          bufCache.set(pack, bufs);
        }
        total = scene.dur;
        scene.lines.forEach((l) => { if (l.imgBlob) { const u = URL.createObjectURL(l.imgBlob); urls.push(u); stills.set(l.idx, u); } });
        const mime = (pack.video && pack.video.type) || 'video/ogg';
        if (pack.video && (await V.ready(mime)) && !disposed) {
          const vu = URL.createObjectURL(pack.video); urls.push(vu);
          video = V.create(vu, mime, 'dp-video'); video.hidden = true;
          screen.insertBefore(video, sub);
          const apply = () => { const w = video && video.videoWidth, hh = video && video.videoHeight; if (w && hh) screen.style.setProperty('--ar', String(w / hh)); return !!(w && hh); };
          video.addEventListener('loadedmetadata', apply);
        }
        track.setAttribute('aria-valuemax', String(Math.round(total)));
        loaded = true;
        status.hidden = shared && !pvStarted ? false : true;
        playBtn.disabled = false;
        playBtn.textContent = playLabel();
        render();
        playBtn.focus();
        sharedInfo();
      } catch (e) {
        console.error(e);
        if (pvs && ctl && ctl.pv === pvs) { ctl.pvClose(); }
        pvs = null; shared = false; soloBtn.hidden = true;
        if (!disposed) status.textContent = VD.t('Vorschau nicht möglich');
      }
    })();
  }

  VD.PackPreview = { open };
})();
