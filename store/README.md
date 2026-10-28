# Axura Store — PT Audev Axura Technology

Toko layanan untuk `store.axura.cloud`, berjalan sebagai Cloudflare Worker ESM dengan katalog dan aset yang dikemas dalam Worker. Katalog memuat empat layanan, harga awal, dan ketentuan dari `https://audevaxura.id/`. Kontak mengacu pada halaman publik `https://audevaxura.id/contact` yang dibaca 27 Oktober 2026.

## Fitur

- Katalog dengan filter, pencarian, dan pengurutan harga.
- Empat halaman detail layanan dengan harga dan syarat masing-masing.
- Keranjang lintas halaman, penyimpanan lokal hanya untuk ID layanan.
- Checkout internal: brief tervalidasi → tinjau → simpan permintaan di server → halaman pembayaran pada domain yang sama.
- Nomor pesanan, status menunggu peninjauan, serta tautan ringkasan privat. Salin dan unduh ringkasan tanpa mengalihkan checkout ke WhatsApp.
- Halaman kontak, syarat, privasi, dan informasi pembatalan/refund.
- Desain responsif, navigasi keyboard, dialog dengan focus trap native, serta dukungan reduced motion.
- Payment gateway berstatus **belum aktif**. Tidak memproses uang atau membuat status pembayaran fiktif.

## Build

Node.js 22 atau lebih baru. Tidak membutuhkan paket tambahan untuk build.

```bash
npm run check
npm run build
```

Build menghasilkan halaman di `dist/` dan Worker siap deploy di `dist/server/index.js`. Worker menyajikan aset serta API dari origin yang sama. Data bisnis ada di `src/catalog.mjs`; tampilan di `src/store.css`; interaksi di `src/store.js`; template halaman di `scripts/build.mjs`.

## Hubungkan melalui dashboard Cloudflare

1. Di Workers & Pages, buat aplikasi Worker dari repository yang berisi proyek ini.
2. Gunakan nama Worker **axura-store**. Jika proyek berada di subfolder repository, pilih root directory subfolder tersebut.
3. Build command: `npm run build`.
4. Deploy command: `npx wrangler deploy`.
5. Konfigurasi `wrangler.jsonc` sudah menargetkan custom domain **store.axura.cloud**. Zone `axura.cloud` harus berada pada akun Cloudflare yang digunakan dan domain belum digunakan layanan lain.
6. Verifikasi deployment serta HTTPS pada domain. Jika pengikatan domain perlu dilakukan lewat UI, buka Worker → Settings → Domains & Routes → Add → Custom Domain → `store.axura.cloud`.

Cloudflare menangani rekaman DNS untuk custom domain Workers. Konfigurasi ini tidak mengubah domain utama `axura.cloud`.

## Pembayaran berikutnya

Alur saat ini menyimpan **permintaan penawaran** dengan status `awaiting_review`, mata uang `IDR`, dan status pembayaran `not_available`. Halaman `/pembayaran/` berada pada domain toko sendiri. Tidak ada penarikan dana otomatis. Untuk transaksi sementara, pengunjung dapat menghubungi WhatsApp 081285522624 melalui tautan di bagian atas situs serta halaman pemesanan dan pembayaran. Untuk mengaktifkan Midtrans kelak, tambahkan backend yang membuat ID pesanan dan jumlah tagihan dari server, menyimpan pesanan secara durable, membuat Snap token dari server, memverifikasi webhook dan signature, serta menentukan status pembayaran dari notifikasi terverifikasi. Simpan Server Key sebagai Worker Secret. Jangan menaruh kunci atau menganggap redirect sukses sebagai bukti pembayaran di frontend.

## Aset

- `axura-orbit.webp`: aset merek dari repository `RioBithub/axuraweb` milik pengguna.
- `brand-logo.jpg`: salinan logo dari repository yang sama untuk arsip sumber; antarmuka memakai wordmark vektor.
- Visual kartu layanan dan ikon ditulis sebagai SVG/CSS.
- Font Manrope dan DM Sans menggunakan SIL Open Font License; berkas lisensi berada di `dist/assets/`.

## Penyimpanan pesanan

Pada Cloudflare Workers, binding KV `ORDERS` dibuat melalui automatic provisioning Wrangler. Source `wrangler.jsonc` sengaja tidak memuat ID namespace; deployment pertama menghubungkannya. Simpan namespace ini saat mengubah konfigurasi selanjutnya agar riwayat pesanan tidak terputus. KV memiliki konsistensi eventual; jika akses langsung dari lokasi lain belum melihat pesanan baru, muat ulang halaman beberapa saat kemudian.

Pada hosting native Sites, binding privat R2 `BUCKET` pada `.openai/hosting.json` menyimpan format pesanan yang sama. Backend memilih binding yang disediakan platform. Tidak ada endpoint daftar pesanan publik. Pemilik dapat meninjau objek `orders/<id>.json` melalui dashboard penyimpanan hosting. Jangan mempublikasikan namespace atau bucket.

Harga dihitung di server dari katalog; angka harga dari pengunjung diabaikan. POST memerlukan origin yang sama, pilihan layanan valid, persetujuan, serta isian kontak dan brief yang valid. Kunci idempotensi menghindari pesanan ganda saat pengguna mencoba ulang setelah koneksi gagal. Tautan ringkasan menggunakan token acak di fragment URL; server hanya menyimpan hash token dan memeriksa token pada header Authorization. Jangan membagikan tautan privat pelanggan.

Pengiriman pesan atau email otomatis belum ditambahkan. Tim meninjau permintaan tersimpan melalui penyimpanan hosting dan menggunakan kontak pelanggan untuk tindak lanjut.

## Pemeriksaan kriteria website

- Katalog dan empat halaman detail dapat diakses tanpa akun pembeli pada domain publik.
- Syarat, kebijakan privasi, pembatalan, pengembalian dana, dan penyerahan layanan digital tersedia melalui footer.
- Kontak usaha sesuai halaman kontak publik sumber lama.
- Semua harga dan total menggunakan Rupiah (IDR).
- Checkout dan halaman pembayaran tetap pada domain sendiri. Gateway belum diaktifkan; tidak ada status lunas fiktif.

Pemeriksaan teknis ini bukan jaminan persetujuan merchant oleh Midtrans. Hasil deployment dan kesiapan gateway harus diperiksa terpisah.
