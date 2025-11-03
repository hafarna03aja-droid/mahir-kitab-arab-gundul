# Deploy ke Vercel - Panduan Lengkap

## Persiapan Sebelum Deploy

### 1. Setup Environment Variables
1. Copy file `.env.example` menjadi `.env`
2. Isi `GEMINI_API_KEY` dengan API key dari [Google AI Studio](https://aistudio.google.com/app/apikey)

```bash
GEMINI_API_KEY=AIzaSyD4lXxXxXxXxXxXxXxXxXxXxXxXxXx
```

### 2. Test Build Lokal
Pastikan aplikasi dapat di-build dengan sukses:

```bash
npm install
npm run build
npm run preview
```

## Deploy ke Vercel

### Metode 1: Deploy via Vercel CLI (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login ke Vercel:
```bash
vercel login
```

3. Deploy aplikasi:
```bash
vercel
```

4. Ikuti prompt untuk setup project:
   - Project name: `mahir-kitab-gundul` (atau nama yang diinginkan)
   - Directory to deploy: `./` (current directory)
   - Want to modify settings: `N`

5. Setup Environment Variables:
```bash
vercel env add GEMINI_API_KEY
```
Masukkan nilai API key saat diminta.

6. Deploy production:
```bash
vercel --prod
```

### Metode 2: Deploy via GitHub Integration

1. Push code ke GitHub repository
2. Login ke [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import repository dari GitHub
5. Configure project:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

6. Add Environment Variables di dashboard:
   - Key: `GEMINI_API_KEY`
   - Value: [Your Gemini API Key]
   - Environment: `Production`, `Preview`, `Development`

7. Deploy

## Konfigurasi Project

File `vercel.json` sudah dikonfigurasi dengan:
- ✅ SPA routing support (semua routes redirect ke index.html)
- ✅ Environment variables mapping
- ✅ Build configuration
- ✅ Framework detection (Vite)

## Troubleshooting

### Error: "API key not found"
- Pastikan environment variable `GEMINI_API_KEY` sudah diset di Vercel dashboard
- Redeploy aplikasi setelah menambahkan environment variable

### Error: "Build failed"
- Check dependencies di `package.json`
- Pastikan tidak ada error TypeScript
- Jalankan `npm run build` lokal untuk debugging

### Error: "404 on refresh"
- File `vercel.json` sudah menghandle SPA routing
- Jika masih error, pastikan `"rewrites"` configuration benar

## URL Production

Setelah deploy sukses, aplikasi akan tersedia di:
```
https://your-project-name.vercel.app
```

## Auto-Deploy

Jika menggunakan GitHub integration:
- Setiap push ke branch `main` akan trigger auto-deploy
- Pull requests akan create preview deployment
- Check deployment status di Vercel dashboard

## Custom Domain (Opsional)

1. Beli domain dari provider pilihan
2. Di Vercel dashboard → Project Settings → Domains
3. Add domain dan ikuti instruksi DNS configuration

---

**Note**: Pastikan API key Gemini disimpan dengan aman dan tidak di-commit ke repository!