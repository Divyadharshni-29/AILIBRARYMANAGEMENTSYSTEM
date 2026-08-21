import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  MapPin, Layers, Building2, Plus, Edit, Trash2, CheckCircle2,
  X, RefreshCw, Sparkles, Compass
} from 'lucide-react';
import BackButton from '../../components/BackButton';

export default function LocationManagement() {
  const { success, error } = useToast();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState('');

  // Add/Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingLoc, setEditingLoc] = useState(null);
  const [modalForm, setModalForm] = useState({
    building: 'Main Library Building',
    floor: '1st Floor',
    section: '',
    shelf: '',
    rack: '',
    description: ''
  });
  const [saving, setSaving] = useState(false);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/locations', {
        params: { floor: selectedFloor || undefined }
      });
      setLocations(res.data || []);
    } catch (err) {
      error('Failed to load library locations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [selectedFloor]);

  const handleOpenAdd = () => {
    setEditingLoc(null);
    setModalForm({
      building: 'Main Library Building',
      floor: selectedFloor || '1st Floor',
      section: '',
      shelf: 'Shelf A',
      rack: 'Rack A-01',
      description: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (loc) => {
    setEditingLoc(loc);
    setModalForm({
      building: loc.building,
      floor: loc.floor,
      section: loc.section,
      shelf: loc.shelf,
      rack: loc.rack,
      description: loc.description || ''
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!modalForm.section.trim() || !modalForm.shelf.trim() || !modalForm.rack.trim()) {
      error('Please complete all required fields (Section, Shelf, Rack).');
      return;
    }
    setSaving(true);
    try {
      if (editingLoc) {
        await api.put(`/locations/${editingLoc.id}`, modalForm);
        success(`Location "${modalForm.rack}" updated successfully!`);
      } else {
        await api.post('/locations', modalForm);
        success(`New location "${modalForm.rack}" added successfully!`);
      }
      setShowModal(false);
      fetchLocations();
    } catch (err) {
      error(err.response?.data?.detail || 'Failed to save location.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, rackName) => {
    if (!window.confirm(`Are you sure you want to remove location "${rackName}"?`)) return;
    try {
      await api.delete(`/locations/${id}`);
      success(`Location "${rackName}" removed.`);
      fetchLocations();
    } catch (err) {
      error('Failed to delete location.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <BackButton label="Back to Dashboard" fallback="/librarian/dashboard" />
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>📍 College Library Physical Layout Management</span>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-brand-500 to-ai-600 hover:from-brand-400 hover:to-ai-500 text-white rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Library Location</span>
        </button>
      </div>

      {/* Hero Overview */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-800/80 shadow-xl flex items-center justify-between gap-6 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-brand-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4 text-ai-400" />
            <span>Interactive Space & Rack Configuration</span>
          </div>
          <h1 className="font-display font-black text-2xl text-white">
            Library Floors, Sections & Racks Editor
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Customize physical book storage locations across library floors without editing source code.
          </p>
        </div>

        {/* Floor Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs">
          {['', 'Ground Floor', '1st Floor', '2nd Floor', '3rd Floor'].map((f) => (
            <button
              key={f}
              onClick={() => setSelectedFloor(f)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedFloor === f
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {f ? f.replace(' Floor', 'F') : 'All Floors'}
            </button>
          ))}
        </div>
      </div>

      {/* Locations Table */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-brand-400" />
          <p className="text-sm font-semibold">Loading physical layout...</p>
        </div>
      ) : (
        <div className="rounded-3xl glass-panel border border-slate-800/80 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Building & Floor</th>
                  <th className="px-6 py-4">Departmental Section / Wing</th>
                  <th className="px-6 py-4">Shelf</th>
                  <th className="px-6 py-4">Rack Code</th>
                  <th className="px-6 py-4">Description / Notes</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {locations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-brand-400 shrink-0" />
                        <div>
                          <p className="text-white font-bold">{loc.building}</p>
                          <span className="text-[10px] text-brand-300 font-semibold">{loc.floor}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-200 font-bold">{loc.section}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 font-mono text-amber-300 font-bold">
                        {loc.shelf}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-lg bg-brand-950/60 border border-brand-500/40 font-mono text-brand-300 font-black">
                        {loc.rack}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 max-w-xs truncate">
                      {loc.description || '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(loc)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Edit Location"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(loc.id, loc.rack)}
                          className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-200 border border-rose-500/30 transition-colors"
                          title="Delete Location"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl glass-panel border border-slate-700 bg-slate-900/95 shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-display font-bold text-lg text-white mb-1">
              {editingLoc ? 'Edit Library Location' : 'Add New Library Location'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">Set building, floor, section, and rack codes.</p>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Building</label>
                <input
                  type="text"
                  required
                  value={modalForm.building}
                  onChange={(e) => setModalForm(p => ({ ...p, building: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Floor</label>
                <select
                  value={modalForm.floor}
                  onChange={(e) => setModalForm(p => ({ ...p, floor: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  <option value="Ground Floor">Ground Floor</option>
                  <option value="1st Floor">1st Floor</option>
                  <option value="2nd Floor">2nd Floor</option>
                  <option value="3rd Floor">3rd Floor</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Section / Wing *</label>
                <input
                  type="text"
                  required
                  value={modalForm.section}
                  onChange={(e) => setModalForm(p => ({ ...p, section: e.target.value }))}
                  placeholder="e.g. Computer Science & AI Wing"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Shelf *</label>
                  <input
                    type="text"
                    required
                    value={modalForm.shelf}
                    onChange={(e) => setModalForm(p => ({ ...p, shelf: e.target.value }))}
                    placeholder="Shelf CS-A"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Rack *</label>
                  <input
                    type="text"
                    required
                    value={modalForm.rack}
                    onChange={(e) => setModalForm(p => ({ ...p, rack: e.target.value }))}
                    placeholder="Rack CS-01"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description / Notes</label>
                <input
                  type="text"
                  value={modalForm.description}
                  onChange={(e) => setModalForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="e.g. AI & ML Deep Learning Textbooks"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-bold shadow-md shadow-brand-500/25"
                >
                  {saving ? 'Saving...' : 'Save Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
