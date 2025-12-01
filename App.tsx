
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { UploadedFile, Message, UserState, User, LibraryItem, BeforeInstallPromptEvent, ActionItem, ModelMode } from './types';
import { APP_NAME, STORAGE_KEY, PREMIUM_VALIDITY_MS, LIBRARY_STORAGE_KEY, INITIAL_LIBRARY_DATA, PREMIUM_PRICE_KSH, FREE_QUESTIONS_LIMIT, USAGE_WINDOW_MS } from './constants';
import { generateResponse, performOCR, generateWallpaper, extractTasks } from './services/geminiService';
import { Button } from './components/Button';
import { PaymentModal } from './components/PaymentModal';
import { SettingsModal } from './components/SettingsModal';
import { ChatInterface } from './components/ChatInterface';
import { AuthScreen } from './components/AuthScreen';
import { InteractiveBackground } from './components/InteractiveBackground';
import { TaskManagerModal } from './components/TaskManagerModal';
import { LandingPage } from './components/LandingPage';
import { OnboardingTour } from './components/OnboardingTour';
import { parseFileContent } from './utils/fileParsing';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';

// Helper to load state from local storage safely
const loadSavedState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.warn("Failed to load saved state:", error);
  }
  return null;
};

const App: React.FC = () => {
  // Initialize state from local storage or defaults
  const savedData = loadSavedState();
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof localStorage !== 'undefined') {
      const savedTheme = localStorage.getItem('MOA_THEME');
      if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // Apply Theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('MOA_THEME', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const [file, setFile] = useState<UploadedFile | null>(savedData?.file || null);
  const [messages, setMessages] = useState<Message[]>(savedData?.messages || []);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showSharePrompt, setShowSharePrompt] = useState(false);
  
  // Custom Background State
  const [customBackground, setCustomBackground] = useState<string | undefined>(savedData?.customBackground);
  const [isGeneratingBg, setIsGeneratingBg] = useState(false);

  // Model Mode State
  const [modelMode, setModelMode] = useState<ModelMode>('standard');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | undefined>(undefined);

  // Camera Input Ref
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Settings Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'profile' | 'library' | 'community'>('profile');

  // Task Manager State
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [tasks, setTasks] = useState<ActionItem[]>([]);
  const [isExtractingTasks, setIsExtractingTasks] = useState(false);
  
  // Tour State
  const [showTour, setShowTour] = useState(false);

  // User State including Authentication
  const [userState, setUserState] = useState<UserState>(() => {
    const defaultState = { 
      user: null, 
      isPremium: false, 
      hasPaid: false,
      premiumExpiryDate: undefined,
      paymentHistory: [],
      downloadHistory: [],
      uploadHistory: [],
      questionUsage: []
    };
    
    if (savedData?.userState) {
      return {
        ...defaultState,
        ...savedData.userState,
        // Ensure arrays exist if loading from old state
        paymentHistory: savedData.userState.paymentHistory || [],
        downloadHistory: savedData.userState.downloadHistory || [],
        uploadHistory: savedData.userState.uploadHistory || [],
        questionUsage: savedData.userState.questionUsage || []
      };
    }
    
    return defaultState;
  });

  // Routing State
  const [currentView, setCurrentView] = useState<'landing' | 'auth' | 'app'>(() => {
    // If user is already logged in, skip to app
    return userState.user ? 'app' : 'landing';
  });
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Check for tour on app load
  useEffect(() => {
    if (currentView === 'app') {
      const hasSeenTour = localStorage.getItem('HAS_SEEN_ONBOARDING');
      if (!hasSeenTour) {
        // Small delay to ensure layout is ready
        setTimeout(() => setShowTour(true), 1000);
      }
    }
  }, [currentView]);

  const handleTourClose = () => {
    setShowTour(false);
    localStorage.setItem('HAS_SEEN_ONBOARDING', 'true');
  };

  // Check for premium expiry on mount and state changes
  useEffect(() => {
    if (userState.isPremium && userState.premiumExpiryDate) {
      const now = Date.now();
      if (now > userState.premiumExpiryDate) {
        // Subscription expired
        setUserState(prev => ({
          ...prev,
          isPremium: false,
          hasPaid: false,
          premiumExpiryDate: undefined
        }));
        console.log("Premium subscription has expired.");
      }
    }
  }, [userState.isPremium, userState.premiumExpiryDate]);

  // Persist state to local storage whenever critical data changes
  useEffect(() => {
    try {
      const stateToSave = {
        userState,
        file,
        messages,
        customBackground
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.warn("Failed to save state to local storage (likely quota exceeded):", error);
      if (file) {
        try {
          const stateWithoutFileContent = {
            userState,
            file: { ...file, content: '', originalImage: '' }, 
            messages,
            customBackground
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(stateWithoutFileContent));
        } catch (retryError) {
          console.error("Critical storage failure", retryError);
        }
      }
    }
  }, [userState, file, messages, customBackground]);

  // Handle PWA Install Prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Request Location when Maps mode is selected
  useEffect(() => {
    if (modelMode === 'maps' && !userLocation) {
       if (navigator.geolocation) {
         navigator.geolocation.getCurrentPosition(
           (position) => {
             setUserLocation({
               lat: position.coords.latitude,
               lng: position.coords.longitude
             });
           },
           (error) => {
             console.warn("Location access denied or failed", error);
           }
         );
       }
    }
  }, [modelMode, userLocation]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Speech Recognition Handler
  const handleSpeechResult = useCallback((text: string) => {
    setInput(prev => {
      const spacer = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
      return prev + spacer + text;
    });
  }, []);

  const { isListening, toggleListening, hasSupport } = useSpeechRecognition({ onResult: handleSpeechResult });

  const handleLogin = (user: User) => {
    setUserState(prev => ({ 
      ...prev, 
      user, 
      paymentHistory: prev.paymentHistory || [],
      downloadHistory: prev.downloadHistory || [],
      uploadHistory: prev.uploadHistory || [],
      questionUsage: prev.questionUsage || [] 
    }));
    setCurrentView('app');
  };

  const handleLogout = () => {
    setUserState({ 
      user: null, 
      isPremium: false, 
      hasPaid: false, 
      premiumExpiryDate: undefined, 
      paymentHistory: [],
      downloadHistory: [],
      uploadHistory: [],
      questionUsage: [] 
    });
    setMessages([]);
    setFile(null);
    setCustomBackground(undefined);
    setShowSharePrompt(false);
    localStorage.removeItem(STORAGE_KEY);
    setCurrentView('landing');
  };

  const handleUpdateUserName = (newName: string) => {
    if (userState.user) {
      setUserState(prev => ({
        ...prev,
        user: { ...prev.user!, name: newName }
      }));
    }
  };

  const handleUpdateProfilePicture = (base64Image?: string) => {
    if (userState.user) {
      setUserState(prev => ({
        ...prev,
        user: { ...prev.user!, profilePicture: base64Image }
      }));
    }
  };

  // Generate AI Background Handler
  const handleGenerateBackground = async () => {
    setIsGeneratingBg(true);
    try {
      const imageUrl = await generateWallpaper();
      setCustomBackground(imageUrl);
    } catch (error) {
      console.error("Background generation failed:", error);
      alert("Could not generate background at this time. Please try again.");
    } finally {
      setIsGeneratingBg(false);
    }
  };

  const handleExtractTasks = async () => {
    setShowTaskModal(true);
    setIsExtractingTasks(true);
    setTasks([]); // Clear previous
    try {
      const extractedTasks = await extractTasks(file, messages);
      setTasks(extractedTasks);
    } catch (error) {
      console.error("Task extraction failed", error);
    } finally {
      setIsExtractingTasks(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Visual feedback start
    setUploadSuccess(true);
    
    // Wait for animation to show feedback
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setUploadSuccess(false);
    setIsProcessingFile(true);
    setUploadProgress(0);
    setMessages([]); // Clear previous context on new upload
    setShowSharePrompt(false); // Reset prompt
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 300);

    try {
      // Robust check for images: rely on type or extension
      const isImage = selectedFile.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(selectedFile.name);

      if (isImage) {
        setProcessingStatus('Scanning image...');
        
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
          type: selectedFile.type || 'image/unknown',
          content: extractedText,
          category: 'text',
          originalImage: base64Image
        });
        
        setMessages(prev => [...prev, { role: 'model', text: `I've successfully extracted the text from "${selectedFile.name}". You can now ask questions about it.` }]);
        setShowSharePrompt(true); // Prompt to share after success
      } else {
        setProcessingStatus('Reading document...');
        const textContent = await parseFileContent(selectedFile);
        
        setFile({
          name: selectedFile.name,
          type: selectedFile.type || 'application/octet-stream',
          content: textContent,
          category: 'text'
        });
        
        setMessages(prev => [...prev, { role: 'model', text: `I've analyzed your document "${selectedFile.name}". Ask me anything about it!` }]);
        setShowSharePrompt(true); // Prompt to share after success
      }

      // Add to Upload History
      setUserState(prev => ({
        ...prev,
        uploadHistory: [
          {
            id: `up_${Date.now()}`,
            name: selectedFile.name,
            type: selectedFile.type || (isImage ? 'image/unknown' : 'application/octet-stream'),
            size: selectedFile.size,
            date: Date.now()
          },
          ...(prev.uploadHistory || [])
        ]
      }));

    } catch (error: any) {
      console.error("File upload error:", error);
      let errorText = `Sorry, I couldn't read the file "${selectedFile.name}". It might be corrupted or in an unsupported format.`;
      
      if (error.message && typeof error.message === 'string') {
        if (error.message.includes('too large')) {
          errorText = `The file "${selectedFile.name}" is too large (over 15MB). Please try a smaller file or split it into sections.`;
        } else if (error.message.includes('empty')) {
          errorText = `The file "${selectedFile.name}" seems to be empty. Please check the content.`;
        } else if (error.message.includes('OCR') || error.message.includes('extract text')) {
          errorText = `I couldn't read the text from the image "${selectedFile.name}". Ensure the image is clear, well-lit, and contains visible text.`;
        }
      }

      setMessages(prev => [...prev, { 
        role: 'model', 
        text: `${errorText}\n\nTry converting your file to PDF or Plain Text (.txt) if issues persist. If you continue to face problems, please contact support via the sidebar options.`, 
        isError: true 
      }]);
    } finally {
      clearInterval(progressInterval);
      setUploadProgress(100);
      setTimeout(() => {
        setIsProcessingFile(false);
        setProcessingStatus('');
        setUploadProgress(0);
      }, 500);
    }
  };

  const handlePublishToLibrary = () => {
    if (!file || !userState.user) return;
    setIsPublishing(true);

    const newItem: LibraryItem = {
      id: 'lib_' + Math.random().toString(36).substr(2, 9),
      title: file.name,
      author: userState.user.name,
      description: 'Shared by ' + userState.user.name,
      category: 'General',
      fileContent: file.content,
      fileType: file.type,
      originalImage: file.originalImage, 
      date: new Date().toISOString().split('T')[0],
      downloads: 0
    };

    setTimeout(() => {
      const savedLibrary = localStorage.getItem(LIBRARY_STORAGE_KEY);
      let libraryItems: LibraryItem[] = savedLibrary ? JSON.parse(savedLibrary) : [...INITIAL_LIBRARY_DATA];
      libraryItems.unshift(newItem); 
      localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(libraryItems));
      
      setIsPublishing(false);
      setShowSharePrompt(false); 
      alert('Successfully published to Community Library! Other users can now find your notes.');
    }, 1500);
  };

  const handleImportFromLibrary = (item: LibraryItem) => {
    setShowSettingsModal(false); 
    setIsProcessingFile(true);
    setUploadProgress(0);
    setProcessingStatus('Importing from library...');
    setShowSharePrompt(false); 

    // Add to download history
    setUserState(prev => ({
      ...prev,
      downloadHistory: [
        {
          id: `dl_${Date.now()}`,
          itemTitle: item.title,
          itemAuthor: item.author,
          date: Date.now()
        },
        ...(prev.downloadHistory || [])
      ]
    }));

    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        
        setFile({
          name: item.title,
          type: item.fileType,
          content: item.fileContent,
          category: 'text',
          originalImage: item.originalImage
        });
        
        setMessages([{ role: 'model', text: `I've loaded "${item.title}" from the Community Library. Ask me anything!` }]);
        
        setIsProcessingFile(false);
        setProcessingStatus('');
        setUploadProgress(0);
      }
    }, 150);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    if (!userState.isPremium) {
      const now = Date.now();
      const oneHourAgo = now - USAGE_WINDOW_MS;
      const recentUsage = (userState.questionUsage || []).filter(timestamp => timestamp > oneHourAgo);
      
      if (recentUsage.length >= FREE_QUESTIONS_LIMIT) {
        setShowPaymentModal(true);
        return;
      }

      setUserState(prev => ({
        ...prev,
        questionUsage: [...recentUsage, now]
      }));
    }

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const { text, groundingLinks } = await generateResponse(messages, userMessage, file, modelMode, userLocation);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: text,
        groundingLinks: groundingLinks,
        modelMode: modelMode
      }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: 'I apologize, but I encountered a temporary issue generating a response. Please check your internet connection and try asking a different question.', 
        isError: true 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    const expiryDate = Date.now() + PREMIUM_VALIDITY_MS;
    
    setUserState(prev => ({ 
      ...prev, 
      isPremium: true, 
      hasPaid: true,
      premiumExpiryDate: expiryDate,
      paymentHistory: [
        ...(prev.paymentHistory || []), 
        {
          id: `pay_${Date.now()}`,
          date: Date.now(),
          amount: PREMIUM_PRICE_KSH,
          method: 'M-PESA'
        }
      ]
    }));
    setShowPaymentModal(false);
  };

  const triggerUpgrade = () => {
    setShowSettingsModal(false);
    setShowPaymentModal(true);
  };

  const handleAskAIHelp = () => {
    setShowSettingsModal(false);
    setInput("How do I use MOA AI effectively?");
  };

  const openSettingsTo = (tab: 'profile' | 'library' | 'community') => {
    setSettingsInitialTab(tab);
    setShowSettingsModal(true);
  };

  const getDaysRemaining = () => {
    if (!userState.premiumExpiryDate) return 0;
    const diff = userState.premiumExpiryDate - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Calculate remaining free questions
  const remainingQuestions = !userState.isPremium ? (() => {
      const now = Date.now();
      const oneHourAgo = now - USAGE_WINDOW_MS;
      const recentUsage = (userState.questionUsage || []).filter(timestamp => timestamp > oneHourAgo);
      return Math.max(0, FREE_QUESTIONS_LIMIT - recentUsage.length);
  })() : null;

  const daysRemaining = getDaysRemaining();
  const showRenewalWarning = userState.isPremium && daysRemaining <= 7 && daysRemaining > 0;

  // View Routing Logic
  if (currentView === 'landing') {
    return (
      <LandingPage 
        onGetStarted={() => setCurrentView('auth')} 
        onLogin={() => setCurrentView('auth')}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  if (currentView === 'auth') {
    return <AuthScreen onLogin={handleLogin} />;
  }

  // Main App View
  return (
    <div className="flex flex-col h-screen relative bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <InteractiveBackground backgroundImage={customBackground} />
      
      <div className="relative z-10 flex flex-col h-screen bg-white/30 dark:bg-slate-900/40 backdrop-blur-sm">
        
        <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-white/50 dark:border-slate-700 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm transition-colors">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-brand-500/30 shadow-lg">M</div>
             <h1 className="font-bold text-xl text-slate-800 dark:text-white tracking-tight">{APP_NAME}</h1>
          </div>
          <div className="flex items-center gap-4">
            
            <button 
              id="tasks-button"
              onClick={handleExtractTasks}
              className="hidden sm:flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium text-sm transition-colors"
              title="Generate tasks and export to Todoist/Calendar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span>Tasks</span>
            </button>

            <button 
              id="settings-button"
              onClick={() => openSettingsTo('profile')}
              className="hidden md:flex items-center gap-2 mr-2 hover:bg-slate-100/50 dark:hover:bg-slate-700/50 p-1.5 rounded-lg transition-colors"
              title="View Profile and Settings"
            >
               <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-xs border border-brand-200 dark:border-brand-800 overflow-hidden relative">
                 {userState.user?.profilePicture ? (
                   <img src={userState.user.profilePicture} alt={userState.user.name} className="w-full h-full object-cover" />
                 ) : (
                   userState.user?.name.charAt(0).toUpperCase()
                 )}
               </div>
               <div className="flex flex-col items-start">
                 <span className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-tight">{userState.user?.name}</span>
                 <span className="text-[10px] text-slate-400 dark:text-slate-500">Settings</span>
               </div>
            </button>
            <button onClick={handleLogout} className="md:hidden text-xs text-slate-500 dark:text-slate-400 font-medium" title="Sign out of your account">Logout</button>

            {userState.isPremium && (
              <span className="hidden sm:flex px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-bold uppercase tracking-wider border border-amber-200 dark:border-amber-800 items-center gap-1 shadow-sm">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                Premium
              </span>
            )}
          </div>
        </header>

        {showRenewalWarning && (
          <div className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 px-6 py-2 text-sm font-medium flex justify-between items-center border-b border-amber-200 dark:border-amber-800 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Your Premium subscription expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}. Renew now to keep full access.</span>
            </div>
            <button 
              onClick={triggerUpgrade}
              className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-md text-xs font-bold transition-colors shadow-sm whitespace-nowrap ml-2"
            >
              Renew Now
            </button>
          </div>
        )}

        <main className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full overflow-hidden">
          
          <div className="w-full md:w-80 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border-r border-white/50 dark:border-slate-700 p-6 flex flex-col z-10 overflow-y-auto transition-colors">
            <div className="flex-1">
              
              {deferredPrompt && (
                <div className="mb-6 animate-fade-in-up">
                   <button 
                     onClick={handleInstallClick}
                     className="w-full flex items-center justify-center gap-2 p-3 bg-brand-600 text-white rounded-xl shadow-lg shadow-brand-500/30 hover:bg-brand-700 transition-all font-semibold text-sm"
                   >
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                     </svg>
                     Install App
                   </button>
                   <p className="text-[10px] text-center text-slate-500 dark:text-slate-400 mt-2">Add to Home Screen for easier access</p>
                </div>
              )}

              <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">My Documents</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Upload from your phone, cloud, or drive.</p>
              
              <label 
                id="upload-area"
                className={`flex flex-col items-center justify-center w-full min-h-[140px] border-2 border-dashed ${uploadSuccess ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg shadow-green-500/10' : isProcessingFile ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20' : 'border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:border-brand-300 dark:hover:border-brand-500'} ${!file && !isProcessingFile && !uploadSuccess ? 'animate-pulse shadow-[0_0_15px_rgba(14,165,233,0.15)] border-brand-300 dark:border-brand-700' : ''} rounded-xl cursor-pointer transition-all group mb-4 shadow-sm relative overflow-hidden`}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4 w-full">
                  {uploadSuccess ? (
                    <div className="animate-in zoom-in duration-300 flex flex-col items-center">
                       <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mb-2 shadow-sm">
                          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                       </div>
                       <p className="text-green-700 dark:text-green-300 font-bold text-lg">File Received!</p>
                       <p className="text-xs text-green-600 dark:text-green-400/80 mt-1">Starting analysis...</p>
                    </div>
                  ) : isProcessingFile ? (
                     <div className="flex flex-col items-center w-full px-4">
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-3 overflow-hidden">
                          <div 
                            className="bg-brand-500 h-2 rounded-full transition-all duration-300 ease-out bg-gradient-to-r from-brand-400 to-brand-600 animate-shimmer"
                            style={{ width: `${Math.max(5, uploadProgress)}%`, backgroundSize: '1000px 100%' }}
                          ></div>
                        </div>
                        <p className="text-xs text-brand-600 dark:text-brand-400 font-medium animate-pulse">{processingStatus || 'Processing...'}</p>
                     </div>
                  ) : (
                    <>
                      <div className="mb-3 p-3 bg-brand-50 dark:bg-slate-700 rounded-full group-hover:bg-brand-100 dark:group-hover:bg-slate-600 transition-colors text-brand-500 dark:text-brand-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                      </div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 group-hover:text-brand-700 dark:group-hover:text-brand-400">Browse Device & Cloud</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">Local Files, Google Drive, iCloud, etc.</p>
                    </>
                  )}
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={handleFileUpload} 
                  accept=".pdf,.doc,.docx,.txt,.rtf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/*,image/*,*/*" 
                  disabled={isProcessingFile}
                />
              </label>

              {/* Take Photo Button */}
              <button 
                onClick={() => cameraInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 mb-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm group"
                title="Take a picture of your notes"
                disabled={isProcessingFile}
              >
                 <div className="p-1.5 bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-lg group-hover:scale-110 transition-transform">
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                   </svg>
                 </div>
                 <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Take Photo</span>
              </button>
              
              {/* Hidden Camera Input */}
              <input 
                 ref={cameraInputRef}
                 type="file" 
                 accept="image/*" 
                 capture="environment"
                 className="hidden" 
                 onChange={handleFileUpload} 
                 disabled={isProcessingFile}
              />

              {showSharePrompt && file && (
                <div className="mb-4 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 animate-in slide-in-from-left-2">
                   <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-800 rounded-full text-indigo-600 dark:text-indigo-300 shrink-0">
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-indigo-900 dark:text-indigo-200 text-sm">Share Note?</h4>
                        <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-1 mb-2">Help others by adding "{file.name}" to the Community Library.</p>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            onClick={handlePublishToLibrary} 
                            disabled={isPublishing}
                            className="text-xs py-1.5 h-auto bg-indigo-600 hover:bg-indigo-700"
                          >
                             {isPublishing ? 'Sharing...' : 'Yes, Share'}
                          </Button>
                          <button 
                             onClick={() => setShowSharePrompt(false)}
                             className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 px-2"
                          >
                            No thanks
                          </button>
                        </div>
                      </div>
                   </div>
                </div>
              )}

              <button 
                onClick={() => openSettingsTo('library')}
                className="w-full flex items-center justify-center gap-2 mb-6 py-2 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-all font-medium text-sm"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Community Library
              </button>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
               <button onClick={() => openSettingsTo('profile')} className="flex items-center gap-2 w-full p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span className="text-sm font-medium">Settings & Account</span>
               </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col relative h-full overflow-hidden">
            <ChatInterface messages={messages} isLoading={isLoading} />

            <div id="chat-input-area" className="p-4 md:p-6 pb-6 border-t border-slate-100 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md relative z-10 transition-colors">
              
              {/* Model Mode Selector */}
              <div id="model-selector" className="max-w-4xl mx-auto mb-2 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                 <button 
                   onClick={() => setModelMode('standard')}
                   title="Best for general purpose queries and summaries"
                   className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${modelMode === 'standard' ? 'bg-brand-100 border-brand-300 text-brand-700 dark:bg-brand-900/40 dark:border-brand-700 dark:text-brand-300' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'}`}
                 >
                   ✨ Standard
                 </button>
                 <button 
                   onClick={() => setModelMode('fast')}
                   title="Fastest responses, good for simple questions"
                   className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${modelMode === 'fast' ? 'bg-yellow-100 border-yellow-300 text-yellow-700 dark:bg-yellow-900/40 dark:border-yellow-700 dark:text-yellow-300' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'}`}
                 >
                   ⚡ Fast (Lite)
                 </button>
                 <button 
                   onClick={() => setModelMode('thinking')}
                   title="Uses advanced reasoning for complex problems (slower)"
                   className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${modelMode === 'thinking' ? 'bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-900/40 dark:border-purple-700 dark:text-purple-300' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'}`}
                 >
                   🧠 Deep Think
                 </button>
                 <button 
                   onClick={() => setModelMode('maps')}
                   title="Get real-world location data and directions"
                   className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${modelMode === 'maps' ? 'bg-green-100 border-green-300 text-green-700 dark:bg-green-900/40 dark:border-green-700 dark:text-green-300' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'}`}
                 >
                   🗺️ Maps Grounding
                 </button>
              </div>

              <form onSubmit={handleSendMessage} className="relative max-w-4xl mx-auto flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={file ? `Ask a question about "${file.name}"...` : "Upload a note first, or ask a general question..."}
                    className="w-full pl-4 pr-12 py-3.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl shadow-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-700 dark:text-slate-100"
                  />
                  
                  {hasSupport && (
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all duration-200 ${
                        isListening 
                          ? 'bg-red-100 text-red-600 animate-pulse' 
                          : 'text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-600'
                      }`}
                      title="Speak"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </button>
                  )}
                </div>

                <Button 
                  type="submit" 
                  disabled={!input.trim() || isLoading}
                  className="rounded-2xl px-6 bg-brand-600 hover:bg-brand-700 shadow-brand-500/25 shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Button>
              </form>
              <div className="text-center mt-2">
                 <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
                    <span>MOA AI can make mistakes.</span>
                    <span className="hidden sm:inline">Verify important info.</span>
                    {userState.isPremium ? (
                      <span className="text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">Premium</span>
                    ) : (
                      <span className={`font-medium px-1.5 py-0.5 rounded transition-colors ${remainingQuestions === 0 ? 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400' : 'text-slate-600 bg-slate-100 dark:bg-slate-700 dark:text-slate-300'}`}>
                        {remainingQuestions}/{FREE_QUESTIONS_LIMIT} free questions left
                      </span>
                    )}
                 </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      <PaymentModal 
        isOpen={showPaymentModal} 
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
      />

      <SettingsModal 
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        userState={userState}
        onUpdateUser={handleUpdateUserName}
        onUpdateProfilePicture={handleUpdateProfilePicture}
        theme={theme}
        toggleTheme={toggleTheme}
        onUpgrade={triggerUpgrade}
        onHelp={handleAskAIHelp}
        onGenerateBackground={handleGenerateBackground}
        isGeneratingBackground={isGeneratingBg}
        onImport={handleImportFromLibrary}
        initialTab={settingsInitialTab}
      />

      <TaskManagerModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        tasks={tasks}
        isLoading={isExtractingTasks}
      />
      
      <OnboardingTour 
        isOpen={showTour} 
        onClose={handleTourClose} 
      />
    </div>
  );
};

export default App;
