

import React, { useState, useEffect, useRef } from 'react';
import { UploadedFile, Message, UserState, User, LibraryItem, BeforeInstallPromptEvent, ActionItem, ModelMode, MediaGenerationConfig, ProjectPlan, UploadRecord } from './types';
import { APP_NAME, STORAGE_KEY, PREMIUM_VALIDITY_MS, LIBRARY_STORAGE_KEY, INITIAL_LIBRARY_DATA, PREMIUM_PRICE_KSH, FREE_QUESTIONS_LIMIT } from './constants';
import { generateResponse, performOCR, generateWallpaper, extractTasks, generateVideo, generateProImage, analyzeMedia, consolidateMemory, generateProjectPlan } from './services/moaApiService';
import { Button } from './components/Button';
import { PaymentModal } from './components/PaymentModal';
import { SettingsModal } from './components/SettingsModal';
import { ChatInterface } from './components/ChatInterface';
import { AuthScreen } from './components/AuthScreen';
import { InteractiveBackground } from './components/InteractiveBackground';
import { TaskManagerModal } from './components/TaskManagerModal';
import { LandingPage } from './components/LandingPage';
import { OnboardingTour } from './components/OnboardingTour';
import { MediaCreationModal } from './components/MediaCreationModal';
import { parseFileContent } from './utils/fileParsing';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';

const loadSavedState = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
};

const App: React.FC = () => {
  const savedData = loadSavedState();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return localStorage.getItem('MOA_THEME') as any || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('MOA_THEME', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const [file, setFile] = useState<UploadedFile | null>(savedData?.file || null);
  const [messages, setMessages] = useState<Message[]>(savedData?.messages || []);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showSharePrompt, setShowSharePrompt] = useState(false);
  
  // Media Gen State
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [isGeneratingMedia, setIsGeneratingMedia] = useState(false);

  const [chatAttachment, setChatAttachment] = useState<string | undefined>(undefined);
  const [chatAttachmentType, setChatAttachmentType] = useState<'image' | 'video' | 'audio'>('image');
  
  const [customBackground, setCustomBackground] = useState<string | undefined>(savedData?.customBackground);
  const [isGeneratingBg, setIsGeneratingBg] = useState(false);

  const [modelMode, setModelMode] = useState<ModelMode>('standard');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | undefined>(undefined);

  const cameraInputRef = useRef<HTMLInputElement>(null); 
  const chatCameraInputRef = useRef<HTMLInputElement>(null);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'profile' | 'library' | 'community' | 'files'>('profile');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [tasks, setTasks] = useState<ActionItem[]>([]);
  const [isExtractingTasks, setIsExtractingTasks] = useState(false);
  const [showTour, setShowTour] = useState(false);

  const [userState, setUserState] = useState<UserState>(() => {
    const defaultState = { user: null, isPremium: false, hasPaid: false, paymentHistory: [], downloadHistory: [], uploadHistory: [], questionUsage: [], longTermMemory: '' };
    return savedData?.userState ? { ...defaultState, ...savedData.userState } : defaultState;
  });

  const [currentView, setCurrentView] = useState<'landing' | 'auth' | 'app'>(userState.user ? 'app' : 'landing');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Background Memory Consolidation
  useEffect(() => {
    if (messages.length > 0 && messages.length % 5 === 0 && userState.user) {
       consolidateMemory(messages, userState.longTermMemory).then(newMemory => {
          if (newMemory) setUserState(prev => ({ ...prev, longTermMemory: newMemory }));
       });
    }
  }, [messages.length, userState.user]); 

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ userState, file, messages, customBackground }));
    } catch { }
  }, [userState, file, messages, customBackground]);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    });
  }, []);

  useEffect(() => {
    if (modelMode === 'maps' && !userLocation && navigator.geolocation) {
       navigator.geolocation.getCurrentPosition(
         (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
         (err) => console.warn("Location error", err)
       );
    }
  }, [modelMode, userLocation]);

  const handleInstallClick = async () => {
    deferredPrompt?.prompt();
    const res = await deferredPrompt?.userChoice;
    if (res?.outcome === 'accepted') setDeferredPrompt(null);
  };

  const { isListening, toggleListening, hasSupport } = useSpeechRecognition({ onResult: (text) => setInput(prev => prev + (prev ? ' ' : '') + text) });

  const handleLogin = (user: User) => {
    setUserState(prev => ({ ...prev, user }));
    setCurrentView('app');
  };

  const handleLogout = () => {
    setUserState(prev => ({ ...prev, user: null }));
    localStorage.removeItem(STORAGE_KEY);
    setCurrentView('landing');
  };

  const handleGenerateMedia = async (config: MediaGenerationConfig) => {
    setIsGeneratingMedia(true);
    try {
      let mediaUrl;
      if (config.type === 'image') {
        mediaUrl = await generateProImage(config);
      } else {
        mediaUrl = await generateVideo(config);
      }
      
      setMessages(prev => [...prev, {
        role: 'model',
        text: `Here is the generated ${config.type}:`,
        generatedMedia: {
          type: config.type,
          url: mediaUrl,
          mimeType: config.type === 'image' ? 'image/png' : 'video/mp4'
        }
      }]);
      setShowMediaModal(false);
    } catch (error) {
      alert("Media generation failed.");
    } finally {
      setIsGeneratingMedia(false);
    }
  };

  const handleTextToSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn("Text-to-speech is not supported in this browser.");
    }
  };

  const addToUploadHistory = (newFile: UploadedFile, size: number) => {
      const record: UploadRecord = {
          id: `up_${Date.now()}`,
          name: newFile.name,
          type: newFile.type || 'application/octet-stream',
          size: size,
          date: Date.now(),
          content: newFile.content,
          category: newFile.category,
          originalImage: newFile.originalImage 
      };

      setUserState(prev => ({
          ...prev,
          uploadHistory: [record, ...(prev.uploadHistory || [])].slice(0, 50) // Keep last 50
      }));
  };

  const handleRestoreFile = (record: UploadRecord) => {
      if (!record.content) {
          alert("Could not restore file: Content not found in history.");
          return;
      }
      
      setFile({
          name: record.name,
          type: record.type,
          content: record.content,
          category: record.category || 'text',
          originalImage: record.originalImage
      });

      setMessages(prev => [...prev, { 
          role: 'model', 
          text: `🔄 **Context Restored**: I've loaded "${record.name}" back into our session. What would you like to know about it?` 
      }]);

      setShowSettingsModal(false);
  };

  const handleDeleteFile = (id: string) => {
      setUserState(prev => ({
          ...prev,
          uploadHistory: prev.uploadHistory.filter(item => item.id !== id)
      }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setUploadSuccess(true);
    await new Promise(r => setTimeout(r, 800));
    setUploadSuccess(false);
    setIsProcessingFile(true);
    setUploadProgress(0);
    setMessages([]); 
    
    const progressInterval = setInterval(() => setUploadProgress(p => p >= 90 ? p : p + 10), 300);

    try {
      const isImage = selectedFile.type.startsWith('image/');
      const isVideo = selectedFile.type.startsWith('video/');
      const isAudio = selectedFile.type.startsWith('audio/');
      let processedFile: UploadedFile;

      if (isImage) {
        setProcessingStatus('Analyzing Image...');
        const text = await performOCR(selectedFile);
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        await new Promise(resolve => { reader.onload = resolve; });
        
        processedFile = { 
            name: selectedFile.name, 
            type: selectedFile.type, 
            content: text, 
            category: 'image', 
            originalImage: reader.result as string 
        };
        setFile(processedFile);
        setMessages([{ role: 'model', text: `Image analyzed. Content extracted: ${text.substring(0, 100)}...` }]);
        
      } else if (isVideo || isAudio) {
        setProcessingStatus(isVideo ? 'Analyzing Video...' : 'Transcribing Audio...');
        const text = await analyzeMedia(selectedFile);
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        await new Promise(resolve => { reader.onload = resolve; });

        processedFile = { 
            name: selectedFile.name, 
            type: selectedFile.type, 
            content: reader.result as string, 
            category: isVideo ? 'video' : 'audio' 
        };
        setFile(processedFile);
        setMessages([{ role: 'model', text: `Media Analysis Result:\n${text}` }]);
      } else {
        setProcessingStatus('Reading document...');
        const text = await parseFileContent(selectedFile);
        processedFile = { 
            name: selectedFile.name, 
            type: selectedFile.type, 
            content: text, 
            category: 'text' 
        };
        setFile(processedFile);
        setMessages([{ role: 'model', text: `Document loaded. Ask me anything about ${selectedFile.name}!` }]);
      }
      
      addToUploadHistory(processedFile, selectedFile.size);
      setShowSharePrompt(true);

    } catch (error: any) {
      setMessages([{ role: 'model', text: `Error: ${error.message}`, isError: true }]);
    } finally {
      clearInterval(progressInterval);
      setUploadProgress(100);
      setTimeout(() => { setIsProcessingFile(false); setUploadProgress(0); }, 500);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !chatAttachment) || isLoading) return;

    if (!userState.isPremium && userState.questionUsage.length >= FREE_QUESTIONS_LIMIT) {
       setShowPaymentModal(true); return;
    }

    const userMessage = input.trim();
    const currentAttachment = chatAttachment;
    const currentType = chatAttachmentType;
    
    setInput('');
    setChatAttachment(undefined);
    setMessages(prev => [...prev, { role: 'user', text: userMessage, attachment: currentAttachment, attachmentType: currentType }]);
    setIsLoading(true);

    try {
      const currentHistory = [...messages, { role: 'user', text: userMessage, attachment: currentAttachment, attachmentType: currentType } as Message];
      const { text, groundingLinks } = await generateResponse(currentHistory, userMessage, file, modelMode, userLocation, userState.longTermMemory);
      setMessages(prev => [...prev, { role: 'model', text, groundingLinks, modelMode }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I couldn't process that.", isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const type = file.type.startsWith('video') ? 'video' : file.type.startsWith('audio') ? 'audio' : 'image';
      setChatAttachmentType(type);
      const reader = new FileReader();
      reader.onload = (e) => setChatAttachment(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleExtractTasks = async () => { setShowTaskModal(true); setIsExtractingTasks(true); try { setTasks(await extractTasks(file, messages)); } finally { setIsExtractingTasks(false); }};
  
  const handleCreatePlan = async () => {
    if (!input.trim()) { alert("Please type a goal in the chat box first (e.g. 'Plan a startup')"); return; }
    setIsLoading(true);
    try {
       const plan = await generateProjectPlan(input, file?.content);
       setMessages(prev => [...prev, { role: 'model', text: `🏗️ **${plan.title}**\n\n${plan.steps.map(s => `- ${s.step}: ${s.details}`).join('\n')}` }]);
       setInput('');
    } catch(e) {
       console.error(e);
       alert("Failed to create plan.");
    } finally {
       setIsLoading(false);
    }
  };

  const handleGenerateBackground = async () => { setIsGeneratingBg(true); try { setCustomBackground(await generateWallpaper()); } catch(e){console.error(e)} finally { setIsGeneratingBg(false); }};

  if (currentView === 'landing') return <LandingPage onGetStarted={() => setCurrentView('auth')} onLogin={() => setCurrentView('auth')} theme={theme} toggleTheme={toggleTheme} />;
  if (currentView === 'auth') return <AuthScreen onLogin={handleLogin} />;

  return (
    <div className="flex flex-col h-screen relative bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <InteractiveBackground backgroundImage={customBackground} />
      <OnboardingTour isOpen={showTour} onClose={() => {setShowTour(false); localStorage.setItem('HAS_SEEN_ONBOARDING','true')}} />

      <div className="relative z-10 flex flex-col h-screen bg-white/30 dark:bg-slate-900/40 backdrop-blur-sm">
        <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-white/50 dark:border-slate-700 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">M</div>
             <h1 className="font-bold text-xl text-slate-800 dark:text-white">{APP_NAME}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowMediaModal(true)} className="hidden sm:flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-brand-600 font-medium text-sm bg-slate-100 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg transition-colors">
               <span>🎨 Create Media</span>
            </button>
            <button onClick={handleExtractTasks} className="hidden sm:flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-brand-600 font-medium text-sm transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              <span>Tasks</span>
            </button>
            <button onClick={() => { setSettingsInitialTab('profile'); setShowSettingsModal(true); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
               <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center font-bold text-xs border border-brand-200 dark:border-brand-800 overflow-hidden">
                 {userState.user?.profilePicture ? <img src={userState.user.profilePicture} className="w-full h-full object-cover" /> : userState.user?.name.charAt(0)}
               </div>
            </button>
          </div>
        </header>

        <main className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full overflow-hidden">
          {/* Sidebar */}
          <div className="w-full md:w-80 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border-r border-white/50 dark:border-slate-700 p-6 flex flex-col z-10 overflow-y-auto">
             <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">My Content</h2>
             <label id="upload-area" className={`flex flex-col items-center justify-center w-full min-h-[140px] border-2 border-dashed ${uploadSuccess ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-brand-400 bg-white/50 dark:bg-slate-800/50'} rounded-xl cursor-pointer mb-4 transition-all relative overflow-hidden`}>
                {uploadSuccess ? (
                    <div className="flex flex-col items-center animate-in zoom-in">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mb-2">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <p className="text-xs font-bold text-green-700 dark:text-green-400">Upload Complete</p>
                    </div>
                ) : isProcessingFile ? (
                    <div className="w-full px-6 flex flex-col items-center">
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                            <div className="h-full bg-brand-600 transition-all duration-300 ease-out" style={{width: `${uploadProgress}%`}}></div>
                        </div>
                        <div className="flex justify-between w-full text-[10px] font-medium text-slate-500 dark:text-slate-400">
                            <span>{processingStatus || 'Processing...'}</span>
                            <span>{Math.round(uploadProgress)}%</span>
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-4">
                       <div className="mb-2 text-slate-400 dark:text-slate-500">
                         <svg className="w-8 h-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                       </div>
                       <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Click to Upload</p>
                       <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">PDF, Word, Images, Video, Audio</p>
                    </div>
                )}
                <input type="file" className="hidden" onChange={handleFileUpload} accept="*/*" disabled={isProcessingFile} />
             </label>
             <button onClick={() => cameraInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 mb-2 py-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl text-sm font-medium">Take Photo</button>
             <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
             <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
                <button onClick={() => { setSettingsInitialTab('files'); setShowSettingsModal(true); }} className="w-full flex items-center justify-center gap-2 py-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700">
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                   Manage Files
                </button>
                <button onClick={() => { setSettingsInitialTab('library'); setShowSettingsModal(true); }} className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-xl text-sm font-medium">Community Library</button>
             </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col relative h-full overflow-hidden">
            <ChatInterface messages={messages} isLoading={isLoading} onSpeak={handleTextToSpeech} />
            
            <div id="chat-input-area" className="p-4 md:p-6 pb-6 border-t border-slate-100 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md relative z-10">
              <div id="model-selector" className="max-w-4xl mx-auto mb-2 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                 {['standard', 'fast', 'thinking', 'maps', 'search'].map(m => (
                   <button key={m} onClick={() => setModelMode(m as any)} className={`px-3 py-1 rounded-full text-xs font-medium border capitalize ${modelMode === m ? 'bg-brand-100 border-brand-300 text-brand-700 dark:bg-brand-900/40' : 'bg-white dark:bg-slate-700 border-slate-200'}`}>
                     {m === 'search' ? '🔍 Search' : m === 'maps' ? '🗺️ Maps' : m}
                   </button>
                 ))}
              </div>

              {chatAttachment && (
                <div className="max-w-4xl mx-auto mb-2 flex items-center gap-2">
                   <div className="relative group">
                      {chatAttachmentType === 'image' ? <img src={chatAttachment} className="h-12 w-12 object-cover rounded-lg" /> : <div className="h-12 w-12 bg-slate-200 flex items-center justify-center rounded-lg text-xs">{chatAttachmentType}</div>}
                      <button onClick={() => setChatAttachment(undefined)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                   </div>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="relative max-w-4xl mx-auto flex gap-2">
                <div className="relative flex-1">
                  <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question or type a goal..." className="w-full pl-10 pr-12 py-3.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl shadow-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all text-slate-700 dark:text-white" />
                  <button type="button" onClick={() => chatCameraInputRef.current?.click()} className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-brand-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
                  <input ref={chatCameraInputRef} type="file" accept="image/*,video/*,audio/*" capture="environment" className="hidden" onChange={handleChatAttachment} />
                  {hasSupport && <button type="button" onClick={toggleListening} className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-slate-400 hover:text-brand-600'}`}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg></button>}
                </div>
                {modelMode === 'thinking' ? (
                   <Button type="button" onClick={handleCreatePlan} title="Create Project Plan" className="rounded-2xl px-3 bg-purple-600 hover:bg-purple-700">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                   </Button>
                ) : (
                   <Button type="submit" disabled={isLoading} className="rounded-2xl px-6"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></Button>
                )}
              </form>
            </div>
          </div>
        </main>
      </div>

      <PaymentModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} onSuccess={() => { setUserState(p => ({...p, isPremium: true, premiumExpiryDate: Date.now() + PREMIUM_VALIDITY_MS})); setShowPaymentModal(false); }} />
      <SettingsModal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)} 
        userState={userState} 
        onUpdateUser={(n) => setUserState(p => ({...p, user: {...p.user!, name: n}}))} 
        theme={theme} 
        toggleTheme={toggleTheme} 
        onUpgrade={() => {setShowSettingsModal(false); setShowPaymentModal(true)}} 
        onHelp={() => setInput("How to use?")} 
        onGenerateBackground={handleGenerateBackground} 
        isGeneratingBackground={isGeneratingBg} 
        onImport={() => {}} 
        initialTab={settingsInitialTab} 
        onRestoreFile={handleRestoreFile}
        onDeleteFile={handleDeleteFile}
      />
      <TaskManagerModal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} tasks={tasks} isLoading={isExtractingTasks} />
      <MediaCreationModal isOpen={showMediaModal} onClose={() => setShowMediaModal(false)} onGenerate={handleGenerateMedia} isLoading={isGeneratingMedia} />
    </div>
  );
};

export default App;