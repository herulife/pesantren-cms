'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Proses',
  type = 'danger',
  isLoading
}: ConfirmDialogProps) {
  const isDanger = type === 'danger';
  const managesAsyncClose = typeof isLoading === 'boolean';

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 sm:px-0 transition-opacity duration-300 ease-out ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
       <div 
         className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
         onClick={onClose}
       ></div>
       
       <div 
         className={`bg-white rounded-[2rem] shadow-2xl w-full max-w-md relative z-10 overflow-hidden transition-all duration-300 ease-out ${
            isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
         }`}
       >
          <div className="flex justify-between items-center p-6 border-b border-slate-100">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{title}</h3>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-8">
             <div className="flex flex-col items-center text-center">
               <div className={`w-20 h-20 ${isDanger ? 'bg-rose-100 text-rose-500' : 'bg-amber-100 text-amber-500'} rounded-full flex items-center justify-center mb-6 shadow-inner`}>
                  {isDanger ? <Trash2 size={32} /> : <AlertTriangle size={32} />}
               </div>
               
               <p className="text-slate-600 mb-8 leading-relaxed font-medium">
                 {message}
               </p>

               <div className="flex gap-4 w-full">
                 <button 
                   onClick={onClose}
                   className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all outline-none focus:ring-4 focus:ring-slate-200/50"
                 >
                   Batal
                 </button>
                <button 
                   disabled={Boolean(isLoading)}
                   onClick={() => {
                     onConfirm();
                     if (!managesAsyncClose) {
                       onClose();
                     }
                   }}
                   className={`flex-1 py-4 ${isDanger ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'} text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs transition-all shadow-xl outline-none focus:ring-4 ${isDanger ? 'focus:ring-rose-500/20' : 'focus:ring-emerald-500/20'} disabled:cursor-not-allowed disabled:opacity-60`}
                 >
                   {isLoading ? 'Memproses...' : confirmText}
                 </button>
               </div>
             </div>
          </div>
       </div>
    </div>
  );
}
