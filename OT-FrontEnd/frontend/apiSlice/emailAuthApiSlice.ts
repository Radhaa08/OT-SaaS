import { baseApiSlice } from './baseApiSlice';

// Define types
export interface SendOtpRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface SendWelcomeEmailRequest {
  email: string;
  name?: string;
}

export interface EmailResponse {
  success: boolean;
  message: string;
}

// Create the API slice
export const emailAuthApiSlice = baseApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Send verification OTP email
    sendVerificationOtp: builder.mutation<EmailResponse, SendOtpRequest>({
      query: (data) => ({
        url: '/email-auth/send-otp',
        method: 'POST',
        body: data,
      }),
    }),
    
    // Verify OTP code
    verifyOtp: builder.mutation<EmailResponse, VerifyOtpRequest>({
      query: (data) => ({
        url: '/email-auth/verify-otp',
        method: 'POST',
        body: data,
      }),
    }),
    
    // Send welcome email after successful registration
    sendWelcomeEmail: builder.mutation<EmailResponse, SendWelcomeEmailRequest>({
      query: (data) => ({
        url: '/email-auth/welcome',
        method: 'POST',
        body: data,
      }),
    }),
    
    // Request password reset
    requestPasswordReset: builder.mutation<EmailResponse, SendOtpRequest>({
      query: (data) => ({
        url: '/email-auth/request-reset',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

// Export hooks
export const {
  useSendVerificationOtpMutation,
  useVerifyOtpMutation,
  useSendWelcomeEmailMutation,
  useRequestPasswordResetMutation,
} = emailAuthApiSlice;