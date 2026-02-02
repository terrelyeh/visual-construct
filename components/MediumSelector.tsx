import React, { useState, useEffect } from 'react';
import { TargetMedium } from '../types';
import { MEDIUM_DESCRIPTIONS, MEDIUM_BEST_PRACTICES } from '../constants';

interface MediumSelectorProps {
  selectedMedium: TargetMedium;
  onSelect: (medium: TargetMedium) => void;
}

const MEDIUM_TITLES: Record<TargetMedium, string> = {
  [TargetMedium.SLIDES]: "簡報提案 (Slides)",
  [TargetMedium.SAAS]: "Web App / SaaS (SPA)",
  [TargetMedium.POSTER]: "海報視覺 (Poster)"
};

export const MediumSelector: React.FC<MediumSelectorProps> = ({ selectedMedium, onSelect }) => {
  const [activeInfo, setActiveInfo] = useState<TargetMedium | null>(null);

  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveInfo(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const toggleInfo = (e: React.MouseEvent, medium: TargetMedium) => {
    e.stopPropagation(); // Prevent selecting the medium when clicking info
    if (activeInfo === medium) {
      setActiveInfo(null);
    } else {
      setActiveInfo(medium);
    }
  };

  return (
    <div className="w-full mt-10 relative">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3 h-3 bg-[#F29422]"></div>
        <label className="block text-sm font-bold text-[#E8DCC4] font-mono uppercase tracking-widest">
          02. 選擇目標媒介 (TARGET)
        </label>
      </div>

      {/* Invisible Backdrop for Click-Outside (Light Dismiss) */}
      {activeInfo && (
        <div 
          className="fixed inset-0 z-30 bg-transparent cursor-default"
          onClick={() => setActiveInfo(null)}
        />
      )}
      
      <div className="grid grid-cols-1 gap-4">
        {Object.values(TargetMedium).map((medium) => (
          <div key={medium} className="relative group">
            <button
              onClick={() => onSelect(medium)}
              className={`
                w-full relative p-5 text-left border-4 transition-all duration-150 outline-none
                ${selectedMedium === medium 
                  ? 'border-[#F29422] bg-[#1D1D1B] hard-shadow translate-x-[-2px] translate-y-[-2px]' 
                  : 'border-[#333] bg-[#2A2A28] hover:bg-[#F29422] hover:border-black hover:text-[#1D1D1B]'}
              `}
            >
              <div className="flex items-start justify-between pr-8">
                <div>
                  <h3 className={`font-extrabold text-xl mb-1 uppercase tracking-tight ${selectedMedium === medium ? 'text-[#F29422]' : 'text-[#E8DCC4] group-hover:text-[#1D1D1B]'}`}>
                    {MEDIUM_TITLES[medium]}
                  </h3>
                  <p className={`font-mono text-xs ${selectedMedium === medium ? 'text-white' : 'text-gray-400 group-hover:text-black'}`}>
                    {MEDIUM_DESCRIPTIONS[medium]}
                  </p>
                </div>
                
                <div className={`
                  w-6 h-6 border-2 flex items-center justify-center flex-shrink-0 ml-2
                  ${selectedMedium === medium ? 'border-[#F29422] bg-[#F29422]' : 'border-gray-500 group-hover:border-black'}
                `}>
                   {selectedMedium === medium && (
                     <div className="w-3 h-3 bg-[#1D1D1B]"></div>
                   )}
                </div>
              </div>
            </button>

            {/* Info Icon Button (Absolute Positioned) */}
            <button
              onClick={(e) => toggleInfo(e, medium)}
              className={`
                absolute top-5 right-5 w-6 h-6 rounded-full border-2 flex items-center justify-center font-mono font-bold text-xs transition-colors z-40
                ${activeInfo === medium 
                  ? 'bg-[#E61D23] text-white border-white' 
                  : 'bg-[#1D1D1B] text-[#E8DCC4] border-[#E8DCC4] hover:bg-white hover:text-[#1D1D1B]'}
              `}
              title="查看上傳建議 (Best Practices)"
            >
              {activeInfo === medium ? '×' : 'i'}
            </button>

            {/* Tactical Guide Tooltip/Modal */}
            {activeInfo === medium && (
              <div className="absolute left-0 top-full mt-4 w-full md:left-[105%] md:top-0 md:mt-0 md:w-[460px] z-40 animate-in fade-in slide-in-from-top-2 md:slide-in-from-left-2">
                 <div className="bg-[#E8DCC4] border-4 border-black p-6 hard-shadow relative">
                    
                    {/* Arrow - Desktop (Left Side) */}
                    <div className="hidden md:block absolute top-8 -left-3 w-5 h-5 bg-[#E8DCC4] border-b-4 border-l-4 border-black transform rotate-45"></div>
                    {/* Arrow - Mobile (Top Side) */}
                    <div className="md:hidden absolute -top-3 right-6 w-5 h-5 bg-[#E8DCC4] border-t-4 border-l-4 border-black transform rotate-45"></div>
                    
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-black/20">
                      <span className="bg-[#2D5A27] text-white text-xs font-bold px-2 py-1 border border-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000]">Tactical Guide</span>
                      <h4 className="font-extrabold text-lg text-[#1D1D1B] leading-none">{MEDIUM_BEST_PRACTICES[medium].title}</h4>
                    </div>

                    {/* Content */}
                    <div className="space-y-5 text-[#1D1D1B]">
                       {/* Golden Ratio */}
                       <div className="flex items-start gap-3">
                          <span className="text-[#E61D23] font-black text-xl leading-none mt-0.5">★</span>
                          <p className="text-base font-bold font-mono">{MEDIUM_BEST_PRACTICES[medium].goldenRatio}</p>
                       </div>
                       
                       {/* Recipe */}
                       <div className="bg-white/60 p-4 border-2 border-black/10">
                          <p className="text-xs font-extrabold text-gray-500 mb-2 uppercase tracking-wider">RECIPE (建議配方):</p>
                          <ul className="text-sm font-medium space-y-2 list-none text-[#1D1D1B]">
                            {MEDIUM_BEST_PRACTICES[medium].recipe.map((item, idx) => (
                              <li key={idx} className="flex gap-3">
                                <span className="text-[#E61D23] font-bold font-mono text-base">{idx + 1}.</span>
                                <span className="leading-snug">{item}</span>
                              </li>
                            ))}
                          </ul>
                       </div>

                       {/* Avoid */}
                       <div className="flex items-start gap-3 pt-1">
                          <span className="text-[#E61D23] font-bold text-xl leading-none">⚠</span>
                          <p className="text-sm text-gray-800 leading-snug">
                            <span className="font-bold border-b-2 border-[#E61D23]/30">Avoid:</span> {MEDIUM_BEST_PRACTICES[medium].donts}
                          </p>
                       </div>
                    </div>
                 </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};