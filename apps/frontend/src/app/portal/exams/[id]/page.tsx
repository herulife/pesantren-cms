'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  getExamQuestions, 
  startExamSession, 
  submitExamAnswer, 
  finishExamSession, 
  type Question 
} from '@/lib/api';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  AlertTriangle, 
  CheckCircle2,
  RefreshCw,
  LayoutGrid,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';

export default function ExamInterfacePage() {
  const params = useParams();
  const router = useRouter();
  const examID = parseInt(params.id as string);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [sessionID, setSessionID] = useState<number | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIdx];

  useEffect(() => {
    let isMounted = true;

    const loadExamData = async () => {
      setIsLoading(true);
      const qs = await getExamQuestions(examID);
      const sid = await startExamSession(examID);

      if (!isMounted) {
        return;
      }

      if (!sid) {
        alert("Gagal memulai sesi ujian. Silakan kembali.");
        router.push('/portal/exams');
        return;
      }

      setQuestions(qs);
      setSessionID(sid);
      setTimeLeft(60 * 60); // 60 minutes mock, should come from exam data
      setIsLoading(false);
    };

    void loadExamData();

    return () => {
      isMounted = false;
    };
  }, [examID, router]);

  const handleFinish = useCallback(async (skipConfirm: boolean = false) => {
    if (!sessionID || isSubmitting || isFinished) return;
    
    if (!skipConfirm) {
      const confirmFinish = window.confirm("Apakah Anda yakin ingin menyelesaikan ujian ini? Jawaban tidak dapat diubah lagi.");
      if (!confirmFinish && (timeLeft ?? 0) > 0) return;
    }

    setIsSubmitting(true);
    const res = await finishExamSession(sessionID);
    if (res.success) {
      setScore(res.score);
      setIsFinished(true);
    } else {
      alert("Gagal mengirim jawaban akhir. Silakan coba lagi.");
    }
    setIsSubmitting(false);
  }, [isFinished, isSubmitting, sessionID, timeLeft]);

  // Timer
  useEffect(() => {
    if (timeLeft === null || isFinished || timeLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isFinished]);

  useEffect(() => {
    if (timeLeft !== 0 || isFinished) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void handleFinish(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [handleFinish, isFinished, timeLeft]);

  // Prevent leaving & Context Menu
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isFinished) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isFinished]);

  const handleSelectOption = async (qID: number, optIdx: number) => {
    if (isFinished || isSubmitting) return;

    setAnswers(prev => ({ ...prev, [qID]: optIdx }));
    if (sessionID) {
      await submitExamAnswer(sessionID, qID, optIdx);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white shadow-xl ring-1 ring-slate-100">
          <RefreshCw className="h-10 w-10 animate-spin text-blue-600" />
        </div>
        <p className="font-outfit text-sm font-black uppercase tracking-widest text-slate-500">Mempersiapkan Lembar Soal...</p>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md overflow-hidden rounded-[3rem] bg-white text-center shadow-2xl ring-1 ring-slate-100">
          <div className="relative bg-gradient-to-b from-emerald-500 to-emerald-600 p-12 text-white">
            <div className="absolute inset-0 bg-[url('/assets/noise.png')] opacity-10 mix-blend-overlay" />
            <CheckCircle2 size={72} className="relative z-10 mx-auto mb-6 text-emerald-100" />
            <h2 className="relative z-10 font-outfit text-3xl font-black uppercase tracking-tight">Ujian Selesai!</h2>
          </div>
          <div className="p-12">
            <p className="text-slate-500 mb-8 font-medium">Terima kasih telah mengikuti ujian dengan jujur. Semua jawaban Anda telah tersimpan dengan aman.</p>
            <div className="mb-10 rounded-3xl bg-slate-50 p-8 ring-1 ring-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Skor Otomatis</p>
              <p className="font-outfit text-6xl font-black text-slate-900 drop-shadow-sm">{score.toFixed(0)}</p>
            </div>
            <button 
              onClick={() => router.push('/portal/exams')}
              className="w-full rounded-2xl bg-slate-900 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-slate-900/20 hover:bg-emerald-600 transition-all active:scale-95"
            >
              Kembali ke Menu Ujian
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isTimeCritical = timeLeft !== null && timeLeft < 300; // Under 5 minutes

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans select-none">
      {/* Sticky Top Header */}
      <div className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md">
              <GraduationCap size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Sesi CBT Berjalan</p>
              <h3 className="font-outfit text-lg font-black text-slate-900">Ujian {examID}</h3>
            </div>
          </div>

          <div className={`flex items-center gap-3 rounded-[1rem] px-6 py-3 shadow-sm ring-1 transition-colors ${
            isTimeCritical 
              ? 'bg-rose-50 border-rose-200 text-rose-600 ring-rose-200 animate-pulse' 
              : 'bg-white border-slate-200 text-slate-900 ring-slate-200'
          }`}>
            <Clock size={20} className={isTimeCritical ? 'text-rose-500' : 'text-slate-400'} />
            <span className="font-outfit text-2xl font-black">{formatTime(timeLeft || 0)}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pt-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          
          {/* Main Question Execution Area */}
          <div className="lg:col-span-8 flex flex-col">
            <div className="flex-1 rounded-[2.5rem] border border-slate-200 bg-white p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              {/* Question Header */}
              <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-black text-blue-700">
                    {currentIdx + 1}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Dari {totalQuestions} Soal
                  </span>
                </div>
                <div className="rounded-full bg-slate-50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 ring-1 ring-slate-200">
                  Pilihan Ganda
                </div>
              </div>

              {/* Question Text (Anti Copy) */}
              <div className="mb-12 min-h-[120px] font-medium leading-loose text-slate-800 md:text-lg select-none" onCopy={(e) => e.preventDefault()}>
                {currentQuestion?.question_text}
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 gap-4">
                {currentQuestion?.options.map((opt, idx) => {
                  const label = String.fromCharCode(65 + idx);
                  const isSelected = answers[currentQuestion.id] === idx;
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(currentQuestion.id, idx)}
                      className={`group relative flex items-center gap-5 rounded-2xl border-2 p-4 text-left transition-all ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50/50 shadow-md ring-4 ring-blue-600/10' 
                          : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50 focus:outline-none'
                      }`}
                    >
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-outfit text-lg font-black transition-colors ${
                        isSelected 
                          ? 'bg-blue-600 text-white shadow-inner' 
                          : 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600'
                      }`}>
                        {label}
                      </div>
                      <span className={`text-sm font-semibold leading-relaxed transition-colors ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>
                        {opt}
                      </span>
                      
                      {isSelected && (
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-blue-600">
                          <CheckCircle2 size={24} className="fill-blue-100" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Navigation */}
            <div className="mt-6 flex items-center justify-between rounded-[2rem] bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <button
                onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className="flex items-center gap-2 rounded-xl px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronLeft size={20} /> Sebelumnya
              </button>
              
              {currentIdx < totalQuestions - 1 ? (
                <button
                  onClick={() => setCurrentIdx(prev => prev + 1)}
                  className="flex items-center gap-3 rounded-[1.25rem] bg-slate-900 px-8 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-blue-600 hover:shadow-blue-600/30 active:scale-95"
                >
                  Selanjutnya <ChevronRight size={20} />
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  disabled={isSubmitting}
                  className="flex items-center gap-3 rounded-[1.25rem] bg-emerald-600 px-8 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? <RefreshCw className="animate-spin" size={20} /> : <Send size={20} />}
                  Selesai Ujian
                </button>
              )}
            </div>
          </div>

          {/* Right Sidebar - Exam Status */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm">
              <h4 className="mb-6 flex items-center gap-3 font-outfit text-sm font-black uppercase tracking-widest text-slate-900">
                <LayoutGrid size={18} className="text-blue-600" /> Navigasi & Status
              </h4>

              {/* Number Grid */}
              <div className="grid grid-cols-5 gap-3 mb-8">
                {questions.map((q, idx) => {
                  const isAnswered = answers[q.id] !== undefined;
                  const isCurrent = currentIdx === idx;
                  
                  let btnColor = "bg-slate-50 text-slate-500 ring-1 ring-slate-200 hover:bg-slate-100";
                  if (isCurrent) {
                    btnColor = "bg-white text-blue-600 ring-4 ring-blue-600 font-black shadow-md z-10 scale-105";
                  } else if (isAnswered) {
                    btnColor = "bg-emerald-500 text-white ring-1 ring-emerald-600 shadow-sm";
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIdx(idx)}
                      className={`flex aspect-square w-full items-center justify-center rounded-2xl text-[13px] font-bold transition-all ${btnColor}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 mb-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 rounded-md bg-emerald-500 shadow-sm" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Sudah Terjawab</span>
                    </div>
                    <span className="font-outfit font-black text-slate-900">{Object.keys(answers).length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 rounded-md bg-slate-100 ring-1 ring-slate-200" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Belum Terjawab</span>
                    </div>
                    <span className="font-outfit font-black text-slate-900">{totalQuestions - Object.keys(answers).length}</span>
                  </div>
                </div>
              </div>

              {isTimeCritical && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 mt-auto">
                  <div className="mb-2 flex items-center gap-2 text-rose-600">
                    <AlertTriangle size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Waktu Kritis</span>
                  </div>
                  <p className="text-xs font-medium text-rose-800/80 leading-relaxed">
                    Waktu Anda kurang dari 5 menit. Segera periksa kembali jawaban dan tekan tombol &apos;Selesai Ujian&apos;.
                  </p>
                </div>
              )}
            </div>
            
            {/* Integrity Warning */}
            <div className="flex items-start gap-4 rounded-[2rem] bg-slate-900 p-8 text-white shadow-xl">
              <ShieldCheck size={32} className="shrink-0 text-amber-400" />
              <div>
                <h5 className="font-outfit text-sm font-black uppercase tracking-widest text-white mb-1">Pengawasan Aktif</h5>
                <p className="text-xs text-white/60 leading-relaxed font-medium">Sistem merekam aktivitas Anda. Dilarang berpindah aplikasi atau melakukan tindakan curang.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
