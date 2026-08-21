import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Shield,
  Users,
  BookOpen,
  History,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Activity
} from 'lucide-react';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [evalData, setEvalData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);
      try {
        const [uRes, aRes, eRes] = await Promise.all([
          api.get('/admin/users'),
          api.get('/analytics/dashboard'),
          api.get('/ai/evaluations'),
        ]);
        setUsers(uRes.data || []);
        setAnalytics(aRes.data);
        setEvalData(eRes.data);
      } catch (err) {
        console.error('Failed to load admin data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  if (loading || !analytics) {
    return <div className="p-16 text-center text-slate-400">Loading administrator console...</div>;
  }

  const studentCount = users.filter((u) => u.role === 'student').length;
  const librarianCount = users.filter((u) => u.role === 'librarian').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-rose-950/60 via-slate-900 to-ai-950/60 border border-rose-500/20 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            System Administrator Control Plane
          </span>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white mt-2">
            System Administration & AI Governance
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Campus-wide user management, role privileges, system audit, and Machine Learning model benchmark monitoring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/users"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all border border-slate-700 flex items-center gap-1.5"
          >
            <Users className="w-4 h-4" />
            <span>Manage Users</span>
          </Link>
          <Link
            to="/admin/ai-evaluation"
            className="px-4 py-2.5 bg-gradient-to-r from-ai-600 to-brand-600 hover:from-ai-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-ai-500/25 flex items-center gap-1.5"
          >
            <Cpu className="w-4 h-4" />
            <span>AI Model Evaluation</span>
          </Link>
        </div>
      </div>

      {/* Indian & Tamil Library Collection Analytics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div className="p-4 rounded-2xl glass-panel border border-brand-500/30 bg-brand-950/20">
          <p className="text-brand-300 text-xs font-bold uppercase tracking-wider">📚 Total Books</p>
          <p className="text-2xl font-display font-black text-white mt-1.5">{analytics.total_books}</p>
          <span className="text-[10px] text-slate-400 font-medium">Catalog Count</span>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-emerald-500/30 bg-emerald-950/20">
          <p className="text-emerald-300 text-xs font-bold uppercase tracking-wider">🇮🇳 Indian Books</p>
          <p className="text-2xl font-display font-black text-emerald-300 mt-1.5">{analytics.indian_books_count || 473}</p>
          <span className="text-[10px] text-emerald-400/80 font-medium">Indian Literature</span>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-amber-500/30 bg-amber-950/20">
          <p className="text-amber-300 text-xs font-bold uppercase tracking-wider">📜 தமிழ் Tamil</p>
          <p className="text-2xl font-display font-black text-amber-300 mt-1.5">{analytics.tamil_books_count || 376}</p>
          <span className="text-[10px] text-amber-400/80 font-medium">TVA Collection</span>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-ai-500/30 bg-ai-950/20">
          <p className="text-ai-300 text-xs font-bold uppercase tracking-wider">💻 Technical</p>
          <p className="text-2xl font-display font-black text-ai-300 mt-1.5">{analytics.technical_books_count || 165}</p>
          <span className="text-[10px] text-ai-400/80 font-medium">CS & Engineering</span>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-teal-500/30 bg-teal-950/20">
          <p className="text-teal-300 text-xs font-bold uppercase tracking-wider">📖 Available</p>
          <p className="text-2xl font-display font-black text-teal-300 mt-1.5">{analytics.available_copies}</p>
          <span className="text-[10px] text-teal-400/80 font-medium">In Library</span>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-indigo-500/30 bg-indigo-950/20">
          <p className="text-indigo-300 text-xs font-bold uppercase tracking-wider">🔄 Borrowed</p>
          <p className="text-2xl font-display font-black text-indigo-300 mt-1.5">{analytics.borrowed_copies}</p>
          <span className="text-[10px] text-indigo-400/80 font-medium">Active Loans</span>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-rose-500/40 bg-rose-950/20">
          <p className="text-rose-300 text-xs font-bold uppercase tracking-wider">⏰ Overdue</p>
          <p className="text-2xl font-display font-black text-rose-400 mt-1.5">{analytics.overdue_count}</p>
          <span className="text-[10px] text-rose-400/80 font-medium">Overdue Books</span>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/admin/users"
          className="p-6 rounded-3xl glass-panel border border-slate-800 hover:border-brand-500/40 transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-lg text-white group-hover:text-brand-300 transition-colors">
            User Accounts & Roles
          </h3>
          <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">
            View student accounts, assign permissions, de-activate accounts, or remove users.
          </p>
          <div className="text-xs font-bold text-brand-400 flex items-center gap-1">
            <span>Manage Users</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          to="/admin/categories"
          className="p-6 rounded-3xl glass-panel border border-slate-800 hover:border-amber-500/40 transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-lg text-white group-hover:text-amber-300 transition-colors">
            Category Taxonomies
          </h3>
          <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">
            Manage academic discipline categories and organize topic classification hierarchies.
          </p>
          <div className="text-xs font-bold text-amber-400 flex items-center gap-1">
            <span>Manage Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          to="/admin/ai-evaluation"
          className="p-6 rounded-3xl glass-panel border border-ai-500/30 hover:border-ai-500/60 transition-all group bg-gradient-to-br from-slate-900 to-ai-950/40"
        >
          <div className="w-12 h-12 rounded-2xl bg-ai-500/20 text-ai-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-lg text-white group-hover:text-ai-300 transition-colors">
            AI Model Evaluation Studio
          </h3>
          <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">
            Inspect live Precision@K, Recall@K, NDCG@K offline benchmark charts comparing Baseline vs Improved hybrid models.
          </p>
          <div className="text-xs font-bold text-ai-400 flex items-center gap-1">
            <span>Open AI Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>
    </div>
  );
}
