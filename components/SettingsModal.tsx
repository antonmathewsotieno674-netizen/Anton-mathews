
import React, { useState } from 'react';
import { UserState } from '../types';
import { Button } from './Button';
import { SOCIAL_LINKS, APP_NAME, APP_VERSION } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userState: UserState;
  onUpdateUser: (name: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onUpgrade: () => void;
  onHelp: () => void;
  onGenerateBackground?: () => Promise<void>;
  isGeneratingBackground?: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  userState,
  onUpdateUser,
  theme,
  toggleTheme,
  onUpgrade,
  onHelp,
  onGenerateBackground,
  isGeneratingBackground
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(userState.user?.name || '');
  const [activeTab, setActiveTab] = useState<'profile' | 'community' | 'feedback' | 'help' | 'about'>('profile');
  
  // Feedback State
  const [feedbackText, setFeedbackText] = useState('');
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  if (!isOpen || !userState.user) return null;

  const handleSave = () => {
    onUpdateUser(editedName);
    setIsEditing(false);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 p-4 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Settings</h2>
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
          {['profile', 'community', 'feedback', 'help', 'about'].map((tab) => (
             <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 min-w-[80px] py-3 text-sm font-medium transition-colors capitalize whitespace-nowrap px-4 ${
                  activeTab === tab 
                    ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-400' 
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
                <div className="w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 text-2xl font-bold border border-brand-200 dark:border-brand-700 shadow-sm shrink-0">
                  {userState.user.name.charAt(0).toUpperCase()}
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
                    <div className="flex items-center gap-2">
                       <h3 className="text-lg font-bold text-slate-800 dark:text-white truncate">{userState.user.name}</h3>
                       <button onClick={() => setIsEditing(true)} className="text-xs text-brand-600 dark:text-brand-400 hover:underline shrink-0">Edit</button>
                    </div>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{userState.user.email || userState.user.phone || 'No contact info'}</p>
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
                        {isGeneratingBackground ? 'Generating Art...' : 'Generate AI Wallpaper (Imagen)'}
                      </Button>
                      <p className="text-[10px] text-slate-400 mt-2 text-center">Uses Google Imagen to create a unique neural wallpaper.</p>
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
                 
                 {userState.isPremium ? (
                   <div className="text-sm border-t border-amber-200/50 dark:border-amber-700/50 pt-3 mt-1">
                     <p className="text-amber-800 dark:text-amber-200"><span className="opacity-70">Expires:</span> {formatDate(userState.premiumExpiryDate)}</p>
                   </div>
                 ) : (
                   <div className="mt-4">
                     <Button onClick={onUpgrade} className="w-full bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 border-0 shadow-md">
                       Upgrade to Premium
                     </Button>
                   </div>
                 )}
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
                className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 border border-green-100 dark:border-green-900/30 rounded-xl shadow-sm hover:shadow-md hover:border-green-200 dark:hover:border-green-80