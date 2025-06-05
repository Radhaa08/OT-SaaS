import express, { Request, Response } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Define custom types for file upload
interface FileRequest extends Request {
  file?: Express.Multer.File;
}

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const consultantId = req.query.consultantId as string;

    if (!consultantId) {
      return cb(new Error('Missing consultantId'), '');
    }

    const dir = path.join(__dirname, '../uploads/resumes', consultantId);

    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const safeFilename = file.originalname.replace(/\s+/g, '_');
    cb(null, `${timestamp}_${safeFilename}`);
  }
});

// Fix the fileFilter function to use correct types
const fileFilter = (req: Request, file: Express.Multer.File, callback: FileFilterCallback) => {
  // Accept common document formats
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/rtf',
    'application/vnd.ms-word',
    'text/rtf',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    // Change this line - don't pass an Error object but use 'null' with false
    callback(null, false);
    // Optionally, you can add a message to the request object instead
    (req as any).fileValidationError = 'Invalid file type. Only PDF, DOC, DOCX, and RTF files are allowed.';
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: fileFilter
});

// POST endpoint to handle file uploads
router.post('/resume', upload.single('file'), (req: FileRequest, res: Response) => {
  try {
    const consultantId = req.query.consultantId as string;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!consultantId) {
      return res.status(400).json({ error: 'Consultant ID is required' });
    }

    // Create relative path to return to the frontend
    const relativePath = `/uploads/resumes/${consultantId}/${req.file.filename}`;

    return res.status(200).json({
      filePath: relativePath,
      message: 'File uploaded successfully'
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return res.status(500).json({
      error: 'Error uploading file',
      details: error.message
    });
  }
});

// Check if resume exists for a consultant
router.get('/resume/check/:consultantId', (req: Request, res: Response) => {
  try {
    const consultantId = req.params.consultantId;
    const dir = path.join(__dirname, '../uploads/resumes', consultantId);

    if (!fs.existsSync(dir)) {
      return res.status(200).json({ exists: false });
    }

    // Get list of files in directory
    const files = fs.readdirSync(dir);

    if (files.length === 0) {
      return res.status(200).json({ exists: false });
    }

    // Return the most recent file (assuming timestamp_filename format)
    files.sort((a, b) => {
      const aTime = parseInt(a.split('_')[0]);
      const bTime = parseInt(b.split('_')[0]);
      return bTime - aTime;
    });

    const latestFile = files[0];
    const relativePath = `/uploads/resumes/${consultantId}/${latestFile}`;

    return res.status(200).json({
      exists: true,
      path: relativePath
    });
  } catch (error: any) {
    console.error('Error checking for resume:', error);
    return res.status(500).json({
      error: 'Error checking for resume',
      details: error.message
    });
  }
});

export default router;
