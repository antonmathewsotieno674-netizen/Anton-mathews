

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const videoInputRef = useRef<HTMLInputElement>(null);

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

  // Robust State Saving with Quota Handling
  const saveState = useCallback((state: any) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        console.warn("LocalStorage quota exceeded. Performing cleanup...");
        try {
          // Optimization: Remove content from upload history, keep only metadata
          const optimizedState = {
             ...state,
             userState: {
               ...state.userState,
               uploadHistory: state.userState.uploadHistory.map((record: UploadRecord) => ({
                 ...record,
                 content: undefined, // Strip content to save space
                 originalImage: undefined
               }))
             }
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(optimizedState));
          console.log("State saved after optimization.");
        } catch (retryError) {
          console.error("Critical: Failed to save state even after cleanup.", retryError);
        }
      } else {
        console.error("Save state failed", e);
      }
    }
  }, []);

  useEffect(() => {
    saveState({ userState, file, messages, customBackground });
  }, [userState, file, messages, customBackground, saveState]);

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
    // Only clear the active user session, do not wipe data (notes/history)
    setUserState(prev => ({ ...prev, user: null }));
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
      
      const mediaMsg: Message = {
        role: 'model',
        text: `Here is your generated ${config.type} based on: "${config.prompt}"`,
        generatedMedia: {
          type: config.type,
          url: mediaUrl,
          mimeType: config.type === 'image' ? 'image/png' : 'video/mp4'
        }
      };
      setMessages(prev => [...prev, mediaMsg]);
      setShowMediaModal(false);
    } catch (e) {
      console.error(e);
      alert('Failed to generate media');
    } finally {
      setIsGeneratingMedia(false);
    }
  };

  const handleGenerateBackground = async () => {
    setIsGeneratingBg(true);
    try {
      const bgUrl = await generateWallpaper();
      setCustomBackground(bgUrl);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingBg(false);
    }
  };

  const handleCreatePlan = async () => {
     let goal = input.trim();
     if (!goal) {
       goal = window.prompt("What is the goal of your project?") || "";
     }
     if (!goal) return;

     const loadingMsg: Message = { role: 'model', text: 'Genering project plan...' };
     setMessages(prev => [...prev, loadingMsg]);
     
     try {
       const plan = await generateProjectPlan(goal);
       const planText = `**Project Plan: ${plan.title}**\n\n` + 
         plan.steps.map(s => `• **${s.step}**: ${s.details}`).join('\n');
         
       setMessages(prev => [
         ...prev.slice(0, -1), 
         { role: 'model', text: planText }
       ]);
     } catch (e) {
       setMessages(prev => prev.slice(0, -1));
       alert("Failed to generate plan");
     }
  };

  const handleSendMessage = async () => {
    if (!input.trim() && !chatAttachment) return;
    
    // Check limits
    if (!userState.isPremium && userState.questionUsage.length >= FREE_QUESTIONS_LIMIT) {
       setShowPaymentModal(true);
       return;
    }

    const newMessage: Message = {
      role: 'user',
      text: input,
      attachment: chatAttachment,
      attachmentType: chatAttachmentType,
      modelMode: modelMode
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setChatAttachment(undefined);
    setIsLoading(true);

    try {
      const response = await generateResponse(
        messages, 
        newMessage.text, 
        file, 
        modelMode, 
        userLocation, 
        userState.longTermMemory
      );
      
      const botMessage: Message = {
        role: 'model',
        text: response.text,
        groundingLinks: response.groundingLinks,
        modelMode: modelMode
      };
      setMessages(prev => [...prev, botMessage]);
      
      setUserState(prev => ({
        ...prev,
        questionUsage: [...prev.questionUsage, Date.now()]
      }));
    } catch (error) {
      const errorMsg: Message = {
        role: 'model',
        text: "I encountered an error processing your request. Please try again.",
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const uploadedFile = e.target.files[0];
      setIsProcessingFile(true);
      setProcessingStatus('Reading file...');
      try {
        const content = await parseFileContent(uploadedFile);
        const newFile: UploadedFile = {
          name: uploadedFile.name,
          type: uploadedFile.type,
          content: content,
          category: uploadedFile.type.startsWith('image') ? 'image' : uploadedFile.type.startsWith('video') ? 'video' : 'text'
        };
        setFile(newFile);
        
        // Add to history
        setUserState(prev => ({
          ...prev,
          uploadHistory: [...prev.uploadHistory, {
             id: Date.now().toString(),
             name: newFile.name,
             type: newFile.type,
             size: uploadedFile.size,
             date: Date.now(),
             content: content,
             category: newFile.category
          }]
        }));
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      } catch (err) {
        console.error(err);
        alert('Failed to process file');
      } finally {
        setIsProcessingFile(false);
        setProcessingStatus('');
      }
    }
  };

  const handleChatAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
           setChatAttachment(e.target.result as string);
           setChatAttachmentType(file.type.startsWith('video') ? 'video' : 'image');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTaskExtraction = async () => {
    setIsExtractingTasks(true);
    setShowTaskModal(true);
    try {
      const extracted = await extractTasks(file, messages);
      setTasks(extracted);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExtractingTasks(false);
    }
  };

  const handleRestoreFile = (record: UploadRecord) => {
      // Robustly handle missing content or category
      if (!record.content) {
          alert("Cannot restore this file: content is missing.");
          return;
      }
      
      // Infer category if missing (for older backups)
      let category: 'image' | 'text' | 'video' | 'audio' = record.category || 'text';
      if (!record.category && record.type) {
          if (record.type.startsWith('image')) category = 'image';
          else if (record.type.startsWith('video')) category = 'video';
          else if (record.type.startsWith('audio')) category = 'audio';
      }

      setFile({
          name: record.name,
          type: record.type,
          content: record.content,
          category: category,
          originalImage: record.originalImage
      });
      setShowSettingsModal(false);
      setMessages(prev => [...prev, { role: 'model', text: `Restored context from "${record.name}".` }]);
  };

  const handleDeleteFile = (id: string) => {
      setUserState(prev => ({
          ...prev,
          uploadHistory: prev.uploadHistory.filter(h => h.id !== id)
      }));
  };

  return (
    <div className={`h-screen flex flex-col ${theme} text-slate-900 dark:text-slate-100 font-sans`}>
      <InteractiveBackground backgroundImage={customBackground} />
      
      {currentView === 'landing' && (
        <LandingPage 
          onGetStarted={() => setCurrentView('auth')} 
          onLogin={() => setCurrentView('auth')}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}

      {currentView === 'auth' && (
        <AuthScreen onLogin={handleLogin} />
      )}

      {currentView === 'app' && (
        <div className="flex flex-col h-full relative z-10">
          {/* Header */}
          <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 p-4 flex justify-between items-center transition-colors">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md">M</div>
                <h1 className="font-bold text-slate-800 dark:text-white hidden sm:block tracking-tight">{APP_NAME}</h1>
             </div>
             <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCreatePlan} title="Create Project Plan" className="hidden sm:flex">
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowMediaModal(true)} className="hidden sm:flex">Create Media</Button>
                <Button 
                   id="tasks-button"
                   variant="secondary" 
                   size="sm" 
                   onClick={handleTaskExtraction}
                >
                  Tasks
                </Button>
                <button 
                  id="settings-button"
                  onClick={() => setShowSettingsModal(true)}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                   <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-300 flex items-center justify-center font-bold border border-brand-200 dark:border-brand-800">
                     {userState.user?.name?.[0]?.toUpperCase() || 'U'}
                   </div>
                </button>
             </div>
          </header>

          <main className="flex-1 flex overflow-hidden">
             {/* Sidebar */}
             <aside className="hidden md:flex flex-col w-64 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-r border-slate-200 dark:border-slate-700 p-4 gap-4 transition-colors">
                <div 
                  id="upload-area"
                  className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-900/20 transition-all cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                >
                   <input 
                     type="file" 
                     ref={fileInputRef} 
                     onChange={handleFileUpload} 
                     className="hidden" 
                     accept=".pdf,.docx,.txt,.jpg,.png,.mp4"
                   />
                   <input 
                     type="file" 
                     accept="image/*" 
                     capture="environment"
                     ref={cameraInputRef} 
                     onChange={handleFileUpload} 
                     className="hidden" 
                   />
                   <input 
                     type="file" 
                     accept="video/*" 
                     capture="environment"
                     ref={videoInputRef} 
                     onChange={handleFileUpload} 
                     className="hidden" 
                   />
                   <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                   </div>
                   <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate px-2">
                     {file ? file.name : "Upload File"}
                   </p>
                   <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">PDF, Word, Images</p>
                   {isProcessingFile && <p className="text-xs text-brand-500 mt-2 font-medium animate-pulse">{processingStatus}</p>}
                   {uploadSuccess && <p className="text-xs text-green-500 mt-2 font-medium">Uploaded!</p>}
                </div>
                
                {/* Camera Actions */}
                <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={() => cameraInputRef.current?.click()} className="text-xs flex items-center justify-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Photo
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => videoInputRef.current?.click()} className="text-xs flex items-center justify-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        Video
                    </Button>
                </div>

                <div id="model-selector" className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Model Mode</label>
                   <select 
                     value={modelMode} 
                     onChange={(e) => setModelMode(e.target.value as ModelMode)}
                     className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-colors"
                   >
                     <option value="standard">Standard</option>
                     <option value="fast">Fast (Turbo)</option>
                     <option value="thinking">Deep Think</option>
                     <option value="deep-research">Deep Research (Beta)</option>
                     <option value="maps">Maps</option>
                     <option value="search">Web Search</option>
                   </select>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">Monthly Usage</p>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full ${userState.isPremium ? 'bg-amber-500' : 'bg-brand-500'}`} 
                                style={{ width: userState.isPremium ? '100%' : `${Math.min(100, (userState.questionUsage.length / FREE_QUESTIONS_LIMIT) * 100)}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between mt-1">
                            <span className="text-[10px] text-slate-400">{userState.isPremium ? 'Unlimited' : `${userState.questionUsage.length}/${FREE_QUESTIONS_LIMIT}`}</span>
                            {!userState.isPremium && (
                                <button onClick={() => setShowPaymentModal(true)} className="text-[10px] text-brand-600 dark:text-brand-400 font-bold hover:underline">Upgrade</button>
                            )}
                        </div>
                    </div>
                     <div className="mt-2 text-center">
                        <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-red-500">Sign Out</button>
                    </div>
                </div>
             </aside>

             {/* Chat Area */}
             <div className="flex-1 flex flex-col min-w-0 bg-white/30 dark:bg-slate-900/30">
                <ChatInterface 
                    messages={messages} 
                    isLoading={isLoading} 
                    onSpeak={(text) => {
                        const utterance = new SpeechSynthesisUtterance(text);
                        window.speechSynthesis.speak(utterance);
                    }}
                />
                
                {/* Input Area */}
                <div id="chat-input-area" className="p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 transition-colors">
                   <div className="flex gap-2 max-w-4xl mx-auto w-full">
                      <button 
                         onClick={toggleListening}
                         className={`p-3 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                         title="Voice Input"
                      >
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                      </button>
                      <button 
                         onClick={() => chatCameraInputRef.current?.click()}
                         className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                         title="Take Photo"
                      >
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </button>
                      
                      {/* Hidden input for chat attachment */}
                      <input 
                         type="file" 
                         accept="image/*" 
                         capture="environment"
                         ref={chatCameraInputRef} 
                         onChange={handleChatAttachment} 
                         className="hidden" 
                       />

                      <div className="flex-1 relative">
                          {/* Preview of chat attachment */}
                          {chatAttachment && (
                              <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-slate-800 p-2 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded overflow-hidden">
                                      {chatAttachmentType === 'video' ? (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/></svg>
                                        </div>
                                      ) : (
                                        <img src={chatAttachment} alt="Preview" className="w-full h-full object-cover" />
                                      )}
                                  </div>
                                  <button onClick={() => setChatAttachment(undefined)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500">
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                              </div>
                          )}

                          <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder={chatAttachment ? "Add a caption..." : "Ask MOA AI..."}
                            className="w-full h-full bg-slate-100 dark:bg-slate-800 border-0 rounded-xl px-4 pl-4 pr-12 focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                          />
                          {/* Mobile Upload Trigger inside Input */}
                          <button 
                             className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-brand-500 md:hidden"
                             onClick={() => fileInputRef.current?.click()}
                          >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                          </button>
                      </div>
                      <Button 
                        onClick={handleSendMessage} 
                        disabled={isLoading || (!input.trim() && !chatAttachment)}
                        className="px-6"
                      >
                        Send
                      </Button>
                   </div>
                </div>
             </div>
          </main>
          
          {/* Modals */}
          <PaymentModal 
             isOpen={showPaymentModal} 
             onClose={() => setShowPaymentModal(false)}
             onSuccess={() => {
                setUserState(prev => ({ ...prev, isPremium: true, hasPaid: true, premiumExpiryDate: Date.now() + PREMIUM_VALIDITY_MS }));
                setShowPaymentModal(false);
             }}
          />
          
          <SettingsModal 
             isOpen={showSettingsModal}
             onClose={() => setShowSettingsModal(false)}
             userState={userState}
             onUpdateUser={(name) => setUserState(prev => prev.user ? ({ ...prev, user: { ...prev.user, name } }) : prev)}
             onUpdateProfilePicture={(pic) => setUserState(prev => prev.user ? ({ ...prev, user: { ...prev.user, profilePicture: pic } }) : prev)}
             theme={theme}
             toggleTheme={toggleTheme}
             onUpgrade={() => setShowPaymentModal(true)}
             onHelp={() => {
                setShowSettingsModal(false);
                setMessages(prev => [...prev, { role: 'model', text: "How can I help you navigate the app? You can ask about features, study tips, or how to upload files." }]);
             }}
             onGenerateBackground={handleGenerateBackground}
             isGeneratingBackground={isGeneratingBg}
             onImport={(item) => {
                setFile({ name: item.title, content: item.fileContent, type: item.fileType, category: 'text' });
                setShowSettingsModal(false);
                setMessages(prev => [...prev, { role: 'model', text: `I've loaded the note: "${item.title}" from the library. What would you like to know about it?` }]);
             }}
             initialTab={settingsInitialTab}
             onRestoreFile={handleRestoreFile}
             onDeleteFile={handleDeleteFile}
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

          <OnboardingTour 
             isOpen={showTour}
             onClose={() => {
                setShowTour(false);
                localStorage.setItem('HAS_SEEN_ONBOARDING', 'true');
             }}
          />
        </div>
      )}
    </div>
  );
};

export default App;