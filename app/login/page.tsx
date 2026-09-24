'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, AlertCircle, MapPin, Camera, ShieldCheck, Eye, EyeOff, Sun, Moon } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [darkMode, setDarkMode] = useState(false);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login gagal, periksa NIP/Email dan sandi Anda');
      }

      // Redirect berdasarkan role
      if (data.user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/pegawai/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-center items-center p-4 relative overflow-hidden transition-colors duration-300 ${
        darkMode
          ? 'bg-slate-950 text-slate-100'
          : 'bg-gradient-to-br from-[#87CEEB]/30 via-sky-50 to-blue-100/60 text-slate-800'
      }`}
    >
      {/* Background Soft Glow Accents */}
      <div
        className={`absolute top-[-10%] left-[-10%] w-[32rem] h-[32rem] rounded-full blur-3xl pointer-events-none transition-opacity duration-500 ${
          darkMode ? 'bg-sky-500/10' : 'bg-[#87CEEB]/40'
        }`}
      />
      <div
        className={`absolute bottom-[-10%] right-[-10%] w-[32rem] h-[32rem] rounded-full blur-3xl pointer-events-none transition-opacity duration-500 ${
          darkMode ? 'bg-blue-600/10' : 'bg-sky-200/50'
        }`}
      />

      {/* Top Bar with Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleTheme}
          type="button"
          className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold shadow-sm transition-all cursor-pointer ${
            darkMode
              ? 'bg-slate-900 border-slate-800 text-sky-300 hover:bg-slate-800'
              : 'bg-white/90 border-sky-200 text-sky-800 hover:bg-white shadow-sky-100'
          }`}
          title={darkMode ? 'Beralih ke Tema Terang (Biru Langit)' : 'Beralih ke Tema Gelap'}
        >
          {darkMode ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Tema Terang</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-sky-600" />
              <span className="hidden sm:inline">Tema Gelap</span>
            </>
          )}
        </button>
      </div>

      <div className="w-full max-w-md z-10">
        {/* Header Branding with Official School Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-2 mb-3">
            <img
              src="/logo.png"
              alt="Logo Resmi STUPA"
              className="w-24 h-24 object-contain drop-shadow-md transition-transform hover:scale-105 duration-200"
            />
          </div>
          <h1
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            SIMPEG STUPA
          </h1>
          <p
            className={`text-sm mt-1 font-medium ${
              darkMode ? 'text-slate-400' : 'text-sky-800/80'
            }`}
          >
            Sistem Informasi Presensi & Manajemen Pegawai
          </p>
        </div>

        {/* Login Card */}
        <div
          className={`backdrop-blur-xl border rounded-3xl p-6 sm:p-8 shadow-2xl transition-all duration-300 ${
            darkMode
              ? 'bg-slate-900/90 border-slate-800 shadow-black/50'
              : 'bg-white/95 border-sky-200/90 shadow-sky-200/40'
          }`}
        >
          <div
            className={`flex items-center justify-between mb-6 pb-4 border-b ${
              darkMode ? 'border-slate-800' : 'border-sky-100'
            }`}
          >
            <div>
              <h2
                className={`text-lg font-bold ${
                  darkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                Portal Masuk
              </h2>
              <p
                className={`text-xs ${
                  darkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Akses Pegawai & Administrator
              </p>
            </div>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              SIAP PAKAI
            </span>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-600 dark:text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                className={`block text-xs font-bold mb-1.5 ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                NIP, Email, atau Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sky-600/70 dark:text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Masukkan NIP atau Email akun Anda"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                    darkMode
                      ? 'bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500'
                      : 'bg-sky-50/50 border border-sky-200 text-slate-900 placeholder-slate-400 focus:bg-white'
                  }`}
                />
              </div>
            </div>

            <div>
              <label
                className={`block text-xs font-bold mb-1.5 ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sky-600/70 dark:text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-11 py-2.5 rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                    darkMode
                      ? 'bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500'
                      : 'bg-sky-50/50 border border-sky-200 text-slate-900 placeholder-slate-400 focus:bg-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute inset-y-0 right-0 pr-3.5 flex items-center transition focus:outline-none cursor-pointer ${
                    darkMode
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-400 hover:text-sky-600'
                  }`}
                  title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Sistem</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security & Architecture Highlights */}
        <div className="mt-6 grid grid-cols-3 gap-2.5 text-center text-xs">
          <div
            className={`p-2.5 rounded-xl border flex flex-col items-center transition ${
              darkMode
                ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                : 'bg-white/80 border-sky-100 text-slate-600 shadow-sm'
            }`}
          >
            <MapPin className="w-4 h-4 text-sky-500 mb-1" />
            <span className="font-medium">Geofencing GPS</span>
          </div>
          <div
            className={`p-2.5 rounded-xl border flex flex-col items-center transition ${
              darkMode
                ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                : 'bg-white/80 border-sky-100 text-slate-600 shadow-sm'
            }`}
          >
            <Camera className="w-4 h-4 text-emerald-500 mb-1" />
            <span className="font-medium">Cloudinary Snap</span>
          </div>
          <div
            className={`p-2.5 rounded-xl border flex flex-col items-center transition ${
              darkMode
                ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                : 'bg-white/80 border-sky-100 text-slate-600 shadow-sm'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-500 mb-1" />
            <span className="font-medium">Neon Postgres</span>
          </div>
        </div>
      </div>
    </div>
  );
}
