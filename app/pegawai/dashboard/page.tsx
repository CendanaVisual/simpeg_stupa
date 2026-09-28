'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera,
  MapPin,
  Clock,
  Calendar,
  FileText,
  User,
  LogOut,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Upload,
  Shield,
  Briefcase,
  Lock,
  Phone,
  Home,
  Eye,
  EyeOff,
  Coins,
  Sun,
  Moon
} from 'lucide-react';

export default function PegawaiDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'absen' | 'riwayat' | 'pengajuan' | 'profil'>('absen');
  const [loadingUser, setLoadingUser] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Office & GPS State
  const [kantor, setKantor] = useState<any>(null);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string>('');
  const [distanceMeter, setDistanceMeter] = useState<number | null>(null);

  // Camera & Selfie State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');

  // Attendance Today & History State (dengan Filter Bulan & Tahun - Point 2)
  const [todayAbsen, setTodayAbsen] = useState<{ masuk: any; pulang: any } | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [filterBulan, setFilterBulan] = useState(new Date().getMonth() + 1);
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear());
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submittingAbsen, setSubmittingAbsen] = useState(false);
  const [absenSuccessMsg, setAbsenSuccessMsg] = useState('');
  const [absenErrorMsg, setAbsenErrorMsg] = useState('');

  // Pengajuan State
  const [tipePengajuan, setTipePengajuan] = useState<'cuti_tahunan' | 'cuti_sakit' | 'dinas_luar'>('cuti_tahunan');
  const [tglMulai, setTglMulai] = useState('');
  const [tglSelesai, setTglSelesai] = useState('');
  const [alasan, setAlasan] = useState('');
  const [dokumenBase64, setDokumenBase64] = useState<string | null>(null);
  const [dokumenFileName, setDokumenFileName] = useState('');
  const [submittingPengajuan, setSubmittingPengajuan] = useState(false);
  const [pengajuanList, setPengajuanList] = useState<any[]>([]);
  const [pengajuanMsg, setPengajuanMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profil & Edit Data Pegawai State
  const [profileForm, setProfileForm] = useState({
    nama: '',
    no_hp: '',
    alamat: '',
  });
  const [fotoProfilBase64, setFotoProfilBase64] = useState<string | null>(null);
  const [fotoProfilPreview, setFotoProfilPreview] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Current Clock
  const [currentTime, setCurrentTime] = useState('');

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

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Session User & Profile
  const fetchUserProfile = () => {
    fetch('/api/pegawai/profile')
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then((data) => {
        setUser(data.profile);
        setProfileForm({
          nama: data.profile.nama || '',
          no_hp: data.profile.no_hp || '',
          alamat: data.profile.alamat || '',
        });
        setFotoProfilPreview(data.profile.foto_profil_url || null);
        setLoadingUser(false);
      })
      .catch(() => {
        router.push('/login');
      });
  };

  useEffect(() => {
    fetchUserProfile();
  }, [router]);

  // Fetch Kantor Settings
  useEffect(() => {
    fetch('/api/kantor')
      .then((res) => res.json())
      .then((data) => {
        if (data.kantor) setKantor(data.kantor);
      })
      .catch(console.error);
  }, []);

  // Fetch Today's Attendance
  const fetchTodayAbsensi = () => {
    fetch('/api/absensi?today=true')
      .then((res) => res.json())
      .then((data) => {
        setTodayAbsen({ masuk: data.masuk, pulang: data.pulang });
      })
      .catch(console.error);
  };

  // Fetch History with Month & Year Filters
  const fetchHistoryWithFilters = (m = filterBulan, y = filterTahun) => {
    setLoadingHistory(true);
    fetch(`/api/absensi?bulan=${m}&tahun=${y}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.history) setHistory(data.history);
        setLoadingHistory(false);
      })
      .catch(() => setLoadingHistory(false));
  };

  // Fetch My Pengajuan List
  const fetchPengajuan = () => {
    fetch('/api/pengajuan')
      .then((res) => res.json())
      .then((data) => {
        if (data.pengajuan) setPengajuanList(data.pengajuan);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchTodayAbsensi();
    fetchHistoryWithFilters();
    fetchPengajuan();
  }, []);

  // GPS Geolocation Handler
  const getDeviceLocation = () => {
    setGpsError('');
    if (!navigator.geolocation) {
      setGpsError('Perangkat Anda tidak mendukung fitur Geolocation GPS.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const currentCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setGpsCoords(currentCoords);

        if (kantor && kantor.latitude && kantor.longitude) {
          const dist = calculateHaversineDistance(
            currentCoords.lat,
            currentCoords.lng,
            parseFloat(kantor.latitude),
            parseFloat(kantor.longitude)
          );
          setDistanceMeter(Math.round(dist));
        }
      },
      (err) => {
        setGpsError(`Gagal memperoleh sinyal GPS: ${err.message}. Pastikan izin lokasi aktif.`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    getDeviceLocation();
  }, [kantor]);

  // Haversine formula calculation in client for UI feedback
  const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Camera Management
  const startCamera = async () => {
    setCameraActive(true);
    setCapturedImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacing },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      alert(`Kamera tidak dapat diakses: ${err.message}. Periksa izin peramban Anda.`);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  // Handle Attendance Submission
  const handleAbsenSubmit = async (tipe: 'masuk' | 'pulang') => {
    setAbsenSuccessMsg('');
    setAbsenErrorMsg('');

    if (!gpsCoords) {
      setAbsenErrorMsg('Koordinat GPS belum terdeteksi. Silakan klik tombol "Perbarui Lokasi GPS".');
      return;
    }

    if (!capturedImage) {
      setAbsenErrorMsg('Wajib mengambil foto selfie verifikasi wajah sebelum mengirim presensi!');
      return;
    }

    setSubmittingAbsen(true);

    try {
      const res = await fetch('/api/absensi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipe_absen: tipe,
          tipe: tipe,
          latitude: gpsCoords.lat,
          longitude: gpsCoords.lng,
          foto_base64: capturedImage,
          image_base64: capturedImage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal merekam presensi');
      }

      const statusText = data.data?.status
        ? data.data.status.replace('_', ' ').toUpperCase()
        : 'BERHASIL';
      const jarakText = data.data?.jarak_dari_kantor ?? data.jarak_dari_kantor;

      setAbsenSuccessMsg(
        `Presensi ${tipe.toUpperCase()} Berhasil! Status: ${statusText}${
          jarakText !== undefined && jarakText !== null ? ` (${jarakText}m dari kantor)` : ''
        }`
      );
      setCapturedImage(null);
      fetchTodayAbsensi();
      fetchHistoryWithFilters();
    } catch (err: any) {
      setAbsenErrorMsg(err.message);
    } finally {
      setSubmittingAbsen(false);
    }
  };

  // Handle Pengajuan Cuti / Dinas Submission
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran berkas maksimal 5MB');
        return;
      }
      setDokumenFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setDokumenBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitPengajuan = async (e: React.FormEvent) => {
    e.preventDefault();
    setPengajuanMsg(null);
    setSubmittingPengajuan(true);

    try {
      const res = await fetch('/api/pengajuan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipe_pengajuan: tipePengajuan,
          tanggal_mulai: tglMulai,
          tanggal_selesai: tglSelesai,
          alasan,
          dokumen_base64: dokumenBase64,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengirim pengajuan');

      setPengajuanMsg({
        type: 'success',
        text: `Pengajuan ${tipePengajuan.replace('_', ' ').toUpperCase()} berhasil dikirim (${data.jumlah_hari_kerja} hari kerja di luar Sabtu-Minggu). Menunggu persetujuan admin.`,
      });

      setTglMulai('');
      setTglSelesai('');
      setAlasan('');
      setDokumenBase64(null);
      setDokumenFileName('');
      fetchPengajuan();
      fetchUserProfile();
    } catch (err: any) {
      setPengajuanMsg({ type: 'error', text: err.message });
    } finally {
      setSubmittingPengajuan(false);
    }
  };

  // Profile Picture File Upload Handler
  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('Ukuran foto profil maksimal 3MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setFotoProfilBase64(result);
        setFotoProfilPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Profile & Password Change
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    if (newPassword && newPassword !== confirmPassword) {
      setProfileMsg({ type: 'error', text: 'Konfirmasi kata sandi baru tidak cocok!' });
      return;
    }

    if (newPassword && !currentPassword) {
      setProfileMsg({ type: 'error', text: 'Wajib memasukkan kata sandi saat ini untuk mengubah sandi.' });
      return;
    }

    setSavingProfile(true);

    try {
      const res = await fetch('/api/pegawai/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: profileForm.nama,
          no_hp: profileForm.no_hp,
          alamat: profileForm.alamat,
          foto_profil_base64: fotoProfilBase64,
          foto_base64: fotoProfilBase64,
          image_base64: fotoProfilBase64,
          current_password: currentPassword || undefined,
          new_password: newPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan profil');

      setProfileMsg({ type: 'success', text: 'Foto profil dan biodata Anda berhasil diperbarui!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setFotoProfilBase64(null);

      // Segera mutasikan state agar foto langsung tampil seketika di samping nama pegawai
      if (data.profile) {
        setUser(data.profile);
        setFotoProfilPreview(data.profile.foto_profil_url || null);
      } else if (fotoProfilPreview) {
        setUser((prev: any) => ({ ...prev, foto_profil_url: fotoProfilPreview }));
      }

      fetchUserProfile();
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

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

  const isWithinRadius = distanceMeter !== null && distanceMeter <= (kantor?.radius_meter || 100);

  const totalDendaBulanIni = history.reduce((acc, h) => {
    const totalMenit = (h.waktu_terlambat || 0) + (h.waktu_mendahului || 0);
    return acc + totalMenit * 500;
  }, 0);

  return (
    <div
      className={`min-h-screen pb-16 transition-colors duration-300 ${
        darkMode
          ? 'bg-slate-950 text-slate-100'
          : 'bg-gradient-to-br from-[#87CEEB]/20 via-sky-50 to-blue-50/50 text-slate-800'
      }`}
    >
      {/* Header Bar */}
      <header
        className={`sticky top-0 z-30 transition-colors duration-300 ${
          darkMode
            ? 'bg-slate-900 border-b border-slate-800'
            : 'bg-white/90 backdrop-blur-md border-b border-sky-200/80 shadow-sm'
        }`}
      >
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
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
                Sistem Manajemen Pegawai STUPA
              </h1>
              <p
                className={`text-xs ${
                  darkMode ? 'text-slate-400' : 'text-sky-800/80'
                }`}
              >
                Portal Presensi Pegawai
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition cursor-pointer ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-sky-300 hover:bg-slate-700'
                  : 'bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100 shadow-sm'
              }`}
              title={darkMode ? 'Beralih ke Tema Biru Langit' : 'Beralih ke Tema Gelap'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-600" />}
              <span className="hidden sm:inline">{darkMode ? 'Tema Terang' : 'Tema Gelap'}</span>
            </button>

            <div className="flex items-center gap-2.5">
              <div className="relative flex-shrink-0">
                {user?.foto_profil_url ? (
                  <img
                    src={user.foto_profil_url}
                    alt={user.nama}
                    className="w-9 h-9 rounded-full object-cover border-2 border-sky-400 shadow-sm"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-sky-100 dark:bg-slate-800 border-2 border-sky-400 flex items-center justify-center text-sky-600 dark:text-sky-400 font-bold text-xs">
                    {user?.nama ? user.nama.substring(0, 2).toUpperCase() : 'ST'}
                  </div>
                )}
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span
                  className={`text-sm font-semibold leading-tight ${
                    darkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {user?.nama}
                </span>
                <span className="text-xs text-sky-600 dark:text-sky-400 font-medium">
                  {user?.jabatan || 'Pegawai'}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-medium transition cursor-pointer ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-rose-600'
              }`}
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Profile & Quota Summary Banner */}
      <div className="max-w-5xl mx-auto px-4 mt-4">
        <div
          className={`border rounded-2xl p-4 sm:p-5 shadow-sm flex flex-wrap items-center justify-between gap-4 transition ${
            darkMode
              ? 'bg-slate-900 border-slate-800'
              : 'bg-white border-sky-200/80 shadow-sky-100'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="relative">
              {user?.foto_profil_url ? (
                <img
                  src={user.foto_profil_url}
                  alt={user.nama}
                  className="w-13 h-13 rounded-full object-cover border-2 border-sky-500 shadow"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-sky-100 dark:bg-slate-800 border-2 border-sky-500 flex items-center justify-center text-sky-600 dark:text-sky-400">
                  <User className="w-6 h-6" />
                </div>
              )}
            </div>
            <div>
              <div className="text-xs text-slate-500">NIP: {user?.nip || '-'}</div>
              <div className={`text-base sm:text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {user?.nama}
              </div>
              <div className="text-xs text-slate-500">{user?.email}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`border rounded-xl px-4 py-2 text-center transition ${
                darkMode
                  ? 'bg-slate-800/90 border-slate-700/60'
                  : 'bg-sky-50/60 border-sky-100'
              }`}
            >
              <div className="text-xs text-slate-500 font-medium">Sisa Cuti Tahunan</div>
              <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {user?.sisa_cuti_tahunan ?? 12} <span className="text-xs font-normal text-slate-500">Hari</span>
              </div>
            </div>

            <div
              className={`border rounded-xl px-4 py-2 text-center transition ${
                darkMode
                  ? 'bg-slate-800/90 border-slate-700/60'
                  : 'bg-sky-50/60 border-sky-100'
              }`}
            >
              <div className="text-xs text-slate-500 font-medium">Jam Server</div>
              <div className="text-xl font-extrabold text-sky-600 dark:text-sky-400 font-mono">
                {currentTime || '--:--:--'}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          className={`flex border rounded-2xl p-1.5 mt-6 gap-2 sm:gap-4 overflow-x-auto transition ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-sky-200/80 shadow-sm'
          }`}
        >
          <button
            onClick={() => setActiveTab('absen')}
            className={`py-2 px-3.5 text-xs sm:text-sm font-bold flex items-center gap-2 rounded-xl transition whitespace-nowrap cursor-pointer ${
              activeTab === 'absen'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25'
                : darkMode
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-600 hover:text-sky-800 hover:bg-sky-50'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Presensi Mandiri</span>
          </button>
          <button
            onClick={() => setActiveTab('riwayat')}
            className={`py-2 px-3.5 text-xs sm:text-sm font-bold flex items-center gap-2 rounded-xl transition whitespace-nowrap cursor-pointer ${
              activeTab === 'riwayat'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25'
                : darkMode
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-600 hover:text-sky-800 hover:bg-sky-50'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Riwayat Absensi</span>
          </button>
          <button
            onClick={() => setActiveTab('pengajuan')}
            className={`py-2 px-3.5 text-xs sm:text-sm font-bold flex items-center gap-2 rounded-xl transition whitespace-nowrap cursor-pointer ${
              activeTab === 'pengajuan'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25'
                : darkMode
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-600 hover:text-sky-800 hover:bg-sky-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Pengajuan Cuti & Dinas</span>
          </button>
          <button
            onClick={() => setActiveTab('profil')}
            className={`py-2 px-3.5 text-xs sm:text-sm font-bold flex items-center gap-2 rounded-xl transition whitespace-nowrap cursor-pointer ${
              activeTab === 'profil'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25'
                : darkMode
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-600 hover:text-sky-800 hover:bg-sky-50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profil Saya & Ubah Sandi</span>
          </button>
        </div>

        {/* TAB 1: PRESENSI MANDIRI */}
        {activeTab === 'absen' && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div
              className={`lg:col-span-7 border rounded-3xl p-5 sm:p-6 shadow-sm transition ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-sky-200/80'
              }`}
            >
              <h2
                className={`text-base font-bold mb-3 flex items-center gap-2 ${
                  darkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                <Camera className="w-5 h-5 text-sky-500" />
                <span>Kamera Presensi & Geofencing GPS</span>
              </h2>

              {/* Status Radius Geofencing */}
              <div
                className={`mb-4 p-3.5 rounded-2xl border flex items-center justify-between text-xs transition ${
                  isWithinRadius
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <div>
                    <div className="font-bold">
                      {isWithinRadius
                        ? `Di Dalam Radius Kantor (${distanceMeter}m)`
                        : distanceMeter !== null
                        ? `Di Luar Radius Kantor (${distanceMeter}m)`
                        : 'Mendeteksi Lokasi GPS...'}
                    </div>
                    <div className="text-[11px] opacity-80">
                      Batas radius: {kantor?.radius_meter || 100}m dari kantor pusat STUPA
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={getDeviceLocation}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    darkMode ? 'bg-slate-800 hover:bg-slate-700 text-sky-300' : 'bg-white hover:bg-sky-50 text-sky-700 shadow-sm'
                  }`}
                  title="Perbarui GPS"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {gpsError && (
                <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{gpsError}</span>
                </div>
              )}

              {/* Viewfinder Camera Section */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-[4/3] flex items-center justify-center border border-slate-700">
                {cameraActive ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 border-2 border-dashed border-sky-400/50 rounded-2xl m-4 pointer-events-none" />
                  </>
                ) : capturedImage ? (
                  <img
                    src={capturedImage}
                    alt="Selfie Presensi"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-6 text-slate-400">
                    <Camera className="w-12 h-12 mx-auto mb-2 text-sky-500 opacity-60" />
                    <p className="text-xs">Klik tombol di bawah untuk mengaktifkan kamera selfie.</p>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Camera Actions */}
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {!cameraActive && !capturedImage && (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow transition cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Buka Kamera Verifikasi</span>
                  </button>
                )}

                {cameraActive && (
                  <>
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow transition cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Ambil Foto Selfie</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      Batal
                    </button>
                  </>
                )}

                {capturedImage && (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Foto Ulang</span>
                  </button>
                )}
              </div>

              {/* Notification Alerts */}
              {absenSuccessMsg && (
                <div className="mt-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{absenSuccessMsg}</span>
                </div>
              )}

              {absenErrorMsg && (
                <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{absenErrorMsg}</span>
                </div>
              )}

              {/* Submission Buttons */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={submittingAbsen || !!todayAbsen?.masuk}
                  onClick={() => handleAbsenSubmit('masuk')}
                  className="py-3 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Clock className="w-4 h-4" />
                  <span>{todayAbsen?.masuk ? 'Sudah Absen Masuk' : 'Kirim Absen Masuk'}</span>
                </button>

                <button
                  type="button"
                  disabled={submittingAbsen || !todayAbsen?.masuk || !!todayAbsen?.pulang}
                  onClick={() => handleAbsenSubmit('pulang')}
                  className="py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{todayAbsen?.pulang ? 'Sudah Absen Pulang' : 'Kirim Absen Pulang'}</span>
                </button>
              </div>
            </div>

            {/* Attendance Status Today & Policy Notes */}
            <div className="lg:col-span-5 space-y-4">
              <div
                className={`border rounded-3xl p-5 shadow-sm space-y-4 transition ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-sky-200/80'
                }`}
              >
                <h3
                  className={`text-sm font-bold flex items-center gap-2 ${
                    darkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  <Clock className="w-4 h-4 text-sky-500" />
                  <span>Status Presensi Hari Ini</span>
                </h3>

                <div
                  className={`p-4 rounded-2xl border transition ${
                    darkMode ? 'bg-slate-850 border-slate-800' : 'bg-sky-50/50 border-sky-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Presensi Masuk
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                        todayAbsen?.masuk
                          ? todayAbsen.masuk.status === 'tepat_waktu'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {todayAbsen?.masuk
                        ? todayAbsen.masuk.status.replace('_', ' ').toUpperCase()
                        : 'Belum Absen'}
                    </span>
                  </div>

                  {todayAbsen?.masuk ? (
                    <div className="flex items-center gap-3">
                      {todayAbsen.masuk.url_foto_cloudinary && (
                        <img
                          src={todayAbsen.masuk.url_foto_cloudinary}
                          alt="Foto Masuk"
                          className="w-12 h-12 rounded-xl object-cover border border-sky-200 dark:border-slate-700"
                        />
                      )}
                      <div>
                        <div className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          Pukul{' '}
                          {new Date(todayAbsen.masuk.waktu_absen).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          WITA
                        </div>
                        <div className="text-xs text-slate-500">
                          {todayAbsen.masuk.waktu_terlambat > 0 ? (
                            <span className="text-rose-600 dark:text-rose-400 font-semibold">
                              Terlambat {todayAbsen.masuk.waktu_terlambat} menit (-Rp{' '}
                              {(todayAbsen.masuk.waktu_terlambat * 500).toLocaleString('id-ID')})
                            </span>
                          ) : (
                            'Tepat Waktu'
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Ambil selfie dan klik Absen Masuk.</p>
                  )}
                </div>

                <div
                  className={`p-4 rounded-2xl border transition ${
                    darkMode ? 'bg-slate-850 border-slate-800' : 'bg-sky-50/50 border-sky-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Presensi Pulang
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                        todayAbsen?.pulang
                          ? todayAbsen.pulang.status === 'tepat_waktu'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {todayAbsen?.pulang
                        ? todayAbsen.pulang.status.replace('_', ' ').toUpperCase()
                        : 'Belum Absen'}
                    </span>
                  </div>

                  {todayAbsen?.pulang ? (
                    <div className="flex items-center gap-3">
                      {todayAbsen.pulang.url_foto_cloudinary && (
                        <img
                          src={todayAbsen.pulang.url_foto_cloudinary}
                          alt="Foto Pulang"
                          className="w-12 h-12 rounded-xl object-cover border border-sky-200 dark:border-slate-700"
                        />
                      )}
                      <div>
                        <div className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          Pukul{' '}
                          {new Date(todayAbsen.pulang.waktu_absen).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          WITA
                        </div>
                        <div className="text-xs text-slate-500">
                          {todayAbsen.pulang.waktu_mendahului > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold">
                              Mendahului {todayAbsen.pulang.waktu_mendahului} menit (-Rp{' '}
                              {(todayAbsen.pulang.waktu_mendahului * 500).toLocaleString('id-ID')})
                            </span>
                          ) : (
                            'Sesuai Jam Kerja'
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Tersedia pada jadwal jam pulang.</p>
                  )}
                </div>
              </div>

              {/* Office Policy Card */}
              <div
                className={`border rounded-3xl p-5 shadow-sm text-xs space-y-2 transition ${
                  darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-sky-200/80 text-slate-600'
                }`}
              >
                <div className={`font-semibold flex items-center gap-1.5 ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                  <Shield className="w-4 h-4 text-sky-500" />
                  <span>Jadwal & Ketentuan Presensi STUPA:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>Mulai Absen Masuk: {kantor?.jam_masuk_mulai?.substring(0, 5) || '06:30'} WITA</li>
                  <li>Batas Akhir Masuk: {kantor?.jam_masuk_akhir?.substring(0, 5) || '07:30'} WITA (Lewat = Terlambat)</li>
                  <li>Pulang Senin-Kamis: Mulai {kantor?.jam_pulang_senin_kamis_mulai?.substring(0, 5) || '15:30'} WITA</li>
                  <li>Pulang Hari Jumat: Mulai {kantor?.jam_pulang_jumat_mulai?.substring(0, 5) || '13:00'} WITA</li>
                  <li>Batas Akhir Pulang: {kantor?.jam_pulang_akhir?.substring(0, 5) || '18:00'} WITA (Sistem Tertutup)</li>
                  <li>Denda Disiplin: potongan per menit keterlambatan / kepulangan mendahului.</li>
                  <li>Radius Geofencing: Maksimal {kantor?.radius_meter || 100} meter dari kantor.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RIWAYAT ABSENSI DENGAN FILTER BULAN & TAHUN */}
        {activeTab === 'riwayat' && (
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
                  <Clock className="w-5 h-5 text-sky-500" />
                  <span>Riwayat Presensi Pegawai</span>
                </h2>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Lihat riwayat kehadiran Anda berdasarkan bulan dan tahun.
                </p>
              </div>

              {/* Filters Bulan & Tahun */}
              <div className="flex items-center gap-2">
                <select
                  value={filterBulan}
                  onChange={(e) => {
                    const b = parseInt(e.target.value);
                    setFilterBulan(b);
                    fetchHistoryWithFilters(b, filterTahun);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium focus:outline-none ${
                    darkMode ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-sky-50 border border-sky-200 text-slate-800'
                  }`}
                >
                  {bulanOptions.map((b) => (
                    <option key={b.val} value={b.val}>
                      {b.label}
                    </option>
                  ))}
                </select>

                <select
                  value={filterTahun}
                  onChange={(e) => {
                    const y = parseInt(e.target.value);
                    setFilterTahun(y);
                    fetchHistoryWithFilters(filterBulan, y);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium focus:outline-none ${
                    darkMode ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-sky-50 border border-sky-200 text-slate-800'
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

            {/* Denda Summary Badge Bulan Terpilih */}
            <div
              className={`mb-4 p-3.5 rounded-2xl border flex items-center justify-between text-xs transition ${
                darkMode ? 'bg-slate-850 border-slate-800' : 'bg-sky-50/50 border-sky-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                  Total Potongan Keterlambatan Bulan Ini:
                </span>
              </div>
              <div className="font-bold text-rose-600 dark:text-rose-400">
                Rp {totalDendaBulanIni.toLocaleString('id-ID')}
              </div>
            </div>

            {loadingHistory ? (
              <div className="py-12 text-center text-slate-500 text-xs">Memuat data riwayat presensi...</div>
            ) : history.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Tidak ada rekaman presensi pada bulan ini.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-sky-100 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead
                    className={`uppercase font-semibold border-b ${
                      darkMode
                        ? 'bg-slate-800/80 text-slate-400 border-slate-800'
                        : 'bg-sky-100/70 text-sky-900 border-sky-200'
                    }`}
                  >
                    <tr>
                      <th className="py-3 px-4">Foto Verifikasi</th>
                      <th className="py-3 px-4">Waktu Presensi</th>
                      <th className="py-3 px-4">Tipe</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Jarak GPS</th>
                      <th className="py-3 px-4 text-right">Potongan Denda</th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y ${
                      darkMode ? 'divide-slate-800 text-slate-300' : 'divide-sky-100 text-slate-700'
                    }`}
                  >
                    {history.map((h) => {
                      const totalMenit = (h.waktu_terlambat || 0) + (h.waktu_mendahului || 0);
                      const denda = totalMenit * 500;
                      return (
                        <tr
                          key={h.id}
                          className={`transition ${darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-sky-50/50'}`}
                        >
                          <td className="py-3 px-4">
                            {h.url_foto_cloudinary ? (
                              <a href={h.url_foto_cloudinary} target="_blank" rel="noreferrer">
                                <img
                                  src={h.url_foto_cloudinary}
                                  alt="Selfie"
                                  className="w-10 h-10 rounded-xl object-cover border border-sky-200 dark:border-slate-700 shadow-sm"
                                />
                              </a>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                              {new Date(h.waktu_absen).toLocaleDateString('id-ID', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {new Date(h.waktu_absen).toLocaleTimeString('id-ID')} WITA
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold uppercase">{h.tipe_absen}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                h.status === 'tepat_waktu'
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                  : h.status === 'terlambat'
                                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                  : h.status === 'mendahului'
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                  : 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                              }`}
                            >
                              {h.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4">{h.jarak_dari_kantor ? `${h.jarak_dari_kantor} m` : '-'}</td>
                          <td className="py-3 px-4 text-right font-medium">
                            {totalMenit > 0 ? (
                              <span className="text-rose-600 dark:text-rose-400 font-bold">
                                -Rp {denda.toLocaleString('id-ID')}{' '}
                                <span className="text-[10px] text-slate-400 font-normal">({totalMenit}m)</span>
                              </span>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400">Rp 0</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PENGAJUAN CUTI & DINAS */}
        {activeTab === 'pengajuan' && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div
              className={`lg:col-span-5 border rounded-3xl p-5 sm:p-6 shadow-sm transition ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-sky-200/80'
              }`}
            >
              <h2
                className={`text-base font-bold mb-4 flex items-center gap-2 ${
                  darkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                <FileText className="w-5 h-5 text-sky-500" />
                <span>Form Pengajuan</span>
              </h2>

              {pengajuanMsg && (
                <div
                  className={`mb-4 p-3 rounded-xl text-xs flex items-start gap-2 ${
                    pengajuanMsg.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300'
                  }`}
                >
                  {pengajuanMsg.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  )}
                  <span>{pengajuanMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleSubmitPengajuan} className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                    Tipe Pengajuan
                  </label>
                  <select
                    value={tipePengajuan}
                    onChange={(e: any) => setTipePengajuan(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                      darkMode ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-sky-50/50 border border-sky-200 text-slate-800'
                    }`}
                  >
                    <option value="cuti_tahunan">Cuti Tahunan</option>
                    <option value="cuti_sakit">Cuti Sakit</option>
                    <option value="dinas_luar">Dinas Luar</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                      Tanggal Mulai
                    </label>
                    <input
                      type="date"
                      required
                      value={tglMulai}
                      onChange={(e) => setTglMulai(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                        darkMode ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-sky-50/50 border border-sky-200 text-slate-800'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                      Tanggal Selesai
                    </label>
                    <input
                      type="date"
                      required
                      value={tglSelesai}
                      onChange={(e) => setTglSelesai(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                        darkMode ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-sky-50/50 border border-sky-200 text-slate-800'
                      }`}
                    />
                  </div>
                </div>

                {tipePengajuan === 'cuti_tahunan' && (
                  <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-700 dark:text-sky-300 text-[11px]">
                    ℹ️ Kuota cuti Anda tersisa: <strong>{user?.sisa_cuti_tahunan} hari</strong>. Sabtu & Minggu tidak memotong kuota.
                  </div>
                )}

                {(tipePengajuan === 'cuti_sakit' || tipePengajuan === 'dinas_luar') && (
                  <div>
                    <label className="block font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                      Unggah Berkas Pendukung (Surat Dokter / Surat Tugas) *
                    </label>
                    <div
                      className={`border-2 border-dashed rounded-xl p-3 text-center transition ${
                        darkMode
                          ? 'border-slate-700 bg-slate-800/50 hover:bg-slate-800'
                          : 'border-sky-200 bg-sky-50/40 hover:bg-sky-50'
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        required
                        onChange={handleFileChange}
                        className="hidden"
                        id="dokumen-upload"
                      />
                      <label htmlFor="dokumen-upload" className="cursor-pointer flex flex-col items-center">
                        <Upload className="w-5 h-5 text-sky-500 mb-1" />
                        <span className="text-xs text-sky-600 dark:text-sky-400 font-semibold">Pilih Berkas / Foto</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          {dokumenFileName || 'PNG, JPG, PDF (Maks 5MB)'}
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                    Alasan / Keterangan
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={alasan}
                    onChange={(e) => setAlasan(e.target.value)}
                    placeholder="Tuliskan keterangan detail pengajuan..."
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                      darkMode
                        ? 'bg-slate-800 border border-slate-700 text-white placeholder-slate-500'
                        : 'bg-sky-50/50 border border-sky-200 text-slate-800 placeholder-slate-400'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingPengajuan}
                  className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold rounded-xl text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {submittingPengajuan ? 'Mengirim Pengajuan...' : 'Kirim Pengajuan'}
                </button>
              </form>
            </div>

            <div
              className={`lg:col-span-7 border rounded-3xl p-5 sm:p-6 shadow-sm transition ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-sky-200/80'
              }`}
            >
              <h2
                className={`text-base font-bold mb-4 flex items-center gap-2 ${
                  darkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                <Briefcase className="w-5 h-5 text-sky-500" />
                <span>Riwayat & Status Pengajuan Anda</span>
              </h2>

              {pengajuanList.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Belum ada pengajuan cuti atau dinas yang diajukan.
                </div>
              ) : (
                <div className="space-y-3">
                  {pengajuanList.map((p: any) => (
                    <div
                      key={p.id}
                      className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition ${
                        darkMode ? 'bg-slate-850 border-slate-800' : 'bg-sky-50/40 border-sky-100'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {p.tipe_pengajuan.replace('_', ' ').toUpperCase()}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.status_approval === 'approved'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : p.status_approval === 'rejected'
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {p.status_approval.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-slate-500">
                          {p.tanggal_mulai} s/d {p.tanggal_selesai} ({p.jumlah_hari_kerja} Hari Kerja)
                        </div>
                        <div className={`mt-1 italic ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          "{p.alasan}"
                        </div>
                        {p.catatan_admin && (
                          <div className="text-sky-600 dark:text-sky-300 mt-1 text-[11px]">
                            Catatan Admin: {p.catatan_admin}
                          </div>
                        )}
                      </div>

                      {p.url_dokumen_pendukung_cloudinary && (
                        <a
                          href={p.url_dokumen_pendukung_cloudinary}
                          target="_blank"
                          rel="noreferrer"
                          className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 text-xs transition whitespace-nowrap cursor-pointer ${
                            darkMode
                              ? 'bg-slate-800 hover:bg-slate-700 text-sky-400 border-slate-700'
                              : 'bg-white hover:bg-sky-50 text-sky-700 border-sky-200 shadow-sm'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Lihat Berkas</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: PROFIL SAYA & EDIT DATA DIRI BESERTA UBAH SANDI */}
        {activeTab === 'profil' && (
          <div
            className={`mt-6 max-w-2xl mx-auto border rounded-3xl p-5 sm:p-7 shadow-sm transition ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-sky-200/80'
            }`}
          >
            <h2
              className={`text-base font-bold mb-2 flex items-center gap-2 ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              <User className="w-5 h-5 text-sky-500" />
              <span>Pengaturan Profil Pegawai & Kata Sandi</span>
            </h2>
            <p className={`text-xs mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Perbarui biodata kontak, foto profil, atau ganti kata sandi login akun Anda secara mandiri.
            </p>

            {profileMsg && (
              <div
                className={`mb-5 p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                  profileMsg.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300'
                }`}
              >
                {profileMsg.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-5 text-xs">
              {/* Photo Upload Section */}
              <div
                className={`flex flex-col sm:flex-row items-center gap-4 pb-5 border-b ${
                  darkMode ? 'border-slate-800' : 'border-sky-100'
                }`}
              >
                <div className="relative">
                  {fotoProfilPreview ? (
                    <img
                      src={fotoProfilPreview}
                      alt="Foto Profil"
                      className="w-20 h-20 rounded-full object-cover border-2 border-sky-500 shadow-md"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-sky-100 dark:bg-slate-800 border-2 border-sky-500 flex items-center justify-center text-sky-600 dark:text-sky-400 text-2xl font-bold">
                      {profileForm.nama.substring(0, 2).toUpperCase() || 'ST'}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 text-center sm:text-left">
                  <div className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    Foto Profil Pegawai
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Format file JPG, PNG maks 3MB. Disimpan aman di Cloudinary.
                  </p>
                  <div>
                    <input
                      type="file"
                      id="profile-pic"
                      accept="image/*"
                      onChange={handleProfilePhotoChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="profile-pic"
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-xl font-semibold cursor-pointer transition ${
                        darkMode
                          ? 'bg-slate-800 border-slate-700 text-sky-300 hover:bg-slate-700'
                          : 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100 shadow-sm'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Pilih Foto Baru</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Biodata Fields */}
              <div className="space-y-3.5">
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.nama}
                    onChange={(e) => setProfileForm({ ...profileForm, nama: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                      darkMode ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-sky-50/50 border border-sky-200 text-slate-800'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                      Nomor HP / WhatsApp
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={profileForm.no_hp}
                        onChange={(e) => setProfileForm({ ...profileForm, no_hp: e.target.value })}
                        placeholder="081234567890"
                        className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                          darkMode ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-sky-50/50 border border-sky-200 text-slate-800'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                      Alamat Tinggal
                    </label>
                    <div className="relative">
                      <Home className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={profileForm.alamat}
                        onChange={(e) => setProfileForm({ ...profileForm, alamat: e.target.value })}
                        placeholder="Denpasar, Bali"
                        className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                          darkMode ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-sky-50/50 border border-sky-200 text-slate-800'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Change Box */}
              <div
                className={`pt-5 border-t space-y-3.5 ${
                  darkMode ? 'border-slate-800' : 'border-sky-100'
                }`}
              >
                <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold">
                  <Lock className="w-4 h-4" />
                  <span>Ubah Kata Sandi (Kosongkan jika tidak ingin mengubah)</span>
                </div>

                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                    Kata Sandi Saat Ini
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Masukkan kata sandi lama Anda"
                      className={`w-full px-3.5 pr-10 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                        darkMode ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-sky-50/50 border border-sky-200 text-slate-800'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                      Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        className={`w-full px-3.5 pr-10 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                          darkMode ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-sky-50/50 border border-sky-200 text-slate-800'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                      Konfirmasi Sandi Baru
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang kata sandi baru"
                      className={`w-full px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                        darkMode ? 'bg-slate-800 border border-slate-700 text-white' : 'bg-sky-50/50 border border-sky-200 text-slate-800'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {savingProfile ? 'Menyimpan Perubahan...' : 'Simpan Perubahan Profil'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
