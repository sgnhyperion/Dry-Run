// // middleware.ts
// import { NextResponse } from 'next/server'
// import type { NextRequest } from 'next/server'

// export function middleware(request: NextRequest) {
//   const pathname = request.nextUrl.pathname
//   const response = NextResponse.next()

//   // Relax headers for auth routes
//   if (pathname.startsWith('/auth') || 
//      pathname.startsWith('/login') ||
//      pathname.startsWith('/api/auth')) {
//     response.headers.set('Cross-Origin-Opener-Policy', 'unsafe-none')
//     response.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none')
//   }
  
//   // Don't set strict headers for worker routes - let Nginx handle them
//   // This prevents conflicts between middleware and Nginx

//   return response
// }

// export const config = {
//   matcher: [
//     '/auth/:path*',
//     '/login/:path*',
//     '/api/auth/:path*'
//   ]
// }




// middleware.ts (can be empty or delete the file)
export default function middleware() {}


// no need of middleware when nginx