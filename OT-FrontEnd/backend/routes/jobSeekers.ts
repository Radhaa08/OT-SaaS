import { Router, Request, Response } from "express";
import {
  createJobSeeker,
  getJobSeekerById,
  getJobSeekersForConsultant,
  searchJobSeekers,
  updateJobSeeker,
  deleteJobSeeker,
  getConsultantById,
  getActivitiesForEntity
} from '../lib/db/queries';
import { ActivityType } from '../lib/db/schema';
import { logJobSeekerActivity } from '../lib/utils';

const router = Router();

// Create job seeker
router.post('/', async (req: Request, res: Response) => {
  try {
    const { 
      consultantId, 
      name, 
      email, 
      phone, 
      resume, 
      skills, 
      experience, 
      education, 
      location, 
      about 
    } = req.body;
    
    // Validate consultant exists - convert to number
    const consultant = await getConsultantById(Number(consultantId));
    if (!consultant) {
      return res.status(404).json({ error: 'Consultant not found' });
    }
    
    // Create job seeker - ensure consultantId is a number
    const jobSeeker = await createJobSeeker({
      consultantId: Number(consultantId),
      name,
      email,
      phone,
      resume,
      skills,
      experience,
      education,
      location,
      about
    });
    
    // Log activity
    await logJobSeekerActivity(
      req,
      Number(consultantId), // Convert to number to match updated function signature
      jobSeeker.id,
      ActivityType.JOB_SEEKER_ADDED,
      `Job seeker ${name} added`
    );
    
    return res.status(201).json(jobSeeker);
  } catch (error) {
    console.error('Create job seeker error:', error);
    return res.status(500).json({ error: 'Failed to create job seeker' });
  }
});

// Get job seekers by consultant ID
router.get('/consultant/:consultantId', async (req: Request, res: Response) => {
  try {
   
    const consultantId = Number(req.params.consultantId);
    //console.log(consultantId); // Convert string to number
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;
    
    // Validate consultant exists
    const consultant = await getConsultantById(consultantId);
    if (!consultant) {
      return res.status(404).json({ error: 'Consultant not found' });
    }
    //console.log(consultant);
    const jobSeekers = await getJobSeekersForConsultant(consultantId, limit, offset);
    return res.status(200).json(jobSeekers);
  } catch (error) {
    console.error('Get job seekers error:', error);
    return res.status(500).json({ error: 'Failed to fetch job seekers' });
  }
});

// Search job seekers
router.get('/search', async (req: Request, res: Response) => {
  try {
    const skills = req.query.skills ? String(req.query.skills).split(',') : undefined;
    const location = req.query.location ? String(req.query.location) : undefined;
    const experience = req.query.experience ? Number(req.query.experience) : undefined;
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;
    
    const jobSeekers = await searchJobSeekers({
      skills,
      location,
      experience,
      limit,
      offset
    });
    
    return res.status(200).json(jobSeekers);
  } catch (error) {
    console.error('Search job seekers error:', error);
    return res.status(500).json({ error: 'Failed to search job seekers' });
  }
});

// Get job seeker by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const jobSeeker = await getJobSeekerById(req.params.id);
    
    if (!jobSeeker) {
      return res.status(404).json({ error: 'Job seeker not found' });
    }
    
    return res.status(200).json(jobSeeker);
  } catch (error) {
    console.error('Get job seeker error:', error);
    return res.status(500).json({ error: 'Failed to fetch job seeker' });
  }
});

// Update job seeker
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      phone, 
      resume, 
      skills, 
      experience, 
      education, 
      location, 
      about 
    } = req.body;
    
    const jobSeekerId = req.params.id;
    
    // Check if job seeker exists
    const existingJobSeeker = await getJobSeekerById(jobSeekerId);
    if (!existingJobSeeker) {
      return res.status(404).json({ error: 'Job seeker not found' });
    }
    
    // Update job seeker
    const updatedJobSeeker = await updateJobSeeker(jobSeekerId, {
      name,
      phone,
      resume,
      skills,
      experience,
      education,
      location,
      about
    });
    
    // Log activity
    await logJobSeekerActivity(
      req,
      Number(existingJobSeeker.consultantId), // Convert to number to match updated function
      jobSeekerId,
      ActivityType.JOB_SEEKER_UPDATED,
      `Job seeker ${name || existingJobSeeker.name} updated`
    );
    
    return res.status(200).json(updatedJobSeeker);
  } catch (error) {
    console.error('Update job seeker error:', error);
    return res.status(500).json({ error: 'Failed to update job seeker' });
  }
});

// Delete job seeker
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const jobSeekerId = req.params.id;
    
    // Check if job seeker exists
    const existingJobSeeker = await getJobSeekerById(jobSeekerId);
    if (!existingJobSeeker) {
      return res.status(404).json({ error: 'Job seeker not found' });
    }
    
    // Log activity before deletion
    await logJobSeekerActivity(
      req,
      Number(existingJobSeeker.consultantId), // Convert to number to match updated function
      jobSeekerId,
      ActivityType.JOB_SEEKER_DELETED,
      `Job seeker ${existingJobSeeker.name} deleted`
    );
    
    // Delete job seeker
    await deleteJobSeeker(jobSeekerId);
    
    return res.status(200).json({ message: 'Job seeker deleted successfully' });
  } catch (error) {
    console.error('Delete job seeker error:', error);
    return res.status(500).json({ error: 'Failed to delete job seeker' });
  }
});

// Get job seeker activities
router.get('/:id/activities', async (req: Request, res: Response) => {
  try {
    const jobSeekerId = req.params.id;
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;
    
    // Check if job seeker exists
    const existingJobSeeker = await getJobSeekerById(jobSeekerId);
    if (!existingJobSeeker) {
      return res.status(404).json({ error: 'Job seeker not found' });
    }
    
    const activities = await getActivitiesForEntity('jobseeker', jobSeekerId, limit, offset);
    return res.status(200).json(activities);
  } catch (error) {
    console.error('Get job seeker activities error:', error);
    return res.status(500).json({ error: 'Failed to fetch job seeker activities' });
  }
});

export default router;