import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { History, Search, Filter, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import BackButton from '../../components/BackButton';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/loans/all', {
        params: {
          status_filter: statusFilter !== 'ALL' ? statusFilter : undefined,
          search: search.trim() || undefined,
        },
      });
      setTransactions(res.data || []);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter, search]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton label="Back" fallback="/librarian/dashboard" />
          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white">All Borrowing Transactions</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Global circulation ledger tracking student checkouts, return dates, and fine receipts.
            </p>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-2xl border border-slate-800 self-start sm:self-auto text-xs">
          {['ALL', 'BORROWED', 'RETURNED', 'OVERDUE'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                statusFilter === st
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl glass-panel border border-slate-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by student name, student email, or book title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
        />
      </div>

      {/* Transactions Table */}
      {loading ? (
        <div className="p-16 text-center text-slate-400">Loading ledger records...</div>
      ) : transactions.length > 0 ? (
        <div className="rounded-2xl glass-panel border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Tx ID</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Book Title</th>
                  <th className="py-3.5 px-4">Borrow Date</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Return Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Fine Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-500">#{tx.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div>{tx.user_name}</div>
                      <span className="text-[10px] text-slate-400 font-normal">{tx.user_email}</span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">{tx.book_title}</td>
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
                    <td className="py-3.5 px-4 font-semibold">
                      {tx.fine_amount > 0 ? (
                        <span className={tx.fine_paid ? 'text-emerald-400' : 'text-rose-400'}>
                          ₹{tx.fine_amount.toFixed(2)} ({tx.fine_paid ? 'Paid' : 'Unpaid'})
                        </span>
                      ) : (
                        '—'
                      )}
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
          <h3 className="text-lg font-bold text-white">No transactions found</h3>
        </div>
      )}
    </div>
  );
}
