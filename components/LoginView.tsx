import React, { useState, useEffect, useRef } from 'react';
import { Spinner } from './Spinner';
import * as AuthService from '../services/authService';
import { User } from '../types';
import { GoogleIcon, ArrowRightIcon, CheckCircleIcon, ViewfinderIcon, RectangleStackIcon, BoltIcon, ChartBarIcon } from './icons';

interface LoginViewProps {
    onLoginSuccess: (user: User) => void;
    initialMode?: 'login' | 'signup';
}

type SignupStep = 'credentials' | 'experience' | 'archive';
type ExperienceLevel = 'Beginner' | 'Enthusiast' | 'Pro' | 'Agency';
type ArchiveSize = 'Small' | 'Medium' | 'Large' | 'Massive';

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, initialMode = 'login' }) => {
    const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
    const [signupStep, setSignupStep] = useState<SignupStep>('credentials');
    const [stepIndex, setStepIndex] = useState(0); // 0, 1, 2 for rotation
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isZooming, setIsZooming] = useState(false); // For the final transition
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        experienceLevel: 'Beginner' as ExperienceLevel,
        archiveSize: 'Small' as ArchiveSize
    });

    useEffect(() => {
        setMode(initialMode);
    }, [initialMode]);

    // --- Handlers ---

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const user = await AuthService.login(formData.email, formData.password);
            onLoginSuccess(user);
        } catch (err: any) {
            setError(err.message || 'Login failed');
            setIsLoading(false);
        }
    };

    const handleSignupSubmit = async () => {
        setError('');
        setIsLoading(true);
        
        try {
            const user = await AuthService.signup(
                formData.name, 
                formData.email, 
                formData.password,
                formData.experienceLevel,
                formData.archiveSize
            );
            
            // Trigger the "Zoom Into Box" animation
            setIsZooming(true);
            
            // Wait for animation then switch view
            setTimeout(() => {
                onLoginSuccess(user);
            }, 1200);

        } catch (err: any) {
            setError(err.message || 'Signup failed');
            setIsLoading(false);
            setIsZooming(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setIsLoading(true);
        try {
            // INTEGRATION: Trigger Google Cloud Project/API Key selection
            if ((window as any).aistudio) {
                await (window as any).aistudio.openSelectKey();
            }

            const user = await AuthService.loginWithGoogle();
            onLoginSuccess(user);
        } catch (err: any) {
            // Ignore cancellation errors if user closes the dialog
            if (err.message && err.message.includes('cancel')) {
                setIsLoading(false);
                return;
            }
            setError(err.message || 'Google Cloud connection failed');
            setIsLoading(false);
        }
    };

    const nextStep = () => {
        if (signupStep === 'credentials') {
            if (!formData.name || !formData.email || !formData.password) {
                setError('Please fill in all fields');
                return;
            }
            setSignupStep('experience');
            setStepIndex(1);
        } else if (signupStep === 'experience') {
            setSignupStep('archive');
            setStepIndex(2);
        } else if (signupStep === 'archive') {
            handleSignupSubmit();
        }
        setError('');
    };

    const prevStep = () => {
        if (signupStep === 'experience') {
            setSignupStep('credentials');
            setStepIndex(0);
        } else if (signupStep === 'archive') {
            setSignupStep('experience');
            setStepIndex(1);
        }
        setError('');
    };

    const updateForm = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // --- 3D Cube Styles & Components ---
    
    // Calculate rotation based on step
    // Step 0 (Front): rotateY(0)
    // Step 1 (Right): rotateY(-90deg)
    // Step 2 (Back): rotateY(-180deg)
    const rotationStyle = {
        transform: `rotateY(${stepIndex * -90}deg)`,
        transition: 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)'
    };

    // Card Component for selections
    const SelectionCard: React.FC<{ 
        selected: boolean; 
        onClick: () => void; 
        icon: React.ReactNode; 
        title: string; 
        description: string; 
    }> = ({ selected, onClick, icon, title, description }) => (
        <div 
            onClick={onClick}
            className={`relative p-3 rounded-xl border cursor-pointer transition-all duration-200 group ${
                selected 
                ? 'bg-indigo-600/30 border-indigo-400 ring-1 ring-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]' 
                : 'bg-gray-900/60 border-gray-700 hover:border-gray-500 hover:bg-gray-800'
            }`}
        >
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${selected ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-400 group-hover:text-white'} transition-colors`}>
                    {icon}
                </div>
                <div>
                    <h4 className={`font-bold text-sm ${selected ? 'text-white' : 'text-gray-200'}`}>{title}</h4>
                    <p className="text-[10px] text-gray-400 mt-1 leading-tight">{description}</p>
                </div>
            </div>
        </div>
    );

    // --- Renderers ---

    const renderLogin = () => (
        <div className="bg-gray-800/50 backdrop-blur-xl p-8 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl relative z-10 animate-fade-in-up min-h-[500px] flex flex-col justify-center">
             <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white tracking-wider mb-2">
                    PhotonAgent<span className="text-indigo-400">.ai</span>
                </h1>
                <p className="text-gray-400 text-sm">Welcome back to your workspace.</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                    <input
                        type="email"
                        required
                        className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={e => updateForm('email', e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                    <input
                        type="password"
                        required
                        className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={e => updateForm('password', e.target.value)}
                    />
                </div>

                {error && <div className="text-red-400 text-sm text-center p-2">{error}</div>}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg shadow-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                >
                    {isLoading ? <Spinner /> : 'Enter Workspace'}
                </button>

                 <div className="mt-4">
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-3 rounded-lg shadow-lg transition-all flex items-center justify-center space-x-3 mt-2 border border-white"
                    >
                        <GoogleIcon className="w-5 h-5" />
                        <span>Sign in with Google</span>
                    </button>
                    <p className="text-[10px] text-center text-gray-500 mt-2">Connects your Google Cloud Project for AI Billing</p>
                 </div>
                 
                 <p className="text-center text-gray-400 text-sm mt-6">
                    Don't have an account? <button type="button" onClick={() => setMode('signup')} className="text-indigo-400 hover:underline">Join Now</button>
                </p>
            </form>
        </div>
    );

    const render3DSignup = () => (
        <div className={`relative w-[400px] h-[550px] perspective-[1200px] transition-all duration-1000 ${isZooming ? 'scale-[50] opacity-0 ease-in' : 'scale-100 opacity-100'}`}>
            {/* The Cube Container */}
            <div 
                className="w-full h-full relative preserve-3d transition-transform duration-700 ease-in-out"
                style={{ 
                    transformStyle: 'preserve-3d', 
                    ...rotationStyle 
                }}
            >
                {/* --- FACE 1: Credentials (Front) --- */}
                <div 
                    className="absolute inset-0 bg-gray-800/90 border border-gray-600 rounded-2xl shadow-2xl p-8 backface-hidden flex flex-col"
                    style={{ transform: 'rotateY(0deg) translateZ(200px)' }}
                >
                    <div className="text-center mb-6">
                        <div className="inline-block p-3 rounded-full bg-indigo-900/50 text-indigo-400 mb-2 border border-indigo-500/30">
                            <BoltIcon className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Unlock Your Studio</h2>
                        <p className="text-gray-400 text-xs mt-1">Step 1: Identity Verification</p>
                    </div>

                    <div className="space-y-4 flex-grow">
                         <div>
                            <label className="text-xs font-bold text-gray-400 uppercase">Full Name</label>
                            <input
                                type="text"
                                className="w-full bg-black/40 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none text-sm"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={e => updateForm('name', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase">Email</label>
                            <input
                                type="email"
                                className="w-full bg-black/40 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none text-sm"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={e => updateForm('email', e.target.value)}
                            />
                        </div>
                         <div>
                            <label className="text-xs font-bold text-gray-400 uppercase">Password</label>
                            <input
                                type="password"
                                className="w-full bg-black/40 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none text-sm"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={e => updateForm('password', e.target.value)}
                            />
                        </div>
                        {error && <div className="text-red-400 text-xs text-center">{error}</div>}
                    </div>

                    <div className="mt-6 flex justify-between items-center">
                        <button type="button" onClick={() => setMode('login')} className="text-gray-500 hover:text-white text-xs">Login instead</button>
                        <button 
                            onClick={nextStep}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg flex items-center gap-2 text-sm transition-all"
                        >
                            Next <ArrowRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* --- FACE 2: Experience (Right) --- */}
                <div 
                    className="absolute inset-0 bg-gray-800/90 border border-gray-600 rounded-2xl shadow-2xl p-8 backface-hidden flex flex-col"
                    style={{ transform: 'rotateY(90deg) translateZ(200px)' }}
                >
                     <div className="text-center mb-6">
                        <div className="inline-block p-3 rounded-full bg-purple-900/50 text-purple-400 mb-2 border border-purple-500/30">
                            <ViewfinderIcon className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Calibrate AI</h2>
                        <p className="text-gray-400 text-xs mt-1">Step 2: Experience Level</p>
                    </div>

                    <div className="grid grid-cols-1 gap-2 flex-grow overflow-y-auto pr-1 custom-scrollbar">
                        <SelectionCard 
                            selected={formData.experienceLevel === 'Beginner'}
                            onClick={() => updateForm('experienceLevel', 'Beginner')}
                            icon={<ViewfinderIcon className="w-4 h-4"/>}
                            title="Beginner"
                            description="Learning composition."
                        />
                        <SelectionCard 
                            selected={formData.experienceLevel === 'Enthusiast'}
                            onClick={() => updateForm('experienceLevel', 'Enthusiast')}
                            icon={<BoltIcon className="w-4 h-4"/>}
                            title="Enthusiast"
                            description="Shooting weekly."
                        />
                        <SelectionCard 
                            selected={formData.experienceLevel === 'Pro'}
                            onClick={() => updateForm('experienceLevel', 'Pro')}
                            icon={<ChartBarIcon className="w-4 h-4"/>}
                            title="Professional"
                            description="Sales focused."
                        />
                        <SelectionCard 
                            selected={formData.experienceLevel === 'Agency'}
                            onClick={() => updateForm('experienceLevel', 'Agency')}
                            icon={<RectangleStackIcon className="w-4 h-4"/>}
                            title="Agency"
                            description="High volume."
                        />
                    </div>

                    <div className="mt-6 flex justify-between items-center pt-4 border-t border-gray-700">
                        <button onClick={prevStep} className="text-gray-400 hover:text-white text-sm font-bold">Back</button>
                        <button 
                            onClick={nextStep}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg flex items-center gap-2 text-sm transition-all"
                        >
                            Next <ArrowRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* --- FACE 3: Archive (Back - essentially 180deg) --- */}
                <div 
                    className="absolute inset-0 bg-gray-800/90 border border-gray-600 rounded-2xl shadow-2xl p-8 backface-hidden flex flex-col"
                    style={{ transform: 'rotateY(180deg) translateZ(200px)' }}
                >
                     <div className="text-center mb-6">
                        <div className="inline-block p-3 rounded-full bg-green-900/50 text-green-400 mb-2 border border-green-500/30">
                            <RectangleStackIcon className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Allocate Vault</h2>
                        <p className="text-gray-400 text-xs mt-1">Step 3: Archive Size</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 flex-grow content-start">
                        <SelectionCard 
                            selected={formData.archiveSize === 'Small'}
                            onClick={() => updateForm('archiveSize', 'Small')}
                            icon={<span className="font-bold text-sm">S</span>}
                            title="< 1k"
                            description="Starter"
                        />
                        <SelectionCard 
                            selected={formData.archiveSize === 'Medium'}
                            onClick={() => updateForm('archiveSize', 'Medium')}
                            icon={<span className="font-bold text-sm">M</span>}
                            title="1k-10k"
                            description="Growing"
                        />
                        <SelectionCard 
                            selected={formData.archiveSize === 'Large'}
                            onClick={() => updateForm('archiveSize', 'Large')}
                            icon={<span className="font-bold text-sm">L</span>}
                            title="10k-100k"
                            description="Pro"
                        />
                        <SelectionCard 
                            selected={formData.archiveSize === 'Massive'}
                            onClick={() => updateForm('archiveSize', 'Massive')}
                            icon={<span className="font-bold text-sm">XL</span>}
                            title="100k+"
                            description="Enterprise"
                        />
                    </div>

                     <div className="mt-6 flex justify-between items-center pt-4 border-t border-gray-700">
                        <button onClick={prevStep} className="text-gray-400 hover:text-white text-sm font-bold">Back</button>
                        <button 
                            onClick={handleSignupSubmit}
                            disabled={isLoading}
                            className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg flex items-center gap-2 text-sm transition-all disabled:opacity-50"
                        >
                            {isLoading ? <Spinner /> : 'Initialize'}
                        </button>
                    </div>
                </div>
                
                {/* Decorative Sides (Top/Bottom) to make it feel like a real box */}
                <div 
                    className="absolute inset-0 bg-gray-900/80 border border-gray-700"
                    style={{ width: '400px', height: '400px', transform: 'rotateX(90deg) translateZ(200px)', top: '-200px' }}
                ></div>
                <div 
                    className="absolute inset-0 bg-gray-900/80 border border-gray-700"
                    style={{ width: '400px', height: '400px', transform: 'rotateX(-90deg) translateZ(350px)', top: '200px' }}
                ></div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden font-sans perspective-[2000px]">
            {/* Background FX */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[100px] animate-pulse-slow"></div>
                <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[100px] animate-pulse-slow delay-1000"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            </div>

            {mode === 'login' ? renderLogin() : render3DSignup()}
        </div>
    );
};