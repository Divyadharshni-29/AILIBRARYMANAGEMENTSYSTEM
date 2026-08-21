import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Shield, Plus, Mail, Lock, User, Check, X, BookMarked } from 'lucide-react';
import BackButton from '../../components/BackButton';

export default function LibrarianManagement() {
  const { success, error } = useToast();
  const [librarians, setLibrarians] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: 'Library Operations',
  });

  const fetchLibrarians = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users?role_filter=librarian');
      setLibrarians(res.data || []);
    } catch (err) {
      error('Failed to load librarians.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibrarians();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/librarians', formData);
      success(`Librarian account created for ${formData.name}!`);
      setShowAddModal(false);
      setFormData({ name: '', email: '', password: '', department: 'Library Operations' });
      fetchLibrarians();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to create librarian account.';
      error(msg);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton label="Back" fallback="/admin/dashboard" />
          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white">Library Staff & Management</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Authorize librarian staff members to oversee borrowing circulation and book catalog inventory.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Librarian</span>
        </button>
      </div>

      {/* Librarians Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-400">Loading library staff...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {librarians.map((lib) => (
            <div key={lib.id} className="p-5 rounded-2xl glass-panel border border-amber-500/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-base border border-amber-500/30">
                    {lib.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">{lib.name}</h3>
                    <span className="text-xs text-amber-300 font-semibold flex items-center gap-1">
                      <BookMarked className="w-3 h-3" /> Library Staff
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-300 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="font-medium text-white">{lib.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Department:</span>
                    <span className="font-medium text-white">{lib.department || 'Library Operations'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className="text-emerald-400 font-bold">Active Staff</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500">
                Staff ID: LIB-{String(lib.id).padStart(4, '0')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md glass-panel border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-display font-bold text-xl text-white mb-1">Create Librarian Account</h3>
            <p className="text-xs text-slate-400 mb-5">
              Staff members will receive full catalog management and circulation permissions.
            </p>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Marcus Vance"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Staff Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="marcus@library.com"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Assigned Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-800 font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
