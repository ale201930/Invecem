"use client";
import RoleGuard from "../lib/RoleGuard";

export default function AdminLayout({ children }) {
  return (
    <RoleGuard allowedRole="administrador">
      {children}
    </RoleGuard>
  );
}