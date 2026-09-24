import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: Rekapitulasi Presensi (Admin & Reporting)
export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const bulan = parseInt(searchParams.get('bulan') || String(new Date().getMonth() + 1));
    const tahun = parseInt(searchParams.get('tahun') || String(new Date().getFullYear()));
    const pegawaiId = searchParams.get('pegawai_id');

    // Query daftar absensi dengan join pegawai
    let sql = `
      SELECT 
        a.id,
        a.pegawai_id,
        p.nip,
        p.nama,
        p.jabatan,
        a.waktu_absen,
        a.tipe_absen,
        a.status,
        a.waktu_terlambat,
        a.waktu_mendahului,
        (COALESCE(a.waktu_terlambat, 0) + COALESCE(a.waktu_mendahului, 0)) AS total_menit_pelanggaran,
        ((COALESCE(a.waktu_terlambat, 0) + COALESCE(a.waktu_mendahului, 0)) * 500) AS denda_potongan_gaji,
        a.jarak_dari_kantor,
        a.url_foto_cloudinary,
        a.device_id_used,
        a.catatan
      FROM absensi a
      JOIN pegawai p ON a.pegawai_id = p.id
      WHERE EXTRACT(MONTH FROM a.waktu_absen) = $1
        AND EXTRACT(YEAR FROM a.waktu_absen) = $2
    `;

    const params: any[] = [bulan, tahun];

    if (pegawaiId && pegawaiId !== 'all') {
      params.push(pegawaiId);
      sql += ` AND a.pegawai_id = $${params.length}`;
    }

    sql += ` ORDER BY a.waktu_absen DESC`;

    const logs = await query(sql, params);

    // Hitung statistik ringkasan
    const stats = {
      total_log: logs.length,
      tepat_waktu: logs.filter((l: any) => l.status === 'tepat_waktu').length,
      terlambat: logs.filter((l: any) => l.status === 'terlambat').length,
      mendahului: logs.filter((l: any) => l.status === 'mendahului').length,
      dinas_luar: logs.filter((l: any) => l.status === 'dinas_luar').length,
      total_menit_terlambat: logs.reduce((acc: number, l: any) => acc + (l.waktu_terlambat || 0), 0),
      total_menit_mendahului: logs.reduce((acc: number, l: any) => acc + (l.waktu_mendahului || 0), 0),
      total_potongan_gaji_rp: logs.reduce(
        (acc: number, l: any) => acc + ((l.waktu_terlambat || 0) + (l.waktu_mendahului || 0)) * 500,
        0
      ),
    };

    // Ambil rekap per pegawai (Termasuk akumulasi denda potongan gaji Rp 500/menit)
    const pegawaiSummarySql = `
      SELECT 
        p.id,
        p.nip,
        p.nama,
        p.jabatan,
        p.sisa_cuti_tahunan,
        COUNT(CASE WHEN a.tipe_absen = 'masuk' THEN 1 END) AS total_hadir,
        COUNT(CASE WHEN a.status = 'tepat_waktu' AND a.tipe_absen = 'masuk' THEN 1 END) AS hadir_tepat_waktu,
        COUNT(CASE WHEN a.status = 'terlambat' THEN 1 END) AS total_terlambat,
        COUNT(CASE WHEN a.status = 'mendahului' THEN 1 END) AS total_mendahului,
        COUNT(CASE WHEN a.status = 'dinas_luar' THEN 1 END) AS total_dinas_luar,
        COALESCE(SUM(a.waktu_terlambat), 0) AS total_menit_keterlambatan,
        COALESCE(SUM(a.waktu_mendahului), 0) AS total_menit_mendahului,
        COALESCE(SUM(COALESCE(a.waktu_terlambat, 0) + COALESCE(a.waktu_mendahului, 0)), 0) AS total_menit_pelanggaran,
        COALESCE(SUM(COALESCE(a.waktu_terlambat, 0) + COALESCE(a.waktu_mendahului, 0)) * 500, 0) AS total_potongan_gaji_rp
      FROM pegawai p
      LEFT JOIN absensi a ON p.id = a.pegawai_id 
        AND EXTRACT(MONTH FROM a.waktu_absen) = $1 
        AND EXTRACT(YEAR FROM a.waktu_absen) = $2
      WHERE p.role = 'pegawai'
      GROUP BY p.id, p.nip, p.nama, p.jabatan, p.sisa_cuti_tahunan
      ORDER BY p.nama ASC;
    `;

    const summaryPerPegawai = await query(pegawaiSummarySql, [bulan, tahun]);

    return NextResponse.json({
      bulan,
      tahun,
      stats,
      summaryPerPegawai,
      logs,
    });
  } catch (error: any) {
    console.error('Rekap error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
