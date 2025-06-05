// This service manages email verification state

import crypto from 'crypto';

// Type definitions
type VerificationRecord = {
  email: string;
  verifiedAt: Date;
};

// In-memory store for verified emails
// In production, you would store this in a database
const verifiedEmails = new Map<string, VerificationRecord>();

// OTP store
type OtpRecord = {
  otp: string;
  expires: Date;
};

const otpStore = new Map<string, OtpRecord>();

/**
 * Generate a new OTP for an email
 */
export function generateOTP(email: string): string {
  // Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Set expiration (60 seconds from now)
  const expires = new Date();
  expires.setSeconds(expires.getSeconds() + 60);
  
  // Store OTP
  otpStore.set(email, { otp, expires });
  
  return otp;
}

/**
 * Verify an OTP for an email
 */
export function verifyOTP(email: string, inputOtp: string): boolean {
  const record = otpStore.get(email);
  
  // No record found
  if (!record) {
    return false;
  }
  
  // OTP expired
  if (new Date() > record.expires) {
    otpStore.delete(email);
    return false;
  }
  
  // OTP doesn't match
  if (record.otp !== inputOtp) {
    return false;
  }
  
  // OTP is valid - mark email as verified
  markEmailAsVerified(email);
  
  // Clean up OTP
  otpStore.delete(email);
  
  return true;
}

/**
 * Mark an email as verified
 */
export function markEmailAsVerified(email: string): void {
  verifiedEmails.set(email, {
    email,
    verifiedAt: new Date(),
  });
  
  // In production, you'd persist this to a database
}

/**
 * Check if an email has been verified
 */
export function isEmailVerified(email: string): boolean {
  return verifiedEmails.has(email);
}

/**
 * Clear verification status after a certain time
 * (e.g., if user doesn't complete registration)
 */
export function clearVerification(email: string): void {
  verifiedEmails.delete(email);
}

// Setup cleanup of old verifications
// In production, you might handle this differently
setInterval(() => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  // Clean up OTP store
  otpStore.forEach((record, email) => {
    if (record.expires < now) {
      otpStore.delete(email);
    }
  });
  
  // Clean up verified emails older than 1 hour that haven't completed registration
  verifiedEmails.forEach((record, email) => {
    if (record.verifiedAt < oneHourAgo) {
      verifiedEmails.delete(email);
    }
  });
}, 5 * 60 * 1000); // Run every 5 minutes
