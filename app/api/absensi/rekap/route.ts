import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak: Hanya Admin yang dapat melihat rekapitulasi' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);

    // Ambil tanggal WITA saat ini
    const nowWita = new Date();
    const formatterWita = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Makassar',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const todayStrWita = formatterWita.format(nowWita); // YYYY-MM-DD
    const [currentYear, currentMonth, currentDay] = todayStrWita.split('-').map(Number);

    const bulan = parseInt(searchParams.get('bulan') || String(currentMonth));
    const tahun = parseInt(searchParams.get('tahun') || String(currentYear));
    const pegawaiId = searchParams.get('pegawai_id');

    // 1. Ambil daftar pegawai yang difilter
    let pegawaiSql = `
      SELECT id, nip, nama, jabatan, email, sisa_cuti_tahunan
      FROM pegawai
      WHERE role = 'pegawai' AND is_active = true
    `;
    const pegawaiParams: any[] = [];
    if (pegawaiId && pegawaiId !== 'all') {
      pegawaiParams.push(pegawaiId);
      pegawaiSql += ` AND id = $1`;
    }
    pegawaiSql += ` ORDER BY nama ASC`;
    const pegawaiList = await query(pegawaiSql, pegawaiParams);

    // 2. Ambil hari libur resmi pada bulan & tahun terpilih
    const holidayRows = await query(
      `SELECT tanggal, keterangan, tipe
       FROM hari_libur
       WHERE EXTRACT(MONTH FROM tanggal) = $1 AND EXTRACT(YEAR FROM tanggal) = $2`,
      [bulan, tahun]
    );

    const holidayMap = new Map<string, string>();
    holidayRows.forEach((h: any) => {
      const dStr = new Date(h.tanggal).toISOString().slice(0, 10);
      holidayMap.set(dStr, h.keterangan);
    });

    // 3. Ambil seluruh data absensi aktual bulan & tahun terpilih
    let absensiSql = `
      SELECT 
        a.id,
        a.pegawai_id,
        p.nip,
        p.nama,
        p.jabatan,
        a.waktu_absen,
        (a.waktu_absen AT TIME ZONE 'Asia/Makassar')::DATE AS tgl_absen_wita,
        TO_CHAR(a.waktu_absen AT TIME ZONE 'Asia/Makassar', 'HH24:MI:SS') AS jam_absen_wita,
        a.tipe_absen,
        a.status,
        a.waktu_terlambat,
        a.waktu_mendahului,
        a.jarak_dari_kantor,
        a.url_foto_cloudinary,
        a.device_id_used,
        a.catatan
      FROM absensi a
      JOIN pegawai p ON a.pegawai_id = p.id
      WHERE EXTRACT(MONTH FROM a.waktu_absen AT TIME ZONE 'Asia/Makassar') = $1
        AND EXTRACT(YEAR FROM a.waktu_absen AT TIME ZONE 'Asia/Makassar') = $2
    `;
    const absensiParams: any[] = [bulan, tahun];
    if (pegawaiId && pegawaiId !== 'all') {
      absensiParams.push(pegawaiId);
      absensiSql += ` AND a.pegawai_id = $${absensiParams.length}`;
    }
    absensiSql += ` ORDER BY a.waktu_absen DESC`;

    const rawAbsensiLogs = await query(absensiSql, absensiParams);

    // 4. Ambil seluruh pengajuan izin / cuti yang APPROVED
    let pengajuanSql = `
      SELECT pegawai_id, tipe_pengajuan, tanggal_mulai, tanggal_selesai, alasan
      FROM pengajuan
      WHERE status_approval = 'approved'
        AND (
          (EXTRACT(MONTH FROM tanggal_mulai) = $1 AND EXTRACT(YEAR FROM tanggal_mulai) = $2)
          OR (EXTRACT(MONTH FROM tanggal_selesai) = $1 AND EXTRACT(YEAR FROM tanggal_selesai) = $2)
        )
    `;
    const pengajuanParams: any[] = [bulan, tahun];
    if (pegawaiId && pegawaiId !== 'all') {
      pengajuanParams.push(pegawaiId);
      pengajuanSql += ` AND pegawai_id = $${pengajuanParams.length}`;
    }
    const approvedPengajuan = await query(pengajuanSql, pengajuanParams);

    // 5. Tentukan daftar Hari Kerja Efektif dalam Bulan Tersebut
    const daysInMonth = new Date(tahun, bulan, 0).getDate();
    const isCurrentMonthYear = bulan === currentMonth && tahun === currentYear;
    const isFutureMonthYear = tahun > currentYear || (tahun === currentYear && bulan > currentMonth);

    // Tentukan sampai tanggal berapa hari kerja dihitung
    let maxDayToEvaluate = daysInMonth;
    if (isCurrentMonthYear) {
      maxDayToEvaluate = currentDay; // Hanya sampai hari ini jika bulan berjalan
    } else if (isFutureMonthYear) {
      maxDayToEvaluate = 0; // Bulan masa depan belum ada hari kerja yang dievaluasi
    }

    // Bangun daftar hari kerja
    interface HariKerja {
      dateStr: string;
      dayNum: number;
      dayOfWeek: number;
    }
    const daftarHariKerja: HariKerja[] = [];

    for (let day = 1; day <= maxDayToEvaluate; day++) {
      const dateObj = new Date(tahun, bulan - 1, day);
      const dayOfWeek = dateObj.getDay(); // 0 = Minggu, 6 = Sabtu

      // Format YYYY-MM-DD
      const mm = String(bulan).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      const dateStr = `${tahun}-${mm}-${dd}`;

      // Lewati Sabtu & Minggu
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      // Lewati Hari Libur Nasional / Khusus
      if (holidayMap.has(dateStr)) continue;

      daftarHariKerja.push({
        dateStr,
        dayNum: day,
        dayOfWeek,
      });
    }

    // 6. Buat peta absensi per pegawai per tanggal
    // Key: `${pegawai_id}_${dateStr}_${tipe}` => log
    const absensiMap = new Map<string, any>();
    for (const log of rawAbsensiLogs) {
      const tglStr = new Date(log.tgl_absen_wita).toISOString().slice(0, 10);
      const key = `${log.pegawai_id}_${tglStr}_${log.tipe_absen}`;
      if (!absensiMap.has(key)) {
        absensiMap.set(key, log);
      }
    }

    // Helper cek apakah tanggal tercakup pengajuan approved
    const isCoveredByPengajuan = (pId: string, dateStr: string) => {
      return approvedPengajuan.find((p: any) => {
        if (p.pegawai_id !== pId) return false;
        const start = new Date(p.tanggal_mulai).toISOString().slice(0, 10);
        const end = new Date(p.tanggal_selesai).toISOString().slice(0, 10);
        return dateStr >= start && dateStr <= end;
      });
    };

    // 7. Hitung Rekapitulasi Per Pegawai & Bangun Log Pelanggaran Alpha
    const alphaLogs: any[] = [];
    const summaryPerPegawai = [];

    for (const p of pegawaiList) {
      let totalHadir = 0;
      let hadirTepatWaktu = 0;
      let totalTerlambat = 0;
      let totalMendahului = 0;
      let totalDinasLuar = 0;
      let totalCuti = 0;
      let totalSakit = 0;
      let totalAlphaMasuk = 0;
      let totalAlphaPulang = 0;
      let totalMenitTerlambat = 0;
      let totalMenitMendahului = 0;

      // Hitung dari log aktual
      for (const log of rawAbsensiLogs) {
        if (log.pegawai_id !== p.id) continue;
        if (log.tipe_absen === 'masuk') {
          if (log.status === 'cuti_tahunan' || log.status === 'cuti') {
            totalCuti++;
          } else if (log.status === 'cuti_sakit' || log.status === 'sakit') {
            totalSakit++;
          } else if (log.status === 'dinas_luar') {
            totalDinasLuar++;
          } else {
            totalHadir++;
            if (log.status === 'tepat_waktu') hadirTepatWaktu++;
          }
        }
        if (log.status === 'terlambat') {
          totalTerlambat++;
          totalMenitTerlambat += (log.waktu_terlambat || 0);
        }
        if (log.status === 'mendahului') {
          totalMendahului++;
          totalMenitMendahului += (log.waktu_mendahului || 0);
        }
      }

      // Evaluasi Hari Kerja untuk Alpha (Tidak absen masuk / keluar)
      for (const hk of daftarHariKerja) {
        const pengajuan = isCoveredByPengajuan(p.id, hk.dateStr);
        if (pengajuan) {
          // Pegawai ada izin / cuti resmi yang disetujui, tidak dikenakan alpha
          continue;
        }

        const masukKey = `${p.id}_${hk.dateStr}_masuk`;
        const pulangKey = `${p.id}_${hk.dateStr}_pulang`;

        const hasMasuk = absensiMap.has(masukKey);
        const hasPulang = absensiMap.has(pulangKey);

        // Jika tidak absen masuk pada hari kerja
        if (!hasMasuk) {
          totalAlphaMasuk++;
          totalMenitTerlambat += 200; // Penalti 200 menit

          alphaLogs.push({
            id: `alpha-masuk-${p.id}-${hk.dateStr}`,
            pegawai_id: p.id,
            nip: p.nip,
            nama: p.nama,
            jabatan: p.jabatan,
            waktu_absen: `${hk.dateStr}T07:30:00.000Z`,
            tgl_absen_wita: hk.dateStr,
            jam_absen_wita: '-',
            tipe_absen: 'masuk',
            status: 'terlambat',
            waktu_terlambat: 200,
            waktu_mendahului: 0,
            total_menit_pelanggaran: 200,
            denda_potongan_gaji: 200 * 500,
            jarak_dari_kantor: null,
            url_foto_cloudinary: null,
            device_id_used: 'Sistem Otomatis',
            catatan: 'Tidak Melakukan Presensi Masuk (Alpha: Dihitung Terlambat 200 Menit)',
            is_alpha: true,
          });
        }

        // Jika tidak absen keluar pada hari kerja
        if (!hasPulang) {
          totalAlphaPulang++;
          totalMenitMendahului += 200; // Penalti 200 menit

          alphaLogs.push({
            id: `alpha-pulang-${p.id}-${hk.dateStr}`,
            pegawai_id: p.id,
            nip: p.nip,
            nama: p.nama,
            jabatan: p.jabatan,
            waktu_absen: `${hk.dateStr}T15:30:00.000Z`,
            tgl_absen_wita: hk.dateStr,
            jam_absen_wita: '-',
            tipe_absen: 'pulang',
            status: 'mendahului',
            waktu_terlambat: 0,
            waktu_mendahului: 200,
            total_menit_pelanggaran: 200,
            denda_potongan_gaji: 200 * 500,
            jarak_dari_kantor: null,
            url_foto_cloudinary: null,
            device_id_used: 'Sistem Otomatis',
            catatan: 'Tidak Melakukan Presensi Pulang (Alpha: Dihitung Mendahului 200 Menit)',
            is_alpha: true,
          });
        }
      }

      const totalMenitPelanggaran = totalMenitTerlambat + totalMenitMendahului;
      const totalPotonganGajiRp = totalMenitPelanggaran * 500;

      summaryPerPegawai.push({
        id: p.id,
        nip: p.nip,
        nama: p.nama,
        jabatan: p.jabatan,
        sisa_cuti_tahunan: p.sisa_cuti_tahunan,
        total_hadir: totalHadir,
        hadir_tepat_waktu: hadirTepatWaktu,
        total_terlambat: totalTerlambat,
        total_mendahului: totalMendahului,
        total_dinas_luar: totalDinasLuar,
        total_cuti: totalCuti,
        total_sakit: totalSakit,
        total_alpha_masuk: totalAlphaMasuk,
        total_alpha_pulang: totalAlphaPulang,
        total_menit_keterlambatan: totalMenitTerlambat,
        total_menit_mendahului: totalMenitMendahului,
        total_menit_pelanggaran: totalMenitPelanggaran,
        total_potongan_gaji_rp: totalPotonganGajiRp,
      });
    }

    // 8. Gabungkan log aktual dengan log alpha (terurut dari yang terbaru)
    const combinedLogs = [
      ...rawAbsensiLogs.map((l: any) => ({
        ...l,
        total_menit_pelanggaran: (l.waktu_terlambat || 0) + (l.waktu_mendahului || 0),
        denda_potongan_gaji: ((l.waktu_terlambat || 0) + (l.waktu_mendahului || 0)) * 500,
        is_alpha: false,
      })),
      ...alphaLogs,
    ].sort((a, b) => new Date(b.waktu_absen).getTime() - new Date(a.waktu_absen).getTime());

    // 9. Hitung Total Statistik Ringkasan Periode Ini
    const stats = {
      total_log: combinedLogs.length,
      tepat_waktu: combinedLogs.filter((l: any) => l.status === 'tepat_waktu' && !l.is_alpha).length,
      terlambat: combinedLogs.filter((l: any) => l.status === 'terlambat' && !l.is_alpha).length,
      mendahului: combinedLogs.filter((l: any) => l.status === 'mendahului' && !l.is_alpha).length,
      dinas_luar: combinedLogs.filter((l: any) => l.status === 'dinas_luar').length,
      cuti: combinedLogs.filter((l: any) => l.status === 'cuti_tahunan' || l.status === 'cuti').length,
      sakit: combinedLogs.filter((l: any) => l.status === 'cuti_sakit' || l.status === 'sakit').length,
      total_alpha: alphaLogs.length,
      total_hari_kerja_efektif: daftarHariKerja.length,
      total_menit_terlambat: summaryPerPegawai.reduce((acc, p) => acc + p.total_menit_keterlambatan, 0),
      total_menit_mendahului: summaryPerPegawai.reduce((acc, p) => acc + p.total_menit_mendahului, 0),
      total_potongan_gaji_rp: summaryPerPegawai.reduce((acc, p) => acc + p.total_potongan_gaji_rp, 0),
    };

    return NextResponse.json({
      success: true,
      bulan,
      tahun,
      pegawai_id: pegawaiId || 'all',
      total_hari_kerja_efektif: daftarHariKerja.length,
      stats,
      summaryPerPegawai,
      logs: combinedLogs,
    });
  } catch (error: any) {
    console.error('Rekap error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
