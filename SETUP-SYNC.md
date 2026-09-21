# Sinkronisasi Android + iPhone

Versi ini sudah memperbaiki PWA dan path icon untuk GitHub Pages (`/Keuangan/`) serta menyiapkan sinkronisasi cloud memakai Supabase.

## 1. Buat project Supabase
1. Buka https://supabase.com dan buat project baru.
2. Buka SQL Editor.
3. Jalankan isi `supabase-setup.sql`.
4. Buka Project Settings > API.
5. Salin **Project URL** dan **anon/publishable key** ke `supabase-config.js`:

```js
window.SUPABASE_CONFIG = {
  url: 'https://PROJECT_ID.supabase.co',
  anonKey: 'ANON_OR_PUBLISHABLE_KEY'
};
```

Jangan masukkan `service_role` key ke frontend.

## 2. Aktifkan akun email/password
Di Supabase, buka Authentication > Providers > Email dan pastikan Email provider aktif.

## 3. Deploy ulang
Upload seluruh folder ini ke repository GitHub Pages atau deploy ulang ke Vercel.

## 4. Hubungkan dua HP
- HP Android: buka aplikasi > tombol **Sync** > Buat Akun.
- HP iPhone: buka aplikasi > tombol **Sync** > Login memakai akun yang sama.
- Setelah login, transaksi/tagihan akan disimpan ke cloud dan HP lain melakukan sinkronisasi otomatis sekitar setiap 4 detik.

## Catatan
Jika Supabase belum diisi, aplikasi tetap berjalan dengan LocalStorage seperti versi lama. Data LocalStorage tidak dibagikan antar-HP.
