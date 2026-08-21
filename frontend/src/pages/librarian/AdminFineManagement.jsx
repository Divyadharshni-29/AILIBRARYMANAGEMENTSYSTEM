import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertOctagon,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Receipt,
  FileText,
  User,
  BookOpen,
  Calendar,
  RefreshCw,
  Download
} from 'lucide-react';
import BackButton from '../../components/BackButton';
import DigitalReceiptModal from '../../components/DigitalReceiptModal';

export default function AdminFineManagement() {
  const { error, success } = useToast();
  const [stats, setStats] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const fetchStatsAndPayments = async () => {
    setLoading(true);
    try {
      const [statsRes, paymentsRes] = await Promise.all([
        api.get('/payments/admin/stats'),
        api.get(`/payments/admin/all?status_filter=${statusFilter}&search=${search}`),
      ]);
      setStats(statsRes.data);
      setPayments(paymentsRes.data || []);
    } catch (err) {
      error('Failed to load fine analytics & transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAndPayments();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStatsAndPayments();
  };

  const handleOpenReceipt = async (payment) => {
    try {
      const res = await api.get(`/payments/receipt/${payment.receipt_number}`);
      setSelectedReceipt(res.data);
    } catch (err) {
      setSelectedReceipt({
        receipt_number: payment.receipt_number,
        reference_id: payment.reference_id,
        library_name: "AI Central University Library",
        student_name: payment.user_name || "Student Member",
        student_email: payment.user_email || "",
        book_title: payment.book_title || "Library Book",
        book_isbn: "N/A",
        due_date: payment.created_at,
        overdue_days: 0,
        fine_amount: payment.amount,
        payment_method: payment.payment_method,
        status: payment.status,
        paid_at: payment.paid_at || payment.created_at,
        verified: payment.status === 'SUCCESSFUL',
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton label="Back" fallback="/librarian/dashboard" />
          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white flex items-center gap-2">
              <span>Fine & Revenue Management</span>
              <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <CreditCard className="w-5 h-5" />
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Track student fine collections, overdue penalties, UPI gateway reconciliations, and digital receipts.
            </p>
          </div>
        </div>

        <button
          onClick={fetchStatsAndPayments}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-brand-400" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Paid Fines (Revenue)</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            ₹{Number(stats?.total_fines_collected || 0).toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {stats?.successful_payments_count || 0} successfully settled transactions
          </p>
        </div>

        <div className="glass-panel border border-rose-500/30 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Unpaid Fines</span>
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-300">
            ₹{Number(stats?.total_fines_unpaid || 0).toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {stats?.overdue_active_loans_count || 0} active overdue loans pending return
          </p>
        </div>

        <div className="glass-panel border border-brand-500/30 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">Total Accrued</span>
            <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            ₹{Number(stats?.total_fines_accrued || 0).toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Cumulative penalties tracked by system
          </p>
        </div>

        <div className="glass-panel border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Pending Gateway Intents</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-300">
            {stats?.pending_payments_count || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Awaiting student UPI/card confirmation
          </p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="glass-panel border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search by student name, email, book, receipt no, or txn ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-20 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 px-3 py-1 bg-brand-500 hover:bg-brand-400 text-white font-bold text-xs rounded-lg transition-all"
            >
              Search
            </button>
          </form>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl self-start md:self-auto overflow-x-auto w-full md:w-auto">
            {['ALL', 'SUCCESSFUL', 'PENDING', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  statusFilter === st
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st === 'ALL' ? 'All Transactions' : st === 'SUCCESSFUL' ? 'Paid / Settled' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <div className="p-16 text-center text-slate-400">Loading fine ledger...</div>
      ) : payments.length === 0 ? (
        <div className="p-12 rounded-3xl glass-panel text-center max-w-md mx-auto space-y-3">
          <Receipt className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Fine Transactions Found</h3>
          <p className="text-xs text-slate-400">
            No transactions match the selected criteria.
          </p>
        </div>
      ) : (
        <div className="glass-panel border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Student Member</th>
                  <th className="py-3.5 px-4">Book Title</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4">Transaction Ref</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {payments.map((p) => {
                  const isSuccess = p.status === 'SUCCESSFUL';
                  const dateStr = p.paid_at
                    ? new Date(p.paid_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : new Date(p.created_at).toLocaleDateString();

                  return (
                    <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{p.user_name}</div>
                        <div className="text-[11px] text-slate-400">{p.user_email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-200 max-w-[200px] truncate">
                        {p.book_title}
                      </td>
                      <td className="py-3.5 px-4 font-black text-emerald-400 text-right">
                        ₹{Number(p.amount).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-purple-300 uppercase">
                        {p.payment_method}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                        {p.reference_id}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {dateStr}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                            isSuccess
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : p.status === 'PENDING'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {isSuccess ? 'Paid' : p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenReceipt(p)}
                          className="px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white rounded-lg font-bold text-[11px] transition-colors inline-flex items-center gap-1.5 shadow-xs"
                        >
                          <Receipt className="w-3.5 h-3.5 text-brand-400" />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Digital Receipt Modal */}
      <DigitalReceiptModal
        receipt={selectedReceipt}
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
}
