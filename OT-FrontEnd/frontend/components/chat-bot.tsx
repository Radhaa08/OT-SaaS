import React, { useState, useRef, useEffect } from 'react';
import { X, Phone, Send, Minimize, Maximize, User, Clock, PhoneCall, MessageSquare, Paperclip, Mic, Image, Smile, ThumbsUp, ThumbsDown, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';

// Enhanced responses with followups
const chatResponses = [
  {
    keywords: ['hello', 'hi', 'hey', 'start'],
    response: "Hello! I'm your OpenTheory support assistant. How can I help you today? You can ask me about job applications, resume management, or account settings.",
    followups: ["How do I upload my resume?", "Tell me about premium plans", "I need help with my job application"]
  },
  {
    keywords: ['account', 'create account', 'sign up', 'register'],
    response: "To create an account, click the 'Sign Up' button on our homepage. You'll need to provide your email and create a password. You can also sign up using your Google or LinkedIn accounts for quicker access.",
    followups: ["What information do I need to provide?", "Is there a verification process?", "Can I use my social media accounts?"]
  },
  {
    keywords: ['resume', 'upload resume', 'cv'],
    response: "To upload your resume, go to your profile dashboard and click on 'Upload Resume'. We accept PDF, DOCX, or RTF formats up to 5MB in size. You can update your resume anytime by uploading a new version.",
    followups: ["Can I have multiple resumes?", "How do I set my default resume?", "Can I parse my LinkedIn profile?"]
  },
  {
    keywords: ['forgot', 'password', 'reset'],
    response: "If you've forgotten your password, click on 'Forgot Password' on the login page. We'll send a password reset link to your registered email address. For security reasons, the link expires after 24 hours.",
    followups: ["I didn't receive the reset email", "How often can I reset my password?", "Can I change my email address?"]
  },
  {
    keywords: ['job', 'jobs', 'application', 'apply'],
    response: "You can browse available jobs from your dashboard. Use filters to narrow down results by location, skills, experience level, and more. To apply, simply click the 'Apply' button on any job listing that interests you.",
    followups: ["How do I track my applications?", "Can I save job listings?", "What happens after I apply?"]
  },
  {
    keywords: ['search', 'find', 'filter'],
    response: "Our advanced search features allow you to filter jobs by technology, location, experience level, salary range, and more. You can save search preferences and set up job alerts to get notified about new matching positions.",
    followups: ["How do I set up job alerts?", "Can I exclude certain companies?", "How often are new jobs added?"]
  },
  {
    keywords: ['premium', 'subscription', 'upgrade', 'plans'],
    response: "Our premium plans offer advanced features like priority job matching, unlimited applications, and exclusive job listings. Visit the 'Subscription' page from your dashboard to view plans and pricing details.",
    followups: ["What are the different premium tiers?", "Is there a free trial?", "How do I cancel my subscription?"]
  },
  {
    keywords: ['contact', 'support', 'help', 'human'],
    response: "Need to speak with our support team? You can email us at enterprise@opentheory.com or call us at +1 (888) 123-4567 during business hours (9AM-7PM EST). Premium users get priority support.",
    followups: ["What's the average response time?", "Do you offer weekend support?", "Can I schedule a call?"]
  },
  {
    keywords: ['thank', 'thanks', 'ok', 'okay'],
    response: "You're welcome! Is there anything else I can help you with today?",
    followups: ["No, that's all", "Yes, I have another question", "Can I give feedback?"]
  }
];

// Default messages
const defaultMessages: Message[] = [
  {
    sender: 'bot',
    text: "Hello! I'm your OpenTheory support assistant. How can I help you today?",
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  },
  {
    sender: 'bot',
    text: "You can ask me about job applications, resume management, or account settings. Or select one of these common topics:",
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
];

// Quick reply options
const quickReplies = [
  "How do I upload my resume?",
  "How to search for jobs?",
  "I forgot my password",
  "Tell me about premium plans",
  "Profile visibility settings",
  "Contact support team"
];

// Types for messages
interface Message {
  sender: 'user' | 'bot';
  text: string;
  time: string;
  attachments?: {type: string, name: string}[];
  isTyping?: boolean;
  feedbackGiven?: 'positive' | 'negative' | null;
}

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userEmail?: string;
  isLoggedIn?: boolean;
  theme?: 'light' | 'dark' | 'system';
}

const ChatBot: React.FC<ChatBotProps> = ({ 
  isOpen, 
  onClose, 
  userName = 'Guest',
  userEmail,
  isLoggedIn = false,
  theme = 'system'
}) => {
  const [messages, setMessages] = useState<Message[]>(defaultMessages);
  const [inputMessage, setInputMessage] = useState("");
  const [minimized, setMinimized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCallOptions, setShowCallOptions] = useState(false);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [suggestedFollowups, setSuggestedFollowups] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [chatHeight, setChatHeight] = useState("500px");
  const [chatWidth, setChatWidth] = useState("400px");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize chat with user info if available
  useEffect(() => {
    if (isLoggedIn && userName !== 'Guest') {
      setMessages([
        ...defaultMessages,
        {
          sender: 'bot',
          text: `Welcome back, ${userName}! How can I assist you today?`,
          time: formatTime()
        }
      ]);
    }
  }, [isLoggedIn, userName]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = () => {
    if (inputMessage.trim() === "") return;

    const userMessage: Message = {
      sender: 'user',
      text: inputMessage,
      time: formatTime()
    };

    setMessages([...messages, userMessage]);
    setInputMessage("");
    setShowEmojiPicker(false);
    setShowAttachmentOptions(false);
    setLoading(true);
    
    // Simulate processing delay
    setTimeout(() => {
      const response = generateResponse(inputMessage);
      
      // Add typing indicator
      const typingMessage: Message = {
        sender: 'bot',
        text: '',
        time: formatTime(),
        isTyping: true
      };
      
      setMessages(prev => [...prev, typingMessage]);
      
      // Simulate typing delay based on message length
      const typingDelay = Math.min(Math.max(response.response.length * 10, 800), 2000);
      
      setTimeout(() => {
        setMessages(prev => prev.filter(msg => !msg.isTyping));
        
        // Add actual response
        const botMessage: Message = {
          sender: 'bot',
          text: response.response,
          time: formatTime()
        };
        
        setMessages(prev => [...prev, botMessage]);
        setSuggestedFollowups(response.followups || []);
        setLoading(false);
      }, typingDelay);
    }, 500);
  };

  const handleQuickReply = (reply: string) => {
    const userMessage: Message = {
      sender: 'user',
      text: reply,
      time: formatTime()
    };

    setMessages([...messages, userMessage]);
    setSuggestedFollowups([]);
    setLoading(true);

    setTimeout(() => {
      const response = generateResponse(reply);
      
      // Add typing indicator
      const typingMessage: Message = {
        sender: 'bot',
        text: '',
        time: formatTime(),
        isTyping: true
      };
      
      setMessages(prev => [...prev, typingMessage]);
      
      setTimeout(() => {
        setMessages(prev => prev.filter(msg => !msg.isTyping));
        
        const botMessage: Message = {
          sender: 'bot',
          text: response.response,
          time: formatTime()
        };
        
        setMessages(prev => [...prev, botMessage]);
        setSuggestedFollowups(response.followups || []);
        setLoading(false);
      }, 1200);
    }, 500);
  };

  const generateResponse = (userInput: string) => {
    const input = userInput.toLowerCase();
    
    // Find matching response based on keywords
    for (const item of chatResponses) {
      if (item.keywords.some(keyword => input.includes(keyword))) {
        return {
          response: item.response,
          followups: item.followups
        };
      }
    }
    
    // Default response if no keywords match
    return {
      response: "I'm not sure I understand your question. You can ask about account creation, resume uploads, job applications, or premium features. Or you can contact our support team directly for more specific assistance.",
      followups: ["Contact support team", "Browse help center", "Return to main menu"]
    };
  };

  const initiateCall = (callType: string) => {
    setShowCallOptions(false);
    setMessages(prev => [...prev, {
      sender: 'bot',
      text: `Initiating ${callType} call. Please wait while we connect you with a support representative...`,
      time: formatTime()
    }]);
    
    setTimeout(() => {
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: "A support representative will call you shortly. You may close this chat window or continue chatting while you wait.",
        time: formatTime()
      }]);
    }, 2000);
  };

  const handleFileUpload = (type: string) => {
    setShowAttachmentOptions(false);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const fileType = file.type.split('/')[0];
      const fileName = file.name;
      
      const userMessage: Message = {
        sender: 'user',
        text: `Attached file: ${fileName}`,
        time: formatTime(),
        attachments: [{type: fileType, name: fileName}]
      };
      
      setMessages([...messages, userMessage]);
      
      setTimeout(() => {
        setMessages(prev => [...prev, {
          sender: 'bot',
          text: `Thank you for uploading ${fileName}. Our team will review your file soon. Is there anything specific you'd like to ask about this file?`,
          time: formatTime()
        }]);
      }, 1500);
    }
  };

  const handleFeedback = (messageIndex: number, feedback: 'positive' | 'negative') => {
    const updatedMessages = [...messages];
    updatedMessages[messageIndex] = {
      ...updatedMessages[messageIndex],
      feedbackGiven: feedback
    };
    
    setMessages(updatedMessages);
    
    setTimeout(() => {
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: feedback === 'positive' 
          ? "Thank you for your positive feedback! We're glad that was helpful." 
          : "Thank you for your feedback. We'll work on improving our responses.",
        time: formatTime()
      }]);
    }, 500);
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const resizeChat = (size: 'default' | 'large' | 'fullscreen') => {
    switch (size) {
      case 'default':
        setChatHeight("500px");
        setChatWidth("400px");
        break;
      case 'large':
        setChatHeight("600px");
        setChatWidth("450px");
        break;
      case 'fullscreen':
        setChatHeight("80vh");
        setChatWidth("500px");
        break;
    }
  };

  if (!isOpen) return null;

  // Simple emoji set
  const emojis = ["😊", "👍", "👋", "🙏", "🤔", "😄", "❤️", "👀", "🎉", "💼", "📄"];

  return (
    <div 
      className="fixed bottom-4 right-4 z-50 flex flex-col bg-background border border-border rounded-lg shadow-lg transition-all"
      style={{ height: minimized ? '56px' : chatHeight, width: minimized ? '288px' : chatWidth }}
    >
      {/* Chat header */}
      <div className="flex items-center justify-between p-3 bg-primary text-primary-foreground rounded-t-lg">
        <div className="flex items-center">
          <div className="bg-green-500 h-2 w-2 rounded-full mr-2"></div>
          <span className="font-medium">OpenTheory Support</span>
          {isLoggedIn && (
            <span className="ml-2 text-xs bg-green-700 px-2 py-0.5 rounded-full">Premium</span>
          )}
        </div>
        <div className="flex space-x-2">
          {!minimized && (
            <>
              <button 
                onClick={() => resizeChat('default')} 
                className="text-primary-foreground hover:text-white"
                title="Default size"
              >
                <div className="h-3 w-3 border border-current rounded-sm"></div>
              </button>
              <button 
                onClick={() => resizeChat('large')} 
                className="text-primary-foreground hover:text-white"
                title="Large size"
              >
                <div className="h-4 w-4 border border-current rounded-sm"></div>
              </button>
              <button 
                onClick={() => resizeChat('fullscreen')} 
                className="text-primary-foreground hover:text-white"
                title="Full screen"
              >
                <Maximize size={16} />
              </button>
            </>
          )}
          
          {minimized ? (
            <button onClick={() => setMinimized(false)} className="text-primary-foreground hover:text-white">
              <Maximize size={16} />
            </button>
          ) : (
            <button onClick={() => setMinimized(true)} className="text-primary-foreground hover:text-white">
              <Minimize size={16} />
            </button>
          )}
          <button onClick={onClose} className="text-primary-foreground hover:text-white">
            <X size={16} />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Chat messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-background">
            {messages.map((message, index) => (
              <div key={index} className={`mb-4 ${message.sender === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block rounded-lg px-3 py-2 max-w-[85%] ${
                  message.sender === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-foreground'
                }`}>
                  {message.isTyping ? (
                    <div className="flex space-x-1 h-6 items-center justify-center">
                      <div className="h-2 w-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="h-2 w-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                      <div className="h-2 w-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
                    </div>
                  ) : (
                    <>
                      {message.text}
                      {message.attachments && message.attachments.map((attachment, i) => (
                        <div key={i} className="mt-2 p-2 bg-background/50 rounded flex items-center gap-2 text-sm">
                          {attachment.type === 'image' && <Image size={16} />}
                          {attachment.type === 'application' && <Paperclip size={16} />}
                          {attachment.name}
                        </div>
                      ))}
                    </>
                  )}
                </div>
                <div className={`text-xs text-muted-foreground mt-1 flex items-center gap-1 ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}>
                  <Clock size={10} />
                  {message.time}
                  
                  {/* Feedback buttons */}
                  {message.sender === 'bot' && !message.isTyping && (
                    <div className="flex items-center ml-2">
                      {message.feedbackGiven ? (
                        <span className="text-xs text-green-500">Thank you</span>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleFeedback(index, 'positive')}
                            className="text-muted-foreground hover:text-green-500 transition-colors"
                          >
                            <ThumbsUp size={12} />
                          </button>
                          <button 
                            onClick={() => handleFeedback(index, 'negative')}
                            className="text-muted-foreground hover:text-red-500 transition-colors ml-1"
                          >
                            <ThumbsDown size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Follow-up suggestions */}
            {suggestedFollowups.length > 0 && !loading && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">Suggested replies:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedFollowups.map((followup, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickReply(followup)}
                      className="text-xs bg-muted hover:bg-muted/80 text-foreground px-2 py-1 rounded-full transition-colors"
                    >
                      {followup}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Call options */}
          {showCallOptions && (
            <div className="p-3 bg-muted border-t border-border">
              <p className="text-sm mb-2 font-medium text-center">How would you like to talk to support?</p>
              <div className="flex justify-center space-x-3">
                <Button variant="outline" className="flex-1 flex items-center justify-center" onClick={() => initiateCall('voice')}>
                  <Phone className="h-4 w-4 mr-1" />
                  Voice Call
                </Button>
                <Button variant="outline" className="flex-1 flex items-center justify-center" onClick={() => initiateCall('video')}>
                  <PhoneCall className="h-4 w-4 mr-1" />
                  Video Call
                </Button>
              </div>
              <div className="flex justify-center mt-2">
                <Button variant="ghost" className="text-xs" onClick={() => setShowCallOptions(false)}>
                  Back to chat
                </Button>
              </div>
            </div>
          )}
          
          {/* Attachment options */}
          {showAttachmentOptions && (
            <div className="p-3 bg-muted border-t border-border">
              <p className="text-xs mb-2 font-medium">Select file type:</p>
              <div className="flex justify-center space-x-3">
                <Button variant="outline" size="sm" className="text-xs" onClick={() => handleFileUpload('image')}>
                  <Image size={14} className="mr-1" />
                  Image
                </Button>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => handleFileUpload('document')}>
                  <Paperclip size={14} className="mr-1" />
                  Document
                </Button>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => handleFileUpload('resume')}>
                  <User size={14} className="mr-1" />
                  Resume
                </Button>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileInputChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <div className="flex justify-center mt-2">
                <Button variant="ghost" className="text-xs" onClick={() => setShowAttachmentOptions(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
          
          {/* Emoji picker */}
          {showEmojiPicker && (
            <div className="p-2 bg-background border-t border-border">
              <div className="flex flex-wrap gap-2 justify-center">
                {emojis.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => handleEmojiSelect(emoji)}
                    className="text-lg hover:bg-muted p-1 rounded transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick replies */}
          {messages.length <= 3 && !showCallOptions && !showAttachmentOptions && (
            <div className="p-3 border-t border-border">
              <p className="text-xs mb-2 text-muted-foreground">Quick options:</p>
              <div className="flex flex-wrap gap-2">
                {quickReplies.map((reply, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickReply(reply)}
                    className="text-xs bg-muted hover:bg-muted/80 text-foreground px-2 py-1 rounded-full transition-colors"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Help section */}
          <div className="border-t border-border">
            <div className="p-2">
              <button 
                onClick={() => toggleSection('help')}
                className="w-full flex justify-between items-center text-xs text-muted-foreground hover:text-foreground"
              >
                <span>Help Center</span>
                <span>{expandedSection === 'help' ? '▲' : '▼'}</span>
              </button>
              
              {expandedSection === 'help' && (
                <div className="mt-2 text-xs">
                  <a href="#" className="flex items-center gap-1 p-1 hover:bg-muted rounded">
                    <MessageSquare size={12} />
                    <span>FAQs</span>
                  </a>
                  <a href="#" className="flex items-center gap-1 p-1 hover:bg-muted rounded">
                    <ExternalLink size={12} />
                    <span>Visit Help Center</span>
                  </a>
                  <a href="#" className="flex items-center gap-1 p-1 hover:bg-muted rounded">
                    <Phone size={12} />
                    <span>Call Support</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Chat input */}
          {!showCallOptions && (
            <div className="p-2 border-t border-border">
              <div className="flex items-center">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your message..."
                    className="w-full p-2 text-sm bg-background rounded-l-md focus:outline-none border-y border-l border-border"
                  />
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Smile size={16} />
                  </button>
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className="p-2 bg-primary text-primary-foreground rounded-r-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </button>
                <button
                  onClick={() => setShowAttachmentOptions(true)}
                  className="ml-2 p-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors"
                  title="Attach file"
                >
                  <Paperclip size={18} />
                </button>
                <button
                  onClick={() => setShowCallOptions(true)}
                  className="ml-2 p-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors"
                  title="Start call"
                >
                  <Phone size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ChatBot;