# Synastry Scoring Notes

How the Cosmic Compatibility score is computed. This documents every node the engine
(`assets/synastry.js`) uses, for anyone who wants to learn what moved their number.
The math runs entirely in the browser using a real ephemeris
(`assets/astronomy.browser.min.js`, the MIT-licensed astronomy-engine).

## Anna's chart (the fixed side of every reading)

Born **October 19, 1996 at 9:36 PM** in **Fredericton, New Brunswick, Canada**
(45.95°N, 66.67°W, America/Moncton — ADT at that date).

Computed placements: **Libra Sun · Aquarius Moon · Gemini rising** (plus the other
seven planets, all used). Sun, Moon, AND rising all in air signs: Anna is air-sign
dominant, which is why the modifiers below lean the way they do.

(Her Moon sits at 0.4° Aquarius — right on the Capricorn cusp. Positions are
geocentric, the astrological standard; a topocentric calculation would parallax-shift
the Moon back into Capricorn, which is wrong and also slander.)

## Chart points and weights

Both charts use 11 points. Weights set how loudly a point speaks in aspects
(an aspect's impact is `weightA x weightB x aspect value x tightness`).

| Point | Weight |
|---|---|
| Sun | 4 |
| Moon | 4 |
| Venus | 3.5 |
| Mars | 3 |
| Ascendant (rising) | 3 |
| Mercury | 2.5 |
| Jupiter | 2 |
| Saturn | 2 |
| Uranus / Neptune / Pluto | 1 each |

Positions are geocentric tropical ecliptic longitudes of date. The Ascendant comes
from local sidereal time + birth latitude, so birth time and place genuinely matter.

## Cross-aspects (every one of your points vs every one of Anna's)

| Aspect | Angle | Orb | Value | Read |
|---|---|---|---|---|
| Conjunct | 0° | 8° | +0.9 | fused energy |
| Sextile | 60° | 4° | +0.6 | easy chemistry |
| Square | 90° | 6° | −0.8 | friction (the spicy kind) |
| Trine | 120° | 6° | +1.0 | effortless flow |
| Quincunx | 150° | 3° | −0.3 | awkward adjustment |
| Opposite | 180° | 7° | −0.55 | magnetic tug-of-war |

Tightness scaling: an exact aspect counts full; at the edge of orb it counts half
(`1 − offset/orb × 0.5`).

## Chart-level modifiers

These are Anna's stated preferences, layered on top of the aspect math:

- **Air bonus** — +2.5 points per placement you have in an air sign
  (Gemini, Libra, Aquarius). All 11 points count. Air is Anna's native element.
- **Water penalty** — −2.5 points per placement in a water sign
  (Cancer, Scorpio, Pisces). Heavy water drowns Anna's air.
- **Moon / Venus / Mars sign chemistry** — for each of these three, your sign vs
  Anna's same planet:
  | Relationship | Points |
  |---|---|
  | Exact same sign | +6 |
  | Same element | +4 |
  | Complementary element (fire↔air, earth↔water) | +3 |
  | Anything else | −4 |

## Age gate

Anna is 29. Her preferred range is **26–33**. Age is computed from the birth date
at the moment of the reading:

| Age | Effect |
|---|---|
| Under 20 | **Score is a hard 0.** No synastry can save you. The universe (and the law) said absolutely not. |
| 20–25 | −3 points per year below 26 |
| 26–33 | +3 (squarely in range) |
| 34–37 | −3 points per year above 33 |
| 38+ | −12, plus −4 per year past 37, capped at −35 |

## Final score

```
percent = 50 + (aspect score ÷ 2.2) + air bonus − water penalty
          + Moon/Venus/Mars chemistry + age adjustment
```
then stretched ×1.15 around 50 for spread, clamped to 2–99 (never 100 — the stars
don't deal in absolutes; the only true 0 is the teenager gate).

## Verdict tiers

| Percent | Verdict |
|---|---|
| 80+ | Anna might actually want to date you. |
| 60–79 | The stars are… intrigued. There is something here. |
| 40–59 | The stars say: mid. Proceed with caution. |
| 20–39 | Venus is fighting for her life here. |
| ≤19 | The universe said absolutely not. |

## Honesty section

Orbs, weights, the air/water lean, and the tier lines are tuned for fun and for
Anna's canon personality — this is a real ephemeris driving a playful rubric, not
certified astrological doctrine.
