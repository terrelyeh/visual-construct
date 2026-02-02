import React, { useRef } from 'react';
import { VisualAsset } from '../types';

interface AssetUploaderProps {
  assets: VisualAsset[];
  onAssetsChange: (assets: VisualAsset[]) => void;
  onReset: () => void;
}

export const AssetUploader: React.FC<AssetUploaderProps> = ({ assets, onAssetsChange, onReset }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newAssets: VisualAsset[] = Array.from(files).map(file => ({
      id: generateId(),
      type: 'file',
      file,
      previewUrl: URL.createObjectURL(file)
    }));
    onAssetsChange([...assets, ...newAssets]);
  };

  const removeAsset = (id: string) => {
    onAssetsChange(assets.filter(a => a.id !== id));
  };

  const handleInternalReset = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onReset();
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#E61D23]"></div>
          <label className="block text-sm font-bold text-[#E8DCC4] font-mono uppercase tracking-widest">
            01. 建立情緒板 (MOODBOARD)
          </label>
        </div>
        
        <div className="flex items-center gap-3">
          {assets.length > 0 && (
            <button
              onClick={handleInternalReset}
              className="text-xs font-mono font-bold text-[#E61D23] hover:text-white hover:bg-[#E61D23] px-2 py-0.5 transition-all uppercase border-b border-[#E61D23] hover:border-transparent"
            >
              RESET / CLEAR
            </button>
          )}
          <span className="text-xs font-mono bg-[#1D1D1B] text-[#E8DCC4] px-2 border border-[#E8DCC4]">
            COUNT: {assets.length}
          </span>
        </div>
      </div>
      
      {/* Main Drop/Grid Area */}
      <div className="min-h-[288px] bg-[#1D1D1B] border-4 border-[#333] p-4 relative bg-noise">
         
         {/* Grid View */}
         {assets.length > 0 && (
           <div className="grid grid-cols-2 gap-4 mb-4">
              {assets.map((asset) => (
                <div key={asset.id} className="relative aspect-square group border-2 border-[#555] hover:border-[#F29422] transition-colors bg-black">
                   <img src={asset.previewUrl} alt="asset" className="w-full h-full object-cover transition-all duration-300" />
                   <button 
                    onClick={() => removeAsset(asset.id)}
                    className="absolute top-0 right-0 bg-[#E61D23] text-white w-6 h-6 flex items-center justify-center border-l-2 border-b-2 border-black hover:bg-white hover:text-[#E61D23]"
                   >
                     ×
                   </button>
                </div>
              ))}
              
              {/* Add More Button (Grid Item) */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square border-2 border-dashed border-[#555] flex flex-col items-center justify-center cursor-pointer hover:border-[#E8DCC4] hover:bg-[#2A2A28] transition-all group"
              >
                 <span className="text-4xl text-[#555] group-hover:text-[#E8DCC4]">+</span>
                 <span className="text-xs font-mono text-[#555] group-hover:text-[#E8DCC4] uppercase mt-2">Add Image</span>
              </div>
           </div>
         )}

         {/* Empty State / Dropzone Overlay */}
         {assets.length === 0 && (
            <div 
              className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-[#2A2A28] transition-colors z-10"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFiles(e.dataTransfer.files);
              }}
            >
                <div className="w-16 h-16 bg-[#1D1D1B] flex items-center justify-center mx-auto mb-4 border-4 border-black hard-shadow">
                  <svg className="w-8 h-8 text-[#E8DCC4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <p className="text-[#E8DCC4] font-extrabold text-xl uppercase tracking-tighter">DROP IMAGES</p>
                <p className="text-gray-500 font-mono text-xs mt-2 uppercase">Create your moodboard</p>
            </div>
         )}
         
         <input 
            type="file" 
            ref={fileInputRef} 
            onChange={(e) => handleFiles(e.target.files)} 
            accept="image/*" 
            multiple
            className="hidden" 
          />
      </div>
    </div>
  );
};