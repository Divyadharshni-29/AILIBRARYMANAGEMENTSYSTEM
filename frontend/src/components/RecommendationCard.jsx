import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ThumbsUp, ThumbsDown, Star, CheckCircle, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function RecommendationCard({ item, onBorrow }) {
  const { book, score, reason, model_type } = item;
  const { success, error } = useToast();
  const [reaction, setReaction] = useState(book.my_reaction || null);
  const [loading, setLoading] = useState(false);

  const matchPercentage = Math.round(Math.min(100, Math.max(10, score * 100)));

  const handleFeedback = async (actionType) => {
    if (loading) return;
    setLoading(true);
    try {
      await api.post('/interactions/recommendation-feedback', {
        book_id: book.id,
        action: actionType,
      });

      const newReaction = actionType === 'LIKED' ? 'LIKE' : 'DISLIKE';
      setReaction(newReaction);
      success(actionType === 'LIKED' ? 'Thanks! We will recommend more books like this.' : 'Got it. We will tune down similar recommendations.');
    } catch (err) {
      error('Failed to submit feedback.');
    } finally {
      setLoading(false);
    }
  };

  const getModelBadge = () => {
    switch (model_type) {
      case 'CONTENT_BASED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">Content Match</span>;
      case 'COLLABORATIVE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Peer Collaborative</span>;
      case 'COLD_START':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Interest Onboarded</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-ai-500/20 text-ai-300 border border-ai-500/30 flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" /> AI Hybrid</span>;
    }
  };

  return (
    <div className="group relative rounded-2xl glass-panel border border-ai-500/20 overflow-hidden flex flex-col justify-between hover:border-ai-500/40 hover:shadow-xl hover:shadow-ai-500/10 transition-all duration-300">
      {/* Top Banner with cover & badges */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
        <img
          src={book.cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80'}
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />

        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
          {getModelBadge()}
        </div>

        {/* AI Score Pill */}
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold bg-ai-600/90 text-white backdrop-blur-md shadow-lg shadow-ai-600/30 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>{matchPercentage}% Match</span>
        </div>
      </div>

      {/* Body & AI Reason */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <Link to={`/student/books/${book.id}`} className="hover:text-ai-300 transition-colors">
            <h3 className="font-display font-bold text-base text-white line-clamp-1 group-hover:text-ai-300 transition-colors">
              {book.title}
            </h3>
          </Link>
          <p className="text-xs text-slate-400 mt-0.5">by {book.author?.name || 'Unknown Author'}</p>

          {/* Explainable AI Reasoning Pill */}
          <div className="mt-3 p-2.5 rounded-xl bg-ai-950/60 border border-ai-500/30 text-xs text-ai-200 flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-ai-400 shrink-0 mt-0.5" />
            <span className="leading-snug">{reason}</span>
          </div>
        </div>

        {/* Rating and Feedback Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-1 text-amber-400 font-semibold text-xs">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{book.average_rating > 0 ? book.average_rating : 'New'}</span>
          </div>

          {/* Feedback buttons (Like / Dislike) */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => handleFeedback('LIKED')}
              title="I like this recommendation"
              disabled={loading}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                reaction === 'LIKE'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-800'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleFeedback('DISLIKED')}
              title="Not relevant for me"
              disabled={loading}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                reaction === 'DISLIKE'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:text-rose-300 hover:bg-slate-800'
              }`}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 pt-1 flex items-center gap-2">
        <Link
          to={`/student/books/${book.id}`}
          className="flex-1 py-2 text-center text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1"
        >
          <span>Explore</span>
          <ArrowRight className="w-3 h-3" />
        </Link>

        {book.is_borrowed_by_me ? (
          <span className="py-2 px-3 text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30 rounded-xl">
            Borrowed
          </span>
        ) : (
          <button
            onClick={() => onBorrow && onBorrow(book)}
            disabled={book.available_copies <= 0}
            className={`py-2 px-3 text-xs font-semibold rounded-xl transition-all shadow-md ${
              book.available_copies > 0
                ? 'bg-gradient-to-r from-ai-600 to-brand-600 hover:from-ai-500 hover:to-brand-500 text-white shadow-ai-500/20'
                : 'bg-slate-800/50 text-slate-400 cursor-not-allowed border border-slate-800'
            }`}
          >
            Borrow
          </button>
        )}
      </div>
    </div>
  );
}
