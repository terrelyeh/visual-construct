import React, { useState, useEffect } from 'react';
import { AnalysisState, TargetMedium } from '../types';
import { generateVisualPreview } from '../services/gemini';
import { useApiKey } from '../contexts/ApiKeyContext';

interface ResultViewerProps {
  state: AnalysisState;
  medium: TargetMedium;
}

export const ResultViewer: React.FC<ResultViewerProps> = ({ state, medium }) => {
  const { apiKey } = useApiKey();
  const [copied, setCopied] = React.useState(false);
  const [promptCopied, setPromptCopied] = React.useState(false);
  
  // Track specific copied item (color hex or keyword) for individual feedback
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // NotebookLM States (Slides)
  const [instructionCopied, setInstructionCopied] = React.useState(false);
  const [fullPromptCopied, setFullPromptCopied] = React.useState(false);

  // Coding Assistant States (SaaS/SPA)
  const [spaInstructionCopied, setSpaInstructionCopied] = React.useState(false);
  const [fullSpaPromptCopied, setFullSpaPromptCopied] = React.useState(false);
  
  // Image Generation State
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  
  // Lightbox State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Safe access to result data for prompt generation
  const summary = state.result?.summary;
  const yaml = state.result?.yaml;

  // --- NotebookLM Logic ---
  const instructionPart = `指令： 請你擔任我的首席簡報設計顧問。請參考這份名為 design_specification 的 YAML 風格定義（若為檔案請參閱來源，若為文字請見下方附錄）。

現在，請你根據這份規範，將我接下來提供的研究資料轉化為簡報大綱。在產出內容時，請嚴格遵守以下邏輯：

1. **資訊極簡化（Low Density）**： 根據 YAML 中的 density_limit，每張投影片僅限一個核心概念，文字要精煉。
2. **視覺佈局建議**： 請在每張投影片的大綱下方，根據 layout_mapping_logic 提供具體的「設計指令」。
3. **色彩與情緒**： 內容語氣需符合 "${summary?.style_description || ''}" 的精神，以及關鍵字：${summary?.mood_keywords.join(', ') || ''}。
4. **結構劃分**： 請自動根據資料內容，將其分配至「標題頁 (Title)」、「概念頁 (Text)」與「數據頁 (Data)」。`;

  const fullMegaPrompt = `${instructionPart}

附錄：[YAML Design Specification]
\`\`\`yaml
${yaml || ''}
\`\`\`
`;

  // 2. AI Coding Assistant Logic (SPA/SaaS)
  const spaInstructionPart = `Role: Senior Frontend Engineer & UI/UX Designer
Task: Build a high-fidelity Single Page Application (SPA) or Dashboard UI based strictly on the attached Design Specification.

[Tech Stack]
- Framework: React (Latest)
- Styling: Tailwind CSS
- Icons: Lucide React

[Implementation Requirements]
1. **Visual Accuracy**: You MUST strictly adhere to the \`color_system\` (use arbitrary values like bg-[#...] if needed) and \`visual_assets\` defined in the YAML.
2. **App Shell**: Implement the structure defined in \`layout_system.app_shell\`.
3. **Atmosphere**: The UI must reflect the mood keywords: [${summary?.mood_keywords.join(', ') || ''}] and the style: "${summary?.style_description || ''}".
4. **Interactive States**: Implement hover/active states as defined in \`ui_states\`.

[Output]
Return the complete, runnable React code for the main App component and necessary sub-components.`;

  const fullSpaPrompt = `${spaInstructionPart}

[Design Specification - YAML Source]
\`\`\`yaml
${yaml || ''}
\`\`\`
`;

  // Reset image generation state when analysis result or medium changes
  useEffect(() => {
    setGeneratedImageUrl(null);
    setImageError(null);
    setIsGeneratingImage(false);
  }, [state.result, medium]);

  // Close lightbox on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleCopy = () => {
    if (state.result?.yaml) {
      navigator.clipboard.writeText(state.result.yaml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyPrompt = () => {
    if (state.result?.image_generation_prompt) {
      navigator.clipboard.writeText(state.result.image_generation_prompt);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    }
  };

  const handleCopyItem = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(text);
    setTimeout(() => setCopiedItem(null), 1500);
  };

  const handleCopyInstructionOnly = () => {
    navigator.clipboard.writeText(instructionPart);
    setInstructionCopied(true);
    setTimeout(() => setInstructionCopied(false), 2000);
  };

  const handleCopyFullPrompt = () => {
    navigator.clipboard.writeText(fullMegaPrompt);
    setFullPromptCopied(true);
    setTimeout(() => setFullPromptCopied(false), 2000);
  };

  const handleCopySpaInstruction = () => {
    navigator.clipboard.writeText(spaInstructionPart);
    setSpaInstructionCopied(true);
    setTimeout(() => setSpaInstructionCopied(false), 2000);
  };

  const handleCopyFullSpaPrompt = () => {
    navigator.clipboard.writeText(fullSpaPrompt);
    setFullSpaPromptCopied(true);
    setTimeout(() => setFullSpaPromptCopied(false), 2000);
  };

  const getGenerateButtonLabel = () => {
    switch(medium) {
        case TargetMedium.SLIDES: return "GENERATE SLIDE PREVIEW";
        case TargetMedium.SAAS: return "GENERATE UI MOCKUP";
        case TargetMedium.POSTER: return "GENERATE VISUAL";
        default: return "GENERATE PREVIEW";
    }
  };

  const handleGeneratePreview = async () => {
    if (!state.result?.image_generation_prompt) return;
    
    setIsGeneratingImage(true);
    setGeneratedImageUrl(null);
    setImageError(null);

    try {
      const imageUrl = await generateVisualPreview(state.result.image_generation_prompt, medium, apiKey);
      setGeneratedImageUrl(imageUrl);
    } catch (error: any) {
      console.error(error);
      setImageError(error.message || "Failed to generate image.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Loading State - Geometric Animation
  if (state.isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-6 p-12 bg-[#E8DCC4] border-l-4 border-black bg-noise">
        <div className="relative w-24 h-24">
           <div className="absolute inset-0 border-4 border-[#1D1D1B] animate-spin"></div>
           <div className="absolute inset-2 bg-[#E61D23] animate-pulse"></div>
           <div className="absolute inset-6 bg-[#F29422] animate-bounce"></div>
        </div>
        <div className="text-center">
          <h3 className="text-[#1D1D1B] font-extrabold text-2xl uppercase tracking-tighter">ANALYZING DNA</h3>
          <p className="text-[#1D1D1B] font-mono text-sm mt-2 bg-[#F29422] px-2 py-1 border border-black inline-block">
            DECODING VISUAL STRUCTURE...
          </p>
        </div>
      </div>
    );
  }

  // Error State
  if (state.error) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-[#E8DCC4] border-l-4 border-black bg-noise">
        <div className="max-w-md w-full p-8 bg-[#E61D23] border-4 border-black hard-shadow text-center text-[#E8DCC4]">
          <h3 className="text-3xl font-extrabold mb-2 uppercase">ERROR</h3>
          <div className="h-1 w-full bg-black mb-4"></div>
          <p className="font-mono text-sm mb-4">{state.error}</p>
        </div>
      </div>
    );
  }

  // Empty State
  if (!state.result) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#E8DCC4] border-l-4 border-black bg-noise text-[#1D1D1B]">
        <div className="w-32 h-32 border-4 border-[#1D1D1B] flex items-center justify-center relative hard-shadow mb-6">
           {/* Decorative shapes */}
           <div className="absolute top-0 left-0 w-full h-1/2 bg-[#F29422] opacity-20"></div>
           <div className="absolute bottom-0 right-0 w-1/2 h-full bg-[#E61D23] opacity-20"></div>
           <span className="text-4xl font-mono font-bold z-10">YAML</span>
        </div>
        <p className="font-extrabold text-xl uppercase tracking-widest">等待輸入</p>
        <p className="font-mono text-xs mt-2 text-gray-600">WAITING FOR INPUT...</p>
      </div>
    );
  }

  // We are guaranteed to have result here, so we assert non-null for summary/yaml usage in render
  // Note: summary and yaml vars defined at top of component will be valid here.
  const { image_generation_prompt } = state.result;
  const showVisualLab = medium === TargetMedium.SLIDES || medium === TargetMedium.POSTER || medium === TargetMedium.SAAS;
  const showNotebookBridge = medium === TargetMedium.SLIDES;
  const showSpaBridge = medium === TargetMedium.SAAS;

  // Success State
  return (
    <>
    <div className="h-full flex flex-col bg-[#E8DCC4] border-l-4 border-black overflow-hidden bg-noise">
      
      {/* 1. Visual DNA Summary Panel */}
      <div className="bg-[#E8DCC4] border-b-4 border-black p-8 z-10 relative flex-shrink-0">
        {/* Decorative Tag */}
        <div className="absolute top-0 right-0 bg-[#1D1D1B] text-white text-xs font-mono px-3 py-1 border-l-4 border-b-4 border-black">
          ANALYSIS_COMPLETE
        </div>

        <div className="flex items-center gap-3 mb-6">
           <div className="w-4 h-4 bg-[#E61D23] border-2 border-black"></div>
           <h2 className="text-xl font-extrabold text-[#1D1D1B] uppercase tracking-tight">Visual DNA Summary</h2>
        </div>
        
        <div className="flex flex-col gap-6">
           {/* Description Box */}
           <div className="p-4 border-2 border-[#1D1D1B] bg-white hard-shadow-sm">
             <p className="text-[#1D1D1B] font-medium leading-relaxed">
               {summary?.style_description}
             </p>
           </div>

           <div className="flex flex-col xl:flex-row gap-8">
              {/* Color Palette */}
              <div className="flex-1">
                <h3 className="text-xs font-bold uppercase tracking-widest mb-3 border-b-2 border-black pb-1 inline-block">Palette (Click to Copy)</h3>
                <div className="flex flex-wrap gap-0 border-2 border-black hard-shadow-sm">
                  {summary?.primary_colors.map((color, idx) => (
                    <button
                      key={idx} 
                      onClick={() => handleCopyItem(color)}
                      className="group relative flex-1 h-12 min-w-[40px] border-r-2 border-black last:border-r-0 hover:flex-[1.5] transition-all duration-200 cursor-pointer focus:outline-none"
                      title="Click to copy HEX code"
                    >
                      <div 
                        className="w-full h-full"
                        style={{ backgroundColor: color }}
                      ></div>
                      
                      {/* Tooltip / Feedback Status */}
                      <div 
                        className={`
                          absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs border border-white font-mono z-20 pointer-events-none whitespace-nowrap transition-opacity duration-200
                          ${copiedItem === color ? 'bg-[#2D5A27] text-white opacity-100' : 'bg-[#1D1D1B] text-white opacity-0 group-hover:opacity-100'}
                        `}
                      >
                        {copiedItem === color ? 'COPIED!' : color}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mood Keywords */}
              <div className="flex-1">
                <h3 className="text-xs font-bold uppercase tracking-widest mb-3 border-b-2 border-black pb-1 inline-block">Keywords (Click to Copy)</h3>
                <div className="flex flex-wrap gap-2">
                  {summary?.mood_keywords.map((keyword, idx) => (
                    <button 
                      key={idx}
                      onClick={() => handleCopyItem(keyword)}
                      className={`
                        px-3 py-1 text-xs font-bold border-2 border-black hard-shadow-sm transition-all focus:outline-none
                        ${copiedItem === keyword
                          ? 'bg-[#2D5A27] text-white translate-y-0 shadow-none'
                          : 'bg-white text-[#1D1D1B] hover:-translate-y-1 hover:bg-[#F29422]'}
                      `}
                    >
                      {copiedItem === keyword ? 'COPIED!' : `#${keyword}`}
                    </button>
                  ))}
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* 2. Scrollable Content Area */}
      <div className="flex-1 overflow-auto custom-scrollbar flex flex-col">
        
        {/* BRIDGE SECTION: Display different bridge based on Medium */}
        
        {/* A. NotebookLM Bridge (Only for SLIDES) */}
        {showNotebookBridge && (
           <div className="bg-[#1D1D1B] p-6 border-b-4 border-black relative diagonal-pattern">
              <div className="bg-white p-6 border-4 border-[#F29422] hard-shadow relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#F29422] text-[#1D1D1B] font-mono text-xs font-bold px-2 py-1 border border-black">NOTEBOOKLM BRIDGE</div>
                    <h3 className="text-lg font-extrabold text-[#1D1D1B] uppercase">簡報顧問指令</h3>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-4 leading-relaxed font-medium">
                  選擇適合您的工作流程：<br/>
                  1. <b>檔案上傳流程</b>：複製 YAML 規格並儲存為檔案上傳至 NotebookLM，再複製「引導指令」。<br/>
                  2. <b>快速貼上流程</b>：直接複製「完整指令包 (含 YAML)」貼入對話框。
                </p>

                {/* Instruction Display Area */}
                <div className="bg-[#F5F5F0] border border-gray-300 p-4 mb-4 font-mono text-xs text-[#1D1D1B] overflow-y-auto max-h-[200px] leading-relaxed whitespace-pre-wrap shadow-inner">
                   {instructionPart}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <button
                    onClick={handleCopyInstructionOnly}
                    className={`
                      py-3 px-4 font-bold text-xs tracking-widest uppercase border-2 transition-all flex items-center justify-center gap-2
                      ${instructionCopied 
                        ? 'bg-[#2D5A27] text-white border-[#2D5A27]' 
                        : 'bg-white text-[#1D1D1B] border-[#1D1D1B] hover:bg-gray-100'}
                    `}
                  >
                    {instructionCopied ? '已複製指令！' : '1. 僅複製引導指令'}
                  </button>

                  <button
                    onClick={handleCopyFullPrompt}
                    className={`
                      py-3 px-4 font-bold text-xs tracking-widest uppercase border-2 transition-all flex items-center justify-center gap-2
                      ${fullPromptCopied 
                        ? 'bg-[#2D5A27] text-white border-[#2D5A27]' 
                        : 'bg-[#1D1D1B] text-white border-[#1D1D1B] hover:bg-[#F29422] hover:text-[#1D1D1B] hover:border-black'}
                    `}
                  >
                    {fullPromptCopied ? '已複製完整內容！' : '2. 複製完整指令 (含 YAML)'}
                  </button>
                </div>

              </div>
           </div>
        )}

        {/* B. AI Coding Bridge (Only for SaaS/SPA) */}
        {showSpaBridge && (
           <div className="bg-[#1D1D1B] p-6 border-b-4 border-black relative diagonal-pattern">
              <div className="bg-[#2A2A28] p-6 border-4 border-[#E8DCC4] hard-shadow relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#1D1D1B] text-[#E8DCC4] font-mono text-xs font-bold px-2 py-1 border border-[#E8DCC4]">AI CODING BRIDGE</div>
                    <h3 className="text-lg font-extrabold text-[#E8DCC4] uppercase">程式開發指令 (SPA/SaaS)</h3>
                  </div>
                </div>
                
                <p className="text-sm text-gray-400 mb-4 leading-relaxed font-medium">
                  將此指令貼入 <b>Cursor</b>, <b>Windsurf</b>, <b>v0</b> 或 <b>ChatGPT</b>，將視覺設計轉換為 React 程式碼。<br/>
                  系統會指示 AI 嚴格遵守 YAML 中的 Color Tokens 與 App Shell 定義。
                </p>

                {/* Instruction Display Area */}
                <div className="bg-[#1D1D1B] border border-gray-600 p-4 mb-4 font-mono text-xs text-[#E8DCC4] overflow-y-auto max-h-[200px] leading-relaxed whitespace-pre-wrap shadow-inner">
                   {spaInstructionPart}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <button
                    onClick={handleCopySpaInstruction}
                    className={`
                      py-3 px-4 font-bold text-xs tracking-widest uppercase border-2 transition-all flex items-center justify-center gap-2
                      ${spaInstructionCopied 
                        ? 'bg-[#2D5A27] text-white border-[#2D5A27]' 
                        : 'bg-transparent text-[#E8DCC4] border-[#E8DCC4] hover:bg-[#E8DCC4] hover:text-[#1D1D1B]'}
                    `}
                  >
                    {spaInstructionCopied ? '已複製指令！' : '1. 僅複製開發指令'}
                  </button>

                  <button
                    onClick={handleCopyFullSpaPrompt}
                    className={`
                      py-3 px-4 font-bold text-xs tracking-widest uppercase border-2 transition-all flex items-center justify-center gap-2
                      ${fullSpaPromptCopied 
                        ? 'bg-[#2D5A27] text-white border-[#2D5A27]' 
                        : 'bg-[#F29422] text-[#1D1D1B] border-black hover:bg-white hover:border-[#F29422]'}
                    `}
                  >
                    {fullSpaPromptCopied ? '已複製完整內容！' : '2. 複製完整指令 (含 YAML)'}
                  </button>
                </div>

              </div>
           </div>
        )}

        {/* YAML Section */}
        <div className="bg-white min-h-[400px] flex flex-col border-b-4 border-black relative">
           <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-3 border-b-4 border-black bg-[#1D1D1B]">
            <h2 className="text-sm font-bold text-[#E8DCC4] uppercase tracking-widest font-mono flex items-center gap-2">
              <span className="w-2 h-2 bg-[#F29422]"></span>
              YAML Specification
            </h2>
            <button
              onClick={handleCopy}
              className={`
                text-xs font-bold px-4 py-2 font-mono uppercase tracking-wider border-2 transition-all
                ${copied 
                  ? 'bg-[#2D5A27] text-white border-white' 
                  : 'bg-[#E61D23] text-[#1D1D1B] border-[#1D1D1B] hover:bg-white hover:border-[#E61D23]'}
              `}
            >
              {copied ? 'COPIED!' : 'COPY CODE'}
            </button>
          </div>
          <div className="flex-1 p-8">
             <pre className="font-mono text-sm text-[#1D1D1B] leading-relaxed whitespace-pre-wrap">
              {yaml}
            </pre>
          </div>
        </div>

        {/* 3. Visual Lab Section (Conditional) */}
        {showVisualLab && (
          <div className="bg-[#E8DCC4] p-8 border-b-4 border-black">
             <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-[#1D1D1B] text-white flex items-center justify-center font-bold text-lg hard-shadow-sm border border-black">!</div>
                <h2 className="text-xl font-extrabold text-[#1D1D1B] uppercase tracking-tight">Visual Lab</h2>
                <span className="ml-auto text-xs font-bold bg-[#F29422] border border-black px-2 py-1 hard-shadow-sm">EXPERIMENTAL</span>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Prompt Section */}
                <div className="flex flex-col gap-4">
                  <div className="bg-white border-2 border-black p-4 hard-shadow-sm relative group">
                    <p className="font-mono text-xs text-gray-500 mb-2 uppercase tracking-wide">// PROMPT FOR GENERATION</p>
                    <p className="text-[#1D1D1B] text-sm font-medium leading-relaxed">
                      {image_generation_prompt}
                    </p>
                    <button 
                      onClick={handleCopyPrompt}
                      className="absolute top-2 right-2 p-2 bg-[#E8DCC4] border border-black hover:bg-[#F29422] transition-colors"
                      title="Copy Prompt"
                    >
                       <svg className="w-4 h-4 text-[#1D1D1B]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </button>
                    {promptCopied && <div className="absolute top-2 right-12 text-xs bg-black text-white px-2 py-1">COPIED</div>}
                  </div>
                  
                  <button
                    onClick={handleGeneratePreview}
                    disabled={isGeneratingImage}
                    className={`
                      py-4 px-6 font-extrabold text-sm tracking-widest uppercase border-2 border-black transition-all
                      flex items-center justify-center gap-2 hard-shadow
                      ${isGeneratingImage 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-[#E61D23] text-[#1D1D1B] hover:translate-x-1 hover:translate-y-1 hover:shadow-none hover:bg-white'}
                    `}
                  >
                    {isGeneratingImage ? (
                      <>
                        <span className="animate-spin mr-2">◐</span> GENERATING...
                      </>
                    ) : (
                      <>
                        {getGenerateButtonLabel()} 
                        <span className="text-xs bg-black text-white px-1 ml-1">BETA</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Result Image (Preview) */}
                <div className={`
                  relative w-full bg-[#1D1D1B] border-4 border-black flex items-center justify-center hard-shadow diagonal-pattern overflow-hidden
                  ${medium === TargetMedium.SLIDES ? 'aspect-video' : 'aspect-[3/4]'}
                `}>
                   {!generatedImageUrl && !isGeneratingImage && !imageError && (
                     <div className="text-center p-6">
                        <div className="w-12 h-12 border-2 border-dashed border-[#E8DCC4] mx-auto mb-2 flex items-center justify-center opacity-50 rounded-full">
                           <svg className="w-6 h-6 text-[#E8DCC4]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <p className="text-[#E8DCC4] font-mono text-xs uppercase">Preview Area</p>
                     </div>
                   )}

                   {isGeneratingImage && (
                     <div className="text-center z-10">
                        <div className="w-16 h-16 border-4 border-[#E61D23] border-t-transparent animate-spin rounded-full mx-auto mb-4"></div>
                        <p className="text-[#E8DCC4] font-bold tracking-widest animate-pulse">RENDERING PIXELS...</p>
                     </div>
                   )}
                   
                   {imageError && !isGeneratingImage && (
                     <div className="text-center p-6 w-full">
                        <div className="bg-[#E61D23] text-white p-4 border-2 border-black hard-shadow-sm">
                           <p className="font-bold text-xs uppercase mb-1">GENERATION FAILED</p>
                           <p className="font-mono text-xs">{imageError}</p>
                        </div>
                     </div>
                   )}

                   {generatedImageUrl && (
                     <div 
                        className="absolute inset-0 w-full h-full group cursor-zoom-in"
                        onClick={() => setIsLightboxOpen(true)}
                      >
                        <img src={generatedImageUrl} alt="AI Generated Preview" className="w-full h-full object-cover" />
                        
                        {/* Zoom Hint Overlay */}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <div className="bg-white border-2 border-black px-4 py-2 flex items-center gap-2 hard-shadow-sm transform translate-y-4 group-hover:translate-y-0 transition-transform duration-200">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" /></svg>
                             <span className="font-bold text-xs tracking-widest text-[#1D1D1B]">ENLARGE</span>
                           </div>
                        </div>

                        <a 
                          href={generatedImageUrl} 
                          download={`visual-spec-${Date.now()}.png`}
                          onClick={(e) => e.stopPropagation()} 
                          className="absolute bottom-4 right-4 bg-white border-2 border-black px-3 py-1 text-xs font-bold hover:bg-[#F29422] opacity-0 group-hover:opacity-100 transition-opacity hard-shadow-sm z-10"
                        >
                          DOWNLOAD
                        </a>
                     </div>
                   )}
                </div>
             </div>
          </div>
        )}
      </div>
    </div>

    {/* Lightbox Portal */}
    {isLightboxOpen && generatedImageUrl && (
      <div 
        className="fixed inset-0 z-[9999] bg-[#1D1D1B]/95 backdrop-blur-md flex items-center justify-center p-4 md:p-8 cursor-zoom-out animate-in fade-in duration-200"
        onClick={() => setIsLightboxOpen(false)}
      >
         <div className="relative max-w-[95vw] max-h-[95vh] w-auto h-auto">
            <img 
              src={generatedImageUrl} 
              alt="Full Scale Preview" 
              className="max-w-full max-h-[90vh] object-contain border-4 border-black hard-shadow shadow-2xl"
              onClick={(e) => e.stopPropagation()} 
            />
            
            <button 
              onClick={() => setIsLightboxOpen(false)}
              className="absolute -top-6 -right-6 md:-right-12 text-[#E8DCC4] hover:text-[#E61D23] transition-colors p-2"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
               <a 
                href={generatedImageUrl} 
                download={`visual-spec-full-${Date.now()}.png`}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#E61D23] text-white border-2 border-black px-6 py-2 font-bold hover:bg-white hover:text-[#1D1D1B] hard-shadow transition-colors uppercase tracking-widest text-sm"
              >
                Download High-Res
              </a>
            </div>
         </div>
      </div>
    )}
    </>
  );
};