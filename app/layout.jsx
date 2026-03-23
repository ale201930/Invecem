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

// CRÍTICO: Esto le dice a los celulares que no hagan zoom out automático
export const viewport = {
  width: "device-width",
  initialScale: 1,
};


export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-900 overflow-x-hidden">
        {/* Este main asegura que el contenido nunca se desborde */}
        <main className="w-full h-full flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}