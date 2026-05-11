// ═══════════════════════════════════════════════
// Magic Garden Journal — js/pages/plants.js
// v0.1.0 — stub; implemented in 0.4.0 / 0.5.0
// ═══════════════════════════════════════════════
// Exports the standard page interface: render, init, destroy.
//
// 0.4.0: Grid of all 47+ crops with progress bars.
//         Variants derived from aries.fetchMutations().
// 0.5.0: Drill-down modal: discovered = sprite + name,
//         undiscovered = silhouette + "???".
//         Tap variant → writes to Supabase journal_entries.
// ═══════════════════════════════════════════════

/** @param {HTMLElement} container */
export function render(container) {
  container.innerHTML = `
    <div class="page-placeholder">
      <p>🌱 Plants page — coming in milestone 0.4.0</p>
    </div>
  `;
}

export function init() {
  // Wire up events after render.
}

export function destroy() {
  // Clean up event listeners, timers, SSE connections, etc.
}
