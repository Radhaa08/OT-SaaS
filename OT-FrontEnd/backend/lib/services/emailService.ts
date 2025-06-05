import nodemailer, { Transporter } from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Email configuration
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587', 10);
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;

// Interface for email data
export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

// Email service class
class EmailService {
  // Fix: Initialize transporter with a default value or make it optional
  private transporter: Transporter | null = null;
  private initialized: boolean = false;

  constructor() {
    this.initializeTransporter();
  }

  // Initialize the email transporter
  private initializeTransporter(): void {
    try {
      if (!EMAIL_USER || !EMAIL_PASSWORD) {
        console.warn('Email credentials not provided. Email service will not work.');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: EMAIL_PORT,
        secure: EMAIL_PORT === 465, // true for 465, false for other ports
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASSWORD,
        },
      });

      this.initialized = true;
      console.log('Email service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize email service:', error);
    }
  }

  // Send an email
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.initialized || !this.transporter) {
      console.error('Email service not initialized');
      return false;
    }

    try {
      const mailOptions = {
        from: EMAIL_FROM,
        ...options,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  // Verify connection configuration
  async verifyConnection(): Promise<boolean> {
    if (!this.initialized || !this.transporter) {
      console.error('Email service not initialized');
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email connection verification failed:', error);
      return false;
    }
  }

  // Template-based email with job seeker details
  async sendJobSeekerEmail(options: {
    to: string;
    subject: string;
    jobSeekerName: string;
    jobSeekerSkills: string[];
    contactEmail: string;
    additionalDetails?: string;
  }): Promise<boolean> {
    const { to, subject, jobSeekerName, jobSeekerSkills, contactEmail, additionalDetails } = options;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Job Seeker Information</h2>
        <p>Hello,</p>
        <p>We would like to share information about a job seeker who might be a good fit:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Name:</strong> ${jobSeekerName}</p>
          <p><strong>Skills:</strong> ${jobSeekerSkills.join(', ')}</p>
          ${additionalDetails ? `<p><strong>Additional Details:</strong> ${additionalDetails}</p>` : ''}
        </div>
        <p>If you would like more information, please contact us at <a href="mailto:${contactEmail}">${contactEmail}</a>.</p>
        <p>Best regards,<br>The Recruitment Team</p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject,
      html,
    });
  }

  // Template-based email with job opportunity details
  async sendJobOpportunityEmail(options: {
    to: string;
    subject: string;
    jobTitle: string;
    company: string;
    location: string;
    description: string;
    contactEmail: string;
  }): Promise<boolean> {
    const { to, subject, jobTitle, company, location, description, contactEmail } = options;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Job Opportunity: ${jobTitle}</h2>
        <p>Hello,</p>
        <p>We have a new job opportunity that might interest you:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Position:</strong> ${jobTitle}</p>
          <p><strong>Company:</strong> ${company}</p>
          <p><strong>Location:</strong> ${location}</p>
          <p><strong>Description:</strong></p>
          <p>${description}</p>
        </div>
        <p>If you're interested or have questions, please contact us at <a href="mailto:${contactEmail}">${contactEmail}</a>.</p>
        <p>Best regards,<br>The Recruitment Team</p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject,
      html,
    });
  }
}

// Export a singleton instance
export const emailService = new EmailService();