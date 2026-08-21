import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  AlertTriangle,
  AlertOctagon,
  Calendar,
  BookOpen,
  RotateCcw,
  Trash2,
  ExternalLink,
  Sparkles,
  ArrowLeft,
  CreditCard
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import BackButton from '../../components/BackButton';
import ActionMotivationBanner from '../../components/ActionMotivationBanner';

export default function NotificationsPage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'overdue' | 'due_soon'

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications?limit=100');
      setNotifications(res.data || []);
    } catch (err) {
      error('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      success('Notification marked as read.');
    } catch (err) {
      error('Failed to mark notification as read.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await api.post('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      success(res.data.message || 'All notifications marked as read.');
    } catch (err) {
      error('Failed to mark all notifications as read.');
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      success('Notification deleted.');
    } catch (err) {
      error('Failed to delete notification.');
    }
  };

  // Filtered notifications
  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'overdue') return n.notification_type === 'OVERDUE' || n.is_overdue;
    if (filter === 'due_soon') {
      return ['DUE_TODAY', 'REMINDER_1_DAY', 'REMINDER_2_DAYS', 'REMINDER_3_DAYS'].includes(n.notification_type);
    }
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const overdueCount = notifications.filter((n) => n.is_overdue || n.notification_type === 'OVERDUE').length;

  const getTypeConfig = (type) => {
    switch (type) {
      case 'OVERDUE':
        return {
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: AlertOctagon,
          iconColor: 'text-rose-400',
          cardBorder: 'border-rose-500/40 bg-rose-950/20',
          label: '🚨 OVERDUE',
        };
      case 'DUE_TODAY':
        return {
          badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          icon: AlertTriangle,
          iconColor: 'text-orange-400',
          cardBorder: 'border-orange-500/40 bg-orange-950/20',
          label: '🔔 DUE TODAY',
        };
      case 'REMINDER_1_DAY':
        return {
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: Clock,
          iconColor: 'text-amber-400',
          cardBorder: 'border-amber-500/30 bg-amber-950/15',
          label: '⚠️ DUE TOMORROW',
        };
      case 'REMINDER_2_DAYS':
        return {
          badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
          icon: Calendar,
          iconColor: 'text-indigo-400',
          cardBorder: 'border-indigo-500/30 bg-indigo-950/15',
          label: '⏰ DUE IN 2 DAYS',
        };
      case 'REMINDER_3_DAYS':
      default:
        return {
          badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
          icon: BookOpen,
          iconColor: 'text-sky-400',
          cardBorder: 'border-sky-500/30 bg-sky-950/15',
          label: '📚 DUE IN 3 DAYS',
        };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Contextual Motivating Due-Date Alert Banner */}
      <ActionMotivationBanner action="overdue" />

      {/* Page Header with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton label="Back" />
          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white flex items-center gap-2.5">
              <span>Due-Date Notifications & Alerts</span>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md">
                  {unreadCount} Unread
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Automated reminders, due date countdowns, and overdue fine status.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-brand-300 font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark All Read</span>
            </button>
          )}

          <Link
            to="/student/borrowed"
            className="px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-bold text-xs transition-all shadow-md flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>My Loans & Returns</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'all'
              ? 'bg-brand-500 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          All Alerts ({notifications.length})
        </button>

        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'unread'
              ? 'bg-brand-500 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Unread ({unreadCount})
        </button>

        <button
          onClick={() => setFilter('overdue')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'overdue'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-rose-400 hover:bg-rose-950/40'
          }`}
        >
          Overdue ({overdueCount})
        </button>

        <button
          onClick={() => setFilter('due_soon')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'due_soon'
              ? 'bg-amber-500 text-white shadow-md'
              : 'text-amber-400 hover:bg-amber-950/40'
          }`}
        >
          Due Soon (≤ 3 Days)
        </button>
      </div>

      {/* Notifications Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-400">Loading alerts & due dates...</div>
      ) : filteredNotifications.length > 0 ? (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const config = getTypeConfig(notif.notification_type);
            const Icon = config.icon;

            return (
              <div
                key={notif.id}
                className={`p-5 rounded-2xl border ${
                  notif.is_read
                    ? 'border-slate-800/80 bg-slate-900/40'
                    : `${config.cardBorder} shadow-lg shadow-black/20`
                } flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-200 group`}
              >
                {/* Left info */}
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  {notif.book_cover ? (
                    <img
                      src={notif.book_cover}
                      alt={notif.book_title || 'Book'}
                      className="w-14 h-20 object-cover rounded-xl shadow-md border border-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700 text-slate-400">
                      <Icon className={`w-6 h-6 ${config.iconColor}`} />
                    </div>
                  )}

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${config.badge}`}>
                        {config.label}
                      </span>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-brand-400 animate-ping" />
                      )}
                      <span className="text-xs text-slate-400">
                        {new Date(notif.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-base text-white">
                      {notif.title}
                    </h3>

                    <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                      {notif.message}
                    </p>

                    {/* Metadata tags */}
                    <div className="flex items-center gap-3 pt-1 text-xs text-slate-400 flex-wrap">
                      {notif.due_date && (
                        <span className="flex items-center gap-1 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          Due Date: {new Date(notif.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}

                      {notif.is_overdue && notif.fine_amount > 0 && (
                        <span className="text-rose-400 font-bold bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
                          Accumulated Fine: ₹{notif.fine_amount.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {!notif.is_read && (
                    <button
                      onClick={(e) => handleMarkAsRead(notif.id, e)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-brand-300 text-xs font-bold transition-all flex items-center gap-1 border border-slate-700"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark Read</span>
                    </button>
                  )}

                  {notif.is_overdue && (
                    <Link
                      to={notif.transaction_id ? `/student/fines/pay/${notif.transaction_id}` : '/student/fines'}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 text-xs font-black transition-all shadow-md flex items-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Pay Fine</span>
                    </Link>
                  )}

                  <Link
                    to="/student/borrowed"
                    className="px-3.5 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Return Book</span>
                  </Link>

                  <button
                    onClick={(e) => handleDelete(notif.id, e)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                    title="Delete alert"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-16 rounded-3xl glass-panel text-center border border-slate-800/80">
          <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No notifications found</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            {filter === 'unread' ? 'All notifications have been read.' : 'You have no active due date alerts.'}
          </p>
          <Link
            to="/student/books"
            className="px-4 py-2 bg-brand-500 hover:bg-brand-400 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4" />
            <span>Browse Library Books</span>
          </Link>
        </div>
      )}
    </div>
  );
}
