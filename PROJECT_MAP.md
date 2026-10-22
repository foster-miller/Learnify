# Learnify Front-End Map

Paths are relative to the repository root. The Supabase database lives in a separate project (see README).

React 19 + Vite + react-router-dom, plain CSS, no state library. Content comes from Wikipedia and Wikidata. Accounts, favorites, last position and synced settings use Supabase. Scripts: `dev`, `build`, `lint` (oxlint src).

## Files and responsibilities

| Path | Responsibility |
|---|---|
| `index.html` | Shell, Google Fonts (Inter, Lora), loads `src/main.jsx` |
| `src/main.jsx` | Boot. Provider order: StrictMode > BrowserRouter > AuthProvider > SettingsProvider > FavoritesProvider > App |
| `src/App.jsx` | Route table under `Layout`: `/`, `/search`, `/topic/:title`, `/random`, `/favorites`, `/signin`, `/account`, `*` |
| `src/config/app.js` | `APP_NAME`, `TAGLINE`, `GROUPS`, `CATEGORIES` (16 starters), `SUGGESTIONS` |
| `src/config/paths.js` | `topicPath`, `searchPath` URL builders |
| `src/services/wikiService.js` | Only file that talks to Wikipedia and Wikidata: `search`, `getTopics`, `getSummary`, `getArticle` (full text split into sections), `getRelated` (Wikidata facts, deeper and zoom-out topics), `getMentionedTopics` (article links ranked by mentions), `getLateralTopics` (`morelike:`), `getRelatedCategories`, `getRandomTopic`. Cached, normalized to `Topic` |
| `src/services/contentFilter.js` | Keyword filter, level `off` / `nsfw` / `kids` |
| `src/services/supabaseClient.js` | Supabase client from `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (`.env.local`) |
| `src/services/authService.js` | Supabase Auth, email + password: `getUser`, `onChange`, `signIn`, `signUp`, `signOut` |
| `src/services/favoritesService.js` | `public.favorites` (topic titles only); RLS limits rows to the signed-in user |
| `src/services/lastPositionService.js` | `public.last_position`: one drill-down trail per user, saved with an upsert |
| `src/services/profileService.js` | `public.profiles`: text size, theme and mature toggle (parental PIN stays on the device) |
| `src/context/SettingsContext.jsx` | Text size, theme, mature toggle, parental PIN; derives filter level; sets `--text-scale` and `data-theme`; loads and saves the profile when signed in |
| `src/context/AuthContext.jsx` | `{user, loading, signIn, signUp, signOut}` |
| `src/context/FavoritesContext.jsx` | `{titles, isFavorite, toggle}`; optimistic updates; `toggle` returns false when signed out |
| `src/hooks/useAsync.js` | Async-on-deps hook returning `{data, error, loading}`, ignores stale runs |
| `src/hooks/useTrail.js` | Drill-down breadcrumb path in sessionStorage |
| `src/utils/text.js` | `splitLead`: splits an intro paragraph into a short summary and the remainder, so no sentence repeats |
| `src/components/` | `Layout` (header, footer, mobile tab bar), `SearchBar`, `TopicCard`, `ResultCard`, `FavoriteButton`, `Breadcrumb`, `QuickFacts` (Wikidata facts), `ArticleSections` (collapsible article sections, contents list, `useOpenSections`), `Icons` |
| `src/pages/` | `Discover`, `Search`, `Topic`, `Random`, `Favorites`, `SignIn`, `Account` |
| `src/styles/` | `tokens.css` (colors, fonts, contrast theme), `global.css` (layout and components) |

## Feature locations

- **Discover:** `pages/Discover.jsx`, `config/app.js`, `TopicCard`
- **Search:** `pages/Search.jsx`, `SearchBar`, `ResultCard`, `wikiService.search`
- **Topic page:** `pages/Topic.jsx`. Hero shows a short summary; below it come the full article (`ArticleSections`), Quick facts (`QuickFacts`), then Keep exploring: Dive deeper, Alongside, Zoom out, Browse by category. Links extend the trail via `useTrail`
- **Random:** `pages/Random.jsx` fetches a topic then redirects to `/topic/:title` with `state.random`
- **Favorites:** `pages/Favorites.jsx`, `FavoritesContext`, `FavoriteButton`. Signed-out users are sent to `/signin` and return afterwards. Only titles are stored; details are re-fetched from Wikipedia
- **Resume:** `Topic` saves the trail with `lastPositionService`; `Discover` shows a Continue banner
- **Accessibility:** `pages/Account.jsx`, `SettingsContext`, `tokens.css`
- **Content filter:** applied in `wikiService` lists, in `Discover`, and via `isAllowed` in `Topic`. The level reaches the services through a module variable set by `SettingsContext`

## Drill-down data flow

1. A card links to `/topic/<title>`. Cards that start a path pass `state.trailReset`; links inside a topic page do not, so they extend the trail.
2. `useTrail(title)` resets, cuts back, or appends to the trail.
3. `Topic` runs `getSummary`, `getArticle`, `getLateralTopics` and `getRelatedCategories` in parallel through `useAsync`. When the article returns its Wikidata id, `getRelated` loads facts and deeper and zoom-out topics. `getMentionedTopics` ranks the article's links by how often the text mentions them.
4. Dive deeper = Wikidata connections first, then the most-mentioned linked topics. Zoom out = broader Wikidata items such as occupation, country or "subclass of". Alongside = `morelike:` search results not already shown.
5. Clicking a deeper topic appends to the trail. Clicking an earlier breadcrumb cuts the trail back to it.

## Maintainer notes

- Database: tables `profiles`, `favorites`, `last_position` with RLS; a trigger creates the profile on sign-up. The Supabase tables, policies and trigger are managed outside this repository.
- Sign-up needs Supabase's "Confirm email" off, or custom SMTP, to avoid the built-in email rate limit.
- The filter is best-effort keyword matching. The parental PIN is stored in plain text (demo only).
- There are no automated tests yet.
