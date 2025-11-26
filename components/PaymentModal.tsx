
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
      setPaymentMethod('mpesa');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    if (paymentMethod === 'mpesa' || paymentMethod === 'airtel') {
        setStatusMessage('Initiating STK Push...');
        setTimeout(() => {
            setStatusMessage(`Sending prompt to ${phoneNumber}...`);
        }, 1000);
        setTimeout(() => {
            setStatusMessage('Please enter your PIN on your phone to complete transaction.');
        }, 2500);
    } else if (paymentMethod === 'paypal') {
        setStatusMessage('Redirecting to PayPal secure checkout...');
        setTimeout(() => {
            setStatusMessage('Verifying merchant (Pochi la Biashara)...');
        }, 2000);
    } else {
        setStatusMessage('Processing card transaction...');
        setTimeout(() => {
            setStatusMessage(' contacting gateway...');
        }, 2000);
    }

    // Simulate completion
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
    }, 6000); 
  };

  const handleComplete = () => {
    onSuccess();
  };

  const getMethodStyle = (method: string) => {
    const isActive = paymentMethod === method;
    const base = "flex-shrink-0 px-4 py-2 text-sm font-medium rounded-lg border transition-all whitespace-nowrap";
    
    if (isActive) {
      switch(method) {
        case 'mpesa': return `${base} bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-400 ring-1 ring-green-500`;
        case 'airtel': return `${base} bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400 ring-1 ring-red-500`;
        case 'paypal': return `${base} bg-blue-50 dark:bg-blue-900/20 border-blue-600 text-blue-700 dark:text-blue-400 ring-1 ring-blue-600`;
        case 'stripe': return `${base} bg-violet-50 dark:bg-violet-900/20 border-violet-500 text-violet-700 dark:text-violet-400 ring-1 ring-violet-500`;
        default: return `${base} bg-slate-100 dark:bg-slate-600 border-slate-400 text-slate-800 dark:text-white`;
      }
    }
    return `${base} bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600`;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in duration-300 border border-slate-100 dark:border-slate-700">
        <div className="bg-brand-600 p-6 text-center">
          <h2 className="text-2xl font-bold text-white">Unlock Premium Access</h2>
          <p className="text-brand-100 mt-2">Get unlimited AI questions on your notes</p>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col items-center justify-center mb-6 space-y-4">
            <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-4 py-1 rounded-full text-sm font-semibold border border-green-200 dark:border-green-800">
              Only KSH {PREMIUM_PRICE_KSH} / session
            </div>

            {/* Payment Method Selector - Scrollable */}
            <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
              <div className="flex gap-2 min-w-min px-1">
                  <button type="button" onClick={() => setPaymentMethod('mpesa')} className={getMethodStyle('mpesa')}>M-PESA</button>
                  <button type="button" onClick={() => setPaymentMethod('airtel')} className={getMethodStyle('airtel')}>Airtel</button>
                  <button type="button" onClick={() => setPaymentMethod('paypal')} className={getMethodStyle('paypal')}>PayPal</button>
                  <button type="button" onClick={() => setPaymentMethod('stripe')} className={getMethodStyle('stripe')}>Stripe</button>
                  <button type="button" onClick={() => setPaymentMethod('card')} className={getMethodStyle('card')}>Card</button>
              </div>
            </div>

            {/* Merchant Info Banner */}
            <div className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-brand-500/5 rounded-bl-full -mr-8 -mt-8"></div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">
                 {paymentMethod === 'paypal' || paymentMethod === 'stripe' ? 'Funds settled to Merchant' : 'Pay to Pochi la Biashara'}
              </p>
              <div className="text-2xl font-mono font-bold text-slate-800 dark:text-white tracking-tight">0757 634590</div>
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
                <p className="text-xs text-slate-400 mt-1 ml-1">
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

            {statusMessage && (
               <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 flex items-start gap-2 animate-pulse">
                 <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
                 <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                   {statusMessage}
                 </p>
               </div>
            )}

            <div className="flex gap-3 mt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full hover:scale-105 active:scale-95 transition-transform transform duration-150"
                onClick={onClose}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="w-full hover:scale-105 active:scale-95 transition-transform transform duration-150 shadow-md hover:shadow-lg" 
                isLoading={isProcessing}
                disabled={(paymentMethod === 'mpesa' && phoneNumber.length !== 9)}
              >
                {isProcessing ? 'Processing...' : 'Verify Payment'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
