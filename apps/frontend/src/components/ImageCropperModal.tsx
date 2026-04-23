import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Area } from 'react-easy-crop';

// Utility helper to crop the image using canvas
const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => (image.onload = resolve));

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Canvas 2d context not supported');
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      resolve(blob);
    }, 'image/webp', 0.9);
  });
};

interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
  onCropComplete: (croppedBlob: Blob) => void;
  aspectRatio?: number;
}

export default function ImageCropperModal({ 
  isOpen, 
  onClose, 
  imageSrc, 
  onCropComplete,
  aspectRatio = 16 / 9
}: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  if (!isOpen || !imageSrc) return null;

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedBlob);
    } catch (e) {
      console.error(e);
      alert('Gagal memotong gambar.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col relative shadow-2xl">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="font-bold text-slate-800">Edit Gambar (Crop)</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="relative w-full bg-slate-900" style={{ height: '400px' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>

        <div className="p-5 flex flex-col gap-4 bg-white">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-slate-600">Zoom</span>
            <input 
              type="range" 
              value={zoom} 
              min={1} 
              max={3} 
              step={0.1}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-indigo-600"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button 
              onClick={onClose}
              disabled={isProcessing}
              className="px-5 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button 
              onClick={handleSave}
              disabled={isProcessing}
              className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              {isProcessing ? 'Memproses...' : 'Terapkan (Potong)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
