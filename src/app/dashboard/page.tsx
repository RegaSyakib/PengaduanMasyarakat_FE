'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { API_BASE_URL } from '@/lib/api';
import { LogOut, Home, Bell, Map, User as UserIcon, MessageSquare, ThumbsUp, MoreHorizontal, Image as ImageIcon, MapPin, Search } from 'lucide-react';
import dynamic from 'next/dynamic';
import ProfileSection from '@/components/ProfileSection';

// Dynamically import MapPicker to prevent SSR issues
const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });
const MapViewer = dynamic(() => import('@/components/MapViewer'), { ssr: false });

export default function Dashboard() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [category, setCategory] = useState('Infrastruktur Jalan');
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Interaction States
  const [openComments, setOpenComments] = useState<{ [key: number]: boolean }>({});
  const [commentsData, setCommentsData] = useState<{ [key: number]: any[] }>({});
  const [commentInput, setCommentInput] = useState<{ [key: number]: string }>({});

  const [activeTab, setActiveTab] = useState<'beranda' | 'notifikasi' | 'profil'>('beranda');
  const [notifications, setNotifications] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown & Edit States
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [editingComplaint, setEditingComplaint] = useState<any>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('Infrastruktur Jalan');
  const [editLatitude, setEditLatitude] = useState<number | null>(null);
  const [editLongitude, setEditLongitude] = useState<number | null>(null);
  const [editImage, setEditImage] = useState<File | null>(null);
  const [isEditMapPickerOpen, setIsEditMapPickerOpen] = useState(false);



  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        // Akun admin & superadmin bertugas mengelola laporan warga dan pengguna di Panel Admin (/admin)
        if (parsed.role === 'admin' || parsed.role === 'super_admin') {
          router.replace('/admin');
          return;
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      router.replace('/login');
      return;
    }
    fetchComplaints();
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/complaints/notifications');
      setNotifications(res.data);
    } catch (error) {
      console.error('Gagal mengambil notifikasi:', error);
    }
  };

  const unreadNotifications = notifications.filter((n: any) => !n.is_read);

  const handleViewNotificationDetails = async (complaintId: number, notificationId: number, isRead: boolean) => {
    try {
      if (!isRead) {
        await api.put(`/complaints/notifications/${notificationId}/read`);
        fetchNotifications();
      }
      const res = await api.get(`/complaints/${complaintId}`);
      setSelectedComplaint(res.data);
    } catch (error) {
      console.error('Gagal mengambil detail laporan:', error);
      alert('Gagal mengambil detail laporan');
    }
  };

  const handleDeleteNotification = async (id: number) => {
    if (!confirm('Yakin ingin menghapus notifikasi ini?')) return;
    try {
      await api.delete(`/complaints/notifications/${id}`);
      fetchNotifications();
    } catch (error) {
      alert('Gagal menghapus notifikasi');
    }
  };

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/complaints');
      setComplaints(res.data);
    } catch (error: any) {
      console.error(error);
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        router.push('/login');
      }
    }
  };

  const handleLocationSelected = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  const toggleLike = async (complaintId: number) => {
    // Optimistic UI update
    setComplaints((prev: any[]) => prev.map(c => {
      if (c.id === complaintId) {
        const currentlyLiked = !!c.is_liked_by_me;
        return {
          ...c,
          is_liked_by_me: !currentlyLiked,
          likes_count: Math.max(0, (c.likes_count || 0) + (currentlyLiked ? -1 : 1))
        };
      }
      return c;
    }));

    try {
      await api.post(`/complaints/${complaintId}/like`);
      fetchComplaints();
    } catch (error: any) {
      console.error('Error toggling like:', error);
      fetchComplaints(); // Revert on failure
      const msg = error?.response?.data?.message || 'Gagal menyukai laporan';
      alert(msg);
    }
  };

  const toggleCommentSection = async (complaintId: number) => {
    const isOpen = !openComments[complaintId];
    setOpenComments(prev => ({ ...prev, [complaintId]: isOpen }));

    if (isOpen) {
      try {
        const res = await api.get(`/complaints/${complaintId}/comments`);
        setCommentsData(prev => ({ ...prev, [complaintId]: res.data }));
      } catch (error: any) {
        console.error('Error fetching comments:', error);
      }
    }
  };

  const submitComment = async (e: React.FormEvent, complaintId: number) => {
    e.preventDefault();
    const text = commentInput[complaintId];
    if (!text || text.trim() === '') return;

    try {
      await api.post(`/complaints/${complaintId}/comments`, { comment: text.trim() });
      setCommentInput(prev => ({ ...prev, [complaintId]: '' }));
      // Refresh comments and post comment count
      const res = await api.get(`/complaints/${complaintId}/comments`);
      setCommentsData(prev => ({ ...prev, [complaintId]: res.data }));
      fetchComplaints(); // to update comment count
    } catch (error: any) {
      console.error('Error submitting comment:', error);
      const msg = error?.response?.data?.message || 'Gagal mengirim komentar';
      alert(msg);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    if (image) formData.append('image', image);
    if (latitude) formData.append('latitude', latitude.toString());
    if (longitude) formData.append('longitude', longitude.toString());
    formData.append('category', category);

    try {
      await api.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Pengaduan berhasil dikirim!');
      setTitle('');
      setDescription('');
      setImage(null);
      setLatitude(null);
      setLongitude(null);
      fetchComplaints();
    } catch (error: any) {
      const status = error?.response?.status;
      const data = error?.response?.data;
      console.error('Gagal mengirim pengaduan:', { status, data, message: error?.message });

      alert(
        data?.message
          ? `Gagal mengirim pengaduan: ${data.message}`
          : `Gagal mengirim pengaduan (status: ${status ?? 'unknown'})`
      );
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleEditClick = (complaint: any) => {
    setEditingComplaint(complaint);
    setEditTitle(complaint.title);
    setEditDescription(complaint.description);
    setEditCategory(complaint.category || 'Infrastruktur Jalan');
    setEditLatitude(complaint.latitude ? parseFloat(complaint.latitude) : null);
    setEditLongitude(complaint.longitude ? parseFloat(complaint.longitude) : null);
    setEditImage(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComplaint) return;

    const formData = new FormData();
    formData.append('title', editTitle);
    formData.append('description', editDescription);
    formData.append('category', editCategory);
    if (editImage) {
      formData.append('image', editImage);
    }
    if (editLatitude !== null && editLatitude !== undefined) {
      formData.append('latitude', editLatitude.toString());
    } else {
      formData.append('latitude', 'null');
    }
    if (editLongitude !== null && editLongitude !== undefined) {
      formData.append('longitude', editLongitude.toString());
    } else {
      formData.append('longitude', 'null');
    }

    try {
      await api.put(`/complaints/${editingComplaint.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Laporan berhasil diperbarui!');
      setEditingComplaint(null);
      fetchComplaints();
    } catch (error: any) {
      const data = error?.response?.data;
      alert(data?.message || 'Gagal memperbarui laporan');
    }
  };

  const handleDeleteClick = async (complaintId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus laporan ini?')) return;

    try {
      await api.delete(`/complaints/${complaintId}`);
      alert('Laporan berhasil dihapus!');
      fetchComplaints();
    } catch (error: any) {
      const data = error?.response?.data;
      alert(data?.message || 'Gagal menghapus laporan');
    }
  };



  const filteredComplaints = complaints.filter((c: any) => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.category && c.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
      case 'approved':
        return 'bg-[#E0F4F3] text-[#2C8582]'; // Soft Green
      case 'process':
        return 'bg-[#FFF4E0] text-[#D98A2C]'; // Soft Orange
      case 'rejected':
        return 'bg-[#FEECEB] text-[#D9534F]'; // Soft Red
      default:
        return 'bg-[#F2F2F2] text-[#8E918B]'; // Neutral
    }
  };

  return (
    <div className="min-h-screen bg-[#F3FAF9] font-sans relative">
      {/* Map Picker Modal */}
      {isMapPickerOpen && (
        <MapPicker 
          onLocationSelected={handleLocationSelected} 
          onClose={() => setIsMapPickerOpen(false)} 
        />
      )}

      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-extrabold text-[#2C8582] tracking-tight">BREAKING NEWS</h1>
            <div className="flex items-center space-x-5">
              {/* Notification Bell with Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                  className="relative p-2 text-gray-500 hover:text-[#2C8582] hover:bg-[#F3FAF9] rounded-full transition-colors"
                >
                  <Bell className="h-6 w-6" />
                  {unreadNotifications.length > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full shadow-sm">
                      {unreadNotifications.length}
                    </span>
                  )}
                </button>

                {/* Dropdown Card */}
                {showNotifDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowNotifDropdown(false)}></div>
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-3 border-b border-gray-50 bg-[#F3FAF9]/50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900">Notifikasi</h3>
                        <span className="text-xs text-[#2C8582] font-medium">{unreadNotifications.length} Baru</span>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center">
                            <Bell className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                            <p className="text-sm text-gray-500">Belum ada notifikasi baru.</p>
                          </div>
                        ) : (
                          notifications.map((n: any) => (
                            <div 
                              key={n.id} 
                              onClick={() => {
                                handleViewNotificationDetails(n.complaint_id, n.id, !!n.is_read);
                                setShowNotifDropdown(false);
                              }}
                              className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors relative group cursor-pointer ${!n.is_read ? 'bg-[#E0F4F3]/10' : ''}`}
                            >
                              <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#E0F4F3] flex-shrink-0 flex items-center justify-center text-[#2C8582] font-bold text-xs">
                                  {n.admin_name?.[0]?.toUpperCase() || 'A'}
                                </div>
                                <div className="flex-1 pr-3">
                                  <p className="text-xs text-gray-800 leading-snug mb-1">
                                    <span className="font-bold">{n.admin_name || 'Admin'}</span> memperbarui status <span className="italic">"{n.complaint_title}"</span>
                                  </p>
                                  <p className="text-[11px] text-gray-500 bg-gray-100 p-1.5 rounded line-clamp-2">"{n.message}"</p>
                                  <p className="text-[9px] text-gray-400 mt-1.5">{new Date(n.created_at).toLocaleString()}</p>
                                </div>
                              </div>
                              {!n.is_read && (
                                <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#2C8582]" title="Belum dibaca"></span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* User Profile / Logout Group */}
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setActiveTab('profil')}
                  className="flex items-center space-x-2 group"
                >
                  <div className="w-9 h-9 rounded-full border-2 border-gray-100 group-hover:border-[#2C8582] transition-all flex items-center justify-center bg-gray-50 overflow-hidden relative">
                    {user?.profile_image ? (
                      <img src={`${API_BASE_URL}${user.profile_image}`} className="w-full h-full object-cover" alt={user.name} />
                    ) : (
                      <UserIcon className="h-5 w-5 text-gray-400 group-hover:text-[#2C8582]" />
                    )}
                  </div>
                  <span className="text-sm font-bold text-gray-700 group-hover:text-[#2C8582] transition-colors hidden md:block">{user?.name}</span>
                </button>
                <button onClick={logout} title="Logout" className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
        
        {/* Left Sidebar - Hidden on mobile */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-2">
            <button 
              onClick={() => setActiveTab('beranda')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'beranda' ? 'bg-[#E0F4F3] text-[#2C8582]' : 'text-gray-600 hover:bg-[#E0EAE8]'}`}
            >
              <Home className="h-5 w-5" />
              <span>Beranda</span>
            </button>
            <button onClick={() => router.push('/map')} className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-[#E0EAE8] rounded-xl font-bold transition-colors">
              <Map className="h-5 w-5" />
              <span>Peta Laporan</span>
            </button>
            <button 
              onClick={() => setActiveTab('profil')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'profil' ? 'bg-[#E0F4F3] text-[#2C8582]' : 'text-gray-600 hover:bg-[#E0EAE8]'}`}
            >
              <UserIcon className="h-5 w-5" />
              <span>Profil Saya</span>
            </button>
          </div>
        </aside>

        {/* Main Feed Column */}
        <main className="flex-1 max-w-2xl">
          
          {activeTab === 'beranda' && (
            <>
              {/* Create Post Form */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                <div className="flex space-x-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#E0F4F3] flex items-center justify-center text-[#2C8582] font-bold overflow-hidden">
                    {user?.profile_image ? (
                      <img src={`${API_BASE_URL}${user.profile_image}`} className="w-full h-full object-cover" alt={user.name} />
                    ) : (
                      user?.name?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-gray-800 self-center">Ada masalah apa hari ini?</h2>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4 pl-14">
                  <div className="flex gap-4">
                    <input 
                      type="text" 
                      placeholder="Judul Singkat Laporan" 
                      required 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      className="flex-1 bg-[#F3FAF9] border-none rounded-xl px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-[#2C8582] outline-none" 
                    />
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-48 bg-[#F3FAF9] border-none rounded-xl px-4 py-3 text-gray-800 focus:ring-2 focus:ring-[#2C8582] outline-none font-medium cursor-pointer"
                    >
                      <option value="Infrastruktur Jalan">Infrastruktur Jalan</option>
                      <option value="Kebersihan">Kebersihan</option>
                      <option value="Lampu Jalan">Lampu Jalan</option>
                      <option value="Keamanan">Keamanan</option>
                      <option value="Fasilitas Umum">Fasilitas Umum</option>
                      <option value="Kejadian Bencana">Kejadian Bencana</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                  <textarea 
                    placeholder="Ceritakan detail masalah atau kerusakan..." 
                    required 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    className="w-full bg-[#F3FAF9] border-none rounded-xl px-4 py-3 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-[#2C8582] outline-none resize-none h-24" 
                  />
                  
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex space-x-2">
                      <label className="cursor-pointer p-2 hover:bg-[#E0EAE8] rounded-full text-[#8E918B] transition-colors" title="Lampirkan Gambar">
                        <ImageIcon className="h-5 w-5" />
                        <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} className="hidden" />
                      </label>
                      <button 
                        type="button" 
                        onClick={() => setIsMapPickerOpen(true)} 
                        className={`p-2 hover:bg-[#E0EAE8] rounded-full transition-colors ${latitude ? 'text-[#2C8582] bg-[#E0F4F3]' : 'text-[#8E918B]'}`}
                        title="Pilih Lokasi Kejadian"
                      >
                        <MapPin className="h-5 w-5" />
                      </button>
                    </div>
                    <button type="submit" className="bg-[#2C8582] text-white font-bold px-6 py-2.5 rounded-full hover:bg-[#48CCC4] transition-colors shadow-sm">
                      Kirim Laporan
                    </button>
                  </div>
                  <div className="flex space-x-4">
                    {image && <p className="text-sm text-[#2C8582] font-medium">📷 1 Gambar dipilih</p>}
                    {latitude && <p className="text-sm text-[#2C8582] font-medium">📍 {latitude.toFixed(5)}, {longitude?.toFixed(5)}</p>}
                  </div>
                </form>
              </div>

              {/* Search Bar */}
              <div className="mb-8 flex justify-center">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari laporan..." 
                    className="w-full pl-12 pr-10 py-3 bg-white border border-gray-200 rounded-full outline-none focus:ring-2 focus:ring-[#2C8582] shadow-sm transition-all text-sm placeholder-gray-400"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg font-bold"
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>

              {/* Feed Divider */}
              <div className="flex items-center space-x-2 mb-6">
                <h3 className="text-xl font-bold text-gray-900">Feed Laporan Terbaru</h3>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* Feed List */}
              <div className="space-y-6">
                {filteredComplaints.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                    <p className="text-gray-500">
                      {searchQuery 
                        ? 'Tidak ada laporan yang cocok dengan pencarian Anda.' 
                        : 'Belum ada laporan di desa ini. Mulai lapor sekarang!'}
                    </p>
                  </div>
                ) : null}
                
                {filteredComplaints.map((c: any) => (
                  <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
                    
                    {/* Post Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex space-x-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D5E5E3] to-[#D9B4B0] flex items-center justify-center text-gray-700 font-bold text-lg shadow-inner overflow-hidden flex-shrink-0">
                          {c.user_profile_image ? (
                            <img src={`${API_BASE_URL}${c.user_profile_image}`} className="w-full h-full object-cover" alt={c.user_name} />
                          ) : (
                            c.user_name?.[0]?.toUpperCase() || 'A'
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 leading-tight">{c.user_name}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">{new Date(c.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      {(c.user_id === user?.id || user?.role === 'admin' || user?.role === 'super_admin') && (
                        <div className="relative">
                          <button 
                            onClick={() => setActiveDropdown(activeDropdown === c.id ? null : c.id)}
                            className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-50 rounded-full transition-colors"
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </button>
                          {activeDropdown === c.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)}></div>
                              <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                                {c.user_id === user?.id && (
                                  <button 
                                    onClick={() => {
                                      setActiveDropdown(null);
                                      handleEditClick(c);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#F3FAF9] hover:text-[#2C8582] font-semibold transition-colors flex items-center gap-2"
                                  >
                                    Edit Laporan
                                  </button>
                                )}
                                {(c.user_id === user?.id || user?.role === 'admin' || user?.role === 'super_admin') && (
                                  <button 
                                    onClick={() => {
                                      setActiveDropdown(null);
                                      handleDeleteClick(c.id);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-semibold transition-colors flex items-center gap-2"
                                  >
                                    Hapus Laporan
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Post Content */}
                    <div className="mb-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2.5 py-1 text-xs rounded-full font-bold uppercase tracking-wider ${getStatusColor(c.status)}`}>
                          {c.status}
                        </span>
                        <span className="text-xs font-semibold text-[#8E918B] bg-[#F3FAF9] px-2.5 py-1 rounded-full">{c.category || 'Fasilitas Umum'}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 leading-snug">{c.title}</h3>
                      <p className="text-gray-700 leading-relaxed">{c.description}</p>
                    </div>

                    {/* Attached Image */}
                    {c.image && (
                      <div className="mb-4 overflow-hidden rounded-xl border border-gray-100">
                        <img src={`${API_BASE_URL}${c.image}`} alt="Lampiran Laporan" className="w-full object-cover max-h-96" />
                      </div>
                    )}

                    {/* Interaction Buttons */}
                    <div className="flex items-center space-x-6 border-t border-gray-100 pt-4 mt-2">
                      <button 
                        onClick={() => toggleLike(c.id)}
                        className={`flex items-center space-x-2 transition-colors group ${c.is_liked_by_me ? 'text-[#2C8582]' : 'text-gray-500 hover:text-[#2C8582]'}`}
                      >
                        <div className={`p-2 rounded-full ${c.is_liked_by_me ? 'bg-[#E0F4F3]' : 'group-hover:bg-[#E0F4F3]'}`}>
                          <ThumbsUp className={`h-5 w-5 ${c.is_liked_by_me ? 'fill-current' : ''}`} />
                        </div>
                        <span className="font-medium">{c.likes_count || 0} Dukungan</span>
                      </button>
                      <button 
                        onClick={() => toggleCommentSection(c.id)}
                        className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors group"
                      >
                        <div className="p-2 rounded-full group-hover:bg-blue-50">
                          <MessageSquare className="h-5 w-5" />
                        </div>
                        <span className="font-medium">{c.comments_count || 0} Komentar</span>
                      </button>
                    </div>

                    {/* Comments Section */}
                    {openComments[c.id] && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        {/* List of Comments */}
                        <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                          {commentsData[c.id]?.length > 0 ? (
                            commentsData[c.id].map((comment: any) => (
                              <div key={comment.id} className="bg-[#F3FAF9] p-3 rounded-xl">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                                    {comment.user_name}
                                    {(comment.user_role === 'admin' || comment.user_role === 'super_admin') && (
                                      <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-[#E0F4F3] text-[#2C8582] rounded">
                                        {comment.user_role.replace('_', ' ')}
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-[10px] text-gray-500">{new Date(comment.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-sm text-gray-700">{comment.comment}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500 text-center py-2">Belum ada komentar. Jadilah yang pertama!</p>
                          )}
                        </div>
                        
                        {/* Add Comment Input */}
                        <form onSubmit={(e) => submitComment(e, c.id)} className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full bg-[#E0F4F3] flex-shrink-0 flex items-center justify-center text-[#2C8582] font-bold text-xs overflow-hidden">
                            {user?.profile_image ? (
                              <img src={`${API_BASE_URL}${user.profile_image}`} className="w-full h-full object-cover" alt={user.name} />
                            ) : (
                              user?.name?.[0]?.toUpperCase() || 'U'
                            )}
                          </div>
                          <input 
                            type="text" 
                            placeholder="Tulis komentar..." 
                            value={commentInput[c.id] || ''}
                            onChange={(e) => setCommentInput(prev => ({ ...prev, [c.id]: e.target.value }))}
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#2C8582] outline-none" 
                          />
                          <button 
                            type="submit" 
                            disabled={!commentInput[c.id]?.trim()}
                            className="bg-[#2C8582] text-white font-bold px-4 py-2 rounded-full text-sm hover:bg-[#48CCC4] transition-colors disabled:opacity-50"
                          >
                            Kirim
                          </button>
                        </form>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'notifikasi' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-6">
                <h3 className="text-xl font-bold text-gray-900">Notifikasi Tanggapan Admin</h3>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
              
              {notifications.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                  <p className="text-gray-500">Belum ada notifikasi tanggapan dari Admin.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((n: any) => (
                    <div 
                      key={n.id} 
                      onClick={() => handleViewNotificationDetails(n.complaint_id, n.id, !!n.is_read)}
                      className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md cursor-pointer relative ${!n.is_read ? 'border-l-4 border-l-[#2C8582] bg-[#E0F4F3]/5' : ''}`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 rounded-full bg-[#E0F4F3] flex items-center justify-center text-[#2C8582] font-bold flex-shrink-0">
                          {n.admin_name?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <p className="text-sm text-gray-900 pr-4">
                              <span className="font-bold">{n.admin_name || 'Admin'}</span> memperbarui status laporan Anda: <span className="font-semibold text-[#2C8582]">"{n.complaint_title}"</span>
                            </p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {!n.is_read && (
                                <span className="text-[10px] font-bold bg-[#E0F4F3] text-[#2C8582] px-2 py-0.5 rounded-full">Baru</span>
                              )}
                              {(user?.role === 'admin' || user?.role === 'super_admin') && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteNotification(n.id);
                                  }}
                                  className="text-red-500 hover:text-red-700 text-xs font-semibold bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg border border-red-200 transition-colors"
                                >
                                  Hapus Notifikasi
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-xl mt-2 border border-gray-100">
                            <p className="text-sm text-gray-700 leading-relaxed italic">"{n.message}"</p>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-2">
                            {new Date(n.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profil' && (
            <ProfileSection 
              user={user} 
              onUpdateUser={setUser} 
              complaints={complaints} 
              setActiveTab={setActiveTab} 
            />
          )}

        </main>

        {/* Right Sidebar - Trends */}
        <aside className="hidden xl:block w-72 flex-shrink-0">
          <div className="sticky top-24">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
              <h3 className="font-bold text-gray-900 mb-4">Tren Kategori</h3>
              <div className="space-y-3">
                {/* Dynamically compute count summaries from total complaints available in state */}
                {Object.entries(
                  complaints.reduce((acc: any, curr: any) => {
                    const cat = curr.category || 'Lainnya';
                    acc[cat] = (acc[cat] || 0) + 1;
                    return acc;
                  }, {})
                )
                .sort((a: any, b: any) => b[1] - a[1])
                .slice(0, 5)
                .map(([catName, count]: any) => (
                  <div key={catName} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 font-medium">{catName}</span>
                    <span className="text-gray-900 font-bold bg-[#F3FAF9] px-2 py-1 rounded">{count}</span>
                  </div>
                ))}
                
                {complaints.length === 0 && (
                  <p className="text-xs text-gray-400 text-center italic">Belum ada data tren</p>
                )}
              </div>
              <button className="w-full text-center mt-4 text-[#2C8582] font-bold text-sm hover:underline">Lihat Semua Kategori</button>
            </div>

            <div className="bg-gradient-to-br from-[#98A68E] to-[#2C8582] rounded-2xl shadow-sm p-6 text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="font-bold text-lg mb-2">Jadilah Warga Aktif!</h3>
                <p className="text-sm text-[#D5E5E3] leading-relaxed mb-4">Laporan Anda membantu pemerintah mempercepat perbaikan fasilitas desa kita.</p>
                <button className="bg-white text-[#2C8582] font-bold px-4 py-2 rounded-full text-sm w-full shadow-sm hover:bg-gray-50 transition-colors">Panduan Melapor</button>
              </div>
            </div>
          </div>
        </aside>

      {/* Selected Complaint Detail Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedComplaint(null)}></div>
          <div className="relative w-full max-w-2xl bg-white shadow-2xl rounded-3xl p-6 z-10 border border-gray-100 flex flex-col max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-gray-100 mb-6">
              <div>
                <span className={`px-2.5 py-1 text-xs rounded-full font-bold uppercase tracking-wider ${getStatusColor(selectedComplaint.status)}`}>
                  {selectedComplaint.status}
                </span>
                <h2 className="text-2xl font-black text-gray-900 mt-2">{selectedComplaint.title}</h2>
              </div>
              <button 
                onClick={() => setSelectedComplaint(null)} 
                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-6 flex-1">
              {/* Category and Date */}
              <div className="flex justify-between items-center text-sm text-gray-500 bg-gray-50 px-4 py-2.5 rounded-xl">
                <span>Kategori: <strong className="text-gray-800">{selectedComplaint.category || 'Lainnya'}</strong></span>
                <span>Dilaporkan: <strong className="text-gray-800">{new Date(selectedComplaint.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></span>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Detail Laporan</h3>
                <p className="text-gray-700 leading-relaxed bg-[#F3FAF9] p-4 rounded-xl border border-gray-100">
                  {selectedComplaint.description}
                </p>
              </div>

              {/* Image */}
              {selectedComplaint.image && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Lampiran Foto</h3>
                  <div className="overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                    <img 
                      src={`${API_BASE_URL}${selectedComplaint.image}`} 
                      alt="Lampiran" 
                      className="w-full object-cover max-h-80" 
                    />
                  </div>
                </div>
              )}

              {/* Map Location */}
              {selectedComplaint.latitude && selectedComplaint.longitude && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-[#2C8582]" /> Lokasi Laporan
                  </h3>
                  <div className="h-64 rounded-xl overflow-hidden border border-gray-100">
                    <MapViewer 
                      latitude={parseFloat(selectedComplaint.latitude)} 
                      longitude={parseFloat(selectedComplaint.longitude)} 
                      title={selectedComplaint.title} 
                    />
                  </div>
                </div>
              )}

              {/* Responses Timeline */}
              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-[#2C8582]" /> Tanggapan Admin
                </h3>
                <div className="space-y-4 pl-2 border-l-2 border-[#E0F4F3]">
                  {selectedComplaint.responses && selectedComplaint.responses.length > 0 ? (
                    selectedComplaint.responses.map((resp: any) => (
                      <div key={resp.id} className="relative pl-6">
                        <div className="absolute -left-[9px] top-1.5 w-4 h-4 bg-[#2C8582] border-2 border-white rounded-full shadow-sm"></div>
                        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-[#E0F4F3] flex items-center justify-center text-[10px] font-bold text-[#2C8582]">
                              {resp.admin_name?.[0]?.toUpperCase() || 'A'}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 leading-none mb-0.5">{resp.admin_name}</p>
                              <p className="text-[10px] text-gray-400">{new Date(resp.created_at).toLocaleString('id-ID')}</p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-50 italic">
                            "{resp.message}"
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="pl-6 text-sm text-gray-400 italic">Belum ada tanggapan resmi dari Admin.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Edit Map Picker Modal */}
      {isEditMapPickerOpen && (
        <MapPicker 
          onLocationSelected={(lat, lng) => {
            setEditLatitude(lat);
            setEditLongitude(lng);
          }} 
          onClose={() => setIsEditMapPickerOpen(false)} 
        />
      )}

      {/* Edit Complaint Modal */}
      {editingComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingComplaint(null)}></div>
          <div className="relative w-full max-w-lg bg-white shadow-2xl rounded-3xl p-6 z-10 border border-gray-100 flex flex-col max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-6">
              <h2 className="text-xl font-bold text-gray-900">Edit Laporan</h2>
              <button 
                onClick={() => setEditingComplaint(null)} 
                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Judul Laporan</label>
                <input 
                  type="text" 
                  required 
                  value={editTitle} 
                  onChange={(e) => setEditTitle(e.target.value)} 
                  className="w-full bg-[#F3FAF9] border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:ring-2 focus:ring-[#2C8582] outline-none" 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Kategori</label>
                <select 
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full bg-[#F3FAF9] border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:ring-2 focus:ring-[#2C8582] outline-none font-medium cursor-pointer"
                >
                  <option value="Infrastruktur Jalan">Infrastruktur Jalan</option>
                  <option value="Kebersihan">Kebersihan</option>
                  <option value="Lampu Jalan">Lampu Jalan</option>
                  <option value="Keamanan">Keamanan</option>
                  <option value="Fasilitas Umum">Fasilitas Umum</option>
                  <option value="Kejadian Bencana">Kejadian Bencana</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Deskripsi Laporan</label>
                <textarea 
                  required 
                  value={editDescription} 
                  onChange={(e) => setEditDescription(e.target.value)} 
                  className="w-full bg-[#F3FAF9] border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:ring-2 focus:ring-[#2C8582] outline-none resize-none h-32" 
                />
              </div>

              {/* Photo Upload & Preview */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Foto Lampiran</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center border border-gray-200 flex-shrink-0">
                    {editImage ? (
                      <img src={URL.createObjectURL(editImage)} className="w-full h-full object-cover" alt="Pratinjau baru" />
                    ) : editingComplaint.image ? (
                      <img src={`${API_BASE_URL}${editingComplaint.image}`} className="w-full h-full object-cover" alt="Foto saat ini" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="inline-block bg-[#F3FAF9] border border-[#2C8582] text-[#2C8582] font-bold px-4 py-2 rounded-xl text-sm cursor-pointer hover:bg-[#E0F4F3] transition-colors">
                      Pilih Foto Baru
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => setEditImage(e.target.files?.[0] || null)} 
                        className="hidden" 
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">Format JPG, PNG, atau WEBP. Maksimal 10MB.</p>
                  </div>
                </div>
              </div>

              {/* Location Picker */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Lokasi Laporan</label>
                <div className="flex items-center gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsEditMapPickerOpen(true)} 
                    className="flex items-center gap-2 bg-[#F3FAF9] border border-gray-200 text-gray-700 font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-[#E0F4F3] hover:text-[#2C8582] hover:border-[#2C8582] transition-colors"
                  >
                    <MapPin className="h-4 w-4" />
                    Pilih Lokasi di Peta
                  </button>
                  {editLatitude ? (
                    <span className="text-xs text-[#2C8582] font-medium bg-[#E0F4F3] px-2.5 py-1.5 rounded-lg">
                      📍 {editLatitude.toFixed(5)}, {editLongitude?.toFixed(5)}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500 italic bg-gray-50 px-2.5 py-1.5 rounded-lg">
                      Lokasi belum dipilih
                    </span>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                <button 
                  type="button" 
                  onClick={() => setEditingComplaint(null)}
                  className="flex-1 bg-white border border-gray-200 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors text-center text-sm"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-[#2C8582] text-white font-bold py-3 rounded-xl hover:bg-[#48CCC4] transition-colors text-center text-sm shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      </div>
    </div>
  );
}
