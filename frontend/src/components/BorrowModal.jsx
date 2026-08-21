import React, { useState } from 'react';
import { BookOpen, Calendar, Clock, AlertTriangle, X, Check } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import BorrowSuccessModal from './BorrowSuccessModal';

export default function BorrowModal({ book, isOpen, onClose, onBorrowed }) {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [successLoanData, setSuccessLoanData] = useState(null);

  if (!isOpen || !book) return null;

  const borrowDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);

  const handleConfirmBorrow = async () => {
    setLoading(true);
    try {
      const res = await api.post('/loans/borrow', { book_id: book.id });
      success(`Successfully borrowed "${book.title}".`);
      setSuccessLoanData(res.data);
      if (onBorrowed) onBorrowed(res.data);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to borrow book. Please try again.';
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessLoanData(null);
    onClose();
  };

  if (successLoanData) {
    return (
      <BorrowSuccessModal
        isOpen={true}
        onClose={handleSuccessClose}
        book={book}
        loanData={successLoanData}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md glass-panel border border-brand-500/30 rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center mb-4 border border-brand-500/30">
          <BookOpen className="w-6 h-6" />
        </div>

        <h3 className="font-display font-bold text-xl text-white mb-1">Confirm Book Loan</h3>
        <p className="text-xs text-slate-400 mb-5">Please verify the loan details and return terms.</p>

        {/* Book Card Mini */}
        <div className="flex items-center gap-3 p-3 bg-slate-900/90 rounded-xl border border-slate-800 mb-5">
          <img
            src={book.cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80'}
            alt={book.title}
            className="w-14 h-18 object-cover rounded-lg shrink-0"
          />
          <div className="overflow-hidden">
            <h4 className="text-sm font-bold text-white truncate">{book.title}</h4>
            <p className="text-xs text-slate-400">Author: {book.author?.name}</p>
            <p className="text-xs text-brand-300 font-semibold mt-1">ISBN: {book.isbn}</p>
          </div>
        </div>

        {/* Loan Terms */}
        <div className="space-y-2.5 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs mb-5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-sky-400" /> Borrow Date:</span>
            <span className="font-semibold text-slate-200">{borrowDate.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-400" /> Due Date (14 days):</span>
            <span className="font-bold text-amber-300">{dueDate.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Overdue Fine Rate:</span>
            <span className="font-semibold text-rose-300">₹5.00 / day</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-800 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmBorrow}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-ai-600 hover:from-brand-400 hover:to-ai-500 text-white font-bold text-sm transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center gap-1.5"
          >
            {loading ? 'Processing...' : (
              <>
                <Check className="w-4 h-4" />
                Confirm Borrow
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
