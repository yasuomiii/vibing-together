/* ------------------------------------------------------------------
   Signalanalyse (reines JS, ohne DOM -> auch in Node testbar)
   - Normalisierung (Lautstärke-Angleich)
   - Sprachanfang erkennen (speechSpan) und Take verschieben (autoSync)
------------------------------------------------------------------- */
(function (root) {
  'use strict';
  const A = {};
  const TWO_PI = Math.PI * 2;

  A.SR = 24000; // Übertragungs- und Analyse-Samplerate

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const log10 = Math.log10 || ((v) => Math.log(v) / Math.LN10);

  /* Hochpass 1. Ordnung (entfernt Gleichanteil & Brummen) */
  A.highpass = function (x, sr, fc) {
    const y = new Float32Array(x.length);
    const rc = 1 / (TWO_PI * (fc || 80));
    const dt = 1 / sr;
    const a = rc / (rc + dt);
    let py = 0, px = x.length ? x[0] : 0;
    for (let i = 0; i < x.length; i++) {
      const v = a * (py + x[i] - px);
      y[i] = v; py = v; px = x[i];
    }
    return y;
  };

  A.percentile = function (arr, p) {
    if (!arr.length) return 0;
    const s = Array.prototype.slice.call(arr).sort((a, b) => a - b);
    return s[clamp(Math.floor(p * (s.length - 1)), 0, s.length - 1)];
  };

  /* RMS in dB pro Frame (hopN Samples, Fenster = 1.5 * hop) */
  A.envDb = function (x, hopN) {
    const win = Math.round(hopN * 1.5);
    const n = Math.max(0, Math.floor(x.length / hopN));
    const out = new Float32Array(n);
    for (let f = 0; f < n; f++) {
      const s = f * hopN, e = Math.min(x.length, s + win);
      let sum = 0;
      for (let i = s; i < e; i++) sum += x[i] * x[i];
      const rms = Math.sqrt(sum / Math.max(1, e - s));
      out[f] = 20 * log10(rms + 1e-9);
    }
    return out;
  };

  /* Lautstärke-Normalisierung: misst den Pegel nur auf "aktiven" Frames
     (Sprache), hebt leise Stimmen an, begrenzt Spitzen weich. */
  A.normalize = function (x, sr, opt) {
    const o = Object.assign({ targetDb: -20, peakDb: -1.5, maxGainDb: 40, minGainDb: -24 }, opt);
    const y = A.highpass(x, sr, 80);
    const hopN = Math.round(sr * 0.02);
    const db = A.envDb(y, hopN);
    if (db.length < 3) return { data: y, gainDb: 0, levelDb: -120, silent: true, noiseDb: -120 };
    const noise = A.percentile(db, 0.2);
    const maxDb = A.percentile(db, 0.98);
    const thr = Math.max(noise + 8, maxDb - 35, -62);
    let pow = 0, cnt = 0;
    for (let i = 0; i < db.length; i++) if (db[i] > thr) { pow += Math.pow(10, db[i] / 10); cnt++; }
    const silent = cnt < 3 || maxDb < -58 || maxDb - noise < 8;
    if (silent) return { data: y, gainDb: 0, levelDb: maxDb, silent: true, noiseDb: noise };
    const level = 10 * log10(pow / cnt);
    const gainDb = clamp(o.targetDb - level, o.minGainDb, o.maxGainDb);
    const g = Math.pow(10, gainDb / 20);
    const lim = Math.pow(10, o.peakDb / 20), knee = lim * 0.7, span = lim - knee;
    for (let i = 0; i < y.length; i++) {
      let v = y[i] * g;
      const a = Math.abs(v);
      if (a > knee) v = Math.sign(v) * (knee + span * Math.tanh((a - knee) / span));
      y[i] = v;
    }
    return { data: y, gainDb, levelDb: level, silent: false, noiseDb: noise };
  };

  /* Sprachbeginn und -ende in einer Aufnahme (Sekunden) oder null, wenn nichts sicher erkannt wird.
     Energie in 10-ms-Schritten; Schwelle = Rauschpegel (Median der leisesten 20 % der Fenster) + Abstand, aber auch
     höchstens 32 dB unter der Spitze. Der Anfang zählt erst, wenn mindestens 60 ms am Stück über der Schwelle liegen
     (ein Klacken oder Atmen reicht nicht). Beginnt es schon im allerersten Fenster, ist der Anfang unbekannt -> null. */
  A.speechSpan = function (x, sr, opt) {
    const o = Object.assign({ hopSec: 0.01, minRunSec: 0.06, gapDb: 10, rangeDb: 32, floorDb: -62, minDynDb: 12 }, opt);
    const hop = Math.max(1, Math.round(sr * o.hopSec));
    const db = A.envDb(A.highpass(x, sr, 80), hop);
    const n = db.length;
    if (n < 10) return null;
    const sorted = Array.prototype.slice.call(db).sort((p, q) => p - q);
    // Reine digitale Stille (Nullen) würde den Rauschpegel auf -180 dB drücken: nach unten bei -90 dB begrenzen
    const noise = Math.max(-90, sorted[Math.floor(Math.min(n - 1, n * 0.1))]);     // Median der leisesten 20 %
    const peak = sorted[Math.min(n - 1, Math.floor(0.98 * (n - 1)))];
    if (peak < -55 || peak - noise < o.minDynDb) return null;
    // Liegt die Spitze nur knapp über dem Rauschen, entscheidet das Rauschen; ist der Rauschwert hoch (kaum Stille im Take), begrenzt die Spitze die Schwelle
    const thr = Math.max(Math.min(noise + o.gapDb, peak - 20), peak - o.rangeDb, o.floorDb, noise + 6);
    const minRun = Math.max(1, Math.round(o.minRunSec / o.hopSec));
    let start = -1, end = -1, run = 0;
    for (let i = 0; i <= n; i++) {
      if (i < n && db[i] > thr) { run++; continue; }
      if (run >= minRun) { if (start < 0) start = i - run; end = i; }
      else if (run >= 3 && start >= 0) end = i;
      run = 0;
    }
    if (start <= 0) return null;                                       // nicht gefunden oder schon im ersten Fenster
    // Leise Wortanfänge (Konsonanten) liegen unter der Schwelle: nach vorn ausdehnen, solange es deutlich lauter ist als Rauschen
    const soft = Math.max(Math.min(noise + 6, thr - 3), thr - 18);
    for (let k = 0; k < 12 && start > 1 && db[start - 1] > soft; k++) start--;
    return { start: (start * hop) / sr, end: (end * hop) / sr };
  };

  /* Auto-Sync: verschiebt ein Take (Zeitachse beginnt bei lead Sekunden Stille, dann die Aufnahme) so, dass der
     Sprachanfang bei target Sekunden liegt. Länge bleibt gleich. Verschiebt höchstens maxShift Sekunden und nie so,
     dass Sprache abgeschnitten wird (nach vorne nur um die Stille davor, nach hinten nur bis zum Ende der Sprache).
     Liefert { data, shift (s, positiv = später), onset (s) }; ohne sichere Erkennung bleibt shift 0. */
  A.autoSync = function (base, sr, o) {
    const opt = Object.assign({ lead: 0, target: 0, maxShift: 0.5, margin: 0.06, minShift: 0.015 }, o);
    const none = { data: base, shift: 0, onset: null };
    const pad = Math.min(base.length, Math.round(opt.lead * sr));
    const span = A.speechSpan(base.subarray(pad), sr);
    if (!span) return none;
    const onset = opt.lead + span.start, end = opt.lead + span.end, total = base.length / sr;
    let d = opt.target - onset;
    if (Math.abs(d) > opt.maxShift) return Object.assign({}, none, { onset });
    if (d < 0) d = -Math.min(-d, Math.max(0, onset - opt.margin));
    else d = Math.min(d, Math.max(0, total - end - opt.margin));
    if (Math.abs(d) < opt.minShift) return Object.assign({}, none, { onset });
    const k = Math.round(d * sr), out = new Float32Array(base.length);
    if (k > 0) out.set(base.subarray(0, base.length - k), k); else out.set(base.subarray(-k), 0);
    return { data: out, shift: k / sr, onset };
  };

  root.VDA = A;
  if (typeof module !== 'undefined' && module.exports) module.exports = A;
})(typeof window !== 'undefined' ? window : globalThis);
