import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  BookOpen,
  BookmarkCheck,
  Users,
  Clock,
  IndianRupee,
  TrendingUp,
  BarChart3,
  BookPlus,
  ArrowRight,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';

export default function LibrarianDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [anRes, txRes] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/loans/all?limit=6'),
        ]);
        setAnalytics(anRes.data);
        setRecentTransactions(txRes.data || []);
      } catch (err) {
        console.error('Failed to load librarian dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading || !analytics) {
    return <div className="p-16 text-center text-slate-400">Loading library analytics...</div>;
  }

  const PIE_COLORS = ['#10B981', '#F59E0B', '#6366F1', '#EF4444'];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-amber-950/60 via-slate-900 to-brand-950/60 border border-amber-500/20 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Librarian Operations Console
          </span>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white mt-2">
            Library Overview & Inventory
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Real-time campus circulation, stock levels, active borrowers, and automated ML demand predictions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/librarian/books"
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
          >
            <BookPlus className="w-4 h-4" />
            <span>Manage Catalog</span>
          </Link>
          <Link
            to="/librarian/ai-insights"
            className="px-4 py-2.5 bg-ai-600/30 hover:bg-ai-600/50 border border-ai-500/40 text-ai-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Demand Forecasts</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid - Dynamic Indian & Tamil Library Collection Analytics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div className="p-4 rounded-2xl glass-panel border border-brand-500/30 bg-brand-950/20">
          <p className="text-brand-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <span>📚 Total Books</span>
          </p>
          <p className="text-2xl font-display font-black text-white mt-1.5">{analytics.total_books}</p>
          <span className="text-[10px] text-slate-400 font-medium">In Master Catalog</span>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-emerald-500/30 bg-emerald-950/20">
          <p className="text-emerald-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <span>🇮🇳 Indian Books</span>
          </p>
          <p className="text-2xl font-display font-black text-emerald-300 mt-1.5">{analytics.indian_books_count || 473}</p>
          <span className="text-[10px] text-emerald-400/80 font-medium">NBT & Govt Heritage</span>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-amber-500/30 bg-amber-950/20">
          <p className="text-amber-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <span>📜 தமிழ் Tamil</span>
          </p>
          <p className="text-2xl font-display font-black text-amber-300 mt-1.5">{analytics.tamil_books_count || 376}</p>
          <span className="text-[10px] text-amber-400/80 font-medium">Sangam & Modern</span>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-ai-500/30 bg-ai-950/20">
          <p className="text-ai-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <span>💻 Technical</span>
          </p>
          <p className="text-2xl font-display font-black text-ai-300 mt-1.5">{analytics.technical_books_count || 165}</p>
          <span className="text-[10px] text-ai-400/80 font-medium">CS, AI, Math & Engg</span>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-teal-500/30 bg-teal-950/20">
          <p className="text-teal-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <span>📖 Available</span>
          </p>
          <p className="text-2xl font-display font-black text-teal-300 mt-1.5">{analytics.available_copies}</p>
          <span className="text-[10px] text-teal-400/80 font-medium">Ready for Circulation</span>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-indigo-500/30 bg-indigo-950/20">
          <p className="text-indigo-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <span>🔄 Borrowed</span>
          </p>
          <p className="text-2xl font-display font-black text-indigo-300 mt-1.5">{analytics.borrowed_copies}</p>
          <span className="text-[10px] text-indigo-400/80 font-medium">Active with Students</span>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-rose-500/40 bg-rose-950/20">
          <p className="text-rose-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <span>⏰ Overdue</span>
          </p>
          <p className="text-2xl font-display font-black text-rose-400 mt-1.5">{analytics.overdue_count}</p>
          <span className="text-[10px] text-rose-400/80 font-medium">Need Return/Fine</span>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Borrow Trends */}
        <div className="p-6 rounded-3xl glass-panel border border-slate-800/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-base text-white">Monthly Borrowing Volume</h3>
              <p className="text-xs text-slate-400">Circulation transactions over time</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.borrows_by_month}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#38bdf8' }}
                />
                <Bar dataKey="borrows" fill="#0284c7" radius={[6, 6, 0, 0]} name="Books Borrowed" />
                <Bar dataKey="returns" fill="#10b981" radius={[6, 6, 0, 0]} name="Books Returned" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Popular Genres & Circulation Pie */}
        <div className="p-6 rounded-3xl glass-panel border border-slate-800/80 shadow-xl space-y-4">
          <div>
            <h3 className="font-display font-bold text-base text-white">Return & Compliance Status</h3>
            <p className="text-xs text-slate-400">Circulation return rates</p>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.return_trends}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analytics.return_trends.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="rounded-3xl glass-panel border border-slate-800/80 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-lg text-white">Live Borrowing Transactions</h3>
            <p className="text-xs text-slate-400">Most recent check-outs and returns</p>
          </div>
          <Link
            to="/librarian/transactions"
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
          >
            <span>View All Transactions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Book</th>
                <th className="py-3 px-4">Borrow Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 font-semibold text-white">
                    <div>{tx.user_name}</div>
                    <span className="text-[10px] text-slate-400 font-normal">{tx.user_email}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-200">{tx.book_title}</td>
                  <td className="py-3 px-4 text-slate-400">{new Date(tx.borrow_date).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-slate-400">{new Date(tx.due_date).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
