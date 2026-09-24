import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: Ambil data pengaturan kantor aktif
export async function GET() {
  try {
    const rows = await query(
      `SELECT id, nama, latitude, longitude, radius_meter, 
              jam_masuk_mulai, jam_masuk_akhir,
              jam_pulang_senin_kamis_mulai, jam_pulang_jumat_mulai, jam_pulang_akhir,
              jam_masuk, jam_pulang, updated_at
       FROM kantor 
       ORDER BY created_at ASC 
       LIMIT 1`
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Data kantor belum dikonfigurasi' }, { status: 404 });
    }

    return NextResponse.json({ kantor: rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Update konfigurasi kantor (Hanya Role Admin)
export async function PUT(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak: Hanya Admin yang dapat mengubah pengaturan kantor' }, { status: 403 });
    }

    const {
      nama,
      latitude,
      longitude,
      radius_meter,
      jam_masuk_mulai,
      jam_masuk_akhir,
      jam_pulang_senin_kamis_mulai,
      jam_pulang_jumat_mulai,
      jam_pulang_akhir,
    } = await req.json();

    if (!nama || latitude == null || longitude == null || !radius_meter) {
      return NextResponse.json({ error: 'Parameter kantor tidak lengkap' }, { status: 400 });
    }

    const check = await query('SELECT id FROM kantor LIMIT 1');
    let updated;

    const jMasukMulai = jam_masuk_mulai || '06:30:00';
    const jMasukAkhir = jam_masuk_akhir || '07:30:00';
    const jPulangSK = jam_pulang_senin_kamis_mulai || '15:30:00';
    const jPulangJumat = jam_pulang_jumat_mulai || '13:00:00';
    const jPulangAkhir = jam_pulang_akhir || '18:00:00';

    if (check.length > 0) {
      const id = check[0].id;
      updated = await query(
        `UPDATE kantor
         SET nama = $1, latitude = $2, longitude = $3, radius_meter = $4,
             jam_masuk_mulai = $5, jam_masuk_akhir = $6,
             jam_pulang_senin_kamis_mulai = $7, jam_pulang_jumat_mulai = $8, jam_pulang_akhir = $9,
             jam_masuk = $6, jam_pulang = $7, updated_at = NOW()
         WHERE id = $10
         RETURNING *`,
        [
          nama,
          parseFloat(latitude),
          parseFloat(longitude),
          parseInt(radius_meter),
          jMasukMulai,
          jMasukAkhir,
          jPulangSK,
          jPulangJumat,
          jPulangAkhir,
          id,
        ]
      );
    } else {
      updated = await query(
        `INSERT INTO kantor (
          nama, latitude, longitude, radius_meter,
          jam_masuk_mulai, jam_masuk_akhir,
          jam_pulang_senin_kamis_mulai, jam_pulang_jumat_mulai, jam_pulang_akhir,
          jam_masuk, jam_pulang
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $6, $7)
        RETURNING *`,
        [
          nama,
          parseFloat(latitude),
          parseFloat(longitude),
          parseInt(radius_meter),
          jMasukMulai,
          jMasukAkhir,
          jPulangSK,
          jPulangJumat,
          jPulangAkhir,
        ]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Pengaturan kantor dan jadwal kerja berhasil disimpan',
      kantor: updated[0],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
