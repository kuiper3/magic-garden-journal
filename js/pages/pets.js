// ═══════════════════════════════════════════════
// Magic Garden Journal — js/pages/pets.js
// v0.1.0 — stub; implemented in 0.6.0
// ═══════════════════════════════════════════════
// Exports the standard page interface: render, init, destroy.
//
// 0.6.0: Grid of all 21+ pets in egg-rarity order.
//         Drill-down modal mirrors plants.js pattern.
//         Includes Dawn-era pets automatically (via AriesMod API).
// ═══════════════════════════════════════════════

/** @param {HTMLElement} container */
export function render(container) {
  container.innerHTML = `
    <div class="page-placeholder">
      <p>🐾 Pets page — coming in milestone 0.6.0</p>
    </div>
  `;
}

export function init() {}

export function destroy() {}
