import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Email/Username/NIP dan Kata Sandi wajib diisi!' },
        { status: 400 }
      );
    }

    // Cari pegawai berdasarkan email, username, atau NIP
    const users = await query(
      `SELECT id, nip, nama, email, username, password_hash, role, jabatan, sisa_cuti_tahunan, is_active
       FROM pegawai 
       WHERE (email = $1 OR username = $1 OR nip = $1)
       LIMIT 1`,
      [identifier.trim().toLowerCase()]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Akun tidak ditemukan. Periksa kembali NIP, Email, atau Username Anda.' },
        { status: 401 }
      );
    }

    const user = users[0];

    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Akun Anda dinonaktifkan. Silakan hubungi Administrator STUPA.' },
        { status: 403 }
      );
    }

    // Verifikasi password
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Kata sandi salah. Silakan coba lagi atau minta reset ke Admin.' },
        { status: 401 }
      );
    }

    // Buat token JWT
    const token = generateToken({
      id: user.id,
      nip: user.nip || '',
      nama: user.nama,
      email: user.email,
      role: user.role,
      jabatan: user.jabatan,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil!',
      user: {
        id: user.id,
        nip: user.nip,
        nama: user.nama,
        email: user.email,
        role: user.role,
        jabatan: user.jabatan,
        sisa_cuti_tahunan: user.sisa_cuti_tahunan,
      },
      token,
    });

    // Simpan token ke HTTP-only cookie untuk keamanan
    response.cookies.set({
      name: 'sipeg_token',
      value: token,
      httpOnly: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 hari
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat login: ' + error.message },
      { status: 500 }
    );
  }
}
