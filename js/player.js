/* Spieler-Oberfläche (Handy bzw. lokaler Mitspieler am Host-PC).
   Jeder Spieler bekommt seine Zeilen und arbeitet sie in eigenem Tempo ab:
   Standbild -> "Original" (Szene mit Originalton + Text) -> "Aufnahme" (stumm, du sprichst) -> "Mein Take" -> "Weiter". */
(function () {
  const VD = (window.VD = window.VD || {});
  const A = window.VDA;
  const h = VD.h;
  const SR = A.SR;
  const G = window.VD_CONFIG.game;
  const TAIL_MS = G.recTailMs;  // Nachlauf nach dem Ende der Zeile (config.js)
  const DEFAULT_LAT_MS = 60;   // typische Mikrofon-Verzögerung, falls der Browser keine nennt
  const FXL = { none: () => VD.t('Keiner'), low: () => VD.t('Tief'), high: () => VD.t('Hoch'), robot: () => VD.t('Roboter'), echo: () => VD.t('Echo'), phone: () => VD.t('Telefon'), reverb: () => VD.t('Hall') };
  const FX_ORDER = ['none', 'low', 'high', 'robot', 'echo', 'phone', 'reverb'];
  const rate = (sr, d) => (Number.isInteger(sr) && sr >= 8000 && sr <= 96000 ? sr : d);   // Abtastrate vom Host prüfen

  VD.Controller = class {
    constructor(root, opt) {
      this.root = root; this.mic = opt.mic; this.profile = opt.profile; this.local = !!opt.local;
      this.onKicked = opt.onKicked || (() => {}); this.onAttention = opt.onAttention || (() => {}); this.onBig = opt.onBig || (() => {}); this.onLeave = opt.onLeave || (() => {}); this.room = opt.room || null;
      this.canRecord = !!opt.mic; this.phase = 'lobby';
      this.pvc = new VD.PvClient(this);   // gemeinsame Pack-Vorschau vom Host (js/pvclient.js)
      this.ready = false; this.players = [];
      this.resetScene();
      this.top = h('header', { class: 'pc-top' });
      this.body = h('main', { class: 'pc-body' });
      this.offlineTxt = h('p', { role: 'status', 'aria-live': 'polite', text: VD.t('Verbindung verloren – verbinde neu …') });
      this.offlineBtn = h('button', { class: 'btn sm', type: 'button', hidden: true }, VD.t('Erneut versuchen'));
      this.offlineSpin = h('span', { class: 'spinner' });
      this.offline = h('div', { class: 'pc-offline', hidden: true }, this.offlineSpin, this.offlineTxt, this.offlineBtn);
      this.micBar = h('div', { class: 'pc-offline pc-micfix', hidden: true }, h('p', { text: VD.t('Das Mikrofon wurde angehalten. Tippe, um es wieder zu starten.') }),
        h('button', { class: 'btn sm primary', type: 'button', onclick: () => this.checkMic(true) }, VD.t('Mikrofon starten')));
      root.replaceChildren(this.top, this.body, this.offline, this.micBar);
      this.renderTop();
      this.viewKey = '';
      this.setView('wait', () => this.vWait(VD.t('Verbinde …')));
      // Wellenform passt sich sofort an, wenn das Design gewechselt oder das Fenster in der Größe geändert wird
      this._onRedraw = () => this.waveRender();
      document.addEventListener('vt-theme', this._onRedraw);
      window.addEventListener('resize', this._onRedraw);
    }

    resetScene() {
      this.stopAll();
      (this.imgUrls || []).forEach((u) => URL.revokeObjectURL(u));
      if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
      this.imgUrls = []; this.stillUrl = null; this.videoUrl = null; this.vAr = 0; this.mix = null; this.stopPremiere && this.stopPremiere();
      if (this.vEl) { VD.Video.dispose(this.vEl); this.vEl = null; }
      this.scene = null; this.sceneId = null; this.lines = []; this.cur = 0; this.takes = new Map();
      this.finished = false; this.loaded = false; this.roster = []; this.ui = null; this.fin = null;
    }

    /* ---------- Verbindung ---------- */
    attach(link) {
      this.pvc.close();   // eine neue Verbindung nimmt nicht an einer laufenden Vorschau teil
      this.link = link;
      link.on('msg', (m) => this.onMsg(m));
      link.on('blob', (k, meta, bytes) => this.onBlob(k, meta, bytes));
      link.send({ t: 'hello', pid: this.profile.pid, name: this.profile.name, emoji: this.profile.emoji, color: this.profile.color, canRecord: this.canRecord, sceneId: this.loaded ? this.sceneId : null, hasMix: !!this.mix, ver: 2 });
      this.setOffline(false);
      if (this.loaded) this.resync();
      this.checkMic();
      // Bildschirm wach halten (auch nach einem Tab-Wechsel, siehe VD.wake)
      if (!this.local) VD.wake.on();
    }
    /* state: false = online | 'retry' = verbinde neu | 'host' = Host nicht erreichbar, es wird weiter versucht | 'failed' = aufgegeben (Knopf) */
    setOffline(state, retry) {
      if (state === true) state = 'retry';
      const was = this.offlineState;
      this.offlineState = state || false;
      this.offline.hidden = !state;
      this.offlineBtn.hidden = state !== 'failed';
      this.offlineSpin.hidden = state === 'failed';
      this.offlineBtn.onclick = retry || null;
      if (state) this.offlineTxt.textContent = state === 'host' ? VD.t('Der Host ist nicht erreichbar – ich versuche es weiter …')
        : state === 'failed' ? VD.t('Keine Verbindung zum Host. Prüfe dein Netz und versuche es erneut.') : VD.t('Verbindung verloren – verbinde neu …');
      if (state && !was) this.onLinkLost();
    }
    /* Verbindung weg: eine laufende Aufnahme wird verworfen (kein halbes Take), alles Fertige bleibt */
    onLinkLost() {
      const u = this.ui;
      if (!u || (this.busy !== 'rec' && this.busy !== 'cd') || this.stopping) return;
      this.stopAll(); this.setBusy(null);
      u.status.textContent = VD.t('Aufnahme verworfen, weil die Verbindung weg war. Bitte nimm sie nochmal auf.');
      this.sendProg('idle');
    }
    /* Mikrofon läuft noch? Sonst neu starten; braucht der Browser dafür eine Berührung, erscheint ein Knopf. */
    async checkMic(fromTap) {
      const m = this.mic;
      if (!m || this.local || this._micBusy || this.destroyed) return;
      const tr = m.stream && m.stream.getAudioTracks ? m.stream.getAudioTracks()[0] : null;
      const dead = !m.running || !tr || tr.readyState === 'ended';
      if (!dead) { this.micBar.hidden = true; try { if (VD.audio.ctx && VD.audio.ctx.state !== 'running') await VD.audio.ctx.resume(); } catch { /* ignore */ } return; }
      this._micBusy = true;
      try {
        try { m.stop(); } catch { /* ignore */ }
        await m.start();
        this.micBar.hidden = true;
      } catch (e) { console.warn('Mikrofon neu starten', e); this.micBar.hidden = false; if (fromTap) VD.toast(VD.t('Mikrofon nicht aktiv'), 'warn'); }
      this._micBusy = false;
    }
    send(m) { this.link && this.link.send(m); }

    /* Nach einem Verbindungsabbruch: alles Aufgenommene noch einmal schicken (der Host nimmt Doppeltes einfach an) */
    resync() {
      this.send({ t: 'loaded', id: this.sceneId });       // falls die Meldung beim Abbruch verloren ging
      for (const [i, t] of this.takes) this.uploadTake(i, t, true);
      this.sendProg('idle');
      if (this.finished) this.send({ t: 'done' });
    }

    onMsg(m) {
      switch (m.t) {
        case 'welcome': this.profile.color = m.color || this.profile.color; this.renderTop(); if (m.snap) this.onPhase(m.snap, true); break;
        case 'reject': this.onKicked(VD.t(m.reason || 'Beitritt nicht möglich.')); break;
        case 'kicked': this.onKicked(VD.t('Der Host hat dich aus dem Raum entfernt.')); break;
        case 'closed': this.onKicked(VD.t('Der Host hat den Raum geschlossen.')); break;
        case 'lobby': this.players = m.players || []; this.lobbyChars = Array.isArray(m.chars) ? m.chars : []; this.wishOn = m.wishOn !== false; this.setFxOn(m.fxOn !== false); if (this.phase === 'lobby') { this.updateLobbyList(); this.updateRoles(); } break;
        case 'phase': this.onPhase(m); break;
        case 'scene': this.onScene(m); break;
        case 'assets_end': this.onAssetsEnd(m); break;
        case 'pv_start': case 'pv_end': case 'pv_play': case 'pv_pause': case 'pv_close': this.pvc.msg(m); break;
        case 'replay': this.onReplay(VD.clamp(Number(m.in) || 1500, 200, 10000)); break;
        case 'prog_all': this.roster = m.list || []; if (this.viewKey === 'submitted' || this.viewKey === 'spectate') this.updateRoster(); break;
        default: break;
      }
    }

    /* ---------- Szene laden ---------- */
    async onScene(m) {
      this.pvc.close();
      this.resetScene();
      this.scene = m; this.sceneId = m.id;
      this.lines = (m.lines || []).map((l) => Object.assign({ img: null, orig: null }, l));
      this.videoMime = m.videoMime || '';
      if (!m.watch) this.translateLines();
      // Zuschauer bleiben bei der Fortschrittsanzeige; die Medien laden im Hintergrund
      if (!m.watch) this.setView('load', () => this.vWait(VD.t('Szene wird geladen …')), true);
      this.canVideo = !!m.videoSize && (await VD.Video.ready(this.videoMime));
      if (this.scene !== m) return;
      // Video schon von einer früheren Runde auf diesem Gerät? Dann muss es nicht noch einmal übertragen werden
      let hit = null;
      if (this.canVideo && !this.local && m.videoKey) hit = await VD.VideoCache.get(m.videoKey);
      if (this.scene !== m) return;
      if (hit) { this.videoUrl = URL.createObjectURL(new Blob([hit.bytes], { type: hit.mime || 'video/ogg' })); const ar = VD.Video.aspect(new Uint8Array(hit.bytes)); if (ar > 0.3 && ar < 4) this.vAr = ar; }
      // Aufnahmen, die ein Neuladen überstanden haben (IndexedDB), wieder einsetzen
      if (this.room && !m.watch) {
        const r = await VD.TakeStore.load(this.room, m.id);
        if (this.scene !== m) return;
        if (r) {
          for (const [i, t] of r.takes) if (this.lines.some((l) => l.i === i)) this.takes.set(i, t);
          this.cur = Math.min(r.cur, Math.max(0, this.lines.length - 1));
          this.finished = !!r.fin && this.lines.every((l) => this.takes.has(l.i));
        }
      }
      this.send({ t: 'caps', video: this.canVideo, cached: !!hit });
    }
    /* Merken, was schon da ist (überlebt ein Neuladen) */
    saveTake(i, t) { if (this.room && this.sceneId && !this.local) VD.TakeStore.put(this.room, this.sceneId, i, t); }
    saveState() { if (this.room && this.sceneId && !this.local && !(this.scene && this.scene.watch)) VD.TakeStore.setState(this.room, this.sceneId, this.cur, this.finished); }

    /* Untertitel in der eigenen Sprache (im Hintergrund; die Zeile erscheint, sobald die Übersetzung da ist) */
    translateLines() {
      const sc = this.scene;
      const caps = [...new Set(this.lines.map((l) => l.caption).filter(Boolean))];
      VD.Translate.run(caps, (cap, tr) => {
        this.lines.forEach((l) => { if (l.caption === cap) l.tr = tr; });
        const el = this._trEl;
        if (el && el.isConnected && el.dataset.cap === cap) { el.textContent = tr; el.hidden = !tr; }
      }, () => this.scene !== sc);
    }

    onBlob(kind, meta, bytes) {
      if (typeof kind === 'string' && kind.startsWith('pv')) { this.pvc.blob(kind, meta, bytes); return; }
      if (!this.scene) return;
      if (kind === 'img' && this.scene.watch) {
        if (meta.still && !this.stillUrl) { this.stillUrl = URL.createObjectURL(new Blob([bytes], { type: meta.mime || 'image/png' })); this.imgUrls.push(this.stillUrl); }
      } else if (kind === 'img') {
        const l = this.lines.find((x) => x.i === meta.i); if (!l) return;
        l.img = URL.createObjectURL(new Blob([bytes], { type: meta.mime || 'image/png' })); this.imgUrls.push(l.img);
      } else if (kind === 'orig') {
        const l = this.lines.find((x) => x.i === meta.i); if (!l) return;
        const i16 = new Int16Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
        l.orig = VD.audio.fromFloat(VD.i16ToF32(i16), rate(meta.sr, 16000));
      } else if (kind === 'mix') {
        const i16 = new Int16Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
        this.mix = VD.audio.fromFloat(VD.i16ToF32(i16), rate(meta.sr, SR));
        // Zuschauer: Ergebnis kam erst nach dem Start an -> Ansicht neu aufbauen, beim nächsten „Nochmal ansehen“ läuft es mit
        if (this.viewKey === 'final' && !this.fin) { this.setView('final', () => this.vFinal(), true); if (this.fin) this.fin.status.textContent = VD.t('Bereit! Beim nächsten „Nochmal ansehen“ bist du dabei.'); }
      } else if (kind === 'video') {
        this.videoUrl = URL.createObjectURL(new Blob([bytes], { type: meta.mime || 'video/ogg' }));
        const ar = VD.Video.aspect(bytes); if (ar > 0.3 && ar < 4) this.vAr = ar;
        if (!this.local && this.scene.videoKey) VD.VideoCache.put(this.scene.videoKey, meta.mime, bytes);
      }
    }

    onAssetsEnd(m) {
      if (!this.scene) return;
      if (!m.video) this.videoUrl = null;
      this.loaded = true;
      this.send({ t: 'loaded', id: this.sceneId });
      if (this.takes.size || this.finished) this.resync();      // nach einem Neuladen: wiederhergestellte Takes noch einmal an den Host
      if (this.phase === 'play' && !this.scene.watch) this.enterPlay();
    }

    /* ---------- Rahmen ---------- */
    renderTop() {
      // Im Spiel sitzt der Filter-Knopf oben; der Host hat ihn in seiner eigenen Kopfzeile
      const dn = this.canRecord && !this.local && this.phase !== 'lobby' ? VD.Denoise.iconEl() : null;
      this.top.replaceChildren(VD.ui.avatar(this.profile, 'sm'), h('span', { class: 'pc-name', text: this.profile.name }), ...(dn ? [dn] : []), ...(this.local ? [] : [VD.ui.themeBtn(), VD.ui.settingsBtn(() => this)]));
    }
    setView(key, build, force) {
      if (this.viewKey === key && !force) return this.body.firstElementChild;
      this.viewKey = key;
      this.onBig(key === 'play' || key === 'submitted' || key === 'load', key);
      const el = build();
      el.classList.add('view-in');
      this.body.replaceChildren(el);
      return el;
    }
    fx(name) { if (!this.local) { VD.sfx.play(name); } }

    /* ---------- Ansichten ---------- */
    vWait(text) {
      return h('section', { class: 'pc-view center' }, h('div', { class: 'big-ear' }, VD.ui.dots()), h('p', { class: 'lead', text }));
    }

    vLobby() {
      if (!this.local && VD.music) VD.music.where('lobby');
      const meter = h('div', { class: 'meter' }, h('i'));
      const list = h('ul', { class: 'mini-players' });
      const roles = h('div', { class: 'roles', hidden: true }, h('span', { class: 'sub-h', text: VD.t('Wunschrolle') }), h('div', { class: 'role-list' }));
      const readyBtn = h('button', { class: 'btn big ' + (this.ready ? 'ghost' : 'primary'), onclick: () => { this.ready = !this.ready; this.send({ t: 'ready', on: this.ready }); this.fx('click'); readyBtn.classList.toggle('ghost', this.ready); readyBtn.classList.toggle('primary', !this.ready); readyBtn.textContent = this.ready ? VD.t('Bereit ✓') : VD.t('Ich bin bereit'); } }, this.ready ? VD.t('Bereit ✓') : VD.t('Ich bin bereit'));
      const el = h('section', { class: 'pc-view' },
        h('h2', { text: VD.t('Du bist dabei') }),
        h('p', { class: 'lead', text: this.canRecord ? VD.t('Sprich kurz ins Mikro: Der Balken muss ausschlagen.') : VD.t('Ohne Mikrofon beigetreten – du kannst zuschauen, aber nicht aufnehmen.') }),
        this.canRecord ? meter : null,
        readyBtn,
        this.canRecord ? roles : null,
        this.canRecord ? VD.Denoise.switchEl() : null,
        h('div', { class: 'sub' }, h('span', { class: 'sub-h', text: VD.t('Im Raum') }), list),
        this.local ? null : h('button', { class: 'btn link home-btn', onclick: () => { this.send({ t: 'leave' }); this.onLeave(); } }, VD.t('Zur Startseite'))
      );
      this._meterEl = meter;
      this._list = list;
      this._roles = roles;
      this.updateLobbyList();
      this.updateRoles();
      this.startMeter();
      return el;
    }
    updateLobbyList() {
      if (!this._list) return;
      this._list.replaceChildren(...this.players.map((p) => h('li', { class: p.connected ? '' : 'off' }, VD.ui.avatar(p, 'xs'), h('span', { text: p.name }), p.ready ? h('em', { text: '✓' }) : null)));
    }
    /* Wunschrolle: antippen wählt, nochmal antippen hebt auf. Wer welchen Charakter will, sieht man an den kleinen Symbolen. */
    updateRoles() {
      const box = this._roles;
      if (!box) return;
      const chars = this.lobbyChars || [];
      box.hidden = !chars.length || this.wishOn === false;
      const me = this.players.find((p) => p.pid === this.profile.pid);
      const mine = me ? me.wish : null;
      box.lastChild.replaceChildren(...chars.map((c) => {
        const who = this.players.filter((p) => p.wish === c.n);
        return h('button', { class: 'role' + (mine === c.n ? ' on' : ''), type: 'button', 'aria-pressed': String(mine === c.n), onclick: () => {
          const next = mine === c.n ? null : c.n;
          if (me) me.wish = next;
          this.send({ t: 'wish', c: next }); this.fx('tap'); this.updateRoles();
        } }, h('b', { text: c.n }), h('small', { text: VD.lines(c.k) }),
        who.length ? h('span', { class: 'role-who' }, ...who.map((p) => VD.ui.avatar(p, 'xs'))) : null);
      }).concat(h('button', { class: 'role' + (!mine ? ' on' : ''), type: 'button', 'aria-pressed': String(!mine), onclick: () => {
        if (me) me.wish = null;
        this.send({ t: 'wish', c: null }); this.fx('tap'); this.updateRoles();
      } }, h('b', { text: VD.t('Überrasch mich') }))));
    }
    /* Pegelbalken in der Lobby. Das Mikro liefert nur etwa alle 20 ms einen neuen Wert und der Balken gleitet per CSS,
       deshalb reichen 30 Schritte pro Sekunde über einen Zeitgeber (kein Dauerlauf mit jedem Bild). */
    startMeter() {
      clearTimeout(this._mtimer);
      const el = this._meterEl;
      let seen = false, last = -1;
      const loop = () => {
        if (!el || el !== this._meterEl) return;
        if (!el.isConnected) { if (seen) return; this._mtimer = setTimeout(loop, 33); return; }   // beim Aufbau ist das Element noch nicht eingebaut: kurz warten
        seen = true;
        const v = this.mic ? Math.round(Math.min(1, Math.pow(this.mic.peak * 2.2, 0.6)) * 200) / 200 : 0;
        if (v !== last) { last = v; el.firstChild.style.transform = `scaleX(${v})`; }
        this._mtimer = setTimeout(loop, 33);
      };
      loop();
    }

    /* ---------- Phasen ---------- */
    onPhase(m) {
      const was = this.phase;
      this.phase = m.phase;
      if (m.phase !== 'lobby') this.pvc.close();   // Runde beginnt: die Vorschau endet
      if ((was === 'lobby') !== (m.phase === 'lobby')) this.renderTop();
      if (m.phase !== 'lobby') clearTimeout(this._mtimer);
      if (!this.local && VD.music) VD.music.where(m.phase === 'lobby' ? 'lobby' : 'game');
      if (m.phase === 'lobby') { if (this.room) VD.TakeStore.clear(this.room);   // Runde beendet: gemerkte Aufnahmen löschen
         this.resetScene(); this.setView('lobby', () => this.vLobby(), true); return; }
      if (m.spectate) { this.stopAll(); this.setView('spectate', () => this.vSpectate(m), true); return; }
      if (m.phase === 'load') {
        if (m.text) this.setView('wait', () => this.vWait(VD.t(m.text)), true);
        else if (!this.loaded) this.setView('load', () => this.vWait(VD.t('Szene wird geladen …')), true);
        return;
      }
      if (m.phase === 'play') {
        if (!this.scene || !this.lines.length || m.text) { this.setView('wait', () => this.vWait(VD.t(m.text || 'Diesmal schaust du zu')), true); return; }
        this.onAttention();
        if (this.loaded) this.enterPlay();
        return;
      }
      if (m.phase === 'final') { this.stopAll(); this.onAttention(); this.setView('final', () => this.vFinal(m), true); return; }
      this.setView('wait', () => this.vWait(VD.t(m.text || 'Einen Moment …')), true);
    }

    enterPlay() {
      if (this.viewKey === 'play' || this.viewKey === 'submitted') return;
      this.cur = Math.min(this.cur, Math.max(0, this.lines.length - 1));
      if (this.finished) { this.setView('submitted', () => this.vSubmitted(), true); return; }   // war schon abgegeben (Neuladen)
      this.showLine();
    }

    /* ---------- Eine Zeile bearbeiten ---------- */
    /* Rahmen passt sich dem echten Seitenverhältnis des Videos an */
    fitScreen(screen, video) {
      const apply = () => {
        const w = video && video.videoWidth, hh = video && video.videoHeight;
        if (w && hh) { this.vAr = w / hh; }
        if (this.vAr) screen.style.aspectRatio = String(this.vAr);
        return !!(w && hh);
      };
      if (apply() || !video) return;
      video.addEventListener('loadedmetadata', apply);
      let n = 0; const t = setInterval(() => { if (apply() || ++n > 20 || !screen.isConnected) clearInterval(t); }, 250);
    }
    showLine() {
      this.stopAll();
      this.finished = false;
      const idx = this.cur, line = this.lines[idx], total = this.lines.length;
      const take = this.takes.get(line.i);
      const still = h('img', { class: 'dp-still', alt: '', src: line.img || '' });
      if (!line.img) still.hidden = true;
      let video = null;
      if (this.videoUrl) {
        video = this.vEl || (this.vEl = VD.Video.create(this.videoUrl, this.videoMime, 'dp-video'));
        video.hidden = true;
      }
      const sub = h('div', { class: 'dp-sub' });
      const bar = h('i', { class: 'dp-barfill' });
      const live = h('canvas', { class: 'dp-live', 'aria-label': VD.t('Wellenform: Original und deine Aufnahme') });
      const pos = h('i', { class: 'dp-pos', hidden: true, 'aria-hidden': 'true' });   // Positionsstrich über der Wellenform
      const status = h('p', { class: 'hint dp-status', text: this.syncInfo(take) });
      const mk = (cls, label, fn) => h('button', { class: 'btn ' + cls, onclick: fn }, label);
      const bBack = mk('dp-back', '◀', () => this.go(-1)); bBack.setAttribute('aria-label', VD.t('Vorherige Zeile')); bBack.disabled = idx === 0;
      const bOrig = mk('', VD.t('Original'), () => this.doOriginal());
      const bRec = mk('dp-rec', VD.t('Aufnahme'), () => this.doRecord());
      const bTake = mk('', VD.t('Mein Take'), () => this.doTake());
      const bNext = mk('primary', idx === total - 1 ? VD.t('Fertig ▶') : VD.t('Weiter ▶'), () => this.go(1));
      bTake.disabled = !take; bNext.disabled = !take;
      this.ui = { still, video, sub, bar, live, pos, status, bBack, bOrig, bRec, bTake, bNext, line, screen: null, count: null, fxp: null };
      this.wv = { orig: (line.pk || []).map((v) => v / 100), mine: take ? this.peaksOf(take.data, line) : [], run: false };
      requestAnimationFrame(() => this.waveRender());
      const screen = h('div', { class: 'dp-screen' }, still, video, sub, h('div', { class: 'dp-bar' }, bar));
      this.ui.screen = screen;
      this.fitScreen(screen, video);
      const dots = h('div', { class: 'dp-dots' }, this.lines.map((l, k) => h('i', { class: (k < idx || this.takes.has(l.i) ? 'ok ' : '') + (k === idx ? 'cur' : '') })));
      const trEl = h('p', { class: 'dp-tr', text: line.tr || '', hidden: !line.tr, 'data-cap': line.caption || '' });
      this._trEl = trEl;
      const el = h('section', { class: 'pc-view dub-play' },
        h('div', { class: 'dp-head' }, h('b', { class: 'dp-title', text: this.scene.title }), h('span', { class: 'dp-n', text: VD.t('Zeile {c}/{t}', { c: idx + 1, t: total }).toUpperCase() })),
        dots,
        screen,
        h('p', { class: 'dp-who' }, h('b', { style: { '--c': this.profile.color }, text: line.char.toUpperCase() }), ' · ' + VD.t('Du bist dran')),
        h('p', { class: 'dp-cap', text: line.caption || '' }),
        trEl,
        h('div', { class: 'dp-livewrap' }, live, pos), status,
        h('div', { class: 'dp-btns' }, bBack, bOrig, bRec, bTake, bNext),
        (this.ui.fxp = this.fxPill()));
      this.setView('play', () => el, true);
      this.sendProg('idle');
      this.saveState();
      return el;
    }

    setBusy(kind) {
      const u = this.ui; if (!u) return;
      this.busy = kind;
      if (this.mic) { this.mic.busy = kind === 'rec'; if (kind !== 'rec' && VD.Denoise) VD.Denoise.refresh(); }
      u.bOrig.classList.toggle('on', kind === 'orig'); u.bRec.classList.toggle('on', kind === 'rec'); u.bTake.classList.toggle('on', kind === 'take');
      u.bOrig.textContent = kind === 'orig' ? VD.t('Stopp') : VD.t('Original');
      u.bRec.textContent = kind === 'rec' ? VD.t('Stopp') : kind === 'cd' ? VD.t('Abbrechen') : VD.t('Aufnahme');
      u.bTake.textContent = kind === 'take' ? VD.t('Stopp') : VD.t('Mein Take');
      this.recRing(u, kind === 'rec');
      const t = this.takes.get(u.line.i);
      if (u.fxp) u.fxp.disabled = kind != null || !!this._fxWork;
      u.bBack.disabled = kind != null || this.cur === 0;
      u.bNext.disabled = kind != null || !t;
      u.bOrig.disabled = kind === 'rec' || kind === 'take' || kind === 'cd';
      u.bTake.disabled = kind === 'rec' || kind === 'orig' || kind === 'cd' || (!t && kind !== 'take');
      u.bRec.disabled = kind === 'orig' || kind === 'take';
    }

    /* Pulsierender Ring um den Aufnahme-Knopf. Er ist ein eigenes Element hinter dem Knopf und wird nur skaliert und
       ausgeblendet. Das erledigt die Grafikkarte, die Seite muss dafür nicht bei jedem Bild neu gezeichnet werden. */
    recRing(u, on) {
      if (!on) { if (u.ring) { u.ringObs && u.ringObs.disconnect(); u.ring.remove(); u.ring = u.ringObs = null; } return; }
      if (u.ring) return;
      const b = u.bRec, box = b.parentNode;
      if (!box) return;
      const ring = (u.ring = h('i', { class: 'rec-ring', 'aria-hidden': 'true' }));
      const place = () => {
        const w = b.offsetWidth, hh = b.offsetHeight;
        if (!w || !hh) return;
        ring.style.left = b.offsetLeft + 'px'; ring.style.top = b.offsetTop + 'px'; ring.style.width = w + 'px'; ring.style.height = hh + 'px';
        ring.style.setProperty('--sx', String((w + 24) / w)); ring.style.setProperty('--sy', String((hh + 24) / hh));
      };
      box.append(ring); place();
      if (window.ResizeObserver) { u.ringObs = new ResizeObserver(place); u.ringObs.observe(b); u.ringObs.observe(box); }
    }

    /* Szene abspielen: Video (falls möglich) ab dem Anfang der Zeile, dazu optional Ton */
    async playSeg(line, opt) {
      const u = this.ui;
      const dur = line.s1 - line.s0;
      const token = (this.playToken = (this.playToken || 0) + 1);
      u.sub.classList.toggle('on', !!opt.subtitle);
      if (opt.subtitle) u.sub.textContent = line.caption;
      let vt0 = line.s0, sync;
      if (u.video) {
        const v = u.video;
        try {
          sync = await VD.Video.syncPlay(v, line.s0, opt.audio ? (off, delay) => (this.audioHandle = VD.audio.play(opt.audio, { gain: opt.gain || 0.95, delay, offset: Math.min(off, opt.audio.duration - 0.01) })) : null);
          if (token !== this.playToken) { sync.stop(); return null; }
          this.syncStop = sync.stop; vt0 = sync.vt0;
          // Video erst zeigen, wenn ein frisches Bild läuft; der Ablauf (und die Aufnahme) wartet nicht darauf
          VD.Video.frameReady(u.video, sync.vt0).then(() => { if (token === this.playToken) { u.video.hidden = false; u.still.hidden = true; } });
        } catch (e) { console.warn('Video startet nicht', e); }
      }
      if (token !== this.playToken) return null;
      const t0 = performance.now();
      if (opt.audio && !this.audioHandle) this.audioHandle = VD.audio.play(opt.audio, { gain: opt.gain || 0.95, delay: 0.005 });
      const lead = Math.max(0, vt0 - line.s0);
      const rest = Math.max(0.2, dur - lead);
      u.bar.style.transition = 'none'; u.bar.style.transform = `scaleX(${lead / dur})`;
      void u.bar.offsetWidth;
      u.bar.style.transition = `transform ${rest}s linear`; u.bar.style.transform = 'scaleX(1)';
      this.segTimer = setTimeout(() => { if (token === this.playToken) opt.onEnd && opt.onEnd(); }, rest * 1000 + (opt.extraMs || 0));
      return { t0, dur, vt0 };
    }

    stopPlayback() {
      this.playToken = (this.playToken || 0) + 1;
      if (this.syncStop) { this.syncStop(); this.syncStop = null; }
      this.waveStop();
      clearTimeout(this.segTimer);
      if (this.audioHandle) { this.audioHandle.stop(); this.audioHandle = null; }
      const u = this.ui;
      if (u) {
        if (u.video) { try { u.video.pause(); } catch { /* ignore */ } u.video.hidden = true; }
        if (u.still && u.line.img) u.still.hidden = false;
        u.sub.classList.remove('on');
        u.bar.style.transition = 'none'; u.bar.style.transform = 'scaleX(0)';
      }
    }
    stopAll() {
      if (this._cdCancel) this._cdCancel();
      this.stopPlayback();
      if (this.ui) this.recRing(this.ui, false);
      clearInterval(this._lvl);
      this.busy = null; this.stopping = false;
    }

    async doOriginal() {
      if (this.busy === 'orig') { this.stopPlayback(); this.setBusy(null); return; }
      this.stopPlayback();
      const line = this.ui.line;
      this.setBusy('orig');
      this.ui.status.textContent = '';
      await this.playSeg(line, { audio: line.orig, subtitle: true, onEnd: () => { this.stopPlayback(); this.setBusy(null); this.ui.status.textContent = ''; } });
    }

    async doRecord() {
      const u = this.ui;
      if (this.busy === 'cd') { if (this._cdCancel) this._cdCancel(); return; }   // Countdown läuft: Abbrechen, es passiert nichts
      if (this.busy === 'rec') { this.finishRecord(true); return; }
      if (!this.mic || !this.mic.running) { VD.toast(VD.t('Mikrofon nicht aktiv'), 'warn'); return; }
      this.stopPlayback();
      const line = u.line;
      const secs = Number(VD.store.get('countdown', 0)) || 0;
      if (secs > 0 && !(await this.countdown(u, secs))) return;
      if (this.ui !== u || this.busy != null || !this.mic || !this.mic.running) return;
      this.setBusy('rec');
      u.status.textContent = '';
      const started = await this.playSeg(line, { subtitle: false, extraMs: TAIL_MS, onEnd: () => this.finishRecord(false) });
      if (!started) return;
      this.recMark = this.mic.mark();
      this.waveStart('rec', started, line);
      this.recShift = Math.max(0, (started.vt0 || line.s0) - line.s0);   // Video lief schon ein Stück, als die Aufnahme begann
      this.recDur = line.s1 - line.s0;
      this.sendProg('rec');
      clearInterval(this._lvl);
      this._lvl = setInterval(() => this.send({ t: 'lvl', v: Math.round(Math.min(1, this.mic.peak * 2) * 100) / 100 }), 120);
    }

    /* ---------- Auto-Sync: Sprachanfang des Takes an den der Originalzeile anpassen (pro Gerät, Standard: an) ---------- */
    autoSyncOn() { return VD.store.get('autosync', true) !== false; }

    /* Sprachanfang der Originalzeile auf der Zeitachse des Takes (Sekunden ab line.s0): line.ts - line.s0, plus eine
       eventuelle Stille am Anfang der Originaldatei. */
    origStart(line) {
      if (line._os == null) {
        let extra = 0;
        try { const sp = line.v16 && A.speechSpan(line.v16, 16000); if (sp && sp.start < 0.4) extra = sp.start; } catch { /* ignore */ }
        line._os = Math.max(0, line.ts - line.s0) + extra;
      }
      return line._os;
    }

    /* Baut das Take-Objekt. base ist die unverschobene Fassung (nach der Lautstärke, vor Auto-Sync); lead ist die Stille,
       die vorne dran hängt, weil das Video schon lief. Die Verschiebung passiert vor jedem Stimmeffekt. */
    makeTake(line, base, lead, gainDb, silent) {
      let data = base, shift = 0;
      if (!silent && this.autoSyncOn()) {
        try { const r = A.autoSync(base, SR, { lead, target: this.origStart(line) }); data = r.data; shift = r.shift; } catch (e) { console.warn('Auto-Sync', e); }
      }
      return { data, base, lead, gainDb, silent, sent: false, sync: shift };
    }

    syncInfo(t) {
      if (!t || !t.sync) return '';
      const ms = Math.round(Math.abs(t.sync) * 1000);
      return t.sync < 0 ? VD.t('Auto-Sync: {ms} ms früher gesetzt', { ms }) : VD.t('Auto-Sync: {ms} ms später gesetzt', { ms });
    }

    /* ---------- Stimmeffekt (pro Gerät gewählt, vom Host erlaubt; siehe js/fx.js) ---------- */
    setFxOn(on) {
      if (this.fxOn === on) return;
      this.fxOn = on;
      this.fxPillSync();
    }
    fxAllowed() { return this.canRecord && this.fxOn !== false && !!window.VDFX; }
    /* In den Einstellungen nur an/aus (Standard: aus); welcher Effekt, wählt man auf dem Aufnahme-Bildschirm */
    fxEnabled() { return this.fxAllowed() && VD.store.get('voicefxon', false) === true; }
    fxName() {
      if (!this.fxEnabled()) return 'none';
      const n = VD.store.get('voicefx', 'low');
      return FX_ORDER.includes(n) ? n : 'low';
    }
    /* Take-Objekt mit Effekt. base bleibt die effektfreie Fassung. Der Effekt braucht unter einer Sekunde, der Aufrufer
       zeigt solange „Verarbeite …“ bzw. den Lade-Kringel. */
    async buildTake(line, base, lead, gainDb, silent, name) {
      const t = this.makeTake(line, base, lead, gainDb, silent);
      t.fx = 'none';
      if (!silent && name && name !== 'none' && window.VDFX) {
        await VD.sleep(20);                       // erst malen lassen, dann rechnen
        try { t.data = window.VDFX.apply(name, t.data, SR, { targetDb: G.voiceTargetDb }); t.fx = name; } catch (e) { console.warn('Effekt', e); }
      }
      return t;
    }
    /* Schalter in den Einstellungen */
    fxToggle(on) {
      VD.store.set('voicefxon', !!on);
      this.fxPillSync();
      return this.applyFx();
    }
    /* Effekt wählen (Knopf auf dem Aufnahme-Bildschirm): speichert die Wahl und rechnet das Take der Zeile neu */
    setFx(name) {
      if (!FX_ORDER.includes(name)) return;
      VD.store.set('voicefx', name);
      this.fxPillSync();
      return this.applyFx();
    }
    /* Ein vorhandenes Take der aktuellen Zeile wird aus der effektfreien Fassung (take.base) neu gerechnet: neues Objekt,
       sent: false -> geht neu zum Host, falls das alte schon dort war. */
    async applyFx() {
      const name = this.fxName();
      const u = this.ui, line = u && u.line, old = line && this.takes.get(line.i);
      if (this._fxWork || !old || old.silent || !old.base || old.fx === name || this.busy) return;
      this._fxWork = true;
      if (u.fxp) { u.fxp.disabled = true; u.fxp.classList.add('busy'); }
      u.bTake.classList.add('busy'); u.bNext.disabled = true;
      const prevStatus = u.status.textContent;
      u.status.textContent = VD.t('Verarbeite …');
      try {
        const nt = await this.buildTake(line, old.base, old.lead, old.gainDb, old.silent, name);
        if (this.takes.get(line.i) === old) {
          this.takes.set(line.i, nt); this.saveTake(line.i, nt);
          if (old.sent) this.uploadTake(line.i, nt);
          if (this.ui === u) { this.wv.mine = this.peaksOf(nt.data, line); this.waveRender(); }
        }
      } catch (e) { console.error(e); VD.toast(VD.t('Aufnahme konnte nicht verarbeitet werden'), 'warn'); }
      this._fxWork = false;
      if (this.ui !== u) return;
      u.bTake.classList.remove('busy');
      if (u.fxp) { u.fxp.classList.remove('busy'); u.fxp.disabled = !!this.busy; }
      u.bNext.disabled = !!this.busy || !this.takes.get(line.i);
      const t = this.takes.get(line.i);
      u.status.textContent = t && !t.silent ? this.syncInfo(t) : prevStatus;
    }
    /* Kleiner Knopf auf dem Aufnahme-Bildschirm (nur sichtbar, wenn Stimmeffekte in den Einstellungen an sind) */
    fxPill() {
      const b = h('button', { class: 'fx-pill glass', type: 'button', 'aria-haspopup': 'menu', 'aria-expanded': 'false', onclick: () => this.fxMenu(b) });
      this._fxPill = b;
      this.fxPillSync();
      return b;
    }
    fxPillSync() {
      const b = this._fxPill; if (!b) return;
      b.hidden = !this.fxEnabled();
      b.replaceChildren(h('span', { class: 'fx-pill-l', text: VD.t('Stimmeffekt') }), h('b', { text: FXL[this.fxName()]() }), h('i', { 'aria-hidden': 'true', text: '▾' }));
      if (b.hidden) { const m = document.querySelector('.fx-menu'); if (m) m.remove(); }
    }
    fxMenu(anchor) {
      const old = document.querySelector('.fx-menu');
      if (old) { old.remove(); anchor.setAttribute('aria-expanded', 'false'); if (old._for === anchor) return; }
      const cur = this.fxName();
      const close = () => { menu.remove(); anchor.setAttribute('aria-expanded', 'false'); document.removeEventListener('pointerdown', away, true); document.removeEventListener('keydown', key, true); window.removeEventListener('resize', close); };
      const away = (e) => { if (!menu.contains(e.target) && !anchor.contains(e.target)) close(); };
      const key = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); anchor.focus(); } };
      const menu = h('div', { class: 'lang-menu fx-menu', role: 'menu' }, ...FX_ORDER.map((n) => h('button', { type: 'button', role: 'menuitemradio', 'aria-checked': String(n === cur), class: 'lang-opt' + (n === cur ? ' on' : ''), onclick: () => { close(); this.fx('tap'); this.setFx(n); } },
        h('span', { text: FXL[n]() }), h('span', { class: 'lang-opt-ck', text: n === cur ? '✓' : '' }))));
      menu._for = anchor;
      document.body.append(menu);
      anchor.setAttribute('aria-expanded', 'true');
      const r = anchor.getBoundingClientRect(), mw = menu.offsetWidth, mh = menu.offsetHeight;
      const left = Math.max(8, Math.min(innerWidth - mw - 8, r.left + r.width / 2 - mw / 2));
      const top = r.top - mh - 6 >= 8 ? r.top - mh - 6 : Math.min(innerHeight - mh - 8, r.bottom + 6);
      menu.style.left = left + 'px'; menu.style.top = Math.max(8, top) + 'px';
      document.addEventListener('pointerdown', away, true); document.addEventListener('keydown', key, true); window.addEventListener('resize', close);
      const on = menu.querySelector('.on') || menu.firstChild; if (on) on.focus({ preventScroll: true });
    }

    /* ---------- Countdown vor der Aufnahme: Einstellung auf der Startseite (pro Gerät, Standard: aus) ---------- */
    showCount(u, n) {
      if (!u.screen) return;
      let el = u.count;
      if (n == null) { if (el) { el.remove(); u.count = null; } return; }
      if (!el) { el = u.count = h('div', { class: 'dp-count', 'aria-live': 'polite' }); u.screen.append(el); }
      el.replaceChildren(h('b', { text: String(n) }));   // neues Element, damit die kleine Einblend-Animation jedes Mal neu startet
    }

    /* Zählt von secs bis 1 herunter (ein Ton und ein kurzes Vibrieren pro Sekunde), dann der höhere Start-Ton. Liefert
       true, wenn die Aufnahme jetzt beginnen darf, false bei Abbruch (Knopf, Seite im Hintergrund, anderer Bildschirm).
       true kommt erst, wenn der Start-Ton verklungen ist: Erst danach setzt doRecord() die Aufnahme-Marke, so landet
       nichts vom Countdown in der Aufnahme (auch nicht über den Lautsprecher). */
    countdown(u, secs) {
      return new Promise((resolve) => {
        let n = secs, timer = null, done = false;
        const onVis = () => { if (document.hidden) cancel(); };
        const end = (ok) => {
          if (done) return; done = true;
          clearTimeout(timer); document.removeEventListener('visibilitychange', onVis);
          if (this._cdCancel === cancel) this._cdCancel = null;
          this.showCount(u, null);
          resolve(ok);
        };
        const cancel = () => { end(false); if (this.ui === u && this.busy === 'cd') this.setBusy(null); };
        this._cdCancel = cancel;
        document.addEventListener('visibilitychange', onVis);
        this.setBusy('cd'); u.status.textContent = '';
        const step = () => {
          if (done) return;
          if (n > 0) {
            this.showCount(u, n); this.fx('tick'); VD.vibrate(15);
            n--; timer = setTimeout(step, 1000);
          } else {
            this.showCount(u, null); this.fx('go'); VD.vibrate(30);
            const outMs = Math.min(600, Math.round(((VD.audio.ctx && VD.audio.ctx.outputLatency) || 0) * 1000));
            timer = setTimeout(() => { if (this.busy === 'cd') { this.setBusy(null); end(true); } else end(false); }, 420 + outMs);   // Ton + Ausgabeverzögerung abwarten
          }
        };
        step();
      });
    }

    async finishRecord(manual) {
      if (this.busy !== 'rec' || this.stopping) return;
      this.stopping = true;
      clearInterval(this._lvl);
      this.stopPlayback();
      const u = this.ui, line = u.line;
      const sr = this.mic.sr;
      const latMs = this.micLatencyMs();
      await VD.sleep(latMs + 30);                       // kurz warten, bis die verzögerten Samples da sind
      const lat = Math.round((latMs / 1000) * sr);
      const end = Math.min(this.mic.mark(), this.recMark + Math.round(this.recDur * sr) + lat);
      const raw = this.mic.slice(this.recMark + lat, end);
      u.status.textContent = VD.t('Verarbeite …');
      try {
        const res = await VD.audio.resample(raw, sr, SR);
        const n = A.normalize(res, SR, { targetDb: G.voiceTargetDb });
        const pad = Math.round((this.recShift || 0) * SR);
        if (pad > 0) { const d = new Float32Array(pad + n.data.length); d.set(n.data, pad); n.data = d; }
        const take = await this.buildTake(line, n.data, this.recShift || 0, n.gainDb, n.silent, this.fxName());
        this.takes.set(line.i, take); this.saveTake(line.i, take);
        if (this.wv && this.ui === u) { this.wv.mine = this.peaksOf(take.data, line); this.waveRender(); }
      } catch (e) {
        console.error(e); VD.toast(VD.t('Aufnahme konnte nicht verarbeitet werden'), 'warn');
      }
      this.stopping = false;
      if (this.ui !== u) return;                        // inzwischen woanders
      this.setBusy(null);
      const t = this.takes.get(line.i);
      u.status.textContent = !t ? VD.t('Die Aufnahme hat nicht geklappt. Versuche es nochmal.')
        : t.silent ? VD.t('Ich habe fast nichts gehört. Sprich näher ans Mikro und nimm nochmal auf.')
        : this.syncInfo(t);
      this.sendProg('idle');
      this.fx('submit');
      if (manual) VD.vibrate(10);
    }

    /* ---------- Wellenform: Original (lila) und eigene Aufnahme (grün) ---------- */
    peaksOf(data, line) {
      const N = 160, total = line.s1 - line.s0, out = new Array(N).fill(0), per = (total * SR) / N;
      let mx = 0;
      for (let b = 0; b < N; b++) {
        const i0 = Math.floor(b * per), i1 = Math.min(data.length, Math.floor((b + 1) * per));
        let m = 0; for (let i = i0; i < i1; i++) { const v = Math.abs(data[i]); if (v > m) m = v; }
        out[b] = m; if (m > mx) mx = m;
      }
      return out.map((v) => (mx > 0.002 ? v / mx : 0));
    }
    /* Der Positionsstrich ist ein eigenes Element und gleitet per CSS (das erledigt die Grafikkarte, so wie beim Balken
       unter dem Bild). Beim Anhören des eigenen Takes muss deshalb gar nichts mehr pro Bild gezeichnet werden; während
       der Aufnahme wird nur die wachsende eigene Kurve nachgezeichnet, etwa 30 Mal pro Sekunde. */
    waveStart(mode, started, line) {
      const w = this.wv, u = this.ui; if (!w || !u) return;
      const dur = line.s1 - line.s0, lead = Math.max(0, (started.vt0 || line.s0) - line.s0);
      w.mode = mode; w.run = true; w.dur = dur; w.t0 = started.t0 - lead * 1000;
      const p0 = Math.min(1, Math.max(0, (performance.now() - w.t0) / 1000 / dur));
      const el = u.pos;
      el.style.transition = 'none'; el.style.transform = `translateX(${p0 * 100}%)`; el.hidden = false;
      void el.offsetWidth;
      el.style.transition = `transform ${Math.max(0, dur * (1 - p0))}s linear`; el.style.transform = 'translateX(100%)';
      if (mode !== 'rec') { this.waveRender(); return; }
      w.lat = (this.micLatencyMs() + 10) / 1000; w.mine = new Array(160).fill(0); w.raw = new Array(160).fill(0); w.rmax = 0; w.lastB = -1;
      if (this.mic && this.mic.takePeak) this.mic.takePeak();   // alten Höchstwert verwerfen
      // Zeitgeber statt „jedes Bild“: So entsteht nur dann ein neues Bild, wenn auch wirklich neu gezeichnet wird
      const tick = () => {
        if (!w.run || this.wv !== w) return;
        if (this.mic) {
          // Wie nach der Aufnahme: auf den lautesten Moment normiert, frühere Balken passen sich mit an
          // Das Mikrofon meldet mit Verzögerung: Der Pegel gehört zu einem früheren Zeitpunkt (so wie bei der fertigen Aufnahme)
          const tPos = Math.max(0, ((performance.now() - w.t0) / 1000 - w.lat) / dur);
          const b = Math.min(159, Math.floor(tPos * 160)); const pk = (this.mic.takePeak ? this.mic.takePeak() : this.mic.peak) || 0;
          // alle Balken seit dem letzten Schritt füllen (bei kurzen Zeilen liegen mehrere dazwischen), sonst entstünden Lücken
          for (let k = w.lastB < 0 ? b : Math.min(b, w.lastB + 1); k <= b; k++) if (pk > w.raw[k]) w.raw[k] = pk;
          w.lastB = b;
          if (pk > w.rmax) w.rmax = pk;
          const ref = Math.max(w.rmax, 0.01);
          for (let k = 0; k < 160; k++) w.mine[k] = Math.min(1, w.raw[k] / ref);
        }
        this.waveRender();
        w.timer = setTimeout(tick, 33);
      };
      w.timer = setTimeout(tick, 33);
    }
    waveStop() {
      const w = this.wv; if (!w) return;
      w.run = false; clearTimeout(w.timer);
      const el = this.ui && this.ui.pos;
      if (el) { el.style.transition = 'none'; el.hidden = true; }
      this.waveRender();
    }
    /* Zeichnet die Wellenform. Was sich nicht bewegt (Hintergrund, Original und – außer während der Aufnahme – die eigene
       Aufnahme), wird einmal auf eine zweite Zeichenfläche gemalt und danach nur noch kopiert. Neu gezeichnet wird nur
       während der Aufnahme die wachsende eigene Kurve. Der Positionsstrich liegt als eigenes Element darüber. */
    waveRender() {
      const w = this.wv, c = this.ui && this.ui.live;
      if (!w || !c || !c.isConnected) return;
      const dpr = window.devicePixelRatio || 1, cw = c.clientWidth, ch = c.clientHeight;
      if (!cw || !ch) return;
      const W = Math.round(cw * dpr), H = Math.round(ch * dpr);
      let redraw = false;
      if (c.width !== W || c.height !== H) { c.width = W; c.height = H; redraw = true; }
      const wc = VD.waveColors();
      const mid = ch / 2;
      const area = (g, arr, fill, stroke) => {
        if (!arr || !arr.length) return;
        const n = arr.length;
        g.beginPath(); g.moveTo(0, mid);
        for (let i = 0; i < n; i++) g.lineTo(((i + 0.5) / n) * cw, mid - Math.max(1, arr[i] * (mid - 3)));
        g.lineTo(cw, mid);
        for (let i = n - 1; i >= 0; i--) g.lineTo(((i + 0.5) / n) * cw, mid + Math.max(1, arr[i] * (mid - 3)));
        g.closePath(); g.fillStyle = fill; g.fill(); g.strokeStyle = stroke; g.lineWidth = 1; g.stroke();
      };
      const live = !!w.run && w.mode === 'rec';   // eigene Kurve ändert sich gerade laufend
      const key = W + 'x' + H + (live ? 'L' : 'S') + VD.theme.get();
      if (w.cacheKey !== key || (!live && w.cacheMine !== w.mine)) {
        const off = w.cache || (w.cache = document.createElement('canvas'));
        off.width = W; off.height = H;
        const og = off.getContext('2d'); og.setTransform(dpr, 0, 0, dpr, 0, 0);
        og.fillStyle = wc.bg; og.fillRect(0, 0, cw, ch);
        area(og, w.orig, wc.a, wc.aLine);
        if (!live) area(og, w.mine, wc.b, wc.bLine);
        w.cacheKey = key; w.cacheMine = w.mine; redraw = true;
      }
      if (!live && !redraw) return;   // nichts hat sich geändert
      const g = c.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); g.drawImage(w.cache, 0, 0);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (live) area(g, w.mine, wc.b, wc.bLine);
    }

    micLatencyMs() {
      const extra = this.mic.extraLatencyMs || 0;   // Rauschunterdrückung verzögert um ca. 20 ms
      try {
        const t = this.mic.stream.getAudioTracks()[0];
        const l = t && t.getSettings && t.getSettings().latency;
        if (typeof l === 'number' && l > 0 && l < 0.5) return Math.round(l * 1000) + extra;
      } catch { /* ignore */ }
      return DEFAULT_LAT_MS + extra;
    }

    async doTake() {
      if (this.busy === 'take') { this.stopPlayback(); this.setBusy(null); return; }
      const u = this.ui, line = u.line, t = this.takes.get(line.i);
      if (!t) return;
      this.stopPlayback();
      this.setBusy('take');
      u.status.textContent = '';
      const st = await this.playSeg(line, { audio: VD.audio.fromFloat(t.data, SR), subtitle: false, onEnd: () => { this.stopPlayback(); this.setBusy(null); } });
      if (st) this.waveStart('take', st, line);
    }

    /* ---------- Weiter / Zurück / Fertig ---------- */
    go(d) {
      if (this.busy) return;
      const u = this.ui;
      const t = this.takes.get(u.line.i);
      if (d > 0) {
        if (!t) return;
        this.uploadTake(u.line.i, t);
        if (this.cur >= this.lines.length - 1) { this.finish(); return; }
        this.cur++; this.fx('click'); this.showLine();
      } else if (this.cur > 0) {
        if (t) this.uploadTake(u.line.i, t);
        this.cur--; this.fx('click'); this.showLine();
      }
    }

    /* Jeder Take wird nur einmal geschickt; eine neue Aufnahme ist ein neues Objekt mit sent: false.
       force: nach einem Verbindungsabbruch alles noch einmal schicken. */
    uploadTake(i, t, force) {
      if (!this.link || (t.sent && !force)) return;
      t.sent = true;
      this.link.sendBlob('take', { i, sr: SR }, new Uint8Array(VD.f32ToI16(t.data).buffer));
    }

    finish() {
      this.stopAll();
      this.finished = true;
      this.send({ t: 'done' });
      this.sendProg('done');
      this.saveState();
      this.setView('submitted', () => this.vSubmitted(), true);
      this.fx('fanfare'); VD.vibrate(30);
    }

    vSubmitted() {
      this._roster = h('div', { class: 'roster' });
      const edit = h('button', { class: 'btn ghost', onclick: () => { this.send({ t: 'undone' }); this.cur = 0; this.showLine(); } }, VD.t('Nochmal bearbeiten'));
      const el = h('section', { class: 'pc-view center' }, h('div', { class: 'check-pop' }, '✓'), h('h2', { text: VD.t('Abgegeben!') }),
        h('p', { class: 'lead', id: 'wait-n', text: VD.t('Warte auf die anderen …') }), this._roster, edit);
      requestAnimationFrame(() => this.updateRoster());
      return el;
    }
    /* Zuschauen: Fortschritt der anderen, wie nach dem Abgeben */
    vSpectate(m) {
      this._roster = h('div', { class: 'roster' });
      const el = h('section', { class: 'pc-view center' }, h('h2', { text: VD.t(m.title || 'Gleich bist du dabei') }),
        h('p', { class: 'lead', text: m.text ? VD.t(m.text) : '' }), h('p', { class: 'hint', id: 'wait-n', text: '' }), this._roster);
      requestAnimationFrame(() => this.updateRoster());
      return el;
    }
    updateRoster() {
      if (!this._roster || !this._roster.isConnected) return;
      const open = this.roster.filter((p) => !p.done).length;
      const w = VD.$('#wait-n', this.body); if (w) w.textContent = this.roster.length ? (open ? VD.t('Warte noch auf {n} Spieler …', { n: open }) : VD.t('Alle sind fertig!')) : VD.t('Warte auf die anderen …');
      this._roster.replaceChildren(...this.roster.map((p) => h('div', { class: 'ro-card' + (p.done ? ' done' : ''), style: { '--c': p.color } },
        VD.ui.avatar(p, 'lg'), h('b', { text: p.pid === this.profile.pid ? VD.t('{name} (du)', { name: p.name }) : p.name }),
        h('small', { text: p.done ? VD.t('✓ Fertig') : VD.t('Zeile {c}/{t}', { c: p.cur, t: p.total }) }))));
    }

    sendProg(st) {
      if (!this.lines.length) return;
      this.send({ t: 'prog', cur: this.cur + 1, st: st || 'idle' });
    }

    vFinal() {
      this.fin = null;
      if (!this.local && this.scene && this.scene.watch && !this.mix) {
        return h('section', { class: 'pc-view center' }, h('div', { class: 'medal', text: '🎬' }), h('h1', { text: VD.t('Premiere!') }),
          h('p', { class: 'lead', text: VD.t('Das Ergebnis wird gerade auf dein Gerät geladen …') }), h('p', { class: 'hint', text: VD.t('Bis dahin läuft es beim Host auf dem Bildschirm.') }));
      }
      if (this.local || !this.mix || !this.scene) {
        return h('section', { class: 'pc-view center' }, h('div', { class: 'medal', text: '🎬' }), h('h1', { text: VD.t('Premiere!') }),
          h('p', { class: 'lead', text: this.local ? VD.t('Die Szene läuft auf diesem Bildschirm.') : VD.t('Die Szene läuft beim Host auf dem Bildschirm.') }),
          h('p', { class: 'hint', text: VD.t('Der Host führt euch danach zurück in die Lobby.') }));
      }
      const first = this.lines.find((l) => l.img), stillSrc = first ? first.img : this.stillUrl;
      const still = h('img', { class: 'dp-still', alt: '', src: stillSrc || '' }); if (!stillSrc) still.hidden = true;
      let video = null;
      if (this.videoUrl) { video = this.vEl || (this.vEl = VD.Video.create(this.videoUrl, this.videoMime, 'dp-video')); video.hidden = true; }
      const bar = h('i', { class: 'dp-barfill' });
      const status = h('p', { class: 'hint dp-status', text: '' });
      this.fin = { still, video, bar, status };
      const screen = h('div', { class: 'dp-screen' }, still, video, h('div', { class: 'dp-bar' }, bar));
      this.fitScreen(screen, video);
      return h('section', { class: 'pc-view dub-play' },
        h('div', { class: 'dp-head' }, h('b', { class: 'dp-title', text: this.scene.title }), h('span', { class: 'dp-n', text: VD.t('Premiere').toUpperCase() })),
        screen,
        status,
        VD.Export.buttons(() => this.mix ? { videoUrl: this.videoUrl, mime: this.videoMime, f32: this.mix.getChannelData(0), sr: this.mix.sampleRate, title: this.scene.title } : null),
        h('p', { class: 'hint', text: VD.t('Der Host startet gemeinsame Wiederholungen und führt euch danach zurück in die Lobby.') }));
    }
    /* Gemeinsamer Start vom Host */
    onReplay(inMs) {
      const f = this.fin; if (!f || this.viewKey !== 'final' || !this.mix) return;
      this.stopPremiere();
      f.status.textContent = VD.t('Gleich geht es los …');
      clearTimeout(this.replayTimer);
      this.playPremiere(inMs);
      this.replayTimer = setTimeout(() => { if (this.fin === f) f.status.textContent = ''; }, inMs);
    }
    async playPremiere(inMs) {
      const f = this.fin; if (!f || this.viewKey !== 'final' || !this.mix) return;
      if (this.finPlaying) return;
      this.finPlaying = true;
      const token = (this.finToken = (this.finToken || 0) + 1);
      const dur = this.mix.duration;
      try {
        if (f.video) {
          const sync = await VD.Video.syncPlay(f.video, 0, (off, delay) => (this.finAudio = VD.audio.play(this.mix, { gain: 0.95, delay, offset: Math.min(off, dur - 0.01) })), inMs != null ? { inMs } : {});
          this.finSync = sync;
          if (token !== this.finToken) { sync.stop(); return; }
          VD.Video.frameReady(f.video, sync.vt0 || 0).then(() => { if (token === this.finToken) { f.video.hidden = false; f.still.hidden = true; } });
        }
      } catch (e) { console.warn('Video startet nicht', e); }
      if (token !== this.finToken) return;
      if (!this.finAudio) this.finAudio = VD.audio.play(this.mix, { gain: 0.95, delay: inMs != null ? Math.max(0.02, inMs / 1000) : 0.02 });
      f.bar.style.transition = 'none'; f.bar.style.transform = 'scaleX(0)'; void f.bar.offsetWidth;
      f.bar.style.transition = `transform ${dur}s linear`; f.bar.style.transform = 'scaleX(1)';
      this.finTimer = setTimeout(() => { if (token === this.finToken) this.stopPremiere(true); }, dur * 1000 + 300);
    }
    stopPremiere(ended) {
      this.finToken = (this.finToken || 0) + 1; this.finPlaying = false;
      if (this.finSync) { this.finSync.stop(); this.finSync = null; }
      clearTimeout(this.finTimer);
      if (this.finAudio) { try { this.finAudio.stop(); } catch { /* ignore */ } this.finAudio = null; }
      const f = this.fin; if (!f) return;
      if (f.video) { try { f.video.pause(); } catch { /* ignore */ } }
      if (ended && f.status) f.status.textContent = '';
      f.bar.style.transition = 'none'; f.bar.style.transform = 'scaleX(0)';
    }

    destroy() {
      this.destroyed = true;
      this.pvc.close();
      this.stopAll();
      clearTimeout(this.replayTimer); this.stopPremiere();
      clearInterval(this._lvl); clearTimeout(this._mtimer);
      document.removeEventListener('vt-theme', this._onRedraw);
      window.removeEventListener('resize', this._onRedraw);
      if (!this.local) VD.wake.off();
    }
  };
})();
