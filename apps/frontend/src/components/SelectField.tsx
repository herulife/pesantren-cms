'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  id: string;
  label: string;
  required?: boolean;
  className: string;
  value: string;
  placeholder?: string;
  options: SelectOption[];
  error?: string;
  onChange: (value: string) => void;
}

// Dropdown kustom (bukan <select> native): di Android/Chrome popup native
// beberapa kali langsung nutup sendiri saat diklik sehingga field tak bisa diisi.
// Dipakai di form Santri (Jilid 44) dan filter Data Santri (Jilid 73).
export default function SelectField({
  id,
  label,
  required,
  className,
  value,
  placeholder,
  options,
  error,
  onChange,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  const onButtonKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setCursor(Math.max(0, options.findIndex((o) => o.value === value)));
        return;
      }
      setCursor((c) => {
        const next = e.key === 'ArrowDown' ? c + 1 : c - 1;
        return Math.min(options.length - 1, Math.max(0, next));
      });
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (open && options[cursor]) pick(options[cursor].value);
      else {
        setOpen(true);
        setCursor(Math.max(0, options.findIndex((o) => o.value === value)));
      }
      return;
    }
    if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div>
      <label htmlFor={id} className="text-xs font-bold uppercase tracking-wider text-slate-600">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      <div className="relative" ref={ref}>
        <button
          type="button"
          id={id}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          onClick={() => {
            setOpen((v) => !v);
            setCursor(Math.max(0, options.findIndex((o) => o.value === value)));
          }}
          onKeyDown={onButtonKeyDown}
          className={`${className} flex items-center justify-between gap-2 text-left`}
        >
          <span className={`truncate ${selected ? '' : 'text-slate-400'}`}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown size={16} className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open ? (
          <ul
            id={`${id}-list`}
            role="listbox"
            className="absolute z-40 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
          >
            {options.map((o, i) => (
              <li
                key={o.value === '' ? '__empty__' : o.value}
                role="option"
                aria-selected={o.value === value}
                onMouseEnter={() => setCursor(i)}
                onClick={() => pick(o.value)}
                className={`cursor-pointer px-3.5 py-2 text-sm font-medium ${
                  o.value === value
                    ? 'bg-sky-50 text-sky-700'
                    : i === cursor
                      ? 'bg-slate-50 text-slate-900'
                      : 'text-slate-700'
                }`}
              >
                {o.label}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {error ? <p className="mt-1 text-xs font-semibold text-red-500">{error}</p> : null}
    </div>
  );
}