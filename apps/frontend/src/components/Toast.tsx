'use client';

import React, { useRef, useState, createContext, useContext } from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const fallbackIdRef = useRef(0);

  const showToast = (type: ToastType, message: string) => {
    fallbackIdRef.current += 1;
    const id =
      typeof crypto !== 'undefined'
        ? crypto.randomUUID()
        : `toast-${fallbackIdRef.current}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed inset-x-4 bottom-24 z-[1200] flex flex-col gap-3 md:inset-x-auto md:bottom-8 md:right-8">
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            className={`flex w-full items-center gap-4 rounded-2xl border-l-4 px-5 py-4 shadow-xl shadow-emerald-950/20 animate-in slide-in-from-right duration-300 md:min-w-[300px] md:px-6 ${
              toast.type === 'success' ? 'bg-white border-emerald-500 text-emerald-900' : 
              toast.type === 'error' ? 'bg-white border-rose-500 text-rose-900' : 
              'bg-white border-blue-500 text-blue-900'
            }`}
          >
            <div className="flex-shrink-0">
              {toast.type === 'success' && <CheckCircle2 className="text-emerald-500" size={24} />}
              {toast.type === 'error' && <AlertCircle className="text-rose-500" size={24} />}
              {toast.type === 'info' && <Info className="text-blue-500" size={24} />}
            </div>
            <p className="font-bold text-sm">{toast.message}</p>
            <button onClick={() => removeToast(toast.id)} className="ml-auto text-slate-300 hover:text-slate-500">
               <X size={18} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
