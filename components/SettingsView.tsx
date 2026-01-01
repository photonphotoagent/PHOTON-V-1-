import React, { useState } from 'react';
import { Connections, Platform, PlatformName, AISettings } from '../types';
import { platforms } from '../App';
import { SettingsIcon, EyeIcon, BoltIcon, ArrowDownTrayIcon, GoogleIcon, CheckCircleIcon } from './icons';

const ToggleSwitch: React.FC<{
    checked: boolean;
    onChange: (checked: boolean) => void;
}> = ({ checked, onChange }) => {
    return (
        <label className="relative inline-flex items-center cursor-pointer">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-indigo-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
    );
};

const RangeSlider: React.FC<{
    label: string;
    leftLabel: string;
    rightLabel: string;
    value: number;
    onChange: (val: number) => void;
}> = ({ label, leftLabel, rightLabel, value, onChange }) => {
    return (
        <div className="space-y-2">
            <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-300">{label}</span>
            </div>
            <input 
                type="range" 
                min="1" 
                max="10" 
                value={value} 
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
             <div className="flex justify-between text-xs text-gray-500">
                <span>{leftLabel}</span>
                <span>{rightLabel}</span>
            </div>
        </div>
    );
};

export const SettingsView: React.FC<{
    connections: Connections;
    setConnections: React.Dispatch<React.SetStateAction<Connections>>;
    isApiKeySelected: boolean;
    onConnectGoogleCloud: () => void;
    aiSettings: AISettings;
    setAiSettings: React.Dispatch<React.SetStateAction<AISettings>>;
}> = ({ connections, setConnections, isApiKeySelected, onConnectGoogleCloud, aiSettings, setAiSettings }) => {

    // Notification preferences (local state - could be persisted separately)
    const [emailDigest, setEmailDigest] = useState(true);
    const [salesAlerts, setSalesAlerts] = useState(true);
    const [trendAlerts, setTrendAlerts] = useState(false);
    
    const [profile, setProfile] = useState({
        name: "Creative Pro",
        website: "www.myportfolio.com",
        bio: "Digital artist focusing on surreal landscapes."
    });

    const handleToggle = (platformName: PlatformName, isEnabled: boolean) => {
        setConnections(prev => ({
            ...prev,
            [platformName]: isEnabled,
        }));
    };

    const renderPlatformCategory = (category: 'Stock' | 'Print' | 'Social') => (
        <div key={category}>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">{category} Platforms</h3>
            <div className="bg-gray-800 rounded-lg border border-gray-700 divide-y divide-gray-700">
                {platforms.filter(p => p.category === category).map(platform => (
                    <div key={platform.name} className="p-4 flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <img src={platform.logo} alt={`${platform.name} logo`} className="h-8 w-auto object-contain invert-[.85] brightness-200" style={{maxHeight: '2rem', maxWidth: '100px'}} />
                            <span className="font-semibold text-gray-200">{platform.name}</span>
                        </div>
                        <ToggleSwitch
                            checked={!!connections[platform.name]}
                            onChange={(isChecked) => handleToggle(platform.name, isChecked)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
    
    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-12 animate-fade-in pb-24">
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <SettingsIcon className="w-8 h-8 text-gray-400" /> Settings & Preferences
                </h1>
                <p className="text-gray-400 mt-2">Manage your studio profile, AI personality, and distribution channels.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Account & AI */}
                <div className="space-y-8 lg:col-span-1">
                     {/* Compute & Infrastructure Section */}
                     <section>
                        <h2 className="text-xl font-semibold text-indigo-400 mb-4">Compute & Infrastructure</h2>
                        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg">
                                        <GoogleIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">Google Cloud</h4>
                                        <p className="text-xs text-gray-400">Gemini API Provider</p>
                                    </div>
                                </div>
                                {isApiKeySelected ? (
                                    <span className="flex items-center gap-1 text-green-400 text-xs font-bold uppercase tracking-wide bg-green-900/30 px-2 py-1 rounded border border-green-500/20">
                                        <CheckCircleIcon className="w-3 h-3" /> Connected
                                    </span>
                                ) : (
                                    <span className="text-gray-500 text-xs font-bold uppercase tracking-wide bg-gray-700/50 px-2 py-1 rounded border border-gray-600">
                                        Not Connected
                                    </span>
                                )}
                            </div>
                            
                            <div className="pt-2">
                                <button 
                                    onClick={onConnectGoogleCloud}
                                    className={`w-full text-xs font-bold py-2 rounded transition-colors ${isApiKeySelected ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
                                >
                                    {isApiKeySelected ? 'Switch Project / API Key' : 'Connect Google Cloud Account'}
                                </button>
                                <p className="text-[10px] text-gray-500 mt-2 text-center">
                                    Used for generative AI billing and quotas.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Profile Section */}
                    <section>
                         <h2 className="text-xl font-semibold text-indigo-400 mb-4">Studio Profile</h2>
                         <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Display Name</label>
                                <input type="text" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Website / Portfolio</label>
                                <input type="text" value={profile.website} onChange={(e) => setProfile({...profile, website: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Artist Bio</label>
                                <textarea rows={3} value={profile.bio} onChange={(e) => setProfile({...profile, bio: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                            </div>
                            <button className="w-full bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold py-2 rounded transition-colors">Save Profile</button>
                         </div>
                    </section>

                    {/* AI Personality Section */}
                    <section>
                        <h2 className="text-xl font-semibold text-indigo-400 mb-4">AI Personality Engine</h2>
                        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-6">
                             <p className="text-sm text-gray-400">Tune how your Mentor interacts with your work.</p>
                             
                             <RangeSlider
                                label="Critique Intensity"
                                leftLabel="Gentle & Supportive"
                                rightLabel="Brutally Honest"
                                value={aiSettings.critiqueLevel}
                                onChange={(val) => setAiSettings(prev => ({ ...prev, critiqueLevel: val }))}
                             />

                             <RangeSlider
                                label="Generative Creativity"
                                leftLabel="Safe & Realistic"
                                rightLabel="Wild & Abstract"
                                value={aiSettings.creativityLevel}
                                onChange={(val) => setAiSettings(prev => ({ ...prev, creativityLevel: val }))}
                             />

                             <p className="text-xs text-green-400 mt-2">✓ Settings auto-save and apply to all AI outputs</p>
                        </div>
                    </section>

                    {/* Storage Section */}
                    <section>
                        <h2 className="text-xl font-semibold text-indigo-400 mb-4">Storage Usage</h2>
                        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-2">
                            <div className="flex justify-between text-sm font-medium text-white">
                                <span>2.4 GB Used</span>
                                <span>5 GB Total</span>
                            </div>
                            <div className="w-full bg-gray-900 rounded-full h-2.5">
                                <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: '48%' }}></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Free Plan Limit. <span className="text-indigo-400 cursor-pointer hover:underline">Upgrade to Pro for Unlimited.</span></p>
                        </div>
                    </section>
                </div>

                {/* Right Column: Connections & Notifications */}
                <div className="space-y-8 lg:col-span-2">
                    {/* Connections */}
                    <section>
                        <h2 className="text-xl font-semibold text-indigo-400 mb-4">Platform Connections</h2>
                        <div className="space-y-6">
                            {renderPlatformCategory('Stock')}
                            {renderPlatformCategory('Print')}
                            {renderPlatformCategory('Social')}
                        </div>
                    </section>

                    {/* Notifications */}
                    <section>
                        <h2 className="text-xl font-semibold text-indigo-400 mb-4">Notification Hub</h2>
                         <div className="bg-gray-800 rounded-lg border border-gray-700 divide-y divide-gray-700">
                             <div className="p-4 flex justify-between items-center">
                                <div>
                                    <h4 className="text-white font-medium">Weekly Performance Digest</h4>
                                    <p className="text-xs text-gray-400">Summary of earnings, views, and top performing assets.</p>
                                </div>
                                <ToggleSwitch checked={emailDigest} onChange={setEmailDigest} />
                             </div>
                             <div className="p-4 flex justify-between items-center">
                                <div>
                                    <h4 className="text-white font-medium">Instant Sales Alerts</h4>
                                    <p className="text-xs text-gray-400">Get notified immediately when you make a sale.</p>
                                </div>
                                <ToggleSwitch checked={salesAlerts} onChange={setSalesAlerts} />
                             </div>
                             <div className="p-4 flex justify-between items-center">
                                <div>
                                    <h4 className="text-white font-medium">Trend Spotting</h4>
                                    <p className="text-xs text-gray-400">Alerts when the AI detects a trend relevant to your style.</p>
                                </div>
                                <ToggleSwitch checked={trendAlerts} onChange={setTrendAlerts} />
                             </div>
                         </div>
                    </section>
                </div>
            </div>
        </div>
    );
};