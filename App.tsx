import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AppView, ChatMessage as ChatMessageType, AnalysisResult, ImageData, ActiveImage, Connections, PlatformName, DistributionStatus, DistributionResult, Platform } from './types';
import * as GeminiService from './services/geminiService';
import * as DistributionService from './services/distributionService';
import { Spinner } from './components/Spinner';
import { LightBoxIcon, ChatIcon, EditIcon, StudioIcon, CheckCircleIcon, XCircleIcon, WrenchScrewdriverIcon, InstagramIcon, PinterestIcon, LinkedInIcon, ShoppingCartIcon, DollarSignIcon, SettingsIcon, DownloadIcon, SparklesIcon, ScissorsIcon, PaintBrushIcon, ArrowsPointingOutIcon, RectangleStackIcon, ChartBarIcon, ViewfinderIcon, SunIcon, BookOpenIcon } from './components/icons';
import { Chat } from '@google/genai';
import { WelcomeScreen } from './components/WelcomeScreen';
import { EarningsDashboard } from './components/EarningsDashboard';
import { CopyButton } from './components/CopyButton';
import { SettingsView } from './components/SettingsView';
import { PortfolioView } from './components/PortfolioView';

// --- Constants ---
export const platforms: Platform[] = [
    { name: 'Adobe Stock', category: 'Stock', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Adobe_Stock_logo.svg/2560px-Adobe_Stock_logo.svg.png' },
    { name: 'Getty Images', category: 'Stock', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Getty_Images_logo.svg/2560px-Getty_Images_logo.svg.png' },
    { name: 'Shutterstock', category: 'Stock', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Shutterstock_logo.svg/2560px-Shutterstock_logo.svg.png' },
    { name: 'Etsy', category: 'Print', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Etsy_logo.svg/2560px-Etsy_logo.svg.png' },
    { name: 'Redbubble', category: 'Print', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/52/Redbubble_logo.svg/1200px-Redbubble_logo.svg.png' },
    { name: 'Instagram', category: 'Social', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/2048px-Instagram_logo_2016.svg.png' },
    { name: 'Pinterest', category: 'Social', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Pinterest-logo.png' },
];

// Helper function
const fileToImageData = (file: File): Promise<ImageData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve({ base64, mimeType: file.type, preview: URL.createObjectURL(file) });
    };
    reader.onerror = (error) => reject(error);
  });
};

// --- Reusable UI Components ---

interface ImageUploaderProps {
  onImageUpload: (data: ImageData) => void;
  imagePreview: string | null;
  isLoading: boolean;
  promptText?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, imagePreview, isLoading, promptText = "Add your photo to the Light Box" }) => {
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
    <div className="w-full p-4 border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer hover:border-indigo-500 transition-colors relative flex items-center justify-center min-h-[250px]">
      <input type="file" accept="image/*" className="hidden" id="image-upload" onChange={handleFileChange} disabled={isLoading}/>
      <label htmlFor="image-upload" className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
        {imagePreview ? (
          <img src={imagePreview} alt="Preview" className={`max-h-64 mx-auto rounded-md transition-opacity ${isLoading ? 'opacity-30' : 'opacity-100'}`} />
        ) : (
          !isLoading && (
            <div className="text-gray-400 py-10">
              <p className="text-xl font-semibold">{promptText}</p>
              <p className="text-sm">Click here to upload, or drag and drop</p>
            </div>
          )
        )}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/50 rounded-lg">
              <Spinner />
              <p className="mt-2 text-lg font-semibold text-white">Analyzing...</p>
          </div>
        )}
      </label>
    </div>
  );
};

interface HeaderProps {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
}

const Header: React.FC<HeaderProps> = ({ activeView, setActiveView }) => {
  const navItems = [
    { view: AppView.LIGHT_BOX, icon: LightBoxIcon, label: 'Light Box' },
    { view: AppView.PORTFOLIO, icon: RectangleStackIcon, label: 'Portfolio' },
    { view: AppView.EARNINGS, icon: DollarSignIcon, label: 'Earnings' },
    { view: AppView.EDIT, icon: EditIcon, label: 'Edit' },
    { view: AppView.STUDIO, icon: StudioIcon, label: 'Studio' },
    { view: AppView.AGENT_CHAT, icon: ChatIcon, label: 'Agent Chat' },
    { view: AppView.SETTINGS, icon: SettingsIcon, label: 'Settings' },
  ];

  return (
    <header className="bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10 p-4 border-b border-gray-700">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white tracking-wider">PhotonAgent<span className="text-indigo-400">.ai</span></h1>
        <nav className="hidden md:flex items-center space-x-2">
          {navItems.map(item => {
            const isActive = activeView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => setActiveView(item.view)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

// --- Feature View Components ---

const ScoreGauge: React.FC<{ score: number }> = ({ score }) => {
    const circumference = 2 * Math.PI * 52; // 2 * pi * radius
    const [offset, setOffset] = useState(circumference);

    useEffect(() => {
        const progress = score / 99;
        setOffset(circumference - progress * circumference);
    }, [score, circumference]);

    const getScoreColor = () => {
        if (score >= 90) return 'text-green-400';
        if (score >= 70) return 'text-sky-400';
        if (score >= 50) return 'text-yellow-400';
        if (score >= 30) return 'text-orange-400';
        return 'text-red-400';
    };

    return (
        <div className="relative flex items-center justify-center h-48 w-48">
            <svg className="absolute" width="192" height="192" viewBox="0 0 120 120">
                <circle className="text-gray-700" strokeWidth="8" stroke="currentColor" fill="transparent" r="52" cx="60" cy="60"/>
                <circle
                    className={`${getScoreColor()} transition-stroke-dashoffset duration-1000 ease-out`}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="52"
                    cx="60"
                    cy="60"
                    transform="rotate(-90 60 60)"
                />
            </svg>
            <span className={`text-5xl font-bold text-white`}>{score}</span>
            <span className="absolute bottom-10 text-sm text-gray-400">/ 99</span>
        </div>
    );
};

const ScoreBar: React.FC<{ label: string, score: number }> = ({ label, score }) => {
    const getScoreColor = () => {
        if (score >= 90) return 'bg-green-500';
        if (score >= 70) return 'bg-sky-500';
        if (score >= 50) return 'bg-yellow-500';
        if (score >= 30) return 'bg-orange-500';
        return 'bg-red-500';
    };
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-300">{label}</span>
                <span className="text-sm font-bold text-white">{score}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div className={`${getScoreColor()} h-2.5 rounded-full transition-width duration-500 ease-out`} style={{ width: `${(score/99)*100}%` }}></div>
            </div>
        </div>
    );
};

const getPlatformIcon = (platform: string) => {
    const lowerPlatform = platform.toLowerCase();
    if (lowerPlatform.includes('instagram')) return <InstagramIcon className="h-5 w-5" />;
    if (lowerPlatform.includes('pinterest')) return <PinterestIcon className="h-5 w-5" />;
    if (lowerPlatform.includes('linkedin')) return <LinkedInIcon className="h-5 w-5" />;
    return null;
};

const SocialAndEditsSection: React.FC<{ 
    strategy: AnalysisResult['social_media_strategy'];
    onApplyEdit: (suggestion: string) => void;
    isEditing: boolean;
    editingSuggestion: string;
}> = ({ strategy, onApplyEdit, isEditing, editingSuggestion }) => {
    const [postingState, setPostingState] = useState<Record<string, 'idle' | 'posting' | 'posted'>>({});
    const [customPrompt, setCustomPrompt] = useState('');

    const handlePost = async (platform: PlatformName, postText: string) => {
        setPostingState(prev => ({ ...prev, [platform]: 'posting' }));
        try {
            await DistributionService.postToSocial(platform, postText);
            setPostingState(prev => ({ ...prev, [platform]: 'posted' }));
            setTimeout(() => setPostingState(prev => ({ ...prev, [platform]: 'idle' })), 2000);
        } catch (error) {
            console.error(`Failed to post to ${platform}`, error);
            setPostingState(prev => ({ ...prev, [platform]: 'idle' }));
        }
    };

    const handleCustomEdit = () => {
        if (customPrompt.trim()) {
            onApplyEdit(customPrompt.trim());
        }
    };

    return (
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 space-y-4">
            <h3 className="text-xl font-semibold text-indigo-400">Edits & Social Strategy</h3>
            
            <div>
                <h4 className="font-bold text-gray-200 mb-2">Suggested Edits</h4>
                <ul className="space-y-3">
                    {strategy.suggested_edits.map((edit, index) => (
                        <li key={index} className="flex items-center space-x-3">
                            <div className="flex-1">
                                <p className="font-semibold text-gray-300">{edit.suggestion}</p>
                                <p className="text-sm text-gray-400">{edit.impact}</p>
                            </div>
                            <button 
                                onClick={() => onApplyEdit(edit.suggestion)}
                                disabled={isEditing}
                                className="flex items-center justify-center text-sm bg-sky-600 px-3 py-1 rounded-md hover:bg-sky-500 text-white font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors w-28"
                            >
                                {isEditing && editingSuggestion === edit.suggestion ? <Spinner /> : 'Apply Edit'}
                            </button>
                        </li>
                    ))}
                </ul>

                <div className="mt-4 pt-4 border-t border-gray-700/50">
                     <h4 className="font-bold text-gray-200 mb-2">Custom Edit</h4>
                     <p className="text-sm text-gray-400 mb-2">Or, describe your own edit. Be descriptive for the best results.</p>
                     <div className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="text"
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="e.g., 'Make the sky a dramatic, stormy gray'"
                            className="flex-grow bg-gray-700 text-white placeholder-gray-400 p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            disabled={isEditing}
                        />
                         <button 
                            onClick={handleCustomEdit}
                            disabled={isEditing || !customPrompt.trim()}
                            className="flex items-center justify-center text-sm bg-purple-600 px-4 py-2 rounded-md hover:bg-purple-500 text-white font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
                         >
                            {isEditing && editingSuggestion === customPrompt.trim() ? <Spinner /> : 'Apply Custom'}
                         </button>
                     </div>
                </div>
            </div>
            
            <div className="border-t border-gray-700 !my-4"></div>

            <div>
                <h4 className="font-bold text-gray-200 mb-1">Social Media Appeal</h4>
                <p className="text-gray-300">{strategy.social_media_appeal}</p>
            </div>
            
            <div className="border-t border-gray-700 !my-4"></div>

            <div>
                <h4 className="font-bold text-gray-200 mb-2">Ready-to-Post Content</h4>
                <div className="space-y-4">
                    {strategy.sample_posts.map((post, index) => {
                        const platformName = post.platform as PlatformName;
                        const state = postingState[platformName] || 'idle';
                        return (
                            <div key={index} className="bg-gray-900/50 p-3 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center space-x-2">
                                        {getPlatformIcon(post.platform)}
                                        <span className="font-bold text-gray-200">{post.platform}</span>
                                    </div>
                                    <button 
                                        onClick={() => handlePost(platformName, post.post_text)}
                                        disabled={state !== 'idle'}
                                        className="text-sm bg-indigo-600 px-3 py-1 rounded-md hover:bg-indigo-500 text-white font-semibold disabled:bg-gray-500 transition-colors w-24 flex justify-center"
                                    >
                                        {state === 'posting' && <Spinner />}
                                        {state === 'posted' && 'Posted!'}
                                        {state === 'idle' && 'Post'}
                                    </button>
                                </div>
                                <div className="relative">
                                    <p className="text-gray-300 whitespace-pre-wrap text-sm pr-10">{post.post_text}</p>
                                    <CopyButton textToCopy={post.post_text} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const DistributionSection: React.FC<{ 
    bestUseCase: string;
    keywords: string[];
    connections: Connections;
    onDistribute: (platforms: PlatformName[]) => void;
    distributionStatus: DistributionStatus[];
    distributionResult: DistributionResult | null;
    isDistributed: boolean;
    isApiKeySelected: boolean;
    onSelectApiKey: () => void;
}> = ({ bestUseCase, keywords, connections, onDistribute, distributionStatus, distributionResult, isDistributed, isApiKeySelected, onSelectApiKey }) => {
    const [agentState, setAgentState] = useState<'idle' | 'selecting' | 'distributing' | 'done'>('idle');
    const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformName[]>([]);

    const getPlatformsForUseCase = useCallback(() => {
        const useCase = bestUseCase.toLowerCase();
        const connectedPlatforms = Object.keys(connections).filter(p => connections[p as PlatformName]) as PlatformName[];
        
        const platformMap = {
            stock: ['Adobe Stock', 'Getty Images', 'Shutterstock'],
            print: ['Etsy', 'Redbubble'],
            social: ['Instagram', 'Pinterest']
        };

        if (useCase.includes('stock')) return connectedPlatforms.filter(p => platformMap.stock.includes(p));
        if (useCase.includes('print') || useCase.includes('wall art')) return connectedPlatforms.filter(p => platformMap.print.includes(p));
        if (useCase.includes('social')) return connectedPlatforms.filter(p => platformMap.social.includes(p));
        return [];
    }, [bestUseCase, connections]);
    
    useEffect(() => {
        if (distributionStatus.length > 0 && agentState !== 'distributing') {
            setAgentState('distributing');
        }
        if (distributionResult) {
            setAgentState('done');
            setTimeout(() => setAgentState('idle'), 5000);
        }
    }, [distributionStatus, distributionResult, agentState]);


    const handleStartSelection = () => {
        const recommendedPlatforms = getPlatformsForUseCase();
        setSelectedPlatforms(recommendedPlatforms);
        setAgentState('selecting');
    };
    
    const handlePlatformToggle = (platform: PlatformName) => {
        setSelectedPlatforms(prev => 
            prev.includes(platform)
                ? prev.filter(p => p !== platform)
                : [...prev, platform]
        );
    };
    
    const handleConfirmDistribution = () => {
        if (selectedPlatforms.length > 0) {
            onDistribute(selectedPlatforms);
        }
    };
    
    const connectedPlatformDetails = platforms.filter(p => connections[p.name]);
    
    const renderIdleState = () => {
        if (isDistributed) {
            return (
                 <div className="w-full bg-gray-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-400"/> <span>Already Distributed</span>
                </div>
            );
        }
        if (connectedPlatformDetails.length === 0) {
            return (
                <div className="text-center text-sm text-gray-400 p-4 bg-gray-900/50 rounded-lg">
                    No monetization platforms enabled. Visit Settings to enable them.
                </div>
            );
        }
        if (!isApiKeySelected) {
            return (
                <>
                    <button onClick={onSelectApiKey} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2">
                        <span>Select API Key to Monetize</span>
                    </button>
                    <p className="text-xs text-center text-gray-400 mt-2">Distribution requires an API key for premium services. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-400">Learn about billing.</a></p>
                </>
            );
        }

        return (
            <button onClick={handleStartSelection} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2">
                <StudioIcon className="w-5 h-5" />
                <span>Monetize This Image</span>
            </button>
        );
    };

    const getStatusIcon = (status: DistributionStatus['status']) => {
        switch (status) {
            case 'pending': return <span className="text-gray-500">...</span>;
            case 'uploading': case 'processing': return <Spinner />;
            case 'success': return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
            case 'error': return <XCircleIcon className="w-5 h-5 text-red-400" />;
        }
    };

    return (
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 space-y-3">
            <h3 className="text-xl font-semibold text-indigo-400">Monetization</h3>
            <div>
                <h4 className="font-bold text-gray-200">Recommended Use Case</h4>
                <p className="text-gray-300">{bestUseCase}</p>
            </div>
            
            {agentState === 'idle' && renderIdleState()}

            {agentState === 'selecting' && (
                <div className="bg-gray-900/50 p-4 rounded-lg space-y-4 animate-fade-in">
                    <h4 className="font-bold text-gray-200">Select platforms to distribute to:</h4>
                    <div className="space-y-3">
                        {connectedPlatformDetails.map(platform => {
                            const isRecommended = getPlatformsForUseCase().includes(platform.name);
                            return (
                                <label key={platform.name} htmlFor={`platform-${platform.name}`} className="flex items-center p-3 bg-gray-800 rounded-md cursor-pointer hover:bg-gray-700/50">
                                    <input
                                        type="checkbox"
                                        id={`platform-${platform.name}`}
                                        checked={selectedPlatforms.includes(platform.name)}
                                        onChange={() => handlePlatformToggle(platform.name)}
                                        className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <img src={platform.logo} alt={platform.name} className="h-6 w-auto mx-4 object-contain invert-[.85] brightness-200" style={{maxHeight: '1.5rem', maxWidth: '80px'}} />
                                    <span className="flex-grow text-gray-300 font-medium">{platform.name}</span>
                                    {isRecommended && <span className="text-xs bg-indigo-500/50 text-indigo-300 font-semibold px-2 py-1 rounded-full">Recommended</span>}
                                </label>
                            )
                        })}
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={handleConfirmDistribution} 
                            disabled={selectedPlatforms.length === 0}
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
                                Distribute to {selectedPlatforms.length} platform{selectedPlatforms.length !== 1 && 's'}
                        </button>
                        <button onClick={() => setAgentState('idle')} className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">Cancel</button>
                    </div>
                </div>
            )}
            
            {agentState === 'distributing' && (
                 <div className="bg-gray-900/50 p-4 rounded-lg space-y-2">
                    <h4 className="font-bold text-gray-200 mb-2">Distribution Log:</h4>
                    {distributionStatus.map(s => (
                        <div key={s.platform + s.message} className="flex items-center space-x-3 text-sm">
                           <div className="w-5 h-5 flex-shrink-0">{getStatusIcon(s.status)}</div>
                           <span className="text-gray-300">{s.message}</span>
                        </div>
                    ))}
                 </div>
            )}

            {agentState === 'done' && distributionResult && (
                <div className="bg-gray-900/50 p-4 rounded-lg space-y-3 animate-fade-in">
                    <h4 className="font-bold text-gray-200">Distribution Complete</h4>
                    {distributionResult.success.length > 0 && (
                        <div>
                            <p className="text-sm text-green-400 flex items-center space-x-2"><CheckCircleIcon className="w-4 h-4"/><span>Successful Submissions:</span></p>
                            <p className="text-sm text-gray-300 pl-6">{distributionResult.success.join(', ')}</p>
                        </div>
                    )}
                     {distributionResult.failed.length > 0 && (
                        <div>
                            <p className="text-sm text-red-400 flex items-center space-x-2"><XCircleIcon className="w-4 h-4"/><span>Failed Submissions:</span></p>
                            <ul className="text-sm text-gray-300 list-disc list-inside pl-6">
                                {distributionResult.failed.map(f => <li key={f.platform}>{f.platform}: {f.reason}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};

const ProductMockupSection: React.FC<{ imageUrl: string }> = ({ imageUrl }) => {
    return (
        <div className="mt-4 pt-4 border-t border-gray-700">
            <h4 className="font-bold text-gray-200 mb-2">Product Mockups</h4>
            <div className="flex flex-wrap gap-4 justify-center">
                {/* Canvas Mockup */}
                <div className="w-40 h-40 bg-gray-900 p-4 rounded-md shadow-lg perspective">
                    <div className="relative w-full h-full transform-gpu rotate-y-15 border-2 border-gray-600 bg-black shadow-2xl">
                         <img src={imageUrl} alt="Canvas mockup" className="absolute inset-0 w-full h-full object-cover"/>
                         <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                </div>
                {/* T-Shirt Mockup */}
                <div className="w-40 h-40 bg-gray-700 rounded-lg flex items-center justify-center p-2 shadow-lg">
                    <div className="relative w-24 h-28 bg-gray-300 rounded-t-lg">
                         <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-4 bg-gray-700 rounded-b-full"></div>
                         <div className="absolute top-0 -left-4 w-4 h-12 bg-gray-300 transform -rotate-45 origin-bottom-left"></div>
                         <div className="absolute top-0 -right-4 w-4 h-12 bg-gray-300 transform rotate-45 origin-bottom-right"></div>
                        <img src={imageUrl} alt="T-Shirt mockup" className="w-16 h-16 object-cover absolute top-8 left-1/2 -translate-x-1/2" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const MarketComparisonSection: React.FC<{ comparisons: AnalysisResult['market_comparison'] }> = ({ comparisons }) => {
    return (
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 space-y-4">
            <h3 className="text-xl font-semibold text-indigo-400">Market Comparison</h3>
            <div className="space-y-4">
                {comparisons.map((item, index) => (
                    <div key={index} className="flex items-start space-x-4">
                         <div className="flex-shrink-0 bg-gray-700 rounded-full h-8 w-8 flex items-center justify-center">
                            <ChartBarIcon className="h-5 w-5 text-sky-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-300">{item.description}</p>
                            <p className="text-sm text-gray-400 mt-1"><span className="font-semibold text-gray-300">Why it sells:</span> {item.reasoning}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CritiqueItem: React.FC<{ icon: React.ReactNode; title: string; text: string; }> = ({ icon, title, text }) => (
    <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 bg-gray-700 rounded-full h-8 w-8 flex items-center justify-center">
            {icon}
        </div>
        <div>
            <h4 className="font-bold text-gray-200">{title}</h4>
            <p className="text-gray-300 text-sm">{text}</p>
        </div>
    </div>
);


const AnalysisDashboard: React.FC<{ 
    activeImage: ActiveImage;
    connections: Connections;
    onReset: () => void; 
    onReAnalyze: () => void;
    onApplyEdit: (suggestion: string) => void;
    onDistribute: (platforms: PlatformName[]) => void;
    distributionStatus: DistributionStatus[];
    distributionResult: DistributionResult | null;
    isEditing: boolean;
    editingSuggestion: string;
    isApiKeySelected: boolean;
    onSelectApiKey: () => void;
}> = ({ activeImage, connections, onReset, onReAnalyze, onApplyEdit, onDistribute, distributionStatus, distributionResult, isEditing, editingSuggestion, isApiKeySelected, onSelectApiKey }) => {
    const [isQuickFixing, setIsQuickFixing] = useState(false);
    
    const { analysis, data: imageData } = activeImage;
    if (!analysis) return null;
    const { monetization_score, monetization_strategy, curation_insights, social_media_strategy, market_comparison } = analysis;
    
    const showMockups = monetization_strategy.best_use_case.toLowerCase().includes('print');

    const handleQuickFix = async () => {
        setIsQuickFixing(true);
        await onApplyEdit(curation_insights.actionable_fix);
        setIsQuickFixing(false);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <button onClick={onReset} className="text-indigo-400 hover:text-indigo-300">&larr; Analyze another image</button>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="relative">
                        <img src={imageData.preview} alt="Analyzed" className="w-full rounded-lg shadow-lg" />
                        {!activeImage.isAnalyzed && (
                             <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center rounded-lg">
                                 <button onClick={onReAnalyze} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg">
                                     Re-Analyze with Edit
                                 </button>
                             </div>
                        )}
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col items-center">
                        <h3 className="text-lg font-semibold text-gray-200 mb-2">Overall Monetization Score</h3>
                        <ScoreGauge score={monetization_score.overall} />
                    </div>
                </div>
                
                {/* Right Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 space-y-4">
                        <h3 className="text-xl font-semibold text-indigo-400">Monetization Strategy</h3>
                        <div className="relative">
                            <h4 className="font-bold text-gray-200 mb-1">Art Director's Caption</h4>
                            <p className="text-gray-300 pr-10">{monetization_strategy.art_director_caption}</p>
                            <CopyButton textToCopy={monetization_strategy.art_director_caption} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-200 mb-2">Suggested Keywords</h4>
                            <div className="flex flex-wrap gap-2">
                                {monetization_strategy.suggested_keywords.map((keyword, i) => <span key={i} className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-gray-600">{keyword}</span>)}
                            </div>
                        </div>
                        {showMockups && <ProductMockupSection imageUrl={imageData.preview} />}
                    </div>

                    <DistributionSection 
                        bestUseCase={monetization_strategy.best_use_case} 
                        keywords={monetization_strategy.suggested_keywords}
                        connections={connections}
                        onDistribute={onDistribute}
                        distributionStatus={distributionStatus}
                        distributionResult={distributionResult}
                        isDistributed={!!activeImage.isDistributed}
                        isApiKeySelected={isApiKeySelected}
                        onSelectApiKey={onSelectApiKey}
                    />
                    
                    {social_media_strategy && <SocialAndEditsSection strategy={social_media_strategy} onApplyEdit={onApplyEdit} isEditing={isEditing} editingSuggestion={editingSuggestion} />}

                    <MarketComparisonSection comparisons={market_comparison} />

                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 space-y-4">
                        <h3 className="text-xl font-semibold text-indigo-400">Score Breakdown</h3>
                        <ScoreBar label="Technical Quality" score={monetization_score.technical_quality_score} />
                        <ScoreBar label="Commercial Appeal" score={monetization_score.commercial_appeal_score} />
                        <ScoreBar label="Market Rarity" score={monetization_score.market_rarity_score} />
                        <ScoreBar label="Emotional Resonance" score={monetization_score.emotional_resonance_score} />
                    </div>

                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 space-y-4">
                        <h3 className="text-xl font-semibold text-indigo-400">Curation Insights</h3>
                        <CritiqueItem icon={<ViewfinderIcon className="h-5 w-5 text-sky-400"/>} title="Composition & Framing" text={curation_insights.composition_and_framing} />
                        <CritiqueItem icon={<SunIcon className="h-5 w-5 text-yellow-400"/>} title="Lighting & Color" text={curation_insights.lighting_and_color} />
                        <CritiqueItem icon={<BookOpenIcon className="h-5 w-5 text-purple-400"/>} title="Subject & Narrative" text={curation_insights.subject_and_narrative} />
                         
                        <div className="pt-4 border-t border-gray-700">
                             <div className="flex items-center space-x-3">
                                <div className="flex items-start space-x-4 flex-grow">
                                    <div className="flex-shrink-0 bg-gray-700 rounded-full h-8 w-8 flex items-center justify-center">
                                       <WrenchScrewdriverIcon className="h-5 w-5 text-green-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-200">Actionable Fix</h4>
                                        <p className="text-gray-300 text-sm">{curation_insights.actionable_fix}</p>
                                    </div>
                                </div>
                                 <button 
                                    onClick={handleQuickFix}
                                    disabled={isEditing || isQuickFixing}
                                    className="flex items-center justify-center text-sm bg-sky-600 px-4 py-2 rounded-md hover:bg-sky-500 text-white font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors w-32 flex-shrink-0"
                                >
                                    {isQuickFixing ? <Spinner /> : 'Quick Fix'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const LightBoxView: React.FC<{
  activeImage: ActiveImage | null;
  setActiveImage: React.Dispatch<React.SetStateAction<ActiveImage | null>>;
  switchToEditView: (imageData: ImageData) => void;
  connections: Connections;
  isApiKeySelected: boolean;
  setIsApiKeySelected: React.Dispatch<React.SetStateAction<boolean>>;
  onPortfolioUpdate: (image: ActiveImage) => void;
}> = ({ activeImage, setActiveImage, switchToEditView, connections, isApiKeySelected, setIsApiKeySelected, onPortfolioUpdate }) => {
  const [editingState, setEditingState] = useState({ isEditing: false, suggestion: '' });
  const [distributionStatus, setDistributionStatus] = useState<DistributionStatus[]>([]);
  const [distributionResult, setDistributionResult] = useState<DistributionResult | null>(null);

  const handleImageUpload = async (imageData: ImageData) => {
    const imageId = Date.now().toString();
    
    let currentImage: ActiveImage = {
      id: imageId,
      data: imageData,
      analysis: null,
      isAnalyzed: false,
      isLoading: true
    };
    setActiveImage(currentImage);
    setDistributionResult(null);
    setDistributionStatus([]);

    try {
      const analysisResult = await GeminiService.analyzeImage(imageData.base64, imageData.mimeType);
      
      currentImage = {
          ...currentImage,
          analysis: analysisResult,
          isAnalyzed: true,
          isLoading: false,
      };
      setActiveImage(currentImage);
      onPortfolioUpdate(currentImage);

    } catch (error) {
      console.error("Error analyzing image:", error);
      setActiveImage(prev => {
        if (!prev || prev.id !== imageId) return prev; // Stale request, ignore
        return { ...prev, isLoading: false, analysis: null }; // Reset on error
      });
    }
  };

  const handleApplyEdit = async (suggestion: string) => {
    if (!activeImage) return;
    setEditingState({ isEditing: true, suggestion: suggestion });
    try {
      const newBase64 = await GeminiService.editImage(suggestion, activeImage.data.base64, activeImage.data.mimeType);
      const newImageData = {
        base64: newBase64,
        mimeType: 'image/png', // Gemini image editing likely returns PNG
        preview: `data:image/png;base64,${newBase64}`,
      };
      await handleImageUpload(newImageData);
    } catch (error) {
      console.error("Error applying edit:", error);
    } finally {
      setEditingState({ isEditing: false, suggestion: '' });
    }
  };
  
  const handleDistribute = async (platforms: PlatformName[]) => {
      if (!activeImage || !activeImage.analysis) return;
      setDistributionStatus([]);
      setDistributionResult(null);
      
      try {
        const result = await DistributionService.distributeImage(
            activeImage.data,
            platforms,
            { keywords: activeImage.analysis.monetization_strategy.suggested_keywords },
            (statusUpdate) => {
                setDistributionStatus(prev => {
                    const existingIndex = prev.findIndex(s => s.platform === statusUpdate.platform && s.status === statusUpdate.status);
                    if (existingIndex > -1) {
                         const updated = [...prev];
                         updated[existingIndex] = statusUpdate;
                         return updated;
                    }
                    return [...prev, statusUpdate];
                });
            }
        );
        setDistributionResult(result);
        if (result.success.length > 0) {
            const updatedImage = { ...activeImage, isDistributed: true, distributionResult: result };
            setActiveImage(updatedImage);
            onPortfolioUpdate(updatedImage);
        }
      } catch (error: any) {
        if (typeof error.message === 'string' && error.message.includes("Requested entity was not found.")) {
          console.error("API Key error during distribution:", error);
          alert("Distribution failed due to an invalid API Key. Please select a valid key and try again.");
          setIsApiKeySelected(false);
        } else {
            console.error("An unexpected error occurred during distribution:", error);
            alert("An unexpected error occurred during distribution. Please check the console for details.");
        }
      }
  };

  const handleReAnalyze = () => {
    if (!activeImage) return;
    handleImageUpload(activeImage.data);
  };

  const handleReset = () => {
    setActiveImage(null);
    setDistributionResult(null);
    setDistributionStatus([]);
  };

  const handleSelectApiKey = async () => {
      await (window as any).aistudio.openSelectKey();
      setIsApiKeySelected(true); // Assume success to handle race condition
  };
  
  return (
    <div className="p-4 md:p-8">
      {activeImage && activeImage.analysis ? (
        <AnalysisDashboard 
          activeImage={activeImage} 
          connections={connections}
          onReset={handleReset} 
          onReAnalyze={handleReAnalyze}
          onApplyEdit={handleApplyEdit}
          onDistribute={handleDistribute}
          distributionStatus={distributionStatus}
          distributionResult={distributionResult}
          isEditing={editingState.isEditing}
          editingSuggestion={editingState.suggestion}
          isApiKeySelected={isApiKeySelected}
          onSelectApiKey={handleSelectApiKey}
        />
      ) : (
        <ImageUploader
          onImageUpload={handleImageUpload}
          imagePreview={activeImage?.data.preview || null}
          isLoading={activeImage?.isLoading || false}
        />
      )}
    </div>
  );
};

const EditView: React.FC<{ 
    initialImage: ImageData | null;
    onSendToLightBox: (imageData: ImageData) => void;
}> = ({ initialImage, onSendToLightBox }) => {
    const [image, setImage] = useState<ImageData | null>(initialImage);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeQuickEdit, setActiveQuickEdit] = useState<string | null>(null);
    const [isUpscaled, setIsUpscaled] = useState(false);
    const [hasBeenEdited, setHasBeenEdited] = useState(false);

    const quickEdits = [
        { name: 'Enhance', prompt: 'Subtly enhance this image: improve lighting, colors, and sharpness without making it look artificial.', icon: <SparklesIcon className="w-5 h-5"/> },
        { name: 'Remove BG', prompt: 'Remove the background of this image perfectly, leaving only the main subject. Make the background transparent.', icon: <ScissorsIcon className="w-5 h-5"/> },
        { name: 'B&W', prompt: 'Convert this image to a dramatic, high-contrast black and white photograph.', icon: <PaintBrushIcon className="w-5 h-5"/> }
    ];

    const handleImageUpload = (imageData: ImageData) => {
        setImage(imageData);
        setIsUpscaled(false);
        setHasBeenEdited(false);
    };

    const executeEdit = async (editPrompt: string, quickEditName: string | null = null) => {
        if (!editPrompt || !image) return;
        setIsLoading(true);
        setActiveQuickEdit(quickEditName);
        try {
            const newBase64 = await GeminiService.editImage(editPrompt, image.base64, image.mimeType);
            const newImageData = {
                base64: newBase64,
                mimeType: 'image/png',
                preview: `data:image/png;base64,${newBase64}`,
            };
            setImage(newImageData);
            setHasBeenEdited(true);
        } catch (error) {
            console.error("Error editing image:", error);
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
                mimeType: image.mimeType, // Upscaling shouldn't change mime type
                preview: `data:${image.mimeType};base64,${newBase64}`,
            };
            setImage(newImageData);
            setIsUpscaled(true);
            setHasBeenEdited(true);
        } catch (error) {
            console.error("Error upscaling image:", error);
        } finally {
            setIsLoading(false);
            setActiveQuickEdit(null);
        }
    };

    const handleDownload = () => {
        if (!image) return;
        const link = document.createElement('a');
        link.href = `data:${image.mimeType};base64,${image.base64}`;
        link.download = `photonagent-edit-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
            {!image ? (
                <ImageUploader onImageUpload={handleImageUpload} imagePreview={null} isLoading={false} promptText="Upload an image to start editing"/>
            ) : (
                <div className="space-y-4">
                    <div className="relative w-full max-w-2xl mx-auto">
                        <img src={image.preview} alt="To edit" className="w-full rounded-lg shadow-lg" />
                        {isUpscaled && (
                            <div className="absolute top-2 right-2 bg-green-500/80 text-white text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm">
                                Upscaled (26MP)
                            </div>
                        )}
                    </div>
                    
                    <div className="flex justify-center gap-2 flex-wrap p-2 bg-gray-800/50 rounded-lg">
                        {quickEdits.map(edit => (
                            <button 
                                key={edit.name}
                                onClick={() => executeEdit(edit.prompt, edit.name)}
                                disabled={isLoading}
                                className="flex items-center justify-center gap-2 bg-gray-700 text-white font-semibold px-4 py-2 rounded-md hover:bg-gray-600 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading && activeQuickEdit === edit.name ? <Spinner/> : edit.icon}
                                <span>{edit.name}</span>
                            </button>
                        ))}
                         <button 
                            onClick={executeUpscale}
                            disabled={isLoading}
                            className="flex items-center justify-center gap-2 bg-gray-700 text-white font-semibold px-4 py-2 rounded-md hover:bg-gray-600 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading && activeQuickEdit === 'Upscale' ? <Spinner/> : <ArrowsPointingOutIcon className="w-5 h-5"/>}
                            <span>Upscale to 26MP</span>
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Or, describe a custom change..."
                            className="flex-grow bg-gray-700 text-white placeholder-gray-400 p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            disabled={isLoading}
                        />
                        <button onClick={() => executeEdit(prompt, null)} disabled={isLoading || !prompt} className="flex items-center justify-center bg-indigo-600 text-white font-semibold px-6 py-3 rounded-md hover:bg-indigo-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors w-full sm:w-auto">
                           {isLoading && !activeQuickEdit ? <Spinner /> : "Apply Custom Edit"}
                        </button>
                    </div>
                     <div className="flex flex-wrap justify-center gap-4 pt-4">
                        <button onClick={() => {setImage(null); setIsUpscaled(false); setHasBeenEdited(false);}} className="text-gray-300 hover:text-white" disabled={isLoading}>Start Over</button>
                        <button 
                            onClick={handleDownload} 
                            className={`flex items-center gap-2 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 ${
                                hasBeenEdited 
                                ? 'bg-green-600 hover:bg-green-500 transform scale-105' 
                                : 'bg-gray-600 hover:bg-gray-500'
                            }`} 
                            disabled={isLoading}>
                            <DownloadIcon className="w-5 h-5"/> Download
                        </button>
                        <button onClick={() => onSendToLightBox(image)} className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-lg" disabled={isLoading}>
                            Send to Light Box for Analysis &rarr;
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const StudioView: React.FC<{ 
  onSendToLightBox: (imageData: ImageData) => void;
}> = ({ onSendToLightBox }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [generatedImage, setGeneratedImage] = useState<ImageData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsLoading(true);
    setGeneratedImage(null);
    try {
      const newBase64 = await GeminiService.generateImage(prompt, aspectRatio);
      const newImageData = {
        base64: newBase64,
        mimeType: 'image/png',
        preview: `data:image/png;base64,${newBase64}`,
      };
      setGeneratedImage(newImageData);
    } catch (error) {
      console.error("Error generating image:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 space-y-3">
              <h2 className="text-xl font-semibold text-indigo-400">Image Generation Studio</h2>
              <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the image you want to create... e.g., 'A cinematic photo of a wolf in a neon-lit forest'"
                  rows={3}
                  className="w-full bg-gray-700 text-white placeholder-gray-400 p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-grow">
                      <label htmlFor="aspect-ratio" className="block text-sm font-medium text-gray-300 mb-1">Aspect Ratio</label>
                      <select id="aspect-ratio" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none">
                          <option value="1:1">Square (1:1)</option>
                          <option value="16:9">Landscape (16:9)</option>
                          <option value="9:16">Portrait (9:16)</option>
                          <option value="4:3">Standard (4:3)</option>
                          <option value="3:4">Tall (3:4)</option>
                      </select>
                  </div>
                  <div className="flex-shrink-0 self-end">
                      <button onClick={handleGenerate} disabled={isLoading || !prompt} className="flex items-center justify-center bg-indigo-600 text-white font-semibold px-6 py-2 rounded-md hover:bg-indigo-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors w-full h-full">
                          {isLoading ? <Spinner /> : "Generate"}
                      </button>
                  </div>
              </div>
          </div>
          
          {(isLoading || generatedImage) && (
            <div className="relative min-h-[300px] flex items-center justify-center bg-gray-800 rounded-lg border border-gray-700">
                {isLoading && (
                    <div className="flex flex-col items-center">
                        <Spinner />
                        <p className="text-gray-300 mt-2">Generating your image...</p>
                    </div>
                )}
                {generatedImage && !isLoading && (
                    <div className="p-4 space-y-4">
                        <img src={generatedImage.preview} alt="Generated" className="max-h-[500px] w-auto rounded-lg shadow-lg"/>
                        <div className="flex justify-center gap-4 pt-2">
                            <button onClick={() => setGeneratedImage(null)} className="text-gray-300 hover:text-white">Generate Another</button>
                            <button onClick={() => onSendToLightBox(generatedImage)} className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-lg">Send to Light Box for Analysis &rarr;</button>
                        </div>
                    </div>
                )}
            </div>
          )}
      </div>
  );
};

const ChatMessage: React.FC<{ message: ChatMessageType }> = ({ message }) => {
  const isModel = message.role === 'model';
  return (
    <div className={`flex ${isModel ? 'justify-start' : 'justify-end'}`}>
      <div className={`p-3 rounded-lg max-w-xl ${isModel ? 'bg-gray-700 text-gray-200' : 'bg-indigo-600 text-white'}`}>
        <p className="whitespace-pre-wrap">{message.text}</p>
      </div>
    </div>
  );
};

const AgentChatView: React.FC = () => {
    const chatRef = useRef<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessageType[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatRef.current = GeminiService.createChat();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (messageText: string, isDeepThought: boolean = false) => {
        if (!messageText.trim()) return;
        setIsLoading(true);

        const userMessage: ChatMessageType = { role: 'user', text: messageText };
        setMessages(prev => [...prev, userMessage]);
        setInput('');

        try {
            let modelResponseText: string;
            if (isDeepThought) {
                modelResponseText = await GeminiService.getDeepThoughtResponse(messageText);
            } else {
                if (!chatRef.current) throw new Error("Chat not initialized");
                const result = await chatRef.current.sendMessage({ message: messageText });
                modelResponseText = result.text;
            }
            const modelMessage: ChatMessageType = { role: 'model', text: modelResponseText };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessage: ChatMessageType = { role: 'model', text: "Sorry, I encountered an error. Please try again." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = () => {
        sendMessage(input, false);
    };

    const handleDeepThought = () => {
        sendMessage(input, true);
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto h-[calc(100vh-100px)] flex flex-col">
            <div className="flex-grow overflow-y-auto space-y-4 p-4 bg-gray-800 rounded-t-lg">
                {messages.length === 0 ? (
                     <div className="text-center text-gray-400 my-auto flex flex-col justify-center items-center h-full">
                         <div>
                            <ChatIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-300">PhotonAgent Chat</h3>
                            <p className="mt-2">Ask anything about photography, market trends, or your images.</p>
                         </div>
                    </div>
                ) : (
                    messages.map((msg, index) => <ChatMessage key={index} message={msg} />)
                )}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="p-3 rounded-lg max-w-xl bg-gray-700 text-gray-200">
                            <Spinner />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-gray-800 rounded-b-lg border-t border-gray-700">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                        placeholder="Type your message..."
                        className="flex-grow bg-gray-700 text-white placeholder-gray-400 p-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        disabled={isLoading}
                    />
                    <button onClick={handleSend} disabled={isLoading || !input.trim()} className="bg-indigo-600 text-white font-semibold px-6 py-3 rounded-md hover:bg-indigo-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors flex items-center justify-center">
                        Send
                    </button>
                    <button onClick={handleDeepThought} disabled={isLoading || !input.trim()} className="bg-purple-600 text-white font-semibold px-4 py-3 rounded-md hover:bg-purple-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors" title="Use Deep Thought model for complex queries">
                        <SparklesIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        </div>
    );
};


const App: React.FC = () => {
    const [view, setView] = useState<AppView>(AppView.WELCOME);
    const [activeImage, setActiveImage] = useState<ActiveImage | null>(null);
    const [portfolioImages, setPortfolioImages] = useState<ActiveImage[]>([]);
    const [isApiKeySelected, setIsApiKeySelected] = useState(false);
    const [connections, setConnections] = useState<Connections>({
      'Adobe Stock': true,
      'Getty Images': false,
      'Shutterstock': true,
      'Etsy': false,
      'Redbubble': true,
      'Instagram': true,
      'Pinterest': false,
    });
    
    useEffect(() => {
        const checkKey = async () => {
            if ((window as any).aistudio) {
                const hasKey = await (window as any).aistudio.hasSelectedApiKey();
                setIsApiKeySelected(hasKey);
            }
        };
        checkKey();
    }, []);
    
    const handlePortfolioUpdate = (imageToUpdate: ActiveImage) => {
        setPortfolioImages(prev => {
            const existingIndex = prev.findIndex(p => p.id === imageToUpdate.id);
            if (existingIndex > -1) {
                const newPortfolio = [...prev];
                newPortfolio[existingIndex] = imageToUpdate;
                return newPortfolio;
            } else {
                return [...prev, imageToUpdate];
            }
        });
    };

    const handleGetStarted = () => setView(AppView.LIGHT_BOX);

    const handleSendToLightBox = (imageData: ImageData) => {
        const newImage: ActiveImage = {
            id: Date.now().toString(),
            data: imageData,
            analysis: null,
            isAnalyzed: false,
            isLoading: false,
        };
        setActiveImage(newImage);
        handlePortfolioUpdate(newImage); // Add to portfolio immediately
        setView(AppView.LIGHT_BOX);
    };
    
    const handleSwitchToEdit = (imageData: ImageData) => {
        const newImage = {
             id: Date.now().toString(),
            data: imageData,
            analysis: null,
            isAnalyzed: false,
            isLoading: false
        };
        setActiveImage(newImage);
        handlePortfolioUpdate(newImage);
        setView(AppView.EDIT);
    };

    const renderCurrentView = () => {
        switch (view) {
            case AppView.LIGHT_BOX:
                return <LightBoxView activeImage={activeImage} setActiveImage={setActiveImage} switchToEditView={handleSwitchToEdit} connections={connections} isApiKeySelected={isApiKeySelected} setIsApiKeySelected={setIsApiKeySelected} onPortfolioUpdate={handlePortfolioUpdate} />;
            case AppView.PORTFOLIO:
                return <PortfolioView portfolioImages={portfolioImages} />;
            case AppView.EDIT:
                return <EditView initialImage={activeImage?.data || null} onSendToLightBox={handleSendToLightBox} />;
            case AppView.STUDIO:
                return <StudioView onSendToLightBox={handleSendToLightBox} />;
            case AppView.AGENT_CHAT:
                return <AgentChatView />;
            case AppView.EARNINGS:
                return <EarningsDashboard />;
            case AppView.SETTINGS:
                return <SettingsView connections={connections} setConnections={setConnections} />;
            default:
                return <LightBoxView activeImage={activeImage} setActiveImage={setActiveImage} switchToEditView={handleSwitchToEdit} connections={connections} isApiKeySelected={isApiKeySelected} setIsApiKeySelected={setIsApiKeySelected} onPortfolioUpdate={handlePortfolioUpdate} />;
        }
    };
    
    if (view === AppView.WELCOME) {
        return <WelcomeScreen onGetStarted={handleGetStarted} />;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
            <Header activeView={view} setActiveView={setView} />
            <main>
                {renderCurrentView()}
            </main>
        </div>
    );
};

export default App;