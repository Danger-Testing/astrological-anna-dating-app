# Date Anna — Prototype Notes

## Where it lives

This is a local prototype, not an AppDanger project. It lives in the current Codex workspace under `work/mii-date/` and was served locally for Safari at `http://localhost:4173`.

## What exists

The prototype is a single static HTML page with no framework, database, deployment, authentication, analytics, or backend.

### Current screen

- A full-screen visual experience using a looping blue star-field video as the background.
- A large centered cutout portrait of Anna.
- A survey card with fields for birth date, birth time, and birth location.
- A large Next button.
- An Emotion Beta panel in the bottom-left.
- A pixel-inspired level map at the top, using connected pink paths and chrome-blue stage nodes as the progress treatment.

## Assets

The `work/mii-date/` directory contains:

- `index.html` — the complete current prototype.
- `portrait-cutout.png` — Anna's transparent-background portrait.
- `love.png`, `sad.png`, `scared.png` — generated expression variants for future Emotion Beta wiring.
- `*-key.png` — intermediate chroma-key source images retained while creating the transparent cutouts.

The background video and original portrait are referenced locally from earlier provided files. The current page expects the background video to be available as `stars.mp4` alongside `index.html`.

## What was changed during the session

1. Started from a handwritten layout reference: numbered stages across the top, a person centered/left, and survey inputs at right.
2. Converted the design into a responsive full-viewport static webpage.
3. Added the supplied portrait, then removed its background for an isolated cutout.
4. Added a speech-prompt concept, form styling, and an Emotion Beta concept.
5. Reworked progress several times, ending on the current original level-map treatment rather than separate number badges.

## Important limitations

- The Emotion Beta controls are currently visual controls; the final compact version does not yet switch between expression images.
- The Next button is present but does not yet persist answers or advance through ten survey stages.
- Birth location is a regular text field in the current compact version; it is not connected to Google Places or any other autocomplete API.
- Date and time fields are text inputs rather than validated, formatted controls.
- The page is only running locally and is not deployed.
- The app has no project configuration for AppDanger.

## Recommended next steps

1. Turn the static page into a structured multi-stage survey with local state and validation.
2. Wire the Emotion Beta buttons to `portrait-cutout.png`, `love.png`, `sad.png`, and `scared.png`.
3. Connect a location-autocomplete provider after supplying an API key and deciding on privacy handling.
4. Move this into a real application project before deployment, then add version control and a production hosting target.
