import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { checkIsHoliday } from '@/lib/holiday';

export const dynamic = 'force-dynamic';

// GET: Ambil daftar hari libur atau status hari ini
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const todayOnly = searchParams.get('today') === 'true';
    const tahun = searchParams.get('tahun');
    const bulan = searchParams.get('bulan');

    if (todayOnly) {
      const status = await checkIsHoliday();
      return NextResponse.json(status);
    }

    let sql = `
      SELECT id, tanggal, keterangan, tipe, created_at
      FROM hari_libur
      WHERE 1=1
    `;
    const params: any[] = [];

    if (tahun) {
      params.push(parseInt(tahun));
      sql += ` AND EXTRACT(YEAR FROM tanggal) = $${params.length}`;
    }

    if (bulan) {
      params.push(parseInt(bulan));
      sql += ` AND EXTRACT(MONTH FROM tanggal) = $${params.length}`;
    }

    sql += ` ORDER BY tanggal ASC`;

    const holidays = await query(sql, params);

    // Ambil juga info hari ini
    const todayStatus = await checkIsHoliday();

    return NextResponse.json({
      success: true,
      total: holidays.length,
      today: todayStatus,
      holidays,
    });
  } catch (error: any) {
    console.error('Error fetching holidays:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Tambah atau update hari libur manual (Admin Only)
export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak: Hanya Admin yang dapat mengelola hari libur' }, { status: 403 });
    }

    const { tanggal, keterangan, tipe } = await req.json();

    if (!tanggal || !keterangan) {
      return NextResponse.json({ error: 'Tanggal dan Keterangan hari libur wajib diisi!' }, { status: 400 });
    }

    const cleanDate = tanggal.slice(0, 10);
    const cleanKeterangan = keterangan.trim();
    const cleanTipe = tipe === 'khusus' ? 'khusus' : 'nasional';

    const result = await query(
      `INSERT INTO hari_libur (tanggal, keterangan, tipe)
       VALUES ($1, $2, $3)
       ON CONFLICT (tanggal) DO UPDATE 
       SET keterangan = EXCLUDED.keterangan, tipe = EXCLUDED.tipe
       RETURNING id, tanggal, keterangan, tipe, created_at`,
      [cleanDate, cleanKeterangan, cleanTipe]
    );

    return NextResponse.json({
      success: true,
      message: 'Hari libur berhasil disimpan!',
      holiday: result[0],
    });
  } catch (error: any) {
    console.error('Error adding holiday:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
