import React, { useState, useEffect, useCallback } from 'react';
import { ActiveImage, AnalysisResult, Connections, DistributionResult, DistributionStatus, PlatformName, Platform, CreativeRemix } from '../types';
import { platforms } from '../App';
import { CopyButton } from './CopyButton';
import { Spinner } from './Spinner';
import * as DistributionService from '../services/distributionService';
import { 
    ArrowRightIcon, ChartBarIcon, CheckCircleIcon, StudioIcon, 
    InstagramIcon, PinterestIcon, LinkedInIcon, WrenchScrewdriverIcon, 
    ViewfinderIcon, SunIcon, BookOpenIcon, XCircleIcon, ArrowDownTrayIcon,
    SparklesIcon, PaintBrushIcon, TikTokIcon, FacebookIcon, TwitterIcon,
    DollarSignIcon, TagIcon, RectangleStackIcon, EyeIcon, AdjustmentsIcon, BoltIcon
} from './icons';

// --- Sub-components ---

const ScoreCard: React.FC<{ 
    label: string; 
    score: number; 
    icon: React.ReactNode; 
    colorClass: string; 
}> = ({ label, score, icon, colorClass }) => {
    // Score Color logic mapping to Tailwind text/bg/border classes
    const getTheme = () => {
        if (score >= 90) return { text: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', ring: 'ring-emerald-500/20' };
        if (score >= 70) return { text: 'text-sky-400', border: 'border-sky-500/20', bg: 'bg-sky-500/5', ring: 'ring-sky-500/20' };
        if (score >= 50) return { text: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/5', ring: 'ring-amber-500/20' };
        return { text: 'text-rose-400', border: 'border-rose-500/20', bg: 'bg-rose-500/5', ring: 'ring-rose-500/20' };
    };
    
    const theme = getTheme();

    return (
        <div className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border ${theme.border} ${theme.bg} transition-all duration-500 hover:scale-[1.02] shadow-xl overflow-hidden group`}>
            {/* Glow Effect */}
            <div className={`absolute -inset-1 bg-gradient-to-r ${theme.bg} rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500`}></div>
            
            <div className={`mb-3 p-3 rounded-full border ${theme.border} bg-white/5 backdrop-blur-sm shadow-inner relative z-10 ${theme.text}`}>
                {icon}
            </div>
            
            <div className={`text-5xl font-display font-bold tracking-tighter mb-1 relative z-10 ${theme.text} drop-shadow-sm`}>
                {score}
            </div>
            
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 relative z-10 group-hover:text-white transition-colors">
                {label}
            </div>
        </div>
    );
};

const CustomEditInput: React.FC<{
    onApplyEdit: (prompt: string) => void;
    isEditing: boolean;
    mode: 'standard' | 'generative';
}> = ({ onApplyEdit, isEditing, mode }) => {
    const [prompt, setPrompt] = useState('');

    const handleApply = () => {
        if (prompt.trim()) {
            onApplyEdit(prompt);
            setPrompt('');
        }
    };

    return (
        <div className={`p-5 rounded-2xl border transition-all duration-300 space-y-4 ${mode === 'generative' ? 'bg-indigo-950/20 border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : 'bg-white/5 border-white/5'}`}>
             <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg ${mode === 'generative' ? 'bg-indigo-500/20' : 'bg-gray-700/50'}`}>
                    {mode === 'generative' ? (
                        <SparklesIcon className="w-4 h-4 text-indigo-400" />
                    ) : (
                        <WrenchScrewdriverIcon className="w-4 h-4 text-gray-400" />
                    )}
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                    {mode === 'generative' ? 'Generative Console' : 'Standard Console'}
                </h3>
            </div>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={mode === 'generative' ? "Type prompt (e.g. 'Add neon lights')..." : "Type adjustment (e.g. 'Brighten shadows')..."}
                    className="flex-grow bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
                    disabled={isEditing}
                    onKeyPress={(e) => e.key === 'Enter' && handleApply()}
                />
                <button 
                    onClick={handleApply}
                    disabled={isEditing || !prompt.trim()}
                    className={`${mode === 'generative' ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20' : 'bg-white text-black hover:bg-gray-200'} font-bold px-6 py-2 rounded-xl text-xs disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px] flex justify-center items-center transition-all shadow-lg`}
                >
                    {isEditing ? <Spinner /> : 'Run'}
                </button>
            </div>
        </div>
    );
};

const SuggestedEditsList: React.FC<{
    edits: { suggestion: string; impact: string; }[];
    onApplyEdit: (suggestion: string) => void;
    isEditing: boolean;
    editingSuggestion: string;
}> = ({ edits, onApplyEdit, isEditing, editingSuggestion }) => {
    return (
        <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/5 space-y-4 animate-fade-in">
            <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2 uppercase tracking-wide border-b border-white/5 pb-3">
                <AdjustmentsIcon className="w-4 h-4 text-gray-400" /> Standard Corrections
            </h3>
            <div className="space-y-2">
                {edits.map((edit, idx) => (
                    <div key={idx} className="bg-black/20 p-3 rounded-xl border border-white/5 flex justify-between items-center group hover:bg-white/5 hover:border-white/10 transition-colors">
                        <div className="pr-4">
                            <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">{edit.suggestion}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wide font-semibold">{edit.impact}</p>
                        </div>
                        <button 
                            onClick={() => onApplyEdit(edit.suggestion)}
                            disabled={isEditing}
                            className="bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[10px] font-bold py-1.5 px-3 rounded-lg transition-colors flex-shrink-0 disabled:opacity-50 min-w-[60px] flex justify-center uppercase tracking-wider"
                        >
                            {isEditing && editingSuggestion === edit.suggestion ? <Spinner /> : 'Apply'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CreativeRemixSection: React.FC<{
    remixes: CreativeRemix[];
    onApplyEdit: (suggestion: string) => void;
    isEditing: boolean;
    editingSuggestion: string;
}> = ({ remixes, onApplyEdit, isEditing, editingSuggestion }) => {
    
    const getCategoryBadgeStyle = (category: string) => {
        switch (category) {
            case 'Social': return 'text-pink-300 border-pink-500/30 bg-pink-500/10';
            case 'Commercial': return 'text-blue-300 border-blue-500/30 bg-blue-500/10';
            case 'Artistic': return 'text-amber-300 border-amber-500/30 bg-amber-500/10';
            case 'Fantasy': return 'text-purple-300 border-purple-500/30 bg-purple-500/10';
            default: return 'text-gray-300 border-gray-600 bg-gray-700/50';
        }
    };

    return (
        <div className="bg-gradient-to-b from-indigo-950/20 to-gray-900/50 p-5 rounded-2xl border border-indigo-500/10 space-y-4 relative overflow-hidden animate-fade-in">
            {/* Subtle background glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>
            
            <div className="flex items-center justify-between mb-2 relative z-10 border-b border-white/5 pb-3">
                 <div className="flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wide">Generative Remixes</h3>
                 </div>
                 <span className="text-[10px] bg-white/5 border border-white/5 px-2 py-0.5 rounded-full text-gray-400">AI Powered</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {remixes.map((remix, i) => (
                    <div key={i} className="bg-black/30 border border-white/5 hover:border-indigo-500/30 rounded-xl p-4 transition-all hover:scale-[1.02] flex flex-col h-full group relative cursor-pointer shadow-lg hover:shadow-indigo-500/10" onClick={() => !isEditing && onApplyEdit(remix.prompt)}>
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none"></div>
                        
                        <div className="flex justify-between items-start mb-2 relative z-10">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${getCategoryBadgeStyle(remix.category)}`}>
                                {remix.category}
                            </span>
                        </div>
                        
                        <h4 className="font-bold text-white mb-1 relative z-10 text-sm">{remix.title}</h4>
                        <div className="mb-2">
                             <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Vibe: {remix.vibe}</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-4 flex-grow relative z-10 line-clamp-2 leading-relaxed">{remix.description}</p>
                        
                        <button 
                            className="w-full text-[10px] bg-white text-black hover:bg-indigo-50 font-bold py-2 px-3 rounded-lg transition-colors relative z-10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wider shadow-sm"
                            disabled={isEditing}
                            onClick={(e) => { e.stopPropagation(); onApplyEdit(remix.prompt); }}
                        >
                            {isEditing && editingSuggestion === remix.prompt ? <Spinner /> : 'Generate Remix'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const SocialSimulator: React.FC<{
    image: string;
    caption: string;
    hashtags: string[];
}> = ({ image, caption, hashtags }) => {
    const [mode, setMode] = useState<'IG' | 'Pinterest'>('IG');

    return (
        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
             <div className="flex border-b border-white/5">
                <button 
                    onClick={() => setMode('IG')} 
                    className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${mode === 'IG' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                >
                    <InstagramIcon className="w-3 h-3" /> Instagram
                </button>
                <button 
                    onClick={() => setMode('Pinterest')} 
                    className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${mode === 'Pinterest' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                >
                    <PinterestIcon className="w-3 h-3" /> Pinterest
                </button>
            </div>

            <div className="p-6 flex justify-center bg-black/20">
                {mode === 'IG' ? (
                    <div className="w-64 bg-white text-black rounded-sm overflow-hidden shadow-2xl font-sans transform hover:scale-105 transition-transform duration-300">
                         <div className="p-2 flex items-center gap-2 border-b border-gray-100">
                             <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600"></div>
                             <span className="text-xs font-semibold">your.studio</span>
                         </div>
                         <img src={image} className="w-full aspect-square object-cover" alt="post" />
                         <div className="p-3 text-[10px] leading-snug">
                             <div className="flex gap-3 mb-2">
                                 <div className="w-5 h-5">❤️</div>
                                 <div className="w-5 h-5">💬</div>
                                 <div className="w-5 h-5">🚀</div>
                             </div>
                             <p><span className="font-semibold mr-1">your.studio</span>{caption}</p>
                             <p className="text-blue-900 mt-1 font-medium">{hashtags.slice(0, 5).join(' ')}</p>
                         </div>
                    </div>
                ) : (
                    <div className="w-56 bg-white text-black rounded-2xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-300">
                        <img src={image} className="w-full aspect-[2/3] object-cover" alt="pin" />
                        <div className="p-3">
                            <h4 className="font-bold text-xs mb-1 truncate">{caption.split('.')[0]}</h4>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="w-5 h-5 rounded-full bg-gray-200"></div>
                                <span className="text-[10px] text-gray-500 font-medium">Saved by You</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const HashtagVault: React.FC<{ groups: AnalysisResult['social_media_strategy']['hashtag_groups'] }> = ({ groups }) => {
    return (
        <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/5 space-y-4">
             <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
                <TagIcon className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wide">Hashtag Vault</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Niche Tags */}
                <div className="bg-black/30 p-3 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-all relative group">
                    <p className="text-[9px] text-indigo-300 uppercase font-bold mb-1 tracking-wider">Niche</p>
                    <div className="text-xs text-gray-400 line-clamp-3 font-mono leading-relaxed">{groups.niche.join(' ')}</div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <CopyButton textToCopy={groups.niche.join(' ')} />
                    </div>
                </div>
                 {/* Viral Tags */}
                 <div className="bg-black/30 p-3 rounded-xl border border-white/5 hover:border-pink-500/30 transition-all relative group">
                    <p className="text-[9px] text-pink-300 uppercase font-bold mb-1 tracking-wider">Viral</p>
                    <div className="text-xs text-gray-400 line-clamp-3 font-mono leading-relaxed">{groups.viral.join(' ')}</div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <CopyButton textToCopy={groups.viral.join(' ')} />
                    </div>
                </div>
                 {/* Broad Tags */}
                 <div className="bg-black/30 p-3 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all relative group">
                    <p className="text-[9px] text-blue-300 uppercase font-bold mb-1 tracking-wider">Broad</p>
                    <div className="text-xs text-gray-400 line-clamp-3 font-mono leading-relaxed">{groups.broad.join(' ')}</div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <CopyButton textToCopy={groups.broad.join(' ')} />
                    </div>
                </div>
            </div>
        </div>
    )
}

const DistributionSection: React.FC<{ 
    bestUseCase: string;
    connections: Connections;
    onDistribute: (platforms: PlatformName[]) => void;
    distributionStatus: DistributionStatus[];
    distributionResult: DistributionResult | null;
    isDistributed: boolean;
    isApiKeySelected: boolean;
    onSelectApiKey: () => void;
}> = ({ bestUseCase, connections, onDistribute, distributionStatus, distributionResult, isDistributed, isApiKeySelected, onSelectApiKey }) => {
    const [agentState, setAgentState] = useState<'idle' | 'selecting' | 'distributing' | 'done'>('idle');
    const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformName[]>([]);

    const getPlatformsForUseCase = useCallback(() => {
        const useCase = bestUseCase.toLowerCase();
        const connectedPlatforms = Object.keys(connections).filter(p => connections[p as PlatformName]) as PlatformName[];
        
        const platformMap = {
            stock: ['Adobe Stock', 'Getty Images', 'Shutterstock', 'Alamy', '500px'],
            print: ['Etsy', 'Redbubble', 'Society6', 'Fine Art America'],
            social: ['Instagram', 'Pinterest', 'TikTok', 'X (Twitter)', 'Facebook']
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
                 <div className="w-full bg-green-900/20 border border-green-500/30 text-green-300 font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2">
                    <CheckCircleIcon className="w-5 h-5"/> <span>Successfully Distributed</span>
                </div>
            );
        }
        if (connectedPlatformDetails.length === 0) {
            return (
                <div className="text-center text-sm text-gray-400 p-4 bg-gray-900/50 rounded-xl border border-white/5">
                    No monetization platforms enabled. Visit Settings to enable them.
                </div>
            );
        }
        if (!isApiKeySelected) {
            return (
                <>
                    <button onClick={onSelectApiKey} className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                        <DollarSignIcon className="w-5 h-5" />
                        <span>Activate Paid Distribution</span>
                    </button>
                    <p className="text-[10px] text-center text-gray-500 mt-2">Requires API key. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">Billing info.</a></p>
                </>
            );
        }

        return (
            <button onClick={handleStartSelection} className="w-full bg-white hover:bg-gray-100 text-black font-display font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:scale-[1.02] transform">
                <StudioIcon className="w-5 h-5" />
                <span>Monetize This Asset</span>
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
        <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wide flex items-center gap-2 border-b border-white/5 pb-3">
                <DollarSignIcon className="w-4 h-4 text-green-400" /> Monetization Engine
            </h3>
            <div className="bg-black/30 p-3 rounded-xl border border-white/5">
                <h4 className="font-bold text-gray-400 text-[10px] uppercase tracking-wider mb-1">Recommended Strategy</h4>
                <p className="text-gray-200 font-medium text-sm">{bestUseCase}</p>
            </div>
            
            {agentState === 'idle' && renderIdleState()}

            {agentState === 'selecting' && (
                <div className="bg-black/40 p-4 rounded-xl space-y-4 animate-fade-in border border-white/10">
                    <h4 className="font-bold text-gray-200 text-sm">Select Target Platforms:</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {connectedPlatformDetails.map(platform => {
                            const isRecommended = getPlatformsForUseCase().includes(platform.name);
                            return (
                                <label key={platform.name} htmlFor={`platform-${platform.name}`} className="flex items-center p-2.5 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors border border-transparent hover:border-white/10">
                                    <input
                                        type="checkbox"
                                        id={`platform-${platform.name}`}
                                        checked={selectedPlatforms.includes(platform.name)}
                                        onChange={() => handlePlatformToggle(platform.name)}
                                        className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <img src={platform.logo} alt={platform.name} className="h-5 w-auto mx-3 object-contain invert-[.85] brightness-200" style={{maxHeight: '1.25rem', maxWidth: '60px'}} />
                                    <span className="flex-grow text-gray-300 text-sm font-medium">{platform.name}</span>
                                    {isRecommended && <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Best Match</span>}
                                </label>
                            )
                        })}
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={handleConfirmDistribution} 
                            disabled={selectedPlatforms.length === 0}
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed shadow-lg text-sm uppercase tracking-wide">
                                Launch
                        </button>
                        <button onClick={() => setAgentState('idle')} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm uppercase tracking-wide">Cancel</button>
                    </div>
                </div>
            )}
            
            {agentState === 'distributing' && (
                 <div className="bg-black/40 p-4 rounded-xl space-y-2 border border-white/10">
                    <h4 className="font-bold text-gray-200 mb-2 text-xs uppercase tracking-wider">Agent Activity Log</h4>
                    {distributionStatus.map(s => (
                        <div key={s.platform + s.message} className="flex items-center space-x-3 text-xs font-mono">
                           <div className="w-3 h-3 flex-shrink-0">{getStatusIcon(s.status)}</div>
                           <span className="text-gray-400">{s.message}</span>
                        </div>
                    ))}
                 </div>
            )}

            {agentState === 'done' && distributionResult && (
                <div className="bg-black/40 p-4 rounded-xl space-y-3 animate-fade-in border border-white/10">
                    <h4 className="font-bold text-white text-sm">Distribution Complete</h4>
                    {distributionResult.success.length > 0 && (
                        <div>
                            <p className="text-xs text-green-400 flex items-center space-x-2 font-bold uppercase tracking-wide"><CheckCircleIcon className="w-3 h-3"/><span>Successful</span></p>
                            <p className="text-xs text-gray-400 pl-5 mt-1">{distributionResult.success.join(', ')}</p>
                        </div>
                    )}
                     {distributionResult.failed.length > 0 && (
                        <div className="mt-2">
                            <p className="text-xs text-red-400 flex items-center space-x-2 font-bold uppercase tracking-wide"><XCircleIcon className="w-3 h-3"/><span>Failed</span></p>
                            <ul className="text-xs text-gray-400 list-disc list-inside pl-5 mt-1">
                                {distributionResult.failed.map(f => <li key={f.platform}>{f.platform}: {f.reason}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};

const MarketComparisonSection: React.FC<{ comparisons: AnalysisResult['market_comparison'] }> = ({ comparisons }) => {
    return (
        <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wide flex items-center gap-2 border-b border-white/5 pb-3">
                <ChartBarIcon className="w-4 h-4 text-sky-400" /> Market Intelligence
            </h3>
            <div className="space-y-3">
                {comparisons.map((item, index) => (
                    <div key={index} className="flex items-start space-x-3 bg-black/20 p-3 rounded-xl">
                         <div className="flex-shrink-0 bg-sky-900/30 rounded-full h-6 w-6 flex items-center justify-center mt-0.5">
                            <ChartBarIcon className="h-3 w-3 text-sky-400" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-200 text-sm mb-1">{item.description}</p>
                            <p className="text-xs text-gray-400 leading-relaxed"><span className="text-sky-300 font-semibold uppercase text-[9px] tracking-wide mr-1">Signal:</span> {item.reasoning}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CritiqueItem: React.FC<{ icon: React.ReactNode; title: string; text: string; }> = ({ icon, title, text }) => (
    <div className="flex items-start space-x-4 bg-black/20 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
        <div className="flex-shrink-0 bg-gray-800 rounded-lg h-8 w-8 flex items-center justify-center mt-0.5">
            {icon}
        </div>
        <div>
            <h4 className="font-bold text-gray-200 text-sm mb-1">{title}</h4>
            <p className="text-gray-400 text-xs leading-relaxed font-light">{text}</p>
        </div>
    </div>
);

// --- Main Component ---

export const AnalysisDashboard: React.FC<{ 
    activeImage: ActiveImage;
    connections: Connections;
    onReset: () => void; 
    onReAnalyze: () => void;
    onApplyEdit: (suggestion: string) => void;
    onDistribute: (platforms: PlatformName[]) => void;
    onDownloadImage: () => void;
    distributionStatus: DistributionStatus[];
    distributionResult: DistributionResult | null;
    isEditing: boolean;
    editingSuggestion: string;
    isApiKeySelected: boolean;
    onSelectApiKey: () => void;
}> = ({ activeImage, connections, onReset, onReAnalyze, onApplyEdit, onDistribute, onDownloadImage, distributionStatus, distributionResult, isEditing, editingSuggestion, isApiKeySelected, onSelectApiKey }) => {
    const [isQuickFixing, setIsQuickFixing] = useState(false);
    const [editMode, setEditMode] = useState<'standard' | 'generative'>('standard');
    
    const { analysis, data: imageData } = activeImage;
    if (!analysis) return null;
    const { scores, monetization_strategy, curation_insights, social_media_strategy, market_comparison, creative_remixes } = analysis;
    
    // Safety check for older analysis versions without the new scores structure
    const monetizationScore = scores?.monetization || analysis.monetization_score?.overall || 0;
    const socialScore = scores?.social || 0;
    const portfolioScore = scores?.portfolio || 0;

    const handleQuickFix = async () => {
        setIsQuickFixing(true);
        await onApplyEdit(curation_insights.actionable_fix);
        setIsQuickFixing(false);
    };

    const handleDownloadBrief = () => {
        const briefContent = `
# PhotonAgent.ai Analysis Brief
Date: ${new Date().toLocaleDateString()}

## Scores
Monetization: ${monetizationScore}/99
Social Potential: ${socialScore}/99
Portfolio Merit: ${portfolioScore}/99

## Monetization Strategy
Best Use Case: ${monetization_strategy.best_use_case}
Art Director Caption: "${monetization_strategy.art_director_caption}"

## Keywords
${monetization_strategy.suggested_keywords.join(', ')}

## Social Media
Appeal: ${social_media_strategy.social_media_appeal}
Sample Posts:
${social_media_strategy.sample_posts.map(p => `- [${p.platform}]: ${p.post_text}`).join('\n')}

## Critique
Actionable Fix: ${curation_insights.actionable_fix}
        `;
        
        const blob = new Blob([briefContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analysis_brief_${activeImage.id}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20 md:pb-0">
            {/* Header / Nav Actions */}
            <div className="flex justify-between items-center mb-6">
                <button onClick={onReset} className="flex items-center space-x-2 text-gray-500 hover:text-white transition-colors group">
                    <ArrowRightIcon className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" /> <span className="text-sm font-medium">Return to Light Box</span>
                </button>
                <div className="flex gap-3">
                    <button 
                        onClick={onReAnalyze}
                        className="flex items-center space-x-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 px-4 py-2 rounded-lg text-sm border border-white/5 transition-colors font-bold"
                    >
                         <span>Re-Analyze</span>
                    </button>
                    <button 
                        onClick={handleDownloadBrief}
                        className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm border border-white/10 transition-colors font-bold"
                    >
                        <ArrowDownTrayIcon className="w-4 h-4" /> <span>Export Brief</span>
                    </button>
                    <button 
                        onClick={onDownloadImage}
                        className="flex items-center space-x-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 px-4 py-2 rounded-lg text-sm border border-indigo-500/20 transition-colors font-bold"
                    >
                        <ArrowDownTrayIcon className="w-4 h-4" /> <span>Download Image</span>
                    </button>
                </div>
            </div>
            
            {/* --- TOP SECTION: Scoreboard --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <ScoreCard 
                    label="Commercial Value" 
                    score={monetizationScore} 
                    icon={<DollarSignIcon className="w-6 h-6"/>}
                    colorClass="text-emerald-400"
                 />
                 <ScoreCard 
                    label="Viral Potential" 
                    score={socialScore} 
                    icon={<InstagramIcon className="w-6 h-6"/>}
                    colorClass="text-sky-400"
                 />
                 <ScoreCard 
                    label="Artistic Merit" 
                    score={portfolioScore} 
                    icon={<RectangleStackIcon className="w-6 h-6"/>}
                    colorClass="text-amber-400"
                 />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
                {/* Left Column: Image & Critique */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="relative group rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-50"></div>
                        <img src={imageData.preview} alt="Analyzed" className="w-full object-cover" />
                    </div>
                    
                    <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/5 space-y-6">
                        <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wide flex items-center gap-2 border-b border-white/5 pb-3">
                            <ViewfinderIcon className="w-4 h-4 text-purple-400" /> Mentor's Critique
                        </h3>
                        
                        <div className="space-y-3">
                            <CritiqueItem icon={<ViewfinderIcon className="h-4 w-4 text-sky-400"/>} title="Composition & Framing" text={curation_insights.composition_and_framing} />
                            <CritiqueItem icon={<SunIcon className="h-4 w-4 text-yellow-400"/>} title="Lighting & Color" text={curation_insights.lighting_and_color} />
                            <CritiqueItem icon={<BookOpenIcon className="h-4 w-4 text-purple-400"/>} title="Subject & Narrative" text={curation_insights.subject_and_narrative} />
                        </div>
                         
                        <div className="pt-4 border-t border-white/5">
                             <div className="flex items-center space-x-3 bg-emerald-900/10 p-4 rounded-xl border border-emerald-500/20">
                                <div className="flex items-start space-x-4 flex-grow">
                                    <div className="flex-shrink-0 bg-emerald-500/20 rounded-lg h-8 w-8 flex items-center justify-center">
                                       <WrenchScrewdriverIcon className="h-5 w-5 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">Actionable Fix (Quick Win)</h4>
                                        <p className="text-emerald-200/70 text-xs mt-1">{curation_insights.actionable_fix}</p>
                                    </div>
                                </div>
                                 <button 
                                    onClick={handleQuickFix}
                                    disabled={isEditing || isQuickFixing}
                                    className="flex items-center justify-center text-xs uppercase tracking-wide bg-emerald-500 hover:bg-emerald-400 px-4 py-2 rounded-lg text-white font-bold disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors w-28 flex-shrink-0 shadow-lg shadow-emerald-500/20"
                                >
                                    {isQuickFixing ? <Spinner /> : 'Auto-Fix'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Center Column: Strategy & Distribution */}
                <div className="lg:col-span-1 space-y-8">
                    <DistributionSection 
                        bestUseCase={monetization_strategy.best_use_case} 
                        connections={connections}
                        onDistribute={onDistribute}
                        distributionStatus={distributionStatus}
                        distributionResult={distributionResult}
                        isDistributed={!!activeImage.isDistributed}
                        isApiKeySelected={isApiKeySelected}
                        onSelectApiKey={onSelectApiKey}
                    />

                    <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/5 space-y-4">
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                            <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wide flex items-center gap-2">
                                <TagIcon className="w-4 h-4 text-amber-400" /> SEO Keyword Pack
                            </h3>
                            <CopyButton textToCopy={monetization_strategy.suggested_keywords.join(', ')} />
                        </div>
                        <div className="flex flex-wrap gap-2">
                             {monetization_strategy.suggested_keywords.map((keyword, i) => (
                                <span key={i} className="bg-black/40 text-gray-300 px-2.5 py-1 rounded-md text-xs font-mono border border-white/5 hover:border-white/20 transition-colors cursor-default">
                                    {keyword}
                                </span>
                             ))}
                        </div>
                    </div>

                    <MarketComparisonSection comparisons={market_comparison} />
                </div>

                {/* Right Column: Social & Creative */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Editing Suite - With Toggle */}
                    <div className="space-y-4">
                        <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/5">
                             <button 
                                onClick={() => setEditMode('standard')}
                                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all ${editMode === 'standard' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                             >
                                <AdjustmentsIcon className="w-3 h-3" /> Standard
                             </button>
                             <button 
                                onClick={() => setEditMode('generative')}
                                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all ${editMode === 'generative' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-gray-500 hover:text-white'}`}
                             >
                                <SparklesIcon className="w-3 h-3" /> AI Generative
                             </button>
                        </div>

                        <CustomEditInput onApplyEdit={onApplyEdit} isEditing={isEditing} mode={editMode} />
                        
                        {editMode === 'standard' && social_media_strategy.suggested_edits && social_media_strategy.suggested_edits.length > 0 && (
                            <SuggestedEditsList 
                                edits={social_media_strategy.suggested_edits} 
                                onApplyEdit={onApplyEdit}
                                isEditing={isEditing}
                                editingSuggestion={editingSuggestion}
                            />
                        )}

                        {editMode === 'generative' && creative_remixes && creative_remixes.length > 0 && (
                            <CreativeRemixSection 
                                remixes={creative_remixes} 
                                onApplyEdit={onApplyEdit}
                                isEditing={isEditing}
                                editingSuggestion={editingSuggestion}
                            />
                        )}
                    </div>

                    {social_media_strategy && (
                        <SocialSimulator 
                            image={imageData.preview} 
                            caption={social_media_strategy.sample_posts[0]?.post_text || "Checking out this new shot!"} 
                            hashtags={social_media_strategy.hashtag_groups?.viral || []}
                        />
                    )}

                    {social_media_strategy.hashtag_groups && (
                        <HashtagVault groups={social_media_strategy.hashtag_groups} />
                    )}
                </div>
            </div>
        </div>
    );
};