import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Load server/.env explicitly by file location, not by resolving against
// process.cwd() (dotenv's default) — `npm run server` runs with cwd set to
// the project root, so the default lookup would miss a .env placed here.
//
// This must be its own module, imported FIRST (before any api/_lib/* module
// that reads process.env at the top level, like ANTHROPIC_API_KEY) — ES
// module imports are hoisted and execute in declaration order, so a bare
// `config(...)` call sitting after those imports in index.js would run too
// late to have any effect.
config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });
