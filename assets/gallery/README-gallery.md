# Cara Tambah Foto ke Gallery

## Langkah-langkah

1. **Taruh file gambar di folder ini** (`assets/gallery/`)
   - Format yang didukung: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`
   - Nama file disarankan tanpa spasi, contoh: `foto-liburan.jpg`, `project-1.png`

2. **Buka file `galeri.html`**, cari bagian `<div class="masonry-grid">`,
   lalu tambahkan blok berikut di dalamnya:

```html
<div class="masonry-item">
  <img src="assets/gallery/nama-file.jpg" alt="Deskripsi singkat" loading="lazy">
  <div class="masonry-overlay">
    <div class="masonry-label">Judul yang muncul saat hover</div>
  </div>
</div>
```

3. **Save → commit → push ke GitHub.** Selesai!

## Tips
- Kompres gambar dulu sebelum upload (pakai squoosh.app) supaya loading cepat
- Ukuran ideal: lebar 800–1200px, ukuran file < 500KB
- Urutan tampil = urutan di HTML (atas ke bawah)
