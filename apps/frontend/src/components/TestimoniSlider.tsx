'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';

interface Testimonial {
  name: string;
  city: string;
  message: string;
  rating: number;
  avatar?: string;
}

interface Props {
  testimonials: Testimonial[];
}

export default function TestimoniSlider({ testimonials }: Props) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  if (!testimonials.length) return null;

  const t = testimonials[current];

  return (
    <div className="relative mx-auto max-w-2xl">
      <Quote size={48} className="absolute -top-4 -left-2 text-primary/10" />
      <div className="rounded-2xl bg-white p-8 shadow-lg border border-surface-200">
        <div className="flex gap-1 mb-4">
          {Array.from({ length: t.rating }).map((_, i) => (
            <Star key={i} size={18} className="fill-accent text-accent" />
          ))}
        </div>
        <p className="text-lg leading-relaxed text-foreground italic">&ldquo;{t.message}&rdquo;</p>
        <div className="mt-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
            {t.name.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-foreground">{t.name}</p>
            <p className="text-sm text-foreground/60">{t.city}</p>
          </div>
        </div>
      </div>
      <div className="flex justify-center gap-3 mt-6">
        <button onClick={prev} className="w-10 h-10 rounded-full border border-surface-200 flex items-center justify-center text-foreground/60 hover:text-primary hover:border-primary transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${i === current ? 'bg-primary w-6' : 'bg-surface-200'}`}
            />
          ))}
        </div>
        <button onClick={next} className="w-10 h-10 rounded-full border border-surface-200 flex items-center justify-center text-foreground/60 hover:text-primary hover:border-primary transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
