import { User } from '../lib/db/schema';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};
