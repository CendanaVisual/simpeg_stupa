import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest, hashPassword } from '@/lib/auth';

// POST: Reset sandi pegawai menjadi default ('stupa123')
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak: Hanya Admin yang dapat mereset sandi' }, { status: 403 });
    }

    const { id } = params;
    const defaultPassword = 'stupa123';
    const newHash = await hashPassword(defaultPassword);

    const res = await query(
      `UPDATE pegawai 
       SET password_hash = $1, is_first_login = true, updated_at = NOW() 
       WHERE id = $2 
       RETURNING id, nama, email`,
      [newHash, id]
    );

    if (res.length === 0) {
      return NextResponse.json({ error: 'Pegawai tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Kata sandi untuk ${res[0].nama} berhasil direset ke sandi default: "${defaultPassword}"`,
      defaultPassword,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
