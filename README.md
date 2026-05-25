# 🌍 LearnQuest

A fun, adaptive learning game for kids — built so you and Nithya can learn together and *keep* what you learn. It runs as a **PWA** (installs to any phone's home screen, works offline), syncs across phones, and uses a spaced-repetition brain so the right things come back at the right time.

**Phase 0 (this build):** the full foundation + a playable **Geography** slice — flags, capitals, and an interactive world map — with profiles, friendly competition, XP/streaks/badges, a grown-up dashboard, and live AI memory-tricks.

Coming next: full geography (all continents + US states map), then Spelling Bee, Nature, and Greek Mythology.

---

## How it works (the learning design)

- **Every fact is a flashcard** in a Leitner spaced-repetition system (`src/srs/engine.ts`). Miss it → it comes back soon. Nail it repeatedly → it spaces out and is marked *mastered*.
- **A daily session** = warm-up reviews that are *due* → a few brand-new places in teach-mode (flag + capital + map + AI memory trick + read-aloud) → a mixed quiz → confetti.
- **It adapts.** Wrong answers are re-asked the same session and resurface sooner on later days. The dashboard surfaces exactly what she finds tricky.
- **Multiple quiz styles** keep it fresh: flag→country, country→capital, capital→country, and tap-it-on-the-map.

## Run it locally

```bash
npm install
npm run dev        # open the printed URL on your computer or phone (same Wi-Fi)
npm run test       # spaced-repetition engine tests
npm run build      # production build into dist/
```

It works immediately with **no setup** — progress saves on the device. Cloud sync and AI turn on once you add the keys below.

---

## Optional: cloud sync across phones (Firebase, free)

1. Create a project at <https://console.firebase.google.com> (Spark/free plan is fine).
2. **Build → Authentication → Sign-in method → enable Anonymous.**
3. **Build → Firestore Database → Create database** (production mode).
4. **Project settings → General → Your apps → Web app (`</>`)** → copy the config values.
5. Copy `.env.example` to `.env` and paste them into the `VITE_FIREBASE_*` variables.
6. Publish the security rules (locks data to signed-in players):
   ```bash
   npx firebase deploy --only firestore:rules
   ```

To share progress with a second phone: open the app on both, go to **Dashboard → Sync**, and set the same **Family Code** on each (the code field is stored per device).

## Optional: live AI memory-tricks (Cloudflare Worker + Anthropic, free tier)

The API key must stay off the phone, so a tiny Cloudflare Worker proxies the calls.

1. Get an Anthropic API key at <https://console.anthropic.com>.
2. Create a free Cloudflare account, then:
   ```bash
   cd worker
   npx wrangler login
   npx wrangler secret put ANTHROPIC_API_KEY   # paste the key when prompted
   npx wrangler deploy
   ```
3. Copy the deployed URL (e.g. `https://learnquest-ai.<you>.workers.dev`) into `VITE_AI_PROXY_URL` in `.env`.
4. Optional: in `worker/wrangler.toml`, set `ALLOWED_ORIGIN` to your app's URL to lock the proxy down.

Without this, the game still works — it just skips the AI tips. AI results are cached so you never pay twice for the same hint.

## Optional: deploy the app (Firebase Hosting, free)

```bash
npm run build
npx firebase deploy --only hosting
```

Then open the hosting URL on your phone and **Add to Home Screen**. (Any static host works — Cloudflare Pages, Netlify, etc. For a GitHub Pages *project* site, set Vite's `base` to `'/move_jump_game/'`.)

---

## Project map

```
src/
  srs/engine.ts            spaced-repetition brain (+ tests)
  state/store.ts           profiles, XP/streaks/badges, persistence
  data/storage.ts          storage interface + local adapter
  data/firebase.ts         cloud sync adapter (lazy-loaded)
  ai/client.ts             talks to the Worker proxy (cached, optional)
  content/geography/       countries dataset + quiz generator
  components/              Flag, WorldMap, TopBar
  screens/                 ProfileSelect, Home, GeographySession, Dashboard
worker/                    Cloudflare Worker AI proxy
legacy/platformer.html     the original move+jump game (kept for reference)
```

## Roadmap

- **Phase 1** — all continents + US-states map, richer dashboard, more AI.
- **Phase 2** — Spelling Bee & vocabulary (uses read-aloud already wired in).
- **Phase 3** — Animals, birds & plants (image ID + sorting).
- **Phase 4** — Greek mythology & history (story-first).
