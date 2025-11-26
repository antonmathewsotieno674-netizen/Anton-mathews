
import React, { useState, useCallback } from 'react';
import { UploadedFile, Message, UserState, User } from './types';
import { APP_NAME } from './constants';
import { generateResponse, performOCR } from './services/geminiService';
import { Button } from './components/Button';
import { PaymentModal } from './components/PaymentModal';
import { ChatInterface } from './components/ChatInterface';
import { AuthScreen } from './components/AuthScreen';
import { ContactSection } from './components/ContactSection';
import { InteractiveBackground } from './components/InteractiveBackground';
import { parseFileContent } from './utils/fileParsing';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';

const App: React.FC = () => {
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  
  // User State including Authentication
  const [userState, setUserState] = useState<UserState>({ 
    user: null, // Initially null (not logged in)
    isPremium: false, 
    hasPaid: false 
  });
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Speech Recognition Handler
  const handleSpeechResult = useCallback((text: string) => {
    setInput(prev => {
      const spacer = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
      return prev + spacer + text;
    });
  }, []);

  const { isListening, toggleListening, hasSupport } = useSpeechRecognition({ onResult: handleSpeechResult });

  const handleLogin = (user: User) => {
    setUserState(prev => ({ ...prev, user }));
  };

  const handleLogout = () => {
    setUserState({ user: null, isPremium: false, hasPaid: false });
    setMessages([]);
    setFile(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setIsProcessingFile(true);
    setMessages([]); // Clear previous context on new upload

    try {
      if (selectedFile.type.startsWith('image/')) {
        setProcessingStatus('Extracting text from image...');
        
        // get base64 for display
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
        });

        const [extractedText, base64Image] = await Promise.all([
          performOCR(selectedFile),
          base64Promise
        ]);

        setFile({
          name: selectedFile.name,
          type: selectedFile.type,
          content: extractedText,
          category: 'text', // We treat extracted text as text category
          originalImage: base64Image
        });
        
        setMessages(prev => [...prev, { role: 'model', text: `I've successfully extracted the text from "${selectedFile.name}". You can now ask questions about it.` }]);
      } else {
        // Handle PDF, Word, and Text
        setProcessingStatus('Reading document...');
        const textContent = await parseFileContent(selectedFile);
        
        setFile({
          name: selectedFile.name,
          type: selectedFile.type,
          content: textContent,
          category: 'text'
        });
        
        setMessages(prev => [...prev, { role: 'model', text: `I've analyzed your document "${selectedFile.name}". Ask me anything about it!` }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: `Sorry, I couldn't read the file "${selectedFile.name}". Please ensure it's a valid format.`, isError: true }]);
    } finally {
      setIsProcessingFile(false);
      setProcessingStatus('');
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    // MONETIZATION CHECK
    if (!userState.hasPaid && messages.length >= 1) {
      setShowPaymentModal(true);
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const aiResponse = await generateResponse(messages, userMessage, file);
      setMessages(prev => [...prev, { role: 'model', text: aiResponse }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: 'Something went wrong. Please try again.', isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setUserState(prev => ({ ...prev, isPremium: true, hasPaid: true }));
    setShowPaymentModal(false);
  };

  // If not logged in, show Auth Screen
  if (!userState.user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col h-screen relative">
      <InteractiveBackground />
      
      {/* Main Content Wrapper - Glass Effect */}
      <div className="relative z-10 flex flex-col h-screen bg-white/30 backdrop-blur-sm">
        
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-white/50 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-brand-500/30 shadow-lg">N</div>
             <h1 className="font-bold text-xl text-slate-800 tracking-tight">{APP_NAME}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 mr-2">
               <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs border border-brand-200">
                 {userState.user.name.charAt(0).toUpperCase()}
               </div>
               <div className="flex flex-col">
                 <span className="text-sm font-medium text-slate-700 leading-tight">{userState.user.name}</span>
                 <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-red-500 text-left">Sign out</button>
               </div>
            </div>

            {userState.isPremium ? (
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wider border border-amber-200 flex items-center gap-1 shadow-sm">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                Premium
              </span>
            ) : (
               <button onClick={() => setShowPaymentModal(true)} className="text-sm text-slate-600 hover:text-brand-600 font-medium transition-colors bg-white/50 px-3 py-1 rounded-full border border-slate-200">
                 Upgrade Plan
               </button>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full overflow-hidden">
          
          {/* Left Sidebar: File Upload & Contacts */}
          <div className="w-full md:w-80 bg-white/60 backdrop-blur-md border-r border-white/50 p-6 flex flex-col z-10 overflow-y-auto">
            <div className="flex-1">
              <h2 className="font-semibold text-slate-800 mb-2">Upload Notes</h2>
              <p className="text-sm text-slate-500 mb-4">Support for PDF, Word, Text, and Images (OCR).</p>
              
              <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed ${isProcessingFile ? 'border-brand-400 bg-brand-50' : 'border-slate-300 bg-white/50 hover:bg-white/80'} rounded-xl cursor-pointer transition-all group mb-4 shadow-sm`}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                  {isProcessingFile ? (
                     <div className="flex flex-col items-center">
                        <svg className="animate-spin h-6 w-6 text-brand-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-xs text-brand-600 font-medium">{processingStatus || 'Processing...'}</p>
                     </div>
                  ) : (
                    <>
                      <svg className="w-8 h-8 mb-3 text-slate-400 group-hover:text-brand-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                      <p className="text-xs text-slate-500 group-hover:text-slate-600">Click to upload documents or images</p>
                    </>
                  )}
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={handleFileUpload} 
                  accept=".txt,.md,.js,.json,.csv,.pdf,.doc,.docx,image/*" 
                  disabled={isProcessingFile}
                />
              </label>

              {file && (
                <div className="bg-white/80 rounded-lg p-4 border border-brand-100 shadow-sm animate-fade-in-up mb-6">
                  <div className="flex items-start gap-3">
                    {file.originalImage ? (
                      <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 border border-slate-200">
                        <img src={file.originalImage} alt="Thumbnail" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="p-2 bg-brand-50 rounded-md text-brand-500">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </div>
                    )}
                    <div className="overflow-hidden flex-1">
                        <p className="text-sm font-semibold text-brand-900 truncate">{file.name}</p>
                        <p className="text-xs text-brand-700 uppercase mt-0.5">{file.originalImage ? 'Image (OCR Extracted)' : file.category}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-6">
               {/* Premium Card */}
               {!userState.isPremium && (
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-5 text-white shadow-lg relative overflow-hidden flex-shrink-0">
                  <div className="relative z-10">
                    <h3 className="font-bold text-lg mb-1">Go Premium</h3>
                    <p className="text-indigo-100 text-xs mb-3">Unlimited questions & deep analysis.</p>
                    <Button variant="secondary" onClick={() => setShowPaymentModal(true)} className="w-full text-sm py-1.5 bg-white text-indigo-700 hover:bg-indigo-50 shadow-none border-0">
                      Unlock for KSH 20
                    </Button>
                  </div>
                  <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-white opacity-10 rounded-full blur-xl"></div>
                  <div className="absolute bottom-0 left-0 -mb-2 -ml-2 w-16 h-16 bg-purple-400 opacity-20 rounded-full blur-xl"></div>
                </div>
              )}
              
              {/* Contact Section */}
              <ContactSection />
            </div>
          </div>

          {/* Right Area: Chat */}
          <div className="flex-1 flex flex-col h-full relative bg-white/40">
             <ChatInterface messages={messages} isLoading={isLoading} />
             
             <div className="p-4 bg-white/80 backdrop-blur-md border-t border-white/50">
                <form onSubmit={handleSendMessage} className="flex gap-2 relative max-w-4xl mx-auto">
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={file ? (isListening ? "Listening..." : "Ask a question about your notes...") : "Upload a note first..."}
                    className={`flex-1 border border-slate-300 bg-white rounded-lg px-4 py-3 pr-20 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition disabled:bg-slate-50 disabled:text-slate-400 shadow-sm ${isListening ? 'ring-2 ring-red-400 border-red-400' : ''}`}
                    disabled={!file || isLoading}
                  />
                  
                  {/* Microphone Button */}
                  {hasSupport && (
                    <button
                      type="button"
                      onClick={toggleListening}
                      disabled={!file || isLoading}
                      className={`absolute right-12 top-1 bottom-1 px-3 rounded-md transition-all ${
                        isListening 
                          ? 'text-red-500 bg-red-50 animate-pulse' 
                          : 'text-slate-400 hover:text-brand-500 hover:bg-slate-50'
                      } ${(!file || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={isListening ? "Stop Listening" : "Start Voice Input"}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </button>
                  )}

                  <Button type="submit" disabled={!file || isLoading || !input.trim()} className="absolute right-1 top-1 bottom-1 px-3 rounded-md">
                     <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                  </Button>
                </form>
                <p className="text-center text-xs text-slate-500 mt-2 font-medium">
                  {isListening ? <span className="text-red-500 font-semibold animate-pulse">Recording... Click mic to stop.</span> : "NoteGenius AI"}
                </p>
             </div>
          </div>

        </main>

        <PaymentModal 
          isOpen={showPaymentModal} 
          onClose={() => setShowPaymentModal(false)} 
          onSuccess={handlePaymentSuccess} 
        />
      </div>
    </div>
  );
};

export default App;