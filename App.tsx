
import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const FileIcon = ({ type, className }: { type: string, className?: string }) => {
  if (type.includes('pdf')) return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9h1m0 4h3m-3 4h3" /></svg>;
  if (type.includes('image')) return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
  if (type.includes('video')) return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
};

const App = () => {
  const savedData = loadSavedState();
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('MOA_THEME') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('MOA_THEME', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const [file, setFile] = useState(savedData?.file || null);
  const [messages, setMessages] = useState(savedData?.messages || []);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showSharePrompt, setShowSharePrompt] = useState(false);
  
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [isGeneratingMedia, setIsGeneratingMedia] = useState(false);
  const [isOCRing, setIsOCRing] = useState(false);

  const [chatAttachment, setChatAttachment] = useState(undefined);
  const [chatAttachmentType, setChatAttachmentType] = useState('image');
  
  const [customBackground, setCustomBackground] = useState(savedData?.customBackground);
  const [isGeneratingBg, setIsGeneratingBg] = useState(false);

  const [modelMode, setModelMode] = useState('standard');
  const [userLocation, setUserLocation] = useState(undefined);

  const cameraInputRef = useRef(null); 
  const chatCameraInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState('profile');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [isExtractingTasks, setIsExtractingTasks] = useState(false);
  const [showTour, setShowTour] = useState(false);

  const [userState, setUserState] = useState(() => {
    const defaultState = { user: null, isPremium: false, hasPaid: false, paymentHistory: [], downloadHistory: [], uploadHistory: [], questionUsage: [], longTermMemory: '' };
    return savedData?.userState ? { ...defaultState, ...savedData.userState } : defaultState;
  });

  const [currentView, setCurrentView] = useState(userState.user ? 'app' : 'landing');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    if (messages.length > 0 && messages.length % 5 === 0 && userState.user) {
       consolidateMemory(messages, userState.longTermMemory).then(newMemory => {
          if (newMemory) setUserState(prev => ({ ...prev, longTermMemory: newMemory }));
       }).catch(console.error);
    }
  }, [messages.length, userState.user]); 

  const saveState = useCallback((state) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        console.warn("LocalStorage quota exceeded. Performing cleanup...");
        try {
          const optimizedState = {
             ...state,
             userState: {
               ...state.userState,
               uploadHistory: state.userState.uploadHistory.map((record) => ({
                 ...record,
                 content: undefined, 
                 originalImage: undefined
               }))
             }
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(optimizedState));
        } catch (retryError) {
          console.error("Critical error saving state", retryError);
        }
      }
    }
  }, []);

  useEffect(() => {
    saveState({ userState, file, messages, customBackground });
  }, [userState, file, messages, customBackground, saveState]);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
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

  const handleLogin = (user) => {
    setUserState(prev => ({ ...prev, user }));
    setCurrentView('app');
    if (!localStorage.getItem('HAS_SEEN_ONBOARDING')) {
        setTimeout(() => setShowTour(true), 1000);
    }
  };

  const handleLogout = () => {
    setUserState(prev => ({ ...prev, user: null }));
    setCurrentView('landing');
  };

  const handleGenerateMedia = async (config) => {
    setIsGeneratingMedia(true);
    try {
      let mediaUrl;
      if (config.type === 'image') {
        mediaUrl = await generateProImage(config);
      } else {
        mediaUrl = await generateVideo(config);
      }
      
      const mediaMsg = {
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

     const loadingMsg = { role: 'model', text: 'Generating project plan...' };
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
    
    if (!userState.isPremium && userState.questionUsage.length >= FREE_QUESTIONS_LIMIT) {
       setShowPaymentModal(true);
       return;
    }

    const newMessage = {
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
      
      const botMessage = {
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
      setMessages(prev => [...prev, { role: 'model', text: "An error occurred.", isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const uploadedFile = e.target.files[0];
      setIsProcessingFile(true);
      setProcessingStatus('Reading file...');
      try {
        const content = await parseFileContent(uploadedFile);
        const newFile = {
          name: uploadedFile.name,
          type: uploadedFile.type,
          content: content,
          category: uploadedFile.type.startsWith('image') ? 'image' : uploadedFile.type.startsWith('video') ? 'video' : 'text'
        };
        setFile(newFile);
        
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
        alert('Failed to process file');
      } finally {
        setIsProcessingFile(false);
        setProcessingStatus('');
      }
    }
  };

  const handleOCR = async () => {
    if (!file || file.category !== 'image') return;
    
    setIsOCRing(true);
    const loadingMsg = { role: 'model', text: `Extracting text from "${file.name}"...` };
    setMessages(prev => [...prev, loadingMsg]);

    try {
      const text = await performOCR(file.content, file.type);
      
      // Replace the loading message with the result
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'model', text: `**OCR Result for ${file.name}:**\n\n${text}` }
      ]);
      
      // Update file content with extracted text to make it searchable/context-aware
      setFile(prev => ({ ...prev, content: text, originalImage: prev.content, category: 'text' }));
      
    } catch (err) {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'model', text: "OCR failed. Please try again with a clearer image.", isError: true }
      ]);
    } finally {
      setIsOCRing(false);
    }
  };

  const handleMessageOCR = async (data: string, type: string) => {
    setIsLoading(true);
    const loadingMsg = { role: 'model', text: "Scanning attachment for text..." };
    setMessages(prev => [...prev, loadingMsg]);

    try {
      const text = await performOCR(data, type);
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'model', text: `**OCR Scan Result:**\n\n${text}` }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'model', text: "Failed to scan attachment text.", isError: true }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatAttachment = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
           setChatAttachment(e.target.result);
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

  const handleRestoreFile = (record) => {
      if (!record.content) {
          alert("Cannot restore this file: content is missing.");
          return;
      }
      
      let category = record.category || 'text';
      setFile({
          name: record.name,
          type: record.type,
          content: record.content,
          category: category,
          originalImage: record.originalImage
      });
      setShowSettingsModal(false);
      setMessages(prev => [...prev, { role: 'model', text: `Switched context to: "${record.name}".` }]);
  };

  const handleDeleteFile = (id) => {
      setUserState(prev => ({
          ...prev,
          uploadHistory: prev.uploadHistory.filter(h => h.id !== id)
      }));
  };

  const handleClearContext = () => {
    setFile(null);
    setMessages(prev => [...prev, { role: 'model', text: "Context cleared. I'm now answering without document background." }]);
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
          <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 p-4 flex justify-between items-center transition-colors">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md">M</div>
                <h1 className="font-bold text-slate-800 dark:text-white hidden sm:block tracking-tight">{APP_NAME}</h1>
             </div>
             <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCreatePlan} title="Create Project Plan" className="hidden sm:flex">
                   Plan
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowMediaModal(true)} className="hidden sm:flex">Create Media</Button>
                <Button id="tasks-button" variant="secondary" size="sm" onClick={handleTaskExtraction}>Tasks</Button>
                <button id="settings-button" onClick={() => setShowSettingsModal(true)} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                   <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-300 flex items-center justify-center font-bold">
                     {userState.user?.name?.[0]?.toUpperCase() || 'U'}
                   </div>
                </button>
             </div>
          </header>

          <main className="flex-1 flex overflow-hidden">
             <aside className="hidden md:flex flex-col w-64 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-r border-slate-200 dark:border-slate-700 p-4 gap-4 overflow-y-auto scrollbar-hide">
                <div id="upload-area" className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center hover:border-brand-500 cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                   <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.docx,.txt,.jpg,.png,.mp4" />
                   <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileUpload} className="hidden" />
                   <input type="file" accept="video/*" capture="environment" ref={videoInputRef} onChange={handleFileUpload} className="hidden" />
                   <div className="flex flex-col items-center">
                      <svg className="w-8 h-8 text-slate-400 group-hover:text-brand-500 mb-2 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                      <p className="text-sm font-medium truncate w-full px-2">{file ? file.name : "Upload File"}</p>
                   </div>
                   {isProcessingFile && <p className="text-[10px] animate-pulse mt-1 text-brand-600">{processingStatus}</p>}
                </div>
                
                {file && (
                  <div className="space-y-2">
                    {file.category === 'image' && (
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={handleOCR} 
                        isLoading={isOCRing}
                        className="w-full text-xs shadow-md"
                      >
                        Scan Text (OCR)
                      </Button>
                    )}
                    <button 
                      onClick={handleClearContext}
                      className="w-full py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] text-slate-500 hover:text-red-500 transition-colors"
                    >
                      Clear Current Context
                    </button>
                  </div>
                )}

                {/* Recent Files List */}
                {userState.uploadHistory.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Recent Contexts</label>
                    <div className="flex flex-col gap-1">
                      {userState.uploadHistory.slice(-4).reverse().map(hist => (
                        <button 
                          key={hist.id}
                          onClick={() => handleRestoreFile(hist)}
                          className={`w-full text-left p-2 rounded-lg text-xs flex items-center gap-2 transition-all ${file?.name === hist.name ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 shadow-sm' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                          title={hist.name}
                        >
                          <FileIcon type={hist.type} className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{hist.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={() => cameraInputRef.current?.click()} className="text-xs">Photo</Button>
                    <Button variant="outline" size="sm" onClick={() => videoInputRef.current?.click()} className="text-xs">Video</Button>
                </div>

                <div id="model-selector" className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Model Mode</label>
                   <select value={modelMode} onChange={(e) => setModelMode(e.target.value)} className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-800 border text-sm outline-none transition-colors">
                     <option value="standard">Standard</option>
                     <option value="fast">Fast (Turbo)</option>
                     <option value="thinking">Deep Think</option>
                     <option value="deep-research">Deep Research</option>
                     <option value="maps">Maps</option>
                     <option value="search">Web Search</option>
                   </select>
                </div>

                <div className="mt-auto pt-4 border-t dark:border-slate-700">
                    <div className="bg-slate-100 dark:bg-slate-800/80 rounded-lg p-3">
                        <p className="text-[10px] text-slate-500 mb-2 font-bold uppercase tracking-widest">Usage Limit</p>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full ${userState.isPremium ? 'bg-amber-500' : 'bg-brand-500'}`} style={{ width: userState.isPremium ? '100%' : `${Math.min(100, (userState.questionUsage.length / FREE_QUESTIONS_LIMIT) * 100)}%` }}></div>
                        </div>
                    </div>
                     <div className="mt-2 text-center">
                        <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-red-500">Sign Out</button>
                    </div>
                </div>
             </aside>

             <div className="flex-1 flex flex-col bg-white/30 dark:bg-slate-900/30">
                <ChatInterface 
                  messages={messages} 
                  isLoading={isLoading} 
                  onSpeak={(text) => {
                    const utterance = new SpeechSynthesisUtterance(text);
                    window.speechSynthesis.speak(utterance);
                  }}
                  onOCR={handleMessageOCR}
                />
                
                <div id="chat-input-area" className="p-4 bg-white/90 dark:bg-slate-900/90 border-t dark:border-slate-700 backdrop-blur-md">
                   <div className="flex gap-2 max-w-4xl mx-auto w-full">
                      <button onClick={toggleListening} className={`p-3 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                         🎤
                      </button>
                      <button onClick={() => chatCameraInputRef.current?.click()} className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700">
                         📷
                      </button>
                      <input type="file" accept="image/*" capture="environment" ref={chatCameraInputRef} onChange={handleChatAttachment} className="hidden" />

                      <div className="flex-1 relative">
                          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Ask MOA AI..." className="w-full h-full bg-slate-100 dark:bg-slate-800 border-0 rounded-xl px-4 focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 dark:text-white transition-all shadow-inner" />
                      </div>
                      <Button onClick={handleSendMessage} disabled={isLoading || (!input.trim() && !chatAttachment)}>Send</Button>
                   </div>
                </div>
             </div>
          </main>
          
          <PaymentModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} onSuccess={() => {
                setUserState(prev => ({ ...prev, isPremium: true, hasPaid: true, premiumExpiryDate: Date.now() + PREMIUM_VALIDITY_MS }));
                setShowPaymentModal(false);
          }} />
          
          <SettingsModal 
             isOpen={showSettingsModal}
             onClose={() => setShowSettingsModal(false)}
             userState={userState}
             onUpdateUser={(name) => setUserState(prev => prev.user ? ({ ...prev, user: { ...prev.user, name } }) : prev)}
             theme={theme}
             toggleTheme={toggleTheme}
             onUpgrade={() => setShowPaymentModal(true)}
             onHelp={() => {
                setShowSettingsModal(false);
                setMessages(prev => [...prev, { role: 'model', text: "How can I help you navigate the app?" }]);
             }}
             onGenerateBackground={handleGenerateBackground}
             isGeneratingBackground={isGeneratingBg}
             onImport={(item) => {
                setFile({ name: item.title, content: item.fileContent, type: item.fileType, category: 'text' });
                setShowSettingsModal(false);
             }}
             initialTab={settingsInitialTab}
             onRestoreFile={handleRestoreFile}
             onDeleteFile={handleDeleteFile}
          />

          <TaskManagerModal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} tasks={tasks} isLoading={isExtractingTasks} />
          <MediaCreationModal isOpen={showMediaModal} onClose={() => setShowMediaModal(false)} onGenerate={handleGenerateMedia} isLoading={isGeneratingMedia} />
          <OnboardingTour isOpen={showTour} onClose={() => { setShowTour(false); localStorage.setItem('HAS_SEEN_ONBOARDING', 'true'); }} />
        </div>
      )}
    </div>
  );
};

export default App;
