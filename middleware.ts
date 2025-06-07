
import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to home page, auth pages, and public assets without token
        if (req.nextUrl.pathname === '/' ||
            req.nextUrl.pathname.startsWith('/login') || 
            req.nextUrl.pathname.startsWith('/register') ||
            req.nextUrl.pathname.startsWith('/api/auth') ||
            req.nextUrl.pathname.startsWith('/_next') ||
            req.nextUrl.pathname.includes('.')) {
          return true;
        }
        
        // Require token for all other protected routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icon-.*\\.png).*)',
  ],
};
