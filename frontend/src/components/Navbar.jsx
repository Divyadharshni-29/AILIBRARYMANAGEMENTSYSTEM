import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Search, Sparkles, LogOut, User as UserIcon, Bell, Shield, BookMarked } from 'lucide-react';

import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (user?.role === 'student') {
        navigate(`/student/books?q=${encodeURIComponent(searchQuery.trim())}`);
      } else {
        navigate(`/librarian/books?search=${encodeURIComponent(searchQuery.trim())}`);
      }
    }
  };

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'admin':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1"><Shield className="w-3 h-3" /> Admin</span>;
      case 'librarian':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1"><BookMarked className="w-3 h-3" /> Librarian</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Student</span>;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-ai-500 p-0.5 shadow-lg group-hover:shadow-brand-500/25 transition-all duration-300">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-brand-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-display font-bold text-lg text-white">
              <span>AI</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-ai-400">Library</span>
            </div>
            <p className="text-[10px] text-slate-400 -mt-1 tracking-wider uppercase font-semibold">Intelligent System</p>
          </div>
        </Link>

        {/* Global Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-lg hidden md:block">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search books, authors, or natural language (e.g. 'machine learning with python')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-24 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-medium bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
              NLP AI
            </span>
          </div>
        </form>

        {/* Right Menu Controls */}
        <div className="flex items-center gap-3">
          {getRoleBadge()}

          {/* Notification Bell with live unread counter & dropdown */}
          <NotificationBell />

          {/* User profile dropdown info */}
          <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-200 leading-none">{user?.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{user?.department || user?.email}</p>
            </div>

            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-500 to-ai-600 flex items-center justify-center font-bold text-sm text-white shadow-md">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>

            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
