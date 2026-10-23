# TMS Mobile — Transportation Management System

Aplikasi mobile untuk driver pada Transportation Management System (TMS), dibangun dengan Expo, React Native, dan TypeScript. Aplikasi ini mencakup bagian proses TMS yang terjadi di jalan: menerima trip, mengerjakan delivery order (DO) stop demi stop, dan mencatat hasilnya.

Ini adalah **proyek portofolio independen** yang terinspirasi dari proses bisnis TMS. Aplikasi ini bukan aplikasi resmi perusahaan mana pun dan berjalan sepenuhnya dengan **data sintetis**. Nama driver, kendaraan, pelanggan, alamat, dan nomor dokumen semuanya fiktif. Logo Duta Abadi Primantara dipakai atas izin pemilik proyek ini untuk identitas visual portofolio; tidak ada data, dokumen, atau tangkapan layar internal perusahaan di repositori ini.

Repositori terkait: [Transportation-Management-System](https://github.com/sirajfatwasidqy/Transportation-Management-System)

## Tangkapan layar

Ganti placeholder berikut dengan tangkapan layar asli dari ponsel atau emulator Anda (folder yang disarankan: `docs/screenshots/`).

| Masuk | Beranda | Detail trip |
| :---: | :---: | :---: |
| ![Masuk](docs/screenshots/login.png) | ![Beranda](docs/screenshots/dashboard.png) | ![Detail trip](docs/screenshots/trip-detail.png) |

| Delivery order | Proses pengiriman | Riwayat |
| :---: | :---: | :---: |
| ![Order](docs/screenshots/orders.png) | ![Proses pengiriman](docs/screenshots/delivery-process.png) | ![Riwayat](docs/screenshots/history.png) |

## Masalah bisnis

Dalam operasi pengiriman, seorang driver memegang satu trip berisi beberapa delivery order. Dispatcher perlu tahu stop mana yang sudah selesai, mana yang gagal beserta alasannya, dan siapa yang menerima barang. Surat jalan kertas dan pesan chat membuat pencatatan ini lambat dan tidak konsisten: stop terlewat, pengiriman diklaim selesai tanpa nama penerima, dan kegagalan dilaporkan tanpa alasan.

Aplikasi ini memodelkan sisi driver dari alur tersebut dengan aturan yang eksplisit, sehingga data yang sampai ke dispatcher lengkap dan berada pada status yang valid.

## Fitur utama

- **Masuk** dengan validasi input dan akun demo.
- **Beranda** berisi jumlah trip hari ini (total, aktif, selesai, tertunda), trip aktif dalam bentuk timeline stop, pengiriman hari ini beserta prioritas, dan aktivitas terbaru.
- **Trip saya** dikelompokkan per tanggal, bisa difilter berdasarkan status, dengan halaman detail untuk kendaraan, jadwal, stop, dan log aktivitas per trip.
- **Delivery order** dengan pencarian (nomor DO, penerima, kota, alamat) dan filter status.
- **Proses pengiriman** per order: mulai pengiriman, konfirmasi serah terima (nama penerima, catatan opsional, bukti simulasi), atau laporkan pengiriman gagal beserta alasannya.
- **Riwayat** trip dan pengiriman yang sudah selesai, bisa difilter berdasarkan rentang tanggal dan hasil.
- **Profil dan pengaturan**: data driver dan kendaraan, pengaturan pengurutan prioritas, reset data demo, dan keluar.
- **Penyimpanan lokal**: semua perubahan tersimpan di perangkat dan tetap ada setelah aplikasi dibuka ulang.

### Aturan bisnis yang diterapkan

Semua aturan ada di `src/services/tripRules.ts` sebagai fungsi murni dan diuji dengan unit test.

| Area | Aturan |
| --- | --- |
| Mulai trip | Hanya trip `Assigned` yang bisa dimulai, hanya pada tanggal jadwalnya, dan hanya jika tidak ada trip lain yang `In Progress`. |
| Mulai pengiriman | Order bisa dimulai hanya jika trip-nya `In Progress`, dan hanya satu order per trip yang boleh `In Transit`. |
| Konfirmasi pengiriman | Order harus `In Transit`; nama penerima 3–60 karakter; catatan maksimal 280 karakter. |
| Bukti pengiriman | Order prioritas `High` wajib memiliki bukti pengiriman sebelum bisa dikonfirmasi. |
| Lapor gagal | Alasan harus dari daftar tetap; alasan `Lainnya` wajib dijelaskan minimal 5 karakter. |
| Penutupan trip | Saat semua stop selesai, trip tertutup otomatis: `Completed` jika minimal satu stop terkirim, selain itu `Failed`. |
| Alur status | Order: `Assigned → In Transit → Delivered / Failed`. Trip: `Assigned → In Progress → Completed / Failed`. Status akhir tidak bisa diubah lagi. |

Nilai status disimpan dengan kunci bahasa Inggris di kode dan ditampilkan dalam Bahasa Indonesia di antarmuka (Ditugaskan, Berjalan, Dalam perjalanan, Selesai, Terkirim, Gagal).

## Teknologi

| Kebutuhan | Pilihan |
| --- | --- |
| Framework | React Native 0.88 dengan Expo SDK 58 |
| Bahasa | TypeScript (strict) |
| Navigasi | Expo Router (berbasis file, stack + tab bawah, rute terproteksi) |
| Penyimpanan lokal | `@react-native-async-storage/async-storage` |
| Ikon | `lucide-react-native` dengan `react-native-svg` |
| Pengujian | Test runner bawaan Node (`node:test`) |
| Lint | ESLint dengan `eslint-config-expo` |

Tidak ada backend, API berbayar, maupun API key.

## Struktur folder

```
tms-mobile-app/
├── assets/images/            Ikon aplikasi, ikon adaptif, splash, logo
├── src/
│   ├── app/                  Rute Expo Router
│   │   ├── _layout.tsx       Provider, splash, stack terproteksi
│   │   ├── login.tsx
│   │   ├── (tabs)/           Beranda, Trip, Order, Riwayat, Profil
│   │   ├── trip/[id].tsx     Detail trip
│   │   ├── order/[id].tsx    Detail delivery order
│   │   └── deliver/[id].tsx  Proses pengiriman
│   ├── components/           Komponen UI reusable
│   ├── constants/            Token tema, label, konstanta domain
│   ├── data/                 Fixtures dan generator data sintetis
│   ├── services/             Aturan bisnis, cek login demo, penyimpanan
│   ├── state/                Provider state aplikasi
│   ├── types/                Tipe TypeScript bersama
│   └── utils/                Fungsi tanggal
├── tests/                    Unit test aturan, data seed, filter, login
├── app.json
├── eslint.config.js
├── tsconfig.json
└── package.json
```

## Memulai

Kebutuhan: Node.js 22.18 atau lebih baru (unit test menjalankan file TypeScript langsung), npm, dan ponsel Android dengan aplikasi **Expo Go** atau emulator Android.

```bash
npm install
npx expo start
```

- **Ponsel fisik:** pasang Expo Go dari Google Play, pastikan ponsel dan komputer berada di jaringan yang sama, lalu pindai kode QR di terminal.
- **Emulator:** jalankan Android Virtual Device dari Android Studio, lalu tekan `a` di terminal atau jalankan `npm run android`.

Expo Go harus mendukung SDK 58. Jika muncul pesan versi tidak cocok, perbarui Expo Go dari Play Store.

### Skrip yang berguna

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # expo lint
npm test            # unit test
npm run check       # ketiganya
```

## Login demo

| Kolom | Nilai |
| --- | --- |
| ID driver | `RAJA123` |
| Kata sandi | `123RAJA` |

Layar masuk juga memiliki tombol **Isi akun demo**. ID tidak membedakan huruf besar/kecil, kata sandi membedakan.

## Data contoh

`src/data/seed.ts` membuat dataset yang konsisten relatif terhadap tanggal saat aplikasi pertama kali dibuka:

- 8 trip dan 19 delivery order dalam satu minggu, satu driver, dan dua kendaraan.
- Hari ini: satu trip `In Progress` (satu order terkirim, satu dalam perjalanan, satu menunggu) dan satu trip `Assigned` untuk sore hari.
- Besok: satu trip `Assigned` yang belum bisa dimulai.
- Hari-hari sebelumnya: trip selesai, satu trip dengan stop gagal, dan satu trip yang seluruh stop-nya gagal.
- ID trip dan order mengikuti format `TRP-yymmdd-nn` dan `DO-yymmdd-nnn` dan bersifat unik.

Karena tanggal data bersifat relatif terhadap hari pertama dibuka, gunakan **Profil → Reset data demo** untuk membuat ulang data di sekitar hari ini jika Anda membuka aplikasi di hari berikutnya dan "hari ini" tampak kosong.

## Arsitektur dan alur data

```
Layar ──aksi──▶ AppProvider ──▶ tripRules (murni) ──▶ AppData baru atau pesan error
   ▲                  │
   └──── useApp() ◀───┴──▶ storage (AsyncStorage)
```

1. Layar membaca state lewat `useApp()` dan tidak pernah mengubah data sendiri.
2. Aksi pengguna (`startTrip`, `startOrder`, `confirmDelivery`, `reportFailure`) memanggil fungsi murni di `tripRules`. Hasilnya berupa `AppData` baru atau pesan error.
3. Jika berhasil, provider mengganti state dan menyimpannya ke AsyncStorage. Jika gagal, layar menampilkan pesan dan tidak ada yang berubah.
4. Hitungan di beranda, filter, dan pengurutan diturunkan dari state yang sama, sehingga perubahan status langsung tampil di semua layar.
5. Logika bisnis tidak mengimpor React maupun React Native, sehingga bisa diuji dengan Node biasa.

## Status pengujian

Dijalankan di lingkungan pengembangan repositori ini:

- `tsc --noEmit` lolos tanpa error.
- `expo lint` lolos tanpa warning maupun error.
- 17 unit test lolos, mencakup integritas data seed (ID unik, relasi valid, konsistensi status), aturan trip dan pengiriman, validasi, penutupan trip otomatis, filter, rentang tanggal, dan validasi login.
- `expo export --platform android` berhasil membuat bundle Android, sehingga tidak ada import yang rusak.
- `expo-doctor` lolos 18 dari 20 pemeriksaan; dua sisanya membutuhkan akses internet ke server Expo dan tidak bisa dijalankan di lingkungan tersebut. Jalankan `npx expo-doctor` di komputer Anda.

**Belum diuji:**

- Aplikasi belum dijalankan di perangkat Android fisik maupun emulator, sehingga tata letak, perilaku keyboard, dan interaksi sentuh belum diverifikasi secara visual.
- iOS dan web belum diuji.
- Belum ada pengujian UI atau end-to-end otomatis.

## Keterbatasan

- **Autentikasi hanya simulasi.** Akun demo dicek secara lokal di kode klien. Ini tidak aman dan tidak boleh dipakai ulang untuk sistem sungguhan.
- **Tidak ada backend.** Data hanya ada di perangkat; tidak ada sinkronisasi, multi-pengguna, atau tampilan dispatcher.
- **Tidak ada GPS atau peta sungguhan.** Timeline stop hanya menampilkan urutan stop dan tidak melacak apa pun secara real-time.
- **Bukti pengiriman hanya placeholder.** Mengambil bukti hanya mencatat waktu; tidak ada foto atau tanda tangan yang disimpan.
- **Satu driver.** Dataset berisi satu driver dan dua kendaraan.
- **Tanggal demo relatif.** Tanggal seed bergantung pada hari pertama aplikasi dibuka; gunakan opsi reset untuk menyegarkannya.
- **Hanya Bahasa Indonesia**, memakai waktu lokal tanpa penanganan zona waktu.

## Pengembangan selanjutnya

- API backend dengan autentikasi sungguhan dan akses berbasis peran.
- Foto dan tanda tangan digital untuk bukti pengiriman, dengan kompresi lokal dan unggah.
- Antrean offline yang menyinkronkan perubahan status saat koneksi kembali.
- Tampilan peta dengan stop rute dan navigasi.
- Notifikasi push untuk trip yang baru ditugaskan.
- Pengujian komponen dan end-to-end (misalnya React Native Testing Library dan Maestro).
- Pilihan bahasa (English) dan tema gelap, serta tinjauan aksesibilitas dengan screen reader.

## Lisensi

Kode berlisensi MIT, lihat [LICENSE](LICENSE). Lisensi ini tidak mencakup logo Duta Abadi Primantara (`assets/images/logo-dap.png` dan turunannya); logo tetap milik pemiliknya.
