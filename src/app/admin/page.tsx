'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
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
  MapPin
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
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');

  // Admin Profile States
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const router = useRouter();

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
      setCurrentUser(JSON.parse(userData));
    }
    fetchComplaints();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (activeTab === 'settings' && currentUser) {
      setProfileName(currentUser.name);
      setProfileEmail(currentUser.email);
      setProfilePassword('');
      setProfileImage(null);
    }
  }, [activeTab, currentUser]);

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
    if (!selectedComplaint) return;
    try {
      await api.post('/responses', { complaint_id: selectedComplaint.id, message: responseMsg });
      setResponseMsg('');
      const res = await api.get(`/complaints/${selectedComplaint.id}`);
      setSelectedComplaint(res.data);
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

  // Computed Stats
  const totalPending = complaints.filter(c => c.status === 'pending').length;
  const totalResolved = complaints.filter(c => c.status === 'done' || c.status === 'approved').length;
  
  // Top 3 categories mapping
  const categoriesObj = complaints.reduce((acc: any, curr: any) => {
    const cat = curr.category || 'Lainnya';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const topCats = Object.entries(categoriesObj).sort((a: any, b: any) => b[1] - a[1]).slice(0, 3);

  // Weekly Activity Graph Computations
  const daysOfWeekShort = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
  const currentDayIndex = new Date().getDay();
  const reportsByDay = complaints.reduce((acc: any, curr: any) => {
    const d = new Date(curr.created_at).getDay();
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});
  const maxDailyReports = Math.max(...Object.values(reportsByDay) as number[], 1);

  // Search Filter for complaints in Reports View
  const filteredComplaints = complaints.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.user_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusDesign = (status: string) => {
    switch(status) {
      case 'done':
      case 'approved':
        return { bg: 'bg-[#F0F9F0] border-[#E0F2E0]', text: 'text-[#2E7D32]', dot: 'bg-[#4CAF50]', label: 'Resolved' };
      case 'process':
        return { bg: 'bg-[#FDF3E7] border-[#FAD7B5]', text: 'text-[#D97706]', dot: 'bg-[#F59E0B]', label: 'In Progress' };
      default:
        return { bg: 'bg-[#F3F4F6] border-[#E5E7EB]', text: 'text-[#4B5563]', dot: 'bg-[#9CA3AF]', label: 'Pending' };
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F4FAF9] font-sans text-[#2D3748]">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-[#F2F4ED] border-r border-[#E2E8E0] flex flex-col h-screen sticky top-0 flex-shrink-0">
        {/* Branding */}
        <div className="p-6 pt-8 flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#2C8582] rounded-xl flex items-center justify-center shadow-sm">
            <ShieldAlert className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-[#2D3629] leading-tight">Admin Panel</h1>
            <p className="text-xs font-semibold text-[#7A8B74]">{currentUser?.role === 'super_admin' ? 'Super Admin' : 'Admin System'}</p>
          </div>
        </div>

        {/* Navigation Routes */}
        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto pt-4">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavItem 
            icon={<FileText size={20} />} 
            label="Reports" 
            active={activeTab === 'reports'} 
            onClick={() => setActiveTab('reports')} 
          />
          
          {/* Dynamic logic for user management tab permission */}
          {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin') && (
            <NavItem 
              icon={<Users size={20} />} 
              label="Users" 
              active={activeTab === 'users'} 
              onClick={() => setActiveTab('users')} 
            />
          )}

          <NavItem 
            icon={<Settings size={20} />} 
            label="Settings" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
        </nav>

        {/* Bottom Meta links */}
        <div className="px-3 py-4 border-t border-[#E2E8E0] space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-[#65735F] hover:bg-[#E8ECD9] rounded-xl transition-colors">
            <HelpCircle size={18} />
            Help Center
          </button>
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-[#B91C1C] hover:bg-red-50 rounded-xl transition-colors">
            <LogOut size={18} />
            Logout
          </button>
        </div>

        {/* Small Footer Profile Snippet */}
        <div className="p-4 bg-[#EBF0E8] flex items-center gap-3 border-t border-[#DFE5DA]">
          <div className="w-8 h-8 rounded-full bg-[#2C8582] text-white flex items-center justify-center text-xs font-bold shadow-sm overflow-hidden flex-shrink-0">
            {currentUser?.profile_image ? (
              <img src={`http://localhost:5000${currentUser.profile_image}`} className="w-full h-full object-cover" alt="Admin" />
            ) : (
              currentUser?.name?.[0]?.toUpperCase() || 'A'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#2D3629] truncate leading-none mb-1">{currentUser?.name || 'Admin'}</p>
            <p className="text-[10px] font-medium text-[#6B7B64] uppercase tracking-wider">Active Session</p>
          </div>
        </div>
      </aside>


      {/* --- MAIN CONTENT WRAPPER --- */}
      <main className="flex-1 overflow-y-auto h-screen relative">
        
        {/* Header Bar */}
        <header className="h-16 bg-[#F4FAF9]/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="text-sm font-bold text-[#889982]">BREAKING NEWS System Console</div>
          <div />
        </header>

        {/* Container Body */}
        <div className="p-8 pt-4">

          {/* 1. DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <header className="flex justify-between items-end mb-2">
                <div>
                  <h2 className="text-3xl font-black text-[#1C2319] tracking-tight">Analytics Overview</h2>
                  <p className="text-[#65735F] font-medium mt-1">Real-time insights for your operations and systems.</p>
                </div>
                <div className="flex gap-3">
                  <button className="bg-white border border-gray-200 text-sm font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm text-[#3B4736] hover:bg-gray-50 transition-colors">
                    📅 Last 30 Days
                  </button>
                  <button className="bg-white border border-gray-200 text-sm font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm text-[#3B4736] hover:bg-gray-50 transition-colors">
                    <Download size={16} /> Export
                  </button>
                </div>
              </header>

              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard 
                  label="TOTAL REPORTS" 
                  value={complaints.length.toLocaleString()} 
                  change="+12%" 
                  icon={<FileText className="text-gray-500" size={20} />} 
                />
                <StatCard 
                  label="PENDING" 
                  value={totalPending.toString()} 
                  change="~3%" 
                  icon={<Clock className="text-orange-500" size={20} />} 
                  glow="bg-orange-50/50"
                />
                <StatCard 
                  label="RESOLVED" 
                  value={totalResolved.toString()} 
                  change="~8%" 
                  icon={<CheckCircle2 className="text-green-600" size={20} />} 
                  glow="bg-green-50/50"
                />
                <StatCard 
                  label="TOTAL USERS" 
                  value={users.length.toLocaleString()} 
                  change="+24%" 
                  icon={<Users className="text-blue-500" size={20} />} 
                />
              </div>

              {/* Row 2: Charts Simulation */}
              <div className="grid grid-cols-3 gap-6">
                {/* Main Weekly Bar Chart Simulation */}
                <div className="col-span-2 bg-white border border-gray-100 shadow-sm rounded-3xl p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-[#1C2319]">Laporan Masuk (Mingguan)</h3>
                    <MoreVertical size={20} className="text-gray-400 cursor-pointer" />
                  </div>
                  <div className="h-64 flex items-end justify-around px-4 pb-4 relative border-b border-gray-100 pt-4">
                    {/* Computed live data bars reflecting actual activity levels */}
                    {[1, 2, 3, 4, 5, 6, 0].map((dIndex) => {
                      const count = reportsByDay[dIndex] || 0;
                      const percentHeight = (count / maxDailyReports) * 85; // Cap visually at 85% to leave room
                      const isToday = dIndex === currentDayIndex;
                      
                      return (
                        <div key={dIndex} className="flex flex-col items-center group gap-2 flex-1 h-full justify-end">
                          <div className="relative w-full flex flex-col items-center group">
                            {/* Tooltip */}
                            <span className="absolute -top-6 scale-0 group-hover:scale-100 bg-[#2D3629] text-white text-[10px] font-bold px-1.5 py-0.5 rounded transition-all duration-100 z-10">
                              {count} Laporan
                            </span>
                            <div 
                              className={`w-10 rounded-md transition-all duration-500 shadow-sm ${isToday ? 'bg-[#2C8582]' : 'bg-[#EBECE6] group-hover:bg-[#D5D8C8]'}`} 
                              style={{ height: `${percentHeight > 5 ? percentHeight : 5}%` }}
                            ></div>
                          </div>
                          <span className={`text-[10px] font-bold ${isToday ? 'text-[#2C8582]' : 'text-gray-400'}`}>
                            {daysOfWeekShort[dIndex]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Category distribution doughnut simulation */}
                <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6">
                  <h3 className="font-bold text-lg text-[#1C2319] mb-6">Distribusi Kategori</h3>
                  <div className="flex justify-center mb-6 relative">
                    {/* Circle representation using borders/conics */}
                    <div className="w-36 h-36 rounded-full border-[14px] border-[#F1F3F0] relative flex items-center justify-center">
                      <div className="absolute inset-[-14px] rounded-full border-[14px] border-transparent border-t-[#2C8582] border-r-[#7E9174] rotate-45"></div>
                      <div className="text-center">
                        <p className="text-2xl font-black text-[#1C2319]">{complaints.length}</p>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-[#65735F]">DATA</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {topCats.map(([name, cnt]: any, idx) => (
                      <div key={name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 font-medium text-[#2D3629]">
                          <span className={`w-3 h-3 rounded-full ${idx === 0 ? 'bg-[#2C8582]' : idx === 1 ? 'bg-[#7E9174]' : 'bg-[#A3B299]'}`}></span>
                          {name}
                        </div>
                        <span className="font-bold text-gray-900">{cnt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 3: Mini Map and Activity */}
              <div className="grid grid-cols-5 gap-6 pb-10">
                <div className="col-span-3 bg-white border border-gray-100 shadow-sm rounded-3xl p-6 overflow-hidden">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-[#1C2319]">Map Overview</h3>
                    <button className="text-xs font-bold text-[#2C8582] hover:underline flex items-center gap-1">VIEW FULL MAP <ArrowUpRight size={12}/></button>
                  </div>
                  <div className="h-60 bg-[#E8ECE6] rounded-2xl overflow-hidden border relative">
                    <div className="absolute inset-0 flex items-center justify-center opacity-40 select-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#98A68E] via-transparent to-transparent"></div>
                    {/* Render true comprehensive map overlay instead of single viewer */}
                    {complaints.length > 0 ? (
                      <MapOverviewAdmin complaints={complaints} />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-[#65735F]">
                        <MapPin size={32} />
                        <p className="text-sm font-bold mt-2">No complaints data found.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Activity List */}
                <div className="col-span-2 bg-white border border-gray-100 shadow-sm rounded-3xl p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-[#1C2319]">Recent Activity</h3>
                    <span className="text-xs font-bold text-[#2C8582] cursor-pointer hover:underline">VIEW ALL</span>
                  </div>
                  <div className="flex-1 space-y-4">
                    {complaints.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex gap-4 items-start group cursor-pointer hover:bg-[#F4FAF9] p-2 rounded-xl transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-[#E7F3F1] flex items-center justify-center flex-shrink-0 shadow-inner">
                          <FileText size={16} className="text-[#2C8582]" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h4 className="text-sm font-bold text-[#2D3629] line-clamp-1">{item.title}</h4>
                            <span className="text-[10px] font-medium text-gray-400 flex-shrink-0">New</span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.description}</p>
                          <div className="mt-2 flex items-center">
                            <span className="text-[9px] font-bold px-2 py-0.5 bg-[#F9F5ED] text-[#D97706] rounded-full border border-[#FAEAD0] tracking-wide uppercase">{item.status}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. REPORTS MANAGEMENT VIEW */}
          {activeTab === 'reports' && (
            <div className="animate-in fade-in duration-500 pb-10">
              {/* Sub Header */}
              <div className="mb-6 flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-black text-[#1C2319] tracking-tight">Report Management</h2>
                  <p className="text-[#65735F] font-medium mt-1">Review, classify, and resolve community submissions.</p>
                </div>
                <div className="flex gap-3">
                  <button className="bg-white border border-gray-200 text-sm font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm text-[#3B4736] hover:bg-gray-50">
                    <Filter size={16} /> Category
                  </button>
                  <button className="bg-white border border-gray-200 text-sm font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm text-[#3B4736] hover:bg-gray-50">
                    <Filter size={16} /> Status
                  </button>
                  <button className="bg-white border border-gray-200 text-sm font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm text-[#3B4736] hover:bg-gray-50">
                    <Download size={16} /> Export
                  </button>
                </div>
              </div>

              {/* Table Content Area */}
              <div className="bg-white rounded-3xl border border-gray-200 shadow-md overflow-hidden mb-6">
                
                {/* Internal Search Bar in Table container */}
                <div className="p-4 px-6 border-b border-gray-100 flex justify-between bg-[#FDFEFC]">
                  <div className="flex items-center gap-2 text-sm text-[#65735F] font-bold">
                    <input type="checkbox" className="w-4 h-4 accent-[#2C8582]" />
                    Select All
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search reports..." 
                      className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg bg-white border border-gray-200 outline-none focus:ring-1 focus:ring-[#2C8582]"
                    />
                  </div>
                </div>

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
                    {filteredComplaints.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-12 text-center text-gray-400 italic font-medium">No complaints data available.</td>
                      </tr>
                    ) : (
                      filteredComplaints.map((c: any) => (
                        <ComplaintRow 
                          key={c.id} 
                          complaint={c} 
                          onViewDetails={handleViewDetails} 
                          onDelete={handleDeleteComplaint} 
                          getStatusDesign={getStatusDesign} 
                        />
                      ))
                    )}
                  </tbody>
                </table>
                <div className="px-6 py-4 border-t border-gray-100 bg-[#FAFBFA] flex justify-between items-center text-xs text-[#65735F] font-bold">
                  <div>Showing {filteredComplaints.length} of {complaints.length} entries</div>
                  <div className="flex gap-1">
                    <button className="p-1.5 border rounded-lg bg-white disabled:opacity-50"><ChevronRight size={14} className="rotate-180" /></button>
                    <button className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#4A5944] text-white">1</button>
                    <button className="p-1.5 border rounded-lg bg-white"><ChevronRight size={14} /></button>
                  </div>
                </div>
              </div>

              {/* --- OVERLAY DETAIL PANEL SLIDE-OUT --- */}
              {selectedComplaint && (
                <div className="fixed inset-0 z-50 flex justify-end animate-in slide-in-from-right duration-300">
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedComplaint(null)}></div>
                  <div className="relative w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col overflow-hidden">
                    
                    {/* Header Panel */}
                    <div className="p-6 bg-[#F4FAF9] border-b flex items-center justify-between sticky top-0 z-10">
                      <div>
                        <span className="text-xs font-bold text-[#2C8582] tracking-wider uppercase bg-[#EAF0E8] px-2 py-0.5 rounded">DETAILS</span>
                        <h2 className="text-2xl font-black text-[#1C2319] mt-1">{selectedComplaint.title}</h2>
                      </div>
                      <button onClick={() => setSelectedComplaint(null)} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100">&times;</button>
                    </div>

                    {/* Content Body Panel scrollable */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-8">
                      
                      {/* Top Row: Controls & Context */}
                      <div className="flex justify-between items-start bg-[#FAFBFA] border border-[#EAEFE8] p-5 rounded-2xl">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">STATUS PENGADUAN</p>
                          <div className="flex gap-2 mt-2">
                            <button 
                              onClick={() => updateStatus(selectedComplaint.id, 'pending')}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${selectedComplaint.status === 'pending' ? 'bg-[#4B5563] text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                            >
                              Pending
                            </button>
                            <button 
                              onClick={() => updateStatus(selectedComplaint.id, 'process')}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${selectedComplaint.status === 'process' ? 'bg-[#D97706] text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                            >
                              In Progress
                            </button>
                            <button 
                              onClick={() => updateStatus(selectedComplaint.id, 'done')}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${selectedComplaint.status === 'done' ? 'bg-[#166534] text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                            >
                              Resolved
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-gray-400 uppercase mb-1">REPORTED ON</p>
                          <p className="text-sm font-bold text-[#2D3629]">{new Date(selectedComplaint.created_at).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                      </div>

                      {/* Description & Image */}
                      <div>
                        <h3 className="font-black text-lg text-[#1C2319] mb-3 flex items-center gap-2">
                          <div className="w-1.5 h-5 bg-[#2C8582] rounded-full"></div>
                          Detail Masalah
                        </h3>
                        <p className="text-gray-700 leading-relaxed bg-gray-50 p-6 rounded-2xl text-base border border-gray-100 shadow-inner">
                          {selectedComplaint.description}
                        </p>
                      </div>

                      {selectedComplaint.image && (
                        <div className="rounded-3xl overflow-hidden shadow-lg border-4 border-white bg-gray-100">
                          <img 
                            src={`http://localhost:5000${selectedComplaint.image}`} 
                            alt="Lampiran Laporan" 
                            className="w-full object-cover hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}

                      {/* Map View Integration */}
                      {selectedComplaint.latitude && selectedComplaint.longitude && (
                        <div>
                          <h3 className="font-black text-lg text-[#1C2319] mb-3 flex items-center gap-2">
                            <MapPin size={20} className="text-[#2C8582]"/> Lokasi Kejadian
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
                        <h3 className="font-black text-lg text-[#1C2319] mb-4">Linimasa Tanggapan</h3>
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
                                      <p className="text-[10px] font-medium text-gray-400">{new Date(resp.created_at).toLocaleString()}</p>
                                    </div>
                                  </div>
                                  <button onClick={() => handleDeleteResponse(resp.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                                </div>
                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">"{resp.message}"</p>
                              </div>
                            </div>
                          ))}

                          {(!selectedComplaint.responses || selectedComplaint.responses.length === 0) && (
                            <p className="pl-6 text-sm text-gray-400 italic">Belum ada tanggapan yang diberikan.</p>
                          )}
                        </div>
                      </div>

                      {/* Submit Response Form sticky bottom */}
                      <div className="pt-4">
                        <div className="bg-[#F4FAF9] border border-[#E2E8E0] rounded-3xl p-5 shadow-sm">
                          <h4 className="font-bold text-[#2D3629] mb-3">Tambah Tanggapan Resmi</h4>
                          <form onSubmit={submitResponse} className="space-y-3">
                            <textarea 
                              required
                              value={responseMsg}
                              onChange={e => setResponseMsg(e.target.value)}
                              placeholder="Masukkan respon penanganan..." 
                              className="w-full bg-white rounded-xl border border-gray-200 p-3 text-sm outline-none focus:ring-2 focus:ring-[#2C8582] h-24 resize-none shadow-inner"
                            ></textarea>
                            <button type="submit" className="w-full bg-[#2C8582] text-white font-bold py-3 rounded-xl hover:bg-[#4A5944] transition-all shadow flex items-center justify-center gap-2">
                              Kirim Respon
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
            <div className="animate-in fade-in duration-500 pb-10">
              <header className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-3xl font-black text-[#1C2319] tracking-tight">User Management</h2>
                  <p className="text-[#65735F] font-medium mt-1">Manage platform access, roles, and community members.</p>
                </div>
                {currentUser?.role === 'super_admin' && (
                  <button 
                    onClick={() => setIsAddUserModalOpen(true)}
                    className="bg-[#4A5944] hover:bg-[#3C4A37] text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5"
                  >
                    <Users size={18} />
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
                    <Users size={24} />
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
                      placeholder="Search by name or email..." 
                      className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2C8582] outline-none shadow-inner"
                    />
                  </div>
                </div>

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
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-[#FAFCFA] transition-colors group">
                        <td className="p-5 pl-8">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold shadow-sm overflow-hidden flex-shrink-0 ${(u.role === 'super_admin' || u.role === 'admin') ? 'bg-[#F0F6FF] text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                              {u.profile_image ? (
                                <img src={`http://localhost:5000${u.profile_image}`} className="w-full h-full object-cover" alt={u.name} />
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
                            disabled={u.role === 'super_admin' || u.id === currentUser?.id}
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
                          <span className="text-xs font-bold text-[#65735F]">Oct 12, 2023</span>
                        </td>
                        <td className="p-5 text-center">
                          <div className="flex justify-center gap-2">
                            <button className="p-2 rounded-xl border bg-white text-gray-400 hover:text-[#2C8582] hover:border-[#2C8582] shadow-sm transition-colors"><Settings size={14} /></button>
                            {u.id !== currentUser?.id && (
                              <button 
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-2 rounded-xl border bg-white text-gray-400 hover:text-red-600 hover:border-red-200 shadow-sm transition-colors"
                              >
                                <XCircle size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-6 border-t bg-[#FAFBFA] flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-bold">Showing {users.length} total users listed.</span>
                  <div className="flex items-center gap-1">
                    <button className="p-2 bg-[#4A5944] text-white text-xs font-bold rounded-lg w-8 h-8 flex items-center justify-center shadow">1</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="animate-in fade-in duration-500 pb-10">
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
                          <img src={`http://localhost:5000${currentUser.profile_image}`} className="w-full h-full object-cover" alt="Foto profil admin" />
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
                          placeholder="Masukkan password baru" 
                          value={profilePassword} 
                          onChange={(e) => setProfilePassword(e.target.value)} 
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#2C8582] text-sm bg-white" 
                        />
                      </div>

                      <div className="pt-4">
                        <button 
                          type="submit" 
                          disabled={isUpdatingProfile}
                          className="bg-[#2C8582] hover:bg-[#4A5944] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
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

          {isAddUserModalOpen && currentUser?.role === 'super_admin' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-300">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAddUserModalOpen(false)}></div>
              <div className="relative w-full max-w-md bg-white shadow-2xl rounded-3xl p-8 z-10 border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-black text-[#1C2319]">Tambah Pengguna</h3>
                  <button onClick={() => setIsAddUserModalOpen(false)} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100">&times;</button>
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
                      disabled={currentUser?.role !== 'super_admin'}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#2C8582] text-sm bg-white"
                    >
                      <option value="user">User (Warga)</option>
                      {currentUser?.role === 'super_admin' && (
                        <option value="admin">Admin</option>
                      )}
                    </select>
                    {currentUser?.role !== 'super_admin' && (
                      <p className="text-[10px] text-gray-400 mt-1">Hanya Super Admin yang dapat menambahkan Admin baru.</p>
                    )}
                  </div>
                  <button type="submit" className="w-full bg-[#2C8582] hover:bg-[#4A5944] text-white font-bold py-3 rounded-xl transition-all shadow-md mt-6">
                    Simpan Pengguna
                  </button>
                </form>
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
      className={`w-full flex items-center gap-3.5 px-4 py-3 text-sm font-bold rounded-2xl transition-all duration-300 group
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

