import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Globe, Sparkles, User, Mail, Building2, CheckCircle2, ArrowRight, X,
  Shield, Check, UserCheck, GraduationCap
} from 'lucide-react';

export default function GoogleDemoAuthModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const { googleDemoLogin } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('Divya Sharma');
  const [email, setEmail] = useState('divya@example.com');
  const [department, setDepartment] = useState('Computer Science');
  const [year, setYear] = useState('3rd Year');

  // Institution accounts
  const savedAccounts = [
    { name: 'Divya Sharma', email: 'divya@example.com', dept: 'Computer Science', year: '3rd Year' },
    { name: 'Priya Sundaram', email: 'priya.s@gmail.com', dept: 'Artificial Intelligence & DS', year: '2nd Year' },
    { name: 'Karthik Raja', email: 'karthik.r@gmail.com', dept: 'Software Engineering', year: '4th Year' },
  ];

  const handleSelectAccount = (acc) => {
    setName(acc.name);
    setEmail(acc.email);
    setDepartment(acc.dept);
    setYear(acc.year);
  };

  const handleGoogleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      error('Please enter your name and email.');
      return;
    }

    setLoading(true);
    try {
      const user = await googleDemoLogin({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        department,
        year,
      });

      success(`Welcome, ${user.name}!`);
      onClose();
      navigate('/student/dashboard');
    } catch (err) {
      console.error('[Google Auth Error]', err);
      let msg = 'Authentication failed. Please check network connection.';
      if (err.response?.data?.detail) {
        msg = err.response.data.detail;
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        msg = `Cannot connect to library server. Ensure the backend is running on ${host}:8000.`;
      }
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md rounded-3xl glass-panel border border-slate-700 bg-slate-900/95 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-slate-900 flex items-center justify-center font-black shadow-md shadow-white/10">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-display font-black text-base text-white">
                Continue with Google
              </h3>
              <p className="text-[11px] text-slate-400">Institutional Single Sign-On Access</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleGoogleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="p-3 rounded-2xl bg-brand-950/40 border border-brand-500/30 text-brand-300 text-[11px] leading-relaxed">
            🎓 <strong>College Single Sign-On:</strong> Select an account or enter your name and email to proceed to your student dashboard.
          </div>

          {/* Quick Selection Buttons */}
          <div className="space-y-1.5">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
              Select Account:
            </span>
            <div className="grid grid-cols-1 gap-2">
              {savedAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleSelectAccount(acc)}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    email === acc.email
                      ? 'bg-brand-500/20 border-brand-500 text-white font-bold shadow-md shadow-brand-500/10'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-brand-400">
                      {acc.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{acc.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{acc.email}</p>
                    </div>
                  </div>
                  {email === acc.email && <Check className="w-4 h-4 text-brand-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Or Custom Input */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Divya Sharma"
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-brand-500 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. divya@gmail.com"
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-brand-500 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-brand-500 text-xs"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Artificial Intelligence & DS">AI & Data Science</option>
                  <option value="Software Engineering">Software Engineering</option>
                  <option value="Business Administration">Business (MBA)</option>
                  <option value="Tamil Literature">Tamil Literature</option>
                  <option value="Mathematics">Mathematics</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Year of Study</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-brand-500 text-xs"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Postgraduate">Postgraduate</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs transition-all shadow-xl flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Authenticating...' : `Continue to Library`}</span>
              <ArrowRight className="w-4 h-4 text-slate-900" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
