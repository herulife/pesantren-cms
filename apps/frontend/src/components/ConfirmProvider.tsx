'use client';

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import ConfirmDialog from './ConfirmDialog';

export type ConfirmOptions = {
  title: string;
  message: string;
  confirmText?: string;
  type?: 'danger' | 'warning' | 'info';
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | undefined>(undefined);

/**
 * Provider global untuk konfirmasi destruktif.
 * Dipakai lewat `useConfirm()` yang mengembalikan Promise<boolean>, sehingga
 *   if (!(await confirmDialog({ title: 'Hapus', message: '...' }))) return;
 * bisa menggantikan window.confirm() yang sinkron.
 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirmDialog = useCallback<ConfirmFn>(
    (options) =>
      new Promise<boolean>((resolve) => {
        // kalau ada pemanggil yang masih menunggu, batalkan yang lama
        resolver.current?.(false);
        resolver.current = resolve;
        setState(options);
      }),
    [],
  );

  const settle = useCallback((value: boolean) => {
    setState(null);
    const resolve = resolver.current;
    resolver.current = null;
    resolve?.(value);
  }, []);

  return (
    <ConfirmContext.Provider value={confirmDialog}>
      {children}
      <ConfirmDialog
        isOpen={state !== null}
        title={state?.title ?? ''}
        message={state?.message ?? ''}
        confirmText={state?.confirmText}
        type={state?.type ?? 'danger'}
        onClose={() => settle(false)}
        onConfirm={() => settle(true)}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used within ConfirmProvider');
  return context;
}
