"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { useUser } from '../../components/auth/UserProvider';
import Navbar from "../../components/navbar"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Download, FileText, Plus, Search, Trash2, User } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog"
import { Badge } from "../../components/ui/badge"
import { useGetJobSeekersForConsultantQuery, useDeleteJobSeekerMutation } from "../../apiSlice/jobSeekersApiSlice"
import { useParams } from "next/navigation"
import { ProtectedRoute } from "../../components/auth/ProtectedRoute"
import React from "react"

import { useToast } from "../../components/ui/use-toast"
export default function JobSeekersPage() {
  return (
    <ProtectedRoute>
      <JobSeekersContent />
    </ProtectedRoute>
  )
}

function JobSeekersContent() {
  const { user } = useUser();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedJobSeeker, setSelectedJobSeeker] = useState<string | null>(null)
  //console.log(user);
  // Get consultantId from the URL or from user context
  // This is a placeholder - you'll need to adapt this based on your auth/routing setup
  const params = useParams();
  const consultantId = user?.id
    ? String(user.id) // Ensure it's a string
    : (Array.isArray(params.consultantId)
      ? params.consultantId[0]
      : params.consultantId ?? "3ba31c7d-c7de-485d-811b-5949c491f8d9");

  //console.log(consultantId);

  // Fetch job seekers for the current consultant
  const {
    data: jobSeekersData,
    isLoading,
    isError,
    error
  } = useGetJobSeekersForConsultantQuery({
    consultantId,
    queryParams: { limit: 50, offset: 0 }
  })

  // Delete job seeker mutation
  const [deleteJobSeeker, { isLoading: isDeleting }] = useDeleteJobSeekerMutation()

  // Filter job seekers based on search query
  const filteredJobSeekers = jobSeekersData?.filter(
    (jobSeeker) =>
      jobSeeker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      jobSeeker.skills.some((skill) => skill.toLowerCase().includes(searchQuery.toLowerCase())),
  ) || []

  // Handle delete job seeker
  const handleDeleteJobSeeker = async (id: string) => {
    try {
      await deleteJobSeeker(id).unwrap()
      toast({
        title: "Job seeker deleted",
        description: "The job seeker profile has been successfully deleted.",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete job seeker profile.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Job Seekers</h2>
            <p className="text-muted-foreground mt-1">Manage and track candidates in your database</p>
          </div>
          <Button asChild className="self-start md:self-auto">
            <Link href="/job-seekers/add">
              <Plus className="mr-2 h-4 w-4" /> Add Job Seeker
            </Link>
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-border p-4 mb-8">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name or skills..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <Card className="border-border shadow-sm">
            <CardContent className="flex items-center justify-center p-12">
              <div className="flex flex-col items-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="mt-4 text-sm text-muted-foreground">Loading job seekers...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error state */}
        {isError && (
          <Card className="border-border shadow-sm">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <div className="rounded-full bg-red-50 p-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-destructive">Error loading job seekers</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground max-w-md">
                We couldn't load your job seekers data. Please try again later or contact support.
              </p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Job Seekers List */}
        {!isLoading && !isError && (
          <div className="grid gap-6">
            {filteredJobSeekers.length > 0 ? (
              filteredJobSeekers.map((jobSeeker) => {
                const resumePath = jobSeeker.resume ? `http://localhost:5000${jobSeeker.resume}` : null;
                return (
                  <Card key={jobSeeker.id} className="border-border shadow-sm hover:shadow-md transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start gap-6">
                        <Avatar className="h-16 w-16 border-2 border-border">
                          <AvatarImage src={`/avatars/${jobSeeker.id}.png`} alt={jobSeeker.name} />
                          <AvatarFallback className="bg-primary/10 text-primary text-lg">{jobSeeker.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <Link href={`/job-seekers/${jobSeeker.id}`} className="hover:text-primary transition-colors">
                              <h3 className="font-semibold text-xl">{jobSeeker.name}</h3>
                            </Link>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" className="h-9 border-border" asChild>
                                <Link href={`/job-seekers/${jobSeeker.id}`}>
                                  <User className="mr-2 h-4 w-4" />
                                  View Profile
                                </Link>
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9 border-border hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => setSelectedJobSeeker(jobSeeker.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Delete Job Seeker</DialogTitle>
                                    <DialogDescription>
                                      Are you sure you want to delete {jobSeeker.name}'s profile? This action cannot be
                                      undone.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter className="gap-2 sm:justify-end">
                                    <Button variant="outline" onClick={() => setSelectedJobSeeker(null)}>Cancel</Button>
                                    <Button
                                      variant="destructive"
                                      onClick={() => handleDeleteJobSeeker(jobSeeker.id)}
                                      disabled={isDeleting}
                                    >
                                      {isDeleting ? "Deleting..." : "Delete"}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-2 gap-x-4 text-sm">
                            <div className="flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
                              <span className="text-muted-foreground">{jobSeeker.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                              <span className="text-muted-foreground">{jobSeeker.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                              <span className="text-muted-foreground">{jobSeeker.location}</span>
                            </div>
                          </div>

                          <div className="pt-2">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Skills</p>
                            <div className="flex flex-wrap gap-1.5">
                              {jobSeeker.skills.slice(0, 5).map((skill) => (
                                <Badge key={skill} variant="secondary" className="text-xs px-2 py-0.5 bg-primary/10 hover:bg-primary/20 text-primary transition-colors">
                                  {skill}
                                </Badge>
                              ))}
                              {jobSeeker.skills.length > 5 && (
                                <Badge variant="outline" className="text-xs">
                                  +{jobSeeker.skills.length - 5} more
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 pt-3 mt-2 border-t">
                            {resumePath && (
                              <Button variant="outline" size="sm" className="h-9 border-border" asChild>
                                <Link href={resumePath} target="_blank" download>
                                  <FileText className="mr-2 h-4 w-4" />
                                  Resume
                                </Link>
                              </Button>
                            )}
                            <Button variant="outline" size="sm" className="h-9 border-border" asChild>
                              <Link href={`/jobs?jobSeekerId=${jobSeeker.id}&jobSeekerName=${jobSeeker.name}`}>
                                <Search className="mr-2 h-4 w-4" />
                                Find Jobs
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              <Card className="border-border shadow-sm">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="rounded-full bg-muted p-4">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold">No job seekers found</h3>
                  <p className="mb-6 mt-3 text-muted-foreground max-w-sm">
                    {searchQuery
                      ? `No job seekers match your search for "${searchQuery}"`
                      : "You haven't added any job seekers to your database yet. Get started by adding your first candidate."}
                  </p>
                  <Button asChild>
                    <Link href="/job-seekers/add">
                      <Plus className="mr-2 h-4 w-4" /> Add Job Seeker
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}