import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  AlertTriangle,
  AlertOctagon,
  Calendar,
  BookOpen,
  X,
  ExternalLink
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const dropdownRef = useRef(null);

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      console.error('Error fetching unread notification count:', err);
    }
  };

  // Fetch full list of notifications
  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get('/notifications?limit=25');
      setNotifications(res.data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // When opening dropdown, fetch full list and refresh count
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [isOpen]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) {
      handleMarkAsRead(notif.id);
    }
    setIsOpen(false);
    if (user?.role === 'student') {
      navigate('/student/borrowed');
    } else {
      navigate('/librarian/overdue');
    }
  };

  // Helper to format date
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  // Get style configs for different notification types
  const getTypeStyle = (type) => {
    switch (type) {
      case 'OVERDUE':
        return {
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          iconBg: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
          icon: AlertOctagon,
          cardBorder: 'border-rose-500/40 bg-rose-950/20',
          label: 'OVERDUE'
        };
      case 'DUE_TODAY':
        return {
          badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          iconBg: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
          icon: AlertTriangle,
          cardBorder: 'border-orange-500/40 bg-orange-950/20',
          label: 'DUE TODAY'
        };
      case 'REMINDER_1_DAY':
        return {
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          iconBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
          icon: Clock,
          cardBorder: 'border-amber-500/30 bg-amber-950/10',
          label: 'DUE TOMORROW'
        };
      case 'REMINDER_2_DAYS':
        return {
          badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
          iconBg: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
          icon: Calendar,
          cardBorder: 'border-indigo-500/30 bg-indigo-950/10',
          label: '2 DAYS LEFT'
        };
      case 'REMINDER_3_DAYS':
      default:
        return {
          badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
          iconBg: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
          icon: BookOpen,
          cardBorder: 'border-sky-500/30 bg-sky-950/10',
          label: '3 DAYS LEFT'
        };
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read;
    return true;
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button with Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all duration-200 ${
          isOpen
            ? 'bg-slate-800 text-brand-400 shadow-md ring-2 ring-brand-500/30'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
        }`}
        title="Due-Date Notifications & Alerts"
        aria-label="Notifications"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-bounce-subtle text-amber-400' : ''}`} />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-lg shadow-rose-500/40 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popup */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-96 sm:w-[420px] max-w-[95vw] rounded-2xl bg-slate-900/95 border border-slate-700/80 backdrop-blur-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Due-Date Alerts
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {unreadCount} new
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-400">Book return reminders & overdue alerts</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800/80"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mark all read</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="px-4 py-2 border-b border-slate-800/60 bg-slate-950/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  filter === 'all'
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  filter === 'unread'
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/student/borrowed');
              }}
              className="text-slate-400 hover:text-brand-300 font-semibold flex items-center gap-1 transition-colors"
            >
              <span>My Loans</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                <span>Checking loan due dates...</span>
              </div>
            ) : filteredNotifications.length > 0 ? (
              filteredNotifications.map((notif) => {
                const style = getTypeStyle(notif.notification_type);
                const IconComponent = style.icon;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3 rounded-xl cursor-pointer transition-all duration-150 flex gap-3 relative group ${
                      notif.is_read
                        ? 'hover:bg-slate-800/50 opacity-85'
                        : `${style.cardBorder} hover:brightness-110 shadow-sm`
                    }`}
                  >
                    {/* Unread indicator dot */}
                    {!notif.is_read && (
                      <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-brand-400 ring-4 ring-brand-400/20" />
                    )}

                    {/* Icon / Cover Thumbnail */}
                    <div className="shrink-0 flex flex-col items-center gap-1">
                      {notif.book_cover ? (
                        <img
                          src={notif.book_cover}
                          alt={notif.book_title || 'Book'}
                          className="w-10 h-14 object-cover rounded-lg shadow-md border border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${style.iconBg}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    {/* Body Content */}
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${style.badge}`}>
                          {style.label}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {formatTimeAgo(notif.created_at)}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-white line-clamp-1 leading-snug">
                        {notif.title}
                      </h4>

                      <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Due Date & Fine Metadata tags */}
                      <div className="flex items-center gap-2 mt-2 text-[11px] flex-wrap">
                        {notif.due_date && (
                          <span className="text-slate-400 flex items-center gap-1 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            Due: {new Date(notif.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}

                        {notif.is_overdue && notif.fine_amount > 0 && (
                          <span className="text-rose-300 font-bold bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/60">
                            Fine: ₹{notif.fine_amount.toFixed(2)}
                          </span>
                        )}

                        {!notif.is_read && (
                          <button
                            onClick={(e) => handleMarkAsRead(notif.id, e)}
                            className="ml-auto text-[10px] font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Mark as read"
                          >
                            <Check className="w-3 h-3" />
                            <span>Mark read</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-400">
                  <CheckCheck className="w-6 h-6 text-brand-400" />
                </div>
                <p className="text-xs font-bold text-slate-200">All caught up!</p>
                <p className="text-[11px] text-slate-400">
                  {filter === 'unread' ? 'No unread notifications.' : 'No active due date alerts.'}
                </p>
              </div>
            )}
          </div>

          {/* Dropdown Footer */}
          <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/student/borrowed');
              }}
              className="text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors inline-flex items-center gap-1.5"
            >
              <span>Manage All Borrowed Books & Returns</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
