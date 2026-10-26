import { readFile, access, readdir } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = resolve(root, 'public');
const html = await readFile(resolve(publicDir, 'index.html'), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
if (new Set(ids).size !== ids.length) throw new Error('Duplicate HTML IDs');
const idSet = new Set(ids);
const dynamicIds = new Set(['briefResultTitle']);
for (const match of html.matchAll(/\b(?:href|aria-controls|aria-labelledby)="#?([a-zA-Z][\w-]*)"/g)) {
  const value = match[1];
  if (!idSet.has(value) && !dynamicIds.has(value)) throw new Error(`Missing HTML target: ${value}`);
}
const assetRefs = [...html.matchAll(/\b(?:src|href)="(\/[^"#?]+)"/g)].map(match => match[1]);
for (const path of new Set(assetRefs)) await access(resolve(publicDir, '.' + path));
for (const path of ['404.html', '_headers', 'robots.txt', 'sitemap.xml', 'assets/axura-orbit.webp', 'assets/brand-logo.jpg']) await access(resolve(publicDir, path));
for (const file of await readdir(resolve(publicDir, 'assets'))) {
  if (file.endsWith('.js')) execFileSync(process.execPath, ['--check', join(publicDir, 'assets', file)], { stdio: 'inherit' });
}
const css = await readFile(resolve(publicDir, 'assets/site.css'), 'utf8');
for (const match of css.matchAll(/url\(['"]?(\/[^)'"\s]+)['"]?\)/g)) await access(resolve(publicDir, '.' + match[1]));
const config = JSON.parse(await readFile(resolve(root, 'wrangler.jsonc'), 'utf8'));
if (config.name !== 'axuraweb' || config.assets.directory !== './public') throw new Error('Unexpected Worker configuration');
if (!config.routes.some(route => route.pattern === 'axura.cloud' && route.custom_domain === true)) throw new Error('Missing axura.cloud custom domain');
if (!html.includes('lang="id"') || (html.match(/<h1\b/g) || []).length !== 1) throw new Error('Invalid document language or heading');
if (/https?:\/\//.test(css)) throw new Error('Stylesheet must use local assets');
console.log(`Verified ${ids.length} unique IDs, local assets, JS syntax, and axura.cloud Worker configuration.`);
