import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios, { AxiosError } from "axios";

interface CustomUser extends User {
  role: string;
  roleId: number;
  token: string;
  avatar: string;
  pages: string[];
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<CustomUser | null> {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Email and password required");
        }

        try {
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
            {
              email: credentials.username,
              password: credentials.password,
            }
          );

          const { data } = response.data;


          if (data) {
            return {
              id: String(data.user.id),
              email: data.user.email,
              name: data.user.name,
              avatar: data.user.profilePicture,
              role: data.user.role,
              roleId: data.user.roleId,
              pages: data.user.pages,
              token: data.token,
            };
          }
          throw new Error("Invalid credentials");
        } catch (error) {
          if (error instanceof AxiosError) {
            throw new Error(error.response?.data?.message || "Authentication failed");
          }
          throw new Error("Authentication failed");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const customUser = user as CustomUser;
        token.role = customUser.role;
        token.roleId = customUser.roleId;
        token.avatar = customUser.avatar;
        token.accessToken = customUser.token;
        token.pages = customUser.pages;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.role = token.role;
        session.user.roleId = token.roleId;
        session.user.avatar = token.avatar;
        session.user.accessToken = token.accessToken;
        session.user.pages = token.pages;
      }
      return session;
    }
  },
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}
