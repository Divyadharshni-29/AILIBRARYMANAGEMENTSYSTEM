import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Clock, AlertTriangle, CheckCircle, IndianRupee, RefreshCw, Mail } from 'lucide-react';
import BackButton from '../../components/BackButton';

export default function OverdueManagement() {
  const { success, error } = useToast();
  const [overdueList, setOverdueList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOverdue = async () => {
    setLoading(true);
    try {
      const res = await api.get('/loans/overdue');
      setOverdueList(res.data || []);
    } catch (err) {
      error('Failed to load overdue records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverdue();
  }, []);

  const handleFineAction = async (transactionId, action) => {
    try {
      await api.post(`/loans/fines/${transactionId}/pay?action=${action}`);
      success(`Fine has been successfully ${action}ed.`);
      fetchOverdue();
    } catch (err) {
      error('Failed to update fine.');
    }
  };

  const totalOverdueFines = overdueList.reduce((acc, curr) => acc + (curr.fine_amount || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton label="Back" fallback="/librarian/dashboard" />
          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white">Overdue Loans & Fine Management</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Track unreturned books past their due dates and manage automatic ₹5/day fines.
            </p>
          </div>
        </div>

        <button
          onClick={fetchOverdue}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl glass-panel border border-rose-500/30 bg-rose-950/20 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-rose-300 font-medium">Overdue Books Pending</p>
            <p className="text-2xl font-display font-bold text-white mt-0.5">{overdueList.length}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-amber-500/30 bg-amber-950/20 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-amber-300 font-medium">Estimated Pending Fines</p>
            <p className="text-2xl font-display font-bold text-amber-300 mt-0.5">₹{totalOverdueFines.toFixed(2)}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-sky-500/30 bg-sky-950/20 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-sky-300 font-medium">Standard Fine Policy</p>
            <p className="text-lg font-display font-bold text-white mt-0.5">₹5.00 / day overdue</p>
          </div>
        </div>
      </div>

      {/* Overdue Table */}
      {loading ? (
        <div className="p-16 text-center text-slate-400">Scanning overdue book records...</div>
      ) : overdueList.length > 0 ? (
        <div className="rounded-2xl glass-panel border border-rose-500/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-rose-950/40 text-rose-300 uppercase tracking-wider font-semibold border-b border-rose-500/30">
                <tr>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Book Title</th>
                  <th className="py-3.5 px-4">Borrow Date</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Days Overdue</th>
                  <th className="py-3.5 px-4">Accrued Fine</th>
                  <th className="py-3.5 px-4 text-right">Librarian Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {overdueList.map((tx) => {
                  const daysOverdue = Math.abs(tx.remaining_days || 0);
                  const fine = tx.fine_amount || (daysOverdue * 1.0);

                  return (
                    <tr key={tx.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div>{tx.user_name}</div>
                        <span className="text-[10px] text-slate-400 font-normal">{tx.user_email}</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-200">{tx.book_title}</td>
                      <td className="py-3.5 px-4 text-slate-400">{new Date(tx.borrow_date).toLocaleDateString()}</td>
                      <td className="py-3.5 px-4 font-bold text-rose-400">{new Date(tx.due_date).toLocaleDateString()}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {daysOverdue} Days Late
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-amber-300">
                        ₹{fine.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleFineAction(tx.id, 'pay')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition-all shadow-sm"
                          >
                            Mark Paid
                          </button>
                          <button
                            onClick={() => handleFineAction(tx.id, 'waive')}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-bold transition-all"
                          >
                            Waive
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-16 rounded-3xl glass-panel text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Overdue Loans</h3>
          <p className="text-xs text-slate-400 mt-1">All borrowed books are within their active loan periods.</p>
        </div>
      )}
    </div>
  );
}
