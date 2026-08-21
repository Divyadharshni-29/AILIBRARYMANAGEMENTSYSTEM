import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BackButton({ 
  label = "Back", 
  fallback = null, 
  className = "",
  showBorder = true 
}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleBack = () => {
    // If browser has history in the app, navigate back; otherwise use safe fallback
    if (window.history.length > 1 && window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else if (fallback) {
      navigate(fallback);
    } else {
      // Default fallback by role
      const defaultDashboard = user?.role === 'admin' 
        ? '/admin/dashboard' 
        : user?.role === 'librarian' 
        ? '/librarian/dashboard' 
        : '/student/dashboard';
      navigate(defaultDashboard);
    }
  };

  return (
    <button
      onClick={handleBack}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 transition-all duration-200 shadow-sm group ${
        showBorder ? 'border border-slate-800 hover:border-slate-700' : ''
      } ${className}`}
      title="Go back to previous page"
      aria-label="Go Back"
    >
      <ArrowLeft className="w-4 h-4 text-brand-400 group-hover:-translate-x-0.5 transition-transform duration-200" />
      <span>{label}</span>
    </button>
  );
}
