// frontend/apiSlice/jobsApiSlice.ts
import { baseApiSlice, QueryParams } from './baseApiSlice';
import { ActivityLog } from './userApiSlice';

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  skills: string[];
  salary: number;
  type: string;
  postedDate: string;
  deadline: string;
  status: 'active' | 'closed';
};

export type JobCreateData = {
  title: string;
  company: string;
  location: string;
  description: string;
  skills: string[];
  salary: number;
  type: string;
  deadline: string | Date;
  consultantId?: string; // Optional - if posted by a consultant
};

export type JobUpdateData = Partial<Omit<JobCreateData, 'consultantId'>> & {
  status?: 'active' | 'closed';
};

export type JobSearchParams = {
  title?: string;
  company?: string;
  location?: string;
  skills?: string[];
  type?: string;
  limit?: number;
  offset?: number;
};

export const jobsApiSlice = baseApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllJobs: builder.query<Job[], QueryParams>({
      query: ({ limit = 50, offset = 0 }) => 
        `/jobs/all?limit=${limit}&offset=${offset}`,
      providesTags: ['Job'],
    }),

    getAllActiveJobs: builder.query<Job[], QueryParams>({
      query: ({ limit = 50, offset = 0 }) => 
        `/jobs?limit=${limit}&offset=${offset}`,
      providesTags: ['Job'],
    }),
    
    getJobById: builder.query<Job, string>({
      query: (id) => `/jobs/${id}`,
      providesTags: (result, error, id) => [{ type: 'Job', id }],
    }),
    
    createJob: builder.mutation<Job, JobCreateData>({
      query: (data) => ({
        url: '/jobs',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Job'],
    }),
    
    updateJob: builder.mutation<Job, { id: string; data: JobUpdateData }>({
      query: ({ id, data }) => ({
        url: `/jobs/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Job', id }],
    }),
    
    closeJob: builder.mutation<Job, { id: string; consultantId?: string }>({
      query: ({ id, consultantId }) => ({
        url: `/jobs/${id}/close`,
        method: 'POST',
        body: consultantId ? { consultantId } : {},
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Job', id }],
    }),
    
    searchJobs: builder.query<Job[], JobSearchParams>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        
        if (params.title) queryParams.append('title', params.title);
        if (params.company) queryParams.append('company', params.company);
        if (params.location) queryParams.append('location', params.location);
        if (params.type) queryParams.append('type', params.type);
        
        if (params.skills && params.skills.length > 0) {
          params.skills.forEach(skill => queryParams.append('skills', skill));
        }
        
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.offset) queryParams.append('offset', params.offset.toString());
        
        return `/jobs/search?${queryParams.toString()}`;
      },
      providesTags: ['Job'],
    }),
    
    getJobActivities: builder.query<ActivityLog[], { jobId: string; queryParams?: QueryParams }>({
      query: ({ jobId, queryParams = { limit: 50, offset: 0 } }) => 
        `/jobs/${jobId}/activities?limit=${queryParams.limit}&offset=${queryParams.offset}`,
      providesTags: (result, error, { jobId }) => [
        { type: 'Activity', id: `job-${jobId}` }
      ],
    }),
  }),
});

export const {
  useGetAllJobsQuery,
  useGetAllActiveJobsQuery,
  useGetJobByIdQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useCloseJobMutation,
  useSearchJobsQuery,
  useGetJobActivitiesQuery,
} = jobsApiSlice;