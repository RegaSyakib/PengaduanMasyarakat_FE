import React from 'react';

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  glow?: string;
}

export default function StatCard({ label, value, change, icon, glow = 'bg-white' }: StatCardProps) {
  const isPositive = change.startsWith('+');

  return (
    <div className={`rounded-3xl border border-[#EDF0ED] p-6 shadow-sm relative overflow-hidden flex flex-col gap-3 transition-all hover:shadow-md hover:-translate-y-0.5 ${glow} bg-white`}>
      <div className="flex justify-between items-start">
        <div className="w-10 h-10 bg-[#F4FAF9] border border-gray-50 rounded-xl shadow-inner flex items-center justify-center text-[#2C8582]">
          {icon}
        </div>
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isPositive ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
          {change}
        </span>
      </div>
      <div>
        <h4 className="text-3xl font-black tracking-tight text-[#1A2018] leading-none mb-1">{value}</h4>
        <p className="text-[10px] tracking-widest font-bold text-[#6B7B64] uppercase opacity-80">{label}</p>
      </div>
      <div className="absolute bottom-0 right-0 w-16 h-16 bg-[#E8F0E6] rounded-full blur-2xl opacity-40 -mr-6 -mb-6"></div>
    </div>
  );
}
