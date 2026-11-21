/* Gemeinsame Pack-Vorschau, Seite des Handys: Der Host zeigt in der Lobby die Vorschau eines Packs und alle verbundenen Geräte
   sehen und hören sie gleichzeitig. Das Handy hat keine eigene Steuerung, es folgt dem Host (Start, Pause, Springen, Ende).
   Nachrichten vom Host: pv_start, pv_end, pv_play, pv_pause, pv_close; Daten: pvimg, pvmix, pvvideo (siehe Host.pvBegin in js/host.js).
   Alles wird geprüft, bevor es benutzt wird. Eigener Zustand (this.pv), unabhängig von Szene, Aufnahmen und Spielphase.
   Wer zum Start kein Video hat, bekommt die einfache Fassung (Ton, Text, Standbilder) bis zum Ende der Vorschau. */
(function () {
  const VD = (window.VD = window.VD || {});
  const h = VD.h;
  const LIM = window.VD_CONFIG.limits;
  const fmt = (s) => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
  const num = (v, a, b) => (typeof v === 'number' && isFinite(v) ? Math.min(b, Math.max(a, v)) : null);
  const rate = (sr, d) => (Number.isInteger(sr) && sr >= 8000 && sr <= 96000 ? sr : d);

  VD.PvClient = class {
    constructor(ctl) { this.ctl = ctl; this.pv = null; }

    msg(m) {
      if (!m || typeof m.id !== 'string') return;
      if (m.t === 'pv_start') { this.start(m); return; }
      const pv = this.pv;
      if (!pv || m.id !== pv.id) return;
      if (m.t === 'pv_end') {
        pv.end = true; this.dog(120000);
        this.ctl.send({ t: 'pv_ready', id: pv.id, video: !!pv.videoUrl });
        if (!pv.playing && !pv.mode) this.say(VD.t('Gleich geht es los …'));
      } else if (m.t === 'pv_play') {
        const pos = num(m.pos, 0, pv.dur), inMs = num(m.in, 200, 10000);
        if (pos == null || inMs == null) return;
        this.dog(Math.max(60000, (pv.dur - pos) * 1000 + 30000));
        this.play(pos, inMs);
      } else if (m.t === 'pv_pause') {
        const pos = num(m.pos, 0, pv.dur);
        if (pos == null) return;
        this.dog(15 * 60 * 1000);
        this.stopPlay(); pv.pos = pos; this.render();
      } else if (m.t === 'pv_close') this.close();
    }

    /* ---------- Start: nur in der Lobby, nie am Host-Gerät ---------- */
    start(m) {
      const c = this.ctl;
      if (c.local || c.phase !== 'lobby') return;
      const id = str(m.id, 40), dur = num(m.dur, 1, 7200);
      if (!id || dur == null || !Array.isArray(m.lines)) return;
      const lines = [];
      for (const l of m.lines.slice(0, LIM.maxClipsPerPack)) {
        if (!l || !Number.isInteger(l.i) || l.i < 0) continue;
        const ts = num(l.ts, 0, 7200), ld = num(l.dur, 0, 600);
        if (ts == null || ld == null) continue;
        lines.push({ i: l.i, caption: str(l.caption, 500), char: str(l.char, 60), ts, dur: ld });
      }
      this.close();
      const vsize = Number.isInteger(m.videoSize) && m.videoSize > 0 && m.videoSize <= LIM.maxBlobBytes ? m.videoSize : 0;
      const pv = this.pv = {
        id, title: str(m.title, 120), dur, lines, vsize, mime: str(m.videoMime, 100), vkey: str(m.videoKey, 200),
        stills: new Map(), urls: [], mix: null, videoUrl: null, video: null, end: false, mode: null, pos: 0, playing: false, token: 0,
        raf: 0, handle: null, sync: null, dogT: 0, audioFrom: 0, audioT0: 0
      };
      this.build();
      this.dog(120000);
      if (VD.music) VD.music.hold('pv-share', true);   // Lobby-Musik schweigt, solange die Vorschau läuft
      this.caps(pv);
    }
    /* Kann dieses Gerät das Video abspielen, und liegt es schon im Zwischenspeicher (vcache.js)? Dann muss es nicht übertragen werden. */
    async caps(pv) {
      let can = false, hit = null;
      try {
        can = pv.vsize > 0 && (await VD.Video.ready(pv.mime));
        if (this.pv !== pv) return;
        if (can && pv.vkey) hit = await VD.VideoCache.get(pv.vkey);
      } catch { /* ohne Video weiter */ }
      if (this.pv !== pv) return;
      if (hit) pv.videoUrl = URL.createObjectURL(new Blob([hit.bytes], { type: hit.mime || 'video/ogg' }));
      this.ctl.send({ t: 'pv_caps', id: pv.id, video: can, cached: !!hit });
    }

    blob(kind, meta, bytes) {
      meta = meta && typeof meta === 'object' ? meta : {};
      const pv = this.pv, mine = !!pv && meta.pv === pv.id;
      if (kind === 'pvvideo') {
        // Auch nach dem Ende der Vorschau für den Zwischenspeicher behalten: In der echten Runde wird es dann nicht noch einmal geschickt
        const key = str(meta.key, 200), mime = str(meta.mime, 100) || 'video/ogg';
        if (key && bytes.length) VD.VideoCache.put(key, mime, bytes);
        if (mine && !pv.videoUrl && pv.mode !== 'simple') pv.videoUrl = URL.createObjectURL(new Blob([bytes], { type: mime }));
        return;
      }
      if (!mine) return;
      if (kind === 'pvimg') {
        if (!Number.isInteger(meta.i) || !pv.lines.some((l) => l.i === meta.i)) return;
        const u = URL.createObjectURL(new Blob([bytes], { type: str(meta.mime, 40) || 'image/png' }));
        pv.urls.push(u); pv.stills.set(meta.i, u);
        if (!pv.playing) this.render();
      } else if (kind === 'pvmix') {
        const sr = rate(meta.sr, 16000);
        if (bytes.byteLength < 2 || bytes.byteLength % 2 || bytes.byteLength / 2 > pv.dur * sr * 1.5 + sr) return;   // passt nicht zur Länge der Szene
        try {
          const i16 = new Int16Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
          pv.mix = VD.audio.fromFloat(VD.i16ToF32(i16), sr);
        } catch (e) { console.warn('Vorschau-Ton', e); }
      }
    }

    /* ---------- Anzeige ---------- */
    build() {
      this.still = h('img', { class: 'dp-still', alt: '', hidden: true });
      this.subChar = h('b', { class: 'pv-char' }); this.subText = h('span');
      this.sub = h('div', { class: 'dp-sub pv-sub' }, this.subChar, this.subText);
      this.screen = h('div', { class: 'dp-screen pv-screen' }, this.still, this.sub);
      this.status = h('p', { class: 'muted pv-status', role: 'status', 'aria-live': 'polite', text: VD.t('Lade Vorschau …') });
      this.fill = h('i', { class: 'pv-fill' });
      this.track = h('div', { class: 'pv-track', role: 'progressbar', style: { cursor: 'default' }, 'aria-label': VD.t('Position'), 'aria-valuemin': '0', 'aria-valuemax': String(Math.round(this.pv.dur)), 'aria-valuenow': '0' }, this.fill);
      this.time = h('span', { class: 'pv-time', text: '0:00 / ' + fmt(this.pv.dur) });
      this.box = h('div', { class: 'modal pv-modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'pvc-t' },
        h('div', { class: 'modal-card pv-card' },
          h('h2', { id: 'pvc-t', text: VD.t('Vorschau vom Host') + ': ' + this.pv.title }),
          this.screen, this.status, h('div', { class: 'pv-ctl' }, this.track, this.time)));
      document.body.append(this.box);
    }
    say(t) { if (this.status) { this.status.hidden = !t; this.status.textContent = t || ''; } }
    lineAt(t) {
      for (const l of this.pv.lines) if (t >= l.ts - 0.05 && t < l.ts + l.dur + 0.35) return l;
      return null;
    }
    render() {
      const pv = this.pv; if (!pv || !this.box) return;
      this.fill.style.transform = `scaleX(${pv.dur ? Math.min(1, pv.pos / pv.dur) : 0})`;
      this.time.textContent = fmt(pv.pos) + ' / ' + fmt(pv.dur);
      this.track.setAttribute('aria-valuenow', String(Math.round(pv.pos)));
      const l = this.lineAt(pv.pos);
      this.sub.classList.toggle('on', !!l);
      if (l) { this.subChar.textContent = l.char.toUpperCase() + ' '; this.subText.textContent = l.caption; }
      if (!pv.video || pv.video.hidden) {   // Standbild: zuletzt begonnene Zeile mit Bild, sonst das erste vorhandene
        let pick = null;
        for (const x of pv.lines) if (pv.stills.has(x.i) && x.ts - 0.5 <= pv.pos) pick = x;
        if (!pick) pick = pv.lines.find((x) => pv.stills.has(x.i)) || null;
        const u = pick ? pv.stills.get(pick.i) : '';
        if (u && this.still.getAttribute('src') !== u) this.still.src = u;
        this.still.hidden = !u || (!!pv.video && !pv.video.hidden);
      }
    }

    /* ---------- Abspielen ---------- */
    play(pos, inMs) {
      const pv = this.pv; if (!pv) return;
      this.stopPlay();
      pv.pos = pos; this.render();
      if (!pv.mix) { this.say(VD.t('Die Vorschau läuft beim Host.')); return; }   // Ton ist nicht angekommen: nur zuschauen
      // Einmal festlegen und bis zum Ende behalten: kein Wechsel mitten in der Vorschau
      if (!pv.mode) pv.mode = pv.end && pv.videoUrl ? 'full' : 'simple';
      if (pv.mode === 'simple' && pv.videoUrl) { URL.revokeObjectURL(pv.videoUrl); pv.videoUrl = null; }
      this.say(VD.t('Gleich geht es los …'));
      this.run(pv, pv.token, pos, inMs);
    }
    async run(pv, my, pos, inMs) {
      try { await VD.audio.ensure(); } catch { /* weiter */ }
      const ok = () => this.pv === pv && pv.token === my;
      if (!ok()) return;
      const ctx = VD.audio.ctx;
      const mk = (off, delay) => {
        pv.audioFrom = pos + off; pv.audioT0 = ctx.currentTime + delay;
        return (pv.handle = VD.audio.play(pv.mix, { gain: 0.95, delay, offset: Math.min(pv.audioFrom, pv.mix.duration - 0.01) }));
      };
      if (pv.mode === 'full' && pv.videoUrl) {
        try {
          if (!pv.video) {
            pv.video = VD.Video.create(pv.videoUrl, pv.mime, 'dp-video'); pv.video.hidden = true;
            this.screen.insertBefore(pv.video, this.sub);
            pv.video.addEventListener('loadedmetadata', () => { const w = pv.video && pv.video.videoWidth, hh = pv.video && pv.video.videoHeight; if (w && hh) this.screen.style.setProperty('--ar', String(w / hh)); });
          }
          const sync = await VD.Video.syncPlay(pv.video, pos, mk, { inMs });
          if (!ok()) { sync.stop(); return; }
          pv.sync = sync;
          VD.Video.frameReady(pv.video, sync.vt0).then(() => { if (ok() && pv.video) { pv.video.hidden = false; this.still.hidden = true; } });
        } catch (e) { console.warn('Vorschau-Video startet nicht', e); }
      }
      if (!ok()) return;
      if (!pv.handle) mk(0, Math.max(0.02, inMs / 1000));
      pv.playing = true;
      const tick = () => {
        if (!ok()) return;
        pv.pos = Math.min(pv.dur, pv.audioFrom + Math.max(0, ctx.currentTime - pv.audioT0));
        this.render();
        if (pv.pos >= pv.dur - 0.02) { this.stopPlay(); pv.pos = pv.dur; this.render(); this.say(''); return; }
        pv.raf = requestAnimationFrame(tick);
      };
      this.say('');
      pv.raf = requestAnimationFrame(tick);
    }
    stopPlay() {
      const pv = this.pv; if (!pv) return;
      pv.token++; pv.playing = false; cancelAnimationFrame(pv.raf);
      if (pv.sync) { try { pv.sync.stop(); } catch { /* ignore */ } pv.sync = null; }
      if (pv.handle) { try { pv.handle.stop(); } catch { /* ignore */ } pv.handle = null; }
      if (pv.video) { try { pv.video.pause(); } catch { /* ignore */ } }
    }

    /* Falls der Host nichts mehr schickt (Absturz, Verbindung weg): nach einer Weile von selbst schließen */
    dog(ms) { const pv = this.pv; if (!pv) return; clearTimeout(pv.dogT); pv.dogT = setTimeout(() => { if (this.pv === pv) this.close(); }, ms); }

    /* Alles freigeben: Zeitgeber, Ton, Video, Objekt-URLs, Anzeige, Musik */
    close() {
      const pv = this.pv; if (!pv) return;
      this.stopPlay();
      this.pv = null;
      clearTimeout(pv.dogT);
      if (pv.video) { VD.Video.dispose(pv.video); pv.video = null; }
      pv.urls.forEach((u) => URL.revokeObjectURL(u)); pv.urls.length = 0;
      if (pv.videoUrl) { URL.revokeObjectURL(pv.videoUrl); pv.videoUrl = null; }
      if (this.box) { this.box.remove(); this.box = null; }
      if (VD.music) VD.music.hold('pv-share', false);
    }
  };
})();
