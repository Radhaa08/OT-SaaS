import { baseApiSlice } from './baseApiSlice';

// Define types
export interface GenericEmailRequest {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface JobSeekerEmailRequest {
  to: string;
  subject: string;
  jobSeekerName: string;
  jobSeekerSkills: string[];
  contactEmail: string;
  additionalDetails?: string;
}

export interface JobOpportunityEmailRequest {
  to: string;
  subject: string;
  jobTitle: string;
  company: string;
  location: string;
  description: string;
  contactEmail: string;
}

export interface SupportEmailRequest {
  to: string;
  subject: string;
  html: string;
  cc?: string | string[];
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  issueType: string;
  priority: string;
  message: string;
}

export interface EmailResponse {
  success: boolean;
  message: string;
}

export interface SupportEmailResponse extends EmailResponse {
  ticketId?: string;
}

// Create the API slice
export const emailApiSlice = baseApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Send a generic email
    sendEmail: builder.mutation<EmailResponse, GenericEmailRequest>({
      query: (data) => ({
        url: '/emails/send',
        method: 'POST',
        body: data,
      }),
    }),
    
    // Send a job seeker email
    sendJobSeekerEmail: builder.mutation<EmailResponse, JobSeekerEmailRequest>({
      query: (data) => ({
        url: '/emails/job-seeker',
        method: 'POST',
        body: data,
      }),
    }),
    
    // Send a job opportunity email
    sendJobOpportunityEmail: builder.mutation<EmailResponse, JobOpportunityEmailRequest>({
      query: (data) => ({
        url: '/emails/job-opportunity',
        method: 'POST',
        body: data,
      }),
    }),
    
    // Verify email service
    verifyEmailService: builder.query<EmailResponse, void>({
      query: () => '/emails/verify',
    }),

    // Test email - temporary route for testing
    sendTestEmail: builder.mutation<EmailResponse, GenericEmailRequest>({
      query: (data) => ({
        url: '/emails/test-send',
        method: 'POST',
        body: data,
      }),
    }),

    // Send a support request email
    sendSupportEmail: builder.mutation<SupportEmailResponse, SupportEmailRequest>({
      query: (data) => ({
        url: '/emails/support',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

// Export hooks
export const {
  useSendEmailMutation,
  useSendJobSeekerEmailMutation,
  useSendJobOpportunityEmailMutation,
  useVerifyEmailServiceQuery,
  useSendTestEmailMutation,
  useSendSupportEmailMutation,
} = emailApiSlice;