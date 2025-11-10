import "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    username?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      isInternal?: boolean;
    }
  }
}
