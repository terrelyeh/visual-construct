import React, { useState } from 'react';
import { Header } from './components/Header';
import { AssetUploader } from './components/AssetUploader';
import { MediumSelector } from './components/MediumSelector';
import { ResultViewer } from './components/ResultViewer';
import { analyzeImage } from './services/gemini';
import { AnalysisState, TargetMedium, VisualAsset } from './types';
import { ApiKeyProvider, useApiKey } from './contexts/ApiKeyContext';
import { ApiKeyModal } from './components/ApiKeyModal';

// Inner App Content to access Context
const AppContent: React.FC = () => {
  const { apiKey, isConfigured } = useApiKey();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [assets, setAssets] = useState<VisualAsset[]>([]);
  const [medium, setMedium] = useState<TargetMedium>(TargetMedium.SLIDES);
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    isLoading: false,
    result: null,
    error: null,
  });

  const handleAnalyze = async () => {
    if (assets.length === 0) return;
    if (!apiKey) {
      setIsSettingsOpen(true);
      return;
    }

    setAnalysisState({ isLoading: true, result: null, error: null });

    try {
      const yamlResult = await analyzeImage(assets, medium, apiKey);
      setAnalysisState({ isLoading: false, result: yamlResult, error: null });
    } catch (err: any) {
      setAnalysisState({ 
        isLoading: false, 
        result: null, 
        error: err.message || "Unknown error occurred" 
      });
    }
  };

  const handleReset = () => {
    // 1. Clear Assets (Left Side)
    setAssets([]);
    // 2. Clear Results (Right Side)
    setAnalysisState({
      isLoading: false,
      result: null,
      error: null,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#1D1D1B]">
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />
      
      <ApiKeyModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        forceOpen={!isConfigured} 
      />

      {/* Main Grid: Split Screen */}
      <main className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-0">
        
        {/* Left Column: Input Controls (Dark Overlay Theme) */}
        {/* Added z-20 to ensure tooltips/popovers from this column overlay the right column */}
        <section className="lg:col-span-5 bg-[#1D1D1B] p-8 lg:p-12 flex flex-col border-r-0 lg:border-r-4 border-black relative z-20 bg-noise">
          
          <div className="max-w-md mx-auto w-full">
            <div className="mb-10 border-l-4 border-[#E61D23] pl-6">
              <h2 className="text-4xl font-extrabold text-[#E8DCC4] mb-2 tracking-tighter uppercase leading-none">
                Visual<br/>Construct
              </h2>
              <p className="text-gray-400 text-sm font-mono mt-4">
                // EXTRACT VISUAL STYLE <br/> & BUILD SPECIFICATIONS.
              </p>
            </div>

            <AssetUploader 
              assets={assets} 
              onAssetsChange={setAssets} 
              onReset={handleReset}
            />

            <MediumSelector 
              selectedMedium={medium} 
              onSelect={setMedium} 
            />

            <div className="mt-12 pt-8 border-t-4 border-[#333]">
               <button
                onClick={handleAnalyze}
                disabled={assets.length === 0 || analysisState.isLoading}
                className={`
                  w-full py-5 px-6 font-extrabold text-xl tracking-wide transition-all duration-200 border-4 border-black uppercase
                  flex items-center justify-center gap-3
                  ${assets.length === 0 || analysisState.isLoading 
                    ? 'bg-[#333] text-gray-500 cursor-not-allowed border-gray-600' 
                    : 'bg-[#E61D23] text-[#1D1D1B] hover:bg-white hover:text-[#E61D23] hard-shadow hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_#000]'}
                `}
              >
                {analysisState.isLoading ? (
                  'PROCESSING...'
                ) : (
                  <>
                    <span>ANALYZE & GENERATE</span>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Right Column: Output Viewer (Beige Base Theme) */}
        {/* z-10 ensures it stays behind the left column's popovers */}
        <section className="lg:col-span-7 h-full min-h-[600px] lg:min-h-auto relative z-10">
          <ResultViewer state={analysisState} medium={medium} />
        </section>

      </main>
    </div>
  );
};

// Root App Wrapper
const App: React.FC = () => {
  return (
    <ApiKeyProvider>
      <AppContent />
    </ApiKeyProvider>
  );
};

export default App;