import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Users,
  BookOpen,
  Calendar,
  Clock,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  History,
  Mail,
  Building
} from 'lucide-react';

import BackButton from '../../components/BackButton';

export default function BookBorrowers() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBorrowers = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/books/${id}/borrowers`);
        setData(res.data);
      } catch (err) {
        console.error('Failed to load borrower data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBorrowers();
  }, [id]);

  if (loading) {
    return <div className="p-16 text-center text-slate-400">Loading circulation tracking records...</div>;
  }

  if (!data) {
    return <div className="p-16 text-center text-slate-400">Book circulation history not found.</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <BackButton label="Back to Book Management" fallback="/librarian/books" />
      </div>

      {/* Book Summary Banner */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-800/80 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30">
            Circulation Tracking
          </span>
          <h1 className="font-display font-black text-2xl text-white mt-2">
            {data.book_title}
          </h1>
          <p className="text-xs text-slate-400 mt-1">Live checkouts and return audit trail from MySQL transaction records.</p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px]">Total Copies</span>
            <span className="font-bold text-white text-base">{data.total_copies}</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-center">
            <span className="text-emerald-300 block text-[10px]">Available</span>
            <span className="font-bold text-emerald-400 text-base">{data.available_copies}</span>
          </div>
          <div className="p-3 rounded-xl bg-sky-950/30 border border-sky-500/30 text-center">
            <span className="text-sky-300 block text-[10px]">On Loan</span>
            <span className="font-bold text-sky-400 text-base">{data.borrowed_copies}</span>
          </div>
        </div>
      </div>

      {/* 1. Who Currently Borrowed the Book? */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-sky-400" />
          <h2 className="font-display font-bold text-xl text-white">Who Currently Borrowed This Book?</h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
            {data.current_borrowers.length} Active Loans
          </span>
        </div>

        {data.current_borrowers.length > 0 ? (
          <div className="rounded-2xl glass-panel border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Borrow Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Loan Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {data.current_borrowers.map((b, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div>{b.user_name}</div>
                      <span className="text-[10px] text-slate-400 font-normal">{b.user_email}</span>
                    </td>
                    <td className="py-3.5 px-4">{b.department || 'Computer Science'}</td>
                    <td className="py-3.5 px-4 text-slate-400">{new Date(b.borrow_date).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 font-bold text-amber-300">{new Date(b.due_date).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 rounded-2xl glass-panel text-center text-xs text-slate-400">
            No students currently have this book checked out. All available copies are in library stacks.
          </div>
        )}
      </div>

      {/* 2. Who Returned the Book? */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-emerald-400" />
          <h2 className="font-display font-bold text-xl text-white">Who Returned This Book? (Historical Log)</h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {data.return_history.length} Returns
          </span>
        </div>

        {data.return_history.length > 0 ? (
          <div className="rounded-2xl glass-panel border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Borrow Date</th>
                  <th className="py-3 px-4">Return Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Fine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {data.return_history.map((b, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div>{b.user_name}</div>
                      <span className="text-[10px] text-slate-400 font-normal">{b.user_email}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{new Date(b.borrow_date).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-slate-400">{b.return_date ? new Date(b.return_date).toLocaleDateString() : '—'}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        RETURNED
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {b.fine_amount > 0 ? `₹${b.fine_amount.toFixed(2)}` : 'None (₹0.00)'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 rounded-2xl glass-panel text-center text-xs text-slate-400">
            No past completed return records logged for this book.
          </div>
        )}
      </div>
    </div>
  );
}
