// frontend/apiSlice/jobSeekersApiSlice.ts
import { baseApiSlice, QueryParams  } from './baseApiSlice';
import { ActivityLog} from './userApiSlice';

export type JobSeeker = {
  id: string;
  consultantId: string;
  name: string;
  email: string;
  phone: string;
  resume: string;
  skills: string[];
  experience: number;
  education: string;
  location: string;
  about: string;
  addedDate: string;
};

export type JobSeekerCreateData = Omit<JobSeeker, 'id' | 'addedDate'>;

export type JobSeekerUpdateData = Partial<Omit<JobSeekerCreateData, 'consultantId'>>;

export type JobSeekerSearchParams = {
  skills?: string[];
  location?: string;
  experience?: number;
  limit?: number;
  offset?: number;
};

export const jobSeekersApiSlice = baseApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getJobSeekersForConsultant: builder.query<JobSeeker[], { consultantId: string; queryParams?: QueryParams }>({
      query: ({ consultantId, queryParams = { limit: 50, offset: 0 } }) => {
        return `/job-seekers/consultant/${consultantId}?limit=${queryParams.limit}&offset=${queryParams.offset}`;
      },
      providesTags: ['JobSeeker'],
    }),
    
    getJobSeekerById: builder.query<JobSeeker, string>({
      query: (id) => `/job-seekers/${id}`,
      providesTags: (result, error, id) => [{ type: 'JobSeeker', id }],
    }),
    
    createJobSeeker: builder.mutation<JobSeeker, JobSeekerCreateData>({
      query: (data) => ({
        url: '/job-seekers',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['JobSeeker'],
    }),
    
    updateJobSeeker: builder.mutation<JobSeeker, { id: string; data: JobSeekerUpdateData }>({
      query: ({ id, data }) => ({
        url: `/job-seekers/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'JobSeeker', id }],
    }),
    
    deleteJobSeeker: builder.mutation<void, string>({
      query: (id) => ({
        url: `/job-seekers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['JobSeeker'],
    }),
    
    searchJobSeekers: builder.query<JobSeeker[], JobSeekerSearchParams>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        
        if (params.skills && params.skills.length > 0) {
          params.skills.forEach(skill => queryParams.append('skills', skill));
        }
        
        if (params.location) queryParams.append('location', params.location);
        if (params.experience !== undefined) queryParams.append('experience', params.experience.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.offset) queryParams.append('offset', params.offset.toString());
        
        return `/job-seekers/search?${queryParams.toString()}`;
      },
      providesTags: ['JobSeeker'],
    }),
    
    getJobSeekerActivities: builder.query<ActivityLog[], { jobSeekerId: string; queryParams?: QueryParams }>({
      query: ({ jobSeekerId, queryParams = { limit: 50, offset: 0 } }) => 
        `/job-seekers/${jobSeekerId}/activities?limit=${queryParams.limit}&offset=${queryParams.offset}`,
      providesTags: (result, error, { jobSeekerId }) => [
        { type: 'Activity', id: `jobseeker-${jobSeekerId}` }
      ],
    }),
  }),
});

export const {
  useGetJobSeekersForConsultantQuery,
  useGetJobSeekerByIdQuery,
  useCreateJobSeekerMutation,
  useUpdateJobSeekerMutation,
  useDeleteJobSeekerMutation,
  useSearchJobSeekersQuery,
  useGetJobSeekerActivitiesQuery,
} = jobSeekersApiSlice;

// Check this file to ensure the endpoint is correctly configured:
// 
// It should look something like:
//
// export const jobSeekersApi = createApi({
//   reducerPath: 'jobSeekersApi',
//   baseQuery: fetchBaseQuery({ baseUrl: '/api', credentials: 'include' }),
//   endpoints: (builder) => ({
//     getJobSeekersForConsultant: builder.query<JobSeeker[], void>({
//       query: () => '/consultants/jobseekers',
//     }),
//     // other endpoints...
//   }),
// });
// 
// export const { useGetJobSeekersForConsultantQuery } = jobSeekersApi;