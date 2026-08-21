import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  BookmarkCheck,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  RotateCcw,
  BookOpen,
  ArrowRight,
  CreditCard
} from 'lucide-react';
import RatingModal from '../../components/RatingModal';
import BackButton from '../../components/BackButton';
import ReturnSuccessModal from '../../components/ReturnSuccessModal';
import ActionMotivationBanner from '../../components/ActionMotivationBanner';

export default function BorrowedBooks() {
  const { success, error } = useToast();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookForRate, setSelectedBookForRate] = useState(null);
  const [returnSuccessData, setReturnSuccessData] = useState(null);

  const fetchActiveLoans = async () => {
    setLoading(true);
    try {
      const res = await api.get('/loans/my-active');
      setLoans(res.data || []);
    } catch (err) {
      error('Failed to load active loans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveLoans();
  }, []);

  const handleReturn = async (transaction) => {
    try {
      const res = await api.post('/loans/return', { transaction_id: transaction.id });
      setReturnSuccessData({
        book: {
          id: transaction.book_id,
          title: transaction.book_title,
          cover_image: transaction.book_cover,
        },
        fineAmount: res.data.fine_amount || 0,
      });
      fetchActiveLoans();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to return book.';
      error(msg);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton label="Back" fallback="/student/dashboard" />
          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white">Currently Borrowed Books</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Track your loan return deadlines, remaining days, and overdue status.
            </p>
          </div>
        </div>

        <Link
          to="/student/books"
          className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-white rounded-xl text-xs font-bold transition-all shadow-md self-start sm:self-auto flex items-center gap-1.5"
        >
          <BookOpen className="w-4 h-4" />
          <span>Borrow More Books</span>
        </Link>
      </div>

      {/* Contextual Motivating Banner */}
      <ActionMotivationBanner action="return" />

      {loading ? (
        <div className="p-16 text-center text-slate-400">Loading active loans...</div>
      ) : loans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {loans.map((loan) => {
            const isOverdue = loan.is_overdue;
            const remainingDays = loan.remaining_days;

            return (
              <div
                key={loan.id}
                className={`p-5 rounded-2xl glass-panel border flex flex-col justify-between transition-all ${
                  isOverdue ? 'border-rose-500/40 bg-rose-950/20' : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex gap-4">
                  <img
                    src={loan.book_cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80'}
                    alt={loan.book_title}
                    className="w-20 h-28 object-cover rounded-xl shrink-0 shadow-lg"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 border ${
                          isOverdue
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : remainingDays === 0
                            ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                            : remainingDays === 1
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : remainingDays <= 3
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {isOverdue ? (
                          <>
                            <AlertCircle className="w-3 h-3" /> 🚨 Overdue
                          </>
                        ) : remainingDays === 0 ? (
                          <>
                            <Clock className="w-3 h-3 text-orange-400" /> 🔔 Due Today
                          </>
                        ) : remainingDays === 1 ? (
                          <>
                            <Clock className="w-3 h-3 text-amber-400" /> ⚠️ Due Tomorrow
                          </>
                        ) : remainingDays <= 3 ? (
                          <>
                            <Clock className="w-3 h-3 text-sky-400" /> 📚 Due in {remainingDays} Days
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-400" /> On Loan ({remainingDays}d left)
                          </>
                        )}
                      </span>

                      <span className="text-xs font-semibold text-slate-400">
                        Loan #{loan.id}
                      </span>
                    </div>

                    <Link to={`/student/books/${loan.book_id}`} className="hover:text-brand-300 transition-colors">
                      <h3 className="font-display font-bold text-base text-white truncate">{loan.book_title}</h3>
                    </Link>

                    {/* Due details */}
                    <div className="space-y-1.5 mt-3 text-xs">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-sky-400" /> Borrowed:</span>
                        <span className="text-slate-200">{new Date(loan.borrow_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-amber-400" /> Due Date:</span>
                        <span className={`font-bold ${isOverdue ? 'text-rose-400' : remainingDays <= 1 ? 'text-orange-400' : 'text-amber-300'}`}>
                          {new Date(loan.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Countdown & Action */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
                  <div className="text-xs">
                    {isOverdue ? (
                      <span className="text-rose-400 font-bold flex items-center gap-1 bg-rose-950/40 px-2 py-1 rounded border border-rose-800/60">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {Math.abs(remainingDays)} {Math.abs(remainingDays) === 1 ? 'day' : 'days'} overdue • Fine: ₹{(Math.abs(remainingDays) * 5).toFixed(2)}
                      </span>
                    ) : remainingDays === 0 ? (
                      <span className="text-orange-400 font-bold flex items-center gap-1 bg-orange-950/40 px-2 py-1 rounded border border-orange-800/60">
                        <Clock className="w-3.5 h-3.5" />
                        Due today! Return to avoid fine.
                      </span>
                    ) : remainingDays === 1 ? (
                      <span className="text-amber-400 font-bold flex items-center gap-1 bg-amber-950/40 px-2 py-1 rounded border border-amber-800/60">
                        <Clock className="w-3.5 h-3.5" />
                        Due tomorrow!
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {remainingDays} days remaining
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isOverdue && !loan.fine_paid && (
                      <Link
                        to={`/student/fines/pay/${loan.id}`}
                        className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay Fine (₹{(Math.abs(remainingDays) * 5).toFixed(2)})</span>
                      </Link>
                    )}
                    <button
                      onClick={() => handleReturn(loan)}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Return Book</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-16 rounded-3xl glass-panel text-center">
          <BookmarkCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No currently borrowed books</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            You don't have any active book loans. Browse our AI-recommended catalog to borrow a book!
          </p>
          <Link
            to="/student/books"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5"
          >
            <span>Explore Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Celebration Return Success Modal */}
      <ReturnSuccessModal
        isOpen={!!returnSuccessData}
        onClose={() => setReturnSuccessData(null)}
        book={returnSuccessData?.book}
        fineAmount={returnSuccessData?.fineAmount || 0}
        onRateBook={(book) => setSelectedBookForRate(book)}
      />

      {/* Rating modal shown after return */}
      <RatingModal
        book={selectedBookForRate}
        isOpen={!!selectedBookForRate}
        onClose={() => setSelectedBookForRate(null)}
        onRatingSubmitted={() => {}}
      />
    </div>
  );
}
