import React, { useState } from 'react';
import {
  MapPin, Navigation, Compass, Layers, Building2, ChevronRight, X,
  CheckCircle2, Sparkles, BookOpen, Info, ExternalLink
} from 'lucide-react';

export default function LocationMapModal({ book, isOpen, onClose }) {
  if (!isOpen || !book) return null;

  const floor = book.floor || '1st Floor';
  const section = book.section || 'Computer Science & AI Wing';
  const shelf = book.shelf || 'Shelf A';
  const rack = book.rack || 'Rack A-01';
  const building = book.building || 'Main Library Building';

  // Floor selector tab for interactive map viewing
  const [activeFloorTab, setActiveFloorTab] = useState(floor);

  // Floor Sections and Racks layout definition
  const floorLayouts = {
    'Ground Floor': {
      name: 'Ground Floor (Tamil Classics & Heritage)',
      sections: [
        { id: 'TAM-SANGAM', name: 'Sangam Literature & Epics', racks: ['Rack TAM-01', 'Rack TAM-02', 'Rack TAM-03', 'Rack TAM-04'], color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-300' },
        { id: 'TAM-THIRU', name: 'Thirukkural & Ethical Works', racks: ['Rack TAM-05', 'Rack TAM-06', 'Rack TAM-07'], color: 'from-orange-500/20 to-amber-500/10 border-orange-500/30 text-orange-300' },
        { id: 'TAM-MODERN', name: 'Modern Tamil Novels & Kalki Wing', racks: ['Rack TAM-08', 'Rack TAM-09', 'Rack TAM-10', 'Rack TAM-11', 'Rack TAM-12'], color: 'from-rose-500/20 to-amber-500/10 border-rose-500/30 text-rose-300' },
        { id: 'CIRCULATION', name: 'Main Circulation Desk & Helpdesk', racks: ['Circulation Desk', 'Self-Return Kiosk'], color: 'from-slate-700/20 to-slate-800/10 border-slate-700 text-slate-300' },
        { id: 'READING-GF', name: 'Central Quiet Reading Hall (Ground)', racks: ['Table 1-20'], color: 'from-emerald-500/10 to-teal-500/5 border-emerald-500/20 text-emerald-300' }
      ]
    },
    '1st Floor': {
      name: '1st Floor (Computer Science, AI & Software Engineering)',
      sections: [
        { id: 'CS-CORE', name: 'Computer Science & AI Wing', racks: ['Rack CS-01', 'Rack CS-02', 'Rack CS-03', 'Rack CS-04', 'Rack CS-05', 'Rack CS-06'], color: 'from-brand-500/20 to-ai-500/10 border-brand-500/30 text-brand-300' },
        { id: 'SE-ARCH', name: 'Software Engineering & Cloud Wing', racks: ['Rack SE-01', 'Rack SE-02', 'Rack SE-03', 'Rack SE-04', 'Rack SE-05'], color: 'from-ai-500/20 to-sky-500/10 border-ai-500/30 text-ai-300' },
        { id: 'DEVOPS-NET', name: 'Networks, Cloud & Cybersecurity', racks: ['Rack SE-06', 'Rack SE-07', 'Rack SE-08', 'Rack SE-09', 'Rack SE-10'], color: 'from-teal-500/20 to-emerald-500/10 border-teal-500/30 text-teal-300' },
        { id: 'DIGITAL-LAB', name: 'Digital Library & AI Terminal Lab', racks: ['Terminal A1-A20'], color: 'from-indigo-500/20 to-brand-500/10 border-indigo-500/30 text-indigo-300' },
        { id: 'READING-1F', name: 'Technical Group Study Hall', racks: ['Discussion Pods 1-8'], color: 'from-emerald-500/10 to-teal-500/5 border-emerald-500/20 text-emerald-300' }
      ]
    },
    '2nd Floor': {
      name: '2nd Floor (Business, Management & Indian Literature)',
      sections: [
        { id: 'BUS-LEAD', name: 'Business, Management & Leadership Wing', racks: ['Rack BUS-01', 'Rack BUS-02', 'Rack BUS-03', 'Rack BUS-04', 'Rack BUS-05'], color: 'from-amber-500/20 to-yellow-500/10 border-amber-500/30 text-amber-300' },
        { id: 'BUS-CORP', name: 'Corporate Finance & Startup Hub', racks: ['Rack BUS-06', 'Rack BUS-07', 'Rack BUS-08', 'Rack BUS-09', 'Rack BUS-10'], color: 'from-yellow-500/20 to-amber-500/10 border-yellow-500/30 text-yellow-300' },
        { id: 'IND-CLASSIC', name: 'Indian Heritage & National Literature Wing', racks: ['Rack IND-01', 'Rack IND-02', 'Rack IND-03', 'Rack IND-04', 'Rack IND-05'], color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-300' },
        { id: 'IND-HIST', name: 'Indian History & Biographies', racks: ['Rack IND-06', 'Rack IND-07', 'Rack IND-08', 'Rack IND-09', 'Rack IND-10', 'Rack IND-11', 'Rack IND-12'], color: 'from-teal-500/20 to-sky-500/10 border-teal-500/30 text-teal-300' },
        { id: 'READING-2F', name: 'Periodicals & Journal Archives', racks: ['Archive Stacks 1-5'], color: 'from-slate-700/20 to-slate-800/10 border-slate-700 text-slate-300' }
      ]
    },
    '3rd Floor': {
      name: '3rd Floor (Mathematics, Science & Competitive Exams)',
      sections: [
        { id: 'MATH-SEC', name: 'Pure & Applied Mathematics Section', racks: ['Rack MATH-01', 'Rack MATH-02', 'Rack MATH-03', 'Rack MATH-04', 'Rack MATH-05'], color: 'from-sky-500/20 to-indigo-500/10 border-sky-500/30 text-sky-300' },
        { id: 'SCI-SEC', name: 'Science & Environmental Studies Section', racks: ['Rack SCI-01', 'Rack SCI-02', 'Rack SCI-03', 'Rack SCI-04', 'Rack SCI-05'], color: 'from-teal-500/20 to-emerald-500/10 border-teal-500/30 text-teal-300' },
        { id: 'EXAM-CELL', name: 'Competitive Examination & Career Cell', racks: ['Rack EXAM-01', 'Rack EXAM-02', 'Rack EXAM-03', 'Rack EXAM-04', 'Rack EXAM-05'], color: 'from-rose-500/20 to-pink-500/10 border-rose-500/30 text-rose-300' },
        { id: 'READING-3F', name: 'Silent Individual Research Cubicles', racks: ['Cubicles 1-30'], color: 'from-slate-700/20 to-slate-800/10 border-slate-700 text-slate-300' }
      ]
    }
  };

  const currentFloorData = floorLayouts[activeFloorTab] || floorLayouts['1st Floor'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-3xl rounded-3xl glass-panel border border-slate-700 bg-slate-900/95 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center shadow-md shadow-brand-500/10">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-white flex items-center gap-2">
                <span>📍 Book Location Locator</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  College Central Library
                </span>
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-md">
                Locating: <span className="text-slate-200 font-semibold">{book.title}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Breadcrumb Location Route */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-brand-400" />
                Physical Path Navigation
              </span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                {book.available_copies > 0 ? `✅ Available on Shelf (${book.available_copies} Copies)` : '❌ Currently Unavailable'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-brand-400" />
                <span>{building}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

              <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-brand-500/40 text-brand-300 flex items-center gap-1.5 font-bold">
                <Layers className="w-3.5 h-3.5 text-brand-400" />
                <span>{floor}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

              <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-ai-500/40 text-ai-300 flex items-center gap-1.5 font-bold">
                <Compass className="w-3.5 h-3.5 text-ai-400" />
                <span>{section}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

              <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-ai-600 text-white font-black flex items-center gap-1.5 shadow-lg shadow-brand-500/25">
                <MapPin className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
                <span>{shelf} • {rack}</span>
              </div>
            </div>
          </div>

          {/* Interactive Floorplan Map */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-brand-400" />
                Visual Library Floor Map
              </span>
              {/* Floor Tabs */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                {['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFloorTab(f)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      activeFloorTab === f
                        ? 'bg-brand-500 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {f.replace(' Floor', 'F')}
                  </button>
                ))}
              </div>
            </div>

            {/* 2D Floor Visual Layout Container */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 relative overflow-hidden">
              <div className="text-[11px] font-bold text-slate-400 mb-3 flex items-center justify-between">
                <span>{currentFloorData.name}</span>
                <span className="text-[10px] text-slate-500 font-mono">NORTH ↑ (Entrance Staircase / Elevator)</span>
              </div>

              {/* Grid of Sections */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {currentFloorData.sections.map((sec) => {
                  const isMatchingSection = sec.name.toLowerCase().includes(section.toLowerCase()) || section.toLowerCase().includes(sec.name.toLowerCase());
                  const hasTargetRack = sec.racks.some(r => r.toLowerCase().includes(rack.toLowerCase()) || rack.toLowerCase().includes(r.toLowerCase()));

                  return (
                    <div
                      key={sec.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isMatchingSection || hasTargetRack
                          ? 'bg-gradient-to-br from-brand-950/60 to-ai-950/40 border-brand-500/60 shadow-lg shadow-brand-500/10 ring-1 ring-brand-500/40'
                          : `bg-gradient-to-br ${sec.color}`
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-xs text-white flex items-center gap-1.5">
                          {isMatchingSection || hasTargetRack ? (
                            <MapPin className="w-3.5 h-3.5 text-brand-400 animate-pulse" />
                          ) : (
                            <BookOpen className="w-3.5 h-3.5 opacity-70" />
                          )}
                          {sec.name}
                        </span>
                        {hasTargetRack && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-brand-500 text-white animate-pulse shadow-sm">
                            ★ YOUR BOOK HERE
                          </span>
                        )}
                      </div>

                      {/* Racks list */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {sec.racks.map((r) => {
                          const isTargetRack = (rack.toLowerCase().includes(r.toLowerCase()) || r.toLowerCase().includes(rack.toLowerCase())) && activeFloorTab === floor;
                          return (
                            <span
                              key={r}
                              className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                                isTargetRack
                                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black ring-2 ring-amber-300 shadow-md shadow-amber-500/30'
                                  : 'bg-slate-900/80 border border-slate-800 text-slate-300'
                              }`}
                            >
                              {r}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Practical Step-by-Step Directions */}
          <div className="p-4 rounded-2xl bg-brand-950/20 border border-brand-500/30 flex items-start gap-3">
            <Info className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 space-y-1">
              <p className="font-bold text-white">How to collect this physical book:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-slate-300 text-[11px] leading-relaxed">
                <li>Walk into the <span className="font-semibold text-brand-300">{building}</span> and proceed to the <span className="font-semibold text-brand-300">{floor}</span>.</li>
                <li>Enter the <span className="font-semibold text-brand-300">{section}</span>.</li>
                <li>Locate <span className="font-semibold text-amber-300">{shelf}</span> and find rack slot <span className="font-semibold text-amber-300">{rack}</span>.</li>
                <li>Pick the book and bring it to the circulation desk or scan the book's QR code on your mobile camera to borrow.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Shelf: <span className="text-slate-200 font-mono font-bold">{shelf}</span> • Rack: <span className="text-slate-200 font-mono font-bold">{rack}</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-white text-xs font-bold transition-all shadow-md shadow-brand-500/20"
          >
            Got It! Return to Catalog
          </button>
        </div>
      </div>
    </div>
  );
}
