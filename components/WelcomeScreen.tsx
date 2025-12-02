import React from 'react';
import { StudioIcon, DollarSignIcon, LightBoxIcon, EditIcon, SparklesIcon, BoltIcon, ArrowRightIcon, CheckCircleIcon } from './icons';
import { platforms } from '../App';

interface WelcomeScreenProps {
    onSignup: () => void;
    onLogin: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSignup, onLogin }) => {
    // Filter for just the logos we want to display in the ticker
    const tickerPlatforms = platforms.filter(p => ['Adobe Stock', 'Getty Images', 'Etsy', 'Instagram', 'Shutterstock'].includes(p.name));

    return (
        <div className="min-h-screen bg-[#05050A] text-white overflow-x-hidden font-sans flex flex-col selection:bg-indigo-500/30">
            {/* Top Navigation */}
            <nav className="absolute top-0 w-full z-50 px-6 py-6 flex justify-between items-center max-w-7xl mx-auto left-0 right-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <BoltIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-2xl font-display font-bold tracking-tight hidden sm:block">Photon<span className="text-indigo-400">Agent</span></div>
                </div>
                
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onLogin}
                        className="text-gray-400 hover:text-white font-medium text-sm transition-colors"
                    >
                        Log In
                    </button>
                    <button 
                        onClick={onSignup}
                        className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-bold hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                    >
                        Get Started
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative pt-32 pb-24 flex flex-col items-center justify-center text-center px-4 overflow-hidden flex-grow">
                {/* Background Effects */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                     <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[150px] animate-pulse-slow"></div>
                     <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[150px] animate-pulse-slow delay-1000"></div>
                     <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] rounded-full bg-blue-600/5 blur-[100px] animate-float"></div>
                     <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                </div>

                <div className="max-w-5xl mx-auto z-10 animate-fade-in-down">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-xs font-bold mb-8 uppercase tracking-widest hover:bg-white/10 hover:border-indigo-500/30 transition-all cursor-default backdrop-blur-md">
                        <BoltIcon className="w-3 h-3" />
                        AI-Powered Asset Management
                    </div>
                    
                    <h1 className="text-6xl md:text-8xl font-display font-extrabold tracking-tight leading-[1.1] mb-8">
                        Turn Your Photos<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-sky-400 drop-shadow-[0_0_30px_rgba(139,92,246,0.3)]">Into Revenue.</span>
                    </h1>
                    
                    <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-400 mb-12 leading-relaxed font-light">
                        Your hard drive is full of potential income. <span className="text-white font-medium">PhotonAgent</span> analyzes your archive, auto-edits for maximum value, and distributes your work to the world's top marketplaces in one click.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button 
                            onClick={onSignup} 
                            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-indigo-500/40 transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 border border-white/10"
                        >
                            Start Monetizing Now <ArrowRightIcon className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={onLogin}
                            className="w-full sm:w-auto px-8 py-4 bg-white/5 backdrop-blur-sm text-white rounded-xl font-bold text-lg border border-white/10 hover:bg-white/10 transition-all duration-300"
                        >
                            Log In to Console
                        </button>
                    </div>

                    <p className="mt-8 text-sm text-gray-500 font-medium">
                        No credit card required • Works with your existing portfolio
                    </p>
                </div>
            </div>

            {/* Platform Ticker (Social Proof) */}
            <div className="w-full border-y border-white/5 bg-black/20 backdrop-blur-sm py-8 overflow-hidden">
                <p className="text-center text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-6">Integrates directly with</p>
                <div className="flex justify-center items-center gap-12 md:gap-20 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                    {tickerPlatforms.map(p => (
                        <div key={p.name} className="flex items-center gap-2 group cursor-default">
                             <img src={p.logo} alt={p.name} className="h-6 md:h-8 w-auto object-contain brightness-200" />
                             <span className="hidden md:block font-bold text-gray-300 transition-colors">{p.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* The Solution Section */}
            <div className="max-w-7xl mx-auto px-4 py-32">
                <div className="text-center mb-20 animate-fade-in">
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">The Operating System for Creatives</h2>
                    <p className="text-gray-400 text-xl max-w-2xl mx-auto font-light">Manual uploading is dead. Let AI handle the boring stuff so you can focus on shooting.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Feature 1 */}
                    <div className="bg-white/5 backdrop-blur-md p-10 rounded-3xl border border-white/5 hover:border-indigo-500/30 transition-all duration-500 group hover:-translate-y-2">
                        <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-8 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
                            <SparklesIcon className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-display font-bold text-white mb-4">Market Intelligence</h3>
                        <p className="text-gray-400 leading-relaxed mb-6">
                            Don't guess what sells. Our AI scores your images on <span className="text-indigo-300 font-medium">Monetization, Social, and Portfolio</span> potential before you upload a single file.
                        </p>
                        <ul className="space-y-3">
                            <li className="flex items-center text-sm text-gray-400 group-hover:text-gray-200 transition-colors"><CheckCircleIcon className="w-5 h-5 mr-3 text-indigo-500"/> Commercial Viability Score</li>
                            <li className="flex items-center text-sm text-gray-400 group-hover:text-gray-200 transition-colors"><CheckCircleIcon className="w-5 h-5 mr-3 text-indigo-500"/> SEO Keyword Generation</li>
                        </ul>
                    </div>

                    {/* Feature 2 */}
                    <div className="bg-white/5 backdrop-blur-md p-10 rounded-3xl border border-white/5 hover:border-purple-500/30 transition-all duration-500 group hover:-translate-y-2">
                        <div className="h-16 w-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-8 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
                            <EditIcon className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-display font-bold text-white mb-4">Hybrid Editing Suite</h3>
                        <p className="text-gray-400 leading-relaxed mb-6">
                            Professional manual controls meet Generative AI. Upscale to 4K, remove backgrounds, or apply AI-tuned presets in seconds.
                        </p>
                        <ul className="space-y-3">
                            <li className="flex items-center text-sm text-gray-400 group-hover:text-gray-200 transition-colors"><CheckCircleIcon className="w-5 h-5 mr-3 text-purple-500"/> Generative Fill & Expand</li>
                            <li className="flex items-center text-sm text-gray-400 group-hover:text-gray-200 transition-colors"><CheckCircleIcon className="w-5 h-5 mr-3 text-purple-500"/> Smart Upscaling (26MP)</li>
                        </ul>
                    </div>

                    {/* Feature 3 */}
                    <div className="bg-white/5 backdrop-blur-md p-10 rounded-3xl border border-white/5 hover:border-green-500/30 transition-all duration-500 group hover:-translate-y-2">
                        <div className="h-16 w-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 mb-8 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
                            <DollarSignIcon className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-display font-bold text-white mb-4">Automated Distribution</h3>
                        <p className="text-gray-400 leading-relaxed mb-6">
                            One upload, everywhere. We format, tag, and submit your work to stock sites, social platforms, and print-on-demand services.
                        </p>
                         <ul className="space-y-3">
                            <li className="flex items-center text-sm text-gray-400 group-hover:text-gray-200 transition-colors"><CheckCircleIcon className="w-5 h-5 mr-3 text-green-500"/> Multi-Platform Sync</li>
                            <li className="flex items-center text-sm text-gray-400 group-hover:text-gray-200 transition-colors"><CheckCircleIcon className="w-5 h-5 mr-3 text-green-500"/> Unified Earnings Dashboard</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Final CTA */}
            <div className="mt-auto relative py-32 border-t border-white/5 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-indigo-950/40 pointer-events-none"></div>
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-8">Ready to professionalize your passion?</h2>
                    <div className="flex flex-col items-center gap-6">
                        <button onClick={onSignup} className="w-full sm:w-auto px-12 py-5 bg-white text-black rounded-xl font-bold text-lg hover:bg-gray-100 transform hover:-translate-y-1 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                            Create Free Account
                        </button>
                        <p className="text-gray-500 text-sm font-medium">Join 10,000+ creators earning with PhotonAgent.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};