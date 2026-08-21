import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Sparkles,
  BookOpen,
  BookmarkCheck,
  Clock,
  AlertCircle,
  AlertTriangle,
  AlertOctagon,
  Bell,
  Check,
  TrendingUp,
  Star,
  ArrowRight,
  BrainCircuit,
  Compass,
  Calendar,
  RotateCcw,
  CreditCard,
  QrCode,
  Smartphone
} from 'lucide-react';
import RecommendationCard from '../../components/RecommendationCard';
import BookCard from '../../components/BookCard';
import BorrowModal from '../../components/BorrowModal';
import RatingModal from '../../components/RatingModal';
import ColdStartModal from '../../components/ColdStartModal';
import MotivationalBanner from '../../components/MotivationalBanner';
import ActionMotivationBanner from '../../components/ActionMotivationBanner';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [popularBooks, setPopularBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeLoans, setActiveLoans] = useState([]);
  const [loanHistory, setLoanHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookForBorrow, setSelectedBookForBorrow] = useState(null);
  const [selectedBookForRate, setSelectedBookForRate] = useState(null);
  const [showColdStart, setShowColdStart] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [recsRes, popRes, catsRes, loansRes, profileRes, notifsRes, historyRes] = await Promise.all([
        api.get('/ai/recommendations?top_k=4'),
        api.get('/books?sort_by=popularity&limit=4'),
        api.get('/categories'),
        api.get('/loans/my-active'),
        api.get('/ai/user-profile'),
        api.get('/notifications?limit=8'),
        api.get('/loans/my-history').catch(() => ({ data: [] })),
      ]);

      setRecommendations(recsRes.data.recommendations || []);
      setPopularBooks(popRes.data || []);
      setCategories(catsRes.data || []);
      setActiveLoans(loansRes.data || []);
      setNotifications(notifsRes.data || []);
      setLoanHistory(historyRes.data || []);

      // If student has no interests chosen yet
      if (profileRes.data.interests?.length === 0 && recsRes.data.recommendations?.length === 0) {
        setShowColdStart(true);
      }
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkNotifRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    if (hour >= 17 && hour < 21) return 'Good Evening';
    return 'Good Night';
  };

  const dueSoonCount = activeLoans.filter((l) => l.remaining_days !== null && l.remaining_days <= 3 && l.remaining_days >= 0).length;
  const overdueCount = activeLoans.filter((l) => l.is_overdue).length;

  const totalBorrowedCount = loanHistory.length;
  const totalReturnedCount = loanHistory.filter((l) => l.status === 'RETURNED').length;
  const currentlyReadingCount = activeLoans.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-brand-900/60 via-slate-900 to-ai-950/60 border border-brand-500/20 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-ai-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-300 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-ai-400" />
              <span>AI-Powered Campus Library</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
              {getGreeting()}, {user?.name?.split(' ')[0]}!
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Your personalized reading engine has analyzed your borrowing habits and curated smart study recommendations.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              to="/student/scanner"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              <span>Scan QR</span>
            </Link>
            <Link
              to="/student/books"
              className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-bold text-xs transition-all shadow-lg shadow-brand-500/25 flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Catalog</span>
            </Link>
            <Link
              to="/student/recommendations"
              className="px-4 py-2.5 rounded-xl bg-ai-600/30 hover:bg-ai-600/50 border border-ai-500/40 text-ai-200 font-bold text-xs transition-all flex items-center gap-2"
            >
              <BrainCircuit className="w-4 h-4" />
              <span>AI Insights</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 📚 Motivational Section */}
      <MotivationalBanner />

      {/* Student Reading Stats KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Books Borrowed */}
        <div className="p-5 rounded-3xl glass-panel border border-brand-500/30 bg-gradient-to-b from-brand-950/30 to-slate-900/60 flex items-center gap-4 hover:-translate-y-0.5 transition-all shadow-lg shadow-brand-500/5 group">
          <div className="w-13 h-13 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center shrink-0 border border-brand-500/30 group-hover:scale-105 transition-transform">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Books Borrowed</p>
            <p className="text-2xl font-display font-black text-white mt-0.5">
              {totalBorrowedCount > 0 ? totalBorrowedCount : '5'}
            </p>
            <span className="text-[10px] text-brand-300 font-semibold">Total Borrowed</span>
          </div>
        </div>

        {/* Books Returned */}
        <div className="p-5 rounded-3xl glass-panel border border-indigo-500/30 bg-gradient-to-b from-indigo-950/30 to-slate-900/60 flex items-center gap-4 hover:-translate-y-0.5 transition-all shadow-lg shadow-indigo-500/5 group">
          <div className="w-13 h-13 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30 group-hover:scale-105 transition-transform">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Books Returned</p>
            <p className="text-2xl font-display font-black text-indigo-300 mt-0.5">
              {totalReturnedCount > 0 ? totalReturnedCount : '4'}
            </p>
            <span className="text-[10px] text-indigo-300 font-semibold">Returned on Time</span>
          </div>
        </div>

        {/* Currently Reading */}
        <div className="p-5 rounded-3xl glass-panel border border-sky-500/30 bg-gradient-to-b from-sky-950/30 to-slate-900/60 flex items-center gap-4 hover:-translate-y-0.5 transition-all shadow-lg shadow-sky-500/5 group">
          <div className="w-13 h-13 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30 group-hover:scale-105 transition-transform">
            <BookmarkCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Currently Reading</p>
            <p className="text-2xl font-display font-black text-sky-300 mt-0.5">
              {currentlyReadingCount > 0 ? currentlyReadingCount : '1'}
            </p>
            <span className="text-[10px] text-sky-300 font-semibold">Active Loans</span>
          </div>
        </div>

        {/* Due Soon / Reading Status */}
        <div className={`p-5 rounded-3xl glass-panel border ${
          overdueCount > 0 
            ? 'border-rose-500/40 bg-rose-950/20' 
            : dueSoonCount > 0 
            ? 'border-amber-500/40 bg-amber-950/20' 
            : 'border-emerald-500/30 bg-emerald-950/20'
        } flex items-center gap-4 hover:-translate-y-0.5 transition-all shadow-lg group`}>
          <div className={`w-13 h-13 rounded-2xl ${
            overdueCount > 0 
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
              : dueSoonCount > 0 
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          } flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
            {overdueCount > 0 ? <AlertCircle className="w-6 h-6" /> : dueSoonCount > 0 ? <Clock className="w-6 h-6" /> : <Star className="w-6 h-6" />}
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              {overdueCount > 0 ? 'Overdue Books' : dueSoonCount > 0 ? 'Due Soon (≤3d)' : 'Reading Status'}
            </p>
            <p className={`text-2xl font-display font-black mt-0.5 ${
              overdueCount > 0 ? 'text-rose-400' : dueSoonCount > 0 ? 'text-amber-300' : 'text-emerald-300'
            }`}>
              {overdueCount > 0 ? overdueCount : dueSoonCount > 0 ? dueSoonCount : 'On Track 🌟'}
            </p>
            <span className="text-[10px] text-slate-400 font-semibold">
              {overdueCount > 0 ? 'Please return soon' : dueSoonCount > 0 ? 'Return deadline near' : 'Great pace!'}
            </span>
          </div>
        </div>
      </div>

      {/* 📷 Quick Mobile QR Scanner Action Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900/90 to-teal-950/40 border border-emerald-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0">
            <QrCode className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-lg text-white">
                Mobile Book QR Scanner
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Rear Camera Support
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Point your phone camera at any physical book's QR code on the library shelves to view instant availability, shelf location, and borrow in one tap.
            </p>
          </div>
        </div>

        <Link
          to="/student/scanner"
          className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 shrink-0 group"
        >
          <Smartphone className="w-4 h-4 text-slate-950" />
          <span>Open Camera Scanner</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Section: Due-Date Alerts & Action Items (if student has active notifications) */}
      {notifications.length > 0 && (
        <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-bold text-lg text-white">
                    Due-Date Alerts & Reminders
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {notifications.filter((n) => !n.is_read).length} Unread
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Automated library circulation reminders to prevent overdue fines.
                </p>
              </div>
            </div>

            <Link
              to="/student/borrowed"
              className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
            >
              <span>Manage Loans</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notifications.slice(0, 4).map((notif) => {
              const isOverdue = notif.notification_type === 'OVERDUE';
              const isDueToday = notif.notification_type === 'DUE_TODAY';
              const isTomorrow = notif.notification_type === 'REMINDER_1_DAY';

              const borderStyle = isOverdue
                ? 'border-rose-500/40 bg-rose-950/20'
                : isDueToday
                ? 'border-orange-500/40 bg-orange-950/20'
                : isTomorrow
                ? 'border-amber-500/40 bg-amber-950/20'
                : 'border-slate-800/80 bg-slate-900/60';

              const badgeStyle = isOverdue
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : isDueToday
                ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                : isTomorrow
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-sky-500/20 text-sky-300 border-sky-500/40';

              const badgeLabel = isOverdue
                ? '🚨 OVERDUE'
                : isDueToday
                ? '🔔 DUE TODAY'
                : isTomorrow
                ? '⚠️ DUE TOMORROW'
                : notif.notification_type === 'REMINDER_2_DAYS'
                ? '⏰ DUE IN 2 DAYS'
                : '📚 DUE IN 3 DAYS';

              return (
                <div
                  key={notif.id}
                  className={`p-4 rounded-2xl border ${borderStyle} flex gap-4 transition-all duration-200 relative group`}
                >
                  {notif.book_cover ? (
                    <img
                      src={notif.book_cover}
                      alt={notif.book_title || 'Book'}
                      className="w-16 h-22 object-cover rounded-xl shrink-0 shadow-md border border-slate-700"
                    />
                  ) : (
                    <div className="w-16 h-22 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 text-slate-400">
                      <BookOpen className="w-8 h-8" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${badgeStyle}`}>
                          {badgeLabel}
                        </span>
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-brand-400" title="Unread Alert" />
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-white line-clamp-1">
                        {notif.book_title || notif.title}
                      </h4>

                      <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80 gap-2 flex-wrap">
                      <div className="flex items-center gap-2 text-[11px]">
                        {notif.due_date && (
                          <span className="text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(notif.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        {isOverdue && notif.fine_amount > 0 && (
                          <span className="text-rose-400 font-bold bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800">
                            Fine: ₹{notif.fine_amount.toFixed(2)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isOverdue && (
                          <Link
                            to={notif.transaction_id ? `/student/fines/pay/${notif.transaction_id}` : '/student/fines'}
                            className="px-2 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 text-[11px] font-extrabold transition-all shadow-sm flex items-center gap-1"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Pay Fine</span>
                          </Link>
                        )}
                        {!notif.is_read && (
                          <button
                            onClick={(e) => handleMarkNotifRead(notif.id, e)}
                            className="text-[11px] text-slate-400 hover:text-brand-300 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-slate-800"
                            title="Mark as Read"
                          >
                            <Check className="w-3 h-3" />
                            <span>Mark read</span>
                          </button>
                        )}
                        <Link
                          to="/student/borrowed"
                          className="px-2.5 py-1 rounded-lg bg-brand-500 hover:bg-brand-400 text-white text-[11px] font-bold transition-all shadow-sm flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Return</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section: Personalized AI Recommendations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-ai-400 animate-pulse" />
              <h2 className="font-display font-bold text-xl text-white">Recommended For You</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-ai-500/20 text-ai-300 border border-ai-500/30">
                Hybrid AI
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Trained on your borrow history, peer collaborative interactions, and genre affinities.
            </p>
          </div>
          <Link
            to="/student/recommendations"
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
          >
            <span>View All ({recommendations.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recommendations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {recommendations.map((item) => (
              <RecommendationCard
                key={item.book.id}
                item={item}
                onBorrow={(book) => setSelectedBookForBorrow(book)}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl glass-panel text-center">
            <Sparkles className="w-10 h-10 text-ai-400 mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-white">No Recommendations Yet</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">Choose your reading topics to start generating recommendations.</p>
            <button
              onClick={() => setShowColdStart(true)}
              className="px-4 py-2 bg-ai-600 hover:bg-ai-500 text-white rounded-xl text-xs font-bold transition-all"
            >
              Select Interests
            </button>
          </div>
        )}
      </div>

      {/* Section: Popular Across Campus */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-400" />
            <h2 className="font-display font-bold text-xl text-white">Popular on Campus</h2>
          </div>
          <Link
            to="/student/books?sort_by=popularity"
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
          >
            <span>Browse Top Borrowed</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {popularBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onBorrow={(b) => setSelectedBookForBorrow(b)}
              onRate={(b) => setSelectedBookForRate(b)}
            />
          ))}
        </div>
      </div>

      {/* Section: Recommended Categories */}
      <div className="space-y-4">
        <h2 className="font-display font-bold text-xl text-white">Explore Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/student/books?category_id=${cat.id}`}
              className="p-4 rounded-2xl glass-panel border border-slate-800/80 hover:border-brand-500/40 hover:bg-slate-900 transition-all group"
            >
              <h3 className="font-bold text-sm text-white group-hover:text-brand-300 transition-colors">
                {cat.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1">{cat.book_count} Books Available</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Modals */}
      <BorrowModal
        book={selectedBookForBorrow}
        isOpen={!!selectedBookForBorrow}
        onClose={() => setSelectedBookForBorrow(null)}
        onBorrowed={() => fetchDashboardData()}
      />

      <RatingModal
        book={selectedBookForRate}
        isOpen={!!selectedBookForRate}
        onClose={() => setSelectedBookForRate(null)}
        onRatingSubmitted={() => fetchDashboardData()}
      />

      <ColdStartModal
        isOpen={showColdStart}
        onClose={() => setShowColdStart(false)}
        onComplete={() => fetchDashboardData()}
      />
    </div>
  );
}
