'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { MapPin, Image as ImageIcon } from 'lucide-react';

interface ProfileSectionProps {
  user: any;
  onUpdateUser: (user: any) => void;
  complaints: any[];
  setActiveTab: (tab: 'beranda' | 'notifikasi' | 'profil') => void;
}

export default function ProfileSection({ user, onUpdateUser, complaints, setActiveTab }: ProfileSectionProps) {
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleEditProfileClick = () => {
    if (user) {
      setProfileName(user.name);
      setProfileEmail(user.email);
      setProfilePassword('');
      setProfileImage(null);
      setIsEditProfileOpen(true);
    }
  };

  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', profileName);
      formData.append('email', profileEmail);
      if (profilePassword && profilePassword.trim() !== '') {
        formData.append('password', profilePassword);
      }
      if (profileImage) {
        formData.append('profile_image', profileImage);
      }

      const res = await api.put('/users/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      alert('Profil berhasil diperbarui!');
      const updatedUser = res.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      onUpdateUser(updatedUser);
      setIsEditProfileOpen(false);
      setProfileImage(null);
    } catch (error: any) {
      const data = error?.response?.data;
      alert(data?.message || 'Gagal memperbarui profil');
    } finally {
      setIsLoading(false);
    }
  };

  const userComplaints = complaints.filter((c: any) => c.user_id === user?.id);

  return (
    <div className="space-y-8 w-full animate-in fade-in duration-300">
      {/* Elegant Profile Header Card */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#E0F4F3]/30 to-transparent rounded-bl-full pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row items-center md:items-start relative z-10">
          {/* Profile Avatar Group */}
          <div className="flex-shrink-0 mb-6 md:mb-0">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#E0F4F3] to-[#2C8582] border-[6px] border-[#F3FAF9] shadow-md flex items-center justify-center text-white font-extrabold text-4xl relative overflow-hidden">
              {user?.profile_image ? (
                <img src={`http://localhost:5000${user.profile_image}`} className="w-full h-full object-cover" alt={user.name} />
              ) : (
                user?.name?.[0]?.toUpperCase() || 'U'
              )}
            </div>
          </div>
          
          {/* User Details & Actions Group */}
          <div className="flex-1 md:ml-8 flex flex-col w-full">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start w-full mb-6">
              <div className="text-center md:text-left mb-4 md:mb-0">
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{user?.name}</h2>
                <div className="flex items-center justify-center md:justify-start text-gray-500 mt-2 space-x-1.5">
                  <MapPin className="h-4 w-4 text-[#2C8582]" />
                  <span className="text-sm font-medium">{user?.role?.toUpperCase() || 'WARGA'}</span>
                </div>
              </div>
              
              <button 
                onClick={handleEditProfileClick}
                className="inline-flex items-center space-x-2 bg-[#4A5944] hover:bg-[#3e4a38] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow self-center md:self-start"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span>Edit Profil</span>
              </button>
            </div>
            
            {/* Modern Stats Group aligned below name */}
            <div className="grid grid-cols-3 gap-4 w-full">
              <div className="bg-[#F3F4EE] p-4 rounded-2xl text-center">
                <p className="text-3xl font-black text-gray-800 leading-none mb-1">
                  {userComplaints.length}
                </p>
                <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">TOTAL LAPORAN</p>
              </div>
              <div className="bg-[#FDF2EE] p-4 rounded-2xl text-center">
                <p className="text-3xl font-black text-[#BA7257] leading-none mb-1">
                  {userComplaints.filter((c: any) => c.status === 'done' || c.status === 'approved').length}
                </p>
                <p className="text-[10px] font-bold text-[#BA7257]/80 tracking-widest uppercase">DISETUJUI</p>
              </div>
              <div className="bg-[#E0E5DB] p-4 rounded-2xl text-center">
                <p className="text-3xl font-black text-[#2C8582] leading-none mb-1">
                  {userComplaints.filter((c: any) => c.status === 'process').length}
                </p>
                <p className="text-[10px] font-bold text-[#2C8582]/80 tracking-widest uppercase">DALAM PROSES</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area with Internal Tabs */}
      <div>
        <div className="flex space-x-8 border-b border-gray-200/70 pb-px mb-8 overflow-x-auto">
          <button className="pb-3 font-bold text-[#2C8582] border-b-[3px] border-[#2C8582] whitespace-nowrap text-base tracking-wide">Laporan Saya</button>
          <button className="pb-3 font-bold text-gray-400 hover:text-gray-600 border-b-[3px] border-transparent whitespace-nowrap text-base tracking-wide transition-colors">Tersimpan</button>
          <button className="pb-3 font-bold text-gray-400 hover:text-gray-600 border-b-[3px] border-transparent whitespace-nowrap text-base tracking-wide transition-colors">Aktivitas</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create New Report Card */}
          <button 
            onClick={() => setActiveTab('beranda')}
            className="bg-[#EBF0E7]/60 border-2 border-dashed border-[#CFD9CB] rounded-3xl p-6 flex flex-col items-center justify-center text-center h-full min-h-[280px] group hover:bg-[#EBF0E7] transition-all hover:border-[#2C8582]"
          >
            <div className="w-14 h-14 rounded-full bg-[#DFE7DB] text-[#2C8582] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-[#3B4736] mb-2">Buat Laporan Baru</h4>
            <p className="text-xs text-[#7A8776] max-w-[180px]">Ada masalah di lingkungan Anda? Laporkan sekarang.</p>
          </button>

          {/* Render User complaints */}
          {userComplaints.map((c: any) => {
            const statusConfig = 
              c.status === 'process' ? { bg: '#FFF4E0', text: '#D98A2C', label: 'In Progress' } :
              c.status === 'done' || c.status === 'approved' ? { bg: '#E0F4F3', text: '#2C8582', label: 'Resolved' } :
              { bg: '#F2F2F2', text: '#8E918B', label: 'Pending' };

            return (
              <div key={c.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 flex flex-col relative h-full min-h-[280px] transition-transform hover:-translate-y-1">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-current" style={{ color: statusConfig.text }}></span>
                    <span className="text-xs font-bold" style={{ color: statusConfig.text }}>{statusConfig.label}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-gray-400">
                    {Math.floor((new Date().getTime() - new Date(c.created_at).getTime()) / (1000 * 3600 * 24))}d ago
                  </span>
                </div>

                <div className="w-full h-32 bg-gray-100 rounded-2xl mb-4 overflow-hidden flex items-center justify-center border border-gray-50">
                  {c.image ? (
                    <img src={`http://localhost:5000${c.image}`} className="w-full h-full object-cover" alt={c.title} />
                  ) : (
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                  )}
                </div>

                <h3 className="text-base font-bold text-gray-900 leading-snug mb-auto line-clamp-2">{c.title}</h3>
                
                <div className="mt-4 pt-3 border-t border-gray-50 flex items-center text-gray-500 space-x-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-semibold truncate">{c.latitude ? 'Lokasi Tersemat' : 'Lainnya'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsEditProfileOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white shadow-2xl rounded-3xl p-6 z-10 border border-gray-100 flex flex-col max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-6">
              <h2 className="text-xl font-bold text-gray-900 font-sans">Edit Profil & Ubah Password</h2>
              <button 
                onClick={() => setIsEditProfileOpen(false)} 
                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEditProfileSubmit} className="space-y-4 font-sans">
              {/* Profile Image Field */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Foto Profil</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center border border-gray-200 flex-shrink-0">
                    {profileImage ? (
                      <img src={URL.createObjectURL(profileImage)} className="w-full h-full object-cover" alt="Pratinjau foto profil" />
                    ) : user?.profile_image ? (
                      <img src={`http://localhost:5000${user.profile_image}`} className="w-full h-full object-cover" alt="Foto profil saat ini" />
                    ) : (
                      <span className="text-xl font-bold text-gray-400">{user?.name?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="inline-block bg-[#F3FAF9] border border-[#2C8582] text-[#2C8582] font-bold px-4 py-2 rounded-xl text-sm cursor-pointer hover:bg-[#E0F4F3] transition-colors">
                      Pilih Foto Profil
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => setProfileImage(e.target.files?.[0] || null)} 
                        className="hidden" 
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">Format JPG, PNG, atau WEBP. Maksimal 10MB.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nama Lengkap</label>
                <input 
                  type="text" 
                  required 
                  value={profileName} 
                  onChange={(e) => setProfileName(e.target.value)} 
                  className="w-full bg-[#F3FAF9] border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:ring-2 focus:ring-[#2C8582] outline-none" 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  required 
                  value={profileEmail} 
                  onChange={(e) => setProfileEmail(e.target.value)} 
                  className="w-full bg-[#F3FAF9] border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:ring-2 focus:ring-[#2C8582] outline-none" 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Password Baru (Kosongkan jika tidak diubah)</label>
                <input 
                  type="password" 
                  placeholder="Masukkan password baru" 
                  value={profilePassword} 
                  onChange={(e) => setProfilePassword(e.target.value)} 
                  className="w-full bg-[#F3FAF9] border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:ring-2 focus:ring-[#2C8582] outline-none" 
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsEditProfileOpen(false)}
                  className="flex-1 bg-white border border-gray-200 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors text-center text-sm"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="flex-1 bg-[#2C8582] text-white font-bold py-3 rounded-xl hover:bg-[#48CCC4] transition-colors text-center text-sm shadow-sm flex items-center justify-center disabled:opacity-50"
                >
                  {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
