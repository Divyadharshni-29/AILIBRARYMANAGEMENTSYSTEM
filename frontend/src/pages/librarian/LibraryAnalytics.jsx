import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Users,
  Award,
  BookOpen,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import BackButton from '../../components/BackButton';

export default function LibraryAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await api.get('/analytics/dashboard');
        setAnalytics(res.data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !analytics) {
    return <div className="p-16 text-center text-slate-400">Loading library analytics data...</div>;
  }

  const GENRE_COLORS = ['#0284c7', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#84cc16'];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <BackButton label="Back" fallback="/librarian/dashboard" />
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">Library Circulation Analytics</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Historical lending trends, reader distribution, category engagement, and campus reading metrics.
          </p>
        </div>
      </div>

      {/* Chart Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Circulation */}
        <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
          <h3 className="font-display font-bold text-base text-white">Borrow & Return Volume by Month</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.borrows_by_month}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                />
                <Bar dataKey="borrows" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Borrows" />
                <Bar dataKey="returns" fill="#10b981" radius={[4, 4, 0, 0]} name="Returns" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Popular Category Distribution */}
        <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
          <h3 className="font-display font-bold text-base text-white">Popular Genres by Borrow Count</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.popular_genres} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                <YAxis dataKey="genre" type="category" stroke="#94a3b8" fontSize={10} width={110} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                />
                <Bar dataKey="borrow_count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Checkouts" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Most Borrowed Books Leaderboard & Most Active Readers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Borrowed Books */}
        <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="font-display font-bold text-base text-white">Top 5 Most Borrowed Books</h3>
          </div>

          <div className="space-y-3">
            {analytics.most_borrowed_books.slice(0, 5).map((book, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                    #{idx + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-white truncate max-w-xs">{book.title}</h4>
                    <p className="text-[10px] text-slate-400">{book.category}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-brand-300">{book.borrow_count} Borrows</span>
              </div>
            ))}
          </div>
        </div>

        {/* Most Active Readers */}
        <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-400" />
            <h3 className="font-display font-bold text-base text-white">Most Active Student Readers</h3>
          </div>

          <div className="space-y-3">
            {analytics.active_users.slice(0, 5).map((user, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-500 to-ai-500 flex items-center justify-center font-bold text-xs text-white">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{user.name}</h4>
                    <p className="text-[10px] text-slate-400">{user.department}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400">{user.total_borrows} Books Read</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
