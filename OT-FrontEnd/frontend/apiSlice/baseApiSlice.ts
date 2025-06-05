// frontend/apiSlice/baseApiSlice.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const baseApiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
    credentials: 'include', // Important: includes cookies with every request
  }),
  tagTypes: ['User', 'Consultant', 'JobSeeker', 'Job', 'Activity'],
  endpoints: () => ({}),
});

// Add this type definition
export type QueryParams = {
  limit?: number;
  offset?: number;
};