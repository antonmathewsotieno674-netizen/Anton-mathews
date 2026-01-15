
import React, { useRef, useEffect, useState } from 'react';
import { Message } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  onSpeak?: (text: string) => void;
  onOCR?: (data: string, type: string) => void;
}

const CopyButton: React.FC<{ text: string, className?: string }> = ({ text, className = '' }) => {
  const [isCopied, setIsCopied] = useState(false);
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) { console.error(err); }
  };
  return (
    <button onClick={handleCopy} className={`p-1.5 rounded-full transition-all duration-200 ${isCopied ? 'text-green-500' : 'text-slate-400 hover:text-brand-500'} ${className}`}>
      {isCopied ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
    </button>
  );
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, isLoading, onSpeak, onOCR }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 p-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-brand-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
           <svg className="w-12 h-12 text-brand-200 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        </div>
        <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-2">Start a Conversation</h3>
        <p className="text-sm max-w-xs mx-auto">Upload notes to analyze, generate images, or just ask a question to get started.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group relative animate-in slide-in-from-bottom-2 fade-in duration-300`}>
            <div className={`max-w-[85%] rounded-2xl px-5 py-4 text-sm shadow-sm relative ${msg.role === 'user' ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none'}`}>
              
              {/* Header Badge */}
              {msg.role === 'model' && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 bg-brand-100 dark:bg-brand-900/50 rounded-md flex items-center justify-center text-brand-600 dark:text-brand-400 text-[10px] font-bold">AI</div>
                  <span className="font-bold text-xs text-slate-400">MOA AI</span>
                  {msg.modelMode && <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-md uppercase border border-slate-200 dark:border-slate-600">{msg.modelMode}</span>}
                </div>
              )}

              {/* Attachments (User Uploads) */}
              {msg.attachment && (
                <div className="mb-3 rounded-lg overflow-hidden border border-white/20 shadow-sm max-w-full relative group/attach">
                  {msg.attachmentType === 'video' ? (
                    <video src={msg.attachment} controls className="w-full h-auto max-h-[300px]" />
                  ) : msg.attachmentType === 'audio' ? (
                    <audio src={msg.attachment} controls className="w-full" />
                  ) : (
                    <>
                      {onOCR && (
                        <button 
                          onClick={() => onOCR(msg.attachment!, 'image/png')}
                          className="absolute top-2 right-2 z-10 bg-black/60 hover:bg-black/80 text-white px-2 py-1 rounded-md text-[10px] font-bold opacity-0 group-hover/attach:opacity-100 transition-opacity flex items-center gap-1 shadow-lg"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                          SCAN TEXT
                        </button>
                      )}
                      <img src={msg.attachment} alt="Attachment" className="w-full h-auto max-h-[300px] object-cover" />
                    </>
                  )}
                </div>
              )}

              {/* Generated Media (Model Output) */}
              {msg.generatedMedia && (
                <div className="mb-3 rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700 bg-black/5 dark:bg-white/5">
                   {msg.generatedMedia.type === 'video' ? (
                     <video src={msg.generatedMedia.url} controls autoPlay muted loop className="w-full h-auto" />
                   ) : msg.generatedMedia.type === 'image' ? (
                     <img src={msg.generatedMedia.url} alt="Generated Art" className="w-full h-auto" />
                   ) : (
                     <div className="p-3">
                       <audio src={msg.generatedMedia.url} controls className="w-full mt-1" />
                     </div>
                   )}
                   <a href={msg.generatedMedia.url} download={`moa-generated.${msg.generatedMedia.type === 'video' ? 'mp4' : 'png'}`} className="block text-center py-2 bg-slate-50 dark:bg-slate-700 text-xs text-brand-600 dark:text-brand-400 hover:underline border-t border-slate-200 dark:border-slate-600">Download Generated Media</a>
                </div>
              )}

              <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>

              {/* Grounding Sources */}
              {msg.groundingLinks && msg.groundingLinks.length > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sources</p>
                   <ul className="space-y-1">
                     {msg.groundingLinks.map((link, idx) => (
                       <li key={idx}>
                         <a href={link.uri} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 hover:underline truncate bg-slate-50 dark:bg-slate-700/50 p-1.5 rounded-md">
                           {link.source === 'maps' ? '📍' : '🔗'} 
                           <span className="truncate">{link.title}</span>
                         </a>
                       </li>
                     ))}
                   </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 {msg.role === 'model' && onSpeak && (
                   <button onClick={() => onSpeak(msg.text)} className="p-1 text-slate-400 hover:text-brand-500 transition-colors" title="Read Aloud">
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                   </button>
                 )}
                 <CopyButton text={msg.text} />
              </div>
            </div>
          </div>
        ))}
        
        {/* Animated Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm relative overflow-hidden w-24 h-12 flex items-center justify-center">
               {/* Shimmer overlay */}
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-50 dark:via-slate-700/30 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
               
               {/* Pulsing Dots */}
               <div className="flex gap-1.5 items-center justify-center relative z-10">
                 <div className="w-2 h-2 bg-brand-400 rounded-full animate-[bounce_1s_infinite_-0.3s]"></div>
                 <div className="w-2 h-2 bg-brand-400 rounded-full animate-[bounce_1s_infinite_-0.15s]"></div>
                 <div className="w-2 h-2 bg-brand-400 rounded-full animate-[bounce_1s_infinite]"></div>
               </div>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>
    </div>
  );
};
