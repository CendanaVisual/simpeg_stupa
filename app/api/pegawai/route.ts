import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest, hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: Ambil daftar seluruh pegawai (Admin Only)
export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const pegawaiList = await query(
      `SELECT id, nip, nama, email, username, role, jabatan, sisa_cuti_tahunan, is_active, created_at
       FROM pegawai 
       ORDER BY nama ASC`
    );

    return NextResponse.json({ pegawai: pegawaiList });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Tambah Pegawai Baru (Admin Only)
export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const { nip, nama, email, username, password, role, jabatan, sisa_cuti_tahunan } = await req.json();

    if (!nama || !email) {
      return NextResponse.json({ error: 'Nama dan Email wajib diisi' }, { status: 400 });
    }

    // Default password jika tidak diisi admin: 'stupa123'
    const defaultPassword = password || 'stupa123';
    const passwordHash = await hashPassword(defaultPassword);

    const result = await query(
      `INSERT INTO pegawai (nip, nama, email, username, password_hash, role, jabatan, sisa_cuti_tahunan)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, nip, nama, email, username, role, jabatan, sisa_cuti_tahunan, is_active, created_at`,
      [
        nip || null,
        nama.trim(),
        email.trim().toLowerCase(),
        username ? username.trim().toLowerCase() : email.split('@')[0],
        passwordHash,
        role || 'pegawai',
        jabatan || 'Staff',
        sisa_cuti_tahunan != null ? parseInt(sisa_cuti_tahunan) : 12,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Pegawai berhasil ditambahkan!',
      pegawai: result[0],
    });
  } catch (error: any) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Email, NIP, atau Username sudah terdaftar' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
