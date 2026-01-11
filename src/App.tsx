import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { twMerge } from 'tailwind-merge';

// 按鈕組件
function Button({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={twMerge(
        "px-4 py-2 rounded-md font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
        "bg-white text-black hover:bg-gray-200",
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
  
  // 處理檔案拖入
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selected = acceptedFiles[0];
    if (selected) {
      setFile(selected);
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: {'image/*': ['.jpeg', '.jpg', '.png']},
    multiple: false
  });

  // 核心邏輯：切圖並下載
  const handleDownload = async () => {
    if (!file || !previewUrl) return;
    setIsProcessing(true);

    try {
      const img = new Image();
      img.src = previewUrl;
      await new Promise((resolve) => { img.onload = resolve; });

      const zip = new JSZip();
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
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${file.name.split('.')[0]}_slices.zip`);

    } catch (error) {
      console.error("Slicing failed", error);
      alert("Something went wrong.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 p-8 flex flex-col items-center font-sans">
      <header className="w-full max-w-4xl mb-12 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tighter text-white">
          INSTA<span className="text-gray-500">SLICER</span>
        </h1>
        <div className="text-sm text-gray-500">v0.1.0 Beta</div>
      </header>

      <main className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* 左側控制區 */}
        <div className="md:col-span-1 space-y-6">
          <div 
            {...getRootProps()} 
            className={twMerge(
              "border-2 border-dashed rounded-xl h-40 flex flex-col items-center justify-center cursor-pointer transition-colors",
              isDragActive ? "border-white bg-[#1f1f1f]" : "border-gray-700 hover:border-gray-500"
            )}
          >
            <input {...getInputProps()} />
            <p className="text-sm text-gray-400">
              {isDragActive ? "Drop here..." : "Drag & Drop Image"}
            </p>
          </div>

          {file && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div>
                <label className="block text-xs font-uppercase text-gray-500 mb-2">Slices</label>
                <div className="flex gap-2">
                  {[2, 3, 4, 5].map(num => (
                    <button
                      key={num}
                      onClick={() => setSliceCount(num)}
                      className={twMerge(
                        "flex-1 py-2 rounded border text-sm transition-colors",
                        sliceCount === num 
                          ? "bg-white text-black border-white" 
                          : "border-gray-700 hover:border-gray-500"
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={handleDownload} disabled={isProcessing} className="w-full h-12">
                {isProcessing ? "Processing..." : "Download ZIP"}
              </Button>
            </div>
          )}
        </div>

        {/* 右側預覽區 */}
        <div className="md:col-span-2 bg-[#1f1f1f] rounded-xl p-4 min-h-[500px] flex items-center justify-center border border-gray-800 relative overflow-hidden">
          {!previewUrl ? (
            <div className="text-gray-600 text-sm">No image loaded</div>
          ) : (
            <div className="relative max-w-full">
              <img src={previewUrl} alt="Preview" className="max-w-full max-h-[600px] object-contain rounded shadow-2xl" />
              <div className="absolute inset-0 grid pointer-events-none" style={{ gridTemplateColumns: `repeat(${sliceCount}, 1fr)` }}>
                {Array.from({ length: sliceCount }).map((_, i) => (
                  <div key={i} className={twMerge("border-r border-red-500/50 h-full", i === sliceCount - 1 && "border-r-0")}>
                    <div className="bg-black/50 text-white text-[10px] p-1 inline-block m-1 rounded">{i + 1}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;