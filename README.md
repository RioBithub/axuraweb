# Axura — PT Audev Axura Technology

Company profile versi 2 untuk **https://axura.cloud**. Website statis dengan HTML, CSS, JavaScript, font lokal, dan visual khusus Axura. Deployment menggunakan **Cloudflare Workers Static Assets**, tanpa database atau server aplikasi tambahan.

## Menjalankan dan memeriksa

Memerlukan Node.js 22 atau lebih baru.

```bash
npm ci
npm run build
npm run preview
```

`npm run build` menyiapkan font lokal beserta lisensinya dan memeriksa tautan aset, ID, sintaks JavaScript, serta konfigurasi Workers. `npm run dry-run` memvalidasi paket deployment tanpa memublikasikannya.

## Deploy dari GitHub ke Cloudflare Workers

1. Buka **Cloudflare Dashboard → Workers & Pages → Create application → GitHub**.
2. Pilih **RioBithub/axuraweb**, branch produksi **main**.
3. Gunakan pengaturan berikut:

| Pengaturan | Nilai |
| --- | --- |
| Worker name / Project name | `axuraweb` |
| Root directory | `/` atau kosong |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Non-production branch deploy command | Kosong / dinonaktifkan pada pengaturan awal |
| Node.js | `22` atau versi lebih baru yang didukung |

4. Pilih **Save and Deploy**. Workers Builds menginstal dependensi dari `package-lock.json`.
5. `wrangler.jsonc` sudah mendeklarasikan **axura.cloud** sebagai Custom Domain. Domain harus berada dalam zone Cloudflare aktif di akun deployment. Apabila ada DNS record atau binding Worker yang berbenturan pada hostname tersebut, periksa dan selesaikan konflik di dashboard sebelum mengalihkan domain.
6. Jika domain belum terpasang otomatis, buka Worker **axuraweb → Settings → Domains & Routes → Add → Custom Domain**, lalu isi **axura.cloud**.
7. Setelah terhubung, push ke `main` akan memicu deployment melalui Workers Builds.

**Tidak ada output directory yang perlu diisi seperti pada Cloudflare Pages.** Folder aset `public/` ditentukan oleh `wrangler.jsonc`. Gunakan alur **Workers**, sesuai konfigurasi repo ini.

Nama Worker di dashboard harus sama dengan `name` pada `wrangler.jsonc`: **axuraweb**. Untuk deployment lewat Workers Builds, otorisasi GitHub dan akun Cloudflare dilakukan melalui dashboard; jangan menaruh API token di source code.

### Pilihan deploy melalui komputer sendiri

```bash
npm ci
npx wrangler login
npm run deploy
```

Untuk otomasi CI sendiri, gunakan `CLOUDFLARE_API_TOKEN` dan `CLOUDFLARE_ACCOUNT_ID` sebagai secret lingkungan. Repo ini tidak menyimpan kredensial dan tidak memasang workflow GitHub Actions otomatis agar tidak bersaing dengan Workers Builds.

## Mengubah isi

| Kebutuhan | File |
| --- | --- |
| Narasi dan struktur halaman | `public/index.html` |
| Warna, layout, responsivitas, animasi | `public/assets/site.css` |
| Detail layanan, contoh interaktif, brief proyek | `public/assets/site.js` |
| Email dan WhatsApp resmi | `public/assets/site-config.js` |
| Domain dan konfigurasi Workers | `wrangler.jsonc` |

Kontak resmi masih kosong karena belum ada alamat email atau nomor perusahaan yang terverifikasi pada materi sumber. Isi `email` dan/atau `whatsapp` di `site-config.js` agar tautan kontak tampil. Nomor WhatsApp menggunakan format internasional tanpa `+` atau spasi, misalnya pola `628xxxxxxxxxx`.

## Formulir dan contoh solusi

- Formulir menyusun brief secara lokal, lalu menyediakan salin/unduh. Tidak ada pengiriman atau penyimpanan otomatis.
- Setelah kontak resmi diisi, tombol email atau WhatsApp membuka aplikasi terkait untuk ditinjau dan dikirim sendiri oleh pengguna.
- Tampilan workspace dan dashboard merupakan konsep dengan data ilustrasi, bukan klaim proyek atau performa klien.
- Mendukung navigasi keyboard pada tab, dialog native, preferensi pengurangan animasi, dan tampilan mobile.
- Informasi aset, prompt visual, dan lisensi font tersedia di [ASSET_CREDITS.md](ASSET_CREDITS.md).

## Sumber konfigurasi

- [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)
- [Build configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
