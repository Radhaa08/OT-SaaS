'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { 
  ArrowRight, 
  Briefcase, 
  CheckCircle, 
  FileSearch, 
  Search, 
  Star, 
  Users,
  Upload,
  Clock,
  FileText,
  Bell,
  BarChart3,
  User,
  Shield,
  LineChart,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleDot
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from "../components/navbar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { useUser } from '../components/auth/UserProvider';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { useGetJobSeekersForConsultantQuery, JobSeeker } from '../apiSlice/jobSeekersApiSlice';
import { useGetAllActiveJobsQuery, Job } from '../apiSlice/jobsApiSlice';
import { useGetUsersActivitiesQuery } from '../apiSlice/activitiesApiSlice';

// Only keeping sample data for unauthenticated view
// Removed hardcoded data as we'll fetch from API

export default function HomePage() {
  const { user } = useUser();
  
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />
      
      {user ? (
        <ProtectedRoute>
          <AuthenticatedView username={user.name ?? 'Guest'} />
        </ProtectedRoute>
      ) : (
        <UnauthenticatedView />
      )}
    </div>
  );
}

function UnauthenticatedView() {
  // Image slideshow state
  const [currentImage, setCurrentImage] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState<boolean[]>([false, false, false]);
  const [isHovered, setIsHovered] = useState(false);
  
  // Use the correct paths for public images
  // If images are in the public folder, use a path starting with /
  // If images are in the src/images folder, they need to be imported
  const images = [
    '/images/image.png',  // Update paths according to actual location
    '/images/image1.png',
    '/images/image2.png'
  ];
  
  // Handle image load success
  const handleImageLoad = (index: number) => {
    setImagesLoaded(prev => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  };

  // Handle image load error
  const handleImageError = (index: number) => {
    console.error(`Failed to load image at index ${index}`);
    // Keep the image in the rotation but mark it as failed
    handleImageLoad(index);
  };
  
  // Auto-rotate slideshow only when not hovered
  useEffect(() => {
    if (isHovered) return;
    
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 5000); // Change image every 5 seconds
    
    return () => clearInterval(interval);
  }, [isHovered, images.length]);
  
  // Handle manual navigation
  const goToNext = () => setCurrentImage((prev) => (prev + 1) % images.length);
  const goToPrev = () => setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  const goToSlide = (index: number) => setCurrentImage(index);
  
  return (
    <>
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <div className="inline-block px-3 py-1 text-sm font-medium bg-muted rounded-full mb-2">
                  Job Consultant Platform
                </div>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-foreground">
                  Connect Talent With Opportunity
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  A powerful platform for consultants to manage job seekers, match skills with opportunities, and
                  streamline the recruitment process.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" size="lg" asChild>
                  <Link href="/sign-up">
                    Get Started
                  </Link>
                </Button>
                <Button variant="outline" className="border-border hover:bg-accent" size="lg" asChild>
                  <Link href="/sign-in">
                    Sign In
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
            <div 
              className="mx-auto lg:mx-0 relative aspect-video rounded-xl overflow-hidden shadow-lg border border-border 
                         transition-all duration-300 ease-in-out transform group
                         hover:shadow-2xl hover:scale-[1.02] hover:border-accent"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {/* Image container with slides */}
              <div className="relative w-full h-full bg-muted">
                {images.map((img, index) => (
                  <div 
                    key={index} 
                    className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                      currentImage === index 
                        ? 'opacity-100 scale-100' 
                        : 'opacity-0 scale-[1.02]'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Dashboard Preview ${index + 1}`}
                      width={1280}
                      height={720}
                      className="object-cover w-full h-full"
                      priority={index === 0}
                      onLoad={() => handleImageLoad(index)}
                      onError={() => handleImageError(index)}
                    />
                    
                    {/* Fallback if image fails to load */}
                    {!imagesLoaded[index] && (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        <div className="text-center p-4">
                          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Loading preview...</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Image counter badge */}
                <div className="absolute top-4 right-4 z-20 bg-background/60 text-foreground text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                  {currentImage + 1} / {images.length}
                </div>
                
                {/* Navigation controls - improved styling */}
                <div className={`absolute inset-0 flex items-center justify-between p-4 z-10 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full bg-background/30 hover:bg-background/60 text-foreground h-10 w-10 shadow-lg backdrop-blur-sm 
                              transition-transform duration-200 hover:scale-110"
                    onClick={(e) => {
                      e.preventDefault();
                      goToPrev();
                    }}
                  >
                    <ChevronLeft className="h-5 w-5" />
                    <span className="sr-only">Previous</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full bg-background/30 hover:bg-background/60 text-foreground h-10 w-10 shadow-lg backdrop-blur-sm
                              transition-transform duration-200 hover:scale-110"
                    onClick={(e) => {
                      e.preventDefault();
                      goToNext();
                    }}
                  >
                    <ChevronRight className="h-5 w-5" />
                    <span className="sr-only">Next</span>
                  </Button>
                </div>
                
                {/* Improved slide indicators */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
                  {images.map((_, index) => (
                    <button 
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        currentImage === index 
                          ? 'bg-foreground w-6' 
                          : 'bg-foreground/50 hover:bg-foreground/80'
                      }`}
                      onClick={() => goToSlide(index)}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
              
              {/* Enhanced overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-background/20 z-[1] pointer-events-none"></div>
              
              {/* Caption for current image */}
              <div className="absolute bottom-0 left-0 right-0 p-6 z-[2] transform transition-transform duration-300 ease-in-out">
                <div className="bg-background/30 backdrop-blur-sm text-foreground p-3 rounded-lg">
                  <h3 className="text-lg font-medium">Professional Dashboard</h3>
                  <p className="text-sm text-muted-foreground">Powerful tools to connect job seekers with opportunities</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-foreground">
                Powerful Features for Consultants
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Everything you need to manage job seekers and find the perfect job matches.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
            <Card>
              <CardHeader>
                <div className="p-2 bg-muted rounded-full w-10 h-10 flex items-center justify-center mb-2">
                  <Upload className="h-5 w-5 text-foreground" />
                </div>
                <CardTitle>Resume Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Upload and manage resumes for your job seekers. Link them to profiles and track their performance.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="p-2 bg-muted rounded-full w-10 h-10 flex items-center justify-center mb-2">
                  <Search className="h-5 w-5 text-foreground" />
                </div>
                <CardTitle>Smart Job Matching</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our algorithm matches job seekers with opportunities based on their skills, experience, and
                  preferences.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="p-2 bg-muted rounded-full w-10 h-10 flex items-center justify-center mb-2">
                  <Filter className="h-5 w-5 text-foreground" />
                </div>
                <CardTitle>Advanced Filtering</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Filter jobs by technology, location, experience level, and more to find the perfect match.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="p-2 bg-muted rounded-full w-10 h-10 flex items-center justify-center mb-2">
                  <Bell className="h-5 w-5 text-foreground" />
                </div>
                <CardTitle>Job Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Receive notifications when new jobs matching your job seekers' skills become available.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="p-2 bg-muted rounded-full w-10 h-10 flex items-center justify-center mb-2">
                  <LineChart className="h-5 w-5 text-foreground" />
                </div>
                <CardTitle>Analytics Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Track resume views, application status, and job seeker performance with detailed analytics.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="p-2 bg-muted rounded-full w-10 h-10 flex items-center justify-center mb-2">
                  <Shield className="h-5 w-5 text-foreground" />
                </div>
                <CardTitle>Secure Authentication</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  OAuth-based authentication ensures your data and your job seekers' information remains secure.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-background border-t border-b border-border">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-foreground">
                How It Works
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Our platform streamlines the job matching process in four simple steps.
              </p>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-4">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                <User className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground">1. Create Profile</h3>
              <p className="mt-2 text-muted-foreground">
                Register and set up your consultant profile with your expertise and preferences.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                <Upload className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground">2. Upload Resumes</h3>
              <p className="mt-2 text-muted-foreground">
                Add your job seekers and upload their resumes to the platform.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                <FileSearch className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground">3. Match Jobs</h3>
              <p className="mt-2 text-muted-foreground">
                Our algorithm matches job seekers with relevant opportunities based on their skills.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                <BarChart3 className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground">4. Track Progress</h3>
              <p className="mt-2 text-muted-foreground">
                Monitor applications, view analytics, and manage your job seekers' progress.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-foreground">
                What Our Users Say
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Hear from consultants who have transformed their recruitment process with our platform.
              </p>
            </div>
          </div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
            <Card className="shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col space-y-4">
                  <div className="relative">
                    <div className="absolute -top-2 -left-2 text-muted-foreground">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 10.5C10 11.3 9.3 12 8.5 12C7.7 12 7 11.3 7 10.5C7 9.7 7.7 9 8.5 9C9.3 9 10 9.7 10 10.5ZM17 10.5C17 11.3 16.3 12 15.5 12C14.7 12 14 11.3 14 10.5C14 9.7 14.7 9 15.5 9C16.3 9 17 9.7 17 10.5ZM19.5 15.5C17.8 17.2 15.4 18 13 18C10.6 18 8.2 17.2 6.5 15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M19.5 9.5C18 7.6 15.6 6.5 13 6.5C10.4 6.5 8 7.6 6.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p className="text-muted-foreground italic pl-6">
                      "This platform has revolutionized how I manage my job seekers. The matching algorithm is incredibly
                      accurate, and I've seen a 40% increase in successful placements."
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="rounded-full bg-gradient-to-br from-blue-400 to-purple-500 w-10 h-10 overflow-hidden flex items-center justify-center text-white font-medium">SJ</div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Sarah Johnson</p>
                      <p className="text-sm text-muted-foreground">Senior Recruitment Consultant</p>
                    </div>
                    <div className="ml-auto flex">
                      {[1,2,3,4,5].map((star) => (
                        <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col space-y-4">
                  <div className="relative">
                    <div className="absolute -top-2 -left-2 text-muted-foreground">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 10.5C10 11.3 9.3 12 8.5 12C7.7 12 7 11.3 7 10.5C7 9.7 7.7 9 8.5 9C9.3 9 10 9.7 10 10.5ZM17 10.5C17 11.3 16.3 12 15.5 12C14.7 12 14 11.3 14 10.5C14 9.7 14.7 9 15.5 9C16.3 9 17 9.7 17 10.5ZM19.5 15.5C17.8 17.2 15.4 18 13 18C10.6 18 8.2 17.2 6.5 15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M19.5 9.5C18 7.6 15.6 6.5 13 6.5C10.4 6.5 8 7.6 6.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p className="text-muted-foreground italic pl-6">
                      "The analytics dashboard gives me insights I never had before. I can now make data-driven decisions
                      about which jobs to pursue for my candidates."
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="rounded-full bg-gradient-to-br from-green-400 to-teal-500 w-10 h-10 overflow-hidden flex items-center justify-center text-white font-medium">MC</div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Michael Chen</p>
                      <p className="text-sm text-muted-foreground">Tech Recruitment Specialist</p>
                    </div>
                    <div className="ml-auto flex">
                      {[1,2,3,4,5].map((star) => (
                        <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col space-y-4">
                  <div className="relative">
                    <div className="absolute -top-2 -left-2 text-muted-foreground">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 10.5C10 11.3 9.3 12 8.5 12C7.7 12 7 11.3 7 10.5C7 9.7 7.7 9 8.5 9C9.3 9 10 9.7 10 10.5ZM17 10.5C17 11.3 16.3 12 15.5 12C14.7 12 14 11.3 14 10.5C14 9.7 14.7 9 15.5 9C16.3 9 17 9.7 17 10.5ZM19.5 15.5C17.8 17.2 15.4 18 13 18C10.6 18 8.2 17.2 6.5 15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M19.5 9.5C18 7.6 15.6 6.5 13 6.5C10.4 6.5 8 7.6 6.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p className="text-muted-foreground italic pl-6">
                      "The resume management system is a game-changer. I can easily organize, update, and track all my
                      candidates in one place."
                      </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="rounded-full bg-gradient-to-br from-pink-400 to-orange-500 w-10 h-10 overflow-hidden flex items-center justify-center text-white font-medium">PP</div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Priya Patel</p>
                      <p className="text-sm text-muted-foreground">Independent Recruiter</p>
                      </div>
                    <div className="ml-auto flex">
                      {[1,2,3,4,5].map((star) => (
                        <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}

function AuthenticatedView({ username }: { username: string }) {
  const { user } = useUser();
  
  // Fetch job seekers data using the correct API query hook
  const { 
    data: jobSeekers = [], 
    isLoading: isLoadingJobSeekers, 
    error: jobSeekersError 
  } = useGetJobSeekersForConsultantQuery({ 
    consultantId: user?.id?.toString() || '0',
    queryParams: { limit: 10, offset: 0 }
  }) || {};
  
  // Fetch jobs data using the correct API query hook
  const { 
    data: jobs = [], 
    isLoading: isLoadingJobs, 
    error: jobsError 
  } = useGetAllActiveJobsQuery({ limit: 20, offset: 0 }) || {};
  
  // Fetch user activities
  const { 
    data: activities, 
    isLoading: isLoadingActivities, 
    error: activitiesError 
  } = useGetUsersActivitiesQuery({ userId: user?.id || 0 }) || {};

  // Calculate stats based on API data
  const totalJobSeekers = jobSeekers?.length || 0;
  const totalJobs = jobs?.length || 0;
  
  // Calculate potential matches (if we have both job seekers and jobs)
  const potentialMatches = React.useMemo(() => {
    if (!jobSeekers?.length || !jobs?.length) return 0;
    
    return jobSeekers.reduce((acc, jobSeeker) => {
      const jobSeekerSkills = jobSeeker.skills || [];
      const matchingJobs = jobs.filter(job => {
        const jobSkills = job.skills || [];
        return jobSkills.some(skill => jobSeekerSkills.includes(skill));
      });
      return acc + matchingJobs.length;
    }, 0);
  }, [jobSeekers, jobs]);

  // Get recent activity count from activities API
  const recentActivities = activities?.length || 0;

  return (
    <>
      {/* Welcome Banner - Updated for dark mode */}
      <section className="w-full py-10 md:py-14 bg-gradient-to-r from-primary to-primary/90 dark:from-primary/90 dark:to-primary/70 border-b border-border">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-primary-foreground">Welcome back, {username}</h1>
              <h1 className="mt-2 text-lg text-primary-foreground">Here's what's happening with your job seekers today.</h1>
            </div>
            <div className="flex gap-3">
              <Button asChild className="bg-background/90 text-foreground hover:bg-background shadow-sm backdrop-blur-sm">
                <Link href="/dashboard">
                  <Upload className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Link>
              </Button>
              <Button asChild variant="secondary" className="hover:bg-accent shadow-sm backdrop-blur-sm">
                <Link href="/support">
                  <Search className="mr-2 h-4 w-4" />
                  Get Support
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Overview */}
      <section className="w-full py-10 bg-muted">
        <div className="container px-4 md:px-6 mx-auto">
          {/* Stats Cards */}
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Job Seekers</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                {isLoadingJobSeekers ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  </div>
                ) : (
                  <>
                    <div className="text-3xl font-bold">{totalJobSeekers}</div>
                    <p className="text-xs text-muted-foreground mt-1">Candidates under your management</p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Available Jobs</CardTitle>
                <Briefcase className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                {isLoadingJobs ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  </div>
                ) : (
                  <>
                    <div className="text-3xl font-bold">{totalJobs}</div>
                    <p className="text-xs text-muted-foreground mt-1">Currently in our database</p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Potential Matches</CardTitle>
                <CheckCircle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                {isLoadingJobs || isLoadingJobSeekers ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  </div>
                ) : (
                  <>
                    <div className="text-3xl font-bold">{potentialMatches}</div>
                    <p className="text-xs text-muted-foreground mt-1">Based on skills and requirements</p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                <Clock className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                {isLoadingActivities ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  </div>
                ) : (
                  <>
                    <div className="text-3xl font-bold">{recentActivities}</div>
                    <p className="text-xs text-muted-foreground mt-1">New activities in the last 24 hours</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Job Seekers & Recent Jobs section */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Job Seekers Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Your Job Seekers</CardTitle>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard">View All</Link>
                  </Button>
                </div>
                <CardDescription>
                  Manage and monitor your job seekers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingJobSeekers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : jobSeekersError ? (
                  <div className="p-4 text-center text-destructive">Error loading job seekers.</div>
                ) : jobSeekers.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">No job seekers found.</div>
                ) : (
                  <div className="space-y-4">
                    {jobSeekers.slice(0, 3).map((jobSeeker) => (
                      <div
                        key={jobSeeker.id}
                        className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors duration-150"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                          {jobSeeker.name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{jobSeeker.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {jobSeeker.skills?.slice(0, 3).join(", ") || 'No skills listed'}
                            {jobSeeker.skills?.length > 3 && "..."}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/job-seekers/${jobSeeker.id}`}>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/dashboard">
                    View Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Recent Jobs */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Jobs</CardTitle>
                <CardDescription>
                  Latest job opportunities matching your candidates' skills
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingJobs ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : jobsError ? (
                  <div className="p-4 text-center text-destructive">Error loading jobs.</div>
                ) : jobs.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">No jobs found.</div>
                ) : (
                  <div className="space-y-4">
                    {jobs.slice(0, 3).map((job) => (
                      <div key={job.id} className="p-4 border border-border rounded-lg hover:border-accent transition-colors duration-150">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{job.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {job.company} • {job.location}
                            </p>
                          </div>
                          <div className="text-xs font-medium bg-muted px-2 py-1 rounded-full">
                            {job.type || 'Full-time'}
                          </div>
                        </div>
                        {job.skills && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {job.skills.slice(0, 4).map((skill) => (
                              <span 
                                key={skill} 
                                className="inline-block bg-muted text-foreground text-xs px-2 py-1 rounded-full mr-1 mb-1"
                              >
                                {skill}
                              </span>
                            ))}
                            {job.skills.length > 4 && (
                              <span className="inline-block bg-muted text-foreground text-xs px-2 py-1 rounded-full mr-1 mb-1">
                                +{job.skills.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                        <div className="mt-3 flex justify-between items-center">
                          <p className="text-sm font-medium">
                            {job.salary ? `$${job.salary.toLocaleString()}` : 'Salary not specified'}
                          </p>
                          <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
                            <Link href={`/jobs/${job.id}`}>
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/jobs">
                    <Search className="mr-2 h-4 w-4" />
                    Search All Jobs
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="w-full py-8 bg-background border-t border-border">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-semibold">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                asChild
                className="hover:bg-accent transition-all duration-200"
              >
                <Link href="/job-seekers/add">
                  <Upload className="mr-2 h-4 w-4" />
                  Add Job Seeker
                </Link>
              </Button>
              <Button
                variant="outline"
                asChild
                className="hover:bg-accent transition-all duration-200"
              >
                <Link href="/jobs">
                  <Search className="mr-2 h-4 w-4" />
                  Search Jobs
                </Link>
              </Button>
              <Button
                variant="outline"
                asChild
                className="hover:bg-accent transition-all duration-200"
              >
                <Link href="/support">
                  <FileText className="mr-2 h-4 w-4" />
                  Support
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}