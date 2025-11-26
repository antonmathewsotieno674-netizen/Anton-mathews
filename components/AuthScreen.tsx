
import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { APP_NAME } from '../constants';
import { User } from '../types';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

type AuthMode = 'signin' | 'signup' | 'forgot_password';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  
  // Form Fields
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Forgot Password Step (1: Identifier, 2: New Password)
  const [resetStep, setResetStep] = useState<1 | 2>(1);

  // Clear errors when switching modes
  useEffect(() => {
    setError('');
    setSuccessMessage('');
    setPassword('');
    setConfirmPassword('');
    if (mode === 'forgot_password') {
        setResetStep(1);
    }
  }, [mode]);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
        setError('Please fill in all fields');
        return;
    }
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      onLogin({
        id: 'user-' + Math.random().toString(36).substr(2, 9),
        name: identifier.split('@')[0] || 'User',
        email: method === 'email' ? identifier : undefined,
        phone: method === 'phone' ? identifier : undefined,
        authMethod: method
      });
      setIsLoading(false);
    }, 1500);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password || !confirmPassword || !name) {
        setError('Please fill in all fields');
        return;
    }

    if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
    }

    if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
    }

    setIsLoading(true);
    setTimeout(() => {
      onLogin({
        id: 'user-' + Math.random().toString(36).substr(2, 9),
        name: name,
        email: method === 'email' ? identifier : undefined,
        phone: method === 'phone' ? identifier : undefined,
        authMethod: method
      });
      setIsLoading(false);
    }, 1500);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (resetStep === 1) {
        if (!identifier) {
            setError('Please enter your ' + (method === 'email' ? 'email' : 'phone number'));
            return;
        }
        setIsLoading(true);
        // Simulate checking if user exists
        setTimeout(() => {
            setIsLoading(false);
            setResetStep(2);
            setSuccessMessage('Account verified. Please create a new password.');
        }, 1000);
    } else {
        if (!password || !confirmPassword) {
            setError('Please enter your new password');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setSuccessMessage('Password successfully updated! Redirecting to login...');
            setTimeout(() => {
                setMode('signin');
            }, 2000);
        }, 1500);
    }
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      onLogin({
        id: 'google-user-123',
        name: 'Google User',
        email: 'user@gmail.com',
        authMethod: 'google'
      });
      setIsLoading(false);
    }, 1500);
  };

  const renderTitle = () => {
      switch(mode) {
          case 'signup': return 'Create Account';
          case 'forgot_password': return 'Reset Password';
          default: return `Welcome to ${APP_NAME}`;
      }
  };

  const renderSubtitle = () => {
      switch(mode) {
          case 'signup': return 'Sign up to get started';
          case 'forgot_password': return 'Recover your account access';
          default: return 'Your intelligent study companion';
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700 transition-colors animate-in fade-in zoom-in duration-300">
        <div className="bg-brand-600 p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-indigo-600 opacity-90"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white rounded-xl mx-auto flex items-center justify-center text-brand-600 font-bold text-3xl mb-4 shadow-lg">M</div>
            <h1 className="text-2xl font-bold text-white mb-2">{renderTitle()}</h1>
            <p className="text-brand-100">{renderSubtitle()}</p>
          </div>
        </div>

        <div className="p-8">
          {mode !== 'forgot_password' && (
            <>
                <button 
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-medium py-2.5 px-4 rounded-lg transition-all mb-6 focus:ring-2 focus:ring-slate-200"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                </button>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">Or continue with</span>
                    </div>
                </div>
            </>
          )}

          {/* Identifier Type Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg mb-6">
            <button 
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${method === 'email' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
              onClick={() => setMethod('email')}
            >
              Email
            </button>
            <button 
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${method === 'phone' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
              onClick={() => setMethod('phone')}
            >
              Phone
            </button>
          </div>
          
          {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-900/30 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {error}
              </div>
          )}

          {successMessage && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-lg border border-green-100 dark:border-green-900/30 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                   <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  {successMessage}
              </div>
          )}

          <form onSubmit={mode === 'signin' ? handleSignIn : mode === 'signup' ? handleSignUp : handleResetPassword} className="space-y-4">
            
            {mode === 'signup' && (
                <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Full Name
                    </label>
                    <input 
                        type="text" 
                        required
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
            )}

            {(mode !== 'forgot_password' || resetStep === 1) && (
                <div className="animate-in fade-in duration-300">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {method === 'email' ? 'Email Address' : 'Phone Number'}
                    </label>
                    <input 
                        type={method === 'email' ? 'email' : 'tel'} 
                        required
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                        placeholder={method === 'email' ? 'name@example.com' : '07XX XXX XXX'}
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        disabled={isLoading || (mode === 'forgot_password' && resetStep === 2)}
                    />
                </div>
            )}

            {(mode !== 'forgot_password' || resetStep === 2) && (
                <div className="animate-in fade-in duration-300">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {mode === 'forgot_password' ? 'New Password' : 'Password'}
                    </label>
                    <input 
                        type="password" 
                        required
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
            )}

            {(mode === 'signup' || (mode === 'forgot_password' && resetStep === 2)) && (
                 <div className="animate-in fade-in duration-300">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Confirm Password
                    </label>
                    <input 
                        type="password" 
                        required
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
            )}
            
            {mode === 'signin' && (
                <div className="flex justify-end">
                    <button 
                        type="button" 
                        onClick={() => setMode('forgot_password')}
                        className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                    >
                        Forgot Password?
                    </button>
                </div>
            )}

            <Button type="submit" className="w-full py-2.5" isLoading={isLoading}>
              {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : resetStep === 1 ? 'Verify Account' : 'Update Password'}
            </Button>
          </form>

          {/* Mode Switching */}
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 text-center">
            {mode === 'signin' ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Don't have an account?{' '}
                    <button 
                        onClick={() => setMode('signup')}
                        className="font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                    >
                        Sign up
                    </button>
                </p>
            ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Already have an account?{' '}
                    <button 
                        onClick={() => setMode('signin')}
                        className="font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                    >
                        Sign in
                    </button>
                </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
