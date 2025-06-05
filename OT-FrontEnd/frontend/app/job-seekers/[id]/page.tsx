"use client"
import { useState, useEffect } from "react"
import React from "react"
import Navbar from "../../../components/navbar"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar"
import { Badge } from "../../../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import {
  ArrowLeft,
  Calendar,
  Download,
  FileText,
  GraduationCap as Graduation,
  Mail,
  MapPin,
  Phone,
  Search,
  Trash2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog"
import { ProtectedRoute } from "../../../components/auth/ProtectedRoute"

export default function JobSeekerProfilePage() {
  return (
    <ProtectedRoute>
      <JobSeekerProfileContent />
    </ProtectedRoute>
  )
}

function JobSeekerProfileContent() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  console.log(id);
  //console.log("is it coming hereb again");
  const [jobSeeker, setJobSeeker] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isResumeOpen, setIsResumeOpen] = useState(false)
  
  useEffect(() => {
    async function fetchJobSeeker() {
      try {
        const response = await fetch(`http://localhost:5000/api/job-seekers/${id}`)
        if (!response.ok) throw new Error("Job Seeker not found")
        const data = await response.json()
        setJobSeeker(data)
        console.log(data);
      } catch (err) {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchJobSeeker()
  }, [id])

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

  // Resume file path based on job seeker ID
  const resumePath = `http://localhost:5000${jobSeeker?.resume}`
  // console.log(resumePath);

  if (loading) {
    return <p className="text-center mt-10">Loading...</p>
  }

  if (error || !jobSeeker) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-2 pt-6">
        <Navbar />
        <div className="flex items-center">
          <Button variant="ghost" size="sm" className="mr-2" asChild>
            <Link href="/job-seekers">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Job Seekers
            </Link>
          </Button>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <h3 className="mt-4 text-lg font-semibold">Job Seeker Not Found</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              The job seeker you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link href="/job-seekers">Go Back to Job Seekers</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex-1 space-y-6 container mx-auto p-4 md:p-8 pt-6 max-w-7xl">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" className="mr-2" asChild>
              <Link href="/job-seekers">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
            </Button>
            <h2 className="text-3xl font-bold tracking-tight">{jobSeeker.name}</h2>
          </div>
          <Badge variant="outline" className="text-sm px-3 py-1">
            {jobSeeker.experience} Years Experience
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-7">
          {/* Profile Overview */}
          <Card className="md:col-span-3 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-28 w-28 border-2 border-primary/20">
                  <AvatarImage src={jobSeeker.avatar} alt={jobSeeker.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">{jobSeeker.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="space-y-1 text-center">
                  <h3 className="text-2xl font-bold">{jobSeeker.name}</h3>
                  <p className="text-muted-foreground">{jobSeeker.location}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-5 mt-2">
                <div className="grid grid-cols-[20px_1fr] items-center gap-x-2 gap-y-4">
                  <Mail className="h-5 w-5 text-primary" />
                  <span className="text-sm">{jobSeeker.email}</span>
                  
                  <Phone className="h-5 w-5 text-primary" />
                  <span className="text-sm">{jobSeeker.phone}</span>
                  
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="text-sm">{jobSeeker.location}</span>
                  
                  <Graduation className="h-5 w-5 text-primary" />
                  <span className="text-sm">{jobSeeker.education}</span>
                  
                  <Calendar className="h-5 w-5 text-primary" />
                  <span className="text-sm">Added on {formatDate(jobSeeker.addedDate)}</span>
                </div>
                
                <div className="pt-4 border-t mt-4">
                  {/* View Resume Button with Dialog */}
                  <Dialog open={isResumeOpen} onOpenChange={setIsResumeOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full" variant="default">
                        <FileText className="h-4 w-4 mr-2" />
                        View Resume
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[800px] h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>{jobSeeker.name}'s Resume</DialogTitle>
                        <DialogDescription>
                          Resume uploaded on {formatDate(jobSeeker.addedDate)}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex-1 h-full min-h-[500px] w-full overflow-hidden">
                       <iframe 
      src={`${resumePath}#view=FitH`}
      className="w-full h-full border-0"
      style={{ minHeight: "80vh" }}
      title={`${jobSeeker.name}'s Resume`}
    />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsResumeOpen(false)}>
                          Close
                        </Button>
                        <Button asChild>
                          <a href={resumePath} download={`${jobSeeker.name}-Resume.pdf`}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </a>
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details Tabs */}
          <Card className="md:col-span-4 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <Tabs defaultValue="about" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="about">About</TabsTrigger>
                  <TabsTrigger value="skills">Skills</TabsTrigger>
                </TabsList>
                <TabsContent value="about" className="space-y-4 pt-4">
                  <CardTitle className="text-xl font-semibold text-primary">Profile</CardTitle>
                  <CardDescription className="text-base leading-relaxed">{jobSeeker.about}</CardDescription>
                </TabsContent>
                <TabsContent value="skills" className="pt-4">
                  <CardTitle className="text-xl font-semibold text-primary mb-4">Skills & Expertise</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    {jobSeeker.skills.map((skill: string) => (
                      <Badge key={skill} className="text-sm py-1 px-3 bg-white text-black hover:bg-gray-100 transition-colors">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  )
}
