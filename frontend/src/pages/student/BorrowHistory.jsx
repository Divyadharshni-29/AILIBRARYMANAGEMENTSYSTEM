import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { History, Calendar, CheckCircle2, AlertCircle, Clock, Star } from 'lucide-react';
import RatingModal from '../../components/RatingModal';
import BackButton from '../../components/BackButton';

export default function BorrowHistory() {
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedRateBook, setSelectedRateBook] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/loans/my-history?status_filter=${filter}`);
      setHistory(res.data || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [filter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton label="Back" fallback="/student/dashboard" />
          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white">Borrowing History</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Complete record of your past loans, returns, and ratings.
            </p>
          </div>
        </div>

        {/* Filter Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-2xl border border-slate-800 self-start sm:self-auto text-xs">
          {['all', 'BORROWED', 'RETURNED', 'OVERDUE'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                filter === status
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {status === 'all' ? 'All Loans' : status === 'BORROWED' ? 'Active' : status === 'RETURNED' ? 'Returned' : 'Overdue'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-400">Loading history records...</div>
      ) : history.length > 0 ? (
        <div className="rounded-2xl glass-panel border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Book Title</th>
                  <th className="py-3.5 px-4">Borrow Date</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Return Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Fine</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {history.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-3">
                      <img
                        src={tx.book_cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80'}
                        alt={tx.book_title}
                        className="w-8 h-11 object-cover rounded shadow-sm"
                      />
                      <span className="max-w-xs truncate">{tx.book_title}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{new Date(tx.borrow_date).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-slate-400">{new Date(tx.due_date).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {tx.return_date ? new Date(tx.return_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.status === 'RETURNED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : tx.status === 'OVERDUE' || tx.is_overdue
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-200">
                      {tx.fine_amount > 0 ? (
                        <span className={tx.fine_paid ? 'text-emerald-400' : 'text-rose-400'}>
                          ₹{tx.fine_amount.toFixed(2)} ({tx.fine_paid ? 'Paid' : 'Unpaid'})
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() =>
                          setSelectedRateBook({
                            id: tx.book_id,
                            title: tx.book_title,
                            cover_image: tx.book_cover,
                          })
                        }
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                      >
                        <Star className="w-3.5 h-3.5" />
                        <span>Rate</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-16 rounded-3xl glass-panel text-center">
          <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No history records found</h3>
          <p className="text-xs text-slate-400 mt-1">There are no transaction records matching this filter.</p>
        </div>
      )}

      <RatingModal
        book={selectedRateBook}
        isOpen={!!selectedRateBook}
        onClose={() => setSelectedRateBook(null)}
        onRatingSubmitted={() => fetchHistory()}
      />
    </div>
  );
}
