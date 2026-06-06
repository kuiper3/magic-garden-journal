// ═══════════════════════════════════════════════
// Magic Garden Journal — js/pages/guide.js
// v0.8.0 — instructions page (flat sections, no accordions)
// ═══════════════════════════════════════════════

const GETPETS_CMD = 'copy(JSON.stringify(GardenPilot.inventory.getPets(), null, 2))';
const EXPORTER_RAW = 'https://raw.githubusercontent.com/kuiper3/magic-garden-journal/main/tools/mg-pet-exporter.user.js';

export function render(container) {
  container.innerHTML = `
    <link rel="stylesheet" href="css/guide.css">
    <div class="guide-wrap">
      <h2 class="guide-title">📖 Guide</h2>
      <p class="guide-intro">How to use the journal. Everything you track is saved to your account
      and syncs across devices.</p>

      <section class="guide-sec">
        <h3>Getting your pets out of the game</h3>
        <p>You don't have to type your pets in by hand — export them from
        <strong>magicgarden.gg</strong> as a JSON file and import it here. The exporter is a small
        Tampermonkey userscript that only <em>reads</em> the game's data; it never sends anything.</p>
        <ol class="guide-steps">
          <li>Install the <strong>Tampermonkey</strong> browser extension (Chrome, Edge, or Firefox).</li>
          <li>Open the exporter script: <a href="${EXPORTER_RAW}" target="_blank" rel="noopener">mg-pet-exporter.user.js ↗</a>.
              Tampermonkey will pop up an install screen — click <strong>Install</strong>.
              (If it just shows code, copy it all, then in Tampermonkey choose
              <em>Create a new script</em>, paste, and save.)</li>
          <li>Open or refresh <strong>magicgarden.gg</strong> and let it load into your garden.</li>
          <li>A <strong>🐾 Export Pets (N)</strong> button appears in the bottom-right corner — N is
              how many pets it found. Click it: the JSON is copied to your clipboard <em>and</em>
              downloaded as a file.</li>
        </ol>
        <p class="guide-alt"><strong>Running GardenPilot?</strong> You can skip the userscript — open
        DevTools (F12) on the game tab and run this instead:</p>
        <div class="guide-cmd">
          <code id="guide-getpets">${GETPETS_CMD}</code>
          <button class="guide-copy" data-copy="guide-getpets">Copy</button>
        </div>
      </section>

      <section class="guide-sec">
        <h3>Importing pets into the journal</h3>
        <p>Go to <strong>Owned Pets</strong> and click <strong>⇪ Import JSON</strong> (next to
        ＋ Add pet). Drop the downloaded .json file into the box, choose it with the file picker, or
        paste the JSON — then hit <strong>Preview</strong> to see what will be imported, and
        <strong>Import</strong>. Pets already in your tracker are skipped automatically, so
        re-importing after hatching new pets is safe.</p>
        <p>One thing the game export doesn't include is <strong>strength</strong> — imported pets
        default to 100/100. Tap ✎ on any pet afterward to set its real current and max strength.</p>
      </section>

      <section class="guide-sec">
        <h3>Plants — crop variant tracking</h3>
        <p>The Plants page lists every crop with its discovery progress. Click a crop to open its
        variant modal — tap tiles to mark variants you've collected, or use Check All / Clear All.
        The Conditions tab shows the same variants as one big sprite grid. The toolbar has search,
        sorting, card/list view, and a Missing-only filter; the progress bar counts every variant
        across all crops.</p>
      </section>

      <section class="guide-sec">
        <h3>Pets — species discovery</h3>
        <p>Works like Plants, but per species: track which mutations (Normal, Gold, Rainbow, Max
        Weight) you've collected. The modal also shows each species' egg, diet, and abilities.
        Ability lines read as formulas — e.g. <code>21% × STR</code> — because the real numbers
        depend on a pet's strength. A 📋 badge on a species means you own that many; click it to
        peek at them.</p>
      </section>

      <section class="guide-sec">
        <h3>Owned Pets — your actual pets</h3>
        <p>One card per pet you own: nickname, mutation, weight, and ability values computed from
        strength. The model: every ability stat scales by <code>base × (strength / 100)</code>. A
        pet spawns with a fixed <strong>max strength</strong> (80–100) and levels up from a
        <strong>current strength</strong> (50 → max). Cards show each ability at current strength
        <em>and</em> at max — e.g. Egg Growth Boost I at 80: 16.8%/min and −5.6 min; at 100:
        21%/min and −7 min.</p>
      </section>

      <section class="guide-sec">
        <h3>Backup &amp; migrating</h3>
        <p>Settings → <strong>Backup &amp; Import</strong> exports your plant discoveries, pet
        discoveries, and owned pets (any or all) into one JSON file. The same page imports such a
        file back, merging it without creating duplicates — use it as an offline backup or to move
        your progress to another account.</p>
      </section>

      <section class="guide-sec">
        <h3>Tips</h3>
        <p>Game data (crops, pets, sprites, abilities) comes live from the AriesMod API, so the
        journal picks up new game content automatically. If something looks stale after an update,
        hard-refresh (Ctrl/Cmd+Shift+R). The sidebar collapses to icons with the ‹ button; on
        mobile, open it with the ☰ button and tap anywhere outside to close it.</p>
      </section>
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
