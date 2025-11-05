import React from 'react';
import { Connections, Platform, PlatformName } from '../types';
import { platforms } from '../App';

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

export const SettingsView: React.FC<{
    connections: Connections;
    setConnections: React.Dispatch<React.SetStateAction<Connections>>;
}> = ({ connections, setConnections }) => {
    
    const handleToggle = (platformName: PlatformName, isEnabled: boolean) => {
        setConnections(prev => ({
            ...prev,
            [platformName]: isEnabled,
        }));
    };

    const renderPlatformCategory = (category: 'Stock' | 'Print' | 'Social') => (
        <div key={category}>
            <h2 className="text-xl font-semibold text-indigo-400 mb-4">{category} Platforms</h2>
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
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
            <h1 className="text-3xl font-bold text-white">Platform Connections</h1>
            <p className="text-gray-400">
                Enable or disable platforms for the PhotonAgent AI to use for distribution. 
                Connecting to these services is handled securely at the time of distribution using your selected API key.
            </p>
            
            {renderPlatformCategory('Stock')}
            {renderPlatformCategory('Print')}
            {renderPlatformCategory('Social')}
        </div>
    );
};
