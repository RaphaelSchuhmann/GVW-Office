// Augment the Express Request type to include `user` populated by our
// authentication middleware. Keep this file free of imports so it is
// treated as a global augmentation and picked up by the compiler.
declare global {
  namespace Express {
    // Adjust the type as needed (string | number | object).
    interface Request {
      user?: string;
    }
  }
}

export {};

// Some setups use the types defined in 'express-serve-static-core' for the
// Request interface (generic form). Augment that module as well to ensure
// whichever module is used by @types/express picks up the `user` property.
declare module 'express-serve-static-core' {
  interface Request {
    user?: string;
  }
}
