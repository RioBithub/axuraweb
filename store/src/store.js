(() => {
 'use strict';
 const config = window.AXURA_STORE;
 if (!config) return;
 const products = config.products;
 const productMap = new Map(products.map(p => [p.id, p]));
 const storageKey = 'axura-store-cart-v1';
 const $ = (selector, scope = document) => scope.querySelector(selector);
 const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
 const skipLink = $('.skip-link');
 if (skipLink) skipLink.addEventListener('click',event=>{
  event.preventDefault();
  const main = $('#main');
  if (main) { main.setAttribute('tabindex','-1'); main.focus(); }
 });
 const money = value => 'Rp' + new Intl.NumberFormat('id-ID').format(value);
 const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
 const icon = name => `<svg class="icon" aria-hidden="true"><use href="/assets/icons.svg#${name}"></use></svg>`;
 let cartIds = [];
 try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (Array.isArray(saved)) cartIds = [...new Set(saved.filter(id => productMap.has(id)))];
 } catch { cartIds = []; }
 const selected = () => cartIds.map(id => productMap.get(id)).filter(Boolean);
 let toastTimeout;
 function toast(message) {
  const element = $('#toast');
  if (!element) return;
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => element.classList.remove('show'), 3000);
 }
 function saveCart() {
  try { localStorage.setItem(storageKey, JSON.stringify(cartIds)); } catch { /* The in-memory cart remains usable. */ }
  renderCart();
 }
 const cartDialog = $('#cart-dialog');
 function openCart() {
  if (cartDialog.open) return;
  cartDialog.showModal();
  document.body.classList.add('modal-open');
 }
 function closeCart() { if (cartDialog.open) cartDialog.close(); }
 cartDialog.addEventListener('close', () => document.body.classList.remove('modal-open'));
 cartDialog.addEventListener('click', event => {
  if (event.target !== cartDialog) return;
  const bounds = cartDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeCart();
 });
 $$('[data-open-cart]').forEach(button => button.addEventListener('click', openCart));
 $$('[data-close-cart]').forEach(button => button.addEventListener('click', closeCart));
 function renderCart() {
  const items = selected();
  const total = items.reduce((sum, p) => sum + p.price, 0);
  $$('[data-cart-count]').forEach(element => { element.textContent = String(items.length); });
  $('#cart-items').innerHTML = items.length ? items.map(p => `<article class="cart-item"><span class="cart-item-icon">${icon(p.icon)}</span><div class="cart-item-info"><h3><a href="/layanan/${p.id}/">${esc(p.title)}</a></h3><p>${esc(p.note)}</p><strong>${money(p.price)} <small>/ proyek</small></strong></div><button class="remove-item" data-remove="${p.id}" aria-label="Hapus ${esc(p.title)} dari keranjang">${icon('trash')}</button></article>`).join('') : `<div class="cart-empty">${icon('bag')}<h3>Ruang untuk ide Anda.</h3><p>Keranjang masih kosong.<br>Tambahkan layanan untuk memulai percakapan.</p></div>`;
  $('#cart-total').innerHTML = items.length ? `<span>Estimasi harga awal</span><strong>${money(total)}<small>Belum termasuk penyesuaian proyek</small></strong>` : '';
  $('#cart-checkout').hidden = items.length === 0;
  $$('[data-remove]', cartDialog).forEach(button => button.addEventListener('click', () => {
   cartIds = cartIds.filter(id => id !== button.dataset.remove);
   saveCart();
   toast('Layanan dihapus dari keranjang.');
  }));
  $$('[data-add]').forEach(button => {
   const added = cartIds.includes(button.dataset.add);
   button.setAttribute('aria-pressed', String(added));
   button.title = added ? 'Sudah di keranjang. Klik untuk melihat keranjang.' : 'Tambahkan ke keranjang';
  });
  renderCheckout();
 }
 $$('[data-add]').forEach(button => button.addEventListener('click', () => {
  const id = button.dataset.add;
  if (!productMap.has(id)) return;
  if (cartIds.includes(id)) { openCart(); return; }
  cartIds.push(id);
  saveCart();
  if (button.hasAttribute('data-show-cart')) openCart();
  else toast('Layanan ditambahkan ke keranjang.');
 }));
 window.addEventListener('storage', event => {
  if (event.key !== storageKey) return;
  try { const ids = JSON.parse(event.newValue || '[]'); cartIds = Array.isArray(ids) ? [...new Set(ids.filter(id => productMap.has(id)))] : []; } catch { cartIds = []; }
  renderCart();
 });
 const menu = $('#menu-toggle');
 if (menu) {
  menu.addEventListener('click', () => {
   const open = menu.getAttribute('aria-expanded') === 'true';
   menu.setAttribute('aria-expanded', String(!open));
   menu.setAttribute('aria-label', open ? 'Buka menu' : 'Tutup menu');
   $('#nav-links').classList.toggle('open', !open);
  });
  $$('#nav-links a').forEach(link => link.addEventListener('click', () => {
   menu.setAttribute('aria-expanded', 'false');
   menu.setAttribute('aria-label', 'Buka menu');
   $('#nav-links').classList.remove('open');
  }));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Buka menu'); $('#nav-links').classList.remove('open'); } });
 }
 let category = 'all';
 const search = $('#catalog-search');
 const sort = $('#sort-products');
 const grid = $('#product-grid');
 const defaultCards = grid ? $$('[data-product-card]', grid) : [];
 function filterCatalog() {
  if (!grid) return;
  const query = (search.value || '').trim().toLowerCase();
  let count = 0;
  defaultCards.forEach(card => {
   const visible = (category === 'all' || category === card.dataset.category) && card.dataset.search.includes(query);
   card.hidden = !visible;
   if (visible) count++;
  });
  $('#catalog-count').textContent = `Menampilkan ${count} layanan`;
  $('#no-results').hidden = count > 0;
  grid.hidden = count === 0;
  const cards = [...defaultCards];
  if (sort.value === 'price-asc' || sort.value === 'price-desc') cards.sort((a, b) => {
   const price = card => productMap.get($('[data-add]', card).dataset.add).price;
   return (price(a) - price(b)) * (sort.value === 'price-asc' ? 1 : -1);
  });
  if (sort.value === 'name') cards.sort((a, b) => $('h3', a).textContent.localeCompare($('h3', b).textContent));
  cards.forEach(card => grid.append(card));
 }
 $$('[data-filter]').forEach(button => button.addEventListener('click', () => {
  category = button.dataset.filter;
  $$('[data-filter]').forEach(item => { const active = item === button; item.classList.toggle('active', active); item.setAttribute('aria-pressed', String(active)); });
  filterCatalog();
 }));
 if (search) search.addEventListener('input', filterCatalog);
 if (sort) sort.addEventListener('change', filterCatalog);
 const reset = $('#reset-search');
 if (reset) reset.addEventListener('click', () => { search.value = ''; category = 'all'; sort.value = 'default'; $$('[data-filter]').forEach(button => { const active = button.dataset.filter === 'all'; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); }); filterCatalog(); search.focus(); });
 const form = $('#brief-form');
 const review = $('#request-review');
 let requestText = '';
 let requestPayload;
 let pendingSubmission;
 const secret = () => [...crypto.getRandomValues(new Uint8Array(32))].map(b=>b.toString(16).padStart(2,'0')).join('');
 function renderCheckout() {
  if (!$('#checkout-content')) return;
  const items = selected();
  $('#checkout-empty').hidden = items.length > 0;
  $('#checkout-content').hidden = items.length === 0;
  $('#checkout-items').innerHTML = items.map(p => `<div class="summary-item"><span>${icon(p.icon)}</span><div><h3>${esc(p.title)}</h3><p>${money(p.price)}</p></div></div>`).join('');
  $('#checkout-total').innerHTML = `<span>Total estimasi awal</span><strong>${money(items.reduce((sum, p) => sum + p.price, 0))}<small>Untuk ${items.length} layanan / proyek</small></strong>`;
  if (review && !review.hidden) showReview(false);
 }
 function showReview(scroll = true) {
  if (!form || !selected().length || !form.reportValidity()) return;
  const values = Object.fromEntries(new FormData(form).entries());
  const items = selected();
  const total = items.reduce((sum, p) => sum + p.price, 0);
  const fields = [['Nama', values.name], ['Organisasi', values.company || '—'], ['Email', values.email], ['WhatsApp', values.phone], ['Kebutuhan', values.brief], ['Target mulai', values.timeline], ['Referensi', values.reference || '—']];
  $('#review-data').innerHTML = '<dl>' + fields.map(([key, value]) => `<dt>${key}</dt><dd>${esc(value)}</dd>`).join('') + '</dl>';
  requestText = ['Halo tim Axura, saya ingin mengajukan permintaan layanan.', '', ...fields.map(([key, value]) => key + ': ' + value), '', 'Layanan yang dipilih:', ...items.map(p => '- ' + p.title + ' (mulai ' + money(p.price) + ')'), '', 'Total estimasi harga awal: ' + money(total), 'Harga final, pajak, ruang lingkup, jadwal, dan metode pembayaran menunggu penawaran tertulis.', 'Ini merupakan permintaan layanan, bukan bukti pembayaran.', '', 'Dari: ' + config.company.domain].join('\n');
  requestPayload = {...values,consent:values.consent === 'on',service_ids:items.map(p=>p.id)};
  form.hidden = true;
  review.hidden = false;
  $('#step-brief').classList.remove('active');
  $('#step-review').classList.add('active');
  if (scroll) { review.scrollIntoView({ behavior: 'smooth', block: 'start' }); $('#review-title').setAttribute('tabindex', '-1'); $('#review-title').focus({ preventScroll: true }); }
 }
 if (form) {
  $('#send-request').addEventListener('click',async()=>{
   const button = $('#send-request');
   if (!requestPayload || button.disabled) return;
   const fingerprint = JSON.stringify(requestPayload);
   if (!pendingSubmission || pendingSubmission.fingerprint !== fingerprint) pendingSubmission={fingerprint,request_key:secret(),access_token:secret()};
   button.disabled = true;
   button.textContent = 'Menyimpan pesanan…';
   $('#order-error').hidden = true;
   try {
    const response = await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...requestPayload,request_key:pendingSubmission.request_key,access_token:pendingSubmission.access_token})});
    let result;
    try { result = await response.json(); } catch { throw new Error('Pemesanan belum tersedia. Pesanan belum tersimpan; silakan coba kembali nanti.'); }
    if (!response.ok || !result.order?.id) throw new Error(result.error || 'Pesanan belum tersimpan. Silakan coba lagi.');
    const path = '/pembayaran/?order=' + encodeURIComponent(result.order.id) + '#akses=' + pendingSubmission.access_token;
    try { sessionStorage.setItem('axura-last-order',path); } catch { /* Private receipt remains in the URL. */ }
    cartIds = [];
    try { localStorage.setItem(storageKey,'[]'); } catch { /* No payment has been collected. */ }
    location.assign(path);
   } catch (error) {
    $('#order-error').textContent = error.message || 'Koneksi terputus. Silakan coba lagi; permintaan yang sama tidak membuat pesanan ganda.';
    $('#order-error').hidden = false;
    button.disabled = false;
    button.innerHTML = 'Buat pesanan & lanjut ' + icon('arrow');
   }
  });
  form.addEventListener('submit', event => { event.preventDefault(); showReview(); });
  $('#edit-brief').addEventListener('click', () => {
   review.hidden = true;
   form.hidden = false;
   $('#step-review').classList.remove('active');
   $('#step-brief').classList.add('active');
   $('input[name="name"]', form).focus();
  });
  $('#copy-request').addEventListener('click', async () => {
   try { await navigator.clipboard.writeText(requestText); toast('Ringkasan permintaan disalin.'); }
   catch { toast('Salin tidak tersedia. Gunakan tombol unduh ringkasan.'); }
  });
  $('#download-request').addEventListener('click', () => {
   if (!requestText) return;
   const url = URL.createObjectURL(new Blob([requestText], { type: 'text/plain;charset=utf-8' }));
   const link = document.createElement('a');
   link.href = url;
   link.download = 'Permintaan_Layanan_Axura.txt';
   link.click();
   setTimeout(() => URL.revokeObjectURL(url), 1000);
   toast('Ringkasan permintaan siap diunduh.');
  });
 }
 async function loadReceipt() {
  const page = $('#payment-page');
  if (!page) return;
  const id = new URLSearchParams(location.search).get('order');
  const token = new URLSearchParams(location.hash.slice(1)).get('akses');
  if (!id || !token) {
   $('#payment-loading').hidden = true;
   $('#payment-empty').hidden = false;
   try { const last = sessionStorage.getItem('axura-last-order'); if (last?.startsWith('/pembayaran/?order=')) { $('#last-order').href=last;$('#last-order').hidden=false; } } catch { /* No saved private link. */ }
   return;
  }
  try {
   const response = await fetch('/api/orders/' + encodeURIComponent(id),{headers:{Authorization:'Bearer '+token},cache:'no-store'});
   const result = await response.json();
   if (!response.ok || !result.order) throw new Error(result.error || 'Pesanan belum dapat dimuat. Silakan coba lagi.');
   const order = result.order;
   $('#receipt-id').textContent = order.id;
   $('#receipt-date').textContent = new Intl.DateTimeFormat('id-ID',{dateStyle:'long',timeStyle:'short',timeZone:'Asia/Jakarta'}).format(new Date(order.created_at)) + ' WIB';
   $('#receipt-name').textContent = order.customer.name;
   $('#receipt-items').innerHTML = order.items.map(item=>`<div class="summary-item"><span>${icon('layers')}</span><div><h3>${esc(item.title)}</h3><p>${money(item.unit_price_idr)}</p></div></div>`).join('');
   $('#receipt-total').textContent = money(order.total_idr);
   $('#payment-loading').hidden = true;
   $('#payment-receipt').hidden = false;
   $('#copy-order-link').addEventListener('click',async()=>{try {await navigator.clipboard.writeText(location.href);toast('Tautan pribadi pesanan disalin.');}catch{toast('Salin tautan dari kolom alamat browser.');}});
   $('#download-order').addEventListener('click',()=>{
    const text=['AXURA STORE — PERMINTAAN LAYANAN',order.id,'Status: Menunggu peninjauan','Pembayaran: Belum tersedia','',...order.items.map(item=>item.title+' — mulai '+money(item.unit_price_idr)),'','Total estimasi awal: '+money(order.total_idr),'Harga final mengikuti penawaran tertulis. Belum ada dana ditarik.','','Tautan pribadi: '+location.href].join('\n');
    const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=order.id+'.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
   });
  } catch (error) {
   $('#payment-loading').textContent = error.message || 'Pesanan belum dapat dimuat. Silakan muat ulang halaman.';
   $('#retry-receipt').hidden = false;
  }
 }
 if ($('#retry-receipt')) $('#retry-receipt').addEventListener('click',()=>location.reload());
 renderCart();
 loadReceipt();
})();
