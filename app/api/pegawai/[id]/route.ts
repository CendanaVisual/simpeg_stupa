import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

// PUT: Update Data Pegawai
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const { id } = params;
    const { nip, nama, email, username, role, jabatan, sisa_cuti_tahunan, is_active } = await req.json();

    const updated = await query(
      `UPDATE pegawai
       SET nip = $1, nama = $2, email = $3, username = $4, role = $5, jabatan = $6, sisa_cuti_tahunan = $7, is_active = $8, updated_at = NOW()
       WHERE id = $9
       RETURNING id, nip, nama, email, username, role, jabatan, sisa_cuti_tahunan, is_active`,
      [nip, nama, email, username, role, jabatan, sisa_cuti_tahunan, is_active ?? true, id]
    );

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Pegawai tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Data pegawai diperbarui', pegawai: updated[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Hapus / Nonaktifkan Pegawai
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const { id } = params;
    await query('DELETE FROM pegawai WHERE id = $1', [id]);

    return NextResponse.json({ success: true, message: 'Pegawai berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
