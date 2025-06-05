import React from 'react';

interface SupportMailProps {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  issueType: string;
  priority: string;
  message: string;
  ticketId: string;
}

export function generateSupportRequestEmail({
  firstName,
  lastName,
  email,
  company,
  issueType,
  priority,
  message,
  ticketId
}: SupportMailProps): string {
  // Format response time based on priority
  const responseTime = priority.includes('Critical') || priority.includes('High')
    ? '4 hours'
    : '24 hours';

  // Format message with line breaks for HTML
  const formattedMessage = message.replace(/\n/g, '<br>');
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
        <h1 style="color: #333;">Support Request Received</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
        <p>Dear ${firstName} ${lastName},</p>
        <p>Thank you for contacting OpenTheory Support. Your request has been successfully recorded and assigned to our support team.</p>
        <p><strong>Request Reference:</strong> #${ticketId}</p>
        <p><strong>Priority:</strong> ${priority}</p>
        <p>A member of our team will review your request and respond within ${responseTime}.</p>
        <p>Below is a copy of your support request:</p>
        <div style="background-color: #f8f9fa; padding: 15px; margin: 15px 0; border-left: 4px solid #0070f3;">
          <h2 style="margin-top: 0;">Support Request Details</h2>
          <p><strong>Name:</strong> ${firstName} ${lastName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Company:</strong> ${company}</p>
          <p><strong>Issue Type:</strong> ${issueType}</p>
          <p><strong>Priority:</strong> ${priority}</p>
          <p><strong>Message:</strong></p>
          <p>${formattedMessage}</p>
        </div>
        <p>If you need to provide additional information, please reply to this email or reference your request number in a new support ticket.</p>
        <p>Best regards,<br>OpenTheory Support Team</p>
      </div>
      <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        <p>© ${new Date().getFullYear()} OpenTheory. All rights reserved.</p>
        <p>This is an automated message, please do not reply directly to this email.</p>
      </div>
    </div>
  `;
}
