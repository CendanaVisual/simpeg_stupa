import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// DELETE: Hapus hari libur berdasarkan ID (Admin Only)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak: Hanya Admin yang dapat menghapus hari libur' }, { status: 403 });
    }

    const { id } = params;
    await query('DELETE FROM hari_libur WHERE id = $1', [id]);

    return NextResponse.json({ success: true, message: 'Hari libur berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting holiday:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
