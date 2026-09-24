import { NextRequest, NextResponse } from 'next/server';
import { withTransaction, query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { calculateHaversineDistance } from '@/lib/haversine';
import { uploadToCloudinary } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

// GET: Ambil status absensi hari ini atau riwayat presensi pegawai (dengan filter bulan & tahun)
export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Sesi berakhir, silakan login ulang' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const todayOnly = searchParams.get('today') === 'true';
    const bulan = searchParams.get('bulan');
    const tahun = searchParams.get('tahun');

    if (todayOnly) {
      const todayAbsensi = await query(
        `SELECT id, tipe_absen, waktu_absen, status, waktu_terlambat, waktu_mendahului, 
                jarak_dari_kantor, url_foto_cloudinary, catatan
         FROM absensi
         WHERE pegawai_id = $1 
           AND DATE(waktu_absen AT TIME ZONE 'Asia/Makassar') = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Makassar')::DATE
         ORDER BY waktu_absen ASC`,
        [session.id]
      );

      const masuk = todayAbsensi.find((a: any) => a.tipe_absen === 'masuk') || null;
      const pulang = todayAbsensi.find((a: any) => a.tipe_absen === 'pulang') || null;

      return NextResponse.json({ masuk, pulang, list: todayAbsensi });
    }

    // Riwayat dengan filter bulan dan tahun (Januari-Desember, 2025-2050)
    let sql = `
      SELECT id, tipe_absen, waktu_absen, status, waktu_terlambat, waktu_mendahului, 
             jarak_dari_kantor, url_foto_cloudinary, catatan
      FROM absensi
      WHERE pegawai_id = $1
    `;
    const params: any[] = [session.id];

    if (bulan && tahun) {
      params.push(parseInt(bulan), parseInt(tahun));
      sql += ` AND EXTRACT(MONTH FROM waktu_absen AT TIME ZONE 'Asia/Makassar') = $2 AND EXTRACT(YEAR FROM waktu_absen AT TIME ZONE 'Asia/Makassar') = $3`;
    }

    sql += ` ORDER BY waktu_absen DESC`;

    if (!bulan && !tahun) {
      sql += ` LIMIT 50`;
    }

    const history = await query(sql, params);
    return NextResponse.json({ history });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Controller Proses Absensi (Masuk & Pulang)
export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json(
        { error: 'Akses tidak sah: Silakan login terlebih dahulu' },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Menerima baik tipe_absen maupun tipe, dan foto_base64 maupun image_base64 untuk toleransi payload
    const tipe_absen = (body.tipe_absen || body.tipe || '').toLowerCase().trim();
    const foto_base64 = body.foto_base64 || body.image_base64 || body.foto;
    const {
      latitude,
      longitude,
      device_id_used,
      catatan,
    } = body;

    if (!tipe_absen || !['masuk', 'pulang'].includes(tipe_absen)) {
      return NextResponse.json(
        { error: 'Tipe absen harus "masuk" atau "pulang"' },
        { status: 400 }
      );
    }

    if (!foto_base64) {
      return NextResponse.json(
        { error: 'Foto selfie wajah wajib disertakan saat melakukan presensi' },
        { status: 400 }
      );
    }

    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);

    if (isNaN(userLat) || isNaN(userLon)) {
      return NextResponse.json(
        { error: 'Koordinat GPS perangkat tidak valid. Pastikan GPS/Lokasi browser telah diizinkan.' },
        { status: 400 }
      );
    }

    // 2. Ambil data konfigurasi kantor aktif
    const kantorRows = await query(
      `SELECT id, nama, latitude, longitude, radius_meter, 
              jam_masuk_mulai, jam_masuk_akhir,
              jam_pulang_senin_kamis_mulai, jam_pulang_jumat_mulai, jam_pulang_akhir,
              jam_masuk, jam_pulang 
       FROM kantor 
       ORDER BY created_at ASC 
       LIMIT 1`
    );

    if (kantorRows.length === 0) {
      return NextResponse.json(
        { error: 'Konfigurasi kantor belum tersedia di sistem. Hubungi Admin.' },
        { status: 500 }
      );
    }

    const kantor = kantorRows[0];
    const officeLat = parseFloat(kantor.latitude);
    const officeLon = parseFloat(kantor.longitude);
    const maxRadius = parseInt(kantor.radius_meter) || 100;

    // 3. Cek apakah pegawai memiliki pengajuan DINAS LUAR yang telah DISETUJUI untuk hari ini
    const dinasCheck = await query(
      `SELECT id FROM pengajuan
       WHERE pegawai_id = $1 
         AND tipe_pengajuan = 'dinas_luar'
         AND status_approval = 'approved'
         AND (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Makassar')::DATE BETWEEN tanggal_mulai AND tanggal_selesai
       LIMIT 1`,
      [session.id]
    );

    const isDinasLuar = dinasCheck.length > 0;

    // 4. Perhitungan Jarak Rumus Haversine & Validasi Radius Geofencing
    const distanceMeter = calculateHaversineDistance(userLat, userLon, officeLat, officeLon);

    if (!isDinasLuar) {
      if (distanceMeter > maxRadius) {
        return NextResponse.json(
          {
            error: `Presensi Ditolak! Anda berada di luar radius kantor (${distanceMeter} meter dari ${kantor.nama}). Batas maksimal radius adalah ${maxRadius} meter.`,
            jarak_meter: distanceMeter,
            radius_maksimal: maxRadius,
          },
          { status: 400 }
        );
      }
    }

    // 5. Cek duplikasi absensi hari ini (berdasarkan tanggal WITA)
    const existingToday = await query(
      `SELECT id FROM absensi
       WHERE pegawai_id = $1 
         AND tipe_absen = $2 
         AND DATE(waktu_absen AT TIME ZONE 'Asia/Makassar') = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Makassar')::DATE
       LIMIT 1`,
      [session.id, tipe_absen]
    );

    if (existingToday.length > 0) {
      return NextResponse.json(
        { error: `Anda sudah melakukan absen ${tipe_absen} untuk hari ini!` },
        { status: 409 }
      );
    }

    // 6. Hitung Keterlambatan atau Mendahului sesuai Aturan Jam Kerja Kantor (Zona Waktu WITA)
    const now = new Date();
    const witaParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Makassar',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'short',
    }).formatToParts(now);

    const parts: { [key: string]: string } = {};
    witaParts.forEach((p) => { parts[p.type] = p.value; });
    const currentHours = parseInt(parts.hour, 10);
    const currentMinutes = parseInt(parts.minute, 10);
    const currentTimeInMinutes = currentHours * 60 + currentMinutes;

    const witaDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Makassar' }));
    const dayOfWeek = witaDate.getDay(); // 0 = Minggu, 1 = Senin, ... 5 = Jumat, 6 = Sabtu

    // Konfigurasi Jam Kerja dari Database:
    // a. jam mulai absen masuk mulai = 06.30
    // b. jam absen masuk akhir = 07.30
    // c. jam absen pulang senin-kamis mulai = 15.30
    // d. jam absen pulang hari jumat mulai = 13.00
    // e. jam absen pulang akhir = 18.00 (diatas jam itu tidak bisa absen)
    const [masukMulaiH, masukMulaiM] = (kantor.jam_masuk_mulai || '06:30:00').split(':').map(Number);
    const masukMulaiMinutes = masukMulaiH * 60 + masukMulaiM;

    const [masukAkhirH, masukAkhirM] = (kantor.jam_masuk_akhir || kantor.jam_masuk || '07:30:00').split(':').map(Number);
    const masukAkhirMinutes = masukAkhirH * 60 + masukAkhirM;

    const [pulangSKH, pulangSKM] = (kantor.jam_pulang_senin_kamis_mulai || '15:30:00').split(':').map(Number);
    const pulangSKMinutes = pulangSKH * 60 + pulangSKM;

    const [pulangJumatH, pulangJumatM] = (kantor.jam_pulang_jumat_mulai || '13:00:00').split(':').map(Number);
    const pulangJumatMinutes = pulangJumatH * 60 + pulangJumatM;

    const [pulangAkhirH, pulangAkhirM] = (kantor.jam_pulang_akhir || '18:00:00').split(':').map(Number);
    const pulangAkhirMinutes = pulangAkhirH * 60 + pulangAkhirM;

    let statusPresensi = 'tepat_waktu';
    let waktuTerlambat = 0; // menit
    let waktuMendahului = 0; // menit

    if (isDinasLuar) {
      statusPresensi = 'dinas_luar';
    } else if (tipe_absen === 'masuk') {
      // Validasi waktu buka absen masuk
      if (currentTimeInMinutes < masukMulaiMinutes) {
        return NextResponse.json(
          {
            error: `Presensi masuk belum dibuka! Waktu mulai presensi masuk adalah pukul ${kantor.jam_masuk_mulai.substring(0, 5)} WITA.`,
          },
          { status: 400 }
        );
      }

      // Validasi keterlambatan setelah jam_masuk_akhir (07:30)
      if (currentTimeInMinutes > masukAkhirMinutes) {
        statusPresensi = 'terlambat';
        waktuTerlambat = currentTimeInMinutes - masukAkhirMinutes;
      } else {
        statusPresensi = 'tepat_waktu';
      }
    } else if (tipe_absen === 'pulang') {
      // Validasi batas akhir absen pulang (18:00) - diatas jam itu tidak bisa absen
      if (currentTimeInMinutes > pulangAkhirMinutes) {
        return NextResponse.json(
          {
            error: `Batas waktu presensi pulang telah berakhir pada pukul ${kantor.jam_pulang_akhir.substring(0, 5)} WITA. Anda tidak dapat melakukan presensi pulang di atas jam tersebut.`,
          },
          { status: 400 }
        );
      }

      // Tentukan jadwal mulai pulang berdasarkan hari kerja:
      // Hari Jumat (dayOfWeek === 5) mulai 13:00; Senin-Kamis mulai 15:30
      const isHariJumat = dayOfWeek === 5;
      const jadwalMulaiPulangMinutes = isHariJumat ? pulangJumatMinutes : pulangSKMinutes;

      if (currentTimeInMinutes < jadwalMulaiPulangMinutes) {
        statusPresensi = 'mendahului';
        waktuMendahului = jadwalMulaiPulangMinutes - currentTimeInMinutes;
      } else {
        statusPresensi = 'tepat_waktu';
      }
    }

    // 7. Upload Foto Selfie Wajah ke Cloudinary
    let urlFotoCloudinary = '';
    try {
      urlFotoCloudinary = await uploadToCloudinary(
        foto_base64,
        `sipeg_stupa/absensi/${now.getFullYear()}/${session.nip || session.id}`
      );
    } catch (uploadErr: any) {
      return NextResponse.json(
        { error: 'Gagal mengunggah foto selfie ke Cloudinary: ' + uploadErr.message },
        { status: 500 }
      );
    }

    // 8. Simpan ke Neon Database Menggunakan Transaksi Atomik (BEGIN ... COMMIT)
    const result = await withTransaction(async (client) => {
      const insertSql = `
        INSERT INTO absensi (
          pegawai_id,
          waktu_absen,
          tipe_absen,
          status,
          waktu_terlambat,
          waktu_mendahului,
          latitude,
          longitude,
          jarak_dari_kantor,
          url_foto_cloudinary,
          device_id_used,
          catatan
        ) VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, waktu_absen, tipe_absen, status, waktu_terlambat, waktu_mendahului, jarak_dari_kantor, url_foto_cloudinary;
      `;

      const res = await client.query(insertSql, [
        session.id,
        tipe_absen,
        statusPresensi,
        waktuTerlambat,
        waktuMendahului,
        userLat,
        userLon,
        distanceMeter,
        urlFotoCloudinary,
        device_id_used || 'Web-Browser',
        catatan || (isDinasLuar ? 'Presensi Dinas Luar Kota' : null),
      ]);

      return res.rows[0];
    });

    return NextResponse.json({
      success: true,
      message: `Presensi ${tipe_absen} berhasil dicatat! Status: ${statusPresensi.replace('_', ' ').toUpperCase()}`,
      data: result,
      jarak_dari_kantor: distanceMeter,
    });
  } catch (error: any) {
    console.error('Absensi process error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat memproses presensi: ' + error.message },
      { status: 500 }
    );
  }
}
