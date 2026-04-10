import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Invecem - Gestión de Asistencia",
  description: "Sistema interno de control de personal",
};

// Esto es vital para el responsive en celulares
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Evita que el usuario haga zoom por error y rompa el diseño
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="m-0 p-0 min-h-screen bg-gray-50 text-gray-900 overflow-x-hidden selection:bg-blue-100">
        {/* El div 'flex flex-col' asegura que si tienes un Navbar arriba, 
            el contenido de abajo ocupe el resto y permita el scroll natural.
        */}
        <div className="flex flex-col min-h-screen">
          <main className="flex-grow w-full">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}