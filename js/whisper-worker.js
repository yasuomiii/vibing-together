/* Whisper im Hintergrund-Thread (Untertitel erstellen).
   Läuft komplett im Browser mit Transformers.js. Nur das Sprachmodell wird beim ersten Mal von Hugging Face geladen
   und danach vom Browser zwischengespeichert. Die Audiodatei verlässt das Gerät nicht.
   Nachrichten an dieses Skript:  { type: 'load', model: { repos, dtype } }   { type: 'run', audio, language }   { type: 'cancel' }
   Nachrichten von diesem Skript: { type: 'progress', pct, file } { type: 'ready', repo } { type: 'step', done, total }
                                   { type: 'segments', segments } { type: 'done' } { type: 'error', message } */
import { pipeline, env } from '../vendor/transformers/transformers.min.js';

env.allowLocalModels = false;
env.useBrowserCache = true;
// ONNX Runtime kommt aus dem eigenen Ordner statt von einem fremden Server. Ohne Spezial-Header der Seite läuft es mit einem Thread.
const base = new URL('../vendor/transformers/', import.meta.url).href;
env.backends.onnx.wasm.wasmPaths = { mjs: base + 'ort-wasm-simd-threaded.mjs', wasm: base + 'ort-wasm-simd-threaded.wasm' };
env.backends.onnx.wasm.numThreads = 1;

const SR = 16000;
const WIN = 28 * SR;            // so viel Ton auf einmal (Whisper verträgt höchstens 30 Sekunden)
let asr = null;
let cancelled = false;

const post = (m) => self.postMessage(m);

/* Lautstärke in Blöcken von 100 ms, um Schnitte in eine Sprechpause zu legen und stille Stücke zu überspringen */
function rms(a, from, to) {
  let s = 0; const n = Math.max(1, to - from);
  for (let i = from; i < to; i++) s += a[i] * a[i];
  return Math.sqrt(s / n);
}
function cutPoint(a, from, hard) {
  // leisester 100-ms-Block in den letzten 6 Sekunden des Fensters
  const step = SR / 10; let best = hard, bestV = Infinity;
  for (let p = hard - 6 * SR; p <= hard - step; p += step) {
    const v = rms(a, p, p + step);
    if (v < bestV) { bestV = v; best = p + step / 2; }
  }
  return Math.max(from + SR, Math.floor(best));
}

async function load(model) {
  let lastErr = null;
  for (const repo of model.repos) {
    try {
      const files = {};
      asr = await pipeline('automatic-speech-recognition', repo, {
        dtype: model.dtype || 'q8',
        device: 'wasm',
        progress_callback: (p) => {
          if (p && p.status === 'progress' && p.file) {
            files[p.file] = { loaded: p.loaded || 0, total: p.total || 0 };
            let l = 0, t = 0; for (const k in files) { l += files[k].loaded; t += files[k].total; }
            post({ type: 'progress', pct: t ? Math.min(99, Math.round((l / t) * 100)) : 0, file: p.file });
          }
        }
      });
      post({ type: 'ready', repo });
      return;
    } catch (e) { lastErr = e; asr = null; }
  }
  throw lastErr || new Error('Modell nicht gefunden');
}

async function run(audio, language) {
  cancelled = false;
  const total = audio.length;
  // Fenster planen
  const wins = []; let pos = 0;
  while (pos < total) {
    let end = Math.min(total, pos + WIN);
    if (end < total) end = cutPoint(audio, pos, end);
    wins.push([pos, end]); pos = end;
  }
  const all = [];
  for (let w = 0; w < wins.length; w++) {
    if (cancelled) { post({ type: 'done', cancelled: true }); return; }
    const [a, b] = wins[w];
    const part = audio.subarray(a, b);
    post({ type: 'step', done: w, total: wins.length });
    // Stille Stücke überspringen (verhindert erfundenen Text)
    if (rms(part, 0, part.length) < 0.003) continue;
    const opts = { task: 'transcribe', return_timestamps: true };
    if (language && language !== 'auto') opts.language = language;
    const out = await asr(part, opts);
    const off = a / SR, len = (b - a) / SR;
    const segs = [];
    for (const c of (out.chunks || [])) {
      const text = String(c.text || '').replace(/\s+/g, ' ').trim();
      if (!text) continue;
      const s = Math.max(0, c.timestamp[0] || 0), e = c.timestamp[1] == null ? len : Math.min(len, c.timestamp[1]);
      segs.push({ start: Math.round((off + s) * 100) / 100, end: Math.round((off + Math.max(e, s + 0.3)) * 100) / 100, text });
    }
    // Dieselbe Zeile mehrfach hintereinander ist meist eine Halluzination: höchstens zweimal behalten
    for (const sg of segs) {
      const n = all.length;
      if (n >= 2 && all[n - 1].text === sg.text && all[n - 2].text === sg.text) continue;
      all.push(sg);
    }
    post({ type: 'segments', segments: all.slice() });
  }
  post({ type: 'step', done: wins.length, total: wins.length });
  post({ type: 'done' });
}

self.onmessage = async (ev) => {
  const m = ev.data || {};
  try {
    if (m.type === 'load') await load(m.model);
    else if (m.type === 'run') {
      if (!asr) throw new Error('Modell nicht geladen');
      await run(m.audio, m.language);
    } else if (m.type === 'cancel') cancelled = true;
  } catch (e) {
    post({ type: 'error', message: (e && e.message) ? e.message : String(e) });
  }
};
