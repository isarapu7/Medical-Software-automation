import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Define role-based access paths
    const adminPaths = ['/admin'];
    const supplierPaths = ['/supplier'];
    const customerPaths = ['/customer'];
    const doctorPaths = ['/doctor'];

    // Check if user has access to the requested path
    if (
      (adminPaths.some(p => path.startsWith(p)) && token?.role !== 'admin') ||
      (supplierPaths.some(p => path.startsWith(p)) && token?.role !== 'supplier') ||
      (customerPaths.some(p => path.startsWith(p)) && token?.role !== 'customer') ||
      (doctorPaths.some(p => path.startsWith(p)) && token?.role !== 'doctor')
    ) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/admin/:path*',
    '/supplier/:path*',
    '/customer/:path*',
    '/doctor/:path*',
    '/dashboard/:path*',
  ],
};