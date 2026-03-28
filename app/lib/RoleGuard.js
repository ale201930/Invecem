"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { registrarAccion } from "./firebase"; // <--- Importamos el mensajero

export default function RoleGuard({ children, allowedRole }) {
  const [autorizado, setAutorizado] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const session = Cookies.get("user_session"); // Nombre del usuario
    const role = Cookies.get("user_role");       // Rol del usuario

    // --- LÓGICA CON AUDITORÍA ACTIVA ---
    
    if (!session) {
      // 1. Si ni siquiera hay sesión, al login directo.
      router.push("/login?error=unauthorized");
    } else if (role === "administrador" || role === allowedRole) {
      // 2. PASE VIP (Admin) o ROL CORRECTO.
      setAutorizado(true);
    } else {
      // 3. ROL EQUIVOCADO: Aquí es donde atrapamos al intruso.
      
      // Registramos el intento fallido en Firebase antes de sacarlo
      registrarAccion(
        session, 
        role, 
        `Intento de acceso denegado a ${allowedRole}`, 
        allowedRole
      );

      router.push("/login?error=unauthorized");
    }
  }, [allowedRole, router]);

  if (!autorizado) return null;

  return <>{children}</>;
}