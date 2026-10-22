# Learnify (front end)

A place for curious minds. Learnify pulls from Wikipedia and Wikidata so readers can start anywhere and keep digging deeper: insects → bees → honey → sugar → molecules.

Every topic page has a short summary, the full article in collapsible sections, quick facts (birthplace and age for people; population and area for places), and three ways onward:

- **Dive deeper**: closely connected topics and the ones the article talks about most
- **Alongside**: similar topics at the same level
- **Zoom out**: the broader category a topic belongs to

**Listen:** every section has a Listen button (text to speech with your device's voices, adjustable speed and voice). Sections start collapsed. Voices come from your device, so quality varies: Learnify picks the most natural one it finds, and Account → Read aloud explains how to install a better one.

Signed-in users can save favorites, pick up where they left off, and keep their reading settings (text size, high-contrast dark mode, content filter) on every device.

## Stack

React 19, Vite, react-router-dom, plain CSS. Accounts and saved data use [Supabase](https://supabase.com) (Auth plus Postgres with Row Level Security). Content comes from the Wikipedia and Wikidata APIs, which need no key.

## Run it

```bash
cp .env.example .env.local     # then fill in the two values below
npm install
npm run dev                    # http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build into `dist/` |
| `npm run lint` | Lint `src/` with oxlint |

`.env.local` needs:

| Variable | Where to find it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase dashboard → Project Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Same page. The publishable key is safe in the browser because Row Level Security protects the data. Never use a `service_role` key here |

## Supabase tables this app expects

Each table is owned by a user (`user_id` references `auth.users`) and protected by Row Level Security so people only see their own rows.

| Table | Columns the app uses |
|---|---|
| `profiles` | `id`, `display_name`, `text_size` (`md`/`lg`/`xl`), `theme` (`light`/`contrast`), `content_filter` (`off`/`nsfw`/`kids`). A trigger creates the row at sign-up |
| `favorites` | `user_id`, `topic_title` (unique per user) |
| `last_position` | `user_id` (primary key), `trail` (jsonb array of topic titles) |

Without these tables the app still works for browsing; sign-in, favorites and saved position need them.

## Project layout

See [`PROJECT_MAP.md`](PROJECT_MAP.md) for a file-by-file map. In short: `src/pages` (one file per route), `src/components`, `src/context` (auth, settings, favorites), `src/hooks`, and `src/services` (`wikiService.js` is the only file that talks to Wikipedia and Wikidata; the other services wrap Supabase).

## Data and licensing

Article text comes from Wikipedia under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), and structured facts from Wikidata under CC0. Each topic page links back to its Wikipedia article.
