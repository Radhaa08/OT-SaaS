import { baseApiSlice } from './baseApiSlice';

// Type for checkout request data
export type CheckoutRequestData = {
  priceId: string; // 'monthly' or 'yearly'
  userId: number;
  email: string;
  name?: string | null;
  phone?: string | null;
};

// Type for checkout session response
export type CheckoutSessionResponse = {
  id: string; // The Stripe checkout session ID
};

// Type for payment status request
export type PaymentStatusResponse = {
  id: string;
  status: 'paid' | 'unpaid' | 'no_payment_required';
  customer: {
    email: string;
    name?: string;
  };
  amountTotal: number;
  currency: string;
  metadata: {
    userId: string;
    planType: string;
  };
};

// Type for updating session ID
export type SessionUpdateRequest = {
  userId: number;
  sessionId: string;
};

export type SessionUpdateResponse = {
  success: boolean;
  message: string;
};

// Type for payment check request
export type PaymentCheckRequest = {
  userId: number;
};

// Type for payment check response
export type PaymentCheckResponse = {
  success: boolean;
  isPaid: boolean;
  expiryDate?: string | null;
  paymentStatus?: string;
  message: string;
};

export const stripeApiSlice = baseApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Create checkout session
    createCheckoutSession: builder.mutation<CheckoutSessionResponse, CheckoutRequestData>({
      query: (checkoutData) => ({
        url: '/checkout',
        method: 'POST',
        body: checkoutData,
      }),
    }),

    // Check payment status
    getPaymentStatus: builder.query<PaymentStatusResponse, string>({
      query: (sessionId) => `/checkout/status/${sessionId}`,
      // Only refresh every 10 seconds to avoid excessive API calls
      keepUnusedDataFor: 10,
    }),

    // Update session ID in user database
    updateSessionId: builder.mutation<SessionUpdateResponse, SessionUpdateRequest>({
      query: (sessionData) => ({
        url: '/checkout/session-update',
        method: 'POST',
        body: sessionData,
      }),
      invalidatesTags: (result, error, arg) => [{ type: 'User', id: arg.userId }],
    }),

    // Check payment status and update user if needed
    checkPaymentStatus: builder.mutation<PaymentCheckResponse, PaymentCheckRequest>({
      query: (userData) => ({
        url: '/checkout/check-payment',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: (result, error, arg) => [{ type: 'User', id: arg.userId }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useCreateCheckoutSessionMutation,
  useGetPaymentStatusQuery,
  useUpdateSessionIdMutation,
  useCheckPaymentStatusMutation,
} = stripeApiSlice;
