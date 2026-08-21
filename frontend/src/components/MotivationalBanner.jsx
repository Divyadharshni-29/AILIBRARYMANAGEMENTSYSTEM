import React, { useState } from 'react';
import { Sparkles, RefreshCw, Quote, Heart } from 'lucide-react';
import { getDailyQuote, getRandomQuote } from '../utils/motivationalQuotes';

export default function MotivationalBanner({ className = '' }) {
  const [currentQuote, setCurrentQuote] = useState(getDailyQuote());
  const [animating, setAnimating] = useState(false);

  const handleShuffle = () => {
    setAnimating(true);
    setTimeout(() => {
      setCurrentQuote(getRandomQuote(currentQuote?.index));
      setAnimating(false);
    }, 200);
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-gradient-to-r from-brand-950/70 via-slate-900 to-ai-950/70 border border-brand-500/30 shadow-xl group ${className}`}>
      {/* Ambient background glow */}
      <div className="absolute top-0 right-1/4 -mt-10 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 -mb-10 w-48 h-48 bg-ai-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          {/* Quote icon bubble */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-500 to-ai-500 text-white flex items-center justify-center text-2xl shrink-0 shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform select-none">
            {currentQuote.icon}
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-brand-300">
                <Sparkles className="w-3.5 h-3.5 text-ai-400" />
                <span>Today's Reading Motivation</span>
              </span>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                Daily Inspiration
              </span>
            </div>

            <blockquote className={`text-base sm:text-lg font-display font-bold text-white leading-snug transition-all duration-200 ${animating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
              "{currentQuote.quote}"
            </blockquote>

            <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <span>— {currentQuote.author}</span>
            </p>
          </div>
        </div>

        {/* Shuffle Button */}
        <button
          onClick={handleShuffle}
          className="self-start sm:self-center px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 shrink-0 active:scale-95"
          title="Get another motivating quote"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-brand-400 ${animating ? 'animate-spin' : ''}`} />
          <span>New Quote</span>
        </button>
      </div>
    </div>
  );
}
