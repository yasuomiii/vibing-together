/* Dub-Pack-Ersteller: baut aus einem Video einen Pack im selben Format wie die Community-Packs (siehe js/packs.js).
   Alles läuft im Browser, nichts wird hochgeladen. Nur die Texterkennung lädt beim ersten Mal ein Modell aus dem Internet.

   Zwei Wege, beide führen zum gleichen Pack:
     Weg 1  Lokal: Texterkennung (Whisper) im Browser, Hintergrund = Original ohne Sprechstellen. Einfach, aber langsamer und weniger genau.
     Weg 2  Selbst mit externen Seiten/Programmen: Untertitel (.srt/.vtt), Stimmenspur und Hintergrundspur selbst erzeugen und hier laden.

   Entfernen: js/maker.js löschen, die Zeile <script src="js/maker.js"> und den Knopf #btn-maker samt <section id="v-maker"> in index.html
   entfernen (oder in js/config.js maker.enabled auf false setzen). Das Spiel selbst braucht diese Datei nicht. */
(function () {
  const VD = (window.VD = window.VD || {});
  const h = VD.h;
  const t = (k, p) => VD.t(k, p);
  const CFG = (window.VD_CONFIG && window.VD_CONFIG.maker) || {};

  /* Englische Texte. Andere Sprachen zeigen für diesen Bereich Englisch. */
  VD.addLang('en', {
    'Dub-Pack erstellen': 'Create a dub pack',
    'Zurück': 'Back',
    'Baue aus einem Video deinen eigenen Dub-Pack. Alles bleibt auf deinem Gerät.': 'Turn a video into your own dub pack. Everything stays on your device.',
    'Weg 1: Alles im Browser': 'Way 1: Everything in the browser',
    'Einfach und privat, aber langsamer und weniger genau. Am PC empfohlen.': 'Simple and private, but slower and less accurate. Recommended on a PC.',
    'Weg 2: Mit externen Seiten': 'Way 2: With outside sites',
    'Schneller und meist besser. Du bereitest Text und Ton selbst vor und lädst sie hier hoch.': 'Faster and usually better. You prepare text and audio yourself and load them here.',
    'So geht Weg 1': 'How Way 1 works',
    'So geht Weg 2': 'How Way 2 works',
    'Video wählen: am besten eine kurze Szene (20 bis 90 Sekunden) als mp4 oder webm.': 'Pick a video: ideally a short scene (20 to 90 seconds) as mp4 or webm.',
    'Bei „Zeilen“ auf „Automatisch erkennen“ drücken. Beim ersten Mal lädt der Browser ein Modell (40 bis 250 MB, danach gespeichert). Das dauert, besonders am Handy.': 'Under “Lines” press “Detect automatically”. The first time, the browser downloads a model (40 to 250 MB, saved afterwards). This takes a while, especially on a phone.',
    'Text und Zeiten prüfen und korrigieren. Mit ▶ hörst du jede Zeile an.': 'Check and fix the text and times. Use ▶ to listen to each line.',
    'Jeder Zeile einen Charakter geben.': 'Give each line a character.',
    'Beim Hintergrund bleibt „Original ohne Sprechstellen“. Die Stimmen werden hier nicht per KI entfernt, sondern an den Sprechstellen stummgeschaltet. Dort fehlt dann auch die Musik.': 'For the background, keep “Original without speech”. Voices are not removed by AI here, they are muted where people speak. Music is missing there too.',
    'Pack bauen und entweder gleich im Spiel verwenden oder als ZIP speichern.': 'Build the pack and either use it in the game right away or save it as a ZIP.',
    'Die Szene als Videodatei bereitlegen (mp4 oder webm).': 'Have the scene ready as a video file (mp4 or webm).',
    'Den Ton der Szene als Audiodatei herausziehen (zum Beispiel mit VLC oder Audacity) und in einen Stimmentrenner geben. Das ist ein Programm oder eine Seite, die Stimmen und Musik trennt, zum Beispiel Ultimate Vocal Remover (läuft kostenlos auf deinem PC) oder ein Online-Vocal-Remover. Du bekommst zwei Dateien: nur Stimmen und nur Hintergrund.': 'Extract the sound of the scene as an audio file (for example with VLC or Audacity) and put it into a stem splitter. That is a program or site that separates voices from music, for example Ultimate Vocal Remover (free, runs on your PC) or an online vocal remover. You get two files: voices only and background only.',
    'Untertitel erzeugen lassen, zum Beispiel mit einem Whisper-Programm wie Buzz (kostenlos, läuft auf deinem PC) oder Subtitle Edit. Ergebnis: eine .srt-Datei.': 'Have subtitles generated, for example with a Whisper program such as Buzz (free, runs on your PC) or Subtitle Edit. Result: an .srt file.',
    'Hier das Video laden, bei „Zeilen“ die .srt-Datei importieren, bei „Ton“ Stimmenspur und Hintergrundspur laden.': 'Load the video here, import the .srt file under “Lines”, and load the voices file and background file under “Sound”.',
    'Dienste und Programme ändern sich. Prüfe selbst, ob sie noch kostenlos sind und was mit deinen Dateien passiert. Nutze nur Material, das du verwenden darfst.': 'Services and programs change. Check for yourself whether they are still free and what happens to your files. Only use material you are allowed to use.',
    '1  Video': '1  Video',
    'Videodatei wählen': 'Choose video file',
    'Dein Browser muss das Video abspielen können (mp4 oder webm). Das Video wird unverändert in den Pack gelegt, am besten unter 100 MB.': 'Your browser must be able to play the video (mp4 or webm). The video goes into the pack unchanged, ideally under 100 MB.',
    'Titel des Packs': 'Pack title',
    'Dein Name (optional)': 'Your name (optional)',
    'Dauer {d} s': 'Length {d} s',
    'Ton wird gelesen …': 'Reading the sound …',
    'Der Browser kann den Ton dieses Videos nicht lesen. Lade bei „Ton“ eine eigene Stimmenspur.': 'The browser cannot read this video’s sound. Load your own voices file under “Sound”.',
    'Dieses Video kann der Browser nicht abspielen. Nimm mp4 (H.264) oder webm.': 'The browser cannot play this video. Use mp4 (H.264) or webm.',
    '2  Zeilen': '2  Lines',
    'Jede Zeile ist ein Satz, den die Spieler einsprechen. Start und Ende in Sekunden.': 'Each line is a sentence the players will record. Start and end in seconds.',
    'Automatisch erkennen': 'Detect automatically',
    'Vorhandene Zeilen ersetzen?': 'Replace existing lines?',
    'Genauigkeit': 'Accuracy',
    'Schnell, ca. 40 MB': 'Fast, about 40 MB',
    'Ausgewogen, ca. 80 MB': 'Balanced, about 80 MB',
    'Genau, ca. 250 MB, langsam': 'Accurate, about 250 MB, slow',
    'Sprache im Video': 'Language in the video',
    'Automatisch': 'Automatic',
    'Untertitel importieren (.srt, .vtt)': 'Import subtitles (.srt, .vtt)',
    'Zeile bei {s} s hinzufügen': 'Add line at {s} s',
    'Nach Zeit sortieren': 'Sort by time',
    'Noch keine Zeilen. Erkenne sie automatisch, importiere Untertitel oder füge sie von Hand hinzu.': 'No lines yet. Detect them automatically, import subtitles or add them by hand.',
    'Lade Modell … {p} %': 'Loading model … {p} %',
    'Erkenne Sprache … das kann einige Minuten dauern.': 'Recognising speech … this can take a few minutes.',
    'Bereite Ton vor …': 'Preparing the sound …',
    'Erkennung fehlgeschlagen: {e}': 'Detection failed: {e}',
    'Die Texterkennung braucht Internet für das Modell und darf Dateien von cdn.jsdelivr.net und huggingface.co laden.': 'Speech detection needs the internet for the model and may load files from cdn.jsdelivr.net and huggingface.co.',
    '{n} Zeilen erkannt. Bitte prüfen.': '{n} lines detected. Please check them.',
    '{n} Zeilen importiert.': '{n} lines imported.',
    'In der Datei wurden keine Zeilen gefunden.': 'No lines were found in the file.',
    'Zeile anhören': 'Listen to line',
    'Zeile löschen': 'Delete line',
    'Start': 'Start',
    'Ende': 'End',
    'Text': 'Text',
    'Charakter': 'Character',
    'Auf die aktuelle Position im Video setzen': 'Set to the current video position',
    '3  Charaktere': '3  Characters',
    'So heißen die Rollen im Spiel. Jede Zeile gehört zu einem Charakter.': 'These are the roles in the game. Each line belongs to one character.',
    'Charakter hinzufügen': 'Add character',
    'Zeilen abwechselnd verteilen': 'Share lines out in turn',
    'Charakter entfernen': 'Remove character',
    'Sprecher {n}': 'Speaker {n}',
    '4  Ton': '4  Sound',
    'Stimmen der Zeilen': 'Voices of the lines',
    'Aus dem Video': 'From the video',
    'Eigene Stimmenspur': 'My own voices file',
    'Hintergrund (Musik und Geräusche)': 'Background (music and noises)',
    'Original ohne Sprechstellen': 'Original without speech',
    'Eigene Hintergrundspur': 'My own background file',
    'Keiner': 'None',
    'Das Original wird an den Stellen stummgeschaltet, an denen gesprochen wird. Dort fehlt auch die Musik. Mit einer eigenen Hintergrundspur (Weg 2) klingt es besser.': 'The original is muted wherever people speak. Music is missing there too. A background file of your own (Way 2) sounds better.',
    'Die Szene hat dann nur die Stimmen der Spieler.': 'The scene then has only the players’ voices.',
    'Nur Stimmen, ohne Musik. Dann sind die Original-Zeilen sauberer. Die Datei muss gleich lang sein wie das Video und gleich beginnen.': 'Voices only, no music. The original lines are cleaner then. The file must be as long as the video and start at the same moment.',
    'Nur Musik und Geräusche, ohne Stimmen. Die Datei muss gleich lang sein wie das Video und gleich beginnen.': 'Music and noises only, no voices. The file must be as long as the video and start at the same moment.',
    'Audiodatei wählen': 'Choose audio file',
    'Datei kann nicht gelesen werden: {n}': 'Cannot read the file: {n}',
    '5  Pack': '5  Pack',
    'Pack bauen': 'Build pack',
    'Im Spiel verwenden': 'Use in the game',
    'ZIP speichern': 'Save ZIP',
    'Der Pack ist fertig. Du kannst ihn gleich im Spiel verwenden oder als ZIP speichern.': 'The pack is ready. You can use it in the game right away or save it as a ZIP.',
    'Der Pack liegt jetzt in deiner Pack-Liste. Erstelle einen Raum, dann kannst du ihn auswählen.': 'The pack is now in your pack list. Create a room and you can pick it.',
    'Bitte zuerst ein Video wählen.': 'Please choose a video first.',
    'Es gibt noch keine Zeilen.': 'There are no lines yet.',
    'Zeile {n}: Das Ende muss nach dem Start liegen.': 'Line {n}: the end must be after the start.',
    'Zeile {n}: Der Start liegt hinter dem Ende des Videos.': 'Line {n}: the start is after the end of the video.',
    'Zeile {n}: Bitte einen Text eintragen.': 'Line {n}: please enter a text.',
    'Kein Ton vorhanden. Lade bei „Ton“ eine Stimmenspur.': 'No sound available. Load a voices file under “Sound”.',
    'Baue Zeile {n}/{total} …': 'Building line {n}/{total} …',
    'Baue Hintergrund …': 'Building the background …',
    'Packe alles zusammen … {p} %': 'Packing everything … {p} %',
    'Bau fehlgeschlagen: {e}': 'Build failed: {e}',
    'Das Video hat ein Format, das der Pack nicht kennt (mp4, webm).': 'The video has a format the pack does not know (mp4, webm).'
  });

  /* ------------------------------------------------------------------ Helfer */
  const TAIL = 0.15;                 // so viel Ton läuft nach dem Ende einer Zeile mit (Ausklang)
  const CLIP_SR = 32000;             // Abtastrate der Zeilen und der Hintergrundspur im Pack
  const MIN_LEN = 0.3;
  const fmt = (s) => (Math.round(s * 100) / 100).toString();
  const slug = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  const safeName = (s) => (String(s || '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '').replace(/\s+/g, ' ').trim().slice(0, 60)) || 'Dub-Pack';
  const clamp = VD.clamp;

  function wavBlob(chans, sr) {
    const nCh = chans.length, n = chans[0].length, buf = new ArrayBuffer(44 + n * nCh * 2), dv = new DataView(buf);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); dv.setUint32(4, 36 + n * nCh * 2, true); w(8, 'WAVEfmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, nCh, true);
    dv.setUint32(24, sr, true); dv.setUint32(28, sr * nCh * 2, true); dv.setUint16(32, nCh * 2, true); dv.setUint16(34, 16, true); w(36, 'data'); dv.setUint32(40, n * nCh * 2, true);
    let o = 44;
    for (let i = 0; i < n; i++) for (let c = 0; c < nCh; c++) { const v = clamp(chans[c][i], -1, 1); dv.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true); o += 2; }
    return new Blob([buf], { type: 'audio/wav' });
  }

  const monoOf = (buf, t0, t1) => {
    const sr = buf.sampleRate, i0 = clamp(Math.floor(t0 * sr), 0, buf.length), i1 = clamp(Math.ceil(t1 * sr), i0 + 1, buf.length);
    const out = new Float32Array(i1 - i0);
    for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = 0; i < out.length; i++) out[i] += d[i0 + i] / buf.numberOfChannels; }
    return out;
  };

  /* Ein Standbild aus dem Video (JPEG) */
  async function frameAt(url, time, maxW, square) {
    const v = document.createElement('video');
    v.muted = true; v.preload = 'auto'; v.playsInline = true; v.src = url;
    await new Promise((res, rej) => { v.onloadeddata = res; v.onerror = () => rej(new Error('video')); setTimeout(() => rej(new Error('video')), 15000); });
    v.currentTime = clamp(time, 0, Math.max(0, (v.duration || 1) - 0.05));
    await new Promise((res) => { v.onseeked = res; setTimeout(res, 4000); });
    const w0 = v.videoWidth || 640, h0 = v.videoHeight || 480;
    const c = document.createElement('canvas');
    const g = c.getContext('2d');
    if (square) {
      const s = Math.min(w0, h0); c.width = c.height = maxW;
      g.drawImage(v, (w0 - s) / 2, (h0 - s) / 2, s, s, 0, 0, maxW, maxW);
    } else {
      const k = Math.min(1, maxW / w0); c.width = Math.round(w0 * k); c.height = Math.round(h0 * k);
      g.drawImage(v, 0, 0, c.width, c.height);
    }
    const blob = await new Promise((res) => c.toBlob(res, square ? 'image/png' : 'image/jpeg', 0.84));
    v.removeAttribute('src'); v.load();
    return blob;
  }

  /* Untertitel (.srt / .vtt) -> Zeilen */
  function parseSubs(text) {
    const lines = [];
    const tm = (s) => { const m = s.trim().replace(',', '.').match(/^(?:(\d+):)?(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?$/); return m ? (+(m[1] || 0)) * 3600 + (+m[2]) * 60 + (+m[3]) + (m[4] ? +('0.' + m[4].padEnd(3, '0')) : 0) : null; };
    const blocks = String(text).replace(/^﻿/, '').replace(/\r/g, '').split(/\n{2,}/);
    for (const b of blocks) {
      const ls = b.split('\n').filter((x) => x.trim() !== '');
      const i = ls.findIndex((x) => x.includes('-->'));
      if (i < 0) continue;
      const [a, rest] = ls[i].split('-->');
      const s = tm(a), e = tm((rest || '').trim().split(/\s+/)[0] || '');
      if (s == null || e == null) continue;
      const txt = ls.slice(i + 1).join(' ').replace(/<[^>]*>/g, '').replace(/\{[^}]*\}/g, '').replace(/^\s*[-–]\s*/, '').replace(/\s+/g, ' ').trim();
      if (txt) lines.push({ start: s, end: e, text: txt });
    }
    return lines;
  }

  /* Texterkennung. Läuft in einem Worker, damit die Seite bedienbar bleibt. Das Modell kommt beim ersten Mal aus dem Internet. */
  let worker = null;
  function runWorker(msg, transfer, onProgress) {
    if (!worker) {
      const code = `let asr = null, key = '';
self.onmessage = async (e) => {
  const m = e.data;
  try {
    const lib = await import(m.url);
    lib.env.allowLocalModels = false;
    if (!asr || key !== m.model) {
      asr = await lib.pipeline('automatic-speech-recognition', m.model, { progress_callback: (p) => self.postMessage({ t: 'progress', p }) });
      key = m.model;
    }
    const opt = { return_timestamps: true, chunk_length_s: 30, stride_length_s: 5, task: 'transcribe' };
    if (m.lang) opt.language = m.lang;
    const out = await asr(m.audio, opt);
    self.postMessage({ t: 'done', chunks: out.chunks || [], text: out.text || '' });
  } catch (err) { self.postMessage({ t: 'error', msg: String((err && err.message) || err) }); }
};`;
      worker = new Worker(URL.createObjectURL(new Blob([code], { type: 'text/javascript' })), { type: 'module' });
    }
    return new Promise((resolve, reject) => {
      worker.onmessage = (e) => {
        const d = e.data;
        if (d.t === 'progress') { onProgress && onProgress(d.p); }
        else if (d.t === 'done') resolve(d);
        else if (d.t === 'error') reject(new Error(d.msg));
      };
      worker.onerror = (e) => reject(new Error(e.message || 'worker'));
      worker.postMessage(msg, transfer);
    });
  }

  async function to16k(buf) {
    const mono = monoOf(buf, 0, buf.duration);
    return VD.audio.resample(mono, buf.sampleRate, 16000);
  }

  async function transcribe(buf, model, lang, onProgress) {
    const a16 = await to16k(buf);
    if (typeof window.__makerFakeAsr === 'function') return window.__makerFakeAsr(a16, { model, lang });   // nur für Tests
    const res = await runWorker({ url: CFG.transformersUrl, model, lang: lang || '', audio: a16 }, [a16.buffer], onProgress);
    return res.chunks;
  }

  /* ------------------------------------------------------------------ Oberfläche */
  const MODELS = CFG.models || [
    { id: 'Xenova/whisper-tiny', label: 'Schnell, ca. 40 MB' },
    { id: 'Xenova/whisper-base', label: 'Ausgewogen, ca. 80 MB' },
    { id: 'Xenova/whisper-small', label: 'Genau, ca. 250 MB, langsam' }
  ];
  const LANGS = [['', 'Automatisch'], ['german', 'Deutsch'], ['english', 'English'], ['spanish', 'Español'], ['french', 'Français'], ['portuguese', 'Português'], ['russian', 'Русский'], ['hindi', 'हिन्दी']];

  VD.Maker = {
    open(root, onBack) {
      const S = {
        file: null, url: '', dur: 0, ext: 'mp4', buf: null, voiceBuf: null, backBuf: null,
        title: '', author: VD.store.get('makerAuthor', ''), chars: [t('Sprecher {n}', { n: 1 }), t('Sprecher {n}', { n: 2 })],
        lines: [], voiceMode: 'video', backMode: 'mute', zip: null, busy: false
      };
      let stopAt = null;
      const R = {};   // Verweise auf Elemente

      const panel = (title, ...kids) => h('section', { class: 'panel mk-panel' }, h('h2', { text: title }), ...kids);
      const note = (s) => h('p', { class: 'muted mk-note', text: s });
      const warn = (box, msg) => { box.textContent = msg || ''; box.hidden = !msg; };
      const field = (label, input) => h('label', { class: 'field' }, h('span', { class: 'field-l', text: label }), input);
      const steps = (arr) => h('ol', { class: 'mk-steps' }, ...arr.map((s) => h('li', { text: t(s) })));

      /* --- Kopf und Einleitung --- */
      R.back = h('button', { class: 'btn link', type: 'button', onclick: () => { cleanup(); onBack && onBack(); } }, '◀ ' + t('Zurück'));
      const intro = h('div', { class: 'mk-intro' },
        h('div', { class: 'mk-way' },
          h('h2', { text: t('Weg 1: Alles im Browser') }), h('p', { class: 'muted', text: t('Einfach und privat, aber langsamer und weniger genau. Am PC empfohlen.') }),
          h('details', {}, h('summary', { text: t('So geht Weg 1') }), steps(['Video wählen: am besten eine kurze Szene (20 bis 90 Sekunden) als mp4 oder webm.',
            'Bei „Zeilen“ auf „Automatisch erkennen“ drücken. Beim ersten Mal lädt der Browser ein Modell (40 bis 250 MB, danach gespeichert). Das dauert, besonders am Handy.',
            'Text und Zeiten prüfen und korrigieren. Mit ▶ hörst du jede Zeile an.', 'Jeder Zeile einen Charakter geben.',
            'Beim Hintergrund bleibt „Original ohne Sprechstellen“. Die Stimmen werden hier nicht per KI entfernt, sondern an den Sprechstellen stummgeschaltet. Dort fehlt dann auch die Musik.',
            'Pack bauen und entweder gleich im Spiel verwenden oder als ZIP speichern.']))),
        h('div', { class: 'mk-way' },
          h('h2', { text: t('Weg 2: Mit externen Seiten') }), h('p', { class: 'muted', text: t('Schneller und meist besser. Du bereitest Text und Ton selbst vor und lädst sie hier hoch.') }),
          h('details', {}, h('summary', { text: t('So geht Weg 2') }), steps(['Die Szene als Videodatei bereitlegen (mp4 oder webm).',
            'Den Ton der Szene als Audiodatei herausziehen (zum Beispiel mit VLC oder Audacity) und in einen Stimmentrenner geben. Das ist ein Programm oder eine Seite, die Stimmen und Musik trennt, zum Beispiel Ultimate Vocal Remover (läuft kostenlos auf deinem PC) oder ein Online-Vocal-Remover. Du bekommst zwei Dateien: nur Stimmen und nur Hintergrund.',
            'Untertitel erzeugen lassen, zum Beispiel mit einem Whisper-Programm wie Buzz (kostenlos, läuft auf deinem PC) oder Subtitle Edit. Ergebnis: eine .srt-Datei.',
            'Hier das Video laden, bei „Zeilen“ die .srt-Datei importieren, bei „Ton“ Stimmenspur und Hintergrundspur laden.']),
          h('p', { class: 'muted mk-note', text: t('Dienste und Programme ändern sich. Prüfe selbst, ob sie noch kostenlos sind und was mit deinen Dateien passiert. Nutze nur Material, das du verwenden darfst.') }))));

      /* --- 1 Video --- */
      R.vWarn = h('p', { class: 'warn', role: 'alert', hidden: true });
      R.vInfo = h('p', { class: 'status' });
      R.video = h('video', { class: 'mk-video', controls: true, playsinline: true, hidden: true });
      R.vFile = h('input', { type: 'file', accept: 'video/*,.mp4,.m4v,.webm,.ogv', hidden: true, onchange: (e) => e.target.files[0] && loadVideo(e.target.files[0]) });
      R.vBtn = h('button', { class: 'btn primary', type: 'button', onclick: () => R.vFile.click() }, t('Videodatei wählen'));
      R.title = h('input', { class: 'inp', maxlength: 60, oninput: (e) => { S.title = e.target.value; } });
      R.author = h('input', { class: 'inp', maxlength: 40, value: S.author, oninput: (e) => { S.author = e.target.value; VD.store.set('makerAuthor', S.author); } });
      const p1 = panel(t('1  Video'), note(t('Dein Browser muss das Video abspielen können (mp4 oder webm). Das Video wird unverändert in den Pack gelegt, am besten unter 100 MB.')),
        h('div', { class: 'row' }, R.vBtn, R.vFile), R.vWarn, R.vInfo, R.video,
        h('div', { class: 'mk-two' }, field(t('Titel des Packs'), R.title), field(t('Dein Name (optional)'), R.author)));

      /* --- 2 Zeilen --- */
      R.status2 = h('p', { class: 'status' });
      R.warn2 = h('p', { class: 'warn', role: 'alert', hidden: true });
      R.model = h('select', { class: 'inp mk-sel' }, ...MODELS.map((m, i) => h('option', { value: m.id, selected: i === 0, text: t(m.label) })));
      R.lang = h('select', { class: 'inp mk-sel' }, ...LANGS.map(([v, l]) => h('option', { value: v, text: v ? l : t(l) })));
      R.detect = h('button', { class: 'btn primary', type: 'button', onclick: () => onDetect() }, t('Automatisch erkennen'));
      R.subFile = h('input', { type: 'file', accept: '.srt,.vtt,.txt,text/vtt', hidden: true, onchange: (e) => e.target.files[0] && importSubs(e.target.files[0]) });
      R.subBtn = h('button', { class: 'btn', type: 'button', onclick: () => R.subFile.click() }, t('Untertitel importieren (.srt, .vtt)'));
      R.addBtn = h('button', { class: 'btn', type: 'button', onclick: () => addLine() }, '');
      R.sortBtn = h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { sortLines(); renderLines(); } }, t('Nach Zeit sortieren'));
      R.list = h('div', { class: 'mk-lines' });
      const p2 = panel(t('2  Zeilen'), note(t('Jede Zeile ist ein Satz, den die Spieler einsprechen. Start und Ende in Sekunden.')),
        h('div', { class: 'mk-tools' }, field(t('Genauigkeit'), R.model), field(t('Sprache im Video'), R.lang)),
        h('div', { class: 'row' }, R.detect, R.subBtn, R.subFile, R.addBtn, R.sortBtn),
        note(t('Die Texterkennung braucht Internet für das Modell und darf Dateien von cdn.jsdelivr.net und huggingface.co laden.')),
        R.status2, R.warn2, R.list);

      /* --- 3 Charaktere --- */
      R.chars = h('div', { class: 'mk-chars' });
      const p3 = panel(t('3  Charaktere'), note(t('So heißen die Rollen im Spiel. Jede Zeile gehört zu einem Charakter.')), R.chars,
        h('div', { class: 'row' }, h('button', { class: 'btn sm', type: 'button', onclick: () => { S.chars.push(t('Sprecher {n}', { n: S.chars.length + 1 })); renderChars(); renderLines(); } }, '+ ' + t('Charakter hinzufügen')),
          h('button', { class: 'btn sm ghost', type: 'button', onclick: () => { S.lines.forEach((l, i) => { l.char = S.chars[i % S.chars.length]; }); renderLines(); } }, t('Zeilen abwechselnd verteilen'))));

      /* --- 4 Ton --- */
      R.audWarn = h('p', { class: 'warn', role: 'alert', hidden: true });
      const seg = (name, opts, get, set) => {
        const box = h('div', { class: 'seg', role: 'group' });
        const draw = () => box.replaceChildren(...opts.map(([v, l]) => h('button', { type: 'button', class: 'seg-b' + (get() === v ? ' on' : ''), 'aria-pressed': String(get() === v), onclick: () => { set(v); draw(); renderAudioHints(); } }, t(l))));
        draw(); return box;
      };
      R.voiceFile = h('input', { type: 'file', accept: 'audio/*,.wav,.mp3,.ogg,.m4a,.flac,.opus', hidden: true, onchange: (e) => e.target.files[0] && loadAudioFile(e.target.files[0], 'voice') });
      R.backFile = h('input', { type: 'file', accept: 'audio/*,.wav,.mp3,.ogg,.m4a,.flac,.opus', hidden: true, onchange: (e) => e.target.files[0] && loadAudioFile(e.target.files[0], 'back') });
      R.voiceBtn = h('button', { class: 'btn sm', type: 'button', onclick: () => R.voiceFile.click() }, t('Audiodatei wählen'));
      R.backBtn = h('button', { class: 'btn sm', type: 'button', onclick: () => R.backFile.click() }, t('Audiodatei wählen'));
      R.voiceHint = h('p', { class: 'muted mk-note' }); R.backHint = h('p', { class: 'muted mk-note' });
      R.voiceRow = h('div', { class: 'row', hidden: true }, R.voiceBtn, R.voiceFile); R.backRow = h('div', { class: 'row', hidden: true }, R.backBtn, R.backFile);
      const p4 = panel(t('4  Ton'),
        h('div', { class: 'field' }, h('span', { class: 'field-l', text: t('Stimmen der Zeilen') }), seg('voice', [['video', 'Aus dem Video'], ['file', 'Eigene Stimmenspur']], () => S.voiceMode, (v) => { S.voiceMode = v; }), R.voiceHint, R.voiceRow),
        h('div', { class: 'field' }, h('span', { class: 'field-l', text: t('Hintergrund (Musik und Geräusche)') }), seg('back', [['mute', 'Original ohne Sprechstellen'], ['file', 'Eigene Hintergrundspur'], ['none', 'Keiner']], () => S.backMode, (v) => { S.backMode = v; }), R.backHint, R.backRow),
        R.audWarn);

      /* --- 5 Pack --- */
      R.warn5 = h('p', { class: 'warn', role: 'alert', hidden: true });
      R.status5 = h('p', { class: 'status' });
      R.build = h('button', { class: 'btn primary xl', type: 'button', onclick: () => onBuild() }, t('Pack bauen'));
      R.use = h('button', { class: 'btn primary', type: 'button', hidden: true, onclick: () => onUse() }, t('Im Spiel verwenden'));
      R.save = h('button', { class: 'btn', type: 'button', hidden: true, onclick: () => onSave() }, t('ZIP speichern'));
      const p5 = panel(t('5  Pack'), R.warn5, R.status5, h('div', { class: 'row' }, R.build, R.use, R.save));

      R.steps = h('div', { class: 'mk-steps-wrap', hidden: true }, p2, p3, p4, p5);
      root.replaceChildren(h('div', { class: 'mk-wrap' },
        h('header', { class: 'mk-top' }, R.back, h('h1', { text: t('Dub-Pack erstellen') }), h('div', { class: 'lang-slot' }, VD.ui.themeBtn())),
        h('p', { class: 'lead mk-lead', text: t('Baue aus einem Video deinen eigenen Dub-Pack. Alles bleibt auf deinem Gerät.') }), intro, p1, R.steps));
      renderChars(); renderLines(); renderAudioHints();

      function cleanup() {
        try { R.video.pause(); } catch { /* ignore */ }
        if (S.url) URL.revokeObjectURL(S.url);
        if (worker) { worker.terminate(); worker = null; }
      }

      /* ---------- Video laden ---------- */
      async function loadVideo(file) {
        warn(R.vWarn, ''); R.steps.hidden = true; R.use.hidden = true; R.save.hidden = true; S.zip = null;
        const ext = (file.name.match(/\.([a-z0-9]+)$/i) || [])[1]?.toLowerCase() || '';
        const mime = file.type || '';
        S.ext = ext === 'm4v' ? 'm4v' : ext === 'webm' || /webm/.test(mime) ? 'webm' : ext === 'ogv' || /ogg/.test(mime) ? 'ogv' : ext === 'mp4' || /mp4/.test(mime) ? 'mp4' : '';
        if (!S.ext) return warn(R.vWarn, t('Das Video hat ein Format, das der Pack nicht kennt (mp4, webm).'));
        if (S.url) URL.revokeObjectURL(S.url);
        S.file = file; S.url = URL.createObjectURL(file); S.buf = null; S.lines = [];
        R.video.hidden = false; R.video.src = S.url;
        const ok = await new Promise((res) => { R.video.onloadedmetadata = () => res(true); R.video.onerror = () => res(false); setTimeout(() => res(false), 15000); });
        if (!ok || !isFinite(R.video.duration)) { R.video.hidden = true; return warn(R.vWarn, t('Dieses Video kann der Browser nicht abspielen. Nimm mp4 (H.264) oder webm.')); }
        S.dur = R.video.duration;
        S.title = S.title || file.name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ');
        R.title.value = S.title;
        R.vInfo.textContent = t('Dauer {d} s', { d: fmt(S.dur) }) + ' · ' + t('Ton wird gelesen …');
        R.steps.hidden = false; renderLines(); updateAddLabel();
        try { await VD.audio.ensure(); S.buf = await VD.audio.decode(await file.arrayBuffer()); R.vInfo.textContent = t('Dauer {d} s', { d: fmt(S.dur) }); }
        catch { S.buf = null; R.vInfo.textContent = t('Dauer {d} s', { d: fmt(S.dur) }); warn(R.vWarn, t('Der Browser kann den Ton dieses Videos nicht lesen. Lade bei „Ton“ eine eigene Stimmenspur.')); }
      }
      R.video.addEventListener('timeupdate', () => { updateAddLabel(); if (stopAt != null && R.video.currentTime >= stopAt) { R.video.pause(); stopAt = null; } });
      function updateAddLabel() { R.addBtn.textContent = '+ ' + t('Zeile bei {s} s hinzufügen', { s: fmt(R.video.currentTime || 0) }); }

      /* ---------- Zeilen ---------- */
      const newLine = (start, end, text, char) => ({ id: VD.uid(), start, end, text: text || '', char: char || S.chars[0] });
      function sortLines() { S.lines.sort((a, b) => a.start - b.start); }
      function addLine() {
        const s = clamp(R.video.currentTime || 0, 0, Math.max(0, S.dur - 0.5));
        S.lines.push(newLine(s, Math.min(S.dur, s + 2.5), '', S.chars[0])); sortLines(); renderLines();
      }
      function playLine(l) { R.video.currentTime = l.start; stopAt = l.end + TAIL; R.video.play().catch(() => {}); }

      function renderLines() {
        if (!S.lines.length) { R.list.replaceChildren(h('p', { class: 'muted', text: t('Noch keine Zeilen. Erkenne sie automatisch, importiere Untertitel oder füge sie von Hand hinzu.') })); return; }
        const num = (val, label, onset) => {
          const inp = h('input', { class: 'inp mk-num', type: 'number', step: '0.01', min: '0', value: fmt(val), 'aria-label': label, oninput: (e) => { const v = parseFloat(e.target.value); if (isFinite(v)) onset(Math.max(0, v)); } });
          const now = h('button', { class: 'icon-btn mk-now', type: 'button', title: t('Auf die aktuelle Position im Video setzen'), 'aria-label': t('Auf die aktuelle Position im Video setzen'), onclick: () => { const v = Math.round((R.video.currentTime || 0) * 100) / 100; inp.value = fmt(v); onset(v); } }, '⏱');
          return h('div', { class: 'mk-numwrap' }, h('span', { class: 'field-l', text: label }), h('div', { class: 'mk-numrow' }, inp, now));
        };
        R.list.replaceChildren(...S.lines.map((l, i) => {
          const sel = h('select', { class: 'inp mk-sel', 'aria-label': t('Charakter'), onchange: (e) => { l.char = e.target.value; } }, ...S.chars.map((c) => h('option', { value: c, selected: c === l.char, text: c })));
          return h('div', { class: 'mk-line' },
            h('span', { class: 'mk-n', text: String(i + 1) }),
            h('button', { class: 'icon-btn', type: 'button', title: t('Zeile anhören'), 'aria-label': t('Zeile anhören'), onclick: () => playLine(l) }, '▶'),
            num(l.start, t('Start'), (v) => { l.start = v; }), num(l.end, t('Ende'), (v) => { l.end = v; }),
            h('label', { class: 'mk-text' }, h('span', { class: 'field-l', text: t('Text') }), h('input', { class: 'inp', value: l.text, maxlength: 240, oninput: (e) => { l.text = e.target.value; } })),
            h('label', { class: 'mk-char' }, h('span', { class: 'field-l', text: t('Charakter') }), sel),
            h('button', { class: 'icon-btn', type: 'button', title: t('Zeile löschen'), 'aria-label': t('Zeile löschen'), onclick: () => { S.lines = S.lines.filter((x) => x !== l); renderLines(); } }, '✕'));
        }));
      }

      /* ---------- Charaktere ---------- */
      function renderChars() {
        R.chars.replaceChildren(...S.chars.map((c, i) => h('div', { class: 'mk-char-row' },
          h('input', { class: 'inp', value: c, maxlength: 30, 'aria-label': t('Charakter'), onchange: (e) => {
            const v = e.target.value.trim().slice(0, 30);
            if (!v || S.chars.some((x, j) => j !== i && x.toLowerCase() === v.toLowerCase())) { e.target.value = c; return; }
            S.lines.forEach((l) => { if (l.char === c) l.char = v; }); S.chars[i] = v; renderChars(); renderLines();
          } }),
          h('button', { class: 'icon-btn', type: 'button', disabled: S.chars.length < 2, title: t('Charakter entfernen'), 'aria-label': t('Charakter entfernen'), onclick: () => {
            const rest = S.chars.filter((_, j) => j !== i); S.lines.forEach((l) => { if (l.char === c) l.char = rest[0]; }); S.chars = rest; renderChars(); renderLines();
          } }, '✕'))));
      }

      /* ---------- Automatisch erkennen ---------- */
      async function onDetect() {
        if (!S.file) return;
        const b = R.detect;
        if (S.lines.length && !b.dataset.sure) {
          b.dataset.sure = '1'; b.textContent = t('Vorhandene Zeilen ersetzen?');
          setTimeout(() => { delete b.dataset.sure; if (!S.busy) b.textContent = t('Automatisch erkennen'); }, 3000); return;
        }
        delete b.dataset.sure;
        warn(R.warn2, '');
        if (!S.buf) return warn(R.warn2, t('Kein Ton vorhanden. Lade bei „Ton“ eine Stimmenspur.'));
        S.busy = true; b.disabled = true; b.classList.add('busy'); b.textContent = t('Automatisch erkennen');
        try {
          R.status2.textContent = t('Bereite Ton vor …');
          const src = S.voiceMode === 'file' && S.voiceBuf ? S.voiceBuf : S.buf;
          let last = -1;
          const chunks = await transcribe(src, R.model.value, R.lang.value, (p) => {
            if (p && p.status === 'progress' && isFinite(p.progress)) { const v = Math.round(p.progress); if (v !== last) { last = v; R.status2.textContent = t('Lade Modell … {p} %', { p: v }); } }
            else if (p && (p.status === 'done' || p.status === 'ready')) R.status2.textContent = t('Erkenne Sprache … das kann einige Minuten dauern.');
          });
          R.status2.textContent = '';
          const ls = chunksToLines(chunks);
          if (!ls.length) return warn(R.warn2, t('In der Datei wurden keine Zeilen gefunden.'));
          S.lines = ls; renderLines();
          R.status2.textContent = t('{n} Zeilen erkannt. Bitte prüfen.', { n: ls.length });
        } catch (e) {
          console.error(e); R.status2.textContent = ''; warn(R.warn2, t('Erkennung fehlgeschlagen: {e}', { e: e.message || e }));
        } finally { S.busy = false; b.disabled = false; b.classList.remove('busy'); }
      }
      function chunksToLines(chunks) {
        const out = [];
        const arr = (chunks || []).filter((c) => c && String(c.text || '').trim());
        arr.forEach((c, i) => {
          const ts = c.timestamp || [0, null];
          let s = +ts[0], e = ts[1] == null ? null : +ts[1];
          if (!isFinite(s)) return;
          if (e == null || !isFinite(e)) { const nx = arr[i + 1] && arr[i + 1].timestamp && +arr[i + 1].timestamp[0]; e = isFinite(nx) && nx > s ? nx : s + 3; }
          s = clamp(s, 0, S.dur); e = clamp(e, 0, S.dur);
          if (e - s < MIN_LEN) e = Math.min(S.dur, s + MIN_LEN);
          const txt = String(c.text).replace(/\s+/g, ' ').trim();
          if (txt) out.push(newLine(Math.round(s * 100) / 100, Math.round(e * 100) / 100, txt, S.chars[0]));
        });
        return out;
      }

      async function importSubs(file) {
        warn(R.warn2, '');
        try {
          const ls = parseSubs(await file.text()).filter((l) => l.start < S.dur + 0.5);
          if (!ls.length) return warn(R.warn2, t('In der Datei wurden keine Zeilen gefunden.'));
          S.lines = ls.map((l) => newLine(Math.round(l.start * 100) / 100, Math.round(Math.min(S.dur, l.end) * 100) / 100, l.text, S.chars[0]));
          renderLines(); R.status2.textContent = t('{n} Zeilen importiert.', { n: S.lines.length });
        } catch (e) { warn(R.warn2, t('Datei kann nicht gelesen werden: {n}', { n: file.name })); }
        R.subFile.value = '';
      }

      /* ---------- Ton ---------- */
      function renderAudioHints() {
        R.voiceRow.hidden = S.voiceMode !== 'file'; R.backRow.hidden = S.backMode !== 'file';
        R.voiceHint.textContent = S.voiceMode === 'file' ? t('Nur Stimmen, ohne Musik. Dann sind die Original-Zeilen sauberer. Die Datei muss gleich lang sein wie das Video und gleich beginnen.') : '';
        R.backHint.textContent = S.backMode === 'mute' ? t('Das Original wird an den Stellen stummgeschaltet, an denen gesprochen wird. Dort fehlt auch die Musik. Mit einer eigenen Hintergrundspur (Weg 2) klingt es besser.')
          : S.backMode === 'file' ? t('Nur Musik und Geräusche, ohne Stimmen. Die Datei muss gleich lang sein wie das Video und gleich beginnen.') : t('Die Szene hat dann nur die Stimmen der Spieler.');
      }
      async function loadAudioFile(file, which) {
        warn(R.audWarn, '');
        try {
          await VD.audio.ensure();
          const buf = await VD.audio.decode(await file.arrayBuffer());
          if (which === 'voice') { S.voiceBuf = buf; R.voiceBtn.textContent = file.name; } else { S.backBuf = buf; R.backBtn.textContent = file.name; }
        } catch { warn(R.audWarn, t('Datei kann nicht gelesen werden: {n}', { n: file.name })); }
      }

      /* ---------- Pack bauen ---------- */
      function validate() {
        if (!S.file) return t('Bitte zuerst ein Video wählen.');
        if (!S.lines.length) return t('Es gibt noch keine Zeilen.');
        const ls = S.lines.slice().sort((a, b) => a.start - b.start);
        for (let i = 0; i < ls.length; i++) {
          const l = ls[i];
          if (!(l.end - l.start >= 0.1)) return t('Zeile {n}: Das Ende muss nach dem Start liegen.', { n: i + 1 });
          if (l.start > S.dur) return t('Zeile {n}: Der Start liegt hinter dem Ende des Videos.', { n: i + 1 });
          if (!l.text.trim()) return t('Zeile {n}: Bitte einen Text eintragen.', { n: i + 1 });
        }
        if (!(S.voiceMode === 'file' ? S.voiceBuf : S.buf)) return t('Kein Ton vorhanden. Lade bei „Ton“ eine Stimmenspur.');
        return '';
      }

      async function buildZip(onStatus) {
        const ls = S.lines.slice().sort((a, b) => a.start - b.start).map((l) => ({ ...l, start: Math.max(0, l.start), end: Math.min(S.dur + 1, l.end) }));
        const voice = S.voiceMode === 'file' && S.voiceBuf ? S.voiceBuf : S.buf;
        const title = (S.title || 'Dub-Pack').trim().slice(0, 80);
        const dir = safeName(title);
        const zip = new JSZip();
        const f = zip.folder(dir);
        const STORE = { compression: 'STORE' };
        const q = (s) => JSON.stringify(String(s));   // Text im Format der ini-Dateien
        f.file('_pack_info.ini', `[data]\n\ntitle=${q(title)}\nicon="icon.png"\nauthors=${S.author.trim() ? '[' + q(S.author.trim().slice(0, 40)) + ']' : '[]'}\n`);
        f.file('dub_video.' + S.ext, S.file, STORE);
        const per = new Map(); const pad = ls.length > 99 ? 3 : 2;
        for (let i = 0; i < ls.length; i++) {
          const l = ls[i];
          onStatus(t('Baue Zeile {n}/{total} …', { n: i + 1, total: ls.length }));
          const k = (per.get(l.char) || 0) + 1; per.set(l.char, k);
          const stem = String(i + 1).padStart(pad, '0') + '_' + (slug(l.char) || 'sprecher') + '-' + k;
          const mono = monoOf(voice, l.start, l.end + TAIL);
          const clip = await VD.audio.resample(mono, voice.sampleRate, CLIP_SR);
          f.file(stem + '.wav', wavBlob([clip], CLIP_SR));
          f.file(stem + '.ini', `[data]\n\ncaption=${q(l.text.trim())}\ndub_timestamps=[${(Math.round(l.start * 1000) / 1000).toFixed(3)}]\ndub_characters=[${q(l.char)}]\n`);
          try { f.file(stem + '.jpg', await frameAt(S.url, l.start + 0.1, 960, false), STORE); } catch { /* Standbild ist optional */ }
          await VD.sleep(0);
        }
        try { f.file('icon.png', await frameAt(S.url, ls[0].start + 0.1, 256, true), STORE); } catch { /* optional */ }
        if (S.backMode !== 'none') {
          onStatus(t('Baue Hintergrund …'));
          const src = S.backMode === 'file' && S.backBuf ? S.backBuf : S.buf;
          if (src) {
            const chans = [];
            for (let c = 0; c < Math.min(2, src.numberOfChannels); c++) chans.push(await VD.audio.resample(src.getChannelData(c).slice(), src.sampleRate, CLIP_SR));
            if (S.backMode === 'mute') {
              const fade = Math.round(0.03 * CLIP_SR);
              for (const d of chans) {
                for (const l of ls) {
                  const a = Math.round((l.start - 0.03) * CLIP_SR), b = Math.round((l.end + TAIL + 0.02) * CLIP_SR);
                  for (let i = Math.max(0, a - fade); i < Math.min(d.length, b + fade); i++) {
                    const g = i < a ? (a - i) / fade : i > b ? (i - b) / fade : 0;
                    d[i] *= g;
                  }
                }
              }
            }
            f.file('_backing_track.wav', wavBlob(chans, CLIP_SR));
          }
        }
        const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 3 } }, (m) => onStatus(t('Packe alles zusammen … {p} %', { p: Math.round(m.percent) })));
        return { blob, name: dir + '.zip' };
      }

      async function onBuild() {
        warn(R.warn5, ''); R.status5.textContent = '';
        const bad = validate();
        if (bad) return warn(R.warn5, bad);
        S.busy = true; R.build.disabled = true; R.build.classList.add('busy'); R.use.hidden = true; R.save.hidden = true;
        try {
          S.zip = await buildZip((s) => { R.status5.textContent = s; });
          R.status5.textContent = t('Der Pack ist fertig. Du kannst ihn gleich im Spiel verwenden oder als ZIP speichern.');
          R.use.hidden = false; R.save.hidden = false;
        } catch (e) { console.error(e); R.status5.textContent = ''; warn(R.warn5, t('Bau fehlgeschlagen: {e}', { e: e.message || e })); }
        finally { S.busy = false; R.build.disabled = false; R.build.classList.remove('busy'); }
      }
      async function onUse() {
        if (!S.zip) return;
        R.use.disabled = true;
        try {
          await VD.Packs.importFiles([new File([S.zip.blob], S.zip.name, { type: 'application/zip' })], (s) => { R.status5.textContent = s; });
          R.status5.textContent = t('Der Pack liegt jetzt in deiner Pack-Liste. Erstelle einen Raum, dann kannst du ihn auswählen.');
          VD.toast(R.status5.textContent);
        } catch (e) { console.error(e); warn(R.warn5, t('Bau fehlgeschlagen: {e}', { e: e.message || e })); }
        R.use.disabled = false;
      }
      function onSave() { if (S.zip) VD.Export.save(S.zip.blob, S.zip.name); }

      VD.Maker._state = S;   // für Tests und die Fehlersuche in der Konsole
    }
  };
})();
