import { baseApiSlice } from './baseApiSlice';

// User type - consolidated since all regular users are consultants (members)
export type User = {
  id: number;
  name: string | null;
  email: string;
  role: 'admin' | 'member'; // Only two roles: admin or member
  isPaid: boolean;
  expiryDate?: string | null; // Added expiryDate field
  phone?: string | null;
  avatar?: string | null;
  bio?: string | null;
  company?: string | null;
  position?: string | null;
  location?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

// Simplified user type for listings
export type UserListing = {
  id: number;
  name: string | null;
  email: string;
  role: 'admin' | 'member';
  isPaid: boolean;
  expiryDate?: string | null; // Added expiryDate field
};

// Consultant type - just an alias for User with 'member' role
export type Consultant = User;

export type LoginCredentials = {
  email: string;
  password: string;
};

// Updated RegisterData - removed isConsultant since all users are members by default
export type RegisterData = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  bio?: string;
  company?: string;
  position?: string;
  location?: string;
};

export type PasswordChangeData = {
  currentPassword: string;
  newPassword: string;
};

export type UserUpdateData = {
  name?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  company?: string;
  position?: string;
  location?: string;
};

// Type for activity logs
export type ActivityLog = {
  id: string;
  consultantId: number;
  entityType: string;
  entityId: string;
  action: string;
  details?: string;
  ipAddress?: string;
  timestamp: string;
};

// Type for payment status update
export type PaymentStatusUpdate = {
  isPaid: boolean;
  expiryDate?: string | null;
};

export const usersApiSlice = baseApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Authentication endpoints
    login: builder.mutation<User, LoginCredentials>({
      query: (credentials) => ({
        url: '/users/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),
    
    register: builder.mutation<User, RegisterData>({
      query: (data) => ({
        url: '/users/register',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    
    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/users/logout',
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),
    
    // User profile endpoints
    getCurrentUser: builder.query<User, void>({
      query: () => '/users/me',
      providesTags: ['User'],
    }),
    
    updateUser: builder.mutation<User, UserUpdateData>({
      query: (data) => ({
        url: '/users/me',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    
    changePassword: builder.mutation<{ message: string }, PasswordChangeData>({
      query: (data) => ({
        url: '/users/change-password',
        method: 'POST',
        body: data,
      }),
    }),
    
    deleteAccount: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/users/me',
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
    
    // Consultant endpoints (these fetch users with 'member' role)
    getAllConsultants: builder.query<Consultant[], { limit?: number; offset?: number }>({
      query: ({ limit = 50, offset = 0 }) => 
        `/users/consultants?limit=${limit}&offset=${offset}`,
      providesTags: ['Consultant'],
    }),
    
    getConsultantById: builder.query<Consultant, number>({
      query: (id) => `/users/consultants/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Consultant', id }],
    }),
    
    // Activity logs endpoint
    getUserActivities: builder.query<ActivityLog[], { userId: number; limit?: number; offset?: number }>({
      query: ({ userId, limit = 50, offset = 0 }) => 
        `/users/${userId}/activities?limit=${limit}&offset=${offset}`,
      providesTags: (_result, _error, { userId }) => [{ type: 'Activity', id: userId }],
    }),
    
    // Admin endpoints
    getAllUsers: builder.query<UserListing[], { limit?: number; offset?: number }>({
      query: ({ limit = 50, offset = 0 }) => 
        `/users?limit=${limit}&offset=${offset}`,
      providesTags: ['User'], 
    }),
    
    updatePaymentStatus: builder.mutation<User, { userId: number; status: PaymentStatusUpdate }>({
      query: ({ userId, status }) => ({
        url: `/users/payment-status/${userId}`,
        method: 'PATCH',
        body: status,
      }),
      invalidatesTags: (_result, _error, { userId }) => [
        { type: 'User', id: userId },
        'User',
        'Consultant'
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  // Authentication hooks
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  
  // User profile hooks
  useGetCurrentUserQuery,
  useUpdateUserMutation,
  useChangePasswordMutation,
  useDeleteAccountMutation,
  
  // Consultant hooks
  useGetAllConsultantsQuery,
  useGetConsultantByIdQuery,
  
  // Activity logs hook
  useGetUserActivitiesQuery,
  
  // Admin hooks
  useGetAllUsersQuery,
  useUpdatePaymentStatusMutation,
} = usersApiSlice;