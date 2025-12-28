import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
            include: {
              creatorProfiles: {
                select: { slug: true },
              },
            },
          });

          if (!user || !user.passwordHash) {
            return null;
          }

          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.passwordHash
          );

          if (!isValid) {
            return null;
          }

          // Check if email is verified
          if (!user.emailVerified) {
            throw new Error("EMAIL_NOT_VERIFIED");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role as "ADMIN" | "USER",
            isCreator: user.isCreator,
            creatorSlug: user.creatorProfiles?.[0]?.slug || null,
          };
        } catch (error: any) {
          // Propagate email not verified error
          if (error?.message === "EMAIL_NOT_VERIFIED") {
            throw new Error("EMAIL_NOT_VERIFIED");
          }
          console.error("[AUTH ERROR]", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle Google sign in - create or update user
      if (account?.provider === "google" && user.email) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: { creatorProfiles: { select: { slug: true } } },
          });

          if (existingUser) {
            // Update existing user with Google info if needed
            if (!existingUser.image && user.image) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: { image: user.image },
              });
            }
            // Set user.id to existing user id for JWT
            user.id = existingUser.id;
            (user as any).role = existingUser.role;
            (user as any).isCreator = existingUser.isCreator;
            (user as any).creatorSlug = existingUser.creatorProfiles?.[0]?.slug || null;
          } else {
            // Create new user
            const newUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || user.email.split("@")[0],
                image: user.image,
                role: "USER",
                isCreator: false,
              },
            });
            user.id = newUser.id;
            (user as any).role = "USER";
            (user as any).isCreator = false;
            (user as any).creatorSlug = null;
          }
        } catch (error) {
          console.error("[GOOGLE SIGNIN ERROR]", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "USER";
        token.isCreator = (user as any).isCreator || false;
        token.creatorSlug = (user as any).creatorSlug || null;
      }

      // Refresh user data from database when session is updated
      if (trigger === "update" && token.id) {
        try {
          const freshUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            include: { creatorProfiles: { select: { slug: true } } },
          });
          if (freshUser) {
            token.role = freshUser.role as "ADMIN" | "USER";
            token.isCreator = freshUser.isCreator;
            token.creatorSlug = freshUser.creatorProfiles?.[0]?.slug || null;
          }
        } catch (error) {
          console.error("[JWT REFRESH ERROR]", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).isCreator = token.isCreator || false;
        (session.user as any).creatorSlug = token.creatorSlug || null;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
});
