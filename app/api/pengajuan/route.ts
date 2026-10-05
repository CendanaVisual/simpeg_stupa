import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

// GET: Daftar pengajuan
export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Sesi tidak valid' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // 'pending', 'approved', 'rejected'

    let sql = `
      SELECT 
        p.id,
        p.pegawai_id,
        peg.nip,
        peg.nama AS nama_pegawai,
        peg.jabatan,
        peg.sisa_cuti_tahunan,
        p.tipe_pengajuan,
        p.tanggal_mulai,
        p.tanggal_selesai,
        p.jumlah_hari_kerja,
        p.alasan,
        p.url_dokumen_pendukung_cloudinary,
        p.tipe_absen_req,
        p.waktu_presensi_req,
        p.status_presensi_req,
        p.jarak_meter_req,
        p.url_foto_selfie,
        p.status_approval,
        p.approved_by,
        p.catatan_admin,
        p.created_at,
        p.updated_at
      FROM pengajuan p
      JOIN pegawai peg ON p.pegawai_id = peg.id
    `;

    const params: any[] = [];

    // Jika pegawai biasa, hanya boleh lihat milik sendiri
    if (session.role === 'pegawai') {
      params.push(session.id);
      sql += ` WHERE p.pegawai_id = $${params.length}`;
      if (status) {
        params.push(status);
        sql += ` AND p.status_approval = $${params.length}`;
      }
    } else {
      // Jika Admin, bisa lihat semua dan filter status
      if (status) {
        params.push(status);
        sql += ` WHERE p.status_approval = $${params.length}`;
      }
    }

    sql += ` ORDER BY p.created_at DESC`;

    const pengajuanList = await query(sql, params);

    // Hitung kuota lupa absen bulan ini untuk pegawai (Maks 3 kali per bulan)
    let kuotaLupaAbsen = null;
    if (session.role === 'pegawai') {
      const now = new Date();
      const curM = now.getMonth() + 1;
      const curY = now.getFullYear();
      const countRes = await query(
        `SELECT COUNT(*) AS total_lupa
         FROM pengajuan
         WHERE pegawai_id = $1 
           AND tipe_pengajuan = 'lupa_absen' 
           AND status_approval != 'rejected'
           AND EXTRACT(MONTH FROM tanggal_mulai) = $2
           AND EXTRACT(YEAR FROM tanggal_mulai) = $3`,
        [session.id, curM, curY]
      );
      const terpakai = parseInt(countRes[0]?.total_lupa || 0);
      kuotaLupaAbsen = {
        bulan: curM,
        tahun: curY,
        terpakai,
        sisa: Math.max(0, 3 - terpakai),
        maksimal: 3,
      };
    }

    return NextResponse.json({ pengajuan: pengajuanList, kuota_lupa_absen: kuotaLupaAbsen });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Pengajuan Cuti / Dinas Luar
export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 401 });
    }

    const {
      tipe_pengajuan, // 'cuti_tahunan', 'cuti_sakit', 'dinas_luar', 'lupa_absen'
      tanggal_mulai,
      tanggal_selesai,
      alasan,
      dokumen_base64,
      tipe_absen_req,
      waktu_presensi_req,
      foto_selfie_base64,
    } = await req.json();

    // Khusus Penanganan Pengajuan Lupa Absen
    if (tipe_pengajuan === 'lupa_absen') {
      const tglPengajuan = tanggal_mulai || tanggal_selesai;
      if (!tglPengajuan) {
        return NextResponse.json({ error: 'Tanggal presensi wajib dipilih' }, { status: 400 });
      }

      const selfieData = foto_selfie_base64 || dokumen_base64;
      if (!selfieData) {
        return NextResponse.json(
          { error: 'Foto selfie wajib diambil untuk verifikasi pengajuan lupa absen' },
          { status: 400 }
        );
      }

      // Validasi kuota maksimal 3 kali per bulan (sisa kuota bulan sebelumnya otomatis hangus)
      const targetDate = new Date(tglPengajuan);
      const targetMonth = targetDate.getMonth() + 1;
      const targetYear = targetDate.getFullYear();

      const countRes = await query(
        `SELECT COUNT(*) AS total_lupa
         FROM pengajuan
         WHERE pegawai_id = $1
           AND tipe_pengajuan = 'lupa_absen'
           AND status_approval != 'rejected'
           AND EXTRACT(MONTH FROM tanggal_mulai) = $2
           AND EXTRACT(YEAR FROM tanggal_mulai) = $3`,
        [session.id, targetMonth, targetYear]
      );

      const totalLupa = parseInt(countRes[0]?.total_lupa || 0);
      if (totalLupa >= 3) {
        return NextResponse.json(
          {
            error: `Batas pengajuan lupa absen untuk bulan ${targetMonth}/${targetYear} telah mencapai batas maksimal (3 kali). Sisa kuota bulan sebelumnya otomatis hangus.`,
          },
          { status: 400 }
        );
      }

      // Upload Foto Selfie ke Cloudinary
      const urlFotoSelfie = await uploadToCloudinary(
        selfieData,
        `sipeg_stupa/lupa_absen/${session.nip || session.id}`
      );

      const tipeAbsen = tipe_absen_req === 'pulang' ? 'pulang' : 'masuk';
      let waktuReq = waktu_presensi_req;
      if (!waktuReq) {
        waktuReq = tipeAbsen === 'pulang' ? '16:00:00' : '07:30:00';
      } else if (waktuReq.length === 5) {
        waktuReq += ':00';
      }

      const insertRes = await query(
        `INSERT INTO pengajuan (
          pegawai_id,
          tipe_pengajuan,
          tanggal_mulai,
          tanggal_selesai,
          jumlah_hari_kerja,
          alasan,
          tipe_absen_req,
          waktu_presensi_req,
          status_presensi_req,
          jarak_meter_req,
          url_foto_selfie,
          url_dokumen_pendukung_cloudinary,
          status_approval
        ) VALUES ($1, 'lupa_absen', $2, $2, 1, $3, $4, $5, 'tepat_waktu', 100, $6, $6, 'pending')
        RETURNING *`,
        [
          session.id,
          tglPengajuan,
          alasan || 'Pengajuan Lupa Absen',
          tipeAbsen,
          waktuReq,
          urlFotoSelfie,
        ]
      );

      return NextResponse.json({
        success: true,
        message: 'Pengajuan Lupa Absen berhasil dikirim dan menunggu verifikasi Admin.',
        pengajuan: insertRes[0],
      });
    }

    if (!tipe_pengajuan || !tanggal_mulai || !tanggal_selesai || !alasan) {
      return NextResponse.json(
        { error: 'Tipe pengajuan, tanggal mulai, tanggal selesai, dan alasan wajib diisi' },
        { status: 400 }
      );
    }

    const tglMulai = new Date(tanggal_mulai);
    const tglSelesai = new Date(tanggal_selesai);

    if (tglSelesai < tglMulai) {
      return NextResponse.json(
        { error: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai' },
        { status: 400 }
      );
    }

    // Validasi dokumen pendukung:
    // Cuti Sakit WAJIB upload surat dokter
    // Dinas Luar WAJIB upload surat tugas/kegiatan
    if ((tipe_pengajuan === 'cuti_sakit' || tipe_pengajuan === 'dinas_luar') && !dokumen_base64) {
      return NextResponse.json(
        { error: `Dokumen pendukung (surat dokter/surat tugas) wajib dilampirkan untuk pengajuan ${tipe_pengajuan.replace('_', ' ')}` },
        { status: 400 }
      );
    }

    // Hitung hari kerja (eksklusi Sabtu & Minggu) via database function
    const hariRes = await query(
      `SELECT hitung_hari_kerja($1::date, $2::date) AS hari_kerja`,
      [tanggal_mulai, tanggal_selesai]
    );

    const hariKerja = parseInt(hariRes[0]?.hari_kerja || 0);

    if (hariKerja === 0) {
      return NextResponse.json(
        { error: 'Rentang tanggal yang Anda pilih hanya mencakup hari libur (Sabtu/Minggu)' },
        { status: 400 }
      );
    }

    // Khusus Cuti Tahunan: Cek sisa kuota cuti tahunan
    if (tipe_pengajuan === 'cuti_tahunan') {
      const userRes = await query('SELECT sisa_cuti_tahunan FROM pegawai WHERE id = $1', [session.id]);
      const sisaCuti = userRes[0]?.sisa_cuti_tahunan ?? 0;

      if (sisaCuti < hariKerja) {
        return NextResponse.json(
          {
            error: `Sisa kuota cuti tahunan Anda tidak mencukupi. Anda memiliki ${sisaCuti} hari, namun pengajuan ini memerlukan ${hariKerja} hari kerja.`,
            sisa_cuti: sisaCuti,
            hari_kerja_dibutuhkan: hariKerja,
          },
          { status: 400 }
        );
      }
    }

    // Upload dokumen ke Cloudinary jika dilampirkan
    let urlDokumenCloudinary = null;
    if (dokumen_base64) {
      urlDokumenCloudinary = await uploadToCloudinary(
        dokumen_base64,
        `sipeg_stupa/dokumen/${session.nip || session.id}`
      );
    }

    // Simpan ke database
    const insertRes = await query(
      `INSERT INTO pengajuan (
        pegawai_id,
        tipe_pengajuan,
        tanggal_mulai,
        tanggal_selesai,
        jumlah_hari_kerja,
        alasan,
        url_dokumen_pendukung_cloudinary,
        status_approval
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING *`,
      [
        session.id,
        tipe_pengajuan,
        tanggal_mulai,
        tanggal_selesai,
        hariKerja,
        alasan,
        urlDokumenCloudinary,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Pengajuan berhasil dikirim dan menunggu verifikasi Admin.',
      pengajuan: insertRes[0],
    });
  } catch (error: any) {
    console.error('Pengajuan error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
