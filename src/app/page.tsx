'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Zap, Users, ArrowRight } from 'lucide-react';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setIsLoggedIn(true);
        setUserRole(user.role);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);
  return (
    <div className="min-h-screen bg-[#F3FAF9] font-sans overflow-x-hidden">

      {/* Navbar */}
      <nav className="w-full fixed top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <h1 className="text-3xl font-extrabold text-[#2C8582] tracking-tight">BREAKING NEWS</h1>
            <div className="flex items-center space-x-4">
              {isLoggedIn ? (
                <>
                  <Link href={userRole === 'admin' || userRole === 'super_admin' ? "/admin" : "/dashboard"} className="bg-[#2C8582] text-white px-6 py-2.5 rounded-full font-bold hover:bg-[#48CCC4] transition-colors shadow-sm">
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      localStorage.removeItem('token');
                      localStorage.removeItem('user');
                      setIsLoggedIn(false);
                      setUserRole('');
                    }}
                    className="text-gray-600 font-bold hover:text-red-500 transition-colors hidden sm:block"
                  >
                    Keluar
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-gray-600 font-bold hover:text-[#2C8582] transition-colors hidden sm:block">
                    Masuk
                  </Link>
                  <Link href="/register" className="bg-[#2C8582] text-white px-6 py-2.5 rounded-full font-bold hover:bg-[#48CCC4] transition-colors shadow-sm">
                    Daftar Sekarang
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-16 sm:pt-40 sm:pb-24 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center space-x-2 bg-[#E0F4F3] text-[#2C8582] px-4 py-2 rounded-full font-bold text-sm mb-6">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2C8582] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#2C8582]"></span>
            </span>
            <span>Platform Pengaduan Desa #1</span>
          </div>
          <h2 className="text-5xl sm:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
            Mari Bersama Bangun <br />
            <span className="text-[#2C8582]">Desa Yang Lebih Baik.</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            BREAKING NEWS adalah sosial media pengaduan masyarakat. Laporkan fasilitas rusak, jalan berlubang, atau masalah lingkungan langsung ke pemerintah desa secara transparan.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Link href={isLoggedIn ? (userRole === 'admin' || userRole === 'super_admin' ? "/admin" : "/dashboard") : "/register"} className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-[#2C8582] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-[#48CCC4] transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
              <span>Mulai Lapor Sekarang</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href={isLoggedIn ? (userRole === 'admin' || userRole === 'super_admin' ? "/admin" : "/dashboard") : "/login"} className="w-full sm:w-auto flex items-center justify-center bg-white text-[#2C8582] border-2 border-[#2C8582] px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-50 transition-all">
              Jelajahi Laporan
            </Link>
          </div>
        </div>

        {/* Hero Mockup / Illustration (Abstract representation) */}
        <div className="flex-1 w-full max-w-lg lg:max-w-none relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#98A68E] to-[#D9B4B0] rounded-full blur-3xl opacity-20 animate-pulse"></div>
          <div className="relative bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 transform rotate-2 hover:rotate-0 transition-transform duration-500">
            {/* Mock Post */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-[#E0F4F3] rounded-full flex items-center justify-center text-[#2C8582] font-bold text-xl">B</div>
              <div>
                <h4 className="font-bold text-gray-900">Yanto</h4>
                <p className="text-sm text-gray-500">Baru saja</p>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Lampu Jalan Mati di RT 04</h3>
            <p className="text-gray-600 mb-4">Mohon bantuannya pak, sudah 3 hari lampu jalan utama mati, sangat gelap dan rawan kecelakaan.</p>
            <div className="w-full h-48 bg-gray-100 rounded-xl mb-4 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-[#2C8582] bg-[#E0F4F3] px-3 py-1 rounded-full">Dalam Proses</span>
              <span className="text-gray-500">12 Dukungan</span>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Kenapa Menggunakan BREAKING NEWS?</h2>
            <p className="mt-4 text-xl text-gray-600">Sistem yang dirancang untuk kecepatan, transparansi, dan kemudahan warga.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Feature 1 */}
            <Link href="/register" className="block bg-[#F3FAF9] rounded-3xl p-8 text-center hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="mx-auto w-16 h-16 bg-[#E0F4F3] rounded-2xl flex items-center justify-center mb-6">
                <Zap className="h-8 w-8 text-[#2C8582]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Respon Cepat</h3>
              <p className="text-gray-600 leading-relaxed">Laporan langsung masuk ke dashboard pemerintah desa, memangkas birokrasi dan mempercepat tindakan.</p>
            </Link>
            {/* Feature 2 */}
            <Link href="/register" className="block bg-[#F3FAF9] rounded-3xl p-8 text-center hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="mx-auto w-16 h-16 bg-[#FEECEB] rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="h-8 w-8 text-[#D9534F]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Transparan</h3>
              <p className="text-gray-600 leading-relaxed">Pantau status laporan Anda (Pending, Proses, Selesai) secara real-time. Semua warga bisa melihat perkembangannya.</p>
            </Link>
            {/* Feature 3 */}
            <Link href="/register" className="block bg-[#F3FAF9] rounded-3xl p-8 text-center hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="mx-auto w-16 h-16 bg-[#D5E5E3] rounded-2xl flex items-center justify-center mb-6">
                <Users className="h-8 w-8 text-[#D9B4B0]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Berbasis Komunitas</h3>
              <p className="text-gray-600 leading-relaxed">Berikan dukungan (like) dan komentar pada laporan warga lain agar segera mendapat prioritas perbaikan.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#2C8582] py-20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl mb-6">Siap Menjadi Pahlawan Desa?</h2>
          <p className="text-xl text-[#E0F4F3] mb-10">Satu laporan dari Anda bisa menyelamatkan banyak warga lainnya.</p>
          <Link href="/register" className="inline-block bg-white text-[#2C8582] px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-50 transition-colors shadow-lg">
            Daftar Akun Gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 text-center text-gray-400">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-white mb-4 tracking-tight">BREAKING NEWS</h2>
          <p className="mb-6">Platform Pengaduan Masyarakat Modern</p>
          <div className="flex justify-center space-x-6 mb-8">
            <a href="#" className="hover:text-white transition-colors">Tentang Kami</a>
            <a href="#" className="hover:text-white transition-colors">Kebijakan Privasi</a>
            <a href="#" className="hover:text-white transition-colors">Kontak</a>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} BREAKING NEWS. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
