import { NextResponse } from 'next/server';

export function middleware(request) {
  const path = request.nextUrl.pathname;
  
  // 1. Definimos rutas públicas
  const isPublicPath = path === '/login' || path === '/';

  // 2. Obtenemos las cookies
  const token = request.cookies.get('user_session')?.value;
  const userRole = request.cookies.get('user_role')?.value;

  // 3. Lógica de redirección
  
  // A. Si intenta entrar a un módulo sin estar logueado -> Al Login con mensaje de error
  if (!isPublicPath && !token) {
    // Añadimos el parámetro ?error=unauthorized para avisar al Login
    return NextResponse.redirect(new URL('/login?error=unauthorized', request.nextUrl));
  }

  // B. Si ya está logueado e intenta ir al Login -> Al panel que le corresponde
  if (isPublicPath && token) {
    const rutas = {
      administrador: "/administrador",
      inspector: "/inspector",
      "recursos humanos": "/recursos-humanos",
      "proteccion fisica": "/proteccion-fisica"
    };
    
    // Si el rol existe en el objeto, lo manda a su ruta, si no, por defecto a inspector
    const destino = rutas[userRole] || '/inspector';
    return NextResponse.redirect(new URL(destino, request.nextUrl));
  }

  return NextResponse.next();
}

// 4. Configuración de qué rutas vigilar
export const config = {
  matcher: [
    '/',
    '/login',
    '/inspector/:path*',
    '/recursos-humanos/:path*',
    '/administrador/:path*',
    '/proteccion-fisica/:path*',
    '/registro-asistencia/:path*', 
  ],
};