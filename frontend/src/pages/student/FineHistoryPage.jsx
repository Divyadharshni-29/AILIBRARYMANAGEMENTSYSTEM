import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Receipt,
  Search,
  CheckCircle2,
  Clock,
  CreditCard,
  Calendar,
  BookOpen,
  ArrowRight,
  Printer,
  ShieldCheck,
  FileText
} from 'lucide-react';
import BackButton from '../../components/BackButton';
import DigitalReceiptModal from '../../components/DigitalReceiptModal';

export default function FineHistoryPage() {
  const { error } = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments/my-history');
      setPayments(res.data || []);
    } catch (err) {
      error('Failed to load payment history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleOpenReceipt = async (payment) => {
    try {
      const res = await api.get(`/payments/receipt/${payment.receipt_number}`);
      setSelectedReceipt(res.data);
    } catch (err) {
      // Fallback object from payment item
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

  const filteredPayments = payments.filter((p) =>
    (p.book_title && p.book_title.toLowerCase().includes(search.toLowerCase())) ||
    (p.reference_id && p.reference_id.toLowerCase().includes(search.toLowerCase())) ||
    (p.receipt_number && p.receipt_number.toLowerCase().includes(search.toLowerCase())) ||
    (p.payment_method && p.payment_method.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton label="Back" fallback="/student/dashboard" />
          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white flex items-center gap-2">
              <span>Fine & Payment History</span>
              <span className="p-1 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30">
                <FileText className="w-5 h-5" />
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Complete records of settled library fines, digital vouchers, and transactions.
            </p>
          </div>
        </div>

        <Link
          to="/student/fines"
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <CreditCard className="w-4 h-4" />
          <span>Pay Outstanding Fine</span>
        </Link>
      </div>

      {/* Search & Stats Bar */}
      <div className="glass-panel border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by book title, receipt no, or txn ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>Total Transactions: <strong className="text-white">{payments.length}</strong></span>
        </div>
      </div>

      {/* Payments History Table */}
      {loading ? (
        <div className="p-16 text-center text-slate-400">Loading fine payment logs...</div>
      ) : filteredPayments.length === 0 ? (
        <div className="p-12 rounded-3xl glass-panel text-center max-w-md mx-auto space-y-3">
          <Receipt className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Payment Records Found</h3>
          <p className="text-xs text-slate-400">
            {search ? 'No payments match your search filter.' : "You haven't made any fine payments yet."}
          </p>
        </div>
      ) : (
        <div className="glass-panel border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Book Title</th>
                  <th className="py-3.5 px-4 text-right">Fine Amount</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4">Transaction Ref</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPayments.map((p) => {
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
                      <td className="py-3.5 px-4 font-bold text-white max-w-[220px] truncate">
                        <div className="flex items-center gap-2.5">
                          <BookOpen className="w-4 h-4 text-brand-400 shrink-0" />
                          <span className="truncate">{p.book_title}</span>
                        </div>
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
                          <span>View</span>
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
