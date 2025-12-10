

import React, { useState, useEffect, useRef } from 'react';
import { UserState, LibraryItem, UploadRecord } from '../types';
import { Button } from './Button';
import { SOCIAL_LINKS, APP_NAME, APP_VERSION, LIBRARY_STORAGE_KEY, INITIAL_LIBRARY_DATA } from '../constants';
import { ContactSection } from './ContactSection';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userState: UserState;
  onUpdateUser: (name: string) => void;
  onUpdateProfilePicture?: (base64Image?: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onUpgrade: () => void;
  onHelp: () => void;
  onGenerateBackground?: () => Promise<void>;
  isGeneratingBackground?: boolean;
  onImport: (item: LibraryItem) => void;
  initialTab?: 'profile' | 'library' | 'community' | 'files';
  onRestoreFile?: (record: UploadRecord) => void;
  onDeleteFile?: (id: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  userState,
  onUpdateUser,
  onUpdateProfilePicture,
  theme,
  toggleTheme,
  onUpgrade,
  onHelp,
  onGenerateBackground,
  isGeneratingBackground,
  onImport,
  initialTab = 'profile',
  onRestoreFile,
  onDeleteFile
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(userState.user?.name || '');
  const [activeTab, setActiveTab] = useState(initialTab || 'profile');
  
  // Profile Picture Upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Legal View State for About Tab
  const [legalView, setLegalView] = useState<'none' | 'privacy' | 'terms'>('none');

  // Library State
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Feedback State
  const [feedbackText, setFeedbackText] = useState('');
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || 'profile');
      setLegalView('none'); // Reset legal view on open
    }
  }, [isOpen, initialTab]);

  // Load library items when library tab is active
  useEffect(() => {
    if (activeTab === 'library') {
      const savedLibrary = localStorage.getItem(LIBRARY_STORAGE_KEY);
      if (savedLibrary) {
        setLibraryItems(JSON.parse(savedLibrary));
      } else {
        setLibraryItems(INITIAL_LIBRARY_DATA as LibraryItem[]);
        localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(INITIAL_LIBRARY_DATA));
      }
    }
  }, [activeTab]);

  if (!isOpen || !userState.user) return null;

  const handleSave = () => {
    onUpdateUser(editedName);
    setIsEditing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image is too large. Please select an image under 2MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (onUpdateProfilePicture && typeof reader.result === 'string') {
          onUpdateProfilePicture(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    if (onUpdateProfilePicture) {
      onUpdateProfilePicture(undefined);
    }
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setIsSendingFeedback(true);
    // Simulate network request
    setTimeout(() => {
      setIsSendingFeedback(false);
      setFeedbackSent(true);
      setFeedbackText('');
      // Reset success message after 3 seconds
      setTimeout(() => setFeedbackSent(false), 3000);
    }, 1500);
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Library Logic
  const categories = ['All', ...Array.from(new Set(libraryItems.map(item => item.category)))];
  const filteredLibraryItems = libraryItems.filter(item => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = item.title.toLowerCase().includes(query) || 
                          item.description.toLowerCase().includes(query);
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 p-4 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Settings & Library</h2>
          <button 
             onClick={onClose}
             className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
           >
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
           </button>
        </div>

        {/* Tabs - Scrollable with hidden scrollbar */}
        <div className="flex border-b border-slate-100 dark:border-slate-700 shrink-0 overflow-x-auto scrollbar-hide">
          {['profile', 'files', 'library', 'community', 'feedback', 'help', 'about'].map((tab) => (
             <button 
                key={tab}
                onClick={() => { setActiveTab(tab as any); setLegalView('none'); }}
                className={`flex-1 min-w-[80px] py-3 text-sm font-medium transition-colors capitalize whitespace-nowrap px-4 ${
                  activeTab === tab 
                    ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-400 bg-slate-50/50 dark:bg-slate-700/30' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {tab}
              </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/50">
          
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-4">
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 text-3xl font-bold border-2 border-brand-200 dark:border-brand-700 shadow-sm overflow-hidden">
                    {userState.user.profilePicture ? (
                      <img 
                        src={userState.user.profilePicture} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      userState.user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  
                  {/* Edit Photo Overlay */}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                    title="Change Photo"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/png, image/jpeg, image/jpg"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                      />
                      <Button size="sm" onClick={handleSave} className="py-1 px-3 text-xs">Save</Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-start gap-1">
                       <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-800 dark:text-white truncate">{userState.user.name}</h3>
                          <button onClick={() => setIsEditing(true)} className="text-xs text-brand-600 dark:text-brand-400 hover:underline shrink-0">Edit Name</button>
                       </div>
                       {userState.user.profilePicture && (
                         <button onClick={handleRemovePhoto} className="text-xs text-red-500 hover:text-red-600 hover:underline">Remove Photo</button>
                       )}
                    </div>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">{userState.user.email || userState.user.phone || 'No contact info'}</p>
                </div>
              </div>

              {/* Appearance Section */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm space-y-4">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${theme === 'dark' ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>
                        {theme === 'dark' ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-sm">Dark Mode</h3>
                      </div>
                    </div>
                    <button 
                      onClick={toggleTheme}
                      className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out relative ${theme === 'dark' ? 'bg-brand-600' : 'bg-slate-200'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                 </div>
                 
                 {onGenerateBackground && (
                   <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                     <div className="flex justify-between items-center mb-2">
                       <h3 className="font-bold text-slate-800 dark:text-white text-sm">App Background</h3>
                     </div>
                     <Button 
                        onClick={onGenerateBackground} 
                        isLoading={isGeneratingBackground}
                        className="w-full text-xs py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
                      >
                        {isGeneratingBackground ? 'Generating Art...' : 'Generate New Wallpaper'}
                      </Button>
                      <p className="text-[10px] text-slate-400 mt-2 text-center">Uses Google GenAI to create a unique neural wallpaper.</p>
                   </div>
                 )}
              </div>

              {/* Subscription Card */}
              <div className={`rounded-xl p-5 border ${userState.isPremium ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm'}`}>
                 <div className="flex justify-between items-start mb-3">
                   <div>
                     <h3 className={`font-bold ${userState.isPremium ? 'text-amber-900 dark:text-amber-300' : 'text-slate-800 dark:text-white'}`}>
                       {userState.isPremium ? 'Premium Plan Active' : 'Free Plan'}
                     </h3>
                     <p className={`text-xs ${userState.isPremium ? 'text-amber-700 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
                       {userState.isPremium ? 'You have full access to all features.' : 'Upgrade to remove limits.'}
                     </p>
                   </div>
                   {userState.isPremium && (
                      <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 p-1.5 rounded-full">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      </span>
                   )}
                 </div>
                 
                 <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50 space-y-3">
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Subscription Expiry</span>
                      <span className={`font-medium ${userState.isPremium ? 'text-amber-800 dark:text-amber-200' : 'text-slate-700 dark:text-slate-300'}`}>
                        {userState.isPremium ? formatDate(userState.premiumExpiryDate) : 'N/A'}
                      </span>
                   </div>
                   
                   {!userState.isPremium && (
                     <Button onClick={onUpgrade} className="w-full bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 border-0 shadow-md">
                       Upgrade to Premium
                     </Button>
                   )}
                 </div>
              </div>

              {/* Payment History */}
              {userState.paymentHistory && userState.paymentHistory.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Payment History</h3>
                  <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                    {userState.paymentHistory.map((payment) => (
                       <div key={payment.id} className="flex justify-between items-center p-3 border-b border-slate-100 dark:border-slate-700 last:border-0 text-sm">
                          <div>
                             <p className="font-medium text-slate-700 dark:text-slate-300">Premium</p>
                             <p className="text-xs text-slate-400">{new Date(payment.date).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                             <p className="font-bold text-slate-800 dark:text-white">KSH {payment.amount}</p>
                          </div>
                       </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Support Shortcuts */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
                 <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-3">Support & Feedback</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button 
                      onClick={() => setActiveTab('help')}
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left group"
                    >
                       <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       </div>
                       <div>
                         <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Help Center</p>
                         <p className="text-xs text-slate-500 dark:text-slate-400">FAQs & Support</p>
                       </div>
                    </button>

                    <button 
                      onClick={() => setActiveTab('feedback')}
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left group"
                    >
                       <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                       </div>
                       <div>
                         <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Send Feedback</p>
                         <p className="text-xs text-slate-500 dark:text-slate-400">Feature requests</p>
                       </div>
                    </button>
                 </div>
              </div>

            </div>
          )}

          {activeTab === 'files' && (
             <div className="space-y-6">
                <div className="flex justify-between items-center">
                   <h3 className="text-lg font-bold text-slate-800 dark:text-white">Uploaded Files</h3>
                   <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                      {userState.uploadHistory.length} files
                   </span>
                </div>
                
                {userState.uploadHistory && userState.uploadHistory.length > 0 ? (
                    <div className="space-y-3">
                       {userState.uploadHistory.map((record) => (
                          <div key={record.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                             <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-slate-800 dark:text-white truncate" title={record.name}>{record.name}</h4>
                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                                   <span>{(record.size ? (record.size / 1024).toFixed(1) + ' KB' : 'Unknown size')}</span>
                                   <span>•</span>
                                   <span className="uppercase">{record.type?.split('/')[1] || 'FILE'}</span>
                                   <span>•</span>
                                   <span>{new Date(record.date).toLocaleDateString()}</span>
                                </div>
                             </div>
                             
                             <div className="flex items-center gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs py-1.5 h-8"
                                  onClick={() => onRestoreFile && onRestoreFile(record)}
                                  disabled={!record.content}
                                >
                                   {record.content ? 'Load Context' : 'No Data'}
                                </Button>
                                <button 
                                  onClick={() => onDeleteFile && onDeleteFile(record.id)}
                                  className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                  title="Delete from history"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                             </div>
                          </div>
                       ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                       <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                       </div>
                       <h3 className="text-slate-600 dark:text-slate-300 font-medium">No uploads yet</h3>
                       <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Uploaded files will appear here.</p>
                    </div>
                )}
             </div>
          )}

          {activeTab === 'library' && (
            <div className="space-y-4">
              {/* Search & Filter */}
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input 
                    type="text" 
                    placeholder="Search notes by title or description..." 
                    className="w-full pl-10 pr-10 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      title="Clear search"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                        activeCategory === cat 
                          ? 'bg-brand-600 text-white border-brand-600' 
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items List */}
              <div className="grid grid-cols-1 gap-3">
                {filteredLibraryItems.map(item => (
                  <div key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow flex flex-col group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                        {item.category}
                      </div>
                      <span className="text-xs text-slate-400">{item.date}</span>
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-white mb-1 group-hover:text-brand-600 transition-colors">{item.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{item.description}</p>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700 mt-auto">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-400">
                          {item.author.charAt(0)}
                        </div>
                        <span className="text-xs text-slate-600 dark:text-slate-400">{item.author}</span>
                      </div>
                      <Button size="sm" onClick={() => onImport(item)} className="text-xs px-3 py-1 h-8">
                        Import
                      </Button>
                    </div>
                  </div>
                ))}
                
                {filteredLibraryItems.length === 0 && (
                  <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                    <p className="text-sm">No notes found.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'community' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Join the Community</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Get updates, support, and connect with other students.</p>
              </div>

              <a 
                href={SOCIAL_LINKS.whatsapp} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 border border-green-100 dark:border-green-900/30 rounded-xl shadow-sm hover:shadow-md hover:border-green-200 dark:hover:border-green-800 transition-all group"
              >
                 <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                   <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.637 3.891 1.685 5.452l-1.117 4.17 4.167-1.159zm1.5-7.95l.407.663c.105.17.22.348.337.525.632.96 1.64 1.761 2.766 2.201.216.085.397.161.547.234l.322.156c.773.376 1.344.417 1.77.37.514-.055 1.15-.468 1.443-1.282.083-.23.136-.456.162-.644l.006-.039c.026-.184.004-.265-.078-.308-.225-.116-1.188-.59-1.423-.703l-.089-.043c-.159-.076-.289-.092-.41.091-.129.195-.53.673-.654.819-.11.129-.219.145-.444.032-.224-.11-1.084-.403-2.028-1.246-.667-.595-1.076-1.332-1.205-1.554-.128-.22-.014-.336.096-.445.097-.096.216-.25.323-.377.032-.039.066-.078.099-.118.175-.213.232-.303.344-.525.113-.222.057-.417-.028-.588-.084-.169-.747-1.804-1.026-2.47-.267-.633-.535-.547-.732-.555l-.197-.003c-.207-.003-.548.006-.856.347-.282.312-1.077 1.053-1.077 2.569 0 1.515 1.103 2.979 1.257 3.186l.019.025z"/></svg>
                 </div>
                 <div>
                   <h4 className="font-bold text-slate-800 dark:text-white">WhatsApp Channel</h4>
                   <p className="text-xs text-slate-500 dark:text-slate-400">Join for daily updates & tips</p>
                 </div>
              </a>

              <a 
                href={SOCIAL_LINKS.telegram} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 border border-blue-100 dark:border-blue-900/30 rounded-xl shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all group"
              >
                 <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                   <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.693-1.653-1.124-2.678-1.8-1.185-.781-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.119.098.152.228.166.33.016.115.016.232.004.307z"/></svg>
                 </div>
                 <div>
                   <h4 className="font-bold text-slate-800 dark:text-white">Telegram Group</h4>
                   <p className="text-xs text-slate-500 dark:text-slate-400">Discuss with the community</p>
                 </div>
              </a>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Send Feedback</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Found a bug or have a feature request? Let us know directly.
              </p>
              
              <form onSubmit={handleSendFeedback} className="space-y-4">
                <div className="relative">
                  <textarea 
                    className="w-full h-32 p-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                    placeholder="Describe your issue or idea..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    disabled={isSendingFeedback}
                    maxLength={1000}
                  ></textarea>
                  <div className="absolute bottom-3 right-3 text-xs text-slate-400 pointer-events-none">
                     {feedbackText.length}/1000
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    isLoading={isSendingFeedback}
                    disabled={!feedbackText.trim()}
                    className="w-full sm:w-auto"
                  >
                    {feedbackSent ? 'Message Sent!' : 'Send Feedback'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'help' && (
             <div className="space-y-6">
               <div className="text-center">
                 <h3 className="text-lg font-bold text-slate-800 dark:text-white">Need Help?</h3>
                 <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">You can ask MOA AI for guidance.</p>
                 <Button onClick={onHelp} variant="secondary" className="w-full">
                    Ask AI for Help
                 </Button>
               </div>

               <div className="space-y-3">
                 <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Common Questions</h4>
                 <div className="space-y-2">
                    <details className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 cursor-pointer group">
                       <summary className="text-sm font-medium text-slate-800 dark:text-white flex justify-between items-center">
                         How do I upload notes?
                         <svg className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                       </summary>
                       <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                         Click the "Browse Device & Cloud" box in the sidebar. You can select PDF, Word, or Image files from your device storage or connected accounts like Google Drive.
                       </p>
                    </details>
                    <details className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 cursor-pointer group">
                       <summary className="text-sm font-medium text-slate-800 dark:text-white flex justify-between items-center">
                         Is there a limit on questions?
                         <svg className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                       </summary>
                       <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                         Free users are limited to 5 questions per hour. Premium users enjoy unlimited questions and advanced analysis features.
                       </p>
                    </details>
                 </div>
               </div>
               
               <ContactSection />
             </div>
          )}

          {activeTab === 'about' && (
            <div className="text-center space-y-6 animate-in fade-in slide-in-from-right-4">
               {legalView === 'none' && (
                 <>
                   <div className="flex flex-col items-center">
                     <div className="w-20 h-20 bg-brand-600 rounded-2xl flex items-center justify-center text-white font-bold text-4xl shadow-lg mb-4">M</div>
                     <h3 className="text-xl font-bold text-slate-800 dark:text-white">{APP_NAME}</h3>
                     <p className="text-sm text-slate-500 dark:text-slate-400">Version {APP_VERSION}</p>
                     <p className="text-xs text-slate-400 mt-1">© {new Date().getFullYear()} MOA AI. All rights reserved.</p>
                     
                     <div className="mt-4 max-w-sm mx-auto">
                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Our Mission</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          MOA AI aims to democratize education by providing an accessible, intelligent study companion that helps students understand complex materials instantly, regardless of their resources.
                        </p>
                     </div>
                   </div>
                   
                   <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-left">
                      <h4 className="text-sm font-bold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        Disclaimer
                      </h4>
                      <p className="text-xs text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                        MOA AI uses advanced artificial intelligence to analyze your notes. While we strive for accuracy, AI can sometimes make mistakes or hallucinate information. Always verify critical information from your original study materials.
                      </p>
                   </div>

                   <div className="flex justify-center gap-4 text-xs text-brand-600 dark:text-brand-400">
                     <button onClick={() => setLegalView('privacy')} className="hover:underline">Privacy Policy</button>
                     <span>•</span>
                     <button onClick={() => setLegalView('terms')} className="hover:underline">Terms of Service</button>
                   </div>
                 </>
               )}

               {legalView === 'privacy' && (
                 <div className="text-left space-y-4 animate-in fade-in slide-in-from-right-4">
                   <button onClick={() => setLegalView('none')} className="flex items-center text-sm text-brand-600 dark:text-brand-400 mb-4 hover:underline">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      Back to About
                   </button>
                   <h3 className="text-lg font-bold text-slate-800 dark:text-white">Privacy Policy</h3>
                   <div className="prose prose-sm dark:prose-invert max-w-none text-xs text-slate-600 dark:text-slate-300 space-y-3 h-64 overflow-y-auto pr-2 custom-scrollbar">
                     <p><strong>1. Introduction:</strong> Welcome to MOA AI. We respect your privacy and are committed to protecting your personal data. This policy outlines how we handle your information.</p>
                     <p><strong>2. Data Collection:</strong> We collect user-provided information such as uploaded documents, text inputs, and account details (name, email, phone number). We also automatically collect usage statistics to improve app performance.</p>
                     <p><strong>3. AI Processing:</strong> Your notes, files, and chat queries are processed by Google Gemini AI. Data sent to the AI model is used strictly for generating responses for your session. We do not sell your personal data to third parties.</p>
                     <p><strong>4. Local Storage:</strong> Your chat history, uploaded file metadata, and preferences are stored locally on your device using browser LocalStorage. Clearing your browser cache will delete this history.</p>
                     <p><strong>5. Third-Party Services:</strong> We use third-party services for specific functions: Google (AI processing, Auth), and various payment gateways (M-PESA, PayPal, Stripe). These parties process data according to their own privacy policies.</p>
                     <p><strong>6. Data Security:</strong> We implement industry-standard encryption and security measures to protect your data. However, no method of transmission over the internet is 100% secure.</p>
                     <p><strong>7. User Rights:</strong> You have the right to access, correct, or request deletion of your account data. You can exercise these rights by contacting our support team via the settings menu.</p>
                     <p><strong>8. Updates:</strong> We may update this policy from time to time. Continued use of the app constitutes acceptance of the new policy.</p>
                   </div>
                 </div>
               )}

               {legalView === 'terms' && (
                 <div className="text-left space-y-4 animate-in fade-in slide-in-from-right-4">
                    <button onClick={() => setLegalView('none')} className="flex items-center text-sm text-brand-600 dark:text-brand-400 mb-4 hover:underline">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      Back to About
                   </button>
                   <h3 className="text-lg font-bold text-slate-800 dark:text-white">Terms of Service</h3>
                   <div className="prose prose-sm dark:prose-invert max-w-none text-xs text-slate-600 dark:text-slate-300 space-y-3 h-64 overflow-y-auto pr-2 custom-scrollbar">
                     <p><strong>1. Acceptance of Terms:</strong> By accessing or using MOA AI, you agree to be bound by these Terms of Service. If you do not agree, please discontinue use immediately.</p>
                     <p><strong>2. Educational License:</strong> MOA AI grants you a limited, non-exclusive, non-transferable license to use the application for personal educational and study purposes.</p>
                     <p><strong>3. AI Limitations:</strong> The AI services are provided "as is". MOA AI does not guarantee the accuracy, completeness, or reliability of AI-generated responses. Users must verify critical information independently. MOA AI is not liable for errors in study materials.</p>
                     <p><strong>4. User Conduct:</strong> You agree not to upload illegal, harmful, explicit, or offensive content. You are responsible for maintaining the confidentiality of your account credentials.</p>
                     <p><strong>5. Intellectual Property:</strong> You retain ownership of the notes you upload. By uploading, you grant MOA AI a license to process the content to provide the service. The app interface and code are owned by MOA AI.</p>
                     <p><strong>6. Premium Subscriptions:</strong> Premium features are billed as described in the payment section. Payments are non-refundable unless required by law. We reserve the right to change pricing with notice.</p>
                     <p><strong>7. Termination:</strong> We reserve the right to suspend or terminate accounts that violate these terms or engage in fraudulent activity.</p>
                     <p><strong>8. Governing Law:</strong> These terms are governed by the laws of Kenya. Any disputes shall be resolved in the courts of Kenya.</p>
                   </div>
                 </div>
               )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};