# RoboLove Web for Vercel

Website dashboard untuk mengontrol ESP32 RoboLove melalui MQTT.

## Fitur
- Landing page romantis dengan galeri foto.
- Login admin dan user.
- Dashboard kontrol pesan, warna teks, ukuran teks, brightness, tema, mode tampilan, reset WiFi.
- OTA update firmware hanya muncul untuk admin.
- MQTT credential aman di server melalui API route Next.js.

## Cara jalan lokal
```bash
npm install
cp .env.example .env.local
npm run dev
```

Buka:
```text
http://localhost:3000
```

## Deploy Vercel
1. Upload project ini ke GitHub.
2. Import repository ke Vercel.
3. Masukkan Environment Variables sesuai `.env.example`.
4. Deploy.

## Foto
Taruh foto kamu di folder:
```text
public/photos/
```

Lalu edit array `photos` di `app/page.tsx`.
