
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
  const [progress, setProgress] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'airtel' | 'card' | 'paypal' | 'stripe'>('mpesa');
  const [statusMessage, setStatusMessage] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsProcessing(false);
      setIsSuccess(false);
      setPhoneNumber('');
      setEmail('');
      setStatusMessage('');
      setProgress(0);
      setPaymentMethod('mpesa');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setProgress(10);

    if (paymentMethod === 'mpesa' || paymentMethod === 'airtel') {
        setStatusMessage('Initiating secure connection...');
        
        setTimeout(() => {
            setProgress(40);
            setStatusMessage(`Sending STK Push to ${phoneNumber}...`);
        }, 1500);
        
        setTimeout(() => {
            setProgress(70);
            setStatusMessage('Waiting for PIN entry on your phone...');
        }, 3000);

        setTimeout(() => {
            setProgress(90);
            setStatusMessage('Verifying transaction with Pochi la Biashara...');
        }, 5500);

    } else if (paymentMethod === 'paypal') {
        setStatusMessage('Redirecting to PayPal secure checkout...');
        setTimeout(() => {
            setProgress(50);
            setStatusMessage('Authenticating user credentials...');
        }, 1500);
        setTimeout(() => {
             setProgress(80);
            setStatusMessage('Verifying merchant (Pochi la Biashara)...');
        }, 3000);
    } else {
        setStatusMessage('Encrypting card details...');
        setTimeout(() => {
            setProgress(50);
            setStatusMessage('Contacting payment gateway...');
        }, 2000);
        setTimeout(() => {
             setProgress(80);
            setStatusMessage('Finalizing secure transfer...');
        }, 4000);
    }

    // Simulate completion
    setTimeout(() => {
      setProgress(100);
      setIsProcessing(false);
      setIsSuccess(true);
    }, 7000); 
  };

  const handleComplete = () => {
    onSuccess();
  };

  const getMethodStyle = (method: string) => {
    const isActive = paymentMethod === method;
    const base = "flex-shrink-0 px-4 py-2.5 text-sm font-medium rounded-xl border transition-all whitespace-nowrap snap-center";
    
    if (isActive) {
      switch(method) {
        case 'mpesa': return `${base} bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-400 ring-1 ring-green-500 shadow-sm`;
        case 'airtel': return `${base} bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400 ring-1 ring-red-500 shadow-sm`;
        case 'paypal': return `${base} bg-blue-50 dark:bg-blue-900/20 border-blue-600 text-blue-700 dark:text-blue-400 ring-1 ring-blue-600 shadow-sm`;
        case 'stripe': return `${base} bg-violet-50 dark:bg-violet-900/20 border-violet-500 text-violet-700 dark:text-violet-400 ring-1 ring-violet-500 shadow-sm`;
        default: return `${base} bg-slate-100 dark:bg-slate-600 border-slate-400 text-slate-800 dark:text-white`;
      }
    }
    return `${base} bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-600 hover:border-slate-300 dark:hover:border-slate-500`;
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
          <Button onClick={handleComplete} className="w-full py-3 text-lg shadow-lg shadow-brand-500/30 hover:scale-[1.02] active:scale-[0.98] transition-transform transform">
            Start Learning
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      {/* 
        Changes for responsive layout: 
        1. max-h-[90vh] ensures it fits on screen.
        2. flex flex-col allows internal scrolling.
      */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden transform transition-all animate-in fade-in zoom-in duration-300 border border-slate-100 dark:border-slate-700 relative">
        
        {/* Processing Overlay - Absolute to cover everything */}
        {isProcessing && (
          <div className="absolute inset-0 z-20 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
             <div className="w-20 h-20 mb-6 relative">
                {/* Ping animation background */}
                <div className="absolute inset-0 bg-brand-500/20 rounded-full animate-ping"></div>
                
                {/* Dynamic Icon based on stage */}
                <div className="relative z-10 w-full h-full bg-brand-50 dark:bg-brand-900/40 rounded-full flex items-center justify-center border border-brand-200 dark:border-brand-700 shadow-lg text-brand-600 dark:text-brand-400">
                  {progress < 40 ? (
                    <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : progress < 70 ? (
                    <svg className="w-8 h-8 animate-[wiggle_1s_ease-in-out_infinite]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  ) : (
                    <svg className="w-8 h-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
                </div>
             </div>

             <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Processing Payment</h3>
             <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 min-h-[1.25rem] font-medium animate-pulse">
               {statusMessage}
             </p>

             {/* Progress Bar */}
             <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-700 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                   <div className="absolute inset-0 bg-white/30 animate-[shimmer_1s_infinite] w-full h-full"></div>
                </div>
             </div>
             
             {progress >= 70 && (paymentMethod === 'mpesa' || paymentMethod === 'airtel') && (
               <p className="mt-4 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full border border-amber-100 dark:border-amber-800">
                  Check your phone for the PIN prompt
               </p>
             )}
          </div>
        )}

        {/* Fixed Header */}
        <div className="bg-brand-600 p-6 text-center shrink-0">
          <h2 className="text-2xl font-bold text-white">Unlock Premium Access</h2>
          <p className="text-brand-100 mt-2">Get unlimited AI questions on your notes</p>
        </div>
        
        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex flex-col items-center justify-center mb-6 space-y-4">
            <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-4 py-1 rounded-full text-sm font-semibold border border-green-200 dark:border-green-800">
              Only KSH {PREMIUM_PRICE_KSH} / session
            </div>

            {/* Payment Method Selector - Scrollable & Snappy */}
            <div className="w-full overflow-x-auto pb-1 scrollbar-hide snap-x">
              <div className="flex gap-2 min-w-min px-1">
                  <button type="button" onClick={() => setPaymentMethod('mpesa')} className={getMethodStyle('mpesa')}>M-PESA</button>
                  <button type="button" onClick={() => setPaymentMethod('airtel')} className={getMethodStyle('airtel')}>Airtel</button>
                  <button type="button" onClick={() => setPaymentMethod('paypal')} className={getMethodStyle('paypal')}>PayPal</button>
                  <button type="button" onClick={() => setPaymentMethod('stripe')} className={getMethodStyle('stripe')}>Stripe</button>
                  <button type="button" onClick={() => setPaymentMethod('card')} className={getMethodStyle('card')}>Card</button>
              </div>
            </div>

            {/* Merchant Info Banner - Compact on mobile */}
            <div className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center relative overflow-hidden group hover:border-brand-200 dark:hover:border-brand-800 transition-colors">
              <div className="absolute top-0 right-0 w-16 h-16 bg-brand-500/5 rounded-bl-full -mr-8 -mt-8"></div>
              <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">
                 {paymentMethod === 'paypal' || paymentMethod === 'stripe' ? 'Funds settled to Merchant' : 'Pay to Pochi la Biashara'}
              </p>
              <div className="text-xl md:text-2xl font-mono font-bold text-slate-800 dark:text-white tracking-tight group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors break-words">0757 634590</div>
              <p className="text-xs text-slate-400 mt-1">Recipient: Anton</p>
            </div>
          </div>

          <form onSubmit={handlePayment} className="space-y-4">
            {/* Dynamic Inputs based on Method */}
            
            {(paymentMethod === 'mpesa' || paymentMethod === 'airtel') && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                   Enter Phone Number
                </label>
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
                    disabled={isProcessing}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1 ml-1 flex items-center gap-1">
                   <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   A PIN prompt will be sent to this number.
                </p>
              </div>
            )}

            {paymentMethod === 'paypal' && (
               <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    PayPal Email Address
                 </label>
                 <input 
                   type="email" 
                   placeholder="name@example.com"
                   className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   required
                   disabled={isProcessing}
                 />
                 <div className="mt-3 flex items-center justify-center gap-2 text-slate-500 text-xs bg-slate-50 dark:bg-slate-700/50 p-2 rounded">
                   <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.946 5.438-3.158 7.12-6.578 7.12h-1.48c-.51 0-.967.326-1.064.845l-.21 1.164-.381 2.115-.224 1.24a.64.64 0 0 1-.63.522h-1.44z"/></svg>
                   <span>Securely processed via PayPal</span>
                 </div>
               </div>
            )}

            {(paymentMethod === 'card' || paymentMethod === 'stripe') && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-3">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Card Number</label>
                    <div className="relative">
                        <input 
                        type="text" 
                        placeholder="0000 0000 0000 0000"
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition"
                        disabled={isProcessing}
                        />
                        <svg className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                    </div>
                 </div>
                 <div className="flex gap-3">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Expiry</label>
                        <input 
                        type="text" 
                        placeholder="MM/YY"
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition"
                        disabled={isProcessing}
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CVC</label>
                        <input 
                        type="text" 
                        placeholder="123"
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition"
                        disabled={isProcessing}
                        />
                    </div>
                 </div>
              </div>
            )}

            <div className="flex gap-3 mt-4 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 hover:scale-105 active:scale-95 transition-transform transform duration-150"
                onClick={onClose}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-[2] hover:scale-105 active:scale-95 transition-transform transform duration-150 shadow-md hover:shadow-lg bg-brand-600 hover:bg-brand-700" 
                isLoading={isProcessing}
                disabled={(paymentMethod === 'mpesa' && phoneNumber.length !== 9)}
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
