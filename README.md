# Magic Garden Journal

> **Document version:** `0.1.0`
> **Last updated:** 2026-05-11
>
> **Version history (this doc):**
> - `0.1.0` — Initial README written during planning phase

---

A personal, password-protected web app for tracking discovered crop and pet variants in [Magic Garden](https://magicgarden.gg).

> **Status:** Pre-development. Version `0.1.0` is scaffolding only — see [`ROADMAP_v0.1.0.md`](./ROADMAP_v0.1.0.md) for milestones.

---

## What it is

The in-game Garden Journal tracks every variant of every crop and pet you've discovered. This app mirrors that progress in a clean, mobile-friendly interface that syncs between phone and PC. Game data is pulled live from the unofficial [Magic Garden API](https://mg-api.ariedam.fr), so new crops, pets, and mutation variants appear automatically as the game updates.

This is a **single-user app**. Sign-ups are disabled at the Supabase project level.

---

## Tech stack

- **Frontend:** vanilla JavaScript (ES modules), plain CSS, no framework, no build step
- **Hosting:** [Vercel](https://vercel.com) (static)
- **Auth + DB:** [Supabase](https://supabase.com) (email/password auth, Postgres with RLS)
- **Game data:** [Magic Garden API](https://mg-api.ariedam.fr) by [@Ariedam64](https://github.com/Ariedam64)

See [`ARCHITECTURE_v0.1.0.md`](./ARCHITECTURE_v0.1.0.md) for full design.

---

## Local development

```bash
git clone https://github.com/kuiper3/magic-garden-journal.git
cd magic-garden-journal
cp .env.example .env.local
# fill in SUPABASE_URL and SUPABASE_ANON_KEY
npx serve .
```

Open `http://localhost:3000`. No bundler — edit a file, refresh the browser.

---

## Environment variables

| Name | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Public anon key from Supabase dashboard |
| `ARIES_API_BASE` | `https://mg-api.ariedam.fr` |

Set these in Vercel under **Project Settings → Environment Variables**. The Supabase anon key is safe to expose in the browser — RLS protects the data.

---

## Supabase setup

1. Create a new project at [supabase.com](https://supabase.com).
2. **Authentication → Providers:** enable Email; disable "Email confirmations."
3. **Authentication → Users:** add your owner account.
4. Disable sign-ups in project settings.
5. Run the schema SQL from `ARCHITECTURE_v0.1.0.md` §6 in the SQL Editor.
6. Copy the project URL and anon key into `.env.local`.

---

## Deploy to Vercel

1. Push repo to GitHub.
2. Import in Vercel — framework preset: **Other**.
3. Add env vars from the table above.
4. Deploy. Sign in at your `*.vercel.app` URL with your Supabase credentials.

---

## Project documentation

| File | Purpose |
|---|---|
| `ARCHITECTURE_v0.1.0.md` | System design, schema, module boundaries |
| `ROADMAP_v0.1.0.md` | Versioned milestones for all three phases |
| `CHANGELOG_v0.1.0.md` | Release history |
| `AI_HANDOFF_v0.1.0.md` | Context for AI assistants picking up the project |

---

## Related repos

| Repo | Status | Purpose |
|---|---|---|
| `magic-garden-journal` *(this)* | In planning | Personal journal tracker |
| `magic-garden-stock` | Not started | Live shop & weather viewer (Phase 2) |
| `magic-garden-alexa-bridge` | Not started | Voice Monkey announcements, designed for sharing (Phase 3) |

---

## Credits

- Game: [Magic Garden](https://magicgarden.gg)
- API: [Magic Garden API](https://github.com/Ariedam64/Magic-Garden-API) by Ariedam64

Unofficial project, not affiliated with the Magic Garden developers or Ariedam64.
