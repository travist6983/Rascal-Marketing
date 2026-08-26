/**
 * Loads `.env` from the repo root, if there is one.
 *
 * Node does not read `.env` on its own, and every script here that needs a
 * credential reads it straight off `process.env` — so a key sitting in a file
 * one directory up is a key the script cannot see. That failure is quiet in the
 * worst way: `npm run social:captions` gets as far as printing the post id it is
 * working on before the SDK says "Could not resolve authentication method",
 * which names neither the file it wanted nor the variable it wanted in it.
 *
 * A real environment variable always wins over the file. In CI there is no
 * `.env` and the secrets arrive as environment variables; if a developer ever
 * has both, the one they exported deliberately for this run is the one they
 * meant. `process.loadEnvFile` has no such option, so the values that were
 * already set are put back after it runs.
 *
 * Import for the side effect, first, before anything reads `process.env`.
 */
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ENV_FILE = join(dirname(dirname(fileURLToPath(import.meta.url))), '.env');

if (existsSync(ENV_FILE)) {
  const exported = { ...process.env };
  try {
    process.loadEnvFile(ENV_FILE);
    for (const [name, value] of Object.entries(exported)) process.env[name] = value;
  } catch (error) {
    /* A malformed .env should not take the command down — say which file, and
       carry on to the missing-credential message the script already writes. */
    process.stderr.write(`warning: could not read ${ENV_FILE} — ${error.message}\n`);
  }
}
