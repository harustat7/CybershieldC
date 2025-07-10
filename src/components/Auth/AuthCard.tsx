import React, { useState, useEffect } from 'react';
import { Shield, Lock, Mail, User, Eye, EyeOff } from 'lucide-react';
import { AuthMode } from '../../types';
import { authHelpers } from '../../lib/supabase';
import ForgotPasswordModal from './ForgotPasswordModal';
import OTPVerificationModal from './OTPVerificationModal';

interface AuthCardProps {
  onLogin: (user: any) => void;
}

const AuthCard: React.FC<AuthCardProps> = ({ onLogin }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Modal states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  // Check for magic link authentication on component mount
  useEffect(() => {
    const handleMagicLinkAuth = async () => {
      try {
        // Check if we have auth tokens in the URL (from magic link)
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        const type = urlParams.get('type');

        if (accessToken && refreshToken && type === 'magiclink') {
          setIsLoading(true);
          
          // Set the session with the tokens from the URL
          const { data, error } = await authHelpers.setSession(accessToken, refreshToken);
          
          if (error) {
            console.error('Magic link authentication error:', error);
            setError('Failed to authenticate with magic link. Please try logging in again.');
          } else if (data.user) {
            // Clear URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Successfully authenticated via magic link
            onLogin(data.user);
          }
          
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error handling magic link:', error);
        setError('Failed to process magic link authentication.');
        setIsLoading(false);
      }
    };

    handleMagicLinkAuth();
  }, [onLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      if (authMode === 'signup') {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }

        const { data, error } = await authHelpers.signUp(email, password, name);
        
        if (error) {
          setError(error.message);
        } else if (data.user) {
          setError('Please check your email to confirm your account before logging in. Check your spam folder if you don\'t see the email.');
        }
      } else {
        // Login flow - first authenticate with password
        const { data, error } = await authHelpers.signIn(email, password);
        if (error) {
          setError(error.message);
        } else if (data.user) {
          onLogin(data.user);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerified = (user: any) => {
    setShowOTPVerification(false);
    setPendingEmail('');
    onLogin(user);
  };

  const handleOTPModalClose = () => {
    setShowOTPVerification(false);
    setPendingEmail('');
    setError('');
  };

  const toggleAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'signup' : 'login');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setError('');
  };

  return (
    <>
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-gray-900 to-purple-900/20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23374151%22 fill-opacity=%220.1%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 border border-cyan-500/30 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-16 h-16 border border-purple-500/30 rounded-full animate-bounce"></div>
        <div className="absolute top-1/2 left-20 w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
        <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-purple-400 rounded-full animate-ping delay-700"></div>

        {/* Auth Card */}
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-gray-900/80 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-8 shadow-2xl">
            {/* Logo and Title */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full mb-4 shadow-lg shadow-cyan-500/25">
                <Shield className="w-8 h-8 text-white animate-pulse" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">CyberShield</h1>
              <p className="text-gray-400">
                {authMode === 'login' ? 'Access your security dashboard' : 'Join the cyber defense network'}
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {authMode === 'signup' && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-cyan-400" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-colors"
                    required
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-cyan-400" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-colors"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-cyan-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {authMode === 'signup' && (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-cyan-400" />
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-colors"
                    required
                  />
                </div>
              )}

              {authMode === 'login' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    {authMode === 'login' ? 'Signing In...' : 'Creating Account...'}
                  </div>
                ) : (
                  authMode === 'login' ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>

            {/* Email Verification Notice for Signup */}
            {authMode === 'signup' && (
              <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                <p className="text-xs text-blue-400 text-center">
                  📧 You'll need to verify your email address before you can log in
                </p>
              </div>
            )}

            {/* Toggle Auth Mode */}
            <div className="mt-6 text-center">
              <p className="text-gray-400 mb-2">
                {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}
              </p>
              <button
                onClick={toggleAuthMode}
                className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
              >
                {authMode === 'login' ? 'Create Account' : 'Sign In'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />

      <OTPVerificationModal
        isOpen={showOTPVerification}
        email={pendingEmail}
        onVerified={handleOTPVerified}
        onClose={handleOTPModalClose}
      />
    </>
  );
};

export default AuthCard;