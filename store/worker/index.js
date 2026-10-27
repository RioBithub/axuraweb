// The build injects the product catalog and static assets into this ESM Worker.
// ORDERS is Cloudflare KV; BUCKET is the native Sites R2 binding.
export function createWorker(products, assets, version = '2026-10-28') {
 const productMap = new Map(products.map(p => [p.id, p]));
 const encoder = new TextEncoder();
 const security = {
  'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY', 'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
 };
 function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {status, headers:{...security, 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', ...headers}});
 }
 async function hash(value) {
  const bytes = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2,'0')).join('');
 }
 function storage(env) { return env.ORDERS || env.BUCKET; }
 async function readOrder(store, id) {
  const value = await store.get('orders/' + id + '.json');
  if (!value) return null;
  return typeof value === 'string' ? JSON.parse(value) : await value.json();
 }
 function publicOrder(order) {
  const {id, created_at, customer, items, total_idr, currency, status, payment_status, pricing, terms_version} = order;
  return {id, created_at, customer, items, total_idr, currency, status, payment_status, pricing, terms_version};
 }
 function clean(value, max, min = 0) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (text.length < min || text.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text)) return null;
  return text;
 }
 async function createOrder(request, env, url) {
  if (request.headers.get('Origin') !== url.origin || request.headers.get('Sec-Fetch-Site') === 'cross-site') return json({error:'Kirim pesanan melalui checkout website ini.'},403);
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return json({error:'Format permintaan tidak didukung.'},415);
  if (Number(request.headers.get('Content-Length') || 0) > 16384) return json({error:'Isian terlalu panjang.'},413);
  const raw = await request.text();
  if (encoder.encode(raw).byteLength > 16384) return json({error:'Isian terlalu panjang.'},413);
  let data;
  try { data = JSON.parse(raw); } catch { return json({error:'Data pesanan tidak valid.'},400); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return json({error:'Data pesanan tidak valid.'},400);
  const name = clean(data.name,120,2), email = clean(data.email,160,3), phone = clean(data.phone,25,8);
  const company = clean(data.company || '',160), brief = clean(data.brief,3000,20);
  const timeline = clean(data.timeline || 'Belum ditentukan',60), reference = clean(data.reference || '',500);
  const timelines = ['Belum ditentukan','Sesegera mungkin','Dalam 1 bulan','Dalam 1–3 bulan','Lebih dari 3 bulan'];
  if (name === null || email === null || phone === null || company === null || brief === null || reference === null || !timelines.includes(timeline) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^[+0-9 ()-]{8,25}$/.test(phone) || data.consent !== true) return json({error:'Lengkapi data kontak, brief, dan persetujuan yang valid.'},400);
  if (reference) { try { if (!['http:','https:'].includes(new URL(reference).protocol)) throw new Error(); } catch { return json({error:'Tautan referensi harus berupa URL http atau https.'},400); } }
  if (!Array.isArray(data.service_ids) || !data.service_ids.length || data.service_ids.length > products.length || new Set(data.service_ids).size !== data.service_ids.length || data.service_ids.some(id => !productMap.has(id))) return json({error:'Pilihan layanan tidak valid.'},400);
  if (!/^[a-f0-9]{64}$/.test(data.request_key || '') || !/^[a-f0-9]{64}$/.test(data.access_token || '')) return json({error:'Identitas permintaan tidak valid. Muat ulang checkout.'},400);
  const store = storage(env);
  if (!store) return json({error:'Penyimpanan pesanan belum tersedia. Pesanan belum tersimpan; silakan coba kembali nanti.'},503);
  const fingerprint = await hash(JSON.stringify({name,email,phone,company,brief,timeline,reference,ids:[...data.service_ids].sort()}));
  const tokenHash = await hash(data.access_token);
  const id = 'AX-' + (await hash(data.request_key)).slice(0,24).toUpperCase();
  const existing = await readOrder(store,id);
  if (existing) {
   if (existing.access_hash !== tokenHash || existing.fingerprint !== fingerprint) return json({error:'Permintaan sebelumnya berbeda. Muat ulang checkout untuk membuat pesanan baru.'},409);
   return json({order:publicOrder(existing)},200);
  }
  const items = data.service_ids.map(id => { const p = productMap.get(id); return {id:p.id,title:p.title,unit_price_idr:p.price,quantity:1}; });
  const order = {id,created_at:new Date().toISOString(),customer:{name,email,phone,company},brief,timeline,reference,items,total_idr:items.reduce((sum,p)=>sum+p.unit_price_idr,0),currency:'IDR',pricing:'estimate',status:'awaiting_review',payment_status:'not_available',terms_version:version,access_hash:tokenHash,fingerprint};
  await store.put('orders/' + id + '.json',JSON.stringify(order));
  return json({order:publicOrder(order)},201);
 }
 return {
  async fetch(request, env = {}) {
   const url = new URL(request.url);
   try {
    if (url.pathname === '/api/store-status') return json({version,currency:'IDR',orders_available:!!storage(env),payment_enabled:false,checkout_path:'/checkout/',payment_path:'/pembayaran/'});
    if (url.pathname === '/api/orders') {
     if (request.method !== 'POST') return json({error:'Metode tidak didukung.'},405,{Allow:'POST'});
     return await createOrder(request,env,url);
    }
    if (url.pathname.startsWith('/api/orders/')) {
     if (request.method !== 'GET') return json({error:'Metode tidak didukung.'},405,{Allow:'GET'});
     const id = url.pathname.slice('/api/orders/'.length);
     const token = request.headers.get('Authorization')?.replace(/^Bearer /,'');
     if (!/^AX-[A-F0-9]{24}$/.test(id) || !/^[a-f0-9]{64}$/.test(token || '')) return json({error:'Pesanan tidak ditemukan atau tautan akses tidak valid.'},404);
     const store = storage(env);
     if (!store) return json({error:'Layanan pemesanan sedang tidak tersedia.'},503);
     const order = await readOrder(store,id);
     if (!order || order.access_hash !== await hash(token)) return json({error:'Pesanan tidak ditemukan atau tautan akses tidak valid.'},404);
     return json({order:publicOrder(order)});
    }
    if (url.pathname.startsWith('/api/')) return json({error:'Halaman tidak ditemukan.'},404);
    if (!['GET','HEAD'].includes(request.method)) return json({error:'Metode tidak didukung.'},405,{Allow:'GET, HEAD'});
    let path = decodeURIComponent(url.pathname);
    if (path.includes('\u0000')) return json({error:'Halaman tidak ditemukan.'},404);
    if (!path.endsWith('/') && assets[path + '/index.html']) return new Response(null,{status:308,headers:{...security,Location:path + '/' + url.search}});
    if (path.endsWith('/')) path += 'index.html';
    const asset = assets[path];
    const found = asset || assets['/404.html'];
    if (!found) return json({error:'Halaman tidak ditemukan.'},404);
    const headers = {...security,'Content-Type':found.type,'Cache-Control':path.startsWith('/assets/')?'public, max-age=300':'no-cache','X-Axura-Version':version};
    if (['/checkout/index.html','/pembayaran/index.html','/pesanan/index.html'].includes(path)) headers['Cache-Control'] = 'no-store';
    const body = request.method === 'HEAD' ? null : found.binary ? Uint8Array.from(atob(found.content),c=>c.charCodeAt(0)) : found.content;
    return new Response(body,{status:asset?200:404,headers});
   } catch {
    return json({error:'Permintaan belum dapat diproses. Silakan coba kembali; tidak ada pembayaran yang diproses.'},503);
   }
  }
 };
}
