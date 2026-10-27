# Axura Store — PT Audev Axura Technology

Toko layanan untuk `store.axura.cloud`, siap dipasang sebagai Cloudflare Worker dengan Static Assets. Katalog memuat empat layanan, harga awal, dan ketentuan dari `https://audevaxura.id/`. Kontak mengacu pada halaman publik `https://audevaxura.id/contact` yang dibaca 27 Oktober 2026.

## Fitur

- Katalog dengan filter, pencarian, dan pengurutan harga.
- Empat halaman detail layanan dengan harga dan syarat masing-masing.
- Keranjang lintas halaman, penyimpanan lokal hanya untuk ID layanan.
- Checkout interaktif: brief tervalidasi → tinjau ringkasan → buka WhatsApp resmi.
- Salin dan unduh ringkasan permintaan. Pengiriman pesan tetap dilakukan pengunjung di WhatsApp.
- Halaman kontak, syarat, privasi, dan informasi pembatalan/refund.
- Desain responsif, navigasi keyboard, dialog dengan focus trap native, serta dukungan reduced motion.
- Payment gateway berstatus **belum aktif**. Tidak memproses uang atau membuat status pembayaran fiktif.

## Build

Node.js 22 atau lebih baru. Tidak membutuhkan paket tambahan untuk build.

```bash
npm run check
npm run build
```

Hasil siap tayang berada di `dist/`. Data bisnis ada di `src/catalog.mjs`; tampilan di `src/store.css`; interaksi di `src/store.js`; template halaman di `scripts/build.mjs`.

## Hubungkan melalui dashboard Cloudflare

1. Di Workers & Pages, buat aplikasi Worker dari repository yang berisi proyek ini.
2. Gunakan nama Worker **axura-store**. Jika proyek berada di subfolder repository, pilih root directory subfolder tersebut.
3. Build command: `npm run build`.
4. Deploy command: `npx wrangler deploy`.
5. Konfigurasi `wrangler.jsonc` sudah menargetkan custom domain **store.axura.cloud**. Zone `axura.cloud` harus berada pada akun Cloudflare yang digunakan dan domain belum digunakan layanan lain.
6. Verifikasi deployment serta HTTPS pada domain. Jika pengikatan domain perlu dilakukan lewat UI, buka Worker → Settings → Domains & Routes → Add → Custom Domain → `store.axura.cloud`.

Cloudflare menangani rekaman DNS untuk custom domain Workers. Konfigurasi ini tidak mengubah domain utama `axura.cloud`.

## Pembayaran berikutnya

Alur saat ini mengirim **permintaan penawaran**, bukan transaksi. Untuk mengaktifkan Midtrans kelak, tambahkan backend yang membuat ID pesanan dan jumlah tagihan dari server, menyimpan pesanan secara durable, membuat Snap token dari server, memverifikasi webhook dan signature, serta menentukan status pembayaran dari notifikasi terverifikasi. Simpan Server Key sebagai Worker Secret. Jangan menaruh kunci atau menganggap redirect sukses sebagai bukti pembayaran di frontend.

## Aset

- `axura-orbit.webp`: aset merek dari repository `RioBithub/axuraweb` milik pengguna.
- `brand-logo.jpg`: salinan logo dari repository yang sama untuk arsip sumber; antarmuka memakai wordmark vektor.
- Visual kartu layanan dan ikon ditulis sebagai SVG/CSS.
- Font Manrope dan DM Sans menggunakan SIL Open Font License; berkas lisensi berada di `dist/assets/`.

## Status pemasangan

Konfigurasi target Cloudflare telah disiapkan. Deployment pada akun Cloudflare dan pengikatan domain harus dibuktikan melalui hasil dashboard; file konfigurasi saja bukan bukti domain sudah aktif.
