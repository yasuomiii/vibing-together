/* Host: Spielablauf und Spielerverwaltung.
   Die Ansichten (DOM) liegen in hostviews.js und werden in den Prototyp gemischt. */
(function () {
  const VD = (window.VD = window.VD || {});
  const A = window.VDA;
  const CFG = window.VD_CONFIG;
  const SR = A.SR;
  const END = { end: true };
  const Scene = VD.Scene;

  const DEFAULTS = { assign: 'random', wishes: true, effects: true };
  // Für Spieler ohne Zeilen in dieser Runde (mehr Spieler als Zeilen oder Szene nicht geladen).
  // Texte, die an Handys gehen, bleiben deutsch: Jedes Gerät übersetzt sie selbst in seine Sprache (VD.t).
  const LOAD_FAILED = { spectate: true, title: 'Diesmal schaust du zu', text: 'Die Szene ließ sich nicht auf dein Gerät laden. In der nächsten Runde bist du wieder dabei.' };
  const WATCH = { spectate: true, title: 'Diesmal schaust du zu', text: 'In dieser Runde ist keine Zeile für dich dabei. Hier siehst du, wie weit die anderen sind.' };

  VD.Host = class {
    constructor(root) {
      this.root = root;
      this.players = new Map();
      this.banned = new Set();
      this.settings = Object.assign({}, DEFAULTS, VD.store.get('settings', {}));
      this.state = 'lobby';      // lobby | playing | final
      this.phase = 'lobby';
      this.lastPhase = { t: 'phase', phase: 'lobby' };
      this.pending = null;
    }

    /* ---------- Start / Netzwerk ---------- */
    async start() {
      this.buildFrame();
      this.showStage('boot', () => VD.h('div', { class: 'boot center' }, VD.h('span', { class: 'spinner big' }), VD.h('p', { class: 'lead', text: VD.t('Raum wird erstellt …') })));
      await VD.audio.ensure();
      await VD.Packs.init();
      this.net = new VD.HostNet();
      try {
        this.code = await this.net.open();
      } catch (e) {
        this.code = null;
        VD.toast(VD.t('Kein Online-Raum möglich: {e} Du kannst trotzdem allein auf diesem Gerät spielen.', { e: VD.friendlyNetError(e) }), 'warn');
      }
      if (this.net) {
        this.net.on('hello', (link, m) => this.onHello(link, m));
        this.net.on('error', (e) => console.warn('peer', e));
      }
      VD.Packs.on('change', () => this.onPacksChanged());
      this.updateRoomChip();
      document.addEventListener('keydown', (e) => this.onKey(e));
      VD.wake.on();
      this.gotoLobby();
    }

    onKey(e) {
      if (/^(input|textarea|select|button|a)$/i.test(e.target.tagName || '')) return;
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      // „Weiter“ / „Jetzt ansehen“ mit P (die Leertaste drückt man zu leicht aus Versehen)
      if ((e.key || '').toLowerCase() === 'p' && this.state === 'playing') { e.preventDefault(); this.hostNext(); }
    }

    /* ---------- Spieler ---------- */
    list() { return Array.from(this.players.values()); }
    connected() { return this.list().filter((p) => p.connected); }

    onHello(link, m) {
      const L = CFG.limits;
      const pid = String(m.pid || '');
      if (!/^[a-z0-9]{6,24}$/.test(pid)) { link.send({ t: 'reject', reason: 'Ungültige Spieler-ID.' }); link.close(); return; }
      if (this.banned.has(pid)) { link.send({ t: 'reject', reason: 'Du wurdest aus diesem Raum entfernt.' }); link.close(); return; }
      let p = this.players.get(pid);
      if (!p) {
        if (this.players.size >= L.maxPlayers) { link.send({ t: 'reject', reason: 'Der Raum ist voll.' }); link.close(); return; }
        const used = new Set(this.list().map((x) => x.color));
        const want = VD.COLORS.includes(m.color) && !used.has(m.color) ? m.color : VD.COLORS.find((c) => !used.has(c)) || VD.COLORS[0];
        p = { pid, pub: VD.uid(), color: want, ready: false, isLocal: false };   // pid ist geheim (nur dieses Gerät und der Host), pub geht an die anderen
        this.players.set(pid, p);
        p.active = this.state === 'lobby' || this.state === 'final';
        VD.sfx.play('join');
      } else if (p.link && p.link !== link) { try { p.link.close(); } catch { /* ignore */ } }
      // Namen: keine Steuer-, unsichtbaren und Richtungs-Zeichen, höchstens 4 Akzentzeichen in Folge (sonst sprengt es das Layout)
      p.name = Array.from(String(m.name || '').replace(/[\u0000-\u001f\u007f-\u009f<>\u00ad\u061c\u115f\u1160\u17b4\u17b5\u180e\u200b\u200e\u200f\u2028-\u202e\u2060-\u2064\u2066-\u206f\u2800\u3164\ufeff\uffa0\ufff9-\ufffc]/g, '').replace(/[\u{e0000}-\u{e007f}]/gu, '').replace(/(\p{M}{4})\p{M}+/gu, '$1').replace(/\s+/g, ' ').trim()).slice(0, L.maxNameLength).join('').trim() || VD.t('Spieler');
      p.emoji = VD.AVATARS.includes(m.emoji) ? m.emoji : '🎤';
      p.canRecord = !!m.canRecord;
      p.link = link; p.connected = true; p.lvl = 0; p.skipped = false;
      if (this.pv) this.pvMemberLost(p);   // eine neue Verbindung ist nie Teil einer laufenden Vorschau
      p.helloScene = m.sceneId || null;
      link.on('msg', (msg) => this.onPlayerMsg(p, msg));
      link.on('blob', (k, meta, bytes) => this.onPlayerBlob(p, k, meta, bytes));
      link.on('close', () => { if (p.link === link) { p.connected = false; if (this.pv) this.pvMemberLost(p); this.onRosterChanged(); this.progress(); if (this.updatePlay) this.updatePlay(); } });
      const snap = p.active ? this.lastPhase : this.lateJoinPhase();
      link.send({ t: 'welcome', pub: p.pub, color: p.color, snap: snap.phase === 'lobby' || (p.assign && p.active && this.state === 'playing') ? null : snap });
      if (this.state === 'lobby') link.send({ t: 'phase', phase: 'lobby' });
      this.onRosterChanged();
      if (this.updatePlay) this.updatePlay();
      p.helloMix = !!m.hasMix;
      if (this.state === 'playing' && this.phase === 'final' && this.finalCtx && this.finalCtx.scene === this.scene && p.helloScene === this.scene.id && !m.hasMix && !p.isLocal && (p.assign ? p.loaded : p.watchLoaded)) {
        // Verbindung riss beim Laden des Ergebnisses ab: den fertigen Ton noch einmal schicken
        p.link.sendBlob('mix', { sr: SR }, this.finalCtx.bytes).then(() => { if (this.phase === 'final' && p.connected) p.link.send(this.lastPhase); }).catch(() => {});
      }
      if (this.state === 'playing' && this.scene && p.active && p.assign && p.helloScene !== this.scene.id) this.sendScene(p);   // auch während des Ladens: die alte Übertragung ist mit der Verbindung abgebrochen
      else if (this.state === 'playing' && this.scene && p.active && p.assign && p.helloScene === this.scene.id) this.sendProgress();
      else if (this.state === 'playing' && !p.assign) {
        // Zuschauer (später beigetreten oder ohne Zeile): sieht den Fortschritt und bekommt Video + Ergebnis zum Mitschauen
        if (!this.scene || p.helloScene !== this.scene.id) p.watchSent = null;
        this.sendWatch(p);
        this.sendProgress();
      }
    }

    onPlayerMsg(p, m) {
      switch (m.t) {
        case 'ready': p.ready = !!m.on; this.onRosterChanged(); break;
        case 'lvl': p.lvl = VD.clamp(Number(m.v) || 0, 0, 1); break;
        case 'caps':
          if (this.scene && p.assign && !p.assetsSent) { p.assetsSent = true; this.sendAssets(p, !!m.video, !!m.cached); }
          else if (this.scene && !p.assign && p.watchSent === this.scene.id && !p.assetsSent) { p.assetsSent = true; this.sendWatchAssets(p, !!m.video, !!m.cached); }
          break;
        case 'loaded': if (this.scene && p.assign && (!m.id || m.id === this.scene.id) && !p.loaded) { p.loaded = true; this.lateLoaded(p); this.progress(); this.refreshStrip(); } break;
        case 'prog':
          if (p.assign) {
            p.prog = { cur: VD.clamp(Math.round(Number(m.cur) || 1), 1, p.assign.lineIdx.length || 1), st: ['idle', 'rec', 'done'].includes(m.st) ? m.st : 'idle' };
            this.sendProgress(); this.refreshStrip(); if (this.updatePlay) this.updatePlay();
          }
          break;
        case 'done': if (this.phase === 'play' && p.assign) { p.wantDone = true; this.checkDone(p); } break;
        case 'undone': if (p.assign) { p.wantDone = false; p.done = false; this.sendProgress(); this.refreshStrip(); if (this.updatePlay) this.updatePlay(); } break;
        case 'pv_caps': this.pvOnCaps(p, m); break;
        case 'pv_ready': this.pvOnReady(p, m); break;
        case 'leave': this.removePlayer(p, false); break;
        case 'wish': {
          // Wunschrolle aus der Lobby; gilt nur für Charaktere des gewählten Packs
          const pk = VD.Packs.current();
          p.wish = typeof m.c === 'string' && pk && pk.chars.includes(m.c) ? m.c : null;
          this.onRosterChanged();
          break;
        }
        default: break;
      }
    }

    /* Eine Aufnahme ist nur gültig, wenn die Zeile zu den Charakteren des Spielers gehört */
    onPlayerBlob(p, kind, meta, bytes) {
      if (kind !== 'take' || !p.active || !p.assign || (this.phase !== 'play' && this.phase !== 'load')) return;
      const i = Number(meta.i);
      if (!Number.isInteger(i) || !p.assign.lineIdx.includes(i)) return;
      if (bytes.byteLength % 2 || bytes.byteLength > CFG.limits.maxTakeBytes) return;
      if (!bytes.byteLength) return;
      const i16 = new Int16Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
      let raw = VD.i16ToF32(i16);
      // Eine Aufnahme darf nicht weit über ihre Zeile hinausragen und nicht lauter sein als eine normale (sonst übertönt sie das Ergebnis)
      const ln = this.scene && this.scene.lines[i];
      if (ln) { const max = Math.ceil((ln.s1 - ln.s0 + 3) * SR); if (raw.length > max) raw = raw.slice(0, max); }
      let pk = 0, en = 0;
      for (let k = 0; k < raw.length; k++) { const a = Math.abs(raw[k]); if (a > pk) pk = a; en += a * a; }
      const rms = Math.sqrt(en / raw.length);
      const g = Math.min(1, pk > 0.98 ? 0.98 / pk : 1, rms > 0.3 ? 0.3 / rms : 1);
      if (g < 1) for (let k = 0; k < raw.length; k++) raw[k] *= g;
      p.takes.set(i, { raw, at: Date.now() });
      this.checkDone(p);
    }
    checkDone(p) {
      const full = p.assign && p.assign.lineIdx.every((i) => p.takes.has(i));
      const was = p.done;
      p.done = !!(p.wantDone && full);
      if (p.done !== was) { VD.sfx.play('submit'); this.sendProgress(); this.refreshStrip(); if (this.updatePlay) this.updatePlay(); this.progress(); }
    }

    /* Host: nicht länger auf einen Spieler warten, der gerade weg ist. Seine bisherigen Takes bleiben im Ergebnis. */
    skipAway(p) { if (!p || p.connected) return; p.skipped = true; this.progress(); if (this.updatePlay) this.updatePlay(); }

    removePlayer(p, ban) {
      if (ban) { this.banned.add(p.pid); try { p.link.send({ t: 'kicked' }); } catch { /* ignore */ } }
      try { p.link && p.link.close(); } catch { /* ignore */ }
      if (p.isLocal) this.removeLocalPlayer(true);
      this.players.delete(p.pid);
      this.onRosterChanged(); this.progress();
    }

    /* Wunschrollen gelten nur bei "Zufällig" und nur wenn der Schalter an ist */
    wishOn() { return this.settings.assign === 'random' && this.settings.wishes !== false; }

    /* Stimmeffekte erlauben (Schalter in der Lobby); aus = Spieler sehen keine Auswahl und es wird nichts angewendet */
    fxOn() { return this.settings.effects !== false; }

    onRosterChanged() {
      const pk = VD.Packs.current();
      const chars = pk ? pk.chars.map((c) => ({ n: c, k: pk.lines.filter((l) => l.char === c).length })) : [];
      const msg = { t: 'lobby', chars, wishOn: this.wishOn(), fxOn: this.fxOn(), players: this.list().map((p) => ({ pid: p.pub, name: p.name, emoji: p.emoji, color: p.color, ready: !!p.ready, connected: p.connected, wish: p.wish || null })) };
      this.list().forEach((p) => p.connected && p.link.send(msg));
      this.refreshStrip();
      if (this.state === 'lobby') this.renderLobbyPlayers();
    }

    /* Ein Spieler mit Zeilen ist erst nach dem Start der Aufnahme fertig geladen (langsames Handy, neu verbunden):
       Er steigt jetzt ein, statt zuzuschauen. */
    lateLoaded(p) {
      if (this.state !== 'playing' || !p.connected) return;
      if (this.phase === 'play') { p.link.send({ t: 'phase', phase: 'play' }); this.sendProgress(); if (this.playCards && !this.playCards.has(p.pid)) this.viewPlay(this.scene); else if (this.updatePlay) this.updatePlay(); }
      else if (this.phase === 'final' && this.finalCtx && this.finalCtx.scene === this.scene) {
        p.link.sendBlob('mix', { sr: SR }, this.finalCtx.bytes).then(() => { if (this.phase === 'final' && p.connected) p.link.send(this.lastPhase); }).catch(() => {});
      }
    }

    /* Wer während einer Runde beitritt, sieht den Fortschritt der anderen und spielt ab der nächsten Runde mit */
    lateJoinPhase() {
      if (this.phase === 'final') return this.lastPhase;   // Ergebnis schauen alle gemeinsam an
      return { t: 'phase', phase: 'wait', spectate: true, title: 'Gleich bist du dabei', text: 'Gerade läuft eine Runde. Wenn alle fertig sind, schaust du dir das Ergebnis mit an. In der nächsten Runde spielst du dann mit.' };
    }

    bcast(msg, filter) { this.list().forEach((p) => { if (p.connected && (!filter || filter(p))) p.link.send(msg); }); }
    setPhase(phase, extra, perPlayer) {
      this.phase = phase;
      this.lastPhase = Object.assign({ t: 'phase', phase }, extra);
      this.list().forEach((p) => {
        if (!p.connected) return;
        if (p.active) p.link.send(perPlayer ? Object.assign({}, this.lastPhase, perPlayer(p)) : this.lastPhase);
        else if (this.state === 'playing') p.link.send(this.lateJoinPhase());
      });
      this.refreshStrip();
      this.updateBar();
    }

    /* ---------- Lokaler Mitspieler (Mikro dieses Geräts) ---------- */
    async addLocalPlayer() {
      if (this.local || this._localBusy) return;
      this._localBusy = true;
      const mic = new VD.Mic();
      try { await mic.start(); } catch (e) { this._localBusy = false; VD.toast(VD.t('Kein Mikrofonzugriff: {e}', { e: e.message === 'insecure' ? VD.t('Seite braucht HTTPS oder localhost.') : VD.t('Bitte erlauben.') }), 'warn'); return; }
      const profile = { pid: VD.store.get('hostPid', null) || VD.uid().replace(/[^a-z0-9]/g, 'x'), name: VD.store.get('hostName', 'Host'), emoji: '🎤', color: VD.COLORS[5] };
      VD.store.set('hostPid', profile.pid);
      const dock = VD.h('aside', { class: 'local-dock' });
      const head = VD.h('button', { class: 'dock-head', onclick: () => dock.classList.toggle('min') }, VD.h('span', { text: VD.t('Du spielst mit (dieses Gerät)') }), VD.h('i', { text: '–' }));
      const inner = VD.h('div', { class: 'pc-root dock-body' });
      dock.append(head, inner);
      this.root.append(dock);
      document.body.classList.add('has-dock');
      const pair = VD.localPair();
      const ctrl = new VD.Controller(inner, { mic, profile, local: true, onKicked: () => this.removeLocalPlayer(true), onAttention: () => dock.classList.remove('min'), onBig: (on, key) => { dock.classList.toggle('big', on); if (on) dock.classList.remove('min'); else if (key === 'final') dock.classList.add('min'); if (!on && this.strip) this.stripLoop(); } });
      
      this.local = { mic, ctrl, dock, pair, profile };
      this._localBusy = false;
      ctrl.attach(pair.client);
      this.onHello(pair.host, { t: 'hello', pid: profile.pid, name: profile.name, emoji: profile.emoji, color: profile.color, canRecord: true });
      const p = this.players.get(profile.pid);
      if (p) p.isLocal = true;
      this.renderLobbyPlayers();
      this.updateLobbySummary && this.updateLobbySummary();
    }
    removeLocalPlayer(fromPlayer) {
      if (!this.local) return;
      const { mic, ctrl, dock, pair, profile } = this.local;
      this.local = null;
      try { ctrl.destroy(); mic.stop(); pair.client.close(); } catch { /* ignore */ }
      dock.remove();
      document.body.classList.remove('has-dock');
      const p = this.players.get(profile.pid);
      if (p && !fromPlayer) this.players.delete(p.pid);
      this.onRosterChanged();
      this.updateLobbySummary && this.updateLobbySummary();
    }

    /* Raum schließen und zur Startseite: alle Spieler erfahren es, danach wird neu geladen */
    closeRoom() {
      this.pvAbort();
      this.bcast({ t: 'closed' });
      this.removeLocalPlayer(true);
      setTimeout(() => { try { this.net && this.net.close(); } catch { /* ignore */ } location.href = location.pathname; }, 350);
    }

    /* ---------- Einstellungen ---------- */
    setSetting(k, v) { this.settings[k] = v; VD.store.set('settings', this.settings); }

    /* ---------- Host-Steuerung ---------- */
    hostNext() { if (this.gate) { this.gate.open('next'); VD.sfx.play('click'); } else this.pending = 'next'; }
    hostEnd() { if (this.state !== 'playing') return; if (this.gate) this.gate.open('end'); else this.pending = 'end'; }

    progress() { if (this.checkFn) this.checkFn(); }

    async waitPhase(o) {
      const gate = (this.gate = new VD.Gate());
      this.checkFn = o.check || null;
      const t0 = Date.now();
      if (this.pending) { const r = this.pending; this.pending = null; if (r !== 'next' || o.allowNext !== false) gate.open(r); }
      else if (o.check) o.check();
      while (!gate.done) {
        const lim = o.deadline ? o.deadline() : t0 + o.ms;
        const now = Date.now();
        if (now >= lim) { gate.open('timeout'); break; }
        await gate.wait(Math.min(200, lim - now));
        if (o.onTick) o.onTick(Date.now() - t0);
      }
      this.gate = null; this.checkFn = null;
      const r = gate.value;
      if (r === 'end') throw END;
      return r;
    }

    /* wartet, bis ein Gate geöffnet wird (z. B. Audio zu Ende) – Host kann mit "Weiter" abbrechen */
    async waitUntil(gate) {
      const r = await this.waitPhase({ deadline: () => (gate.done ? 0 : Infinity), check: () => {} });
      return r;
    }

    /* ---------- Spiel ---------- */
    async startGame() {
      // Ein zweiter Klick, während noch auf das Mikrofon gewartet wird, darf kein zweites Spiel starten
      if (this._starting || this.state !== 'lobby') return;
      const pack = VD.Packs.current();
      if (!pack) { VD.toast(VD.t('Lade zuerst ein Dub-Pack in die Lobby.'), 'warn'); return; }
      let recs;
      this._starting = true;
      try {
        // Der Host spielt automatisch mit, außer er hat sich selbst entfernt
        if (!this.local && !this._optOut) await this.addLocalPlayer();
        recs = this.list().filter((p) => p.connected && p.canRecord);
        if (!recs.length) { VD.toast(VD.t('Mindestens ein Spieler mit Mikrofon wird gebraucht.'), 'warn'); return; }
        await VD.audio.ensure();
      } finally { this._starting = false; }
      if (this.state !== 'lobby') return;
      this.pvAbort();   // eine laufende Vorschau endet überall, bevor die Runde beginnt
      this.state = 'playing'; this.pending = null;
      this.list().forEach((p) => { p.active = p.connected; p.skipped = false; p.ready = false; p.assign = null; p.takes = new Map(); p.done = false; p.wantDone = false; p.loaded = false; p.loadFailed = false; p.assetsSent = false; p.prog = null; p.watchSent = null; p.watchLoaded = false; p.hasMix = false; });
      this.onRosterChanged();
      try {
        await this.playScene(pack, recs);
      } catch (e) {
        if (e !== END) { console.error(e); VD.toast(VD.t('Fehler im Spielablauf: {e}', { e: e && e.message }), 'warn'); }
      }
      this.stopAudio();
      this.backToLobby();
    }

    stopAudio() {
      if (this.curPlay) { this.curPlay.stop(); this.curPlay = null; }
      if (this.fvideo) { try { this.fvideo.pause(); } catch { /* ignore */ } }
    }

    /* Szenen-Info an einen Spieler; die Medien folgen, sobald sein Gerät sagt, was es abspielen kann */
    sendScene(p) {
      const sc = this.scene;
      p.loaded = false; p.loadFailed = false; p.assetsSent = false;
      p.link.send({
        t: 'scene', id: sc.id, title: sc.title, author: sc.author, chars: p.assign.chars,
        videoMime: Scene.videoMime(sc.pack), videoSize: sc.pack.video.size, videoKey: sc.pack.id + ':' + sc.pack.video.size,
        lines: p.assign.lineIdx.map((i) => { const l = sc.lines[i]; return { i, caption: l.caption, char: l.char, ts: l.ts, s0: l.s0, s1: l.s1, hasImg: !!l.imgBlob, pk: l._pk || (l._pk = Scene.peaks(l, 160)) }; })
      });
      this.setPlayerPhase(p, { t: 'phase', phase: 'load' });
    }
    setPlayerPhase(p, msg) { if (p.connected) p.link.send(msg); }

    async sendAssets(p, video, cached) {
      const sc = this.scene;
      try {
        for (const i of p.assign.lineIdx) {
          const l = sc.lines[i];
          if (l.imgBlob) await p.link.sendBlob('img', { i, mime: l.imgBlob.type || 'image/png' }, l._img || (l._img = new Uint8Array(await l.imgBlob.arrayBuffer())));
          await p.link.sendBlob('orig', { i, sr: 16000 }, l._orig || (l._orig = Scene.origBytes(sc, l)));
        }
        if (video && !cached && sc.pack.video.size <= CFG.limits.maxBlobBytes) await p.link.sendBlob('video', { mime: sc.pack.video.type || Scene.videoMime(sc.pack) }, await this.videoBytes(sc));
        p.link.send({ t: 'assets_end', video: !!video && sc.pack.video.size <= CFG.limits.maxBlobBytes });
      } catch (e) {
        // Nicht 90 s auf das Gerät warten: Es schaut diese Runde zu
        console.warn('Medien senden', e);
        p.loadFailed = true;
        VD.toast(VD.t('Die Szene konnte nicht an {name} geschickt werden. {name} schaut diese Runde zu.', { name: p.name }), 'warn');
        this.progress(); if (this.updateLoad) this.updateLoad();
      }
    }

    /* Zuschauer bekommen nur, was sie zum Mitschauen brauchen: Szenen-Infos ohne Zeilen, ein Standbild, das Video und
       (sobald es fertig ist) den Ton des Ergebnisses. Startet schon während der Aufnahme, damit das Video rechtzeitig da ist. */
    sendWatch(p) {
      const sc = this.scene;
      if (!sc || p.assign || p.isLocal || !p.connected || p.watchSent === sc.id) return;
      p.watchSent = sc.id; p.assetsSent = false; p.watchLoaded = false; p.hasMix = false;
      p.link.send({ t: 'scene', watch: true, id: sc.id, title: sc.title, author: sc.author, chars: [], lines: [],
        videoMime: Scene.videoMime(sc.pack), videoSize: sc.pack.video.size, videoKey: sc.pack.id + ':' + sc.pack.video.size });
    }
    async sendWatchAssets(p, video, cached) {
      const sc = this.scene;
      try {
        const still = sc.lines.find((l) => l.imgBlob);
        if (still) await p.link.sendBlob('img', { i: still.idx, still: true, mime: still.imgBlob.type || 'image/png' }, still._img || (still._img = new Uint8Array(await still.imgBlob.arrayBuffer())));
        const withVideo = !!video && sc.pack.video.size <= CFG.limits.maxBlobBytes;
        if (withVideo && !cached) await p.link.sendBlob('video', { mime: sc.pack.video.type || Scene.videoMime(sc.pack) }, await this.videoBytes(sc));
        if (this.scene !== sc) return;
        // Ist das Ergebnis schon fertig, kommt der Ton gleich mit; sonst schickt finalPhase ihn später
        const fc = this.finalCtx && this.finalCtx.scene === sc ? this.finalCtx : null;
        if (!fc) p.watchLoaded = true;
        else { await p.link.sendBlob('mix', { sr: SR }, fc.bytes); p.hasMix = true; p.watchLoaded = true; }
        p.link.send({ t: 'assets_end', video: withVideo });
      } catch (e) { console.warn('Medien für Zuschauer', e); }
    }

    /* ---------- Gemeinsame Pack-Vorschau (nur in der Lobby) ----------
       Eigener Zustand this.pv, unabhängig von Spielzustand, Zuteilung, Aufnahmen und Pack-Auswahl. Die Anzeige beim Host steht in
       js/preview.js, die Anzeige am Handy in js/pvclient.js. ui: { change(), timeout(), abort() } der Host-Anzeige. */
    pvBegin(pack, scene, ui) {
      if (this.pv || this.state !== 'lobby') return null;
      const members = new Map();
      this.list().forEach((p) => { if (p.connected && !p.isLocal && p.link) members.set(p.pid, { p, link: p.link, caps: false, ready: false }); });
      if (!members.size) return null;
      const bytes = new Uint8Array(VD.f32ToI16(Scene.previewMix(scene)).buffer);
      if (bytes.length > CFG.limits.maxBlobBytes) return null;   // zu lang zum Verschicken: nur auf diesem Bildschirm
      const vsize = pack.video && pack.video.size <= CFG.limits.maxBlobBytes ? pack.video.size : 0;
      const cur = VD.Packs.current();
      const pv = this.pv = { id: VD.uid(), pack, scene, bytes, vsize, members, ui, curId: cur ? cur.id : null, timer: 0 };
      members.forEach((mb) => mb.link.send({
        t: 'pv_start', id: pv.id, title: pack.name, dur: scene.dur, videoMime: Scene.videoMime(pack), videoSize: vsize, videoKey: pack.id + ':' + (pack.video ? pack.video.size : 0),
        lines: scene.lines.map((l) => ({ i: l.idx, caption: l.caption, char: l.char, ts: l.ts, dur: l.dur, hasImg: !!l.imgBlob }))
      }));
      pv.timer = setTimeout(() => { if (this.pv === pv && ui && ui.timeout) ui.timeout(); }, CFG.game.previewWaitMs);
      return pv;
    }
    pvStatus() { const pv = this.pv; if (!pv) return null; let ready = 0; pv.members.forEach((m) => { if (m.ready) ready++; }); return { ready, total: pv.members.size }; }
    pvChanged() { const pv = this.pv; if (pv && pv.ui && pv.ui.change) pv.ui.change(); }
    pvMemberLost(p) { const pv = this.pv; if (pv && pv.members.delete(p.pid)) this.pvChanged(); }
    pvOnCaps(p, m) {
      const pv = this.pv, mb = pv && pv.members.get(p.pid);
      if (!mb || mb.link !== p.link || m.id !== pv.id || mb.caps) return;
      mb.caps = true;
      this.pvSend(pv, mb, m.video === true && pv.vsize > 0, m.cached === true);
    }
    pvOnReady(p, m) {
      const pv = this.pv, mb = pv && pv.members.get(p.pid);
      if (!mb || mb.link !== p.link || m.id !== pv.id || !mb.caps || mb.ready) return;
      mb.ready = true; this.pvChanged();
    }
    /* Bilder, Ton und (falls nötig) das Video an ein Handy. Das Video geht über dieselbe Übertragung und denselben Zwischenspeicher am
       Handy (Schlüssel wie beim Spielstart), so wird es in der echten Runde nicht noch einmal geschickt. */
    async pvSend(pv, mb, video, cached) {
      const p = mb.p, link = mb.link, sc = pv.scene;
      const alive = () => this.pv === pv && pv.members.get(p.pid) === mb && p.connected && p.link === link;
      try {
        for (const l of sc.lines) {
          if (!l.imgBlob) continue;
          if (!alive()) return;
          await link.sendBlob('pvimg', { pv: pv.id, i: l.idx, mime: l.imgBlob.type || 'image/png' }, l._img || (l._img = new Uint8Array(await l.imgBlob.arrayBuffer())));
        }
        if (!alive()) return;
        await link.sendBlob('pvmix', { pv: pv.id, sr: 16000 }, pv.bytes);
        if (video && !cached) {
          if (!alive()) return;
          await link.sendBlob('pvvideo', { pv: pv.id, mime: pv.pack.video.type || Scene.videoMime(pv.pack), key: pv.pack.id + ':' + pv.pack.video.size }, await this.videoBytes(sc));
        }
        if (!alive()) return;
        link.send({ t: 'pv_end', id: pv.id });
      } catch (e) { console.warn('Vorschau senden', e); this.pvMemberLost(p); }
    }
    /* Gemeinsamer Start: jeder bekommt „in X ms“ abzüglich seiner halben Laufzeit (wie bei „Nochmal ansehen“). Liefert den Vorlauf für den Host. */
    pvPlay(pos) {
      const pv = this.pv, ms = CFG.game.replayDelayMs;
      if (!pv) return ms;
      clearTimeout(pv.timer);
      pv.members.forEach((mb) => { if (mb.p.connected && mb.p.link === mb.link) mb.link.send({ t: 'pv_play', id: pv.id, pos, in: Math.max(300, Math.round(ms - (mb.link.rtt || 0) / 2)) }); });
      return ms;
    }
    pvPause(pos) {
      const pv = this.pv; if (!pv) return;
      pv.members.forEach((mb) => { if (mb.p.connected && mb.p.link === mb.link) mb.link.send({ t: 'pv_pause', id: pv.id, pos }); });
    }
    /* Ende der Vorschau (Schließen, „nur für mich“, Abbruch): alle Handys räumen auf, der Zustand ist weg */
    pvClose() {
      const pv = this.pv; if (!pv) return;
      this.pv = null; clearTimeout(pv.timer);
      pv.members.forEach((mb) => { try { if (mb.p.connected && mb.p.link === mb.link) mb.link.send({ t: 'pv_close', id: pv.id }); } catch { /* ignore */ } });
    }
    pvAbort() { const pv = this.pv; if (!pv) return; if (pv.ui && pv.ui.abort) pv.ui.abort(); this.pvClose(); }

    /* Das Video wird nur einmal eingelesen, auch wenn mehrere Handys es brauchen (spart bis zu 80 MB Speicher pro Handy) */
    videoBytes(sc) { return sc._vbytes || (sc._vbytes = sc.pack.video.arrayBuffer().then((b) => new Uint8Array(b))); }

    sendProgress() {
      if (!this.scene || this.state !== 'playing') return;
      clearTimeout(this._progT);
      this._progT = setTimeout(() => {
        const list = this.list().filter((p) => p.assign && p.active).map((p) => ({ pid: p.pub, name: p.name, emoji: p.emoji, color: p.color, done: !!p.done, cur: p.prog ? p.prog.cur : 1, total: p.assign.lineIdx.length, chars: p.assign.chars }));
        this.bcast({ t: 'prog_all', list });
      }, 120);
    }

    async playScene(pack, recs) {
      // 1) Szene vorbereiten
      this.showStage('prep', () => VD.h('div', { class: 'boot center' }, VD.h('span', { class: 'spinner big' }), VD.h('p', { class: 'lead', id: 'prep-t', text: VD.t('Szene wird vorbereitet …') })));
      let scene;
      try { scene = await VD.Scene.build(pack, (t) => { const el = VD.$('#prep-t'); if (el) el.textContent = t; }); }
      catch (e) { console.error(e); VD.toast(VD.t('Das Pack lässt sich nicht abspielen: {e}', { e: e && e.message ? e.message : e }), 'warn'); throw END; }
      this.scene = scene;
      VD.Scene.assign(scene, recs, this.settings.assign, this.wishOn());
      recs.forEach((p) => { if (p.assign && !p.assign.lineIdx.length) p.assign = null; });   // mehr Spieler als Zeilen: Rest schaut zu
      const actives = this.list().filter((p) => p.active);
      actives.filter((p) => !p.assign).forEach((p) => { p.assign = null; });

      // 2) Medien verteilen
      this.setPhase('load', {}, (p) => (p.assign ? {} : WATCH));
      this.viewLoad(scene);
      for (const p of actives) if (p.assign && p.connected) this.sendScene(p);
      for (const p of this.list()) if (!p.assign && p.connected) { this.sendWatch(p); }
      this.sendProgress();
      await this.waitPhase({
        ms: CFG.game.loadTimeoutMs,
        check: () => { if (actives.filter((p) => p.assign && p.connected).every((p) => p.loaded || p.loadFailed)) this.gate && this.gate.open('all'); },
        onTick: () => this.updateLoad && this.updateLoad()
      });
      const ready = actives.filter((p) => p.assign && p.connected && p.loaded);
      if (!ready.length) { VD.toast(VD.t('Kein Gerät konnte die Szene laden.'), 'warn'); throw END; }

      // 3) Jeder nimmt in seinem eigenen Tempo auf
      this.setPhase('play', {}, (p) => (!p.assign ? WATCH : p.loaded ? {} : p.loadFailed ? LOAD_FAILED : { phase: 'load' }));
      this.viewPlay(scene);
      VD.sfx.play('whoosh');
      await this.waitPhase({
        deadline: () => Infinity,
        // Wer kurz weg ist (Funkloch, Bildschirm gesperrt), wird abgewartet; der Host kann ihn überspringen (this.skipAway)
        check: () => { const w = this.list().filter((p) => p.assign && p.loaded && (p.connected || !p.skipped)); if (!w.length || w.every((p) => p.done)) this.gate && this.gate.open('all'); }
      });
      await this.waitPhase({ ms: 1200, allowNext: false });

      // 4) Gemeinsames Ergebnis (so oft ansehen, wie ihr wollt); auch wer später fertig geladen hat, ist dabei
      await this.finalPhase(scene, this.list().filter((p) => p.assign && p.loaded));
    }

    async finalPhase(scene, players) {
      const recs = players.filter((p) => p.assign);
      const mix = Scene.finalMix(scene, recs);      // einmal berechnen: für die Handys, jede Wiederholung und den Export
      const bytes = new Uint8Array(VD.f32ToI16(mix).buffer);
      this.finalCtx = { scene, recs, mix, bytes };
      // Jeder Spieler (auch Zuschauer, deren Video schon da ist) bekommt den fertigen Ton und schaut die Szene selbst an
      try {
        const to = this.list().filter((p) => p.connected && !p.isLocal && p.link && (p.assign ? p.loaded : p.watchLoaded && !p.hasMix));
        to.forEach((p) => { if (!p.assign) p.hasMix = true; });
        await Promise.all(to.map((p) => p.link.sendBlob('mix', { sr: SR }, bytes).catch(() => {})));
      } catch (e) { console.warn('Mix senden', e); }
      this.setPhase('final', { title: scene.title });
      this.viewFinal(scene);
      let mode = 'all';
      for (;;) {
        this.finalInfo(recs);
        const delay = CFG.game.replayDelayMs;
        if (mode === 'all') this.announceReplay(delay);         // alle starten gemeinsam nach dem Vorlauf
        await this.playFinal(scene, mix, mode === 'all' ? delay : null);   // 'solo': nur auf diesem Bildschirm
        await this.waitPhase({ ms: 900, allowNext: false });
        this.finalButtons(true);
        const r = await this.waitPhase({ deadline: () => Infinity });
        this.finalButtons(false);
        mode = r === 'solo' ? 'solo' : 'all';
        if (r === 'lobby') return;
        VD.sfx.play('whoosh');
      }
    }

    /* Alle Geräte starten die Szene gemeinsam: jeder bekommt „in X ms“, abzüglich seiner halben Laufzeit */
    async announceReplay(ms) {
      for (const p of this.list()) {
        if (!p.connected || p.isLocal || !p.link || !(p.assign || p.hasMix)) continue;
        try { p.link.send({ t: 'replay', in: Math.max(300, Math.round(ms - (p.link.rtt || 0) / 2)) }); } catch { /* ignore */ }
      }
    }

    async playFinal(scene, mix, inMs) {
      const v = this.fvideo;
      const buf = VD.audio.fromFloat(mix, SR);
      let sync = null, play = null;
      if (v) {
        try { sync = await VD.Video.syncPlay(v, 0, (off, delay) => (play = VD.audio.play(buf, { gain: 0.95, delay, offset: Math.min(off, buf.duration - 0.01) })), inMs != null ? { inMs } : {}); } catch (e) { console.warn('Video', e); }
      }
      if (!play) play = VD.audio.play(buf, { gain: 0.95, delay: inMs != null ? Math.max(0.02, inMs / 1000) : 0.02 });
      this.curPlay = play;
      const done = new VD.Gate();
      play.done.then(() => done.open());
      const r = await this.waitUntil(done);
      play.stop(); if (sync) sync.stop(); if (v) v.pause();
      return r;
    }

    hostLobby() { if (this.gate) this.gate.open('lobby'); else this.pending = 'lobby'; }
    hostAgain() { if (this.gate) this.gate.open('again'); }
    hostSolo() { if (this.gate) this.gate.open('solo'); }

    backToLobby() {
      this.state = 'lobby'; this.phase = 'lobby'; this.scene = null;
      this.list().forEach((p) => { p.ready = false; p.active = true; p.assign = null; p.takes = new Map(); p.done = false; p.wantDone = false; p.prog = null; p.watchSent = null; p.watchLoaded = false; p.hasMix = false; });
      this.lastPhase = { t: 'phase', phase: 'lobby' };
      this.bcast(this.lastPhase);
      this.onRosterChanged();
      this.finalCtx = null; this.playCards = null;              // Ergebnis-Ton und Szene freigeben
      if (this.fvideo) VD.Video.dispose(this.fvideo);
      if (this.fvideoUrl) { URL.revokeObjectURL(this.fvideoUrl); this.fvideoUrl = null; }
      this.fvideo = null;
      this.gotoLobby();
    }
  };
})();
