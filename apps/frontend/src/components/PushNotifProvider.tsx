'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, BellRing, CheckCircle2, X } from 'lucide-react';

const API_BASE = '/api';
const DISMISS_KEY = 'darussunnah-push-dismissed-at';
const DISMISS_DAYS = 7;
const SHOW_DELAY_MS = 6000;

// Halaman yang tidak menampilkan popup (dashboard internal & alur pendaftaran).
const HIDDEN_PREFIXES = ['/admin', '/login', '/portal', '/psb-daftar', '/builder-preview', '/builder-compare', '/note', '/audit'];

type PromptState = 'hidden' | 'shown' | 'working' | 'done' | 'error';

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const output = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i += 1) {
    output[i] = rawData.charCodeAt(i);
  }
  return buffer;
}

function isDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!ts) return false;
    return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function rememberDismiss(): void {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

async function postSubscription(subscription: PushSubscription): Promise<void> {
  await fetch(`${API_BASE}/push/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    }),
  });
}

export default function PushNotifProvider() {
  const pathname = usePathname();
  const [state, setState] = useState<PromptState>('hidden');
  const [message, setMessage] = useState('');
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  const hiddenRoute = HIDDEN_PREFIXES.some((prefix) => (pathname || '').startsWith(prefix));

  const enableNotifications = useCallback(async () => {
    setState('working');
    setMessage('');
    try {
      const registration = registrationRef.current;
      if (!registration) {
        throw new Error('Layanan notifikasi belum siap');
      }

      const keyResp = await fetch(`${API_BASE}/push/public-key`);
      if (!keyResp.ok) {
        throw new Error('Fitur notifikasi sedang tidak tersedia');
      }
      const keyJson = await keyResp.json();
      const publicKey: string | undefined = keyJson?.data?.public_key;
      if (!publicKey) {
        throw new Error('Kunci notifikasi tidak ditemukan');
      }

      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }
      if (permission !== 'granted') {
        rememberDismiss();
        setState('error');
        setMessage('Izin notifikasi ditolak. Aktifkan lewat pengaturan browser bila berubah pikiran.');
        return;
      }

      const existing = await registration.pushManager.getSubscription();
      const subscription = existing || (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      }));

      await postSubscription(subscription);

      setState('done');
      setMessage('Notifikasi aktif. Terima kasih sudah mengikuti Darussunnah Parung!');
      window.setTimeout(() => setState('hidden'), 5000);
    } catch (err) {
      setState('error');
      setMessage(err instanceof Error ? err.message : 'Gagal mengaktifkan notifikasi');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      return;
    }
    // Web Push hanya jalan di secure context (https atau localhost).
    if (!window.isSecureContext) return;

    let cancelled = false;

    (async () => {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/',
          updateViaCache: 'none',
        });
        registrationRef.current = registration;

        // Sinkronkan langganan yang sudah ada ke backend (mis. setelah rotasi kunci).
        if (Notification.permission === 'granted') {
          const existing = await registration.pushManager.getSubscription();
          if (existing && !cancelled) {
            postSubscription(existing).catch(() => {});
          }
        }

        if (
          !cancelled &&
          !hiddenRoute &&
          Notification.permission === 'default' &&
          !isDismissedRecently()
        ) {
          window.setTimeout(() => {
            if (!cancelled && Notification.permission === 'default') {
              setState('shown');
            }
          }, SHOW_DELAY_MS);
        }
      } catch {
        /* service worker tidak didukung/gagal — abaikan */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hiddenRoute]);

  if (state === 'hidden' || hiddenRoute) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[9998] md:inset-x-auto md:bottom-6 md:right-6 md:max-w-md">
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-white/95 p-5 shadow-2xl backdrop-blur">
        <button
          type="button"
          onClick={() => {
            rememberDismiss();
            setState('hidden');
          }}
          className="absolute right-3 top-3 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label="Tutup"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-4">
          <span className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {state === 'done' ? <CheckCircle2 size={22} /> : <BellRing size={22} />}
          </span>
          <div className="min-w-0 pr-4">
            <p className="text-sm font-black text-slate-900">Jangan lewatkan info PPDB</p>
            <p className="mt-1.5 text-sm leading-6 text-slate-600">
              {state === 'done' || state === 'error'
                ? message
                : 'Aktifkan notifikasi untuk menerima pengumuman, jadwal PSB, dan kabar terbaru Darussunnah Parung langsung di HP Anda.'}
            </p>
          </div>
        </div>

        {(state === 'shown' || state === 'working') && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                rememberDismiss();
                setState('hidden');
              }}
              disabled={state === 'working'}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Nanti saja
            </button>
            <button
              type="button"
              onClick={enableNotifications}
              disabled={state === 'working'}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-white transition hover:bg-primary-dark disabled:opacity-70"
            >
              <Bell size={16} />
              {state === 'working' ? 'Mengaktifkan…' : 'Aktifkan'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
