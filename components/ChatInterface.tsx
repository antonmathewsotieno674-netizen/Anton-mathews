import React, { useRef, useEffect, useState } from 'react';
import { Message } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
}

const CopyButton: React.FC<{ text: string, className?: string }> = ({ text, className = '' }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering other click events
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button 
      onClick={handleCopy}
      className={`p-1.5 rounded-full transition-all duration-200 ${
        isCopied 
          ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 opacity-100' 
          : 'bg-black/5 dark:bg-white/10 text-slate-400 hover:text-brand-600 dark:text-slate-500 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20'
      } ${className}`}
      title={isCopied ? "Copied!" : "Copy text"}
      aria-label="Copy text"
    >
      {isCopied ? (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, isLoading }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const [showCopyAllSuccess, setShowCopyAllSuccess] = useState(false);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleCopyAll = async () => {
    const allText = messages.map(m => `${m.role === 'user' ? 'You' : 'MOA AI'}:\n${m.text}`).join('\n\n');
    try {
      await navigator.clipboard.writeText(allText);
      setShowCopyAllSuccess(true);
      setTimeout(() => setShowCopyAllSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy conversation:', err);
    }
  };

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 p-8 text-center transition-colors">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 transition-colors">
          <svg className="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <p className="text-lg font-medium text-slate-600 dark:text-slate-400">No messages yet</p>
        <p className="text-sm mt-1">Upload a note and ask a question to get started.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative h-full">
      {/* Top Bar for Copy All */}
      {messages.length > 0 && (
        <div className="absolute top-2 right-4 z-10">
          <button
            onClick={handleCopyAll}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm border transition-all ${
              showCopyAllSuccess
                ? 'bg-green-100 border-green-200 text-green-700 dark:bg-green-900/40 dark:border-green-800 dark:text-green-300'
                : 'bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 backdrop-blur-sm'
            }`}
          >
            {showCopyAllSuccess ? (
              <>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span>Copied</span>
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                <span>Copy Chat</span>
              </>
            )}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group relative`}
          >
            <div 
              className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-4 text-sm leading-relaxed shadow-sm transition-colors relative ${
                msg.role === 'user' 
                  ? 'bg-brand-600 text-white rounded-tr-none' 
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none pr-10' // Added padding-right for AI messages to avoid overlap with copy button
              } ${msg.isError ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400' : ''}`}
            >
              {msg.role === 'model' && (
                <div className="font-semibold text-xs text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider select-none">MOA AI</div>
              )}
              
              <div className="whitespace-pre-wrap">
                {/* Visual Error Icon */}
                {msg.isError && (
                  <svg className="w-4 h-4 mr-2 inline-block -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {msg.text}
              </div>

              {/* Individual Copy Button */}
              {/* Positioned differently based on role to look good */}
              <div className={`absolute top-2 ${msg.role === 'user' ? '-left-8' : 'right-2'} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                <CopyButton 
                   text={msg.text} 
                   className={msg.role === 'user' ? 'bg-white/20 hover:bg-white/30 text-white' : ''} 
                />
              </div>
              
              {/* Mobile-friendly always-visible copy button for user messages (since hover doesn't work well on touch) */}
              {msg.role === 'user' && (
                 <div className="md:hidden absolute -left-8 top-2">
                    <CopyButton text={msg.text} className="bg-white/10 text-slate-500 dark:text-slate-400" />
                 </div>
              )}
               {/* Mobile-friendly always-visible copy button for AI messages */}
              {msg.role === 'model' && (
                 <div className="md:hidden absolute top-2 right-2">
                    <CopyButton text={msg.text} />
                 </div>
              )}

            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="relative bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-3 transition-colors overflow-hidden">
               {/* Shimmer overlay */}
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-100/50 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
               
               {/* Animated Dots */}
               <div className="flex gap-1">
                 <div className="w-2 h-2 bg-brand-400 rounded-full animate-[pulse_1s_ease-in-out_infinite]"></div>
                 <div className="w-2 h-2 bg-brand-500 rounded-full animate-[pulse_1s_ease-in-out_infinite_200ms]"></div>
                 <div className="w-2 h-2 bg-brand-600 rounded-full animate-[pulse_1s_ease-in-out_infinite_400ms]"></div>
               </div>
               
               <span className="text-xs font-medium text-slate-400 dark:text-slate-500 animate-pulse">
                 MOA AI is thinking...
               </span>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>
    </div>
  );
};