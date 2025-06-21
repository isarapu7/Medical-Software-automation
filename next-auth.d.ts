import "next-auth";
import { DefaultSession } from "next-auth";

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      role?: string;
      id: string;
    } & DefaultSession["user"];
  }

  // Extend the built-in user types
  interface User {
    role?: string;
    id: string;
  }
}

// For JWT
declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    id:string;
  }
}
