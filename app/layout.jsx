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
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      style={{ margin: 0, padding: 0, height: '100%' }}
    >
      <body className="m-0 p-0 min-h-screen overflow-x-hidden">
        {/* Quitamos el bg-slate-50 y el flex-col que estorbaban */}
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}