import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, BookOpen, CheckCircle, AlertCircle, ArrowRight, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LocationMapModal from './LocationMapModal';

export default function BookCard({ book, onBorrow, onRate, onFindLocation }) {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const isAvailable = (book.available_copies ?? book.total_copies) > 0;
  const [showLocationModal, setShowLocationModal] = useState(false);

  const handleOpenLocation = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onFindLocation) {
      onFindLocation(book);
    } else {
      setShowLocationModal(true);
    }
  };

  const displayFloor = book.floor || '1st Floor';
  const displayRack = book.rack || (book.shelf_location ? book.shelf_location.split(',')[1] || book.shelf_location : 'Rack A-01');

  return (
    <>
      <div className="group relative rounded-2xl glass-panel border border-slate-800/80 overflow-hidden flex flex-col justify-between glass-panel-hover transition-all duration-300">
        {/* Book Cover Banner */}
        <div className="relative aspect-[3/2] w-full overflow-hidden bg-slate-900">
          <img
            src={book.cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80'}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Category & Language Pills */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap max-w-[70%]">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-900/90 backdrop-blur-md text-brand-300 border border-brand-500/30">
              {book.category?.name || 'Academic'}
            </span>
            {book.language && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md border ${
                book.language === 'Tamil'
                  ? 'bg-amber-950/90 text-amber-300 border-amber-500/40'
                  : 'bg-sky-950/90 text-sky-300 border-sky-500/40'
              }`}>
                {book.language === 'Tamil' ? 'தமிழ் Tamil' : book.language}
              </span>
            )}
          </div>

          {/* Availability Status Badge */}
          <span
            className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md flex items-center gap-1 shadow-md ${
              isAvailable
                ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40'
                : 'bg-rose-950/90 text-rose-300 border border-rose-500/40'
            }`}
          >
            {isAvailable ? (
              <>
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                <span>{book.available_copies} Available</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 text-rose-400" />
                <span>Currently Unavailable</span>
              </>
            )}
          </span>
        </div>

        {/* Book Information Body */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <Link to={`/student/books/${book.id}`} className="hover:text-brand-300 transition-colors">
              <h3 className="font-display font-bold text-base text-white line-clamp-1 group-hover:text-brand-300 transition-colors">
                {book.title}
              </h3>
            </Link>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">by {book.author?.name || 'Unknown Author'}</p>

            <p className="text-xs text-slate-300 line-clamp-2 mt-2 leading-relaxed">
              {book.description}
            </p>
          </div>

          {/* Physical Library Location & Rating Bar */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-amber-400 font-semibold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{book.average_rating > 0 ? book.average_rating : '4.8'}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">ISBN: {book.isbn}</span>
            </div>

            {/* Physical Location Badge */}
            <div className="flex items-center gap-1 text-[11px] font-mono text-brand-300 bg-brand-950/40 px-2 py-0.5 rounded-lg border border-brand-500/30 truncate">
              <MapPin className="w-3 h-3 text-brand-400 shrink-0" />
              <span className="truncate">{displayFloor} • {displayRack}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="px-4 pb-4 pt-1 flex items-center gap-2">
          {/* Find This Book Button */}
          <button
            type="button"
            onClick={handleOpenLocation}
            className="px-3 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-brand-300 hover:text-brand-200 border border-brand-500/30 rounded-xl transition-all flex items-center gap-1 shadow-sm"
            title="Locate physical shelf on visual library floor map"
          >
            <MapPin className="w-3.5 h-3.5 text-brand-400" />
            <span>📍 Find</span>
          </button>

          <Link
            to={`/student/books/${book.id}`}
            className="flex-1 py-2 text-center text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1"
          >
            <span>Details</span>
            <ArrowRight className="w-3 h-3" />
          </Link>

          {isStudent && (
            book.is_borrowed_by_me ? (
              <span className="py-2 px-3 text-xs font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30 rounded-xl">
                Borrowed
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onBorrow && onBorrow(book)}
                disabled={!isAvailable}
                className={`py-2 px-3.5 text-xs font-bold rounded-xl transition-all shadow-md ${
                  isAvailable
                    ? 'bg-gradient-to-r from-brand-500 to-ai-600 hover:from-brand-400 hover:to-ai-500 text-white shadow-brand-500/20'
                    : 'bg-slate-800/50 text-slate-400 cursor-not-allowed border border-slate-800'
                }`}
              >
                📖 Borrow
              </button>
            )
          )}
        </div>
      </div>

      {/* Interactive Location Map Modal */}
      {showLocationModal && (
        <LocationMapModal
          book={book}
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
        />
      )}
    </>
  );
}
