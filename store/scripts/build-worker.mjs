import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { resolve, relative, extname } from 'node:path';
import { products } from '../src/catalog.mjs';
const root = resolve(import.meta.dirname,'..');
const dist = resolve(root,'dist');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8'};
const binary = new Set(['.webp','.jpg','.woff2']);
const assets = {};
async function walk(path) {
 for (const entry of await readdir(path,{withFileTypes:true})) {
  if (entry.name === 'server' || entry.name === '.openai' || entry.name === '_headers') continue;
  const full = resolve(path,entry.name);
  if (entry.isDirectory()) { await walk(full); continue; }
  const ext = extname(entry.name);
  const bytes = await readFile(full);
  assets['/' + relative(dist,full)] = {type:types[ext] || 'application/octet-stream',binary:binary.has(ext),content:bytes.toString(binary.has(ext)?'base64':'utf8')};
 }
}
await walk(dist);
const handler = await readFile(resolve(root,'worker/index.js'),'utf8');
const output = handler + '\nexport default createWorker(' + JSON.stringify(products) + ',' + JSON.stringify(assets) + ',"2026-10-28.3");\n';
await mkdir(resolve(dist,'server'),{recursive:true});
await writeFile(resolve(dist,'server/index.js'),output);
try {
 const manifest = await readFile(resolve(root,'.openai/hosting.json'),'utf8');
 await mkdir(resolve(dist,'.openai'),{recursive:true});
 await writeFile(resolve(dist,'.openai/hosting.json'),manifest);
} catch (error) { if (error.code !== 'ENOENT') throw error; }
console.log(`Built self-contained ESM Worker: ${Object.keys(assets).length} assets; ${output.length} bytes; same-origin ordering.`);
