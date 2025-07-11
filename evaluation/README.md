# RAG System Evaluation

Sistem evaluasi komprehensif untuk mengukur kinerja sistem RAG (Retrieval-Augmented Generation) Waras AI menggunakan metrik standar industri.

## 📊 Metrik Evaluasi

### 1. Retrieval Evaluation - Mean Reciprocal Rank (MRR)

**Tujuan**: Mengukur kemampuan sistem dalam menemukan dan memberi peringkat pada dokumen yang paling relevan dari basis data vektor.

**Formula**:

```
MRR = (1/|Q|) × Σ(1/rank_i)
```

**Interpretasi**:

- **0.90-1.00**: Excellent - Dokumen relevan hampir selalu di peringkat teratas
- **0.80-0.89**: Very Good - Performa retrieval sangat baik
- **0.70-0.79**: Good - Performa retrieval baik
- **0.60-0.69**: Fair - Performa retrieval cukup
- **<0.60**: Poor - Perlu perbaikan sistem retrieval

### 2. Generation Evaluation

#### a) Faithfulness (Kepatuhan)

**Tujuan**: Mengukur seberapa akurat jawaban yang dihasilkan LLM terhadap informasi dalam konteks yang diberikan.

**Cara Kerja**: Setiap klaim dalam jawaban diperiksa apakah didukung oleh konteks. Skor 1 untuk klaim yang didukung, 0 untuk yang tidak.

#### b) Answer Relevancy (Relevansi Jawaban)

**Tujuan**: Mengukur seberapa relevan jawaban yang dihasilkan terhadap pertanyaan asli pengguna.

**Cara Kerja**: Menghitung cosine similarity antara embedding pertanyaan dan embedding jawaban.

#### c) Semantic Similarity (Kemiripan Semantik)

**Tujuan**: Membandingkan jawaban yang dihasilkan sistem dengan jawaban referensi ideal.

**Cara Kerja**: Menghitung cosine similarity antara embedding jawaban sistem dan embedding jawaban referensi.

## 🚀 Cara Penggunaan

### Persiapan

1. **Pastikan database sudah terisi dengan data Alodokter**:

   ```bash
   npm run import-alodokter
   ```

2. **Pastikan environment variables sudah diset**:
   ```env
   DATABASE_URL=your_database_url
   GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
   ```

### Menjalankan Evaluasi

#### 1. Evaluasi Lengkap (Recommended)

```bash
npm run eval:complete
```

Menjalankan kedua evaluasi retrieval dan generation, kemudian menghasilkan laporan komprehensif.

#### 2. Evaluasi Retrieval Saja

```bash
npm run eval:retrieval
```

Hanya menjalankan evaluasi MRR untuk sistem retrieval.

#### 3. Evaluasi Generation Saja

```bash
npm run eval:generation
```

Hanya menjalankan evaluasi faithfulness, answer relevancy, dan semantic similarity.

### Output Evaluasi

Hasil evaluasi akan disimpan di folder `evaluation/results/` dengan format:

- **Laporan MRR**: `mrr-report-[timestamp].md`
- **Laporan Generation**: `generation-report-[timestamp].md`
- **Laporan Komprehensif**: `comprehensive-evaluation-report-[timestamp].md`
- **Data JSON**: `combined-evaluation-[timestamp].json`

## 📁 Struktur File

```
evaluation/
├── README.md                    # Dokumentasi sistem evaluasi
├── test-queries.json           # Dataset 15 query test dengan ground truth
├── retrieval-evaluation.ts     # Script evaluasi MRR
├── generation-evaluation.ts    # Script evaluasi generation metrics
├── run-evaluation.ts          # Main runner untuk evaluasi lengkap
└── results/                   # Output folder untuk hasil evaluasi
    ├── mrr-report-*.md
    ├── generation-report-*.md
    ├── comprehensive-*.md
    └── *.json
```

## 📋 Dataset Test

Dataset evaluasi terdiri dari 15 query representatif dalam bahasa Indonesia yang mencakup:

1. **Gangguan Mental Umum**: OCD, depresi, gangguan bipolar
2. **Gangguan Tidur**: insomnia, mimpi buruk
3. **Gangguan Makan**: anoreksia, bulimia
4. **Gangguan Perkembangan**: autisme, ADHD
5. **Trauma dan Stres**: PTSD, fobia
6. **Gangguan Kepribadian**: borderline, antisosial
7. **Gangguan Perilaku**: ODD, kleptomania

Setiap query memiliki:

- **Ground truth documents**: Dokumen yang seharusnya relevan
- **Reference answer**: Jawaban ideal yang digunakan untuk semantic similarity

## 🔧 Konfigurasi

### Parameter Default

- **k**: 10 (jumlah dokumen yang dipertimbangkan untuk MRR)
- **Max context chunks**: 5 per query
- **Similarity threshold**: 0.3
- **Embedding model**: Google text-embedding-004
- **LLM model**: Gemini 2.0 Flash
- **Rate limiting**: 1 detik delay antar query

### Customization

Untuk memodifikasi parameter evaluasi, edit file script yang sesuai:

```typescript
// Mengubah nilai k untuk MRR
const results = await evaluator.calculateMRR(15); // default: 10

// Mengubah jumlah context chunks
const context = retrievalResults.slice(0, 7); // default: 5
```

## 📊 Interpretasi Hasil

### Contoh Output

```
📊 EVALUATION SUMMARY
==================================================
Total Queries: 15
Overall Performance: Very Good (84.2%)

📈 METRICS:
  MRR (Retrieval):      0.93 (Excellent retrieval performance)
  Faithfulness:         0.85 (Very Good)
  Answer Relevancy:     0.91 (Excellent)
  Semantic Similarity:  0.88 (Very Good)
```

### Target Benchmarks

**Sistem yang Baik**:

- MRR ≥ 0.80
- Faithfulness ≥ 0.80
- Answer Relevancy ≥ 0.85
- Semantic Similarity ≥ 0.75

**Sistem yang Excellent**:

- MRR ≥ 0.90
- Faithfulness ≥ 0.90
- Answer Relevancy ≥ 0.90
- Semantic Similarity ≥ 0.85

## 🛠️ Troubleshooting

### Error Umum

1. **Database Connection Error**:

   ```bash
   # Pastikan database running dan env vars benar
   npm run db:check
   ```

2. **API Key Error**:

   ```bash
   # Pastikan Google API key valid dan memiliki akses ke Gemini
   echo $GOOGLE_GENERATIVE_AI_API_KEY
   ```

3. **Memory/Rate Limiting**:
   - Sesuaikan delay antar query di `generation-evaluation.ts`
   - Kurangi batch size jika diperlukan

### Performance Tips

1. **Untuk evaluasi cepat**: Gunakan subset test queries yang lebih kecil
2. **Untuk akurasi tinggi**: Jalankan evaluasi multiple kali dan ambil rata-rata
3. **Untuk debugging**: Aktifkan logging detail di masing-masing script

## 🔄 Continuous Evaluation

Untuk monitoring berkelanjutan:

1. **Automated Testing**: Integrasikan script evaluasi ke CI/CD pipeline
2. **Scheduled Evaluation**: Jalankan evaluasi berkala (mingguan/bulanan)
3. **A/B Testing**: Bandingkan konfigurasi berbeda menggunakan sistem evaluasi ini
4. **User Feedback Integration**: Tambahkan query real dari user ke dataset test

## 📚 Referensi

Sistem evaluasi ini mengadopsi metrik standar dari:

- [RAGAS: Automated Evaluation of Retrieval Augmented Generation](https://docs.ragas.io/)
- [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401)
- [Evaluating the Factual Consistency of Abstractive Text Summarization](https://arxiv.org/abs/1910.12840)

---

_Untuk pertanyaan atau saran perbaikan sistem evaluasi, silakan buat issue di repository ini._
