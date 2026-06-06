// ═══════════════════════════════════════════════
// Magic Garden Journal — js/pages/guide.js
// v0.7.2 — instructions / how-to page (static, no Supabase)
// ═══════════════════════════════════════════════

const GETPETS_CMD = 'copy(JSON.stringify(GardenPilot.inventory.getPets(), null, 2))';

export function render(container) {
  container.innerHTML = `
    <link rel="stylesheet" href="css/guide.css">
    <div class="guide-wrap">
      <h2 class="guide-title">📖 Guide</h2>
      <p class="guide-intro">How to use the journal. Everything you track here is saved to your
      account and syncs across devices.</p>

      <details class="guide-sec" open>
        <summary>🌱 Plants — tracking crop variants</summary>
        <div class="guide-body">
          <p>The Plants page lists every crop with its discovery progress. Click a crop to open its
          variant modal — tap tiles to mark variants you've collected, or use <em>Check All / Clear
          All</em>. The <em>Conditions</em> tab shows the same variants as a sprite grid across all
          crops. Use the toolbar to search, sort, switch card/list view, or show only crops with
          missing variants. The progress bar at the top counts every variant across all crops.</p>
        </div>
      </details>

      <details class="guide-sec">
        <summary>🐾 Pets — species discovery</summary>
        <div class="guide-body">
          <p>The Pets page works like Plants but for species: track which mutations (Normal, Gold,
          Rainbow, Max Weight) you've collected per species. The modal also shows each species' egg,
          diet, and abilities. Ability lines read as formulas — e.g. <code>21% × STR</code> — because
          a pet's real numbers depend on its strength (see Owned Pets below). A 📋 badge on a species
          card means you own that many of it; click the badge to peek at them.</p>
        </div>
      </details>

      <details class="guide-sec">
        <summary>📋 Owned Pets — your actual pets</summary>
        <div class="guide-body">
          <p>This section tracks the individual pets you own — one card per pet, with nickname,
          mutation, weight, and ability values computed from its strength.</p>
          <p><strong>The strength model:</strong> every ability stat scales by
          <code>base × (strength / 100)</code>. A pet spawns with a fixed <em>max strength</em>
          (80–100) and levels up from a <em>current strength</em> (50 up to its max). Cards show each
          ability's value at your pet's current strength <em>and</em> at its max, so you can see what
          it'll do fully leveled. Example: Egg Growth Boost I at strength 80 → 16.8%/min chance,
          −5.6 min hatch time; at 100 → 21%/min, −7 min.</p>
          <p><strong>Adding pets:</strong> ＋ Add pet opens the form — pick the species, optionally
          nickname it, set current/max strength, weight, tap the abilities it rolled, and choose
          Gold/Rainbow if mutated.</p>
        </div>
      </details>

      <details class="guide-sec">
        <summary>⇪ Importing pets from the game</summary>
        <div class="guide-body">
          <p>Instead of typing pets in one by one, you can export them straight from
          <strong>magicgarden.gg</strong> and import the JSON here.</p>
          <p><strong>If you run GardenPilot:</strong> open DevTools (F12) on the game tab and run:</p>
          <div class="guide-cmd">
            <code id="guide-getpets">${GETPETS_CMD}</code>
            <button class="guide-copy" data-copy="guide-getpets">Copy</button>
          </div>
          <p>That puts your full pet list on the clipboard. Then on the Owned Pets page, click
          <em>⇪ Import JSON</em>, paste (or save it as a .json file and drop it in), preview, and
          import. Pets already in your tracker are skipped automatically, so re-importing later is
          safe.</p>
          <p><strong>Without GardenPilot:</strong> install the standalone exporter userscript —
          <code>tools/mg-pet-exporter.user.js</code> in this project's GitHub repo — via
          Tampermonkey. It adds a small 🐾 Export Pets button to the game that downloads the same
          JSON. It only reads data; it never sends anything to the game.</p>
          <p><em>Heads-up:</em> the game export doesn't include strength, so imported pets default
          to 100/100 — edit any pet afterward to set its real levels.</p>
        </div>
      </details>

      <details class="guide-sec">
        <summary>💾 Backup — export &amp; migrate everything</summary>
        <div class="guide-body">
          <p>The Backup page exports your data — plant discoveries, pet discoveries, owned pets, or
          all of it — as a single JSON file you can keep anywhere. The same page imports such a file
          back, merging it into your account (existing entries aren't duplicated). Use it as a
          backup, or to move your progress to another account.</p>
        </div>
      </details>

      <details class="guide-sec">
        <summary>❓ Tips</summary>
        <div class="guide-body">
          <p>Game data (crops, pets, sprites, abilities) comes live from the AriesMod API — the
          journal updates automatically when the game adds content. Your tab and toolbar choices
          persist as you navigate. If something looks stale, a hard refresh
          (Ctrl/Cmd+Shift+R) re-pulls everything.</p>
        </div>
      </details>
    </div>`;
}

export function init() {
  document.querySelector('.guide-wrap')?.addEventListener('click', async e => {
    const btn = e.target.closest('.guide-copy');
    if (!btn) return;
    const code = document.getElementById(btn.dataset.copy);
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code.textContent);
      btn.textContent = 'Copied ✓';
      setTimeout(() => { btn.textContent = 'Copy'; }, 1600);
    } catch {
      btn.textContent = 'Select & copy manually';
    }
  });
}

export function destroy() {}
