'use client';

import React, { useState } from 'react';
import { Button } from "../../components/ui/button";
import Link from 'next/link';
import { 
  Mail, Phone, MessageSquare, HelpCircle, FileText, 
  ArrowRight, ChevronDown, Search, Clock,
  Check, AlertCircle, Loader2
} from 'lucide-react';
import Navbar from "../../components/navbar";
import ChatBot from "../../components/chat-bot";
import { useSendSupportEmailMutation } from "../../apiSlice/emailApiSlice";
import { generateSupportRequestEmail } from '../../components/supportMail';

export default function SupportPage() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState("Select issue type");
  const [selectedPriority, setSelectedPriority] = useState("Select priority");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [sendSupportEmail] = useSendSupportEmailMutation();

  const faqData = [
    {
      id: 'faq1',
      question: 'How do I create an account on the platform?',
      answer: 'To register, visit our sign-up page and create an account using your email and password. Alternatively, you can use OAuth-based authentication through Google or LinkedIn. After registration, you\'ll receive a confirmation email to verify your account before you can start using our services.'
    },
    {
      id: 'faq2',
      question: 'How do I upload my resume?',
      answer: 'After logging in, navigate to the "Profile" section and select "Upload Resume." You can upload PDF, DOCX, or RTF files. Your resume will be securely stored and associated with your profile. You can update your resume at any time by uploading a new version, which will replace the existing one.'
    },
    {
      id: 'faq3',
      question: 'How does the job matching algorithm work?',
      answer: 'Our job matching algorithm analyzes your profile information, resume content, and specified preferences to recommend relevant job opportunities. The system identifies keywords, skills, and experience levels from your profile and matches them against available job listings. The more complete your profile is, the better our matching algorithm can work for you.'
    },
    {
      id: 'faq4',
      question: 'What filters are available for job searching?',
      answer: 'Our platform offers comprehensive filtering options including technology/skills, location, experience level, job type (full-time, contract, remote), salary range, and company. You can save your filter preferences for future searches and set up job alerts based on specific filtering criteria.'
    },
    {
      id: 'faq5',
      question: 'How can I receive job alerts?',
      answer: 'To set up job alerts, go to the "Notifications" section in your dashboard and configure your preferences. You can specify the frequency (daily, weekly), delivery method (email, in-app), and criteria for alerts. You\'ll receive notifications whenever new job listings match your specified criteria.'
    },
    {
      id: 'faq6',
      question: 'What analytics do I get about my resume?',
      answer: 'With our resume analytics feature, you can track views, downloads, and engagement with your profile. Premium users receive additional insights such as comparison to other applicants, keyword effectiveness analysis, and suggestions for resume improvement based on successful applications in similar roles.'
    },
    {
      id: 'faq7',
      question: 'What premium features are available and how do I subscribe?',
      answer: 'Premium features include advanced resume analytics, priority job matching, unlimited job applications, and access to exclusive job listings. To subscribe, visit the "Subscription" page in your dashboard and select a plan. We accept payments through Stripe, with monthly and annual subscription options available.'
    },
    {
      id: 'faq8',
      question: 'How can I update my skills and profile information?',
      answer: 'Access your profile management section from the dashboard to update personal information, technical skills, experience, and job preferences. Keeping your profile updated ensures more accurate job matches and recommendations. You can also link external profiles like GitHub or LinkedIn for enhanced credibility.'
    },
    {
      id: 'faq9',
      question: 'Which job boards are integrated with the platform?',
      answer: 'We integrate with major job boards and platforms including LinkedIn, Indeed, Glassdoor, and specialized tech job sites. Our API integrations ensure you get access to a wide range of opportunities without having to visit multiple sites. Premium users get access to exclusive listings not available on public job boards.'
    },
    {
      id: 'faq10',
      question: 'How do I get support if I encounter issues?',
      answer: 'For technical support or questions, use the "Support" section in your dashboard to submit a ticket. Our team typically responds within 24 hours. Premium users receive priority support with faster response times. You can also check our knowledge base for common issues and solutions.'
    }
  ];

  const toggleDropdown = (id: string) => {
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    const results = faqData
      .filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map(faq => faq.question);
    
    setSearchResults(results);
    setShowSearchResults(true);
    
    results.forEach(question => {
      const faq = faqData.find(f => f.question === question);
      if (faq) setActiveDropdown(faq.id);
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setIsSubmitting(true);
    setSubmissionError(null);
    
    const formData = new FormData(form);
    const firstName = formData.get('first-name') as string;
    const lastName = formData.get('last-name') as string;
    const email = formData.get('email') as string;
    const company = formData.get('company') as string;
    const message = formData.get('message') as string;
    
    const ticketId = `${Date.now().toString().slice(-8)}`;
    
    try {
      const emailHtml = generateSupportRequestEmail({
        firstName,
        lastName,
        email,
        company,
        issueType: selectedIssue,
        priority: selectedPriority,
        message,
        ticketId
      });
      
      await sendSupportEmail({
        to: email,
        subject: "Your OpenTheory Support Request Confirmation",
        html: emailHtml,
        cc: "help@opentheory.in",
        firstName,
        lastName,
        email,
        company,
        issueType: selectedIssue,
        priority: selectedPriority,
        message
      }).unwrap();
      
      form.reset();
      setSelectedIssue("Select issue type");
      setSelectedPriority("Select priority");
      setSubmissionSuccess(true);
      
      setTimeout(() => {
        setSubmissionSuccess(false);
      }, 5000);
    } catch (error) {
      console.error("Failed to send confirmation email:", error);
      setSubmissionError("Failed to submit your request. Please try again or contact us directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />
      
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-muted relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="container px-4 md:px-6 text-center mx-auto relative z-10">
          <div className="flex flex-col items-center space-y-6 max-w-3xl mx-auto">
            <div className="inline-block p-3 bg-primary/10 rounded-full">
              <HelpCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter">
              Consultant Support Center
            </h1>
            <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed max-w-2xl">
              Get assistance with your job search, resume management, and account settings. Our team is ready to help you find your perfect tech opportunity.
            </p>
            
            <div className="relative w-full max-w-2xl mt-4">
              <form onSubmit={handleSearch} className="relative">
                <div className="flex items-center border-2 border-border rounded-lg overflow-hidden">
                  <div className="px-4 py-2">
                    <Search className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search our knowledge base..." 
                    className="flex-1 py-3 px-2 outline-none bg-background" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button 
                    type="submit"
                    className="bg-primary text-primary-foreground px-5 py-3 font-medium"
                  >
                    Search
                  </button>
                </div>
              </form>
              
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-30">
                  <div className="p-4">
                    <h3 className="font-medium mb-2">Search Results:</h3>
                    <ul className="space-y-2">
                      {searchResults.map((result, index) => (
                        <li key={index} className="text-sm">
                          <Button 
                            variant="link" 
                            className="text-primary p-0 h-auto"
                            onClick={() => {
                              const faq = faqData.find(f => f.question === result);
                              if (faq) {
                                setActiveDropdown(faq.id);
                                document.getElementById('faq-section')?.scrollIntoView({
                                  behavior: 'smooth'
                                });
                              }
                              setShowSearchResults(false);
                            }}
                          >
                            {result}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              {showSearchResults && searchResults.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-30">
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground">No results found for "{searchQuery}"</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid gap-6 lg:grid-cols-3 lg:gap-12 max-w-5xl mx-auto">
            <div className="rounded-xl border-2 border-border bg-card p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center">
                  <Mail className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold">Email Support</h3>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <span className="flex h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                  Available Now
                </div>
                <p className="text-sm text-muted-foreground">Response time: within 4 business hours</p>
                <p className="text-primary font-medium">enterprise@opentheory.com</p>
                <Button className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white" asChild>
                  <Link href="mailto:enterprise@opentheory.com">
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email
                  </Link>
                </Button>
              </div>
            </div>
            <div className="rounded-xl border-2 border-border bg-card p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-purple-50 rounded-full w-16 h-16 flex items-center justify-center">
                  <Phone className="h-7 w-7 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold">Phone Support</h3>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  <Clock className="h-3 w-3 mr-1" />
                  9AM-7PM EST
                </div>
                <p className="text-sm text-muted-foreground">Dedicated account manager available</p>
                <p className="text-primary font-medium">+1 (888) 123-4567</p>
                <Button className="mt-2 w-full bg-purple-600 hover:bg-purple-700 text-white" asChild>
                  <Link href="tel:+18881234567">
                    <Phone className="mr-2 h-4 w-4" />
                    Call Now
                  </Link>
                </Button>
              </div>
            </div>
            <div className="rounded-xl border-2 border-border bg-card p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-green-50 rounded-full w-16 h-16 flex items-center justify-center">
                  <MessageSquare className="h-7 w-7 text-green-600" />
                </div>
                <h3 className="text-xl font-bold">Live Chat</h3>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <span className="flex h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                  24/7 Support
                </div>
                <p className="text-sm text-muted-foreground">Average response time: 2 minutes</p>
                <p className="text-muted-foreground">Enterprise plan feature</p>
                <Button 
                  className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setChatbotOpen(true)}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Start Chat
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted" id="faq-section">
        <div className="container px-4 md:px-6 mx-auto text-center">
          <div className="flex flex-col items-center space-y-4 mb-8 max-w-3xl mx-auto">
            <div className="inline-block p-3 bg-background rounded-full shadow-sm">
              <FileText className="h-7 w-7 text-foreground" />
            </div>
            <h2 className="text-3xl font-bold tracking-tighter">Submit a Support Request</h2>
            <p className="text-muted-foreground md:text-xl/relaxed">
              Our consultant support team typically responds within 24 hours.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
            <div className="text-left rounded-lg border-2 border-border bg-card p-6 shadow-md">
              <h3 className="text-xl font-bold mb-6 text-center">Frequently Asked Questions</h3>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {faqData.map(faq => (
                  <div key={faq.id} className="border border-border rounded-lg overflow-hidden bg-card">
                    <button 
                      className="flex justify-between items-center w-full p-4 text-left font-medium"
                      onClick={() => toggleDropdown(faq.id)}
                    >
                      {faq.question}
                      <ChevronDown className={`h-5 w-5 transition-transform ${activeDropdown === faq.id ? 'transform rotate-180' : ''}`} />
                    </button>
                    {activeDropdown === faq.id && (
                      <div className="p-4 pt-0 border-t border-border">
                        <p className="text-sm text-muted-foreground">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="rounded-lg border-2 border-border bg-card p-6 shadow-md text-left">
              <h3 className="text-xl font-bold mb-4 text-center">Enterprise Support Request</h3>
              <p className="text-sm text-muted-foreground mb-6 text-center">
                Please provide detailed information about your issue for faster resolution.
              </p>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="first-name" className="text-sm font-medium">
                      First Name*
                    </label>
                    <input 
                      id="first-name" 
                      name="first-name"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="John" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="last-name" className="text-sm font-medium">
                      Last Name*
                    </label>
                    <input 
                      id="last-name" 
                      name="last-name"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Doe" 
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email*
                  </label>
                  <input 
                    id="email" 
                    name="email"
                    type="email" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="john@company.com" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="company" className="text-sm font-medium">
                    Company Name*
                  </label>
                  <input 
                    id="company" 
                    name="company"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Acme Corporation" 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Issue Type*
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      onClick={() => toggleDropdown('issueType')}
                    >
                      {selectedIssue}
                      <ChevronDown className={`h-4 w-4 transition-transform ${activeDropdown === 'issueType' ? 'transform rotate-180' : ''}`} />
                    </button>
                    
                    {activeDropdown === 'issueType' && (
                      <div className="absolute z-10 mt-1 w-full rounded-md border border-input bg-background shadow-lg">
                        <div className="py-1">
                          {['Technical Issue', 'Billing Question', 'Feature Request', 'Integration Support', 'Security Concern', 'Training Request', 'Account Management'].map((item) => (
                            <div
                              key={item}
                              className="px-3 py-2 text-sm hover:bg-muted cursor-pointer"
                              onClick={() => {
                                setSelectedIssue(item);
                                toggleDropdown('issueType');
                              }}
                            >
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Priority*
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      onClick={() => toggleDropdown('priority')}
                    >
                      {selectedPriority}
                      <ChevronDown className={`h-4 w-4 transition-transform ${activeDropdown === 'priority' ? 'transform rotate-180' : ''}`} />
                    </button>
                    
                    {activeDropdown === 'priority' && (
                      <div className="absolute z-10 mt-1 w-full rounded-md border border-input bg-background shadow-lg">
                        <div className="py-1">
                          {[
                            { name: 'Critical - System Down', color: 'bg-red-100 text-red-800' },
                            { name: 'High - Major Functionality Impacted', color: 'bg-orange-100 text-orange-800' },
                            { name: 'Medium - Limited Functionality', color: 'bg-yellow-100 text-yellow-800' },
                            { name: 'Low - General Question', color: 'bg-green-100 text-green-800' }
                          ].map((item) => (
                            <div
                              key={item.name}
                              className="px-3 py-2 text-sm hover:bg-muted cursor-pointer flex items-center"
                              onClick={() => {
                                setSelectedPriority(item.name);
                                toggleDropdown('priority');
                              }}
                            >
                              <span className={`inline-block w-3 h-3 rounded-full ${item.color.split(' ')[0]} mr-2`}></span>
                              {item.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">
                    Message*
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Please describe your issue in detail including any error messages, steps to reproduce, and affected systems..."
                    rows={5}
                    required
                  />
                </div>
                
                {submissionSuccess && (
                  <div className="p-3 rounded-md bg-green-50 text-green-700 border border-green-200">
                    <p className="text-sm flex items-center">
                      <Check className="h-4 w-4 mr-2" />
                      Support request submitted successfully. A confirmation email has been sent to your inbox.
                    </p>
                  </div>
                )}
                
                {submissionError && (
                  <div className="p-3 rounded-md bg-red-50 text-red-700 border border-red-200">
                    <p className="text-sm flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {submissionError}
                    </p>
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 text-white py-2.5"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>Submit Enterprise Request <ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
                
                <p className="text-xs text-muted-foreground text-center mt-4">
                  By submitting this form, you agree to our privacy policy and terms of service.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6 mx-auto text-center">
          <div className="flex flex-col items-center space-y-4 mb-12 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tighter">Consultant Resources</h2>
            <p className="text-muted-foreground md:text-xl/relaxed">
              Access our comprehensive resources to enhance your job search and maximize your opportunities.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            <div className="rounded-xl border-2 border-border bg-card p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Resume Guidelines</h3>
              <p className="text-sm text-muted-foreground mb-5">
                Access our resume templates, formatting guides, and keyword optimization tips to make your profile stand out to employers.
              </p>
              <Button variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-50">
                View Guidelines
              </Button>
            </div>
            <div className="rounded-xl border-2 border-border bg-card p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="bg-purple-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Consultant Community</h3>
              <p className="text-sm text-muted-foreground mb-5">
                Connect with other tech professionals in our community forum to share job search strategies and industry insights.
              </p>
              <Button variant="outline" className="w-full border-purple-600 text-purple-600 hover:bg-purple-50">
                Join Community
              </Button>
            </div>
            <div className="rounded-xl border-2 border-border bg-card p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="bg-green-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Skill Development</h3>
              <p className="text-sm text-muted-foreground mb-5">
                Access our learning resources, certification guides, and technical skill assessments to improve your job market value.
              </p>
              <Button variant="outline" className="w-full border-green-600 text-green-600 hover:bg-green-50">
                Explore Resources
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <section className="w-full py-12 md:py-16 bg-muted">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between md:space-x-8 space-y-6 md:space-y-0">
            <div className="space-y-4 max-w-lg">
              <h3 className="text-2xl font-bold">Premium Consultant Features</h3>
              <p className="text-muted-foreground">
                Upgrade to premium for advanced resume analytics, priority job matching, and exclusive job listings.
              </p>
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-white py-3 px-8" asChild>
              <Link href="/pricing">
                View Premium Plans
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <ChatBot isOpen={chatbotOpen} onClose={() => setChatbotOpen(false)} />
    </div>
  );
}