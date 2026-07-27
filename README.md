# Astrological Anna Dating App

A dating app concept where **Anna**, an astrology-obsessed anime-styled host, walks you through a multi-stage onboarding survey (starting with your birth date, time, and location — the three inputs needed for a full natal chart). The UI is inspired by Nintendo Mii character creation, DSi-era handheld menus, and Japanese game level maps.

Started as a live voice-coded prototype in a Codex session on 2026-07-27, then migrated here as a real project. See [PROTOTYPE-NOTES.md](PROTOTYPE-NOTES.md) for the original session write-up.

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
assets/
  party-photo.jpg     Party photo used on the landing page collage
  portrait.png        Anna's original portrait (with background)
  portrait-cutout.png Anna's transparent-background cutout (neutral expression)
  love.png            Expression variant for the Emotion Beta (love)
  sad.png             Expression variant (sad)
  scared.png          Expression variant (scared)
  angry.png           Expression variant (angry: red eyes, steam from ears)
  steam-left.png      Steam cloud layers cropped from angry.png; CSS-animated
  steam-right.png     (puffing loop) over the ears while angry is selected
  astronomy.browser.min.js  Vendored astronomy-engine (MIT) — real ephemeris math
  synastry.js         Full-chart tropical synastry: builds both natal charts (10
                      planets + Ascendant), cross-aspects them, scores 0-100.
                      Anna's birth data lives here: 1996-10-19 21:36,
                      Fredericton NB, Canada (America/Moncton)
PROTOTYPE-NOTES.md    Original prototype documentation from the Codex session
```

## What the current screen does

- **Background:** looping star-field video (`stars.mp4`) covering the full viewport.
- **Level map (top):** a pixel-game-inspired progress rail — pink connected routes with five chrome-blue circular stage nodes, styled after handheld-console level maps. Node 1 is active. Pink is the primary color, chrome/silver the secondary.
- **Anna (center):** large frameless transparent cutout portrait, anchored to the bottom edge of the viewport.
- **Survey card (right):** three inputs — Birth Date, Birth Time, Birth Location — plus a big red NEXT button.
- **Emotion Beta (bottom-left):** four buttons (neutral, love, sad, scared) intended to swap Anna's expression.

## Known limitations (honest state of things)

- The **NEXT button opens a testing modal**, not the real stage-2 flow — the compatibility report is the placeholder end state for now; survey stages 2-5 don't exist yet.
- Location autocomplete uses **Open-Meteo geocoding** (free, no key) rather than Google Places; it returns lat/lon + IANA timezone, which the chart math needs. Swap in Google later if desired (needs an API key).
- The synastry scoring weights/orbs are hand-rolled and tuned for fun, not certified by an astrologer.
- Not deployed anywhere; local only.

## Intended direction / next steps

1. Turn the single page into a structured multi-stage survey (the level-map nodes = survey stages) with local state and validation.
2. Wire Emotion Beta to swap between `portrait-cutout.png`, `love.png`, `sad.png`, `scared.png`.
3. Add location autocomplete (Google Places or similar) once an API key is provided.
4. Compute an actual natal chart from birth date/time/location and use it for matching.
5. Deploy (likely Vercel, consistent with other Danger Testing projects).

## Design references from the original session

- Handwritten sketch: ten numbered stages across the top, character centered-left, birth-detail fields on the right.
- Nintendo DSi / Mii-maker vibes for the form controls.
- Powerpuff-Girl-cute, anime/Japanese-game aesthetic for the progress rail: pink + chrome silver, hearts and sparkles.
- Mario-style level map (user-provided reference) → recreated as an original connected-path progress bar.
