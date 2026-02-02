import React, { useState, useEffect } from 'react';
import { useApiKey } from '../contexts/ApiKeyContext';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  forceOpen?: boolean; // Used when no key is present at all
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, forceOpen }) => {
  const { apiKey, setApiKey, removeApiKey, isUsingEnv } = useApiKey();
  const [inputValue, setInputValue] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (apiKey && !isUsingEnv) {
      setInputValue(apiKey);
    }
  }, [apiKey, isUsingEnv]);

  if (!isOpen && !forceOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setApiKey(inputValue.trim());
      if (!forceOpen) onClose();
    }
  };

  const handleClear = () => {
    removeApiKey();
    setInputValue('');
  };

  const show = isOpen || forceOpen;

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1D1D1B]/95 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#E8DCC4] border-4 border-black hard-shadow p-8 relative">
        
        {/* Header */}
        <div className="border-b-4 border-black pb-4 mb-6 flex justify-between items-start">
            <div>
                <h2 className="text-2xl font-extrabold text-[#1D1D1B] uppercase tracking-tighter">
                Access Protocol
                </h2>
                <div className="inline-block bg-[#F29422] text-[#1D1D1B] text-xs font-bold px-2 py-0.5 mt-1 border border-black">
                API KEY CONFIGURATION
                </div>
            </div>
            {!forceOpen && (
                <button onClick={onClose} className="text-[#1D1D1B] hover:text-[#E61D23] font-bold text-xl">
                    ✕
                </button>
            )}
        </div>

        {/* Content */}
        <div className="mb-6">
            <p className="text-sm font-medium text-[#1D1D1B] mb-4 leading-relaxed">
                To use the Visual Construct engine, a valid Google Gemini API Key is required.
                {isUsingEnv && (
                    <span className="block mt-2 text-[#2D5A27] font-bold">
                        ✓ Using Environment Variable Key (Server Provided)
                    </span>
                )}
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="relative">
                    <label className="block text-xs font-bold text-[#1D1D1B] uppercase mb-1">Enter your Gemini API Key</label>
                    <div className="flex">
                        <input 
                            type={isVisible ? "text" : "password"} 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="AIzaSy..."
                            className="flex-1 bg-white border-2 border-black p-3 font-mono text-sm focus:outline-none focus:border-[#E61D23] text-[#1D1D1B]"
                        />
                        <button 
                            type="button"
                            onClick={() => setIsVisible(!isVisible)}
                            className="bg-[#1D1D1B] text-[#E8DCC4] px-3 border-y-2 border-r-2 border-black hover:bg-gray-700"
                        >
                            {isVisible ? 'HIDE' : 'SHOW'}
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                    <button 
                        type="submit"
                        className="flex-1 bg-[#E61D23] text-[#1D1D1B] border-2 border-black py-3 font-extrabold text-sm uppercase tracking-wider hover:bg-white hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_#000] transition-all"
                    >
                        {isUsingEnv && inputValue === '' ? 'Use Custom Key' : 'Save Key'}
                    </button>
                    
                    {!forceOpen && !isUsingEnv && (
                        <button 
                            type="button"
                            onClick={handleClear}
                            className="px-4 py-3 bg-white text-[#1D1D1B] border-2 border-black font-bold text-sm uppercase hover:bg-gray-200"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </form>
        </div>

        {/* Footer info */}
        <div className="text-xs font-mono text-gray-600 border-t-2 border-black pt-4">
            <p>Don't have a key? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline font-bold text-[#E61D23] hover:bg-[#1D1D1B] hover:text-white px-1">Get one from Google AI Studio</a></p>
            <p className="mt-1 opacity-70">Keys are stored locally in your browser.</p>
        </div>

      </div>
    </div>
  );
};