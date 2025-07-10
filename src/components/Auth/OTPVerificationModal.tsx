import React, { useState, useEffect } from 'react';
import { X, Mail, Shield, RefreshCw } from 'lucide-react';
import { authHelpers } from '../../lib/supabase';

interface OTPVerificationModalProps {
  isOpen: boolean;
  email: string;
  onVerified: (user: any) => void;
  onClose: () => void;
}

const OTPVerificationModal: React.FC<OTPVerificationModalProps> = ({
  isOpen,
  email,
  onVerified,
  onClose
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setOtp(['', '', '', '', '', '']);
      setError('');
      setTimeLeft(300);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await authHelpers.verifyLoginOTP(email, otpCode);
      
      if (error) {
        setError(error.message || 'Invalid verification code');
      } else if (data.user) {
        onVerified(data.user);
      } else {
        setError('Verification failed. Please try again.');
      }
    } catch (err) {
      setError('Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    setError('');

    try {
      const { error } = await authHelpers.sendOTPForVerification(email);
      
      if (error) {
        setError(error.message || 'Failed to resend code');
      } else {
        setTimeLeft(300); // Reset timer
        setOtp(['', '', '', '', '', '']);
        // Focus first input
        setTimeout(() => {
          const firstInput = document.getElementById('otp-0');
          firstInput?.focus();
        }, 100);
      }
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900/95 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Verify Your Email</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="flex items-center justify-center w-16 h-16 bg-cyan-500/10 rounded-full mb-4 mx-auto">
            <Shield className="w-8 h-8 text-cyan-400" />
          </div>
          <p className="text-gray-300 mb-2">
            We've sent a 6-digit verification code to
          </p>
          <p className="text-cyan-400 font-medium">{email}</p>
          <p className="text-xs text-gray-400 mt-2">
            Please enter the code below to complete your login
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Enter verification code
          </label>
          <div className="flex space-x-2 justify-center">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-xl font-bold bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-colors"
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-6 text-sm">
          <span className="text-gray-400">
            Code expires in: <span className="text-cyan-400 font-mono">{formatTime(timeLeft)}</span>
          </span>
          <button
            onClick={handleResendOTP}
            disabled={isResending || timeLeft > 240} // Allow resend after 1 minute
            className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
            <span>Resend code</span>
          </button>
        </div>

        <button
          onClick={handleVerifyOTP}
          disabled={isLoading || otp.join('').length !== 6}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
              Verifying...
            </div>
          ) : (
            'Verify Code'
          )}
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          Didn't receive the code? Check your spam folder or try resending.
        </p>
      </div>
    </div>
  );
};

export default OTPVerificationModal;