import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import {
  BookOpen, Sparkles, Shield, BookMarked, UserCheck, Lock, Mail, ArrowRight,
  KeyRound, HelpCircle, CheckCircle2, X, Eye, EyeOff, UserPlus, User, Building2,
  GraduationCap
} from 'lucide-react';
import GoogleDemoAuthModal from '../../components/GoogleDemoAuthModal';

export default function Login() {
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('arun@student.edu');
  const [password, setPassword] = useState('student123');
  const [role, setRole] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // Forgot Password Modal States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Verify, 2: Reset, 3: Success
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [verifiedUserMessage, setVerifiedUserMessage] = useState('');

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === 'student') {
      setEmail('arun@student.edu');
      setPassword('student123');
    } else if (selectedRole === 'librarian') {
      setEmail('librarian@library.com');
      setPassword('librarian123');
    } else if (selectedRole === 'admin') {
      setEmail('admin@library.com');
      setPassword('admin123');
    } else if (selectedRole === 'custom') {
      setEmail('');
      setPassword('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      error('Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    try {
      // Role is optional for custom login (only pass if selecting specific role)
      const roleToPass = role === 'custom' ? undefined : role;
      const user = await login(email.trim().toLowerCase(), password, roleToPass);
      success(`Welcome, ${user.name}!`);

      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'librarian') {
        navigate('/librarian/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      console.error('[Login Error Detail]', err);
      let msg = 'Incorrect email or password.';
      if (err.response?.data?.detail) {
        msg = err.response.data.detail;
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        msg = `Cannot connect to server at ${host}:8000. Ensure the library service is running.`;
      }
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Handlers
  const handleVerifyIdentifier = async (e) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      error('Please enter your registered email or student ID.');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await api.post('/auth/forgot-password/verify', {
        email_or_roll: forgotIdentifier.trim()
      });
      setVerifiedUserMessage(res.data.message);
      success(res.data.message);
      setForgotStep(2);
    } catch (err) {
      error(err.response?.data?.detail || 'Account verification failed.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      error('Password must contain at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      error('Passwords do not match.');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await api.post('/auth/forgot-password/reset', {
        email_or_roll: forgotIdentifier.trim(),
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      success(res.data.message);
      setForgotStep(3);
    } catch (err) {
      error(err.response?.data?.detail || 'Password reset failed.');
    } finally {
      setForgotLoading(false);
    }
  };

  const resetForgotModal = () => {
    setShowForgotModal(false);
    setForgotStep(1);
    setForgotIdentifier('');
    setNewPassword('');
    setConfirmPassword('');
    setVerifiedUserMessage('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      {/* Background Ambience Elements */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-ai-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg rounded-3xl glass-panel border border-slate-800/80 shadow-2xl p-8 sm:p-10 z-10 animate-fade-in space-y-6">
        {/* Professional College Central Library Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-500 to-ai-500 text-white shadow-xl shadow-brand-500/25 mb-1">
            <BookOpen className="w-7 h-7" />
          </div>

          <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
            Welcome to the College Central Library
          </h1>
          <p className="text-sm font-bold text-brand-300">
            Access. Explore. Learn.
          </p>

          <div className="py-2.5 px-4 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs text-slate-300 flex items-center justify-center gap-2 shadow-inner">
            <Building2 className="w-4 h-4 text-brand-400 shrink-0" />
            <span>Access books, resources, and library services in one place.</span>
          </div>
        </div>

        {/* 🌐 Continue with Google */}
        <button
          type="button"
          onClick={() => setShowGoogleModal(true)}
          className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2.5 border border-slate-200 group hover:scale-[1.01]"
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

        <div className="flex items-center gap-3">
          <div className="h-px bg-slate-800 flex-1" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Or Login with Password</span>
          <div className="h-px bg-slate-800 flex-1" />
        </div>

        {/* Select Account Type */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] px-1 text-slate-400 font-semibold">
            <span>Select Account Type:</span>
            {role === 'custom' && <span className="text-emerald-400 font-bold">Custom Login</span>}
          </div>

          <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-[11px]">
            <button
              type="button"
              onClick={() => handleRoleSelect('student')}
              className={`py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1 ${
                role === 'student'
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Student</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('librarian')}
              className={`py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1 ${
                role === 'librarian'
                  ? 'bg-ai-500 text-white shadow-md shadow-ai-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookMarked className="w-3.5 h-3.5" />
              <span>Staff</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('admin')}
              className={`py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1 ${
                role === 'admin'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('custom')}
              className={`py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1 ${
                role === 'custom'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>My Account</span>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. yourname@college.edu or name@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-brand-500 text-xs transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-300 font-semibold">Password</label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-[11px] text-brand-400 hover:text-brand-300 font-medium hover:underline flex items-center gap-1 transition-colors"
              >
                <HelpCircle className="w-3 h-3" />
                <span>Forgot Password?</span>
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-brand-500 text-xs transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 via-indigo-500 to-ai-600 hover:from-brand-400 hover:to-ai-500 text-white font-bold text-xs transition-all shadow-xl shadow-brand-500/25 flex items-center justify-center gap-2 mt-2"
          >
            <span>{loading ? 'Authenticating...' : '🔑 Login to Library'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Don't Have an Account? Sign Up strip */}
        <div className="pt-4 border-t border-slate-800/80 text-center space-y-2">
          <p className="text-xs text-slate-400">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-bold text-brand-400 hover:text-brand-300 underline underline-offset-2 inline-flex items-center gap-1 ml-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </Link>
          </p>
          <p className="text-[10px] text-slate-500">
            College Central Library Management System • Campus Access
          </p>
        </div>
      </div>

      {/* 🌐 Google Institutional Sign-In Modal */}
      {showGoogleModal && (
        <GoogleDemoAuthModal
          isOpen={showGoogleModal}
          onClose={() => setShowGoogleModal(false)}
        />
      )}

      {/* 🔐 Interactive Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-3xl glass-panel border border-slate-700 bg-slate-900/95 shadow-2xl p-6 relative">
            <button
              onClick={resetForgotModal}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Step 1: Verify Email / Roll */}
            {forgotStep === 1 && (
              <form onSubmit={handleVerifyIdentifier} className="space-y-4 text-xs">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-white">Reset Account Password</h3>
                    <p className="text-slate-400 text-[11px]">Step 1 of 2: Verify your registered identity</p>
                  </div>
                </div>

                <p className="text-slate-300 leading-relaxed">
                  Enter your registered college email or Student ID to verify your account:
                </p>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Registered Email or Student ID</label>
                  <input
                    type="text"
                    required
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    placeholder="e.g. arun@student.edu or 24CSE001 or name@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={resetForgotModal}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-bold transition-all shadow-md shadow-brand-500/20"
                  >
                    {forgotLoading ? 'Verifying...' : 'Verify Account →'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Set New Password */}
            {forgotStep === 2 && (
              <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-white">Create New Password</h3>
                    <p className="text-slate-400 text-[11px]">Step 2 of 2: Set strong password (min 8 characters)</p>
                  </div>
                </div>

                {verifiedUserMessage && (
                  <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[11px]">
                    ✅ {verifiedUserMessage}
                  </div>
                )}

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">New Password (Min 8 Chars)</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md shadow-emerald-600/20"
                  >
                    {forgotLoading ? 'Updating...' : 'Save & Update Password'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Success Confirmation */}
            {forgotStep === 3 && (
              <div className="text-center space-y-4 py-4 text-xs">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-white">Password Updated Successfully</h3>
                <p className="text-slate-400">
                  Your credentials have been securely updated. You can now log in immediately.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    resetForgotModal();
                    if (forgotIdentifier.includes('@')) {
                      setEmail(forgotIdentifier);
                    }
                    setPassword('');
                  }}
                  className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-bold transition-all"
                >
                  Return to Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
