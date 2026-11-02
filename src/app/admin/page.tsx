'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { API_BASE_URL } from '@/lib/api';
import dynamic from 'next/dynamic';
import StatCard from '@/components/StatCard';
import ComplaintRow from '@/components/ComplaintRow';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  HelpCircle, 
  ShieldAlert, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ArrowUpRight, 
  ChevronRight, 
  MoreVertical,
  Eye,
  Trash2,
  MapPin,
  RefreshCw,
  Calendar,
  Check,
  AlertCircle,
  PhoneCall,
  UserCheck,
  CheckSquare
} from 'lucide-react';

const MapViewer = dynamic(() => import('@/components/MapViewer'), { ssr: false });
const MapOverviewAdmin = dynamic(() => import('@/components/MapOverviewAdmin'), { ssr: false });

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'users' | 'settings'>('dashboard');
  const [complaints, setComplaints] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [responseMsg, setResponseMsg] = useState('');
  
  // Dashboard Interactive States
  const [timeRange, setTimeRange] = useState<'all' | '7days' | '30days' | 'month'>('30days');
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [isChartMenuOpen, setIsChartMenuOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Reports Filter & Selection States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // User Management States
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');
  
  // Quick Edit User Modal
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editUserRole, setEditUserRole] = useState<'super_admin' | 'admin' | 'user'>('user');

  // Admin Profile States
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const router = useRouter();

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

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setCurrentUser(parsed);
        if (parsed.role !== 'admin' && parsed.role !== 'super_admin') {
          router.push('/dashboard');
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      router.push('/login');
    }
    const savedTab = localStorage.getItem('adminActiveTab');
    if (savedTab && ['dashboard', 'reports', 'users', 'settings'].includes(savedTab)) {
      setActiveTab(savedTab as any);
      localStorage.removeItem('adminActiveTab');
    }
    fetchComplaints();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (activeTab === 'settings' && currentUser) {
      setProfileName(currentUser.name || '');
      setProfileEmail(currentUser.email || '');
      setProfilePassword('');
      setProfileImage(null);
    }
  }, [activeTab, currentUser]);

  // --- EXPORT TO CSV FEATURE ---
  const exportComplaintsToCSV = (dataToExport: any[] = complaints, filename = 'laporan-pengaduan.csv') => {
    if (!dataToExport || dataToExport.length === 0) {
      alert('Tidak ada data laporan untuk diekspor.');
      return;
    }

    const headers = ['ID Laporan', 'Judul', 'Pelapor', 'Kategori', 'Status', 'Tanggal Masuk', 'Koordinat Lokasi', 'Deskripsi'];
    const rows = dataToExport.map(c => [
      `"#LP-${c.id.toString().padStart(4, '0')}"`,
      `"${(c.title || '').replace(/"/g, '""')}"`,
      `"${(c.user_name || '').replace(/"/g, '""')}"`,
      `"${(c.category || 'Lainnya').replace(/"/g, '""')}"`,
      `"${c.status || ''}"`,
      `"${new Date(c.created_at).toLocaleString('id-ID')}"`,
      `"${c.latitude && c.longitude ? `${c.latitude}, ${c.longitude}` : 'Tidak Ada'}"`,
      `"${(c.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- TIME RANGE FILTERED COMPLAINTS FOR DASHBOARD ---
  const now = new Date().getTime();
  const filteredDashboardComplaints = complaints.filter(c => {
    if (timeRange === 'all') return true;
    const itemTime = new Date(c.created_at).getTime();
    if (timeRange === '7days') return now - itemTime <= 7 * 24 * 60 * 60 * 1000;
    if (timeRange === '30days') return now - itemTime <= 30 * 24 * 60 * 60 * 1000;
    if (timeRange === 'month') {
      const d = new Date(c.created_at);
      const curr = new Date();
      return d.getMonth() === curr.getMonth() && d.getFullYear() === curr.getFullYear();
    }
    return true;
  });

  // --- REPORTS FILTER & SEARCH ---
  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `#lp-${c.id}`.includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || (c.category || 'Lainnya') === categoryFilter;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Pagination Computations
  const totalPages = Math.max(1, Math.ceil(filteredComplaints.length / itemsPerPage));
  const paginatedComplaints = filteredComplaints.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Bulk Selection Handlers
  const handleToggleSelectAll = () => {
    if (selectedIds.length === paginatedComplaints.length && paginatedComplaints.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedComplaints.map(c => c.id));
    }
  };

  const handleToggleSelectRow = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkUpdateStatus = async (newStatus: string) => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Ubah status ${selectedIds.length} laporan terpilih menjadi "${newStatus}"?`)) return;
    try {
      await Promise.all(selectedIds.map(id => api.put(`/complaints/${id}/status`, { status: newStatus })));
      alert(`Berhasil memperbarui status ${selectedIds.length} laporan.`);
      setSelectedIds([]);
      fetchComplaints();
    } catch (error) {
      alert('Gagal memperbarui status secara massal.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Hapus permanen ${selectedIds.length} laporan terpilih?`)) return;
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/complaints/${id}`)));
      alert(`Berhasil menghapus ${selectedIds.length} laporan.`);
      setSelectedIds([]);
      fetchComplaints();
    } catch (error) {
      alert('Gagal menghapus laporan secara massal.');
    }
  };

  // --- ACTIONS ---
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users', {
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      });
      alert('Pengguna baru berhasil ditambahkan');
      setIsAddUserModalOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('user');
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal menambahkan pengguna');
    }
  };

  const handleAdminProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
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

      alert('Profil Admin berhasil diperbarui!');
      const updatedUser = res.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      setProfileImage(null);
      setProfilePassword('');
    } catch (error: any) {
      const data = error?.response?.data;
      alert(data?.message || 'Gagal memperbarui profil');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Yakin ingin menghapus pengguna ini?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal menghapus pengguna');
    }
  };

  const handleUpdateUserRole = async (id: number, newRole: string) => {
    try {
      await api.put(`/users/${id}/role`, { role: newRole });
      alert('Role pengguna berhasil diperbarui');
      fetchUsers();
      if (editingUser && editingUser.id === id) {
        setEditingUser(null);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal memperbarui role pengguna');
    }
  };

  const handleDeleteComplaint = async (id: number) => {
    if (!confirm('Yakin ingin menghapus laporan ini?')) return;
    try {
      await api.delete(`/complaints/${id}`);
      setSelectedComplaint(null);
      fetchComplaints();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal menghapus laporan');
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.put(`/complaints/${id}/status`, { status });
      fetchComplaints();
      if (selectedComplaint && selectedComplaint.id === id) {
        setSelectedComplaint({ ...selectedComplaint, status });
      }
    } catch (error) {
      alert('Gagal update status');
    }
  };

  const handleViewDetails = async (c: any) => {
    try {
      const res = await api.get(`/complaints/${c.id}`);
      setSelectedComplaint(res.data);
    } catch (error) {
      alert('Gagal mengambil detail pengaduan');
    }
  };

  const submitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !responseMsg.trim()) return;
    try {
      await api.post('/responses', { complaint_id: selectedComplaint.id, message: responseMsg.trim() });
      setResponseMsg('');
      const res = await api.get(`/complaints/${selectedComplaint.id}`);
      setSelectedComplaint(res.data);
      fetchComplaints();
    } catch (error) {
      alert('Gagal mengirim tanggapan');
    }
  };

  const handleDeleteResponse = async (id: number) => {
    if (!confirm('Yakin ingin menghapus tanggapan ini?')) return;
    try {
      await api.delete(`/responses/${id}`);
      if (selectedComplaint) {
        const res = await api.get(`/complaints/${selectedComplaint.id}`);
        setSelectedComplaint(res.data);
      }
    } catch (error) {
      alert('Gagal menghapus tanggapan');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  // Filtered Users List
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  // Computed Stats for filtered dashboard range
  const totalPending = filteredDashboardComplaints.filter(c => c.status === 'pending').length;
  const totalResolved = filteredDashboardComplaints.filter(c => c.status === 'done' || c.status === 'approved').length;

  // Category Aggregates
  const catCounts = filteredDashboardComplaints.reduce((acc: any, curr: any) => {
    const cat = curr.category || 'Lainnya';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const topCats = Object.entries(catCounts).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5);
  const maxCatCount = Math.max(...(topCats.map(([, cnt]: any) => cnt as number)), 1);

  const getCategoryColor = (catName: string, index: number) => {
    const colorMap: Record<string, { bar: string; text: string; bg: string }> = {
      'Kejadian Bencana': { bar: '#0D9488', text: 'text-teal-700', bg: 'bg-teal-50' },     // Vibrant Deep Teal
      'Kebersihan': { bar: '#059669', text: 'text-emerald-700', bg: 'bg-emerald-50' },     // Fresh Emerald
      'Infrastruktur Jalan': { bar: '#2563EB', text: 'text-blue-700', bg: 'bg-blue-50' }, // Sapphire Blue
      'Lampu Jalan': { bar: '#D97706', text: 'text-amber-700', bg: 'bg-amber-50' },        // Warm Amber
      'Fasilitas Umum': { bar: '#7C3AED', text: 'text-violet-700', bg: 'bg-violet-50' },   // Violet
      'Keamanan': { bar: '#E11D48', text: 'text-rose-700', bg: 'bg-rose-50' },              // Coral Rose
      'Lainnya': { bar: '#475569', text: 'text-slate-700', bg: 'bg-slate-50' },             // Slate
    };

    if (colorMap[catName]) return colorMap[catName];

    const fallbackColors = [
      { bar: '#0D9488', text: 'text-teal-700', bg: 'bg-teal-50' },
      { bar: '#2563EB', text: 'text-blue-700', bg: 'bg-blue-50' },
      { bar: '#059669', text: 'text-emerald-700', bg: 'bg-emerald-50' },
      { bar: '#D97706', text: 'text-amber-700', bg: 'bg-amber-50' },
      { bar: '#7C3AED', text: 'text-violet-700', bg: 'bg-violet-50' },
      { bar: '#E11D48', text: 'text-rose-700', bg: 'bg-rose-50' },
      { bar: '#475569', text: 'text-slate-700', bg: 'bg-slate-50' },
    ];
    return fallbackColors[index % fallbackColors.length];
  };

  // Weekly Activity Graph Computations
  const daysOfWeekShort = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
  const currentDayIndex = new Date().getDay();
  const reportsByDay = filteredDashboardComplaints.reduce((acc: any, curr: any) => {
    const d = new Date(curr.created_at).getDay();
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});
  const maxDailyReports = Math.max(...Object.values(reportsByDay) as number[], 1);

  const getStatusDesign = (status: string) => {
    switch(status) {
      case 'done':
      case 'approved':
        return { bg: 'bg-[#F0F9F0] border-[#E0F2E0]', text: 'text-[#2E7D32]', dot: 'bg-[#4CAF50]', label: 'Resolved' };
      case 'process':
        return { bg: 'bg-[#FDF3E7] border-[#FAD7B5]', text: 'text-[#D97706]', dot: 'bg-[#F59E0B]', label: 'In Progress' };
      case 'rejected':
        return { bg: 'bg-red-50 border-red-200', text: 'text-red-600', dot: 'bg-red-500', label: 'Rejected' };
      default:
        return { bg: 'bg-[#F3F4F6] border-[#E5E7EB]', text: 'text-[#4B5563]', dot: 'bg-[#9CA3AF]', label: 'Pending' };
    }
  };

  const getTimeRangeLabel = () => {
    switch(timeRange) {
      case '7days': return '7 Hari Terakhir';
      case '30days': return '30 Hari Terakhir';
      case 'month': return 'Bulan Ini';
      default: return 'Semua Waktu';
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F4FAF9] font-sans text-[#2D3748]">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-[#F2F4ED] border-r border-[#E2E8E0] flex flex-col h-screen sticky top-0 flex-shrink-0 z-30">
        {/* Branding */}
        <div className="p-6 pt-8 flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#2C8582] rounded-xl flex items-center justify-center shadow-sm">
            <ShieldAlert className="text-white" size={20} />
          </div>
          <div>
            <h1 className="font-black text-lg text-[#1C2319] leading-none tracking-tight">Admin Panel</h1>
            <p className="text-[11px] font-bold text-[#65735F] uppercase tracking-wider mt-1">
              {currentUser?.role === 'super_admin' ? 'Super Admin' : 'Admin Kelurahan'}
            </p>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          <NavItem 
            icon={<LayoutDashboard size={18} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavItem 
            icon={<FileText size={18} />} 
            label="Reports" 
            active={activeTab === 'reports'} 
            onClick={() => setActiveTab('reports')} 
          />
          <NavItem 
            icon={<Users size={18} />} 
            label="Users" 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')} 
          />
          <NavItem 
            icon={<Settings size={18} />} 
            label="Settings" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
        </nav>

        {/* Bottom Utility Actions */}
        <div className="p-4 border-t border-[#DFE5DA] space-y-1">
          <button 
            onClick={() => setIsHelpModalOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-[#E8ECD9] rounded-xl transition-colors cursor-pointer"
          >
            <HelpCircle size={18} className="text-[#2C8582]" />
            Help Center
          </button>
          <button 
            onClick={logout} 
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-[#B91C1C] hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

        {/* Small Footer Profile Snippet */}
        <div className="p-4 bg-[#EBF0E8] flex items-center gap-3 border-t border-[#DFE5DA]">
          <div className="w-9 h-9 rounded-full bg-[#2C8582] text-white flex items-center justify-center text-xs font-bold shadow-sm overflow-hidden flex-shrink-0">
            {currentUser?.profile_image ? (
              <img src={`${API_BASE_URL}${currentUser.profile_image}`} className="w-full h-full object-cover" alt="Admin" />
            ) : (
              currentUser?.name?.[0]?.toUpperCase() || 'A'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#2D3629] truncate leading-none mb-1">{currentUser?.name || 'Admin'}</p>
            <p className="text-[10px] font-bold text-[#6B7B64] uppercase tracking-wider">Active Session</p>
          </div>
        </div>
      </aside>


      {/* --- MAIN CONTENT WRAPPER --- */}
      <main className="flex-1 overflow-y-auto h-screen relative">
        
        {/* Header Bar */}
        <header className="h-16 bg-[#F4FAF9]/90 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20 border-b border-gray-100/50">
          <div className="text-sm font-bold text-[#889982]">BREAKING NEWS System Console</div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { fetchComplaints(); fetchUsers(); }}
              className="text-xs font-bold text-[#2C8582] bg-white border border-gray-200 hover:bg-[#E0F4F3] px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw size={13} />
              <span>Refresh</span>
            </button>
          </div>
        </header>

        {/* Container Body */}
        <div className="p-8 pt-4">

          {/* 1. DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <header className="flex justify-between items-end mb-2">
                <div>
                  <h2 className="text-3xl font-black text-[#1C2319] tracking-tight">Analytics Overview</h2>
                  <p className="text-[#65735F] font-medium mt-1">Real-time insights for your operations and systems.</p>
                </div>
                
                {/* Header Controls: Time Range & Export */}
                <div className="flex items-center gap-3 relative">
                  <div className="relative">
                    <button 
                      onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                      className="bg-white border border-gray-200 text-sm font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm text-[#3B4736] hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <Calendar size={16} className="text-[#2C8582]" />
                      <span>{getTimeRangeLabel()}</span>
                    </button>
                    {isTimeDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-30 animate-in fade-in">
                        <button 
                          onClick={() => { setTimeRange('7days'); setIsTimeDropdownOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm font-bold flex items-center justify-between ${timeRange === '7days' ? 'text-[#2C8582] bg-[#E0F4F3]' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          7 Hari Terakhir
                          {timeRange === '7days' && <Check size={14} />}
                        </button>
                        <button 
                          onClick={() => { setTimeRange('30days'); setIsTimeDropdownOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm font-bold flex items-center justify-between ${timeRange === '30days' ? 'text-[#2C8582] bg-[#E0F4F3]' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          30 Hari Terakhir
                          {timeRange === '30days' && <Check size={14} />}
                        </button>
                        <button 
                          onClick={() => { setTimeRange('month'); setIsTimeDropdownOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm font-bold flex items-center justify-between ${timeRange === 'month' ? 'text-[#2C8582] bg-[#E0F4F3]' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          Bulan Ini
                          {timeRange === 'month' && <Check size={14} />}
                        </button>
                        <button 
                          onClick={() => { setTimeRange('all'); setIsTimeDropdownOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm font-bold flex items-center justify-between ${timeRange === 'all' ? 'text-[#2C8582] bg-[#E0F4F3]' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          Semua Waktu
                          {timeRange === 'all' && <Check size={14} />}
                        </button>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => exportComplaintsToCSV(filteredDashboardComplaints, `rekap-laporan-${timeRange}.csv`)}
                    className="bg-white border border-gray-200 text-sm font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm text-[#3B4736] hover:bg-[#2C8582] hover:text-white hover:border-[#2C8582] transition-all cursor-pointer"
                    title="Export CSV Laporan"
                  >
                    <Download size={16} /> 
                    <span>Export</span>
                  </button>
                </div>
              </header>

              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard 
                  label="TOTAL REPORTS" 
                  value={filteredDashboardComplaints.length.toLocaleString()} 
                  change={filteredDashboardComplaints.length > 0 ? '+100%' : '0%'} 
                  icon={<FileText className="text-gray-500" size={20} />} 
                />
                <StatCard 
                  label="PENDING" 
                  value={totalPending.toString()} 
                  change={`${Math.round((totalPending / Math.max(1, filteredDashboardComplaints.length)) * 100)}%`} 
                  icon={<Clock className="text-orange-500" size={20} />} 
                  glow="bg-orange-50/50"
                />
                <StatCard 
                  label="RESOLVED" 
                  value={totalResolved.toString()} 
                  change={`${Math.round((totalResolved / Math.max(1, filteredDashboardComplaints.length)) * 100)}%`} 
                  icon={<CheckCircle2 className="text-green-600" size={20} />} 
                  glow="bg-green-50/50"
                />
                <StatCard 
                  label="TOTAL USERS" 
                  value={users.length.toLocaleString()} 
                  change={`+${users.length}`} 
                  icon={<Users className="text-blue-500" size={20} />} 
                />
              </div>

              {/* Row 2: Charts Simulation */}
              <div className="grid grid-cols-3 gap-6">
                {/* Main Weekly Bar Chart Simulation */}
                <div className="col-span-2 bg-white border border-gray-100 shadow-sm rounded-3xl p-6 relative">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="font-bold text-lg text-[#1C2319]">Laporan Masuk (Mingguan)</h3>
                      <p className="text-xs text-gray-400">Frekuensi pengaduan warga berdasarkan hari</p>
                    </div>
                    <div className="relative">
                      <button 
                        onClick={() => setIsChartMenuOpen(!isChartMenuOpen)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        <MoreVertical size={20} />
                      </button>
                      {isChartMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-20 animate-in fade-in text-sm font-bold">
                          <button 
                            onClick={() => { fetchComplaints(); setIsChartMenuOpen(false); }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                          >
                            <RefreshCw size={14} /> Refresh Data
                          </button>
                          <button 
                            onClick={() => { exportComplaintsToCSV(filteredDashboardComplaints); setIsChartMenuOpen(false); }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                          >
                            <Download size={14} /> Download Rekap
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="h-64 flex flex-col justify-end px-2 pb-4 relative border-b border-gray-100">
                    <div className="h-48 w-full flex items-end justify-around relative">
                      {/* Subtle horizontal grid lines */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
                        <div className="border-b border-dashed border-gray-200 w-full"></div>
                        <div className="border-b border-dashed border-gray-200 w-full"></div>
                        <div className="border-b border-dashed border-gray-200 w-full"></div>
                        <div className="border-b border-gray-200 w-full"></div>
                      </div>

                      {[1, 2, 3, 4, 5, 6, 0].map((dIndex) => {
                        const count = reportsByDay[dIndex] || 0;
                        const barHeightPx = maxDailyReports > 0 ? Math.round((count / maxDailyReports) * 140) : 0;
                        const isToday = dIndex === currentDayIndex;
                        
                        return (
                          <div key={dIndex} className="flex flex-col items-center group relative z-10 flex-1 h-full justify-end px-1">
                            {/* Value Count */}
                            <span className={`text-xs font-black mb-1.5 transition-colors ${
                              isToday ? 'text-[#2C8582]' : count > 0 ? 'text-[#1C2319]' : 'text-gray-300'
                            }`}>
                              {count}
                            </span>

                            {/* Bar Column Pillar */}
                            <div className="w-10 bg-gray-100/70 hover:bg-gray-100 rounded-t-xl overflow-hidden flex flex-col justify-end h-[140px] p-0.5 transition-all cursor-pointer">
                              <div 
                                className={`w-full rounded-t-lg transition-all duration-700 ease-out shadow-sm ${
                                  isToday 
                                    ? 'bg-[#2C8582] shadow-md shadow-teal-700/25' 
                                    : count > 0 
                                      ? 'bg-[#4A726E] group-hover:bg-[#2C8582]' 
                                      : 'bg-transparent'
                                }`} 
                                style={{ height: `${count > 0 ? Math.max(14, barHeightPx) : 0}px` }}
                              ></div>
                            </div>

                            {/* Day of Week */}
                            <span className={`text-[11px] font-extrabold tracking-wider mt-2 transition-all ${
                              isToday 
                                ? 'text-[#2C8582] font-black' 
                                : 'text-gray-500 group-hover:text-gray-800'
                            }`}>
                              {daysOfWeekShort[dIndex]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Category distribution horizontal bar chart (Diagram Batang) */}
                <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h3 className="font-bold text-lg text-[#1C2319]">Distribusi Kategori</h3>
                        <p className="text-xs text-gray-400">Top kategori masalah yang dilaporkan</p>
                      </div>
                      <div className="px-2.5 py-1 rounded-xl bg-gray-100 text-gray-700 text-xs font-black flex items-center gap-1.5 shadow-sm">
                        <span>{filteredDashboardComplaints.length}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">DATA</span>
                      </div>
                    </div>

                    <div className="space-y-3.5 mt-4">
                      {topCats.length === 0 ? (
                        <div className="py-12 text-center text-xs text-gray-400 italic">
                          Belum ada data laporan dalam rentang waktu ini.
                        </div>
                      ) : (
                        topCats.map(([name, cnt]: any, idx) => {
                          const totalCount = filteredDashboardComplaints.length || 1;
                          const percentOfTotal = Math.round((cnt / totalCount) * 100);
                          const percentWidth = Math.round((cnt / maxCatCount) * 100);
                          const style = getCategoryColor(name, idx);

                          return (
                            <div key={name} className="group">
                              <div className="flex items-center justify-between text-xs mb-1.5">
                                <div className="flex items-center gap-2 min-w-0 pr-2">
                                  <span 
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                                    style={{ backgroundColor: style.bar }}
                                  />
                                  <span className="font-semibold text-gray-800 truncate" title={name}>
                                    {name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className="text-[11px] font-medium text-gray-400">
                                    {percentOfTotal}%
                                  </span>
                                  <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md text-[11px]">
                                    {cnt}
                                  </span>
                                </div>
                              </div>

                              {/* Horizontal Bar (Diagram Batang) */}
                              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden p-0.5">
                                <div 
                                  className="h-full rounded-full transition-all duration-700 ease-out shadow-sm"
                                  style={{ 
                                    width: `${Math.max(8, percentWidth)}%`,
                                    backgroundColor: style.bar
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 mt-4">
                    <span>Diagram Batang Kategori</span>
                    <span className="font-bold text-[#2C8582]">Live Data</span>
                  </div>
                </div>
              </div>

              {/* Row 3: Mini Map and Activity */}
              <div className="grid grid-cols-5 gap-6 pb-10">
                <div className="col-span-3 bg-white border border-gray-100 shadow-sm rounded-3xl p-6 overflow-hidden flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-[#1C2319]">Map Overview</h3>
                    <button 
                      onClick={() => router.push('/map')}
                      className="text-xs font-bold text-[#2C8582] hover:text-[#48CCC4] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      VIEW FULL MAP <ArrowUpRight size={14}/>
                    </button>
                  </div>
                  <div className="h-64 bg-[#E8ECE6] rounded-2xl overflow-hidden border relative flex-1">
                    {complaints.length > 0 ? (
                      <MapOverviewAdmin complaints={complaints} />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-[#65735F]">
                        <MapPin size={32} />
                        <p className="text-sm font-bold mt-2">Tidak ada data koordinat.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Activity List */}
                <div className="col-span-2 bg-white border border-gray-100 shadow-sm rounded-3xl p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-[#1C2319]">Recent Activity</h3>
                    <button 
                      onClick={() => setActiveTab('reports')}
                      className="text-xs font-bold text-[#2C8582] hover:underline cursor-pointer"
                    >
                      VIEW ALL
                    </button>
                  </div>
                  <div className="flex-1 space-y-3 overflow-y-auto max-h-64">
                    {complaints.slice(0, 4).map((item) => (
                      <div 
                        key={item.id} 
                        onClick={() => handleViewDetails(item)}
                        className="flex gap-4 items-start group cursor-pointer hover:bg-[#F4FAF9] p-2.5 rounded-2xl transition-colors border border-transparent hover:border-gray-100"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#E7F3F1] flex items-center justify-center flex-shrink-0 shadow-inner">
                          <FileText size={18} className="text-[#2C8582]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline">
                            <h4 className="text-sm font-bold text-[#2D3629] truncate">{item.title}</h4>
                            <span className="text-[10px] font-bold text-gray-400 flex-shrink-0 ml-1">
                              {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.description}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-[9px] font-bold px-2 py-0.5 bg-[#F9F5ED] text-[#D97706] rounded-full border border-[#FAEAD0] tracking-wide uppercase">
                              {item.status}
                            </span>
                            <span className="text-[10px] text-gray-400">oleh {item.user_name}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {complaints.length === 0 && (
                      <p className="text-xs text-gray-400 italic text-center py-8">Belum ada pengaduan terbaru.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* 2. REPORTS MANAGEMENT VIEW */}
          {activeTab === 'reports' && (
            <div className="animate-in fade-in duration-300 pb-10">
              {/* Sub Header */}
              <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <h2 className="text-3xl font-black text-[#1C2319] tracking-tight">Report Management</h2>
                  <p className="text-[#65735F] font-medium mt-1">Review, filter, and resolve community submissions.</p>
                </div>

                {/* Filter and Export Buttons */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Category Filter Dropdown */}
                  <div className="relative">
                    <select
                      value={categoryFilter}
                      onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                      className="bg-white border border-gray-200 text-xs font-bold px-3 py-2.5 rounded-xl shadow-sm text-[#3B4736] outline-none focus:ring-2 focus:ring-[#2C8582] cursor-pointer"
                    >
                      <option value="all">Semua Kategori</option>
                      <option value="Infrastruktur Jalan">Infrastruktur Jalan</option>
                      <option value="Kebersihan">Kebersihan</option>
                      <option value="Lampu Jalan">Lampu Jalan</option>
                      <option value="Keamanan">Keamanan</option>
                      <option value="Fasilitas Umum">Fasilitas Umum</option>
                      <option value="Kejadian Bencana">Kejadian Bencana</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>

                  {/* Status Filter Dropdown */}
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                      className="bg-white border border-gray-200 text-xs font-bold px-3 py-2.5 rounded-xl shadow-sm text-[#3B4736] outline-none focus:ring-2 focus:ring-[#2C8582] cursor-pointer"
                    >
                      <option value="all">Semua Status</option>
                      <option value="pending">Pending</option>
                      <option value="process">In Progress</option>
                      <option value="done">Resolved</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  {/* Export Filtered CSV */}
                  <button 
                    onClick={() => exportComplaintsToCSV(filteredComplaints, 'laporan-terfilter.csv')}
                    className="bg-white border border-gray-200 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm text-[#3B4736] hover:bg-[#2C8582] hover:text-white transition-all cursor-pointer"
                  >
                    <Download size={14} /> Export CSV
                  </button>
                </div>
              </div>

              {/* Bulk Action Bar (Visible when items selected) */}
              {selectedIds.length > 0 && (
                <div className="mb-4 bg-[#2C8582] text-white p-4 rounded-2xl shadow-lg flex items-center justify-between animate-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckSquare size={18} />
                    <span>{selectedIds.length} laporan terpilih</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleBulkUpdateStatus('done')}
                      className="bg-white text-[#2C8582] font-bold text-xs px-3.5 py-1.5 rounded-xl hover:bg-gray-100 transition-colors shadow-sm cursor-pointer"
                    >
                      Tandai Selesai (Resolve)
                    </button>
                    <button 
                      onClick={() => handleBulkUpdateStatus('process')}
                      className="bg-[#D97706] text-white font-bold text-xs px-3.5 py-1.5 rounded-xl hover:bg-orange-600 transition-colors shadow-sm cursor-pointer"
                    >
                      Tandai Diproses
                    </button>
                    <button 
                      onClick={handleBulkDelete}
                      className="bg-red-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl hover:bg-red-600 transition-colors shadow-sm cursor-pointer"
                    >
                      Hapus Terpilih
                    </button>
                    <button 
                      onClick={() => setSelectedIds([])}
                      className="text-white/80 hover:text-white text-xs underline font-bold px-2 cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}

              {/* Table Content Area */}
              <div className="bg-white rounded-3xl border border-gray-200 shadow-md overflow-hidden mb-6">
                
                {/* Internal Search Bar in Table container */}
                <div className="p-4 px-6 border-b border-gray-100 flex justify-between items-center bg-[#FDFEFC]">
                  <div className="flex items-center gap-2 text-sm text-[#65735F] font-bold">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.length === paginatedComplaints.length && paginatedComplaints.length > 0}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 accent-[#2C8582] cursor-pointer" 
                    />
                    <span>Select All on Page</span>
                  </div>
                  <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input 
                      value={searchQuery}
                      onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                      placeholder="Cari ID, judul, atau pelapor..." 
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-white border border-gray-200 outline-none focus:ring-2 focus:ring-[#2C8582]"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#FAFBFA] text-[11px] font-bold text-[#7B8C76] uppercase tracking-wider">
                        <th className="p-4 pl-6 w-10"></th>
                        <th className="p-4">Report ID</th>
                        <th className="p-4">Title & Details</th>
                        <th className="p-4">Reporter</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedComplaints.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-12 text-center text-gray-400 italic font-medium">
                            Tidak ada data pengaduan yang sesuai filter.
                          </td>
                        </tr>
                      ) : (
                        paginatedComplaints.map((c: any) => (
                          <ComplaintRow 
                            key={c.id} 
                            complaint={c} 
                            onViewDetails={handleViewDetails} 
                            onDelete={handleDeleteComplaint} 
                            getStatusDesign={getStatusDesign}
                            isSelected={selectedIds.includes(c.id)}
                            onToggleSelect={handleToggleSelectRow}
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Interactive Pagination */}
                <div className="px-6 py-4 border-t border-gray-100 bg-[#FAFBFA] flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-[#65735F] font-bold">
                  <div>
                    Menampilkan {filteredComplaints.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredComplaints.length)} dari {filteredComplaints.length} laporan
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 border rounded-xl bg-white disabled:opacity-40 hover:bg-gray-50 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={14} className="rotate-180" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-colors cursor-pointer ${
                          currentPage === pageNumber ? 'bg-[#2C8582] text-white shadow-sm' : 'bg-white border text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    ))}
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 border rounded-xl bg-white disabled:opacity-40 hover:bg-gray-50 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* --- OVERLAY DETAIL PANEL SLIDE-OUT --- */}
              {selectedComplaint && (
                <div className="fixed inset-0 z-50 flex justify-end animate-in slide-in-from-right duration-300">
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedComplaint(null)}></div>
                  <div className="relative w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col overflow-hidden">
                    
                    {/* Header Panel */}
                    <div className="p-6 bg-[#F4FAF9] border-b flex items-center justify-between sticky top-0 z-10">
                      <div>
                        <span className="text-xs font-bold text-[#2C8582] tracking-wider uppercase bg-[#EAF0E8] px-2.5 py-1 rounded-lg">
                          DETAIL LAPORAN #LP-{selectedComplaint.id.toString().padStart(4, '0')}
                        </span>
                        <h2 className="text-2xl font-black text-[#1C2319] mt-2">{selectedComplaint.title}</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Pelapor: <span className="font-bold text-gray-700">{selectedComplaint.user_name}</span></p>
                      </div>
                      <button 
                        onClick={() => setSelectedComplaint(null)} 
                        className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 text-lg cursor-pointer"
                      >
                        &times;
                      </button>
                    </div>

                    {/* Content Body Panel scrollable */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-6">
                      
                      {/* Top Row: Controls & Context */}
                      <div className="bg-[#FAFBFA] border border-[#EAEFE8] p-5 rounded-3xl space-y-3">
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-black text-gray-500 uppercase tracking-wider">UPDATE STATUS PENANGANAN</p>
                          <p className="text-xs font-bold text-gray-400">
                            {new Date(selectedComplaint.created_at).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {['pending', 'process', 'done', 'approved', 'rejected'].map(stKey => {
                            const isCurrent = selectedComplaint.status === stKey;
                            let label = 'Pending';
                            let activeCls = 'bg-gray-700 text-white';
                            if (stKey === 'process') { label = 'In Progress'; activeCls = 'bg-[#D97706] text-white'; }
                            if (stKey === 'done') { label = 'Resolved'; activeCls = 'bg-[#166534] text-white'; }
                            if (stKey === 'approved') { label = 'Approved'; activeCls = 'bg-[#2C8582] text-white'; }
                            if (stKey === 'rejected') { label = 'Rejected'; activeCls = 'bg-red-600 text-white'; }

                            return (
                              <button 
                                key={stKey}
                                onClick={() => updateStatus(selectedComplaint.id, stKey)}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                                  isCurrent ? `${activeCls} shadow-md` : 'bg-white text-gray-600 hover:bg-gray-100 border-gray-200'
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Description & Image */}
                      <div>
                        <h3 className="font-black text-lg text-[#1C2319] mb-3 flex items-center gap-2">
                          <div className="w-1.5 h-5 bg-[#2C8582] rounded-full"></div>
                          Deskripsi Masalah
                        </h3>
                        <p className="text-gray-700 leading-relaxed bg-[#F9FBFA] p-6 rounded-2xl text-sm border border-gray-100 shadow-inner whitespace-pre-wrap">
                          {selectedComplaint.description}
                        </p>
                      </div>

                      {selectedComplaint.image && (
                        <div>
                          <h3 className="font-black text-lg text-[#1C2319] mb-3 flex items-center gap-2">
                            <div className="w-1.5 h-5 bg-[#2C8582] rounded-full"></div>
                            Foto Lampiran Bukti
                          </h3>
                          <div className="rounded-3xl overflow-hidden shadow-md border-4 border-white bg-gray-100 max-h-96">
                            <img 
                              src={`${API_BASE_URL}${selectedComplaint.image}`} 
                              alt="Lampiran Laporan" 
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </div>
                      )}

                      {/* Map View Integration */}
                      {selectedComplaint.latitude && selectedComplaint.longitude && (
                        <div>
                          <h3 className="font-black text-lg text-[#1C2319] mb-3 flex items-center gap-2">
                            <MapPin size={20} className="text-[#2C8582]"/> Titik Lokasi Masalah
                          </h3>
                          <div className="h-64 rounded-2xl overflow-hidden border shadow-inner">
                            <MapViewer 
                              latitude={parseFloat(selectedComplaint.latitude)} 
                              longitude={parseFloat(selectedComplaint.longitude)} 
                              title={selectedComplaint.title} 
                            />
                          </div>
                        </div>
                      )}

                      {/* Timeline responses */}
                      <div>
                        <h3 className="font-black text-lg text-[#1C2319] mb-4">Linimasa Tanggapan Resmi</h3>
                        <div className="space-y-4 pl-2 border-l-2 border-[#EAF0E8]">
                          {selectedComplaint.responses?.map((resp: any) => (
                            <div key={resp.id} className="relative pl-6">
                              <div className="absolute -left-[9px] top-1 w-4 h-4 bg-[#2C8582] border-2 border-white rounded-full shadow-sm"></div>
                              <div className="bg-white border border-[#EBEFE8] rounded-2xl p-4 shadow-sm">
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 rounded-full bg-[#E0F4F3] flex items-center justify-center text-[10px] font-black text-[#2C8582]">
                                      {resp.admin_name?.[0]?.toUpperCase() || 'A'}
                                    </div>
                                    <div>
                                      <p className="text-sm font-black text-[#2D3629] leading-none mb-1">{resp.admin_name}</p>
                                      <p className="text-[10px] font-medium text-gray-400">{new Date(resp.created_at).toLocaleString('id-ID')}</p>
                                    </div>
                                  </div>
                                  <button onClick={() => handleDeleteResponse(resp.id)} className="text-red-400 hover:text-red-600 cursor-pointer p-1" title="Hapus Tanggapan">
                                    <Trash2 size={14}/>
                                  </button>
                                </div>
                                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl whitespace-pre-wrap">"{resp.message}"</p>
                              </div>
                            </div>
                          ))}

                          {(!selectedComplaint.responses || selectedComplaint.responses.length === 0) && (
                            <p className="pl-6 text-sm text-gray-400 italic">Belum ada tanggapan resmi yang diberikan.</p>
                          )}
                        </div>
                      </div>

                      {/* Submit Response Form sticky bottom */}
                      <div className="pt-2">
                        <div className="bg-[#F4FAF9] border border-[#E2E8E0] rounded-3xl p-5 shadow-sm">
                          <h4 className="font-bold text-[#2D3629] mb-3">Tulis Tanggapan Resmi Pemerintah</h4>
                          <form onSubmit={submitResponse} className="space-y-3">
                            <textarea 
                              required
                              value={responseMsg}
                              onChange={e => setResponseMsg(e.target.value)}
                              placeholder="Masukkan tanggapan, arahan tindakan, atau estimasi penyelesaian..." 
                              className="w-full bg-white rounded-xl border border-gray-200 p-3.5 text-sm outline-none focus:ring-2 focus:ring-[#2C8582] h-28 resize-none shadow-inner"
                            ></textarea>
                            <button type="submit" className="w-full bg-[#2C8582] text-white font-bold py-3.5 rounded-xl hover:bg-[#48CCC4] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer">
                              Kirim Tanggapan Resmi
                            </button>
                          </form>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}
            </div>
          )}


          {/* 3. USER MANAGEMENT VIEW */}
          {activeTab === 'users' && (
            <div className="animate-in fade-in duration-300 pb-10">
              <header className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-3xl font-black text-[#1C2319] tracking-tight">User Management</h2>
                  <p className="text-[#65735F] font-medium mt-1">Manage platform access, roles, and community members.</p>
                </div>
                {currentUser?.role === 'super_admin' && (
                  <button 
                    onClick={() => setIsAddUserModalOpen(true)}
                    className="bg-[#2C8582] hover:bg-[#48CCC4] text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <Plus size={18} />
                    <span>Add New User</span>
                  </button>
                )}
              </header>

              {/* Statistics Topbar Cards */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-5">
                  <div className="w-14 h-14 bg-[#E7F3F1] rounded-2xl flex items-center justify-center shadow-inner text-[#2C8582]">
                    <Users size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold tracking-wider text-[#65735F] uppercase mb-1">Total Users</p>
                    <h4 className="text-3xl font-black text-[#1C2319]">{users.length.toLocaleString()}</h4>
                  </div>
                </div>
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-5">
                  <div className="w-14 h-14 bg-[#FFF4F2] rounded-2xl flex items-center justify-center shadow-inner text-[#C05621]">
                    <ShieldAlert size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold tracking-wider text-[#65735F] uppercase mb-1">Super Admins</p>
                    <h4 className="text-3xl font-black text-[#1C2319]">{users.filter(u => u.role === 'super_admin').length}</h4>
                  </div>
                </div>
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-5">
                  <div className="w-14 h-14 bg-[#EFF6FF] rounded-2xl flex items-center justify-center shadow-inner text-[#1D4ED8]">
                    <UserCheck size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold tracking-wider text-[#65735F] uppercase mb-1">Standard Admins</p>
                    <h4 className="text-3xl font-black text-[#1C2319]">{users.filter(u => u.role === 'admin').length}</h4>
                  </div>
                </div>
              </div>

              {/* Users Grid Table */}
              <div className="bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden">
                <div className="p-5 px-8 bg-[#FDFEFC] border-b border-gray-100 flex items-center justify-between">
                  <div className="relative w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      value={userSearchQuery}
                      onChange={e => setUserSearchQuery(e.target.value)}
                      placeholder="Cari nama, email, atau role..." 
                      className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2C8582] outline-none shadow-inner"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F8FAF7] text-[11px] font-extrabold tracking-widest text-[#7B8C76] uppercase border-b">
                        <th className="p-5 pl-8">User Profile</th>
                        <th className="p-5">Email Address</th>
                        <th className="p-5">Access Role</th>
                        <th className="p-5">Registered Date</th>
                        <th className="p-5 text-center">Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-gray-400 italic font-medium">
                            Pengguna tidak ditemukan.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-[#FAFCFA] transition-colors group">
                            <td className="p-5 pl-8">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold shadow-sm overflow-hidden flex-shrink-0 ${(u.role === 'super_admin' || u.role === 'admin') ? 'bg-[#F0F6FF] text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                                  {u.profile_image ? (
                                    <img src={`${API_BASE_URL}${u.profile_image}`} className="w-full h-full object-cover" alt={u.name} />
                                  ) : (
                                    u.name?.[0]?.toUpperCase() || 'U'
                                  )}
                                </div>
                                <span className="font-black text-[15px] text-[#1C2319]">{u.name}</span>
                              </div>
                            </td>
                            <td className="p-5">
                              <span className="text-sm text-gray-500 font-medium">{u.email}</span>
                            </td>
                            <td className="p-5">
                              <select
                                value={u.role}
                                onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                                disabled={u.role === 'super_admin' || u.id === currentUser?.id || currentUser?.role !== 'super_admin'}
                                className={`inline-block px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border border-transparent outline-none cursor-pointer ${
                                  (u.role === 'super_admin' || u.role === 'admin') ? 'bg-[#E0F4F3] text-[#2C8582]' : 
                                  'bg-gray-100 text-gray-600'
                                } disabled:opacity-85 disabled:cursor-not-allowed`}
                              >
                                <option value="user" className="bg-white text-gray-600">USER</option>
                                <option value="admin" className="bg-white text-[#2C8582]">ADMIN</option>
                                {u.role === 'super_admin' && (
                                  <option value="super_admin" className="bg-white text-[#2C8582]">SUPER ADMIN</option>
                                )}
                              </select>
                            </td>
                            <td className="p-5">
                              <span className="text-xs font-bold text-[#65735F]">
                                {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                              </span>
                            </td>
                            <td className="p-5 text-center">
                              <div className="flex justify-center gap-2">
                                <button 
                                  onClick={() => { setEditingUser(u); setEditUserRole(u.role); }}
                                  className="p-2 rounded-xl border bg-white text-gray-400 hover:text-[#2C8582] hover:border-[#2C8582] shadow-sm transition-colors cursor-pointer"
                                  title="Edit Pengguna"
                                >
                                  <Settings size={14} />
                                </button>
                                {u.id !== currentUser?.id && (currentUser?.role === 'super_admin' || u.role === 'user') && (
                                  <button 
                                    onClick={() => handleDeleteUser(u.id)}
                                    className="p-2 rounded-xl border bg-white text-gray-400 hover:text-red-600 hover:border-red-200 shadow-sm transition-colors cursor-pointer"
                                    title="Hapus Pengguna"
                                  >
                                    <XCircle size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-6 border-t bg-[#FAFBFA] flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-bold">Menampilkan {filteredUsers.length} total pengguna</span>
                </div>
              </div>
            </div>
          )}


          {/* 4. SETTINGS VIEW */}
          {activeTab === 'settings' && (
            <div className="animate-in fade-in duration-300 pb-10">
              <header className="mb-8">
                <h2 className="text-3xl font-black text-[#1C2319] tracking-tight">Account Settings</h2>
                <p className="text-[#65735F] font-medium mt-1">Manage your administrator profile and credentials.</p>
              </header>

              <div className="bg-white rounded-3xl border border-gray-200 shadow-lg p-8">
                <form onSubmit={handleAdminProfileSubmit} className="space-y-6 max-w-4xl">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* Left Column: Profile Avatar Upload */}
                    <div className="flex flex-col items-center justify-center border-r md:border-r-gray-100 pr-0 md:pr-8">
                      <div className="relative group w-36 h-36 rounded-full bg-gradient-to-br from-[#E0F4F3] to-[#2C8582] border-[6px] border-[#F3FAF9] shadow-md flex items-center justify-center text-white font-extrabold text-4xl overflow-hidden mb-4">
                        {profileImage ? (
                          <img src={URL.createObjectURL(profileImage)} className="w-full h-full object-cover" alt="Pratinjau" />
                        ) : currentUser?.profile_image ? (
                          <img src={`${API_BASE_URL}${currentUser.profile_image}`} className="w-full h-full object-cover" alt="Foto profil admin" />
                        ) : (
                          currentUser?.name?.[0]?.toUpperCase() || 'A'
                        )}
                      </div>
                      
                      <label className="inline-flex items-center justify-center bg-[#F3FAF9] border border-[#2C8582] text-[#2C8582] font-bold px-4 py-2 rounded-xl text-sm cursor-pointer hover:bg-[#E0F4F3] transition-colors shadow-sm mb-2">
                        Pilih Foto Profil
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => setProfileImage(e.target.files?.[0] || null)} 
                          className="hidden" 
                        />
                      </label>
                      <p className="text-[11px] text-gray-400 text-center">Format JPG, PNG, atau WEBP.<br/>Maksimal 10MB.</p>
                    </div>

                    {/* Right Column: Account Info Fields */}
                    <div className="col-span-2 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nama Lengkap</label>
                        <input 
                          type="text" 
                          required 
                          value={profileName} 
                          onChange={(e) => setProfileName(e.target.value)} 
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#2C8582] text-sm bg-white" 
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Alamat Email</label>
                        <input 
                          type="email" 
                          required 
                          value={profileEmail} 
                          onChange={(e) => setProfileEmail(e.target.value)} 
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#2C8582] text-sm bg-white" 
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Password Baru (Kosongkan jika tidak diubah)</label>
                        <input 
                          type="password" 
                          placeholder="Masukkan password baru minimal 6 karakter" 
                          value={profilePassword} 
                          onChange={(e) => setProfilePassword(e.target.value)} 
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#2C8582] text-sm bg-white" 
                        />
                      </div>

                      <div className="pt-4">
                        <button 
                          type="submit" 
                          disabled={isUpdatingProfile}
                          className="bg-[#2C8582] hover:bg-[#48CCC4] text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                        >
                          {isUpdatingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                      </div>
                    </div>

                  </div>
                </form>
              </div>
            </div>
          )}

          {/* --- MODAL: ADD USER --- */}
          {isAddUserModalOpen && currentUser?.role === 'super_admin' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-300">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAddUserModalOpen(false)}></div>
              <div className="relative w-full max-w-md bg-white shadow-2xl rounded-3xl p-8 z-10 border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-black text-[#1C2319]">Tambah Pengguna Baru</h3>
                  <button onClick={() => setIsAddUserModalOpen(false)} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 cursor-pointer">&times;</button>
                </div>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nama Lengkap</label>
                    <input 
                      type="text" 
                      required
                      value={newUserName}
                      onChange={e => setNewUserName(e.target.value)}
                      placeholder="Masukkan nama lengkap"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#2C8582] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Alamat Email</label>
                    <input 
                      type="email" 
                      required
                      value={newUserEmail}
                      onChange={e => setNewUserEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#2C8582] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Kata Sandi (Password)</label>
                    <input 
                      type="password" 
                      required
                      value={newUserPassword}
                      onChange={e => setNewUserPassword(e.target.value)}
                      placeholder="Min 6 karakter"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#2C8582] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Hak Akses (Role)</label>
                    <select
                      value={newUserRole}
                      onChange={e => setNewUserRole(e.target.value as 'admin' | 'user')}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#2C8582] text-sm bg-white"
                    >
                      <option value="user">User (Warga)</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-[#2C8582] hover:bg-[#48CCC4] text-white font-bold py-3.5 rounded-xl transition-all shadow-md mt-6 cursor-pointer">
                    Simpan Pengguna
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* --- MODAL: EDIT USER QUICK ACTION --- */}
          {editingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-300">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingUser(null)}></div>
              <div className="relative w-full max-w-md bg-white shadow-2xl rounded-3xl p-8 z-10 border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-black text-[#1C2319]">Kelola Pengguna</h3>
                    <p className="text-xs text-gray-500">{editingUser.name} ({editingUser.email})</p>
                  </div>
                  <button onClick={() => setEditingUser(null)} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 cursor-pointer">&times;</button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Ubah Hak Akses (Role)</label>
                    <select
                      value={editUserRole}
                      onChange={e => setEditUserRole(e.target.value as any)}
                      disabled={currentUser?.role !== 'super_admin' || editingUser.id === currentUser?.id}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#2C8582] text-sm bg-white disabled:bg-gray-100"
                    >
                      <option value="user">User (Warga)</option>
                      <option value="admin">Admin</option>
                      {currentUser?.role === 'super_admin' && (
                        <option value="super_admin">Super Admin</option>
                      )}
                    </select>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      onClick={() => handleUpdateUserRole(editingUser.id, editUserRole)}
                      disabled={currentUser?.role !== 'super_admin' || editingUser.id === currentUser?.id}
                      className="flex-1 bg-[#2C8582] text-white font-bold py-3 rounded-xl hover:bg-[#48CCC4] transition-colors shadow-md disabled:opacity-50 cursor-pointer"
                    >
                      Perbarui Role
                    </button>
                    <button
                      onClick={() => setEditingUser(null)}
                      className="px-5 border border-gray-200 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- MODAL: HELP CENTER --- */}
          {isHelpModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-300">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsHelpModalOpen(false)}></div>
              <div className="relative w-full max-w-xl bg-white shadow-2xl rounded-3xl p-8 z-10 border border-gray-100 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#E0F4F3] text-[#2C8582] rounded-xl flex items-center justify-center">
                      <HelpCircle size={22} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-[#1C2319]">Pusat Bantuan & Panduan Admin</h3>
                      <p className="text-xs text-gray-500">Sistem Pengaduan Masyarakat BREAKING NEWS</p>
                    </div>
                  </div>
                  <button onClick={() => setIsHelpModalOpen(false)} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 cursor-pointer">&times;</button>
                </div>

                <div className="space-y-6 text-sm text-gray-700">
                  <div className="bg-[#F8FAF9] p-4 rounded-2xl border border-gray-100">
                    <h4 className="font-bold text-[#2C8582] mb-1 flex items-center gap-2">
                      <AlertCircle size={16} /> Arti Status Pengaduan
                    </h4>
                    <ul className="text-xs space-y-1.5 text-gray-600 list-disc list-inside mt-2">
                      <li><strong>Pending:</strong> Laporan baru masuk dari warga dan menunggu verifikasi admin.</li>
                      <li><strong>In Progress:</strong> Laporan telah ditugaskan ke dinas/petugas terkait untuk tindak lanjut.</li>
                      <li><strong>Resolved / Done:</strong> Masalah telah selesai ditangani di lapangan.</li>
                      <li><strong>Approved:</strong> Pengaduan telah disetujui untuk dimasukkan dalam agenda pembangunan/perbaikan.</li>
                      <li><strong>Rejected:</strong> Pengaduan ditolak karena tidak relevan atau data tidak valid.</li>
                    </ul>
                  </div>

                  <div className="bg-[#F8FAF9] p-4 rounded-2xl border border-gray-100">
                    <h4 className="font-bold text-[#2C8582] mb-1 flex items-center gap-2">
                      <Download size={16} /> Cara Ekspor Rekap Data
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Klik tombol <strong>Export</strong> di halaman Dashboard atau tab Reports untuk mengunduh berkas spreadsheet `.csv` berisi seluruh detail judul, koordinat GPS, pelapor, dan status pengaduan.
                    </p>
                  </div>

                  <div className="bg-[#F8FAF9] p-4 rounded-2xl border border-gray-100">
                    <h4 className="font-bold text-[#2C8582] mb-1 flex items-center gap-2">
                      <PhoneCall size={16} /> Bantuan Teknis & Hotline
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Butuh bantuan teknis server atau pelaporan darurat? Hubungi tim IT Support di: <span className="font-bold text-[#2C8582]">support@laporpak.id</span> atau telepon hotline: <span className="font-bold text-[#2C8582]">(021) 8899-1234</span>.
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t flex justify-end">
                  <button 
                    onClick={() => setIsHelpModalOpen(false)}
                    className="bg-[#2C8582] text-white font-bold px-6 py-2.5 rounded-xl hover:bg-[#48CCC4] transition-colors cursor-pointer"
                  >
                    Saya Mengerti
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// --- REUSABLE SUB-COMPONENTS ---

function NavItem({ icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3.5 px-4 py-3 text-sm font-bold rounded-2xl transition-all duration-300 group cursor-pointer
        ${active 
          ? 'bg-[#A8B3A2] text-[#2D3629] shadow-sm' 
          : 'text-[#65735F] hover:bg-[#E8ECD9] hover:text-[#3B4736]'
        }
      `}
    >
      <div className={`${active ? 'text-[#2D3629]' : 'text-[#7A8B74] group-hover:text-[#4A5944]'} transition-colors`}>
        {icon}
      </div>
      <span className="tracking-tight">{label}</span>
    </button>
  );
}
