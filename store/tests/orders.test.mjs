import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorker } from '../worker/index.js';
import { products } from '../src/catalog.mjs';
const worker = createWorker(products,{'/index.html':{type:'text/html',content:'Home'},'/404.html':{type:'text/html',content:'404'}},'test');
function memoryStore() { const map = new Map(); return {get:async k=>map.get(k)||null,put:async(k,v)=>map.set(k,v),map}; }
const data = {name:'Tes otomatis',company:'Pengujian',email:'qa@example.com',phone:'081234567890',brief:'Data pengujian untuk memastikan pemesanan internal bekerja.',timeline:'Dalam 1 bulan',reference:'',consent:true,service_ids:['custom-software','cloud-devops'],request_key:'a'.repeat(64),access_token:'b'.repeat(64)};
const post = (body,origin='https://store.axura.cloud') => new Request('https://store.axura.cloud/api/orders',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
test('internal orders persist, server controls IDR prices, retries are idempotent, and receipts require the private token',async()=>{
 const db=memoryStore(),env={ORDERS:db};
 const response=await worker.fetch(post({...data,total_idr:1,payment_status:'paid'}),env);
 assert.equal(response.status,201);
 const {order}=await response.json();
 assert.equal(order.total_idr,22000000);assert.equal(order.currency,'IDR');assert.equal(order.status,'awaiting_review');assert.equal(order.payment_status,'not_available');assert.equal(db.map.size,1);assert.equal(order.access_hash,undefined);
 assert.equal((await worker.fetch(post(data),env)).status,200);assert.equal(db.map.size,1);
 assert.equal((await worker.fetch(post({...data,brief:'Perubahan brief pada idempotency key yang sama.'}),env)).status,409);
 const endpoint='https://store.axura.cloud/api/orders/'+order.id;
 assert.equal((await worker.fetch(new Request(endpoint),env)).status,404);
 assert.equal((await worker.fetch(new Request(endpoint,{headers:{Authorization:'Bearer '+'c'.repeat(64)}}),env)).status,404);
 const read=await worker.fetch(new Request(endpoint,{headers:{Authorization:'Bearer '+data.access_token}}),env);
 assert.equal(read.status,200);assert.equal(read.headers.get('Cache-Control'),'no-store');assert.equal((await read.json()).order.customer.name,data.name);
});
test('invalid services, missing consent, non-HTTP references and cross-origin submissions fail before storage',async()=>{
 const db=memoryStore(),env={ORDERS:db};
 for(const body of [{...data,service_ids:['invalid']},{...data,service_ids:['custom-software','custom-software']},{...data,consent:false},{...data,reference:'javascript:alert(1)'},{...data,brief:'too short'}]) assert.equal((await worker.fetch(post(body),env)).status,400);
 assert.equal((await worker.fetch(post(data,'https://untrusted.example'),env)).status,403);assert.equal(db.map.size,0);
});
test('missing storage and failed writes cannot produce a false successful order',async()=>{
 assert.equal((await worker.fetch(post(data),{})).status,503);
 assert.equal((await worker.fetch(post(data),{ORDERS:{get:async()=>null,put:async()=>{throw new Error('offline');}}})).status,503);
});
test('native Sites R2 and Cloudflare KV both store the same protected receipt format',async()=>{
 const kv=memoryStore();const r2={get:async key=>{const value=await kv.get(key);return value?{json:async()=>JSON.parse(value)}:null;},put:kv.put};
 const response=await worker.fetch(post(data),{BUCKET:r2});assert.equal(response.status,201);assert.equal(kv.map.size,1);
});
