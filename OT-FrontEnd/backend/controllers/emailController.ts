import { Request, Response } from 'express';
import { emailService } from '../lib/services/emailService';
import { z } from 'zod';
import crypto from 'crypto'; // Added import for crypto module

// Validate generic email request
const sendEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1),
  text: z.string().optional(),
  html: z.string().optional(),
  cc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
  bcc: z.union([z.string().email(), z.array(z.string().email())]).optional()
});

// Validate job seeker email request
const jobSeekerEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  jobSeekerName: z.string().min(1),
  jobSeekerSkills: z.array(z.string()),
  contactEmail: z.string().email(),
  additionalDetails: z.string().optional()
});

// Validate job opportunity email request
const jobOpportunityEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  jobTitle: z.string().min(1),
  company: z.string().min(1),
  location: z.string().min(1),
  description: z.string().min(1),
  contactEmail: z.string().email()
});

// Validate support request email
const supportRequestSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  html: z.string().min(1),
  cc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  company: z.string().min(1),
  issueType: z.string().min(1),
  priority: z.string().min(1),
  message: z.string().min(1),
});

// In-memory OTP storage (For production, consider using a database)
const otpStore: Record<string, { otp: string; expires: Date }> = {};

// Generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Validate OTP request schema
const otpRequestSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// Validate OTP verification schema
const otpVerificationSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

// Validate welcome email schema
const welcomeEmailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().optional(),
});

// Send a generic email
export const sendEmail = async (req: Request, res: Response) => {
  try {
    const validatedData = sendEmailSchema.parse(req.body);
    
    // Make sure we have either text or html content
    if (!validatedData.text && !validatedData.html) {
      return res.status(400).json({
        error: 'Email must contain either text or HTML content'
      });
    }

    const success = await emailService.sendEmail(validatedData);
    
    if (success) {
      res.status(200).json({ success: true, message: 'Email sent successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send email' });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'Invalid input data', 
        details: error.errors 
      });
    } else {
      console.error('Email sending error:', error);
      res.status(500).json({ error: 'Failed to send email' });
    }
  }
};

// Send a job seeker information email
export const sendJobSeekerEmail = async (req: Request, res: Response) => {
  try {
    const validatedData = jobSeekerEmailSchema.parse(req.body);
    
    const success = await emailService.sendJobSeekerEmail(validatedData);
    
    if (success) {
      res.status(200).json({ success: true, message: 'Job seeker email sent successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send job seeker email' });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'Invalid input data', 
        details: error.errors 
      });
    } else {
      console.error('Email sending error:', error);
      res.status(500).json({ error: 'Failed to send job seeker email' });
    }
  }
};

// Send a job opportunity email
export const sendJobOpportunityEmail = async (req: Request, res: Response) => {
  try {
    const validatedData = jobOpportunityEmailSchema.parse(req.body);
    
    const success = await emailService.sendJobOpportunityEmail(validatedData);
    
    if (success) {
      res.status(200).json({ success: true, message: 'Job opportunity email sent successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send job opportunity email' });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'Invalid input data', 
        details: error.errors 
      });
    } else {
      console.error('Email sending error:', error);
      res.status(500).json({ error: 'Failed to send job opportunity email' });
    }
  }
};

// Send a support request email
export const sendSupportRequestEmail = async (req: Request, res: Response) => {
  try {
    const validatedData = supportRequestSchema.parse(req.body);
    
    // Generate ticket ID if not provided
    const ticketId = req.body.ticketId || `${Date.now().toString().slice(-8)}`;
    
    // Send the email using the generic email function
    const emailData = {
      to: validatedData.to,
      subject: validatedData.subject,
      html: validatedData.html,
      cc: validatedData.cc,
    };
    
    const success = await emailService.sendEmail(emailData);
    
    if (success) {
      // In a production app, you would also save the ticket to a database here
      res.status(200).json({ 
        success: true, 
        message: 'Support request submitted successfully',
        ticketId 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to submit support request' 
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'Invalid input data', 
        details: error.errors 
      });
    } else {
      console.error('Support request error:', error);
      res.status(500).json({ error: 'Failed to submit support request' });
    }
  }
};

// Verify email service connection
export const verifyEmailService = async (_req: Request, res: Response) => {
  try {
    const isConnected = await emailService.verifyConnection();
    
    if (isConnected) {
      res.status(200).json({ success: true, message: 'Email service is properly configured' });
    } else {
      res.status(500).json({ success: false, message: 'Email service connection failed' });
    }
  } catch (error) {
    console.error('Email service verification error:', error);
    res.status(500).json({ error: 'Failed to verify email service' });
  }
};

/**
 * Send verification OTP to email
 * @route POST /email-auth/send-otp
 */
export const sendVerificationOtp = async (req: Request, res: Response) => {
  try {
    const { email } = otpRequestSchema.parse(req.body);
    
    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP with 60-second expiration
    const expiryTime = new Date();
    expiryTime.setSeconds(expiryTime.getSeconds() + 60); // 60 seconds expiration
    otpStore[email] = { otp, expires: expiryTime };
    
    // Send OTP email
    const success = await emailService.sendEmail({
      to: email,
      subject: 'Your Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Verification</h2>
          <p>Hello,</p>
          <p>Your verification code is:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0; text-align: center;">
            <h1 style="font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p>This code will expire in 60 seconds.</p>
          <p>If you didn't request this code, you can safely ignore this email.</p>
          <p>Best regards,<br>The Recruitment Team</p>
        </div>
      `,
    });
    
    if (success) {
      res.status(200).json({ 
        success: true, 
        message: 'Verification code sent successfully' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send verification code' 
      });
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        success: false,
        message: 'Invalid email address',
        details: error.errors 
      });
    } else {
      console.error('OTP sending error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to send verification code' 
      });
    }
  }
};

/**
 * Verify OTP code
 * @route POST /email-auth/verify-otp
 */
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = otpVerificationSchema.parse(req.body);
    
    // Check if OTP exists for this email
    if (!otpStore[email]) {
      return res.status(400).json({ 
        success: false, 
        message: 'No verification code found. Please request a new code.' 
      });
    }
    
    // Check if OTP has expired
    if (new Date() > otpStore[email].expires) {
      delete otpStore[email]; // Clean up expired OTP
      return res.status(400).json({ 
        success: false, 
        message: 'Verification code has expired. Please request a new code.' 
      });
    }
    
    // Check if OTP matches
    if (otpStore[email].otp !== otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid verification code' 
      });
    }
    
    // OTP is valid - clean up
    delete otpStore[email];
    
    res.status(200).json({ 
      success: true, 
      message: 'Email verified successfully' 
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        success: false,
        message: 'Invalid input data',
        details: error.errors 
      });
    } else {
      console.error('OTP verification error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to verify email' 
      });
    }
  }
};

/**
 * Send welcome email
 * @route POST /email-auth/welcome
 */
export const sendWelcomeEmail = async (req: Request, res: Response) => {
  try {
    const { email, name } = welcomeEmailSchema.parse(req.body);
    
    const success = await emailService.sendEmail({
      to: email,
      subject: 'Welcome to the Recruitment Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome${name ? ' ' + name : ''}!</h2>
          <p>Thank you for registering with our recruitment platform.</p>
          <p>Your account has been successfully created and verified. You can now access all the features and benefits of our platform.</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin-top: 0;">What's Next?</h3>
            <ul>
              <li>Complete your profile information</li>
              <li>Explore available job listings</li>
              <li>Connect with consultants</li>
              <li>Set up job alerts for positions that match your skills</li>
            </ul>
          </div>
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          <p>Best regards,<br>The Recruitment Team</p>
        </div>
      `,
    });
    
    if (success) {
      res.status(200).json({ 
        success: true, 
        message: 'Welcome email sent successfully' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send welcome email' 
      });
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        success: false,
        message: 'Invalid input data',
        details: error.errors 
      });
    } else {
      console.error('Welcome email error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to send welcome email' 
      });
    }
  }
};

// Add additional email auth functions as needed
export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = otpRequestSchema.parse(req.body);
    
    // Generate reset token (you can adjust the token generation logic)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 1); // 1 hour expiration
    
    // In production, store this token in your database
    // Here we'll use the OTP store but with a token instead of OTP
    otpStore[email] = { otp: resetToken, expires: tokenExpiry };
    
    // Create reset link (adjust baseUrl as needed)
    const baseUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}`;
    const resetLink = `${baseUrl}/reset-password?email=${encodeURIComponent(email)}&token=${resetToken}`;
    
    // Send reset email - don't store the result since we don't use it
    await emailService.sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password. If you didn't make this request, you can ignore this email.</p>
          <p>To reset your password, click the button below:</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>Best regards,<br>The Recruitment Team</p>
        </div>
      `,
    });
    
    // Always return success to prevent email enumeration
    res.status(200).json({ 
      success: true, 
      message: 'If the email exists in our system, a password reset link has been sent.' 
    });
    
  } catch (error) {
    console.error('Password reset request error:', error);
    
    // Always return success to prevent email enumeration
    res.status(200).json({ 
      success: true, 
      message: 'If the email exists in our system, a password reset link has been sent.' 
    });
  }
};

// Test route for sending emails without auth (for development only)
export const sendTestEmail = async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Route not found' });
  }
  
  try {
    const validatedData = sendEmailSchema.parse(req.body);
    
    // Make sure we have either text or html content
    if (!validatedData.text && !validatedData.html) {
      return res.status(400).json({
        error: 'Email must contain either text or HTML content'
      });
    }

    const success = await emailService.sendEmail(validatedData);
    
    if (success) {
      res.status(200).json({ success: true, message: 'Test email sent successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send test email' });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'Invalid input data', 
        details: error.errors 
      });
    } else {
      console.error('Test email sending error:', error);
      res.status(500).json({ error: 'Failed to send test email' });
    }
  }
};