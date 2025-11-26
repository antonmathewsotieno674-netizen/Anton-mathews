import React, { useState } from 'react';
import { User, UserState } from '../types';
import { Button } from './Button';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userState: UserState;
  onUpdateUser: (name: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ 
  isOpen, 
  onClose, 
  userState,
  onUpdateUser
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(userState.user?.name || '');

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

  const getDaysRemaining = (timestamp?: number) => {
    if (!timestamp) return 0;
    const diff = timestamp - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
        {/* Header Background */}
        <div className="h-24 bg-gradient-to-r from-brand-500 to-brand-700 relative">
           <button 
             onClick={onClose}
             className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 rounded-full p-1 transition-colors"
           >
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
           </button>
        </div>

        {/* Profile Content */}
        <div className="px-6 pb-6">
          <div className="relative flex justify-between items-end -mt-10 mb-4">
            <div className="w-20 h-20 rounded-full bg-white p-1 shadow-lg">
              <div className="w-full h-full rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-3xl font-bold border border-brand-200">
                {userState.user.name.charAt(0).toUpperCase()}
              </div>
            </div>
            {userState.isPremium && (
              <span className="mb-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wider border border-amber-200 shadow-sm flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                Premium
              </span>
            )}
          </div>

          <div className="space-y-4">
            {/* User Info Section */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="text-xs text-brand-600 hover:text-brand-800 font-medium">Edit</button>
                )}
              </div>
              
              {isEditing ? (
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleSave} className="py-1 px-3 text-xs">Save</Button>
                </div>
              ) : (
                <p className="text-lg font-semibold text-slate-800">{userState.user.name}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Contact Info</label>
              <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                {userState.user.email ? (
                  <>
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    <span className="text-sm">{userState.user.email}</span>
                  </>
                ) : (
                  <>
                     <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                     <span className="text-sm">{userState.user.phone || 'No phone provided'}</span>
                  </>
                )}
              </div>
            </div>

            {/* Subscription Section */}
            <div className={`rounded-xl p-4 border ${userState.isPremium ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
               <h3 className={`text-sm font-bold mb-2 ${userState.isPremium ? 'text-amber-800' : 'text-slate-600'}`}>
                 Subscription Status
               </h3>
               
               {userState.isPremium ? (
                 <div className="space-y-2">
                   <div className="flex justify-between items-center text-sm">
                     <span className="text-amber-700/70">Plan</span>
                     <span className="font-semibold text-amber-900">Premium Access</span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                     <span className="text-amber-700/70">Expires On</span>
                     <span className="font-medium text-amber-900">{formatDate(userState.premiumExpiryDate)}</span>
                   </div>
                   <div className="mt-2 pt-2 border-t border-amber-200/50 flex justify-between items-center">
                      <span className="text-xs text-amber-600 font-medium">{getDaysRemaining(userState.premiumExpiryDate)} days remaining</span>
                      <div className="w-24 h-1.5 bg-amber-200 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: '80%' }}></div>
                      </div>
                   </div>
                 </div>
               ) : (
                 <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Free Tier</span>
                    <span className="text-xs text-slate-400">Upgrade to unlock features</span>
                 </div>
               )}
            </div>

            <div className="text-center pt-2">
               <p className="text-xs text-slate-400">Member since {new Date().getFullYear()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
