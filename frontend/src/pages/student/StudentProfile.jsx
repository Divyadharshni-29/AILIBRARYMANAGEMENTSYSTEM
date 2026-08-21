import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  User,
  Mail,
  Building,
  GraduationCap,
  Sparkles,
  BarChart3,
  Calendar,
  Save,
  Check,
  Search,
  History,
  Trash2,
  ArrowRight,
  Clock
} from 'lucide-react';
import ColdStartModal from '../../components/ColdStartModal';
import BackButton from '../../components/BackButton';

export default function StudentProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [profileData, setUserProfile] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showEditInterests, setShowEditInterests] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ai/user-profile');
      setUserProfile(res.data);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSearchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get('/search/history');
      setSearchHistory(res.data || []);
    } catch (err) {
      console.error('Failed to load search history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await api.delete('/search/history');
      setSearchHistory([]);
      success('Search history cleared.');
    } catch (err) {
      error('Failed to clear search history.');
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchSearchHistory();
  }, []);

  const affinities = profileData?.genre_affinities || {};
  const interests = profileData?.interests || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <BackButton label="Back" fallback="/student/dashboard" />
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">Student Profile & AI Taste</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            View your academic profile, search query logs, and see how our Machine Learning models understand your reading interests.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Account Info Card */}
        <div className="rounded-3xl glass-panel border border-slate-800/80 p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-500 to-ai-500 flex items-center justify-center font-display font-black text-2xl text-white shadow-xl shadow-brand-500/20">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-display font-bold text-lg text-white">{user?.name}</h2>
                <p className="text-xs text-brand-300 font-semibold">{user?.department}</p>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    Student Member
                  </span>
                  {user?.student_id && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ID: {user.student_id}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-slate-800 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> Email:</span>
                <span className="font-medium text-white font-mono text-[11px]">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-slate-400" /> Department:</span>
                <span className="font-medium text-white">{user?.department || 'Computer Science'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-slate-400" /> Academic Year:</span>
                <span className="font-medium text-white">{user?.year || '1st Year'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" /> Student ID:</span>
                <span className="font-mono font-bold text-emerald-400">{user?.student_id || `DEMO-CSE-${user?.id || '001'}`}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Chosen Interests</h4>
              <button
                onClick={() => setShowEditInterests(true)}
                className="text-[11px] font-semibold text-brand-400 hover:text-brand-300 underline"
              >
                Edit
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {interests.map((interest) => (
                <span
                  key={interest}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-ai-500/20 text-ai-200 border border-ai-500/30"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right 2 Columns: AI Behaviour Preference Vector */}
        <div className="md:col-span-2 rounded-3xl glass-panel border border-ai-500/30 p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-ai-500/20 text-ai-400 flex items-center justify-center border border-ai-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-white">AI Behaviour & Affinity Model</h3>
                <p className="text-xs text-slate-400">Dynamic preference vector normalized in real-time from search queries, borrow events, and ratings</p>
              </div>
            </div>
          </div>

          {/* Bar Visualizer */}
          <div className="space-y-4 pt-2">
            {Object.entries(affinities).map(([genre, score]) => {
              const pct = Math.round(score * 100);
              return (
                <div key={genre} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-200">{genre}</span>
                    <span className="font-bold text-ai-300">{pct}% Affinity</span>
                  </div>
                  <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 via-sky-400 to-ai-500 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-2xl bg-ai-950/40 border border-ai-500/20 text-xs text-slate-300 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-ai-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>How our AI works:</strong> As you search for topics, borrow books, and rate titles, this profile automatically recalculates and guides your personalized recommendations.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Search & NLP Query History Section */}
      <div className="rounded-3xl glass-panel border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">Your Search History & AI Query Log</h3>
              <p className="text-xs text-slate-400">Past search terms recorded by the AI search engine</p>
            </div>
          </div>

          {searchHistory.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-300 text-slate-400 border border-slate-700/50 hover:border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all self-start sm:self-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {historyLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading search history...</div>
        ) : searchHistory.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {searchHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/student/catalog?q=${encodeURIComponent(item.query)}`)}
                className="group p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800 hover:border-brand-500/40 transition-all cursor-pointer flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-brand-400 shrink-0" />
                    <span className="font-semibold text-sm text-white group-hover:text-brand-300 transition-colors line-clamp-1">
                      "{item.query}"
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      item.search_type === 'NLP_SEMANTIC'
                        ? 'bg-ai-500/20 text-ai-300 border border-ai-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {item.search_type === 'NLP_SEMANTIC' ? 'AI Semantic' : 'Keyword'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="flex items-center gap-1 text-brand-400 font-medium group-hover:translate-x-0.5 transition-transform">
                    {item.results_count} results <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-center">
            <Search className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No search history yet</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Searches performed in the Book Discovery catalog will appear here and train your AI profile.
            </p>
          </div>
        )}
      </div>

      <ColdStartModal
        isOpen={showEditInterests}
        onClose={() => setShowEditInterests(false)}
        onComplete={() => fetchProfile()}
      />
    </div>
  );
}

