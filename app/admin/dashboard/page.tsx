'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Building,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  FileText,
  Settings,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  KeyRound,
  Trash2,
  Edit,
  Download,
  Printer,
  Shield,
  MapPin,
  AlertCircle,
  Coins,
  Sun,
  Moon
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'approval' | 'pegawai' | 'hari_libur' | 'kantor' | 'rekap'>('approval');
  const [darkMode, setDarkMode] = useState(false);

  // Pending Approvals State
  const [pengajuanList, setPengajuanList] = useState<any[]>([]);
  const [approvalActionLoading, setApprovalActionLoading] = useState<string | null>(null);
  const [approvalNote, setApprovalNote] = useState<{ [id: string]: string }>({});
  const [approvalMsg, setApprovalMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Pegawai Management State
  const [pegawaiList, setPegawaiList] = useState<any[]>([]);
  const [searchPegawai, setSearchPegawai] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPegawai, setEditingPegawai] = useState<any>(null);
  const [pegawaiForm, setPegawaiForm] = useState({
    nip: '',
    nama: '',
    email: '',
    username: '',
    role: 'pegawai',
    jabatan: 'Staff',
    sisa_cuti_tahunan: 12,
  });
  const [pegawaiActionMsg, setPegawaiActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Hari Libur State (Point 1 - Submenu Input Hari Libur)
  const [holidaysList, setHolidaysList] = useState<any[]>([]);
  const [loadingHolidays, setLoadingHolidays] = useState(false);
  const [filterTahunLibur, setFilterTahunLibur] = useState(new Date().getFullYear());
  const [todayHolidayInfo, setTodayHolidayInfo] = useState<any>(null);
  const [holidayForm, setHolidayForm] = useState({
    tanggal: '',
    keterangan: '',
    tipe: 'nasional' as 'nasional' | 'khusus',
  });
  const [savingHoliday, setSavingHoliday] = useState(false);
  const [syncingHolidays, setSyncingHolidays] = useState(false);
  const [holidayMsg, setHolidayMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Kantor Configuration State (dengan 5 aturan jam kerja spesifik)
  const [kantorData, setKantorData] = useState({
    nama: 'Kantor Pusat STUPA',
    latitude: -8.6811234,
    longitude: 115.2145678,
    radius_meter: 100,
    jam_masuk_mulai: '06:30:00',
    jam_masuk_akhir: '07:30:00',
    jam_pulang_senin_kamis_mulai: '15:30:00',
    jam_pulang_jumat_mulai: '13:00:00',
    jam_pulang_akhir: '18:00:00',
  });
  const [savingKantor, setSavingKantor] = useState(false);
  const [kantorMsg, setKantorMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Rekapitulasi State
  const [filterBulan, setFilterBulan] = useState(new Date().getMonth() + 1);
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear());
  const [filterPegawaiId, setFilterPegawaiId] = useState('all');
  const [rekapData, setRekapData] = useState<any>(null);
  const [loadingRekap, setLoadingRekap] = useState(false);

  // Load Theme Preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('sipeg_theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
    } else {
      setDarkMode(false);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    localStorage.setItem('sipeg_theme', newTheme ? 'dark' : 'light');
  };

  // Load Admin User
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then((data) => {
        if (data.user.role !== 'admin') {
          router.push('/pegawai/dashboard');
          return;
        }
        setAdminUser(data.user);
      })
      .catch(() => router.push('/login'));
  }, [router]);

  // Load Initial Data
  const loadApprovals = () => {
    fetch('/api/pengajuan')
      .then((res) => res.json())
      .then((data) => {
        if (data.pengajuan) setPengajuanList(data.pengajuan);
      })
      .catch(console.error);
  };

  const loadPegawai = () => {
    fetch('/api/pegawai')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.pegawai) setPegawaiList(data.pegawai);
      })
      .catch((err) => {
        console.error('Error loading pegawai:', err);
      });
  };

  const loadKantor = () => {
    fetch('/api/kantor')
      .then((res) => res.json())
      .then((data) => {
        if (data.kantor) {
          setKantorData({
            nama: data.kantor.nama || 'Kantor Pusat STUPA',
            latitude: parseFloat(data.kantor.latitude) || -8.6811234,
            longitude: parseFloat(data.kantor.longitude) || 115.2145678,
            radius_meter: data.kantor.radius_meter || 100,
            jam_masuk_mulai: data.kantor.jam_masuk_mulai || '06:30:00',
            jam_masuk_akhir: data.kantor.jam_masuk_akhir || '07:30:00',
            jam_pulang_senin_kamis_mulai: data.kantor.jam_pulang_senin_kamis_mulai || '15:30:00',
            jam_pulang_jumat_mulai: data.kantor.jam_pulang_jumat_mulai || '13:00:00',
            jam_pulang_akhir: data.kantor.jam_pulang_akhir || '18:00:00',
          });
        }
      })
      .catch(console.error);
  };

  const loadRekap = () => {
    setLoadingRekap(true);
    fetch(`/api/absensi/rekap?bulan=${filterBulan}&tahun=${filterTahun}&pegawai_id=${filterPegawaiId}`)
      .then((res) => res.json())
      .then((data) => {
        setRekapData(data);
      })
      .catch(console.error)
      .finally(() => setLoadingRekap(false));
  };

  const loadHolidays = (tahun = filterTahunLibur) => {
    setLoadingHolidays(true);
    fetch(`/api/hari-libur?tahun=${tahun}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.holidays) setHolidaysList(data.holidays);
        if (data.today) setTodayHolidayInfo(data.today);
        setLoadingHolidays(false);
      })
      .catch((err) => {
        console.error('Error load holidays:', err);
        setLoadingHolidays(false);
      });
  };

  const handleSaveHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayForm.tanggal || !holidayForm.keterangan) {
      setHolidayMsg({ type: 'error', text: 'Tanggal dan Keterangan hari libur wajib diisi!' });
      return;
    }
    setSavingHoliday(true);
    setHolidayMsg(null);
    try {
      const res = await fetch('/api/hari-libur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(holidayForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan hari libur');
      setHolidayMsg({ type: 'success', text: `Hari libur "${holidayForm.keterangan}" berhasil disimpan!` });
      setHolidayForm({ tanggal: '', keterangan: '', tipe: 'nasional' });
      loadHolidays(filterTahunLibur);
    } catch (err: any) {
      setHolidayMsg({ type: 'error', text: err.message });
    } finally {
      setSavingHoliday(false);
    }
  };

  const handleDeleteHoliday = async (id: string, keterangan: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus hari libur "${keterangan}" dari sistem?`)) return;
    try {
      const res = await fetch(`/api/hari-libur/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus hari libur');
      setHolidayMsg({ type: 'success', text: `Hari libur "${keterangan}" berhasil dihapus.` });
      loadHolidays(filterTahunLibur);
    } catch (err: any) {
      setHolidayMsg({ type: 'error', text: err.message });
    }
  };

  const handleSyncHolidays = async () => {
    setSyncingHolidays(true);
    setHolidayMsg(null);
    try {
      const res = await fetch('/api/hari-libur/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tahun: filterTahunLibur }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Gagal sinkronisasi hari libur');
      setHolidayMsg({ type: 'success', text: data.message || 'Hari libur berhasil disinkronkan!' });
      loadHolidays(filterTahunLibur);
    } catch (err: any) {
      setHolidayMsg({ type: 'error', text: err.message });
    } finally {
      setSyncingHolidays(false);
    }
  };

  useEffect(() => {
    loadApprovals();
    loadPegawai();
    loadKantor();
    loadHolidays();
  }, []);

  useEffect(() => {
    loadRekap();
  }, [filterBulan, filterTahun, filterPegawaiId]);

  // Handlers Approval
  const handleApprovalAction = async (id: string, action: 'approved' | 'rejected') => {
    setApprovalActionLoading(id);
    setApprovalMsg(null);

    try {
      const res = await fetch(`/api/pengajuan/${id}/approval`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status_approval: action,
          catatan_admin: approvalNote[id] || '',
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Gagal memproses approval');

      setApprovalMsg({
        type: 'success',
        text: `Pengajuan berhasil ${action === 'approved' ? 'DISETUJUI' : 'DITOLAK'}${
          data.sisa_cuti_terbaru !== undefined ? `. Sisa cuti pegawai sekarang: ${data.sisa_cuti_terbaru} hari.` : ''
        }`,
      });
      loadApprovals();
      loadPegawai();
    } catch (err: any) {
      setApprovalMsg({ type: 'error', text: err.message });
    } finally {
      setApprovalActionLoading(null);
    }
  };

  // Handlers Pegawai Management
  const handleSavePegawai = async (e: React.FormEvent) => {
    e.preventDefault();
    setPegawaiActionMsg(null);

    try {
      const url = editingPegawai ? `/api/pegawai/${editingPegawai.id}` : '/api/pegawai';
      const method = editingPegawai ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pegawaiForm),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan pegawai');

      setPegawaiActionMsg({
        type: 'success',
        text: editingPegawai ? 'Data pegawai berhasil diperbarui!' : 'Pegawai baru berhasil ditambahkan!',
      });

      setShowAddModal(false);
      setEditingPegawai(null);
      setPegawaiForm({
        nip: '',
        nama: '',
        email: '',
        username: '',
        role: 'pegawai',
        jabatan: 'Staff',
        sisa_cuti_tahunan: 12,
      });
      loadPegawai();
    } catch (err: any) {
      setPegawaiActionMsg({ type: 'error', text: err.message });
    }
  };

  const handleDeletePegawai = async (id: string, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus akun pegawai "${nama}"? Semua data presensi akan ikut terhapus.`)) return;

    try {
      const res = await fetch(`/api/pegawai/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus pegawai');

      setPegawaiActionMsg({ type: 'success', text: `Pegawai "${nama}" berhasil dihapus.` });
      loadPegawai();
    } catch (err: any) {
      setPegawaiActionMsg({ type: 'error', text: err.message });
    }
  };

  const handleResetPassword = async (id: string, nama: string) => {
    if (!confirm(`Reset password pegawai "${nama}" ke default ("stupa123")?`)) return;

    try {
      const res = await fetch(`/api/pegawai/${id}/reset-password`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Gagal mereset kata sandi');

      setPegawaiActionMsg({ type: 'success', text: `Sandi untuk "${nama}" berhasil direset ke "stupa123".` });
    } catch (err: any) {
      setPegawaiActionMsg({ type: 'error', text: err.message });
    }
  };

  // Handlers Kantor Configuration
  const handleDetectOfficeLocation = () => {
    if (!navigator.geolocation) {
      alert('Browser tidak mendukung Geolocation GPS');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setKantorData((prev) => ({
          ...prev,
          latitude: parseFloat(pos.coords.latitude.toFixed(7)),
          longitude: parseFloat(pos.coords.longitude.toFixed(7)),
        }));
        alert(`Lokasi kantor berhasil dikalibrasi ke koordinat perangkat Anda:\nLat: ${pos.coords.latitude}, Long: ${pos.coords.longitude}`);
      },
      (err) => alert(`Gagal mengambil GPS: ${err.message}`)
    );
  };

  const handleSaveKantor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingKantor(true);
    setKantorMsg(null);

    try {
      const res = await fetch('/api/kantor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kantorData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memperbarui pengaturan kantor');

      setKantorMsg({ type: 'success', text: 'Pengaturan kantor & jam kerja berhasil diperbarui!' });
    } catch (err: any) {
      setKantorMsg({ type: 'error', text: err.message });
    } finally {
      setSavingKantor(false);
    }
  };

  // Unduh Dokumen Excel (.xls format dengan styling rapi)
  const exportToExcel = () => {
    if (!rekapData || !rekapData.summaryPerPegawai) return;

    const namaBulan = bulanOptions.find((b) => b.val === filterBulan)?.label || filterBulan;

    let excelHTML = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          body { font-family: Arial, sans-serif; font-size: 11pt; }
          .header-title { font-size: 14pt; font-weight: bold; text-align: center; }
          .header-sub { font-size: 11pt; text-align: center; margin-bottom: 20px; }
          table { border-collapse: collapse; width: 100%; margin-top: 15px; }
          th { background-color: #0284c7; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #000000; padding: 8px; }
          td { border: 1px solid #000000; padding: 6px; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .text-red { color: #dc2626; font-weight: bold; }
          .text-green { color: #16a34a; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header-title">SEKOLAH DASAR 7 PEDUNGAN</div>
        <div class="header-sub">LAPORAN REKAPITULASI PRESENSI & POTONGAN GAJI PEGAWAI<br>Periode: Bulan ${namaBulan} Tahun ${filterTahun}</div>
        
        <h3>1. Ringkasan Performa & Akumulasi Pemotongan Gaji Pegawai</h3>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>NIP/NIK</th>
              <th>Nama Pegawai</th>
              <th>Jabatan</th>
              <th>Total Hadir</th>
              <th>Tepat Waktu</th>
              <th>Terlambat</th>
              <th>Mendahului</th>
              <th>Dinas Luar</th>
              <th>Cuti</th>
              <th>Sakit</th>
              <th>Tidak Absen (M/K)</th>
              <th>Total Menit Pelanggaran</th>
              <th>Potongan Gaji (Rp 500/m)</th>
            </tr>
          </thead>
          <tbody>
    `;

    rekapData.summaryPerPegawai.forEach((p: any, idx: number) => {
      const potongan = (p.total_potongan_gaji_rp || 0).toLocaleString('id-ID');
      const totalAlpha = (p.total_alpha_masuk || 0) + (p.total_alpha_pulang || 0);
      excelHTML += `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td>${p.nip || '-'}</td>
          <td class="font-bold">${p.nama}</td>
          <td>${p.jabatan || 'Staff'}</td>
          <td class="text-center font-bold">${p.total_hadir}</td>
          <td class="text-center text-green">${p.hadir_tepat_waktu}</td>
          <td class="text-center text-red">${p.total_terlambat}</td>
          <td class="text-center">${p.total_mendahului}</td>
          <td class="text-center">${p.total_dinas_luar}</td>
          <td class="text-center">${p.total_cuti || 0}</td>
          <td class="text-center">${p.total_sakit || 0}</td>
          <td class="text-center ${totalAlpha > 0 ? 'text-red font-bold' : ''}">${totalAlpha > 0 ? totalAlpha + 'x' : '0'}</td>
          <td class="text-center font-bold">${p.total_menit_pelanggaran || 0} Menit</td>
          <td class="text-right text-red font-bold">Rp ${potongan}</td>
        </tr>
      `;
    });

    excelHTML += `
          </tbody>
        </table>

        <h3 style="margin-top: 30px;">2. Log Detail Presensi Harian Pegawai</h3>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Pegawai</th>
              <th>NIP</th>
              <th>Waktu Presensi</th>
              <th>Tipe</th>
              <th>Status</th>
              <th>Jarak GPS</th>
              <th>Keterangan Pelanggaran</th>
              <th>Potongan Denda (Rp 500/m)</th>
              <th>Bukti Foto / Catatan</th>
            </tr>
          </thead>
          <tbody>
    `;

    rekapData.logs?.forEach((l: any, idx: number) => {
      const totalMenit = l.total_menit_pelanggaran || (l.waktu_terlambat || 0) + (l.waktu_mendahului || 0);
      const dendaRp = l.denda_potongan_gaji !== undefined ? l.denda_potongan_gaji : totalMenit * 500;
      excelHTML += `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td class="font-bold">${l.nama}</td>
          <td>${l.nip || '-'}</td>
          <td>${l.is_alpha ? l.tgl_absen_wita + ' (Tanpa Presensi)' : new Date(l.waktu_absen).toLocaleDateString('id-ID') + ' ' + new Date(l.waktu_absen).toLocaleTimeString('id-ID') + ' WITA'}</td>
          <td class="text-center font-bold">${l.tipe_absen?.toUpperCase()}</td>
          <td class="text-center ${l.is_alpha ? 'text-red font-bold' : ''}">${l.is_alpha ? (l.tipe_absen === 'masuk' ? 'ALPHA MASUK' : 'ALPHA PULANG') : l.status?.replace('_', ' ').toUpperCase()}</td>
          <td class="text-center">${l.jarak_dari_kantor ? l.jarak_dari_kantor + ' m' : '-'}</td>
          <td class="text-center">${l.catatan || (totalMenit > 0 ? totalMenit + ' Menit' : 'Tepat Waktu')}</td>
          <td class="text-right ${totalMenit > 0 ? 'text-red font-bold' : 'text-green'}">Rp ${dendaRp.toLocaleString('id-ID')}</td>
          <td>${l.is_alpha ? 'Sistem Otomatis (Alpha)' : l.url_foto_cloudinary || '-'}</td>
        </tr>
      `;
    });

    excelHTML += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHTML], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rekap_Presensi_STUPA_${namaBulan}_${filterTahun}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const filteredPegawai = pegawaiList.filter(
    (p) =>
      p.nama.toLowerCase().includes(searchPegawai.toLowerCase()) ||
      (p.nip && p.nip.includes(searchPegawai)) ||
      p.email.toLowerCase().includes(searchPegawai.toLowerCase())
  );

  const pendingApprovals = pengajuanList.filter((p) => p.status_approval === 'pending');

  const bulanOptions = [
    { val: 1, label: 'Januari' },
    { val: 2, label: 'Februari' },
    { val: 3, label: 'Maret' },
    { val: 4, label: 'April' },
    { val: 5, label: 'Mei' },
    { val: 6, label: 'Juni' },
    { val: 7, label: 'Juli' },
    { val: 8, label: 'Agustus' },
    { val: 9, label: 'September' },
    { val: 10, label: 'Oktober' },
    { val: 11, label: 'November' },
    { val: 12, label: 'Desember' },
  ];

  const tahunOptions = Array.from({ length: 26 }, (_, i) => 2025 + i);

  return (
    <div
      className={`min-h-screen pb-16 transition-colors duration-300 ${
        darkMode
          ? 'bg-slate-950 text-slate-100'
          : 'bg-gradient-to-br from-[#87CEEB]/20 via-sky-50 to-blue-50/50 text-slate-800'
      }`}
    >
      {/* Top Header Bar */}
      <header
        className={`sticky top-0 z-30 no-print transition-colors duration-300 ${
          darkMode
            ? 'bg-slate-900 border-b border-slate-800'
            : 'bg-white/90 backdrop-blur-md border-b border-sky-200/80 shadow-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Logo Resmi STUPA"
              className="w-10 h-10 object-contain drop-shadow"
            />
            <div>
              <h1
                className={`text-base font-bold leading-tight ${
                  darkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                ADMINISTRATOR STUPA
              </h1>
              <p
                className={`text-xs font-semibold ${
                  darkMode ? 'text-slate-200' : 'text-sky-950'
                }`}
              >
                Sistem Informasi Presensi & Manajemen Pegawai
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition cursor-pointer ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-sky-300 hover:bg-slate-700'
                  : 'bg-sky-50 border-sky-200 text-sky-900 hover:bg-sky-100 shadow-sm'
              }`}
              title={darkMode ? 'Beralih ke Tema Biru Langit' : 'Beralih ke Tema Gelap'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-600" />}
              <span className="hidden md:inline">{darkMode ? 'Tema Terang' : 'Tema Gelap'}</span>
            </button>

            <div className="hidden sm:flex flex-col items-end">
              <span
                className={`text-sm font-bold ${
                  darkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                {adminUser?.nama}
              </span>
              <span className="text-xs text-sky-700 dark:text-sky-300 font-bold">
                Super Administrator
              </span>
            </div>

            <button
              onClick={handleLogout}
              className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition cursor-pointer ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:text-white hover:bg-slate-700'
                  : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100 hover:text-rose-600'
              }`}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        {/* KPI Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 no-print">
          <div
            className={`border rounded-2xl p-4 shadow-sm transition ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-sky-200/90 shadow-sky-100'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-sky-900 dark:text-sky-300">Total Pegawai</span>
              <Users className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div className={`text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              {pegawaiList.filter((p) => p.role === 'pegawai').length}
            </div>
            <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">Terdaftar di Manajemen Pegawai</span>
          </div>

          <div
            className={`border rounded-2xl p-4 shadow-sm transition ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-sky-200/90 shadow-sky-100'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-amber-900 dark:text-amber-300">Pending Approval</span>
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-amber-700 dark:text-amber-400">
              {pendingApprovals.length}
            </div>
            <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">Menunggu persetujuan</span>
          </div>

          <div
            className={`border rounded-2xl p-4 shadow-sm transition ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-sky-200/90 shadow-sky-100'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-emerald-900 dark:text-emerald-300">Hadir Tepat Waktu</span>
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
              {rekapData?.stats?.tepat_waktu ?? 0}
            </div>
            <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
              Bulan {bulanOptions.find((b) => b.val === filterBulan)?.label}
            </span>
          </div>

          <div
            className={`border rounded-2xl p-4 shadow-sm transition ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-sky-200/90 shadow-sky-100'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-rose-900 dark:text-rose-300">Total Potongan Disiplin</span>
              <Coins className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="text-2xl font-extrabold text-rose-700 dark:text-rose-400">
              Rp {(rekapData?.stats?.total_potongan_gaji_rp || 0).toLocaleString('id-ID')}
            </div>
            <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">Denda Per Menit Pelanggaran</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          className={`flex border rounded-2xl p-1.5 gap-2 sm:gap-4 overflow-x-auto no-print transition ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-sky-200 shadow-sm'
          }`}
        >
          <button
            onClick={() => setActiveTab('approval')}
            className={`py-2 px-3.5 text-xs sm:text-sm font-bold flex items-center gap-2 rounded-xl transition whitespace-nowrap cursor-pointer ${
              activeTab === 'approval'
                ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-500/25'
                : darkMode
                ? 'text-slate-200 hover:text-white hover:bg-slate-800'
                : 'text-slate-800 hover:text-sky-950 hover:bg-sky-100 font-bold'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Persetujuan Pengajuan</span>
            {pendingApprovals.length > 0 && (
              <span className="px-2 py-0.2 bg-amber-400 text-black text-xs font-bold rounded-full">
                {pendingApprovals.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('pegawai')}
            className={`py-2 px-3.5 text-xs sm:text-sm font-bold flex items-center gap-2 rounded-xl transition whitespace-nowrap cursor-pointer ${
              activeTab === 'pegawai'
                ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-500/25'
                : darkMode
                ? 'text-slate-200 hover:text-white hover:bg-slate-800'
                : 'text-slate-800 hover:text-sky-950 hover:bg-sky-100 font-bold'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Manajemen Pegawai & Kuota</span>
          </button>

          <button
            onClick={() => setActiveTab('hari_libur')}
            className={`py-2 px-3.5 text-xs sm:text-sm font-bold flex items-center gap-2 rounded-xl transition whitespace-nowrap cursor-pointer ${
              activeTab === 'hari_libur'
                ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-500/25'
                : darkMode
                ? 'text-slate-200 hover:text-white hover:bg-slate-800'
                : 'text-slate-800 hover:text-sky-950 hover:bg-sky-100 font-bold'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Input Hari Libur</span>
          </button>

          <button
            onClick={() => setActiveTab('kantor')}
            className={`py-2 px-3.5 text-xs sm:text-sm font-bold flex items-center gap-2 rounded-xl transition whitespace-nowrap cursor-pointer ${
              activeTab === 'kantor'
                ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-500/25'
                : darkMode
                ? 'text-slate-200 hover:text-white hover:bg-slate-800'
                : 'text-slate-800 hover:text-sky-950 hover:bg-sky-100 font-bold'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Pengaturan Kantor & Jam Kerja</span>
          </button>

          <button
            onClick={() => setActiveTab('rekap')}
            className={`py-2 px-3.5 text-xs sm:text-sm font-bold flex items-center gap-2 rounded-xl transition whitespace-nowrap cursor-pointer ${
              activeTab === 'rekap'
                ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-500/25'
                : darkMode
                ? 'text-slate-200 hover:text-white hover:bg-slate-800'
                : 'text-slate-800 hover:text-sky-950 hover:bg-sky-100 font-bold'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Rekapitulasi Absensi</span>
          </button>
        </div>

        {/* TAB 1: PERSETUJUAN PENGAJUAN (APPROVAL SYSTEM) */}
        {activeTab === 'approval' && (
          <div
            className={`mt-6 border rounded-3xl p-5 sm:p-6 shadow-sm transition ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-sky-200/80'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2
                  className={`text-base font-bold flex items-center gap-2 ${
                    darkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  <FileText className="w-5 h-5 text-sky-500" />
                  <span>Daftar Pengajuan Cuti & Dinas Pegawai</span>
                </h2>
                <p className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-700 font-medium'}`}>
                  Menyetujui Cuti Tahunan akan memotong kuota sisa cuti pegawai secara otomatis via database trigger.
                </p>
              </div>
              <button
                onClick={loadApprovals}
                className={`p-2 rounded-xl text-xs transition cursor-pointer font-bold ${
                  darkMode ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-sky-100 text-sky-900 hover:bg-sky-200'
                }`}
                title="Segarkan Data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {approvalMsg && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  approvalMsg.type === 'success'
                    ? 'bg-emerald-100 border border-emerald-300 text-emerald-900 dark:bg-emerald-950/60 dark:border-emerald-700 dark:text-emerald-200'
                    : 'bg-rose-100 border border-rose-300 text-rose-900 dark:bg-rose-950/60 dark:border-rose-700 dark:text-rose-200'
                }`}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{approvalMsg.text}</span>
              </div>
            )}

            {pengajuanList.length === 0 ? (
              <div className="py-12 text-center text-slate-700 dark:text-slate-300 text-sm font-semibold">
                Tidak ada pengajuan cuti atau dinas yang tercatat.
              </div>
            ) : (
              <div className="space-y-4">
                {pengajuanList.map((p) => (
                  <div
                    key={p.id}
                    className={`p-5 rounded-2xl border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition ${
                      darkMode ? 'bg-slate-850 border-slate-800' : 'bg-sky-50/70 border-sky-200'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`font-bold text-base ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {p.nama_pegawai}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">({p.nip || 'NIP: -'})</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            p.tipe_pengajuan === 'cuti_tahunan'
                              ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-200 border border-blue-300 dark:border-blue-700'
                              : p.tipe_pengajuan === 'cuti_sakit'
                              ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                              : 'bg-purple-100 text-purple-900 dark:bg-purple-900/40 dark:text-purple-200 border border-purple-300 dark:border-purple-700'
                          }`}
                        >
                          {p.tipe_pengajuan.replace('_', ' ').toUpperCase()}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status_approval === 'approved'
                              ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
                              : p.status_approval === 'rejected'
                              ? 'bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-200 border border-rose-300 dark:border-rose-700'
                              : 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                          }`}
                        >
                          {p.status_approval.toUpperCase()}
                        </span>
                      </div>

                      <div className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-800 font-medium'}`}>
                        Periode:{' '}
                        <strong className={darkMode ? 'text-white' : 'text-slate-950 font-bold'}>
                          {p.tanggal_mulai} s/d {p.tanggal_selesai}
                        </strong>{' '}
                        ({p.jumlah_hari_kerja} hari kerja di luar Sabtu-Minggu) | Sisa Kuota Cuti Pegawai:{' '}
                        <strong className="text-emerald-700 dark:text-emerald-300 font-bold">{p.sisa_cuti_tahunan} hari</strong>
                      </div>

                      <div className={`text-xs italic ${darkMode ? 'text-slate-200' : 'text-slate-800 font-medium'}`}>
                        Alasan: "{p.alasan}"
                      </div>

                      {p.url_dokumen_pendukung_cloudinary && (
                        <div className="pt-1">
                          <a
                            href={p.url_dokumen_pendukung_cloudinary}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-sky-700 dark:text-sky-300 hover:underline font-bold"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Buka Berkas Bukti / Surat Dokter (Cloudinary)</span>
                          </a>
                        </div>
                      )}
                    </div>

                    {p.status_approval === 'pending' ? (
                      <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="text"
                          placeholder="Catatan persetujuan (opsional)"
                          value={approvalNote[p.id] || ''}
                          onChange={(e) =>
                            setApprovalNote({ ...approvalNote, [p.id]: e.target.value })
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                            darkMode
                              ? 'bg-slate-800 border border-slate-700 text-white placeholder-slate-400'
                              : 'bg-white border border-sky-300 text-slate-900 placeholder-slate-500'
                          }`}
                        />
                        <button
                          type="button"
                          disabled={approvalActionLoading === p.id}
                          onClick={() => handleApprovalAction(p.id, 'approved')}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 shadow transition disabled:opacity-50 cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Setujui</span>
                        </button>
                        <button
                          type="button"
                          disabled={approvalActionLoading === p.id}
                          onClick={() => handleApprovalAction(p.id, 'rejected')}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 shadow transition disabled:opacity-50 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Tolak</span>
                        </button>
                      </div>
                    ) : (
                      <div className={`text-right text-xs ${darkMode ? 'text-slate-400' : 'text-slate-700 font-semibold'}`}>
                        Diproses pada: {new Date(p.updated_at).toLocaleDateString('id-ID')}
                        {p.catatan_admin && (
                          <div className={`mt-0.5 text-[11px] ${darkMode ? 'text-slate-300' : 'text-slate-800 font-medium'}`}>
                            Catatan: {p.catatan_admin}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MANAJEMEN PEGAWAI & KUOTA */}
        {activeTab === 'pegawai' && (
          <div
            className={`mt-6 border rounded-3xl p-5 sm:p-6 shadow-sm transition ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-sky-200/80'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2
                  className={`text-base font-bold flex items-center gap-2 ${
                    darkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  <Users className="w-5 h-5 text-sky-500" />
                  <span>Daftar Pegawai & Kuota Cuti</span>
                </h2>
                <p className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-700 font-medium'}`}>
                  Kelola data akun, reset password (default stupa123), dan sisa jatah cuti tahunan.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Cari nama / NIP..."
                    value={searchPegawai}
                    onChange={(e) => setSearchPegawai(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                      darkMode
                        ? 'bg-slate-800 border border-slate-700 text-white placeholder-slate-400'
                        : 'bg-white border border-sky-300 text-slate-900 placeholder-slate-500 shadow-sm'
                    }`}
                  />
                </div>
                <button
                  onClick={() => {
                    setEditingPegawai(null);
                    setPegawaiForm({
                      nip: '',
                      nama: '',
                      email: '',
                      username: '',
                      role: 'pegawai',
                      jabatan: 'Staff',
                      sisa_cuti_tahunan: 12,
                    });
                    setShowAddModal(true);
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Pegawai</span>
                </button>
              </div>
            </div>

            {pegawaiActionMsg && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  pegawaiActionMsg.type === 'success'
                    ? 'bg-emerald-100 border border-emerald-300 text-emerald-900 dark:bg-emerald-950/60 dark:border-emerald-700 dark:text-emerald-200'
                    : 'bg-rose-100 border border-rose-300 text-rose-900 dark:bg-rose-950/60 dark:border-rose-700 dark:text-rose-200'
                }`}
              >
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{pegawaiActionMsg.text}</span>
              </div>
            )}

            <div className="overflow-x-auto rounded-2xl border border-sky-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead
                  className={`uppercase font-black border-b ${
                    darkMode
                      ? 'bg-slate-800 text-slate-200 border-slate-700'
                      : 'bg-sky-100 text-slate-900 border-sky-200'
                  }`}
                >
                  <tr>
                    <th className="py-3 px-4">Pegawai</th>
                    <th className="py-3 px-4">Email / Akun</th>
                    <th className="py-3 px-4">Jabatan</th>
                    <th className="py-3 px-4 text-center">Role</th>
                    <th className="py-3 px-4 text-center">Sisa Cuti</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    darkMode ? 'divide-slate-800 text-slate-200' : 'divide-sky-100 text-slate-900'
                  }`}
                >
                  {filteredPegawai.map((p) => (
                    <tr
                      key={p.id}
                      className={`transition ${darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-sky-50/70'}`}
                    >
                      <td className="py-3 px-4">
                        <div className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {p.nama}
                        </div>
                        <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">NIP: {p.nip || '-'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{p.email}</div>
                        <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">@{p.username || '-'}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-200">{p.jabatan || 'Staff'}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            p.role === 'admin'
                              ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700'
                              : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
                          }`}
                        >
                          {p.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-sky-800 dark:text-sky-300">
                          {p.sisa_cuti_tahunan} Hari
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingPegawai(p);
                              setPegawaiForm({
                                nip: p.nip || '',
                                nama: p.nama,
                                email: p.email,
                                username: p.username || '',
                                role: p.role,
                                jabatan: p.jabatan || 'Staff',
                                sisa_cuti_tahunan: p.sisa_cuti_tahunan,
                              });
                              setShowAddModal(true);
                            }}
                            className={`p-1.5 rounded-lg transition cursor-pointer font-bold ${
                              darkMode
                                ? 'bg-slate-800 text-sky-400 hover:bg-slate-700'
                                : 'bg-sky-100 text-sky-900 hover:bg-sky-200'
                            }`}
                            title="Edit Data"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleResetPassword(p.id, p.nama)}
                            className={`p-1.5 rounded-lg transition cursor-pointer font-bold ${
                              darkMode
                                ? 'bg-slate-800 text-amber-400 hover:bg-slate-700'
                                : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                            }`}
                            title="Reset Sandi ke 'stupa123'"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {p.role !== 'admin' && (
                            <button
                              onClick={() => handleDeletePegawai(p.id, p.nama)}
                              className={`p-1.5 rounded-lg transition cursor-pointer font-bold ${
                                darkMode
                                  ? 'bg-slate-800 text-rose-400 hover:bg-rose-900/40'
                                  : 'bg-rose-100 text-rose-900 hover:bg-rose-200'
                              }`}
                              title="Hapus Pegawai"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Tambah / Edit Pegawai */}
            {showAddModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div
                  className={`border rounded-3xl p-6 max-w-md w-full shadow-2xl transition ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-sky-300 text-slate-900 shadow-2xl'
                  }`}
                >
                  <h3 className="text-base font-bold mb-4">
                    {editingPegawai ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}
                  </h3>

                  <form onSubmit={handleSavePegawai} className="space-y-3.5 text-xs">
                    <div>
                      <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                        NIP (Nomor Induk Pegawai)
                      </label>
                      <input
                        type="text"
                        value={pegawaiForm.nip}
                        onChange={(e) => setPegawaiForm({ ...pegawaiForm, nip: e.target.value })}
                        placeholder="199205122018011002"
                        className={`w-full px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                          darkMode ? 'bg-slate-800 border border-slate-700 text-white placeholder-slate-400' : 'bg-white border border-sky-300 text-slate-900 placeholder-slate-500 shadow-sm'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                        Nama Lengkap <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={pegawaiForm.nama}
                        onChange={(e) => setPegawaiForm({ ...pegawaiForm, nama: e.target.value })}
                        placeholder="Made Artha Wijaya, S.Kom"
                        className={`w-full px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                          darkMode ? 'bg-slate-800 border border-slate-700 text-white placeholder-slate-400' : 'bg-white border border-sky-300 text-slate-900 placeholder-slate-500 shadow-sm'
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                          Email <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={pegawaiForm.email}
                          onChange={(e) => setPegawaiForm({ ...pegawaiForm, email: e.target.value })}
                          placeholder="made@stupa.ac.id"
                          className={`w-full px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                            darkMode ? 'bg-slate-800 border border-slate-700 text-white placeholder-slate-400' : 'bg-white border border-sky-300 text-slate-900 placeholder-slate-500 shadow-sm'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                          Username
                        </label>
                        <input
                          type="text"
                          value={pegawaiForm.username}
                          onChange={(e) => setPegawaiForm({ ...pegawaiForm, username: e.target.value })}
                          placeholder="made_artha"
                          className={`w-full px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                            darkMode ? 'bg-slate-800 border border-slate-700 text-white placeholder-slate-400' : 'bg-white border border-sky-300 text-slate-900 placeholder-slate-500 shadow-sm'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                          Jabatan
                        </label>
                        <input
                          type="text"
                          value={pegawaiForm.jabatan}
                          onChange={(e) => setPegawaiForm({ ...pegawaiForm, jabatan: e.target.value })}
                          placeholder="Staff IT"
                          className={`w-full px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                            darkMode ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-white border border-sky-300 text-slate-900 shadow-sm'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                          Role Akun
                        </label>
                        <select
                          value={pegawaiForm.role}
                          onChange={(e) => setPegawaiForm({ ...pegawaiForm, role: e.target.value })}
                          className={`w-full px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                            darkMode ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-white border border-sky-300 text-slate-900 shadow-sm'
                          }`}
                        >
                          <option value="pegawai">Pegawai</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                        Sisa Kuota Cuti Tahunan (Hari)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={30}
                        required
                        value={pegawaiForm.sisa_cuti_tahunan}
                        onChange={(e) =>
                          setPegawaiForm({ ...pegawaiForm, sisa_cuti_tahunan: parseInt(e.target.value) || 0 })
                        }
                        className={`w-full px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                          darkMode ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-white border border-sky-300 text-slate-900 shadow-sm'
                        }`}
                      />
                    </div>

                    {!editingPegawai && (
                      <p className={`text-[11px] font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        ℹ️ Password awal default pegawai: <strong>stupa123</strong>
                      </p>
                    )}

                    <div className="pt-3 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                          darkMode ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                        }`}
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 rounded-xl text-xs font-bold text-white shadow cursor-pointer"
                      >
                        Simpan Pegawai
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB SUBMENU: INPUT HARI LIBUR & SINKRONISASI KALENDER NASIONAL */}
        {activeTab === 'hari_libur' && (
          <div
            className={`mt-6 border rounded-3xl p-5 sm:p-6 shadow-sm transition ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-sky-200/80'
            }`}
          >
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2
                  className={`text-base font-bold flex items-center gap-2 ${
                    darkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  <Calendar className="w-5 h-5 text-sky-500" />
                  <span>Manajemen & Input Hari Libur STUPA</span>
                </h2>
                <p className={`text-xs mt-1 ${darkMode ? 'text-slate-300' : 'text-slate-700 font-medium'}`}>
                  Kelola hari libur nasional, cuti bersama, dan hari libur khusus internal sekolah (Galungan, Kuningan, dll). Pada hari libur terdaftar, presensi dinonaktifkan otomatis.
                </p>
              </div>

              {/* Tombol Sinkronisasi Kalender Nasional / Google Calendar */}
              <button
                type="button"
                onClick={handleSyncHolidays}
                disabled={syncingHolidays}
                className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50 flex-shrink-0"
                title="Tarik & Sinkronkan Data Hari Libur Nasional Otomatis dari Kalender"
              >
                <RefreshCw className={`w-4 h-4 ${syncingHolidays ? 'animate-spin' : ''}`} />
                <span>{syncingHolidays ? 'Menyinkronkan...' : 'Sinkronkan Kalender Libur Nasional'}</span>
              </button>
            </div>

            {/* Status Hari Ini Banner */}
            {todayHolidayInfo && (
              <div
                className={`mb-6 p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs shadow-sm ${
                  todayHolidayInfo.is_holiday
                    ? 'bg-amber-100 border-amber-300 text-amber-950 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-200'
                    : 'bg-emerald-100 border-emerald-300 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{todayHolidayInfo.is_holiday ? '🏖️' : '💼'}</span>
                  <div>
                    <div className="font-bold text-sm">
                      Status Hari Ini: {todayHolidayInfo.is_holiday ? 'HARI LIBUR' : 'HARI KERJA EFEKTIF'}
                    </div>
                    <div className="text-[11px] font-medium opacity-90 mt-0.5">
                      {todayHolidayInfo.keterangan} • Tanggal: {todayHolidayInfo.date}
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-white/90 dark:bg-slate-800 shadow-sm border border-slate-300 dark:border-slate-700">
                  {todayHolidayInfo.tipe}
                </span>
              </div>
            )}

            {holidayMsg && (
              <div
                className={`mb-6 p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                  holidayMsg.type === 'success'
                    ? 'bg-emerald-100 border border-emerald-300 text-emerald-900 dark:bg-emerald-950/60 dark:border-emerald-700 dark:text-emerald-200 font-bold'
                    : 'bg-rose-100 border border-rose-300 text-rose-900 dark:bg-rose-950/60 dark:border-rose-700 dark:text-rose-200 font-bold'
                }`}
              >
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{holidayMsg.text}</span>
              </div>
            )}

            {/* Grid: Form Input Manual & List Hari Libur */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Input Manual */}
              <div
                className={`lg:col-span-4 border rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 ${
                  darkMode ? 'bg-slate-850 border-slate-800' : 'bg-sky-50/70 border-sky-200'
                }`}
              >
                <h3
                  className={`text-sm font-bold flex items-center gap-2 ${
                    darkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-sky-500" />
                  <span>Form Input Hari Libur Manual</span>
                </h3>
                <p className={`text-[11px] ${darkMode ? 'text-slate-300' : 'text-slate-700 font-medium'}`}>
                  Tambahkan hari libur khusus internal sekolah (Galungan, Kuningan, cuti bersama sekolah, libur semester).
                </p>

                <form onSubmit={handleSaveHoliday} className="space-y-3.5">
                  <div>
                    <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                      Tanggal Libur <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={holidayForm.tanggal}
                      onChange={(e) => setHolidayForm({ ...holidayForm, tanggal: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-sky-300 text-slate-900 shadow-sm'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                      Nama / Keterangan Hari Libur <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Hari Raya Galungan / Libur Khusus STUPA"
                      value={holidayForm.keterangan}
                      onChange={(e) => setHolidayForm({ ...holidayForm, keterangan: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-sky-300 text-slate-900 placeholder-slate-500 shadow-sm'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                      Kategori / Tipe Libur
                    </label>
                    <select
                      value={holidayForm.tipe}
                      onChange={(e) => setHolidayForm({ ...holidayForm, tipe: e.target.value as any })}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-sky-300 text-slate-900 shadow-sm'
                      }`}
                    >
                      <option value="khusus">Libur Khusus Sekolah (STUPA / Bali)</option>
                      <option value="nasional">Hari Libur Nasional / Cuti Bersama</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={savingHoliday}
                    className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{savingHoliday ? 'Menyimpan...' : 'Simpan Hari Libur'}</span>
                  </button>
                </form>
              </div>

              {/* Tabel Daftar Hari Libur Terdaftar */}
              <div className="lg:col-span-8 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      Daftar Tanggal Merah & Hari Libur Terdaftar
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-900 dark:bg-sky-900/60 dark:text-sky-200 border border-sky-200 dark:border-sky-700">
                      {holidaysList.length} Hari
                    </span>
                  </div>

                  {/* Filter Tahun */}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                      Tahun:
                    </span>
                    <select
                      value={filterTahunLibur}
                      onChange={(e) => {
                        const yr = parseInt(e.target.value);
                        setFilterTahunLibur(yr);
                        loadHolidays(yr);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-sky-300 text-slate-900 shadow-sm'
                      }`}
                    >
                      {tahunOptions.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto border border-sky-200 dark:border-slate-800 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-sky-100 dark:bg-slate-800 uppercase font-black text-slate-900 dark:text-slate-200 border-b border-sky-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-12">No</th>
                        <th className="py-2.5 px-3 text-left w-36">Tanggal</th>
                        <th className="py-2.5 px-3 text-left">Nama / Keterangan Libur</th>
                        <th className="py-2.5 px-3 text-center w-28">Kategori</th>
                        <th className="py-2.5 px-3 text-center w-20">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-900 dark:text-slate-200">
                      {loadingHolidays ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-700 dark:text-slate-300 font-semibold">
                            Memuat data hari libur...
                          </td>
                        </tr>
                      ) : holidaysList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-700 dark:text-slate-300 font-semibold">
                            Belum ada hari libur tersimpan untuk tahun {filterTahunLibur}. Klik &quot;Sinkronkan Kalender Libur Nasional&quot; atau input secara manual.
                          </td>
                        </tr>
                      ) : (
                        holidaysList.map((h: any, idx: number) => {
                          const dateObj = new Date(h.tanggal);
                          return (
                            <tr
                              key={h.id || idx}
                              className="hover:bg-sky-50/60 dark:hover:bg-slate-850/40 transition"
                            >
                              <td className="py-2.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                {dateObj.toLocaleDateString('id-ID', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                                {h.keterangan}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    h.tipe === 'khusus'
                                      ? 'bg-purple-100 text-purple-900 dark:bg-purple-900/60 dark:text-purple-200 border border-purple-300 dark:border-purple-700'
                                      : 'bg-rose-100 text-rose-900 dark:bg-rose-900/60 dark:text-rose-200 border border-rose-300 dark:border-rose-700'
                                  }`}
                                >
                                  {h.tipe === 'khusus' ? 'Khusus STUPA' : 'Nasional'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteHoliday(h.id, h.keterangan)}
                                  className="p-1.5 rounded-lg text-rose-600 hover:text-white hover:bg-rose-600 transition cursor-pointer"
                                  title="Hapus Hari Libur Ini"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PENGATURAN KANTOR & ATURAN JAM KERJA SPESIFIK */}
        {activeTab === 'kantor' && (
          <div
            className={`mt-6 max-w-4xl border rounded-3xl p-5 sm:p-6 shadow-sm transition ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-sky-200/80'
            }`}
          >
            <h2
              className={`text-base font-bold mb-2 flex items-center gap-2 ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              <Building className="w-5 h-5 text-sky-500" />
              <span>Pengaturan Kantor & Jadwal Jam Kerja Spesifik STUPA</span>
            </h2>
            <p className={`text-xs mb-6 ${darkMode ? 'text-slate-300' : 'text-slate-700 font-medium'}`}>
              Konfigurasikan geofencing GPS dan batas jam presensi sesuai ketentuan instansi.
            </p>

            {kantorMsg && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  kantorMsg.type === 'success'
                    ? 'bg-emerald-100 border border-emerald-300 text-emerald-900 dark:bg-emerald-950/60 dark:border-emerald-700 dark:text-emerald-200'
                    : 'bg-rose-100 border border-rose-300 text-rose-900 dark:bg-rose-950/60 dark:border-rose-700 dark:text-rose-200'
                }`}
              >
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{kantorMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveKantor} className="space-y-4 text-xs">
              <div>
                <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                  Nama Kantor / Instansi
                </label>
                <input
                  type="text"
                  required
                  value={kantorData.nama}
                  onChange={(e) => setKantorData({ ...kantorData, nama: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs font-semibold ${
                    darkMode ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-white border border-sky-300 text-slate-900 shadow-sm'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                    Latitude Kantor
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={kantorData.latitude}
                    onChange={(e) =>
                      setKantorData({ ...kantorData, latitude: parseFloat(e.target.value) })
                    }
                    className={`w-full px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs font-mono font-bold ${
                      darkMode ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-white border border-sky-300 text-slate-900 shadow-sm'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                    Longitude Kantor
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={kantorData.longitude}
                    onChange={(e) =>
                      setKantorData({ ...kantorData, longitude: parseFloat(e.target.value) })
                    }
                    className={`w-full px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs font-mono font-bold ${
                      darkMode ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-white border border-sky-300 text-slate-900 shadow-sm'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-start">
                <button
                  type="button"
                  onClick={handleDetectOfficeLocation}
                  className={`px-3.5 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-sky-400 hover:bg-slate-700'
                      : 'bg-sky-100 border-sky-300 text-sky-900 hover:bg-sky-200'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span>📍 Gunakan Lokasi GPS Saya Saat Ini (Kalibrasi Otomatis)</span>
                </button>
              </div>

              <div>
                <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                  Batas Radius Geofencing (Meter)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={10}
                    max={5000}
                    required
                    value={kantorData.radius_meter}
                    onChange={(e) =>
                      setKantorData({ ...kantorData, radius_meter: parseInt(e.target.value) || 100 })
                    }
                    className={`w-full px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs font-bold ${
                      darkMode ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-white border border-sky-300 text-slate-900 shadow-sm'
                    }`}
                  />
                  <span className="absolute right-3.5 top-2.5 text-slate-500 font-bold text-xs pointer-events-none">
                    Meter
                  </span>
                </div>
              </div>

              {/* Box Pengaturan Jadwal Jam Kerja Spesifik (Point 5) */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${
                  darkMode ? 'bg-slate-850 border-slate-800' : 'bg-sky-50/70 border-sky-200'
                }`}
              >
                <div className="font-bold text-sm flex items-center gap-2 text-sky-800 dark:text-sky-300">
                  <Clock className="w-4 h-4" />
                  <span>Jadwal Batas Waktu Presensi Pegawai:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                      a. Jam Mulai Absen Masuk (Buka Sistem)
                    </label>
                    <input
                      type="time"
                      step="1"
                      required
                      value={kantorData.jam_masuk_mulai}
                      onChange={(e) => setKantorData({ ...kantorData, jam_masuk_mulai: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-sky-300 text-slate-900 shadow-sm'
                      }`}
                    />
                    <span className={`text-[10px] font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                      Pegawai belum bisa absen sebelum jam ini (Default: 06:30)
                    </span>
                  </div>

                  <div>
                    <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                      b. Jam Batas Akhir Masuk Tepat Waktu
                    </label>
                    <input
                      type="time"
                      step="1"
                      required
                      value={kantorData.jam_masuk_akhir}
                      onChange={(e) => setKantorData({ ...kantorData, jam_masuk_akhir: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-sky-300 text-slate-900 shadow-sm'
                      }`}
                    />
                    <span className={`text-[10px] font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                      Lewat jam ini dihitung terlambat (Default: 07:30)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                      c. Jam Mulai Pulang (Senin - Kamis)
                    </label>
                    <input
                      type="time"
                      step="1"
                      required
                      value={kantorData.jam_pulang_senin_kamis_mulai}
                      onChange={(e) =>
                        setKantorData({ ...kantorData, jam_pulang_senin_kamis_mulai: e.target.value })
                      }
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-sky-300 text-slate-900 shadow-sm'
                      }`}
                    />
                    <span className={`text-[10px] font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                      Batas awal pulang Senin-Kamis (Default: 15:30)
                    </span>
                  </div>

                  <div>
                    <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                      d. Jam Mulai Pulang (Khusus Hari Jumat)
                    </label>
                    <input
                      type="time"
                      step="1"
                      required
                      value={kantorData.jam_pulang_jumat_mulai}
                      onChange={(e) =>
                        setKantorData({ ...kantorData, jam_pulang_jumat_mulai: e.target.value })
                      }
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-sky-300 text-slate-900 shadow-sm'
                      }`}
                    />
                    <span className={`text-[10px] font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                      Batas awal pulang khusus Jumat (Default: 13:00)
                    </span>
                  </div>

                  <div>
                    <label className={`block font-bold mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                      e. Jam Batas Akhir Pulang (Tutup Absen)
                    </label>
                    <input
                      type="time"
                      step="1"
                      required
                      value={kantorData.jam_pulang_akhir}
                      onChange={(e) => setKantorData({ ...kantorData, jam_pulang_akhir: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-sky-300 text-slate-900 shadow-sm'
                      }`}
                    />
                    <span className={`text-[10px] font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
                      Diatas jam ini sistem absen pulang terkunci (Default: 18:00)
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingKantor}
                  className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {savingKantor ? 'Menyimpan Pengaturan...' : 'Simpan Pengaturan Kantor'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: REKAPITULASI ABSENSI DENGAN EXCEL, KOP RESMI & DENDA POTONGAN GAJI */}
        {activeTab === 'rekap' && (
          <div
            className={`mt-6 border rounded-3xl p-5 sm:p-6 shadow-sm transition print:border-none print:shadow-none print:p-0 print:m-0 print:bg-white ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-sky-200/80'
            }`}
          >
            {/* Filter Bar */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6 no-print">
              <div>
                <h2
                  className={`text-base font-bold flex items-center gap-2 ${
                    darkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  <Calendar className="w-5 h-5 text-sky-500" />
                  <span>Rekapitulasi Presensi & Perhitungan Potongan Gaji Pegawai</span>
                </h2>
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-300' : 'text-slate-700 font-semibold'}`}>
                  Denda otomatis Rp 500 per menit. Tidak absen masuk = +200 menit, tidak absen keluar = +200 menit.
                </p>
              </div>

              {/* Filters & Actions */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Filter Bulan */}
                <div className="flex items-center gap-1.5 bg-sky-100 dark:bg-slate-800 p-1.5 rounded-xl border border-sky-300 dark:border-slate-700">
                  <span className="text-[11px] font-bold px-2 text-slate-900 dark:text-slate-200">Bulan:</span>
                  <select
                    value={filterBulan}
                    onChange={(e) => setFilterBulan(parseInt(e.target.value))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold focus:outline-none ${
                      darkMode ? 'bg-slate-700 text-white' : 'bg-white text-slate-900 shadow-sm border border-sky-200'
                    }`}
                  >
                    {bulanOptions.map((b) => (
                      <option key={b.val} value={b.val}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter Tahun */}
                <div className="flex items-center gap-1.5 bg-sky-100 dark:bg-slate-800 p-1.5 rounded-xl border border-sky-300 dark:border-slate-700">
                  <span className="text-[11px] font-bold px-2 text-slate-900 dark:text-slate-200">Tahun:</span>
                  <select
                    value={filterTahun}
                    onChange={(e) => setFilterTahun(parseInt(e.target.value))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold focus:outline-none ${
                      darkMode ? 'bg-slate-700 text-white' : 'bg-white text-slate-900 shadow-sm border border-sky-200'
                    }`}
                  >
                    {tahunOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter Pegawai */}
                <div className="flex items-center gap-1.5 bg-sky-100 dark:bg-slate-800 p-1.5 rounded-xl border border-sky-300 dark:border-slate-700">
                  <span className="text-[11px] font-bold px-2 text-slate-900 dark:text-slate-200">Pegawai:</span>
                  <select
                    value={filterPegawaiId}
                    onChange={(e) => setFilterPegawaiId(e.target.value)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold focus:outline-none max-w-xs ${
                      darkMode ? 'bg-slate-700 text-white' : 'bg-white text-slate-900 shadow-sm border border-sky-200'
                    }`}
                  >
                    <option value="all">Semua Pegawai</option>
                    {pegawaiList
                      .filter((p) => p.role === 'pegawai')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nama}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Tombol Terapkan Filter */}
                <button
                  type="button"
                  onClick={loadRekap}
                  disabled={loadingRekap}
                  className="px-3.5 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition cursor-pointer disabled:opacity-50"
                  title="Terapkan Filter Terpilih"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingRekap ? 'animate-spin' : ''}`} />
                  <span>{loadingRekap ? 'Memuat...' : 'Terapkan Filter'}</span>
                </button>

                {/* Tombol Unduh Excel */}
                <button
                  onClick={exportToExcel}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                  title="Unduh Laporan Format Microsoft Excel (.xls)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Excel</span>
                </button>

                {/* Tombol Cetak PDF dengan Kop Resmi */}
                <button
                  onClick={() => window.print()}
                  className={`px-3.5 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer ${
                    darkMode
                      ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                      : 'bg-sky-100 hover:bg-sky-200 border-sky-300 text-sky-950 font-bold'
                  }`}
                  title="Cetak Laporan Resmi dengan Kop Surat"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak (Kop Resmi)</span>
                </button>
              </div>
            </div>

            {/* KOP RESMI STUPA (HANYA MUNCUL SAAT CETAK / PRINT PDF) DENGAN LOGO RESMI */}
            <div className="hidden print:block mb-6 text-black avoid-break" style={{ pageBreakInside: 'avoid' }}>
              <table
                className="w-full border-b-[3px] border-double border-black pb-3 mb-4"
                style={{ tableLayout: 'fixed', width: '100%', border: 'none' }}
              >
                <tbody>
                  <tr>
                    <td className="text-center align-middle p-2" style={{ border: 'none', width: '90px' }}>
                      <img
                        src="/logo.png"
                        alt="Logo Resmi STUPA"
                        className="w-20 h-20 object-contain mx-auto"
                        style={{ display: 'block', margin: '0 auto' }}
                      />
                    </td>
                    <td className="text-center align-middle pl-2" style={{ border: 'none' }}>
                      <h3 className="text-xs uppercase tracking-widest font-normal text-black m-0">
                        PEMERINTAH KOTA DENPASAR
                      </h3>
                      <h2 className="text-sm font-bold uppercase text-black m-0 mt-0.5">
                        DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA KOTA DENPASAR
                      </h2>
                      <h1 className="text-lg font-black uppercase text-black m-0 mt-0.5">
                        SEKOLAH DASAR NEGERI 7 PEDUNGAN
                      </h1>
                      <p className="text-[10px] italic text-black m-0 mt-0.5">
                        Jalan Pulau Moyo No. 63 Pedungan, Denpasar Selatan, Bali 80222 | Telp: (0361)725176
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="text-center mb-4">
                <h2 className="text-sm font-bold uppercase underline text-black">
                  LAPORAN REKAPITULASI ABSENSI & PERHITUNGAN POTONGAN DISIPLIN PEGAWAI
                </h2>
                <p className="text-xs text-black mt-1">
                  Periode: Bulan {bulanOptions.find((b) => b.val === filterBulan)?.label} Tahun {filterTahun}
                  {filterPegawaiId !== 'all' && (
                    <span> • Pegawai: {pegawaiList.find((p) => p.id === filterPegawaiId)?.nama}</span>
                  )}
                </p>
              </div>
            </div>

            {/* Performance Summary Table per Pegawai (Precision A4 Colgroup) */}
            <div className="mb-6">
              <h3
                className={`text-sm font-bold mb-3 flex items-center justify-between ${
                  darkMode ? 'text-white' : 'text-slate-900'
                } print:text-black`}
              >
                <span>Ringkasan Disiplin & Akumulasi Denda Per Pegawai</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 print:text-black">
                  Tarif Denda: <strong>Rp 500 / Menit</strong> (Tidak Absen Masuk = 200m, Tidak Absen Pulang = 200m)
                </span>
              </h3>
              <div className="overflow-x-auto">
                <table
                  className="w-full text-xs border border-slate-300 dark:border-slate-700 print:border-black"
                  style={{ tableLayout: 'fixed', width: '100%', borderCollapse: 'collapse' }}
                >
                  <colgroup>
                    <col style={{ width: '17%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '6%' }} />
                    <col style={{ width: '6%' }} />
                    <col style={{ width: '6%' }} />
                    <col style={{ width: '6%' }} />
                    <col style={{ width: '6%' }} />
                    <col style={{ width: '6%' }} />
                    <col style={{ width: '7%' }} />
                    <col style={{ width: '13%' }} />
                    <col style={{ width: '16%' }} />
                  </colgroup>
                  <thead className="bg-sky-100 dark:bg-slate-800 print:bg-slate-100 uppercase font-black text-slate-900 dark:text-slate-100 print:text-black border border-slate-300 dark:border-slate-700 print:border-black">
                    <tr>
                      <th className="py-2.5 px-2 text-center align-middle border border-slate-300 dark:border-slate-700 print:border-black text-[10px] sm:text-[11px] whitespace-normal">Nama & NIP/NIK</th>
                      <th className="py-2.5 px-2 text-center align-middle border border-slate-300 dark:border-slate-700 print:border-black text-[10px] sm:text-[11px] whitespace-normal">Jabatan</th>
                      <th className="py-2.5 px-1 text-center align-middle border border-slate-300 dark:border-slate-700 print:border-black text-[10px] sm:text-[11px] whitespace-normal">Total Hadir</th>
                      <th className="py-2.5 px-1 text-center align-middle border border-slate-300 dark:border-slate-700 print:border-black text-[10px] sm:text-[11px] whitespace-normal">Total Tepat Waktu</th>
                      <th className="py-2.5 px-1 text-center align-middle border border-slate-300 dark:border-slate-700 print:border-black text-[10px] sm:text-[11px] whitespace-normal">Total Terlambat</th>
                      <th className="py-2.5 px-1 text-center align-middle border border-slate-300 dark:border-slate-700 print:border-black text-[10px] sm:text-[11px] whitespace-normal">Total Mendahului</th>
                      <th className="py-2.5 px-1 text-center align-middle border border-slate-300 dark:border-slate-700 print:border-black text-[10px] sm:text-[11px] whitespace-normal">Catatan Dinas</th>
                      <th className="py-2.5 px-1 text-center align-middle border border-slate-300 dark:border-slate-700 print:border-black text-[10px] sm:text-[11px] whitespace-normal">Catatan Cuti</th>
                      <th className="py-2.5 px-1 text-center align-middle border border-slate-300 dark:border-slate-700 print:border-black text-[10px] sm:text-[11px] whitespace-normal">Total Tidak Absen</th>
                      <th className="py-2.5 px-1 text-center align-middle border border-slate-300 dark:border-slate-700 print:border-black text-[10px] sm:text-[11px] whitespace-normal">Pelanggaran</th>
                      <th className="py-2.5 px-2 text-center align-middle border border-slate-300 dark:border-slate-700 print:border-black text-[10px] sm:text-[11px] whitespace-normal">Potongan Gaji</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 print:divide-black text-slate-900 dark:text-slate-100 print:text-black">
                    {rekapData?.summaryPerPegawai?.map((p: any) => {
                      const totalAlpha = (p.total_alpha_masuk || 0) + (p.total_alpha_pulang || 0);
                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-sky-50/60 dark:hover:bg-slate-850/40 print:hover:bg-transparent"
                        >
                          <td className="py-2 px-2 border border-slate-200 dark:border-slate-800 print:border-black">
                            <div className="font-bold text-slate-900 dark:text-white print:text-black">
                              {p.nama}
                            </div>
                            <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 print:text-black">
                              NIP/NIK: {p.nip || '-'}
                            </div>
                          </td>
                          <td className="py-2 px-2 border border-slate-200 dark:border-slate-800 print:border-black font-semibold text-slate-900 dark:text-slate-200 print:text-black">
                            {p.jabatan || 'Staff'}
                          </td>
                          <td className="py-2 px-1 text-center border border-slate-200 dark:border-slate-800 print:border-black font-bold text-slate-900 dark:text-white print:text-black">
                            {p.total_hadir}
                          </td>
                          <td className="py-2 px-1 text-center border border-slate-200 dark:border-slate-800 print:border-black text-emerald-800 dark:text-emerald-300 print:text-black font-bold">
                            {p.hadir_tepat_waktu}
                          </td>
                          <td className="py-2 px-1 text-center border border-slate-200 dark:border-slate-800 print:border-black text-rose-800 dark:text-rose-300 print:text-black font-bold">
                            {p.total_terlambat}
                          </td>
                          <td className="py-2 px-1 text-center border border-slate-200 dark:border-slate-800 print:border-black text-amber-800 dark:text-amber-300 print:text-black font-bold">
                            {p.total_mendahului}
                          </td>
                          <td className="py-2 px-1 text-center border border-slate-200 dark:border-slate-800 print:border-black text-indigo-800 dark:text-purple-300 print:text-black font-bold">
                            {p.total_dinas_luar}
                          </td>
                          <td className="py-2 px-1 text-center border border-slate-200 dark:border-slate-800 print:border-black font-bold text-blue-800 dark:text-blue-300 print:text-black">
                            {(p.total_cuti || 0) + (p.total_sakit || 0)}
                          </td>
                          <td className="py-2 px-1 text-center border border-slate-200 dark:border-slate-800 print:border-black font-bold text-rose-800 dark:text-rose-300 print:text-black">
                            {totalAlpha > 0 ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-900 dark:bg-rose-900/60 dark:text-rose-200 border border-rose-300 dark:border-rose-700">
                                {totalAlpha}x
                              </span>
                            ) : (
                              '0'
                            )}
                          </td>
                          <td className="py-2 px-1 text-center border border-slate-200 dark:border-slate-800 print:border-black font-bold text-slate-900 dark:text-slate-100 print:text-black">
                            {p.total_menit_pelanggaran || 0} m
                          </td>
                          <td className="py-2 px-2 text-right border border-slate-200 dark:border-slate-800 print:border-black font-bold text-rose-800 dark:text-rose-300 print:text-black whitespace-nowrap">
                            Rp {(p.total_potongan_gaji_rp || 0).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detailed Log Table with Denda Column (Precision A4 Colgroup) */}
            <div className="mt-8">
              <h3
                className={`text-sm font-bold mb-3 ${
                  darkMode ? 'text-white' : 'text-slate-900'
                } print:text-black`}
              >
                Log Detail Presensi & Potongan Gaji Pegawai
              </h3>
              <div className="overflow-x-auto">
                <table
                  className="w-full text-xs border border-slate-300 dark:border-slate-700 print:border-black"
                  style={{ tableLayout: 'fixed', width: '100%', borderCollapse: 'collapse' }}
                >
                  <colgroup>
                    <col style={{ width: '4%' }} />
                    <col style={{ width: '7%' }} />
                    <col style={{ width: '18%' }} />
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '17%' }} />
                    <col style={{ width: '14%' }} />
                  </colgroup>
                  <thead className="bg-sky-100 dark:bg-slate-800 print:bg-slate-100 uppercase font-black text-slate-900 dark:text-slate-100 print:text-black border border-slate-300 dark:border-slate-700 print:border-black">
                    <tr>
                      <th className="py-2.5 px-1 text-center align-middle border border-slate-300 dark:border-slate-700 print:border-black text-[10px] sm:text-[11px] whitespace-normal">No</th>
                      <th className="py-2.5 px-1 text-center align-middle border border-slate-300 dark:border-slate-700 print:border-black text-[10px] sm:text-[11px] whitespace-normal">Foto</th>
                      <th className="py-2.5 px-2 text-center align-middle border border-slate-300 dark:border-slate-700 print:border-black text-[10px] sm:text-[11px] whitespace-normal">Pegawai</th>
                      <th className="py-2.5 px-2 text-center align-middle border border-slate-300 dark:border-slate-700 print:border-black text-[10px] sm:text-[11px] whitespace-normal">Waktu Presensi</th>
                      <th className="py-2.5 px-1 text-center align-middle border border-slate-300 dark:border-slate-700 print:border-black text-[10px] sm:text-[11px] whitespace-normal">Tipe</th>
                      <th className="py-2.5 px-1 text-center align-middle border border-slate-300 dark:border-slate-700 print:border-black text-[10px] sm:text-[11px] whitespace-normal">Status</th>
                      <th className="py-2.5 px-1 text-center align-middle border border-slate-300 dark:border-slate-700 print:border-black text-[10px] sm:text-[11px] whitespace-normal">Jarak</th>
                      <th className="py-2.5 px-2 text-center align-middle border border-slate-300 dark:border-slate-700 print:border-black text-[10px] sm:text-[11px] whitespace-normal">Keterangan</th>
                      <th className="py-2.5 px-2 text-center align-middle border border-slate-300 dark:border-slate-700 print:border-black text-[10px] sm:text-[11px] whitespace-normal">Potongan Gaji</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 print:divide-black text-slate-900 dark:text-slate-100 print:text-black">
                    {rekapData?.logs?.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-6 text-center text-slate-700 dark:text-slate-300 font-semibold print:text-black">
                          Tidak ada rekaman presensi pada periode bulan ini.
                        </td>
                      </tr>
                    ) : (
                      rekapData?.logs?.map((l: any, idx: number) => {
                        const totalMenit = l.total_menit_pelanggaran || (l.waktu_terlambat || 0) + (l.waktu_mendahului || 0);
                        const denda = l.denda_potongan_gaji !== undefined ? l.denda_potongan_gaji : totalMenit * 500;
                        return (
                          <tr
                            key={l.id}
                            className="hover:bg-sky-50/60 dark:hover:bg-slate-850/40 print:hover:bg-transparent"
                          >
                            <td className="py-2 px-1 text-center font-bold text-slate-800 dark:text-slate-200 print:text-black border border-slate-200 dark:border-slate-800 print:border-black">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-1 text-center border border-slate-200 dark:border-slate-800 print:border-black">
                              {l.is_alpha ? (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-900 dark:bg-rose-900/60 dark:text-rose-200 border border-rose-300 dark:border-rose-700 print:border print:border-black">
                                  ALPHA
                                </span>
                              ) : l.url_foto_cloudinary ? (
                                <a
                                  href={l.url_foto_cloudinary}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-block"
                                >
                                  <img
                                    src={l.url_foto_cloudinary}
                                    alt="Selfie"
                                    className="w-8 h-8 rounded-lg object-cover border border-slate-300 dark:border-slate-700 print:w-7 print:h-7 mx-auto"
                                  />
                                </a>
                              ) : (
                                <span className="text-slate-500 font-bold">-</span>
                              )}
                            </td>
                            <td className="py-2 px-2 border border-slate-200 dark:border-slate-800 print:border-black">
                              <div className="font-bold text-slate-900 dark:text-white print:text-black">
                                {l.nama}
                              </div>
                              <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 print:text-black">
                                NIP: {l.nip || '-'}
                              </div>
                            </td>
                            <td className="py-2 px-2 border border-slate-200 dark:border-slate-800 print:border-black">
                              <div className="text-slate-900 dark:text-white print:text-black font-bold">
                                {new Date(l.waktu_absen).toLocaleDateString('id-ID')}
                              </div>
                              <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 print:text-black">
                                {l.is_alpha ? (
                                  <span className="text-rose-700 dark:text-rose-300 font-bold">Tanpa Presensi</span>
                                ) : (
                                  `${new Date(l.waktu_absen).toLocaleTimeString('id-ID', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })} WITA`
                                )}
                              </div>
                            </td>
                            <td className="py-2 px-1 text-center uppercase font-black text-[11px] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 print:border-black">
                              {l.tipe_absen}
                            </td>
                            <td className="py-2 px-1 text-center border border-slate-200 dark:border-slate-800 print:border-black">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  l.is_alpha
                                    ? 'bg-rose-100 text-rose-900 dark:bg-rose-900/60 dark:text-rose-200 border border-rose-300 dark:border-rose-700 print:border print:border-black'
                                    : l.status === 'tepat_waktu'
                                    ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 print:border print:border-black'
                                    : l.status === 'terlambat'
                                    ? 'bg-rose-100 text-rose-900 dark:bg-rose-900/60 dark:text-rose-200 border border-rose-300 dark:border-rose-700 print:border print:border-black'
                                    : l.status === 'mendahului'
                                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700 print:border print:border-black'
                                    : l.status === 'cuti_tahunan' || l.status === 'cuti'
                                    ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/60 dark:text-blue-200 border border-blue-300 dark:border-blue-700 print:border print:border-black'
                                    : l.status === 'cuti_sakit' || l.status === 'sakit'
                                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700 print:border print:border-black'
                                    : 'bg-purple-100 text-purple-900 dark:bg-purple-900/60 dark:text-purple-200 border border-purple-300 dark:border-purple-700 print:border print:border-black'
                                }`}
                              >
                                {l.is_alpha
                                  ? l.tipe_absen === 'masuk'
                                    ? 'ALPHA MASUK'
                                    : 'ALPHA PULANG'
                                  : l.status?.replace('_', ' ').toUpperCase()}
                              </span>
                            </td>
                            <td className="py-2 px-1 text-center font-bold text-slate-900 dark:text-slate-200 border border-slate-200 dark:border-slate-800 print:border-black">
                              {l.jarak_dari_kantor ? `${l.jarak_dari_kantor}m` : '-'}
                            </td>
                            <td className="py-2 px-2 text-slate-900 dark:text-slate-100 print:text-black font-medium text-[11px] border border-slate-200 dark:border-slate-800 print:border-black">
                              {l.catatan || (
                                <>
                                  {l.waktu_terlambat > 0 && `Telat ${l.waktu_terlambat}m. `}
                                  {l.waktu_mendahului > 0 && `Mendahului ${l.waktu_mendahului}m. `}
                                </>
                              )}
                            </td>
                            <td className="py-2 px-2 text-right border border-slate-200 dark:border-slate-800 print:border-black">
                              {totalMenit > 0 ? (
                                <span className="text-rose-800 dark:text-rose-300 font-bold block">
                                  -Rp {denda.toLocaleString('id-ID')}
                                  <span className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 print:text-black">
                                    ({totalMenit} m)
                                  </span>
                                </span>
                              ) : (
                                <span className="text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
                                  Rp 0
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tanda Tangan Resmi Dokumen Cetak (HANYA SAAT PRINT) */}
            <div
              className="hidden print:block mt-10 text-black text-xs avoid-break"
              style={{ pageBreakInside: 'avoid' }}
            >
              <table className="w-full" style={{ tableLayout: 'fixed', border: 'none' }}>
                <tbody>
                  <tr>
                    <td className="w-1/2 text-center" style={{ border: 'none' }}>
                      <p className="m-0">Mengetahui,</p>
                      <p className="font-bold m-0 mt-1">Kepala SD Negeri 7 Pedungan</p>
                      <div className="h-16" />
                      <p className="font-bold underline m-0">Made Wahyuni Indrawati, S.Pd.SD., M.Pd</p>
                      <p className="m-0 text-[10px]">NIP. 197011072007012031</p>
                    </td>
                    <td className="w-1/2 text-center" style={{ border: 'none' }}>
                      <p className="m-0">
                        Denpasar,{' '}
                        {new Date().toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="font-bold m-0 mt-1">Staff TU/Bendahara Gaji</p>
                      <div className="h-16" />
                      <p className="font-bold underline m-0">...............................................................</p>
                      <p className="m-0 text-[10px]">NIP. ..............................................</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
