import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Search, Sparkles, Filter, SlidersHorizontal, BookOpen, CheckCircle2,
  Star, RefreshCw, QrCode, Barcode, MapPin, Layers, PlusCircle, ArrowUpDown,
  ChevronLeft, ChevronRight, Compass, Building2, X, ChevronDown, Check,
  Calendar, RotateCcw, BookMarked
} from 'lucide-react';
import BookCard from '../../components/BookCard';
import BorrowModal from '../../components/BorrowModal';
import RatingModal from '../../components/RatingModal';
import LocationMapModal from '../../components/LocationMapModal';
import AddBookModal from '../../components/AddBookModal';
import BackButton from '../../components/BackButton';
import ActionMotivationBanner from '../../components/ActionMotivationBanner';

export default function BookCatalog() {
  const { user } = useAuth();
  const isStaff = user?.role === 'librarian' || user?.role === 'admin';

  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category_id') || '';

  // Core Search & Filter States
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedAvailability, setSelectedAvailability] = useState('all');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedShelf, setSelectedShelf] = useState('');
  const [selectedRack, setSelectedRack] = useState('');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [sortBy, setSortBy] = useState('title_asc');

  // UI Control States
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Data States
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [selectedBorrowBook, setSelectedBorrowBook] = useState(null);
  const [selectedRateBook, setSelectedRateBook] = useState(null);
  const [selectedLocationBook, setSelectedLocationBook] = useState(null);
  const [showAddBookModal, setShowAddBookModal] = useState(false);

  // Load Categories & Layout Locations from MySQL
  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data || [])).catch(console.error);
    api.get('/locations').then((res) => setLocations(res.data || [])).catch(console.error);
  }, []);

  // Fetch paginated books from backend with combined search, filters and sorting
  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/books/paginated', {
        params: {
          search: query.trim() || undefined,
          category_id: selectedCategory ? Number(selectedCategory) : undefined,
          language: selectedLanguage || undefined,
          availability: selectedAvailability !== 'all' ? selectedAvailability : undefined,
          floor: selectedFloor || undefined,
          section: selectedSection || undefined,
          shelf: selectedShelf || undefined,
          rack: selectedRack || undefined,
          year_from: yearFrom ? Number(yearFrom) : undefined,
          year_to: yearTo ? Number(yearTo) : undefined,
          sort_by: sortBy,
          page: currentPage,
          page_size: pageSize,
        },
      });

      setBooks(res.data.books || []);
      setTotalCount(res.data.total_count || 0);
      setTotalPages(res.data.total_pages || 1);
    } catch (err) {
      console.error('Failed to fetch catalog books:', err);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search / filter changes
  useEffect(() => {
    fetchBooks();
  }, [
    query,
    selectedCategory,
    selectedLanguage,
    selectedAvailability,
    selectedFloor,
    selectedSection,
    selectedShelf,
    selectedRack,
    yearFrom,
    yearTo,
    sortBy,
    currentPage,
    pageSize,
  ]);

  const handleClearFilters = () => {
    setQuery('');
    setSelectedCategory('');
    setSelectedLanguage('');
    setSelectedAvailability('all');
    setSelectedFloor('');
    setSelectedSection('');
    setSelectedShelf('');
    setSelectedRack('');
    setYearFrom('');
    setYearTo('');
    setSortBy('title_asc');
    setCurrentPage(1);
  };

  // Active Filter Count calculation
  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedCategory) count++;
    if (selectedLanguage) count++;
    if (selectedAvailability && selectedAvailability !== 'all') count++;
    if (selectedFloor) count++;
    if (selectedSection) count++;
    if (selectedShelf) count++;
    if (selectedRack) count++;
    if (yearFrom || yearTo) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  const sortOptions = [
    { value: 'title_asc', label: 'Title A → Z' },
    { value: 'title_desc', label: 'Title Z → A' },
    { value: 'author_asc', label: 'Author A → Z' },
    { value: 'newest', label: 'Newest Books' },
    { value: 'oldest', label: 'Oldest Books' },
    { value: 'recently_added', label: 'Recently Added' },
    { value: 'most_available', label: 'Most Available' },
    { value: 'least_available', label: 'Least Available' },
  ];

  const currentSortLabel = sortOptions.find(s => s.value === sortBy)?.label || 'Title A → Z';

  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  // Get selected category name for chip
  const selectedCatObj = categories.find(c => String(c.id) === String(selectedCategory));

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Action Motivation Banner */}
      <ActionMotivationBanner />

      {/* Page Heading & Add Book Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <BackButton label="Back to Dashboard" fallback="/student/dashboard" />
          <div className="h-4 w-px bg-slate-800" />
          <div>
            <h1 className="font-display font-black text-xl sm:text-2xl text-white flex items-center gap-2">
              <span>📚 College Book Catalog</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                {totalCount} Total Books
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Explore catalog collections across library floors, departmental wings, and shelves.
            </p>
          </div>
        </div>

        {/* ➕ Add New Book Button (Visible to all users / staff) */}
        <button
          type="button"
          onClick={() => setShowAddBookModal(true)}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 shrink-0 group hover:scale-[1.02]"
        >
          <PlusCircle className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
          <span>➕ Add New Book</span>
        </button>
      </div>

      {/* Unified Search + Filter + Sort Top Control Bar */}
      <div className="p-4 rounded-3xl glass-panel border border-slate-800/80 shadow-2xl space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* 1. 🔍 Modern Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="🔍 Search by title, author, ISBN, publisher..."
              className="w-full pl-11 pr-10 py-3 rounded-2xl bg-slate-900/90 border border-slate-700 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 shadow-inner transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Buttons Group: [Filter ▼] [Sort ↕] [+ Add New Book] */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* 2. 🔽 Filter Button with active count badge */}
            <button
              type="button"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                showFilterPanel || activeFilterCount > 0
                  ? 'bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-600/25'
                  : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-brand-700 text-[10px] font-black flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showFilterPanel ? 'rotate-180' : ''}`} />
            </button>

            {/* 3. ↕ Sort Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="px-4 py-3 rounded-2xl text-xs font-bold bg-slate-900/90 text-slate-300 border border-slate-700 hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-brand-400" />
                <span>Sort: {currentSortLabel}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showSortMenu ? 'rotate-180' : ''}`} />
              </button>

              {showSortMenu && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl glass-panel bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-40 animate-fade-in space-y-0.5">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    Sort Catalog By
                  </div>
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSortBy(opt.value);
                        setShowSortMenu(false);
                        setCurrentPage(1);
                      }}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all flex items-center justify-between ${
                        sortBy === opt.value
                          ? 'bg-brand-500/20 text-brand-300 font-bold border border-brand-500/30'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {sortBy === opt.value && <Check className="w-3.5 h-3.5 text-brand-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Add Book Trigger Button */}
            <button
              type="button"
              onClick={() => setShowAddBookModal(true)}
              className="px-4 py-3 rounded-2xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shadow-sm"
              title="Add New Book to Collection"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+ Add Book</span>
            </button>
          </div>
        </div>

        {/* 🔽 Expandable Filter Panel */}
        {showFilterPanel && (
          <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 animate-fade-in space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-white flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-brand-400" />
                Refine Book Catalog Filters
              </span>
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset All Filters</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filter 1: Category (Loaded dynamically from MySQL) */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Departmental Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  <option value="">All Categories ({categories.length})</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter 2: Language */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Language</label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => {
                    setSelectedLanguage(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  <option value="">All Languages</option>
                  <option value="Tamil">தமிழ் (Tamil)</option>
                  <option value="English">English</option>
                  <option value="Indian">Indian Classics & Translations</option>
                  <option value="Other">Other Languages</option>
                </select>
              </div>

              {/* Filter 3: Availability */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Availability Status</label>
                <select
                  value={selectedAvailability}
                  onChange={(e) => {
                    setSelectedAvailability(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="available">✅ Available in Library</option>
                  <option value="borrowed">📖 Currently Borrowed</option>
                  <option value="unavailable">❌ Unavailable (0 Copies)</option>
                  <option value="overdue">⏰ Overdue Loans</option>
                </select>
              </div>

              {/* Filter 4: Library Floor */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Library Floor</label>
                <select
                  value={selectedFloor}
                  onChange={(e) => {
                    setSelectedFloor(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  <option value="">All Floors</option>
                  <option value="Ground Floor">Ground Floor (Tamil & Heritage)</option>
                  <option value="1st Floor">1st Floor (Computer Science & SE)</option>
                  <option value="2nd Floor">2nd Floor (Business & Indian Lit)</option>
                  <option value="3rd Floor">3rd Floor (Math, Science & Career)</option>
                </select>
              </div>
            </div>

            {/* Custom Publication Year Range & Specific Shelf Location */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/60">
              <div>
                <label className="block text-slate-400 text-[11px] font-semibold mb-1">Publication Year Range</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="From (e.g. 1950)"
                    value={yearFrom}
                    onChange={(e) => { setYearFrom(e.target.value); setCurrentPage(1); }}
                    className="w-1/2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-brand-500"
                  />
                  <span className="text-slate-600 font-mono">-</span>
                  <input
                    type="number"
                    placeholder="To (e.g. 2026)"
                    value={yearTo}
                    onChange={(e) => { setYearTo(e.target.value); setCurrentPage(1); }}
                    className="w-1/2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] font-semibold mb-1">Shelf Code</label>
                <input
                  type="text"
                  placeholder="e.g. Shelf CS-A"
                  value={selectedShelf}
                  onChange={(e) => { setSelectedShelf(e.target.value); setCurrentPage(1); }}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] font-semibold mb-1">Rack Code</label>
                <input
                  type="text"
                  placeholder="e.g. Rack CS-01"
                  value={selectedRack}
                  onChange={(e) => { setSelectedRack(e.target.value); setCurrentPage(1); }}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* 5. 🏷️ Active Filter Chips Bar & Clear Filters */}
        {(query || selectedCategory || selectedLanguage || (selectedAvailability && selectedAvailability !== 'all') || selectedFloor || selectedShelf || selectedRack || yearFrom || yearTo) && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Active:</span>

              {query && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-brand-500/20 text-brand-300 border border-brand-500/30 font-bold">
                  <span>Search: "{query}"</span>
                  <button type="button" onClick={() => setQuery('')} className="hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              )}

              {selectedCatObj && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-ai-500/20 text-ai-300 border border-ai-500/30 font-bold">
                  <span>Category: {selectedCatObj.name}</span>
                  <button type="button" onClick={() => setSelectedCategory('')} className="hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              )}

              {selectedLanguage && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  <span>Language: {selectedLanguage}</span>
                  <button type="button" onClick={() => setSelectedLanguage('')} className="hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              )}

              {selectedAvailability && selectedAvailability !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  <span>Status: {selectedAvailability}</span>
                  <button type="button" onClick={() => setSelectedAvailability('all')} className="hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              )}

              {selectedFloor && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold">
                  <span>Floor: {selectedFloor}</span>
                  <button type="button" onClick={() => setSelectedFloor('')} className="hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              )}

              {(yearFrom || yearTo) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold font-mono">
                  <span>Year: {yearFrom || '...'} - {yearTo || '...'}</span>
                  <button type="button" onClick={() => { setYearFrom(''); setYearTo(''); }} className="hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              )}

              {(selectedShelf || selectedRack) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold font-mono">
                  <span>Loc: {selectedShelf} {selectedRack}</span>
                  <button type="button" onClick={() => { setSelectedShelf(''); setSelectedRack(''); }} className="hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              )}
            </div>

            {/* Clear All Button */}
            <button
              type="button"
              onClick={handleClearFilters}
              className="font-bold text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1 underline underline-offset-2"
            >
              <span>✕ Clear Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Book Grid Results & Pagination Bar */}
      {loading ? (
        <div className="py-24 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-brand-400" />
          <p className="text-sm font-semibold">Querying College Library Catalog...</p>
        </div>
      ) : books.length > 0 ? (
        <div className="space-y-6">
          {/* Results Summary Header */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 px-2 gap-2">
            <span>
              Showing <strong className="text-white font-mono">{startItem}–{endItem}</strong> of <strong className="text-white font-mono">{totalCount}</strong> books
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-900 border border-slate-800 text-slate-200 text-xs px-2.5 py-1 rounded-lg focus:outline-none focus:border-brand-500 font-mono"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <span className="font-medium">
                Page <strong className="text-brand-400 font-mono">{currentPage}</strong> of <strong className="text-slate-200 font-mono">{totalPages}</strong>
              </span>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onBorrow={() => setSelectedBorrowBook(book)}
                onRate={() => setSelectedRateBook(book)}
                onFindLocation={() => setSelectedLocationBook(book)}
              />
            ))}
          </div>

          {/* Pagination Navigation Bar */}
          {totalPages > 1 && (
            <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-4">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  currentPage === 1
                    ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                    : 'bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 shadow-sm'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {/* Numbered Page Buttons */}
              <div className="flex items-center gap-1 overflow-x-auto max-w-md py-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                  .map((p, idx, arr) => {
                    const prevP = arr[idx - 1];
                    const showEllipsis = prevP && p - prevP > 1;

                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && <span className="px-2 text-slate-600 text-xs">...</span>}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={`w-8 h-8 rounded-xl text-xs font-mono font-bold transition-all ${
                            currentPage === p
                              ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  currentPage === totalPages
                    ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                    : 'bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 shadow-sm'
                }`}
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Empty Results Fallback */
        <div className="p-16 rounded-3xl glass-panel text-center space-y-4">
          <BookOpen className="w-12 h-12 mx-auto text-slate-600" />
          <h3 className="font-display font-bold text-lg text-white">No Books Found Matching Selected Filters</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try adjusting your search terms, changing the floor/category filter, or clicking reset filters.
          </p>
          <button
            type="button"
            onClick={handleClearFilters}
            className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white text-xs font-bold transition-all shadow-md shadow-brand-500/20"
          >
            Show All Catalog Books
          </button>
        </div>
      )}

      {/* Modals */}
      {selectedBorrowBook && (
        <BorrowModal
          book={selectedBorrowBook}
          isOpen={!!selectedBorrowBook}
          onClose={() => setSelectedBorrowBook(null)}
          onBorrowed={() => fetchBooks()}
        />
      )}

      {selectedRateBook && (
        <RatingModal
          book={selectedRateBook}
          isOpen={!!selectedRateBook}
          onClose={() => setSelectedRateBook(null)}
          onRatingSubmitted={() => fetchBooks()}
        />
      )}

      {selectedLocationBook && (
        <LocationMapModal
          book={selectedLocationBook}
          isOpen={!!selectedLocationBook}
          onClose={() => setSelectedLocationBook(null)}
        />
      )}

      {showAddBookModal && (
        <AddBookModal
          isOpen={showAddBookModal}
          onClose={() => setShowAddBookModal(false)}
          onBookAdded={() => {
            fetchBooks();
          }}
          categories={categories}
        />
      )}
    </div>
  );
}
