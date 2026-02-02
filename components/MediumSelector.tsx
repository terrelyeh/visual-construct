import React from 'react';
import { TargetMedium } from '../types';
import { MEDIUM_DESCRIPTIONS } from '../constants';

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
  return (
    <div className="w-full mt-10">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3 h-3 bg-[#F29422]"></div>
        <label className="block text-sm font-bold text-[#E8DCC4] font-mono uppercase tracking-widest">
          02. 選擇目標媒介 (TARGET)
        </label>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {Object.values(TargetMedium).map((medium) => (
          <button
            key={medium}
            onClick={() => onSelect(medium)}
            className={`
              relative p-5 text-left border-4 transition-all duration-150 outline-none group
              ${selectedMedium === medium 
                ? 'border-[#F29422] bg-[#1D1D1B] hard-shadow translate-x-[-2px] translate-y-[-2px]' 
                : 'border-[#333] bg-[#2A2A28] hover:bg-[#F29422] hover:border-black hover:text-[#1D1D1B]'}
            `}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className={`font-extrabold text-xl mb-1 uppercase tracking-tight ${selectedMedium === medium ? 'text-[#F29422]' : 'text-[#E8DCC4] group-hover:text-[#1D1D1B]'}`}>
                  {MEDIUM_TITLES[medium]}
                </h3>
                <p className={`font-mono text-xs ${selectedMedium === medium ? 'text-white' : 'text-gray-400 group-hover:text-black'}`}>
                  {MEDIUM_DESCRIPTIONS[medium]}
                </p>
              </div>
              
              <div className={`
                w-6 h-6 border-2 flex items-center justify-center
                ${selectedMedium === medium ? 'border-[#F29422] bg-[#F29422]' : 'border-gray-500 group-hover:border-black'}
              `}>
                 {selectedMedium === medium && (
                   <div className="w-3 h-3 bg-[#1D1D1B]"></div>
                 )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};