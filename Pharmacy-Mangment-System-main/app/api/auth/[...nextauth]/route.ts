import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { compare } from 'bcryptjs';
import { AuthOptions } from 'next-auth';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Early return if missing credentials
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        try {
          await connectDB();
          
          // Find user by email only
          const user = await User.findOne({ email: credentials.email });
          
          if (!user || !(await compare(credentials.password, user.password))) {
            throw new Error('Invalid credentials');
          }

          // Return user data
          return {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            name: user.name,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const customUser = user as { id: string; role: string; name: string };
        token.id = customUser.id;
        token.role = customUser.role;
        token.name = customUser.name;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user = {
          ...session.user,
          id: token.id as string,
          role: token.role as string,
          name: token.name as string,
        };
      }
      return session;
    },
  },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };