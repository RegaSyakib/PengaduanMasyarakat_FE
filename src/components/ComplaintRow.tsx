import React from 'react';
import { Eye, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

interface ComplaintRowProps {
  complaint: any;
  onViewDetails: (c: any) => void;
  onDelete: (id: number) => void;
  getStatusDesign: (status: string) => { bg: string; text: string; dot: string; label: string };
  isSelected?: boolean;
  onToggleSelect?: (id: number) => void;
}

export default function ComplaintRow({ 
  complaint, 
  onViewDetails, 
  onDelete, 
  getStatusDesign,
  isSelected = false,
  onToggleSelect 
}: ComplaintRowProps) {
  const st = getStatusDesign(complaint.status);

  return (
    <tr className={`hover:bg-[#F9FBF8] transition-colors group ${isSelected ? 'bg-[#F2F8F7]' : ''}`}>
      <td className="p-4 pl-6">
        <input 
          type="checkbox" 
          checked={isSelected}
          onChange={() => onToggleSelect && onToggleSelect(complaint.id)}
          className="w-4 h-4 rounded accent-[#2C8582] border-gray-300 cursor-pointer" 
        />
      </td>
      <td className="p-4 font-bold text-xs text-[#4A5944]">#LP-{complaint.id.toString().padStart(4, '0')}</td>
      <td className="p-4 max-w-xs">
        <p className="font-bold text-[#1C2319] line-clamp-1 text-[14px] mb-0.5">{complaint.title}</p>
        <p className="text-xs text-gray-500 line-clamp-1">{complaint.description}</p>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#E1E8DF] flex items-center justify-center text-[10px] font-bold text-[#2C8582] overflow-hidden flex-shrink-0">
            {complaint.user_profile_image ? (
              <img src={`${API_BASE_URL}${complaint.user_profile_image}`} className="w-full h-full object-cover" alt={complaint.user_name} />
            ) : (
              complaint.user_name?.[0]?.toUpperCase() || 'U'
            )}
          </div>
          <span className="font-bold text-sm text-[#2D3629]">{complaint.user_name}</span>
        </div>
      </td>
      <td className="p-4">
        <span className="text-sm font-medium text-[#4B5563]">{complaint.category || 'Lainnya'}</span>
      </td>
      <td className="p-4">
        <span className="text-xs font-semibold text-[#6B7280]">
          {new Date(complaint.created_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </td>
      <td className="p-4">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border shadow-sm ${st.bg} ${st.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}></span>
          {st.label}
        </div>
      </td>
      <td className="p-4 text-center">
        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onViewDetails(complaint)}
            className="p-1.5 bg-white border border-gray-200 rounded-lg text-[#2C8582] hover:bg-[#EBF0E8] shadow-sm transition-colors cursor-pointer"
            title="Lihat Detail"
          >
            <Eye size={15} />
          </button>
          <button 
            onClick={() => onDelete(complaint.id)}
            className="p-1.5 bg-white border border-gray-200 rounded-lg text-red-500 hover:bg-red-50 shadow-sm transition-colors cursor-pointer"
            title="Hapus"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}
