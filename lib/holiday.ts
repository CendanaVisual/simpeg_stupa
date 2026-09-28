import { query } from '@/lib/db';

/**
 * Helper mengecek apakah suatu tanggal adalah hari libur (Sabtu/Minggu atau terdaftar di DB)
 */
export async function checkIsHoliday(dateStr?: string) {
  let targetDate: Date;
  let dateOnlyStr: string;

  if (dateStr) {
    targetDate = new Date(dateStr);
    dateOnlyStr = dateStr.slice(0, 10);
  } else {
    // Gunakan WITA (Asia/Makassar)
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Makassar',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    dateOnlyStr = formatter.format(now); // Format YYYY-MM-DD
    targetDate = new Date(dateOnlyStr + 'T12:00:00Z');
  }

  const dayOfWeek = targetDate.getUTCDay(); // 0 = Minggu, 6 = Sabtu
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Cek ke tabel hari_libur di DB
  const holidayRows = await query(
    `SELECT id, tanggal, keterangan, tipe 
     FROM hari_libur 
     WHERE tanggal = $1 
     LIMIT 1`,
    [dateOnlyStr]
  );

  const hasDbHoliday = holidayRows.length > 0;
  const dbHoliday = hasDbHoliday ? holidayRows[0] : null;

  const isHoliday = isWeekend || hasDbHoliday;
  let keterangan = '';

  if (hasDbHoliday) {
    keterangan = dbHoliday.keterangan;
  } else if (dayOfWeek === 0) {
    keterangan = 'Hari Libur Akhir Pekan (Minggu)';
  } else if (dayOfWeek === 6) {
    keterangan = 'Hari Libur Akhir Pekan (Sabtu)';
  }

  return {
    is_holiday: isHoliday,
    is_weekend: isWeekend,
    is_db_holiday: hasDbHoliday,
    date: dateOnlyStr,
    keterangan: keterangan || 'Hari Kerja Aktif',
    tipe: dbHoliday ? dbHoliday.tipe : isWeekend ? 'weekend' : 'kerja',
    holiday_detail: dbHoliday,
  };
}
