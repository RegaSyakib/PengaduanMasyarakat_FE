'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      alert('Semua kolom harus diisi.');
      return;
    }
    try {
      await api.post('/auth/register', { name, email, password });
      alert('Registrasi berhasil! Silakan login.');
      router.push('/login');
    } catch (error) {
      alert('Gagal mendaftar. Pastikan email belum digunakan.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3FAF9] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-[#2C8582] tracking-tight">BREAKING NEWS</h1>
          <p className="mt-3 text-base text-gray-600">Bergabunglah dan mulai lapor sekarang.</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="space-y-4">
            
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
              <div className="relative flex items-center">
                <div className="absolute left-4">
                  <User className="h-5 w-5 text-[#8E918B]" />
                </div>
                <input
                  type="text"
                  required
                  className="w-full bg-[#E0EAE8] text-gray-900 rounded-xl pl-12 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-[#2C8582] transition-all"
                  placeholder="Masukkan nama lengkap"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email atau Nomor Telepon</label>
              <div className="relative flex items-center">
                <div className="absolute left-4">
                  <Mail className="h-5 w-5 text-[#8E918B]" />
                </div>
                <input
                  type="email"
                  required
                  className="w-full bg-[#E0EAE8] text-gray-900 rounded-xl pl-12 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-[#2C8582] transition-all"
                  placeholder="Masukkan email atau no telp"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative flex items-center">
                <div className="absolute left-4">
                  <Lock className="h-5 w-5 text-[#8E918B]" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full bg-[#E0EAE8] text-gray-900 rounded-xl pl-12 pr-12 py-3.5 outline-none focus:ring-2 focus:ring-[#2C8582] transition-all"
                  placeholder="Buat password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="absolute right-4 cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-5 w-5 text-[#8E918B]" /> : <Eye className="h-5 w-5 text-[#8E918B]" />}
                </div>
              </div>
            </div>

          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-3.5 px-4 rounded-xl text-white font-bold bg-[#2C8582] hover:bg-[#48CCC4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2C8582] transition-colors"
          >
            Daftar
          </button>
        </form>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#F3FAF9] text-gray-500">Atau daftar dengan</span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl bg-[#E0EAE8] hover:bg-[#e0e0d6] transition-colors text-gray-900 font-medium">
              <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.761H12.545z" />
              </svg>
              Lanjutkan dengan Google
            </button>
          </div>
        </div>

        <div className="mt-8 text-center space-y-2">
          <p className="text-sm text-gray-600">
            Sudah punya akun?{' '}
            <Link href="/login" className="font-bold text-[#2C8582] hover:underline">
              Masuk sekarang
            </Link>
          </p>
          <p>
            <Link href="/forgot-password" className="text-sm text-gray-500 hover:text-[#2C8582]">
              Lupa Password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
