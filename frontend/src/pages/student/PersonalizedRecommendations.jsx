import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, BrainCircuit, Sliders, RefreshCw, BarChart2, CheckCircle } from 'lucide-react';
import RecommendationCard from '../../components/RecommendationCard';
import BorrowModal from '../../components/BorrowModal';
import BackButton from '../../components/BackButton';
import ActionMotivationBanner from '../../components/ActionMotivationBanner';

export default function PersonalizedRecommendations() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [topK, setTopK] = useState(6);
  const [loading, setLoading] = useState(true);
  const [selectedBorrowBook, setSelectedBorrowBook] = useState(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const [recsRes, profRes] = await Promise.all([
        api.get(`/ai/recommendations?top_k=${topK}`),
        api.get('/ai/user-profile'),
      ]);
      setRecommendations(recsRes.data.recommendations || []);
      setUserProfile(profRes.data);
    } catch (err) {
      console.error('Failed to load AI recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [topK]);

  const affinities = userProfile?.genre_affinities || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Contextual Motivating Recommendation Banner */}
      <ActionMotivationBanner action="recommendation" />

      {/* Header Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-ai-950/80 via-slate-900 to-brand-950/80 border border-ai-500/30 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-3">
            <BackButton label="Back" fallback="/student/dashboard" />
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-ai-300 mb-1">
                <Sparkles className="w-4 h-4 text-ai-400" />
                <span>Personalized AI Hybrid Engine</span>
              </div>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
                Curated for {user?.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Every recommendation below combines Content-Based NLP similarity, Collaborative matrix factorization from peer student interactions, your personal genre affinity profile, and library popularity.
              </p>
            </div>
          </div>

          <button
            onClick={fetchRecommendations}
            className="px-4 py-2.5 rounded-xl bg-ai-600 hover:bg-ai-500 text-white font-bold text-xs transition-all shadow-lg shadow-ai-500/25 flex items-center gap-2 self-start md:self-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Re-compute Hybrid Feed</span>
          </button>
        </div>
      </div>

      {/* User Affinity Breakdown Bar */}
      {Object.keys(affinities).length > 0 && (
        <div className="p-5 rounded-2xl glass-panel border border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-brand-400" />
              <h3 className="font-display font-bold text-sm text-white">Your Reading Preference Profile</h3>
            </div>
            <span className="text-[11px] text-slate-400">Dynamically adapted from your borrow & rating activity</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(affinities).map(([genre, score]) => (
              <div key={genre} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span className="text-slate-300 truncate">{genre}</span>
                  <span className="text-ai-300 font-bold">{Math.round(score * 100)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-ai-500 rounded-full"
                    style={{ width: `${Math.round(score * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-xl text-white">Top Recommendations</h2>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Show:</span>
            <select
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none"
            >
              <option value={4}>Top 4</option>
              <option value={6}>Top 6</option>
              <option value={8}>Top 8</option>
              <option value={12}>Top 12</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-ai-400 animate-spin" />
            <p className="text-sm font-medium">Running Matrix Factorization & TF-IDF Scoring...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((item) => (
              <RecommendationCard
                key={item.book.id}
                item={item}
                onBorrow={(b) => setSelectedBorrowBook(b)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <BorrowModal
        book={selectedBorrowBook}
        isOpen={!!selectedBorrowBook}
        onClose={() => setSelectedBorrowBook(null)}
        onBorrowed={() => fetchRecommendations()}
      />
    </div>
  );
}
