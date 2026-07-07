'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { User, Lock, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      alert('Silakan isi email dan password.');
      return;
    }
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      if (res.data.user.role === 'admin' || res.data.user.role === 'super_admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      alert('Login gagal. Cek kembali email dan password Anda.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3FAF9] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-[#2C8582] tracking-tight">BREAKING NEWS</h1>
          <p className="mt-3 text-base text-gray-600">Mari bersama bangun kota yang lebih baik.</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email atau Nomor Telepon</label>
              <div className="relative flex items-center">
                <div className="absolute left-4">
                  <User className="h-5 w-5 text-[#8E918B]" />
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
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <Link href="/forgot-password" className="text-sm text-gray-500 hover:text-[#2C8582]">Lupa Password?</Link>
              </div>
              <div className="relative flex items-center">
                <div className="absolute left-4">
                  <Lock className="h-5 w-5 text-[#8E918B]" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full bg-[#E0EAE8] text-gray-900 rounded-xl pl-12 pr-12 py-3.5 outline-none focus:ring-2 focus:ring-[#2C8582] transition-all"
                  placeholder="Masukkan password"
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
            Masuk
          </button>
        </form>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#F3FAF9] text-gray-500">Atau masuk dengan</span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl bg-[#E0EAE8] hover:bg-[#e0e0d6] transition-colors text-gray-900 font-medium">
              <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.761H12.545z" />
              </svg>
              Lanjutkan dengan Google
            </button>
            <button className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl bg-[#E0EAE8] hover:bg-[#e0e0d6] transition-colors text-gray-900 font-medium">
              <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.74 3.55-.83 2.05-.15 3.56.9 4.3 2.55-3.52 2.07-2.92 6.54.8 7.95-.88 2.08-1.92 3.82-3.73 2.5zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Lanjutkan dengan Apple
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Belum punya akun?{' '}
            <Link href="/register" className="font-bold text-[#2C8582] hover:underline">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
