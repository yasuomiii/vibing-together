/* ------------------------------------------------------------------
   Stimmeffekte (reines JS, ohne DOM -> auch in Node testbar)
   Jeder Effekt bekommt ein Float32Array (Mono, Rate sr) und liefert ein Float32Array GLEICHER Länge.
   VDFX.apply(name, x, sr, { targetDb }) rechnet den Effekt, gleicht danach die Lautstärke an und begrenzt weich.
   Namen: none, low, high, robot, echo, phone, reverb
------------------------------------------------------------------- */
(function (root) {
  'use strict';
  const FX = {};
  const TWO_PI = Math.PI * 2;

  FX.NAMES = ['none', 'low', 'high', 'robot', 'echo', 'phone', 'reverb'];
  FX.isName = (n) => FX.NAMES.indexOf(n) >= 0;

  /* ---- Tonhöhe ändern, Länge bleibt: erst WSOLA-Zeitdehnung um r, dann auf Länge N zurücklesen (Tempo r) ---- */
  function stretch(x, r) {
    const N = x.length, W = 1024, Hs = W >> 1, tol = 256, Ha = Hs / r;
    const pad = W + tol;
    const xp = new Float32Array(N + 2 * pad); xp.set(x, pad);
    const M = Math.ceil(N * r);
    const y = new Float32Array(M + 2 * W), nrm = new Float32Array(M + 2 * W);
    const win = new Float32Array(W);
    for (let i = 0; i < W; i++) win[i] = 0.5 - 0.5 * Math.cos((TWO_PI * (i + 0.5)) / W);
    let prev = 0;
    for (let k = 0; k * Hs < M + Hs; k++) {
      const nominal = Math.round(k * Ha);
      let pos = nominal;
      if (k > 0) {
        // Stelle suchen, an der der Anfang des neuen Fensters am besten an die natürliche Fortsetzung des alten passt
        const ref = prev + Hs;
        let best = -Infinity;
        for (let d = -tol; d <= tol; d += 2) {
          const p = nominal + d;
          if (p < -pad + 1 || p + W + pad > N + pad) continue;
          let c = 0;
          for (let i = 0; i < Hs; i += 2) c += xp[pad + ref + i] * xp[pad + p + i];
          if (c > best) { best = c; pos = p; }
        }
      }
      prev = pos;
      const o = k * Hs;
      for (let i = 0; i < W; i++) {
        const a = pad + pos + i;
        if (a < 0 || a >= xp.length) continue;
        const w = win[i];
        y[o + i] += xp[a] * w; nrm[o + i] += w;
      }
    }
    for (let i = 0; i < y.length; i++) if (nrm[i] > 1e-3) y[i] /= nrm[i];
    return y;
  }
  FX.pitch = function (x, semitones) {
    const N = x.length;
    if (!N || !semitones) return Float32Array.from(x);
    const r = Math.pow(2, semitones / 12);
    const s = stretch(x, r);
    const out = new Float32Array(N);
    for (let n = 0; n < N; n++) {
      const t = n * r, i = Math.floor(t), f = t - i;
      const a = i < s.length ? s[i] : 0, b = i + 1 < s.length ? s[i + 1] : 0;
      out[n] = a + (b - a) * f;
    }
    return out;
  };

  /* ---- Roboter: Ringmodulation (55 Hz) mit etwas trockenem Anteil, leichte Verzerrung ---- */
  FX.robot = function (x, sr) {
    const out = new Float32Array(x.length), w = (TWO_PI * 55) / sr;
    for (let i = 0; i < x.length; i++) {
      const v = x[i] * (0.75 * Math.sin(w * i)) + 0.3 * x[i];
      out[i] = Math.tanh(2.2 * v) / 1.2;
    }
    return out;
  };

  /* ---- Biquad (RBJ), Direct Form I ---- */
  function biquad(x, sr, type, fc, q) {
    const w0 = (TWO_PI * fc) / sr, cs = Math.cos(w0), al = Math.sin(w0) / (2 * q);
    let b0, b1, b2;
    if (type === 'hp') { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = b0; } else { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = b0; }
    const a0 = 1 + al, a1 = (-2 * cs) / a0, a2 = (1 - al) / a0;
    b0 /= a0; b1 /= a0; b2 /= a0;
    const y = new Float32Array(x.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < x.length; i++) {
      const v = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v;
    }
    return y;
  }
  /* ---- Telefon: Bandpass 300–3400 Hz (je 2 Filter, steiler) und leichte Sättigung ---- */
  FX.phone = function (x, sr) {
    const hi = Math.min(3400, sr * 0.45);
    let y = biquad(biquad(x, sr, 'hp', 300, 0.707), sr, 'hp', 300, 0.707);
    y = biquad(biquad(y, sr, 'lp', hi, 0.707), sr, 'lp', hi, 0.707);
    for (let i = 0; i < y.length; i++) y[i] = Math.tanh(1.8 * y[i]) / 1.1;
    return y;
  };

  /* Weiches Ausblenden am Ende (verhindert einen Knacks, wenn ein Nachhall abgeschnitten wird) */
  function fadeEnd(y, sr, sec) {
    const n = Math.min(y.length, Math.round(sr * sec));
    for (let i = 0; i < n; i++) { const g = i / n; y[y.length - 1 - i] *= g * g * (3 - 2 * g); }
    return y;
  }

  /* ---- Echo: zwei Wiederholungen (180 ms und 360 ms), Rest nach dem Ende der Aufnahme abgeschnitten ---- */
  FX.echo = function (x, sr) {
    const N = x.length, y = new Float32Array(N), d1 = Math.round(sr * 0.18), d2 = Math.round(sr * 0.36);
    for (let i = 0; i < N; i++) y[i] = x[i] + (i >= d1 ? 0.5 * x[i - d1] : 0) + (i >= d2 ? 0.25 * x[i - d2] : 0);
    return fadeEnd(y, sr, 0.08);
  };

  /* ---- Hall: einfacher Raumhall (4 Kammfilter mit Dämpfung + 2 Allpässe, Schroeder), Nachhall am Ende ausgeblendet ---- */
  FX.reverb = function (x, sr) {
    const N = x.length, wet = new Float32Array(N);
    const combs = [0.0297, 0.0371, 0.0411, 0.0437].map((s) => Math.round(sr * s));
    for (const D of combs) {
      const buf = new Float32Array(D); let p = 0, lp = 0;
      for (let i = 0; i < N; i++) {
        const o = buf[p];
        lp = o * 0.65 + lp * 0.35;                       // Höhen im Nachhall dämpfen
        buf[p] = x[i] + 0.8 * lp;
        wet[i] += o * 0.25;
        if (++p === D) p = 0;
      }
    }
    let y = wet;
    for (const s of [0.0126, 0.0100]) {
      const D = Math.round(sr * s), buf = new Float32Array(D), o2 = new Float32Array(N); let p = 0;
      for (let i = 0; i < N; i++) {
        const b = buf[p], v = y[i] + 0.5 * b;
        buf[p] = v; o2[i] = b - 0.5 * v;
        if (++p === D) p = 0;
      }
      y = o2;
    }
    const out = new Float32Array(N);
    for (let i = 0; i < N; i++) out[i] = 0.7 * x[i] + 1.1 * y[i];
    return fadeEnd(out, sr, 0.08);
  };

  /* Rohen Effekt rechnen (ohne Lautstärke-Angleich). Unbekannt oder none: Kopie. */
  FX.raw = function (name, x, sr) {
    switch (name) {
      case 'low': return FX.pitch(x, -5);
      case 'high': return FX.pitch(x, 5);
      case 'robot': return FX.robot(x, sr);
      case 'echo': return FX.echo(x, sr);
      case 'phone': return FX.phone(x, sr);
      case 'reverb': return FX.reverb(x, sr);
      default: return Float32Array.from(x);
    }
  };

  /* Effekt + Lautstärke wieder auf das Ziel bringen (VDA.normalize: Pegel angleichen, Spitzen weich begrenzen).
     Liefert immer ein Array gleicher Länge wie x. */
  FX.apply = function (name, x, sr, opt) {
    if (!x || !x.length || !FX.isName(name) || name === 'none') return x;
    let y = FX.raw(name, x, sr);
    const A = root.VDA;
    if (A && A.normalize) {
      try { const n = A.normalize(y, sr, { targetDb: opt && opt.targetDb }); if (!n.silent && n.data.length === y.length) y = n.data; } catch (e) { /* roh behalten */ }
    }
    for (let i = 0; i < y.length; i++) if (!Number.isFinite(y[i])) y[i] = 0;   // NaN/Inf unschädlich machen
    return y;
  };

  root.VDFX = FX;
  if (typeof module !== 'undefined' && module.exports) module.exports = FX;
})(typeof window !== 'undefined' ? window : globalThis);
