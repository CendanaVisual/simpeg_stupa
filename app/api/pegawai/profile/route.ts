import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest, verifyPassword, hashPassword } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

// GET: Ambil data profil lengkap pegawai saat ini
export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Sesi berakhir, silakan login ulang' }, { status: 401 });
    }

    const rows = await query(
      `SELECT id, nip, nama, email, username, role, jabatan, sisa_cuti_tahunan, 
              no_hp, alamat, foto_profil_url, is_active, created_at
       FROM pegawai
       WHERE id = $1
       LIMIT 1`,
      [session.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Pegawai tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ profile: rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Perbarui data diri, foto profil, dan kata sandi pegawai
export async function PUT(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Sesi berakhir, silakan login ulang' }, { status: 401 });
    }

    const body = await req.json();
    const foto_profil_base64 = body.foto_profil_base64 || body.foto_base64 || body.image_base64;
    const {
      nama,
      no_hp,
      alamat,
      current_password,
      new_password,
    } = body;

    // Ambil data pegawai saat ini
    const userRows = await query('SELECT * FROM pegawai WHERE id = $1 LIMIT 1', [session.id]);
    if (userRows.length === 0) {
      return NextResponse.json({ error: 'Data pegawai tidak ditemukan' }, { status: 404 });
    }
    const currentUser = userRows[0];

    // 1. Upload Foto Profil ke Cloudinary jika ada file baru yang diunggah
    let fotoUrl = currentUser.foto_profil_url;
    if (foto_profil_base64 && foto_profil_base64.startsWith('data:image')) {
      try {
        fotoUrl = await uploadToCloudinary(
          foto_profil_base64,
          `sipeg_stupa/profil/${session.nip || session.id}`
        );
      } catch (uploadErr: any) {
        return NextResponse.json(
          { error: 'Gagal mengunggah foto profil ke Cloudinary: ' + uploadErr.message },
          { status: 500 }
        );
      }
    }

    // 2. Logika Ubah Kata Sandi (Jika diisi)
    let newHash = currentUser.password_hash;
    if (new_password) {
      if (!current_password) {
        return NextResponse.json(
          { error: 'Kata sandi saat ini (lama) wajib dimasukkan untuk verifikasi penggantian kata sandi' },
          { status: 400 }
        );
      }

      const isCurrentValid = await verifyPassword(current_password, currentUser.password_hash);
      if (!isCurrentValid) {
        return NextResponse.json(
          { error: 'Kata sandi lama yang Anda masukkan tidak sesuai' },
          { status: 400 }
        );
      }

      if (new_password.length < 6) {
        return NextResponse.json(
          { error: 'Kata sandi baru minimal harus terdiri dari 6 karakter' },
          { status: 400 }
        );
      }

      newHash = await hashPassword(new_password);
    }

    // 3. Simpan pembaruan ke database
    const updated = await query(
      `UPDATE pegawai
       SET nama = COALESCE($1, nama),
           no_hp = $2,
           alamat = $3,
           foto_profil_url = $4,
           password_hash = $5,
           updated_at = NOW()
       WHERE id = $6
       RETURNING id, nip, nama, email, username, role, jabatan, sisa_cuti_tahunan, no_hp, alamat, foto_profil_url`,
      [
        nama?.trim() || currentUser.nama,
        no_hp || null,
        alamat || null,
        fotoUrl || null,
        newHash,
        session.id,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Profil dan data diri Anda berhasil diperbarui!',
      profile: updated[0],
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
