import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Search,
  BookmarkPlus,
  RotateCcw,
  QrCode,
  Bell,
  User,
  Sparkles,
  BarChart3,
  Users,
  Layers,
  Cpu
} from 'lucide-react';
import BackButton from './BackButton';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function GlobalNav() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const role = user?.role || 'student';

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      // Quiet fail
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user, location.pathname]);

  // Build nav items tailored to user role
  const getNavItems = () => {
    if (role === 'admin') {
      return [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Categories', path: '/admin/categories', icon: Layers },
        { name: 'Users', path: '/admin/users', icon: Users },
        { name: 'QR Desk', path: '/admin/scanner', icon: QrCode },
        { name: 'AI Studio', path: '/admin/ai-evaluation', icon: Cpu },
        { name: 'Notifications', path: '/admin/notifications', icon: Bell, badge: unreadCount },
      ];
    }

    if (role === 'librarian') {
      return [
        { name: 'Dashboard', path: '/librarian/dashboard', icon: LayoutDashboard },
        { name: 'Books', path: '/librarian/books', icon: BookOpen },
        { name: 'QR Circulation', path: '/librarian/scanner', icon: QrCode },
        { name: 'Overdue & Fines', path: '/librarian/overdue', icon: RotateCcw },
        { name: 'Analytics', path: '/librarian/analytics', icon: BarChart3 },
        { name: 'Notifications', path: '/librarian/notifications', icon: Bell, badge: unreadCount },
      ];
    }

    // Default: Student Nav Items (Exact requirement: Dashboard, Books, Search, Borrow, Return, QR, Notifications, Profile)
    return [
      { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
      { name: 'Books', path: '/student/books', icon: BookOpen },
      { 
        name: 'Search', 
        path: '/student/books?focus=search', 
        icon: Search,
        isActiveCustom: location.search.includes('q=') || location.search.includes('focus=search')
      },
      { name: 'Borrow', path: '/student/books', icon: BookmarkPlus },
      { name: 'Return', path: '/student/borrowed', icon: RotateCcw },
      { name: 'QR Scanner', path: '/student/scanner', icon: QrCode },
      { name: 'Notifications', path: '/student/notifications', icon: Bell, badge: unreadCount },
      { name: 'Profile', path: '/student/profile', icon: User },
    ];
  };

  const navItems = getNavItems();

  return (
    <div className="w-full bg-slate-950/80 border-b border-slate-800/80 sticky top-16 z-30 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
        {/* Left: Back Button */}
        <div className="shrink-0 flex items-center gap-2">
          <BackButton />
        </div>

        {/* Center: Global Navigation Strip Items */}
        <nav className="flex items-center gap-1.5 sm:gap-2 shrink-0 py-0.5 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isCustomActive = item.isActiveCustom;

            return (
              <NavLink
                key={item.name + item.path}
                to={item.path}
                className={({ isActive }) => {
                  const activeState = isCustomActive !== undefined ? isCustomActive : isActive;
                  return `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 shrink-0 relative ${
                    activeState
                      ? 'bg-gradient-to-r from-brand-600/30 to-ai-600/30 text-brand-300 border border-brand-500/40 shadow-sm shadow-brand-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                  }`;
                }}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">{item.name}</span>

                {/* Badge for Notifications */}
                {item.badge > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[10px] font-extrabold rounded-full animate-pulse shadow-sm">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Right: Quick Action Pill */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate(role === 'student' ? '/student/recommendations' : '/librarian/ai-insights')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-ai-500/10 text-ai-300 border border-ai-500/30 hover:bg-ai-500/20 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-ai-400" />
            <span>AI Recommendations</span>
          </button>
        </div>
      </div>
    </div>
  );
}
