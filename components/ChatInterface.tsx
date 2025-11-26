
import React, { useRef, useEffect } from 'react';
import { Message } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, isLoading }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <p className="text-lg font-medium text-slate-600">No messages yet</p>
        <p className="text-sm mt-1">Upload a note and ask a question to get started.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg, index) => (
        <div 
          key={index} 
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div 
            className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-brand-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
            } ${msg.isError ? 'bg-red-50 border-red-200 text-red-600' : ''}`}
          >
            {msg.role === 'model' && (
              <div className="font-semibold text-xs text-slate-400 mb-1 uppercase tracking-wider">MOA AI</div>
            )}
            <div className="whitespace-pre-wrap">{msg.text}</div>
          </div>
        </div>
      ))}
      
      {isLoading && (
        <div className="flex justify-start w-full">
          <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2">
             <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
             <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
             <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      )}
      <div ref={endOfMessagesRef} />
    </div>
  );
};