import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function RatingModal({ book, isOpen, onClose, onRatingSubmitted }) {
  if (!isOpen || !book) return null;

  const { success, error } = useToast();
  const [rating, setRating] = useState(book.my_rating || 5);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/interactions/rate', {
        book_id: book.id,
        rating: parseFloat(rating),
        review: review.trim() || undefined,
      });

      success(`Thank you! You rated "${book.title}" ${rating} stars.`);
      if (onRatingSubmitted) onRatingSubmitted(rating);
      onClose();
    } catch (err) {
      error('Failed to submit rating. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md glass-panel border border-slate-700/80 rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-display font-bold text-lg text-white mb-1">Rate & Review Book</h3>
        <p className="text-xs text-slate-400 mb-5">Your ratings train our AI to recommend better books for you and fellow students.</p>

        <div className="flex items-center gap-3 p-3 bg-slate-900/80 rounded-xl border border-slate-800 mb-5">
          <img
            src={book.cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80'}
            alt={book.title}
            className="w-12 h-16 object-cover rounded-lg"
          />
          <div>
            <h4 className="text-sm font-bold text-white line-clamp-1">{book.title}</h4>
            <p className="text-xs text-slate-400">by {book.author?.name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star Selection */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 hover:scale-125 transition-transform"
                >
                  <Star
                    className={`w-8 h-8 ${
                      (hoverRating || rating) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-semibold text-amber-300 mt-2">
              {rating === 5 ? '5.0 - Masterpiece' : rating === 4 ? '4.0 - Great Read' : rating === 3 ? '3.0 - Good' : rating === 2 ? '2.0 - Below Average' : '1.0 - Not Recommended'}
            </span>
          </div>

          {/* Review Textarea */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Short Review / Feedback (Optional)
            </label>
            <textarea
              rows={3}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="What did you think of the explanations, depth, and relevance?"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-800 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20"
            >
              {loading ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
