import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Sesi tidak valid atau telah berakhir' }, { status: 401 });
    }

    const users = await query(
      `SELECT id, nip, nama, email, username, role, jabatan, sisa_cuti_tahunan, is_active
       FROM pegawai 
       WHERE id = $1 LIMIT 1`,
      [session.id]
    );

    if (users.length === 0) {
      return NextResponse.json({ error: 'Pegawai tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ user: users[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
