// types/express/index.d.ts
import { User } from '@prisma/client'; // optional

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        // add other fields if needed
      };
    }
  }
}
