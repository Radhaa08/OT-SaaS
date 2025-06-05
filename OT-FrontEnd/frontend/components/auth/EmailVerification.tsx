'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { useSendVerificationOtpMutation, useVerifyOtpMutation } from '../../apiSlice/emailAuthApiSlice';
import { Alert, AlertDescription } from '../ui/alert';

interface EmailVerificationProps {
  email: string;
  onVerified: () => void;
  onCancel: () => void;
  autoSendOtp?: boolean; // Add this prop to control automatic OTP sending
}

export default function EmailVerification({ 
  email, 
  onVerified, 
  onCancel, 
  autoSendOtp = true // Default to true for backward compatibility
}: EmailVerificationProps) {
  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds timeout
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  
  // Use a ref to track if component is mounted and prevent multiple sends
  const mounted = useRef(false);
  const otpRequestSent = useRef(false);
  
  // API hooks
  const [sendOtp, { isLoading: isSendingOtp }] = useSendVerificationOtpMutation();
  const [verifyOtp, { isLoading: isVerifyingOtp }] = useVerifyOtpMutation();
  
  // Timer for OTP expiration
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);
  
  // Send OTP when component mounts - but only once
  useEffect(() => {
    // Set mounted flag
    mounted.current = true;
    
    // Only send OTP if not already sent
    if (autoSendOtp && !otpRequestSent.current) {
      sendOtpToEmail();
      otpRequestSent.current = true;
    }
    
    // Cleanup on unmount
    return () => {
      mounted.current = false;
    };
  }, []);
  
  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Send OTP to email
  const sendOtpToEmail = async () => {
    if (isSendingOtp) return; // Prevent multiple simultaneous requests
    
    try {
      setError(null);
      await sendOtp({ email }).unwrap();
      
      // Only update state if component is still mounted
      if (mounted.current) {
        setTimeLeft(60); // Reset timer to 60 seconds
      }
    } catch (err: any) {
      // Only update state if component is still mounted
      if (mounted.current) {
        setError(err.data?.message || 'Failed to send verification code');
      }
    }
  };
  
  // Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6 || isVerifyingOtp) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    
    try {
      setError(null);
      const response = await verifyOtp({ email, otp }).unwrap();
      
      // Only proceed if still mounted
      if (!mounted.current) return;
      
      if (response.success) {
        setIsVerified(true);
        // No need for setTimeout, just call the callback directly
        onVerified();
      } else {
        setError('Invalid verification code');
      }
    } catch (err: any) {
      // Only update state if component is still mounted
      if (mounted.current) {
        setError(err.data?.message || 'Invalid verification code');
      }
    }
  };

  // Handle input keypress
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && otp.length === 6 && !isVerifyingOtp && !isVerified) {
      e.preventDefault(); // Prevent form submission
      handleVerifyOtp();
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-medium mb-2">Verify Your Email</h3>
        <p className="text-sm text-gray-500">
          We've sent a 6-digit verification code to <strong>{email}</strong>
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Verification Code</label>
            <span className="text-xs text-gray-500">
              {timeLeft > 0 ? `Expires in ${formatTime(timeLeft)}` : 'Code expired'}
            </span>
          </div>
          <Input
            maxLength={6}
            placeholder="Enter 6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
            onKeyDown={handleKeyPress}
            className="text-center text-lg py-5 letter-spacing-1"
            disabled={isVerified}
            autoFocus
          />
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleVerifyOtp}
            disabled={!otp || otp.length !== 6 || isVerifyingOtp || isVerified || timeLeft <= 0}
            className="w-full"
          >
            {isVerifyingOtp ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : isVerified ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Verified
              </>
            ) : (
              "Verify Email"
            )}
          </Button>
          
          <div className="flex justify-between text-sm mt-2">
            <button
              type="button"
              onClick={() => {
                if (timeLeft <= 0 && !isSendingOtp && !isVerified) {
                  sendOtpToEmail();
                }
              }}
              disabled={timeLeft > 0 || isSendingOtp || isVerified}
              className="text-blue-600 hover:text-blue-800 font-medium disabled:text-gray-400"
            >
              {isSendingOtp ? 'Sending...' : 'Resend Code'}
            </button>
            
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}