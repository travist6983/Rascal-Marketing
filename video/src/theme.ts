/**
 * The card's fixed vocabulary — the same tokens styles.css and social/card.css
 * use, so a card in motion and a card as a PNG are the same card.
 *
 * The palette lives in index.css as custom properties rather than as hexes here,
 * because social/prompts.js hands out tints as `var(--lav)` and friends. What is
 * exported from this file is only what has to be a JS value: the two type
 * stacks, the ground colours, the grain, and the one easing curve.
 */

import { loadFont } from "@remotion/fonts";
import { Easing, staticFile } from "remotion";

// Both faces are variable; one file covers the whole weight range each. The
// repo's assets/ is this project's public folder (see remotion.config.ts), so
// these resolve to assets/fonts/ — copies of the site's fonts/, because
// Remotion can only serve what sits under one public directory.
await Promise.all([
  loadFont({
    family: "Nunito",
    url: staticFile("fonts/nunito-var-latin.woff2"),
    weight: "600 800",
  }),
  loadFont({
    family: "Source Sans 3",
    url: staticFile("fonts/source-sans-3-var-latin.woff2"),
    weight: "400 600",
  }),
]);

export const DISPLAY = "'Nunito', system-ui, sans-serif";
export const TEXT = "'Source Sans 3', system-ui, sans-serif";

export const CANVAS = "#FDFAF4";
export const SURFACE = "#FFFDF9";
export const INK = "#23253C";
export const MUTED = "#6E6A63";

/** The landing page's paper grain, inlined so there is no asset to load. */
export const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.055'/%3E%3C/svg%3E\")";

/** Entrances arrive and stop. No bounce, no overshoot. Mirrors --ease-enter. */
export const ENTER = Easing.bezier(0.16, 1, 0.3, 1);

/** The card is 1080 × 1920 with a 96px margin; everything is sized off that. */
export const PAD = 96;
