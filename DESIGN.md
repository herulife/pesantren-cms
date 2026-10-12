# DESIGN.md — Alma Parung Design System

## Design Tokens

### Colors
- **Primary Sky**: `#0ea5e9` (sky-500) — brand, CTA, links
- **Primary Emerald**: `#10b981` (emerald-500) — success, donasi
- **Accent Cyan**: `#06b6d4` (cyan-500) — gradient secondary
- **Neutral Slate**: `slate-50` bg, `slate-900` text, `slate-500` muted
- **Semantic**: emerald-50/emerald-700 success, amber-50/amber-700 warning, rose-50/rose-600 error
- **Gradients**: `from-sky-500 to-cyan-400` (CTA), `from-slate-900 to-slate-800` (dark)

### Typography
- **Display**: Outfit 700-800 (headings, hero)
- **Body**: Inter 400-600 (content)
- **Scale**: 11px uppercase tracking 0.24em labels, 14-16px body, 24-32px h2, 48-60px hero
- **Weights**: 900 for hero, 700 for buttons, 500 for body

### Spacing & Radius
- **Scale**: 4px base, 8-12-16-24-32 gaps
- **Radius**: 1rem (card), 1.5rem (section), 2rem (hero), full (pills/buttons)
- **Shadows**: `shadow-[0_20px_50px_-30px_rgba(14,165,233,0.45)]` blue, `shadow-lg` CTA

### Motion
- `transition-all duration-300`, `hover:-translate-y-0.5`, `hover:brightness-105`
- Stagger: `animation-delay` 0.1s steps, `whileInView` once

## Components

### Buttons
- Primary: `rounded-full bg-sky-500 text-white shadow-lg`
- Secondary: `rounded-full border border-sky-200 bg-white text-sky-700`
- Focus: `focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2`

### Cards
- `rounded-[1.75rem] border border-slate-200 bg-white shadow-sm hover:shadow-xl`

### Forms (PSB)
- Input: `rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10`
- Error: `border-rose-300 bg-rose-50 text-rose-700` + `aria-invalid` + inline `text-xs text-rose-600`
- Label: `text-xs font-black uppercase tracking-widest text-slate-700`

## Accessibility
- All interactive: `focus-visible` ring, `aria-label`/`aria-expanded` for dropdowns, `aria-invalid` for errors
- Color contrast: AA (sky-700 on white, white on sky-500)
- Keyboard: Tab, Enter/Space for dropdowns, Esc to close

## Responsive
- Mobile: 1 col, `px-4`, `h-[4.25rem]` nav
- Tablet: `sm:grid-cols-2`, `md:grid-cols-3`
- Desktop: `lg:grid-cols-4`, `max-w-6xl mx-auto`
