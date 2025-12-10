
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
  try { 
    const item = localStorage.getItem(STORAGE_KEY);
    return item ? JSON.parse(item) : null; 
  } catch (e) { 
    console.error("Failed to load saved state", e);
    return null; 
  }
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
       }).catch(console.error);
    }
  }, [messages.length, userState.user]); 

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ userState, file, messages, customBackground }));
    } catch (e) { console.error("Save state failed", e); }
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
    // Check if seen onboarding
    if (!localStorage.getItem('HAS_SEEN_ONBOARDING')) {
        setTimeout(() => setShowTour(true), 1000);
    }
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
      
      // Robustly determine category if missing
      let category = record.category;
      if (!category) {
          if (record.type.startsWith('image/')) category = 'image';
          else if (record.type.startsWith('video/')) category = 'video';
          else if (record.type.startsWith('audio/')) category = 'audio';
          else category = 'text';
      }

      setFile({
          name: record.name,
          type: record.type,
          content: record.content,
          category: category,
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
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I couldn't process that request right now.", isError: true }]);
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

  const handleExtractTasks = async () => { 
      setShowTaskModal(true); 
      setIsExtractingTasks(true); 
      try { 
          const extracted = await extractTasks(file, messages); 
          setTasks(extracted); 
      } catch (e) {
          console.error("Task extraction failed", e);
      } finally { 
          setIsExtractingTasks(false); 
      }
  };
  
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
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand-500/30">M</div>
              <div>
                <h1 className="font-bold text-slate-800 dark:text-white leading-tight">{APP_NAME}</h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">STUDY ASSISTANT</p>
              </div>
           </div>

           <div id="model-selector" className="hidden md:flex bg-slate-100 dark:bg-slate-700/50 p-1 rounded-lg border border-slate-200 dark:border-slate-600/50">
             {(['standard', 'fast', 'thinking', 'maps', 'search'] as ModelMode[]).map(mode => (
               <button
                 key={mode}
                 onClick={() => setModelMode(mode)}
                 className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
                   modelMode === mode 
                     ? 'bg-white dark:bg-slate-600 text-brand-600 dark:text-brand-400 shadow-sm' 
                     : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                 }`}
               >
                 {mode}
               </button>
             ))}
           </div>

           <div className="flex items-center gap-3">
              <button 
                id="tasks-button"
                onClick={handleExtractTasks} 
                className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors relative"
                title="Generate Tasks"
              >
                {isExtractingTasks && <span className="absolute top-2 right-2 w-2 h-2 bg-brand-500 rounded-full animate-ping"></span>}
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              </button>
              
              <button 
                id="settings-button"
                onClick={() => { setSettingsInitialTab('profile'); setShowSettingsModal(true); }} 
                className="w-10 h-10 rounded-full bg-brand-100 dark:bg-slate-700 flex items-center justify-center border-2 border-white dark:border-slate-600 shadow-sm overflow-hidden"
              >
                 {userState.user?.profilePicture ? (
                   <img src={userState.user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                 ) : (
                   <span className="font-bold text-brand-600 dark:text-brand-400">{userState.user?.name.charAt(0)}</span>
                 )}
              </button>
           </div>
        </header>

        <main className="flex-1 overflow-hidden relative flex flex-col">
           {file && (
             <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 px-4 py-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <span className="font-medium truncate max-w-[200px]">{file.name}</span>
                </div>
                <button onClick={() => { setFile(null); setMessages([]); }} className="text-red-500 hover:text-red-600 font-medium">Clear Context</button>
             </div>
           )}
           
           <div className="flex-1 overflow-hidden relative">
             <ChatInterface messages={messages} isLoading={isLoading} onSpeak={handleTextToSpeech} />
             
             {isProcessingFile && (
                <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-20 animate-in fade-in duration-300">
                   <div className="w-64 space-y-4">
                      <div className="flex justify-between text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                         <span>{processingStatus}</span>
                         <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                         <div className="h-full bg-brand-500 transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                   </div>
                </div>
             )}
             
             {uploadSuccess && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium animate-in slide-in-from-top-4 fade-in duration-300 flex items-center gap-2">
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                   Upload Successful
                </div>
             )}
           </div>
        </main>

        <div className="p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-700 z-20">
           <div className="max-w-4xl mx-auto flex items-end gap-2 relative">
              {chatAttachment && (
                <div className="absolute bottom-full mb-2 left-0 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 flex items-center gap-2 animate-in slide-in-from-bottom-2">
                   {chatAttachmentType === 'image' ? (
                     <img src={chatAttachment} alt="Preview" className="w-12 h-12 object-cover rounded-md" />
                   ) : (
                     <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-md flex items-center justify-center">
                        <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     </div>
                   )}
                   <button onClick={() => setChatAttachment(undefined)} className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                </div>
              )}

              <div id="upload-area" className="flex gap-2">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  title="Upload File"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  onChange={handleFileUpload} 
                  accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg"
                />

                <button 
                  onClick={() => chatCameraInputRef.current?.click()}
                  className="p-3 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors hidden sm:block"
                  title="Take Photo"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
                <input 
                  type="file" 
                  ref={chatCameraInputRef}
                  className="hidden" 
                  onChange={handleChatAttachment} 
                  accept="image/*" 
                  capture="environment" 
                />
                
                <button 
                  onClick={() => setShowMediaModal(true)}
                  className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition-opacity"
                  title="Create Media"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </button>
              </div>

              <div id="chat-input-area" className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center px-4 py-2 border border-transparent focus-within:border-brand-500 transition-colors">
                 <textarea 
                   value={input}
                   onChange={(e) => setInput(e.target.value)}
                   onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
                   placeholder={file ? `Ask about ${file.name}...` : "Ask anything or create a plan..."}
                   className="flex-1 bg-transparent border-0 focus:ring-0 text-slate-800 dark:text-white placeholder-slate-400 text-sm max-h-24 py-2 resize-none outline-none scrollbar-hide"
                   rows={1}
                 />
                 <button 
                   onClick={toggleListening}
                   className={`p-2 rounded-full transition-colors ${isListening ? 'text-red-500 bg-red-100 dark:bg-red-900/20 animate-pulse' : 'text-slate-400 hover:text-brand-500'}`}
                 >
                   {isListening ? (
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                   ) : (
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                   )}
                 </button>
              </div>

              <button 
                onClick={() => handleSendMessage()}
                disabled={(!input.trim() && !chatAttachment) || isLoading}
                className="p-3 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl shadow-lg shadow-brand-500/30 transition-all active:scale-95 disabled:shadow-none"
              >
                {isLoading ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                )}
              </button>
           </div>
        </div>
      </div>

      <SettingsModal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)}
        userState={userState}
        onUpdateUser={(name) => setUserState(prev => ({...prev, user: { ...prev.user!, name }}))}
        onUpdateProfilePicture={(img) => setUserState(prev => ({...prev, user: { ...prev.user!, profilePicture: img }}))}
        theme={theme}
        toggleTheme={toggleTheme}
        onUpgrade={() => { setShowSettingsModal(false); setShowPaymentModal(true); }}
        onHelp={() => { 
            setShowSettingsModal(false); 
            setMessages(prev => [...prev, { role: 'model', text: 'How can I help you today? You can ask me about uploading files, premium features, or how to use the study tools.' }]);
        }}
        onGenerateBackground={handleGenerateBackground}
        isGeneratingBackground={isGeneratingBg}
        onImport={(item) => {
            setFile({ name: item.title, type: item.fileType, content: item.fileContent, category: item.category as any });
            setMessages([{ role: 'model', text: `Imported "${item.title}". What would you like to know?` }]);
            setShowSettingsModal(false);
        }}
        initialTab={settingsInitialTab}
        onRestoreFile={handleRestoreFile}
        onDeleteFile={handleDeleteFile}
      />

      <PaymentModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => {
            setUserState(prev => ({
                ...prev,
                isPremium: true,
                hasPaid: true,
                premiumExpiryDate: Date.now() + PREMIUM_VALIDITY_MS,
                paymentHistory: [...prev.paymentHistory, { id: `pay_${Date.now()}`, date: Date.now(), amount: PREMIUM_PRICE_KSH, method: 'M-PESA' }]
            }));
            setTimeout(() => setShowPaymentModal(false), 2000);
        }}
      />

      <TaskManagerModal 
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        tasks={tasks}
        isLoading={isExtractingTasks}
      />

      <MediaCreationModal 
        isOpen={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        onGenerate={handleGenerateMedia}
        isLoading={isGeneratingMedia}
      />

      {deferredPrompt && (
         <div className="fixed bottom-4 left-4 z-50 animate-in slide-in-from-bottom-4 duration-500">
           <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-4">
              <div>
                 <p className="font-bold text-sm">Install App</p>
                 <p className="text-xs opacity-80">Add to home screen</p>
              </div>
              <button onClick={handleInstallClick} className="bg-brand-500 hover:bg-brand-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">Install</button>
              <button onClick={() => setDeferredPrompt(null)} className="opacity-50 hover:opacity-100"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
           </div>
         </div>
      )}
    </div>
  );
};

export default App;
