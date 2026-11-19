// Leonida Legend — GTA 6 trophy guide entry (Node 22, standard library only).
// The guide itself is plain static files under app/ (index.html, style.css,
// app.js, storage.js, filters.js, data/trophies.json): no build step, and it
// loads nothing over the network. This program hands the entry in: it copies
// app/ and screenshots/ from beside this file into the output directory
// (/output in the grader, or MAKEFUN_OUTPUT_DIR outside it) and writes
// /output/dossier.json with buildDossier from the vendored make.fun library.
// vendor/makefun-frontend.ts stays exactly as the kit shipped it, so the
// dossier the scorer rebuilds matches this one byte for byte. The program
// writes the same bytes on every run: it copies files as they are and the
// dossier is a pure function of app/ and screenshots/.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
rmSync(join(outputDir, 'app'), { recursive: true, force: true });
rmSync(join(outputDir, 'screenshots'), { recursive: true, force: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
