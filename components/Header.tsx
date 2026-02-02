import React from 'react';
import { useApiKey } from '../contexts/ApiKeyContext';

interface HeaderProps {
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  const { isConfigured, isUsingEnv } = useApiKey();

  return (
    <header className="border-b-4 border-black bg-[#E61D23] sticky top-0 z-50">
      <div className="max-w-full mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Geometric Logo */}
          <div className="w-10 h-10 bg-[#1D1D1B] flex items-center justify-center hard-shadow-sm border-2 border-[#E8DCC4]">
             <span className="font-mono font-bold text-[#E8DCC4] text-xl">V</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tighter text-[#1D1D1B] uppercase">
              Visual Construct
            </h1>
            <p className="text-xs font-bold text-[#1D1D1B] font-mono tracking-widest uppercase bg-[#F29422] inline-block px-1 border border-black hard-shadow-sm">
              視覺風格解析儀
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           {/* API Key Status Indicator / Button */}
           <button 
             onClick={onOpenSettings}
             className={`
               flex items-center gap-2 px-3 py-1.5 border-2 border-black transition-all hard-shadow-sm hover:translate-y-0.5 hover:shadow-none
               ${isConfigured ? 'bg-[#1D1D1B] text-[#E8DCC4]' : 'bg-[#E8DCC4] text-[#E61D23] animate-pulse'}
             `}
             title="API Key Settings"
           >
             <div className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-[#2D5A27]' : 'bg-[#E61D23]'}`}></div>
             <span className="text-xs font-mono font-bold hidden md:inline">
               {isUsingEnv ? 'ENV KEY' : (isConfigured ? 'CUSTOM KEY' : 'NO KEY')}
             </span>
             {/* Gear Icon */}
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
           </button>
        </div>
      </div>
    </header>
  );
};