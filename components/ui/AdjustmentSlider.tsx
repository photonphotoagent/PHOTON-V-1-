import React from 'react';

interface AdjustmentSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
  step?: number;
}

export const AdjustmentSlider: React.FC<AdjustmentSliderProps> = ({
  label,
  value,
  min,
  max,
  onChange,
  step = 1,
}) => (
  <div className="space-y-2">
    <div className="flex justify-between text-xs font-semibold text-gray-400 uppercase tracking-wide">
      <span>{label}</span>
      <span className="text-white bg-white/10 px-1.5 py-0.5 rounded font-mono">
        {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(2) : value}
      </span>
    </div>
    <div className="relative flex items-center h-5">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
      />
    </div>
  </div>
);

interface TabButtonProps {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

export const TabButton: React.FC<TabButtonProps> = ({ active, icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all duration-200 ${
      active
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
        : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
    }`}
  >
    {icon}
    <span className="text-[10px] uppercase font-bold tracking-wider">{label}</span>
  </button>
);
