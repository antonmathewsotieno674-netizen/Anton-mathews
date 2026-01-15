
import React, { useState, useEffect, useRef } from 'react';
import { UserState, LibraryItem, UploadRecord } from '../types';
import { Button } from './Button';
import { SOCIAL_LINKS, APP_NAME, APP_VERSION, LIBRARY_STORAGE_KEY, INITIAL_LIBRARY_DATA } from '../constants';
import { ContactSection } from './ContactSection';

type SettingsTab = 'profile' | 'library' | 'community' | 'files' | 'feedback' | 'help' | 'about';

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

const FileIcon = ({ type, className }: { type: string, className?: string }) => {
  if (type.includes('pdf')) return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9h1m0 4h3m-3 4h3" /></svg>;
  if (type.includes('image')) return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
  if (type.includes('video')) return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
};

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
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab || 'profile');
  
  // Profile Picture Upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Legal View State for About Tab
  const [legalView, setLegalView] = useState<'none' | 'privacy' | 'terms'>('none');

  // Library State
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Files State
  const [fileSearchQuery, setFileSearchQuery] = useState('');
  const [expandedFileGroups, setExpandedFileGroups] = useState<Record<string, boolean>>({});

  // Feedback State
  const [feedbackText, setFeedbackText] = useState('');
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || 'profile');
      setLegalView('none'); // Reset legal view on open
      setFileSearchQuery(''); // Reset file search on open
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  // Files Logic (with Version Grouping)
  const groupFilesByName = () => {
    const groups: Record<string, UploadRecord[]> = {};
    const filtered = userState.uploadHistory.filter(record => 
        record.name.toLowerCase().includes(fileSearchQuery.toLowerCase())
    );
    
    filtered.forEach(record => {
        if (!groups[record.name]) groups[record.name] = [];
        groups[record.name].push(record);
    });
    
    // Sort versions by date desc
    Object.keys(groups).forEach(name => {
        groups[name].sort((a, b) => b.date - a.date);
    });
    
    return groups;
  };

  const fileGroups = groupFilesByName();
  const sortedGroupNames = Object.keys(fileGroups).sort((a, b) => {
      // Sort by the latest version in each group
      return fileGroups[b][0].date - fileGroups[a][0].date;
  });

  const toggleGroup = (name: string) => {
      setExpandedFileGroups(prev => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors border border-slate-200 dark:border-slate-700">
        
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 p-4 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Settings & History</h2>
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
                onClick={() => { setActiveTab(tab as SettingsTab); setLegalView('none'); }}
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
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
            </div>
          )}

          {activeTab === 'files' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex justify-between items-center">
                   <h3 className="text-lg font-bold text-slate-800 dark:text-white">Management & Versions</h3>
                   <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                      {userState.uploadHistory.length} uploads
                   </span>
                </div>

                {/* File Search Bar */}
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input 
                    type="text" 
                    placeholder="Search by filename..." 
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm transition-all shadow-sm"
                    value={fileSearchQuery}
                    onChange={(e) => setFileSearchQuery(e.target.value)}
                  />
                  {fileSearchQuery && (
                    <button 
                      onClick={() => setFileSearchQuery('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                
                {sortedGroupNames.length > 0 ? (
                    <div className="space-y-4">
                       {sortedGroupNames.map((name) => {
                          const versions = fileGroups[name];
                          const isExpanded = expandedFileGroups[name];
                          const latest = versions[0];
                          
                          return (
                            <div key={name} className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm transition-all">
                               <div 
                                 className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                 onClick={() => versions.length > 1 && toggleGroup(name)}
                               >
                                  <div className="flex items-center gap-4 flex-1 min-w-0">
                                     <div className="p-2 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg">
                                        <FileIcon type={latest.type} className="w-5 h-5" />
                                     </div>
                                     <div className="min-w-0">
                                        <h4 className="font-bold text-slate-800 dark:text-white truncate pr-2">{name}</h4>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                                            {versions.length} Version{versions.length > 1 ? 's' : ''} • Last modified {formatDate(latest.date)}
                                        </p>
                                     </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-3">
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="text-[10px] h-7 px-2 uppercase tracking-tight"
                                        onClick={(e) => { e.stopPropagation(); onRestoreFile?.(latest); }}
                                      >
                                        Use Current
                                      </Button>
                                      {versions.length > 1 && (
                                          <svg className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                      )}
                                  </div>
                               </div>

                               {isExpanded && versions.length > 1 && (
                                  <div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 p-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                     {versions.slice(1).map((v, idx) => (
                                        <div key={v.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors group">
                                           <div className="text-xs">
                                              <p className="text-slate-500 dark:text-slate-400">Version from {formatDate(v.date)}</p>
                                              <p className="text-[10px] text-slate-400">{(v.size ? (v.size / 1024).toFixed(1) + ' KB' : 'N/A')}</p>
                                           </div>
                                           <div className="flex items-center gap-2">
                                              <button 
                                                onClick={() => onRestoreFile?.(v)}
                                                className="text-[10px] font-bold text-brand-600 dark:text-brand-400 hover:underline uppercase tracking-tight px-2 py-1"
                                              >
                                                 Revert to this
                                              </button>
                                              <button 
                                                onClick={() => onDeleteFile?.(v.id)}
                                                className="p-1.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                              >
                                                 <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                              </button>
                                           </div>
                                        </div>
                                     ))}
                                  </div>
                               )}
                            </div>
                          );
                       })}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                       <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                       </div>
                       <h3 className="text-slate-600 dark:text-slate-300 font-bold">{fileSearchQuery ? 'No results' : 'History Empty'}</h3>
                       <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto">
                         {fileSearchQuery ? `No files matching "${fileSearchQuery}" were found.` : 'Files you upload will appear here with version tracking.'}
                       </p>
                    </div>
                )}
             </div>
          )}

          {activeTab === 'library' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm shadow-sm"
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
                      className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                        activeCategory === cat 
                          ? 'bg-brand-600 text-white border-brand-600 shadow-md' 
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-brand-300'
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
                  <div key={item.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col group border-l-4 border-l-brand-500">
                    <div className="flex justify-between items-start mb-3">
                      <div className="bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">
                        {item.category}
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{item.date}</span>
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-white mb-2 group-hover:text-brand-600 transition-colors">{item.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed">{item.description}</p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700/50 mt-auto">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-[10px] font-bold text-brand-700 dark:text-brand-300 shadow-sm">
                          {item.author.charAt(0)}
                        </div>
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{item.author}</span>
                      </div>
                      <Button size="sm" onClick={() => onImport(item)} className="text-xs px-4 py-1.5 h-9 rounded-xl font-bold">
                        Import
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other tabs follow similar improved UI patterns */}
          {activeTab === 'community' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 text-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Global Student Network</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 max-w-sm mx-auto">Sync with peers, share knowledge, and study collectively.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <a 
                    href={SOCIAL_LINKS.whatsapp} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex flex-col items-center gap-4 p-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group"
                  >
                    <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-all shadow-lg">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.637 3.891 1.685 5.452l-1.117 4.17 4.167-1.159zm1.5-7.95l.407.663c.105.17.22.348.337.525.632.96 1.64 1.761 2.766 2.201.216.085.397.161.547.234l.322.156c.773.376 1.344.417 1.77.37.514-.055 1.15-.468 1.443-1.282.083-.23.136-.456.162-.644l.006-.039c.026-.184.004-.265-.078-.308-.225-.116-1.188-.59-1.423-.703l-.089-.043c-.159-.076-.289-.092-.41.091-.129.195-.53.673-.654.819-.11.129-.219.145-.444.032-.224-.11-1.084-.403-2.028-1.246-.667-.595-1.076-1.332-1.205-1.554-.128-.22-.014-.336.096-.445.097-.096.216-.25.323-.377.032-.039.066-.078.099-.118.175-.213.232-.303.344-.525.113-.222.057-.417-.028-.588-.084-.169-.747-1.804-1.026-2.47-.267-.633-.535-.547-.732-.555l-.197-.003c-.207-.003-.548.006-.856.347-.282.312-1.077 1.053-1.077 2.569 0 1.515 1.103 2.979 1.257 3.186l.019.025z"/></svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white">WhatsApp</h4>
                      <p className="text-xs text-slate-500">Real-time alerts</p>
                    </div>
                  </a>

                  <a 
                    href={SOCIAL_LINKS.telegram} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex flex-col items-center gap-4 p-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group"
                  >
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-lg">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.693-1.653-1.124-2.678-1.8-1.185-.781-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.119.098.152.228.166.33.016.115.016.232.004.307z"/></svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white">Telegram</h4>
                      <p className="text-xs text-slate-500">Resource archive</p>
                    </div>
                  </a>
              </div>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Help us improve</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Found a bug? Have a suggestion for a new AI mode? We listen to every user.
              </p>
              
              <form onSubmit={handleSendFeedback} className="space-y-4">
                <div className="relative">
                  <textarea 
                    className="w-full h-40 p-4 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none resize-none shadow-inner"
                    placeholder="Tell us what's on your mind..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    disabled={isSendingFeedback}
                    maxLength={1000}
                  ></textarea>
                  <div className="absolute bottom-4 right-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest pointer-events-none">
                     {feedbackText.length}/1000
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  isLoading={isSendingFeedback}
                  disabled={!feedbackText.trim()}
                  className="w-full shadow-lg h-12 rounded-2xl"
                >
                  {feedbackSent ? 'Thank you!' : 'Submit Feedback'}
                </Button>
              </form>
            </div>
          )}

          {activeTab === 'help' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
               <div className="text-center bg-brand-50 dark:bg-brand-900/20 p-6 rounded-2xl border border-brand-100 dark:border-brand-800 shadow-inner">
                 <h3 className="text-lg font-bold text-brand-800 dark:text-brand-300">Stuck on something?</h3>
                 <p className="text-sm text-brand-700/70 dark:text-brand-300/60 mb-4">Our AI is trained to assist with app navigation too.</p>
                 <Button onClick={onHelp} variant="secondary" className="w-full rounded-xl">
                    Ask AI Assistant
                 </Button>
               </div>

               <div className="space-y-3">
                 <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Knowledge Base</h4>
                 <div className="space-y-2">
                    <details className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 cursor-pointer group shadow-sm transition-all hover:border-brand-300">
                       <summary className="text-sm font-bold text-slate-800 dark:text-white flex justify-between items-center outline-none">
                         How do versions work?
                         <svg className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                       </summary>
                       <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed border-t dark:border-slate-700 pt-3">
                         If you upload a file with the same name multiple times, MOA AI automatically groups them as versions. You can switch back to older versions in the "Files" tab.
                       </p>
                    </details>
                    <details className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 cursor-pointer group shadow-sm transition-all hover:border-brand-300">
                       <summary className="text-sm font-bold text-slate-800 dark:text-white flex justify-between items-center outline-none">
                         What is "Deep Think"?
                         <svg className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                       </summary>
                       <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed border-t dark:border-slate-700 pt-3">
                         Deep Think mode allocates extra processing time for the AI to reason through your query. Use it for complex math, coding, or dense scientific papers.
                       </p>
                    </details>
                 </div>
               </div>
               
               <ContactSection />
             </div>
          )}

          {activeTab === 'about' && (
            <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
               {legalView === 'none' && (
                 <>
                   <div className="flex flex-col items-center">
                     <div className="w-24 h-24 bg-brand-600 rounded-[2rem] flex items-center justify-center text-white font-bold text-5xl shadow-2xl mb-6 transform hover:rotate-6 transition-transform">M</div>
                     <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{APP_NAME}</h3>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Version {APP_VERSION}</p>
                     
                     <div className="mt-8 max-w-sm mx-auto text-center">
                        <h4 className="text-[10px] font-bold text-brand-600 uppercase tracking-[0.2em] mb-3">Our Core Philosophy</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-loose italic">
                          "Empowering every student with a brilliant digital mind."
                        </p>
                     </div>
                   </div>
                   
                   <div className="bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-left shadow-inner">
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2 uppercase tracking-widest">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        Important Notice
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        MOA AI utilizes the latest Gemini 3 model architecture. Always cross-reference AI responses with your original textbooks for critical examinations.
                      </p>
                   </div>

                   <div className="flex justify-center gap-8 text-[10px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                     <button onClick={() => setLegalView('privacy')} className="hover:text-brand-800 transition-colors">Privacy</button>
                     <button onClick={() => setLegalView('terms')} className="hover:text-brand-800 transition-colors">Terms</button>
                   </div>
                   <p className="text-[10px] text-slate-400 mt-4">© {new Date().getFullYear()} MOA AI Global. All rights reserved.</p>
                 </>
               )}

               {/* Legal views would go here... */}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
