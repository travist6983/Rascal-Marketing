# Impeccable config

`screenshots/**` is generated contact-sheet HTML from `npm run check` and
`scripts/motion-filmstrip.mjs`, not part of the site. It is gitignored, and the
detector flags its throwaway markup, so it is excluded here.

Run the detector with:

    npm run design        # static scan of the source files
    npm run design:live   # full browser scan (starts a server; needs puppeteer)
