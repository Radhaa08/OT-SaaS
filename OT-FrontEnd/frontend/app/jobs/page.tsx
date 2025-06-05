"use client";

import React, { useState, useEffect } from 'react';
import { useGetAllActiveJobsQuery, Job } from '../../apiSlice/jobsApiSlice';
import { useGetJobSeekersForConsultantQuery } from '../../apiSlice/jobSeekersApiSlice';
import { JobSeeker } from '../../apiSlice/jobSeekersApiSlice';
import { useRouter, useSearchParams } from 'next/navigation';
import {useUser} from '../../components/auth/UserProvider';
import Link from 'next/link';
import { Navbar } from '../../components/navbar';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';

export default function JobsPage() {
  return (
    <ProtectedRoute>
      <JobsContent />
    </ProtectedRoute>
  );
}

function JobsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedJobSeekers, setSelectedJobSeekers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredJobs, setFilteredJobs] = useState<Job[] | null>(null);
  const [activeTab, setActiveTab] = useState<'text' | 'jobseekers'>('text');
  const { user } = useUser();
  
  console.log(user)
  const consultantId = user?.id;

  // Function to navigate back to home page
  const goToHomePage = () => {
    router.push('/');
  };
  
  // Fetch job seekers for this consultant
  const { 
    data: jobSeekers, 
    isLoading: isLoadingJobSeekers,
    isError: isJobSeekersError,
    error: jobSeekersError
  } = useGetJobSeekersForConsultantQuery(
    { consultantId: consultantId ? String(consultantId) : '' }, 
    { skip: !consultantId }
  );
  
  // Use getAllActiveJobs to get all jobs
  const {
    data: jobs,
    isLoading: isLoadingJobs,
    isError,
    error
  } = useGetAllActiveJobsQuery({
    limit: pageSize * 10, // Fetch more to allow client-side filtering
    offset: 0
  });

  // Set active tab and preselect job seeker if jobSeekerId is in URL
  useEffect(() => {
    const jobSeekerId = searchParams?.get('jobSeekerId');
    
    if (jobSeekerId) {
      setSelectedJobSeekers(prev => 
        prev.includes(jobSeekerId) ? prev : [...prev, jobSeekerId]
      );
      setActiveTab('jobseekers');
    }
    
  }, [searchParams, jobSeekers]);

  // This effect collects skills from selected job seekers
  useEffect(() => {
    if (!jobSeekers) return;
    
    const skills: string[] = [];
    
    selectedJobSeekers.forEach(id => {
      const jobSeeker = jobSeekers.find(js => js.id === id);
      if (jobSeeker) {
        jobSeeker.skills.forEach(skill => {
          if (!skills.includes(skill)) {
            skills.push(skill);
          }
        });
      }
    });
    
    setSelectedSkills(skills);
  }, [selectedJobSeekers, jobSeekers]);
  
  // This effect handles client-side filtering based on skills and search term
  useEffect(() => {
    if (!jobs) return;
    
    let filtered = [...jobs];
    
    // Filter by search term
    if (searchTerm.trim() !== '') {
      // Split search terms by commas and trim whitespace
      const terms = searchTerm.toLowerCase().split(',').map(term => term.trim()).filter(term => term);
      
      if (terms.length > 0) {
        filtered = filtered.filter(job => 
          // Check if ANY of the terms match the job
          terms.some(term => 
            job.title.toLowerCase().includes(term) || 
            job.company.toLowerCase().includes(term) ||
            job.description.toLowerCase().includes(term) ||
            // Also search in skills
            job.skills.some(skill => skill.toLowerCase().includes(term))
          )
        );
      }
    }
    
    // Filter by skills from selected job seekers (unchanged)
    if (selectedSkills.length > 0) {
      filtered = filtered.filter(job => 
        job.skills.some(skill => selectedSkills.includes(skill))
      );
    }
    
    setFilteredJobs(filtered);
  }, [jobs, selectedSkills, searchTerm]);

  // Get the paginated subset for display
  const getPaginatedJobs = () => {
    if (!filteredJobs && !jobs) return [];
    const jobsToPage = filteredJobs || jobs || [];
    return jobsToPage.slice(page * pageSize, (page + 1) * pageSize);
  };

  const displayedJobs = getPaginatedJobs();
  const totalFilteredCount = filteredJobs ? filteredJobs.length : jobs?.length || 0;
  const totalPages = Math.ceil(totalFilteredCount / pageSize);

  const handleNextPage = () => {
    if (page < totalPages - 1) {
      setPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 0) {
      setPage(prev => prev - 1);
    }
  };
  
  const handleJobSeekerSelect = (id: string) => {
    setSelectedJobSeekers(prev => 
      prev.includes(id)
        ? prev.filter(jsId => jsId !== id)
        : [...prev, id]
    );
    setPage(0); // Reset to first page when selection changes
  };
  
  const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(0); // Reset to first page when search changes
  };
  
  const clearFilters = () => {
    setSelectedJobSeekers([]);
    setSelectedSkills([]);
    setSearchTerm('');
    setFilteredJobs(null);
    setPage(0);
  };

  const isLoading = isLoadingJobs || isLoadingJobSeekers || consultantId === null;

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center min-h-screen bg-background">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </>
    );
  }

  if (isError || isJobSeekersError) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center min-h-screen bg-background">
          <div className="bg-card p-10 rounded-lg shadow-md text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">Error</h1>
            <p className="text-muted-foreground">
              {isJobSeekersError 
                ? "Failed to load job seekers data" 
                : "Failed to load jobs data"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {isJobSeekersError 
                ? jobSeekersError?.toString() 
                : error?.toString()}
            </p>
            {!consultantId && (
              <p className="mt-4 text-sm text-destructive">
                Consultant ID not found. Please make sure you are logged in.
              </p>
            )}
            <button
              onClick={goToHomePage}
              className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none"
            >
              Return to Home
            </button>
          </div>
        </div>
      </>
    );
  }

  // Debug output to help troubleshoot job seekers data
  console.log('Consultant ID:', consultantId);
  // console.log('Job Seekers:', jobSeekers);
  console.log("hi");
  // console.log('Active Tab:', activeTab); // Should be 'jobseekers' to see the job seekers section
  // console.log('Consultant ID:', consultantId);
  // console.log('Job Seekers Data:', jobSeekers);
  // console.log('Loading State:', isLoadingJobSeekers);
  // console.log('Error State:', isJobSeekersError);
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-foreground">Available Jobs</h1>
          </div>
          
          {/* Search and filter section */}
          <div className="bg-card p-6 rounded-lg shadow-md mb-8 border border-border">
            <h2 className="text-lg font-medium text-foreground mb-4">Filter Jobs</h2>
            
            {/* Search tabs */}
            <div className="border-b border-border mb-6">
              <div className="flex -mb-px space-x-6">
                <button
                  onClick={() => setActiveTab('text')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                    activeTab === 'text' 
                      ? 'border-primary text-foreground' 
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
                >
                  Text Search
                </button>
                <button
                  onClick={() => setActiveTab('jobseekers')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                    activeTab === 'jobseekers' 
                      ? 'border-primary text-foreground' 
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
                >
                  Filter by Job Seekers
                </button>
              </div>
            </div>
            
            {/* Text search tab content */}
            {activeTab === 'text' && (
              <div className="mb-4">
                <label htmlFor="searchTerm" className="block text-sm font-medium text-foreground mb-1">
                  Search by title, company, description or skills
                </label>
                <input
                  type="text"
                  id="searchTerm"
                  value={searchTerm}
                  onChange={handleSearchTermChange}
                  placeholder="Search jobs... (use commas for multiple terms)"
                  className="w-full p-2 border border-border rounded-md bg-background text-foreground focus:ring-primary focus:border-primary"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Tip: Enter multiple search terms separated by commas (e.g., "javascript, remote, senior")
                </p>
              </div>
            )}
            
            {/* Job seekers tab content */}
            {activeTab === 'jobseekers' && (
              <div className="mb-4">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-foreground mb-3">
                    Select job seekers to find matching jobs based on their skills
                  </h3>
                  
                  {!jobSeekers || jobSeekers.length === 0 ? (
                    <div className="p-6 border border-border rounded-lg text-center">
                      <p className="text-muted-foreground italic mb-2">No job seekers available for your account.</p>
                      <Link 
                        href="/job-seekers/add" 
                        className="text-foreground underline hover:text-primary"
                      >
                        Add a job seeker to get started
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {jobSeekers.map(seeker => (
                        <div 
                          key={seeker.id} 
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedJobSeekers.includes(seeker.id)
                              ? 'border-primary bg-accent'
                              : 'border-border hover:border-primary'
                          }`}
                          onClick={(e) => {
                            // Only toggle if the click wasn't on the checkbox or its label
                            if (e.target === e.currentTarget || 
                                !['INPUT', 'LABEL'].includes((e.target as HTMLElement).tagName)) {
                              handleJobSeekerSelect(seeker.id);
                            }
                          }}
                        >
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`seeker-${seeker.id}`}
                              checked={selectedJobSeekers.includes(seeker.id)}
                              onChange={(e) => {
                                e.stopPropagation(); // Stop event from bubbling up
                                handleJobSeekerSelect(seeker.id);
                              }}
                              className="h-4 w-4 text-primary focus:ring-primary rounded"
                            />
                            <label htmlFor={`seeker-${seeker.id}`} className="ml-2 font-medium text-foreground">
                              {seeker.name}
                            </label>
                          </div>
                          
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground">Skills:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {seeker.skills.slice(0, 3).map((skill, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-muted text-foreground text-xs rounded-full">
                                  {skill}
                                </span>
                              ))}
                              {seeker.skills.length > 3 && (
                                <span className="px-2 py-0.5 bg-muted text-foreground text-xs rounded-full">
                                  +{seeker.skills.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Selected skills display (common to both tabs) */}
            {selectedSkills.length > 0 && (
              <div className="mb-6 p-4 bg-muted border border-border rounded-lg">
                <h3 className="text-sm font-medium text-foreground mb-2">Filtering by skills:</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.map((skill, idx) => (
                    <span key={idx} className="px-3 py-1 bg-accent text-foreground text-xs rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Filter actions */}
            {(selectedJobSeekers.length > 0 || searchTerm.trim() !== '') && (
              <div className="flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
          
          {/* Job results statistics */}
          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-muted-foreground">
              {totalFilteredCount > 0 
                ? `Showing ${Math.min(page * pageSize + 1, totalFilteredCount)} - ${Math.min((page + 1) * pageSize, totalFilteredCount)} of ${totalFilteredCount} jobs`
                : 'No jobs found'
              } 
            </p>
            {selectedSkills.length > 0 && (
              <p className="text-sm text-foreground">
                <span className="font-medium">{totalFilteredCount}</span> jobs match selected skills
              </p>
            )}
          </div>
          
          {/* Jobs listing */}
          {!displayedJobs || displayedJobs.length === 0 ? (
            <div className="bg-card shadow rounded-lg p-10 text-center border border-border">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-xl font-medium text-foreground mt-4">No matching jobs found</h2>
              <p className="text-muted-foreground mt-2">Try adjusting your search filters or selecting different job seekers.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {displayedJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
              {/* Pagination */}
              <div className="flex justify-between items-center mt-8 bg-card p-4 rounded-lg shadow border border-border">
                <button 
                  onClick={handlePrevPage}
                  disabled={page === 0}
                  className={`px-4 py-2 rounded-md ${
                    page === 0 
                      ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}
                >
                  Previous
                </button>
                
                <div className="hidden md:flex space-x-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Logic to show pages around current page
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i;
                    } else if (page < 3) {
                      pageNum = i;
                    } else if (page > totalPages - 4) {
                      pageNum = totalPages - 5 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 flex items-center justify-center rounded-md ${
                          page === pageNum
                            ? 'bg-primary text-primary-foreground'
                            : 'text-foreground hover:bg-accent'
                        }`}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                </div>
                
                <span className="md:hidden py-2 px-4 text-foreground">
                  Page {page + 1} of {totalPages}
                </span>
                
                <button 
                  onClick={handleNextPage}
                  disabled={page >= totalPages - 1}
                  className={`px-4 py-2 rounded-md ${
                    page >= totalPages - 1 
                      ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function JobCard({ job }: { job: Job }) {
  // Format date to be more readable
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Truncate description if too long
  const truncateDescription = (text: string, maxLength: number = 150) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <div className="bg-card shadow overflow-hidden sm:rounded-lg hover:shadow-md transition-shadow border border-border">
      <div className="px-4 py-5 sm:px-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-semibold text-foreground">{job.title}</h3>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {job.company} • {job.location}
            </p>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium 
            ${job.status === 'active' ? 'bg-muted text-foreground' : 'bg-muted text-muted-foreground'}`}>
            {job.status === 'active' ? 'Active' : 'Closed'}
          </span>
        </div>
      </div>

      <div className="border-t border-border px-4 py-5 sm:px-6">
        <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-muted-foreground">Description</dt>
            <dd className="mt-1 text-sm text-foreground">
              {truncateDescription(job.description)}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-muted-foreground">Type</dt>
            <dd className="mt-1 text-sm text-foreground">{job.type}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-muted-foreground">Salary</dt>
            <dd className="mt-1 text-sm text-foreground">${job.salary.toLocaleString()}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-muted-foreground">Posted On</dt>
            <dd className="mt-1 text-sm text-foreground">{formatDate(job.postedDate)}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-muted-foreground">Application Deadline</dt>
            <dd className="mt-1 text-sm text-foreground">{formatDate(job.deadline)}</dd>
          </div>

          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-muted-foreground">Required Skills</dt>
            <dd className="mt-1 text-sm text-foreground">
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, index) => (
                  <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-foreground">
                    {skill}
                  </span>
                ))}
              </div>
            </dd>
          </div>
        </dl>

        <div className="mt-6">
          <Link
            href={`/jobs/${job.id}`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}