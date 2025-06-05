'use client';

import React, { useState } from 'react';
import { useUser } from '../../components/auth/UserProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { 
  BriefcaseIcon, BookmarkIcon, UsersIcon, 
  Loader2, BarChart3Icon, TrendingUpIcon, 
  ArrowRightIcon, CheckCircleIcon, ClockIcon, HomeIcon
} from 'lucide-react';
import Link from 'next/link';
import { useGetAllActiveJobsQuery } from '../../apiSlice/jobsApiSlice';
import { useGetJobSeekersForConsultantQuery } from '../../apiSlice/jobSeekersApiSlice';
import { Badge } from '../../components/ui/badge';
import { Navbar } from '../../components/navbar';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user } = useUser();
  const [activeSection, setActiveSection] = useState('overview');
  
  const { data: recentJobs, isLoading: isLoadingJobs } = 
    useGetAllActiveJobsQuery({ limit: 20 });

  const { data: jobSeekers, isLoading: isLoadingJobSeekers } = 
    useGetJobSeekersForConsultantQuery({
      consultantId: user?.id?.toString() || '0',
      queryParams: { limit: 5 }
    });
  
  // Get the current time of day for the greeting
  const hour = new Date().getHours();
  let greeting = "Good morning";
  if (hour >= 12 && hour < 18) greeting = "Good afternoon";
  else if (hour >= 18) greeting = "Good evening";

  // Extract initial stats from API data
  const initialStats = {
    activeJobSeekers: jobSeekers?.length || 0,
    newJobSeekers: 0, // This would come from an API with "recent" filter
    placedJobSeekers: 0, // This would be tracked in the JobSeeker status
    availableJobs: recentJobs?.length || 0,
  };

  // Loading state for the entire dashboard
  const isLoading = isLoadingJobs || isLoadingJobSeekers;

  // Calculate match percentage between job seeker skills and job requirements
  const calculateMatchPercentage = (jobSeekerSkills: string[], jobSkills: string[]) => {
    if (jobSkills.length === 0) return 0;
    
    const matchingSkills = jobSeekerSkills.filter(skill => 
      jobSkills.some(jobSkill => jobSkill.toLowerCase() === skill.toLowerCase())
    );
    
    return Math.round((matchingSkills.length / jobSkills.length) * 100);
  };
  
  // Function to get matching job seekers for a job
  const getMatchingJobSeekers = (job: any, jobSeekers: any[]) => {
    if (!jobSeekers || jobSeekers.length === 0) return [];
    
    return jobSeekers
      .map(seeker => ({
        ...seeker,
        matchPercentage: calculateMatchPercentage(seeker.skills, job.skills)
      }))
      .filter(seeker => seeker.matchPercentage > 0)
      .sort((a, b) => b.matchPercentage - a.matchPercentage);
  };

  // Calculate the number of jobs that match at least one job seeker's skills
  const countMatchingJobs = () => {
    if (!recentJobs || !jobSeekers || jobSeekers.length === 0 || recentJobs.length === 0) {
      return 0;
    }
    
    // Count jobs that match at least one job seeker with at least 50% skill match
    const matchingJobsCount = recentJobs.filter(job => {
      return jobSeekers.some(seeker => {
        const matchPercentage = calculateMatchPercentage(seeker.skills, job.skills);
        return matchPercentage >= 50; // Consider it a match if at least 50% skills match
      });
    }).length;
    
    return matchingJobsCount;
  };
  
  // Calculate the number of potential matches (job-seeker pairs)
  const countPotentialMatches = () => {
    if (!recentJobs || !jobSeekers || jobSeekers.length === 0 || recentJobs.length === 0) {
      return 0;
    }
    
    // Count all job-seeker pairs that have at least 50% skill match
    let potentialMatchesCount = 0;
    
    recentJobs.forEach(job => {
      jobSeekers.forEach(seeker => {
        const matchPercentage = calculateMatchPercentage(seeker.skills, job.skills);
        if (matchPercentage >= 50) {
          potentialMatchesCount++;
        }
      });
    });
    
    return potentialMatchesCount;
  };
  
  // Get the job matching stats
  const matchingJobsCount = countMatchingJobs();
  const potentialMatchesCount = countPotentialMatches();

  // Merge initial stats with matching stats
  const stats = {
    ...initialStats,
    matchingJobs: matchingJobsCount,
    potentialMatches: potentialMatchesCount,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-medium text-gray-900">Loading dashboard data</h3>
          <p className="text-gray-600">Please wait while we fetch your information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Welcome Header with Summary */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {greeting}, {user?.name || 'there'}!
            </h1>
            <p className="text-muted-foreground">
              <span className="font-medium">Summary:</span>
              {stats.activeJobSeekers > 0 ? ` Managing ${stats.activeJobSeekers} job seekers, ` : ' '}
              {stats.availableJobs > 0 ? `${stats.availableJobs} active jobs available` : 'No active jobs available'}
            </p>
          </div>
          
          <Card className="w-full md:w-[300px]">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Link href="/job-seekers/add">
                  <Button variant="outline" size="sm" className="w-full justify-between">
                    Add New Job Seeker <ArrowRightIcon className="h-3 w-3" />
                  </Button>
                </Link>
                <Link href="/jobs">
                  <Button variant="outline" size="sm" className="w-full justify-between">
                    View Jobs <ArrowRightIcon className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 border-b pb-2">
          <Button 
            variant={activeSection === 'overview' ? "default" : "outline"} 
            onClick={() => setActiveSection('overview')}
            className="rounded-md"
          >
            <HomeIcon className="h-4 w-4 mr-2" />
            Overview
          </Button>
          <Button 
            variant={activeSection === 'job-seekers' ? "default" : "outline"} 
            onClick={() => setActiveSection('job-seekers')}
            className="rounded-md"
          >
            <UsersIcon className="h-4 w-4 mr-2" />
            Job Seekers
          </Button>
          <Button 
            variant={activeSection === 'job-matching' ? "default" : "outline"} 
            onClick={() => setActiveSection('job-matching')}
            className="rounded-md"
          >
            <BriefcaseIcon className="h-4 w-4 mr-2" />
            Job Matching
          </Button>
          <Button 
            variant={activeSection === 'settings' ? "default" : "outline"} 
            onClick={() => setActiveSection('settings')}
            className="rounded-md"
          >
            Settings
          </Button>
        </div>
        
        {/* Content Sections */}
        <div className="space-y-6">
          {/* Overview Section */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Job Seekers</CardTitle>
                    <UsersIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.activeJobSeekers}</div>
                    <p className="text-xs text-muted-foreground">{stats.newJobSeekers} new this week</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Available Jobs</CardTitle>
                    <BriefcaseIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.availableJobs}</div>
                    <p className="text-xs text-muted-foreground">Jobs that match your seekers</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Matching</CardTitle>
                    <BarChart3Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.potentialMatches}</div>
                    <p className="text-xs text-muted-foreground">Potential job seeker matches</p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Job Seeker Status Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Job Seeker Status</CardTitle>
                  <CardDescription>Overview of your job seekers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <ClockIcon className="h-5 w-5 text-amber-500 mr-2" />
                        <span>Actively Looking</span>
                      </div>
                      <Badge variant="outline">{stats.activeJobSeekers}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                        <span>Placed</span>
                      </div>
                      <Badge variant="outline">{stats.placedJobSeekers}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <TrendingUpIcon className="h-5 w-5 text-blue-500 mr-2" />
                        <span>Potential Matches</span>
                      </div>
                      <Badge variant="outline">{stats.availableJobs}</Badge>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href="/job-seekers">
                    <Button variant="outline" size="sm">
                      Manage Job Seekers
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
              
              {/* Your Job Seekers */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Job Seekers</CardTitle>
                  <CardDescription>Job seekers you are currently managing</CardDescription>
                </CardHeader>
                <CardContent>
                  {jobSeekers && jobSeekers.length > 0 ? (
                    <div className="space-y-4">
                      {jobSeekers.map((seeker) => (
                        <div 
                          key={seeker.id} 
                          className="border-b pb-3 last:border-0"
                        >
                          <Link href={`/job-seekers/${seeker.id}`} className="block hover:bg-gray-50 rounded p-2 transition-colors">
                            <div className="flex justify-between items-center">
                              <div>
                                <h3 className="font-medium">{seeker.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {seeker.skills.join(', ')}
                                  {seeker.location ? ` • ${seeker.location}` : ''}
                                </p>
                              </div>
                              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                                Active
                              </Badge>
                            </div>
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No job seekers found. Start adding job seekers to manage them.
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <div className="flex space-x-2 w-full justify-between">
                    <Link href="/job-seekers">
                      <Button variant="outline">
                        View All Job Seekers
                      </Button>
                    </Link>
                    <Link href="/job-seekers/add">
                      <Button>
                        Add New Job Seeker
                      </Button>
                    </Link>
                  </div>
                </CardFooter>
              </Card>
            </div>
          )}
          
          {/* Job Seekers Section */}
          {activeSection === 'job-seekers' && (
            <Card>
              <CardHeader>
                <CardTitle>Job Seeker Management</CardTitle>
                <CardDescription>Manage and track your job seekers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-700 mb-1">Active Job Seekers</h3>
                    <p className="text-2xl font-bold">{stats.activeJobSeekers}</p>
                    <p className="text-sm text-blue-600 mt-1">Job seekers actively looking</p>
                    <Link href="/job-seekers" className="mt-3 inline-block">
                      <Button size="sm" variant="outline">View All Job Seekers</Button>
                    </Link>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-medium text-green-700 mb-1">Matching Jobs</h3>
                    <p className="text-2xl font-bold">{stats.matchingJobs}</p>
                    <p className="text-sm text-green-600 mt-1">Jobs that match your seekers' skills</p>
                    <Link href="/jobs" className="mt-3 inline-block">
                      <Button size="sm" variant="outline">View All Jobs</Button>
                    </Link>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3">Job Seeker List</h3>
                  {jobSeekers && jobSeekers.length > 0 ? (
                    <div className="space-y-3">
                      {jobSeekers.map((seeker) => (
                        <Link key={seeker.id} href={`/job-seekers/${seeker.id}`} className="block border p-3 rounded hover:bg-gray-50">
                          <div className="flex justify-between">
                            <div>
                              <h4 className="font-medium">{seeker.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                {seeker.experience} years exp • {seeker.skills.slice(0, 3).join(', ')}
                                {seeker.skills.length > 3 ? '...' : ''}
                              </p>
                            </div>
                            <Badge variant="outline">{seeker.location}</Badge>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      No job seekers available
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Link href="/job-seekers/add">
                  <Button variant="outline">Add Job Seeker</Button>
                </Link>
                <Link href="/job-seekers">
                  <Button>View All Job Seekers</Button>
                </Link>
              </CardFooter>
            </Card>
          )}
          
          {/* Job Matching Section */}
          {activeSection === 'job-matching' && (
            <Card>
              <CardHeader>
                <CardTitle>Job Matching</CardTitle>
                <CardDescription>Match your job seekers with available jobs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-700 mb-1">Job Seekers</h3>
                    <p className="text-2xl font-bold">{stats.activeJobSeekers}</p>
                    <p className="text-sm text-blue-600 mt-1">To be matched with jobs</p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-medium text-green-700 mb-1">Available Jobs</h3>
                    <p className="text-2xl font-bold">{stats.availableJobs}</p>
                    <p className="text-sm text-green-600 mt-1">{stats.matchingJobs} have potential matches</p>
                  </div>
                  
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <h3 className="font-medium text-amber-700 mb-1">Potential Matches</h3>
                    <p className="text-2xl font-bold">{stats.potentialMatches}</p>
                    <p className="text-sm text-amber-600 mt-1">Job-seeker pairs with skill matches</p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3">Recent Job Listings</h3>
                  
                  {recentJobs && recentJobs.length > 0 ? (
                    <div className="space-y-4">
                      {recentJobs.map((job) => {
                        // Get job seekers that match this job's skills
                        const matchingJobSeekers = getMatchingJobSeekers(job, jobSeekers || []);
                        
                        return (
                          <div key={job.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{job.title}</h4>
                                <p className="text-sm text-muted-foreground">{job.company} • {job.location}</p>
                                
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {job.skills.slice(0, 3).map((skill, i) => (
                                    <Badge key={i} variant="outline" className="bg-blue-50 text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                  {job.skills.length > 3 && (
                                    <Badge variant="outline" className="bg-blue-50 text-xs">
                                      +{job.skills.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-end space-y-2">
                                <Badge>{job.type}</Badge>
                                <Link href={`/jobs/${job.id}/match`}>
                                  <Button size="sm">Match Job Seekers</Button>
                                </Link>
                              </div>
                            </div>
                            
                            <div className="mt-4 pt-2 border-t">
                              <p className="text-sm font-medium">
                                Potential Matches: {matchingJobSeekers.length > 0 ? 
                                  `${matchingJobSeekers.length} candidate${matchingJobSeekers.length === 1 ? '' : 's'}` : 
                                  'No matches found'}
                              </p>
                              {matchingJobSeekers.length > 0 ? (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {matchingJobSeekers.slice(0, 3).map((seeker) => (
                                    <Link key={seeker.id} href={`/job-seekers/${seeker.id}`}>
                                      <Badge 
                                        variant="secondary" 
                                        className={`cursor-pointer hover:bg-gray-200 flex items-center gap-1 ${
                                          seeker.matchPercentage >= 80 ? 'bg-green-100' : 
                                          seeker.matchPercentage >= 50 ? 'bg-yellow-100' : 'bg-gray-100'
                                        }`}
                                      >
                                        {seeker.name}
                                        <span className={`text-xs px-1 rounded-full ${
                                          seeker.matchPercentage >= 80 ? 'bg-green-200 text-green-800' : 
                                          seeker.matchPercentage >= 50 ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-200 text-gray-800'
                                        }`}>
                                          {seeker.matchPercentage}%
                                        </span>
                                      </Badge>
                                    </Link>
                                  ))}
                                  {matchingJobSeekers.length > 3 && (
                                    <Badge variant="secondary">+{matchingJobSeekers.length - 3} more</Badge>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground mt-1">
                                  No job seekers match the required skills
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No jobs available for matching
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/jobs">
                  <Button>View All Available Jobs</Button>
                </Link>
              </CardFooter>
            </Card>
          )}
          
          {/* Settings Section */}
          {activeSection === 'settings' && (
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Profile Settings</h3>
                    <div className="space-y-2">
                      <Link href="/profile" className="block p-3 border rounded hover:bg-gray-50">
                        <div className="flex justify-between items-center">
                          <span>Edit Profile</span>
                          <ArrowRightIcon className="h-4 w-4" />
                        </div>
                      </Link>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Account Security</h3>
                    <div className="space-y-2">
                      <Link href="/profile" className="block p-3 border rounded hover:bg-gray-50">
                        <div className="flex justify-between items-center">
                          <span>Change Password</span>
                          <ArrowRightIcon className="h-4 w-4" />
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="text-red-500 hover:text-red-700">Log Out</Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}