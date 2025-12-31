import React, { useState, useRef, useEffect } from 'react';
import { ImageData, AnalysisResult, ImageAdjustments, EditHistoryItem } from '../../types';
import * as GeminiService from '../../services/geminiService';
import { fileToImageData, downloadImage } from '../../utils/helpers';
import { ImageUploader } from '../ui/ImageUploader';
import { ProgressBar } from '../ui/ProgressBar';
import { AdjustmentSlider, TabButton } from '../ui/AdjustmentSlider';
import { Spinner } from '../Spinner';
import {
  WrenchScrewdriverIcon,
  SparklesIcon,
  ArrowsPointingOutIcon,
  ScissorsIcon,
  PaintBrushIcon,
  PlayIcon,
  ArrowRightIcon,
  SunIcon,
  SwatchIcon,
  ApertureIcon,
  BoltIcon,
  RectangleStackIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  XCircleIcon,
  BrushIcon,
  EraserIcon,
  ChatBubbleLeftRightIcon,
  PaperClipIcon,
  CurvesIcon,
  SplitToningIcon,
  EyeDropperIcon,
} from '../icons';

// Smart Presets
const PRESETS: { name: string; adjustments: Partial<ImageAdjustments>; colorClass: string }[] = [
  {
    name: 'Golden Hour',
    adjustments: { exposure: 105, warmth: 20, contrast: 110, saturation: 110, tint: -5 },
    colorClass: 'from-orange-400 to-yellow-500',
  },
  {
    name: 'Moody Matte',
    adjustments: { contrast: 90, shadows: 115, saturation: 85, exposure: 95, blur: 0 },
    colorClass: 'from-gray-600 to-gray-800',
  },
  {
    name: 'Cyberpunk',
    adjustments: { tint: -20, saturation: 130, vibrance: 120, contrast: 115, highlights: 110 },
    colorClass: 'from-pink-500 to-cyan-500',
  },
  {
    name: 'B&W Noir',
    adjustments: { saturation: 0, contrast: 135, grain: 40, vignette: 30, exposure: 105 },
    colorClass: 'from-gray-900 to-black',
  },
  {
    name: 'Film Pop',
    adjustments: { contrast: 110, saturation: 115, grain: 15, warmth: 5 },
    colorClass: 'from-red-500 to-yellow-500',
  },
  {
    name: 'Ethereal',
    adjustments: { exposure: 110, contrast: 95, blur: 1, saturation: 105, warmth: -5 },
    colorClass: 'from-indigo-300 to-purple-300',
  },
];

const defaultAdjustments: ImageAdjustments = {
  exposure: 100,
  contrast: 100,
  highlights: 100,
  shadows: 100,
  gamma: 1.0,
  saturation: 100,
  vibrance: 100,
  warmth: 0,
  tint: 0,
  blur: 0,
  sharpen: 0,
  vignette: 0,
  grain: 0,
  redChannel: 100,
  greenChannel: 100,
  blueChannel: 100,
  highlightsHue: 0,
  highlightsSat: 0,
  shadowsHue: 0,
  shadowsSat: 0,
};

interface EditViewProps {
  initialImage: ImageData | null;
  analysis: AnalysisResult | null;
  onSendToLightBox: (imageData: ImageData, shouldAnalyze: boolean) => void;
  onUploadNew: () => void;
}

export const EditView: React.FC<EditViewProps> = ({
  initialImage,
  analysis,
  onSendToLightBox,
  onUploadNew,
}) => {
  const [image, setImage] = useState<ImageData | null>(initialImage);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeQuickEdit, setActiveQuickEdit] = useState<string | null>(null);
  const [history, setHistory] = useState<EditHistoryItem[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [compareSplit, setCompareSplit] = useState(50);
  const [activeCategory, setActiveCategory] = useState<'light' | 'color' | 'detail' | 'grade' | 'mixer'>('light');

  // Annotation / Mask State
  const [annotationMode, setAnnotationMode] = useState<'none' | 'brush' | 'eraser'>('none');
  const [brushSize, setBrushSize] = useState(20);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasMask, setHasMask] = useState(false);
  const [applyToSelection, setApplyToSelection] = useState(false);

  // Style Match AI State
  const [stylePrompt, setStylePrompt] = useState('');
  const [refImagePreview, setRefImagePreview] = useState<string | null>(null);
  const [refImageBase64, setRefImageBase64] = useState<string | null>(null);
  const [isStyleMatching, setIsStyleMatching] = useState(false);

  const [adjustments, setAdjustments] = useState<ImageAdjustments>(defaultAdjustments);

  // Initialize history
  useEffect(() => {
    if (initialImage && history.length === 0) {
      setHistory([
        {
          id: 'initial',
          thumbnail: initialImage.preview,
          actionName: 'Original',
          imageData: initialImage,
          adjustments: defaultAdjustments,
          timestamp: Date.now(),
        },
      ]);
    }
  }, [initialImage]);

  // Canvas resize
  useEffect(() => {
    const resizeCanvas = () => {
      if (canvasRef.current?.parentElement) {
        const img = canvasRef.current.parentElement.querySelector('img');
        if (img) {
          canvasRef.current.width = img.clientWidth;
          canvasRef.current.height = img.clientHeight;
        }
      }
    };
    window.addEventListener('resize', resizeCanvas);
    const t = setTimeout(resizeCanvas, 100);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      clearTimeout(t);
    };
  }, [image]);

  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const drawSmooth = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || annotationMode === 'none' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = (e as React.MouseEvent).clientX - rect.left;
      y = (e as React.MouseEvent).clientY - rect.top;
    }

    if (lastPos.current) {
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (annotationMode === 'brush') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      } else {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      }

      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    lastPos.current = { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (annotationMode === 'none') return;
    setIsDrawing(true);
    const rect = canvasRef.current!.getBoundingClientRect();
    lastPos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) setHasMask(true);
  };

  const clearMask = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setHasMask(false);
    }
  };

  const addToHistory = (newImage: ImageData, actionName: string, newAdjustments: ImageAdjustments) => {
    setHistory((prev) => [
      {
        id: Date.now().toString(),
        thumbnail: newImage.preview,
        actionName,
        imageData: newImage,
        adjustments: newAdjustments,
        timestamp: Date.now(),
      },
      ...prev,
    ]);
  };

  const handleHistoryClick = (item: EditHistoryItem) => {
    setImage(item.imageData);
    if (item.adjustments) setAdjustments(item.adjustments);
  };

  const executeEdit = async (editPrompt: string, quickEditName: string | null = null) => {
    if (!editPrompt || !image) return;
    setIsLoading(true);
    setActiveQuickEdit(quickEditName);
    try {
      let maskBase64: string | undefined = undefined;
      if (applyToSelection && hasMask && canvasRef.current) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvasRef.current.width;
        tempCanvas.height = canvasRef.current.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.fillStyle = 'black';
          tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
          tempCtx.drawImage(canvasRef.current, 0, 0);
          const dataUrl = tempCanvas.toDataURL('image/png');
          maskBase64 = dataUrl.split(',')[1];
        }
      }

      const newBase64 = await GeminiService.editImage(editPrompt, image.base64, image.mimeType, maskBase64);
      const newImageData = {
        base64: newBase64,
        mimeType: 'image/png',
        preview: `data:image/png;base64,${newBase64}`,
      };
      setImage(newImageData);
      addToHistory(
        newImageData,
        quickEditName || (applyToSelection ? 'Generative Fill (Selection)' : 'Generative Fill'),
        adjustments
      );
      if (applyToSelection) clearMask();
    } catch (error) {
      console.error('Error editing image:', error);
    } finally {
      setIsLoading(false);
      setActiveQuickEdit(null);
    }
  };

  const executeUpscale = async () => {
    if (!image) return;
    setIsLoading(true);
    setActiveQuickEdit('Upscale');
    try {
      const newBase64 = await GeminiService.upscaleImage(image.base64, image.mimeType);
      const newImageData = {
        base64: newBase64,
        mimeType: image.mimeType,
        preview: `data:${image.mimeType};base64,${newBase64}`,
      };
      setImage(newImageData);
      addToHistory(newImageData, 'Upscale (24MP)', adjustments);
    } catch (error) {
      console.error('Error upscaling image:', error);
    } finally {
      setIsLoading(false);
      setActiveQuickEdit(null);
    }
  };

  const handleDownload = () => {
    if (image) downloadImage(image.base64, `photon_edit_${Date.now()}.png`);
  };

  const handleRefUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const imageData = await fileToImageData(file);
        setRefImagePreview(imageData.preview);
        setRefImageBase64(imageData.base64);
      } catch (error) {
        console.error('Error reading ref file', error);
      }
    }
  };

  const handleStyleMatch = async () => {
    if (!stylePrompt && !refImageBase64) return;
    setIsStyleMatching(true);
    try {
      const newAdjustments = await GeminiService.generateAdjustments(stylePrompt, refImageBase64 || undefined);
      setAdjustments((prev) => ({ ...prev, ...newAdjustments }));
    } catch (error) {
      console.error('Style match failed', error);
    } finally {
      setIsStyleMatching(false);
    }
  };

  const applyPreset = (presetValues: Partial<ImageAdjustments>) => {
    setAdjustments({ ...defaultAdjustments, ...presetValues });
  };

  const autoEnhance = () => {
    applyPreset({
      exposure: 108,
      contrast: 110,
      saturation: 105,
      highlights: 90,
      shadows: 110,
      gamma: 1.05,
    });
  };

  const getFilterString = (adj: ImageAdjustments) => {
    return `brightness(${adj.exposure}%) contrast(${adj.contrast}%) saturate(${adj.saturation}%) sepia(${
      adj.warmth > 0 ? adj.warmth : 0
    }%) hue-rotate(${adj.tint}deg) blur(${adj.blur}px)`;
  };

  const updateAdj = (key: keyof ImageAdjustments, val: number) => {
    setAdjustments((prev) => ({ ...prev, [key]: val }));
  };

  const handleImageUpload = (imageData: ImageData) => {
    setImage(imageData);
    setHistory([
      {
        id: 'initial',
        thumbnail: imageData.preview,
        actionName: 'Original',
        imageData: imageData,
        adjustments: defaultAdjustments,
        timestamp: Date.now(),
      },
    ]);
  };

  if (!image) {
    return (
      <div className="p-8 max-w-4xl mx-auto pt-24">
        <ImageUploader onImageUpload={handleImageUpload} imagePreview={null} isLoading={false} promptText="Open image in Darkroom" />
      </div>
    );
  }

  const activeFilter = getFilterString(adjustments);
  const r = adjustments.redChannel / 100;
  const g = adjustments.greenChannel / 100;
  const b = adjustments.blueChannel / 100;
  const warmthVal = adjustments.warmth / 100;
  const rW = warmthVal > 0 ? 1 + warmthVal * 0.2 : 1 - Math.abs(warmthVal) * 0.1;
  const bW = warmthVal > 0 ? 1 - warmthVal * 0.1 : 1 + Math.abs(warmthVal) * 0.2;
  const shadowColor = `hsl(${adjustments.shadowsHue}, ${adjustments.shadowsSat}%, 50%)`;
  const highlightColor = `hsl(${adjustments.highlightsHue}, ${adjustments.highlightsSat}%, 50%)`;
  const originalImageSrc = history.length > 0 ? history[history.length - 1].thumbnail : image.preview;

  return (
    <div className="h-screen pt-20 flex flex-col md:flex-row bg-surface overflow-hidden">
      {/* SVG Filters */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="advancedCorrections">
            <feColorMatrix
              type="matrix"
              values={`${r * rW} 0 0 0 0 0 ${g} 0 0 0 0 0 ${b * bW} 0 0 0 0 0 1 0`}
            />
            <feComponentTransfer>
              <feFuncR type="gamma" amplitude="1" exponent={1 / adjustments.gamma} offset="0" />
              <feFuncG type="gamma" amplitude="1" exponent={1 / adjustments.gamma} offset="0" />
              <feFuncB type="gamma" amplitude="1" exponent={1 / adjustments.gamma} offset="0" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>

      {/* Left Panel */}
      <div className="w-full md:w-80 bg-surfaceHighlight/50 border-r border-white/5 flex flex-col z-20 shadow-2xl flex-shrink-0 backdrop-blur-md">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-xs font-display font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <WrenchScrewdriverIcon className="w-4 h-4" /> Darkroom Tools
          </h2>
        </div>

        {/* Style Match AI */}
        <div className="p-4 border-b border-white/5 bg-indigo-900/10">
          <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2 mb-3">
            <ChatBubbleLeftRightIcon className="w-3 h-3" /> Style Match AI
          </h3>
          <div className="space-y-3">
            <textarea
              value={stylePrompt}
              onChange={(e) => setStylePrompt(e.target.value)}
              placeholder="Describe style (e.g. 'Warm 1980s film look')"
              className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-gray-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none h-16"
            />
            <div className="flex items-center gap-2">
              <label className="flex-1 cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-1.5 px-2 flex items-center justify-center gap-2 transition-all">
                <PaperClipIcon className="w-3 h-3 text-gray-400" />
                <span className="text-[10px] font-bold text-gray-300 truncate">
                  {refImagePreview ? 'Ref Selected' : 'Upload Ref'}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handleRefUpload} />
              </label>
              {refImagePreview && (
                <img src={refImagePreview} alt="ref" className="w-8 h-8 rounded object-cover border border-white/10" />
              )}
            </div>
            <button
              onClick={handleStyleMatch}
              disabled={isStyleMatching || (!stylePrompt && !refImageBase64)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg text-xs shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStyleMatching ? <Spinner /> : 'Match Sliders'}
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex p-2 gap-1 border-b border-white/5 bg-black/20 overflow-x-auto custom-scrollbar">
          <TabButton active={activeCategory === 'light'} icon={<SunIcon className="w-5 h-5" />} label="Light" onClick={() => setActiveCategory('light')} />
          <TabButton active={activeCategory === 'color'} icon={<SwatchIcon className="w-5 h-5" />} label="Color" onClick={() => setActiveCategory('color')} />
          <TabButton active={activeCategory === 'mixer'} icon={<EyeDropperIcon className="w-5 h-5" />} label="Mixer" onClick={() => setActiveCategory('mixer')} />
          <TabButton active={activeCategory === 'grade'} icon={<SplitToningIcon className="w-5 h-5" />} label="Grade" onClick={() => setActiveCategory('grade')} />
          <TabButton active={activeCategory === 'detail'} icon={<ApertureIcon className="w-5 h-5" />} label="Detail" onClick={() => setActiveCategory('detail')} />
        </div>

        {/* Sliders */}
        <div className="flex-grow overflow-y-auto p-5 space-y-8 custom-scrollbar">
          {activeCategory === 'light' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
                <CurvesIcon className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">Tone Curve Proxy</span>
              </div>
              <AdjustmentSlider label="Exposure" min={50} max={150} value={adjustments.exposure} onChange={(v) => updateAdj('exposure', v)} />
              <AdjustmentSlider label="Contrast" min={50} max={150} value={adjustments.contrast} onChange={(v) => updateAdj('contrast', v)} />
              <AdjustmentSlider label="Highlights" min={50} max={150} value={adjustments.highlights} onChange={(v) => updateAdj('highlights', v)} />
              <AdjustmentSlider label="Shadows" min={50} max={150} value={adjustments.shadows} onChange={(v) => updateAdj('shadows', v)} />
              <AdjustmentSlider label="Gamma" min={0.1} max={2.5} step={0.01} value={adjustments.gamma} onChange={(v) => updateAdj('gamma', v)} />
            </div>
          )}
          {activeCategory === 'color' && (
            <div className="space-y-5 animate-fade-in">
              <AdjustmentSlider label="Saturation" min={0} max={200} value={adjustments.saturation} onChange={(v) => updateAdj('saturation', v)} />
              <AdjustmentSlider label="Vibrance" min={0} max={200} value={adjustments.vibrance} onChange={(v) => updateAdj('vibrance', v)} />
              <div className="pt-4 border-t border-white/5">
                <p className="text-[10px] text-indigo-400 mb-4 uppercase font-bold tracking-widest">White Balance</p>
                <div className="space-y-5">
                  <AdjustmentSlider label="Temperature" min={-100} max={100} value={adjustments.warmth} onChange={(v) => updateAdj('warmth', v)} />
                  <AdjustmentSlider label="Tint" min={-180} max={180} value={adjustments.tint} onChange={(v) => updateAdj('tint', v)} />
                </div>
              </div>
            </div>
          )}
          {activeCategory === 'mixer' && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">RGB Channel Mixer</h3>
              <AdjustmentSlider label="Red Intensity" min={0} max={200} value={adjustments.redChannel} onChange={(v) => updateAdj('redChannel', v)} />
              <AdjustmentSlider label="Green Intensity" min={0} max={200} value={adjustments.greenChannel} onChange={(v) => updateAdj('greenChannel', v)} />
              <AdjustmentSlider label="Blue Intensity" min={0} max={200} value={adjustments.blueChannel} onChange={(v) => updateAdj('blueChannel', v)} />
            </div>
          )}
          {activeCategory === 'grade' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-yellow-500 mb-3 flex items-center gap-2">
                  <SunIcon className="w-3 h-3" /> Highlights
                </h3>
                <div className="space-y-4">
                  <AdjustmentSlider label="Hue" min={0} max={360} value={adjustments.highlightsHue} onChange={(v) => updateAdj('highlightsHue', v)} />
                  <AdjustmentSlider label="Saturation" min={0} max={100} value={adjustments.highlightsSat} onChange={(v) => updateAdj('highlightsSat', v)} />
                  <div className="h-4 w-full rounded mt-2 border border-white/10" style={{ backgroundColor: highlightColor }}></div>
                </div>
              </div>
              <div className="border-t border-white/10 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3 flex items-center gap-2">
                  <ArrowDownTrayIcon className="w-3 h-3" /> Shadows
                </h3>
                <div className="space-y-4">
                  <AdjustmentSlider label="Hue" min={0} max={360} value={adjustments.shadowsHue} onChange={(v) => updateAdj('shadowsHue', v)} />
                  <AdjustmentSlider label="Saturation" min={0} max={100} value={adjustments.shadowsSat} onChange={(v) => updateAdj('shadowsSat', v)} />
                  <div className="h-4 w-full rounded mt-2 border border-white/10" style={{ backgroundColor: shadowColor }}></div>
                </div>
              </div>
            </div>
          )}
          {activeCategory === 'detail' && (
            <div className="space-y-5 animate-fade-in">
              <AdjustmentSlider label="Sharpen" min={0} max={100} value={adjustments.sharpen} onChange={(v) => updateAdj('sharpen', v)} />
              <AdjustmentSlider label="Blur" min={0} max={20} value={adjustments.blur} onChange={(v) => updateAdj('blur', v)} />
              <AdjustmentSlider label="Vignette" min={0} max={100} value={adjustments.vignette} onChange={(v) => updateAdj('vignette', v)} />
              <AdjustmentSlider label="Film Grain" min={0} max={100} value={adjustments.grain} onChange={(v) => updateAdj('grain', v)} />
            </div>
          )}

          {/* Presets */}
          <div className="mt-8 pt-6 border-t border-white/5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2 mb-4">
              <SparklesIcon className="w-3 h-3" /> AI-Tuned Presets
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={autoEnhance}
                className="col-span-2 flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-indigo-500/20 mb-2"
              >
                <BoltIcon className="w-3 h-3" /> Auto-Balance
              </button>
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset.adjustments)}
                  className="relative group overflow-hidden rounded-lg h-14 bg-gray-800 border border-white/5 hover:border-white/20 transition-all"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${preset.colorClass} opacity-30 group-hover:opacity-50 transition-opacity`}></div>
                  <span className="relative z-10 text-[10px] font-bold text-white uppercase tracking-wide shadow-black drop-shadow-md">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setAdjustments(defaultAdjustments)}
            className="w-full py-2.5 text-xs font-bold text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors mt-8 uppercase tracking-wide"
          >
            Reset All Adjustments
          </button>
        </div>
      </div>

      {/* Center Panel - Canvas */}
      <div className="flex-grow bg-[#05050A] relative flex items-center justify-center overflow-hidden group p-4 md:p-8">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/50 via-transparent to-black/50"></div>

        {/* Comparison Control */}
        <div className="absolute top-6 left-6 z-30 flex items-center gap-2">
          <button
            className={`backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-all flex items-center gap-2 shadow-lg ${
              showCompare ? 'bg-indigo-600/90 border-indigo-500 shadow-indigo-500/30' : 'bg-black/50'
            }`}
            onClick={() => setShowCompare(!showCompare)}
          >
            <ArrowsPointingOutIcon className="w-3 h-3" />
            {showCompare ? 'Comparison Active' : 'Compare Original'}
          </button>
        </div>

        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <ProgressBar label={activeQuickEdit ? `Applying ${activeQuickEdit}...` : 'Processing Edit...'} />
          </div>
        )}

        {/* Image Display */}
        <div className="relative max-w-full max-h-full shadow-[0_0_50px_-10px_rgba(0,0,0,0.7)] transition-transform duration-200 select-none">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Overlays */}
            <canvas
              ref={canvasRef}
              className={`absolute z-20 touch-none ${annotationMode !== 'none' ? 'cursor-crosshair' : 'pointer-events-none'}`}
              onMouseDown={handleMouseDown}
              onMouseMove={drawSmooth}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
            <div
              className="absolute inset-0 z-10 pointer-events-none rounded-sm"
              style={{ boxShadow: `inset 0 0 ${adjustments.vignette * 2}px ${adjustments.vignette}px rgba(0,0,0,${adjustments.vignette / 150})` }}
            ></div>
            <div
              className="absolute inset-0 z-10 pointer-events-none mix-blend-overlay"
              style={{
                opacity: adjustments.grain / 100,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`,
              }}
            ></div>
            <img
              src={showCompare ? originalImageSrc : image.preview}
              alt="Edited"
              className="max-h-[calc(100vh-160px)] max-w-full object-contain rounded-lg border border-white/5"
              style={showCompare ? {} : { filter: `${activeFilter} url(#advancedCorrections)` }}
              draggable={false}
            />
          </div>
        </div>

        {/* Annotation Toolbar */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md p-2 rounded-2xl flex items-center gap-4 border border-white/10 shadow-2xl z-40">
          <button
            onClick={() => setAnnotationMode('none')}
            className={`p-2.5 rounded-xl transition-all ${annotationMode === 'none' ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
            title="View Mode"
          >
            <ArrowsPointingOutIcon className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-white/10"></div>
          <button
            onClick={() => setAnnotationMode('brush')}
            className={`p-2.5 rounded-xl transition-all ${annotationMode === 'brush' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
            title="Mask Brush"
          >
            <BrushIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setAnnotationMode('eraser')}
            className={`p-2.5 rounded-xl transition-all ${annotationMode === 'eraser' ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/30' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
            title="Mask Eraser"
          >
            <EraserIcon className="w-5 h-5" />
          </button>
          {hasMask && (
            <button onClick={clearMask} className="p-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Clear Mask">
              <XCircleIcon className="w-5 h-5" />
            </button>
          )}
          {(annotationMode === 'brush' || annotationMode === 'eraser') && (
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <span className="text-[10px] font-bold text-gray-400 w-4">{brushSize}</span>
              <input
                type="range"
                min="5"
                max="100"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - AI Lab */}
      <div className="w-full md:w-80 bg-surfaceHighlight/50 border-l border-white/5 flex flex-col z-20 shadow-2xl flex-shrink-0 backdrop-blur-md">
        <div className="p-4 border-b border-white/5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onSendToLightBox(image, true)}
              className="col-span-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-2.5 px-4 rounded-lg shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 text-xs transition-all border border-white/10"
            >
              <SparklesIcon className="w-4 h-4" /> Save & Analyze
            </button>
            <button
              onClick={() => onSendToLightBox(image, false)}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs transition-all border border-white/10"
            >
              <RectangleStackIcon className="w-3 h-3" /> Save to Light Box
            </button>
            <button
              onClick={handleDownload}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs transition-all border border-white/10"
            >
              <ArrowDownTrayIcon className="w-3 h-3" /> Download
            </button>
            <button
              onClick={onUploadNew}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs transition-all border border-white/10"
            >
              <ArrowUpTrayIcon className="w-3 h-3" /> New
            </button>
          </div>
          <h2 className="text-xs font-display font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2 pt-2 border-t border-white/5">
            <SparklesIcon className="w-4 h-4" /> AI Generation Lab
          </h2>
        </div>

        <div className="p-5 space-y-8 overflow-y-auto flex-grow custom-scrollbar">
          {/* Creative Suggestions */}
          {analysis && analysis.creative_remixes && (
            <div className="space-y-3 animate-fade-in">
              <h3 className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 uppercase tracking-widest flex items-center gap-2">
                <SparklesIcon className="w-3 h-3 text-indigo-400" /> Creative AI Suggestions
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {analysis.creative_remixes.map((remix, idx) => (
                  <button
                    key={idx}
                    onClick={() => executeEdit(remix.prompt, remix.title)}
                    disabled={isLoading}
                    className="group relative w-full text-left p-3 bg-gray-800/40 hover:bg-gradient-to-r hover:from-indigo-900/40 hover:to-purple-900/40 border border-white/5 hover:border-indigo-500/30 rounded-lg transition-all"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-gray-200 group-hover:text-white uppercase tracking-wide">{remix.title}</span>
                      <span className="text-[9px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded border border-white/5">{remix.category}</span>
                    </div>
                    <p className="text-xs text-gray-500 group-hover:text-indigo-200 line-clamp-1 transition-colors">{remix.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Generative Prompt */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Generative Fill</h3>
              <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/10">
                <button
                  onClick={() => setApplyToSelection(false)}
                  className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all ${!applyToSelection ? 'bg-white text-black' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  Whole Image
                </button>
                <button
                  onClick={() => setApplyToSelection(true)}
                  className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all flex items-center gap-1 ${
                    applyToSelection ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Selection {hasMask && <span className="w-1.5 h-1.5 rounded-full bg-green-400 block"></span>}
                </button>
              </div>
            </div>

            {applyToSelection && !hasMask && (
              <div className="bg-yellow-900/20 border border-yellow-500/20 p-2 rounded text-[10px] text-yellow-200 flex items-center gap-2">
                <BrushIcon className="w-3 h-3" />
                Use the brush tool below the image to select an area.
              </div>
            )}

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={applyToSelection ? 'Describe change for selection...' : "Describe a change (e.g., 'Add a neon sign')..."}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none h-24 resize-none transition-all"
            />
            <button
              onClick={() => executeEdit(prompt, null)}
              disabled={isLoading || !prompt || (applyToSelection && !hasMask)}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-2.5 px-4 rounded-lg shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
            >
              {isLoading && !activeQuickEdit ? <Spinner /> : 'Generate Edit'}
            </button>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/5">
            <button
              onClick={() => executeEdit('Remove background', 'Remove BG')}
              disabled={isLoading}
              className="p-3 bg-gray-800/50 hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500/30 rounded-xl flex flex-col items-center gap-2 transition-all disabled:opacity-50 group"
            >
              {isLoading && activeQuickEdit === 'Remove BG' ? <Spinner /> : <ScissorsIcon className="w-5 h-5 text-pink-400 group-hover:scale-110 transition-transform" />}
              <span className="text-[10px] font-bold text-gray-300 uppercase">Remove BG</span>
            </button>
            <button
              onClick={executeUpscale}
              disabled={isLoading}
              className="p-3 bg-gray-800/50 hover:bg-green-500/10 border border-white/5 hover:border-green-500/30 rounded-xl flex flex-col items-center gap-2 transition-all disabled:opacity-50 group"
            >
              {isLoading && activeQuickEdit === 'Upscale' ? <Spinner /> : <ArrowsPointingOutIcon className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" />}
              <span className="text-[10px] font-bold text-gray-300 uppercase">Upscale</span>
            </button>
            <button
              onClick={() => executeEdit('Make it black and white high contrast', 'B&W')}
              disabled={isLoading}
              className="p-3 bg-gray-800/50 hover:bg-gray-500/10 border border-white/5 hover:border-gray-500/30 rounded-xl flex flex-col items-center gap-2 transition-all disabled:opacity-50 group"
            >
              {isLoading && activeQuickEdit === 'B&W' ? <Spinner /> : <PaintBrushIcon className="w-5 h-5 text-gray-300 group-hover:scale-110 transition-transform" />}
              <span className="text-[10px] font-bold text-gray-300 uppercase">B&W</span>
            </button>
            <button
              onClick={() => executeEdit('Cinematic teal and orange lighting', 'Cinematic')}
              disabled={isLoading}
              className="p-3 bg-gray-800/50 hover:bg-orange-500/10 border border-white/5 hover:border-orange-500/30 rounded-xl flex flex-col items-center gap-2 transition-all disabled:opacity-50 group"
            >
              {isLoading && activeQuickEdit === 'Cinematic' ? <Spinner /> : <PlayIcon className="w-5 h-5 text-orange-400 group-hover:scale-110 transition-transform" />}
              <span className="text-[10px] font-bold text-gray-300 uppercase">Cinematic</span>
            </button>
          </div>

          {/* Version History */}
          <div className="border-t border-white/5 pt-6 mt-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <ArrowRightIcon className="w-3 h-3 rotate-180" /> Version History
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {history.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => handleHistoryClick(item)}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                    image.preview === item.imageData.preview && JSON.stringify(adjustments) === JSON.stringify(item.adjustments)
                      ? 'bg-indigo-900/30 border border-indigo-500/30'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <img src={item.thumbnail} alt="thumb" className="w-10 h-10 object-cover rounded-md border border-white/10" />
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-gray-200 truncate">{item.actionName}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                      {index === history.length - 1 ? 'Original Asset' : `Version ${history.length - 1 - index}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
