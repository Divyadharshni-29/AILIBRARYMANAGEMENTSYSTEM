import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  BookPlus,
  Edit2,
  Trash2,
  Search,
  Users,
  Eye,
  X,
  Check,
  Plus,
  BookOpen,
  QrCode,
  MapPin,
  Barcode,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import QRCodeModal from '../../components/QRCodeModal';
import BackButton from '../../components/BackButton';

export default function BookManagement() {
  const { success, error } = useToast();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const [modalMode, setModalMode] = useState(null); // 'add' or 'edit'
  const [currentBook, setCurrentBook] = useState(null);
  const [selectedBookForQR, setSelectedBookForQR] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    author_name: '',
    category_id: '',
    isbn: '',
    shelf_location: 'Rack A-01',
    description: '',
    publisher: '',
    publication_year: 2024,
    total_copies: 5,
    cover_image: '',
    keywords: '',
  });

  const loadBooks = async () => {
    setLoading(true);
    try {
      const [bRes, cRes] = await Promise.all([
        api.get(`/books?limit=300${search ? `&search=${encodeURIComponent(search)}` : ''}`),
        api.get('/categories'),
      ]);
      setBooks(bRes.data || []);
      setCategories(cRes.data || []);
      if (cRes.data.length > 0 && !formData.category_id) {
        setFormData((prev) => ({ ...prev, category_id: cRes.data[0].id }));
      }
    } catch (err) {
      error('Failed to load books.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
    setCurrentPage(1);
  }, [search]);

  // Real-time ISBN-10 & ISBN-13 format validation
  const validateISBN = (str) => {
    if (!str) return false;
    const clean = str.replace(/[^0-9X]/gi, '').toUpperCase();
    if (clean.length === 10) {
      let total = 0;
      for (let i = 0; i < 9; i++) {
        if (isNaN(parseInt(clean[i]))) return false;
        total += parseInt(clean[i]) * (10 - i);
      }
      const check = clean[9] === 'X' ? 10 : parseInt(clean[9]);
      if (isNaN(check)) return false;
      total += check;
      return total % 11 === 0;
    } else if (clean.length === 13) {
      if (!clean.startsWith('978') && !clean.startsWith('979')) return false;
      let total = 0;
      for (let i = 0; i < 12; i++) {
        total += parseInt(clean[i]) * (i % 2 === 0 ? 1 : 3);
      }
      const check = (10 - (total % 10)) % 10;
      return check === parseInt(clean[12]);
    }
    return false;
  };

  const handleOpenAdd = () => {
    setModalMode('add');
    setCurrentBook(null);
    setFormData({
      title: '',
      author_name: '',
      category_id: categories[0]?.id || 1,
      isbn: '978-0134685991',
      shelf_location: 'Rack A-01, Shelf 1',
      description: '',
      publisher: 'Academic Press',
      publication_year: 2024,
      total_copies: 5,
      cover_image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80',
      keywords: '',
    });
  };

  const handleOpenEdit = (book) => {
    setModalMode('edit');
    setCurrentBook(book);
    setFormData({
      title: book.title,
      author_name: book.author?.name || '',
      category_id: book.category?.id || 1,
      isbn: book.isbn,
      shelf_location: book.shelf_location || 'Rack A-01',
      description: book.description,
      publisher: book.publisher || '',
      publication_year: book.publication_year || 2023,
      total_copies: book.total_copies,
      cover_image: book.cover_image || '',
      keywords: book.keywords || '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateISBN(formData.isbn)) {
      error('Please enter a valid ISBN-10 or ISBN-13 with correct checksum.');
      return;
    }

    try {
      if (modalMode === 'add') {
        await api.post('/books', {
          ...formData,
          category_id: parseInt(formData.category_id),
          total_copies: parseInt(formData.total_copies),
          publication_year: parseInt(formData.publication_year),
        });
        success(`Book "${formData.title}" added to inventory with QR Code & Shelf Location!`);
      } else {
        await api.put(`/books/${currentBook.id}`, {
          ...formData,
          category_id: parseInt(formData.category_id),
          total_copies: parseInt(formData.total_copies),
          publication_year: parseInt(formData.publication_year),
        });
        success(`Book "${formData.title}" updated successfully!`);
      }
      setModalMode(null);
      loadBooks();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save book.';
      error(msg);
    }
  };

  const handleDelete = async (book) => {
    if (!window.confirm(`Are you sure you want to delete "${book.title}"?`)) return;
    try {
      await api.delete(`/books/${book.id}`);
      success(`Book "${book.title}" deleted.`);
      loadBooks();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Cannot delete book with active loans.';
      error(msg);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton label="Back" fallback="/librarian/dashboard" />
          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white">Book Inventory Management</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Add new titles, edit copies, inspect borrowers, and maintain the campus catalog.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Book Title</span>
        </button>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="p-4 rounded-2xl glass-panel border border-slate-800 flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 flex items-center gap-3 w-full bg-slate-900/60 px-3.5 py-2.5 rounded-xl border border-slate-800">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Filter catalog by title, author, ISBN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
          />
        </div>

        <select
          value={selectedCategoryFilter}
          onChange={(e) => {
            setSelectedCategoryFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500 w-full sm:w-auto"
        >
          <option value="">All Categories ({books.length})</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Filtered & Paginated Calculation */}
      {(() => {
        const filteredBooks = books.filter((b) => {
          if (selectedCategoryFilter && b.category?.name !== selectedCategoryFilter) {
            return false;
          }
          return true;
        });

        const totalPages = Math.max(1, Math.ceil(filteredBooks.length / pageSize));
        const safePage = Math.min(currentPage, totalPages);
        const startIndex = (safePage - 1) * pageSize;
        const paginatedBooks = filteredBooks.slice(startIndex, startIndex + pageSize);

        return loading ? (
          <div className="p-16 text-center text-slate-400">Loading catalog inventory...</div>
        ) : (
          <div className="rounded-2xl glass-panel border border-slate-800 overflow-hidden shadow-2xl space-y-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Book Title & Author</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">ISBN</th>
                    <th className="py-3.5 px-4">Shelf Location</th>
                    <th className="py-3.5 px-4">Copies (Avail / Total)</th>
                    <th className="py-3.5 px-4">Active Borrowers</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {paginatedBooks.length > 0 ? (
                    paginatedBooks.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={b.cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80'}
                              alt={b.title}
                              className="w-8 h-11 object-cover rounded shadow-sm shrink-0"
                            />
                            <div className="max-w-xs">
                              <p className="font-bold text-white truncate">{b.title}</p>
                              <p className="text-[11px] text-slate-400">by {b.author?.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                            {b.category?.name}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-400">{b.isbn}</td>
                        <td className="py-3.5 px-4 font-mono text-amber-300 text-[11px]">
                          <span className="inline-flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            <MapPin className="w-3 h-3 text-amber-400" />
                            <span>{b.shelf_location || 'Rack A-01'}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`font-bold ${b.available_copies > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {b.available_copies}
                          </span>
                          <span className="text-slate-500"> / {b.total_copies}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <Link
                            to={`/librarian/books/${b.id}/borrowers`}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300 bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-500/20"
                          >
                            <Users className="w-3 h-3" />
                            <span>Who Borrowed?</span>
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedBookForQR(b)}
                              title="View / Print QR Code Sticker"
                              className="p-1.5 bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 rounded-lg transition-colors border border-brand-500/30"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(b)}
                              title="Edit Book"
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(b)}
                              title="Delete Book"
                              className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-lg transition-colors border border-rose-500/30"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No books matching current filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="text-slate-400">
                Showing <span className="font-bold text-white">{filteredBooks.length > 0 ? startIndex + 1 : 0}</span> to{' '}
                <span className="font-bold text-white">
                  {Math.min(startIndex + pageSize, filteredBooks.length)}
                </span>{' '}
                of <span className="font-bold text-white">{filteredBooks.length}</span> Books
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                    let pNum = idx + 1;
                    if (totalPages > 5 && safePage > 3) {
                      pNum = safePage - 3 + idx;
                      if (pNum > totalPages) pNum = totalPages - 4 + idx;
                    }
                    return (
                      <button
                        key={pNum}
                        onClick={() => setCurrentPage(pNum)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                          safePage === pNum
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {pNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && <span className="text-slate-500 px-1">... {totalPages}</span>}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add / Edit Book Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-xl glass-panel border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalMode(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-display font-bold text-xl text-white mb-1">
              {modalMode === 'add' ? 'Add New Book Title' : 'Edit Book Information'}
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Fill in book metadata. QR identifiers, rack locations, copies, and TF-IDF feature vectors will be created automatically.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Book Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Author Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.author_name}
                    onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category *</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ISBN Field with Live Validation Indicator */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-medium">ISBN-10 / ISBN-13 *</label>
                    {formData.isbn ? (
                      validateISBN(formData.isbn) ? (
                        <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 font-bold">
                          <CheckCircle className="w-3 h-3" /> Valid
                        </span>
                      ) : (
                        <span className="text-[10px] text-rose-400 flex items-center gap-0.5 font-bold">
                          <AlertCircle className="w-3 h-3" /> Invalid
                        </span>
                      )
                    ) : null}
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 978-0134685991"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    className={`w-full px-3 py-2 bg-slate-900 border rounded-xl text-slate-200 focus:outline-none ${
                      formData.isbn
                        ? validateISBN(formData.isbn)
                          ? 'border-emerald-500/50 focus:border-emerald-500'
                          : 'border-rose-500/50 focus:border-rose-500'
                        : 'border-slate-800 focus:border-brand-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Shelf / Rack Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rack B-02, Shelf 3"
                    value={formData.shelf_location}
                    onChange={(e) => setFormData({ ...formData, shelf_location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Total Copies *</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    required
                    value={formData.total_copies}
                    onChange={(e) => setFormData({ ...formData, total_copies: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Publication Year</label>
                  <input
                    type="number"
                    min={1900}
                    max={2030}
                    value={formData.publication_year}
                    onChange={(e) => setFormData({ ...formData, publication_year: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Comprehensive description for content-based AI matching..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Publisher</label>
                  <input
                    type="text"
                    value={formData.publisher}
                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Keywords (Comma separated)</label>
                  <input
                    type="text"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    placeholder="ai, python, machine learning"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Cover Image URL</label>
                <input
                  type="url"
                  value={formData.cover_image}
                  onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-800 font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20 transition-all"
                >
                  {modalMode === 'add' ? 'Create Book Title' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Printable Modal */}
      {selectedBookForQR && (
        <QRCodeModal
          book={selectedBookForQR}
          isOpen={!!selectedBookForQR}
          onClose={() => setSelectedBookForQR(null)}
        />
      )}
    </div>
  );
}
