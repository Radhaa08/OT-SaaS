"use client";

import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import Navbar from "../../../components/navbar";
import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert";
import { useCreateJobSeekerMutation } from "../../../apiSlice/jobSeekersApiSlice";
import { useUser } from '../../../components/auth/UserProvider';
import Link from "next/link";
import { parseResumeFile, ParsedResumeData } from "../../../lib/ocr/resumeParser";
import { Loader2 } from "lucide-react";
import { ProtectedRoute } from "../../../components/auth/ProtectedRoute";

// Update the schema to handle resume as a string path
const jobseekerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Phone number is required"),
  skills: z.string().trim().min(2, "Skills must be at least 2 characters"),
  experience: z.coerce.number().min(0, "Experience is required"),
  education: z.string().trim().min(2, "Education must be at least 2 characters"),
  location: z.string().trim().min(2, "Location must be at least 2 characters"),
  about: z.string().trim().min(2, "About must be at least 2 characters"),
  resume: z.string().min(1, "Resume path is required"),
});

export default function AddJobseekerPage() {
  return (
    <ProtectedRoute>
      <AddJobseekerContent />
    </ProtectedRoute>
  );
}

function AddJobseekerContent() {
  const { user } = useUser();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
    trigger,
  } = useForm({
    resolver: zodResolver(jobseekerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      skills: "",
      experience: 0,
      education: "",
      location: "",
      about: "",
      resume: "",
    }
  });

  const [createJobSeeker] = useCreateJobSeekerMutation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [fileSelected, setFileSelected] = useState(false);
  const [fileName, setFileName] = useState("");
  const [skillsArray, setSkillsArray] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeSection, setActiveSection] = useState("basic");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [actualFile, setActualFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedResumeData | null>(null);

  // Watch form values to dynamically check progress
  const formValues = watch();
  
  // Calculate form completion percentage
  const calculateProgress = () => {
    const fields = Object.keys(jobseekerSchema.shape) as Array<keyof typeof formValues>;
    let filledFields = 0;
    
    fields.forEach(field => {
      const value = formValues[field];
      if (value && (typeof value === 'number' || value.trim() !== '')) {
        filledFields++;
      }
    });
    
    return Math.round((filledFields / fields.length) * 100);
  };

  // Update progress when form values change
  useEffect(() => {
    setProgress(calculateProgress());
  }, [formValues]);

  // Process resume and extract information - but don't fill the form yet
  const processResume = async (file: File) => {
    try {
      setIsProcessing(true);
      setProcessingMessage("Processing resume... Extracting text");
      
      // Call our resume parser to extract information
      try {
        const data = await parseResumeFile(file);
        
        // Store the parsed data for later use
        setParsedData(data);
        
        // Check if we have any usable data
        const hasUsableData = data.name || 
                           data.email || 
                           data.phone || 
                           data.location || 
                           data.education || 
                           data.experience !== undefined || 
                           data.about || 
                           (data.skills && data.skills.length > 0);
        
        if (!hasUsableData) {
          setProcessingMessage("Could not find useful information in the resume. Click 'Fill Data' to fill in generic information.");
        } else {
          setProcessingMessage("Resume processed successfully. Click 'Fill Data' to populate form fields.");
        }
      } catch (parseError) {
        console.error("Error parsing resume:", parseError);
        
        // Even if parsing fails, set default parsed data so the button still appears
        const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove file extension
        const defaultName = fileName.split(/[_\-\s]/)
                             .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
                             .join(' ');
        
        setParsedData({
          name: defaultName || "New Candidate",
          skills: ["Communication", "Teamwork", "Problem Solving"],
          experience: 1,
          education: "Bachelor's Degree",
          about: `This is a candidate with experience in general skills. Their resume was uploaded but detailed information couldn't be automatically extracted.`
        });
        
        if (parseError instanceof Error) {
          setProcessingMessage(
            "Could not extract detailed information from this resume format. " +
            "Click 'Fill Data' to enter generic information, or fill the form manually."
          );
        } else {
          setProcessingMessage(
            "Resume processing encountered an error. " +
            "Click 'Fill Data' to enter generic information, or fill the form manually."
          );
        }
      }
      
      setIsProcessing(false);
    } catch (error) {
      console.error("Error processing resume:", error);
      
      // Set basic parsedData as fallback
      setParsedData({
        name: file.name.replace(/\.[^/.]+$/, "") || "New Candidate",
        skills: ["Communication", "Teamwork", "Problem Solving"],
        experience: 1,
        education: "Bachelor's Degree",
        about: "This candidate's information could not be automatically extracted."
      });
      
      setProcessingMessage(
        "Error processing resume. " +
        "Click 'Fill Data' to enter generic information, or fill the form manually."
      );
      
      setTimeout(() => {
        setIsProcessing(false);
      }, 1000);
    }
  };

  // New function to fill form with parsed data
  const fillFormWithResumeData = () => {
    if (!parsedData) {
      console.log("[Form] No parsed data available to fill form");
      setProcessingMessage("No data available to fill form");
      setTimeout(() => setProcessingMessage(""), 3000);
      return;
    }
    
    // Check if parsedData has any usable properties
    const hasUsableData = parsedData.name || 
                        parsedData.email || 
                        parsedData.phone || 
                        parsedData.location || 
                        parsedData.education || 
                        parsedData.experience !== undefined || 
                        parsedData.about || 
                        (parsedData.skills && parsedData.skills.length > 0);
    
    if (!hasUsableData) {
      console.log("[Form] Parsed data is empty or invalid:", parsedData);
      setProcessingMessage("Could not extract useful information from resume");
      setTimeout(() => setProcessingMessage(""), 3000);
      return;
    }
    
    console.log("[Form] Starting to fill form with parsed resume data:", parsedData);
    setProcessingMessage("Filling form with resume data...");
    
    // Update form fields with extracted information
    if (parsedData.name) {
      console.log("[Form] Setting name:", parsedData.name);
      setValue("name", parsedData.name, { shouldValidate: true });
    }
    
    if (parsedData.email) {
      console.log("[Form] Setting email:", parsedData.email);
      setValue("email", parsedData.email, { shouldValidate: true });
    }
    
    if (parsedData.phone) {
      console.log("[Form] Setting phone:", parsedData.phone);
      setValue("phone", parsedData.phone, { shouldValidate: true });
    }
    
    if (parsedData.location) {
      console.log("[Form] Setting location:", parsedData.location);
      setValue("location", parsedData.location, { shouldValidate: true });
    }
    
    if (parsedData.education) {
      console.log("[Form] Setting education:", parsedData.education);
      setValue("education", parsedData.education, { shouldValidate: true });
    }
    
    if (parsedData.experience !== undefined) {
      console.log("[Form] Setting experience:", parsedData.experience);
      setValue("experience", parsedData.experience, { shouldValidate: true });
    }
    
    if (parsedData.about) {
      console.log("[Form] Setting about:", parsedData.about);
      setValue("about", parsedData.about, { shouldValidate: true });
    }
    
    if (parsedData.skills && parsedData.skills.length > 0) {
      console.log("[Form] Setting skills:", parsedData.skills);
      // Update the skills array
      setSkillsArray(parsedData.skills);
      setValue("skills", parsedData.skills.join(", "), { shouldValidate: true });
    }
    
    // Auto-navigate to basic info to show extracted data
    setActiveSection("basic");
    
    setProcessingMessage("Form populated with resume data!");
    setTimeout(() => {
      setProcessingMessage("");
    }, 2000);
    
    console.log("[Form] Form population complete");
  };

  const API_BASE_URL ='http://localhost:5000';
const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    setFileSelected(true);
    setFileName(file.name);
      setActualFile(file);

    // Debug the entire user object
    console.log("User object:", user);
    console.log("User ID:", user?.id);

    // Check if user exists and has an id before proceeding
    if (!user || !user.id) {
      setServerError("User authentication required. Please login again.");
      setFileSelected(false);
      setFileName("");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      console.log(user?.id);
      const response = await fetch(`${API_BASE_URL}/api/upload/resume?consultantId=${user.id}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      setValue("resume", data.filePath, { shouldValidate: true });
      
      // Process the resume to extract information, but don't fill the form yet
      await processResume(file);
    } catch (error) {
      setServerError("Failed to upload resume. Please try again.");
      setFileSelected(false);
      setFileName("");
    }
  } else {
    setFileSelected(false);
    setFileName("");
      setActualFile(null);
      setParsedData(null);
    setValue("resume", "", { shouldValidate: true });
  }
};

  // Handle file drop
 // Handle file drop
 // Update the handleDrop function to use the same API URL:
 const handleDrop =  async (e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault();
  setIsDragging(false);

  const file = e.dataTransfer?.files?.[0];
  if (file) {
    setFileSelected(true);
    setFileName(file.name);
      setActualFile(file);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/api/upload/resume?consultantId=${user?.id}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      setValue("resume", data.filePath, { shouldValidate: true });
    } catch (error) {
      setServerError("Failed to upload resume. Please try again.");
      setFileSelected(false);
      setFileName("");
    }
      
      // Process the resume to extract information, but don't fill the form yet
      await processResume(file);
  }
};

  // Handle drag events
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Add skill to array
  const addSkill = () => {
    if (skillInput.trim() !== "" && !skillsArray.includes(skillInput.trim())) {
      const newSkills = [...skillsArray, skillInput.trim()];
      setSkillsArray(newSkills);
      setSkillInput("");
      
      // Update the form value
      setValue("skills", newSkills.join(", "), { shouldValidate: true });
    }
  };

  // Remove skill from array
  const removeSkill = (skillToRemove: string) => {
    const newSkills = skillsArray.filter(skill => skill !== skillToRemove);
    setSkillsArray(newSkills);
    
    // Update the form value
    setValue("skills", newSkills.join(", "), { shouldValidate: true });
  };

  // Handle skill input keydown
  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    } else if (e.key === ',' || e.key === ';') {
      e.preventDefault();
      addSkill();
    }
  };

  // Parse skills when form loads from existing value
  useEffect(() => {
    const initialSkills = watch("skills");
    if (initialSkills) {
      setSkillsArray(initialSkills.split(",").map(s => s.trim()).filter(Boolean));
    }
  }, []);

  // Move to next section
  const handleNextSection = async (currentSection: string) => {
    let fieldsToValidate: Array<keyof typeof jobseekerSchema.shape> = [];
    
    if (currentSection === "basic") {
      fieldsToValidate = ["name", "email", "phone", "location"];
    } else if (currentSection === "professional") {
      fieldsToValidate = ["skills", "experience", "education"];
    }
    
    const isValid = await trigger(fieldsToValidate);
    
    if (isValid) {
      if (currentSection === "basic") {
        setActiveSection("professional");
      } else if (currentSection === "professional") {
        setActiveSection("details");
      }
    }
  };

  const onSubmit = async (data: z.infer<typeof jobseekerSchema>) => {
    setServerError(null);
    setIsSuccess(false);

    if (!user?.id) {
      setServerError("User authentication required. Please login again.");
      return;
    }

    if (!data.resume) {
      setServerError("Please select a resume file.");
      return;
    }

    try {
      const formattedData = {
        ...data,
        consultantId: String(user.id),
        skills: data.skills.split(",").map(s => s.trim()).filter(Boolean),
      };
      
      await createJobSeeker(formattedData).unwrap();
      setIsSuccess(true);
      reset();
      setFileSelected(false);
      setFileName("");
      setSkillsArray([]);
      setActualFile(null);
      
      // Reset to first section
      setActiveSection("basic");
    } catch (error: any) {
      setServerError(error?.data?.message || "Submission failed. Please try again.");
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 bg-background">
      <Navbar />
      
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Add New Job Seeker</h1>
            <p className="text-muted-foreground mt-1">Add a new job seeker to your professional network</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/job-seekers">Cancel</Link>
          </Button>
        </div>
        
        {isSuccess && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertTitle className="text-green-800">Success!</AlertTitle>
            <AlertDescription className="text-green-700">
              Job seeker added successfully.
              <div className="mt-2 flex space-x-4">
                <Button size="sm" asChild>
                  <Link href="/job-seekers">View All Job Seekers</Link>
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsSuccess(false)}>
                  Add Another
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {serverError && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Job Seeker Profile</CardTitle>
                <CardDescription>
                  Fill out the job seeker's information to help match them with the right opportunities.
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="mb-6">
                  <div className="flex border-b border-border">
                    <button
                      type="button"
                      className={`py-2 px-4 text-sm font-medium ${activeSection === "basic" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
                      onClick={() => setActiveSection("basic")}
                    >
                      Basic Info
                    </button>
                    <button
                      type="button"
                      className={`py-2 px-4 text-sm font-medium ${activeSection === "professional" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
                      onClick={() => setActiveSection("professional")}
                    >
                      Professional
                    </button>
                    <button
                      type="button"
                      className={`py-2 px-4 text-sm font-medium ${activeSection === "details" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
                      onClick={() => setActiveSection("details")}
                    >
                      Details & Resume
                    </button>
                  </div>
                </div>
                
                <form onSubmit={handleSubmit(onSubmit)} id="jobSeekerForm" className="space-y-6">
                  {/* Basic Info Section */}
                  {activeSection === "basic" && (
                    <div className="space-y-5">
                      <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Full Name</label>
                          <Input 
                            {...register("name")} 
                            placeholder="Enter job seeker's full name"
                            className={errors.name ? "border-red-300" : ""}
                          />
                          {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Email</label>
                          <Input 
                            {...register("email")} 
                            placeholder="professional@example.com"
                            className={errors.email ? "border-red-300" : ""}
                          />
                          {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                        </div>
                      </div>
                      
                      <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Phone</label>
                          <Input 
                            {...register("phone")} 
                            placeholder="+1 (555) 123-4567"
                            className={errors.phone ? "border-red-300" : ""}
                          />
                          {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Location</label>
                          <Input 
                            {...register("location")} 
                            placeholder="City, State, Country"
                            className={errors.location ? "border-red-300" : ""}
                          />
                          {errors.location && <p className="text-red-500 text-sm">{errors.location.message}</p>}
                        </div>
                      </div>
                      
                      <div className="pt-4 flex justify-end">
                        <Button 
                          type="button"
                          onClick={() => handleNextSection("basic")}
                        >
                          Next: Professional Info
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Professional Tab */}
                  {activeSection === "professional" && (
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Skills</label>
                        <div className="flex">
                          <Input 
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={handleSkillKeyDown}
                            placeholder="Type a skill and press Enter (e.g. JavaScript, Project Management)"
                            className="flex-1"
                          />
                          <Button 
                            type="button" 
                            onClick={addSkill} 
                            className="ml-2"
                            disabled={!skillInput.trim()}
                          >
                            Add
                          </Button>
                        </div>
                        
                        {/* Hidden input for form validation */}
                        <input type="hidden" {...register("skills")} />
                        
                        {/* Skills tags display */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {skillsArray.map((skill, index) => (
                            <div 
                              key={index}
                              className="py-1 px-3 bg-card text-foreground rounded-md border border-border flex items-center"
                            >
                              {skill}
                              <button
                                type="button"
                                className="h-4 w-4 p-0 ml-2 text-muted-foreground hover:text-destructive"
                                onClick={() => removeSkill(skill)}
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        {errors.skills && <p className="text-red-500 text-sm">{errors.skills.message}</p>}
                        {skillsArray.length > 0 && (
                          <p className="text-muted-foreground text-xs">
                            {skillsArray.length} skill{skillsArray.length !== 1 ? 's' : ''} added
                          </p>
                        )}
                      </div>
                      
                      <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Experience (Years)</label>
                          <Input 
                            {...register("experience", { valueAsNumber: true })} 
                            type="number" 
                            min="0"
                            className={errors.experience ? "border-red-300" : ""}
                          />
                          {errors.experience && <p className="text-red-500 text-sm">{errors.experience.message}</p>}
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Education</label>
                          <Input 
                            {...register("education")} 
                            placeholder="Highest degree, Major, University"
                            className={errors.education ? "border-red-300" : ""}
                          />
                          {errors.education && <p className="text-red-500 text-sm">{errors.education.message}</p>}
                        </div>
                      </div>
                      
                      <div className="pt-4 flex justify-between">
                        <Button 
                          type="button"
                          variant="outline"
                          onClick={() => setActiveSection("basic")}
                        >
                          Back
                        </Button>
                        
                        <Button 
                          type="button"
                          onClick={() => handleNextSection("professional")}
                        >
                          Next: Upload Resume
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Details Tab */}
                  {activeSection === "details" && (
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">About the Job Seeker</label>
                        <Textarea 
                          {...register("about")} 
                          placeholder="Provide a brief description about the job seeker's background, career goals, and strengths..."
                          className={`min-h-[150px] ${errors.about ? "border-red-300" : ""}`}
                        />
                        {errors.about && <p className="text-red-500 text-sm">{errors.about.message}</p>}
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Resume</label>
                        
                        <div 
                          className={`border-2 border-dashed rounded-md p-6 text-center ${
                            isDragging ? 'border-primary bg-primary/5' : 'border-border'
                          } ${errors.resume ? "border-destructive" : ""}`}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                        >
                          {fileSelected ? (
                            <div className="space-y-2">
                              <p className="text-sm font-medium">{fileName}</p>
                              <p className="text-xs text-muted-foreground">File selected successfully</p>
                              <div className="flex justify-center space-x-2 mt-2">
                                {parsedData && (
                                  <Button 
                                    type="button" 
                                    variant="default" 
                                    size="sm"
                                    onClick={fillFormWithResumeData}
                                  >
                                    Fill Data
                                  </Button>
                                )}
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setFileSelected(false);
                                    setFileName("");
                                    setParsedData(null);
                                    setValue("resume", "", { shouldValidate: true });
                                  }}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Drag and drop a resume file, or click to browse</p>
                              <p className="text-xs text-muted-foreground">Supports PDF, DOCX, RTF (Max 5MB)</p>
                              <Input
                                type="file"
                                onChange={handleFileChange}
                                className="hidden"
                                accept=".pdf,.doc,.docx,.rtf"
                                id="resume-upload"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById('resume-upload')?.click()}
                              >
                                Browse Files
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        {/* Hidden input to store the file path */}
                        <input type="hidden" {...register("resume")} />
                        {errors.resume && <p className="text-red-500 text-sm">{errors.resume.message}</p>}
                      </div>
                      
                      {isProcessing && (
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Loader2 className="animate-spin" />
                          <span>{processingMessage}</span>
                        </div>
                      )}

                      {!isProcessing && processingMessage && (
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>{processingMessage}</span>
                        </div>
                      )}
                      
                      <div className="pt-4 flex justify-between">
                        <Button 
                          type="button"
                          variant="outline"
                          onClick={() => setActiveSection("professional")}
                        >
                          Back
                        </Button>
                        
                        <Button 
                          type="submit"
                          form="jobSeekerForm"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Submitting..." : "Add Job Seeker"}
                        </Button>
                      </div>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
          
          {/* Right sidebar */}
          <div className="md:col-span-1">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Form Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Completion</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div 
                      className="bg-primary h-2.5 rounded-full transition-all duration-500" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Current Step</h4>
                  <div className="text-sm py-2 px-3 bg-muted rounded-md">
                    {activeSection === "basic" && "1. Entering basic information"}
                    {activeSection === "professional" && "2. Adding professional details"}
                    {activeSection === "details" && "3. Uploading resume & additional info"}
                  </div>
                </div>
                
                <div className="border-t border-border pt-4 mt-4"></div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Tips</h4>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Use comma or Enter key to add multiple skills</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Detailed profiles get more job matches</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Resume is required for automatic skill extraction</span>
                    </li>
                  </ul>
                </div>
                
                <div className="p-3 bg-yellow-500/10 dark:bg-yellow-500/5 rounded-md border border-yellow-500/20 dark:border-yellow-500/10">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    All fields are required for optimal job matching
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}