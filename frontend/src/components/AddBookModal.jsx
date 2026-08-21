import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  PlusCircle, BookOpen, User, Hash, Layers, MapPin, Building2,
  Calendar, Copy, Sparkles, X, CheckCircle2, Eye, ArrowLeft, RefreshCw, AlertCircle
} from 'lucide-react';

export default function AddBookModal({ isOpen, onClose, onBookAdded, categories = [] }) {
  if (!isOpen) return null;

  const navigate = useNavigate();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [dbCategories, setDbCategories] = useState(categories);
  const [createdBook, setCreatedBook] = useState(null); // When not null, displays success screen

  const initialFormData = {
    title: '',
    author_name: '',
    category_id: categories.length > 0 ? categories[0].id : 1,
    isbn: '',
    publisher: '',
    publication_year: new Date().getFullYear(),
    language: 'English',
    edition: '1st Edition',
    total_copies: 5,
    description: '',
    building: 'Main Library Building',
    floor: '1st Floor',
    section: 'Computer Science & AI Wing',
    shelf: 'Shelf CS-A',
    rack: 'Rack CS-01',
    keywords: ''
  };

  const [formData, setFormData] = useState(initialFormData);

  // Load categories if not provided
  useEffect(() => {
    if (dbCategories.length === 0) {
      api.get('/categories')
        .then((res) => {
          setDbCategories(res.data || []);
          if (res.data && res.data.length > 0 && !formData.category_id) {
            setFormData(prev => ({ ...prev, category_id: res.data[0].id }));
          }
        })
        .catch(console.error);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'category_id' || name === 'total_copies' || name === 'publication_year'
        ? Number(value)
        : value
    }));
  };

  const handleCategoryChange = (e) => {
    const catId = Number(e.target.value);
    const selectedCat = dbCategories.find(c => c.id === catId);
    let autoFloor = '1st Floor';
    let autoSection = 'General Academic Wing';
    let autoShelf = 'Shelf A';
    let autoRack = 'Rack A-01';

    if (selectedCat) {
      const catName = selectedCat.name;
      if (catName.includes('Tamil')) {
        autoFloor = 'Ground Floor';
        autoSection = 'Tamil Classical & Heritage Wing (தமிழ் செவ்வியல் பிரிவு)';
        autoShelf = 'Shelf TAM-A';
        autoRack = 'Rack TAM-01';
      } else if (catName.includes('Business') || catName.includes('Leadership')) {
        autoFloor = '2nd Floor';
        autoSection = 'Business, Management & Leadership Wing';
        autoShelf = 'Shelf BUS-A';
        autoRack = 'Rack BUS-01';
      } else if (catName.includes('Software') || catName.includes('DevOps') || catName.includes('Cloud')) {
        autoFloor = '1st Floor';
        autoSection = 'Software Engineering & Cloud Architecture Wing';
        autoShelf = 'Shelf SE-A';
        autoRack = 'Rack SE-01';
      } else if (catName.includes('Computer') || catName.includes('AI') || catName.includes('Data')) {
        autoFloor = '1st Floor';
        autoSection = 'Computer Science & AI Wing';
        autoShelf = 'Shelf CS-A';
        autoRack = 'Rack CS-01';
      } else if (catName.includes('Math') || catName.includes('Statistics')) {
        autoFloor = '3rd Floor';
        autoSection = 'Pure & Applied Mathematics Section';
        autoShelf = 'Shelf MATH-A';
        autoRack = 'Rack MATH-01';
      } else if (catName.includes('Science') || catName.includes('Environment')) {
        autoFloor = '3rd Floor';
        autoSection = 'Science & Environmental Studies Section';
        autoShelf = 'Shelf SCI-A';
        autoRack = 'Rack SCI-01';
      }
    }

    setFormData(prev => ({
      ...prev,
      category_id: catId,
      floor: autoFloor,
      section: autoSection,
      shelf: autoShelf,
      rack: autoRack
    }));
  };

  const handleResetForAnother = () => {
    setCreatedBook(null);
    setFormData({
      ...initialFormData,
      category_id: dbCategories.length > 0 ? dbCategories[0].id : 1,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.author_name.trim() || !formData.isbn.trim()) {
      error('Please fill in all required fields (Title, Author, ISBN).');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        shelf_location: `${formData.shelf}, ${formData.rack}`
      };
      const res = await api.post('/books', payload);
      const newBook = res.data;
      setCreatedBook(newBook);
      success(`Book "${newBook.title}" added to library catalog successfully!`);
      if (onBookAdded) onBookAdded(newBook);
    } catch (err) {
      error(err.response?.data?.detail || 'Failed to add new book.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl rounded-3xl glass-panel border border-slate-700 bg-slate-900/95 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center shadow-md shadow-brand-500/10">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-white">➕ Add New Book</h3>
              <p className="text-xs text-slate-400">College Central Library Physical Catalog Registration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content: Form View OR Success View */}
        {createdBook ? (
          /* Success Screen View */
          <div className="p-8 text-center space-y-6 overflow-y-auto animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30 shadow-lg shadow-emerald-500/10 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="font-display font-black text-2xl text-white">
                🎉 Book Added Successfully!
              </h2>
              <p className="text-sm text-brand-300 font-semibold mt-1">
                📚 "The new book has been added to your library successfully!"
              </p>
            </div>

            {/* Created Book Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-2.5 max-w-lg mx-auto">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-bold text-white text-base">{createdBook.title}</h4>
                  <p className="text-xs text-slate-400">by {createdBook.author?.name || 'Unknown Author'}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                  ✅ Available ({createdBook.available_copies} Copies)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
                <div>
                  <span className="text-slate-500 text-[10px] block">ISBN Code</span>
                  <span className="font-mono font-bold text-slate-300">{createdBook.isbn}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">QR Code Identifier</span>
                  <span className="font-mono font-bold text-brand-400">{createdBook.qr_code}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Physical Location</span>
                  <span className="font-mono font-bold text-amber-300">{createdBook.floor} • {createdBook.shelf}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Department / Wing</span>
                  <span className="font-bold text-ai-300 truncate block">{createdBook.section}</span>
                </div>
              </div>
            </div>

            {/* 3 Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(`/student/books/${createdBook.id}`);
                }}
                className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white text-xs font-bold transition-all shadow-lg shadow-brand-500/25 flex items-center gap-1.5"
              >
                <Eye className="w-4 h-4" />
                <span>View Book</span>
              </button>

              <button
                type="button"
                onClick={handleResetForAnother}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/25 flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Another Book</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all border border-slate-700 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Books</span>
              </button>
            </div>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
            {/* Row 1: Title & Author */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Book Title *</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Design Patterns in Practice"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Author Name *</label>
                <input
                  type="text"
                  name="author_name"
                  required
                  value={formData.author_name}
                  onChange={handleChange}
                  placeholder="e.g. Erich Gamma"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Row 2: Category & Language */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Category *</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleCategoryChange}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  {dbCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Language</label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  <option value="English">English</option>
                  <option value="Tamil">தமிழ் (Tamil)</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Sanskrit">Sanskrit</option>
                  <option value="Malayalam">Malayalam</option>
                  <option value="Telugu">Telugu</option>
                </select>
              </div>
            </div>

            {/* Row 3: ISBN, Publisher, Edition, Year, Copies */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">ISBN-10 / 13 *</label>
                <input
                  type="text"
                  name="isbn"
                  required
                  value={formData.isbn}
                  onChange={handleChange}
                  placeholder="978-0132350884"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Publisher</label>
                <input
                  type="text"
                  name="publisher"
                  value={formData.publisher}
                  onChange={handleChange}
                  placeholder="Pearson Education"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Total Copies *</label>
                <input
                  type="number"
                  name="total_copies"
                  min={1}
                  max={50}
                  required
                  value={formData.total_copies}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Edition</label>
                <input
                  type="text"
                  name="edition"
                  value={formData.edition}
                  onChange={handleChange}
                  placeholder="2nd Revised Edition"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Publication Year</label>
                <input
                  type="number"
                  name="publication_year"
                  min={1900}
                  max={2030}
                  value={formData.publication_year}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Location Group */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <span className="text-[11px] font-bold text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                Physical College Library Placement
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Floor</label>
                  <select
                    name="floor"
                    value={formData.floor}
                    onChange={handleChange}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs"
                  >
                    <option value="Ground Floor">Ground Floor (Tamil & Heritage)</option>
                    <option value="1st Floor">1st Floor (Computer Science & SE)</option>
                    <option value="2nd Floor">2nd Floor (Business & Indian Lit)</option>
                    <option value="3rd Floor">3rd Floor (Math, Science & Career)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Shelf</label>
                  <input
                    type="text"
                    name="shelf"
                    value={formData.shelf}
                    onChange={handleChange}
                    placeholder="Shelf CS-A"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Rack</label>
                  <input
                    type="text"
                    name="rack"
                    value={formData.rack}
                    onChange={handleChange}
                    placeholder="Rack CS-01"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Area / Section</label>
                <input
                  type="text"
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  placeholder="Computer Science & AI Wing"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Description / Summary</label>
              <textarea
                name="description"
                rows={3}
                required
                value={formData.description}
                onChange={handleChange}
                placeholder="Comprehensive technical and architectural overview for student learning..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Footer Controls */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-brand-500 to-ai-600 hover:from-brand-400 hover:to-ai-500 text-white shadow-lg shadow-brand-500/25 flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{loading ? 'Adding Book...' : 'Add Book'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
