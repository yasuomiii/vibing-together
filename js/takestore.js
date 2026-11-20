/* Aufnahmen des Handys in IndexedDB, pro Raum und Zeile: Sie überstehen ein Neuladen der Seite.
   Alles wird beim Beenden der Runde (zurück in die Lobby) und beim Verlassen des Raums gelöscht.
   Fehler (privater Modus, wenig Speicher) werden still ignoriert, dann gibt es nur keinen Neuladen-Schutz. */
(function () {
  const VD = (window.VD = window.VD || {});
  let dbp = null;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    try {
      const r = indexedDB.open('vibingtogether-takes', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('takes', { keyPath: 'k' });
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    } catch (e) { rej(e); }
  }));
  const run = async (mode, fn) => {
    const db = await open();
    return new Promise((res, rej) => { const t = db.transaction('takes', mode); const r = fn(t.objectStore('takes')); t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); });
  };
  const buf = (f32) => { const i = VD.f32ToI16(f32); return i.buffer.slice(i.byteOffset, i.byteOffset + i.byteLength); };
  const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);

  VD.TakeStore = {
    /* Take einer Zeile speichern (Daten als 16 Bit, effektfreie Fassung nur, wenn sie sich unterscheidet) */
    async put(room, sceneId, i, t) {
      try {
        const rec = { k: room + '|' + sceneId + '|t' + i, room, sceneId, i, data: buf(t.data), base: t.base && t.base !== t.data ? buf(t.base) : null,
          lead: t.lead || 0, gainDb: t.gainDb || 0, silent: !!t.silent, sync: t.sync || 0, fx: t.fx || 'none' };
        await run('readwrite', (s) => s.put(rec));
      } catch { /* ignorieren */ }
    },
    /* Stand der Runde: aktuelle Zeile und ob schon abgegeben wurde */
    async setState(room, sceneId, cur, fin) {
      try { await run('readwrite', (s) => s.put({ k: room + '|' + sceneId + '|state', room, sceneId, cur, fin: !!fin })); } catch { /* ignorieren */ }
    },
    /* Liefert { takes: Map(i -> Take), cur, fin } oder null */
    async load(room, sceneId) {
      try {
        const all = (await run('readonly', (s) => s.getAll())) || [];
        const mine = all.filter((r) => r && r.room === room && r.sceneId === sceneId);
        if (!mine.length) return null;
        const out = { takes: new Map(), cur: 0, fin: false };
        for (const r of mine) {
          if (r.k.endsWith('|state')) { out.cur = Math.max(0, Math.round(num(r.cur, 0))); out.fin = !!r.fin; continue; }
          if (!(r.data instanceof ArrayBuffer) || r.data.byteLength % 2 || !Number.isInteger(r.i) || r.i < 0) continue;
          const data = VD.i16ToF32(new Int16Array(r.data));
          const base = r.base instanceof ArrayBuffer && !(r.base.byteLength % 2) ? VD.i16ToF32(new Int16Array(r.base)) : data;
          out.takes.set(r.i, { data, base, lead: num(r.lead, 0), gainDb: num(r.gainDb, 0), silent: !!r.silent, sent: false, sync: num(r.sync, 0), fx: typeof r.fx === 'string' ? r.fx : 'none' });
        }
        return out;
      } catch { return null; }
    },
    /* Alles zu einem Raum löschen (ohne Angabe: alles) */
    async clear(room) {
      try {
        await run('readwrite', (s) => {
          if (!room) return s.clear();
          const rq = s.openCursor();
          rq.onsuccess = () => { const c = rq.result; if (c) { if (c.value && c.value.room === room) c.delete(); c.continue(); } };
          return rq;
        });
      } catch { /* ignorieren */ }
    }
  };
})();
