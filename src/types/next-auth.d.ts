import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "USER" | "ADMIN" | "CHATTER";
      chatterId?: string;
      agencyId?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    role: "USER" | "ADMIN" | "CHATTER";
    chatterId?: string;
    agencyId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: "USER" | "ADMIN" | "CHATTER";
    chatterId?: string;
    agencyId?: string;
  }
}
