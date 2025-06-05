import { Router, Request, Response } from "express";
import {
  createJob,
  getJobById,
  getAllActiveJobs,
  getAllJobs,
  searchJobs,
  updateJob,
  closeJob,
  getActivitiesForEntity
} from '../lib/db/queries';
import { ActivityType } from '../lib/db/schema';
import { logJobActivity } from '../lib/utils';

const router = Router();

// Create job
router.post('/', async (req: Request, res: Response) => {
  try {
    const { 
      title, 
      company, 
      location, 
      description, 
      skills, 
      salary, 
      type, 
      deadline,
      consultantId // Optional - if posted by a consultant
    } = req.body;
    
    // Create job
    const job = await createJob({
      title,
      company,
      location,
      description,
      skills,
      salary,
      type,
      deadline: new Date(deadline)
    });
    
    // Log activity
    await logJobActivity(
      req,
      consultantId,
      job.id,
      ActivityType.JOB_POSTED,
      `Job "${title}" posted by ${company}`
    );
    
    return res.status(201).json(job);
  } catch (error) {
    console.error('Create job error:', error);
    return res.status(500).json({ error: 'Failed to create job posting' });
  }
});

// Get all active jobs
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;
    
    const jobs = await getAllActiveJobs(limit, offset);
    return res.status(200).json(jobs);
  } catch (error) {
    console.error('Get jobs error:', error);
    return res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

router.get('/all', async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;
    
    const jobs = await getAllJobs(limit, offset);
    return res.status(200).json(jobs);
  } catch (error) {
    console.error('Get all jobs error:', error);
    return res.status(500).json({ error: 'Failed to fetch all jobs' });
  }
});

// Search jobs
router.get('/search', async (req: Request, res: Response) => {
  try {
    const title = req.query.title ? String(req.query.title) : undefined;
    const company = req.query.company ? String(req.query.company) : undefined;
    const location = req.query.location ? String(req.query.location) : undefined;
    const skills = req.query.skills ? String(req.query.skills).split(',') : undefined;
    const type = req.query.type ? String(req.query.type) : undefined;
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;
    
    const jobs = await searchJobs({
      title,
      company,
      location,
      skills,
      type,
      limit,
      offset
    });
    
    return res.status(200).json(jobs);
  } catch (error) {
    console.error('Search jobs error:', error);
    return res.status(500).json({ error: 'Failed to search jobs' });
  }
});

// Get job by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const job = await getJobById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    return res.status(200).json(job);
  } catch (error) {
    console.error('Get job error:', error);
    return res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// Update job
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { 
      title, 
      company, 
      location, 
      description, 
      skills, 
      salary, 
      type, 
      deadline,
      consultantId // Optional - if updated by a consultant
    } = req.body;
    
    const jobId = req.params.id;
    
    // Check if job exists
    const existingJob = await getJobById(jobId);
    if (!existingJob) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Update job
    const updatedJob = await updateJob(jobId, {
      title,
      company,
      location,
      description,
      skills,
      salary,
      type,
      deadline: deadline ? new Date(deadline) : undefined
    });
    
    // Log activity
    await logJobActivity(
      req,
      consultantId,
      jobId,
      ActivityType.JOB_UPDATED,
      `Job "${title || existingJob.title}" updated`
    );
    
    return res.status(200).json(updatedJob);
  } catch (error) {
    console.error('Update job error:', error);
    return res.status(500).json({ error: 'Failed to update job' });
  }
});

// Close job
router.post('/:id/close', async (req: Request, res: Response) => {
  try {
    const jobId = req.params.id;
    const { consultantId } = req.body; // Optional - if closed by a consultant
    
    // Check if job exists
    const existingJob = await getJobById(jobId);
    if (!existingJob) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Close job
    const closedJob = await closeJob(jobId);
    
    // Log activity
    await logJobActivity(
      req,
      consultantId,
      jobId,
      ActivityType.JOB_CLOSED,
      `Job "${existingJob.title}" closed`
    );
    
    return res.status(200).json(closedJob);
  } catch (error) {
    console.error('Close job error:', error);
    return res.status(500).json({ error: 'Failed to close job' });
  }
});

// Get job activities
router.get('/:id/activities', async (req: Request, res: Response) => {
  try {
    const jobId = req.params.id;
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;
    
    // Check if job exists
    const existingJob = await getJobById(jobId);
    if (!existingJob) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const activities = await getActivitiesForEntity('job', jobId, limit, offset);
    return res.status(200).json(activities);
  } catch (error) {
    console.error('Get job activities error:', error);
    return res.status(500).json({ error: 'Failed to fetch job activities' });
  }
});

export default router;
