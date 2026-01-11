import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';
import { twMerge } from 'tailwind-merge';

// 按鈕組件
function Button({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={twMerge(
        "px-4 py-2 rounded-md font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
        "bg-white text-black hover:bg-gray-200 active:scale-95",
        className
      )}
      {...props}
    />
  );
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sliceCount, setSliceCount] = useState(3);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedSlices, setGeneratedSlices] = useState<string[]>([]);
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selected = acceptedFiles[0];
    if (selected) {
      setFile(selected);
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);
      setGeneratedSlices([]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: {'image/*': ['.jpeg', '.jpg', '.png']},
    multiple: false
  });

  const handleProcess = async () => {
    if (!file || !previewUrl) return;
    setIsProcessing(true);
    setGeneratedSlices([]); 

    try {
      const img = new Image();
      img.src = previewUrl;
      await new Promise((resolve) => { img.onload = resolve; });

      const zip = new JSZip();
      const newSlices: string[] = [];
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      const sliceWidth = img.width / sliceCount;
      const sliceHeight = img.height;

      canvas.width = sliceWidth;
      canvas.height = sliceHeight;

      for (let i = 0; i < sliceCount; i++) {
        ctx.clearRect(0, 0, sliceWidth, sliceHeight);
        ctx.drawImage(
          img, 
          i * sliceWidth, 0, sliceWidth, sliceHeight, 
          0, 0, sliceWidth, sliceHeight
        );

        const blob = await new Promise<Blob | null>(resolve => 
          canvas.toBlob(resolve, 'image/jpeg', 0.95)
        );
        
        if (blob) {
          zip.file(`slice_${i + 1}.jpg`, blob);
          const sliceUrl = URL.createObjectURL(blob);
          newSlices.push(sliceUrl);
        }
      }
      setGeneratedSlices(newSlices);

    } catch (error) {
      console.error("Slicing failed", error);
      alert("Something went wrong.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 p-4 md:p-8 font-sans pb-24 overflow-x-hidden">
      <header className="w-full max-w-4xl mx-auto mb-8 flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-bold tracking-tighter text-white">
          GK<span className="text-gray-500">SPLIT</span>
        </h1>
        <div className="text-xs md:text-sm text-gray-500 bg-gray-900 px-2 py-1 rounded border border-gray-800">
          v0.2.2 Mobile Fix
        </div>
      </header>

      <main className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        
        {/* 左側：控制區 */}
        <div className="md:col-span-1 space-y-6 order-1">
          <div 
            {...getRootProps()} 
            className={twMerge(
              "border-2 border-dashed rounded-xl h-32 md:h-40 flex flex-col items-center justify-center cursor-pointer transition-colors active:bg-[#2a2a2a]",
              isDragActive ? "border-white bg-[#1f1f1f]" : "border-gray-700 hover:border-gray-500"
            )}
          >
            <input {...getInputProps()} />
            <p className="text-sm text-gray-400 font-medium">
              {file ? "Change Image" : "Tap to Upload"}
            </p>
          </div>

          {file && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-wider">Slices</label>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 3, 4, 5].map(num => (
                    <button
                      key={num}
                      onClick={() => setSliceCount(num)}
                      className={twMerge(
                        "py-3 md:py-2 rounded-lg border text-sm font-medium transition-all active:scale-95",
                        sliceCount === num 
                          ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]" 
                          : "bg-transparent border-gray-700 text-gray-400 hover:border-gray-500"
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
              
              <Button onClick={handleProcess} disabled={isProcessing} className="w-full h-14 md:h-12 text-lg md:text-base font-bold shadow-lg shadow-blue-900/20">
                {isProcessing ? "Processing..." : "Slice It ✨"}
              </Button>
            </div>
          )}
        </div>

        {/* 右側：預覽與結果 (在手機上會排在控制區下面) */}
        <div className="md:col-span-2 space-y-8 order-2 min-w-0">
            {/* 1. 切割預覽圖 */}
            {previewUrl && (
              <div className="bg-[#1f1f1f] rounded-xl p-2 md:p-4 flex items-center justify-center border border-gray-800 relative overflow-hidden min-h-[200px]">
                  <div className="relative w-full">
                    <img src={previewUrl} alt="Preview" className="w-full h-auto max-h-[400px] object-contain rounded opacity-60" />
                    {/* 紅色分割線 */}
                    <div className="absolute inset-0 grid pointer-events-none" style={{ gridTemplateColumns: `repeat(${sliceCount}, 1fr)` }}>
                        {Array.from({ length: sliceCount }).map((_, i) => (
                        <div key={i} className={twMerge("border-r border-red-500/80 h-full flex flex-col justify-end pb-2", i === sliceCount - 1 && "border-r-0")}>
                           {/* 數字標籤改在下方，避免擋住主體 */}
                           <div className="text-center">
                              <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">{i + 1}</span>
                           </div>
                        </div>
                        ))}
                    </div>
                  </div>
              </div>
            )}

            {/* 2. Gallery Mode (手機版橫向滑動區) */}
            {generatedSlices.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <h3 className="text-white font-bold text-lg">Results</h3>
                      <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full border border-blue-400/20">
                        Long press to save
                      </span>
                    </div>
                    
                    {/* 這裡加了 max-w 和 mx-auto 防止手機破版 */}
                    <div className="w-full max-w-[calc(100vw-2rem)] mx-auto">
                      <div className="flex overflow-x-auto gap-3 pb-6 snap-x snap-mandatory scrollbar-hide">
                          {generatedSlices.map((sliceUrl, index) => (
                              <div key={index} className="flex-none w-[160px] md:w-[200px] relative group snap-center first:pl-1 last:pr-1">
                                  <img 
                                      src={sliceUrl} 
                                      className="w-full rounded-lg border border-gray-700 shadow-xl bg-black" 
                                      alt={`Slice ${index + 1}`} 
                                  />
                                  <div className="absolute top-2 left-2 bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-md border border-white/10">
                                      {index + 1} / {sliceCount}
                                  </div>
                              </div>
                          ))}
                      </div>
                    </div>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}

export default App;