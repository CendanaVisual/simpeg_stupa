import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

// PUT: Approval / Rejection Pengajuan (Admin Only)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak: Hanya Admin yang dapat memproses pengajuan' }, { status: 403 });
    }

    const { id } = params;
    const { status_approval, catatan_admin } = await req.json();

    if (!['approved', 'rejected'].includes(status_approval)) {
      return NextResponse.json(
        { error: 'Status persetujuan harus "approved" atau "rejected"' },
        { status: 400 }
      );
    }

    // Ambil data pengajuan saat ini
    const check = await query('SELECT * FROM pengajuan WHERE id = $1', [id]);
    if (check.length === 0) {
      return NextResponse.json({ error: 'Pengajuan tidak ditemukan' }, { status: 404 });
    }

    const pengajuan = check[0];

    if (pengajuan.status_approval === 'approved') {
      return NextResponse.json(
        { error: 'Pengajuan ini sudah pernah disetujui sebelumnya' },
        { status: 400 }
      );
    }

    // Update status pengajuan.
    // Trigger PostgreSQL 'trg_pengajuan_cuti_approval' akan secara otomatis memotong
    // sisa_cuti_tahunan pegawai jika status menjadi 'approved' dan tipe adalah 'cuti_tahunan'.
    const updateRes = await query(
      `UPDATE pengajuan
       SET status_approval = $1,
           approved_by = $2,
           catatan_admin = $3,
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status_approval, session.id, catatan_admin || null, id]
    );

    // Ambil info sisa cuti terbaru pegawai untuk konfirmasi
    const pegawaiRes = await query(
      `SELECT nama, email, sisa_cuti_tahunan FROM pegawai WHERE id = $1`,
      [pengajuan.pegawai_id]
    );

    const pegawai = pegawaiRes[0];

    return NextResponse.json({
      success: true,
      message: `Pengajuan ${pengajuan.tipe_pengajuan.replace('_', ' ')} berhasil ${
        status_approval === 'approved' ? 'DISETUJUI' : 'DITOLAK'
      }!`,
      pengajuan: updateRes[0],
      pegawai_info: {
        nama: pegawai?.nama,
        sisa_cuti_tahunan: pegawai?.sisa_cuti_tahunan,
      },
    });
  } catch (error: any) {
    console.error('Approval error:', error);
    return NextResponse.json(
      { error: 'Gagal memproses persetujuan: ' + error.message },
      { status: 500 }
    );
  }
}

// Support POST as well
export const POST = PUT;

