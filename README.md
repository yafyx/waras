# Waras AI

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/yafyx/waras)

> **Waras AI** adalah asisten chat psikologi anonim berbahasa Indonesia, didukung Gemini AI dan basis pengetahuan artikel psikologi dari Alodokter. Dirancang untuk privasi, kecepatan, dan akurasi jawaban psikologi—tanpa akun, tanpa simpan chat di server.

---

## Fitur Utama

- **Privasi & Anonimitas:** Chat hanya disimpan di browser Anda (localStorage). Tidak ada akun, tidak ada server-side chat log.
- **Bahasa Indonesia:** Semua interaksi dan jawaban dalam bahasa Indonesia yang ramah dan empatik.
- **RAG (Retrieval-Augmented Generation):** Jawaban AI selalu didukung pencarian artikel psikologi Alodokter.
- **Model Gemini AI:** Menggunakan Google Gemini 2.0 Flash untuk respons cepat dan relevan.
- **UI Modern:** Next.js App Router, React, Tailwind CSS, Shadcn UI, Radix UI.
- **Akses Cepat:** Tidak perlu login, langsung tanya jawab.
- **Fokus Psikologi:** Hanya untuk pertanyaan seputar kesehatan mental & psikologi.
- **Open Source & Gratis:** MIT License.

## Tech Stack

- **Framework:** Next.js 15 App Router (TypeScript, SSR, RSC)
- **AI:** Vercel AI SDK, Gemini 2.0 Flash
- **RAG:** Embedding & vector search (Drizzle ORM + PostgreSQL)
- **UI:** Tailwind CSS, Shadcn UI, Radix UI, Framer Motion
- **State:** React, localStorage (client-side chat history)
- **Database:** PostgreSQL (untuk knowledge base & embedding)
- **Validation:** Zod
- **Other:** pnpm, Drizzle Kit, ESLint, Prettier

## Demo

Lihat demo di [waras.vercel.app](https://waras.vercel.app)

## Instalasi & Penggunaan

1. **Clone repository:**
   ```bash
   git clone https://github.com/your-username/waras.git
   cd waras
   ```
2. **Install dependencies:**
   ```bash
   pnpm install
   ```
3. **Konfigurasi environment:**
   - Salin `.env.example` ke `.env` dan isi:
     ```env
     DATABASE_URL=postgres://postgres:postgres@localhost:5432/{DB_NAME}
     GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key
     ```
4. **Migrasi database:**
   ```bash
   pnpm run db:migrate
   ```
5. **Import data Alodokter:**
   ```bash
   pnpm run import-alodokter
   ```
6. **Jalankan server development:**
   ```bash
   pnpm run dev
   ```
7. **Akses di browser:**
   [http://localhost:3000](http://localhost:3000)

## Struktur Data & RAG

- Data artikel psikologi Alodokter di-embed dan disimpan di PostgreSQL (vector DB).
- Setiap pertanyaan user diproses dengan RAG: AI hanya menjawab berdasarkan hasil pencarian artikel relevan.
- Tidak ada data chat user yang dikirim ke server atau disimpan di database.

## Lisensi

MIT License © 2024 yfyx

---

> **Disclaimer:** Waras AI hanya memberikan informasi edukasi, bukan pengganti konsultasi profesional. Untuk masalah serius, segera hubungi psikolog/psikiater.
