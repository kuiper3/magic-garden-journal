// ==UserScript==
// @name         MG Pet Exporter (for Magic Garden Journal)
// @namespace    mgj-tools
// @version      0.1.0
// @description  Read-only: exports your Magic Garden pets as JSON for import into the Magic Garden Journal. Never sends anything to the game.
// @match        https://magicgarden.gg/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

// ─────────────────────────────────────────────────────────────
// HOW IT WORKS
// Listens (read-only) to the game's WebSocket. The first big state message
// ("Welcome") contains your full inventory. We deep-scan it for objects with
// itemType === 'Pet', scoped to YOUR player slot (matched via the playerId in
// the WebSocket URL), then show a small 🐾 button that copies/downloads the
// pets as JSON. Paste or drop that into the Journal's Owned Pets → Import.
//
// STATUS: LIVE-VERIFIED 2026-06-06 — produced a working export on a real account. If the
// button shows 0 pets or the wrong count, report it — nothing here can affect
// your game either way, because this script only ever *reads* messages.
// ─────────────────────────────────────────────────────────────

(function () {
  'use strict';

  let playerId = null;
  let pets = [];          // latest scoped pet list
  let scoped = false;     // whether the list was scoped to your slot

  // ── WebSocket tap (read-only) ───────────────
  const NativeWS = window.WebSocket;
  function TappedWS(url, protocols) {
    const ws = protocols !== undefined ? new NativeWS(url, protocols) : new NativeWS(url);
    try {
      const m = String(url).match(/playerId=%22([^%"]+)%22/);
      if (m) playerId = decodeURIComponent(m[1]);
    } catch (_) { /* non-fatal */ }
    ws.addEventListener('message', onMessage);
    return ws;
  }
  TappedWS.prototype = NativeWS.prototype;
  Object.setPrototypeOf(TappedWS, NativeWS);
  window.WebSocket = TappedWS;

  function onMessage(e) {
    if (typeof e.data !== 'string' || e.data.length < 2000) return; // Welcome is large
    let msg;
    try { msg = JSON.parse(e.data); } catch (_) { return; }
    const found = scanForPets(msg);
    if (found.pets.length) {
      pets = found.pets;
      scoped = found.scoped;
      updateButton();
    }
  }

  // ── Deep scan ───────────────────────────────
  // Collects every { itemType:'Pet' } object. If playerId is known, prefers the
  // deepest subtree that contains BOTH the playerId string and pets — that
  // subtree is your slot, so other players' pets in the room are excluded.
  function scanForPets(root) {
    let best = null; // { pets, depth }
    function walk(node, depth) {
      if (node === null || typeof node !== 'object') {
        return { pets: [], hasPid: typeof node === 'string' && playerId != null && node === playerId };
      }
      let myPets = [];
      let hasPid = false;
      if (node.itemType === 'Pet' && typeof node.petSpecies === 'string') myPets.push(node);
      const values = Array.isArray(node) ? node : Object.values(node);
      for (const v of values) {
        const r = walk(v, depth + 1);
        if (r.pets.length) myPets = myPets.concat(r.pets);
        if (r.hasPid) hasPid = true;
      }
      if (hasPid && myPets.length && (best === null || depth > best.depth)) {
        best = { pets: myPets, depth };
      }
      return { pets: myPets, hasPid };
    }
    const all = walk(root, 0);
    // Dedupe by pet id.
    const dedupe = list => {
      const seen = new Set();
      return list.filter(p => { const k = p.id ?? JSON.stringify(p); if (seen.has(k)) return false; seen.add(k); return true; });
    };
    if (best) return { pets: dedupe(best.pets), scoped: true };
    return { pets: dedupe(all.pets), scoped: false };
  }

  // ── UI ──────────────────────────────────────
  let btn = null;
  function updateButton() {
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'mgj-pet-export';
      btn.style.cssText = [
        'position:fixed', 'bottom:14px', 'right:14px', 'z-index:99999',
        'background:#1a3324', 'color:#cfffcb', 'border:1px solid #5a9a6e',
        'border-radius:8px', 'padding:8px 14px', 'font:600 13px system-ui,sans-serif',
        'cursor:pointer', 'box-shadow:0 2px 10px rgba(0,0,0,0.45)',
      ].join(';');
      btn.addEventListener('click', exportPets);
      const mount = () => document.body
        ? document.body.appendChild(btn)
        : setTimeout(mount, 500);
      mount();
    }
    btn.textContent = `🐾 Export Pets (${pets.length})${scoped ? '' : ' ⚠ room-wide'}`;
    btn.title = scoped
      ? 'Download your pets as JSON for the Magic Garden Journal'
      : 'Could not isolate your slot — this list may include other players\' pets';
  }

  async function exportPets() {
    if (!pets.length) return;
    const json = JSON.stringify(pets, null, 2);
    try { await navigator.clipboard.writeText(json); } catch (_) { /* download still works */ }
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `mg-pets-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    const old = btn.textContent;
    btn.textContent = '🐾 Copied + downloaded ✓';
    setTimeout(() => { btn.textContent = old; }, 1800);
  }
})();
