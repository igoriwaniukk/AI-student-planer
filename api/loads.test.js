import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Vercel loads each function with plain Node, which — unlike Vite and these
// tests — doesn't forgive an import without its ".js" ending. A function
// that can't load answers every request with FUNCTION_INVOCATION_FAILED, so
// each one is loaded here exactly that way.
function functionFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return name === '_lib' ? [] : functionFiles(p);
    return name.endsWith('.js') && !name.endsWith('.test.js') ? [p] : [];
  });
}

describe('every Vercel function loads in plain Node', () => {
  for (const file of functionFiles('api')) {
    it(file, () => {
      const out = execFileSync(process.execPath, ['--input-type=module', '-e', `const m = await import('./${file}'); console.log(typeof m.default);`], { encoding: 'utf8', env: { PATH: process.env.PATH } });
      expect(out.trim()).toBe('function');
    });
  }
});
