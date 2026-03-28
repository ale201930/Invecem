"use client";

import RoleGuard from "../lib/RoleGuard"; // Asegúrate de usar la ruta que te funcionó en Admin

export default function InspectorLayout({ children }) {
  return (
    <RoleGuard allowedRole="inspector">
      {children}
    </RoleGuard>
  );
}