"use client";
import RoleGuard from "../lib/RoleGuard";

export default function ProteccionLayout({ children }) {
  return (
    <RoleGuard allowedRole="proteccion fisica">
      {children}
    </RoleGuard>
  );
}