import React from 'react';
import { getActionMessage } from '../utils/motivationalQuotes';
import { Sparkles } from 'lucide-react';

export default function ActionMotivationBanner({ 
  action = 'search', 
  className = '',
  compact = false 
}) {
  const config = getActionMessage(action);

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r ${config.gradient} border backdrop-blur-sm shadow-sm transition-all hover:shadow-md ${className}`}>
        <span className="text-base select-none shrink-0">{config.icon}</span>
        <p className="text-xs font-bold truncate">
          {config.title}
        </p>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-3xl p-4 sm:p-5 bg-gradient-to-r ${config.gradient} border backdrop-blur-md shadow-lg transition-all duration-300 hover:shadow-xl group ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-slate-950/60 border border-white/10 flex items-center justify-center text-xl shrink-0 shadow-sm group-hover:scale-110 transition-transform">
            {config.icon}
          </div>

          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/10 border border-white/15">
                {config.badge}
              </span>
              <span className="text-xs select-none opacity-80">
                {config.emojis.slice(0, 4).join(' ')}
              </span>
            </div>

            <h3 className="font-display font-bold text-sm sm:text-base text-white truncate">
              {config.title}
            </h3>
            <p className="text-xs text-slate-300/90 truncate">
              {config.subtitle}
            </p>
          </div>
        </div>

        {/* Floating Sparkle */}
        <div className="hidden sm:flex items-center gap-1 shrink-0 text-white/50 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
          <span>Keep Learning</span>
        </div>
      </div>
    </div>
  );
}
