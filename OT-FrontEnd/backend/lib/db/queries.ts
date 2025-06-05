import { desc, eq, and, like, gte, isNull, sql } from 'drizzle-orm';
import { db } from './drizzle';
import { jobSeekers, jobs, users, jobActivityLogs, ActivityType } from './schema';
import { Request } from 'express';

// User queries
export async function getUser(req: Request) {
  // This function would need to be implemented based on your session handling
  if (!req.cookies?.session) {
    return null;
  }
  
  try {
    // Parse user ID from session cookie
    const userId = parseInt(req.cookies.session); // Simplified; you'll need proper decoding
    
    const user = await getUserById(userId);
    return user;
  } catch (error) {
    //.error('Error getting user from session:', error);
    return null;
  }
}

export async function getUserById(id: number) {
  ////.log("is it coming her e2");
  const result = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .limit(1);
  ////.log(result);
  return result.length > 0 ? result[0] : null;
}

export async function getUserByEmail(email: string) {
  const result = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), isNull(users.deletedAt)))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

// Get all users with consultant role
export async function getAllConsultants(limit = 50, offset = 0) {
  return await db
    .select()
    .from(users)
    .where(and(
      eq(users.role, 'member'), // Changed from 'consultant' to 'member'
      isNull(users.deletedAt)
    ))
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);
}

// Get consultant by ID - for backwards compatibility
export async function getConsultantById(id: number) {
  //console.log("is it coming here ");
  return await getUserById(id);
}

// Get consultant by email - for backwards compatibility
export async function getConsultantByEmail(email: string) {
  return await getUserByEmail(email);
}

// Update user profile, unified for all user types
export async function updateUserProfile(id: number, data: Partial<{
  name: string;
  phone: string;
  avatar: string;
  bio: string;
  company: string;
  position: string;
  location: string;
  isPaid: boolean;
}>) {
  const result = await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date()
    })
    .where(eq(users.id, id))
    .returning();
  
  return result.length > 0 ? result[0] : null;
}

// JobSeeker queries
export async function createJobSeeker(data: {
  consultantId: number; // Changed to number to match users.id
  name: string;
  email: string;
  phone: string;
  resume: string;
  skills: string[];
  experience: number;
  education: string;
  location: string;
  about: string;
}) {
  const result = await db.insert(jobSeekers).values({
    ...data,
    addedDate: new Date()
  }).returning();
  return result[0];
}

export async function getJobSeekerById(id: string) {
  const result = await db
    .select()
    .from(jobSeekers)
    .where(eq(jobSeekers.id, id))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function getJobSeekersForConsultant(consultantId: number, limit = 50, offset = 0) {
  return await db
    .select()
    .from(jobSeekers)
    .where(eq(jobSeekers.consultantId, consultantId))
    .orderBy(desc(jobSeekers.addedDate))
    .limit(limit)
    .offset(offset);
}

export async function searchJobSeekers(params: {
  skills?: string[];
  location?: string;
  experience?: number;
  consultantId?: number; // Added to filter by consultant ID
  limit?: number;
  offset?: number;
}) {
  let query: any = db.select().from(jobSeekers);
  
  // Build conditions list
  const conditions = [];
  
  // Add consultant filter if provided
  if (params.consultantId !== undefined) {
    conditions.push(eq(jobSeekers.consultantId, params.consultantId));
  }
  
  if (params.skills && params.skills.length > 0) {
    for (const skill of params.skills) {
      conditions.push(sql`${jobSeekers.skills} @> ARRAY[${skill}]::text[]`);
    }
  }
  
  if (params.location) {
    conditions.push(like(jobSeekers.location, `%${params.location}%`));
  }
  
  if (params.experience !== undefined) {
    conditions.push(gte(jobSeekers.experience, params.experience));
  }

  // Apply all conditions in a single where clause if there are any
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  
  // Apply ordering and pagination
  return await query
    .orderBy(desc(jobSeekers.addedDate))
    .limit(params.limit || 50)
    .offset(params.offset || 0);
}

export async function updateJobSeeker(id: string, data: Partial<{
  name: string;
  phone: string;
  resume: string;
  skills: string[];
  experience: number;
  education: string;
  location: string;
  about: string;
}>) {
  const result = await db
    .update(jobSeekers)
    .set(data)
    .where(eq(jobSeekers.id, id))
    .returning();
  
  return result.length > 0 ? result[0] : null;
}

export async function deleteJobSeeker(id: string) {
  await db
    .delete(jobSeekers)
    .where(eq(jobSeekers.id, id));
}

// Job queries
export async function createJob(data: {
  title: string;
  company: string;
  location: string;
  description: string;
  skills: string[];
  salary: number;
  type: string;
  deadline: Date;
}) {
  const result = await db
    .insert(jobs)
    .values({
      ...data,
      status: 'active',
      postedDate: new Date()
    })
    .returning();
  
  return result[0];
}

export async function getJobById(id: string) {
  const result = await db
    .select()
    .from(jobs)
    .where(eq(jobs.id, id))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function getAllActiveJobs(limit = 50, offset = 0) {
  return await db
    .select()
    .from(jobs)
    .where(eq(jobs.status, 'active'))
    .orderBy(desc(jobs.postedDate))
    .limit(limit)
    .offset(offset);
}

export async function getAllJobs(limit = 50, offset = 0) {
  return await db
    .select()
    .from(jobs)
    .orderBy(desc(jobs.postedDate))
    .limit(limit)
    .offset(offset);
}

export async function searchJobs(params: {
  title?: string;
  company?: string;
  location?: string;
  skills?: string[];
  type?: string;
  limit?: number;
  offset?: number;
}) {
  // Create base query with initial active status filter
  const query = db.select().from(jobs);
  
  // Build conditions list
  const conditions = [eq(jobs.status, 'active')];
  
  if (params.title) {
    conditions.push(like(jobs.title, `%${params.title}%`));
  }
  
  if (params.company) {
    conditions.push(like(jobs.company, `%${params.company}%`));
  }
  
  if (params.location) {
    conditions.push(like(jobs.location, `%${params.location}%`));
  }
  
  if (params.skills && params.skills.length > 0) {
    for (const skill of params.skills) {
      conditions.push(sql`${jobs.skills} @> ARRAY[${skill}]::text[]`);
    }
  }
  
  if (params.type) {
    conditions.push(eq(jobs.type, params.type));
  }

  // Apply all conditions, ordering and pagination in a single chain
  return await query
    .where(and(...conditions))
    .orderBy(desc(jobs.postedDate))
    .limit(params.limit || 50)
    .offset(params.offset || 0);
}

export async function updateJob(id: string, data: Partial<{
  title: string;
  company: string;
  location: string;
  description: string;
  skills: string[];
  salary: number;
  type: string;
  deadline: Date;
  status: 'active' | 'closed';
}>) {
  const result = await db
    .update(jobs)
    .set(data)
    .where(eq(jobs.id, id))
    .returning();
  
  return result.length > 0 ? result[0] : null;
}

export async function closeJob(id: string) {
  const result = await db
    .update(jobs)
    .set({ status: 'closed' })
    .where(eq(jobs.id, id))
    .returning();
  
  return result.length > 0 ? result[0] : null;
}

// Activity logging functions - updated to use number for consultant IDs
export async function logActivity(data: {
  consultantId?: number; // Changed from string to number
  entityType: 'user' | 'jobseeker' | 'job'; // Changed from 'consultant' to 'user'
  entityId: string;
  action: ActivityType;
  details?: string;
  ipAddress?: string;
}) {
  const result = await db.insert(jobActivityLogs).values({
    consultantId: data.consultantId,
    entityType: data.entityType,
    entityId: data.entityId,
    action: data.action,
    details: data.details || '',
    ipAddress: data.ipAddress || 'unknown',
    timestamp: new Date()
  }).returning();
  
  return result[0];
}

// Renamed from getActivitiesForConsultant to getActivitiesForUser
export async function getActivitiesForUser(
  userId: number, // Changed from string to number
  limit = 50,
  offset = 0
) {
  return await db
    .select()
    .from(jobActivityLogs)
    .where(eq(jobActivityLogs.consultantId, userId))
    .orderBy(desc(jobActivityLogs.timestamp))
    .limit(limit)
    .offset(offset);
}

export async function getActivitiesForEntity(
  entityType: 'user' | 'jobseeker' | 'job', // Changed from 'consultant' to 'user'
  entityId: string,
  limit = 50,
  offset = 0
) {
  return await db
    .select()
    .from(jobActivityLogs)
    .where(
      and(
        eq(jobActivityLogs.entityType, entityType),
        eq(jobActivityLogs.entityId, entityId)
      )
    )
    .orderBy(desc(jobActivityLogs.timestamp))
    .limit(limit)
    .offset(offset);
}

export async function getRecentActivities(limit = 50, offset = 0) {
  return await db
    .select()
    .from(jobActivityLogs)
    .orderBy(desc(jobActivityLogs.timestamp))
    .limit(limit)
    .offset(offset);
}