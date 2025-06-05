// frontend/apiSlice/activitiesApiSlice.ts
import { baseApiSlice } from './baseApiSlice';
import { ActivityLog } from './userApiSlice';
import { QueryParams } from './baseApiSlice';

// Define the response type for user activities
export interface UserActivitiesResponse {
  recentActivities: {
    total: number;
    activities: ActivityLog[];
  };
  olderActivities?: {
    total: number;
    activities: ActivityLog[];
  };
}

// Define parameters for the getUserActivities query
export interface UserActivitiesParams {
  userId: number | string;
  limit?: number;
  offset?: number;
}

export const activitiesApiSlice = baseApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRecentActivities: builder.query<ActivityLog[], QueryParams>({
      query: ({ limit = 50, offset = 0 }) => 
        `/activities?limit=${limit}&offset=${offset}`,
      providesTags: ['Activity'],
    }),
    
    // Updated getUsersActivities to match getRecentActivities output format
    getUsersActivities: builder.query<ActivityLog[], UserActivitiesParams>({
      query: ({ userId, limit = 20, offset = 0 }) => 
        `/activities/user/${userId}?limit=${limit}&offset=${offset}`,
      // Transform the response to match the ActivityLog[] format
      transformResponse: (response: UserActivitiesResponse) => {
        // If the response has the expected structure, return activities
        if (response.recentActivities && Array.isArray(response.recentActivities.activities)) {
          return response.recentActivities.activities;
        } 
        // Otherwise return an empty array
        return [];
      },
      providesTags: (result, error, { userId }) => [
        { type: 'Activity', id: `user-${userId}` }
      ],
    }),
  }),
});

export const {
  useGetRecentActivitiesQuery,
  useGetUsersActivitiesQuery,
} = activitiesApiSlice;