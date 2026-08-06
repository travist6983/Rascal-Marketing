# Source

Vendored from https://github.com/pbakaus/impeccable (v3.5.0, commit a075d89).

`npx impeccable install` could not be used: it fetches a skills bundle from a
host this environment's network policy blocks (HTTP 403). This is the prebuilt
`.claude/skills/impeccable` payload from the repository instead — the same
files that installer would have written.

The design hook (.claude/settings.json in the upstream repo) was deliberately
not installed. It runs the detector on every Edit/Write and again on Stop,
which changes agent behaviour for everyone working in this repo. Run
`npm run design` instead, or copy the hook block from upstream if you want it.

Update: re-copy from a fresh clone, or run `npx impeccable update` once the
host is reachable.
