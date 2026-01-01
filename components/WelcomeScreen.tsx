import React, { useState } from 'react';
import { StudioIcon, DollarSignIcon, LightBoxIcon, EditIcon, SparklesIcon, BoltIcon, ArrowRightIcon, CheckCircleIcon } from './icons';
import { platforms } from '../App';

// Email collection configuration
const WEB3FORMS_KEY = '8248f9a0-804b-49e3-ac2d-30dff7a9fdf9';

interface WelcomeScreenProps {
    onSignup: () => void;
    onLogin: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSignup, onLogin }) => {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !email.includes('@')) return;

        setIsSubmitting(true);

        // Store email locally (always works)
        const existingEmails = JSON.parse(localStorage.getItem('photon_waitlist') || '[]');
        existingEmails.push({ email, timestamp: new Date().toISOString() });
        localStorage.setItem('photon_waitlist', JSON.stringify(existingEmails));

        // If Web3Forms key is configured, also send email notification
        if (WEB3FORMS_KEY) {
            try {
                await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        access_key: WEB3FORMS_KEY,
                        email: email,
                        subject: 'New Photon Waitlist Signup',
                        from_name: 'Photon Waitlist'
                    })
                });
            } catch (error) {
                console.log('Email notification failed, but signup still works');
            }
        }

        // Grant access
        localStorage.setItem('photon_access', 'true');
        localStorage.setItem('photon_email', email);

        setSubmitStatus('success');
        setEmail('');

        // Redirect to app after short delay
        setTimeout(() => {
            onSignup();
        }, 1500);

        setIsSubmitting(false);
    };

    // Platforms to show in the ticker carousel
    const tickerPlatforms = platforms.filter(p =>
        ['Adobe Stock', 'Getty Images', 'Shutterstock', 'Unsplash', 'Etsy', 'Instagram', 'Pinterest', 'TikTok'].includes(p.name)
    );

    return (
        <div className="min-h-screen bg-[#0D0906] text-white overflow-x-hidden font-sans flex flex-col selection:bg-amber-500/30">
            {/* Top Navigation */}
            <nav className="absolute top-0 w-full z-50 px-6 py-5 flex justify-between items-center max-w-7xl mx-auto left-0 right-0">
                <div className="flex items-center gap-2 group cursor-pointer">
                    <img src="/photon-logo.svg" alt="Photon" className="h-10 w-auto object-contain group-hover:scale-105 transition-all duration-300" />
                </div>

                <div className="flex items-center gap-5">
                    <button
                        onClick={onLogin}
                        className="text-[#A89F91] hover:text-[#F5F0E6] font-medium text-sm transition-all duration-300"
                    >
                        Log In
                    </button>
                    <button
                        onClick={onSignup}
                        className="group relative bg-gradient-to-r from-[#C9A962] to-[#D4A84B] text-[#1A1410] px-5 py-2.5 rounded-full text-sm font-bold hover:shadow-[0_0_30px_rgba(201,169,98,0.4)] transition-all duration-300 overflow-hidden"
                    >
                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500"></span>
                        <span className="relative">Get Started</span>
                    </button>
                </div>
            </nav>

            {/* ==================== HERO WITH TEXTURE ==================== */}
            <div className="relative pt-32 pb-24 flex flex-col items-center justify-center text-center px-4 overflow-hidden min-h-[90vh]">
                {/* PRIMARY TEXTURE BACKGROUND - ALL 4 TEXTURES LAYERED */}
                <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">

                     {/* TEXTURE 1: Glass smudges with light leaks - BASE LAYER */}
                     <div className="absolute inset-0 bg-[url('/textures/glass-smudges.png')] bg-cover bg-center scale-110"></div>

                     {/* TEXTURE 2: Composite tactile - aged paper warmth */}
                     <div className="absolute inset-0 bg-[url('/textures/composite-tactile.png')] bg-cover bg-center opacity-[0.6]" style={{mixBlendMode: 'screen'}}></div>

                     {/* TEXTURE 3: Paper fibers 1 - organic texture */}
                     <div className="absolute inset-0 bg-[url('/textures/paper-fibers-1.png')] bg-cover bg-center opacity-[0.25]" style={{mixBlendMode: 'overlay'}}></div>

                     {/* TEXTURE 4: Paper fibers 2 - additional fiber detail */}
                     <div className="absolute inset-0 bg-[url('/textures/paper-fibers-2.png')] bg-cover bg-center opacity-[0.2]" style={{mixBlendMode: 'multiply'}}></div>

                     {/* Color enhancement washes */}
                     <div className="absolute top-[-20%] left-[-15%] w-[80%] h-[80%] rounded-[50%] bg-gradient-to-br from-[#C9A962]/30 via-[#D4A84B]/15 to-transparent blur-[100px]" style={{animation: 'breathe 15s ease-in-out infinite'}}></div>
                     <div className="absolute bottom-[-25%] right-[-10%] w-[70%] h-[70%] rounded-[50%] bg-gradient-to-tl from-[#8FAF7E]/20 via-[#6B7355]/10 to-transparent blur-[90px]" style={{animation: 'breathe 18s ease-in-out infinite', animationDelay: '-6s'}}></div>

                     {/* Fine grain overlay */}
                     <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.08]" style={{mixBlendMode: 'overlay'}}></div>

                     {/* Dust particles */}
                     {[...Array(30)].map((_, i) => (
                       <div
                         key={`dust-${i}`}
                         className="absolute rounded-full bg-[#F5F0E6]"
                         style={{
                           width: `${1.5 + Math.random() * 2.5}px`,
                           height: `${1.5 + Math.random() * 2.5}px`,
                           left: `${Math.random() * 100}%`,
                           top: `${Math.random() * 100}%`,
                           opacity: 0.15 + Math.random() * 0.25,
                           animation: `dustFloat ${20 + Math.random() * 18}s ease-in-out infinite`,
                           animationDelay: `${-Math.random() * 20}s`
                         }}
                       ></div>
                     ))}

                     {/* Rising golden motes */}
                     {[...Array(15)].map((_, i) => (
                       <div
                         key={`mote-${i}`}
                         className="absolute rounded-full bg-[#C9A962]"
                         style={{
                           width: `${2 + (i % 3)}px`,
                           height: `${2 + (i % 3)}px`,
                           left: `${5 + i * 6}%`,
                           bottom: '-3%',
                           opacity: 0.4 + (i % 3) * 0.15,
                           animation: `floatMote ${24 + i * 2}s linear infinite`,
                           animationDelay: `${i * -1.8}s`
                         }}
                       ></div>
                     ))}

                     {/* Subtle vignette */}
                     <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_50%,rgba(13,9,6,0.4)_85%,rgba(13,9,6,0.6)_100%)]"></div>

                     {/* Top gradient for text contrast */}
                     <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-[#0D0906]/50 via-[#0D0906]/20 to-transparent"></div>
                </div>

                <div className="max-w-5xl mx-auto z-10">
                    {/* Badge - fade in first */}
                    <div
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0D0906]/60 backdrop-blur-md border border-[#C9A962]/40 text-[#C9A962] text-xs font-bold mb-8 uppercase tracking-widest hover:bg-[#0D0906]/70 hover:border-[#C9A962]/60 transition-all duration-500 cursor-default group opacity-0"
                        style={{animation: 'fadeInDown 0.8s ease-out forwards, border-glow 4s ease-in-out infinite', animationDelay: '0.2s'}}
                    >
                        <BoltIcon className="w-3 h-3 group-hover:animate-pulse" />
                        <span>The Operating System for Creatives</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8FAF7E] animate-pulse shadow-[0_0_8px_2px_rgba(143,175,126,0.4)]"></span>
                    </div>

                    {/* Headline - refined sizing */}
                    <h1 className="font-display font-extrabold tracking-tight leading-[1] mb-6 text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
                        <span className="block text-lg md:text-xl lg:text-2xl opacity-0 text-[#A89F91] font-medium tracking-[0.2em] uppercase mb-2" style={{animation: 'fadeInUp 0.8s ease-out forwards', animationDelay: '0.4s'}}>the modern creative</span>
                        <span className="block text-5xl md:text-7xl lg:text-8xl text-transparent bg-clip-text bg-[length:200%_auto] bg-gradient-to-r from-[#C9A962] via-[#E07B39] via-50% to-[#C9A962] opacity-0 uppercase tracking-tight font-black" style={{animation: 'fadeInUp 0.8s ease-out forwards, text-shimmer 4s linear infinite', animationDelay: '0.6s'}}>Console</span>
                    </h1>

                    <p
                        className="max-w-xl mx-auto text-base md:text-lg text-[#E8E2D6]/90 mb-10 leading-relaxed font-light opacity-0 drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]"
                        style={{animation: 'fadeInUp 0.8s ease-out forwards', animationDelay: '0.8s'}}
                    >
                        AI-powered editing, curation, and distribution for photographers. Transform your work into income.
                    </p>

                    {/* Email Signup Form */}
                    <div
                        className="w-full max-w-md mx-auto opacity-0"
                        style={{animation: 'fadeInUp 0.8s ease-out forwards', animationDelay: '1s'}}
                    >
                        {submitStatus === 'success' ? (
                            <div className="flex items-center justify-center gap-3 py-5 px-6 bg-[#8FAF7E]/20 border border-[#8FAF7E]/40 rounded-2xl backdrop-blur-md">
                                <CheckCircleIcon className="w-6 h-6 text-[#8FAF7E]" />
                                <span className="text-[#8FAF7E] font-bold">You're on the list! We'll be in touch soon.</span>
                            </div>
                        ) : (
                            <form onSubmit={handleEmailSubmit} className="relative">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        className="flex-1 px-6 py-4 bg-[#0D0906]/80 backdrop-blur-md border border-[#3D2E1F] rounded-xl text-white placeholder-[#6B6358] focus:outline-none focus:border-[#C9A962]/60 focus:ring-2 focus:ring-[#C9A962]/20 transition-all text-base"
                                        disabled={isSubmitting}
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !email}
                                        className="group relative px-8 py-4 bg-gradient-to-r from-[#C9A962] to-[#D4A84B] text-[#0D0906] rounded-xl font-bold text-base transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden shadow-[0_4px_20px_rgba(201,169,98,0.4)] hover:shadow-[0_6px_30px_rgba(201,169,98,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    >
                                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                                        {isSubmitting ? (
                                            <span className="relative">Joining...</span>
                                        ) : (
                                            <>
                                                <span className="relative">Join Waitlist</span>
                                                <ArrowRightIcon className="w-4 h-4 relative group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </div>
                                {submitStatus === 'error' && (
                                    <p className="text-red-400 text-sm mt-2 text-center">Something went wrong. Please try again.</p>
                                )}
                            </form>
                        )}
                    </div>

                    <p
                        className="mt-6 text-sm text-[#A89F91] font-medium flex items-center justify-center gap-3 opacity-0 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
                        style={{animation: 'fadeInUp 0.8s ease-out forwards', animationDelay: '1.2s'}}
                    >
                        <span className="flex items-center gap-1.5"><CheckCircleIcon className="w-4 h-4 text-[#8FAF7E]" />Free early access</span>
                        <span className="text-[#3D2E1F]">•</span>
                        <span className="flex items-center gap-1.5"><CheckCircleIcon className="w-4 h-4 text-[#8FAF7E]" />No credit card required</span>
                    </p>

                    {/* Already have access link */}
                    <p
                        className="mt-4 text-sm text-[#6B6358] opacity-0"
                        style={{animation: 'fadeInUp 0.8s ease-out forwards', animationDelay: '1.3s'}}
                    >
                        Already have access?{' '}
                        <button onClick={onLogin} className="text-[#C9A962] hover:text-[#E07B39] underline underline-offset-2 transition-colors">
                            Log in here
                        </button>
                    </p>
                </div>

                {/* Hero Image - with film/photo aesthetic */}
                <div
                    className="w-full max-w-5xl mx-auto mt-16 px-4 relative opacity-0"
                    style={{animation: 'fadeInUp 1s ease-out forwards', animationDelay: '1.4s'}}
                >
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/40 border border-[#3D2E1F]/60 group">
                        {/* Photo frame texture */}
                        <div className="absolute inset-0 z-10 pointer-events-none border-[8px] border-[#1a150f]/20 rounded-2xl"></div>

                        <img
                            src="/creative-image-2.jpg"
                            alt="Photon - The Artist's Conscious Archive"
                            className="w-full h-auto object-cover transition-transform duration-1000 group-hover:scale-[1.03]"
                        />

                        {/* Film grain overlay on image */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.12] pointer-events-none mix-blend-overlay"></div>

                        {/* Light leak on image */}
                        <div className="absolute top-0 right-0 w-[40%] h-[60%] bg-gradient-to-bl from-[#E8A855]/15 to-transparent pointer-events-none" style={{animation: 'breathe 15s ease-in-out infinite'}}></div>

                        {/* Bottom fade */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0906]/70 via-transparent to-[#0D0906]/20 pointer-events-none"></div>

                        {/* Corner dust spots */}
                        <div className="absolute top-[10%] left-[8%] w-1 h-1 rounded-full bg-white/20 blur-[0.5px]"></div>
                        <div className="absolute top-[15%] right-[12%] w-[2px] h-[2px] rounded-full bg-white/15"></div>
                        <div className="absolute bottom-[20%] left-[15%] w-1 h-1 rounded-full bg-white/10"></div>
                    </div>

                    {/* Soft glow behind image */}
                    <div className="absolute -inset-4 bg-gradient-to-r from-[#C9A962]/10 via-transparent to-[#8FAF7E]/10 blur-2xl -z-10 opacity-50"></div>
                </div>
            </div>

            {/* Organic transition: Hero to Ticker - soft gradient blend */}
            <div className="relative h-32 -mt-1">
                <div className="absolute inset-0 bg-gradient-to-b from-[#0D0906] via-[#0D0906]/80 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#F5F0E6]/30 to-[#F5F0E6]"></div>
                {/* Organic wave overlay */}
                <svg className="absolute bottom-0 w-full h-20 opacity-60" viewBox="0 0 1440 80" fill="none" preserveAspectRatio="none">
                    <path d="M0 80 C360 40, 540 60, 720 50 C900 40, 1080 70, 1440 30 L1440 80 Z" fill="#F5F0E6"/>
                </svg>
                <svg className="absolute bottom-0 w-full h-16 opacity-40" viewBox="0 0 1440 64" fill="none" preserveAspectRatio="none">
                    <path d="M0 64 C200 30, 400 50, 600 35 C800 20, 1000 45, 1440 25 L1440 64 Z" fill="#F5F0E6"/>
                </svg>
            </div>

            {/* ==================== LIGHT SECTION: Platform Ticker ==================== */}
            <div className="w-full bg-[#F5F0E6] py-12 overflow-hidden relative -mt-1">
                {/* LAYER 1: Base gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#F5F0E6] via-[#F8F4EB] to-[#F5F0E6]"></div>

                {/* LAYER 2: Real paper fiber texture */}
                <div className="absolute inset-0 bg-[url('/textures/paper-fibers-1.png')] bg-cover bg-center opacity-[0.7]" style={{mixBlendMode: 'multiply'}}></div>

                {/* LAYER 2b: Composite for warmth */}
                <div className="absolute inset-0 bg-[url('/textures/composite-tactile.png')] bg-cover bg-center opacity-[0.3]" style={{mixBlendMode: 'multiply'}}></div>

                {/* LAYER 3: Watercolor washes */}
                <div className="absolute top-[-20%] left-[15%] w-[35%] h-[140%] rounded-[50%] bg-gradient-to-b from-[#C9A962]/10 via-[#D4A84B]/5 to-transparent blur-[50px]" style={{animation: 'breathe 25s ease-in-out infinite'}}></div>
                <div className="absolute top-[-15%] right-[20%] w-[30%] h-[130%] rounded-[50%] bg-gradient-to-b from-[#8FAF7E]/8 via-[#9CAF88]/4 to-transparent blur-[45px]" style={{animation: 'breathe 28s ease-in-out infinite', animationDelay: '-10s'}}></div>
                <div className="absolute top-[0%] left-[50%] w-[20%] h-[100%] rounded-[50%] bg-gradient-to-b from-[#E07B39]/5 to-transparent blur-[40px]" style={{animation: 'breathe 22s ease-in-out infinite', animationDelay: '-15s'}}></div>

                {/* LAYER 4: Dust particles */}
                {[...Array(6)].map((_, i) => (
                  <div
                    key={`ticker-dust-${i}`}
                    className="absolute rounded-full bg-[#3D2E1F]"
                    style={{
                      width: '1.5px',
                      height: '1.5px',
                      left: `${15 + i * 14}%`,
                      top: `${30 + (i % 2) * 40}%`,
                      opacity: 0.06 + (i % 3) * 0.03,
                      animation: `dustFloat ${25 + i * 4}s ease-in-out infinite`,
                      animationDelay: `${-i * 3}s`
                    }}
                  ></div>
                ))}

                {/* LAYER 5: Edge shadows */}
                <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-[#E8E2D6]/60 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#E8E2D6]/50 to-transparent"></div>

                <p className="text-center text-xs font-bold text-[#8B7355] uppercase tracking-[0.25em] mb-8 relative z-10">Integrates directly with</p>

                <div className="relative w-full overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#F5F0E6] to-transparent z-10 pointer-events-none"></div>
                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#F5F0E6] to-transparent z-10 pointer-events-none"></div>

                    <div className="flex animate-scroll-x hover:[animation-play-state:paused]">
                        {[...tickerPlatforms, ...tickerPlatforms].map((p, index) => (
                            <div
                                key={`${p.name}-${index}`}
                                className="flex items-center gap-3 mx-10 md:mx-14 flex-shrink-0 opacity-70 hover:opacity-100 transition-all duration-300 cursor-default group"
                            >
                                <img src={p.logo} alt={p.name} className="h-5 md:h-6 w-auto object-contain invert opacity-60 group-hover:opacity-100 transition-all" />
                                <span className="font-semibold text-[#5C4A3A] group-hover:text-[#1A1410] transition-colors text-sm whitespace-nowrap">{p.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ==================== VIDEO SHOWCASE SECTION ==================== */}
            <div className="relative bg-[#F5F0E6] py-20 overflow-hidden">
                {/* Background textures */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#F5F0E6] via-[#EDE8DC] to-[#F5F0E6]"></div>
                <div className="absolute inset-0 bg-[url('/textures/paper-fibers-1.png')] bg-cover bg-center opacity-[0.5]" style={{mixBlendMode: 'multiply'}}></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15]" style={{mixBlendMode: 'overlay'}}></div>

                <div className="max-w-5xl mx-auto px-4 relative z-10">
                    <div className="text-center mb-10">
                        <p className="text-xs font-bold text-[#8B7355] uppercase tracking-[0.25em] mb-3">See it in action</p>
                        <h2 className="text-3xl md:text-4xl font-display font-bold text-[#1A1410] leading-tight">
                            Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C9A962] to-[#E07B39]">Photographers</span>
                        </h2>
                    </div>

                    {/* Video Container */}
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/20 border border-[#3D2E1F]/20 group">
                        {/* Film frame aesthetic border */}
                        <div className="absolute inset-0 z-10 pointer-events-none border-[6px] border-[#1a150f]/10 rounded-2xl"></div>

                        {/* Video element - Pexels free stock video */}
                        <video
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-auto aspect-video object-cover"
                            poster="/creative-image-2.jpg"
                        >
                            <source src="https://videos.pexels.com/video-files/1858314/1858314-hd_1920_1080_25fps.mp4" type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>

                        {/* Film grain overlay */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.1] pointer-events-none mix-blend-overlay"></div>

                        {/* Light leak effect */}
                        <div className="absolute top-0 right-0 w-[35%] h-[50%] bg-gradient-to-bl from-[#E8A855]/10 to-transparent pointer-events-none" style={{animation: 'breathe 12s ease-in-out infinite'}}></div>

                        {/* Bottom gradient for text */}
                        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>

                        {/* Video credit */}
                        <div className="absolute bottom-4 right-4 text-white/60 text-xs font-medium z-20">
                            Video by Griffin Wooldridge • Pexels
                        </div>
                    </div>

                    {/* Caption */}
                    <p className="text-center text-[#6B5344] text-sm mt-6 font-medium">
                        From capture to commercial-ready — all in one workflow
                    </p>
                </div>
            </div>

            {/* Organic transition: Video to Why Photon - soft blend */}
            <div className="relative h-32 -mt-1">
                <div className="absolute inset-0 bg-gradient-to-b from-[#F5F0E6] via-[#F5F0E6]/60 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0D0906]/40 to-[#0D0906]"></div>
                {/* Organic wave overlay */}
                <svg className="absolute top-0 w-full h-20 opacity-50" viewBox="0 0 1440 80" fill="none" preserveAspectRatio="none">
                    <path d="M0 0 C480 50, 720 20, 960 40 C1200 60, 1320 30, 1440 45 L1440 0 Z" fill="#F5F0E6"/>
                </svg>
                <svg className="absolute bottom-0 w-full h-24 opacity-70" viewBox="0 0 1440 96" fill="none" preserveAspectRatio="none">
                    <path d="M0 96 C240 50, 480 70, 720 45 C960 20, 1200 60, 1440 35 L1440 96 Z" fill="#0D0906"/>
                </svg>
            </div>

            {/* ==================== DARK SECTION: Why Photon ==================== */}
            <div className="relative bg-[#0D0906] py-28 overflow-hidden -mt-1">
                {/* Background textures */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0D0906] via-[#12100c] to-[#0a0805]"></div>
                <div className="absolute inset-0 bg-[url('/textures/glass-smudges.png')] bg-cover bg-center opacity-[0.45]" style={{mixBlendMode: 'overlay'}}></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.12]" style={{mixBlendMode: 'overlay'}}></div>

                {/* Watercolor washes */}
                <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[70%] rounded-[50%_50%_60%_40%/40%_60%_40%_60%] bg-gradient-to-br from-[#C9A962]/15 via-[#A08050]/8 to-transparent blur-[80px]" style={{animation: 'breathe 20s ease-in-out infinite'}}></div>
                <div className="absolute bottom-[-15%] right-[-8%] w-[45%] h-[65%] rounded-[60%_40%_50%_50%/50%_50%_50%_50%] bg-gradient-to-tl from-[#8FAF7E]/12 via-[#6B7355]/6 to-transparent blur-[70px]" style={{animation: 'breathe 25s ease-in-out infinite', animationDelay: '-10s'}}></div>

                {/* Light leak */}
                <div className="absolute top-[20%] right-[5%] w-[30%] h-[40%] bg-gradient-to-bl from-[#E8A855]/12 to-transparent blur-[50px] opacity-0" style={{animation: 'lightLeak 28s ease-in-out infinite'}}></div>

                {/* Vignette */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_50%,rgba(10,8,5,0.5)_100%)]"></div>

                <div className="max-w-6xl mx-auto px-4 relative z-10">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8FAF7E]/15 border border-[#8FAF7E]/30 text-[#8FAF7E] text-xs font-bold mb-6 uppercase tracking-widest">
                            <SparklesIcon className="w-3 h-3" />
                            Why Photon
                        </div>
                        <h2 className="text-4xl md:text-5xl font-display font-bold text-[#F5F0E6] mb-6 leading-tight">
                            Be Creative.<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C9A962] to-[#8FAF7E]">We Handle The Rest.</span>
                        </h2>
                        <p className="text-[#A89F91] text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
                            The first AI console built specifically for photographers. Combine professional editing tools with intelligent automation—all in one place.
                        </p>
                    </div>

                    {/* Three pillars */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                        {/* Pillar 1 */}
                        <div className="text-center group">
                            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#C9A962]/20 to-[#C9A962]/5 border border-[#C9A962]/30 flex items-center justify-center group-hover:border-[#C9A962]/60 transition-all duration-500">
                                <span className="text-3xl">📸</span>
                            </div>
                            <h3 className="text-xl font-display font-bold text-[#F5F0E6] mb-3">What We Do</h3>
                            <p className="text-[#A89F91] leading-relaxed text-sm">
                                Photon combines <span className="text-[#C9A962] font-medium">AI intelligence</span> with <span className="text-[#C9A962] font-medium">professional editing tools</span> in one unified console. Edit, enhance, and perfect your photos—then distribute them everywhere with a single click.
                            </p>
                        </div>

                        {/* Pillar 2 */}
                        <div className="text-center group">
                            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#8FAF7E]/20 to-[#8FAF7E]/5 border border-[#8FAF7E]/30 flex items-center justify-center group-hover:border-[#8FAF7E]/60 transition-all duration-500">
                                <span className="text-3xl">⚡</span>
                            </div>
                            <h3 className="text-xl font-display font-bold text-[#F5F0E6] mb-3">Why It Matters</h3>
                            <p className="text-[#A89F91] leading-relaxed text-sm">
                                Your time is creative time. Stop wasting hours on <span className="text-[#8FAF7E] font-medium">tedious uploads</span>, <span className="text-[#8FAF7E] font-medium">keyword tagging</span>, and <span className="text-[#8FAF7E] font-medium">format conversions</span>. Focus on what you do best—capturing moments.
                            </p>
                        </div>

                        {/* Pillar 3 */}
                        <div className="text-center group">
                            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#E07B39]/20 to-[#E07B39]/5 border border-[#E07B39]/30 flex items-center justify-center group-hover:border-[#E07B39]/60 transition-all duration-500">
                                <span className="text-3xl">✨</span>
                            </div>
                            <h3 className="text-xl font-display font-bold text-[#F5F0E6] mb-3">What Makes Us Different</h3>
                            <p className="text-[#A89F91] leading-relaxed text-sm">
                                No other tool goes from <span className="text-[#E07B39] font-medium">raw capture to commercial-ready</span> in one workflow. AI scores your images, suggests edits, generates metadata, and auto-publishes to every major platform.
                            </p>
                        </div>
                    </div>

                    {/* Bottom highlight */}
                    <div className="mt-16 pt-12 border-t border-[#3D2E1F]/50 text-center">
                        <p className="text-[#6B5344] text-sm font-medium uppercase tracking-widest mb-4">The Complete Workflow</p>
                        <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 text-[#A89F91]">
                            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#C9A962]"></span>Import</span>
                            <span className="text-[#3D2E1F]">→</span>
                            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#C9A962]"></span>AI Analysis</span>
                            <span className="text-[#3D2E1F]">→</span>
                            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#8FAF7E]"></span>Edit & Enhance</span>
                            <span className="text-[#3D2E1F]">→</span>
                            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#8FAF7E]"></span>Auto-Tag</span>
                            <span className="text-[#3D2E1F]">→</span>
                            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#E07B39]"></span>Distribute</span>
                            <span className="text-[#3D2E1F]">→</span>
                            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#E07B39]"></span>Earn</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Organic transition: Why Photon to Features - flowing blend */}
            <div className="relative h-40 -mt-1">
                <div className="absolute inset-0 bg-gradient-to-b from-[#0D0906] via-[#0D0906]/70 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#F5F0E6]/40 to-[#F5F0E6]"></div>
                {/* Layered organic waves */}
                <svg className="absolute bottom-0 w-full h-28 opacity-40" viewBox="0 0 1440 112" fill="none" preserveAspectRatio="none">
                    <path d="M0 112 C180 60, 360 90, 540 70 C720 50, 900 80, 1080 55 C1260 30, 1350 70, 1440 50 L1440 112 Z" fill="#F5F0E6"/>
                </svg>
                <svg className="absolute bottom-0 w-full h-24 opacity-60" viewBox="0 0 1440 96" fill="none" preserveAspectRatio="none">
                    <path d="M0 96 C300 45, 500 75, 720 55 C940 35, 1140 65, 1440 40 L1440 96 Z" fill="#F5F0E6"/>
                </svg>
                <svg className="absolute bottom-0 w-full h-16" viewBox="0 0 1440 64" fill="none" preserveAspectRatio="none">
                    <path d="M0 64 C200 35, 450 50, 720 30 C990 10, 1200 45, 1440 25 L1440 64 Z" fill="#F5F0E6"/>
                </svg>
            </div>

            {/* ==================== LIGHT SECTION: Features ==================== */}
            <div className="relative bg-[#F5F0E6] py-32 overflow-hidden -mt-1">
                {/* LAYER 1: Base texture gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#F5F0E6] via-[#EDE8DC] to-[#E8E2D6]"></div>

                {/* LAYER 2: Real paper fiber texture */}
                <div className="absolute inset-0 bg-[url('/textures/paper-fibers-2.png')] bg-cover bg-center opacity-[0.85]" style={{mixBlendMode: 'multiply'}}></div>

                {/* LAYER 2b: Composite tactile texture for warmth */}
                <div className="absolute inset-0 bg-[url('/textures/composite-tactile.png')] bg-cover bg-center opacity-[0.4]" style={{mixBlendMode: 'multiply'}}></div>

                {/* LAYER 2c: Fine grain overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.25]" style={{mixBlendMode: 'multiply'}}></div>

                {/* LAYER 3: Watercolor washes - organic shapes */}
                <div className="absolute top-[-5%] left-[-5%] w-[50%] h-[60%] rounded-[60%_40%_50%_50%/50%_50%_50%_50%] bg-gradient-to-br from-[#C9A962]/12 via-[#D4A84B]/6 to-transparent blur-[80px]" style={{animation: 'breathe 22s ease-in-out infinite'}}></div>
                <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[55%] rounded-[40%_60%_50%_50%/50%_40%_60%_50%] bg-gradient-to-tl from-[#8FAF7E]/12 via-[#9CAF88]/6 to-transparent blur-[70px]" style={{animation: 'breathe 28s ease-in-out infinite', animationDelay: '-12s'}}></div>
                <div className="absolute top-[35%] right-[10%] w-[35%] h-[40%] rounded-[50%_50%_40%_60%/60%_50%_50%_40%] bg-gradient-to-bl from-[#E07B39]/8 via-[#C9A962]/4 to-transparent blur-[60px]" style={{animation: 'breathe 20s ease-in-out infinite', animationDelay: '-6s'}}></div>
                <div className="absolute top-[60%] left-[15%] w-[25%] h-[30%] rounded-[45%_55%_50%_50%/55%_45%_55%_45%] bg-gradient-to-tr from-[#D4A84B]/6 to-transparent blur-[50px]" style={{animation: 'breathe 25s ease-in-out infinite', animationDelay: '-18s'}}></div>

                {/* LAYER 4: Coffee/tea stains */}
                <div className="absolute top-[25%] left-[5%] w-24 h-24 rounded-full border-[4px] border-[#5C4A3A]/8 opacity-50"></div>
                <div className="absolute bottom-[20%] right-[8%] w-20 h-20 rounded-full border-[3px] border-[#3D2E1F]/6 opacity-40"></div>
                <div className="absolute top-[70%] left-[40%] w-14 h-14 rounded-full border-[2px] border-[#5C4A3A]/5 opacity-30"></div>

                {/* LAYER 5: Fingerprint smudges */}
                <div className="absolute top-[15%] right-[6%] w-28 h-36 rounded-[50%] bg-gradient-radial from-[#5C4A3A]/[0.04] via-[#5C4A3A]/[0.02] to-transparent blur-[2px] rotate-[-25deg]" style={{animation: 'breathe 30s ease-in-out infinite'}}></div>
                <div className="absolute bottom-[25%] left-[8%] w-24 h-32 rounded-[50%] bg-gradient-radial from-[#3D2E1F]/[0.03] to-transparent blur-[2px] rotate-[35deg]" style={{animation: 'breathe 25s ease-in-out infinite', animationDelay: '-15s'}}></div>

                {/* LAYER 6: Dust particles on light */}
                {[...Array(15)].map((_, i) => (
                  <div
                    key={`feature-dust-${i}`}
                    className="absolute rounded-full bg-[#3D2E1F]"
                    style={{
                      width: `${1 + Math.random() * 2}px`,
                      height: `${1 + Math.random() * 2}px`,
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      opacity: 0.06 + Math.random() * 0.1,
                      animation: `dustFloat ${22 + Math.random() * 15}s ease-in-out infinite`,
                      animationDelay: `${-Math.random() * 20}s`
                    }}
                  ></div>
                ))}

                {/* LAYER 7: Edge shadows for depth */}
                <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#D4CFC5]/50 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#D4CFC5]/40 to-transparent"></div>
                <div className="absolute top-0 bottom-0 left-0 w-12 bg-gradient-to-r from-[#D4CFC5]/30 to-transparent"></div>
                <div className="absolute top-0 bottom-0 right-0 w-12 bg-gradient-to-l from-[#D4CFC5]/30 to-transparent"></div>

                <div className="max-w-7xl mx-auto px-4 relative">
                    <div className="text-center mb-20 animate-fade-in">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A962]/15 border border-[#C9A962]/30 text-[#A08338] text-xs font-bold mb-6 uppercase tracking-widest">
                            <SparklesIcon className="w-3 h-3" />
                            Core Features
                        </div>
                        <h2 className="text-4xl md:text-5xl font-display font-bold text-[#1A1410] mb-6">The Operating System for Creatives</h2>
                        <p className="text-[#5C4A3A] text-xl max-w-2xl mx-auto font-light">Manual uploading is dead. Let AI handle the boring stuff so you can focus on shooting.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Feature 1 - Gold/Amber */}
                        <div className="relative bg-[#FAF7F2]/80 p-10 rounded-2xl border border-[#D4CFC5] hover:border-[#C9A962]/60 transition-all duration-500 group hover:-translate-y-1 overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_4px_12px_rgba(61,46,31,0.08)]">
                            {/* Card texture */}
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.3]" style={{mixBlendMode: 'multiply'}}></div>
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#C9A962]/8 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                            <div className="relative">
                                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#C9A962] to-[#B8954A] flex items-center justify-center text-white mb-7 shadow-[0_4px_12px_rgba(201,169,98,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]">
                                    <SparklesIcon className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-display font-bold text-[#1A1410] mb-3">Market Intelligence</h3>
                                <p className="text-[#5C4A3A] leading-relaxed mb-5 text-sm">
                                    Don't guess what sells. Our AI scores your images on <span className="text-[#A08338] font-medium">Monetization, Social, and Portfolio</span> potential.
                                </p>
                                <ul className="space-y-2">
                                    <li className="flex items-center text-sm text-[#5C4A3A]"><CheckCircleIcon className="w-4 h-4 mr-2 text-[#C9A962]"/> Commercial Viability Score</li>
                                    <li className="flex items-center text-sm text-[#5C4A3A]"><CheckCircleIcon className="w-4 h-4 mr-2 text-[#C9A962]"/> SEO Keyword Generation</li>
                                </ul>
                            </div>
                        </div>

                        {/* Feature 2 - Sage Green */}
                        <div className="relative bg-[#FAF7F2]/80 p-10 rounded-2xl border border-[#D4CFC5] hover:border-[#8FAF7E]/60 transition-all duration-500 group hover:-translate-y-1 overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_4px_12px_rgba(61,46,31,0.08)]">
                            {/* Card texture */}
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.3]" style={{mixBlendMode: 'multiply'}}></div>
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#8FAF7E]/8 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                            <div className="relative">
                                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#8FAF7E] to-[#7A9A6B] flex items-center justify-center text-white mb-7 shadow-[0_4px_12px_rgba(143,175,126,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]">
                                    <EditIcon className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-display font-bold text-[#1A1410] mb-3">Hybrid Editing Suite</h3>
                                <p className="text-[#5C4A3A] leading-relaxed mb-5 text-sm">
                                    Professional manual controls meet Generative AI. Upscale to 4K, remove backgrounds, or apply presets.
                                </p>
                                <ul className="space-y-2">
                                    <li className="flex items-center text-sm text-[#5C4A3A]"><CheckCircleIcon className="w-4 h-4 mr-2 text-[#8FAF7E]"/> Generative Fill & Expand</li>
                                    <li className="flex items-center text-sm text-[#5C4A3A]"><CheckCircleIcon className="w-4 h-4 mr-2 text-[#8FAF7E]"/> Smart Upscaling (26MP)</li>
                                </ul>
                            </div>
                        </div>

                        {/* Feature 3 - Warm Orange */}
                        <div className="relative bg-[#FAF7F2]/80 p-10 rounded-2xl border border-[#D4CFC5] hover:border-[#E07B39]/60 transition-all duration-500 group hover:-translate-y-1 overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_4px_12px_rgba(61,46,31,0.08)]">
                            {/* Card texture */}
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.3]" style={{mixBlendMode: 'multiply'}}></div>
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#E07B39]/8 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                            <div className="relative">
                                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#E07B39] to-[#C9692E] flex items-center justify-center text-white mb-7 shadow-[0_4px_12px_rgba(224,123,57,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]">
                                    <DollarSignIcon className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-display font-bold text-[#1A1410] mb-3">Automated Distribution</h3>
                                <p className="text-[#5C4A3A] leading-relaxed mb-5 text-sm">
                                    One upload, everywhere. We format, tag, and submit your work to stock sites and social platforms.
                                </p>
                                <ul className="space-y-2">
                                    <li className="flex items-center text-sm text-[#5C4A3A]"><CheckCircleIcon className="w-4 h-4 mr-2 text-[#E07B39]"/> Multi-Platform Sync</li>
                                    <li className="flex items-center text-sm text-[#5C4A3A]"><CheckCircleIcon className="w-4 h-4 mr-2 text-[#E07B39]"/> Unified Earnings Dashboard</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Organic transition: Features to Showcase - flowing blend */}
            <div className="relative h-36 -mt-1">
                <div className="absolute inset-0 bg-gradient-to-b from-[#F5F0E6] via-[#F5F0E6]/50 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1A1410]/50 to-[#1A1410]"></div>
                {/* Layered organic waves */}
                <svg className="absolute top-0 w-full h-20 opacity-50" viewBox="0 0 1440 80" fill="none" preserveAspectRatio="none">
                    <path d="M0 0 C360 45, 600 15, 840 35 C1080 55, 1260 25, 1440 40 L1440 0 Z" fill="#F5F0E6"/>
                </svg>
                <svg className="absolute bottom-0 w-full h-24 opacity-70" viewBox="0 0 1440 96" fill="none" preserveAspectRatio="none">
                    <path d="M0 96 C180 50, 420 75, 660 45 C900 15, 1140 55, 1440 30 L1440 96 Z" fill="#1A1410"/>
                </svg>
            </div>

            {/* ==================== DARK SECTION: Showcase ==================== */}
            <div className="relative bg-[#1A1410] py-32 overflow-hidden -mt-1">
                {/* LAYER 1: Deep base gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1A1410] via-[#1E1815] to-[#15110e]"></div>

                {/* LAYER 2: Large watercolor washes - organic shapes */}
                <div className="absolute top-[-10%] right-[-5%] w-[55%] h-[65%] rounded-[40%_60%_50%_50%/50%_50%_60%_40%] bg-gradient-to-bl from-[#C9A962]/18 via-[#A08050]/10 to-transparent blur-[90px]" style={{animation: 'breathe 22s ease-in-out infinite'}}></div>
                <div className="absolute bottom-[-15%] left-[-8%] w-[50%] h-[60%] rounded-[60%_40%_50%_50%/40%_60%_50%_50%] bg-gradient-to-tr from-[#8FAF7E]/14 via-[#6B7355]/8 to-transparent blur-[80px]" style={{animation: 'breathe 28s ease-in-out infinite', animationDelay: '-12s'}}></div>
                <div className="absolute top-[30%] left-[25%] w-[35%] h-[40%] rounded-[50%_50%_60%_40%/40%_60%_40%_60%] bg-gradient-to-r from-[#E07B39]/10 via-[#D4A84B]/6 to-transparent blur-[70px]" style={{animation: 'breathe 25s ease-in-out infinite', animationDelay: '-8s'}}></div>

                {/* LAYER 3: Light leaks - warm color bleeds */}
                <div className="absolute top-[10%] left-[5%] w-[35%] h-[45%] bg-gradient-to-br from-[#E8A855]/15 via-[#E8A855]/5 to-transparent blur-[60px] rotate-[15deg] opacity-0" style={{animation: 'lightLeak 25s ease-in-out infinite'}}></div>
                <div className="absolute bottom-[15%] right-[0%] w-[30%] h-[40%] bg-gradient-to-l from-[#C9A962]/12 via-[#E07B39]/6 to-transparent blur-[50px] opacity-0" style={{animation: 'lightLeak 30s ease-in-out infinite', animationDelay: '-12s'}}></div>
                <div className="absolute top-[50%] right-[20%] w-[25%] h-[30%] bg-gradient-to-b from-[#D4A84B]/8 to-transparent blur-[40px] opacity-0" style={{animation: 'lightLeak 35s ease-in-out infinite', animationDelay: '-20s'}}></div>

                {/* LAYER 4: Fingerprint smudges on glass */}
                <div className="absolute top-[5%] left-[8%] w-32 h-44 rounded-[50%] bg-gradient-radial from-white/[0.035] via-white/[0.015] to-transparent blur-[3px] rotate-[25deg]" style={{animation: 'breathe 25s ease-in-out infinite'}}></div>
                <div className="absolute top-[55%] right-[5%] w-28 h-38 rounded-[50%] bg-gradient-radial from-white/[0.03] via-white/[0.01] to-transparent blur-[3px] rotate-[-20deg]" style={{animation: 'breathe 30s ease-in-out infinite', animationDelay: '-12s'}}></div>
                <div className="absolute bottom-[20%] left-[20%] w-24 h-32 rounded-[50%] bg-gradient-radial from-white/[0.025] to-transparent blur-[2px] rotate-[40deg]" style={{animation: 'breathe 22s ease-in-out infinite', animationDelay: '-8s'}}></div>

                {/* LAYER 5: Coffee ring stains */}
                <div className="absolute top-[70%] right-[12%] w-16 h-16 rounded-full border-[2px] border-[#5C4A3A]/10 opacity-40"></div>
                <div className="absolute top-[15%] left-[25%] w-12 h-12 rounded-full border-[2px] border-[#3D2E1F]/8 opacity-30"></div>
                <div className="absolute bottom-[30%] right-[35%] w-10 h-10 rounded-full border-[1.5px] border-[#5C4A3A]/6 opacity-25"></div>

                {/* LAYER 6: Heavy dust particles - camera sensor */}
                {[...Array(25)].map((_, i) => (
                  <div
                    key={`showcase-dust-${i}`}
                    className="absolute rounded-full bg-[#F5F0E6]"
                    style={{
                      width: `${1 + Math.random() * 2.5}px`,
                      height: `${1 + Math.random() * 2.5}px`,
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      opacity: 0.06 + Math.random() * 0.14,
                      animation: `dustFloat ${18 + Math.random() * 18}s ease-in-out infinite`,
                      animationDelay: `${-Math.random() * 20}s`
                    }}
                  ></div>
                ))}

                {/* LAYER 7: Glass smudges + light leaks texture */}
                <div className="absolute inset-0 bg-[url('/textures/glass-smudges.png')] bg-cover bg-center opacity-[0.5]" style={{mixBlendMode: 'overlay'}}></div>

                {/* LAYER 8: Film grain - double layer */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.14]" style={{mixBlendMode: 'overlay'}}></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05]" style={{mixBlendMode: 'soft-light', transform: 'scale(1.3)'}}></div>

                {/* LAYER 9: Film scratches */}
                <div className="absolute top-[20%] left-[30%] w-[1px] h-[15%] bg-gradient-to-b from-transparent via-white/[0.08] to-transparent rotate-[75deg]"></div>
                <div className="absolute top-[45%] right-[20%] w-[1px] h-[12%] bg-gradient-to-b from-transparent via-white/[0.06] to-transparent rotate-[-80deg]"></div>
                <div className="absolute top-[65%] left-[55%] w-[1px] h-[10%] bg-gradient-to-b from-transparent via-white/[0.05] to-transparent rotate-[82deg]"></div>

                {/* LAYER 10: Bokeh - soft depth */}
                <div className="absolute top-[20%] left-[15%] w-10 h-10 rounded-full bg-[#C9A962]/15 blur-[10px]" style={{animation: 'breathe 12s ease-in-out infinite'}}></div>
                <div className="absolute top-[70%] right-[15%] w-8 h-8 rounded-full bg-[#8FAF7E]/12 blur-[8px]" style={{animation: 'breathe 15s ease-in-out infinite', animationDelay: '-5s'}}></div>
                <div className="absolute top-[40%] right-[10%] w-6 h-6 rounded-full bg-[#E07B39]/10 blur-[6px]" style={{animation: 'breathe 13s ease-in-out infinite', animationDelay: '-8s'}}></div>
                <div className="absolute top-[80%] left-[40%] w-5 h-5 rounded-full bg-[#D4A84B]/12 blur-[5px]" style={{animation: 'breathe 11s ease-in-out infinite', animationDelay: '-3s'}}></div>

                {/* LAYER 11: Rising dust motes */}
                {[...Array(12)].map((_, i) => (
                  <div
                    key={`showcase-mote-${i}`}
                    className="absolute rounded-full bg-[#C9A962]"
                    style={{
                      width: `${1.5 + (i % 2)}px`,
                      height: `${1.5 + (i % 2)}px`,
                      left: `${8 + i * 7.5}%`,
                      bottom: '-2%',
                      opacity: 0.25 + (i % 3) * 0.08,
                      animation: `floatMote ${28 + i * 2.5}s linear infinite`,
                      animationDelay: `${i * -2.2}s`
                    }}
                  ></div>
                ))}

                {/* LAYER 12: Edge vignette */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_40%,rgba(21,17,14,0.35)_75%,rgba(21,17,14,0.6)_100%)]"></div>

                {/* LAYER 13: Top/bottom atmospheric */}
                <div className="absolute top-0 left-0 right-0 h-[30%] bg-gradient-to-b from-[#15110e]/40 via-[#15110e]/15 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 h-[25%] bg-gradient-to-t from-[#15110e]/50 to-transparent"></div>

                {/* LAYER 14: Corner shadows */}
                <div className="absolute top-0 left-0 w-[25%] h-[25%] bg-gradient-to-br from-[#0a0805]/35 to-transparent"></div>
                <div className="absolute bottom-0 right-0 w-[30%] h-[30%] bg-gradient-to-tl from-[#0a0805]/40 to-transparent"></div>

                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Image */}
                        <div className="relative group">
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/40 border border-[#3D2E1F]/80">
                                {/* Photo frame texture */}
                                <div className="absolute inset-0 z-10 pointer-events-none border-[6px] border-[#1a150f]/25 rounded-2xl"></div>

                                <img
                                    src="/creative-image-1.png"
                                    alt="Your art automated"
                                    className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                                />

                                {/* Film grain overlay */}
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] pointer-events-none mix-blend-overlay"></div>

                                {/* Light leak on image */}
                                <div className="absolute top-0 left-0 w-[35%] h-[50%] bg-gradient-to-br from-[#E8A855]/12 to-transparent pointer-events-none" style={{animation: 'breathe 18s ease-in-out infinite'}}></div>

                                {/* Bottom vignette */}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1410]/50 via-transparent to-[#1A1410]/15 pointer-events-none"></div>

                                {/* Dust spots */}
                                <div className="absolute top-[12%] right-[10%] w-1 h-1 rounded-full bg-white/15 blur-[0.5px]"></div>
                                <div className="absolute top-[25%] left-[8%] w-[2px] h-[2px] rounded-full bg-white/12"></div>
                                <div className="absolute bottom-[30%] right-[15%] w-1 h-1 rounded-full bg-white/10"></div>
                            </div>
                            <div className="absolute -bottom-4 -right-4 w-28 h-28 bg-gradient-to-br from-[#C9A962]/35 to-[#E07B39]/18 rounded-full blur-2xl"></div>
                            <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-[#8FAF7E]/30 to-[#9CAF88]/12 rounded-full blur-2xl"></div>
                        </div>

                        {/* Content */}
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E07B39]/15 border border-[#E07B39]/30 text-[#E07B39] text-xs font-bold uppercase tracking-widest">
                                <SparklesIcon className="w-3 h-3" />
                                For Creators
                            </div>
                            <h2 className="text-3xl md:text-4xl font-display font-bold text-[#F5F0E6] leading-tight">
                                Your art,<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C9A962] to-[#E07B39]">automated.</span>
                            </h2>
                            <p className="text-[#A89F91] text-lg leading-relaxed">
                                Focus on what you do best—creating. Let Photon handle the tedious work of organizing, optimizing, and distributing your creative archive to the platforms that matter.
                            </p>
                            <ul className="space-y-3 pt-2">
                                <li className="flex items-center gap-3 text-[#F5F0E6]/80">
                                    <CheckCircleIcon className="w-5 h-5 text-[#C9A962] flex-shrink-0" />
                                    <span>AI-powered image analysis & scoring</span>
                                </li>
                                <li className="flex items-center gap-3 text-[#F5F0E6]/80">
                                    <CheckCircleIcon className="w-5 h-5 text-[#C9A962] flex-shrink-0" />
                                    <span>One-click multi-platform distribution</span>
                                </li>
                                <li className="flex items-center gap-3 text-[#F5F0E6]/80">
                                    <CheckCircleIcon className="w-5 h-5 text-[#C9A962] flex-shrink-0" />
                                    <span>Unified earnings dashboard</span>
                                </li>
                            </ul>
                            <button
                                onClick={onSignup}
                                className="mt-4 px-6 py-3 bg-gradient-to-r from-[#C9A962] to-[#D4A84B] text-[#1A1410] rounded-xl font-bold hover:shadow-lg hover:shadow-[#C9A962]/30 transform hover:-translate-y-0.5 transition-all duration-300"
                            >
                                Start Creating Today
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Organic transition: Showcase to Final CTA - flowing blend */}
            <div className="relative h-36 -mt-1">
                <div className="absolute inset-0 bg-gradient-to-b from-[#1A1410] via-[#1A1410]/60 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#EDE8DC]/40 to-[#EDE8DC]"></div>
                {/* Layered organic waves */}
                <svg className="absolute bottom-0 w-full h-28 opacity-40" viewBox="0 0 1440 112" fill="none" preserveAspectRatio="none">
                    <path d="M0 112 C240 55, 480 85, 720 60 C960 35, 1200 70, 1440 45 L1440 112 Z" fill="#EDE8DC"/>
                </svg>
                <svg className="absolute bottom-0 w-full h-20 opacity-70" viewBox="0 0 1440 80" fill="none" preserveAspectRatio="none">
                    <path d="M0 80 C300 35, 540 55, 780 30 C1020 5, 1260 45, 1440 20 L1440 80 Z" fill="#EDE8DC"/>
                </svg>
            </div>

            {/* ==================== LIGHT SECTION: Final CTA ==================== */}
            <div className="relative bg-[#EDE8DC] py-32 overflow-hidden -mt-1">
                {/* LAYER 1: Base texture gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#EDE8DC] via-[#E8E2D6] to-[#E3DDD0]"></div>

                {/* LAYER 2: Real paper fiber texture */}
                <div className="absolute inset-0 bg-[url('/textures/paper-fibers-2.png')] bg-cover bg-center opacity-[0.75]" style={{mixBlendMode: 'multiply'}}></div>

                {/* LAYER 2b: Composite tactile texture for warmth */}
                <div className="absolute inset-0 bg-[url('/textures/composite-tactile.png')] bg-cover bg-center opacity-[0.35]" style={{mixBlendMode: 'multiply'}}></div>

                {/* LAYER 2c: Fine grain overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.2]" style={{mixBlendMode: 'multiply'}}></div>

                {/* LAYER 3: Watercolor washes - organic shapes */}
                <div className="absolute top-[-5%] left-[10%] w-[45%] h-[55%] rounded-[55%_45%_50%_50%/50%_55%_45%_50%] bg-gradient-to-br from-[#C9A962]/15 via-[#D4A84B]/8 to-transparent blur-[70px]" style={{animation: 'breathe 22s ease-in-out infinite'}}></div>
                <div className="absolute bottom-[-10%] right-[15%] w-[40%] h-[50%] rounded-[45%_55%_55%_45%/55%_45%_55%_45%] bg-gradient-to-tl from-[#8FAF7E]/12 via-[#9CAF88]/6 to-transparent blur-[60px]" style={{animation: 'breathe 28s ease-in-out infinite', animationDelay: '-12s'}}></div>
                <div className="absolute top-[25%] right-[5%] w-[30%] h-[40%] rounded-[50%_50%_45%_55%/55%_50%_50%_45%] bg-gradient-to-bl from-[#E07B39]/10 via-[#C9A962]/5 to-transparent blur-[55px]" style={{animation: 'breathe 25s ease-in-out infinite', animationDelay: '-8s'}}></div>
                <div className="absolute top-[55%] left-[5%] w-[25%] h-[35%] rounded-[50%] bg-gradient-to-r from-[#D4A84B]/8 to-transparent blur-[45px]" style={{animation: 'breathe 30s ease-in-out infinite', animationDelay: '-18s'}}></div>

                {/* LAYER 4: Coffee/tea stains */}
                <div className="absolute top-[20%] right-[10%] w-20 h-20 rounded-full border-[3px] border-[#5C4A3A]/8 opacity-45"></div>
                <div className="absolute bottom-[25%] left-[8%] w-16 h-16 rounded-full border-[2.5px] border-[#3D2E1F]/6 opacity-35"></div>
                <div className="absolute top-[65%] right-[35%] w-12 h-12 rounded-full border-[2px] border-[#5C4A3A]/5 opacity-28"></div>
                <div className="absolute top-[40%] left-[30%] w-10 h-10 rounded-full border-[1.5px] border-[#3D2E1F]/4 opacity-22"></div>

                {/* LAYER 5: Fingerprint smudges */}
                <div className="absolute top-[15%] left-[6%] w-24 h-32 rounded-[50%] bg-gradient-radial from-[#5C4A3A]/[0.035] via-[#5C4A3A]/[0.015] to-transparent blur-[2px] rotate-[20deg]" style={{animation: 'breathe 28s ease-in-out infinite'}}></div>
                <div className="absolute bottom-[20%] right-[8%] w-28 h-36 rounded-[50%] bg-gradient-radial from-[#3D2E1F]/[0.03] to-transparent blur-[2px] rotate-[-25deg]" style={{animation: 'breathe 25s ease-in-out infinite', animationDelay: '-10s'}}></div>
                <div className="absolute top-[50%] left-[20%] w-20 h-28 rounded-[50%] bg-gradient-radial from-[#5C4A3A]/[0.025] to-transparent blur-[2px] rotate-[35deg]" style={{animation: 'breathe 22s ease-in-out infinite', animationDelay: '-15s'}}></div>

                {/* LAYER 6: Dust particles on light */}
                {[...Array(18)].map((_, i) => (
                  <div
                    key={`cta-dust-${i}`}
                    className="absolute rounded-full bg-[#3D2E1F]"
                    style={{
                      width: `${1 + Math.random() * 2}px`,
                      height: `${1 + Math.random() * 2}px`,
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      opacity: 0.05 + Math.random() * 0.1,
                      animation: `dustFloat ${20 + Math.random() * 15}s ease-in-out infinite`,
                      animationDelay: `${-Math.random() * 18}s`
                    }}
                  ></div>
                ))}

                {/* LAYER 7: Light leak on light bg */}
                <div className="absolute top-[5%] right-[0%] w-[25%] h-[35%] bg-gradient-to-bl from-[#FFFDF8]/40 via-[#FFFDF8]/15 to-transparent blur-[30px] opacity-0" style={{animation: 'lightLeak 35s ease-in-out infinite'}}></div>
                <div className="absolute bottom-[10%] left-[5%] w-[20%] h-[30%] bg-gradient-to-tr from-[#FFF8E8]/35 to-transparent blur-[25px] opacity-0" style={{animation: 'lightLeak 40s ease-in-out infinite', animationDelay: '-18s'}}></div>

                {/* LAYER 8: Edge shadows for depth */}
                <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-[#D4CFC5]/45 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#D4CFC5]/40 to-transparent"></div>
                <div className="absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r from-[#D4CFC5]/30 to-transparent"></div>
                <div className="absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-[#D4CFC5]/30 to-transparent"></div>

                {/* LAYER 9: Corner shadows */}
                <div className="absolute top-0 left-0 w-[20%] h-[20%] bg-gradient-to-br from-[#C9C4B8]/25 to-transparent"></div>
                <div className="absolute top-0 right-0 w-[18%] h-[18%] bg-gradient-to-bl from-[#C9C4B8]/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 w-[22%] h-[22%] bg-gradient-to-tr from-[#C9C4B8]/30 to-transparent"></div>
                <div className="absolute bottom-0 right-0 w-[20%] h-[20%] bg-gradient-to-tl from-[#C9C4B8]/25 to-transparent"></div>

                {/* LAYER 10: Rising dust motes (subtle on light) */}
                {[...Array(8)].map((_, i) => (
                  <div
                    key={`cta-mote-${i}`}
                    className="absolute rounded-full bg-[#A89F91]"
                    style={{
                      width: `${1.5 + (i % 2) * 0.5}px`,
                      height: `${1.5 + (i % 2) * 0.5}px`,
                      left: `${12 + i * 10}%`,
                      bottom: '-2%',
                      opacity: 0.15 + (i % 3) * 0.05,
                      animation: `floatMote ${32 + i * 3}s linear infinite`,
                      animationDelay: `${i * -3}s`
                    }}
                  ></div>
                ))}

                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-[#1A1410] mb-4">Ready to professionalize your passion?</h2>
                    <p className="text-[#5C4A3A] text-lg mb-10 max-w-xl mx-auto">Stop leaving money on the table. Let AI unlock the full value of your creative archive.</p>
                    <div className="flex flex-col items-center gap-6">
                        <button
                            onClick={onSignup}
                            className="group relative w-full sm:w-auto px-12 py-5 bg-gradient-to-r from-[#C9A962] to-[#D4A84B] text-[#1A1410] rounded-xl font-bold text-lg hover:shadow-[0_0_40px_rgba(201,169,98,0.35)] transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                        >
                            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                            <span className="relative">Create Free Account</span>
                        </button>
                        <p className="text-[#8B7355] text-sm font-medium flex items-center gap-2">
                            <span className="flex -space-x-2">
                                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#C9A962] to-[#D4A84B] border-2 border-[#EDE8DC]"></span>
                                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#8FAF7E] to-[#9CAF88] border-2 border-[#EDE8DC]"></span>
                                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#E07B39] to-[#C9A962] border-2 border-[#EDE8DC]"></span>
                            </span>
                            Join 10,000+ creators earning with Photon
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer strip */}
            <div className="relative bg-[#1A1410] py-8 overflow-hidden">
                {/* Glass smudges texture */}
                <div className="absolute inset-0 bg-[url('/textures/glass-smudges.png')] bg-cover bg-center opacity-[0.3]" style={{mixBlendMode: 'overlay'}}></div>

                {/* Film grain */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.1]" style={{mixBlendMode: 'overlay'}}></div>

                {/* Subtle top shadow */}
                <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#0a0805]/40 to-transparent"></div>

                {/* Subtle color wash */}
                <div className="absolute bottom-0 left-[20%] w-[30%] h-full bg-gradient-to-t from-[#C9A962]/5 to-transparent blur-2xl"></div>
                <div className="absolute bottom-0 right-[25%] w-[25%] h-full bg-gradient-to-t from-[#8FAF7E]/4 to-transparent blur-2xl"></div>

                <div className="relative z-10 text-center">
                    <p className="text-[#5C4A3A] text-sm">&copy; 2025 PhotonAgent.ai. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};
