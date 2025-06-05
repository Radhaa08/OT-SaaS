import { emailService } from './emailService';
import { getUserByEmail } from '../db/queries';
import crypto from 'crypto';

// This service manages sending verification emails, password reset emails, etc.
export class EmailAuthService {
  // Generate a verification token
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Send verification email
  async sendVerificationEmail(email: string, baseUrl: string): Promise<boolean> {
    const user = await getUserByEmail(email);
    if (!user) {
      return false;
    }

    const token = this.generateToken();
    // Store token in database or in-memory storage with expiration
    // For simplicity in this example, we'll just generate and send it
    
    const verificationLink = `${baseUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

    return await emailService.sendEmail({
      to: email,
      subject: 'Verify your email address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Verify Your Email</h2>
          <p>Hello ${user.name || 'there'},</p>
          <p>Please click the link below to verify your email address:</p>
          <p><a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 4px;">Verify Email</a></p>
          <p>If you did not create an account, you can ignore this email.</p>
          <p>Best regards,<br>The Team</p>
        </div>
      `
    });
  }

  // Send password reset email
  async sendPasswordResetEmail(email: string, baseUrl: string): Promise<boolean> {
    const user = await getUserByEmail(email);
    if (!user) {
      return false;
    }

    const token = this.generateToken();
    // Store token in database with expiration
    // For simplicity in this example, we'll just generate and send it
    
    const resetLink = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    return await emailService.sendEmail({
      to: email,
      subject: 'Reset your password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Reset Your Password</h2>
          <p>Hello ${user.name || 'there'},</p>
          <p>We received a request to reset your password. Click the link below to reset it:</p>
          <p><a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a></p>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <p>Best regards,<br>The Team</p>
        </div>
      `
    });
  }

  // Send welcome email
  async sendWelcomeEmail(email: string): Promise<boolean> {
    const user = await getUserByEmail(email);
    if (!user) {
      return false;
    }

    return await emailService.sendEmail({
      to: email,
      subject: 'Welcome to our platform!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome Aboard!</h2>
          <p>Hello ${user.name || 'there'},</p>
          <p>Thank you for joining our platform. We're excited to have you with us!</p>
          <p>If you have any questions, feel free to contact our support team.</p>
          <p>Best regards,<br>The Team</p>
        </div>
      `
    });
  }
}

// Export a singleton instance
export const emailAuthService = new EmailAuthService();
