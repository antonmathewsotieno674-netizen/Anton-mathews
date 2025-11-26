
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

        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-700 shrink-0 overflow-x-auto no-scrollbar">
          {['profile', 'community', 'feedback', 'help', 'about'].map((tab) => (
             <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 min-w-[80px] py-3 text-sm font-medium transition-colors capitalize ${
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
                <div className="w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 text-2xl font-bold border border-brand-200 dark:border-brand-700 shadow-sm">
                  {userState.user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                      />
                      <Button size="sm" onClick={handleSave} className="py-1 px-3 text-xs">Save</Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                       <h3 className="text-lg font-bold text-slate-800 dark:text-white">{userState.user.name}</h3>
                       <button onClick={() => setIsEditing(true)} className="text-xs text-brand-600 dark:text-brand-400 hover:underline">Edit</button>
                    </div>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-400">{userState.user.email || userState.user.phone || 'No contact info'}</p>
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
                className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 border border-green-100 dark:border-green-900/30 rounded-xl shadow-sm hover:shadow-md hover:border-green-200 dark:hover:border-green-800 transition-all group"
              >
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.637 3.891 1.685 5.452l-1.117 4.17 4.167-1.159zm1.5-7.95l.407.663c.105.17.22.348.337.525.632.96 1.64 1.761 2.766 2.201.216.085.397.161.547.234l.322.156c.773.376 1.344.417 1.77.37.514-.055 1.15-.468 1.443-1.282.083-.23.136-.456.162-.644l.006-.039c.026-.184.004-.265-.078-.308-.225-.116-1.188-.59-1.423-.703l-.089-.043c-.159-.076-.289-.092-.41.091-.129.195-.53.673-.654.819-.11.129-.219.145-.444.032-.224-.11-1.084-.403-2.028-1.246-.667-.595-1.076-1.332-1.205-1.554-.128-.22-.014-.336.096-.445.097-.096.216-.25.323-.377.032-.039.066-.078.099-.118.175-.213.232-.303.344-.525.113-.222.057-.417-.028-.588-.084-.169-.747-1.804-1.026-2.47-.267-.633-.535-.547-.732-.555l-.197-.003c-.207-.003-.548.006-.856.347-.282.312-1.077 1.053-1.077 2.569 0 1.515 1.103 2.979 1.257 3.186l.019.025z"/></svg>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white">WhatsApp Channel</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Join for instant updates & tips</p>
                </div>
                <div className="ml-auto">
                  <svg className="w-5 h-5 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </a>

              <a 
                href={SOCIAL_LINKS.telegram}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 border border-blue-100 dark:border-blue-900/30 rounded-xl shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all group"
              >
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white">Telegram Community</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Discuss with peers</p>
                </div>
                <div className="ml-auto">
                   <svg className="w-5 h-5 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </a>

              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Support Contacts</h3>
                <div className="space-y-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Phone</span>
                      <a href="tel:0731176583" className="font-medium text-brand-600 dark:text-brand-400">0731 176 583</a>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 dark:text-slate-400">WhatsApp</span>
                      <a href="https://wa.me/254757634590" className="font-medium text-brand-600 dark:text-brand-400">0757 634 590</a>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Email</span>
                      <a href="mailto:moa@moana.com" className="font-medium text-brand-600 dark:text-brand-400">moa@moana.com</a>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Send Feedback</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Have a suggestion or found a bug? Let us know!</p>
              </div>

              {feedbackSent ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center animate-in zoom-in duration-300">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="font-bold text-green-800 dark:text-green-300">Message Sent!</h4>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">Thank you for helping us improve {APP_NAME}.</p>
                </div>
              ) : (
                <form onSubmit={handleSendFeedback} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Your Message</label>
                    <textarea 
                      required
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition min-h-[150px] resize-none"
                      placeholder="Tell us what you think or describe an issue..."
                    ></textarea>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>We read every message but may not reply individually.</span>
                  </div>
                  <Button type="submit" className="w-full" isLoading={isSendingFeedback}>
                    Send Message
                  </Button>
                </form>
              )}
            </div>
          )}

          {activeTab === 'help' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Help Center</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Frequently asked questions and guides.</p>
              </div>

              <div className="space-y-3">
                 <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">How do I upload notes?</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Click on the "Access Internal Storage" box in the sidebar to select files (PDF, Word, or Images) from your device.</p>
                 </div>
                 <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">Is there a limit to questions?</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Free users can ask 5 questions per hour. Premium users have unlimited access.</p>
                 </div>
                 <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">How do I pay?</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Go to Settings > Upgrade to Premium. You can pay via M-PESA to the Pochi la Biashara number.</p>
                 </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                 <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-3 text-center">Still need help?</p>
                 <Button onClick={onHelp} className="w-full bg-brand-600 hover:bg-brand-700">
                   Ask AI Assistant for Help
                 </Button>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 bg-brand-600 rounded-2xl mx-auto flex items-center justify-center text-white text-4xl font-bold shadow-xl rotate-3 mb-4">
                M
              </div>
              
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{APP_NAME}</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 inline-block px-3 py-1 rounded-full mt-2">Version {APP_VERSION}</p>
              </div>

              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed px-2">
                MOA AI is your intelligent study companion, designed to analyze documents, extract insights from images, and provide instant, accurate answers to help you excel in your studies.
              </p>
              
              {/* Disclaimer Section */}
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl p-4 text-left">
                <div className="flex items-center gap-2 mb-2 text-amber-800 dark:text-amber-500 font-bold text-sm">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Disclaimer
                </div>
                <p className="text-xs text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                  MOA AI uses advanced artificial intelligence to generate responses. While we strive for accuracy, the AI may occasionally produce incorrect or misleading information. Please verify important details from official sources. This tool is intended for educational support and should not be used as the sole basis for critical decisions.
                </p>
              </div>
              
              <div className="pt-6 border-t border-slate-100 dark:border-slate-700 space-y-3">
                 <button className="w-full py-3 px-4 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors flex justify-between items-center group">
                   <span>Privacy Policy</span>
                   <svg className="w-4 h-4 text-slate-400 group-hover:text-brand-500 dark:group-hover:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                 </button>
                 <button className="w-full py-3 px-4 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors flex justify-between items-center group">
                   <span>Terms of Service</span>
                   <svg className="w-4 h-4 text-slate-400 group-hover:text-brand-500 dark:group-hover:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                 </button>
              </div>
              
              <div className="mt-8">
                <p className="text-xs text-slate-400 dark:text-slate-500">Developed with ❤️ for Students</p>
                <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1">© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
