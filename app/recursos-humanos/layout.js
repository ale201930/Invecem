"use client";
import RoleGuard from "../lib/RoleGuard";

export default function RRHHLayout({ children }) {
  return (
    <RoleGuard allowedRole="recursos humanos">
      {children}
    </RoleGuard>
  );
}