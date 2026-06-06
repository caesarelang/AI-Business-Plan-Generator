// lib/auth.js
// Pastikan file ini ada persis seperti ini.
// Bagian terpenting: callbacks.jwt dan callbacks.session
// yang inject user.id dari database ke dalam token & session.

import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) return null;

        const hashed = hashPassword(credentials.password);
        if (hashed !== user.password) return null;

        // Return object — id is critical
        return {
          id:    user.id,
          email: user.email,
          name:  user.name,
        };
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    // Called when JWT is created or updated.
    // token.sub is set automatically by NextAuth to user.id from authorize().
    // We also explicitly set token.id for safety.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    // Called whenever session is checked.
    // Expose token.id as session.user.id so API routes can use it.
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id;
      } else if (token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};