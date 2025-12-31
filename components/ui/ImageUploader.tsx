import React from 'react';
import { ImageData } from '../../types';
import { fileToImageData } from '../../utils/helpers';
import { ProgressBar } from './ProgressBar';
import { LightBoxIcon, BoltIcon, ArrowRightIcon } from '../icons';

interface ImageUploaderProps {
  onImageUpload: (data: ImageData) => void;
  imagePreview: string | null;
  isLoading: boolean;
  promptText?: string;
  showAnalyzeButton?: boolean;
  onAnalyzeClick?: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageUpload,
  imagePreview,
  isLoading,
  promptText = "Drop your work here to begin.",
  showAnalyzeButton = false,
  onAnalyzeClick,
}) => {
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const imageData = await fileToImageData(file);
        onImageUpload(imageData);
      } catch (error) {
        console.error("Error converting file to base64", error);
      }
    }
  };

  return (
    <div className="w-full h-full min-h-[500px] border border-dashed border-white/10 rounded-2xl text-center cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all duration-500 relative flex items-center justify-center bg-surface group overflow-hidden shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 pointer-events-none"></div>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        id="image-upload"
        onChange={handleFileChange}
        disabled={isLoading}
      />
      <label
        htmlFor="image-upload"
        className="cursor-pointer w-full h-full flex flex-col items-center justify-center p-8 z-10"
      >
        {imagePreview ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <img
              src={imagePreview}
              alt="Preview"
              className={`max-h-[70vh] rounded-lg transition-opacity ${
                isLoading ? 'opacity-30 blur-sm' : 'opacity-100'
              } shadow-2xl border border-white/10`}
            />

            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <ProgressBar label="Analyzing..." />
              </div>
            )}

            {showAnalyzeButton && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-lg">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onAnalyzeClick?.();
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-indigo-500/30 flex items-center gap-2 transform hover:scale-105 transition-all text-lg border border-white/10"
                >
                  <BoltIcon className="w-6 h-6" /> Analyze Now
                </button>
              </div>
            )}
          </div>
        ) : (
          !isLoading && (
            <div className="text-gray-400 space-y-6 transition-transform group-hover:-translate-y-2 duration-500">
              <div className="w-24 h-24 bg-surfaceHighlight rounded-3xl flex items-center justify-center mx-auto border border-white/5 shadow-[0_0_40px_-10px_rgba(99,102,241,0.3)] group-hover:scale-110 transition-transform duration-500">
                <LightBoxIcon className="w-10 h-10 text-indigo-400" />
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-display font-bold text-white tracking-tight">
                  {promptText}
                </p>
                <p className="text-base text-gray-500 max-w-sm mx-auto font-light">
                  Upload high-res imagery for monetization scoring and enhancement.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-full font-medium text-sm backdrop-blur-md transition-all">
                <span>Select from device</span>
                <ArrowRightIcon className="w-4 h-4" />
              </div>
            </div>
          )
        )}
      </label>
    </div>
  );
};
