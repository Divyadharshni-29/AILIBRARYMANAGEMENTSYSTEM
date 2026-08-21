import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  BookOpen,
  Calendar,
  Clock,
  ArrowRight,
  BookmarkCheck,
  CheckCircle,
  X,
  Heart,
  Lightbulb,
  Rocket,
  GraduationCap
} from 'lucide-react';
import ConfettiCelebration from './ConfettiCelebration';

export default function BorrowSuccessModal({
  isOpen,
  onClose,
  book,
  loanData
}) {
  if (!isOpen || !book) return null;

  const navigate = useNavigate();

  const dueDate = loanData?.due_date 
    ? new Date(loanData.due_date) 
    : (() => {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        return d;
      })();

  const emojis = ['📚', '📖', '✨', '🌟', '🎓', '💡', '🚀', '❤️'];

  const handleGoToBorrowed = () => {
    onClose();
    navigate('/student/borrowed');
  };

  const handleContinueReading = () => {
    onClose();
  };

  return (
    <>
      {/* Confetti Explosion Animation */}
      <ConfettiCelebration duration={3000} particleCount={90} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
        <div className="w-full max-w-lg relative rounded-3xl overflow-hidden glass-panel border border-emerald-500/40 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 shadow-2xl shadow-emerald-500/10">
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
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30 ring-4 ring-emerald-500/20 animate-pulse">
              <BookOpen className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="font-display font-black text-2xl sm:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300">
                📚✨ Book Borrowed Successfully!
              </h2>

              <p className="text-sm text-emerald-200/90 font-medium max-w-md mx-auto leading-relaxed bg-emerald-950/40 border border-emerald-500/20 py-2 px-4 rounded-2xl">
                "Great choice! Every book you read is a step toward a better future. Keep learning and growing! 🌟📖"
              </p>
            </div>
          </div>

          {/* Book Details Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-4 mb-6 shadow-inner">
            <img
              src={book.cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80'}
              alt={book.title}
              className="w-16 h-22 object-cover rounded-xl shadow-md border border-slate-700 shrink-0"
            />
            <div className="space-y-1 min-w-0 flex-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-block">
                Active Loan (14 Days)
              </span>
              <h3 className="font-display font-bold text-sm sm:text-base text-white truncate">
                {book.title}
              </h3>
              <p className="text-xs text-slate-400 truncate">
                By {book.author?.name || book.author_name || 'Academic Author'}
              </p>

              <div className="flex items-center gap-2 pt-1 text-xs text-amber-300 font-semibold">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Due Date: {dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleContinueReading}
              className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 group"
            >
              <span>Continue Reading</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={handleGoToBorrowed}
              className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <BookmarkCheck className="w-4 h-4 text-emerald-400" />
              <span>My Loans & Returns</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
