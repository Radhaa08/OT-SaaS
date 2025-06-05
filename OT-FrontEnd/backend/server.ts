import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path'; // Add this line 
import router from './routes';
import { optionalAuth } from './lib/auth/middleware';
import { testDatabaseConnection } from './lib/db/drizzle';

dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookieParser());

// Optional authentication middleware
app.use(optionalAuth);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, this is the backend server!');
});

app.use('/api', router);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start the server and test the database connection
const startServer = async () => {
  try {
    // Test database connection first
    await testDatabaseConnection();
    
    // Start the server after successful database connection test
    app.listen(PORT, () => {
      console.log(`🚀 Backend Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();