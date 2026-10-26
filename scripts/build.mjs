import { mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fonts = [
  ['manrope', 'manrope-latin-wght-normal.woff2'],
  ['space-grotesk', 'space-grotesk-latin-wght-normal.woff2'],
];
await mkdir(resolve(root, 'public/assets/fonts'), { recursive: true });
for (const [name, file] of fonts) {
  await copyFile(resolve(root, 'node_modules/@fontsource-variable', name, 'files', file), resolve(root, 'public/assets/fonts', file));
  await copyFile(resolve(root, 'node_modules/@fontsource-variable', name, 'LICENSE'), resolve(root, 'public/assets/fonts', `${name}-LICENSE.txt`));
}
await import('./check.mjs');
