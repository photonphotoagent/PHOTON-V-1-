import React from 'react';
import { StudioIcon, DollarSignIcon } from './icons';
import { LightBoxIcon } from './icons';

interface WelcomeScreenProps {
    onGetStarted: () => void;
}

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, description: string }> = ({ icon, title, description }) => (
    <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 transform hover:-translate-y-2 transition-transform duration-300 ease-in-out">
        <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-indigo-500 text-white mb-4">
            {icon}
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm">{description}</p>
    </div>
);


export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted }) => {
    return (
        <div 
            className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 text-center overflow-hidden"
            style={{ backgroundImage: 'radial-gradient(ellipse at top, #1f2937, #111827)'}}
        >
            <div className="absolute inset-0 bg-grid-gray-700/20 [mask-image:linear-gradient(to_bottom,white_2%,transparent_50%)]"></div>
            
            <div className="z-10 animate-fade-in-down">
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-500">
                    Turn Your Photos Into Profit.
                </h1>
                <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight mt-2 text-gray-200">
                    Effortlessly.
                </h2>
                <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-gray-300">
                    PhotonAgent.ai is your autonomous agent for analyzing, optimizing, and distributing your images to the world's top marketplaces. Stop editing, start earning.
                </p>
                <button 
                    onClick={onGetStarted} 
                    className="mt-10 px-8 py-4 bg-indigo-600 rounded-full font-bold text-lg text-white hover:bg-indigo-500 transform hover:scale-105 transition-all duration-300 ease-in-out shadow-lg shadow-indigo-500/30"
                >
                    Get Started &rarr;
                </button>
            </div>

            <div className="z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-24 max-w-5xl w-full animate-fade-in-up">
                <FeatureCard 
                    icon={<LightBoxIcon className="w-6 h-6" />}
                    title="AI Analysis & Culling"
                    description="Instantly identify your most commercially viable images. Our AI rates, keywords, and captions every shot."
                />
                <FeatureCard 
                    icon={<StudioIcon className="w-6 h-6" />}
                    title="Automated Distribution"
                    description="Let your agent submit your best work to top stock photo and print-on-demand sites automatically."
                />
                <FeatureCard 
                    icon={<DollarSignIcon className="w-6 h-6" />}
                    title="Unified Earnings"
                    description="Track your earnings from every marketplace in one beautiful, simple dashboard."
                />
                 <FeatureCard 
                    icon={<ChatIcon className="w-6 h-6" />}
                    title="Market Intelligence"
                    description="Get real-time insights from your AI agent on what's selling and where the opportunities are."
                />
            </div>
        </div>
    );
};

// Dummy ChatIcon for WelcomeScreen
const ChatIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);
