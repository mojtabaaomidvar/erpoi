// src/features/auth/ui/ForgotPasswordPage.tsx

import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export function ForgotPasswordPage({ onBack }: Props) {
  const { requestPasswordReset, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setValidationError('Email is required');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationError('Invalid email format');
      return;
    }

    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      // Error handled by useAuth
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 text-green-400 text-3xl mb-4">
              ✓
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
            <p className="text-slate-300 mb-6">
              We've sent password reset instructions to <strong className="text-white">{email}</strong>
            </p>
            <button
              onClick={onBack}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Forgot Password?</h1>
          <p className="text-slate-300">Enter your email to receive reset instructions</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setValidationError('');
                  }}
                  className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    validationError ? 'border-red-500' : 'border-white/20'
                  }`}
                  placeholder="Enter your email"
                  autoFocus
                />
              </div>
              {validationError && (
                <p className="mt-1 text-xs text-red-400">{validationError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Instructions'
              )}
            </button>
          </form>

          <button
            onClick={onBack}
            className="w-full mt-4 py-3 text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}