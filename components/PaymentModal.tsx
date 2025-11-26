import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { PREMIUM_PRICE_KSH } from '../constants';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsProcessing(false);
      setIsSuccess(false);
      setPhoneNumber('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate API call to MPESA/Payment Gateway
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
    }, 2000);
  };

  const handleComplete = () => {
    onSuccess();
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-8 text-center animate-in zoom-in duration-300 border border-white/20 dark:border-slate-700 transition-colors">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Payment Successful!</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
            Premium access is now active. You can enjoy unlimited questions and deep analysis on all your notes.
          </p>
          <Button onClick={handleComplete} className="w-full py-3 text-lg shadow-lg shadow-brand-500/30">
            Start Learning
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in duration-300">
        <div className="bg-brand-600 p-6 text-center">
          <h2 className="text-2xl font-bold text-white">Unlock Premium Access</h2>
          <p className="text-brand-100 mt-2">Get unlimited AI questions on your notes</p>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col items-center justify-center mb-6 space-y-4">
            <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-4 py-1 rounded-full text-sm font-semibold border border-green-200 dark:border-green-800">
              Only KSH {PREMIUM_PRICE_KSH} / session
            </div>

            <div className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">Pay to Pochi la Biashara</p>
              <div className="text-2xl font-mono font-bold text-slate-800 dark:text-white tracking-tight">0757 634590</div>
              <p className="text-xs text-slate-400 mt-1">Send KSH {PREMIUM_PRICE_KSH} to this number</p>
            </div>
          </div>

          <form onSubmit={handlePayment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm M-PESA Phone Number</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400">🇰🇪 +254</span>
                <input 
                  type="tel" 
                  placeholder="7XX XXX XXX"
                  className="w-full pl-20 pr-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  pattern="[0-9]{9}"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1 ml-1">Enter the number you used to pay</p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 flex items-start gap-2">
              <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                After sending payment, enter your number above and click 'Verify Payment' to access premium features.
              </p>
            </div>

            <div className="flex gap-3 mt-2">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="w-full" 
                isLoading={isProcessing}
                disabled={phoneNumber.length !== 9}
              >
                Verify Payment
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};