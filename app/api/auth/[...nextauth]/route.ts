import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { AuthOptions } from "next-auth";
import axios from "axios";
import https from "https";

  

const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        phone: { label: "Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
        try {
          const httpsAgent = new https.Agent({
            rejectUnauthorized: false,
          });
          const res = await axios.post(
            `${API_URL}/account/create_token/`,
            {
              phone: credentials?.phone,
              password: credentials?.password,
            },
            { httpsAgent }
          );
          const user = res.data;
          console.log("user: ", user);
          if (user?.access && user?.refresh) {
            return user;
          }
          return null;
        } catch (err) {
          console.error("Error during authorization:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.access = user.access;
        token.refresh = user.refresh;
        token.user = user.user;
        return token;
      }
      return token;
    },
    async session({ session, token }) {
      session.access = token.access;
      session.refresh = token.refresh;
      session.user = token.user;
      session.error = token.error;
      return session;
    },
  },
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };