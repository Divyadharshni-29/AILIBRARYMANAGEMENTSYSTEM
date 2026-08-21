import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import {
  BookOpen, User, Mail, Lock, Building2, GraduationCap, ArrowRight,
  Phone, Hash, CheckCircle2, Sparkles, AlertCircle, Eye, EyeOff
} from 'lucide-react';
import GoogleDemoAuthModal from '../../components/GoogleDemoAuthModal';

export default function Register() {
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    student_id: '',
    email: '',
    phone: '',
    department: 'Computer Science',
    year: '3rd Year',
    password: '',
    confirm_password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      error('Please enter your full name.');
      return;
    }

    if (!formData.email.trim() || !validateEmail(formData.email.trim())) {
      error('Please enter a valid email address.');
      return;
    }

    if (formData.password.length < 8) {
      error('Password must contain at least 8 characters.');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        student_id: formData.student_id.trim() || undefined,
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || undefined,
        department: formData.department,
        year: formData.year,
        password: formData.password,
        confirm_password: formData.confirm_password,
        role: 'student'
      };

      const res = await api.post('/auth/register', payload);
      setRegisteredUser(res.data.user);
      success('🎉 Account Created Successfully! Welcome to Our Book World! 📚✨');
    } catch (err) {
      console.error('[Registration Error]', err);
      let msg = 'Failed to create account. Please check your details.';
      if (err.response?.data?.detail) {
        msg = err.response.data.detail;
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        msg = `Cannot connect to server at ${host}:8000. Ensure FastAPI backend is running.`;
      }
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      {/* Background Ambience Glows */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-ai-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl rounded-3xl glass-panel border border-slate-800/80 shadow-2xl p-8 sm:p-10 z-10 animate-fade-in">
        {/* If Registered Successfully -> Show Celebration Screen */}
        {registeredUser ? (
          <div className="text-center space-y-6 py-4 animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30 shadow-xl shadow-emerald-500/10 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30 inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                College Library Portal
              </span>
              <h2 className="font-display font-black text-2xl sm:text-3xl text-white">
                🎉 Account Created Successfully!
              </h2>
              <p className="text-base text-brand-300 font-bold">
                Welcome to Our Book World! 📚✨
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                "Discover. Read. Learn. Grow." Your personal college student account is ready.
              </p>
            </div>

            {/* User Details Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-left space-y-2 max-w-md mx-auto text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Student Name</span>
                <span className="font-bold text-white">{registeredUser.name}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Registered Email</span>
                <span className="font-mono font-bold text-brand-300">{registeredUser.email}</span>
              </div>
              {registeredUser.student_id && (
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Student ID / Roll No</span>
                  <span className="font-mono font-bold text-emerald-300">{registeredUser.student_id}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Department</span>
                <span className="font-semibold text-slate-300">{registeredUser.department} • {registeredUser.year}</span>
              </div>
            </div>

            {/* Go to Login Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full max-w-md mx-auto py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 via-indigo-500 to-ai-600 hover:from-brand-400 hover:to-ai-500 text-white font-bold text-sm transition-all shadow-xl shadow-brand-500/25 flex items-center justify-center gap-2"
              >
                <span>Go to Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Registration Form */
          <>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-500 to-ai-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-display font-black text-xl text-white">Create Student Account</h1>
                <p className="text-xs text-slate-400">Register with your own email to access 890+ college books</p>
              </div>
            </div>

            {/* 🌐 Continue with Google Button */}
            <button
              type="button"
              onClick={() => setShowGoogleModal(true)}
              className="w-full py-3 px-4 mb-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2.5 border border-slate-200 group hover:scale-[1.01]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-px bg-slate-800 flex-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Or Register with Email Form</span>
              <div className="h-px bg-slate-800 flex-1" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Row 1: Full Name & Student ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Divya Sharma"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Student ID / College ID</label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      name="student_id"
                      value={formData.student_id}
                      onChange={handleChange}
                      placeholder="e.g. 24CSE001"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email Address (Gmail, Outlook, College) *</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="myname@gmail.com"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Phone Number (Optional)</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Department & Academic Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Department</label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                    >
                      <option value="Computer Science">Computer Science & Engineering</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Artificial Intelligence & DS">Artificial Intelligence & Data Science</option>
                      <option value="Software Engineering">Software Engineering</option>
                      <option value="Electronics & Communication">Electronics & Communication (ECE)</option>
                      <option value="Business Administration">Business Administration (MBA / BBA)</option>
                      <option value="Tamil Literature">Tamil Literature & Heritage</option>
                      <option value="Mathematics & Science">Mathematics & Pure Sciences</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Year of Study</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                    >
                      <option value="1st Year">1st Year (Fresher)</option>
                      <option value="2nd Year">2nd Year (Sophomore)</option>
                      <option value="3rd Year">3rd Year (Junior)</option>
                      <option value="4th Year">4th Year (Senior / Final)</option>
                      <option value="Postgraduate">Postgraduate (PG)</option>
                      <option value="PhD Scholar">PhD Research Scholar</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Row 4: Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Password (Min 8 Chars) *</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      minLength={8}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirm_password"
                      required
                      minLength={8}
                      value={formData.confirm_password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 via-indigo-500 to-ai-600 hover:from-brand-400 hover:to-ai-500 text-white font-bold text-xs transition-all shadow-xl shadow-brand-500/25 flex items-center justify-center gap-2 mt-4"
              >
                <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-400 border-t border-slate-800/80 pt-4">
              <span>Already have a library account? </span>
              <Link to="/login" className="font-bold text-brand-400 hover:text-brand-300 underline underline-offset-2">
                Sign In
              </Link>
            </div>
          </>
        )}
      </div>

      {/* 🌐 Google Demo Auth Modal */}
      {showGoogleModal && (
        <GoogleDemoAuthModal
          isOpen={showGoogleModal}
          onClose={() => setShowGoogleModal(false)}
        />
      )}
    </div>
  );
}
