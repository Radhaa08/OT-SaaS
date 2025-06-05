import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  uuid,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Merged users and consultants table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  
  // Session management fields
  sessionId: text('session_id'),
  expiryDate: timestamp('expiry_date'),
  
  // Consultant-specific fields ( all users are consultants)
  isPaid: boolean('is_paid').default(false), // Flag for paid users/consultants
  phone: varchar('phone', { length: 20 }).unique(),
  avatar: text('avatar'),
  bio: text('bio'),
  company: text('company'),
  position: text('position'),
  location: text('location'),
  
  // Common timestamp fields
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const jobSeekers = pgTable('job_seekers', {
  id: uuid('id').defaultRandom().primaryKey(),
  // Consultant ID references users table
  consultantId: integer('consultant_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone').notNull().unique(),
  resume: text('resume').notNull(),
  skills: text('skills').array().notNull(),
  experience: integer('experience').notNull(),
  education: text('education').notNull(),
  location: text('location').notNull(),
  about: text('about').notNull(),
  addedDate: timestamp('added_date').notNull().defaultNow(),
});

export const jobs = pgTable('jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  company: text('company').notNull(),
  location: text('location').notNull(),
  description: text('description').notNull(),
  skills: text('skills').array().notNull(),
  salary: integer('salary').notNull(),
  type: text('type').notNull(),
  postedDate: timestamp('posted_date').notNull().defaultNow(),
  deadline: timestamp('deadline').notNull(),
  status: text('status').notNull().default('active'),
  email: text('email')
});

// Activity logs table 
export const jobActivityLogs = pgTable('job_activity_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  // User ID (consultant) references users table
  consultantId: integer('consultant_id').references(() => users.id, { onDelete: 'set null' }),
  entityType: varchar('entity_type', { length: 20 }).notNull(), // 'user', 'jobseeker', 'job'
  entityId: text('entity_id').notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  details: text('details'),
  ipAddress: varchar('ip_address', { length: 45 }),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
});

// Relations for users (including consultant relations)
export const usersRelations = relations(users, ({ many }) => ({
  jobSeekers: many(jobSeekers),
  activityLogs: many(jobActivityLogs),
}));

export const jobSeekersRelations = relations(jobSeekers, ({ one }) => ({
  consultant: one(users, {
    fields: [jobSeekers.consultantId],
    references: [users.id],
  }),
}));

export const jobActivityLogsRelations = relations(jobActivityLogs, ({ one }) => ({
  consultant: one(users, {
    fields: [jobActivityLogs.consultantId],
    references: [users.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Update type exports for job platform
export type JobSeeker = typeof jobSeekers.$inferSelect;
export type NewJobSeeker = typeof jobSeekers.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type JobActivityLog = typeof jobActivityLogs.$inferSelect;
export type NewJobActivityLog = typeof jobActivityLogs.$inferInsert;

export enum ActivityType {
  // User activity types
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  
  // Job platform activity types
  CONSULTANT_CREATED = 'CONSULTANT_CREATED',
  CONSULTANT_UPDATED = 'CONSULTANT_UPDATED',
  JOB_SEEKER_ADDED = 'JOB_SEEKER_ADDED',
  JOB_SEEKER_UPDATED = 'JOB_SEEKER_UPDATED',
  JOB_SEEKER_DELETED = 'JOB_SEEKER_DELETED',
  JOB_POSTED = 'JOB_POSTED',
  JOB_UPDATED = 'JOB_UPDATED',
  JOB_CLOSED = 'JOB_CLOSED'
}