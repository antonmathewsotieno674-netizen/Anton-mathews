
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
    