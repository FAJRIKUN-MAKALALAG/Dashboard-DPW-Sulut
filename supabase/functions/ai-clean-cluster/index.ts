import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Taksonomi Baku Partai NasDem Sulawesi Utara
const NASDEM_SULUT_TAXONOMY = `
PANDUAN TAKSONOMI RESMI PARTAI NASDEM SULUT:
1. 15 DPD KABUPATEN / KOTA BAKU:
   - Manado, Minahasa, Minahasa Selatan, Minahasa Utara, Minahasa Tenggara,
   - Tomohon, Bitung, Kotamobagu, Bolaang Mongondow, Bolaang Mongondow Utara,
   - Bolaang Mongondow Selatan, Bolaang Mongondow Timur,
   - Kepulauan Sangihe, Kepulauan Talaud, Kepulauan Siau Tagulandang Biaro (Sitaro).
   (Jika input bertuliskan "Kab. Minahasa Utara", hapus prefix "Kab." -> "Minahasa Utara").

2. SUB-ORGANISASI RESMI:
   - "I. DEWAN PERTIMBANGAN" (atau "DEWAN PERTIMBANGAN WILAYAH" jika DPW)
   - "II. DEWAN PAKAR" (atau "DEWAN PAKAR WILAYAH" jika DPW)
   - "III. DEWAN PIMPINAN DAERAH" (atau "DEWAN PIMPINAN WILAYAH" untuk DPW, "DEWAN PIMPINAN CABANG" untuk DPC)

3. 36 JABATAN BAKU STRUKTURAL DEWAN PIMPINAN:
   - Ketua
   - Sekretaris
   - Bendahara
   - Wakil Ketua Bidang Pemenangan Pemilu (Bappilu)
   - Wakil Ketua Bidang Organisasi, Keanggotaan, dan Kaderisasi (OKK)
   - Wakil Ketua Bidang Kaderisasi & Pendidikan Politik
   - Wakil Ketua Bidang Hubungan Legislatif
   - Wakil Ketua Bidang Hubungan Eksekutif
   - Wakil Ketua Bidang Hubungan Sayap & Badan
   - Wakil Ketua Bidang Penggalangan dan Penggerak Komunitas
   - Wakil Ketua Bidang Pemilih Pemula dan Milenial
   - Wakil Ketua Bidang Digital dan Siber
   - Wakil Ketua Bidang Media dan Komunikasi Publik
   - Wakil Ketua Bidang UMKM
   - Wakil Ketua Bidang Ekonomi
   - Wakil Ketua Bidang Agama & Masyarakat Adat
   - Wakil Ketua Bidang Tenaga Kerja
   - Wakil Ketua Bidang Kesehatan
   - Wakil Ketua Bidang Perempuan & Anak
   - Wakil Ketua Bidang Pendidikan & Kebudayaan
   - Wakil Ketua Bidang Hukum & HAM
   - Wakil Ketua Bidang Pariwisata & Industri Kreatif
   - Wakil Ketua Bidang Pertanian, Peternakan Dan Kemandirian Desa
   - Wakil Ketua Bidang Maritim
   - Wakil Ketua Bidang Pemuda & Olahraga
   - Wakil Ketua Bidang Lingkungan Hidup
   - Wakil Ketua Bidang Kehutanan, Agraria Dan Tata Ruang
   - Wakil Ketua Bidang Migran
   - Wakil Ketua Bidang Pembangunan & Infrastruktur
   - Wakil Ketua Bidang Kebijakan Publik & Isu Strategis
   - Wakil Ketua Bidang Hubungan Antar Lembaga
   - Wakil Ketua Bidang Hubungan Luar Negeri
   - Wakil Ketua Bidang Riset & Riset Kebijakan
   - Wakil Ketua Bidang Riset & Teknologi
   - Wakil Ketua Bidang Koperasi
   - Wakil Ketua Bidang Pertahanan & Keamanan

4. JABATAN DEWAN PERTIMBANGAN & DEWAN PAKAR:
   - Ketua, Wakil Ketua, Sekretaris, Anggota.
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { rawRows, rawSqlText, territoryContext } = body;

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({
          error: "GEMINI_API_KEY belum dikonfigurasi di Supabase Secrets.",
          instruction: "Jalankan: npx supabase secrets set GEMINI_API_KEY=AIzaSy... di terminal.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let inputDataForAi = "";
    if (rawRows && Array.isArray(rawRows) && rawRows.length > 0) {
      inputDataForAi = JSON.stringify(rawRows, null, 2);
    } else if (rawSqlText && typeof rawSqlText === "string" && rawSqlText.trim() !== "") {
      inputDataForAi = rawSqlText.trim();
    } else {
      return new Response(
        JSON.stringify({ error: "Input kosong. Kirim rawRows (array) atau rawSqlText (string)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `
Anda adalah AI Spesialis Normalisasi Data Kepengurusan Partai NasDem Sulawesi Utara.
Tugas Anda adalah membersihkan data mentah (baik dari file Excel atau potongan teks INSERT SQL) agar menjadi struktur yang bersih, rapi, dan konsisten sebelum masuk ke database Supabase.

${NASDEM_SULUT_TAXONOMY}

ATURAN PEMBERSIHAN & CLUSTERING:
1. PISAHKAN SUB-ORGANISASI SECARA TEGAS:
   - Jika jabatan/baris/label mengandung "Pertimbangan" atau "Wankar" -> set subOrg = "I. DEWAN PERTIMBANGAN" (atau DPW jika wilayah DPW).
   - Jika jabatan/baris/label mengandung "Pakar" atau "Wangan" -> set subOrg = "II. DEWAN PAKAR" (atau DPW jika wilayah DPW).
   - Sisanya (termasuk Ketua, Sekretaris, Bendahara, para Wakil Ketua Bidang) -> set subOrg = "III. DEWAN PIMPINAN DAERAH" (atau DPD/DPW/DPC sesuai level wilayah).

2. NORMALISASI NAMA JABATAN:
   - Petakan singkatan/typo ke nama jabatan resmi baku.
     Contoh:
     * "Wkl Ketua Bid Pemilihan Umum" -> "Wakil Ketua Bidang Pemenangan Pemilu (Bappilu)"
     * "Wakil Ketua Bid Organisasi & Keanggotaan" -> "Wakil Ketua Bidang Organisasi, Keanggotaan, dan Kaderisasi (OKK)"
     * "Wakil Ketua Bid. Ekonomi" -> "Wakil Ketua Bidang Ekonomi"
     * "Wakil Ketua Bid UMKM" -> "Wakil Ketua Bidang UMKM"
   - Jika jabatan sama sekali tidak ada di 36 slot baku (misal posisi ad-hoc tambahan), tetap simpan nama jabatannya dan set "isMatched": false. Jika cocok, set "isMatched": true.

3. PEMBERSIHAN NAMA DAN GELAR:
   - Bersihkan nama kader menjadi format yang rapi dan profesional.
   - Contoh: "Netty Agnes Pantow, SE" -> namaLengkap: "NETTY AGNES PANTOW, SE", gelar: "S.E."
   - Pisahkan nomor telepon/HP, email jika ada di baris data.

4. FORMAT JSON OUTPUT:
   Kembalikan objek JSON dengan format PERSIS:
   {
     "items": [
       {
         "no": 1,
         "subOrg": "I. DEWAN PERTIMBANGAN",
         "jabatan": "Ketua",
         "canonicalJabatan": "Ketua",
         "isMatched": true,
         "namaLengkap": "NAMA PENGURUS",
         "gelar": "S.T.",
         "nik": "7105...",
         "jenisKelamin": "L",
         "nomorHP": "",
         "email": "",
         "clusterGroup": "WANKAR",
         "aiCorrection": "Dipisahkan ke Dewan Pertimbangan"
       }
     ]
   }
`;

    const userPrompt = `
Wilayah Konteks: Tingkat ${territoryContext?.level || "DPD"} - ${territoryContext?.dpd || "Sulawesi Utara"}
Data Mentah untuk Dibersihkan:
${inputDataForAi}
`;

    // Panggil model Gemini Flash dengan JSON Output
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: systemPrompt + "\n\n" + userPrompt }],
          },
        ],
        generationConfig: {
          response_mime_type: "application/json",
          temperature: 0.1,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      throw new Error(`Gagal memanggil Gemini API (${geminiResponse.status}): ${errText}`);
    }

    const geminiData = await geminiResponse.json();
    const rawAiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawAiText) {
      throw new Error("Gemini AI tidak mengembalikan respons teks yang valid.");
    }

    const parsedJson = JSON.parse(rawAiText);
    const items = parsedJson.items || parsedJson.pengurus || (Array.isArray(parsedJson) ? parsedJson : []);

    // Hitung ringkasan clustering
    const stats = {
      total: items.length,
      pertimbanganCount: items.filter((i: any) =>
        (i.subOrg || i.clusterGroup || "").toLowerCase().includes("pertimbangan") ||
        (i.clusterGroup || "").toUpperCase() === "WANKAR"
      ).length,
      pakarCount: items.filter((i: any) =>
        (i.subOrg || i.clusterGroup || "").toLowerCase().includes("pakar") ||
        (i.clusterGroup || "").toUpperCase() === "WANGAN"
      ).length,
      pimpinanCount: items.filter((i: any) =>
        (i.subOrg || i.clusterGroup || "").toLowerCase().includes("pimpinan") ||
        (i.clusterGroup || "").toUpperCase() === "PIMPINAN"
      ).length,
      matchedCount: items.filter((i: any) => i.isMatched).length,
      correctedCount: items.filter((i: any) => i.aiCorrection).length,
    };

    return new Response(
      JSON.stringify({
        success: true,
        items,
        stats,
        message: `Berhasil membersihkan dan mengelompokkan ${items.length} kader pengurus dengan Gemini AI.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Terjadi kesalahan pada Edge Function.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
