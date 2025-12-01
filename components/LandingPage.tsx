
import React from 'react';
import { Button } from './Button';
import { APP_NAME, APP_VERSION } from '../constants';
import { InteractiveBackground } from './InteractiveBackground';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, theme, toggleTheme }) => {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden text-slate-900 dark:text-white transition-colors duration-300">
      {/* Background */}
      <div className="fixed inset-0 z-0">
         <InteractiveBackground />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg">M</div>
            <span className="font-bold text-xl tracking-tight">{APP_NAME}</span>
         </div>
         
         <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>
            <button 
              onClick={onLogin} 
              className="text-sm font-medium hover:text-brand-600 dark:hover:text-brand-400 transition-colors hidden sm:block"
            >
              Log in
            </button>
            <Button onClick={onGetStarted} size="sm" className="shadow-lg shadow-brand-500/20">
              Get Started
            </Button>
         </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-6 flex flex-col justify-center items-center text-center pt-20 pb-32">
         <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-xs font-bold uppercase tracking-wider mb-8 border border-brand-100 dark:border-brand-800 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
            v{APP_VERSION} Now Live
         </div>
         
         <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-brand-700 to-slate-900 dark:from-white dark:via-brand-300 dark:to-white animate-fade-in-up" style={{animationDelay: '0.1s'}}>
            Your Intelligent <br className="hidden md:block" />
            <span className="text-brand-600 dark:text-brand-400">Study Companion</span>
         </h1>
         
         <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mb-10 leading-relaxed animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            Upload notes, ask questions, and unlock instant insights powered by Gemini AI. 
            Join the community of students studying smarter, not harder.
         </p>
         
         <div className="flex flex-col sm:flex-row gap-4 w-full justify-center animate-fade-in-up" style={{animationDelay: '0.3s'}}>
            <Button onClick={onGetStarted} size="lg" className="h-14 px-8 text-lg shadow-xl shadow-brand-500/30 hover:scale-105 transition-transform">
               Start Studying Free
            </Button>
            <Button onClick={onGetStarted} variant="outline" size="lg" className="h-14 px-8 text-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800">
               View Demo
            </Button>
         </div>

         {/* Feature Grid */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 w-full text-left">
            <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-700 transition-colors shadow-sm">
               <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
               </div>
               <h3 className="text-lg font-bold mb-2">Upload Any Format</h3>
               <p className="text-sm text-slate-600 dark:text-slate-400">PDFs, Word docs, Images, or handwritten notes. We handle it all with advanced OCR.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-700 transition-colors shadow-sm">
               <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
               </div>
               <h3 className="text-lg font-bold mb-2">Instant AI Answers</h3>
               <p className="text-sm text-slate-600 dark:text-slate-400">Powered by Gemini 2.5 & 3.0 Pro. Get summaries, task lists, and deep explanations instantly.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-700 transition-colors shadow-sm">
               <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
               </div>
               <h3 className="text-lg font-bold mb-2">Community Library</h3>
               <p className="text-sm text-slate-600 dark:text-slate-400">Share your notes and discover materials from students worldwide.</p>
            </div>
         </div>

         {/* CTA Strip */}
         <div className="mt-24 w-full p-8 md:p-12 bg-brand-600 rounded-3xl text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-black/10 rounded-full blur-3xl"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
               <div className="text-left">
                  <h2 className="text-3xl font-bold mb-2">Ready to excel?</h2>
                  <p className="text-brand-100">Join thousands of students using MOA AI today.</p>
               </div>
               <Button onClick={onGetStarted} className="bg-white text-brand-600 hover:bg-brand-50 shadow-lg border-0 px-8 py-4 h-auto text-lg">
                  Create Free Account
               </Button>
            </div>
         </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm py-12">
         <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
               <div className="w-6 h-6 bg-brand-600 rounded flex items-center justify-center text-white font-bold text-xs">M</div>
               <span className="font-bold text-slate-700 dark:text-slate-300">{APP_NAME}</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">© {new Date().getFullYear()} MOA AI. Built with MOA Company.</p>
         </div>
      </footer>
    </div>
  );
};
