"use client";

import React, { useState, useEffect } from 'react';
import { useGetJobByIdQuery } from '../../../apiSlice/jobsApiSlice';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../../components/navbar';
import { ProtectedRoute } from '../../../components/auth/ProtectedRoute';

// Fix the import path and add import for user data
import { useGetJobSeekersForConsultantQuery } from 'frontend/apiSlice/jobSeekersApiSlice';
import { useGetCurrentUserQuery } from 'frontend/apiSlice/userApiSlice';

export default function JobDetailsPage({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute>
      <JobDetailsContent params={params} />
    </ProtectedRoute>
  );
}

function JobDetailsContent({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  
  const { data: job, isLoading, isError, error } = useGetJobByIdQuery(id);
  
  // Get the current user (consultant)
  const { data: user } = useGetCurrentUserQuery();
  
  // Add state for jobseeker selection modal
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  
  // Only fetch job seekers when we have the consultant ID
  const { 
    data: jobseekerProfiles, 
    isLoading: profilesLoading, 
    isError: isProfilesError,
    error: profilesError 
  } = useGetJobSeekersForConsultantQuery(
    { consultantId: user?.id || '' },
    { skip: !user?.id }
  );
  
  // Debug log to check if data is being received
  useEffect(() => {
    console.log('Current user:', user);
    if (user) {
      console.log('Consultant ID:', user.id);
    }
    if (jobseekerProfiles) {
      console.log('Jobseeker profiles loaded:', jobseekerProfiles);
    }
    if (isProfilesError) {
      console.error('Error loading profiles:', profilesError);
    }
  }, [user, jobseekerProfiles, isProfilesError, profilesError]);
  
  // Format date to be more readable
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleBackClick = () => {
    router.back();
  };

  // Updated to open profile selector instead of directly sending email
  const handleApplyClick = () => {
    setShowProfileSelector(true);
  };

  // Handle email application with selected profile
  const handleApply = (profileId: string) => {
    if (job && job.email) {
      const selectedProfile = jobseekerProfiles?.find(profile => profile.id === profileId);
      
      if (!selectedProfile) {
        alert("Please select a profile to continue.");
        return;
      }

      const subject = `Application for ${job.title} position`;
      
      // Format skills as a bullet point list
      const skillsList = job.skills.map(skill => `• ${skill}`).join('\n');
      
      // Include selected profile information
      const body = `Dear Hiring Manager,

I am ${selectedProfile.name}, writing to express my interest in the ${job.title} position at ${job.company}.

${selectedProfile.bio || "[Include your introduction and qualifications here]"}

I have experience with the required skills for this role:
${skillsList}

Thank you for considering my application.

Sincerely,
${selectedProfile.name}`;
      
      window.location.href = `mailto:${job.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      // Close the modal after sending
      setShowProfileSelector(false);
    }
  };

  // Close the profile selector modal
  const handleCloseSelector = () => {
    setShowProfileSelector(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (isError || !job) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
          <div className="bg-white p-10 rounded-lg shadow-md text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Error</h1>
            <p className="text-gray-600">Failed to load job details</p>
            <p className="mt-2 text-sm text-gray-700">{error?.toString()}</p>
            <button 
              onClick={handleBackClick}
              className="mt-6 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
            >
              Go Back
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={handleBackClick}
            className="mb-6 flex items-center text-gray-700 hover:text-black"
          >
            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"></path>
            </svg>
            Back to Jobs
          </button>

          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="px-6 py-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
                  <p className="mt-2 text-xl text-gray-600">{job.company}</p>
                  <div className="mt-2 flex items-center text-gray-500">
                    <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                    </svg>
                    <span>{job.location}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold 
                  ${job.status === 'active' ? 'bg-gray-200 text-gray-900' : 'bg-gray-300 text-gray-800'}`}>
                  {job.status === 'active' ? 'Active' : 'Closed'}
                </span>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Job Details</h2>
                  <div className="mt-4 space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Type</h3>
                      <p className="mt-1 text-base text-gray-900">{job.type}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Salary</h3>
                      <p className="mt-1 text-base text-gray-900">${job.salary.toLocaleString()} per year</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Posted Date</h3>
                      <p className="mt-1 text-base text-gray-900">{formatDate(job.postedDate)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Application Deadline</h3>
                      <p className="mt-1 text-base text-gray-900">{formatDate(job.deadline)}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Required Skills</h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {job.skills.map((skill, index) => (
                      <span key={index} className="px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-800">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <h2 className="text-lg font-semibold text-gray-900">Job Description</h2>
                <div className="mt-4 prose prose-gray max-w-none">
                  <p className="text-base text-gray-700 whitespace-pre-line">{job.description}</p>
                </div>
              </div>

              {job.status === 'active' && (
                <div className="mt-10 pt-6 border-t border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Interested in this position?</h2>
                  <div className="mt-4">
                    <button 
                      onClick={handleApplyClick}
                      className="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                      Apply Now
                    </button>
                    <p className="mt-2 text-sm text-gray-500">
                      send an application to {job.email || "the employer"}.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile selection modal with improved error handling */}
      {showProfileSelector && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Select a profile to apply with</h3>
              <button onClick={handleCloseSelector} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            {!user ? (
              <div className="py-4 text-center text-gray-500">
                Loading user information...
              </div>
            ) : !user.id ? (
              <div className="py-4 text-center text-gray-500">
                Unable to retrieve your consultant ID. Please ensure you're logged in.
              </div>
            ) : profilesLoading ? (
              <div className="py-4 text-center">Loading profiles...</div>
            ) : isProfilesError ? (
              <div className="py-4 text-center text-red-500">
                <p>Error loading profiles.</p>
                <p className="text-sm mt-2">{profilesError?.toString()}</p>
              </div>
            ) : !jobseekerProfiles ? (
              <div className="py-4 text-center text-gray-500">
                No profiles data available. Please try again.
              </div>
            ) : jobseekerProfiles.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {jobseekerProfiles.map((profile) => (
                  <div 
                    key={profile.id} 
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleApply(profile.id)}
                  >
                    <div className="font-medium">{profile.name}</div>
                    <div className="text-sm text-gray-500 truncate">{profile.email}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-gray-500">
                <p>No jobseeker profiles found.</p>
                <p className="text-sm mt-2">Please add a jobseeker profile first or check your consultant permissions.</p>
              </div>
            )}
            
            {/* Debug info in development mode */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                <p>Debug Info:</p>
                <p>User ID: {user?.id || 'Not available'}</p>
                <p>Loading: {profilesLoading ? 'true' : 'false'}</p>
                <p>Error: {isProfilesError ? 'true' : 'false'}</p>
                <p>Profiles: {jobseekerProfiles ? `${jobseekerProfiles.length} found` : 'null'}</p>
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleCloseSelector}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-md mr-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}