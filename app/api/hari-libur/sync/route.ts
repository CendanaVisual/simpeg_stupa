import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const OFFICIAL_HOLIDAYS_CATALOG: Record<number, Array<{ tanggal: string; keterangan: string; tipe: string }>> = {
  2025: [
    { tanggal: '2025-01-01', keterangan: 'Tahun Baru 2025 Masehi', tipe: 'nasional' },
    { tanggal: '2025-01-27', keterangan: 'Isra Mikraj Nabi Muhammad SAW', tipe: 'nasional' },
    { tanggal: '2025-01-28', keterangan: 'Cuti Bersama Tahun Baru Imlek 2576 Kongzili', tipe: 'nasional' },
    { tanggal: '2025-01-29', keterangan: 'Tahun Baru Imlek 2576 Kongzili', tipe: 'nasional' },
    { tanggal: '2025-03-28', keterangan: 'Cuti Bersama Hari Suci Nyepi', tipe: 'nasional' },
    { tanggal: '2025-03-29', keterangan: 'Hari Suci Nyepi (Tahun Baru Saka 1947)', tipe: 'nasional' },
    { tanggal: '2025-03-31', keterangan: 'Hari Raya Idul Fitri 1446 H', tipe: 'nasional' },
    { tanggal: '2025-04-01', keterangan: 'Hari Raya Idul Fitri 1446 H', tipe: 'nasional' },
    { tanggal: '2025-04-02', keterangan: 'Cuti Bersama Idul Fitri 1446 H', tipe: 'nasional' },
    { tanggal: '2025-04-03', keterangan: 'Cuti Bersama Idul Fitri 1446 H', tipe: 'nasional' },
    { tanggal: '2025-04-04', keterangan: 'Cuti Bersama Idul Fitri 1446 H', tipe: 'nasional' },
    { tanggal: '2025-04-07', keterangan: 'Cuti Bersama Idul Fitri 1446 H', tipe: 'nasional' },
    { tanggal: '2025-04-18', keterangan: 'Wafat Yesus Kristus', tipe: 'nasional' },
    { tanggal: '2025-04-20', keterangan: 'Kebangkitan Yesus Kristus (Paskah)', tipe: 'nasional' },
    { tanggal: '2025-05-01', keterangan: 'Hari Buruh Internasional', tipe: 'nasional' },
    { tanggal: '2025-05-12', keterangan: 'Hari Raya Waisak 2569 BE', tipe: 'nasional' },
    { tanggal: '2025-05-13', keterangan: 'Cuti Bersama Hari Raya Waisak', tipe: 'nasional' },
    { tanggal: '2025-05-29', keterangan: 'Kenaikan Yesus Kristus', tipe: 'nasional' },
    { tanggal: '2025-05-30', keterangan: 'Cuti Bersama Kenaikan Yesus Kristus', tipe: 'nasional' },
    { tanggal: '2025-06-01', keterangan: 'Hari Lahir Pancasila', tipe: 'nasional' },
    { tanggal: '2025-06-06', keterangan: 'Cuti Bersama Hari Raya Idul Adha', tipe: 'nasional' },
    { tanggal: '2025-06-07', keterangan: 'Hari Raya Idul Adha 1446 H', tipe: 'nasional' },
    { tanggal: '2025-06-27', keterangan: 'Tahun Baru Islam 1447 H', tipe: 'nasional' },
    { tanggal: '2025-08-17', keterangan: 'Hari Kemerdekaan RI ke-80', tipe: 'nasional' },
    { tanggal: '2025-09-05', keterangan: 'Maulid Nabi Muhammad SAW', tipe: 'nasional' },
    { tanggal: '2025-12-25', keterangan: 'Hari Raya Natal', tipe: 'nasional' },
    { tanggal: '2025-12-26', keterangan: 'Cuti Bersama Hari Raya Natal', tipe: 'nasional' },
  ],
  2026: [
    { tanggal: '2026-01-01', keterangan: 'Tahun Baru 2026 Masehi', tipe: 'nasional' },
    { tanggal: '2026-01-16', keterangan: 'Isra Mikraj Nabi Muhammad SAW', tipe: 'nasional' },
    { tanggal: '2026-02-16', keterangan: 'Cuti Bersama Tahun Baru Imlek', tipe: 'nasional' },
    { tanggal: '2026-02-17', keterangan: 'Tahun Baru Imlek 2577 Kongzili', tipe: 'nasional' },
    { tanggal: '2026-03-19', keterangan: 'Hari Suci Nyepi (Tahun Baru Saka 1948)', tipe: 'nasional' },
    { tanggal: '2026-03-20', keterangan: 'Hari Raya Idul Fitri 1447 H', tipe: 'nasional' },
    { tanggal: '2026-03-21', keterangan: 'Hari Raya Idul Fitri 1447 H', tipe: 'nasional' },
    { tanggal: '2026-03-23', keterangan: 'Cuti Bersama Idul Fitri 1447 H', tipe: 'nasional' },
    { tanggal: '2026-03-24', keterangan: 'Cuti Bersama Idul Fitri 1447 H', tipe: 'nasional' },
    { tanggal: '2026-04-03', keterangan: 'Wafat Yesus Kristus', tipe: 'nasional' },
    { tanggal: '2026-04-05', keterangan: 'Kebangkitan Yesus Kristus (Paskah)', tipe: 'nasional' },
    { tanggal: '2026-05-01', keterangan: 'Hari Buruh Internasional', tipe: 'nasional' },
    { tanggal: '2026-05-14', keterangan: 'Kenaikan Yesus Kristus', tipe: 'nasional' },
    { tanggal: '2026-05-27', keterangan: 'Hari Raya Idul Adha 1447 H', tipe: 'nasional' },
    { tanggal: '2026-05-31', keterangan: 'Hari Raya Waisak 2570 BE', tipe: 'nasional' },
    { tanggal: '2026-06-01', keterangan: 'Hari Lahir Pancasila', tipe: 'nasional' },
    { tanggal: '2026-06-16', keterangan: 'Tahun Baru Islam 1448 H', tipe: 'nasional' },
    { tanggal: '2026-08-17', keterangan: 'Hari Kemerdekaan RI ke-81', tipe: 'nasional' },
    { tanggal: '2026-08-25', keterangan: 'Maulid Nabi Muhammad SAW', tipe: 'nasional' },
    { tanggal: '2026-12-25', keterangan: 'Hari Raya Natal', tipe: 'nasional' },
    { tanggal: '2026-12-26', keterangan: 'Cuti Bersama Hari Raya Natal', tipe: 'nasional' },
  ],
  2027: [
    { tanggal: '2027-01-01', keterangan: 'Tahun Baru 2027 Masehi', tipe: 'nasional' },
    { tanggal: '2027-01-06', keterangan: 'Isra Mikraj Nabi Muhammad SAW', tipe: 'nasional' },
    { tanggal: '2027-02-06', keterangan: 'Tahun Baru Imlek 2578 Kongzili', tipe: 'nasional' },
    { tanggal: '2027-03-09', keterangan: 'Hari Raya Idul Fitri 1448 H', tipe: 'nasional' },
    { tanggal: '2027-03-10', keterangan: 'Hari Raya Idul Fitri 1448 H', tipe: 'nasional' },
    { tanggal: '2027-03-26', keterangan: 'Wafat Yesus Kristus', tipe: 'nasional' },
    { tanggal: '2027-05-01', keterangan: 'Hari Buruh Internasional', tipe: 'nasional' },
    { tanggal: '2027-05-06', keterangan: 'Kenaikan Yesus Kristus', tipe: 'nasional' },
    { tanggal: '2027-05-16', keterangan: 'Hari Raya Idul Adha 1448 H', tipe: 'nasional' },
    { tanggal: '2027-05-20', keterangan: 'Hari Raya Waisak 2571 BE', tipe: 'nasional' },
    { tanggal: '2027-06-01', keterangan: 'Hari Lahir Pancasila', tipe: 'nasional' },
    { tanggal: '2027-06-06', keterangan: 'Tahun Baru Islam 1449 H', tipe: 'nasional' },
    { tanggal: '2027-08-17', keterangan: 'Hari Kemerdekaan RI ke-82', tipe: 'nasional' },
    { tanggal: '2027-08-14', keterangan: 'Maulid Nabi Muhammad SAW', tipe: 'nasional' },
    { tanggal: '2027-12-25', keterangan: 'Hari Raya Natal', tipe: 'nasional' },
  ]
};

// POST: Sinkronisasi hari libur dari Kalender Nasional
export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak: Hanya Admin yang dapat sinkronisasi hari libur' }, { status: 403 });
    }

    const { tahun } = await req.json().catch(() => ({}));
    const targetYear = parseInt(tahun || String(new Date().getFullYear()));

    let holidaysToInsert: Array<{ tanggal: string; keterangan: string; tipe: string }> = [];

    // 1. Coba panggil external API Kalender Libur Nasional Indonesia
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`https://dayoffapi.vercel.app/api?year=${targetYear}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          holidaysToInsert = data.map((item: any) => ({
            tanggal: item.tanggal || item.date,
            keterangan: item.keterangan || item.name || 'Hari Libur Nasional',
            tipe: item.is_cuti ? 'nasional' : 'nasional',
          })).filter((item: any) => item.tanggal);
        }
      }
    } catch {
      // Fallback ke catalog internal jika network external gagal
      console.log(`Gagal menghubungi API external, beralih ke katalog internal hari libur tahun ${targetYear}`);
    }

    // 2. Jika API external tidak mengembalikan data, gunakan katalog komprehensif resmi
    if (holidaysToInsert.length === 0) {
      holidaysToInsert = OFFICIAL_HOLIDAYS_CATALOG[targetYear] || OFFICIAL_HOLIDAYS_CATALOG[2026];
    }

    let insertedCount = 0;
    for (const h of holidaysToInsert) {
      if (!h.tanggal || !h.keterangan) continue;
      await query(
        `INSERT INTO hari_libur (tanggal, keterangan, tipe)
         VALUES ($1, $2, $3)
         ON CONFLICT (tanggal) DO UPDATE 
         SET keterangan = EXCLUDED.keterangan, tipe = EXCLUDED.tipe`,
        [h.tanggal.slice(0, 10), h.keterangan, h.tipe || 'nasional']
      );
      insertedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil menyinkronkan ${insertedCount} hari libur nasional untuk tahun ${targetYear}!`,
      count: insertedCount,
      tahun: targetYear,
    });
  } catch (error: any) {
    console.error('Error in holiday sync:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
