// src/features/auth/ui/LoginPage.tsx

import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';

interface Props {
  onForgotPassword?: () => void;
}

export function LoginPage({ onForgotPassword }: Props) {
  const { login, isLoading, error } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    try {
      await login(formData);
    } catch (err) {
      // Error handled by useAuth
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white text-2xl font-bold mb-4 shadow-lg shadow-blue-600/50">
            ICS
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-slate-300">Sign in to your account to continue</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-sm text-red-200">
                {error}
              </div>
            )}

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    validationErrors.username ? 'border-red-500' : 'border-white/20'
                  }`}
                  placeholder="Enter your username"
                  autoFocus
                />
              </div>
              {validationErrors.username && (
                <p className="mt-1 text-xs text-red-400">{validationErrors.username}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 bg-white/10 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    validationErrors.password ? 'border-red-500' : 'border-white/20'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {validationErrors.password && (
                <p className="mt-1 text-xs text-red-400">{validationErrors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => handleChange('rememberMe', e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-white/10 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-300">Remember me</span>
              </label>
              {onForgotPassword && (
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot password?
                </button>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <p className="text-xs text-slate-400 text-center mb-3">Demo Credentials</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setFormData({ username: 'admin', password: 'admin123', rememberMe: false })}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 transition-colors"
              >
                Admin
              </button>
              <button
                onClick={() => setFormData({ username: 'sara.m', password: 'password', rememberMe: false })}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 transition-colors"
              >
                Manager
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-400 mt-8">
          © 2024 ICS System. All rights reserved.
        </p>
      </div>
    </div>
  );
}