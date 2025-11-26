
import React, { useState, useCallback, useEffect } from 'react';
import { UploadedFile, Message, UserState, User, LibraryItem, BeforeInstallPromptEvent } from './types';
import { APP_NAME, STORAGE_KEY, PREMIUM_VALIDITY_MS, LIBRARY_STORAGE_KEY, INITIAL_LIBRARY_DATA, PREMIUM_PRICE_KSH, FREE_QUESTIONS_LIMIT, USAGE_WINDOW_MS } from './constants';
import { generateResponse, performOCR, generateWallpaper } from './services/geminiService';
import { Button } from './components/Button';
import { PaymentModal } from './components/PaymentModal';
import { SettingsModal } from './components/SettingsModal';
import { LibraryModal } from './components/LibraryModal';
import { ChatInterface } from './components/ChatInterface';
import { AuthScreen } from './components/AuthScreen';
import { ContactSection } from './components/ContactSection';
import { InteractiveBackground } from './components/InteractiveBackground';
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

  const [file, setFile] = useState<UploadedFile | null>(savedData?.file || null);
  const [messages, setMessages] = useState<Message[]>(savedData?.messages || []);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  // Custom Background State
  const [customBackground, setCustomBackground] = useState<string | undefined>(savedData?.customBackground);
  const [isGeneratingBg, setIsGeneratingBg] = useState(false);

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
  
  // User State including Authentication
  const [userState, setUserState] = useState<UserState>(savedData?.userState || { 
    user: null, // Initially null (not logged in)
    isPremium: false, 
    hasPaid: false,
    premiumExpiryDate: undefined,
    paymentHistory: [],
    questionUsage: []
  });
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

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
      questionUsage: prev.questionUsage || [] 
    }));
  };

  const handleLogout = () => {
    setUserState({ 
      user: null, 
      isPremium: false, 
      hasPaid: false, 
      premiumExpiryDate: undefined, 
      paymentHistory: [], 
      questionUsage: [] 
    });
    setMessages([]);
    setFile(null);
    setCustomBackground(undefined);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleUpdateUserName = (newName: string) => {
    if (userState.user) {
      setUserState(prev => ({
        ...prev,
        user: { ...prev.user!, name: newName }
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
      }
    } catch (error: any) {
      console.error("File upload error:", error);
      
      let errorText = `Sorry, I couldn't read the file "${selectedFile.name}". It might be corrupted or in an unsupported format.`;
      
      // Customize based on known error messages
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
      originalImage: file.originalImage, // Persist image if available
      date: new Date().toISOString().split('T')[0],
      downloads: 0
    };

    // Simulate saving to shared storage
    setTimeout(() => {
      const savedLibrary = localStorage.getItem(LIBRARY_STORAGE_KEY);
      let libraryItems: LibraryItem[] = savedLibrary ? JSON.parse(savedLibrary) : [...INITIAL_LIBRARY_DATA];
      libraryItems.unshift(newItem); // Add to top
      localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(libraryItems));
      
      setIsPublishing(false);
      alert('Successfully published to Community Library! Other users can now find your notes.');
    }, 1500);
  };

  const handleImportFromLibrary = (item: LibraryItem) => {
    setShowLibraryModal(false);
    setIsProcessingFile(true);
    setUploadProgress(0);
    setProcessingStatus('Importing from library...');

    // Simulate network/processing delay to make it feel like a fresh upload
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        
        // Actual state update
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

    // MONETIZATION & RATE LIMIT CHECK
    if (!userState.isPremium) {
      const now = Date.now();
      const oneHourAgo = now - USAGE_WINDOW_MS;
      
      // Filter out usage records older than 1 hour
      const recentUsage = (userState.questionUsage || []).filter(timestamp => timestamp > oneHourAgo);
      
      if (recentUsage.length >= FREE_QUESTIONS_LIMIT) {
        setShowPaymentModal(true);
        return;
      }

      // Update usage state
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
      const aiResponse = await generateResponse(messages, userMessage, file);
      setMessages(prev => [...prev, { role: 'model', text: aiResponse }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: 'Something went wrong. Please try again.', isError: true }]);
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

  // Helper to get days remaining on premium
  const getDaysRemaining = () => {
    if (!userState.premiumExpiryDate) return 0;
    const diff = userState.premiumExpiryDate - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = getDaysRemaining();
  // Show warning if premium and expiring in 7 days or less
  const showRenewalWarning = userState.isPremium && daysRemaining <= 7 && daysRemaining > 0;

  // If not logged in, show Auth Screen
  if (!userState.user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col h-screen relative bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <InteractiveBackground backgroundImage={customBackground} />
      
      {/* Main Content Wrapper - Glass Effect */}
      <div className="relative z-10 flex flex-col h-screen bg-white/30 dark:bg-slate-900/40 backdrop-blur-sm">
        
        {/* Header */}
        <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-white/50 dark:border-slate-700 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm transition-colors">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-brand-500/30 shadow-lg">M</div>
             <h1 className="font-bold text-xl text-slate-800 dark:text-white tracking-tight">{APP_NAME}</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowSettingsModal(true)}
              className="hidden md:flex items-center gap-2 mr-2 hover:bg-slate-100/50 dark:hover:bg-slate-700/50 p-1.5 rounded-lg transition-colors"
            >
               <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-xs border border-brand-200 dark:border-brand-800">
                 {userState.user.name.charAt(0).toUpperCase()}
               </div>
               <div className="flex flex-col items-start">
                 <span className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-tight">{userState.user.name}</span>
                 <span className="text-[10px] text-slate-400 dark:text-slate-500">Settings</span>
               </div>
            </button>
            <button onClick={handleLogout} className="md:hidden text-xs text-slate-500 dark:text-slate-400 font-medium">Logout</button>

            {userState.isPremium && (
              <span className="hidden sm:flex px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-bold uppercase tracking-wider border border-amber-200 dark:border-amber-800 items-center gap-1 shadow-sm">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                Premium
              </span>
            )}
          </div>
        </header>

        {/* Premium Expiry Warning Banner */}
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

        {/* Main Content */}
        <main className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full overflow-hidden">
          
          {/* Left Sidebar: File Upload & Contacts */}
          <div className="w-full md:w-80 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border-r border-white/50 dark:border-slate-700 p-6 flex flex-col z-10 overflow-y-auto transition-colors">
            <div className="flex-1">
              
              {/* Install PWA Button */}
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
              
              <label className={`flex flex-col items-center justify-center w-full min-h-[160px] border-2 border-dashed ${uploadSuccess ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg shadow-green-500/10' : isProcessingFile ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20' : 'border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:border-brand-300 dark:hover:border-brand-500'} ${!file && !isProcessingFile && !uploadSuccess ? 'animate-pulse shadow-[0_0_15px_rgba(14,165,233,0.15)] border-brand-300 dark:border-brand-700' : ''} rounded-xl cursor-pointer transition-all group mb-4 shadow-sm relative overflow-hidden`}>
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
                {/* 
                  accept attribute is broad to allow OS file pickers (which handle Drive/Cloud integrations) 
                  to show all compatible files.
                */}
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={handleFileUpload} 
                  accept=".pdf,.doc,.docx,.txt,.rtf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/*,image/*,*/*" 
                  disabled={isProcessingFile}
                />
              </label>

              {/* Library Access Button */}
              <button 
                onClick={() => setShowLibraryModal(true)}
                className="w-full flex items-center justify-center gap-2 mb-6 py-2 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-all font-medium text-sm"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Search Community Notes
              </button>

              {file && (
                <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-4 border border-brand-100 dark:border-slate-700 shadow-sm animate-fade-in-up mb-6">
                  <div className="flex items-start gap-3">
                    {file.originalImage ? (
                      <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-600">
                        <img src={file.originalImage} alt="Thumbnail" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="p-2 bg-brand-50 dark:bg-slate-700 rounded-md text-brand-500 flex-shrink-0">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </div>
                    )}
                    <div className="overflow-hidden flex-1 min-w-0">
                        <p className="text-sm font-semibold text-brand-900 dark:text-brand-100 truncate" title={file.name}>{file.name}</p>
                        <p className="text-xs text-brand-700 dark:text-brand-300 uppercase mt-0.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                          Ready for questions
                        </p>
                    </div>
                  </div>
                  
                  {/* Share to Library Button */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <button 
                      onClick={handlePublishToLibrary}
                      disabled={isPublishing}
                      className="w-full text-xs flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                    >
                      {isPublishing ? (
                        <>
                          <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          Publishing...
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                          Share to Community
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-6">
              
              {/* Settings Trigger Button */}
              <button 
                onClick={() => setShowSettingsModal(true)}
                className="w-full flex items-center gap-3 p-3 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 rounded-xl border border-white/40 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 transition-all text-slate-700 dark:text-slate-300 font-medium shadow-sm group"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-brand-600 group-hover:bg-brand-50 dark:group-hover:bg-brand-900/30 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span>Settings & Profile</span>
              </button>
            </div>
          </div>

          {/* Right Area: Chat */}
          <div className="flex-1 flex flex-col h-full relative bg-white/40 dark:bg-slate-900/40">
             <ChatInterface messages={messages} isLoading={isLoading} />
             
             <div className="p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-t border-white/50 dark:border-slate-700 transition-colors">
                <form onSubmit={handleSendMessage} className="flex gap-2 relative max-w-4xl mx-auto">
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      isListening 
                        ? "Listening..." 
                        : file 
                          ? `Ask a question about "${file.name}"...`
                          : "Upload from device or Library to get started..."
                    }
                    className={`flex-1 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg px-4 py-3 pr-20 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-400 shadow-sm ${isListening ? 'ring-2 ring-red-400 border-red-400' : ''}`}
                    disabled={(!file && !input) || isLoading}
                  />
                  
                  {/* Microphone Button */}
                  {hasSupport && (
                    <button
                      type="button"
                      onClick={toggleListening}
                      disabled={(!file && !input) || isLoading}
                      className={`absolute right-12 top-1 bottom-1 px-3 rounded-md transition-all ${
                        isListening 
                          ? 'text-red-500 bg-red-50 dark:bg-red-900/30 animate-pulse' 
                          : 'text-slate-400 hover:text-brand-500 hover:bg-slate-50 dark:hover:bg-slate-600'
                      } ${((!file && !input) || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={isListening ? "Stop Listening" : "Start Voice Input"}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </button>
                  )}

                  <Button type="submit" disabled={(!file && !input) || isLoading || !input.trim()} className="absolute right-1 top-1 bottom-1 px-3 rounded-md">
                     <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                  </Button>
                </form>
                <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                  {isListening ? <span className="text-red-500 font-semibold animate-pulse">Recording... Click mic to stop.</span> : "MOA AI"}
                </p>
             </div>
          </div>

        </main>

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
          theme={theme}
          toggleTheme={toggleTheme}
          onUpgrade={triggerUpgrade}
          onHelp={handleAskAIHelp}
          onGenerateBackground={handleGenerateBackground}
          isGeneratingBackground={isGeneratingBg}
        />

        <LibraryModal
          isOpen={showLibraryModal}
          onClose={() => setShowLibraryModal(false)}
          onImport={handleImportFromLibrary}
        />
      </div>
    </div>
  );
};

export default App;
