# Astrological Anna Dating App

A dating app concept where **Anna**, an astrology-obsessed anime-styled host, walks you through a multi-stage onboarding survey (starting with your birth date, time, and location — the three inputs needed for a full natal chart). The UI is inspired by Nintendo Mii character creation, DSi-era handheld menus, and Japanese game level maps.

Started as a live voice-coded prototype in a Codex session on 2026-07-27, then migrated here as a real project. See [PROTOTYPE-NOTES.md](PROTOTYPE-NOTES.md) for the original session write-up.

**Live at https://astrological-anna.vercel.app** — and for how the whole thing actually works (stage flow, the two looks judges, the reaction system, deployment and key handling), read [ARCHITECTURE.md](ARCHITECTURE.md).

## How to run it

No build step, no dependencies. It's a single static HTML page:

```bash
cd astrological-anna-dating-app
python3 -m http.server 4173
# open http://localhost:4173 in Safari/any browser
```

Or just open `index.html` directly in a browser.

## Project structure

```
index.html            Landing page: "ANNA DOESN'T WANT TO DATE YOU", party photo with
                      the guy scissored out (white CSS clip-path cutout), "this could
                      be you" arrow, sticky glossy candy button -> survey.html
survey.html           The survey: level-map progress rail, Anna portrait, DSi-style
                      birth card (month/day/year + hh:mm + AM/PM pickers), city
                      autocomplete, Emotion Beta swapper, and the NEXT compatibility
                      modal (testing flow)
stars.mp4             Looping blue star-field video, used as the full-bleed background
css/                  base.css (shared palette + star background), landing.css,
                      survey.css
js/survey.js          Stages 1-4 and all wiring: pickers, city autocomplete,
                      photobooth, reaction system, reveals, dev hooks
js/final.js           Stage 5: the final verdict screen (standalone module)
api/judge.js          Vercel serverless function: the AI looks judge. Holds
                      ANTHROPIC_API_KEY server-side so it never reaches a browser
config.local.js       Local-dev API key. GITIGNORED + VERCELIGNORED — never commit
css/mobile.css        Phone layout pass (the survey is mostly used on mobile)
SYNASTRY-NOTES.md     Every scoring node documented: weights, aspects, orbs, the
                      air bonus / water penalty, Moon-Venus-Mars chemistry, tiers
assets/
  party-photo.jpg     Party photo used on the landing page collage
  portrait.png        Anna's original portrait (with background)
  portrait-cutout.png Anna's transparent-background cutout (neutral expression)
  love.png            Expression variant for the Emotion Beta (love)
  sad.png             Expression variant (sad)
  scared.png          Expression variant (scared)
  angry.png           Expression variant (angry: red eyes, steam from ears)
  smug.png            Expression variant (smug: raised brow, judging smirk)
  laughing.png        Expression variant (laughing: eyes shut, full cackle)
  disgusted.png       Expression variant (disgusted: recoiling "ew" face)
  starstruck.png      Expression variant (starstruck: wide sparkly-eyed awe)
  steam-left.png      Steam cloud layers cropped from angry.png; CSS-animated
  steam-right.png     (puffing loop) over the ears while angry is selected
  astronomy.browser.min.js  Vendored astronomy-engine (MIT) — real ephemeris math
  synastry.js         Full-chart tropical synastry: builds both natal charts (10
                      planets + Ascendant), cross-aspects them, scores 0-100.
                      Anna's birth data lives here: 1996-10-19 21:36,
                      Fredericton NB, Canada (America/Moncton)
  taste.js            Movie-taste classifier: arthouse canon vs. normie list
  looks.js            Local pixel-math looks judge — supplies the face box for
                      the polaroid/standee crops, and the AI judge's fallback
  looks-ai.js         Claude vision looks judge (client side; posts to
                      /api/judge when deployed, direct when local)
  mediapipe/          Vendored MediaPipe selfie segmentation — real background
                      removal for the polaroid, runs offline (no CDN)
PROTOTYPE-NOTES.md    Original prototype documentation from the Codex session
```

## What the current screen does

- **Background:** looping star-field video (`stars.mp4`) covering the full viewport.
- **Level map (top):** a pixel-game-inspired progress rail — pink connected routes with five chrome-blue circular stage nodes, styled after handheld-console level maps. Node 1 is active. Pink is the primary color, chrome/silver the secondary.
- **Anna (center):** large frameless transparent cutout portrait, anchored to the bottom edge of the viewport.
- **Survey card (right):** three inputs — Birth Date, Birth Time, Birth Location — plus a big red NEXT button.
- **Beta panels (bottom-left, dev only):** Emotion Beta swaps between Anna's nine expressions; Animation Beta picks a background effect. Both are hidden in production — see [ARCHITECTURE.md](ARCHITECTURE.md) for how reactions fire automatically instead.

## Known limitations (honest state of things)

- **NEXT flashes the compatibility reveal** (animated ring + counting %, Anna reacts: ≥70 love, 40-69 neutral, 20-39 sad, <20 scared) then advances the stage. Each stage reveals **its own** score with its own label ("movie compatibility", "looks compatibility", "height compatibility"); the running cumulative total is what stage 5 aggregates. The **ⓘ more info** button shows the full report for the test you just finished.
- **Stage 2 scores movie taste** (`assets/taste.js`): each shelf movie seen = +1.5; if ≤3 seen, NEXT demands ≥2 typed favorites (floating card, poster lookup via the **Wikipedia API** — free, no key; iTunes Search was tried but Apple emptied its movie catalog). Favorites are classified against a curated arthouse canon (+7 each) vs. a basic-normie list/franchise patterns (−9 each); unknowns score 0. The taste modifier is capped at ±25 and folded into the reveal + report.
- **Beta panels** (bottom-left) each have a −/+ button to hide/show them; the state persists in localStorage.
- Location autocomplete uses **Open-Meteo geocoding** (free, no key) rather than Google Places; it returns lat/lon + IANA timezone, which the chart math needs. Swap in Google later if desired (needs an API key).
- The synastry scoring weights/orbs are hand-rolled and tuned for fun, not certified by an astrologer. Same goes for the taste lists and looks thresholds.
- **The beta panels are dev-only** — hidden in production, where animations and expressions fire automatically per stage and per score instead.
- `/api/judge` (the AI looks judge) is public and unrate-limited. Set a spend limit in the Anthropic Console.

## Intended direction / next steps

All five stages, the natal-chart math, autocomplete, the automated reactions, and the Vercel deploy are done. What's left:

1. **Optimize the images** — the expression PNGs are ~1.8MB each and the portraits 4.5–6.5MB. Resize + WebP for a ~90% cut; this is the biggest remaining mobile win.
2. Rate-limit `/api/judge` if the site gets shared widely.
3. Add analytics — right now there's no signal that anyone is using it.
4. A short privacy line on the looks stage, since photos go to the Anthropic API when the AI judge runs.
5. Optional: swap Open-Meteo for Google Places if the city list ever feels thin.

## Design references from the original session

- Handwritten sketch: ten numbered stages across the top, character centered-left, birth-detail fields on the right.
- Nintendo DSi / Mii-maker vibes for the form controls.
- Powerpuff-Girl-cute, anime/Japanese-game aesthetic for the progress rail: pink + chrome silver, hearts and sparkles.
- Mario-style level map (user-provided reference) → recreated as an original connected-path progress bar.
