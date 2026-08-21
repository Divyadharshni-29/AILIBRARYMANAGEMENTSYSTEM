import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RotateCcw,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  BookOpen,
  Compass,
  Star,
  X,
  Award
} from 'lucide-react';
import ConfettiCelebration from './ConfettiCelebration';

export default function ReturnSuccessModal({
  isOpen,
  onClose,
  book,
  fineAmount = 0,
  onRateBook
}) {
  if (!isOpen) return null;

  const navigate = useNavigate();
  const emojis = ['🎉', '📚', '🔄', '✅', '🌱', '⭐', '🙌'];

  const handleBackToDashboard = () => {
    onClose();
    navigate('/student/dashboard');
  };

  const handleExploreNext = () => {
    onClose();
    navigate('/student/books');
  };

  return (
    <>
      {/* Confetti Explosion Animation */}
      <ConfettiCelebration duration={3000} particleCount={90} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
        <div className="w-full max-w-lg relative rounded-3xl overflow-hidden glass-panel border border-indigo-500/40 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 shadow-2xl shadow-indigo-500/10">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Animated Header Badge */}
          <div className="text-center space-y-3 mb-6">
            {/* Floating emojis ribbon */}
            <div className="flex items-center justify-center gap-2 text-lg sm:text-xl animate-bounce duration-1000 select-none">
              {emojis.map((em, idx) => (
                <span key={idx} className="hover:scale-125 transition-transform cursor-default">
                  {em}
                </span>
              ))}
            </div>

            {/* Glowing Icon Hub */}
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-brand-400 text-white flex items-center justify-center shadow-xl shadow-indigo-500/30 ring-4 ring-indigo-500/20 animate-pulse">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="font-display font-black text-2xl sm:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-200 to-brand-300">
                🎉📚 Book Returned Successfully!
              </h2>

              <p className="text-sm text-indigo-200/90 font-medium max-w-md mx-auto leading-relaxed bg-indigo-950/40 border border-indigo-500/20 py-2 px-4 rounded-2xl">
                "Thank you for returning the book on time! Your next great story is waiting for you. 📖✨"
              </p>
            </div>
          </div>

          {/* Return Status Card */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-4 mb-6 shadow-inner">
            {book?.cover_image ? (
              <img
                src={book.cover_image}
                alt={book.title || 'Book'}
                className="w-14 h-20 object-cover rounded-xl shadow-md border border-slate-700 shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                <RotateCcw className="w-7 h-7" />
              </div>
            )}

            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 inline-block">
                  Returned & Cleared
                </span>
                <span className="flex items-center gap-1 text-[11px] text-amber-300 font-bold">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  +10 Reader Karma
                </span>
              </div>

              <h3 className="font-display font-bold text-sm sm:text-base text-white truncate">
                {book?.title || 'Library Title'}
              </h3>

              <p className="text-xs text-slate-400">
                {fineAmount > 0 ? `Overdue fine settled: ₹${fineAmount.toFixed(2)}` : 'Returned on schedule. No fines accrued!'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleBackToDashboard}
              className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-sm transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 group"
            >
              <span>Back to Dashboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={handleExploreNext}
              className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Compass className="w-4 h-4 text-brand-400" />
              <span>Explore Next Book</span>
            </button>
          </div>

          {/* Optional Rate Button */}
          {onRateBook && book && (
            <button
              onClick={() => {
                onClose();
                onRateBook(book);
              }}
              className="mt-3 w-full py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <Star className="w-3.5 h-3.5" />
              <span>Leave a Quick Rating for this Book</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
