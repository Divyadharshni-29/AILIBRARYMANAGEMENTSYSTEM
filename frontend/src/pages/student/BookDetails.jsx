import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Star,
  BookOpen,
  Calendar,
  Layers,
  Building,
  CheckCircle,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  ArrowLeft,
  Share2,
  QrCode,
  MapPin,
  Barcode
} from 'lucide-react';
import BookCard from '../../components/BookCard';
import BorrowModal from '../../components/BorrowModal';
import RatingModal from '../../components/RatingModal';
import QRCodeModal from '../../components/QRCodeModal';
import LocationMapModal from '../../components/LocationMapModal';

import BackButton from '../../components/BackButton';
import { RotateCcw, Edit, Compass } from 'lucide-react';

export default function BookDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reaction, setReaction] = useState(null);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const fetchBookDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/books/${id}`);
      setBook(res.data);
      setReaction(res.data.my_reaction);
    } catch (err) {
      error('Failed to load book details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookDetails();
  }, [id]);

  const handleFeedback = async (type) => {
    try {
      await api.post('/interactions/feedback', {
        book_id: book.id,
        reaction: type,
      });
      setReaction(type);
      success(`Marked as ${type.toLowerCase()}d! Your feedback helps refine our recommendations.`);
    } catch (err) {
      error('Failed to record reaction.');
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400">
        <p className="text-sm font-medium">Loading book knowledge graph...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="p-16 rounded-3xl glass-panel text-center">
        <h3 className="text-lg font-bold text-white">Book Not Found</h3>
        <Link to="/student/books" className="mt-4 inline-block text-xs font-semibold text-brand-400 hover:underline">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const isAvailable = book.available_copies > 0;
  const isStaff = user?.role === 'librarian' || user?.role === 'admin';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header Navigation Strip */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-2">
        <div className="flex items-center gap-3">
          <BackButton label="Back to Books" fallback="/student/books" />
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/student/books"
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Compass className="w-3.5 h-3.5 text-brand-400" />
            <span>Browse Catalog</span>
          </Link>

          {isStaff && (
            <Link
              to="/librarian/books"
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Manage in Inventory</span>
            </Link>
          )}
        </div>
      </div>

      {/* Main Book Detail Card */}
      <div className="rounded-3xl glass-panel border border-slate-800/80 p-6 sm:p-10 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left: Book Cover Image */}
          <div className="flex flex-col items-center">
            <div className="relative aspect-[3/4] w-full max-w-[280px] rounded-2xl overflow-hidden shadow-2xl border border-slate-700/60 bg-slate-900 group">
              <img
                src={book.cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80'}
                alt={book.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
            </div>

            {/* Quick Reactions */}
            <div className="flex items-center gap-3 mt-5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
              <button
                onClick={() => handleFeedback('LIKE')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  reaction === 'LIKE'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-800'
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                <span>Like</span>
              </button>
              <button
                onClick={() => handleFeedback('DISLIKE')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  reaction === 'DISLIKE'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-rose-300 hover:bg-slate-800'
                }`}
              >
                <ThumbsDown className="w-4 h-4" />
                <span>Dislike</span>
              </button>
            </div>
          </div>

          {/* Right 2 Columns: Book Information */}
          <div className="md:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  {book.category?.name}
                </span>

                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-mono">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>{book.shelf_location || 'Rack A-01'}</span>
                </span>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                    isAvailable
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {isAvailable ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  {isAvailable ? `${book.available_copies} of ${book.total_copies} Copies Available` : 'All Copies Borrowed'}
                </span>
              </div>

              <h1 className="font-display font-black text-2xl sm:text-3xl text-white leading-tight">
                {book.title}
              </h1>
              <p className="text-sm font-semibold text-slate-300 mt-1">
                by <span className="text-brand-400">{book.author?.name}</span>
              </p>

              {/* Ratings and Stats Banner */}
              <div className="flex items-center gap-6 my-5 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <div>
                    <p className="text-base font-bold text-white leading-none">
                      {book.average_rating > 0 ? book.average_rating : 'New'} / 5.0
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{book.ratings_count} Student Ratings</p>
                  </div>
                </div>

                <div className="h-8 w-px bg-slate-800" />

                <div>
                  <p className="text-base font-bold text-white leading-none">{book.borrow_count}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Times Borrowed</p>
                </div>

                <div className="h-8 w-px bg-slate-800" />

                <div>
                  <p className="text-base font-bold text-white leading-none">{book.publication_year || '2024'}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Publication Year</p>
                </div>
              </div>

              {/* Dedicated College Physical Location Card */}
              <div className="my-5 p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 to-brand-950/30 border border-brand-500/30 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-300 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-brand-400" />
                    College Library Physical Location
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowLocationModal(true)}
                    className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-brand-500 to-ai-600 hover:from-brand-400 hover:to-ai-500 text-white rounded-xl shadow-md shadow-brand-500/20 transition-all flex items-center gap-1.5"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>📍 Find This Book</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Building & Floor</span>
                    <span className="font-bold text-white block truncate">{book.building || 'Main Library'} • {book.floor || '1st Floor'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Wing / Section</span>
                    <span className="font-bold text-ai-300 block truncate">{book.section || 'Academic Section'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Shelf & Rack</span>
                    <span className="font-bold text-amber-300 font-mono block truncate">{book.shelf || 'Shelf A'} • {book.rack || 'Rack A-01'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Total Copies</span>
                    <span className="font-bold text-emerald-300 block">{book.available_copies} / {book.total_copies} Available</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">About this Book</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{book.description}</p>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 text-xs text-slate-300">
                <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">ISBN-10 / 13</span>
                  <span className="font-semibold font-mono text-slate-200">{book.isbn}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Shelf / Rack</span>
                  <span className="font-semibold text-amber-300 font-mono">{book.shelf_location || `${book.shelf || 'Shelf A'}, ${book.rack || 'Rack A-01'}`}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Publisher</span>
                  <span className="font-semibold truncate block">{book.publisher || 'Academic Press'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">QR Identifier</span>
                  <span className="font-semibold font-mono text-brand-300">{book.qr_code || `LIB-BOOK-${book.id}`}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-8 pt-6 border-t border-slate-800/80 flex-wrap">
              {book.is_borrowed_by_me ? (
                <div className="py-3 px-6 rounded-2xl bg-brand-500/20 text-brand-300 border border-brand-500/40 font-bold text-sm flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>Currently Borrowed by You</span>
                </div>
              ) : (
                <button
                  onClick={() => setShowBorrowModal(true)}
                  disabled={!isAvailable}
                  className={`flex-1 min-w-[200px] py-3 px-6 rounded-2xl font-bold text-sm transition-all shadow-xl flex items-center justify-center gap-2 ${
                    isAvailable
                      ? 'bg-gradient-to-r from-brand-500 to-ai-600 hover:from-brand-400 hover:to-ai-500 text-white shadow-brand-500/25'
                      : 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <BookOpen className="w-5 h-5" />
                  <span>Borrow This Book (14 Days)</span>
                </button>
              )}

              <button
                onClick={() => setShowRateModal(true)}
                className="py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-sm transition-all flex items-center gap-2"
              >
                <Star className="w-4 h-4 text-amber-400" />
                <span>{book.my_rating ? `My Rating: ${book.my_rating}★` : 'Rate'}</span>
              </button>

              <button
                onClick={() => setShowQRModal(true)}
                className="py-3 px-4 rounded-2xl bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 text-brand-300 font-bold text-sm transition-all flex items-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                <span>QR Sticker</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Similar Books (Content-Based AI Recommender) */}
      {book.similar_books && book.similar_books.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-ai-400" />
            <h2 className="font-display font-bold text-xl text-white">Similar Books You May Also Like</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-ai-500/20 text-ai-300 border border-ai-500/30">
              Content TF-IDF
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Calculated via cosine similarity across book descriptions, keywords, categories, and author profiles.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {book.similar_books.map((sBook) => (
              <BookCard key={sBook.id} book={sBook} onBorrow={() => {}} onRate={() => {}} />
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <BorrowModal
        book={book}
        isOpen={showBorrowModal}
        onClose={() => setShowBorrowModal(false)}
        onBorrowed={() => fetchBookDetails()}
      />

      <RatingModal
        book={book}
        isOpen={showRateModal}
        onClose={() => setShowRateModal(false)}
        onRatingSubmitted={() => fetchBookDetails()}
      />

      <QRCodeModal
        book={book}
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
      />

      <LocationMapModal
        book={book}
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </div>
  );
}
