/* Hintergrundmusik: Startseite, Beitritt, Lobby (Host und Spieler). Nie im Spiel (load, play, final), nie im Dub-Pack-Ersteller.
   Quellen: Dateien aus VD_CONFIG.music.tracks (zufällige Reihenfolge, Überblenden) oder, wenn keine da sind oder keine lädt,
   die selbst erzeugte Musik "Dub Groove" (Web Audio, keine Dateien, keine Lizenzfragen).
   Die Musik hat einen eigenen Ausgang (Bus) und landet nie im Mikrofon-Mix oder im Export. VD.sfx.enabled ist unabhängig.
   Steuerung von außen: VD.music.where(key) mit 'home' | 'join' | 'lobby' | 'game' | 'off', VD.music.hold(key, bool). */
(function () {
  const VD = (window.VD = window.VD || {});
  const CFG = Object.assign({ enabled: true, volume: 0.25, fadeSec: 1.2, crossfadeSec: 2, folder: 'audio/music/', tracks: [] }, (window.VD_CONFIG || {}).music);
  const M = (VD.music = {});
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  let on = VD.store.get('music', true) !== false;
  // Gespeicherte Lautstärke: nur eine echte Zahl zählt, alles andere (leer, Text, kaputt) fällt auf den leisen Standard
  const safeVol = (v) => (typeof v === 'number' && v >= 0 && v <= 1 ? v : clamp(Number(CFG.volume) || 0.25, 0, 1));
  let vol = safeVol(VD.store.get('musicvol', CFG.volume));
  let started = false;                 // erst nach der ersten Bedienung (Browser-Regel)
  let where = 'home';
  const holds = new Set();
  let bus = null, engine = null, offTimer = 0, fileFailed = false;
  const listeners = [];

  M._state = () => ({ started, where, holds: [...holds], engine: engine && engine.kind, gain: bus ? bus.gain.value : null, fileFailed });   // für Tests
  M.isOn = () => on;
  M.volume = () => vol;
  M.onChange = (fn) => listeners.push(fn);
  const changed = () => listeners.forEach((f) => { try { f(); } catch { /* ignore */ } });

  const contextOk = () => CFG.enabled && (where === 'home' || where === 'join' || where === 'lobby');
  const wanted = () => on && started && contextOk() && !holds.size && !document.hidden;

  /* ---------- Bausteine (T/N/hz aus audio.js, Ziel = Musik-Bus) ---------- */
  const T = (f0, f1, d, type, g, w) => VD.sfx.T(f0, f1, d, type, g, Math.max(0, w || 0), bus);
  const N = (d, g, w, hp, lp) => VD.sfx.N(d, g, Math.max(0, w || 0), hp, lp, bus);
  const hz = VD.sfx.hz;

  /* ---------- Erzeugte Musik: Dub Groove, 75 bpm, 16tel-Raster ---------- */
  const BASS = [33, 0, 0, 33, 0, 0, 36, 0, 0, 0, 31, 0, 0, 36, 0, 0];
  const step = (i, t, sd) => {
    const p = BASS[i % 16];
    if (p) T(hz(p + 12), hz(p + 12), sd * 2.5, 'sine', 0.5, t);
    if (i % 8 === 0) T(120, 40, 0.3, 'sine', 0.6, t);
    if (i % 8 === 4) N(0.12, 0.25, t, 1500, 8000);
    if (i % 4 === 2) [57, 60, 64].forEach((m) => T(hz(m), hz(m), sd * 1.2, 'square', 0.035, t));
  };
  function genEngine() {
    const ctx = VD.audio.ctx, sd = 60 / 75 / 4;
    let i = 0, next = ctx.currentTime + 0.15, timer = setInterval(() => {
      while (next < ctx.currentTime + 0.2) { step(i % 16, next - ctx.currentTime, sd); i++; next += sd; }
    }, 25);
    return { kind: 'gen', stop() { clearInterval(timer); timer = 0; } };
  }

  /* ---------- Dateien ---------- */
  const decoded = new Map();
  async function loadTrack(tr) {
    if (decoded.has(tr.file)) return decoded.get(tr.file);
    const res = await fetch(CFG.folder + encodeURIComponent(tr.file).replace(/%2F/g, '/'));
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const buf = await VD.audio.decode(await res.arrayBuffer());
    decoded.set(tr.file, buf);
    return buf;
  }
  function fileEngine(tracks) {
    const ctx = VD.audio.ctx, X = Math.max(0.2, CFG.crossfadeSec);
    let alive = true, timer = 0, order = [], cur = null;
    const shuffle = () => { order = tracks.slice().sort(() => Math.random() - 0.5); };
    const playNext = async () => {
      if (!alive) return;
      if (!order.length) { shuffle(); if (cur && order.length > 1 && order[0] === cur.tr) order.push(order.shift()); }
      const tr = order.shift();
      let buf;
      try { buf = await loadTrack(tr); } catch (e) {
        console.warn('Musik: Datei lädt nicht', tr.file, e);
        if (!alive) return;
        if (!cur) { fileFailed = true; eng.stop(); engine = genEngine(); }    // gar nichts spielbar: erzeugte Musik
        else timer = setTimeout(playNext, 4000);
        return;
      }
      if (!alive) return;
      const src = ctx.createBufferSource(), g = ctx.createGain(), t = ctx.currentTime;
      src.buffer = buf; src.loop = tracks.length === 1;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(1, t + X);
      src.connect(g).connect(bus); src.start(t);
      const prev = cur; cur = { src, g, tr };
      if (prev) { prev.g.gain.cancelScheduledValues(t); prev.g.gain.setValueAtTime(prev.g.gain.value, t); prev.g.gain.linearRampToValueAtTime(0.0001, t + X); setTimeout(() => { try { prev.src.stop(); } catch { /* ignore */ } }, X * 1000 + 100); }
      if (tracks.length > 1) timer = setTimeout(playNext, Math.max(1000, (buf.duration - X) * 1000));
    };
    const eng = { kind: 'file', stop() { alive = false; clearTimeout(timer); if (cur) { try { cur.src.stop(); } catch { /* ignore */ } } cur = null; } };
    playNext();
    return eng;
  }

  /* ---------- Ein-/Ausblenden ---------- */
  function ensureBus() {
    const ctx = VD.audio.ctx;
    if (!ctx) return false;
    if (!bus || bus.context !== ctx) { bus = ctx.createGain(); bus.gain.value = 0; bus.connect(ctx.destination); }
    return true;
  }
  function update(quick) {
    if (!started || !VD.audio.ctx || !ensureBus()) return;
    const ctx = VD.audio.ctx, fade = Math.max(0.1, CFG.fadeSec);
    if (wanted()) {
      clearTimeout(offTimer);
      if (ctx.state !== 'running') { ctx.resume && ctx.resume().catch(() => {}); }
      const fresh = !engine;
      if (fresh) {
        const tracks = fileFailed ? [] : (CFG.tracks || []).filter((t) => t && t.file);
        engine = tracks.length ? fileEngine(tracks) : genEngine();
      }
      bus.gain.cancelScheduledValues(ctx.currentTime);
      if (fresh) bus.gain.setValueAtTime(0, ctx.currentTime);   // jeder Start beginnt bei null und blendet ein
      bus.gain.setTargetAtTime(vol, ctx.currentTime, quick === true ? 0.04 : fade / 3);   // Regler: kurze Glättung, sonst Einblendung
    } else if (engine) {
      bus.gain.cancelScheduledValues(ctx.currentTime);
      bus.gain.setTargetAtTime(0, ctx.currentTime, fade / 3);
      clearTimeout(offTimer);
      offTimer = setTimeout(() => { if (!wanted() && engine) { engine.stop(); engine = null; } }, fade * 1000 + 300);   // danach spart das CPU
    }
  }

  /* ---------- Steuerung ---------- */
  M.where = (key) => { if (where !== key) { where = key; update(); } };
  M.hold = (key, yes) => { if (yes) holds.add(key); else holds.delete(key); update(); };
  M.toggle = () => { on = !on; VD.store.set('music', on); update(); changed(); };
  M.setVolume = (v) => { vol = clamp(Number(v) || 0, 0, 1); VD.store.set('musicvol', vol); update(true); changed(); };

  document.addEventListener('visibilitychange', update);
  const first = () => {
    if (started) return;
    started = true;
    ['pointerdown', 'keydown', 'touchstart'].forEach((e) => document.removeEventListener(e, first, true));
    Promise.resolve(VD.audio.ensure()).then(update).catch(() => {});     // vorher keine Töne und keine Fehlermeldungen
  };
  ['pointerdown', 'keydown', 'touchstart'].forEach((e) => document.addEventListener(e, first, { capture: true, passive: true }));
})();
