import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Users, Search, Shield, UserCheck, UserX, Trash2, Edit3, Check } from 'lucide-react';
import BackButton from '../../components/BackButton';

export default function UserManagement() {
  const { success, error } = useToast();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', {
        params: { role_filter: roleFilter || undefined },
      });
      setUsers(res.data || []);
    } catch (err) {
      error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleToggleActive = async (user) => {
    try {
      await api.put(`/admin/users/${user.id}`, {
        is_active: !user.is_active,
      });
      success(`User "${user.name}" is now ${!user.is_active ? 'Active' : 'Deactivated'}.`);
      fetchUsers();
    } catch (err) {
      error('Failed to update user status.');
    }
  };

  const handleChangeRole = async (user, newRole) => {
    try {
      await api.put(`/admin/users/${user.id}`, { role: newRole });
      success(`Role updated to ${newRole} for ${user.name}.`);
      fetchUsers();
    } catch (err) {
      error('Failed to update role.');
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Are you sure you want to delete user "${user.name}"?`)) return;
    try {
      await api.delete(`/admin/users/${user.id}`);
      success(`User "${user.name}" removed from system.`);
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Cannot delete user with active borrowed books.';
      error(msg);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton label="Back" fallback="/admin/dashboard" />
          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white">Campus User Accounts</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Manage student registrations, assign permissions, and control portal access.
            </p>
          </div>
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-2xl border border-slate-800 self-start sm:self-auto text-xs">
          {['', 'student', 'librarian', 'admin'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                roleFilter === r
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {r === '' ? 'All Roles' : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="p-4 rounded-2xl glass-panel border border-slate-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, email, department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
        />
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="p-16 text-center text-slate-400">Loading user accounts...</div>
      ) : (
        <div className="rounded-2xl glass-panel border border-slate-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">User Name & Email</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Department & Year</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-500 to-ai-500 flex items-center justify-center font-bold text-xs text-white shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div>{u.name}</div>
                          <span className="text-[11px] text-slate-400 font-normal">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeRole(u, e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 text-xs font-semibold focus:outline-none focus:border-brand-500"
                      >
                        <option value="student">Student</option>
                        <option value="librarian">Librarian</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <div>{u.department || '—'}</div>
                      <span className="text-[10px] text-slate-500">{u.year}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleActive(u)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                          u.is_active
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {u.is_active ? 'Active Account' : 'Deactivated'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(u)}
                        title="Delete User"
                        className="p-1.5 bg-rose-950/40 hover:bg-rose-900 text-rose-300 rounded-lg border border-rose-500/30 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
