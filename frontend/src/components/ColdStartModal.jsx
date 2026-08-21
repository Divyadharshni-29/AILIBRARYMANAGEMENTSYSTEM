import React, { useState } from 'react';
import { Sparkles, Check, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const AVAILABLE_INTERESTS = [
  'AI & Machine Learning',
  'Data Science & Analytics',
  'Software Engineering',
  'Cloud & DevOps',
  'Cybersecurity',
  'Mathematics & Statistics',
  'Business & Leadership',
  'Literature & Humanities',
];

export default function ColdStartModal({ isOpen, onClose, onComplete }) {
  if (!isOpen) return null;

  const { saveInterests } = useAuth();
  const { success, error } = useToast();
  const [selected, setSelected] = useState(['AI & Machine Learning', 'Software Engineering']);
  const [loading, setLoading] = useState(false);

  const toggleInterest = (interest) => {
    if (selected.includes(interest)) {
      if (selected.length > 1) {
        setSelected(selected.filter((i) => i !== interest));
      }
    } else {
      setSelected([...selected, interest]);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await saveInterests(selected);
      success('AI recommendation profile initialized with your chosen topics!');
      if (onComplete) onComplete(selected);
      onClose();
    } catch (err) {
      error('Failed to save interests.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg glass-panel border border-ai-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-ai-600 to-brand-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-ai-500/30">
          <Sparkles className="w-6 h-6" />
        </div>

        <h3 className="font-display font-bold text-2xl text-white mb-2">Welcome! Personalize Your AI Feed</h3>
        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
          Select at least 2 subjects you are interested in. Our machine learning system will personalize your initial book recommendations and study recommendations.
        </p>

        {/* Interests Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-8">
          {AVAILABLE_INTERESTS.map((interest) => {
            const isChecked = selected.includes(interest);
            return (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={`p-3 rounded-2xl border text-left text-xs font-semibold transition-all duration-200 flex items-center justify-between ${
                  isChecked
                    ? 'bg-ai-600/20 border-ai-500 text-ai-200 shadow-md shadow-ai-500/10'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <span>{interest}</span>
                {isChecked && (
                  <span className="w-5 h-5 rounded-full bg-ai-500 text-white flex items-center justify-center text-xs shrink-0">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || selected.length === 0}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-ai-600 to-brand-500 hover:from-ai-500 hover:to-brand-400 text-white font-bold text-sm transition-all shadow-xl shadow-ai-500/25 flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Configuring AI Profile...' : 'Start Exploring My Library'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
