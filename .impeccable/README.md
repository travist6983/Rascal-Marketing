# Impeccable config

`screenshots/**` is generated contact-sheet HTML from `npm run check` and
`scripts/motion-filmstrip.mjs`, not part of the site. It is gitignored, and the
detector flags its throwaway markup, so it is excluded here.

Run the detector with:

    npm run design        # static scan of the source files
    npm run design:live   # full browser scan (starts a server; needs puppeteer)

## Waived rules

**`text-occlusion`** — the hero is a card deck: four prompt cards stacked in the
same absolute position, with the ones behind deliberately overlapping and
`aria-hidden`. Painted text over painted text is what a deck *is*, so the rule
reports 9 findings that cannot be fixed without deleting the interaction.
Several also point an inline `<span>` at its own parent paragraph, which is a
measurement artefact rather than a real overlap.

Waived for the project rather than per-file because the findings come from the
browser run against a URL, which has no file to attach an inline ignore to.
