
import React, { useState } from 'react';
import { UserState } from '../types';
import { Button } from './Button';
import { SOCIAL_LINKS, APP_NAME, APP_VERSION } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userState: UserState;
  onUpdateUser: (name: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  userState,
  onUpdateUser
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(userState.user?.name || '');
  const [activeTab, setActiveTab] = useState<'profile' | 'community' | 'about'>('profile');

  if (!isOpen || !userState.user) return null;

  const handleSave = () => {
    onUpdateUser(editedName);
    setIsEditing(false);
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-white border-b border-slate-100 p-4 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-slate-800">Settings</h2>
          <button 
             onClick={onClose}
             className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-50 transition-colors"
           >
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
           </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 shrink-0 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex-1 min-w-[100px] py-3 text-sm font-medium transition-colors ${activeTab === 'profile' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Profile
          </button>
          <button 
            onClick={() => setActiveTab('community')}
            className={`flex-1 min-w-[100px] py-3 text-sm font-medium transition-colors ${activeTab === 'community' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Community
          </button>
          <button 
            onClick={() => setActiveTab('about')}
            className={`flex-1 min-w-[80px] py-3 text-sm font-medium transition-colors ${activeTab === 'about' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            About
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-2xl font-bold border border-brand-200 shadow-sm">
                  {userState.user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                      />
                      <Button size="sm" onClick={handleSave} className="py-1 px-3 text-xs">Save</Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                       <h3 className="text-lg font-bold text-slate-800">{userState.user.name}</h3>
                       <button onClick={() => setIsEditing(true)} className="text-xs text-brand-600 hover:underline">Edit</button>
                    </div>
                  )}
                  <p className="text-xs text-slate-500">{userState.user.email || userState.user.phone || 'No contact info'}</p>
                </div>
              </div>

              {/* Subscription Card */}
              <div className={`rounded-xl p-5 border ${userState.isPremium ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200' : 'bg-white border-slate-200 shadow-sm'}`}>
                 <div className="flex justify-between items-start mb-3">
                   <div>
                     <h3 className={`font-bold ${userState.isPremium ? 'text-amber-900' : 'text-slate-800'}`}>
                       {userState.isPremium ? 'Premium Plan Active' : 'Free Plan'}
                     </h3>
                     <p className={`text-xs ${userState.isPremium ? 'text-amber-700' : 'text-slate-500'}`}>
                       {userState.isPremium ? 'You have full access to all features.' : 'Upgrade to remove limits.'}
                     </p>
                   </div>
                   {userState.isPremium && (
                      <span className="bg-amber-100 text-amber-700 p-1.5 rounded-full">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      </span>
                   )}
                 </div>
                 
                 {userState.isPremium && (
                   <div className="text-sm border-t border-amber-200/50 pt-3 mt-1">
                     <p className="text-amber-800"><span className="opacity-70">Expires:</span> {formatDate(userState.premiumExpiryDate)}</p>
                   </div>
                 )}
              </div>

              {/* Payment History */}
              {userState.paymentHistory && userState.paymentHistory.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Payment History</h3>
                  <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                    {userState.paymentHistory.map((payment) => (
                       <div key={payment.id} className="flex justify-between items-center p-3 border-b border-slate-100 last:border-0 text-sm">
                          <div>
                             <p className="font-medium text-slate-700">Premium</p>
                             <p className="text-xs text-slate-400">{new Date(payment.date).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                             <p className="font-bold text-slate-800">KSH {payment.amount}</p>
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
                <h3 className="text-xl font-bold text-slate-800">Join the Community</h3>
                <p className="text-slate-500 text-sm mt-1">Get updates, support, and connect with other students.</p>
              </div>

              <a 
                href={SOCIAL_LINKS.whatsapp} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-4 p-4 bg-white border border-green-100 rounded-xl shadow-sm hover:shadow-md hover:border-green-200 transition-all group"
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.637 3.891 1.685 5.452l-1.117 4.17 4.167-1.159zm1.5-7.95l.407.663c.105.17.22.348.337.525.632.96 1.64 1.761 2.766 2.201.216.085.397.161.547.234l.322.156c.773.376 1.344.417 1.77.37.514-.055 1.15-.468 1.443-1.282.083-.23.136-.456.162-.644l.006-.039c.026-.184.004-.265-.078-.308-.225-.116-1.188-.59-1.423-.703l-.089-.043c-.159-.076-.289-.092-.41.091-.129.195-.53.673-.654.819-.11.129-.219.145-.444.032-.224-.11-1.084-.403-2.028-1.246-.667-.595-1.076-1.332-1.205-1.554-.128-.22-.014-.336.096-.445.097-.096.216-.25.323-.377.032-.039.066-.078.099-.118.175-.213.232-.303.344-.525.113-.222.057-.417-.028-.588-.084-.169-.747-1.804-1.026-2.47-.267-.633-.535-.547-.732-.555l-.197-.003c-.207-.003-.548.006-.856.347-.282.312-1.077 1.053-1.077 2.569 0 1.515 1.103 2.979 1.257 3.186l.019.025z"/></svg>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">WhatsApp Channel</h4>
                  <p className="text-xs text-slate-500">Join for instant updates & tips</p>
                </div>
                <div className="ml-auto">
                  <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </a>

              <a 
                href={SOCIAL_LINKS.telegram}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-4 p-4 bg-white border border-blue-100 rounded-xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Telegram Community</h4>
                  <p className="text-xs text-slate-500">Discuss with peers</p>
                </div>
                <div className="ml-auto">
                   <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </a>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Support Contacts</h3>
                <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-100">
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Phone</span>
                      <a href="tel:0731176583" className="font-medium text-brand-600">0731 176 583</a>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">WhatsApp</span>
                      <a href="https://wa.me/254757634590" className="font-medium text-brand-600">0757 634 590</a>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Email</span>
                      <a href="mailto:moa@moana.com" className="font-medium text-brand-600">moa@moana.com</a>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 bg-brand-600 rounded-2xl mx-auto flex items-center justify-center text-white text-4xl font-bold shadow-xl rotate-3 mb-4">
                M
              </div>
              
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-800">{APP_NAME}</h3>
                <p className="text-sm font-medium text-slate-500 bg-slate-100 inline-block px-3 py-1 rounded-full mt-2">Version {APP_VERSION}</p>
              </div>

              <p className="text-slate-600 text-sm leading-relaxed px-2">
                MOA AI is your intelligent study companion, designed to analyze documents, extract insights from images, and provide instant, accurate answers to help you excel in your studies.
              </p>
              
              <div className="pt-6 border-t border-slate-100 space-y-3">
                 <button className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm font-medium text-slate-700 transition-colors flex justify-between items-center group">
                   <span>Privacy Policy</span>
                   <svg className="w-4 h-4 text-slate-400 group-hover:text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                 </button>
                 <button className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm font-medium text-slate-700 transition-colors flex justify-between items-center group">
                   <span>Terms of Service</span>
                   <svg className="w-4 h-4 text-slate-400 group-hover:text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                 </button>
              </div>
              
              <div className="mt-8">
                <p className="text-xs text-slate-400">Developed with ❤️ for Students</p>
                <p className="text-[10px] text-slate-300 mt-1">© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
