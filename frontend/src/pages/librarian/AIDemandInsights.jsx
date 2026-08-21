import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  TrendingUp,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  PackagePlus,
  BarChart2,
  RefreshCw,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import BackButton from '../../components/BackButton';

export default function AIDemandInsights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ai/demand-predictions');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load demand predictions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  if (loading || !data) {
    return <div className="p-16 text-center text-slate-400">Running demand regression models...</div>;
  }

  const genrePredictions = data.genre_demand_predictions || [];
  const bookPredictions = data.book_demand_predictions || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-ai-950/80 via-slate-900 to-amber-950/80 border border-ai-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-3">
          <BackButton label="Back" fallback="/librarian/dashboard" />
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-ai-300 mb-1">
              <Sparkles className="w-4 h-4 text-ai-400" />
              <span>AI Predictive Demand Analytics</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
              Upcoming Month Demand Predictions
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Machine Learning regression forecast predicting next month checkout volumes, restock needs, and genre demand spikes.
            </p>
          </div>
        </div>

        <button
          onClick={fetchPredictions}
          className="px-4 py-2.5 bg-ai-600 hover:bg-ai-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-ai-500/25 flex items-center gap-2 self-start md:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Re-run Prediction Pipeline</span>
        </button>
      </div>

      {/* Genre Level Forecast Chart */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-lg text-white">Genre-Level Demand Forecast</h3>
            <p className="text-xs text-slate-400">Predicted borrowing checkouts for the upcoming 30 days</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-ai-500/20 text-ai-300 border border-ai-500/30">
            Ridge Regression
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={genrePredictions}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="genre" stroke="#94a3b8" fontSize={10} angle={-15} textAnchor="end" height={60} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                itemStyle={{ color: '#c4b5fd' }}
              />
              <Bar dataKey="historical_borrows" fill="#334155" radius={[4, 4, 0, 0]} name="Historical Checkouts" />
              <Bar dataKey="predicted_next_month_borrows" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Predicted Next Month" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Book-Level Predicted Demand Table */}
      <div className="rounded-3xl glass-panel border border-slate-800 overflow-hidden shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-lg text-white">Book-Level Strain & Restock Recommendations</h3>
            <p className="text-xs text-slate-400">Titles identified by ML as high velocity or at risk of copy shortages</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Book Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4">Predicted Demand</th>
                <th className="py-3 px-4">Recommended Restock</th>
                <th className="py-3 px-4">ML Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {bookPredictions.map((b) => (
                <tr key={b.book_id} className="hover:bg-slate-900/40">
                  <td className="py-3.5 px-4 font-bold text-white max-w-xs truncate">{b.title}</td>
                  <td className="py-3.5 px-4">{b.genre}</td>
                  <td className="py-3.5 px-4">
                    <span className={b.current_available === 0 ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                      {b.current_available} / {b.total_copies} available
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        b.predicted_demand_level === 'HIGH'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : b.predicted_demand_level === 'MEDIUM'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {b.predicted_demand_level} DEMAND
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {b.recommended_restock_copies > 0 ? (
                      <span className="font-bold text-amber-400 flex items-center gap-1">
                        <PackagePlus className="w-3.5 h-3.5" />
                        +{b.recommended_restock_copies} copies needed
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Adequate Stock
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-300">
                    {Math.round(b.confidence_score * 100)}%
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
