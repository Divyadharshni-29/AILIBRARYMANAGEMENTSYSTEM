import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Cpu,
  Sparkles,
  TrendingUp,
  Award,
  RefreshCw,
  Sliders,
  CheckCircle,
  BarChart3,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import BackButton from '../../components/BackButton';

export default function AIModelEvaluation() {
  const { success, error } = useToast();
  const [evalData, setEvalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);

  const fetchEvaluations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ai/evaluations');
      setEvalData(res.data);
    } catch (err) {
      error('Failed to load AI evaluation benchmarks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const handleRetrain = async () => {
    setRetraining(true);
    try {
      const res = await api.post('/ai/retrain');
      success(res.data.message || 'AI models refitted and evaluated successfully!');
      fetchEvaluations();
    } catch (err) {
      error('Failed to retrain models.');
    } finally {
      setRetraining(false);
    }
  };

  if (loading || !evalData) {
    return <div className="p-16 text-center text-slate-400">Computing offline holdout evaluation benchmarks...</div>;
  }

  const comparisons = evalData.comparisons || [];
  const baselineModel = comparisons.find((c) => c.is_baseline) || comparisons[0];
  const improvedModel = comparisons.find((c) => c.model_name.includes('Improved')) || comparisons[comparisons.length - 1];

  // Chart data formatting
  const chartData = comparisons.map((c) => ({
    name: c.model_name.replace(' Only', '').replace(' (Equal Weights)', '').replace(' (Feature Tuned)', ''),
    'Precision@5': Math.round(c.precision_at_5 * 100),
    'Recall@5': Math.round(c.recall_at_5 * 100),
    'NDCG@5': Math.round(c.ndcg_at_5 * 100),
    'F1-Score': Math.round(c.f1_score * 100),
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-ai-950 via-slate-900 to-brand-950 border border-ai-500/40 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-3">
          <BackButton label="Back" fallback="/admin/dashboard" />
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-ai-300 mb-1">
              <Sparkles className="w-4 h-4 text-ai-400" />
              <span>Machine Learning Verification Studio</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
              AI Model Performance & Evaluation
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Empirical A/B offline metric evaluation comparing TF-IDF content filtering, collaborative ALS/SVD filtering, baseline hybrid, and the improved AI scoring model.
            </p>
          </div>
        </div>

        <button
          onClick={handleRetrain}
          disabled={retraining}
          className="px-5 py-3 bg-gradient-to-r from-ai-600 to-brand-500 hover:from-ai-500 hover:to-brand-400 text-white font-bold text-xs rounded-2xl transition-all shadow-xl shadow-ai-500/25 flex items-center gap-2 self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${retraining ? 'animate-spin' : ''}`} />
          <span>{retraining ? 'Fitting Matrices & Evaluating...' : 'Retrain & Re-Evaluate Pipeline'}</span>
        </button>
      </div>

      {/* Before vs After Optimization Summary */}
      <div className="rounded-3xl glass-panel border border-ai-500/30 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-ai-400" />
            <h2 className="font-display font-bold text-xl text-white">
              Model Optimization: Before vs After
            </h2>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Validated Measurable Improvement
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400">Precision@5 (Top-5 Accuracy)</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-display font-bold text-emerald-400">
                {Math.round(improvedModel.precision_at_5 * 100)}%
              </span>
              <span className="text-xs text-slate-500 line-through">
                {Math.round(baselineModel.precision_at_5 * 100)}%
              </span>
            </div>
            <p className="text-[11px] text-emerald-300 mt-1">
              +{Math.round((improvedModel.precision_at_5 - baselineModel.precision_at_5) * 100)}% absolute gain
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400">Recall@5 (Catalog Discovery)</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-display font-bold text-sky-400">
                {Math.round(improvedModel.recall_at_5 * 100)}%
              </span>
              <span className="text-xs text-slate-500 line-through">
                {Math.round(baselineModel.recall_at_5 * 100)}%
              </span>
            </div>
            <p className="text-[11px] text-sky-300 mt-1">
              +{Math.round((improvedModel.recall_at_5 - baselineModel.recall_at_5) * 100)}% discovery gain
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400">NDCG@5 (Ranking Quality)</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-display font-bold text-ai-400">
                {Math.round(improvedModel.ndcg_at_5 * 100)}%
              </span>
              <span className="text-xs text-slate-500 line-through">
                {Math.round(baselineModel.ndcg_at_5 * 100)}%
              </span>
            </div>
            <p className="text-[11px] text-ai-300 mt-1">
              +{Math.round((improvedModel.ndcg_at_5 - baselineModel.ndcg_at_5) * 100)}% ranking quality
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400">Catalog Coverage</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-display font-bold text-amber-400">
                {Math.round(improvedModel.coverage * 100)}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Diversity across all {evalData.evaluation_sample_size} students</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-ai-950/60 border border-ai-500/30 text-xs text-ai-200 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-ai-400 shrink-0 mt-0.5" />
          <div>
            <strong>Optimization Rationale:</strong> {evalData.improvement_summary}
            <span className="block mt-1 text-slate-400">
              Active Ensemble Weights: 40% TF-IDF Content Similarity + 30% SVD Collaborative Filtering + 20% Behaviour Affinity + 10% Circulation Popularity.
            </span>
          </div>
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-800 shadow-2xl space-y-4">
        <div>
          <h3 className="font-display font-bold text-lg text-white">Algorithm Benchmark Comparison</h3>
          <p className="text-xs text-slate-400">Comparing Accuracy, Ranking Quality, and F1-Scores across algorithms</p>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
              <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} unit="%" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Bar dataKey="Precision@5" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Recall@5" fill="#818cf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="NDCG@5" fill="#a78bfa" radius={[4, 4, 0, 0]} />
              <Bar dataKey="F1-Score" fill="#34d399" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Metrics Table */}
      <div className="rounded-3xl glass-panel border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800">
          <h3 className="font-display font-bold text-lg text-white">Offline Evaluation Metrics Table</h3>
          <p className="text-xs text-slate-400">Exact metric outputs calculated from campus holdout dataset</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Model Architecture</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Precision@5</th>
                <th className="py-3.5 px-4">Recall@5</th>
                <th className="py-3.5 px-4">NDCG@5</th>
                <th className="py-3.5 px-4">F1-Score</th>
                <th className="py-3.5 px-4">MRR (Mean Rank)</th>
                <th className="py-3.5 px-4">Catalog Coverage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {comparisons.map((c, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40">
                  <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                    {c.model_name.includes('Improved') && <Sparkles className="w-3.5 h-3.5 text-ai-400" />}
                    <span>{c.model_name}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.is_baseline
                          ? 'bg-slate-800 text-slate-400 border border-slate-700'
                          : 'bg-ai-500/20 text-ai-300 border border-ai-500/30'
                      }`}
                    >
                      {c.is_baseline ? 'Baseline' : 'Candidate Model'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-sky-400">
                    {(c.precision_at_5 * 100).toFixed(1)}%
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-indigo-400">
                    {(c.recall_at_5 * 100).toFixed(1)}%
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-purple-400">
                    {(c.ndcg_at_5 * 100).toFixed(1)}%
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-emerald-400">
                    {(c.f1_score * 100).toFixed(1)}%
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    {c.mean_reciprocal_rank.toFixed(3)}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-amber-400">
                    {(c.coverage * 100).toFixed(1)}%
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
