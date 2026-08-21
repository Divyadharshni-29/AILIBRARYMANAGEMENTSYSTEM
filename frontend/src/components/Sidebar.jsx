import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  BookmarkCheck,
  History,
  User,
  BookPlus,
  Users,
  Clock,
  BarChart3,
  TrendingUp,
  Shield,
  Sliders,
  Cpu,
  Layers,
  HelpCircle,
  QrCode,
  CreditCard,
  MapPin
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();
  const role = user?.role || 'student';

  const studentLinks = [
    { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'Browse Books', path: '/student/books', icon: BookOpen },
    { name: 'QR Book Scanner', path: '/student/scanner', icon: QrCode, badge: 'Scan' },
    { name: 'AI Recommendations', path: '/student/recommendations', icon: Sparkles, badge: 'AI' },
    { name: 'Borrowed Books', path: '/student/borrowed', icon: BookmarkCheck },
    { name: 'Pay Fines & Receipts', path: '/student/fines', icon: CreditCard, badge: 'UPI' },
    { name: 'Borrowing History', path: '/student/history', icon: History },
    { name: 'My Profile & AI Taste', path: '/student/profile', icon: User },
  ];

  const librarianLinks = [
    { name: 'Librarian Dashboard', path: '/librarian/dashboard', icon: LayoutDashboard },
    { name: 'QR & ISBN Circulation', path: '/librarian/scanner', icon: QrCode, badge: 'Desk' },
    { name: 'Book Management', path: '/librarian/books', icon: BookPlus },
    { name: 'Physical Locations', path: '/librarian/locations', icon: MapPin, badge: 'Map' },
    { name: 'All Transactions', path: '/librarian/transactions', icon: History },
    { name: 'Overdue & Fines', path: '/librarian/overdue', icon: Clock, badge: 'Action' },
    { name: 'Fine Collection & UPI', path: '/librarian/fines', icon: CreditCard, badge: 'Revenue' },
    { name: 'Library Analytics', path: '/librarian/analytics', icon: BarChart3 },
    { name: 'AI Demand Predictions', path: '/librarian/ai-insights', icon: TrendingUp, badge: 'ML' },
  ];

  const adminLinks = [
    { name: 'Admin Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'QR & ISBN Circulation', path: '/admin/scanner', icon: QrCode, badge: 'Desk' },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Librarians', path: '/admin/librarians', icon: Shield },
    { name: 'Physical Locations', path: '/admin/locations', icon: MapPin, badge: 'Map' },
    { name: 'Book Categories', path: '/admin/categories', icon: Layers },
    { name: 'Fine Collections & UPI', path: '/admin/fines', icon: CreditCard, badge: 'Revenue' },
    { name: 'AI Model Studio', path: '/admin/ai-evaluation', icon: Cpu, badge: 'Bench' },
  ];

  const currentLinks = role === 'admin' ? adminLinks : role === 'librarian' ? librarianLinks : studentLinks;

  return (
    <aside className="w-64 shrink-0 glass-panel border-r border-slate-800/80 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            {role.toUpperCase()} PORTAL
          </p>
          <nav className="space-y-1">
            {currentLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-brand-600/20 to-ai-600/20 text-brand-300 border border-brand-500/30 shadow-lg shadow-brand-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-ai-500/20 text-ai-300 border border-ai-500/30">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* AI System Badge Footer */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/80">
        <div className="flex items-center gap-2 text-xs font-semibold text-ai-300 mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Hybrid AI Recommender</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          TF-IDF & SVD Matrix Collaborative Filtering live on campus database.
        </p>
      </div>
    </aside>
  );
}
