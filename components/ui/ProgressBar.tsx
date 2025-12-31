import React, { useState, useEffect } from 'react';

interface ProgressBarProps {
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ label = "Processing..." }) => {
  const [progress, setProgress] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) return 100;
        const diff = Math.random() * 10;
        const increment = diff * (1 - oldProgress / 100);
        return Math.min(oldProgress + increment, 95);
      });
    }, 200);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="w-full max-w-xs p-4 bg-gray-900/90 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl animate-fade-in z-50">
      <div className="flex justify-between mb-2">
        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{label}</span>
        <span className="text-xs font-mono text-gray-400">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-gray-700/50 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all duration-200 ease-out relative"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};
