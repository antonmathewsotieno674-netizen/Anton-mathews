
import React, { useState, useEffect, useRef } from 'react';
import { UserState, LibraryItem } from '../types';
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
  initialTab?: 'profile' | 'library' | 'community';
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
  initialTab = 'profile'
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(userState.user?.name || '');
  const [activeTab, setActiveTab] = useState<'profile' | 'library' | 'community' | 'feedback' | 'help' | 'about'>(initialTab);
  
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
      setActiveTab(initialTab);
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
          {['profile', 'library', 'community', 'feedback', 'help', 'about'].map((tab) => (
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
                        {isGeneratingBackground ? 'Generating Art...' : 'Generate AI Wallpaper'}
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

              {/* Upload History Section */}
              {userState.uploadHistory && userState.uploadHistory.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Upload History</h3>
                  <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm max-h-48 overflow-y-auto">
                    {userState.uploadHistory.map((record) => (
                       <div key={record.id} className="flex justify-between items-center p-3 border-b border-slate-100 dark:border-slate-700 last:border-0 text-sm">
                          <div>
                             <p className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[180px]">{record.name}</p>
                             <p className="text-xs text-slate-400">{record.type.split('/')[1]?.toUpperCase() || 'FILE'}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-xs text-slate-400">{new Date(record.date).toLocaleDateString()}</p>
                          </div>
                       </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Download History Section - Added as requested */}
              {userState.downloadHistory && userState.downloadHistory.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Library Downloads</h3>
                  <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm max-h-48 overflow-y-auto">
                    {userState.downloadHistory.map((record) => (
                       <div key={record.id} className="flex justify-between items-center p-3 border-b border-slate-100 dark:border-slate-700 last:border-0 text-sm">
                          <div>
                             <p className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[180px]">{record.itemTitle}</p>
                             <p className="text-xs text-slate-400">by {record.itemAuthor}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-xs text-slate-400">{new Date(record.date).toLocaleDateString()}</p>
                          </div>
                       </div>
                    ))}
                  </div>
                </div>
              )}

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
                      <div className="flex items-