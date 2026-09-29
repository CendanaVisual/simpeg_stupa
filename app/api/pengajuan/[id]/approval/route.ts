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

    // Jika pengajuan DISETUJUI (cuti tahunan, cuti sakit, dinas luar):
    // Sistem otomatis menginput langsung data absen masuk dan absen keluar sesuai rentang tanggal pengajuan
    if (status_approval === 'approved') {
      const parseDateOnly = (val: any) => {
        if (!val) return '';
        if (typeof val === 'string') return val.slice(0, 10);
        if (val instanceof Date) return val.toISOString().slice(0, 10);
        return String(val).slice(0, 10);
      };

      const startStr = parseDateOnly(pengajuan.tanggal_mulai);
      const endStr = parseDateOnly(pengajuan.tanggal_selesai);

      if (startStr && endStr) {
        const [sy, sm, sd] = startStr.split('-').map(Number);
        const [ey, em, ed] = endStr.split('-').map(Number);
        const curDate = new Date(Date.UTC(sy, sm - 1, sd));
        const endDate = new Date(Date.UTC(ey, em - 1, ed));

        let statusAbsen = 'tepat_waktu';
        let labelTipe = 'Pengajuan Disetujui';
        if (pengajuan.tipe_pengajuan === 'cuti_tahunan') {
          statusAbsen = 'cuti_tahunan';
          labelTipe = 'Cuti Tahunan';
        } else if (pengajuan.tipe_pengajuan === 'cuti_sakit') {
          statusAbsen = 'cuti_sakit';
          labelTipe = 'Cuti Sakit';
        } else if (pengajuan.tipe_pengajuan === 'dinas_luar') {
          statusAbsen = 'dinas_luar';
          labelTipe = 'Dinas Luar';
        }

        const catatanText = `${labelTipe} Disetujui Admin${pengajuan.alasan ? `: ${pengajuan.alasan}` : ''}`;
        const deviceIdText = 'Sistem Otomatis (Approval Admin)';

        while (curDate <= endDate) {
          const y = curDate.getUTCFullYear();
          const m = String(curDate.getUTCMonth() + 1).padStart(2, '0');
          const d = String(curDate.getUTCDate()).padStart(2, '0');
          const dateStr = `${y}-${m}-${d}`;
          const dayOfWeek = curDate.getUTCDay(); // 0 = Minggu, 6 = Sabtu

          // Hari kerja: Senin - Jumat (untuk dinas luar dapat mencakup hari lain jika dijadwalkan)
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const shouldProcess = pengajuan.tipe_pengajuan === 'dinas_luar' || !isWeekend;

          if (shouldProcess) {
            const waktuMasuk = `${dateStr}T07:30:00+08:00`;
            const waktuPulang = `${dateStr}T16:00:00+08:00`;

            // 1. Absen Masuk: Update jika sudah ada, atau buat record baru
            const existingMasuk = await query(
              `SELECT id FROM absensi 
               WHERE pegawai_id = $1 
                 AND tipe_absen = 'masuk' 
                 AND DATE(waktu_absen AT TIME ZONE 'Asia/Makassar') = $2::DATE`,
              [pengajuan.pegawai_id, dateStr]
            );

            if (existingMasuk.length > 0) {
              await query(
                `UPDATE absensi 
                 SET status = $1, waktu_terlambat = 0, waktu_mendahului = 0, catatan = $2, device_id_used = $3
                 WHERE id = $4`,
                [statusAbsen, catatanText, deviceIdText, existingMasuk[0].id]
              );
            } else {
              await query(
                `INSERT INTO absensi (
                  pegawai_id, waktu_absen, tipe_absen, status, waktu_terlambat, waktu_mendahului,
                  jarak_dari_kantor, device_id_used, catatan
                 ) VALUES ($1, $2, 'masuk', $3, 0, 0, 0, $4, $5)`,
                [pengajuan.pegawai_id, waktuMasuk, statusAbsen, deviceIdText, catatanText]
              );
            }

            // 2. Absen Pulang: Update jika sudah ada, atau buat record baru
            const existingPulang = await query(
              `SELECT id FROM absensi 
               WHERE pegawai_id = $1 
                 AND tipe_absen = 'pulang' 
                 AND DATE(waktu_absen AT TIME ZONE 'Asia/Makassar') = $2::DATE`,
              [pengajuan.pegawai_id, dateStr]
            );

            if (existingPulang.length > 0) {
              await query(
                `UPDATE absensi 
                 SET status = $1, waktu_terlambat = 0, waktu_mendahului = 0, catatan = $2, device_id_used = $3
                 WHERE id = $4`,
                [statusAbsen, catatanText, deviceIdText, existingPulang[0].id]
              );
            } else {
              await query(
                `INSERT INTO absensi (
                  pegawai_id, waktu_absen, tipe_absen, status, waktu_terlambat, waktu_mendahului,
                  jarak_dari_kantor, device_id_used, catatan
                 ) VALUES ($1, $2, 'pulang', $3, 0, 0, 0, $4, $5)`,
                [pengajuan.pegawai_id, waktuPulang, statusAbsen, deviceIdText, catatanText]
              );
            }
          }

          curDate.setUTCDate(curDate.getUTCDate() + 1);
        }
      }
    }

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

