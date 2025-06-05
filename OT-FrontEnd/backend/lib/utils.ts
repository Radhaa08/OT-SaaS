import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Request } from 'express';
import { logActivity } from "./db/queries";
import { ActivityType } from "./db/schema";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}

export function getIP(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded && typeof forwarded === 'string') {
    return forwarded.split(',')[0];
  }
  return req.socket.remoteAddress;
}

// Activity logging helpers - FIXED: Changed consultantId type from string to number
export async function logConsultantActivity(
  req: Request,
  consultantId: number, // Changed from string to number
  action: ActivityType,
  details?: string
) {
  return await logActivity({
    consultantId,
    entityType: 'user',
    entityId: String(consultantId), // Convert to string for entityId
    action,
    details,
    ipAddress: getIP(req)
  });
}

export async function logJobSeekerActivity(
  req: Request,
  consultantId: number, // Changed from string to number
  jobSeekerId: string,
  action: ActivityType,
  details?: string
) {
  return await logActivity({
    consultantId,
    entityType: 'jobseeker',
    entityId: jobSeekerId,
    action,
    details,
    ipAddress: getIP(req)
  });
}

export async function logJobActivity(
  req: Request,
  consultantId: number | undefined, // Changed from string|undefined to number|undefined
  jobId: string,
  action: ActivityType,
  details?: string
) {
  return await logActivity({
    consultantId,
    entityType: 'job',
    entityId: jobId,
    action,
    details,
    ipAddress: getIP(req)
  });
}

// Format date to a readable string
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

// Format money amounts
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}